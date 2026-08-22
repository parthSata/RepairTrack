import { resolveMx } from 'node:dns/promises'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { emailCheckSchema } from '@/features/auth/schemas'

const emailCheckRouter = new Hono()

emailCheckRouter.post('/', zValidator('json', emailCheckSchema, (result, context) => {
  if (!result.success) return context.json({ error: { message: 'Enter a valid email address', code: 'VALIDATION_ERROR' } }, 400)
}), async (context) => {
  const { email } = context.req.valid('json')
  const domain = email.split('@')[1]
  if (!domain) return context.json({ valid: false }, 422)
  if (['example.com', 'example.net', 'example.org', 'invalid'].includes(domain)) {
    return context.json({ valid: false }, 422)
  }

  try {
    const records = await resolveMx(domain)
    const hasWorkingMailServer = records.some((record) => record.exchange !== '.')
    if (!hasWorkingMailServer) return context.json({ valid: false }, 422)
  } catch {
    return context.json({ valid: false }, 422)
  }

  return context.json({ valid: true })
})

export { emailCheckRouter }