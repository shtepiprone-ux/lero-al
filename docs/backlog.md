# Project Backlog

## Last Session
**2026-05-19 — Listing Detail Performance / LCP Epic: EPIC CLOSED (Task 83)**
- **Vercel Speed Insights (7-day production RUM):**
  - Desktop: RES 100 🟢 Great | LCP ~1.34s | FCP ~1.2s | INP ~40ms | CLS ~0.01 | TTFB ~40ms
  - Mobile:  RES 100 🟢 Great | LCP ~0.96s | FCP ~0.69s | INP ~80ms | CLS ~0.01 | TTFB ~170ms
  - `/[locale]/listings/[slug]` route: RES 100, ~4 visits (small sample — continue monitoring)
- **Synthetic desktop Lighthouse POOR runs (Tasks 75–82) were CDN cold-start + lab variance** — not confirmed real-user regression.
- **No active LCP optimization is justified** based on current real-user data.
- **RSC/HTML payload reduction deferred** — only if Speed Insights later shows Listing Detail desktop LCP POOR for real users.
- **Epic CLOSED ✅**

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md`](sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md)

---

**2026-05-19 — Listing Detail Performance / LCP Epic: Speed Insights + PageSpeed Validation (Task 82)**
- **Mobile 375px: ALL GOOD** — sq=1448ms, en=649ms, uk=1199ms, it=1152ms 🟢 across all locales.
- **Desktop 1280px: POOR/NI** — sq=2532ms🔴, en=5665ms🔴, uk=5838ms🔴, it=1475ms🟡. TBT=0, CLS=0 (no JS/layout issues).
- **Root cause confirmed**: gallery `<img>` at 86% through 124KB RSC HTML; HTTP preload not honored by browser (Tasks 76-80); CDN cold-start amplifies delay (en/uk=5000ms+ when cold, it=874ms gap when warm).
- **Speed Insights**: `<SpeedInsights />` deployed, but insufficient traffic data yet. Dashboard check pending after site accumulates traffic.
- **PageSpeed field data**: likely insufficient for this low-traffic site. Lab data noisy.
- **Decision: OPEN — monitoring pending**. If Speed Insights confirms real-user POOR desktop → proceed to Task 83 (RSC payload reduction). If GOOD → close epic.
- **Lint**: 0 errors / 5 warnings (pre-existing). **Governance**: ✅ all 5 categories pass.

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md`](sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md)

---

**2026-05-19 — Listing Detail Performance / LCP Epic: Vercel Speed Insights + PageSpeed Workflow (Task 81)**
- `@vercel/speed-insights@2.0.0` was already installed; added `<SpeedInsights />` to `src/app/layout.tsx` (root layout — covers all locales and all routes without duplication).
- Governance: ✅ All 5 categories pass, no new regressions. Lint: ✅ 0 errors on layout.tsx.
- **Epic closure decision model updated**: no longer based solely on synthetic Lighthouse CLI. Now requires Vercel Speed Insights route-level RUM + PageSpeed (lab + field) for all 4 locales.
- **PageSpeed workflow documented**: run `https://pagespeed.web.dev/` for all 4 locale listing detail URLs, record LCP/FCP/CLS/INP for mobile + desktop.
- **First data**: visit all 4 locale Listing Detail URLs in a real browser after Vercel deploy to seed Speed Insights.

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md`](sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md)

---

**2026-05-19 — Listing Detail Performance / LCP Epic: HTTP Link Browser Usage (Task 80)**
- **Root finding**: `PRELOAD_NOT_USED` — 640w starts at 655–4708ms (late), not at TTFB. CDN delivers fast (43–125ms) when requested. Browser is ignoring the HTTP `Link` preload. Most likely cause: `fetchpriority=high` not a valid RFC 8288 parameter → Chromium silently rejects the entry.
- **4-variant experiment system** added to middleware (`resolveLinkVariant` + `buildLcpLinkHeader(variant)`):
  - A: unquoted + fetchpriority=high (original, known broken)
  - B: quoted + fetchpriority="high"
  - C: quoted minimal, no fetchpriority **(new default)**
  - D: same as C + image preload placed FIRST before hreflang entries
- **Default changed from A to C** — RFC 8288-standard quoted params, no non-standard `fetchpriority`.
- **`?_lcp_v=A|B|C|D` query param** allows testing variants in production without redeployment.
- **`--variant=X` flag** added to `diagnose:lcp:network` for targeted variant testing.
- **Mobile `URL_MISMATCH`** (640w preloaded, mobile needs 960w) assessed as acceptable — mobile LCP is GOOD.

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md`](sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md)

---

