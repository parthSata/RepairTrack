'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock,
  Layers,
  Timer,
  Wrench,
} from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRepairAnalytics, useRevenueAnalytics } from '@/features/dashboard/queries'
import {
  ANALYTICS_PERIOD_LABELS,
  ANALYTICS_PERIODS,
  parseAnalyticsPeriod,
} from '@/features/dashboard/schemas'
import { getPeriodRange } from '@/lib/shop-time'
import { formatRepairDuration } from '@/features/dashboard/lib/format-duration'
import { formatRupees } from '@/lib/format-money'
import { useAnalyticsPeriod } from '@/features/dashboard/use-analytics-period'
import { cn } from '@/lib/utils'
import { AnalyticsCard } from './analytics-card'
import { KpiCard } from './kpi-card'
import { MonthlyRevenueChart } from './monthly-revenue-chart'
import { RepairStatusChart } from './repair-status-chart'

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
})

const yearFormatter = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

function formatRangeLabel(start: string, end: string) {
  const startDate = new Date(start)
  // Deduct 1ms so an exclusive boundary like midnight 1 Oct resolves to 30 Sep
  const endDate = new Date(new Date(end).getTime() - 1)
  const startLabel = dateFormatter.format(startDate)
  const endLabel = dateFormatter.format(endDate)
  const startYear = yearFormatter.format(startDate)
  const endYear = yearFormatter.format(endDate)

  return startYear === endYear
    ? `${startLabel} – ${endLabel} ${endYear}`
    : `${startLabel} ${startYear} – ${endLabel} ${endYear}`
}

interface AnalyticsSectionProps {
  shopId?: string | null
}

export function AnalyticsSection({ shopId }: AnalyticsSectionProps = {}) {
  const { period, setPeriod } = useAnalyticsPeriod()
  const repairsQuery = useRepairAnalytics(period, shopId)
  const revenueQuery = useRevenueAnalytics(period, shopId)

  const rangeLabel = useMemo(() => {
    const range = getPeriodRange(period)
    return formatRangeLabel(range.start.toISOString(), range.end.toISOString())
  }, [period])

  const comparisonHint = useMemo(() => {
    switch (period) {
      case 'this_month':
        return 'vs. last month to date'
      case 'this_year':
        return 'vs. last year to date'
      case 'last_month':
        return 'vs. prior month'
      case 'last_3_months':
        return 'vs. prior 3 months'
    }
  }, [period])

  return (
    <section
      aria-labelledby="business-analytics-heading"
      className="space-y-6 motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">
            Business Analytics
          </p>
          <h2 id="business-analytics-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            Understand the work behind the queue.
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            {rangeLabel}
          </p>
        </div>
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(parseAnalyticsPeriod(value))}
          className="min-w-0 overflow-x-auto"
        >
          <TabsList className="w-max min-w-full sm:min-w-0">
            {ANALYTICS_PERIODS.map((option) => (
              <TabsTrigger key={option} value={option}>
                {ANALYTICS_PERIOD_LABELS[option]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Period-specific Repair & Turnaround KPIs */}
      <div
        key={`repairs-${period}`}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none"
      >
        <AnalyticsCard
          title="Repairs logged"
          icon={Wrench}
          iconContainerClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          query={repairsQuery}
          emptyText="No repairs created"
        >
          {(data) => (
            <KpiCard
              value={data.created}
              current={data.created}
              previous={data.previousCreated}
              hint={comparisonHint}
              formatAsRupees={false}
              subtext="Logged in this period"
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Completed in period"
          icon={CheckCircle2}
          iconContainerClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          query={repairsQuery}
          emptyText="No repairs completed"
        >
          {(data) => (
            <KpiCard
              value={data.completed}
              current={data.completed}
              previous={data.previousCompleted}
              hint={comparisonHint}
              formatAsRupees={false}
              subtext="Resolved in this period"
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Pending workload"
          icon={Clock}
          iconContainerClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          query={repairsQuery}
          emptyText="No active repairs"
        >
          {(data) => (
            <KpiCard
              value={data.pending}
              formatAsRupees={false}
              extra={
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Active in queue
                </span>
              }
              subtext="Current active backlog"
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Overdue tickets"
          icon={AlertTriangle}
          iconContainerClassName={cn(
            repairsQuery.data && repairsQuery.data.overdue > 0
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              : 'bg-muted text-muted-foreground',
          )}
          query={repairsQuery}
          emptyText="No overdue repairs"
          className={cn(
            repairsQuery.data &&
              repairsQuery.data.overdue > 0 &&
              'border-rose-300/80 bg-rose-500/[0.04] dark:border-rose-900/60 dark:bg-rose-500/[0.08]',
          )}
        >
          {(data) => (
            <KpiCard
              value={data.overdue}
              valueClassName={data.overdue > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : undefined}
              formatAsRupees={false}
              extra={
                data.overdue > 0 ? (
                  <Link
                    href="/repairs?overdue=true"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
                  >
                    Action overdue <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    All on schedule
                  </span>
                )
              }
              subtext={
                data.overdue > 0 && data.pending > 0
                  ? `${data.overdue} of ${data.pending} active tickets`
                  : 'Past expected completion'
              }
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Avg turnaround time"
          icon={Timer}
          iconContainerClassName="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          query={repairsQuery}
          emptyText="No completion data"
        >
          {(data) => (
            <KpiCard
              value={formatRepairDuration(data.avgRepairHours)}
              current={data.avgRepairHours ?? undefined}
              previous={data.previousAvgRepairHours ?? undefined}
              hint={data.avgRepairHours != null ? comparisonHint : undefined}
              invertTrend={true}
              formatAsRupees={false}
              subtext="Intake to completion"
            />
          )}
        </AnalyticsCard>
      </div>

      {/* Analytics Charts Grid: Large Revenue Trend + Repair Status Breakdown */}
      <div
        key={`charts-${period}`}
        className="grid gap-4 lg:grid-cols-12 items-start motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none"
      >
        <AnalyticsCard
          title={`Revenue trend · ${ANALYTICS_PERIOD_LABELS[period]}`}
          icon={BarChart3}
          iconContainerClassName="bg-accent/10 text-accent"
          query={revenueQuery}
          className="lg:col-span-7 xl:col-span-8"
          emptyText="No revenue data recorded"
        >
          {(data) => (
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-3">
                <div>
                  <span className="text-xs text-muted-foreground">Collected revenue</span>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {formatRupees(data.periodRevenue)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {period === 'this_year' ? '12-month trend' : `${ANALYTICS_PERIOD_LABELS[period]} timeline`}
                </div>
              </div>

              <MonthlyRevenueChart
                data={data.trend ?? data.monthly}
                subtext="Collected payments, incl. GST"
              />
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Repair status breakdown"
          icon={Layers}
          iconContainerClassName="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          query={repairsQuery}
          className="lg:col-span-5 xl:col-span-4"
          emptyText="No active repairs in queue"
        >
          {(data) => (
            <RepairStatusChart
              data={data.statusDistribution}
              subtext="Current active queue stages"
            />
          )}
        </AnalyticsCard>
      </div>
    </section>
  )
}
