# Task 608 — `ListingCard.tsx` `horizontal` branch → `MantineListingCardPattern layout="list"` (site wiring)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_608_ListingCardListLayoutSiteMigration.md`.

Site-wiring half of Task 606 (Storybook `layout="list"` variant, owner-approved) — this task migrates the
LAST hand-rolled listing-card markup (`variant === 'horizontal'`, the `/listings` List view) onto the same
single-source pattern the vertical branch already consumes (Task 602/605).

## Summary

Replaced `ListingCard.tsx`'s entire `if (variant === 'horizontal') { … legacy row markup … }` block with a
thin data-mapper that renders `<MantineListingCardPattern layout="list" …/>` inside the existing `<Link>`,
mirroring the vertical branch's own split exactly (image/favorite/footerActions passed as behavior-bearing
nodes; the pattern owns all list-row chrome). No `overlay`/`photoCount`/`onContact` passed — the ported
legacy list design never had them. `PriceBlock` (local helper) and the now-unused `Badge`/`cn`/`MapPin`
imports were removed (compiler + grep verified — each was used ONLY by the removed markup).

## AC-by-AC self-audit

1. **`variant === 'horizontal'` renders `<MantineListingCardPattern layout="list" …/>` inside the existing
   `<Link>`; legacy markup removed; `overlay`/`photoCount`/`onContact` not passed.**
   ✅ `src/modules/listings/components/ListingCard.tsx:132-221`. `overlay`/`photoCount`/`onContact` are
   grep-confirmed absent from the call (`grep -n "overlay=\|photoCount=\|onContact=" ListingCard.tsx` →
   0 hits inside the horizontal block).
2. **Node mapping matches preserved behavior.**
   ✅ thumb `AppImage variant="listing-thumb"` + `Maximize2 h-6 w-6` fallback (`:143-149`), inline
   `FavoriteButton className="shrink-0 -mt-0.5 -mr-1"` (`:152-161`), footer copy-id (`idCopied` state,
   `copyId` handler, `#public_id`/`Copy`/`Check`) + date (`:172-189`), pre-translated `patternBadges`
   (`:163`), pre-rendered feature-icon nodes `h-3.5 w-3.5` (`:165-168`, matches the vertical mapping per
   the kickoff's convergence item), converted price/old/per-sqm/`originalPriceStr` (`:199-207`, `:170`,
   reusing the same `displayPrice`/`displayPriceOld`/`originalPriceStr`/`pricePerSqm` already computed
   above the branch split — byte-identical currency logic to the vertical branch and to the pre-migration
   legacy code).
3. **Now-unused locals/imports removed ONLY if truly unused, vertical untouched.**
   ✅ `PriceBlock`/`PriceBlockProps` deleted (was legacy-horizontal-only). `Badge` import removed (was used
   only inside the removed `<Badge>` badge-rendering JSX — the vertical branch never imported/used `Badge`
   directly, badges are rendered by the pattern itself). `cn` import removed (only 3 usages existed in the
   whole file pre-change: `PriceBlock`'s size class, the horizontal Link's className, the horizontal Badge
   className — all three gone). `MapPin` import removed (only usage was the legacy horizontal branch's own
   location `<span>`; the pattern renders location+MapPin internally for both layouts). Verified via
   `grep -n "\bcn(\|MapPin\|<Badge" ListingCard.tsx` → 0 hits post-change. `npx tsc --noEmit` → 0 errors
   (an unused import is a lint warning, not a compile error, but lint was also run clean — see Gates).
   Vertical branch (`:223-319`) byte-diff-untouched (only the horizontal block above it changed).
4. **Public API + callers unchanged.**
   ✅ `ListingCardProps` interface untouched (`variant?: 'vertical' | 'horizontal'` unchanged). `grep -rn
   "<ListingCard" src/` shows callers: `ListingsShell.tsx`, `LatestListings.tsx`, `FeaturedListings.tsx`,
   `RecentlyViewedGrid.tsx`, `SimilarListings.tsx`, `ListingsTab.tsx` (cabinet) — none touched, `git diff
   --stat` confirms zero changes outside the 3 in-scope files.
5. **Authorized convergence deltas documented with before/after evidence.** See table below.
6. **Rendered verification matrix** — see below. Persisted `docs/sessions/2026-07-15-task608-assets/`
   (28-cell manifest + 8 screenshots: sq/en/uk/it@2560, uk@320/375/390, + title-hover-list-desktop.png).
