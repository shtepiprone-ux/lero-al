# Session Archive: Listing Detail Performance / LCP Epic — Task 73: Fix LCP Preload Reliability — 2026-05-18

## Task Summary

Task 73 fixes the LCP image preload reliability issue found in Task 72.
- **Before:** React 19 `preload()` deduplicated image URLs across SSR requests — only 1 of 4 locales
  received `<link rel="preload" as="image">`, non-deterministically. No `fetchpriority`.
- **After:** All 4 locales receive a preload hint with `fetchpriority="high"` on every request.

No visual behavior changed. No UI layout affected. Governance rules enforced.

---

## Files Changed

| File | Change |
|---|---|
| `src/app/[locale]/listings/[slug]/page.tsx` | Removed `import { preload } from 'react-dom'`; removed `preload()` call; added native `<link rel="preload" as="image" fetchPriority="high">` JSX element |
| `scripts/profile-listing-lcp.mjs` | Updated profiler to check HEAD and BODY; added `fetchpriority`, `href`, `imageSrcSet` detection; updated summary and issue messages |
| `docs/backlog.md` | Task 73 CLOSED; Task 74 queued |
| `docs/sessions/2026-05-18-listing-detail-lcp-preload-reliability.md` | This session log |

---

## Implementation Summary

### Removed (React 19 `preload()` call)

```tsx
// BEFORE — deduplicated across requests in same worker:
import { preload } from 'react-dom'

if (galleryPreload) {
  preload(galleryPreload.href, {
    as: 'image',
    imageSrcSet: galleryPreload.imageSrcSet,
    imageSizes: galleryPreload.imageSizes,
  })
}
```

### Added (native RSC `<link>` element)

```tsx
// AFTER — per-request, no deduplication:
{galleryPreload && (
  <link
    rel="preload"
    as="image"
    href={galleryPreload.href}
    imageSrcSet={galleryPreload.imageSrcSet}
    imageSizes={galleryPreload.imageSizes}
    fetchPriority="high" // eslint-disable-line no-restricted-syntax -- fetchPriority on <link rel="preload"> is intentional; governance rule targets <img> bypass only
  />
)}
```

The `eslint-disable-line` is required because the project's image governance rule
(`no-restricted-syntax`) catches all `fetchPriority` JSX attributes to prevent raw `<img>` usage.
This `<link>` is a preload hint, not an image element — the disable is intentional and documented.

---

## Locales Covered

| Locale | Preload present | fetchpriority | Location |
|---|---|---|---|
| `sq` | ✅ Yes | ✅ high | ⚠️ BODY |
| `en` | ✅ Yes | ✅ high | ⚠️ BODY |
| `uk` | ✅ Yes | ✅ high | ⚠️ BODY |
| `it` | ✅ Yes | ✅ high | ⚠️ BODY |

All 4 locales now receive a preload hint on every request. Deduplication bug eliminated.

---

## Breakpoints Covered

Preload behavior is HTML-level and viewport-independent. The same HTML (and thus the same
preload behavior) is served for all breakpoints 320–2560px+.

---

## URLs Tested

| Locale | URL |
|---|---|
| sq | `http://localhost:3101/sq/listings/test-7-molyl9c8` |
| en | `http://localhost:3101/en/listings/test-7-molyl9c8` |
| uk | `http://localhost:3101/uk/listings/test-7-molyl9c8` |
| it | `http://localhost:3101/it/listings/test-7-molyl9c8` |

---

## Before / After Preload Behavior

| Metric | Before (Task 72) | After (Task 73) |
|---|---|---|
| Preload present — sq | ✅ (1/4 locales, non-deterministic) | ✅ All 4 |
| Preload present — en | ❌ | ✅ |
| Preload present — uk | ❌ | ✅ |
| Preload present — it | ❌ | ✅ |
| `fetchpriority="high"` on preload | ❌ Missing (React 19 limitation) | ✅ Present |
| Preload location | HEAD (for 1 locale) | BODY (all locales — see limitation) |
| `<img fetchPriority="high">` in SSR | ✅ (unchanged) | ✅ (unchanged) |
| Cloudinary srcset coverage | ✅ (unchanged) | ✅ (unchanged) |
| React `preload()` deduplication | ❌ Active (bug) | ✅ Eliminated |

