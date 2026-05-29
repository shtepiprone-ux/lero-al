# State Authority — Listings · Favorites · Cabinet

Authoritative reference for state ownership, synchronization contracts,
and React lifecycle safety rules across the three primary client domains.

---

## Authority Levels

```
URL-L1   URL params (?tab=, ?filter=, ?type=)
         Highest authority — survives navigation, shared across tabs.

SSR-L2   Server Component props (listings[], favoriteIds[], typeCounts, profile)
         Authoritative at page-load time. Refreshed only by navigation or router.refresh().

Live-L3  Client state that starts from SSR-L2 and receives in-session mutations.
         localFavoriteIds (ListingsShell), liveCounts (FavoritesShell),
         displayedListings (FavoritesShell).
         Authority: SSR initializes, client mutations take over.

UI-L4    Pure UI overlay — no DB backing.
         deletedIds (ListingsTab), confirmId, view/filtersOpen, scrollTargetSlug.
         Resets on navigation.
```

---

## SSR Authority vs Client Authority

| State | Initial authority | Takes over | Healed by |
|---|---|---|---|
| `favoriteIds` / `favoriteSet` | SSR-L2 | → `localFavoriteIds` (Live-L3) via `useState` + `useEffect([favoriteIds])` | Navigation or `router.refresh()` |
| `typeCounts` | SSR-L2 | → `liveCounts` (Live-L3) via `useState` + `useEffect([typeCounts])` | Filter navigation |
| `displayedListings` | SSR-L2 | Client mutations (unfavorite, realtime) | `useEffect([initialListings])` re-syncs on filter nav |
| `FavoriteButton.favorited` | SSR-L2 via prop | `useEffect([isFavorited])` re-syncs on prop change | Automatically self-heals |
| `savedSearches.items` | SSR-L2 | Client delete mutations | `useEffect([initial])` re-syncs on parent re-render |
| `listings` (page 1) | SSR-L2 | Immutable in client | Navigation or `router.refresh()` |
| `extraListings` | Not from SSR | `/api/listings` client fetch | Resets via `useEffect([listings])` on filter nav |
| `livePatches` (cabinet listings) | — (empty) | Realtime UPDATE events via `useCabinetListingsRealtime` | `useEffect([initial])` resets to `new Map()` on filter nav |

---

## Optimistic State Ownership Rules

1. **FavoriteButton**: `setFavorited(nextState)` fires immediately (optimistic).
   `setFavorited(result.isFavorited)` fires after server resolves (reconcile).
   `useEffect([isFavorited])` syncs from parent prop ONLY when no transition is pending.

2. **ListingsTab**: listings filtered by `deletedIds` Set (subtract-only).
   Server state (`initial`) is never mutated on the client — only the overlay changes.
   Failed deletes do NOT add to `deletedIds` — listing stays visible.

3. **FavoritesShell**: `displayedListings` removes items optimistically via `handleFavoriteToggled`.
   `liveCounts` decremented synchronously (before the listing is removed from display).
   No rollback mechanism — if the server DELETE fails, `FavoriteButton` reconciles to
   `isFavorited: true` but `displayedListings` still has the listing (no visual regression
   because the listing was never removed if `handleFavoriteToggled` is called after
   server confirmation).

---

## Realtime Synchronization Model

The **favorites page** (`useFavoritesRealtime`) and the **cabinet listings tab** (`useCabinetListingsRealtime`) have realtime subscriptions.
The `/listings` public page remains SSR-snapshot-only with no push updates.

```
Supabase favorites table
  REPLICA IDENTITY FULL (enables listing_id in DELETE payload)
  Publication: supabase_realtime

useFavoritesRealtime:
  Channel: favorites:user:{userId}
  Events: INSERT, DELETE (via postgres_changes)
  
  INSERT flow:
    1. Check displayedIdsRef (dedup — skip if already shown)
    2. Fetch full listing from DB (uses canonical LISTING_SELECT)
    3. Check cancelled flag (guard against unmounted component)
    4. Dispatch onEvent INSERT → FavoritesShell updates displayedListings + liveCounts
  
  DELETE flow:
    1. Check cancelled flag
    2. Dispatch onEvent DELETE → FavoritesShell removes from displayedListings + decrements liveCounts
  
  Cancellation:
    cleanup() sets cancelled=true, then removeChannel()
    In-flight INSERT fetches that complete after cleanup silently drop their result.
  
  Error observability:
    fetch error    → console.error [FavoritesRealtime] listing fetch error
    fetch miss     → console.info  [FavoritesRealtime] listing fetch miss — deleted or archived
    subscribe fail → console.error [FavoritesRealtime] subscription error
```

