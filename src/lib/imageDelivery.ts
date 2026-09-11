// ── Cloudinary preload helpers (server-side use only) ────────────────────────
//
// Used by page-level Server Components to emit <link rel="preload"> hints for
// the LCP candidate image. Distinct from AppImage's client-side React 19
// preload() which is skipped in SSR context (tier = 'medium' server snapshot).
//
// URL construction mirrors the gallery-main variant config in appImageConfig.ts.
// Keep in sync if the variant's srcsetBase or srcsetEntries change.

const CLOUDINARY_UPLOAD_MARKER = '/upload/'
const GALLERY_MAIN_SRCSET_BASE = 'c_fill,g_auto,f_auto,q_auto'
// Must match gallery-main srcsetEntries in appImageConfig.ts (w×h pairs)
const GALLERY_MAIN_ENTRIES = [
  { w: 640,  h: 360 },
  { w: 960,  h: 540 },
  { w: 1200, h: 675 },
  { w: 1600, h: 900 },
] as const
/** sizes must match gallery-main variant in appImageConfig.ts */
export const GALLERY_MAIN_SIZES = '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 34vw'

function insertCloudinaryTransform(src: string, transform: string): string {
  if (!src.includes('res.cloudinary.com')) return src
  const idx = src.indexOf(CLOUDINARY_UPLOAD_MARKER)
  if (idx === -1) return src
  const at = idx + CLOUDINARY_UPLOAD_MARKER.length
  return src.slice(0, at) + transform + '/' + src.slice(at)
}

/**
 * Returns href + imageSrcSet + imageSizes for a <link rel="preload" as="image">
 * pointing at the gallery-main LCP candidate. Returns null for non-Cloudinary URLs.
 *
 * Emit in a page Server Component so the browser starts fetching the LCP image
 * while still parsing the HTML, before AppImage hydrates client-side.
 */
export function buildGalleryMainPreloadAttrs(src: string | null | undefined): {
  href: string
  imageSrcSet: string
  imageSizes: string
} | null {
  if (!src || !src.includes('res.cloudinary.com')) return null
  const href = insertCloudinaryTransform(src, `w_960,h_540,${GALLERY_MAIN_SRCSET_BASE}`)
  const imageSrcSet = GALLERY_MAIN_ENTRIES
    .map(({ w, h }) => `${insertCloudinaryTransform(src, `w_${w},h_${h},${GALLERY_MAIN_SRCSET_BASE}`)} ${w}w`)
    .join(', ')
  return { href, imageSrcSet, imageSizes: GALLERY_MAIN_SIZES }
}

// ── Listing card layout contexts ──────────────────────────────────────────────
//
// Maps each real grid layout pattern to the correct `sizes` hint for the browser.
// Used by AppImage (via layoutContext prop) and ListingCard.
//
// To add a new context: add the variant name here and its sizes string to
// LISTING_LAYOUT_SIZES. Never pass raw sizes strings from components.
//
// Task 807 (D74-1..D74-4) — every card surface driven by the shared `MantineListingCardTrack`
// (`src/design-system/mantine/patterns/MantineListingCardTrack.tsx`) now passes one of the two
// `card-track-*` contexts below, derived from the track's OWN measured px geometry (Task 806
// §3.1/807 §10.3) instead of a `vw` fraction, since a `vw` fraction cannot describe an
// `auto-fill`/container-relative column at all (the column count is a function of the
// *container*, not the viewport — `ListingsShellView` proves it: the sidebar narrows the
// container at a fixed viewport width). `'default'` is kept, UNCHANGED, for the two consumers
// that are not track consumers at all: the `ListingCard.stories.tsx` `Default` story and
// `ListingsShellView`'s own horizontal list variant, which fall back to `'default'`
// (`DEFAULT_LISTING_LAYOUT_CONTEXT`, `useAdaptiveImageConfig.ts:47`). `'sidebar'` and `'4-col'`
// were removed by Task 807 — every one of their consumers (`ListingsShellView`,
// `RecentlyViewedGridView`, `SimilarListingsView`) migrated to a `card-track-*` context in that
// diff. `'3-col-xl'` was Task 807's one deliberately-deferred member (`FavoritesShell.tsx` and
// `ListingCard.stories.tsx`'s `FavoritesComposition` story, both out of Task 807's scope) — Task
// 809 (D74-11) migrates both remaining consumers to `'card-track-grid'` and removes it.

