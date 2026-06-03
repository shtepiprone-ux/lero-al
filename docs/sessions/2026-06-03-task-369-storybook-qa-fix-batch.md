# Session Log — Task 369: Storybook QA fix batch

**Date:** 2026-06-03  
**Executor:** Sonnet 4.6  
**Status:** COMPLETE — UNCOMMITTED — OWNER QA REQUIRED

---

## Summary

Four disjoint QA fixes in one batch:

| Work Item | Fix |
|-----------|-----|
| W1 — FilterBar Badge+Reset alignment | Added `sm:self-center` / `lg:self-center` to search slot and Badge+Reset so they stay vertically centered at ≥lg even when the chip cluster wraps to multiple rows |
| W2 — PhoneField placeholder national-only | Changed `phone_placeholder` from `+355 XX XXX XXXX` → `XX XXX XXX` in all 4 locales; wired `PhoneField` national Input to `t('phone_placeholder')` instead of hardcoded string |
| W3 — AdminTable toolbar full-width <640 | Added `max-sm:flex-col [&>*]:max-sm:w-full` to toolbar div; `max-sm:w-full` + `max-sm:justify-center` to Columns (`PopoverTrigger`) and Sort (`DropdownMenuTrigger`) buttons; `max-sm:w-full` to mobile sort wrapper |
| W4 — Locale-stress globals pin | Added `globals: { locale: 'uk' }` to `EmptyState.stories.tsx` `UkrainianLocale` story (only story missing the pin — all others already had it) |

---

## W1 — FilterBar Badge+Reset centering (root cause)

**Root cause:** Task 362 set outer container to `sm:items-start` to fix the "scatter" bug (chip cluster wrapping to 2+ rows caused search to vertically center against the tall cluster). However, `sm:items-start` top-aligned ALL row children, including the Badge and Reset that should stay vertically centered.

**Fix:** Keep outer `sm:items-start`. Add `sm:self-center` to the search slot div (visible at all ≥sm widths). Add `lg:self-center` to Badge and Reset Button (visible only at lg:+ where they appear). The chip cluster remains top-aligned by default (inheriting `sm:items-start`).

**Chip-wrap preservation:** unchanged — the chip cluster `<div className="hidden ... lg:flex items-start">` still aligns chips to the top internally, and the outer `sm:items-start` continues to anchor the cluster to the row's top edge (no regression).

---

## W2 — PhoneField placeholder (justification)

**National format choice:** `XX XXX XXX` (9-character mask, no country prefix). Albanian mobile numbers are 9 digits (6XX XXX XXX). The `XX XXX XXX` mask is locale-agnostic and indicates the national number format without implying a specific carrier prefix. All 4 locales use the same mask since Albanian phone format is independent of UI language.

**Pre-existing hardcode in PhoneField.tsx:** The national `<Input>` had `placeholder="691 234 567"` (a concrete example, not using `t()`). This was already national-format but bypassed i18n. Fixed to `placeholder={t('phone_placeholder')}` — now locale-key-driven and consistent with the locale files.

**`input.stories.tsx` MobileForm:** The `MobileForm` story had `placeholder="+355 69 000 0000"` (full E.164 in a raw Input). Updated to `"XX XXX XXX"` for consistency with the new national-only convention.

---

## W3 — AdminTable card-mode toolbar (scope note)

The AdminTable component (`AdminTable.tsx`) does NOT contain a toolbar — it renders only the table/card list. The toolbar lives in the story demo wrapper `AdminTableDemo` inside `AdminTable.stories.tsx`. The fix was applied there (story-only; no runtime component changes).

**Controls fixed:**
- Search `<Input>`: inherits full-width from `[&>*]:max-sm:w-full` on the container
- Columns `<PopoverTrigger>`: `max-sm:w-full max-sm:justify-center` (centering icon+text in full-width button)
- Sort `<DropdownMenuTrigger>`: `max-sm:w-full max-sm:justify-center`
- Mobile sort wrapper `<div className="lg:hidden">`: `max-sm:w-full`

**Desktop unchanged:** `flex-1 min-w-[180px]` search, content-width Columns and Sort buttons remain at ≥640px.

---

## W4 — Locale-stress globals pin (audit)

Audited all `*LocaleStress` / `*UkrainianLocale` / `*UkrainianLocaleStress` stories across the codebase:

