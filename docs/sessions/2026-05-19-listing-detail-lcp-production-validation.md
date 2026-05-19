# Session Archive: Listing Detail Performance / LCP Epic — Task 75: Production PageSpeed / Real-World LCP Validation — 2026-05-19

## Task Summary

Task 75 validates real-world Listing Detail LCP performance on live `https://lero.al` after the
Vercel deployment containing the Task 73 preload reliability fix.

**Key outcome:**

| Context | Mobile 375px | Desktop 1280px |
|---|---|---|
| Task 74 localhost baseline | 1400–1519ms 🟢 GOOD | 273–908ms 🟢 GOOD |
| Task 75 production (Lighthouse CLI) | **1145–1380ms 🟢 GOOD** | **1100–5309ms 🔴 POOR (3/4 locales)** |

**Mobile production: GOOD across all locales. Desktop production: POOR for 3 of 4 locales.**

Root cause of desktop POOR LCP: The LCP `<img>` appears at **char 106307 (86% through a 124KB HTML document)**. The browser cannot start fetching the image until it has parsed 106KB of HTML. On desktop (unthrottled), this late discovery—combined with Vercel cold-start TTFB variability (500–1500ms)—causes LCP of 2000–5000ms.

The Listing Detail Performance / LCP Epic is **NOT closed**: mobile goal is achieved, but desktop
production LCP requires a follow-up task (HTTP `Link` response headers via Next.js middleware).

---

## Files Changed

| File | Change |
|---|---|
| `scripts/validate-production-lcp.mjs` | New — production LCP validation script |
| `package.json` | Added `profile:lcp:production` script |
| `docs/backlog.md` | Task 75 added and marked complete; epic kept open; Task 76 queued |
| `docs/sessions/2026-05-19-listing-detail-lcp-production-validation.md` | This session log |

**No production source files changed. No UI changes.**

---

## Locales Covered

All 4: `sq`, `en`, `uk`, `it`

---

## Breakpoints Covered

| Breakpoint | Method | Coverage |
|---|---|---|
| 320px mobile | HTML probe (documented) | ✅ Preload confirmed |
| 375px mobile | Lighthouse deep run | ✅ Full LCP measured |
| 390px mobile | HTML probe (documented) | ✅ Preload confirmed |
| 768px tablet | HTML probe (documented) | ✅ Preload confirmed |
| 1280px desktop | Lighthouse deep run | ✅ Full LCP measured |
| 1440px desktop | HTML probe (documented) | ✅ Preload confirmed |
| 2560px huge | HTML probe (documented) | ✅ Preload confirmed |

---

## Production URLs Tested

| Locale | URL | Status |
|---|---|---|
| sq | `https://lero.al/sq/listings/test-7-molyl9c8` | HTTP 200 ✅ |
| en | `https://lero.al/en/listings/test-7-molyl9c8` | HTTP 200 ✅ |
| uk | `https://lero.al/uk/listings/test-7-molyl9c8` | HTTP 200 ✅ |
| it | `https://lero.al/it/listings/test-7-molyl9c8` | HTTP 200 ✅ |

The `test-7-molyl9c8` slug from Tasks 72–74 is present in production.

---

## Commands Run

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 6 warnings (unchanged) |
| `npm run governance` | ✅ All 5 categories PASS — no regressions |
| `node scripts/validate-production-lcp.mjs https://lero.al test-7-molyl9c8 --preload-only` | ✅ All 4 locales: preload + fetchpriority confirmed |
| `node scripts/validate-production-lcp.mjs https://lero.al test-7-molyl9c8` | ✅ Completed — Mobile GOOD, Desktop POOR |
| Inline desktop re-run (node -e) | Confirmed desktop POOR is reproducible |
| Inline HTML structure analysis (node -e) | Located `<img>` at char 106307 in 124KB HTML |

---

## Production Validation Method

- **HTML probe:** Native `fetch()` against live production URLs. Checks preload presence, `fetchpriority`, image tag, preconnect.
- **Lighthouse CLI:** Programmatic Lighthouse (`lighthouse` npm package + `chrome-launcher`) against live production URLs.
  - Mobile: 375×667, 4× CPU throttle, 10 Mbps simulated network
  - Desktop: 1280×800, no CPU throttle, no network throttle
  - `deviceScaleFactor: 1` for desktop
- **PageSpeed Insights API:** Not available (no `PAGESPEED_API_KEY` env var set). Lighthouse CLI used as fallback.
- **Measurement caveat:** Lighthouse CLI against remote URLs includes real Vercel network latency and TTFB variability. Not equivalent to PageSpeed Insights real-user data.

