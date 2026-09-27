'use client'

import { IndianRupee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatINR } from '@/features/repairs/money'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'

type PublicPricing = NonNullable<PublicTrackingResponse['pricing']>

type TrackPricingSummaryProps = {
  pricing: PublicPricing
}

function Row({
  label,
  amount,
  emphasize,
  muted,
}: {
  label: string
  amount: number
  emphasize?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={
          emphasize
            ? 'font-semibold text-foreground'
            : muted
              ? 'text-xs text-muted-foreground'
              : 'text-muted-foreground'
        }
      >
        {label}
      </span>
      <span
        className={
          emphasize
            ? 'text-lg font-bold text-foreground'
            : muted
              ? 'text-xs font-medium text-muted-foreground'
              : 'font-medium text-foreground'
        }
      >
        {formatINR(amount)}
      </span>
    </div>
  )
}

function differsFromEstimateRupees(estimated: number, final: number): boolean {
  return Math.abs(final - estimated) > 1
}

export function TrackPricingSummary({ pricing }: TrackPricingSummaryProps) {
  const hasFinal = pricing.finalTotal != null
  const showEstimateDiff =
    hasFinal && differsFromEstimateRupees(pricing.estimatedTotal, pricing.finalTotal!)

  return (
    <Card className="w-full min-w-0 border-border">
      <CardContent className="flex w-full min-w-0 flex-col gap-3 p-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-2">
          <IndianRupee className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <h3 className="min-w-0 text-sm font-bold uppercase tracking-[0.12em] text-foreground sm:tracking-[0.14em]">
            Repair charges
          </h3>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 rounded-lg bg-muted/30 p-4 text-sm">
          <Row label="Labor" amount={pricing.laborCharges} />
          <Row label="Parts" amount={pricing.partsCharges} />
          <Row label="Additional charges" amount={pricing.additionalCharges} />
          <Row label="Taxable value" amount={pricing.taxableValue} />
          <Row label={`Tax (${pricing.taxPercent}%)`} amount={pricing.taxAmount} />
          <div className="border-t border-border/80 pt-2">
            {hasFinal ? (
              <>
                <Row label="Final total" amount={pricing.finalTotal!} emphasize />
                {showEstimateDiff ? (
                  <div className="mt-1.5">
                    <Row label="Estimated total" amount={pricing.estimatedTotal} muted />
                  </div>
                ) : null}
              </>
            ) : (
              <Row label="Estimated total" amount={pricing.estimatedTotal} emphasize />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
