# Codex startup rule

Before opening task files or making changes, read `.codex/RULES.md` and follow it.

# Every AI tool

The flow of writing and checking code is `.claude/rules/flow.md`, the gates are `.claude/rules/quality-gates.md` and the
review is `.claude/rules/secure-code-review.md`. The automatic checks run by hook only inside Claude Code: any other tool
that writes code runs `npm run lint`, `npm run typecheck`, `npm test` and `node scripts/quality/product-gates.mjs` before
it calls the change finished, and fixes what fails. CI runs the same checks and more on every PR.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
