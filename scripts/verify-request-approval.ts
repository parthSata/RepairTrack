import { and, eq } from 'drizzle-orm'
import { config } from 'dotenv'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Hono } from 'hono'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { db } from '@/server/db'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import { TrackStatusView } from '@/components/tracking/track-status-view'
import { publicTrackingResponseSchema, trackDecisionSchema } from '@/features/tracking/schemas'
import { requestCustomerApprovalSchema } from '@/features/repairs/schemas'
import { calculateRepairTotal, sumPartsCharges } from '@/features/repairs/pricing-calc'
import { getAllowedManualStatusDestinations } from '@/features/repairs/status-transitions'
import { trackRouter } from '@/server/hono/routes/track'
import {
  requestCustomerApproval,
  updateRepairEstimatePricing,
  updateRepairFinalTotal,
  updateRepairStatus,
} from '@/server/services/repair.service'
import { listRepairParts } from '@/server/services/repair-parts.service'
import { getPublicRepairByTrackingToken } from '@/server/services/tracking.service'

config({ path: '.env.local' })

const TEST_APPROVAL_INPUT = {
  diagnosis: 'Screen replacement required',
  laborCharges: 120_000,
  additionalCharges: 45_000,
  taxPercent: 18,
}
const GENERIC_PUBLIC_ERROR = "We couldn't find this repair."
const testApp = new Hono().route('/api/track', trackRouter)

type RepairSnapshot = {
  repair: {
    diagnosis: string | null
    estimatedCost: number | null
    laborCharges: number
    additionalCharges: number
    taxPercent: number
    estimatedTotal: number | null
    finalTotal: number | null
    finalCost: number | null
    status: typeof repairs.$inferSelect.status
    trackingToken: string | null
    updatedAt: Date
  }
  approvals: typeof repairApprovals.$inferSelect[]
  statusHistory: typeof repairStatusHistory.$inferSelect[]
}

type Fixture = {
  repairId: string
  shopId: string
  trackingToken: string
  staffId: string
  ownerId: string
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
      laborCharges: repairs.laborCharges,
      additionalCharges: repairs.additionalCharges,
      taxPercent: repairs.taxPercent,
      estimatedTotal: repairs.estimatedTotal,
      finalTotal: repairs.finalTotal,
      finalCost: repairs.finalCost,
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

    await tx.update(repairs).set(snapshot.repair).where(eq(repairs.id, repairId))
  })
}

async function resetForApprovalFlow({
  repairId,
  trackingToken,
  status = 'DIAGNOSING',
}: {
  repairId: string
  trackingToken: string
  status?: typeof repairs.$inferSelect.status
}) {
  await db.transaction(async (tx) => {
    await tx.delete(repairApprovals).where(eq(repairApprovals.repairId, repairId))
    await tx.delete(repairStatusHistory).where(eq(repairStatusHistory.repairId, repairId))
    await tx
      .update(repairs)
      .set({
        diagnosis: null,
        estimatedCost: null,
        estimatedTotal: null,
        finalTotal: null,
        finalCost: null,
        laborCharges: 0,
        additionalCharges: 0,
        taxPercent: 0,
        status,
        trackingToken,
        updatedAt: new Date(),
      })
      .where(eq(repairs.id, repairId))
  })
}

async function expectedApprovalTotal(shopId: string, repairId: string): Promise<number> {
  const parts = await listRepairParts({ shopId, repairId })
  return calculateRepairTotal({
    laborCharges: TEST_APPROVAL_INPUT.laborCharges,
    partsCharges: sumPartsCharges(parts),
    additionalCharges: TEST_APPROVAL_INPUT.additionalCharges,
    taxPercent: TEST_APPROVAL_INPUT.taxPercent,
  }).total
}

