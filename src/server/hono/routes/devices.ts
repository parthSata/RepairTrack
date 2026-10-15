import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { deviceFilterSchema, deviceSchema } from '@/features/devices/schemas'
import { idParamSchema } from '@/lib/validation'
import { requireRole } from '@/server/hono/session'
import { validationHook } from '@/server/hono/validation'
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
  return requireRole(request, ['OWNER', 'STAFF'], 'Not authorized to manage devices')
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

devicesRouter.get('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
  const { shopId } = await requireDeviceAccess(c.req.raw)
  const id = c.req.valid('param').id
  const device = await getDeviceById({ shopId, id })
  return c.json(device)
})

devicesRouter.patch(
  '/:id',
  zValidator('param', idParamSchema, validationHook),
  zValidator('json', deviceSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireDeviceAccess(c.req.raw)
    const id = c.req.valid('param').id
    const data = c.req.valid('json')
    const updated = await updateDevice({ shopId, id, data })
    return c.json(updated)
  },
)

devicesRouter.delete('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
  const { shopId } = await requireDeviceAccess(c.req.raw)
  const id = c.req.valid('param').id
  const result = await deleteDevice({ shopId, id })
  return c.json(result)
})

devicesRouter.get('/:id/repairs', zValidator('param', idParamSchema, validationHook), async (c) => {
  const { shopId, userRole, userId } = await requireDeviceAccess(c.req.raw)
  const id = c.req.valid('param').id
  const history = await getDeviceRepairHistory({
    shopId,
    deviceId: id,
    userRole,
    userId,
  })
  return c.json(history)
})

export { devicesRouter }
