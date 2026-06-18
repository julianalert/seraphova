import type { Order, ReadingJSON } from '@/types';

export function buildWelcomeEmailHTML(
  order:   Order,
  reading: ReadingJSON,
  date:    string
): string {
  const bodyParagraphs = reading.body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;color:rgba(232,228,218,0.7);
      font-size:15px;line-height:1.8;">${p}</p>`)
    .join('');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://seraphova.com';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08090f;font-family:'DM Sans',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background:#08090f;padding:40px 20px;">
<tr><td align="center">

  <table width="560" cellpadding="0" cellspacing="0" border="0"
    style="max-width:560px;width:100%;background:#161929;border-radius:16px;
           border:1px solid rgba(255,255,255,0.1);overflow:hidden;">

    <!-- Welcome header -->
    <tr>
      <td style="background:linear-gradient(150deg,#0e1120,#12162a);
        padding:32px 32px 28px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:10px;font-weight:500;letter-spacing:0.2em;
          text-transform:uppercase;color:#c9a84c;margin-bottom:12px;">
          ✦ Seraphova · Welcome
        </div>
        <div style="font-family:Georgia,serif;font-size:24px;font-weight:300;
          color:#e8e4da;line-height:1.3;">
          Your chart is ready, ${order.first_name}.<br>
          <span style="color:#e8c97a;font-style:italic;">First reading inside.</span>
        </div>
      </td>
    </tr>

    <!-- Onboarding note -->
    <tr>
      <td style="padding:24px 32px 0;">
        <p style="margin:0 0 12px;color:rgba(232,228,218,0.6);font-size:14px;line-height:1.7;">
          Every morning from now on, a reading written from your actual natal chart will land
          in this inbox — built from your planetary placements and that day's specific transits.
          Not your sun sign. Your chart.
        </p>
        <p style="margin:0 0 24px;color:rgba(232,228,218,0.6);font-size:14px;line-height:1.7;">
          Here's today's reading to get you started:
        </p>
        <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:24px;"></div>
      </td>
    </tr>

    <!-- Today's reading -->
    <tr>
      <td style="padding:0 32px 24px;">
        <div style="font-size:10px;font-weight:500;letter-spacing:0.18em;
          text-transform:uppercase;color:#c9a84c;margin-bottom:16px;">${date}</div>

        <div style="font-family:Georgia,serif;font-size:22px;font-weight:300;
          color:#e8e4da;margin-bottom:18px;">${reading.greeting}</div>

        ${bodyParagraphs}

        <!-- Key insight -->
        <div style="background:rgba(201,168,76,0.07);border-left:3px solid #c9a84c;
          border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0;">
          <div style="font-size:10px;font-weight:500;letter-spacing:0.16em;
            text-transform:uppercase;color:#c9a84c;margin-bottom:6px;">
            Today's key insight
          </div>
          <div style="font-family:Georgia,serif;font-size:17px;font-style:italic;
            color:#e8e4da;line-height:1.55;">${reading.key_insight}</div>
        </div>

        <!-- Tags -->
        <div style="margin-top:16px;">
          ${reading.tags.map(tag => `
            <span style="display:inline-block;padding:4px 12px;border-radius:100px;
              border:1px solid rgba(201,168,76,0.3);color:#c4b8e8;
              background:rgba(155,142,196,0.1);font-size:12px;font-weight:500;
              margin:0 4px 6px 0;">${tag}</span>
          `).join('')}
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:11px;color:rgba(232,228,218,0.25);line-height:1.6;">
          Based on your natal chart — not your sun sign.<br>
          <a href="{{unsubscribe_url}}" style="color:rgba(232,228,218,0.25);text-decoration:underline;">
            Cancel your subscription
          </a>
          &nbsp;·&nbsp;
          <a href="${appUrl}" style="color:rgba(232,228,218,0.25);text-decoration:underline;">
            seraphova.com
          </a>
        </div>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`.trim();
}
