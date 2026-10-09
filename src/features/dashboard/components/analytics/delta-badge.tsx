'use client'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeltaBadgeProps {
  current?: number
  previous?: number
  delta?: number | null
  className?: string
  invertTrend?: boolean
}

export function calculateDelta(current: number, previous: number): number | null {
  if (!previous || previous <= 0) return null
  return ((current - previous) / previous) * 100
}

export function DeltaBadge({
  current,
  previous,
  delta: explicitDelta,
  className,
  invertTrend = false,
}: DeltaBadgeProps) {
  const delta =
    explicitDelta !== undefined
      ? explicitDelta
      : current !== undefined && previous !== undefined
        ? calculateDelta(current, previous)
        : null

  if (delta === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground bg-muted/60',
          className,
        )}
        aria-label="No prior period data to compare"
      >
        <span>—</span>
      </span>
    )
  }

  const isPositive = delta > 0
  const isNegative = delta < 0
  const formattedPercent =
    Math.abs(delta) >= 100
      ? `${Math.round(delta)}%`
      : `${delta > 0 ? '+' : ''}${Math.abs(delta) >= 10 ? Math.round(delta) : delta.toFixed(1)}%`

  // When invertTrend is true, a decrease (negative delta) is favorable (green)
  // and an increase (positive delta) is unfavorable (rose).
  const isGood = invertTrend ? isNegative : isPositive
  const isBad = invertTrend ? isPositive : isNegative

  if (isGood) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400',
          className,
        )}
      >
        {isPositive ? (
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>{formattedPercent}</span>
      </span>
    )
  }

  if (isBad) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400',
          className,
        )}
      >
        {isPositive ? (
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span>{formattedPercent}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      <span>0%</span>
    </span>
  )
}
