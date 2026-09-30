# Task 888 — `check:hydration --with-admin` measures the admin routes that exist

**Task path and status:** `tasks/Archive/Sprint_78_kickoff_prompt_Task_888_Hydration_Gate_Measures_Real_Admin_Routes.md` —
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (owner-native O78-10 live proof still owed). Executor: Sonnet. QA Q2, non-UI.

## Requirement and acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1 / AC1 | `planRoutes` with a session pushes `/admin/users`, `/admin/users/<uuid>` (or its notRealCoverage row), `/admin` (`Admin dashboard /admin (Task 853)`). `git grep --untracked -n "/en/admin" -- scripts/check-hydration-console.mjs` prints nothing (exit 1). Self-test states [2]/[3] in `evidence/task888/11-P1-green.txt`, `20-admin-config.txt`. |
| R2 / AC2 | No session → 3 `notRealCoverage` admin rows; state [1] asserts exactly 3 (`20-admin-config.txt`). |
| R3 / AC3 | `verifyAdminConfig` asserts 3 rows, new list/detail/dashboard paths, and that no planned path matches `^/<2 letters>/admin`. P1 red before R1: `10-P1-red.txt` (exit 1). Green after R1: `11-P1-green.txt` (exit 0). P2: `12-P2.txt` (planted old list path → exit 1, restored → exit 0, hash equal). |
| R4 / AC4 | `docs/critical-flow-registry.md` row "Hydration / console errors — admin routes": route cell → `/admin/users`, `/admin/users/[id]`, `/admin`; ✅ → 🟡; R4 sentence appended (dated 2026-09-30). Diff is 1 line; no other row changed. |
| R5 / AC5 | `evidence/task888/plant-admin-mismatch.mjs` (`apply`/`restore`, Node fs). Dry run `13-P3.txt`: page.tsx hash before `74b26361b0f4c90c33e45c0ed15195483fbcfc8e`, after restore identical; `__hydrationPlant.tsx` absent; `src/app/admin/page.tsx` not in final status. |
| R6 / AC6 | This log; `docs/backlog.md` 888 cell updated, 80 lines. |

## Current versus required behavior

Before: admin branch navigated two 404 routes and never `/admin`; self-test asserted the 404 paths. After: navigates `/admin/users`, `/admin/users/<uuid>`, `/admin`; self-test fails on any locale-prefixed admin path. Negative flows: no session → 3 SKIP; session without UUID → detail SKIP, list + dashboard navigated; reintroduced old path → self-test FAIL (P2).

## Files Changed

| Path | Reason |
|---|---|
| `scripts/check-hydration-console.mjs` | `planRoutes` and `verifyAdminConfig` only (R1–R3). Hash before `a218c42c…`, after `b383308a502347ca831b68cc223b979bc15251f3`. |
| `docs/critical-flow-registry.md` | admin-routes row (R4). Hash after `a285749f3eab49d8d908bbddcb1c629dad8ba927`. |
| `docs/sessions/evidence/task888/**` | new evidence incl. `plant-admin-mismatch.mjs` |
| `docs/sessions/2026-09-30-task888-hydration-admin-routes.md` | this log |
| `docs/backlog.md` | 888 cell only |

## Validation evidence (real exits)

`check:hydration:admin-config` 0 · `check:hydration:verify` 0 · `typecheck` 0 · `lint` 0 · `check:file-integrity` 0 (first run exit 1 on stray BOMs in my own PowerShell-redirected evidence files; stripped via Node with an explicit 11-file manifest, re-run 0 — `24`) · `check:mojibake` 0 · `build` 0 (`26-build.txt`). Plants: P1 red→green, P2 red→green, P3 hashes equal.

GR-2 SCOPE STATED — check:hydration:admin-config inspects the route plan only and cannot see a real hydration mismatch; the live admin criteria are closed by O78-10's native transcripts, not by this gate.

## Visual source trace / Canonical UI decision record

Not applicable: no visible surface (governance script, docs, evidence).

## Assumptions, deviations, limitations

