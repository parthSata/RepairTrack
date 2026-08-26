import { resolveMx } from 'node:dns/promises'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { ilike } from 'drizzle-orm'
import { db } from '@/server/db'
import { users } from '@/server/db/schema/users'
import { emailCheckSchema } from '@/features/auth/schemas'

const emailCheckRouter = new Hono()

emailCheckRouter.get('/user-status', async (context) => {
  const email = context.req.query('email')
  if (!email || !email.trim()) {
    return context.json({ exists: false, emailVerified: false })
  }

  const [existingUser] = await db
    .select({
      id: users.id,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(ilike(users.email, email.trim()))

  if (!existingUser) {
    return context.json({ exists: false, emailVerified: false })
  }

  return context.json({
    exists: true,
    emailVerified: existingUser.emailVerified ?? false,
  })
})

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
    if (!hasWorkingMailServer) {
      return context.json({ valid: false }, 422)
    }
  } catch {
    return context.json({ valid: false }, 422)
  }

  return context.json({ valid: true })
})

export { emailCheckRouter }