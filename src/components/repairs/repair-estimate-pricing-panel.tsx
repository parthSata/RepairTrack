'use client'

import * as React from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, IndianRupee } from 'lucide-react'
import {
  repairPricingFieldsSchema,
  type RepairPricingFieldsInput,
} from '@/features/repairs/pricing-schemas'
import { useUpdateEstimatePricing } from '@/features/repairs/mutations'
import type { RepairPartLine } from '@/features/repairs/queries'
import {
  calculateRepairTotal,
  GST_TAX_RATES,
  sumPartsCharges,
} from '@/features/repairs/pricing-calc'
import { formatRupees } from '@/lib/format-money'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { PaisePriceField } from '@/components/ui/paise-price-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type RepairEstimatePricingPanelProps = {
  repairId: string
  parts: RepairPartLine[]
  laborCharges: number
  additionalCharges: number
  taxPercent: number
  estimatedTotal: number | null
  canEdit: boolean
}

function PricingRow({
  label,
  valuePaise,
  emphasize,
}: {
  label: string
  valuePaise: number
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={emphasize ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
      <span className={emphasize ? 'text-base font-bold text-foreground' : 'font-medium text-foreground'}>
        {formatRupees(valuePaise)}
      </span>
    </div>
  )
}

export function RepairEstimatePricingPanel({
  repairId,
  parts,
  laborCharges,
  additionalCharges,
  taxPercent,
  estimatedTotal,
  canEdit,
}: RepairEstimatePricingPanelProps) {
  const saveMutation = useUpdateEstimatePricing(repairId)
  const partsCharges = sumPartsCharges(parts)

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<RepairPricingFieldsInput>({
    resolver: zodResolver(repairPricingFieldsSchema) as Resolver<RepairPricingFieldsInput>,
    mode: 'onChange',
    defaultValues: {
      laborCharges,
      additionalCharges,
      taxPercent,
    },
  })

  React.useEffect(() => {
    reset({
      laborCharges,
      additionalCharges,
      taxPercent,
    })
  }, [laborCharges, additionalCharges, taxPercent, reset])

  const watched = watch()
  const liveLabor = Number.isFinite(watched.laborCharges) ? watched.laborCharges : 0
  const liveAdditional = Number.isFinite(watched.additionalCharges) ? watched.additionalCharges : 0
  const liveTaxPercent = Number.isFinite(watched.taxPercent) ? watched.taxPercent : 0

  let preview: ReturnType<typeof calculateRepairTotal> | null = null
  try {
    preview = calculateRepairTotal({
      laborCharges: liveLabor,
      partsCharges,
      additionalCharges: liveAdditional,
      taxPercent: liveTaxPercent,
    })
  } catch {
    preview = null
  }

  const onSubmit = handleSubmit(async (values) => {
    await saveMutation.mutateAsync(values)
  })

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Calculator className="h-4 w-4 text-steel" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Repair estimate
            </h3>
            <p className="text-xs text-muted-foreground">
              Labor, parts, and tax — saved total is shared with customer tracking.
            </p>
          </div>
        </div>

        {canEdit ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PaisePriceField
                name="laborCharges"
                label="Labor charges"
                control={control}
                errors={errors}
                required={false}
                disabled={saveMutation.isPending}
              />
              <PaisePriceField
                name="additionalCharges"
                label="Additional charges"
                control={control}
                errors={errors}
                required={false}
                disabled={saveMutation.isPending}
              />
              <div className="space-y-1.5">
                <Label htmlFor="taxPercent" className="flex items-center gap-2 text-sm font-medium">
                  Tax rate (GST)
                </Label>
                <Controller
                  control={control}
                  name="taxPercent"
                  render={({ field }) => (
                    <Select
                      value={String(field.value ?? 0)}
                      onValueChange={(val) => field.onChange(Number(val))}
                      disabled={saveMutation.isPending}
                    >
                      <SelectTrigger
                        id="taxPercent"
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
            </div>

            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 px-3.5 py-3">
              <PricingRow label="Labor charges" valuePaise={liveLabor} />
              <PricingRow label="Parts charges" valuePaise={partsCharges} />
              <PricingRow label="Additional charges" valuePaise={liveAdditional} />
              {preview ? (
                <>
                  <PricingRow label="Taxable value" valuePaise={preview.taxableValue} />
                  <PricingRow
                    label={`Tax (${liveTaxPercent}%)`}
                    valuePaise={preview.taxAmount}
                  />
                  <div className="border-t border-border/70 pt-2">
                    <PricingRow label="Estimated total" valuePaise={preview.total} emphasize />
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={saveMutation.isPending || !isDirty}
                className="gap-1.5"
              >
                <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                {saveMutation.isPending ? 'Saving…' : 'Save estimate'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 px-3.5 py-3">
            <PricingRow label="Labor charges" valuePaise={laborCharges} />
            <PricingRow label="Parts charges" valuePaise={partsCharges} />
            <PricingRow label="Additional charges" valuePaise={additionalCharges} />
            {(() => {
              try {
                const result = calculateRepairTotal({
                  laborCharges,
                  partsCharges,
                  additionalCharges,
                  taxPercent,
                })
                return (
                  <>
                    <PricingRow label="Taxable value" valuePaise={result.taxableValue} />
                    <PricingRow label={`Tax (${taxPercent}%)`} valuePaise={result.taxAmount} />
                    <div className="border-t border-border/70 pt-2">
                      <PricingRow
                        label="Estimated total"
                        valuePaise={estimatedTotal ?? result.total}
                        emphasize
                      />
                    </div>
                  </>
                )
              } catch {
                return (
                  <p className="text-sm italic text-muted-foreground">Estimate not available.</p>
                )
              }
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
