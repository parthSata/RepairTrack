import { formatBusinessHoursRows } from '@/features/shop/business-hours'
import { formatRupees } from '@/lib/format-money'
import {
  amountBand,
  closingNote,
  ctaWithFallback,
  DETAIL_VALUE_STYLE,
  detailRow,
  detailsCard,
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

export type ReadyForPickupEmailData = {
  shopName: string
  customerName: string
  ticketNumber: string
  device: EmailDevice
  shop: { address: string | null; phone: string | null; businessHours: string | null; upiId: string | null }
  /** Integer paise; 0 when nothing is owed or the bill isn't finalized. */
  balanceDue: number
  trackingToken: string | null
}

/** Rows with an empty value are dropped; the last remaining row loses its bottom spacing. */
function cardRows(entries: [label: string, value: string | null | undefined][]) {
  const filled = entries.filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
  return filled.map(([label, value], index) =>
    detailRow(label, escapeHtml(value.trim()).replace(/\r?\n/g, '<br>'), DETAIL_VALUE_STYLE, index === filled.length - 1),
  )
}

export function buildReadyForPickupEmail(data: ReadyForPickupEmailData): { subject: string; html: string } {
  const safeShopName = escapeHtml(data.shopName)
  const contactRows = cardRows([
    ['Address:', data.shop.address],
    ['Phone:', data.shop.phone],
  ])
  const hoursRows = cardRows(formatBusinessHoursRows(data.shop.businessHours).map((row) => [row.label, row.value]))
  const upiId = data.shop.upiId?.trim()
  const balanceBand =
    data.balanceDue > 0
      ? amountBand(
          'Balance due',
          formatRupees(data.balanceDue),
          'amber',
          upiId ? `Pay by UPI: <strong>${escapeHtml(upiId)}</strong>` : undefined,
        )
      : ''

  const html = renderEmailLayout({
    shopName: data.shopName,
    title: `Ready for pickup - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${statusPill('Ready for pickup', 'green')}
              ${heading('Your device is ready for pickup')}
              ${greeting(data.customerName)}
              <p style="margin:0;color:#475569;">Great news: <strong>${safeShopName}</strong> has finished working on your device. You can collect it any time during business hours.</p>
              ${ticketHighlight(data.ticketNumber)}
              ${deviceDetailsCard(data.device)}
              ${balanceBand}
              ${contactRows.length > 0 ? detailsCard(contactRows, 'Pickup details') : ''}
              ${hoursRows.length > 0 ? detailsCard(hoursRows, 'Business hours') : ''}
              ${data.trackingToken ? ctaWithFallback('View repair status', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Bring your ticket number when you collect your device. Reply to this email to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shopName}: Your device is ready for pickup, Ticket #${data.ticketNumber}`, html }
}
