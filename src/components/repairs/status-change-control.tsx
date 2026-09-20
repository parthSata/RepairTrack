'use client'

import * as React from 'react'
import { AlertCircle, Lock, RefreshCw } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useReopenRepair } from '@/features/repairs/mutations'
import {
  getAllowedManualStatusDestinations,
  getManualStatusTransitionError,
} from '@/features/repairs/status-transitions'
import { getRepairStatusLabel, getRepairStatusTone } from '@/features/repairs/status-ui'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

interface StatusChangeControlProps {
  repairId: string
  ticketNumber: string
  currentStatus: string
  customerName: string
  deviceSummary: string
  assignedTechnicianId?: string | null
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
  const canReopenCancelled = isOwner && currentStatus === 'CANCELLED'
  const isClosed = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED'
  const isAwaitingCustomerApproval = currentStatus === 'WAITING_FOR_APPROVAL'
  const reopenMutation = useReopenRepair(repairId)

  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus)
  const [prevStatus, setPrevStatus] = React.useState(currentStatus)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [reopenReason, setReopenReason] = React.useState('')
  const [reopenDialogOpen, setReopenDialogOpen] = React.useState(false)

  if (prevStatus !== currentStatus) {
    setPrevStatus(currentStatus)
    setSelectedStatus(currentStatus)
    setReopenReason('')
    setReopenDialogOpen(false)
  }

  const isManualApprovalTransition =
    selectedStatus === 'WAITING_FOR_APPROVAL' && currentStatus !== 'WAITING_FOR_APPROVAL'

  const selectableStatuses = getAllowedManualStatusDestinations(currentStatus)

  const handleStatusSelect = (newStatus: string) => {
    setSelectedStatus(newStatus)
    setValidationError(null)

    const transitionError = getManualStatusTransitionError(currentStatus, newStatus)
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

    const transitionError = getManualStatusTransitionError(currentStatus, selectedStatus)
    if (transitionError) {
      setValidationError(transitionError)
      return
    }

    if (isManualApprovalTransition) {
      setValidationError('Use Request Customer Approval to send an estimate for approval.')
      return
    }

    setIsUpdating(true)
    try {
      await apiClient.patch(`repairs/${repairId}/status`, { status: selectedStatus })
      toast.success(`Repair status updated to ${getRepairStatusLabel(selectedStatus)}`)
      if (onStatusUpdated) onStatusUpdated()
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string; error?: { message?: string } } }
        message?: string
      }
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.response?.data?.error?.message ||
        errorObj?.message ||
        'Failed to update status'
      setValidationError(msg)
      toast.error(msg)
    } finally {
      setIsUpdating(false)
    }
  }

  const trimmedReopenReason = reopenReason.trim()
  const isReopenReasonEmpty = trimmedReopenReason.length === 0

  const handleReopen = async () => {
    setValidationError(null)
    try {
      await reopenMutation.mutateAsync({ reason: trimmedReopenReason || undefined })
      setReopenDialogOpen(false)
      setReopenReason('')
      if (onStatusUpdated) onStatusUpdated()
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string; error?: { message?: string } } }
        message?: string
      }
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.response?.data?.error?.message ||
        errorObj?.message ||
        'Failed to reopen ticket'
      setValidationError(msg)
    }
  }

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

  const showReadOnlyClosedMessage = isClosed && !canReopenCompleted && !canReopenCancelled

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
          Ticket is closed. Only Owner or Staff can reopen completed tickets, and only Owner can
          reopen cancelled tickets.
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
              value={selectedStatus}
              onValueChange={handleStatusSelect}
              disabled={isUpdating}
            >
              <SelectTrigger id={`status-select-${repairId}`} className="flex-1 text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {selectableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getRepairStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="accent"
              onClick={handleUpdate}
              disabled={isUpdating || selectedStatus === currentStatus || isManualApprovalTransition}
              className="h-10 shrink-0 px-4 text-xs font-semibold sm:min-w-[8.5rem]"
            >
              {isUpdating ? 'Updating…' : 'Update'}
            </Button>
          </div>
        </div>

        {validationError && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    )
  }

  if (canReopenCompleted || canReopenCancelled || isOwner) {
    const dialogTitle =
      currentStatus === 'COMPLETED' ? 'Reopen Repair Ticket?' : 'Reopen Cancelled Repair Ticket?'
    const dialogDescription =
      currentStatus === 'COMPLETED'
        ? 'This repair ticket has been completed. Reopening it will return the ticket to the active repair workflow.'
        : 'This repair ticket is currently cancelled. Reopening it will restore it to the repair workflow.'
    const nextStatusLabel = currentStatus === 'COMPLETED' ? 'Diagnosing' : 'In Repair'

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <StatusChip status={currentStatus} />

          {(canReopenCompleted || canReopenCancelled) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setValidationError(null)
                setReopenReason('')
                setReopenDialogOpen(true)
              }}
              className="h-8 gap-1.5 border-amber-300 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reopen
            </Button>
          )}
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

        <AlertDialog
          open={reopenDialogOpen}
          onOpenChange={setReopenDialogOpen}
          contentClassName="max-w-xl p-6 sm:p-8"
        >
          <AlertDialogHeader className="mb-5">
            <AlertDialogTitle className="text-xl">{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              {dialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-5 sm:grid-cols-2 sm:p-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ticket Number
                </Label>
                <p className="text-sm font-semibold text-foreground">#{ticketNumber}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current Status
                </Label>
                <p className="text-sm font-semibold text-foreground">
                  {getRepairStatusLabel(currentStatus)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Customer
                </Label>
                <p className="text-sm text-foreground">{customerName}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Device
                </Label>
                <p className="text-sm text-foreground">{deviceSummary}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`reopen-reason-${repairId}`}
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Reason for reopening <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`reopen-reason-${repairId}`}
                placeholder="Customer reported the same issue again..."
                value={reopenReason}
                onChange={(event) => setReopenReason(event.target.value)}
                rows={4}
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Reopening will move this repair back to <strong>{nextStatusLabel}</strong>.
              </p>
            </div>
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel disabled={reopenMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReopen}
              disabled={reopenMutation.isPending || isReopenReasonEmpty}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {reopenMutation.isPending ? 'Reopening...' : 'Reopen Ticket'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialog>
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
