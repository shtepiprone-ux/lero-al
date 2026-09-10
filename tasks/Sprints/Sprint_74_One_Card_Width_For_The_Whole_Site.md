# Sprint 74 — one card width for the whole site

**Opened 2026-09-10 by owner instruction**, after the owner compared the live homepage and listing page against
Booking.com: *"приведи нахуй все до одного стандарту ширини і щоб на всіх breakpoints все виглядало чудово"*.

## Goal

Every listing card on the site is sized by **one number**, not by five hand-authored column ladders. The card's
width becomes an owned contract; the column count becomes the browser's arithmetic.

## The measured defect (2026-09-10, read from the files, not from a screenshot)

Five surfaces render `ListingCard`. All five size it differently, and no two agree at any width:

| Surface | Mechanism | <640 | 640 | 768 | 1024 | 1280 | 1440 |
|---|---|---|---|---|---|---|---|
| `FeaturedListingsView.tsx:91` | `SimpleGrid cols={{base:1,sm:2,xl:3,xxl:4}}` | 1 col | 2 | 2 | 2 | 3 | 4 |
| `LatestListingsView.tsx:63` | `SimpleGrid cols={{base:1,md:2,xxl:3}}` | 1 col | 1 | 2 | 2 | 2 | 3 |
| `RecentlyViewedGridView.module.css` | flex rail, card `calc(var(--mantine-spacing-xl)*8)` = 192px | 192px | grid 2 | 3 | 4 | 4 | 4 |
| `SimilarListingsView.module.css` | flex rail, `flex-basis: calc(100%/1.2 … /4.2)` | 83.3% | 45.5% | 31.25% | 23.8% | 23.8% | 23.8% |
| `ListingsShellView.tsx:127` | `SimpleGrid cols={{base:1,sm:2,xl:3,xxl:4}}` | 1 col | 2 | 2 | 2 | 3 | 4 |

`FACT` — at 560px the same card is 192px in "Recently viewed" and ≈433px in "Similar listings" (83.3% of the
~520px container). At 1024px it is half the container in Featured and a quarter in Similar. Each surface faithfully
reproduced its own pre-migration Tailwind chain; none was ever compared to its neighbour.

`FACT` — `FeaturedListingsView` and `LatestListingsView` pass **no** `layoutContext`, so their images fall back to
`LISTING_LAYOUT_SIZES.default` = `(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw`, which does not describe
either grid. `RecentlyViewedGridView` and `SimilarListingsView` both pass `'4-col'` while rendering different
widths. Every `sizes` hint on the site is wrong to some degree, and all four are `vw`-based, which cannot describe
an `auto-fill` track at all.

## Owner decisions — 2026-09-10, taken after the measured table above was put in front of the owner

- **D74-1 — mechanism.** One shared track: grids use
  `repeat(auto-fill, minmax(var(--listing-card-min), 1fr))`; rails use the same width in a horizontal scroll
  container. Per-surface `cols={{base,sm,xl,xxl}}` ladders are removed, not re-tuned. The rejected alternatives were
  a single shared breakpoint ladder and a rails-only fix.
- **D74-2 — the number.** `--listing-card-min` = **280px**. Rejected: 260px (denser, smaller photo) and 300px
  (only 3 columns at 1024px).
- **D74-3 — below 640px.** Section rails (Similar, Recently viewed, Featured, Latest) scroll horizontally with a
  visible peek of the next card; `/listings` search results stay a single full-width column. Rejected: two-up
  everywhere, and rails everywhere including search results.

`INFERENCE` (stated, to be measured in 806) — with D74-2 both halves of D74-3 fall out of the same expression with
**no media query**: a `min(var(--listing-card-min), 82%)` rail item is 236px at a 288px container (52px peek) and
280px from ~342px upward; an `auto-fill minmax(280px, 1fr)` grid is one full-width column below ~576px container and
two above it. The sprint's whole responsive behaviour is therefore two CSS rules and one custom property.

## Goal-fit — why this is a new sprint and not an existing one

| Sprint | Fits? |
|---|---|
| 46 (`ListingCard` de-Tailwind + overlay exit) | No — its retained scope is 743/744, and this is not a de-Tailwind slice; `ListingCard`'s internals are not touched here, only the track it sits in. |
| 55 / 56 / 57 / 61 / 62 | No — ARIA, enum leaks, deletions, projection layer, Tailwind runtime tokens. None is a layout contract. |
| 68 / 69 / 70 / 71 | No — each is a de-Tailwind migration of one route or surface, and its goal sentence says so. Mixing a cross-surface layout standard in breaks their own goal-fit rule (the precedent the 801/802 row already set). |
| 72 (similar-listings becomes a real search entry point) | No — 72 owns one block's behaviour and is at `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Re-opening its diff for a site-wide width contract would invalidate its reviewed evidence. |
| 73 (a sold listing is reachable but never listed) | No — visibility semantics. |

## Tasks

> **This table is the single state source for the sprint.** The execution-order note below is ordering and gating
> only; it never carries task state.

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **806** | The canonical listing-card track — one width, two modes, no breakpoints | P1 | **Q3** | `KICKOFF FILED` 2026-09-10 |
| **807** | Every card surface adopts the track, and the image `sizes` follow it | P1 | **Q3** | `RESERVED` |

**Execution order: 806 → 807.** 806 creates the shared source and its canonical story and changes **nothing**
visible — the five consumers are byte-unchanged, so the site looks identical at every commit until 807. 807 is the
single visible change: all five surfaces switch to the track in one diff, and `LISTING_LAYOUT_SIZES` is re-derived
for a track-based layout in the same task, because a `vw` hint cannot describe an `auto-fill` column and leaving
them behind would ship a bandwidth regression.

This is the project's own canonical-story-before-consumer-composition rule applied at sprint scale: the standalone
visual contract exists and is proven before any parent composes it.

## Preconditions

1. Task **803** reaches `APPROVED` / `APPROVED WITH NOTES` first. 807 edits `SimilarListingsView.module.css` and
   `SimilarListingsView.tsx`, both uncommitted 803 artifacts; starting 807 over an unreviewed 803 diff makes both
   unreviewable. 806 touches none of them and may start immediately.
2. `next start` with the seeded dev database, for 807's rendered evidence.

## Exit criteria

1. 806 and 807 both `APPROVED` / `APPROVED WITH NOTES`.
2. A repo-wide grep finds no per-surface listing-card column ladder: no `cols={{` on a `SimpleGrid` that wraps
   `ListingCard`, and no `flex-basis`/fixed `width` card rule in a listing section's CSS module.
3. The owner's visual matrix confirms one card width across the homepage, `/listings`, and the listing detail page
   at 320 / 390 / 768 / 1024 / 1440.
