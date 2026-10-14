import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const pendingRegistrations = pgTable('pending_registrations', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  ownerName: text('owner_name').notNull(),
  shopName: text('shop_name').notNull(),
  passwordEncrypted: text('password_encrypted').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  processingAt: timestamp('processing_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
