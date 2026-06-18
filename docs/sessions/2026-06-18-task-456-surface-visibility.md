# Session — Task 456: Surface public visibility in cabinet + admin

**Date:** 2026-06-18  
**Epic:** LV (Listing Public Visibility Integrity) · **Sprint 36** · LV.3  
**Executor:** Sonnet 4.6

## Summary

Surfaced the canonical `isListingPubliclyVisible` truth in both cabinet (owner-facing) and admin (operator-facing) interfaces. Pure observability slice — no lifecycle, status, or write-path changes.

## Parts completed

### Part A — `applyPublicEligibleButHidden` + `formatVisibility`
- Added `formatVisibility(listing) → { visible, reason, labelKey }` shared formatter wrapping `isListingPubliclyVisible`
- Added `applyPublicEligibleButHidden(query, opts?)` complement filter with policy-derived statuses and `reason='expired'|'no_expiry'` narrowing (unknown reason ignored)
- Both in `src/modules/listings/lib/visibility.ts`

### Part B — Data plumbing
- Added `expires_at` to admin SELECT, `AdminListing` interface, `CABINET_LISTING_SELECT`, and `CardListingData`

### Part C — Cabinet "Hidden — reason" indicator
- Added inline badge in `ListingsTab.tsx` showing "Hidden — reason" only when `isListingPubliclyVisible.visible === false`
- No "Visible" badge on normal rows (owner decision #3)

### Part D — Admin per-row + detail Visible/Hidden diagnostics
- New `visibility` column in admin table showing Visible/Hidden for every row
- Mobile `cardRow` subtitle includes visibility badge
- Preview dialog shows visibility in key-details grid

### Part E — Admin filter + audit panel
- New `visibility=hidden_eligible` URL param with `reason=expired|no_expiry` narrowing
- Three dedicated head/count queries for audit panel (total, expired, no_expiry) via `applyPublicEligibleButHidden`
- Compact audit panel above table with click-to-filter
- Toggle button in filterBar (max-sm:w-full, min-h-11)
- `page=1` reset on visibility/reason change, preserving tab/status/q

### Part F — i18n + regression tests + surface consumption proof
- 3 cabinet keys + 10 admin keys in all 4 locales (sq/en/uk/it) — 1841-key parity confirmed
- 19 new tests (7 formatVisibility + 6 applyPublicEligibleButHidden + 6 static import gate) — 45 total visibility tests pass
- Critical-flow-registry row extended
- Static import gate tests prove both cabinet (`ListingsTab`) and admin (`AdminListingsTable`) import and call `formatVisibility` from the canonical module, and contain no inline visibility predicates

## Verification

- `tsc --noEmit` = 0 errors
- `npm run build` = success
- `npm run check:i18n` = PASS (1841 keys × 4 locales)
- `npx vitest run src/modules/listings/lib/__tests__/visibility.test.ts` = 45/45 PASS
- `npm run screenshots:assert:fast` = 924/924 PASS

## Planted-violation transcripts (AC 7)

### Variant (a): Hardcoded "Visible" in ListingsTab

**Mutation:** Removed `formatVisibility` import, replaced `formatVisibility(...)` call with hardcoded `<span>Visible</span>`.

**Result: 1 FAIL / 44 PASS**
```
FAIL  visibility.test.ts > Surface consumption proof — static import gate (Task 456)
      > ListingsTab (cabinet surface) > calls formatVisibility (not a dead import)
AssertionError: expected '...' to match /formatVisibility\s*\(/
```

**Restore → 45/45 PASS.**

### Variant (b): Inline re-spell in ListingsTab

**Mutation:** Replaced `formatVisibility({ status, expires_at })` call with inline predicate:
```tsx
const isVisible = status === 'active' && listing.expires_at && new Date(listing.expires_at) >= new Date()
```

**Result: 1 FAIL / 44 PASS**
```
FAIL  visibility.test.ts > Surface consumption proof — static import gate (Task 456)
      > ListingsTab (cabinet surface) > calls formatVisibility (not a dead import)
AssertionError: expected '...' to match /formatVisibility\s*\(/
```

**Restore → 45/45 PASS.**

Both variants caught by the `calls formatVisibility (not a dead import)` static import gate test, which asserts the component source contains a `formatVisibility(` call. The `does NOT contain inline status/expiry visibility predicates` test would additionally catch re-spells that keep the `formatVisibility` import but add a parallel inline check.

## Mobile <640 rendered verification matrix

**Source:** `npm run screenshots:assert:fast` — 924/924 PASS  
**Output:** `.screenshots/rendered-assert/2026-06-18T09-05/`  
**Assertions per cell:** no horizontal overflow, full-width buttons at <640, full-width controls at <640, no render failures.

### AdminListingsTable/Default (includes audit panel + visibility filter + per-row badges)

| Locale | 320 | 375 | 390 |
|--------|-----|-----|-----|
| **sq** | PASS (no-overflow, btns-ok) | PASS (no-overflow, btns-ok) | PASS (no-overflow, btns-ok) |
| **en** | PASS (no-overflow, btns-ok) | PASS (no-overflow, btns-ok) | PASS (no-overflow, btns-ok) |
| **uk** | PASS (no-overflow, btns-ok) | PASS (no-overflow, btns-ok) | PASS (no-overflow, btns-ok) |
| **it** | PASS (no-overflow, btns-ok) | PASS (no-overflow, btns-ok) | PASS (no-overflow, btns-ok) |

**12/12 PASS.** uk@320/375/390 explicitly verified.

Visual confirmation from rendered PNGs (uk@320, sq@320, it@375, en@390 inspected):
- **Audit panel:** full-width container, counts stack vertically, clickable reasons wrap, no h-scroll
- **Filter toggle ("Публічно-прийнятні, але приховані" / "Të pranueshëm publikisht por të fshehur" etc.):** full-width, label wraps at 320, min-h-11 met
- **Per-row Visible/Hidden badges:** wrap to new line in cardRow subtitle at 320, no clipping
- **Status badges (pre-existing):** unchanged and rendering correctly

### Cabinet/ListingsTab — CabinetRowsView story (Storybook dev + Playwright capture)

**Method:** Storybook dev server (`storybook dev -p 6006`) + Playwright Chromium capture at each viewport × locale.
`CabinetRowsView` renders the exact cabinet row JSX with `formatVisibility` badges (4 rows: active+future=no badge, active+past=Hidden—expired, active+null=Hidden—no expiry, sold=Hidden—status not public).

**Output:** `.screenshots/rendered-assert/cabinet-456/`

| Locale | 320 | 375 | 390 |
|--------|-----|-----|-----|
| **sq** | PASS (no-overflow) | PASS (no-overflow) | PASS (no-overflow) |
| **en** | PASS (no-overflow) | PASS (no-overflow) | PASS (no-overflow) |
| **uk** | PASS (no-overflow) | PASS (no-overflow) | PASS (no-overflow) |
| **it** | PASS (no-overflow) | PASS (no-overflow) | PASS (no-overflow) |

**12/12 PASS.** uk@320/375/390 explicitly verified.

Visual confirmation from rendered PNGs (uk@320, uk@375, sq@320, en@320 inspected):
- **Row 1 (active + future expiry):** "Активне" badge only — NO visibility chip (correct per owner decision #3)
- **Row 2 (active + past expiry):** "Активне" + "Приховане — прострочене" — red chip wraps at 320, no clip
- **Row 3 (active + null expiry):** "Активне" + "Приховане — без терміну" — red chip wraps at 320, no clip
- **Row 4 (sold):** "Продано" + "Приховане — статус не публічний" — wraps correctly even at 320 in uk (longest label)
- All locale labels render without clipping: sq "I fshehur — skaduar", en "Hidden — expired", uk "Приховане — прострочене", it "Nascosto — scaduto"

### Preview dialog visibility row

The preview dialog is an existing `max-w-md` centered dialog (NOT a <640 bottom-sheet — pre-existing, out of scope per kickoff). The visibility line is a static text cell in a `grid grid-cols-2` layout with `whitespace-normal break-words`. It does not introduce any new overlay, control, or touch target.

## Files Changed

| Path | Rationale |
|---|---|
| `src/modules/listings/lib/visibility.ts` | Part A: `formatVisibility` + `applyPublicEligibleButHidden` |
| `src/app/admin/listings/page.tsx` | Part B+E: `expires_at` in SELECT, visibility/reason params, audit queries |
| `src/components/admin/AdminListingsTable.tsx` | Part B+D+E: `expires_at` type, visibility column, cardRow, dialog, filter, audit panel |
| `src/components/admin/AdminListingsTable.stories.tsx` | Part F: `auditCounts` in default args + VisibilityMobile320/AuditZero stories |
| `src/modules/cabinet/lib/queries.ts` | Part B: `expires_at` in CABINET_LISTING_SELECT |
| `src/modules/listings/components/ListingCard.tsx` | Part B: `expires_at` in CardListingData |
| `src/modules/cabinet/components/ListingsTab.tsx` | Part C: Hidden indicator using `formatVisibility` |
| `src/modules/cabinet/components/ListingsTab.stories.tsx` | Part F: CabinetRowsView story for rendered mobile matrix |
| `messages/en.json` | Part F: 13 new keys (cabinet + admin.listings) |
| `messages/sq.json` | Part F: 13 new keys |
| `messages/uk.json` | Part F: 13 new keys |
| `messages/it.json` | Part F: 13 new keys |
| `src/modules/listings/lib/__tests__/visibility.test.ts` | Part F: 19 new tests (45 total) |
| `src/stories/fixtures/admin.fixtures.ts` | Part B: `expires_at` in fixture data |
| `docs/critical-flow-registry.md` | Part F: Extended visibility invariant row |