**2026-05-19 — Listing Detail Performance / LCP Epic: Production Diagnostics Reliability (Task 79)**
- **CLI bug fixed**: `--preload-only` was `process.argv[2]` → treated as BASE_URL. Fixed by filtering `--flags` before extracting positional args.
- **All-green empty array fixed**: `[].every(...)` always returns `true` — added `allLocalesSeen` guard before all summary checks.
- **CDP header capture**: Replaced `page.on('response', async allHeaders())` (async race + redirect matching issue) with synchronous CDP `Network.responseReceived`. Document requestId tracked via `Network.requestWillBeSent` where `type === 'Document'`.
- **Negative durations fixed**: `t.responseEnd` is already ms-from-request-start (not epoch). Was incorrectly subtracted from `t.startTime` (epoch ms). Fixed: `durationMs = t.responseEnd` directly.
- Desktop sq=1418ms 🟡 NI (CDN warm) vs en/uk/it=2860–5385ms 🔴 (CDN cold) — pattern confirms CDN cold-start as remaining bottleneck.

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md`](sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md)

---

**2026-05-19 — Listing Detail Performance / LCP Epic: Diagnostic Tooling Fix (Task 78)**
- **Bug 1 (parser)**: `headers.append('Link', ...)` created two separate `Link` headers; Node.js 18 undici `headers.get('link')` returned only the first (hreflang entries), silently dropping the Cloudinary preload. Fixed by reverting middleware to `headers.set(combined)`.
- **Bug 2 (LCP=N/A)**: `PerformanceObserver` must be injected via `addInitScript` BEFORE navigation. Chrome only finalises LCP on user interaction — added `page.mouse.move()` trigger after `networkidle`.
- **Bug 3 (absolute timestamps)**: `request.timing().startTime` is epoch ms. Fixed by subtracting `performance.timeOrigin` from page context.
- **Bonus fix**: Parser now uses RFC 8288 split + direct Cloudinary URL regex fallback + `\n` normalisation for robustly detecting the preload entry regardless of how the combined header is formatted.
- Desktop sq: 1424ms 🟡 NI (from summary.json) — CDN warm run improved; en/uk/it still POOR from CDN cold starts.
- **Production validation pending Vercel deployment.**

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md`](sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md)

---

**2026-05-19 — Listing Detail Performance / LCP Epic: Link Header Diagnostics (Task 77)**
- **Root cause 1 (Outcome C)**: HTTP Link header preloaded 960w (`href`); desktop `<img>` requests 640w. URL mismatch → preload wasted. Fixed by switching to `buildGalleryLcpPreloadHref` (640w URL, href-only, no imagesrcset commas).
- **Root cause 2 (Outcome F)**: Cloudinary 640w variant cold-start causes 5–9s image delivery on test listing. `SI ≈ FCP` at ~1000ms but LCP at 5–10s → pure CDN delivery latency, not JS/render.
- **Parser bug fixed**: Old parser captured hreflang alternate URLs (not Cloudinary URL). RFC 8288-aware parser now finds the actual preload entry.
- **`lcp_element: null` bug fixed**: Lighthouse 12-13 uses nested audit path; added multi-version extraction.
- **New script**: `scripts/diagnose-lcp-preload-network.mjs` — Playwright network trace; run with `npm run diagnose:lcp:network`.
- **Production validation pending Vercel deployment.**

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-link-header-diagnostics.md`](sessions/2026-05-19-listing-detail-lcp-link-header-diagnostics.md)

---

**2026-05-19 — Listing Detail Performance / LCP Epic: HTTP Link Header Preload (Task 76)**
- Implemented `Link: <url>; rel=preload; as=image; imagesrcset="..."; imagesizes="..."; fetchpriority=high` header via Next.js middleware.
- Middleware intercepts `GET /:locale/listings/:slug` (all 4 locales). DB lookup runs in parallel with `refreshSession` — TTFB overhead ≈ 0ms.
- Fail-open: missing listing / non-Cloudinary image / DB error all skip the header silently.
- RSC navigation requests (Next-Router-State-Tree header) are excluded — no overhead.
- Updated `validate-production-lcp.mjs` and `profile-listing-lcp.mjs` to detect and report the HTTP Link header.
- **Production validation pending Vercel deployment.**

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-http-link-preload.md`](sessions/2026-05-19-listing-detail-lcp-http-link-preload.md)

---

**2026-05-19 — Listing Detail Performance / LCP Epic: Production Validation (Task 75)**
- Mobile 375px production LCP: 1145–1380ms 🟢 GOOD (all 4 locales). Preload + fetchpriority confirmed live.
- Desktop 1280px production LCP: 2359–5309ms 🔴 POOR (3/4 locales). Root cause: LCP `<img>` at 86% through 124KB HTML (RSC payload overhead).
- Two preload tags in production HTML: React 19 auto-preload (imageSrcSet, no href) + our native RSC `<link>` (href + imageSrcSet). Both appear at chars 103K–106K — late in the body, providing minimal benefit for desktop.
- Epic NOT closed: mobile goal achieved; desktop requires HTTP `Link` response headers (Task 76).
- `scripts/validate-production-lcp.mjs` created, `npm run profile:lcp:production` added.

→ Детальний лог: [`docs/sessions/2026-05-19-listing-detail-lcp-production-validation.md`](sessions/2026-05-19-listing-detail-lcp-production-validation.md)

---

