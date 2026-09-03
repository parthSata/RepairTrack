import { and, desc, eq } from 'drizzle-orm'
import { config } from 'dotenv'
import { HTTPException } from 'hono/http-exception'
import { db } from '@/server/db'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import { revisedEstimatedTotalPaise } from '@/features/repairs/money'
import {
  buildPublicTrackingPayload,
  getPublicRepairByTrackingToken,
} from '@/server/services/tracking.service'
import {
  requestCustomerApproval,
  updateRepairStatus,
} from '@/server/services/repair.service'

config({ path: '.env.local' })

const ADDITIONAL_RUPEES = 4500
const ADDITIONAL_PAISE = 450000
const ORIGINAL_PAISE = 100000

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

async function testGuardMissingDiagnosis(
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
        additionalEstimatedCostRupees: ADDITIONAL_RUPEES,
      }),
    400,
    'Add a diagnosis before requesting customer approval',
    'Test A (missing diagnosis)',
  )

  await restoreRepairSnapshot(repairId, original)
  console.log('Test A passed: blocked when diagnosis is missing')
}

async function testNullOriginalAllowed(
  repairId: string,
  shopId: string,
  staffId: string,
  original: Awaited<ReturnType<typeof saveRepairSnapshot>>,
) {
  await cleanupApprovalArtifacts(repairId)
  await db
    .update(repairs)
    .set({
      diagnosis: 'Board-level repair',
      estimatedCost: null,
      status: 'DIAGNOSING',
      updatedAt: new Date(),
    })
    .where(eq(repairs.id, repairId))

  const result = await requestCustomerApproval({
    shopId,
    userRole: 'STAFF',
    userId: staffId,
    id: repairId,
    additionalEstimatedCostRupees: ADDITIONAL_RUPEES,
  })

  if (result.estimatedCost !== null) {
    throw new Error('Test D failed: original estimated_cost should remain null')
  }

  if (result.approval?.additionalEstimatedCost !== ADDITIONAL_PAISE) {
    throw new Error(
      `Test D failed: expected additional ${ADDITIONAL_PAISE} paise, got ${result.approval?.additionalEstimatedCost}`,
    )
  }

  const revised = revisedEstimatedTotalPaise(result.estimatedCost, result.approval.additionalEstimatedCost)
  if (revised !== ADDITIONAL_PAISE) {
    throw new Error(`Test D failed: expected revised ${ADDITIONAL_PAISE}, got ${revised}`)
  }

  await cleanupApprovalArtifacts(repairId)
  await restoreRepairSnapshot(repairId, original)
  console.log('Test D passed: null original estimate allowed; additional + revised still correct')
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
    additionalEstimatedCostRupees: ADDITIONAL_RUPEES,
  })

  await expectHttpError(
    () =>
      requestCustomerApproval({
        shopId,
        userRole: 'STAFF',
        userId: staffId,
        id: repairId,
        additionalEstimatedCostRupees: ADDITIONAL_RUPEES,
      }),
    400,
    'Customer approval is already pending for this repair',
    'Duplicate pending',
  )

  await cleanupApprovalArtifacts(repairId)
  await restoreRepairSnapshot(repairId, original)
  console.log('Duplicate pending passed: blocked when PENDING approval already exists')
}

