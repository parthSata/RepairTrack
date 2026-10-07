import { formatDate } from '@/lib/format-date'
import { formatDeviceLabel } from '@/lib/format-device'
import { formatRupees } from '@/lib/format-money'
import {
  amountBand,
  chargesCard,
  closingNote,
  ctaWithFallback,
  detailsCard,
  greeting,
  heading,
  optionalDetailRows,
  statusPill,
  type EmailCharges,
  type EmailDevice,
} from '@/server/email/components'
import { escapeHtml } from '@/server/email/escape-html'
import { renderEmailLayout } from '@/server/email/layout'
import { buildTrackingUrl } from '@/server/services/email.service'

/** Amounts in integer paise, exactly as stored on the invoice. */
export type InvoiceGeneratedEmailData = {
  invoiceNumber: string
  issuedAt: Date
  ticketNumber: string
  shop: { name: string; address: string | null; phone: string | null; email: string | null }
  customer: { name: string; phone: string | null; email: string | null }
  device: EmailDevice & { serialNumber: string | null }
  items: { partName: string; quantity: number; unitPrice: number }[]
  charges: EmailCharges
  totalPaid: number
  trackingToken: string | null
}

type InvoiceItem = InvoiceGeneratedEmailData['items'][number]
type Align = 'left' | 'center' | 'right'

const PARTS_COLUMNS: [label: string, align: Align][] = [
  ['Part', 'left'],
  ['Qty', 'center'],
  ['Unit price', 'right'],
  ['Amount', 'right'],
]
const HEADER_CELL_STYLE =
  'padding:10px 8px;background-color:#eff6ff;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#1d4ed8;'
const BODY_CELL_STYLE = 'padding:10px 8px;border-top:1px solid #f1f5f9;font-size:13px;color:#0f172a;'
// Long part names wrap; numbers never split across lines.
const NAME_CELL_STYLE = `${BODY_CELL_STYLE}word-break:break-word;`
const NUMBER_CELL_STYLE = `${BODY_CELL_STYLE}white-space:nowrap;`

function cell(content: string, align: Align, style: string) {
  return `<td align="${align}" style="${style}">${content}</td>`
}

function partRow(item: InvoiceItem) {
  const values = [
    escapeHtml(item.partName),
    String(item.quantity),
    formatRupees(item.unitPrice),
    `<strong>${formatRupees(item.quantity * item.unitPrice)}</strong>`,
  ]
  const cells = PARTS_COLUMNS.map(([, align], index) =>
    cell(values[index], align, index === 0 ? NAME_CELL_STYLE : NUMBER_CELL_STYLE),
  )
  return `<tr>${cells.join('')}</tr>`
}

function partsTable(items: InvoiceItem[]) {
  const header = `<tr>${PARTS_COLUMNS.map(([label, align]) => cell(label, align, HEADER_CELL_STYLE)).join('')}</tr>`
  const body =
    items.length > 0
      ? items.map(partRow).join('\n                ')
      : `<tr><td colspan="${PARTS_COLUMNS.length}" align="center" style="${BODY_CELL_STYLE}color:#94a3b8;">No parts used</td></tr>`
  return `
              <p style="margin:24px 0 8px 0;font-size:13px;font-weight:600;color:#64748b;">Parts</p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;overflow:hidden;">
                ${header}
                ${body}
              </table>`
}

/** Shows Balance due in amber while money is owed, or Paid in green once settled. */
function paymentBand(total: number, totalPaid: number) {
  const balance = Math.max(total - totalPaid, 0)
  const paid = formatRupees(totalPaid)
  return balance > 0
    ? amountBand('Balance due', formatRupees(balance), 'amber', totalPaid > 0 ? `Paid: <strong>${paid}</strong>` : undefined)
    : amountBand('Paid', paid, 'green')
}

export function buildInvoiceGeneratedEmail(data: InvoiceGeneratedEmailData): { subject: string; html: string } {
  const safeShopName = escapeHtml(data.shop.name)
  const invoiceRows = optionalDetailRows([
    ['Invoice number:', data.invoiceNumber],
    ['Date:', formatDate(data.issuedAt.toISOString(), 'long')],
    ['Ticket:', `#${data.ticketNumber}`],
  ])
  const shopRows = optionalDetailRows([
    ['Name:', data.shop.name],
    ['Address:', data.shop.address],
    ['Phone:', data.shop.phone],
    ['Email:', data.shop.email],
  ])
  const customerRows = optionalDetailRows([
    ['Name:', data.customer.name],
    ['Phone:', data.customer.phone],
    ['Email:', data.customer.email],
  ])
  const deviceRows = optionalDetailRows([
    ['Device:', formatDeviceLabel(data.device)],
    ['Serial no.:', data.device.serialNumber],
  ])

  const html = renderEmailLayout({
    shopName: data.shop.name,
    title: `Invoice ${data.invoiceNumber} - Ticket #${data.ticketNumber}`,
    bodyHtml: `
              ${statusPill('Invoice', 'blue')}
              ${heading(`Invoice ${escapeHtml(data.invoiceNumber)}`)}
              ${greeting(data.customer.name)}
              <p style="margin:0;color:#475569;"><strong>${safeShopName}</strong> has issued an invoice for your repair. The full invoice is below; keep this email for your records.</p>
              ${detailsCard(invoiceRows, 'Invoice')}
              ${detailsCard(shopRows, 'From')}
              ${detailsCard(customerRows, 'Billed to')}
              ${detailsCard(deviceRows, 'Device')}
              ${partsTable(data.items)}
              ${chargesCard(data.charges, 'Summary')}
              ${paymentBand(data.charges.total, data.totalPaid)}
              ${data.trackingToken ? ctaWithFallback('View repair status', buildTrackingUrl(data.trackingToken)) : ''}
              ${closingNote(`Questions about this invoice? Reply to this email to reach ${safeShopName}.`)}`,
  })

  return { subject: `${data.shop.name}: Invoice ${data.invoiceNumber}, Ticket #${data.ticketNumber}`, html }
}
