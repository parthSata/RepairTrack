'use client'

import * as React from 'react'
import { AlertCircle, ChevronDown, Lock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
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
  currentStatus: string
  assignedTechnicianId?: string | null
  onStatusUpdated?: () => void
}

export function StatusChangeControl({
  repairId,
  currentStatus,
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
  const isClosed = ['COMPLETED', 'CANCELLED'].includes(currentStatus)
  const isAwaitingCustomerApproval = currentStatus === 'WAITING_FOR_APPROVAL'

  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus)
  const [prevStatus, setPrevStatus] = React.useState(currentStatus)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [reopenNote, setReopenNote] = React.useState('')
  const [showReopenInput, setShowReopenInput] = React.useState(false)

  if (prevStatus !== currentStatus) {
    setPrevStatus(currentStatus)
    setSelectedStatus(currentStatus)
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

  const handleReopen = async () => {
    setValidationError(null)
    setIsUpdating(true)
    try {
      await apiClient.post(`repairs/${repairId}/reopen`, { note: reopenNote || undefined })
      toast.success('Repair ticket reopened successfully!')
      setShowReopenInput(false)
      setReopenNote('')
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
      toast.error(msg)
    } finally {
      setIsUpdating(false)
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

  // Owner View: Read-only status badge + Reopen button if COMPLETED/CANCELLED
  if (isOwner) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted border border-border text-foreground">
            {STATUS_LABELS[currentStatus] || currentStatus}
          </span>

          {isClosed && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReopenInput(!showReopenInput)}
              className="h-8 text-xs font-semibold gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reopen Ticket
            </Button>
          )}
        </div>

        {showReopenInput && (
          <div className="p-3 rounded-md border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-2 animate-in fade-in duration-150">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
              Reopen this closed ticket? Reopening sets status back to &quot;In Repair&quot;.
            </p>
            <input
              type="text"
              placeholder="Reason for reopening (optional)..."
              value={reopenNote}
              onChange={(e) => setReopenNote(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-amber-300 bg-background focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowReopenInput(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleReopen}
                disabled={isUpdating}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isUpdating ? 'Reopening...' : 'Confirm Reopen'}
              </Button>
            </div>
          </div>
        )}

        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Lock className="h-3 w-3 shrink-0" />
          <span>
            Owner manages the shop by reassigning, not by editing ticket state directly.
          </span>
        </div>

        {validationError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    )
  }

  if (isClosed) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted border border-border text-foreground">
            {STATUS_LABELS[currentStatus] || currentStatus}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ticket is closed ({currentStatus.toLowerCase()}). Only Owner can reopen closed tickets.
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

  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span>Only assigned technician or staff can change repair status.</span>
    </div>
  )
}
