import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { shops, users } from './users'
import { customers } from './customers'
import { repairs } from './repairs'

export const invoiceStatusEnum = pgEnum('invoice_status', ['ISSUED', 'CANCELLED'])

export const invoices = pgTable(
  'invoices',
  {
    id: text('id').primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'restrict' }),
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    invoiceNumber: text('invoice_number').notNull(),
    status: invoiceStatusEnum('status').default('ISSUED').notNull(),
    laborCharges: integer('labor_charges').default(0).notNull(),
    partsCharges: integer('parts_charges').default(0).notNull(),
    additionalCharges: integer('additional_charges').default(0).notNull(),
    taxPercent: integer('tax_percent').default(0).notNull(),
    taxAmount: integer('tax_amount').default(0).notNull(),
    total: integer('total').default(0).notNull(),
    cancellationReason: text('cancellation_reason'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: text('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('invoices_shop_id_idx').on(table.shopId),
    index('invoices_repair_id_idx').on(table.repairId),
    uniqueIndex('invoices_shop_id_invoice_number_uidx').on(table.shopId, table.invoiceNumber),
    uniqueIndex('invoices_one_issued_per_repair_uidx')
      .on(table.repairId)
      .where(sql`${table.status} = 'ISSUED'`),
  ],
)

export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: text('id').primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    invoiceId: text('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    partName: text('part_name').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
  },
  (table) => [
    index('invoice_items_shop_id_idx').on(table.shopId),
    index('invoice_items_invoice_id_idx').on(table.invoiceId),
  ],
)

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  shop: one(shops, { fields: [invoices.shopId], references: [shops.id] }),
  repair: one(repairs, { fields: [invoices.repairId], references: [repairs.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  creator: one(users, { fields: [invoices.createdBy], references: [users.id] }),
  canceller: one(users, { fields: [invoices.cancelledBy], references: [users.id] }),
  items: many(invoiceItems),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  shop: one(shops, { fields: [invoiceItems.shopId], references: [shops.id] }),
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
}))
