import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { getRepairById, updateRepairStatus } from '@/server/services/repair.service'
import { repairStatusEnum } from '@/server/db/schema/repairs'

async function requireRepairAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const shopId = session.user.shopId
  if (!shopId) throw new HTTPException(403, { message: 'Shop context missing' })
  return { session, shopId }
}

export const repairsRouter = new Hono()
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
      const { shopId } = await requireRepairAccess(c.req.raw)
      const id = c.req.param('id')
      const { status } = c.req.valid('json')

      const updated = await updateRepairStatus({ shopId, id, status })
      return c.json(updated)
    },
  )
