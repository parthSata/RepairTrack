import { describe, expect, it } from 'bun:test'
import {
  calculateRepairTotal,
  differsFromEstimate,
  GST_TAX_RATES,
  safeCalculateTotal,
  sumPartsCharges,
  type RepairPartChargeLine,
} from './pricing-calc'

describe('pricing-calc: sumPartsCharges', () => {
  it('returns 0 when given an empty parts line array', () => {
    expect(sumPartsCharges([])).toBe(0)
  })

  it('calculates the total for a single part charge line', () => {
    const lines: RepairPartChargeLine[] = [{ unitSellingPrice: 150000, quantity: 2 }]
    expect(sumPartsCharges(lines)).toBe(300000)
  })

  it('sums multiple parts lines with various quantities and prices', () => {
    const lines: RepairPartChargeLine[] = [
      { unitSellingPrice: 45000, quantity: 1 }, // ₹450
      { unitSellingPrice: 20000, quantity: 3 }, // ₹600
      { unitSellingPrice: 15000, quantity: 2 }, // ₹300
    ]
    expect(sumPartsCharges(lines)).toBe(135000) // ₹1350
  })
})

describe('pricing-calc: calculateRepairTotal', () => {
  it('calculates zero total when all inputs and tax are zero', () => {
    const result = calculateRepairTotal({
      laborCharges: 0,
      partsCharges: 0,
      additionalCharges: 0,
      taxPercent: 0,
    })

    expect(result).toEqual({
      partsCharges: 0,
      taxableValue: 0,
      taxAmount: 0,
      total: 0,
    })
  })

  it('correctly calculates 18% standard GST and rounds to nearest rupee (CGST §170)', () => {
    // ₹500 labor + ₹1000 parts + ₹250 additional = ₹1750 (175,000 paise)
    // 18% tax = 31,500 paise (₹315)
    // total = ₹2065 (206,500 paise)
    const result = calculateRepairTotal({
      laborCharges: 50000,
      partsCharges: 100000,
      additionalCharges: 25000,
      taxPercent: 18,
    })

    expect(result.partsCharges).toBe(100000)
    expect(result.taxableValue).toBe(175000)
    expect(result.taxAmount).toBe(31500)
    expect(result.total).toBe(206500)
  })

  it('handles 0% exempt GST slab', () => {
    const result = calculateRepairTotal({
      laborCharges: 80000,
      partsCharges: 20000,
      additionalCharges: 0,
      taxPercent: 0,
    })

    expect(result.taxableValue).toBe(100000)
    expect(result.taxAmount).toBe(0)
    expect(result.total).toBe(100000)
  })

  it('handles fractional paise tax rounding to nearest whole rupee', () => {
    // ₹100.33 taxable = 10,033 paise.
    // 18% of 10,033 paise = 1,805.94 paise -> rounded to 1,806 paise (~₹18.06).
    // Nearest rupee rounding (paiseToRupees -> round -> rupeesToPaise):
    // ₹18.06 rounds to ₹18 = 1,800 paise.
    const result = calculateRepairTotal({
      laborCharges: 10033,
      partsCharges: 0,
      additionalCharges: 0,
      taxPercent: 18,
    })

    expect(result.taxableValue).toBe(10033)
    expect(result.taxAmount).toBe(1800)
    expect(result.total).toBe(11833)
  })

  it('validates standard GST tax slabs', () => {
    const expectedValues = [0, 5, 12, 18, 28] as const
    expect(GST_TAX_RATES.map((r) => r.value)).toEqual([...expectedValues])
  })
})

describe('pricing-calc: safeCalculateTotal', () => {
  it('returns valid calculation result for correct input', () => {
    const result = safeCalculateTotal({
      laborCharges: 10000,
      partsCharges: 20000,
      additionalCharges: 5000,
      taxPercent: 18,
    })

    expect(result).not.toBeNull()
    expect(result?.total).toBe(41300)
  })
})

describe('pricing-calc: differsFromEstimate', () => {
  it('returns false when either value is null or undefined', () => {
    expect(differsFromEstimate(null, 50000)).toBe(false)
    expect(differsFromEstimate(50000, null)).toBe(false)
    expect(differsFromEstimate(undefined, 50000)).toBe(false)
    expect(differsFromEstimate(50000, undefined)).toBe(false)
    expect(differsFromEstimate(null, null)).toBe(false)
  })

  it('returns false when difference is within default threshold (100 paise)', () => {
    expect(differsFromEstimate(50000, 50000)).toBe(false)
    expect(differsFromEstimate(50000, 50080)).toBe(false)
    expect(differsFromEstimate(50100, 50000)).toBe(false)
  })

  it('returns true when difference exceeds default threshold (100 paise)', () => {
    expect(differsFromEstimate(50000, 50101)).toBe(true)
    expect(differsFromEstimate(50200, 50000)).toBe(true)
  })

  it('supports custom threshold', () => {
    expect(differsFromEstimate(50000, 50500, 1000)).toBe(false)
    expect(differsFromEstimate(50000, 51500, 1000)).toBe(true)
  })
})
