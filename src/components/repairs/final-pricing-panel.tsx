'use client'

import * as React from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IndianRupee, Receipt } from 'lucide-react'
import {
  repairPricingFieldsSchema,
  type RepairPricingFieldsInput,
} from '@/features/repairs/pricing-schemas'
import { useConfirmFinalTotal } from '@/features/repairs/pricing-mutations'
import type { RepairPartLine } from '@/features/repairs/queries'
import {
  differsFromEstimate,
  safeCalculateTotal,
  sumPartsCharges,
} from '@/features/repairs/pricing-calc'
import { PricingBreakdownRows } from '@/components/repairs/pricing-breakdown-rows'
import { PricingChargeFields } from '@/components/repairs/pricing-charge-fields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type FinalPricingPanelProps = {
  repairId: string
  parts: RepairPartLine[]
  laborCharges: number
  additionalCharges: number
  taxPercent: number
  estimatedTotal: number | null
  finalTotal: number | null
  canConfirm: boolean
}

export function FinalPricingPanel({
  repairId,
  parts,
  laborCharges,
  additionalCharges,
  taxPercent,
  estimatedTotal,
  finalTotal,
  canConfirm,
}: FinalPricingPanelProps) {
  const confirmMutation = useConfirmFinalTotal(repairId)
  const [isUnlocked, setIsUnlocked] = React.useState(false)

  const isConfirmed = finalTotal != null
  const isEditing = canConfirm && (!isConfirmed || isUnlocked)
  const partsCharges = sumPartsCharges(parts)

  const {
    control,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<RepairPricingFieldsInput>({
    resolver: zodResolver(repairPricingFieldsSchema) as Resolver<RepairPricingFieldsInput>,
    mode: 'onChange',
    defaultValues: { laborCharges, additionalCharges, taxPercent },
  })

  React.useEffect(() => {
    reset({ laborCharges, additionalCharges, taxPercent })
    void trigger()
  }, [laborCharges, additionalCharges, taxPercent, reset, trigger])

  React.useEffect(() => {
    if (!isConfirmed) setIsUnlocked(false)
  }, [isConfirmed])

  const watched = watch()
  const liveLabor = Number.isFinite(watched.laborCharges) ? watched.laborCharges : 0
  const liveAdditional = Number.isFinite(watched.additionalCharges) ? watched.additionalCharges : 0
  const liveTaxPercent = Number.isFinite(watched.taxPercent) ? watched.taxPercent : 0

  const liveTotals = safeCalculateTotal({
    laborCharges: liveLabor,
    partsCharges,
    additionalCharges: liveAdditional,
    taxPercent: liveTaxPercent,
  })

  const savedTotals = safeCalculateTotal({
    laborCharges,
    partsCharges,
    additionalCharges,
    taxPercent,
  })
  const viewTotals =
    savedTotals && finalTotal != null ? { ...savedTotals, total: finalTotal } : savedTotals

  const comparisonTotal = isEditing ? (liveTotals?.total ?? null) : finalTotal
  const showDiffNote = differsFromEstimate(estimatedTotal, comparisonTotal)

  const onSubmit = handleSubmit(async (values) => {
    await confirmMutation.mutateAsync(values)
    setIsUnlocked(false)
  })

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Receipt className="h-4 w-4 text-steel" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Final pricing
              </h3>
              {isConfirmed && !isEditing ? (
                <Badge variant="success" className="rounded-md font-medium">
                  Confirmed
                </Badge>
              ) : null}
            </div>
            {isEditing ? (
              <p className="text-xs text-muted-foreground">
                Adjust charges, then confirm for invoicing.
              </p>
            ) : null}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <PricingChargeFields
              control={control}
              errors={errors}
              disabled={confirmMutation.isPending}
              taxFieldId="final-taxPercent"
            />

            <PricingBreakdownRows
              laborCharges={liveLabor}
              partsCharges={partsCharges}
              additionalCharges={liveAdditional}
              taxPercent={liveTaxPercent}
              totals={liveTotals}
              totalLabel="Final total"
            />

            {showDiffNote ? (
              <p className="text-xs text-muted-foreground">Final total differs from estimate</p>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={confirmMutation.isPending || !isValid}
                className="gap-1.5"
              >
                <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                {confirmMutation.isPending ? 'Confirming…' : 'Confirm Final Total'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <PricingBreakdownRows
              laborCharges={laborCharges}
              partsCharges={partsCharges}
              additionalCharges={additionalCharges}
              taxPercent={taxPercent}
              totals={viewTotals}
              totalLabel="Final total"
            />

            {showDiffNote ? (
              <p className="text-xs text-muted-foreground">Final total differs from estimate</p>
            ) : null}

            {canConfirm && isConfirmed ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUnlocked(true)}
                >
                  Unlock to edit
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
