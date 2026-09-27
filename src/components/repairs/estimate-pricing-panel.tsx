'use client'

import * as React from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator, IndianRupee } from 'lucide-react'
import {
  repairPricingFieldsSchema,
  type RepairPricingFieldsInput,
} from '@/features/repairs/pricing-schemas'
import { useUpdateEstimate } from '@/features/repairs/pricing-mutations'
import type { RepairPartLine } from '@/features/repairs/queries'
import { safeCalculateTotal, sumPartsCharges } from '@/features/repairs/pricing-calc'
import { formatINR } from '@/features/repairs/money'
import { PricingBreakdownRows } from '@/components/repairs/pricing-breakdown-rows'
import { PricingChargeFields } from '@/components/repairs/pricing-charge-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type PendingApprovalBreakdown = {
  initial: number
  additional: number
  revised: number
}

type EstimatePricingPanelProps = {
  repairId: string
  parts: RepairPartLine[]
  laborCharges: number
  additionalCharges: number
  taxPercent: number
  estimatedTotal: number | null
  canEdit: boolean
  status?: string
  pendingApprovalBreakdown?: PendingApprovalBreakdown | null
}

function PendingApprovalStrip({ breakdown }: { breakdown: PendingApprovalBreakdown }) {
  return (
    <div className="space-y-2 rounded-xl border border-amber-200/70 bg-amber-50/50 px-3.5 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
      <p className="text-xs text-amber-900 dark:text-amber-200">
        Sent to customer — revise charges below while waiting for approval.
      </p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Original estimate</span>
          <span className="font-medium">{formatINR(breakdown.initial)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Additional</span>
          <span className="font-medium">+ {formatINR(breakdown.additional)}</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-amber-200/60 pt-1.5 dark:border-amber-800/50">
          <span className="font-semibold text-foreground">Revised total</span>
          <span className="font-semibold">{formatINR(breakdown.revised)}</span>
        </div>
      </div>
    </div>
  )
}

export function EstimatePricingPanel({
  repairId,
  parts,
  laborCharges,
  additionalCharges,
  taxPercent,
  estimatedTotal,
  canEdit,
  status,
  pendingApprovalBreakdown = null,
}: EstimatePricingPanelProps) {
  const saveMutation = useUpdateEstimate(repairId)
  const partsCharges = sumPartsCharges(parts)

  const {
    control,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors, isDirty, isValid },
  } = useForm<RepairPricingFieldsInput>({
    resolver: zodResolver(repairPricingFieldsSchema) as Resolver<RepairPricingFieldsInput>,
    mode: 'onChange',
    defaultValues: { laborCharges, additionalCharges, taxPercent },
  })

  React.useEffect(() => {
    reset({ laborCharges, additionalCharges, taxPercent })
    void trigger()
  }, [laborCharges, additionalCharges, taxPercent, reset, trigger])

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
    savedTotals && estimatedTotal != null
      ? { ...savedTotals, total: estimatedTotal }
      : savedTotals

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
              {canEdit
                ? 'Labor, parts, and tax — saved total is shared with customer tracking.'
                : status === 'COMPLETED'
                  ? 'Estimate is locked on completed repairs.'
                  : 'Estimate is locked after customer approval.'}
            </p>
          </div>
        </div>

        {pendingApprovalBreakdown ? (
          <PendingApprovalStrip breakdown={pendingApprovalBreakdown} />
        ) : null}

        {canEdit ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <PricingChargeFields
              control={control}
              errors={errors}
              disabled={saveMutation.isPending}
              taxFieldId="estimate-taxPercent"
            />

            <PricingBreakdownRows
              laborCharges={liveLabor}
              partsCharges={partsCharges}
              additionalCharges={liveAdditional}
              taxPercent={liveTaxPercent}
              totals={liveTotals}
              totalLabel="Estimated total"
              emptyMessage="Estimate not available."
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={saveMutation.isPending || !isDirty || !isValid}
                className="gap-1.5"
              >
                <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                {saveMutation.isPending ? 'Saving…' : 'Save estimate'}
              </Button>
            </div>
          </form>
        ) : (
          <PricingBreakdownRows
            laborCharges={laborCharges}
            partsCharges={partsCharges}
            additionalCharges={additionalCharges}
            taxPercent={taxPercent}
            totals={viewTotals}
            totalLabel="Estimated total"
            emptyMessage="Estimate not available."
          />
        )}
      </CardContent>
    </Card>
  )
}
