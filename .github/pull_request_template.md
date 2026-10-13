## What changed

<!-- Concise summary of the changes introduced in this pull request. -->

## Why

<!-- Context, motivation, or issue driving this change. -->

## How it was tested

<!-- Specific verification steps, automated tests, or manual screen checks performed. -->

- [ ] Automated tests: `bun test`
- [ ] Typecheck: `bun run typecheck`
- [ ] Lint: `bun run lint`
- [ ] Production build: `bun run build`

## Risk and rollback

- **Risk assessment:** <!-- Low / Medium / High and why -->
- **Rollback strategy:** <!-- Revert PR commit / migrations / feature toggle -->

---

## Quality & Definition of Done Checklist

- [ ] Server-side input validated with Zod
- [ ] Server-side role checked against the permission table (`project-overview.md` §6b)
- [ ] Every query scoped to `shop_id` (only exception: public tracking route)
- [ ] Loading, empty and error states exist for any data view
- [ ] Works at 375px wide (mobile responsive)
- [ ] Docs and progress tracker (`context/progress-tracker.md`) updated
- [ ] `bun run typecheck && bun run lint && bun run build` passes with zero errors
