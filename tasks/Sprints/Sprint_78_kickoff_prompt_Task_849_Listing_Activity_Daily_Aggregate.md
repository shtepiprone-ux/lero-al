# Task 849 — `listing_activity_daily`: an idempotent daily aggregate of views, WhatsApp clicks and form inquiries, refreshed by `GET /api/cron/listing-activity`

Sprint 78 · P1 · QA profile **Q4** (new table, RLS, scheduled write path) · Wave B · depends on **851** approved
(shared cron auth helper, `vercel.json` edited first) and **846** approved (`period.ts`) and owner action **O78-1**
(Vercel plan) · **Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md). **D78-1:** the
aggregate is in scope. **D78-4** (owner, 2026-09-18, verbatim): *"перечитай інформацію тут
https://vercel.com/docs/cron-jobs, після чого необхідно буле обрати варіант, в пріоритеті авжеж
/api/cron/listing-activity зі schedule щогодини; ідемпотентний перерахунок сьогодні+вчора."*

## 1. Mode and task type

`IMPLEMENTATION` — schema (SQL script the owner applies), SQL functions, a cron route, a backfill script, and
server-only read helpers with tests. Bundles: **Schema / Migration** + **DB / Server Action / RLS**.

## 2. Objective

Spec §5 and §9.1 say the per-period series of views, WhatsApp clicks and form inquiries **need a new aggregate**.
`listings.views_count` is lifetime-only and is forbidden as a period series. After this task:

1. `public.listing_activity_daily` holds one row per `(listing_id, metric_date)`, where `metric_date` is a
   **Europe/Tirane** date, with `recorded_views`, `whatsapp_clicks` (excluding owner clicks) and
   `listing_inquiry_submissions`. It is readable only by the service role.
2. `public.recompute_listing_activity(p_from date, p_to date)` recomputes those days **idempotently**: after it runs,
   the rows for the range equal the counts in the raw tables, whether it ran once, twice, or after a missed run. It
   uses a transaction-scoped advisory lock, so two overlapping invocations cannot interleave (Vercel docs: delivery
   is best effort, can duplicate, and can overlap).
3. `GET /api/cron/listing-activity` authenticates through 851's helper (fails closed), recomputes **yesterday and
   today** (Tirane), writes a row to `public.listing_activity_refresh` (success or failure, with job version and
   counts), and returns JSON.
4. `vercel.json` schedules it per O78-1: `0 * * * *` (Pro) or, only if the owner records that the project is on
   Hobby, `30 0 * * *`.
5. A backfill script recomputes the last 180 Tirane days once.
6. Server-only read helpers return the admin platform series (ADM-10), the owner per-date series and per-listing sums
   (AGT-03/04/05/10/11), and freshness (last successful refresh, stale flag). 855/856 consume them.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- **Sources** (`src/types/database.ts`):
  - `listing_views` (`:328-334`): `id, listing_id, user_id, ip_hash, viewed_at`. Written only by the
    `record_listing_view` RPC (`src/app/api/listings/[slug]/view/route.ts:60`), which dedups over 24 hours and
    excludes owner self-views and bots at the app layer.
  - `listing_contact_events` (`:295-305`): `listing_id, listing_owner_id, actor_user_id, channel ('whatsapp'), source,
    locale, is_owner_click, created_at`.
  - `listing_inquiries` (`:78-88`): `listing_id, listing_owner_id, …, created_at`.
- **SQL delivery convention:** there is no `supabase/` directory. SQL ships as `scripts/task-NNN-*.sql` and the owner
  applies it (e.g. `scripts/task-277-listing-contact-events.sql`, grants at its lines 19-33). Schema drift is tracked by
  `scripts/schema-drift-check.sql` + `npm run check:schema-drift`.
- **Cron today:** `vercel.json` has four daily crons. All four routes export only `POST`, and their secret check is
  fail-open (`if (cronSecret) { … }`). 851 fixes both and extracts `src/lib/cron/verifyCronRequest.ts`; this task
  **reuses** that helper.
