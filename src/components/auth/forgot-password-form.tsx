'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Clock, LoaderCircle, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage, getRateLimitInfo } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/auth/schemas'

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [rateLimitResetAt, setRateLimitResetAt] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  useEffect(() => {
    if (!rateLimitResetAt) {
      setSecondsLeft(0)
      return
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((rateLimitResetAt - Date.now()) / 1000),
      )
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        setRateLimitResetAt(null)
        setFormError(null)
      }
      return remaining
    }

    if (tick() <= 0) return

    const interval = setInterval(() => {
      if (tick() <= 0) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [rateLimitResetAt])

  async function onSubmit(values: ForgotPasswordInput) {
    if (secondsLeft > 0) return

    setFormError(null)
    setRateLimitResetAt(null)

    try {
      await apiClient.post<{ sent: true }>('forgot-password', {
        email: values.email,
      })
      setSubmitted(true)
    } catch (err: unknown) {
      const rateLimit = getRateLimitInfo(err)
      if (rateLimit?.isRateLimited) {
        setRateLimitResetAt(rateLimit.resetAt)
        setFormError(null)
        return
      }
      setFormError(
        getApiErrorMessage(
          err,
          "We couldn't send the email right now. Please try again later.",
        ),
      )
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="space-y-2 rounded-lg border border-accent/30 bg-accent/10 p-4 text-foreground"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-accent">
          <CheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          Check your email
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          We sent a password reset link to that email. Check your inbox.
        </p>
      </div>
    )
  }

  const isRateLimited = secondsLeft > 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {isRateLimited ? (
        <div
          role="alert"
          className="space-y-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200"
        >
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950 dark:text-amber-100">
                Too many requests
              </p>
              <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-300/80">
                Please wait before requesting another password reset email.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-950 dark:text-amber-100">
            <span>Try again in</span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatDuration(secondsLeft)}
            </span>
          </div>
        </div>
      ) : formError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {formError}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          disabled={isRateLimited}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || isRateLimited}
        className="w-full gap-2"
      >
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Mail aria-hidden="true" className="h-4 w-4" />
        )}
        {isRateLimited
          ? `Try again in ${formatDuration(secondsLeft)}`
          : isSubmitting
            ? 'Sending...'
            : 'Send reset link'}
      </Button>
    </form>
  )
}
