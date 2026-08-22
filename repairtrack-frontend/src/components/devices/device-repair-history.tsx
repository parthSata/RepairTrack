'use client'

import * as React from 'react'
import Link from 'next/link'
import { History, ChevronRight, Calendar, DollarSign } from 'lucide-react'
import { useDeviceRepairHistory } from '@/features/devices/queries'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface DeviceRepairHistoryProps {
  deviceId: string
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'outline' | 'destructive' | 'secondary' }> = {
  RECEIVED: { label: 'Received', variant: 'secondary' },
  DIAGNOSING: { label: 'Diagnosing', variant: 'secondary' },
  WAITING_FOR_APPROVAL: { label: 'Waiting Approval', variant: 'outline' },
  APPROVED: { label: 'Approved', variant: 'outline' },
  WAITING_FOR_PARTS: { label: 'Waiting Parts', variant: 'outline' },
  IN_REPAIR: { label: 'In Repair', variant: 'secondary' },
  QUALITY_CHECK: { label: 'Quality Check', variant: 'secondary' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

export function DeviceRepairHistory({ deviceId }: DeviceRepairHistoryProps) {
  const { data: repairs, isLoading, isError, refetch } = useDeviceRepairHistory(deviceId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
        Failed to load repair history.{' '}
        <button onClick={() => refetch()} className="underline font-medium">
          Retry
        </button>
      </div>
    )
  }

  if (!repairs || repairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-card/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
          <History className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">No repairs recorded for this device yet</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          When this device is admitted for repair, ticket records will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {repairs.map((repair) => {
        const badgeInfo = STATUS_BADGES[repair.status] ?? {
          label: repair.status,
          variant: 'outline' as const,
        }

        return (
          <div
            key={repair.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-accent">
                  #{repair.ticketNumber}
                </span>
                <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
              </div>
              <p className="text-xs text-foreground font-medium">
                {repair.issueDescription || 'No description provided'}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(repair.createdAt).toLocaleDateString()}
                </span>
                {(repair.finalCost || repair.estimatedCost) && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    {repair.finalCost ? `$${repair.finalCost}` : `Est: $${repair.estimatedCost}`}
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/repairs/${repair.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline self-end sm:self-center"
            >
              View Ticket
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
