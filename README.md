# RepairTrack 🛠️

> **A modern, multi-tenant repair shop management SaaS platform.**  
> Streamline customer intake, device diagnosis, parts inventory, approval workflows, invoicing, and real-time repair tracking from a single intuitive dashboard.

[![Live App](https://img.shields.io/badge/Live%20Demo-repair--track--rust.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://repair-track-rust.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Runtime-Bun-fbf0df?style=for-the-badge&logo=bun)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)

---

## 🌐 Live Application

- **Production URL**: [https://repair-track-rust.vercel.app/](https://repair-track-rust.vercel.app/)
- **Customer Tracking Portal**: Accessible via `https://repair-track-rust.vercel.app/track/{ticketId}` (no authentication required)

---

## 📌 Problem & Vision

Many independent electronics, smartphone, and appliance repair shops still run their daily operations on paper notebooks, messy spreadsheets, and disjointed WhatsApp threads. 

Common bottlenecks include:
- **Lost repair history & device details**: Inability to pull up a device's past issues or warranties.
- **Constant status calls**: Customers repeatedly calling to ask, *"Is my device ready?"*
- **No audit trail for parts & labor**: Discrepancies between quotes given, parts consumed from stock, and final invoices.
- **Estimate approval delays**: Lack of a formal approval mechanism before technicians order or swap expensive components.

**RepairTrack** digitizes the entire lifecycle of a repair business into a frictionless SaaS platform. It gives repair shops a professional operational tool while offering customers transparent, self-serve tracking.

---

## 🚀 Key Modules & Capabilities

### 1. 🏢 Multi-Tenant Shop Management
- Complete tenant data isolation (`shop_id` scoping enforced across all database queries and transactions).
- Custom shop profiles: business name, contact info, working hours, address, and branded receipts.

### 2. 👥 Role-Based Access Control (RBAC)
RepairTrack enforces strict server-side permissions across 3 staff roles + a customer view:

| Role | Permissions & Capabilities |
| :--- | :--- |
| **👑 Shop Owner** | Full administrative control. Manage business profile, invite & manage staff, view revenue reports & analytics, connect shop Gmail account, create and manage invoices/repairs. |
| **💼 Staff** | Front-desk operations: register customers & devices, create repair tickets, communicate with customers, generate invoices, record payments. |
| **🔧 Technician** | Workshop operations: view assigned repair tickets, diagnose devices, verify device brand/model, log diagnostic notes, allocate inventory parts, upload repair photos, update progress. |
| **📱 Customer** | Zero-login self-service portal: view live progress timeline, review cost estimates, approve/reject repair quotes, download invoices, see pickup status. |

### 3. 🔄 End-to-End Repair Lifecycle Engine
Repairs progress through strict, verifiable states:
```mermaid
    flowchart LR
        A[Intake] --> B[Diagnosing]
        B --> C{Estimate Approval}
        C -->|Customer Approves| D[In Progress]
        C -->|Customer Rejects| E[Cancelled / Return]
        D --> F[Quality Check]
        F --> G[Ready for Pickup]
        G --> H[Invoicing & Payment]
        H --> I[Completed]
```
- **Device Model Verification Gate**: Technicians must verify or identify unconfirmed device models before parts allocation and estimate approval requests.
- **Cycle-Scoped Reopen & Recovery**: Support for warranty returns or re-inspections. Reopening a ticket creates an atomic recovery cycle that isolates past payments while tracking new diagnostic cycles.
- **Repair Photos**: Pre-repair and post-repair photographic inspection evidence powered by Cloudinary.

### 4. 📦 Inventory & Spare Parts Control
- Stock level tracking with low-stock thresholds.
- Part cost and retail price tracking.
- Direct assignment of inventory items to repair tickets with automatic quantity deduction.

### 5. 🧾 Invoicing & Payments
- Itemized invoicing combining labor fees and allocated inventory parts.
- Flexible payment methods: Cash, Credit/Debit Card, UPI, Bank Transfer.
- Partial payment tracking, pending balances, and cycle-aware accounting.

### 6. 📧 Tenant-Owned Gmail Integration
- Shop owners can connect their own shop Gmail account via OAuth2.
- Outbound transactional emails (ticket creation receipts, estimate approval requests, pickup notifications, invoices) are dispatched directly from the shop's email address.
- Stored OAuth refresh tokens are encrypted at rest using AES-256-GCM.

### 7. 📊 Dashboard Analytics & Reporting
- Real-time KPI summary: Active repairs, revenue this month, pending approvals, completed jobs.
- Visual charts: Status distributions, revenue trends, and technician workload.

---

## 🏗️ Technical Architecture & Stack

```
RepairTrack Architecture
 ├── Frontend Layer: Next.js 16 (App Router) + React 19 + TypeScript
 │    ├── UI Components: Tailwind CSS v4, shadcn/ui, Lucide Icons, Recharts
 │    ├── State Management: Zustand (client state) + TanStack Query (server state)
 │    └── Data Tables: TableCraft (TanStack Table + shadcn)
 ├── Backend API Layer: Hono.js embedded in Next.js Route Handlers (/api/[[...route]])
 │    ├── Validation: Zod schemas
 │    ├── Auth: Better Auth (Email/Password, Google OAuth, Staff Invites)
 │    └── Encryption: AES-256-GCM for sensitive credentials
 ├── Database Layer: PostgreSQL on Neon Serverless
 │    └── ORM: Drizzle ORM (type-safe migrations, queries, and relations)
 └── External Services:
      ├── Media Storage: Cloudinary (Device & repair photo uploads)
      └── Email Delivery: Google Gmail API (OAuth2 per shop)
```

---

## 📁 Project Structure

```
RepairTrack/
├── context/                 # Core domain rules & architecture documentation
├── drizzle/                 # Generated database migration SQL files
├── public/                  # Static assets & brand graphics
├── scripts/                 # Migration, audit, keygen, and verification scripts
└── src/
    ├── app/                 # Next.js App Router
    │   ├── (auth)/          # Login, Register, Password Reset, Onboarding
    │   ├── (dashboard)/     # Authenticated shop application
    │   │   ├── customers/   # Customer management
    │   │   ├── dashboard/   # Analytics & KPI dashboards
    │   │   ├── devices/     # Device registry & history
    │   │   ├── inventory/   # Spare parts inventory
    │   │   ├── invoices/    # Billing & invoice management
    │   │   ├── payments/    # Payment tracking
    │   │   ├── repairs/     # Repair tickets & workflows
    │   │   └── settings/    # Shop profile, staff management, Gmail setup
    │   ├── api/             # Hono backend API routes (/api/[[...route]])
    │   ├── invite/[token]/  # Staff invitation acceptance portal
    │   └── track/[ticketId]/# Public customer repair tracking portal
    ├── components/          # Reusable UI components & shadcn primitives
    ├── features/            # Feature-specific components, hooks & schemas
    ├── lib/                 # Shared utilities, API client (Axios), formatters
    └── server/              # Server-side domain layer
        ├── auth/            # Better Auth configuration & handlers
        ├── crypto/          # AES-256-GCM encryption helpers
        ├── db/              # Drizzle DB client & schema definitions
        ├── hono/            # Hono application router & route modules
        ├── services/        # Core business logic services
        └── storage/         # Cloudinary integration
```

---

## 🛠️ Getting Started (Local Development)

### Prerequisites

1. **Bun** runtime installed (v1.2+ recommended):
   ```bash
   curl -fsSL https://bun.sh/install | bash  # macOS/Linux
   powershell -c "irm bun.sh/install.ps1 | iex"  # Windows
   ```
2. **PostgreSQL** database (e.g. a free serverless database on [Neon](https://neon.tech)).

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/parthsata/RepairTrack.git
cd RepairTrack
```

---

### Step 2: Install Dependencies

> ⚠️ Always use **Bun** to manage dependencies. Do not use `npm`, `yarn`, or `pnpm`.

```bash
bun install
```

---

### Step 3: Configure Environment Variables

Create your local `.env.local` file by copying `.env.example`:

```bash
cp .env.example .env.local
```

Fill in the required configuration:

```env
# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
TRUST_PROXY=false

# Database (Neon Serverless PostgreSQL)
# Runtime: Pooled connection string (-pooler in host)
DATABASE_URL=postgresql://user:password@ep-xyz-pooler.region.neon.tech/dbname?sslmode=require
# Migration: Direct connection string (NO -pooler in host)
MIGRATION_DATABASE_URL=postgresql://user:password@ep-xyz.region.neon.tech/dbname?sslmode=require

# Better Auth Secret (Generate via: openssl rand -base64 32 or bun run generate:key)
BETTER_AUTH_SECRET=your_32_byte_secret_here
BETTER_AUTH_URL=http://localhost:3000

# Encryption Keys (32-byte Base64 key for encrypting shop Gmail tokens)
GMAIL_TOKEN_ENCRYPTION_KEY=your_base64_32_byte_key
PENDING_REGISTRATION_ENCRYPTION_KEY=your_base64_32_byte_key

# Gmail API OAuth Credentials (Google Cloud Console)
GMAIL_CLIENT_ID=your_gmail_oauth_client_id
GMAIL_CLIENT_SECRET=your_gmail_oauth_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/settings/gmail/callback
GMAIL_REFRESH_TOKEN=optional_platform_sender_token
GMAIL_USER=platform_sender_email@gmail.com

# Cloudinary (Media storage for repair photos and logos)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_PRESET_KEY=your_upload_preset
```

> **Tip**: You can generate strong encryption keys with:
> ```bash
> bun run generate:key
> ```

---

### Step 4: Run Database Migrations

Apply the database schema to your PostgreSQL database:

```bash
bun run db:migrate
```

To explore the database visually via Drizzle Studio:
```bash
bun run db:studio
```

---

### Step 5: Start the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Scripts

| Command | Purpose |
| :--- | :--- |
| `bun run dev` | Runs the Next.js local development server |
| `bun run build` | Compiles the production build |
| `bun run start` | Starts the production server |
| `bun run typecheck` | Checks TypeScript types without emitting code |
| `bun run lint` | Runs ESLint checks |
| `bun run test` | Runs the test suite via Bun |
| `bun run check` | Runs full suite: Typecheck + Lint + Test + Build |
| `bun run db:generate` | Generates new Drizzle schema migrations |
| `bun run db:migrate` | Applies pending migrations to the database |
| `bun run db:studio` | Launches Drizzle Studio GUI for database inspection |
| `bun run verify:request-approval` | Integration verification for customer approval flow |
| `bun run verify:reopen-repair` | Integration verification for repair reopen cycle |
| `bun run audit:integrity` | Verifies shop and user tenant integrity |

---

## 🔒 Security & Architecture Principles

- **Strict Multi-Tenancy**: All database queries are explicitly filtered by `shop_id` extracted from verified server sessions.
- **Server-Side Authorization**: Roles (`OWNER`, `STAFF`, `TECHNICIAN`) are evaluated in backend Hono middlewares and services, never solely trusted from client state.
- **Safe Input Validation**: All incoming request payloads are validated using strict Zod schemas with `@hono/zod-validator`.
- **Encryption at Rest**: OAuth tokens and sensitive customer credentials are encrypted with authenticated AES-256-GCM before storage.
- **Audit Logging**: Repair status changes and email dispatches maintain immutable audit histories.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
