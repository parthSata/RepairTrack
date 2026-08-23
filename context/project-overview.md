# RepairTrack — Project Overview

## 1. Product Identity

### Product Name

RepairTrack

### Product Type

Repair Shop Management SaaS

### Product Vision

RepairTrack is a modern SaaS platform designed to help local repair
businesses manage customers, devices, repair jobs, inventory,
invoices, payments, and repair status from one centralized system.

The product should replace paper registers, spreadsheets, scattered
messages, and manual repair tracking with a professional digital
workflow.

---

# 2. Problem Statement

Many small repair businesses manage their daily operations manually.

Common problems include:

- Paper-based repair records
- Difficulty tracking repair status
- Lost customer information
- No centralized device history
- Poor visibility into pending repairs
- Difficulty tracking parts
- Manual invoice creation
- Payment tracking problems
- Customers repeatedly calling to ask for repair status
- No professional customer-facing repair tracking
- Difficulty understanding shop performance

RepairTrack aims to solve these problems through one centralized
application.

---

# 3. Target Users

## Primary Users

### Shop Owner

Responsible for:

- Managing the repair shop
- Viewing business performance
- Managing staff
- Managing repairs
- Managing customers
- Managing inventory
- Managing invoices
- Viewing reports

### Staff

Responsible for:

- Creating customers
- Registering devices
- Creating repair tickets
- Updating repair information
- Managing customer interactions
- Creating invoices

### Technician

Responsible for:

- Viewing assigned repairs
- Diagnosing devices
- Adding repair notes
- Updating repair progress
- Recording used parts
- Completing repairs

### Customer

Customers do not require access to the internal dashboard.

They should be able to:

- View repair status
- View basic repair information
- View estimated/final cost when appropriate
- View pickup status
- Access a customer-facing repair tracking page

---

# 4. Core Product Modules

RepairTrack consists of the following approved modules:

1. Authentication
2. Dashboard
3. Repair Management
4. Customer Management
5. Device Management
6. Inventory Management
7. Invoice Management
8. Payment Management
9. Notifications
10. Reports
11. Settings
12. Customer Repair Tracking

---

# 5. Core Repair Workflow

The primary business workflow is:

Customer
    ↓
Customer Registration
    ↓
Device Registration
    ↓
Repair Ticket Creation
    ↓
Diagnosis
    ↓
Estimate / Customer Approval
    ↓
Repair
    ↓
Quality Check
    ↓
Ready for Pickup
    ↓
Invoice
    ↓
Payment
    ↓
Completed

The UI and application architecture should make this workflow easy
to understand.

---

# 6. Repair Statuses

The initial repair lifecycle should support:

- RECEIVED
- DIAGNOSING
- WAITING_FOR_APPROVAL
- APPROVED
- WAITING_FOR_PARTS
- IN_REPAIR
- QUALITY_CHECK
- READY_FOR_PICKUP
- COMPLETED
- CANCELLED

Do not introduce additional statuses without a clear business
requirement.

This list is the single source of truth for the status enum. The
diagram in `ui-context.md` §11 is a simplified visual grouping, not a
second list — do not generate the enum from it.

---

# 6b. Roles and Permissions

Role enum values (exact):

- OWNER
- STAFF
- TECHNICIAN

`CUSTOMER` is **not** a role and not a user account. Customers never
sign in; they use the public tracking page only.

| Action | OWNER | STAFF | TECHNICIAN |
|---|---|---|---|
| View dashboard | yes | yes | assigned repairs only |
| Create/edit customers, devices | yes | yes | no |
| Create repair ticket | yes | yes | no |
| Assign technician | yes | yes | no |
| Update repair status, diagnosis, notes | yes | yes | assigned repairs only |
| Record parts used | yes | yes | assigned repairs only |
| Create/edit invoices, record payments | yes | yes | no |
| Manage inventory | yes | yes | no |
| View reports | yes | yes | no |
| Manage staff, shop settings | yes | no | no |