```
useCabinetListingsRealtime:
  Channel: cabinet-listings:user:{userId}
  Events: UPDATE, DELETE (via postgres_changes)

  UPDATE flow:
    1. RLS double-check: payload.new.user_id === userId (skip if mismatch)
    2. Extract scalar patch fields from payload.new
    3. Dispatch onEvent UPDATE → ListingsTab merges into livePatches Map
    (Images are NOT re-fetched — joined relations absent from postgres_changes payload)

  DELETE flow:
    1. RLS double-check: payload.old.user_id === userId (skip if mismatch)
    2. Graceful fallback: skip if payload.old.id absent (REPLICA IDENTITY not set)
    3. Dispatch onEvent DELETE → ListingsTab adds id to deletedIds overlay

  Cancellation:
    cleanup() sets cancelled=true, then removeChannel()

  Error observability:
    subscribe fail    → console.error [CabinetListingsRealtime] subscription error
    missing id        → console.warn  [CabinetListingsRealtime] DELETE payload missing id
    user_id mismatch  → console.warn  [CabinetListingsRealtime] user_id mismatch — skipped
```

---

## Cache Invalidation Flow

| Mutation | Caches invalidated | Method |
|---|---|---|
| `toggleFavorite` (add) | `localFavoriteIds` | `onFavoriteToggled` callback chain |
| `toggleFavorite` (remove) | `localFavoriteIds`, `displayedListings`, `liveCounts` | `onFavoriteToggled` + `handleFavoriteToggled` |
| Realtime INSERT | `displayedListings`, `liveCounts` | `onEvent` callback |
| Realtime DELETE | `displayedListings`, `liveCounts` | `onEvent` callback |
| Filter navigation | ALL SSR-L2 snapshots | RSC re-render via router.push |
| `router.refresh()` | ALL SSR-L2 snapshots for current route | RSC re-render (ViewTracker on detail pages) |
| `deleteListingAction` | `deletedIds` (UI overlay) | `handleDelete` on success |
| Realtime UPDATE (cabinet) | `livePatches` | `onEvent` callback → `setLivePatches` merge |
| Realtime DELETE (cabinet) | `deletedIds` | `onEvent` callback → `setDeletedIds` add |
| Site-stats counter | Next.js data cache tag `site-stats` | `revalidateTag('site-stats')` in transition gateway |

**Dead zones** (caches that are NOT invalidated by in-session mutations):
- `favoriteIds` / `favoriteSet` on `/listings` page — healed by `localFavoriteIds` Live-L3 state
- `typeCounts` on `/favorites` page — healed by `liveCounts` Live-L3 state
- Cabinet SSR snapshot (profile, savedSearches) — healed by navigation
- Cabinet listings scalar fields — healed by `livePatches` Live-L3 (realtime); full re-sync on navigation

---

## `router.refresh()` Interaction

`router.refresh()` is currently called ONLY by `ViewTracker` on listing detail pages
(`/[locale]/listings/[slug]`) after recording a real view. It:

1. Invalidates the Next.js router cache for the current route
2. Re-executes the server component → new SSR props delivered to all client components
3. Triggers `useEffect([favoriteIds])` in ListingsShell → re-initializes `localFavoriteIds`
4. Triggers `useEffect([isFavorited])` in FavoriteButton for any cards with changed props

**NOT called by `toggleFavorite`** — favorite changes are self-healed via the Live-L3
state layer without any server round-trip.

---

## Concurrent Rendering Safety Assumptions

### `displayedIdsRef` (FavoritesShell)
- Initialized via `useRef(initialValue)` — pure mount-time initialization, no render mutation
- Updated via `useEffect([displayedListings])` — fires after committed render only
- Stale window: between a state change and the next effect commit (microseconds)
- Safety net: `setDisplayedListings(prev => { if (prev.some(l => l.id === id)) return prev })` catches duplicates

### `onEventRef` (useFavoritesRealtime)
- Updated in effect cleanup / re-subscription (not render body)
- Always reflects the latest `onEvent` callback — async handlers see current closure

