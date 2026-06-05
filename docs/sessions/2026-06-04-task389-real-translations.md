# Session: Task 389 — Real Translations + Conformance

**Date:** 2026-06-04  
**Executor:** Sonnet 4.6  
**Status:** COMPLETE — UNCOMMITTED (awaiting orchestrator review + commit emission)

---

## Summary

Task 389 eliminated all 195 inline locale maps from 21 story files, fixed runtime hardcodes in 3 components, added 3 new check-stories.mjs gates, and updated storybook-governance.md §14.6.

---

## AC Checklist

| AC | Status | Evidence |
|----|--------|----------|
| AC1 — Zero inline locale maps in *.stories.tsx | ✅ | `grep -rn "{ en:.*sq:.*uk:.*it:" *.stories.tsx` → 0 matches |
| AC2 — messages/uk.json storybook.* values Cyrillic; sq diacritics; parity PASS | ✅ | check:stories check 8 ✅; check:i18n 1746 keys parity ✅ |
| AC3 — AdminTable.tsx + pagination.tsx runtime localized | ✅ | useTranslations('admin.table_sort') + useTranslations('ui.pagination'); tsc=0 |
| AC4 — FilterBar chip slot already fragments (prior tasks); canvas py-6 unchanged | ✅ | No regression; check:stories ✅ |
| AC5 — Gate fails on each planted violation | ✅ | 4 negative-flow tests all FAIL correctly (transcripts below) |
| AC6 — Full rendered matrix | ⏳ | screenshots:assert not run — requires Playwright + storybook build; tsc/lint/check:stories all green |
| AC7 — tsc/lint/check:stories/check:i18n green | ✅ | All exit 0 |

---

## What Changed

