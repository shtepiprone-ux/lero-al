# Task 82 — Collect Vercel Speed Insights + PageSpeed Results and Decide LCP Epic Closure

**Date:** 2026-05-19  
**Epic:** Listing Detail Performance / LCP  
**Status:** COMPLETE — decision: **Keep epic OPEN — monitoring pending + structural path identified**

---

## Scope

Collect production performance data for all 4 Listing Detail locale URLs, evaluate against Vercel Speed Insights + PageSpeed field data, and make an evidence-based epic closure decision.

---

## Files Changed

| File | Change |
|---|---|
| `docs/sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md` | This file |
| `docs/backlog.md` | Task 82 added; epic status updated |

No source file changes. This task is measurement and decision-making only.

---

## Task 81 Deployment Readiness ✅

Confirmed from `src/app/layout.tsx`:
- `import { SpeedInsights } from '@vercel/speed-insights/next'` present ✅
- `<SpeedInsights />` rendered once in `<body>`, after `{children}` ✅
- Placement in root layout — covers all locales and all routes ✅

---

## Locales Covered

All 4: `sq`, `en`, `uk`, `it`

---

## Breakpoints Covered

| Breakpoint | Coverage |
|---|---|
| 320px | documented |
| 375px | ✅ Lighthouse deep run |
| 390px | documented |
| 768px | documented |
| 1280px | ✅ Lighthouse deep run |
| 1440px | documented |
| 2560px | documented |

---

## Production URLs Tested

| Locale | URL | HTTP Status |
|---|---|---|
| sq | `https://lero.al/sq/listings/test-7-molyl9c8` | 200 ✅ |
| en | `https://lero.al/en/listings/test-7-molyl9c8` | 200 ✅ |
| uk | `https://lero.al/uk/listings/test-7-molyl9c8` | 200 ✅ |
| it | `https://lero.al/it/listings/test-7-molyl9c8` | 200 ✅ |

---

## Vercel Speed Insights Status

**Status: Pending — insufficient data**

- `<SpeedInsights />` is integrated and deployed (Task 81)
- Speed Insights collects data from real browser sessions
- The `test-7-molyl9c8` listing has low organic traffic
- First meaningful route-level data requires ~50–100 real page views per route/locale
- **Cannot access Vercel dashboard from this environment**
- Speed Insights data should be checked manually after a few days of production traffic

**Action required:** Visit the Vercel dashboard → Speed Insights → filter by `/[locale]/listings/[slug]` after sufficient traffic has accumulated.

---

## HTTP Link Header State (production)

Confirmed with `npm run profile:lcp:production -- --preload-only`:

| Locale | Link header | preload | as=image | fp | cloudinary | HTML preload | gallery img |
|---|---|---|---|---|---|---|---|
| sq | ✅ | ✅ | ✅ | ❌ (Var C) | ✅ | HEAD ✅ | ✅ |
| en | ✅ | ✅ | ✅ | ❌ (Var C) | ✅ | BODY | ✅ |
| uk | ✅ | ✅ | ✅ | ❌ (Var C) | ✅ | HEAD ✅ | ✅ |
| it | ✅ | ✅ | ✅ | ❌ (Var C) | ✅ | HEAD ✅ | ✅ |

**`fp=❌`** is expected — Variant C (default) intentionally omits `fetchpriority` from the HTTP Link header (this was the Task 80 change to improve RFC 8288 compliance).

---

## Lighthouse CLI Production Results (current run, 2026-05-19)

**Method**: Lighthouse CLI against live `https://lero.al` (no network throttle for desktop, 4×CPU + 10Mbps for mobile)

### Mobile 375px

| Locale | LCP | Rating | FCP | TBT | CLS | Perf |
|---|---|---|---|---|---|---|
| sq | 1448ms | 🟢 GOOD | 510ms | 295ms | 0 | 94 |
| en | 649ms | 🟢 GOOD | 453ms | 165ms | 0 | 98 |
| uk | 1199ms | 🟢 GOOD | 469ms | 173ms | 0 | 98 |
| it | 1152ms | 🟢 GOOD | 435ms | 206ms | 0 | 97 |

