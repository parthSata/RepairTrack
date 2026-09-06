import { resolveMx } from 'node:dns/promises'

const FORBIDDEN_DOMAINS = [
  'example.com',
  'example.net',
  'example.org',
  'invalid',
  'test.com',
  'localhost',
]

export async function verifyEmailDomain(email: string): Promise<{ valid: boolean; reason?: string }> {
  if (!email || !email.includes('@')) {
    return { valid: false, reason: 'Invalid email format' }
  }

  const parts = email.split('@')
  if (parts.length !== 2) {
    return { valid: false, reason: 'Invalid email format' }
  }

  const domain = parts[1].toLowerCase().trim()
  if (!domain) {
    return { valid: false, reason: 'Invalid email domain' }
  }

  if (FORBIDDEN_DOMAINS.includes(domain)) {
    return {
      valid: false,
      reason: `Email domain "@${domain}" is a test/invalid domain. Please provide a real email address.`,
    }
  }

  try {
    const records = await resolveMx(domain)
    const hasWorkingMailServer =
      records &&
      records.length > 0 &&
      records.some((record) => record.exchange !== '.' && record.exchange !== '')
    if (!hasWorkingMailServer) {
      return {
        valid: false,
        reason: `Email domain "@${domain}" does not have a working mail server (MX records).`,
      }
    }
  } catch {
    return {
      valid: false,
      reason: `Email domain "@${domain}" does not exist or cannot receive emails.`,
    }
  }

  return { valid: true }
}
