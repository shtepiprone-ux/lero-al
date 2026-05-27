# Lero.al — Project Intelligence

## Project Context
Real Estate Marketplace for the Albanian market.
Stack: Next.js (App Router), Supabase, Tailwind CSS, shadcn/ui.

## AI Operating Model (READ FIRST)

> ⚠️ **Git safety (single-writer): only the owner runs git, only from PowerShell.** The Cowork/Opus
> assistant must NEVER run mutating git on this repo — it edits files via the filesystem only.
> Two git processes on the same `.git` (Windows + Cowork's Linux sandbox on the `D:` network drive)
> corrupt `.git/index`. Recovery: `Remove-Item .git\index` → `git reset`. Full rule:
> `docs/orchestrator-role.md` → "Environment & git safety" and `docs/ai-behavior.md` → "Git Rules".

> ⚠️ **Commit hand-off (single-writer, READ EVERY SESSION — Task 264 rule, 2026-05-27): after
> EVERY completed task, the Sonnet executor MUST include a "Files Changed" table in the session
> log (one row per touched path + 1-line rationale). The Sonnet executor MUST NOT emit `git add`
> / `git commit` commands. The ORCHESTRATOR (Opus) reads the real diff, validates the table
> against it, and emits explicit-path commit commands during review. The owner runs ONLY the
> orchestrator's commands in PowerShell. The Sonnet executor NEVER runs git itself.** Format
> of the orchestrator's emitted commands:
> ```
> git add <file1> <file2> ...
> git commit -m "feat(TaskN): <short description>"
> ```
> Use `feat:` / `fix:` / `chore:` / `docs:` / `refactor:`, one logical change per commit, explicit
> paths only (NEVER `git add -A` / `git add -u` / wildcards — phantom-corruption mode on the
> Cowork sandbox sweeps unrelated files into the commit otherwise). If `git status` shows
> phantom mods, run `Remove-Item .git\index -ErrorAction SilentlyContinue; git reset` first.
> Full rule: `docs/agent-contract.md` clause 10 + `docs/orchestrator-role.md` →
> "Orchestrator-owned commit emission (Task 264)" + `docs/ai-behavior.md` → "Commit Rules" +
> "Canonical Task Template" acceptance criteria.

There are two AI layers, with different jobs:

- **Opus 4.7 = orchestrator / reviewer.** Plans (Epic → Sprint → Task), hands off a ready prompt
  for the executor **written to a kickoff file in `/tasks` (never pasted into chat — Sonnet reads
  the file directly)**, then reviews the **actual diff** (not the executor's report), and either
  approves or opens a follow-up task. **Does not write production code** — only reads it to verify.
  Full rules: `docs/orchestrator-role.md`.
- **Sonnet 4.6 = executor.** Writes the code per a literal, scoped prompt. Its rules live across
  `/docs/` (entry: `docs/ai-behavior.md`).

Every executor prompt carries a hard contract (no scope change, no self-invented architecture,
literal AC, updates `docs/backlog.md` + `docs/sessions/`), which the orchestrator verifies against
the diff — checking missing locales (`sq`/`en`/`uk`/`it`), breakpoints, and governance violations.
See `docs/orchestrator-role.md`.

## Tasks Directory

All task, epic, and sprint files MUST live inside `/tasks` (`/tasks/Epics/`, `/tasks/Sprints/`).
This applies to every AI session regardless of chat. Detailed placement, naming, and format rules:
see "Task File Location Rules" in `docs/ai-behavior.md`.

## Documentation Structure

All project rules are split into focused files inside `/docs/`.  
`Claude.md` is the entry point and high-level index. Detailed rules live in the files below.

- `docs/ai-behavior.md` — AI workflow, session behavior, update discipline, commit/deploy behavior, and general working process.
- `docs/analytics-rules.md` — analytics, event tracking, SEO rules, and conversion optimization requirements.
- `docs/architecture.md` — modular monolith architecture, module boundaries, file organization, state management, and system structure.
- `docs/backlog.md` — current progress, last session summary, and next immediate tasks.
- `docs/component-rules.md` — component-level coding rules, hardcode restrictions, design token usage, and reusable component standards.
- `docs/data-access-rules.md` — database access patterns, API rules, query conventions, pagination, and Supabase data access rules.
- `docs/dependencies.md` — dependency policy, package selection rules, and approved package ecosystem.
- `docs/domain-rules.md` — business/domain-specific rules for listings, marketplace behavior, roles, and core platform logic.
- `docs/env.md` — required environment variables, secret handling, and deployment configuration values.
- `docs/integrations.md` — external services setup and integration rules (Supabase, Cloudinary, Resend, Sentry, etc.).
- `docs/orchestrator-role.md` — **Opus 4.7 orchestrator/reviewer** operating model: plan→prompt→review-diff loop, Sonnet hard contract, review checklist (distinct from the Sonnet executor rules).
- `docs/qa-rules.md` — QA process, validation, error handling, pre-commit checks, and manual testing checklist.
- `docs/rls-rules.md` — Supabase RLS rules, permission boundaries, auth/session safety, and security constraints.
- `docs/ui-rules.md` — UI Gate (no hardcode + component-first + Combobox-only) + dom.ria.com reference.
- `docs/performance.md` — Core Web Vitals RUM layer: collector, reporter, budgets, logging, and analytics dispatch contract.
- `docs/state-authority.md` — State authority map: SSR vs client authority, optimistic state rules, realtime sync model, cache invalidation, router.refresh behavior, concurrent rendering safety.

## Documentation Update Rule

When changing project rules, always update the relevant file in `/docs/` instead of expanding `Claude.md`.
If a rule could fit multiple files, keep it in the most specific document and avoid duplicating it across `/docs/`. 
Use `Claude.md` only as the project index, context entry point, and navigation file.