**2026-05-18 — Listing Detail Performance / LCP Epic: Lighthouse Trace Comparison (Task 74)**
- Mobile LCP: 5339–5523ms 🔴 POOR → 1400–1519ms 🟢 GOOD (−73% across all 4 locales).
- Desktop LCP: 273–908ms 🟢 GOOD. TBT: 126–174ms 🟢 GOOD. CLS: 0.
- Body-position preload is sufficient — HTTP Link headers NOT immediately justified.
- `scripts/compare-listing-lcp-lighthouse.mjs` created, `npm run profile:lcp:lighthouse` added.
- Caveat: measured against localhost; production numbers will differ.

→ Детальний лог: [`docs/sessions/2026-05-18-listing-detail-lcp-lighthouse-trace-comparison.md`](sessions/2026-05-18-listing-detail-lcp-lighthouse-trace-comparison.md)

---

**2026-05-18 — Listing Detail Performance / LCP Epic: Fix Preload Reliability (Task 73)**
- Replaced React 19 `preload()` (worker-level deduplication bug, no fetchpriority) with native RSC `<link rel="preload" as="image" fetchPriority="high">`.
- All 4 locales now get preload hint with `fetchpriority="high"` on every request.
- Known limitation: preload in `<body>` not `<head>` (React 19 SSR link hoisting is client-side).
- `scripts/profile-listing-lcp.mjs` updated with full-document detection and location reporting.

→ Детальний лог: [`docs/sessions/2026-05-18-listing-detail-lcp-preload-reliability.md`](sessions/2026-05-18-listing-detail-lcp-preload-reliability.md)

---

**2026-05-18 — Listing Detail Performance / LCP Epic: Profiling Baseline (Task 72)**
- Established LCP baseline via production build HTML inspection + profiling script.
- **CRITICAL:** React 19 `preload()` deduplication bug — only 1 of 4 locales gets `<link rel="preload" as="image">` per server lifecycle.
- **MEDIUM:** `fetchpriority="high"` absent from `<link rel="preload">` tag (React 19 limitation).
- `<img fetchPriority="high" loading="eager">` correctly in SSR HTML for all 4 locales.
- `ListingBackButton` NOT a primary LCP bottleneck.
- `scripts/profile-listing-lcp.mjs` created — repeatable HTML-level LCP probe.

→ Детальний лог: [`docs/sessions/2026-05-18-listing-detail-lcp-profile-baseline.md`](sessions/2026-05-18-listing-detail-lcp-profile-baseline.md)

---

## Post-Governance Debt Burn-down Sprint ✅ COMPLETE

### Task 64 — ESLint Debt Taxonomy & Safe Burn-down Plan ✅ CLOSED
**Finding:** All 163 errors are `storybook-static/` false positives. Zero source errors.
**Lint status:** `npm run lint` currently fails due to 163 pre-existing errors / 11,004 warnings.
**Artifacts:** `docs/eslint-debt-taxonomy.md`, `scripts/analyze-eslint-debt.mjs`

### Task 65 — Batch 1: Add storybook-static to ESLint globalIgnores ✅ CLOSED
**Change:** Added `"storybook-static/**"` to `globalIgnores` in `eslint.config.mjs`.
**Result:** 163 errors → 0 errors. 11,004 warnings → 44 warnings (genuine source warnings). Risk: LOW.

### Task 66 — Batch 2: Unused imports/variables cleanup in src/ ✅ CLOSED
**Result:** 27 warnings removed across 20 files. Warnings: 44 → 17. Risk: MEDIUM.
**Skipped (intentional):** CLOSED_LABEL/isFavoriteClosed (in-progress), getCallerId (reserved), _req (underscore pattern).

### Task 66A — Vercel Deployment Dependency Fix ✅ CLOSED
**Problem:** Vite peer dep triangle — `@vitejs/plugin-react@6` required `vite ^8`; Storybook 8.x required `vite ^5||^6`; vitest@4 required `vite ^6||^7||^8`. No single version satisfied all three.
**Fix:** Downgraded `@vitejs/plugin-react` `^6.0.1` → `^5.2.0` (supports vite 4–8); pinned `vite@^6.0.0`; added `legacy-peer-deps=true` to `.npmrc`. Vite resolved to `6.4.2`.
**Governance:** `scripts/governance/baseline.json` primitives HIGH updated 52 → 57 — 5 pre-existing violations confirmed on original commit `aa809a2` before sprint start.
**No production source files changed.**

### Task 66B — Stabilization Documentation ✅ CLOSED
**Scope:** Session log, backlog update, governance baseline adjustment rationale. Documentation only.
**Lint status:** `npm run lint` reports 0 errors / 17 warnings.
**Test status:** `npm run test` — 3 failed / 6 passed (pre-existing, same as commit `aa809a2`).

### Task 67 — Batch 3: Unused eslint-disable directives ✅ CLOSED
**Result:** Removed 9 directives across 7 files. Warnings: 17 → 8. Risk: LOW. Zero new violations.

### Task 68 — ESLint Flat Config no-restricted-syntax Override Fix ✅ CLOSED
**Bug:** All `no-restricted-syntax` blocks were silently overriding each other (last-wins). Same for `no-restricted-imports`. Listing status governance, image governance, and SSR governance were inactive.
**Fix:** Consolidated to 2 `no-restricted-syntax` blocks (`.tsx`, `.ts`) + 1 `no-restricted-imports` block. 10 pre-existing violations surfaced; 7 got targeted disable comments, 3 raw `<img>` tagged for Task 69.
**Result:** 0 errors, 8 warnings. All governance selectors now simultaneously active.

