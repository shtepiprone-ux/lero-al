# Task 807 — every card surface adopts the track, and the image `sizes` follow it

Sprint 74 · `tasks/Sprints/Sprint_74_One_Card_Width_For_The_Whole_Site.md` · P1 · QA **Q3**

## 1. Mode and task type

`IMPLEMENTATION` — consumer migration of an already-approved canonical primitive, plus the image-delivery contract
that has to move with it. Current-Mantine path. Strongest permitted result is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git.

**This is the one visible change of Sprint 74.** Task 806 built and proved `MantineListingCardTrack` without a
single consumer; 807 switches every Mantine card surface to it in one diff, so the site is internally consistent at
the commit boundary rather than half-migrated.

## 2. Objective

One card width everywhere: replace all six per-surface column ladders with the track, make the Suspense skeletons
use the same track as the content they stand in for, and re-derive `LISTING_LAYOUT_SIZES` from the track's measured
geometry instead of the `vw` fractions that no longer describe anything.

## 3. Verified context — measured 2026-09-10, do not re-derive from a document

### 3.1 What Task 806 already shipped and proved — consume it, do not re-open it

`FACT` — approved 2026-09-10 (session log `docs/sessions/2026-09-10-task806-canonical-listing-card-track.md` §15):

- `--listing-card-min: 17.5rem` **defined** at `src/app/globals.css:393`.
- `src/design-system/mantine/patterns/MantineListingCardTrack.tsx` — props `mode: 'grid' | 'rail'` (required, no
  default), `children`, `className`, `data-testid`. It renders **one** `Box`; it does **not** wrap each child, so
  the children are the grid/flex items directly.
- `MantineListingCardTrack.module.css` — `grid`: `repeat(auto-fill, minmax(var(--listing-card-min), 1fr))`,
  `gap: var(--mantine-spacing-md)`; `rail`: flex + `overflow-x:auto`, hidden scrollbar, `scroll-snap-type: x
  proximity`, `> * { flex: 0 0 min(var(--listing-card-min), 82%) }`. **Zero `@media` rules** — do not add one.
- Canonical story `Patterns/Mantine/ListingCardTrack`, manifest 33/33.

`FACT` — measured natively, `docs/sessions/evidence/task806/runs/nat-clean-1/card-track-computed.json`:

| Viewport | grid columns | grid column width | rail first-card width |
|---|---|---|---|
| 320 | 1 | 320px | 262.39px |
| 390 | 1 | 390px | 280px |
| 768 | 2 | 376px | 280px |
| 1024 | 3 | 330.66px | 280px |
| 1440 | 4 | 348px | 280px |

