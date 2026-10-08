import 'server-only'
import { and, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { after } from 'next/server'
import { db } from '@/server/db'
import { emailLogs, type EmailType } from '@/server/db/schema'
import { buildGmailTestEmailHtml } from '@/server/services/email-templates'
import { getGmailConnection, sendShopEmail } from '@/server/services/gmail-connection.service'
import { getShopById } from '@/server/services/shop.service'

export const EMAIL_SKIP_REASONS = {
  noRecipient: 'no_customer_email',
  notConnected: 'gmail_not_connected',
  alreadySent: 'already_sent',
} as const

type EmailSkipReason = (typeof EMAIL_SKIP_REASONS)[keyof typeof EMAIL_SKIP_REASONS]
type SendFailureReason = 'not_configured' | 'invalid_grant' | 'send_failed' | 'unexpected'

export type ShopEmailInput = {
  shopId: string
  repairId?: string | null
  type: EmailType
  to: string | null | undefined
  email: { subject: string; html: string }
  /** A SENT log with the same key in this shop skips the send; omit to always send. */
  dedupeKey?: string
}

export type EmailOutcome =
  | { status: 'SENT'; gmailMessageId: string | null }
  | { status: 'FAILED'; reason: SendFailureReason; error: string }
  | { status: 'SKIPPED'; skipReason: EmailSkipReason }

const TEST_EMAIL_ERRORS: Record<SendFailureReason | 'not_connected', [ContentfulStatusCode, string]> = {
  not_connected: [409, 'Connect Gmail before sending a test email.'],
  invalid_grant: [409, 'Gmail access was revoked. Reconnect Gmail and try again.'],
  not_configured: [503, 'Gmail is not configured'],
  send_failed: [502, 'Gmail could not send the test email'],
  unexpected: [502, 'Gmail could not send the test email'],
}

const DEFAULT_APP_URL = 'http://localhost:3000'

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

/** The reason code shown for a non-SENT outcome; matches `skip_reason` and the prefix of `error` in `email_logs`. */
export function getEmailOutcomeReason(outcome: EmailOutcome): EmailSkipReason | SendFailureReason | null {
  if (outcome.status === 'SKIPPED') return outcome.skipReason
  if (outcome.status === 'FAILED') return outcome.reason
  return null
}

export async function isAlreadySent(shopId: string, dedupeKey: string): Promise<boolean> {
  const [row] = await db
    .select({ id: emailLogs.id })
    .from(emailLogs)
    .where(and(eq(emailLogs.shopId, shopId), eq(emailLogs.dedupeKey, dedupeKey), eq(emailLogs.status, 'SENT')))
    .limit(1)
  return Boolean(row)
}

async function attemptSend(input: ShopEmailInput, to: string): Promise<EmailOutcome> {
  try {
    const result = await sendShopEmail(input.shopId, (sender) => ({
      to,
      ...input.email,
      replyTo: sender.shopEmail ?? undefined,
    }))
    if (result.sent) return { status: 'SENT', gmailMessageId: result.messageId }
    if (result.reason === 'not_connected') return { status: 'SKIPPED', skipReason: EMAIL_SKIP_REASONS.notConnected }
    return { status: 'FAILED', reason: result.reason, error: result.error }
  } catch (err) {
    return { status: 'FAILED', reason: 'unexpected', error: errorMessage(err) }
  }
}

async function resolveOutcome(input: ShopEmailInput, to: string | null): Promise<EmailOutcome> {
  if (!to) return { status: 'SKIPPED', skipReason: EMAIL_SKIP_REASONS.noRecipient }
  if (input.dedupeKey && (await isAlreadySent(input.shopId, input.dedupeKey))) {
    return { status: 'SKIPPED', skipReason: EMAIL_SKIP_REASONS.alreadySent }
  }
  return attemptSend(input, to)
}

/** A failed log write must not turn an email that was already sent into an error. */
async function writeLog(input: ShopEmailInput, to: string | null, outcome: EmailOutcome): Promise<void> {
  try {
    await db.insert(emailLogs).values({
      shopId: input.shopId,
      repairId: input.repairId ?? null,
      type: input.type,
      recipient: to,
      subject: input.email.subject,
      dedupeKey: input.dedupeKey ?? null,
      status: outcome.status,
      skipReason: outcome.status === 'SKIPPED' ? outcome.skipReason : null,
      error: outcome.status === 'FAILED' ? `${outcome.reason}: ${outcome.error}` : null,
      gmailMessageId: outcome.status === 'SENT' ? outcome.gmailMessageId : null,
    })
  } catch (err) {
    console.error(`email_logs insert failed (${input.type}, shop ${input.shopId}):`, errorMessage(err))
  }
}

/** Sends now, records the attempt in `email_logs`, and returns the outcome. */
export async function sendAndLogShopEmail(input: ShopEmailInput): Promise<EmailOutcome> {
  const to = input.to?.trim() || null
  const outcome = await resolveOutcome(input, to)
  await writeLog(input, to, outcome)
  return outcome
}

type QueuedShopEmailInput = Omit<ShopEmailInput, 'email'> & {
  email: ShopEmailInput['email'] | (() => ShopEmailInput['email'])
}

/**
 * Sends a shop email after the response is returned, so a slow or failing Gmail call never
 * delays or fails the action that triggered it. Never throws: outside a request `after()` throws,
 * a template builder may throw, and the action has usually already committed by then.
 */
export function queueShopEmail({ email, ...rest }: QueuedShopEmailInput): void {
  try {
    const input: ShopEmailInput = { ...rest, email: typeof email === 'function' ? email() : email }
    after(() =>
      sendAndLogShopEmail(input).catch((err) => {
        console.error(`Email ${input.type} for shop ${input.shopId} failed:`, errorMessage(err))
      }),
    )
  } catch (err) {
    console.error(`Email ${rest.type} for shop ${rest.shopId} could not be queued:`, errorMessage(err))
  }
}

export async function sendGmailTestEmail(shopId: string, to: string): Promise<void> {
  const [shop, connection] = await Promise.all([getShopById(shopId), getGmailConnection(shopId)])
  if (!shop) throw new HTTPException(404, { message: 'Shop not found' })

  const outcome = await sendAndLogShopEmail({
    shopId,
    type: 'TEST',
    to,
    email: {
      subject: `${shop.shopName}: Gmail connection test`,
      html: buildGmailTestEmailHtml({ shopName: shop.shopName, senderEmail: connection.email ?? '' }),
    },
  })
  if (outcome.status === 'SENT') return

  const [status, message] = TEST_EMAIL_ERRORS[outcome.status === 'FAILED' ? outcome.reason : 'not_connected']
  throw new HTTPException(status, { message })
}

export function buildTrackingUrl(trackingToken: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || DEFAULT_APP_URL
  return `${appUrl.replace(/\/+$/, '')}/track/${encodeURIComponent(trackingToken)}`
}
