import { relations } from 'drizzle-orm'
import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { shops, users } from './users'
import { repairs } from './repairs'

export const repairAssignmentStatusEnum = pgEnum('repair_assignment_status', [
  'ACTIVE',
  'ON_HOLD',
  'REASSIGNED',
  'COMPLETED',
])

export const repairAssignments = pgTable(
  'repair_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    technicianId: text('technician_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: repairAssignmentStatusEnum('status').notNull().default('ACTIVE'),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
    heldAt: timestamp('held_at', { withTimezone: true }),
    heldReason: text('held_reason'),
    reassignedAt: timestamp('reassigned_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('repair_assignments_shop_id_idx').on(table.shopId),
    index('repair_assignments_repair_id_idx').on(table.repairId),
    index('repair_assignments_technician_id_status_idx').on(table.technicianId, table.status),
  ],
)

export const repairAssignmentsRelations = relations(repairAssignments, ({ one }) => ({
  shop: one(shops, { fields: [repairAssignments.shopId], references: [shops.id] }),
  repair: one(repairs, { fields: [repairAssignments.repairId], references: [repairs.id] }),
  technician: one(users, {
    fields: [repairAssignments.technicianId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [repairAssignments.createdBy],
    references: [users.id],
  }),
}))