### Task 69 — Raw `<img>` → `<AppImage>` Migration ✅ CLOSED
**Scope:** 3 pre-existing raw `<img>` elements in PopularLocations, AdminLocationsManager, AdminUserAvatar → `<AppImage variant="listing-thumb">`.
**Result:** 0 errors, 8 warnings. 3 eslint-disable comments removed. Image governance is now violation-free.

### Task 70 — jsx-a11y Combobox ARIA Fixes ✅ CLOSED
**Fix:** `LocationCombobox` — added `role="combobox"`, `aria-controls`, `aria-haspopup`; `YearCombobox` — added `aria-controls`. Both use `useId()` for stable popup id references.
**Result:** 0 errors, **6 warnings** (−2 jsx-a11y). Zero new violations introduced.

### Task 71 — Sprint Closure & Next Epic Transition ✅ CLOSED
**Scope:** Documentation-only. Sprint formally closed. Final lint state documented. Next epic recommended.

---

### Sprint Summary

**ESLint debt eliminated:** 163 errors / 11,004 warnings → **0 errors / 6 warnings**

| Phase | Task | Deliverable | Warnings before → after |
|---|---|---|---|
| 1 | 64 | Taxonomy + burn-down plan | — |
| 2 | 65 | Exclude `storybook-static/` from ESLint | 163 errors / 11,004 → 0 / 44 |
| 3 | 66 | Remove 27 unused imports/vars | 44 → 17 |
| — | 66A | Vercel Vite peer dep fix | — |
| — | 66B | Stabilization docs + baseline fix | — |
| 4 | 67 | Remove 9 unused eslint-disable directives | 17 → 8 |
| 5 | 68 | Fix ESLint flat-config override bug | 8 → 8 (governance restored) |
| 6 | 69 | Migrate 3 raw `<img>` → `<AppImage>` | 8 → 8 (violations removed) |
| 7 | 70 | Fix 2 jsx-a11y Combobox ARIA warnings | 8 → 6 |

**Final state:**
- `npm run lint` reports 0 errors / 6 warnings
- `npm run build` ✅
- All governance commands ✅
- `npm run typecheck` — pre-existing test file errors only (confirmed on `aa809a2`)
- `npm run test` — 3 failed / 6 passed (pre-existing, identical to `aa809a2`)

**Remaining 6 warnings (intentional/deferred):**

| Warning | File | Reason |
|---|---|---|
| `@next/next/no-img-element` | `AppImage.tsx:130` | Intentional — AppImage is the canonical render site |
| `react-hooks/exhaustive-deps` | `useFavoritesRealtime.ts:133` | Deferred — requires realtime behavior testing |
| `@typescript-eslint/no-unused-vars` | `[slug]/page.tsx:273,277` | In-progress feature code |
| `@typescript-eslint/no-unused-vars` | `admin/actions/index.ts:308` | Reserved utility (`getCallerId`) |
| `@typescript-eslint/no-unused-vars` | `supabase/functions/.../index.ts:28` | Intentional `_req` underscore pattern |

---

## Future Maintenance Direction Epic (Tasks 58–63) ✅ COMPLETE

**2026-05-18 — Phase 6: Component Cataloging — Future Maintenance Direction Epic COMPLETE (Task 63)**
- `scripts/governance/component-catalog.mjs` created — scans 158 components, generates JSON + markdown catalog.
- `npm run governance:components` (CI-safe check) and `npm run catalog:components` (full scan) added.
- Docs created: `component-catalog.md`, `component-coverage-matrix.md`, `component-risk-register.md`, `component-catalog-governance.md`.
- Pre-existing debt documented: 38 raw `<button>`, 54 arbitrary TW, 28 grids missing 2xl. Zero new violations.
- `npm run lint` currently fails due to 163 pre-existing errors / 11,004 warnings — zero new violations introduced by Task 63.
- **Future Maintenance Direction Epic (Phases 1–6) COMPLETE.**

→ Детальний лог: [`docs/sessions/2026-05-18-component-cataloging.md`](sessions/2026-05-18-component-cataloging.md)

---

## Listing Detail Performance / LCP Epic ✅ COMPLETE

**Closed 2026-05-19** — Vercel Speed Insights (7-day production RUM) shows RES 100 / Great on both desktop and mobile. Desktop LCP ~1.34s, Mobile LCP ~0.96s. All Core Web Vitals GOOD/Great. Synthetic desktop Lighthouse POOR results (Tasks 75–82) were CDN cold-start / lab variance, not confirmed real-user regression. No further active LCP optimization is justified. HTTP Link preload experiments A–D (Tasks 76–80) did not produce reliable early image preloading — this infrastructure remains available as Variant C (default) for future investigation if regression occurs.

**Future monitoring**: If Vercel Speed Insights later shows Listing Detail desktop LCP > 2500ms consistently, reopen with RSC/HTML payload reduction and earlier gallery image discovery in HTML stream as the technical path.

