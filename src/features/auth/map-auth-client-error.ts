export type BetterAuthClientError = {
  status?: number
  message?: string | null
  code?: string | null
}

const RATE_LIMIT_MESSAGE =
  'Too many requests. Please wait a few minutes and try again.'

export const INVALID_RESET_TOKEN_MESSAGE =
  'This reset link is invalid or has expired. Request a new one.'

const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password does not meet the requirements. Use at least 8 characters with upper and lowercase letters, a number, and a special character.'

/**
 * Map Better Auth client errors to user-safe copy.
 * Never echoes tokens, passwords, or raw internals.
 */
export function mapBetterAuthClientError(
  error: BetterAuthClientError,
  fallback: string,
): string {
  const status = error.status
  const code = (error.code ?? '').toUpperCase()
  const message = (error.message ?? '').toLowerCase()

  if (
    status === 429 ||
    code.includes('TOO_MANY') ||
    code.includes('RATE_LIMIT') ||
    message.includes('too many') ||
    message.includes('rate limit')
  ) {
    return RATE_LIMIT_MESSAGE
  }

  if (
    code.includes('INVALID_TOKEN') ||
    message.includes('invalid token') ||
    message.includes('expired') ||
    message.includes('already used') ||
    message.includes('already been used')
  ) {
    return INVALID_RESET_TOKEN_MESSAGE
  }

  if (
    code.includes('PASSWORD_TOO_SHORT') ||
    code.includes('PASSWORD_TOO_LONG') ||
    message.includes('password too short') ||
    message.includes('password too long')
  ) {
    return PASSWORD_REQUIREMENTS_MESSAGE
  }

  return fallback
}
