# Task 815 — `check:card-track-monotonicity`: every canonical Story that renders `MantineListingCardTrack`, every breakpoint rung, blocking in CI

Sprint 75 · P1 · QA profile **Q4** (was `Q2` in the reservation — corrected in §13 because this task claims a new
blocking gate)

**Status: `NEEDS REVISION` (Rev 1, Opus review 2026-09-16) — start at §16.** Filed 2026-09-16. Scope fixed by the owner decision of 2026-09-16 quoted verbatim
in §5.1.

## 1. Mode and task type

`IMPLEMENTATION` — governance gate. A new, Storybook-only, blocking CI command that asserts a single observable
property of the shared listing-card track across every canonical Story that renders it. No product, story or visual
change.

## 2. Objective

Replace a check that exists for **one story at one breakpoint band and has never run anywhere but a deleted
throwaway invocation** with a gate that:

1. discovers, from the built Storybook, every canonical Story that renders `MantineListingCardTrack` — never a
   hand-written list;
2. sweeps each one across every rung boundary the repository declares; and
3. fails when a wider viewport produces **fewer** grid columns or **fewer** fully visible rail cards than the next
   narrower sampled viewport.

The failure class is the one Task 809 Revision 6 hit: two independent ancestors stepping horizontal padding on the
same breakpoint, shrinking the track as the viewport grows, so a column (or a rail card) disappears.

## 3. Verified context — measured 2026-09-16 on `HEAD` `1ed5cd2a5`, fresh `npm run build-storybook` (exit 0)

Every measurement below is retained under `docs/sessions/evidence/task815/design/` together with the exact scratch
scripts that produced it (`90_census815.mjs`, `91_drop815.mjs`, `92_final815.mjs`). Re-measure at execution — §13.1.

### 3.1 What exists today

`FACT` — `scripts/task809-favorites-parity-probe.mjs:319-374`, `measureStorybookColumnMonotonicity`:

- one story only — `mantine-primitives-favoritesshell--populated` (`:340`);
- widths `600…900` only (`:320`);
- targets the **first element on the page with `display: grid`** (`:322-335`), not the track;
- runs only from that probe's `main()` (`:376-436`), which first drives `/favorites` and `/listings` on a
  production server with an authenticated storage state (`:1-24`, `:117-180`). No `package.json` script and no CI
  job invokes the file (`git grep` over `package.json` and `.github/` returns no hit for it).

`FACT` — two source comments instruct maintainers to "re-run the monotonicity probe":
`src/design-system/mantine/patterns/MantineListingCardTrack.module.css:14-26` and
`src/stories/mantine/_MantineStoryShell.tsx:53`.

### 3.2 The track, and what a drop looks like

`FACT` — `MantineListingCardTrack.module.css:9-13`: `.grid` is `repeat(auto-fill, minmax(var(--listing-card-min),
1fr))` with `gap: var(--mantine-spacing-md)`. Column count is a function of the grid's own width only.

`FACT` — `:156-184`: `.rail > *:not(:only-child)` flex-basis ladder keyed on `@container` rungs 30em/48em/64em/80em of
`.wrapper` (`container-type: inline-size`, `:44-47`).

`INFERENCE` — from those two rules, both measures (grid column count; rail fully visible card count) are
non-decreasing in the **track's own width**. A drop as the viewport grows therefore requires the track to get
narrower at a viewport breakpoint — the exact defect class. Every ancestor width step in this repository happens at a
declared breakpoint: Mantine `theme.ts:335-346` (`xs 20em` · `xs2 30em` · `sm 40em` · `md 48em` · `lg 64em` ·
`xl 80em` · `xxl 90em`) and `.container-wide`'s own `@media` steps at 640/1024/**1536**px (`globals.css:718-720`).
Sampling `rung − 1` and `rung` for each of those is sufficient to see a step; a breakpoint not in the list is
invisible, and the gate must say so (§4 R6).

### 3.3 Selector — the track's classes are hashed in the Storybook build

`FACT` — `storybook-static/assets/MantineListingCardTrack-vfcqvuUA.css` is the only asset matching
`^MantineListingCardTrack-.*\.css$`; its classes are `._grid_fqrnb_5` and `._rail_fqrnb_31`. The hash is
build-specific, so no literal selector may be written into the script. `[class*="_grid_"]` is ambiguous (any CSS
module with a `.grid` rule matches). The old probe's "first `display:grid` element" is wrong for the same reason.

### 3.4 Census — which Stories render the track (`01_census-and-sweep.*`)

`FACT` — the built index has **351** stories; loading each at 1440×900 (`locale:en`) and querying the two extracted
classes finds **27** that render the track:

