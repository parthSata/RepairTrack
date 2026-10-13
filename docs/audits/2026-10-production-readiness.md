# RepairTrack Bugs and Issues

This document records the evidence-backed issues identified during the
production-readiness audit. The audit was read-only: no application files,
dependencies, migrations, environment variables, or database records were
modified.

## Priority summary

| Priority | Area | Issue |
|---|---|---|
| P0 | Authentication / authorization | Client-controlled `role`, `shopId`, and `status` during registration |
| P1 | Session security | Deactivated users can continue using existing sessions |
| P1 | Public tracking security | Phone verification accepts partial suffixes |
| P2 | Privacy | Unauthenticated email status endpoint enables account enumeration |
| P2 | API validation | Many resource IDs are not validated before database queries |
| P2 | Rate limiting | In-memory and proxy-header-dependent limiter is not production-safe across instances |
| P2 | Testing | `bun test` discovers no automated test files |
| P3 | Code quality | Lint completes with seven warnings |

---

## P0 — Client-controlled registration privileges

**Area:** Authentication, authorization, tenant isolation

**Evidence:**

- [`src/server/auth/index.ts`](./src/server/auth/index.ts), `user.additionalFields`
  defines `role`, `status`, and `shopId` without `input: false`.
- The `user.create.before` hook reads `user.shopId` and accepts it as the
  new user's shop.
- The same hook preserves `user.role` and other user-provided values.
- Better Auth registration is exposed through the application auth route.

**Problem:**

An unauthenticated registration request can submit `role`, `shopId`, or
`status`. The server may then create an account as `OWNER`, `STAFF`, or
`TECHNICIAN`, attach it to an existing shop, or set its account status,
bypassing the invitation workflow and tenant boundary.

**Reproduction:**

Send an unauthenticated request to:

```text
POST /api/auth/sign-up/email
```

with a body containing valid registration fields plus:

```json
{
  "role": "OWNER",
  "shopId": "<target-shop-id>",
  "status": "ACTIVE"
}
```

Inspect the created user and shop records.

**Smallest fix:**

Mark security-sensitive Better Auth fields as non-client-input fields:

```ts
role: { type: 'string', required: false, defaultValue: 'OWNER', input: false },
status: { type: 'string', required: false, defaultValue: 'ACTIVE', input: false },
shopId: { type: 'string', required: false, input: false },
```

Assign these values only through trusted server-side registration and
invitation flows. Normal registration must create a new shop and an OWNER.

**Verification:**

- Direct registration cannot select a role or existing shop.
- Normal registration always creates a new shop and OWNER.
- Staff invitation acceptance still creates the invited role in the invited
  shop.
- No user can attach to another shop by changing request JSON.

---

## P1 — Deactivated users retain active sessions

**Area:** Authentication, session authorization

**Evidence:**

- [`src/server/auth/index.ts`](./src/server/auth/index.ts) checks inactive
  status while creating a session.
- [`src/server/hono/session.ts`](./src/server/hono/session.ts) uses the
  existing session in `requireRole()` but does not consistently verify the
  current database account status.

**Problem:**

A staff member can log in, retain a valid session cookie, then be
deactivated. Existing protected requests may continue to succeed until the
session expires. Deactivation therefore does not immediately revoke access.

**Reproduction:**

1. Log in as a STAFF user and retain the session cookie.
2. Deactivate that user from an OWNER session.
3. Use the original cookie to call a protected endpoint.
4. Observe that the request may still be authorized.

**Smallest fix:**

Enforce the current user status in the shared protected-request authorization
helper, or revoke/invalidate all sessions when deactivation occurs. Apply the
same rule consistently to every protected API route.

**Verification:**

After deactivation, the old session must immediately receive `401` or `403`
responses from protected endpoints.

---

## P1 — Partial phone verification on public tracking

**Area:** Public tracking, authentication factor validation

**Evidence:**

- [`src/server/lib/tokens.ts`](./src/server/lib/tokens.ts), `phonesMatch()`
  accepts suffix relationships between normalized phone values.
- [`src/server/hono/routes/track.ts`](./src/server/hono/routes/track.ts)
  uses this comparison for public tracking verification.

**Problem:**

The public tracking flow requires a ticket identifier and phone number, but a
short matching suffix can satisfy the phone factor. This weakens the
intended two-factor lookup and increases the chance of unauthorized repair
information disclosure.

**Reproduction:**

Submit a valid ticket identifier with only a matching seven-digit or other
suffix of the customer's full normalized phone number.

**Smallest fix:**

Normalize both phone values and require exact equality. Support only the
intended country-code formatting variations; do not accept arbitrary suffixes.

**Verification:**

- Exact normalized phone: accepted.
- Equivalent country-code formatting: accepted if intentionally supported.
- Short suffix: rejected.
- Mismatched phone: rejected.

---

## P2 — Email account enumeration

**Area:** Privacy, authentication

**Evidence:**

- [`src/server/hono/routes/email-check.ts`](./src/server/hono/routes/email-check.ts)
  exposes an unauthenticated user-status endpoint.

**Problem:**

The endpoint returns distinguishable results for registered and unregistered
email addresses, including verification state. An attacker can enumerate
RepairTrack accounts and identify which addresses have verified accounts.

