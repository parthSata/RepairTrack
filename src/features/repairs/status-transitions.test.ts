import { describe, expect, it } from 'bun:test'
import { PRICING_MESSAGES } from './pricing-rules'
import {
  getAllowedManualStatusDestinations,
  getCompletedLockHint,
  getManualStatusTransitionError,
  isCustomerApproved,
  WAITING_FOR_APPROVAL_MANUAL_MESSAGE,
} from './status-transitions'

describe('status-transitions: isCustomerApproved', () => {
  it('returns true only when approvalStatus is APPROVED', () => {
    expect(isCustomerApproved('APPROVED')).toBe(true)
    expect(isCustomerApproved('PENDING')).toBe(false)
    expect(isCustomerApproved('REJECTED')).toBe(false)
    expect(isCustomerApproved(null)).toBe(false)
    expect(isCustomerApproved(undefined)).toBe(false)
  })
})

describe('status-transitions: getAllowedManualStatusDestinations', () => {
  it('returns only pre-approval destinations when unapproved', () => {
    // From RECEIVED, only DIAGNOSING is allowed manually
    expect(getAllowedManualStatusDestinations('RECEIVED')).toEqual(['DIAGNOSING'])
    // From DIAGNOSING, only RECEIVED is allowed manually
    expect(getAllowedManualStatusDestinations('DIAGNOSING')).toEqual(['RECEIVED'])
  })

  it('returns empty destinations for locked source statuses', () => {
    expect(getAllowedManualStatusDestinations('COMPLETED')).toEqual([])
    expect(getAllowedManualStatusDestinations('CANCELLED')).toEqual([])
    expect(getAllowedManualStatusDestinations('WAITING_FOR_APPROVAL')).toEqual([])
  })

  it('excludes intake statuses once customer approval is given', () => {
    const destinations = getAllowedManualStatusDestinations('IN_REPAIR', {
      approvalStatus: 'APPROVED',
    })

    expect(destinations).not.toContain('RECEIVED')
    expect(destinations).not.toContain('DIAGNOSING')
    expect(destinations).toContain('WAITING_FOR_PARTS')
    expect(destinations).toContain('QUALITY_CHECK')
    expect(destinations).toContain('READY_FOR_PICKUP')
    expect(destinations).toContain('CANCELLED')
  })

  it('excludes COMPLETED when bill is not finalized or not paid in full', () => {
    // Missing final total
    const unfinalized = getAllowedManualStatusDestinations('READY_FOR_PICKUP', {
      approvalStatus: 'APPROVED',
      finalTotal: null,
      isPaidInFull: false,
    })
    expect(unfinalized).not.toContain('COMPLETED')

    // Finalized bill exists but unpaid
    const unpaid = getAllowedManualStatusDestinations('READY_FOR_PICKUP', {
      approvalStatus: 'APPROVED',
      finalTotal: 150000,
      isPaidInFull: false,
    })
    expect(unpaid).not.toContain('COMPLETED')
  })

  it('includes COMPLETED when final bill is confirmed and paid in full', () => {
    const completedAllowed = getAllowedManualStatusDestinations('READY_FOR_PICKUP', {
      approvalStatus: 'APPROVED',
      finalTotal: 150000,
      isPaidInFull: true,
    })
    expect(completedAllowed).toContain('COMPLETED')
  })
})

describe('status-transitions: getManualStatusTransitionError', () => {
  it('returns specific error for WAITING_FOR_APPROVAL manual selection', () => {
    expect(getManualStatusTransitionError('DIAGNOSING', 'WAITING_FOR_APPROVAL')).toBe(
      WAITING_FOR_APPROVAL_MANUAL_MESSAGE,
    )
  })

  it('returns error when jumping to post-approval status without customer approval', () => {
    const error = getManualStatusTransitionError('RECEIVED', 'IN_REPAIR', {
      approvalStatus: null,
    })
    expect(error).toContain('Send the estimate with Request Customer Approval')
  })

  it('returns error when reverting to intake statuses after approval', () => {
    const error = getManualStatusTransitionError('IN_REPAIR', 'RECEIVED', {
      approvalStatus: 'APPROVED',
    })
    expect(error).toContain('Customer has approved the estimate')
  })

  it('returns payment/bill lock error when transitioning to COMPLETED prematurely', () => {
    const billError = getManualStatusTransitionError('READY_FOR_PICKUP', 'COMPLETED', {
      approvalStatus: 'APPROVED',
      finalTotal: null,
    })
    expect(billError).toBe(PRICING_MESSAGES.completedNeedsFinalBill)

    const paymentError = getManualStatusTransitionError('READY_FOR_PICKUP', 'COMPLETED', {
      approvalStatus: 'APPROVED',
      finalTotal: 120000,
      isPaidInFull: false,
    })
    expect(paymentError).toBe(PRICING_MESSAGES.completedNeedsPayment)
  })

  it('returns null when transition is valid', () => {
    const validPreApproval = getManualStatusTransitionError('RECEIVED', 'DIAGNOSING')
    expect(validPreApproval).toBeNull()

    const validPostApproval = getManualStatusTransitionError('APPROVED', 'IN_REPAIR', {
      approvalStatus: 'APPROVED',
    })
    expect(validPostApproval).toBeNull()

    const validCompleted = getManualStatusTransitionError('READY_FOR_PICKUP', 'COMPLETED', {
      approvalStatus: 'APPROVED',
      finalTotal: 100000,
      isPaidInFull: true,
    })
    expect(validCompleted).toBeNull()
  })
})

describe('status-transitions: getCompletedLockHint', () => {
  it('returns finalize bill first when finalTotal is null', () => {
    const hint = getCompletedLockHint('READY_FOR_PICKUP', {
      approvalStatus: 'APPROVED',
      finalTotal: null,
      isPaidInFull: false,
    })
    expect(hint).toBe('finalize bill first')
  })

  it('returns record payment first when finalTotal is present but isPaidInFull is false', () => {
    const hint = getCompletedLockHint('READY_FOR_PICKUP', {
      approvalStatus: 'APPROVED',
      finalTotal: 80000,
      isPaidInFull: false,
    })
    expect(hint).toBe('record payment first')
  })

  it('returns null when completed transition is valid and ready', () => {
    const hint = getCompletedLockHint('READY_FOR_PICKUP', {
      approvalStatus: 'APPROVED',
      finalTotal: 80000,
      isPaidInFull: true,
    })
    expect(hint).toBeNull()
  })

  it('returns null when current status cannot transition to completed anyway', () => {
    // Locked status cannot transition to completed
    const hint = getCompletedLockHint('COMPLETED', {
      approvalStatus: 'APPROVED',
    })
    expect(hint).toBeNull()
  })
})
