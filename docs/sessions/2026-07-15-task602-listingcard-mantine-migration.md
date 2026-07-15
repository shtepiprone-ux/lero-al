# Session Archive: Task 602 — Extend `MantineListingCardPattern` (price + reduced-price + hover) and make it the live VERTICAL listing card — 2026-07-15

Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_602_ListingCardMantineMigration.md` (updated mid-task by the
owner after a STOP-AND-ASK — see "Ambiguity resolved" below).

## Ambiguity resolved (STOP-AND-ASK, before any code change)

The original kickoff claimed "confirmed by grep" that only `LatestListings.tsx:55` uses `variant="horizontal"`.
A grep before writing any code found a **second** consumer: `ListingsShell.tsx:234` —
`variant={view === 'list' ? 'horizontal' : 'vertical'}` — the `/listings` search page's List/Grid toggle. Retiring
`horizontal` as originally instructed would have silently broken/removed that existing control (Note 20/21
violation). Raised via `AskUserQuestion`; the owner updated the kickoff instead of answering inline: **keep
`variant` on `ListingCard`, keep the horizontal branch exactly as-is (List view), migrate ONLY the vertical branch
to the Mantine pattern.** All work below follows the updated kickoff.

## What changed vs what stays (grep-verified, matches the updated kickoff)

- `LatestListings.tsx:55` — dropped `variant="horizontal"` (now renders vertical, matching Latest's grid intent —
  this was the 320px cramping the owner originally reported).
- `ListingsShell.tsx:234` — **UNCHANGED**, confirmed by grep. List view still renders the horizontal branch,
  Grid view still renders vertical.
- `FeaturedListings.tsx`, `RecentlyViewedGrid.tsx`, `SimilarListings.tsx` — already default to vertical, untouched.

## Content parity (vertical card) — before/after control inventory (Note 20)

| Content item | Before (inline JSX) | After (Task 602) | Kept? |
|---|---|---|---|
| Currency conversion (`displayCurrency`/`rates`/`convertPriceMulti`) | inline in `ListingCard` | unchanged, in `ListingCard` (container) | ✅ |
| `originalPriceStr` (always-'en' grouping) | `PriceBlock` sub-line | `footerSlot` sub-line (own row, above date/id) | ✅ (moved) |
| Status badges (sold/rented/archived/expired/new/price_reduced) | children of `AppImage` | children of `AppImage`, now passed via `imageSlot` | ✅ (unchanged JSX) |
| Sold/Rented rotated overlay | child of `AppImage` | child of `AppImage`, via `imageSlot` | ✅ (unchanged JSX) |
| Premium styling (top stripe + ring/elevation) | Tailwind classes on the card `<Link>` | `isPremium` prop on the pattern → CSS module `.premium` (ring at rest, brand elevation shadow on hover) — see "Hover CSS-cascade finding" below for why this moved to a CSS module | ✅ |
| Favorite button (disabled + `disabledLabel` when closed) | child of `AppImage` | child of `AppImage`, via `imageSlot` | ✅ (unchanged JSX) |
| Photo count badge | child of `AppImage` | child of `AppImage`, via `imageSlot` | ✅ (unchanged JSX, "confirm" item — default KEEP, no objection raised) |
| Features row (icons + value, `getCardFeatures`) | inline `<div>` in content block | `featuresSlot` prop, same markup | ✅ (unchanged JSX, moved) |
| Location (`name_al`) | inline `<span>` with `MapPin` | now the pattern's OWN dedicated location line (with `MapPin`, added to the pattern) | ✅ (structure adopts the pattern's own line, per owner directive) |
| Per-m² price line | inline in `PriceBlock` | `footerSlot`, own row | ✅ ("confirm" item — default KEEP, no objection raised) |
| Copy-ID button (1.5s Check/Copy swap, stopPropagation+preventDefault) | inline in content block | `footerSlot`, unchanged JSX/logic | ✅ ("confirm" item — default KEEP) |
| Listing date (`formatListingDate`) | inline in content block | `footerSlot`, unchanged | ✅ ("confirm" item — default KEEP) |
| `<Link>` nav (`data-track`/`data-listing-slug`/`onBeforeNavigate`) | wraps the whole card | wraps `<MantineListingCardPattern>` (no `onClick` passed to the pattern itself — the enclosing `<Link>` owns navigation) | ✅ |
| Type label (`listing_type · property_type`) | plain `<p>` above title | new `typeLabel` prop on the pattern, rendered above title | ✅ |
| `onContact` (pattern's contact CTA) | N/A (card never had one) | **not passed** — click = navigate, per kickoff default | ✅ (explicitly out — no CTA existed before) |

Nothing was silently dropped. The **only** authorized removal is `variant="horizontal"` on `LatestListings`' call
site (never the branch itself).

## Presentational-split gate (owner P0)

The kickoff (v2) directs the pattern **itself** to become the live vertical card — `MantineListingCardPattern` IS
the presentational primitive (prop-driven, no hooks, no data/network) and `ListingCard.tsx` is the thin container
(owns `useTranslations`/`useLocale`/`useState`/currency conversion/favorite wiring). No separate `ListingCardView`
file was created — the split gate is satisfied by the pattern itself, matching `docs/component-rules.md` →
"Container / Presentational Primitive Split".

## Hover CSS-cascade finding (real bug caught + fixed before shipping)

The first implementation used Tailwind `hover:`/`group-hover:` utility classes directly on the Mantine `Card`/
`Image` (as the kickoff's §18 note suggested as one of two valid options). **Verified via computed-style diffing
in a real browser (Playwright) that this silently did nothing** — `boxShadow`/`transform` were byte-identical
before/after `:hover`. Root cause: Mantine's `Card` sets its own box-shadow/border via **unlayered** CSS; Tailwind
v4 wraps all utilities in `@layer utilities`, and per the CSS Cascade Layers spec an unlayered declaration always
wins over a layered one regardless of selector specificity or source order — so no Tailwind `hover:shadow-*`
class can ever override Mantine's own box-shadow on a `Card`. Fixed by switching to a plain (unlayered) CSS
module — `MantineListingCardPattern.module.css` — which competes with Mantine's CSS on equal footing. Re-verified
via the same computed-style diff: `boxShadow` now correctly changes `none` → the TailAdmin `shadow-theme-lg`
value, `transform` changes `none` → `translateY(-2px)` (card) / `scale(1.05)` (image) on hover, and both revert to
`none` under `prefers-reduced-motion: reduce` (Playwright `page.emulateMedia({ reducedMotion: 'reduce' })`,
confirmed 0 transform on both card and image). `:hover` rules are additionally scoped to
`@media (hover: hover) and (pointer: fine)` — the same guard Tailwind's own `hover:` variant applies by default —
so a tap on a touch device cannot leave the card "stuck" zoomed/elevated.

## UX flow trace

- Entry: `/{locale}` (homepage Latest, now vertical), `/{locale}/listings` Grid view, favorites/cabinet grids.
- Step 1: card renders (photo → badges/overlay/favorite/photo-count → type → title → location → features →
  price[+old] → per-m²/original-price line → copy-id/date).
- Step 2: hover (desktop) → photo zooms + card elevates; click anywhere else → navigates via `<Link>`.
- Step 3: favorite click → `stopPropagation`+`preventDefault`, toggles, does not navigate; disabled+labeled when
  closed. Copy-ID click → same guard, 1.5s Check/Copy swap, does not navigate.
- List view (`/listings`, `view=list`) → unaffected, still the horizontal branch, confirmed by a dedicated
  regression test + grep.

## AC-by-AC self-audit

| AC (from the updated kickoff) | Where verified | Result |
|---|---|---|
| 1. Pattern extended additively (price variants); structure/layout/adaptation/API otherwise unchanged | `MantineListingCardPattern.tsx` diff — all new props optional, Default story fixtures 1–3 pixel-unchanged (no `priceOld`/`imageSlot`/etc. passed) | ✅ |
| 2. Story extended additively (regular + reduced-price), single `Default`, toolbar-driven, i18n parity | `ListingCardPattern.stories.tsx` — 4th card added; `card_price_old_1` × 4 locales; `check:stories`/`check:i18n` green | ✅ |
| 3. `ListingCard` vertical branch = thin container over the pattern; API stable; horizontal branch still works | `ListingCard.tsx` diff; regression test `ListingCard — horizontal branch` suite | ✅ |
| 4. `LatestListings.tsx` drops `variant="horizontal"`; `ListingsShell.tsx` unchanged; grep confirms blast radius | `LatestListings.tsx` diff; grep transcript above | ✅ |
| 5. Content parity — every "keep" item reproduced, "confirm" items recorded | Control inventory table above | ✅ |
| 6. Reduced-price: old struck + new, TailAdmin-cited, sq/en/uk/it; plain-price no strike | Screenshots `listingcard_{uk,sq,en,it}_*.png` (4th card in each); regression test | ✅ |
| 7. Hover: zoom + TailAdmin-cited elevation shadow; `prefers-reduced-motion` guarded; no layout shift; proven via rendered hover-state capture | Computed-style diff (before/after hover) + reduced-motion diff, both pasted above; screenshots `listingcard_{hover,nohover}_en_1280.png` | ✅ |
| 8. Hydration-safe; regression test added (vertical + horizontal) with green baseline + planted-violation FAIL; registry updated | `ListingCard.smoke.test.tsx` (8 tests); 2 independent planted-violation FAILs (below); registry row added | ✅ |
| 9. Rendered matrix (breakpoints × sq/en/uk/it, uk@320/375/390 mandatory) | 10 screenshots captured (uk@320/375/390/1280, sq/en/it@375/1280) — see "Rendered matrix" below | ✅ |
| 10. TailAdmin conformance proven side-by-side; gates green | `shadow-theme-lg`/`shadow-listing-card-ring`/`shadow-listing-card-elevation-lg` all §5/pre-existing-token citations, zero invented values; tsc/eslint/build/i18n/stories/file-integrity/mojibake all green (transcripts below) | ✅ |
| 11. Session log complete (this file) | — | ✅ |

## Rendered matrix (clause 12)

Captured via Playwright against the live Storybook `Patterns/Mantine/ListingCardPattern` → `Default` story
(deterministic fixtures — regular/premium/plain/reduced-price cards), full-page screenshots:

| Locale | Widths captured |
|---|---|
| uk (mandatory) | 320, 375, 390, 1280 |
| sq | 375, 1280 |
| en | 375, 1280 |
| it | 375, 1280 |

All 10 cells: photo-first vertical layout, full card width in its grid column, reduced-price card shows the old
price struck through + new price, no clipping/overflow, no horizontal scroll at 320/375/390, badges/type/location/
features all translate per locale. Plus: hover-state capture (zoom+shadow, computed-style-verified) and a
`prefers-reduced-motion: reduce` hover capture (verified 0 transform on both card and image). All 13 PNGs
persisted at `docs/sessions/2026-07-15-task602-assets/` (`listingcard_{locale}_{width}.png`,
`listingcard_hover_en_1280.png`, `listingcard_nohover_en_1280.png`, `listingcard_reducedmotion_hover_en_1280.png`);
the computed-style diff transcripts below are the primary (non-visual) proof for the hover mechanism itself.

### Hover computed-style transcript (before → after, `chromium`/Playwright, real mouse move)

```
BEFORE: boxShadow: 'none', transform: 'none'
AFTER:  boxShadow: 'rgba(16, 24, 40, 0.08) 0px 12px 16px -4px, rgba(16, 24, 40, 0.03) 0px 4px 6px -2px'
        transform: 'matrix(1, 0, 0, 1, 0, -2)'   (card, -2px lift)
        image transform: 'matrix(1.05, 0, 0, 1.05, 0, 0)'   (1.05x zoom)
