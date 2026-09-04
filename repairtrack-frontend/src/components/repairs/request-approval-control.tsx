'use client'

import * as React from 'react'
import { AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ApprovalEstimateBreakdown } from '@/components/repairs/approval-estimate-summary'
import { useRequestCustomerApproval } from '@/features/repairs/mutations'
import {
  formatINR,
  formatINRFromPaise,
  parseRupeesInput,
  storedCostToRupees,
} from '@/features/repairs/money'
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
    return 'Set an original estimate (₹) before requesting customer approval'
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

  const disabledReason = getDisabledReason({ diagnosis, estimatedCost, approval })
  const isReady = !disabledReason
  const isDisabled = Boolean(disabledReason) || requestMutation.isPending

  const originalRupees = estimatedCost != null ? storedCostToRupees(estimatedCost) : null
  const additionalRupees = parseRupeesInput(additionalCostValue) ?? 0
  const revisedRupees = originalRupees != null ? originalRupees + additionalRupees : null

  const canSubmit =
    isReady &&
    additionalCostValue.trim() !== '' &&
    parseRupeesInput(additionalCostValue) !== null

  const handleConfirm = async () => {
    const additionalEstimatedCost = parseRupeesInput(additionalCostValue)
    if (additionalEstimatedCost === null) {
      setErrorMessage('Enter a valid additional repair cost (₹0 or more)')
      return
    }

    setErrorMessage(null)
    try {
      await requestMutation.mutateAsync({ additionalEstimatedCost })
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
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          Sends diagnosis and revised estimate to the customer tracking page.
        </p>
      )}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        contentClassName="max-w-xl sm:max-w-2xl p-6 sm:p-8"
      >
        <AlertDialogHeader className="mb-5">
          <AlertDialogTitle className="text-xl">Send estimate for customer approval?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base">
            The technician found additional work required. The customer will see this information
            on their tracking page.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {diagnosis?.trim() && estimatedCost !== null ? (
          <div className="space-y-5">
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Diagnosis
                  </Label>
                  <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap leading-relaxed">
                    {diagnosis.trim()}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Original Estimate
                  </Label>
                  <p className="text-base sm:text-lg font-semibold text-foreground">
                    {formatINRFromPaise(estimatedCost)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="additional-repair-cost"
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Additional Repair Cost <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="additional-repair-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 4500"
                    value={additionalCostValue}
                    onChange={(e) => setAdditionalCostValue(e.target.value)}
                    className="h-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              {revisedRupees != null ? (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Revised Estimated Total
                  </Label>
                  <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {formatINR(revisedRupees)}
                  </p>
                </div>
              ) : null}
            </div>

            {canSubmit && originalRupees != null ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Customer preview
                </p>
                <ApprovalEstimateBreakdown
                  variant="prominent"
                  diagnosis={diagnosis.trim()}
                  initialEstimateRupees={originalRupees}
                  additionalCostRupees={additionalRupees}
                  revisedTotalRupees={revisedRupees ?? originalRupees + additionalRupees}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        ) : null}

        <p className="mt-5 text-sm text-muted-foreground">The repair will wait for customer approval.</p>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel disabled={requestMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={requestMutation.isPending || !canSubmit}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {requestMutation.isPending ? 'Sending...' : 'Send to Customer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  )
}
