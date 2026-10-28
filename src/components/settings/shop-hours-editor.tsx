'use client'

import * as React from 'react'
import { Check, Copy, Plus, Trash2 } from 'lucide-react'
import {
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  BUSINESS_HOUR_DAYS,
  type BusinessHourDay,
  type BusinessHours,
} from '@/features/shop/business-hours'
import type { ShopProfile } from '@/features/shop/schemas'
import { cn } from '@/lib/utils'
import { ShopTimeSelect } from './shop-time-select'

const WEEKDAY_DAYS = BUSINESS_HOUR_DAYS.slice(0, 5)

const DAY_LABELS: Record<BusinessHourDay, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const DEFAULT_INTERVAL = { from: '10:00', to: '19:00' }
type BusinessHoursErrors = FieldErrors<ShopProfile>['businessHours']

/** Shared day-row track: day | open/closed | from | to | closing | actions */
const DAY_ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 md:grid-cols-[7rem_5.75rem_minmax(0,1fr)_auto_minmax(0,1fr)_2.75rem]'

function dayHoursEqual(
  a: BusinessHours[BusinessHourDay],
  b: BusinessHours[BusinessHourDay],
): boolean {
  if (a.open !== b.open) return false
  if (a.intervals.length !== b.intervals.length) return false
  return a.intervals.every(
    (interval, index) =>
      interval.from === b.intervals[index]?.from && interval.to === b.intervals[index]?.to,
  )
}

function weekdaysMatchMonday(hours: BusinessHours): boolean {
  const monday = hours.monday
  return WEEKDAY_DAYS.every((day) => dayHoursEqual(hours[day], monday))
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="animate-in fade-in text-sm text-destructive">{message}</p> : null
}

export function ShopHoursEditor({
  hours,
  setValue,
  errors,
}: {
  hours: BusinessHours
  setValue: UseFormSetValue<ShopProfile>
  errors?: BusinessHoursErrors
}) {
  const [justApplied, setJustApplied] = React.useState(false)
  const appliedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (appliedTimerRef.current) clearTimeout(appliedTimerRef.current)
    }
  }, [])

  function updateDay(day: BusinessHourDay, value: BusinessHours[BusinessHourDay]) {
    setValue(`businessHours.${day}`, value, { shouldDirty: true, shouldValidate: true })
  }

  function toggleDay(day: BusinessHourDay) {
    const dayHours = hours[day]
    updateDay(
      day,
      dayHours.open ? { open: false, intervals: [] } : { open: true, intervals: [DEFAULT_INTERVAL] },
    )
  }

  function applyMondayToWeekdays() {
    const mondayHours = hours.monday
    const mondayCopy: BusinessHours[BusinessHourDay] = {
      open: mondayHours.open,
      intervals: mondayHours.intervals.map((interval) => ({ ...interval })),
    }

    const nextHours = { ...hours }
    for (const day of WEEKDAY_DAYS) {
      nextHours[day] = {
        open: mondayCopy.open,
        intervals: mondayCopy.intervals.map((interval) => ({ ...interval })),
      }
    }

    setValue('businessHours', nextHours, { shouldDirty: true, shouldValidate: true })
    setJustApplied(true)
    if (appliedTimerRef.current) clearTimeout(appliedTimerRef.current)
    appliedTimerRef.current = setTimeout(() => setJustApplied(false), 1600)

    toast.success(
      mondayCopy.open
        ? 'Copied Monday hours to Tue–Fri'
        : 'Tue–Fri set to closed (same as Monday)',
    )
  }

  const alreadySynced = weekdaysMatchMonday(hours)

  return (
    <section className="space-y-5">
      <div className="border-b border-border pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">Shop Hours</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Set when customers can visit your shop for pickup and support.
        </p>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {BUSINESS_HOUR_DAYS.map((day) => (
          <HoursDayRow
            key={day}
            day={day}
            hours={hours[day]}
            setValue={setValue}
            error={errors?.[day]}
            onToggle={() => toggleDay(day)}
            highlight={justApplied && WEEKDAY_DAYS.includes(day)}
            weekdayAction={
              day === 'monday' ? (
                <CopyWeekdaysAction
                  alreadySynced={alreadySynced}
                  mondayOpen={hours.monday.open}
                  onApply={applyMondayToWeekdays}
                />
              ) : null
            }
          />
        ))}
      </div>
    </section>
  )
}