Every mutating endpoint must check this table server-side. If an
action is not listed, ask before implementing a permission for it.

---

# 7. Core Features

## Authentication

- Login
- Registration (creates a new shop — see below)
- Google OAuth
- Session management
- Protected application routes
- Logout

Authentication is handled through Better Auth.

### Shop creation and onboarding

- Public registration creates **a new shop**, and the registering user
  becomes its `OWNER`. This is the only way a shop comes into existence.
- `STAFF` and `TECHNICIAN` accounts are **invited by the owner** from
  Settings → Staff. They never self-register into an existing shop.
- A user belongs to exactly one shop. Multi-location and multi-shop
  membership are deferred (§9) — do not model a join table for them now.
- Every signed-in user therefore always has exactly one `shop_id`,
  which is what the tenancy rule in `architecture-context.md` §8 scopes
  every query by.

---

## Dashboard

The dashboard should provide a quick overview of:

- Active repairs
- Repairs ready for pickup
- Pending approvals
- Pending payments
- Revenue overview
- Recent repairs
- Repair status distribution
- Important operational information

The dashboard should prioritize useful business information over
decorative widgets.

---

## Repair Management

Users with appropriate permissions can:

- Create repair tickets
- View repair tickets
- Search repairs
- Filter repairs
- Update repair status
- Assign technicians
- Add diagnosis
- Add repair notes
- Add repair photos
- Add repair parts
- Record repair cost
- Record estimated cost
- View repair history
- Complete repairs
- Mark repairs ready for pickup


When a repair moves to `DIAGNOSING` and its linked device has an
unverified model (see Device Management below), the technician should
be prompted — non-blocking — to confirm the device's model as part of
diagnosis, since this is the natural point where the device is
physically opened/inspected.

---

## Customer Management

Users can:

- Create customers
- Edit customers
- View customers
- Search customers
- View customer repair history
- View customer devices
- View customer invoices

---

## Device Management

Users can:

- Register devices
- Associate devices with customers
- Store device information
- View device repair history
- View device condition
- Store device photos where required

### Unverified device model
 
A device's `model` is not always knowable at intake — the device may be
powered off, dead, or missing its IMEI/serial. To avoid blocking intake:
 
- `model` is optional when a device is created. If left blank, the
  device is marked **Unverified** and shown with a clear visual
  indicator wherever it appears (Device List, Device Details, Repair
  Details).
- A device can be confirmed/updated at any time from Device Details, or
  inline during repair diagnosis (see Repair Management above).
- Unverified is a normal, expected state for a newly-received device —
  it is not an error condition and must not block repair-ticket
  creation or status progression.

---

## Inventory Management

Users can:

- Add parts
- Edit parts
- View stock
- Search parts
- Track stock quantity
- Record parts used in repairs
- Identify low-stock items

---

## Invoice Management

Users can:

- Create invoices
- View invoices
- Add repair charges
- Add parts
- Apply discounts where supported
- View invoice status
- Record payment information

---

## Payment Management

Users can:

- Record payments
- View payment history
- Track pending payments
- Track completed payments

Payment integration should only be introduced when explicitly
required by the product roadmap.

---

## Notifications

The initial notification system should focus on in-app
notifications.

Examples:

- Repair status changed
- Repair ready for pickup
- Payment pending
- Low inventory
- Customer approval required

Transactional email (repair status changes, invites) is sent through the
owner's own connected Gmail account — see "Owner Email Connection"
below. This is approved for Sprint 3. Do not add a separate
transactional email provider (SendGrid, Resend, Postmark, etc.) or a
shared RepairTrack-owned sender address — every shop sends from its own
owner's Gmail.

Bulk/marketing email and automated drip campaigns remain out of scope
(see §9).

---

## Owner Email Connection

The shop owner can connect their own Gmail account so repair
notifications are sent from their real email address, not a shared
RepairTrack address.

- Settings → Email & Notifications → Connect Gmail
- Google OAuth consent, scoped to sending mail only
- This is a **separate OAuth grant from Google login** — connecting
  Gmail does not require the owner to have logged in via Google, and
  logging in via Google does not automatically grant send access
