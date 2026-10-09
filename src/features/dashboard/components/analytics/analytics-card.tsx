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
  query,
  isEmpty = false,
  emptyText,
  skeleton,
  className,
  children,
}: AnalyticsCardProps<T>) {
  const { data, isPending, isError, error, isFetching, refetch } = query

  return (
    <Card className={cn('border-border shadow-none', className)}>
      <CardContent className="p-5 flex flex-col justify-between h-full">

        <div className="flex items-start justify-between gap-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        </div>

        {isPending && !data ? (
          skeleton ?? <Skeleton className="mt-6 h-10 w-24" />
        ) : isError && !data ? (
          <div className="mt-6">
            <QueryErrorState
              error={error}
              fallback="Failed to load analytics."
              onRetry={() => void refetch()}
            />
          </div>
        ) : isEmpty ? (
          <div className="mt-6 flex min-h-20 flex-col items-center justify-center text-center">
            <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : data ? (
          <div className="mt-6">{children(data)}</div>
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
