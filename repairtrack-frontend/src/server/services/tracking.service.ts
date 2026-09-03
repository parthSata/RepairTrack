import { eq, asc, and } from 'drizzle-orm'

import { HTTPException } from 'hono/http-exception'

import { db } from '@/server/db'

import { customers } from '@/server/db/schema/customers'

import { devices, repairStatusHistory, repairs } from '@/server/db/schema/repairs'

import { repairApprovals } from '@/server/db/schema/repair-approvals'

import { mapRepairStatusToPublicLabel } from '@/features/tracking/status-labels'

import { phonesMatch } from '@/server/lib/tokens'

import type { PublicTrackingResponse } from '@/features/tracking/schemas'

import { storedCostToRupees } from '@/features/repairs/money'



const PUBLIC_TRACKING_NOT_FOUND = "We couldn't find this repair."



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



type PendingApprovalRow = {

  diagnosisSnapshot: string

  initialEstimatedCost: number

  additionalEstimatedCost: number

}



function toRupeesOrZero(stored: number): number {

  return storedCostToRupees(stored) ?? 0

}



export function buildPublicTrackingPayload(

  repair: RepairRow,

  device: DeviceRow,

  history: HistoryRow[],

  pendingApproval?: PendingApprovalRow | null,

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



  if (pendingApproval) {

    const initialEstimate = toRupeesOrZero(pendingApproval.initialEstimatedCost)

    const additionalCost = toRupeesOrZero(pendingApproval.additionalEstimatedCost)

    const revisedTotal = initialEstimate + additionalCost



    payload.pendingApproval = {

      diagnosis: pendingApproval.diagnosisSnapshot,

      initialEstimate,

      additionalCost,

      revisedTotal,

    }

    payload.estimatedCost = revisedTotal

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



  const history = await db

    .select({

      toStatus: repairStatusHistory.toStatus,

      createdAt: repairStatusHistory.createdAt,

    })

    .from(repairStatusHistory)

    .where(eq(repairStatusHistory.repairId, repairId))

    .orderBy(asc(repairStatusHistory.createdAt))



  const [pendingApproval] = await db

    .select({

      diagnosisSnapshot: repairApprovals.diagnosisSnapshot,

      initialEstimatedCost: repairApprovals.initialEstimatedCost,

      additionalEstimatedCost: repairApprovals.additionalEstimatedCost,

    })

    .from(repairApprovals)

    .where(and(eq(repairApprovals.repairId, repairId), eq(repairApprovals.status, 'PENDING')))

    .limit(1)



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

    pendingApproval ?? null,

  )

}



export async function getPublicRepairByTrackingToken(token: string): Promise<PublicTrackingResponse> {

  const [repair] = await db

    .select({ id: repairs.id })

    .from(repairs)

    .where(eq(repairs.trackingToken, token))



  if (!repair) {

    throw new HTTPException(404, { message: PUBLIC_TRACKING_NOT_FOUND })

  }



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