function CopyWeekdaysAction({
  alreadySynced,
  mondayOpen,
  onApply,
}: {
  alreadySynced: boolean
  mondayOpen: boolean
  onApply: () => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/25 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Same hours Mon–Fri?</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {alreadySynced
              ? mondayOpen
                ? 'Tue–Fri already match Monday.'
                : 'Weekdays are already closed like Monday.'
              : 'Copy Monday’s schedule to Tuesday through Friday in one click.'}
          </p>
        </div>
        <Button
          type="button"
          variant={alreadySynced ? 'outline' : 'accent'}
          size="sm"
          disabled={alreadySynced}
          className="h-9 shrink-0 gap-1.5"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onApply()
          }}
        >
          {alreadySynced ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Weekdays synced
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy to Tue–Fri
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function HoursDayRow({
  day,
  hours,
  setValue,
  error,
  onToggle,
  highlight,
  weekdayAction,
}: {
  day: BusinessHourDay
  hours: BusinessHours[BusinessHourDay]
  setValue: UseFormSetValue<ShopProfile>
  error?: NonNullable<BusinessHoursErrors>[BusinessHourDay]
  onToggle: () => void
  highlight?: boolean
  weekdayAction?: React.ReactNode
}) {
  function addInterval() {
    if (hours.intervals.length >= 2) return
    setValue(
      `businessHours.${day}.intervals`,
      [...hours.intervals, { from: '14:00', to: '19:00' }],
      { shouldDirty: true, shouldValidate: true },
    )
  }

  function removeInterval(index: number) {
    setValue(
      `businessHours.${day}.intervals`,
      hours.intervals.filter((_, intervalIndex) => intervalIndex !== index),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  const openToggle = (
    <Button
      type="button"
      variant={hours.open ? 'accent' : 'outline'}
      size="sm"
      className="h-10 shrink-0"
      aria-pressed={hours.open}
      onClick={onToggle}
    >
      {hours.open ? 'Open' : 'Closed'}
    </Button>
  )

  const rowShell = cn(
    'space-y-3 p-4 transition-colors duration-300 sm:p-5',
    highlight && 'bg-accent/10',
  )

  if (!hours.open) {
    return (
      <div className={cn(rowShell, 'space-y-3')}>
        <div className={DAY_ROW_GRID}>
          <p className="min-w-0 font-semibold text-foreground">{DAY_LABELS[day]}</p>
          {openToggle}
          <p className="col-span-2 text-sm text-muted-foreground md:col-span-4">
            Customers cannot visit on this day.
          </p>
        </div>
        {weekdayAction}
      </div>
    )
  }

  return (
    <div className={rowShell}>
      {hours.intervals.map((_, index) => (
        <div key={`${day}-${index}`} className={DAY_ROW_GRID}>
          {index === 0 ? (
            <>
              <p className="min-w-0 font-semibold text-foreground">{DAY_LABELS[day]}</p>
              {openToggle}
            </>
          ) : (
            <>
              <span className="hidden md:block" aria-hidden />
              <span className="hidden md:block" aria-hidden />
            </>
          )}

          <div className="col-span-2 flex min-w-0 items-center gap-2 md:col-span-4 md:contents">
            <div className="min-w-0 flex-1 md:min-w-0">
              <ShopTimeSelect
                id={`${day}-${index}-from`}
                value={hours.intervals[index]?.from ?? ''}
                onValueChange={(value) =>
                  setValue(`businessHours.${day}.intervals.${index}.from`, value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                aria-label={`${DAY_LABELS[day]} opening time`}
              />
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">to</span>
            <div className="min-w-0 flex-1 md:min-w-0">
              <ShopTimeSelect
                id={`${day}-${index}-to`}
                value={hours.intervals[index]?.to ?? ''}
                onValueChange={(value) =>
                  setValue(`businessHours.${day}.intervals.${index}.to`, value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                aria-label={`${DAY_LABELS[day]} closing time`}
              />
            </div>
            <div className="flex h-10 w-9 shrink-0 items-center justify-center">
              {hours.intervals.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-9"
                  aria-label={`Remove ${DAY_LABELS[day]} interval ${index + 1}`}
                  onClick={() => removeInterval(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-9 text-accent hover:text-accent/80"
                  aria-label={`Add another time for ${DAY_LABELS[day]}`}
                  onClick={addInterval}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
      <FieldError message={error?.intervals?.message} />
      {weekdayAction}
    </div>
  )
}