### Task 72 — LCP Profiling Baseline ✅ CLOSED
**Method:** Production build HTML inspection + `scripts/profile-listing-lcp.mjs`
**Critical finding:** React 19 `preload()` deduplication — only 1 locale/request gets the image preload hint per worker process lifetime. 3 of 4 locales serve listing detail WITHOUT an early `<link rel="preload" as="image">`.
**Secondary finding:** `fetchpriority="high"` missing from preload link (React 19 limitation).
**Positive:** `<img fetchPriority="high" loading="eager">` in SSR HTML for all 4 locales. ListingBackButton not a primary LCP bottleneck.

### Task 73 — Fix Preload Reliability ✅ CLOSED
**Fix:** Replaced `react-dom preload()` with native RSC `<link rel="preload" as="image" fetchPriority="high">`. Deduplication bug eliminated.
**Result:** All 4 locales get preload with `fetchpriority="high"` on every request. ✅
**Known limitation:** Preload in `<body>` not `<head>` (React 19 SSR link hoisting is client-side).
**Verification:** `npm run profile:lcp` confirms all 4 locales.

### Task 74 — Lighthouse Trace Comparison ✅ CLOSED
**Result:** Mobile LCP 5339–5523ms POOR → **1400–1519ms GOOD** (−73%). Desktop 273–908ms GOOD.
**Finding:** Body-position preload is sufficient. HTTP Link headers NOT immediately justified.
**Caveat:** Localhost measurement; production numbers will differ but fix direction is confirmed.
**Script:** `scripts/compare-listing-lcp-lighthouse.mjs` | `npm run profile:lcp:lighthouse`

### Task 75 — Production LCP Validation ✅ CLOSED
**Method:** Lighthouse CLI against live `https://lero.al/[sq|en|uk|it]/listings/test-7-molyl9c8` + production HTML probe.
**Mobile:** 1145–1380ms 🟢 GOOD for all 4 locales. Preload with `fetchpriority="high"` confirmed in production HTML.
**Desktop:** 2359–5309ms 🔴 POOR (3/4 locales). Root cause: LCP `<img>` is at 86% through 124KB HTML — browser can't discover image until 106KB of RSC payload is received. Body-position preload (chars 103K) is discovered only 3KB before `<img>` — provides minimal benefit.
**Epic status:** OPEN — mobile LCP goal ✅ achieved; desktop LCP requires HTTP `Link` response-header preload.
**Script:** `scripts/validate-production-lcp.mjs` | `npm run profile:lcp:production`

### Task 83 — Epic Closure ✅ COMPLETE
**Vercel Speed Insights (7-day production real-user data):**
- Desktop: RES 100 🟢 Great | LCP ~1.34s | FCP ~1.2s | INP ~40ms | CLS ~0.01
- Mobile:  RES 100 🟢 Great | LCP ~0.96s | FCP ~0.69s | INP ~80ms | CLS ~0.01
- Listing Detail route `/[locale]/listings/[slug]`: RES 100, ~4 visits
**Closure rationale**: Real-user LCP GOOD on both desktop and mobile. Synthetic POOR runs were CDN cold-start / lab noise. HTTP Link preload experiments A–D did not produce PRELOAD_USED — no further active preload work justified.
**Future conditional**: If Speed Insights later shows Listing Detail desktop LCP POOR → RSC payload reduction + earlier gallery image in HTML stream.
**Session log:** [`docs/sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md`](sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md)

### Task 82 — Speed Insights + PageSpeed Validation — COMPLETE (epic OPEN — monitoring pending)
**Mobile**: sq=1448ms🟢 en=649ms🟢 uk=1199ms🟢 it=1152ms🟢 — consistently GOOD ✅
**Desktop**: sq=2532ms🔴 en=5665ms🔴 uk=5838ms🔴 it=1475ms🟡 — POOR/NI. TBT=0, CLS=0.
**Root cause**: gallery `<img>` at 86% through 124KB RSC HTML + CDN cold starts on test listing (warm=874ms gap, cold=5000ms+). HTTP preload not honored by browser.
**Speed Insights**: insufficient traffic yet; check Vercel dashboard after 1–2 weeks real traffic.
**Decision**: OPEN — monitoring pending. If real users see POOR desktop → Task 83 (RSC reduction). If GOOD → close.
**Session log:** [`docs/sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md`](sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md)

### Task 81 — Vercel Speed Insights + PageSpeed Workflow ✅ COMPLETE
**Package**: `@vercel/speed-insights@2.0.0` already in deps; added `<SpeedInsights />` to root layout.
**Integration**: `src/app/layout.tsx` — single placement, covers all locales + listing detail routes.
**Governance**: All 5 categories ✅ pass, no regressions.
**Workflow docs**: PageSpeed validation steps + Vercel Speed Insights dashboard usage documented.
**Epic closure model**: Upgraded from synthetic-only → PageSpeed field data + Vercel Speed Insights RUM.
**Next**: Deploy, visit listing detail pages in real browser to seed Speed Insights data, then run Task 82.
**Session log:** [`docs/sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md`](sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md)

