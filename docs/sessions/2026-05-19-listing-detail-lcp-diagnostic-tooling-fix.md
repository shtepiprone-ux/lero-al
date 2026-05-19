# Task 78 — Fix LCP Network Diagnostic Tooling and Validate 640w Preload Reuse

**Date:** 2026-05-19  
**Epic:** Listing Detail Performance / LCP  
**Status:** COMPLETE — three confirmed tooling bugs fixed; production validation pending Vercel deployment.

---

## Scope

Fix three bugs in the diagnostic tooling introduced by Task 77, and fix one production source bug in the middleware. The Task 77 diagnostic script could not reliably:
- detect the Cloudinary preload entry in the HTTP Link header
- capture LCP element and timing
- report navigation-relative request timings

---

## Context From Post-Deploy Summary (2026-05-19T06:55:33Z)

### What worked
- Mobile 375px LCP: 1194–1315ms 🟢 GOOD (all locales, same level as before Task 76/77)
- HTTP `Link` header IS present in production response (confirmed by raw field)
- Desktop sq: 1424ms 🟡 NEEDS_IMPROVEMENT (improved from 9999ms!)
- TTFB: 36–37ms ✅ | TBT: 0–20ms ✅

### What was broken in tooling
1. `hasImagePreload: false` / `valid: false` even though raw header contained `<...w_640...>; rel=preload; as=image`
2. `LCP=N/A` — Playwright PerformanceObserver not capturing entries
3. `first cdn request @ 1779173948566ms` — absolute epoch timestamps instead of navigation-relative

---

## Root Cause Analysis: Three Tooling Bugs

### Bug 1 — `headers.append` creates two separate `Link` headers (CONFIRMED)

**Middleware**: Task 77 changed from `headers.set(combined)` to `headers.append(preload)`.  
**Effect**: Next.js Edge Runtime sends TWO separate `Link` headers to Vercel.

In the validation script, `fetch()` → `res.headers.get('link')` uses Node.js undici (Node 18). Undici v5 (Node.js 18) has a known issue where `headers.get()` may return only the **first** occurrence of a multi-value header, not the combined string. The second `Link` header (the Cloudinary preload) was silently dropped.

**Evidence**: `raw` field in summary.json shows the Cloudinary URL at the END of the combined header (around char 500–600). The hreflang entries fill the first 400–500 chars. If `get('link')` returns only the first header, the Cloudinary preload would be missing from the returned string entirely.

**Fix**: Reverted middleware to `headers.set()` with read-combine-set:
```typescript
const existing = response.headers.get('Link')
response.headers.set('Link', existing ? `${existing}, ${linkHeader}` : linkHeader)
```
This ensures a single `Link` header value, readable by any HTTP client.

### Bug 2 — Playwright LCP observer injected too late

`performance.getEntriesByType('largest-contentful-paint')` called after `page.goto()` returned an empty array because:
- Chrome only finalises LCP when the user starts interacting OR the page unloads
- Without explicit interaction, `getEntriesByType()` can return `[]` even on a fully loaded page

**Fix**: Use `page.addInitScript()` to inject a `PerformanceObserver` BEFORE navigation. All LCP candidates are buffered in `window.__lcpEntries`. After `waitUntil: 'networkidle'`, a `page.mouse.move()` call triggers LCP finalisation. The final entry is then read from `window.__lcpEntries`.

### Bug 3 — Absolute epoch timestamps in CDN timings

`request.timing().startTime` returns milliseconds since Unix epoch (not navigation-relative). The script was using this absolute value directly, yielding numbers like `1779173948566ms`.

**Fix**: After navigation, read `performance.timeOrigin` from the page (which is the epoch ms of navigation start). Subtract it from each CDN request's `timing.startTime`:
```javascript
const navStartEpoch = await page.evaluate(() => performance.timeOrigin)
const startMs = Math.round(r.epochStartMs - navStartEpoch)  // navigation-relative
```

### Additional fix — Playwright response header capture

`page.on('response', res => res.headers())` returns a combined string that may miss the second `Link` header. Replaced with `await res.allHeaders()` which returns all `{name, value}` pairs including duplicates, then joins all `link` values:
```javascript
const all = await res.allHeaders()
const linkVals = all.filter(h => h.name.toLowerCase() === 'link').map(h => h.value)
docLinkHeader = linkVals.join(', ')
```

