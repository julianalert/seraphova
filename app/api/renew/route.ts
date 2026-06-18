import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getOrder } from '@/lib/orders';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId.' }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Create a new Payment Intent on the same order row (not a new order)
    const intent = await stripe.paymentIntents.create({
      amount:        4700,
      currency:      'usd',
      metadata:      { orderId, type: 'renewal' },
      receipt_email: order.email,
      description:   'Seraphova — Daily Personalized Horoscope renewal (365 readings)',
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('[renew] Error:', err);
    return NextResponse.json({ error: 'Failed to create renewal payment intent.' }, { status: 500 });
  }
}
