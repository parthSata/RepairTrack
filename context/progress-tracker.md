# RepairTrack — Progress Tracker

# Project Status

Status: NOT STARTED

Current Sprint: Sprint 1 — MVP

Overall Progress: 0%

---

# Sprint 1 — MVP

## Goal

Build the minimum usable RepairTrack product.

The MVP should demonstrate the core repair-shop workflow:

Authentication
→ Staff/Technician Invite
→ Customer
→ Device
→ Repair Ticket
→ Repair Status
→ Repair Details
→ Customer Tracking

---

## 1. Project Foundation

- [ ] Initialize Next.js project
- [ ] Configure TypeScript
- [ ] Configure Bun
- [ ] Configure Tailwind CSS
- [ ] Configure shadcn/ui
- [ ] Configure project structure
- [ ] Configure environment variables (.env.local from .env.example)
- [ ] Add package.json scripts (dev/build/typecheck/lint/db:*/seed)
- [ ] Verify `bun run typecheck && bun run lint && bun run build` passes

---

## 2. Database Foundation

- [ ] Configure PostgreSQL
- [ ] Configure Drizzle ORM
- [ ] Configure migrations
- [ ] Create users schema
- [ ] Create shops schema
- [ ] Create customers schema
- [ ] Create devices schema
- [ ] Create repairs schema

---

## 3. Authentication

- [x] Configure Better Auth
- [x] Configure Google OAuth
- [x] Create login screen
- [x] Create registration flow (creates shop + OWNER)
- [x] Enforce server-controlled registration privileges (ignore client-set role/shopId/status, token-only invite acceptance)
- [x] Create protected routes & email verification enforcement
- [x] Create logout
- [x] Verify session handling & duplicate user prevention

---

## 3b. Staff Management

