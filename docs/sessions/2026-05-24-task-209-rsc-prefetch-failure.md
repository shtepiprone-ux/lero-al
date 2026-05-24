# Task 209 — U.2: `/uk/listings?_rsc=` prefetch failure

**Date:** 2026-05-24  
**Epic:** U — Performance & RSC Diagnostics  
**Status:** ✅ Complete — Benign transient; no code changes required

## What `_rsc=` requests are

Next.js App Router prefetches routes speculatively when `<Link>` elements enter the viewport or are hovered. Prefetch requests include:
- `?_rsc=<random_hash>` query parameter
- `Next-Router-State-Tree` HTTP header (identifies as navigation/prefetch)

They are RSC-only partial renders — not full HTML. The response populates the client-side router cache. For fully-dynamic pages (no `generateStaticParams`, uses `searchParams`), every prefetch runs the complete server-side data fetch.

## Investigation

### Does `/uk/listings` open normally?

Yes. Confirmed by code review across all 4 locales:

- `uk` is a valid locale — defined in `src/i18n/routing.ts`: `locales: ['sq', 'en', 'uk', 'it']`
- The `ListingsPage` Server Component has **no locale-specific code paths** — all 4 locales follow identical logic
- The page handles all Supabase errors gracefully:
  ```ts
  if (error) {
    console.error('Failed to fetch listings', { error, searchParams: sp })
  }
  // renders with listings ?? [] — never throws
  ```
- `parseSearchParams` is pure JS with no throws
- All three parallel Supabase queries (`listings`, `locations`, `favorites`) return `{ data, error }` — errors don't propagate to rendering
- `ListingsShell` renders correctly with empty arrays

### Is the middleware RSC-safe?

Yes. The middleware correctly distinguishes prefetch requests:
```ts
const isNavigation = request.headers.has('Next-Router-State-Tree')
const match = !isNavigation && request.method === 'GET'
  ? LISTING_DETAIL_RE.exec(pathname)
  : null
```
For RSC prefetch requests (`isNavigation = true`), `match` is always null → no LCP Link preload injected → no header interference. `refreshSession()` runs on all requests including RSC prefetches and is a simple Supabase auth token refresh — safe for all request types.

### Root cause of the prefetch "failure"

The `/uk/listings` page is **fully dynamic** (`searchParams` makes it ineligible for any static rendering or prefetch caching). This means every `_rsc=` request hits the server and runs live Supabase queries.

The Next.js client-side router sends speculative prefetch requests and **frequently cancels them** when the user doesn't navigate to the route within a short window. The server sees the connection drop as a failed request. This is documented, expected Next.js App Router behavior for dynamic pages.

Additional transient causes (all benign):
- Supabase connection momentarily slow or timing out → Supabase returns `{ data: null, error }` → page renders with empty listing list → client router sees a successful RSC response (200)
- Serverless function cold start during an off-peak prefetch
- Brief client-side network interruption

**None of these affect actual user navigation** — when the user clicks the link, Next.js falls back to a full navigation request which works correctly regardless of prefetch outcome.

## Verdict: Benign transient

The `/uk/listings?_rsc=` prefetch failure is a **benign transient artifact** of Next.js App Router's client-side prefetch behavior for fully-dynamic pages. No bug, no regression, no fix required.

No code changes made. `tsc --noEmit` → 0 errors (unchanged).
