import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders';
import { getOrComputeTransits } from '@/lib/astrology/transits';
import { generateDailyReading } from '@/lib/ai/generateReading';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// 20 preview requests per IP per hour (one per order + retries)
const RATE_LIMIT = { limit: 20, windowSecs: 60 * 60 };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIp(req);
  const rl = rateLimit(`preview:${ip}`, RATE_LIMIT);

  if (!rl.allowed) {
    logger.warn({ msg: 'Rate limit hit on preview', ip });
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing order ID.' }, { status: 400 });
  }

  const order = await getOrder(id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  if (!order.natal_chart) {
    return NextResponse.json({ error: 'Natal chart not yet computed.' }, { status: 422 });
  }

  const today   = new Date().toISOString().split('T')[0];
  const transits = await getOrComputeTransits(today);

  logger.info({ msg: 'Generating preview reading', orderId: id });

  const reading = await generateDailyReading(order, transits, today);

  logger.info({ msg: 'Preview reading generated', orderId: id, theme: reading.dominant_theme });

  return NextResponse.json({
    reading,
    chart: {
      rising: order.natal_chart.rising?.label ?? null,
      moon:   order.natal_chart.moon.label,
      sun:    order.natal_chart.sun.label,
    },
    firstName: order.first_name,
  });
}
