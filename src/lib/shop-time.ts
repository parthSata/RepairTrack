import type { AnalyticsPeriod } from '@/features/dashboard/schemas'

export const SHOP_TIMEZONE = 'Asia/Kolkata'

const IST_OFFSET_MINUTES = 5 * 60 + 30
const MINUTE_MS = 60 * 1000

interface IstDateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

function getIstDateParts(now: Date): IstDateParts {
  const istDate = new Date(now.getTime() + IST_OFFSET_MINUTES * MINUTE_MS)
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    day: istDate.getUTCDate(),
    hour: istDate.getUTCHours(),
    minute: istDate.getUTCMinutes(),
    second: istDate.getUTCSeconds(),
    millisecond: istDate.getUTCMilliseconds(),
  }
}

function fromIstDateParts(parts: IstDateParts): Date {
  return new Date(
    Date.UTC(
      parts.year,
      parts.month,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond,
    ) -
      IST_OFFSET_MINUTES * MINUTE_MS,
  )
}

function getIstMidnight(year: number, month: number, day: number): Date {
  return fromIstDateParts({ year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 })
}

function addIstDays(date: Date, days: number): Date {
  const parts = getIstDateParts(date)
  return getIstMidnight(parts.year, parts.month, parts.day + days)
}

function addIstMonths(date: Date, months: number): Date {
  const parts = getIstDateParts(date)
  const targetMonth = new Date(Date.UTC(parts.year, parts.month + months, 1))
  const year = targetMonth.getUTCFullYear()
  const month = targetMonth.getUTCMonth()
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  return fromIstDateParts({
    year,
    month,
    day: Math.min(parts.day, lastDay),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    millisecond: parts.millisecond,
  })
}

function addIstYears(date: Date, years: number): Date {
  const parts = getIstDateParts(date)
  const year = parts.year + years
  const lastDay = new Date(Date.UTC(year, parts.month + 1, 0)).getUTCDate()

  return fromIstDateParts({
    year,
    month: parts.month,
    day: Math.min(parts.day, lastDay),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    millisecond: parts.millisecond,
  })
}

export function getTodayRange(now: Date = new Date()): { start: Date; end: Date } {
  const parts = getIstDateParts(now)
  const start = getIstMidnight(parts.year, parts.month, parts.day)
  return { start, end: addIstDays(start, 1) }
}

export function getPeriodRange(
  period: AnalyticsPeriod,
  now: Date = new Date(),
): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
  const parts = getIstDateParts(now)
  const currentStartOfMonth = getIstMidnight(parts.year, parts.month, 1)

  switch (period) {
    case 'this_month': {
      const previousStart = addIstMonths(currentStartOfMonth, -1)
      const elapsed = now.getTime() - currentStartOfMonth.getTime()
      const previousEnd = new Date(
        Math.min(previousStart.getTime() + elapsed, currentStartOfMonth.getTime()),
      )
      return { start: currentStartOfMonth, end: now, previousStart, previousEnd }
    }
    case 'last_month': {
      const start = addIstMonths(currentStartOfMonth, -1)
      const previousStart = addIstMonths(start, -1)
      return { start, end: currentStartOfMonth, previousStart, previousEnd: start }
    }
    case 'last_3_months': {
      const start = addIstMonths(now, -3)
      const previousStart = addIstMonths(start, -3)
      return { start, end: now, previousStart, previousEnd: start }
    }
    case 'this_year': {
      const start = getIstMidnight(parts.year, 0, 1)
      const previousStart = getIstMidnight(parts.year - 1, 0, 1)
      return { start, end: now, previousStart, previousEnd: addIstYears(now, -1) }
    }
  }
}
