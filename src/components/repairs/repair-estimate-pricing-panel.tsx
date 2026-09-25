'use client'

import * as React from 'react'
import { useForm, type Resolver } from 'react-hook-form'
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
  sumPartsCharges,
} from '@/features/repairs/pricing-calc'
import { formatRupees } from '@/lib/format-money'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaisePriceField } from '@/components/ui/paise-price-field'

type RepairEstimatePricingPanelProps = {
  repairId: string
  parts: RepairPartLine[]
  laborCharges: number
  additionalCharges: number
  discount: number
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
  discount,
  taxPercent,
  estimatedTotal,
  canEdit,
}: RepairEstimatePricingPanelProps) {
  const saveMutation = useUpdateEstimatePricing(repairId)
  const partsCharges = sumPartsCharges(parts)

  const {
    control,
    register,
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
      discount,
      taxPercent,
    },
  })

  React.useEffect(() => {
    reset({
      laborCharges,
      additionalCharges,
      discount,
      taxPercent,
    })
  }, [laborCharges, additionalCharges, discount, taxPercent, reset])

  const watched = watch()
  const liveLabor = Number.isFinite(watched.laborCharges) ? watched.laborCharges : 0
  const liveAdditional = Number.isFinite(watched.additionalCharges) ? watched.additionalCharges : 0
  const liveDiscount = Number.isFinite(watched.discount) ? watched.discount : 0
  const liveTaxPercent = Number.isFinite(watched.taxPercent) ? watched.taxPercent : 0

  const taxableBeforeTax = liveLabor + partsCharges + liveAdditional - liveDiscount
  const discountTooHigh = taxableBeforeTax < 0

  let preview: ReturnType<typeof calculateRepairTotal> | null = null
  if (!discountTooHigh) {
    try {
      preview = calculateRepairTotal({
        laborCharges: liveLabor,
        partsCharges,
        additionalCharges: liveAdditional,
        discount: liveDiscount,
        taxPercent: liveTaxPercent,
      })
    } catch {
      preview = null
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (discountTooHigh) return
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <PaisePriceField
                name="discount"
                label="Discount"
                control={control}
                errors={errors}
                required={false}
                disabled={saveMutation.isPending}
              />
              <div className="space-y-1.5">
                <Label htmlFor="taxPercent" className="flex items-center gap-2 text-sm font-medium">
                  Tax percent
                </Label>
                <Input
                  id="taxPercent"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  disabled={saveMutation.isPending}
                  aria-invalid={Boolean(errors.taxPercent)}
                  {...register('taxPercent', { valueAsNumber: true })}
                />
                <FieldError message={errors.taxPercent?.message} />
              </div>
            </div>

            {discountTooHigh ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
              >
                Discount cannot exceed labor, parts, and additional charges.
              </p>
            ) : null}

            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 px-3.5 py-3">
              <PricingRow label="Parts charges" valuePaise={partsCharges} />
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
                disabled={saveMutation.isPending || discountTooHigh || !isDirty}
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
            {discount > 0 ? <PricingRow label="Discount" valuePaise={discount} /> : null}
            {(() => {
              try {
                const result = calculateRepairTotal({
                  laborCharges,
                  partsCharges,
                  additionalCharges,
                  discount,
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
