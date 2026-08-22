'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { LoaderCircle, LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@/features/auth/schemas'

export function LoginForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isGooglePending, setIsGooglePending] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginInput) {
    setFormError(null)
    const result = await authClient.signIn.email({ ...values, callbackURL: '/dashboard' })
    if (result.error) {
      setFormError('Those credentials do not match an account.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function signInWithGoogle() {
    setFormError(null)
    setIsGooglePending(true)
    const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/onboarding' })
    if (result.error) {
      setFormError('Google sign-in is unavailable right now.')
      setIsGooglePending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{formError}</p>}
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
      <Button type="button" variant="outline" disabled={isSubmitting || isGooglePending} onClick={signInWithGoogle} className="w-full gap-2">{isGooglePending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Image aria-hidden="true" src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="" width={16} height={16} />}{isGooglePending ? 'Opening Google...' : 'Continue with Google'}</Button>
    </form>
  )
}