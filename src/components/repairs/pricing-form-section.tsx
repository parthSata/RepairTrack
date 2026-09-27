'use client'

import type { PricingFormState } from '@/features/repairs/use-pricing-form'
import { PricingBreakdownRows } from '@/components/repairs/pricing-breakdown-rows'
import { PricingChargeFields } from '@/components/repairs/pricing-charge-fields'

type PricingFormSectionProps = {
  pricing: PricingFormState
  totalLabel: string
  taxFieldId: string
  disabled?: boolean
}

/** Labor / Additional / GST inputs with the live GST breakdown underneath. */
export function PricingFormSection({
  pricing,
  totalLabel,
  taxFieldId,
  disabled,
}: PricingFormSectionProps) {
  const {
    form: { control, formState },
    live,
    partsCharges,
    liveTotals,
  } = pricing

  return (
    <div className="space-y-4">
      <PricingChargeFields
        control={control}
        errors={formState.errors}
        disabled={disabled}
        taxFieldId={taxFieldId}
      />
      <PricingBreakdownRows
        laborCharges={live.laborCharges}
        partsCharges={partsCharges}
        additionalCharges={live.additionalCharges}
        taxPercent={live.taxPercent}
        totals={liveTotals}
        totalLabel={totalLabel}
      />
    </div>
  )
}