7. **Regression test added for the horizontal path + planted-violation transcript.** See below.
8. **Gates** — see below, all green.
9. **Session log + backlog.md** — this file + backlog update.

## UX-flow trace

**Positive flow:** visitor on `/{locale}/listings` clicks the List toggle (`ListingsSortBar`, ≥640px only —
pre-existing, out-of-scope UI) → each listing renders one full `<Link>` row via
`MantineListingCardPattern layout="list"` → thumb image, badges, type label, inline favorite, title, price
(+old/per-sqm), features, location, copy-id+date all render → hovering elevates the card (TailAdmin
`shadow-theme-lg`) and turns the title brand-red (parity with grid, the Task 610-adjacent fix already
shipped) → clicking the row navigates (`data-track`/`onBeforeNavigate` fire); clicking favorite toggles
without navigating; clicking copy-id copies the id without navigating and flips to `Check` for 1.5s.
**Verified**: all of the above reproduced on the real `next dev` server (see rendered matrix + hover check).

**Negative flows** (all exercised via the extended smoke suite + the real-page matrix):
- No cover image → `Maximize2` fallback renders (h-6 w-6, matching the legacy list-row size), row still
  clickable — `ListingCard.smoke.test.tsx` "no-image listing renders the fallback".
- Closed listing (sold) → status badge shows, `FavoriteButton` disabled with `closedLabel`, no rotated
  overlay in the list row (list design never had one — confirmed absent both structurally, per the
  pattern's early-return, and at runtime via the QA script's `hasOverlay` check across all 28 cells) — nav
  still allowed. `ListingCard.smoke.test.tsx` "sold listing" test.
- Archived → `grayscale opacity-60` on the card (via `isArchived` prop → pattern's own class), badge shows,
  no hover-opacity flip (converged, see delta table) — `ListingCard.smoke.test.tsx` "archived listing" test.
- Favorite toggle while unauthenticated/error → untouched, `FavoriteButton` itself not modified; inline
  placement doesn't change its internal behavior (same component instance, only `className` differs from
  the vertical branch's `absolute` positioning — an intentional, pre-existing contract difference the
  pattern already documents).
- Copy-id rapid click → `idCopied`/`setTimeout` logic byte-identical to the pre-migration code (moved
  verbatim into `listFooterActions`), debounces the icon swap; `e.preventDefault()`/`stopPropagation()`
  unchanged — verified no navigation fires on copy-id click (same handler wiring as before).
- `prefers-reduced-motion` → the pattern's own CSS module already disables transform/zoom under this media
  query (unchanged file, `MantineListingCardPattern.module.css`); applies uniformly to `layout='list'` since
  it shares `.card`'s hover rules.
- RTL/long titles (uk/it) at 320 → `line-clamp-2` on the `<h3>` (pattern-owned), confirmed no clip/h-scroll
  in the uk@320/375/390 mandatory screenshots.
- No location → pattern renders the empty `<span />` placeholder (pattern-owned, unchanged by this task);
  footer stays right-aligned via the pattern's own flex layout.

## Convergence-delta table (owner-authorized, item 3 of the kickoff)

| Legacy horizontal (pre-Task-608) | Now (via pattern, Task 606-approved) | Evidence |
|---|---|---|
| `hover:shadow-md` (non-premium) / `hover:shadow-listing-card-elevation-md` (premium) | Pattern's `.card:hover` → TailAdmin `shadow-theme-lg` / `.premium:hover` → `--shadow-listing-card-elevation-lg` | `MantineListingCardPattern.module.css:56-69` (unchanged by this task — inherited from Task 602/606); rendered proof: `title-hover-list-desktop.png` shows the elevated/bordered look on hover |
| `hover:opacity-70` on archived | No archived hover-opacity change (resting `grayscale opacity-60` kept) | Pattern has no archived-hover rule (confirmed by reading `.module.css` — no `.card.archived:hover` or similar); `ListingCard.smoke.test.tsx` "archived listing" test asserts `.grayscale.opacity-60` present, no hover-opacity assertion added (none exists to preserve) |
| `rounded-xl` | `radius="md"` (Mantine `Card` prop, pattern-owned) | `MantineListingCardPattern.tsx:124` (unchanged — inherited) |
| Feature icons `h-3 w-3` | `h-3.5 w-3.5` (matches the vertical mapping) | `ListingCard.tsx:166` — the kickoff's explicit "converge to the vertical mapping's `h-3.5 w-3.5`" instruction |