---

## Preload Location — Known Limitation

The preload link appears in `<body>`, not `<head>`.

**Reason:** React 19's `<link>` hoisting is a **client-side (post-hydration) operation**. During
SSR, the `<link>` element is rendered as part of the page body (in the RSC payload). The browser
only moves it to `<head>` after JavaScript hydrates and React reconciles the DOM. This means:

- The browser discovers the preload hint when it reaches the body content (after head)
- The optimal case (browser discovers preload during `<head>` parsing) is NOT achieved
- BUT: the preload still fires before the `<img>` is encountered further down the page

**For true `<head>` preload**: inject the hint via HTTP `Link` response headers using Next.js
middleware. HTTP headers arrive before any HTML, and browsers treat `Link: <url>; rel=preload`
headers identically to `<link rel="preload">` in the document `<head>`. This is Task 74.

---

## React 19 `preload()` — Why It Was Removed

1. **Worker-level deduplication**: `preload()` tracks URLs in a module-level singleton. Once any
   request registers a URL as "preloaded", all subsequent requests in the same worker skip it.
   Result: only 1 locale per worker lifetime gets the preload hint.

2. **No `fetchpriority` support**: React 19's `preload()` API doesn't accept a `fetchpriority`
   option for image resources. The generated `<link>` tag has no `fetchpriority` attribute.

The native RSC `<link>` element avoids both issues. Each request renders fresh JSX, so the
`<link>` is emitted per-request. And `fetchPriority="high"` is a standard JSX prop that React
passes through to the HTML output.

---

## AppImage / Hero Image Verification

`GalleryStaticFrame` (Server Component) behavior is UNCHANGED:
- `<img fetchPriority="high" loading="eager" srcSet="..." sizes="...">` ✅ Present in SSR HTML
- All 4 locales: ✅
- Cloudinary srcset (640/960/1200/1600w): ✅

---

## Profiling Results (Task 73 build)

```
<link rel="preload" as="image"> in ALL locales : ✅
  Preload in <head> (all)                      : ❌ (body only — known limitation)
fetchpriority on preload in ALL locales        : ✅
<img fetchPriority="high"> in ALL locales      : ✅
```

---

## Validation Results

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 6 warnings (unchanged) |
| `npm run build` | ✅ PASS |
| `npm run profile:lcp` | ✅ All 4 locales: preload present + fetchpriority high |
| `npm run governance` | ✅ PASS — all 5 categories within baseline |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run governance:components` | ✅ PASS |
| `npm run typecheck` | ⚠️ Pre-existing test-file errors only (confirmed `aa809a2`) |

**Task 73 introduced zero new lint violations.**

---

## Recommended Task 74

**Move preload hint from `<body>` to true `<head>` via HTTP `Link` response headers**

Use Next.js middleware to inject `Link: <https://res.cloudinary.com/...>; rel=preload; as=image; fetchpriority=high` as an HTTP response header for listing detail pages. HTTP headers arrive before any HTML parse, making this the strongest possible preload signal.

**Implementation sketch:**
```ts
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // For listing detail pages: extract slug, query Cloudinary URL from edge cache or KV store
  // Then set: res.headers.set('Link', `<${lcpImageUrl}>; rel=preload; as=image; fetchpriority=high`)
  return res
}
```

**Challenge:** The middleware doesn't have access to the listing cover image URL (it would require
a database query or edge cache lookup). The most practical approach:
1. Use a KV store (Vercel KV / Upstash) caching `slug → cover_image_url`
2. Populate the cache on listing create/update
3. Middleware reads from cache and sets the Link header

**Simpler alternative for Task 74:** Profile the current Task 73 state with actual Lighthouse
traces (mobile + desktop) to measure LCP improvement before investing in the HTTP header approach.
This determines whether body-position preload is sufficient or whether head-position preload is
worth the added complexity.
