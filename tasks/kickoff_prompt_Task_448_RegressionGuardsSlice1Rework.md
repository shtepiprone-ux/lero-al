# Task 448 — Epic RS Slice 1 REWORK: close the Task 436 coverage gaps + registry honesty

> **🛡️ Follow-up to Task 436 (Epic RS — Regression Shield, Slice 1).** Task 436 landed a good
> foundation (clearHistory + reportListing server-action smoke, a real hydration/console-error gate
> proven by a planted-violation FAIL, and the two governance rules). It is **NOT approved** — the
> orchestrator review (2026-06-16) found one literal kickoff miss, one over-claim in the session log /
> registry, and three cheap hardening items. This task closes them. **PREVENTION ONLY — no 434/435 fix,
> no product redesign, no broad/flaky E2E.**
>
> See `tasks/Epics/Epic_RS_Regression_Shield.md`, `docs/critical-flow-registry.md`, and the original
> kickoff `tasks/kickoff_prompt_Task_436_RegressionProtectionGuards.md`.
>
> **Type:** QA / tooling / governance.

## Why this task exists (orchestrator review findings on Task 436)

1. **HARD BLOCKER — Guard 2 omits a route the kickoff explicitly required.** Task 436 kickoff Guard 2
   mandated the hydration gate cover `/admin/users/[id]` **plus 1–2 key public routes including a
   listing-detail page (where the Task 435 report dialog lives)**. The delivered
   `scripts/check-hydration-console.mjs` covers `/en`, `/en/listings`, `/sq`, `/uk`,
   `/en/admin/users`, `/en/admin/users/<uuid>` — there is **no listing-detail route**. AC3 is therefore
   not literally met.
2. **OVER-CLAIM — session-log AC2 ✅ overstates Guard 1 coverage.** The Guard 1 minimum inventory in the
   436 kickoff listed eight flows. Delivered smoke covers only clear-history (success/no-op at the action
   level) and report-listing (success + failure). **Not covered anywhere yet:** user Account-type / Status
   change *creates* a history entry (`user_change_log` / `user_status_history`) — distinct from
   *clearing* history. The session-log AC2 line and the registry must not present these as closed.
3. **HARDENING — `reportListing.smoke.test.ts` does not pin the table name.** The mock is
   `from: () => reportChain` with no argument assertion, so renaming `.from('listing_reports')` to a wrong
   table would still pass. For an RLS/regression guard this must assert the table.
4. **HONESTY — admin-detail hydration route uses a dummy UUID.** `…/users/00000000-…-001` may resolve to
   a not-found / empty state and never exercise the components that actually broke in Task 434, so a clean
   run is not real proof. Make it owner-parametrizable with a real user id (or keep it 🟡, never ✅).
5. **HONESTY — registry conflates "detector exists" with "live app routes covered".** The hydration row is
   marked ✅ overall while CI only runs the self-test (`check:hydration:verify`); live app-route checks are
   owner-run. Split the status so the registry does not over-state production coverage.

## Pre-read (rule-index → Regression / critical-flow coverage task)

- `docs/agent-contract.md` (esp. clause 15) + `docs/backlog.md` (always)
- `docs/critical-flow-registry.md` — the registry being corrected
- `tasks/Epics/Epic_RS_Regression_Shield.md` — slice contracts + definition of done
- `docs/qa-rules.md` — test / error-handling conventions (Actionable Error-Toast Rule from 436)
- `docs/orchestrator-role.md` → "Regression-coverage gate"
- `tasks/kickoff_prompt_Task_436_RegressionProtectionGuards.md` — the original requirements
- Only if needed for the status-change smoke: `docs/rls-rules.md`, `docs/data-access-rules.md`,
  `docs/domain-rules.md` (the `modules/admin/actions` write path that records the history row).

## Required investigation (report in the session log BEFORE writing)

1. Confirm the existing route list in `scripts/check-hydration-console.mjs` and the public listing-detail
   URL pattern actually used by the app (e.g. `/{locale}/listings/[id]` or `/{locale}/listing/[slug]`).
   Pick a route shape that resolves to a real published listing in dev; do **not** invent one.
2. Locate the admin action that writes `user_status_history` / `user_change_log` on Account-type / Status
   change (`modules/admin/actions/index.ts`) and confirm its testable contract (what it inserts, the typed
   error on permission-denied). This is the missing Guard 1 flow.
3. Re-read `src/modules/listings/actions/__tests__/reportListing.smoke.test.ts` to add the table assertion
   without disturbing the passing cases.

## Scope of work

### A. Hydration gate — add the listing-detail route (closes finding 1 / AC3)
- Add a **public listing-detail route** to `scripts/check-hydration-console.mjs` `PUBLIC_ROUTES` (the page
  where the Task 435 report dialog lives). Use a real dev-resolvable URL; if no stable public id exists,
  add an owner-parametrizable env var (e.g. `HYDRATION_LISTING_PATH`) with a documented default and a clear
  skip-with-warning if unset — but the route MUST be present, not silently dropped.
