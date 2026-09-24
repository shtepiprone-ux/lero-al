# Task 850 — the WhatsApp click event: the database resolves the owner, every write goes through one server path, and guest clicks are recorded

Sprint 78 · P1 · QA profile **Q4** (write path + RLS) · Wave B · independent of other tasks · owner action **O78-4**
(apply SQL) · **Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md). The spec (v3.3 §5) marks
this as **required before AGT-04**: *"server-side запис, що сам знаходить owner/listing, і окремий безпечний шлях для
гостя. Не довіряти owner id із клієнта."*

## 1. Mode and task type

`IMPLEMENTATION` — a server action rewrite, a DB trigger, and an RLS/grant change delivered as owner-applied SQL in
two ordered steps; tests. Bundles: **DB / Server Action / RLS** + **Regression / Critical Flow Coverage**.

## 2. Objective

1. The listing owner of a `listing_contact_events` row is set **by the database** from `listings.user_id`, and so is
   `is_owner_click`. A value sent by any caller is overwritten.
2. `trackListingContactEvent({ listingId, channel, source, locale })` no longer accepts `listingOwnerId`. It resolves
   the listing on the server. Every insert goes through the service-role client **from the server action only**:
   authenticated users with `actor_user_id` = the session user, guests with `actor_user_id = null` and an
   `actor_ip_hash`.
3. Duplicate clicks are de-duplicated within a 30-minute window per `(listing, actor)`, where the actor is the user id
   or the ip hash. A burst of clicks therefore cannot inflate AGT-04. A failed write returns an error and never counts
   as success.
4. Direct inserts through PostgREST by `authenticated` are revoked, so the server path is the only way in.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- `src/modules/listings/actions/contactEvents.ts` (60 lines):
  - it takes `listingOwnerId` **from the caller**;
  - it computes `isOwnerClick` by comparing the caller's value with the session user;
  - it inserts through the **user** client (`createClient()` from `@/lib/supabase/server`).
  Result type: `{ ok: true } | { ok: false; reason: 'self_click' | 'insert_failed' | 'session_error' }`.
- Callers pass the owner id from client props: `ListingContact.tsx:125`, `WhatsAppContactButton.tsx:51`,
  `ListingMobileCTA.tsx:60`. All use `void trackListingContactEvent(...)`, so the result is ignored.
- RLS history:
  - `scripts/task-277-listing-contact-events.sql:20-33`: grants `insert` to `authenticated`; policy
    `events_insert_authenticated … with check (actor_user_id = auth.uid())`, which **does not check
    `listing_owner_id`**; policy `events_select_owner`.
  - `scripts/task-289-…-anon-revoke.sql`: dropped `events_insert_anon` and revoked anon select.
  - Net today: an authenticated user can insert a row with **any** `listing_owner_id`, and a guest click is **never
    recorded**.
- Reads of this table:
  - `src/app/[locale]/cabinet/page.tsx:66-72` (user client: `listing_owner_id = me`, `is_owner_click = false`), which
    relies on `events_select_owner`. That stays.
  - 849's aggregate (service role).
- A precedent for a guest fingerprint: `src/app/api/listings/[slug]/view/route.ts:43-55` builds
  `SHA-256(ip|ua[0..60])` truncated to 24 hex characters.
- A precedent for rate limiting: `submitListingInquiry.ts:16-29` counts the IP's rows within a window.
- `docs/critical-flow-registry.md` has no row for the WhatsApp click (searched "contact_events", "WhatsApp"). The
  listing-detail contact card is part of the listing-detail surface (Sprint 71). This task changes **no markup**: the
  three caller edits only drop one argument.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | spec §5 | `scripts/task-850-step1-owner-trigger.sql` (safe with the **old** code): adds `actor_ip_hash text null` to `public.listing_contact_events`; creates the indexes `(listing_id, actor_user_id, created_at desc)` and `(listing_id, actor_ip_hash, created_at desc)`; and creates a `BEFORE INSERT` trigger function (`security definer`, `set search_path = public`) that sets `new.listing_owner_id := (select user_id from public.listings where id = new.listing_id)`, raises an exception when the listing does not exist, and sets `new.is_owner_click := (new.actor_user_id is not null and new.actor_user_id = new.listing_owner_id)`. Idempotent (`if not exists`, `create or replace`, `drop trigger if exists`). | P0 | AC1, AC5 | Confirmed |
