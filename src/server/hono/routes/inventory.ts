import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { partFilterSchema, partSchema } from '@/features/inventory/schemas'
import { auth } from '@/server/auth'
import { createPart, listParts } from '@/server/services/inventory.service'

const inventoryRouter = new Hono()

async function requireInventoryAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })

  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (!['OWNER', 'STAFF'].includes(role) || !shopId) {
    throw new HTTPException(403, { message: 'Not authorized to manage inventory' })
  }

  return { session, shopId }
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
    const { shopId } = await requireInventoryAccess(c.req.raw)
    const filters = c.req.valid('query')
    const result = await listParts({ ...filters, shopId })
    return c.json(result)
  },
)

inventoryRouter.post(
  '/',
  zValidator('json', partSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireInventoryAccess(c.req.raw)
    const data = c.req.valid('json')
    const part = await createPart({ shopId, data })
    return c.json(part, 201)
  },
)

export { inventoryRouter }
