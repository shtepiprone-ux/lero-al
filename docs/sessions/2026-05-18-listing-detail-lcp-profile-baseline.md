# Session Archive: Listing Detail Performance / LCP Epic — Task 72: LCP Profiling Baseline — 2026-05-18

## Task Summary

Task 72 establishes the measurable LCP baseline for the Listing Detail page before any optimization.
Analysis was performed via static code inspection + live HTML probe of the production build
(`npm run start`) against real Supabase data.

**No production code changes were made in this task. Profiling only.**

---

## Scope

- **Page:** `/[locale]/listings/[slug]` — Listing Detail
- **Method:** Production build (`npx next start`) + HTTP HTML inspection + static code analysis
- **Profiling script:** `scripts/profile-listing-lcp.mjs`

---

## Locales Covered

| Locale | URL tested | HTTP status |
|---|---|---|
| `sq` | `/sq/listings/test-7-molyl9c8` | 200 ✅ |
| `en` | `/en/listings/test-7-molyl9c8` | 200 ✅ |
| `uk` | `/uk/listings/test-7-molyl9c8` | 200 ✅ |
| `it` | `/it/listings/test-7-molyl9c8` | 200 ✅ |

---

## Responsive Breakpoints

Preload behavior is **HTML-level** (viewport-independent). The same HTML is served regardless of
viewport. LCP *timing* varies by viewport due to CSS rendering and image DPR selection.

| Breakpoint | Notes |
|---|---|
| 320px mobile | `<img>` present in SSR HTML at all breakpoints ✅ |
| 375px / 390px mobile | same |
| 768px tablet | `gallery-main` variant: 50vw image |
| 1280px / 1440px desktop | `gallery-main` variant: 50vw in 2-column layout |
| 1920px / 2560px huge | same layout, larger DPR selection from srcset |

For full Lighthouse LCP timing per breakpoint, run:
```
node scripts/profile-listing-lcp.mjs http://localhost:3000 test-7-molyl9c8
npx lighthouse http://localhost:3000/sq/listings/test-7-molyl9c8 --emulated-form-factor=mobile --view
```
(requires `npx playwright install chromium` for Playwright-based profiling)

---

## URLs Tested

**Test listing:** `test-7-molyl9c8`
- Title: "Test #Latest"
- Status: `active`
- Cover image: `https://res.cloudinary.com/die7okukn/image/upload/v1777582272/listings/sjgsrzdwrq6syebuukjf.jpg`
- Cloudinary-backed: ✅ (required for srcset transform + preload)

The listing was retrieved from Supabase (the live database) and is the highest-views active
listing available. It has a Cloudinary cover image, making it representative of the production LCP path.

---

## Commands Run

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 6 warnings |
| `npm run build` | ✅ PASS |
| `npm run governance` | ✅ PASS |
| `npx next start -p 3099` | ✅ Production server started |
| `node scripts/profile-listing-lcp.mjs http://localhost:3099 test-7-molyl9c8` | ✅ Run — see findings |
| HTTP probe of all 4 locale URLs | ✅ 200 on all locales |

---

## LCP Architecture (Code Analysis)

### GalleryStaticFrame (Server Component)
- Renders the cover `<img>` with `fetchPriority="high"` and `loading="eager"` in the SSR HTML
- Image is in the `<body>`, after all `<head>` scripts
- Purpose: provide an immediately-paintable LCP candidate before the interactive GalleryIsland hydrates
- Confirmed present in HTML for all 4 locales ✅

### React 19 `preload()` call (in `ListingPage`)
- Calls `preload(href, { as: 'image', imageSrcSet, imageSizes })` from `react-dom`
- Intended to emit `<link rel="preload" as="image">` early in `<head>`
- **Both findings below are confirmed bugs (see below)**

### GalleryIsland
- `ssr: false` — does NOT block initial HTML or LCP
- Loads the interactive gallery lazily after initial paint ✅

### LazyListingContact
- `ssr: true` — renders in SSR but in a separate JS chunk (lazy-loaded)
- Runs parallel data fetching (owner + listing) ✅

---

## Preload Findings — CRITICAL ISSUES

### Issue 1: React 19 `preload()` deduplication persists across SSR requests

**Severity: HIGH — affects 3 of 4 locales on every server restart**

