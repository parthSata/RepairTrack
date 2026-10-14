import { sql } from 'drizzle-orm'
import type { Context, Next } from 'hono'
import { db } from '@/server/db'
import { rateLimits } from '@/server/db/schema'

const RATE_LIMITED_MESSAGE = 'Too many requests. Please try again later.'
const FALLBACK_CLIENT_KEY = 'unknown'
const CLEANUP_PROBABILITY = 0.01

type RateLimitOptions = {
  windowMs?: number
  max?: number
  key?: (c: Context) => string | Promise<string>
}

export function getClientIp(c: Context): string {
  if (process.env.TRUST_PROXY !== 'true') {
    return FALLBACK_CLIENT_KEY
  }

  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || FALLBACK_CLIENT_KEY
  }

  return c.req.header('x-real-ip')?.trim() || FALLBACK_CLIENT_KEY
}

async function incrementRateLimit(
  key: string,
  windowMs: number,
): Promise<{ count: number; resetAt: Date }> {
  const result = await db.execute<{ count: number; reset_at: string | Date }>(sql`
    INSERT INTO rate_limits ("key", "count", "reset_at")
    VALUES (${key}, 1, now() + (${windowMs} * interval '1 millisecond'))
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN rate_limits."reset_at" <= now() THEN 1
        ELSE rate_limits."count" + 1
      END,
      "reset_at" = CASE
        WHEN rate_limits."reset_at" <= now()
          THEN now() + (${windowMs} * interval '1 millisecond') 
        ELSE rate_limits."reset_at"
      END
    RETURNING "count", "reset_at"
  `)

  const row = result[0]
  if (!row || row.count === undefined) {
    throw new Error('Rate limit update did not return a count')
  }

  return {
    count: Number(row.count),
    resetAt: new Date(row.reset_at),
  }
}

async function cleanupExpiredRateLimits(): Promise<void> {
  if (Math.random() >= CLEANUP_PROBABILITY) {
    return
  }

  await db.delete(rateLimits).where(sql`reset_at <= now()`)
}

export function createRateLimitMiddleware(options?: RateLimitOptions) {
  const windowMs = options?.windowMs ?? 60_000
  const max = options?.max ?? 30
  const keyFn = options?.key ?? getClientIp

  return async (c: Context, next: Next) => {
    const key = await keyFn(c)
    const [{ count, resetAt }] = await Promise.all([
      incrementRateLimit(key, windowMs),
      cleanupExpiredRateLimits(),
    ])

    const remaining = Math.max(0, max - count)
    c.set('rateLimitRemaining', remaining)
    c.header('X-RateLimit-Limit', String(max))
    c.header('X-RateLimit-Remaining', String(remaining))
    c.header('X-RateLimit-Reset', String(Math.ceil(resetAt.getTime() / 1000)))

    if (count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
      c.header('Retry-After', String(retryAfterSeconds))
      return c.json(
        {
          error: {
            message: RATE_LIMITED_MESSAGE,
            code: 'RATE_LIMITED',
            retryAfter: retryAfterSeconds,
            resetAt: resetAt.toISOString(),
          },
        },
        429,
      )
    }

    await next()
  }
}
