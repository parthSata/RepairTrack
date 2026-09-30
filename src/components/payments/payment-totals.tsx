import type { ReactNode } from 'react'
import { AmountRow } from '@/components/repairs/pricing-breakdown-rows'
import type { PaymentStatus } from '@/features/payments/summary'
import { PaymentStatusBadge } from './payment-status-badge'

type PaymentTotalsProps = {
  /** Omit to hide the row (the invoice prints its Total right above). Null means no bill yet. */
  billTotal?: number | null
  billTotalLabel?: string
  totalPaid: number
  balance: number | null
  status: PaymentStatus | null
}

function LabelRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/** Amounts in paise. Balance and status rows are hidden until there is a bill to measure against. */
export function PaymentTotals({
  billTotal,
  billTotalLabel = 'Bill total',
  totalPaid,
  balance,
  status,
}: PaymentTotalsProps) {
  return (
    <div className="space-y-2">
      {billTotal === null ? (
        <LabelRow label={billTotalLabel}>
          <span className="font-medium text-muted-foreground">Not set</span>
        </LabelRow>
      ) : billTotal !== undefined ? (
        <AmountRow label={billTotalLabel} valuePaise={billTotal} />
      ) : null}
      <AmountRow label="Paid" valuePaise={totalPaid} />
      {balance != null ? (
        <AmountRow label="Balance due" valuePaise={Math.max(balance, 0)} emphasize />
      ) : null}
      {status ? (
        <LabelRow label="Status">
          <PaymentStatusBadge status={status} />
        </LabelRow>
      ) : null}
    </div>
  )
}
