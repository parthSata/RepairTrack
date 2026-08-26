import { eq } from 'drizzle-orm'
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@/server/db'
import { accounts, sessions, shops, users, verifications } from '@/server/db/schema'
import { sendEmail } from '@/server/services/gmail.service'
import { buildVerificationEmailHtml } from '@/server/services/email-templates'

function readShopName(body: unknown, userName: string) {
  const fallbackName = `${userName}'s shop`
  if (!body || typeof body !== 'object' || !('shopName' in body)) return fallbackName

  const shopName = (body as Record<string, unknown>).shopName
  if (typeof shopName !== 'string') return fallbackName

  const trimmedShopName = shopName.trim()
  if (trimmedShopName.length < 2 || trimmedShopName.length > 120) return fallbackName

  return trimmedShopName
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  account: {
    storeStateStrategy: 'cookie',
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    'http://localhost:3000',
    'http://192.168.1.8:3000',
  ].filter((origin): origin is string => Boolean(origin)),
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'OWNER' },
      status: { type: 'string', required: false, defaultValue: 'ACTIVE' },
      shopId: { type: 'string', required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const hasShopId = typeof user.shopId === 'string' && user.shopId.trim().length > 0
          const shopId = hasShopId ? (user.shopId as string) : crypto.randomUUID()

          if (!hasShopId) {
            await db.insert(shops).values({
              id: shopId,
              name: readShopName(context?.body, user.name),
            })
          }

          return {
            data: {
              ...user,
              role: user.role ?? 'OWNER',
              shopId,
              emailVerified: false,
            },
          }
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          const now = new Date()
          const accessToken = account.accessToken ?? crypto.randomUUID()
          const refreshToken = account.refreshToken ?? crypto.randomUUID()
          const accessTokenExpiresAt = account.accessTokenExpiresAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000)
          const refreshTokenExpiresAt = account.refreshTokenExpiresAt ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

          return {
            data: {
              ...account,
              accessToken,
              refreshToken,
              accessTokenExpiresAt,
              refreshTokenExpiresAt,
            },
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if (session.userId) {
            const dbUser = await db.query.users.findFirst({
              where: eq(users.id, session.userId),
            })
            if (dbUser?.status === 'INACTIVE') {
              throw new APIError('FORBIDDEN', {
                message: 'Your account has been deactivated. Contact the owner for activation.',
              })
            }

            const userAccounts = await db
              .select()
              .from(accounts)
              .where(eq(accounts.userId, session.userId))

            for (const account of userAccounts) {
              if (!account.accessToken || !account.refreshToken) {
                const now = new Date()
                await db
                  .update(accounts)
                  .set({
                    accessToken: account.accessToken ?? crypto.randomUUID(),
                    refreshToken: account.refreshToken ?? crypto.randomUUID(),
                    accessTokenExpiresAt: account.accessTokenExpiresAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000),
                    refreshTokenExpiresAt: account.refreshTokenExpiresAt ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    updatedAt: now,
                  })
                  .where(eq(accounts.id, account.id))
              }
            }
          }
        },
      },
    },
  },
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (user.emailVerified) {
        return
      }

      try {
        const html = buildVerificationEmailHtml({ name: user.name, url })
        const result = await sendEmail({
          to: user.email,
          subject: 'Verify your RepairTrack email',
          html,
        })
        if (!result.sent) console.warn('Verification email not sent (Gmail API not connected)')
      } catch (err) {
        console.warn('Failed to send verification email:', err)
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      accessType: 'offline',
      prompt: 'consent',
    },
  },
})
