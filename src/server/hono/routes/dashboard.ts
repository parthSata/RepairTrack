import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/server/auth'
import { resolveUserRole } from '@/server/lib/session-role'
import { getDashboardSummary } from '@/server/services/dashboard.service'

const DASHBOARD_ROLES = new Set(['OWNER', 'STAFF', 'TECHNICIAN'])

async function requireDashboardSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })
  const shopId = session.user.shopId
  if (!shopId) throw new HTTPException(403, { message: 'Shop context missing' })
  const userRole = await resolveUserRole(session.user.id, session.user.role)
  if (!DASHBOARD_ROLES.has(userRole)) {
    throw new HTTPException(403, { message: 'Not authorized to view dashboard' })
  }
  return { shopId, userId: session.user.id, userRole }
}

export const dashboardRouter = new Hono().get('/summary', async (c) => {
  const { shopId, userId, userRole } = await requireDashboardSession(c.req.raw)
  const summary = await getDashboardSummary({ shopId, userId, userRole })
  return c.json(summary)
})
