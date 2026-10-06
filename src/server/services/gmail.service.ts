import 'server-only'
import { google } from 'googleapis'
import { buildRawEmail } from '@/server/email/raw-message'
import { buildVerificationEmailHtml } from '@/server/services/email-templates'

/** `shopEmail` is the shop's public contact address, used as Reply-To on customer emails. */
export type GmailSender = { name: string; email: string; refreshToken: string; shopEmail?: string | null }

export type EmailMessage = { to: string; subject: string; html: string; replyTo?: string }

export type SendEmailResult =
  | { sent: true; messageId: string | null }
  | { sent: false; reason: 'not_configured' | 'invalid_grant' | 'send_failed'; error: string }

const NOT_CONFIGURED_ERROR = 'Gmail is not configured'

export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send'
export const GMAIL_SCOPES = [GMAIL_SEND_SCOPE, 'openid', 'email']

/** One OAuth app serves every sender. `null` when the Gmail env vars are missing. */
export function createGmailOAuthClient() {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return new google.auth.OAuth2(clientId, clientSecret, process.env.GMAIL_REDIRECT_URI)
}

function isInvalidGrant(err: unknown) {
  const data = (err as { response?: { data?: { error?: unknown } } })?.response?.data
  return data?.error === 'invalid_grant' || (err instanceof Error && err.message.includes('invalid_grant'))
}

export async function sendEmail(sender: GmailSender, message: EmailMessage): Promise<SendEmailResult> {
  const auth = createGmailOAuthClient()
  if (!auth) return { sent: false, reason: 'not_configured', error: NOT_CONFIGURED_ERROR }
  auth.setCredentials({ refresh_token: sender.refreshToken })

  try {
    const { data } = await google.gmail({ version: 'v1', auth }).users.messages.send({
      userId: 'me',
      requestBody: {
        raw: buildRawEmail({ fromName: sender.name, fromEmail: sender.email, ...message }),
      },
    })
    return { sent: true, messageId: data.id ?? null }
  } catch (err) {
    const reason = isInvalidGrant(err) ? 'invalid_grant' : 'send_failed'
    const error = err instanceof Error ? err.message : String(err)
    console.warn(`Gmail send failed (${reason}) from ${sender.email}:`, error)
    return { sent: false, reason, error }
  }
}

// The .env mailbox is the platform sender, reserved for account verification.
// Shop emails must use that shop's connected Gmail, never this sender.
function getPlatformSender(): GmailSender | null {
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  const email = process.env.GMAIL_USER
  return refreshToken && email ? { name: 'RepairTrack', email, refreshToken } : null
}

export async function sendAccountVerificationEmail({
  to,
  name,
  url,
}: {
  to: string
  name: string
  url: string
}): Promise<SendEmailResult> {
  const sender = getPlatformSender()
  if (!sender) {
    console.warn('Verification email not sent: platform Gmail sender is not configured')
    return { sent: false, reason: 'not_configured', error: NOT_CONFIGURED_ERROR }
  }

  return sendEmail(sender, {
    to,
    subject: 'Verify your RepairTrack email',
    html: buildVerificationEmailHtml({ name, url }),
  })
}
