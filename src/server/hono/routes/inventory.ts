import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  adjustStockSchema,
  partDetailsSchema,
  partFilterSchema,
  stockMovementFilterSchema,
} from '@/features/inventory/schemas'
import { auth } from '@/server/auth'
import {
  adjustStock,
  createPart,
  deletePart,
  getPartById,
  listParts,
  listStockMovements,
  updatePart,
} from '@/server/services/inventory.service'

const inventoryRouter = new Hono()

async function requireInventoryAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })

  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (!['OWNER', 'STAFF'].includes(role) || !shopId) {
    throw new HTTPException(403, { message: 'Not authorized to manage inventory' })
  }

  return { session, shopId, userId: session.user.id }
}

/** Read access for OWNER/STAFF (manage) and TECHNICIAN (record parts used on repairs). */
async function requireInventoryReadAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })

  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (!['OWNER', 'STAFF', 'TECHNICIAN'].includes(role) || !shopId) {
    throw new HTTPException(403, { message: 'Not authorized to view inventory' })
  }

  return { session, shopId, userId: session.user.id }
}

inventoryRouter.get(
  '/',
  zValidator('query', partFilterSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: { message: 'Invalid query parameters', code: 'VALIDATION_ERROR' } },
        400,
      )
    }
  }),
  async (c) => {
    const { shopId } = await requireInventoryReadAccess(c.req.raw)
    const filters = c.req.valid('query')
    const result = await listParts({ ...filters, shopId })
    return c.json(result)
  },
)

inventoryRouter.post(
  '/',
  zValidator('json', partDetailsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId, userId } = await requireInventoryAccess(c.req.raw)
    const data = c.req.valid('json')
    const part = await createPart({ shopId, data, createdBy: userId })
    return c.json(part, 201)
  },
)

inventoryRouter.get('/:id', async (c) => {
  const { shopId } = await requireInventoryReadAccess(c.req.raw)
  const id = c.req.param('id')
  const part = await getPartById({ shopId, id })
  return c.json(part)
})

inventoryRouter.get(
  '/:id/movements',
  zValidator('query', stockMovementFilterSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: { message: 'Invalid query parameters', code: 'VALIDATION_ERROR' } },
        400,
      )
    }
  }),
  async (c) => {
    const { shopId } = await requireInventoryAccess(c.req.raw)
    const id = c.req.param('id')
    const filters = c.req.valid('query')
    const result = await listStockMovements({ ...filters, shopId, inventoryId: id })
    return c.json(result)
  },
)

inventoryRouter.post(
  '/:id/adjust-stock',
  zValidator('json', adjustStockSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId, userId } = await requireInventoryAccess(c.req.raw)
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const updated = await adjustStock({ shopId, id, data, createdBy: userId })
    return c.json(updated)
  },
)

inventoryRouter.patch(
  '/:id',
  zValidator('json', partDetailsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireInventoryAccess(c.req.raw)
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const updated = await updatePart({ shopId, id, data })
    return c.json(updated)
  },
)

inventoryRouter.delete('/:id', async (c) => {
  const { shopId } = await requireInventoryAccess(c.req.raw)
  const id = c.req.param('id')
  const result = await deletePart({ shopId, id })
  return c.json(result)
})

export { inventoryRouter }