| Scope | Count | Stories |
|---|---:|---|
| canonical (`isCanonicalMantineTitle`, `scripts/lib/mantine-story-scope.mjs`) | **16** | `mantine-primitives-favoritesshell--populated` · `mantine-primitives-listingcard--favorites-composition` · `mantine-primitives-recentlyviewedgridview--populated` · `mantine-primitives-similarlistingsview--default` · `…--fewer-than-eight` · `patterns-mantine-homepagelistinggrids--default` (2 tracks) · `…--loading` (2 tracks) · `patterns-mantine-listingcardtrack--grid` · `…--rail` · `…--grid-single-item` · `…--rail-single-item` · `…--rail-no-overflow` · `…--rail-mixed-title-lengths` · `…--grid-mixed-title-lengths` · `…--empty` · `patterns-mantine-listingsshellview--default` |
| legacy `System/*` | **11** | `system-featuredlistings--{default,locale-stress,loading}` · `system-latestlistings--{default,locale-stress,loading}` · `system-recentlyviewedsection--{populated,mobile-scroll,locale-stress}` · `system-similarlistings--{default,locale-stress}` |

`FACT` — static cross-check: the only two story files that **import** `MantineListingCardTrack` directly are
`src/stories/patterns/mantine/ListingCardTrack.stories.tsx` and `src/stories/mantine/primitives/ListingCard.stories.tsx`;
the other 18 hits (7 of them canonical) reach it through a consumer (`FavoritesShell`, `ListingsShellView`, `SimilarListingsView`,
`RecentlyViewedGridView`, the homepage views). A static import list would miss them, which is why discovery is
runtime.

`FACT` — every one of the 27 rendered the same number of tracks at all 20 sampled widths (no track appears or
disappears with width).

### 3.5 Sweep result on `HEAD`

Widths `320 479 480 481 639 640 641 767 768 769 1023 1024 1025 1279 1280 1281 1439 1440 1441 1920`, `locale:en`.

`FACT` — **all 16 canonical Stories: 0 drops.** Re-swept at exactly R4's 17-width list (`04_canonical-final-widths.*`,
script `92_final815.mjs`): **0 drops**, every track present at every width. Anchor values used by §10.4:
`patterns-mantine-listingcardtrack--grid` 3 columns at 1023 and 1024; `…--rail` 4 fully visible at 1279, 5 at 1280.
(A first run of `92_final815.mjs` counted every grid as 1 column because its regex lost an escape; that run is
discarded, the retained transcript is the corrected re-run.)

`FACT` — 4 `System/*` Stories drop: `system-featuredlistings--default`, `system-latestlistings--default`,
`system-recentlyviewedsection--populated`, `system-similarlistings--default` — rail fully visible 5 → 4.
`02_drop-attribution.json` localises it to **1535 → 1536 px**: the track narrows 1280 → 1216 px and its first card's
`flex-basis` switches from `min(280px, 18.56%)` to `min(280px, 22.75%)` (the 80em container rung is lost). Ancestor
chain at 1536: `.container-wide py-6` (`.storybook/preview.tsx:138`, `withCanvas`) **and** the story's own
`.container-wide mx-auto px-4 py-8` (e.g. `src/stories/FeaturedListings.stories.tsx:84`), both stepping to 48px
padding at 1536. `patterns-mantine-homepagelistinggrids--default` (single container, as `src/app/[locale]/page.tsx`
composes it) holds 1312 px and 5 cards at every width 1441-2560. `INFERENCE`: the drop is a legacy story-harness
artefact, not production. **Filed as Task 827; excluded from this gate by the owner decision in §5.1.**

### 3.6 The CI job this gate joins is already red

`FACT` — `03_check-homepage-grid_HEAD.txt`: `npm run check:homepage-grid` on the fresh build exits **1**,
`TOTAL: 12/260 PASS, 248 FAIL` — it still asserts the pre-Task-806 `SimpleGrid` column steps on the `System/*` stories,
which now render rails (`grid-not-found`, `columnGap=normal`). That step is the blocking `check:homepage-grid` step of
the `homepage-grid` job (`.github/workflows/governance-pr.yml:180-208`; `Build Storybook` `:201`, `check:homepage-grid` `:204`). Steps after a failing step do not run.
**Filed as Task 828.** This task's steps therefore go **before** that step (§10.6).

### 3.7 Precedent to follow

`scripts/check-homepage-grid.mjs` is the in-repo shape for a Storybook-only rendered gate: `node:http` static server
over `storybook-static/` (`:158-189`), Playwright Chromium, a `--verify-gate` mode with a negative arm and in-page
plants restored per navigation (`:680-816`), exit 0/1 (`:818-844`).

### 3.8 Cost

