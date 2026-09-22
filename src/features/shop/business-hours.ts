import { z } from 'zod'

export const BUSINESS_HOUR_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type BusinessHourDay = (typeof BUSINESS_HOUR_DAYS)[number]

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a valid time')

const businessHourIntervalSchema = z
  .object({
    from: timeSchema,
    to: timeSchema,
  })
  .refine((interval) => interval.from < interval.to, {
    message: 'Closing time must be after opening time',
    path: ['to'],
  })

const businessHourDaySchema = z
  .object({
    open: z.boolean(),
    intervals: z.array(businessHourIntervalSchema).max(2),
  })
  .superRefine((day, context) => {
    if (!day.open && day.intervals.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['intervals'],
        message: 'Closed days cannot have hours',
      })
    }
    if (day.open && day.intervals.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['intervals'],
        message: 'Add at least one time range for open days',
      })
    }

    for (let index = 1; index < day.intervals.length; index += 1) {
      const previous = day.intervals[index - 1]
      const current = day.intervals[index]
      if (previous && current && current.from < previous.to) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['intervals', index, 'from'],
          message: 'Time ranges cannot overlap',
        })
      }
    }
  })

export const businessHoursSchema = z.object(
  Object.fromEntries(BUSINESS_HOUR_DAYS.map((day) => [day, businessHourDaySchema])) as Record<
    BusinessHourDay,
    typeof businessHourDaySchema
  >,
)

export type BusinessHours = z.infer<typeof businessHoursSchema>
export type BusinessHourInterval = z.infer<typeof businessHourIntervalSchema>

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: false, intervals: [] },
  tuesday: { open: false, intervals: [] },
  wednesday: { open: false, intervals: [] },
  thursday: { open: false, intervals: [] },
  friday: { open: false, intervals: [] },
  saturday: { open: false, intervals: [] },
  sunday: { open: false, intervals: [] },
}

export function parseBusinessHours(value: string | null | undefined): BusinessHours {
  if (!value) return DEFAULT_BUSINESS_HOURS

  try {
    const parsed = businessHoursSchema.safeParse(JSON.parse(value))
    if (parsed.success) return parsed.data
  } catch {}

  const legacyMatch = value.match(
    /^(Mon(?:day)?-Fri(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?),\s*(\d{1,2}:\d{2})\s*([AP]M)?\s*-\s*(\d{1,2}:\d{2})\s*([AP]M)?$/i,
  )
  if (!legacyMatch) return DEFAULT_BUSINESS_HOURS

  const [, dayRange, openingTime, openingMeridiem, closingTime, closingMeridiem] = legacyMatch
  const to24Hour = (time: string, meridiem?: string) => {
    const [hour, minute] = time.split(':').map(Number)
    if (!meridiem) return time
    const normalizedHour = hour === 12 ? 0 : hour
    const nextHour = meridiem.toUpperCase() === 'PM' ? normalizedHour + 12 : normalizedHour
    return `${String(nextHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const interval = {
    from: to24Hour(openingTime, openingMeridiem || closingMeridiem),
    to: to24Hour(closingTime, closingMeridiem || openingMeridiem),
  }
  const parsed = { ...DEFAULT_BUSINESS_HOURS }
  const days = dayRange.toLowerCase().startsWith('mon-fri')
    ? BUSINESS_HOUR_DAYS.slice(0, 5)
    : BUSINESS_HOUR_DAYS.filter((day) => day.startsWith(dayRange.slice(0, 3).toLowerCase()))
  for (const day of days) parsed[day] = { open: true, intervals: [interval] }
  return parsed
}

export function serializeBusinessHours(hours: BusinessHours): string {
  return JSON.stringify(hours)
}

export function formatBusinessHours(value: string | null | undefined): string | null {
  const rows = formatBusinessHoursRows(value)
  return rows.length > 0 ? rows.map((row) => `${row.label} ${row.value}`).join(' · ') : null
}

export function formatBusinessHoursRows(value: string | null | undefined) {
  const hours = parseBusinessHours(value)
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
  }
  const labels: Record<BusinessHourDay, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  }
  return BUSINESS_HOUR_DAYS.filter((day) => hours[day].open).map((day) => {
    const intervals = hours[day].intervals
      .map((interval) => `${formatTime(interval.from)} - ${formatTime(interval.to)}`)
      .join(', ')
    return { label: labels[day], value: intervals }
  })
}
