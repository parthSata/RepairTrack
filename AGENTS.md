# AGENTS.md — RepairTrack

Repair-shop ticketing SaaS built with Next.js, TypeScript, Bun, Hono, PostgreSQL/Drizzle,
Better Auth, TanStack Query, Zustand, Tailwind/shadcn and Cloudflare R2.

This file owns **how to work**. It does not restate the rules — each topic has exactly one
owner below. Change a rule in its owning file, never here.

## Read these before writing code

| File | Owns | Read it when |
|---|---|---|
| [context/project-overview.md](context/project-overview.md) | Scope: modules, approved screens, statuses, sprints, exclusions | Always — before adding anything |
| [context/architecture-context.md](context/architecture-context.md) | Stack, folder layout, API/DB/auth/upload architecture, layer boundaries | Touching the API, database, auth or storage |
| [context/ui-context.md](context/ui-context.md) | Design language, approved screens, components, animation, states | Touching any screen or component |
| [context/code-standards.md](context/code-standards.md) | Naming, TypeScript, state, validation, security, verification, simplicity limits | Writing any code |
| [context/stack-standards.md](context/stack-standards.md) | Per-library conventions: Next.js, Hono, Drizzle, Zod, TanStack Query, Zustand, Better Auth, Tailwind/shadcn, R2, Bun, Prettier/ESLint | Using any of those libraries |
| [context/progress-tracker.md](context/progress-tracker.md) | What is done, current task, what's next | Starting and finishing a task |

@context/project-overview.md
@context/architecture-context.md
@context/ui-context.md
@context/code-standards.md
@context/stack-standards.md
@context/progress-tracker.md

## Workflow

1. **Understand first.** Read the owning context file for what you're about to touch. Don't start
   from a guess about how this project works.
2. **Check scope.** If the screen, endpoint, table or field isn't in `project-overview.md`, it does
   not exist yet. Ask before creating it — never invent one because other SaaS apps have it.
3. **Check the sprint.** `progress-tracker.md` names the current sprint. Do not build a later
   sprint's feature because it seems convenient; say it's out of sprint and ask.
4. **State the plan before writing code** for anything beyond a one-file change: the files you'll
   add or edit, the endpoints and tables involved, and anything you had to assume. Wait for a go
   if the task is ambiguous or spans more than about three files.
5. **Work in one branch per feature**, `feature/<name>`. Don't touch unrelated files.
6. **Implement the smallest version that works.** The simplicity limits in `code-standards.md` §25
   are binding, not advisory.
7. **Verify** using the checklist in `code-standards.md` §23 before calling anything done.
   Report failures — do not hide them.
8. **Update `progress-tracker.md`**: tick what you finished, set Current Task and Next, and add
   anything broken to Known Issues.

## Definition of done

A task is not done until all of these are true. Say which ones you skipped and why.

- [ ] Server-side input validated with Zod; server-side role checked against the permission table
      in `project-overview.md` §6b
- [ ] Every query scoped to `shop_id` (only exception: the public tracking route)
- [ ] Loading, empty and error states exist for any data view
- [ ] Works at 375px wide
- [ ] `bun run typecheck && bun run lint && bun run build` passes
- [ ] `progress-tracker.md` updated

## When unsure

Ask. If requirements conflict or are ambiguous, stop and say so — a wrong guess costs more than a
question. Do not silently pick an interpretation and build on it.

## Tool wiring

Every AI tool is pointed at this file rather than holding its own copy of the rules:

| Tool | Entry point it loads automatically | How it pulls in `context/` |
|---|---|---|
| Claude Code | `CLAUDE.md` → `@AGENTS.md` | `@context/…` imports below (Claude expands recursively) |
| Cursor (IDE + CLI) | `.cursor/rules/00-repairtrack.mdc` (`alwaysApply: true`) | `@context/…` listed in that rule — Cursor documents `@file` for `.mdc` only, not for AGENTS.md |
| Antigravity | `.agents/rules/repairtrack.md` (`always_on`) | `@../../context/…` listed in that rule (paths resolve relative to the rule file) |
| GitHub Copilot | `.github/copilot-instructions.md` → `@AGENTS.md` | `@context/…` imports below; Copilot follows references inside referenced files |

If you rename or move a file in `context/`, update the import lists in
`.cursor/rules/00-repairtrack.mdc` and `.agents/rules/repairtrack.md` — a broken import fails
silently, with the agent simply loading fewer rules than you expect.
