# Task 827 — The four `System/*` listing Stories leave their Tailwind wrappers for the canonical Mantine story shell, and enter the Mantine gates

Sprint 75 · P2 · QA profile **Q4**

**Status: `NEEDS REVISION` 2026-09-17 — the owner rejected the task (review 3). The ONLY executable route is §18.
§1–§17 are history. Do not follow their migration, enrolment, story-shell or visual-matrix instructions, except where §18
explicitly keeps something.** The §5.1 route is superseded by the owner decision in §18.1. **Folds reserved Task 735**
(its enrolment half is moot, because §18 deletes the story instead).

## 1. Mode and task type

`IMPLEMENTATION` — Storybook harness migration (4 story files) plus gate scope (`scripts/lib/mantine-story-scope.mjs`,
`scripts/check-design-tokens.mjs` story membership, `scripts/check-card-track-monotonicity.mjs` scope text). Bundles:
**Storybook / Visual Proof** (Mantine path) + **Regression / Critical Flow Coverage** (gate scope). No production
component changes.

## 2. Objective

`System/FeaturedListings`, `System/LatestListings`, `System/SimilarListings` and `System/RecentlyViewedSection` render
real, enrolled production Views, but inside legacy Tailwind wrappers (`container-wide mx-auto px-4 py-8`) nested in
Storybook's own `.container-wide` canvas. At 1536px both containers step to 48px padding, the rail narrows 1280→1216px,
and one visible card disappears. No gate sees it, because the owner's rule excludes Tailwind Stories from tests. Per the
owner's decision, fix the wrappers the canonical Mantine way (`skipCanvas` + `MantineStoryShell`, zero Tailwind in
these files) and put the four Stories under the Mantine gates. Those gates must demonstrably fail on the defect before
the fix and pass after it.

## 3. Verified context — measured 2026-09-17 on `HEAD` `c177a0920`

### 3.1 The measured defect

`FACT` — `docs/sessions/evidence/task815/design/01_census-and-sweep.txt`: `system-featuredlistings--default`,
`system-latestlistings--default`, `system-recentlyviewedsection--populated`, `system-similarlistings--default` each
report `drops [{"mode":"rail","from":1441,"to":1920,"before":5,"after":4,"widthBefore":1280,"widthAfter":1216}]`. The
other 7 `System/*` stories that render the track do not drop. `02_drop-attribution.json`: the ancestor chain is
`container-wide mx-auto px-4 py-8` (1344px, 32px padding) inside `container-wide py-6` (1408px, 32px padding) at
1441px.

`FACT` — `.storybook/preview.tsx:132-142` `withCanvas` wraps every story in `<div className="container-wide py-6">`
unless `parameters.skipCanvas` is set. `src/app/globals.css:710-720` `.container-wide` pads 1rem → 1.5rem ≥640 →
2rem ≥1024 → 3rem ≥1536. Production renders **one** container (`MantineHomeSection` → `<Box className="container-wide">`,
`MantineHomeSection.tsx:51`; `src/app/[locale]/page.tsx:52-63`).

### 3.2 The four files

`FACT` — `className` count / `skipCanvas` count: `FeaturedListings.stories.tsx` 4 / 0 · `LatestListings.stories.tsx`
4 / 0 · `RecentlyViewedSection.stories.tsx` 4 / 0 (three `container-wide mx-auto px-4 py-8`, one `py-4 px-4` at `:78`
in `MobileScroll`) · `SimilarListings.stories.tsx` 2 / 0. Exports: Featured `Default, LocaleStress, Loading, Empty` ·
Latest `Default, LocaleStress, Loading, Empty` · RecentlyViewed `Populated, MobileScroll, EmptyState, LocaleStress` ·
Similar `Default, LocaleStress`. None contains `<Button`.

### 3.3 The canonical Mantine story shell

`FACT` — `src/stories/mantine/_MantineStoryShell.tsx`: the single-source TailAdmin showcase shell for Mantine story
files. It uses Mantine `Box` style props only (`bg`, `px={{ base: 0, sm: 'md', md: 'xl' }}`, `py`, `bd`, `bdrs`), and its
width-bearing steps are documented as monotonic-safe for `MantineListingCardTrack` (Task 809 R6 / Task 815). The
existing canonical stories for two of the same Views already use it with `parameters: { skipCanvas: true, layout: 'fullscreen' }`:
`Mantine/Primitives/SimilarListingsView` and `Mantine/Primitives/RecentlyViewedGridView`.

### 3.4 The gates and their scope definitions

`FACT` — `scripts/lib/mantine-story-scope.mjs`: canonical iff title starts with `Mantine/Primitives/` or
`Patterns/Mantine/`, **or** equals a key of `MANTINE_STORY_ENROLLED_TITLES` (Task 678, "the exact-title escape hatch"
for a canonical story under an unmigrated segment; current key: `Admin/AdminUsersTable`). Consumers:
`check:card-track-monotonicity` (blocking, `homepage-grid` CI job), `check:story-coverage` (blocking),
`check:locale-leak:mantine-only` (CI job, non-blocking per workflow comment), `audit-design-system-patterns`.

`FACT` — `scripts/__tests__/mantine-story-scope.test.ts:16` asserts `isCanonicalMantineTitle('System/FeaturedListings')`
is `false`, and `:44` uses it in the empty-enrolment case.

`FACT` — `scripts/check-design-tokens.mjs:124` `CANONICAL_MANTINE_STORY_PATH = /^src\/stories\/(?:mantine|patterns\/mantine)\//`
decides which story files get the `tailwind-dimension-utility` rule (`:314-321`, `storyOnly`). It is path-based and
never consults `mantine-story-scope.mjs`, so a title-enrolled story at `src/stories/*.stories.tsx` is invisible to it.

`FACT` — `scripts/check-card-track-monotonicity.mjs:20-23` and `:361-365` print the `System/*` exclusion as "Task 827
owns the known 1535->1536 drop there".