- **Vercel docs, read 2026-09-18:** cron = HTTP `GET` to the production URL; `CRON_SECRET` is sent as
  `Authorization: Bearer <secret>`; Hobby = once per day minimum, and a more frequent expression **fails deployment**;
  Pro = per minute; no retries; possible duplicate or overlapping runs → idempotent and reconciliation-based, with a
  lock.
- **Time zone:** `Europe/Tirane` (valid IANA id; `'Europe/Tirana'` is rejected by Node — see 846 §3 and reserved 860).
  In Postgres use `(ts AT TIME ZONE 'Europe/Tirane')::date`.
- `period.ts` (846) supplies `tiraneDateOf`, `tiraneYesterday` and `resolvePeriod`.

### 3.1 Spec rules restated (v3.3 §9.1, §5, §4)

- One row per listing + metric_date; composite unique `(listing_id, metric_date)`.
- `recorded_views` = accepted `listing_views.viewed_at` on that Tirane date — never `listings.views_count`.
- `whatsapp_clicks` = `listing_contact_events` with `channel='whatsapp' AND is_owner_click = false`.
- `listing_inquiry_submissions` = stored `listing_inquiries.created_at` rows; email success is irrelevant.
- Chat columns only after Task 342. **Not added** here (D78-1); the table is extensible later.
- Keep `updated_at` and the job version for observability. The job is idempotent ("recompute day", never increment).
- Backfill only within an approved retention window. Then hourly upserts for the current and previous day, to absorb
  late writes.
- The dashboard never reads the aggregate client-side.
- `0` only after a successful aggregate read. If the job lags, show the last refresh time and a warning, never a stale
  value as current.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | spec §9.1 | `scripts/task-849-listing-activity-daily.sql` creates `public.listing_activity_daily (listing_id uuid not null references public.listings(id) on delete cascade, metric_date date not null, recorded_views integer not null default 0 check (>= 0), whatsapp_clicks integer not null default 0 check (>= 0), listing_inquiry_submissions integer not null default 0 check (>= 0), updated_at timestamptz not null default now(), job_version text not null, primary key (listing_id, metric_date))` + index on `(metric_date)`; and `public.listing_activity_refresh (id bigserial pk, ran_at timestamptz not null default now(), from_date date not null, to_date date not null, status text not null check (status in ('success','failure')), rows_written integer, job_version text not null, error text)`. Both: `enable row level security`, **no** policy for `anon`/`authenticated`, `revoke all … from anon, authenticated`, `grant select, insert, update, delete … to service_role` (Task 277/289 grant discipline). The script is idempotent (`create … if not exists`, `drop policy if exists`). | P0 | AC1, AC7 | Confirmed |
