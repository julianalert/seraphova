import { Resend } from 'resend';
import type { Order } from '@/types';
import { buildRenewalEmailHTML } from './templates/renewal';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = 'Seraphova <noreply@seraphova.com>';

export async function sendRenewalEmail(order: Order): Promise<string> {
  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      order.email,
    subject: `Your daily readings end in 10 days`,
    html:    buildRenewalEmailHTML(order),
    tags: [
      { name: 'type',     value: 'renewal_offer' },
      { name: 'order_id', value: order.id },
    ],
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data!.id;
}
