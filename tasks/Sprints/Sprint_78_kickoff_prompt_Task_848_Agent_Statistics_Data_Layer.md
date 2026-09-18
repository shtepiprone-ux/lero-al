# Task 848 — the agent statistics data layer: a `role='agent'` gate and owner-isolated queries for AGT-01, AGT-02, AGT-05, AGT-10

Sprint 78 · P1 · QA profile **Q4** (ownership / data isolation) · Wave B · depends on **846** approved (`period.ts`)
and **847** approved (`src/lib/dashboard/blockResult.ts`) · **Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md). **D78-3** (owner,
2026-09-18): *"role=agent. Нова стоірнка, кнопка "Statistics" на цю сторінку знаходиться у меню користувача, біля
кнопки "Профіль""*. D78-1 keeps the chat blocks (AGT-06–09) and AGT-12 out. AGT-03, AGT-04 and AGT-11, plus the
activity columns of AGT-10, belong to 855/856.

## 1. Mode and task type

`IMPLEMENTATION` — a server-only access gate and query module with isolation tests. No UI. Bundles: **DB / Server
Action / RLS** (read side) + **Regression / Critical Flow Coverage** (the visibility invariant is consumed).

## 2. Objective

Create `src/modules/cabinet/statistics/`:

1. `getAgentStatisticsAccess()` reads the session **on the server** and returns one of three results:
   `{ kind: 'ok', ownerId }`, `{ kind: 'unauthenticated' }` or `{ kind: 'not_agent' }`. `ownerId` is a **branded
   type** that can only be produced by this gate. No `user_id`, owner id or role from the URL, body or client is ever
   authoritative (spec §7, §10).
2. `getAgentStatisticsData({ ownerId, now, period, table })` (`now` is the request time, passed in by the page, so the module itself never calls `new Date()`) returns one `BlockResult` per block:
   - **AGT-01** — three separate counts: pending, active-but-hidden, and expiring within 7 local days;
   - **AGT-02** — visible count, plus secondary pending / inactive / sold / rented counts and an optional sale/rent
     split;
   - **AGT-05** — form inquiries in the completed period and in the previous period;
   - **AGT-10 (P0 columns)** — one page of the agent's own listings with status, visibility, `expires_at` and
     per-listing form-inquiry count, with filters, sorting and pagination.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- Roles: `UserRole = 'admin' | 'moderator' | 'agent' | 'user'` and, separately, `UserType = 'private' | 'agent' |
  'developer'` (`src/types/database.ts:1-2`). `user_type` is **self-selected** in the cabinet profile
  (`ProfileTab.tsx:95,128`). `role` is written by `updateUserProfileFull`, with an admin-only gate
  (`docs/domain-rules.md:96`); `src/modules/admin/actions/index.ts:284` maps the "agent" account type to
  `{ role: 'agent', user_type: 'agent' }`. **D78-3 → the gate reads `role`.**
- Session helper: `getUser()` in `src/lib/auth/server.ts:18`. The cabinet page reads the profile with the user client
  (`src/app/[locale]/cabinet/page.tsx:59`) and its own listings with `.eq('user_id', authUser.id)` through the
  **user** client (`:48-52`). That proves owners can read all their own listings, any status, under RLS.
- `listing_inquiries` (`database.ts:78-88`): `listing_id, listing_owner_id, name, email, message, requester_ip, status,
  created_at`. **No RLS policy for it exists in `scripts/*.sql`** (`git grep -n -i listing_inquiries -- scripts/*.sql`
  → only `schema-drift-check.sql`), and it is read only through `createAdminClient()` today
  (`submitListingInquiry.ts:24`). Whether an owner can read it under RLS is **UNKNOWN**. A user-client read that
  silently returns 0 rows would be the "false zero" the spec forbids. Hence R3.
- Visibility helpers: `applyPublicVisibility` (`visibility.ts:99`) and `applyPublicEligibleButHidden` (`:138`), the
  critical-flow row at `docs/critical-flow-registry.md:70`.
