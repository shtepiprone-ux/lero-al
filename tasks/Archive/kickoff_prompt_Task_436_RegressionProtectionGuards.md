# Task 436 — Regression Shield · SLICE 1: Foundational guards (PREVENTION ONLY)

> **🛡️ REFRAMED 2026-06-16 — this is now Slice 1 of Epic RS (Regression Shield), not a
> Task-432-only fix.** See `tasks/Epics/Epic_RS_Regression_Shield.md` + `docs/critical-flow-registry.md`.
> Slice 1 lands the foundational machine gates (hydration/console-error gate, admin-users & report-listing
> smoke, RLS-change rule, actionable-error-toast rule). The flows it covers map to registry rows
> (admin-users-list, admin-user-detail, report-listing, clear-history) — flip their coverage status to ✅
> and paste the command into the registry when this slice lands. The broader auth/listings/admin/RLS/i18n
> coverage continues in Slices 2–6 (Tasks 441–445). The P0 regression-coverage RULE (agent-contract
> clause 15) is ALREADY LIVE as of Task 440 — Slice 1 is the first coverage, not the rule's start.
>
> **Type:** QA / tooling / governance. **Owner-directed scope, 2026-06-15; reframed under Epic RS 2026-06-16.**
> **🔴 This task does NOT fix any current bug.** The live bugs stay as their own tasks:
> - **Task 434** — admin LocaleSwitcher hydration / SSR-CSR mismatch (separate fix task).
> - **Task 435** — report-listing submit failure (separate diagnose→fix task).
> - **Task 436 (this)** — guards so these *classes* of bug cannot pass unnoticed again.
>
> Task 436 must NOT redesign UI, NOT rewrite all tests, NOT fix 434 or 435 directly, NOT change product
> behavior except the minimum needed to expose typed/actionable errors in existing flows, and NOT add
> broad/flaky E2E coverage.

## Goal

Add project-level protection against the bug classes surfaced during Task 432 QA:
1. Critical user/admin flows can silently break.
2. Hydration / invalid-HTML console errors can exist while `build`/`lint`/`tsc` all pass.
3. RLS / DB-policy changes can break write paths without any test catching it (this is exactly the
   Task 270 → Task 435 gap).
4. Generic "Failed. Try again." toasts hide the real failure cause and slow diagnosis.

## Pre-read (rule-index → mixed: QA/tooling + governance + DB/RLS)

