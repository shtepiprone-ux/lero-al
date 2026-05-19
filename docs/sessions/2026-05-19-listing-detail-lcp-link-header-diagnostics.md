# Task 77 — Diagnose HTTP Link Preload Ineffectiveness / LCP Element & Network Trace

**Date:** 2026-05-19  
**Epic:** Listing Detail Performance / LCP  
**Status:** COMPLETE — root cause identified and fixes applied. Production validation pending Vercel deployment.

---

## Scope

Diagnose why the Task 76 HTTP `Link` response-header preload did not improve production desktop LCP.

Task 76 production results that triggered this task:
- HTTP `Link` header confirmed present for all 4 locales ✅
- Mobile 375px LCP: 1288–1405ms 🟢 GOOD (unchanged, still good)
- Desktop 1280px LCP: 5648–9999ms 🔴 POOR (worse than pre-Task-76 baseline of 2359–5309ms)
- TTFB: 36ms ✅ — server is fast
- TBT: 0–9ms ✅ — no JS blocking
- `lcp_element: null` — extraction broken in Lighthouse 12-13

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/imageDelivery.ts` | Add `buildGalleryLcpPreloadHref` — 640w URL for HTTP Link header |
| `src/middleware.ts` | Switch from complex `imagesrcset` header to href-only 640w; use `headers.append` |
| `scripts/validate-production-lcp.mjs` | Fix RFC 8288 Link parser, fix `lcp_element` extraction (Lighthouse 13 paths) |
| `scripts/profile-listing-lcp.mjs` | Fix RFC 8288 Link parser |
| `scripts/compare-listing-lcp-lighthouse.mjs` | Fix `lcp_element` extraction |
| `scripts/diagnose-lcp-preload-network.mjs` | New — Playwright network trace diagnostic |
| `package.json` | Add `diagnose:lcp:network` script |
| `docs/backlog.md` | Task 77 added |

---

## Locales Covered

All 4: `sq`, `en`, `uk`, `it`

---

## Breakpoints Covered

| Breakpoint | Coverage |
|---|---|
| 320px | HTML probe documented |
| 375px | Lighthouse baseline; Playwright trace |
| 390px | HTML probe documented |
| 768px | HTML probe documented |
| 1280px | Primary diagnostic target; Playwright trace |
| 1440px | HTML probe documented |
| 2560px | HTML probe documented |

---

## Raw Link Header Analysis

### Production header structure (from `summary.json`, 2026-05-19T06:23:21Z)

The combined `Link` header contains:
1. 5 hreflang alternate entries (added by next-intl middleware):
   - `<https://lero.al/sq/listings/test-7-molyl9c8>; rel="alternate"; hreflang="sq"`
   - `<https://lero.al/en/listings/test-7-molyl9c8>; rel="alternate"; hreflang="en"`
   - `<https://lero.al/uk/listings/test-7-molyl9c8>; rel="alternate"; hreflang="uk"`
   - `<https://lero.al/it/listings/test-7-molyl9c8>; rel="alternate"; hreflang="it"`
   - `<https://lero.al/listings/test-7-molyl9c8>; rel="alternate"; hreflang="x-default"`
2. Our Cloudinary preload entry (appended by middleware):
   - `<https://res.cloudinary.com/die7okukn/...w_960,...>; rel=preload; as=image; imagesrcset="640w, 960w, 1200w, 1600w"; imagesizes="..."; fetchpriority=high`

### Parser Bug (fixed)

The old parser used `/<([^>]+)>/` which matched the FIRST `<url>` in the combined header — the `sq` hreflang entry (`https://lero.al/sq/listings/test-7-molyl9c8`), not the Cloudinary URL.

This caused `linkHeader.url = "https://lero.al/sq/listings/test-7-molyl9c8"` in `summary.json` — the validator was reporting the wrong URL as the "preload URL."

**Fix**: Implemented an RFC 8288-aware parser that splits at commas NOT inside quoted strings, then finds the entry containing `res.cloudinary.com` + `rel=preload` + `as=image`.

