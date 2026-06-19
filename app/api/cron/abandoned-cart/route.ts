import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

const SEQUENCE = [
  {
    number: 1,
    delay_hours: 1,
    subject: (name: string) => `${name}, your chart is ready. Your reading isn't.`,
    preview: `You were one step away.`,
  },
  {
    number: 2,
    delay_hours: 24,
    subject: (_name: string) => `What your chart says about right now`,
    preview: `This is what we built for you.`,
  },
  {
    number: 3,
    delay_hours: 72,
    subject: (_name: string) => `This is the last time we'll reach out.`,
    preview: `Your chart disappears after this.`,
  },
];

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return runSequence();
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return runSequence();
}

async function runSequence() {
  const now = new Date();

  const { data: candidates } = await supabaseAdmin
    .from('orders')
    .select('id, first_name, email, created_at, abandoned_emails_sent')
    .eq('status', 'pending')
    .not('email', 'is', null)
    .lt('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString());

  if (!candidates?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const order of candidates) {
    const hoursSince =
      (now.getTime() - new Date(order.created_at).getTime()) / 3_600_000;
    const alreadySent: number[] = order.abandoned_emails_sent ?? [];

    for (const step of SEQUENCE) {
      if (alreadySent.includes(step.number)) continue;
      if (hoursSince < step.delay_hours) continue;

      // Enforce strict sequential order — never skip ahead
      const nextExpected = Math.max(...alreadySent, 0) + 1;
      if (step.number !== nextExpected) continue;

      const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order?order_id=${order.id}`;
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?order_id=${Buffer.from(order.id).toString('base64')}`;

      try {
        await resend.emails.send({
          from:    'Seraphova <reading@seraphova.com>',
          to:      order.email,
          subject: step.subject(order.first_name),
          html:    buildEmailHTML(step.number, order.first_name, checkoutUrl, unsubscribeUrl),
          tags: [
            { name: 'type',     value: 'abandoned_cart' },
            { name: 'sequence', value: String(step.number) },
            { name: 'order_id', value: order.id },
          ],
        });

        await supabaseAdmin
          .from('orders')
          .update({ abandoned_emails_sent: [...alreadySent, step.number] })
          .eq('id', order.id);

        sent++;
      } catch (err) {
        console.error(`[abandoned-cart] Email ${step.number} failed for order ${order.id}:`, err);
      }

      break; // One email per order per cron run
    }
  }

  // Mark orders still pending 4+ days after creation as abandoned
  // and null out their natal chart (honouring the Email 3 promise)
  await supabaseAdmin
    .from('orders')
    .update({ natal_chart: null, status: 'abandoned' })
    .eq('status', 'pending')
    .lt('created_at', new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString());

  console.log(`[abandoned-cart] sent=${sent}`);
  return NextResponse.json({ ok: true, sent });
}

function buildEmailHTML(
  number: number,
  firstName: string,
  checkoutUrl: string,
  unsubscribeUrl: string,
): string {
  const templates: Record<number, string> = { 1: EMAIL_1, 2: EMAIL_2, 3: EMAIL_3 };
  return templates[number]
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{checkout_url\}\}/g, checkoutUrl)
    .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl);
}

// ─── Email templates ──────────────────────────────────────────────────────────

const EMAIL_1 = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08090f;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08090f;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0"
  style="max-width:560px;background:#161929;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">

  <tr>
    <td style="background:linear-gradient(150deg,#0e1120,#12162a);padding:28px 32px 24px;
      border-bottom:1px solid rgba(255,255,255,0.07);">
      <div style="font-size:10px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;
        color:#c9a84c;">✦ Seraphova</div>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 28px;">

      <div style="font-family:Georgia,serif;font-size:22px;font-weight:300;color:#e8e4da;
        margin-bottom:20px;line-height:1.3;">
        Hi {{first_name}},
      </div>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 16px;">
        You filled in your birth details. You told us what's on your mind.
        We built your natal chart.
      </p>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 24px;">
        Your first personalized reading is sitting on the other side of one last step.
      </p>

      <div style="background:rgba(201,168,76,0.07);border-left:3px solid #c9a84c;
        border-radius:0 8px 8px 0;padding:16px 18px;margin:0 0 24px;">
        <div style="font-size:10px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;
          color:#c9a84c;margin-bottom:8px;">What's waiting for you</div>
        <p style="font-family:Georgia,serif;font-size:16px;font-style:italic;color:#e8e4da;
          line-height:1.6;margin:0;">
          A daily horoscope written from your full natal chart — not your sun sign —
          landing in your inbox every morning before your day starts.
        </p>
      </div>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 28px;">
        Your chart is already computed. Your answers are saved.
        You don't need to fill anything in again.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center">
            <a href="{{checkout_url}}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f2d98a);
              color:#08090f;font-weight:700;font-size:14px;letter-spacing:0.08em;
              text-transform:uppercase;text-decoration:none;padding:18px 40px;
              border-radius:100px;">
              Complete my order — $47 →
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:rgba(232,228,218,0.3);text-align:center;
        margin:16px 0 0;line-height:1.6;">
        One payment. 365 daily readings. No subscription.
      </p>

    </td>
  </tr>

  <tr>
    <td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.07);">
      <p style="font-size:11px;color:rgba(232,228,218,0.25);margin:0;line-height:1.6;">
        You're receiving this because you started a Seraphova reading.
        <a href="{{unsubscribe_url}}" style="color:rgba(232,228,218,0.25);">Unsubscribe</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

