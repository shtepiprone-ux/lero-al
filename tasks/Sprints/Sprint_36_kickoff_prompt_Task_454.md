# Kickoff — Task 454 (Epic LV / Sprint 36, LV.1)
## Canonical status→visibility policy + predicate + public-eligible-but-hidden audit

> **Executor:** Sonnet 4.6. **Orchestrator reviews the real diff, not this report.**
> **Epic:** `tasks/Epics/Epic_LV_Listing_Public_Visibility_Integrity.md` ·
> **Sprint:** `tasks/Sprints/Sprint_36_Listing_Public_Visibility_Integrity.md`.
> This is a **read-path refactor + diagnostic** task. **You do NOT change any listing's status, `expires_at`,
> or any write path.** Lifecycle changes are LV.2 (Task 455).

## Hard contract (agent-contract.md clauses 1–15 apply)

- **No scope change.** Only the files needed to (a) create the canonical policy/predicate/fragment, (b) route
  the existing public reads through it preserving an **equivalent query** (same filter chain → same returned
  rows, ordering, pagination, selected columns, and error behavior), and (c) produce the read-only audit.
- **Do not invent architecture / do not guess.** If anything is ambiguous (e.g. `getSiteStats` alignment, or
  whether a sixth public read site exists), **STOP and ASK the orchestrator** — do not decide silently.
- **No behavior change to the predicate.** The refactor must produce an **equivalent Supabase filter chain** to
  what the call sites emit today — for the public-eligible set that means the same
  `.eq('status', <publicEligibleStatus>)` + `.gte('expires_at', now)` calls — and **identical results**
  (same rows, ordering, pagination, selected columns, error propagation). Assert equivalence by the resulting
  filter-builder calls and returned rows, NOT by comparing raw SQL strings. This is pure de-duplication; the
  *behavior* fix is LV.2.
- **Literal `'active'` is allowed ONLY inside `PUBLIC_VISIBLE_STATUSES` and in test fixtures / expected
  assertions.** It must NOT appear as an inline visibility filter at any public read call site — those go
  through `applyPublicVisibility`, which derives the status from the policy. (This resolves the apparent
  tension between "don't hardcode `'active'`" and "today's filter is `status='active'`": the literal lives in
  the policy/tests, never in a call site.)
- **All four locales** for any new user-facing string (none expected in this slice; if a `HiddenReason` label is
  added for the audit report, it is a doc string, not UI — keep UI strings for LV.3).
- Self-validate before "complete": `npx tsc --noEmit` = 0; run the touched vitest; AC-by-AC self-audit table;
  file-integrity transcript (clause 14); "Files Changed" table. **Do NOT run git.**

## Pre-read (rule-index.md → DB/server-action + Regression bundle)

