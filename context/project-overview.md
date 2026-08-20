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

Do not introduce email infrastructure unless it is explicitly
approved in a future requirement.

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
- Staff management
- Application preferences

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
- Automated customer communication
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

Focus on the minimum usable repair-management product.

## Sprint 2 — Core Operations

Expand repair, customer, device, inventory, and billing workflows.

## Sprint 3 — Business Intelligence

Add reports, notifications, improved operational workflows, and
polishing.

## Sprint 4 — Advanced / Production Readiness

Improve security, performance, permissions, auditability,
accessibility, testing, and commercial readiness.

The exact task status must always be tracked in:

progress-tracker.md
