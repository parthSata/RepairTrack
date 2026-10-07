# RepairTrack — Architecture Context

Owns: the stack, folder layout, and the boundaries between layers.
Code style lives in `code-standards.md`; screens live in `ui-context.md`.

# 1. Technology Stack

## Application Framework

- Next.js (App Router)
- TypeScript

Next.js is the primary application framework.

React is an internal dependency of Next.js and should not be treated
as a separate application framework.

---

## Runtime / Package Manager

- Bun

Bun should be used for:

- Installing dependencies
- Running development scripts
- Running tests
- Running project scripts

Use `bun install`, `bun run`, `bunx`. Never npm, yarn, or pnpm.
Never edit `bun.lock` by hand.

Scope note: Bun is the package manager, script runner, and test runner.
It is **not** a separate application server. Next.js serves the app and
Hono runs *inside* the Next.js route handler at
`src/app/api/[[...route]]/route.ts`. Do not create a standalone
`Bun.serve()` process or a second port.

These scripts must exist in `package.json` from the first foundation
task, because every other task's verification step depends on them:

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"typecheck": "tsc --noEmit",
"lint": "next lint",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"seed": "bun run scripts/seed.ts"
```

Linting is ESLint via `next lint` (the Next.js default). Do not swap in
Biome or another linter.

---

## Backend API

- Hono.js

Hono.js is responsible for application API routes and backend
request handling where a dedicated API layer is required.

---

## Database

- PostgreSQL

PostgreSQL is the primary relational database.

---

## ORM

- Drizzle ORM

Drizzle is responsible for:

- Database schema
- Queries
- Relations
- Migrations

---

## Authentication

- Better Auth
- Email/password + Google OAuth

Better Auth manages authentication and sessions.

Do not introduce another authentication framework.

---

## Data Fetching

- TanStack Query

Use TanStack Query where client-side server-state management is
required.

Do not introduce another server-state library.

---

## Client State

- Zustand

Use Zustand only for client-side application state that genuinely
needs centralized state.

Do not store server data in Zustand when TanStack Query is more
appropriate.

---

## API Client

- Axios

A single configured instance in `src/lib/api-client.ts`. Do not create
ad-hoc axios instances or mix in bare `fetch` for API calls.

---

## File Storage

- Cloudinary

Use Cloudinary for appropriate uploaded files such as:

- Device images
- Repair images
- Shop assets (logos)

Do not store large user-uploaded files directly in PostgreSQL.

---

## Styling

- Tailwind CSS
- shadcn/ui

Use the existing design system and reusable components.

---

## Data Tables

- TableCraft

Use TableCraft for list views. Do not hand-roll pagination, sorting,
or filtering.

TableCraft is a reference implementation
(https://github.com/jacksonkasi1/TableCraft) built on TanStack Table +
shadcn/ui, not an installable npm package. Adopt it by copying its data
table components into `src/components/ui/data-table/` and installing its
underlying dependency (`@tanstack/react-table`). This copy-in is
pre-approved — it does not need a separate dependency discussion.

---

## Validation

- Zod

Use Zod for validating external input where appropriate.

---

## Transactional Email (Sprint 3 — Owner Gmail Connection)

- `googleapis` only: the Gmail API client and `google.auth.OAuth2`
  (token exchange, id-token check, refresh, revoke). Don't add
  `google-auth-library` separately.

This is a **pre-approved exception** to §2 below and to the "ask before
adding a dependency" rule in `code-standards.md` §20 — it is required
to implement the approved Owner Gmail Connection feature
(`project-overview.md` § Owner Gmail Connection). Do not add any other
email-sending library (see exclusions).

---

# 2. Explicitly Excluded Technologies

Do NOT introduce:

- Express.js
- MongoDB
- Prisma
- Nodemailer
- React Email
- Firebase Authentication
- Firebase Storage
- tRPC
- Redux unless explicitly approved
- Another ORM
- Another database
- A fourth internal role (`MANAGER`) at the data-model level — see
  `project-overview.md` §6b
- A shared/global RepairTrack-operated Gmail account — every shop
  sends through its own Owner's connected Gmail (§14; the only
  exception is account-verification email, see §14 Rules)

`Gmail API` was previously excluded; it is now approved and in-scope
**only** for the Owner Gmail Connection feature described in §14 — do
not use it for anything else (no marketing email, no digest email, no
internal Anthropic/team email).

Introducing a new framework, ORM, state library, or any new
dependency requires asking first.

---

# 3. High-Level Architecture

The application should follow this general structure:

```text
User
  ↓
