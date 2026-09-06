import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { VerifyEmailCard } from '@/components/auth/verify-email-card'

export const metadata: Metadata = {
  title: 'Verify Email | RepairTrack',
  description: 'Verify your email address to access your RepairTrack shop workspace.',
}

export default function VerifyEmailPage() {
  return (
    <AuthFormShell
      title="Email Verification"
      description="Verify your email address to continue to RepairTrack."
      footer={
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Return to sign in
        </Link>
      }
    >
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading verification...</div>}>
        <VerifyEmailCard />
      </Suspense>
    </AuthFormShell>
  )
}
