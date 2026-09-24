# Task 596 — Hook-level regression test: `useNotifications` `.select()` MUST include `template_id` + `template_params`

Sprint 44. Follow-up opened by the orchestrator at the Task 595 review (2026-07-14).
Owner decision 2026-07-14: commit 595's fix now, close the regression-coverage gap as Task 596.

## Pre-read (rule-index → Regression / critical-flow coverage task)

- `docs/agent-contract.md` (clause 15 — regression coverage) + `docs/backlog.md`
- `docs/critical-flow-registry.md` — the row you are hardening (P1 — Notifications display →
  "Notifications panel — template-driven title/body localization", owner task 595)
- `tasks/Epics/Epic_RS_Regression_Shield.md` — slice contract + definition of done
- `docs/qa-rules.md` — test/error-handling conventions

## Why this task exists

Task 595 fixed a real localization bug: `useNotifications.ts`'s `.select()` omitted `template_id` /
`template_params`, so `notification.template_id` arrived `undefined` and `NotificationItem` rendered the
stored fixed-language string for EVERY template-driven notification.

The Task 595 regression test (`NotificationItem.templateLocalization.smoke.test.tsx`) is well-built, but it
guards the **downstream renderer** (`NotificationItem`) with a **hard-coded** `template_id` on the fixture —
it never exercises `useNotifications`. Consequences:

- If a future refactor drops `template_id`/`template_params` from `useNotifications`'s `.select()` again,
  **all four existing tests still pass** — the exact blind spot (fixtures bypass the hook) that let the
  original bug ship.
- The critical-flow-registry row's own stated **failure path** is literally "the hook's `.select()` omitting
  `template_id`/`template_params`" — which currently has **no automated guard**.

This task adds the missing guard at the layer that actually changed.

## Scope (do NOT exceed)

Add ONE new test file that exercises `useNotifications` (or its query-building) directly and asserts the
`.select()` column list includes both `template_id` and `template_params`. Do **not** change any product code
(`useNotifications.ts`, `NotificationItem.tsx`, etc. stay byte-identical). Do **not** touch the existing
`templateLocalization` / `priceChange` tests.

## Positive flow (happy path)

- Mount / invoke `useNotifications` with a mocked Supabase client whose query builder records the argument
  passed to `.select(...)` (spy/stub the `from('notifications').select` chain — the same mocked-client pattern
  used by the Slice-5 action-guard smokes, e.g. `deleteOwnAccount.smoke.test.ts`; no live Supabase, no network).
- Assert `.select()` was called exactly once with a string that contains BOTH `template_id` AND
  `template_params` (substring/contains assertions, resilient to column-order changes).
- Assert the rest of the query chain the hook relies on is unchanged: `.order('created_at', { ascending: false })`
  and `.limit(PAGE_SIZE)` still invoked (guards against a refactor that silently drops ordering/paging while
  "fixing" the select).

## Negative flow (the planted-violation proof — MANDATORY, clause 15)

- Temporarily remove `template_id, template_params` from `useNotifications.ts`'s `.select()` (simulate the
  Task-595 regression) → the new test's contains-assertion MUST genuinely FAIL. Paste the red transcript.
- Revert → test passes. Paste the green transcript.
- This is the whole point: the guard must fail when the columns are dropped from the HOOK — which the existing
  `templateLocalization` test does not do.

## Acceptance criteria

1. New test file (suggested `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts` or
   `.test.tsx`) — mounts/invokes the REAL `useNotifications` against a mocked Supabase client; no product-code
   change (grep-confirm `useNotifications.ts` untouched). Verifiable at file:line.
2. Positive-flow assertion: `.select()` called with a string containing `template_id` AND `template_params`
   (Positive flow above). Verifiable in the diff.
3. Chain-integrity assertion: `.order(...)` + `.limit(PAGE_SIZE)` still called (Positive flow). Verifiable.
4. Planted-violation red/green transcript in the session log (Negative flow above): dropping the two columns
   from `.select()` makes THIS test FAIL; reverting → PASS. Verifiable.
5. Update the `docs/critical-flow-registry.md` row (owner task 595 → append "595 + 596") so the Command column
   lists the new hook-level test alongside `NotificationItem.templateLocalization.smoke.test.tsx`, and the
   Coverage note records that BOTH the render layer and the hook `.select()` are now guarded.
6. Gates green: `tsc --noEmit` = 0; `eslint` clean on the new file; `check:i18n` unchanged (no keys touched);
   `check:file-integrity` + `check:mojibake` green. AC-by-AC self-audit table + "Files Changed" table in a new
   `docs/sessions/2026-07-14-task596-usenotifications-select-columns-regression-test.md`.
7. Single-writer: do NOT run `git`. The orchestrator emits commit commands at review.

## Hard contract (verified against the diff on return)

No scope change; no product-code edit; no architecture invention (stop-and-ask if the hook is not
straightforwardly mockable); literal AC; self-validate before "complete"; "Files Changed" table; NO
`git add`/`git commit` emitted by the executor.
