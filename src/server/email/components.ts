import { escapeHtml } from '@/server/email/escape-html'

// Building blocks for email bodies. Labels and text arguments are inserted as-is: callers escape
// user values. URLs, ticket numbers and `textBlock` text are escaped here because callers pass them raw.

export const DETAIL_VALUE_STYLE = 'font-size:14px;font-weight:600;color:#0f172a;'

export function heading(text: string) {
  return `<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">${text}</h1>`
}

export function ctaButton(label: string, url: string) {
  const href = escapeHtml(url)
  return `
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#2563eb;">
                    <a href="${href}" style="font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;background-color:#2563eb;">${label} &rarr;</a>
                  </td>
                </tr>
              </table>`
}

export function linkFallback(intro: string, url: string) {
  const href = escapeHtml(url)
  return `
              <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">${intro}</p>
              <p style="margin:0 0 24px 0;font-size:12px;word-break:break-all;color:#2563eb;"><a href="${href}" style="color:#2563eb;text-decoration:underline;">${href}</a></p>`
}

export function ctaWithFallback(label: string, url: string) {
  return `
              ${ctaButton(label, url)}
              ${linkFallback("If the button doesn't work, open this link:", url)}`
}

export function ticketHighlight(ticketNumber: string) {
  return `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin:24px 0;">
                <tr>
                  <td align="center" style="padding:18px 20px;">
                    <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#2563eb;">Ticket number</p>
                    <p style="margin:0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:26px;font-weight:700;letter-spacing:3px;color:#0f172a;">#${escapeHtml(ticketNumber)}</p>
                  </td>
                </tr>
              </table>`
}

/** Labelled quote of free text: escaped first, then line breaks kept as `<br>`. Empty text renders nothing. */
export function textBlock(label: string, text: string | null) {
  const trimmed = text?.trim()
  if (!trimmed) return ''
  return `
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#64748b;">${label}</p>
              <p style="margin:0 0 8px 0;padding:14px 16px;background-color:#f8fafc;border-left:3px solid #2563eb;border-radius:6px;font-size:14px;color:#334155;">${escapeHtml(trimmed).replace(/\r?\n/g, '<br>')}</p>`
}

export function closingNote(text: string) {
  return `
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
              <p style="margin:0;font-size:13px;color:#94a3b8;">${text}</p>`
}

export function detailRow(label: string, value: string, valueStyle: string, isLast = false) {
  const spacing = isLast ? '' : 'padding-bottom:6px;'
  return `
                <tr>
                  <td style="font-size:13px;color:#64748b;${spacing}">${label}</td>
                  <td align="right" style="${valueStyle}${spacing}">${value}</td>
                </tr>`
}

export function detailsCard(rows: string[]) {
  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;">
                ${rows.join('\n                ')}
              </table>`
}
