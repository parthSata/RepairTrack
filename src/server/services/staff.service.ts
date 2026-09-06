import { and, eq, inArray, sql } from 'drizzle-orm'
import { createLocalAccountIssuer } from '@better-auth/core/db'
import { hashPassword } from 'better-auth/crypto'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { accounts, shops, staffInvitations, users } from '@/server/db/schema'
import { devices, repairs } from '@/server/db/schema/repairs'
import { repairAssignments } from '@/server/db/schema/repair-assignments'
import type {
  AcceptInvitationInput,
  ChangeStaffRoleInput,
  InvitationDetails,
  InviteStaffInput,
  UnifiedStaffMember,
} from '@/features/staff/schemas'
import { sendEmail } from '@/server/services/gmail.service'
import { buildStaffInvitationEmailHtml, buildVerificationEmailHtml } from '@/server/services/email-templates'
import {
  NON_TERMINAL_REPAIR_STATUSES,
  syncAssignmentOnReassign,
} from '@/server/services/repair-assignment.helpers'

const INVITE_TTL_MS = 10 * 60 * 1000

async function getAssignmentCountsByTechnicianStatus(
  shopId: string,
  assignmentStatus: 'ACTIVE' | 'ON_HOLD',
) {
  const rows = await db
    .select({
      technicianId: repairAssignments.technicianId,
      count: sql<number>`count(*)::int`,
    })
    .from(repairAssignments)
    .innerJoin(repairs, eq(repairs.id, repairAssignments.repairId))
    .where(
      and(
        eq(repairAssignments.shopId, shopId),
        eq(repairAssignments.status, assignmentStatus),
        inArray(repairs.status, [...NON_TERMINAL_REPAIR_STATUSES]),
      ),
    )
    .groupBy(repairAssignments.technicianId)

  return new Map(rows.map((row) => [row.technicianId, row.count]))
}

function mapAssignmentPreview(
  row: {
    assignmentId: string
    repairId: string
    ticketNumber: string
    brand: string | null
    model: string | null
    heldAt?: Date | null
    heldReason?: string | null
  },
  includeHoldMeta = false,
): StaffAssignmentPreview {
  return {
    assignmentId: row.assignmentId,
    repairId: row.repairId,
    ticketNumber: row.ticketNumber,
    deviceLabel: [row.brand, row.model].filter(Boolean).join(' ') || 'Unknown device',
    heldAt: includeHoldMeta ? row.heldAt?.toISOString() ?? null : undefined,
    heldReason: includeHoldMeta ? row.heldReason ?? null : undefined,
  }
}

export async function getTechnicians(shopId: string) {
  const [techs, activeCounts] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        and(eq(users.shopId, shopId), eq(users.role, 'TECHNICIAN'), eq(users.status, 'ACTIVE')),
      ),
    getAssignmentCountsByTechnicianStatus(shopId, 'ACTIVE'),
  ])

  return techs.map((tech) => ({
    ...tech,
    activeRepairCount: activeCounts.get(tech.id) ?? 0,
  }))
}

export type StaffAssignmentPreview = {
  assignmentId: string
  repairId: string
  ticketNumber: string
  deviceLabel: string
  heldAt?: string | null
  heldReason?: string | null
}

async function getActiveAssignmentsForTechnician(shopId: string, technicianId: string) {
  const rows = await db
    .select({
      assignmentId: repairAssignments.id,
      repairId: repairs.id,
      ticketNumber: repairs.ticketNumber,
      brand: devices.brand,
      model: devices.model,
    })
    .from(repairAssignments)
    .innerJoin(repairs, eq(repairs.id, repairAssignments.repairId))
    .leftJoin(devices, eq(devices.id, repairs.deviceId))
    .where(
      and(
        eq(repairAssignments.shopId, shopId),
        eq(repairAssignments.technicianId, technicianId),
        eq(repairAssignments.status, 'ACTIVE'),
        inArray(repairs.status, [...NON_TERMINAL_REPAIR_STATUSES]),
      ),
    )

  return rows.map((row) => mapAssignmentPreview(row)) satisfies StaffAssignmentPreview[]
}

export async function getStaffActiveAssignments(shopId: string, technicianId: string) {
  return getActiveAssignmentsForTechnician(shopId, technicianId)
}

