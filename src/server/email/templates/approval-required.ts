import { formatRupees } from '@/lib/format-money'
import {
  closingNote,
  ctaWithFallback,
  DETAIL_VALUE_STYLE,
  detailRow,
  deviceDetailsCard,
  greeting,
  heading,
  statusPill,
  textBlock,
  ticketHighlight,
  type EmailDevice,
} from '@/server/email/components'
import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'
import { buildTrackingUrl } from '@/server/services/email.service'

/** Amounts in integer paise, exactly as saved with the approval request. */
export type ApprovalCharges = {
  laborCharges: number
  partsCharges: number
  additionalCharges: number
  taxPercent: number
  taxAmount: number
  total: number
}

export type ApprovalRequiredEmailData = {
  shopName: string
  customerName: string
  ticketNumber: string
  device: EmailDevice
  diagnosis: string
  charges: ApprovalCharges
  trackingToken: string | null
}

const SUBJECT = 'Diagnosis complete — your approval is needed'

function chargesCard(charges: ApprovalCharges) {
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
              <p style="margin:24px 0 8px 0;font-size:13px;font-weight:600;color:#64748b;">Estimated charges</p>
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

export function buildApprovalRequiredEmail(data: ApprovalRequiredEmailData): { subject: string; html: string } {
  const safeShopName = escapeHtml(data.shopName)

  const html = renderEmailLayout({
    shopName: data.shopName,
    title: `Approval needed - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${statusPill('Action needed', 'amber')}
              ${heading(SUBJECT)}
              ${greeting(data.customerName)}
              <p style="margin:0;color:#475569;"><strong>${safeShopName}</strong> has finished inspecting your device. Please review the diagnosis and estimate below. We'll start the repair once you approve.</p>
              ${ticketHighlight(data.ticketNumber)}
              ${deviceDetailsCard(data.device)}
              ${textBlock('Diagnosis', data.diagnosis)}
              ${chargesCard(data.charges)}
              ${data.trackingToken ? ctaWithFallback('Review and approve', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Questions about this estimate? Reply to this email to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shopName}: ${SUBJECT}, Ticket #${data.ticketNumber}`, html }
}
