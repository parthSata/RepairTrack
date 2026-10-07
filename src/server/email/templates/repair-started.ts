import {
  closingNote,
  ctaWithFallback,
  deviceDetailsCard,
  greeting,
  heading,
  statusPill,
  ticketHighlight,
  type EmailDevice,
} from '@/server/email/components'
import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'
import { buildTrackingUrl } from '@/server/services/email.service'

export type RepairStartedEmailData = {
  shopName: string
  customerName: string
  ticketNumber: string
  device: EmailDevice
  expectedCompletionDate: Date | null
  trackingToken: string | null
}

export function buildRepairStartedEmail(data: RepairStartedEmailData): { subject: string; html: string } {
  const safeShopName = escapeHtml(data.shopName)

  const html = renderEmailLayout({
    shopName: data.shopName,
    title: `Repair started - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${statusPill('In progress', 'blue')}
              ${heading('Work has started on your device')}
              ${greeting(data.customerName)}
              <p style="margin:0;color:#475569;">Good news: a technician at <strong>${safeShopName}</strong> is now repairing your device. We'll email you again as soon as it's ready for pickup.</p>
              ${ticketHighlight(data.ticketNumber)}
              ${deviceDetailsCard(data.device, data.expectedCompletionDate)}
              ${data.trackingToken ? ctaWithFallback('Track your repair', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Questions about your repair? Reply to this email to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shopName}: Repair started, Ticket #${data.ticketNumber}`, html }
}
