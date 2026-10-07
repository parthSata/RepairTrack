import {
  chargesCard,
  closingNote,
  ctaWithFallback,
  deviceDetailsCard,
  greeting,
  heading,
  statusPill,
  textBlock,
  ticketHighlight,
  type EmailCharges,
  type EmailDevice,
} from '@/server/email/components'
import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'
import { buildTrackingUrl } from '@/server/services/email.service'

export type ApprovalRequiredEmailData = {
  shopName: string
  customerName: string
  ticketNumber: string
  device: EmailDevice
  diagnosis: string
  /** Exactly as saved with the approval request. */
  charges: EmailCharges
  trackingToken: string | null
}

const SUBJECT = 'Diagnosis complete — your approval is needed'

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
              ${chargesCard(data.charges, 'Estimated charges')}
              ${data.trackingToken ? ctaWithFallback('Review and approve', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Questions about this estimate? Reply to this email to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shopName}: ${SUBJECT}, Ticket #${data.ticketNumber}`, html }
}
