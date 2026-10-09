import { sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { payments } from '@/server/db/schema/payments'
import { getPeriodRange } from '@/lib/shop-time'
import type { AnalyticsPeriod, RevenueAnalyticsResponse } from '@/features/dashboard/schemas'

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

interface RevenueRow extends Record<string, unknown> {
  period_revenue: string | number | null
  previous_period_revenue: string | number | null
  this_month: string | number | null
  last_month_to_date: string | number | null
  this_year: string | number | null
  last_year_to_date: string | number | null
  month_index: string | number | null
  month_amount: string | number | null
}

export function getAnalyticsPeriod(period: AnalyticsPeriod) {
  return getPeriodRange(period)
}

export async function getRevenueAnalytics(
  shopId: string,
  period: AnalyticsPeriod = 'this_month',
): Promise<RevenueAnalyticsResponse> {
  const now = new Date()
  const periodRange = getPeriodRange(period, now)
  const thisMonthRange = getPeriodRange('this_month', now)
  const thisYearRange = getPeriodRange('this_year', now)

  const rows = await db.execute<RevenueRow>(sql`
    WITH payment_aggregates AS (
      SELECT
        COALESCE(SUM(${payments.amount}) FILTER (
          WHERE ${payments.paidAt} >= ${periodRange.start.toISOString()}::timestamptz
            AND ${payments.paidAt} < ${periodRange.end.toISOString()}::timestamptz
        ), 0)::bigint AS period_revenue,
        COALESCE(SUM(${payments.amount}) FILTER (
          WHERE ${payments.paidAt} >= ${periodRange.previousStart.toISOString()}::timestamptz
            AND ${payments.paidAt} < ${periodRange.previousEnd.toISOString()}::timestamptz
        ), 0)::bigint AS previous_period_revenue,
        COALESCE(SUM(${payments.amount}) FILTER (
          WHERE ${payments.paidAt} >= ${thisMonthRange.start.toISOString()}::timestamptz
            AND ${payments.paidAt} < ${thisMonthRange.end.toISOString()}::timestamptz
        ), 0)::bigint AS this_month,
        COALESCE(SUM(${payments.amount}) FILTER (
          WHERE ${payments.paidAt} >= ${thisMonthRange.previousStart.toISOString()}::timestamptz
            AND ${payments.paidAt} < ${thisMonthRange.previousEnd.toISOString()}::timestamptz
        ), 0)::bigint AS last_month_to_date,
        COALESCE(SUM(${payments.amount}) FILTER (
          WHERE ${payments.paidAt} >= ${thisYearRange.start.toISOString()}::timestamptz
            AND ${payments.paidAt} < ${thisYearRange.end.toISOString()}::timestamptz
        ), 0)::bigint AS this_year,
        COALESCE(SUM(${payments.amount}) FILTER (
          WHERE ${payments.paidAt} >= ${thisYearRange.previousStart.toISOString()}::timestamptz
            AND ${payments.paidAt} < ${thisYearRange.previousEnd.toISOString()}::timestamptz
        ), 0)::bigint AS last_year_to_date
      FROM ${payments}
      WHERE ${payments.shopId} = ${shopId}
    ),
    monthly_buckets AS (
      SELECT
        EXTRACT(MONTH FROM date_trunc('month', ${payments.paidAt} AT TIME ZONE 'Asia/Kolkata'))::int AS month_index,
        COALESCE(SUM(${payments.amount}), 0)::bigint AS month_amount
      FROM ${payments}
      WHERE ${payments.shopId} = ${shopId}
        AND ${payments.paidAt} >= ${thisYearRange.start.toISOString()}::timestamptz
        AND ${payments.paidAt} < ${thisYearRange.end.toISOString()}::timestamptz
      GROUP BY date_trunc('month', ${payments.paidAt} AT TIME ZONE 'Asia/Kolkata')
    )
    SELECT
      pa.period_revenue,
      pa.previous_period_revenue,
      pa.this_month,
      pa.last_month_to_date,
      pa.this_year,
      pa.last_year_to_date,
      mb.month_index,
      mb.month_amount
    FROM payment_aggregates pa
    LEFT JOIN monthly_buckets mb ON true;
  `)

  const firstRow = rows[0]
  const periodRevenue = Number(firstRow?.period_revenue ?? 0)
  const previousPeriodRevenue = Number(firstRow?.previous_period_revenue ?? 0)
  const thisMonth = Number(firstRow?.this_month ?? 0)
  const lastMonthToDate = Number(firstRow?.last_month_to_date ?? 0)
  const thisYear = Number(firstRow?.this_year ?? 0)
  const lastYearToDate = Number(firstRow?.last_year_to_date ?? 0)

  const monthlyMap = new Map<number, number>()
  for (const row of rows) {
    if (row.month_index != null && row.month_amount != null) {
      monthlyMap.set(Number(row.month_index), Number(row.month_amount))
    }
  }

  const monthly = MONTH_NAMES.map((month, idx) => ({
    month,
    amount: monthlyMap.get(idx + 1) ?? 0,
  }))

  return {
    periodRevenue,
    previousPeriodRevenue,
    thisMonth,
    lastMonthToDate,
    thisYear,
    lastYearToDate,
    monthly,
  }
}

