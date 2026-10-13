import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { requireRole } from '@/server/hono/session'
import { getDashboardSummary } from '@/server/services/dashboard.service'
import {
  getAnalyticsPeriod,
  getPartsAnalytics,
  getRepairAnalytics,
  getRevenueAnalytics,
} from '@/server/services/dashboard-analytics.service'
import { analyticsQuerySchema } from '@/features/dashboard/schemas'
import { jsonError } from '@/server/hono/error-handler'

const DASHBOARD_ROLES = ['OWNER', 'STAFF', 'TECHNICIAN'] as const
const ANALYTICS_ROLES = ['OWNER', 'STAFF'] as const

export const dashboardRouter = new Hono()
  .get('/summary', async (c) => {
    const { shopId, userId, userRole } = await requireRole(
      c.req.raw,
      DASHBOARD_ROLES,
      'Not authorized to view dashboard',
    )
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
      await requireRole(c.req.raw, ANALYTICS_ROLES, 'Not authorized to view analytics')
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
      const { shopId } = await requireRole(
        c.req.raw,
        ANALYTICS_ROLES,
        'Not authorized to view analytics',
      )
      const { period } = c.req.valid('query')
      const revenue = await getRevenueAnalytics(shopId, period)
      return c.json(revenue)
    },
  )
  .get(
    '/analytics/repairs',
    zValidator('query', analyticsQuerySchema, (result, c) => {
      if (!result.success) {
        return jsonError(c, 400, 'Invalid analytics period', 'VALIDATION_ERROR')
      }
    }),
    async (c) => {
      const { shopId } = await requireRole(
        c.req.raw,
        ANALYTICS_ROLES,
        'Not authorized to view analytics',
      )
      const { period } = c.req.valid('query')
      const repairsData = await getRepairAnalytics(shopId, period)
      return c.json(repairsData)
    },
  )
  .get(
    '/analytics/parts',
    zValidator('query', analyticsQuerySchema, (result, c) => {
      if (!result.success) {
        return jsonError(c, 400, 'Invalid analytics period', 'VALIDATION_ERROR')
      }
    }),
    async (c) => {
      const { shopId } = await requireRole(
        c.req.raw,
        ANALYTICS_ROLES,
        'Not authorized to view analytics',
      )
      const { period } = c.req.valid('query')
      const partsData = await getPartsAnalytics(shopId, period)
      return c.json(partsData)
    },
  )