**Reproduction:**

Query the endpoint with:

1. A known registered email.
2. A random unregistered email.

Compare the HTTP status, response body, or returned fields.

**Smallest fix:**

Remove the endpoint if it is not required. Otherwise, return the same generic
response and status for both cases and do not expose `emailVerified`.

**Verification:**

Registered and unregistered addresses must produce identical externally
observable responses.

---

## P2 — Missing route-parameter validation

**Area:** API validation and error handling

**Evidence:**

- [`src/server/hono/routes/customers.ts`](./src/server/hono/routes/customers.ts)
  reads `c.req.param('id')` directly.
- [`src/server/hono/routes/devices.ts`](./src/server/hono/routes/devices.ts)
  reads resource IDs directly.
- [`src/server/hono/routes/inventory.ts`](./src/server/hono/routes/inventory.ts)
  reads resource IDs directly.
- Similar direct parameter reads remain in repair and staff routes.
- [`src/lib/validation.ts`](./src/lib/validation.ts) provides a shared
  parameter schema, but it is not used consistently.

**Problem:**

Malformed identifiers can reach database queries. For UUID-backed records,
invalid values may result in database errors and generic `500` responses
instead of a predictable `400 VALIDATION_ERROR`.

**Reproduction:**

Request resource endpoints with malformed identifiers, for example:

```text
GET /api/customers/not-a-uuid
GET /api/devices/not-a-uuid
GET /api/inventory/not-a-uuid
```

**Smallest fix:**

Apply shared Zod parameter validation to every UUID-backed route. Use a UUID
schema where the underlying identifier is a UUID, and pass only the validated
value to services.

**Verification:**

- Malformed ID: `400 VALIDATION_ERROR`.
- Valid but missing ID: `404`.
- Existing record from another shop: `404` or the repository-standard
  tenant-safe response.

---

## P2 — Production rate-limiting limitations

**Area:** Abuse prevention, deployment security

**Evidence:**

- [`src/server/hono/middleware/rate-limit.ts`](./src/server/hono/middleware/rate-limit.ts)
  stores counters in process memory.
- The limiter primarily derives client identity from forwarded IP headers.
- Public tracking routes use this limiter in
  [`src/server/hono/routes/track.ts`](./src/server/hono/routes/track.ts).

**Problem:**

In a multi-instance deployment, each process has an independent counter, so
the aggregate limit can be bypassed by distributing requests across instances.
If the hosting proxy does not sanitize forwarded headers, clients may also
spoof their apparent IP address.

**Reproduction:**

Send repeated public tracking requests through multiple application instances,
or vary `x-forwarded-for` values where the deployment does not overwrite them.

**Smallest fix:**

Use a shared rate-limit store or platform/edge rate limiting for public
tracking and authentication-sensitive endpoints. Trust forwarded headers only
from a configured, sanitizing proxy.

**Verification:**

Load-test through multiple instances and confirm that changing forwarded
headers or connections does not bypass the aggregate limit.

---

## P2 — No recognized automated test suite

**Area:** Testing and release confidence

**Evidence:**

- [`package.json`](./package.json) contains standalone verification scripts,
  but no standard test command with recognized test files.
- `bun test` reported that no Bun test files were found.

**Problem:**

The normal test command does not automatically exercise authentication,
tenant isolation, public tracking, payments, invoices, or stock concurrency.
Future changes can therefore regress critical workflows without the default
verification command detecting them.

**Smallest fix:**

Add a non-destructive test entry point that runs the supported verification
suite, or convert the highest-risk verification scripts into recognized test
files. Use an isolated test database or tenant.

**Verification:**

CI must discover and execute tests for authentication, authorization,
tenant isolation, public tracking, payment recording, invoice creation, and
stock concurrency.

---

## P3 — Lint warnings

**Area:** Code quality and maintainability

**Evidence:**

`bun run lint` completed without errors but emitted seven warnings, including:

- Unused `migrationUrl` in
  [`scripts/check-migration-url.ts`](./scripts/check-migration-url.ts).
- Unused `actionLabel` in
  [`src/server/services/repair.service.ts`](./src/server/services/repair.service.ts).
- React Compiler compatibility warnings for React Hook Form `watch()` usage.
- A React Compiler compatibility warning for TanStack Table
  `useReactTable()`.

**Problem:**

Warnings do not currently block the build, but unused values can hide
incorrect or incomplete logic, and compiler warnings should be consciously
accepted or resolved before production submission.

**Smallest fix:**

Remove unused values and either address the React Compiler warnings or
document the intentional compatibility decision in the build configuration.

**Verification:**

Run `bun run lint` and confirm a warning-free result, or establish and enforce
an explicit warning budget.

---

## Verification performed during the audit

| Command | Result |
|---|---|
| `bun run typecheck` | Passed |
| `bun run lint` | Passed with seven warnings and no errors |
| `bun run build` | Passed; production build completed successfully |
| `bun test` | No recognized test files found |

Database-backed verification scripts, browser checks, and Gmail OAuth
delivery tests were not run because they require an isolated database,
configured external credentials, or manual UI execution.

