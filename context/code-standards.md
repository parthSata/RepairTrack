# RepairTrack — Code Standards

Owns: how code is written. Stack and layer boundaries live in
`architecture-context.md`; screens and visuals live in `ui-context.md`.

# 1. General Principle

Code should be:

- Simple
- Readable
- Maintainable
- Reusable
- Type-safe
- Testable
- Secure

Do not over-engineer simple functionality. See §26.

---

# 2. Language

Use TypeScript. Avoid JavaScript files unless there is a specific reason.
Strict TypeScript configuration.

No `any`. No `@ts-ignore`. No `as` cast used to silence an error — fix
the type instead.

---

# 3. Runtime

Use Bun for installing packages, running development, running scripts,
and running tests.

Do not introduce alternative package-manager workflows.

---

# 4. Naming Conventions

## Files

Use kebab-case.

Examples:

repair-form.tsx
repair-table.tsx
repair-service.ts
use-repairs.ts

---

## Components

Use PascalCase.

Examples:

RepairForm
RepairTable
StatusBadge

---

## Functions

Use camelCase.

Examples:

createRepair()
updateRepair()
getCustomer()

---

## Variables

Use camelCase.

Examples:

repairId
customerName
repairStatus

---

## Constants

Use descriptive UPPER_SNAKE_CASE constants.

Example:

MAX_UPLOAD_SIZE

---

# 5. Components

Components should:

- Have a clear responsibility
- Be reusable where appropriate
- Avoid unnecessary complexity
- Avoid unnecessary state
- Avoid duplicate logic

Before creating a new component:

1. Search existing components.
2. Determine whether an existing component can be reused.
3. Extend an existing component if appropriate.
4. Create a new component only when necessary.

---

# 6. UI Components

Shared components belong in:

components/ui/

Feature-specific components belong in the relevant feature or
component domain.

Do not put all components into one large file.

---

# 7. Server Components

Use Next.js server components by default where appropriate.

Use client components only when required by:

- Interactivity
- Browser APIs
- Client-side state
- Event handlers
- Client-side libraries

Do not add `"use client"` unnecessarily. Push it to the smallest leaf
component that needs it.

---

# 8. State Management

- **Server data** (repairs, customers, invoices) → TanStack Query. Always.
- **UI state** (sidebar open, active modal, selected filters) → Zustand
  or `useState`.

Never copy server data into Zustand, and never re-fetch into
`useEffect` + `useState`. That is a cache bug waiting to happen.

Query keys: `['repairs', filters]`, `['repairs', id]`. Invalidate on
mutation success.

Zustand stores stay under roughly 50 lines.

Do not introduce Redux without explicit approval.

---

# 9. API Standards

API endpoints must:

- Validate input
- Authenticate protected requests
- Authorize actions
- Return consistent responses
- Handle errors safely
- Avoid leaking sensitive information

Handler shape and REST conventions are defined in
`architecture-context.md` §7.

---

# 10. Validation

Use Zod for all external input validation, via Hono's `zValidator`.
No unvalidated `c.req.json()`.

Validate:

- Request bodies
- Query parameters
- Route parameters
- Important form inputs

Never trust client-side validation alone.

---

# 11. Database

Use Drizzle ORM. Database changes go through migrations.

Do not directly modify production database structure manually.

Do not create tables without a corresponding product requirement.

Schema conventions and the `shop_id` scoping rule are defined in
`architecture-context.md` §8.

---

# 12. Business Logic

Business logic should not be duplicated across:

- Components
- API routes
- Server actions
- Services

Reusable business operations belong in the appropriate service module.

---

# 13. Authentication

Authentication must use Better Auth.

Google OAuth is the approved social authentication provider.

Do not implement a second authentication system.

Always verify authentication and authorization on protected operations.

Never trust UI-based permission checks alone.

---

# 14. Security

Never:

- Commit secrets
- Hardcode API keys
- Expose private credentials
- Store secrets in client-side code
- Trust user input
- Return unnecessary sensitive information

Secrets come from `.env` and are read only in server code. Add every
new key to `.env.example`. Only `NEXT_PUBLIC_*` may reach the browser.

---

# 15. File Uploads

User-uploaded files must be validated for:

- File type
- File size
- Upload authorization
- Storage destination

The presigned-upload flow is defined in `architecture-context.md` §10.

---

# 16. Error Handling

Errors should be:

- Predictable
- Safe
- Informative
- Consistent

In the API, throw `HTTPException` with a real status code; the shared
error middleware formats the response as
`{ error: { message, code } }`. Do not add per-route try/catch
boilerplate.

Do not expose database errors, stack traces, or secrets to end users.

---

# 17. Logging

Use meaningful server-side logging when necessary.

Do not log:

- Passwords
- Access tokens
- Session IDs
- OAuth secrets
- API keys
- R2 credentials
- Sensitive customer information

---

# 18. Performance

Avoid:

- Unnecessary database queries
- Unnecessary client components
- Excessive API calls
- Large client bundles
- Duplicate data fetching

Prefer efficient server-side operations where appropriate.

No `useMemo` / `useCallback` / `React.memo` without a measured problem.

---

# 19. Reusability

Before writing new functionality:

1. Search existing utilities.
2. Search existing components.
3. Search existing services.
4. Search existing hooks.
5. Reuse when appropriate.

Do not duplicate existing functionality.

---

# 20. Dependencies

Do not install a new dependency simply because it is convenient.

Before adding a dependency:

1. Check whether the project already has a solution.
2. Check whether native Next.js functionality can solve it.
3. Check whether an existing approved library can solve it.
4. Add a dependency only when justified — and ask first.

---

# 21. Comments

Write comments only when they explain important reasoning.

Do not write comments that simply repeat what the code does.

Prefer readable code over excessive comments.

Do not leave TODOs about future features.

---

# 22. Git-Friendly Changes

One feature per branch, named `feature/<name>`.

Keep changes focused. Do not mix:

- Feature development
- Unrelated refactoring
- UI redesign
- Dependency changes

in a single change unless required.

Do not modify files unrelated to the task.

---

# 23. Verification Before Done

Before considering implementation complete, run:

```bash
bun run typecheck && bun run lint && bun run build
```

and manually check the screen you touched. Report failures — do not
hide them.

Also confirm:

- No obvious console errors
- No broken imports
- No unnecessary dependencies
- No unrelated files modified

---

# 24. Technology Restrictions

The full excluded-technology list lives in `architecture-context.md` §2.
Do not introduce anything on it without explicit approval.

---

# 25. Keep It Simple

This is a junior-level portfolio project, not a platform. Bias to the
smallest thing that works.

- **Don't abstract until the third repetition.** Two similar bits of
  code stay duplicated.
- **No layers we didn't ask for**: no repository/DTO/mapper pattern over
  Drizzle, no generic `BaseService`, no dependency-injection container,
  no event bus, no barrel `index.ts` re-exports.
- **No caching, queues, workers, rate limiters, feature flags, or i18n**
  unless asked.
- **No tests** unless the task asks for them; when asked, test business
  logic in services, not UI.
- Don't refactor code you were not asked to change.
- If a task can be done in 50 lines or 300, do the 50.
