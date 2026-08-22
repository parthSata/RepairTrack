import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { db } from '@/server/db'
import { accounts, sessions, users, verifications } from '@/server/db/schema'
import { sendEmail } from '@/server/services/gmail.service'

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
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const result = await sendEmail({
        to: user.email,
        subject: 'Verify your RepairTrack email',
        html: `<p>Hi ${user.name},</p><p>Verify your email address to finish creating your RepairTrack shop.</p><p><a href="${url}">Verify email address</a></p><p>This link will expire soon.</p>`,
      })
      if (!result.sent) throw new Error('Gmail email service is not configured')
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