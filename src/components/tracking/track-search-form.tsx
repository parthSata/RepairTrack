'use client'

import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackVerifySchema, type TrackVerifyInput } from '@/features/tracking/schemas'

export type RateLimitState = {
  resetAt: number
  ticketNumber?: string
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TrackSearchForm({
  onSubmit,
  isSubmitting,
  defaultTicketNumber,
  submitError,
  rateLimit,
  onRateLimitExpire,
}: {
  onSubmit: (values: TrackVerifyInput) => Promise<void>
  isSubmitting: boolean
  defaultTicketNumber?: string
  submitError?: string | boolean | null
  rateLimit?: RateLimitState | null
  onRateLimitExpire?: () => void
}) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TrackVerifyInput>({
    resolver: zodResolver(trackVerifySchema),
    defaultValues: {
      ticketNumber: defaultTicketNumber ?? '',
      phone: '',
    },
  })

  const [secondsLeft, setSecondsLeft] = React.useState<number>(0)
  const [storedResetAt, setStoredResetAt] = React.useState<number | null>(null)

  const watchedTicket = useWatch({ control, name: 'ticketNumber' })

  // Check sessionStorage for active rate limit for current ticket
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const ticket = watchedTicket || defaultTicketNumber || ''
    queueMicrotask(() => {
      if (!ticket) {
        setStoredResetAt(null)
        return
      }
      const stored = sessionStorage.getItem(`rt_rl_verify_${ticket}`)
      if (stored) {
        const resetTime = parseInt(stored, 10)
        if (resetTime > Date.now()) {
          setStoredResetAt(resetTime)
        } else {
          sessionStorage.removeItem(`rt_rl_verify_${ticket}`)
          setStoredResetAt(null)
        }
      } else {
        setStoredResetAt(null)
      }
    })
  }, [watchedTicket, defaultTicketNumber])

  // Resolve the effective resetAt timestamp
  const activeResetAt = React.useMemo(() => {
    const currentTicket = watchedTicket || defaultTicketNumber || ''
    if (rateLimit && (!rateLimit.ticketNumber || rateLimit.ticketNumber === currentTicket)) {
      return rateLimit.resetAt
    }
    return storedResetAt
  }, [rateLimit, watchedTicket, defaultTicketNumber, storedResetAt])

  // Countdown timer effect
  React.useEffect(() => {
    if (!activeResetAt) return

    const calculate = () => Math.max(0, Math.ceil((activeResetAt - Date.now()) / 1000))
    const initial = calculate()

    if (initial <= 0) {
      const currentTicket = watchedTicket || defaultTicketNumber || ''
      if (currentTicket && typeof window !== 'undefined') {
        sessionStorage.removeItem(`rt_rl_verify_${currentTicket}`)
      }
      onRateLimitExpire?.()
      return
    }

    queueMicrotask(() => {
      setSecondsLeft(initial)
    })

    const interval = setInterval(() => {
      const remaining = calculate()
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        const currentTicket = watchedTicket || defaultTicketNumber || ''
        if (currentTicket && typeof window !== 'undefined') {
          sessionStorage.removeItem(`rt_rl_verify_${currentTicket}`)
        }
        onRateLimitExpire?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeResetAt, watchedTicket, defaultTicketNumber, onRateLimitExpire])

  const displaySecondsLeft = activeResetAt ? secondsLeft : 0

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        if (isSubmitting || displaySecondsLeft > 0) return
        await onSubmit(values)
      })}
      className="space-y-5"
    >
      {displaySecondsLeft > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950 dark:text-amber-100">Too many verification attempts</p>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                For security, lookups for this repair ticket are paused after 10 attempts. Please wait 15 minutes before trying again.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-950 dark:text-amber-100">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>Time remaining</span>
            </span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatDuration(displaySecondsLeft)}
            </span>
          </div>
        </div>
      ) : submitError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            {typeof submitError === 'string'
              ? submitError
              : "We couldn't find this repair. Check your repair number and phone, then try again."}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="ticketNumber">Repair Number</Label>
        <Input
          id="ticketNumber"
          inputMode="numeric"
          autoComplete="off"
          placeholder="10-digit repair number"
          disabled={isSubmitting || displaySecondsLeft > 0}
          {...register('ticketNumber', {
            onChange: (event) => {
              const cleaned = event.target.value.replace(/\D/g, '')
              if (cleaned !== event.target.value) {
                setValue('ticketNumber', cleaned, { shouldValidate: true })
              }
            },
          })}
        />
        {errors.ticketNumber ? (
          <p className="text-xs text-destructive">{errors.ticketNumber.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="e.g. 9876543210 or +919876543210"
          disabled={isSubmitting || displaySecondsLeft > 0}
          {...register('phone', {
            onChange: (event) => {
              const value = event.target.value
              const cleaned = value.replace(/(?!^\+)[^\d]/g, '')
              if (cleaned !== value) {
                setValue('phone', cleaned, { shouldValidate: true })
              }
            },
          })}
        />
        {errors.phone ? (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Use the phone number saved with your repair.</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full transition-colors duration-200"
        disabled={isSubmitting || displaySecondsLeft > 0}
      >
        {displaySecondsLeft > 0
          ? `Try again in ${formatDuration(displaySecondsLeft)}`
          : isSubmitting
            ? 'Checking…'
            : 'Track Repair'}
      </Button>
    </form>
  )
}

