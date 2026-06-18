# Kickoff — Task 455 (Epic LV / Sprint 36, LV.2)
## Lifecycle reconciliation: introduce `expired` status, re-stamp on re-activation, sweep + backfill

> **Executor:** Sonnet 4.6. **Orchestrator reviews the real diff, not the report.**
> **Epic:** `tasks/Epics/Epic_LV_Listing_Public_Visibility_Integrity.md` · **Builds on Task 454** (canonical
> `visibility.ts` policy/predicate — already committed). **This is the slice that ACTUALLY FIXES the production
> bug.** All P0 contract clauses (1–15) apply. **No git.**

## Owner decisions (FINAL — 2026-06-18, do not re-litigate)

1. **Add a new `expired` `ListingStatus`. Do NOT reuse `inactive`.** `inactive` = owner/manual deactivation;
   `expired` = system lifecycle state (window lapsed). They must stay distinct for honest admin/owner diagnostics.
2. **Re-stamp `expires_at` on every transition INTO a public-eligible status (re-activation / approval / renew).**
   Set `expires_at = now() + standard listing window` so an old timestamp can never recreate "Active but invisible."
3. **`expires_at IS NULL` = invalid/hidden (broken lifecycle data), NOT "never expires."** Never shown publicly.
   "Repaired explicitly" means: the **recurring scheduled sweep does NOT touch NULL rows** (no silent
   auto-expire), BUT the **one-time backfill in THIS task explicitly resolves them** (`active + expires_at IS
   NULL → expired`, reason `no_expiry`) as a recorded governance action. After Task 455 **no `active` row may
   remain silently invisible** — neither past-expiry nor NULL-expiry.
4. **No auto-renew in this slice. Hard exclusion for expired. Add reconciliation + backfill** moving lapsed
   `active` rows → `expired`. Owner/admin reason visibility = LV.3; CI guard = LV.4 (out of scope here).

## Pre-read (rule-index: Schema/migration + DB/server-action + Regression bundles)

`agent-contract.md`, `backlog.md`, `critical-flow-registry.md` (always) · `data-access-rules.md`,
`domain-rules.md`, `rls-rules.md`, `qa-rules.md`, `architecture.md` · `Epic_RS_Regression_Shield.md` ·
`docs/domain-rules.md` → "Future ListingStateMachine evolution trigger" (the I.3 note) · the Task 454 files
(`src/modules/listings/lib/visibility.ts`, `…/domain/listingTransitionEngine.ts`).

## Grounding (verified by orchestrator 2026-06-18)

- Transition engine is the single source: `src/modules/listings/domain/listingTransitionEngine.ts` —
  `ALLOWED_LISTING_TRANSITIONS: Record<ListingStatus, …>` + `ACTION_NEXT_STATUS`. Adding `expired` to the enum
  makes `tsc` REQUIRE a key here and in `PUBLIC_VISIBLE_STATUSES` (visibility.ts) — lean on that.
- Write path that applies transitions: `src/modules/listings/actions/applyListingTransition.ts` (+
  `changeListingStatus.ts`). Privileged any-status path already exists (Task 427).
- `expires_at` window is stamped once in `createListing.ts` (`now + 30 days`) — extract to a shared constant.
- Reconciliation can mirror `src/app/api/cron/saved-searches/route.ts` (existing cron pattern).
- Status i18n labels live in MULTIPLE groups across `messages/{sq,en,uk,it}.json` (e.g. en.json ~L1676, ~L1783,
  L1175) — grep ALL status-label groups; `expired` must be added to each, in all four locales.
- DB `status` column type is CONFIRMED: Postgres ENUM `public.listing_status` (owner native check 2026-06-18).
  Migration shape resolved in the "DB migration — RESOLVED" section below.

## ✅ DB migration — RESOLVED (owner native check 2026-06-18)

