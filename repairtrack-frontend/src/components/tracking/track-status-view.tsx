'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
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

function formatEstimatedCost(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`
}

export function TrackStatusView({ data }: { data: PublicTrackingResponse }) {
  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-[0_8px_24px_rgba(24,33,43,0.06)]">
        <CardContent className="space-y-4 p-6">
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

      <Card className="border-border">
        <CardContent className="space-y-4 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Progress</h3>
          <TrackProgressIndicator statusLabel={data.status} />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-4 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Device</h3>
          <div className="space-y-2">
            <p className="text-base font-medium text-foreground">{formatDeviceLabel(data.device)}</p>
            {data.problemDescription ? (
              <p className="text-sm leading-6 text-muted-foreground">{data.problemDescription}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No problem description provided.</p>
            )}
            {typeof data.estimatedCost === 'number' ? (
              <p className="text-sm text-foreground">
                Estimated cost: <span className="font-medium">{formatEstimatedCost(data.estimatedCost)}</span>
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="space-y-4 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Repair Updates</h3>
          <TrackUpdatesList updates={data.updates} />
        </CardContent>
      </Card>

      <div className="flex justify-center pt-2">
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
