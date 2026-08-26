'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { LoaderCircle, LogIn, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@/features/auth/schemas'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [formError, setFormError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [isInactiveUser, setIsInactiveUser] = useState(false)
  const [isGooglePending, setIsGooglePending] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (errorParam === 'account_deactivated') {
      setIsInactiveUser(true)
      setFormError('Your account has been deactivated. Contact your shop owner for activation.')
    }
  }, [errorParam])

  async function onSubmit(values: LoginInput) {
    setFormError(null)
    setUnverifiedEmail(null)
    setIsInactiveUser(false)
    const result = await authClient.signIn.email({ ...values, callbackURL: '/dashboard' })
    if (result.error) {
      const msg = result.error.message || 'Those credentials do not match an account.'
      setFormError(msg)
      if (msg.toLowerCase().includes('verify')) {
        setUnverifiedEmail(values.email)
      }
      if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('deactivated') || msg.toLowerCase().includes('owner')) {
        setIsInactiveUser(true)
      }
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function signInWithGoogle() {
    setFormError(null)
    setIsGooglePending(true)
    const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' })
    if (result.error) {
      const msg = result.error.message || 'Google sign-in is unavailable right now.'
      setFormError(msg)
      if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('deactivated') || msg.toLowerCase().includes('owner')) {
        setIsInactiveUser(true)
      }
      setIsGooglePending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {isInactiveUser ? (
        <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            Account Deactivated
          </div>
          <p className="text-xs leading-5">
            Your account is currently inactive. Contact your shop owner for activation.
          </p>
        </div>
      ) : formError ? (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive space-y-1">
          <p>{formError}</p>
          {unverifiedEmail && (
            <p className="text-xs">
              <a href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`} className="font-semibold underline">
                Click here to verify your email address →
              </a>
            </p>
          )}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting || isGooglePending} className="w-full gap-2">{isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <LogIn aria-hidden="true" className="h-4 w-4" />}{isSubmitting ? 'Signing in...' : 'Sign in'}</Button>
      <div className="relative flex items-center"><div className="h-px flex-1 bg-border" /><span className="px-3 text-xs text-muted-foreground">or</span><div className="h-px flex-1 bg-border" /></div>
      <Button type="button" variant="outline" disabled={isSubmitting || isGooglePending} onClick={signInWithGoogle} className="w-full gap-2">{isGooglePending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Image aria-hidden="true" src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="" width={16} height={16} loading="eager" />}{isGooglePending ? 'Opening Google...' : 'Continue with Google'}</Button>
    </form>
  )
}