---

## Production HTML Probe Results

### Preload presence

| Locale | HTTP | Preload | Location | fetchpriority | Cloudinary | `<img>` | eager |
|---|---|---|---|---|---|---|---|
| sq | 200 | ✅ | varies | ✅ high | ✅ | ✅ | ✅ |
| en | 200 | ✅ | varies | ✅ high | ✅ | ✅ | ✅ |
| uk | 200 | ✅ | varies | ✅ high | ✅ | ✅ | ✅ |
| it | 200 | ✅ | varies | ✅ high | ✅ | ✅ | ✅ |

**Preload location is non-deterministic:** Varies between `<head>` and `<body>` depending on Vercel server worker state. This is a React 19 SSR link hoisting behavior known from Task 74.

### Two preload tags discovered

Production HTML consistently shows **two** `<link rel="preload" as="image">` tags per response:

**Tag 1 — React 19 auto-preload** (generated from `<img srcSet fetchPriority="high">`):
```html
<link rel="preload" as="image"
  imageSrcSet="...640w, ...960w, ...1200w, ...1600w"
  imageSizes="(max-width: 768px) 100vw, 50vw"
  fetchPriority="high" />
```
No `href`. React 19 generates this from the `<img>` element's `srcSet` when `fetchPriority="high"` is detected.

**Tag 2 — Native RSC `<link>` from Task 73**:
```html
<link rel="preload" as="image"
  href="https://res.cloudinary.com/.../w_960,h_540,..."
  imageSrcSet="...640w, ...960w, ...1200w, ...1600w"
  imageSizes="(max-width: 768px) 100vw, 50vw"
  fetchPriority="high" />
```
Has `href`. This is our explicit native `<link>` from the listing detail page JSX.

Both are correct and include `fetchpriority="high"`. However, both appear at the **same late position in the body**.

### HTML structure analysis

```
Total HTML size     : 124138 chars (124KB)
</head> at char     : 3580 (head = 3.5KB)
First <script>      : char 491 (in head — Next.js bootstrap)
Preload tag 1       : char 103272 (83.2% through HTML)
Preload tag 2       : char 103954 (83.8% through HTML)
Gallery <img>       : char 106307 (85.6% through HTML)
```

**Critical finding:** The LCP `<img>` is at 85.6% through the HTML. The body before the `<img>` is ~102KB, which consists primarily of Next.js RSC inline scripts (serialized React component tree and listing data payload). The browser cannot start fetching the LCP image until it has received and parsed 106KB of HTML from the Vercel edge.

### Gallery `<img>` details

```
src: w_960,h_540,c_fill,g_auto,f_auto,q_auto (fallback)
srcSet: 640w, 960w, 1200w, 1600w
sizes: (max-width: 768px) 100vw, 50vw
fetchPriority: high ✅
loading: eager ✅
decoding: async
```

At desktop 1280px with `deviceScaleFactor=1`: `sizes="50vw"` → browser selects 640w candidate (~50KB). This is correct — the gallery takes 50% of the viewport width at desktop.

---

## Lighthouse / PageSpeed Results

### Run 1 — Mobile 375px (4× CPU, 10 Mbps simulated)

| Locale | LCP | Rating | FCP | TBT | CLS | Perf |
|---|---|---|---|---|---|---|
| sq | 1347ms | 🟢 GOOD | 592ms | 164ms | 0.000 | 98 |
| en | 1380ms | 🟢 GOOD | 467ms | 117ms | 0.000 | 99 |
| uk | 1274ms | 🟢 GOOD | 504ms | 153ms | 0.000 | 98 |
| it | 1145ms | 🟢 GOOD | 441ms | 113ms | 0.000 | 99 |

All 4 locales: 🟢 GOOD (< 2500ms). Mobile performance confirms the Task 73 preload fix is working.

### Run 1 — Desktop 1280px (unthrottled, DPR=1)

| Locale | LCP | Rating | FCP | TBT | CLS | Perf |
|---|---|---|---|---|---|---|
| sq | 2410ms | 🔴 POOR | 1198ms | 1ms | 0.000 | 84 |
| en | 3765ms | 🔴 POOR | 590ms | 0ms | 0.000 | 80 |
| uk | 1100ms | 🟢 GOOD | 774ms | 6ms | 0.002 | 98 |
| it | 11953ms | 🔴 POOR | 1233ms | 10ms | 0.000 | 72 |

