import * as React from 'react'
import Link from 'next/link'
import { IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PendingPaymentItem } from '@/features/payments/queries'
import {
  getRepairStatusIcon,
  getRepairStatusLabel,
  getRepairStatusTone,
} from '@/features/repairs/status-ui'
import { formatRupees } from '@/lib/format-money'

interface PendingPaymentCardProps {
  item: PendingPaymentItem
  onRecordPayment: (item: PendingPaymentItem) => void
}

export function PendingPaymentCard({ item, onRecordPayment }: PendingPaymentCardProps) {
  const tone = getRepairStatusTone(item.status)
  const IconComponent = getRepairStatusIcon(item.status)

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={`/repairs/${item.repairId}`}
            className="font-mono text-sm font-semibold text-foreground hover:underline"
          >
            {item.ticketNumber}
          </Link>
          <p className="truncate text-sm font-medium text-foreground">{item.customer.name}</p>
          <p className="text-xs text-muted-foreground">{item.customer.phone}</p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone.chip}`}
        >
          {React.createElement(IconComponent, { className: 'h-3 w-3' })}
          {getRepairStatusLabel(item.status)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-center text-xs">
        <div>
          <span className="text-[11px] text-muted-foreground">Bill Total</span>
          <p className="font-medium text-foreground">{formatRupees(item.billTotal)}</p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground">Balance</span>
          <p className="font-bold tabular-nums text-foreground">{formatRupees(item.balance)}</p>
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <Button
          size="sm"
          onClick={() => onRecordPayment(item)}
          className="group relative inline-flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-300 ease-out hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
        >
          <IndianRupee className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
          <span>Record Payment</span>
        </Button>
      </div>
    </div>
  )
}
