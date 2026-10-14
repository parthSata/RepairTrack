'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertCircle, ArrowRight, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiClient } from '@/lib/api-client'
import { getApiErrorMessage } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerSchema, type RegisterInput } from '@/features/auth/schemas'
import { VerifyEmailCard } from '@/components/auth/verify-email-card'

export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterInput) {
    setFormError(null)

    try {
      const response = await apiClient.post<{ valid: boolean }>('email-check', {
        email: values.email,
      })
      if (!response.data.valid) {
        setFormError(
          'This email address cannot receive email. Check the address and try again.',
        )
        return
      }
    } catch (error: unknown) {
      setFormError(
        getApiErrorMessage(
          error,
          'This email address cannot receive email. Check the address and try again.',
        ),
      )
      return
    }

    try {
      await apiClient.post('/registration', values)
    } catch (error: unknown) {
      setFormError(
        getApiErrorMessage(
          error,
          'Unable to start registration. Please try again.',
        ),
      )
      return
    }

    setVerificationEmail(values.email)
    setVerificationSent(true)
  }

  if (verificationSent) {
    return (
      <VerifyEmailCard initialEmail={verificationEmail} pendingRegistration />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive transition-colors"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {formError}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="shopName">Shop name</Label>
        <Input
          id="shopName"
          autoComplete="organization"
          {...register('shopName')}
        />
        <FieldError message={errors.shopName?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ownerName">Your name</Label>
        <Input id="ownerName" autoComplete="name" {...register('ownerName')} />
        <FieldError message={errors.ownerName?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full gap-2 transition-colors active:scale-[0.99]"
      >
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        )}
        {isSubmitting ? 'Creating your shop...' : 'Create shop'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