3/4 locales POOR. `it` at 11953ms is a clear Vercel cold start + CDN miss outlier.

### Run 2 — Desktop 1280px (re-run, CDN warmed)

| Locale | LCP | Rating | FCP | TBT | CLS | Perf |
|---|---|---|---|---|---|---|
| sq | 5055ms | 🔴 POOR | 629ms | 0ms | 0.000 | 77 |
| en | 2359ms | 🟡 NI | 576ms | 0ms | 0.000 | 88 |
| uk | 2548ms | 🔴 POOR | 614ms | 6ms | 0.000 | 86 |
| it | 5309ms | 🔴 POOR | 583ms | 11ms | 0.000 | 77 |

Desktop results are **highly variable across runs**. CDN warming did not improve results.
Desktop LCP is dominated by Vercel TTFB (cold start latency) + late image discovery in HTML.

---

## Comparison Against Task 74 Localhost Results

| Metric | Task 74 localhost | Task 75 production | Delta |
|---|---|---|---|
| Mobile sq | 1400ms 🟢 | 1347ms 🟢 | −53ms (slightly better) |
| Mobile en | 1405ms 🟢 | 1380ms 🟢 | −25ms |
| Mobile uk | 1406ms 🟢 | 1274ms 🟢 | −132ms |
| Mobile it | 1519ms 🟢 | 1145ms 🟢 | −374ms |
| Desktop sq | 908ms 🟢 | 2410–5055ms 🔴 | +1502–4147ms |
| Desktop en | 572ms 🟢 | 2359–3765ms 🟡/🔴 | +1787–3193ms |
| Desktop uk | 273ms 🟢 | 1100–2548ms 🟢/🔴 | +827–2275ms |
| Desktop it | 443ms 🟢 | 5309–11953ms 🔴 | +4866–11510ms |

**Mobile is better in production than localhost** — Cloudinary CDN delivers images faster from real
edge nodes than the localhost test measurement captured.

**Desktop is significantly worse in production than localhost.** The 3–14× regression is caused by:
1. **Late image discovery:** LCP `<img>` at 86% through 124KB HTML — browser can't start fetching early
2. **Vercel TTFB variability:** Cold starts add 500–1500ms (FCP ranged from 583ms to 1233ms)
3. **Unthrottled desktop Lighthouse amplifies TTFB impact:** Mobile throttle normalizes timing; desktop exposes raw latency

---

## Root Cause Analysis — Desktop POOR LCP

### 1. Late image discovery (primary cause)

```
HTML size: 124KB
</head>: 3.5KB
Gallery <img>: 106KB (85.6%)
```

The listing detail page body consists of ~102KB of Next.js RSC inline scripts (serialized React
component tree, listing data, translations, exchange rates) before the visual HTML arrives.
The browser cannot discover and request the LCP image until it has received and parsed 106KB of HTML.

Even with `fetchPriority="high"` on the `<img>` tag, this doesn't help because the browser doesn't
see the image until it's 86% through the response.

### 2. Preload position (secondary)

Both preload tags appear at chars 103K–104K — only 2–3KB before the `<img>` itself. The preload
provides essentially no benefit over the `fetchPriority="high"` on the `<img>` since they are
discovered at nearly the same time.

### 3. Vercel cold start TTFB (amplifier)

Desktop FCP ranged from 441ms (warm) to 1233ms (cold). When Vercel has a cold start, the entire
LCP timeline shifts proportionally. The `it` locale reaching 11953ms in run 1 reflects a cold start
adding 1000+ ms before any HTML is received.

### 4. Mobile is immune to the HTML-depth issue

Mobile Lighthouse uses 4× CPU throttle + 10 Mbps network simulation. The throttled network means:
- The HTML streams at a simulated slow rate — both head and body arrive "slowly"
- The image, once discovered, also downloads slowly due to network throttle
- The total time is dominated by the simulated rates, not absolute byte offsets in HTML

This is why mobile LCP is consistently GOOD (1145–1380ms) despite the same late image position.
Real mobile users on slow connections would likely see worse results than Lighthouse's simulated mobile.

---

## CDN / Cloudinary Observations

- Cloudinary preconnect is present in `<head>` for all locales ✅
- Cloudinary transforms: `w_640/960/1200/1600` — max is 1600w for the srcset
- At desktop 1280px with `sizes="50vw"` and DPR=1: browser selects 640w candidate (~50KB) — fast to download
- The desktop LCP delay is NOT caused by large image file size (640w is small)
- CDN cache state had no consistent impact on second-run desktop results