The `preload()` function from `react-dom` maintains a deduplication set at the
**worker/module level** rather than the request level. When the first request to any
listing detail page is processed, the image URL is registered as "already preloaded".
All subsequent requests — including other locales with the SAME image URL — silently
skip emitting the `<link rel="preload">` hint.

**Observed behavior (confirmed across two separate profiling runs):**
- Run 1: `sq` got the preload; `en`, `uk`, `it` did not
- Run 2: `en` got the preload; `sq`, `uk`, `it` did not
- The "winning" locale rotates based on which request is processed first after a server restart

**Impact:** 3 out of 4 locales serve listing detail pages WITHOUT an early image preload hint.
Without the hint, the browser discovers the LCP image only when it reaches the `<img>` tag
in the body — AFTER parsing all head content (stylesheets + async scripts). This adds
latency to the LCP fetch start time for 75% of locale traffic.

**Root cause:** `react-dom`'s `preload()` uses a module-level singleton set to deduplicate
URLs across renders. In a long-running Next.js server with multiple workers, each worker may
behave differently. In a single-process production server, only the FIRST request with a
given image URL ever emits the preload hint.

**Fix recommendation:** Replace `preload()` with a native `<link rel="preload">` element
rendered in the RSC page tree (not via the React resource API). Next.js hoists `<link>` tags
from Server Components into `<head>`. Since each request produces a fresh RSC render, the
preload link is emitted on every request independently — no deduplication issue.

---

### Issue 2: `fetchpriority="high"` absent from preload link

**Severity: MEDIUM**

The `<link rel="preload" as="image">` tag emitted by React 19's `preload()` does NOT include
`fetchpriority="high"`. The React 19 `preload()` API has no `fetchpriority` option for image
resources.

**Observed HTML:**
```html
<link rel="preload" as="image"
  imageSrcSet="...640w, ...960w, ...1200w, ...1600w"
  imageSizes="(max-width: 768px) 100vw, 50vw"/>
```
Note: no `fetchpriority` attribute.

**Impact:** The browser starts fetching the image early (preload hint exists for the one lucky
locale), but at **normal priority** — not high. The `<img fetchPriority="high">` in
GalleryStaticFrame is correct, but the browser prioritizes the actual `<img>` fetch only when
it encounters the tag in the body. The preload hint's missing `fetchpriority` means the browser
may not aggressively deprioritize other resources in favor of the LCP image.

**Fix recommendation (same fix as Issue 1):** Emit a native `<link rel="preload" as="image" fetchpriority="high">` element from the RSC page. This gives full control over all link attributes.

---

## `<img>` in Body — Findings

| Finding | Value |
|---|---|
| `<img fetchPriority="high" loading="eager">` present | ✅ All 4 locales |
| Image URL is Cloudinary | ✅ (srcset transforms applied) |
| `srcSet` with 4 breakpoints (640/960/1200/1600w) | ✅ |
| Image appears before first `<script>` tag | ❌ Image is in `<body>`, scripts are in `<head>` |

The `<img>` appears in the body, after the async scripts in `<head>`. Since the scripts are
`async`, they don't block parsing — the browser's preload scanner WILL discover the `<img>`
early. However, the preload scanner has lower reliability for images discovered via `<img>`
vs. `<link rel="preload">`, especially on mobile CPUs with slower HTML parsing.

---

## ListingBackButton Findings

**Severity: LOW — unlikely to affect LCP directly**

```tsx
useEffect(() => {
  window.scrollTo(0, 0)           // compositor operation
  sessionStorage.getItem(key)      // synchronous
}, [])
```

- `useEffect` runs POST-hydration, NOT during initial paint — LCP is already measured before this runs
- `window.scrollTo(0, 0)` triggers a compositor operation (scroll position) but does NOT cause layout recalculation and should not affect the LCP element
- `sessionStorage.getItem()` is synchronous but in a microtask-deferred effect — no blocking on the main thread during LCP window

**Conclusion:** `ListingBackButton` is NOT a primary LCP bottleneck. It contributes to post-LCP
hydration work but not to LCP timing directly.

**Secondary concern:** The `<button>` element in `ListingBackButton` is a raw `<button>` (already
documented as governance debt). This doesn't affect performance.

---

## AppImage / Hero Image Findings

