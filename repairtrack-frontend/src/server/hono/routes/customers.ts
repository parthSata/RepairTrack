import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { customerFilterSchema, customerSchema } from '@/features/customers/schemas'
import { auth } from '@/server/auth'
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerRepairHistory,
  listCustomers,
  updateCustomer,
} from '@/server/services/customer.service'

const customersRouter = new Hono()

async function requireCustomerAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (!['OWNER', 'STAFF'].includes(role) || !shopId) {
    throw new HTTPException(403, { message: 'Not authorized to manage customers' })
  }
  return { session, shopId }
}


customersRouter.get(
  '/',
  zValidator('query', customerFilterSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Invalid query parameters', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireCustomerAccess(c.req.raw)
    const filters = c.req.valid('query')
    const result = await listCustomers({ ...filters, shopId })
    return c.json(result)
  },
)

customersRouter.post(
  '/',
  zValidator('json', customerSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireCustomerAccess(c.req.raw)
    const data = c.req.valid('json')
    const customer = await createCustomer({ shopId, data })
    return c.json(customer, 201)
  },
)

customersRouter.get('/:id', async (c) => {
  const { shopId } = await requireCustomerAccess(c.req.raw)
  const id = c.req.param('id')
  const customer = await getCustomerById({ shopId, id })
  return c.json(customer)
})

customersRouter.patch(
  '/:id',
  zValidator('json', customerSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireCustomerAccess(c.req.raw)
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const updated = await updateCustomer({ shopId, id, data })
    return c.json(updated)
  },
)

customersRouter.delete('/:id', async (c) => {
  const { shopId } = await requireCustomerAccess(c.req.raw)
  const id = c.req.param('id')
  const result = await deleteCustomer({ shopId, id })
  return c.json(result)
})

customersRouter.get('/:id/repairs', async (c) => {
  const { shopId } = await requireCustomerAccess(c.req.raw)
  const id = c.req.param('id')
  const history = await getCustomerRepairHistory({ shopId, customerId: id })
  return c.json(history)
})

export { customersRouter }
