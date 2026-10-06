# RepairTrack — UI Context

# 1. UI Vision

RepairTrack should have a:

- Professional
- Modern
- Premium
- Clean
- Trustworthy
- Commercial
- SaaS-oriented

visual identity.

The interface should look like a real commercial product rather than
a generic developer dashboard.

---

# 2. Design Philosophy

The UI should prioritize:

1. Clarity
2. Usability
3. Information hierarchy
4. Consistency
5. Speed
6. Accessibility
7. Professional appearance

Visual effects should support the user experience rather than
distract from it.

---

# 3. Visual Direction

The design should be:

- Modern
- Minimal but expressive
- Spacious
- Structured
- Professional
- Data-focused

Avoid making every component visually complex.

---

# 4. Avoid

Do NOT use excessive:

- Gradients
- Glassmorphism
- Neon effects
- Blur effects
- Floating decorations
- 3D effects
- Large decorative illustrations
- Excessive shadows
- Excessive animations

Do not copy visual trends simply because they are popular.

---

# 5. Approved Application Screens

## Authentication

- Login
- Register
- Forgot Password
- Authentication states

Google OAuth should be available where appropriate.

---

## Staff Invitation (Sprint 1)

- Public "Accept Invitation" screen (`/invite/[token]`) — shows the
  inviting shop's name, invited role, and a form to set a password or
  continue with Google OAuth. Same visual language as Login/Register,
  not a separate design system.

---

## Dashboard

- Dashboard

Dashboard should provide:

- Active repair count
- Ready for pickup
- Pending approval
- Pending payment
- Revenue overview
- Repair status overview
- Recent repairs

---

## Repairs

- Repair List
- Create Repair — the "Repair Ticket Created" success screen shows a
  persistent (not dismissible) `GmailStatusWarning` between the ticket
  summary and the actions while Gmail is Not connected / Reconnect
  needed: "Gmail isn't connected — Email notifications are unavailable."
  OWNER gets a Connect (Reconnect) Gmail button to
  `/settings/email?from=repair`, which highlights the Gmail card; STAFF
  see "Ask the shop owner to connect Gmail". Hidden while loading or on error
- Repair Details
- Edit Repair

---

## Customers

- Customer List
- Create Customer
- Customer Details

---

## Devices

- Device List
- Device Details

---

## Inventory

- Inventory List
- Part Details (Stock History)
- Add Part / Manage Part (Details + Stock tabs)

---

## Invoices

- Invoice List
- Invoice Details
- Create/Edit Invoice

---

## Payments

- Payment List
- Payment Details where required

---

## Notifications

- Notification Center

---

## Reports

- Reports Dashboard
- Technician Performance (Owner-only view)

---

## Settings

- Profile
- Shop Settings
- Staff Management — list (name, role, status: Active/Invited/Inactive),
  Add Staff form (name, email, role picker), copyable invite link,
  deactivate/reactivate, role change. When Gmail isn't connected, Add
  Staff opens on the Connect Gmail prompt (Connect Gmail / Continue with
  link only) before the form
- Email & Notifications (`/settings/email`, reached through the
  Settings tabs `SettingsTabs` next to Shop Profile — no sidebar item) — Gmail connection status
  Badge (Not connected / Connected: `owner@email.com` / Reconnect
  needed), Connect (Reconnect) / Disconnect (with confirm) / "Send test
  email" actions, email template preview (Sprint 3; OWNER-only screen —
  do not show Connect/Disconnect to STAFF or TECHNICIAN). The Connect
  button is the shared `ConnectGmailButton`. Add Staff skips the
  Connect Gmail prompt once Gmail is connected

---

## Customer Tracking

- Repair Tracking Page
- Repair Status
- Basic repair information

---

# 6. Screen Creation Rule

Do not create a new screen unless:

1. It exists in an approved product requirement, OR
2. It is directly necessary to complete an approved workflow.

Do not create screens simply because similar SaaS products have them.

Examples of screens that must NOT be invented:

- Community
- Blog
- Marketing
- Social Feed
- Warranty
- Marketplace
- HR
- Payroll
- Subscription Management
- A granular per-checkbox permission editor for Owner use in Sprint 1
  (that belongs to Sprint 4 — see `progress-tracker.md`)

unless explicitly added to the product requirements.

---

# 7. Navigation

Navigation should contain only approved modules.

Primary navigation should be focused on:

- Dashboard
- Repairs
- Customers
- Devices
- Inventory
- Invoices
- Payments
- Reports

Notifications and Settings can use appropriate secondary
navigation or header controls. Staff Management and Email &
Notifications live inside Settings, not as top-level nav items.

Do not add navigation items for non-existent features.

---

# 8. Responsive Design

The application must work across:

- Desktop
- Laptop
- Tablet
- Mobile

Do not simply shrink the desktop UI.

Important tables should have an appropriate mobile representation
(this includes the Staff Management list).

Every screen must work down to 375px wide.

---

# 9. Component Design

Use reusable UI components.

Examples:

- Button
- Input
- Select
- Dialog
- Drawer
- Table
- Card
- Badge
- Tabs
- Dropdown
- Tooltip
- Alert
- Toast
- Skeleton
- Empty State

Before creating a new component, check whether an existing component
can be reused. The Staff status indicator (Active/Invited/Inactive)
and the Gmail connection status indicator should both reuse the
existing Badge component — do not invent a second badge style for
either.

