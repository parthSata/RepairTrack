'use client'

import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  CircleX,
  Clock3,
  HardDrive,
  History,
  MapPin,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  TrackProgressIndicator,
  TrackStatusIcon,
} from '@/components/tracking/track-progress-indicator'
import { TrackApprovalSummaryCard } from '@/components/tracking/track-approval-summary-card'
import { TrackRepairSummary } from '@/components/tracking/track-repair-summary'
import { TrackSectionHeader } from '@/components/tracking/track-section-header'
import { TrackUpdatesList } from '@/components/tracking/track-updates-list'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { getPublicStatusMessage } from '@/features/tracking/status-labels'

type AccessMode = 'token' | 'manual'

type TrackStatusViewProps = {
  data: PublicTrackingResponse
  accessMode: AccessMode
  isSubmittingDecision?: boolean
  onApprove?: () => Promise<void> | void
  onReject?: (reason?: string) => Promise<void> | void
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
  const deviceLabel = data.device.model
    ? `${data.device.brand} ${data.device.model}`
    : data.device.brand

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      <section className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-linear-to-br from-card via-card to-muted/30 shadow-sm">
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
                <h2 className="text-lg font-bold tracking-tight text-foreground wrap-break-word sm:text-xl md:text-2xl">
                  {deviceLabel}
                </h2>
              </div>
            </div>
            <p className="text-base font-semibold text-foreground wrap-break-word">{data.status}</p>
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
        <TrackApprovalSummaryCard
          approval={approval}
          accessMode={accessMode}
          isSubmittingDecision={isSubmittingDecision}
          onApprove={onApprove}
          onReject={onReject}
        />
      ) : null}

      <Card className="w-full min-w-0 border-border">
        <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
          <TrackSectionHeader icon={MapPin} title="Where your repair is now" />
          <p className="-mt-1 text-sm text-muted-foreground">
            Follow each stage from check-in to pickup.
          </p>
          <TrackProgressIndicator statusLabel={data.status} />
        </CardContent>
      </Card>

      <TrackRepairSummary
        device={data.device}
        problemDescription={data.problemDescription}
        estimatedCost={data.estimatedCost}
        expectedCompletionDate={data.expectedCompletionDate}
        hasPendingApproval={hasPendingApproval}
      />

      <Card className="w-full min-w-0 border-border">
        <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
          <TrackSectionHeader icon={History} title="Status history" />
          <TrackUpdatesList updates={data.updates} />
        </CardContent>
      </Card>

      <div className="flex w-full justify-center pt-1 pb-2">
        <Link
          href="/track"
          className="inline-flex h-11 w-full max-w-sm items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto sm:min-w-50"
        >
          Track another repair
        </Link>
      </div>
    </div>
  )
}
