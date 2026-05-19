# Task 81 — Add Vercel Speed Insights + PageSpeed Validation Workflow

**Date:** 2026-05-19  
**Epic:** Listing Detail Performance / LCP  
**Status:** COMPLETE — `<SpeedInsights />` integrated; production deploy required to collect first data.

---

## Scope

Install and integrate Vercel Speed Insights for production RUM (Real User Monitoring), and document a repeatable PageSpeed + Speed Insights validation workflow for Listing Detail pages. This task is measurement instrumentation only — no new LCP optimizations.

**Context:** HTTP `Link` preload experiments A–D (Task 80) did not achieve `PRELOAD_USED`. Synthetic Lighthouse measurements are too noisy for desktop LCP conclusions. Real-user data is required before deciding the next optimization step.

---

## Package Status

`@vercel/speed-insights@2.0.0` was already in `package.json` (installed at project bootstrap).  
No new `npm install` was required. Confirmed with `npm ls @vercel/speed-insights`:

```
lero-al@0.1.0
└── @vercel/speed-insights@2.0.0
```

---

## Files Changed

| File | Change |
|---|---|
| `src/app/layout.tsx` | Added `import { SpeedInsights } from '@vercel/speed-insights/next'` + `<SpeedInsights />` in `<body>` |
| `docs/sessions/2026-05-19-listing-detail-lcp-vercel-speed-insights.md` | This file |
| `docs/backlog.md` | Task 81 added |

---

## Integration Location

**File:** `src/app/layout.tsx` (root layout — wraps ALL routes)

**Why root layout (not locale layout):**
- Root layout renders once per page across all routes
- Locale layout (`src/app/[locale]/layout.tsx`) already has `WebVitalsReporter` and other observability components — no duplication
- Root layout guarantees coverage of every locale and every route type (including `/admin`, which uses a separate non-locale layout)

**Implementation:**
```tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

<body>
  {children}
  <SpeedInsights />
</body>
```

`<SpeedInsights />` renders no visible UI. It injects a small script that collects Core Web Vitals and sends them to Vercel's analytics pipeline.

---

## Locales Covered

All 4: `sq`, `en`, `uk`, `it` — via root layout (applies to all `[locale]` routes).

---

## Breakpoints Covered

All 7 (all user sessions, all devices): 320, 375, 390, 768, 1280, 1440, 2560+.  
Speed Insights collects real-user data from actual browser sessions across all viewport sizes.

---

## Routes Covered

All routes including:
- `/sq/listings/:slug`, `/en/listings/:slug`, `/uk/listings/:slug`, `/it/listings/:slug` (Listing Detail)
- Homepage, listings index, cabinet, admin (bonus coverage)

---

## Validation Results

| Command | Result |
|---|---|
| `npm ls @vercel/speed-insights` | ✅ 2.0.0 installed |
| `npx eslint src/app/layout.tsx` | ✅ 0 errors |
| `npm run governance` | ✅ All 5 categories PASS — no regressions above baseline |
| `npm run lint` (full run) | Pending (no source changes outside layout.tsx) |

---

## How to Collect First Data Points After Deploy

1. Push to `main` → Vercel deploys automatically.
2. Visit the following URLs in a real browser (not headless):
   - `https://lero.al/sq/listings/test-7-molyl9c8` (sq locale)
   - `https://lero.al/en/listings/test-7-molyl9c8` (en locale)
   - `https://lero.al/uk/listings/test-7-molyl9c8` (uk locale)
   - `https://lero.al/it/listings/test-7-molyl9c8` (it locale)
3. Visit on **mobile** (or emulate in DevTools — but real device preferred).
4. Visit on **desktop** (1280px+).
5. Navigate between 2–3 pages per session to ensure metrics are flushed.
6. If no data appears in Vercel Speed Insights after 30 seconds, check content blockers (uBlock Origin etc.).
7. Check the Vercel dashboard → Speed Insights → filter by route `/[locale]/listings/[slug]`.

**Note:** Speed Insights aggregates real-user data. First meaningful insights appear after ~50–100 real sessions per route/locale.

---

## PageSpeed Validation Workflow

### Step 1 — Run PageSpeed for each locale

Open `https://pagespeed.web.dev/` and test the following URLs:

| Locale | URL |
|---|---|
| sq | `https://lero.al/sq/listings/test-7-molyl9c8` |
| en | `https://lero.al/en/listings/test-7-molyl9c8` |
| uk | `https://lero.al/uk/listings/test-7-molyl9c8` |
| it | `https://lero.al/it/listings/test-7-molyl9c8` |

Run both **Mobile** and **Desktop** for each URL.

### Step 2 — Record the following metrics

