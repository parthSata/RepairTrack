import {
  getCompletedTransitionError,
  isFinalBillConfirmed,
} from '@/features/repairs/final-pricing-rules'

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

export type StatusTransitionOptions = {
  finalTotal?: number | null
}

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

function baseAllowedDestinations(currentStatus: string): readonly RepairStatus[] {
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

  return []
}
export function getAllowedManualStatusDestinations(
  currentStatus: string,
  options?: StatusTransitionOptions,
): readonly RepairStatus[] {
  const base = baseAllowedDestinations(currentStatus)
  if (isFinalBillConfirmed(options?.finalTotal)) return base
  return base.filter((status) => status !== 'COMPLETED')
}

/** True when COMPLETED is in the phase list but blocked until final bill is confirmed. */
export function isCompletedAwaitingFinalBill(
  currentStatus: string,
  finalTotal: number | null | undefined,
): boolean {
  if (isFinalBillConfirmed(finalTotal)) return false
  return baseAllowedDestinations(currentStatus).includes('COMPLETED')
}

export function isManualStatusTransitionAllowed(
  currentStatus: string,
  nextStatus: string,
  options?: StatusTransitionOptions,
): boolean {
  return getAllowedManualStatusDestinations(currentStatus, options).includes(
    nextStatus as RepairStatus,
  )
}

export function getManualStatusTransitionError(
  currentStatus: string,
  nextStatus: string,
  options?: StatusTransitionOptions,
): string | null {
  if (nextStatus === 'WAITING_FOR_APPROVAL') {
    return 'Use Request Customer Approval to send an estimate for approval.'
  }

  const completedError = getCompletedTransitionError({
    nextStatus,
    finalTotal: options?.finalTotal,
  })
  if (completedError) return completedError

  if (isManualStatusTransitionAllowed(currentStatus, nextStatus, options)) {
    return null
  }

  if (currentStatus === 'RECEIVED' || currentStatus === 'DIAGNOSING') {
    return 'This status change is not allowed until the repair is approved.'
  }

  return 'Invalid status transition.'
}
