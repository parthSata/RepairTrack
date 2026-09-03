'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ApprovalEstimateBreakdown } from '@/components/repairs/approval-estimate-summary'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { formatRupees } from '@/lib/format-money'
import {
  TrackProgressIndicator,
  TrackStatusIcon,
  TrackStatusMessage,
} from '@/components/tracking/track-progress-indicator'
import { TrackUpdatesList } from '@/components/tracking/track-updates-list'

function formatDeviceLabel(device: PublicTrackingResponse['device']): string {
  if (device.model) {
    return `${device.brand} ${device.model}`
  }
  return device.brand
}

export function TrackStatusView({ data }: { data: PublicTrackingResponse }) {
  return (
    <div className="space-y-5">
      <Card className="border-border bg-card shadow-[0_8px_24px_rgba(24,33,43,0.06)]">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-muted/40 p-3">
              <TrackStatusIcon statusLabel={data.status} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{data.status}</h2>
                <Badge variant="outline">#{data.ticketNumber}</Badge>
              </div>
              <TrackStatusMessage statusLabel={data.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {data.pendingApproval ? (
        <Card className="overflow-hidden border-amber-300/80 shadow-[0_8px_24px_rgba(245,158,11,0.1)]">
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
                aria-hidden
              />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                  Your approval is needed
                </p>
                <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                  Review the diagnosis and revised estimate before the shop continues the repair.
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-5 sm:p-6">
            <ApprovalEstimateBreakdown
              diagnosis={data.pendingApproval.diagnosis}
              originalEstimatedCostPaise={data.pendingApproval.originalEstimatedCost}
              additionalEstimatedCostPaise={data.pendingApproval.additionalEstimatedCost}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Progress</h3>
          <TrackProgressIndicator statusLabel={data.status} />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-3 p-5 sm:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Device</h3>
          <div className="space-y-2">
            <p className="text-base font-medium text-foreground">{formatDeviceLabel(data.device)}</p>
            {data.problemDescription ? (
              <p className="text-sm leading-6 text-muted-foreground">{data.problemDescription}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No problem description provided.</p>
            )}
            {typeof data.estimatedCost === 'number' && !data.pendingApproval ? (
              <div className="mt-3 flex items-baseline justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
                <span className="text-sm text-muted-foreground">Estimated cost</span>
                <span className="text-base font-semibold tabular-nums text-foreground">
                  {formatRupees(data.estimatedCost)}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Repair Updates</h3>
          <TrackUpdatesList updates={data.updates} />
        </CardContent>
      </Card>

      <div className="flex justify-center pt-1">
        <Link
          href="/track"
          className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
        >
          Track another repair
        </Link>
      </div>
    </div>
  )
}