async function testSuccessfulRequest(repairId: string, shopId: string, staffId: string) {
  await cleanupApprovalArtifacts(repairId)
  await db
    .update(repairs)
    .set({
      diagnosis: 'Screen replacement required',
      estimatedCost: ORIGINAL_PAISE,
      status: 'DIAGNOSING',
      updatedAt: new Date(),
    })
    .where(eq(repairs.id, repairId))

  const result = await requestCustomerApproval({
    shopId,
    userRole: 'STAFF',
    userId: staffId,
    id: repairId,
    additionalEstimatedCostRupees: ADDITIONAL_RUPEES,
  })

  if (result.status !== 'WAITING_FOR_APPROVAL') {
    throw new Error(`Test B failed: expected status WAITING_FOR_APPROVAL, got ${result.status}`)
  }

  if (!result.approval || result.approval.status !== 'PENDING') {
    throw new Error('Test B failed: expected PENDING approval on repair detail')
  }

  if (result.estimatedCost !== ORIGINAL_PAISE) {
    throw new Error(
      `Test B failed: repairs.estimated_cost must stay ${ORIGINAL_PAISE}, got ${result.estimatedCost}`,
    )
  }

  const [approvalRow] = await db
    .select()
    .from(repairApprovals)
    .where(and(eq(repairApprovals.repairId, repairId), eq(repairApprovals.status, 'PENDING')))

  if (!approvalRow) {
    throw new Error('Test B failed: no PENDING repair_approvals row found')
  }

  if (approvalRow.diagnosisSnapshot !== 'Screen replacement required') {
    throw new Error('Test B failed: diagnosis snapshot mismatch')
  }

  if (approvalRow.additionalEstimatedCost !== ADDITIONAL_PAISE) {
    throw new Error(
      `Test B failed: additional_estimated_cost should be posted paise ${ADDITIONAL_PAISE}, not a copy of estimated_cost`,
    )
  }

  const revised = revisedEstimatedTotalPaise(ORIGINAL_PAISE, ADDITIONAL_PAISE)
  if (revised !== 550000) {
    throw new Error(`Test B failed: expected integer revised 550000, got ${revised}`)
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
    throw new Error('Test B failed: expected repair_status_history row with actor_type=STAFF')
  }

  console.log('Test B passed: original + additional stored separately; revised derived as integer paise')
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
        additionalEstimatedCostRupees: ADDITIONAL_RUPEES,
      }),
    403,
    'Owner cannot change repair status directly',
    'OWNER forbidden',
  )

  console.log('OWNER forbidden passed: OWNER cannot trigger request approval')
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
    throw new Error('Test C skipped setup: repair has no tracking token')
  }

  const payload = await getPublicRepairByTrackingToken(trackingToken)

  if (!payload.pendingApproval) {
    throw new Error('Test C failed: expected pendingApproval on public tracking payload')
  }

  if (!payload.pendingApproval.diagnosis.trim()) {
    throw new Error('Test C failed: pendingApproval.diagnosis is empty')
  }

  if (payload.estimatedCost !== ORIGINAL_PAISE) {
    throw new Error(
      `Test C failed: expected estimatedCost ${ORIGINAL_PAISE} paise, got ${payload.estimatedCost}`,
    )
  }

  if (payload.pendingApproval.originalEstimatedCost !== ORIGINAL_PAISE) {
    throw new Error(
      `Test C failed: expected originalEstimatedCost ${ORIGINAL_PAISE} paise, got ${payload.pendingApproval.originalEstimatedCost}`,
    )
  }

  if (payload.pendingApproval.additionalEstimatedCost !== ADDITIONAL_PAISE) {
    throw new Error(
      `Test C failed: expected additionalEstimatedCost ${ADDITIONAL_PAISE} paise, got ${payload.pendingApproval.additionalEstimatedCost}`,
    )
  }

  if ('estimatedCost' in payload.pendingApproval) {
    throw new Error('Test C failed: pendingApproval should not expose a rupee estimatedCost field')
  }

  const keys = Object.keys(payload.pendingApproval)
  if (keys.some((key) => ['approve', 'reject', 'action', 'requestedBy'].includes(key))) {
    throw new Error('Test C failed: public payload exposes action fields')
  }

  const unitPayload = buildPublicTrackingPayload(
    {
      ticketNumber: payload.ticketNumber,
      status: 'WAITING_FOR_APPROVAL',
      problemDescription: payload.problemDescription,
      estimatedCost: ORIGINAL_PAISE,
      createdAt: new Date(payload.createdAt),
    },
    payload.device,
    payload.updates.map((update) => ({
      toStatus: 'WAITING_FOR_APPROVAL',
      createdAt: new Date(update.timestamp),
    })),
    {
      diagnosisSnapshot: payload.pendingApproval.diagnosis,
      additionalEstimatedCost: ADDITIONAL_PAISE,
    },
  )

  if (!unitPayload.pendingApproval) {
    throw new Error('Test C failed: buildPublicTrackingPayload did not include pendingApproval')
  }

  if (unitPayload.pendingApproval.originalEstimatedCost !== ORIGINAL_PAISE) {
    throw new Error('Test C failed: buildPublicTrackingPayload should expose original in paise')
  }

  if (unitPayload.pendingApproval.additionalEstimatedCost !== ADDITIONAL_PAISE) {
    throw new Error('Test C failed: buildPublicTrackingPayload should expose additional in paise')
  }

  console.log('Test C passed: public tracking returns paise original + additional, no action fields')
}

async function main() {
  const fixture = await getFixtureUsers()
  const original = await saveRepairSnapshot(fixture.repairId)

  try {
    await testGuardMissingDiagnosis(fixture.repairId, fixture.shopId, fixture.staffId, original)
    await testNullOriginalAllowed(fixture.repairId, fixture.shopId, fixture.staffId, original)
    await testDuplicatePending(fixture.repairId, fixture.shopId, fixture.staffId, original)
    await testSuccessfulRequest(fixture.repairId, fixture.shopId, fixture.staffId)
    await testOwnerForbidden(fixture.repairId, fixture.shopId, fixture.ownerId)
    await testManualStatusBlocked(fixture.repairId, fixture.shopId, fixture.staffId)
    await testPublicTrackingPendingApproval(fixture.trackingToken)
    console.log('All request-approval verification tests passed.')
  } finally {
    await cleanupApprovalArtifacts(fixture.repairId)
    await restoreRepairSnapshot(fixture.repairId, original)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