| **R2** | spec §9.1, Vercel docs | `public.recompute_listing_activity(p_from date, p_to date, p_job_version text) returns integer` (`language plpgsql`, `security invoker`, `execute` granted to `service_role` only, revoked from `public`/`anon`/`authenticated`): takes `pg_advisory_xact_lock(<documented constant>)`; rejects `p_to < p_from` or a span > 400 days with an exception; for the range, **deletes** existing rows and **inserts** the recomputed counts per `(listing_id, Tirane date)` from the three sources (full outer merge, so a listing with only one kind of event still gets a row), in one transaction; returns rows written. Running it twice yields identical table contents. | P0 | AC2, AC7 | Confirmed |
| **R3** | spec §9.1 | Read functions (same grant discipline): `listing_activity_platform_series(p_from, p_to)` → `(metric_date, recorded_views, whatsapp_clicks, listing_inquiry_submissions)` summed across listings, **one row per date in the range including zero days** (`generate_series`); `listing_activity_owner_series(p_owner uuid, p_from, p_to)` → the same, restricted to `listings.user_id = p_owner`; `listing_activity_owner_by_listing(p_owner uuid, p_from, p_to)` → `(listing_id, recorded_views, whatsapp_clicks, listing_inquiry_submissions, last_activity_date)` for the owner's listings with any activity in the range. | P1 | AC3, AC7 | Confirmed |
| **R4** | D78-4, Vercel docs | `src/app/api/cron/listing-activity/route.ts` exports **`GET`** only. It authenticates with 851's `verifyCronRequest` (401 without or with a wrong secret, and 401 when `CRON_SECRET` is unset — fail closed). It computes `from = tiraneYesterday(now)`, `to = tiraneDateOf(now)` and calls `recompute_listing_activity` through `createAdminClient().rpc`. On success it inserts a `success` refresh row and returns `200 { ok: true, from, to, rowsWritten, jobVersion }`. On an RPC error it inserts a `failure` refresh row (the error message truncated to 500 chars) and returns `500 { ok: false }`. `JOB_VERSION` is a string constant in the route (`'849.1'`). `export const dynamic = 'force-dynamic'`. | P0 | AC4 | Confirmed |
| **R5** | D78-4, O78-1 | `vercel.json` gains `{ "path": "/api/cron/listing-activity", "schedule": "0 * * * *" }` **only if** the Sprint 78 plan file's O78-1 row records the owner's answer "Pro". If it records "Hobby", the schedule is `"30 0 * * *"` and the route comment says why. If O78-1 is unanswered, the executor does **not** edit `vercel.json` and returns `PARTIALLY IMPLEMENTED` naming O78-1. | P0 | AC5 | Confirmed |
| **R6** | spec §9.1 backfill | `scripts/task-849-backfill.sql` calls `recompute_listing_activity` in 30-day chunks covering the 180 Tirane days ending today, with `job_version = '849.1-backfill'`, and inserts a `listing_activity_refresh` row per chunk. 180 = the 90-day maximum custom range + its equal previous period. INFERENCE, reversible: re-running with another window is safe because the function is idempotent. | P1 | AC6 | Confirmed |
| **R7** | spec §4, §9.1, §10 | `src/modules/analytics/activity/read.ts` (`server-only`, admin client) exports `getPlatformActivitySeries(period)`, `getOwnerActivitySeries(ownerId: AgentOwnerId, period)`, `getOwnerActivityByListing(ownerId: AgentOwnerId, period)` and `getActivityFreshness(now)`. Each returns `BlockResult` (847). Freshness = the latest `success` refresh `ran_at` and `stale = now − ran_at > STALE_AFTER_MS`, where `STALE_AFTER_MS` = 2 h for the hourly schedule or 26 h for the daily schedule, chosen from the same constant as R5. No row in the table for a date = `0` **only** when the RPC itself succeeded. | P1 | AC3, AC4 | Confirmed |
| **R8** | tests | `src/app/api/cron/listing-activity/__tests__/route.test.ts`: GET without secret / wrong secret / unset env → 401 and **no** RPC call; happy path → RPC called with `('2026-09-17','2026-09-18','849.1')` for `now` = 2026-09-18 10:00 UTC, and with `('2026-09-18','2026-09-19', …)` for `now` = 2026-09-18 22:30 UTC; RPC error → 500 + a failure refresh insert. `src/modules/analytics/activity/__tests__/read.test.ts`: series pass through; RPC error → `ok:false`; staleness boundary. | P0 | AC4 | Confirmed |
| **R9** | drift discipline | `scripts/schema-drift-check.sql` lists the two new tables' columns, following that file's existing section format. | P2 | AC7 | Confirmed |

## 5. Assumptions and open questions

- **O78-1** (Vercel plan) must be answered in the sprint file before R5; everything else can land first.
- **O78-3** — the owner applies the SQL, runs the backfill once, and confirms the first scheduled run. Until then 855
  cannot start (sprint Wave D gate).
