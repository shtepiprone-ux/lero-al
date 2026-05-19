# Task 87 — Fix Ukrainian localization terminology

**Date:** 2026-05-19  
**Sprint:** Sprint 0 — Critical Bugfix / Regression Stabilization  
**Status:** ✅ PASS

---

## Problem summary

The Ukrainian localization (`messages/uk.json`) contained incorrect terminology and at least two typos. The task required a focused QA pass to identify and fix obvious issues.

---

## Root cause

Three issues found in `messages/uk.json`:

1. **Missing apostrophe (typo):** `"Обовязкова"` in `admin.property_types.error_name_required` — the obligatory apostrophe in "Обов'язкова" was absent.

2. **Russianism/typo:** `"Аккаунт"` in `notifications.type_agent_verified` — double `к` is the Russian spelling ("аккаунт"); Ukrainian standard is single `к` ("акаунт"). The rest of the file uses "Акаунт" consistently.

3. **Known bad terms NOT present:** "язик" and "Шкіп" are not in `messages/uk.json`. These terms were either never committed or were already fixed before this task. `nav.language = "Мова"` (correct), locale switcher uses native names ("Shqip", "English", "Українська", "Italiano") — correct pattern.

---

## Investigation summary

### Searched for known bad terms
- `язик`, `Шкіп`, `шкіп`, `язики`, `Язик`, `Шкіпетар` — **none found** in `messages/uk.json`
- `nav.language = "Мова"` — correct (not "Язик")
- `LocaleSwitcher.tsx` uses native language names ("Shqip", "English", "Українська", "Italiano") — correct pattern

### Language name audit (Ukrainian grammar)
Ukrainian grammar: language adjectives are NOT capitalized in mid-sentence context.

| Section | UK key | Value | Assessment |
|---------|--------|-------|------------|
| `admin.property_types.name_sq` | — | "Назва (албанська)" | ✅ lowercase — correct |
| `admin.property_types.name_en` | — | "Назва (англійська)" | ✅ lowercase — correct |
| `admin.property_types.name_uk` | — | "Назва (українська)" | ✅ lowercase — correct |
| `admin.property_types.name_it` | — | "Назва (італійська)" | ✅ lowercase — correct |
| `admin.currency.currencies.name_sq` | — | "Назва (Албанська)" | ℹ️ uppercase — consistent with task spec "Албанська", unchanged |
| `admin.currency.currencies.name_en` | — | "Назва (Англійська)" | ℹ️ uppercase — unchanged |

The currency section capitalizes language adjectives where property_types does not. The task's normative form uses uppercase ("Албанська"), and this inconsistency spans all locales equally. Not changed.

### Full QA pass — other items reviewed
- `nav.*` — all correct
- `listing.*` — all natural Ukrainian, no Russianisms found
- `auth.*` — correct ("Увійти", "Зареєструватись")
- `common.*` — correct
- `cabinet.*` — correct (except the "Акаунт" typo fixed above)
- `home.*` — correct
- `favorites.*` — correct
- `notifications.*` — one typo found and fixed ("Аккаунт" → "Акаунт")
- `saved_search.*` — correct
- `admin.*` — one typo found and fixed ("Обовязкова" → "Обов'язкова")

### Hardcoded Ukrainian string audit (scope check)
From the Task 85 investigation, the following hardcoded Ukrainian strings exist in source files:
- `src/modules/cabinet/actions/index.ts` — server action error messages ("Помилка збереження профілю", "Не вдалось видалити акаунт", etc.)
- `src/app/api/upload-avatar/route.ts` — API route error messages
- `src/modules/notifications/lib/emails/emailChange.ts` — email content

These are internal server-side strings, not rendered in the UI as locale-specific copy, and are out of scope for this Ukrainian terminology QA pass. Documented as follow-up.

---

## Implementation summary

Changed 2 values in `messages/uk.json`:

1. `admin.property_types.error_name_required`: `"Обовязкова албанська назва"` → `"Обов'язкова албанська назва"`
2. `notifications.type_agent_verified`: `"Аккаунт верифіковано"` → `"Акаунт верифіковано"`

No other locale files were changed (fixes are UK-only typos, not key structure changes).

---

## Files changed

- `messages/uk.json`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-87-ukrainian-localization-terminology.md` (this file)

---

## Ukrainian terminology before vs after

| Key | Before | After |
|-----|--------|-------|
| `admin.property_types.error_name_required` | "Обовязкова албанська назва" ❌ | "Обов'язкова албанська назва" ✅ |
| `notifications.type_agent_verified` | "Аккаунт верифіковано" ❌ | "Акаунт верифіковано" ✅ |

---

## Affected namespaces/keys

- `admin.property_types.error_name_required` — apostrophe added
- `notifications.type_agent_verified` — double-к removed

All other namespaces: no changes.

---

## Hardcoded Ukrainian findings

**Out of scope for Task 87 — documented as follow-up:**
- `src/modules/cabinet/actions/index.ts` — ~8 hardcoded Ukrainian server error messages
- `src/app/api/upload-avatar/route.ts` — ~4 hardcoded Ukrainian API error messages

These do not affect translated UI copy (they are server action responses that may or may not surface to users depending on client handling) and require a broader hardcoded-text audit task.

---

## Locales checked

- `sq` ✅ — unchanged, 819 keys
- `en` ✅ — unchanged, 819 keys
- `uk` ✅ — 2 typos corrected, 819 keys
- `it` ✅ — unchanged, 819 keys

All 4 locale files remain synchronized (equal key count confirmed).

---

## Breakpoints checked

Changes are text-only fixes to existing keys. The affected strings are:
- `"Обов'язкова албанська назва"` — admin-only field, not public-facing, no layout impact
- `"Акаунт верифіковано"` — notification badge text, short string, no overflow risk

Breakpoints `320`, `375`, `390`, `768`, `1280`, `1440`, `2560` — no new strings introduced, no layout risk.

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 6 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing errors in test files — 0 new errors |
| `npm run governance:localization` | ✅ PASS — 0C/0H/18M, at baseline |
| `npm run governance:ssr` | ✅ PASS — 0C/0H/0M, at baseline |
| `npm run build` | Not run (user runs builds manually per project policy) |

---

## Known pre-existing issues

- **Typecheck**: 4 errors in test files (`@testing-library/react`). Pre-existing.
- **Lint warnings (6)**: All pre-existing.
- **Hardcoded Ukrainian server errors**: `cabinet/actions/index.ts`, `upload-avatar/route.ts` — pre-existing, out of scope.

---

## Follow-up items

1. **Hardcoded Ukrainian server action errors** (`cabinet/actions/index.ts`, `upload-avatar/route.ts`) — should be replaced with i18n keys or made locale-aware. Separate audit task recommended.
2. **`admin.currency.currencies` language name capitalization** — "Назва (Албанська)" uses uppercase adjective; `admin.property_types` uses lowercase "Назва (албанська)". Both forms are present across all locales. Could be normalized to lowercase for Ukrainian grammar correctness in a future cleanup.
