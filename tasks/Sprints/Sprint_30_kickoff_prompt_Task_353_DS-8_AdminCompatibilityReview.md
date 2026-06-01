# Sprint 30 — Task 353 kickoff (Sonnet) — DS-8: Admin compatibility review + migration-planning closure (AUDIT ONLY — ZERO product code)

> **Status: QUEUED — AUDIT/DOCS ONLY, ZERO product code.** Runs only AFTER DS-6 + DS-7 (Tasks 351/352) have
> shipped, been reviewed, and been **owner-approved + committed** — DS-8 reconciles the public + cabinet/auth
> migration learnings with the admin layer and produces the remaining migration plan. Do not start until the
> orchestrator confirms DS-6 + DS-7 are done.
> **This task writes NO `src/` code.** It is the one DS phase allowed to span public + cabinet/auth + admin —
> *because its scope is purely docs/audit and zero code* (Task 344 rule 10).
>
> **You are Sonnet 4.6 executor.** Produce the audit/plan per the literal acceptance criteria below. Do NOT
> change scope. Do NOT write product code. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit`. End your session with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) emits commit commands during review.

```
Type:     audit / governance / migration-planning closure (ZERO product code)
Priority: high
Area:     design-system / governance / admin compatibility / migration planning
Phase:    DS-8 of the design-system foundation queue — final foundation-phase closure
          (see docs/sessions/2026-06-01-task-344-design-system-implementation-path.md §6 and
           docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md)

Area (ALLOWED to touch — DOCS ONLY):
          docs/design-system.md                       (UPDATE — §16 status snapshot; record admin compatibility verdict; remaining-migration plan)
          docs/component-catalog.md                    (UPDATE — reconcile catalog vs actual primitive inventory; flag local-invention findings)
          docs/responsive-audit.md / docs/ui-audit.md  (UPDATE/APPEND — audit findings, IF these are the canonical audit docs; confirm first)
          docs/backlog.md                              (UPDATE — Last Session block, 2–4 lines + remaining-migration follow-up references)
          docs/sessions/2026-06-01-task-353-ds8-admin-compat-and-migration-closure.md (NEW — the audit report + plan + Files Changed table)
          tasks/Sprints/ or tasks/Epics/               (NEW — proposed follow-up migration task STUBS only, marked OWNER REVIEW REQUIRED; NO executable code scope)