- `listing_views` rows are already "accepted" views (dedup + bot/owner exclusion happen before insert), so counting
  rows is the spec's "recorded view". INFERENCE from `view/route.ts:19-66`; if `record_listing_view` also inserts
  suppressed views with a flag, report it (the executor reads the function's SQL if the owner can supply it; otherwise
  record UNKNOWN).
- The advisory-lock constant is an arbitrary 64-bit integer, documented in the SQL with the task number.
- No owner decision beyond O78-1 is needed.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (1–6a, 9, 10, 14, 15) · `docs/qa-profiles.md` ·
`docs/data-access-rules.md` · `docs/rls-rules.md` · `docs/domain-rules.md` · `docs/architecture.md` · `docs/env.md`
(`CRON_SECRET`) · `docs/integrations.md` (Supabase) · `docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md` ·
kickoffs 846, 847, 848 (types), 851 (helper).

## 7. Scope

- **Created:** `scripts/task-849-listing-activity-daily.sql` · `scripts/task-849-backfill.sql` ·
  `scripts/task-849-verify.sql` (owner-run verification queries, §13.3) · `src/app/api/cron/listing-activity/route.ts`
  · its `__tests__/route.test.ts` · `src/modules/analytics/activity/read.ts` · its `__tests__/read.test.ts` ·
  `src/modules/analytics/activity/types.ts`.
- **Edited:** `vercel.json` (one entry, per R5) · `scripts/schema-drift-check.sql` · `src/types/database.ts` (row types
  for the two tables, following the file's style) · `docs/env.md` (one line: `CRON_SECRET` is also used by
  `/api/cron/listing-activity`) · `docs/backlog.md` (849 line).

## 8. Out of scope

Chat columns (Task 342) · `listing_status_events` · any UI (855/856) · the event write paths (850 changes WhatsApp
writes; this job only reads) · the four existing crons (851).

## 9. Current and required behavior

**Before.** No per-day activity exists; only lifetime `views_count` and raw event rows. **After.** Hourly (or daily
per O78-1) recompute keeps a Tirane-dated aggregate; read helpers expose it with freshness; nothing visible changes.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes; confirm 851 is approved and `src/lib/cron/verifyCronRequest.ts`
   exists; read O78-1 in the sprint file and record it; re-read §3's lines.
2. Tests first (R8), red → green.
3. SQL per R1–R3. Every statement idempotent. A header comment names the task, the owner-apply procedure and the
   rollback (`drop function …; drop table …`).
4. Route per R4; read helpers per R7.
5. `vercel.json` per R5.
6. `scripts/task-849-verify.sql`: (a) run the recompute for yesterday twice and compare
   `count(*), sum(recorded_views), sum(whatsapp_clicks), sum(listing_inquiry_submissions)` between runs; (b) compare
   yesterday's aggregate sums with direct counts from the three raw tables using the same Tirane cut; (c) confirm
   `has_table_privilege('authenticated', 'public.listing_activity_daily', 'select')` is false; (d) show the latest 3
   refresh rows.

## 11. Positive and negative flows

**Positive.** At 10:00 Tirane the cron fires. The route recomputes 17 and 18 September, writes 1 240 rows and a
success refresh row, and `getActivityFreshness` reports `stale:false`.

| Negative flow | Applicable | Expected |
|---|---|---|
| Missing or wrong secret, or env unset | Yes | 401, no RPC, no refresh row. |
| Duplicate invocation | Yes | The advisory lock serializes; the second run rewrites identical rows. |
| Missed run | Yes | The next run recomputes yesterday + today; older days stay as last computed (the backfill covers history). |
| RPC failure | Yes | 500 + a failure refresh row; freshness keeps the last success → stale after the threshold. |
| Owner self-click | Yes | Excluded (`is_owner_click = false`). |
| Listing deleted | Yes | Cascade removes its rows. |
| Client read attempt | Yes | RLS + grants: `authenticated` cannot select (verify (c)). |
| Hobby plan with hourly entry | Yes (prevented) | R5 refuses without O78-1. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the SQL script, when read, then it contains the columns, keys, checks, `enable row level
  security`, the revokes and the service-role grant of R1, and every `create` is `if not exists`. Quote each statement's first line.
