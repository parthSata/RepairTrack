import type { Metadata } from 'next'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { RepairList } from '@/components/repairs/repair-list'
import { RepairPageShell } from '@/components/repairs/repair-page-shell'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Repairs | RepairTrack',
  description: 'Manage and track repair service tickets for your shop.',
}

export default async function RepairsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  return (
    <RepairPageShell>
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        }
      >
        <RepairList />
      </Suspense>
    </RepairPageShell>
  )
}
