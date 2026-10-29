import {
  getCompletedTransitionError,
  hasActiveCustomerApproval,
  isFinalBillConfirmed,
} from '@/features/repairs/pricing-rules'

export type CompletedLockHint = 'finalize bill first' | 'record payment first'

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
  /** Payments cover the finalized bill; required (with the final bill) for COMPLETED. */
  isPaidInFull?: boolean
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

/**
 * After the customer approves; intake statuses are hidden.
 * APPROVED is customer-only — never a manual destination.
 */
const POST_APPROVAL_STATUSES: readonly RepairStatus[] = [
  'WAITING_FOR_PARTS',
  'IN_REPAIR',
  'QUALITY_CHECK',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
]

export const WAITING_FOR_APPROVAL_MANUAL_MESSAGE =
  'Use Request Customer Approval to send an estimate for approval.'

export const APPROVED_MANUAL_MESSAGE =
  'Approved is set when the customer accepts the estimate on their tracking page.'

const NEEDS_APPROVAL_MESSAGE =
  'Send the estimate with Request Customer Approval. Repair statuses unlock after the customer approves.'

const INTAKE_AFTER_APPROVAL_MESSAGE =
  'Customer has approved the estimate. Received and Diagnosing are no longer available.'

export function isCustomerApproved(approvalStatus: string | null | undefined): boolean {
  return approvalStatus === 'APPROVED'
}

/** Post-approval work phase; false on RECEIVED/DIAGNOSING after create or reopen/restore. */
export function isPostApprovalPhase(
  currentStatus: string,
  approvalStatus: string | null | undefined,
): boolean {
  return hasActiveCustomerApproval(currentStatus, approvalStatus)
}

function baseAllowedDestinations(
  currentStatus: string,
  approvalStatus: string | null | undefined,
): readonly RepairStatus[] {
  if (LOCKED_SOURCE_STATUSES.has(currentStatus)) return []
  const phaseStatuses = isPostApprovalPhase(currentStatus, approvalStatus)
    ? POST_APPROVAL_STATUSES
    : PRE_APPROVAL_STATUSES
  return phaseStatuses.filter((status) => status !== currentStatus)
}

function completedError(options?: StatusTransitionOptions) {
  return getCompletedTransitionError({
    nextStatus: 'COMPLETED',
    finalTotal: options?.finalTotal,
    isPaidInFull: options?.isPaidInFull,
  })
}

export function getAllowedManualStatusDestinations(
  currentStatus: string,
  options?: StatusTransitionOptions,
): readonly RepairStatus[] {
  const base = baseAllowedDestinations(currentStatus, options?.approvalStatus)
  if (!completedError(options)) return base
  return base.filter((status) => status !== 'COMPLETED')
}

/**
 * Dropdown values: current status (as selected) plus allowed destinations.
 * Dedupes so current / locked COMPLETED never appear twice.
 * APPROVED is customer-only — omitted even when it is the current status.
 */
export function getManualStatusSelectOptions(
  currentStatus: string,
  options?: StatusTransitionOptions,
): readonly RepairStatus[] {
  const destinations = getAllowedManualStatusDestinations(currentStatus, options)
  const showLockedCompleted = getCompletedLockHint(currentStatus, options) !== null
  const includeCurrent = currentStatus !== 'APPROVED'
  const ordered: RepairStatus[] = [
    ...(includeCurrent ? [currentStatus as RepairStatus] : []),
    ...destinations,
    ...(showLockedCompleted ? (['COMPLETED'] as const) : []),
  ]
  return [...new Set(ordered)]
}

/** Why COMPLETED is shown but disabled; null when it is selectable or not offered at all. */
export function getCompletedLockHint(
  currentStatus: string,
  options?: StatusTransitionOptions,
): CompletedLockHint | null {
  if (!completedError(options)) return null
  if (!baseAllowedDestinations(currentStatus, options?.approvalStatus).includes('COMPLETED')) return null
  return isFinalBillConfirmed(options?.finalTotal) ? 'record payment first' : 'finalize bill first'
}

export function getManualStatusTransitionError(
  currentStatus: string,
  nextStatus: string,
  options?: StatusTransitionOptions,
): string | null {
  if (nextStatus === 'WAITING_FOR_APPROVAL') return WAITING_FOR_APPROVAL_MANUAL_MESSAGE
  if (nextStatus === 'APPROVED') return APPROVED_MANUAL_MESSAGE

  const inPostApproval = isPostApprovalPhase(currentStatus, options?.approvalStatus)
  const next = nextStatus as RepairStatus
  if (!inPostApproval && !PRE_APPROVAL_STATUSES.includes(next)) return NEEDS_APPROVAL_MESSAGE
  if (inPostApproval && !POST_APPROVAL_STATUSES.includes(next)) return INTAKE_AFTER_APPROVAL_MESSAGE

  if (nextStatus === 'COMPLETED') {
    const error = completedError(options)
    if (error) return error
  }

  const allowed = getAllowedManualStatusDestinations(currentStatus, options)
  if (allowed.includes(next)) return null

  return 'This status change is not allowed.'
}
