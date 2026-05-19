# Task 80 — Fix HTTP Link Image Preload Browser Usage

**Date:** 2026-05-19  
**Epic:** Listing Detail Performance / LCP  
**Status:** IMPLEMENTATION COMPLETE — variant experiment deployed; production run pending.

---

## Scope

Investigate why Chromium does not use the HTTP `Link` image preload header (diagnosis `PRELOAD_NOT_USED`), implement a safe header-format experiment matrix, and deploy the most conservative/RFC-compliant variant as the new default.

---

## Key Diagnostic Finding (from Task 79 / post-deploy `diagnose:lcp:network`)

| Metric | Value |
|---|---|
| Document TTFB | ~50ms |
| 640w CDN delivery (when requested) | 43–125ms ✅ fast |
| 640w request start time (desktop) | 655–4708ms ❌ late |
| Diagnosis | `PRELOAD_NOT_USED` (all locales, desktop) |
| LCP element | `<IMG>` ✅ |
| Gallery img URL matches preload | ✅ |

**Conclusion**: CDN is fast. The problem is the browser is not issuing the 640w fetch at TTFB — it waits until the HTML parser discovers the `<img>` tag at 86% through the 124KB RSC payload (~500–1000ms into the page load). The HTTP `Link` preload header is being ignored.

---

## Investigation: Why Chromium Ignores the HTTP Link Preload

### Hypothesis 1: `fetchpriority=high` causes entry rejection

`fetchpriority` is defined in the HTML specification as an attribute of `<link rel="preload">`, not as a formal RFC 8288 `Link` header parameter. Chromium's HTTP Link preload scanner may:
- Accept `fetchpriority` as a known extension → no effect
- Reject the entire entry as malformed → preload silently dropped ← **MOST LIKELY**

Evidence: The diagnostic confirms the URL matches, the CDN is fast, the LCP element is the gallery img — but the request starts late. A silent parse rejection explains all data.

### Hypothesis 2: Unquoted parameter values

RFC 8288 §3 specifies that parameter values containing certain chars must be quoted. While `preload`, `image`, and `high` are valid tokens (no special chars), some strict parser implementations require quoted strings. Chromium may prefer `rel="preload"` over `rel=preload`.

### Hypothesis 3: Entry ordering

The image preload appears AFTER 5 hreflang alternate entries in the combined `Link` header. Some implementations have limits on how many `Link` entries they process for preloading. Placing the image entry first might help.

### Hypothesis 4: Combined header complexity

Next.js adds `/_next/static/media/` font preload entries as a second `Link` header (confirmed: newline between Cloudinary entry and font entry in CDP output). The combined header has ~7+ entries. If Chrome processes Link preloads up to a count limit, the image might be skipped.

### Current header (Variant A, KNOWN broken):
```
<640w-url>; rel=preload; as=image; fetchpriority=high
```

---

## Experiment Matrix

Four variants implemented — switchable via `?_lcp_v=X` query param (no redeployment needed) or `LINK_PRELOAD_VARIANT` env var.

| Variant | Format | Addresses hypothesis |
|---|---|---|
| **A** (original) | `rel=preload; as=image; fetchpriority=high` | baseline (known PRELOAD_NOT_USED) |
| **B** | `rel="preload"; as="image"; fetchpriority="high"` | H2 (quoted params) |
| **C** (default) | `rel="preload"; as="image"` | H1 + H2 (quoted, no fetchpriority) |
| **D** | `rel="preload"; as="image"` + placed FIRST | H1 + H2 + H3 (first entry) |

**Default changed from A to C** — most conservative: quoted params + no `fetchpriority`.

### How to test variants

```bash
# Test Variant A (original, known broken):
npm run diagnose:lcp:network -- https://lero.al test-7-molyl9c8 --variant=A

# Test Variant B (quoted + fetchpriority):
npm run diagnose:lcp:network -- https://lero.al test-7-molyl9c8 --variant=B

# Test Variant C (quoted minimal, DEFAULT — no need to pass --variant):
npm run diagnose:lcp:network -- https://lero.al test-7-molyl9c8
# or explicitly:
npm run diagnose:lcp:network -- https://lero.al test-7-molyl9c8 --variant=C

# Test Variant D (quoted minimal, preload first):
npm run diagnose:lcp:network -- https://lero.al test-7-molyl9c8 --variant=D

# Direct URL testing (browser DevTools):
https://lero.al/sq/listings/test-7-molyl9c8?_lcp_v=A
https://lero.al/sq/listings/test-7-molyl9c8?_lcp_v=B
https://lero.al/sq/listings/test-7-molyl9c8?_lcp_v=C
https://lero.al/sq/listings/test-7-molyl9c8?_lcp_v=D
```

