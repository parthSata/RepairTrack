import { Hono } from 'hono'
import { auth } from '@/server/auth'
import { shopsRouter } from '@/server/hono/routes/shops'
import { emailCheckRouter } from '@/server/hono/routes/email-check'
import { customersRouter } from '@/server/hono/routes/customers'
import { devicesRouter } from '@/server/hono/routes/devices'
import { repairsRouter } from '@/server/hono/routes/repairs'
import { staffRouter } from '@/api/routes/staff'
import { invitationsRouter } from '@/api/routes/invitations'

export const app = new Hono()
	.get('/api/health', (context) => context.json({ status: 'ok' }))
	.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
	.route('/api/email-check', emailCheckRouter)
	.route('/api/shops', shopsRouter)
	.route('/api/customers', customersRouter)
	.route('/api/devices', devicesRouter)
	.route('/api/repairs', repairsRouter)
	.route('/api/staff', staffRouter)
	.route('/api/invitations', invitationsRouter)



