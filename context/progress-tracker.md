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

- [ ] Configure Better Auth
- [ ] Configure Google OAuth
- [ ] Create login screen
- [ ] Create registration flow (creates shop + OWNER)
- [ ] Create protected routes
- [ ] Create logout
- [ ] Verify session handling

---

## 3b. Staff Management

- [ ] Create staff_invitations schema
- [ ] Staff Management screen (list staff/technicians, status)
- [ ] Add Staff / Add Technician form (name, email, role)
- [ ] Generate invite token + shareable link
- [ ] Invite acceptance flow (/invite/[token])
- [ ] Change staff role (Staff ↔ Technician)
- [ ] Deactivate / reactivate staff
- [ ] Remove staff
- [ ] Shop isolation verified (invited user always joins inviter's shop_id)

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

- [ ] Create dashboard screen
- [ ] Active repair count
- [ ] Ready-for-pickup count
- [ ] Pending approval count
- [ ] Pending payment count
- [ ] Recent repairs
- [ ] Basic repair status overview

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

- [ ] Repair list
- [ ] Repair search
- [ ] Repair filtering
- [ ] Create repair
- [ ] Generate public ticket number (10 random digits)
- [ ] Repair details
- [ ] Update repair status
- [ ] Assign technician
- [ ] Add diagnosis
- [ ] Add repair notes
- [ ] Repair status timeline
- [ ] Prompt to confirm device model when entering DIAGNOSING (if
      Unverified) — non-blocking, inline on repair details

---

## 9. Customer Tracking

- [ ] Public repair tracking route
- [ ] Repair status display
- [ ] Basic device information
- [ ] Current repair stage
- [ ] Ready-for-pickup status
- [ ] Protect private information

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

- [ ] Inventory list
- [ ] Add part
- [ ] Edit part
- [ ] Stock quantity
- [ ] Low-stock indication
- [ ] Parts used in repair

## Invoices

- [ ] Invoice list
- [ ] Create invoice
- [ ] Invoice details
- [ ] Repair charges
- [ ] Parts charges
- [ ] Discounts where required

## Payments

- [ ] Payment records
- [ ] Payment status
- [ ] Pending payments
- [ ] Payment history

## Repair Improvements

- [ ] Repair photos
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

- [ ] Gmail OAuth client setup (send scope, separate from login client)
- [ ] shop_email_connections schema (encrypted refresh token)
- [ ] Connect Gmail UI (Settings → Email & Notifications)
- [ ] Disconnect Gmail UI
- [ ] email.service.ts — event-triggered send logic
- [ ] Email templates: Repair Received, Approval Required, Approved,
      Delayed, Ready for Pickup, Staff Invitation
- [ ] Send Test Email action
- [ ] Reconnect-on-failure UI state
- [ ] Staff invitation flow upgraded to also send real email (Sprint 1
      link-only fallback stays as backup if disconnected)

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

- [ ] Unit tests
- [ ] Integration tests
- [ ] API tests
- [ ] End-to-end tests
- [ ] Authentication tests
- [ ] Permission tests

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

None currently.

---

# Current Task

No task currently assigned.

---

# Next Recommended Task

Initialize the project foundation.

---

# Change Log

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