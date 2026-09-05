import { and, eq } from 'drizzle-orm'
import { config } from 'dotenv'
import { Hono } from 'hono'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { db } from '@/server/db'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import { TrackStatusView } from '@/components/tracking/track-status-view'
import { publicTrackingResponseSchema, trackDecisionSchema } from '@/features/tracking/schemas'
import { trackRouter } from '@/server/hono/routes/track'
import { requestCustomerApproval, updateRepairStatus } from '@/server/services/repair.service'
import { getPublicRepairByTrackingToken } from '@/server/services/tracking.service'

config({ path: '.env.local' })

const TEST_INITIAL_PAISE = 120_000
const TEST_ADDITIONAL_RUPEES = 4500
const GENERIC_PUBLIC_ERROR = "We couldn't find this repair."
const testApp = new Hono().route('/api/track', trackRouter)

type RepairSnapshot = {
  repair: {
    diagnosis: string | null
    estimatedCost: number | null
    status: typeof repairs.$inferSelect.status
    trackingToken: string | null
    updatedAt: Date
  }
  approvals: typeof repairApprovals.$inferSelect[]
  statusHistory: typeof repairStatusHistory.$inferSelect[]
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
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

async function saveSnapshot(repairId: string): Promise<RepairSnapshot> {
  const [repair] = await db
    .select({
      diagnosis: repairs.diagnosis,
      estimatedCost: repairs.estimatedCost,
      status: repairs.status,
      trackingToken: repairs.trackingToken,
      updatedAt: repairs.updatedAt,
    })
    .from(repairs)
    .where(eq(repairs.id, repairId))

  if (!repair) {
    throw new Error(`Repair ${repairId} not found`)
  }

  const [approvals, statusHistory] = await Promise.all([
    db.select().from(repairApprovals).where(eq(repairApprovals.repairId, repairId)),
    db.select().from(repairStatusHistory).where(eq(repairStatusHistory.repairId, repairId)),
  ])

  return { repair, approvals, statusHistory }
}

async function restoreSnapshot(repairId: string, snapshot: RepairSnapshot) {
  await db.transaction(async (tx) => {
    await tx.delete(repairApprovals).where(eq(repairApprovals.repairId, repairId))
    if (snapshot.approvals.length > 0) {
      await tx.insert(repairApprovals).values(snapshot.approvals)
    }

    await tx.delete(repairStatusHistory).where(eq(repairStatusHistory.repairId, repairId))
    if (snapshot.statusHistory.length > 0) {
      await tx.insert(repairStatusHistory).values(snapshot.statusHistory)
    }

    await tx
      .update(repairs)
      .set({
        diagnosis: snapshot.repair.diagnosis,
        estimatedCost: snapshot.repair.estimatedCost,
        status: snapshot.repair.status,
        trackingToken: snapshot.repair.trackingToken,
        updatedAt: snapshot.repair.updatedAt,
      })
      .where(eq(repairs.id, repairId))
  })
}

async function resetForApprovalFlow({
  repairId,
  trackingToken,
}: {
  repairId: string
  trackingToken: string
}) {
  await db.transaction(async (tx) => {
    await tx.delete(repairApprovals).where(eq(repairApprovals.repairId, repairId))
    await tx.delete(repairStatusHistory).where(eq(repairStatusHistory.repairId, repairId))
    await tx
      .update(repairs)
      .set({
        diagnosis: 'Screen replacement required',
        estimatedCost: TEST_INITIAL_PAISE,
        status: 'DIAGNOSING',
        trackingToken,
        updatedAt: new Date(),
      })
      .where(eq(repairs.id, repairId))
  })
}

async function expectServiceError(
  fn: () => Promise<unknown>,
  expectedStatus: number,
  expectedMessage: string,
  label: string,
) {
  try {
    await fn()
    throw new Error(`${label} failed: expected HTTP ${expectedStatus}, but call succeeded`)
  } catch (error) {
    if (!(error instanceof Error) || !('status' in error)) {
      throw error
    }
    const status = (error as { status: number }).status
    if (status !== expectedStatus) {
      throw new Error(`${label} failed: expected HTTP ${expectedStatus}, got ${status}`)
    }
    if (!error.message.includes(expectedMessage)) {
      throw new Error(
        `${label} failed: expected message to include "${expectedMessage}", got "${error.message}"`,
      )
    }
  }
}

async function jsonRequest(path: string, body?: object) {
  const response = await testApp.request(`http://repairtrack.local${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body
      ? {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        }
      : { 'x-forwarded-for': '203.0.113.10' },
    body: body ? JSON.stringify(body) : undefined,
  })

  const rawText = await response.text()
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawText) as Record<string, unknown>
  } catch {
    payload = { message: rawText }
  }
  return { response, payload }
}

function renderTrackingViewMarkup(
  data: ReturnType<typeof publicTrackingResponseSchema.parse>,
  accessMode: 'token' | 'manual',
) {
  return renderToStaticMarkup(React.createElement(TrackStatusView, { data, accessMode }))
}

async function testRequestApprovalGuards(
  repairId: string,
  shopId: string,
  staffId: string,
  ownerId: string,
) {
  await db
    .update(repairs)
    .set({ diagnosis: null, estimatedCost: 50_000, status: 'DIAGNOSING', updatedAt: new Date() })
    .where(eq(repairs.id, repairId))

  await expectServiceError(
    () =>
      requestCustomerApproval({
        shopId,
        userRole: 'STAFF',
        userId: staffId,
        id: repairId,
        additionalEstimatedCostRupees: 0,
      }),
    400,
    'Add a diagnosis before requesting customer approval',
    'Guard missing diagnosis',
  )

  await db
    .update(repairs)
    .set({
      diagnosis: 'Board-level repair',
      estimatedCost: null,
      status: 'DIAGNOSING',
      updatedAt: new Date(),
    })
    .where(eq(repairs.id, repairId))

  await expectServiceError(
    () =>
      requestCustomerApproval({
        shopId,
        userRole: 'STAFF',
        userId: staffId,
        id: repairId,
        additionalEstimatedCostRupees: 0,
      }),
    400,
    'Set an estimated cost before requesting customer approval',
    'Guard missing estimated cost',
  )

  await expectServiceError(
    () =>
      requestCustomerApproval({
        shopId,
        userRole: 'OWNER',
        userId: ownerId,
        id: repairId,
        additionalEstimatedCostRupees: 0,
      }),
    403,
    'Owner cannot change repair status directly',
    'Guard owner forbidden',
  )

  await expectServiceError(
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
    'Guard manual status bypass',
  )

  console.log('Guard checks passed: diagnosis/original estimate required, OWNER blocked, direct WAITING_FOR_APPROVAL blocked')
}

async function testNoApprovalRequired(trackingToken: string) {
  const payload = publicTrackingResponseSchema.parse(await getPublicRepairByTrackingToken(trackingToken))
  assert(!payload.approval, 'Test 1 failed: approval data should be absent when no approval is required')
  const tokenMarkup = renderTrackingViewMarkup(payload, 'token')
  assert(!tokenMarkup.includes('Approve Repair'), 'Test 1 failed: token view should not show action buttons')
  console.log('Test 1 passed: normal tracking page remains unaffected when no approval is required')
}

async function testRequestApprovalAndViews({
  repairId,
  shopId,
  staffId,
  trackingToken,
}: {
  repairId: string
  shopId: string
  staffId: string
  trackingToken: string
}) {
  const result = await requestCustomerApproval({
    shopId,
    userRole: 'STAFF',
    userId: staffId,
    id: repairId,
    additionalEstimatedCostRupees: TEST_ADDITIONAL_RUPEES,
  })

  assert(result.status === 'WAITING_FOR_APPROVAL', 'Test 2 failed: repair must enter WAITING_FOR_APPROVAL')
  assert(result.approval?.status === 'PENDING', 'Test 2 failed: repair detail approval must be PENDING')
  console.log('Test 2 passed: request approval sets WAITING_FOR_APPROVAL correctly')

  const payload = publicTrackingResponseSchema.parse(await getPublicRepairByTrackingToken(trackingToken))
  assert(payload.approval?.status === 'PENDING', 'Test 3 failed: public payload must expose pending approval')
  assert(payload.approval.decidedAt === null, 'Test 3 failed: pending approval must not have decidedAt')

  const tokenMarkup = renderTrackingViewMarkup(payload, 'token')
  assert(tokenMarkup.includes('Action Required'), 'Test 3 failed: token view must render the action card')
  assert(tokenMarkup.includes('Approve Repair'), 'Test 3 failed: token view must render approve button')
  assert(tokenMarkup.includes('Reject Repair'), 'Test 3 failed: token view must render reject button')
  console.log('Test 3 passed: valid token + pending approval renders the action card')

  const manualPayload = publicTrackingResponseSchema.parse(
    await getPublicRepairByTrackingToken(trackingToken),
  )
  const manualMarkup = renderTrackingViewMarkup(manualPayload, 'manual')
  assert(
    manualMarkup.includes('Approve or reject from the link sent to you'),
    'Test 4 failed: manual tracking should show the read-only pending message',
  )
  assert(!manualMarkup.includes('Approve Repair'), 'Test 4 failed: manual tracking must not render approve button')
  assert(!manualMarkup.includes('Reject Repair'), 'Test 4 failed: manual tracking must not render reject button')
  console.log('Test 4 passed: manual /track access stays view-only for pending approval')

  assert(
    tokenMarkup.includes('sm:grid-cols-2') &&
      tokenMarkup.includes('w-full') &&
      tokenMarkup.includes('min-[420px]:flex-row'),
    'Test 11 failed: pending approval UI is missing expected mobile-responsive utility classes',
  )
  console.log('Test 11 passed: pending decision UI includes the expected mobile-responsive layout classes')
}

async function testApproveFlow(trackingToken: string, repairId: string) {
  const { response, payload } = await jsonRequest(`/api/track/${encodeURIComponent(trackingToken)}/decision`, {
    decision: 'APPROVE',
  })
  assert(response.status === 200, `Test 5 failed: expected approve to succeed, got HTTP ${response.status}`)

  const approvedPayload = publicTrackingResponseSchema.parse(payload)
  assert(approvedPayload.approval?.status === 'APPROVED', 'Test 5 failed: approval status should be APPROVED')
  assert(Boolean(approvedPayload.approval.decidedAt), 'Test 5 failed: decidedAt should be recorded')

  const [approvedRow, repairRow, historyRow] = await Promise.all([
    db
      .select()
      .from(repairApprovals)
      .where(and(eq(repairApprovals.repairId, repairId), eq(repairApprovals.status, 'APPROVED')))
      .limit(1),
    db.select({ status: repairs.status }).from(repairs).where(eq(repairs.id, repairId)).limit(1),
    db
      .select({
        actorType: repairStatusHistory.actorType,
        changedBy: repairStatusHistory.changedBy,
      })
      .from(repairStatusHistory)
      .where(and(eq(repairStatusHistory.repairId, repairId), eq(repairStatusHistory.toStatus, 'APPROVED')))
      .limit(1),
  ])

  assert(approvedRow[0]?.decidedAt, 'Test 5 failed: approval row decidedAt missing')
  assert(repairRow[0]?.status === 'APPROVED', 'Test 5 failed: repair status should be APPROVED')
  assert(historyRow[0]?.actorType === 'CUSTOMER', 'Test 5 failed: status history actorType should be CUSTOMER')
  assert(historyRow[0]?.changedBy === null, 'Test 5 failed: status history changedBy must be null')
  console.log('Test 5 passed: approve records APPROVED and timestamp correctly')

  const retry = await jsonRequest(`/api/track/${encodeURIComponent(trackingToken)}/decision`, {
    decision: 'APPROVE',
  })
  assert(retry.response.status === 409, 'Test 6 failed: second approve should be blocked')
  assert(
    JSON.stringify(retry.payload).includes('already been decided'),
    'Test 6 failed: second approve should report already decided',
  )
  console.log('Test 6 passed: second approve attempt is blocked as already decided')
}

async function testRejectFlow(trackingToken: string, repairId: string) {
  const rejectionReason = 'Price is too high for this repair.'
  const { response, payload } = await jsonRequest(`/api/track/${encodeURIComponent(trackingToken)}/decision`, {
    decision: 'REJECT',
    reason: rejectionReason,
  })
  assert(response.status === 200, `Test 7 failed: expected reject to succeed, got HTTP ${response.status}`)

  const rejectedPayload = publicTrackingResponseSchema.parse(payload)
  assert(rejectedPayload.approval?.status === 'REJECTED', 'Test 7 failed: approval status should be REJECTED')
  assert(Boolean(rejectedPayload.approval.decidedAt), 'Test 7 failed: reject decidedAt should be recorded')
  assert(
    rejectedPayload.approval.rejectionReason === rejectionReason,
    'Test 7 failed: rejection reason should round-trip in public payload',
  )

  const [rejectedRow, repairRow, historyRow] = await Promise.all([
    db
      .select()
      .from(repairApprovals)
      .where(and(eq(repairApprovals.repairId, repairId), eq(repairApprovals.status, 'REJECTED')))
      .limit(1),
    db.select({ status: repairs.status }).from(repairs).where(eq(repairs.id, repairId)).limit(1),
    db
      .select({
        actorType: repairStatusHistory.actorType,
        changedBy: repairStatusHistory.changedBy,
        note: repairStatusHistory.note,
      })
      .from(repairStatusHistory)
      .where(and(eq(repairStatusHistory.repairId, repairId), eq(repairStatusHistory.toStatus, 'CANCELLED')))
      .limit(1),
  ])

  assert(rejectedRow[0]?.decidedAt, 'Test 7 failed: rejected approval row decidedAt missing')
  assert(repairRow[0]?.status === 'CANCELLED', 'Test 7 failed: repair status should be CANCELLED')
  assert(historyRow[0]?.actorType === 'CUSTOMER', 'Test 7 failed: rejection actorType should be CUSTOMER')
  assert(historyRow[0]?.changedBy === null, 'Test 7 failed: rejection changedBy must be null')
  assert(historyRow[0]?.note === rejectionReason, 'Test 7 failed: rejection note should use provided reason')
  console.log('Test 7 passed: reject records REJECTED and timestamp correctly')

  const retry = await jsonRequest(`/api/track/${encodeURIComponent(trackingToken)}/decision`, {
    decision: 'APPROVE',
  })
  assert(retry.response.status === 409, 'Test 8 failed: approve-after-reject should be blocked')
  assert(
    JSON.stringify(retry.payload).includes('already been decided'),
    'Test 8 failed: approve-after-reject should report already decided',
  )
  console.log('Test 8 passed: approve attempt after reject is blocked')
}

async function testInvalidTokenAndPayload(trackingToken: string) {
  const invalidTokenResult = await jsonRequest('/api/track/not-a-valid-token/decision', {
    decision: 'APPROVE',
  })
  assert(invalidTokenResult.response.status === 404, 'Test 9 failed: invalid token should return 404')
  assert(
    JSON.stringify(invalidTokenResult.payload).includes(GENERIC_PUBLIC_ERROR),
    'Test 9 failed: invalid token should use the generic public error',
  )
  console.log('Test 9 passed: invalid token returns the generic friendly error')

  const strictValidation = trackDecisionSchema.safeParse({
    decision: 'APPROVE',
    repairId: 'foreign-id',
    customerId: 'other-id',
  })
  assert(!strictValidation.success, 'Test 10 failed: schema should reject foreign identifiers')

  const payloadResult = await jsonRequest(`/api/track/${encodeURIComponent(trackingToken)}/decision`, {
    decision: 'APPROVE',
    repairId: 'foreign-id',
  })
  assert(payloadResult.response.status === 400, 'Test 10 failed: route should reject foreign identifiers')
  assert(
    JSON.stringify(payloadResult.payload).includes('Validation failed'),
    'Test 10 failed: foreign identifier payload should fail validation',
  )
  console.log('Test 10 passed: server ignores/rejects foreign identifiers and trusts only the token')
}

async function main() {
  const fixture = await getFixtureUsers()
  if (!fixture.trackingToken) {
    throw new Error('No repair with tracking token found for request-approval verification')
  }

  const snapshot = await saveSnapshot(fixture.repairId)

  try {
    await resetForApprovalFlow({
      repairId: fixture.repairId,
      trackingToken: fixture.trackingToken,
    })

    await testRequestApprovalGuards(
      fixture.repairId,
      fixture.shopId,
      fixture.staffId,
      fixture.ownerId,
    )

    await resetForApprovalFlow({
      repairId: fixture.repairId,
      trackingToken: fixture.trackingToken,
    })
    await testNoApprovalRequired(fixture.trackingToken)

    await resetForApprovalFlow({
      repairId: fixture.repairId,
      trackingToken: fixture.trackingToken,
    })
    await testRequestApprovalAndViews({
      repairId: fixture.repairId,
      shopId: fixture.shopId,
      staffId: fixture.staffId,
      trackingToken: fixture.trackingToken,
    })
    await testApproveFlow(fixture.trackingToken, fixture.repairId)

    await resetForApprovalFlow({
      repairId: fixture.repairId,
      trackingToken: fixture.trackingToken,
    })
    await requestCustomerApproval({
      shopId: fixture.shopId,
      userRole: 'STAFF',
      userId: fixture.staffId,
      id: fixture.repairId,
      additionalEstimatedCostRupees: TEST_ADDITIONAL_RUPEES,
    })
    await testRejectFlow(fixture.trackingToken, fixture.repairId)

    await resetForApprovalFlow({
      repairId: fixture.repairId,
      trackingToken: fixture.trackingToken,
    })
    await requestCustomerApproval({
      shopId: fixture.shopId,
      userRole: 'STAFF',
      userId: fixture.staffId,
      id: fixture.repairId,
      additionalEstimatedCostRupees: TEST_ADDITIONAL_RUPEES,
    })
    await testInvalidTokenAndPayload(fixture.trackingToken)

    console.log('All request-approval verification tests passed.')
  } finally {
    await restoreSnapshot(fixture.repairId, snapshot)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
