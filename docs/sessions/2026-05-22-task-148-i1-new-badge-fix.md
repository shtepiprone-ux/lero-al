# Session Archive: Task 148 — I.1 Fix "New" Badge Logic — 2026-05-22

## Task

**Task 148 — Epic I.1 — Fix "New" badge — created_at only**
Type: Bugfix | Priority: Medium

## Investigation

Grep for all "New" badge logic across the codebase:

| Location | Field used | Threshold | Status |
|---|---|---|---|
| `ListingCard.tsx` `getBadges()` | `listing.created_at` | `LISTING_NEW_DAYS` (constant) | ✅ correct |
| `listings/[slug]/page.tsx` `isNew` | `listing.created_at` | hardcoded `7` | ⚠️ fixed |
| Any `updated_at`-based "new" logic | — | — | ✅ none found |

**Root cause:** listing detail page (`page.tsx`) used `const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)` — hardcoded threshold instead of the canonical `LISTING_NEW_DAYS` constant. Both used `created_at`, so the badge was technically correct but the threshold was decoupled from the constant and could silently diverge.

## Fix

`src/app/[locale]/listings/[slug]/page.tsx`:
- Import `LISTING_NEW_DAYS` from `@/modules/listings/constants`
- Replace:
  ```
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const isNew = new Date(listing.created_at) > sevenDaysAgo
  ```
  With:
  ```
  const isNew = new Date(listing.created_at) > new Date(Date.now() - LISTING_NEW_DAYS * 24 * 60 * 60 * 1000)
  ```

## Documentation

`docs/domain-rules.md` — new section "Listing 'New' Badge Rule":
- `created_at` ONLY — never `updated_at`
- `LISTING_NEW_DAYS = 7` is the single source of truth
- Both consumers listed

## Files changed

| File | Change |
|---|---|
| `src/app/[locale]/listings/[slug]/page.tsx` | Import `LISTING_NEW_DAYS`; remove hardcoded `7` |
| `docs/domain-rules.md` | New "Listing 'New' Badge Rule" section |

## Acceptance criteria

- [x] `updated_at` not used for "New" badge anywhere (verified by grep).
- [x] Listing detail page uses `LISTING_NEW_DAYS` constant.
- [x] Threshold documented in `docs/domain-rules.md`.
- [x] Badge label `t('new')` unchanged — no new i18n keys (regression check).
- [x] `npm run typecheck` → 0 new errors; `npm run lint` → 0 warnings.

## Out of scope

Status helpers centralization (I.2), helper API evolution (I.3).
