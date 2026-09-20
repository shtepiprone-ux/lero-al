# Task 849 — `listing_activity_daily` aggregate, hourly recompute cron, read helpers

Task: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_849_Listing_Activity_Daily_Aggregate.md` · QA profile **Q4** ·
Evidence root `docs/sessions/evidence/task849/` · Executor: Sonnet · 2026-09-20

**Status: `PARTIALLY IMPLEMENTED`** — everything except R5 is implemented and evidenced. R5 requires owner action
**O78-1**, which the sprint plan still records as `— (pending)`, so `vercel.json` is unchanged (kickoff R5/AC5).
AC2/AC3/AC6/AC7(c) are **owner-native pending** (Supabase SQL editor).

CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.
GR-1 / GR-3 / GR-3a: not applicable — no visible artifact (kickoff §12).

## Start gate

- Platform `win32 v22.22.3`. Status at start: only `docs/sessions/evidence/task861/storybook-dev.log` modified
  (pre-existing, not mine).
- Dependencies present: `src/lib/cron/verifyCronRequest.ts` (851), `src/lib/dashboard/period.ts` (846),
  `src/lib/dashboard/blockResult.ts` (847), `AgentOwnerId` in `src/modules/cabinet/statistics/types.ts` (848).
  851/846/847/848 are all in recent commits.
- **O78-1** read in `tasks/Sprints/Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md:138`:
  `**Owner answer:** — (pending; 849 reads it here)`.
- `docs/env.md:17` already names `/api/cron/listing-activity (Task 849)` (written by 851), so no env.md edit was needed.
- The `record_listing_view` SQL is not in the repo. `view/route.ts:57-59` documents that the RPC returns TRUE only when
  a row was inserted and FALSE when the 24 h dedup suppressed it — so `listing_views` rows are accepted views.
  Kickoff §5's INFERENCE is supported by that comment; the function body itself is **UNKNOWN** (not inspectable).

### Requirement ledger, current behavior, required behavior

Before: no per-day activity; only lifetime `views_count` and raw event rows; no `listing-activity` cron.
After: R1–R9 below; nothing visible changes. Negative flows per kickoff §11 (all applicable).

## Requirement and acceptance-criteria evidence

| ID | Evidence | State |
|---|---|---|
| R1 | `scripts/task-849-listing-activity-daily.sql` — both tables, PK, checks, index on `(metric_date)`, RLS enabled, no policy, `revoke all` from anon/authenticated, service_role grants (+ sequence grant for the bigserial) | done, **not executed against a DB** |
| R2 | same file — `recompute_listing_activity(date,date,text)`; advisory lock 849000001; range/span guards; delete+insert in one function; union-of-keys merge; `search_path = public, pg_temp`; execute only to service_role | done, **not executed** |
| R3 | same file — three `language sql stable` read functions using `generate_series` (zero days kept) | done, **not executed** |
| R4 | `src/app/api/cron/listing-activity/route.ts` (GET only, `verifyCronRequest`, `force-dynamic`, `JOB_VERSION='849.1'`); `__tests__/route.test.ts` 9 tests | done |
| R5 | `vercel.json` **unchanged** | **BLOCKED on O78-1** |
| R6 | `scripts/task-849-backfill.sql` — 180 days, 6 × 30-day chunks, `849.1-backfill`, refresh row per chunk | done, **not executed** |
| R7 | `src/modules/analytics/activity/read.ts` + `types.ts`; `__tests__/read.test.ts` 17 tests | done |
| R8 | both test files: 26 tests, exit 0 (`g3-tests-final.log`) | done |
| R9 | `src/types/database.ts` (2 interfaces), `scripts/check-schema-drift.mjs` (2 map entries), `scripts/schema-drift-check.sql` regenerated | done |

| AC | Result |
|---|---|
| AC1 | SQL read back. First lines: `create table if not exists public.listing_activity_daily (`, `create index if not exists listing_activity_daily_metric_date_idx`, `create table if not exists public.listing_activity_refresh (`, `create index if not exists listing_activity_refresh_status_ran_at_idx`, `alter table public.listing_activity_daily   enable row level security;`, `revoke all on public.listing_activity_daily   from anon, authenticated;`, `grant select, insert, update, delete on public.listing_activity_daily   to service_role;`. Functions use `create or replace function` — Postgres has no `create function if not exists`; the R1 "`drop policy if exists`" has nothing to drop because no policy is created. |
| AC2 | **owner-native pending** — `task-849-verify.sql` part (a) |
| AC3 | `read.test.ts` passes; part (b) **owner-native pending** |
| AC4 | `npm.cmd run test -- src/app/api/cron/listing-activity/__tests__ src/modules/analytics/activity/__tests__` → 2 files, 26 tests passed, exit 0, incl. the 22:30 UTC case (`p_from 2026-09-18, p_to 2026-09-19`). Plant below. |
| AC5 | **Not met** — `vercel.json` unchanged because O78-1 is unanswered; status is therefore `PARTIALLY IMPLEMENTED` as AC5 prescribes |
| AC6 | script covers 180 days in 30-day chunks with `849.1-backfill`; the owner's run output is **owner-native pending** |
| AC7 | `check:schema-drift` exit 0 (it regenerates the SQL from `database.ts`; it needs no live DB); part (c) **owner-native pending**. Running the regenerated SQL against the live DB is owner-native. |

`GR-2 SCOPE STATED — the vitest suites inspect the route and read helpers against a mocked admin client; they cannot see the SQL, RLS, grants or the real Tirane cut; AC2/AC3/AC6/AC7(c) are closed only by the owner's run of task-849-verify.sql / backfill.`

## Plant transcript (AC4)

Pre-plant route hash `c97781be42f0a42bd80e4fbeeba895454cbdd5da` (`plant-hash-before.txt`). Replaced
`if (!auth.ok) return auth.response` with `void auth // PLANTED…` → `Tests 3 failed | 6 passed`, exit 1: the three 401
cases fail (`plant-run.log`). Restored; post-restore hash `c97781be42f0a42bd80e4fbeeba895454cbdd5da` (**equal**,
`plant-hash-after.txt`), `grep -c PLANTED route.ts` = 0, full suite re-run 26/26, exit 0.

## Files Changed

| Path | Reason |
|---|---|
| `scripts/task-849-listing-activity-daily.sql` (new) | R1–R3 tables, RLS/grants, recompute + read functions |
| `scripts/task-849-backfill.sql` (new) | R6 180-day backfill |
| `scripts/task-849-verify.sql` (new) | owner verification parts (a)–(d) |
| `src/app/api/cron/listing-activity/route.ts` (new) | R4 cron route |
| `src/app/api/cron/listing-activity/__tests__/route.test.ts` (new) | R8 |
| `src/modules/analytics/activity/read.ts` (new) | R7 read helpers |
| `src/modules/analytics/activity/types.ts` (new) | R7 shapes + `ACTIVITY_REFRESH_CADENCE` / `STALE_AFTER_MS` |
| `src/modules/analytics/activity/__tests__/read.test.ts` (new) | R8 |
| `src/types/database.ts` | R9 row types for the two tables |
| `scripts/check-schema-drift.mjs` | two `INTERFACE_TABLE_MAP` entries (see deviations) |
| `scripts/schema-drift-check.sql` | regenerated by `npm run check:schema-drift`; diff = +36/−4, only the new tables, the new header timestamp and the trailing-comma fix |
| `docs/backlog.md` | 849 state (file stays at 80 lines) |
| `docs/sessions/2026-09-20-task849-listing-activity-daily.md`, `docs/sessions/evidence/task849/*` (new) | this log and transcripts |

`vercel.json` and `docs/env.md`: **not changed** (see above). `docs/sessions/evidence/task861/storybook-dev.log` was
already modified before this session and is not part of this task.

## Validation evidence (all unpiped; exit code appended in each log)

| Command | Exit |
|---|---|
| red run before implementation (`g0-red.log`) | 1 (expected: `../route` / `../read` absent) |
| `npm.cmd run typecheck` | 0 |
| `npm.cmd run lint` | 0 (0 errors; 79 pre-existing warnings, none in touched files) |
| `npm.cmd run test -- …/listing-activity/__tests__ …/analytics/activity/__tests__` | 0 — 26 passed |
| `npm.cmd run check:schema-drift` | 0 |
| `npm.cmd run build` | 0 — route list shows `ƒ /api/cron/listing-activity` |
| `npm.cmd run check:file-integrity` | 0 — 24 files clean |
| `npm.cmd run check:mojibake` | 0 — 0 artifacts in 6294 files |

Final hashes (`g9-hashes.log`, order as listed): daily.sql `adfc56f9…` · backfill.sql `483dac6d…` · verify.sql `b85d1917…` ·
route.ts `c97781be…` · read.ts `9fd43d2b…` · types.ts `f94507d5…` · vercel.json `de6b42c2…` (unchanged).

## Assumptions, deviations, limitations

- **SQL was never executed.** No Postgres is available here; the three SQL files are read-back only. Every SQL claim
  (idempotency, Tirane cut, grants, sequence grant, `language sql` OUT-column naming) is unverified until the owner runs
  `task-849-listing-activity-daily.sql` → `task-849-backfill.sql` → `task-849-verify.sql` (§13.3).
- **Deviation 1:** `scripts/check-schema-drift.mjs` edited (not in kickoff §7) — R9 cannot be met otherwise, because the
  generator regenerates `schema-drift-check.sql` from its interface map (precedent: Tasks 430/431).
- **Deviation 2:** the route returns `500 { ok:false }` when the recompute succeeded but the *success* refresh row cannot
  be stored (R4 is silent). Reason: a swallowed failure would make the dashboards read stale with no signal. Tested.
- **Addition:** `getPlatformActivitySeries`/`getOwnerActivitySeries` return `data_inconsistent` when the RPC does not
  return one row per day of the period (protects "0 only after a successful read"). Tested.
- **Addition:** `read.test.ts` asserts that, if `vercel.json` schedules the job, the schedule matches
  `ACTIVITY_REFRESH_CADENCE`; it is a no-op while the entry is absent.
- `STALE_AFTER_MS` uses `ACTIVITY_REFRESH_CADENCE = 'hourly'` (2 h), the D78-4 choice. **If O78-1 says Hobby, set it to
  `'daily'` in `src/modules/analytics/activity/types.ts` together with the `30 0 * * *` entry.** Until the entry exists
  the job is not scheduled at all.
- The three read RPCs have no span guard (only `recompute_listing_activity` does); they are service-role only and called
  with validated periods.
- The backfill's DO block is one transaction: an error rolls back all chunks and leaves no failure row.

## Opus handoff

1. **R5 / O78-1:** the owner must answer in the sprint plan (or here). Then `vercel.json` gets one entry —
   `0 * * * *` (Pro) or `30 0 * * *` (Hobby, plus the constant flip) — and 849 can be re-verified for AC5.
2. Inspect the SQL closely, since nothing ran it: `search_path`, the `security invoker` functions reading
   `public.listings`, the `revoke … from public, anon, authenticated` lines, the `bigserial` sequence grant, and the
   `(p_to + 1)::timestamp at time zone 'Europe/Tirane'` bound.
3. Review deviation 2 and the `data_inconsistent` addition against R4/R7.
4. Owner-native evidence still due: AC2, AC3, AC6, AC7(c), and the first cron log line (`200`) after deploy.

## Backlog update

`docs/backlog.md` row "849–856": 849 marked `PARTIALLY IMPLEMENTED … awaiting Opus review`, next action O78-1 then O78-3.
Resulting physical line count **80** (unchanged; no `BACKLOG LIMIT BREACH`).

---

# Re-entry 2 — R5 / AC5 (remediation, kickoff §16.2/§16.3) — 2026-09-20

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Evidence root `docs/sessions/evidence/task849/reentry/`.
Preflight: `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` No visible
artifact, so GR-1/GR-3/GR-3a do not apply. Read-only git only; no AC4 plant re-run and no drift regeneration
(`src/types/database.ts` unchanged this session), per §16.3.

**O78-1 as quoted** (sprint plan `…Mantine.md:138`): *"✅ ANSWERED 2026-09-20 — "Hobby" (owner, verbatim)"*, with the
binding consequence `30 0 * * *` + `ACTIVITY_REFRESH_CADENCE` → `'daily'`.

## Files changed this session

| Path | Reason | Pre-edit hash | Final hash |
|---|---|---|---|
| `vercel.json` | + `{ "path": "/api/cron/listing-activity", "schedule": "30 0 * * *" }` (R5, Hobby fallback) | `de6b42c2…` | `3d30084c710d92d50f0fb26f6d5425d31d3366e8` |
| `src/modules/analytics/activity/types.ts` | `ACTIVITY_REFRESH_CADENCE = 'daily'` (→ `STALE_AFTER_MS` 26 h) **plus one consequential typing change (deviation below)** | `f94507d5…` | `5072d41c3f563140467bb944ade2534f53826e80` |
| `docs/backlog.md` | 849 fragment in the "849–856" row updated to the re-entry state (80 lines, unchanged) | — | — |
| `docs/sessions/…task849…md`, `docs/sessions/evidence/task849/reentry/*` | this report and evidence | — | — |

## Deviation — one edit beyond the two named in §16.2

Setting the constant to `'daily'` made `types.ts:20` (`ACTIVITY_REFRESH_CADENCE === 'hourly' ? 2 : 26`) fail
`npm run typecheck` with `TS2367` (control-flow narrowing of a `const` with a union annotation to `'daily'`). A first
repair using `typeof ACTIVITY_REFRESH_CADENCE` failed too (`TS2353`, it also resolves to the narrowed `"daily"`), so the
final form declares `type ActivityRefreshCadence = 'hourly' | 'daily'` once and uses it for the constant and for
`STALE_AFTER_HOURS: Record<ActivityRefreshCadence, number> = { hourly: 2, daily: 26 }`;
`STALE_AFTER_MS = STALE_AFTER_HOURS[ACTIVITY_REFRESH_CADENCE] * HOUR_MS`. Values are unchanged (2 h / 26 h); the only
behaviour change is the intended one. The file is one of the two §16.2 permits; the kickoff's "no other change" was
written for behaviour, not for this compile constraint. **Opus to confirm the deviation is acceptable.**

## Requirement / AC evidence

| Item | Evidence | State |
|---|---|---|
| R5 / AC5 | `vercel.json` now lists the entry with `30 0 * * *`, matching the O78-1 answer quoted above; `read.test.ts` "when vercel.json schedules the job, the schedule matches ACTIVITY_REFRESH_CADENCE" now asserts (entry present) and passes | met |
| R7 freshness threshold | `STALE_AFTER_MS` = 26 h from the same constant as R5; `read.test.ts` cadence + staleness-boundary cases pass | met |
| AC1–AC4, AC6, AC7 | closed in review 1 (§16.2), untouched | unchanged |

## Validation (final run, after the last source edit; each transcript unpiped with its own `EXIT_CODE=` line)

| Command | File | Exit |
|---|---|---|
| `node -p platform/version` | `00-platform.txt` | 0 |
| `npm run typecheck` | `01-typecheck.txt` | 0 |
| `npm run lint` | `02-lint.txt` | 0 |
| `npm run test -- src/app/api/cron/listing-activity/__tests__ src/modules/analytics/activity/__tests__` (2 files, 26 tests) | `03-test.txt` | 0 |
| `npm run build` | `04-build.txt` | 0 |
| `npm run check:file-integrity` (39 files) | `05-file-integrity.txt` | 0 |
| `npm run check:mojibake` (0 artifacts, 6307 files) | `06-mojibake.txt` | 0 |
| `git diff --stat -- vercel.json` (+4) | `07-diffstat.txt` | 0 |
| `git hash-object` of the seven §13.2 paths (+ `types.ts`) | `08-hashes.txt` | 0 |

Process notes: the first typecheck run exited 2 (the deviation above); the first file-integrity run exited 1 because
PowerShell 5.1 `>` wrote a UTF-8 BOM into my own nine evidence transcripts — repaired by a printed-manifest Node
rewrite limited to exactly those nine files, then `05`–`08` re-captured from Bash (no BOM). No product file was
affected. Final hashes: SQL daily `adfc56f9…`, backfill `483dac6d…`, verify `b85d1917…`, route `c97781be…`,
read.ts `9fd43d2b…`, types.ts `5072d41c…`, vercel.json `3d30084c…`.

## Opus handoff

1. Confirm the `types.ts` typing deviation.
2. Still owner-native and not exercisable from here: the first scheduled invocation's `200` line in Vercel → Cron Jobs
   → `/api/cron/listing-activity` → View Logs (window 01:30–03:30 Tirane after the next deploy).
3. `docs/sessions/evidence/task861/storybook-dev.log` is modified in the working tree but is not part of this task.

## Backlog update

849 fragment in the "849–856" row rewritten to `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, next action Opus re-review
then the first scheduled `200`. Physical line count **80** (unchanged; no `BACKLOG LIMIT BREACH`).
