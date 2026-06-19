# Session — Task 462: Hotfix — clean admin report-details owner row (remove badge + raw i18n key)

**Date:** 2026-06-18  
**Epic:** BB · **Type:** UI-only hotfix  
**Executor:** Sonnet 4.6

## Problem

After Task 461 live validation, `ReportDetailDialog` renders a raw i18n key `Admin.Users.Profile_types.Private` in the owner row — caused by `tu('profile_types.*')` against the `admin.users` namespace which is not supplied to the admin reports page's client i18n provider.

## Fix

Owner decision: remove the account-type badge from the owner row entirely. This deletes the failing lookup at the source.

## Changes

### `src/components/admin/AdminReportsManager.tsx`

- **Removed** `KNOWN_USER_TYPES` const + `clampUserType()` helper (L44–47)
- **Removed** `const tu = useTranslations('admin.users')` (L72)
- **Removed** the `<Badge variant="neutral">` with `tu('profile_types.*')` from the owner row
- **Changed** owner value row from `flex flex-wrap items-center gap-2` to `flex flex-wrap items-center justify-between gap-2` (name left, link right)
- **Preserved:** `Badge` import (still used by Status rows L106, L331); owner name + profile link + null fallbacks; all other rows + action buttons unchanged

### `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx`

- Owner-present test: now asserts `not.toMatch(/profile_types/)` instead of `toContain('profile_types.agent')`
- Unknown user_type test: now asserts no raw key (`not.toMatch(/profile_types/)`) + link present, instead of badge fallback
- Owner-null + listing-null tests: unchanged

### `src/components/admin/AdminReportsManager.stories.tsx`

No changes — 7 toolbar-reactive stories remain.

### `docs/critical-flow-registry.md`

"Report listing" row updated: Task 462 badge removal noted, no-raw-key assertion added.

## Grep-clean proof

```
grep -nE "profile_types|useTranslations\('admin\.users'\)|clampUserType|KNOWN_USER_TYPES" src/components/admin/AdminReportsManager.tsx
→ No matches found
```

## Control-preservation inventory (before/after)

| Row | Before | After |
|-----|--------|-------|
| Status + Badge | ✅ | ✅ unchanged |
| Reason | ✅ | ✅ unchanged |
| Listing + link | ✅ | ✅ unchanged |
| Owner label | ✅ `col_owner` | ✅ unchanged |
| Owner name | ✅ | ✅ unchanged |
| Owner badge | ✅ `profile_types.*` | ❌ **removed** |
| Owner profile link | ✅ `open_profile` → `/admin/users/[id]` | ✅ unchanged |
| Owner null fallback | ✅ `owner_not_found` | ✅ unchanged |
| Reporter | ✅ | ✅ unchanged |
| Comment | ✅ | ✅ unchanged |
| Date | ✅ | ✅ unchanged |
| Action buttons | ✅ review/dismiss/resolve/close | ✅ unchanged |

## Planted-violation proof (clause 15)

**FAIL (badge re-added):**
```
FAIL  AdminReportsManager.smoke.test.tsx
  × owner present → no badge/profile_types text
    AssertionError: expected '...profile_types.agent...' not to match /profile_types/
  × owner with unknown user_type → no raw key
    AssertionError: expected '...profile_types.bogus_value...' not to match /profile_types/
  Tests: 2 failed | 2 passed (4)
```

**PASS (badge removed — clean state):**
```
Tests: 4 passed (4)
```

## Regression

- Baseline: 4/4 Task 461 tests GREEN (recorded before changes)
- After: 4/4 PASS (updated assertions)
- Planted violation: re-add badge → 2/4 FAIL; revert → 4/4 PASS

## Gate transcripts

- `npx tsc --noEmit` = **0 errors**
- `npm run check:i18n` = **PASSED** (1849 keys)
- `npm run check:stories` = **PASSED** (0 violations, 58 files)
- `npx vitest run AdminReportsManager.smoke` = **4/4 PASSED**
- `npm run screenshots:assert --fast` = **924/924 PASS, 0 FAIL** (manifest: `.screenshots/rendered-assert/2026-06-18T20-19/manifest.json`)

### `screenshots:assert --fast` transcript
```
📸  Starting rendered assertion (fast/mobile mode)
    Stories: 77 | Viewports: 3 | Locales: 4
    Output: .screenshots/rendered-assert/2026-06-18T20-19/

✓✓✓✓✓✓✓✓... (924 cells)

Results: 924/924 PASS, 0 FAIL
flaky-recovered: 0
Manifest: .screenshots/rendered-assert/2026-06-18T20-19/manifest.json
PNGs: .screenshots/rendered-assert/2026-06-18T20-19/*.png

✅ All rendered assertions PASSED.
```

### Rendered verification matrix (AdminReportsManager dialog stories)

| Story | 320 | 375 | 390 | Assertions |
|-------|-----|-----|-----|------------|
| `DialogOwnerRow_Mobile320` × sq/en/uk/it | PASS | — | — | no h-overflow; owner name left + link right wrap; link ≥44px; no badge; full-width bottom sheet |
| `DialogOwnerRow_Mobile375` × sq/en/uk/it | — | PASS | — | same |
| `DialogOwnerRow_Mobile390` × sq/en/uk/it | — | — | PASS | same |
| `DialogOwnerRow_Desktop` × sq/en/uk/it | — | — | — | PASS (1280) |

uk@320/375/390 mandatory cells: **all PASS**.

## AC-by-AC self-audit

| AC | Status | Evidence |
|----|--------|----------|
| 1. No raw `profile_types` text | ✅ | grep-clean proof; `not.toMatch(/profile_types/)` assertion |
| 2. Badge/tu/clampUserType removed | ✅ | diff: removed L44-47, L72, L141-143 |
| 3. Owner row = name + link justify-between | ✅ | diff: L133 `justify-between` |
| 4. Null fallbacks preserved | ✅ | tests: owner-null + listing-null PASS |
| 5. Other rows/actions unchanged | ✅ | control inventory above |
| 6. No production change outside dialog | ✅ | only AdminReportsManager.tsx touched |
| 7. Gates green | ✅ | tsc=0, check:i18n, check:stories, vitest 4/4, screenshots:assert 924/924 PASS |
| 8. Planted-violation transcript | ✅ | FAIL→PASS above |

## Files Changed

| Path | Rationale |
|---|---|
| `src/components/admin/AdminReportsManager.tsx` | Remove badge + tu + clampUserType; owner row layout justify-between |
| `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` | Updated: no-profile_types assertions replace badge assertions |
| `docs/critical-flow-registry.md` | "Report listing" row: Task 462 noted |
| `docs/sessions/2026-06-18-task-462-admin-report-owner-row-cleanup.md` | This session log |
