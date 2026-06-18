import { supabaseAdmin } from '@/lib/supabase';
import { getOrder } from '@/lib/orders';
import { getOrComputeTransits } from '@/lib/astrology/transits';
import { generateDailyReading } from '@/lib/ai/generateReading';
import { sendReadingEmail } from '@/lib/email/sendReadingEmail';
import { logger } from '@/lib/logger';
import type { DailyTransits } from '@/types';

export async function generateAndSendReading(
  orderId:   string,
  date:      string,
  transits?: DailyTransits
): Promise<void> {
  const order = await getOrder(orderId);

  if (!order || order.status !== 'paid') {
    logger.warn({ msg: 'Skipping pipeline — order not found or not paid', orderId });
    return;
  }

  if (!order.natal_chart) {
    logger.error({ msg: 'Order has no natal chart — skipping', orderId });
    return;
  }

  const t = transits ?? await getOrComputeTransits(date);

  // Use the cached preview reading if already generated (e.g. user visited order page)
  const { data: existing } = await supabaseAdmin
    .from('daily_readings')
    .select('id, parsed_reading')
    .eq('order_id', orderId)
    .eq('reading_date', date)
    .maybeSingle();

  let reading;
  let rowId: string;

  if (existing?.parsed_reading) {
    // Reuse the cached reading so we don't call Claude again
    reading = existing.parsed_reading;
    rowId   = existing.id;
    logger.info({ msg: 'Reusing cached preview reading for pipeline', orderId });
  } else {
    // Generate a fresh reading — throws after MAX_RETRIES
    reading = await generateDailyReading(order, t, date);

    const { data: row, error: insertError } = await supabaseAdmin
      .from('daily_readings')
      .insert({
        order_id:       orderId,
        reading_date:   date,
        raw_response:   JSON.stringify(reading),
        parsed_reading: reading,
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error({ msg: 'Failed to insert reading', orderId, error: insertError.message });
      return;
    }

    rowId = row.id;
  }

  const isWelcome = order.total_sent === 0;

  let messageId: string | null = null;
  try {
    messageId = await sendReadingEmail(order, reading, date, isWelcome);
    logger.info({ msg: 'Reading email sent', orderId, isWelcome, messageId });
  } catch (err) {
    logger.error({ msg: 'sendReadingEmail failed', orderId, error: String(err) });
  }

  await supabaseAdmin
    .from('daily_readings')
    .update({
      sent_at:           messageId ? new Date().toISOString() : null,
      resend_message_id: messageId,
    })
    .eq('id', rowId);

  await supabaseAdmin
    .from('orders')
    .update({
      total_sent:   order.total_sent + 1,
      last_sent_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}