The LCP image in Listing Detail is NOT served via `<AppImage>` — it is served via a raw `<img>`
in `GalleryStaticFrame` (a deliberate exception to the image governance rule). This is intentional:

- `<AppImage>` is a `'use client'` component and would add to the hydration bundle
- `GalleryStaticFrame` renders a plain Server Component `<img>` — zero JS, immediately paintable
- `GalleryStaticFrame` uses the same Cloudinary srcset transforms as the `gallery-main` variant
- `fetchPriority="high"` and `loading="eager"` are correctly set

**This design is correct.** The issue is the unreliable `<link rel="preload">` hint (Issues 1 & 2
above), not the image element itself.

---

## LCP Waterfall Analysis (Static)

Based on code analysis, the current LCP waterfall for listing detail is:

```
Client connects
→ TTFB (Supabase query: listing + auth + exchange rates, parallelized)
→ HTML starts streaming
  → <head> parsed:
    → [sq only, non-deterministic] <link rel="preload" as="image"> (no fetchpriority)
    → async <script> tags loaded (non-blocking)
    → <link rel="preconnect" href="res.cloudinary.com"> ← good
  → <body> parsed:
    → gallery-static-frame → <img fetchPriority="high" loading="eager"> ← LCP candidate
    → Cloudinary CDN delivers image
→ LCP paint
→ React hydration begins (Header, FavoriteButton, ListingBackButton, GalleryIsland)
```

**Key waterfall problem:** The image fetch COULD start at `<head>` parse time (via the
preload hint) but only does so for 1 of 4 locales non-deterministically. For the other 3
locales, the image fetch starts at `<body>` parse time, adding the head-parse delay (~100-300ms
on mobile) to the LCP time.

---

## Limitations

1. **No Lighthouse LCP timing data** — `npx playwright install chromium` was not run. Full
   LCP timing (5339–5523ms from backlog notes) is from a prior manual Lighthouse run. The
   current profiling establishes the HTML structure baseline, not live timing.

2. **Single listing tested** — `test-7-molyl9c8` is a test listing. Production listings may
   have different image sizes, more images, or longer Supabase query times. The preload/img
   structure would be identical.

3. **No Lighthouse trace analysis** — cannot identify which specific long task delays the
   compositor without a live trace. The `scripts/profile-listing-lcp.mjs` script documents
   the Lighthouse commands needed.

---

## Validation Results

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 6 warnings (pre-existing) |
| `npm run build` | ✅ PASS |
| `npm run governance` | ✅ PASS (all 5 categories) |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS |
| `npm run governance:components` | ✅ PASS |
| `node scripts/profile-listing-lcp.mjs` | ✅ Script runs, findings documented |
| `npm run typecheck` | ⚠️ Pre-existing test-file errors only (aa809a2 baseline) |
| `npm run test` | ⚠️ Pre-existing: 3 failed / 6 passed (aa809a2 baseline) |

Zero new lint violations introduced by Task 72.

---

## Recommended Task 73

**Fix the `<link rel="preload" as="image" fetchpriority="high">` reliability**

**Scope:** Replace `preload()` from `react-dom` in `ListingPage` with a native `<link>` element
rendered in the RSC page tree. Next.js hoists RSC `<link>` tags into `<head>` on every request,
without the deduplication side-effect of the React resource API.

**Expected result:**
- All 4 locales (`sq`, `en`, `uk`, `it`) get `<link rel="preload" as="image" fetchpriority="high">` in `<head>`
- Browser starts fetching the LCP image at HTML parse time (head) rather than body parse time
- Estimated improvement: 100–400ms LCP on mobile (eliminates the head-parse delay before image fetch start)

**Implementation sketch:**
```tsx
// In ListingPage (Server Component)
// Replace:
if (galleryPreload) {
  preload(galleryPreload.href, { as: 'image', imageSrcSet: ..., imageSizes: ... })
}

// With:
// Return the <link> tag as part of the JSX (Next.js hoists it to <head>)
{galleryPreload && (
  <link
    rel="preload"
    as="image"
    href={galleryPreload.href}
    imageSrcSet={galleryPreload.imageSrcSet}
    imageSizes={galleryPreload.imageSizes}
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- fetchpriority is not yet in React's HTMLLinkElement types
    fetchpriority="high"
  />
)}
```

Then verify with `node scripts/profile-listing-lcp.mjs` that ALL locales now emit the preload hint.