`listings.status` is a **Postgres ENUM** named **`listing_status`** (`data_type = USER-DEFINED`,
`udt_name = listing_status`; confirmed natively — NOT a `text`+CHECK column, no `listings_status_check` exists).
Owner has approved adding the `expired` value. **The migration is therefore an enum `ADD VALUE`, which carries
hard Postgres constraints — follow this exactly:**

**Verified live baseline (owner `pg_enum` query 2026-06-18):** `listing_status` currently has exactly
`active, inactive, sold, rented, archived, pending` (matches the TS union — no drift) and does NOT yet contain
`expired`. So the `ADD VALUE IF NOT EXISTS` below is a clean, single new label.

**Migration SQL (idempotent; owner runs it NATIVELY — you do not run SQL):**
```sql
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'expired';
```
- **✅ Owner-approved 2026-06-18** to add `expired` to `public.listing_status` (explicit approval for this
  non-reversible native DB change; recorded here and in the session log).
- **No CHECK constraint** — the enum already constrains allowed values; do NOT add a `listings_status_check`.
- **🔴 Irreversible:** an enum value cannot be cleanly dropped — removing it later means recreating the type.
  This is accepted (owner decision to add `expired`). Do not add any other speculative values.
- **🔴 Sequencing (critical):** a newly added enum value **cannot be used in the same transaction that adds it**.
  So the deploy order is strict: **(1)** owner runs the `ALTER TYPE … ADD VALUE` natively and it COMMITS; **(2)**
  ONLY THEN may any code reference `'expired'` and may the reconciliation/backfill `UPDATE … SET status='expired'`
  run. Put the `ALTER TYPE` statement on its own (no surrounding `BEGIN/COMMIT`, run standalone), then the
  backfill as a separate step. Call this ordering out explicitly in the session log + any deploy notes.
- **Schema-drift guard:** if `scripts/schema-drift-check.sql` / `check-schema-drift.mjs` snapshots enum labels,
  regenerate it so the new `expired` label does not show as drift; if it only tracks columns, no change needed —
  verify and note which.
- Keep `src/types/database.ts` `ListingStatus` union in sync (Part A) — add `'expired'`.

> The migration cannot be guessed and cannot be auto-run from code — it is an owner-run native step that must
> land and commit BEFORE the code/backfill that depends on it. The kickoff treats this as a hard ordering gate.

## ✅ Reconciliation runner — DECIDED (owner 2026-06-18)

Use a **Vercel cron route mirroring `saved-searches`**: `src/app/api/cron/listings-expiry/route.ts`, service-role
client, the **same auth pattern as the existing cron**, scheduled in `vercel.json`. Do NOT use a Supabase
scheduled function and do NOT invent other infra.

## Scope — implement in this ORDER (self-validate each part before the next)

**Part A — enum + policy (type-forced).**
- Add `'expired'` to `ListingStatus` (`src/types/database.ts`).
- `visibility.ts`: `PUBLIC_VISIBLE_STATUSES.expired = { publicEligible: false, requiresUnexpired: false }`.
- Migration: `ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'expired';` (pg enum — see "DB migration"
  above; owner-approved 2026-06-18; owner-run native, MUST commit before any backfill/code uses the value).

**Part B — transition engine (single source).**
- New actions: `EXPIRE` (active → expired; system/reconciliation), `RENEW` (expired → active; re-activation).
- `ALLOWED_LISTING_TRANSITIONS`: `active` gains `'EXPIRE'`; add `expired: ['RENEW', 'ARCHIVE']`.
- `ACTION_NEXT_STATUS`: `EXPIRE: 'expired'`, `RENEW: 'active'`.
- Verify derived semantic helpers stay correct: `expired` must NOT be terminal (it has RENEW→active), NOT
  moderatable. Add/extend `listingTransitionEngine.test.ts` accordingly.

