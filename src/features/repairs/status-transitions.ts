import {
  getCompletedTransitionError,
  isFinalBillConfirmed,
} from '@/features/repairs/pricing-rules'

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
  /** Latest customer approval status; APPROVED switches the ticket to the post-approval phase. */
  approvalStatus?: string | null
}

/**
 * Statuses the dropdown cannot leave: closed tickets use Reopen/Restore, and a pending customer
 * approval is resolved from the tracking page.
 */
const LOCKED_SOURCE_STATUSES = new Set<string>(['COMPLETED', 'CANCELLED', 'WAITING_FOR_APPROVAL'])

/** Before the customer approves; the ticket moves forward only through Request Customer Approval. */
const PRE_APPROVAL_STATUSES: readonly RepairStatus[] = ['RECEIVED', 'DIAGNOSING']

/** After the customer approves; intake statuses are hidden. */
const POST_APPROVAL_STATUSES: readonly RepairStatus[] = [
  'APPROVED',
  'WAITING_FOR_PARTS',
  'IN_REPAIR',
  'QUALITY_CHECK',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
]

export const WAITING_FOR_APPROVAL_MANUAL_MESSAGE =
  'Use Request Customer Approval to send an estimate for approval.'

const NEEDS_APPROVAL_MESSAGE =
  'Send the estimate with Request Customer Approval. Repair statuses unlock after the customer approves.'

const INTAKE_AFTER_APPROVAL_MESSAGE =
  'Customer has approved the estimate. Received and Diagnosing are no longer available.'

export function isCustomerApproved(approvalStatus: string | null | undefined): boolean {
  return approvalStatus === 'APPROVED'
}

function baseAllowedDestinations(
  currentStatus: string,
  approvalStatus: string | null | undefined,
): readonly RepairStatus[] {
  if (LOCKED_SOURCE_STATUSES.has(currentStatus)) return []
  const phaseStatuses = isCustomerApproved(approvalStatus)
    ? POST_APPROVAL_STATUSES
    : PRE_APPROVAL_STATUSES
  return phaseStatuses.filter((status) => status !== currentStatus)
}

export function getAllowedManualStatusDestinations(
  currentStatus: string,
  options?: StatusTransitionOptions,
): readonly RepairStatus[] {
  const base = baseAllowedDestinations(currentStatus, options?.approvalStatus)
  if (isFinalBillConfirmed(options?.finalTotal)) return base
  return base.filter((status) => status !== 'COMPLETED')
}

/** True when COMPLETED would be selectable but is blocked until the bill is finalized. */
export function isCompletedAwaitingFinalBill(
  currentStatus: string,
  options?: StatusTransitionOptions,
): boolean {
  if (isFinalBillConfirmed(options?.finalTotal)) return false
  return baseAllowedDestinations(currentStatus, options?.approvalStatus).includes('COMPLETED')
}

export function getManualStatusTransitionError(
  currentStatus: string,
  nextStatus: string,
  options?: StatusTransitionOptions,
): string | null {
  if (nextStatus === 'WAITING_FOR_APPROVAL') return WAITING_FOR_APPROVAL_MANUAL_MESSAGE

  const isApproved = isCustomerApproved(options?.approvalStatus)
  const next = nextStatus as RepairStatus
  if (!isApproved && !PRE_APPROVAL_STATUSES.includes(next)) return NEEDS_APPROVAL_MESSAGE
  if (isApproved && !POST_APPROVAL_STATUSES.includes(next)) return INTAKE_AFTER_APPROVAL_MESSAGE

  const completedError = getCompletedTransitionError({
    nextStatus,
    finalTotal: options?.finalTotal,
  })
  if (completedError) return completedError

  const allowed = getAllowedManualStatusDestinations(currentStatus, options)
  if (allowed.includes(next)) return null

  return 'This status change is not allowed.'
}