`FACT` — the census scratch run took 280 s to discover over all stories (≈0.8 s per story) and ≈320 s to sweep 27
stories × 20 widths. Canonical-only (§5.1) is 139 canonical stories to discover and 16 to sweep.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.1, reservation text | A new script `scripts/check-card-track-monotonicity.mjs` runs with **nothing but `storybook-static/`**: its own `node:http` static server on `127.0.0.1`, Playwright Chromium. No `next start`, no storage state, no network, no dev server. It fails with exit 1 and a named message when `storybook-static/index.json` is absent. | **P0** | AC1 | Confirmed |
| **R2** | §3.3 | The track selectors are **derived at runtime** from the built CSS: exactly one `storybook-static/assets/MantineListingCardTrack-*.css`, from which exactly one `_grid_<hash>_<n>` and exactly one `_rail_<hash>_<n>` class are extracted. Zero or more than one file, or zero or more than one class of either kind, is exit 1 with a message naming what was found. No literal hashed class name appears in the script. | **P0** | AC2, AC7 | Confirmed |
| **R3** | §3.4, owner decision §5.1 | Scope is discovered, never listed: every `type: "story"` entry of `index.json` whose `title` satisfies `isCanonicalMantineTitle` (imported from `scripts/lib/mantine-story-scope.mjs`, not re-implemented) is loaded at **320×900 and 1440×900**, `locale:en`; a story is in scope when either load contains at least one track. A discovered scope of **zero** stories is exit 1. **Rev 1: discovery waits for render state — §16.2.** | **P0** | AC3, AC7, AC12 | Confirmed |
| **R4** | §3.2, §3.5 | Each in-scope story is loaded at the ascending width list **`320, 479, 480, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1439, 1440, 1535, 1536, 1920, 2560`** (height 900, `locale:en`). Each track is measured by document order: grid → `grid-template-columns` track count; rail → number of direct children whose box lies entirely within `[rail.left, rail.left + rail.clientWidth]` at `scrollLeft` 0. A track missing at any width, or a different track count between widths, is a failure for that story. | **P0** | AC4 | Confirmed |
| **R5** | §2 | For each track, a measure at a wider width that is **lower** than at the immediately preceding sampled width fails, naming story id, track index, mode, both widths, both measures and both track widths in px. Exit 0 iff no failure in any in-scope story. No baseline file, no allowlist, no per-story exception. | **P0** | AC4, AC5 | Confirmed |
| **R6** | Sprint 75 exit criterion 4, GR-2 | **Every run prints its own scope and blind spots**, whatever the result: extracted CSS asset and classes; `in scope: <n> canonical stories rendering the track (of <m> canonical, <t> total)`; the full list of in-scope story ids; `excluded (owner decision 2026-09-16): <k> non-canonical stories, including the System/* stories — Task 827 owns the known 1535→1536 drop there`; and `cannot see: a breakpoint not in the width list; locales other than en; a track rendered only after interaction; a drop that recovers between two sampled widths not at a declared breakpoint`. **Rev 1: on every exit path — §16.3.** | **P0** | AC6, AC13 | Confirmed |
| **R7** | QA profile Q4, Sprint 75 exit criterion 3 | `--verify-gate` runs, in order: **(a)** negative arm — the real tree, expect every in-scope story clean; **(b)** grid plant on `patterns-mantine-listingcardtrack--grid` at the **1024** rung; **(c)** rail plant on `patterns-mantine-listingcardtrack--rail` at the **1280** rung; **(d)** selector fail-closed — extraction run against a non-matching asset pattern must fail; **(e)** scope fail-closed — discovery with a title predicate that matches nothing must fail. Each plant is a `<style>` element injected by `page.addStyleTag` after navigation, keyed to `@media (min-width: <rung>px)`, adding `padding-inline` to the **track's parent element** (tagged with a `data-task815-plant` attribute by the plant itself); (b) and (c) must each fail with a reason naming **that** story, **that** rung pair and a lower measure, and nothing else; the arm then reloads the story and re-measures the rung pair clean. Any arm that does not produce its expected outcome is exit 1. No repository file is written by `--verify-gate`. **Rev 1: arms (b)/(c) run the gate's own sweep and `evaluateSweep`, proven by a mutation run — §16.1.** | **P0** | AC7, AC7-R1, AC11 | Confirmed |
| **R8** | §3.6 | `package.json` gains `check:card-track-monotonicity` and `check:card-track-monotonicity:verify`. `.github/workflows/governance-pr.yml` job `homepage-grid` runs both as two steps placed **after** `Build Storybook` and **before** `Homepage grid invariants gate`, without `continue-on-error`. No other workflow step changes. | **P0** | AC8 | Confirmed |
| **R9** | §3.1 | The two maintainer comments in §3.1 name the new command instead of the probe; nothing else in either file changes. `scripts/task809-favorites-parity-probe.mjs` is **not** modified (it is Task 809's retained evidence producer). | P1 | AC9 | Confirmed |
| **R10** | Sprint 75 exit criterion 4 | `docs/storybook-governance.md` gains `§15.10` recording the command, its scope rule and owner decision, the measure, the width list and why, the verify arms, the four blind spots of R6, and Tasks 827/828. | P1 | AC10 | Confirmed |

## 5. Assumptions and open questions

### 5.1 Owner decision — 2026-09-16, quoted verbatim

Asked in the task-design session, with the §3.5 measurement stated. The owner selected:

> **Виключити System/\*** — Gate перевіряє лише канонічні Mantine/Patterns Stories (23), виключення друкується на
> кожному запуску; виправлення обгортки — окрема задача. Слабше: легасі-Stories лишаються сліпою зоною.

Correction recorded with the decision, not a change to it: the option text said "(23)"; the measured canonical count
is **16** (§3.4). The decision is about the class — canonical scope via `isCanonicalMantineTitle`, exclusion printed
every run, the harness fix a separate task (827) — and binds regardless of the count.

### 5.2 Assumptions

- `ASSUMPTION` (reversible) — Chromium's `grid-template-columns` computed value lists one length per track for an
  `auto-fill` grid. Measured true at every cell of §3.5 (e.g. `patterns-mantine-listingcardtrack--grid` 1→2→3→4→6).
  If a later engine returns `repeat(...)`, the measure is wrong, and AC4's per-width transcript exposes it.
- `ASSUMPTION` (reversible) — a rail's fully visible count at `scrollLeft` 0 is the right rail measure. The gate sets
  `scrollLeft = 0` itself before measuring rather than trusting load state; `02_drop-attribution.json` recorded
  `scrollLeft` 0 for the four stories it measured, the rest were not checked.
- `UNKNOWN` — the CI Linux Chromium may round sub-pixel widths differently from Windows. The plants use margins of
  tens of px (§10.4) so they cannot flip on rounding; the negative arm is the evidence either way.

### 5.3 Stop conditions

- If §13.1's re-measure finds **any** drop in a canonical story on the unmodified tree, stop and return
  `BLOCKED — OWNER DECISION REQUIRED` with the drop. Do not add an exception, a baseline or a width change to make it
  pass.
- If R2's extraction does not find exactly one asset and one class of each kind, stop and report what the build
  produced; do not widen the pattern.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-2 in full, the Enforcement status table) · `docs/agent-contract.md` clauses **9, 13, 14** ·