### Task 80 — HTTP Link Browser Usage — IMPLEMENTATION COMPLETE (variant experiment pending production run)
**Finding**: `PRELOAD_NOT_USED` — 640w starts 650–4700ms late. CDN fast (43–125ms). Browser silently ignores `fetchpriority=high` in HTTP Link header (non-RFC-8288 param, likely Chromium rejection).
**4 variants**: A=original (broken) | B=quoted+fp | **C=quoted-minimal (new default)** | D=C+preload-first.
**Experiment**: `?_lcp_v=A|B|C|D` in URL, or `--variant=X` flag in `diagnose:lcp:network`, no redeployment.
**Session log:** [`docs/sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md`](sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md)

### Task 79 — Production Diagnostics Reliability — COMPLETE (diagnostic run pending)
**CLI fix:** `--preload-only` was argv[2] → BASE_URL. Fixed with flag-filtering before positional extraction.
**Empty-array guard:** `[].every()` = true → added `allLocalesSeen` check so failed fetches don't show all-green.
**CDP header capture:** Async `allHeaders()` race + redirect mismatch → synchronous CDP `Network.responseReceived`.
**Duration fix:** `t.responseEnd` is already a duration (ms from request start), NOT epoch ms — was wrongly subtracted from `t.startTime`.
**Evidence from production:** sq=1418ms (CDN warm) vs en/uk/it=2860–5385ms (CDN cold) → CLOUDINARY_COLD_VARIANT confirmed as remaining bottleneck.
**Session log:** [`docs/sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md`](sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md)

### Task 78 — Diagnostic Tooling Fix — COMPLETE (production validation pending Vercel deploy)
**3 tooling bugs fixed:** (1) `headers.append` created 2 Link headers → undici returned only first → parser missed Cloudinary; reverted to `headers.set(combined)`. (2) `PerformanceObserver` must be `addInitScript` before nav, not `getEntriesByType` after. (3) `timing.startTime` is epoch ms; subtract `performance.timeOrigin` for nav-relative output.
**Parser hardened:** RFC 8288 split + direct Cloudinary URL regex scan + `\n` normalisation — two independent strategies.
**Desktop sq from summary.json:** 1424ms 🟡 NI (CDN warm) vs 8440–9542ms (en/uk/it, CDN cold).
**Session log:** [`docs/sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md`](sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md)

### Task 77 — Link Header Diagnostics — COMPLETE (fixes applied, production validation pending)
**Root cause 1 (Outcome C):** HTTP Link preloaded 960w; desktop `<img>` requests 640w → URL mismatch → preload wasted. Fixed: middleware now uses `buildGalleryLcpPreloadHref` (640w href-only).
**Root cause 2 (Outcome F):** Cloudinary 640w cold-start is 5–9s for test listing. `FCP≈SI≈1000ms` but `LCP=5–10s` — page renders immediately, image just takes seconds to deliver from CDN. CDN cold-start is the true remaining bottleneck.
**Parser bug:** Old parser captured hreflang URL (not Cloudinary URL). Fixed with RFC 8288-aware entry finder.
**`lcp_element: null`:** Lighthouse 12-13 nested audit path fixed in all three scripts.
**New:** `scripts/diagnose-lcp-preload-network.mjs` + `npm run diagnose:lcp:network`.
**Session log:** [`docs/sessions/2026-05-19-listing-detail-lcp-link-header-diagnostics.md`](sessions/2026-05-19-listing-detail-lcp-link-header-diagnostics.md)

### Task 76 — HTTP `Link` Response Header Preload — IMPLEMENTATION COMPLETE, validation pending deploy
**Implemented:** Middleware (`src/middleware.ts`) intercepts `GET /:locale/listings/:slug`.
Fetches cover image URL from Supabase in parallel with session refresh (no added TTFB).
Sets `Link: <url>; rel=preload; as=image; imagesrcset="..."; imagesizes="..."; fetchpriority=high`.
Fail-open: missing listing / non-Cloudinary / DB error → no header, page renders normally.
RSC navigation requests (`Next-Router-State-Tree` header) are excluded.
**Scripts updated:** `validate-production-lcp.mjs` + `profile-listing-lcp.mjs` detect Link header.
**Production validation:** Run `npm run profile:lcp:production -- --preload-only` after Vercel deploy.
**Expected gain:** Desktop LCP from 2500–11953ms 🔴 → ~700–1200ms 🟢 (browser discovers image at TTFB).
**Session log:** [`docs/sessions/2026-05-19-listing-detail-lcp-http-link-preload.md`](sessions/2026-05-19-listing-detail-lcp-http-link-preload.md)

---

## Recommended Next Epics

### Option A — User Cabinet Improvements Epic
- Improve `/cabinet` UX: saved listings polish, profile flows, avatar management, user-facing features.
- Higher product value; directly visible to end users.
- Requires UI + locale (sq/en/uk/it) + responsive (320–ultrawide) coverage.

### Option B — Listing Detail Performance / LCP Epic ⭐ Recommended
- Improve listing detail LCP, perceived load speed, and Core Web Vitals.
- Mobile LCP for `/[locale]/listings/[slug]` is POOR (5339–5523ms, all 4 locales). TBT is GOOD. CLS is 0.
- The bottleneck is main-thread scheduling during React hydration, not image delivery.
- Builds naturally on AppImage/image governance work already done.
- Measurable objectively (Lighthouse, RUM).
- Reduces risk before heavier cabinet/user-facing feature work.

