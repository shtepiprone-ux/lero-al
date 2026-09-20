# Task 847 — the admin dashboard's server data layer

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Kickoff: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_847_Admin_Dashboard_Data_Layer.md`
Evidence root: `docs/sessions/evidence/task847/` · QA profile `Q1`

## Process notes (disclosed)

- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` `agent-contract` 16b–16c were read (lines 155–228) before the kickoff was opened; `golden-rules.md` was read in full.
- GR-0 receipt emitted before the first write (REUSE the visibility helpers, CREATE `blockResult.ts`; no visible artifact).
- GR-1 / GR-3 / GR-3a: not applicable — the Scope list contains no `.tsx` file (kickoff §12). Clause 16d census: no rendered surface.
- **`git grep` was vacuous on the new files.** They are untracked, so the kickoff's §13.2 `git grep` commands print nothing whatever the file
  contains. The first run printed nothing for AC3/AC4/AC6; the AC4 result was the tell (the allowed raw-active line must appear). Re-run with
  `--untracked` (`final-greps-untracked.txt`) plus a sanity count proving the file is searched.
- `docs/sessions/evidence/task861/storybook-dev.log` shows `M` (+6 lines) in `git status`. Not written by this session; it was clean at session start (a running Storybook dev process is the likely writer).

## I0

| Probe | Result |
|---|---|
| platform | `win32 v22.22.3` |
| `git status --porcelain` at start | clean |
| baseline `visibility.test.ts` | 66 passed, exit 0 (`i0-visibility-test.txt`) |
| baseline `check:listing-visibility` | PASSED, 0 violations, exit 0 (`i0-check-listing-visibility.txt`) |
| drift in §3 | `page.tsx` raw-active count is at `:33`, not `:34` (one line). Everything else matched. FKs `listings_user_id_fkey` (`page.tsx:49`) and `listing_reports_listing_id_fkey` (`:55`) exist. |
| `server-only` | `npm ls server-only` prints `(empty)` (not a listed dependency), but `src/lib/supabase/admin.ts:1` already does `import 'server-only'` and `vitest.config.ts:18` aliases it. Existing convention used. |
| §5 listings soft delete | `git grep -n -i deleted_at -- '*.sql'` hits only `users` and `public_user_profiles` (`scripts/schema-drift-check.sql`). No `listings.deleted_at` → all rows count as "non-deleted"; no filter added. |

## Requirement and acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1 [AC1, AC2] | `src/lib/dashboard/blockResult.ts` (`BlockResult<T>`, `blockOk`, `blockFail`). `queries.ts` `countOf`/`rowsOf` turn a Supabase `error`, a thrown exception, a `null` count or `null` data into a failed outcome; `buildBlock` fails that block only and logs `[AdminDashboard] <block> failed` with `{ code }`. Tests (b). |
| R2 [AC1, AC3] | `getAdminDashboardData()` returns `{ refreshedAt, adm01, adm02, adm06, adm08, adm09, adm11, recentListings, locationRequests }`. Every select lists columns (AC3 grep empty, plus a runtime test over every recorded select). |
| R3 [AC4] | ADM-08/09/11 use `applyPublicVisibility` / `applyPublicEligibleButHidden` (test f spies both, incl. `expired`, `no_expiry` and no-reason calls). The only `'active'`/`expires_at` hit is `queries.ts:241`, the commented consistency count. |
| R4 [AC5] | `hrefs.ts` builds every target through `URLSearchParams` (path segment via `encodeURIComponent`); `hrefs.test.ts` pins each. |
| R5 [AC6] | AC6 grep (untracked-aware) prints nothing; runtime test asserts no recorded select contains `comment|email|phone|document_url`. |
| R6 [AC1] | `queries.test.ts` cases (a)–(f) plus extras; `green.txt`: 2 files, 31 tests, exit 0. |
| AC2 | Two-armed plant (`plant-count.txt`, `plant-rows.txt`): count swallowed to `0` → 1 failed, exit 1; rows swallowed to `[]` → 1 failed, exit 1. Hash before `d263d56ba…`; restored `d263d56ba…` after each arm (`plant.txt`). |
| AC7 | typecheck / lint / build exit 0 (`final-*.txt`). |

