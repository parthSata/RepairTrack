import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
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
