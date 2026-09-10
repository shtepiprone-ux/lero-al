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

- **D74-7 — `offset` = 36.** Owner decision 2026-09-10, taken on Task 810's review. D74-6's formula `100%/n − offset/n²` needs a number and no repo token encodes one. **36** is confirmed: measured live, every rung clears a real peek (87.7 / 112.9 / 48.7 / 48.8 / 74.6 / 38.4 / 50.9 / 22.4 / 16.8 px at 320-1440). Rejected: the reference site's own **30**, which leaves 0.64px at this site's real 1344px container — inside sub-pixel noise. This closes 810's `CANONICAL STYLE DECISION REQUIRED`; the value is cited as D74-7 in the track's CSS, not flagged as engineered.

- **D74-8 — a control click scrolls a whole snap-aligned page.** Owner decision 2026-09-10, taken on Task 810's review. `delta = floor(clientWidth / (cardWidth + gap)) × (cardWidth + gap)`, floored at one card — which lands on a scroll-snap point by construction, so nothing re-snaps it, and equals AC3's `clientWidth − peek` exactly. Measured cause of the correction: subtracting a whole card and letting `scroll-snap-type: x proximity` re-snap gave 200px where the criterion wanted 399px at a 448px track, and 515px against 773px at 824px. Rejected: card-granular paging, and relaxing the criterion to match the implementation.

- **D74-9 — the count ladder keys on the CONTAINER, not the viewport.** Owner decision 2026-09-10, taken from his own live reproduction. D74-6 shipped as `@media`, so the rail read the **window** width: at a ~1411px viewport the detail route's ~856px column selected the `n=5` rung derived for the homepage's 1344px container and rendered ≈159px cards, against 249px on the homepage **at the same moment** — a direct breach of D74-2, and the reason the rail stopped overflowing and its controls correctly vanished. The ladder becomes `@container` against a `container-type: inline-size` wrapper at the same `theme.ts` rungs (30/48/64/80em). **D74-5 stays a media query** — the owner stated it in screen terms. Rejected: re-derived non-token thresholds, and any per-surface rung override (that is the per-surface ladder D74-1 exists to delete).

- **D74-10 — Favorites is a `grid` consumer of the track.** Owner decision 2026-09-10, taken on Task 809's kickoff. `/favorites` is a paginated results page (`FavoritesShell.tsx:221` renders `ListingsPagination`), structurally identical to `/listings`. This **amends D74-4's** sentence "`/listings` search results remain the only `grid` consumer": the grid consumers are `/listings` **and** `/favorites`; every other card surface is a rail. Rejected: making Favorites a rail to keep D74-4 literally intact, which would put a horizontally scrolling list above a pager.

- **D74-11 — `'3-col-xl'` is deleted, in Task 809.** Owner decision 2026-09-10. Measured: it has exactly two consumers, `FavoritesShell.tsx:209` and `ListingCard.stories.tsx:171` (`FavoritesComposition`), both of which move to `'card-track-grid'` in that task, leaving the union member and its `LISTING_LAYOUT_SIZES` row dead. Task 807 kept it only because 809 was out of scope; that reason expires. Rejected: keeping the dead member and filing a separate cleanup.

- **D74-12 — the canonical page-frame width at ≥1440 is 1344px, and `/listings` adopts it.** Owner decision 2026-09-10, taken on Task 809's review. Measured, not reported: at a 1440px viewport `/favorites` renders a **1344px** container and `/listings` a **1312px** one, same 4-column count, so the 32px container gap divides into the **8px** card difference Task 809's probe hard-fails on. 809's own report root-caused this to `/favorites/page.tsx:83`'s legacy `.container-wide` and proposed changing favorites — the reviewer's re-measurement reversed it: Task 810's `rev1-baseline` recorded the **homepage** at 1344 too, so `/listings`' `ListingsPageFrame` is the outlier and favorites already agrees with the homepage. Filed as **811**. 809 is not at fault — it obeyed its own §8, which forbade the route file, and reported instead of widening.

