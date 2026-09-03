import { and, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm'
import { config } from 'dotenv'
import { db } from '@/server/db'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import {
  getApprovalStatusEmoji,
  getApprovalStatusLabel,
  getApprovalStatusBadgeVariant,
} from '@/components/repairs/approval-status-badge'
import { getRepairById } from '@/server/services/repair.service'

config({ path: '.env.local' })

async function getFixtureRepair() {
  // Use STAFF/OWNER so getRepairById is not blocked by technician assignment scope.
  const [row] = await db
    .select({
      repairId: repairs.id,
      shopId: repairs.shopId,
      diagnosis: repairs.diagnosis,
      userId: users.id,
      userRole: users.role,
    })
    .from(repairs)
    .innerJoin(
      users,
      and(eq(users.shopId, repairs.shopId), inArray(users.role, ['OWNER', 'STAFF'])),
    )
    .limit(1)

  if (!row) {
    throw new Error('No repair + STAFF/OWNER user found for approval schema verification')
  }

  return row
}

async function testOnePendingPerRepair(repairId: string, requestedBy: string, diagnosis: string | null) {
  await db.delete(repairApprovals).where(eq(repairApprovals.repairId, repairId))

  const snapshot = diagnosis ?? 'Test diagnosis snapshot'
  const requestedAt = new Date()

  const [first] = await db
    .insert(repairApprovals)
    .values({
      repairId,
      status: 'PENDING',
      initialEstimatedCost: 100000,
      additionalEstimatedCost: 150000,
      initialEstimatedCost: 0,
      diagnosisSnapshot: snapshot,
      requestedBy,
      requestedAt,
    })
    .returning({ id: repairApprovals.id })

  let duplicateBlocked = false
  try {
    await db.insert(repairApprovals).values({
      repairId,
      status: 'PENDING',
      initialEstimatedCost: 100000,
      additionalEstimatedCost: 200000,
      initialEstimatedCost: 0,
      diagnosisSnapshot: snapshot,
      requestedBy,
      requestedAt: new Date(),
    })
  } catch {
    duplicateBlocked = true
  }

  await db.delete(repairApprovals).where(eq(repairApprovals.id, first!.id))

  if (!duplicateBlocked) {
    throw new Error('Test A failed: second PENDING approval was allowed for the same repair')
  }

  console.log('Test A passed: only one PENDING repair_approvals row per repair')
}

async function testActorTypeBackfill() {
  const [staffRowsWithWrongActor] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(repairStatusHistory)
    .where(
      and(isNotNull(repairStatusHistory.changedBy), ne(repairStatusHistory.actorType, 'STAFF')),
    )

  if ((staffRowsWithWrongActor?.count ?? 0) !== 0) {
    throw new Error(
      `Test B failed: ${staffRowsWithWrongActor?.count ?? 0} staff-attributed rows have actor_type != STAFF`,
    )
  }

  console.log(
    'Test B passed: staff-attributed repair_status_history rows use actor_type=STAFF (CUSTOMER rows allowed)',
  )
}

async function testApprovalDisplay(
  repairId: string,
  shopId: string,
  userId: string,
  userRole: 'OWNER' | 'STAFF' | 'TECHNICIAN',
  diagnosis: string | null,
) {
  const snapshot = diagnosis ?? 'Display test diagnosis snapshot'
  const requestedBy = userId
  const decidedAt = new Date('2026-08-30T10:00:00.000Z')

  const cases = [
    {
      status: 'PENDING' as const,
      decidedAt: null,
      rejectionReason: null,
      expectedVariant: 'warning' as const,
      expectedEmoji: '🟡',
    },
    {
      status: 'APPROVED' as const,
      decidedAt,
      rejectionReason: null,
      expectedVariant: 'success' as const,
      expectedEmoji: '🟢',
    },
    {
      status: 'REJECTED' as const,
      decidedAt,
      rejectionReason: 'Cost too high',
      expectedVariant: 'destructive' as const,
      expectedEmoji: '🔴',
    },
  ]

  for (const testCase of cases) {
    await db.delete(repairApprovals).where(eq(repairApprovals.repairId, repairId))

    await db.insert(repairApprovals).values({
      repairId,
      status: testCase.status,
      initialEstimatedCost: 50000,
      additionalEstimatedCost: 99000,
      initialEstimatedCost: 0,
      diagnosisSnapshot: snapshot,
      requestedBy,
      requestedAt: new Date(),
      decidedAt: testCase.decidedAt,
      rejectionReason: testCase.rejectionReason,
    })

    const repair = await getRepairById({
      shopId,
      userRole,
      userId,
      id: repairId,
    })

    if (!repair.approval || repair.approval.status !== testCase.status) {
      throw new Error(`Test C failed: expected approval status ${testCase.status}`)
    }

    const label = getApprovalStatusLabel({
      ...repair.approval,
      requestedAt:
        repair.approval.requestedAt instanceof Date
          ? repair.approval.requestedAt.toISOString()
          : repair.approval.requestedAt,
      decidedAt:
        repair.approval.decidedAt instanceof Date
          ? repair.approval.decidedAt.toISOString()
          : repair.approval.decidedAt,
      requestedBy: repair.approval.requestedBy ?? { id: userId, name: 'Test User', role: userRole },
    })
    const variant = getApprovalStatusBadgeVariant(repair.approval.status)
    const emoji = getApprovalStatusEmoji(repair.approval.status)

    if (testCase.status === 'PENDING' && !label.startsWith('Customer Approval — Pending')) {
      throw new Error(`Test C failed for PENDING: expected label starting with "Customer Approval — Pending", got "${label}"`)
    }

    if (testCase.status === 'APPROVED' && !label.startsWith('Approved ·')) {
      throw new Error(`Test C failed for APPROVED: unexpected label "${label}"`)
    }

    if (
      testCase.status === 'REJECTED' &&
      (!label.startsWith('Rejected ·') || !label.includes('Cost too high'))
    ) {
      throw new Error(`Test C failed for REJECTED: unexpected label "${label}"`)
    }

    if (variant !== testCase.expectedVariant) {
      throw new Error(`Test C failed for ${testCase.status}: unexpected badge variant ${variant}`)
    }

    if (emoji !== testCase.expectedEmoji) {
      throw new Error(`Test C failed for ${testCase.status}: unexpected emoji ${emoji}`)
    }
  }

  await db.delete(repairApprovals).where(eq(repairApprovals.repairId, repairId))

  console.log('Test C passed: approval indicator labels/variants for PENDING, APPROVED, REJECTED')
}

async function main() {
  const fixture = await getFixtureRepair()
  await testOnePendingPerRepair(fixture.repairId, fixture.userId, fixture.diagnosis)
  await testActorTypeBackfill()
  await testApprovalDisplay(
    fixture.repairId,
    fixture.shopId,
    fixture.userId,
    fixture.userRole,
    fixture.diagnosis,
  )
  console.log('All approval schema verification tests passed.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