- `period.ts` (846): `resolvePeriod`, `previousPeriod`, `periodUtcBounds`, `tiraneDayUtcBounds`, `tiraneDateOf`,
  `compareToPrevious`, `parsePeriodParams`.

### 3.1 Spec rules restated (v3.3 §7, §10, §13)

| Block | Rule |
|---|---|
| **AGT-01** | pending = `user_id = owner AND status='pending'`; hidden = `applyPublicEligibleButHidden` on the owner's rows; expiring = `applyPublicVisibility` on the owner's rows **AND** `expires_at >= start of today (Tirane)` **AND** `expires_at < start of (today + 8 days) (Tirane)`. The three sets are disjoint by construction. Three numbers, never one KPI. No period. Targets: pending → `/{locale}/cabinet?tab=listings&filter=<pending group>`; hidden → the listing's edit/status flow; expiring → edit/renewal — the executor maps each onto the **existing** cabinet `filter` values (`VALID_VISIBILITY_GROUPS` in `src/modules/cabinet/lib/queries.ts`) and records the mapping; no new cabinet filter is added here. |
| **AGT-02** | visible = `applyPublicVisibility` on the owner's rows; secondaries = counts of `pending`, `inactive`, `sold`, `rented` (sold/rented are declarations "marked by me", not deals); optional `listing_type` split of the visible rows **only if visible > 0**. Also `statusCounts`: one count per `ListingStatus` (all 7) for the owner, used by 855's portfolio-visibility donut (visible / needs action / not visible), so that donut adds no query. Never the raw active count as "visible". |
| **AGT-05** | count `listing_inquiries WHERE listing_owner_id = owner AND created_at` within `periodUtcBounds(period)`, and the same for `previousPeriod(period)`. The inquiry `status` (new/read/archived) does not change the count. An inquiry counts even if its email failed (it is a stored row). |
| **AGT-10 P0** | rows = the owner's listings: `id, slug, title, status, expires_at, listing_type, created_at` + the cover image URL (the same embedded select the cabinet uses, `images:listing_images(url, is_cover, "order")` from `CABINET_LISTING_SELECT`, `src/modules/cabinet/lib/queries.ts:29-30`, reduced to one `coverUrl: string | null` — first `is_cover`, else lowest `order`) + visibility via `isListingPubliclyVisible` + `form_inquiries` in the period (one grouped query over `listing_inquiries` for the page's listing ids — no N+1). Filters: `status`, `visibility` (`visible`/`hidden`), `listing_type`. Sort: `expires_at`, `created_at`, `form_inquiries`. Page size **10** on the statistics page (spec §17.3 "up to 10 rows in the Dashboard"; §10 caps lists at 25). |
| All | explicit columns; `Promise.all` for independent queries; no `select('*')`; no N+1. |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D78-3, spec §7 | `getAgentStatisticsAccess()` (`import 'server-only'`): no session → `unauthenticated`; a session whose `users.role !== 'agent'` → `not_agent` (including `admin`/`moderator`); a session with `role === 'agent'` → `{ kind: 'ok', ownerId: <session user id> as AgentOwnerId }`. `AgentOwnerId` is `string & { readonly __brand: 'AgentOwnerId' }`, exported as a type only; the only cast lives in this function. | P0 | AC1 | Confirmed |
| **R2** | spec §10, §13 "Власність" | Every query in `getAgentStatisticsData` constrains by the branded `ownerId` (`.eq('user_id', ownerId)` on listings; `.eq('listing_owner_id', ownerId)` on inquiries) and accepts no other identity input. The function signature does not accept a plain `string` owner. | P0 | AC2, AC3 | Confirmed |
| **R3** | §3 (RLS unknown) | Listings are read through the **user** client (owner read proven by the cabinet). `listing_inquiries` is read through `createAdminClient()` **only** with `.eq('listing_owner_id', ownerId)`, in a function whose name and JSDoc state why. Every returned inquiry row/aggregate carries no `name`, `email`, `message` or `requester_ip` (counts only). | P0 | AC3, AC5 | Confirmed |
| **R4** | spec §4 | Each block returns `BlockResult` (847). A failed query → that block `ok:false`, logged `[AgentStatistics] <block> failed` with the error code; no `0` substitution. | P1 | AC2 | Confirmed |
| **R5** | §3.1 | Shapes and rules of §3.1, with Tirane bounds from `period.ts` (no local `new Date()` day arithmetic in this module). | P1 | AC2, AC4 | Confirmed |
| **R6** | tests | `src/modules/cabinet/statistics/__tests__/access.test.ts` + `data.test.ts` (mocking `@/lib/supabase/server`, `@/lib/supabase/admin`, `@/lib/auth/server` in the style of the existing smoke tests) prove: R1's three outcomes incl. `admin` → `not_agent`; every mocked query received `eq(<owner column>, ownerId)` (**owner-isolation assertion**); a plant that removes that `eq` from one query makes the isolation test fail; the AGT-01 expiring window uses `today+8` start (a case at `now` = 2026-09-18 22:30 UTC, already the 19th in Tirane); the AGT-05 count ignores inquiry status; one failing block leaves the others `ok:true`. | P0 | AC2, AC4 | Confirmed |

