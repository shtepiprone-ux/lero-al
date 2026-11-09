# Epic U — kickoff prompts (Performance & RSC Diagnostics)

> Tasks 208–209. Shared hard contract: no scope change; no invented architecture; literal AC; update
> docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors; governance PASS; commit + single
> `git add -A` then `git log -1` (owner runs git/SQL). Both are INVESTIGATION-FIRST: per
> docs/ai-behavior.md "Framework Warning Rules", do NOT add code to silence a dev-only warning before
> reproducing it in a PRODUCTION build. Deliver findings, then fix only if the issue is real in prod.

## Task 208 — U.1 — Preload w_640 vs render w_352 mismatch (Note 10)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). No regression to the LCP gains from Tasks 72-83 (verify).
Pre-read: docs/performance.md, LCP Epic session logs (Tasks 72-83); src/lib/imageDelivery.ts
(buildGalleryMainPreloadAttrs), src/lib/performance/imageGuard.ts, src/components/ui/AppImage.tsx, the
listing card/detail image rendering.
Problem: the browser warns the preloaded header image (w_640) doesn't match the rendered card size (w_352).
Scope: characterise preload width vs rendered width at EVERY breakpoint (320/375/390/768/1280/1440/2560);
find why they diverge (fixed-width preload vs responsive render); align them (correct preload width / sizes).
Acceptance criteria:
- Per-breakpoint table (preload vs rendered) + root cause in the session log; preload matches rendered (or
  is justified) at all 7 breakpoints; the warning resolved; LCP gains intact.
- 0 new lint/typecheck errors; npm run build passes.
Out of scope: the RSC prefetch (209); broad LCP re-architecture.
```

## Task 209 — U.2 — `/uk/listings?_rsc=` prefetch failure (Note 11)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). No retry/refresh masking (No Fake Fixes policy).
Pre-read: docs/ai-behavior.md (Framework Warning + Navigation Safety rules), docs/performance.md;
src/app/[locale]/listings/page.tsx, src/modules/listings/hooks/useListingsUrlFilters.ts.
Problem: a `/uk/listings?_rsc=` prefetch failed — may be a transient Next.js RSC prefetch artifact or a
real Listings-page error.
Scope: confirm /uk/listings opens normally across locales; determine whether the prefetch failure is benign
transient (document it) or a real fault; if real, root-cause and fix (no masking).
Acceptance criteria:
- /uk/listings confirmed to open normally; the prefetch failure shown benign (documented) OR root-caused
  and fixed.
- 0 new lint/typecheck errors; npm run build passes.
Out of scope: the preload mismatch (208).
```
