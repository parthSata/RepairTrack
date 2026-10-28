import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { requireRole } from '@/server/hono/session'
import {
  addRepairNote,
  confirmRepairModel,
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
import { listRepairEmails, resendRepairEmail } from '@/server/services/repair-email.service'
import { validationHook } from '@/server/hono/validation'
import {
  idAndLogIdParamSchema,
  idAndPartRowIdParamSchema,
  idAndPhotoTypeParamSchema,
  idParamSchema,
} from '@/lib/validation'
import { REPAIR_EMAIL_MESSAGES } from '@/features/emails/schemas'
import { repairStatusEnum } from '@/server/db/schema/repairs'
import {
  addRepairPartSchema,
  confirmRepairModelSchema,
  createRepairSchema,
  reopenRepairSchema,
  requestCustomerApprovalSchema,
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

const REPAIR_ROLES = ['OWNER', 'STAFF', 'TECHNICIAN'] as const
const OWNER_OR_STAFF = ['OWNER', 'STAFF'] as const

const requireRepairAccess = (request: Request) =>
  requireRole(request, REPAIR_ROLES, 'Not authorized to access repairs')

export const repairsRouter = new Hono()
  .get('/technicians', async (c) => {
    const { shopId } = await requireRepairAccess(c.req.raw)
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
      const { shopId, userId } = await requireRole(
        c.req.raw,
        OWNER_OR_STAFF,
        'Not authorized to create repair tickets',
      )
      const data = c.req.valid('json')
      const repair = await createRepairTicket({ shopId, createdBy: userId, data })
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
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
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
  .get('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
    const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
    const id = c.req.valid('param').id
    const repair = await getRepairById({ shopId, userRole, userId, id })
    return c.json(repair)
  })
  .patch(
    '/:id/status',
    zValidator('param', idParamSchema, validationHook),
    zValidator(
      'json',
      z.object({
        status: z.enum(repairStatusEnum.enumValues),
        note: z.string().optional(),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', requestCustomerApprovalSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
      const body = c.req.valid('json')

      const repair = await requestCustomerApproval({
        shopId,
        userRole,
        userId,
        id,
        ...body,
      })
      return c.json(repair)
    },
  )
  .post(
    '/:id/reopen',
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', reopenRepairSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator(
      'json',
      z.object({
        technicianId: z.string().nullable(),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator(
      'json',
      z.object({
        diagnosis: z.string(),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
  .post(
    '/:id/confirm-model',
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', confirmRepairModelSchema, validationHook),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
      const data = c.req.valid('json')

      const device = await confirmRepairModel({
        shopId,
        userRole,
        userId,
        id,
        data,
      })
      return c.json(device)
    },
  )
  .patch(
    '/:id/estimated-cost',
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', updateEstimatedCostSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', repairPricingFieldsSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', repairPricingFieldsSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator(
      'json',
      z.object({
        note: z.string().min(1, 'Note content is required'),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', updateExpectedCompletionDateSchema),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
  .get('/:id/emails', zValidator('param', idParamSchema, validationHook), async (c) => {
    const { shopId } = await requireRole(c.req.raw, OWNER_OR_STAFF, REPAIR_EMAIL_MESSAGES.forbidden)
    const { id } = c.req.valid('param')
    return c.json(await listRepairEmails({ shopId, repairId: id }))
  })
  .post(
    '/:id/emails/:logId/resend',
    zValidator('param', idAndLogIdParamSchema, validationHook),
    async (c) => {
      const { shopId } = await requireRole(c.req.raw, OWNER_OR_STAFF, REPAIR_EMAIL_MESSAGES.forbidden)
      const { id, logId } = c.req.valid('param')
      return c.json(await resendRepairEmail({ shopId, repairId: id, logId }))
    },
  )
  .post('/:id/regenerate-tracking-link', zValidator('param', idParamSchema, validationHook), async (c) => {
    const { shopId, userRole } = await requireRepairAccess(c.req.raw)
    const id = c.req.valid('param').id

    const updated = await regenerateTrackingToken({
      shopId,
      userRole,
      repairId: id,
    })
    return c.json(updated)
  })
  .post(
    '/:id/photos/upload-url',
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', repairPhotoUploadUrlSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', repairPhotoConfirmSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
      const { type, publicId } = c.req.valid('json')
      const payload = await confirmRepairPhoto(
        { shopId, userRole, userId, repairId: id },
        { type, publicId },
      )
      return c.json(payload)
    },
  )
  .delete(
    '/:id/photos/:type',
    zValidator('param', idAndPhotoTypeParamSchema, validationHook),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const { id, type } = c.req.valid('param')
      const typeParam = type.toUpperCase()
      if (!repairPhotoTypeValues.includes(typeParam as (typeof repairPhotoTypeValues)[number])) {
        throw new HTTPException(400, { message: 'Photo type must be BEFORE or AFTER' })
      }
      const payload = await deleteRepairPhoto(
        { shopId, userRole, userId, repairId: id },
        typeParam as (typeof repairPhotoTypeValues)[number],
      )
      return c.json(payload)
    },
  )
  .patch(
    '/:id/photos/visibility',
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', repairPhotoVisibilitySchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idParamSchema, validationHook),
    zValidator('json', addRepairPartSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const id = c.req.valid('param').id
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
    zValidator('param', idAndPartRowIdParamSchema, validationHook),
    zValidator('json', updateRepairPartSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
      }
    }),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const { id, partRowId } = c.req.valid('param')
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
  .delete(
    '/:id/parts/:partRowId',
    zValidator('param', idAndPartRowIdParamSchema, validationHook),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairAccess(c.req.raw)
      const { id, partRowId } = c.req.valid('param')
      const result = await removeRepairPart({
        shopId,
        repairId: id,
        partRowId,
        userRole,
        userId,
      })
      return c.json(result)
    },
  )