### `FavoriteButton` under concurrent rendering
- `useState(isFavorited)` is stable — not re-initialized by concurrent re-renders
- `useEffect([isFavorited])` fires after each committed prop change — safe
- `useTransition` marks server action as non-urgent — UI stays responsive during fetch

### Streaming SSR readiness
- `FavoriteButton.useEffect([isFavorited])` handles the case where `favoriteIds` arrives
  in a later streaming chunk after initial render — button re-syncs automatically
- `FavoritesShell.useEffect([initialListings])` re-syncs `displayedListings` when
  streamed props arrive — no stale display

---

## Auth Redirect Architecture (Task 281 / Task 293)

### Canonical post-login redirect param: `next`

`next` is the canonical query param for post-login redirect paths across the whole
codebase — auth callbacks, every protected-page redirect, `AuthRedirect`, and
`AuthSheet`. The name `returnTo` is NOT used anywhere. Do NOT rename to `returnTo`.

### Protected-redirect pattern: page-level SSR guards (not middleware)

Protected routes redirect unauthenticated users at the SSR layer, NOT in middleware.
Each protected page calls `getUser()` (via `createServerClient`) and calls `redirect()`
before any props or admin data reach the client.

| Route | Guard | Redirect target |
|---|---|---|
| `[locale]/cabinet` | `cabinet/page.tsx` | `/{locale}/auth/login?next=…&session=lost` |
| `[locale]/favorites` | `favorites/page.tsx` | same |
| `[locale]/listings/create` | `listings/create/page.tsx` | same |
| `[locale]/listings/[slug]/edit` | `listings/[slug]/edit/page.tsx` | same |
| `admin/*` | `admin/layout.tsx` | `/{locale}/auth/login?next=/admin&session=lost` |

### Middleware role: session refresh only (not authorization)

`src/middleware.ts` calls `refreshSession(request)` (from `src/lib/auth/middleware.ts`)
on every matched request. Its ONLY auth responsibility is to refresh expired tokens so
all downstream Server Components receive a valid session. It does NOT authorize routes
or redirect protected paths.

The `matcher` explicitly EXCLUDES `admin/*` — admin pages rely on `admin/layout.tsx`
SSR guard for authorization and on the Supabase session cookie being refreshed by
traffic on other routes. This exclusion is intentional and acceptable.

### Middleware helper location

`src/lib/auth/middleware.ts` is the canonical location for `refreshSession`.
`src/lib/supabase/middleware.ts` does NOT exist.
`src/middleware.ts` imports via `@/lib/auth/middleware`.

### `sanitizeReturnTo`: path-safety only (not an authorization check)

`sanitizeReturnTo` (`src/modules/auth/lib/sanitizeReturnTo.ts`) validates that a
`next` param is a safe same-origin relative path. It rejects: schemes, `//`,
backslashes, control chars, and path-traversal (`..` in raw and percent-encoded
forms). It does NOT check caller authorization for the destination.

Admin-path authorization after login is enforced by the destination (`admin/layout.tsx`
redirects non-admins before render) — not at redirect-time in the sanitizer. This
layered guard is the canonical design.

---

## LISTING_SELECT Single Authority

All listing card data fetches import from one place:

```
src/modules/listings/lib/listingSelect.ts → exports LISTING_SELECT
```

Consumers:
- `src/modules/listings/lib/queries.ts`
- `src/modules/listings/lib/favoritesQueries.ts`
- `src/modules/listings/hooks/useFavoritesRealtime.ts`
- `src/app/[locale]/listings/page.tsx`
- `src/app/api/listings/route.ts`

Adding a field: update `listingSelect.ts` only — all consumers update automatically.
TypeScript enforces shape compatibility with `CardListingData` at build time.

The cabinet compact select (`CABINET_LISTING_SELECT` in `cabinet/lib/queries.ts`) is
intentionally a narrower projection (no feature fields) and is managed separately.

---

## ADR-001 — Filter/Search State Architecture: URL-state vs Server state via React Query / SWR

**Date:** 2026-05-21 | **Task:** 133 (Epic E.5) | **Status:** ACCEPTED

### Context

Two architectural models are available for listings filter state:

**(a) URL-state → Server → UI (current model)**
Each filter change triggers `router.push` with updated search params. The Next.js RSC
re-renders the page server-side; `parseSearchParams` (filterEngine) normalizes params;
`applyListingFilters` applies them to the Supabase query inside the Server Component.

**(b) Client-side cache via React Query / SWR**
Filter changes update a client-side cache key. A client hook fetches `/api/listings`
directly; the grid is rendered entirely client-side. RSC is not involved in filter
transitions — only on initial page load.

