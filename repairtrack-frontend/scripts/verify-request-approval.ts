import { and, desc, eq } from 'drizzle-orm'
import { config } from 'dotenv'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import {
  buildPublicTrackingPayload,
  getPublicRepairByTrackingToken,
} from '@/server/services/tracking.service'
import {
  requestCustomerApproval,
  updateRepairStatus,
} from '@/server/services/repair.service'

config({ path: '.env.local' })

async function expectHttpError(
  fn: () => Promise<unknown>,
  expectedStatus: number,
  messageIncludes: string,
  testLabel: string,
) {
  try {
    await fn()
    throw new Error(`${testLabel} failed: expected HTTP ${expectedStatus}, but call succeeded`)
  } catch (error) {
    if (error instanceof HTTPException) {
      if (error.status !== expectedStatus) {
        throw new Error(
          `${testLabel} failed: expected HTTP ${expectedStatus}, got ${error.status} (${error.message})`,
        )
      }
      if (!error.message.includes(messageIncludes)) {
        throw new Error(
          `${testLabel} failed: expected message to include "${messageIncludes}", got "${error.message}"`,
        )
      }
      return
    }
    throw error
  }
}

async function getFixtureUsers() {
  const [staffRow] = await db
    .select({
      repairId: repairs.id,
      shopId: repairs.shopId,
      trackingToken: repairs.trackingToken,
      staffId: users.id,
    })
    .from(repairs)
    .innerJoin(users, and(eq(users.shopId, repairs.shopId), eq(users.role, 'STAFF')))
    .limit(1)

  if (!staffRow) {
    throw new Error('No repair + STAFF user found for request-approval verification')
  }

  const [ownerRow] = await db
    .select({ ownerId: users.id })
    .from(users)
    .where(and(eq(users.shopId, staffRow.shopId), eq(users.role, 'OWNER')))
    .limit(1)

  if (!ownerRow) {
    throw new Error('No OWNER user found for request-approval verification')
  }

  return {
    repairId: staffRow.repairId,
    shopId: staffRow.shopId,
    trackingToken: staffRow.trackingToken,
    staffId: staffRow.staffId,
    ownerId: ownerRow.ownerId,
  }
}

async function saveRepairSnapshot(repairId: string) {
  const [row] = await db
    .select({
      diagnosis: repairs.diagnosis,
      estimatedCost: repairs.estimatedCost,
      status: repairs.status,
    })
    .from(repairs)
    .where(eq(repairs.id, repairId))

  if (!row) {
    throw new Error(`Repair ${repairId} not found`)
  }

  return row
}

async function restoreRepairSnapshot(
  repairId: string,
  snapshot: { diagnosis: string | null; estimatedCost: number | null; status: string },
) {
  await db
    .update(repairs)
    .set({
      diagnosis: snapshot.diagnosis,
      estimatedCost: snapshot.estimatedCost,
      status: snapshot.status as typeof repairs.$inferSelect.status,
      updatedAt: new Date(),
    })
    .where(eq(repairs.id, repairId))
}

async function cleanupApprovalArtifacts(repairId: string) {
  await db.delete(repairApprovals).where(eq(repairApprovals.repairId, repairId))
  await db
    .delete(repairStatusHistory)
    .where(
      and(
        eq(repairStatusHistory.repairId, repairId),
        eq(repairStatusHistory.toStatus, 'WAITING_FOR_APPROVAL'),
      ),
    )
}

