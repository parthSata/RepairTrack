'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusDistributionPoint } from '@/features/dashboard/schemas'

const STATUS_CONFIG: Record<
  string,
  { label: string; dotClass: string; barColor: string }
> = {
  RECEIVED: {
    label: 'Received',
    dotClass: 'bg-sky-500',
    barColor: 'bg-sky-500',
  },
  DIAGNOSING: {
    label: 'Diagnosing',
    dotClass: 'bg-purple-500',
    barColor: 'bg-purple-500',
  },
  WAITING_FOR_APPROVAL: {
    label: 'Waiting for Approval',
    dotClass: 'bg-amber-500',
    barColor: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Approved',
    dotClass: 'bg-cyan-500',
    barColor: 'bg-cyan-500',
  },
  WAITING_FOR_PARTS: {
    label: 'Waiting for Parts',
    dotClass: 'bg-orange-500',
    barColor: 'bg-orange-500',
  },
  IN_REPAIR: {
    label: 'In Repair',
    dotClass: 'bg-indigo-500',
    barColor: 'bg-indigo-500',
  },
  QUALITY_CHECK: {
    label: 'Quality Check',
    dotClass: 'bg-teal-500',
    barColor: 'bg-teal-500',
  },
  READY_FOR_PICKUP: {
    label: 'Ready for Pickup',
    dotClass: 'bg-emerald-500',
    barColor: 'bg-emerald-500',
  },
  COMPLETED: {
    label: 'Completed',
    dotClass: 'bg-green-500',
    barColor: 'bg-green-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    dotClass: 'bg-rose-500',
    barColor: 'bg-rose-500',
  },
}

interface RepairStatusChartProps {
  data?: StatusDistributionPoint[]
  subtext?: string
}

export function RepairStatusChart({
  data = [],
  subtext = 'Current active queue stages',
}: RepairStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (total === 0 || data.length === 0) {
    return (
      <div className="flex flex-col justify-between space-y-4">
        <div className="flex h-48 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-muted-foreground">No active repairs</p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            Work queue is currently clear.
          </p>
        </div>
        {subtext && (
          <p className="border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
            {subtext}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-between space-y-4">
      <div className="space-y-3.5">
        {/* Proportional Segmented Progress Bar */}
        <div
          className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60"
          role="progressbar"
          aria-label="Repair status distribution"
        >
          {data.map((item) => {
            const percentage = Math.max(3, (item.count / total) * 100)
            const cfg = STATUS_CONFIG[item.status]
            const barColor = cfg?.barColor ?? 'bg-accent'
            return (
              <div
                key={item.status}
                style={{ width: `${percentage}%` }}
                className={cn(
                  barColor,
                  'transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:opacity-90',
                )}
                title={`${cfg?.label ?? item.label}: ${item.count} (${Math.round((item.count / total) * 100)}%)`}
              />
            )
          })}
        </div>

        {/* Status Breakdown List with Full Unclipped Labels */}
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5">
          {data.map((item) => {
            const cfg = STATUS_CONFIG[item.status]
            const label = cfg?.label ?? item.label
            const dotClass = cfg?.dotClass ?? 'bg-slate-400'
            const percent = Math.round((item.count / total) * 100)

            return (
              <Link
                key={item.status}
                href={`/repairs?status=${item.status}`}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-card px-3 py-2 text-xs transition-colors hover:border-border hover:bg-muted/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', dotClass)} />
                  <span className="font-medium text-foreground group-hover:text-primary truncate">
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-semibold tabular-nums text-foreground">
                    {item.count}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right">
                    {percent}%
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
        <span>{subtext}</span>
        <Link
          href="/repairs"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          View queue <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
