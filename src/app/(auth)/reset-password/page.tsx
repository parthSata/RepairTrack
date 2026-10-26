import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password | RepairTrack',
  description: 'Choose a new password for your RepairTrack account.',
}

export default function ResetPasswordPage() {
  return (
    <AuthFormShell
      title="Reset password"
      description="Choose a new password for your account."
      footer={
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading reset form...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthFormShell>
  )
}