`ConnectGmailPrompt` (`src/components/email/connect-gmail-prompt.tsx`)
is the single "connect your Gmail" prompt. Every action that would send
a shop email (staff invite, repair updates, invoice generated, payment
received) shows it first when the shop's Gmail isn't connected — reuse
it with a feature-specific description and continue action; do not
build a second prompt.

Primitives come from shadcn/ui in `src/components/ui`. Do not hand-write
a Button, Input, Dialog, or Table — compose from the existing set and
extend before forking.

List views (repairs, customers, inventory, invoices, staff) use
TableCraft. Do not hand-roll pagination, sorting, or filtering.

Forms use react-hook-form with the feature's Zod schema via
`zodResolver`, and show field-level errors.

Styling is Tailwind utilities only — no inline `style` attributes and no
new CSS files beyond `globals.css`.

---

# 10. Design Consistency

Maintain consistent:

- Typography
- Font sizes
- Spacing
- Border radius
- Shadows
- Colors
- Icon sizes
- Button styles
- Form styles
- Table styles
- Status indicators

Do not create a unique design for every page.

---

# 11. Repair Status Visualization

RepairTrack should have a recognizable repair-status experience.

The repair lifecycle can be visualized as:

Received
  ↓
Diagnosing
  ↓
Approval
  ↓
Repair
  ↓
Quality Check
  ↓
Ready for Pickup
  ↓
Completed

The visualization should make the current state immediately
understandable.

---

# 11b. Customer-Facing Status Labels (Public Tracking)

Public repair tracking maps internal repair statuses to customer-safe
labels. Use this dictionary for the tracking page, progress indicator,
and repair updates list — do not invent alternate labels in components.

| Internal status | Customer-facing label |
|---|---|
| RECEIVED | Received |
| DIAGNOSING | Diagnosing |
| WAITING_FOR_APPROVAL | Repairing |
| APPROVED | Repairing |
| WAITING_FOR_PARTS | Repairing |
| IN_REPAIR | Repairing |
| QUALITY_CHECK | Repairing |
| READY_FOR_PICKUP | Ready for Pickup |
| COMPLETED | Delivered |
| CANCELLED | Standalone cancelled message (not on progress bar) |

Progress indicator stages (in order): Received → Diagnosing → Repairing
→ Ready for Pickup → Delivered.

`CANCELLED` replaces the entire progress indicator with a single
cancelled message.

Implementation source: `src/features/tracking/status-labels.ts`.

## Public Tracking Payment Payload & UI

The public tracking payload includes an optional read-only `payment` block:
`{ billTotal, totalPaid, balance, status, isFinalized?, upiId?, payeeName? }` (amounts in integer paise).

- **Inclusion rule**: Included only after the bill is finalized (`finalTotal != null`) and the repair is not `CANCELLED`. Before the bill is finalized, the payment block is omitted and the Payment card is not rendered on the tracking page.
- **UPI rule**: `upiId` and `payeeName` (shop UPI payee name falling back to shop name) are included when `balance > 0` and the shop has configured a `upi_id`.
- **Privacy & safety**: No individual payment records, references, staff names, or notes are returned.
- **UI Presentation (`TrackPaymentCard`)**:
  - Appears only once the bill is finalized.
  - Displays Paid, Balance due (`Math.max(balance, 0)`), and `PaymentStatusBadge` (`UNPAID`, `PARTIAL`, `PAID`).
  - When `balance > 0` and `upiId` is configured, reuses `UpiPayCard` for QR display and UPI ID copy.
  - When `status === 'PAID'`, displays "Paid in full".
  - Displays a "Pay with UPI app" button (`<a href={upiLink}>`) only on mobile viewports (`sm:hidden`).
  - Fully responsive across mobile (375px+), tablet, and desktop with zero horizontal overflow.

---

# 12. Animation Principles

Animation is an important part of the product's visual identity.

However:

Animation MUST have a purpose.

Good uses:

- Page transitions
- Modal transitions
- Hover feedback
- Button feedback
- Loading states
- Status changes
- Repair timeline progression
- Success states
- Empty-state transitions
- Navigation transitions

Avoid:

- Constant movement
- Excessive parallax
- Animating every card
- Distracting backgrounds
- Long animations
- Animation that slows down workflows

---

# 13. Animation Rules

Animations should generally be:

- Short
- Smooth
- Consistent
- Purposeful
- Interruptible where appropriate

Use consistent easing and duration throughout the product: 150–250ms
for interface transitions.

Do not create a different animation language for each page.

---

# 14. Accessibility

The UI must consider:

- Keyboard navigation
- Focus states
- Color contrast
- Screen-reader semantics
- Reduced motion
- Form accessibility
- Error messages

Important information must never depend only on animation or color.

---

# 15. Loading States

Every important asynchronous interface should have an appropriate
loading state.

Use:

- Skeletons
- Spinners where appropriate
- Disabled states
- Progress indicators

Avoid blank screens while data is loading.

---

# 16. Empty States

Empty states should explain:

- What is empty
- Why it may be empty
- What the user can do next

Example:

"No repairs yet"

"Create your first repair ticket to start tracking your repair
operations."

---

# 17. Error States

Errors should:

- Be understandable
- Explain what happened
- Provide an appropriate next action
- Avoid exposing technical details unnecessarily

---

# 18. Commercial Product Principle

Every screen should feel like part of one coherent commercial
product.

Do not optimize for visual novelty at the cost of usability.

The UI should be impressive during a portfolio demonstration while
remaining practical for real repair-shop employees.