## 5. Assumptions and open questions

- **Non-agent redirect target** is the page's concern (854): an unauthenticated user → the login redirect in the
  cabinet's existing form; `not_agent` → `/{locale}/cabinet`. This module only reports the kind.
- **RLS on `listing_inquiries`** stays UNKNOWN; R3 avoids depending on it. If the executor can read the live policy
  (e.g. an owner-supplied `pg_policies` dump), record it; do not change the table's RLS here.
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (1–6a, 9, 10, 14, 15) · `docs/qa-profiles.md` ·
`docs/data-access-rules.md` · `docs/rls-rules.md` · `docs/domain-rules.md` (roles) ·
`docs/critical-flow-registry.md` (visibility row) · `docs/state-authority.md` · `docs/qa-rules.md` ·
`.claude/skills/execute-task/SKILL.md` · kickoffs 846 (§4) and 847 (`BlockResult`).

## 7. Scope

- **Created:** `src/modules/cabinet/statistics/access.ts` · `src/modules/cabinet/statistics/data.ts` ·
  `src/modules/cabinet/statistics/types.ts` · `src/modules/cabinet/statistics/hrefs.ts` (+ its test) ·
  `src/modules/cabinet/statistics/__tests__/access.test.ts` · `…/__tests__/data.test.ts`.
- **Edited:** `docs/backlog.md` (848 line).

## 8. Out of scope

The page, menu entry and UI (854) · AGT-03/04/11 and activity columns (855/856) · chat and review blocks (D78-1) ·
cabinet `ListingsTab`/`CabinetShell` · any RLS or SQL change.

## 9. Current and required behavior

**Before.** No agent statistics exist. The cabinet aggregates WhatsApp events per listing in page code
(`cabinet/page.tsx:66-80`); that stays untouched. **After.** A gated, owner-isolated module exists; nothing visible changes.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; re-read §3's cited lines; list `VALID_VISIBILITY_GROUPS` and record the
   AGT-01/AGT-02 target mapping; run the visibility regression command and `check:listing-visibility` (baseline).
2. Tests first (R6), red → green.
3. Implement R1–R5. `server-only` at the top of `access.ts` and `data.ts`.
4. The isolation plant (AC2) edits `data.ts` temporarily. Record `git hash-object` before the plant and after the
   revert; they must be equal.

## 11. Positive and negative flows

**Positive.** Agent A (role `agent`) with 20 listings: 2 pending, 1 active-expired, 1 active with no expiry, 3
expiring within 7 days, 12 visible, 1 sold → AGT-01 = 2 / 2 / 3; AGT-02 = 12 (secondary: pending 2, sold 1); AGT-05
in 30d = 7 (previous 4); AGT-10 page 1 = 10 rows.

