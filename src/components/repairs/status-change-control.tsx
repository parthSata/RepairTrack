'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertCircle, FileText, Lock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertDialogCancel } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage } from '@/lib/api-error'
import { useReopenRepair } from '@/features/repairs/mutations'
import { formatINR, paiseToRupees } from '@/features/repairs/money'
import { getRecoveryCase } from '@/features/repairs/recovery-eligibility'
import type { RepairInvoiceSummary } from '@/features/repairs/queries'
import {
  getCompletedLockHint,
  getManualStatusSelectOptions,
  getManualStatusTransitionError,
  isPostApprovalPhase,
} from '@/features/repairs/status-transitions'
import { getRepairStatusLabel, getRepairStatusTone } from '@/features/repairs/status-ui'
import { CANCELLATION_REASON_MIN } from '@/features/invoices/schemas'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import {
  RecoveryDialogShell,
  RecoveryMoneyBand,
  RecoveryWhatWillHappen,
} from '@/components/repairs/recovery-dialog-shell'

interface StatusChangeControlProps {
  repairId: string
  ticketNumber: string
  currentStatus: string
  customerName: string
  deviceSummary: string
  assignedTechnicianId?: string | null
  finalTotal?: number | null
  isPaidInFull?: boolean
  approvalStatus?: string | null
  issuedInvoice?: RepairInvoiceSummary | null
  lifetimeTotalPaid?: number
  onStatusUpdated?: () => void
}

function StatusChip({ status }: { status: string }) {
  const tone = getRepairStatusTone(status)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-tight',
        tone.chip,
      )}
    >
      {getRepairStatusLabel(status)}
    </span>
  )
}

