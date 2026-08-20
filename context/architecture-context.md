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

- Cloudflare R2

Use Cloudflare R2 for appropriate uploaded files such as:

- Device images
- Repair images
- Shop assets

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

# 2. Explicitly Excluded Technologies

Do NOT introduce:

- Express.js
- MongoDB
- Prisma
- Nodemailer
- React Email
- Gmail API
- Firebase Authentication
- Firebase Storage
- tRPC
- Redux unless explicitly approved
- Another ORM
- Another database

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
Next.js / API
  ↓
Cloudflare R2
```

---

# 4. Folder Layout

```text
src/app/            Next.js routes/pages (Server Components by default)
src/app/api/[[...route]]/route.ts   the single Hono mount point
src/api/routes/     Hono route handlers (thin: validate → service → return)
src/api/middleware/ auth, error handler
src/server/db/      Drizzle schema + migrations (the only place Drizzle/SQL is written)
src/server/services/ business logic (the only place that talks to the db)
src/server/auth/    Better Auth config
src/server/storage/ R2 client
src/features/<x>/   schemas.ts (Zod), queries.ts, mutations.ts, types.ts
src/components/ui/  shadcn primitives — do not hand-write a Button/Input/Dialog
src/components/<x>/ feature components
src/stores/         Zustand — UI state only
src/lib/            api-client.ts, utils, constants
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

---

# 6. Feature Architecture

Features should be organized around business domains.

Primary domains:

- Auth
- Repairs
- Customers
- Devices
- Inventory
- Invoices
- Payments
- Notifications
- Reports

Each feature should contain only logic relevant to that domain.

---

# 7. API Architecture

All routes hang off the single Hono app mounted at
`src/app/api/[[...route]]/route.ts`.

API routes should be organized by domain:

```text
/api/auth
/api/repairs
/api/customers
/api/devices
/api/inventory
/api/invoices
/api/payments
/api/notifications
/api/reports
```

Handler shape: `zValidator` → auth/role check → call a service → return
JSON. Nothing else. No DB access and no business logic in a handler.

Zod schemas live in `src/features/<feature>/schemas.ts` and are shared
with the forms. Do not redeclare a shape inline.

REST paths use plural nouns: `GET /repairs`, `POST /repairs`,
`PATCH /repairs/:id`, `POST /repairs/:id/status`. No RPC-style verbs
in URLs.

Do not create APIs for features that are not part of the approved
product scope.

---

# 8. Database Architecture

Database entities should represent real business domains.

Core entities may include:

- users
- shops
- customers
- devices
- repairs
- repair_parts
- inventory
- invoices
- payments
- notifications

Conventions:

- Plural `snake_case` table names, uuid `id` primary key.
- `shop_id` foreign key on every tenant-owned table.
- `created_at` / `updated_at` timestamps with defaults.
- Enums (repair status, payment status, role) as pg enums, matching the
  status list in `project-overview.md` exactly.
- Money stored as `integer` paise — never float. Format only in the UI.

**Multi-tenant boundary:** every query made on behalf of a signed-in
user is scoped to that user's `shop_id`.

The one documented exception is the public customer tracking route
(§13), which has no session and therefore no `shop_id` to scope by.
It is the only unauthenticated data path in the application. Do not
create a second one.

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

Uploaded repair/device images should follow:

```text
Client
  ↓
Presigned URL from server
  ↓
Cloudflare R2
  ↓
Stored object key
  ↓
PostgreSQL
```

The server issues a presigned URL and the client PUTs directly to R2.
Validate content-type (`image/jpeg|png|webp`) and max size (5MB)
server-side before signing.

Store the object key in Postgres, never a public URL. Serve reads
through presigned GETs.

Database records should store references/metadata rather than large
binary files.

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

Treat this as a separate read model, not a filtered version of the
internal repair query.

---

# 14. Architecture Change Rule

Do not change the established architecture simply because another
approach appears popular.

Before introducing a major architectural change:

1. Check `project-overview.md`.
2. Check `AGENTS.md`.
3. Check existing implementation.
4. Determine whether the change is actually required.
5. Ask for approval if it affects the core architecture.