`FACT` — `scripts/check-stories.mjs:806` Check 14 (off-scale `Button size`) collects `src/stories/mantine/**` by
directory. It does not cover these four files, but they contain no `<Button` (§3.2). Not changed here, and stated as a
boundary in R8.

### 3.5 Story IDs must not change

`FACT` — `tasks/Sprints/Sprint_48_Homepage_Tail_DeTailwind.md:61`: "**Do not re-title `System/FeaturedListings` /
`System/LatestListings`.**" Their IDs are hard-coded in governance scripts. Task 828 moves `check:homepage-grid` off
them, but `scripts/responsive-screenshots.mjs:100-118` and `scripts/check-stories-rendered.mjs:171-174` (retired
tooling) still name them. Keeping titles and paths keeps every ID stable.

### 3.6 Reserved Task 735

`FACT` — `docs/backlog-reserved.md:22`: "Enrol `System/FeaturedListings` via the Task 678 per-story mechanism + a
`wide-1440` `MANTINE_STORY_EXTRA_VIEWPORTS` entry". The enrolment half is R3 below. The `MANTINE_STORY_EXTRA_VIEWPORTS`
half belongs to `screenshots:assert` (`check-stories-rendered.mjs`), retired by owner decision 2026-09-03, so it is
obsolete. 735 closes as folded into 827.

### 3.7 Allowlist rows naming these files

`FACT` — `scripts/story-realmode-allowlist.json:16`: `RecentlyViewedSection.stories.tsx` / `MobileScroll` / check 12.
`scripts/governance/tailwind-entropy.allowlist.json:307-315`: `RecentlyViewedSection.stories.tsx` / `text-[10px]`.
`git grep "text-\[10px\]" src/stories/RecentlyViewedSection.stories.tsx` returns nothing today, so the latter already
names a pattern the file does not contain.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §5.1, §3.2, §3.3 | Each of the 4 files sets `parameters: { skipCanvas: true, layout: 'fullscreen' }` at `meta` (keeping existing `docs` parameters) and renders every story inside `<MantineStoryShell>` imported from `./mantine/_MantineStoryShell`. The files contain **zero** `className` attributes and zero Tailwind utility tokens. | **P0** | AC4, AC5 | Confirmed |
| **R2** | §3.1 | No wrapper nesting: from each story's track up to `#storybook-root`, no ancestor carries `.container-wide`, and `MantineStoryShell` is the only padding ancestor the story adds. | **P0** | AC3 | Confirmed |
| **R3** | §5.1, §3.4, §3.6 | `MANTINE_STORY_ENROLLED_TITLES` gains exactly the 4 titles, each with a reason naming Task 827, the real View it imports and the migrated wrapper. No prefix is added, and `System/Containers` and every other `System/*` title stay non-canonical. | **P0** | AC1, AC2 | Confirmed |
| **R4** | §3.4 | `mantine-story-scope.test.ts` asserts the 4 titles are `true` and at least `System/Containers` is `false`. The empty-enrolment case keeps reducing to prefix-only, using a still-unenrolled `System/*` title. All existing assertions about `Admin/*` stay. | **P0** | AC1 | Confirmed |
| **R5** | §3.4, GR-3 | `check-design-tokens.mjs`'s canonical-story membership becomes **path rule OR a `.stories.tsx` whose default-export `meta` `title` string satisfies `isCanonicalMantineTitle`** (imported from `scripts/lib/mantine-story-scope.mjs`, never re-implemented). The title is read statically from the file (the `title: '…'` literal inside the default-exported meta object). A file whose title cannot be read statically is non-canonical by title and still subject to the path rule. The printed scope says so. | **P0** | AC1, AC4 | Confirmed |
| **R6** | tests | `scripts/__tests__/check-design-tokens.test.ts` gains arms: (a) a `src/stories/X.stories.tsx` fixture with an enrolled title and `className="px-4"` → `tailwind-dimension-utility` finding; (b) same content with a non-enrolled `System/*` title → no finding; (c) a path-canonical story is unchanged. | **P0** | AC1 | Confirmed |
| **R7** | §3.4 | `check:card-track-monotonicity` in-scope list includes every enrolled story that renders the track, and the printed exclusion no longer attributes the drop to 827 open work. It states the enrolled titles and that the remaining `System/*` stories are excluded by the owner rule of 2026-09-17. The comment block `:20-23` says the same. Gate logic is unchanged. | **P0** | AC2, AC3 | Confirmed |
| **R8** | GR-2 | The session log's boundary section states: Check 14 of `check:stories` stays directory-scoped and does not cover title-enrolled files (no `<Button` in the 4 files today). `check:locale-leak:mantine-only` now includes the 4 stories. | P1 | AC6 | Confirmed |
| **R9** | §3.7, `agent-contract` 9 | `story-realmode-allowlist.json:16` is kept or removed according to `check:stories`' own verdict after migration (quote it). The `tailwind-entropy.allowlist.json` `text-[10px]` row for this file is removed if `governance:tailwind` reports it stale or unused, and otherwise kept with its verdict quoted. No new allowlist row is added. | P2 | AC6 | Confirmed |
| **R10** | §3.6 | Reserved 735 is recorded as folded into 827 in `docs/backlog-reserved.md` and the `docs/backlog.md` registry row. | P2 | AC6 | Confirmed |

## 5. Assumptions and open questions

### 5.1 Owner decisions — 2026-09-17, quoted verbatim

> ми не покриваємо тестами TailWind Stories, ми покриваємо лише Minetine, тому всі Tailwind Stories мають бути
> виключені з тестів!

On Task 827, same session (asked whether to close 827 as superseded or fix the wrappers):

> Необхідно виправити обгортки і написати тести (gates). Має бути все правильно зроблено, якісно, з Minetine
> канонічними стилями та токенами.

Binding reading, derived by Opus (reversible, recorded here so the owner can overrule it): "Mantine canonical styles
and tokens" = the existing canonical story shell (§3.3), with no Tailwind left in the files (R1). "Write tests (gates)" =
bring the four stories into the existing blocking Mantine gates through the one sanctioned mechanism (R3), make the
path-based design-tokens rule see them (R5/R6), and prove the gates fail on the current defect (§10.2). Once migrated,
these are Mantine stories, so the owner's first rule is satisfied, not bypassed.