| Negative flow | Applicable | Expected |
|---|---|---|
| Guest | Yes | `unauthenticated`. |
| Signed-in `user` / `admin` / `moderator` | Yes | `not_agent`. |
| Agent tries another owner via URL/filter | Yes | Impossible: no identity parameter exists; the filters only narrow the owner's own rows (test). |
| One query fails | Yes | That block `ok:false`; others fine. |
| Zero listings | Yes | Real zeros, `ok:true`; AGT-02 split omitted (visible = 0). |
| Inquiry with failed email | Yes | Counted (stored row). |
| Previous period 0 | Yes | Data returns both counts; the "no base" presentation is `compareToPrevious` in the UI (854). |
| Concurrency / writes | No | Read-only. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `access.test.ts`, when run, then guest → `unauthenticated`; roles `user`, `admin`, `moderator` →
  `not_agent`; `agent` → `ok` with the session id.
- **AC2 [R2, R4, R5, R6]** — Given `npm.cmd run test -- src/modules/cabinet/statistics/__tests__`, when run, then all
  pass; given the plant that removes the owner `eq` from the AGT-05 query, when re-run, then the isolation test fails;
  the plant is reverted with an equal hash.
- **AC3 [R2, R3]** — Given
  `git --no-optional-locks grep -n -E "createAdminClient" -- src/modules/cabinet/statistics`, when run, then every hit
  is inside the one documented inquiry-count function; and
  `git --no-optional-locks grep -n -E "searchParams|params\.|body" -- src/modules/cabinet/statistics/data.ts src/modules/cabinet/statistics/access.ts`
  prints nothing.
- **AC4 [R5]** — Given `git --no-optional-locks grep -n -E "new Date\(|Date\.now\(|setDate|getDate" -- src/modules/cabinet/statistics/data.ts`,
  when run, then it prints nothing (all day maths come from `period.ts`).
- **AC5 [R3]** — Given `git --no-optional-locks grep -n -E "'name'|email|message|requester_ip" -- src/modules/cabinet/statistics/data.ts`,
  when run, then it prints nothing.
- **AC6** — Given the §13.2 block, when run, then typecheck, lint, tests, the visibility regression and build exit 0.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC3–AC5 empty greps are scoped to the new module and define "no client identity", "no local day maths" and "no inquiry PII".`

GR-1 / GR-3 / GR-3a: **not applicable** — no visible artifact (the Scope list has no `.tsx`).

## 13. QA profile and verification plan

**`Q4`** — per `docs/qa-profiles.md`, "RLS/write-path security, data isolation" → the regression baseline, a
changed-behaviour test, and a planted violation proving the isolation assertion can fail (AC2).

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task848/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- src/modules/cabinet/statistics/__tests__
npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts
npm.cmd run check:listing-visibility
npm.cmd run test:rls-guards
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "createAdminClient" -- src/modules/cabinet/statistics
git --no-optional-locks grep -n -E "searchParams|params\.|body" -- src/modules/cabinet/statistics/data.ts src/modules/cabinet/statistics/access.ts
git --no-optional-locks grep -n -E "new Date\(|Date\.now\(|setDate|getDate" -- src/modules/cabinet/statistics/data.ts
git --no-optional-locks grep -n -E "'name'|email|message|requester_ip" -- src/modules/cabinet/statistics/data.ts
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/modules/cabinet/statistics/access.ts src/modules/cabinet/statistics/data.ts src/modules/cabinet/statistics/types.ts src/modules/cabinet/statistics/hrefs.ts
```

Expected: every `npm`/`npx` command exits 0; the first grep's hits are all inside the documented function; the other
three greps print nothing.

### 13.3 Owner visual review

None — no visible artifact. The live isolation proof (two agent sessions) is part of 854's owner matrix.

## 14. Completion report contract

Files with hashes · R1–R6 · AC1–AC6 with quotes · commands with exit codes · the AGT-01/02 target mapping ·
plant transcript with hashes · assumptions · deviations · limitations. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating git.
Update the 848 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Identity from server only? | R1 branded id + R2 signature + AC3 grep + AC2 plant. |
| Unknown RLS handled without a false zero? | R3, stated as UNKNOWN in §3. |
| Visibility invariant | helpers only; registered regression re-run. |
| Commands in blocks | §13.2. |