const EMAIL_2 = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08090f;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08090f;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0"
  style="max-width:560px;background:#161929;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">

  <tr>
    <td style="background:linear-gradient(150deg,#0e1120,#12162a);padding:28px 32px 24px;
      border-bottom:1px solid rgba(255,255,255,0.07);">
      <div style="font-size:10px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;
        color:#c9a84c;">✦ Seraphova</div>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 28px;">

      <div style="font-family:Georgia,serif;font-size:22px;font-weight:300;color:#e8e4da;
        margin-bottom:20px;line-height:1.3;">
        Hi {{first_name}},
      </div>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 16px;">
        We're guessing you weren't sure if a daily horoscope email
        could actually feel personal.
      </p>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 24px;">
        That's the right thing to wonder. Most of them aren't.
        Generic sun sign content written for 700 million people
        at once isn't personal — it's just vague enough to feel relevant.
      </p>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 24px;">
        Seraphova is built differently. Every reading starts from
        your complete natal chart — every planet, every house, every placement —
        and maps it against what the sky is actually doing that day.
        Here's what that looks like in practice:
      </p>

      <div style="background:#1a1e30;border:1px solid rgba(255,255,255,0.1);
        border-radius:12px;overflow:hidden;margin:0 0 24px;">

        <div style="background:#0e1120;padding:14px 20px;
          border-bottom:1px solid rgba(255,255,255,0.07);">
          <span style="font-size:10px;font-weight:500;letter-spacing:0.16em;
            text-transform:uppercase;color:#c9a84c;">Sample reading · Not your sun sign</span>
        </div>

        <div style="padding:22px 22px 18px;">
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:300;
            color:#e8e4da;margin-bottom:14px;">Good morning, Sofia.</div>

          <p style="font-size:14px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 14px;">
            Venus stations direct today in your <strong style="color:#e8e4da;">7th house of
            relationships</strong>, opposing your natal Saturn in Capricorn. For you
            specifically — Scorpio rising, Libra moon — this isn't a collective
            "relationship energy" moment. This is the day that unresolved conversation
            you've been circling finally becomes speakable.
          </p>

          <div style="background:rgba(201,168,76,0.07);border-left:3px solid #c9a84c;
            border-radius:0 6px 6px 0;padding:12px 14px;margin:0 0 14px;">
            <div style="font-size:10px;font-weight:500;letter-spacing:0.14em;
              text-transform:uppercase;color:#c9a84c;margin-bottom:6px;">Today's key insight</div>
            <div style="font-family:Georgia,serif;font-size:15px;font-style:italic;
              color:#e8e4da;line-height:1.55;">
              "The hesitation you feel isn't fear. It's your Scorpio rising
              protecting what it can't yet see is already safe."
            </div>
          </div>

          <div>
            <span style="display:inline-block;padding:4px 10px;border-radius:100px;
              border:1px solid rgba(201,168,76,0.3);color:#c4b8e8;
              background:rgba(155,142,196,0.1);font-size:11px;margin:0 4px 4px 0;">
              ♀ Venus direct
            </span>
            <span style="display:inline-block;padding:4px 10px;border-radius:100px;
              border:1px solid rgba(201,168,76,0.3);color:#c4b8e8;
              background:rgba(155,142,196,0.1);font-size:11px;margin:0 4px 4px 0;">
              7th House
            </span>
            <span style="display:inline-block;padding:4px 10px;border-radius:100px;
              border:1px solid rgba(201,168,76,0.3);color:#c4b8e8;
              background:rgba(155,142,196,0.1);font-size:11px;margin:0 4px 4px 0;">
              Scorpio Rising
            </span>
          </div>
        </div>
      </div>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 28px;">
        That's not a Scorpio horoscope. That's a reading for one specific person,
        on one specific day. Yours will be written for you.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center">
            <a href="{{checkout_url}}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f2d98a);
              color:#08090f;font-weight:700;font-size:14px;letter-spacing:0.08em;
              text-transform:uppercase;text-decoration:none;padding:18px 40px;
              border-radius:100px;">
              Start my daily reading — $47 →
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:rgba(232,228,218,0.3);text-align:center;
        margin:16px 0 0;line-height:1.6;">
        7-day money-back guarantee · No subscription · Cancel anytime
      </p>

    </td>
  </tr>

  <tr>
    <td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.07);">
      <p style="font-size:11px;color:rgba(232,228,218,0.25);margin:0;line-height:1.6;">
        You're receiving this because you started a Seraphova reading.
        <a href="{{unsubscribe_url}}" style="color:rgba(232,228,218,0.25);">Unsubscribe</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

