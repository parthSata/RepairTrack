'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle, LoaderCircle, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/auth/schemas'

function mapRequestError(error: {
  status?: number
  message?: string | null
  code?: string | null
}): string {
  const status = error.status
  const code = (error.code ?? '').toUpperCase()
  const message = (error.message ?? '').toLowerCase()

  if (
    status === 429 ||
    code.includes('TOO_MANY') ||
    code.includes('RATE_LIMIT') ||
    message.includes('too many') ||
    message.includes('rate limit')
  ) {
    return 'Too many requests. Please wait a few minutes and try again.'
  }

  return "We couldn't send the email right now. Please try again later."
}

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null)

    const result = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: '/reset-password',
    })

    if (result.error) {
      setFormError(mapRequestError(result.error))
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="space-y-5">
        <div
          role="status"
          className="space-y-2 rounded-lg border border-accent/30 bg-accent/10 p-4 text-foreground"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <CheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            Check your email
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            If an account exists for that email, we sent a reset link. Check
            your inbox.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError ? (
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
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Mail aria-hidden="true" className="h-4 w-4" />
        )}
        {isSubmitting ? 'Sending...' : 'Send reset link'}
      </Button>
    </form>
  )
}
