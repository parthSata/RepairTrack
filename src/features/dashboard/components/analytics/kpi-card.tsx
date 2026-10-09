'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { formatRupees } from '@/lib/format-money'
import { DeltaBadge } from './delta-badge'
import { cn } from '@/lib/utils'

export interface KpiCardProps {
  label?: string
  value: number | string
  icon?: LucideIcon
  delta?: number | null
  current?: number
  previous?: number
  hint?: string
  subtext?: string
  formatAsRupees?: boolean
  className?: string
  valueClassName?: string
  invertTrend?: boolean
  extra?: ReactNode
}

export function KpiCard({
  value,
  delta,
  current,
  previous,
  hint,
  subtext = 'Collected payments, incl. GST',
  formatAsRupees = true,
  className,
  valueClassName,
  invertTrend = false,
  extra,
}: KpiCardProps) {
  const displayValue =
    typeof value === 'number' && formatAsRupees ? formatRupees(value) : value

  // Only show delta badge when we have a valid baseline to calculate percentage from
  const hasValidComparison = previous !== undefined && previous !== null && previous > 0
  const showDeltaBadge = (delta !== undefined && delta !== null) || hasValidComparison

  return (
    <div className={cn('flex flex-col flex-1 justify-between h-full', className)}>
      <div>
        <div
          className={cn(
            'text-3xl font-semibold tracking-tight tabular-nums text-foreground',
            valueClassName,
          )}
        >
          {displayValue}
        </div>

        {/* Unified metadata row with fixed min-h-6 so all cards maintain identical vertical rhythm */}
        <div className="mt-2.5 flex min-h-6 items-center gap-2">
          {showDeltaBadge ? (
            <>
              <DeltaBadge
                current={current}
                previous={previous}
                delta={delta}
                invertTrend={invertTrend}
              />
              {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            </>
          ) : extra ? (
            extra
          ) : previous !== undefined && (previous === 0 || previous === null) ? (
            <span className="text-xs text-muted-foreground">No prior period data</span>
          ) : hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </div>

      {subtext && (
        <p className="mt-4 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
          {subtext}
        </p>
      )}
    </div>
  )
}
