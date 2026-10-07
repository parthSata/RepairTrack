import { formatRupees } from '@/lib/format-money'
import {
  amountBand,
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

export type RepairCompletedEmailData = {
  shopName: string
  customerName: string
  ticketNumber: string
  device: EmailDevice
  /** Integer paise. */
  amountPaid: number
  trackingToken: string | null
}

export function buildRepairCompletedEmail(data: RepairCompletedEmailData): { subject: string; html: string } {
  const safeShopName = escapeHtml(data.shopName)

  const html = renderEmailLayout({
    shopName: data.shopName,
    title: `Repair completed - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${statusPill('Completed', 'green')}
              ${heading(`Thank you for choosing ${safeShopName}`)}
              ${greeting(data.customerName)}
              <p style="margin:0;color:#475569;">Your repair is complete and the ticket is now closed. We hope your device serves you well, and we'd be glad to help again whenever you need us.</p>
              ${ticketHighlight(data.ticketNumber)}
              ${deviceDetailsCard(data.device)}
              ${amountBand('Amount paid', formatRupees(data.amountPaid), 'green')}
              ${data.trackingToken ? ctaWithFallback('View your repair', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Keep this email for your records. Reply to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shopName}: Repair completed, Ticket #${data.ticketNumber}`, html }
}
