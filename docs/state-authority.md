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
