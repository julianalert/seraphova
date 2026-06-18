import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders';
import { getOrComputeTransits } from '@/lib/astrology/transits';
import { generateDailyReading } from '@/lib/ai/generateReading';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

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

  const today = new Date().toISOString().split('T')[0];

  // Return cached preview reading if already generated for today
  const { data: cached } = await supabaseAdmin
    .from('daily_readings')
    .select('parsed_reading')
    .eq('order_id', id)
    .eq('reading_date', today)
    .maybeSingle();

  if (cached?.parsed_reading) {
    logger.info({ msg: 'Returning cached preview reading', orderId: id });
    return NextResponse.json({
      reading:    cached.parsed_reading,
      chart: {
        rising: order.natal_chart.rising?.label ?? null,
        moon:   order.natal_chart.moon.label,
        sun:    order.natal_chart.sun.label,
      },
      firstName: order.first_name,
    });
  }

  const transits = await getOrComputeTransits(today);

  logger.info({ msg: 'Generating preview reading', orderId: id });

  const reading = await generateDailyReading(order, transits, today);

  logger.info({ msg: 'Preview reading generated', orderId: id, theme: reading.dominant_theme });

  // Cache the reading so refreshes don't regenerate it
  await supabaseAdmin
    .from('daily_readings')
    .upsert(
      { order_id: id, reading_date: today, parsed_reading: reading },
      { onConflict: 'order_id,reading_date' }
    );

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
