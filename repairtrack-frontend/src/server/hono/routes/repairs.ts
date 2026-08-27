import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import {
  addRepairNote,
  createRepairTicket,
  getRepairById,
  listRepairs,
  reassignTechnician,
  reopenRepairTicket,
  updateDiagnosis,
  updateRepairStatus,
} from '@/server/services/repair.service'
import { getTechnicians } from '@/server/services/staff.service'
import { repairStatusEnum } from '@/server/db/schema/repairs'
import { createRepairSchema } from '@/features/repairs/schemas'

async function requireRepairUserSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const shopId = session.user.shopId
  if (!shopId) throw new HTTPException(403, { message: 'Shop context missing' })
  return {
    session,
    shopId,
    userId: session.user.id,
    userRole: session.user.role ?? 'OWNER',
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
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
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
    '/:id/reopen',
    zValidator(
      'json',
      z.object({
        note: z.string().optional(),
      }),
    ),
    async (c) => {
      const { shopId, userRole, userId } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { note } = c.req.valid('json')

      const updated = await reopenRepairTicket({
        shopId,
        userRole,
        userId,
        id,
        note,
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
      const { shopId, userRole } = await requireRepairUserSession(c.req.raw)
      const id = c.req.param('id')
      const { technicianId } = c.req.valid('json')

      const updated = await reassignTechnician({
        shopId,
        userRole,
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
