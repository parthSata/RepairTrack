import { Skeleton } from '@/components/ui/skeleton'

export function TrackSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading repair tracking">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  )
}
