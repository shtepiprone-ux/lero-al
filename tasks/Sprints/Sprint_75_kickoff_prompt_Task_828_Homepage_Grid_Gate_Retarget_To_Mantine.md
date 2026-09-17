# Task 828 — `check:homepage-grid` leaves the legacy `System/*` Stories and the retired grid ladder: retarget to `Patterns/Mantine/HomepageListingGrids`

Sprint 75 · P1 · QA profile **Q4**

**Status: `READY FOR SONNET` 2026-09-17.** Route fixed by owner decision 2026-09-17 (§5.1). Folds the backlog row
**Cleanup step 3** (delete the three consolidated probes the gate names).

## 1. Mode and task type

`IMPLEMENTATION` — governance gate rewrite (`scripts/check-homepage-grid.mjs` and its self-test), one Story
docs-text correction, deletion of three unwired probes, and one CI step label. Nothing in `src/` changes except
Story docs strings. Task-type bundles: **Regression / Critical Flow Coverage** (a blocking CI gate) +
**Storybook / Visual Proof** (story scope).

## 2. Objective

`npm run check:homepage-grid` is blocking in the `homepage-grid` CI job and exits 1 on every PR (12/260 PASS). It
measures only legacy Tailwind `System/*` Stories and asserts a column ladder that owner decisions D74-1/D74-4
removed from the product. Rewrite it so that it measures **only** the canonical Mantine Story
`Patterns/Mantine/HomepageListingGrids`. It keeps the invariants that still describe the product (header row,
loading skeleton count, no page-level horizontal scroll, 1408px page cap), gains a rail-mode guard, and drops the
superseded grid invariants. The gate exits 0 on the real tree, and its self-test proves every retained invariant
can fail.

## 3. Verified context — measured 2026-09-17 on `HEAD` `c177a0920`

### 3.1 The failure

`FACT` — `docs/sessions/evidence/task828/design/01_check-homepage-grid_HEAD.txt` (native `win32`, Node v22.22.3,
Storybook built 2026-09-17 09:49): `I-A/supporting (step matrix) 0/88 PASS` · `I-A/I-B/I-D (gap matrix) 0/160 PASS` ·
`I-C (header matrix) 12/12 PASS` · `TOTAL: 12/260 PASS, 248 FAIL` · `EXIT_CODE=1`. The same totals were recorded
on `1ed5cd2a5` (`docs/sessions/evidence/task815/design/03_check-homepage-grid_HEAD.txt`). The script prints only
the first 20 failing rows per matrix (`scripts/check-homepage-grid.mjs:648`), so the retained rows show
`grid-not-found` (step matrix) and `columnCount=1 … columnGap=normal` (gap matrix) on
`system-featuredlistings--default`.

`FACT` — CI: `.github/workflows/governance-pr.yml` job `homepage-grid` runs `check:card-track-monotonicity`,
its `:verify`, then `check:homepage-grid` and `check:homepage-grid:verify`, none with `continue-on-error`.

### 3.2 Why every I-A/I-B cell fails — the product changed by owner decision

`FACT` — `tasks/Sprints/Sprint_74_One_Card_Width_For_The_Whole_Site.md`, owner decisions 2026-09-10, quoted:

> **D74-1 — mechanism.** One shared track: grids use `repeat(auto-fill, minmax(var(--listing-card-min), 1fr))`;
> rails use the same width in a horizontal scroll container. Per-surface `cols={{base,sm,xl,xxl}}` ladders are
> removed, not re-tuned.

> **D74-4 — Featured and Latest are rails.** … both homepage sections scroll horizontally at **every** width …

