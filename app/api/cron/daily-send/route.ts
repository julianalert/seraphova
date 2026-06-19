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

/** Parse "UTC+5:30" → offset in fractional hours (+5.5), "UTC-3" → -3, "UTC+0" → 0 */
function parseTimezoneOffset(tz: string): number {
  const match = tz.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;
  const sign    = match[1] === '+' ? 1 : -1;
  const hours   = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours + minutes / 60);
}

/** Return the UTC hour (0–23) at which this user should receive their reading */
function deliveryUTCHour(deliveryTime: string, timezone: string): number {
  const localHour = parseInt(deliveryTime.replace('am', ''), 10); // '7am' → 7
  const offset    = parseTimezoneOffset(timezone);
  const utcHour   = ((localHour - offset) % 24 + 24) % 24;
  return Math.round(utcHour) % 24; // round for half-hour zones
}

export async function GET(req: NextRequest) {
  // ─── Auth check ──────────────────────────────────────────────────────────
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now           = new Date();
  const today         = now.toISOString().split('T')[0];
  const currentUtcHour = now.getUTCHours();

  logger.info({ msg: 'daily-send: starting batch', date: today, utcHour: currentUtcHour });

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
    .select('id, total_sent, delivery_time, timezone')
    .eq('status', 'paid')
    .lte('access_start', today)
    .gte('access_end', today);

  if (fetchError) {
    logger.error({ msg: 'daily-send: failed to fetch orders', date: today, error: fetchError.message });
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const order of orders ?? []) {
    // Skip if this user's delivery UTC hour doesn't match the current UTC hour
    const tz       = (order.timezone as string | null) ?? 'UTC+0';
    const dt       = (order.delivery_time as string | null) ?? '7am';
    const sendHour = deliveryUTCHour(dt, tz);

    if (sendHour !== currentUtcHour) {
      results.skipped++;
      continue;
    }

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
