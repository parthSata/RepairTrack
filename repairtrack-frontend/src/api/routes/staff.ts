import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { changeStaffRoleSchema, inviteStaffSchema, setStaffStatusSchema } from '@/features/staff/schemas'
import { auth } from '@/server/auth'
import { changeStaffRole, getTechnicians, inviteStaff, listStaff, setStaffStatus } from '@/server/services/staff.service'

const staffRouter = new Hono()

async function ownerSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  if (session.user.role !== 'OWNER' || !session.user.shopId) {
    throw new HTTPException(403, { message: 'Forbidden: Only shop owners can manage staff' })
  }
  return { session, shopId: session.user.shopId, userId: session.user.id }
}

async function shopUserSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  if (!session.user.shopId) {
    throw new HTTPException(403, { message: 'Shop context missing' })
  }
  return { session, shopId: session.user.shopId, userId: session.user.id }
}

staffRouter.get('/', async (c) => {
  const { shopId } = await ownerSession(c.req.raw)
  const staffList = await listStaff(shopId)
  return c.json(staffList)
})

staffRouter.get('/technicians', async (c) => {
  const { shopId } = await shopUserSession(c.req.raw)
  const techs = await getTechnicians(shopId)
  return c.json(techs)
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

staffRouter.patch(
  '/:id/status',
  zValidator('json', setStaffStatusSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await ownerSession(c.req.raw)
    const targetId = c.req.param('id')
    const { status } = c.req.valid('json')
    const result = await setStaffStatus(shopId, targetId, status)
    return c.json(result)
  },
)

staffRouter.patch(
  '/:id/role',
  zValidator('json', changeStaffRoleSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const { shopId } = await ownerSession(c.req.raw)
    const targetId = c.req.param('id')
    const { role } = c.req.valid('json')
    const result = await changeStaffRole(shopId, targetId, role)
    return c.json(result)
  },
)

export { staffRouter }
