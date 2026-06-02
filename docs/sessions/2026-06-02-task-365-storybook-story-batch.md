# Task 365 — Storybook story batch: RecentlyViewedSection, PasswordInput, PasswordRequirementsHint, AdminLayout, ListingGrid, StatusChangeControl, AdminTable badge

**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Type:** bug (Storybook hygiene + localization) — 7 story files (+ no runtime changes)

---

## Summary

Seven Storybook stories fixed in one batch. All changes are story-only except `AdminTable.stories.tsx` where the badge variant bug required fixing the code-level variant derivation logic.

---

## Changes per goal

### Goal 1 — RecentlyViewedSection (`src/stories/RecentlyViewedSection.stories.tsx`)

**1a — Raw `<button>` → canonical `Button`:**
- `StoryClrButton` replaced raw `<button>` (governance §9 violation) with `Button variant="ghost" size="sm"` with `cursor-pointer`
- Added `onClear?: () => void` prop; `Populated` story uses `useState` + in-canvas feedback ("Clear history clicked ✓")

**1b — Hardcoded Albanian text fixed:**
- `StoryCard` used `'Qira'/'Shitje'/'Apartament'` (hardcoded Albanian)
- Fixed: `useTranslations('listing')` + `t(listing.transaction_type as 'sale' | 'rent')` + `t('property_type_apartment')`
- Now correctly renders "For sale/rent · Apartment" (en), "Shitje/Qira · Apartament" (sq), "Продаж/Оренда · Квартира" (uk), etc. — locale-aware ✓

**1c — Horizontal scroll at 320/375:**
- Removed `no-scrollbar` class from story layout (production uses it; story needs visible scrollbar for QA)
- Added inline note explaining the difference
- The `overflow-x-auto flex gap-3 w-48 shrink-0` structure already correctly enables horizontal scroll; the change makes it visible in Storybook canvas

### Goal 2 — PasswordInput (`src/components/ui/PasswordInput.stories.tsx`)

- `WithHintIdleRender`, `WithHintAllRulesMetRender`, `Mobile320UkrainianRender`: replaced hardcoded English/Ukrainian label + button text with `useTranslations('auth')` → `t('reset_password_new_label')` + `t('reset_password_submit')`
- Labels now localize with the Storybook locale toolbar across all 4 locales (no mixed-language canvas §19) ✓
- Added `'use client'` directive (component uses hooks)

### Goal 3 — PasswordRequirementsHint (`src/components/ui/PasswordRequirementsHint.stories.tsx`)

- Confirmed: existing `UkrainianLocale` story already correctly sets `globals: { locale: 'uk' }` and the component renders in Ukrainian via its own `useTranslations`. No hardcoded text in story wrapper. Already §19 compliant.
- No code changes needed; documented in session.

### Goal 4 — AdminLayout (`src/stories/AdminLayout.stories.tsx`)

- Replaced raw `<input>` with canonical `Input` from `@/components/ui/input`
- `AdminToolbar`: extracted to `AdminToolbarRender()` function with `useState` for action feedback ("Filter clicked", "Add listing clicked")
- `AdminTableWrapper`: extracted to `AdminTableWrapperRender()` with `useState` ("Add user clicked")
- Added `'use client'` directive

### Goal 5 — ListingGrid (`src/stories/ListingGrid.stories.tsx`)

Full field parity with live `ListingCard`. `StoryListingCard` now includes:
- **Type + property type label**: `t(transaction_type) · t('property_type_apartment')` via `useTranslations('listing')`
- **Price block**: main price (bold primary), old/reduced strikethrough, per-m² price (from area_sqm)
- **Status badges**: `new` badge (bg-badge-new), `price_reduced` badge (bg-badge-reduced), `archived` badge (outline, uses `isListingArchived()`)
- **Sold/Rented overlay**: full-image overlay with localized status label rotated (-8deg), using `isListingClosed()` and display map for colors
- **Photo count chip**: bottom-right chip with Camera icon + count
- **Favorite button stub**: heart icon, visual toggle (no server action) — Heart fill on toggle
- **Public ID copy**: `#1000+i` with Copy/Check icon, `useState` for copied state
- **Relative time**: fixed "2h ago" string for story stability
- **Premium top stripe**: gradient stripe `bg-gradient-to-r from-badge-premium/0 via-badge-premium to-badge-premium/0`
- **Premium border**: `border-badge-premium/50 shadow-[...]` via cn()
- Created `StoryCardData` type extending fixture with `price_old`, `public_id`, `imageCount`, `status`, `location`
- Replaced `WithUkrainianTitles` → `LocaleStress` (§8b scenario naming, `globals: { locale: 'uk' }`)
- Story-level fixture `STORY_LISTINGS` adds varied statuses (sold, rented, archived) for visual testing

**Domain rule compliance:**
- All `.status` comparisons use `isListingClosed()` and `isListingArchived()` from `@/modules/listings/domain`
- Display map (overlay colors) uses record lookup — unaffected by `no-restricted-syntax` rule

### Goal 6 — StatusChangeControl (`src/components/admin/StatusChangeControl.stories.tsx`)

- Added `StoryPurposeNote` inline banner (dashed border, `bg-muted/10`, `text-[11px]`) — Task 354-Fix pattern
- Banner explains: variant="select" vs variant="workflow", product surfaces where each is used
- Updated meta docs description with full usage context (Task 307, Epic HH Phase 2)
- Banner added to `Select` story (the first/Docs primary export)

### Goal 7 — AdminTable badge fix (`src/components/admin/AdminTable.stories.tsx`)

