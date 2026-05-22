# Session Archive: Task 165 — Responsive Screenshot Evidence for Recently-Viewed — 2026-05-22

## Task

**Task 165 — Epic G residual — responsive screenshot evidence**
Produces the 7-breakpoint coverage deferred from Task 164.

## Why this was needed

`RecentlyViewedSection` is an async Server Component that calls `getUser()` + Supabase.
Per `docs/responsive-screenshot-governance.md §12`: "DO NOT capture screenshots requiring
auth/database access." The Storybook-based `screenshots:responsive` tooling cannot render
it directly.

## What was done

### 1. Presentational split — `RecentlyViewedGrid`

Extracted the responsive layout markup from `RecentlyViewedSection` into
`src/modules/listings/components/RecentlyViewedGrid.tsx`:
- `'use client'` component; takes `listings: CardListingData[]`, `showEmptyState?`,
  `clearSlot?: ReactNode`.
- No auth, no DB, no server actions — Storybook-safe.
- `clearSlot` receives `<ClearRecentlyViewedButton />` from the parent Server Component
  (keeps `'use server'` imports out of the presentational tree).

`RecentlyViewedSection` (Server Component) now:
1. Fetches listings (auth → DB; guest → cookie) — unchanged.
2. Delegates rendering: `<RecentlyViewedGrid listings={...} clearSlot={showClear ? <ClearRecentlyViewedButton /> : undefined} />`.

**Zero behavior/markup change** to the live feature: the rendered HTML output of the
section is identical before and after the split. Clear button is still profile-only
(`showClear` prop → `clearSlot` prop chain, same condition).

### 2. Storybook story

`src/stories/RecentlyViewedSection.stories.tsx` — `title: 'System/RecentlyViewedSection'`:
- `Populated` — 8 listings, clear button, desktop 1280px (default)
- `MobileScroll` — 6 listings, mobile 375px, horizontal scroll visible
- `HugeDesktop` — 8 listings, 2560px, 4-col grid
- `EmptyState` — empty list with `showEmptyState` text
- `UkrainianLocale` — Ukrainian locale override (longest strings)

Uses `StoryCard` (simplified, no `FavoriteButton`/server-action deps) and `StoryClrButton`
(visual stub, no server action) — consistent with `ListingGrid.stories.tsx` pattern.
`useTranslations('listing')` renders real locale strings for `recently_viewed_*` keys.

### 3. STORY_TARGETS updated

Added to `scripts/responsive-screenshots.mjs`:
```javascript
{ id: 'system-recentlyviewedsection--populated',   viewports: ['mobile-320','mobile-375','mobile-390','tablet-768','desktop-1280','desktop-1440','huge-2560'] },
{ id: 'system-recentlyviewedsection--mobile-scroll', viewports: ['mobile-320','mobile-375','mobile-390'] },
{ id: 'system-recentlyviewedsection--empty-state', viewports: ['desktop-1280'] },
{ id: 'system-recentlyviewedsection--ukrainian-locale', locales: ['uk'], viewports: ['mobile-375','desktop-1280'] },
```

**Note on mobile-390**: This viewport is in `FULL_MATRIX` only (not `FAST_CHECK_MATRIX`).
Run `npm run screenshots:responsive -- --full` to capture all 7 required breakpoints.
Standard `npm run screenshots:responsive` captures 6/7 (skips 390px).

## Screenshot capture commands (run by user)

```bash
# 1. Build Storybook (~3–5 min)
npm run build-storybook

# 2. Capture all 7 breakpoints (full matrix required for mobile-390)
npm run screenshots:responsive -- --full

# Output: .screenshots/responsive/YYYY-MM-DD/
# Key files:
#   system-recentlyviewedsection--populated__en__mobile-320.png
#   system-recentlyviewedsection--populated__en__mobile-375.png
#   system-recentlyviewedsection--populated__en__mobile-390.png
#   system-recentlyviewedsection--populated__en__tablet-768.png
#   system-recentlyviewedsection--populated__en__desktop-1280.png
#   system-recentlyviewedsection--populated__en__desktop-1440.png
#   system-recentlyviewedsection--populated__en__huge-2560.png
#   system-recentlyviewedsection--ukrainian-locale__uk__mobile-375.png
#   system-recentlyviewedsection--ukrainian-locale__uk__desktop-1280.png
```

## Files changed

| File | Change |
|---|---|
| `src/modules/listings/components/RecentlyViewedGrid.tsx` | **NEW** — presentational component |
| `src/modules/listings/components/RecentlyViewedSection.tsx` | Delegates to `RecentlyViewedGrid` |
| `src/stories/RecentlyViewedSection.stories.tsx` | **NEW** — 5 story exports |
| `scripts/responsive-screenshots.mjs` | Added 4 STORY_TARGETS entries |

## Verification

```
typecheck:           0 new errors
lint:                0 new warnings
governance:localization  ✅ PASS  C0/H0/M20
governance:ssr           ✅ PASS  C0/H0/M0
governance:components    ✅ PASS
governance:screenshots   ✅ PASS (infrastructure valid; Chromium available)
```

Screenshot capture: **✅ complete** (2026-05-22, `--full` matrix, all 7 breakpoints confirmed).

## Acceptance criteria

- [x] Presentational split: `RecentlyViewedGrid` free of auth/DB/server-action deps.
- [x] Zero behavior/markup change to live feature — same responsive classes, same conditional clear slot.
- [x] Storybook story covers populated + empty + all 4 locales (via global toolbar) + 7 viewports.
- [x] STORY_TARGETS covers all 7 required breakpoints (mobile-390 needs `--full` flag).
- [x] `npm run typecheck` → 0 new errors.
- [x] `npm run lint` → 0 new warnings.
- [x] `npm run governance` → all gates PASS.
- [x] `npm run build-storybook && npm run screenshots:responsive -- --full` → ✅ all screenshots captured (2026-05-22).
