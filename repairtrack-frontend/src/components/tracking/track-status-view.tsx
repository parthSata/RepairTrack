'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  HardDrive,
  History,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ApprovalEstimateBreakdown } from '@/components/repairs/approval-estimate-summary'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { formatRupees } from '@/lib/format-money'
import {
  TrackProgressIndicator,
  TrackStatusIcon,
} from '@/components/tracking/track-progress-indicator'
import { TrackUpdatesList } from '@/components/tracking/track-updates-list'
import { getPublicStatusMessage } from '@/features/tracking/status-labels'

function formatDeviceLabel(device: PublicTrackingResponse['device']): string {
  if (device.model) return `${device.brand} ${device.model}`
  return device.brand
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

export function TrackStatusView({ data }: { data: PublicTrackingResponse }) {
  const hasPendingApproval = Boolean(data.pendingApproval)
  const deviceLabel = formatDeviceLabel(data.device)

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">
      {/* Hero */}
      <section className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/30 shadow-sm">
        <div className="border-b border-border/80 bg-muted/20 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Ticket #{data.ticketNumber}
            </Badge>
            {hasPendingApproval ? (
              <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-500 gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
                Action needed
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
                ? 'We finished diagnosing your device and need you to review the estimate below before we continue.'
                : getPublicStatusMessage(data.status)}
            </p>
          </div>
        </div>
      </section>

      {/* Pending approval */}
      {hasPendingApproval && data.pendingApproval ? (
        <section
          className="flex w-full min-w-0 flex-col gap-4"
          aria-labelledby="approval-heading"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <h3
              id="approval-heading"
              className="min-w-0 text-base font-bold text-foreground break-words sm:text-lg"
            >
              Review your repair estimate
            </h3>
          </div>

          <Card className="w-full min-w-0 overflow-hidden border-2 border-amber-400/60 shadow-lg shadow-amber-500/10">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 text-white sm:px-5 sm:py-4">
              <p className="text-sm font-bold uppercase tracking-wide">Step 1 — Please read</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-50/95">
                Our technician inspected your device. Here is what we found and what the repair
                will cost.
              </p>
            </div>
            <CardContent className="flex w-full min-w-0 flex-col gap-5 p-4 sm:p-6">
              <ApprovalEstimateBreakdown
                variant="prominent"
                diagnosis={data.pendingApproval.diagnosis}
                initialEstimateRupees={data.pendingApproval.initialEstimate}
                additionalCostRupees={data.pendingApproval.additionalCost}
                revisedTotalRupees={data.pendingApproval.revisedTotal}
              />

              <div className="flex w-full min-w-0 flex-col gap-3 rounded-xl border border-dashed border-amber-300/70 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                <p className="flex min-w-0 items-start gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <span>Step 2 — What happens next</span>
                </p>
                <ul className="flex flex-col gap-3 text-sm text-muted-foreground list-none">
                  <li className="flex gap-2">
                    <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-400">
                      1.
                    </span>
                    <span>Review the diagnosis and cost above</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-400">
                      2.
                    </span>
                    <span>Visit the shop or call us to approve or discuss the estimate</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-400">
                      3.
                    </span>
                    <span>Once approved, we start the repair and update this page</span>
                  </li>
                </ul>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                All amounts are shown in Indian Rupees (₹). Approve / reject online coming soon.
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Progress */}
      <Card className="w-full min-w-0 border-border">
        <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
          <SectionHeader icon={MapPin} title="Where your repair is now" />
          <p className="-mt-1 text-sm text-muted-foreground">
            Follow each stage from check-in to pickup.
          </p>
          <TrackProgressIndicator statusLabel={data.status} />
        </CardContent>
      </Card>

      {/* Device details */}
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

      {/* Timeline */}
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