Red transcript: `red.txt` (both suites fail at import — the modules did not exist yet, exit 1).

## Current versus required behavior

Before: `/admin` renders `0` for a failed query and counts raw `active`. After: the module exists and returns honest per-block results; `/admin`
is untouched (853 switches it). Negative flows: one query errors → that block only; all error → all `ok:false`, function resolves; empty queue →
`ok:true` with `count 0`, `rows []`; ADM-11 disagreement → `data_inconsistent` for ADM-11 only; `null` count/data without an error → `query_failed`.

## Files Changed

| Path | Reason |
|---|---|
| `src/lib/dashboard/blockResult.ts` | new — shared `BlockResult` (also for 848) |
| `src/modules/admin/dashboard/types.ts` | new — block data shapes |
| `src/modules/admin/dashboard/queries.ts` | new — `getAdminDashboardData`, server-only |
| `src/modules/admin/dashboard/hrefs.ts` | new — every drill-down target |
| `src/modules/admin/dashboard/__tests__/queries.test.ts` | new — R6 (a)–(f) and extras |
| `src/modules/admin/dashboard/__tests__/hrefs.test.ts` | new — R4 |
| `docs/backlog.md` | 847 state, edited in place (79 lines, unchanged count) |
| `docs/sessions/2026-09-20-task847-admin-dashboard-data-layer.md` | this log |
| `docs/sessions/evidence/task847/*` | transcripts |

Final `git hash-object` (`final-hashes.txt`): `blockResult.ts 00c54cfd3` · `queries.ts d263d56ba` · `hrefs.ts bf8510ea2` · `types.ts 442448d64` · `queries.test.ts fea72a587` · `hrefs.test.ts a26ac7903`.

## Validation evidence (exit codes, unpiped)

`typecheck 0` · `lint 0` (0 errors; no warnings in task files) · `test src/modules/admin/dashboard/__tests__ 0` (31 passed) · `visibility.test.ts 0` (66 passed) ·
`check:listing-visibility 0` · `check:file-integrity 0` · `check:mojibake 0` · `build 0`.

## Assumptions, deviations, limitations

- **ADM-06 href encodes the comma.** `URLSearchParams` emits `status=open%2Cin_progress`; spec §3.1 writes `open,in_progress`. Same value after decoding
  (`searchParams.get('status')` → `open,in_progress`, pinned in the test). Kept because R4 requires `URLSearchParams`. Opus to confirm.
- **§13.2 greps need `--untracked` until the files are committed** (see process notes). After the owner commits, the kickoff's literal commands work.
- **Shared queries.** The pending-listings count feeds ADM-01 and the ADM-11 `pending` segment; the visible count feeds ADM-08 and `visible`; the hidden total feeds
  ADM-09 and `active_hidden`. A failing shared query fails every block that reads it (tests (b)). 20 queries in one `Promise.all`.
- **Consistency check race.** The visibility helpers read `new Date()` per call, so a listing that expires between the parallel queries could yield a false
  `data_inconsistent` for ADM-11. Rare; the spec asks for exactly this behavior, so it is not softened.
- **`createAdminClient()` can throw** on missing env (unchanged from today's page). It is not converted to per-block failure. Opus to decide if it should be.
- `hiddenTotal` is its own no-reason helper query (spec: "total and two sub-counts through the helper"), not `expired + noExpiry`.
- The ADM-01 owner join adds `last_name` to the FK select (spec: `name, last_name`); recent listings also gain `last_name` and an `id` tiebreak order.
- Location-request rows keep today's unordered `limit(5)`; its count must come back non-null or the block fails.
- No UI, no Storybook, no RLS/SQL. `OWNER VISUAL QA REQUIRED`: none.

## Opus handoff

Inspect: `queries.ts` (`countOf`/`rowsOf`/`buildBlock`, the shared-query wiring, `:241` raw-active count), the test mock's identification of queries
(`defaultRespond`), `plant.txt` hashes, and the four deviations above.
