# Epic U — Performance & RSC Diagnostics

**Status:** OPEN — opened 2026-05-22 by the Opus 4.7 orchestrator. Follow-up to the closed LCP Epic (Tasks 72–83).
**Source notes:** issues.txt #10 (preload `w_640` vs render `w_352` size mismatch — fallout from LCP Tasks 72–83; needs per-breakpoint study), #11 (`/uk/listings?_rsc=` prefetch failed — possibly transient RSC prefetch or a Listings-page issue).
**Kickoffs:** `Epic_U_kickoff_prompts.md` (Tasks 208–209).

> Both are investigation-first. Per docs/ai-behavior.md "Framework Warning Rules", do NOT add code to
> silence a dev-only warning before reproducing it in a production build. Deliver findings, then fix only
> if the issue is real in production.

## Goal

The above-the-fold image preload matches the rendered size across breakpoints (no wasted/incorrect
preload), and the Listings RSC prefetch is confirmed healthy or fixed at the root.

## Dependencies

- LCP Epic (Tasks 72–83) preload machinery: `src/lib/imageDelivery.ts` (`buildGalleryMainPreloadAttrs`),
  `src/lib/imageGuard.ts`, `src/components/ui/AppImage.tsx`, listing detail/card image rendering;
  `src/app/[locale]/listings/page.tsx`; docs/performance.md.

## Tasks

### Task 208 — U.1 — Preload w_640 vs render w_352 mismatch (Note 10)

**Type:** investigation → fix
**Priority:** medium
**Area:** image preload vs responsive render size

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (Framework Warning Rules)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/performance.md, LCP Epic session logs (Tasks 72–83)
4. `src/lib/imageDelivery.ts`, `src/lib/performance/imageGuard.ts`, `src/components/ui/AppImage.tsx`,
   the listing card/detail image rendering

**Localization coverage:** N/A.
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 — the mismatch must be characterised at EACH.

**Goal:** The browser warns that the preloaded header image (`w_640`) doesn't match the rendered card
size (`w_352`). Study the preload vs actual `sizes`/rendered width at every breakpoint, find why they
diverge (LCP preload picks a fixed width while the card renders responsively), and align them.

**Acceptance criteria:**
- A per-breakpoint table of preload width vs rendered width (session log); the divergence root cause documented.
- Preload width matches the rendered width (or is justified) at all 7 breakpoints; the warning is resolved.
- No regression to LCP gains from Tasks 72–83 (verify); 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** the RSC prefetch (U.2); broad LCP re-architecture.

### Task 209 — U.2 — `/uk/listings?_rsc=` prefetch failure (Note 11)

**Type:** investigation → fix
**Priority:** low
**Area:** Listings page RSC prefetch

**Pre-read:** docs/ai-behavior.md (Framework Warning + Navigation Safety rules), docs/performance.md;
`src/app/[locale]/listings/page.tsx`, `src/modules/listings/hooks/useListingsUrlFilters.ts`.
**Localization coverage:** N/A.
**Responsive coverage:** N/A.

**Goal:** Determine whether the `/uk/listings?_rsc=` prefetch failure is a transient Next.js RSC prefetch
artifact or a real Listings-page error. Confirm `/uk/listings` opens normally; if there's a real fault,
fix it at the root (no retry/refresh masking — No Fake Fixes policy).

**Acceptance criteria:**
- `/uk/listings` confirmed to open normally across locales; the prefetch failure is either shown to be a
  benign transient (documented) or root-caused and fixed.
- 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** the preload mismatch (U.1).

## Epic-level acceptance

Image preload matches rendered size across breakpoints with LCP gains intact; the Listings RSC prefetch
is confirmed healthy or fixed at the root.
