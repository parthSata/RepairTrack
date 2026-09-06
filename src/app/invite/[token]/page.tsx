import Link from 'next/link'
import { AlertCircle, Clock } from 'lucide-react'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { InviteAcceptForm } from '@/components/auth/invite-accept-form'
import { VerifyEmailCard } from '@/components/auth/verify-email-card'
import { getInvitationByToken } from '@/server/services/staff.service'

function formatMinutesRemaining(expiresAt: string): number {
  const remainingMs = new Date(expiresAt).getTime() - Date.now()
  return Math.max(1, Math.ceil(remainingMs / (60 * 1000)))
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    return (
      <AuthFormShell
        title="Invalid or Expired Invite"
        description="This staff invitation link is invalid, revoked, or has expired."
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

  if (invitation.state === 'expired') {
    return (
      <AuthFormShell
        title="Invitation Expired"
        description="This staff invitation link is no longer valid."
        footer={
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Return to sign in
          </Link>
        }
      >
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">
            This invitation has expired.
          </p>
          <p className="text-xs text-muted-foreground leading-5">
            Ask your shop owner to send a new invitation to <span className="font-medium">{invitation.email}</span>.
          </p>
        </div>
      </AuthFormShell>
    )
  }

  const minutesRemaining = formatMinutesRemaining(invitation.expiresAt)

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
      <p className="mb-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Link expires in {minutesRemaining} minute{minutesRemaining === 1 ? '' : 's'}
      </p>
      <InviteAcceptForm token={token} details={invitation} />
    </AuthFormShell>
  )
}
