# Task 847 — the admin dashboard's server data layer: one typed result per block, errors never read as 0

Sprint 78 · P1 · QA profile **Q1** · Wave B · depends on **846** approved (`src/lib/dashboard/period.ts`) ·
**Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md). D78-1 keeps
ADM-03/04/05 (reviews, chat) and ADM-07 (verification) **out**; ADM-10 is 855's.

## 1. Mode and task type

`IMPLEMENTATION` — server-only query module and pure helpers with unit tests. No UI. Bundles: **DB / Server Action /
RLS** (read-only) + **Admin Table / Admin Control** (read side).

## 2. Objective

Create `src/modules/admin/dashboard/` to replace the ad-hoc `getStats()` in `src/app/admin/page.tsx:12-72` (853 then
switches the page to it). It returns one `BlockResult` per spec block, so a failing query fails **its own block**
and never becomes `0` (spec §4, §11). It fetches everything in parallel with explicit column lists (spec §10). It uses
the canonical visibility helpers for ADM-08/09/11 (critical flow "Listing public visibility invariant"). It also
builds every drill-down `href` in one place.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- `src/app/admin/page.tsx:12-72` today: 14 parallel queries through `createAdminClient()`. It **ignores every
  `error`** (it destructures only `count`/`data`, so a failed query renders `0`). It counts "active" as raw
  `.eq('status','active')` (`:34`). It uses `select('*', { count: 'exact', head: true })`. `weekAgo` is a UTC
  `Date.now() - 7d` (`:14`).
- Access: `src/app/admin/layout.tsx` redirects unless `users.role` is `admin` or `moderator`; the page uses
  `createAdminClient()` (service role, server-only). The spec (§6, §10) keeps that: dashboard aggregates are
  server-only, with no client API. The layout gate is unchanged by this task.
- Canonical visibility (`src/modules/listings/lib/visibility.ts`): `applyPublicVisibility(query)` (`:99`) =
  `status in eligible` + `expires_at >= now`; `applyPublicEligibleButHidden(query, { reason?: 'expired' | 'no_expiry' })`
  (`:138`). `PUBLIC_VISIBLE_STATUSES` (`:15`) makes only `active` eligible. Critical-flow row "Listing public
  visibility invariant" (`docs/critical-flow-registry.md:70`): regression command
  `npx vitest run src/modules/listings/lib/__tests__/visibility.test.ts` + `npm run check:listing-visibility`.
- Types (`src/types/database.ts`): `ListingStatus` = 7 values (`:43`). Listings carry `user_id`, `status`,
  `expires_at`, `created_at`, `title`, `slug`, and **no `deleted_at`** field in the type (`:237-282`).
  `ReportStatus` = `pending | reviewed | resolved | dismissed` (`:49`). `listing_reports`: `id, listing_id, user_id,
  reason, comment, status, created_at` (`:365`). `TicketStatus` = `open | in_progress | resolved | closed` (`:46`).
  `support_tickets`: `id, status, assigned_to, created_at, ticket_type ('support' | 'user_complaint'), updated_at, …` (`:413`).
