import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { pendingRegistrations, users } from '@/server/db/schema'
import {
  decryptPendingRegistrationPassword,
  encryptPendingRegistrationPassword,
} from '@/server/crypto/encrypt'
import { sendAccountVerificationEmail } from '@/server/services/gmail.service'
import type { RegisterInput } from '@/features/auth/schemas'

const PENDING_REGISTRATION_TTL_MS = 30 * 60 * 1000
type SignUpEmailBody = Parameters<
  typeof auth.api.signUpEmail
>[0] extends infer Input
  ? Input extends { body: infer Body }
    ? Body
    : never
  : never

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

function createVerificationToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createPendingRegistration(
  input: RegisterInput,
): Promise<void> {
  const token = createVerificationToken()
  const expiresAt = new Date(Date.now() + PENDING_REGISTRATION_TTL_MS)
  const email = input.email.toLowerCase()

  await db
    .insert(pendingRegistrations)
    .values({
      id: crypto.randomUUID(),
      email,
      ownerName: input.ownerName,
      shopName: input.shopName,
      passwordEncrypted: encryptPendingRegistrationPassword(input.password),
      tokenHash: hashToken(token),
      expiresAt,
    })
    .onConflictDoUpdate({
      target: pendingRegistrations.email,
      set: {
        ownerName: input.ownerName,
        shopName: input.shopName,
        passwordEncrypted: encryptPendingRegistrationPassword(input.password),
        tokenHash: hashToken(token),
        expiresAt,
        processingAt: null,
        updatedAt: new Date(),
      },
    })

  const result = await sendAccountVerificationEmail({
    to: email,
    name: input.ownerName,
    url: `${getAppUrl()}/verify-email?registrationToken=${encodeURIComponent(token)}`,
  })

  if (!result.sent) {
    await db
      .delete(pendingRegistrations)
      .where(eq(pendingRegistrations.email, email))
    throw new HTTPException(503, {
      message:
        'We could not deliver a verification email to this address. Check the address and try again.',
    })
  }
}

export async function resendPendingRegistration(email: string): Promise<void> {
  const pending = await db.query.pendingRegistrations.findFirst({
    where: and(
      eq(pendingRegistrations.email, email.toLowerCase()),
      gt(pendingRegistrations.expiresAt, new Date()),
      isNull(pendingRegistrations.processingAt),
    ),
  })
  if (!pending) return

  const token = createVerificationToken()
  const expiresAt = new Date(Date.now() + PENDING_REGISTRATION_TTL_MS)
  await db
    .update(pendingRegistrations)
    .set({ tokenHash: hashToken(token), expiresAt, updatedAt: new Date() })
    .where(eq(pendingRegistrations.id, pending.id))

  const result = await sendAccountVerificationEmail({
    to: pending.email,
    name: pending.ownerName,
    url: `${getAppUrl()}/verify-email?registrationToken=${encodeURIComponent(token)}`,
  })

  if (!result.sent) {
    throw new HTTPException(503, {
      message:
        'We could not deliver a verification email to this address. Check the address and try again.',
    })
  }
}

export async function completePendingRegistration(
  token: string,
): Promise<void> {
  const now = new Date()
  const tokenHash = hashToken(token)
  const [pending] = await db
    .update(pendingRegistrations)
    .set({ processingAt: now, updatedAt: now })
    .where(
      and(
        eq(pendingRegistrations.tokenHash, tokenHash),
        gt(pendingRegistrations.expiresAt, now),
        isNull(pendingRegistrations.processingAt),
      ),
    )
    .returning()

  if (!pending) {
    const inFlight = await db.query.pendingRegistrations.findFirst({
      where: and(
        eq(pendingRegistrations.tokenHash, tokenHash),
        gt(pendingRegistrations.expiresAt, now),
      ),
    })

    if (
      inFlight?.processingAt &&
      Date.now() - inFlight.processingAt.getTime() < 30_000
    ) {
      for (let i = 0; i < 6; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const user = await db.query.users.findFirst({
          where: eq(users.email, inFlight.email),
          columns: { id: true, emailVerified: true },
        })
        if (user?.emailVerified) {
          return
        }
      }
    }

    throw new HTTPException(400, {
      message:
        'This verification link is invalid, has expired, or has already been used.',
    })
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, pending.email),
      columns: { id: true },
    })
    if (existingUser) {
      throw new HTTPException(400, {
        message: 'Unable to complete registration. Please try again.',
      })
    }

    const password = decryptPendingRegistrationPassword(
      pending.passwordEncrypted,
    )
    const signUpBody = {
      email: pending.email,
      password,
      name: pending.ownerName,
      shopName: pending.shopName,
      callbackURL: '/dashboard',
    } as SignUpEmailBody
    const result = await auth.api.signUpEmail({
      body: signUpBody,
      headers: new Headers({ 'x-repairtrack-pending-registration': '1' }),
    })

    if (!result.user) throw new Error('Unable to create account')

    await db
      .delete(pendingRegistrations)
      .where(eq(pendingRegistrations.id, pending.id))
  } catch (error: unknown) {
    await db
      .update(pendingRegistrations)
      .set({ processingAt: null, updatedAt: new Date() })
      .where(eq(pendingRegistrations.id, pending.id))
    if (error instanceof HTTPException) throw error
    throw new HTTPException(400, {
      message: 'Unable to complete registration. Please try again.',
    })
  }
}