`FACT` — `FeaturedListingsView.tsx:73,92` and `LatestListingsView.tsx:51,64` render
`<MantineListingCardTrack mode="rail">` in both the loading and populated branches. The gate's I-A
(`STEP_EXPECTED_COLS`, `GAP_EXPECTED_COLS`: 1/2/3/4 columns at fixed widths) and I-B (`GAP_EXPECTED_PX` 16/12
grid gaps) assert exactly the per-surface ladder D74-1 removed. Rail geometry (visible card count must not drop
as width grows) is already gated by `check:card-track-monotonicity` (Task 815) on every canonical Mantine Story
that renders the track, including `patterns-mantine-homepagelistinggrids--{default,loading}`
(`docs/sessions/evidence/task815/design/01_census-and-sweep.txt`).

### 3.3 The owner's scope rule

`FACT` — owner message 2026-09-17, quoted verbatim in §5.1: legacy Tailwind Stories are not covered by tests;
only Mantine Stories are.

`FACT` — the gate's story targets are all legacy: `STEP_STORIES` (`system-featuredlistings--default`,
`system-similarlistings--default`), `GAP_STORIES` (`system-{featured,latest}listings--{default,loading}`),
`HEADER_STORY_ID = 'system-featuredlistings--default'` (`:80-128`), plus the self-test plants at `:687-751`.

### 3.4 The canonical target

`FACT` — `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx`: title
`Patterns/Mantine/HomepageListingGrids` (canonical by prefix, `scripts/lib/mantine-story-scope.mjs`),
`skipCanvas: true`. It renders the real `FeaturedListingsView` + `LatestListingsView` inside
`<Box maw="var(--width-page-max)" mx="auto" w="100%" px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="2xl">`.
Exports `Default` (populated, `:84`) and `Loading` (`:125`), so the IDs are
`patterns-mantine-homepagelistinggrids--default` and `--loading`.

`FACT` — the loading branches render exactly 3 Featured (`FeaturedListingsView.tsx:74`,
`Array.from({ length: 3 })`, inside `MantineListingCardTrack` with `className="featured-listings"`) and 4 Latest
(`LatestListingsView.tsx:52`, `length: 4`, `className="latest-listings"`) skeleton items.

`FACT` — the Featured header is `FeaturedListingsView.tsx:55-66` (`Group` with `className={styles.headerRow}`). It
renders in both branches. The View-all link renders only when `!loading && listings.length > 0`.

`FACT` — the story's docs text is stale. `component` says "migrated from raw Tailwind grid containers to Mantine
`SimpleGrid` … column step", and `Default`'s says "Featured steps 1/2/3/4 cols at </640/640/1280/1440, Latest
steps 1/2/3 cols". Both contradict §3.2.

`FACT` — `--width-page-max: 88rem` is defined at `src/app/globals.css:299` (definition grepped, not the docs table).

### 3.5 The three probes (backlog row "Cleanup step 3")