export type ListingLayoutContext =
  | 'default'         // 3-col at lg (1024px), no sidebar — FALLBACK ONLY (non-track consumers: ListingCard.stories.tsx Default, ListingsShellView's horizontal list variant)
  | 'card-track-grid' // MantineListingCardTrack mode="grid" — /listings search results (ListingsShellView), Favorites (FavoritesShell, Task 809/D74-10)
  | 'card-track-rail' // MantineListingCardTrack mode="rail" — Featured, Latest, Recently viewed, Similar

export const LISTING_LAYOUT_SIZES: Record<ListingLayoutContext, string> = {
  'default':  '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  // Grid column is `minmax(280px, 1fr)` inside `repeat(auto-fill, …)`, inside `.container-wide`
  // (`globals.css:710-720`) — a container-relative arithmetic no `vw` fraction can express (§3.3).
  // MEASURED on the real `/listings` route (Task 807 session log §13, `runs/clean-1`, real
  // production data, not the Task 806 standalone story): card width == container width below
  // 640px (320→288px, 390→358px — both exactly `viewport − 32px`, `.container-wide`'s <640px
  // gutter), then 768→352px (2 col), 1024→309.33px (3 col), 1440→316px (4 col, `.container-wide`'s
  // 1408px cap binding). `calc(100vw - 32px)` reproduces the <640px case exactly (confirmed
  // 320/390). `360px` is a safe upper bound for the ≥640px steps (max measured 352px @768) — the
  // `sizes` attribute only takes a `<length>`, so the exact per-column-count container arithmetic
  // cannot be expressed; a single ≥640px value close to the measured max avoids under-fetching
  // without moving to the next `srcsetEntries` step (400w covers every measured cell here).
  'card-track-grid': '(min-width: 640px) 360px, calc(100vw - 32px)',
  // Rail card is `min(var(--listing-card-min), 82%)` of the TRACK'S OWN CONTAINER, not the
  // viewport — `sizes` only accepts a `<length>` (no bare `%`), so `vw` is the closest available
  // unit, and MUST account for the page gutter or it overstates the card at narrow widths. MEASURED
  // (Task 807 session log §13, `runs/clean-1`): 320→236.16px = 0.82×(320−32); 390/768/1024/1440→
  // 280px (clamp maxed out at ≥390, confirmed across Featured/Latest/Similar on 3 different
  // routes — AC6). `calc(82vw - 26px)` reproduces the 320 case (0.82×32≈26.24, rounded to the
  // nearest px) and the clamp crossover (`0.82×(vw−32)=280` ⇒ `vw≈374`) sets the breakpoint.
  'card-track-rail': '(min-width: 374px) 280px, calc(82vw - 26px)',
}

// ── Priority budget ───────────────────────────────────────────────────────────
//
// Total priority images per page must not exceed MAX_PRIORITY_IMAGES to prevent
// network contention and LCP degradation. Hero text always dominates LCP since
// it is CSS-rendered and has no image competitor.
//
// Homepage budget: featured (2) + latest (1) = 3. Never exceed this.
//
// Tier override: AppImage internally skips the React 19 preload() call on LOW
// devices, reducing speculative network requests while keeping fetchPriority
// and loading="eager" for the LCP image. This enforces the effective budgets:
//   high:   up to 4 (browser's call)
//   medium: 3 (MAX_PRIORITY_IMAGES — default)
//   low:    preloads suppressed; browser still fetches prioritised images

export const MAX_PRIORITY_IMAGES = 3

export type PriorityContext = 'featured' | 'latest' | 'grid'

const PRIORITY_BUDGET: Record<PriorityContext, number> = {
  featured: 2, // first 2 premium cards in FeaturedListings section
  latest:   1, // first horizontal card in LatestListings section
  grid:     0, // listings/favorites pages — all cards are below the fold
}

export function getImagePriority(index: number, context: PriorityContext): boolean {
  return index < PRIORITY_BUDGET[context]
}
