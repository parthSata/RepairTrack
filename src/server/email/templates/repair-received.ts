import {
  closingNote,
  ctaWithFallback,
  deviceDetailsCard,
  greeting,
  heading,
  textBlock,
  ticketHighlight,
  type EmailDevice,
} from '@/server/email/components'
import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'
import { buildTrackingUrl } from '@/server/services/email.service'

export type RepairReceivedEmailData = {
  shopName: string
  logoKey?: string | null
  customerName: string
  ticketNumber: string
  device: EmailDevice
  problemDescription: string | null
  expectedCompletionDate: Date | null
  trackingToken: string | null
}

export function buildRepairReceivedEmail(data: RepairReceivedEmailData): { subject: string; html: string } {
  const safeShopName = escapeHtml(data.shopName)

  const html = renderEmailLayout({
    shopName: data.shopName,
    logoKey: data.logoKey,
    title: `Repair received - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${heading("We've received your device")}
              ${greeting(data.customerName)}
              <p style="margin:0;color:#475569;">Thanks for choosing <strong>${safeShopName}</strong>. Your repair ticket is open and our team will take it from here.</p>
              ${ticketHighlight(data.ticketNumber)}
              ${deviceDetailsCard(data.device, data.expectedCompletionDate)}
              ${textBlock('Reported problem', data.problemDescription)}
              ${data.trackingToken ? ctaWithFallback('Track your repair', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Keep this email: your ticket number lets you check the status any time. Reply to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shopName}: Repair received, Ticket #${data.ticketNumber}`, html }
}
