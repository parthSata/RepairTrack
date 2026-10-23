'use client'

import { Plus, Trash2 } from 'lucide-react'
import {
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  BUSINESS_HOUR_DAYS,
  type BusinessHourDay,
  type BusinessHours,
} from '@/features/shop/business-hours'
import type { ShopProfile } from '@/features/shop/schemas'
import { ShopTimeSelect } from './shop-time-select'

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

  function applyToWeekdays() {
    const weekdayHours = hours.monday
    for (const day of BUSINESS_HOUR_DAYS.slice(0, 5)) {
      updateDay(day, {
        ...weekdayHours,
        intervals: weekdayHours.intervals.map((interval) => ({ ...interval })),
      })
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">Shop Hours</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Set when customers can visit your shop for pickup and support.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={applyToWeekdays}>
          Apply to weekdays
        </Button>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border">
        {BUSINESS_HOUR_DAYS.map((day) => (
          <HoursDayRow
            key={day}
            day={day}
            hours={hours[day]}
            setValue={setValue}
            error={errors?.[day]}
            onToggle={() => toggleDay(day)}
          />
        ))}
      </div>
    </section>
  )
}

function HoursDayRow({
  day,
  hours,
  setValue,
  error,
  onToggle,
}: {
  day: BusinessHourDay
  hours: BusinessHours[BusinessHourDay]
  setValue: UseFormSetValue<ShopProfile>
  error?: NonNullable<BusinessHoursErrors>[BusinessHourDay]
  onToggle: () => void
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

  if (!hours.open) {
    return (
      <div className={`${DAY_ROW_GRID} p-4 sm:p-5`}>
        <p className="min-w-0 font-semibold text-foreground">{DAY_LABELS[day]}</p>
        {openToggle}
        <p className="col-span-2 text-sm text-muted-foreground md:col-span-4">
          Customers cannot visit on this day.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 sm:p-5">
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

          {/* Mobile: keep from / to / actions on one wrapping row via contents on md */}
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
    </div>
  )
}
