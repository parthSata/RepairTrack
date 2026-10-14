import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  registerSchema,
  registrationResendSchema,
  registrationTokenSchema,
} from '@/features/auth/schemas'
import { validationHook } from '@/server/hono/validation'
import {
  completePendingRegistration,
  createPendingRegistration,
  resendPendingRegistration,
} from '@/server/services/pending-registration.service'

export const registrationRouter = new Hono()
  .post(
    '/',
    zValidator('json', registerSchema, validationHook),
    async (context) => {
      await createPendingRegistration(context.req.valid('json'))
      return context.json({ pending: true })
    },
  )
  .post(
    '/verify',
    zValidator('json', registrationTokenSchema, validationHook),
    async (context) => {
      await completePendingRegistration(context.req.valid('json').token)
      return context.json({ verified: true })
    },
  )
  .post(
    '/resend',
    zValidator('json', registrationResendSchema, validationHook),
    async (context) => {
      await resendPendingRegistration(context.req.valid('json').email)
      return context.json({ pending: true })
    },
  )
