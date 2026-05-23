# Task 184 — N.2: Fix `<html lang>` — Browser Translation Offer

**Date:** 2026-05-23  
**Epic:** N — Localization Consistency v2  
**Status:** ✅ Complete

## Root cause

`app/layout.tsx` rendered `<html>` with no `lang` attribute → browser could not determine page language → offered to translate every page. `[locale]/layout.tsx` had `<div lang={locale}>` on an inner wrapper div, which browsers ignore for translation decisions.

## What changed

### `src/app/layout.tsx`
- Made `RootLayout` async
- Added `headers` + `cookies` imports from `next/headers`
- Reads `X-NEXT-INTL-LOCALE` header (set by next-intl middleware on every locale-prefixed rewrite) via `Promise.all([headers(), cookies()])`
- Falls back to `admin-locale` cookie (admin routes are excluded from next-intl middleware, so the header is absent there)
- Final fallback: `'sq'` (default locale)
- Sets `lang={locale}` on `<html>`

```tsx
const [headersList, jar] = await Promise.all([headers(), cookies()])
const locale = headersList.get('X-NEXT-INTL-LOCALE') ?? jar.get('admin-locale')?.value ?? 'sq'
return <html lang={locale} suppressHydrationWarning ...>
```

### `src/app/[locale]/layout.tsx`
- Removed `<div lang={locale}>` wrapper
- Replaced with `<>...</>` (React fragment) — no other props or styling were on that div

## Architecture note

Header name `X-NEXT-INTL-LOCALE` confirmed from `node_modules/next-intl/dist/esm/production/shared/constants.js` (`HEADER_LOCALE_NAME = "X-NEXT-INTL-LOCALE"`). The middleware sets this on every rewrite response (locale-prefixed routes). HTTP header lookup is case-insensitive so `headers().get('X-NEXT-INTL-LOCALE')` works.

Admin routes excluded from next-intl middleware matcher → header absent → `admin-locale` cookie (written by `setAdminLocale()` action) covers that case.

## Verification
- `grep 'lang={locale}' src/app` — only `app/layout.tsx:<html>` and `BaseEmail.tsx:<Html>` (email templates, correct)
- `tsc --noEmit` → 0 errors
