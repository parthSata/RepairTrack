'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  CalendarPlus,
  CheckCircle2,
  PackageCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useDashboardSummary } from '@/features/dashboard/queries'
import type { DashboardSummary } from '@/features/dashboard/schemas'
import { AnimatedNumber } from './animated-number'

interface OperationMetricConfig {
  key: keyof DashboardSummary
  label: string
  note: string
  icon: LucideIcon
  href: string
  actionText: string
  iconBadgeClass: string
  isAlert?: boolean
}

const OPERATION_METRICS: OperationMetricConfig[] = [
  {
    key: 'todaysRepairs',
    label: "Today's Intake",
    note: 'Tickets opened today',
    icon: CalendarPlus,
    href: '/repairs',
    actionText: 'View today',
    iconBadgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    key: 'activeRepairs',
    label: 'Active Queue',
    note: 'Currently on the bench',
    icon: Wrench,
    href: '/repairs?status=ACTIVE',
    actionText: 'View active',
    iconBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    key: 'readyForPickup',
    label: 'Ready for Pickup',
    note: 'Awaiting customer pickup',
    icon: PackageCheck,
    href: '/repairs?status=READY_FOR_PICKUP',
    actionText: 'View ready',
    iconBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'completedToday',
    label: 'Completed Today',
    note: 'Repairs finished today',
    icon: CheckCircle2,
    href: '/repairs?status=COMPLETED',
    actionText: 'View completed',
    iconBadgeClass: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
]

function OperationCardSkeleton() {
  return (
    <section aria-label="Today's operations" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {OPERATION_METRICS.map(({ label, iconBadgeClass }) => (
        <Card key={label} className="border-border/80 shadow-xs">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center opacity-40', iconBadgeClass)}>
                <div className="h-4 w-4" />
              </div>
            </div>
            <Skeleton className="mt-4 h-9 w-16" />
            <div className="mt-4 border-t border-border/50 pt-2.5 flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function OperationCardItem({
  config,
  value,
}: {
  config: OperationMetricConfig
  value: number
}) {
  const isAlertActive = config.isAlert && value > 0

  return (
    <Link
      href={config.href}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card
        className={cn(
          'border-border/80 shadow-xs transition-all duration-200 group-hover:border-border group-hover:shadow-sm h-full flex flex-col justify-between',
          isAlertActive &&
            'border-rose-300/80 bg-rose-500/[0.04] dark:border-rose-900/60 dark:bg-rose-500/[0.08]',
        )}
      >
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">{config.label}</span>
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
                  config.iconBadgeClass,
                )}
              >
                <config.icon className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>

            <p
              className={cn(
                'mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground',
                isAlertActive && 'text-rose-600 dark:text-rose-400',
              )}
            >
              <AnimatedNumber value={value} />
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
            <span className="truncate">{config.note}</span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium transition-colors group-hover:text-foreground shrink-0',
                isAlertActive && 'text-rose-600 dark:text-rose-400 group-hover:underline',
              )}
            >
              {config.actionText}
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface DashboardStatCardsProps {
  shopId?: string | null
}

export function DashboardStatCards({ shopId }: DashboardStatCardsProps = {}) {
  const { data, isPending, isError, refetch } = useDashboardSummary(shopId)

  if (isPending && !data) {
    return <OperationCardSkeleton />
  }

  if (isError && !data) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-center text-sm text-destructive">
        <p>Failed to load today&apos;s operations.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 font-medium underline inline-block"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return <OperationCardSkeleton />
  }

  return (
    <section aria-label="Today's operations" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Today&apos;s Operations
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {OPERATION_METRICS.map((config) => (
          <OperationCardItem
            key={config.key}
            config={config}
            value={data[config.key] ?? 0}
          />
        ))}
      </div>
    </section>
  )
}