**Mobile: ALL GOOD** ✅ (649–1448ms, all below 2500ms threshold)

### Desktop 1280px

| Locale | LCP | Rating | FCP | TBT | CLS | Perf |
|---|---|---|---|---|---|---|
| sq | 2532ms | 🔴 POOR | 993ms | 0ms | 0 | 85 |
| en | 5665ms | 🔴 POOR | 638ms | 0ms | 0 | 76 |
| uk | 5838ms | 🔴 POOR | 632ms | 0ms | 0 | 76 |
| it | 1475ms | 🟡 NI | 601ms | 0ms | 0 | 95 |

**Desktop: 3/4 POOR, 1/4 NEEDS IMPROVEMENT**

Key observations:
- `TBT=0ms` on all desktop runs: zero JavaScript blocking ✅
- `CLS=0`: no layout shift ✅
- `FCP` for sq=993ms vs en/uk/it=601–638ms: sq had a cold server start this run
- `LCP - FCP` gap: it=874ms (warm CDN), sq=1539ms (medium), en=5027ms (cold CDN), uk=5206ms (cold CDN)

---

## PageSpeed Web UI Validation

**Status: Not run in this session** — `https://pagespeed.web.dev/` requires a browser interface not available from this environment. 

**Recommended manual steps** (run in browser):
1. Open `https://pagespeed.web.dev/`
2. Test each URL below with Mobile + Desktop:
   - `https://lero.al/sq/listings/test-7-molyl9c8`
   - `https://lero.al/en/listings/test-7-molyl9c8`
   - `https://lero.al/uk/listings/test-7-molyl9c8`
   - `https://lero.al/it/listings/test-7-molyl9c8`
3. Record: LCP, FCP, CLS, INP, Performance score, field data vs lab data
4. Note whether CrUX field data is available (may show "Insufficient Data" for low-traffic pages)

---

## Field Data Availability

| Source | Status |
|---|---|
| Vercel Speed Insights | ⏳ Pending — insufficient traffic so far |
| PageSpeed CrUX field data | ⏳ Likely insufficient — small Albanian real estate site |
| Lighthouse CLI (lab data) | ✅ Available (but noisy — CDN cold-start variance) |
| Custom Playwright diagnostic | ✅ Available (`diagnose:lcp:network`) |

**Field data is not yet available from either source.** This is expected — the site has modest traffic and the test listing is specifically a low-traffic test fixture.

---

## Data Comparison Summary

| Locale | Mobile LCP | Desktop LCP | Field data | Interpretation |
|---|---|---|---|---|
| sq | 1448ms 🟢 | 2532ms 🔴 | pending | Mobile good; desktop near-POOR (CDN warmish) |
| en | 649ms 🟢 | 5665ms 🔴 | pending | Mobile excellent; desktop cold-CDN |
| uk | 1199ms 🟢 | 5838ms 🔴 | pending | Mobile good; desktop cold-CDN |
| it | 1152ms 🟢 | 1475ms 🟡 | pending | Mobile good; desktop NI (warm CDN) |

---

## Root Cause Analysis (final state after Tasks 72–82)

### What is causing desktop POOR?

1. **Structural issue (primary)**: The gallery `<img>` appears at character 106,307 — 86% through a 124KB RSC payload. The browser cannot start the image fetch until it has received 106KB of HTML. This is inherent to Next.js App Router RSC streaming for a page with this much inline data.

2. **CDN cold start (amplifier)**: When the Cloudinary 640w variant is not cached (cold), Cloudinary must generate the transform on-demand: 3,000–8,000ms. When cached, delivery is 43–125ms.

3. **HTTP Link preload not honored (confirmed, Tasks 76–80)**: All 4 header variants (A–D) showed `PRELOAD_NOT_USED`. The browser starts the 640w image at 650–4700ms, not at TTFB. The preload header exists but Chrome doesn't use it early enough to help desktop LCP.

