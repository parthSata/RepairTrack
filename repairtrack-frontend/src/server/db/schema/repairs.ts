import { index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { shops } from './users'
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
    model: text('model').notNull(),
    serialNumber: text('serial_number'),
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
    status: repairStatusEnum('status').default('RECEIVED').notNull(),
    issueDescription: text('issue_description'),
    estimatedCost: integer('estimated_cost'),
    finalCost: integer('final_cost'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('repairs_shop_id_idx').on(table.shopId),
    index('repairs_customer_id_idx').on(table.customerId),
    index('repairs_status_idx').on(table.status),
  ],
)
