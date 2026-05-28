# Task 265 — X.4 — `listings.search_vector` drift: add to `Listing` TS type + schema-drift guard

**Date:** 2026-05-28  
**Sprint:** 15 (queued by Sprint 14 review)  
**Type:** chore (domain-type integrity)  
**Status:** ✅ Complete

---

## Problem Statement

After Task 250 + Task 262 were applied, the owner ran `npm run check:schema-drift` against production Supabase and got:

```
[{ "table_name": "listings", "column_name": "search_vector", "status": "not in types" }]
```

The `listings.search_vector` column exists in the DB (PostgreSQL `tsvector` generated column for full-text search) but was missing from the `Listing` TypeScript interface in `src/types/database.ts`. It was intentionally excluded from the drift guard with a comment in `check-schema-drift.mjs`, but the orchestrator ruled that including it in the types is more correct — the guard should catch if the column is ever dropped or renamed.

---

## Audit — No Existing SELECT Projections

```
grep -rn "search_vector" src/ → 0 hits
```

`search_vector` is never SELECT-projected in any client-side code. It is used only via PostgREST's `.textSearch()` filter operator server-side. Adding it to the `Listing` type creates zero risk of accidental misuse.

---

## Positive Flow

1. DB column confirmed: `tsvector` generated column, exists in production DB (RESULT SET 2 showed it as "not in types"). ✅
2. Added `search_vector: unknown | null` to `Listing` interface in `src/types/database.ts` (after `updated_at` — last field). ✅
3. Updated comment in `scripts/check-schema-drift.mjs`: removed "intentionally NOT in types" exclusion; replaced with explanation that it's now included for drift-guard coverage. ✅
4. Ran `node scripts/check-schema-drift.mjs` → regenerated SQL: **28 tables / 263 cols** (was 262). `listings` → 42 cols (was 41). ✅
5. `npx tsc --noEmit` → 0 errors. ✅

---

## Negative Flow — Branch Responses

| Branch | Response |
|--------|----------|
| Existing code references `search_vector` in SELECT | grep proves 0 hits — not triggered |
| TS type `unknown` choice | Safe — prevents accidental misuse as string; consistent with tsvector being opaque in JS |
| DB column dropped in future | Drift guard will flag it in RESULT SET 1 (missing in DB) on next run — the whole point of adding it |
| Schema-drift script error | Not triggered — script ran cleanly |

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `search_vector` in `Listing` interface | ✅ `search_vector: unknown | null` after `updated_at` |
| `scripts/schema-drift-check.sql` regenerated | ✅ 28 tables / 263 cols; listings = 42 cols |
| grep: no SELECT projections include `search_vector` | ✅ 0 hits |
| No new locale keys | ✅ |
| Exclusion comment in mjs updated | ✅ |

**Final verdict:** ✅ PASS — `search_vector` typed, SQL regenerated, tsc=0, grep clean.

---

## Owner Action Required

Run `scripts/schema-drift-check.sql` in Supabase SQL Editor.  
Expected: **0 rows** in RESULT SET 1 (no columns missing from DB) and **0 rows** in RESULT SET 2 (no untracked DB columns). The `listings.search_vector` item that appeared before is now covered.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/types/database.ts` | Added `search_vector: unknown | null` to `Listing` interface after `updated_at` | Include tsvector in type coverage for drift guard |
| `scripts/check-schema-drift.mjs` | Updated comment: removed "intentionally NOT in types" exclusion for `search_vector`; replaced with note that it's now included | Comment accuracy after Task 265 |
| `scripts/schema-drift-check.sql` | Regenerated: 28 tables / 263 cols; listings 42 cols | Auto-generated from database.ts via `npm run check:schema-drift` |
