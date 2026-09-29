import { Hono } from 'hono'
import { auth } from '@/server/auth'
import { shopsRouter } from '@/server/hono/routes/shops'
import { emailCheckRouter } from '@/server/hono/routes/email-check'
import { customersRouter } from '@/server/hono/routes/customers'
import { devicesRouter } from '@/server/hono/routes/devices'
import { repairsRouter } from '@/server/hono/routes/repairs'
import { dashboardRouter } from '@/server/hono/routes/dashboard'
import { staffRouter } from '@/server/hono/routes/staff'
import { invitationsRouter } from '@/server/hono/routes/invitations'
import { trackRouter } from '@/server/hono/routes/track'
import { inventoryRouter } from '@/server/hono/routes/inventory'
import { invoicesRouter } from '@/server/hono/routes/invoices'
import { paymentsRouter } from '@/server/hono/routes/payments'
import { handleApiError, handleApiNotFound } from '@/server/hono/error-handler'

export const app = new Hono()
	.onError(handleApiError)
	.notFound(handleApiNotFound)
	.get('/api/health', (context) => context.json({ status: 'ok' }))
	.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
	.route('/api/email-check', emailCheckRouter)
	.route('/api/track', trackRouter)
	.route('/api/shops', shopsRouter)
	.route('/api/customers', customersRouter)
	.route('/api/devices', devicesRouter)
	.route('/api/dashboard', dashboardRouter)
	.route('/api/repairs', repairsRouter)
	.route('/api/staff', staffRouter)
	.route('/api/invitations', invitationsRouter)
	.route('/api/inventory', inventoryRouter)
	.route('/api/invoices', invoicesRouter)
	.route('/api/payments', paymentsRouter)



