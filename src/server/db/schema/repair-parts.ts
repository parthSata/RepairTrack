import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { shops } from './users'
import { repairs } from './repairs'
import { inventory } from './inventory'

export const repairParts = pgTable(
  'repair_parts',
  {
    id: text('id').primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    repairId: text('repair_id')
      .notNull()
      .references(() => repairs.id, { onDelete: 'cascade' }),
    inventoryId: text('inventory_id')
      .notNull()
      .references(() => inventory.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitSellingPrice: integer('unit_selling_price').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('repair_parts_shop_id_idx').on(table.shopId),
    index('repair_parts_repair_id_idx').on(table.repairId),
    index('repair_parts_inventory_id_idx').on(table.inventoryId),
    uniqueIndex('repair_parts_repair_id_inventory_id_uidx').on(table.repairId, table.inventoryId),
  ],
)

export const repairPartsRelations = relations(repairParts, ({ one }) => ({
  shop: one(shops, { fields: [repairParts.shopId], references: [shops.id] }),
  repair: one(repairs, { fields: [repairParts.repairId], references: [repairs.id] }),
  inventoryItem: one(inventory, { fields: [repairParts.inventoryId], references: [inventory.id] }),
}))
