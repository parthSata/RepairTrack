'use client'

import { CheckCircle2, CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TrackSectionHeader } from '@/components/tracking/track-section-header'
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge'
import { UpiPayCard } from '@/components/payments/upi-pay-card'
import { buildUpiLink } from '@/features/payments/upi'
import { formatRupees } from '@/lib/format-money'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'

type PublicPayment = NonNullable<PublicTrackingResponse['payment']>

type TrackPaymentCardProps = {
  payment: PublicPayment
  ticketNumber: string
}

export function TrackPaymentCard({ payment, ticketNumber }: TrackPaymentCardProps) {
  const isPaid = payment.status === 'PAID'
  const isFinalized = payment.isFinalized ?? true
  const hasUpi = isFinalized && payment.balance > 0 && Boolean(payment.upiId)
  const upiLink = hasUpi
    ? buildUpiLink({
        upiId: payment.upiId!,
        payeeName: payment.payeeName ?? '',
        amountPaise: payment.balance,
        ticketNumber,
      })
    : null

  return (
    <Card className="w-full min-w-0 border-border">
      <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
        <TrackSectionHeader icon={CreditCard} title="Payment" />

        <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex w-full min-w-0 flex-1 flex-col gap-2 rounded-lg bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium text-foreground">
                {formatRupees(payment.totalPaid)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-foreground">
                {isFinalized ? 'Balance due' : 'Balance due (estimate)'}
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatRupees(Math.max(payment.balance, 0))}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border/80 pt-2">
              <span className="text-muted-foreground">Status</span>
              <PaymentStatusBadge status={payment.status} />
            </div>

            {isPaid ? (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                <span>Paid in full</span>
              </div>
            ) : !isFinalized ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Bill not finalized yet. Payment via UPI QR code will be available once the shop confirms the final bill.
              </p>
            ) : null}
          </div>

          {hasUpi && upiLink ? (
            <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
              <UpiPayCard
                upi={{ upiId: payment.upiId!, payeeName: payment.payeeName ?? '' }}
                amountPaise={payment.balance}
                ticketNumber={ticketNumber}
                className="w-full"
              />
              <a
                href={upiLink}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-2xs transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:hidden"
              >
                Pay with UPI app
              </a>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
