# Lero.al — Project Intelligence

> # 🔴🔴 OWNER P0 — MEMORIZE, NEVER DROP (2026-06-03) 🔴🔴
> **MOBILE <640px = FULL WIDTH. ALWAYS. EVERYWHERE.** Every text Button, Tabs list, FilterBar control,
> Select/Combobox trigger, PhoneField, CTA, toolbar and action row MUST span the full available width below 640px.
> **AND: ALL POPUPS = FULL-WIDTH BOTTOM SHEET at <640, NO EXCEPTIONS** — Dialog, Sheet, Select, Combobox,
> DropdownMenu, NavigationMenu, Popover, Command (every Base-UI Popup/Positioner): bottom-anchored, edge-to-edge full
> width, rounded top corners only, slide-up, ≤90dvh internal scroll, top drag-handle bar, closes on backdrop tap + Esc.
> NOT centered cards, NOT mini-dropdowns on mobile.
> ≥44px touch targets, labels wrap (sq/en/uk/it), no clip, no horizontal scroll at 320. Only icon-only/compact
> controls (and non-UI map-marker popups → STOP&ASK) are exempt. The owner demanded this repeatedly and rejects work
> that ignores it.
> **Every task MUST enforce it; every review MUST verify it with rendered evidence at ALL breakpoints × ALL 4
> locales (uk@320/375/390 mandatory). tsc/build passing is NOT proof.** Full rule: `docs/agent-contract.md`
> clauses 11–12 + `docs/orchestrator-role.md` → "Mobile <640 full-width gate".

> ## 🛑🔴 ORCHESTRATOR SESSION-START GATE (Opus) — HARD BLOCK, NO EXCEPTION (owner P0, 2026-06-06, demanded repeatedly) 🔴🛑
> **THE OWNER HAS REJECTED THIS BEING SKIPPED EVERY SESSION. This is now a HARD GATE, not a reminder.**
> **Before reading the task, before ANY analysis, review, planning, tool call, or answer — the FIRST action of
> every orchestrator session MUST be to OPEN AND READ these files in full (via the Read tool, not from memory,
> not from a `git diff` fragment):**
> 1. **`docs/orchestrator-role.md`** (loop, review checklist, commit-emission rules).
> 2. **`docs/agent-contract.md`** (the 14 P0 clauses).
> 3. **`docs/backlog.md`** (current state). Never plan or review from memory.
> 4. **Pre-read per `docs/rule-index.md`** for the task type — not "read all docs".
>
> **MANDATORY SELF-ATTESTATION — the orchestrator's FIRST message of every session MUST begin with this exact line,
> filled in, BEFORE any other content:**
> ```
> ✅ Session-start gate: read orchestrator-role.md · agent-contract.md (clauses 1–14) · backlog.md (HEAD=<sha>) · rule-index pre-read for <task-type>.
> ```
> **If that attestation line is not the first thing emitted, the orchestrator has VIOLATED the gate. Any review,
> verdict, plan, or commit emission produced without it is INVALID and must be discarded and redone from the top —
> the owner will reject it on sight.** Reading the rules only AFTER starting work (as happened on Task 400 review,
> 2026-06-06) is the exact failure this gate exists to stop. NO EXCEPTION, NO "I already know the rules", NO
> "it's a quick task". Read first, attest first, THEN work.
>
> **Standing rules carried by every session (verify against the read, not memory):**
> - **Git = single-writer:** Opus NEVER runs mutating git (`add/commit/push/reset/...`); only the owner, in PowerShell. Opus emits explicit-path commit commands AFTER diff review.
> - **Every kickoff → a FILE in `/tasks`** (never only chat), with **both** Positive & Negative flows; on return, **review the real `git diff`, not the report**.
> - **Opus does not write product code** (`src/`, `app/`, `components/`, `modules/`, migrations, locales) unless the owner explicitly instructs it. Implementation is Sonnet's job.
> - **Integrity re-runs are a SCREEN, not a verdict** (agent-contract clause 14): the Cowork sandbox mount can serve stale/fluctuating reads; the authoritative integrity check is native (owner PowerShell) or CI.
> - **🔴 BACKLOG TIDY = MANDATORY AFTER EVERY TASK VERIFY/CLOSE (owner P0, 2026-06-12, demanded repeatedly — STOP forgetting this).** The MOMENT you finish verifying/reviewing/closing a task, immediately tidy `docs/backlog.md` in the same turn: **(1)** `## Last Session` holds ONLY the newest session (2–4 lines); **(2)** move every older session entry to ONE row at the TOP of [`docs/backlog-archive.md`](docs/backlog-archive.md) (newest first); **(3)** keep `docs/backlog.md` under ~80 lines of active content. This is not optional and not "later" — it is part of closing the task. Full rule: `docs/ai-behavior.md` → "Backlog & Session Log Rules".
>
> Detail lives in `docs/orchestrator-role.md` — this block is the unmissable, MANDATORY trigger.

## Project Context
Real Estate Marketplace for the Albanian market.
Stack: Next.js (App Router), Supabase, Tailwind CSS, shadcn/ui.

## AI Operating Model (READ FIRST)

> ⚠️ **Git safety (single-writer): only the owner runs git, only from PowerShell.** The Cowork/Opus
> assistant must NEVER run mutating git on this repo — it edits files via the filesystem only.
> Two git processes on the same `.git` (Windows git + Cowork's Linux sandbox mounting the same
> repo) corrupt `.git/index`. Recovery: `Remove-Item .git\index` → `git reset`. Full rule:
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

- **Opus 4.8 = orchestrator / reviewer.** Plans (Epic → Sprint → Task), hands off a ready prompt
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
- `docs/backlog.md` — ACTIVE state only: current progress, last session summary, next immediate tasks (~80-line cap).
- `docs/backlog-archive.md` — historical ledger of completed tasks/sprints/epics (split out of backlog.md 2026-06-03).
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