`FACT` — `scripts/task420-qa-grid-step.mjs` (302 lines), `scripts/task668-qa-grid-1440.mjs` (385),
`scripts/task668-qa-header-geometry.mjs` (397), measured with `wc -l`. `git grep` outside `docs/sessions`,
`docs/backlog-archive.md` and `tasks/`: the only live references are the backlog row itself, the header and inline
comments of `check-homepage-grid.mjs`, the probes' own self-references, and one historical result sentence at
`docs/responsive-storybook-inventory.md:263`. No `package.json` script or `.github/` file names them. The owner's
post-693 sequence (script header, "Owner directive (2026-07-31) … deleting/renaming them is step 3") authorizes
the deletion. The backlog row says: "Must also update `check-homepage-grid.mjs`, which names all three."

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §5.1, §3.3 | The gate navigates to **no** story whose title fails `isCanonicalMantineTitle`. Its only targets are `patterns-mantine-homepagelistinggrids--default` and `--loading`. `git grep -n "system-" scripts/check-homepage-grid.mjs` returns 0 hits. | **P0** | AC1 | Confirmed |
| **R2** | §3.2, D74-1/D74-4 | I-A (column steps) and I-B (grid gaps) are removed with their constants and plants. The header comment and the printed scope state why (D74-1/D74-4) and name the gate that covers rail geometry (`check:card-track-monotonicity`). | **P0** | AC1, AC6 | Confirmed |
| **R3** | kept invariant | **I-C header**: on `--default` at 320/640/1440 × sq/en/uk/it, the Featured header `Group` satisfies the existing `HEADER_EXPECTED_RULES` (compact <640, wide ≥640). The rules and rect epsilon are unchanged; only the target story changes. | **P0** | AC2 | Confirmed |
| **R4** | kept invariant, §3.4 | **I-D skeleton count**: on `--loading` at 320/1024/1440 × 4 locales, the Featured rail (`.featured-listings`) holds exactly 3 skeleton items and the Latest rail (`.latest-listings`) exactly 4. Count the track's item elements, not `.mantine-Skeleton-root` nodes. | **P0** | AC2 | Confirmed |
| **R5** | kept supporting | **No page-level horizontal scroll**: on `--default` at 320/375/390/640/768/1024/1280/1440/1536/1920/2560 × 4 locales, `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2`. A rail's own internal scroll is not page scroll. | **P0** | AC2 | Confirmed |
| **R6** | kept supporting | **1408px page cap**: on `--default` at 1536/1920/2560 × 4 locales, the content box of the story's page-frame element (the element whose computed `max-width` is `1408px`) is ≤ 1408 + 2 px. A missing page-frame element is a failure, never a pass. | P1 | AC2 | Confirmed |
| **R7** | replaces I-A's guard of D74-4 | **Rail mode**: on `--default` at 320/1024/1440 × 4 locales, both the Featured and the Latest track render their rail scroller (computed `display` is `flex` and `overflow-x` is `auto` or `scroll`) and no `display:grid` card container exists inside either section. A Featured/Latest regression to a grid fails. | **P0** | AC2 | Confirmed |
| **R8** | Q4 | `--verify-gate`: the negative arm passes on the unmodified tree. Each of R3/R4/R5/R6/R7 has one in-page `page.evaluate` plant that trips **that** invariant and no other, restored in `finally`. A plant that does not trip, trips the wrong invariant, or survives exits non-zero. | **P0** | AC3 | Confirmed |
| **R9** | fail-closed | A story that fails to render, a missing locator (header, rail, page frame), or a story ID absent from `storybook-static/index.json` is a failing cell with a named reason, never a skip. The run exits non-zero if the discovered index lacks either target ID. | **P0** | AC4 | Confirmed |
| **R10** | §3.4 | `HomepageListingGrids.stories.tsx` docs strings (`component` and each story's `description`) describe rails per D74-4, with no column-step or `SimpleGrid` claim. Render code is byte-unchanged. | P2 | AC5 | Confirmed |
| **R11** | §3.5 | The three probes are deleted. Every live reference outside history is removed or reworded: the gate's comments, and the backlog row, closed by this task. `docs/responsive-storybook-inventory.md:263` is historical ("Result (Task 420, 2026-06-12)") and stays. | P1 | AC6 | Confirmed |
| **R12** | GR-2 | The gate prints its scope on every run: the two story IDs, the invariant list, and the excluded classes (legacy `System/*` Stories per the owner rule of 2026-09-17; rail card counts → `check:card-track-monotonicity`). | P1 | AC1 | Confirmed |

## 5. Assumptions and open questions

### 5.1 Owner decisions — 2026-09-17, quoted verbatim

> ми не покриваємо тестами TailWind Stories, ми покриваємо лише Minetine, тому всі Tailwind Stories мають бути
> виключені з тестів!

Selected option on Task 828, same session:

> Перенести на Mantine Story (Recommended)

The option text shown to the owner: "Гейт перевіряє лише Patterns/Mantine/HomepageListingGrids (Default +
Loading). Видаляються I-A/I-B як superseded D74, лишаються I-C (header), I-D (кількість skeleton), без
горизонтального скролу і cap 1408. Оновлюється застарілий опис Story. Self-test з планту."