### 5.2 Assumptions and stops

- `ASSUMPTION` (measured at I0) — `check:locale-leak:mantine-only` finds no leak in the 4 stories after enrolment.
  **Stop:** a leak originating in a production View is reported as `BLOCKED` with the string and component. A leak in
  story fixture text is fixed in the story through the existing `storyT`/fixture path.
- `ASSUMPTION` — after migration, no enrolled story drops a card anywhere in the gate's sweep. **Stop:** any remaining
  drop is reported with its widths and ancestor chain. `MantineStoryShell` is not edited.
- Titles and file paths do not change (§3.5).

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` 9, 13, 14, 16b, 16c · `docs/qa-profiles.md` (Q3/Q4) ·
`docs/mantine-responsive-design-system.md` (story shell and Storybook proof path) · `docs/storybook-governance.md`
§14.9 · `.storybook/preview.tsx:115-145` · `src/stories/mantine/_MantineStoryShell.tsx` ·
`src/stories/mantine/primitives/SimilarListingsView.stories.tsx` (reference usage) · the 4 story files ·
`scripts/lib/mantine-story-scope.mjs` + its test · `scripts/check-design-tokens.mjs:100-130, 300-330, 1205-1260` + its
test file · `scripts/check-card-track-monotonicity.mjs` header and `printScopeReport` · this kickoff.

## 7. Scope

- **Edited:** `src/stories/FeaturedListings.stories.tsx` · `src/stories/LatestListings.stories.tsx` ·
  `src/stories/SimilarListings.stories.tsx` · `src/stories/RecentlyViewedSection.stories.tsx` ·
  `scripts/lib/mantine-story-scope.mjs` · `scripts/__tests__/mantine-story-scope.test.ts` ·
  `scripts/check-design-tokens.mjs` · `scripts/__tests__/check-design-tokens.test.ts` ·
  `scripts/check-card-track-monotonicity.mjs` (comment + printed text only) · `docs/backlog.md` (827 state, 735
  folded) · `docs/backlog-reserved.md` (735 row). Conditionally, per R9: `scripts/story-realmode-allowlist.json`,
  `scripts/governance/tailwind-entropy.allowlist.json`.
- **Written:** `docs/sessions/evidence/task827/*` · `docs/sessions/<date>-task827-*.md`.

## 8. Out of scope

Production Views and `MantineListingCardTrack` · `_MantineStoryShell.tsx` · `.storybook/preview.tsx` · story titles and
paths · the other `System/*` stories (`Containers`, etc.) · `check-stories.mjs` · `check-homepage-grid.mjs` (Task 828) ·
retired `screenshots:*` scripts.

## 9. Current and required behavior

**Before.** Four legacy-wrapped stories double the container, lose a rail card at 1536px, and no gate measures them.
**After.** The same stories, same IDs, same states, in the canonical Mantine shell with no Tailwind. They are measured
by `check:card-track-monotonicity`, `check:story-coverage`, `check:locale-leak:mantine-only` and the design-tokens
story rule, and they pass.

## 10. Implementation requirements

1. **I0** (§13.1): status snapshot, hashes of every scoped file, `build-storybook`, `check:card-track-monotonicity`
   (expected exit 0, System excluded), `check:design-tokens:strict` (expected exit 0).
2. **Failing arm, required first:** apply R3 + R5 (enrolment and design-tokens membership) **without** touching the
   four story files. Rebuild Storybook and run both gates. Retain transcripts: `check:card-track-monotonicity` must exit
   non-zero naming the four drops of §3.1, and `check:design-tokens:strict` must exit non-zero naming
   `tailwind-dimension-utility` in the four files. If either exits 0, stop with `BLOCKED — TEST BLIND`.
3. Migrate the four files (R1/R2). Keep each story's render logic, fixtures, `globals` and `docs` text. Only the wrapper
   and `meta.parameters` change, plus any doc sentence that describes the old wrapper.
4. Update tests (R4/R6), the monotonicity scope text (R7), allowlists (R9) and state (R10).
5. Node UTF-8 I/O for every write.

## 11. Positive and negative flows

**Positive.** Open `System/FeaturedListings → Default` at 1536px: the rail shows the same card count as at 1535px, and
`check:card-track-monotonicity` lists and passes it.

| Negative flow | Applicable | Expected |
|---|---|---|
| A Tailwind wrapper re-added to an enrolled story | Yes | design-tokens story rule fails (R5/R6), monotonicity fails on nesting |
| A non-enrolled `System/*` story with Tailwind | Yes | still excluded, no finding (R6b) |
| Long locale text in `LocaleStress` | Yes | locale-leak and owner matrix at `uk@320` |
| Empty / loading branches | Yes | rendered in owner matrix; skeleton counts unchanged |
| Title not statically readable | Yes | not title-canonical (R5), no crash |

## 12. Acceptance criteria

- **AC1 [R3–R6]** — `npx vitest run scripts/__tests__/mantine-story-scope.test.ts scripts/__tests__/check-design-tokens.test.ts`
  exits 0, including the new arms. Quote the test names and totals.
- **AC2 [R3, R7]** — the retained failing-arm transcript (§10.2) shows `check:card-track-monotonicity` exit non-zero
  with the four `System/*` IDs in scope and dropping. The final transcript shows exit 0 with the four IDs (plus any
  other enrolled track-rendering `System/*` exports) listed in scope, and the new exclusion text.
- **AC3 [R2]** — a probe on the built Storybook, for each of the 14 exports at 1440/1535/1536/1920 in `en`, records the
  ancestor chain from the track (or the View root when no track renders) to `#storybook-root`, with `className` and
  computed padding. No ancestor carries `container-wide`. Retain the JSON; quote one cell per file.
- **AC4 [R1, R5]** — the failing-arm `check:design-tokens:strict` exits non-zero naming the four files, and the final
  run exits 0. `git --no-optional-locks grep -c "className" -- src/stories/FeaturedListings.stories.tsx src/stories/LatestListings.stories.tsx src/stories/SimilarListings.stories.tsx src/stories/RecentlyViewedSection.stories.tsx`
  prints no line (`git grep -c` omits files with 0 matches) and exits 1. Quote both gate runs and the grep with its exit code.
- **AC5 [R1]** — `npm run check:story-coverage` and `npm run check:stories` exit 0 on the final tree. Quote summaries.
- **AC6 [R8–R10]** — `npm run check:locale-leak:mantine-only` reports `Mantine selected:` equal to the
  `of N canonical` count printed by the same-tree `check:card-track-monotonicity` run (both select via
  `isCanonicalMantineTitle`; the monotonicity run lists the `system-*` IDs by name), and its `report.json` `leaks[]` has no
  `storyId` starting with `system-`. The leak gate's own exit code is not an AC: it is a non-blocking CI job, and leaks in
  other stories are outside this task (amended by review 1, §16.1 F2). `governance:tailwind` and `check:stories` verdicts for the two allowlist rows are quoted with the resulting
  edit or no-edit. `docs/backlog-reserved.md` 735 row reads folded into 827.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: "zero className" and "no ancestor carries
container-wide" are the migration's defined end state for four named files, which a correct implementation always
reaches.`

## 13. QA profile and verification plan

**`Q4`** — gate scope changes with failing-first proof (§10.2). The visible Storybook harness changes on 14 stories, so
Q3's owner visual review applies (§13.3). No production render changes.

### 13.1 Baseline (I0)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object src/stories/FeaturedListings.stories.tsx src/stories/LatestListings.stories.tsx src/stories/SimilarListings.stories.tsx src/stories/RecentlyViewedSection.stories.tsx scripts/lib/mantine-story-scope.mjs scripts/check-design-tokens.mjs scripts/check-card-track-monotonicity.mjs
npm.cmd run build-storybook
npm.cmd run check:card-track-monotonicity
npm.cmd run check:design-tokens:strict
```

Expected: `win32`; both gates exit 0 with `System/*` excluded.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run scripts/__tests__/mantine-story-scope.test.ts scripts/__tests__/check-design-tokens.test.ts
npm.cmd run check:design-tokens:strict
npm.cmd run build-storybook
npm.cmd run check:card-track-monotonicity
npm.cmd run check:card-track-monotonicity:verify
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run check:locale-leak:mantine-only
npm.cmd run governance:tailwind
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object src/stories/FeaturedListings.stories.tsx src/stories/LatestListings.stories.tsx src/stories/SimilarListings.stories.tsx src/stories/RecentlyViewedSection.stories.tsx scripts/lib/mantine-story-scope.mjs scripts/check-design-tokens.mjs scripts/check-card-track-monotonicity.mjs docs/backlog.md docs/backlog-reserved.md
```

Expected: every command exit 0. Each command gets its own unpiped transcript with `EXIT_CODE=`.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Open each story in Storybook after `build-storybook`, at the listed width and locale, and compare against the canonical
`Mantine/Primitives/SimilarListingsView → Default` shell (same background, gutter and card chrome).

| Story IDs | Widths | Locales | Owner checks |
|---|---|---|---|
| `system-featuredlistings--{default,locale-stress,loading,empty}` | 320, 1440, 1536 | en; `locale-stress` also uk | Mantine shell (no double gutter), header + view-all row, rail cards, skeletons, empty text |
| `system-latestlistings--{default,locale-stress,loading,empty}` | 320, 1440, 1536 | en; `locale-stress` also uk | same |
| `system-similarlistings--{default,locale-stress}` | 320, 1440, 1536 | en; `locale-stress` also uk | same |
| `system-recentlyviewedsection--{populated,mobile-scroll,empty-state,locale-stress}` | 320, 1440, 1536 (`mobile-scroll`: 375) | en; `locale-stress` also uk | same, plus the clear button |

## 14. Completion report contract

Files changed with hashes · R1–R10 · I0 + failing-arm transcripts · AC1–AC6 quotes · probe JSON path · every command
with exit code and path · assumptions · deviations · limitations · §13.3 matrix handed over. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Does enrolling `System/*` titles contradict "Tailwind stories are excluded"? | They stop being Tailwind stories in this task (R1). Enrolment is the sanctioned exact-title mechanism (Task 678), not a prefix. |
| Why not retitle into `Mantine/Primitives/`? | Sprint 48 forbids retitling (§3.5). IDs are referenced by scripts and docs. |
| Why touch `check-design-tokens.mjs`? | Its story rule is path-based. Without R5 the migrated files would be enrolled in title-based gates but invisible to the Tailwind rule, which is the blind-spot class this sprint exists to close. |
| GR-1 / 16d? | No production surface changes. The Views are already enrolled with their own canonical stories. |
| GR-3? | `SimilarListingsView` and `RecentlyViewedGridView` have their own canonical stories. `FeaturedListingsView` and `LatestListingsView` are imported by name in `Patterns/Mantine/HomepageListingGrids`. These four stories are additional states, not the component stories of record. |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| Owner decisions 2026-09-17 | Mantine-canonical wrappers and gate coverage | R1–R7, §5.1 | COMPLIANT |
| `agent-contract` 16b | canonical shell reused, no local style | R1, §3.3 | COMPLIANT |
| `qa-profiles` Q4 / Q3 | failing-first gate proof; owner visual matrix | §10.2, §13.3 | COMPLIANT |
| owner rule 2026-09-03 | no `screenshots:assert` | §13 | COMPLIANT |
| `agent-contract` 9 | build exit 0; allowlist reference audit | §13.2, R9 | COMPLIANT |
| GR-2 | stated boundaries | R7, R8 | COMPLIANT |

| Checkpoint | Producer / artifact | Comparator / failure |
|---|---|---|
| 0 I0 | §13.1 | either gate non-zero at I0 → report before editing |
| 1 red | enrolment + R5 only, both gates | either exits 0 → `BLOCKED — TEST BLIND` |
| 2 migrate | `git diff` of 4 stories | any change outside wrapper/meta params/wrapper doc text → revise |
| 3 green | §13.2 | any non-zero → not `IMPLEMENTED` |
| 4 geometry | AC3 probe JSON | any `container-wide` ancestor → not done |
| 5 owner | §13.3 | owner-recorded; not self-scored |

## 16. Review 1 — `NEEDS REVISION` 2026-09-17 (re-entry route)

Everything else from the first pass has been verified against the real diff and is kept. Final hashes match
`23_final-hashes.txt`. The failing arm is red on the 4 drops and 14 findings, and the final gates are green. The AC3
probe has 56 cells with zero `container-wide` ancestors. **Re-entry mode: `remediation`.** Do not edit the 4 story files,
`mantine-story-scope.mjs`, its test, or `check-card-track-monotonicity.mjs`. Do not rebuild Storybook, and do not re-run
monotonicity, the AC3 probe or I0. Keep every artifact `00`–`27`. New artifacts start at `28_`.

### 16.1 Findings

**F1 — P2 MEDIUM — R5, R6, AC1, AC4 · `scripts/check-design-tokens.mjs` `readStaticStoryTitle`.**
*Observed:* the regex returns the **first** `title:` string literal anywhere in the file. R5 requires "the `title: '…'`
literal inside the default-exported meta object". The code comment says every story in the repo "declares exactly one
`meta.title`". That premise is false: in 6 of 148 story files, a fixture `title:` comes before `meta`
(`src/components/admin/AdminReportsManager.stories.tsx`, `src/modules/cabinet/components/ListingsTab.stories.tsx`,
`src/modules/listings/components/ListingFormShellView.stories.tsx`,
`src/modules/notifications/components/NotificationItem.stories.tsx`,
`src/stories/mantine/primitives/NotificationBellView.stories.tsx`,
`src/stories/patterns/mantine/ListingDetailView.stories.tsx`).
*Reviewer probe:* content `const FIXTURE = { title: 'Apartament 2+1' }` followed by
`const meta = { title: 'System/FeaturedListings' }` and `className="px-4"`, at
`src/stories/FeaturedListings.stories.tsx`, returns `isCanonicalMantineStoryFile → false` with 0 findings. Without
the fixture line, it returns `true` with 1 finding.
*Impact:* when a story with that shape is title-enrolled, it is still selected by monotonicity, story coverage and
locale leak, because those read titles from the built index. The Tailwind rule silently skips it. That is the
fail-open blind spot this sprint exists to close. There is no wrong result today, because none of the 4 non-canonical-path
files above is enrolled.
*Resolution:* read the title only from the default-exported meta object. Support both repo forms: a
`const <name>(: Meta…)? = {…}` object whose identifier is the target of `export default <name>`, and an inline
`export default {…}` (with or without `satisfies`/`as`). Take `title:` only at that object's top level. If the object or its
title literal cannot be located, return `null` (non-canonical by title, and the path rule still applies). Keep
`isCanonicalMantineTitle` imported, never re-implemented. Correct the false comment.
*Verification:* R6 gains arms that must be red against the current `HEAD` implementation before the fix (retain the
transcript), then green after it:
- **(d)** a fixture `title: 'Apartament 2+1'` before `const meta = { title: 'Admin/AdminUsersTable' }` + `export default meta` + `className="px-4"` at a non-canonical path → 1 `tailwind-dimension-utility` finding;
- **(e)** a fixture `title: 'Admin/AdminUsersTable'` before `const meta = { title: 'System/Containers' }` + `export default meta` + `className="px-4"` at a non-canonical path → 0 findings. This fails closed in the other direction too;
- **(f)** a file with `title:` but no locatable default-exported meta → 0 findings, no throw.

Then run `check:design-tokens:strict`. It must print the same `103 canonical Mantine stories` as `07_` and exit 0. A
different count is a stop: report which file changed membership.

**F2 — orchestrator defect in AC6 / §13.2, corrected in place (no executor code).** AC6 asked the leak gate's output to
"name the 4 titles". That output only prints `Mantine selected: N`, and §13.2 expected exit 0 from a non-blocking job
that is red on other stories. AC6 now states the observable property. The retained `15_` (155 selected, equal to
`11_`'s `of 155 canonical`, which lists the `system-*` IDs) and its `report.json` (no `system-*` leak) already satisfy it.
Quote both in the session log. Do not re-run the gate.

**F3 — P3 LOW — session log accuracy.** §1 R5 says "103 canonical stories (was 99 pre-R3)". `03_i0-design-tokens-strict.txt`
prints **98**. The +5 is the 4 `System/*` files plus `src/components/admin/AdminUsersTable.stories.tsx`, which is now
correctly under the rule through its existing enrolment. State that. §8 says "`Mantine selected: 155` (was 151)". No
I0 leak transcript exists. The measured baseline is `02_i0-monotonicity.txt` `of 141 canonical` (+14 stories). Correct
both. §4 omits `27_final2-file-integrity.txt`. Add it.

### 16.2 Re-entry gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
npx.cmd vitest run scripts/__tests__/mantine-story-scope.test.ts scripts/__tests__/check-design-tokens.test.ts
npm.cmd run check:design-tokens:strict
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks hash-object scripts/check-design-tokens.mjs scripts/__tests__/check-design-tokens.test.ts docs/backlog.md
```

Run the first `vitest` line after adding arms (d)–(f) and **before** changing `readStaticStoryTitle`. It must exit
non-zero on (d) (`28_red-arms.txt`). If it exits 0, stop with `BLOCKED — TEST BLIND`. Every other command must exit 0
after the fix. Each gets its own unpiped transcript with `EXIT_CODE=`.

### 16.3 Completion

Update the session log with a `Revision 1` section: F1 diff, red/green arm transcripts, F2 quotes and F3 corrections.
Update the `Files Changed` table. Update the `docs/backlog.md` 827 sentence. Status `IMPLEMENTED - AWAITING ORCHESTRATOR
REVIEW`. The §13.3 owner visual matrix is still owed and is not affected by this revision.

## 17. Review 2 — `PARTIALLY VERIFIED` 2026-09-17

F1 is fixed. The red-first evidence exists: `28_red-arms.txt` has (d)/(e) failing against the old reader, and `30_` has
162/162 passing. `31_` still reports 103 canonical stories. A reviewer probe compared the new reader with each file's own
`meta`/`export default` title across all 148 story files and found 0 differences. The hashes of `check-design-tokens.mjs`,
its test and `docs/backlog.md` match `42_final2-hashes.txt`. `34_` (build, exit 0) is newer than the last source write. F2
is closed by `40_` (0 `system-*` leaks out of 167). F3 is corrected.

**Open, blocks approval:** the §13.3 owner visual matrix (`agent-contract` 12, owner rule 2026-09-03). No executor work is
owed. Once the owner records every tuple as accepted, the next review can close the task. A returned tuple becomes a
revision.

**P3, filed as Task 833 (not blocking):** `readStaticStoryTitle` treats every `'` as a string opener, including one in a
`//` comment or JSX text inside `meta` before `title:` (`// don't…`, `<p>It's</p>`). The title then reads `null`, and the
Tailwind rule fails open for that enrolled file. Reviewer probe: both shapes return `null`. No story file has this shape
today, because the 148-file comparison found 0 differences.

## 18. Review 3 — owner rejection, `NEEDS REVISION` 2026-09-17 — THE EXECUTABLE ROUTE

### 18.1 Owner decision — 2026-09-17, quoted verbatim

> не приймаю задачу. Всі Minetine Stories знаходяться у розділі Minetine Primitives або у Patterns  Minetine. Також ці
> нові мігровані story взагалі не так зроблені як всі Minetine Stories, а саме не треба плодити сторінки, story має
> підтримувати локалізації у навігації  Storybook, а також breakpoints з Storybook. Ці нові story більше схожі на
> Tailwind hardcode stories

The rejection is correct, and the defect was in this kickoff's design, not the executor's work. §5.1 read "Mantine
canonical" as "put the shell in place, then enrol the `System/*` titles". The owner's rule, already written in
`docs/storybook-governance.md:9-15` and `:136`, is different. Mantine stories live under `Mantine/Primitives/` or
`Patterns/Mantine/`. There are no extra pages: no `LocaleStress`, `MobileScroll` or width-named exports. Locale and
breakpoint come from the Storybook toolbar, and nothing pins them through `globals.viewport`. After pass 1 the four
files still had `LocaleStress`/`MobileScroll` exports and five `globals.viewport` pins (`desktop1280`, `mobile320`,
`mobile375`).

### 18.2 Binding reading (Opus, reversible — the owner can overrule)

1. **Delete the four `System/*` listing story files. Do not retitle them.** Each one duplicates a canonical Mantine story
   that already renders the same real View (§18.3). Retitling them would create exactly the duplicate pages the owner
   forbids. The Sprint 48 "do not re-title" constraint (§3.5) is superseded by this decision: the IDs are retired, not
   kept.
2. **The one state with no canonical proof moves into its canonical story as a state export.** The Featured/Latest empty
   branch becomes `Empty` on `Patterns/Mantine/HomepageListingGrids`. No other export, page or story file is added.
3. **Reverse the enrolment of the four `System/*` titles.**
4. **Kept from pass 1 and Revision 1 (verified in review 2, do not touch):** the title-aware canonical-story membership
   in `scripts/check-design-tokens.mjs` (R5) and its test arms (a)–(f). They still serve the existing title-enrolled
   `Admin/AdminUsersTable` (`src/components/admin/AdminUsersTable.stories.tsx`). Task 833 stays as filed.

### 18.3 Verified context (read 2026-09-17, working tree)

**Canonical coverage of every state the deleted exports showed** — `FACT`, each file opened:

| Deleted export (HEAD) | Canonical proof after §18 |
|---|---|
| `System/FeaturedListings` `Default` · `System/LatestListings` `Default` (signed-in, card 0 favorited) | `Patterns/Mantine/HomepageListingGrids` `Default` (`HomepageListingGrids.stories.tsx:84-124`, both Views, `MOCK_SIGNED_IN_AUTH`, card 0 favorited) |
| Featured/Latest `LocaleStress` | toolbar locale on `HomepageListingGrids` `Default` |
| Featured/Latest `Loading` | `HomepageListingGrids` `Loading` (`:126-162`) |
| Featured/Latest `Empty` | **none** — `FeaturedListingsView.tsx:80-87` (header + `t('no_premium_listings')`) and `LatestListingsView.tsx:57-61` (`t('no_listings')`) → **new `HomepageListingGrids` `Empty` (R12)** |
| `System/SimilarListings` `Default` / `LocaleStress` | `Mantine/Primitives/SimilarListingsView` `Default` (+ `FewerThanEight`, `Empty`) and toolbar locale |
| `System/RecentlyViewedSection` `Populated` (with `ClearRecentlyViewedButton`) | `Mantine/Primitives/RecentlyViewedGridView` `Populated` (same `clearSlot`) |
| RecentlyViewed `MobileScroll` / `LocaleStress` | toolbar viewport / locale on `Populated` |
| RecentlyViewed `EmptyState` (`showEmptyState`) | `RecentlyViewedGridView` `Empty` (same prop) |

`FACT` — all four `messages/{en,sq,it,uk}.json` define `listing.no_premium_listings` and `listing.no_listings` at lines
50-51. uk reads `Оголошення не знайдено` / `Зараз немає преміум оголошень.`. Re-measure at I0 for freshness only.

`FACT` — `scripts/check-homepage-grid.mjs:84-85` requires only `--default` and `--loading`. An added `--empty` is not
one of its targets. `scripts/check-card-track-monotonicity.mjs` discovers stories that render the track. The `Empty`
state renders no track (`FeaturedListingsView.tsx:80-87`, `LatestListingsView.tsx:57-61`).

**Live references to the retiring files/IDs** — `git grep` 2026-09-17. History excluded: `docs/reviews/**`,
`docs/sessions/**`, `docs/governance-reports/**`, `docs/backlog-archive.md`, `tasks/**`, and the Task 678 narrative at
`docs/storybook-governance.md:2281-2290`:

| Path:line | Consumer | Required change (R15) |
|---|---|---|
| `scripts/lib/mantine-story-scope.mjs:41-62` · `scripts/__tests__/mantine-story-scope.test.ts` | enrolment | restore both byte-identical to `HEAD` (R13) |
| `scripts/check-card-track-monotonicity.mjs:20-27`, `:364-375` | comment + printed scope | R14 |
| `scripts/check-stories-rendered.mjs:163-174` | `ASSERT_STORIES` rows + comment | remove the 4 `system-*` rows; the comment names Task 827 and says `patterns-mantine-homepagelistinggrids--default` remains the `.listing-card` anchor |
| `scripts/lib/rendered-run-mode.mjs:20-23` · `scripts/__tests__/rendered-run-mode.test.ts:55-57` | phase label and its test | label names only the remaining anchor row(s); test asserts the new label and that no `system-featuredlistings`/`latestlistings`/`similarlistings` ID appears |
| `scripts/responsive-screenshots.mjs:100-118`, `:163` | screenshot targets + `--check` file-presence probe | retarget each row to its §18.3 canonical ID, keeping its viewports/locales (`FeaturedListings/*` → `patterns-mantine-homepagelistinggrids--default`; `RecentlyViewedSection/Populated`, `/MobileScroll`, `/Ukrainian` → `mantine-primitives-recentlyviewedgridview--populated`; `/EmptyState` → `mantine-primitives-recentlyviewedgridview--empty`); merge rows that become identical ID+label duplicates; `:163` probes `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` |
| `scripts/governance/component-catalog.mjs:131-137`, `:446` | screenshot-target token + matrix line | token `'FeaturedListings'` → `'HomepageListingGrids'` (update its comment); line 446 ID → `patterns-mantine-homepagelistinggrids--default`; then regenerate with `npm.cmd run catalog:components` |
| `scripts/story-realmode-allowlist.json:16` | `MobileScroll` Check-12 row | remove |
| `scripts/governance/tailwind-entropy.allowlist.json:307-315` | `RecentlyViewedSection.stories.tsx` row | remove (JSON stays valid) |
| `src/stories/fixtures/cardListingData.fixture.ts:3-4` · `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx:5-8` | comments | name the canonical consumers instead |
| `docs/storybook-governance.md:169`, `:772-773` | live guidance | `:169` reference story → `Patterns/Mantine/HomepageListingGrids`; `:772-773` drop the 3 `system-*` anchors |
| `docs/mantine-responsive-design-system.md:512-514` | legacy story table | the 3 rows read "Removed — Task 827 (2026-09-17); canonical: `<story>`" |
| `docs/responsive-screenshot-matrix.md:124-127, 171, 190, 203` · `docs/responsive-storybook-inventory.md:75-76, 159-160, 350, 462-464` · `docs/responsive-screenshot-governance.md:185` · `docs/governance-enforcement.md:579` · `docs/maintenance-playbook.md:516` · `docs/component-coverage-matrix.md:56` (generated) | operational docs | replace each ID with its §18.3 canonical ID, or delete the line where the canonical story already has a row |

Re-run this census at I0. A live hit not in this table is a stop: report it with its path and line before you edit.

### 18.4 Requirements

| ID | Observable requirement | P |
|---|---|---|
| **R11** | `src/stories/FeaturedListings.stories.tsx`, `LatestListings.stories.tsx`, `SimilarListings.stories.tsx`, `RecentlyViewedSection.stories.tsx` do not exist. Delete them through Node (`fs.unlinkSync`), never through git. | P0 |
| **R12** | `Patterns/Mantine/HomepageListingGrids` gains exactly one export, `Empty`. It renders `FeaturedListingsView` (`listings={[]}`, `loading={false}`, `favoriteIds={new Set()}`, `locale` from `context.globals.locale`) and `LatestListingsView` (`listings={[]}`, `loading={false}`) inside the same `Box` + `Stack gap="xl"` wrapper as `Loading`, with no `AuthContext`. It has a `docs.description.story`, no `globals`, no `className`, and no locale/viewport pin. `Default` and `Loading` stay byte-identical. | P0 |
| **R13** | `scripts/lib/mantine-story-scope.mjs` and `scripts/__tests__/mantine-story-scope.test.ts` are byte-identical to `HEAD`: write `git show HEAD:<path>` output back through Node, and witness with `git hash-object` = `git rev-parse HEAD:<path>`. | P0 |
| **R14** | `check-card-track-monotonicity.mjs` comment and `printScopeReport` text: remove the `enrolled (Task 827…)` line and every "Task 827 owns the drop" wording. The exclusion line states that the owner rule of 2026-09-17 excludes non-canonical stories, and that Task 827 deleted the four `System/*` listing stories, so no `System/*` story renders the track. Gate logic unchanged. | P1 |
| **R15** | Every §18.3 live consumer is updated as its row states. `npm.cmd run catalog:components` regenerates the generated doc. | P0 |
| **R16** | The final census (§18.7) prints no line. | P0 |
| **R17** | `check-design-tokens.mjs` and its test are unchanged by this revision: hashes equal `42_final2-hashes.txt` lines 1-2. | P1 |
| **R18** | No other `*.stories.tsx` changes. `SimilarListingsView.stories.tsx` and `RecentlyViewedGridView.stories.tsx` stay byte-identical to `HEAD`. | P1 |

### 18.5 Flows

**Positive.** In Storybook, `System` shows no `FeaturedListings`, `LatestListings`, `SimilarListings` or
`RecentlyViewedSection` entry. Open `Patterns/Mantine/HomepageListingGrids` → `Empty` and switch the toolbar locale to
sq/uk/it: the Featured heading and both empty texts change language. Switch the toolbar viewport: nothing is pinned.

| Negative flow | Applicable | Expected |
|---|---|---|
| A retired ID is still referenced by a live consumer | Yes | the red arm (§18.7 step 2): `check:stories` fails with `stale-allowlist-entry` for `RecentlyViewedSection.stories.tsx` until R15 removes the row; the final census is empty |
| `check:homepage-grid` breaks on the added export | Yes | exit 0 — it targets only `--default`/`--loading` |
| The new `Empty` leaks untranslated text | Yes | the locale-leak `report.json` has no `patterns-mantine-homepagelistinggrids--empty` leak |
| A removed state loses proof | Yes | §18.3 table; owner matrix §18.8 |
| Auth / RLS / data | No | Storybook-only; no production code changes |

### 18.6 Acceptance criteria

- **AC7 [R11, R16]** — `Test-Path` is `False` for the four files, and the §18.7 census prints nothing (quote both).
- **AC8 [R12, R18]** — `git diff -- src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` shows only the added
  `Empty` export and the comment update. `storybook-static/index.json` contains
  `patterns-mantine-homepagelistinggrids--empty` and no ID starting with `system-featuredlistings`, `system-latestlistings`,
  `system-similarlistings` or `system-recentlyviewedsection`.
- **AC9 [R13, R17]** — hash witnesses as stated, quoted.
- **AC10 [R14]** — the final `check:card-track-monotonicity` exits 0. `in scope` lists no `system-*` ID, and the exclusion
  line carries the R14 wording. Its `of N canonical` count equals `02_i0-monotonicity.txt`'s 141 plus the canonical
  stories this route adds (expected 142); any other number is a stop.
- **AC11 [R15]** — the red arm (§18.7 step 2) is retained and non-zero. Every command in §18.7 step 4 exits 0, and
  `check:locale-leak:mantine-only`, which is exempt from exit 0, meets the AC6 property with `--empty` added to the
  `system-*` exclusion check.
- **AC12 [R15]** — `governance:components` and `governance:screenshots` exit 0 (quote summaries).

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: the empty census and the missing files are the defined end state of a deletion.`

### 18.7 Execution and verification plan (Q3)

**Re-entry mode: `mixed`.** Keep `docs/sessions/evidence/task827/00_`–`46_` as history. New artifacts start at `47_`.
The worktree starts dirty from the earlier passes. Before any write, record `git --no-optional-locks status --porcelain`
and the `git hash-object` of every path you will change (`47_`).

1. I0: run the §18.3 census and the `messages\uk.json` check. Run `npm.cmd run governance:screenshots` and
   `npm.cmd run governance:components` and record their exit codes (they are the baseline for AC12).
2. **Red arm:** apply R11 only, then run `npm.cmd run check:stories`. It must exit non-zero naming
   `stale-allowlist-entry` for `src/stories/RecentlyViewedSection.stories.tsx`. If it exits 0, stop with
   `BLOCKED — TEST BLIND`.
3. Apply R12–R15. Use Node UTF-8 I/O for every write.
4. Final gate block. Every command writes its own unpiped transcript with `EXIT_CODE=`:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run scripts/__tests__/mantine-story-scope.test.ts scripts/__tests__/check-design-tokens.test.ts scripts/__tests__/rendered-run-mode.test.ts
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run build-storybook
npm.cmd run check:card-track-monotonicity
npm.cmd run check:card-track-monotonicity:verify
npm.cmd run check:homepage-grid
npm.cmd run check:homepage-grid:verify
npm.cmd run check:locale-leak:mantine-only
npm.cmd run governance:tailwind
npm.cmd run governance:components
npm.cmd run governance:screenshots
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -i -E "system-(featuredlistings|latestlistings|similarlistings|recentlyviewedsection)|System/(FeaturedListings|LatestListings|SimilarListings|RecentlyViewedSection)|(Featured|Latest|Similar)Listings\.stories|RecentlyViewedSection\.stories" -- . ":!docs/reviews" ":!docs/sessions" ":!docs/governance-reports" ":!docs/backlog-archive.md" ":!tasks"
git --no-optional-locks rev-parse HEAD:scripts/lib/mantine-story-scope.mjs HEAD:scripts/__tests__/mantine-story-scope.test.ts
git --no-optional-locks hash-object scripts/lib/mantine-story-scope.mjs scripts/__tests__/mantine-story-scope.test.ts scripts/check-design-tokens.mjs scripts/__tests__/check-design-tokens.test.ts
git --no-optional-locks status --porcelain
```

Expected: exit 0 for every command except `check:locale-leak:mantine-only` (AC11) and the census `git grep`. The census
must print nothing and exits 1 when there are no matches. It may print only the Task 678 historical narrative at
`docs/storybook-governance.md:2281-2290`: quote that text if it does, and anything else is a stop. If
`governance:screenshots` or `governance:components` was non-zero at I0 for a reason unrelated to these files, report
the I0 and final output and do not change unrelated code.

### 18.8 Owner visual review — `OWNER VISUAL QA REQUIRED`

| Story | Toolbar viewports | Toolbar locales | Owner checks |
|---|---|---|---|
| `Patterns/Mantine/HomepageListingGrids` → `Empty` | 320, 768, 1440, 1920 | en, sq, uk, it | Featured heading without "view all", both empty texts localized, same shell as `Default`/`Loading` |
| Storybook sidebar | — | — | no `System/FeaturedListings`, `System/LatestListings`, `System/SimilarListings`, `System/RecentlyViewedSection` |

### 18.9 Completion

Session log: add a `Revision 2` section with the owner quote, the R11–R18 ledger, the red arm, the gate block, the
census, the consumer table as actually edited, and the §18.8 matrix handed over. Its `Files Changed` table covers the
whole task diff: deleted, restored, kept and new. Update the `docs/backlog.md` 827 row. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Do not self-approve or run any git command.
