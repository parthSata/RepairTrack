import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { createRepairTicket, getRepairById, updateRepairStatus } from '@/server/services/repair.service'
import { repairStatusEnum } from '@/server/db/schema/repairs'
import { createRepairSchema } from '@/features/repairs/schemas'

async function requireRepairAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const shopId = session.user.shopId
  if (!shopId) throw new HTTPException(403, { message: 'Shop context missing' })
  return { session, shopId }
}

async function requireCreateRepairAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (!['OWNER', 'STAFF'].includes(role) || !shopId) {
    throw new HTTPException(403, { message: 'Not authorized to create repair tickets' })
  }
  return { session, shopId }
}

async function requireTechnicianStatusUpdateAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (role !== 'TECHNICIAN' || !shopId) {
    throw new HTTPException(403, {
      message: 'Forbidden: Only Technicians have permission to update repair status.',
    })
  }
  return { session, shopId }
}

export const repairsRouter = new Hono()
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
  .get('/:id', async (c) => {
    const { shopId } = await requireRepairAccess(c.req.raw)
    const id = c.req.param('id')
    const repair = await getRepairById({ shopId, id })
    return c.json(repair)
  })
  .patch(
    '/:id/status',
    zValidator(
      'json',
      z.object({
        status: z.enum(repairStatusEnum.enumValues),
      }),
    ),
    async (c) => {
      const { shopId } = await requireTechnicianStatusUpdateAccess(c.req.raw)
      const id = c.req.param('id')
      const { status } = c.req.valid('json')

      const updated = await updateRepairStatus({ shopId, id, status })
      return c.json(updated)
    },
  )


