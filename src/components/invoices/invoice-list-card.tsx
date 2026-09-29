import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status'
import { invoiceHref, type InvoiceListItem } from '@/features/invoices/queries'
import { formatDate } from '@/lib/format-date'
import { formatDeviceLabel } from '@/lib/format-device'
import { formatRupees } from '@/lib/format-money'

export function InvoiceListCard({ invoice }: { invoice: InvoiceListItem }) {
  return (
    <Link
      href={invoiceHref(invoice.id)}
      aria-label={`View invoice ${invoice.invoiceNumber}`}
      className="block rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:bg-muted/40 active:bg-muted/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {invoice.invoiceNumber}
            </span>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="truncate text-sm font-medium text-foreground">{invoice.customer.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {invoice.customer.phone} · {formatDeviceLabel(invoice.device)}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">{formatDate(invoice.createdAt)}</span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatRupees(invoice.total)}
        </span>
      </div>
    </Link>
  )
}
