import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { resolveUserRole } from '@/server/lib/session-role'
import {
  addRepairNote,
  createRepairTicket,
  getRepairById,
  listRepairs,
  reassignTechnician,
  regenerateTrackingToken,
  reopenRepairTicket,
  requestCustomerApproval,
  updateDiagnosis,
  updateEstimatedCost,
  updateExpectedCompletionDate,
  updateRepairEstimatePricing,
  updateRepairFinalTotal,
  updateRepairStatus,
} from '@/server/services/repair.service'
import {
  confirmRepairPhoto,
  deleteRepairPhoto,
  requestRepairPhotoUploadUrl,
  setRepairPhotosVisibility,
} from '@/server/services/repair-photo.service'
import { getTechnicians } from '@/server/services/staff.service'
import { repairStatusEnum } from '@/server/db/schema/repairs'
import {
  addRepairPartSchema,
  createRepairSchema,
  reopenRepairSchema,
  updateEstimatedCostSchema,
  updateExpectedCompletionDateSchema,
  updateRepairPartSchema,
} from '@/features/repairs/schemas'
import { repairPricingFieldsSchema } from '@/features/repairs/pricing-schemas'
import {
  addRepairPart,
  removeRepairPart,
  updateRepairPartQuantity,
} from '@/server/services/repair-parts.service'
import {
  repairPhotoConfirmSchema,
  repairPhotoTypeValues,
  repairPhotoUploadUrlSchema,
  repairPhotoVisibilitySchema,
} from '@/features/repairs/photos/schemas'

async function requireRepairUserSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const shopId = session.user.shopId
  if (!shopId) throw new HTTPException(403, { message: 'Shop context missing' })
  const userRole = await resolveUserRole(session.user.id, session.user.role)
  return {
    session,
    shopId,
    userId: session.user.id,
    userRole,
  }
}

async function requireCreateRepairAccess(request: Request) {
  const { session, shopId, userRole } = await requireRepairUserSession(request)
  if (!['OWNER', 'STAFF'].includes(userRole)) {
    throw new HTTPException(403, { message: 'Not authorized to create repair tickets' })
  }
  return { session, shopId }
}

