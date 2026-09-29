import { Skeleton } from '@/components/ui/skeleton'

export function InvoiceDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4" aria-busy="true" aria-label="Loading invoice">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="ml-auto h-32 w-full sm:w-72" />
      </div>
    </div>
  )
}
