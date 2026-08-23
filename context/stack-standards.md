# RepairTrack — Stack Standards

Owns: library-specific conventions — how to use each technology correctly.

General practice (naming, TypeScript, security, simplicity) lives in
`code-standards.md`. Layer boundaries live in `architecture-context.md`.
This file does not repeat either; it only covers per-library idioms.

---

# 1. TypeScript

- `strict: true`. Also enable `noUncheckedIndexedAccess` and
  `noImplicitOverride`.
- Type inference over annotation. Don't annotate what TS already knows.
- Use `satisfies` to check an object against a type without widening it.
- `catch (e: unknown)` — narrow before use. Never `catch (e: any)`.
- Derive types from the source of truth instead of hand-writing them:
  `z.infer<typeof schema>` for payloads, `typeof table.$inferSelect` for
  rows. Do not maintain a parallel hand-written interface.
- Discriminated unions over optional-field soup for state that has modes.

---

# 2. Next.js (App Router)

- Server Component by default. `'use client'` goes on the smallest leaf
  that needs interactivity — never on a page just because one button has
  an `onClick`.
- **`params` and `searchParams` are Promises.** Always `await` them:
  ```ts
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  }
  ```
- Fetch independent data in parallel with `Promise.all`. Sequential
  `await`s are the most common App Router performance mistake.
- Mark server-only modules with the `server-only` package so an
  accidental client import fails at build time, not at runtime. This
  matters especially for `src/server/email/*` (Sprint 3) — a Gmail
  OAuth client must never end up in a client bundle.
- **Do not use Server Actions.** All mutations go through the Hono API
  (`architecture-context.md` §7) so there is one validated, role-checked
  entry point. A `features/<x>/actions.ts` file should not exist.
- Use `loading.tsx` / `error.tsx` per route segment, and `<Suspense>`
  around slow independent sections.
- `next/image` for all images, `next/link` for internal navigation.
- Never put a secret in a `NEXT_PUBLIC_` variable.

---

# 3. Hono

- One app instance; mount domain routers with `app.route('/repairs', repairsRouter)`.
- Middleware order matters: `logger → cors → auth → zValidator → handler`.
- Give `zValidator` an error hook so failures match the project error
  shape instead of dumping a raw `ZodError`:
  ```ts
  zValidator('json', createRepairSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } }, 400)
    }
  })
  ```
- Read validated input with `c.req.valid('json' | 'query' | 'param')` —
  it is already typed. Never re-parse with `c.req.json()`.
- Use Hono's built-in middleware (`cors`, `logger`, `secureHeaders`)
  rather than installing equivalents.
- Central `app.onError` maps thrown `HTTPException` to the standard error
  body; handlers just throw.
- We call the API with Axios, so do **not** add the `hc` RPC client — one
  client, per `architecture-context.md` §1.
- The Gmail OAuth callback route (`/api/settings/gmail/callback`,
  §14 in `architecture-context.md`) is still a normal Hono handler:
  validate the `state`/`code` query params with Zod, verify `state`
  matches the session before exchanging the code, then hand off to
  `gmail.service.ts`. Don't do the token exchange inline in the route.

---

# 4. Drizzle ORM

- Define `relations()` next to every table. The relational query API
  cannot resolve `with:` clauses without them.
- Prevent N+1 by fetching relations in one query:
  ```ts
  db.query.repairs.findMany({
    where: eq(repairs.shopId, shopId),
    with: { customer: true, device: true },
  })
  ```
  Never loop a query inside `.map()`.
- Select only the columns you need. Avoid `select()` with no argument on
  wide tables or list endpoints — this matters in particular for
  `gmail_connections`: never `select()` the whole row into a response;
  explicitly omit `refresh_token` from anything returned to the client.
- Wrap multi-write operations in `db.transaction()` — creating a repair
  plus its first status-history row is one transaction, not two writes.
  Accepting a staff invitation (create user + mark invitation accepted)
  is likewise one transaction.
- Use `.returning()` instead of a follow-up `SELECT` after insert/update.
- Migrations: `db:generate` then `db:migrate`. Never `push` outside a
  local throwaway database.
- Row types come from `$inferSelect` / `$inferInsert`.
- Name indexes explicitly (`repairs_shop_id_status_idx`,
  `staff_invitations_token_idx` (unique), `gmail_connections_shop_id_idx`
  (unique)).

---

# 5. Zod

- One schema per shape, in `features/<x>/schemas.ts`. The API and the
  form share it — never declare the shape twice.
- Derive the type: `type CreateRepairInput = z.infer<typeof createRepairSchema>`.
- Validate at the boundary only (request, form, env). Don't re-validate
  data already inside a service.
- `safeParse` when you intend to handle failure; `parse` when throwing is
  correct.
- Query-string numbers and booleans need `z.coerce.number()` /
  `z.coerce.boolean()`.
- Validate `process.env` once at startup into a typed config object —
  this now includes the Gmail OAuth client id/secret/redirect URI
  (Sprint 3), which must be distinct env vars from Better Auth's Google
  OAuth client id/secret (see `architecture-context.md` §5 note).

---

# 6. TanStack Query

- Keep a query-key factory per feature; no ad-hoc key strings:
  ```ts
  export const repairKeys = {
    all: ['repairs'] as const,
    list: (filters: RepairFilters) => [...repairKeys.all, 'list', filters] as const,
    detail: (id: string) => [...repairKeys.all, 'detail', id] as const,
  }
  ```
  Apply the same pattern to `staffKeys` (Sprint 1) and a single
  `gmailConnectionKey` (Sprint 3, no filters needed — one row per shop).
- Share config with `queryOptions()` so a query can be reused and
  prefetched with the same types.
