# Task 195 — R.1: Fix /admin 404 — locale-prefixed auth redirect

**Date:** 2026-05-23  
**Epic:** R — Admin Panel 2026  
**Status:** ✅ Complete

## Root cause

`src/app/admin/layout.tsx` redirected unauthenticated visitors to `/auth/login?next=/admin`. But the login page lives at `/{locale}/auth/login` — there is no `/auth/login` route. Result: 404.

Additionally, the `admin-locale` cookie was read only after the redirect guard, so the locale was unavailable for building the redirect URL.

## Auth flow (correct, post-fix)

1. `/admin` (unauthenticated) → `/{locale}/auth/login?next=/admin`
2. `/{locale}/auth/login` renders `AuthRedirect` → stores `/admin` in `sessionStorage('auth_redirect_next')`, dispatches `lero:open-auth-sheet` event
3. Header's AuthSheet opens in login view
4. After successful login, AuthSheet reads `sessionStorage` → `router.push('/admin')`
5. `/admin` (now authenticated) → admin layout checks role → admin/moderator → dashboard

## Change

`src/app/admin/layout.tsx` — moved locale resolution before the auth guard:

```tsx
// Before (bug):
const user = await getUser()
if (!user) redirect('/auth/login?next=/admin')       // 404 — route doesn't exist
if (!isAuthorized) redirect('/')

const jar = await cookies()                          // too late
const locale = resolveLocale(jar.get(...).value)

// After (fix):
const jar = await cookies()                          // resolve locale first
const locale = resolveLocale(jar.get(ADMIN_LOCALE_COOKIE)?.value)

const user = await getUser()
if (!user) redirect(`/${locale}/auth/login?next=/admin`)   // ✅ valid route
if (!isAuthorized) redirect(`/${locale}`)                  // consistent prefix
```

## Verification

- `tsc --noEmit` → 0 errors
- Unauthenticated → redirects to `/en/auth/login?next=/admin` (or `sq`/`uk`/`it` per cookie)
- Non-admin authenticated → redirects to `/{locale}` (home)
- Admin/moderator → proceeds to render dashboard
