# Sprint 17 — Task 279 kickoff (Fix favorite heart state sync across listing cards — collection-aware)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read per `docs/rule-index.md` — **"UI / layout / component" + "DB / server action / RLS" bundle** (mixed). No scope change; STOP & ASK if ambiguous; literal AC; self-validate; UI task → ×4 locales + 7 breakpoints. Owner runs git; executor never runs git.

---

## Task 279 — Fix favorite heart state sync (collection-aware)

```
Hard contract: see top.

Type:        bugfix
Priority:    high
Area:        favorites / collections / listing cards / Home / Listings / Favorites pages

GOAL: Fix the bug where a listing already saved in Favorites (and in at
least one collection) appears with an EMPTY heart icon on listing cards
outside the Favorites page (Home Premium section, Home Latest section,
Listings page). The heart icon is driven by stale local state instead
of the actual persisted favorite state.

Required after-state: a listing is "favorited" if and only if it exists
in at least ONE of the current user's favorite collections (collection-
aware semantics). The heart icon reflects this state correctly on every
listing card surface, after refresh, after navigation, after locale
switch, after optimistic toggle, and after failed-toggle rollback.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 from owner-uploaded
issues.txt §6.

Pre-read (UI + DB/RLS bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/ui-rules.md
- docs/component-rules.md
- docs/qa-rules.md
- docs/data-access-rules.md
- docs/rls-rules.md       → favorites + collections RLS (already
                             established in Epics F + P).
- docs/domain-rules.md    → favorites / collections semantics
- docs/state-authority.md → SSR vs client state for the favorite flag
                             on listing cards; this task is one of the
                             surfaces where SSR-initial-state matters.
- docs/ai-behavior.md     → Note 14 (Global Change — fix every surface,
                             not just one), Note 19 (UX Flow), Note 20
                             (Existing-Control Preservation — heart
                             button stays; only its initial state is
                             corrected).
- src/modules/favorites/ — favorites + collections actions + hooks
- src/components/listing/FavoriteButton.tsx (or equivalent — confirm via grep)
- src/components/listing/ListingCard.tsx
- src/app/[locale]/page.tsx — Home page server entry
- src/app/[locale]/listings/page.tsx — Listings page server entry
- src/app/[locale]/favorites/page.tsx — Favorites page server entry
- Epic F + Epic P closed summaries (favorites + guest-auth) for
  domain context.

Current behavior to preserve:
- Heart button click → optimistic toggle (add/remove from default
  collection) → server action → on success, persist; on failure, roll
  back. PRESERVED.
- Favorites page collection cards / tabs / lists / CRUD (Task 212 +
  related) — UNCHANGED.
- Premium / Latest / Listings card layouts — UNCHANGED.
- Listing detail favorite button — UNCHANGED.
- Unauthenticated user behavior (existing login prompt / modal / toast /
  redirect — whatever exists today) — UNCHANGED.
- Existing RLS policies on `favorites`, `collections`, `collection_items` —
  UNCHANGED unless investigation surfaces a real RLS bug (then STOP & ASK).
- Existing collection-creation flow (Task 212 inline create) — UNCHANGED.
- Listing card click navigation, image, price, location, badges — UNCHANGED.

Required after behavior:

1. NEW or FIXED canonical favorite-state-loader at
   `src/modules/favorites/lib/loadUserFavoriteListingIds.ts` (or wherever
   the project's data-access convention puts shared loaders — confirm
   via grep):
   - Signature:
     ```ts
     async function loadUserFavoriteListingIds(supabaseServer): Promise<Set<string>>
     ```
   - For authenticated user: returns a Set of listing IDs that appear in
     AT LEAST ONE of the user's collection_items rows (semantic:
     "favorited = in ≥1 collection").
   - For anonymous user: returns an empty Set.
   - Uses ONE query (joining `collections` → `collection_items`) — not
     per-card N+1 queries.
   - Server-side only (consumes the SSR Supabase client).

2. Wire `loadUserFavoriteListingIds` into:
   - Home page `src/app/[locale]/page.tsx` (server) — load once;
     pass into BOTH `<PremiumListings>` and `<LatestListings>`.
   - Listings page `src/app/[locale]/listings/page.tsx` (server) — load
     once; pass into the listings grid.
   - Listing detail page `src/app/[locale]/listings/[slug]/page.tsx`
     (server) — load the single-listing favorite state (or load all and
     check; either is acceptable — match the existing pattern).
   - Favorites page already correctly resolves favorite state (it's the
     source surface); verify it still works.

3. Pass `favoritedListingIds` (a `Set<string>` or equivalent) into
   listing card grids. Each `<ListingCard>` receives an `initialIsFavorited: boolean`
   prop derived from `favoritedListingIds.has(listing.id)`.

4. `<ListingCard>` / `<FavoriteButton>`:
   - Initial state: `useState(initialIsFavorited)` instead of `useState(false)`.
   - Heart icon: filled when `isFavorited === true`; empty otherwise.
   - Toggle: optimistic. On click:
     - If `isFavorited === true`: setIsFavorited(false) → call
       `removeListingFromAllCollections(listingId)` server action → on
       success, persist; on failure, setIsFavorited(true) (rollback) +
       toast existing error.
     - If `isFavorited === false`: setIsFavorited(true) → call
       `addListingToDefaultCollection(listingId)` server action → on
       success, persist; on failure, setIsFavorited(false) (rollback) +
       toast.
   - The server actions: ensure no duplicate row creation. Use upserts
     OR pre-check existence + insert. Match the existing pattern from
     Epic F / Task 212.
   - No N+1 favorite-state queries per card.

5. Cross-surface consistency:
   - Same listing on Home Premium AND Home Latest renders with the
     same heart state (both derive from the same `favoritedListingIds`
     set).
   - On the Listings page, the same listing renders with the same heart
     state.
   - On the Favorites page, every listing is favorited by definition;
     heart always filled.

6. NEW or FIXED collection-removal semantics:
   - If a listing is in COLLECTIONS A + B and the user un-clicks the
     heart, the listing must be removed from BOTH (collection-aware:
     "favorited" means "in ≥1 collection", so to unfavorite, must
     remove from all).
   - OR: if existing project semantics treat "unfavorite" as "remove
     from default collection only" → STOP & ASK. The user's stated
     spec in issues.txt §6.5 is: "Removing listing from all favorite
     collections → heart becomes unselected." Default behavior should
     match this. Verify against existing implementation.

7. NO new locale keys (this is a bugfix; existing toast/error messages
   reused). If a NEW message is genuinely needed, add to all 4 locales.

8. Optimistic UI safety:
   - Failed toggle rolls back to PREVIOUS state.
   - No duplicate `favorites` or `collection_items` rows ever created
     (server actions guard via upsert OR `IF NOT EXISTS` check).
   - Double-click rapid: existing debounce / disabled-during-pending
     pattern preserved.

Positive flow (happy path) — listing already favorited:
- Authenticated user with listing A in collection "Investment".
- User navigates to Home page → `loadUserFavoriteListingIds(...)`
  returns `Set { 'A' }` → Premium section + Latest section both render
  listing A's card with filled heart.
- User navigates to /listings → same `loadUserFavoriteListingIds(...)`
  returns `Set { 'A' }` → listing A's card has filled heart.
- User refreshes the page → heart still filled (server-side re-renders
  with the same set).
- User opens listing A's detail page → heart filled.
- User opens /favorites → listing A is in the list, heart filled (as
  always).

Positive flow (happy path) — toggle from empty:
- Anonymous heart on Home Premium listing B.
- Authenticated user clicks → optimistic fill → server call
  `addListingToDefaultCollection('B')` succeeds → row persisted.
- User refreshes → heart still filled (server state matches).

Positive flow (happy path) — toggle from filled:
- Authenticated user clicks filled heart on listing A (in collection
  "Investment").
- Optimistic empty → server call `removeListingFromAllCollections('A')`
  succeeds → all collection_items rows for listing A + this user
  deleted.
- User refreshes → heart still empty.

Negative flow (every off-happy-path branch):
- **Unauthenticated user clicks heart** — existing prompt/redirect (whatever exists today) fires; no state change client-side; no server call.
- **Network failure on add** — optimistic filled rolls back to empty; toast existing error key.
- **Network failure on remove** — optimistic empty rolls back to filled; toast existing error key.
- **Server returns success but listing was already in collection (duplicate)** — server-side: upsert OR `IF NOT EXISTS`; no duplicate row; client sees success.
- **Server returns success on remove but listing was already not in any collection (idempotent)** — no error; heart already empty.
- **Same listing visible on Home Premium AND Home Latest, user clicks heart on Premium card** — both card instances must update. **STOP & ASK** if the card instances do not share state via a parent context; the simple approach is per-card local state, in which case the Premium card updates immediately and the Latest card updates on next render/navigation. If a parent-state pattern exists, use it. Document the decision.
- **Listing soft-deleted** — favorite still possible (existing semantics; no change).
- **Collection deleted while listing is in it** — listing's collection_items rows removed via CASCADE (existing schema); next favorite-state load returns the listing as not-favorited.
- **Rapid double-click** — disabled-during-pending or debounced (existing pattern); one server call per gesture.
- **RLS rejects a select** — `loadUserFavoriteListingIds` returns empty Set defensively + Sentry breadcrumb; no error to user; hearts render empty. (Defense-in-depth — should not happen if RLS is correct.)
- **Anonymous user on a page with cards** — `loadUserFavoriteListingIds` returns empty Set; all hearts empty; click triggers existing login prompt.
- **Locale switch mid-page** — server re-renders; favorite state preserved (same set query); hearts unchanged.
- **Refresh mid-pending-toggle** — optimistic state lost on refresh; server-side state reflects last-persisted truth; that's the right behavior.
- **Listing in 2 collections, user removes from collection X (via Favorites page UI), then opens Home Premium** — heart on Home Premium still filled (listing still in collection Y). On refresh, same. (Verifies collection-aware semantic.)
- **Listing in 2 collections, user removes from collection X AND Y (both via Favorites page UI), opens Home Premium** — heart empty (no collections contain it).
- **Mobile 320px walked**; **All 7 breakpoints**.

Required investigation (paste outputs in session log):

1. Locate the heart component + its props:
   ```
   grep -rln "FavoriteButton\|favoriteButton\|HeartIcon\|isFavorite\|isFavorited" src/ --include="*.tsx" 2>/dev/null
   ```

2. How is favorite state currently fetched per surface?
   ```
   grep -rn "isFavorite\|loadFavorites\|listFavorites\|getUserFavorites" src/modules/favorites src/app 2>/dev/null
   ```

3. Confirm the schema: `favorites` vs `collection_items` table model:
   ```
   grep -E "favorites|collection_items|collections" src/types/database.ts | head -20
   ```

4. Confirm the add/remove server actions:
   ```
   grep -rn "addListingToCollection\|removeListingFromCollection\|toggleFavorite\|addToCollection" src/modules/favorites 2>/dev/null
   ```

5. Confirm card props:
   ```
   grep -n "isFavorited\|isFavorite\|favoriteId\|collectionIds" src/components/listing/ListingCard.tsx
   ```

6. Check whether SSR currently passes any favorite state into cards:
   ```
   grep -rn "initialIsFavorited\|userFavoriteIds\|favoritedListingIds" src/ 2>/dev/null
   ```
   If zero hits — this is the root cause (no SSR-side favorite-state plumbing exists; cards default to `false`).

7. Check whether a single source of truth or per-card N+1 queries:
   ```
   grep -rn "supabase.from('collection_items')\|from('favorites')" src/components/listing src/modules/listings 2>/dev/null
   ```
   If found per-card — STOP & ASK whether to refactor in this task or
   file as follow-up.

Scope (files Sonnet may touch):

1. `src/modules/favorites/lib/loadUserFavoriteListingIds.ts` — NEW (or fix existing equivalent).
2. `src/app/[locale]/page.tsx` — wire the loader.
3. `src/app/[locale]/listings/page.tsx` — wire the loader.
4. `src/app/[locale]/listings/[slug]/page.tsx` — wire the loader (single-listing case).
5. `src/modules/home/components/PremiumListings.tsx` (or equivalent — propagate `favoritedListingIds`).
6. `src/modules/home/components/LatestListings.tsx` (same).
7. `src/modules/listings/components/ListingsGrid.tsx` (or equivalent — propagate).
8. `src/components/listing/ListingCard.tsx` — accept `initialIsFavorited` prop.
9. `src/components/listing/FavoriteButton.tsx` — derive initial state from prop.
10. `src/modules/favorites/actions/*.ts` (if duplicate-row guard or idempotency fix needed).
11. `docs/backlog.md` — standard task-closure update.
12. `docs/sessions/2026-05-28-task-279-favorite-heart-sync.md` — NEW session log per Task 264.

Out of scope (do NOT touch):
- Listing card design.
- Favorites page collection UI (collection cards, tabs, CRUD, empty states).
- New collection creation flow (Task 212).
- Listing detail page layout.
- Premium / Latest section queries.
- RLS policies (unless investigation proves an RLS bug; then STOP & ASK).
- Adding new analytics for favorite clicks.
- The Instagram-like collection picker after heart click (Task 286 spec will cover this — separate work).
- Renaming routes.
- Saving comparison data, notes, statuses (Pro/Expert features per Task 286 spec).

Acceptance criteria (literal):
- A listing in ≥1 collection shows filled heart on Home Premium, Home Latest, Listings, Favorites, AND listing detail.
- A listing in 0 collections shows empty heart everywhere.
- Selected heart state persists after: refresh, navigate-away-and-back, locale switch, authenticated session restore.
- Optimistic toggle: success persists; failure rolls back to PREVIOUS state.
- No duplicate `favorites` OR `collection_items` rows created (verifiable via grep on the server-action implementation + manual test of double-click).
- Removing a listing from one of multiple collections does NOT unselect the heart on other surfaces (heart still filled because listing is in ≥1 collection).
- Removing a listing from ALL collections DOES unselect the heart on all surfaces.
- Unauthenticated users: existing behavior preserved.
- All existing favorites collection functionality on the Favorites page works.
- Existing listing card layout unchanged (only initial heart state corrected).
- No N+1 favorite queries (one query per page, batched).
- All 7 breakpoints walked.
- Note 18 self-validation block + Note 20 listing-card before/after inventory in session log.
- "Files Changed" table per Task 264 (10-12 paths).
- `tsc=0` errors; lint clean; build passes.

Final report required from Sonnet:
1. Files Changed table.
2. Root cause statement (1 paragraph).
3. Favorite data model summary (favorites vs collection_items vs collections — which is the source of truth).
4. Before/after for the FavoriteButton initial-state derivation.
5. Cross-surface verification: 5 surfaces (Home Premium, Home Latest, Listings, Favorites, listing detail) each tested with a listing in ≥1 collection + a listing in 0 collections.
6. Collection-aware semantic verification: listing in 2 collections → remove from 1 → heart stays filled.
7. Optimistic-rollback verification (force a failure: e.g. offline mode).
8. No-duplicate-row verification (double-click + check DB).
9. Note 18 self-validation verdict line.
10. Confirmation that Favorites page collection UI is unchanged.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
change Favorites page collection UI. Do NOT introduce the Instagram-like
picker (Task 286 spec covers it). Do NOT add new analytics events.
```