export const repairsRouter = new Hono()
  .get('/technicians', async (c) => {
    const { shopId } = await requireRepairUserSession(c.req.raw)
    const techs = await getTechnicians(shopId)
    return c.json(techs)
  })
  .post(
    '/',
    zValidator('json', createRepairSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { session, shopId } = await requireCreateRepairAccess(c.req.raw)
      const data = c.req.valid('json')
      const repair = await createRepairTicket({ shopId, createdBy: session.user.id, data })
      return c.json(repair, 201)
    },
  )
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        technicianId: z.string().optional(),
        assignedTechnicianId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
        overdue: z.coerce.boolean().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const query = c.req.valid('query')
      const result = await listRepairs({
        shopId,
        userRole,
        userId,
        ...query,
        technicianId: query.technicianId ?? query.assignedTechnicianId,
      })
      return c.json(result)
    },
  )
  .get('/:id', async (c) => {
    const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
    const id = c.req.param('id')
    const repair = await getRepairById({ shopId, userRole, userId, id })
    return c.json(repair)
  })
  .patch(
    '/:id/status',
    zValidator(
      'json',
      z.object({
        status: z.enum(repairStatusEnum.enumValues),
        note: z.string().optional(),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { status, note } = c.req.valid('json')

      const updated = await updateRepairStatus({
        shopId,
        userRole,
        userId,
        id,
        status,
        note,
      })
      return c.json(updated)
    },
  )
  .post(
    '/:id/request-approval',
    zValidator(
      'json',
      z.object({
        additionalEstimatedCost: z.number().min(0).max(1_000_000),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { additionalEstimatedCost } = c.req.valid('json')

      const repair = await requestCustomerApproval({
        shopId,
        userRole,
        userId,
        id,
        additionalEstimatedCostRupees: additionalEstimatedCost,
      })
      return c.json(repair)
    },
  )
  .post(
    '/:id/reopen',
    zValidator('json', reopenRepairSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { reason, action } = c.req.valid('json')

      const updated = await reopenRepairTicket({
        shopId,
        userRole,
        userId,
        id,
        reason,
        action,
      })
      return c.json(updated)
    },
  )
  .patch(
    '/:id/technician',
    zValidator(
      'json',
      z.object({
        technicianId: z.string().nullable(),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { technicianId } = c.req.valid('json')

      const updated = await reassignTechnician({
        shopId,
        userRole,
        userId,
        id,
        technicianId,
      })
      return c.json(updated)
    },
  )
  .patch(
    '/:id/diagnosis',
    zValidator(
      'json',
      z.object({
        diagnosis: z.string(),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { diagnosis } = c.req.valid('json')

      const updated = await updateDiagnosis({
        shopId,
        userRole,
        userId,
        id,
        diagnosis,
      })
      return c.json(updated)
    },
  )
  .patch(
    '/:id/estimated-cost',
    zValidator('json', updateEstimatedCostSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { estimatedCost } = c.req.valid('json')

      const updated = await updateEstimatedCost({
        shopId,
        userRole,
        userId,
        id,
        estimatedCostRupees: estimatedCost,
      })
      return c.json(updated)
    },
  )
  .patch(
    '/:id/estimate',
    zValidator('json', repairPricingFieldsSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const body = c.req.valid('json')

      const updated = await updateRepairEstimatePricing({
        shopId,
        userRole,
        userId,
        id,
        ...body,
      })
      return c.json(updated)
    },
  )
  .patch(
    '/:id/final-total',
    zValidator('json', repairPricingFieldsSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const body = c.req.valid('json')

      const updated = await updateRepairFinalTotal({
        shopId,
        userRole,
        userId,
        id,
        ...body,
      })
      return c.json(updated)
    },
  )
  .post(
    '/:id/notes',
    zValidator(
      'json',
      z.object({
        note: z.string().min(1, 'Note content is required'),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { note } = c.req.valid('json')

      const createdNote = await addRepairNote({
        shopId,
        userRole,
        userId,
        id,
        note,
      })
      return c.json(createdNote, 201)
    },
  )
  .patch(
    '/:id/expected-completion-date',
    zValidator('json', updateExpectedCompletionDateSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { expectedCompletionDate } = c.req.valid('json')

      const updated = await updateExpectedCompletionDate({
        shopId,
        userRole,
        userId,
        id,
        expectedCompletionDate,
      })
      return c.json(updated)
    },
  )
  .post('/:id/regenerate-tracking-link', async (c) => {
    const { shopId, userRole } = await requireRepairUserSession(c.req.raw)
    const id = c.req.param('id')

    const updated = await regenerateTrackingToken({
      shopId,
      userRole,
      repairId: id,
    })
    return c.json(updated)
  })
  .post(
    '/:id/photos/upload-url',
    zValidator('json', repairPhotoUploadUrlSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { type, size } = c.req.valid('json')
      const upload = await requestRepairPhotoUploadUrl(
        { shopId, userRole, userId, repairId: id },
        { type, size },
      )
      return c.json(upload)
    },
  )
  .put(
    '/:id/photos',
    zValidator('json', repairPhotoConfirmSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { type, publicId } = c.req.valid('json')
      const payload = await confirmRepairPhoto(
        { shopId, userRole, userId, repairId: id },
        { type, publicId },
      )
      return c.json(payload)
    },
  )
  .delete('/:id/photos/:type', async (c) => {
    const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
    const id = c.req.param('id')
    const typeParam = c.req.param('type').toUpperCase()
    if (!repairPhotoTypeValues.includes(typeParam as (typeof repairPhotoTypeValues)[number])) {
      throw new HTTPException(400, { message: 'Photo type must be BEFORE or AFTER' })
    }
    const payload = await deleteRepairPhoto(
      { shopId, userRole, userId, repairId: id },
      typeParam as (typeof repairPhotoTypeValues)[number],
    )
    return c.json(payload)
  })
  .patch(
    '/:id/photos/visibility',
    zValidator('json', repairPhotoVisibilitySchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { hidden } = c.req.valid('json')
      const payload = await setRepairPhotosVisibility(
        { shopId, userRole, userId, repairId: id },
        hidden,
      )
      return c.json(payload)
    },
  )
  .post(
    '/:id/parts',
    zValidator('json', addRepairPartSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { inventoryId, quantity } = c.req.valid('json')
      const part = await addRepairPart({
        shopId,
        repairId: id,
        userRole,
        userId,
        inventoryId,
        quantity,
      })
      return c.json(part, 201)
    },
  )
  .patch(
    '/:id/parts/:partRowId',
    zValidator('json', updateRepairPartSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const partRowId = c.req.param('partRowId')
      const { quantity } = c.req.valid('json')
      const part = await updateRepairPartQuantity({
        shopId,
        repairId: id,
        partRowId,
        userRole,
        userId,
        quantity,
      })
      return c.json(part)
    },
  )
  .delete('/:id/parts/:partRowId', async (c) => {
    const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
    const id = c.req.param('id')
    const partRowId = c.req.param('partRowId')
    const result = await removeRepairPart({
      shopId,
      repairId: id,
      partRowId,
      userRole,
      userId,
    })
    return c.json(result)
  })
