import { Receipt } from 'lucide-react'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import type { RepairPayment } from '@/features/payments/queries'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/schemas'
import { formatDate } from '@/lib/format-date'
import { formatRupees } from '@/lib/format-money'
import { cn } from '@/lib/utils'

function paymentDetails(payment: RepairPayment): string {
  return [
    PAYMENT_METHOD_LABELS[payment.method],
    payment.reference,
    payment.receivedByName ? `Received by ${payment.receivedByName}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function PaymentHistoryList({ payments }: { payments: RepairPayment[] }) {
  if (payments.length === 0) {
    return <TableEmptyState icon={Receipt} title="No payments yet" />
  }

  return (
    <ul className="divide-y divide-border">
      {payments.map((payment) => {
        const isPriorCycle = payment.countsTowardCurrentBill === false
        return (
          <li
            key={payment.id}
            className={cn(
              'space-y-0.5 py-3 text-sm print:break-inside-avoid',
              isPriorCycle && 'opacity-80',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold tabular-nums text-foreground">
                  {formatRupees(payment.amount)}
                </p>
                {isPriorCycle ? (
                  <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Prior cycle
                  </span>
                ) : null}
              </div>
              <time dateTime={payment.paidAt} className="text-xs text-muted-foreground">
                {formatDate(payment.paidAt)}
              </time>
            </div>
            <p className="wrap-break-word text-xs text-muted-foreground">{paymentDetails(payment)}</p>
            {isPriorCycle ? (
              <p className="text-[11px] text-muted-foreground">
                Does not apply to the current bill.
              </p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
