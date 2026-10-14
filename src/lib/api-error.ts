export function getApiErrorStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object' || !('response' in err)) return null
  const status = (err as { response?: { status?: unknown } }).response?.status
  return typeof status === 'number' ? status : null
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object' || !('response' in err)) {
    return fallback
  }

  const data = (err as { response?: { data?: unknown } }).response?.data
  if (typeof data === 'string') {
    return data.trim().length > 0 && data.length <= 300 ? data : fallback
  }
  if (!data || typeof data !== 'object') {
    return fallback
  }

  const record = data as Record<string, unknown>
  if (typeof record.message === 'string' && record.message.trim().length > 0) {
    return record.message
  }

  if (record.error && typeof record.error === 'object') {
    const errorObj = record.error as Record<string, unknown>
    if (typeof errorObj.message === 'string' && errorObj.message.trim().length > 0) {
      return errorObj.message
    }
  }

  return fallback
}

const MAX_QUERY_RETRIES = 2

/** TanStack Query `retry`: 4xx will not succeed on retry, so fail fast; retry network errors and 5xx. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = getApiErrorStatus(error)
  if (status !== null && status >= 400 && status < 500) return false
  return failureCount < MAX_QUERY_RETRIES
}

export type RateLimitInfo = {
  isRateLimited: boolean
  retryAfter: number
  resetAt: number
  message: string
}

export function getRateLimitInfo(err: unknown): RateLimitInfo | null {
  if (!err || typeof err !== 'object' || !('response' in err)) return null
  const res = (
    err as {
      response?: {
        status?: unknown
        data?: {
          error?: {
            code?: unknown
            message?: unknown
            retryAfter?: unknown
            resetAt?: unknown
          }
          message?: unknown
        }
        headers?: Record<string, string>
      }
    }
  ).response

  if (res?.status !== 429) return null

  const data = res.data
  const errObj = data?.error
  const retryHeader = res.headers?.['retry-after']
  const parsedHeader = retryHeader ? parseInt(retryHeader, 10) : NaN

  const retryAfterSec =
    typeof errObj?.retryAfter === 'number'
      ? errObj.retryAfter
      : !Number.isNaN(parsedHeader) && parsedHeader > 0
        ? parsedHeader
        : 15 * 60

  let resetAtMs: number
  if (typeof errObj?.resetAt === 'string') {
    const parsed = new Date(errObj.resetAt).getTime()
    resetAtMs = Number.isNaN(parsed) ? Date.now() + retryAfterSec * 1000 : parsed
  } else {
    resetAtMs = Date.now() + retryAfterSec * 1000
  }

  const message =
    typeof errObj?.message === 'string'
      ? errObj.message
      : typeof data?.message === 'string'
        ? data.message
        : 'Too many requests. Please try again later.'

  return {
    isRateLimited: true,
    retryAfter: retryAfterSec,
    resetAt: resetAtMs,
    message,
  }
}