- Existing drill-down targets:
  - `/admin/listings` reads `?status=` and `?visibility=hidden_eligible&reason=expired|no_expiry`
    (`src/app/admin/listings/page.tsx:18-25, :87-103`). It has **no** `visibility=visible`, which is reserved **857**.
  - `/admin/listings/[id]/preview` exists (staff preview).
  - `/admin/reports` and `/admin/support` read **no** URL params (`page.tsx` of each). The filtered landings are
    reserved **858**/**859**; until they land, the links carry the params and land unfiltered.
- The current page's "location requests" panel (`page.tsx:57-63`) is an actionable staff queue that the spec does not
  mention. It is **preserved** (agent-contract 3) and is read by this module.

### 3.1 Spec rules restated (v3.3 §6, §10, §17.2)

| Block | Rule |
|---|---|
| **ADM-01** | count `listings.status='pending'`; list the 5 oldest (`created_at ASC, id ASC`): `id, title, slug, created_at`, author display name. No period. Row target: `/admin/listings/{id}/preview`; card target `/admin/listings?status=pending`. |
| **ADM-02** | value = count `listing_reports.status='pending'`; secondary = count `status='reviewed'` (a separate query, **never summed**); list the 5 oldest pending: `reason`, listing `title`, `created_at`, `status`. **Never select `comment`** (complaint text stays out until the case is opened). Target `/admin/reports?status=pending`. |
| **ADM-06** | count `support_tickets` with `status in ('open','in_progress') AND assigned_to IS NULL`; separately count `status='in_progress' AND assigned_to IS NULL` as a **data anomaly**, not mixed in; list the 5 oldest unassigned: `ticket_type, created_at, status`. No SLA. Target `/admin/support?assigned=unassigned&status=open,in_progress`. |
| **ADM-08** | count through `applyPublicVisibility` — never re-implement the predicate. Target `/admin/listings?visibility=visible` (857). |
| **ADM-09** | total and two sub-counts through `applyPublicEligibleButHidden(q, { reason: 'no_expiry' })` and `(…, { reason: 'expired' })`. Targets: the existing `/admin/listings?visibility=hidden_eligible&reason=…`. |
| **ADM-11** | segments `pending, visible, active_hidden, inactive, sold, rented, archived, expired`, where `visible` = ADM-08 and `active_hidden` = ADM-09 total. Raw `active` is **never** a segment. Total = the sum of the segments. Assert in a test that `visible + active_hidden` equals the raw active count; if a live query ever disagrees, return a `data_inconsistent` error for that block rather than a wrong donut. Targets: `?status=<s>`; `visible` → 857's URL; `active_hidden` → `visibility=hidden_eligible`. |
| Recent listings | 8 newest, context only (§6.1 item 6): `id, slug, title, status, is_premium, price, currency, created_at`, owner name. Unchanged from today. |
| Location requests | preserved as today (`page.tsx:57-63`), count + 5 rows. |
| All | explicit `select` columns, no `select('*')` (§10); independent counts in parallel (`Promise.all`), no N+1; `refreshedAt` = the server time of the fetch, returned for the header. |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | spec §4, §11 | `type BlockResult<T> = { ok: true; data: T } \| { ok: false; error: 'query_failed' \| 'data_inconsistent' }`, in `src/lib/dashboard/blockResult.ts` (shared with 848). Any Supabase `error` or thrown exception in a block's queries yields `ok:false` for **that block only** and `console.error('[AdminDashboard] <block> failed', …)` with the Supabase error code. Other blocks are unaffected. | P1 | AC1, AC2 | Confirmed |
| **R2** | §3.1 | `getAdminDashboardData()` in `src/modules/admin/dashboard/queries.ts` (`import 'server-only'`) returns `{ refreshedAt, adm01, adm02, adm06, adm08, adm09, adm11, recentListings, locationRequests }` with the shapes of §3.1. Every select lists its columns. | P1 | AC1, AC3 | Confirmed |
| **R3** | critical flow, spec ADM-08/09/11 | ADM-08/09/11 use `applyPublicVisibility` / `applyPublicEligibleButHidden` only. No `'active'` string literal or `expires_at` comparison appears in `queries.ts` **except** the one raw-active count used for R2's consistency check of ADM-11, which carries a comment naming that purpose. | P0 | AC4 | Confirmed |
| **R4** | spec §6.1, §16.4 | `src/modules/admin/dashboard/hrefs.ts` builds every target of §3.1 through `URLSearchParams` (no string-concatenated query). A unit test pins each href. | P1 | AC5 | Confirmed |
| **R5** | privacy (spec §4, ADM-02) | No query in the module selects `listing_reports.comment`, user email, phone or any verification document field. | P0 | AC6 | Confirmed |
| **R6** | tests | `src/modules/admin/dashboard/__tests__/queries.test.ts` mocks `@/lib/supabase/admin` (follow the mocking style of `src/app/api/cron/listings-expiry/__tests__/route.test.ts`) and proves: (a) all-success shapes; (b) one block's query returning `{ error }` → only that block `ok:false`, others `ok:true`; (c) the ADM-02 value excludes `reviewed`; (d) ADM-06's anomaly count is separate; (e) ADM-11 has no `active` segment and equals the segment sum; (f) R3 by asserting the visibility helper was called (spy on the module). | P1 | AC1, AC2 | Confirmed |

## 5. Assumptions and open questions

- **Listings have no soft delete in the type** (§3), so "non-deleted listings" (spec ADM-11) = all rows. The executor
  confirms with `git grep -n "deleted_at" -- scripts/*.sql` touching `listings`. If a listings soft-delete column
  exists in SQL, report it and filter it (`is('deleted_at', null)`); do not guess.
- The 857–859 landings are reserved, not blockers; the hrefs are final either way.
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (1–6a, 9, 10, 14, 15) · `docs/qa-profiles.md` ·
`docs/data-access-rules.md` · `docs/rls-rules.md` · `docs/domain-rules.md` · `docs/admin-ux-rules.md` ·
`docs/critical-flow-registry.md` (visibility row) · `docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md` ·
kickoff 846 §4 (period API).

## 7. Scope

- **Created:** `src/lib/dashboard/blockResult.ts` · `src/modules/admin/dashboard/queries.ts` ·
  `src/modules/admin/dashboard/hrefs.ts` · `src/modules/admin/dashboard/types.ts` ·
  `src/modules/admin/dashboard/__tests__/queries.test.ts` · `src/modules/admin/dashboard/__tests__/hrefs.test.ts`.
- **Edited:** `docs/backlog.md` (847 line).

## 8. Out of scope

`src/app/admin/page.tsx` (853 switches it) · any UI · ADM-03/04/05/07/10 · `visibility.ts` (read-only consumer) ·
the target pages (857–859) · RLS/SQL.

## 9. Current and required behavior

**Before.** A failed Supabase query renders `0` on `/admin`; "active" counts expired rows. **After.** A module exists
that returns honest per-block results. `/admin` itself is unchanged until 853.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; re-read §3's cited lines and record any drift; run
   `npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts` and `npm.cmd run check:listing-visibility`
   (baseline).
2. Tests first (R6), red → green, both transcripts retained.
3. Implement per R1–R5. Author display name: `owner:users!listings_user_id_fkey(name, last_name)`, joined into one
   string by a helper, `—` when empty. The FK name is copied from `page.tsx:48`; confirm it at I0.
4. `import 'server-only'` at the top of `queries.ts`. INFERENCE: the package is available because Next ships it. If
   `npm.cmd ls server-only` shows it is not resolvable, report it and use the project's existing server-only
   convention instead.

## 11. Positive and negative flows

**Positive.** With 12 pending listings, 3 pending + 2 reviewed reports, 4 unassigned tickets, 900 visible, 40
active-hidden (25 expired, 15 no expiry): ADM-01 = 12 with 5 rows; ADM-02 = 3 (secondary 2); ADM-06 = 4; ADM-08 =
900; ADM-09 = 40 (25/15); ADM-11 has 8 segments summing to the total.

| Negative flow | Applicable | Expected |
|---|---|---|
| One query errors | Yes | That block `ok:false`; the rest `ok:true` (test b). |
| All queries error | Yes | Every block `ok:false`; the function still resolves (no throw). |
| Empty queue | Yes | `ok:true`, count 0, rows `[]` — a real zero. |
| ADM-11 inconsistency | Yes | `ok:false, error:'data_inconsistent'` for ADM-11 only. |
| Authorization | Yes (preserved) | Layout gate unchanged; module is `server-only`, so it cannot be imported by a client component (build fails). |
| Concurrency / writes | No | Read-only. |

## 12. Acceptance criteria

- **AC1 [R1, R2, R6]** — Given `npm.cmd run test -- src/modules/admin/dashboard/__tests__`, when run, then all pass and
  the transcript names cases (a)–(f).
- **AC2 [R1]** — Given a temporary plant that turns `queries.ts`'s error handling into `data ?? 0`-style swallowing for
  ADM-01, when the tests re-run, then case (b) fails. The plant is reverted, and the file's `git hash-object` equals its
  pre-plant value.
- **AC3 [R2]** — Given `git --no-optional-locks grep -n -E "select\('\*'|select\(\"\*\"" -- src/modules/admin/dashboard`,
  when run, then it prints nothing.
- **AC4 [R3]** — Given `git --no-optional-locks grep -n -E "'active'|expires_at" -- src/modules/admin/dashboard/queries.ts`,
  when run, then the only hits are the commented raw-active consistency count; and the visibility regression command
  and `check:listing-visibility` exit 0.
- **AC5 [R4]** — Given `hrefs.test.ts`, when run, then every §3.1 target is pinned and passes.
- **AC6 [R5]** — Given `git --no-optional-locks grep -n -E "comment|email|phone|document_url" -- src/modules/admin/dashboard/queries.ts`,
  when run, then it prints nothing.
- **AC7 [all]** — Given the §13.2 block, when run, then typecheck, lint and build exit 0.

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: AC3/AC6 empty greps define "explicit columns" and "no PII column" on the new module only; AC4's single allowed hit is named.`

GR-1 / GR-3 / GR-3a: **not applicable** — no visible artifact (data-only module; classification evidence: the Scope
list contains no `.tsx` file).

## 13. QA profile and verification plan

**`Q1`** — non-UI server code with unit tests, and a critical flow **read** (visibility) whose regression suite is
re-run. No write path.

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task847/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- src/modules/admin/dashboard/__tests__
npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts
npm.cmd run check:listing-visibility
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "select\('\*'|select\(\"\*\"" -- src/modules/admin/dashboard
git --no-optional-locks grep -n -E "comment|email|phone|document_url" -- src/modules/admin/dashboard/queries.ts
git --no-optional-locks grep -n -E "'active'|expires_at" -- src/modules/admin/dashboard/queries.ts
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/lib/dashboard/blockResult.ts src/modules/admin/dashboard/queries.ts src/modules/admin/dashboard/hrefs.ts src/modules/admin/dashboard/types.ts
```

Expected: every `npm`/`npx` command exits 0; the first two greps print nothing; the third prints only the commented
consistency line(s).

### 13.3 Owner visual review

None — no visible artifact.

## 14. Completion report contract

Files with hashes · R1–R6 · AC1–AC7 with quotes · commands with exit codes · I0 drift notes · the §5 soft-delete
finding · plant transcript with hashes · assumptions · deviations · limitations. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating git.
Update the 847 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Error ≠ 0 enforced? | R1 + test (b) + AC2's two-armed plant. |
| Visibility invariant | R3/AC4 + the registered regression command. |
| PII | R5/AC6. |
| Drill-down honesty | 857–859 reserved and named; hrefs final. |
| Commands in blocks | §13.2. |
