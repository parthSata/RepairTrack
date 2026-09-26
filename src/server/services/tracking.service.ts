import { and, asc, desc, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import type { TrackDecisionInput } from '@/features/tracking/schemas'
import type { PublicTrackingResponse } from '@/features/tracking/schemas'
import { storedCostToRupees } from '@/features/repairs/money'
import { paiseToRupees } from '@/lib/money'
import {
  calculateRepairTotal,
  sumPartsCharges,
} from '@/features/repairs/pricing-calc'
import { db } from '@/server/db'
import { customers } from '@/server/db/schema/customers'
import { repairApprovals } from '@/server/db/schema/repair-approvals'
import { repairParts } from '@/server/db/schema/repair-parts'
import { devices, repairStatusHistory, repairs } from '@/server/db/schema/repairs'
import { shops } from '@/server/db/schema/users'
import { phonesMatch } from '@/server/lib/tokens'
import { mapRepairStatusToPublicLabel } from '@/features/tracking/status-labels'
import { getPublicRepairPhotos } from '@/server/services/repair-photo.service'

const PUBLIC_TRACKING_NOT_FOUND = "We couldn't find this repair."
const PUBLIC_APPROVAL_ALREADY_DECIDED = 'This repair estimate has already been decided.'
const DEFAULT_REJECTION_NOTE = 'Customer rejected estimate.'

type RepairRow = {
  ticketNumber: string
  status: typeof repairs.$inferSelect.status
  problemDescription: string | null
  estimatedCost: number | null
  laborCharges: number
  additionalCharges: number
  taxPercent: number
  estimatedTotal: number | null
  finalTotal: number | null
  expectedCompletionDate: Date | null
  createdAt: Date
}

type DeviceRow = {
  brand: string
  model: string | null
}

type ShopRow = {
  name: string | null
  address: string | null
  phone: string | null
  businessHours: string | null
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

type PartChargeRow = {
  unitSellingPrice: number
  quantity: number
}

function toRupeesOrZero(stored: number): number {
  return storedCostToRupees(stored) ?? 0
}

function paiseToPublicRupees(paise: number): number {
  return paiseToRupees(paise)
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

function buildPublicPricing(repair: RepairRow, partLines: PartChargeRow[]) {
  if (repair.estimatedTotal == null) return undefined

  try {
    const partsCharges = sumPartsCharges(partLines)
    const result = calculateRepairTotal({
      laborCharges: repair.laborCharges,
      partsCharges,
      additionalCharges: repair.additionalCharges,
      taxPercent: repair.taxPercent,
    })

    return {
      laborCharges: paiseToPublicRupees(repair.laborCharges),
      partsCharges: paiseToPublicRupees(result.partsCharges),
      additionalCharges: paiseToPublicRupees(repair.additionalCharges),
      taxPercent: repair.taxPercent,
      taxAmount: paiseToPublicRupees(result.taxAmount),
      taxableValue: paiseToPublicRupees(result.taxableValue),
      estimatedTotal: paiseToPublicRupees(repair.estimatedTotal),
      finalTotal:
        repair.finalTotal != null ? paiseToPublicRupees(repair.finalTotal) : null,
    }
  } catch {
    return undefined
  }
}

export function buildPublicTrackingPayload(
  repair: RepairRow,
  device: DeviceRow,
  shop: ShopRow,
  history: HistoryRow[],
  approval?: ApprovalRow | null,
  photos?: { beforeUrl: string; afterUrl: string } | null,
  partLines: PartChargeRow[] = [],
): PublicTrackingResponse {
  const payload: PublicTrackingResponse = {
    ticketNumber: repair.ticketNumber,
    status: mapRepairStatusToPublicLabel(repair.status),
    shopName: shop.name ?? '',
    shopAddress: shop.address ?? '',
    shopPhone: shop.phone ?? '',
    shopBusinessHours: shop.businessHours,
    device: {
      brand: device.brand,
      model: device.model,
    },
    problemDescription: repair.problemDescription,
    expectedCompletionDate: repair.expectedCompletionDate?.toISOString() ?? null,
    createdAt: repair.createdAt.toISOString(),
    updates: history.map((entry) => ({
      label: mapRepairStatusToPublicLabel(entry.toStatus),
      timestamp: entry.createdAt.toISOString(),
    })),
  }

  const pricing = buildPublicPricing(repair, partLines)
  if (pricing) {
    payload.pricing = pricing
    payload.estimatedCost = pricing.estimatedTotal
  } else if (repair.estimatedCost !== null) {
    const rupees = storedCostToRupees(repair.estimatedCost)
    if (rupees != null) payload.estimatedCost = rupees
  }

  if (approval) {
    payload.approval = toPublicApproval(approval)

    if (approval.status === 'PENDING' && !pricing) {
      payload.estimatedCost = payload.approval.revisedTotal
    }
  }

  if (photos) {
    payload.photos = photos
  }

  return payload
}

async function loadPublicRepairData(repairId: string) {
  const [row] = await db
    .select({
      repairId: repairs.id,
      shopId: repairs.shopId,
      ticketNumber: repairs.ticketNumber,
      status: repairs.status,
      problemDescription: repairs.problemDescription,
      estimatedCost: repairs.estimatedCost,
      laborCharges: repairs.laborCharges,
      additionalCharges: repairs.additionalCharges,
      taxPercent: repairs.taxPercent,
      estimatedTotal: repairs.estimatedTotal,
      finalTotal: repairs.finalTotal,
      expectedCompletionDate: repairs.expectedCompletionDate,
      createdAt: repairs.createdAt,
      brand: devices.brand,
      model: devices.model,
      shopName: shops.name,
      shopAddress: shops.address,
      shopPhone: shops.phone,
      shopBusinessHours: shops.businessHours,
    })
    .from(repairs)
    .innerJoin(devices, eq(devices.id, repairs.deviceId))
    .innerJoin(shops, eq(shops.id, repairs.shopId))
    .where(eq(repairs.id, repairId))

  if (!row) {
    return null
  }

  const [history, latestApprovalRows, photos, partLines] = await Promise.all([
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
    getPublicRepairPhotos(row.shopId, repairId, row.status),
    db
      .select({
        unitSellingPrice: repairParts.unitSellingPrice,
        quantity: repairParts.quantity,
      })
      .from(repairParts)
      .where(eq(repairParts.repairId, repairId)),
  ])

  return buildPublicTrackingPayload(
    {
      ticketNumber: row.ticketNumber,
      status: row.status,
      problemDescription: row.problemDescription,
      estimatedCost: row.estimatedCost,
      laborCharges: row.laborCharges,
      additionalCharges: row.additionalCharges,
      taxPercent: row.taxPercent,
      estimatedTotal: row.estimatedTotal,
      finalTotal: row.finalTotal,
      expectedCompletionDate: row.expectedCompletionDate,
      createdAt: row.createdAt,
    },
    {
      brand: row.brand,
      model: row.model,
    },
    {
      name: row.shopName,
      address: row.shopAddress,
      phone: row.shopPhone,
      businessHours: row.shopBusinessHours,
    },
    history,
    latestApprovalRows[0] ?? null,
    photos,
    partLines,
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
