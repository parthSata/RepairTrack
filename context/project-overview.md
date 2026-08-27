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
- Connecting the shop's own Gmail account for customer email sending

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
11. Settings (Shop Profile, Staff Management, Email & Notifications)
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
| Update repair status | NO* | yes | assigned repairs only |
| Edit diagnosis, add repair notes | yes | yes | assigned repairs only |
| Reopen COMPLETED/CANCELLED ticket | yes | no | no |
| Record parts used | yes | yes | assigned repairs only |
| Create/edit invoices, record payments | yes | yes | no |
| Manage inventory | yes | yes | no |
| View reports | yes | yes | no |
| Manage staff, shop settings | yes | no | no |
| Connect/disconnect shop Gmail | yes | no | no |
| Trigger a customer email send (e.g. "Send Ready for Pickup Email") | yes | yes | no |

* **Exception:** repair status changes are restricted to STAFF and the assigned TECHNICIAN; OWNER is intentionally excluded from direct status changes and manages the shop by reassigning, not by editing ticket state. OWNER retains the single administrative override exception to reopen COMPLETED or CANCELLED tickets.

Every mutating endpoint must check this table server-side. If an
action is not listed, ask before implementing a permission for it.

This table (not the illustrative `permissionKey.action` list in any
planning doc) is the single source of truth for authorization checks.
The underlying implementation should express permissions as discrete
keys (e.g. `customers.view`, `staff.create`, `settings.update`) mapped
per role, rather than hard-coded `if (role === 'OWNER')` checks
scattered through the codebase — this makes Sprint 4's move to
granular, owner-configurable permissions an additive change rather
than a rewrite.

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
  Settings → Staff Management. They never self-register into an existing shop.
- A user belongs to exactly one shop. Multi-location and multi-shop
  membership are deferred (§9) — do not model a join table for them now.
- Every signed-in user therefore always has exactly one `shop_id`,
  which is what the tenancy rule in `architecture-context.md` §8 scopes
  every query by.

---

### Google OAuth Login vs. Gmail Sending (important distinction)
 
"Continue with Google" (Better Auth login) and the Owner's Gmail
sending connection (§ Owner Gmail Connection, below) are two separate
authorization grants, even when the same Google account is used for
both:
 
- **Google OAuth Login** = "use Google to sign in to RepairTrack."
  Configured through Better Auth. Every role can use it.
- **Gmail API OAuth** = "allow RepairTrack to send email through my
  Gmail." A separate, narrower consent (`gmail.send` scope only),
  requested only from Settings, only by the OWNER.
Do not conflate the two flows or reuse one token for the other purpose.
 
---

## Staff Management (Sprint 1)
 
The Owner manages the shop's internal team from Settings → Staff
Management.
 
- Owner invites a new team member by name, email, and role
  (`STAFF` or `TECHNICIAN`).
- **Sprint 1 invitation delivery:** RepairTrack has no way to send
  email yet in Sprint 1 (Gmail connects in Sprint 3 — see below), so
  invitations are delivered as a **copyable invite link** that the
  Owner shares manually (e.g. WhatsApp, SMS, in person). The link
  contains a single-use, expiring invitation token.
- Once Sprint 3's Owner Gmail Connection is live, an invited-but-not-yet-
  connected Owner still gets the link flow; a connected Owner instead
  gets both the link and an automatic invitation email sent from their
  own Gmail address. The link never stops working — the email is an
  enhancement, not a replacement.
- Accepting an invitation lets the invitee set a password (or use
  Google OAuth) and creates their account with the invited role,
  scoped to the inviting Owner's shop. Invited accounts cannot self-
  select a role or shop.
- The Owner can view all staff with their role and status
  (`Active` / `Invited` / `Inactive`), deactivate or reactivate a
  staff member, and change a `STAFF` ↔ `TECHNICIAN` role assignment.
- Deactivated staff cannot sign in but their historical repair/invoice
  records are preserved (never hard-delete a staff account with
  existing repair history).
- Fine-grained, owner-configurable permission toggles (beyond the
  fixed role table in §6b) are explicitly out of scope for Sprint 1 —
  see §9 and Sprint 4 in `progress-tracker.md`.

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

## Owner Gmail Connection (Sprint 3)
 
Each shop's Owner may connect their own Gmail account so that customer
emails are sent from the shop's real identity, not a shared RepairTrack
address.
 
- Settings → Email & Notifications shows connection status
  (`Not Connected` / `Connected: <email>`) with Connect/Disconnect
  actions.
- Connecting opens a Google OAuth consent screen scoped to
  `gmail.send` only (see "Google OAuth Login vs. Gmail Sending" above).
  RepairTrack never requests full mailbox read access.
- Each shop's Gmail connection is independent — Shop A's owner
  connects `ownerA@gmail.com`, Shop B's owner connects
  `ownerB@gmail.com`. There is no shared/global sending account.
- `STAFF` can trigger a send action (e.g. "Send Ready for Pickup
  Email") but never sees or handles the Owner's Gmail credentials or
  tokens — the request is proxied through RepairTrack's server using
  the stored, encrypted OAuth token for that shop.
- If a shop's Owner has not connected Gmail, customer-facing email
  sending is simply unavailable for that shop; in-app notifications
  and the Sprint 1 invite-link flow are unaffected.
- Approved trigger events: repair needs approval, repair approved,
  ready for pickup, repair delayed. Repair received is optional. Do
  not add a new trigger event without approval — avoid emailing
  customers on every minor field change.
- Reusable, editable email templates: Repair Received, Repair Approval
  Required, Repair Approved, Repair Delayed, Ready for Pickup, Payment
  Receipt. The Owner can preview a template and send a test email to
  themselves before it goes live.

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
- Email & Notifications / Owner Gmail Connection (see above, Sprint 3)
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
- A shared/global RepairTrack-operated Gmail sending account — see
  "Owner Gmail Connection" above; every shop must use its own Owner's
  connected Gmail

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

These are NOT MVP requirements. Note that the base Gmail sending
capability itself is no longer "future" — it is approved and scheduled
for Sprint 3 as described above; only *additional* automated
communication beyond the fixed event list stays deferred.

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

Focus on the minimum usable repair-management product, **including**
the Owner → Staff/Technician invitation and permission foundation
(role-based, link-based invites) so that technician assignment and
role checks exist from day one rather than being retrofitted later.

## Sprint 2 — Core Operations

Expand repair, customer, device, inventory, and billing workflows.

## Sprint 3 — Business Intelligence

Add reports, in-app + email notifications (via each shop's own
connected Gmail account), improved operational workflows, and
polishing.
 

## Sprint 4 — Advanced / Production Readiness

Improve security, performance, granular/advanced permissions,
auditability (Activity/Audit Logs), accessibility, testing, and
commercial readiness.

The exact task status must always be tracked in:

progress-tracker.md