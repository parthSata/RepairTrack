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

export function normalizePhoneForComparison(phone: string): string {
  return phone.trim().replace(/\D/g, '')
}

export function phonesMatch(storedPhone: string, inputPhone: string): boolean {
  const stored = normalizePhoneForComparison(storedPhone)
  const input = normalizePhoneForComparison(inputPhone)

  if (!stored || !input) {
    return false
  }

  if (stored === input) {
    return true
  }

  return stored.endsWith(input) || input.endsWith(stored)
}

export { isTicketNumber, isTrackingToken } from '@/features/tracking/identifiers'
