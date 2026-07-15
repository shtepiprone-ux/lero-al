# Session Archive: Task 605 — Rebuild `MantineListingCardPattern` as the COMPLETE single source of truth; supersedes Task 604 — 2026-07-15

Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_605_ListingCardPatternCompleteSingleSource.md`
Supersedes: Task 604 (real-page hover verify) — absorbed as Part 2 of this task's evidence.

## Why (owner-directed)

Task 602 built `MantineListingCardPattern` as a thin **shell**: the real card's content (photo,
badges, sold/rented overlay, photo counter, real favorite, features, footer) lived in
`ListingCard.tsx`, injected via `imageSlot`/`featuresSlot`/`footerSlot`. Consequence the owner
caught: the `Patterns/Mantine/ListingCardPattern` Storybook story filled no slots — it never
rendered the favorite button or the photo counter, so it did NOT represent production. Task
602's "rendered proof" validated a demo that never ships.

**Goal:** the pattern becomes the single source of truth for the WHOLE card. The story renders a
pixel-complete production-equivalent card. `ListingCard` becomes a thin data-mapper.

## Design contract implemented

**Pattern OWNS (data/prop-driven):** image frame + hover-zoom target, badges (top-left),
sold/rented overlay (centered rotated), photo counter (bottom-right, NEW), type/title/location,
features row, price(+old), footer layout (per-m²/original-price line), premium ring/stripe,
archived dimming, hover (elevation + zoom, `prefers-reduced-motion` + `(hover:hover)/(pointer:fine)`
guards — all kept from Task 602's CSS module, unchanged).

**Passed IN as positioned nodes** (behavior/state the pattern must stay agnostic of):
`image` (real `AppImage` / demo `Image`), `favorite` (real `FavoriteButton` / demo heart button,
both self-position via `absolute top-2 right-2`), `footerActions` (copy-id+date cluster, carries
`idCopied` state).

Badge/overlay colors are **pre-translated + pre-styled by the container** (`ListingCard.tsx`
still does the `t(...)`/status→className mapping — presentation-layer constants, per the existing
`eslint-disable-line no-restricted-syntax` precedent) and handed to the pattern as plain
`{label, variant?, className?}` data — the pattern stays hook-free/i18n-free.

Badges render via the existing shadcn `Badge` (`@/components/ui/badge`) — NOT Mantine's own
`Badge` — because Badge is pure Tailwind (no Mantine CSS involved), avoiding the exact
cascade-layer trap Task 602 already hit for hover (an unlayered Mantine component can silently
swallow a Tailwind color override). Keeping the same primitive the real app already used for
these exact badges also preserves the already-correct visual output byte-for-byte.

## `ListingCard.tsx` — container thinning

The vertical branch's `imageSlot`/`featuresSlot`/`footerSlot` JSX blocks are gone. It now builds
exactly 3 positioned nodes (`image`, `favorite`, `footerActions`) plus data props (`badges`,
`overlay`, `photoCount`, `features`, `originalPriceStr`, `pricePerSqmStr`, `typeLabel`) and hands
them to the pattern. `Camera` icon import dropped (photo-counter rendering moved into the
pattern). **Horizontal branch (List view) is byte-identical** — confirmed via `git diff`: zero
diff hunks touch that code region. Public API of `ListingCard` unchanged.

## `MantineListingCardPattern.tsx` — new props

```ts
badges?: { label: string; variant?: 'default'|'secondary'|'destructive'|'outline'; className?: string }[]
overlay?: { label: string; className?: string }
photoCount?: number
features?: { icon: ReactNode; value: string }[]
originalPriceStr?: string | null
pricePerSqmStr?: string | null
image: ReactNode        // now REQUIRED (no more internal demo Image/Badge/ActionIcon fallback)
favorite?: ReactNode
footerActions?: ReactNode
```

Removed: `onFavorite`/`favoriteAriaLabel` (favorite behavior fully lives in the passed node now),
the internal demo `Image`/`Badge`/`ActionIcon` fallback branch, `area`/`rooms`/`badge`/
`badgeColor`/`imageUrl`/`isFavorite` from `MantineListingCardData` (dead fields — `features`
replaces `area`/`rooms`, `badges` replaces the single `badge`/`badgeColor`).

## Story rebuild — `ListingCardPattern.stories.tsx`

Single `Default` story, 6 demo cards showing the full negative-flow matrix: regular (new badge,
unfavorited), premium (ring/stripe + favorited heart), reduced-price (struck old price + reduced
badge), sold (badge + centered overlay), no-image fallback (photoCount correctly absent), archived
(grayscale + badge). All demo nodes built on **canonical primitives** (`Button` `size="icon-sm"`
for the demo favorite — the exact Task 603 fix — and Mantine `Image`, never a raw `<img>`/`<button>`,
per `docs/storybook-governance.md` §9/§14 which `eslint`'s `no-restricted-syntax` enforced during
this task). 8 new `storybook.mantine.*` i18n keys × 4 locales (`card_type_label`,
`card_badge_reduced`, `card_badge_archived`, `card_overlay_sold`, `card_footer_date`,
`card_favorite_aria_add`, `card_favorite_aria_remove`, `card_price_per_sqm_1`) — parity verified
(2153 keys × 4 locales), `check:stories` Check 6/8 green (uk values genuinely Cyrillic, e.g.
`"€941 /м²"` not `"/m²"`).

**Bug found + fixed during the rebuild:** the no-image fallback (`DemoImage` with no `src`) used
an `absolute inset-0` div with no intrinsic height — since the real `AppImage`'s wrapper
independently reserves frame height (CLS prevention) but this story stand-in doesn't, the card
collapsed to zero visible height for that one card. Fixed with an explicit `h-[180px]` on the
fallback div — verified by re-capturing the story (before: blank white card; after: correctly
sized gray box with the `Maximize2` icon centered).

**Second gap found + fixed:** the pattern's footer per-m²/original-price line (a piece of content
the pattern now OWNS) was never demoed — none of the 6 story cards passed `pricePerSqmStr`. Added
the `card_price_per_sqm_1` key and wired it into every non-no-image card. Without this the story
would have remained a partial shell for that one row, the same class of gap this task exists to
close.

## Real-page rendered matrix (clause 12) — live `next dev` server

Script: `scripts/task605-qa-listingcard-complete.mjs` (new, ad hoc — not CI). Drives
`http://localhost:3000` directly (homepage Latest + `/listings` Grid), 2 routes × 4 locales ×
7 widths (320/375/390/768/1280/1440/2560) = 56 cells. Per cell asserts: favorite present,
photo-count pill present, features row present, footer-actions (copy-id) present, no horizontal
page overflow.

