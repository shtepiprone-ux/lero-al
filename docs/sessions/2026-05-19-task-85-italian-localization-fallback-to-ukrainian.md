# Task 85 — Fix Italian localization fallback to Ukrainian

**Date:** 2026-05-19  
**Sprint:** Sprint 0 — Critical Bugfix / Regression Stabilization  
**Status:** ✅ PASS

---

## Problem summary

When the active locale was Italian (`it`), the "Call" label in the listing detail mobile CTA bar displayed in Ukrainian (`Зателефонувати`) instead of Italian (`Chiama`). This affected any Italian-locale visitor viewing a listing detail page with a phone number.

---

## Root cause

`src/modules/listings/components/ListingMobileCTA.tsx` had a hardcoded Ukrainian string `Зателефонувати` as the label for the phone call button:

```tsx
<span className="hidden sm:inline">Зателефонувати</span>
```

The `listing.call` translation key already existed in all 4 locale files with correct translations:

| Locale | Value |
|--------|-------|
| `sq` | `Telefono` |
| `en` | `Call` |
| `uk` | `Зателефонувати` |
| `it` | `Chiama` |

The component was not using `useTranslations` — it simply had the Ukrainian string hardcoded, causing it to appear for all locales including Italian.

---

## Investigation findings

1. **`messages/it.json`**: No Cyrillic characters — all 855 keys present and in Italian.
2. **Key coverage**: All 4 locale files have exactly equal key counts (855 each) — no missing keys.
3. **i18n config (`src/i18n/routing.ts`, `src/i18n/request.ts`)**: Correct — `it` is a valid locale, no incorrect fallback to `uk`.
4. **Middleware locale detection**: Disabled (`localeDetection: false`) — locale determined by URL prefix only.
5. **Other Cyrillic in source files**: Cyrillic found in admin-only files (admin actions, email templates, admin API routes), Storybook story fixtures, and locale switcher data (intentional `'Українська'` label). None of these affect the Italian-locale public UI.
6. **`useCurrencies.ts`**: Contains `name_uk: 'Лек'` / `name_uk: 'Євро'` — these are Ukrainian-language data values, not UI strings, and are rendered only in the `uk` locale context.

---

## Implementation summary

**`src/modules/listings/components/ListingMobileCTA.tsx`**

- Added `import { useTranslations } from 'next-intl'`
- Added `const t = useTranslations('listing')` inside the component function
- Replaced hardcoded `Зателефонувати` with `{t('call')}`

No translation keys were added — `listing.call` already existed in all 4 locale files.

---

## Files changed

- `src/modules/listings/components/ListingMobileCTA.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-85-italian-localization-fallback-to-ukrainian.md` (this file)

---

## Affected namespaces/keys

| Key | Namespace | Action |
|-----|-----------|--------|
| `call` | `listing` | Existing key — now used via `useTranslations` instead of hardcoded string |

---

## Italian behavior before vs after

| Scenario | Before | After |
|----------|--------|-------|
| Italian locale, listing with phone | Mobile CTA shows "Зателефонувати" (Ukrainian) | Mobile CTA shows "Chiama" (Italian) ✅ |
| Albanian locale, listing with phone | Mobile CTA shows "Зателефонувати" (wrong — should be "Telefono") | Mobile CTA shows "Telefono" (Albanian) ✅ |
| English locale, listing with phone | Mobile CTA shows "Зателефонувати" (wrong — should be "Call") | Mobile CTA shows "Call" (English) ✅ |
| Ukrainian locale, listing with phone | Mobile CTA shows "Зателефонувати" ✅ (coincidentally correct) | Mobile CTA shows "Зателефонувати" (Ukrainian) ✅ |

---

## Locales checked

- `sq` ✅ — `listing.call` = `"Telefono"`, value correct
- `en` ✅ — `listing.call` = `"Call"`, value correct
- `uk` ✅ — `listing.call` = `"Зателефонувати"`, value correct
- `it` ✅ — `listing.call` = `"Chiama"`, value correct

All 4 locale files remain in sync (855 keys each, confirmed by `governance:localization`).

---

## Breakpoints checked

`ListingMobileCTA` renders only on mobile/tablet (`lg:hidden`). The call button label `<span className="hidden sm:inline">` is:
- `320` / `375` / `390` — hidden below `sm:` breakpoint (icon-only, no text overflow risk)
- `640`+ — label visible; "Chiama" (Italian) is short, no overflow risk
- `768`+ — still mobile CTA territory; component hidden at `lg:hidden`
- `1280` / `1440` / `2560` — component not rendered (desktop uses `ListingContact.tsx` sidebar)

No responsive regressions introduced.

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 6 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing errors in test files (`@testing-library/react`) — 0 new errors |
| `npm run governance:localization` | ✅ PASS — 0C/0H/18M, at baseline |
| `npm run governance:primitives` | ✅ PASS — 0C/57H/8M, at baseline |
| `npm run governance:responsive` | ✅ PASS — at baseline |
| `npm run governance:ssr` | ✅ PASS — 0C/0H/0M, at baseline |
| `npm run build` | Not run (user runs builds manually per project policy) |

---

## Known pre-existing issues

- **Typecheck**: 4 errors in `src/modules/auth/__tests__/AuthContext.test.tsx` and `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` — `@testing-library/react` missing `screen`, `waitFor`, `fireEvent` exports. Pre-existing before this task.
- **Lint warnings (6)**: All pre-existing — `CLOSED_LABEL`/`isFavoriteClosed` in `page.tsx`, `getCallerId` in admin actions, `displayedIdsRef` in `useFavoritesRealtime.ts`, `_req` in Supabase function, `<img>` in `AppImage.tsx`.
- **Hardcoded Albanian `waText`**: `ListingMobileCTA` also has a hardcoded Albanian WhatsApp pre-fill message (`Pershendetje!...`). This is a separate localization bug — not Italian→Ukrainian fallback. Out of scope for this task.
- **Cabinet server actions**: `src/modules/cabinet/actions/index.ts` contains hardcoded Ukrainian error strings (e.g. `'Помилка збереження профілю'`). These are server action error returns, not public Italian-locale UI strings. Client components use translation keys for user-facing error messages. Separate concern.

---

## Remaining risks or follow-up items

- **`waText` in `ListingMobileCTA`**: The WhatsApp pre-fill message is hardcoded Albanian (`Pershendetje! Jam i interesuar për: ${listingTitle}`). This affects all non-Albanian locales. Separate task recommended.
- **Cabinet action error strings**: Several Ukrainian server-side error messages exist in `cabinet/actions/index.ts` and `api/upload-avatar/route.ts`. They may surface in Italian UI if the client components display raw server error strings. Audit recommended.
