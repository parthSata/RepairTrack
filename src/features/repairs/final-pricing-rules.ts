/** Final pricing is available once the repair reaches Quality Check or later. */

const FINAL_PRICING_VISIBLE_STATUSES = new Set([
  'QUALITY_CHECK',
  'READY_FOR_PICKUP',
  'COMPLETED',
])

export function isFinalPricingVisibleStatus(status: string): boolean {
  return FINAL_PRICING_VISIBLE_STATUSES.has(status)
}

export function canConfirmFinalPricing({
  userRole,
  status,
}: {
  userRole: string
  status?: string
}): boolean {
  if (userRole !== 'OWNER' && userRole !== 'STAFF') return false
  if (status === 'COMPLETED') return false
  return true
}

export const FINAL_PRICING_STATUS_MESSAGE =
  'Final pricing can only be confirmed at Quality Check or later.'

export const FINAL_PRICING_COMPLETED_MESSAGE =
  'Final pricing cannot be changed on a completed repair.'

export const FINAL_PRICING_FORBIDDEN_MESSAGE =
  'Only owners and staff can confirm final pricing.'

/** Final bill is confirmed when staff/owner have written final_total. */
export function isFinalBillConfirmed(finalTotal: number | null | undefined): boolean {
  return finalTotal != null
}

export const COMPLETED_REQUIRES_FINAL_MESSAGE =
  'Confirm final pricing before marking this repair completed.'

export function getCompletedTransitionError({
  nextStatus,
  finalTotal,
}: {
  nextStatus: string
  finalTotal: number | null | undefined
}): string | null {
  if (nextStatus !== 'COMPLETED') return null
  if (isFinalBillConfirmed(finalTotal)) return null
  return COMPLETED_REQUIRES_FINAL_MESSAGE
}