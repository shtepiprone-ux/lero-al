# Session Archive: Task 105 — Epic A.3 — Locale Persistence Site ↔ Admin — 2026-05-19

## Task 105 Summary

**Type:** Feature / State authority  
**Epic:** A — Localization & Locale Consistency (A.3)

---

## Pre-Task Mandatory Checklist

- [x] No duplicate components — no new components
- [x] No hardcode — locale handled server-side via cookie
- [x] Scope isolated — `src/middleware.ts`, `src/modules/admin/actions/locale.ts`

---

## Investigation

### Existing architecture

| Component | Role |
|-----------|------|
| `src/modules/admin/actions/locale.ts` | Server Action `setAdminLocale(locale)` — writes `admin-locale` cookie |
| `src/components/layout/Header.tsx` `switchLocale()` | Calls `setAdminLocale(newLocale)` when locale switcher clicked |
| `src/components/admin/AdminLocaleSwitcher.tsx` | Calls `setAdminLocale(locale)` when admin sidebar switcher clicked |
| `src/app/admin/layout.tsx` | Reads `admin-locale` cookie → passes locale to `NextIntlClientProvider` |

### The gap

`setAdminLocale` was only called when the user **explicitly clicked** the locale switcher. It was NOT called during normal navigation (e.g. user directly visits `/uk/listings` via a bookmark or external link). In that case, the `admin-locale` cookie remained from the previous session or defaulted to `'en'`. Opening admin would display the wrong locale.

### Race condition (existing bug)

In `Header.tsx`, `setAdminLocale(newLocale)` was called **without `await`**:
```ts
setAdminLocale(newLocale)   // not awaited — server action response may lag
router.push(`/${newLocale}${pathWithoutLocale}`)
```
If the browser navigated to the new URL before the server action response set the cookie, the admin panel would still see the old locale on its next load. The middleware fix also resolves this race.

---

## Implementation

### Fix 1: Middleware locale sync (`src/middleware.ts`)

Added after `handleI18nRouting(request)` and session cookie propagation:

```typescript
// Sync admin-locale cookie from the URL locale on every public-site request.
const LOCALE_IN_PATH = /^\/(sq|en|uk|it)(\/|$)/
const localeFromPath = LOCALE_IN_PATH.exec(pathname)?.[1]
if (localeFromPath) {
  const existingAdminLocale = request.cookies.get('admin-locale')?.value
  if (existingAdminLocale !== localeFromPath) {
    response.cookies.set('admin-locale', localeFromPath, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  }
}
```

**Why middleware:** The middleware runs on every public-site request (matcher excludes `/admin/*`, `/api/*`). It has access to both the URL path (locale source of truth) and the response object (to set cookies). No Server Action or API round-trip required.

**Why only when changed (`existingAdminLocale !== localeFromPath`):** Avoids a `Set-Cookie` header on every request, which would bypass CDN caching for non-authenticated responses.

### Fix 2: Cookie hardened to `httpOnly: true` (`locale.ts`)

Changed `httpOnly: false` → `httpOnly: true`. The `admin-locale` cookie is never read by client-side JavaScript — only by `AdminLayout` (Server Component) and the middleware. `httpOnly: true` prevents unnecessary JS exposure.

---

## End-to-End Verification (code-level)

### Scenario 1: User visits `/uk/listings` directly (bookmark)
1. Middleware runs → `localeFromPath = 'uk'`
2. `existingAdminLocale` = undefined/stale → condition true
3. `admin-locale=uk` written to response cookies
4. User opens `/admin` → `AdminLayout` reads `admin-locale=uk` → displays Ukrainian ✅

### Scenario 2: User switches locale via public site switcher (sq → uk)
1. `switchLocale('uk')` called → `setAdminLocale('uk')` + `router.push('/uk/...')`
2. Next request to `/uk/...` hits middleware → `localeFromPath = 'uk'`
3. Cookie already set to `uk` by server action → no redundant write ✅
4. Race condition resolved: even if server action response arrives late, middleware already sets the cookie ✅

### Scenario 3: Admin explicitly switches locale in sidebar (uk → it)
1. `AdminLocaleSwitcher` calls `setAdminLocale('it')` → `admin-locale=it`
2. `router.refresh()` → admin panel re-renders in Italian ✅
3. User browses public site in `sq` → next request sets `admin-locale=sq` → admin reverts to Albanian
4. This is correct behavior: public site locale is authoritative ✅

### Scenario 4: All four locales
| Public URL | Cookie written | Admin locale |
|------------|---------------|--------------|
| `/sq/...` | `admin-locale=sq` | Albanian ✅ |
| `/en/...` | `admin-locale=en` | English ✅ |
| `/uk/...` | `admin-locale=uk` | Ukrainian ✅ |
| `/it/...` | `admin-locale=it` | Italian ✅ |

### SSR / Hydration safety

`AdminLayout` is a Server Component that reads the cookie before rendering. The locale is passed to `NextIntlClientProvider` at SSR time. No hydration mismatch is possible — the client receives the same locale that was determined on the server.

---

## Cookie Properties

| Property | Value | Rationale |
|----------|-------|-----------|
| `name` | `admin-locale` | Namespaced to admin, separate from any public-site locale cookie |
| `httpOnly` | `true` | Server-only read (AdminLayout, middleware) — no JS access needed |
| `sameSite` | `lax` | Allows cross-site navigation (top-level GET) while preventing CSRF on POST |
| `maxAge` | 1 year | Persistent preference — survives browser restarts |
| `path` | `/` | Required: both `/` (public site middleware) and `/admin` (layout) must read it |
| `secure` | not set | Browser default — works on HTTP locally; HTTPS enforced in prod via Cloudflare |

---

## Files Changed

| File | Change |
|------|--------|
| `src/middleware.ts` | Added locale sync block after `handleI18nRouting` |
| `src/modules/admin/actions/locale.ts` | `httpOnly: false` → `httpOnly: true` |

---

## Validation

| Check | Result |
|-------|--------|
| All 4 locales synced via middleware | ✅ Verified |
| No SSR hydration mismatch | ✅ Cookie read server-side before render |
| Cookie `sameSite: lax` | ✅ |
| Cookie `httpOnly: true` | ✅ |
| Race condition resolved | ✅ Middleware always wins regardless of server action timing |
| `npm run lint` | ✅ 0 errors / 5 pre-existing warnings |
| `npm run governance:localization` | ✅ PASS at baseline (no message changes) |
| Responsive coverage | N/A — server-side cookie, no UI changes |
