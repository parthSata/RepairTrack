import { bigint, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
})

// Better Auth stores lastRequest as epoch milliseconds — must be bigint (int overflows).
export const betterAuthRateLimits = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
})
