import type { Order, ReadingJSON } from '@/types';

export function buildReadingEmailHTML(
  order:   Order,
  reading: ReadingJSON,
  date:    string
): string {
  const tagsHTML = reading.tags
    .map(tag => `
      <span style="display:inline-block;padding:4px 12px;border-radius:100px;
        border:1px solid rgba(201,168,76,0.3);color:#c4b8e8;
        background:rgba(155,142,196,0.1);font-size:12px;font-weight:500;
        margin:0 4px 6px 0;">${tag}</span>
    `).join('');

  const bodyParagraphs = reading.body
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;color:rgba(232,228,218,0.7);
      font-size:15px;line-height:1.8;">${p}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${reading.dominant_theme} · ${date}</title>
</head>
<body style="margin:0;padding:0;background:#08090f;font-family:'DM Sans',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background:#08090f;padding:40px 20px;">
<tr><td align="center">

  <!-- Logo above card -->
  <div style="margin-bottom:24px;font-family:Georgia,serif;font-size:22px;
    font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:#c9a84c;">
    ✦ Seraphova
  </div>

  <!-- Card container -->
  <table width="560" cellpadding="0" cellspacing="0" border="0"
    style="max-width:560px;width:100%;background:#161929;border-radius:16px;
           border:1px solid rgba(255,255,255,0.1);overflow:hidden;">

    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(150deg,#0e1120,#12162a);
        padding:28px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;
          color:rgba(232,228,218,0.3);">${date}</div>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:28px 32px 24px;">

        <!-- Greeting -->
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:300;
          color:#e8e4da;margin-bottom:18px;">${reading.greeting}</div>

        <!-- Body paragraphs -->
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
        <div style="margin-top:16px;">${tagsHTML}</div>

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
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://seraphova.com'}"
            style="color:rgba(232,228,218,0.25);text-decoration:underline;">
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
