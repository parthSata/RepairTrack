import { eq } from 'drizzle-orm'
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@/server/db'
import {
  accounts,
  sessions,
  shops,
  users,
  verifications,
  betterAuthRateLimits,
} from '@/server/db/schema'
import {
  assertInviteSessionUser,
  getOAuthInviteToken,
  markInvitationAccepted,
  requirePendingInvitation,
} from '@/server/auth/invite-oauth'
import { readInviteToken, readShopName } from '@/server/auth/registration-logic'
import { sendAccountVerificationEmail } from '@/server/services/gmail.service'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      rateLimit: betterAuthRateLimits,
    },
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
  rateLimit: {
    storage: 'database',
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'OWNER',
        input: false,
      },
      status: {
        type: 'string',
        required: false,
        defaultValue: 'ACTIVE',
        input: false,
      },
      shopId: { type: 'string', required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const oauthInviteToken = await getOAuthInviteToken()
          if (oauthInviteToken) {
            const invitation = await requirePendingInvitation(
              oauthInviteToken,
              user.email,
            )
            // Google has verified this address and it matches the invitation, so no verification email.
            return {
              data: {
                ...user,
                role: invitation.role,
                shopId: invitation.shopId,
              },
            }
          }

          const bodyInviteToken = readInviteToken(context?.body)
          if (bodyInviteToken) {
            const invitation = await requirePendingInvitation(
              bodyInviteToken,
              user.email,
            )
            return {
              data: {
                ...user,
                role: invitation.role,
                shopId: invitation.shopId,
                status: 'ACTIVE',
                emailVerified: false,
              },
            }
          }

          const shopId = crypto.randomUUID()
          await db.insert(shops).values({
            id: shopId,
            name: readShopName(context?.body, user.name),
          })

          return {
            data: {
              ...user,
              role: 'OWNER',
              status: 'ACTIVE',
              shopId,
              emailVerified:
                context?.headers?.get('x-repairtrack-pending-registration') ===
                '1',
            },
          }
        },
        after: async () => {
          const inviteToken = await getOAuthInviteToken()
          if (inviteToken) await markInvitationAccepted(inviteToken)
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          const now = new Date()
          const accessToken = account.accessToken ?? crypto.randomUUID()
          const refreshToken = account.refreshToken ?? crypto.randomUUID()
          const accessTokenExpiresAt =
            account.accessTokenExpiresAt ??
            new Date(now.getTime() + 24 * 60 * 60 * 1000)
          const refreshTokenExpiresAt =
            account.refreshTokenExpiresAt ??
            new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

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
                message:
                  'Your account has been deactivated. Contact the owner for activation.',
              })
            }

            const inviteToken = await getOAuthInviteToken()
            if (inviteToken && dbUser)
              await assertInviteSessionUser(inviteToken, dbUser)
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

      // Throwing makes the resend endpoint report the failure; sign-up/sign-in only log it.
      const result = await sendAccountVerificationEmail({
        to: user.email,
        name: user.name,
        url,
      })
      if (!result.sent) {
        throw new APIError('SERVICE_UNAVAILABLE', {
          message:
            'We could not deliver a verification email to this address. Check the address and try again.',
        })
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
