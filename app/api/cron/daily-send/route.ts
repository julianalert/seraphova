import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrComputeTransits } from '@/lib/astrology/transits';
import { generateAndSendReading } from '@/lib/pipeline/generateAndSendReading';
import { logger } from '@/lib/logger';

// Allow up to 5 minutes for large batches
export const maxDuration = 300;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  // ─── Auth check ──────────────────────────────────────────────────────────
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // ─── Get or compute today's transits once for the whole batch ────────────
  let transits;
  try {
    transits = await getOrComputeTransits(today);
  } catch (err) {
    logger.error({ msg: 'daily-send: transit computation failed', date: today, error: String(err) });
    return NextResponse.json({ error: 'Transit computation failed' }, { status: 500 });
  }

  // ─── Fetch all active paid subscribers ───────────────────────────────────
  const { data: orders, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, total_sent')
    .eq('status', 'paid')          // skip bounced / unsubscribed / expired
    .lte('access_start', today)
    .gte('access_end', today);

  if (fetchError) {
    logger.error({ msg: 'daily-send: failed to fetch orders', date: today, error: fetchError.message });
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const order of orders ?? []) {
    // Skip if already sent today
    const { data: existing } = await supabaseAdmin
      .from('daily_readings')
      .select('id')
      .eq('order_id', order.id)
      .eq('reading_date', today)
      .maybeSingle();

    if (existing) {
      results.skipped++;
      continue;
    }

    try {
      await generateAndSendReading(order.id, today, transits);
      results.sent++;
    } catch (err) {
      logger.error({ msg: 'daily-send: pipeline failed', orderId: order.id, date: today, error: String(err) });
      results.failed++;
    }

    // Rate limit — 1 generation per 200ms to avoid Claude API burst
    await sleep(200);
  }

  logger.info({ msg: 'daily-send complete', date: today, ...results });

  return NextResponse.json({ today, ...results });
}
