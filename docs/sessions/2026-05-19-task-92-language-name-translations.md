# Task 92 — Verify and complete language-name translations

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Problem summary

Language names in the locale switcher and admin settings were hardcoded (self-identifying). When Ukrainian locale was active, the Albanian option still showed "Shqip" (Albanian in Albanian) instead of "Албанська" (Albanian in Ukrainian). The task required all language names to be translated into the active locale.

---

## Investigation findings

### Task 87 audit
Task 87 (commit `fc75200f0`) only fixed 2 Ukrainian typos in `uk.json`:
- `"Обовязкова"` → `"Обов'язкова"` (apostrophe added)
- `"Аккаунт"` → `"Акаунт"` (Russian double-к removed)

It did NOT address any language-name strings. The `'Шкіп'` bug (mentioned in the task) was **not present** in the codebase — no Cyrillic transliteration of "Shqip" exists anywhere in source files.

### Hardcoded language names found in 3 locations

| File | Line(s) | Hardcoded values |
|------|---------|-----------------|
| `src/components/shared/LocaleSwitcher.tsx` | 15–18 | `'Shqip'`, `'English'`, `'Українська'`, `'Italiano'` in `LOCALES` constant |
| `src/components/layout/Header.tsx` | 254 | `loc.label` consuming the above |
| `src/components/admin/AdminSettings.tsx` | 25–28 | `'🇦🇱 Shqip'`, `'🇬🇧 English'`, `'🇺🇦 Українська'`, `'🇮🇹 Italiano'` in `LOCALE_OPTIONS` |

### No language-name i18n keys existed
Searched all 4 locale files for language name keys — none existed before this task. The `nav.language` key exists ("Gjuha"/"Language"/"Мова"/"Lingua") but not individual language names.

---

## Implementation

### Step 1 — Add `nav.lang_*` keys to all 4 locale files

Canonical translations per task specification:

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `nav.lang_sq` | `Shqip` | `Albanian` | `Албанська` | `Albanese` |
| `nav.lang_en` | `Anglisht` | `English` | `Англійська` | `Inglese` |
| `nav.lang_uk` | `Ukrainisht` | `Ukrainian` | `Українська` | `Ucraino` |
| `nav.lang_it` | `Italisht` | `Italian` | `Італійська` | `Italiano` |

Added after `"follow_us"` in each file's `nav` section.

### Step 2 — `LocaleSwitcher.tsx`
- Removed `label` field from `LOCALES` constant (was `'Shqip'`, `'English'`, etc.)
- Added `useTranslations` import
- Added `const t = useTranslations('nav')` inside component
- Added `langLabels: Record<LocaleCode, string>` computed from `t('lang_sq')` etc.
- Replaced `current?.label` with `langLabels[currentLocale as LocaleCode]`
- Replaced `{loc.label}` in dropdown with `{langLabels[loc.code]}`

### Step 3 — `Header.tsx`
- Added `LocaleCode` to the import from `LocaleSwitcher`
- Added `langLabels: Record<LocaleCode, string>` in `Header()` using existing `const t = useTranslations('nav')`
- Replaced `{loc.flag} {loc.label}` with `{loc.flag} {langLabels[loc.code]}`

### Step 4 — `AdminSettings.tsx`
- Removed module-level `LOCALE_OPTIONS` constant with hardcoded labels
- Added `const tNav = useTranslations('nav')` inside `AdminSettings()` function
- Computed `LOCALE_OPTIONS` dynamically: `` `🇦🇱 ${tNav('lang_sq')}` `` etc.

---

## Files changed

- `messages/sq.json`
- `messages/en.json`
- `messages/uk.json`
- `messages/it.json`
- `src/components/shared/LocaleSwitcher.tsx`
- `src/components/layout/Header.tsx`
- `src/components/admin/AdminSettings.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-92-language-name-translations.md` (this file)

---

## Locale key counts

Before: 819 keys per locale file.
After: 823 keys per locale file (+4 `nav.lang_*` keys). All 4 files remain in sync.

---

## Behavior after fix

| Locale active | Albanian option shows | English option shows | Ukrainian option shows | Italian option shows |
|---|---|---|---|---|
| sq | Shqip ✓ | Anglisht ✓ | Ukrainisht ✓ | Italisht ✓ |
| en | Albanian ✓ | English ✓ | Ukrainian ✓ | Italian ✓ |
| uk | Албанська ✓ | Англійська ✓ | Українська ✓ | Італійська ✓ |
| it | Albanese ✓ | Inglese ✓ | Ucraino ✓ | Italiano ✓ |

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 5 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test file errors, 0 new |
| `npm run governance:localization` | ✅ PASS — C0/H0/M18, at baseline |
| Canonical translation check | ✅ All 16 values match task specification |
| `npm run build` | Not run (per project policy — user runs manually) |

---

## No hardcoded language names remain

Confirmed: No occurrence of `'Shqip'`, `'English'`, `'Українська'`, `'Italiano'` (or similar) as standalone string literals for language names in any component file.
