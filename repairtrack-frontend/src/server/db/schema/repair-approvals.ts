import { relations, sql } from 'drizzle-orm'
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'
import { repairs } from './repairs'

export const repairApprovalStatusEnum = pgEnum('repair_approval_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
])

export const repairApprovals = pgTable(
  'repair_approvals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    status: repairApprovalStatusEnum('status').notNull(),
    additionalEstimatedCost: integer('additional_estimated_cost').notNull(),
    diagnosisSnapshot: text('diagnosis_snapshot').notNull(),
    requestedBy: text('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('repair_approvals_repair_id_idx').on(table.repairId),
    index('repair_approvals_repair_id_requested_at_idx').on(table.repairId, table.requestedAt),
    uniqueIndex('repair_approvals_one_pending_per_repair_idx')
      .on(table.repairId)
      .where(sql`${table.status} = 'PENDING'`),
  ],
)

export const repairApprovalsRelations = relations(repairApprovals, ({ one }) => ({
  repair: one(repairs, { fields: [repairApprovals.repairId], references: [repairs.id] }),
  requestedByUser: one(users, { fields: [repairApprovals.requestedBy], references: [users.id] }),
}))
