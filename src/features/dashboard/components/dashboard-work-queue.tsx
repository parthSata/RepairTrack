'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  Loader2,
  Plus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRepairs } from '@/features/repairs/queries'
import { computeIsRepairOverdue } from '@/features/repairs/overdue'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '-'
  }
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const STATUS_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'warning' | 'destructive'> = {
  RECEIVED: 'outline',
  DIAGNOSING: 'secondary',
  WAITING_FOR_PARTS: 'warning',
  IN_REPAIR: 'default',
  WAITING_FOR_APPROVAL: 'warning',
  APPROVED: 'secondary',
  QUALITY_CHECK: 'secondary',
  READY_FOR_PICKUP: 'default',
  COMPLETED: 'secondary',
}

export function DashboardWorkQueue() {
  const { data, isLoading, isError, refetch, isFetching } = useRepairs({
    limit: 6,
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const items = data?.items ?? []
  const total = data?.pagination?.total ?? 0

  return (
    <Card className="border-border/80 shadow-xs">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-border/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Work Queue</h2>
                {total > 0 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                    {total} total
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Recent repairs and actionable items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFetching && !isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
            ) : null}
            <Link href="/repairs/new">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                New ticket
              </Button>
            </Link>
            <Link href="/repairs">
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">Failed to load recent repairs.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ClipboardList className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No repairs logged yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Create your first repair ticket to start tracking bench progress and turnaround times.
            </p>
            <Link href="/repairs/new" className="mt-4">
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Create first ticket
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/50 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3">Ticket</th>
                  <th scope="col" className="px-4 py-3">Customer & Device</th>
                  <th scope="col" className="px-4 py-3">Target Date</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((repair) => {
                  const isOverdue = computeIsRepairOverdue(
                    repair.expectedCompletionDate,
                    repair.status,
                  )

                  return (
                    <tr
                      key={repair.id}
                      className="group transition-colors hover:bg-muted/40"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <Link
                          href={`/repairs/${repair.id}`}
                          className="font-mono text-xs font-bold text-primary group-hover:underline"
                        >
                          #{repair.ticketNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground text-xs sm:text-sm">
                            {repair.customer.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {repair.device.brand} {repair.device.model ?? ''}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Overdue ({formatDate(repair.expectedCompletionDate)})
                          </span>
                        ) : repair.expectedCompletionDate ? (
                          <span className="text-muted-foreground">
                            Due {formatDate(repair.expectedCompletionDate)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Badge
                          variant={STATUS_BADGE_VARIANTS[repair.status] ?? 'outline'}
                          className="text-[11px] font-medium"
                        >
                          {formatStatusLabel(repair.status)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <Link
                          href={`/repairs/${repair.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Open <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