`INFERENCE` (from the CSS, to be confirmed by R6's measurement) — an `auto-fill minmax(280px, 1fr)` column is
always in the range **[280px, 560px)**: below 560px of container it is one full-width column; at 560px it splits.
That range, not a `vw` fraction, is what the new `sizes` must describe.

### 3.2 The six surfaces, with exact lines

`FACT` — read from the files at commit `3d6999ef9`+:

| # | Surface | Line | Current | Track mode |
|---|---|---|---|---|
| 1 | `FeaturedListingsView.tsx` | **:72** | `SimpleGrid cols={{base:1,sm:2,xl:3,xxl:4}} spacing="md" className="featured-listings"` — the **skeleton** grid | `rail` (**D74-4**) |
| 2 | `FeaturedListingsView.tsx` | **:91** | same ladder, the real cards | `rail` (**D74-4**) |
| 3 | `LatestListingsView.tsx` | **:50** | `SimpleGrid cols={{base:1,md:2,xxl:3}} spacing="sm" className="latest-listings"` — **skeleton** | `rail` (**D74-4**) |
| 4 | `LatestListingsView.tsx` | **:63** | same ladder, the real cards | `rail` (**D74-4**) |
| 5 | `ListingsShellView.tsx` | **:127** | `SimpleGrid cols={{base:1,sm:2,xl:3,xxl:4}} spacing="lg" pt="lg"` | `grid` (D74-3: search results stay a grid) |
| 6 | `RecentlyViewedGridView.tsx` | `.grid`/`.card` in its module.css | flex rail 192px below 640, then grid 2/3/4 | `rail` |
| 7 | `SimilarListingsView.tsx` | `.row`/`.card` in its module.css | flex rail, `flex-basis` 83.3%→23.8% | `rail` |
| 8 | `ListingDetailView.tsx` | **:55** | `SimpleGrid cols={{base:1,sm:2,lg:4}} spacing="md"` inside `SimilarListingsSkeleton` | must match #7 |

`FACT` — **#8 is already wrong today.** Task 803 made the similar-listings block a horizontal rail, but its Suspense
placeholder still renders a 4-up grid, so the block visibly re-lays-out when the server component streams in. Fixing
it is not scope creep; leaving it is shipping a known layout shift.

`FACT` — **a seventh surface exists and is NOT in this task.** `FavoritesShell.tsx:202` renders
`<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">` — raw Tailwind, a legacy
surface. Converting it is a de-Tailwind migration with its own visual risk and its own rule bundle; mixing it here
breaks the project's own legacy/current boundary. It is **Task 809**, reserved in this sprint, and Sprint 74's exit
criteria do not close until it lands. Report it in the completion note; **do not touch it.**

### 3.3 The image contract, and why it cannot stay

`FACT` — `src/lib/imageDelivery.ts:58-70`:

```ts
export type ListingLayoutContext = 'default' | '3-col-xl' | 'sidebar' | '4-col'

export const LISTING_LAYOUT_SIZES: Record<ListingLayoutContext, string> = {
  'default':  '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  '3-col-xl': '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw',
  'sidebar':  '(min-width: 1280px) 28vw, (min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw',
  '4-col':    '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
}
```

`FACT` — the current call sites: `RecentlyViewedGridView.tsx:71` and `SimilarListingsView.tsx:59` both pass
`'4-col'` while rendering different widths; `FavoritesShell.tsx:209` passes `'3-col-xl'`;
`ListingsShellView.tsx:138` passes `'sidebar'`; **`FeaturedListingsView` and `LatestListingsView` pass nothing**, so
they fall back to `'default'`. Every hint on the site is wrong to some degree today.

`FACT` — a `vw` fraction cannot describe an `auto-fill` column at all: the column count is a function of the
*container*, not the viewport, and `ListingsShellView` proves it — the same viewport yields a different column width
with and without the sidebar. The track's own geometry is expressed in **px**, which is exactly what makes a
px-based `sizes` correct for every container.

### 3.4 Stories — every changed surface already has its canonical story

`FACT` — `Mantine/Primitives/RecentlyViewedGridView` · `Mantine/Primitives/SimilarListingsView` ·
`Patterns/Mantine/HomepageListingGrids` (Featured + Latest, including their `Loading` state) ·
`Patterns/Mantine/ListingsShellView`. All four statically import the real components, so each re-renders through the
track automatically. The disposition for all four is **`reuse`** — no new story, no manifest change,
`check:story-coverage` stays **33/33**.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | All eight sites in §3.2 render through `MantineListingCardTrack`. No `SimpleGrid` wrapping a listing card or card skeleton remains, and no listing section's CSS module carries a card width or column rule. | P0 | AC1 |
| **R2** | Mode per D74-3: `rail` for the section rails (Featured, Latest, Recently viewed, Similar) and `grid` for `/listings` search results. Each skeleton uses the **same mode** as the content it replaces. | P0 | AC2 |
| **R3** | `RecentlyViewedGridView.module.css` and `SimilarListingsView.module.css` lose their card/track rules entirely; a file left with no rules is deleted, not left empty. | P0 | AC3 |
| **R4** | `LISTING_LAYOUT_SIZES` is re-derived from the track's measured px geometry, every call site passes the context matching its mode, and **no card renders without a `layoutContext`**. | P0 | AC4 |
| **R5** | No new i18n string, no new theme value or token, no `design-tokens-allow` marker, no allowlist entry; `check:design-tokens --strict --scope=mantine` stays **0**; `check:story-coverage` stays **33/33**. | P1 | AC5 |
| **R6** | The rendered result is measured on the **real routes**, not only in Storybook: one card width per breakpoint across the homepage, `/listings` and the detail page. | P0 | AC6 |
| **R7** | Preserved verbatim: the `.similar-listings` / `.featured-listings` / `.latest-listings` / `.recently-viewed` wrappers and every `data-testid`, the speculation-rules script, the 8-item render cap and the `ViewAllLink` gate (Task 803 R3/R4), and `ListingCard`'s own internals. | P0 | AC7 |

## 5. Assumptions and open questions

- **`OWNER DECISION — D74-1/D74-2/D74-3`.** Settled. `auto-fill` + one token; 280px; below 640 the section rails
  scroll with a peek and `/listings` stays a single full-width column. Do not re-open, do not re-tune.
- **`OWNER DECISION — D74-4`, 2026-09-10 — Featured and Latest are rails at every width**, exactly like "Similar
  listings" and "Recently viewed". Asked and answered on this kickoff's own §5. `/listings` search results remain the
  only `grid` consumer of the track. Settled: do not re-open it, and do not offer `grid` as an alternative in the
  completion report.
- **`ASSUMPTION (reversible, stated)` — `spacing` differences disappear.** The three surfaces currently use `md`,
  `sm` and `lg`; the track's gap is `var(--mantine-spacing-md)` for everyone. That is the point of a shared
  contract. Record it as an intentional visual delta on the two surfaces that change.
- **`UNKNOWN` — the exact `sizes` strings.** R4 requires them to be **derived from the measured column widths**
  (§3.1) and then verified against the rendered `currentSrc`, not invented. Do not copy the numbers below without
  measuring: they are the starting point, not the answer.
- **Out of scope by decision:** `FavoritesShell.tsx:202` (Task **809**), `ListingCard`'s internals, `theme.ts`.

## 6. Pre-read rule bundle

`CLAUDE.md` · `docs/agent-contract.md` (clause 15) · `docs/ai-behavior.md` Notes 18-23 · `docs/rule-index.md` →
**Current Mantine path**: `docs/mantine-responsive-design-system.md`, `docs/tailadmin-style-reference.md`,
`docs/component-rules.md` · `docs/performance.md` (Core Web Vitals — R4 is an LCP-relevant change) ·
`docs/qa-profiles.md` · `docs/storybook-governance.md` · `docs/backlog.md` · this sprint's plan file for
**D74-1 … D74-3** · Task 806's session log §15 for the measured geometry.

## 7. Scope

`FeaturedListingsView.tsx` · `LatestListingsView.tsx` · `ListingsShellView.tsx` · `RecentlyViewedGridView.tsx` ·
`SimilarListingsView.tsx` · `ListingDetailView.tsx` (**only** `SimilarListingsSkeleton`, §3.2 #8) ·
`RecentlyViewedGridView.module.css` and `SimilarListingsView.module.css` (rules removed, files deleted if empty) ·
`src/lib/imageDelivery.ts` · `docs/component-catalog.md` rows · `docs/backlog.md` state and the session log.

## 8. Out of scope

`FavoritesShell.tsx` (**809**) · `ListingCard.tsx` and `MantineListingCardPattern` · `MantineListingCardTrack` and
its CSS module — **consume it, do not edit it**; if it needs a change, that is a finding to report, not a diff ·
`globals.css` and `--listing-card-min`'s value · `theme.ts` · every `SimpleGrid` that is not a listing-card
container (`FooterView`, `FiltersPanel`, `HowItWorksSteps`, `MantineListingDetailPattern`'s features/amenities,
`MantineListingGalleryPattern`, `MantineTwoColumnForm`, `ListingsFilters`, `PopularLocationsView`) · Task 808's
`key`-warning fix · everything Sprint 71/72/73 own.

## 9. Current and required behavior

**Before:** six ladders and two rail formulas; at 560px the same card is 192px in "Recently viewed" and ~433px in
"Similar listings"; at 1024px a Featured card is half the container and a Similar card a quarter; the
similar-listings skeleton is a 4-up grid in front of a rail; every `sizes` hint is `vw`-based and wrong.

**After:** one width everywhere, driven by `--listing-card-min`. Column counts follow the container. Skeletons match
their content. Image hints are px-based and describe the real rendered card.

## 10. Implementation requirements

### 10.1 The mechanical swap (R1, R2)

For each site in §3.2: replace the `SimpleGrid`/`<div className={styles.…}>` with
`<MantineListingCardTrack mode="…">`, keeping the children exactly as they are — the track does not wrap them, so
`key` props and the existing element shape stay put. Keep any wrapper `className` by passing it through the track's
`className` prop rather than adding a second element.

`spacing`/`gap` props on the replaced containers are dropped: the track owns the gap.

### 10.2 The CSS modules (R3)

`RecentlyViewedGridView.module.css` and `SimilarListingsView.module.css` exist only for the card/track rules. Remove
those rules; if the file has nothing left, **delete the file and its import**. A file reduced to a comment is not a
deletion. Report which files were deleted and confirm they are absent from `git status --porcelain` as anything
other than `D`.

### 10.3 The image contract (R4)

Replace the four `vw`-based contexts with contexts that name the **track mode**, since that is what now determines
the width. Derive each string from §3.1's measured widths and the [280px, 560px) column range, then prove it:

```ts
export type ListingLayoutContext = 'card-track-grid' | 'card-track-rail'
```

Starting point — **measure before committing to these numbers** (R6):

- `card-track-grid`: the column is ≤ 560px below a 2-column container and settles at 330-390px from 768 upward.
- `card-track-rail`: the card is exactly `min(280px, 82vw)` at every width, so the hint is exact, not approximate.

Every call site then passes the context matching its track mode — including `FeaturedListingsView` and
`LatestListingsView`, which pass none today. `AppImage`/`useAdaptiveImageConfig` consume the map through
`ListingLayoutContext`; read `src/components/ui/useAdaptiveImageConfig.ts` before changing the type, and update
`DEFAULT_LISTING_LAYOUT_CONTEXT` (`:47`) coherently. If any consumer outside §7 references a removed context name,
**stop and report** — do not widen the diff.

### 10.4 Preservation (R7)

The wrappers `.similar-listings`, `.featured-listings`, `.latest-listings`, `.recently-viewed` and every
`data-testid` survive verbatim; the speculation-rules script, the 9-query/8-render cap and the `ViewAllLink` gate
are untouched behaviour. Prove preservation by diff, not by assertion.

## 11. Positive and negative flows

**Positive:** homepage, `/listings` and a listing detail page all show cards of the same width at the same viewport;
narrowing the window changes the column count without changing the card's character; the similar-listings block
shows the same shape before and after its Suspense boundary resolves.

| Negative flow | Applicable | Why |
|---|---|---|
| Zero cards in a section | **Yes** | Each View has its own empty branch; the track must not reserve height. |
| One card | **Yes** | A single card fills its grid column and must not make a rail overflow. |
| Exactly 8 / more than 8 (Similar) | **Yes** | Task 803's render cap and `ViewAllLink` gate must be untouched. |
| Loading/skeleton state | **Yes** | §3.2 #1, #3, #8 — the whole point is that the placeholder matches the content. |
| `/listings` with the sidebar open | **Yes** | The container narrows without the viewport changing — the case a `vw` hint cannot express. |
| Long `uk` titles at 320 | **Yes** | The card must not push the track wider than its container. |
| RLS / authorization / data failure | No | No query or permission change. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `grep -rn "SimpleGrid" src/ --include=*.tsx | grep -v stories`, then no hit wraps a
  `ListingCard` or a card skeleton; and given `grep -rn "grid-template-columns\|flex-basis" src/modules/listings`,
  then the only hits are in `MantineListingCardTrack.module.css`. Quote both greps.
- **AC2 [R2]** — Given each of the eight sites, then its `mode` matches §3.2's table and every skeleton's mode
  equals the mode of the content it replaces. State the eight `mode` values.
- **AC3 [R3]** — Given `git status --porcelain`, then `RecentlyViewedGridView.module.css` and
  `SimilarListingsView.module.css` appear as `D` (or their surviving rules are quoted and justified), and no import
  of a deleted module remains (`grep` proof).
- **AC4 [R4]** — Given `src/lib/imageDelivery.ts`, then `ListingLayoutContext` names track modes, every string is
  px-based, and `grep -rn "layoutContext" src/ --include=*.tsx` shows **every** `ListingCard` render site passing
  one. Given the rendered route, then the `sizes` attribute on a card image matches the measured rendered width
  within one `srcset` step — quote the measured width and the chosen candidate for one card at 390 and one at 1440.
- **AC5 [R5]** — `node scripts/check-design-tokens.mjs --strict --scope=mantine` → 0 violations, 0 stale markers;
  `npm run check:story-coverage` → 33 covered, 0 unproven; `git diff messages/` empty.
- **AC6 [R6]** — Given the §13 probe against the **running app**, then at 320/390/768/1024/1440 the homepage,
  `/listings` and the detail page each report a card width, and **at each viewport those widths are equal across all
  three routes** for the same track mode. A screenshot does not close this; state the number per route per width.
- **AC7 [R7]** — Given the diff, then the four wrappers and every `data-testid` are byte-unchanged, and
  `ListingDetailView.buildSimilarListingsHref.test.ts` plus `SimilarListings.ladder.test.ts` /
  `.visibility.test.ts` pass unmodified.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** `docs/qa-profiles.md` assigns Q3 to "high-risk responsive work" and to a
migrated primitive's consumers; this changes the rendered layout of every listing surface on the site. It is not Q4
— no file in `docs/critical-flow-registry.md` is touched, and Task 803's visibility invariant tests are preserved,
not modified.

```powershell
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npx.cmd vitest run src/modules/listings
npm.cmd run test
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `win32` · typecheck 0 · lint 0 errors, the current warning count, no touched file named ·
`check:stories` pass · `check:story-coverage` **33 covered / 0 unproven** · design-tokens 0 · `npm run test` at the
Task 790 baseline — name each failing file and prove it pre-existing · `build-storybook` and `build` exit 0 · both
hygiene gates 0. Each exit code read from **inside** its retained transcript.

**Rendered measurement on the real routes (AC4, AC6).** Extend `scripts/task806-card-track-computed.mjs` into a new
`scripts/task807-card-width-parity.mjs` — read 806's script first and keep its conventions (`playwright` chromium,
`BASE_URL` from env, `probeHash`/`gitCommit` via `execFileSync` with no shell, one immutable run dir per invocation
via `flag: 'wx'`, exit 1 on hard fail, 2 on usage error). It runs against `npm run start`, locale `uk`, widths
320/390/768/1024/1440, and per route (`/`, `/listings`, `/listings/<slug>`) records for each card section: the
track root's computed `display`/`gridTemplateColumns`/`overflowX`, the column count, the **first card's
`getBoundingClientRect().width`**, the image's `sizes` attribute and its resolved `currentSrc`, and
`docScrollWidth`/`docClientWidth`. Hard-fail on: a non-OK response · `NEXT_HTTP_ERROR_FALLBACK` in the body · a
missing section wrapper · a zero-area track · page-level horizontal overflow at 320 or 390 · **the same track mode
reporting different card widths on different routes at the same viewport** (that is AC6's whole assertion).

**Two-armed proof (Q3 gate claim).** Plant a per-surface override that the parity assertion must catch — e.g. give
one migrated surface a local `style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}` — rebuild, re-probe into a planted
`runId`, and show exit **1** naming the mismatched route and width. Revert, prove it with `git hash-object` on the
touched file, re-probe into a **fresh** `runId`, quote both. **Both arms must be fired by the same final version of
the probe script**: if you edit the script after the planted run, re-fire both and say so. That is Task 803's F8,
and Task 806 got it right — match it.

**Transcript rule.** No `Tee-Object`. Set `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` before the
first capture, capture with `& cmd.exe /c "<command> 2>&1"`, write with
`[System.IO.File]::WriteAllLines(path, lines, (New-Object System.Text.UTF8Encoding($false)))`, append
`EXIT_CODE=$LASTEXITCODE` **inside** the file, retain everything under `docs/sessions/evidence/task807/`.
**All evidence must be produced in native Windows PowerShell** — a POSIX shell's output is an environment screen,
not repository evidence, and will be rejected at review (Task 806's own round trip).

**`OWNER VISUAL QA REQUIRED`** — on the live routes, not the Storybook toolbar (Task 799):

| Surface | State | Locale | Viewport |
|---|---|---|---|
| Homepage — Featured and Latest | populated | uk, sq | 320, 390, 768, 1024, 1440 |
| `/listings` — results grid | populated, sidebar open and closed | uk | 320, 390, 768, 1024, 1440 |
| Listing detail — Similar + Recently viewed | populated, both rails | uk, sq | 320, 390, 768, 1024, 1440 |
| Listing detail — Similar | **during** the Suspense skeleton (throttle the network) | uk | 390 |
| All three routes | side by side at the same width — **the cards must look like one system** | uk | **320 (mandatory)**, 1440 |

## 14. Completion report contract

Files changed · requirement IDs completed · the eight `mode` values · the deleted CSS modules and the grep proving
no stale import · the old and new `LISTING_LAYOUT_SIZES` side by side with the measured widths each string was
derived from · the probe's full JSON for three routes × five widths, and the per-width equality statement that
closes AC6 · the planted/reverted parity pair with the `git hash-object` revert proof and the probe blob on **both**
arms · confirmation that Featured and Latest render as `rail` per **D74-4** · confirmation that
`FavoritesShell.tsx` was not touched · commands run with real exit codes and transcript paths · assumptions ·
deviations · limitations. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Can a fresh Sonnet session execute it without chat context? | Yes — §3.2 names all eight sites with line numbers, §3.1 carries 806's measured geometry, §10.3 states the derivation rule, §13 carries every command. |
| Are the `sizes` strings invented? | No — §5 marks them `UNKNOWN` and R4/AC4 require derivation from measured widths plus a `currentSrc` check. The numbers in §10.3 are labelled a starting point. |
| Is a media query or a per-surface ladder permitted anywhere? | No. AC1 greps for both. The track owns the responsive behaviour; a surface that "needs" an exception is a finding to report. |
| Does it edit the approved primitive? | No — §8 makes `MantineListingCardTrack` read-only for this task. |
| Is the skeleton mismatch scope creep? | No — §3.2 #8 is a measured, currently-shipping layout shift on the route this task is already changing, and R2 fixes it by making the placeholder use the same track. |
| Why is `FavoritesShell` excluded? | It is raw Tailwind (`:202`), a legacy surface; converting it is a de-Tailwind slice under a different rule bundle. Reserved as **809**, and Sprint 74 does not close without it. |
| Does the owner still get a decision? | Featured/Latest is **settled** — D74-4, 2026-09-10, rails on both sections. What remains for the visual matrix is the unified `md` gap, which changes spacing on two surfaces; that is a review observation, not an executor choice. |
| Is the worktree clean at start? | Task 806 is committed; take a pre-write `git status --porcelain` snapshot anyway and reconcile against it, per the standing rule. |
