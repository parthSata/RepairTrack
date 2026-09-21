'use client'

import * as React from 'react'
import { ApprovalEstimateBreakdown } from '@/components/repairs/approval-estimate-summary'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'

type TrackApprovalDecisionDialogsProps = {
  approval: NonNullable<PublicTrackingResponse['approval']>
  isSubmitting: boolean
  onApprove?: () => Promise<void> | void
  onReject?: (reason?: string) => Promise<void> | void
}

export function TrackApprovalDecisionDialogs({
  approval,
  isSubmitting,
  onApprove,
  onReject,
}: TrackApprovalDecisionDialogsProps) {
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="accent"
          className="w-full"
          disabled={isSubmitting}
          onClick={() => setApproveOpen(true)}
        >
          {isSubmitting ? 'Submitting…' : 'Approve Repair'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isSubmitting}
          onClick={() => setRejectOpen(true)}
        >
          {isSubmitting ? 'Submitting…' : 'Reject Repair'}
        </Button>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen} preventDismiss={isSubmitting}>
        <DialogHeader>
          <DialogTitle>Confirm repair approval</DialogTitle>
          <DialogDescription>
            Please review the diagnosis and revised estimate one more time before approving the
            repair.
          </DialogDescription>
        </DialogHeader>

        <ApprovalEstimateBreakdown
          variant="default"
          diagnosis={approval.diagnosis}
          initialEstimateRupees={approval.initialEstimate}
          additionalCostRupees={approval.additionalCost}
          revisedTotalRupees={approval.revisedTotal}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setApproveOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="accent"
            disabled={isSubmitting}
            onClick={async () => {
              await onApprove?.()
              setApproveOpen(false)
            }}
          >
            {isSubmitting ? 'Confirming…' : 'Confirm Approval'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen} preventDismiss={isSubmitting}>
        <DialogHeader>
          <DialogTitle>Reject this repair?</DialogTitle>
          <DialogDescription>
            You can optionally tell the shop why you do not want to proceed. This message is not
            required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <ApprovalEstimateBreakdown
            variant="default"
            diagnosis={approval.diagnosis}
            initialEstimateRupees={approval.initialEstimate}
            additionalCostRupees={approval.additionalCost}
            revisedTotalRupees={approval.revisedTotal}
          />
          <div className="space-y-2">
            <label htmlFor="rejection-reason" className="text-sm font-medium text-foreground">
              Optional reason
            </label>
            <Textarea
              id="rejection-reason"
              placeholder="Tell the shop anything they should know before they contact you."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">{reason.trim().length}/500 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setRejectOpen(false)}
          >
            Go Back
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              await onReject?.(reason.trim() || undefined)
              setRejectOpen(false)
              setReason('')
            }}
          >
            {isSubmitting ? 'Rejecting…' : 'Reject Repair'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
