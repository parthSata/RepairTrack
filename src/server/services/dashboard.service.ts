import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { repairStatusHistory, repairs } from '@/server/db/schema/repairs'

function getShopLocalDayBounds() {
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date()
  dayEnd.setHours(23, 59, 59, 999)
  return {
    dayStart,
    dayEnd,
    dayStartIso: dayStart.toISOString(),
    dayEndIso: dayEnd.toISOString(),
  }
}

export async function getDashboardSummary({
  shopId,
  userId,
  userRole,
}: {
  shopId: string
  userId: string
  userRole: string
}) {
  const { dayStart, dayEnd, dayStartIso, dayEndIso } = getShopLocalDayBounds()
  const technicianId = userRole === 'TECHNICIAN' ? userId : null

  const repairScope = technicianId
    ? and(eq(repairs.shopId, shopId), eq(repairs.assignedTechnicianId, technicianId))
    : eq(repairs.shopId, shopId)

  const [repairCounts, completedResult] = await Promise.all([
    db
      .select({
        todaysRepairs: sql<number>`count(*) filter (where ${repairs.createdAt} >= ${dayStartIso}::timestamptz and ${repairs.createdAt} <= ${dayEndIso}::timestamptz)`.mapWith(
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
          gte(repairStatusHistory.createdAt, dayStart),
          lte(repairStatusHistory.createdAt, dayEnd),
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
