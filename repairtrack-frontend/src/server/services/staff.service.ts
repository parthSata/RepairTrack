import { and, eq, inArray } from 'drizzle-orm'
import { createLocalAccountIssuer } from '@better-auth/core/db'
import { hashPassword } from 'better-auth/crypto'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { accounts, shops, staffInvitations, users } from '@/server/db/schema'
import type {
  AcceptInvitationInput,
  InvitationDetails,
  InviteStaffInput,
  UnifiedStaffMember,
} from '@/features/staff/schemas'
import { sendEmail } from '@/server/services/gmail.service'
import { buildStaffInvitationEmailHtml, buildVerificationEmailHtml } from '@/server/services/email-templates'

const INVITE_TTL_MS = 10 * 60 * 1000

export async function getTechnicians(shopId: string) {
  const techs = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(
      and(
        eq(users.shopId, shopId),
        inArray(users.role, ['TECHNICIAN', 'STAFF']),
        eq(users.status, 'ACTIVE'),
      ),
    )

  return techs
}

function buildInvitationDetails(
  invitation: {
    name: string
    email: string
    role: 'STAFF' | 'TECHNICIAN'
    expiresAt: Date
    shop?: { name: string } | null
  },
  state: InvitationDetails['state'],
): InvitationDetails {
  return {
    state,
    name: invitation.name,
    email: invitation.email,
    role: invitation.role,
    shopName: invitation.shop?.name ?? 'Repair Shop',
    expiresAt: invitation.expiresAt.toISOString(),
  }
}

export async function inviteStaff(shopId: string, invitedBy: string, input: InviteStaffInput) {
  const targetEmail = input.email.trim().toLowerCase()

  const inviter = await db.query.users.findFirst({
    where: eq(users.id, invitedBy),
  })
  if (inviter && inviter.email.toLowerCase() === targetEmail) {
    throw new HTTPException(400, { message: 'You cannot send an invitation to your own email address' })
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, targetEmail),
  })
  if (existingUser) {
    if (existingUser.shopId !== shopId) {
      throw new HTTPException(400, { message: 'A user with this email address already exists' })
    }
    if (existingUser.status === 'ACTIVE') {
      throw new HTTPException(400, { message: 'This email is already an active member of your shop' })
    }
  }

  const pendingInvite = await db.query.staffInvitations.findFirst({
    where: and(
      eq(staffInvitations.email, targetEmail),
      eq(staffInvitations.shopId, shopId),
      eq(staffInvitations.status, 'pending'),
    ),
  })
  if (pendingInvite) {
    await db
      .update(staffInvitations)
      .set({ status: 'revoked' })
      .where(eq(staffInvitations.id, pendingInvite.id))
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, shopId),
  })

  const shopName = shop?.name ?? 'RepairTrack Shop'
  const inviterName = inviter?.name ?? 'Shop Owner'

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

  await db.insert(staffInvitations).values({
    shopId,
    email: targetEmail,
    name: input.name,
    role: input.role,
    token,
    status: 'pending',
    invitedBy,
    expiresAt,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`

  try {
    const html = buildStaffInvitationEmailHtml({
      inviterName,
      shopName,
      role: input.role,
      inviteUrl,
    })
    const emailResult = await sendEmail({
      to: targetEmail,
      subject: `You've been invited to join ${shopName} on RepairTrack`,
      html,
    })
    if (!emailResult.sent) {
      console.warn('Staff invitation email not sent (Gmail API not configured)')
    }
  } catch (emailErr) {
    console.warn('Failed to send staff invitation email:', emailErr)
  }

  return {
    token,
    inviteLink: `/invite/${token}`,
    expiresAt: expiresAt.toISOString(),
  }
}

export async function listStaff(shopId: string): Promise<UnifiedStaffMember[]> {
  const staffUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.shopId, shopId), inArray(users.role, ['STAFF', 'TECHNICIAN'])))

  const pendingInvitations = await db
    .select()
    .from(staffInvitations)
    .where(and(eq(staffInvitations.shopId, shopId), eq(staffInvitations.status, 'pending')))

  const now = new Date()

  const userItems: UnifiedStaffMember[] = staffUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as 'STAFF' | 'TECHNICIAN',
    status: u.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    isInvitation: false,
    createdAt: u.createdAt.toISOString(),
  }))

  const inviteItems: UnifiedStaffMember[] = pendingInvitations.map((inv) => ({
    id: inv.id,
    name: inv.name,
    email: inv.email,
    role: inv.role,
    status: now > inv.expiresAt ? 'EXPIRED' : 'INVITED',
    isInvitation: true,
    token: inv.token,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
  }))

  return [...userItems, ...inviteItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function setStaffStatus(shopId: string, userId: string, status: 'ACTIVE' | 'INACTIVE') {
  const existingUser = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.shopId, shopId), inArray(users.role, ['STAFF', 'TECHNICIAN'])))
    .limit(1)

  if (!existingUser[0]) {
    throw new HTTPException(404, { message: 'Staff member not found' })
  }

  await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.shopId, shopId)))

  return { success: true, userId, status }
}

