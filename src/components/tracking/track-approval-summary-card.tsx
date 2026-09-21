'use client'

import { Sparkles } from 'lucide-react'
import { ApprovalEstimateBreakdown } from '@/components/repairs/approval-estimate-summary'
import { Card, CardContent } from '@/components/ui/card'
import { TrackApprovalDecisionDialogs } from '@/components/tracking/track-approval-decision-dialogs'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'

type AccessMode = 'token' | 'manual'

type TrackApprovalSummaryCardProps = {
  approval: NonNullable<PublicTrackingResponse['approval']>
  accessMode: AccessMode
  isSubmittingDecision?: boolean
  onApprove?: () => Promise<void> | void
  onReject?: (reason?: string) => Promise<void> | void
}

function formatDecisionTimestamp(timestamp: string | null): string | null {
  if (!timestamp) return null

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

export function TrackApprovalSummaryCard({
  approval,
  accessMode,
  isSubmittingDecision = false,
  onApprove,
  onReject,
}: TrackApprovalSummaryCardProps) {
  const isPending = approval.status === 'PENDING'
  const isApproved = approval.status === 'APPROVED'
  const decisionTimestamp = formatDecisionTimestamp(approval.decidedAt)

  return (
    <section className="flex w-full min-w-0 flex-col gap-4" aria-labelledby="approval-heading">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <h3
          id="approval-heading"
          className="min-w-0 text-base font-bold text-foreground wrap-break-word sm:text-lg"
        >
          {isPending ? 'Review your repair estimate' : isApproved ? 'Repair Approved' : 'Repair Not Approved'}
        </h3>
      </div>

      <Card className="w-full min-w-0 overflow-hidden border border-border shadow-sm">
        <div className="bg-slate-900 px-4 py-3.5 text-white sm:px-5 sm:py-4 dark:bg-slate-800">
          <p className="text-sm font-bold uppercase tracking-wide">
            {isPending ? 'Action Required' : isApproved ? 'Already Approved' : 'Already Rejected'}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-50/95">
            {isPending
              ? 'Our technician inspected your device. Please review the diagnosis and estimate before the shop continues.'
              : isApproved
                ? `You approved this repair${decisionTimestamp ? ` on ${decisionTimestamp}` : ''}.`
                : `You declined this repair${decisionTimestamp ? ` on ${decisionTimestamp}` : ''}.`}
          </p>
        </div>

        <CardContent className="flex w-full min-w-0 flex-col gap-5 p-4 sm:p-6">
          <ApprovalEstimateBreakdown
            variant="prominent"
            diagnosis={approval.diagnosis}
            initialEstimateRupees={approval.initialEstimate}
            additionalCostRupees={approval.additionalCost}
            revisedTotalRupees={approval.revisedTotal}
          />

          {isPending ? (
            accessMode === 'token' ? (
              <>
                <div className="rounded-xl border border-dashed border-amber-300/70 bg-amber-50/50 p-4 text-sm text-muted-foreground dark:border-amber-800 dark:bg-amber-950/20">
                  Approve the repair to let the shop continue, or reject it if you do not want to
                  proceed with this estimate.
                </div>
                <TrackApprovalDecisionDialogs
                  approval={approval}
                  isSubmitting={isSubmittingDecision}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-300/70 bg-amber-50/50 p-4 text-sm text-muted-foreground dark:border-amber-800 dark:bg-amber-950/20">
                Approve or reject from the link sent to you. Manual search can only show this
                estimate in read-only mode.
              </div>
            )
          ) : (
            <div
              className={`rounded-xl border p-4 text-sm ${
                isApproved
                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-100'
                  : 'border-rose-300 bg-rose-50/70 text-rose-900 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-100'
              }`}
            >
              <p className="font-semibold">
                {isApproved ? 'Repair approved' : 'Repair not approved'}
              </p>
              <p className="mt-1">
                {decisionTimestamp ? `Decision recorded on ${decisionTimestamp}.` : 'Decision recorded.'}
              </p>
              {!isApproved && approval.rejectionReason ? (
                <p className="mt-2 text-sm">Reason: {approval.rejectionReason}</p>
              ) : null}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            All amounts are shown in Indian Rupees (Rs).
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
