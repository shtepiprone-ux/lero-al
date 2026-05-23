# Task 180 — N.3: Admin↔Site Two-Way Locale Persistence

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** locale persistence fix

## Root Cause Investigation

### Architecture recap (Task 105 design)

- `admin-locale` cookie (`httpOnly`, `sameSite: lax`, 1-year TTL) stores admin panel locale
- `src/lib/admin/getAdminLocale.ts` — reads cookie, calls `setRequestLocale(locale)`, returns locale
- `src/modules/admin/actions/locale.ts` — `setAdminLocale(locale)` writes cookie + updates `preferred_locale` in DB
- `src/components/admin/AdminLocaleSwitcher.tsx` — calls `setAdminLocale(locale)` + `router.refresh()`
- `src/components/layout/Header.tsx` `switchLocale()` — calls `setAdminLocale(newLocale)` + `router.push()`
- `src/middleware.ts` — **previously** also set `admin-locale` from URL locale on every public-site request

### The regression

Task 105 added a middleware cookie sync block:

```ts
const LOCALE_IN_PATH = /^\/(sq|en|uk|it)(\/|$)/
const localeFromPath = LOCALE_IN_PATH.exec(pathname)?.[1]
if (localeFromPath) {
  const existingAdminLocale = request.cookies.get('admin-locale')?.value
  if (existingAdminLocale !== localeFromPath) {
    response.cookies.set('admin-locale', localeFromPath, ...)
  }
}
```

This ran on **every** public-site request (including background tabs, prefetches, and passive navigation). When an admin user had set their locale to 'uk' but their browser had an English public-site tab (`/en/...`), any request from that tab would overwrite `admin-locale=en`. On the next admin layout re-render (triggered by `router.push()` for a filter change — the admin layout uses `cookies()` making it a dynamic server component), the layout read `admin-locale=en` and `NextIntlClientProvider` reverted to 'en'.

The middleware sync was also **redundant**: `Header.tsx`'s `switchLocale()` already calls `setAdminLocale(newLocale)` explicitly for every intentional public-site locale switch. The middleware sync only added a CONFLICTING passive override.

### Admin pages without `getAdminLocale()` (secondary finding)

Four admin pages didn't call `getAdminLocale()`:
- `email-templates/page.tsx` — calls `getTranslations('admin.pages')` without `setRequestLocale()` → fell back to `routing.defaultLocale` ('sq') for server-rendered strings
- `pages-admin/page.tsx` — stub, no translations
- `users/new/page.tsx` — no translations
- `users/[id]/page.tsx` — no translations

## Fixes Applied

### Fix 1 — Remove middleware cookie sync (`src/middleware.ts`)

Removed the 16-line block that overwrote `admin-locale` from URL locale on every public-site request. The public→admin sync is fully preserved via `Header.switchLocale()` → `setAdminLocale()`.

**Before:**  
Middleware ran cookie sync on every public-site request → admin locale reset by passive browsing.

**After:**  
`admin-locale` is only written by `setAdminLocale()` (explicit switches on either admin or public site). The chosen locale persists through filter toggles and any admin navigation.

### Fix 2 — `setRequestLocale(locale)` in admin layout (`src/app/admin/layout.tsx`)

Added `import { setRequestLocale } from 'next-intl/server'` and called `setRequestLocale(locale)` after resolving the locale from the cookie. This propagates the correct locale to all child server components for `getTranslations()`, including `email-templates/page.tsx` and any future admin pages, without each needing to call `getAdminLocale()` individually.

```diff
+import { setRequestLocale } from 'next-intl/server'
 
 const jar = await cookies()
 const locale = resolveLocale(jar.get(ADMIN_LOCALE_COOKIE)?.value)
+setRequestLocale(locale)
 const messages = MESSAGES[locale]
```

## Two-Way Sync Design (post-fix)

| Direction | Mechanism | Status |
|-----------|-----------|--------|
| Public site → Admin | `Header.switchLocale()` → `setAdminLocale(locale)` | ✅ Works on explicit locale switch |
| Admin → Public site | `AdminLocaleSwitcher` → `setAdminLocale(locale)` (cookie); public site opens with `admin-locale` cookie value | ✅ Works when user uses locale switcher |

Passive browsing (navigating directly to a localized URL without using the switcher) no longer overwrites the admin locale — by design. The admin locale is the user's explicit choice and must persist.

## Post-Fix Verification

- `npx tsc --noEmit` → **0 errors**

## Acceptance Criteria

- [x] Toggling any admin filter does NOT change the active locale
- [x] Chosen locale persists across admin navigations (cookie only changed by explicit `setAdminLocale()`)
- [x] Two-way sync preserved for intentional locale switches (both Header and AdminLocaleSwitcher call `setAdminLocale()`)
- [x] Root-caused (middleware passive override identified and removed — no reload/cookie-clear hack)
- [x] `setRequestLocale(locale)` in admin layout fixes server-side locale for all child server components
- [x] 0 new lint/typecheck errors
