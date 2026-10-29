'use client'

import { PaymentHistoryList } from '@/components/payments/payment-history-list'
import { PaymentTotals } from '@/components/payments/payment-totals'
import { RepairPaymentsLoader } from '@/components/payments/repair-payments-loader'
import { UpiGate } from '@/components/payments/upi-gate'
import { UpiPayCard } from '@/components/payments/upi-pay-card'
import { summarizePaidAmount } from '@/features/payments/summary'
import type { InvoiceStatus } from '@/features/invoices/schemas'

type InvoicePaymentsProps = {
  repairId: string
  ticketNumber: string
  /** The invoice's stored total, so Paid / Balance always match the Total printed above. */
  invoiceTotal: number
  invoiceStatus: InvoiceStatus
  userRole: string
}

export function InvoicePayments({ repairId, ticketNumber, invoiceTotal, invoiceStatus, userRole }: InvoicePaymentsProps) {
  return (
    <RepairPaymentsLoader repairId={repairId}>
      {({ payments, upi, repairStatus, totalPaid }) => {
        // Cycle-scoped paid from the API — prior-cycle payments must not mark a new invoice Paid.
        const summary = summarizePaidAmount(invoiceTotal, totalPaid)
        const hasPriorCyclePayments = payments.some((payment) => !payment.countsTowardCurrentBill)

        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-6 border-t border-border pt-4 sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-start print:justify-between print:break-inside-avoid">
              <div className="w-full sm:max-w-sm">
                <UpiGate
                  upi={upi}
                  balance={invoiceStatus === 'ISSUED' ? summary.balance : 0}
                  repairStatus={repairStatus}
                  userRole={userRole}
                >
                  {(shopUpi) => (
                    <UpiPayCard
                      upi={shopUpi}
                      amountPaise={summary.balance}
                      ticketNumber={ticketNumber}
                      className="w-full"
                    />
                  )}
                </UpiGate>
              </div>
              <div className="sm:ml-auto sm:w-full sm:max-w-xs print:ml-auto print:w-full print:max-w-xs">
                <PaymentTotals {...summary} />
                {hasPriorCyclePayments ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Earlier payments stay on history and do not apply to this bill.
                  </p>
                ) : null}
              </div>
            </div>

            {payments.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Payments
                </h2>
                <PaymentHistoryList payments={payments} />
              </section>
            ) : null}
          </div>
        )
      }}
    </RepairPaymentsLoader>
  )
}
