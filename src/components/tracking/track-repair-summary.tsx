'use client'

import { Calendar, HardDrive } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatINR } from '@/features/repairs/money'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'

type TrackRepairSummaryProps = {
  device: PublicTrackingResponse['device']
  problemDescription: string | null
  estimatedCost?: number
  expectedCompletionDate: string | null
  hasPendingApproval: boolean
}

function formatDeviceLabel(device: TrackRepairSummaryProps['device']): string {
  if (device.model) return `${device.brand} ${device.model}`
  return device.brand
}

function formatExpectedCompletionDate(date: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function TrackRepairSummary({
  device,
  problemDescription,
  estimatedCost,
  expectedCompletionDate,
  hasPendingApproval,
}: TrackRepairSummaryProps) {
  const deviceLabel = formatDeviceLabel(device)

  return (
    <Card className="w-full min-w-0 border-border">
      <CardContent className="flex w-full min-w-0 flex-col gap-3 p-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-2">
          <HardDrive className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <h3 className="min-w-0 text-sm font-bold uppercase tracking-[0.12em] text-foreground sm:tracking-[0.14em]">
            Device & issue
          </h3>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 rounded-lg bg-muted/30 p-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Device</p>
            <p className="text-base font-semibold text-foreground wrap-break-word">{deviceLabel}</p>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Reported problem</p>
            <p className="text-sm leading-relaxed text-foreground wrap-break-word">
              {problemDescription || 'No problem description on file.'}
            </p>
          </div>
          {typeof estimatedCost === 'number' && !hasPendingApproval ? (
            <div className="border-t border-border/80 pt-2">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Estimated cost</p>
              <p className="text-lg font-bold text-foreground">{formatINR(estimatedCost)}</p>
            </div>
          ) : null}
          {expectedCompletionDate ? (
            <div className="flex items-start gap-2 border-t border-border/80 pt-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Expected Completion
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Expected by {formatExpectedCompletionDate(expectedCompletionDate)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
