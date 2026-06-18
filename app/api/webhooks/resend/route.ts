import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Resend sends webhook events with a `svix-signature` header.
 * For simplicity we authenticate via a shared secret in the Authorization header.
 * In the Resend dashboard → Webhooks, set the signing key and update RESEND_WEBHOOK_SECRET.
 */

interface ResendWebhookEvent {
  type:  string;
  data?: {
    email_id?: string;
    to?:       string[];
    from?:     string;
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers.get('Authorization');
    if (auth !== `Bearer ${secret}`) {
      logger.warn({ msg: 'Resend webhook: unauthorized request' });
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  let event: ResendWebhookEvent;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  logger.info({ msg: 'Resend webhook received', type: event.type });

  const emailTo = event.data?.to?.[0];

  if (!emailTo) {
    return NextResponse.json({ ok: true });
  }

  switch (event.type) {
    // Hard bounces — stop sending to this address
    case 'email.bounced': {
      logger.warn({ msg: 'Email bounced — marking order as bounced', email: emailTo });
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'bounced' })
        .eq('email', emailTo)
        .eq('status', 'paid');
      if (error) {
        logger.error({ msg: 'Failed to mark order as bounced', email: emailTo, error: error.message });
      }
      break;
    }

    // Spam complaints — stop sending to this address
    case 'email.complained': {
      logger.warn({ msg: 'Spam complaint — marking order as unsubscribed', email: emailTo });
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'unsubscribed' })
        .eq('email', emailTo)
        .eq('status', 'paid');
      if (error) {
        logger.error({ msg: 'Failed to mark order as unsubscribed', email: emailTo, error: error.message });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
