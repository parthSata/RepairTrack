'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerSchema, type RegisterInput } from '@/features/auth/schemas'

export function RegisterForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterInput) {
    setFormError(null)
    const result = await authClient.signUp.email({ email: values.email, password: values.password, name: values.ownerName, callbackURL: '/dashboard' })
    if (result.error) {
      setFormError(result.error.message ?? 'Unable to create your account.')
      return
    }
    try {
      await apiClient.post('onboarding', { shopName: values.shopName })
      router.push('/dashboard')
      router.refresh()
    } catch {
      setFormError('Your account was created, but the shop setup could not finish. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{formError}</p>}
      <div className="space-y-2"><Label htmlFor="shopName">Shop name</Label><Input id="shopName" autoComplete="organization" {...register('shopName')} />{errors.shopName && <p className="text-sm text-destructive">{errors.shopName.message}</p>}</div>
      <div className="space-y-2"><Label htmlFor="ownerName">Your name</Label><Input id="ownerName" autoComplete="name" {...register('ownerName')} />{errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName.message}</p>}</div>
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" {...register('email')} />{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}</div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" {...register('password')} />{errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}</div>
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Creating your shop...' : 'Create shop'}</Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">You will become the OWNER. Staff and technicians can be invited later from Settings.</p>
      <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-foreground hover:underline">Sign in</Link></p>
    </form>
  )
}