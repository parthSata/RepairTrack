import { toFileTitle } from '@/lib/print'
import type { Invoice, InvoiceItem } from './queries'

export function invoiceLineTotal(item: InvoiceItem): number {
  return item.quantity * item.unitPrice
}

/** "Customer Name - INV-000012 - Ticket 4829301756"; shared by Print and Download PDF so both suggest the same name. */
export function invoiceFileTitle(
  invoice: Pick<Invoice, 'invoiceNumber' | 'ticketNumber' | 'customer'>,
): string {
  return toFileTitle([
    invoice.customer.name,
    invoice.invoiceNumber,
    `Ticket ${invoice.ticketNumber}`,
  ])
}
