import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Forgot Password | RepairTrack',
  description:
    'Request a password reset link for your RepairTrack account.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthFormShell
      title="Forgot password"
      description="Enter your email and we'll send a reset link if an account exists."
      footer={
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthFormShell>
  )
}
