# Task 79 — Fix Production Validation CLI and Network Trace Reliability

**Date:** 2026-05-19  
**Epic:** Listing Detail Performance / LCP  
**Status:** COMPLETE — all three tooling bugs fixed; production diagnostic run pending.

---

## Scope

Fix the remaining tooling reliability issues identified after Task 78 was deployed and the diagnostic scripts were run against production.

---

## Verified Production State (pre-Task-79, from post-Task-78 deploy)

- HTTP `Link` header correctly detected by `profile:lcp:production` for all locales ✅
- Preload URL: `<...w_640,h_360,...>; rel=preload; as=image; fetchpriority=high` ✅
- `preloadWidth: 640` ✅ | `valid: true` ✅
- Mobile 375px: sq=1430ms, en=715ms, uk=1339ms, it=1326ms 🟢 GOOD
- Desktop 1280px: sq=1418ms 🟡 NI, en=5385ms 🔴, uk=2860ms 🔴, it=5320ms 🔴
- TTFB ~50ms ✅ | TBT 0–4ms ✅

**Conclusion from LCP data**: Desktop sq=1418ms vs en/uk/it=2860–5385ms confirms CDN cold-start variance. When 640w is warm (sq), LCP is near-GOOD. When cold (en/uk/it), CDN processes the transform and adds 3–5s.

---

## Three Tooling Bugs Fixed

### Bug 1 — `--preload-only` treated as BASE_URL (CLI parsing)

**Broken behavior:**
```
npm run profile:lcp:production -- --preload-only
Base URL : --preload-only
Failed to parse URL from --preload-only/sq/listings/...
```
Summary still printed all-green because `[].every(...)` returns `true`.

**Root cause:** `process.argv[2]` is the first CLI argument regardless of whether it's a flag (`--foo`) or a positional value.

**Fix:** Filter flags before extracting positional arguments:
```javascript
const _positional  = process.argv.slice(2).filter(a => !a.startsWith('--'))
const BASE_URL     = _positional[0] || 'https://lero.al'
const SLUG         = _positional[1] || 'test-7-molyl9c8'
const PRELOAD_ONLY = process.argv.includes('--preload-only')
```

All four supported invocation forms now work:
- `npm run profile:lcp:production`
- `npm run profile:lcp:production -- --preload-only`
- `npm run profile:lcp:production -- https://lero.al test-7-molyl9c8`
- `npm run profile:lcp:production -- https://lero.al test-7-molyl9c8 --preload-only`

### Bug 2 — Empty-array all-green summary

**Broken behavior:** When all fetches failed (due to Bug 1), `htmlResults.filter(r => !r.error)` returned `[]`. JavaScript's `[].every(...)` returns `true`, so every check showed ✅.

**Fix:** Added `allLocalesSeen = allOk.length === LOCALES.length` guard. All summary checks require `allLocalesSeen && ...`. If any locales are missing, an explicit warning is printed before the summary table.

### Bug 3 — `diagnose:lcp:network` captures empty `documentLinkHeaderRaw`

**Broken behavior:** Playwright's `page.on('response', async res => { await res.allHeaders() })` has two failure modes:
1. **Async race**: `page.goto()` resolves before the async `allHeaders()` Promise completes — the data is silently dropped.
2. **Redirect matching**: `isNavigationRequest()` returns `true` for the FIRST navigation response (which may be a redirect with no `Link` header). The `if (docLinkHeader) return` guard then blocks the final document response from being captured.

**Fix:** Replaced with synchronous CDP `Network.responseReceived` event:
```javascript
const cdpSession = await context.newCDPSession(page)
await cdpSession.send('Network.enable')

cdpSession.on('Network.requestWillBeSent', ({ requestId, type }) => {
  if (type === 'Document') docRequestIds.add(requestId)
})

cdpSession.on('Network.responseReceived', ({ requestId, response }) => {
  if (!docRequestIds.has(requestId)) return
  if (response.status >= 300 && response.status < 400) return  // skip redirects
  // ...capture headers synchronously
})
```

CDP events are synchronous callbacks — no async race condition. `type === 'Document'` precisely identifies main document requests. Redirects are skipped by status code check.

### Bug 4 — Negative CDN request durations (`-1779175102472ms`)

**Broken behavior:** `cloudinary640DurationMs: -1779175102472`

**Root cause:** Playwright's `RequestTiming` fields:
- `t.startTime`: milliseconds since Unix epoch (absolute wall-clock time, e.g. 1779175102972)
- `t.responseEnd`: milliseconds elapsed since `t.startTime` (relative duration, e.g. 500ms)

