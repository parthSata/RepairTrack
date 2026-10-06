import { randomBytes } from 'node:crypto'
import { zValidator } from '@hono/zod-validator'
import { Hono, type Context } from 'hono'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import {
  GMAIL_SETTINGS_PATH,
  gmailCallbackQuerySchema,
  type GmailCallbackResult,
} from '@/features/gmail/schemas'
import { requireRole } from '@/server/hono/session'
import { sendGmailTestEmail } from '@/server/services/email.service'
import {
  buildGmailAuthUrl,
  connectGmail,
  disconnectGmail,
  getGmailConnection,
} from '@/server/services/gmail-connection.service'

const STATE_COOKIE = 'gmail_oauth_state'
const STATE_COOKIE_OPTIONS = {
  path: '/api/settings/gmail',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge: 10 * 60,
} as const

const gmailRouter = new Hono()

const requireOwner = (request: Request) =>
  requireRole(request, ['OWNER'], 'Only the shop owner can manage Gmail')

function getStateSecret() {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not set')
  return secret
}

const redirectToSettings = (c: Context, result: GmailCallbackResult) =>
  c.redirect(`${GMAIL_SETTINGS_PATH}?gmail=${result}`)

/** Browser-navigation routes redirect back to Settings instead of rendering a JSON error. */
async function redirectOnError(c: Context, action: () => Promise<Response>) {
  try {
    return await action()
  } catch (err) {
    console.error(`[api] ${c.req.method} ${c.req.path}`, err instanceof Error ? err.message : err)
    return redirectToSettings(c, 'failed')
  }
}

// STAFF read the status for the repair-page warning; the connected address stays owner-only.
gmailRouter.get('/', async (c) => {
  const { shopId, role } = await requireRole(
    c.req.raw,
    ['OWNER', 'STAFF'],
    'Only the shop owner or staff can view the Gmail status',
  )
  const connection = await getGmailConnection(shopId)
  return c.json(role === 'OWNER' ? connection : { ...connection, email: null, connectedAt: null })
})

gmailRouter.get('/connect', (c) =>
  redirectOnError(c, async () => {
    await requireOwner(c.req.raw)
    const state = randomBytes(32).toString('base64url')
    const authUrl = buildGmailAuthUrl(state)
    await setSignedCookie(c, STATE_COOKIE, state, getStateSecret(), STATE_COOKIE_OPTIONS)
    return c.redirect(authUrl)
  }),
)

gmailRouter.get(
  '/callback',
  zValidator('query', gmailCallbackQuerySchema, (result, c) => {
    if (!result.success) return redirectToSettings(c, 'failed')
  }),
  (c) =>
    redirectOnError(c, async () => {
      const { shopId } = await requireOwner(c.req.raw)
      const { code, state, error } = c.req.valid('query')
      const expectedState = await getSignedCookie(c, getStateSecret(), STATE_COOKIE)
      deleteCookie(c, STATE_COOKIE, { path: STATE_COOKIE_OPTIONS.path })

      if (error) return redirectToSettings(c, 'denied')
      if (!code || !state || !expectedState || state !== expectedState) {
        throw new Error('Gmail OAuth state mismatch')
      }
      return redirectToSettings(c, await connectGmail(shopId, code))
    }),
)

gmailRouter.post('/disconnect', async (c) => {
  const { shopId } = await requireOwner(c.req.raw)
  await disconnectGmail(shopId)
  return c.json({ success: true })
})

gmailRouter.post('/test', async (c) => {
  const { shopId, email } = await requireOwner(c.req.raw)
  await sendGmailTestEmail(shopId, email)
  return c.json({ success: true })
})

export { gmailRouter }
