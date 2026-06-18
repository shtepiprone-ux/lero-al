# Sprint 36 — Listing Public Visibility Integrity (Epic LV)

> **Status:** OPEN (created 2026-06-18)
> **Epic:** `tasks/Epics/Epic_LV_Listing_Public_Visibility_Integrity.md`
> **Goal:** Make it impossible for a listing to be `status='active'` yet silently invisible in public
> `/listings`. Establish ONE public-visibility predicate, reconcile the expiry lifecycle, surface the
> visibility state to operators, and lock it with a CI invariant guard.
> **Tasks:** 454 (LV.1) → 455 (LV.2) → 456 (LV.3) ‖ 457 (LV.4).
> **Sequencing:** 454 first. 455 blocked on owner answering the LV.2 decision block. 456 + 457 may run in
> parallel once 455 lands.

## Why this sprint (one paragraph)

The owner reported an `Active` listing (visible as Active in cabinet AND admin) that never showed in public
`/listings`; delete+recreate fixed it. Root cause (verified in code): public reads gate on
`status='active' AND expires_at >= now()` — duplicated across 5+ sites — while cabinet and admin label
"Active" off `status` alone, and **no writer ever reconciles a lapsed `expires_at`** (there is not even an
`expired` status to move into). So an active-but-expired/NULL-expires row is permanently, silently non-public.
This sprint removes the divergence at its source and makes the failure mode un-mergeable.

---

## Task 454 — LV.1: Canonical visibility predicate + public-eligible-but-hidden audit

**Type:** DB / server-action (read-path refactor) + diagnostic audit. **Kickoff:**
`tasks/Sprints/Sprint_36_kickoff_prompt_Task_454.md`.

> **⚠️ ALL statuses, not just `active` (owner directive 2026-06-18).** The policy and predicate must enumerate
> **every** `ListingStatus` (`active | inactive | sold | rented | archived | pending` + future values), not a
> hardcoded `'active'` check. Today only `active` is public-eligible, but the contract is defined over the full
> set so the audit, badge, and guard reason over all statuses and a future "shown" status plugs in with no
> divergence.

**Outcome:**
- New canonical **status→visibility policy** `PUBLIC_VISIBLE_STATUSES` (every `ListingStatus` →
  `{ publicEligible, requiresUnexpired }` or equivalent) + pure helper
  `isListingPubliclyVisible(listing): { visible: boolean; reason: HiddenReason | null }` + composable Supabase
  query fragment `applyPublicVisibility(query)` as the **single source of truth**.
  `HiddenReason ∈ { 'status_not_public', 'expired', 'no_expiry' }` (extend only with owner sign-off).
- Refactor **all** public read sites to the fragment — **equivalent** filter chain / returned row set (same
  rows, ordering, pagination, columns, error behavior), zero behavior change:
  `listings/lib/queries.ts` (×3), `app/api/listings/route.ts`, `app/[locale]/listings/page.tsx`,
  `components/SimilarListings.tsx`. (Decide `getSiteStats` alignment in the kickoff — likely route it through
  the fragment so the headline count matches `/listings`.)
- One-time **audit report** (`docs/governance-reports/2026-06-<dd>-public-eligible-but-hidden-listings.md`) produced by a
  read-only script: every row whose status is marked `publicEligible` by the policy but rejected by the public
  predicate, with `id`, `slug`,
  `expires_at`, and `reason`. This is the backlog LV.2 will backfill.

**Guardrails:** no lifecycle/status/`expires_at` writes in this slice; pure de-duplication + diagnosis. The
audit covers **every** listing whose status the policy marks public-eligible but the public query rejects — not
only `active` (so if any non-`active` row is unexpectedly eligible/hidden it surfaces too).
**Regression (clause 15):** add/extend a vitest test asserting `applyPublicVisibility` is driven by the policy
map (currently `status='active' && expires_at>=now()`) for **each** `ListingStatus`, and that all refactored
callers go through it; planted-violation (inline predicate) must FAIL the LV.4 gate (gate itself lands in 457;
454 leaves a TODO marker the gate keys on).

---

## Task 455 — LV.2: Lifecycle reconciliation (close the silent state)

**Type:** Schema / migration + server-action + cron. **Kickoff:**
`tasks/Sprints/Sprint_36_kickoff_prompt_Task_455_LifecycleReconciliation.md`.

