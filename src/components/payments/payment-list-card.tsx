import Link from 'next/link'
import type { PaymentListItem } from '@/features/payments/queries'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/schemas'
import { formatDate } from '@/lib/format-date'
import { formatRupees } from '@/lib/format-money'

export function PaymentListCard({ payment }: { payment: PaymentListItem }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold tabular-nums text-foreground">
              {formatRupees(payment.amount)}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {PAYMENT_METHOD_LABELS[payment.method]}
            </span>
          </div>
          <p className="truncate text-sm font-medium text-foreground">{payment.customer.name}</p>
          <p className="text-xs text-muted-foreground">{payment.customer.phone}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(payment.paidAt)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <div>
          <span>Ticket: </span>
          <Link
            href={`/repairs/${payment.repair.id}`}
            className="font-mono font-medium text-foreground hover:underline"
          >
            {payment.repair.ticketNumber}
          </Link>
        </div>

        {payment.invoice ? (
          <div>
            <span>Invoice: </span>
            <Link
              href={`/invoices/${payment.invoice.id}`}
              className="font-mono font-medium text-foreground hover:underline"
            >
              {payment.invoice.invoiceNumber}
            </Link>
          </div>
        ) : null}

        {payment.receivedByName ? (
          <div className="ml-auto">
            <span>By {payment.receivedByName}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
