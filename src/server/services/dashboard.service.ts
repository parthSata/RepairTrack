import { and, eq, gte, lt, sql } from 'drizzle-orm'
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

  const repairScope = technicianId
    ? and(eq(repairs.shopId, shopId), eq(repairs.assignedTechnicianId, technicianId))
    : eq(repairs.shopId, shopId)

  const [repairCounts, completedResult] = await Promise.all([
    db
      .select({
        todaysRepairs: sql<number>`count(*) filter (where ${repairs.createdAt} >= ${start.toISOString()}::timestamptz and ${repairs.createdAt} < ${end.toISOString()}::timestamptz)`.mapWith(
          Number,
        ),
        activeRepairs: sql<number>`count(*) filter (where ${repairs.status} not in ('COMPLETED', 'CANCELLED'))`.mapWith(
          Number,
        ),
        readyForPickup: sql<number>`count(*) filter (where ${repairs.status} = 'READY_FOR_PICKUP')`.mapWith(
          Number,
        ),
      })
      .from(repairs)
      .where(repairScope),
    db
      .select({
        completedToday: sql<number>`count(*)`.mapWith(Number),
      })
      .from(repairStatusHistory)
      .innerJoin(repairs, eq(repairs.id, repairStatusHistory.repairId))
      .where(
        and(
          eq(repairs.shopId, shopId),
          eq(repairStatusHistory.toStatus, 'COMPLETED'),
          gte(repairStatusHistory.createdAt, start),
          lt(repairStatusHistory.createdAt, end),
          technicianId ? eq(repairs.assignedTechnicianId, technicianId) : undefined,
        ),
      ),
  ])

  return {
    todaysRepairs: repairCounts[0]?.todaysRepairs ?? 0,
    activeRepairs: repairCounts[0]?.activeRepairs ?? 0,
    readyForPickup: repairCounts[0]?.readyForPickup ?? 0,
    completedToday: completedResult[0]?.completedToday ?? 0,
  }
}
