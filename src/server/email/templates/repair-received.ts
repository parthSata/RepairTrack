import { formatDate } from '@/lib/format-date'
import { formatDeviceLabel } from '@/lib/format-device'
import {
  closingNote,
  ctaWithFallback,
  DETAIL_VALUE_STYLE,
  detailRow,
  detailsCard,
  heading,
  textBlock,
  ticketHighlight,
} from '@/server/email/components'
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

export function buildRepairReceivedEmail(data: RepairReceivedEmailData): { subject: string; html: string } {
  const safeShopName = escapeHtml(data.shopName)
  const expectedBy = data.expectedCompletionDate
    ? formatDate(data.expectedCompletionDate.toISOString(), 'long')
    : null

  const rows = [detailRow('Device:', escapeHtml(formatDeviceLabel(data.device)), DETAIL_VALUE_STYLE, !expectedBy)]
  if (expectedBy) rows.push(detailRow('Expected by:', escapeHtml(expectedBy), DETAIL_VALUE_STYLE, true))

  const html = renderEmailLayout({
    shopName: data.shopName,
    title: `Repair received - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${heading("We've received your device")}
              <p style="margin:0 0 12px 0;">Hi <strong>${escapeHtml(data.customerName)}</strong>,</p>
              <p style="margin:0;color:#475569;">Thanks for choosing <strong>${safeShopName}</strong>. Your repair ticket is open and our team will take it from here.</p>
              ${ticketHighlight(data.ticketNumber)}
              ${detailsCard(rows)}
              ${textBlock('Reported problem', data.problemDescription)}
              ${data.trackingToken ? ctaWithFallback('Track your repair', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Keep this email: your ticket number lets you check the status any time. Reply to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shopName}: Repair received, Ticket #${data.ticketNumber}`, html }
}
