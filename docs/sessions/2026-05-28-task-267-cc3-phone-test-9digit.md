# Task 267 — CC.3 — Phone test coverage: 9-digit cases in `normalizeNational()`

**Date:** 2026-05-28  
**Sprint:** 15  
**Type:** chore (test coverage)  
**Status:** ✅ Complete

---

## Problem Statement

After Task 244 (CC.1) changed the `PhoneField` placeholder from `"69 123 456"` (8 digits) to `"691 234 567"` (9 digits), the existing `normalizeNational` test suite only tested 8-digit Albanian inputs. Added 9-digit coverage matching the new placeholder format.

---

## Pre-existing regression discovered

`COUNTRY_CODES` test `'contains 13 countries'` was failing — Task 187 (Sprint 9, 2026-05-23) expanded the list from 13 to 45 European country codes (Russia excluded). The test had not been updated. Fixed alongside Task 267 changes.

---

## Changes

### `src/lib/phone/__tests__/phone.test.ts`

**Updated** (pre-existing regression fix):
- `'contains 13 countries'` → `'contains 45 countries (Task 187 expanded from 13; Russia excluded)'`

**Added** (9-digit coverage for `normalizeNational`):
```
'strips spaces — Albanian mobile (9-digit)'       : '691 234 567' → '691234567'
'strips dashes — Albanian mobile (9-digit)'       : '691-234-567' → '691234567'
'strips dots — Albanian mobile (9-digit)'         : '691.234.567' → '691234567'
'strips parentheses — Albanian mobile (9-digit)'  : '(691)234567' → '691234567'
```

**Added** (9-digit coverage for `validateNationalPhone`):
```
'accepts placeholder format "691 234 567" — Albanian mobile (9-digit, Task 244/267)'
  → result.ok = true, result.e164 = '+355691234567'
```

**Existing 8-digit tests** (unchanged — still pass):
- `'69 123 456'` → `'69123456'` — remains valid for 8-digit landline format
- `'69-123-456'` → `'69123456'`
- `'(69)123456'` → `'69123456'`
- `'69.123.456'` → `'69123456'`

---

## Positive Flow

`npm run test` (phone suite): **30/30 pass** ✅

---

## Negative Flow

| Branch | Result |
|--------|--------|
| 9-digit input with mixed separators | normalizeNational strips them correctly |
| Existing 8-digit tests | All still pass — function behavior unchanged |
| COUNTRY_CODES count (pre-existing) | Fixed: 45 (was hardcoded 13) |

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npm run test` (phone tests) | ✅ 30/30 pass |
| `npx tsc --noEmit` | ✅ 0 errors (no type changes) |
| ≥ 4 new 9-digit test cases | ✅ 4 in normalizeNational + 1 in validateNationalPhone = 5 |
| Existing 8-digit tests preserved | ✅ All unchanged |
| Test descriptions distinguish 9-digit vs 8-digit | ✅ "Albanian mobile (9-digit)" label added |

**Final verdict:** ✅ PASS — 30 tests pass, 5 new 9-digit cases, pre-existing count regression fixed.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/lib/phone/__tests__/phone.test.ts` | Added 4 `normalizeNational` 9-digit tests + 1 `validateNationalPhone` test; updated COUNTRY_CODES count from 13 → 45; renamed 8-digit test descriptions for clarity | Task 267 coverage + pre-existing regression fix |
