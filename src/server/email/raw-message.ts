type RawEmailInput = {
  fromName: string
  fromEmail: string
  to: string
  replyTo?: string
  subject: string
  html: string
}

// Stripping CR/LF stops user-supplied values from injecting extra headers.
function headerValue(value: string) {
  return value.replace(/[\r\n]/g, '').trim()
}

// RFC 2047 encoded-word, so non-ASCII names and subjects survive mail transport.
function encodeWord(value: string) {
  return `=?UTF-8?B?${Buffer.from(headerValue(value), 'utf8').toString('base64')}?=`
}

// Formats display-name <email> per RFC 5322 and RFC 2047.
// ASCII names use standard quoted-string format ("Name" <email>) so that Gmail
// and other mail clients recognize and display the custom sender name (e.g. "RepairTrack")
// instead of rejecting the encoded-word and falling back to the account profile name.
function formatAddress(name: string, email: string): string {
  const cleanEmail = headerValue(email)
  const cleanName = headerValue(name)
  if (!cleanName) return cleanEmail

  if (/[^\x20-\x7E]/.test(cleanName)) {
    return `${encodeWord(cleanName)} <${cleanEmail}>`
  }

  const sanitized = cleanName.replace(/["\\]/g, '')
  return `"${sanitized}" <${cleanEmail}>`
}

// RFC 2045 limits base64 body lines to 76 characters.
function toWrappedBase64(value: string) {
  return (Buffer.from(value, 'utf8').toString('base64').match(/.{1,76}/g) ?? []).join('\r\n')
}

export function buildRawEmail({ fromName, fromEmail, to, replyTo, subject, html }: RawEmailInput) {
  const headers = [
    `From: ${formatAddress(fromName, fromEmail)}`,
    `To: ${headerValue(to)}`,
    ...(replyTo ? [`Reply-To: ${headerValue(replyTo)}`] : []),
    `Subject: ${encodeWord(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ]

  const message = [...headers, '', toWrappedBase64(html)].join('\r\n')
  return Buffer.from(message, 'utf8').toString('base64url')
}
