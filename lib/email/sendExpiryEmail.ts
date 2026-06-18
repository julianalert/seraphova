import { Resend } from 'resend';
import type { Order } from '@/types';
import { buildExpiryEmailHTML } from './templates/expiry';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = 'Seraphova <noreply@seraphova.com>';

export async function sendExpiryEmail(order: Order): Promise<string> {
  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      order.email,
    subject: `Your Seraphova readings have ended`,
    html:    buildExpiryEmailHTML(order),
    tags: [
      { name: 'type',     value: 'expiry_notice' },
      { name: 'order_id', value: order.id },
    ],
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data!.id;
}
