import { relations } from 'drizzle-orm'
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { shops, users } from './users'

export const staffInvitationStatusEnum = pgEnum('staff_invitation_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
])

export const staffRoleEnum = pgEnum('staff_role', ['STAFF', 'TECHNICIAN'])

export const staffInvitations = pgTable(
  'staff_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shopId: text('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: staffRoleEnum('role').notNull(),
    token: text('token').notNull().unique(),
    status: staffInvitationStatusEnum('status').default('pending').notNull(),
    invitedBy: text('invited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('staff_invitations_shop_id_idx').on(table.shopId),
    uniqueIndex('staff_invitations_token_idx').on(table.token),
  ],
)

export const staffInvitationsRelations = relations(staffInvitations, ({ one }) => ({
  shop: one(shops, {
    fields: [staffInvitations.shopId],
    references: [shops.id],
  }),
  invitedByUser: one(users, {
    fields: [staffInvitations.invitedBy],
    references: [users.id],
  }),
}))
