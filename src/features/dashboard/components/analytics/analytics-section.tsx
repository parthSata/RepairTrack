'use client'

import { CalendarRange } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalyticsQuery } from '@/features/dashboard/queries'
import {
  ANALYTICS_PERIOD_LABELS,
  ANALYTICS_PERIODS,
  parseAnalyticsPeriod,
  type AnalyticsPeriodResponse,
} from '@/features/dashboard/schemas'
import { useAnalyticsPeriod } from '@/features/dashboard/use-analytics-period'

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

export function AnalyticsSection() {
  const { period, setPeriod } = useAnalyticsPeriod()
  const periodQuery = useAnalyticsQuery<AnalyticsPeriodResponse>('period', period)
  const rangeLabel = periodQuery.data
    ? formatRangeLabel(periodQuery.data.start, periodQuery.data.end)
    : 'Loading date range...'

  return (
    <section
      aria-labelledby="business-analytics-heading"
      className="space-y-5 motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none"
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
      <div
        key={period}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none"
      />
    </section>
  )
}
