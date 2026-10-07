import { formatDate } from '@/lib/format-date'
import { formatDeviceLabel } from '@/lib/format-device'
import { formatRupees } from '@/lib/format-money'
import { escapeHtml } from '@/server/email/escape-html'

// Building blocks for email bodies. Labels and text arguments are inserted as-is: callers escape
// user values. URLs, ticket numbers and `textBlock` text are escaped here because callers pass them raw.

export const DETAIL_VALUE_STYLE = 'font-size:14px;font-weight:600;color:#0f172a;'

const TONES = {
  amber: { tint: '#fef3c7', wash: '#fffbeb', border: '#fde68a', text: '#b45309', deep: '#92400e' },
  blue: { tint: '#dbeafe', wash: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', deep: '#1e3a8a' },
  green: { tint: '#dcfce7', wash: '#f0fdf4', border: '#bbf7d0', text: '#15803d', deep: '#166534' },
} as const

export type EmailTone = keyof typeof TONES

export function heading(text: string) {
  return `<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">${text}</h1>`
}

export function statusPill(label: string, tone: EmailTone) {
  const { tint, border, text } = TONES[tone]
  return `<p style="margin:0 0 14px 0;"><span style="display:inline-block;padding:4px 12px;border-radius:999px;background-color:${tint};border:1px solid ${border};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${text};">&#9679; ${label}</span></p>`
}

export function greeting(customerName: string) {
  return `<p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>`
}

/** Tinted label + large amount row, with an optional footnote line under a dashed divider. */
export function amountBand(label: string, amountText: string, tone: EmailTone, footnoteHtml?: string) {
  const { wash, border, text, deep } = TONES[tone]
  const footnote = footnoteHtml
    ? `<p style="margin:12px 0 0 0;padding-top:12px;border-top:1px dashed ${border};font-size:13px;color:${deep};">${footnoteHtml}</p>`
    : ''
  return `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${wash};border:1px solid ${border};border-radius:10px;margin:20px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:14px;font-weight:700;color:${deep};">${label}</td>
                        <td align="right" style="font-size:22px;font-weight:800;color:${text};">${amountText}</td>
                      </tr>
                    </table>
                    ${footnote}
                  </td>
                </tr>
              </table>`
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

/** Rows with an empty value are dropped; values are escaped with line breaks kept; the last row loses its bottom spacing. */
export function optionalDetailRows(entries: [label: string, value: string | null | undefined][]) {
  const filled = entries.filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
  return filled.map(([label, value], index) =>
    detailRow(label, escapeHtml(value.trim()).replace(/\r?\n/g, '<br>'), DETAIL_VALUE_STYLE, index === filled.length - 1),
  )
}

export function detailsCard(rows: string[], title?: string) {
  const titleRow = title
    ? `<tr><td colspan="2" style="padding-bottom:10px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#2563eb;">${title}</td></tr>
                `
    : ''
  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;">
                ${titleRow}${rows.join('\n                ')}
              </table>`
}

/** Amounts in integer paise. */
export type EmailCharges = {
  laborCharges: number
  partsCharges: number
  additionalCharges: number
  taxPercent: number
  taxAmount: number
  total: number
}

/** Labor / Parts / Additional / GST rows, then a blue "Total (incl. GST)" band. */
export function chargesCard(charges: EmailCharges, title: string) {
  const lines: [string, number][] = [
    ['Labor', charges.laborCharges],
    ['Parts', charges.partsCharges],
    ['Additional', charges.additionalCharges],
    [`GST (${charges.taxPercent}%)`, charges.taxAmount],
  ]
  const rows = lines.map(([label, paise], index) =>
    detailRow(label, formatRupees(paise), DETAIL_VALUE_STYLE, index === lines.length - 1),
  )

  return `
              <p style="margin:24px 0 8px 0;font-size:13px;font-weight:600;color:#64748b;">${title}</p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;margin:0 0 8px 0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      ${rows.join('\n                      ')}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#eff6ff;border-top:1px solid #bfdbfe;border-radius:0 0 10px 10px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:14px;font-weight:700;color:#1e3a8a;">Total (incl. GST)</td>
                        <td align="right" style="font-size:20px;font-weight:800;color:#1d4ed8;">${formatRupees(charges.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`
}

export type EmailDevice = { brand: string; model: string | null }

/** Device row, plus "Expected by" only when a completion date is set. */
export function deviceDetailsCard(device: EmailDevice, expectedCompletionDate?: Date | null) {
  const expectedBy = expectedCompletionDate ? formatDate(expectedCompletionDate.toISOString(), 'long') : null
  const rows = [detailRow('Device:', escapeHtml(formatDeviceLabel(device)), DETAIL_VALUE_STYLE, !expectedBy)]
  if (expectedBy) rows.push(detailRow('Expected by:', escapeHtml(expectedBy), DETAIL_VALUE_STYLE, true))
  return detailsCard(rows)
}
