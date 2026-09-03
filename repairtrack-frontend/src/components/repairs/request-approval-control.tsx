'use client'

import * as React from 'react'
import { AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApprovalEstimateBreakdown } from '@/components/repairs/approval-estimate-summary'
import { useRequestCustomerApproval } from '@/features/repairs/mutations'
import { parseRupeesInput, rupeesToPaise } from '@/features/repairs/money'
import type { RepairApproval } from '@/features/repairs/queries'
import { useSession } from '@/lib/auth-client'

function getDisabledReason({
  diagnosis,
  approval,
}: {
  diagnosis: string | null
  approval: RepairApproval | null | undefined
}): string | null {
  if (!diagnosis?.trim()) {
    return 'Add a diagnosis before requesting customer approval'
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
  const [additionalCostValue, setAdditionalCostValue] = React.useState('')

  if (!canRequestApproval) {
    return null
  }

  const disabledReason = getDisabledReason({ diagnosis, approval })
  const isReady = !disabledReason
  const isDisabled = Boolean(disabledReason) || requestMutation.isPending
  const parsedAdditionalRupees = parseRupeesInput(additionalCostValue)
  const additionalPaise =
    parsedAdditionalRupees != null ? rupeesToPaise(parsedAdditionalRupees) : null

  const handleConfirm = async () => {
    if (parsedAdditionalRupees == null) {
      setErrorMessage('Enter an additional repair cost in rupees')
      return
    }

    setErrorMessage(null)
    try {
      await requestMutation.mutateAsync({ additionalEstimatedCost: parsedAdditionalRupees })
      setConfirmOpen(false)
      setAdditionalCostValue('')
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
          setAdditionalCostValue('')
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
        <p className="text-[11px] text-muted-foreground">
          Sends diagnosis and cost breakdown to the customer tracking page.
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogHeader>
          <DialogTitle>Send estimate for customer approval?</DialogTitle>
          <DialogDescription>The repair will wait for customer approval.</DialogDescription>
        </DialogHeader>

        {diagnosis?.trim() ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Technician Diagnosis
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {diagnosis.trim()}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="additionalEstimatedCost">Additional Repair Cost (₹)</Label>
              <Input
                id="additionalEstimatedCost"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 4500"
                value={additionalCostValue}
                onChange={(e) => setAdditionalCostValue(e.target.value)}
              />
            </div>

            <ApprovalEstimateBreakdown
              showDiagnosis={false}
              originalEstimatedCostPaise={estimatedCost}
              additionalEstimatedCostPaise={additionalPaise}
            />
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={requestMutation.isPending}
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={requestMutation.isPending || parsedAdditionalRupees == null}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {requestMutation.isPending ? 'Sending...' : 'Send to Customer'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
