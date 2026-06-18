import { Resend } from 'resend';
import type { Order, ReadingJSON } from '@/types';
import { buildReadingEmailHTML } from './templates/reading';
import { buildWelcomeEmailHTML } from './templates/welcome';
import { formatDate } from '@/lib/astrology/format';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Seraphova <noreply@seraphova.com>';

export async function sendReadingEmail(
  order:      Order,
  reading:    ReadingJSON,
  date:       string,
  isWelcome = false
): Promise<string> {
  const dateFormatted = formatDate(date);

  const subject = isWelcome
    ? `Your chart is ready, ${order.first_name}. First reading inside.`
    : `${reading.dominant_theme} · Your reading for ${dateFormatted}`;

  const html = isWelcome
    ? buildWelcomeEmailHTML(order, reading, dateFormatted)
    : buildReadingEmailHTML(order, reading, dateFormatted);

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      order.email,
    subject,
    html,
    tags: [
      { name: 'type',     value: isWelcome ? 'welcome' : 'daily_reading' },
      { name: 'order_id', value: order.id },
    ],
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data!.id;
}
