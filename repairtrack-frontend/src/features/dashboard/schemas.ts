import { z } from 'zod'

export const dashboardSummarySchema = z.object({
  todaysRepairs: z.number().int().nonnegative(),
  activeRepairs: z.number().int().nonnegative(),
  readyForPickup: z.number().int().nonnegative(),
  completedToday: z.number().int().nonnegative(),
})

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