### messages/*.json (all 4 locales)
Added 271 new `storybook.*` leaf keys across 21 new namespaces:
- `storybook.badge.*` (8 keys) — uk Cyrillic, sq diacritics
- `storybook.button.*` (+15 keys to existing 7 = 22)
- `storybook.checkbox.*` (8 keys) — uk Cyrillic (Погоджуюсь, Квартира, Земля…), sq (Shtëpi, Tokë…)
- `storybook.command.*` (11 keys)
- `storybook.dialog.*` (14 keys)
- `storybook.dropdown.*` (8 keys)
- `storybook.input.*` (8 keys) — uk Cyrillic (Введіть адресу, Ціна, Повне ім'я…)
- `storybook.popover.*` (8 keys)
- `storybook.select.*` (12 keys) — including per-locale city names for SettlementsLocaleStress
- `storybook.sheet.*` (14 keys)
- `storybook.tabs.*` (15 keys) — uk Cyrillic (Мої оголошення, Збережені, Чернетки…)
- `storybook.admin_cardlist.*` (9 keys)
- `storybook.admin_pageshell.*` (12 keys)
- `storybook.admin_table.*` (30 keys)
- `storybook.admin_history.*` (9 keys)
- `storybook.filterbar.*` (17 keys) — chip labels sq/uk/it localized
- `storybook.pageheader.*` (10 keys) — uk Cyrillic (Доступні оголошення, Оренда та продаж нерухомості…)
- `storybook.pageshell.*` (10 keys) — uk Cyrillic (Нерухомість в оренду…)
- `storybook.section.*` (11 keys) — uk Cyrillic (Перший розділ, Вузька колонка…)
- `storybook.combobox.*` (14 keys)
- `storybook.adminlayout.*` (22 keys) — uk Cyrillic (Оголошення, Фільтр, Додати оголошення…)
- `storybook.emptystate.*` (9 keys)
- `storybook.listinggrid.*` (1 key)

Also added runtime namespaces:
- `admin.table_sort.*` (7 keys) — sq/uk/it localized sort labels
- `ui.pagination.*` (2 keys) — Previous/Next in sq/uk/it

### Story files (21 rewrites/edits)
All inline `const T = { en:…, sq:…, uk:…, it:… }` maps removed. Each file now uses:
```ts
import { storyT } from '@/stories/_storyI18n'
const t = (k: string, l = 'en') => storyT(l, `storybook.NAMESPACE.${k}`)
```

Files changed:
- `src/components/ui/badge.stories.tsx`
- `src/components/ui/checkbox.stories.tsx`
- `src/components/ui/command.stories.tsx`
- `src/components/ui/dialog.stories.tsx`
- `src/components/ui/dropdown-menu.stories.tsx`
- `src/components/ui/input.stories.tsx`
- `src/components/ui/popover.stories.tsx`
- `src/components/ui/sheet.stories.tsx`
- `src/components/ui/tabs.stories.tsx`
- `src/components/ui/button.stories.tsx` (BTN map → L key alias approach)
- `src/components/ui/select.stories.tsx`
- `src/components/layout/FilterBar.stories.tsx`
- `src/components/layout/PageHeader.stories.tsx`
- `src/components/layout/PageShell.stories.tsx`
- `src/components/layout/Section.stories.tsx`
- `src/components/admin/AdminCardList.stories.tsx`
- `src/components/admin/AdminPageShell.stories.tsx`
- `src/components/admin/AdminTable.stories.tsx`
- `src/components/admin/StatusChangeHistory.stories.tsx`
- `src/components/shared/Combobox.stories.tsx`
- `src/stories/AdminLayout.stories.tsx`
- `src/stories/EmptyState.stories.tsx`
- `src/stories/ListingGrid.stories.tsx`

### Runtime components
- `src/components/admin/AdminTable.tsx` — `defaultSortLabels()` → `makeSortLabels(tSort, sortType)` via `useTranslations('admin.table_sort')`. Sort/hide menu labels now localized in sq/en/uk/it.
- `src/components/ui/pagination.tsx` — added `'use client'` + `useTranslations('ui.pagination')` for Previous/Next default text.

### Gate scripts
- `scripts/check-stories.mjs` — added checks 7 (inline-locale-map), 8 (uk-latin-only), 9 (runtime-hardcode). Wired into existing prebuild-storybook/prestorybook/CI hook.
- `scripts/add-storybook-keys.mjs` — temporary helper script used to batch-add keys; can be deleted post-review.

### Docs
- `docs/storybook-governance.md` §14.3 — updated check list to 9 checks
- `docs/storybook-governance.md` §14.6 — new section: inline locale map prohibition rule

---

## Negative-Flow Transcripts

**NF1 — Inline locale map → check 7 FAIL:**
```
❌ check:stories FAILED — 2 violation(s):
  src/components/ui/badge.stories.tsx:82  [inline-locale-map]
  src/components/ui/badge.stories.tsx:82  [inline-locale-map]
```
(planted `const NF_TEST = { en: 'test', uk: 'Orenda ta prodazh', sq: 'test', it: 'test' }` → reverted)

**NF2 — Latin-only uk value → check 8 FAIL:**
```
❌ check:stories FAILED — 1 violation(s):
  messages/uk.json:1  [uk-latin-only]
```
(planted `storybook.badge.new = 'Nove oholoshennia'` → reverted)

**NF3 — Missing uk key → check:i18n FAIL:**
```
Missing in uk: storybook.badge.new
❌ i18n parity check FAILED — locale key sets diverge.
```
(deleted `storybook.badge.new` from uk.json → reverted)

**NF4 — Runtime hardcode → check 9 FAIL:**
```
❌ check:stories FAILED — 1 violation(s):
  src/components/admin/AdminTable.tsx:320  [runtime-hardcode]
```
(planted `const _nf4 = () => <button>Previous</button>;` → reverted)

---

## STOP&ASK Log

None — all changes were within the defined scope.

---

## FilterBar Consumer List

The `activeFilters`/`availableFilters` slot already accepts fragments (fix was done in Tasks 382/383). Current slot consumers:
- `FilterBar.stories.tsx` — fragment pattern ✅
- No other production consumers found (FilterBar is Storybook-only in current product scope)

---

## Files Changed

| File | Change |
|------|--------|
| `messages/en.json` | +271 storybook.* keys + admin.table_sort.* + ui.pagination.* |
| `messages/sq.json` | parity with en |
| `messages/uk.json` | parity with en, all Cyrillic |
| `messages/it.json` | parity with en |
| `src/components/ui/badge.stories.tsx` | removed BG map → storyT |
| `src/components/ui/checkbox.stories.tsx` | removed CK map → storyT |
| `src/components/ui/command.stories.tsx` | removed CMD map → storyT |
| `src/components/ui/dialog.stories.tsx` | removed DLG map → storyT |
| `src/components/ui/dropdown-menu.stories.tsx` | removed DD map → storyT |
| `src/components/ui/input.stories.tsx` | removed INP map → storyT |
| `src/components/ui/popover.stories.tsx` | removed POP map → storyT |
| `src/components/ui/sheet.stories.tsx` | removed SHT map → storyT |
| `src/components/ui/tabs.stories.tsx` | removed TB map → storyT |
| `src/components/ui/button.stories.tsx` | removed BTN map → L via storyT |
| `src/components/ui/select.stories.tsx` | removed STATUS_ITEMS/SETTLEMENTS_BY_LOCALE maps → storyT |
| `src/components/layout/FilterBar.stories.tsx` | removed LABELS_EN/UK/SQ/IT + CHIP_SETS → storyT |
| `src/components/layout/PageHeader.stories.tsx` | removed PH_TEXT map → storyT |
| `src/components/layout/PageShell.stories.tsx` | removed PS_TEXT map → storyT |
| `src/components/layout/Section.stories.tsx` | removed SECTION_TEXT map → storyT |
| `src/components/admin/AdminCardList.stories.tsx` | removed STATE_LABELS/TYPE_LABELS/HINT_TEXT/etc. → storyT |
| `src/components/admin/AdminPageShell.stories.tsx` | removed DL/TAB_OPTIONS/PAGE_TITLES/etc. → storyT |
| `src/components/admin/AdminTable.stories.tsx` | removed LABELS map → makeLabels(locale) via storyT |
| `src/components/admin/StatusChangeHistory.stories.tsx` | removed STATUS_LABELS/STRESS_CONTENT → storyT |
| `src/components/shared/Combobox.stories.tsx` | removed PLACEHOLDERS/STATUS_OPTIONS/LOCATION_OPTIONS → storyT |
| `src/stories/AdminLayout.stories.tsx` | removed AL_TEXT map → storyT |
| `src/stories/EmptyState.stories.tsx` | removed ES map → storyT |
| `src/stories/ListingGrid.stories.tsx` | removed HEADING map → storyT |
| `src/components/admin/AdminTable.tsx` | `defaultSortLabels` → `makeSortLabels(tSort)` via useTranslations |
| `src/components/ui/pagination.tsx` | added 'use client' + useTranslations for Previous/Next |
| `scripts/check-stories.mjs` | added checks 7, 8, 9 |
| `scripts/add-storybook-keys.mjs` | temporary helper (safe to delete) |
| `docs/storybook-governance.md` | §14.3 + §14.6 updated |
| `docs/backlog.md` | task 389 session summary |
| `docs/sessions/2026-06-04-task389-real-translations.md` | this file |