**Part C — re-stamp `expires_at` on re-activation (the core fix).**
- Extract the window to a shared constant (e.g. `LISTING_ACTIVE_WINDOW_MS` near `createListing`/constants).
- In `applyListingTransition.ts` (the single write path), re-stamp `expires_at = new Date(now + window)` in the
  same update whenever the resolved next status is **public-eligible per the policy** — i.e.
  `PUBLIC_VISIBLE_STATUSES[nextStatus].publicEligible === true` (today that is only `active`; covers PUBLISH,
  APPROVE, RENEW, privileged →active). **Drive this off the LV.1 policy, NOT a hardcoded `nextStatus === 'active'`
  literal** — Epic LV is policy-driven, so if a future status becomes public-eligible the re-stamp follows
  automatically. This guarantees no transition into a public-eligible status can leave a stale/expired timestamp.

**Part D — reconciliation sweep (Vercel cron route `src/app/api/cron/listings-expiry/route.ts`, per the decided runner above).**
- Service-role job: `UPDATE listings SET status='expired', updated_at=now() WHERE status='active' AND expires_at
  < now()`. Drive the status change THROUGH the transition engine semantics (EXPIRE), not a raw scattered string,
  per the engine's "FORBIDDEN outside this file" rule — i.e. resolve via `resolveTransition('active','EXPIRE')`.
- **The RECURRING sweep does NOT auto-expire NULL-expiry rows** (decision #3 — no silent auto-expire of broken
  data on a schedule). It reports them (reason `no_expiry`). NULL rows are instead resolved by the one-time
  backfill in Part E. Document this exclusion in the route + log.
- Idempotent, safe to run repeatedly; logs count changed; no public read path touched.

**Part E — one-time backfill (resolves the ENTIRE LV.1 audit set, incl. NULL).**
- A read-then-update backfill that **explicitly resolves every public-eligible-but-hidden row** from the LV.1
  audit to `expired`:
  - `active + expires_at < now()` → `expired` (reason `expired`).
  - **`active + expires_at IS NULL` → `expired` (reason `no_expiry`)** — this is the explicit one-time repair
    decision #3 calls for; it is recorded in the backfill report, NOT a silent scheduled mutation.
- Idempotent SQL, recorded in the session log. The LV.1 audit currently reports 0 hidden, so this is likely a
  no-op today, but the mechanism must exist and run. **Regenerate the audit report after backfill and prove it
  reports ZERO `active` rows that are past-expiry OR NULL-expiry** — i.e. no `active` row remains silently
  invisible. That regenerated 0/0 report is the proof the production bug is structurally closed.

**Part F — surfaces that enumerate status (no silent breakage).**
- i18n: add `expired` label to EVERY status-label group across `messages/{sq,en,uk,it}.json` (grep them all;
  keep key-set parity across the four locales).
- Admin listings status filter + any status tabs/badges/banners (`ListingsStatusTabs.tsx`,
  `ListingStatusBanner.tsx`, `ListingCard.tsx`, admin filter options) must render `expired` correctly — do NOT
  drop or mislabel it. Any UI surface touched → Mobile <640 full-width gate + 4-locale parity + rendered matrix
  (clauses 11–12). If a status-enumerating UI is non-trivial to extend, STOP and ASK rather than half-render it.

## Positive flow (happy path)

- **Reconciliation:** an `active` listing whose `expires_at` has passed → sweep runs → engine `EXPIRE` →
  `status='expired'`, `updated_at` bumped → it is excluded from all public reads (already, via LV.1 predicate)
  AND now shows truthfully as `expired` in cabinet/admin (not a misleading "Active").
- **Re-activation:** owner/admin moves the `expired` (or `inactive`) listing back to `active` (RENEW/PUBLISH/
  APPROVE or privileged →active) → `applyListingTransition` sets `expires_at = now + window` → listing is
  publicly visible again with a fresh, correct window. The original production bug cannot recur.

## Negative flow (every off-happy-path branch)

