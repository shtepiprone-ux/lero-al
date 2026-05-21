# Session Archive: Sprint 4 — Auth Flow Consolidation — 2026-05-21

## Task 159 — Consolidate the two auth flows into one (AuthSheet = canonical)

**Status:** COMPLETE

---

## Pre-Task Mandatory Checklist

1. **No duplicate components** — `AuthRedirect` did not exist. ✓
2. **No hardcode planned** — `AuthRedirect` renders only a spinner (no visible text). ✓
3. **Scope isolated** — 4 files deleted, 3 rewritten/created, AuthSheet login flow patched. No phone validation or auth behavior changes. ✓

---

## Architecture Decision

**Chosen: Thin redirect pages + sessionStorage for `next`**

**Why not keep the page forms?**
The project's Domain Integrity Rules forbid parallel implementations of the same flow. Having both LoginForm (page) and AuthSheet (drawer) with different validation logic (RegisterForm had raw Supabase errors, no error-code contract) is a source-of-truth violation.

**Why not convert server redirects to client navigation?**
Server `redirect()` from RSC/Server Actions cannot call `openAuthSheet()` directly (it's a browser event). The redirect to `/auth/login?next=…` must remain a browser URL navigation.

**How the bridge works:**
1. Server redirect → `/[locale]/auth/login?next=/favorites`
2. `AuthRedirect` client component mounts
3. Reads `next` from prop (passed by server page from searchParams)
4. Validates: only same-origin paths accepted (starts with `/`)
5. Stores in `sessionStorage['auth_redirect_next']`
6. Dispatches `lero:open-auth-sheet` event → Header opens AuthSheet
7. User logs in → AuthSheet's LoginView reads sessionStorage → `router.push(next)`
8. Clears sessionStorage entry

**No-JS note:** If JS is disabled, the spinner stays. This is acceptable — the app requires JS for all interactive features (Next.js RSC, Combobox, AuthSheet, etc.).

**Back/Forward:** After login and redirect to `/favorites`, Back goes to `/auth/login?next=/favorites` which auto-opens the drawer again. Acceptable behavior; the prior URL before the gated route is one more Back press away.

---

## Files Created

### `src/modules/auth/components/AuthRedirect.tsx`
Thin 'use client' component. On mount:
- Validates + stores `next` in sessionStorage (only if starts with `/`)
- Calls `openAuthSheet(view)`
- Renders a centered spinner as background

---

## Files Rewritten

### `src/app/[locale]/auth/login/page.tsx`
Was: `LoginPage → LoginFormClient → LoginForm (dynamic)`.
Now: `LoginPage (server async) → AuthRedirect({ view: 'login', next })`.
Reads `next` from searchParams and passes as prop.

### `src/app/[locale]/auth/register/page.tsx`
Was: `RegisterPage → RegisterFormClient → RegisterForm (dynamic)`.
Now: `RegisterPage (server async) → AuthRedirect({ view: type==='agent'?'register-agent':'register' })`.
Handles `?type=agent` → opens register-agent view (city + company, Tasks 112/113).

---

## Files Modified

### `src/modules/auth/components/AuthSheet.tsx`
LoginView `handleSubmit` success path: after `onClose()`, reads `sessionStorage['auth_redirect_next']`. If present, clears it and `router.push(next)`. Otherwise falls back to `router.refresh()`. This is the only change needed; all other AuthSheet views are unaffected.

---

## Files Deleted

| File | Reason |
|---|---|
| `LoginForm.tsx` | Legacy page form — superseded by AuthSheet LoginView |
| `LoginFormClient.tsx` | Dynamic wrapper for LoginForm — no longer needed |
| `RegisterForm.tsx` | Legacy page form — superseded by AuthSheet RegisterView |
| `RegisterFormClient.tsx` | Dynamic wrapper for RegisterForm — no longer needed |

---

## Entry Points Verified

| Entry point | Before | After |
|---|---|---|
| Header "Login" button | AuthSheet ✓ | AuthSheet ✓ (unchanged) |
| Header "Register" button | AuthSheet ✓ | AuthSheet ✓ (unchanged) |
| MobileBottomNav (guest) | AuthSheet ✓ | AuthSheet ✓ (unchanged) |
| FavoriteButton (guest) | AuthSheet ✓ | AuthSheet ✓ (unchanged) |
| ListingContact (guest) | AuthSheet ✓ | AuthSheet ✓ (unchanged) |
| Admin layout `redirect('/auth/login?next=/admin')` | LoginForm | AuthRedirect → AuthSheet |
| Cabinet page `redirect('/${locale}/auth/login')` | LoginForm | AuthRedirect → AuthSheet |
| Favorites page `redirect` | LoginForm | AuthRedirect → AuthSheet |
| Listings/create `redirect` | LoginForm | AuthRedirect → AuthSheet |
| Listings/edit `redirect` | LoginForm | AuthRedirect → AuthSheet |
| confirm-email `<Link href="auth/login">` | LoginForm | AuthRedirect → AuthSheet |
| ResetPasswordClient `router.push('auth/login')` | LoginForm | AuthRedirect → AuthSheet |
| Homepage agent CTA `?type=agent` | RegisterForm | AuthRedirect → AuthSheet (register-agent) |

---

## i18n

No keys became dead: AuthSheet uses all the same `auth.*` keys as LoginForm and RegisterForm.
governance:localization: ✅ PASS (M19, baseline M18 — no regression).

---

## Validation

- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
- governance:localization: ✅ PASS
- npm run build: user's manual step
