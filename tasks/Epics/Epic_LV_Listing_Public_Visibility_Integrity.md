# Epic LV — Listing Public Visibility Integrity

> **Status:** OPEN (created 2026-06-18)
> **Owner-layer:** Orchestrator-planned (Opus); implementation delegated to Sonnet 4.6.
> **Sprint:** Sprint 36 (`tasks/Sprints/Sprint_36_Listing_Public_Visibility_Integrity.md`).
> **Tasks:** 454 (LV.1), 455 (LV.2), 456 (LV.3), 457 (LV.4).
> **Severity:** P0 — directly damages seller trust ("my Active listing is invisible") and is silent at scale.

## Problem (owner report, 2026-06-17)

The owner created a listing that showed **`status = "Active"`** in the owner cabinet **and** in the admin
panel, but the listing **never appeared in public `/listings`**. Changing the status back and forth and
editing the description did **not** make it appear. **Deleting it and creating a fresh listing fixed it.**

The owner's concern is the right one: this is **not** "the list didn't refresh." It is a dangerous class of
bug — *a record the owner/admin see as `Active` that the public listings query considers ineligible to show* —
and at 5,000 users with hundreds of daily publications it **cannot** be caught by eye. It must be made
**impossible to enter silently**, **observable when it exists**, and **caught automatically in CI**.

## Root cause (code-grounded, verified 2026-06-18)

The project has **no single definition of "publicly visible."** Three different layers answer the question
"is this listing shown?" with **three different predicates**:

1. **Public reads require `status='active'` AND `expires_at >= now()`** — duplicated across **5+ call sites**:
   - `src/modules/listings/lib/queries.ts` → `getListings`, `getLatestListings`, `getFeaturedListings`
   - `src/app/api/listings/route.ts:22`
   - `src/app/[locale]/listings/page.tsx:49`
   - `src/modules/listings/components/SimilarListings.tsx:64`
2. **Owner cabinet** (`src/modules/cabinet/lib/queries.ts`) selects/derives badge from **`status` alone** — no
   `expires_at` filter. So cabinet renders "Active" for a listing the public query rejects.
3. **Admin** (`src/app/admin/listings/page.tsx:65`, `src/app/admin/page.tsx`) filters/labels off **`status`
   alone** — no `expires_at` filter. So admin renders "Active" for the same rejected listing.

The trigger is the **`expires_at` lifecycle**:

- `createListing` (`src/modules/listings/actions/createListing.ts:42,51`) stamps
  `expires_at = now + 30 days` once, at insert.
- **No status value exists for "expired"** — `ListingStatus = 'active' | 'inactive' | 'sold' | 'rented' |
  'archived' | 'pending'` (`src/types/database.ts:43`). There is **nothing to transition into** when the
  window lapses.
- **No writer ever reconciles a lapsed window.** Status transitions (`applyListingTransition.ts` /
  `changeListingStatusAction`) and `updateListing` do **not** refresh `expires_at`. The saved-search cron only
  *reads* `expires_at`; it never flips status.
- Therefore once `expires_at < now()` (or is `NULL`), the row stays **`status='active'` forever** in the DB,
  shows "Active" in cabinet + admin, and is **silently and permanently excluded** from every public read
  (`.gte('expires_at', now)` excludes both past and `NULL` values in Postgres).

This exactly reproduces the report: toggling status / editing description never touches `expires_at`, so the
listing stays invisible; **delete + recreate** stamps a fresh 30-day window, so the new one shows. The owner's
"Active" listing was almost certainly an **active-but-expired (or NULL-expires)** record.

> **Secondary divergence:** `getSiteStats` counts `status='active'` with **no** expiry filter, so the homepage
> "N listings" headline can exceed the number actually shown in `/listings`. Same root cause — no shared predicate.

## Scope clarification (owner directive 2026-06-18) — ALL public-eligible statuses, not just `active`

This Epic is **not** limited to `status='active'`. The contract is defined over the **entire `ListingStatus`
set** (`active | inactive | sold | rented | archived | pending`, plus any future value such as `expired` or
`reserved`). The single source of truth is a canonical **status → public-visibility policy** that states, for
**every** status, whether a listing in that status is meant to appear in public `/listings` and under what
additional conditions (e.g. non-lapsed `expires_at`). Today only `active` is public-eligible, but the policy
must enumerate **all** statuses explicitly so that:
- the rule is auditable and future-proof (adding a public-eligible status = one edit in one place);
- the audit (LV.1), the operator-facing visibility badge (LV.3), and the CI guard (LV.4) all reason over the
  **whole** status set, not a hardcoded `'active'` literal;
- any status the owner later decides should be shown (or shown with a sub-state) plugs into the same predicate
  with zero divergence.

## The invariant this Epic establishes

> **For EVERY listing status, public visibility must be computed from ONE shared predicate driven by a single
> status→visibility policy. Any surface that labels a listing with a status the policy marks "public-eligible"
> must either show it publicly OR display an explicit, truthful reason why it is hidden. A "shown" status must
> never silently mean "invisible," and a "not shown" status must be explainable on sight.**

## Architecture decision (grounds the smallest correct fix)

- **Single source of truth: a status→visibility policy + predicate.** Introduce ONE canonical
  `PUBLIC_VISIBLE_STATUSES` policy map (every `ListingStatus` → `{ publicEligible: boolean; requiresUnexpired:
  boolean }` or equivalent) and build on it a pure helper `isListingPubliclyVisible(listing): { visible:
  boolean; reason: HiddenReason | null }` plus a composable query fragment `applyPublicVisibility(query)`.
  Route **every** public read and every "is it visible" badge through them. No call site re-spells
  `status='active' AND expires_at>=now()` (or any other status literal) inline. This is the Note-14
  global-change rule applied to the **whole status set**: change the policy in one place, all consumers follow.
