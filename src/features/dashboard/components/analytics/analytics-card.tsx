'use client'

import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { BarChart3, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { cn } from '@/lib/utils'

interface AnalyticsCardProps<T> {
  title: string
  icon?: LucideIcon
  iconContainerClassName?: string
  query: UseQueryResult<T, unknown>
  isEmpty?: boolean
  emptyText: string
  skeleton?: ReactNode
  className?: string
  children: (data: T) => ReactNode
}

export function AnalyticsCard<T>({
  title,
  icon: Icon = BarChart3,
  iconContainerClassName,
  query,
  isEmpty = false,
  emptyText,
  skeleton,
  className,
  children,
}: AnalyticsCardProps<T>) {
  const { data, isPending, isError, error, isFetching, refetch } = query

  return (
    <Card className={cn('border-border/80 shadow-xs flex flex-col overflow-hidden', className)}>
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent',
              iconContainerClassName,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        {isPending && !data ? (
          skeleton ?? <Skeleton className="mt-4 h-10 w-24" />
        ) : isError && !data ? (
          <div className="mt-4 flex-1">
            <QueryErrorState
              error={error}
              fallback="Failed to load analytics."
              onRetry={() => void refetch()}
            />
          </div>
        ) : isEmpty ? (
          <div className="mt-4 flex min-h-20 flex-1 flex-col items-center justify-center text-center">
            <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : data ? (
          <div className="mt-3 flex flex-1 flex-col">{children(data)}</div>
        ) : null}

        {data && isError ? (
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-destructive">
            <span>Couldn&apos;t refresh</span>
            <button type="button" onClick={() => void refetch()} className="font-medium underline">
              Retry
            </button>
          </div>
        ) : null}
        {data && !isError && isFetching ? (
          <p className="mt-3 text-xs text-muted-foreground">Refreshing...</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
