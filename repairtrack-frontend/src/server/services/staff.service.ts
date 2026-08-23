import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { staffInvitations, users } from '@/server/db/schema'
import type { AcceptInvitationInput, InviteStaffInput } from '@/features/staff/schemas'

export async function inviteStaff(shopId: string, invitedBy: string, input: InviteStaffInput) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.insert(staffInvitations).values({
    shopId,
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    token,
    status: 'pending',
    invitedBy,
    expiresAt,
  })

  return {
    token,
    inviteLink: `/invite/${token}`,
    expiresAt: expiresAt.toISOString(),
  }
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

      await tx
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.email, invitation.email.toLowerCase()))
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
