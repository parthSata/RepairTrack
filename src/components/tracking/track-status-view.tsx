'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  CircleX,
  Clock3,
  HardDrive,
  History,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { ApprovalEstimateBreakdown } from '@/components/repairs/approval-estimate-summary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  TrackProgressIndicator,
  TrackStatusIcon,
} from '@/components/tracking/track-progress-indicator'
import { TrackUpdatesList } from '@/components/tracking/track-updates-list'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { formatINR } from '@/features/repairs/money'
import { getPublicStatusMessage } from '@/features/tracking/status-labels'

type AccessMode = 'token' | 'manual'

type TrackStatusViewProps = {
  data: PublicTrackingResponse
  accessMode: AccessMode
  isSubmittingDecision?: boolean
  onApprove?: () => Promise<void> | void
  onReject?: (reason?: string) => Promise<void> | void
}

function formatDeviceLabel(device: PublicTrackingResponse['device']): string {
  if (device.model) return `${device.brand} ${device.model}`
  return device.brand
}

function formatDecisionTimestamp(timestamp: string | null) {
  if (!timestamp) return null

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function SectionHeader({
  icon: Icon,
  title,
  id,
}: {
  icon: LucideIcon
  title: string
  id?: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
      <h3
        id={id}
        className="min-w-0 text-sm font-bold uppercase tracking-[0.12em] text-foreground sm:tracking-[0.14em]"
      >
        {title}
      </h3>
    </div>
  )
}

function ApprovalDecisionDialogs({
  approval,
  isSubmitting,
  onApprove,
  onReject,
}: {
  approval: NonNullable<PublicTrackingResponse['approval']>
  isSubmitting: boolean
  onApprove?: () => Promise<void> | void
  onReject?: (reason?: string) => Promise<void> | void
}) {
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

function ApprovalSummaryCard({
  approval,
  accessMode,
  isSubmittingDecision = false,
  onApprove,
  onReject,
}: {
  approval: NonNullable<PublicTrackingResponse['approval']>
  accessMode: AccessMode
  isSubmittingDecision?: boolean
  onApprove?: () => Promise<void> | void
  onReject?: (reason?: string) => Promise<void> | void
}) {
  const isPending = approval.status === 'PENDING'
  const isApproved = approval.status === 'APPROVED'
  const decisionTimestamp = formatDecisionTimestamp(approval.decidedAt)

  return (
    <section className="flex w-full min-w-0 flex-col gap-4" aria-labelledby="approval-heading">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <h3
          id="approval-heading"
          className="min-w-0 text-base font-bold text-foreground break-words sm:text-lg"
        >
          {isPending ? 'Review your repair estimate' : isApproved ? 'Repair Approved' : 'Repair Not Approved'}
        </h3>
      </div>

      <Card className="w-full min-w-0 overflow-hidden border-2 border-amber-400/60 shadow-lg shadow-amber-500/10">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 text-white sm:px-5 sm:py-4">
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
                <ApprovalDecisionDialogs
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

export function TrackStatusView({
  data,
  accessMode,
  isSubmittingDecision = false,
  onApprove,
  onReject,
}: TrackStatusViewProps) {
  const approval = data.approval
  const hasPendingApproval = approval?.status === 'PENDING'
  const deviceLabel = formatDeviceLabel(data.device)

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      <section className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/30 shadow-sm">
        <div className="border-b border-border/80 bg-muted/20 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Ticket #{data.ticketNumber}
            </Badge>
            {hasPendingApproval ? (
              <Badge className="gap-1 border-0 bg-amber-500 text-white hover:bg-amber-500">
                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
                Action required
              </Badge>
            ) : approval?.status === 'APPROVED' ? (
              <Badge className="gap-1 border-0 bg-emerald-600 text-white hover:bg-emerald-600">
                <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
                Approved
              </Badge>
            ) : approval?.status === 'REJECTED' ? (
              <Badge className="gap-1 border-0 bg-rose-600 text-white hover:bg-rose-600">
                <CircleX className="h-3 w-3 shrink-0" aria-hidden />
                Rejected
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock3 className="h-3 w-3 shrink-0" aria-hidden />
                Live status
              </Badge>
            )}
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent sm:h-14 sm:w-14">
            <TrackStatusIcon statusLabel={data.status} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Your device
                </p>
                <h2 className="text-lg font-bold tracking-tight text-foreground break-words sm:text-xl md:text-2xl">
                  {deviceLabel}
                </h2>
              </div>
            </div>
            <p className="text-base font-semibold text-foreground break-words">{data.status}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {hasPendingApproval
                ? 'We finished diagnosing your device and need your decision before we continue with the repair.'
                : approval?.status === 'APPROVED'
                  ? 'Your approval has been recorded. The shop can continue with the repair.'
                  : approval?.status === 'REJECTED'
                    ? 'Your decision not to continue has been recorded for the shop.'
                    : getPublicStatusMessage(data.status)}
            </p>
          </div>
        </div>
      </section>

      {approval ? (
        <ApprovalSummaryCard
          approval={approval}
          accessMode={accessMode}
          isSubmittingDecision={isSubmittingDecision}
          onApprove={onApprove}
          onReject={onReject}
        />
      ) : null}

      <Card className="w-full min-w-0 border-border">
        <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
          <SectionHeader icon={MapPin} title="Where your repair is now" />
          <p className="-mt-1 text-sm text-muted-foreground">
            Follow each stage from check-in to pickup.
          </p>
          <TrackProgressIndicator statusLabel={data.status} />
        </CardContent>
      </Card>

      <Card className="w-full min-w-0 border-border">
        <CardContent className="flex w-full min-w-0 flex-col gap-3 p-4 sm:p-6">
          <SectionHeader icon={HardDrive} title="Device & issue" />
          <div className="flex w-full min-w-0 flex-col gap-3 rounded-lg bg-muted/30 p-4">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Device</p>
              <p className="text-base font-semibold text-foreground break-words">{deviceLabel}</p>
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Reported problem</p>
              <p className="text-sm leading-relaxed text-foreground break-words">
                {data.problemDescription || 'No problem description on file.'}
              </p>
            </div>
            {typeof data.estimatedCost === 'number' && !hasPendingApproval ? (
              <div className="border-t border-border/80 pt-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Estimated cost</p>
                <p className="text-lg font-bold text-foreground">{formatINR(data.estimatedCost)}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full min-w-0 border-border">
        <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
          <SectionHeader icon={History} title="Status history" />
          <TrackUpdatesList updates={data.updates} />
        </CardContent>
      </Card>

      <div className="flex w-full justify-center pt-1 pb-2">
        <Link
          href="/track"
          className="inline-flex h-11 w-full max-w-sm items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto sm:min-w-[200px]"
        >
          Track another repair
        </Link>
      </div>
    </div>
  )
}