async function testGuardMissingDiagnosisOrCost(
  repairId: string,
  shopId: string,
  staffId: string,
  original: Awaited<ReturnType<typeof saveRepairSnapshot>>,
) {
  await cleanupApprovalArtifacts(repairId)
  await db
    .update(repairs)
    .set({ diagnosis: null, estimatedCost: 50000, status: 'DIAGNOSING', updatedAt: new Date() })
    .where(eq(repairs.id, repairId))

  await expectHttpError(
    () =>
      requestCustomerApproval({
        shopId,
        userRole: 'STAFF',
        userId: staffId,
        id: repairId,
      }),
    400,
    'Add a diagnosis before requesting customer approval',
    'Test A (missing diagnosis)',
  )

  await db
    .update(repairs)
    .set({ diagnosis: 'Test diagnosis', estimatedCost: null, updatedAt: new Date() })
    .where(eq(repairs.id, repairId))

  await expectHttpError(
    () =>
      requestCustomerApproval({
        shopId,
        userRole: 'STAFF',
        userId: staffId,
        id: repairId,
      }),
    400,
    'Set an estimated cost before requesting customer approval',
    'Test A (missing estimated cost)',
  )

  await restoreRepairSnapshot(repairId, original)
  console.log('Test A passed: blocked when diagnosis or estimated cost missing')
}

async function testDuplicatePending(
  repairId: string,
  shopId: string,
  staffId: string,
  original: Awaited<ReturnType<typeof saveRepairSnapshot>>,
) {
  await cleanupApprovalArtifacts(repairId)
  await db
    .update(repairs)
    .set({
      diagnosis: 'Duplicate pending test diagnosis',
      estimatedCost: 75000,
      status: 'DIAGNOSING',
      updatedAt: new Date(),
    })
    .where(eq(repairs.id, repairId))

  await requestCustomerApproval({
    shopId,
    userRole: 'STAFF',
    userId: staffId,
    id: repairId,
  })

  await expectHttpError(
    () =>
      requestCustomerApproval({
        shopId,
        userRole: 'STAFF',
        userId: staffId,
        id: repairId,
      }),
    400,
    'Customer approval is already pending for this repair',
    'Test B',
  )

  await cleanupApprovalArtifacts(repairId)
  await restoreRepairSnapshot(repairId, original)
  console.log('Test B passed: blocked when PENDING approval already exists')
}

async function testSuccessfulRequest(repairId: string, shopId: string, staffId: string) {
  await cleanupApprovalArtifacts(repairId)
  await db
    .update(repairs)
    .set({
      diagnosis: 'Screen replacement required',
      estimatedCost: 120000,
      status: 'DIAGNOSING',
      updatedAt: new Date(),
    })
    .where(eq(repairs.id, repairId))

  const result = await requestCustomerApproval({
    shopId,
    userRole: 'STAFF',
    userId: staffId,
    id: repairId,
  })

  if (result.status !== 'WAITING_FOR_APPROVAL') {
    throw new Error(`Test C failed: expected status WAITING_FOR_APPROVAL, got ${result.status}`)
  }

  if (!result.approval || result.approval.status !== 'PENDING') {
    throw new Error('Test C failed: expected PENDING approval on repair detail')
  }

  const [approvalRow] = await db
    .select()
    .from(repairApprovals)
    .where(and(eq(repairApprovals.repairId, repairId), eq(repairApprovals.status, 'PENDING')))

  if (!approvalRow) {
    throw new Error('Test C failed: no PENDING repair_approvals row found')
  }

  if (approvalRow.diagnosisSnapshot !== 'Screen replacement required') {
    throw new Error('Test C failed: diagnosis snapshot mismatch')
  }

  if (approvalRow.additionalEstimatedCost !== 120000) {
    throw new Error('Test C failed: additional_estimated_cost mismatch')
  }

  const [historyRow] = await db
    .select({
      toStatus: repairStatusHistory.toStatus,
      actorType: repairStatusHistory.actorType,
    })
    .from(repairStatusHistory)
    .where(
      and(
        eq(repairStatusHistory.repairId, repairId),
        eq(repairStatusHistory.toStatus, 'WAITING_FOR_APPROVAL'),
      ),
    )
    .orderBy(desc(repairStatusHistory.createdAt))
    .limit(1)

  if (!historyRow || historyRow.actorType !== 'STAFF') {
    throw new Error('Test C failed: expected repair_status_history row with actor_type=STAFF')
  }

  console.log('Test C passed: creates approval row, transitions status, logs history')
  return approvalRow
}