```

### Reduced-motion transcript

```
prefers-reduced-motion: reduce, hovered:
  cardTransform: 'none'
  imgTransform:  'none'
```

## Planted-violation transcripts (clause 15)

**Violation A — dropped the `priceOld` strike-through branch** (`MantineListingCardPattern.tsx`, reverted to
always rendering the plain single-price `<Text>`):

```
FAIL  ListingCard — vertical branch > reduced-price listing (price_old > price) shows old price struck through + new price
  screen.getByText('92,000 EUR') — TestingLibraryElementError: Unable to find an element with the text: 92,000 EUR.
 Test Files  1 failed | Tests 1 failed | 7 passed (8)
```
Reverted → 8/8 PASS.

**Violation B — disabled the horizontal branch** (`ListingCard.tsx`, `if (variant === 'horizontal')` →
`if (false && variant === 'horizontal')`, simulating the exact regression this task must prevent — the vertical
migration silently swallowing the List view):

```
FAIL  ListingCard — horizontal branch > still renders with variant="horizontal" after the vertical-branch migration
  expect(element).toHaveClass("listing-card--horizontal")
  Received: listing-card listing-card--vertical block h-full
 Test Files  1 failed | Tests 1 failed | 7 passed (8)
```
Reverted → 8/8 PASS.

## Gates (all green, transcripts abbreviated)

```
npx tsc --noEmit                    → 0 errors
npx eslint <touched files>          → 0 errors (1 pre-existing "no config for .css" warning, expected)
npm run build                       → succeeds, 40/40 static pages
npx vitest run ListingCard.smoke.test.tsx → 8/8 PASS
npm run check:i18n                  → 2145 keys × 4 locales, parity PASSED (incl. new `storybook.mantine.card_price_old_1`)
npm run check:mojibake              → 0 artifacts in 1721 files
npm run check:file-integrity        → 12 files clean
npm run check:stories               → 116 files, 0 violations
```

Pre-existing, unrelated baseline noise observed (NOT introduced by this task — confirmed via `git status`, none
of these files are in this diff): `check:design-tokens --strict` flags 9 `min-[390px]` arbitrary-viewport findings
in `HeaderView.tsx`/`NotificationCenter.tsx`; `check:story-coverage` flags 5 pre-existing uncovered components
(`HeaderActions`/`HeaderView`/`MobileNavDrawer`/`UserMenu`/`HeroSearchView`); the full `npx vitest run` (whole
repo) surfaces 3 pre-existing flaky/environment failures in `RangeDatePicker.smoke.test.tsx`/
`saveSavedSearch.dedup.test.ts` (timeouts, unrelated files) plus a stray git worktree
(`.claude/worktrees/shimmering-yawning-pony/`, a leftover checkout from earlier work, not touched/removed by this
session) whose duplicated test files fail on missing Supabase env vars — excluded from this task's verification
via `--exclude '**/.claude/**'`.

Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime=Storybook rendered matrix + computed-style
hover proof PASS · scope=clean (grep-verified blast radius matches kickoff) · integrity=PASS

## Files Changed

| File | Rationale |
|------|-----------|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Additive: `priceOld`/`imageSlot`/`typeLabel`/`featuresSlot`/`footerSlot`/`isPremium`/`isArchived` props; switched hover/premium state styling from (silently-broken) Tailwind utility classes to the new CSS module. |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | New — hover zoom/elevation + premium ring/elevation, unlayered so it can actually override Mantine's own Card box-shadow (see "Hover CSS-cascade finding"); `prefers-reduced-motion` + `(hover:hover)` guarded. |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | Additive: 4th reduced-price card in the existing `Default` story. |
| `messages/{en,sq,uk,it}.json` | New `storybook.mantine.card_price_old_1` key × 4 locales (story fixture only). |
| `src/app/globals.css` | Added `--shadow-theme-xs`/`--shadow-theme-lg` Tailwind tokens (§5-cited, mirrors the existing Mantine `theme.ts` override) — ended up unused by the final CSS-module hover implementation (the module inlines the same cited literal directly, single-sourced against §5) but kept as it's a legitimate, correctly-cited addition other non-Mantine consumers can reuse. |
| `src/modules/listings/components/ListingCard.tsx` | Vertical branch rewritten as a thin container over the pattern (imageSlot/featuresSlot/footerSlot composition); horizontal branch byte-unchanged. |
| `src/modules/listings/components/LatestListings.tsx` | Dropped `variant="horizontal"`; `RowSkeleton` reshaped to the vertical (photo-top) card silhouette to match. |
| `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` | New — regression test (vertical Mantine render + reduced-price strike + horizontal-still-renders + hydration-safe always-'en' grouping), 2 planted-violation FAILs verified. |
| `docs/critical-flow-registry.md` | New row for the `ListingCard` vertical-Mantine-migration flow (below). |
| `docs/backlog.md` | Last Session summary + task-numbering line updated. |
| `docs/backlog-archive.md` | Task 601's prior "Last Session" entry moved to the top ledger row. |
