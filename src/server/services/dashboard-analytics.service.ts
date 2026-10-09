import { sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { payments } from '@/server/db/schema/payments'
import { repairs, repairStatusHistory } from '@/server/db/schema/repairs'
import { getPeriodRange } from '@/lib/shop-time'
import { getStartOfToday } from '@/features/repairs/overdue'
import type {
  AnalyticsPeriod,
  RepairAnalyticsResponse,
  RevenueAnalyticsResponse,
} from '@/features/dashboard/schemas'

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

  let trend: Array<{ label: string; amount: number }> = []

  if (period === 'this_month' || period === 'last_month') {
    const dailyRows = await db.execute<{ day_num: string | number; amount: string | number }>(sql`
      SELECT
        EXTRACT(DAY FROM ${payments.paidAt} AT TIME ZONE 'Asia/Kolkata')::int AS day_num,
        COALESCE(SUM(${payments.amount}), 0)::bigint AS amount
      FROM ${payments}
      WHERE ${payments.shopId} = ${shopId}
        AND ${payments.paidAt} >= ${periodRange.start.toISOString()}::timestamptz
        AND ${payments.paidAt} < ${periodRange.end.toISOString()}::timestamptz
      GROUP BY 1
      ORDER BY 1;
    `)
    const dailyMap = new Map<number, number>()
    for (const r of dailyRows) {
      dailyMap.set(Number(r.day_num), Number(r.amount))
    }
    const daysInMonth = new Date(periodRange.start.getFullYear(), periodRange.start.getMonth() + 1, 0).getDate()
    const monthShort = MONTH_NAMES[periodRange.start.getMonth()]
    for (let d = 1; d <= daysInMonth; d++) {
      trend.push({
        label: `${d} ${monthShort}`,
        amount: dailyMap.get(d) ?? 0,
      })
    }
  } else if (period === 'last_3_months') {
    const monthlyRows = await db.execute<{ month_num: string | number; amount: string | number }>(sql`
      SELECT
        EXTRACT(MONTH FROM date_trunc('month', ${payments.paidAt} AT TIME ZONE 'Asia/Kolkata'))::int AS month_num,
        COALESCE(SUM(${payments.amount}), 0)::bigint AS amount
      FROM ${payments}
      WHERE ${payments.shopId} = ${shopId}
        AND ${payments.paidAt} >= ${periodRange.start.toISOString()}::timestamptz
        AND ${payments.paidAt} < ${periodRange.end.toISOString()}::timestamptz
      GROUP BY 1
      ORDER BY 1;
    `)
    const m3Map = new Map<number, number>()
    for (const r of monthlyRows) {
      m3Map.set(Number(r.month_num), Number(r.amount))
    }
    const startM = periodRange.start.getMonth()
    for (let offset = 0; offset < 3; offset++) {
      const mIdx = (startM + offset) % 12
      trend.push({
        label: MONTH_NAMES[mIdx],
        amount: m3Map.get(mIdx + 1) ?? 0,
      })
    }
  } else {
    trend = monthly.map((m) => ({ label: m.month, amount: m.amount }))
  }

  return {
    periodRevenue,
    previousPeriodRevenue,
    thisMonth,
    lastMonthToDate,
    thisYear,
    lastYearToDate,
    monthly,
    trend,
  }
}

interface RepairAnalyticsRow extends Record<string, unknown> {
  created: string | number | null
  previous_created: string | number | null
  pending: string | number | null
  overdue: string | number | null
  completed: string | number | null
  previous_completed: string | number | null
  avg_repair_hours: string | number | null
  previous_avg_repair_hours: string | number | null
}

