import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { auth } from '@/server/auth'
import { eq } from 'drizzle-orm'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import { resolveUserRole } from '@/server/lib/session-role'
import { getDashboardSummary } from '@/server/services/dashboard.service'
import { getAnalyticsPeriod, getRevenueAnalytics } from '@/server/services/dashboard-analytics.service'
import { analyticsQuerySchema } from '@/features/dashboard/schemas'
import { jsonError } from '@/server/hono/error-handler'

const DASHBOARD_ROLES = ['OWNER', 'STAFF', 'TECHNICIAN'] as const
const ANALYTICS_ROLES = ['OWNER', 'STAFF'] as const

async function requireDashboardSession(request: Request, roles: readonly string[]) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new HTTPException(401, { message: 'Unauthorized' })

  let shopId = session.user.shopId
  let role = session.user.role

  if (!shopId || !role) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true, shopId: true },
    })
    shopId = shopId ?? dbUser?.shopId
    role = role ?? dbUser?.role
  }

  if (!shopId) throw new HTTPException(403, { message: 'Shop context missing' })

  const userRole = await resolveUserRole(session.user.id, role)
  if (!roles.includes(userRole)) {
    const message =
      roles === ANALYTICS_ROLES
        ? 'Not authorized to view analytics'
        : 'Not authorized to view dashboard'
    throw new HTTPException(403, { message })
  }
  return { shopId, userId: session.user.id, userRole }
}

export const dashboardRouter = new Hono()
  .get('/summary', async (c) => {
    const { shopId, userId, userRole } = await requireDashboardSession(c.req.raw, DASHBOARD_ROLES)
    const summary = await getDashboardSummary({ shopId, userId, userRole })
    return c.json(summary)
  })
  .get(
    '/analytics/period',
    zValidator('query', analyticsQuerySchema, (result, c) => {
      if (!result.success) {
        return jsonError(c, 400, 'Invalid analytics period', 'VALIDATION_ERROR')
      }
    }),
    async (c) => {
      await requireDashboardSession(c.req.raw, ANALYTICS_ROLES)
      const { period } = c.req.valid('query')
      const range = getAnalyticsPeriod(period)
      return c.json({
        period,
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        previousStart: range.previousStart.toISOString(),
        previousEnd: range.previousEnd.toISOString(),
      })
    },
  )
  .get(
    '/analytics/revenue',
    zValidator('query', analyticsQuerySchema, (result, c) => {
      if (!result.success) {
        return jsonError(c, 400, 'Invalid analytics period', 'VALIDATION_ERROR')
      }
    }),
    async (c) => {
      const { shopId } = await requireDashboardSession(c.req.raw, ANALYTICS_ROLES)
      const { period } = c.req.valid('query')
      const revenue = await getRevenueAnalytics(shopId, period)
      return c.json(revenue)
    },
  )