export async function getStaffHeldAssignments(shopId: string, technicianId: string) {
  const rows = await db
    .select({
      assignmentId: repairAssignments.id,
      repairId: repairs.id,
      ticketNumber: repairs.ticketNumber,
      brand: devices.brand,
      model: devices.model,
      heldAt: repairAssignments.heldAt,
      heldReason: repairAssignments.heldReason,
    })
    .from(repairAssignments)
    .innerJoin(repairs, eq(repairs.id, repairAssignments.repairId))
    .leftJoin(devices, eq(devices.id, repairs.deviceId))
    .where(
      and(
        eq(repairAssignments.shopId, shopId),
        eq(repairAssignments.technicianId, technicianId),
        eq(repairAssignments.status, 'ON_HOLD'),
        inArray(repairs.status, [...NON_TERMINAL_REPAIR_STATUSES]),
      ),
    )

  return rows.map((row) => mapAssignmentPreview(row, true)) satisfies StaffAssignmentPreview[]
}

export async function countHeldAssignments(shopId: string, technicianId: string) {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(repairAssignments)
    .innerJoin(repairs, eq(repairs.id, repairAssignments.repairId))
    .where(
      and(
        eq(repairAssignments.shopId, shopId),
        eq(repairAssignments.technicianId, technicianId),
        eq(repairAssignments.status, 'ON_HOLD'),
        inArray(repairs.status, [...NON_TERMINAL_REPAIR_STATUSES]),
      ),
    )
  return row?.value ?? 0
}