- `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (always-required)
- `docs/data-access-rules.md`, `docs/domain-rules.md`, `docs/rls-rules.md`, `docs/qa-rules.md`
- `tasks/Epics/Epic_RS_Regression_Shield.md` (regression-coverage contract)
- `tasks/Epics/Epic_LV_Listing_Public_Visibility_Integrity.md` (this Epic — architecture decision + invariant)

## Background (verified by orchestrator 2026-06-18 — confirm before changing)

Public reads gate on `status='active' AND expires_at >= now()`, duplicated across:
`src/modules/listings/lib/queries.ts` (`getListings`, `getLatestListings`, `getFeaturedListings`),
`src/app/api/listings/route.ts:22`, `src/app/[locale]/listings/page.tsx:49`,
`src/modules/listings/components/SimilarListings.tsx:64`. Cabinet (`src/modules/cabinet/lib/queries.ts`) and
admin (`src/app/admin/listings/page.tsx`) label status off `status` alone → divergence. `ListingStatus =
'active' | 'inactive' | 'sold' | 'rented' | 'archived' | 'pending'` (`src/types/database.ts:43`) — **no
`expired` value exists**. `getSiteStats` counts `status='active'` with **no** expiry filter.

## ⚠️ Scope: ALL statuses, not just `active` (owner directive 2026-06-18)

The policy must enumerate **every** `ListingStatus`, marking each `publicEligible` (and `requiresUnexpired`).
Today only `active` is `publicEligible:true`; all others `false`. Do **not** hardcode the string `'active'` in
the predicate — read it from the policy. This makes the audit/guard reason over the whole status set and lets a
future "shown" status plug in with one edit.

## What to build

1. **Canonical policy + predicate (new file, e.g. `src/modules/listings/lib/visibility.ts`):**
   - `PUBLIC_VISIBLE_STATUSES`: a `Record<ListingStatus, { publicEligible: boolean; requiresUnexpired: boolean }>`
     covering all six statuses (active → `{true, true}`; others → `{false, false}`).
   - `isListingPubliclyVisible(listing): { visible: boolean; reason: HiddenReason | null }` where
     `HiddenReason = 'status_not_public' | 'expired' | 'no_expiry'`. Pure; no DB call.
   - `applyPublicVisibility(query)`: composable Supabase filter that reproduces today's **effective filter chain /
     returned row set** for the public-eligible set (`.eq('status','active').gte('expires_at', now)`), derived
     from the policy (not a hardcoded literal) so adding a public-eligible status changes only the policy.
2. **Refactor all public read sites** to call `applyPublicVisibility(...)` instead of inline filters. Confirm
   the composed filter-builder calls are equivalent to today's behavior (same returned rows / ordering /
   pagination / columns — assert on builder calls + result set, not raw SQL strings). Decide `getSiteStats`
   alignment **with the orchestrator**
   (recommend routing it through the policy so the headline count matches `/listings`; if that changes the
   displayed number, STOP and ASK — it is a visible behavior change).
3. **One-time audit (read-only):** `scripts/audit-listing-visibility.mjs` that queries every listing whose status
   is `publicEligible` but which `isListingPubliclyVisible` rejects, and writes
   `docs/governance-reports/2026-06-<dd>-public-eligible-but-hidden-listings.md` with `id, slug, status, expires_at,
   reason` rows + totals. **No writes to the DB.** This list is the backfill input for LV.2.
4. **TODO marker** for the LV.4 gate: a single well-known comment/const the `check:listing-visibility` script
   (Task 457) will key on, so the gate can detect any future inline visibility filter.

## Positive flow (happy path)

- **Actor:** anonymous visitor hits `/listings`, `/api/listings`, homepage featured/latest, a listing detail's
  "similar" rail. **Precondition:** ≥1 `active`, non-expired listing exists.
- **Steps:** each surface calls its query → query composes `applyPublicVisibility(query)` → the resulting
  filter chain is equivalent to today's (`status='active'` + `expires_at>=now()`) → same rows returned, same
  order, same pagination and columns.
- **Success state:** identical listings shown as before this task (no visible change anywhere). Audit script run
  by the owner produces the governance report. **Post-conditions:** zero DB mutations; new helper is the only
  place the predicate is spelled.

## Negative flow (every off-happy-path branch)

- **Active-but-expired / NULL-expires row:** still excluded from public reads (unchanged); appears in the audit
  report with `reason:'expired'` / `'no_expiry'`. **Not** "fixed" here (that is LV.2).
- **Non-public status (`inactive/sold/rented/archived/pending`):** `isListingPubliclyVisible` →
  `visible:false, reason:'status_not_public'`; excluded from public reads (unchanged).
- **Empty result / no eligible listings:** public surfaces render their existing empty states; audit report
  states "0 public-eligible-but-hidden rows." No error.
- **Supabase/query error:** existing error propagation preserved (e.g. `getListings` still `throw error`); do not
  swallow. Audit script on DB error exits non-zero with a clear message and writes no partial report.
- **`getSiteStats` divergence discovered:** if aligning it changes the public count, STOP and ASK — do not ship a
  silent headline-number change under this task.
- **Refactor changes the query:** if any call site cannot reproduce an equivalent filter chain / identical
  result set via the fragment, STOP and ASK rather than approximating.

## Acceptance criteria (each maps to a flow + is diff-verifiable)

1. New `visibility.ts` exports `PUBLIC_VISIBLE_STATUSES` (all 6 statuses), `isListingPubliclyVisible`,
   `applyPublicVisibility` — Positive flow, verifiable at file:line.
2. All 5+ public read sites call `applyPublicVisibility`; **no** inline `status='active'`/`expires_at` visibility
   literal remains at any public read site — Positive flow, grep-clean, file:line each.
3. Vitest proves `applyPublicVisibility`/`isListingPubliclyVisible` is policy-driven and correct for **each**
   `ListingStatus` (active non-expired → visible; active expired → `expired`; active NULL-expiry → `no_expiry`;
   each non-public status → `status_not_public`) AND that the composed filter-builder calls are equivalent to
   today's behavior (same returned row set) — Negative + Positive.
4. `scripts/audit-listing-visibility.mjs` is read-only, produces the governance report, exits non-zero on DB
   error with no partial write — Negative flow, file:line.
5. `getSiteStats` decision recorded (aligned via policy, or explicitly deferred with orchestrator sign-off) — no
   silent count change.
6. `critical-flow-registry` row "Listing public visibility invariant" present as ⏳ (scheduled LV.4) OR updated
   if already added by the orchestrator — traceability.
7. Self-validation block: tsc=0 · touched vitest green · file-integrity clean · "Files Changed" table · AC table
   all green citing Positive/Negative flows. No git commands emitted.

## Regression coverage (clause 15)

This task touches the **Create listing / Status change / public listings read** flows already in
`docs/critical-flow-registry.md`. Establish the existing `createListing`/`listingStatusChange` smokes are green
BEFORE changing anything (record baseline), and add the new `visibility.ts` unit test covering every status.
Leave the blocking CI gate + planted-violation transcript to LV.4 (Task 457), but the unit test must already
FAIL if the predicate is wrongly broadened/narrowed.

## Out of scope (route to later slices)

- Any `status` / `expires_at` **write**, reconciliation sweep, or `expired` status → **LV.2 (455)**.
- Cabinet/admin visibility badge + "public-eligible-but-hidden" filter UI → **LV.3 (456)**.
- The CI grep-gate + registry flip to ✅ + planted-violation → **LV.4 (457)**.

## 🔴 This task does NOT fix the production bug — read before closing

Task 454 only builds the single predicate, refactors the public reads through it (no behavior change), and
**diagnoses** the problem via the audit report. The owner-reported defect — an `active`-but-expired/NULL-expiry
listing showing "Active" yet absent from `/listings` — is **still present** after 454 lands, because the
lifecycle reconciliation (and the operator-facing reason + CI guard) are LV.2/LV.3/LV.4. **Do not mark Epic LV
complete, and do not imply the bug is fixed, after 454.** The Epic is incomplete until **455 + 456 + 457** land.

## Deliverables in the session log

`docs/sessions/2026-06-<dd>-task454-canonical-listing-visibility-predicate.md` with: Files Changed table,
AC-by-AC self-audit, file-integrity transcript, the audit-report path + row count, and the `getSiteStats`
decision. Update `docs/backlog.md` Last Session (2–4 lines). Do **not** emit git commands — the orchestrator does.
