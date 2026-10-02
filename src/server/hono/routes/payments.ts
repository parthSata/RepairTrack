import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  PAYMENT_MESSAGES,
  paymentFilterSchema,
  recordPaymentSchema,
} from '@/features/payments/schemas'
import { requireRole } from '@/server/hono/session'
import { validationHook } from '@/server/hono/validation'
import {
  listPayments,
  listRepairPayments,
  recordPayment,
} from '@/server/services/payment.service'

const paymentsRouter = new Hono()

const requirePaymentAccess = (request: Request) =>
  requireRole(request, ['OWNER', 'STAFF'], PAYMENT_MESSAGES.forbidden)

paymentsRouter.get('/', zValidator('query', paymentFilterSchema, validationHook), async (c) => {
  const { shopId } = await requirePaymentAccess(c.req.raw)
  const query = c.req.valid('query')

  if (query.repairId) {
    return c.json(await listRepairPayments({ shopId, repairId: query.repairId }))
  }

  return c.json(await listPayments({ ...query, shopId }))
})

paymentsRouter.post('/', zValidator('json', recordPaymentSchema, validationHook), async (c) => {
  const { shopId, userId } = await requirePaymentAccess(c.req.raw)
  const payment = await recordPayment({ ...c.req.valid('json'), shopId, userId })
  return c.json(payment, 201)
})

export { paymentsRouter }
