import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/server/db'
import { repairAssignments } from '@/server/db/schema/repair-assignments'
import { repairs } from '@/server/db/schema/repairs'

export const NON_TERMINAL_REPAIR_STATUSES = [
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_FOR_APPROVAL',
  'APPROVED',
  'WAITING_FOR_PARTS',
  'IN_REPAIR',
  'QUALITY_CHECK',
  'READY_FOR_PICKUP',
] as const

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0]
type DbClient = typeof db | TxClient

export async function insertActiveAssignment(
  client: DbClient,
  {
    shopId,
    repairId,
    technicianId,
    createdBy,
  }: {
    shopId: string
    repairId: string
    technicianId: string
    createdBy: string
  },
) {
  const now = new Date()
  await client.insert(repairAssignments).values({
    shopId,
    repairId,
    technicianId,
    status: 'ACTIVE',
    assignedAt: now,
    createdBy,
    createdAt: now,
    updatedAt: now,
  })
}

/** Mark ACTIVE/ON_HOLD rows for this repair as REASSIGNED, then insert new ACTIVE. */
export async function syncAssignmentOnReassign(
  client: DbClient,
  {
    shopId,
    repairId,
    technicianId,
    createdBy,
  }: {
    shopId: string
    repairId: string
    technicianId: string
    createdBy: string
  },
) {
  const now = new Date()
  await client
    .update(repairAssignments)
    .set({
      status: 'REASSIGNED',
      reassignedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(repairAssignments.shopId, shopId),
        eq(repairAssignments.repairId, repairId),
        inArray(repairAssignments.status, ['ACTIVE', 'ON_HOLD']),
      ),
    )
  await insertActiveAssignment(client, { shopId, repairId, technicianId, createdBy })
}

export async function markActiveOrHeldAssignmentCompleted(
  client: DbClient,
  { shopId, repairId }: { shopId: string; repairId: string },
) {
  const now = new Date()
  await client
    .update(repairAssignments)
    .set({
      status: 'COMPLETED',
      completedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(repairAssignments.shopId, shopId),
        eq(repairAssignments.repairId, repairId),
        inArray(repairAssignments.status, ['ACTIVE', 'ON_HOLD']),
      ),
    )
}

export async function countActiveAssignmentsForTechnician(
  client: DbClient,
  { shopId, technicianId }: { shopId: string; technicianId: string },
) {
  const [row] = await client
    .select({ value: sql<number>`count(*)::int` })
    .from(repairAssignments)
    .innerJoin(repairs, eq(repairs.id, repairAssignments.repairId))
    .where(
      and(
        eq(repairAssignments.shopId, shopId),
        eq(repairAssignments.technicianId, technicianId),
        eq(repairAssignments.status, 'ACTIVE'),
        inArray(repairs.status, [...NON_TERMINAL_REPAIR_STATUSES]),
      ),
    )
  return row?.value ?? 0
}
