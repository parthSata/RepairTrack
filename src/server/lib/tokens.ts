export function generateTicketNumber(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const num = 1_000_000_000 + (array[0] % 9_000_000_000)
  return num.toString()
}

export function generateTrackingToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64url')
}
  
const MIN_PHONE_DIGITS = 7

export function canonicalPhone(value: string): string {
  if (!value) {
    return ''
  }

  const digits = value.replace(/\D/g, '')

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(-10)
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(-10)
  }

  return digits
}

export function normalizePhoneForComparison(phone: string): string {
  return canonicalPhone(phone)
}

export function phonesMatch(storedPhone: string, inputPhone: string): boolean {
  const stored = canonicalPhone(storedPhone)
  const input = canonicalPhone(inputPhone)

  if (
    !stored ||
    !input ||
    stored.length < MIN_PHONE_DIGITS ||
    input.length < MIN_PHONE_DIGITS
  ) {
    return false
  }

  return stored === input
}

export { isTicketNumber, isTrackingToken } from '@/features/tracking/identifiers'
