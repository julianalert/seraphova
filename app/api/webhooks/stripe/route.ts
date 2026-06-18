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

  if (event.type === 'payment_intent.succeeded') {
    const intent  = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;

    if (!orderId) {
      console.error('[webhook] payment_intent.succeeded missing orderId metadata');
      return new NextResponse('ok', { status: 200 });
    }

    const today      = new Date();
    const accessEnd  = new Date(today);
    accessEnd.setDate(accessEnd.getDate() + 365);
    const isRenewal  = intent.metadata?.type === 'renewal';

    // 1. Mark order as paid (or renewed — reset counters on renewal)
    const updatePayload = isRenewal
      ? {
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
        }
      : {
          status:                   'paid',
          stripe_payment_intent_id: intent.id,
          stripe_charge_id:         intent.latest_charge as string | null,
          amount_paid:              intent.amount,
          paid_at:                  today.toISOString(),
          access_start:             today.toISOString().split('T')[0],
          access_end:               accessEnd.toISOString().split('T')[0],
        };

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateError) {
      console.error('[webhook] Failed to mark order paid:', updateError);
      return new NextResponse('ok', { status: 200 });
    }

    // 2. Trigger Day 1 reading generation + email (async)
    const readingDate = today.toISOString().split('T')[0];
    generateAndSendReading(orderId, readingDate).catch(err => {
      console.error(`[webhook] generateAndSendReading failed for order ${orderId}:`, err);
    });
  }

  return new NextResponse('ok', { status: 200 });
}