| **R2** | spec §5 | `scripts/task-850-step2-revoke-client-insert.sql` (applied **after** the new code is deployed): `drop policy if exists "events_insert_authenticated"`; `revoke insert on public.listing_contact_events from authenticated`. `events_select_owner` and the service-role grants remain. | P0 | AC5 | Confirmed |
| **R3** | spec §5, §13 "WhatsApp" | `trackListingContactEvent({ listingId, channel, source, locale })`, server action: (1) read the session with `getUser()` (a failure returns `session_error`); (2) resolve the listing with `createAdminClient()` `.select('id, user_id').eq('id', listingId).in('status', ['active','sold','rented','archived'])` (the same set as `view/route.ts:28`), with no row → `not_found` and no insert; (3) the actor is the session user id, or for guests the ip hash built exactly like `view/route.ts:43-55` from `headers()`, with an empty ip → `ipHash = ''`, which disables de-dup for that guest, the same as the inquiry limiter's "unknown IP" rule; (4) de-dup: if a row exists for the same listing and actor with `created_at >= now − 30 min` → `deduplicated`, no insert; (5) insert with the service-role client, `listing_owner_id` taken from the resolved listing (the trigger re-derives it anyway), `actor_user_id` or `actor_ip_hash`; (6) an insert error → `insert_failed` + `console.error('[contactEvents] insert failed', { code, listingId })`; (7) an owner click → `self_click`, **after** the row is written with `is_owner_click = true` (preserves today's behaviour); else `{ ok: true }`. | P0 | AC2, AC3 | Confirmed |
| **R4** | preserve | The three callers drop only the `listingOwnerId` property from their call object; no other line changes in those files; the rendered markup is identical. | P1 | AC4 | Confirmed |
| **R5** | tests | `src/modules/listings/actions/__tests__/contactEvents.test.ts` (mock `@/lib/auth/server`, `@/lib/supabase/admin`, `next/headers`): guest → insert with `actor_user_id: null` and a 24-hex `actor_ip_hash`; authenticated non-owner → insert with the session id; owner → insert then `self_click`; unknown listing → `not_found`, zero inserts; recent duplicate → `deduplicated`, zero inserts; insert error → `insert_failed`; **a caller-supplied owner id cannot reach the insert** (the args type has no such field — a `@ts-expect-error` line in the test proves the compile-time rejection). | P0 | AC2 | Confirmed |

## 5. Assumptions and open questions

- **30-minute de-dup window** — INFERENCE. The spec does not fix a number. It prevents repeated taps from inflating
  counts, it is reversible (one constant), and it is the same order as the 24-hour view de-dup. The owner can return
  it in review.
- **Behaviour change the owner will see:** the cabinet's per-listing WhatsApp counts (`cabinet/page.tsx:66-80`) will
  start to include **guest** clicks, which are recorded for the first time, and will stop counting repeated taps
  within 30 minutes. This is the spec's intent; it is stated here so nobody mistakes it for a regression.
- **Deploy order** is load-bearing: step 1 SQL → code deploy → step 2 SQL. Step 2 before the code deploy would make
  the old code's authenticated inserts fail (lost clicks, logged). The code before step 1 would fail on
  `actor_ip_hash`.
- No owner decision open beyond confirming the window in review.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (1–6a, 9, 10, 14, 15) · `docs/qa-profiles.md` ·
`docs/data-access-rules.md` · `docs/rls-rules.md` · `docs/domain-rules.md` · `docs/analytics-rules.md` ·
`docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md`.

## 7. Scope

- **Created:** `scripts/task-850-step1-owner-trigger.sql` · `scripts/task-850-step2-revoke-client-insert.sql` ·
  `scripts/task-850-verify.sql` · `src/modules/listings/actions/__tests__/contactEvents.test.ts`.
- **Edited:** `src/modules/listings/actions/contactEvents.ts` · `src/modules/listings/components/ListingContact.tsx`
  (one property removed) · `src/components/listing/WhatsAppContactButton.tsx` (one property) ·
  `src/modules/listings/components/ListingMobileCTA.tsx` (one property) · `src/types/database.ts`
  (`ListingContactEvent.actor_ip_hash: string | null`) · `scripts/schema-drift-check.sql` (one column) ·
  `docs/backlog.md` (850 line).

## 8. Out of scope

The WhatsApp link itself and its markup · the cabinet's aggregation code · 849's aggregate · the other two
components' own migrations (`ListingMobileCTA` → 814) · `record_listing_view`.

## 9. Current and required behavior

**Before.** A signed-in user's click stores whatever owner id the page passed in; a guest's click is lost; any
signed-in user can insert arbitrary rows through PostgREST. **After.** The DB sets the owner; guests are recorded
through the server; repeated taps within 30 min are recorded once; direct client inserts are impossible.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes of every edited file; re-read §3's lines;
   `git grep -n "trackListingContactEvent" -- src` (expect exactly the three callers + the action).
2. Tests first (R5), red → green.
3. SQL per R1/R2, with a header comment naming the **deploy order** and a rollback for each step.
4. Action per R3; callers per R4.
5. `scripts/task-850-verify.sql`:
   (a) insert a row as the service role with a wrong `listing_owner_id` for a known listing, then select it and
   show the trigger-corrected owner; delete it after;
   (b) `has_table_privilege('authenticated','public.listing_contact_events','insert')` → false after step 2;
   (c) list the policies on the table.

## 11. Positive and negative flows

**Positive.** A guest on a listing's detail page taps WhatsApp. WhatsApp opens (unchanged), and one row lands with
`actor_user_id null`, a 24-hex `actor_ip_hash`, the DB-derived owner, and `is_owner_click false`.

