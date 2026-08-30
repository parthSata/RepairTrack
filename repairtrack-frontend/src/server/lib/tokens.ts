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
  const trimmed = phone.trim()
  const hasLeadingPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  return hasLeadingPlus ? `+${digits}` : digits
}

export { isTicketNumber, isTrackingToken } from '@/features/tracking/identifiers'