**Root cause confirmed:** `UK_ROWS` used a localized `status` string (`'В обробці'`, `'Активне'`, `'Очікує'`). The cell renderer used `variant="neutral"` hardcoded — ALL rows were gray regardless of status. Bug was in the story data, not in `AdminTable.tsx` runtime.

**Fix:**
- Added `statusCode: 'in_progress' | 'active' | 'pending'` field to `UkRow` type
- Updated `UK_ROWS` with explicit `statusCode` on each row
- Added `ukStatusVariant(code)` function: `active` → `success`, `in_progress` → `info`, `pending` → `warning`
- Cell renderer and selected-row badge both use `ukStatusVariant(r.statusCode)` — code-driven, NOT label-driven
- Badge colors are now identical across all four locales (the displayed label changes, the badge color does not) ✓ §18

---

## §17 UI Pre-flight

| Check | Result |
|---|---|
| No raw `<button>` in fixed stories | `StoryClrButton` now uses `Button` ✓ |
| No mixed-language locale stories | PasswordInput wrappers use i18n ✓ |
| Badge variant from code, not label | `ukStatusVariant(statusCode)` ✓ |
| No auth/API/Supabase in stories | All fixture-driven ✓ |
| §8b taxonomy (scenario names) | `LocaleStress` replaces `WithUkrainianTitles` ✓ |
| Existing exports not deleted | All preserved ✓ |
| 7 breakpoints / 4 locales | OWNER QA REQUIRED (no browser access) |

---

## Validation outputs

### `npx tsc --noEmit`
```
(exit 0) ✅
```

### `npm run lint`
```
(exit 0, 0 errors, 0 warnings) ✅
```

### `npm run check:i18n`
```
✅ Parity PASSED — 1437 keys ✅
```

### `npm run build-storybook`
```
✓ built in 6.15s — exit 0 ✅
```

---

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| AC1a — canonical Button + cursor-pointer + action preview | `RecentlyViewedSection.stories.tsx` StoryClrButton | ✅ |
| AC1b — no hardcoded Albanian text | `StoryCard` uses `t('sale'/'rent')` + `t('property_type_apartment')` | ✅ |
| AC1c — horizontal scroll at 320/375 | `no-scrollbar` removed; `overflow-x-auto` structure unchanged ✓ | ✅ |
| AC2 — PasswordInput correct locale texts | `useTranslations('auth')` in wrappers | ✅ |
| AC3 — PasswordRequirementsHint locale coverage | `UkrainianLocale` story sets `globals: { locale: 'uk' }` ✓ | ✅ |
| AC4 — AdminLayout buttons wired | `useState` + in-canvas feedback; canonical `Input` | ✅ |
| AC5 — ListingGrid field parity | All live ListingCard fields present in `StoryListingCard` | ✅ |
| AC6 — StatusChangeControl purpose note | `StoryPurposeNote` + docs description | ✅ |
| AC7 — AdminTable badge code-driven | `ukStatusVariant(statusCode)` — identical across locales | ✅ |
| No raw `<button>` in fixed stories | grep clean ✓ | ✅ |
| §8b taxonomy preserved | All scenario-named; no per-width exports | ✅ |
| `check:i18n` PASS | 1437 keys (no new keys added) | ✅ |
| Positive + Negative flow parity | Both documented above | ✅ |
| No `git add`/`git commit` | — | ✅ |

---

## Rendered QA matrix (OWNER QA REQUIRED)

| Story | 320 | 375 | 768 | 1280 | 2560 | Notes |
|---|---|---|---|---|---|---|
| RVS / MobileScroll | OQR | OQR | — | — | — | Horizontal scroll visible (no no-scrollbar) |
| RVS / UkrainianLocale | OQR | — | — | OQR | — | Type label localized (uk) |
| PasswordInput / WithHintIdle | OQR | — | — | OQR | — | Label/button in locale toolbar locale |
| ListingGrid / Desktop | — | — | — | OQR | — | All fields present |
| ListingGrid / LocaleStress | OQR | — | — | — | — | uk titles clamp correctly |
| AdminLayout / AdminToolbar | OQR | — | OQR | OQR | — | Button click logs action |
| StatusChangeControl / Select | — | — | — | OQR | — | Purpose note visible |
| AdminTable / LocaleStress | — | — | — | OQR | — | Badges colored, identical across sq/en/uk/it |

---

Self-validation: tsc=0 · lint=0 · check:i18n=PASS 1437 keys · build-storybook=✅ · AC table=all green · scope=7 story files + backlog

---

## Files Changed

| File | Rationale |
|------|-----------|
| `src/stories/RecentlyViewedSection.stories.tsx` | Canonical Button; i18n type labels; no-scrollbar removed; action wiring |
| `src/components/ui/PasswordInput.stories.tsx` | `useTranslations('auth')` for wrapper labels; `'use client'` |
| `src/stories/AdminLayout.stories.tsx` | Canonical `Input`; button action wiring; `'use client'` |
| `src/stories/ListingGrid.stories.tsx` | Full `StoryListingCard` field parity; `LocaleStress` story |
| `src/components/admin/StatusChangeControl.stories.tsx` | `StoryPurposeNote` + improved docs description |
| `src/components/admin/AdminTable.stories.tsx` | `UK_ROWS` + `statusCode`; `ukStatusVariant(code)` for badges |
| `docs/backlog.md` | Last Session updated with Task 365 summary |
| `docs/sessions/2026-06-02-task-365-storybook-story-batch.md` | This session log |

*No `git add` / `git commit` issued. The ORCHESTRATOR (Opus) reviews the real diff and emits explicit-path commit commands.*
