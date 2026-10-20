'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CustomerTrackingSection } from '@/components/repairs/customer-tracking-section'
import { EstimatePricingPanel } from '@/components/repairs/estimate-pricing-panel'
import { ModelConfirmationCard } from '@/components/repairs/model-confirmation-card'
import { PaymentSummaryCard } from '@/components/repairs/payment-summary-card'
import { RepairDiagnosisSection } from '@/components/repairs/repair-diagnosis-section'
import { RepairDetailsError, RepairDetailsLoading } from '@/components/repairs/repair-details-states'
import { RepairEmailsCard } from '@/components/repairs/repair-emails-card'
import { RepairInvoiceAction } from '@/components/repairs/repair-invoice-action'
import { RepairNotesSection } from '@/components/repairs/repair-notes-section'
import { RepairOverviewCard } from '@/components/repairs/repair-overview-card'
import { RepairPartsSection } from '@/components/repairs/repair-parts-section'
import { RepairPhotosSection } from '@/components/repairs/repair-photos-section'
import { StatusHistoryTimeline } from '@/components/repairs/status-history-timeline'
import { useRepairDetails } from '@/features/repairs/use-repair-details'
import { Button } from '@/components/ui/button'

export function RepairDetails({ id }: { id: string }) {
  const details = useRepairDetails(id)

  if (details.isLoading) {
    return <RepairDetailsLoading />
  }

  if (details.isError || !details.repair || !details.access || !details.view) {
    return (
      <RepairDetailsError
        message={details.error instanceof Error ? details.error.message : undefined}
        onRetry={() => void details.refetch()}
      />
    )
  }

  const { repair, access, view } = details

  return (
    <div className="page-enter flex w-full min-w-0 flex-col gap-6">
      <header className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/repairs" className="w-fit">
          <Button
            variant="ghost"
            className="h-9 -ml-3 gap-2 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Repair Tickets
          </Button>
        </Link>
      </header>

      {view.showModelConfirmationCard ? (
        <ModelConfirmationCard device={repair.device} onConfirmed={() => void details.refetch()} />
      ) : null}

      <RepairOverviewCard
        repair={repair}
        access={access}
        view={view}
        technicians={details.technicians}
        selectedTechId={details.selectedTechId}
        isReassignPending={details.reassignMutation.isPending}
        expectedDateValue={details.expectedDateValue}
        isEditingExpectedDate={details.isEditingExpectedDate}
        todayDateMin={details.todayDateMin}
        isExpectedDateSaving={details.updateExpectedDateMutation.isPending}
        onSelectedTechChange={details.setSelectedTechId}
        onReassign={() => void details.handleReassign()}
        onHoldReassign={details.handleHoldReassign}
        onExpectedDateChange={details.setExpectedDateValue}
        onStartExpectedDateEdit={() => details.setIsEditingExpectedDate(true)}
        onCancelExpectedDateEdit={() => details.setIsEditingExpectedDate(false)}
        onSaveExpectedDate={() => void details.handleSaveExpectedDate()}
        onRefetch={() => void details.refetch()}
      />

      {repair.photos ? <RepairPhotosSection repairId={repair.id} photos={repair.photos} /> : null}

      {access.canShowCustomerTracking ? (
        <CustomerTrackingSection
          repairId={repair.id}
          trackingToken={repair.trackingToken}
          onRegenerated={() => void details.refetch()}
        />
      ) : null}

      <RepairDiagnosisSection
        diagnosis={repair.diagnosis}
        canEdit={access.canEditDiagnosisAndNotes}
        isEditing={details.isDiagnosisEditing}
        draft={details.diagnosisText}
        isSaving={details.diagnosisMutation.isPending}
        onDraftChange={details.setDiagnosisText}
        onStartEdit={() => details.setIsDiagnosisEditing(true)}
        onCancel={details.handleCancelDiagnosisEdit}
        onSave={() => void details.handleSaveDiagnosis()}
      />

      <RepairPartsSection
        repairId={id}
        parts={repair.parts ?? []}
        canEdit={access.canRecordParts}
        lockedReason={view.partsLockedReason}
      />

      {view.pricingPanelMode !== 'hidden' ? (
        <EstimatePricingPanel
          repairId={id}
          mode={view.pricingPanelMode}
          status={repair.status}
          approvalStatus={view.approvalStatus}
          parts={repair.parts ?? []}
          {...view.savedPricing}
          estimatedTotal={repair.estimatedTotal ?? null}
          finalTotal={repair.finalTotal ?? null}
          isInvoiced={view.hasIssuedInvoice}
          onUnlockedChange={details.setIsPricingUnlocked}
        />
      ) : null}

      <RepairInvoiceAction
        repairId={id}
        userRole={details.userRole}
        finalTotal={repair.finalTotal ?? null}
        invoices={repair.invoices ?? []}
      />

      <PaymentSummaryCard
        repairId={id}
        ticketNumber={repair.ticketNumber}
        userRole={details.userRole}
        repairStatus={repair.status}
        hasFinalBill={repair.finalTotal != null}
      />

      <RepairEmailsCard repairId={id} userRole={details.userRole} />

      <RepairNotesSection
        notes={repair.notes ?? []}
        canEdit={access.canEditDiagnosisAndNotes}
        draft={details.newNoteText}
        isAdding={details.addNoteMutation.isPending}
        onDraftChange={details.setNewNoteText}
        onSubmit={(e) => void details.handleAddNote(e)}
      />

      <StatusHistoryTimeline items={repair.statusHistory} />
    </div>
  )
}
