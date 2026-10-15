# Manual testing checklist

Use this checklist against the production build, not the development server.
Complete the setup and record the environment before checking items.

## Test setup

- [ ] Build and start the production server with `bun run build && bun run start`.
  **Expected:** The build completes successfully and Next.js serves the production
  application at the configured local URL without using `bun run dev`.
- [ ] Confirm the test database and required environment variables are configured.
  **Expected:** The application can authenticate, read/write test data, and does
  not use production customer data.
- [ ] Record the browser, viewport, test shop, and test accounts used.
  **Expected:** The test run can be reproduced without exposing credentials or
  tokens in screenshots or notes.

## OWNER flow

- [ ] Sign in as an OWNER and open the dashboard.
  **Expected:** The OWNER reaches the dashboard and sees OWNER-allowed navigation
  and business information.
- [ ] Create a customer, register a device, and create a repair ticket.
  **Expected:** Each record is saved and the new repair has a unique public ticket
  number and tracking link.
- [ ] Open repair details and review diagnosis, notes, technician assignment,
  status history, pricing, parts, payments, photos, and email activity.
  **Expected:** OWNER can view permitted repair information and sees clear loading,
  empty, and error states where applicable.
- [ ] Open Settings and review Shop Profile, Staff Management, and Email &
  Notifications.
  **Expected:** OWNER-only settings and management actions are available, while
  sensitive credentials and tokens are never displayed.

## STAFF flow

- [ ] Sign in as STAFF and repeat the permitted customer, device, repair, invoice,
  payment, and customer-email activity actions.
  **Expected:** STAFF can perform the actions allowed by the permission table and
  cannot access OWNER-only staff, shop, or Gmail connection management.
- [ ] Invite a STAFF or TECHNICIAN from Staff Management and copy the invite link.
  **Expected:** The invitation is created with the selected role, is single-use
  and expiring, and the link is copyable without exposing unrelated shop data.
- [ ] Attempt an OWNER-only action as STAFF.
  **Expected:** The server rejects the request with a safe authorization error,
  regardless of client-side controls.

## TECHNICIAN flow

- [ ] Sign in as TECHNICIAN and open the dashboard and repairs list.
  **Expected:** The technician sees only the dashboard and assigned repair work
  allowed for the role.
- [ ] Open an assigned repair, update diagnosis/notes/status, add an allowed part,
  and upload an internal photo.
  **Expected:** Allowed assigned-repair actions save successfully and the repair
  timeline updates.
- [ ] Attempt customer, device, invoice, payment, staff, and OWNER-only actions.
  **Expected:** The UI hides disallowed actions and the server rejects direct
  unauthorized requests safely.

## Customer tracking

- [ ] Open `/track` and submit a valid public ticket number with the matching
  customer phone number.
  **Expected:** The customer sees only the approved repair status, device, stage,
  cost, pickup, and payment information.
- [ ] Try a wrong phone number, malformed ticket number, and a ticket from another
  shop.
  **Expected:** The response is generic, does not reveal whether a ticket exists,
  and rate limits repeated verification attempts.
- [ ] Open a pending approval tracking link and approve or reject once.
  **Expected:** The decision is token-only, idempotent, updates the repair
  appropriately, and never exposes internal notes or staff information.

## Full repair lifecycle

- [ ] Move a repair through RECEIVED → DIAGNOSING → WAITING_FOR_APPROVAL →
  APPROVED → WAITING_FOR_PARTS → IN_REPAIR → QUALITY_CHECK →
  READY_FOR_PICKUP → COMPLETED.
  **Expected:** Each allowed transition is available to the permitted actor,
  status history records the change, and invalid or locked transitions are
  rejected with a clear message.
- [ ] Verify the approval, final bill, invoice, and payment gates during the
  lifecycle.
  **Expected:** Approval is required where configured, COMPLETED stays unavailable
  until the bill is finalized and paid in full, and an issued invoice locks
  bill-changing actions.
- [ ] Reopen a completed repair or restore a cancelled repair with a reason.
  **Expected:** OWNER/STAFF can use the explicit recovery action and the repair
  returns to DIAGNOSING with recorded history; other roles cannot recover it.

## Invoice print

- [ ] Generate an invoice from a finalized repair and open the invoice details.
  **Expected:** The invoice is a snapshot with the correct shop, customer, device,
  charges, parts, totals, payment state, and status.
- [ ] Use Print and choose the browser's Save as PDF flow.
  **Expected:** The print view is an A4-friendly invoice without dashboard
  navigation or action controls, and the suggested filename is meaningful.
- [ ] Cancel an issued invoice, re-finalize the bill, and generate a replacement.
  **Expected:** The cancelled invoice remains visible, its number is not reused,
  and the replacement receives a new invoice number.

## Payment with UPI QR

- [ ] Configure a shop UPI ID and open the payment action for a finalized repair
  with a balance due.
  **Expected:** The UPI QR and UPI link contain the correct payee, amount, currency,
  and ticket note.
- [ ] Scan or open the UPI link, then record the payment with a valid 12-digit UTR.
  **Expected:** The payment is recorded once, the balance becomes zero, and the
  repair can move to COMPLETED.
- [ ] Try an invalid or duplicate UTR and an over-balance payment.
  **Expected:** Validation or conflict feedback is shown and no duplicate or
  overpayment is recorded.

## Cloudinary photo upload

- [ ] On a repair, upload a real before photo and a real after photo through the
  Cloudinary flow, then replace and delete one photo.
  **Expected:** Uploads complete through Cloudinary, the repair stores the correct
  image references, replacement overwrites the intended slot, and deletion removes
  the remote asset/reference.
- [ ] View photos internally and on the public tracking page after the repair is
  READY_FOR_PICKUP or COMPLETED.
  **Expected:** Customer visibility follows the before/after, status, and hidden
  photo rules; files over 5 MB or unsupported types are rejected.

## Gmail test email

- [ ] Connect the OWNER's Gmail account from Settings → Email & Notifications.
  **Expected:** OAuth requests only the approved Gmail send and identity scopes,
  the connection status shows the connected address, and no token is shown.
- [ ] Send a real test email to the configured test address.
  **Expected:** The message arrives from the connected OWNER Gmail account and
  `email_logs` records the attempt without storing the HTML body or credentials.
- [ ] Revoke or disconnect the Gmail connection and attempt another send.
  **Expected:** The UI shows the reconnect/not-connected state, no platform sender
  fallback is used, and the action returns a safe actionable error.

## Responsive and state coverage

- [ ] Repeat representative dashboard, repair, invoice, payment, settings, and
  tracking checks at a 375px-wide viewport.
  **Expected:** Content remains readable and usable with no horizontal overflow or
  clipped controls.
- [ ] Check loading states for dashboard analytics, lists, repair details, invoice
  details, payments, photos, Gmail, and tracking.
  **Expected:** Skeletons, disabled controls, or progress indicators appear instead
  of blank content.
- [ ] Check empty states for new lists and no-photo/no-email/no-payment cases.
  **Expected:** Each empty state explains what is empty and what the user can do
  next.
- [ ] Simulate API, database, invalid-input, authorization, and unavailable
  integration errors.
  **Expected:** Errors are user-safe, actionable, consistently formatted, and do
  not expose stack traces, secrets, raw database errors, or customer-private data.
