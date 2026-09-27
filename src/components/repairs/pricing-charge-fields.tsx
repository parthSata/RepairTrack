'use client'

import type { Control, FieldErrors } from 'react-hook-form'
import type { RepairPricingFieldsInput } from '@/features/repairs/pricing-schemas'
import { PaisePriceField } from '@/components/ui/paise-price-field'
import { PricingTaxField } from '@/components/repairs/pricing-tax-field'

type PricingChargeFieldsProps = {
  control: Control<RepairPricingFieldsInput>
  errors: FieldErrors<RepairPricingFieldsInput>
  disabled?: boolean
  taxFieldId?: string
}

export function PricingChargeFields({
  control,
  errors,
  disabled,
  taxFieldId,
}: PricingChargeFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <PaisePriceField
        name="laborCharges"
        label="Labor charges"
        control={control}
        errors={errors}
        required={false}
        disabled={disabled}
      />
      <PaisePriceField
        name="additionalCharges"
        label="Additional charges"
        control={control}
        errors={errors}
        required={false}
        disabled={disabled}
      />
      <PricingTaxField
        control={control}
        errors={errors}
        disabled={disabled}
        id={taxFieldId}
      />
    </div>
  )
}
