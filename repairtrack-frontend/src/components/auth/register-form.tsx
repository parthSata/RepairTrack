'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerSchema, type RegisterInput } from '@/features/auth/schemas'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [resendCount, setResendCount] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  useEffect(() => {
    if (!verificationEmail) return
    const storageKey = `resend_cooldown_${verificationEmail}`
    const storedExpiry = localStorage.getItem(storageKey)
    
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10)
      if (Date.now() < expiryTime) {
        updateCooldownText(expiryTime)

        const interval = setInterval(() => {
          if (!updateCooldownText(expiryTime)) {
            clearInterval(interval)
            localStorage.removeItem(storageKey)
          }
        }, 30000)

        return () => clearInterval(interval)
      } else {
        localStorage.removeItem(storageKey)
      }
    }
  }, [verificationEmail])

  function updateCooldownText(expiryTime: number): boolean {
    const diff = expiryTime - Date.now()
    if (diff <= 0) {
      setCooldownRemaining(null)
      setResendCount(0)
      return false
    }
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60))
    setCooldownRemaining(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`)
    return true
  }

  async function onSubmit(values: RegisterInput) {
    setFormError(null)
    try {
      const response = await apiClient.post<{ valid: boolean }>('email-check', { email: values.email })
      if (!response.data.valid) throw new Error('Email domain is not valid')
    } catch {
      setFormError('This email address cannot receive email. Check the address and try again.')
      return
    }
    try {
      await apiClient.post('auth/sign-up/email', {
        email: values.email,
        password: values.password,
        name: values.ownerName,
        shopName: values.shopName,
        callbackURL: '/dashboard',
      })
    } catch {
      setFormError('Unable to create your account.')
      return
    }
    setVerificationEmail(values.email)
    setVerificationSent(true)
  }

  async function resendVerification() {
    if (resendCount >= 2 || isResending || cooldownRemaining) return
    setFormError(null)
    setIsResending(true)

    const result = await authClient.sendVerificationEmail({ email: verificationEmail, callbackURL: '/dashboard' })
    if (result.error) {
      setFormError('We could not send the verification email. Please try again later.')
    } else {
      const nextCount = resendCount + 1
      setResendCount(nextCount)
      
      if (nextCount >= 2) {
        const expiryTime = Date.now() + TWO_HOURS_MS
        localStorage.setItem(`resend_cooldown_${verificationEmail}`, expiryTime.toString())
        updateCooldownText(expiryTime)
      }
    }
    setIsResending(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {verificationSent && (
        <div role="status" className="space-y-3 rounded-md border border-success/30 bg-success/5 p-4 text-sm text-foreground">
          <p className="font-medium">Check your email to continue.</p>
          <p className="leading-5 text-muted-foreground">
            We sent a verification link to {verificationEmail}. Verify it, then return here to open your workspace.
          </p>
          
          {cooldownRemaining ? (
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
              Resend limit reached. Try again after 2 hours (remaining: {cooldownRemaining}).
            </div>
          ) : resendCount < 2 ? (
            <button
              type="button"
              className="font-medium text-foreground underline disabled:opacity-50"
              onClick={() => void resendVerification()}
              disabled={isResending}
            >
              {isResending ? 'Sending...' : `Resend verification email (${2 - resendCount} remaining)`}
            </button>
          ) : (
            <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
              Resend limit reached. Try again after 2 hours.
            </div>
          )}

          <Link href="/login" className="block font-medium text-foreground underline pt-1">
            Go to sign in
          </Link>
        </div>
      )}

      {!verificationSent && (
        <>
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop name</Label>
            <Input id="shopName" autoComplete="organization" {...register('shopName')} />
            {errors.shopName && <p className="text-sm text-destructive">{errors.shopName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Your name</Label>
            <Input id="ownerName" autoComplete="name" {...register('ownerName')} />
            {errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
            {isSubmitting ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            )}
            {isSubmitting ? 'Creating your shop...' : 'Create shop'}
          </Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            You will become the OWNER. Staff and technicians can be invited later from Settings.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </form>
  )
}