Area (FORBIDDEN to touch):
          src/** (ANY product code — primitives, routes, admin, ui, shared, modules — READ ONLY)
          src/components/admin/**                      (Sprint 28 admin primitives — READ for compatibility; do NOT edit; do NOT commit any old rejected Task 306-Fix patch)
          src/app/globals.css
          messages/*.json  ·  DB / Supabase / SQL / migrations / server actions / business logic
          .storybook/**
```

## Role contract

You are **Sonnet 4.6, the executor**, in **audit/planning mode only**. You inspect the codebase READ-ONLY and
produce documentation + planning stubs. You write **zero product code**, edit **zero `src/`**, and emit **no
git commands**. You explicitly must NOT commit, re-apply, or revive any frozen/rejected Sprint 28 patch (Task
306 / 306-Fix / 308 / 309). Outside-allowlist (anything in `src/`, `messages/`, SQL, etc.) = scope violation =
STOP & ASK. Opus reviews the docs diff and emits git commands.

## Pre-read (load ONLY these)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` — **§4 (containers — note `.container-wide` public vs `.container-admin` admin: admin must NOT use the public PageShell), §7 (Tier ownership — admin specialisations AdminPageShell/AdminTable/AdminCardList are SEPARATE from the public layout primitives), §16.B/§16.C (public + admin snapshots), §18 (phased migration), §19–§21.**
2. `docs/admin-ux-rules.md`, `docs/component-catalog.md`, `docs/component-catalog-governance.md`, `docs/component-governance.md`, `docs/governance-enforcement.md` — to audit against the canonical governance.
3. `docs/responsive-governance.md`, `docs/responsive-audit.md`, `docs/ui-audit.md` — existing audit format.
4. **Frozen-state context (CRITICAL):** `docs/backlog.md` "Sprint 28 FROZEN" block + the Sprint 28 session logs (Task 306 / 306-Fix / 327 / 328 / 308 / 309). You must reconcile your admin findings WITH this freeze and must NOT propose committing the rejected patches.
5. DS-1..DS-7 session logs (the full foundation + the two pilots) — your audit baseline.

## Problem

After DS-1..DS-7, the public + cabinet/auth layers have new canonical primitives and two migrated pilot
surfaces, while **admin has its own separate Sprint 28 primitives (AdminPageShell/AdminTable/AdminCardList)
that are currently FROZEN/contested** (`docs/backlog.md`: Tasks 306/306-Fix/308/309 not acceptable as-is;
patches uncommitted; 308/309 BLOCKED). There is no consolidated verdict on (a) whether the public DS primitives
and the admin primitives are compatible / correctly separated per §4/§7, (b) whether any local layout invention
remains anywhere, or (c) what the remaining migration backlog is. DS-8 closes the foundation phase by producing
that verdict + plan — WITHOUT touching code and WITHOUT reviving frozen admin patches.

## Goal

Produce a consolidated **admin compatibility review + design-system migration-planning closure** (docs only):
confirm public vs admin container/primitive separation is correct per §4/§7; inventory remaining un-migrated
surfaces (public, cabinet/auth, admin); audit for any local layout invention where a canonical primitive now
exists; reconcile with the frozen Sprint 28 admin state (explicitly NOT committing rejected patches); and emit
OWNER-REVIEW-REQUIRED follow-up task STUBS for the remaining migration waves.

## Current behavior to preserve (Note 19 + Note 20)

- **Zero product behaviour changes** — this task touches no `src/`, no `messages/`, no DB. Every route/control/
  flow behaves exactly as before. → `git diff --stat src messages` empty.
- **No frozen Sprint 28 patch is committed or revived** — admin primitives are READ-ONLY here; the freeze stands
  until the owner lifts it. → confirmed in the report.
- **Primitives byte-identical**, **globals.css byte-identical**. → diff empty.

## Required after behavior

A single authoritative DS-8 report exists that states: the public/admin separation verdict (§4/§7), the
remaining-migration inventory with per-surface container targets, a local-invention findings list (with file
refs), the admin reconciliation (what stays frozen, what a future un-freeze would require), and a set of
clearly-scoped OWNER-REVIEW-REQUIRED follow-up task stubs — with no code changed anywhere.

## Positive flow (happy path)

- **Actor:** orchestrator / owner reading the closure report.
- **Steps & expected responses:** open the DS-8 report → see the compatibility verdict, the remaining-migration
  table, the local-invention findings, the frozen-admin reconciliation, and the follow-up stubs → can decide
  the next wave without ambiguity.
- **Success state:** report complete; `git diff --stat src messages scripts supabase` empty; only docs/tasks changed.
- **Post-conditions:** zero code changed; freeze respected; follow-up stubs marked OWNER REVIEW REQUIRED.

## Negative flow (every off-happy-path branch)

- **An audit finding implies a code fix** → do NOT fix it here; record it as a follow-up stub (OWNER REVIEW REQUIRED) with file refs. → documented.
- **A frozen Sprint 28 patch looks "ready"** → do NOT commit/revive it; record that the freeze stands and what un-freezing would require. → documented.
- **A contradiction is found** between `docs/design-system.md`, the catalog, and actual code → record it as a STOP & ASK item for the owner; do NOT silently "correct" code. → documented.
- **A surface's correct container is ambiguous** → record as OWNER REVIEW REQUIRED, do not guess. → documented.

## Scope

Produce the DS-8 audit/closure report (session log) + targeted doc updates (§16 snapshot, catalog
reconciliation, audit-doc append) + OWNER-REVIEW-REQUIRED follow-up task stubs + a 2–4 line backlog entry.
Read-only inspection of all `src/`. Nothing in `src/`/`messages/`/SQL is modified.

## Out of scope (DO NOT)

- Do NOT write or edit ANY product code (`src/**`), `messages/*`, `globals.css`, SQL, migrations, server actions, or Storybook.
- Do NOT migrate any route or admin surface (this phase is audit/plan only).
- Do NOT commit, re-apply, un-freeze, or revive Sprint 28 / Task 306 / 306-Fix / 308 / 309 patches.
- Do NOT create executable (READY) follow-up tasks — only OWNER-REVIEW-REQUIRED stubs.
- Do NOT run `git add` / `git commit`.

## Mandatory admin-table audit rule (READ-ONLY inventory — for the report only)

For each admin data surface flagged in `docs/design-system.md §16.C`, the report must inventory (read-only,
no code change): columns; row-click behavior; row actions; inline controls; filters; search; pagination; sort;
empty state; loading state; mobile layout — and state, per surface, whether a FUTURE migration could preserve
every existing admin action (none silently removed). This is documentation of what a future task must preserve;
it does NOT change the admin tables now.

## Acceptance criteria (each is diff-verifiable / report-verifiable)

- **AC-1** Public vs admin separation verdict per §4/§7 (public `PageShell`/`.container-wide` vs admin `AdminPageShell`/`.container-admin`): documented as COMPATIBLE or with specific issues. → report section.
- **AC-2** Remaining-migration inventory table: every un-migrated public + cabinet/auth + admin surface with its target container + proposed wave. → report section.
- **AC-3** Local-invention audit: list of any place still using bespoke containers/headers/filters/toolbars where a canonical primitive now exists (with file refs); or "none found". → report section + `git grep`/`rg` evidence.
- **AC-4** Frozen Sprint 28 reconciliation: explicit statement that Tasks 306/306-Fix/308/309 remain frozen and are NOT committed/revived here; what an owner-approved un-freeze would require. → report section.
- **AC-5** OWNER-REVIEW-REQUIRED follow-up task stubs created for the remaining migration waves (each: title, surfaces, container target, dependency, marked OWNER REVIEW REQUIRED — NOT READY). → file:line per stub.
- **AC-6** **Zero product code changed:** `git diff --stat src messages scripts supabase` empty. → diff in report.
- **AC-7** Primitives + `globals.css` byte-identical. → diff in report.
- **AC-8** Self-validation block: confirm (read-only) the current tree still builds — `npx tsc --noEmit`=0; `npm run build` ✅; `npm run lint` 0/0 new; `npm run check:i18n` PASS (no change expected, since no code touched). → output in report.
- **AC-9** "Files Changed" table (docs/tasks only); **no git commands emitted**.

## Required validation (run; adapt to PowerShell / Git Bash; paste output in the report)

```
git status --short
git diff --stat src messages scripts supabase       # MUST be empty (zero product code)
git diff --stat docs tasks                            # docs + planning stubs only
git diff src/app/globals.css                          # MUST be empty
git diff src/components/layout                         # MUST be empty
# read-only audit greps (examples — record findings, change nothing):
rg -n "container-wide|container-admin|max-w-" src/app src/components src/modules
rg -n "from ['\"]@/components/layout" src/app src/modules        # confirms which routes have/haven't adopted primitives
# confirm the current tree still passes (no code changed):
npx tsc --noEmit
npm run build
npm run lint
npm run check:i18n
```

If a script name differs, report the exact available scripts from `package.json` and use the closest canonical validation.

## Required responsive QA (MANDATORY framing — `docs/design-system.md §19`)

This is an **audit/planning task with zero runtime UI change**, so there is no new surface to render. Responsive
QA here = **documenting**, for each surface in the remaining-migration inventory, that a future migration task
MUST prove the full **14-width canon (320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 /
1920 / 2560) × sq/en/uk/it** with **real rendered browser/Storybook QA — code-level analysis is NOT proof of
responsive PASS** (§21), and that **uk @ 320** is the longest-locale overflow stress check. Each follow-up stub
must carry this requirement forward. (Note the Storybook preset gap: 560/680/810/960/1200 have no exact preset.)

## Required localization QA (sq / en / uk / it)

This task changes **no `messages/*.json`** and adds **no user-facing strings** (docs/audit only), so
`check:i18n` is a no-op PASS. The report and every follow-up stub must carry forward the requirement that future
migration tasks verify **sq / en / uk / it** parity (and `npm run check:i18n` if any string changes), with uk as
the longest-locale stress case. `en`-only proof is insufficient (§6).

## STOP & ASK triggers

- DS-6 + DS-7 are not both shipped + owner-approved + committed → STOP (DS-8 reconciles their learnings).
- An audit finding would require a code fix to resolve → STOP recording it as a fix; capture it as a follow-up stub instead.
- A frozen Sprint 28 patch appears "ready to commit" → STOP (the freeze stands; do not revive).
- A contradiction between `docs/design-system.md`, the catalog, and actual code is found → STOP & ASK (do not auto-correct code or rules).
- Any required change would touch `src/`, `messages/`, SQL, or `globals.css` → STOP (this task is docs/audit only).

## Final report requirements (the session log IS the report + a 2–4 line `docs/backlog.md` "Last Session" block)

Verdict; public/admin separation verdict; remaining-migration inventory; local-invention findings (with refs);
frozen-Sprint-28 reconciliation; OWNER-REVIEW-REQUIRED follow-up stubs; confirmation zero product code changed +
freeze respected + primitives/globals.css untouched; the read-only build/lint/typecheck/i18n confirmation. End
with the Files Changed table (docs/tasks only).

## Files Changed table requirement

The session log MUST end with a "Files Changed" table — one row per touched path (docs/tasks only) + 1-line
rationale. The orchestrator validates it against the real diff and confirms `src/`/`messages/` are untouched.

## No git commands emitted by Sonnet

You do NOT emit `git add` / `git commit`. End with the Files Changed table only. Opus reads the real diff
and emits explicit-path commit commands during review; the owner runs them in PowerShell.
