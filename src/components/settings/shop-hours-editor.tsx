'use client'

import { Plus, Trash2 } from 'lucide-react'
import {
  type FieldErrors,
      type UseFormSetValue,
} from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:gap-6">
      <div className="flex min-w-0 items-center justify-between gap-3 lg:w-36 lg:shrink-0">
        <p className="font-semibold text-foreground">{DAY_LABELS[day]}</p>
        <Button
          type="button"
          variant={hours.open ? 'accent' : 'outline'}
          size="sm"
          aria-pressed={hours.open}
          onClick={onToggle}
        >
          {hours.open ? 'Open' : 'Closed'}
        </Button>
      </div>
      {hours.open ? (
        <div className="min-w-0 flex-1 space-y-3">
          {hours.intervals.map((_, index) => (
            <div
              key={`${day}-${index}`}
              className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Label
                  htmlFor={`${day}-${index}-from`}
                  className="text-xs text-muted-foreground"
                >
                  Opening time
                </Label>
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
              <span className="hidden pb-2 text-muted-foreground sm:block">to</span>
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`${day}-${index}-to`} className="text-xs text-muted-foreground">
                  Closing time
                </Label>
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
              {hours.intervals.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${DAY_LABELS[day]} interval ${index + 1}`}
                  onClick={() => removeInterval(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
          {hours.intervals.length < 2 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 px-0 text-accent hover:bg-transparent hover:text-accent/80"
              onClick={addInterval}
            >
              <Plus className="h-4 w-4" />
              Add another time
            </Button>
          ) : null}
          <FieldError message={error?.intervals?.message} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Customers cannot visit on this day.</p>
      )}
    </div>
  )
}
