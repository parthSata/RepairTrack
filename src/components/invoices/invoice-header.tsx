import type { ReactNode } from 'react'
import Link from 'next/link'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status'
import type { Invoice } from '@/features/invoices/queries'
import { formatDate } from '@/lib/format-date'

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 sm:justify-end">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{children}</dd>
    </div>
  )
}

export function InvoiceHeader({ invoice }: { invoice: Invoice }) {
  const { shop } = invoice

  return (
    <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-lg font-bold text-foreground">{shop.name}</p>
        {shop.address ? (
          <p className="whitespace-pre-line wrap-break-word text-sm text-muted-foreground">
            {shop.address}
          </p>
        ) : null}
        {shop.phone ? <p className="text-sm text-muted-foreground">{shop.phone}</p> : null}
      </div>

      <div className="space-y-2 sm:text-right">
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <h1 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Invoice
          </h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <p className="font-mono text-xl font-bold text-foreground">{invoice.invoiceNumber}</p>
        <dl className="space-y-1 text-sm">
          <MetaRow label="Date">{formatDate(invoice.createdAt)}</MetaRow>
          <MetaRow label="Ticket">
            <Link
              href={`/repairs/${invoice.repairId}`}
              className="font-mono underline-offset-2 hover:underline"
            >
              #{invoice.ticketNumber}
            </Link>
          </MetaRow>
        </dl>
      </div>
    </header>
  )
}