async function testOwnerForbidden(repairId: string, shopId: string, ownerId: string) {
  await expectHttpError(
    () =>
      requestCustomerApproval({
        shopId,
        userRole: 'OWNER',
        userId: ownerId,
        id: repairId,
      }),
    403,
    'Owner cannot change repair status directly',
    'Test D',
  )

  console.log('Test D passed: OWNER cannot trigger request approval')
}

async function testManualStatusBlocked(repairId: string, shopId: string, staffId: string) {
  await expectHttpError(
    () =>
      updateRepairStatus({
        shopId,
        userRole: 'STAFF',
        userId: staffId,
        id: repairId,
        status: 'WAITING_FOR_APPROVAL',
      }),
    400,
    'Use Request Customer Approval',
    'Manual status bypass',
  )

  console.log('Manual bypass blocked: WAITING_FOR_APPROVAL cannot be set via status PATCH')
}

async function testPublicTrackingPendingApproval(trackingToken: string | null) {
  if (!trackingToken) {
    throw new Error('Test E skipped setup: repair has no tracking token')
  }

  const payload = await getPublicRepairByTrackingToken(trackingToken)

  if (!payload.pendingApproval) {
    throw new Error('Test E failed: expected pendingApproval on public tracking payload')
  }

  if (!payload.pendingApproval.diagnosis.trim()) {
    throw new Error('Test E failed: pendingApproval.diagnosis is empty')
  }

  if (typeof payload.pendingApproval.estimatedCost !== 'number') {
    throw new Error('Test E failed: pendingApproval.estimatedCost missing')
  }

  if (payload.pendingApproval.estimatedCost !== 1200) {
    throw new Error(
      `Test E failed: expected pendingApproval.estimatedCost 1200 rupees, got ${payload.pendingApproval.estimatedCost}`,
    )
  }

  const keys = Object.keys(payload.pendingApproval)
  if (keys.some((key) => ['approve', 'reject', 'action', 'requestedBy'].includes(key))) {
    throw new Error('Test E failed: public payload exposes action fields')
  }

  const unitPayload = buildPublicTrackingPayload(
    {
      ticketNumber: payload.ticketNumber,
      status: 'WAITING_FOR_APPROVAL',
      problemDescription: payload.problemDescription,
      estimatedCost: payload.estimatedCost ?? null,
      createdAt: new Date(payload.createdAt),
    },
    payload.device,
    payload.updates.map((update) => ({
      toStatus: 'WAITING_FOR_APPROVAL',
      createdAt: new Date(update.timestamp),
    })),
    {
      diagnosisSnapshot: payload.pendingApproval.diagnosis,
      additionalEstimatedCost: 120000,
    },
  )

  if (!unitPayload.pendingApproval) {
    throw new Error('Test E failed: buildPublicTrackingPayload did not include pendingApproval')
  }

  if (unitPayload.pendingApproval.estimatedCost !== 1200) {
    throw new Error('Test E failed: buildPublicTrackingPayload should expose cost in rupees')
  }

  console.log('Test E passed: public tracking shows diagnosis + cost, no action buttons/fields')
}

async function main() {
  const fixture = await getFixtureUsers()
  const original = await saveRepairSnapshot(fixture.repairId)

  await testGuardMissingDiagnosisOrCost(
    fixture.repairId,
    fixture.shopId,
    fixture.staffId,
    original,
  )
  await testDuplicatePending(fixture.repairId, fixture.shopId, fixture.staffId, original)
  await testSuccessfulRequest(fixture.repairId, fixture.shopId, fixture.staffId)
  await testOwnerForbidden(fixture.repairId, fixture.shopId, fixture.ownerId)
  await testManualStatusBlocked(fixture.repairId, fixture.shopId, fixture.staffId)
  await testPublicTrackingPendingApproval(fixture.trackingToken)

  await cleanupApprovalArtifacts(fixture.repairId)
  await restoreRepairSnapshot(fixture.repairId, original)

  console.log('All request-approval verification tests passed.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
