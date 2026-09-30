'use client'

import * as React from 'react'
import { IndianRupee, Wallet } from 'lucide-react'
import { PaymentHistoryList } from '@/components/payments/payment-history-list'
import { PaymentTotals } from '@/components/payments/payment-totals'
import { RepairPaymentsLoader } from '@/components/payments/repair-payments-loader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RecordPaymentDialog } from './record-payment-dialog'

const PAYMENT_ROLES = new Set(['OWNER', 'STAFF'])

type PaymentSummaryCardProps = {
  repairId: string
  userRole: string
  repairStatus: string
  hasFinalBill: boolean
}

export function PaymentSummaryCard({ repairId, userRole, repairStatus, hasFinalBill }: PaymentSummaryCardProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  if (!PAYMENT_ROLES.has(userRole)) return null

  const isCancelled = repairStatus === 'CANCELLED'

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Wallet className="h-4 w-4 text-steel" aria-hidden />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">Payments</h3>
        </div>

        <RepairPaymentsLoader repairId={repairId}>
          {(data) => {
            // Nothing left to collect once a bill exists and is covered (includes PAID).
            const canRecord = data.balance == null || data.balance > 0

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-muted/15 px-3.5 py-3">
                  <PaymentTotals
                    billTotal={data.billTotal}
                    billTotalLabel={hasFinalBill ? 'Bill total' : 'Bill total (estimate)'}
                    totalPaid={data.totalPaid}
                    balance={data.balance}
                    status={data.status}
                  />
                  {data.billTotal == null ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No bill yet, so payments are recorded as advances.
                    </p>
                  ) : null}
                </div>

                {canRecord ? (
                  <Button
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    disabled={isCancelled}
                    className="w-full gap-1.5 sm:w-auto"
                  >
                    <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                    {isCancelled ? 'Repair is cancelled' : 'Record Payment'}
                  </Button>
                ) : null}

                <section className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    History
                  </h4>
                  <PaymentHistoryList payments={data.payments} />
                </section>

                <RecordPaymentDialog
                  repairId={repairId}
                  balance={data.balance}
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                />
              </div>
            )
          }}
        </RepairPaymentsLoader>
      </CardContent>
    </Card>
  )
}
