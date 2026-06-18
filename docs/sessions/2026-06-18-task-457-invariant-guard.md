# Session — Task 457: Invariant guard + regression shield (LV.4)

**Date:** 2026-06-18  
**Epic:** LV (Listing Public Visibility Integrity) · **Sprint 36** · LV.4  
**Executor:** Sonnet 4.6

## Summary

Added the blocking CI grep-gate, per-ListingStatus invariant test, and gate self-test that make the canonical public-visibility predicate un-bypassable. Flipped the critical-flow-registry row ⏳→✅. **Closes Epic LV** (454→455→456→457 all complete). Zero product-behavior change — tooling/tests/governance only.

No UI surface touched — clauses 11–13 N/A. No new user-facing strings added — locale parity N/A.

## Parts completed

### Part A — `scripts/check-listing-visibility.mjs` + `npm run check:listing-visibility`
- **Context-aware detector**: `extractListingsQueryBlocks()` finds `from('listings')` chains in each file, then checks only those blocks for visibility literals. Non-listings reads, writes (`.update`/`.insert`/`.delete`/`.upsert`), and other-table queries are never flagged.
- **One pure exported function**: `detectVisibilityViolations(source, path)` shared by BOTH the CI scan AND the self-test — the self-test calls the exact same code.
- **Derived-variable tracking**: `extractListingsQueryBlocks()` captures both inline chains AND derived variables (`let query = supabase.from('listings')...` then later `query = query.eq(...)` / `query.gte(...)` lines).
- Covers **9 Supabase literal variants**: `.eq('status','active')`, `.in('status', [any array containing 'active'])`, `.match({status:'active'})`, `.filter('status','eq','active')`, PostgREST `status.eq.active`, `.gte('expires_at',...)`, `.lt('expires_at',...)`, `.is('expires_at', null)`, `expires_at.gte/lt/is.` in filter strings.
- Anchor assertion: FAILS if `VISIBILITY_POLICY_ANCHOR` missing from canonical source.
- **No broad consumer-path exclusions**. Only canonical source + test/story/fixture/script globs excluded by path.
- **Exact/narrow allowlist** (7 entries) for justified non-public reads that DO contain the literal pattern within a `from('listings')` block:
  - `admin/page.tsx` — dashboard active-count stat (head:true, not a public list read)
  - `cron/listings-expiry` — lifecycle sweep `.eq('status','active')` + `.lt('expires_at')` + `.is('expires_at', null)` (engine-driven, not public)
  - `listings/[slug]/view` — single-row view-count, multi-status display filter
  - `[locale]/listings/[slug]` — single-row detail page, multi-status display filter
  - `recentlyViewedQueries.ts` — resolution by saved IDs, multi-status filter
- Each allowlist entry pins path + fingerprint + reason. Stale entries FAIL the gate.
- Baseline: `check:listing-visibility` → **0 violations**, 7 allowlist entries, 0 stale, 460 files scanned.

### Part B — Gate self-test (`check:listing-visibility:verify`)
- Calls the **SAME** `detectVisibilityViolations` function (not a re-implementation)
- **13 bad variants DETECTED** (including multi-status `.in('status',['active','pending'])`, `.lt('expires_at',...)`, `.is('expires_at', null)`, and 3 derived-variable patterns: `query.eq('status','active')`, `query.in('status',['active','pending'])`, `query.lt('expires_at', now)`)
- **3 good snippets CLEAN** (canonical helpers)
- **4 no-false-positive snippets**: dynamic `.eq('status', param)` on listings, status write/update on listings, other-table `.gte('expires_at',...)`, comment with pattern
- **20/20 self-test checks pass**

### Part C — Per-ListingStatus invariant test
- 21 new tests in `visibility.test.ts`: for all 7 statuses × 3 expiry states (future/past/null), asserts fragment⇔predicate⇔badge agree
- `wouldFragmentSelect()` simulates `applyPublicVisibility`'s query fragment output
- 66 total tests pass (45 existing + 21 new)

### Part D — CI wiring + registry flip
- `governance-pr.yml`: 2 new blocking steps (gate + self-test)
- `critical-flow-registry.md`: "Listing public visibility invariant" row flipped ⏳→✅ with accurate 66-test count

## Planted-violation transcripts

### #1 — Multi-status .in + .lt + .is on public read → gate FAILS
**Mutation:** Replaced `applyPublicVisibility(...)` with inline `.in('status', ['active', 'pending']).lt('expires_at', now).is('expires_at', null)` in `queries.ts:getFeaturedListings`
```
❌ 3 inline visibility literal(s) on listings reads:

   src/modules/listings/lib/queries.ts:36  .in('status', ['active', 'pending'])
   src/modules/listings/lib/queries.ts:37  .lt('expires_at', new Date().toISOString())
   src/modules/listings/lib/queries.ts:38  .is('expires_at', null)

❌ 3 issue(s) — gate FAILED.
```
**Restore → PASS** (0 violations)

### #2 — Policy break → invariant test FAILS
**Mutation:** Changed `PUBLIC_VISIBLE_STATUSES.sold.publicEligible` from `false` to `true`
```
Test Files  1 failed (1)
Tests  33 failed | 33 passed (66)
```
Mixed `requiresUnexpired` policy triggers the `applyPublicVisibility` guard + per-status invariant diverges.
**Restore → 66/66 PASS**

## Verification

- `tsc --noEmit` = 0 errors
- `npx vitest run .../visibility.test.ts` = 66/66 PASS
- `npm run check:listing-visibility` = PASS (0 violations, 7 allowlist entries, 0 stale, 460 files)
- `npm run check:listing-visibility:verify` = PASS (20/20 self-test checks)
- `node --check scripts/check-listing-visibility.mjs` = parses OK
- Final diff: no planted violations remain, no product-behavior change

## Files Changed

| Path | Rationale |
|---|---|
| `scripts/check-listing-visibility.mjs` | Part A: context-aware grep-gate with exported detector function |
| `package.json` | Part A: 3 new scripts (`check:listing-visibility`, `:report`, `:verify`) |
| `src/modules/listings/lib/__tests__/visibility.test.ts` | Part C: 21 new per-ListingStatus invariant tests (66 total) |
| `.github/workflows/governance-pr.yml` | Part D: 2 new blocking CI steps |
| `docs/critical-flow-registry.md` | Part D: row flipped ⏳→✅ |
