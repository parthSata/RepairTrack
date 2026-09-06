import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { acceptInvitationSchema } from '@/features/staff/schemas'
import { acceptInvitation, getInvitationByToken } from '@/server/services/staff.service'

const invitationsRouter = new Hono()

invitationsRouter.get('/:token', async (c) => {
  const token = c.req.param('token')
  const invitation = await getInvitationByToken(token)
  if (!invitation) {
    throw new HTTPException(404, { message: 'Invitation not found or expired' })
  }
  return c.json(invitation)
})

invitationsRouter.post(
  '/:token/accept',
  zValidator('json', acceptInvitationSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  }),
  async (c) => {
    const token = c.req.param('token')
    const input = c.req.valid('json')
    const result = await acceptInvitation(token, input)
    return c.json(result)
  },
)

export { invitationsRouter }