- Set a deliberate `staleTime` (default 60s for lists). `staleTime`
  controls refetching; `gcTime` controls memory — they are not the same.
- After a mutation: `invalidateQueries` to re-sync from the server,
  `setQueryData` only when you already know the new value, `refetch` only
  for an explicit user-triggered reload.
- Never fetch in `useEffect`. Never mirror query data into `useState`.
- Handle `isPending` and `isError` on every consumer — see the required
  states in `ui-context.md` §15–17.

---

# 7. Zustand

- Always select narrowly: `useUiStore((s) => s.sidebarOpen)`. Never
  subscribe to the whole store.
- Selecting several values at once needs `useShallow`:
  ```ts
  const { sidebarOpen, toggleSidebar } = useUiStore(
    useShallow((s) => ({ sidebarOpen: s.sidebarOpen, toggleSidebar: s.toggleSidebar })),
  )
  ```
- Keep selectors trivial; do any derivation outside the selector so its
  output stays referentially stable.
- Actions live in the store next to the state they change.
- Split into slices only once a store genuinely outgrows one concern.
- No server data in Zustand (`code-standards.md` §8). This applies to
  the Gmail connection status too — it's server state, fetch it with
  TanStack Query, don't cache it in a store.

---

# 8. Better Auth

- Wire it with `drizzleAdapter`; let Better Auth own its own tables and
  do not hand-edit them.
- Read the session server-side with `auth.api.getSession({ headers })` in
  middleware, Server Components, and the Hono auth middleware.
- Session tokens stay in httpOnly cookies — the default. Never move a
  token into localStorage or a client store.
- Require verified email before granting access to shop data.
- Rate-limit the auth endpoints.
- `role` and `shopId` come from the server session on every request, never
  from the request body.
- **Do not extend Better Auth's own Google OAuth config to request
  `gmail.send`.** Login OAuth and Gmail-sending OAuth are separate
  client registrations in Google Cloud Console and separate code paths
  — see §14 (Gmail API) below and `architecture-context.md` §5.

---

# 9. Tailwind & shadcn/ui

- Merge classes with a `cn()` helper (`clsx` + `tailwind-merge`) so
  conditional and overriding classes resolve correctly.
- Design tokens as CSS variables in `globals.css`; reference them through
  Tailwind theme colours. No raw hex values in components.
- Avoid arbitrary values (`w-[437px]`) unless there is a real reason.
- Do not use `@apply` to build component classes — compose in JSX.
- shadcn components are **your** source, not a dependency: add them with
  the CLI, then edit the file in place. Don't wrap a component in another
  component just to change a class.
- Class order is handled by `prettier-plugin-tailwindcss` — don't sort by
  hand or argue with it.

---

# 10. Cloudflare R2

- Use the S3-compatible client (`@aws-sdk/client-s3` +
  `@aws-sdk/s3-request-presigner`).
- Object keys are structured and tenant-scoped:
  `shops/{shopId}/repairs/{repairId}/{uuid}.{ext}`.
- Presign uploads and downloads; the bucket stays private. Presigned URLs
  get a short expiry (15 minutes).
- Validate content-type and size server-side *before* signing
  (`architecture-context.md` §10).
- Delete the object when its database row is deleted.

---

# 11. Bun

- `bun install`, `bun run <script>`, `bunx <tool>`, `bun test`.
- Commit `bun.lock`; never edit it by hand.
- Bun is the package manager, script runner and test runner — not a
  second web server (`architecture-context.md` §1).

---

# 12. Formatting & Linting

Prettier owns formatting; ESLint owns correctness. They must not fight.

`.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

ESLint flat config extends `next/core-web-vitals`, `next/typescript`, and
**`eslint-config-prettier` last** so it can switch off stylistic rules
that conflict with Prettier.

Dev dependencies: `prettier`, `prettier-plugin-tailwindcss`,
`eslint-config-prettier`, `eslint-config-next`.

Rules:

- Do not add `eslint-plugin-prettier` (it makes formatting errors show up
  as lint errors and slows the run).
- Do not disable a lint rule inline to make a build pass — fix the cause,
  or raise it.
- Formatting is never a reason to touch lines unrelated to your change.

---

# 13. Commits

Conventional commits, one logical change each:

```text
feat(repairs): add status filter to repair list
fix(auth): reject session with missing shopId
chore(db): add index on repairs.status
feat(staff): add invitation accept flow
feat(notifications): send ready-for-pickup email via owner gmail
```

Do not commit commented-out code, debug logging, or `.env` files.

---

# 14. Gmail API (Owner Email Sending — Sprint 3)

- Libraries: `googleapis` (the Gmail client) + `google-auth-library`
  (`OAuth2Client` for the authorization-code exchange and refresh).
  These are the only approved email-related packages — see the
  exclusion list in `architecture-context.md` §2.
- Request the narrowest scope: `https://www.googleapis.com/auth/gmail.send`
  only. Never `gmail.modify` or `gmail.readonly`.
- OAuth2Client setup uses its own client id/secret/redirect URI (env
  vars distinct from Better Auth's), per §8 above.
- Store only the refresh token (encrypted) in `gmail_connections`; mint
  a short-lived access token per send via
  `oauth2Client.refreshAccessToken()` rather than persisting access
  tokens.
- Compose the outgoing message as a raw base64url-encoded MIME message
  and send with `gmail.users.messages.send({ userId: 'me', requestBody: { raw } })`.
- If a send fails because the refresh token was revoked (Google returns
  `invalid_grant`), mark that shop's `gmail_connections` row as
  disconnected and surface "reconnect Gmail" in Settings — don't retry
  silently in a loop.
- Never log the refresh token, access token, or raw message body long-
  term (`code-standards.md` §17 already forbids logging OAuth secrets;
  this is the concrete case it applies to).