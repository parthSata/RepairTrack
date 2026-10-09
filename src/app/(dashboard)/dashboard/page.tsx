import Link from 'next/link'
import { headers } from 'next/headers'
import { Plus } from 'lucide-react'
import { auth } from '@/server/auth'
import { DashboardStatCards } from '@/features/dashboard/components/dashboard-stat-cards'
import { AnalyticsSection } from '@/features/dashboard/components/analytics/analytics-section'
import { DashboardWorkQueue } from '@/features/dashboard/components/dashboard-work-queue'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = session?.user.role ?? 'OWNER'
  const shopId = session?.user.shopId

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* 1. Dashboard Header */}
      <section className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Operations Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Keep the bench moving.</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
            Real-time intake, active queue status, and business performance at a glance.
          </p>
        </div>
        <Link
          href="/repairs/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 shrink-0"
        >
          <Plus aria-hidden="true" className="h-4 w-4" /> Create repair
        </Link>
      </section>

      {/* 2. Today's Operations: 4 compact cards */}
      <DashboardStatCards shopId={shopId ?? undefined} />

      {/* 3. Business Analytics: Period KPIs & Matched Granularity Charts */}
      {role === 'OWNER' || role === 'STAFF' ? (
        <AnalyticsSection shopId={shopId ?? undefined} />
      ) : null}

      {/* 4. Live Work Queue: Recent repairs table with overdue prioritization */}
      <DashboardWorkQueue />
    </div>
  )
}