| Negative flow | Applicable | Expected |
|---|---|---|
| Owner taps their own button | Yes | Row with `is_owner_click true`; excluded from AGT-04 and from the cabinet counts. |
| Tap again within 30 min | Yes | `deduplicated`, no row. |
| Unknown or pending listing id | Yes | `not_found`, no row. |
| DB insert error | Yes | `insert_failed`, logged, no success. |
| Direct PostgREST insert by a signed-in user | Yes | Rejected after step 2 (privilege revoked). |
| Spoofed owner id in a service-role insert | Yes | The trigger overwrites it (verify (a)). |
| Session read failure | Yes | `session_error`, no row (today's behaviour). |
| No IP header | Yes | Guest row written without de-dup (`ipHash = ''`), same rule as the inquiry limiter. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given step 1's SQL, when read, then it contains the column, both indexes, the trigger function with
  `security definer` + a fixed `search_path`, the not-found exception and the `is_owner_click` derivation; every
  statement is idempotent. Quote them.
- **AC2 [R3, R5]** — Given `npm.cmd run test -- src/modules/listings/actions/__tests__/contactEvents.test.ts`, when run,
  then all seven cases pass. Given a plant that re-adds `listingOwnerId` to the args type and uses it in the insert,
  when `npm.cmd run typecheck` runs, then the `@ts-expect-error` line reports "unused", i.e. typecheck fails. Revert
  with an equal hash.
- **AC3 [R3]** — Given `contactEvents.ts`, when read, then no identifier named `listingOwnerId` remains and the insert
  uses `createAdminClient()`.
- **AC4 [R4]** — Given `git --no-optional-locks diff -- src/modules/listings/components/ListingContact.tsx src/components/listing/WhatsAppContactButton.tsx src/modules/listings/components/ListingMobileCTA.tsx`,
  when read, then each file shows only the removed property (and, if the formatter requires it, the rewrapped call).
- **AC5 [R1, R2]** — Given the owner's run of `scripts/task-850-verify.sql` after both steps, when read, then (a) shows
  the corrected owner, (b) is false, and (c) lists no insert policy for `authenticated`. Owner-native (§13.3).
- **AC6** — Given the §13.2 block, when run, then everything exits 0.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC3's "no identifier remains" is the removal itself, scoped to one file.`

GR-1 / GR-3 / GR-3a: **not applicable** — no visible artifact changes (R4 edits call arguments only; AC4 proves it).

## 13. QA profile and verification plan

**`Q4`** — write path + RLS. Changed-behaviour tests, a planted violation (AC2), and owner-native DB evidence (AC5).

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task850/`.

### 13.2 Final gate block (executor)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- src/modules/listings/actions/__tests__/contactEvents.test.ts
npm.cmd run test:listings
npm.cmd run test:rls-guards
node.exe scripts\check-surface-census-changed.mjs --base HEAD
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n "listingOwnerId" -- src/modules/listings/actions/contactEvents.ts src/modules/listings/components/ListingContact.tsx src/components/listing/WhatsAppContactButton.tsx src/modules/listings/components/ListingMobileCTA.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/modules/listings/actions/contactEvents.ts src/modules/listings/components/ListingContact.tsx src/components/listing/WhatsAppContactButton.tsx src/modules/listings/components/ListingMobileCTA.tsx scripts/task-850-step1-owner-trigger.sql scripts/task-850-step2-revoke-client-insert.sql
```

Expected: every `npm`/`node` command exits 0. The `listingOwnerId` grep prints only component-local prop names that
are **not** passed to the action. If a component still needs the owner id for other rendering, it keeps its own prop;
quote each remaining hit and show it is not an argument to `trackListingContactEvent`.

### 13.3 Owner-native steps (O78-4), in order

1. Apply `scripts/task-850-step1-owner-trigger.sql` in the Supabase SQL editor; return the output.
2. Deploy the code (normal owner commit/push after an approved review).
3. Apply `scripts/task-850-step2-revoke-client-insert.sql`; return the output.
4. Run `scripts/task-850-verify.sql`; return the three result grids.
5. As a guest (private window), tap WhatsApp on one live listing, then run
   `select listing_owner_id, actor_user_id, actor_ip_hash is not null as has_hash, is_owner_click from public.listing_contact_events order by created_at desc limit 1;`
   and return the row.

## 14. Completion report contract

Files with hashes · R1–R5 · AC1–AC6 (AC5 owner-native pending) · commands with exit codes · the deploy order as
written into the SQL headers · plant transcript · assumptions · deviations · limitations. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating git.
Update the 850 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Owner id trusted from the client anywhere? | No: removed from the API (R3/AC3), overwritten by the DB (R1/AC5). |
| Guest path safe? | Server-only insert, ip-hash de-dup, no client insert privilege (R2). |
| Deploy-order hazard? | Stated in §5 and in the SQL headers; two separate scripts. |
| Visible change? | None (AC4). |
| Commands in blocks | §13.2 + owner steps §13.3. |
