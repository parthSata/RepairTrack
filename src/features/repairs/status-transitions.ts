export const REPAIR_STATUSES = [
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_FOR_APPROVAL',
  'APPROVED',
  'WAITING_FOR_PARTS',
  'IN_REPAIR',
  'QUALITY_CHECK',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
] as const

export type RepairStatus = (typeof REPAIR_STATUSES)[number]

const PRE_APPROVAL_STATUSES = ['RECEIVED', 'DIAGNOSING'] as const satisfies readonly RepairStatus[]

const POST_APPROVAL_STATUSES = [
  'APPROVED',
  'WAITING_FOR_PARTS',
  'IN_REPAIR',
  'QUALITY_CHECK',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly RepairStatus[]

/**
 * Allowed manual destinations for the status dropdown / PATCH /status.
 * WAITING_FOR_APPROVAL is never a manual destination (use Request Customer Approval).
 * APPROVED is not set manually before approval (customer decision only).
 */
export function getAllowedManualStatusDestinations(
  currentStatus: string,
): readonly RepairStatus[] {
  if (currentStatus === 'RECEIVED' || currentStatus === 'DIAGNOSING') {
    return PRE_APPROVAL_STATUSES
  }

  if (
    currentStatus === 'APPROVED' ||
    currentStatus === 'WAITING_FOR_PARTS' ||
    currentStatus === 'IN_REPAIR' ||
    currentStatus === 'QUALITY_CHECK' ||
    currentStatus === 'READY_FOR_PICKUP'
  ) {
    return POST_APPROVAL_STATUSES
  }

  // WAITING_FOR_APPROVAL, COMPLETED, CANCELLED, or unknown: no manual destinations
  return []
}

export function isManualStatusTransitionAllowed(
  currentStatus: string,
  nextStatus: string,
): boolean {
  return getAllowedManualStatusDestinations(currentStatus).includes(
    nextStatus as RepairStatus,
  )
}

export function getManualStatusTransitionError(
  currentStatus: string,
  nextStatus: string,
): string | null {
  if (nextStatus === 'WAITING_FOR_APPROVAL') {
    return 'Use Request Customer Approval to send an estimate for approval.'
  }

  if (isManualStatusTransitionAllowed(currentStatus, nextStatus)) {
    return null
  }

  if (currentStatus === 'RECEIVED' || currentStatus === 'DIAGNOSING') {
    return 'This status change is not allowed until the repair is approved.'
  }

  return 'Invalid status transition.'
}
