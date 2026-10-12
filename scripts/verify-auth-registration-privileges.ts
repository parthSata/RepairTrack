/**
 * Verification script to exercise and prove all 4 security & functional invariants:
 * 1. Normal sign-up creates a brand-new shop and an OWNER with emailVerified: false.
 * 2. Sign-up with client-supplied role/shopId/status cannot hijack another shop or elevate privileges.
 * 3. Email/password invite acceptance creates the invited role in the invited shop.
 * 4. Google invite logic path validates pending invitation and binds invited role and shop.
 *
 * Run: bun run scripts/verify-auth-registration-privileges.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { and, eq } from 'drizzle-orm'
import { auth } from '../src/server/auth'
import { db } from '../src/server/db'
import { accounts, sessions, shops, users, verifications } from '../src/server/db/schema/users'
import { staffInvitations } from '../src/server/db/schema/staff-invitations'
import { acceptInvitation } from '../src/server/services/staff.service'
import {
  markInvitationAccepted,
  requirePendingInvitation,
} from '../src/server/auth/invite-oauth'

async function cleanupUser(email: string, shopIdToDelete?: string) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existingUser) {
    await db.delete(sessions).where(eq(sessions.userId, existingUser.id))
    await db.delete(accounts).where(eq(accounts.userId, existingUser.id))
    await db.delete(users).where(eq(users.id, existingUser.id))
  }
  await db.delete(verifications).where(eq(verifications.identifier, email))
  if (shopIdToDelete) {
    await db.delete(shops).where(eq(shops.id, shopIdToDelete))
  }
}

async function verify() {
  console.log('\n============================================================')
  console.log('Running End-to-End Verification for Registration Privileges')
  console.log('============================================================\n')

  const results: { scenario: string; passed: boolean; details: string }[] = []

  // Ensure test emails are clean
  const emailNormal = `verify-owner-${Date.now()}@test.local`
  const emailAttacker = `verify-attacker-${Date.now()}@test.local`
  const emailInvitee = `verify-invitee-${Date.now()}@test.local`
  const emailOAuth = `verify-oauth-${Date.now()}@test.local`

  let testShopId: string | null = null
  const attackerShopId: string | null = null

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Normal sign-up creates a new shop and an OWNER
    // -------------------------------------------------------------
    console.log('[Scenario 1] Testing normal sign-up...')
    const normalSignUp = await auth.api.signUpEmail({
      body: {
        name: 'Normal Owner',
        email: emailNormal,
        password: 'Password123!',
        shopName: 'Normal Test Shop',
      } as unknown as {
        name: string
        email: string
        password: string
      },
    })

    if (!normalSignUp?.user) {
      throw new Error('Normal sign-up returned no user')
    }

    const createdOwner = await db.query.users.findFirst({
      where: eq(users.email, emailNormal),
    })
    const createdShop = createdOwner
      ? await db.query.shops.findFirst({ where: eq(shops.id, createdOwner.shopId) })
      : null

    testShopId = createdOwner?.shopId ?? null

    const s1Passed =
      Boolean(createdOwner) &&
      createdOwner?.role === 'OWNER' &&
      createdOwner?.status === 'ACTIVE' &&
      createdOwner?.emailVerified === false &&
      Boolean(createdShop) &&
      createdShop?.name === 'Normal Test Shop'

    results.push({
      scenario: '1. Normal sign-up creates new shop and OWNER (emailVerified: false)',
      passed: s1Passed,
      details: `User role: ${createdOwner?.role}, status: ${createdOwner?.status}, emailVerified: ${createdOwner?.emailVerified}, shop: "${createdShop?.name}" (${createdShop?.id})`,
    })

    // -------------------------------------------------------------
    // SCENARIO 2: Malicious sign-up cannot join another shop or set role/status
    // -------------------------------------------------------------
    console.log('[Scenario 2] Testing tamper attempt (client-supplied role, shopId, status)...')
    if (!testShopId) throw new Error('Cannot run Scenario 2 without testShopId from Scenario 1')

    let attackBlockedByInputValidation = false
    let blockReason = ''

    try {
      await auth.api.signUpEmail({
        body: {
          name: 'Attacker User',
          email: emailAttacker,
          password: 'Password123!',
          role: 'TECHNICIAN',
          shopId: testShopId,
          status: 'INACTIVE',
        } as unknown as {
          name: string
          email: string
          password: string
        },
      })
    } catch (err: unknown) {
      const apiErr = err as { body?: { code?: string; message?: string }; message?: string }
      if (apiErr?.body?.code === 'FIELD_NOT_ALLOWED' || apiErr?.message?.includes('not allowed')) {
        attackBlockedByInputValidation = true
        blockReason = apiErr.body?.message || apiErr.message || 'FIELD_NOT_ALLOWED'
      } else {
        throw err
      }
    }

    // Verify attacker did NOT join the victim shop in the database
    const attackerInVictimShop = await db.query.users.findFirst({
      where: and(eq(users.email, emailAttacker), eq(users.shopId, testShopId)),
    })

    const s2Passed = attackBlockedByInputValidation && !attackerInVictimShop

    results.push({
      scenario: '2. Sign-up with role/shopId/status cannot hijack victim shop (blocked with FIELD_NOT_ALLOWED)',
      passed: s2Passed,
      details: `Input blocked: ${attackBlockedByInputValidation} (${blockReason}). Attacker in victim shop: ${Boolean(attackerInVictimShop)}`,
    })

    // -------------------------------------------------------------
    // SCENARIO 3: Email/password invite acceptance creates invited role in invited shop
    // -------------------------------------------------------------
    console.log('[Scenario 3] Testing email/password invite acceptance...')
    const inviteToken = `test-inv-token-${Date.now()}`
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await db.insert(staffInvitations).values({
      shopId: testShopId,
      email: emailInvitee,
      name: 'Bob Technician',
      role: 'TECHNICIAN',
      token: inviteToken,
      status: 'pending',
      invitedBy: createdOwner!.id,
      expiresAt,
    })

    const acceptResult = await acceptInvitation(inviteToken, {
      name: 'Bob Technician',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    })

    const createdStaffUser = await db.query.users.findFirst({
      where: eq(users.email, emailInvitee),
    })
    const updatedInvite = await db.query.staffInvitations.findFirst({
      where: eq(staffInvitations.token, inviteToken),
    })

    const s3Passed =
      Boolean(acceptResult?.success) &&
      Boolean(createdStaffUser) &&
      createdStaffUser?.shopId === testShopId && // Successfully joined invited shop
      createdStaffUser?.role === 'TECHNICIAN' && // Assigned invited role
      createdStaffUser?.status === 'ACTIVE' &&
      updatedInvite?.status === 'accepted'

    results.push({
      scenario: '3. Email/password invite acceptance binds to invited shop and role',
      passed: s3Passed,
      details: `Staff role: ${createdStaffUser?.role}, shopId: ${createdStaffUser?.shopId} (matches inviter shop: ${createdStaffUser?.shopId === testShopId}), invite status: ${updatedInvite?.status}`,
    })

    // -------------------------------------------------------------
    // SCENARIO 4: Google OAuth invite validation path
    // -------------------------------------------------------------
    console.log('[Scenario 4] Testing Google OAuth invite validation functions...')
    const oauthToken = `test-oauth-token-${Date.now()}`
    await db.insert(staffInvitations).values({
      shopId: testShopId,
      email: emailOAuth,
      name: 'OAuth Staff',
      role: 'STAFF',
      token: oauthToken,
      status: 'pending',
      invitedBy: createdOwner!.id,
      expiresAt,
    })

    const resolvedInvitation = await requirePendingInvitation(oauthToken, emailOAuth)
    await markInvitationAccepted(oauthToken)
    const updatedOAuthInvite = await db.query.staffInvitations.findFirst({
      where: eq(staffInvitations.token, oauthToken),
    })

    const s4Passed =
      resolvedInvitation.role === 'STAFF' &&
      resolvedInvitation.shopId === testShopId &&
      updatedOAuthInvite?.status === 'accepted'

    results.push({
      scenario: '4. Google invite validation path (requirePendingInvitation & markInvitationAccepted)',
      passed: s4Passed,
      details: `Resolved role: ${resolvedInvitation.role}, resolved shopId: ${resolvedInvitation.shopId}, final status: ${updatedOAuthInvite?.status}`,
    })
  } finally {
    // Clean up test data in correct foreign-key order
    console.log('\nCleaning up test artifacts...')
    await db.delete(staffInvitations).where(eq(staffInvitations.email, emailInvitee))
    await db.delete(staffInvitations).where(eq(staffInvitations.email, emailOAuth))
    await cleanupUser(emailInvitee)
    await cleanupUser(emailOAuth)
    await cleanupUser(emailAttacker, attackerShopId ?? undefined)
    await cleanupUser(emailNormal, testShopId ?? undefined)
  }

  console.log('\n--- Verification Results ---')
  let allOk = true
  for (const r of results) {
    const mark = r.passed ? '✔ PASS' : '✖ FAIL'
    console.log(`${mark}: ${r.scenario}`)
    console.log(`   Details: ${r.details}\n`)
    if (!r.passed) allOk = false
  }

  if (allOk) {
    console.log('✔ All 4 verification scenarios passed completely!')
    process.exit(0)
  } else {
    console.error('✖ Some verification scenarios failed.')
    process.exit(1)
  }
}

verify().catch((err) => {
  console.error('Verification script failed:', err)
  process.exit(1)
})
