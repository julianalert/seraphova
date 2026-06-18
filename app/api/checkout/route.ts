import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';
import { getOrder } from '@/lib/orders';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// 10 checkout attempts per IP per hour
const RATE_LIMIT = { limit: 10, windowSecs: 60 * 60 };

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`checkout:${ip}`, RATE_LIMIT);

  if (!rl.allowed) {
    logger.warn({ msg: 'Rate limit hit on checkout', ip });
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const { orderId } = await req.json();

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing orderId.' }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === 'paid') {
      return NextResponse.json({ error: 'This order has already been paid.' }, { status: 409 });
    }

    const intent = await createPaymentIntent(orderId, order.email);

    logger.info({ msg: 'Payment intent created', orderId, intentId: intent.id });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    logger.error({ msg: 'Error in checkout', error: String(err) });
    return NextResponse.json({ error: 'Failed to create payment intent.' }, { status: 500 });
  }
}
