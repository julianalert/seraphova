import type { Order } from '@/types';

export function buildRenewalEmailHTML(order: Order): string {
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://seraphova.com';
  const renewUrl = `${appUrl}/renew?order_id=${order.id}`;

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

    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(150deg,#0e1120,#12162a);
        padding:28px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:10px;font-weight:500;letter-spacing:0.2em;
          text-transform:uppercase;color:#c9a84c;margin-bottom:8px;">
          ✦ Seraphova · Your readings end in 10 days
        </div>
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:300;
          color:#e8e4da;line-height:1.3;">
          ${order.first_name}, your daily readings<br>
          <span style="color:#e8c97a;font-style:italic;">end in 10 days.</span>
        </div>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:28px 32px 24px;">
        <p style="margin:0 0 16px;color:rgba(232,228,218,0.7);font-size:15px;line-height:1.8;">
          You've had a full year of daily readings, each one built from your natal chart and that
          morning's planetary transits. Your access ends on <strong style="color:#e8e4da;">${order.access_end}</strong>.
        </p>
        <p style="margin:0 0 24px;color:rgba(232,228,218,0.7);font-size:15px;line-height:1.8;">
          Renew for another year at the same price — $47 one-time, 365 more mornings.
        </p>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
          <tr>
            <td style="background:linear-gradient(135deg,#c9a84c,#f2d98a);
              border-radius:100px;padding:16px 36px;">
              <a href="${renewUrl}"
                style="color:#08090f;font-size:14px;font-weight:700;
                  letter-spacing:0.08em;text-transform:uppercase;
                  text-decoration:none;font-family:'DM Sans',Arial,sans-serif;">
                Renew my readings — $47 →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0;color:rgba(232,228,218,0.35);font-size:12px;line-height:1.6;">
          One-time payment. No subscription. No recurring charges.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:11px;color:rgba(232,228,218,0.25);line-height:1.6;">
          <a href="{{unsubscribe_url}}" style="color:rgba(232,228,218,0.25);text-decoration:underline;">
            Don't renew
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
