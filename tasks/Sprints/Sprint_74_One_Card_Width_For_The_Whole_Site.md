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

> **MEASURED 2026-09-10 (Task 806, `runs/reverted-clean-1`) — one cell of the table below was wrong, and the correction is instructive.** The grid ladder is exact: 320 → 1 column, 390 → 1, 768 → 2, 1024 → 3, 1440 → 4. The rail is exact from 390 upward (280px). At **320 the rail's card measures 262.4px, not 236px**: the 236px figure was computed against a ~288px *inner* container (assuming ~16px page gutters), while the standalone story has no page chrome, so its container is the full 320px and `82% × 320 = 262.4`. The mechanism is confirmed; only the assumed container width was off. On a real page with gutters the 236px figure will hold — Task 807's rendered evidence is what settles that.

- **D74-4 — Featured and Latest are rails.** Owner decision 2026-09-10, taken on Task 807's kickoff §5: both homepage sections scroll horizontally at **every** width, exactly like "Similar listings" and "Recently viewed". `/listings` search results remain the only `grid` consumer of the track. This closes the last open question in the card-width contract; it is not the executor's to re-decide.

- **D74-6 — on a rail, `--listing-card-min` is a MAXIMUM, not a fixed width.** Owner decision 2026-09-10, correcting the orchestrator: the rail card shrinks to a fraction of the track whenever that is what keeps a tail of the next card visible, and never exceeds 280px. In the grid it stays the `minmax()` **minimum**. **Mechanism, measured on the owner's cited reference 2026-09-10:** card width = `100%/n − offset/n²` of the track, with `n` (fully visible cards) set by a breakpoint ladder — so `n` cards occupy `100 − offset/n` percent and the peek is always `offset/n`, never the leftover after a whole number of fixed cards. Verified against that page's own computed values (`n=4` → 23.125%, measured 168.34px in a 728px track; `n=5` → 18.8%). This deliberately re-admits media queries **on the rail only** — the grid keeps none. Reason, measured: with a fixed 280px card and a 16px gap, a container of 872px fits exactly three cards and leaves **0px** of the fourth showing even when a fourth exists, so the row reads as a finished grid — the pre-806 `calc(100% / 1.2)`…`/4.2)` ladder had this right, and 806 lost the affordance when it collapsed the ladder to one fixed width. Scope of the rule: a peek is required whenever **more cards exist than fit**; when the section holds only as many cards as fit there is nothing beyond the edge, and the correct behaviour is no peek, no thumb and no controls.

- **D74-5 — a lone card fills the rail up to 480px.** Owner decision 2026-09-10, from the live review: a rail holding exactly one card stretches it to the full track width from 320px through **480px inclusive**; above 480px the standard `min(var(--listing-card-min), 82%)` rule applies. This is the **single permitted exception to D74-1's "no media query in the track"**, bounded to that one case and required to carry a source comment naming this decision.

- **Owner instruction, 2026-09-10 — «все має бути канонічним, з токенами, зі Story, ніякого хардкоду».** Binding on every task in this sprint: each new visual value resolves to a token whose *definition* was grepped (not its documentation row), no `design-tokens-allow` marker or allowlist entry is added to get a gate green, and every new state is proven in the canonical Storybook story. A value with no approved provenance is `CANONICAL STYLE DECISION REQUIRED`, not a local literal.

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
| **806** | The canonical listing-card track — one width, two modes, no breakpoints | P1 | **Q3** | 🗄️ **APPROVED WITH NOTES — ARCHIVED** 2026-09-10 (verdict → session log §15). Native `win32` gates all 0; `runs/nat-clean-1` measures grid 1/1/2/3/4 and rail 262.39/280/280/280/280 at 320/390/768/1024/1440. Owner accepted visually. Notes P3: N1 no retained gate transcripts in the executor session (closed by the owner's native run), N2 the `css-var-resolvability` count moved 296→297 via this diff's one new `:root` token, N3 `clean-run-1..4` are debug artifacts. |
| **807** | Every card surface adopts the track, and the image `sizes` follow it | P1 | **Q3** | 🗄️ **APPROVED WITH NOTES — ARCHIVED** 2026-09-10 — 2026-09-10 — every requirement verified at source and by native measurement; **only the owner's §13 visual matrix is owed**, nothing for the executor to redo. AC6 parity exact: rail 236.16px @320 and 280px @390/768/1024/1440 on both `/` and the detail route; `/listings` grid 1/1/2/3/4. → [`Sprint_74_kickoff_prompt_Task_807_…`](Sprint_74_kickoff_prompt_Task_807_Every_Card_Surface_Adopts_The_Track.md) |
| **810** | The rail becomes usable: controls, a visible scrollbar, equal card heights | P1 | **Q3** | `KICKOFF FILED` 2026-09-10, from the owner's live review → [`Sprint_74_kickoff_prompt_Task_810_…`](Sprint_74_kickoff_prompt_Task_810_The_Rail_Becomes_Usable.md) |
| **809** | `FavoritesShell`'s Tailwind card grid adopts the track | P2 | Q2 | `RESERVED` — `FavoritesShell.tsx:202` is raw `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5`, a legacy Tailwind surface. Excluded from 807 on the legacy/current boundary rule; **this sprint does not close without it.** **Widened by 807's review 2026-09-10:** `RecentlyViewedSection.tsx:65`'s `RecentlyViewedSkeleton` is a second Suspense placeholder with the same grid→rail mismatch 807 fixed for Similar listings — raw Tailwind (`flex gap-3 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`, `w-48`), reproducing the *pre-807* Recently-viewed contract in front of a rail. It was absent from 807's own site table — a task-design omission, caught and reported by the executor rather than silently widened. Both legacy Tailwind card surfaces land together. |

**Execution order: 806 → 807 → 810 → 809.** 810 makes the rail operable before the two legacy Tailwind surfaces join it, so 809 adopts a finished contract rather than a half-finished one. 806 creates the shared source and its canonical story and changes **nothing**
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
2. **809 has landed** — otherwise `FavoritesShell` still carries its own ladder. A repo-wide grep finds no per-surface listing-card column ladder: no `cols={{` on a `SimpleGrid` that wraps
   `ListingCard`, and no `flex-basis`/fixed `width` card rule in a listing section's CSS module.
3. The owner's visual matrix confirms one card width across the homepage, `/listings`, and the listing detail page
   at 320 / 390 / 768 / 1024 / 1440.
