import { and, isNotNull, lt, notInArray, type SQL } from 'drizzle-orm'
import { repairs } from '@/server/db/schema/repairs'

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED'] as const

export function getStartOfToday(now = new Date()): Date {
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)
  return dayStart
}

export function formatDateInputValue(now = new Date()): string {
  const dayStart = getStartOfToday(now)
  const yyyy = dayStart.getFullYear()
  const mm = String(dayStart.getMonth() + 1).padStart(2, '0')
  const dd = String(dayStart.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function isExpectedCompletionDateInPast(
  expectedCompletionDate: string | null | undefined,
  now = new Date(),
): boolean {
  if (!expectedCompletionDate || expectedCompletionDate.trim() === '') return false
  const selected = new Date(expectedCompletionDate)
  if (isNaN(selected.getTime())) return false
  return selected < getStartOfToday(now)
}

export function computeIsRepairOverdue(
  expectedCompletionDate: Date | string | null | undefined,
  status: string,
  now = new Date(),
): boolean {
  if (!expectedCompletionDate) return false
  if (TERMINAL_STATUSES.includes(status as (typeof TERMINAL_STATUSES)[number])) return false

  const expected = new Date(expectedCompletionDate)
  if (isNaN(expected.getTime())) return false

  return expected < getStartOfToday(now)
}

export function overdueRepairCondition(now = new Date()): SQL {
  const dayStartIso = getStartOfToday(now).toISOString()

  return and(
    isNotNull(repairs.expectedCompletionDate),
    lt(repairs.expectedCompletionDate, new Date(dayStartIso)),
    notInArray(repairs.status, [...TERMINAL_STATUSES]),
  )!
}