| File | Story | Had globals pin? |
|------|-------|-----------------|
| `AdminCardList.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `AdminPageShell.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `AdminTable.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `StatusChangeControl.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `StatusChangeHistory.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `FilterBar.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `PageHeader.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `PageShell.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `Section.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `Combobox.stories.tsx` | `LongLabelLocaleStress`, `DropdownOpen` | ✅ Already pinned |
| `button.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `PasswordInput.stories.tsx` | `UkrainianLocaleStress` | ✅ Already pinned (Task 365) |
| `PasswordRequirementsHint.stories.tsx` | `UkrainianLocale` | ✅ Already pinned |
| `select.stories.tsx` | `LongLabelLocaleStress`, `SettlementsLocaleStress` | ✅ Already pinned |
| `ListingGrid.stories.tsx` | `LocaleStress` | ✅ Already pinned |
| `RecentlyViewedSection.stories.tsx` | `UkrainianLocale` | ✅ Already pinned |
| `EmptyState.stories.tsx` | `UkrainianLocale` | ❌ **MISSING → Added** |

---

## Positive / Negative Flow Verification

### W1 FilterBar
- ✅ Positive: at 1280/1440/2560 with active filters → Badge + Reset vertically centered with search; `ManyFilters` (11 chips) → chips wrap to multiple rows and top-align; Badge+Reset stay centered.
- ✅ Negative: no active filters → Badge/Reset hidden, layout unchanged. <lg → Sheet trigger only (unchanged). <sm → controls full-width (Task 359 `[&>*]:max-sm:w-full` preserved).

### W2 PhoneField
- ✅ Positive: national Input shows `XX XXX XXX` placeholder; dial-code Combobox unchanged.
- ✅ Negative: empty national input → placeholder shown (muted). Letters/symbols → stripped by Task 363 `handleNationalChange` (unchanged). Locale switch → `phone_placeholder` key resolves to `XX XXX XXX` in all 4 locales (identical value per `check:i18n` PASS).

### W3 AdminTable
- ✅ Positive: at 320/375/390 in card mode → Search/Columns/Sort full-width, stacked. Desktop table mode → sizing unchanged.
- ✅ Negative: `onSort` still fires (DropdownMenu behavior unchanged). Columns manager toggle still works. No control removed (Note 20). `AdminTable.tsx` runtime code untouched.

### W4 Locale-stress
- ✅ Positive: `EmptyState UkrainianLocale` pins `globals: { locale: 'uk' }` — always renders uk strings.
- ✅ Negative: all other (non-stress) stories in `EmptyState.stories.tsx` unchanged; no production code touched.

---

## AC Self-Audit

| AC | Status | Evidence |
|----|--------|---------|
| AC1 FilterBar Badge+Reset centered at ≥1024 | ✅ | `sm:self-center` / `lg:self-center` on search/badge/reset in `FilterBar.tsx` |
| AC2 `phone_placeholder` national-only all 4 locales + check:i18n PASS | ✅ | All 4 JSON files → `"XX XXX XXX"`; `PhoneField.tsx` uses `t('phone_placeholder')`; PASS (1437 keys) |
| AC3 AdminTable card-mode Search/Columns/Sort full-width <640 | ✅ | `max-sm:flex-col [&>*]:max-sm:w-full` on toolbar + `max-sm:w-full` on buttons in `AdminTable.stories.tsx` |
| AC4 Locale-stress stories pin `globals.locale='uk'` | ✅ | `EmptyState.stories.tsx` `UkrainianLocale` added; all others audited and already pinned |
| Positive + Negative flow parity | ✅ | All 4 W verified above |
| 0 new tsc errors | ✅ | `npx tsc --noEmit` = 0 errors |
| build-storybook passes | ✅ | Built in 9.73s |
| check:i18n PASS | ✅ | 1437 keys, all 4 locales identical |

**Self-validation verdict: PASS. All ACs met. Positive + Negative flows implemented. No scope drift.**

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/components/layout/FilterBar.tsx` | `sm:self-center` on search slot; `lg:self-center` on Badge and Reset | W1: vertically centers search/badge/reset while keeping chip cluster top-aligned |
| `messages/en.json` | `phone_placeholder`: `+355 XX XXX XXXX` → `XX XXX XXX` | W2: national-only mask, drop country code |
| `messages/sq.json` | Same as above | W2: locale parity |
| `messages/uk.json` | Same as above | W2: locale parity |
| `messages/it.json` | Same as above | W2: locale parity |
| `src/components/shared/PhoneField.tsx` | National Input `placeholder` → `t('phone_placeholder')` | W2: wire i18n key instead of hardcoded string |
| `src/components/ui/input.stories.tsx` | `MobileForm` tel placeholder → `XX XXX XXX` | W2: consistency with new national-only convention |
| `src/components/admin/AdminTable.stories.tsx` | Toolbar div: `max-sm:flex-col [&>*]:max-sm:w-full`; `ColumnsManager` `PopoverTrigger` + `MobileSortControl` `DropdownMenuTrigger`: `max-sm:w-full max-sm:justify-center`; sort wrapper `div.lg:hidden`: `max-sm:w-full` | W3: full-width controls at <640px in card mode |
| `src/stories/EmptyState.stories.tsx` | `UkrainianLocale` story: added `globals: { locale: 'uk' }` | W4: pins locale so story always renders uk strings |
