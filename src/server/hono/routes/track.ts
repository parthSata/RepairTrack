import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import {
  trackDecisionParamSchema,
  trackDecisionSchema,
  trackVerifySchema,
} from '@/features/tracking/schemas'
import { createRateLimitMiddleware, getClientIp } from '@/server/hono/middleware/rate-limit'
import { isTrackingToken } from '@/server/lib/tokens'
import {
  decideRepairApprovalByTrackingToken,
  getPublicRepairByTrackingToken,
  verifyPublicRepairByTicketAndPhone,
} from '@/server/services/tracking.service'

import { eq } from 'drizzle-orm'
import { db } from '@/server/db'
import { rateLimits } from '@/server/db/schema'

type TrackEnv = {
  Variables: {
    rateLimitRemaining?: number
  }
}

const trackRouter = new Hono<TrackEnv>()

trackRouter.post(
  '/verify',
  zValidator('json', trackVerifySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  createRateLimitMiddleware({
    windowMs: 15 * 60_000,
    max: 10,
    key: async (c) => {
      try {
        const body = (await c.req.raw.clone().json().catch(() => null)) as Record<string, unknown> | null
        const rawTicket = typeof body?.ticketNumber === 'string' ? body.ticketNumber : null
        if (rawTicket) {
          const cleaned = rawTicket.replace(/\D/g, '')
          if (cleaned.length === 10) {
            return `track:verify:${cleaned}`
          }
        }
      } catch {
        // Fallback to IP if parsing body fails
      }
      return getClientIp(c)
    },
  }),
  async (c) => {
    const { ticketNumber, phone } = c.req.valid('json')
    try {
      const payload = await verifyPublicRepairByTicketAndPhone(ticketNumber, phone)
      await db
        .delete(rateLimits)
        .where(eq(rateLimits.key, `track:verify:${ticketNumber}`))
        .catch(() => {})
      return c.json(payload)
    } catch (err) {
      if (err instanceof HTTPException && err.status === 404) {
        const remaining = c.get('rateLimitRemaining') as number | undefined
        return c.json(
          {
            error: {
              message: "We couldn't find this repair. Check your repair number and phone, then try again.",
              code: 'NOT_FOUND',
              remaining,
            },
          },
          404,
        )
      }
      throw err
    }
  },
)

trackRouter.get(
  '/:identifier',
  createRateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  async (c) => {
    const identifier = c.req.param('identifier')

    if (!identifier || !isTrackingToken(identifier)) {
      throw new HTTPException(404, { message: "We couldn't find this repair." })
    }

    const payload = await getPublicRepairByTrackingToken(identifier)
    return c.json(payload)
  },
)

trackRouter.post(
  '/:trackingToken/decision',
  createRateLimitMiddleware({
    windowMs: 60_000,
    max: 10,
    key: (c) => `${getClientIp(c)}:${c.req.param('trackingToken')}`,
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
