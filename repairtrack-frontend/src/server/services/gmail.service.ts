import 'server-only'
import { google } from 'googleapis'

type EmailMessage = { to: string; subject: string; html: string }

function getGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  const sender = process.env.GMAIL_USER

  if (!clientId || !clientSecret || !refreshToken || !sender) return null

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground',
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  return { gmail: google.gmail({ version: 'v1', auth: oauth2Client }), sender }
}

function encodeMessage({ to, subject, html }: EmailMessage, sender: string) {
  const message = [
    `From: RepairTrack <${sender}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n')

  return Buffer.from(message).toString('base64url')
}

export async function sendEmail(message: EmailMessage) {
  const client = getGmailClient()
  if (!client) return { sent: false, reason: 'not_configured' as const }

  await client.gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodeMessage(message, client.sender) },
  })

  return { sent: true as const }
}