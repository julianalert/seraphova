import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { generateAndSendReading } from '@/lib/pipeline/generateAndSendReading';

// Stripe requires the raw body for signature verification — disable body parsing
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  if (!sig) {
    return new NextResponse('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return new NextResponse('Webhook signature invalid', { status: 400 });
  }

  // ─── checkout.session.completed (Stripe Checkout flow) ─────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error('[webhook] checkout.session.completed missing orderId metadata');
      return new NextResponse('ok', { status: 200 });
    }

    if (session.payment_status !== 'paid') {
      // e.g. bank-transfer sessions — wait for payment_intent.succeeded instead
      return new NextResponse('ok', { status: 200 });
    }

    const today     = new Date();
    const accessEnd = new Date(today);
    accessEnd.setDate(accessEnd.getDate() + 365);

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status:                   'paid',
        stripe_payment_intent_id: session.payment_intent as string | null,
        amount_paid:              session.amount_total,
        paid_at:                  today.toISOString(),
        access_start:             today.toISOString().split('T')[0],
        access_end:               accessEnd.toISOString().split('T')[0],
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[webhook] Failed to mark order paid:', updateError);
      return new NextResponse('ok', { status: 200 });
    }

    const readingDate = today.toISOString().split('T')[0];
    generateAndSendReading(orderId, readingDate).catch(err => {
      console.error(`[webhook] generateAndSendReading failed for order ${orderId}:`, err);
    });
  }

  // ─── payment_intent.succeeded (renewal flow via direct PaymentIntent) ────────
  if (event.type === 'payment_intent.succeeded') {
    const intent  = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    const isRenewal = intent.metadata?.type === 'renewal';

    // Only handle renewals here — initial purchases are handled above via
    // checkout.session.completed to avoid double-triggering
    if (!orderId || !isRenewal) {
      return new NextResponse('ok', { status: 200 });
    }

    const today     = new Date();
    const accessEnd = new Date(today);
    accessEnd.setDate(accessEnd.getDate() + 365);

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status:                   'paid',
        stripe_payment_intent_id: intent.id,
        stripe_charge_id:         intent.latest_charge as string | null,
        amount_paid:              intent.amount,
        paid_at:                  today.toISOString(),
        access_start:             today.toISOString().split('T')[0],
        access_end:               accessEnd.toISOString().split('T')[0],
        total_sent:               0,
        renewal_email_sent:       false,
        expiry_email_sent:        false,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[webhook] Failed to mark renewal paid:', updateError);
      return new NextResponse('ok', { status: 200 });
    }

    const readingDate = today.toISOString().split('T')[0];
    generateAndSendReading(orderId, readingDate).catch(err => {
      console.error(`[webhook] generateAndSendReading failed for renewal ${orderId}:`, err);
    });
  }

  return new NextResponse('ok', { status: 200 });
}
