'use client'

import * as React from 'react'
import { AlertCircle, ChevronDown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { apiClient } from '@/lib/api-client'
import { authClient } from '@/lib/auth-client'

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
  modelVerified: boolean
  onStatusUpdated?: () => void
}

export function StatusChangeControl({
  repairId,
  currentStatus,
  modelVerified,
  onStatusUpdated,
}: StatusChangeControlProps) {
  const { data: session } = authClient.useSession()
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'OWNER'
  const isTechnician = userRole === 'TECHNICIAN'

  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  if (!isTechnician) {
    return (
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span>Status updates are reserved for Technicians.</span>
      </div>
    )
  }

  const isTransitionBlocked =
    currentStatus === 'DIAGNOSING' &&
    selectedStatus === 'WAITING_FOR_APPROVAL' &&
    !modelVerified

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setSelectedStatus(newStatus)
    setValidationError(null)

    if (currentStatus === 'DIAGNOSING' && newStatus === 'WAITING_FOR_APPROVAL' && !modelVerified) {
      setValidationError('Confirm the device model before sending an estimate')
    }
  }

  const handleUpdate = async () => {
    setValidationError(null)

    if (isTransitionBlocked) {
      setValidationError('Confirm the device model before sending an estimate')
      return
    }

    setIsUpdating(true)
    try {
      await apiClient.patch(`repairs/${repairId}/status`, { status: selectedStatus })
      toast.success(`Repair status updated to ${STATUS_LABELS[selectedStatus]}`)
      if (onStatusUpdated) onStatusUpdated()
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string }
      const msg =
        errorObj?.response?.data?.error?.message ||
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to update status'
      setValidationError(msg)
      toast.error(msg)
    } finally {
      setIsUpdating(false)
    }
  }

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
            {ALL_STATUSES.map((status) => (
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
          disabled={isUpdating || selectedStatus === currentStatus || isTransitionBlocked}
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