`docs/qa-profiles.md` (Q4 row) · `docs/storybook-governance.md` §15.4-§15.9 (the shape §15.10 follows) ·
`scripts/check-homepage-grid.mjs` in full (the precedent) · `scripts/lib/mantine-story-scope.mjs` ·
`scripts/task809-favorites-parity-probe.mjs:315-374` (what is being replaced) ·
`src/design-system/mantine/patterns/MantineListingCardTrack.module.css` and `MantineListingCardTrack.tsx` ·
`src/stories/mantine/_MantineStoryShell.tsx:25-60` · `.github/workflows/governance-pr.yml:180-208` ·
`docs/sessions/evidence/task815/design/*` · this kickoff.

## 7. Scope

- **New:** `scripts/check-card-track-monotonicity.mjs`.
- **Edited:** `package.json` (+2 scripts) · `.github/workflows/governance-pr.yml` (+2 steps, `homepage-grid` job) ·
  `src/design-system/mantine/patterns/MantineListingCardTrack.module.css` (comment `:14-26` only) ·
  `src/stories/mantine/_MantineStoryShell.tsx` (comment `:53` only) · `docs/storybook-governance.md` (+§15.10) ·
  `docs/backlog.md` (Task 815's state line).
- **Written:** `docs/sessions/evidence/task815/*` (not `design/`, which is this kickoff's retained evidence and stays
  unchanged) · `docs/sessions/<date>-task815-*.md`.

## 8. Out of scope

Fixing the `System/*` double `.container-wide` (Task 827) · repairing `check:homepage-grid` (Task 828) ·
`scripts/task809-favorites-parity-probe.mjs` · any CSS rule, token, breakpoint, story markup or component source ·
the other Sprint 75 gates · locales other than `en` (recorded as a blind spot, R6).

## 9. Current and required behavior

**Before.** One story is checked at 600-900 px by a function no command runs; the other 15 canonical track stories and
every rung above 900 px are unchecked. A padding step that removes a column at 1024, 1280 or 1536 would ship green.

**After.** `npm run check:card-track-monotonicity` discovers the 16 canonical track stories, sweeps 17 widths, exits 0
on today's tree and 1 on a planted drop at any declared rung, prints its scope and blind spots on every run, and runs
blocking in the `homepage-grid` CI job ahead of the already-red step.

## 10. Implementation requirements

1. **Order.** §13.1 baseline (build, census re-measure) → script → `--verify-gate` → `package.json` → workflow →
   comments → `§15.10` → §13.2 final gate block → session log → backlog line.
2. **Static server:** reuse the `check-homepage-grid.mjs` `startStaticServer` shape on its own port (not 6020, which
   that gate uses; not 6006). Close server and browser in `finally`.
3. **Readiness per navigation:** `waitUntil: 'load'`, then wait for either a track element or Storybook's error
   display (`storybook-static/iframe.html` defines `sb-show-errordisplay` on `body` and an `#error-message` element —
   verify both against the §13.1 build); a story in that state is a failure naming the story, never a skipped cell.
4. **Plants (R7).** Measured slack on `HEAD` (`01_census-and-sweep.json`): `patterns-mantine-listingcardtrack--grid`
   is full-bleed (track width = viewport) with 3 columns at 1023 and 1024 — 3 columns need ≥ 872 px
   (3 × 280 + 2 × 16), so `padding-inline: 80px` at `min-width: 1024px` leaves 864 px → 2 columns. `…--rail` has 4
   fully visible at 1279 and 5 at 1280; `padding-inline: 140px` at `min-width: 1280px` leaves 1000 px, below the
   64em container rung → 3 fully visible. Each plant must assert the width it produced before asserting the drop, so
   a plant that silently did not apply is an arm failure, not a pass.
5. **No writes** outside stdout from either mode. Evidence goes to transcripts the executor captures.
6. **CI placement** is load-bearing (§3.6): both new steps between `Build Storybook (runs check:stories pre-gate)` and
   `Homepage grid invariants gate (column steps, gaps, header geometry)`.
7. **Transcripts:** unpiped, redirected to a file, exit code appended as its own statement; each records platform,
   Node version, working directory and exact command; UTF-8 without BOM. The final gate block includes the
   `git hash-object` of every changed file.

## 11. Positive and negative flows

**Positive.** A contributor adds `padding-inline` to a wrapper at `lg`; the gate names the story, `1023→1024`,
`grid columns 3→2`, and exits 1 in CI before the PR merges.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| `storybook-static/` missing | Yes | exit 1, message names `npm run build-storybook` — R1 |
| Track CSS asset renamed/merged, or class not extracted | Yes | exit 1 naming what was found — R2, verify arm (d) |
| Discovery finds zero stories | Yes | exit 1 — R3, verify arm (e) |
| A story errors or never renders its track at one width | Yes | failure naming story and width — R4, §10.3 |
| A drop at a declared rung | Yes | exit 1 with the R5 reason — verify arms (b)(c) |
| A drop only between two non-breakpoint samples, or only in `uk`/`sq`/`it` | Yes | not detected; printed as a blind spot every run — R6 |
| A `System/*` story drops | Yes | not in scope by owner decision §5.1; printed; owned by 827 |
| Authorization / RLS / data / concurrency | **No** | a read-only rendered check over static files |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `storybook-static/` renamed away, when the gate runs, then it exits 1 with a message naming
  the missing build; given it present, the gate needs no other running process. Quote both transcripts.
- **AC2 [R2]** — Given the §13.1 build, the run prints the one asset and the two extracted classes; `git grep` for
  the printed hashed class names in `scripts/` returns no hit. Quote both.
- **AC3 [R3]** — Given the §13.1 build, the printed in-scope list equals §13.1's re-measured canonical census
  (currently the 16 of §3.4); every difference from §3.4 is explained by a story added or removed since `1ed5cd2a5`.
  Quote the list and the explanation.
- **AC4 [R4, R5]** — Given the unmodified tree, `npm run check:card-track-monotonicity` exits 0 and its output
  shows, for every in-scope story and track, the measure at each of the 17 widths. Quote the transcript.
- **AC5 [R5]** — Given the script source, there is no baseline file, allowlist or per-story exception. Quote the
  list of files the script reads (`index.json`, the CSS asset, served static files only).
- **AC6 [R6]** — Given AC4's and AC7's transcripts, each contains the full R6 scope-and-blind-spot block. Quote it once.
- **AC7 [R7]** — `npm run check:card-track-monotonicity:verify` exits 0 and prints all five arms with their observed
  outcome; arms (b) and (c) each print the produced track width and the exact failure reason; `git status
  --porcelain` after the run equals the one before it. Quote the transcript and both status snapshots.
- **AC8 [R8]** — `git diff .github/workflows/governance-pr.yml` shows exactly two added steps in `homepage-grid`, in
  the §10.6 position, and no other change; `git diff package.json` shows exactly the two added scripts. Quote both.
- **AC9 [R9]** — `git diff` of the two commented files shows comment-only hunks naming the new command;
  `git diff --stat -- scripts/task809-favorites-parity-probe.mjs` is empty. Quote all three.
- **AC10 [R10]** — `docs/storybook-governance.md` §15.10 exists and covers each R10 item. Quote its heading and the
  blind-spot paragraph.

**GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: AC9's empty diff is scoped to one file
this task defines as out of scope, AC5's "no baseline" is this task's defined design, AC7's status equality is the
no-write property R7 requires.**

## 13. QA profile and verification plan

**`Q4`** — `docs/qa-profiles.md` requires planted-violation failure proof whenever a gate is claimed; this task claims
a new blocking CI gate. No critical flow and no visible artifact changes, so there is **no owner visual matrix**:
the two source edits are comments, and no story renders differently.

### 13.1 Baseline — before any edit

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task815"
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --porcelain
git --no-optional-locks log -1 --oneline
npm.cmd run build-storybook
node.exe docs\sessions\evidence\task815\design\90_census815.mjs docs\sessions\evidence\task815\00_census-reproduction.json
```

Expected: `win32`; a clean status; build exit 0; the census reproduces §3.4/§3.5 — 16 canonical track stories with 0
drops, the 4 `System/*` drops at the same widths. Redirect each command to its own transcript per §10.7. **If a
canonical drop appears, stop per §5.3.**

### 13.2 Final gate block — on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build-storybook
npm.cmd run check:card-track-monotonicity
git --no-optional-locks status --porcelain
npm.cmd run check:card-track-monotonicity:verify
git --no-optional-locks status --porcelain
npm.cmd run check:stories
npm.cmd run check:surface-census:changed -- --base HEAD
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks hash-object scripts/check-card-track-monotonicity.mjs package.json .github/workflows/governance-pr.yml src/design-system/mantine/patterns/MantineListingCardTrack.module.css src/stories/mantine/_MantineStoryShell.tsx docs/storybook-governance.md docs/backlog.md
```

Expected: every command exit 0; the two status snapshots identical; `build` exit 0 (mandatory, `agent-contract`
clause 9). `check:homepage-grid` is **not** in this block: it is red on `HEAD` (§3.6) and owned by Task 828.

### 13.3 Owner-native rule

Native Windows PowerShell only. A WSL/Linux-view result is `MISSING EVIDENCE`, not a finding.

## 14. Completion report contract

Files changed (with hashes) · requirement IDs · §13.1 baseline and census reproduction · AC2's asset and classes ·
AC3's in-scope list and diff against §3.4 · AC4's per-story, per-width measures · AC7's five arms with produced widths
and reasons, and both status snapshots · AC8/AC9 diffs · AC10's quoted section · every command with its real exit
code and transcript path · CI run time of both new steps if a CI run is available, otherwise `UNKNOWN` · assumptions ·
deviations · limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED — OWNER DECISION REQUIRED`
(§5.3). Sonnet does not self-approve and runs, emits and suggests no mutating git command.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Why not reuse `measureStorybookColumnMonotonicity`? | It targets the first `display:grid` element on the page, one story, 600-900 px, and only runs behind a production server and auth state (§3.1). The measure is kept; the harness is not. |
| Why runtime discovery, not a story list? | 7 of the 16 canonical stories reach the track only through a consumer; a list rots the first time a consumer story is added (§3.4). |
| Why these widths? | Every declared Mantine rung and the `.container-wide` 1536 step, each as `rung − 1, rung`, plus 320/1920/2560 bounds (§3.2). Anything else is a printed blind spot. |
| Is the gate green on landing? | Yes for its owner-decided scope — measured at R4's exact widths, 16/16 clean, 0 drops (§3.5). The only measured drops are in the excluded class, owned by 827. |
| Can the plants pass without applying? | No — each arm asserts the produced track width first (§10.4). |
| Why not in its own CI job? | It reuses the job's Storybook build; placed before the red `check:homepage-grid` step so it always runs (§3.6, §10.6). |
| Does GR-1 / clause 16d apply? | Not to a visible change — two comment-only source edits. Census of the touched pattern run anyway: `MantineListingCardTrack.tsx` 1 node, tier1 enrolled + story, exit 0. |
| Filed follow-ups | **827** (`System/*` double `.container-wide`, the 1535→1536 drop) · **828** (`check:homepage-grid` red on `HEAD`, 248/260). |

## Appendix A — Rule-compliance ledger

| Rule | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| `agent-contract` 9 — build gate | non-Q0 | final `npm run build` exit 0 | §13.2 | COMPLIANT |
| `agent-contract` 13 — Storybook gates enforceable | new Storybook gate | machine-produced evidence, planted proof | R7, AC7 | COMPLIANT |
| `agent-contract` 14 — integrity/encoding | new script + edits | UTF-8 no BOM, file-integrity + mojibake | §10.7, §13.2 | COMPLIANT |
| `qa-profiles` Q4 | gate claim | planted-violation failure proof | R7 (b)(c), AC7 | COMPLIANT |
| GR-2 — gate states its scope | new gate with a narrowing | printed scope and blind spots each run | R6, AC6 | COMPLIANT |
| GR-1 / 16d | no visible change (comments only) | census of touched surface | §15, exit 0 | NOT APPLICABLE (comment-only), census recorded |
| GR-4 | kickoff | observable ACs | §12 receipt | COMPLIANT |
| `screenshots:assert` retired | Storybook work | not used | §13 | COMPLIANT |
| Scope exclusion requires owner authority | `System/*` excluded | dated verbatim owner decision | §5.1 | COMPLIANT |

## Appendix B — Execution contract

| Field | Value |
|---|---|
| Active route | Canonical-scope gate, owner decision 2026-09-16 (§5.1) |
| Starting worktree | clean at `1ed5cd2a5` (task-design commit adds only this kickoff, evidence `design/`, sprint and backlog rows) |
| Final write set | §7 exactly |
| Blocked rule/decision | none |

| Checkpoint | Producer / artifact | Comparator and failure |
|---|---|---|
| 0 Baseline | §13.1 transcripts, `00_census-reproduction.json` | canonical drops > 0 → `BLOCKED` (§5.3) |
| 1 Real run | `check:card-track-monotonicity` transcript | exit code; in-scope list vs checkpoint 0 (AC3) |
| 2 Verify | `…:verify` transcript + two porcelain snapshots | each arm's expected outcome; snapshot inequality → fail |
| 3 Wiring | `git diff package.json .github/…` | exactly 2 scripts / 2 steps in position (AC8) |
| 4 Final | §13.2 block with hashes | any non-zero exit → not `IMPLEMENTED` |

| Counterexample | Evidence | Required outcome |
|---|---|---|
| empty scope | verify arm (e) | exit 1 |
| selector not found | verify arm (d) | exit 1 |
| planted drop at 1024 / 1280 | verify arms (b)(c), produced width asserted | exit 1 with named reason, clean after reload |
| plant silently not applied | width assertion before drop assertion | arm fails |
| task-created file enters a scan | the gate reads only `storybook-static/` | none possible |

## 16. Revision 1 — `NEEDS REVISION` (Opus review, 2026-09-16)

Reviewed tree: `scripts/check-card-track-monotonicity.mjs` blob `74819e1987e8d030c8d7841e5469d9ce33d6ec6e` plus the
five edited files of §7. **Accepted, not to be redone:** R1, R2, R4, R8, R9, R10; the §13.1 baseline and census
(`00_`–`16_`); the Rev 0 real-run sweep (16/16 clean, 0 drops). The three defects below are the whole revision.

### 16.1 P1 — the plant arms do not exercise the gate's decision path (R5, R7, AC7)

`FACT` — `evaluateSweep` (`:240`) has one caller, `runGate` (`:336`). `runPlantArm` (`:407-505`) decides the trip with
its own comparison, `plantedValue < baselinePrev.track.value` (`:475`), and prints its own reason string (`:483-486`).
`CONTRADICTION` — the comment at `:237-238` says `evaluateSweep` is "shared by the real run and the plant arms so the
failure/pass decision is never re-derived in two places".

`INFERENCE` — a mutation that disables detection inside `evaluateSweep` leaves arm (a) green (the real tree has no
drop) and arms (b)/(c) green (they never call it), so `--verify-gate` exits 0 on a gate that can no longer fail. That is
the Sprint 75 failure class and the M1-M5 corollary in `docs/orchestrator-procedures.md` ("the control could not
detect its own effect").

**Required change.**

1. Extract the per-story sweep of `runGate` (`:330-338`) into one function, e.g.
   `sweepStory(page, baseUrl, storyId, selectors, { plant } = {})`, that measures every `WIDTHS` entry through
   `measureStoryAtWidth` and returns `evaluateSweep(storyId, cells)`. `runGate` calls it with no plant; its output is
   unchanged.
2. `measureStoryAtWidth` accepts an optional `plant` (`{ mode, rung, paddingPx }`). When present it is applied **on
   every navigation, after readiness and before `evalTracks`**: tag the track's parent with `data-task815-plant`, then
   `page.addStyleTag` the `@media (min-width: <rung>px)` rule. A plant does not survive navigation, which is why it is
   per-navigation.
3. Arms (b)/(c) call `sweepStory` with the plant over the **full 17-width list** and pass only when all hold, in order:
   - the cell at `rung` has produced track width `Math.round(width) === expectedProducedWidth` (864 / 1000) — asserted
     first; a mismatch is an arm failure (§10.4 unchanged);
   - `failures` from `evaluateSweep` has **exactly one** entry;
   - that entry contains the story id, `track 0 (<mode>)`, `<prevWidth>px-><rung>px`, and `measure X->Y` with `Y < X`;
   - an unplanted `sweepStory` of the same story afterwards returns `pass: true` (the reload-clean check).
   Print the `evaluateSweep` failure string verbatim. Delete `runPlantArm`'s private comparison and reason string. If a
   planted sweep yields a second failure at another rung pair, **stop and report it** — do not change the padding, the
   width list or the comparator to make it one.
4. Correct the arm (c) `describe` text: the measured pair is `1279=4 → 1280=3` (`25_…-verify.txt`), not "5->3".
5. Rewrite the `:237-238` comment so it describes the shipped code.

**Mutation proof (mandatory).** Create `docs/sessions/evidence/task815/57_mutation-probe.mjs` with exactly this content
(Node I/O only — never PowerShell `Get-Content -Raw`, per the 818/819 corollary):

```js
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
const [mode, target, find] = process.argv.slice(2);
const backup = `${target}.task815-orig`;
if (mode === 'apply') {
  const src = readFileSync(target, 'utf8');
  if (src.split(find).length !== 2) { console.error(`MUTATION TARGET NOT UNIQUE/FOUND: ${find}`); process.exit(2); }
  writeFileSync(backup, src);
  writeFileSync(target, src.replace(find, 'false'));
  console.log(`applied: "${find}" -> "false"`);
} else if (mode === 'restore') {
  writeFileSync(target, readFileSync(backup, 'utf8'));
  unlinkSync(backup);
  console.log('restored');
} else { process.exit(2); }
```

Then run, redirecting to `55_mutation-verify.txt` (hash lines to `56_mutation-hashes.txt`):

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$script = "scripts/check-card-track-monotonicity.mjs"
$find = "tr.value < prev.value"
git --no-optional-locks hash-object $script
node.exe docs\sessions\evidence\task815\57_mutation-probe.mjs apply $script $find
npm.cmd run check:card-track-monotonicity:verify
node.exe docs\sessions\evidence\task815\57_mutation-probe.mjs restore $script
git --no-optional-locks hash-object $script
```

Expected: `apply` prints one line (exit 0 — if the refactor changed the comparator text, set `$find` to the exact new
comparator expression, record it in the session log, and keep the mutation meaning "detection disabled"); the mutated
`--verify-gate` exits **1** with arms (b) and (c) `FAILED`; `restore` prints `restored`; the two hashes are identical.

### 16.2 P2 — discovery scope depends on a fixed 2 s wait and can shrink silently (R3, §10.3)

`FACT` — `discoverInScope` (`:220-235`) loads each canonical story with `DISCOVERY_READY_TIMEOUT_MS = 2000` (`:181`), and
`waitForReady` swallows its timeout (`:192`). A canonical story whose track appears more than 2 s after `load` is
recorded as "renders no track", leaves the in-scope list, and the gate still exits 0; no output says so.
`INFERENCE` — on a slower CI runner the scope is timing-dependent: a gate reporting green on what it did not see.

`FACT` — the built `storybook-static/iframe.html` defines the body states `sb-show-main`, `sb-show-errordisplay`,
`sb-show-nopreview` and `sb-show-preparing*`.

**Required change.** After `waitUntil: 'load'`, discovery waits (with `SWEEP_READY_TIMEOUT_MS`) until `document.body`
carries `sb-show-main`, `sb-show-errordisplay` or `sb-show-nopreview`, then queries the track selectors **once**. A story
that reaches none of those states within the timeout is a **discovery failure** naming the story, and the run exits 1 —
never an out-of-scope story. Remove `DISCOVERY_READY_TIMEOUT_MS`. Before relying on the signal, verify at runtime on
`patterns-mantine-listingcardtrack--grid` and on one canonical story without a track that `sb-show-main` is set only
once the story has rendered; record both body class lists in the session log. **If it is not a reliable post-render
signal, stop and return `BLOCKED — OWNER DECISION REQUIRED`** with the observed class sequence; do not substitute another
fixed timeout.

### 16.3 P3 — failure exits skip the R6 blind-spot block (R6, AC6)

`FACT` — on selector-extraction failure `runGate` returns at `:309-312` before printing any scope or `CANNOT_SEE`. R6
requires the block "whatever the result". **Required change:** every `runGate` exit path prints `CANNOT_SEE` and the
scope facts it has (e.g. `scope: not discovered — selector extraction failed`), including the §16.2 discovery-failure
path. The missing-build exit in `main()` stays a one-line error.

### 16.4 Re-entry mode — `remediation`

- **Start at §16.1.** Do not re-run §13.1. Do not overwrite `00_`–`40_`; they are Rev 0 evidence, superseded only by the
  `50_`+ files below.
- Write set: `scripts/check-card-track-monotonicity.mjs`; `docs/storybook-governance.md` §15.10 (verify-arm paragraph —
  arms now run the gate's own sweep; discovery waits for render state; the mutation proof); the session log; the Task
  815 line of `docs/backlog.md`; `docs/sessions/evidence/task815/50_`+. `package.json`, the workflow and the two comment
  files are accepted and stay unchanged.
- Re-run the §13.2 block in full on the final tree, one transcript per command numbered from `50_`, each with the
  platform, Node version, working directory and exact command **inside the transcript**, plus `55_`–`57_`.
- The two `git status --porcelain` snapshots around `--verify-gate` are taken with no other session writing to the
  worktree. If another session is active, say so and print both the raw and the filtered comparison, filtering only
  that task's named paths.
- The final `git hash-object` line covers the script, `docs/storybook-governance.md`, `docs/backlog.md`, the session log
  and `57_mutation-probe.mjs`.

### 16.5 Revision acceptance criteria

- **AC7-R1 [R5, R7]** — `--verify-gate` exits 0; arms (b)/(c) each print the produced width, then exactly one
  `evaluateSweep` failure string naming `1023px->1024px measure 3->2` and `1279px->1280px measure 4->3` respectively;
  `git grep -n "plantedValue" -- scripts/check-card-track-monotonicity.mjs` returns no hit. Quote both.
- **AC11 [R7]** — the §16.1 mutation run exits 1 with arms (b) and (c) `FAILED`; the pre and post hashes are identical.
  Quote the arm lines and both hashes.
- **AC12 [R3]** — the discovery code has no discovery-only timeout; the session log records the render-settled body
  class list for the two stories named in §16.2; the real run lists the same 16 in-scope stories as `23_`.
- **AC13 [R6]** — a run whose selector extraction fails (arm (d)'s path invoked through `runGate`, or a temporary CLI
  argument; no repository file written) prints the `cannot see:` line. Quote it.

GR-4 AC AUDIT — 4 revision criteria; each states an observable property; absolutes: AC7-R1's zero-hit grep is the
removal of a named private comparator this revision requires; AC11's identical hashes are the restore property.

Completion status for Revision 1 stays `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
