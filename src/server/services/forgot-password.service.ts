import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import type { ForgotPasswordInput } from '@/features/auth/schemas'

const ACCOUNT_NOT_FOUND_MESSAGE =
  'No account found for this email. Check the address or create an account.'

const SEND_FAILED_MESSAGE =
  'We could not send a password reset email right now. Please try again later.'

function isRateLimitedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const record = error as {
    status?: unknown
    statusCode?: unknown
    message?: unknown
  }
  if (record.status === 429 || record.statusCode === 429) return true
  const message =
    typeof record.message === 'string' ? record.message.toLowerCase() : ''
  return message.includes('too many') || message.includes('rate limit')
}

export async function requestForgotPassword(
  input: ForgotPasswordInput,
): Promise<{ sent: true }> {
  const email = input.email

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!existing) {
    throw new HTTPException(404, { message: ACCOUNT_NOT_FOUND_MESSAGE })
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: '/reset-password',
      },
    })
  } catch (error: unknown) {
    if (error instanceof HTTPException) throw error
    if (isRateLimitedError(error)) {
      throw new HTTPException(429, {
        message: 'Too many requests. Please wait a few minutes and try again.',
      })
    }
    throw new HTTPException(503, { message: SEND_FAILED_MESSAGE })
  }

  return { sent: true }
}