```
Matrix results: 44/56 PASS, 12 FAIL
```

**All 56 cells show the pattern's content-completeness signals present** (favorite/photoCount/
features/footerActions all `true` in every single cell, including the 12 "FAIL" ones). The 12
FAILs are `/listings` Grid at <640px (320/375/390 × 4 locales) — 100% attributable to the
**pre-existing, out-of-scope FilterBar/Combobox horizontal-overflow bug** already flagged during
Task 603 (tracked in `docs/backlog.md` Pending Action Items, candidate follow-up task). Confirmed
unrelated: this diff touches only `MantineListingCardPattern.tsx`/`ListingCard.tsx`/the story/
messages — none of which are FilterBar/Combobox code.

`badge=false` appears in every cell — also NOT a defect: the live test listing ("Test1", created
2026-06-17, ~4 weeks before this session's 2026-07-15 date) has no active promotional badge
(older than the 7-day "new" window, no `price_old`), so zero badges is the CORRECT data-driven
output for that specific listing, not evidence the pattern fails to render badges (the Storybook
story's regular/reduced/sold/archived cards all show badges correctly, proving the rendering path
itself works).

uk@320/375/390 + one 2560 cell captured for both routes, persisted at
`docs/sessions/2026-07-15-task605-assets/` (`real_homepage_uk_{320,375,390,2560}.png`,
`real_grid_uk_{320,375,390,2560}.png`, `manifest.json`). Personally reviewed by eye: compact
favorite heart top-right, photo-count pill bottom-right, no clip/overlap, complete footer
(per-m² line + copy-id + date) — visually matches the rebuilt story's structure.

## Story-vs-real side-by-side

Real homepage card (uk@320): type label, title, location, features row, price, per-m² line,
copy-id+date, favorite (top-right), photo-count (bottom-right) — no badge (data-driven, see
above). Story's regular demo card: identical structure — badge (demo data has an active "new"
listing), same positions for favorite/photo-count/footer. **No unexplained divergence** — the
only difference (badge presence) is a fixture-data difference (real listing vs demo listing age),
not a rendering regression. Persisted: `story_uk_1280.png`, `story_uk_320.png`,
`story_{sq,en,it}_1280.png` alongside the real-page captures in the same assets folder.

