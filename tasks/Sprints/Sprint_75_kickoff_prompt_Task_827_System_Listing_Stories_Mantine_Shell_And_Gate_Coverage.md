# Task 827 — The four `System/*` listing Stories leave their Tailwind wrappers for the canonical Mantine story shell, and enter the Mantine gates

Sprint 75 · P2 · QA profile **Q4**

**Status: `READY FOR SONNET` 2026-09-17.** Route fixed by owner decision 2026-09-17 (§5.1). **Folds reserved Task
735** (enrol `System/FeaturedListings` via the Task 678 per-story mechanism, §3.6).

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
- **AC6 [R8–R10]** — `npm run check:locale-leak:mantine-only` output names the 4 titles in scope and reports no leak
  in them. `governance:tailwind` and `check:stories` verdicts for the two allowlist rows are quoted with the resulting
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