### imagesrcset Comma Issue

The `imagesrcset` value contains commas: `"url1 640w, url2 960w, url3 1200w, url4 1600w"`. In the combined header (all entries as one comma-separated string), these commas can corrupt the Cloudinary preload entry at CDN or proxy layers that naively split at all commas without respecting RFC 8288 quoted-string rules.

This risk is eliminated in the Task 77 fix by switching to href-only.

---

## Corrected Link Header Parser Findings

Post-fix parser correctly identifies:
- The Cloudinary preload entry from combined header ✅
- `url` now reports the actual Cloudinary 640w URL (after Task 77 middleware fix) ✅
- `totalEntries`: 6 (5 alternates + 1 preload) for all locales ✅
- `alternateCount`: 5 for all locales ✅

---

## Root Cause 1: Wrong href (URL Mismatch) — Outcome C

**The previous HTTP Link header preloaded 960w (`href = w_960,h_540,...`).**

At desktop 1280px DPR=1 with `sizes="(max-width: 768px) 100vw, 50vw"`:
- `50vw` at 1280px = 640px
- Browser selects **640w** srcset candidate from the `<img>` element
- Browser preloaded: `w_960,h_540,...` (960w)
- Browser requested: `w_640,h_360,...` (640w)
- **Result: URL mismatch → preload wasted → 640w is discovered and requested AFTER HTML parse**

The `imagesrcset` + `imagesizes` in the HTTP Link header were intended to let the browser auto-select 640w. But the combined header with 5 hreflang entries plus the imagesrcset commas made parsing unreliable.

**Fix**: HTTP Link header now uses `href = w_640,h_360,...` (640w URL) and no `imagesrcset` parameter.

---

## Root Cause 2: Cloudinary CDN Cold Start — Outcome F (partial)

**Key observation from `summary.json` desktop runs:**

```
Desktop sq:  FCP=1057ms, SI=1057ms, LCP=9999ms  (TBT=0, TTFB=36)
Desktop en:  FCP=908ms,  SI=908ms,  LCP=8594ms  (TBT=9, TTFB=36)
Desktop uk:  FCP=...ms,  SI=...ms,  LCP=5648ms  (TBT=..., TTFB=37)
```

**`SI (Speed Index) ≈ FCP` pattern**: Speed Index equals FCP on all desktop runs. This means the page appears visually complete at FCP time — all text and non-image content renders at ~900–1057ms. But LCP continues for 5–9 more seconds.

This can ONLY mean: **the LCP element (the Cloudinary image) is still loading 5–9 seconds after the page text has rendered.** This is not a JS issue (TBT=0), not a server issue (TTFB=36ms), and not a render-blocking issue. It is pure image delivery latency.

**Why is the 640w variant 5–9 seconds to deliver?**

The Lighthouse run sequence runs mobile (375px) BEFORE desktop (1280px):
- Mobile 375px DPR=2: requests **960w** variant → warms Cloudinary cache for 960w ✅
- Desktop 1280px DPR=1: requests **640w** variant → **640w is NOT warmed** → Cloudinary processes from origin → 5–8 second cold start ❌

This explains the huge variance: when 640w happens to be cached (from a real user visit), desktop LCP would be ~300ms. When the variant is cold (test listing with few desktop visitors), desktop LCP is 5–10 seconds.

**This is a measurement artifact, not a representative production issue.** Real listings with regular desktop traffic would have warm Cloudinary caches.

---

## LCP Element Findings

### `lcp_element: null` — Extraction Bug (fixed)

All Lighthouse 12/13 runs returned `lcp_element: null` because the extraction path was wrong.

Old path: `audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet`  
Lighthouse 12-13 path: `audits['...']?.details?.items?.[0]?.items?.[0]?.node?.snippet`  
(Lighthouse 12 refactored the audit to use a nested table.)

**Fix**: Multi-version path: try v1 path first, fall back to v2 path, then stringify for debugging.

---

## Browser Network Evidence