## Hover verification (absorbs Task 604) — real page, real desktop pointer

Per Task 604's Step 1/2, drove the actual Next.js homepage (not Storybook) with a genuine desktop
Playwright context (`hasTouch:false, isMobile:false` — the default, i.e. real
`(hover:hover) and (pointer:fine)`), read `getComputedStyle` on `.card` + its `img` before/after
`.hover()`:

```
Desktop pointer (hover:hover, pointer:fine): fired=true
  BEFORE: boxShadow=none                                                          transform=none
  AFTER:  boxShadow=rgba(16,24,40,.08) 0px 12px 16px -4px, rgba(16,24,40,.03) 0px 4px 6px -2px
          transform=matrix(1, 0, 0, 1, 0, -2)
  img BEFORE=none  AFTER=matrix(1.05, 0, 0, 1.05, 0, 0)

prefers-reduced-motion: reduce: transform stays none = true
  AFTER: transform=none  img AFTER=none

Coarse pointer (touch, hasTouch:true/isMobile:true): fired=false (expected: false — suppressed by design)
  AFTER: boxShadow=none  transform=none
```

**Conclusion — Task 604's Branch A, now proven with real evidence:** the hover effect genuinely
fires on the real page under a real desktop pointer (elevation + `scale(1.05)` photo zoom,
identical to Task 602's Storybook-only proof) and is genuinely, correctly suppressed under both
`prefers-reduced-motion` and a coarse/touch pointer context. **No product-code change was needed
for hover** — the owner's "навіть hover ефекту немає" report is best explained by testing through
Chrome DevTools' device-toolbar/touch emulation, which intentionally reports `(pointer:coarse)`
and correctly disables the effect **by design** (so a tap on a real touch device never leaves a
card stuck zoomed/elevated). This closes Task 604 without a STOP-AND-ASK being necessary — no
guard change was requested or made. Screenshots: `hover_desktop_after.png`,
`hover_coarse_pointer.png`.

## Regression coverage — `ListingCard.smoke.test.tsx`

Extended 8→10 tests. New:
- `archived listing renders the archived badge + dimmed card` — negative-flow coverage that
  didn't exist before (Task 602 never tested the archived state through the RTL suite).
- `favorite, photo counter, features, and footer actions all render through the pattern` — the
  605 single-source proof: asserts all 4 of the previously-shell-injected content pieces are
  present in the REAL rendered `ListingCard`.

**Planted-violation transcripts** (both temporarily edited, run, confirmed FAIL, reverted):

```
[1] photoCount={0} instead of photoCount={imageCount}:
FAIL  ...photo counter, features, and footer actions all render through the pattern
  expect(screen.getByText('2')).toBeInTheDocument() — TestingLibraryElementError: not found
FAIL  ...renders the preserved content set through MantineListingCardPattern
  (same assertion, same failure)
Test Files 1 failed | Tests 2 failed | 8 passed (10)
```
Reverted → 10/10 PASS.

```
[2] if (false && variant === 'horizontal') instead of if (variant === 'horizontal'):
FAIL  ListingCard — horizontal branch > still renders with variant="horizontal" ...
  expect(element).toHaveClass("listing-card--horizontal")
  Received: listing-card listing-card--vertical block h-full
Test Files 1 failed | Tests 1 failed | 9 passed (10)
```
Reverted → 10/10 PASS.

## Gates (all green)

```
npx tsc --noEmit                                              → 0 errors
npx eslint <all touched files>                                → 0 errors
npx vitest run ListingCard.smoke.test.tsx FavoriteButton.test.tsx → 36/36 PASS (3 files)
npm run check:stories                                         → 116 files, 0 violations
npm run check:i18n                                             → 2153 keys × 4 locales, parity PASSED
npm run check:mojibake                                         → 0 artifacts in 1728 files
npm run check:file-integrity                                   → 29 files clean
```

Full-repo `npx vitest run` (1138 tests): 1131 PASS, 7 FAIL — confirmed via `git diff --stat`
against each failing file that **none are touched by this task's diff**
(`check-stories.test.ts` stale `checksRan===13` vs the current 14-check script — pre-existing
drift from an earlier task; `date-format-ssr-parity` TZ child-process test; 3×`RangeDatePicker`/
`filtersRangeDatePicker` timeouts; `saveSavedSearch.dedup` timeout) — same class of pre-existing,
unrelated baseline noise Task 602's session log already documented.

No `git add`/`git commit` run — that's the orchestrator's call at review.

## AC-by-AC self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. Pattern renders photo counter/badges/overlay/features/footer/price/premium/archived/hover from data/props; favorite/image/copy-id passed as nodes; hook-free | `MantineListingCardPattern.tsx` diff — zero hooks, zero `useTranslations`/data calls | ✅ |
| 2. `ListingCard` vertical = thin data-mapper; horizontal byte-identical; public API unchanged | `ListingCard.tsx` diff + `git diff` shows zero hunks in the horizontal-branch region | ✅ |
| 3. Story renders complete card incl. demo favorite + photo counter, 4 locales, single `Default` | `story_{sq,en,uk,it}_1280.png`, `story_uk_320.png` — all 6 cards show favorite + photo counter (except the intentional no-image/no-count card) | ✅ |
| 4. Real homepage/grid matrix + story-vs-real side-by-side + hover transcript | 56-cell matrix (content-completeness 56/56 true; the 12 FAILs are the pre-existing unrelated overflow bug) + uk@320/375/390 personal review + hover computed-style transcripts above | ✅ |
| 5. Regression tests extended with verified planted-violation FAILs; registry updated | 10/10 tests, 2 fresh planted-violations (photoCount, horizontal-branch) both genuinely FAILed then reverted; `critical-flow-registry.md` row 57 updated | ✅ |
| 6. Gates green; file-integrity clean; Files-Changed + AC self-audit; no git ops | Gates section above | ✅ |

## Files Changed

| File | Rationale |
|------|-----------|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Rebuilt as the complete card: added `badges`/`overlay`/`photoCount`/`features`/`originalPriceStr`/`pricePerSqmStr` data props, rendered via the pattern itself (badges via shadcn `Badge`, overlay/photo-count via existing Tailwind markup moved in); `image` now required, internal demo Image/Badge/ActionIcon fallback removed; `favorite`/`footerActions` are the only remaining passed-node props. |
| `src/design-system/mantine/patterns/index.ts` | Export the 3 new supporting types (`MantineListingCardBadge`/`Feature`/`Overlay`). |
| `src/modules/listings/components/ListingCard.tsx` | Vertical branch thinned to a data-mapper: builds `image`/`favorite`/`footerActions` nodes + data props instead of the old `imageSlot`/`featuresSlot`/`footerSlot` JSX blocks; dropped the now-unused `Camera` import. Horizontal branch untouched. |
| `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` | +2 tests (archived-badge negative flow; favorite+photoCount+features+footerActions-via-pattern single-source proof); 2 planted-violations verified. |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | Rebuilt: 6 demo cards (regular/premium/reduced/sold/no-image/archived) on canonical primitives (`Button`, Mantine `Image`), demoing every pattern-owned content piece incl. favorite + photo counter + per-m² footer line. |
| `messages/{en,sq,uk,it}.json` | 8 new `storybook.mantine.card_*` keys × 4 locales (story fixtures only). |
| `docs/critical-flow-registry.md` | Row 57 updated: description now reflects the complete-pattern design + Task 605/604 verification detail. |
| `docs/sessions/2026-07-15-task605-assets/` | New — persisted PNGs + manifest.json (`.screenshots/` is gitignored). |
| `scripts/task605-qa-listingcard-complete.mjs` | New — ad hoc QA script (not CI) driving the live `next dev` server for the content-completeness matrix + real-page hover verification. |
| `docs/sessions/2026-07-15-task605-listingcard-pattern-complete-single-source.md` | This session log. |
