'use client'

import * as React from 'react'
import { AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequestApprovalDialog } from '@/components/repairs/request-approval-dialog'
import { isDeviceModelIdentified } from '@/features/devices/model-verification'
import {
  getSendApprovalViolation,
  PRICING_MESSAGES,
} from '@/features/repairs/pricing-rules'
import type { RepairPricingFieldsInput } from '@/features/repairs/pricing-schemas'
import type { RepairApproval, RepairPartLine, RepairDevice } from '@/features/repairs/queries'
import { getRepairStatusLabel } from '@/features/repairs/status-ui'
import { useSession } from '@/lib/auth-client'

type RequestApprovalControlProps = {
  repairId: string
  ticketNumber: string
  customerName: string
  deviceSummary: string
  diagnosis: string | null
  approval: RepairApproval | null | undefined
  currentStatus: string
  assignedTechnicianId: string | null
  parts: RepairPartLine[]
  savedPricing: RepairPricingFieldsInput
  /** Structured estimate total; null until an estimate has been saved or sent. */
  estimatedTotal: number | null
  /** Rough cost in paise captured on the New Repair form (`repairs.estimated_cost`). */
  intakeEstimatedCost: number | null
  hasIssuedInvoice?: boolean
  device: Pick<RepairDevice, 'model' | 'modelVerified'>
  onRequested?: () => void
}

/**
 * Seeds Labor from the intake estimate until a real estimate exists. Once an estimate is saved or
 * sent, `estimated_cost` holds that total instead, so it must not be reused as labor.
 */
function getDialogStartingPricing({
  savedPricing,
  estimatedTotal,
  intakeEstimatedCost,
}: Pick<RequestApprovalControlProps, 'savedPricing' | 'estimatedTotal' | 'intakeEstimatedCost'>) {
  const canPrefill =
    estimatedTotal == null &&
    savedPricing.laborCharges === 0 &&
    intakeEstimatedCost != null &&
    intakeEstimatedCost > 0
  if (!canPrefill) return { pricing: savedPricing, laborPrefilledFromIntake: null }
  return {
    pricing: { ...savedPricing, laborCharges: intakeEstimatedCost },
    laborPrefilledFromIntake: intakeEstimatedCost,
  }
}

export function RequestApprovalControl({
  repairId,
  ticketNumber,
  customerName,
  deviceSummary,
  diagnosis,
  approval,
  currentStatus,
  assignedTechnicianId,
  parts,
  savedPricing,
  estimatedTotal,
  intakeEstimatedCost,
  hasIssuedInvoice = false,
  device,
  onRequested,
}: RequestApprovalControlProps) {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'OWNER'
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const violation = getSendApprovalViolation({
    userRole,
    userId: session?.user?.id,
    assignedTechnicianId,
    status: currentStatus,
    approvalStatus: approval?.status,
    hasIssuedInvoice,
    deviceModelIdentified: isDeviceModelIdentified(device),
  })

  // 403 = this user never sends estimates; hide the control entirely.
  if (violation?.status === 403) return null

  const disabledReason = violation?.message ?? null
  const modelBlocked = disabledReason === PRICING_MESSAGES.modelNotIdentified
  const startingPricing = getDialogStartingPricing({
    savedPricing,
    estimatedTotal,
    intakeEstimatedCost,
  })

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={disabledReason ? 'outline' : 'accent'}
        size="sm"
        disabled={Boolean(disabledReason)}
        onClick={() => setIsDialogOpen(true)}
        className="h-10 w-full gap-1.5 text-xs font-semibold"
      >
        <Send className="h-3.5 w-3.5" aria-hidden />
        Request Customer Approval
      </Button>

      <p
        className={
          modelBlocked
            ? 'flex items-start gap-1.5 rounded-md border border-amber-200/80 bg-amber-500/5 px-2.5 py-2 text-[11px] leading-relaxed font-medium text-amber-800 dark:border-amber-800/40 dark:text-amber-300'
            : 'flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground'
        }
      >
        {disabledReason ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
        <span>
          {modelBlocked
            ? 'Confirm the device model first — then you can send the estimate for approval.'
            : (disabledReason ??
              'Enter the diagnosis and charges, then send them to the customer.')}
        </span>
      </p>

      <RequestApprovalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        repairId={repairId}
        ticketNumber={ticketNumber}
        statusLabel={getRepairStatusLabel(currentStatus)}
        customerName={customerName}
        deviceSummary={deviceSummary}
        savedDiagnosis={diagnosis}
        parts={parts}
        savedPricing={startingPricing.pricing}
        laborPrefilledFromIntake={startingPricing.laborPrefilledFromIntake}
        onSent={onRequested}
      />
    </div>
  )
}