- The first draft of the dashboard-order assertion used the literal `/en/admin`; AC1 forbids it in the script, so the check is a locale-agnostic regex (`^/xx/admin`).
- Unrelated worktree changes exist in `src/design-system/**`, `src/modules/**`, `src/stories/**` (another task); not touched here. `docs/sessions/evidence/task886/` is untracked and not mine.
- `docs/critical-flow-registry.md` row edited by string replacement through Node UTF-8 I/O.

## Opus handoff

Inspect: script diff (self-test P1/P2 transcripts), registry row, plant script's restore path. **Owed: O78-10** (§13.2) — owner runs three clean, three planted, one restored `check:hydration -- --with-admin` under `next dev` with a staff session.

## Backlog update

888 cell rewritten in place (no new lines); `docs/backlog.md` = 80 lines, not above the limit.

## Revision 1 — review 1 (F1 redirect guard, F2 live arm, F3 Q4)

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Evidence: `docs/sessions/evidence/task888/rev1/` (Node-safe: written by bash redirect, UTF-8 no BOM, each ends `EXIT_CODE=n`).

| ID | Evidence |
|---|---|
| R7 / AC7 | Hash before `b383308a…` (`00`-equivalent check, page.tsx `74b26361…`). P4 red `10-P4-red.txt`: `/redirect` case got PASS, exit 1. Guard added to `checkRoute` (pathname compare, one trailing `/` stripped, query ignored) + header line. Green `11-P4-green.txt`: `/redirect` FAIL `(redirect) redirected /redirect → /clean`, `/500` FAIL, `/throw` FAIL, `/clean` PASS, exit 0. |
| R8 / AC8 | Dev server `npm run dev` (`39-dev-server.log`); `capture:admin-session` exit 0 (`40`); staff user id from the fresh storage state. Warm-up `41`; clean `42–44`: 3 admin rows PASS, exit 0. Plant apply `45` (page.tsx `74b26361…` → `9c50dc7e…`); planted `46–48`: `Admin dashboard /admin` FAIL with `(pageerror) Hydration failed because the server rendered text didn't match the client…`, list + detail PASS, no `redirect` violation. Restore `49`: hash `74b26361…` equal, plant file absent. Restored `50`: 3 admin rows PASS, exit 0. Dev log: 8 × `GET /admin`, `/admin/users`, `/admin/users/<id>` all `200`, zero `307`. Other rows: public/auth-homepage PASS, listing-detail SKIP (HYDRATION_LISTING_PATH unset) — observed, not asserted. |
| R9 / AC4 | Registry row status sentence now also states the redirect rule; row stays 🟡; 1-line diff. |
| F3 | Q4 applied (kickoff header/§13 already corrected by the reviewer). |

Final gates (`rev1/20–27`): admin-config 0 · verify 0 · error-page 0 · typecheck 0 · lint 0 · mojibake 0 · build 0 · file-integrity see `24`. `/en/admin` grep in the script prints nothing (exit 1).
Hashes: script `e2f594afc137be1f9db1780cb2442ae0e3f4ed09`; registry `efe18c4d44e92448cb1f27c2fe9e64f52340c869`; `src/app/admin/page.tsx` `74b26361b0f4c90c33e45c0ed15195483fbcfc8e` (= before), not in status.
Files changed in Revision 1: `scripts/check-hydration-console.mjs` (checkRoute guard, runErrorPageSelfTest case, header line), `docs/critical-flow-registry.md` (row status sentence), `docs/sessions/evidence/task888/rev1/**`, this log, `docs/backlog.md` (888 cell).
GR-2 SCOPE STATED — `check:hydration:error-page` inspects checkRoute's verdict on four synthetic pages and is not run by CI; it cannot see the real admin redirect; R7 is closed by P4's transcripts and R8's live runs (dev log 200, never 307).
Limitations: the planted-arm failure text surfaced as `pageerror`, not `console`; both count as hydration text. Dev server stopped after the runs. Owner-native O78-10 is no longer owed; an owner re-run is optional.
