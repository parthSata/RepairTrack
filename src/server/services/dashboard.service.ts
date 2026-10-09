import { sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { getTodayRange } from '@/lib/shop-time'

export async function getDashboardSummary({
  shopId,
  userId,
  userRole,
}: {
  shopId: string
  userId: string
  userRole: string
}) {
  const { start, end } = getTodayRange()
  const technicianId = userRole === 'TECHNICIAN' ? userId : null

  const rows = await db.execute<{
    todays_repairs: string | number
    active_repairs: string | number
    ready_for_pickup: string | number
    completed_today: string | number
  }>(sql`
    WITH repair_counts AS (
      SELECT
        COUNT(*) FILTER (
          WHERE ${repairs.createdAt} >= ${start.toISOString()}::timestamptz
            AND ${repairs.createdAt} < ${end.toISOString()}::timestamptz
        ) AS todays_repairs,
        COUNT(*) FILTER (
          WHERE ${repairs.status} NOT IN ('COMPLETED', 'CANCELLED')
        ) AS active_repairs,
        COUNT(*) FILTER (
          WHERE ${repairs.status} = 'READY_FOR_PICKUP'
        ) AS ready_for_pickup
      FROM ${repairs}
      WHERE ${repairs.shopId} = ${shopId}
        ${technicianId ? sql`AND ${repairs.assignedTechnicianId} = ${technicianId}` : sql``}
    ),
    completed_counts AS (
      SELECT
        COUNT(*) AS completed_today
      FROM ${repairStatusHistory} rsh
      INNER JOIN ${repairs} r ON r.id = rsh.repair_id
      WHERE r.shop_id = ${shopId}
        AND rsh.to_status = 'COMPLETED'
        AND rsh.created_at >= ${start.toISOString()}::timestamptz
        AND rsh.created_at < ${end.toISOString()}::timestamptz
        ${technicianId ? sql`AND r.assigned_technician_id = ${technicianId}` : sql``}
    )
    SELECT
      rc.todays_repairs,
      rc.active_repairs,
      rc.ready_for_pickup,
      cc.completed_today
    FROM repair_counts rc
    CROSS JOIN completed_counts cc;
  `)

  const row = rows[0]
  return {
    todaysRepairs: Number(row?.todays_repairs ?? 0),
    activeRepairs: Number(row?.active_repairs ?? 0),
    readyForPickup: Number(row?.ready_for_pickup ?? 0),
    completedToday: Number(row?.completed_today ?? 0),
  }
}
