import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { inviteStaffSchema } from '@/features/staff/schemas'
import { auth } from '@/server/auth'
import { getTechnicians, inviteStaff } from '@/server/services/staff.service'

const staffRouter = new Hono()

async function ownerSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  if (session.user.role !== 'OWNER' || !session.user.shopId) {
    throw new HTTPException(403, { message: 'Forbidden: Only shop owners can invite staff' })
  }
  return { session, shopId: session.user.shopId, userId: session.user.id }
}

async function requireStaffAccess(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const role = session.user.role ?? 'OWNER'
  const shopId = session.user.shopId
  if (!['OWNER', 'STAFF'].includes(role) || !shopId) {
    throw new HTTPException(403, { message: 'Not authorized' })
  }
  return { session, shopId }
}

staffRouter.get('/technicians', async (c) => {
  const { shopId } = await requireStaffAccess(c.req.raw)
  const technicians = await getTechnicians(shopId)
  return c.json(technicians)
})

staffRouter.post(
  '/invite',
  zValidator('json', inviteStaffSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId, userId } = await ownerSession(c.req.raw)
    const input = c.req.valid('json')
    const invitation = await inviteStaff(shopId, userId, input)
    return c.json(invitation)
  },
)

export { staffRouter }