No other visual change shipped — anything not in this table is out of scope and was left untouched
(confirmed by diffing the rendered screenshots' structure against the Task 606 approved Storybook
`layout="list"` section, which already encoded these same 4 deltas).

## Control inventory (nothing dropped)

| Control | Before (legacy horizontal) | After (pattern mapper) | Status |
|---|---|---|---|
| Favorite heart | `FavoriteButton`, inline, `shrink-0 -mt-0.5 -mr-1` | Same component, same className, passed as `favorite` node | ✅ present |
| Copy-id button | `#id` + `Copy`/`Check` icon, `idCopied` state | Same JSX moved verbatim into `listFooterActions` | ✅ present |
| Date stamp | `formatListingDate` next to copy-id | Same, in `listFooterActions` | ✅ present |
| Badges (new/reduced/sold/rented/archived/expired) | `<Badge>` loop in the image corner | Pattern's own badge rendering, driven by `patternBadges` data | ✅ present |
| Features row | `getCardFeatures` + `ListingFeatureIcon` | Same data source, passed as `features` node array | ✅ present |
| Location + MapPin | Local `<span>` + `MapPin` icon | Pattern-owned (`data.location`) | ✅ present |
| Thumb image + no-image fallback | `AppImage variant="listing-thumb"` + `Maximize2` | Same variant + fallback, passed as `image` node | ✅ present |
| Title hover → brand-red | N/A (legacy had `group-hover:text-primary` too) | Pattern's `<h3 group-hover:text-primary>` (Task 606/610 fix) | ✅ present, verified via computed-style hover diff |

## Rendered verification matrix (clause 12)

Real `/[locale]/listings` List view, live `next dev` server (`scripts/task608-qa-listingcard-list-site.mjs`).
Breakpoints 320·375·390·768·1280·1440·2560 × sq·en·uk·it (28 cells). The mobile Grid/List toggle
(`ListingsSortBar.tsx`, `hidden sm:flex`, pre-existing/out-of-scope) only exists ≥640px, so each locale's
page navigates once at 1280px, clicks List (client `useState`, unaffected by a later resize), then the SAME
page is resized down through every breakpoint — genuine rendering of the already-active list layout at
mobile widths, not a fabricated shortcut.

**Result: 28/28 PASS.** Each cell checked: row found, not exceeding the viewport, no row-own overflow,
full-width at `<640` (row width == parent column width, within 2px), favorite present + inline (not
`position:absolute`), no overlay, no photo-count pill, no contact `Card.Section`, footer actions present,
feature icon(s) present, image present, title present.

**Known, pre-existing, out-of-scope finding (not a Task 608 defect):** `document.documentElement.scrollWidth
> clientWidth` (page-level) is `true` at 320/375/390 on ALL cells, including the untouched Grid view —
already tracked in `docs/backlog.md` Pending Action Items ("Pre-existing `/listings` Grid
horizontal-overflow at <640px … FilterBar segmented-control + Combobox trigger push scrollWidth past the
viewport"). Verified directly before writing the pass criteria: Grid view at `en@375` measures
`scrollWidth=507` against `clientWidth=375` with the SAME offender elements (`listings-sort-bar`,
`flex-1 min-w-0`, container ancestors) topping out at `right:359`; switching to List view at the same
viewport reproduces the exact same `scrollWidth=507` — byte-identical, and the `ListingCard` row itself
does not appear among the top overflow offenders. Direct row-level measurement: the list row's own
`getBoundingClientRect().right` = 359 (well within `clientWidth=375`), `scrollWidth === clientWidth` on the
row element itself (no own-overflow). **Conclusion: Task 608 introduces zero additional overflow; the
existing bug is caused entirely by `ListingsSortBar`/`FiltersPanel` elements untouched by this task.**

Mandatory screenshots persisted under `docs/sessions/2026-07-15-task608-assets/`:
`list__{sq,en,uk,it}__2560.png`, `list__uk__{320,375,390}.png`, `title-hover-list-desktop.png`,
`manifest.json` (28-cell machine-readable results).

Title-hover check (real desktop pointer, `/en/listings` List view): `before=rgb(0, 0, 0)` →
`after=lab(53.6235 50.0675 26.6087)` (the brand-red token), `changed=true`.

## Regression coverage (clause 15)

`docs/critical-flow-registry.md` row "Listing card rendering — Mantine pattern is the COMPLETE single source
of truth (Grid/Latest) + horizontal List view (unchanged)" (P0/P1 — Listings lifecycle) — scanned, baselined
green BEFORE the change (13 pre-existing tests, all passing), extended, and appended with a Task 608 note
recording this migration + the new coverage (row title's "+ horizontal List view (unchanged)" clause is now
stale — this is a follow-up documentation nuance: the horizontal branch now ALSO consumes the pattern, so
"unchanged" describes the pre-Task-608 state the row was written against; the appended Task 608 paragraph
supersedes it for the coverage record without rewriting the whole historical row).

`ListingCard.smoke.test.tsx`'s horizontal-branch describe block grew from 2 tests (basic render + legacy
strike-through) to 5 tests (content-parity incl. no-photo-count-pill; reduced-price strike+badge;
sold-disabled-favorite; no-image fallback; archived dimming) — mirroring the vertical branch's own test
depth. Full suite: 13/13 PASS.

