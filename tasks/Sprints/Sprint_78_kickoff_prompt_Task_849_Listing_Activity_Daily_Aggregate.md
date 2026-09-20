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

## 16. Review 1 — `PARTIALLY VERIFIED`, 2026-09-20

Session log: `docs/sessions/2026-09-20-task849-listing-activity-daily.md`. Evidence root
`docs/sessions/evidence/task849/`. **Do not restart this task from scratch.** R1–R4 and R6–R9 were inspected against
the real files and are correct as written; the repo gate block (§13.2) exits 0 on every command and the AC4 plant is
two-armed with equal before/after hashes. What remains is listed below and nothing else.

### 16.1 Accepted deviations (no rework)

1. **`scripts/check-schema-drift.mjs` edited although §7 lists only the generated `scripts/schema-drift-check.sql`.**
   Accepted: that file is emitted by the generator from `INTERFACE_TABLE_MAP`, so R9 is unreachable without the two
   map entries. §7's file list is the defect, not the edit. §7 is amended: `scripts/check-schema-drift.mjs` is an
   **Edited** path.
2. **The route returns `500 { ok:false }` when the recompute succeeded but its `success` refresh row could not be
   stored.** R4 is silent on this branch. Accepted and now binding: freshness is read from
   `listing_activity_refresh`, so swallowing the insert failure would leave the dashboards reading a fresh aggregate
   as stale with no signal anywhere. R4 is amended to require this branch, and it is covered by
   `route.test.ts` → *"a refresh row that cannot be stored after a good recompute is a 500, not a silent success"*.
