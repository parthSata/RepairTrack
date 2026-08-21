import { Hono } from 'hono'

export const app = new Hono().get('/api/health', (context) => {
	return context.json({ status: 'ok' })
})
