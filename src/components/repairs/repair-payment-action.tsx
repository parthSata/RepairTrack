'use client'

import * as React from 'react'
import { IndianRupee, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getBillTotal } from '@/features/payments/summary'
import { formatRupees } from '@/lib/format-money'
import { RecordPaymentDialog } from './record-payment-dialog'

const PAYMENT_ROLES = new Set(['OWNER', 'STAFF'])

type RepairPaymentActionProps = {
  repairId: string
  userRole: string
  status: string
  finalTotal: number | null
  estimatedTotal: number | null
  totalPaid: number
}

function describePayments({
  billTotal,
  totalPaid,
  isEstimate,
}: {
  billTotal: number | null
  totalPaid: number
  isEstimate: boolean
}): string {
  if (billTotal == null) {
    const paid = totalPaid > 0 ? `Advance paid ${formatRupees(totalPaid)}. ` : ''
    return `${paid}No bill yet, so payments are recorded as advances.`
  }
  const bill = `${formatRupees(billTotal)}${isEstimate ? ' (estimate)' : ''}`
  const balance = formatRupees(Math.max(billTotal - totalPaid, 0))
  return `Paid ${formatRupees(totalPaid)} of ${bill}. Balance ${balance}.`
}

export function RepairPaymentAction({
  repairId,
  userRole,
  status,
  finalTotal,
  estimatedTotal,
  totalPaid,
}: RepairPaymentActionProps) {
  const [open, setOpen] = React.useState(false)

  if (!PAYMENT_ROLES.has(userRole)) return null

  const billTotal = getBillTotal({ finalTotal, estimatedTotal })
  const balance = billTotal == null ? null : billTotal - totalPaid
  const description = describePayments({ billTotal, totalPaid, isEstimate: finalTotal == null })
  const disabledReason =
    status === 'CANCELLED' ? 'Repair is cancelled' : balance != null && balance <= 0 ? 'Paid in full' : null

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Wallet className="h-4 w-4 text-steel" aria-hidden />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">Payments</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setOpen(true)}
            disabled={disabledReason != null}
            title={disabledReason ?? undefined}
            className="w-full gap-1.5 sm:w-auto"
          >
            <IndianRupee className="h-3.5 w-3.5" aria-hidden />
            {disabledReason ?? 'Record Payment'}
          </Button>
        </div>
      </CardContent>

      <RecordPaymentDialog repairId={repairId} balance={balance} open={open} onOpenChange={setOpen} />
    </Card>
  )
}
