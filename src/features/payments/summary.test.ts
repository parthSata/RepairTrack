import { describe, expect, it } from 'bun:test'
import { getBillTotal, getPaymentSummary } from './summary'

describe('payments summary: getBillTotal', () => {
  it('returns finalTotal when both finalTotal and estimatedTotal are present', () => {
    expect(
      getBillTotal({
        finalTotal: 250000,
        estimatedTotal: 200000,
      }),
    ).toBe(250000)
  })

  it('falls back to estimatedTotal when finalTotal is null', () => {
    expect(
      getBillTotal({
        finalTotal: null,
        estimatedTotal: 180000,
      }),
    ).toBe(180000)
  })

  it('returns null when both finalTotal and estimatedTotal are null', () => {
    expect(
      getBillTotal({
        finalTotal: null,
        estimatedTotal: null,
      }),
    ).toBeNull()
  })
})

describe('payments summary: getPaymentSummary', () => {
  it('returns UNPAID when payments list is empty', () => {
    const summary = getPaymentSummary({
      billTotal: 100000,
      payments: [],
    })

    expect(summary).toEqual({
      totalPaid: 0,
      balance: 100000,
      status: 'UNPAID',
    })
  })

  it('returns UNPAID when sum of payments is zero', () => {
    const summary = getPaymentSummary({
      billTotal: 100000,
      payments: [{ amount: 0 }],
    })

    expect(summary).toEqual({
      totalPaid: 0,
      balance: 100000,
      status: 'UNPAID',
    })
  })

  it('returns PARTIAL when total payments are strictly less than bill total', () => {
    const summary = getPaymentSummary({
      billTotal: 100000,
      payments: [{ amount: 30000 }, { amount: 20000 }],
    })

    expect(summary).toEqual({
      totalPaid: 50000,
      balance: 50000,
      status: 'PARTIAL',
    })
  })

  it('returns PAID with balance 0 when total payments equal bill total', () => {
    const summary = getPaymentSummary({
      billTotal: 75000,
      payments: [{ amount: 50000 }, { amount: 25000 }],
    })

    expect(summary).toEqual({
      totalPaid: 75000,
      balance: 0,
      status: 'PAID',
    })
  })

  it('returns PAID with negative balance when customer overpays', () => {
    const summary = getPaymentSummary({
      billTotal: 50000,
      payments: [{ amount: 60000 }],
    })

    expect(summary).toEqual({
      totalPaid: 60000,
      balance: -10000,
      status: 'PAID',
    })
  })
})
