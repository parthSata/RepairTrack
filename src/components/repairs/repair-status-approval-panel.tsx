'use client'

import { RequestApprovalControl } from '@/components/repairs/request-approval-control'
import { StatusChangeControl } from '@/components/repairs/status-change-control'
import type { Repair } from '@/features/repairs/queries'
import type { ApprovalStatus } from '@/features/repairs/pricing-rules'

type SavedPricing = {
  laborCharges: number
  additionalCharges: number
  taxPercent: number
}

type Props = {
  repair: Repair
  deviceSummary: string
  approvalStatus: ApprovalStatus | null
  savedPricing: SavedPricing
  hasIssuedInvoice: boolean
  onRefetch: () => void
}

export function RepairStatusApprovalPanel({
  repair,
  deviceSummary,
  approvalStatus,
  savedPricing,
  hasIssuedInvoice,
  onRefetch,
}: Props) {
  return (
    <div className="flex w-full min-w-0 shrink-0 flex-col gap-4 rounded-xl border border-border/80 bg-linear-to-b from-muted/40 to-muted/10 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md lg:max-w-sm">
      <StatusChangeControl
        repairId={repair.id}
        ticketNumber={repair.ticketNumber}
        currentStatus={repair.status}
        customerName={repair.customer.name}
        deviceSummary={deviceSummary}
        assignedTechnicianId={repair.assignedTechnicianId}
        finalTotal={repair.finalTotal}
        isPaidInFull={repair.isPaidInFull}
        approvalStatus={approvalStatus}
        onStatusUpdated={onRefetch}
      />
      <div className="h-px w-full bg-border/70" />
      <RequestApprovalControl
        repairId={repair.id}
        ticketNumber={repair.ticketNumber}
        customerName={repair.customer.name}
        deviceSummary={deviceSummary}
        diagnosis={repair.diagnosis}
        approval={repair.approval}
        currentStatus={repair.status}
        assignedTechnicianId={repair.assignedTechnicianId}
        parts={repair.parts ?? []}
        savedPricing={savedPricing}
        estimatedTotal={repair.estimatedTotal ?? null}
        intakeEstimatedCost={repair.estimatedCost}
        hasIssuedInvoice={hasIssuedInvoice}
        onRequested={onRefetch}
      />
    </div>
  )
}
