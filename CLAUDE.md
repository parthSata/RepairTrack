@AGENTS.md

<!-- The @import above pulls in the full ruleset. Keep it — it works on every OS and survives
     git clone, unlike a symlink. Only Claude-specific behaviour belongs below. -->

## Claude Code specific

- Plan before multi-file changes; state the files you'll touch, then implement.
- Prefer Edit over Write on existing files. Never create a `*-v2.ts` or `*-new.tsx` alongside an original.
- Don't create README/summary markdown files unless asked.
