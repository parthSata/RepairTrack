'use client'

import { PaymentHistoryList } from '@/components/payments/payment-history-list'
import { PaymentTotals } from '@/components/payments/payment-totals'
import { RepairPaymentsLoader } from '@/components/payments/repair-payments-loader'
import { getPaymentSummary } from '@/features/payments/summary'

type InvoicePaymentsProps = {
  repairId: string
  /** The invoice's stored total, so Paid / Balance always match the Total printed above. */
  invoiceTotal: number
}

export function InvoicePayments({ repairId, invoiceTotal }: InvoicePaymentsProps) {
  return (
    <RepairPaymentsLoader repairId={repairId}>
      {({ payments }) => (
        <div className="space-y-6">
          <div className="border-t border-border pt-4 sm:ml-auto sm:max-w-xs print:ml-auto print:max-w-xs print:break-inside-avoid">
            <PaymentTotals {...getPaymentSummary({ billTotal: invoiceTotal, payments })} />
          </div>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Payments
            </h2>
            <PaymentHistoryList payments={payments} />
          </section>
        </div>
      )}
    </RepairPaymentsLoader>
  )
}
