import type { Context, ErrorHandler, NotFoundHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { HTTPException } from 'hono/http-exception'

const ERROR_CODES: Partial<Record<number, string>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
}

const INTERNAL_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export function jsonError(c: Context, status: ContentfulStatusCode, message: string, code?: string) {
  return c.json({ error: { message, code: code ?? ERROR_CODES[status] ?? 'ERROR' } }, status)
}

export const handleApiError: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    const status = err.status as ContentfulStatusCode
    const message = status >= 500 ? INTERNAL_ERROR_MESSAGE : err.message || 'Request failed'
    if (status >= 500) console.error(`[api] ${c.req.method} ${c.req.path}`, err)
    return jsonError(c, status, message)
  }

  // Unknown errors may carry DB details or stack traces — log them, never return them.
  console.error(`[api] ${c.req.method} ${c.req.path}`, err)
  return jsonError(c, 500, INTERNAL_ERROR_MESSAGE, 'INTERNAL_ERROR')
}

export const handleApiNotFound: NotFoundHandler = (c) =>
  jsonError(c, 404, 'The requested API endpoint does not exist.')
