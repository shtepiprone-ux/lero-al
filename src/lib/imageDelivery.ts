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
export const GALLERY_MAIN_SIZES = '(max-width: 768px) 100vw, 50vw'

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
 *
 * NOTE: Do NOT use imageSrcSet/imageSizes in HTTP Link response headers — the
 * comma-separated srcset values break combined header parsing (RFC 8288 quoted-
 * string commas are not respected by all CDN/proxy layers). Use
 * buildGalleryLcpPreloadHref() for HTTP Link headers instead.
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

/**
 * Returns the 640w Cloudinary variant URL for use as an HTTP Link preload href.
 *
 * Why 640w: at desktop 1280px DPR=1 with sizes="(max-width: 768px) 100vw, 50vw",
 * 50vw = 640px → browser selects the 640w srcset entry. This must match the href
 * exactly for the preload to be reused by the <img> request.
 *
 * href-only (no imagesrcset): avoids commas inside the srcset value corrupting
 * combined HTTP Link headers when mixed with hreflang alternate entries.
 */
export function buildGalleryLcpPreloadHref(src: string | null | undefined): string | null {
  if (!src || !src.includes('res.cloudinary.com')) return null
  return insertCloudinaryTransform(src, `w_640,h_360,${GALLERY_MAIN_SRCSET_BASE}`)
}

// ── Listing card layout contexts ──────────────────────────────────────────────
//
// Maps each real grid layout pattern to the correct `sizes` hint for the browser.
// Used by AppImage (via layoutContext prop) and ListingCard.
//
// To add a new context: add the variant name here and its sizes string to
// LISTING_LAYOUT_SIZES. Never pass raw sizes strings from components.

export type ListingLayoutContext =
  | 'default'   // 3-col at lg (1024px), no sidebar — FeaturedListings homepage
  | '3-col-xl'  // 3-col at xl (1280px), no sidebar — FavoritesShell
  | 'sidebar'   // 3-col at xl, w-72 sidebar at lg  — ListingsShell
  | '4-col'     // 4-col at lg (1024px), no sidebar — SimilarListings

export const LISTING_LAYOUT_SIZES: Record<ListingLayoutContext, string> = {
  'default':  '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  '3-col-xl': '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw',
  'sidebar':  '(min-width: 1280px) 28vw, (min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw',
  '4-col':    '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
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
