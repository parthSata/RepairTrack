/** Estimate pricing edit rules by role. */

/** Pre-approval window where assigned technicians may edit the estimate. */
export function isTechnicianEstimateEditableStatus(status: string): boolean {
  return status === 'DIAGNOSING' || status === 'WAITING_FOR_APPROVAL'
}

/** @deprecated Prefer role-aware `canEditEstimatePricing` — kept for call sites that only need the tech window. */
export function isEstimatePricingEditableStatus(status: string): boolean {
  return isTechnicianEstimateEditableStatus(status)
}

export function canEditEstimatePricing({
  status,
  userRole,
  userId,
  assignedTechnicianId,
}: {
  status: string
  userRole: string
  userId: string
  assignedTechnicianId: string | null
}): boolean {
  if (status === 'COMPLETED') return false

  if (userRole === 'OWNER' || userRole === 'STAFF') return true

  if (userRole === 'TECHNICIAN') {
    if (!isTechnicianEstimateEditableStatus(status)) return false
    return assignedTechnicianId === userId
  }

  return false
}

export const ESTIMATE_PRICING_LOCKED_MESSAGE =
  'Estimate pricing cannot be changed on a completed repair.'

export const ESTIMATE_PRICING_TECHNICIAN_LOCKED_MESSAGE =
  'Technicians can only edit estimate pricing before customer approval.'