Next.js Application
  ↓
UI / Server Components
  ↓
Application Logic
  ↓
Hono.js API
  ↓
Services
  ↓
Drizzle ORM
  ↓
PostgreSQL
```

For file uploads:

```text
User
  ↓
Next.js / API (Generates Signed Upload Data)
  ↓
Cloudinary
```

For customer email sending (Sprint 3):

```text
Repair Status Changed (or Staff-triggered "Send Email")
  ↓
Notification Service
  ↓
Email Service (templates + event rules)
  ↓
Gmail API (using that shop's stored OAuth token)
  ↓
Owner's connected Gmail
  ↓
Customer's inbox
```

---

# 4. Folder Layout

```text
src/app/                    Next.js routes/pages ((auth), (dashboard), (public))
src/app/api/[[...route]]/   Hono mount point (route.ts exporting handle(app))
src/server/hono/            Hono app (app.ts), routes/, and middlewares/
src/server/db/              Drizzle schema + migrations (the only place Drizzle/SQL is written)
src/server/services/        Business logic services (the only place that talks to the db)
src/server/auth/            Better Auth server config (auth.ts)
src/server/storage/         Cloudinary client & signed upload helpers (cloudinary.ts)
src/server/email/           Email building blocks: escape-html.ts, layout.ts, raw-message.ts
src/features/<x>/           Feature queries.ts, mutations.ts, schemas.ts, types.ts, components/
src/components/ui/          shadcn primitives — do not hand-write a Button/Input/Dialog
src/components/             Global / shared layout components
src/lib/                    api-client.ts, auth-client.ts, utils.ts
```

Do not create a folder until a real requirement needs it.

---

# 5. Authentication Architecture

Authentication flow:

```text
User
  ↓
Next.js
  ↓
Better Auth
  ↓
Email/Password or Google OAuth
  ↓
Authenticated Session
  ↓
Protected Application
```

Authentication logic must not be duplicated across individual
features.

`users` has a required `shop_id` and a `role` column. Registration
creates the shop and its `OWNER` in one transaction; staff and
technicians are created through owner invitation, never self-signup.
One user, one shop — do not build a users↔shops join table. The
onboarding rules live in `project-overview.md` §7.

The session is read server-side. A role or `shopId` arriving from the
client is untrusted input.

Protect route groups in middleware **and** re-check the role in the API
handler. Both layers.

Do not hand-roll JWTs. Do not store sessions in localStorage.

**Note:** Better Auth's Google OAuth client (login) and the separate
Gmail-sending OAuth client (§14) must use distinct OAuth client
credentials/config, even though both may authorize against the same
Google account. Do not reuse a Better Auth session token as a Gmail
API access token.

---

# 6. Feature Architecture

Features should be organized around business domains.

Primary domains:

- Auth
- Staff (invitations, roles, status — Sprint 1)
- Repairs
- Customers
- Devices
- Inventory
- Invoices
- Payments
- Notifications (in-app + email/Gmail — Sprint 3)
- Reports

Each feature should contain only logic relevant to that domain.

---

# 7. API Architecture

All routes hang off the single Hono app mounted at
`src/app/api/[[...route]]/route.ts`.

API routes should be organized by domain:

```text
/api/auth
/api/staff
/api/invitations
/api/dashboard
/api/repairs
/api/customers
/api/devices
/api/inventory
/api/invoices
/api/payments
/api/notifications
/api/settings/gmail
/api/reports
```

Handler shape: `zValidator` → auth/role check → call a service → return
JSON. Nothing else. No DB access and no business logic in a handler.

Zod schemas live in `src/features/<feature>/schemas.ts` and are shared
with the forms. Do not redeclare a shape inline.

REST paths use plural nouns: `GET /repairs`, `POST /repairs`,
`PATCH /repairs/:id`, `POST /repairs/:id/status`. No RPC-style verbs
in URLs. The Gmail connect/disconnect actions under
`/api/settings/gmail` are the one accepted exception (OAuth flows are
inherently action-shaped: `/api/settings/gmail/connect`,
`/api/settings/gmail/callback`, `/api/settings/gmail/disconnect`,
`/api/settings/gmail/test`).

Do not create APIs for features that are not part of the approved
product scope.

---

# 8. Database Architecture

Database entities should represent real business domains.

Core entities may include:

- users
- shops
- staff_invitations (Sprint 1: token, email, invited role, invited_by,
  status [`pending` | `accepted` | `expired` | `revoked`], expires_at)
- gmail_connections (Sprint 3: one row per shop — unique `shop_id` FK,
  connected Google account `email`, `refresh_token_encrypted`,
  `status` [`CONNECTED` | `NEEDS_RECONNECT`], `connected_at`). No row
  means not connected. Do not put the refresh token directly on
  `shops` — keep credential storage isolated in its own table so it can
  be access-controlled and rotated independently.
- email_logs (Sprint 3: one row per shop email attempt — `shop_id`,
  nullable `repair_id`, `type` [`email_type` enum], `recipient`,
  `subject`, `status` [`SENT` | `FAILED` | `SKIPPED`], `skip_reason`,
  `error`, `dedupe_key`, `gmail_message_id`). Never stores the HTML body.
- customers
- devices
- repairs
- repair_parts
- inventory
- stock_movements
- invoices
- payments
- notifications

Conventions:

- Plural `snake_case` table names, uuid `id` primary key.
- `shop_id` foreign key on every tenant-owned table.
- `created_at` / `updated_at` timestamps with defaults.
- Enums (repair status, payment status, role, invitation status) as pg
  enums, matching the status list in `project-overview.md` exactly.
- Money stored as `integer` paise — never float. Format only in the UI.
- OAuth refresh tokens (`gmail_connections.refresh_token_encrypted`) are
  stored encrypted at rest (AES-256-GCM via `src/server/crypto/encrypt.ts`
  with `GMAIL_TOKEN_ENCRYPTION_KEY`, never plaintext) and
  are never returned by any API response — see `code-standards.md` §14
  and §17.

**Multi-tenant boundary:** every query made on behalf of a signed-in
user is scoped to that user's `shop_id`.

The one documented exception is the public customer tracking route
(§13), which has no session and therefore no `shop_id` to scope by.
It is the only unauthenticated data path in the application. Do not
create a second one. (The staff invitation-acceptance page is a
second, narrowly-scoped unauthenticated read — see §13a.)

Migrations: `bunx drizzle-kit generate` then `bunx drizzle-kit migrate`.
Never hand-edit or delete a generated migration. Never run `push`
against a shared database. Do not modify a production database
structure manually.

Indexes only for columns the app actually filters or sorts on
(`shop_id`, `status`, `created_at`).

Do not create database tables simply because a UI pattern appears
useful. Every table must have a clear product requirement in the
current sprint.

---

# 9. Server / Client Boundary

Prefer server-side functionality where appropriate.

Server Component by default. Do not convert components to client
components without a reason.

Use client components when functionality requires:

- Browser interaction
- Client-side state
- Event handlers
- Interactive forms
- Client-side data fetching

Client components never import from `src/server/**`. React components
never import `db`. Route handlers never query the database directly.

---

# 10. File Upload Architecture

Uploaded repair/device images and shop logos should follow:

```text
Client
  ↓
Signed upload parameters / signature from server
  ↓
Cloudinary
  ↓
Stored public ID / image URL
  ↓
PostgreSQL
```

The server configures Cloudinary SDK parameters/signatures (`src/server/storage/cloudinary.ts`) and the client uploads to Cloudinary.
Validate image content-type (`image/jpeg|png|webp`) and max size (5MB) server-side before signature generation.

Store the Cloudinary public ID or URL in Postgres, never large binary files. Serve images directly via Cloudinary CDN URLs.

---

# 11. Service Layer

Business logic should not be unnecessarily duplicated between API
routes and UI components.

Examples:

```text
repair.service.ts
customer.service.ts
inventory.service.ts
invoice.service.ts
payment.service.ts
staff.service.ts        (Sprint 1: invite, accept, list, deactivate, role change)
gmail.service.ts        (Sprint 3: OAuth client, send with a given sender)
gmail-connection.service.ts (Sprint 3: connect, disconnect, status, shop sender, sendShopEmail)
```

Services contain reusable business operations and are the only place
that talks to the database.

---

# 12. Architecture Principles

- Keep modules independent.
- Keep business logic reusable.
- Avoid circular dependencies.
- Avoid unnecessary abstractions.
- Prefer simple solutions.
- Reuse existing utilities.
- Keep database access centralized.
- Validate external input.
- Protect authenticated resources.
- Never expose secrets to the client.

---

# 13. Public Customer Tracking Route

`/track/[ticketId]` is public — no session, no `shop_id` scoping.

Because it is unauthenticated, it must:

- Require **two** matching factors: the ticket identifier **and** the
  customer's phone number. Never the ticket ID alone.
- Return only: repair status, current stage, device make/model,
  estimated or final cost when appropriate, ready-for-pickup state.
- Never return: customer address or email, internal notes, technician
  identity, other repairs, shop financials, or any `id` that allows
  enumerating other records.
- Identify the repair by a **public ticket number: 10 randomly
  generated digits** (e.g. `4820193756`), stored in its own column
  with a unique index, generated with a crypto-secure RNG and retried
  on collision. It is never sequential and never derived from the row
  id or the date. Do not expose the database uuid, and do not use an
  incrementing or year-prefixed number such as `RT-2026-00124`.
- Be rate-limited per IP.
- Stay read-only **except** for the one named public mutation:
  `POST /api/track/[trackingToken]/decision`. That endpoint exists
  only for customer approve/reject on a currently pending
  `repair_approvals` row, is reachable only by a valid tracking token
  (never by ticket+phone manual search), determines the target repair
  entirely from that token, and must not be generalized into any other
  unauthenticated write capability.

Treat this as a separate read model, not a filtered version of the
internal repair query.

---

# 13a. Public Staff Invitation Route (Sprint 1)

`/invite/[token]` is public — no session.

- Looks up `staff_invitations` by the single-use token only (never by
  email or a guessable ID). Reject expired, already-accepted, or
  revoked tokens with a generic message.
- Returns only what's needed to render the "accept invite" form: the
  invited name, email, role, and the inviting shop's display name.
  Never return the shop's internal id list, other staff, or any
  financial/repair data.
- On acceptance, creates the user (password or Google OAuth) inside a
  transaction that also marks the invitation `accepted` and sets the
  new user's `role`/`shop_id` from the invitation record — never from
  client input.
- Google OAuth acceptance: "Continue with Google" sends the token as
  OAuth `additionalData` (`inviteToken`), with the invite page as
  `errorCallbackURL`. `src/server/auth/invite-oauth.ts` re-validates it in
  Better Auth hooks: `user.create.before` requires a pending, unexpired
  invitation whose email equals the Google email and takes `role`/`shop_id`
  from it (otherwise no user or shop is created); `user.create.after`
  marks it `accepted`; `session.create.before` refuses an existing account
  whose email or shop doesn't match the invitation. Rejections redirect to
  `/invite/[token]?error=INVITE_*` (messages in `INVITE_GOOGLE_ERRORS`).
- Rate-limited per IP, same as §13.

---

# 14. Gmail Sending Architecture (Sprint 3)

Per `project-overview.md` § Owner Gmail Connection.

```text
Owner clicks "Connect Gmail" (Settings → Email & Notifications)
  ↓
GET /api/settings/gmail/connect: random state in a signed httpOnly
cookie, redirect to Google (scope = gmail.send openid email,
access_type=offline, prompt=consent)
  ↓
GET /api/settings/gmail/callback: state must match the cookie →
getToken(code) → email from the verified id token
  ↓
Refresh token stored encrypted in gmail_connections (shop-scoped)
  ↓
sendShopEmail(shopId, buildMessage) → getShopGmailSender decrypts it →
gmail.service.ts mints a short-lived access token and calls the Gmail
API's users.messages.send
  ↓
Email sent "from" the Owner's own connected address
```

`GET /api/settings/gmail` (status) is OWNER + STAFF: STAFF get `status`
only (`email` / `connectedAt` null) for the Create Repair success-screen warning. Every
other `/api/settings/gmail` route is OWNER only.

Rules:

- **Exception:** The .env platform sender is permitted only for
  account-verification emails. Shop-level operational emails must use
  the shop owner's connected Gmail account.
  - "Account-verification emails" means verification and authentication
    emails only: Owner registration, staff/technician signup after
    accepting an invite (Better Auth `signUpEmail`), reactivated-staff
    verification, and future auth emails such as password reset.
  - Staff/technician invitations, repair updates, invoice and payment
    emails are shop emails: Owner's Gmail only. When it isn't connected,
    the UI shows `ConnectGmailPrompt` before the action instead of
    sending.
- One Google Cloud OAuth app (`GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`)
  serves every sender; a sender is that app plus one mailbox's refresh
  token. `gmail.service.ts` `sendEmail(sender, message)` takes the
  sender (`GmailSender = { name, email, refreshToken, shopEmail? }`) as a parameter
  and never hard-codes one. The `.env` sender is private to
  `gmail.service.ts` and reachable only through
  `sendAccountVerificationEmail`.
- `sendEmail` returns `{ sent: true, messageId }` or
  `{ sent: false, reason: 'not_configured' | 'invalid_grant' | 'send_failed', error }`
  and never throws; `invalid_grant` means the shop must reconnect.
- Event-triggered shop emails (repair updates, invoice, payment) go
  through `queueShopEmail` in `email.service.ts`. It runs after the
  response via Next's `after()`, so email never delays or fails the
  action, and records every attempt in `email_logs` as SENT (with the
  Gmail message id), FAILED (with the error) or SKIPPED
  (`no_customer_email`, `gmail_not_connected`, `already_sent` when a SENT
  log with the same `dedupe_key` exists for the shop). Reply-To is the
  shop's email when set. It wraps `sendAndLogShopEmail`, which sends
  immediately and returns the outcome — used where the caller needs the
  result (Send test email → `TEST`, staff invitation → `STAFF_INVITATION`). `queueShopEmail` never
  throws; outside a request it only logs "could not be queued", so scripts use
  `sendAndLogShopEmail` or `sendShopEmail`. Event emails use a per-event `dedupeKey`
  (`REPAIR_RECEIVED:<repairId>`, `APPROVAL_REQUIRED:<approvalId>` so each
  approval request emails once and a re-request sends again). Status emails
  are queued from `updateRepairStatus` after its transaction commits, through
  one `STATUS_EMAIL_TYPES` map (`IN_REPAIR` → `REPAIR_STARTED`,
  `READY_FOR_PICKUP` → `READY_FOR_PICKUP`, `COMPLETED` → `REPAIR_COMPLETED`)
  with `dedupeKey` `<TYPE>:<repairId>`, so each is sent at most once per repair
  (a reopened repair does not get them again). Invoice Generated is queued from
  `createInvoiceFromRepair` after its transaction commits, with `dedupeKey`
  `INVOICE_GENERATED:<invoiceId>` (a cancelled-and-reissued invoice has a new id,
  so it is emailed again). The whole invoice is in the body; no PDF attachment.
- Email building blocks live in `src/server/email/`: `escape-html.ts`
  (`escapeHtml`), `layout.ts` (`renderEmailLayout`, the shared table
  shell every template uses), `components.ts` (`heading`, `ctaButton`,
  `linkFallback`, `ctaWithFallback`, `closingNote`, `detailRow`,
  `DETAIL_VALUE_STYLE`, `detailsCard` (optional title), `deviceDetailsCard`
  (Device + optional Expected by), `ticketHighlight`, `greeting`,
  `statusPill` / `amountBand` (amber / blue / green tones), `textBlock`
  — escapes its text, then keeps line breaks as `<br>`; `optionalDetailRows`
  — drops empty values, escapes the rest; `chargesCard(charges, title)` —
  Labor / Parts / Additional / GST rows + Total (incl. GST) band) and
  `raw-message.ts` (`buildRawEmail`: CR/LF stripped from headers, RFC 2047
  From name and Subject, base64 HTML body wrapped at 76 characters,
  base64url output). Event templates live in `src/server/email/templates/`,
  one file per event, each exporting `build<Event>Email(data): { subject, html }`
  and escaping every user-entered value.
- One `gmail_connections` row per shop; disconnecting revokes the token
  at Google (best effort) and deletes the row rather than merely
  flagging it "disconnected" (don't keep sendable tokens around for a
  disconnected account).
- Every shop email goes through `sendShopEmail` in
  `gmail-connection.service.ts`. It returns `not_connected` when there
  is no usable sender, and on `invalid_grant` it sets the row's status
  to `NEEDS_RECONNECT` (Settings then shows "Reconnect needed").
  `getShopGmailSender` returns `null` for `NEEDS_RECONNECT` rows.
- `STAFF` can call an endpoint like `POST /api/notifications/send` that
  triggers a template send; they never receive the token, client ID,
  client secret, or a Gmail API response containing credentials.
- If a shop has no `gmail_connections` row (or it's disconnected), the
  send endpoint returns a clear "email not connected" result and the
  Owner is asked to connect Gmail — it must not silently fail or fall
  back to the `.env` platform sender (see the exclusion in §2).
- Do not request broader Gmail scopes (e.g. full mailbox read/modify)
  than `gmail.send` (plus `openid email` to identify the connected
  address) — this keeps the OAuth consent screen narrow and
  trustworthy for shop owners connecting a personal Gmail account.

---

# 15. Architecture Change Rule

Do not change the established architecture simply because another
approach appears popular.

Before introducing a major architectural change:

1. Check `project-overview.md`.
2. Check `AGENTS.md`.
3. Check existing implementation.
4. Determine whether the change is actually required.
5. Ask for approval if it affects the core architecture.