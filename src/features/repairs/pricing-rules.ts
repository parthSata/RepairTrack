/**
 * Single source of truth for who may change repair pricing, shared by the UI and the API.
 *
 * Flow: the technician sends the estimate from the Request Approval dialog → customer approves →
 * OWNER/STAFF finalize the bill → COMPLETED becomes selectable.
 */

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type PricingRuleViolation = {
  status: 403 | 409
  message: string
}

export type PricingPanelMode = 'hidden' | 'view' | 'editEstimate' | 'finalize'

export const PRICING_MESSAGES = {
  repairNotFound: 'Repair ticket not found',
  completedLocked: 'Pricing cannot be changed on a completed repair.',
  estimateForbidden: 'Not authorized to update estimate pricing.',
  technicianUseApproval:
    'Technicians set charges when sending the estimate for customer approval.',
  estimateApproved: 'Estimate is approved. Unlock and use Finalize Bill to change charges.',
  finalizeForbidden: 'Only owners and staff can finalize the bill.',
  finalizeNeedsApproval: 'The customer must approve the estimate before the bill can be finalized.',
  completedNeedsFinalBill: 'Finalize the bill before marking this repair completed.',
  approvalOwnerForbidden:
    'Owner cannot send estimates for approval. Staff or the assigned technician handle this.',
  approvalTechnicianNotAssigned:
    'Forbidden: Technicians can only send estimates for repairs assigned to them.',
  approvalForbidden: 'Not authorized to send estimates for approval.',
  approvalClosed: 'Completed or cancelled repairs cannot be sent for approval.',
  approvalPending: 'Customer approval is already pending for this repair.',
  approvalNeedsDiagnosing:
    'Set the status to Diagnosing before sending the estimate for customer approval.',
  approvalAlreadyApproved:
    'The customer already approved this estimate. Use Finalize Bill to change charges.',
  technicianAfterApproval:
    'The customer already approved this estimate. Staff or owner can change it now.',
  invoiceIssued:
    'An invoice has been issued for this repair. Cancel the invoice to change charges or parts.',
} as const

const CLOSED_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

function isShopManager(userRole: string): boolean {
  return userRole === 'OWNER' || userRole === 'STAFF'
}

function forbidden(message: string): PricingRuleViolation {
  return { status: 403, message }
}

function conflict(message: string): PricingRuleViolation {
  return { status: 409, message }
}

/** Which pricing panel a user sees on Repair Details. */
export function getPricingPanelMode({
  userRole,
  status,
  approvalStatus,
  hasEstimate,
  hasIssuedInvoice = false,
}: {
  userRole: string
  status: string
  approvalStatus: ApprovalStatus | null | undefined
  hasEstimate: boolean
  hasIssuedInvoice?: boolean
}): PricingPanelMode {
  if (isShopManager(userRole)) {
    if (status === 'COMPLETED' || hasIssuedInvoice) return hasEstimate ? 'view' : 'hidden'
    return approvalStatus === 'APPROVED' ? 'finalize' : 'editEstimate'
  }
  return hasEstimate ? 'view' : 'hidden'
}

/** "Save estimate": OWNER/STAFF only, before customer approval, never on COMPLETED. */
export function getEstimateEditViolation({
  userRole,
  status,
  approvalStatus,
  hasIssuedInvoice = false,
}: {
  userRole: string
  status: string
  approvalStatus: ApprovalStatus | null | undefined
  hasIssuedInvoice?: boolean
}): PricingRuleViolation | null {
  if (userRole === 'TECHNICIAN') return forbidden(PRICING_MESSAGES.technicianUseApproval)
  if (!isShopManager(userRole)) return forbidden(PRICING_MESSAGES.estimateForbidden)
  if (status === 'COMPLETED') return conflict(PRICING_MESSAGES.completedLocked)
  if (hasIssuedInvoice) return conflict(PRICING_MESSAGES.invoiceIssued)
  if (approvalStatus === 'APPROVED') return conflict(PRICING_MESSAGES.estimateApproved)
  return null
}

/** "Finalize Bill": OWNER/STAFF only, after customer approval, never on COMPLETED. */
export function getFinalizeBillViolation({
  userRole,
  status,
  approvalStatus,
  hasIssuedInvoice = false,
}: {
  userRole: string
  status: string
  approvalStatus: ApprovalStatus | null | undefined
  hasIssuedInvoice?: boolean
}): PricingRuleViolation | null {
  if (!isShopManager(userRole)) return forbidden(PRICING_MESSAGES.finalizeForbidden)
  if (status === 'COMPLETED') return conflict(PRICING_MESSAGES.completedLocked)
  if (hasIssuedInvoice) return conflict(PRICING_MESSAGES.invoiceIssued)
  if (approvalStatus !== 'APPROVED') return conflict(PRICING_MESSAGES.finalizeNeedsApproval)
  return null
}

/**
 * "Request Customer Approval": STAFF or the assigned technician on an open repair with no pending
 * approval. Technicians lose this once the customer has approved.
 * 403 = the user never sees the button; 409 = button shown but disabled with the message.
 */
export function getSendApprovalViolation({
  userRole,
  userId,
  assignedTechnicianId,
  status,
  approvalStatus,
  hasIssuedInvoice = false,
}: {
  userRole: string
  userId: string | null | undefined
  assignedTechnicianId: string | null | undefined
  status: string
  approvalStatus: ApprovalStatus | null | undefined
  hasIssuedInvoice?: boolean
}): PricingRuleViolation | null {
  if (userRole === 'OWNER') return forbidden(PRICING_MESSAGES.approvalOwnerForbidden)
  if (userRole === 'TECHNICIAN' && assignedTechnicianId !== userId) {
    return forbidden(PRICING_MESSAGES.approvalTechnicianNotAssigned)
  }
  if (userRole !== 'STAFF' && userRole !== 'TECHNICIAN') {
    return forbidden(PRICING_MESSAGES.approvalForbidden)
  }
  if (CLOSED_STATUSES.has(status)) return conflict(PRICING_MESSAGES.approvalClosed)
  if (hasIssuedInvoice) return conflict(PRICING_MESSAGES.invoiceIssued)
  if (approvalStatus === 'PENDING') return conflict(PRICING_MESSAGES.approvalPending)
  if (userRole === 'TECHNICIAN' && approvalStatus === 'APPROVED') {
    return conflict(PRICING_MESSAGES.technicianAfterApproval)
  }
  if (status !== 'DIAGNOSING') {
    return conflict(
      approvalStatus === 'APPROVED'
        ? PRICING_MESSAGES.approvalAlreadyApproved
        : PRICING_MESSAGES.approvalNeedsDiagnosing,
    )
  }
  return null
}

/** The bill is finalized once OWNER/STAFF have written final_total. */
export function isFinalBillConfirmed(finalTotal: number | null | undefined): boolean {
  return finalTotal != null
}

export function getCompletedTransitionError({
  nextStatus,
  finalTotal,
}: {
  nextStatus: string
  finalTotal: number | null | undefined
}): string | null {
  if (nextStatus !== 'COMPLETED') return null
  if (isFinalBillConfirmed(finalTotal)) return null
  return PRICING_MESSAGES.completedNeedsFinalBill
}