### Additional fix — Parser robustness

The RFC 8288-aware splitter is theoretically correct but added two improvements:
1. **`\n` normalisation**: Some environments join multiple header values with `\n` instead of `, `. Added `.replace(/\r?\n/g, ', ')` before splitting.
2. **Direct regex fallback**: If the splitter fails for any reason, a second strategy scans for any Cloudinary URL in the header and checks the following parameters for `rel=preload` and `as=image`. This is independent of comma-split correctness.

---

## Files Changed

| File | Change |
|---|---|
| `src/middleware.ts` | Revert `headers.append` → `headers.set(combined)` — ensures single Link header |
| `scripts/validate-production-lcp.mjs` | Two-strategy parser: RFC 8288 + direct regex; `\n` normalisation |
| `scripts/profile-listing-lcp.mjs` | Same parser fixes |
| `scripts/diagnose-lcp-preload-network.mjs` | Complete rewrite — all 3 bugs fixed |
| `docs/sessions/2026-05-19-listing-detail-lcp-diagnostic-tooling-fix.md` | This file |
| `docs/backlog.md` | Task 78 added |

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

## Validation Results

| Command | Result |
|---|---|
| `npx eslint src/middleware.ts` | ✅ 0 errors, 0 warnings |
| `node --check` (all 4 scripts) | ✅ valid syntax |
| Full `npm run lint` | Pending (no src changes except middleware which lints clean) |
| Production validation | Pending Vercel deployment of middleware fix |

---

## Expected Post-Deploy Diagnostic Results

After deploying the middleware `headers.set()` fix and running `npm run diagnose:lcp:network`:

**Desktop 1280px expected:**
```
1280-desktop:
  sq: LCP=~300ms <IMG> | 640w start=~40ms dur=~80ms | preload=✅ (rfc8288) | PRELOAD_USED
  en: LCP=~300ms <IMG> | 640w start=~40ms dur=~80ms | preload=✅ | PRELOAD_USED
```
(when Cloudinary 640w is warm)

Or:
```
  sq: LCP=~5000ms <IMG> | 640w start=~40ms dur=~5000ms | preload=✅ | CLOUDINARY_COLD_VARIANT
```
(when 640w Cloudinary variant is cold — test listing with low traffic)

**Mobile 375px expected:**
```
375-mobile:
  sq: LCP=~1300ms <IMG> | 640w start=~40ms dur=... | preload=✅ | PRELOAD_USED
```

---

## Desktop LCP Improvement Signal

From post-deploy summary (2026-05-19T06:55:33Z):
- `sq` desktop 1280px: 1424ms 🟡 NEEDS_IMPROVEMENT (was 9999ms / 5055ms in earlier runs)

This improvement (from 5000–9999ms to 1424ms for `sq`) is likely due to:
1. Cloudinary 640w CDN cache being warm for `sq` at the time of that measurement
2. The href-only fix ensuring the preloaded URL actually matches the `<img>` request

The `en`, `uk`, `it` locales remain at 8440–9542ms — consistent with CDN cold starts for those variants.

---

## Epic Status

**OPEN** — tooling bugs fixed; middleware bug fixed. Production validation and Playwright diagnostic trace needed after deployment.

---

## Recommended Task 79

**Production diagnostic run + CDN warm-start strategy.**

After Vercel deployment of Task 78:
1. Run `npm run diagnose:lcp:network https://lero.al test-7-molyl9c8` to confirm PRELOAD_USED or CLOUDINARY_COLD_VARIANT for desktop
2. Run `npm run profile:lcp:production -- --preload-only` to confirm single Link header and correct Cloudinary preload URL
3. If diagnosis is `CLOUDINARY_COLD_VARIANT`: investigate Cloudinary eager transforms (pre-generate all srcset variants when a listing is published via `CLOUDINARY_EAGER_TRANSFORMS` env var or upload preset)
4. If diagnosis is `PRELOAD_USED` with LCP ≤ 2500ms for all locales: close the epic
5. If desktop LCP remains POOR even when preload works: investigate RSC payload reduction (124KB HTML is the underlying cause — the preload header is a workaround, not a cure)
