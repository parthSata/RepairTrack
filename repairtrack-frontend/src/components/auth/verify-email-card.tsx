'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, LoaderCircle, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export function VerifyEmailCard({ initialEmail }: { initialEmail?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email') || initialEmail || ''
  const isVerifiedParam = searchParams.get('verified') === 'true'

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    isVerifiedParam ? 'success' : token ? 'verifying' : 'idle',
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [verificationEmail] = useState(emailParam)
  const [resendCount, setResendCount] = useState(() => {
    if (typeof window === 'undefined' || !emailParam) return 0
    const storedCount = localStorage.getItem(`resend_count_${emailParam}`)
    const storedExpiry = localStorage.getItem(`resend_cooldown_${emailParam}`)
    if (storedExpiry && Date.now() < parseInt(storedExpiry, 10)) return 2
    return storedCount ? parseInt(storedCount, 10) : 0
  })
  const [isResending, setIsResending] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null)

  useEffect(() => {
    if (!token || isVerifiedParam) return

    async function verifyToken() {
      setStatus('verifying')
      setErrorMsg(null)
      try {
        const result = await authClient.verifyEmail({
          query: { token: token! },
        })

        if (result.error) {
          setStatus('error')
          setErrorMsg(result.error.message || 'Verification link is invalid or has expired.')
        } else {
          setStatus('success')
        }
      } catch (err: unknown) {
        setStatus('error')
        const msg = err instanceof Error ? err.message : 'Verification failed'
        setErrorMsg(msg)
      }
    }

    void verifyToken()
  }, [token, isVerifiedParam])

  useEffect(() => {
    if (!verificationEmail) return
    const cooldownKey = `resend_cooldown_${verificationEmail}`
    const countKey = `resend_count_${verificationEmail}`

    const storedExpiry = localStorage.getItem(cooldownKey)
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10)
      if (Date.now() < expiryTime) {
        updateCooldownText(expiryTime)

        const interval = setInterval(() => {
          if (!updateCooldownText(expiryTime)) {
            clearInterval(interval)
            localStorage.removeItem(cooldownKey)
            localStorage.removeItem(countKey)
          }
        }, 10000)

        return () => clearInterval(interval)
      } else {
        localStorage.removeItem(cooldownKey)
        localStorage.removeItem(countKey)
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

  async function resendVerification() {
    if (!verificationEmail || resendCount >= 2 || isResending || cooldownRemaining) {
      return
    }
    setErrorMsg(null)
    setIsResending(true)

    const result = await authClient.sendVerificationEmail({
      email: verificationEmail,
      callbackURL: '/dashboard',
    })
    if (result.error) {
      setErrorMsg('We could not send the verification email. Please try again later.')
    } else {
      const nextCount = resendCount + 1
      setResendCount(nextCount)
      localStorage.setItem(`resend_count_${verificationEmail}`, nextCount.toString())

      if (nextCount >= 2) {
        const expiryTime = Date.now() + TWO_HOURS_MS
        localStorage.setItem(`resend_cooldown_${verificationEmail}`, expiryTime.toString())
        updateCooldownText(expiryTime)
      }
    }
    setIsResending(false)
  }

  if (status === 'verifying') {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold">Verifying your email...</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we verify your email token.
        </p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">Email Verified!</h2>
        <p className="text-sm text-muted-foreground">
          Your email address has been successfully verified. You can now access your shop workspace.
        </p>
        <Button onClick={() => router.push('/dashboard')} className="w-full mt-2">
          Continue to Dashboard
        </Button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">Verification Failed</h2>
        <p className="text-sm text-destructive font-medium">{errorMsg}</p>
        <p className="text-xs text-muted-foreground leading-5">
          If your link expired, you can request a new verification email below or return to sign in.
        </p>
        <div className="space-y-2 pt-2">
          {verificationEmail && (
            <Button
              type="button"
              variant="outline"
              disabled={isResending || resendCount >= 2 || Boolean(cooldownRemaining)}
              onClick={() => void resendVerification()}
              className="w-full"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          )}
          <Button onClick={() => router.push('/login')} variant="ghost" className="w-full">
            Return to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <MailCheck className="h-6 w-6" />
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground leading-5">
          We sent a verification link to{' '}
          <span className="font-semibold text-foreground">{verificationEmail || 'your email address'}</span>.
          Please check your inbox and verify your email to open your workspace.
        </p>
      </div>

      {errorMsg && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {errorMsg}
        </p>
      )}

      {cooldownRemaining ? (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 font-medium text-center">
          Resend limit reached. Try again after 2 hours (remaining: {cooldownRemaining}).
        </div>
      ) : resendCount < 2 ? (
        <Button
          type="button"
          variant="outline"
          disabled={isResending}
          onClick={() => void resendVerification()}
          className="w-full"
        >
          {isResending ? 'Sending...' : `Resend verification email (${2 - resendCount} remaining)`}
        </Button>
      ) : (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 font-medium text-center">
          Resend limit reached. Try again after 2 hours.
        </div>
      )}

      <div className="pt-2 text-center">
        <Link href="/login" className="text-sm font-medium text-foreground hover:underline">
          Return to sign in
        </Link>
      </div>
    </div>
  )
}
