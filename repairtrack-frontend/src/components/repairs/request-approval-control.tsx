'use client'

import * as React from 'react'
import { AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ApprovalEstimateSummary } from '@/components/repairs/approval-estimate-summary'
import { useRequestCustomerApproval } from '@/features/repairs/mutations'
import type { RepairApproval } from '@/features/repairs/queries'
import { useSession } from '@/lib/auth-client'

function getDisabledReason({
  diagnosis,
  estimatedCost,
  approval,
}: {
  diagnosis: string | null
  estimatedCost: number | null
  approval: RepairApproval | null | undefined
}): string | null {
  if (!diagnosis?.trim()) {
    return 'Add a diagnosis before requesting customer approval'
  }
  if (estimatedCost === null) {
    return 'Set an estimated cost (₹) before requesting customer approval'
  }
  if (approval?.status === 'PENDING') {
    return 'Customer approval is already pending for this repair'
  }
  return null
}

interface RequestApprovalControlProps {
  repairId: string
  diagnosis: string | null
  estimatedCost: number | null
  approval: RepairApproval | null | undefined
  currentStatus: string
  assignedTechnicianId?: string | null
  onRequested?: () => void
}

export function RequestApprovalControl({
  repairId,
  diagnosis,
  estimatedCost,
  approval,
  currentStatus,
  assignedTechnicianId,
  onRequested,
}: RequestApprovalControlProps) {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'OWNER'
  const userId = session?.user?.id

  const isStaff = userRole === 'STAFF'
  const isAssignedTechnician = userRole === 'TECHNICIAN' && assignedTechnicianId === userId
  const isClosed = ['COMPLETED', 'CANCELLED'].includes(currentStatus)
  const canRequestApproval = (isStaff || isAssignedTechnician) && !isClosed

  const requestMutation = useRequestCustomerApproval(repairId)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  if (!canRequestApproval) {
    return null
  }

  const disabledReason = getDisabledReason({ diagnosis, estimatedCost, approval })
  const isReady = !disabledReason
  const isDisabled = Boolean(disabledReason) || requestMutation.isPending

  const handleConfirm = async () => {
    setErrorMessage(null)
    try {
      await requestMutation.mutateAsync()
      setConfirmOpen(false)
      if (onRequested) onRequested()
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string; error?: { message?: string } } }
        message?: string
      }
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.response?.data?.error?.message ||
        errorObj?.message ||
        'Failed to request customer approval'
      setErrorMessage(msg)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={isReady ? 'default' : 'outline'}
        size="sm"
        disabled={isDisabled}
        onClick={() => {
          setErrorMessage(null)
          setConfirmOpen(true)
        }}
        className={
          isReady
            ? 'h-9 w-full sm:w-auto text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
            : 'h-9 w-full sm:w-auto text-xs font-semibold gap-1.5'
        }
      >
        <Send className="h-3.5 w-3.5" />
        {requestMutation.isPending ? 'Requesting...' : 'Request Customer Approval'}
      </Button>

      {disabledReason ? (
        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{disabledReason}</span>
        </p>
      ) : (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          Sends diagnosis and estimated cost to the customer tracking page.
        </p>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogHeader>
          <AlertDialogTitle>Send estimate for customer approval?</AlertDialogTitle>
          <AlertDialogDescription>
            The customer will see this diagnosis and cost on their tracking link. The repair moves
            to Waiting for Approval until they respond (next update).
          </AlertDialogDescription>
        </AlertDialogHeader>

        {diagnosis?.trim() && estimatedCost !== null ? (
          <ApprovalEstimateSummary
            variant="prominent"
            diagnosis={diagnosis.trim()}
            estimatedCostPaise={estimatedCost}
            className="my-3"
          />
        ) : null}

        {errorMessage ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={requestMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={requestMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {requestMutation.isPending ? 'Sending...' : 'Send to Customer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  )
}
