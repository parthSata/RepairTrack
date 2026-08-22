import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { deviceFilterSchema, deviceSchema } from '@/features/devices/schemas'
import { auth } from '@/server/auth'
import {
  createDevice,
  deleteDevice,
  getDeviceById,
  getDeviceRepairHistory,
  listDevices,
  updateDevice,
} from '@/server/services/device.service'

const devicesRouter = new Hono()

async function requireDeviceAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (!['OWNER', 'STAFF'].includes(role) || !shopId) {
    throw new HTTPException(403, { message: 'Not authorized to manage devices' })
  }
  return { session, shopId }
}

devicesRouter.get(
  '/',
  zValidator('query', deviceFilterSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Invalid query parameters', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireDeviceAccess(c.req.raw)
    const filters = c.req.valid('query')
    const result = await listDevices({ ...filters, shopId })
    return c.json(result)
  },
)

devicesRouter.post(
  '/',
  zValidator('json', deviceSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireDeviceAccess(c.req.raw)
    const data = c.req.valid('json')
    const device = await createDevice({ shopId, data })
    return c.json(device, 201)
  },
)

devicesRouter.get('/:id', async (c) => {
  const { shopId } = await requireDeviceAccess(c.req.raw)
  const id = c.req.param('id')
  const device = await getDeviceById({ shopId, id })
  return c.json(device)
})

devicesRouter.patch(
  '/:id',
  zValidator('json', deviceSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireDeviceAccess(c.req.raw)
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const updated = await updateDevice({ shopId, id, data })
    return c.json(updated)
  },
)

devicesRouter.delete('/:id', async (c) => {
  const { shopId } = await requireDeviceAccess(c.req.raw)
  const id = c.req.param('id')
  const result = await deleteDevice({ shopId, id })
  return c.json(result)
})

devicesRouter.get('/:id/repairs', async (c) => {
  const { shopId } = await requireDeviceAccess(c.req.raw)
  const id = c.req.param('id')
  const history = await getDeviceRepairHistory({ shopId, deviceId: id })
  return c.json(history)
})

export { devicesRouter }
