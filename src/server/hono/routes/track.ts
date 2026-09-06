import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  trackDecisionParamSchema,
  trackDecisionSchema,
  trackVerifySchema,
} from '@/features/tracking/schemas'
import { createRateLimitMiddleware } from '@/server/hono/middleware/rate-limit'
import { isTrackingToken } from '@/server/lib/tokens'
import {
  decideRepairApprovalByTrackingToken,
  getPublicRepairByTrackingToken,
  verifyPublicRepairByTicketAndPhone,
} from '@/server/services/tracking.service'

const trackRouter = new Hono()

trackRouter.use('*', createRateLimitMiddleware({ windowMs: 60_000, max: 30 }))

trackRouter.post(
  '/verify',
  zValidator('json', trackVerifySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { ticketNumber, phone } = c.req.valid('json')
    const payload = await verifyPublicRepairByTicketAndPhone(ticketNumber, phone)
    return c.json(payload)
  },
)

trackRouter.get('/:identifier', async (c) => {
  const identifier = c.req.param('identifier')

  if (!isTrackingToken(identifier)) {
    throw new HTTPException(404, { message: "We couldn't find this repair." })
  }

  const payload = await getPublicRepairByTrackingToken(identifier)
  return c.json(payload)
})

trackRouter.post(
  '/:trackingToken/decision',
  createRateLimitMiddleware({
    windowMs: 60_000,
    max: 10,
    key: (c) => {
      const forwarded = c.req.header('x-forwarded-for')
      const realIp = c.req.header('x-real-ip')
      const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
      return `${ip}:${c.req.param('trackingToken')}`
    },
  }),
  zValidator('param', trackDecisionParamSchema, (result) => {
    if (!result.success) {
      throw new HTTPException(404, { message: "We couldn't find this repair." })
    }
  }),
  zValidator('json', trackDecisionSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { trackingToken } = c.req.valid('param')

    if (!isTrackingToken(trackingToken)) {
      throw new HTTPException(404, { message: "We couldn't find this repair." })
    }

    const payload = await decideRepairApprovalByTrackingToken(trackingToken, c.req.valid('json'))
    return c.json(payload)
  },
)

export { trackRouter }
