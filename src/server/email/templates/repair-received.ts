import { formatDate } from '@/lib/format-date'
import { formatDeviceLabel } from '@/lib/format-device'
import { closingNote, ctaButton, detailRow, detailsCard, heading, linkFallback } from '@/server/email/components'
import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'
import { buildTrackingUrl } from '@/server/services/email.service'

export type RepairReceivedEmailData = {
  shopName: string
  customerName: string
  ticketNumber: string
  device: { brand: string; model: string | null }
  problemDescription: string | null
  expectedCompletionDate: Date | null
  trackingToken: string | null
}

const VALUE_STYLE = 'font-size:14px;font-weight:600;color:#0f172a;'

function ticketHighlight(ticketNumber: string) {
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

function problemBlock(problem: string | null) {
  const text = problem?.trim()
  if (!text) return ''
  return `
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#64748b;">Reported problem</p>
              <p style="margin:0 0 8px 0;padding:14px 16px;background-color:#f8fafc;border-left:3px solid #2563eb;border-radius:6px;font-size:14px;color:#334155;">${escapeHtml(text).replace(/\r?\n/g, '<br>')}</p>`
}

function trackingCta(trackingToken: string | null) {
  if (!trackingToken) return ''
  const url = buildTrackingUrl(trackingToken)
  return `
              ${ctaButton('Track your repair', url)}
              ${linkFallback("If the button doesn't work, open this link:", url)}`
}

export function buildRepairReceivedEmail(data: RepairReceivedEmailData): { subject: string; html: string } {
  const safeShopName = escapeHtml(data.shopName)
  const expectedBy = data.expectedCompletionDate
    ? formatDate(data.expectedCompletionDate.toISOString(), 'long')
    : null

  const rows = [detailRow('Device:', escapeHtml(formatDeviceLabel(data.device)), VALUE_STYLE, !expectedBy)]
  if (expectedBy) rows.push(detailRow('Expected by:', escapeHtml(expectedBy), VALUE_STYLE, true))

  const html = renderEmailLayout({
    shopName: data.shopName,
    title: `Repair received - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${heading("We've received your device")}
              <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(data.customerName)}</strong>,</p>
              <p style="margin:0;color:#475569;">Thanks for choosing <strong>${safeShopName}</strong>. Your repair ticket is open and our team will take it from here.</p>
              ${ticketHighlight(data.ticketNumber)}
              ${detailsCard(rows)}
              ${problemBlock(data.problemDescription)}
              ${trackingCta(data.trackingToken)}
              ${closingNote(`Keep this email: your ticket number lets you check the status any time. Reply to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shopName}: Repair received, Ticket #${data.ticketNumber}`, html }
}
