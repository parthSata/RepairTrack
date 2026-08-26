import { and, eq, inArray } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { shops, staffInvitations, users } from '@/server/db/schema'
import type { AcceptInvitationInput, InviteStaffInput, UnifiedStaffMember } from '@/features/staff/schemas'
import { sendEmail } from '@/server/services/gmail.service'
import { buildStaffInvitationEmailHtml } from '@/server/services/email-templates'

export async function inviteStaff(shopId: string, invitedBy: string, input: InviteStaffInput) {
  const targetEmail = input.email.trim().toLowerCase()

  // 1. Owner cannot invite their own email address
  const inviter = await db.query.users.findFirst({
    where: eq(users.id, invitedBy),
  })
  if (inviter && inviter.email.toLowerCase() === targetEmail) {
    throw new HTTPException(400, { message: 'You cannot send an invitation to your own email address' })
  }

  // 2. Cannot invite an email address that already belongs to a registered user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, targetEmail),
  })
  if (existingUser) {
    throw new HTTPException(400, { message: 'A user with this email address already exists' })
  }

  // 3. Cannot send duplicate invitation to an email that already has a pending invite
  const existingInvite = await db.query.staffInvitations.findFirst({
    where: and(eq(staffInvitations.email, targetEmail), eq(staffInvitations.status, 'pending')),
  })
  if (existingInvite) {
    throw new HTTPException(400, { message: 'An active invitation has already been sent to this email address' })
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, shopId),
  })

  const shopName = shop?.name ?? 'RepairTrack Shop'
  const inviterName = inviter?.name ?? 'Shop Owner'

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

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
    status: 'INVITED',
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
    .where(and(eq(staffInvitations.id, targetId), eq(staffInvitations.shopId, shopId), eq(staffInvitations.status, 'pending')))
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

export async function getInvitationByToken(token: string) {
  const invitation = await db.query.staffInvitations.findFirst({
    where: eq(staffInvitations.token, token),
    with: {
      shop: true,
    },
  })

  if (!invitation || invitation.status !== 'pending') {
    return null
  }

  if (new Date() > invitation.expiresAt) {
    await db
      .update(staffInvitations)
      .set({ status: 'expired' })
      .where(eq(staffInvitations.id, invitation.id))
    return null
  }

  return {
    name: invitation.name,
    email: invitation.email,
    role: invitation.role,
    shopName: invitation.shop?.name ?? 'Repair Shop',
    expiresAt: invitation.expiresAt.toISOString(),
  }
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

    await tx
      .update(staffInvitations)
      .set({ status: 'accepted' })
      .where(eq(staffInvitations.id, invitation.id))

    return { success: true, email: invitation.email }
  })
}