const EMAIL_3 = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08090f;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08090f;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0"
  style="max-width:560px;background:#161929;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">

  <tr>
    <td style="background:linear-gradient(150deg,#0e1120,#12162a);padding:28px 32px 24px;
      border-bottom:1px solid rgba(255,255,255,0.07);">
      <div style="font-size:10px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;
        color:#c9a84c;">✦ Seraphova</div>
    </td>
  </tr>

  <tr>
    <td style="padding:32px 32px 28px;">

      <div style="font-family:Georgia,serif;font-size:22px;font-weight:300;color:#e8e4da;
        margin-bottom:20px;line-height:1.3;">
        Hi {{first_name}},
      </div>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 16px;">
        This is the last email we'll send you about your reading.
      </p>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 16px;">
        After today, we'll delete your chart data. If you come back,
        you'd start the quiz again from scratch.
      </p>

      <p style="font-size:15px;color:rgba(232,228,218,0.7);line-height:1.8;margin:0 0 24px;">
        If you're still not sure — here's what other women said
        after their first reading arrived:
      </p>

      <div style="border:1px solid rgba(255,255,255,0.08);border-radius:10px;
        padding:20px 20px 4px;margin:0 0 16px;background:rgba(255,255,255,0.02);">
        <p style="font-family:Georgia,serif;font-size:16px;font-style:italic;
          color:#e8e4da;line-height:1.65;margin:0 0 10px;">
          "I've used Co-Star for three years. The first Seraphova reading
          mentioned something I'd only talked about in therapy.
          That's not a sun sign horoscope. That's something else entirely."
        </p>
        <p style="font-size:12px;color:rgba(232,228,218,0.35);margin:0 0 16px;">
          — Léa M. · Capricorn Sun · Scorpio Rising
        </p>
      </div>

      <div style="border:1px solid rgba(255,255,255,0.08);border-radius:10px;
        padding:20px 20px 4px;margin:0 0 24px;background:rgba(255,255,255,0.02);">
        <p style="font-family:Georgia,serif;font-size:16px;font-style:italic;
          color:#e8e4da;line-height:1.65;margin:0 0 10px;">
          "I read it with my coffee every morning now.
          It's become the one ritual I actually keep."
        </p>
        <p style="font-size:12px;color:rgba(232,228,218,0.35);margin:0 0 16px;">
          — Amara D. · Virgo Sun · Cancer Rising
        </p>
      </div>

      <div style="background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.15);
        border-radius:10px;padding:18px 20px;margin:0 0 28px;">
        <div style="font-size:13px;font-weight:600;color:#e8e4da;margin-bottom:6px;">
          ↩ 7-day money-back guarantee
        </div>
        <p style="font-size:13px;color:rgba(232,228,218,0.6);line-height:1.6;margin:0;">
          If your first readings don't feel genuinely personal to you,
          email us within 7 days. Full refund, no questions, no hoops.
        </p>
      </div>

      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center">
            <a href="{{checkout_url}}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f2d98a);
              color:#08090f;font-weight:700;font-size:14px;letter-spacing:0.08em;
              text-transform:uppercase;text-decoration:none;padding:18px 40px;
              border-radius:100px;">
              Claim my reading before it's gone →
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:rgba(232,228,218,0.3);text-align:center;
        margin:16px 0 0;line-height:1.6;">
        $47 · One-time · 365 daily readings · No subscription ever
      </p>

    </td>
  </tr>

  <tr>
    <td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.07);">
      <p style="font-size:11px;color:rgba(232,228,218,0.25);margin:0;line-height:1.6;">
        You're receiving this because you started a Seraphova reading.
        After this email, we'll stop reaching out.
        <a href="{{unsubscribe_url}}" style="color:rgba(232,228,218,0.25);">Unsubscribe</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
