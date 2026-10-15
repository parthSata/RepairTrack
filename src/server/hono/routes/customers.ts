import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { customerFilterSchema, customerSchema } from '@/features/customers/schemas'
import { idParamSchema } from '@/lib/validation'
import { requireRole } from '@/server/hono/session'
import { validationHook } from '@/server/hono/validation'
import {
  checkCustomerEmail,
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerRepairHistory,
  listCustomers,
  updateCustomer,
} from '@/server/services/customer.service'

const customersRouter = new Hono()

async function requireCustomerAccess(request: Request) {
  return requireRole(request, ['OWNER', 'STAFF'], 'Not authorized to manage customers')
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

customersRouter.get('/check-email', async (c) => {
  const { shopId } = await requireCustomerAccess(c.req.raw)
  const email = c.req.query('email') || ''
  const excludeId = c.req.query('excludeId') || undefined
  const result = await checkCustomerEmail({ shopId, email, excludeCustomerId: excludeId })
  return c.json(result)
})

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

customersRouter.get('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
  const { shopId } = await requireCustomerAccess(c.req.raw)
  const id = c.req.valid('param').id
  const customer = await getCustomerById({ shopId, id })
  return c.json(customer)
})

customersRouter.patch(
  '/:id',
  zValidator('param', idParamSchema, validationHook),
  zValidator('json', customerSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await requireCustomerAccess(c.req.raw)
    const id = c.req.valid('param').id
    const data = c.req.valid('json')
    const updated = await updateCustomer({ shopId, id, data })
    return c.json(updated)
  },
)

customersRouter.delete('/:id', zValidator('param', idParamSchema, validationHook), async (c) => {
  const { shopId } = await requireCustomerAccess(c.req.raw)
  const id = c.req.valid('param').id
  const result = await deleteCustomer({ shopId, id })
  return c.json(result)
})

customersRouter.get('/:id/repairs', zValidator('param', idParamSchema, validationHook), async (c) => {
  const { shopId, userRole, userId } = await requireCustomerAccess(c.req.raw)
  const id = c.req.valid('param').id
  const history = await getCustomerRepairHistory({
    shopId,
    customerId: id,
    userRole,
    userId,
  })
  return c.json(history)
})

export { customersRouter }