3. **`getPlatformActivitySeries` / `getOwnerActivitySeries` return `data_inconsistent` when the RPC does not return
   exactly `period.days` rows.** An addition beyond R7, kept: it is what makes §3.1's "`0` only after a successful
   aggregate read" observable, and it matches the SQL, whose `generate_series(p_from::timestamp, p_to::timestamp,
   interval '1 day')` always emits `to − from + 1` rows.
4. **`ACTIVITY_REFRESH_CADENCE` in `src/modules/analytics/activity/types.ts`** is R7's "same constant as R5", with a
   test that cross-checks it against `vercel.json` once an entry exists. Kept.
5. **`docs/env.md` not edited.** §7 required one line; `docs/env.md:17` already names
   `/api/cron/listing-activity (Task 849)`, written by 851. Verified in review; §7's row is satisfied.

### 16.2 What is still open

- **R5 / AC5 — UNBLOCKED 2026-09-20. O78-1 is answered: "Hobby"** (owner, verbatim; Vercel Settings → Cron Jobs
  screenshot shows the **Hobby** badge and *"Cron jobs on Hobby have a flexible time window of 1-hour"*). The
  executor's refusal to guess was correct behaviour. **The re-entry makes exactly two edits, in one commit:**
  1. `vercel.json` — add `{ "path": "/api/cron/listing-activity", "schedule": "30 0 * * *" }` to `crons`. This is
     D78-4's only permitted fallback; `0 * * * *` would fail **every** deployment on Hobby.
  2. `src/modules/analytics/activity/types.ts` — `ACTIVITY_REFRESH_CADENCE = 'daily'`, which moves `STALE_AFTER_MS`
     to 26 h with no other change.

  Nothing else may be touched. `read.test.ts`'s cadence test stops being a no-op at that point and asserts
  `30 0 * * *` against the constant, so the two cannot drift. Then re-run §13.2 in full and re-report.

  *Schedule sanity, recorded so the next session need not re-derive it:* 00:30 UTC plus Hobby's 1-hour window puts
  every run at 01:30–03:30 Tirane in CET and CEST alike — always **after** local midnight, so each completed Tirane
  day is still finalised while it is the run's `yesterday`. 26 h covers one daily run plus that window plus grace.
- **AC6 — VERIFIED 2026-09-20 by owner-native evidence, complete.** `scripts/task-849-backfill.sql`'s own trailing
  query returned all six rows (its `limit 6` is the whole set): ids 1–6, every one `status: success`,
  `job_version: '849.1-backfill'`, ranges contiguous and 30 days each — `2026-03-25 → 2026-04-23`,
  `04-24 → 05-23`, `05-24 → 06-22`, `06-23 → 07-22`, `07-23 → 08-21`, `08-22 → 09-20`. That is exactly the 180
  Tirane days ending today, in six chunks, one refresh row per chunk: R6 and AC6 as written. `rows_written`
  0 / 0 / 2 / 6 / 4 / 27 (39 total) — monotonically rising toward the present, which is what a real listing
  population produces. All six share one `ran_at`, confirming the documented single-transaction DO block.
  This also proves R1–R2 applied cleanly to the live database: both tables, `recompute_listing_activity` and the
  service-role grants exist and executed, and the function's range/span guards did not reject a 30-day chunk.
- **AC7(c) — VERIFIED 2026-09-20, owner-native.** The consolidated grid returned, against the live database:
  `anon_select_daily`, `authenticated_select_daily`, `anon_select_refresh`, `authenticated_select_refresh`,
  `authenticated_exec_recompute`, `anon_exec_platform_series`, `authenticated_exec_owner_series` all **false**;
  `service_role_select_daily`, `rls_daily`, `rls_refresh` all **true**. R1's grant discipline and the no-policy RLS
  lockdown hold in the real schema, for the tables **and** the functions. These facts are independent of how much
  data the tables hold, so this criterion is closed outright.
- **Read-function execution — VERIFIED 2026-09-20, owner-native (review-1 part (e), added because nothing had ever
  executed R3).** `listing_activity_platform_series` and `listing_activity_owner_series` each returned **exactly 7**
  rows for a 7-day range, so the SQL's `generate_series` row count equals `period.days` and `read.ts:59`'s
  `data.length !== period.days` guard will not fail every block closed — the failure mode that would have silently
  broken 855/856. `listing_activity_owner_by_listing` returned **4** rows for one real owner over 180 days, which
  also exercises the `listings.user_id` join and the `having … > 0` filter against real backfilled data.
- **AC2 — VERIFIED 2026-09-20, owner-native, two-armed.** The first attempt sampled yesterday, which has zero rows,
  and compared `0 = 0`; that was recorded as a **vacuous pass, not evidence**, and re-run against the busiest real
  day, **2026-09-10** (6 listing rows, 12 recorded views). *Passing arm:* two consecutive recomputes agreed on all
  four aggregates (`row_count` 6 = 6, `recorded_views` 12 = 12, clicks 0 = 0, inquiries 0 = 0). *Failing arm:* the
  day was deliberately corrupted — `+1000` views and `+1000` clicks on each of the 6 rows plus one phantom row
  (777/777/777) for a listing with **no** events that day — and the total moved to **6789**, which is exactly
  `12 + 6×1000 + 777`, so the plant demonstrably fired. A third recompute restored `row_count` 6, `recorded_views`
  12, clicks 0, inquiries 0. That erasure of the phantom row is the load-bearing part: it proves the function's
  `delete … where metric_date between p_from and p_to` clears **every** row for the range, not merely the rows its
  own key set would rebuild. R2's "recompute day, never increment" holds against the live database.
- **AC3 — VERIFIED on all three metrics, each on its own busiest day.** The first pass closed only
  `recorded_views`; the other two were `0 = 0` on that day and were **not** recorded as closed. Re-targeted per
  metric, the aggregate matched the raw tables exactly:
  - `recorded_views` — **2026-09-10**, 12 = 12, **`per_listing_mismatches` = 0** across all 6 listings. Meaningful
    in both directions: the recompute filters on half-open `timestamptz` bounds (`viewed_at >= v_start and
    < v_end`) while the check filters on the direct `(viewed_at at time zone 'Europe/Tirane')::date` cast — two
    different expressions agreeing on 12 events is real evidence that §3's UTC-bounds arithmetic is correct.
  - `whatsapp_clicks` — **2026-09-11**, 2 = 2.
  - `listing_inquiry_submissions` — **2026-07-30**, 1 = 1.

  Table populations at the time of measurement: `listing_views` 53, `listing_contact_events` 4,
  `listing_inquiries` 1. Small, but no longer vacuous: every metric is now compared against a non-zero row set.
- **The `is_owner_click = false` exclusion — VERIFIED 2026-09-20, owner-native, three arms plus a positive
  control.** It was the last unexercised predicate in R2: every real sample contained **zero** owner clicks, so
  `agg = raw` would have held whether or not the filter existed, and no repo test can reach it because the vitest
  suites mock the database away. Closed with a net-zero probe on 2026-09-11 (baseline 2): an existing event cloned
  as `is_owner_click = true` left the count at **2** — the exclusion holds; **the same row** flipped to `false`
  raised it to **3** — the positive control, which is what makes the first arm meaningful, since it proves the
  silence came from the flag and not from the row being uncountable for an unrelated reason; deleting it returned
  the count to **2** and `listing_contact_events` to its original **4** rows. The probe ran as one transaction and
  left no residue. D78-1's rule that an agent's own WhatsApp taps must not inflate their statistics is enforced by
  the SQL, and now measured.

**With that, every acceptance criterion except AC5 is verified.** R1–R4 and R6–R9 are complete and evidenced;
AC1/AC2/AC3/AC4/AC6/AC7 are closed, the last four on owner-native output from the live database. **AC5 is the only
thing between this task and approval**, and it is the two-edit re-entry above.
- **The first scheduled invocation's `200` log line**, after O78-1 is answered and the entry deployed.

### 16.3 Re-entry mode

`remediation`. Preserve every artifact under `docs/sessions/evidence/task849/`; do not re-run the AC4 plant or
regenerate `scripts/schema-drift-check.sql` unless `src/types/database.ts` changes again. The only source edits the
re-entry may make are the two named in §16.2's first bullet.