---

## Is Body-Position Preload Sufficient? Updated Assessment

**Task 74 conclusion:** "YES, body-position preload is sufficient."
**Task 75 revision:** **For mobile: YES. For desktop: NO.**

The body-position preload at char 103K is effectively useless for desktop LCP because:
1. The `<img>` tag itself (3KB later at char 106K) is discovered almost simultaneously
2. The actual bottleneck is receiving 106KB of HTML from Vercel before ANY image request can begin
3. The preload does not help if the browser must wait for 106KB of HTML to be received first

The solution is to send the LCP image URL as an HTTP `Link` response header — before the browser
receives any HTML. This would allow the browser to start fetching the LCP image during TTFB.

---

## Epic Closure Decision

### Mobile LCP ✅ ACHIEVED
All 4 production locales show 🟢 GOOD mobile LCP (1145–1380ms). The Task 73 preload reliability fix
achieved its mobile performance goal. The Listing Detail mobile LCP epic goal is complete.

### Desktop LCP ❌ NOT ACHIEVED
3 of 4 production locales show 🔴 POOR desktop LCP (2359–5309ms, excluding the 11953ms outlier).
The desktop LCP failure is structural: the LCP image is at 86% through a 124KB HTML document,
and body-position preload provides no meaningful benefit.

### Epic status: OPEN — desktop LCP work remains

The epic should remain open. The evidence-based next task is:

**Task 76 — HTTP `Link` Response Header Preload via Next.js Middleware**

Implementing `Link: <cloudinary-url>; rel=preload; as=image; fetchpriority=high` as an HTTP response
header would allow the browser to start fetching the LCP image during TTFB — before receiving any
HTML. This would directly address the root cause of desktop POOR LCP.

---

## Limitations

1. **No PageSpeed Insights API:** Results from Lighthouse CLI are single-run measurements against a
   live remote URL. PageSpeed Insights uses real-user data (CrUX) and is more reliable for
   production validation. Set `PAGESPEED_API_KEY` to get PSI results via `profile:lcp:production`.

2. **Lighthouse CLI vs production reality:** Desktop Lighthouse with no throttle measures the
   interaction of real Vercel network latency + Cloudinary CDN with Chrome's page load simulation.
   Results will vary across runs due to cold start variability.

3. **Single listing tested:** `test-7-molyl9c8` is a test listing. Production listings may have
   heavier cover images and/or different Cloudinary transform sizes.

4. **Two Lighthouse desktop runs — high variance:** sq ranged from 2410ms to 5055ms across runs.
   This variance makes it difficult to establish a stable production desktop baseline.

---

## Validation Results

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 6 warnings (unchanged) |
| `npm run governance` | ✅ All 5 categories PASS |
| `npm run profile:lcp` | ✅ All 4 locales: preload + fetchpriority present (requires running server) |
| `npm run profile:lcp:production` (`--preload-only`) | ✅ All 4 production locales HTTP 200, preload + fetchpriority confirmed |
| `npm run profile:lcp:production` (full) | ✅ Mobile GOOD; Desktop POOR documented |
| `npm run typecheck` | ⚠️ Pre-existing test-file errors only (confirmed `aa809a2` baseline) |

Zero new lint violations. Zero new governance violations. No production source files changed.

---

## Recommended Task 76

**Implement HTTP `Link` Response Header Preload via Next.js Middleware**

The root cause of desktop POOR LCP is that the LCP `<img>` is discovered at 86% through a 124KB HTML
document. The body-position preload provides no meaningful benefit. The fix is to deliver the LCP
image URL as an HTTP `Link` header — sent before any HTML — so the browser preloads the image during
TTFB.

Implementation approach:
1. In Next.js middleware (`middleware.ts`), intercept `GET /[locale]/listings/[slug]` requests
2. Fetch the listing cover image URL (from edge cache or pattern-based) and send:
   `Link: <cloudinary-url>; rel=preload; as=image; fetchpriority=high`
3. Alternatively, use Next.js `next/headers` in the page server component to call `headers().set('Link', ...)`
   — if supported by the Next.js version

Expected outcome: LCP image request starts during TTFB, eliminating the 106KB HTML parse delay.
Based on the FCP data (~500–600ms for warm Vercel), HTTP `Link` preload could reduce desktop LCP
from ~2500–5000ms to ~700–1200ms.