- [x] Create staff_invitations schema
- [x] Staff Management screen (list staff/technicians, status)
- [x] Add Staff / Add Technician form (name, email, role)
- [x] Generate invite token + shareable link
- [x] Invite acceptance flow (/invite/[token])
- [x] Change staff role (Staff ↔ Technician)
- [x] Technician role-change assignment handling (Hold/Reassign/Resume + repair_assignments)
- [x] Deactivate / reactivate staff
- [ ] Remove staff
- [x] Shop isolation verified (invited user always joins inviter's shop_id)


---

## 4. Application Layout

- [ ] Create dashboard layout
- [ ] Create sidebar
- [ ] Create header
- [ ] Create responsive navigation
- [ ] Create page container
- [ ] Create loading states
- [ ] Create error states
- [ ] Create empty states

---

## 5. Dashboard MVP

- [x] Create dashboard screen
- [x] Today's repairs count
- [x] Active repair count
- [x] Ready-for-pickup count
- [x] Completed today count (from repair_status_history)
- [x] Overdue repairs list on dashboard (derived at query time)
- [x] Recent repairs
- [x] Basic repair status overview

Pending approval / pending payment / revenue cards are not part of
this MVP set (payments/revenue blocked on Sprint 2; pending approval
intentionally excluded).

---

## 6. Customer Management

- [ ] Customer list
- [ ] Customer search
- [ ] Create customer
- [ ] Customer details
- [ ] Customer repair history

---

## 7. Device Management

- [ ] Device registration
- [ ] Device details
- [ ] Customer-device relationship
- [ ] Device repair history
- [ ] Device list grouped by customer (collapsible rows)
- [ ] Support Unverified model state (model optional at intake, badge
      shown on Device List/Details)

---

## 8. Repair Management

- [x] Repair list
- [x] Repair search
- [x] Repair filtering
- [x] Create repair
- [x] Generate public ticket number (10 random digits)
- [x] Repair details
- [x] Update repair status
- [x] Assign technician
- [x] Add diagnosis
- [x] Add repair notes
- [x] Repair status timeline
- [x] Prompt to confirm device model when entering DIAGNOSING (if
      Unverified) — non-blocking, inline on repair details
- [x] Editable Expected Completion Date on Repair Details (OWNER, STAFF, assigned TECHNICIAN)
- [x] Overdue repair detection (derived `isOverdue`, list filter, badges, dashboard card)
- [x] Customer approval schema foundation (`repair_approvals`, `actor_type` on status history, internal approval badge on Repair Details)
- [x] Request Customer Approval action (STAFF / assigned TECHNICIAN; guards; public tracking pending snapshot)
- [x] Approval estimate breakdown UI (formatRupees display; derived revised total; no migration)
- [x] Customer approve / reject decision on public tracking (token-only mutation, idempotent, manual search remains read-only)
- [x] Repair UI responsive refresh (list cards on mobile, detail redesign, tracking layout, approval banner)
- [x] Staff reopen COMPLETED repair ticket and restore CANCELLED repair ticket (OWNER + STAFF; required reason; explicit DIAGNOSING transition; reopen/restore remain actions, not statuses)
- [x] Recovery flow verified for COMPLETED -> DIAGNOSING reopen and CANCELLED -> DIAGNOSING restore paths
- [x] Approval edge cases: request only from DIAGNOSING; ticket context on approval dialog; pending lock + post-APPROVED continuation verified
- [x] Status phase transition guards (pre-approval RECEIVED/DIAGNOSING only; post-approval late statuses; shared helper for UI + server)
- [x] Repair Details UI refresh (dedupe status, Select control, redesign status history timeline; UI-only)

---

## 9. Customer Tracking

- [x] Public repair tracking route
- [x] Repair status display
- [x] Basic device information
- [x] Current repair stage
- [x] Ready-for-pickup status
- [x] Protect private information
- [x] Customer approval decision states (pending action, already approved/rejected, manual read-only pending view)
- [x] Shop Profile pickup contact data (address, phone, optional business hours) and public Ready-for-Pickup contact card
- [x] Structured weekly Shop Hours editor with validated intervals and weekday quick-apply

---

## 10. MVP UI / UX

- [ ] Apply design system
- [ ] Responsive desktop UI
- [ ] Responsive tablet UI
- [ ] Responsive mobile UI
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Form validation states
- [ ] Repair status animations
- [ ] Micro-interactions
- [ ] Reduced-motion support

---

# Sprint 1 Completion Criteria

Sprint 1 is complete when a shop user can:

1. Sign in
2. Invite a Staff/Technician and have them accept and log in
3. Access the dashboard
4. Create a customer
5. Register a device
6. Create a repair ticket
7. Update repair status
8. View repair details
9. View customer repair history
10. Provide a customer-facing tracking experience

The MVP should be usable from start to finish without requiring
future sprint functionality.

---

# Sprint 2 — Core Operations

Status: NOT STARTED

## Inventory

- [x] Inventory list
- [x] Add part
- [x] Edit part
- [x] Stock quantity
- [x] Low-stock indication
- [x] Delete part
- [x] Parts used in repair
- [x] Manual stock adjust (Manage Part → Stock)
- [x] Stock history (Part Details)

## Invoices

- [x] Invoice schema foundation (invoices + invoice_items, migration 0023, generateInvoiceNumber)
- [x] Invoice list (`GET /api/invoices` paginated + search by invoice #/customer name/phone; `/invoices` table with mobile cards; migration 0025)
- [x] Create invoice (Generate Invoice on Repair Details → `POST /api/invoices`; snapshot of confirmed bill + parts)
- [x] Invoice details (printed layout `/invoices/[id]`: shop header, customer, device, parts table, stored summary; 404 not-found state; linked from Customer Details → Invoices; Print / Save as PDF; Paid / Balance due / status + payment list under the Total; no edit)
- [x] Invoice lock + Cancel & reissue (pricing/parts locked while Issued; Cancel Invoice with reason; Generate New Invoice; migration 0024)
- [x] Repair charges (pricing schema + calculation foundation: labor/additional/discount/tax_percent/estimated_total/final_total; live partsCharges; GST §170 round)
- [x] Parts charges (computed live from repair_parts; not a stored column)
- [x] Discounts where required (discount field + reject when discount exceeds taxable value)
- [x] Final pricing panel (confirm `final_total` on Repair Details at QUALITY_CHECK+; OWNER/STAFF; unlock-to-edit)

## Payments

- [x] Payment schema foundation (payments table, payment_method/payment_type enums, migration 0026, getPaymentSummary)
- [x] Payment records (Record Payment on Repair Details → `POST /api/payments`; advance vs payment set by the server; balance guard; finalize blocked below amount paid)
- [x] Payment list (`GET /api/payments` paginated + search by ticket #/customer name/phone + method filter + date-range filter; `/payments` TableCraft table with mobile cards; filtered total banner at top)
- [x] Payment status (Unpaid / Partial / Paid per repair and per invoice)
- [x] Pending payments
- [x] Payment history (per repair: Repair Details Payments card + invoice page / print)
- [x] Shop UPI ID + payee name in Shop Profile (for future QR payments; manual confirmation, no gateway)
- [x] UPI QR for the balance due (Repair Details "Show UPI QR" dialog + invoice page / print)
- [x] UPI QR on public tracking (read-only payment block, Paid/Balance due/status, UpiPayCard, mobile deep link, "Paid in full" when PAID)
- [x] UTR validation for UPI payments (12 digits required, 409 duplicate check per shop)

## Repair Improvements

- [x] Repair photos
- [ ] Advanced filtering
- [ ] Improved technician workflow
- [ ] Approval workflow

---

# Sprint 3 — Business & Product Refinement

Status: NOT STARTED

## Notifications

- [ ] Notification center
- [ ] Repair status notification
- [ ] Ready-for-pickup notification
- [ ] Pending approval notification
- [ ] Low-stock notification

## Owner Email Connection

- [x] Email foundation (googleapis only): `escapeHtml`, shared `renderEmailLayout`, `buildRawEmail` (RFC 2047, base64 body), `gmail.service.ts` takes the sender as a parameter; `.env` sender limited to account verification
- [x] Gmail OAuth client setup (`gmail.send openid email`, separate from login client; `GMAIL_REDIRECT_URI`)
- [x] gmail_connections schema (AES-256-GCM encrypted refresh token + Gmail address + CONNECTED/NEEDS_RECONNECT status; migration 0028)
- [x] Connect Gmail UI (Settings → Email & Notifications)
- [x] Disconnect Gmail UI (revokes the token, deletes the row)
- [x] email.service.ts — shared queued sender (`queueShopEmail` via `after()`, `email_logs` with SENT / FAILED / SKIPPED + dedupe, `buildTrackingUrl`; migration 0029)
- [x] Repair Received email (template + trigger in `createRepairTicket`, dedupe `REPAIR_RECEIVED:<repairId>`)
- [x] Gmail not-connected warning on the Create Repair success screen (persistent; OWNER → `/settings/email?from=repair` with highlighted Gmail card; STAFF → "ask the owner")
- [x] Approval Required email (template + trigger in `requestCustomerApproval`, dedupe `APPROVAL_REQUIRED:<approvalId>`)
- [x] Status emails: Repair Started, Ready for Pickup, Repair Completed (templates + trigger in `updateRepairStatus`, dedupe `<TYPE>:<repairId>`)
- [x] Invoice Generated email (template + trigger in `createInvoiceFromRepair`, dedupe `INVOICE_GENERATED:<invoiceId>`; whole invoice in the body, no PDF)
- [x] Event trigger calling `queueShopEmail` from the payment action (`recordPayment`, dedupe `PAYMENT_RECEIVED:<paymentId>`)
- [x] Email template: Payment Received (all approved trigger events now have a template)
- [x] Send Test Email action
- [x] Reconnect-on-failure UI state (`invalid_grant` → NEEDS_RECONNECT → "Reconnect needed")
- [x] Connect Gmail prompt on Add Staff (reusable `ConnectGmailPrompt`; Connect button now live; prompt skipped once connected)
- [x] Staff invitation flow upgraded to also send real email from the
      Owner's Gmail (link-only stays when not connected; never the platform sender)
- [x] Email activity on Repair Details (`GET /api/repairs/:id/emails`, `POST /api/repairs/:id/emails/:logId/resend`, "Emails" card with Resend + OWNER Gmail banner)

## Advanced Dashboard

- [x] Analytics foundation (done)
- [x] Revenue
- [x] Repair KPIs
- [x] Technician performance
- [ ] Brands & problems
- [x] Parts usage

## Reports

- [ ] Repair volume report
- [ ] Revenue report
- [ ] Payment report
- [ ] Inventory report
- [ ] Repair completion report

## UI Improvements

- [ ] Advanced animations
- [ ] Page transitions
- [ ] Improved dashboard
- [ ] Improved responsive layouts
- [ ] Accessibility improvements
- [ ] Performance improvements

---

# Sprint 4 — Advanced & Production Readiness

Status: NOT STARTED

## Security

- [ ] Permission review
- [ ] Authorization review
- [ ] Input validation review
- [ ] File upload security review
- [ ] Environment variable review

## Performance

- [ ] Database query optimization
- [ ] API performance review
- [ ] Client bundle review
- [ ] Image optimization
- [ ] Loading performance

## Testing

- [ ] Per-role flows (OWNER, STAFF, TECHNICIAN)
- [ ] Customer tracking flow
- [ ] Full repair lifecycle
- [ ] Invoice print
- [ ] Payment with UPI QR
- [ ] Cloudinary repair photo upload
- [ ] Gmail test email

## Advanced Features

- [ ] Activity / Audit Logs
- [ ] Advanced analytics
- [ ] Advanced permissions
- [ ] Multi-location support

These features must not be moved into earlier sprints without
explicit approval.

---

# Deferred Features

The following are intentionally deferred:

- Warranty management
- Bulk/marketing email automation
- Activity / Audit Logs
- Advanced analytics
- Multi-location support
- AI-assisted repair functionality
- Advanced inventory forecasting
- Additional authentication providers
- Additional payment providers

---

# Known Issues

- `bun run db:migrate` fails when `MIGRATION_DATABASE_URL` is missing and `DATABASE_URL` uses Neon's pooler (`-pooler` hostname). **Fix:** add the Neon **direct** connection string as `MIGRATION_DATABASE_URL` in `.env.local`, run `bun run db:check-migration-url`, then `bun run db:migrate`. Full steps: `repairtrack-frontend/docs/customer-approval-testing.md` §1.
- Legacy note: migration `0011` was once applied manually for the same pooler reason before the guard scripts existed.
- **Schema drift (not migrated in this branch):** the shared database already has `repair_approvals.initial_estimated_cost` (NOT NULL integer paise) from an out-of-tree apply that is not in git (`drizzle/` still ends at `0013`). Drizzle schema now maps that existing column so inserts succeed. Display still uses `repairs.estimated_cost` + `additional_estimated_cost`; revised total is not stored. No `0014` file was generated or run. A database that only applied `0013` will not have this column until that drift is reconciled.
- `scripts/verify-request-approval.ts` was rewritten for Approval Charges + Finalize Bill but has not been run against a database yet; run it with a seeded shop/repair before relying on the flow in production.
- Tracking-token expiry is not yet modeled in schema or documented with a TTL field, so the customer decision endpoint can validate the current token and reject regenerated/invalid ones, but not enforce a time-based expiry until that source of truth exists.
- Migration `0023` (invoices + invoice_items) is applied to the shared database. Any other environment must run `bun run db:migrate` first, or Repair Details returns 500 (`getRepairById` reads `invoices`).
- Migration `0024` (invoice status ISSUED/CANCELLED, cancel columns, one-Issued-per-repair partial unique index; drops the old unique `repair_id`) is applied to the shared database. Other environments must run `bun run db:migrate`.
- Generate Invoice and Cancel & reissue flows not yet manually tested end-to-end (generate → edits blocked → cancel with reason → finalize → Generate New Invoice gets the next number; reopen with and without new charges).
- Duplicated `TxClient` type in `inventory.service.ts`, `repair-assignment.helpers.ts`, `staff.service.ts` — switch to the shared export from `@/server/db` when those files are next touched.
- Migration `0025` (`invoices_shop_id_created_at_idx`) is applied to the shared database. Other environments must run `bun run db:migrate`.
- Shared helpers now exist but only invoices use them: other list services still inline `Math.ceil(total / limit) || 1` and unescaped `ilike` search (use `toPaginatedResult` / `toContainsPattern`), and other routes still inline validation-error blocks (use `validationHook`); other lists still hand-roll error banners (use `QueryErrorState`). Switch when those files are next touched.
- Invoice list not yet manually tested (search by number/name/phone, sort, pagination, 375px cards, empty/error states).
- Invoice details not yet manually tested (printed layout at 375px, unknown / other-shop id shows the not-found state, Customer Details → Invoices cards open the invoice, cancel still works from the new toolbar).
- Print Invoice not yet manually tested (Chrome/Edge print preview: no sidebar/header/buttons/toasts, white A4; a long parts list over 2 pages breaks only between rows; "Save as PDF" suggests `Customer - INV-xxxxxx - Ticket nnnnnnnnnn`; a cancelled invoice prints with its Cancelled badge). The suggested PDF name comes from `document.title`; Chrome, Edge and Firefox use it, but some mobile browsers ignore it. It is used only when the Destination is the browser's own "Save as PDF". OS printer drivers such as "Microsoft Print to PDF" (dialog titled "Save Print Output As") always open with an empty name, and a web page can't change that. The Print button's tooltip tells staff to pick "Save as PDF". Print is the only invoice output (Download PDF was removed).
- Invoice summary has no Discount row by design (discount was removed product-wide; see "Total Discount Feature Removal").
- `src/lib/format-date.ts` (`formatDate`) now exists but only invoices use it; 11 other files still hand-roll `Intl.DateTimeFormat` / `toLocaleDateString` (repair-list-card, customer-details, customer-repair-history, track-approval-summary-card, track-repair-summary, dashboard-overdue-repairs, customer-table, device-repair-history, repair-list, repair-details). Switch when those files are next touched. Same for `idParamSchema` (`src/lib/validation.ts`), used only by invoice routes.
- Migration `0026` (`payments` table, `payment_method` / `payment_type` enums) is generated but **not applied** (as far as recorded here). Run `bun run db:migrate` before using payments — until then the Payments card and invoice payment block show their error state, and Record Payment / Finalize Bill return 500.
- Record Payment not yet manually tested (advance with no bill, advance capped by estimate, payment after finalize, over-balance 409, cancelled repair 409, TECHNICIAN sees no card / gets 403, finalize below amount paid 409, 375px dialog).
- Payment summary not yet manually tested: Repair Details Payments card (loading skeleton, error + Retry, "No payments yet", Advance tag, "(estimate)" label before finalize, Record Payment hidden when Paid and disabled when cancelled, summary refreshes after saving estimate / finalize / payment, 375px); invoice page (Paid / Balance / status under the Total measured against the invoice's own total, payment list, print preview with and without payments, error never printed).
- Only Finalize Bill is guarded against dropping below the amount paid. Saving a lower estimate, or Request Customer Approval clearing `final_total`, can still leave the bill total below what has been paid (the card then shows balance ₹0 and hides Record Payment).
- Migration `0027` (`shops.upi_id`, `shops.upi_payee_name`) is generated but **not applied**. Run `bun run db:migrate` — until then Shop Profile load/save fails, and so does `GET /api/payments` (it now reads the shop's UPI ID), so the Payments card and invoice payment block show their error state.
- UPI QR not yet manually tested: scan with GPay / PhonePe / Paytm opens with the right payee, amount and note "Ticket nnn" (the UPI ID is sent as `pa=name%40bank` because every value is `encodeURIComponent`-ed — confirm apps accept it); copy button; OWNER sees "Add a UPI ID in Shop Profile" and STAFF sees nothing when no UPI ID; hidden when Paid, repair cancelled or invoice cancelled; print preview includes the QR and hides the copy button / setup link; "Show UPI QR" dialog at 375px.
- Shop UPI ID not yet manually tested (invalid UPI ID shows the inline message, blank fields save as null, payee placeholder follows the shop name, 375px, STAFF/TECHNICIAN get 403 from `PATCH /api/shops/me`).
- Shared `requireRole` now protects every authenticated Hono route, including customers, devices, repairs, inventory, staff, dashboard, invoices, payments, shops, and Gmail. It rejects missing or inactive users, invalid/disallowed roles, and missing shop context. Staff deactivation also deletes all Better Auth sessions in the same transaction.
- Staff invitations expire after 10 minutes (`INVITE_TTL_MINUTES`), which is short for an emailed invite; the email now states the real expiry (it used to say "7 Days"). Raising the TTL is a product decision, not changed here.
- Staff invitation email not yet manually tested: connected → "Invitation Sent" and the email arrives From the shop name + owner Gmail with the shop name in the header; not connected → prompt, then link only; revoked Gmail → "needs reconnecting" message and the prompt shows next time; the link in the email opens `/invite/[token]`.
- Migration `0028` (`gmail_connections` + `gmail_connection_status` enum) is generated but **not applied**. Run `bun run db:migrate` — until then Settings → Email & Notifications fails to load and the Gmail routes return 500.
- Owner Gmail Connection needs env + Google Cloud setup before it works: add `GMAIL_REDIRECT_URI` (also registered as an Authorized redirect URI on the Gmail OAuth client) and `GMAIL_TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`) to `.env.local`. Changing the key later makes stored tokens unreadable; those shops flip to "Reconnect needed".
- Owner Gmail Connection not yet manually tested: connect (consent → "Gmail connected" toast, status shows the address), untick the send permission on consent ("missing scope" toast, nothing saved), cancel consent ("cancelled" toast), tampered/expired state cookie ("Could not connect"), Send test email arrives From the shop name + owner address, revoke access at myaccount.google.com then Send test email → 409 and "Reconnect needed", Disconnect (row deleted, access gone from the Google account page), STAFF/TECHNICIAN get 403 from every `/api/settings/gmail` route, 375px layout.
- Send test email `send_failed` / `not_configured` map to 502 / 503, which the central error handler shows as the generic "Something went wrong" message.
- `bun run verify:email` sends real emails (to `GMAIL_USER` or the address given as an argument). It runs through `scripts/server-only-shim.mjs` because `server-only` is resolved by Next.js, not installed as a package.
- Migration `0029` (`email_logs`) is applied to the shared database. Other environments must run `bun run db:migrate`, or log inserts fail (reported in the server console as `email_logs insert failed`).
- Send test email, staff invitations, repair emails, Invoice Generated and Payment Received all write to `email_logs`.
- If the dev server shows "Export sendGmailTestEmail doesn't exist in target module", its Turbopack cache is stale (seen after running `next build` while `next dev` was up): restart `bun run dev`, or delete `.next/dev` first.
- `queueShopEmail` dedupe is check-then-send: two triggers racing with the same `dedupe_key` can both send. Acceptable for transactional mail; a unique index would only fail the second log write, not stop the second send.
- `buildTrackingUrl` (`email.service.ts`) repeats the app-URL fallback chain of `getAppUrl` in `staff.service.ts`. Extract a shared helper on the third use (code-standards §25).
- `queueShopEmail` not yet manually tested: SENT row with message id, SKIPPED for empty recipient / not connected / duplicate key, FAILED after revoking access (and the connection flips to "Reconnect needed"), Reply-To present only when the shop email is set.
- Repair Received email not yet manually tested: create a repair for a customer with an email → one `REPAIR_RECEIVED` SENT row and the email arrives (ticket number, device, problem, Expected by only when set, Track your repair opens `/track/<token>`); customer without email → SKIPPED `no_customer_email`; Gmail not connected → SKIPPED `gmail_not_connected`; renders at 375px in Gmail mobile; a problem containing `<script>` shows as text and line breaks are kept. The repair is created even when queuing fails.
- Gmail warning not yet manually tested (create a repair, then on the "Repair Ticket Created" screen): OWNER with Gmail not connected sees the warning + Connect Gmail and lands on `/settings/email` with the Gmail card ringed; Reconnect needed shows "Gmail needs reconnecting" + Reconnect Gmail; STAFF see the warning with "Ask the shop owner…" and no button, and `GET /api/settings/gmail` returns `email: null`; no warning once connected; 375px (button full width).
- Invite "Continue with Google" not yet manually tested end-to-end (needs a real Google login): new Google account with the invited email → lands on `/dashboard` as STAFF/TECHNICIAN of the inviting shop, no new shop row, invitation `accepted`, no verification email; different Google account → back on the invite page with the mismatch message and no user/shop created; Google account that already owns a shop → back on the invite page with "already belongs to another shop" (no session); expired invitation → invalid message. Inactive staff can only be reactivated through the password form (Google sign-in is refused as deactivated).
- **Security (not fixed, needs a decision):** `user.additionalFields.role` / `shopId` in `src/server/auth/index.ts` accept client input, so a direct `POST /api/auth/sign-up/email` with `shopId` (and `role`) in the body can create a user inside another shop. `acceptInvitation` relies on passing those fields to `auth.api.signUpEmail`. Fix: mark both `input: false` and have the invite path set them through a trusted server channel (e.g. update the user after `signUpEmail`, or the same hook pattern as the Google invite flow).
- **Verification emails are not being delivered:** the platform sender's `GMAIL_REFRESH_TOKEN` in `.env.local` is rejected by Google (`invalid_grant`: "Token has been expired or revoked"). Mint a new refresh token for `GMAIL_USER` with the `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` client (scope `https://www.googleapis.com/auth/gmail.send`), update `.env.local`, restart `bun run dev`. If the OAuth consent screen is in "Testing" publishing status, Google expires refresh tokens after 7 days; publish the app to "In production" to stop this recurring. Staff reactivation (`staff.service.ts`) still ignores the send result of `sendAccountVerificationEmail`.
- Approval Required email not yet manually tested: Request Customer Approval for a customer with an email → one `APPROVAL_REQUIRED` SENT row with `dedupe_key` `APPROVAL_REQUIRED:<approvalId>` and the email arrives (Action needed pill, ticket number, device, diagnosis with line breaks kept and `<script>` shown as text, Labor / Parts / Additional / GST (x%) / Total matching Repair Details, Review and approve opens `/track/<token>` with the decision buttons); customer without email → SKIPPED `no_customer_email`; Gmail not connected → SKIPPED `gmail_not_connected`; reject then request again → a second email (new approval id); renders at 375px in Gmail mobile. The approval request succeeds even when queuing fails.
- Status emails not yet manually tested: set a repair to In Repair → one `REPAIR_STARTED` SENT row (`dedupe_key` `REPAIR_STARTED:<repairId>`), blue "In progress" pill, Expected by only when set; Ready for Pickup → `READY_FOR_PICKUP` with Pickup details (address line breaks kept, phone) and Business hours (open days only; cards hidden when empty), amber "Balance due ₹X" only when the bill is finalized and unpaid, "Pay by UPI: <id>" only when the shop has a UPI ID; Completed → `REPAIR_COMPLETED` with the ticket number and "Amount paid"; moving In Repair → Waiting for Parts → In Repair sends no second email (SKIPPED `already_sent`); customer without email → SKIPPED `no_customer_email`; renders at 375px in Gmail mobile. The status change succeeds even when queuing fails. Because the key is per repair, a reopened repair that reaches Ready for Pickup / Completed again is not emailed a second time.
- Migration `0031` (drops `payments.type` and the `payment_type` enum) is applied to the shared database. Other environments must run `bun run db:migrate`, or Record Payment fails (the old NOT NULL `type` column rejects the insert).
- **Schema drift (not fixed):** the shared database's `payments` table has a `razorpay_payment_id` column that is not in `src/server/db/schema/payments.ts` or any migration in `drizzle/`. It was added outside this repo. It's harmless while nullable, but needs a decision: add it to the schema or drop it. Razorpay is not in scope (no payment gateway).
- Advance removal not yet manually tested: Repair Details payment history has no "Advance" tag, `/payments` has no Type column (desktop) or type badge (mobile cards), the Record Payment toast reads "Payment of ₹X recorded".
- Completed-requires-payment gate not yet manually tested: after Finalize Bill with a balance, the status dropdown shows "Completed (record payment first)" disabled plus the amber hint for STAFF and the assigned TECHNICIAN; `PATCH /status` to COMPLETED returns 409 with the payment message; after Record Payment for the full balance the dropdown refreshes and Completed is selectable; a ₹0 final bill can be completed without a payment. Repairs already COMPLETED before this rule are unaffected.
- Invoice Generated email not yet manually tested: Generate Invoice for a customer with an email → one `INVOICE_GENERATED` SENT row (`dedupe_key` `INVOICE_GENERATED:<invoiceId>`) and the email arrives (blue "Invoice" pill, invoice number / date / ticket, From / Billed to / Device cards with empty rows omitted, parts table with line totals or "No parts used", Summary matching the invoice page, amber "Balance due ₹X" + "Paid: ₹Y" or green "Paid ₹Y" + "Balance due: ₹0, paid in full", View repair status opens `/track/<token>`); a part named `<script>` shows as text; customer without email → SKIPPED `no_customer_email`; Gmail not connected → SKIPPED `gmail_not_connected`; cancel + Generate New Invoice → a second email for the new invoice; renders at 375px in Gmail mobile. The invoice is created even when queuing fails. A local render was checked at 375px (no horizontal overflow, numbers kept on one line).
- Payment Received email not yet manually tested: Record Payment for a customer with an email → one `PAYMENT_RECEIVED` SENT row (`dedupe_key` `PAYMENT_RECEIVED:<paymentId>`) and the email arrives (green "Payment received" pill, heading "Payment complete — thank you!", ticket number, Payment card with Amount / Method / Date, UTR row only for UPI and absent for Cash, green "Amount paid ₹X" band with "Total paid: ₹X · Balance due: ₹0", View repair status opens `/track/<token>`); subject `<shop>: Payment complete, Ticket #<n>`; a UTR stored as `<script>` (bypassing the form) shows as text; customer without email → SKIPPED `no_customer_email`; Gmail not connected → SKIPPED `gmail_not_connected`; renders at 375px in Gmail mobile. The payment is recorded even when queuing fails. The amber "Balance due" variant is a fallback only — full payment is enforced, so it should never appear today.
- `motion-safe:animate-in` / `fade-in` / `zoom-in-95` / `slide-in-*` classes are used in several components (repair-details, image-lightbox, select, …) but `tw-animate-css` is not installed and `globals.css` defines no such utilities, so those animations are no-ops. New UI uses the existing `.page-enter` class instead. Decide whether to install `tw-animate-css` or switch those components to `.page-enter`.
- `scripts/test-public-tracking.ts` imports `repair.service`, which now loads `server-only` through `email.service`; run it with `bun --preload=./scripts/server-only-shim.mjs` (the `verify:*` package scripts already do).
- Email activity not yet manually tested: the Repair Details "Emails" card lists rows newest first with the right type, recipient, badge, reason and time; a FAILED row (revoke Gmail access, change status) shows Resend, and resending after reconnecting adds a new Sent row and hides Resend on the old one; a SKIPPED `no_customer_email` row resends once the customer has an email; Resend on a cancelled invoice or a decided approval toasts the 409 message; OWNER sees the Gmail banner when not connected or reconnect needed, STAFF don't, TECHNICIAN sees no card and gets 403 from both endpoints; loading, empty ("No emails sent yet") and error (Retry) states; 375px (Resend full width).
- Email resend is check-then-send like `queueShopEmail`: two resends of the same email racing from different tabs can both send. The UI allows one resend at a time per page.
- Emails queued with `after()` (status change, payment, invoice) appear in the Emails card only on its next refetch (15 s stale time, window focus, or a revisit); the triggering mutations don't invalidate it because the email is sent after their response.
- Latency: the Neon DB is in `us-east-2`; from the dev machine (India) one round-trip is ~300 ms and opening a new connection ~4 s. After the DB fixes below, a warm invoice list query is 1 round-trip (~310 ms), but each API request still pays Better Auth `getSession` (~2 queries, ~600 ms warm). Remaining options (not done, need a decision): Better Auth `session.cookieCache` (skips the DB, but role changes/deactivation take effect only after the cache window) or moving Neon/app to a region near users (e.g. `ap-southeast-1`).

---

# Current Task

P2 distributed database-backed rate limiting (done).

---

# Next Recommended Task

Advanced Dashboard — Brands & problems.

---

# Change Log

## P2 Distributed Database-Backed Rate Limiting

- Added application `rate_limits` and Better Auth `rate_limit` tables in
  migration `0033_calm_rogue.sql`.
- Replaced the process-local Hono limiter with an atomic PostgreSQL upsert,
  proxy-safe client keying, and 1% opportunistic expiry cleanup.
- Added a 10-attempt / 15-minute per-ticket limit to public phone
  verification and protected `POST /api/email-check`.
- Enabled Better Auth database rate limiting and documented the storage and
  proxy trust rules.

## Pending Owner Registration

- Added encrypted, expiring `pending_registrations` storage so owner users and
  shops are not created until the emailed token is redeemed.
- Added token-hashed registration, verification, and resend endpoints with
  single-use concurrency protection.
- Registration verification creates the Better Auth owner only after email
  ownership is proven, then redirects to sign-in because the server-side
  completion call cannot transfer a session cookie to the browser.
- Duplicate-email errors remain an accepted account-creation trade-off and are
  not exposed by the MX check; failed completion leaves the pending record
  retryable.

## P2 Email Account Enumeration

- Removed unauthenticated `GET /api/email-check/user-status`.
- Limited `POST /api/email-check` to disallowed-domain and MX validation,
  returning only `{ valid }` without database user lookups or an `exists` flag.
- Removed registration pre-check and automatic sign-in fallback; duplicate
  email errors now remain visible in the registration form.
- Reused `FieldError` and `getApiErrorMessage` for consistent field and
  request error handling.
- Accepted the unavoidable duplicate-email disclosure from Better Auth
  sign-up, with mitigation from the existing rate-limiting controls.

## P1 Public Tracking Phone Matching

- Added canonical phone normalization for formatting, the Indian `91` country
  code, and the leading `0` trunk prefix.
- Removed partial suffix matching from public tracking verification; both
  canonical values must be non-empty, at least seven digits, and exactly equal.
- Added focused token and phone-matching tests covering normalization, rejected
  suffixes, short inputs, mismatches, and token generator formats.
- Preserved `normalizePhoneForComparison` as a compatibility alias and retained
  the generic 404 response for missing or mismatched tracking credentials.

## Centralized API Session Authorization

- Extended `requireRole` to enforce active account status, recognized roles,
  route permissions, and non-empty shop context without defaulting missing
  roles to `OWNER`.
- Migrated all authenticated Hono route modules to the shared helper while
  preserving their existing permission matrices and tenant scoping.
- Deactivation now updates the user and deletes every Better Auth session in
  one database transaction.
- Added focused tests for unauthenticated, inactive, malformed, unauthorized,
  missing-shop, and valid active-user cases.

## Advanced Dashboard — Parts usage

- Endpoint `GET /api/dashboard/analytics/parts?period=` in `src/server/hono/routes/dashboard.ts` (restricted to `ANALYTICS_ROLES` `OWNER` and `STAFF`, scoped strictly to `shopId`, input validated with `analyticsQuerySchema`).
- Aggregation query in `src/server/services/dashboard-analytics.service.ts`:
  - `getPartsAnalytics(shopId, period)` runs an optimized PostgreSQL CTE in 1 database round-trip.
  - Computes `totalQuantity` and `totalValue` (in paise) for `repair_parts` created in the IST period range.
  - Queries `lowStockCount` via existing inventory low-stock rule (`quantity > 0 AND stock_alert > 0 AND quantity <= stock_alert`).
  - Aggregates top 10 parts by quantity (`quantity DESC, value DESC`) joined to `inventory` for name and SKU with line values in paise.
- Schemas & Queries:
  - `topPartUsageSchema`, `partsAnalyticsResponseSchema`, types `TopPartUsage` and `PartsAnalyticsResponse` in `src/features/dashboard/schemas.ts`.
  - `usePartsAnalytics` query hook in `src/features/dashboard/queries.ts`.
- UI Components:
  - Reusable `RankedBarList` component in `src/features/dashboard/components/analytics/ranked-bar-list.tsx`: proportional background bars, rank indicators, truncated names and mono SKUs, tabular quantity and formatted rupee values, row links to `/inventory/[id]` with arrow hints and accessible keyboard focus.
  - Added "Parts usage" `AnalyticsCard` to `AnalyticsSection` (`src/features/dashboard/components/analytics/analytics-section.tsx`) with two mini stats ("Parts used" and "Parts value"), an "N parts low on stock" link to `/inventory` when count > 0, and the `RankedBarList`. Responsive at 375px.
- Automated verification script: `scripts/test-analytics-parts.ts` covering schema parsing, role authorization, live insertion aggregation, shop isolation, and cleanup.

## Advanced Dashboard — Revenue

- Added approved dependency `recharts` and created `src/components/ui/chart.tsx` via shadcn CLI.
- Revenue Analytics endpoint `GET /api/dashboard/analytics/revenue` in `src/server/hono/routes/dashboard.ts` (restricted to `ANALYTICS_ROLES` `OWNER` and `STAFF`, scoped strictly to `shopId`).
- Revenue calculation in `src/server/services/dashboard-analytics.service.ts`:
  - Single optimized SQL query on `payments` table using Common Table Expressions (CTEs), `SUM(...) FILTER` per IST date ranges from `getPeriodRange('this_month')` and `getPeriodRange('this_year')`.
  - Grouped by `date_trunc('month', paid_at AT TIME ZONE 'Asia/Kolkata')`.
  - Missing calendar months filled with `0` paise across 12 calendar months (`Jan`..`Dec`).
- Schemas (`src/features/dashboard/schemas.ts`): `monthlyRevenuePointSchema`, `revenueAnalyticsResponseSchema`, and derived types `MonthlyRevenuePoint`, `RevenueAnalyticsResponse`.
- Query client: `useRevenueAnalytics(period)` in `src/features/dashboard/queries.ts`.
- Reusable UI components in `src/features/dashboard/components/analytics/`:
  - `DeltaBadge`: percentage comparison badge (`+X%` green up, `-X%` red down, or `—` when previous period is 0).
  - `KpiCard`: reusable card showing title, formatted currency with `formatRupees`, `DeltaBadge`, comparison hint, and `"Collected payments, incl. GST"` label.
  - `MonthlyRevenueChart`: bar chart using shadcn chart and recharts with rupee tooltips and responsive layout.
  - `AnalyticsCard`: updated to accept `className` to support multi-column layouts.
  - `AnalyticsSection`: renders a single dynamic Revenue KPI card (`Revenue · <Period>`) that adapts directly to the active period tab (This month, Last month, 3 months, This year) with comparison deltas, alongside the Monthly revenue bar chart spanning 3 columns, eliminating redundant duplicate month/year cards.
- Overdue Repairs section verified as isolated on the dashboard and not duplicated inside analytics.
- Verification test script in `scripts/test-analytics-revenue.ts` confirming delta calculations, schema validation, route auth guards, and multi-shop DB data isolation.


## Advanced Dashboard — Analytics Foundation

- IST time arithmetic helper (`src/lib/shop-time.ts`): `SHOP_TIMEZONE = 'Asia/Kolkata'` (UTC+05:30 offset, pure Date math, no external libraries). Pure functions `getTodayRange(now)` and `getPeriodRange(period, now)` covering `this_month`, `last_month`, `last_3_months`, `this_year` with IST midnights and calendar month clamping.
- Updated `getDashboardSummary` in `src/server/services/dashboard.service.ts` to use `getTodayRange()` with `gte(start)` and `lt(end)` for UTC-server / IST-client alignment.
- Schemas (`src/features/dashboard/schemas.ts`): `ANALYTICS_PERIODS`, `ANALYTICS_PERIOD_LABELS`, `analyticsPeriodSchema` (default `this_month`), `analyticsQuerySchema`, `parseAnalyticsPeriod` (safe parse fallback to `this_month`), `analyticsPeriodResponseSchema`.
- Endpoint `GET /api/dashboard/analytics/period` (`src/server/hono/routes/dashboard.ts`): restricted to `OWNER` and `STAFF` via `requireDashboardSession(request, roles)` with fresh DB role resolution; validates query returning 400 on invalid period, 403 on TECHNICIAN, 401 unauthenticated, returns resolved range as ISO strings.
- Service `getAnalyticsPeriod(period)` (`src/server/services/dashboard-analytics.service.ts`).
- Client data layer: `dashboardKeys.analytics` and `useAnalyticsQuery` hook (`keepPreviousData`, 5m staleTime) in `src/features/dashboard/queries.ts`, and `useAnalyticsPeriod` in `src/features/dashboard/use-analytics-period.ts` syncing with `?period=` via `router.replace(..., { scroll: false })`.
- Reusable UI in `src/features/dashboard/components/analytics/`:
  - `AnalyticsSection`: heading, subtitle with dynamic range label ("1 Oct – 8 Oct 2026"), period tabs (shadcn `Tabs`, horizontal scrolling on mobile), empty responsive grid (no duplicate/mock cards).
  - `AnalyticsCard`: reusable card with loading skeleton, `QueryErrorState` with retry, empty state, children, background refetch retry indicator.
  - `AnimatedNumber`: shared fade animation component extracted from `StatValue` and used in `dashboard-stat-cards.tsx`.
- Server Component page: `src/app/(dashboard)/dashboard/page.tsx` renders `<AnalyticsSection />` for OWNER and STAFF only below overdue repairs. TECHNICIAN sees today's dashboard unchanged.

## Email Activity on Repair Details

- `GET /api/repairs/:id/emails` (OWNER/STAFF, shop-scoped; repair check and log query run in parallel): the repair's `email_logs`, newest first, as `{ id, type, recipient, status, reason, createdAt, canResend }`. `reason` is `skip_reason` or the code before `:` in `error` (the raw Gmail error is never returned). `canResend` = not SENT, has a `dedupe_key`, and no SENT row with that key (computed from the same result set).
- `POST /api/repairs/:id/emails/:logId/resend` (OWNER/STAFF, `logId` must be a UUID): 404 for an unknown or other-shop/other-repair row; 409 when the row or its `dedupe_key` was already SENT. Rebuilds the email from current data with the same template through `REPAIR_EMAIL_REBUILDERS` (new `src/server/services/repair-email.service.ts`; entity id from `<TYPE>:<id>`), then `sendAndLogShopEmail` with the same key, which **inserts a new row** (the old FAILED row stays as history). Returns `{ status, reason, recipient }`. Approval Required → 409 unless the approval is still PENDING (charges recomputed from the repair's current values + parts); Invoice Generated → 409 when the invoice is CANCELLED; Payment Received → 404 if the payment is gone; Repair Received and status emails always rebuild.
- Reuse instead of new loaders: `findRepairForStatusUpdate` → exported `findRepairEmailContext` (adds problem, labor/additional/tax, shop email to the same query); exported `repairEmailBase` (shared by `buildStatusEmail` and the rebuilders), `buildStatusEmail`, `resolveRepairPricingTotal`; `getInvoiceById`, `listRepairPayments`, `getTotalPaid` reused as-is. `email.service.ts`: `isAlreadySent` exported, new `getEmailOutcomeReason`.
- `repairs.ts`: `requireCreateRepairAccess` generalized to `requireRepairRole(request, roles, message)` (still resolves the role from the DB); param validation via `idParamSchema` / `repairEmailParamSchema` + `validationHook`.
- Shared `src/features/emails/schemas.ts`: `REPAIR_EMAIL_TYPES` (checked against the DB enum with `satisfies`), types, `EMAIL_TYPE_LABELS`, `EMAIL_STATUS_UI`, `getEmailReasonLabel`, `REPAIR_EMAIL_MESSAGES`. `formatDateTime` added to `src/lib/format-date.ts`.
- Client: `useRepairEmails` / `useResendRepairEmail` (`src/features/emails/`); success toast "Email sent to x", otherwise "Email not sent: <reason>" or the API message; always refetches the list and the Gmail status (a revoked token flips the banner).
- UI: `RepairEmailsCard` (after Payments; hidden for TECHNICIAN) with gradient Mail icon, count pill, OWNER-only `GmailStatusWarning` (Connect / Reconnect Gmail → Settings → Email & Notifications), skeleton rows, `QueryErrorState` + Retry, empty state "No emails sent yet". `RepairEmailRow`: tone-coded status icon with soft ring, type label + Sent / Failed / Skipped badge, recipient (`break-all`), reason · time, Resend (spinning icon while sending, all Resend buttons disabled during a send, full width below `sm`). Motion is limited to `.page-enter` and hover/press transitions (reduced motion handled globally).
- No migration. Docs: `project-overview.md` §6b, `ui-context.md` (Repair Details), `architecture-context.md` §14.
- Follow-up (compact list): the card shows 3 emails per page. New `RepairEmailsList` (`repair-emails-list.tsx`) owns the page and the resend mutation. Paging is client-side because the endpoint already returns every row and `canResend` needs all of them; a refetch that shrinks the list clamps the page; a successful resend jumps to page 1, where the new attempt appears. Pager: "1–3 of N", round prev/next buttons, gradient page dots (switches to "x / y" above 5 pages), hidden with 3 or fewer emails. Rows are now compact tiles: a gradient status bar on the left edge, a smaller status icon, type and badge on one line, the recipient truncated (full address in the tooltip), the reason in the status colour, and a small pill Resend button inline with the time at every width. Motion: rows replay `.page-enter` on page change, hover lifts the tile by 1 px, and the active dot widens.

## Payment Received Email

- New `src/server/email/templates/payment-received.ts`: `buildPaymentReceivedEmail(data)` → `{ subject, html }` on `renderEmailLayout` and the shared components (`statusPill`, `heading`, `greeting`, `ticketHighlight`, `detailsCard` + `optionalDetailRows`, `amountBand`, `ctaWithFallback`, `closingNote`); no new HTML primitives. Balance is `max(billTotal - totalPaid, 0)`. At 0: green pill, heading "Payment complete — thank you!", green "Amount paid" band with "Total paid · Balance due: ₹0", subject `<shop>: Payment complete, Ticket #<n>`. Otherwise (fallback only; full payment is enforced): blue pill, amber "Balance due" band, subject `<shop>: Payment received, Ticket #<n>`. Payment card: Amount, Method (`PAYMENT_METHOD_LABELS`), UTR (UPI only, escaped), long Date. No "Advance" label: advance payments don't exist (see "Advance Payment Removed"). No animation: email clients strip CSS motion.
- `recordPayment`: a new shop-scoped `findPaymentEmailContext` (repair → customer, shop; plain read, no extra lock) runs alongside `getTotalPaid` on the transaction; the insert also returns `method`, `reference`, `paidAt`. After the commit it calls `queueShopEmail` with type `PAYMENT_RECEIVED` and `dedupeKey` `PAYMENT_RECEIVED:<paymentId>`. Response unchanged (`{ id, amount }`).
- `queueShopEmail` now accepts `email` as an object or a builder function and resolves it inside its own `try`, so a template error is logged and never fails a committed action. Every post-commit caller now passes a builder: `createRepairTicket`, `requestCustomerApproval` (previously unguarded — Known Issue resolved), `updateRepairStatus` and `createInvoiceFromRepair` (their local try/catch wrappers removed).
- No migration (the `PAYMENT_RECEIVED` enum value already existed). Docs: `architecture-context.md` §14.

## Invoice Generated Email

- Shared email components (`src/server/email/components.ts`): `chargesCard(charges, title)` + `EmailCharges` type moved out of `approval-required.ts` (was `ApprovalCharges`), and `optionalDetailRows(entries)` (drops empty values, escapes, keeps line breaks) moved out of `ready-for-pickup.ts` (was `cardRows`). Approval Required and Ready for Pickup HTML verified byte-identical before/after.
- New `src/server/email/templates/invoice-generated.ts`: `buildInvoiceGeneratedEmail(data)` → `{ subject, html }` on `renderEmailLayout`. Blue "Invoice" pill, heading `Invoice INV-xxxxxx`, greeting; "Invoice" card (number, long date, ticket), "From" (shop name, address, phone, email), "Billed to" (customer name, phone, email), "Device" (label, serial no.); Parts table (Part / Qty / Unit price / Amount, tinted header, part names wrap, numbers never split, "No parts used" row when empty); `chargesCard(..., 'Summary')`; payment band always showing both Paid and Balance due (amber while owed, green when paid in full); View repair status button + link fallback (omitted without a token); reply note. Every user value escaped. Subject `<shop>: Invoice INV-xxxxxx, Ticket #<n>`. No PDF attachment. No animation: email clients strip CSS motion; emphasis comes from the tone-coded pill, table header and amount bands.
- `createInvoiceFromRepair`: the locked repair query now inner-joins customer, device and shop for the email fields (still one shop-scoped query; `.for('update', { of: repairs })` keeps the lock on the repair row only). The invoice number and `getTotalPaid` run together on the transaction; the invoice insert returns `createdAt` for the email date; the charges object is shared by the insert and the email. After the transaction commits, `queueInvoiceGeneratedEmail` calls `queueShopEmail` with type `INVOICE_GENERATED` and `dedupeKey` `INVOICE_GENERATED:<invoiceId>`; a build failure is logged and never fails the committed invoice. Response unchanged (`{ id, invoiceNumber }`).
- No migration (the enum value already existed). Docs: `architecture-context.md` §14.

## Advance Payment Removed

- RepairTrack has no advance payments: the only payment is the full remaining balance, recorded after Finalize Bill (already enforced by `recordPayment`).
- DB: `payments.type` column and `payment_type` enum (ADVANCE/PAYMENT) dropped. Migration `0031_chubby_valkyrie.sql` generated and applied to the shared database (verified: column and enum gone).
- Server: `recordPayment` no longer writes or returns `type`; `listRepairPayments` / `listPayments` no longer select it. Unused `exceedsBill` (advance-era cap helper) removed from `summary.ts`.
- Client: `PaymentType` / `PAYMENT_TYPE_LABELS` removed; `type` dropped from `RepairPayment` / `PaymentListItem`; Record Payment toast is always "Payment of ₹X recorded"; "Advance" tag removed from payment history; Type column removed from the `/payments` table and the type badge from its mobile card; "advances" removed from the `/payments` page copy and empty state.
- Docs: `project-overview.md` Payment Management (one full payment after finalize, no advance/partial).

## Completed Requires Full Payment

- Bug: a technician could set COMPLETED as soon as the bill was finalized, so the Repair Completed email went out with "Amount paid ₹0".
- Rule (shared by API and UI, `pricing-rules.ts`): COMPLETED needs a finalized bill **and** payments ≥ `final_total` (`isBillPaidInFull`; a ₹0 bill counts as paid). `getCompletedTransitionError` now returns `completedNeedsFinalBill` or the new `completedNeedsPayment` ("Owner or staff must record the full payment…").
- `status-transitions.ts`: `StatusTransitionOptions.isPaidInFull`; `isCompletedAwaitingFinalBill` replaced by `getCompletedLockHint` → `'finalize bill first' | 'record payment first' | null`.
- `updateRepairStatus`: passes `isPaidInFull` from the amount paid it already fetches for COMPLETED (no extra query) → 409 when unpaid.
- `getRepairById` returns `isPaidInFull` (a flag, not the amount, so technicians — who can't read payments — get the gate); `getTotalPaid` runs in the existing `Promise.all` only once the bill is finalized.
- Status dropdown: "Completed (record payment first)" disabled + amber hint ("Completed unlocks once owner or staff record the full payment…", `.page-enter`). Record Payment now also refetches the repair so Completed unlocks immediately.
- `verify-request-approval.ts` asserts COMPLETED stays locked when unpaid and unlocks when paid. Docs: `project-overview.md` §6 (post-approval phase).

## Status Emails (Repair Started, Ready for Pickup, Repair Completed)

- Shared email components (`src/server/email/components.ts`): one amber / blue / green tone palette used by `statusPill(label, tone)` (replaces the one-off `ACTION_PILL`) and `amountBand(label, amount, tone, footnoteHtml?)` (tinted label + large amount, optional footnote under a dashed divider); `greeting(customerName)` (escapes); `detailsCard(rows, title?)` (optional uppercase title row); `deviceDetailsCard(device, expectedCompletionDate?)` (Device + Expected by only when set). Repair Received and Approval Required switched to them; their HTML verified byte-identical before/after.
- New templates in `src/server/email/templates/`, each `build<Event>Email(data)` → `{ subject, html }` on `renderEmailLayout`, every user value escaped, tracking button + link fallback (omitted without a token):
  - `repair-started.ts`: blue "In progress" pill, "Work has started on your device", ticket card, Device + Expected by. Subject `<shop>: Repair started, Ticket #<n>`.
  - `ready-for-pickup.ts`: green "Ready for pickup" pill, ticket card, Device, amber "Balance due ₹X" band when a balance is due with "Pay by UPI: <upiId>" (text only, no QR) when the shop has a UPI ID, "Pickup details" card (Address with line breaks, Phone) and "Business hours" card (`formatBusinessHoursRows`, open days only); empty rows/cards are omitted. Subject `<shop>: Your device is ready for pickup, Ticket #<n>`.
  - `repair-completed.ts`: green "Completed" pill, "Thank you for choosing <shop>", ticket card, Device, green "Amount paid" band. Subject `<shop>: Repair completed, Ticket #<n>`.
  - No animation: email clients strip CSS motion; emphasis comes from tone-coded pills and bands.
- `updateRepairStatus`: the repair lookup moved into `findRepairForStatusUpdate` (still one shop-scoped query, now inner-joining customer, device and shop for the email fields). `STATUS_EMAIL_TYPES` maps `IN_REPAIR` → `REPAIR_STARTED`, `READY_FOR_PICKUP` → `READY_FOR_PICKUP`, `COMPLETED` → `REPAIR_COMPLETED`. `getTotalPaid` runs in parallel with `getLatestApproval`, only for Ready for Pickup / Completed. After the transaction commits, `queueRepairStatusEmail` builds the email and calls `queueShopEmail` with `dedupeKey` `<TYPE>:<repairId>`; a build failure is logged and never fails the committed status change. Balance due = `final_total - paid` (floored at 0, only once the bill is finalized, matching public tracking); amount paid = sum of payments.
- No migration (the enum values already existed). Docs: `architecture-context.md` §14.

## Staff Invite: Google Sign-In Joins the Inviting Shop

- Bug: "Continue with Google" on `/invite/[token]` called the plain social sign-in, so the `user.create.before` hook saw no `shopId`, created a new shop and made the invitee an OWNER; the invitation was never used. An existing Google account (e.g. the owner's) was simply signed in.
- Fix: the button now sends `additionalData: { inviteToken }` and `errorCallbackURL: /invite/<token>`. New `src/server/auth/invite-oauth.ts` (`getOAuthInviteToken`, `requirePendingInvitation`, `markInvitationAccepted`, `assertInviteSessionUser`) is used by the Better Auth hooks: new user → invitation must be pending, unexpired and for the same email; role/shop come from the invitation; Google's verified email is kept (no verification email); invitation marked `accepted` after creation. Existing account → session refused unless it is the invited email in the invited shop.
- Rejections return to the invite page with `?error=INVITE_INVALID | INVITE_EMAIL_MISMATCH | INVITE_ACCOUNT_EXISTS`; `getInviteGoogleErrorMessage` (`features/staff/schemas.ts`) maps codes to fixed messages (the URL's free-text description is never shown). Email/password sign-up and owner Google sign-in are unchanged.
- Docs: `architecture-context.md` §13a.

## Verify Email: Hydration Fix + Honest Resend Result

- Hydration mismatch on `/verify-email` ("Resend verification email (2 remaining)" on the server vs "(1 remaining)" on the client): the resend count was read from `localStorage` in a `useState` initializer, which differs between SSR and the browser. It now starts at 0 everywhere and is restored in the existing storage effect after hydration. `MAX_RESENDS` constant replaces the hard-coded `2`.
- Resend reported success when no email was sent: the Better Auth `sendVerificationEmail` hook ignored the `{ sent: false }` result. It now throws `SERVICE_UNAVAILABLE`, so the resend endpoint returns an error, the card shows "We could not send the verification email…" and no resend is consumed. Sign-up / sign-in still succeed (Better Auth logs hook errors there).
- Root cause of non-delivery is an expired platform refresh token (see Known Issues); not fixable in code.

## Approval Required Email

- Shared email components: `DETAIL_VALUE_STYLE`, `ticketHighlight(ticketNumber)`, `textBlock(label, text)` (generalized "Reported problem" block: trims, renders nothing when empty, escapes, then newlines → `<br>`) and `ctaWithFallback(label, url)` (button + link fallback) moved from `repair-received.ts` into `src/server/email/components.ts`. Repair Received HTML verified byte-identical before/after.
- New `src/server/email/templates/approval-required.ts`: `buildApprovalRequiredEmail(data)` → `{ subject, html }` on `renderEmailLayout`. Amber "Action needed" pill, heading "Diagnosis complete — your approval is needed", greeting, ticket-number card, Device details card, Diagnosis block (escaped, line breaks kept), "Estimated charges" card (Labor, Parts, Additional, GST (x%) via `formatRupees`, then a blue Total (incl. GST) band), "Review and approve" button + link fallback to `buildTrackingUrl` (omitted if the repair has no token), reply note. Subject `<shop>: Diagnosis complete — your approval is needed, Ticket #<number>`. No animation: email clients strip CSS motion.
- `requestCustomerApproval`: the existing shop-scoped repair query now also selects ticket number, tracking token, customer name/email, device brand/model and shop name (inner joins; still one round trip). Keeps `partsCharges` / `taxAmount` / `total` from the pricing calculation, the approval insert returns its id, and after the transaction commits it calls `queueShopEmail` with type `APPROVAL_REQUIRED`, `dedupeKey` `APPROVAL_REQUIRED:<approvalId>` and the exact saved numbers. Old "Sprint 3 (Gmail)" placeholder comment removed.
- Docs: `architecture-context.md` §14 (dedupe key, new components).

## Gmail Not-Connected Warning on Create Repair Success Screen

- New reusable `src/components/email/gmail-status-warning.tsx` (`GmailStatusWarning({ canConnect, className? })`): amber card with warning icon, "Gmail isn't connected" / "Gmail needs reconnecting", "Email notifications are unavailable."; OWNER gets a Connect / Reconnect Gmail button (arrow nudges on hover, press scale), STAFF get "Ask the shop owner to connect Gmail." Not dismissible; disappears when connected; renders nothing while loading or on error. Enters with the existing `.page-enter` animation (reduced motion handled globally). Full-width button below `sm`.
- Placed on the "Repair Ticket Created" success screen (`new-repair-workflow.tsx`), between the ticket summary and View Repair Ticket / Create Another Repair; only OWNER/STAFF create repairs, matching who can read the status. Repair Details is unchanged.
- `GET /api/settings/gmail` now allows STAFF and returns status only for them (`email` / `connectedAt` null); every other Gmail route stays OWNER only.
- `/settings/email?from=repair` highlights the Gmail card (amber ring + soft shadow) until connected (`GmailConnectionCard` `highlight` prop).
- Shared `GMAIL_SETTINGS_PATH` / `GMAIL_SETTINGS_FROM_REPAIR_URL` in `src/features/gmail/schemas.ts` replace the duplicated `/settings/email` constants in the Gmail route and the connection card.
- Docs: `project-overview.md` §6b (status visible to STAFF), `ui-context.md` (Repair Details), `architecture-context.md` §14.

## Repair Received Email

- Shared email components: `heading`, `ctaButton`, `linkFallback`, `closingNote`, `detailRow` moved out of `email-templates.ts` into exported `src/server/email/components.ts`, plus `detailsCard(rows)` (the grey details table). Verification, test and invitation HTML verified byte-identical before/after.
- New `src/server/email/templates/repair-received.ts`: `buildRepairReceivedEmail(data)` → `{ subject, html }` on `renderEmailLayout`. Greeting, blue ticket-number highlight card (monospace, letter-spaced), details card (Device via `formatDeviceLabel`; Expected by via `formatDate(..., 'long')` only when set), Reported problem block (line breaks kept), "Track your repair" button + link fallback to `buildTrackingUrl` (omitted if a repair has no token), closing note. Every user value goes through `escapeHtml`. Subject `<shop>: Repair received, Ticket #<number>`. No animation: email clients strip CSS motion.
- `createRepairTicket`: the existing customer query now also selects name, email and the shop name (inner join on `shops`, still shop-scoped); the device query selects brand/model. No extra round trips. After the transaction succeeds it calls `queueShopEmail` with type `REPAIR_RECEIVED`, the customer's email, and `dedupeKey` `REPAIR_RECEIVED:<repairId>`.
- `queueShopEmail` never throws: a failure to schedule `after()` (e.g. outside a request) is logged as "could not be queued" instead of failing an action that already committed.
- `verify:approval-schema`, `verify:request-approval`, `verify:reopen-repair` now preload `scripts/server-only-shim.mjs` (they import `repair.service`, which now loads `email.service`).
- Docs: `architecture-context.md` §14 (components, templates folder, per-event dedupe key, `queueShopEmail` never throws).

## Shared Email Sender

- New `email_logs` table (`src/server/db/schema/email-logs.ts`) with pg enums `email_type` (REPAIR_RECEIVED, APPROVAL_REQUIRED, REPAIR_STARTED, READY_FOR_PICKUP, REPAIR_COMPLETED, INVOICE_GENERATED, PAYMENT_RECEIVED, TEST) and `email_status` (SENT, FAILED, SKIPPED): `shop_id` (cascade), nullable `repair_id` (set null), `type`, nullable `recipient`, `subject`, `status`, `skip_reason`, `error`, `dedupe_key`, `gmail_message_id`, timestamps; indexes `email_logs_shop_id_idx`, `email_logs_repair_id_idx`. Migration `0029_closed_star_brand.sql` generated, not applied.
- `gmail.service.ts`: `SendEmailResult` now carries `messageId` (Gmail's `data.id`) on success and `error` (message) on failure; `GmailSender` gained optional `shopEmail`. Existing callers unchanged.
- `getShopGmailSender` also returns `shops.email` as `shopEmail` (same query, one more column).
- New `src/server/services/email.service.ts`:
  - `queueShopEmail({ shopId, repairId, type, to, email: { subject, html }, dedupeKey })` schedules delivery with `after()` from `next/server` and returns immediately.
  - Delivery: empty recipient → SKIPPED `no_customer_email`; SENT log with the same shop + `dedupe_key` → SKIPPED `already_sent`; otherwise sends through the existing `sendShopEmail` (From "<shop name>" <connected Gmail>, Reply-To the shop email when set) → SENT with `gmail_message_id`, SKIPPED `gmail_not_connected`, or FAILED with `<reason>: <message>`. `invalid_grant` still flips the connection to NEEDS_RECONNECT.
  - Exactly one log row per call. Unexpected send errors become FAILED; a failure to write the log is caught and `console.error`-ed (no tokens or bodies), never an unhandled rejection.
  - `buildTrackingUrl(trackingToken)` → `<NEXT_PUBLIC_APP_URL>/track/<token>` (falls back to `BETTER_AUTH_URL`, then localhost; trailing slash stripped; token URL-encoded).
- No UI, no routes.
- Docs: `architecture-context.md` §8 (`email_logs`) and §14 (`sendEmail` result shape, `queueShopEmail` rules).
- Fix (no rows in `email_logs`): nothing called `queueShopEmail`, so no code path wrote a log. Added awaitable `sendAndLogShopEmail(input)` (returns the outcome; `queueShopEmail` wraps it in `after()`), and moved `sendGmailTestEmail` from `gmail-connection.service.ts` into `email.service.ts` so every Send test email now writes a `TEST` row (SENT / FAILED / SKIPPED `gmail_not_connected`). FAILED outcomes carry `reason`; the error column stores `<reason>: <message>`. A failed log insert is reported as `email_logs insert failed (...)` in the server console instead of failing an email that was already sent. Verified against the database: a row is inserted and read back.
- Staff invitations logged: `email_type` gained `STAFF_INVITATION` (migration `0030_safe_skullbuster.sql`, applied to the shared database). `inviteStaff` now sends through `sendAndLogShopEmail` (shop name read via `getShopById` for the subject/body); `toInviteEmailStatus` maps the outcome (SENT → `sent`, SKIPPED → `not_connected`, FAILED `invalid_grant` → `reconnect_needed`, other FAILED → `failed`), so the Add Staff UI is unchanged. Link-only invites (Gmail not connected) are logged as SKIPPED `gmail_not_connected`. Each invitation's email uses `dedupeKey` `STAFF_INVITATION:<invitation id>` (the id, never the token, which is the secret invite link): one invitation is emailed at most once, and re-inviting creates a new invitation, so it sends again. `dedupe_key` stays optional (TEST emails are always resendable); `repair_id`, `error` and `gmail_message_id` are null by design for invites, skipped rows and unsent rows respectively.

## Staff Invitation Email via Owner's Gmail

- `inviteStaff` sends the invitation through `sendShopEmail` after saving it (subject "You've been invited to join <shop> on RepairTrack", absolute invite URL). Email failure never fails the invite; the link is always returned.
- `InviteStaffResponse.emailStatus`: `sent` | `not_connected` | `reconnect_needed` (`invalid_grant`, connection flagged NEEDS_RECONNECT) | `failed`; mapped by `toInviteEmailStatus`.
- `buildStaffInvitationEmailHtml` takes `expiresIn` (was hard-coded "7 Days"; real TTL is 10 minutes) and shows the shop name in the header instead of "RepairTrack". `verify-email.ts` updated.
- `getAppUrl()` helper in `staff.service.ts` shared by the invite URL and reactivation verification URL.
- Add Staff: description and submit button switch to "Send Invitation" when Gmail is connected; success screen title/message per `emailStatus`; `useInviteStaff` refetches the Gmail status on `reconnect_needed`.

## Owner Gmail Connection

- googleapis only (`google.auth.OAuth2`); no new packages. Scopes `gmail.send openid email` (the open decision from the previous task: `openid email` added to read the connected address; key named `GMAIL_TOKEN_ENCRYPTION_KEY`).
- `src/server/crypto/encrypt.ts`: `encrypt` / `decrypt` with AES-256-GCM (`node:crypto`), random 12-byte IV, stored as `iv.tag.ciphertext` base64url; key = `GMAIL_TOKEN_ENCRYPTION_KEY` (32 bytes base64, validated on first use).
- `gmail_connections` table (`src/server/db/schema/gmail-connections.ts`): `shop_id` (unique, cascade), `email`, `refresh_token_encrypted`, `status` (`gmail_connection_status` enum CONNECTED / NEEDS_RECONNECT), `connected_at`, timestamps; migration `0028_damp_ironclad.sql` generated, not applied.
- `gmail.service.ts`: shared `createGmailOAuthClient()` (now also used by `sendEmail`), `GMAIL_SCOPES`, `GMAIL_SEND_SCOPE`.
- New `gmail-connection.service.ts`: `getGmailConnection` (status for the UI, never the token), `buildGmailAuthUrl` (`access_type: 'offline'`, `prompt: 'consent'`), `connectGmail` (getToken → requires the send scope, a refresh token and a verified id-token email → encrypt → upsert; revokes the previous token only when a different account replaces it), `disconnectGmail` (delete row, then best-effort `revokeToken`), `getShopGmailSender(shopId)` (`GmailSender | null`; undecryptable tokens flip to NEEDS_RECONNECT), `sendShopEmail(shopId, buildMessage)` (the one send path for shop emails; `invalid_grant` → NEEDS_RECONNECT; `not_connected` when there's no sender), `sendGmailTestEmail` (maps failures to 409 / 502 / 503).
- Routes `src/server/hono/routes/gmail.ts` at `/api/settings/gmail`, all OWNER only: `GET /` (status), `GET /connect` (random state in a signed httpOnly `SameSite=Lax` cookie scoped to `/api/settings/gmail`, 10 min; redirect to Google), `GET /callback` (Zod query, state must equal the signed cookie, cookie cleared; redirects to `/settings/email?gmail=connected|denied|missing_scope|failed`, errors logged without tokens), `POST /disconnect`, `POST /test` (to the owner's session email).
- Test email template `buildGmailTestEmailHtml` reuses `renderEmailLayout` / `heading` / `closingNote`.
- Client: `src/features/gmail/` (`schemas.ts` status UI map + callback messages + callback query schema, `queries.ts` `gmailConnectionKey` / `useGmailConnection`, `mutations.ts` `useDisconnectGmail` / `useSendTestEmail` with toasts; a 409 refetches the status).
- UI: `/settings/email` page (OWNER gate, server-loaded initial status), `GmailConnectionCard` (status Badge + "Connected: email" / reconnect explanation, Connect / Reconnect, Disconnect with confirm dialog, Send test email with spinner, error state with Retry, callback toast then `?gmail=` removed), shared `ConnectGmailButton` (link with redirecting spinner) also used by `ConnectGmailPrompt` (button now live, "coming soon" removed). No new sidebar item: Settings has route-based `SettingsTabs` (Shop Profile `/settings/shop` | Email & Notifications `/settings/email`) on both pages.
- Add Staff skips the Connect Gmail prompt when Gmail is connected; success text is now "No email was sent." (invites stay link-only until the next task).
- `.env.example`: `GMAIL_REDIRECT_URI`, `GMAIL_TOKEN_ENCRYPTION_KEY`.
- Docs: `project-overview.md` (scopes, statuses, reconnect), `architecture-context.md` §1 / §7 / §8 / §11 / §14, `stack-standards.md` §14, `ui-context.md` (Email & Notifications).

## Connect Gmail Prompt on Add Staff

- Sender rule confirmed: the RepairTrack platform sender only sends verification/auth emails (Owner registration, staff signup and reactivation verification, future password reset). Staff invitations, repair updates, invoice and payment emails come only from the Owner's connected Gmail, with no platform fallback.
- New reusable `src/components/email/connect-gmail-prompt.tsx` (`ConnectGmailPrompt({ description, continueLabel, onContinue })`): Mail icon header, "Gmail not connected" `Badge`, disabled Connect Gmail button with a "coming soon" hint (`aria-describedby`), and a continue action.
- `AddStaffDialog` opens on the prompt; "Continue with link only" shows the existing form; closing resets to the prompt. The success screen says no email was sent.
- No server or API change (invites were already link-only). The earlier "platform fallback for invitations" plan was dropped.
- Docs: `project-overview.md` (Staff Management + Owner Gmail Connection), `architecture-context.md` §14 (what counts as account verification), `ui-context.md` (Staff Management + the single prompt rule for every email-sending action).

## Email Foundation (googleapis only)

- No new packages and no migration; no Nodemailer / React Email.
- `src/server/email/escape-html.ts`: `escapeHtml(value)`.
- `src/server/email/layout.ts`: `renderEmailLayout({ shopName, title, bodyHtml, footerHtml? })`, the shared table shell (header with "RT" badge + shop name, white card, footer). Escapes `shopName` / `title`; the footer defaults to the RepairTrack line.
- `src/server/email/raw-message.ts`: `buildRawEmail({ fromName, fromEmail, to, replyTo?, subject, html })`. Strips CR/LF from headers, RFC 2047 `=?UTF-8?B?...?=` From name and Subject, `text/html; charset=UTF-8` with base64 body wrapped at 76 characters, base64url output.
- `gmail.service.ts`: `sendEmail(sender: GmailSender, message)` takes the sender's credentials and returns `{ sent: true } | { sent: false, reason: 'not_configured' | 'invalid_grant' | 'send_failed' }` (never throws, logs no tokens or bodies). The `.env` platform sender is private and only reachable through `sendAccountVerificationEmail`.
- `email-templates.ts`: both templates use `renderEmailLayout` + `escapeHtml` with small shared helpers (heading, CTA button, link fallback, closing note, detail row). The rendered HTML matches the old output, apart from the HTML-escaped apostrophe in the invitation `<title>`.
- Call sites: `auth/index.ts` and staff reactivation call `sendAccountVerificationEmail`; `inviteStaff` no longer sends email (link-only) and its unused shop lookup was removed.
- `scripts/verify-email.ts` (`bun run verify:email`): sends the verification email (platform sender) and the invitation template (credentials passed as the sender parameter); both sent successfully.
- Docs: approved trigger list replaced in `project-overview.md`; platform-sender exception added to `architecture-context.md` §14 (referenced from §2); `.env.example` comments.

## Pending Payments

- `GET /api/payments/pending` (`src/server/hono/routes/payments.ts`): OWNER/STAFF, shop-scoped endpoint returning non-cancelled repairs where the customer has approved and the bill is finalized by staff (`isNotNull(repairs.finalTotal)`), with an outstanding balance (`final_total - totalPaid > 0`).
- `getPendingPayments` (`src/server/services/payment.service.ts`): calculates payments sum in SQL using a grouped subquery on `payments` (`GROUP BY repair_id`), avoiding JavaScript summation loops. Orders in SQL by `balance desc, created_at desc`. Concurrently fetches shop UPI configuration for instant QR payment readiness. Returns items, `totalOutstanding` (sum of balances in paise), and `upi`.
- Client integration (`src/features/payments/queries.ts` and `mutations.ts`): added `'use client'` module boundary, `PendingPaymentItem`, `PendingPaymentsResponse`, `paymentKeys.pending`, and `usePendingPayments` hook with 30s cache. `useRecordPayment` invalidates `paymentKeys.all` on success and 409 conflict so both Pending and All payment lists synchronize immediately.
- Reusable UI Tabs (`src/components/ui/tabs.tsx`): accessible, lightweight shadcn-style segmented tabs (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) supporting keyboard navigation and custom tab state.
- Pending Payments View (`src/components/payments/pending-payments-table.tsx`): Total Outstanding banner showing aggregate pending amount via `formatRupees` and count of pending repairs; responsive table with Ticket #, Customer (name + phone), Status badge with icon, Bill Total, Balance (bold), and visible "Action" column header with animated, eye-catching emerald "Record Payment" button (`hover:scale-[1.03] active:scale-[0.97]` with icon pulse). `PAID` and `LAST PAYMENT` columns removed. Loading skeletons, `TableEmptyState` ("No pending payments"), and `QueryErrorState` with retry.
- Mobile Layout (`src/components/payments/pending-payment-card.tsx`): dedicated card layout for viewports under 768px down to 375px showing Bill Total, Balance, and full-width animated Record Payment button.
- `/payments` page (`src/app/(dashboard)/payments/page.tsx` + `payments-tabs.tsx`): segmented tabs for "All payments" and "Pending".
- `RecordPaymentDialog`: removed ticket redirection; clicking "Record Payment" directly presents the payment recording form (Cash or UPI with live QR code and 12-digit UTR validation) with customer context (`customerName • Ticket #ticketNumber`).


## Payment List

- `paymentFilterSchema`: extended `paginationQuerySchema` with `repairId`, `search` (customer name/phone or ticket number), `method` (`CASH`, `UPI`, `CARD`, `BANK_TRANSFER`), `startDate` and `endDate`.
- `GET /api/payments` (`src/server/hono/routes/payments.ts`): supports dual modes — preserves `repairId` lookup for repair payment summaries, and executes paginated list when querying shop payments. Requires `OWNER` or `STAFF`.
- `listPayments` (`src/server/services/payment.service.ts`): high-performance single query utilizing Postgres window functions `count(*) over ()` and `sum(payments.amount) over ()` to fetch items, filtered count, and total collected amount in 1 round-trip. Escapes search via `toContainsPattern`. Joins `repairs`, `customers`, `users`, and `invoices` (`status = 'ISSUED'`). Ordered by `paid_at desc, id desc`.
- Client hook `usePayments` (`src/features/payments/queries.ts`): TanStack Query hook with `keepPreviousData`, 30s cache, and automatic next-page prefetching for fast responses.
- `PaymentTable` (`src/components/payments/payment-table.tsx`): TableCraft (`DataTable`) with 8 columns (Date, Customer, Ticket #, Invoice #, Amount via `formatRupees`, Method, Type badge, Received by). `DebouncedSearchInput` (250ms), Method `<Select>`, Date range inputs, active filter reset button, and Filtered Total banner at the top showing total rupees and payment count. Loading, empty (`TableEmptyState`), and error (`QueryErrorState`) states.
- `PaymentListCard` (`src/components/payments/payment-list-card.tsx`): responsive card layout for mobile viewports below `md`, styled down to 375px.
- `/payments` page (`src/app/(dashboard)/payments/page.tsx`): server component with session auth and `TECHNICIAN` redirect.
- Navigation & guards: added Payments link to desktop sidebar (`src/app/(dashboard)/layout.tsx`) and mobile navigation (`src/components/dashboard/mobile-nav.tsx`) for `OWNER`/`STAFF`. Restricted `TECHNICIAN` role and matched `/payments` in `middleware.ts`.

## UTR for UPI Payments & Tracking Payment Gating

- `recordPaymentSchema`: `reference` required and must be exactly 12 digits (`/^\d{12}$/`) when `method === 'UPI'`, with message `"Enter the 12-digit UTR from your bank app"`. Reference remains optional for other methods.
- `REFERENCE_PLACEHOLDERS.UPI` updated to `"12-digit UTR number"`.
- `record-payment-dialog.tsx`: label updated to `"UTR number *"`, `maxLength={12}`, placeholder and helper text updated; redundant client-side check removed in favor of `zodResolver`.
- `payment.service.ts`: `recordPayment` verifies that no existing UPI payment in the same shop has the same reference; returns HTTP 409 `"This UTR is already recorded"`.
- `tracking.service.ts`: Payment section on public tracking is strictly gated to finalized repairs (`row.finalTotal != null && row.status !== 'CANCELLED'`). Before the bill is finalized, the payment block is omitted and the Payment card is not rendered on `/track/[ticketId]`.

## UPI QR on Public Tracking

- Read-only; no new endpoint and no mutation.
- `src/features/tracking/schemas.ts`: added optional `payment` block to `publicTrackingResponseSchema` (`{ billTotal, totalPaid, balance, status, upiId?, payeeName? }`).
- `src/server/services/tracking.service.ts`:
  - `loadPublicRepairData` joins `shops.upiId` and `shops.upiPayeeName`.
  - Included only when a bill total exists and the repair isn't `CANCELLED`.
  - Reuses `getTotalPaid` from `payment.service.ts` and `getPaymentSummary` from `summary.ts` to compute totals safely without exposing individual payment rows, staff names, or references.
  - `upiId` and `payeeName` (falling back to shop name) are included only after the bill is finalized (`finalTotal != null`), `balance > 0`, and the shop has configured a `upi_id`.
- `src/components/tracking/track-payment-card.tsx`:
  - Shows Paid, Balance due (`Math.max(balance, 0)`), and `PaymentStatusBadge`.
  - When the bill is not yet finalized, displays a clear hint that UPI payment will be available once confirmed.
  - When the bill is finalized, `balance > 0`, and `upiId` is configured, reuses `UpiPayCard` and renders a "Pay with UPI app" button (`<a href={upiLink}>`) shown only on mobile (`sm:hidden`).
  - When `status === 'PAID'`, displays "Paid in full".
  - Responsive design across mobile (375px+), tablet, and desktop.
- `src/components/tracking/track-status-view.tsx`: renders `TrackPaymentCard` when `data.payment` is present.
- Updated `context/ui-context.md` §11b and `context/progress-tracker.md`.

## UPI QR (internal)

- Added `qrcode` (+ `@types/qrcode`)
- `src/features/payments/upi.ts`: `buildUpiLink` (`upi://pay`, `am` in rupees with 2 decimals, `cu=INR`, `tn=Ticket <no>`, every value `encodeURIComponent`-ed), `toUpiQrDataUrl` (`QRCode.toDataURL`), `canCollectByUpi` (balance > 0 and repair not CANCELLED), `ShopUpi` type
- `GET /api/payments?repairId=` now also returns `repairStatus` and `upi` (`{ upiId, payeeName } | null`, payee falls back to the shop name via `getUpiPayeeName`); `getShopUpi` in `shop.service.ts` runs in parallel with the payments query — no new endpoint, STAFF gets it without Shop Profile access
- `UpiGate` (render prop) owns the visibility rule: nothing when there's nothing to collect; OWNER-only "Add a UPI ID in Shop Profile" link (print-hidden) when no UPI ID; otherwise renders its child
- `UpiPayCard`: QR via `useQuery` keyed by the link (cached, regenerates when the balance changes), skeleton while generating, fallback text on error, "Scan to pay ₹X", UPI ID with copy button (toast on success/failure, print-hidden), "After paying, share the UTR number with the shop."
- Repair Details Payments card: "Show UPI QR" button next to Record Payment opens a "Pay by UPI" dialog
- Invoice page: QR card next to the Paid / Balance totals (also printed), hidden on cancelled invoices; `userRole` passed from the page
- PDF part skipped: Download PDF / `invoice-pdf-document.tsx` was removed; Print → "Save as PDF" includes the QR

## Shop UPI ID

- `shops.upi_id` / `shops.upi_payee_name` (nullable text); migration `0027_adorable_night_thrasher.sql` generated, not applied
- `shopProfileSchema`: `upiId` optional, blank or `UPI_ID_REGEX` ("Enter a valid UPI ID, e.g. shopname@okaxis"); `upiPayeeName` optional, max 50; blanks stored as null
- `getUpiPayeeName(shop)` in `src/features/shop/schemas.ts` owns the fallback to the shop name (resolved at use, so renames follow)
- Shop Profile form: "UPI payments" section (UPI ID, payee name with the shop name as placeholder); save error now shows the server message via `getApiErrorMessage`
- `shops.ts` route uses shared `requireRole(['OWNER'])` + `validationHook` (real validation message instead of "Validation failed"); `requireRole` now also returns `email`
- `toShopProfileResponse` in `shop.service.ts` replaces the duplicated mapping in `GET /api/shops/me` and `settings/shop/page.tsx`
- `project-overview.md`: Settings and Payment Management list "Shop UPI ID for QR payments; manual confirmation, no gateway"

## Payment Summary per Repair

- `GET /api/payments?repairId=` (OWNER/STAFF, shop-scoped, `repairPaymentsQuerySchema`) → `{ payments, billTotal, totalPaid, balance, status }`; payments newest first with `receivedByName`; `balance` / `status` null until the repair has a bill total (`getBillTotal`); summary from `getPaymentSummary` over the same rows (no second query)
- `payment.service.ts`: shared `findRepairForPayment` (shop scope, 404, optional row lock) used by `recordPayment` and `listRepairPayments`
- `getRepairById` no longer returns `totalPaid`; the payments query is the single source
- Client: `useRepairPayments` + `paymentKeys.byRepair`; Record Payment invalidates only the repair's payments (409 also refetches the repair); `useRepairPricingMutation` (save estimate / finalize / request approval) invalidates the payment summary
- Shared UI in `src/components/payments/`: `RepairPaymentsLoader` (loading skeleton + `QueryErrorState` with Retry, `print:hidden`), `PaymentTotals` (optional Bill total row, Paid, Balance due, Status), `PaymentStatusBadge` (Unpaid / Partial / Paid), `PaymentHistoryList` (date, amount, method, reference, received by, Advance tag; "No payments yet")
- Repair Details: `PaymentSummaryCard` replaces `RepairPaymentAction` (deleted); Record Payment moved into it, hidden when nothing is left to collect (Paid), disabled when cancelled
- Invoice page: `InvoicePayments` under the summary — Paid / Balance due / status measured against the invoice's stored `total`, plus the payment list; included in the print view

## Download PDF Removed

- Print is the only invoice output ("Save as PDF" in the print dialog)
- Deleted `download-pdf-button.tsx`, `invoice-pdf-document.tsx`, `src/lib/download.ts`, `src/lib/pdf-fonts.ts`, `public/fonts/NotoSans-*.ttf`; removed `@react-pdf/renderer`
- The "Download Invoice PDF" entry below is kept as history

## Record Payment

- `POST /api/payments` (OWNER/STAFF, shop-scoped) → 201 `{ id, amount, type }`. Body `recordPaymentSchema` (`src/features/payments/schemas.ts`): `repairId`, `amount` in rupees (> 0, ≤ 2 decimals, ≤ ₹1 crore), `method`, optional `reference` / `note`. The client never sends `type`
- `recordPayment` (`payment.service.ts`): one transaction, locks the repair row; 404 when not in this shop; 409 when CANCELLED; 409 "Amount is more than the balance due" when a bill total exists and paid + amount exceeds it; `type` = ADVANCE while `final_total` is null, else PAYMENT; reference dropped for CASH
- Bill total rule shared in `summary.ts`: `getBillTotal` (final_total ?? estimated_total) and `exceedsBill` — used by the server guard and the dialog
- `updateRepairFinalTotal`: write moved into a transaction with the same repair row lock; 409 when the new total is below the amount already paid
- `getRepairById` returns `totalPaid` (paise)
- New shared `requireRole(request, roles, forbiddenMessage)` in `src/server/hono/session.ts`; invoices route switched to it (behaviour unchanged)
- UI: `RepairPaymentAction` card on Repair Details (OWNER/STAFF): "Paid ₹X of ₹Y. Balance ₹Z" (or advance note), Record Payment button disabled when cancelled / paid in full. `RecordPaymentDialog`: Amount prefilled with the balance, Method Select, Reference for non-cash (placeholder per method), Note; client balance check, spinner, inline API error; form resets on every open
- `useRecordPayment`: success toast ("Advance/Payment of ₹X recorded"), invalidates repair detail + `paymentKeys.all`; 409 refetches the repair

## Payment Schema Foundation

- New `src/server/db/schema/payments.ts`: pg enums `payment_method` (CASH/UPI/CARD/BANK_TRANSFER) and `payment_type` (ADVANCE/PAYMENT); `payments` table (`shop_id`, `repair_id` (many per repair, restrict), `customer_id` (restrict), `amount` integer paise with DB check `payments_amount_positive` (> 0), `method`, `type`, optional `reference` (UPI txn ID / last 4 card digits / bank ref) and `note`, `received_by` (users, set null), `paid_at`, timestamps) plus relations
- Indexes: `payments_shop_id_idx`, `payments_repair_id_idx`, `payments_paid_at_idx`
- Migration `0026_furry_blade.sql` generated with drizzle-kit, not applied
- Pure `getPaymentSummary({ billTotal, payments })` in `src/features/payments/summary.ts` → `{ totalPaid, balance, status: 'UNPAID' | 'PARTIAL' | 'PAID' }` (paise; balance goes negative on overpayment; nothing paid → UNPAID)
- No UI / API routes

## Download Invoice PDF

- Why: OS printer drivers such as "Microsoft Print to PDF" or OneNote ignore the page title, so `window.print()` can't suggest a file name there. The app now builds the PDF itself and downloads it under the exact name.
- New dependency (approved): `@react-pdf/renderer` 4.9.0. It is loaded with a dynamic import only when Download PDF is clicked, so it adds nothing to the page bundle.
- Fonts: `public/fonts/NotoSans-Regular.ttf` and `NotoSans-Bold.ttf` (SIL OFL). The built-in PDF fonts have no ₹ glyph.
- Reusable pieces:
  - `src/components/ui/download-pdf-button.tsx`: `DownloadPdfButton({ fileTitle, loadDocument })` with a loading state; shows a toast and logs to the console on failure.
  - `src/lib/download.ts`: `downloadBlob(blob, fileName)`.
  - `src/lib/pdf-fonts.ts`: `registerPdfFonts()` (registers once, no hyphenation).
- Invoice pieces:
  - `src/components/invoices/invoice-pdf-document.tsx`: A4 layout matching the page (shop header, status, Customer/Device, parts table with rows kept whole, stored summary). It reuses `customerRows`/`deviceRows`, `formatRupees`, `formatDate` and `INVOICE_STATUS_LABELS`.
  - `src/features/invoices/format.ts`: `invoiceFileTitle` (shared by Print and Download PDF) and `invoiceLineTotal` (shared by the parts table and the PDF).
- `/invoices/[id]` toolbar: Download PDF, Print, Cancel Invoice.

## Print Invoice

- `/invoices/[id]` toolbar has a Print button (`window.print()`; no library, no API)
- Suggested "Save as PDF" name: `Customer Name - INV-000012 - Ticket 4829301756` (set as `document.title` while printing, restored on `afterprint` or right away if printing throws)
- Reusable pieces:
  - `src/lib/print.ts`: `toFileTitle(parts)` strips characters file names can't contain, drops empty parts, caps at 120 characters; `printWithTitle(title)`
  - `src/components/ui/print-button.tsx`: `PrintButton({ fileTitle, label })`, which shows a toast when printing is unavailable
- Print CSS uses Tailwind `print:` variants:
  - Hidden: sidebar, top header, toolbar buttons, cancelled banner, toasts
  - Flat white paper with no border, shadow or padding
  - Desktop layout forced on A4 (header row, 2-column Customer/Device, parts table instead of stacked rows, summary on the right)
  - Parts rows, the parts section and the summary use `break-inside-avoid`
- `globals.css`: `@page { size: A4; margin: 12mm }` and a white background for print (Tailwind has no utility for `@page`)
- No migration, no dependency, no API change
T
## Invoice Details (Printed Layout)

- `GET /api/invoices/:id` (OWNER/STAFF, shop-scoped; `idParamSchema` validates `:id`, also on `POST /:id/cancel`): `getInvoiceById` now joins shops and devices and returns `shop { name, address, phone }`, `customer.email`, `device { brand, model, serialNumber }`; another shop's invoice → 404 (verified read-only against the DB)
- `GET /api/invoices?customerId=` filter: `listInvoices` builds its WHERE from a conditions array (shop scope, optional customer, optional search)
- `/invoices/[id]` reworked into a printed-invoice "paper" card from small components: `InvoiceHeader` (shop, invoice #, status, date, ticket link), `InvoiceParty` (generic label/value list; `customerRows` / `deviceRows`), `InvoicePartsTable` (table from `sm`, stacked rows below; empty state), `InvoiceSummary` (stored Labor, Parts, Additional, Tax (x%), bold Total; no recalculation, no Discount row), `InvoiceDetailsSkeleton`; toolbar keeps Back to invoices + Cancel Invoice, cancelled banner unchanged
- Shared building blocks: `formatDate` (`src/lib/format-date.ts`, replaces `formatInvoiceDate`), `idParamSchema` (`src/lib/validation.ts`), `AmountRow` exported from `pricing-breakdown-rows.tsx`; `QueryErrorState` gained `notFoundMessage` (neutral 404 style), `action`, and hides Retry for every 4xx
- Customer Details: new Invoices section (`CustomerInvoices`) — latest 20 invoice cards linking to `/invoices/[id]`, loading skeletons, error with Retry, empty state, "Showing latest 20 of N"
- No migration

## Invoice List + API Error Handling

- `GET /api/invoices` (OWNER/STAFF, shop-scoped): `invoiceFilterSchema` = shared `paginationQuerySchema` + `search` (≤100) + `sortBy` (`createdAt` | `invoiceNumber` | `total`); returns `PaginatedResponse` `{ items, total, page, limit, totalPages }`
- `listInvoices`: narrow projection (number, status, total, date, ticket, customer, device), inner joins on PKs, rows + count in parallel, count without joins when not searching, escaped `ilike` on invoice number / customer name / phone, stable `id` tiebreaker
- Migration `0025`: composite `invoices_shop_id_created_at_idx` so the default newest-first page needs no sort
- **Central error handler** (was missing despite `stack-standards.md`): `app.onError` maps `HTTPException` to `{ error: { message, code } }` (VALIDATION_ERROR/UNAUTHORIZED/FORBIDDEN/NOT_FOUND/CONFLICT/RATE_LIMITED); unknown errors are logged and return a generic 500 `INTERNAL_ERROR`; `app.notFound` returns JSON 404. Previously thrown 409/403 messages reached the client as plain text and showed generic fallbacks
- New shared helpers: `src/lib/pagination.ts`, `src/server/lib/sql-search.ts` (`toContainsPattern`), `src/server/hono/validation.ts` (`validationHook`, first issue message), `src/lib/format-device.ts`, `shouldRetryQuery` (no retry on 4xx) in `api-error.ts`, `QueryErrorState` component; `DataTable` gained optional `renderMobileCard` (cards below `md`, shared pagination)
- `/invoices` page: `InvoiceTable` (DebouncedSearchInput, Invoice # + Issued/Cancelled badge, Customer, Device, Total, Date, View; sortable number/total/date), `InvoiceListCard` on mobile, `TableEmptyState` for no invoices / no matches, `QueryErrorState` with Retry; `useInvoices` keeps previous data, caches 60 s and prefetches the next page; create/cancel invalidate the list
- Invoice details error state now uses `QueryErrorState`
- **Search took ~9 s — fixed.** Cause: connection pool `idle_timeout: 30` closed connections after short pauses, and reconnecting to Neon costs ~4 s each (session lookup + the parallel count query opened two); plus `prepare: false` (and drizzle's `sql.unsafe()` default) made every parameterized query 2 round-trips. Fix in `src/server/db/index.ts`: prepared statements on (verified through Neon's pooler under concurrent queries and transactions), `idle_timeout: 600`. `listInvoices` is now one query using `count(*) over ()` (a count query runs only when a page beyond the end is empty). Warm list: ~620 ms → ~310 ms; the ~4 s reconnect no longer happens after short pauses. App-wide effect: every drizzle query (incl. Better Auth session lookups) drops from 2 round-trips to 1

## Invoice Lock + Cancel & Reissue

- Problem: unlocking/editing the estimate after an invoice was generated left the invoice stale. Now an Issued invoice locks the bill; changes require Cancel Invoice → Finalize Bill → Generate New Invoice
- Migration `0024`: `invoice_status` enum (ISSUED/CANCELLED, default ISSUED), `cancellation_reason`, `cancelled_at`, `cancelled_by` (users, set null); dropped unique `repair_id`, added `invoices_repair_id_idx` and partial unique `invoices_one_issued_per_repair_uidx` (`WHERE status = 'ISSUED'`)
- `pricing-rules.ts`: `PRICING_MESSAGES.invoiceIssued`; optional `hasIssuedInvoice` in `getPricingPanelMode` (view), `getEstimateEditViolation`, `getFinalizeBillViolation`, `getSendApprovalViolation` (409)
- `invoice-lock.helpers.ts`: `hasIssuedInvoice` / `assertNoIssuedInvoice`; applied in estimate edit, finalize bill, request approval and add/update/remove repair parts
- `cancelInvoice` (transaction, row lock; 404 missing; 409 already cancelled) + `POST /api/invoices/:id/cancel` (`cancelInvoiceSchema` reason 3–500 chars, OWNER/STAFF); invoice number is never reused
- `getRepairById` returns `invoices: { id, invoiceNumber, status }[]` (newest first); `getInvoiceById` returns status + cancellation details
- UI: Repair Details shows View Invoice while Issued (pricing panel, parts and approval locked with the reason), Generate New Invoice after cancellation, plus links to cancelled invoices; invoice page shows Issued/Cancelled badge, Cancel Invoice dialog (required reason, loading state) and a cancelled banner linking back to the repair
- Reopen: Issued invoice stays valid when nothing changes; otherwise cancel → finalize → generate new

## Generate Invoice

- `POST /api/invoices` (`createInvoiceSchema` `{ repairId }`, OWNER/STAFF, shop-scoped) → 201 `{ id, invoiceNumber }`; `GET /api/invoices/:id` for the detail page
- `createInvoiceFromRepair` runs in one transaction: locks the repair row; 404 missing; 409 when `final_total` is null, an invoice already exists, or the live `calculateRepairTotal` (pricing-calc.ts) no longer equals `final_total` (parts/charges changed after finalizing); then `generateInvoiceNumber`, inserts the invoice and one `invoice_items` row per `repair_parts` line
- `listRepairParts` accepts an optional `client` (transaction); shared `DbClient` type exported from `@/server/db`
- `getRepairById` returns `invoice: { id, invoiceNumber } | null`
- Repair Details `RepairInvoiceAction` (OWNER/STAFF, only when the bill is finalized): Generate Invoice with loading state → toast with "View invoice" action; View Invoice once generated; 409 refetches the repair
- Minimal read-only `/invoices/[id]` (`InvoiceDetails`): loading skeleton, error + retry, parts list with empty state, stored totals via `PricingBreakdownRows`; TECHNICIAN redirected (page + middleware)

## Invoice Schema Foundation

- Added `invoices` (one per repair via unique `repair_id`; labor/parts/additional charges, `tax_percent`, `tax_amount`, `total` as integer paise; `created_by` set null) and `invoice_items` (`part_name` snapshot, `quantity`, `unit_price` paise; cascade on invoice delete); migration `0023`
- Indexes: `invoices_shop_id_idx`, unique `(shop_id, invoice_number)`, `invoice_items_shop_id_idx`, `invoice_items_invoice_id_idx`
- `generateInvoiceNumber(tx, shopId)` in `invoice.service.ts`: locks the shop row, returns numeric max + 1 as `INV-000001`; 404 when the shop does not exist
- Shared `TxClient` type exported from `@/server/db`
- No UI / API routes; migration generated, not applied

## Code Quality Bar Rule

- New `code-standards.md` §26: quality, reusability, low complexity, error handling, and a scope guard (improve only the task's files; report the rest); §23 checklist references it

## Intake Estimate → Approval Labor Prefill

- New Repair "Estimated Cost" now seeds the Labor field in the Request Customer Approval dialog (editable) while no structured estimate exists (`estimated_total` null, labor 0); dialog shows a "pre-filled from intake" note; intake form explains this
- After an estimate is saved or sent, `estimated_cost` holds that total and is no longer used as labor

## Status Phases Restored

- Before customer approval the dropdown offers only `RECEIVED` / `DIAGNOSING` (plus Request Customer Approval); after approval it hides those and offers `APPROVED` → `READY_FOR_PICKUP`, `COMPLETED` (gated on final bill) and `CANCELLED`
- Phase comes from the latest approval status (client + `PATCH /status` server check); current status now shown in the dropdown; lock hint shown before approval
- Request Customer Approval is `DIAGNOSING`-only again (409 with "Set the status to Diagnosing…" otherwise; after approval the button explains to use Finalize Bill)

## Approval Charges + Finalize Bill

- Request Customer Approval dialog is self-contained: Diagnosis + Labor + Additional + GST dropdown (parts live) via shared `usePricingForm` / `PricingFormSection`; `POST /request-approval` now takes `requestCustomerApprovalSchema` (diagnosis + pricing fields), saves charges, clears any final bill, snapshots the full total (`additional_estimated_cost = 0`) in one transaction
- Approval can be sent from any open status (no DIAGNOSING-only / saved-estimate prerequisite); blocked when pending, closed, OWNER, or technician after customer approval
- Technicians set charges only via the dialog; `PATCH /estimate` is OWNER/STAFF only and blocked after customer approval (409)
- Single `EstimatePricingPanel` (Final panel deleted): Save estimate before approval; after approval read-only with Unlock to edit + Finalize Bill (saves charges + writes `final_total` in one click); Final bill badge
- `PATCH /final-total` requires latest approval APPROVED (no QC+ status rule); COMPLETED returns 409 until finalized
- Status dropdown: any status except WAITING_FOR_APPROVAL (Request Approval only); COMPLETED disabled until bill finalized; COMPLETED/CANCELLED/WAITING_FOR_APPROVAL remain locked sources
- Rules merged into `pricing-rules.ts` (`getPricingPanelMode`, violation helpers with 403/409, `PRICING_MESSAGES`); shared `useRepairPricingMutation` (toast + 409 resync); `TicketSummaryGrid`, `PricingStateBadge`, `PricingPanelActions`
- Tracking: charge breakdown shown once (next to the decision while pending); approval card shows diagnosis only
- `scripts/verify-request-approval.ts` updated for the new flow (not run here — needs DB fixture)

## Single Estimate / Final Display

- Repair Details: Estimate XOR Final by status (QC+ shows Final panel only)
- Tracking pending: costs only in approval card; `TrackPricingSummary` hidden
- After approval: approval card diagnosis/decision only (`showCosts={false}`); one Repair charges card
- Final confirmed: emphasize Final total only; muted Estimated total only when totals differ by > ₹1
- Removed redundant green “Repair approved” box when dark header already states approval

## Estimate UI Dedupe + Completed Gate

- Removed duplicate estimate block from Diagnosis card; sole internal editor is `EstimatePricingPanel` (optional pending approval strip)
- Shared `isFinalBillConfirmed` / `getCompletedTransitionError` / destination filter — COMPLETED disabled until `final_total` confirmed; server PATCH status returns same message
- Status dropdown shows disabled Completed option with “confirm final pricing first”; toast via `getApiErrorMessage`
- Final panel: Confirmed badge + “Final total confirmed for invoicing.” when locked

## Final Pricing Panel

- `FinalPricingPanel` on Repair Details for `QUALITY_CHECK` / `READY_FOR_PICKUP` / `COMPLETED`
- Pre-fills from estimate charge fields; parts charges recalculated live; Confirm writes `final_total` + `final_cost`
- OWNER/STAFF only; TECHNICIAN read-only; Confirmed badge + Unlock to edit (client lock)
- OWNER/STAFF may edit estimate in all statuses except `COMPLETED`; assigned TECHNICIAN only before approval (`DIAGNOSING` / `WAITING_FOR_APPROVAL`); final confirm also blocked on `COMPLETED`
- `PATCH /api/repairs/:id/final-total` + `useConfirmFinalTotal`; shared pricing breakdown/tax/charge fields with Estimate
- Informational note when final differs from estimate by more than ₹1; no invoice creation in this task

## Estimate Pricing Gaps Fix

- Shared `estimate-edit-rules`: editable only in DIAGNOSING / WAITING_FOR_APPROVAL; locked from APPROVED onward (UI + `PATCH /estimate` 400)
- Removed duplicate Diagnosis-card estimate editor; read-only total + pending ApprovalEstimateBreakdown; Request Approval still uses synced `estimated_cost`
- Renamed to `estimate-pricing-panel.tsx`, `pricing-mutations.ts` (`useUpdateEstimate`), route `PATCH /api/repairs/:id/estimate`; shared `PricingBreakdownRows`

## Estimate Pricing Panel + Parts Stock UX + Tracking Charges

- Parts used: show stock on hand, client-block Qty > stock with FieldError + toast; mutation errors via `getApiErrorMessage` (server still rejects insufficient stock)
- `PATCH /api/repairs/:id/estimate-pricing` + `updateRepairEstimatePricing` (shared `pricing-calc` / GST §170); persists fields + `estimated_total` and syncs `estimated_cost`
- Repair Details `RepairEstimatePricingPanel` after Parts used (PaisePriceField, live totals, discount banner)
- Public tracking optional `pricing` breakdown (labor/parts/additional/discount/tax/estimated/final) without part line items; `TrackPricingSummary` on `/track`

## Repair Pricing Schema + Calculation Foundation

- Added `labor_charges`, `additional_charges`, `discount`, `tax_percent`, `estimated_total`, `final_total` on `repairs` (migration `0021`); legacy `estimated_cost` / `final_cost` unchanged
- `partsCharges` not stored — `sumPartsCharges` from `repair_parts.unit_selling_price × quantity`
- `repairPricingFieldsSchema` for editable fields only; totals never client-settable
- Single formula in `repair-pricing.service.ts`: taxable value after discount, GST on that base, tax rounded to nearest rupee via `@/lib/money` (CGST §170); discount > charges rejected with 400
- No UI / API routes in this task

## Inventory Manage Part + Stock History + Repair Usage

- Tables: `stock_movements` (reason enum), `repair_parts`; migration `0020`
- Manage Part dialog (Details/Stock tabs): Details patches metadata only (no quantity); Stock tab Add/Remove with reason + preview via `POST /api/inventory/:id/adjust-stock`
- ⋮ menu: Manage Part / Stock History / Delete; list shows In Stock / Low Stock / Out of Stock badges
- Part Details `/inventory/[id]` shows stock history; repair Details “Parts used” auto-decrements/restores stock with movements
- `deletePart` blocked when referenced by `repair_parts`; TECHNICIAN may GET inventory list/detail for part picker

## Inventory Delete Part

- `DELETE /api/inventory/:id` (OWNER/STAFF); `deletePart` verifies shop ownership then hard-deletes
- Row Delete action opens `PartDeleteDialog` (AlertDialog); toast "Part deleted"; `useDeletePart` invalidates `partKeys.lists()`
- `repair_parts` usage block deferred until "Parts used in repair" (table does not exist yet)

## Inventory Edit Part (Update)

- `PATCH /api/inventory/:id` (OWNER/STAFF) with `partSchema`; `updatePart` verifies shop ownership and unique `(shop_id, sku)` excluding self
- Row Edit action opens shared `PartForm` (`mode="edit"`) pre-filled from list row; toast "Part updated"; closes dialog
- `useUpdatePart` invalidates `partKeys.lists()` and `partKeys.detail(id)` so the list row refreshes immediately

## Inventory Add Part (Create)

- `POST /api/inventory` (OWNER/STAFF) with `partSchema` validation; `createPart` enforces unique `(shop_id, sku)`
- `PartForm` (`mode: create | edit`) in Dialog with blur backdrop; ₹ price inputs via shared `@/lib/money` converters (paise on the wire)
- `useCreatePart` invalidates `partKeys.all`; toast "Part added"; field + API error handling via `getApiErrorMessage`
- Pure `rupeesToPaise` / `paiseToRupees` / `parseRupeesInput` lifted to `src/lib/money.ts`; re-exported from `repairs/money.ts`

## Inventory Parts List (List + Search)

- Added `inventory` table (no categories): name, SKU, quantity, minimum_stock, purchase/selling price (paise), supplier; unique `(shop_id, sku)`; migration `0018`
- `GET /api/inventory` for OWNER/STAFF only; `listParts` with name/SKU search and shop-scoped out-of-stock / low-stock (≤3 or ≤ minimumStock) counts
- Inventory page + TableCraft `PartTable`: debounced search, `formatRupees` display, reorder banner, View link to future `/inventory/[id]`
- Shared `DebouncedSearchInput` + `TableEmptyState`; Customer search bar wraps the shared input

## Repair Photos (Before / After)

- Exactly two Cloudinary folder slots per ticket (`before` / `after`); overwrite on replace; destroy on delete
- Assigned technician can upload/replace/delete while internal; staff/owner after customer-visible; hide/unhide for staff/owner
- Auto customer visibility at `READY_FOR_PICKUP` / `COMPLETED` when both photos exist (no Share button)
- UI on `/repairs/[id]` only + public `/track` lightbox; verify: `bun run verify:repair-photos`

## Repair Details UI Refresh

- Visual-only pass on Repair Details: ticket number as hero identity, deduped status display (approval banner or status chip, not both with a redundant badge)
- Replaced native status `<select>` with shadcn/Radix Select; shared `status-ui` labels/tones/icons for presentation
- Extracted `StatusHistoryTimeline` with stacked meta, status-tinted nodes, and short staggered enter motion
- Softened diagnosis / estimate / notes chrome; light polish on approval banner and request-approval button styling
- No status, approval, or reopen logic changes

## Status Phase Transition Guards

- Added shared `status-transitions` helper: pre-approval destinations are only `RECEIVED`/`DIAGNOSING`; post-approval allows the late workflow statuses including `COMPLETED`/`CANCELLED`; `WAITING_FOR_APPROVAL` is never a manual destination
- Enforced the same rules in `updateRepairStatus` (after pending-lock checks) and in the Repair Details status dropdown
- Documented the pre/post-approval phase rule in `project-overview.md` §6
- Extended `verify:request-approval` to assert late statuses are blocked from `DIAGNOSING`, `RECEIVED` remains allowed, pending stays locked, and post-`APPROVED` advances still work

## Approval Workflow Edge Cases

- Restricted `Request Customer Approval` to `DIAGNOSING` only (server + UI); other active statuses are blocked with a clear message
- Added ticket number, customer, and device identifying context to the Request Customer Approval dialog
- Kept pending `WAITING_FOR_APPROVAL` locked for manual status changes; after customer approval, STAFF can continue normal status updates
- Extended `verify:request-approval` for DIAGNOSING-only source rules, pending lock, post-APPROVED continuation, and dialog ticket context

## Staff Reopen Repair Ticket

- Extended `repair_status_history.actor_type` to support `OWNER` alongside existing `STAFF`/`CUSTOMER`, so reopen history can record the actor role cleanly without creating a new audit system
- Narrowed reopen logic instead of inventing a reverse-status map: `COMPLETED` can now reopen to `DIAGNOSING` for `OWNER` and `STAFF`, while the pre-existing OWNER-only `CANCELLED` reopen path remains unchanged
- Reopen still logs through `repair_status_history` only; no `audit_logs` / `activity_logs` table was added because generic Activity/Audit Logs remain deferred to Sprint 4
- Repair Details now uses the existing dialog pattern for `COMPLETED` reopen with a required reason field and success refresh/toast
- Added focused reopen verification coverage for permissions, history, tenancy, preserved technician/customer-approval data, and concurrent duplicate reopen protection

## Technician Role-Change Handling

- Added `repair_assignments` append-only ledger (`ACTIVE` | `ON_HOLD` | `REASSIGNED` | `COMPLETED`) with required `shop_id` (architecture tenancy) plus scoped columns; migration `0015` includes backfill for non-terminal assigned repairs
- Extended Staff Management role change (no rebuild): TECHNICIAN→STAFF with active assignments opens required Hold/Reassign Dialog; STAFF→TECHNICIAN shows dismissible Review & Resume banner
- `getTechnicians` / assign validation narrowed to **TECHNICIAN-only** (intentional change vs prior STAFF+TECHNICIAN)
- Shared searchable `TechnicianCombobox` (Command/Popover); ON_HOLD warning card on Repair Details with resume/reassign
- Sonner toasts on hold, reassign, resume, and role-change outcomes
- Verify: `bun run verify:technician-role-change`

## Initial Setup

- Created five AI context files + AGENTS.md
- Defined RepairTrack product scope
- Defined four-sprint development strategy
- Selected Next.js + TypeScript
- Selected Bun
- Selected Hono.js
- Selected PostgreSQL
- Selected Drizzle ORM
- Selected Better Auth
- Selected Google OAuth
- Selected TanStack Query
- Selected Zustand
- Selected Cloudflare R2
- Selected Tailwind CSS
- Selected shadcn/ui
- Selected Zod
- Removed Nodemailer
- Removed React Email
- Removed Gmail API
- Removed Warranty Management
- Deferred Activity / Audit Logs to advanced phase

## Sprint Plan Revision — Staff Management & Owner Gmail

- Moved Staff Management from an unscheduled Settings item into Sprint 1
  as a first-class feature (invitations, roles, shop isolation)
- Reinstated Gmail API for Sprint 3 — **scoped to owner-authorized
  transactional sending only**, one connection per shop, no shared
  sender account. This reverses the earlier "Removed Gmail API" note.
- Nodemailer and React Email remain excluded — Gmail API used directly
  with plain-string email bodies.
- Sprint 1 invitations use a shareable link only until Gmail is
  connected in Sprint 3, at which point real invite emails activate too.

## Device Model Verification
 
- Added "Unverified" model state to Device Management: model is optional
  at intake, flagged with a badge until confirmed
- Added non-blocking model-confirmation prompt to the DIAGNOSING repair
  status, since that's the natural point where a device gets physically
  opened/inspected
- Added Device List grouped-by-customer presentation (collapsible rows)
  as a task item

## Public Repair Tracking

- Added `tracking_token` column to repairs with crypto-secure base64url generation
- Public `/track` landing + `/track/[ticketId]` consumer pages (no dashboard shell)
- Read-only `/api/track` endpoints with IP rate limiting and sanitized payload
- Customer Tracking section on Repair Details (copy/share/regenerate link)
- Customer-facing status label mapping documented in `ui-context.md` §11b

## Repair UI Responsive Refresh

- `RepairPageShell` (`max-w-7xl`) wraps list, detail, and new repair routes
- Repair Details: cleaner header hierarchy, approval banner, 2×2 info cards, stacked mobile editors
- Repair List: mobile card layout below `md`; desktop table unchanged; shared pagination
- Public tracking: open wide layout (no double card wrapper); breakdown rows stack on narrow screens
- `ApprovalStatusBanner` replaces long pill badge; compact short labels on chips

## Approval Estimate Breakdown UI

- Display-only: `formatRupees(paise)` in `src/lib/format-money.ts`. Money stays integer paise in the DB (architecture-context.md §8). No migration was run; there is no `0014` / `initial_estimated_cost` column in this tree.
- `POST /repairs/:id/request-approval` accepts `{ additionalEstimatedCost }` in rupees, converts with `rupeesToPaise`, stores on `repair_approvals.additional_estimated_cost`. Does **not** copy or overwrite `repairs.estimated_cost`.
- Revised Estimated Total is derived with integer addition at request/display time, never stored.
- `ApprovalEstimateBreakdown` (Original + Additional + Revised) on the Request Approval Dialog and the existing public tracking diagnosis+cost preview.
- Public tracking returns paise (`originalEstimatedCost`, `additionalEstimatedCost`); UI formats with `formatRupees`.
- Merge-order flag: `feature/customer-approval-decision`'s buttoned Action Required card must get this same breakdown reapplied; it will not inherit this change automatically.

## Repair Details Estimate Display Fix

- Pending-approval Repair Details uses `ApprovalEstimateBreakdown` (original paise + additional paise) instead of a single formatted `estimatedCost`.
- Single `formatRupees` display path; `formatINR` / `formatINRFromPaise` removed.

## Customer Approval Schema Foundation

- Added `repair_approvals` table (PENDING/APPROVED/REJECTED, diagnosis snapshot, partial unique index for one pending per repair)
- Extended `repair_status_history` with nullable `changed_by` and `actor_type` (STAFF/CUSTOMER, backfilled to STAFF)
- Documented customer rejection → `CANCELLED` and approval → `APPROVED` footnotes in `project-overview.md` §6
- Internal Repair Details approval badge + timeline actor rendering (read-only; no request/decision APIs yet)
- Verification script: `bun run verify:approval-schema`

## Post-merge Conflict Cleanup (main)

- Resolved broken JSX in `approval-estimate-summary.tsx` and mismatched dialog closings in `request-approval-control.tsx`
- Removed duplicate `initialEstimatedCost` in Drizzle schema and verify scripts; deduped `rupeesToPaise` import in `repair.service.ts`
- Aligned verify-request-approval constants (`TEST_*_PAISE`); restored `revisedEstimatedTotalPaise` helper alongside main's `formatINR` money helpers
- Verified: `bun run typecheck`, `bun run lint`, `bun run build`

## Total Discount Feature Removal

- Removed discount completely across all layers:
  - UI: input fields, alerts, and table rows removed from `RepairEstimatePricingPanel` and `TrackPricingSummary`.
  - Validation: removed `discount` field from `repairPricingFieldsSchema`.
  - Pricing Calculation: removed `discount` and overage checks (`DISCOUNT_EXCEEDS_CHARGES_MESSAGE`) from `pricing-calc.ts` and `repair-pricing.service.ts`.
  - Services & Queries: removed `discount` from `repair.service.ts`, `tracking.service.ts`, `queries.ts`, and public tracking `schemas.ts`.
  - DB Schema: removed `discount` from `repairs` table Drizzle schema definition.

## GST Tax Rate Policy Dropdown

- Converted tax percentage input field in `RepairEstimatePricingPanel` into a Radix/shadcn `Select` dropdown.
- Configured official Indian GST schedule slabs: `0% (Nil / Exempt)`, `5%`, `12%`, `18% (Standard Services)`, and `28%`.
- Exported reusable `GST_TAX_RATES` and `GstTaxRate` type in `pricing-calc.ts`.
- Integrated seamlessly with React Hook Form `Controller` and live calculation preview.

## Repair Details Estimate Pricing Panel

- Added `EstimatePricingPanel` on Repair Details:
  - Editable during `DIAGNOSING` and `WAITING_FOR_APPROVAL` for `OWNER`, `STAFF`, and assigned `TECHNICIAN`.
  - Read-only for other roles or after customer approval decision.
  - Editable inputs: Labor Charges, Additional Charges (using reusable `PaisePriceField`), and GST Tax Rate dropdown (`Select`).
  - Read-only Parts Charges computed dynamically from repair parts list (`sumPartsCharges`).
  - Live client-side estimated total preview using shared `calculateRepairTotal` engine without network delay.
  - Saved via `useUpdateEstimate` mutation calling `PATCH /api/repairs/:id/estimate`.
  - Synchronizes `estimated_total` and `estimated_cost` in DB, automatically updating pending customer approval breakdown.
- Verified: `bun run typecheck`, `bun run lint`, and `bun run build` all pass cleanly.

## Payment Flow Simplification & UI Enhancements

- Removed advance payment functionality; strictly enforced full and final payment after bill finalization (`repair.finalTotal != null`).
- Restricted payment methods to `CASH` and `UPI` only (removed Card and Bank Transfer from active payment selection).
- Embedded live, compact `UpiPayCard` inside `RecordPaymentDialog` when selecting `UPI`.
- Enforced mandatory UPI Transaction ID / UTR as proof of payment before submission.
- Gated `Record Payment` button so it only appears after the bill has been finalized and an outstanding balance exists.
- In invoice view, conditionally hidden the payment history section when no payments have been recorded.
- Redesigned `UpiPayCard` into a sleek, compact 128px high-DPI card with instant copy feedback and single-page print optimization.
- Verified: `bun run typecheck`, `bun run lint` pass cleanly with 0 errors.

## UPI UTR Reference Validation & Tracking Payment Gating

- Enforced strict 12-digit numeric validation (`UPI_UTR_REGEX = /^\d{12}$/`) for UPI payment references in `recordPaymentSchema.superRefine`.
- Kept reference optional for other payment methods (`CASH`).
- Changed `REFERENCE_PLACEHOLDERS.UPI` to `"12-digit UTR number"`.
- Updated `RecordPaymentDialog` with required label `"UTR number *"`, `maxLength={12}`, and bank app helper text.
- Added duplicate UTR check in `payment.service.ts`: returns HTTP 409 `"This UTR is already recorded"` when a UPI payment with the same reference exists for the shop.
- Gated public tracking payment card in `tracking.service.ts`: only exposes payment details after the bill is finalized (`finalTotal != null`) and not `CANCELLED`.
- Verified: `bun run typecheck`, `bun run lint`, and `bun run build`.

## Dashboard Latency Optimization & Revenue Analytics

- **Eliminated Server-Side Re-render Bottleneck on Tab Changes**:
  - Replaced Next.js `router.replace` navigation with client-state and `window.history.replaceState` in `useAnalyticsPeriod`.
  - Switching period tabs ("This week", "This month", "This quarter", "This year") no longer triggers a full Server Component round-trip (`GET /dashboard?period=...`) or Better Auth DB session verification, eliminating a 6.4-second delay.
- **Client-Side Pure Date Range Calculation**:
  - Replaced remote network call `GET /api/dashboard/analytics/period` (which took 7.5s) with synchronous `getPeriodRange(period)` date calculation from `@/lib/shop-time` in `AnalyticsSection`.
  - Date ranges render in 0ms synchronously with instant UI feedback.
- **Removed Redundant User DB Lookup in Dashboard API**:
  - Optimized `requireDashboardSession` in `src/server/hono/routes/dashboard.ts` to use `session.user.shopId` and `session.user.role` directly, bypassing unnecessary `db.query.users.findFirst` queries and saving ~300ms per API call.
- **Single CTE Query for Dashboard Summary**:
  - Consolidated `getDashboardSummary` from two separate database queries (`repairCounts` and `completedResult`) into a single CTE query (`repair_counts CROSS JOIN completed_counts`), cutting database roundtrips in half.
- **TanStack Query Caching & Re-fetch Tuning**:
  - Tuned `staleTime` and disabled `refetchOnWindowFocus` for summary and analytics queries to prevent barrage of parallel requests and connection pool thrashing on window focus.
- Verified: `bun run typecheck`, `bun run lint`, and `bun run build` all pass cleanly with 0 errors.

## Advanced Dashboard: Repair KPIs Analytics

- **Added `GET /api/dashboard/analytics/repairs?period=` Endpoint**:
  - Validated query parameters via `analyticsQuerySchema`.
  - Restricted to `ANALYTICS_ROLES` (`OWNER`, `STAFF`) with strict shop tenant isolation.
  - Returns `{ created, completed, pending, overdue, avgRepairHours, previousCreated, previousCompleted, previousAvgRepairHours }`.
- **Single-Query Aggregation via CTEs**:
  - `created`: `COUNT(*) FILTER (...)` for repairs created in the range.
  - `previousCreated`: Filtered count for previous period comparison.
  - `pending`: `COUNT(*) FILTER (...)` for tickets where status is not `COMPLETED` or `CANCELLED`.
  - `overdue`: Integrated existing overdue rule (`expectedCompletionDate < today` and status not terminal).
  - `completed` & `previousCompleted`: Distinct repair counts with status history row transition to `COMPLETED` in the respective range.
  - `avgRepairHours` & `previousAvgRepairHours`: `AVG(EXTRACT(EPOCH FROM (latest_completed_at - created_at)) / 3600.0)` for repairs completed in the range; returns `null` when no repairs were completed.
  - Entire dataset computed in a single PostgreSQL execution roundtrip.
- **Frontend KPI Cards & Duration Formatting**:
  - Implemented `formatRepairDuration` (`null -> '—'`, `53 -> '2d 5h'`, `48 -> '2d'`).
  - Added `invertTrend` support to `DeltaBadge` so turnaround duration reductions show favorable green styling.
  - Integrated 5 responsive KPI cards into `AnalyticsSection`:
    - **Repairs**: Created count with period delta.
    - **Completed**: Resolved count with period delta.
    - **Pending**: Active work queue snapshot.
    - **Overdue**: Highlighted in rose/red when > 0, with a direct link to `/repairs?overdue=true`.
    - **Avg repair time**: Human-friendly duration (`2d 5h`) with inverted turnaround delta.
- **UI Polish, Double-Dash Elimination & Perfect Baseline Alignment**:
  - Eliminated the double-dash bug in `DeltaBadge` (removed redundant `<Minus />` rendering alongside `<span>—</span>`).
  - Added clean fallback message `"No prior period data"` when previous range has 0 records, eliminating confusing `[- —] vs. last month to date` display.
  - Fixed vertical number misalignment across cards: eliminated `justify-between` on `CardContent` that pushed shorter cards (like Pending) down to the bottom; locked all KPI numbers to the exact same top baseline with consistent `mt-3` offset.
  - Enforced a uniform `min-h-6` secondary metadata row across all 5 cards (Pending has a pulse indicator, Overdue has an action link, and others have delta / prior data badges), aligning numbers and footers line-for-line.
  - Enhanced Overdue UX by showing contextual subtitle `${data.overdue} of ${data.pending} active tickets` to clearly communicate that overdue tickets are a subset of the active queue.
  - Added modern thematic icon container badges (blue for Repairs, emerald for Completed, amber for Pending, rose for Overdue, purple for Avg time, teal for Revenue).
  - Verified: `bun run typecheck`, `bun run lint`, and `bun run build` all pass with 0 errors.

## Dashboard UI/UX Redesign & Operational Optimization

- **Today's Operations Section**:
  - Reorganized daily operations into 4 high-clarity operational cards: Today's Intake, Active Queue, Ready for Pickup, and Overdue Alert.
  - Added direct quick-links (`/repairs?status=READY_FOR_PICKUP`, `/repairs?overdue=true`) to enable immediate one-click triage.
  - Applied prominent rose/red alert styling to the Overdue card when actionable overdue repairs are detected.
- **Granular Period-Matched Revenue Trend Chart**:
  - Replaced the fixed 12-month January-December bar chart with dynamic period-matched granularities:
    - Daily bars for "This Month" and "Last Month".
    - 3-month aggregation for "Last 3 Months".
    - 12-month aggregation for "This Year".
  - Eliminated the misleading visual artifact of 11 empty/zero bars when inspecting monthly performance.
  - Preserved backward compatibility by retaining the `monthly` array on the API response.
- **Repair Status Distribution Breakdown**:
  - Added `statusDistribution` to `GET /api/dashboard/analytics/repairs` calculating active repair breakdown across workflow phases (Received, Diagnosing, In Progress, Ready for Pickup).
  - Built `RepairStatusChart` featuring a proportional segmented progress bar, individual status badges, and an empty-state fallback.
- **Live Work Queue & Overdue Priority Table**:
  - Replaced static placeholder sections with a responsive, live `DashboardWorkQueue` component.
  - Prioritizes overdue tickets at the top with warning badges, displays ticket ID, customer, device, and real-time status badges.
  - Mobile-responsive with dedicated card-style rows on viewports under 640px.
- **Visual Polish & Precision Alignment**:
  - Replaced `- —` double-dash badge with clean `"No prior period data"` messaging.
  - Normalized card content heights and locked KPI numbers across all cards to an identical horizontal baseline.
  - Enhanced dashboard header with shop time subtitle, quick "Create repair" primary CTA, and responsive spacing.
- **Verification**:
  - `bun run typecheck`: Passed with 0 errors.
  - `bun run lint`: Passed with 0 errors.
  - `bun run build`: Production build completed successfully with 0 errors.
  - `scripts/test-analytics-repairs.ts` and `scripts/test-analytics-revenue.ts`: 100% assertions passing.

## Dashboard UI Polish, Status Filter Integration & Card Deduplication

- **Fixed Text Overlap in Revenue Chart & Work Queue**:
  - Overrode default shadcn `aspect-video` on `MonthlyRevenueChart` with `aspect-auto h-[220px] w-full`.
  - Added `overflow-hidden` to `AnalyticsCard` and `items-start` to the charts grid to prevent SVG height distortion from pushing subtext down over the `Work Queue` header.
- **Fixed Repair Status Filter Routing**:
  - Enhanced `RepairList` to initialize and synchronize filter state (`status`, `overdue`, `priority`, `technicianId`) directly from URL query parameters.
  - Added support for `ACTIVE` status in `repair.service.ts` (querying `status NOT IN ('COMPLETED', 'CANCELLED')`) and added "Active (In Progress)" to the status dropdown.
  - Clicking any dashboard card or status breakdown pill now navigates to `/repairs?status=...` and immediately displays the filtered tickets.
- **Unified Repair Status Breakdown with Repairs Page**:
  - Aligned `RepairStatusChart` and `getRepairAnalytics` status configuration with `repair-list.tsx` (supports all 10 statuses including `CANCELLED`).
  - Switched to a full-width vertical list layout to eliminate truncated text labels ("Waiting Ap...", "Ready for ...") so all statuses display with their complete names, dot colors, counts, and percentages.
- **Removed Card Name Duplication**:
  - Today's Operations: **Today's Intake**, **Active Queue**, **Ready for Pickup**, **Completed Today**.
  - Business Analytics: **Repairs logged**, **Completed in period**, **Pending workload**, **Overdue tickets**, **Avg turnaround time**.
  - Zero duplicate card names across the entire dashboard.
- **Verification**:
  - `bun run typecheck`: Passed with 0 errors.
  - `bun run lint`: Passed with 0 errors (0 compiler/ESLint errors).
  - `bun run build`: All 20 routes compiled successfully with 0 errors.

## Advanced Dashboard: Technician Performance Analytics & Responsive UI

- **Endpoint & Grouped SQL Query (`GET /api/dashboard/analytics/technicians?period=`)**:
  - Implemented `getTechnicianAnalytics` in `dashboard-analytics.service.ts` executing a single grouped SQL query.
  - Returns one row per technician with activity in the range, including inactive ones: `{ technicianId, name, isActive, completed, active, overdue, avgRepairHours }`.
  - Joins `repairs` with `users` and a `period_completions` CTE extracting hours from `repair_status_history`.
  - Calculates active workload (`status NOT IN ('COMPLETED', 'CANCELLED')`), overdue workload (expected date < today), and average turnaround duration.
  - Sorted by `completed DESC, active DESC, name ASC`.
  - Full multi-tenant isolation enforced (`u.shop_id = shopId AND r.shop_id = shopId`).
- **Authorization & Validation**:
  - Endpoint mounted at `GET /api/dashboard/analytics/technicians` on Hono dashboard router.
  - Query parameter `period` validated with Zod `analyticsQuerySchema`.
  - Protected with `requireDashboardSession(c.req.raw, ANALYTICS_ROLES)` restricting access to `OWNER` and `STAFF`.
- **Responsive UI (`TechnicianPerformanceCard`)**:
  - Full-width `AnalyticsCard` component titled "Technician performance" with `Users` icon.
  - Desktop view (`md+`): Clean table displaying avatar initials, technician name, Inactive badge (if deactivated), completed count, active count, overdue count in red (`text-rose-600 dark:text-rose-400 font-semibold`) when > 0, avg turnaround duration, and thin share bar showing each technician's percentage of completed repairs.
  - Mobile view (`< md`): Stacked cards per technician tailored for 375px+ viewports with 4-metric grid and full-width share bar.
  - Handles 0 total completions safely (0% share without division by zero).
  - Empty state: `"No technician activity in this period"` when no records match.
  - Skeleton loading state with 3 pulse rows matching card layout.
  - Integrated into `AnalyticsSection` below the chart grid.
- **Verification**:
  - Automated test script `scripts/test-analytics-technicians.ts` passed: schemas, share calculations, 401/400 route guards, DB shop isolation, and sorting verified.
  - `bun run typecheck`: Passed with 0 errors.
  - `bun run lint`: Passed with 0 errors.
  - `bun run build`: Production build succeeded across all 20 routes with 0 errors.

## Navigation: Dynamic Active Path Highlighting & Header Breadcrumbs

- **Centralized Navigation Configuration (`nav-config.ts`)**:
  - Unified navigation items across desktop and mobile with role-based visibility guards (`TECHNICIAN`, `STAFF`, `OWNER`).
  - Implemented `isNavActive` resolving exact matches for `/dashboard` and subpath matching for operational sections (`/repairs/*`, `/customers/*`, `/devices/*`, etc.).
  - Separated `/settings/staff` from `/settings/shop` so Staff Management and Shop Settings never cross-activate.
- **Desktop Sidebar Navigation (`sidebar-nav.tsx`)**:
  - Converted static links to client component using Next.js `usePathname()`.
  - Added dynamic active state styling: `bg-muted text-foreground font-semibold shadow-2xs`, signature brand orange vertical indicator (`bg-accent`), accent-colored icon (`text-accent`), and accessibility attribute `aria-current="page"`.
  - Removed hardcoded `/dashboard` active styling bug from `layout.tsx`.
- **Mobile Navigation (`mobile-nav.tsx`)**:
  - Updated to use `nav-config.ts` and `usePathname()`, eliminating hardcoded `index === 0` active selection.
  - Added missing Staff Management link for shop owners to mirror desktop navigation.
- **Dynamic Header Trail (`header-breadcrumb.tsx`)**:
  - Replaced static "Operations overview" text with responsive active navigation trail.
  - Desktop: Displays breadcrumbs (e.g. `Repairs > New Ticket`, `Settings > Shop Profile`) with interactive parent links and current page label.
  - Mobile: Displays current section title dynamically in the mobile header.
- **Verification**:
  - `bun run typecheck`: Passed with 0 errors.
  - `bun run lint`: Passed with 0 errors.
  - `bun run build`: All 20 routes compiled successfully with 0 errors.

## Typography Normalization & Font Hierarchy Refinement

- **Inter Font Standard**:
  - Migrated `RootLayout` from `Geist` to `Inter` via `next/font/google` (`--font-inter`).
  - Configured `--font-sans` with `Inter` and native system UI font fallbacks in `globals.css`.
- **Heading & Numeric Font Normalization**:
  - Normalized oversized `text-3xl` headings down to `text-2xl font-bold tracking-tight text-foreground` on the Operations Dashboard and Settings pages (`Shop Profile`, `Staff Management`, `Email & Notifications`).
  - Scaled stat cards and KPI numeric displays from `text-3xl` down to `text-2xl font-bold tracking-tight tabular-nums`.
  - Normalized Business Analytics subheadings and chart metrics to `text-xl font-bold`.

## Technician Performance: 5-Item Pagination

- **Page-Size Constraint (`PAGE_SIZE = 5`)**:
  - Limited visible technicians to a maximum of 5 per page in `TechnicianPerformanceCard`.
  - Added bottom pagination controls with `Previous` and `Next` buttons, current page indicator (`Page X of Y`), and range descriptor (`Showing 1–5 of N technicians`).
  - Conditionally rendered only when `totalItems > 5` (`totalPages > 1`), keeping clean layout for small rosters.
  - Automatically resets to Page 1 on analytics period switch without cascading render side-effects.
- **Verification**:
  - `bun run typecheck`: Passed with 0 errors.
  - `bun run lint`: Passed with 0 errors.
  - `bun --preload=./scripts/server-only-shim.mjs scripts/test-analytics-technicians.ts`: All assertions passed.

## Responsive Full-Height Analytics Cards & Layout Alignment

- **Equal Height Grid (`items-stretch` & `h-full`)**:
  - Replaced `items-start` with `items-stretch` on the Analytics grid in `analytics-section.tsx`.
  - Added `h-full` to `AnalyticsCard`, `CardContent`, and inner content wrappers across `MonthlyRevenueChart` and `RepairStatusChart`.
  - Styled inner content containers with `flex flex-col flex-1 justify-between h-full` so footers (`border-t border-border/60 pt-2.5`) align to the exact same baseline across both revenue and repair status cards regardless of queue item count.
- **Horizontal Responsiveness**:
  - Encapsulated desktop technician table in `w-full overflow-x-auto` to prevent viewport clipping on narrow desktop/tablet screens.
  - Maintained full responsive stacking with cards on mobile viewports (< 768px down to 375px).
- **Verification**:
  - `bun run typecheck`: Passed with 0 errors.
  - `bun run lint`: Passed with 0 errors.
## Test Foundation & CI Workflow

- **Test Suite (`bun test`)**:
  - Implemented unit test suites covering pure logic:
    - `src/features/repairs/pricing-calc.test.ts`: GST tax slabs (0%, 5%, 12%, 18%, 28%), nearest-rupee tax rounding (CGST §170), parts line calculations, and estimate variance detection.
    - `src/features/payments/summary.test.ts`: Bill total resolution (`finalTotal` precedence over `estimatedTotal`), `getPaymentSummary` status states (`UNPAID`, `PARTIAL`, `PAID`), and overpayment tracking.
    - `src/lib/shop-time.test.ts`: IST timezone boundaries (`Asia/Kolkata`), 24-hour today range, and analytics period ranges (`this_month`, `last_month`, `last_3_months`, `this_year`).
    - `src/features/repairs/status-transitions.test.ts`: Pre-approval vs post-approval allowed transitions, locked statuses, manual approval blocking, and completed bill/payment requirements.
    - `src/server/auth/registration-logic.test.ts`: Shop name fallback parsing, invite token sanitization, and registration plan resolution.
- **Integration Test Runner (`scripts/run-integration.ts`)**:
  - Registered `"test:integration": "bun run scripts/run-integration.ts"` in `package.json`.
  - Runs all existing `verify:*` scripts in sequential order.
  - Strict safety checks: requires non-empty `TEST_DATABASE_URL` and aborts if `TEST_DATABASE_URL === DATABASE_URL` to prevent running against primary data.
- **GitHub Actions CI Workflow (`.github/workflows/ci.yml`)**:
  - Triggers on `pull_request` and `push` to `main`.
  - Executes `bun install --frozen-lockfile`, `typecheck`, `lint`, `test`, and `build` with non-secret dummy environment variables.
- **Pull Request Template (`.github/pull_request_template.md`)**:
  - Standardized PR descriptions with summary, motivation, testing steps, risk assessment, and quality/definition-of-done checklist.
- **Audit Documentation**:
  - Relocated production-readiness audit document to `docs/audits/2026-10-production-readiness.md`.
- **Verification**:
  - `bun test`: 54 passing tests across 5 test suites.
  - `bun run typecheck`: Passed with 0 errors.
  - `bun run lint`: Passed with 0 errors.
  - `bun run test:integration`: Safety guards verified (refuses when `TEST_DATABASE_URL` is missing or equals `DATABASE_URL`).
  - `bun run build`: Production build completed successfully across all routes.

## Public Tracking Verification Rate-Limiting & Countdown Timer

- **Rate-Limiting Middleware (`rate-limit.ts` & `track.ts`)**:
  - Updated `incrementRateLimit` to return `resetAt` along with `count`.
  - When requests exceed limits, sets `Retry-After: <seconds>` response header and returns `retryAfter` and `resetAt` in the 429 JSON response.
  - Refined ticket rate-limit key resolution on `/api/track/verify` per public repair ticket number.
- **Client Countdown & Auto-Unlock (`track-search-form.tsx`, `track-landing-page.tsx`, `track-dynamic-page.tsx`)**:
  - Extracted `getRateLimitInfo` in `api-error.ts` to inspect HTTP 429 error responses.
  - Displayed amber lockout notification specifically for rate limiting with active countdown badge (`mm:ss`) and pulse animation.
  - Disabled submit button with `Try again in mm:ss` text during the 15-minute window.
  - Persisted lockout timestamp per ticket in `sessionStorage` so refreshing the browser tab retains the active countdown.
  - Automatically clears rate-limit state and re-enables the form when the timer expires.
- **Verification**:
  - Executed migration `0033_calm_rogue.sql` creating `rate_limits` table.
  - Calibrated rate-limiting route architecture: scoped wildcard router middleware so `/verify` is strictly governed by its own 10-attempt ticket limit and never double-counted under the shared IP bucket.
  - Enhanced error responses with `remaining` attempts countdown (`X attempts remaining`) and added double-click submission prevention.
  - Verified 11-attempt sequence: attempts 1–10 succeed/return 404 with exact remaining counter, and attempt 11 triggers HTTP 429 lockout.
  - `bun test`: 54 passing tests.
## Consistent Route Parameter Validation

- **Shared Parameter Schemas (`src/lib/validation.ts` & `src/features/emails/schemas.ts`)**:
  - `idParamSchema`: Trims and validates route `id` string (min 1, max 100 characters).
  - Added matching two-parameter schemas next to `idParamSchema` for multi-param endpoints:
    - `idAndLogIdParamSchema`: Validates `id` and `logId` without using `z.uuid()` (strings up to 100 characters).
    - `idAndPartRowIdParamSchema`: Validates `id` and `partRowId`.
    - `idAndPhotoTypeParamSchema`: Validates `id` and `type`.
  - Replaced `z.uuid()` in `repairEmailParamSchema` with `idAndLogIdParamSchema` (IDs are text strings, not restricted to UUIDs).
- **Consistent Route Parameter Validation Across Hono Routes (`src/server/hono/routes/*`)**:
  - Applied `zValidator('param', idParamSchema, validationHook)` across all `/:id`-style routes:
    - `src/server/hono/routes/customers.ts`: `GET /:id`, `PATCH /:id`, `DELETE /:id`, `GET /:id/repairs`.
    - `src/server/hono/routes/devices.ts`: `GET /:id`, `PATCH /:id`, `DELETE /:id`, `GET /:id/repairs`.
    - `src/server/hono/routes/inventory.ts`: `GET /:id`, `GET /:id/movements`, `POST /:id/adjust-stock`, `PATCH /:id`, `DELETE /:id`.
    - `src/server/hono/routes/staff.ts`: `GET /:id/active-assignments`, `GET /:id/held-assignments`, `POST /:id/resume-assignments`, `PATCH /:id/status`, `PATCH /:id/role`.
    - `src/server/hono/routes/repairs.ts`: `GET /:id`, `PATCH /:id/status`, `POST /:id/request-approval`, `POST /:id/reopen`, `PATCH /:id/technician`, `PATCH /:id/diagnosis`, `PATCH /:id/estimated-cost`, `PATCH /:id/estimate`, `PATCH /:id/final-total`, `POST /:id/notes`, `PATCH /:id/expected-completion-date`, `GET /:id/emails`, `POST /:id/emails/:logId/resend`, `POST /:id/regenerate-tracking-link`, `POST /:id/photos/upload-url`, `PUT /:id/photos`, `DELETE /:id/photos/:type`, `PATCH /:id/photos/visibility`, `POST /:id/parts`, `PATCH /:id/parts/:partRowId`, `DELETE /:id/parts/:partRowId`.
  - Service functions receive typed `c.req.valid('param').id` (and companion route params) instead of raw `c.req.param('id')`.
  - Validation failures return standard 400 Bad Request with `{ error: { message, code: 'VALIDATION_ERROR' } }`.
- **Preload Configuration & Unit Tests (`bunfig.toml` & `src/server/hono/routes/route-param-validation.test.ts`)**:
  - Configured `[test] preload = ["./scripts/server-only-shim.mjs"]` in `bunfig.toml` for seamless execution of route tests under `bun test`.
  - Added comprehensive test suite verifying:
    - Blank or whitespace-only IDs return 400 with `VALIDATION_ERROR` code.
    - 101-character oversized IDs return 400 with `VALIDATION_ERROR` code.
    - Two-param routes with invalid secondary IDs return 400 with `VALIDATION_ERROR` code.
    - Unknown IDs return 404 Not Found.
    - Another shop's ID returns 404 Not Found (tenant isolation enforced).
- **Verification**:
  - `bun test`: 58 passing tests across 6 test suites.
  - `bun run typecheck`: Passed with 0 errors.
  - `bun run lint`: Passed with 0 errors.
  - `bun run build`: Production build completed successfully across all routes.

## Zero-Warning ESLint & CI Enforcement

- **Dead Code Cleanups**:
  - `scripts/check-migration-url.ts`: Removed unused `migrationUrl`.
  - `src/server/services/repair.service.ts`: Verified `actionLabel` in `recoverRepair` was not needed in error/audit messages and removed unused variable.
- **React Hook Form & Compiler Compliance**:
  - Switched `watch()` calls to `useWatch({ control, name })` across:
    - `src/components/customers/customer-form.tsx`
    - `src/components/devices/device-form.tsx`
    - `src/components/repairs/new-repair-workflow.tsx`
    - `src/components/staff/add-staff-dialog.tsx`
    - `src/components/tracking/track-search-form.tsx`
  - Replaced synchronous `setState` in effect bodies with derived rendering state (`displayedEmailWarning` in `customer-form.tsx`, `displaySecondsLeft` and `queueMicrotask` in `track-search-form.tsx`) to resolve `react-hooks/set-state-in-effect`.
- **TanStack Table Compiler Opt-out**:
  - Added `'use no memo'` directive with one-line reason to `DataTable` in `src/components/ui/data-table/data-table.tsx` (`'use no memo' // Opt out of React Compiler memoization because TanStack Table returns non-memoizable functions`) and disabled `react-hooks/incompatible-library`.
- **CI Strict Enforcement**:
  - Added `-- --max-warnings=0` to `bun run lint` in `.github/workflows/ci.yml`.
- **Verification**:
  - `bun run lint -- --max-warnings=0`: Passed with 0 errors and 0 warnings.
  - `bun run typecheck`: Passed with 0 errors.
  - `bun test`: 54 passing tests.