- **AC2 [R2]** — Given the owner's run of `scripts/task-849-verify.sql` part (a), when the two runs are compared, then
  all four aggregates are equal. Owner-native evidence (§13.3).
- **AC3 [R3, R7]** — Given the owner's run of part (b), when compared, then each aggregate sum equals the raw count for
  that Tirane date; and `read.test.ts` passes.
- **AC4 [R4, R7, R8]** — Given `npm.cmd run test -- src/app/api/cron/listing-activity/__tests__ src/modules/analytics/activity/__tests__`,
  when run, then all pass, including the 22:30 UTC date case. Given a plant that makes the route skip the secret
  check, when re-run, then the 401 cases fail; the plant is reverted with an equal hash.
- **AC5 [R5]** — Given `vercel.json`, when read, then the new entry's schedule matches the O78-1 answer quoted in the
  session log, or the file is unchanged and the status is `PARTIALLY IMPLEMENTED`.
- **AC6 [R6]** — Given the backfill script, when read, then it covers 180 days in 30-day chunks with the backfill
  job version; the owner's run output shows one success row per chunk.
- **AC7 [R1-R3, R9]** — Given the owner's run of part (c), when read, then `authenticated` has no select privilege; and
  `npm.cmd run check:schema-drift` exits 0 against the updated drift file (or, if it needs a live DB, the owner runs it
  and returns the output).

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: AC2's equality is the idempotency definition; AC7's "no select privilege" is the RLS requirement itself.`

GR-1 / GR-3 / GR-3a: **not applicable** — no visible artifact.

## 13. QA profile and verification plan

**`Q4`** — new table + RLS + a scheduled write path. Required: a changed-behaviour test, a planted violation for the
auth gate (AC4), and owner-native DB evidence (AC2, AC3, AC6, AC7).

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task849/`.

### 13.2 Final gate block (executor)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- src/app/api/cron/listing-activity/__tests__ src/modules/analytics/activity/__tests__
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks hash-object scripts/task-849-listing-activity-daily.sql scripts/task-849-backfill.sql scripts/task-849-verify.sql src/app/api/cron/listing-activity/route.ts src/modules/analytics/activity/read.ts vercel.json
```

Expected: every command exits 0.

### 13.3 Owner-native DB verification (O78-3)

The owner runs these in the Supabase SQL editor, in order, and returns each result grid:

1. the contents of `scripts/task-849-listing-activity-daily.sql`;
2. the contents of `scripts/task-849-backfill.sql`;
3. the contents of `scripts/task-849-verify.sql`.

After the next deploy, the owner opens Vercel → Cron Jobs → `/api/cron/listing-activity` → View Logs and returns the
first invocation's status line (expected `200`).

## 14. Completion report contract

Files with hashes · R1–R9 · AC1–AC7 (AC2/3/6/7 marked **owner-native pending** until returned) · commands with exit
codes · the O78-1 answer as quoted · plant transcript · assumptions · deviations · limitations. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (with owner-native items listed), `PARTIALLY IMPLEMENTED` or `BLOCKED`.
No self-approval, no mutating git. Update the 849 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Idempotent and lock-protected per the Vercel docs? | R2 + AC2. |
| Fail-closed auth? | R4 via 851's helper + AC4 plant. |
| Hobby risk controlled? | R5 refuses without O78-1. |
| No client access? | R1 grants + AC7. |
| No lifetime counter used as a series? | §3.1 + R1 sources. |
| Commands in blocks | §13.2; owner SQL steps listed in §13.3. |
