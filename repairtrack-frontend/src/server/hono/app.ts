import { Hono } from 'hono'
import { shopsRouter } from '@/server/hono/routes/shops'
import { emailCheckRouter } from '@/server/hono/routes/email-check'

export const app = new Hono()
	.get('/api/health', (context) => context.json({ status: 'ok' }))
	.route('/api/email-check', emailCheckRouter)
	.route('/api/shops', shopsRouter)
