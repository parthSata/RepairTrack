import { and, eq } from 'drizzle-orm'
import { APIError, getOAuthState } from 'better-auth/api'
import { db } from '@/server/db'
import { staffInvitations } from '@/server/db/schema'
import { INVITE_GOOGLE_ERRORS, type InviteGoogleErrorCode } from '@/features/staff/schemas'

type Invitation = typeof staffInvitations.$inferSelect

function inviteError(code: InviteGoogleErrorCode) {
  return new APIError('FORBIDDEN', { code, message: INVITE_GOOGLE_ERRORS[code] })
}

function sameEmail(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/**
 * Invite token sent by "Continue with Google" on `/invite/[token]` (OAuth `additionalData`).
 * Client-supplied, so callers must re-check it against the invitation; null outside an invite flow.
 */
export async function getOAuthInviteToken(): Promise<string | null> {
  try {
    const token = ((await getOAuthState()) as Record<string, unknown> | null)?.inviteToken
    return typeof token === 'string' && token.length > 0 ? token : null
  } catch {
    return null
  }
}

async function findInvitation(token: string): Promise<Invitation | undefined> {
  return db.query.staffInvitations.findFirst({ where: eq(staffInvitations.token, token) })
}

/** New Google user from an invite: the invitation must be pending, unexpired and for this email. */
export async function requirePendingInvitation(token: string, email: string): Promise<Invitation> {
  const invitation = await findInvitation(token)
  if (!invitation || invitation.status !== 'pending' || new Date() > invitation.expiresAt) {
    throw inviteError('INVITE_INVALID')
  }
  if (!sameEmail(invitation.email, email)) throw inviteError('INVITE_EMAIL_MISMATCH')
  return invitation
}

export async function markInvitationAccepted(token: string): Promise<void> {
  await db
    .update(staffInvitations)
    .set({ status: 'accepted' })
    .where(and(eq(staffInvitations.token, token), eq(staffInvitations.status, 'pending')))
}

/**
 * Runs before a session is created in an invite flow. Blocks signing in to an existing account
 * (e.g. an owner's Google account) that isn't the invited email in the invited shop.
 */
export async function assertInviteSessionUser(
  token: string,
  user: { email: string; shopId: string | null },
): Promise<void> {
  const invitation = await findInvitation(token)
  if (!invitation) throw inviteError('INVITE_INVALID')
  if (!sameEmail(invitation.email, user.email)) throw inviteError('INVITE_EMAIL_MISMATCH')
  if (user.shopId !== invitation.shopId) throw inviteError('INVITE_ACCOUNT_EXISTS')
}