export async function resumeHeldAssignments(
  shopId: string,
  technicianId: string,
  assignmentIds: string[],
) {
  if (assignmentIds.length === 0) {
    throw new HTTPException(400, { message: 'Select at least one assignment to resume' })
  }

  const [tech] = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(and(eq(users.id, technicianId), eq(users.shopId, shopId)))
    .limit(1)

  if (!tech || tech.role !== 'TECHNICIAN' || tech.status !== 'ACTIVE') {
    throw new HTTPException(400, {
      message: 'Held assignments can only be resumed when the user is an active Technician',
    })
  }

  const now = new Date()
  const result = await db.transaction(async (tx) => {
    const held = await tx
      .select({ id: repairAssignments.id })
      .from(repairAssignments)
      .innerJoin(repairs, eq(repairs.id, repairAssignments.repairId))
      .where(
        and(
          eq(repairAssignments.shopId, shopId),
          eq(repairAssignments.technicianId, technicianId),
          eq(repairAssignments.status, 'ON_HOLD'),
          inArray(repairAssignments.id, assignmentIds),
          inArray(repairs.status, [...NON_TERMINAL_REPAIR_STATUSES]),
        ),
      )

    if (held.length !== assignmentIds.length) {
      throw new HTTPException(400, {
        message: 'One or more selected assignments are not held for this technician',
      })
    }

    await tx
      .update(repairAssignments)
      .set({
        status: 'ACTIVE',
        updatedAt: now,
        // held_at / held_reason kept as history
      })
      .where(
        and(
          eq(repairAssignments.shopId, shopId),
          inArray(
            repairAssignments.id,
            held.map((h) => h.id),
          ),
        ),
      )

    return { resumedCount: held.length }
  })

  return result
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
  const [staffUsers, pendingInvitations, heldCounts] = await Promise.all([
    db
      .select()
      .from(users)
      .where(and(eq(users.shopId, shopId), inArray(users.role, ['STAFF', 'TECHNICIAN']))),
    db
      .select()
      .from(staffInvitations)
      .where(and(eq(staffInvitations.shopId, shopId), eq(staffInvitations.status, 'pending'))),
    getAssignmentCountsByTechnicianStatus(shopId, 'ON_HOLD'),
  ])

  const now = new Date()

  const userItems: UnifiedStaffMember[] = staffUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as 'STAFF' | 'TECHNICIAN',
      status: (u.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
      isInvitation: false,
      createdAt: u.createdAt.toISOString(),
      heldAssignmentCount: u.role === 'TECHNICIAN' ? (heldCounts.get(u.id) ?? 0) : 0,
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

export async function changeStaffRole(
  shopId: string,
  targetId: string,
  input: ChangeStaffRoleInput,
  actorId: string,
) {
  const newRole = input.role

  const existingUser = await db
    .select()
    .from(users)
    .where(and(eq(users.id, targetId), eq(users.shopId, shopId), inArray(users.role, ['STAFF', 'TECHNICIAN'])))
    .limit(1)

  if (existingUser[0]) {
    const user = existingUser[0]
    const previousRole = user.role

    // Demotion from TECHNICIAN: handle active assignments before committing role
    if (previousRole === 'TECHNICIAN' && newRole !== 'TECHNICIAN') {
      const active = await getActiveAssignmentsForTechnician(shopId, targetId)

      if (active.length > 0) {
        if (!input.assignmentAction) {
          throw new HTTPException(409, {
            message: 'Active repair assignments must be held or reassigned before changing role',
            cause: { code: 'ASSIGNMENTS_REQUIRE_ACTION', assignments: active },
          })
        }

        if (input.assignmentAction === 'HOLD') {
          const now = new Date()
          const heldReason = `Technician role changed to ${newRole}`
          await db.transaction(async (tx) => {
            await tx
              .update(repairAssignments)
              .set({
                status: 'ON_HOLD',
                heldAt: now,
                heldReason,
                updatedAt: now,
              })
              .where(
                and(
                  eq(repairAssignments.shopId, shopId),
                  eq(repairAssignments.technicianId, targetId),
                  eq(repairAssignments.status, 'ACTIVE'),
                  inArray(
                    repairAssignments.repairId,
                    active.map((a) => a.repairId),
                  ),
                ),
              )

            await tx
              .update(users)
              .set({ role: newRole, updatedAt: now })
              .where(and(eq(users.id, targetId), eq(users.shopId, shopId)))
          })

          return {
            success: true,
            id: targetId,
            role: newRole,
            isInvitation: false,
            assignmentAction: 'HOLD' as const,
            affectedCount: active.length,
            heldAssignmentCount: 0,
          }
        }

        // REASSIGN
        const reassignments = input.reassignments ?? []
        if (reassignments.length !== active.length) {
          throw new HTTPException(400, {
            message: 'Every active repair must be reassigned to a technician',
          })
        }

        const repairIds = new Set(active.map((a) => a.repairId))
        for (const item of reassignments) {
          if (!repairIds.has(item.repairId)) {
            throw new HTTPException(400, { message: 'Invalid repair in reassignment list' })
          }
          if (item.technicianId === targetId) {
            throw new HTTPException(400, {
              message: 'Cannot reassign a repair to the technician whose role is changing',
            })
          }
        }

        const targetTechIds = [...new Set(reassignments.map((r) => r.technicianId))]
        const validTechs = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.shopId, shopId),
              eq(users.role, 'TECHNICIAN'),
              eq(users.status, 'ACTIVE'),
              inArray(users.id, targetTechIds),
            ),
          )
        if (validTechs.length !== targetTechIds.length) {
          throw new HTTPException(400, {
            message: 'One or more target users are not active Technicians in your shop',
          })
        }

        const now = new Date()
        await db.transaction(async (tx) => {
          for (const item of reassignments) {
            await syncAssignmentOnReassign(tx, {
              shopId,
              repairId: item.repairId,
              technicianId: item.technicianId,
              createdBy: actorId,
            })
            await tx
              .update(repairs)
              .set({ assignedTechnicianId: item.technicianId, updatedAt: now })
              .where(and(eq(repairs.id, item.repairId), eq(repairs.shopId, shopId)))
          }

          await tx
            .update(users)
            .set({ role: newRole, updatedAt: now })
            .where(and(eq(users.id, targetId), eq(users.shopId, shopId)))
        })

        return {
          success: true,
          id: targetId,
          role: newRole,
          isInvitation: false,
          assignmentAction: 'REASSIGN' as const,
          affectedCount: active.length,
          heldAssignmentCount: 0,
        }
      }
    }

    await db
      .update(users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(and(eq(users.id, targetId), eq(users.shopId, shopId)))

    const heldAssignmentCount =
      newRole === 'TECHNICIAN' ? await countHeldAssignments(shopId, targetId) : 0

    return {
      success: true,
      id: targetId,
      role: newRole,
      isInvitation: false,
      heldAssignmentCount,
    }
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

    return { success: true, id: targetId, role: newRole, isInvitation: true, heldAssignmentCount: 0 }
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
