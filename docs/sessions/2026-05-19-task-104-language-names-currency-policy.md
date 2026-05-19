# Session Archive: Task 104 — Epic A.2 — Canonical Language Names + Currency-Code Policy — 2026-05-19

## Task 104 Summary

**Type:** Bugfix / Localization QA  
**Epic:** A — Localization & Locale Consistency (A.2)  
**Outcome:** Verification pass + policy formalization (no code changes needed)

---

## Pre-Task Mandatory Checklist

- [x] No duplicate components — no components created
- [x] No hardcode planned — policy documentation only
- [x] Scope isolated — touched only `docs/ai-behavior.md`

---

## Language Names Audit

### LocaleSwitcher Component

`src/components/shared/LocaleSwitcher.tsx` uses:
```ts
const langLabels: Record<LocaleCode, string> = {
  sq: t('lang_sq'),
  en: t('lang_en'),
  uk: t('lang_uk'),
  it: t('lang_it'),
}
```
All four language names go through i18n keys. No hardcoded strings. ✅

### Header Mobile Drawer

`src/components/layout/Header.tsx` uses the same `langLabels` object inside the mobile Sheet drawer. Language buttons: `{loc.flag} {langLabels[loc.code]}`. ✅

### Canonical Values in All Four Locale Files

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `nav.lang_sq` | Shqip | Albanian | Албанська | Albanese |
| `nav.lang_en` | Anglisht | English | Англійська | Inglese |
| `nav.lang_uk` | Ukrainisht | Ukrainian | Українська | Ucraino |
| `nav.lang_it` | Italisht | Italian | Італійська | Italiano |

All values are correct and canonical. Sprint 1 Task 92 established these; Task 103 audit confirmed no drift. ✅

### Other Language Name References

Searched all `.tsx` files for hardcoded language names ("Albanian", "Ukrainian", "Italian", "Shqip", "Anglisht", "Ukrainisht", etc.). Only hits were in Storybook stories and metadata strings — no component UI text. ✅

---

## Currency Code Policy Audit

### Verified: Zero `t(currencyCode)` patterns

Searched for `t('ALL')`, `t('EUR')`, `t('USD')`, `t('GBP')` — zero matches.

### Currency display paths confirmed safe

| Location | Pattern | Assessment |
|----------|---------|------------|
| `formatPrice()` in `formatters.ts` | Appends code via string concat; uses `normalizeCurrencyCode()` guard | ✅ Correct |
| `ListingFormShell.tsx` / `StepBasicInfo.tsx` | `{(['ALL', 'EUR'] as const).map(cur => ... {cur})}` — raw code rendered | ✅ Correct |
| `ListingsFilters.tsx` / `FiltersPanel.tsx` | `1 {currency} ≈ {rate.toFixed(2)} ALL` — literal | ✅ Correct |
| `ProfileTab.tsx` | `t('currency_ALL')` → full display name "Albanian Lek (ALL)" | ✅ Correct — translating the NAME, not the code |
| `cabinet.currency_ALL/EUR/USD/GBP` keys | Translate full display names (code in parentheses as part of the name) | ✅ Correct |

**Distinction:** `t('currency_ALL')` is correct — it translates the FULL DISPLAY NAME (e.g. "Albanian Lek (ALL)"), not the currency code itself. The code "ALL" embedded in the value string is part of a human-readable label, not a i18n lookup of the code.

### `cabinet.filter_ALL` note

`ListingsTab.tsx` uses `t(\`filter_${key}\`)` where `key='ALL'` → `cabinet.filter_ALL = 'Të gjitha'` (Albanian for "All"). This is the listing **visibility filter**, not a currency code. The prefix `filter_` disambiguates it from `currency_ALL`. ✅

---

## LocaleSwitcher Breakpoint Verification

| Breakpoint | Mechanism | Status |
|-----------|-----------|--------|
| 320px | Mobile hamburger drawer (Sheet) — locale buttons `min-h-[44px]` | ✅ Functional |
| 375px | Same as 320px | ✅ Functional |
| 390px | Same as 320px | ✅ Functional |
| 640px (sm) | LocaleSwitcher dropdown visible in header (`hidden sm:flex`) | ✅ Functional |
| 768px | Same as 640px | ✅ Functional |
| 1280px | Same as 640px | ✅ Functional |
| 1440px | Same as 640px | ✅ Functional |
| 2560px | Same as 640px | ✅ Functional |

Note: On mobile (320–639px), the locale switcher is inside the hamburger Sheet drawer — buttons with `min-h-[44px]` touch targets. This is the current UX pattern; Epic A.4 (Task 106) will promote it to the header as a canonical `Combobox`.

---

## Policy Formalization

Added three rules to `docs/ai-behavior.md` § Localization (i18n) Rules:

1. **Currency codes are domain identifiers, never i18n keys** — `ALL/EUR/USD/GBP` must be literal strings in UI; `t(currencyCode)` is forbidden.
2. **Language names use canonical i18n keys** — always `t('lang_sq')` etc., never hardcoded strings like "Albanian".
3. **API/server-action errors must return stable English error codes** — clients resolve via `t()` (reference: Task 103 upload-avatar implementation).

---

## Validation

| Check | Result |
|-------|--------|
| Language names canonical in all 4 locales | ✅ Verified |
| Currency codes literal in UI (zero `t(code)` calls) | ✅ Verified |
| LocaleSwitcher at all 7 breakpoints | ✅ Verified via code review |
| `npm run lint` | ✅ 0 errors / 5 pre-existing warnings |
| `npm run governance:localization` | ✅ PASS at baseline (no code changes) |
| Policy documented in `docs/ai-behavior.md` | ✅ Added |

---

## No Code Changes Required

All acceptance criteria were already met by Sprint 1 Task 92 (language names) and Task 86 (currency code policy). Task 104 deliverable is the formal policy documentation in `docs/ai-behavior.md` and this verification session log.