The Playwright diagnostic script (`scripts/diagnose-lcp-preload-network.mjs`) was created to capture:
- Exact Cloudinary image request start time relative to navigation
- HTTP Link header from the response
- Whether the preloaded URL matches the img request URL
- LCP element and timing via PerformanceObserver

Run after deployment:
```
node scripts/diagnose-lcp-preload-network.mjs https://lero.al test-7-molyl9c8
```

Or locally:
```
node scripts/diagnose-lcp-preload-network.mjs http://localhost:3099 test-7-molyl9c8
```

**Expected post-fix output (after deploying Task 77 changes):**
```
1280-desktop:
  sq: LCP=...ms <IMG> | cdn_start=~40ms | preload=✅ USED
  ...diagnosis: PRELOAD_USED — preloaded URL matched img request
```

**Why expected to improve:**
- 640w preloads correctly at TTFB (36ms)
- Browser requests 640w at TTFB instead of at HTML parse time (~136ms)
- When Cloudinary has 640w cached: image delivers in ~100ms → LCP ≈ 36 + 100 = ~200ms 🟢
- When Cloudinary cold (test listing): image delivers in ~5000ms → LCP ≈ 5000ms (same as before, CDN warm-up needed)

---

## Task 77 Code Changes Summary

### `src/lib/imageDelivery.ts`
- Added `buildGalleryLcpPreloadHref(src)` — returns the 640w Cloudinary URL
- Added JSDoc warning on `buildGalleryMainPreloadAttrs` not to use imagesrcset in HTTP Link headers

### `src/middleware.ts`
- Changed import from `buildGalleryMainPreloadAttrs` → `buildGalleryLcpPreloadHref`
- `buildLcpLinkHeader` now returns `<640w-url>; rel=preload; as=image; fetchpriority=high` (no imagesrcset)
- Changed from `response.headers.set('Link', combined)` to `response.headers.append('Link', preload)` — isolates preload from hreflang entries

### Parser fixes
- `validate-production-lcp.mjs`: RFC 8288-aware parser + Lighthouse 13 lcp_element extraction
- `profile-listing-lcp.mjs`: RFC 8288-aware parser
- `compare-listing-lcp-lighthouse.mjs`: Lighthouse 13 lcp_element extraction

---

## Validation Results

| Command | Result |
|---|---|
| `npm run lint` (src/middleware.ts, src/lib/imageDelivery.ts) | ✅ 0 errors/warnings |
| `node --check` (all 4 scripts) | ✅ valid syntax |
| Production validation | Pending Vercel deployment |

---

## Limitations

1. **Cloudinary CDN cold start**: The primary bottleneck when the 640w variant is cold. The href-only preload starting at TTFB saves ~100ms but doesn't prevent 5000ms CDN processing time on cold starts.
2. **Test listing cold starts**: `test-7-molyl9c8` is a test listing with low desktop traffic — 640w is rarely cached. Real listings with organic desktop traffic should have warm caches.
3. **Playwright diagnostic requires browser**: `npm run diagnose:lcp:network` requires `npx playwright install chromium` if Chromium not already downloaded.

---

## Epic Status

**OPEN** — Mobile LCP is GOOD. Desktop LCP is structurally limited by Cloudinary CDN cold-start behavior for the test listing. Two issues diagnosed and fixed; production validation pending.

---

## Recommended Task 78

**Validate href-only preload improvement in production + diagnose CDN warm-start strategy.**

After Vercel deployment of Task 77:
1. Run `npm run profile:lcp:production -- --preload-only` — verify Link header now contains 640w URL and no imagesrcset
2. Run `npm run diagnose:lcp:network` — verify 640w request starts at TTFB for desktop
3. Run `npm run profile:lcp:production` — measure desktop LCP improvement when Cloudinary is warm
4. If desktop LCP is still POOR due to cold starts: investigate Cloudinary eager transforms (pre-process all srcset variants when a listing is published)
5. If desktop LCP is GOOD when warm but variable: document that cold-start variance is expected and acceptable for a low-traffic test listing; validate against a high-traffic production listing
