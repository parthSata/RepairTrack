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
- Create Repair
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
- Part Details
- Add/Edit Part

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

---

## Settings

- Profile
- Shop Settings
- Staff Management

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
navigation or header controls.

Do not add navigation items for non-existent features.

---

# 8. Responsive Design

The application must work across:

- Desktop
- Laptop
- Tablet
- Mobile

Do not simply shrink the desktop UI.

Important tables should have an appropriate mobile representation.

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
can be reused.

Primitives come from shadcn/ui in `src/components/ui`. Do not hand-write
a Button, Input, Dialog, or Table — compose from the existing set and
extend before forking.

List views (repairs, customers, inventory, invoices) use TableCraft.
Do not hand-roll pagination, sorting, or filtering.

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
