/** Estimate pricing may only be edited before/during customer approval. */

export function isEstimatePricingEditableStatus(status: string): boolean {
  return status === 'DIAGNOSING' || status === 'WAITING_FOR_APPROVAL'
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
  if (!isEstimatePricingEditableStatus(status)) return false
  if (userRole === 'OWNER' || userRole === 'STAFF') return true
  if (userRole === 'TECHNICIAN') {
    return assignedTechnicianId === userId
  }
  return false
}

export const ESTIMATE_PRICING_LOCKED_MESSAGE =
  'Estimate pricing cannot be changed after customer approval.'