export function StatusChangeControl({
  repairId,
  ticketNumber,
  currentStatus,
  customerName,
  deviceSummary,
  assignedTechnicianId,
  finalTotal = null,
  isPaidInFull = false,
  approvalStatus = null,
  issuedInvoice = null,
  lifetimeTotalPaid = 0,
  onStatusUpdated,
}: StatusChangeControlProps) {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'OWNER'
  const userId = session?.user?.id

  const isOwner = userRole === 'OWNER'
  const isStaff = userRole === 'STAFF'
  const isAssignedTechnician = userRole === 'TECHNICIAN' && assignedTechnicianId === userId

  const canChangeStatus =
    (isStaff || isAssignedTechnician) && !['COMPLETED', 'CANCELLED'].includes(currentStatus)
  const canReopenCompleted = ['OWNER', 'STAFF'].includes(userRole) && currentStatus === 'COMPLETED'
  const canRestoreCancelled = ['OWNER', 'STAFF'].includes(userRole) && currentStatus === 'CANCELLED'
  const isClosed = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED'
  const isAwaitingCustomerApproval = currentStatus === 'WAITING_FOR_APPROVAL'
  const reopenMutation = useReopenRepair(repairId)

  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus)
  const [prevStatus, setPrevStatus] = React.useState(currentStatus)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [reopenReason, setReopenReason] = React.useState('')
  const [invoiceCancelReason, setInvoiceCancelReason] = React.useState('')
  const [reopenDialogOpen, setReopenDialogOpen] = React.useState(false)

  if (prevStatus !== currentStatus) {
    setPrevStatus(currentStatus)
    setSelectedStatus(currentStatus)
    setReopenReason('')
    setInvoiceCancelReason('')
    setReopenDialogOpen(false)
  }

  const isManualApprovalTransition =
    selectedStatus === 'WAITING_FOR_APPROVAL' && currentStatus !== 'WAITING_FOR_APPROVAL'

  const transitionOptions = { finalTotal, isPaidInFull, approvalStatus }
  const inPostApproval = isPostApprovalPhase(currentStatus, approvalStatus)
  const completedLockHint = getCompletedLockHint(currentStatus, transitionOptions)
  const statusOptions = getManualStatusSelectOptions(currentStatus, transitionOptions)
  const selectValue = statusOptions.includes(
    selectedStatus as (typeof statusOptions)[number],
  )
    ? selectedStatus
    : undefined

  const recoveryCase = getRecoveryCase({ issuedInvoice, lifetimeTotalPaid })
  const isRestore = currentStatus === 'CANCELLED'
  const actionVerb = isRestore ? 'restore' : 'reopen'
  const actionGerund = isRestore ? 'restoring' : 'reopening'

  const handleStatusSelect = (newStatus: string) => {
    setSelectedStatus(newStatus)
    setValidationError(null)
    if (newStatus === currentStatus) return

    const transitionError = getManualStatusTransitionError(
      currentStatus,
      newStatus,
      transitionOptions,
    )
    if (transitionError) {
      setValidationError(transitionError)
    }
  }

  const handleUpdate = async () => {
    setValidationError(null)

    if (isOwner) {
      setValidationError(
        'Owner cannot change repair status directly. Status changes belong to staff and technicians.',
      )
      return
    }

    const transitionError = getManualStatusTransitionError(
      currentStatus,
      selectedStatus,
      transitionOptions,
    )
    if (transitionError) {
      setValidationError(transitionError)
      return
    }

    setIsUpdating(true)
    try {
      await apiClient.patch(`repairs/${repairId}/status`, { status: selectedStatus })
      toast.success(`Repair status updated to ${getRepairStatusLabel(selectedStatus)}`)
      if (onStatusUpdated) onStatusUpdated()
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to update status')
      setValidationError(msg)
      toast.error(msg)
    } finally {
      setIsUpdating(false)
    }
  }

  const trimmedReopenReason = reopenReason.trim()
  const trimmedInvoiceCancelReason = invoiceCancelReason.trim()
  const isReopenReasonEmpty = trimmedReopenReason.length === 0
  const isInvoiceCancelReasonInvalid =
    recoveryCase === 'B' && trimmedInvoiceCancelReason.length < CANCELLATION_REASON_MIN

  const openRecoveryDialog = () => {
    setValidationError(null)
    setReopenReason('')
    setInvoiceCancelReason('')
    setReopenDialogOpen(true)
  }

  const handleRecover = async () => {
    setValidationError(null)
    if (recoveryCase === 'C') return
    if (isReopenReasonEmpty) return
    if (isInvoiceCancelReasonInvalid) return

    try {
      await reopenMutation.mutateAsync({
        reason: trimmedReopenReason,
        action: isRestore ? 'restore' : 'reopen',
        ...(recoveryCase === 'B'
          ? { invoiceCancellationReason: trimmedInvoiceCancelReason }
          : {}),
      })
      setReopenDialogOpen(false)
      setReopenReason('')
      setInvoiceCancelReason('')
      if (onStatusUpdated) onStatusUpdated()
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to update repair ticket')
      setValidationError(msg)
    }
  }

  const paidLabel = formatINR(paiseToRupees(lifetimeTotalPaid))
  const balancePaise =
    finalTotal == null ? 0 : Math.max(finalTotal - lifetimeTotalPaid, 0)
  const balanceLabel = formatINR(paiseToRupees(balancePaise))

  if (isAwaitingCustomerApproval) {
    return (
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <StatusChip status={currentStatus} />
        </div>
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Locked until the customer responds on their tracking page.</span>
        </p>
      </div>
    )
  }

  const showReadOnlyClosedMessage = isClosed && !canReopenCompleted && !canRestoreCancelled

  if (showReadOnlyClosedMessage) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <StatusChip status={currentStatus} />
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Ticket is closed. Only Owner and Staff can reopen completed tickets or restore cancelled tickets.
        </p>
      </div>
    )
  }

  if (canChangeStatus) {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label
            htmlFor={`status-select-${repairId}`}
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            Update status
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Select
              value={selectValue}
              onValueChange={handleStatusSelect}
              disabled={isUpdating}
            >
              <SelectTrigger id={`status-select-${repairId}`} className="flex-1 text-sm">
                <SelectValue placeholder="Select next status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => {
                  const isCompletedLocked = status === 'COMPLETED' && completedLockHint !== null
                  return (
                    <SelectItem key={status} value={status} disabled={isCompletedLocked}>
                      {isCompletedLocked
                        ? `${getRepairStatusLabel(status)} (${completedLockHint})`
                        : getRepairStatusLabel(status)}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="accent"
              onClick={handleUpdate}
              disabled={
                isUpdating ||
                selectedStatus === currentStatus ||
                isManualApprovalTransition ||
                (selectedStatus === 'COMPLETED' && completedLockHint !== null)
              }
              className="h-10 shrink-0 px-4 text-xs font-semibold sm:min-w-34"
            >
              {isUpdating ? 'Updating…' : 'Update'}
            </Button>
          </div>
        </div>

        {!inPostApproval && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Repair statuses unlock after the customer approves the estimate.</span>
          </p>
        )}

        {completedLockHint === 'record payment first' && (
          <p className="page-enter flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Completed unlocks once owner or staff record the full payment for the final bill.</span>
          </p>
        )}

        {validationError && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    )
  }

  if (canReopenCompleted || canRestoreCancelled) {
    const caseATitle = isRestore ? 'Restore Repair' : 'Reopen Repair'
    const caseADescription = isRestore
      ? 'This repair was cancelled previously. Restoring it will move the repair back to Diagnosing.'
      : 'This repair is currently completed. Reopening it will move the repair back to Diagnosing.'
    const caseBTitle = isRestore
      ? 'Cancel invoice and restore repair?'
      : 'Cancel invoice and reopen repair?'
    const caseBDescription = isRestore
      ? 'The repair has an outstanding issued invoice. To restore this ticket for a new repair cycle, the invoice must be cancelled first.'
      : 'The repair has an outstanding issued invoice. To reopen this ticket for a new repair cycle, the invoice must be cancelled first.'
    const caseCTitle = isRestore
      ? 'Cannot restore until reconciliation'
      : 'Cannot reopen until reconciliation'
    const caseCDescription = `This repair has an issued invoice with recorded payments (Paid ${paidLabel} · Balance ${balanceLabel}). Cancelling that invoice from here would not safely handle those payments.`

    const primaryDisabled =
      reopenMutation.isPending ||
      (recoveryCase !== 'C' && isReopenReasonEmpty) ||
      isInvoiceCancelReasonInvalid

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <StatusChip status={currentStatus} />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openRecoveryDialog}
            className="h-8 gap-1.5 border-amber-300 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {isRestore ? 'Restore' : 'Reopen'}
          </Button>
        </div>

        {isOwner && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" />
            <span>Owner manages the shop by reassigning, not by editing ticket state.</span>
          </div>
        )}

        {validationError && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {recoveryCase === 'A' && (
          <RecoveryDialogShell
            open={reopenDialogOpen}
            onOpenChange={setReopenDialogOpen}
            icon={RefreshCw}
            title={caseATitle}
            description={caseADescription}
            ticketNumber={ticketNumber}
            statusLabel={getRepairStatusLabel(currentStatus)}
            customerName={customerName}
            deviceSummary={deviceSummary}
            footer={
              <>
                <AlertDialogCancel disabled={reopenMutation.isPending}>Cancel</AlertDialogCancel>
                <Button
                  type="button"
                  disabled={primaryDisabled}
                  onClick={handleRecover}
                  className="h-10 bg-amber-600 px-4 text-sm font-medium text-white hover:bg-amber-700"
                >
                  {reopenMutation.isPending
                    ? isRestore
                      ? 'Restoring…'
                      : 'Reopening…'
                    : isRestore
                      ? 'Restore Repair'
                      : 'Reopen Repair'}
                </Button>
              </>
            }
          >
            <div className="space-y-2">
              <Label
                htmlFor={`reopen-reason-${repairId}`}
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Reason for {actionGerund} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`reopen-reason-${repairId}`}
                placeholder={
                  isRestore
                    ? 'Customer requested the repair to resume...'
                    : 'Customer reported the same issue again...'
                }
                value={reopenReason}
                onChange={(event) => setReopenReason(event.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>
          </RecoveryDialogShell>
        )}

        {recoveryCase === 'B' && (
          <RecoveryDialogShell
            open={reopenDialogOpen}
            onOpenChange={setReopenDialogOpen}
            icon={FileText}
            title={caseBTitle}
            description={caseBDescription}
            ticketNumber={ticketNumber}
            statusLabel={getRepairStatusLabel(currentStatus)}
            customerName={customerName}
            deviceSummary={deviceSummary}
            footer={
              <>
                <AlertDialogCancel disabled={reopenMutation.isPending}>Cancel</AlertDialogCancel>
                <Button
                  type="button"
                  disabled={primaryDisabled}
                  onClick={handleRecover}
                  className="h-10 bg-amber-600 px-4 text-sm font-medium text-white hover:bg-amber-700"
                >
                  {reopenMutation.isPending
                    ? isRestore
                      ? 'Cancelling & restoring…'
                      : 'Cancelling & reopening…'
                    : isRestore
                      ? 'Cancel Invoice & Restore'
                      : 'Cancel Invoice & Reopen'}
                </Button>
              </>
            }
          >
            <RecoveryWhatWillHappen
              items={[
                "The existing invoice will be marked cancelled using RepairTrack's normal cancellation process.",
                'The invoice number and historical record will be retained.',
                'The repair will return to DIAGNOSING.',
                'A new invoice can be created later through the normal workflow.',
              ]}
            />
            {issuedInvoice ? (
              <p className="text-xs text-muted-foreground">
                Outstanding invoice{' '}
                <span className="font-medium text-foreground">#{issuedInvoice.invoiceNumber}</span>
              </p>
            ) : null}
            <div className="space-y-2">
              <Label
                htmlFor={`invoice-cancel-reason-${repairId}`}
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Invoice cancellation reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`invoice-cancel-reason-${repairId}`}
                placeholder="Why this invoice is being cancelled for a new repair cycle..."
                value={invoiceCancelReason}
                onChange={(event) => setInvoiceCancelReason(event.target.value)}
                rows={3}
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Separate from the recovery reason below. At least {CANCELLATION_REASON_MIN} characters.
              </p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={`reopen-reason-b-${repairId}`}
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Repair recovery reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`reopen-reason-b-${repairId}`}
                placeholder={
                  isRestore
                    ? 'Customer requested the repair to resume...'
                    : 'Customer reported the same issue again...'
                }
                value={reopenReason}
                onChange={(event) => setReopenReason(event.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          </RecoveryDialogShell>
        )}

        {recoveryCase === 'C' && (
          <RecoveryDialogShell
            open={reopenDialogOpen}
            onOpenChange={setReopenDialogOpen}
            tone="warning"
            icon={Lock}
            title={caseCTitle}
            description={caseCDescription}
            ticketNumber={ticketNumber}
            statusLabel={getRepairStatusLabel(currentStatus)}
            customerName={customerName}
            deviceSummary={deviceSummary}
            footer={
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Link
                  href={
                    issuedInvoice ? `/invoices/${issuedInvoice.id}` : `/repairs/${repairId}`
                  }
                  onClick={() => setReopenDialogOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-4 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/70"
                >
                  Review Invoice & Payments
                </Link>
              </>
            }
          >
            <RecoveryMoneyBand paidLabel={paidLabel} balanceLabel={balanceLabel} />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Payments stay on the ticket history and do <strong className="font-medium text-foreground">not</strong>{' '}
              pay a new-cycle bill. Cancel the invoice and reconcile from Invoice / Payments first, then{' '}
              {actionVerb}.
            </p>
            {issuedInvoice ? (
              <p className="text-xs text-muted-foreground">
                Issued invoice{' '}
                <span className="font-medium text-foreground">#{issuedInvoice.invoiceNumber}</span>
              </p>
            ) : null}
          </RecoveryDialogShell>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5 shrink-0" />
      <span>Only assigned technician or staff can change repair status.</span>
    </div>
  )
}
