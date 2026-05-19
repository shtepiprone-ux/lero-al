# Task 76 — HTTP `Link` Response Header Preload for Listing Detail LCP Image

**Date:** 2026-05-19  
**Epic:** Listing Detail Performance / LCP  
**Status:** IMPLEMENTATION COMPLETE — production validation pending Vercel deployment

---

## Scope

Implement an early HTTP `Link` response header preload for the Listing Detail LCP image.  
The header is sent during TTFB, before any HTML is received, so the browser can discover  
and begin fetching the Cloudinary hero image before parsing 124KB of HTML.

**Root cause addressed (Task 75):**  
- Production HTML is ~124KB. The LCP `<img>` appears at char ~106,307 (86% through).  
- The body-position preload tag (from Task 73) is at char ~103K — only ~3KB earlier.  
- Desktop LCP: 2359–11953ms 🔴 POOR (3–4 of 4 locales).  
- Mobile LCP: 1145–1380ms 🟢 GOOD (all locales).

---

## Files Changed

| File | Change |
|---|---|
| `src/middleware.ts` | Add `Link` header injection for listing detail GET requests |
| `scripts/validate-production-lcp.mjs` | Add HTTP Link header detection + reporting |
| `scripts/profile-listing-lcp.mjs` | Add HTTP Link header detection for local validation |
| `docs/sessions/2026-05-19-listing-detail-lcp-http-link-preload.md` | This file |
| `docs/backlog.md` | Task 76 added |

---

## Implementation Mechanism

**Selected approach:** Next.js middleware (`src/middleware.ts`)

**Why middleware:**  
- Next.js App Router does not expose a supported API to set arbitrary response headers  
  from a Server Component. The only supported mechanisms are middleware and route handlers.  
- The existing middleware already runs on the Edge Runtime and makes a Supabase auth query.  
- Adding a parallel data lookup minimises TTFB overhead: both queries run concurrently.  
- Middleware sets `response.headers.set('Link', ...)` on the `NextResponse` returned by  
  `handleI18nRouting(request)`, which Vercel forwards as an HTTP response header.

**Why NOT `headers().set()` in Server Component:**  
- `import { headers } from 'next/headers'` is read-only in Next.js 15 App Router.  
  There is no supported API for setting response headers from a Server Component.

---

## Header Format

```
Link: <https://res.cloudinary.com/.../w_960,h_540,.../photo.jpg>; rel=preload; as=image; imagesrcset="...640w, ...960w, ...1200w, ...1600w"; imagesizes="(max-width: 768px) 100vw, 50vw"; fetchpriority=high
```

