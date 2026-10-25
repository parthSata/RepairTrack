import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { InviteAcceptForm } from '@/components/auth/invite-accept-form'
import { VerifyEmailCard } from '@/components/auth/verify-email-card'
import { getInviteGoogleErrorMessage } from '@/features/staff/schemas'
import { getInvitationByToken } from '@/server/services/staff.service'

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ token }, { error }] = await Promise.all([params, searchParams])
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    return (
      <AuthFormShell
        title="Invalid Invite"
        description="This staff invitation link is invalid or has been revoked."
        footer={
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Return to sign in
          </Link>
        }
      >
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-sm text-destructive font-medium">
            This invitation link cannot be used.
          </p>
          <p className="text-xs text-muted-foreground leading-5">
            Please contact your shop manager to request a new staff invitation link.
          </p>
        </div>
      </AuthFormShell>
    )
  }

  if (invitation.state === 'accepted') {
    return (
      <AuthFormShell
        title="Account Created"
        description="Your staff account has been set up. Verify your email to sign in."
        footer={
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Return to sign in
          </Link>
        }
      >
        <VerifyEmailCard initialEmail={invitation.email} />
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell
      title={`Join ${invitation.shopName}`}
      description={`Set up your account to join as a ${invitation.role.toLowerCase()}.`}
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <InviteAcceptForm token={token} details={invitation} googleError={getInviteGoogleErrorMessage(error)} />
    </AuthFormShell>
  )
}