- `docs/agent-contract.md` + `docs/backlog.md` (always)
- `docs/qa-rules.md` (error handling, pre-commit checks, manual testing — primary home for guards #2/#4)
- `docs/rls-rules.md` (primary home for guard #3)
- `docs/rule-index.md` (must reference the new rules from the relevant task-type bundles)
- `docs/ai-behavior.md` (self-validation notes; where executor-facing rules live)
- `docs/responsive-screenshot-governance.md` + `docs/storybook-governance.md` (existing Playwright /
  screenshot / `--assert` infra the gates should piggyback on)
- `docs/orchestrator-role.md` + `docs/governance-enforcement.md` (only if wiring a new CI gate)

## Required investigation (BEFORE writing anything — report findings in the session log)

Inspect and inventory what already exists; do not duplicate it:
1. Existing Playwright / screenshot / console-capture infra (`scripts/`, `.screenshots/`, the
   `responsive-screenshots --assert` harness, `package.json` scripts, CI workflows in `.github/`).
2. Existing admin smoke coverage and any `src/tests/**` / vitest setup.
3. Existing report-listing action tests, if any (`reportListing.ts`).
4. Existing RLS / schema-drift / DB-guard scripts (`scripts/check-schema-drift.mjs`,
   `scripts/grant-discipline-audit.sql`, `scripts/check-*`).
5. Governance files where each new rule belongs (so rules live in docs, not buried in a session log).
6. The current toast/error-handling pattern for server actions (typed `{ error }` returns, `toast.error`
   call sites) — so the actionable-error rule matches the real pattern.

## Guard 1 — Critical-flow smoke tests

Add or EXTEND smoke coverage (smallest reliable happy path + one known failure/no-op path each — not
every UI state) for the minimum critical flows:
- admin users list loads without console errors;
- admin user detail page loads without console errors;
- user Account-type / Status change creates a history entry (writes `user_change_log` /
  `user_status_history` — already confirmed working 2026-06-15);
- clear-history success path works;
- clear-history no-op race path shows the neutral info toast (`feedback.clear_history_noop` — Task 432);
- listing report dialog opens;
- listing report submit success path works;
- listing report submit failure path yields a **diagnosable** result (typed error / logged cause), not a
  generic dead-end.
- **Coordination with Task 435:** the report-submit smoke must be written against the flow's *contract*.
  If 435 has not yet landed typed errors, assert the testable invariant now (non-success toast + a
  server-logged cause) and leave a TODO referencing 435 for the typed-category assertion. Do NOT implement
  the 435 product fix here.

## Guard 2 — Hydration / invalid-HTML error gate

Add a gate that FAILS when the browser console contains hydration-class errors/warnings during tested
routes. Must catch at least: "Hydration failed", "Text content does not match", "whitespace text nodes
cannot be a child of", invalid-HTML-nesting warnings, and React SSR/client tree-mismatch warnings.
- Must NOT rely only on `npm run build` / `tsc` / `lint` — those did NOT catch Task 434.
- Integrate into the existing Playwright/screenshot/`--assert` infra if feasible; expose an exact command.
- Cover at minimum **`/admin/users/[id]`** (the exact Task 434 date-format hydration route — MUST be in
  the gate) plus 1–2 key public routes (incl. a listing detail page, where the Task 435 report dialog lives).

## Guard 3 — RLS-change test rule (governance)

Add a rule to `docs/rls-rules.md` (and reference it from the `docs/rule-index.md` "DB / server action /
RLS" + "Schema / migration" bundles, and from `docs/agent-contract.md` if it warrants a P0 line): any task
that changes Supabase RLS policies, DB permissions, SECURITY DEFINER functions, service_role access, or
write-path tables MUST include:
- an affected write-path inventory (every server-action insert/update/delete touching the table);
- a positive permission test (the legitimate actor can still write);
- a negative permission test (an illegitimate actor cannot);
- an actor matrix where relevant: anonymous / authenticated user / owner / admin / service_role;
- proof that existing server actions still work AFTER the policy change (runtime, not just policy-inventory
  SQL — the exact gap that let Task 270 break the report flow).

## Guard 4 — Actionable error-toast rule (governance)

Add a rule (home: `docs/qa-rules.md` error-handling section; reference from `rule-index.md` UI + DB
bundles): for critical write actions (admin / moderation / reporting / payment / history flows), a generic
"Failed, try again" toast is insufficient unless the code ALSO logs the specific server-side cause.
Minimum standard:
- user gets localized, non-technical copy (4 locales);
- developer/server log preserves the exact root cause;
- the server action returns a typed error category where reasonable;
- at least one known failure branch is covered by a test;
- no catch-all path collapses RLS / validation / email / DB failures into one undifferentiated error.

## Note carried to Task 434 (do not act on it here)

For Task 434, the perf HUD / browser extension is a SUSPECT, not a conclusion — 434 must reproduce with a
clean browser profile / extensions disabled first, then diagnose. (Stated here only so the prevention work
and 434 stay aligned; no 434 work happens in 436.)

## Positive flow (the guards on healthy code)

On a clean tree: `lint` + `tsc` pass; the new hydration gate runs the tested routes and reports ZERO
hydration warnings; the critical-flow smoke suite passes every happy path + the no-op/failure path; the two
new governance rules are present in the correct docs and referenced from `rule-index.md`.

## Negative flow (PROOF each gate is real, not a no-op)

For each new machine gate, a planted-violation transcript MUST show the gate FAIL, then pass once reverted:
- Hydration gate: introduce a deliberate SSR/CSR text mismatch on a tested route → gate FAILS.
- Critical-flow smoke: break one asserted flow (e.g. stub the report action to throw) → smoke FAILS.
- (Governance rules are doc rules — their "negative" is the orchestrator review-checklist entry that
  rejects a future RLS/error task lacking the required tests.)
A gate that cannot be made to fail on a planted violation is a no-op and is a TASK FAILURE.

## Out of scope

No UI redesign. No wholesale test rewrite. No fix to 433/434/435. No product-behavior change beyond the
minimum to expose typed/actionable errors. No broad/flaky E2E.

## Acceptance criteria

- AC1 — Kickoff/work clearly separates bug fixes from prevention (no 434/435 fix in the diff).
- AC2 — Critical-flow smoke coverage added or existing coverage extended; the inventory INCLUDES the
  report-listing flow AND the admin user-history flow.
- AC3 — Hydration/console-error gate fails on hydration + invalid-HTML warnings (planted-violation
  transcript proves it); does not rely on build/tsc/lint alone.
- AC4 — RLS-change governance rule added to `docs/rls-rules.md` and referenced from `rule-index.md`
  (+ agent-contract if P0).
- AC5 — Actionable-error-toast governance rule added to `docs/qa-rules.md` and referenced from
  `rule-index.md`.
- AC6 — New gates documented with EXACT commands (how to run each locally + in CI).
- AC7 — Session log includes evidence from the new/updated checks (pass transcript + planted-violation
  fail transcript).
- AC8 — No unrelated UI redesign or broad refactor.

## Validation required (run, or document why impossible)

- `npm run lint`
- `npx tsc --noEmit`
- existing screenshot/`--assert` gate (if applicable)
- the new/updated hydration console gate
- the new/updated critical-flow smoke test
- targeted tests for report-submit / admin user-history if added
- grep/check that the new governance rules are referenced from `docs/rule-index.md` where appropriate
- File-integrity (clause 14) green on every touched file
- **Do NOT run mutating git.** Provide the "Files Changed" table; the orchestrator emits commits.
