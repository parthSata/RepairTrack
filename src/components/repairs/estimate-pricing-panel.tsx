'use client'

import * as React from 'react'
import { Calculator } from 'lucide-react'
import type { RepairPartLine } from '@/features/repairs/queries'
import type { ApprovalStatus, PricingPanelMode } from '@/features/repairs/pricing-rules'
import { differsFromEstimate } from '@/features/repairs/pricing-calc'
import { useConfirmFinalTotal, useUpdateEstimate } from '@/features/repairs/pricing-mutations'
import { usePricingForm } from '@/features/repairs/use-pricing-form'
import { formatRupees } from '@/lib/format-money'
import { PricingBreakdownRows } from '@/components/repairs/pricing-breakdown-rows'
import { PricingFormSection } from '@/components/repairs/pricing-form-section'
import { PricingPanelActions } from '@/components/repairs/pricing-panel-actions'
import { PricingStateBadge, type PricingState } from '@/components/repairs/pricing-state-badge'
import { Card, CardContent } from '@/components/ui/card'

type EstimatePricingPanelProps = {
  repairId: string
  mode: Exclude<PricingPanelMode, 'hidden'>
  status: string
  approvalStatus: ApprovalStatus | null
  parts: RepairPartLine[]
  laborCharges: number
  additionalCharges: number
  taxPercent: number
  estimatedTotal: number | null
  finalTotal: number | null
}

function getPricingState(isFinalized: boolean, approvalStatus: ApprovalStatus | null): PricingState | null {
  if (isFinalized) return 'final'
  if (approvalStatus === 'PENDING') return 'awaiting'
  if (approvalStatus === 'APPROVED') return 'approved'
  return null
}

function getSubtitle({ mode, status, isEditing, isFinalized, approvalStatus }: {
  mode: EstimatePricingPanelProps['mode']
  status: string
  isEditing: boolean
  isFinalized: boolean
  approvalStatus: ApprovalStatus | null
}): string {
  if (mode === 'view') {
    return status === 'COMPLETED'
      ? 'Pricing is locked on completed repairs.'
      : 'Charges are set when sending the estimate for customer approval.'
  }
  if (mode === 'editEstimate') {
    return approvalStatus === 'PENDING'
      ? 'Saving updates the estimate the customer is reviewing.'
      : 'Labor, parts, and GST — shared with customer tracking.'
  }
  if (isEditing) return 'Adjust charges, then finalize the bill.'
  return isFinalized
    ? 'Bill finalized — the repair can be marked completed.'
    : 'Review the approved estimate, then finalize the bill.'
}

export function EstimatePricingPanel({
  repairId,
  mode,
  status,
  approvalStatus,
  parts,
  laborCharges,
  additionalCharges,
  taxPercent,
  estimatedTotal,
  finalTotal,
}: EstimatePricingPanelProps) {
  const pricing = usePricingForm({ parts, saved: { laborCharges, additionalCharges, taxPercent } })
  const saveMutation = useUpdateEstimate(repairId)
  const finalizeMutation = useConfirmFinalTotal(repairId)
  const [isUnlocked, setIsUnlocked] = React.useState(false)

  const isFinalized = finalTotal != null
  const isEditing = mode === 'editEstimate' || (mode === 'finalize' && isUnlocked)
  const activeMutation = mode === 'finalize' ? finalizeMutation : saveMutation
  const { isDirty, isValid } = pricing.form.formState
  const canSubmit = mode === 'finalize' ? isValid : isDirty && isValid

  const storedTotal = isFinalized ? finalTotal : estimatedTotal
  const viewTotals =
    pricing.savedTotals && storedTotal != null
      ? { ...pricing.savedTotals, total: storedTotal }
      : pricing.savedTotals
  const comparedTotal = isEditing ? (pricing.liveTotals?.total ?? null) : finalTotal
  const showEstimateDiff = mode !== 'editEstimate' && differsFromEstimate(estimatedTotal, comparedTotal)
  const pricingState = getPricingState(isFinalized, approvalStatus)
  const totalLabel = isFinalized || (mode === 'finalize' && isEditing) ? 'Final total' : 'Estimated total'

  const handleCancel = () => {
    pricing.resetToSaved()
    setIsUnlocked(false)
  }

  const onSubmit = pricing.form.handleSubmit(async (values) => {
    try {
      await activeMutation.mutateAsync(values)
      setIsUnlocked(false)
    } catch {
      // Toast + 409 resync are handled by the mutation; keep the form open with the user's input.
    }
  })

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calculator className="h-4 w-4 text-steel" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Repair estimate
                </h3>
                {pricingState ? <PricingStateBadge state={pricingState} /> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {getSubtitle({ mode, status, isEditing, isFinalized, approvalStatus })}
              </p>
            </div>
          </div>

          {isEditing ? (
            <PricingFormSection
              pricing={pricing}
              totalLabel={totalLabel}
              taxFieldId={`pricing-tax-${repairId}`}
              disabled={activeMutation.isPending}
            />
          ) : (
            <PricingBreakdownRows
              laborCharges={laborCharges}
              partsCharges={pricing.partsCharges}
              additionalCharges={additionalCharges}
              taxPercent={taxPercent}
              totals={viewTotals}
              totalLabel={totalLabel}
              emptyMessage="Estimate not available."
            />
          )}

          {showEstimateDiff && estimatedTotal != null ? (
            <p className="text-xs text-muted-foreground">
              Differs from the approved estimate of {formatRupees(estimatedTotal)}.
            </p>
          ) : null}

          {mode === 'view' ? null : (
            <PricingPanelActions
              mode={mode}
              isUnlocked={isUnlocked}
              isFinalized={isFinalized}
              isPending={activeMutation.isPending}
              canSubmit={canSubmit}
              onUnlock={() => setIsUnlocked(true)}
              onCancel={handleCancel}
            />
          )}
        </form>
      </CardContent>
    </Card>
  )
}
