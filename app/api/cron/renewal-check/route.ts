import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendRenewalEmail } from '@/lib/email/sendRenewalEmail';
import { sendExpiryEmail } from '@/lib/email/sendExpiryEmail';
import type { Order } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // ─── Auth check ──────────────────────────────────────────────────────────
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const today     = new Date();
  const in10Days  = new Date(today); in10Days.setDate(in10Days.getDate() + 10);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const tenDaysOut = in10Days.toISOString().split('T')[0];
  const oneDayAgo  = yesterday.toISOString().split('T')[0];

  const results = { renewal_sent: 0, expiry_sent: 0, failed: 0 };

  // ─── Renewal offers — users expiring in exactly 10 days ──────────────────
  const { data: expiring } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('status', 'paid')
    .eq('access_end', tenDaysOut)
    .eq('renewal_email_sent', false);

  for (const order of (expiring ?? []) as Order[]) {
    try {
      await sendRenewalEmail(order);
      await supabaseAdmin
        .from('orders')
        .update({ renewal_email_sent: true })
        .eq('id', order.id);
      results.renewal_sent++;
    } catch (err) {
      console.error(`[renewal-check] Renewal email failed for order ${order.id}:`, err);
      results.failed++;
    }
  }

  // ─── Expiry notices — users whose access ended yesterday ─────────────────
  const { data: expired } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('status', 'paid')
    .eq('access_end', oneDayAgo)
    .eq('expiry_email_sent', false);

  for (const order of (expired ?? []) as Order[]) {
    try {
      await sendExpiryEmail(order);
      await supabaseAdmin
        .from('orders')
        .update({
          status:            'expired',
          expiry_email_sent: true,
        })
        .eq('id', order.id);
      results.expiry_sent++;
    } catch (err) {
      console.error(`[renewal-check] Expiry email failed for order ${order.id}:`, err);
      results.failed++;
    }
  }

  console.log(`[renewal-check] renewal_sent=${results.renewal_sent} expiry_sent=${results.expiry_sent} failed=${results.failed}`);

  return NextResponse.json({ ok: true, ...results });
}
