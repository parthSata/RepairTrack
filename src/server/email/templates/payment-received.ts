import { PAYMENT_METHOD_LABELS } from '@/features/payments/schemas'
import { formatDate } from '@/lib/format-date'
import { formatRupees } from '@/lib/format-money'
import {
  amountBand,
  closingNote,
  ctaWithFallback,
  detailsCard,
  greeting,
  heading,
  optionalDetailRows,
  statusPill,
  ticketHighlight,
} from '@/server/email/components'
import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'
import { buildTrackingUrl } from '@/server/services/email.service'

/** Amounts in integer paise. `totalPaid` includes this payment. */
export type PaymentReceivedEmailData = {
  shopName: string
  customerName: string
  ticketNumber: string
  payment: {
    amount: number
    method: keyof typeof PAYMENT_METHOD_LABELS
    reference: string | null
    paidAt: Date
  }
  billTotal: number
  totalPaid: number
  trackingToken: string | null
}

export function buildPaymentReceivedEmail(data: PaymentReceivedEmailData): { subject: string; html: string } {
  const { payment } = data
  const safeShopName = escapeHtml(data.shopName)
  const balance = Math.max(data.billTotal - data.totalPaid, 0)
  const isComplete = balance === 0
  const totalPaidNote = `Total paid: <strong>${formatRupees(data.totalPaid)}</strong>`

  const paymentRows = optionalDetailRows([
    ['Amount:', formatRupees(payment.amount)],
    ['Method:', PAYMENT_METHOD_LABELS[payment.method]],
    ['UTR:', payment.method === 'UPI' ? payment.reference : null],
    ['Date:', formatDate(payment.paidAt.toISOString(), 'long')],
  ])

  const html = renderEmailLayout({
    shopName: data.shopName,
    title: `Payment received - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${statusPill('Payment received', isComplete ? 'green' : 'blue')}
              ${heading(isComplete ? 'Payment complete &mdash; thank you!' : 'Payment received')}
              ${greeting(data.customerName)}
              <p style="margin:0;color:#475569;"><strong>${safeShopName}</strong> has received your payment. ${isComplete ? 'Your bill is now settled, so there is nothing more to pay.' : 'The remaining balance is shown below.'}</p>
              ${ticketHighlight(data.ticketNumber)}
              ${detailsCard(paymentRows, 'Payment')}
              ${
                isComplete
                  ? amountBand('Amount paid', formatRupees(payment.amount), 'green', `${totalPaidNote} &middot; Balance due: <strong>${formatRupees(0)}</strong>`)
                  : amountBand('Balance due', formatRupees(balance), 'amber', totalPaidNote)
              }
              ${data.trackingToken ? ctaWithFallback('View repair status', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Keep this email as your payment receipt. Reply to reach ${safeShopName}.`)}`,
  })

  const subjectLabel = isComplete ? 'Payment complete' : 'Payment received'
  return { subject: `${data.shopName}: ${subjectLabel}, Ticket #${data.ticketNumber}`, html }
}
