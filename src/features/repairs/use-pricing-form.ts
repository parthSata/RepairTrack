'use client'

import * as React from 'react'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  repairPricingFieldsSchema,
  type RepairPricingFieldsInput,
} from '@/features/repairs/pricing-schemas'
import {
  safeCalculateTotal,
  sumPartsCharges,
  type RepairPartChargeLine,
} from '@/features/repairs/pricing-calc'

function finiteOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

type UsePricingFormOptions = {
  parts: RepairPartChargeLine[]
  saved: RepairPricingFieldsInput
}

/** Shared React Hook Form setup + live GST totals for every pricing editor. */
export function usePricingForm({ parts, saved }: UsePricingFormOptions) {
  const { laborCharges, additionalCharges, taxPercent } = saved

  const form = useForm<RepairPricingFieldsInput>({
    resolver: zodResolver(repairPricingFieldsSchema) as Resolver<RepairPricingFieldsInput>,
    mode: 'onChange',
    defaultValues: { laborCharges, additionalCharges, taxPercent },
  })
  const { reset, trigger, control } = form

  const resetToSaved = React.useCallback(() => {
    reset({ laborCharges, additionalCharges, taxPercent })
    void trigger()
  }, [laborCharges, additionalCharges, taxPercent, reset, trigger])

  React.useEffect(() => {
    resetToSaved()
  }, [resetToSaved])

  const partsCharges = sumPartsCharges(parts)
  const watched = useWatch({ control })
  const live: RepairPricingFieldsInput = {
    laborCharges: finiteOrZero(watched.laborCharges),
    additionalCharges: finiteOrZero(watched.additionalCharges),
    taxPercent: finiteOrZero(watched.taxPercent),
  }

  return {
    form,
    partsCharges,
    live,
    liveTotals: safeCalculateTotal({ ...live, partsCharges }),
    savedTotals: safeCalculateTotal({ laborCharges, additionalCharges, taxPercent, partsCharges }),
    resetToSaved,
  }
}

export type PricingFormState = ReturnType<typeof usePricingForm>
