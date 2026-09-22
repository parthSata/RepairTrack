import { and, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import {
  canHideRepairPhotos,
  canMutateRepairPhotos,
  isRepairPhotosCustomerVisible,
} from '@/features/repairs/photos/visibility'
import type { RepairPhotoType } from '@/features/repairs/photos/schemas'
import { db } from '@/server/db'
import { repairPhotos, repairs } from '@/server/db/schema/repairs'
import {
  cloudinaryPublicUrl,
  createRepairPhotoUploadData,
  deleteObject,
  MAX_UPLOAD_SIZE,
  repairPhotoPublicId,
} from '@/server/storage/cloudinary'

type Actor = {
  shopId: string
  userRole: string
  userId: string
  repairId: string
}

async function loadRepairForPhotos(actor: Actor) {
  const [repair] = await db
    .select({
      id: repairs.id,
      shopId: repairs.shopId,
      status: repairs.status,
      assignedTechnicianId: repairs.assignedTechnicianId,
      customerPhotosHidden: repairs.customerPhotosHidden,
    })
    .from(repairs)
    .where(and(eq(repairs.id, actor.repairId), eq(repairs.shopId, actor.shopId)))
    .limit(1)

  if (!repair) throw new HTTPException(404, { message: 'Repair ticket not found' })

  if (actor.userRole === 'TECHNICIAN' && repair.assignedTechnicianId !== actor.userId) {
    throw new HTTPException(403, { message: 'Not authorized to access this repair' })
  }

  return repair
}

async function listPhotoRows(shopId: string, repairId: string) {
  return db
    .select({
      id: repairPhotos.id,
      type: repairPhotos.type,
      cloudinaryPublicId: repairPhotos.cloudinaryPublicId,
      uploadedBy: repairPhotos.uploadedBy,
      createdAt: repairPhotos.createdAt,
      updatedAt: repairPhotos.updatedAt,
    })
    .from(repairPhotos)
    .where(and(eq(repairPhotos.shopId, shopId), eq(repairPhotos.repairId, repairId)))
}

export function mapRepairPhotosPayload(
  repair: {
    status: string
    customerPhotosHidden: boolean
  },
  rows: Awaited<ReturnType<typeof listPhotoRows>>,
) {
  const before = rows.find((row) => row.type === 'BEFORE') ?? null
  const after = rows.find((row) => row.type === 'AFTER') ?? null
  const customerVisible = isRepairPhotosCustomerVisible({
    status: repair.status,
    customerPhotosHidden: repair.customerPhotosHidden,
    hasBefore: Boolean(before),
    hasAfter: Boolean(after),
  })

  const toPhoto = (row: (typeof rows)[number] | null) =>
    row
      ? {
          id: row.id,
          type: row.type,
          publicId: row.cloudinaryPublicId,
          url: cloudinaryPublicUrl(row.cloudinaryPublicId),
          uploadedBy: row.uploadedBy,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }
      : null

  return {
    customerPhotosHidden: repair.customerPhotosHidden,
    customerVisible,
    canMutate: false as boolean,
    canHide: false as boolean,
    before: toPhoto(before),
    after: toPhoto(after),
  }
}

export async function getRepairPhotosForDetail(actor: Actor) {
  const repair = await loadRepairForPhotos(actor)
  const rows = await listPhotoRows(actor.shopId, actor.repairId)
  const payload = mapRepairPhotosPayload(repair, rows)
  const customerVisible = payload.customerVisible
  return {
    ...payload,
    canMutate: canMutateRepairPhotos({ userRole: actor.userRole, isCustomerVisible: customerVisible }),
    canHide: canHideRepairPhotos(actor.userRole),
  }
}

export async function requestRepairPhotoUploadUrl(
  actor: Actor,
  input: { type: RepairPhotoType; size: number },
) {
  if (input.size > MAX_UPLOAD_SIZE) {
    throw new HTTPException(413, { message: 'Image is too large (max 5MB)' })
  }

  const repair = await loadRepairForPhotos(actor)
  const rows = await listPhotoRows(actor.shopId, actor.repairId)
  const customerVisible = isRepairPhotosCustomerVisible({
    status: repair.status,
    customerPhotosHidden: repair.customerPhotosHidden,
    hasBefore: rows.some((r) => r.type === 'BEFORE'),
    hasAfter: rows.some((r) => r.type === 'AFTER'),
  })

  if (!canMutateRepairPhotos({ userRole: actor.userRole, isCustomerVisible: customerVisible })) {
    throw new HTTPException(403, {
      message: customerVisible
        ? 'Photos are customer-visible. Ask staff or owner to replace them.'
        : 'Not authorized to upload repair photos',
    })
  }

  const upload = createRepairPhotoUploadData(actor.shopId, actor.repairId, input.type)
  return {
    ...upload,
    key: upload.publicId,
    previewUrl: cloudinaryPublicUrl(upload.publicId),
  }
}

export async function confirmRepairPhoto(
  actor: Actor,
  input: { type: RepairPhotoType; publicId: string },
) {
  const repair = await loadRepairForPhotos(actor)
  const rows = await listPhotoRows(actor.shopId, actor.repairId)
  const customerVisible = isRepairPhotosCustomerVisible({
    status: repair.status,
    customerPhotosHidden: repair.customerPhotosHidden,
    hasBefore: rows.some((r) => r.type === 'BEFORE'),
    hasAfter: rows.some((r) => r.type === 'AFTER'),
  })

  if (!canMutateRepairPhotos({ userRole: actor.userRole, isCustomerVisible: customerVisible })) {
    throw new HTTPException(403, {
      message: customerVisible
        ? 'Photos are customer-visible. Ask staff or owner to replace them.'
        : 'Not authorized to save repair photos',
    })
  }

  const expectedPublicId = repairPhotoPublicId(actor.shopId, actor.repairId, input.type)
  if (input.publicId !== expectedPublicId) {
    throw new HTTPException(400, { message: 'Invalid photo upload key' })
  }

  const existing = rows.find((row) => row.type === input.type)
  const now = new Date()

  if (existing) {
    await db
      .update(repairPhotos)
      .set({
        cloudinaryPublicId: expectedPublicId,
        uploadedBy: actor.userId,
        updatedAt: now,
      })
      .where(and(eq(repairPhotos.id, existing.id), eq(repairPhotos.shopId, actor.shopId)))
  } else {
    await db.insert(repairPhotos).values({
      id: crypto.randomUUID(),
      shopId: actor.shopId,
      repairId: actor.repairId,
      type: input.type,
      cloudinaryPublicId: expectedPublicId,
      uploadedBy: actor.userId,
      createdAt: now,
      updatedAt: now,
    })
  }

  return getRepairPhotosForDetail(actor)
}

export async function deleteRepairPhoto(actor: Actor, type: RepairPhotoType) {
  const repair = await loadRepairForPhotos(actor)
  const rows = await listPhotoRows(actor.shopId, actor.repairId)
  const customerVisible = isRepairPhotosCustomerVisible({
    status: repair.status,
    customerPhotosHidden: repair.customerPhotosHidden,
    hasBefore: rows.some((r) => r.type === 'BEFORE'),
    hasAfter: rows.some((r) => r.type === 'AFTER'),
  })

  if (!canMutateRepairPhotos({ userRole: actor.userRole, isCustomerVisible: customerVisible })) {
    throw new HTTPException(403, {
      message: customerVisible
        ? 'Photos are customer-visible. Ask staff or owner to delete them.'
        : 'Not authorized to delete repair photos',
    })
  }

  const existing = rows.find((row) => row.type === type)
  if (!existing) throw new HTTPException(404, { message: 'Photo not found' })

  await db
    .delete(repairPhotos)
    .where(and(eq(repairPhotos.id, existing.id), eq(repairPhotos.shopId, actor.shopId)))

  try {
    await deleteObject(existing.cloudinaryPublicId)
  } catch {
    // DB row already removed; Cloudinary orphan is acceptable if destroy fails once
  }

  return getRepairPhotosForDetail(actor)
}

export async function setRepairPhotosVisibility(actor: Actor, hidden: boolean) {
  if (!canHideRepairPhotos(actor.userRole)) {
    throw new HTTPException(403, { message: 'Only staff or owner can hide photos from customers' })
  }

  await loadRepairForPhotos(actor)

  await db
    .update(repairs)
    .set({ customerPhotosHidden: hidden, updatedAt: new Date() })
    .where(and(eq(repairs.id, actor.repairId), eq(repairs.shopId, actor.shopId)))

  return getRepairPhotosForDetail(actor)
}

/** Public tracking: return CDN URLs only when auto-visible. */
export async function getPublicRepairPhotos(shopId: string, repairId: string, status: string) {
  const [repair] = await db
    .select({
      customerPhotosHidden: repairs.customerPhotosHidden,
    })
    .from(repairs)
    .where(and(eq(repairs.id, repairId), eq(repairs.shopId, shopId)))
    .limit(1)

  if (!repair) return null

  const rows = await listPhotoRows(shopId, repairId)
  const before = rows.find((row) => row.type === 'BEFORE')
  const after = rows.find((row) => row.type === 'AFTER')
  const visible = isRepairPhotosCustomerVisible({
    status,
    customerPhotosHidden: repair.customerPhotosHidden,
    hasBefore: Boolean(before),
    hasAfter: Boolean(after),
  })

  if (!visible || !before || !after) return null

  return {
    beforeUrl: cloudinaryPublicUrl(before.cloudinaryPublicId),
    afterUrl: cloudinaryPublicUrl(after.cloudinaryPublicId),
  }
}
