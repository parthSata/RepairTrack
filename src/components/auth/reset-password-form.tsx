'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, CheckCircle, KeyRound, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { PasswordConfirmFields } from '@/components/auth/password-confirm-fields'
import {
  INVALID_RESET_TOKEN_MESSAGE,
  mapBetterAuthClientError,
} from '@/features/auth/map-auth-client-error'
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/features/auth/schemas'

function InvalidResetLink() {
  return (
    <div className="space-y-5">
      <div
        role="alert"
        className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          Link unavailable
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {INVALID_RESET_TOKEN_MESSAGE}
        </p>
      </div>
      <Link
        href="/forgot-password"
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors duration-200 hover:bg-foreground/90"
      >
        Request a new link
      </Link>
    </div>
  )
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const token = searchParams.get('token')?.trim() ?? ''

  const hasInvalidTokenParam =
    (urlError ?? '').toUpperCase() === 'INVALID_TOKEN'
  const hasToken = token.length > 0
  const [linkInvalid, setLinkInvalid] = useState(
    hasInvalidTokenParam || !hasToken,
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: ResetPasswordInput) {
    if (!hasToken || linkInvalid) {
      setLinkInvalid(true)
      return
    }

    setFormError(null)

    const result = await authClient.resetPassword({
      newPassword: values.password,
      token,
    })

    if (result.error) {
      const message = mapBetterAuthClientError(
        result.error,
        "We couldn't reset your password. Please try again.",
      )
      if (message === INVALID_RESET_TOKEN_MESSAGE) {
        setLinkInvalid(true)
        return
      }
      setFormError(message)
      return
    }

    setSuccess(true)
  }

  if (linkInvalid) {
    return <InvalidResetLink />
  }

  if (success) {
    return (
      <div
        role="status"
        className="space-y-2 rounded-lg border border-accent/30 bg-accent/10 p-4 text-foreground"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-accent">
          <CheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          Password updated
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Your password has been reset. Sign in with your new password.
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

      <PasswordConfirmFields
        idPrefix="reset"
        passwordLabel="New Password"
        passwordRegister={register('password')}
        confirmRegister={register('confirmPassword')}
        passwordError={errors.password?.message}
        confirmError={errors.confirmPassword?.message}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound aria-hidden="true" className="h-4 w-4" />
        )}
        {isSubmitting ? 'Updating...' : 'Reset password'}
      </Button>
    </form>
  )
}