- `href` = 960w Cloudinary URL (fallback for browsers that don't parse `imagesrcset` in Link headers)  
- `imagesrcset` = full srcset matching `buildGalleryMainPreloadAttrs` in `imageDelivery.ts`  
- `imagesizes` = `(max-width: 768px) 100vw, 50vw` (matches gallery-main variant)  
- `fetchpriority=high` = browser priority hint (Chromium 101+ supports in Link headers)

**Desktop 1280px DPR=1:** `50vw` = 640px → browser selects 640w candidate from srcset.  
**Mobile 375px DPR=2:** `100vw × 2` = 750px → browser selects 960w candidate.

---

## How the LCP Image URL is Resolved

The middleware extracts the `slug` from the pathname via `LISTING_DETAIL_RE`.  
A minimal Supabase query fetches only the cover image URL:

```typescript
supabase
  .from('listings')
  .select('images:listing_images(url, is_cover)')
  .eq('slug', slug)
  .in('status', ['active', 'sold', 'rented', 'archived'])
  .maybeSingle()
```

- Uses anon key (public listings are readable without session).  
- `is_cover` flag identifies the hero image; falls back to first image if no cover.  
- Uses `buildGalleryMainPreloadAttrs` from `src/lib/imageDelivery.ts` to generate the  
  Cloudinary srcset URLs — same logic as the RSC page component.

---

## Failure Handling

All failure paths resolve silently — the page renders normally without the header:

- Supabase unreachable: `try/catch` returns `null`, no header set.  
- Listing not found: `.maybeSingle()` returns `null`, no header set.  
- Non-Cloudinary image: `buildGalleryMainPreloadAttrs` returns `null`, no header set.  
- Any other error: `try/catch` returns `null`, no header set.

---

## TTFB Impact

The cover image lookup runs **in parallel** with the existing `refreshSession` auth query:

```typescript
const [sessionResponse, coverUrl] = await Promise.all([
  refreshSession(request),
  slug ? fetchListingCoverUrl(slug) : Promise.resolve(null),
])
```

- TTFB increase = `max(auth_time, image_lookup_time) - auth_time`  
- Both queries are Supabase edge queries (~50ms). If lookup ≤ auth time: **0ms increase**.  
- Worst case: image lookup is slower → marginal increase.  
- Net gain from early image discovery >> any TTFB increase.

**Non-listing routes:** Pattern match is a regex test on `pathname`. If no match, `slug = null`  
and `fetchListingCoverUrl` is never called — zero overhead for all other pages.

**RSC navigation requests:** Requests with `Next-Router-State-Tree` header (App Router client  
navigation) are detected and skipped — no DB query, no header injection.

---

## Locales Covered

| Locale | Header Injection | URL Pattern |
|--------|-----------------|-------------|
| `sq` | ✅ | `/sq/listings/:slug` |
| `en` | ✅ | `/en/listings/:slug` |
| `uk` | ✅ | `/uk/listings/:slug` |
| `it` | ✅ | `/it/listings/:slug` |

---

## Breakpoints Covered

All 7 required breakpoints are covered. The header uses `imagesrcset` + `imagesizes` so  
the browser selects the correct Cloudinary candidate for each viewport and DPR:

| Breakpoint | DPR | `sizes` → selected candidate |
|---|---|---|
| 320px mobile | 2 | 100vw × 2 = 640px → **640w** |
| 375px mobile | 2 | 100vw × 2 = 750px → **960w** |
| 390px mobile | 3 | 100vw × 3 = 1170px → **1200w** |
| 768px tablet | 1 | 100vw × 1 = 768px → **960w** |
| 1280px desktop | 1 | 50vw × 1 = 640px → **640w** |
| 1440px desktop | 1 | 50vw × 1 = 720px → **960w** |
| 2560px huge | 1 | 50vw × 1 = 1280px → **1600w** |

---

## Existing Task 73 Preload Preserved

The native RSC `<link rel="preload" as="image" fetchPriority="high">` from Task 73 was  
**NOT removed**. It remains in the HTML body as a secondary signal. The HTTP `Link` header  
is the primary preload; the body preload is a fallback for environments that strip headers.

---

## Local Validation

The middleware change requires `npm run build && npm run start` for local validation  
(Edge Runtime is not available in `next dev`). The `profile:lcp` script now detects  
the `Link` response header and reports it; a missing header locally is expected  
when running against the development server but is flagged as a note, not an error.

**Commands to run for local build validation:**
```
npm run lint
npm run build
npm run profile:lcp http://localhost:3099 test-7-molyl9c8
```

---

## Production Validation (post-deploy)

After Vercel deployment, validate with:
```
npm run profile:lcp:production -- --preload-only
```

Expected output per locale:
```
HTTP 200 | Link header=✅ | rel=✅ as=✅ fp=✅ srcset=✅ cdn=✅
         | html preload=⚠️ BODY | fetchpriority=✅ high | cloudinary=✅
```

Then run full Lighthouse validation:
```
npm run profile:lcp:production
```

---

## Before / After (expected desktop improvement)

| Metric | Task 75 (before) | Task 76 (expected) |
|---|---|---|
| Desktop LCP — sq | 2410–5055ms 🔴 POOR | ~700–1200ms 🟢 GOOD |
| Desktop LCP — en | 2359–3765ms 🔴 POOR | ~700–1200ms 🟢 GOOD |
| Desktop LCP — uk | 1100–2548ms 🟡 variable | ~700–1200ms 🟢 GOOD |
| Desktop LCP — it | 5309–11953ms 🔴 POOR | ~700–1200ms 🟢 GOOD |
| Mobile LCP — all | 1145–1380ms 🟢 GOOD | ~1100–1400ms 🟢 GOOD |
| TTFB increase | — | ~0ms (parallel query) |

Expected gain: browser starts fetching 640w Cloudinary candidate (~60–80KB) during TTFB  
instead of after parsing 106KB of HTML. At Vercel warm FCP ~500–600ms, image fetch  
completes before the LCP `<img>` is even encountered in the HTML stream.

---

## Known Limitations

1. **Production validation is post-deploy**: HTTP `Link` headers are set in the Vercel  
   Edge Runtime. Local `next dev` does not run the full middleware pipeline in the same way.  
   Full validation requires a Vercel deployment.

2. **`fetchpriority` in HTTP Link headers**: Supported in Chromium 101+. Other browsers  
   may ignore this parameter but still honour `rel=preload; as=image`.

3. **RLS dependency**: The cover image lookup uses the Supabase anon key. If RLS rules  
   change to restrict `listing_images` for anon users on public listings, the header will  
   silently not be set (fail-open).

4. **Cold-start listings**: If a listing is brand new (not yet indexed by any warm edge  
   worker), the Supabase query might take slightly longer on the first request.

---

## Epic Closure Decision

**PENDING production validation.** The implementation is complete; the epic closes if:  
- All 4 locale desktop LCPs become GOOD (≤2500ms) after deployment  
- Mobile LCPs remain GOOD (≤2500ms)  
- TTFB does not increase by more than the image preload saves

If desktop LCP remains POOR after deployment, the next investigation targets:  
- Cloudinary image size / format tuning (640w candidate is ~60–80KB — consider q_60 or WebP)  
- CDN caching of Supabase edge response  
- RSC payload size reduction (124KB HTML is large; investigate RSC component boundaries)
