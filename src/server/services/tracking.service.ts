import { and, asc, desc, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import type { TrackDecisionInput } from '@/features/tracking/schemas'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { storedCostToRupees } from '@/features/repairs/money'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { devices, repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { phonesMatch } from '@/server/lib/tokens'
import { mapRepairStatusToPublicLabel } from '@/features/tracking/status-labels'

const PUBLIC_TRACKING_NOT_FOUND = "We couldn't find this repair."
const PUBLIC_APPROVAL_ALREADY_DECIDED = 'This repair estimate has already been decided.'
const DEFAULT_REJECTION_NOTE = 'Customer rejected estimate.'

type RepairRow = {
  ticketNumber: string
  status: typeof repairs.$inferSelect.status
  problemDescription: string | null
  estimatedCost: number | null
  createdAt: Date
}

type DeviceRow = {
  brand: string
  model: string | null
}

type HistoryRow = {
  toStatus: typeof repairStatusHistory.$inferSelect.toStatus
  createdAt: Date
}

type ApprovalRow = {
  id: string
  status: typeof repairApprovals.$inferSelect.status
  diagnosisSnapshot: string
  initialEstimatedCost: number
  additionalEstimatedCost: number
  decidedAt: Date | null
  rejectionReason: string | null
}

function toRupeesOrZero(stored: number): number {
  return storedCostToRupees(stored) ?? 0
}

function toPublicApproval(approval: ApprovalRow) {
  const initialEstimate = toRupeesOrZero(approval.initialEstimatedCost)
  const additionalCost = toRupeesOrZero(approval.additionalEstimatedCost)
  const revisedTotal = initialEstimate + additionalCost

  return {
    status: approval.status,
    diagnosis: approval.diagnosisSnapshot,
    initialEstimate,
    additionalCost,
    revisedTotal,
    decidedAt: approval.decidedAt?.toISOString() ?? null,
    rejectionReason: approval.rejectionReason,
  } as const
}

export function buildPublicTrackingPayload(
  repair: RepairRow,
  device: DeviceRow,
  history: HistoryRow[],
  approval?: ApprovalRow | null,
): PublicTrackingResponse {
  const payload: PublicTrackingResponse = {
    ticketNumber: repair.ticketNumber,
    status: mapRepairStatusToPublicLabel(repair.status),
    device: {
      brand: device.brand,
      model: device.model,
    },
    problemDescription: repair.problemDescription,
    createdAt: repair.createdAt.toISOString(),
    updates: history.map((entry) => ({
      label: mapRepairStatusToPublicLabel(entry.toStatus),
      timestamp: entry.createdAt.toISOString(),
    })),
  }

  if (repair.estimatedCost !== null) {
    const rupees = storedCostToRupees(repair.estimatedCost)
    if (rupees != null) payload.estimatedCost = rupees
  }

  if (approval) {
    payload.approval = toPublicApproval(approval)

    if (approval.status === 'PENDING') {
      payload.estimatedCost = payload.approval.revisedTotal
    }
  }

  return payload
}

async function loadPublicRepairData(repairId: string) {
  const [row] = await db
    .select({
      repairId: repairs.id,
      ticketNumber: repairs.ticketNumber,
      status: repairs.status,
      problemDescription: repairs.problemDescription,
      estimatedCost: repairs.estimatedCost,
      createdAt: repairs.createdAt,
      brand: devices.brand,
      model: devices.model,
    })
    .from(repairs)
    .innerJoin(devices, eq(devices.id, repairs.deviceId))
    .where(eq(repairs.id, repairId))

  if (!row) {
    return null
  }

  const [history, latestApprovalRows] = await Promise.all([
    db
      .select({
        toStatus: repairStatusHistory.toStatus,
        createdAt: repairStatusHistory.createdAt,
      })
      .from(repairStatusHistory)
      .where(eq(repairStatusHistory.repairId, repairId))
      .orderBy(asc(repairStatusHistory.createdAt)),
    db
      .select({
        id: repairApprovals.id,
        status: repairApprovals.status,
        diagnosisSnapshot: repairApprovals.diagnosisSnapshot,
        initialEstimatedCost: repairApprovals.initialEstimatedCost,
        additionalEstimatedCost: repairApprovals.additionalEstimatedCost,
        decidedAt: repairApprovals.decidedAt,
        rejectionReason: repairApprovals.rejectionReason,
      })
      .from(repairApprovals)
      .where(eq(repairApprovals.repairId, repairId))
      .orderBy(desc(repairApprovals.requestedAt))
      .limit(1),
  ])

  return buildPublicTrackingPayload(
    {
      ticketNumber: row.ticketNumber,
      status: row.status,
      problemDescription: row.problemDescription,
      estimatedCost: row.estimatedCost,
      createdAt: row.createdAt,
    },
    {
      brand: row.brand,
      model: row.model,
    },
    history,
    latestApprovalRows[0] ?? null,
  )
}

async function getRepairByActiveTrackingToken(token: string) {
  const [repair] = await db
    .select({ id: repairs.id, status: repairs.status })
    .from(repairs)
    .where(eq(repairs.trackingToken, token))
    .limit(1)

  if (!repair) {
    throw new HTTPException(404, { message: PUBLIC_TRACKING_NOT_FOUND })
  }

  return repair
}

export async function getPublicRepairByTrackingToken(token: string): Promise<PublicTrackingResponse> {
  const repair = await getRepairByActiveTrackingToken(token)

  const payload = await loadPublicRepairData(repair.id)
  if (!payload) {
    throw new HTTPException(404, { message: PUBLIC_TRACKING_NOT_FOUND })
  }

  return payload
}

export async function verifyPublicRepairByTicketAndPhone(
  ticketNumber: string,
  phone: string,
): Promise<PublicTrackingResponse> {
  const rows = await db
    .select({
      repairId: repairs.id,
      customerPhone: customers.phone,
    })
    .from(repairs)
    .innerJoin(customers, eq(customers.id, repairs.customerId))
    .where(eq(repairs.ticketNumber, ticketNumber))

  const match = rows.find((row) => phonesMatch(row.customerPhone, phone))

  if (!match) {
    throw new HTTPException(404, { message: PUBLIC_TRACKING_NOT_FOUND })
  }

  const payload = await loadPublicRepairData(match.repairId)
  if (!payload) {
    throw new HTTPException(404, { message: PUBLIC_TRACKING_NOT_FOUND })
  }

  return payload
}

export async function decideRepairApprovalByTrackingToken(
  trackingToken: string,
  input: TrackDecisionInput,
): Promise<PublicTrackingResponse> {
  const repair = await getRepairByActiveTrackingToken(trackingToken)

  const [latestApproval] = await db
    .select({
      id: repairApprovals.id,
      status: repairApprovals.status,
      diagnosisSnapshot: repairApprovals.diagnosisSnapshot,
      initialEstimatedCost: repairApprovals.initialEstimatedCost,
      additionalEstimatedCost: repairApprovals.additionalEstimatedCost,
      decidedAt: repairApprovals.decidedAt,
      rejectionReason: repairApprovals.rejectionReason,
    })
    .from(repairApprovals)
    .where(eq(repairApprovals.repairId, repair.id))
    .orderBy(desc(repairApprovals.requestedAt))
    .limit(1)

  if (!latestApproval || latestApproval.status !== 'PENDING') {
    if (latestApproval && latestApproval.status !== 'PENDING') {
      throw new HTTPException(409, { message: PUBLIC_APPROVAL_ALREADY_DECIDED })
    }
    throw new HTTPException(404, { message: PUBLIC_TRACKING_NOT_FOUND })
  }

  const now = new Date()
  const rejectionReason = input.decision === 'REJECT' ? input.reason?.trim() || null : null
  const nextRepairStatus = input.decision === 'APPROVE' ? 'APPROVED' : 'CANCELLED'
  const nextApprovalStatus = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  const note = input.decision === 'REJECT' ? rejectionReason ?? DEFAULT_REJECTION_NOTE : null

  await db.transaction(async (tx) => {
    const [updatedApproval] = await tx
      .update(repairApprovals)
      .set({
        status: nextApprovalStatus,
        decidedAt: now,
        rejectionReason,
        updatedAt: now,
      })
      .where(and(eq(repairApprovals.id, latestApproval.id), eq(repairApprovals.status, 'PENDING')))
      .returning({ id: repairApprovals.id })

    if (!updatedApproval) {
      throw new HTTPException(409, { message: PUBLIC_APPROVAL_ALREADY_DECIDED })
    }

    await tx
      .update(repairs)
      .set({
        status: nextRepairStatus,
        updatedAt: now,
      })
      .where(eq(repairs.id, repair.id))

    await tx.insert(repairStatusHistory).values({
      id: crypto.randomUUID(),
      repairId: repair.id,
      fromStatus: repair.status,
      toStatus: nextRepairStatus,
      changedBy: null,
      actorType: 'CUSTOMER',
      note,
      createdAt: now,
    })
  })

  return getPublicRepairByTrackingToken(trackingToken)
}
