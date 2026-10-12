'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RankedBarListItem {
  id: string
  name: string
  subtitle?: string
  value: number
  valueLabel?: string
  secondaryValue?: string
  href?: string
}

export interface RankedBarListProps {
  items: RankedBarListItem[]
  maxValue?: number
  emptyText?: string
  className?: string
}

export function RankedBarList({
  items,
  maxValue: explicitMax,
  emptyText = 'No items to display',
  className,
}: RankedBarListProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-36 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-muted-foreground">{emptyText}</p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          Activity for this period will appear here.
        </p>
      </div>
    )
  }

  const computedMax = Math.max(...items.map((i) => i.value), 1)
  const max = explicitMax ?? computedMax

  return (
    <div
      role="list"
      aria-label="Ranked parts usage"
      className={cn('space-y-1.5', className)}
    >
      {items.map((item, index) => {
        const percentage = Math.max(3, Math.min(100, Math.round((item.value / max) * 100)))
        const rank = index + 1

        const content = (
          <div className="group relative flex items-center justify-between overflow-hidden rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            {/* Proportional background bar */}
            <div
              className="absolute inset-y-0 left-0 rounded-md bg-accent/15 transition-all duration-300 group-hover:bg-accent/25 dark:bg-accent/20 dark:group-hover:bg-accent/35"
              style={{ width: `${percentage}%` }}
              aria-hidden="true"
            />

            {/* Foreground: Rank, Name, SKU */}
            <div className="relative z-10 flex min-w-0 items-center gap-2 pr-2">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold tabular-nums',
                  rank === 1
                    ? 'bg-accent/20 text-accent font-extrabold'
                    : 'text-muted-foreground/80',
                )}
                title={`Rank #${rank}`}
              >
                #{rank}
              </span>

              <div className="min-w-0">
                <p className="truncate font-medium text-foreground transition-colors group-hover:text-accent">
                  {item.name}
                </p>
                {item.subtitle && (
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Foreground: Metrics (Quantity & Value) + Link Hint */}
            <div className="relative z-10 flex shrink-0 items-center gap-2 pl-2 text-right">
              <div className="flex flex-col items-end">
                <span className="font-semibold tabular-nums text-foreground">
                  {item.valueLabel ?? item.value}
                </span>
                {item.secondaryValue && (
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {item.secondaryValue}
                  </span>
                )}
              </div>

              {item.href && (
                <ArrowUpRight
                  className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent shrink-0"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        )

        return item.href ? (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md"
            role="listitem"
            title={`View details for ${item.name}`}
          >
            {content}
          </Link>
        ) : (
          <div key={item.id} role="listitem">
            {content}
          </div>
        )
      })}
    </div>
  )
}