- Keep `/admin/users/[id]` covered. Make the admin-detail id owner-parametrizable via an env var
  (e.g. `HYDRATION_ADMIN_USER_ID=<real-user-with-history>`); when unset, the admin-detail check is reported
  as **NOT REAL-COVERAGE / skipped**, never as a green pass.

### B. Status/Account-type change → history-entry smoke (closes finding 2)
- Add a smoke test (vitest, same mock style as the existing 436 smoke) asserting that the admin
  Account-type / Status change action **writes a `user_status_history` (and/or `user_change_log`) row** on
  the happy path, and returns a typed permission-denied error on the negative path. This is the missing
  Guard 1 inventory item — *creating* history, not *clearing* it.
- If creating this smoke reveals that the action is not unit-testable without product changes, **STOP and
  ASK** — do not refactor product code to make it testable under this task.

### C. Pin the report table name (closes finding 3)
- In `reportListing.smoke.test.ts`, capture the `from` argument (`const mockFrom = vi.fn(() => reportChain)`)
  and assert `expect(mockFrom).toHaveBeenCalledWith('listing_reports')` in the happy-path test. No other
  behavioral change to the existing cases.

### D. Registry + session-log honesty (closes findings 1, 2, 4, 5)
- In `docs/critical-flow-registry.md`:
  - **Hydration / console-error row:** split into "detector exists + planted-violation FAIL ✅ (CI self-test)"
    vs "live app-route coverage 🟡 (owner-run; public routes CI-pending)". Do not present it as fully ✅.
  - **Admin users list / admin user detail rows:** keep 🟡 (gate script present, real coverage requires the
    owner auth run with a real id) — do not flip to ✅.
  - **User status / role / account-type change row:** flip to ✅ only once B lands with passing + planted-fail
    proof; otherwise keep ❌/🟡 honestly.
  - **Report-listing row:** add the table-name assertion to the evidence; dialog-open stays explicitly
    deferred to Slice 3 / Task 442.
- Correct the Task 436 session log AC2 evidence (or add a follow-up note) so it does not claim the full
  Guard 1 inventory is covered.

## Out of scope
No fix to 433/434/435. No UI redesign. No product-behavior change beyond what B legitimately needs (and if
B needs product changes, STOP and ASK). No broad/flaky live-server E2E in CI. Dialog-open / neutral-toast
**UI-render** assertions remain deferred to Slice 3 (Task 442) — this task only corrects the over-claim, it
does not build the render harness.

## Positive flow (the guards on healthy code)
On a clean tree: `lint` + `tsc` pass; `npx vitest run` passes including the new status-change smoke and the
hardened report smoke; `npm run check:hydration:verify` still PASSES (self-test); `npm run check:hydration`
now includes a listing-detail route and the parametrized admin-detail route; the registry honestly
distinguishes detector-vs-live-route coverage.

## Negative flow (PROOF each new/changed gate is real)
- **Status-change smoke:** stub the action's insert to not write the history row → smoke FAILS; revert → PASS
  (paste transcript).
- **Report table assertion:** change `.from('listing_reports')` to a wrong table in a scratch run → the new
  assertion FAILS; revert → PASS (paste transcript).
- **Hydration listing-detail route:** the existing planted-violation self-test still FAILS as before; show
  the listing-detail route is actually requested in a `check:hydration` run transcript (or, if owner-run,
  document the exact command + expected output).
- A gate that cannot be made to fail on a planted violation is a no-op and is a TASK FAILURE.

## Acceptance criteria
- **AC1** — `scripts/check-hydration-console.mjs` covers a real **listing-detail** public route (where the
  report dialog lives); admin-detail id is owner-parametrizable and never reported green when unset.
- **AC2** — A smoke test asserts the admin Account-type / Status change **writes** a history row (happy) and
  returns a typed permission-denied error (negative); planted-violation FAIL transcript included.
- **AC3** — `reportListing.smoke.test.ts` asserts `.from('listing_reports')`; all prior cases still pass.
- **AC4** — `docs/critical-flow-registry.md` splits hydration "detector ✅ / live-routes 🟡", keeps admin
  list/detail 🟡, and reflects the real status of the status-change flow; report-listing evidence updated.
- **AC5** — Task 436 session-log AC2 over-claim corrected (or annotated with a 448 follow-up note).
- **AC6** — Regression-coverage gate (clause 15): every new/changed test runs in CI (or the exact owner-run
  command is documented), and each new machine gate has a planted-violation FAIL transcript.
- **AC7** — No 434/435 product fix, no UI redesign, no broad E2E; file-integrity (clause 14) green on every
  touched file; "Files Changed" table present; executor emits NO git commands.

## Validation required (run, or document why impossible)
- `npm run lint`
- `npx tsc --noEmit`
- `npx vitest run` (full suite green, incl. the new + hardened smoke)
- `npm run check:hydration:verify` (self-test still PASS) + a `check:hydration` transcript showing the
  listing-detail route requested (or the documented owner-run command)
- Planted-violation FAIL transcripts for the status-change smoke and the report table assertion
- File-integrity (clause 14) green on every touched file
- **Do NOT run mutating git.** Provide the "Files Changed" table; the orchestrator emits commits.
