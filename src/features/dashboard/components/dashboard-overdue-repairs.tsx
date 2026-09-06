'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRepairs } from '@/features/repairs/queries'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function DashboardOverdueRepairs() {
  const { data, isLoading, isError, refetch, isFetching } = useRepairs({
    overdue: true,
    limit: 5,
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const items = data?.items ?? []
  const total = data?.pagination.total ?? 0

  return (
    <section
      aria-label="Overdue repairs"
      className="rounded-xl border border-border/80 bg-card shadow-xs"
    >
      <div className="flex flex-col gap-3 border-b border-border/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Overdue Repairs</h2>
            <p className="text-xs text-muted-foreground">
              Active tickets past their expected completion date
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFetching && !isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : null}
          {total > 0 ? (
            <Badge variant="warning">{total} overdue</Badge>
          ) : null}
          <Link href="/repairs?overdue=true">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4 py-4 sm:px-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="px-4 py-8 text-center sm:px-5">
          <p className="text-sm text-destructive">Failed to load overdue repairs.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="text-sm font-medium text-foreground">No overdue repairs</p>
          <p className="mt-1 text-xs text-muted-foreground">
            All active tickets are on track or have no expected completion date set.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <ul className="divide-y divide-border/60">
          {items.map((repair) => (
            <li key={repair.id}>
              <Link
                href={`/repairs/${repair.id}`}
                className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">
                      #{repair.ticketNumber}
                    </span>
                    <Badge variant="warning" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </Badge>
                  </div>
                  <p className="truncate text-sm font-medium text-foreground">
                    {repair.customer.name} · {repair.device.brand} {repair.device.model ?? ''}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Due {formatDate(repair.expectedCompletionDate)}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
                  <span className="font-medium text-foreground">
                    {formatStatusLabel(repair.status)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