export async function getRepairAnalytics(
  shopId: string,
  period: AnalyticsPeriod = 'this_month',
): Promise<RepairAnalyticsResponse> {
  const now = new Date()
  const periodRange = getPeriodRange(period, now)
  const dayStartIso = getStartOfToday(now).toISOString()

  const rows = await db.execute<RepairAnalyticsRow>(sql`
    WITH repair_counts AS (
      SELECT
        COUNT(*) FILTER (
          WHERE ${repairs.createdAt} >= ${periodRange.start.toISOString()}::timestamptz
            AND ${repairs.createdAt} < ${periodRange.end.toISOString()}::timestamptz
        )::int AS created,
        COUNT(*) FILTER (
          WHERE ${repairs.createdAt} >= ${periodRange.previousStart.toISOString()}::timestamptz
            AND ${repairs.createdAt} < ${periodRange.previousEnd.toISOString()}::timestamptz
        )::int AS previous_created,
        COUNT(*) FILTER (
          WHERE ${repairs.status} NOT IN ('COMPLETED', 'CANCELLED')
        )::int AS pending,
        COUNT(*) FILTER (
          WHERE ${repairs.expectedCompletionDate} IS NOT NULL
            AND ${repairs.expectedCompletionDate} < ${dayStartIso}::timestamptz
            AND ${repairs.status} NOT IN ('COMPLETED', 'CANCELLED')
        )::int AS overdue
      FROM ${repairs}
      WHERE ${repairs.shopId} = ${shopId}
    ),
    period_completions AS (
      SELECT
        rsh.repair_id,
        r.created_at,
        MAX(rsh.created_at) AS latest_completed_at
      FROM ${repairStatusHistory} rsh
      INNER JOIN ${repairs} r ON r.id = rsh.repair_id
      WHERE r.shop_id = ${shopId}
        AND rsh.to_status = 'COMPLETED'
        AND rsh.created_at >= ${periodRange.start.toISOString()}::timestamptz
        AND rsh.created_at < ${periodRange.end.toISOString()}::timestamptz
      GROUP BY rsh.repair_id, r.created_at
    ),
    previous_completions AS (
      SELECT
        rsh.repair_id,
        r.created_at,
        MAX(rsh.created_at) AS latest_completed_at
      FROM ${repairStatusHistory} rsh
      INNER JOIN ${repairs} r ON r.id = rsh.repair_id
      WHERE r.shop_id = ${shopId}
        AND rsh.to_status = 'COMPLETED'
        AND rsh.created_at >= ${periodRange.previousStart.toISOString()}::timestamptz
        AND rsh.created_at < ${periodRange.previousEnd.toISOString()}::timestamptz
      GROUP BY rsh.repair_id, r.created_at
    )
    SELECT
      rc.created,
      rc.previous_created,
      rc.pending,
      rc.overdue,
      COALESCE((SELECT COUNT(*) FROM period_completions), 0)::int AS completed,
      COALESCE((SELECT COUNT(*) FROM previous_completions), 0)::int AS previous_completed,
      (SELECT AVG(EXTRACT(EPOCH FROM (latest_completed_at - created_at)) / 3600.0) FROM period_completions) AS avg_repair_hours,
      (SELECT AVG(EXTRACT(EPOCH FROM (latest_completed_at - created_at)) / 3600.0) FROM previous_completions) AS previous_avg_repair_hours
    FROM repair_counts rc;
  `)

  const row = rows[0]
  const created = Number(row?.created ?? 0)
  const previousCreated = Number(row?.previous_created ?? 0)
  const pending = Number(row?.pending ?? 0)
  const overdue = Number(row?.overdue ?? 0)
  const completed = Number(row?.completed ?? 0)
  const previousCompleted = Number(row?.previous_completed ?? 0)

  const avgRepairHours =
    row?.avg_repair_hours != null
      ? Math.max(0, Math.round(Number(row.avg_repair_hours) * 10) / 10)
      : null

  const previousAvgRepairHours =
    row?.previous_avg_repair_hours != null
      ? Math.max(0, Math.round(Number(row.previous_avg_repair_hours) * 10) / 10)
      : null

  const statusRows = await db.execute<{ status: string; count: string | number }>(sql`
    SELECT
      ${repairs.status} AS status,
      COUNT(*)::int AS count
    FROM ${repairs}
    WHERE ${repairs.shopId} = ${shopId}
    GROUP BY ${repairs.status};
  `)

  const STATUS_ORDER = [
    'RECEIVED',
    'DIAGNOSING',
    'WAITING_FOR_APPROVAL',
    'APPROVED',
    'WAITING_FOR_PARTS',
    'IN_REPAIR',
    'QUALITY_CHECK',
    'READY_FOR_PICKUP',
    'COMPLETED',
    'CANCELLED',
  ] as const

  const STATUS_LABELS: Record<string, string> = {
    RECEIVED: 'Received',
    DIAGNOSING: 'Diagnosing',
    WAITING_FOR_APPROVAL: 'Waiting for Approval',
    APPROVED: 'Approved',
    WAITING_FOR_PARTS: 'Waiting for Parts',
    IN_REPAIR: 'In Repair',
    QUALITY_CHECK: 'Quality Check',
    READY_FOR_PICKUP: 'Ready for Pickup',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }

  const statusMap = new Map<string, number>()
  for (const r of statusRows) {
    statusMap.set(String(r.status), Number(r.count))
  }

  const statusDistribution = STATUS_ORDER.filter((s) => (statusMap.get(s) ?? 0) > 0).map((s) => ({
    status: s,
    label: STATUS_LABELS[s] ?? s,
    count: statusMap.get(s) ?? 0,
  }))

  return {
    created,
    completed,
    pending,
    overdue,
    avgRepairHours,
    previousCreated,
    previousCompleted,
    previousAvgRepairHours,
    statusDistribution,
  }
}