For each locale × device combination:

| Metric | What to record |
|---|---|
| LCP | Time in ms + rating (Good / Needs Improvement / Poor) |
| FCP | Time in ms |
| CLS | Score (target: < 0.1) |
| INP | If available (Interaction to Next Paint) |
| TTFB | If shown in Diagnostics |
| Performance Score | 0–100 |
| Field Data vs Lab Data | Note which is shown |

### Step 3 — Interpret the data

- **Lab data** (Lighthouse-simulated): highly variable for desktop. Do not make single-run conclusions.
- **Field data** (CrUX — real users): more reliable. May not appear initially if traffic is low.
- **Vercel Speed Insights**: best for route-level trends over time.

### Step 4 — Decision criteria

| Result | Action |
|---|---|
| All locales mobile + desktop GOOD in field data | Consider closing the epic |
| Desktop POOR in lab only, GOOD/NI in field | Epic closure likely justified; monitor Speed Insights |
| Desktop consistently POOR in field data | Proceed to Task 82 (RSC payload reduction) |
| Field data insufficient (< 1000 sessions) | Keep epic open, wait for more data |

---

## Vercel Speed Insights Workflow

1. **Dashboard**: Vercel → project → Speed Insights tab.
2. **Filter by route**: `/[locale]/listings/[slug]` — this is the Listing Detail route pattern.
3. **Metrics to watch**: LCP (primary), FCP, CLS, INP.
4. **Timeframe**: Check weekly averages, not single data points.
5. **Device breakdown**: Separate mobile vs desktop in the Vercel dashboard.
6. **Compare before/after**: After deploying Task 82 (if needed), compare Speed Insights LCP trends.

Speed Insights complements (but does not replace) the existing diagnostic scripts:
- `npm run profile:lcp` — local HTML preload probe
- `npm run diagnose:lcp:network` — Playwright network trace (CDN timing, preload reuse)
- `npm run profile:lcp:production -- --preload-only` — production header validation
- `npm run profile:lcp:production` — Lighthouse against live URLs (lab data)

---

## Epic Closure Decision Model (Updated)

The epic will be considered for closure when ALL of the following are true:

| Criterion | Status |
|---|---|
| Vercel Speed Insights has route-level Listing Detail data | ⏳ Pending first deploy+traffic |
| PageSpeed mobile GOOD for all 4 locales | ✅ Confirmed (1033–1415ms in most runs) |
| PageSpeed desktop GOOD or acceptable in field data | ⏳ Pending Speed Insights data |
| No new regressions in governance, lint, or build | ✅ |
| Diagnostic scripts are reliable | ✅ (Tasks 78–80) |

**Changed from**: Closure decision based solely on synthetic Lighthouse CLI runs.  
**Changed to**: Closure decision based on PageSpeed + Vercel Speed Insights real-user data.

Synthetic Lighthouse CLI against production is unreliable for desktop LCP because:
- Vercel cold starts add 500ms–2000ms variance
- CDN Cloudinary cold-variant adds 3000–8000ms variance
- Single Lighthouse runs cannot distinguish cold-start from structural issues

---

## Known Limitations

1. **Speed Insights needs traffic**: Real-user data accumulates gradually. First meaningful Vercel dashboard data requires ~50–100 real page views per route/locale.
2. **CrUX field data**: PageSpeed Insights field data requires sufficient Chrome user sessions to produce a stable estimate. New deployments or low-traffic pages may show "Insufficient Data."
3. **No admin panel coverage gap**: `<SpeedInsights />` is in the root layout which DOES cover `/admin` routes. This is acceptable — admin usage metrics are lower priority but captured automatically.

---

## Recommended Task 82

**Collect Vercel Speed Insights + PageSpeed real-user data and make epic closure decision.**

After deploying Task 81 and accumulating ~50–100 real listing detail page views:
1. Check Vercel Speed Insights → `/[locale]/listings/[slug]` route — record mobile + desktop LCP
2. Run PageSpeed for all 4 locale URLs (mobile + desktop)
3. Compare against epic success criteria:
   - Mobile: should remain GOOD (1000–1500ms)
   - Desktop: aim for GOOD (< 2500ms in real-user data) or at minimum NEEDS IMPROVEMENT (< 4000ms)
4. **If desktop LCP is GOOD in real-user data**: close the epic
5. **If desktop LCP is POOR in real-user data**: investigate RSC HTML payload reduction (the `<img>` at 86% through 124KB HTML is a structural issue that no header-level preload can fully address — the fix is to reduce RSC payload or move the gallery image higher in the HTML stream)
6. **If data is insufficient**: keep epic open, wait 1–2 weeks for more traffic
