'use client'

import { CalendarPlus, CheckCircle2, PackageCheck, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useDashboardSummary } from '@/features/dashboard/queries'
import type { DashboardSummary } from '@/features/dashboard/schemas'

const METRICS = [
  {
    key: 'todaysRepairs' as const,
    label: "Today's Repairs",
    note: 'Tickets opened today',
    icon: CalendarPlus,
    tone: 'text-accent',
  },
  {
    key: 'activeRepairs' as const,
    label: 'Active Repairs',
    note: 'Not completed or cancelled',
    icon: Wrench,
    tone: 'text-steel',
  },
  {
    key: 'readyForPickup' as const,
    label: 'Ready for Pickup',
    note: 'Waiting on the counter',
    icon: PackageCheck,
    tone: 'text-success',
  },
  {
    key: 'completedToday' as const,
    label: 'Completed Today',
    note: 'Moved to completed today',
    icon: CheckCircle2,
    tone: 'text-success',
  },
]

function StatValue({ value }: { value: number }) {
  return (
    <p className="mt-6 text-3xl font-semibold tracking-tight tabular-nums">
      <span
        key={value}
        className="inline-block motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none"
      >
        {value}
      </span>
    </p>
  )
}

function StatCardsSkeleton() {
  return (
    <section aria-label="Repair metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map(({ label, icon: Icon, tone }) => (
        <Card key={label} className="border-border shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={cn('h-5 w-5', tone)} aria-hidden="true" />
            </div>
            <Skeleton className="mt-6 h-9 w-16" />
            <Skeleton className="mt-2 h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function StatCardsGrid({ data }: { data: DashboardSummary }) {
  return (
    <section aria-label="Repair metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map(({ key, label, note, icon: Icon, tone }) => (
        <Card key={key} className="border-border shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={cn('h-5 w-5', tone)} aria-hidden="true" />
            </div>
            <StatValue value={data[key]} />
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

export function DashboardStatCards() {
  const { data, isPending, isError, refetch } = useDashboardSummary()

  if (isPending && !data) {
    return <StatCardsSkeleton />
  }

  if (isError && !data) {
    return (
      <section aria-label="Repair metrics">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Failed to load dashboard metrics.{' '}
          <button
            type="button"
            onClick={() => void refetch()}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  if (!data) {
    return <StatCardsSkeleton />
  }

  return (
    <div>
      {isError ? (
        <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
          Could not refresh metrics.{' '}
          <button
            type="button"
            onClick={() => void refetch()}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      ) : null}
      <StatCardsGrid data={data} />
    </div>
  )
}
