'use client'

import * as React from 'react'
import { AlertCircle, ChevronDown, Lock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useSession } from '@/lib/auth-client'

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  DIAGNOSING: 'Diagnosing',
  WAITING_FOR_APPROVAL: 'Waiting for Approval',
  APPROVED: 'Approved',
  WAITING_FOR_PARTS: 'Waiting for Parts',
  IN_REPAIR: 'In Repair',
  QUALITY_CHECK: 'Quality Check',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const ALL_STATUSES = [
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_FOR_APPROVAL',
  'APPROVED',
  'WAITING_FOR_PARTS',
  'IN_REPAIR',
  'QUALITY_CHECK',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
] as const

interface StatusChangeControlProps {
  repairId: string
  ticketNumber: string
  currentStatus: string
  customerName: string
  deviceSummary: string
  assignedTechnicianId?: string | null
  onStatusUpdated?: () => void
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

  const selectableStatuses = ALL_STATUSES.filter(
    (status) => status !== 'WAITING_FOR_APPROVAL' || status === currentStatus,
  )

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setSelectedStatus(newStatus)
    setValidationError(null)

    if (newStatus === 'WAITING_FOR_APPROVAL' && currentStatus !== 'WAITING_FOR_APPROVAL') {
      setValidationError('Use Request Customer Approval to send an estimate for approval.')
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

    if (isManualApprovalTransition) {
      setValidationError('Use Request Customer Approval to send an estimate for approval.')
      return
    }

    setIsUpdating(true)
    try {
      await apiClient.patch(`repairs/${repairId}/status`, { status: selectedStatus })
      toast.success(`Repair status updated to ${STATUS_LABELS[selectedStatus]}`)
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
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Waiting for Approval
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
          <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Status is locked until the customer responds on their tracking page.</span>
        </p>
      </div>
    )
  }

  const showReadOnlyClosedMessage = isClosed && !canReopenCompleted && !canReopenCancelled

  if (showReadOnlyClosedMessage) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted border border-border text-foreground">
            {STATUS_LABELS[currentStatus] || currentStatus}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ticket is closed ({currentStatus.toLowerCase()}). Only Owner or Staff can reopen completed
          tickets, and only Owner can reopen cancelled tickets.
        </p>
      </div>
    )
  }

  if (canChangeStatus) {
    return (
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              disabled={isUpdating}
              className="w-full h-9 rounded-md border border-input bg-background pl-3 pr-8 text-xs font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none"
            >
              {selectableStatuses.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          <Button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating || selectedStatus === currentStatus || isManualApprovalTransition}
            className="h-9 px-4 text-xs font-semibold"
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </div>

        {validationError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium animate-in fade-in duration-200">
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
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted border border-border text-foreground">
            {STATUS_LABELS[currentStatus] || currentStatus}
          </span>

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
              className="h-8 text-xs font-semibold gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reopen Ticket
            </Button>
          )}
        </div>

        {isOwner && (
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3 shrink-0" />
            <span>
              Owner manages the shop by reassigning, not by editing ticket state directly.
            </span>
          </div>
        )}

        {validationError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
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
                  {STATUS_LABELS[currentStatus] || currentStatus}
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
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span>Only assigned technician or staff can change repair status.</span>
    </div>
  )
}