- Owner sees connection status (Connected / Not Connected) and can
  disconnect at any time
- If disconnected, notification-triggered emails simply do not send
  (no fallback shared sender)
- Staff/Technicians never see or handle the owner's Gmail credentials —
  they can trigger a send action, RepairTrack executes it through the
  owner's stored authorization

Events that trigger an email (once connected):

- Repair approval required
- Repair approved
- Repair ready for pickup
- Repair delayed (optional)
- Staff/Technician invitation (see Staff Management)

Do not add an email for every minor field change.

---

## Reports

Reports may include:

- Repair volume
- Revenue
- Completed repairs
- Pending repairs
- Payment summary
- Inventory summary

Reports should be introduced according to the sprint roadmap.

---

## Customer Tracking

Customers should have a simple customer-facing tracking experience.

The customer can use a repair/ticket identifier to view:

- Repair status
- Device information
- Current repair stage
- Basic cost information when appropriate
- Ready-for-pickup status

Do not expose private shop information.

---

## Settings

Settings may include:

- User profile
- Shop information
- Staff management (see "Staff Management" below)
- Application preferences

---

## Staff Management

The owner manages their team from Settings → Staff Management.

Owner can:

- View all staff/technicians in their shop
- Invite a new Staff or Technician (name, email, role)
- Generate a shareable invite link (Sprint 1) / send an invite email
  once Gmail is connected (Sprint 3)
- View invite status: Active, Invited (pending)
- Change a staff member's role (Staff ↔ Technician)
- Deactivate / reactivate a staff member
- Remove a staff member

Invited users accept via `/invite/[token]`, complete their account, and
are added to the inviting owner's shop with the assigned role. They never
self-register into an existing shop (see §7 Authentication above).

Staff and Technicians cannot invite, remove, or change the role of
anyone. Only OWNER can access this screen.

---

# 8. Important Exclusions

The following are NOT part of the current product scope:

- Warranty management
- Social media
- Social feed
- Marketplace
- E-commerce
- Cryptocurrency
- Blockchain
- HR management
- Payroll
- Full accounting software
- Marketing automation
- Blog management
- Customer community
- Unrelated AI features
- Unapproved integrations

Do not create UI, routes, APIs, database tables, or components for
these features.

---

# 9. Advanced / Future Features

The following may be considered in future development:

- Activity / Audit Logs
- Advanced analytics
- Advanced reporting
- Automated customer communication (bulk/marketing sequences — distinct
  from the individual transactional emails sent via Owner Email
  Connection, which are in scope for Sprint 3)
- Additional payment providers
- Multi-location support
- Advanced inventory forecasting
- Advanced role permissions
- AI-assisted repair insights

These are NOT MVP requirements.

Do not implement them unless explicitly requested.

---

# 10. Product Principles

RepairTrack should be:

- Professional
- Simple
- Fast
- Reliable
- Scalable
- Easy to understand
- Commercially viable
- Mobile responsive
- Accessible
- Maintainable

The application should solve real repair-shop problems rather than
attempting to maximize the number of features.

---

# 11. Scope Rule

Every feature, screen, route, API, database table, component, and
workflow must be connected to an approved product requirement.

Do not invent functionality.

When a requirement is unclear, ask for clarification instead of
guessing.

---

# 12. Development Strategy

RepairTrack will be developed in four major sprints.

## Sprint 1 — MVP

Focus on the minimum usable repair-management product, including
authentication and Staff Management (owner can build their team before
repair operations depend on technician assignment).

## Sprint 2 — Core Operations

Expand repair, customer, device, inventory, and billing workflows.

## Sprint 3 — Business Intelligence

Add reports, notifications, the owner's Gmail-based email connection,
and polishing.

## Sprint 4 — Advanced / Production Readiness

Improve security, performance, permissions, auditability,
accessibility, testing, and commercial readiness.

The exact task status must always be tracked in:

progress-tracker.md