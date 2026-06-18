# Task 454 — Canonical status→visibility policy + predicate + public-eligible-but-hidden audit

**Date:** 2026-06-18
**Kickoff:** `tasks/Sprints/Sprint_36_kickoff_prompt_Task_454.md`
**Rework kickoff:** `tasks/Sprints/Sprint_36_kickoff_prompt_Task_454_REWORK.md`
**Rework-2 kickoff:** `tasks/Sprints/Sprint_36_kickoff_prompt_Task_454_REWORK2_DriftGuard.md`
**Epic:** LV (Listing Public Visibility Integrity) / Sprint 36, Slice LV.1

## What changed (base + rework + rework-2)

Created a single source of truth for "is this listing publicly visible?" and routed all 7 public read
sites through it. Zero behavior change to public reads — the composed filter chain is equivalent to the
previous inline filters (`.eq('status', 'active').gte('expires_at', new Date().toISOString())`).

### New files

- **`src/modules/listings/lib/visibility.ts`** — canonical policy + predicate:
  - `PUBLIC_VISIBLE_STATUSES`: `Record<ListingStatus, VisibilityRule>` covering all 6 statuses
  - `isListingPubliclyVisible(listing)`: pure function → `{ visible, reason }` where `HiddenReason = 'status_not_public' | 'expired' | 'no_expiry'`
  - `applyPublicVisibility(query)`: composable Supabase filter derived from the policy; **throws on mixed `requiresUnexpired` policy** (B2 — Option 2)
  - `VISIBILITY_POLICY_ANCHOR` comment for LV.4 grep-gate

- **`src/modules/listings/lib/__tests__/visibility.test.ts`** — 24 tests:
  - Policy completeness (covers all 6 statuses; only `active` is publicEligible)
  - `isListingPubliclyVisible`: active+non-expired=visible, active+expired=expired, active+null=no_expiry, each non-public status=status_not_public (with and without expires_at)
  - `applyPublicVisibility`: verifies `.eq('status','active')` + `.gte('expires_at', <now>)` filter calls + chaining
  - Policy-predicate consistency: broadening/narrowing detection + every HiddenReason reachable
  - **B1 drift-guard (REWORK-2):** imports `PUBLIC_VISIBLE_STATUSES` + `classifyHiddenReason` from the **actual** `scripts/audit-listing-visibility.mjs` — asserts deep-equal policy + 18-combo classification agreement
  - **B2 mixed-policy guard:** current uniform policy works; synthetic mixed policy throws

- **`scripts/audit-listing-visibility.mjs`** — read-only audit script. Exports `PUBLIC_VISIBLE_STATUSES` and `classifyHiddenReason` so the drift-guard test imports them. Execution gated behind `process.argv[1] === fileURLToPath(import.meta.url)` — importing does NOT run the audit.

- **`docs/governance-reports/2026-06-18-public-eligible-but-hidden-listings.md`** — audit result.

### Refactored call sites (7 public reads → `applyPublicVisibility`)

| # | File | Function/context |
|---|------|-----------------|
| 1 | `src/modules/listings/lib/queries.ts` | `getFeaturedListings` |
| 2 | `src/modules/listings/lib/queries.ts` | `getLatestListings` |
| 3 | `src/modules/listings/lib/queries.ts` | `getListings` |
| 4 | `src/app/[locale]/listings/page.tsx` | listings page (active tab) |
| 5 | `src/app/api/listings/route.ts` | API listings (active tab) |
| 6 | `src/modules/listings/components/SimilarListings.tsx` | similar listings |
| 7 | `src/app/api/cron/saved-searches/route.ts` | saved-search cron |

### Remaining inline `status='active'` (intentionally NOT refactored)

- `src/app/admin/page.tsx:32` — admin dashboard "Active listings" stat card (admin diagnostic, not public read).

## Rework items

### B1 — audit script drift guard (REWORK-2: AC1-real)

