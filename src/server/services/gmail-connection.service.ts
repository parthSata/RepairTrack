import 'server-only'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { GmailConnectionResponse } from '@/features/gmail/schemas'
import { decrypt, encrypt } from '@/server/crypto/encrypt'
import { db } from '@/server/db'
import { gmailConnections, shops } from '@/server/db/schema'
import { buildGmailTestEmailHtml } from '@/server/services/email-templates'
import {
  createGmailOAuthClient,
  GMAIL_SCOPES,
  GMAIL_SEND_SCOPE,
  sendEmail,
  type EmailMessage,
  type GmailSender,
  type SendEmailResult,
} from '@/server/services/gmail.service'

export type SendShopEmailResult = SendEmailResult | { sent: false; reason: 'not_connected' }
type SendShopEmailFailure = Extract<SendShopEmailResult, { sent: false }>['reason']

const TEST_EMAIL_ERRORS: Record<SendShopEmailFailure, [ContentfulStatusCode, string]> = {
  not_connected: [409, 'Connect Gmail before sending a test email.'],
  invalid_grant: [409, 'Gmail access was revoked. Reconnect Gmail and try again.'],
  not_configured: [503, 'Gmail is not configured'],
  send_failed: [502, 'Gmail could not send the test email'],
}

function requireOAuthClient() {
  const client = createGmailOAuthClient()
  if (!client) throw new HTTPException(503, { message: 'Gmail is not configured' })
  return client
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

/** Best effort: a token Google already revoked must not block disconnecting. */
async function revokeRefreshToken(refreshTokenEncrypted: string) {
  try {
    await createGmailOAuthClient()?.revokeToken(decrypt(refreshTokenEncrypted))
  } catch (err) {
    console.warn('Gmail token revoke failed:', errorMessage(err))
  }
}

async function markNeedsReconnect(shopId: string) {
  await db
    .update(gmailConnections)
    .set({ status: 'NEEDS_RECONNECT', updatedAt: new Date() })
    .where(eq(gmailConnections.shopId, shopId))
}

export async function getGmailConnection(shopId: string): Promise<GmailConnectionResponse> {
  const [row] = await db
    .select({
      email: gmailConnections.email,
      status: gmailConnections.status,
      connectedAt: gmailConnections.connectedAt,
    })
    .from(gmailConnections)
    .where(eq(gmailConnections.shopId, shopId))
    .limit(1)

  if (!row) return { status: 'NOT_CONNECTED', email: null, connectedAt: null }
  return { status: row.status, email: row.email, connectedAt: row.connectedAt.toISOString() }
}

export function buildGmailAuthUrl(state: string): string {
  return requireOAuthClient().generateAuthUrl({
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
}

/** Exchanges the OAuth code and stores the encrypted refresh token for the shop. */
export async function connectGmail(shopId: string, code: string): Promise<'connected' | 'missing_scope'> {
  const client = requireOAuthClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.scope?.split(' ').includes(GMAIL_SEND_SCOPE)) return 'missing_scope'
  if (!tokens.refresh_token || !tokens.id_token) {
    throw new Error('Google did not return a refresh token or id token')
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GMAIL_CLIENT_ID,
  })
  const { email, email_verified: isEmailVerified } = ticket.getPayload() ?? {}
  if (!email || !isEmailVerified) throw new Error('Google account email is missing or unverified')

  const [previous] = await db
    .select({ email: gmailConnections.email, refreshTokenEncrypted: gmailConnections.refreshTokenEncrypted })
    .from(gmailConnections)
    .where(eq(gmailConnections.shopId, shopId))
    .limit(1)

  const now = new Date()
  const connection = {
    email,
    refreshTokenEncrypted: encrypt(tokens.refresh_token),
    status: 'CONNECTED' as const,
    connectedAt: now,
    updatedAt: now,
  }
  await db
    .insert(gmailConnections)
    .values({ shopId, ...connection })
    .onConflictDoUpdate({ target: gmailConnections.shopId, set: connection })

  // Revoking a token revokes the whole grant, so only revoke a different account's token.
  if (previous && previous.email !== email) await revokeRefreshToken(previous.refreshTokenEncrypted)
  return 'connected'
}

export async function disconnectGmail(shopId: string): Promise<void> {
  const [removed] = await db
    .delete(gmailConnections)
    .where(eq(gmailConnections.shopId, shopId))
    .returning({ refreshTokenEncrypted: gmailConnections.refreshTokenEncrypted })

  if (removed) await revokeRefreshToken(removed.refreshTokenEncrypted)
}

/** The shop's sending credentials, or `null` when Gmail isn't connected or needs reconnecting. */
export async function getShopGmailSender(shopId: string): Promise<GmailSender | null> {
  const [row] = await db
    .select({
      shopName: shops.name,
      email: gmailConnections.email,
      refreshTokenEncrypted: gmailConnections.refreshTokenEncrypted,
      status: gmailConnections.status,
    })
    .from(gmailConnections)
    .innerJoin(shops, eq(shops.id, gmailConnections.shopId))
    .where(eq(gmailConnections.shopId, shopId))
    .limit(1)

  if (!row || row.status !== 'CONNECTED') return null

  try {
    return { name: row.shopName, email: row.email, refreshToken: decrypt(row.refreshTokenEncrypted) }
  } catch (err) {
    console.warn(`Gmail token for shop ${shopId} could not be decrypted:`, errorMessage(err))
    await markNeedsReconnect(shopId)
    return null
  }
}

/** The single send path for shop emails; flags the connection when Google revokes access. */
export async function sendShopEmail(
  shopId: string,
  buildMessage: (sender: GmailSender) => EmailMessage,
): Promise<SendShopEmailResult> {
  const sender = await getShopGmailSender(shopId)
  if (!sender) return { sent: false, reason: 'not_connected' }

  const result = await sendEmail(sender, buildMessage(sender))
  if (!result.sent && result.reason === 'invalid_grant') await markNeedsReconnect(shopId)
  return result
}

export async function sendGmailTestEmail(shopId: string, to: string): Promise<void> {
  const result = await sendShopEmail(shopId, (sender) => ({
    to,
    subject: `${sender.name}: Gmail connection test`,
    html: buildGmailTestEmailHtml({ shopName: sender.name, senderEmail: sender.email }),
  }))
  if (result.sent) return

  const [status, message] = TEST_EMAIL_ERRORS[result.reason]
  throw new HTTPException(status, { message })
}
