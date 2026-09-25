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
}: {
  label: string
  amount: number
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={emphasize ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
      <span className={emphasize ? 'text-lg font-bold text-foreground' : 'font-medium text-foreground'}>
        {formatINR(amount)}
      </span>
    </div>
  )
}

export function TrackPricingSummary({ pricing }: TrackPricingSummaryProps) {
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
          {pricing.discount > 0 ? <Row label="Discount" amount={pricing.discount} /> : null}
          <Row label="Taxable value" amount={pricing.taxableValue} />
          <Row label={`Tax (${pricing.taxPercent}%)`} amount={pricing.taxAmount} />
          <div className="border-t border-border/80 pt-2">
            <Row label="Estimated total" amount={pricing.estimatedTotal} emphasize />
          </div>
          {pricing.finalTotal != null ? (
            <div className="border-t border-border/80 pt-2">
              <Row label="Final total" amount={pricing.finalTotal} emphasize />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
