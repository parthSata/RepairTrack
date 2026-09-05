import type { Context, Next } from 'hono'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

function getClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }

  const realIp = c.req.header('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export function createRateLimitMiddleware(options?: {
  windowMs?: number
  max?: number
  key?: (c: Context) => string
}) {
  const windowMs = options?.windowMs ?? 60_000
  const max = options?.max ?? 30
  const keyFn = options?.key ?? getClientIp

  return async (c: Context, next: Next) => {
    const ip = keyFn(c)
    const now = Date.now()
    const existing = store.get(ip)

    if (!existing || existing.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + windowMs })
      await next()
      return
    }

    if (existing.count >= max) {
      return c.json({ error: { message: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' } }, 429)
    }

    existing.count += 1
    store.set(ip, existing)
    await next()
  }
}