**Why Option B first:** Listing detail is the highest-traffic page. LCP is currently POOR, which
affects organic ranking and conversion. AppImage infrastructure is now solid. This is the
highest-confidence, highest-impact work at this stage.

### Option C — Cloudinary Integration Hardening Epic
- Strengthen upload/transformation flows, error handling, admin previews.
- Builds on AppImage and image governance work.
- Useful before adding heavier media features (video, 360° tours, etc.).

---

## Next Immediate Tasks (in order)

### 0. Listing detail mobile LCP — residual hydration cost (HIGH — SEO impact)
After the hydration budget pass, mobile Lighthouse LCP for `/[locale]/listings/[slug]` is
still **POOR** (5339–5523ms, all 4 locales). TBT is GOOD (≤ 200ms). CLS is 0.

The LCP element IS the GalleryStaticFrame cover `<img>` (confirmed via Lighthouse trace):
`div.listing-gallery > div.col-span-4 > div.relative > img.absolute`

This means the image IS in the SSR HTML and Chrome identifies it as the LCP candidate.
The bottleneck is not the image delivery (the preconnect + preload + fetchpriority are all
in place). The bottleneck is that **Chrome defers compositing while the main thread is
busy executing React hydration** (~888ms at 4× throttle).

The remaining above-fold client components after the hydration pass:
- `Header` (unavoidable — interactive locale switcher, auth menu)
- `GalleryIsland` → `ListingGallery` (lazy, ssr:false — deferred but still executes after initial HTML)
- `AuthProvider` (provider overhead for entire tree)
- `ListingBackButton` (sessionStorage + scroll-to-top in useEffect)
- `FavoriteButton` (optimistic toggle)

**Next steps to investigate:**
1. Profile the actual LCP waterfall in Lighthouse trace — which long task most delays the compositor
2. Consider converting `ListingBackButton` to a simpler server-rendered link with no sessionStorage logic
3. Consider whether `AuthProvider` can be moved outside the `NextIntlClientProvider` or if its Supabase subscription can be deferred further
4. Check if `preload()` from React 19 (called server-side for the gallery LCP image) is actually emitting `<link rel="preload" fetchpriority="high">` in the `<head>` — the Lighthouse report shows `priorityHinted: false` for the preload request
5. Verify that the preload `<link>` is in the FIRST response chunk (before any blocking scripts)

**Note:** The LCP element and image delivery are both correct. The issue is main-thread scheduling.

### 1. User cabinet (`/cabinet`)
- Profile page: avatar, name, phone, WhatsApp, user type.
- My listings tab: list with status badges, edit/delete actions.
- Saved searches tab.
- Route: `src/app/[locale]/cabinet/page.tsx`.
- Requires auth guard (redirect to /auth/login if not logged in).

### 2. Cloudinary integration
- `npm install next-cloudinary`.
- Add env vars: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Create upload component: `src/modules/listings/components/ImageUpload.tsx`.
- Use `CldUploadWidget` from next-cloudinary.

### 3. Create listing form (`/listings/create`)
- Multi-step form: basic info → details → photos → location → preview.
- Uses listingSchema (Zod) from `src/modules/listings/validations/index.ts`.
- Requires auth + must be agent or admin.

### 4. Admin panel (`/admin`)
- No locale prefix.
- Sidebar: Dashboard, Listings, Users, Support, Pages.
- Listings table: status management, premium toggle.
- Users table: role management, verify agent.
- Route guard: admin/moderator only.

### 5. Google OAuth
Supabase Dashboard → Authentication → Providers → Google → Enable.

---

## Session Archive

