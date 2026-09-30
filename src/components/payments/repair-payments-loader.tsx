'use client'

import type { ReactNode } from 'react'
import { QueryErrorState } from '@/components/ui/query-error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useRepairPayments, type RepairPayments } from '@/features/payments/queries'

type RepairPaymentsLoaderProps = {
  repairId: string
  children: (data: RepairPayments) => ReactNode
}

/** Fetches a repair's payments and owns the loading and error states, so callers only render data. */
export function RepairPaymentsLoader({ repairId, children }: RepairPaymentsLoaderProps) {
  const { data, isPending, isError, error, refetch } = useRepairPayments(repairId)

  if (isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading payments">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (isError) {
    return (
      <QueryErrorState
        className="print:hidden"
        error={error}
        fallback="Failed to load payments."
        forbiddenMessage="You don't have access to payments."
        onRetry={() => void refetch()}
      />
    )
  }

  return <>{children(data)}</>
}
