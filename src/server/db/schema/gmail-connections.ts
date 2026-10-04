import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { shops } from './users'

export const gmailConnectionStatusEnum = pgEnum('gmail_connection_status', [
  'CONNECTED',
  'NEEDS_RECONNECT',
])

export const gmailConnections = pgTable(
  'gmail_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
    status: gmailConnectionStatusEnum('status').default('CONNECTED').notNull(),
    connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('gmail_connections_shop_id_idx').on(table.shopId)],
)

export const gmailConnectionsRelations = relations(gmailConnections, ({ one }) => ({
  shop: one(shops, { fields: [gmailConnections.shopId], references: [shops.id] }),
}))
