import { Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import type { RepairPayment } from '@/features/payments/queries'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/schemas'
import { formatDate } from '@/lib/format-date'
import { formatRupees } from '@/lib/format-money'

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
      {payments.map((payment) => (
        <li key={payment.id} className="space-y-0.5 py-3 text-sm print:break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="flex items-center gap-2 font-semibold tabular-nums text-foreground">
              {formatRupees(payment.amount)}
              {payment.type === 'ADVANCE' ? <Badge variant="secondary">Advance</Badge> : null}
            </p>
            <time dateTime={payment.paidAt} className="text-xs text-muted-foreground">
              {formatDate(payment.paidAt)}
            </time>
          </div>
          <p className="wrap-break-word text-xs text-muted-foreground">{paymentDetails(payment)}</p>
        </li>
      ))}
    </ul>
  )
}
