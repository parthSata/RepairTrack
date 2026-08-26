'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { useAcceptInvitation } from '@/features/staff/mutations'
import { acceptInvitationSchema, type AcceptInvitationInput, type InvitationDetails } from '@/features/staff/schemas'
import { VerifyEmailCard } from '@/components/auth/verify-email-card'

export function InviteAcceptForm({
  token,
  details,
}: {
  token: string
  details: InvitationDetails
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const [isGooglePending, setIsGooglePending] = useState(false)
  const [success, setSuccess] = useState(false)

  const acceptMutation = useAcceptInvitation(token)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      name: details.name,
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: AcceptInvitationInput) {
    setFormError(null)
    try {
      await acceptMutation.mutateAsync(values)
      setSuccess(true)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      setFormError(message || 'Unable to accept invitation. Please try again.')
    }
  }

  async function signInWithGoogle() {
    setFormError(null)
    setIsGooglePending(true)
    const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' })
    if (result.error) {
      setFormError('Google sign-in is unavailable right now.')
      setIsGooglePending(false)
    }
  }

  if (success) {
    return <VerifyEmailCard initialEmail={details.email} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <ShieldCheck className="h-4 w-4" />
          Invitation Details
        </div>
        <div className="text-sm text-foreground">
          Joining <span className="font-semibold">{details.shopName}</span> as a{' '}
          <span className="font-semibold capitalize">{details.role.toLowerCase()}</span>
        </div>
        <div className="text-xs text-muted-foreground">Assigned email: {details.email}</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accept-name">Your Name</Label>
        <Input id="accept-name" autoComplete="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accept-password">Set Password</Label>
        <Input
          id="accept-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register('password')}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        <p className="text-[11px] text-muted-foreground leading-4">
          Must be at least 8 characters with upper & lowercase letters, a number, and a special character.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accept-confirm-password">Confirm Password</Label>
        <Input
          id="accept-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || isGooglePending} className="w-full gap-2">
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        )}
        {isSubmitting ? 'Creating account...' : 'Create account & join shop'}
      </Button>

      <div className="relative flex items-center">
        <div className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || isGooglePending}
        onClick={signInWithGoogle}
        className="w-full gap-2"
      >
        {isGooglePending ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Image
            aria-hidden="true"
            src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
            alt=""
            width={16}
            height={16}
          />
        )}
        {isGooglePending ? 'Opening Google...' : 'Continue with Google'}
      </Button>
    </form>
  )
}