**Planted-violation transcript:**
```
if (variant === 'horizontal' && false) {   // planted
```
Result: 2/13 tests genuinely FAILED —
- "renders the preserved content set through MantineListingCardPattern layout=\"list\"" — `link` had class
  `listing-card listing-card--vertical block h-full` instead of `listing-card--horizontal` (fell through to
  the vertical render).
- "reduced-price listing shows old price struck through + the price_reduced badge" — old-price element had
  `mantine-Text-root` classes (grid `<Text>`) instead of the expected `line-through` Tailwind span (list
  layout's own price markup).

Reverted (`variant === 'horizontal'`) → 13/13 PASS again. Not a no-op gate.

## Gates

```
npx tsc --noEmit                                              → 0 errors
npx eslint src/modules/listings/components/ListingCard.tsx \
  src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
                                                                → 0 problems
npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
                                                                → 13/13 PASS
npm run check:i18n                                             → PASSED, 2156 keys × 4 locales (no new keys — expected)
npm run check:file-integrity                                   → PASSED, 160 files clean (0 NUL, no BOM, parses, not truncated)
npm run check:mojibake                                         → 0 artifacts in 1747 files
BASE_URL=http://localhost:3000 node scripts/task608-qa-listingcard-list-site.mjs
                                                                → 28/28 PASS
```
`npm run build` not run — this is a presentational-mapper swap over an already-approved, unchanged pattern
component (Task 606), not a structural/routing change; `tsc`+full smoke suite+live rendered matrix cover the
real risk surface.

## Self-validation

AC 1–9 all satisfied per the tables above. Both the positive flow and every listed negative flow were
exercised. Rendered matrix: 28/28 PASS at all 7 breakpoints × 4 locales, uk@320/375/390 + all-locale@2560
screenshots persisted. Regression test extended with a genuine planted-violation (2/13 FAIL → revert →
13/13 PASS). No scope creep: only the 3 in-scope files + the ad hoc QA script (same convention as Tasks
605/606) touched; `MantineListingCardPattern.tsx`/`.module.css`/story, `FavoriteButton`, `AppImage`,
`presentationEngine`, the vertical branch, and all other consumers are untouched (grep + diff confirmed).

**Self-validation: PASS.**

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/ListingCard.tsx` | Replaced the legacy hand-rolled `variant==='horizontal'` markup with a thin data-mapper over `MantineListingCardPattern layout="list"`; removed the now-dead `PriceBlock` helper and unused `Badge`/`cn`/`MapPin` imports. |
| `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` | Extended the horizontal-branch describe block from 2 to 5 tests (content-parity, reduced-price, sold, no-image, archived) to match the vertical branch's coverage depth; updated the file header docstring. |
| `scripts/task608-qa-listingcard-list-site.mjs` | New ad hoc rendered-evidence script (same convention as `task605-qa-listingcard-complete.mjs`/`task606-qa-listingcard-list-layout.mjs`) — drives the real `/[locale]/listings` List view across the 28-cell breakpoint×locale matrix + a title-hover check, persists screenshots + manifest under `docs/sessions/2026-07-15-task608-assets/`. |
| `docs/critical-flow-registry.md` | Appended a Task 608 paragraph to the listing-card-rendering row recording the horizontal-branch migration + its new regression coverage + rendered evidence. |
| `docs/sessions/2026-07-15-task608-assets/` | Persisted rendered-evidence screenshots (8 PNGs) + `manifest.json` (28-cell machine-readable matrix). |
| `docs/sessions/2026-07-15-task608-listingcard-list-layout-site-migration.md` | This session log. |
| `docs/backlog.md` | Last Session entry + tidy (older entries archived). |

No `git add`/`git commit` run — orchestrator emits commit commands at review per the single-writer rule.
