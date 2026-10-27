import { escapeHtml } from '@/server/email/escape-html'
import { resolveEmailLogoUrl } from '@/server/email/logo-url'

type EmailLayoutInput = {
  shopName: string
  title: string
  bodyHtml: string
  footerHtml?: string
  logoKey?: string | null
}

function defaultFooterHtml() {
  return `&copy; ${new Date().getFullYear()} RepairTrack. Repair shop operations, organized.`
}

// bodyHtml and footerHtml are inserted as-is: callers must escape their own values.
export function renderEmailLayout({
  shopName,
  title,
  bodyHtml,
  footerHtml = defaultFooterHtml(),
  logoKey,
}: EmailLayoutInput) {
  const logoUrl = resolveEmailLogoUrl(logoKey)
  const safeShopName = escapeHtml(shopName)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color:#0f172a;padding:28px 32px;text-align:left;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;background-color:#ffffff;border-radius:8px;padding:4px;">
                    <img src="${escapeHtml(logoUrl)}" alt="${safeShopName}" width="36" height="36" style="display:block;width:36px;height:36px;border-radius:4px;object-fit:contain;background-color:#ffffff;" />
                  </td>
                  <td style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;padding-left:12px;vertical-align:middle;">${safeShopName}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#334155;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
