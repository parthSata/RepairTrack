import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { shops } from './users'

export const customers = pgTable(
  'customers',
  {
    id: text('id').primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    address: text('address'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('customers_shop_id_idx').on(table.shopId),
    uniqueIndex('customers_shop_id_phone_idx').on(table.shopId, table.phone),
  ],
)
