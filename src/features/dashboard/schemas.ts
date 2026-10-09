import { z } from 'zod'

export const dashboardSummarySchema = z.object({
  todaysRepairs: z.number().int().nonnegative(),
  activeRepairs: z.number().int().nonnegative(),
  readyForPickup: z.number().int().nonnegative(),
  completedToday: z.number().int().nonnegative(),
})

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>

export const ANALYTICS_PERIODS = ['this_month', 'last_month', 'last_3_months', 'this_year'] as const

export const ANALYTICS_PERIOD_LABELS = {
  this_month: 'This month',
  last_month: 'Last month',
  last_3_months: '3 months',
  this_year: 'This year',
} satisfies Record<(typeof ANALYTICS_PERIODS)[number], string>

export const analyticsPeriodSchema = z.enum(ANALYTICS_PERIODS).default('this_month')

export const analyticsQuerySchema = z.object({
  period: analyticsPeriodSchema,
})

export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>

export function parseAnalyticsPeriod(value: unknown): AnalyticsPeriod {
  const result = analyticsPeriodSchema.safeParse(value)
  return result.success ? result.data : 'this_month'
}

export const analyticsPeriodResponseSchema = z.object({
  period: analyticsPeriodSchema,
  start: z.string().datetime(),
  end: z.string().datetime(),
  previousStart: z.string().datetime(),
  previousEnd: z.string().datetime(),
})

export type AnalyticsPeriodResponse = z.infer<typeof analyticsPeriodResponseSchema>
