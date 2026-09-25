import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { shops } from './users'

export const stockMovementReasonEnum = pgEnum('stock_movement_reason', [
  'PURCHASE',
  'RETURN',
  'DAMAGED',
  'LOST',
  'CORRECTION',
  'REPAIR_USAGE',
  'REPAIR_REVERSAL',
])

export const inventory = pgTable(
  'inventory',
  {
    id: text('id').primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sku: text('sku').notNull(),
    quantity: integer('quantity').notNull().default(0),
    stockAlert: integer('stock_alert').notNull().default(0),
    purchasePrice: integer('purchase_price').notNull(),
    sellingPrice: integer('selling_price').notNull(),
    supplier: text('supplier'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('inventory_shop_id_idx').on(table.shopId),
    uniqueIndex('inventory_shop_id_sku_idx').on(table.shopId, table.sku),
  ],
)