### 5.2 Assumptions and stops

- `ASSUMPTION` (measured at I0) — I-C's rules hold on the canonical story at 640 and 1440 as they did on
  `System/FeaturedListings` (the rules read the header `Group`'s own computed style). **Stop:** if any R3 cell
  fails on the unmodified product at I0, return `BLOCKED` with the cell and computed values. Do not retune
  `HEADER_EXPECTED_RULES`.
- **R7 is Opus's addition, not the owner's option text.** Reason: removing I-A removes the only assertion that
  Featured/Latest are not grids. The monotonicity gate counts cards per width but does not require `rail` mode. It
  asserts D74-4, an owner decision, so it adds no new product rule.
- Stop: if the rail DOM of `MantineListingCardTrack` cannot be located without a Tailwind or hashed class, use
  the track's stable global class (`featured-listings` / `latest-listings`) and its first flex-scroll
  descendant. If neither exists, return `BLOCKED` with the DOM snapshot.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` clauses 9, 14, 15 · `docs/qa-profiles.md` (Q4) ·
`docs/critical-flow-registry.md` (scan only) · `docs/storybook-governance.md` §14.9 story-scope notes ·
`scripts/lib/mantine-story-scope.mjs` · `scripts/check-homepage-grid.mjs` in full ·
`scripts/check-card-track-monotonicity.mjs` header (its scope statement) · `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` ·
`src/modules/listings/components/FeaturedListingsView.tsx` · `LatestListingsView.tsx` ·
`src/design-system/mantine/patterns/MantineListingCardTrack.tsx` (+ `.module.css` rail rules) ·
`tasks/Sprints/Sprint_74_One_Card_Width_For_The_Whole_Site.md` D74-1…D74-9 · this kickoff.

## 7. Scope

- **Edited:** `scripts/check-homepage-grid.mjs` · `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx`
  (docs strings only) · `.github/workflows/governance-pr.yml` (the two `homepage-grid` step **names** only; commands
  unchanged) · `docs/backlog.md` (828 state line; the "Cleanup step 3" row marked folded into 828).
- **Deleted:** `scripts/task420-qa-grid-step.mjs` · `scripts/task668-qa-grid-1440.mjs` ·
  `scripts/task668-qa-header-geometry.mjs`.
- **Written:** `docs/sessions/evidence/task828/*` (never under `design/`) · `docs/sessions/<date>-task828-*.md`.

## 8. Out of scope

`System/*` story files (Task 827 migrates them) · `check:card-track-monotonicity` · `MantineListingCardTrack` and
both Views (no product change) · `scripts/check-stories-rendered.mjs` and `scripts/responsive-screenshots.mjs`
(retired `screenshots:*` tooling; their `system-*` IDs are not a live gate) · `docs/responsive-storybook-inventory.md`.

## 9. Current and required behavior

**Before.** Blocking CI step exits 1 on every PR. It measures legacy Tailwind Stories against a grid ladder the
product no longer has. Only the header matrix passes.
**After.** It measures the canonical Mantine homepage Story only, asserts header / skeleton / no-page-scroll / page
cap / rail mode, exits 0 on the real tree, and the self-test proves each assertion can fail. The three dead probes
are gone.

## 10. Implementation requirements

1. **I0 baseline** (§13.1) before any edit: the existing gate transcript on the current tree, the Storybook index
   IDs, and one probe run on the canonical story recording R3–R7's raw values per cell (retain the probe under
   `docs/sessions/evidence/task828/`, outside `scripts/`).
2. Rewrite the matrices: keep the static server, render-failure guard and `navigateAndCheck`. Remove
   `STEP_*`/`GAP_EXPECTED_COLS`/`GAP_EXPECTED_PX` and the `tailwind-tokens`/`mechanism-agnostic`/`first-grid`
   locators. Add evaluators for R4–R7. Keep `evalHeaderCell` and retarget it.
3. Rewrite `--verify-gate` per R8. Plants mutate only in-page state (inline style or DOM removal on a cloned-safe
   target) and restore in `finally`.
4. Rewrite the header comment: what is measured, the two IDs, the owner rule, D74-1/D74-4, the covering gate, and
   the removal of I-A/I-B and the three probes.
5. Write through Node UTF-8 I/O. Never `Get-Content -Raw` without `-Encoding utf8`.
6. Delete the probes, then run the whole-repository reference audit (§13.2's `git grep`).

## 11. Positive and negative flows

**Positive.** A PR that touches nothing homepage-related: the `homepage-grid` job goes green. A PR that makes
Featured a grid or breaks the header: the job fails, naming the invariant and cell.

| Negative flow | Applicable | Expected |
|---|---|---|
| Target story ID missing from the Storybook index | Yes | exit non-zero, named reason (R9) |
| Story render error / missing locator | Yes | failing cell, named reason (R9) |
| A plant does not trip, or trips the wrong invariant | Yes | `--verify-gate` exit non-zero (R8) |
| Long locale text (`uk`, `it`) overflows the page | Yes | R5 fails on that cell |
| Legacy story re-added as a target | Yes | AC1's grep and R1 |
| Auth / RLS / network | No | static Storybook, no data layer |

## 12. Acceptance criteria

- **AC1 [R1, R2, R12]** — `git grep -n "system-" scripts/check-homepage-grid.mjs` returns 0 lines;
  `git grep -nE "STEP_EXPECTED_COLS|GAP_EXPECTED_COLS|GAP_EXPECTED_PX" scripts/check-homepage-grid.mjs` returns 0
  lines. The run output's first block prints the two IDs, the invariant list and both excluded classes. Quote all three.
- **AC2 [R3–R7]** — `npm run check:homepage-grid` exits 0. Its summary lists each invariant with `n/n PASS` and the
  cell counts R3 = 12, R4 = 24 (3 widths × 4 locales × 2 rails), R5 = 44, R6 = 12, R7 = 24. Quote the summary.
- **AC3 [R8]** — `npm run check:homepage-grid:verify` exits 0. Its output shows the negative arm PASS and each of
  the five plants tripping only its own invariant, then restored. Quote it.
- **AC4 [R9]** — failing arm, required: run the gate once with the target ID temporarily misspelled **in a scratch
  copy of the script outside `scripts/`** (never in the tracked file). It exits non-zero naming the missing ID.
  Retain the transcript and delete the copy. Record `git status --porcelain` showing no scratch path.
- **AC5 [R10]** — `git diff` of the story file touches only string literals inside `parameters.docs`. Quote the
  diff. `npm run build-storybook` exits 0.
- **AC6 [R11, R2]** — the three probe files are absent. `git grep -nE "task420-qa-grid-step|task668-qa-grid-1440|task668-qa-header-geometry" -- ":!docs/sessions" ":!docs/backlog-archive.md" ":!tasks"`
  returns only `docs/responsive-storybook-inventory.md:263`. Quote the output.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC1's 0-hit greps and AC6's single
remaining line are exact scope definitions of this task's own deletions, which a correct implementation always
satisfies.`

## 13. QA profile and verification plan

**`Q4`** — a blocking CI gate is rewritten, so planted-violation proof is required (R8, AC4). No product or canvas
render change. The owner visual matrix is limited to the docs text (§13.3).

### 13.1 Baseline (I0)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object scripts/check-homepage-grid.mjs src/stories/patterns/mantine/HomepageListingGrids.stories.tsx .github/workflows/governance-pr.yml
npm.cmd run build-storybook
npm.cmd run check:homepage-grid
node.exe -e "const i=require('./storybook-static/index.json');for(const id of ['patterns-mantine-homepagelistinggrids--default','patterns-mantine-homepagelistinggrids--loading'])console.log(id, !!i.entries[id])"
```

Expected: `win32`; the status snapshot recorded (every entry classified before the first write); `build-storybook`
exit 0; the gate exits 1 at 12/260 (§3.1); both IDs `true`. Then run the I0 probe for R3–R7 on the canonical story
and retain its JSON.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run build-storybook
npm.cmd run check:homepage-grid
npm.cmd run check:homepage-grid:verify
npm.cmd run check:card-track-monotonicity
npm.cmd run check:stories
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -nE "task420-qa-grid-step|task668-qa-grid-1440|task668-qa-header-geometry" -- ":!docs/sessions" ":!docs/backlog-archive.md" ":!tasks"
git --no-optional-locks diff --stat
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object scripts/check-homepage-grid.mjs src/stories/patterns/mantine/HomepageListingGrids.stories.tsx .github/workflows/governance-pr.yml docs/backlog.md
```

Expected: every command exit 0, except that `git grep` prints the single line of AC6. Each command gets its own
unpiped transcript with `EXIT_CODE=` appended. The hash-object line is captured in the same pass.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

| Story | View | Locale | Owner checks |
|---|---|---|---|
| `patterns-mantine-homepagelistinggrids--default` | Docs tab | en | description says rails, no column steps |
| `patterns-mantine-homepagelistinggrids--loading` | Docs tab | en | description matches the loading rails |

## 14. Completion report contract

Files changed/deleted with hashes · R1–R12 status · I0 transcripts and probe JSON · AC1–AC6 quotes · every command
with exit code and transcript path · assumptions · deviations · limitations · the §13.3 matrix handed to the
owner. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval,
no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Is removing I-A/I-B weakening a gate? | It removes assertions of a ladder D74-1 deleted from the product (quoted §3.2). Rail geometry is gated by 815. R7 keeps the D74-4 guard. |
| Why not keep the `System/*` targets after 827 migrates them? | The owner selected the canonical `HomepageListingGrids` route (§5.1). |
| Why fold Cleanup step 3? | The same file is rewritten here. The row itself requires this file's update, and the owner sequence authorizes the deletion (§3.5). |
| GR-1 / 16d? | No production surface changes. The story's rendered tree is unchanged (AC5 docs-only diff). |
| Dirty worktree? | Clean at design (`git status` empty after 825's commit). The executor re-captures at I0 and classifies every entry. |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| Owner rule 2026-09-17 (Tailwind stories excluded) | no legacy story target | R1, AC1 | COMPLIANT |
| `qa-profiles` Q4 | planted-violation proof | R8, AC3, AC4 | COMPLIANT |
| `agent-contract` 9 | final build exit 0; deletion reference audit | §13.2, AC6 | COMPLIANT |
| `agent-contract` 14 | encoding-safe writes, integrity gates | §10.5, §13.2 | COMPLIANT |
| GR-2 | gate prints its scope and blind spot | R12 | COMPLIANT |
| GR-4 | observable ACs | §12 audit | COMPLIANT |

| Checkpoint | Preconditions | Writes allowed | Producer / artifact | Comparator / failure |
|---|---|---|---|---|
| 0 I0 | status snapshot | evidence only | §13.1 transcripts, probe JSON | an R3 cell fails on the product → `BLOCKED` |
| 1 rewrite | I0 retained | gate script, story docs, workflow names | `git diff` | extra path → revise |
| 2 real run | built Storybook | none | AC2 transcript | any cell fail → not done |
| 3 self-test | — | none | AC3 transcript | plant not tripping or cross-tripping → not done |
| 4 fail-closed arm | scratch copy outside `scripts/` | scratch only | AC4 transcript + porcelain | scratch path remains → not done |
| 5 deletions | — | 3 deletions, backlog | AC6 grep | extra live hit → not done |
| 6 final | — | none | §13.2 | any required non-zero → not `IMPLEMENTED` |