- **Reconcile the lifecycle so `status` reflects reality.** A listing whose window has lapsed must not keep a
  truthful-looking `active` status. Two complementary mechanisms (final split decided in LV.2):
  (a) **expiry reconciliation** — a scheduled/RPC sweep that moves lapsed `active` rows to a non-public state,
  and (b) **window refresh on re-activation** — approving/re-activating a listing re-stamps `expires_at`.
- **🛑 STOP-and-ASK design forks (owner decides in LV.2, do NOT guess):**
  1. Add a new `'expired'` `ListingStatus` value **vs.** reuse `'inactive'` for lapsed listings. (Adding a
     status touches the enum, transition matrix, admin filters, i18n labels across `sq/en/uk/it`, and the
     status badge — a larger blast radius; reusing `inactive` is smaller but loses the "expired vs manually
     deactivated" distinction.)
  2. Whether expiry is a **hard exclusion** (current behavior) or listings should **auto-renew** / prompt the
     owner before lapsing.
  3. Whether `expires_at IS NULL` should be **treated as "never expires" (visible)** or **"invalid → hidden"**
     (current behavior hides it).
  These are product-policy calls. LV.2's kickoff presents them as an explicit decision block; implementation
  does not start until the owner answers.
- **Observability, not just a fix.** Cabinet + admin must *show* the computed visibility and the hidden-reason
  so a moderator/owner never has to guess why an "Active" listing isn't public (LV.3).
- **Make regressions impossible to merge.** A canonical predicate is only durable if new code can't bypass it;
  LV.4 adds a CI grep-gate that fails any new public `from('listings')` read lacking `applyPublicVisibility`,
  plus a regression test of the invariant and a `critical-flow-registry` row.

## Slices

| Slice | Task | Title | Outcome |
|---|---|---|---|
| **LV.1** | **454** | Canonical status→visibility policy + predicate + audit | One `PUBLIC_VISIBLE_STATUSES` policy covering **all** statuses + `isListingPubliclyVisible` / `applyPublicVisibility` source; all 5+ public reads refactored to it (zero behavior change to the predicate); a one-time audit report listing every listing whose status the policy marks **public-eligible** but the public query rejects, with the reason. **Diagnose + de-duplicate; no lifecycle change yet.** |
| **LV.2** | **455** | Lifecycle reconciliation (close the silent state) | After the owner answers the LV.2 decision block: reconcile lapsed `active` listings to a non-public status AND/OR refresh `expires_at` on re-activation, so `status='active'` can no longer coexist with "not publicly visible" silently. Backfill the rows found in LV.1. |
| **LV.3** | **456** | Surface public visibility in cabinet + admin | Cabinet listing rows and admin listings table/detail show **Public visibility: Visible / Hidden — reason** next to status, computed from the LV.1 helper. Admin gets a "public-eligible but hidden" filter/audit view. Full mobile <640 full-width gate + 4-locale parity. |
| **LV.4** | **457** | Invariant guard + regression shield | (a) CI grep-gate (`check:listing-visibility`) failing any public `from('listings')` read that filters on a raw `status`/`expires_at` literal instead of `applyPublicVisibility`; (b) vitest invariant test exercised across **every** `ListingStatus` — public predicate == cabinet/admin "visible" badge for the same row, per status; (c) `critical-flow-registry` row; (d) planted-violation FAIL transcript proving the gate is real. |

**Sequencing:** LV.1 first (everything depends on the single predicate). LV.2 needs the owner decision block
answered. LV.3 consumes LV.1's helper. LV.4 locks the result. LV.3 and LV.4 may run in parallel after LV.2.

## Definition of Done (Epic LV)

- One canonical public-visibility predicate exists; **no** inline `status='active' && expires_at>=now()`
  remains at any public read site (verified by the LV.4 grep-gate, green in CI).
- It is **structurally impossible** for a listing to be `status='active'` and silently non-public: the lapsed
  state is reconciled (LV.2) and the LV.1 audit set is backfilled to zero.
- Cabinet + admin display the computed public visibility + hidden reason; an operator can find every
  "public-eligible-but-hidden" listing without reading the DB (LV.3).
- A `critical-flow-registry` row + green regression test + planted-violation FAIL transcript exist for the
  invariant (LV.4); the gate is blocking in CI.
- All UI work passes the Mobile <640 full-width gate and `sq/en/uk/it` parity (agent-contract clauses 11–13).
- Every slice's kickoff carries explicit Positive + Negative flows and the regression-coverage block
  (agent-contract clauses 6a + 15).

## Pre-read per slice (from `docs/rule-index.md`)

- **LV.1 / LV.2:** DB / server-action / RLS bundle (`data-access-rules.md`, `rls-rules.md`, `domain-rules.md`,
  `qa-rules.md`) + Regression/critical-flow bundle (`critical-flow-registry.md`, `Epic_RS_Regression_Shield.md`)
  + always-required (`agent-contract.md`, `backlog.md`).
- **LV.3:** Admin-table + UI bundle (`design-system.md`, `ui-rules.md`, `component-rules.md`,
  `component-governance.md`, `domain-rules.md`, `qa-rules.md`, `ai-behavior.md` Note 22) + always-required.
- **LV.4:** Regression/critical-flow bundle + `qa-rules.md` + Docs/governance bundle + always-required.
