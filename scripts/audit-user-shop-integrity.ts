/**
 * Read-only database audit script to check user/shop integrity.
 *
 * Checks:
 * 1. Shops with more than one OWNER (indicates unintended or exploited multi-owner state).
 * 2. STAFF or TECHNICIAN users with no matching accepted staff_invitations record for their email and shop.
 *
 * Run: bun run scripts/audit-user-shop-integrity.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { eq, inArray } from 'drizzle-orm'
import { db } from '../src/server/db'
import { shops, users } from '../src/server/db/schema/users'
import { staffInvitations } from '../src/server/db/schema/staff-invitations'

interface OwnerRecord {
  userId: string
  userName: string
  userEmail: string
  userStatus: string
  createdAt: Date
  shopId: string
  shopName: string
}

interface StaffRecord {
  userId: string
  userName: string
  userEmail: string
  userRole: 'STAFF' | 'TECHNICIAN'
  userStatus: string
  createdAt: Date
  shopId: string
  shopName: string
}

async function runAudit() {
  console.log('\n============================================================')
  console.log('RepairTrack — User & Shop Authorization Integrity Audit')
  console.log('============================================================\n')

  // 1. Audit Shops for multiple OWNERs
  const allOwners = (await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userStatus: users.status,
      createdAt: users.createdAt,
      shopId: users.shopId,
      shopName: shops.name,
    })
    .from(users)
    .innerJoin(shops, eq(shops.id, users.shopId))
    .where(eq(users.role, 'OWNER'))
    .orderBy(users.shopId, users.createdAt)) as OwnerRecord[]

  const ownersByShop = new Map<string, OwnerRecord[]>()
  for (const owner of allOwners) {
    const list = ownersByShop.get(owner.shopId) ?? []
    list.push(owner)
    ownersByShop.set(owner.shopId, list)
  }

  const multiOwnerShops: { shopId: string; shopName: string; owners: OwnerRecord[] }[] = []
  for (const [shopId, owners] of ownersByShop.entries()) {
    if (owners.length > 1) {
      multiOwnerShops.push({
        shopId,
        shopName: owners[0]?.shopName ?? 'Unknown',
        owners,
      })
    }
  }

  console.log('--- 1. Multi-Owner Shop Check ---')
  if (multiOwnerShops.length === 0) {
    console.log('✔ PASS: No multi-owner shops found. Each audited shop has at most one OWNER.\n')
  } else {
    console.warn(`⚠ WARNING: Found ${multiOwnerShops.length} shop(s) with more than one OWNER:`)
    for (const shop of multiOwnerShops) {
      console.warn(`  Shop [${shop.shopId}] "${shop.shopName}" has ${shop.owners.length} owners:`)
      for (const owner of shop.owners) {
        console.warn(
          `    - User ID: ${owner.userId} | Name: ${owner.userName} | Email: ${owner.userEmail} | Status: ${owner.userStatus} | Created: ${owner.createdAt.toISOString()}`,
        )
      }
    }
    console.log()
  }

  // 2. Audit STAFF / TECHNICIAN users for accepted invitations
  const allStaffUsers = (await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      userStatus: users.status,
      createdAt: users.createdAt,
      shopId: users.shopId,
      shopName: shops.name,
    })
    .from(users)
    .innerJoin(shops, eq(shops.id, users.shopId))
    .where(inArray(users.role, ['STAFF', 'TECHNICIAN']))
    .orderBy(users.shopId, users.createdAt)) as StaffRecord[]

  const acceptedInvitations = await db
    .select({
      id: staffInvitations.id,
      shopId: staffInvitations.shopId,
      email: staffInvitations.email,
      role: staffInvitations.role,
      status: staffInvitations.status,
    })
    .from(staffInvitations)
    .where(eq(staffInvitations.status, 'accepted'))

  const uninvitedStaff: StaffRecord[] = []
  for (const staff of allStaffUsers) {
    const normalizedEmail = staff.userEmail.trim().toLowerCase()
    const hasAcceptedInvite = acceptedInvitations.some(
      (inv) => inv.shopId === staff.shopId && inv.email.trim().toLowerCase() === normalizedEmail,
    )

    if (!hasAcceptedInvite) {
      uninvitedStaff.push(staff)
    }
  }

  console.log('--- 2. Staff & Technician Invitation Integrity Check ---')
  if (uninvitedStaff.length === 0) {
    console.log('✔ PASS: All STAFF and TECHNICIAN users have a matching accepted invitation in their shop.\n')
  } else {
    console.warn(
      `⚠ WARNING: Found ${uninvitedStaff.length} STAFF/TECHNICIAN user(s) with no accepted invitation in their shop:`,
    )
    for (const staff of uninvitedStaff) {
      console.warn(
        `  - User ID: ${staff.userId} | Role: ${staff.userRole} | Email: ${staff.userEmail} | Shop: [${staff.shopId}] "${staff.shopName}" | Created: ${staff.createdAt.toISOString()}`,
      )
    }
    console.log()
  }

  // 3. Summary Statistics
  console.log('--- Audit Summary ---')
  console.log(`Total Shops Inspected:             ${ownersByShop.size}`)
  console.log(`Total OWNERs Inspected:            ${allOwners.length}`)
  console.log(`Total STAFF / TECHNICIAN Users:   ${allStaffUsers.length}`)
  console.log(`Total Accepted Invitations:       ${acceptedInvitations.length}`)
  console.log(`Multi-Owner Shop Violations:      ${multiOwnerShops.length}`)
  console.log(`Uninvited Staff Violations:        ${uninvitedStaff.length}`)
  console.log('============================================================\n')

  process.exit(0)
}

runAudit().catch((err) => {
  console.error('Audit failed with error:', err)
  process.exit(1)
})
