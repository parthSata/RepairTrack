import { check, index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { shops, users } from './users'
import { customers } from './customers'
import { repairs } from './repairs'

export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'])

export const payments = pgTable(
  'payments',
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
    amount: integer('amount').notNull(),
    method: paymentMethodEnum('method').notNull(),
    /** UPI transaction ID, last 4 card digits or bank reference. */
    reference: text('reference'),
    note: text('note'),
    receivedBy: text('received_by').references(() => users.id, { onDelete: 'set null' }),
    paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payments_shop_id_idx').on(table.shopId),
    index('payments_repair_id_idx').on(table.repairId),
    index('payments_paid_at_idx').on(table.paidAt),
    check('payments_amount_positive', sql`${table.amount} > 0`),
  ],
)

export const paymentsRelations = relations(payments, ({ one }) => ({
  shop: one(shops, { fields: [payments.shopId], references: [shops.id] }),
  repair: one(repairs, { fields: [payments.repairId], references: [repairs.id] }),
  customer: one(customers, { fields: [payments.customerId], references: [customers.id] }),
  receiver: one(users, { fields: [payments.receivedBy], references: [users.id] }),
}))
