import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { forgotPasswordSchema } from '@/features/auth/schemas'
import { createRateLimitMiddleware } from '@/server/hono/middleware/rate-limit'
import { validationHook } from '@/server/hono/validation'
import { requestForgotPassword } from '@/server/services/forgot-password.service'

export const forgotPasswordRouter = new Hono().post(
  '/',
  createRateLimitMiddleware({ windowMs: 15 * 60_000, max: 5 }),
  zValidator('json', forgotPasswordSchema, validationHook),
  async (context) => {
    const result = await requestForgotPassword(context.req.valid('json'))
    return context.json(result)
  },
)
