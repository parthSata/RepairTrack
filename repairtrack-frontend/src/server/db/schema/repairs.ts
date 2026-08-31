import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { shops, users } from './users'
import { customers } from './customers'

export const repairStatusEnum = pgEnum('repair_status', [
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_FOR_APPROVAL',
  'APPROVED',
  'WAITING_FOR_PARTS',
  'IN_REPAIR',
  'QUALITY_CHECK',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
])

export const repairPriorityEnum = pgEnum('repair_priority', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
])

export const deviceTypeEnum = pgEnum('device_type', [
  'PHONE',
  'LAPTOP',
  'TABLET',
  'DESKTOP',
  'OTHER',
])

export const deviceConditionEnum = pgEnum('device_condition', [
  'GOOD',
  'FAIR',
  'POOR',
])

export const devices = pgTable(
  'devices',
  {
    id: text('id').primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    brand: text('brand').notNull(),
    model: text('model'),
    serialNumber: text('serial_number'),
    deviceType: deviceTypeEnum('device_type').default('PHONE').notNull(),
    condition: deviceConditionEnum('condition').default('GOOD').notNull(),
    accessories: text('accessories'),
    modelVerified: boolean('model_verified').default(true).notNull(),
    modelVerificationOverridden: boolean('model_verification_overridden').default(false).notNull(),
    modelVerificationNote: text('model_verification_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('devices_shop_id_idx').on(table.shopId),
    index('devices_customer_id_idx').on(table.customerId),
  ],
)

export const repairs = pgTable(
  'repairs',
  {
    id: text('id').primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    deviceId: text('device_id')
      .notNull()
      .references(() => devices.id, { onDelete: 'restrict' }),
    ticketNumber: text('ticket_number').notNull().unique(),
    trackingToken: text('tracking_token').unique(),
    status: repairStatusEnum('status').default('RECEIVED').notNull(),
    problemDescription: text('problem_description'),
    issueDescription: text('issue_description'),
    initialCondition: text('initial_condition'),
    diagnosis: text('diagnosis'),
    estimatedCost: integer('estimated_cost'),
    finalCost: integer('final_cost'),
    priority: repairPriorityEnum('priority').default('MEDIUM').notNull(),
    expectedCompletionDate: timestamp('expected_completion_date', { withTimezone: true }),
    assignedTechnicianId: text('assigned_technician_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('repairs_shop_id_idx').on(table.shopId),
    index('repairs_customer_id_idx').on(table.customerId),
    index('repairs_device_id_idx').on(table.deviceId),
    index('repairs_status_idx').on(table.status),
    index('repairs_assigned_technician_id_idx').on(table.assignedTechnicianId),
    index('repairs_tracking_token_idx').on(table.trackingToken),
  ],
)

export const repairNotes = pgTable(
  'repair_notes',
  {
    id: text('id').primaryKey(),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    note: text('note').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('repair_notes_repair_id_idx').on(table.repairId)],
)

export const repairStatusHistory = pgTable(
  'repair_status_history',
  {
    id: text('id').primaryKey(),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    fromStatus: repairStatusEnum('from_status'),
    toStatus: repairStatusEnum('to_status').notNull(),
    changedBy: text('changed_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('repair_status_history_repair_id_idx').on(table.repairId),
    index('repair_status_history_to_status_created_at_idx').on(table.toStatus, table.createdAt),
  ],
)

export const repairsRelations = relations(repairs, ({ one, many }) => ({
  shop: one(shops, { fields: [repairs.shopId], references: [shops.id] }),
  customer: one(customers, { fields: [repairs.customerId], references: [customers.id] }),
  device: one(devices, { fields: [repairs.deviceId], references: [devices.id] }),
  assignedTechnician: one(users, {
    fields: [repairs.assignedTechnicianId],
    references: [users.id],
  }),
  creator: one(users, { fields: [repairs.createdBy], references: [users.id] }),
  notes: many(repairNotes),
  statusHistory: many(repairStatusHistory),
}))

export const repairNotesRelations = relations(repairNotes, ({ one }) => ({
  repair: one(repairs, { fields: [repairNotes.repairId], references: [repairs.id] }),
  author: one(users, { fields: [repairNotes.authorId], references: [users.id] }),
}))

export const repairStatusHistoryRelations = relations(repairStatusHistory, ({ one }) => ({
  repair: one(repairs, { fields: [repairStatusHistory.repairId], references: [repairs.id] }),
  changedByUser: one(users, { fields: [repairStatusHistory.changedBy], references: [users.id] }),
}))