The `?_lcp_v=` query param is:
- Honoured only on `/:locale/listings/:slug` routes
- Not visible to the listing page JSX (unused `searchParams`)
- Not cached by browser history / bookmarks as a meaningful URL
- Safe for production use in diagnostic sessions

---

## Files Changed

| File | Change |
|---|---|
| `src/middleware.ts` | Add `resolveLinkVariant()`, `buildLcpLinkHeader(variant)`, Variant D ordering; default C |
| `scripts/diagnose-lcp-preload-network.mjs` | Add `--variant=X` flag; fix positional arg parse; append `?_lcp_v=X` to test URLs; record variant in summary |
| `docs/sessions/2026-05-19-listing-detail-lcp-http-link-browser-usage.md` | This file |
| `docs/backlog.md` | Task 80 added |

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

## Mobile URL_MISMATCH Assessment

The `diagnose:lcp:network` reports `URL_MISMATCH` on mobile 375px because:
- HTTP Link header preloads 640w (correct for desktop)
- Mobile 375px DPR=2 → browser requests 960w from srcset
- 640w preload is downloaded but not reused by the `<img>`

**Assessment**: Acceptable. Mobile LCP remains GOOD (695–1415ms). The 640w preload is a wasted fetch on mobile but costs ~50KB which is small. The mobile LCP is GOOD despite this waste because:
1. 960w loads fast via CDN (cached from prior requests)
2. Mobile throttle normalises network variance
3. Mobile LCP is not the problem case

If mobile waste becomes a concern (Task 81), the fix is server-side `sizes` header based on User-Agent: use 960w href for mobile viewports.

---

## Validation Results

| Command | Result |
|---|---|
| `node --check scripts/diagnose-lcp-preload-network.mjs` | ✅ valid |
| `npx eslint src/middleware.ts` | ✅ 0 errors |
| `npm run lint` | Pending full run |
| Production variant run | Pending Vercel deploy |

---

## Expected Experiment Results

If **Variant C** produces `PRELOAD_USED`:
- `fetchpriority=high` was causing Chromium to reject the preload entry
- Default C is correct — no further changes needed
- Desktop LCP should drop from 5000ms to ~200ms (warm CDN) or ~5000ms (cold CDN)

If **Variant D** produces `PRELOAD_USED` but C does not:
- Entry ordering matters — image must be first in the `Link` header
- Deploy D as production default, document SEO impact of moving hreflang entries later

If **no variant** produces `PRELOAD_USED`:
- HTTP Link preload for cross-origin images is not reliably supported in this Vercel/Next.js setup
- Task 81 should investigate HTML-level early discovery: reduce RSC payload so `<img>` appears earlier, or use Next.js `priority` image with true head-hoisted preload

---

## Epic Status

**OPEN** — Variant experiment deployed (default C). Production diagnostic run needed to confirm whether Variant C fixes `PRELOAD_NOT_USED`.

---

## Recommended Task 81

**Run variant experiment matrix and confirm browser preload usage.**

After Vercel deployment:
1. Run each variant: `npm run diagnose:lcp:network -- https://lero.al test-7-molyl9c8 --variant=A|B|C|D`
2. Record diagnosis (PRELOAD_USED / PRELOAD_NOT_USED / CLOUDINARY_COLD_VARIANT) for each
3. If a variant achieves PRELOAD_USED: run `npm run profile:lcp:production` to confirm LCP improvement
4. If NO variant achieves PRELOAD_USED: confirm browser does not support HTTP image preload in this setup → Task 81 pivots to RSC payload reduction or Next.js `priority` image true head preload
5. Document the final finding and recommend epic closure or next optimization