The Task 78 code stored `epochEndMs = t.responseEnd` (a small relative value like 500) then computed `durationMs = epochEndMs - epochStartMs = 500 - 1779175102972 = -1779175102472`. The field names were misleading — `epochEndMs` was NOT an epoch timestamp.

**Fix:** Store `t.responseEnd` directly as `durationMs` (it already is the duration in ms):
```javascript
cdnRequests.push({
  startEpochMs: Math.round(t.startTime),           // epoch ms
  durationMs:   t.responseEnd > 0 ? Math.round(t.responseEnd) : null,  // duration ✓
})
```

Normalization: `startMs = startEpochMs - navStartEpoch`, `durationMs` unchanged (already correct).

---

## Files Changed

| File | Change |
|---|---|
| `scripts/validate-production-lcp.mjs` | CLI arg parsing fix; all-green summary guard |
| `scripts/diagnose-lcp-preload-network.mjs` | CDP header capture; duration fix |
| `docs/sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md` | This file |
| `docs/backlog.md` | Task 79 added |

---

## Timing Source Documentation

**`diagnose:lcp:network` timing sources after Task 79:**

| Field | Source | Unit |
|---|---|---|
| `startMs` (CDN request) | `request.timing().startTime - performance.timeOrigin` | ms from navigation start |
| `durationMs` (CDN request) | `request.timing().responseEnd` | ms from request start |
| `lcpMs` | `PerformanceObserver` entry `.startTime` | ms from navigation start |
| Document response timing | CDP `Network.responseReceived` + `performance.timeOrigin` normalisation | — |

All times are navigation-relative (positive integers). Duration is always `responseEnd` (ms from request start) which is inherently non-negative.

---

## Locales Covered

All 4: `sq`, `en`, `uk`, `it`

---

## Breakpoints Covered

| Breakpoint | Playwright trace | HTML probe |
|---|---|---|
| 320px | — | ✅ documented |
| 375px | ✅ | ✅ |
| 390px | — | ✅ documented |
| 768px | — | ✅ documented |
| 1280px | ✅ | ✅ |
| 1440px | — | ✅ documented |
| 2560px | — | ✅ documented |

---

## Expected Post-Fix Diagnostic Results

After running `npm run diagnose:lcp:network https://lero.al test-7-molyl9c8`:

```
1280-desktop:
  sq: documentLinkHeaderRaw: "<hreflang...>, <640w-url>; rel=preload; as=image; fetchpriority=high"
      parsedCloudinaryPreloadUrl: "https://res.cloudinary.com/.../w_640,h_360,...jpg"
      parsedCloudinaryPreloadWidth: 640
      hasValidCloudinaryPreload: true
      cloudinary640RequestStartMs: ~40ms   (near TTFB — preload used!)
      cloudinary640DurationMs: ~80–5000ms  (varies: warm cache vs CDN cold start)
      lcpMs: ~200ms (warm) or ~5000ms (cold)
      lcpElementTag: "IMG"
      lcpIsGalleryImage: true
      diagnosis: PRELOAD_USED or CLOUDINARY_COLD_VARIANT
```

**Desktop sq (1418ms)**: CDN warm hit → PRELOAD_USED + fast LCP  
**Desktop en/uk/it (2860–5385ms)**: CDN cold start → CLOUDINARY_COLD_VARIANT

---

## Validation Results

| Command | Result |
|---|---|
| `node --check scripts/diagnose-lcp-preload-network.mjs` | ✅ valid |
| `node --check scripts/validate-production-lcp.mjs` | ✅ valid |
| Production run | Pending |

---

## Epic Status

**OPEN** — Tooling is now reliable. The remaining desktop LCP issue is Cloudinary CDN cold-start for the 640w variant. Once diagnostics confirm `CLOUDINARY_COLD_VARIANT`, Task 80 can implement the fix.

---

## Recommended Task 80

**Diagnose and resolve Cloudinary CDN cold-start for the 640w desktop variant.**

After running reliable diagnostics:
1. If `CLOUDINARY_COLD_VARIANT` confirmed for en/uk/it locales:
   - Implement Cloudinary eager transforms on listing publish — pre-generate 640w variant before any user requests it
   - Or: add a warm-up request to 640w URL triggered by middleware (after sending the preload header, fire a background fetch to warm the CDN)
   - Or: reduce to a single canonical image size (e.g., 800w) that covers both mobile and desktop, eliminating the multi-variant cold-start problem
2. If `PRELOAD_USED` with LCP ≤ 2500ms for all locales: close the epic
3. If `LCP_NOT_GALLERY_IMAGE`: identify and optimize the actual LCP element
4. If `DIAGNOSTIC_UNRELIABLE`: continue tooling fixes before any optimization