### Current implementation snapshot

```
useListingsUrlFilters   → URL-immediate (each change = router.push, no draft)
useHomepageFilters      → draft batch UX (local state, Apply delegates URL nav to parent)
filterEngine.ts         → canonical parseSearchParams / applyListingFilters / countActiveFilters
                          used by BOTH the SSR page and /api/listings route (model b already exists)
```

The `/api/listings` route is already implemented (Task 50.x), so model (b) is technically
available — it just isn't the primary path for the listings page.

### Trade-off analysis

| Criterion | (a) URL → SSR | (b) React Query / SWR |
|---|---|---|
| Deep-links / shareable URLs | ✅ Native — URL is the state | ✅ If params are also mirrored in URL |
| Browser back/forward | ✅ Free via Next.js router | ⚠️ Requires manual `useSearchParams` sync |
| Streaming / RSC benefits | ✅ Used today for page shell + grid | ❌ Grid must go fully client |
| Filter transition latency | ⚠️ Full RSC round-trip (~50–150ms on edge) | ✅ Stale-while-revalidate; instant optimistic |
| filterEngine reuse | ✅ Single canonical path | ⚠️ Must also run on client for count/visibility |
| State duplication | ✅ None — URL is the only copy | ❌ URL params + client cache must stay in sync |
| Server-component composition | ✅ Works naturally | ❌ Listings grid cannot be RSC |
| Complexity delta | ✅ Zero — already built | ❌ Cache invalidation, hydration, stale logic |
| SEO / crawl | ✅ Server-rendered on every URL | ✅ (if SSR fallback is kept for robots) |
| Saved-search hash stability | ✅ URL → `filters_hash` → cron comparison is trivial | ⚠️ Hash must be derived from client state instead |

### Recommendation

**Continue with model (a) — URL-state → Server → UI. Do not adopt React Query / SWR
for the listings filter path.**

Rationale:

1. **Architecture already works.** `filterEngine.ts`, `useListingsUrlFilters`, and the
   RSC pipeline are in production and passing all governance gates. No known latency
   complaint justifies the migration cost.

2. **Next.js App Router is optimized for this pattern.** RSC streaming, partial prerender,
   and the router cache all assume URL-driven navigation as the primary signal. Moving the
   grid to a client-fetched component forfeits streaming and forces additional layout shifts.

3. **URL is the single source of truth.** Saved-search canonicalization (`filters_hash`),
   ActiveFilterChips, deep-links, and back-button behavior all derive from URL params for
   free. Model (b) would require maintaining a parallel URL-mirror on every state change.

4. **`/api/listings` already covers the valid use case.** The API route exists for
   progressive loading (page 2+ via `extraListings`) — exactly the case where a full
   RSC round-trip would be wasteful. Model (a) + progressive fetch is the correct split:
   SSR handles the first page; the API route handles subsequent pages.

5. **filterEngine duplication risk.** In model (b), `countActiveFilters` and
   `getFilterVisibility` must run on the client for badge counts / section visibility.
   They already do — but `applyListingFilters` is Supabase-query-specific and would need
   a client-safe equivalent. The current design avoids this entirely.

### When to revisit

Consider model (b) only if **both** of the following are true:
- Measured P75 filter-transition latency exceeds 400 ms on production (Vercel Edge).
- The listings grid has been extracted to a standalone route segment that renders
  independently of the page shell (enabling RSC Partial Prerender for the shell).

Until then, any performance tuning should target RSC caching (Next.js `fetch` cache tags),
not client-side state management.

### Migration implications (if (b) is ever chosen)

1. `ListingsFilterBar` and `ListingsFilters` would need a `useListings(filters)` hook
   wrapping `useQuery('listings', fetchListings, { staleTime: 30_000 })`.
2. URL synchronization: `useEffect` mirror from filter state → `router.replace` (not push,
   to avoid history bloat).
3. `filterEngine.applyListingFilters` cannot run on the client (Supabase builder). A
   parallel `buildApiQuery(filters): URLSearchParams` helper would be needed.
4. `filters_hash` for saved searches would derive from the client `FilterValues` object
   (via `savedSearchCanonicalize`) rather than directly from URL params — already the
   correct design since `savedSearchCanonicalize` normalizes both.
5. Estimated effort: 3–5 days + full regression audit across all filter consumers.
