'use client'

import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { GST_TAX_RATES } from '@/features/repairs/pricing-calc'
import type { RepairPricingFieldsInput } from '@/features/repairs/pricing-schemas'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PricingTaxFieldProps = {
  control: Control<RepairPricingFieldsInput>
  errors: FieldErrors<RepairPricingFieldsInput>
  disabled?: boolean
  id?: string
}

export function PricingTaxField({
  control,
  errors,
  disabled,
  id = 'taxPercent',
}: PricingTaxFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        Tax rate (GST)
      </Label>
      <Controller
        control={control}
        name="taxPercent"
        render={({ field }) => (
          <Select
            value={String(field.value ?? 0)}
            onValueChange={(val) => field.onChange(Number(val))}
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              className="h-10 w-full bg-background"
              aria-invalid={Boolean(errors.taxPercent)}
            >
              <SelectValue placeholder="Select tax rate" />
            </SelectTrigger>
            <SelectContent>
              {GST_TAX_RATES.map((rate) => (
                <SelectItem key={rate.value} value={String(rate.value)}>
                  {rate.label}
                </SelectItem>
              ))}
              {!GST_TAX_RATES.some((r) => r.value === field.value) && (
                <SelectItem value={String(field.value)}>
                  {field.value}% (Custom)
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      />
      <FieldError message={errors.taxPercent?.message} />
    </div>
  )
}