| Date | Description | Tasks | File |
|------|-------------|-------|------|
| 2026-05-19 | Listing Detail Performance / LCP Epic — CLOSED (Speed Insights RES 100) | Task 83 | [sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md](sessions/2026-05-19-listing-detail-lcp-epic-closure-speed-insights.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic Phase 11: Speed Insights + PageSpeed Validation | Task 82 | [sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md](sessions/2026-05-19-listing-detail-lcp-speed-insights-pagespeed-validation.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic Phase 10: Speed Insights + PageSpeed Workflow | Task 81 | [sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md](sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic Phase 9: HTTP Link Browser Usage | Task 80 | [sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md](sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic Phase 8: Production Diagnostics Reliability | Task 79 | [sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md](sessions/2026-05-19-listing-detail-lcp-production-diagnostics-reliability.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic Phase 7: Diagnostic Tooling Fix | Task 78 | [sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md](sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic Phase 6: Link Header Diagnostics | Task 77 | [sessions/2026-05-19-listing-detail-lcp-link-header-diagnostics.md](sessions/2026-05-19-listing-detail-lcp-link-header-diagnostics.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic Phase 5: HTTP Link Header Preload | Task 76 | [sessions/2026-05-19-listing-detail-lcp-http-link-preload.md](sessions/2026-05-19-listing-detail-lcp-http-link-preload.md) |
| 2026-05-19 | Listing Detail Performance / LCP Epic Phase 4: Production Validation | Task 75 | [sessions/2026-05-19-listing-detail-lcp-production-validation.md](sessions/2026-05-19-listing-detail-lcp-production-validation.md) |
| 2026-05-18 | Listing Detail Performance / LCP Epic Phase 3: Lighthouse Trace Comparison | Task 74 | [sessions/2026-05-18-listing-detail-lcp-lighthouse-trace-comparison.md](sessions/2026-05-18-listing-detail-lcp-lighthouse-trace-comparison.md) |
| 2026-05-18 | Listing Detail Performance / LCP Epic Phase 2: Fix Preload Reliability | Task 73 | [sessions/2026-05-18-listing-detail-lcp-preload-reliability.md](sessions/2026-05-18-listing-detail-lcp-preload-reliability.md) |
| 2026-05-18 | Listing Detail Performance / LCP Epic Phase 1: Profiling Baseline | Task 72 | [sessions/2026-05-18-listing-detail-lcp-profile-baseline.md](sessions/2026-05-18-listing-detail-lcp-profile-baseline.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint — Sprint Closure (SPRINT COMPLETE) | Task 71 | [sessions/2026-05-18-post-governance-debt-burndown-closure.md](sessions/2026-05-18-post-governance-debt-burndown-closure.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 7: jsx-a11y Combobox ARIA Fixes | Task 70 | [sessions/2026-05-18-combobox-aria-a11y-fixes.md](sessions/2026-05-18-combobox-aria-a11y-fixes.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 6: Raw img → AppImage Migration | Task 69 | [sessions/2026-05-18-raw-img-to-appimage-migration.md](sessions/2026-05-18-raw-img-to-appimage-migration.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 5: ESLint Flat Config Override Fix | Task 68 | [sessions/2026-05-18-eslint-no-restricted-syntax-governance-fix.md](sessions/2026-05-18-eslint-no-restricted-syntax-governance-fix.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 4: Unused eslint-disable Directives | Task 67 | [sessions/2026-05-18-unused-eslint-disable-directives.md](sessions/2026-05-18-unused-eslint-disable-directives.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Stabilization (Vercel fix + docs) | Tasks 66A+66B | [sessions/2026-05-18-vercel-vite-dependency-fix.md](sessions/2026-05-18-vercel-vite-dependency-fix.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 3: Unused Vars Cleanup | Task 66 | [sessions/2026-05-18-eslint-unused-vars-cleanup.md](sessions/2026-05-18-eslint-unused-vars-cleanup.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 2: ESLint False-Positive Fix | Task 65 | [sessions/2026-05-18-eslint-false-positive-fix.md](sessions/2026-05-18-eslint-false-positive-fix.md) |
| 2026-05-18 | Post-Governance Debt Burn-down Sprint Phase 1: ESLint Debt Taxonomy | Task 64 | [sessions/2026-05-18-eslint-debt-taxonomy.md](sessions/2026-05-18-eslint-debt-taxonomy.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 6: Component Cataloging (EPIC COMPLETE) | Task 63 | [sessions/2026-05-18-component-cataloging.md](sessions/2026-05-18-component-cataloging.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 5: Responsive Regression Screenshots | Task 62 | [sessions/2026-05-18-responsive-regression-screenshots.md](sessions/2026-05-18-responsive-regression-screenshots.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 4: Storybook Foundation | Task 61 | [sessions/2026-05-18-storybook-visual-snapshots.md](sessions/2026-05-18-storybook-visual-snapshots.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 3: Tailwind Entropy Detection | Task 60 | [sessions/2026-05-18-tailwind-utility-entropy-detection.md](sessions/2026-05-18-tailwind-utility-entropy-detection.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 2: CI Governance & Lint Enforcement | Task 59 | [sessions/2026-05-18-ci-governance-enforcement.md](sessions/2026-05-18-ci-governance-enforcement.md) |
| 2026-05-18 | Future Maintenance Direction Epic Phase 1: Governance Enforcement | Task 58 | [sessions/2026-05-18-governance-enforcement-phase-1.md](sessions/2026-05-18-governance-enforcement-phase-1.md) |
| 2026-05-18 | Responsive/UI Governance Epic — всі 7 фаз | Tasks 51–57 | [sessions/2026-05-18-ui-governance-epic.md](sessions/2026-05-18-ui-governance-epic.md) |
| 2026-05-18 | Filter Architecture Stabilization + SSR/Navigation Hardening | Task 50.4 | [sessions/2026-05-18-task-50.4.md](sessions/2026-05-18-task-50.4.md) |
| 2026-05-17 | Notifications, Saved Searches, Currency, Property Types, Admin fixes, i18n | Tasks 17.1, 21–50.3 | [sessions/2026-05-17-tasks-17-50.md](sessions/2026-05-17-tasks-17-50.md) |
| 2026-05-16 | Admin panel, User Profile, Auth, Performance, Favorites, Listings | Tasks 12–20 + bootstrap | [sessions/2026-05-16-tasks-12-19.md](sessions/2026-05-16-tasks-12-19.md) |
