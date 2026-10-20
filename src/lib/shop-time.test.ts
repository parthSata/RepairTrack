import { describe, expect, it } from 'bun:test'
import { getPeriodRange, getTodayRange, SHOP_TIMEZONE } from './shop-time'

describe('shop-time: timezone constant', () => {
  it('is set to Asia/Kolkata (+05:30)', () => {
    expect(SHOP_TIMEZONE).toBe('Asia/Kolkata')
  })
})

describe('shop-time: getTodayRange', () => {
  it('returns midnight-to-midnight IST range spanning exactly 24 hours', () => {
    // 2026-10-13 12:00:00 UTC = 2026-10-13 17:30:00 IST
    const fixedNow = new Date('2026-10-13T12:00:00.000Z')
    const { start, end } = getTodayRange(fixedNow)

    // Midnight IST on 2026-10-13 is 2026-10-12 18:30:00 UTC
    expect(start.toISOString()).toBe('2026-10-12T18:30:00.000Z')
    // Next day midnight IST is 2026-10-13 18:30:00 UTC
    expect(end.toISOString()).toBe('2026-10-13T18:30:00.000Z')
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000)
  })

  it('correctly handles early morning hours in IST crossing UTC day boundary', () => {
    // 2026-10-13 01:00:00 IST = 2026-10-12 19:30:00 UTC
    const earlyMorning = new Date('2026-10-12T19:30:00.000Z')
    const { start, end } = getTodayRange(earlyMorning)

    expect(start.toISOString()).toBe('2026-10-12T18:30:00.000Z')
    expect(end.toISOString()).toBe('2026-10-13T18:30:00.000Z')
  })
})

describe('shop-time: getPeriodRange', () => {
  const referenceDate = new Date('2026-10-15T10:00:00.000Z') // 15th Oct 2026 15:30 IST

  it('calculates this_month range starting at 1st of month IST', () => {
    const range = getPeriodRange('this_month', referenceDate)

    // 1st of Oct 2026 00:00 IST = 2026-09-30 18:30:00 UTC
    expect(range.start.toISOString()).toBe('2026-09-30T18:30:00.000Z')
    expect(range.end).toBe(referenceDate)
    // Previous start: 1st of Sep 2026 00:00 IST = 2026-08-31 18:30:00 UTC
    expect(range.previousStart.toISOString()).toBe('2026-08-31T18:30:00.000Z')
    // Elapsed comparison: previousEnd is proportional elapsed into September
    expect(range.previousEnd.getTime()).toBeGreaterThan(range.previousStart.getTime())
  })

  it('calculates last_month range spanning the entire previous calendar month in IST', () => {
    const range = getPeriodRange('last_month', referenceDate)

    // September 2026: from 2026-08-31T18:30:00.000Z to 2026-09-30T18:30:00.000Z
    expect(range.start.toISOString()).toBe('2026-08-31T18:30:00.000Z')
    expect(range.end.toISOString()).toBe('2026-09-30T18:30:00.000Z')
    // Previous start is August 2026: 2026-07-31T18:30:00.000Z
    expect(range.previousStart.toISOString()).toBe('2026-07-31T18:30:00.000Z')
    expect(range.previousEnd.toISOString()).toBe('2026-08-31T18:30:00.000Z')
  })

  it('calculates last_3_months range relative to current timestamp', () => {
    const range = getPeriodRange('last_3_months', referenceDate)

    expect(range.end).toBe(referenceDate)
    expect(range.previousEnd).toEqual(range.start)
    expect(range.start.getTime()).toBeLessThan(referenceDate.getTime())
    expect(range.previousStart.getTime()).toBeLessThan(range.start.getTime())
  })

  it('calculates this_year range starting at Jan 1st 00:00 IST', () => {
    const range = getPeriodRange('this_year', referenceDate)

    // Jan 1st 2026 00:00 IST = 2025-12-31 18:30:00 UTC
    expect(range.start.toISOString()).toBe('2025-12-31T18:30:00.000Z')
    expect(range.end).toBe(referenceDate)
    // Jan 1st 2025 00:00 IST = 2024-12-31 18:30:00 UTC
    expect(range.previousStart.toISOString()).toBe('2024-12-31T18:30:00.000Z')
  })
})