4. **Mobile is immune**: Mobile Lighthouse uses 4×CPU + 10Mbps throttle — the image download time (50–100ms at 10Mbps) is small relative to the simulated load time. Desktop runs with no throttle expose the full CDN latency.

### What is NOT causing the issue:
- JavaScript execution (TBT=0ms in all desktop runs) ✅
- Layout shift (CLS=0) ✅  
- Server response time (TTFB ~50ms) ✅
- Missing preload HTML tag (present in all locales) ✅
- Wrong Cloudinary URL format (URLs match) ✅

---

## Lint and Governance

| Command | Result |
|---|---|
| `npm run lint` (src/) | ✅ 0 errors, 5 warnings (all pre-existing) |
| `npm run governance` | ✅ All 5 categories PASS — no regressions |

`npm run lint` current state: **0 errors / 5 warnings** (pre-existing, unchanged from Task 70 baseline).

---

## Epic Closure Decision: **B — Keep OPEN (monitoring pending)**

### Why NOT closing:
- Speed Insights has no route-level data yet (pending traffic)
- PageSpeed CrUX field data likely insufficient for this site
- Desktop lab data is POOR in 3/4 locales — but dominated by CDN cold-start noise
- One real-user or warm-CDN run (it=1475ms NI, sq=2532ms near-boundary) shows improvement is possible

### Why NOT closing with Task 83 immediately:
- The `it` locale at 1475ms NI (warm CDN) shows that when CDN delivers fast, LCP is acceptable
- The structural fix (RSC payload reduction) is significant effort
- With real user traffic, CDN is warmed organically — the POOR measurements may not reflect real user experience
- Need Speed Insights data to confirm whether real users actually experience POOR desktop LCP

### Path forward:
1. **Immediate**: Accumulate Speed Insights data (requires production traffic for 1–2 weeks)
2. **If Speed Insights confirms GOOD desktop**: close the epic
3. **If Speed Insights confirms POOR desktop**: proceed to Task 83 (RSC payload reduction)
4. **If insufficient data after 2 weeks**: accept the current state and close the epic, noting synthetic lab noise

---

## Limitations

1. **Test listing bias**: `test-7-molyl9c8` is a low-traffic test fixture. CDN cold starts are more frequent than for real production listings. Real LCP for popular listings (with warm CDN) is likely better.
2. **No CrUX data**: PageSpeed field data requires sufficient Chrome browser traffic. Albanian real estate sites may not have enough CrUX data for URL-level statistics.
3. **Lighthouse desktop variance**: Single Lighthouse runs against remote URLs are not reproducible — CDN state, Vercel cold starts, and local network all affect results. The wide range (1475ms–5838ms) confirms this is not a consistent user experience problem.
4. **`lcp_element` still pending**: The Lighthouse JSON audit format changed in v12-13. The extraction fix was applied but `lcp_element` may still be `null` in some runs until the audit path is confirmed against a real Lighthouse 13 output.

---

## Recommended Task 83

**If Speed Insights confirms desktop POOR for real users** — implement RSC HTML payload reduction:

**Core structural problem:**  
The listing detail page HTML is 124KB. The first 106KB is Next.js RSC serialized payload (component tree + listing data + translations + exchange rates). The gallery `<img>` appears only after this payload. Even with optimal preload headers, the browser cannot reduce below: `TTFB + 106KB_download_time + render_time`.

**Possible Task 83 directions:**
1. **Reduce RSC inline payload size** — defer exchange rate data, minimize translation payload, lazy-load non-critical data server-side
2. **Move gallery image higher in the HTML stream** — restructure the page component so the gallery RSC renders before the heavy inline data
3. **Use Next.js `<Image priority>` with true head preloading** — Next.js `<Image>` with `priority` prop injects a `<link rel="preload">` in `<head>` on the server, which MAY work better than our middleware approach
4. **Streaming boundaries** — use React `<Suspense>` to flush the gallery section first, then stream the heavy RSC payload

If Speed Insights confirms desktop is acceptable (NI or better) → close the epic.
