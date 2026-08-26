import { eq } from 'drizzle-orm'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { db } from '@/server/db'
import { accounts, sessions, shops, users, verifications } from '@/server/db/schema'
import { sendEmail } from '@/server/services/gmail.service'

function readShopName(body: unknown, userName?: string): string {
  const nameStr = userName || 'Owner'
  const fallbackName = `${nameStr}'s shop`
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
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
  ].filter((origin): origin is string => Boolean(origin)),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'OWNER' },
      shopId: { type: 'string', required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          // Prevent duplicate account registration on the same email address across any auth method
          const [existing] = await db
            .select({ id: users.id, email: users.email, emailVerified: users.emailVerified })
            .from(users)
            .where(eq(users.email, user.email.trim()))

          if (existing) {
            throw new Error('An account with this email address already exists. Please sign in instead.')
          }

          const userShopId = (user as { shopId?: string }).shopId
          const isShopExisting = typeof userShopId === 'string' && userShopId.trim().length > 0
          const shopId = isShopExisting ? userShopId : crypto.randomUUID()

          if (!isShopExisting) {
            const shopName = readShopName(context?.body, user.name)
            await db.insert(shops).values({
              id: shopId,
              name: shopName,
            })
          }

          return {
            data: {
              ...user,
              role: (user as { role?: string }).role ?? 'OWNER',
              shopId,
              emailVerified: Boolean(user.emailVerified),
            },
          }
        },
        after: async (user) => {
          if (!user.emailVerified) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
            const url = `${appUrl}/verify-email?email=${encodeURIComponent(user.email)}`
            try {
              const result = await sendEmail({
                to: user.email,
                subject: 'Verify your RepairTrack email',
                html: `<p>Hi ${user.name},</p><p>Verify your email address to finish creating your RepairTrack shop.</p><p><a href="${url}">Verify email address</a></p><p>This link will expire soon.</p>`,
              })
              if (!result.sent) console.warn('Verification email not sent (Gmail API not connected)')
            } catch (err) {
              console.warn('Failed to send verification email for user:', err)
            }
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
        const result = await sendEmail({
          to: user.email,
          subject: 'Verify your RepairTrack email',
          html: `<p>Hi ${user.name},</p><p>Verify your email address to finish creating your RepairTrack shop.</p><p><a href="${url}">Verify email address</a></p><p>This link will expire soon.</p>`,
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