**✅ OWNER DECISIONS (FINAL 2026-06-18):**
1. **Add a new `'expired'` `ListingStatus`** — do NOT reuse `inactive` (`inactive` = manual deactivation;
   `expired` = system lifecycle state; keep distinct for honest diagnostics).
2. **Yes — re-stamp `expires_at = now + window`** on every transition INTO a public-eligible status
   (re-activation / approval / renew), so a stale timestamp can never recreate the bug.
3. **`expires_at IS NULL` = invalid/hidden** (broken lifecycle data), NOT "never expires." The RECURRING sweep
   leaves NULL rows untouched (no silent auto-expire), but the **one-time backfill in Task 455 explicitly
   resolves `active+NULL → expired` (reason `no_expiry`)** so no `active` row stays silently invisible.
4. **No auto-renew this slice; hard exclusion for expired; add reconciliation + backfill** moving lapsed
   `active` → `expired`. Operator reason visibility = LV.3; CI guard = LV.4.

**Outcome:** `expired` status + engine actions (`EXPIRE`/`RENEW`) + re-stamp-on-active in the single write path
+ service-role reconciliation sweep + one-time backfill + 4-locale `expired` labels. Invariant "`active` ⇒
publicly visible (or reconciled out of `active`)" holds in the DB. **This is the slice that fixes the production
bug.** **Regression (clause 15):** engine + re-stamp + sweep tests (lapsed active→expired; fresh active
untouched; NULL excluded; expired→active yields fresh future `expires_at`); planted-violation drops the re-stamp.
**DB migration RESOLVED:** `listings.status` is pg enum `listing_status` (owner native check 2026-06-18) → migration = `ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'expired';`, owner-run native, irreversible, **must commit before any backfill uses the value** (can't use a new enum value in the adding txn). **Cron runner DECIDED:** Vercel cron route `src/app/api/cron/listings-expiry/route.ts` mirroring `saved-searches`. No open STOP-and-ASK gates remain.

---

## Task 456 — LV.3: Surface public visibility in cabinet + admin

**Type:** Admin-table + UI (cabinet rows, admin listings table + detail).

**Outcome:**
- Cabinet listing cards/rows and admin listings table + detail render **Public visibility: Visible / Hidden —
  reason** next to `status`, computed from the LV.1 helper (no re-spelled predicate).
- Admin listings gains a **"public-eligible but hidden"** filter / audit view surfacing the LV.1 set live.
- Preserve every existing control (Note 20); add only the visibility indicator + filter.
- **Mobile <640 full-width gate** (agent-contract clauses 11–12) on every touched surface; **`sq/en/uk/it`**
  parity for all new strings incl. each `HiddenReason` label; rendered verification matrix in the session log.

**Regression (clause 15):** test that the badge text == the canonical predicate result for representative rows.

---

## Task 457 — LV.4: Invariant guard + regression shield

**Type:** Regression / critical-flow coverage + governance tooling.

**Outcome:**
- `scripts/check-listing-visibility.mjs` + `npm run check:listing-visibility`, wired **blocking** into
  `governance-pr.yml`: FAILS if any public `from('listings')` read (outside the canonical helper) applies a raw
  `status`/`expires_at` visibility filter instead of `applyPublicVisibility`. Allowlist the helper + admin/cabinet
  internal reads explicitly.
- Vitest **invariant** test exercised across **every** `ListingStatus`: for the same listing fixture set, the
  public-query predicate and the cabinet/admin "visible" computation agree per status; an active-but-expired
  fixture is `visible:false, reason:'expired'`; non-public statuses are `visible:false, reason:'status_not_public'`.
- **`docs/critical-flow-registry.md` row** "Listing public visibility invariant" flipped ⏳→✅ with command +
  planted-violation FAIL transcript (inline predicate re-introduced → gate FAILS).

---

## Sprint Definition of Done

- 454 + 455 + 456 + 457 approved on real-diff review; commits emitted per task (explicit paths).
- Epic LV DoD satisfied: single predicate, no silent public-eligible-but-hidden state, operator-visible reasons,
  blocking CI invariant gate, registry row ✅.
- Owner LV.2 decision block answered and recorded in the 455 kickoff + session log.
