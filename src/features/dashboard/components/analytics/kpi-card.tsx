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
  extra,
}: KpiCardProps) {
  const displayValue =
    typeof value === 'number' && formatAsRupees ? formatRupees(value) : value

  return (
    <div className={cn('flex flex-col justify-between h-full space-y-4', className)}>
      <div>
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {displayValue}
        </div>

        {(delta !== undefined || (current !== undefined && previous !== undefined) || hint) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DeltaBadge current={current} previous={previous} delta={delta} />
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          </div>
        )}

        {extra}
      </div>

      {subtext && (
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-2.5">
          {subtext}
        </p>
      )}
    </div>
  )
}