export async function changeStaffRole(shopId: string, targetId: string, newRole: 'STAFF' | 'TECHNICIAN') {
  const existingUser = await db
    .select()
    .from(users)
    .where(and(eq(users.id, targetId), eq(users.shopId, shopId), inArray(users.role, ['STAFF', 'TECHNICIAN'])))
    .limit(1)

  if (existingUser[0]) {
    await db
      .update(users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(and(eq(users.id, targetId), eq(users.shopId, shopId)))

    return { success: true, id: targetId, role: newRole, isInvitation: false }
  }

  const existingInvite = await db
    .select()
    .from(staffInvitations)
    .where(
      and(
        eq(staffInvitations.id, targetId),
        eq(staffInvitations.shopId, shopId),
        eq(staffInvitations.status, 'pending'),
      ),
    )
    .limit(1)

  if (existingInvite[0]) {
    await db
      .update(staffInvitations)
      .set({ role: newRole })
      .where(and(eq(staffInvitations.id, targetId), eq(staffInvitations.shopId, shopId)))

    return { success: true, id: targetId, role: newRole, isInvitation: true }
  }

  throw new HTTPException(404, { message: 'Staff member or invitation not found' })
}

export async function getInvitationByToken(token: string): Promise<InvitationDetails | null> {
  const invitation = await db.query.staffInvitations.findFirst({
    where: eq(staffInvitations.token, token),
    with: {
      shop: true,
    },
  })

  if (!invitation || invitation.status === 'revoked') {
    return null
  }

  if (invitation.status === 'accepted') {
    return buildInvitationDetails(invitation, 'accepted')
  }

  if (invitation.status === 'expired' || new Date() > invitation.expiresAt) {
    return buildInvitationDetails(invitation, 'expired')
  }

  return buildInvitationDetails(invitation, 'pending')
}

async function sendReactivationVerificationEmail(email: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
  const url = `${appUrl}/verify-email?email=${encodeURIComponent(email)}`

  try {
    const html = buildVerificationEmailHtml({ name, url })
    const result = await sendEmail({
      to: email,
      subject: 'Verify your RepairTrack email',
      html,
    })
    if (!result.sent) {
      console.warn('Verification email not sent (Gmail API not connected)')
    }
  } catch (err) {
    console.warn('Failed to send verification email for reactivated user:', err)
  }
}

async function reactivateInactiveStaffUser(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  invitation: typeof staffInvitations.$inferSelect,
  input: AcceptInvitationInput,
) {
  const inactiveUser = await tx.query.users.findFirst({
    where: and(
      eq(users.email, invitation.email),
      eq(users.shopId, invitation.shopId),
      eq(users.status, 'INACTIVE'),
    ),
  })

  if (!inactiveUser) {
    return false
  }

  const name = input.name?.trim() || invitation.name
  const hashedPassword = await hashPassword(input.password)
  const credentialIssuer = createLocalAccountIssuer('credential')

  await tx
    .update(users)
    .set({
      name,
      role: invitation.role,
      status: 'ACTIVE',
      emailVerified: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, inactiveUser.id))

  const credentialAccount = await tx.query.accounts.findFirst({
    where: and(eq(accounts.userId, inactiveUser.id), eq(accounts.providerId, 'credential')),
  })

  if (credentialAccount) {
    await tx
      .update(accounts)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, credentialAccount.id))
  } else {
    await tx.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: inactiveUser.id,
      providerId: 'credential',
      issuer: credentialIssuer,
      userId: inactiveUser.id,
      password: hashedPassword,
    })
  }

  await sendReactivationVerificationEmail(inactiveUser.email, name)
  return true
}

export async function acceptInvitation(token: string, input: AcceptInvitationInput) {
  return await db.transaction(async (tx) => {
    const invitation = await tx.query.staffInvitations.findFirst({
      where: eq(staffInvitations.token, token),
    })

    if (!invitation || invitation.status !== 'pending') {
      throw new HTTPException(400, { message: 'Invalid or inactive invitation' })
    }

    if (new Date() > invitation.expiresAt) {
      await tx
        .update(staffInvitations)
        .set({ status: 'expired' })
        .where(eq(staffInvitations.id, invitation.id))
      throw new HTTPException(400, { message: 'Invitation has expired' })
    }

    const reactivated = await reactivateInactiveStaffUser(tx, invitation, input)

    if (!reactivated) {
      try {
        const createdUser = await auth.api.signUpEmail({
          body: {
            email: invitation.email,
            password: input.password,
            name: input.name?.trim() || invitation.name,
            role: invitation.role,
            shopId: invitation.shopId,
          },
        })

        if (!createdUser) {
          throw new HTTPException(400, { message: 'Failed to create staff account' })
        }
      } catch (err: unknown) {
        if (err instanceof HTTPException) throw err
        const errorMessage = err instanceof Error ? err.message : 'Unable to create user account'
        throw new HTTPException(400, { message: errorMessage })
      }
    }

    await tx
      .update(staffInvitations)
      .set({ status: 'accepted' })
      .where(eq(staffInvitations.id, invitation.id))

    return { success: true, email: invitation.email }
  })
}