**Round 1 (false-green):** test contained a THIRD hand-typed `SCRIPT_POLICY` copy compared to canonical — the real script (#2) could drift undetected.

**Round 2 (fixed):** Script now `export`s `PUBLIC_VISIBLE_STATUSES` and `classifyHiddenReason`. Execution gated behind `process.argv[1] === fileURLToPath(import.meta.url)` so importing does not run the audit. Test now imports directly from the **actual** `scripts/audit-listing-visibility.mjs` via `import { PUBLIC_VISIBLE_STATUSES as SCRIPT_POLICY, classifyHiddenReason as scriptClassify } from '../../../../../scripts/audit-listing-visibility.mjs'`. No hand-typed decoy policy remains in the test.

**Planted-violation transcript:**
```
# 1. Planted violation: changed script's active.requiresUnexpired from true → false
#    Test output:
 FAIL  src/modules/listings/lib/__tests__/visibility.test.ts
  × script PUBLIC_VISIBLE_STATUSES is deep-equal to canonical
    "publicEligible": true,
-   "requiresUnexpired": true,
+   "requiresUnexpired": false,

 Test Files  1 failed (1)
 Tests  1 failed | 23 passed (24)

# 2. Reverted the violation → 24/24 pass
```

### B2 — mixed requiresUnexpired policy guard (Option 2)

`applyPublicVisibility` throws `"mixed requiresUnexpired policy is not supported"` if eligible statuses have mixed values. Test: uniform works, synthetic mixed throws.

### B3 — `getSiteStats` behavior change (AC3)

`getSiteStats` alignment = **intended visible behavior correction, accepted by owner/orchestrator 2026-06-18** (homepage count now reflects actually-visible listings; prior count overstated by active-but-expired rows).

### B4 — audit run result (AC4)

Report: `docs/governance-reports/2026-06-18-public-eligible-but-hidden-listings.md`
Result: **Total public-eligible: 1 | Hidden: 0**

## AC-by-AC self-audit

| AC | Status | Evidence |
|----|--------|----------|
| AC1-real — drift test imports from ACTUAL .mjs | ✅ | `visibility.test.ts:131` imports from `scripts/audit-listing-visibility.mjs`; no hand-typed `SCRIPT_POLICY` in test |
| AC2-proof — planted-violation FAIL | ✅ | Transcript above: `requiresUnexpired:true→false` → deep-equal assertion FAILS; reverted → PASS |
| AC3 — import doesn't execute audit | ✅ | `audit-listing-visibility.mjs:137-140` gates on `process.argv[1]`; test suite runs offline, no network/exit |
| AC4 — existing tests untouched + green | ✅ | 41 tests (24 visibility + 17 regression) all pass |
| AC5 — tsc=0, lint, integrity, no write-path | ✅ | tsc=0; NUL=0 both files; `grep update/insert/delete` = none; no git |

## File integrity

```
scripts\audit-listing-visibility.mjs — NUL=0, lines=140
src\modules\listings\lib\__tests__\visibility.test.ts — NUL=0, lines=203
tsc --noEmit: 0 errors
41 tests: all green
```

## Files Changed

| File | Change |
|------|--------|
| `scripts/audit-listing-visibility.mjs` | REWORK-2: `export` policy + classifier; move env/client into `main()`; gate execution behind `process.argv[1]` entry-point check |
| `src/modules/listings/lib/__tests__/visibility.test.ts` | REWORK-2: delete hand-typed `SCRIPT_POLICY`/`scriptClassifyHiddenReason`; import from actual `.mjs`; `@ts-ignore` for untyped .mjs import |
| `docs/sessions/2026-06-18-task454-canonical-listing-visibility-predicate.md` | Updated with REWORK-2 |
| `docs/backlog.md` | Last Session update |

Self-validation: **PASS** — tsc=0, 41 tests green, planted-violation FAIL confirmed, file-integrity clean, no write-path calls, no git. This is still LV.1 only — Epic LV incomplete until LV.2+LV.3+LV.4.
