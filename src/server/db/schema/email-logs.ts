import { relations } from 'drizzle-orm'
import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { shops } from './users'
import { repairs } from './repairs'

export const emailTypeEnum = pgEnum('email_type', [
  'REPAIR_RECEIVED',
  'APPROVAL_REQUIRED',
  'REPAIR_STARTED',
  'READY_FOR_PICKUP',
  'REPAIR_COMPLETED',
  'INVOICE_GENERATED',
  'PAYMENT_RECEIVED',
  'TEST',
  'STAFF_INVITATION',
])

export const emailStatusEnum = pgEnum('email_status', ['SENT', 'FAILED', 'SKIPPED'])

export type EmailType = (typeof emailTypeEnum.enumValues)[number]

export const emailLogs = pgTable(
  'email_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    repairId: text('repair_id').references(() => repairs.id, { onDelete: 'set null' }),
    type: emailTypeEnum('type').notNull(),
    recipient: text('recipient'),
    subject: text('subject').notNull(),
    status: emailStatusEnum('status').notNull(),
    skipReason: text('skip_reason'),
    error: text('error'),
    dedupeKey: text('dedupe_key'),
    gmailMessageId: text('gmail_message_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('email_logs_shop_id_idx').on(table.shopId),
    index('email_logs_repair_id_idx').on(table.repairId),
  ],
)

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  shop: one(shops, { fields: [emailLogs.shopId], references: [shops.id] }),
  repair: one(repairs, { fields: [emailLogs.repairId], references: [repairs.id] }),
}))
