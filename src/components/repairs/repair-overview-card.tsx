'use client'

import { Card, CardContent } from '@/components/ui/card'
import { RepairExpectedCompletionCard } from '@/components/repairs/repair-expected-completion-card'
import { RepairIssueConditionGrid } from '@/components/repairs/repair-issue-condition-grid'
import { RepairLinkedCustomerCard } from '@/components/repairs/repair-linked-customer-card'
import { RepairLinkedDeviceCard } from '@/components/repairs/repair-linked-device-card'
import { RepairStatusApprovalPanel } from '@/components/repairs/repair-status-approval-panel'
import { RepairTechnicianCard } from '@/components/repairs/repair-technician-card'
import { RepairTicketIdentity } from '@/components/repairs/repair-ticket-identity'
import type { RepairDetailsAccess, RepairDetailsViewModel } from '@/features/repairs/repair-details-access'
import type { Repair, TechnicianUser } from '@/features/repairs/queries'

type Props = {
  repair: Repair
  access: RepairDetailsAccess
  view: RepairDetailsViewModel
  technicians: TechnicianUser[]
  selectedTechId: string
  isReassignPending: boolean
  expectedDateValue: string
  isEditingExpectedDate: boolean
  todayDateMin: string
  isExpectedDateSaving: boolean
  onSelectedTechChange: (id: string) => void
  onReassign: () => void
  onHoldReassign: (technicianId: string) => Promise<void>
  onExpectedDateChange: (value: string) => void
  onStartExpectedDateEdit: () => void
  onCancelExpectedDateEdit: () => void
  onSaveExpectedDate: () => void
  onRefetch: () => void
}

export function RepairOverviewCard({
  repair,
  access,
  view,
  technicians,
  selectedTechId,
  isReassignPending,
  expectedDateValue,
  isEditingExpectedDate,
  todayDateMin,
  isExpectedDateSaving,
  onSelectedTechChange,
  onReassign,
  onHoldReassign,
  onExpectedDateChange,
  onStartExpectedDateEdit,
  onCancelExpectedDateEdit,
  onSaveExpectedDate,
  onRefetch,
}: Props) {
  return (
    <Card className="w-full min-w-0 overflow-hidden border-border/80 shadow-sm">
      <CardContent className="flex w-full min-w-0 flex-col gap-4 pt-5 sm:gap-5 sm:pt-6">
        <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <RepairTicketIdentity repair={repair} />
          <RepairStatusApprovalPanel
            repair={repair}
            deviceSummary={view.deviceSummary}
            approvalStatus={view.approvalStatus}
            savedPricing={view.savedPricing}
            hasIssuedInvoice={view.hasIssuedInvoice}
            onRefetch={onRefetch}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
          <RepairLinkedDeviceCard
            device={repair.device}
            repairId={repair.id}
            canConfirmModel={view.canConfirmModel}
            onModelConfirmed={onRefetch}
          />
          <RepairLinkedCustomerCard customer={repair.customer} />
          <RepairTechnicianCard
            repair={repair}
            technicians={technicians}
            canReassign={access.canReassignTechnician}
            selectedTechId={selectedTechId}
            isReassignPending={isReassignPending}
            onSelectedTechChange={onSelectedTechChange}
            onSave={onReassign}
            onHoldReassign={onHoldReassign}
          />
          <RepairExpectedCompletionCard
            expectedCompletionDate={repair.expectedCompletionDate}
            isOverdue={repair.isOverdue}
            canEdit={access.canEditExpectedDate}
            isEditing={isEditingExpectedDate}
            value={expectedDateValue}
            minDate={todayDateMin}
            isSaving={isExpectedDateSaving}
            onValueChange={onExpectedDateChange}
            onStartEdit={onStartExpectedDateEdit}
            onCancelEdit={onCancelExpectedDateEdit}
            onSave={onSaveExpectedDate}
          />
        </div>

        <RepairIssueConditionGrid
          problemDescription={repair.problemDescription}
          issueDescription={repair.issueDescription}
          initialCondition={repair.initialCondition}
        />
      </CardContent>
    </Card>
  )
}
