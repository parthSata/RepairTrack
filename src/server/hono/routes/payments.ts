import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { PAYMENT_MESSAGES, recordPaymentSchema } from '@/features/payments/schemas'
import { requireRole } from '@/server/hono/session'
import { validationHook } from '@/server/hono/validation'
import { recordPayment } from '@/server/services/payment.service'

const paymentsRouter = new Hono()

paymentsRouter.post('/', zValidator('json', recordPaymentSchema, validationHook), async (c) => {
  const { shopId, userId } = await requireRole(c.req.raw, ['OWNER', 'STAFF'], PAYMENT_MESSAGES.forbidden)
  const payment = await recordPayment({ ...c.req.valid('json'), shopId, userId })
  return c.json(payment, 201)
})

export { paymentsRouter }