- **NULL-expiry active row:** the RECURRING sweep does not touch it (no silent scheduled mutation), but the
  **one-time Part E backfill explicitly moves it to `expired` (reason `no_expiry`)** so it does NOT remain
  `active`+invisible after this slice. Already excluded from public reads by LV.1; now also truthful in status.
- **Invalid transition** (e.g. `EXPIRE` from non-active, `RENEW` from non-expired via the base matrix): engine
  returns `invalid_transition`; no DB write. Privileged any-status path still governed by `applyListingTransition`
  authorization (unchanged).
- **Re-activation by a non-owner/non-admin:** permission denied in `applyListingTransition` (unchanged); no write,
  no `expires_at` re-stamp.
- **Sweep runs with nothing lapsed:** 0 rows updated; idempotent; no error; safe re-run.
- **Migration not yet applied:** code referencing `'expired'` must not 500 public reads; guard so the app is safe
  before/after migration (the value is additive; public predicate already excludes non-`active`).
- **Cron auth / wrong caller:** the cron route rejects unauthorized invocation (mirror `saved-searches` auth);
  no update on reject.
- **Concurrent transition vs sweep:** the engine + single write path keep status changes serialized per row;
  re-stamp-on-active and EXPIRE cannot interleave into "active + past expires_at."

## Acceptance criteria (each diff-verifiable, mapped to a flow)

1. `'expired'` added to `ListingStatus` + `PUBLIC_VISIBLE_STATUSES` (Part A); enum migration `ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'expired';` recorded, with the owner-run-native + commit-before-backfill ordering documented (cannot use the new value in the adding transaction).
2. Engine: `EXPIRE`/`RENEW` actions + matrix/next-status entries; `expired` not terminal/not moderatable; engine tests extended (Part B).
3. `applyListingTransition` re-stamps `expires_at = now + window` for ALL transitions whose next status is `publicEligible` per `PUBLIC_VISIBLE_STATUSES` (policy-driven, NOT a hardcoded `'active'` literal); shared window constant; test proves a stale-expires expired→active yields a fresh future `expires_at` (Part C).
4. RECURRING reconciliation sweep (engine-driven, service-role, idempotent) moves `active + expires_at<now()` → `expired`, does NOT auto-mutate NULL-expiry, logs counts, rejects unauthorized callers; test covers happy + nothing-lapsed + NULL-not-auto-expired (Part D).
5. One-time backfill explicitly resolves the FULL LV.1 set — `active + past-expiry → expired` AND `active + NULL-expiry → expired (no_expiry)`; regenerated audit report proves **ZERO `active` rows that are past-expiry OR NULL-expiry remain** (the structural-fix proof). Idempotent SQL recorded (Part E).
6. `expired` label present in ALL status-label groups across sq/en/uk/it (parity); every status-enumerating UI renders it; touched UI passes the <640 full-width gate + rendered matrix (Part F).
7. **Regression (clause 15):** baseline the `Status change` + `Create listing` + listing-visibility-invariant flows GREEN before changing; extend their tests for the new status/actions/re-stamp; planted-violation (drop the re-stamp) FAILS. Update the `critical-flow-registry` rows touched.
8. Self-validation: `tsc --noEmit`=0 · `npm run build` · full AC self-audit citing Positive/Negative flows · file-integrity transcript · "Files Changed" table · write-path changes are intentional and scoped to the transition action + sweep + backfill ONLY (no unrelated write paths). No git emitted.

## Out of scope (later slices)

- Operator-facing "public visibility: hidden — reason" badge + admin "public-eligible but hidden" filter → **LV.3 (456)**.
- CI invariant grep-gate `check:listing-visibility` + registry flip ✅ + planted-violation gate → **LV.4 (457)**.
- Owner-facing expiry warnings / auto-renew → explicitly deferred (decision #4).

## Reminder

After 455 the production bug is structurally fixed (no `active` row can be silently invisible), but the Epic is
complete only with LV.3 (operator visibility) + LV.4 (CI guard). Do not close Epic LV here.