- **Task 809 scope — full de-Tailwind slice.** Owner decision 2026-09-10. `FavoritesShell.tsx` measures 230 lines / 21 `className=`, of which only `:202` is the card grid; the other 20 are three empty/error state blocks around shadcn `buttonVariants`. All 21 go. Rejected: a track swap alone, and a track swap that keeps the shadcn buttons.

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
| **810** | The rail becomes usable: controls, a visible scrollbar, equal card heights | P1 | **Q3** | 🗄️ **APPROVED WITH NOTES — ARCHIVED** 2026-09-10, after Revision 1. Owner accepted the full §13 visual matrix (sq 390/768/1024/1440, the D74-5 one-card boundary at 320/480/481, long-vs-short titles at uk 320 + 1024, the non-overflowing rail at 1440, and all five Storybook states). Revision 1 closed R10-R17: **D74-9** container-keyed ladder (equal container ⇒ **0.00px** identical card at 9 of 13 widths — the 159px-vs-249px split is gone), a probe covering `/` + `/listings` grid + the detail route at 13 widths (39 cells), 26/26 rung assertions, 17/17 real hit-tests, **D74-8** paging 17/17, two two-armed proofs. Three live owner fixes: Mantine's `:active` press transform was clobbering the control's centring transform so real clicks never landed (10/10 after `:global()`), smooth scroll restored after a misdiagnosis, hover scrollbar 8→12px. Notes P2/P3: AC10's own wording was unsatisfiable under a container ladder (reviewer's defect, corrected in the log); `.grid > a {height:auto}` is provably inert (planted and reverted grid cells byte-identical — grid stretch works natively, the defeat is flex-only); the probe's hit-test still fails open on `inViewport:false`; AC11's exit-2 path retains no transcript; 4 tests in 2 untouched files are UNATTRIBUTED full-suite flakiness → folded into **790**. → [`Sprint_74_kickoff_prompt_Task_810_…`](Sprint_74_kickoff_prompt_Task_810_The_Rail_Becomes_Usable.md) |
| **809** | `/favorites` leaves Tailwind — every component, popup and dialog on the page | P2 | **Q3** | **`NEEDS REVISION` 2026-09-10 — rejected by the owner four times; Revision 4 filed (kickoff §55-§66).** Revision 0 obeyed its kickoff; the kickoff breached `agent-contract` **16c** by excluding the *components* instead of the *Story*. Measured: `/favorites` shipped with `CollectionsSection` (28 `className`), `SaveToCollectionButton` (20) and `FavoritesTypeFilter` (5) untouched — **53 `className` and two shadcn `Dialog`s**, more than the 21 removed — while `check:story-coverage` read 34/34 green, because none of the three is in the manifest. `MantineEmptyLoadingErrorState`, the pattern the task *extended*, is not enrolled either. Closed by new clause **16d** (no component a surface renders may be excluded; three-tier boundary; a composition Story is not a component Story; green coverage is never evidence), a blocking census gate in all three role skills, and `agent-contract` 16a-16d added to the STOP gate itself. Revision 1: tier 1 migrate + own Story + manifest (34 → **38**), tier 2 zero `@/components/ui/{button,input,dialog}` imports, tier 3 filed as **813**. Detector → **812**. Revision 0's verified work (track grid, 0px skeleton delta, `actionHref`, `3-col-xl` retired) stands and is not redone. **Revisions 2-4:** the `.imageActions`/badge collision (fixed, two-armed proof); `MantineEmptyLoadingErrorState` stops hardcoding action chrome from `state` and takes an `action?: ReactNode` slot (fixed); and **Revision 4** — the CTA labels render top-pinned inside the 44px box because `theme.ts:562-566`'s `height:'auto'` on the Button root defeats Mantine's `.mantine-Button-inner{height:100%}`, which is the only vertical centring Mantine's `inline-block` root has. A `<button>` is masked by UA centring; `Button component={Link}` renders an `<a>` and is not. Theme-level fix + a centring assertion in the pattern's own canonical Story; **R33's regression sweep is still open**. → [`Sprint_74_kickoff_prompt_Task_809_…`](Sprint_74_kickoff_prompt_Task_809_Favorites_And_The_Last_Two_Tailwind_Card_Surfaces.md) |

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
