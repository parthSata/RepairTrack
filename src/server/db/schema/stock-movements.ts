import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { shops, users } from './users'
import { inventory, stockMovementReasonEnum } from './inventory'
import { repairs } from './repairs'

export { stockMovementReasonEnum }

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: text('id').primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    inventoryId: text('inventory_id')
      .notNull()
      .references(() => inventory.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    quantityAfter: integer('quantity_after').notNull(),
    reason: stockMovementReasonEnum('reason').notNull(),
    note: text('note'),
    repairId: text('repair_id').references(() => repairs.id, { onDelete: 'set null' }),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('stock_movements_shop_id_idx').on(table.shopId),
    index('stock_movements_inventory_id_idx').on(table.inventoryId),
    index('stock_movements_inventory_id_created_at_idx').on(table.inventoryId, table.createdAt),
    index('stock_movements_repair_id_idx').on(table.repairId),
  ],
)