async function sendApprovalAsStaff(fixture: Fixture) {
  return requestCustomerApproval({
    shopId: fixture.shopId,
    userRole: 'STAFF',
    userId: fixture.staffId,
    id: fixture.repairId,
    ...TEST_APPROVAL_INPUT,
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

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

async function testRequestApprovalGuards(fixture: Fixture) {
  const blankDiagnosis = requestCustomerApprovalSchema.safeParse({
    ...TEST_APPROVAL_INPUT,
    diagnosis: '   ',
  })
  assert(!blankDiagnosis.success, 'Guard failed: blank diagnosis must fail schema validation')

  await expectServiceError(
    () =>
      requestCustomerApproval({
        shopId: fixture.shopId,
        userRole: 'OWNER',
        userId: fixture.ownerId,
        id: fixture.repairId,
        ...TEST_APPROVAL_INPUT,
      }),
    403,
    'Owner cannot send estimates for approval',
    'Guard owner forbidden',
  )

  await expectServiceError(
    () =>
      updateRepairStatus({
        shopId: fixture.shopId,
        userRole: 'STAFF',
        userId: fixture.staffId,
        id: fixture.repairId,
        status: 'WAITING_FOR_APPROVAL',
      }),
    400,
    'Use Request Customer Approval',
    'Guard manual status bypass',
  )

  for (const status of ['RECEIVED', 'IN_REPAIR'] as const) {
    await db
      .update(repairs)
      .set({ status, updatedAt: new Date() })
      .where(eq(repairs.id, fixture.repairId))

    await expectServiceError(
      () => sendApprovalAsStaff(fixture),
      409,
      'Set the status to Diagnosing',
      `Guard send from ${status}`,
    )
  }

  await db
    .update(repairs)
    .set({ status: 'CANCELLED', updatedAt: new Date() })
    .where(eq(repairs.id, fixture.repairId))

  await expectServiceError(
    () => sendApprovalAsStaff(fixture),
    409,
    'Completed or cancelled repairs cannot be sent for approval',
    'Guard closed repair',
  )

  console.log('Guard checks passed: diagnosis required, OWNER blocked, Diagnosing-only, closed repairs blocked, direct WAITING_FOR_APPROVAL blocked')
}

async function testApprovalSavesCharges(fixture: Fixture) {
  await db
    .update(repairs)
    .set({ finalTotal: 999_00, finalCost: 999_00, updatedAt: new Date() })
    .where(eq(repairs.id, fixture.repairId))

  const result = await sendApprovalAsStaff(fixture)
  const expectedTotal = await expectedApprovalTotal(fixture.shopId, fixture.repairId)

  assert(result.status === 'WAITING_FOR_APPROVAL', 'Charges test failed: status must be WAITING_FOR_APPROVAL')
  assert(result.diagnosis === TEST_APPROVAL_INPUT.diagnosis, 'Charges test failed: diagnosis not saved')
  assert(result.laborCharges === TEST_APPROVAL_INPUT.laborCharges, 'Charges test failed: labor not saved')
  assert(result.taxPercent === TEST_APPROVAL_INPUT.taxPercent, 'Charges test failed: tax not saved')
  assert(result.estimatedTotal === expectedTotal, 'Charges test failed: estimatedTotal must use calculateRepairTotal')
  assert(result.finalTotal === null, 'Charges test failed: a new approval must clear the previous final bill')
  assert(
    result.approval?.initialEstimatedCost === expectedTotal &&
      result.approval.additionalEstimatedCost === 0,
    'Charges test failed: approval snapshot must store the full total with no add-on',
  )

  console.log('Edge case passed: approval sent from DIAGNOSING saves diagnosis + full charges')
}

async function testStatusPhases(fixture: Fixture) {
  const preApproval = getAllowedManualStatusDestinations('DIAGNOSING', { approvalStatus: null })
  assert(
    preApproval.join(',') === 'RECEIVED',
    `Status test failed: before approval only RECEIVED should follow DIAGNOSING, got ${preApproval.join(',')}`,
  )

  const postApproval = getAllowedManualStatusDestinations('APPROVED', { approvalStatus: 'APPROVED' })
  assert(
    !postApproval.includes('RECEIVED') && !postApproval.includes('DIAGNOSING'),
    'Status test failed: RECEIVED/DIAGNOSING must be hidden after customer approval',
  )
  assert(
    postApproval.includes('IN_REPAIR') && !postApproval.includes('COMPLETED'),
    'Status test failed: repair statuses must unlock after approval, COMPLETED stays gated',
  )

  const received = await updateRepairStatus({
    shopId: fixture.shopId,
    userRole: 'STAFF',
    userId: fixture.staffId,
    id: fixture.repairId,
    status: 'RECEIVED',
  })
  assert(received.status === 'RECEIVED', 'Status test failed: STAFF should move DIAGNOSING -> RECEIVED')

  await expectServiceError(
    () =>
      updateRepairStatus({
        shopId: fixture.shopId,
        userRole: 'STAFF',
        userId: fixture.staffId,
        id: fixture.repairId,
        status: 'IN_REPAIR',
      }),
    400,
    'Repair statuses unlock after the customer approves',
    'Guard repair status before approval',
  )

  console.log('Edge case passed: Received/Diagnosing before approval; repair statuses only after approval')
}

async function testPendingBlocksManualStatusChange(fixture: Fixture) {
  for (const status of ['WAITING_FOR_PARTS', 'IN_REPAIR'] as const) {
    await expectServiceError(
      () =>
        updateRepairStatus({
          shopId: fixture.shopId,
          userRole: 'STAFF',
          userId: fixture.staffId,
          id: fixture.repairId,
          status,
        }),
      409,
      'Customer approval is pending',
      `Guard pending blocks ${status}`,
    )
  }

  console.log('Edge case passed: pending WAITING_FOR_APPROVAL still blocks manual status changes')
}

async function testFinalizeBillFlow(fixture: Fixture) {
  await expectServiceError(
    () =>
      updateRepairStatus({
        shopId: fixture.shopId,
        userRole: 'STAFF',
        userId: fixture.staffId,
        id: fixture.repairId,
        status: 'DIAGNOSING',
      }),
    400,
    'Received and Diagnosing are no longer available',
    'Guard intake status after approval',
  )

  const advanced = await updateRepairStatus({
    shopId: fixture.shopId,
    userRole: 'STAFF',
    userId: fixture.staffId,
    id: fixture.repairId,
    status: 'IN_REPAIR',
  })
  assert(advanced.status === 'IN_REPAIR', 'Finalize test failed: STAFF should continue status changes after APPROVED')

  await expectServiceError(
    () =>
      updateRepairEstimatePricing({
        shopId: fixture.shopId,
        userRole: 'STAFF',
        userId: fixture.staffId,
        id: fixture.repairId,
        laborCharges: 1,
        additionalCharges: 0,
        taxPercent: 0,
      }),
    409,
    'Estimate is approved',
    'Guard estimate save after approval',
  )

  const finalized = await updateRepairFinalTotal({
    shopId: fixture.shopId,
    userRole: 'STAFF',
    userId: fixture.staffId,
    id: fixture.repairId,
    laborCharges: TEST_APPROVAL_INPUT.laborCharges,
    additionalCharges: TEST_APPROVAL_INPUT.additionalCharges + 10_000,
    taxPercent: TEST_APPROVAL_INPUT.taxPercent,
  })
  assert(finalized.finalTotal != null, 'Finalize test failed: Finalize Bill must write finalTotal')
  assert(
    finalized.additionalCharges === TEST_APPROVAL_INPUT.additionalCharges + 10_000,
    'Finalize test failed: Finalize Bill must save the edited charges',
  )
  assert(
    !getAllowedManualStatusDestinations('IN_REPAIR', {
      finalTotal: finalized.finalTotal,
      isPaidInFull: false,
      approvalStatus: 'APPROVED',
    }).includes('COMPLETED'),
    'Finalize test failed: COMPLETED must stay locked until the final bill is paid in full',
  )
  assert(
    getAllowedManualStatusDestinations('IN_REPAIR', {
      finalTotal: finalized.finalTotal,
      isPaidInFull: true,
      approvalStatus: 'APPROVED',
    }).includes('COMPLETED'),
    'Finalize test failed: COMPLETED must be selectable once the final bill is paid in full',
  )

  console.log('Edge case passed: estimate locks after approval; Finalize Bill + full payment unlocks COMPLETED')
}

function testApprovalDialogSource() {
  const dialogSource = readFileSync(
    join(process.cwd(), 'src/components/repairs/request-approval-dialog.tsx'),
    'utf8',
  )
  const detailsSource = readFileSync(
    join(process.cwd(), 'src/components/repairs/repair-details.tsx'),
    'utf8',
  )

  assert(dialogSource.includes('<TicketSummaryGrid'), 'Dialog failed: ticket context grid missing')
  assert(dialogSource.includes('<PricingFormSection'), 'Dialog failed: shared charge fields missing')
  assert(dialogSource.includes('approvalDiagnosisSchema'), 'Dialog failed: diagnosis validation missing')
  assert(
    !dialogSource.includes("'DIAGNOSING'"),
    'Dialog failed: approval must not be limited to DIAGNOSING',
  )
  assert(
    detailsSource.includes('ticketNumber={repair.ticketNumber}') &&
      detailsSource.includes('customerName={repair.customer.name}') &&
      detailsSource.includes('deviceSummary={deviceSummary}') &&
      detailsSource.includes('savedPricing={savedPricing}'),
    'Dialog failed: repair details does not pass ticket context + saved pricing',
  )

  console.log('Edge case passed: approval dialog renders ticket context, diagnosis and shared charge fields')
}

async function testNoApprovalRequired(trackingToken: string) {
  const payload = publicTrackingResponseSchema.parse(await getPublicRepairByTrackingToken(trackingToken))
  assert(!payload.approval, 'Test 1 failed: approval data should be absent when no approval is required')
  const tokenMarkup = renderTrackingViewMarkup(payload, 'token')
  assert(!tokenMarkup.includes('Approve Repair'), 'Test 1 failed: token view should not show action buttons')
  console.log('Test 1 passed: normal tracking page remains unaffected when no approval is required')
}

async function testRequestApprovalAndViews(fixture: Fixture) {
  const result = await sendApprovalAsStaff(fixture)

  assert(result.status === 'WAITING_FOR_APPROVAL', 'Test 2 failed: repair must enter WAITING_FOR_APPROVAL')
  assert(result.approval?.status === 'PENDING', 'Test 2 failed: repair detail approval must be PENDING')
  console.log('Test 2 passed: request approval sets WAITING_FOR_APPROVAL correctly')

  const payload = publicTrackingResponseSchema.parse(
    await getPublicRepairByTrackingToken(fixture.trackingToken),
  )
  assert(payload.approval?.status === 'PENDING', 'Test 3 failed: public payload must expose pending approval')
  assert(payload.approval.decidedAt === null, 'Test 3 failed: pending approval must not have decidedAt')

  const tokenMarkup = renderTrackingViewMarkup(payload, 'token')
  assert(tokenMarkup.includes('Action Required'), 'Test 3 failed: token view must render the action card')
  assert(tokenMarkup.includes('Approve Repair'), 'Test 3 failed: token view must render approve button')
  assert(tokenMarkup.includes('Reject Repair'), 'Test 3 failed: token view must render reject button')
  assert(
    countOccurrences(tokenMarkup, 'Repair charges') === 1,
    'Test 3 failed: pending tracking page must show the charge breakdown exactly once',
  )
  console.log('Test 3 passed: valid token + pending approval renders the action card and charges once')

  const manualMarkup = renderTrackingViewMarkup(payload, 'manual')
  assert(
    manualMarkup.includes('Approve or reject from the link sent to you'),
    'Test 4 failed: manual tracking should show the read-only pending message',
  )
  assert(!manualMarkup.includes('Approve Repair'), 'Test 4 failed: manual tracking must not render approve button')
  assert(!manualMarkup.includes('Reject Repair'), 'Test 4 failed: manual tracking must not render reject button')
  console.log('Test 4 passed: manual /track access stays view-only for pending approval')

  assert(
    tokenMarkup.includes('sm:grid-cols-2') && tokenMarkup.includes('w-full'),
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
  const rawFixture = await getFixtureUsers()
  if (!rawFixture.trackingToken) {
    throw new Error('No repair with tracking token found for request-approval verification')
  }
  const fixture: Fixture = { ...rawFixture, trackingToken: rawFixture.trackingToken }
  const reset = (status?: typeof repairs.$inferSelect.status) =>
    resetForApprovalFlow({ repairId: fixture.repairId, trackingToken: fixture.trackingToken, status })

  const snapshot = await saveSnapshot(fixture.repairId)

  try {
    await reset()
    await testRequestApprovalGuards(fixture)

    await reset()
    await testApprovalSavesCharges(fixture)

    await reset()
    await testStatusPhases(fixture)

    testApprovalDialogSource()

    await reset()
    await testNoApprovalRequired(fixture.trackingToken)

    await reset()
    await testRequestApprovalAndViews(fixture)
    await testPendingBlocksManualStatusChange(fixture)
    await testApproveFlow(fixture.trackingToken, fixture.repairId)
    await testFinalizeBillFlow(fixture)

    await reset()
    await sendApprovalAsStaff(fixture)
    await testRejectFlow(fixture.trackingToken, fixture.repairId)

    await reset()
    await sendApprovalAsStaff(fixture)
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
