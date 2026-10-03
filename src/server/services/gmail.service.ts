import 'server-only'
import { google } from 'googleapis'
import { buildRawEmail } from '@/server/email/raw-message'
import { buildVerificationEmailHtml } from '@/server/services/email-templates'

export type GmailSender = { name: string; email: string; refreshToken: string }

export type EmailMessage = { to: string; subject: string; html: string; replyTo?: string }

export type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'invalid_grant' | 'send_failed' }

function isInvalidGrant(err: unknown) {
  const data = (err as { response?: { data?: { error?: unknown } } })?.response?.data
  return data?.error === 'invalid_grant' || (err instanceof Error && err.message.includes('invalid_grant'))
}

export async function sendEmail(sender: GmailSender, message: EmailMessage): Promise<SendEmailResult> {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  if (!clientId || !clientSecret) return { sent: false, reason: 'not_configured' }

  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: sender.refreshToken })

  try {
    await google.gmail({ version: 'v1', auth }).users.messages.send({
      userId: 'me',
      requestBody: {
        raw: buildRawEmail({ fromName: sender.name, fromEmail: sender.email, ...message }),
      },
    })
    return { sent: true }
  } catch (err) {
    const reason = isInvalidGrant(err) ? 'invalid_grant' : 'send_failed'
    console.warn(`Gmail send failed (${reason}) from ${sender.email}:`, err instanceof Error ? err.message : err)
    return { sent: false, reason }
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
    return { sent: false, reason: 'not_configured' }
  }

  return sendEmail(sender, {
    to,
    subject: 'Verify your RepairTrack email',
    html: buildVerificationEmailHtml({ name, url }),
  })
}
