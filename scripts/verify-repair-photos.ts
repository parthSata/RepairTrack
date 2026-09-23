import { and, eq, inArray } from 'drizzle-orm'
import { config } from 'dotenv'
import { db } from '@/server/db'
import { repairPhotos, repairs } from '@/server/db/schema/repairs'
import { users } from '@/server/db/schema/users'
import {
  canHideRepairPhotos,
  canMutateRepairPhotos,
  isRepairPhotosCustomerVisible,
} from '@/features/repairs/photos/visibility'
import {
  confirmRepairPhoto,
  deleteRepairPhoto,
  getPublicRepairPhotos,
  requestRepairPhotoUploadUrl,
  setRepairPhotosVisibility,
} from '@/server/services/repair-photo.service'
import { repairPhotoPublicId } from '@/server/storage/cloudinary'

config({ path: '.env.local' })

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function getFixture() {
  const [row] = await db
    .select({
      repairId: repairs.id,
      shopId: repairs.shopId,
      status: repairs.status,
      assignedTechnicianId: repairs.assignedTechnicianId,
    })
    .from(repairs)
    .where(eq(repairs.status, 'IN_REPAIR'))
    .limit(1)

  if (!row) {
    const [anyRepair] = await db
      .select({
        repairId: repairs.id,
        shopId: repairs.shopId,
        status: repairs.status,
        assignedTechnicianId: repairs.assignedTechnicianId,
      })
      .from(repairs)
      .limit(1)
    if (!anyRepair) throw new Error('No repair found for photo verification')
    return anyRepair
  }
  return row
}

async function getShopUsers(shopId: string) {
  const rows = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(eq(users.shopId, shopId), inArray(users.role, ['OWNER', 'STAFF', 'TECHNICIAN'])))

  const owner = rows.find((r) => r.role === 'OWNER')
  const staff = rows.find((r) => r.role === 'STAFF')
  const technician = rows.find((r) => r.role === 'TECHNICIAN')
  if (!owner) throw new Error('No OWNER user in shop for photo verification')
  return { owner, staff, technician }
}

async function main() {
  console.log('Verifying repair photo visibility helpers...')

  assert(
    isRepairPhotosCustomerVisible({
      status: 'READY_FOR_PICKUP',
      customerPhotosHidden: false,
      hasBefore: true,
      hasAfter: true,
    }),
    'READY_FOR_PICKUP with both photos should be customer-visible',
  )
  assert(
    !isRepairPhotosCustomerVisible({
      status: 'IN_REPAIR',
      customerPhotosHidden: false,
      hasBefore: true,
      hasAfter: true,
    }),
    'IN_REPAIR should stay internal',
  )
  assert(
    !isRepairPhotosCustomerVisible({
      status: 'READY_FOR_PICKUP',
      customerPhotosHidden: true,
      hasBefore: true,
      hasAfter: true,
    }),
    'Hidden override must block customer visibility',
  )
  assert(
    canMutateRepairPhotos({ userRole: 'TECHNICIAN', isCustomerVisible: false }),
    'Technician may mutate while internal',
  )
  assert(
    !canMutateRepairPhotos({ userRole: 'TECHNICIAN', isCustomerVisible: true }),
    'Technician must not mutate while customer-visible',
  )
  assert(
    canMutateRepairPhotos({ userRole: 'STAFF', isCustomerVisible: true }),
    'Staff may mutate while customer-visible',
  )
  assert(canHideRepairPhotos('OWNER') && canHideRepairPhotos('STAFF'), 'Owner/Staff can hide')
  assert(!canHideRepairPhotos('TECHNICIAN'), 'Technician cannot hide')
  console.log('Test A passed: visibility + permission helpers')

  const fixture = await getFixture()
  const { owner, staff, technician } = await getShopUsers(fixture.shopId)

  const assignedTechId = fixture.assignedTechnicianId ?? technician?.id
  if (!assignedTechId) {
    console.log('Test B skipped: no technician available to assign for mutation tests')
  } else {
    // Ensure repair is assigned for technician scope
    if (fixture.assignedTechnicianId !== assignedTechId) {
      await db
        .update(repairs)
        .set({ assignedTechnicianId: assignedTechId, updatedAt: new Date() })
        .where(eq(repairs.id, fixture.repairId))
    }

    // Force internal status for tech mutate test
    await db
      .update(repairs)
      .set({
        status: 'IN_REPAIR',
        customerPhotosHidden: false,
        updatedAt: new Date(),
      })
      .where(eq(repairs.id, fixture.repairId))

    await db
      .delete(repairPhotos)
      .where(and(eq(repairPhotos.shopId, fixture.shopId), eq(repairPhotos.repairId, fixture.repairId)))

    const actor = {
      shopId: fixture.shopId,
      userRole: 'TECHNICIAN',
      userId: assignedTechId,
      repairId: fixture.repairId,
    }

    const upload = await requestRepairPhotoUploadUrl(actor, {
      type: 'BEFORE',
      size: 1024,
    })
    assert(
      upload.publicId === repairPhotoPublicId(fixture.shopId, fixture.repairId, 'BEFORE'),
      'Upload public_id must use stable folder slot',
    )

    await confirmRepairPhoto(actor, { type: 'BEFORE', publicId: upload.publicId })
    await confirmRepairPhoto(actor, {
      type: 'AFTER',
      publicId: repairPhotoPublicId(fixture.shopId, fixture.repairId, 'AFTER'),
    })

    let publicPhotos = await getPublicRepairPhotos(fixture.shopId, fixture.repairId, 'IN_REPAIR')
    assert(publicPhotos === null, 'Public tracking must omit photos while internal')

    await db
      .update(repairs)
      .set({ status: 'READY_FOR_PICKUP', updatedAt: new Date() })
      .where(eq(repairs.id, fixture.repairId))

    publicPhotos = await getPublicRepairPhotos(fixture.shopId, fixture.repairId, 'READY_FOR_PICKUP')
    assert(publicPhotos?.beforeUrl && publicPhotos?.afterUrl, 'Public photos appear at READY_FOR_PICKUP')

    // Technician blocked while customer-visible
    let techBlocked = false
    try {
      await deleteRepairPhoto(actor, 'BEFORE')
    } catch (error) {
      techBlocked = error instanceof Error && 'status' in error && (error as { status: number }).status === 403
    }
    assert(techBlocked, 'Technician delete must be forbidden when customer-visible')

    const staffActor = {
      shopId: fixture.shopId,
      userRole: staff?.role ?? 'OWNER',
      userId: staff?.id ?? owner.id,
      repairId: fixture.repairId,
    }
    await setRepairPhotosVisibility(staffActor, true)
    publicPhotos = await getPublicRepairPhotos(fixture.shopId, fixture.repairId, 'READY_FOR_PICKUP')
    assert(publicPhotos === null, 'Hide must remove photos from public tracking')

    await setRepairPhotosVisibility(staffActor, false)
    await deleteRepairPhoto(staffActor, 'BEFORE')
    await deleteRepairPhoto(staffActor, 'AFTER')

    console.log('Test B passed: upload slots, visibility lock, hide, staff delete')
  }

  console.log('All repair photo verification checks passed.')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
