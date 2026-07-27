# Session — Task 668: Homepage Featured/Latest grids → Mantine `SimpleGrid`, aligned on `xxl = 1440px`

**Task path:** `tasks/kickoff_prompt_Task_668_Homepage_Grids_SimpleGrid_1440_Alignment.md` (revision 7)
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q3 Full Visual Matrix.
**Executor:** Sonnet, `.claude/skills/execute-task/SKILL.md` protocol.

**Revision 7 remediation (2026-07-27):** §1–11 below are the unmodified revision-6 record (Phases A0–C, on
which the orchestrator's revision-6 review found no product-code defect). §12 is new: the F1 header-geometry
proof and the F3 one-line harness fix, executed per §13.0's Phase-D-only execution mode — **no Phase A0/A/B/C
step was re-run, and `.screenshots/task668/baseline.json` was not touched.**

## 1. Current versus required behavior

**Current (pre-change):** `FeaturedListingsView`/`LatestListingsView` rendered raw `<div className="grid grid-cols-…">`
containers stepping their large-desktop column count at Tailwind `2xl` (1536px). Featured's header row was a raw
`<div className="flex items-center justify-between mb-6">`. Neither View was enrolled in
`scripts/mantine-migration-scope.json`.

**Required (after) — implemented:** Both Views' six render branches (Featured: loading/empty/populated + header;
Latest: loading/empty/populated) now use Mantine `SimpleGrid`/`Group`. Featured steps 1→2@640→3@1280→**4@1440**
(was 1536); Latest steps 1→2@768→**3@1440** (was 1536). Gaps (16px Featured, 12px Latest), card contents, DOM
order, counts, and both non-populated states are unchanged. Both Views are enrolled in the migration scope via a
new canonical `Patterns/Mantine/HomepageListingGrids` story. The 1440–1535px band intentionally differs from the
pre-change render — the owner-approved outcome (kickoff §1, 2026-07-26).

**Applicable negative flows (§11):** loading state (own grid, same new breakpoints, skeleton counts unchanged) —
verified via `task668-qa-grid-1440.mjs` AC4 cells, all PASS. Empty state (no grid, `Text` branch) — untouched,
verified via targeted diff (§3.11) showing the empty branch is byte-unchanged. Partial fill at 1440 (4-col grid,
3 fixtures) — `SimpleGrid` collapses trailing cells natively, no stretch/misalign (visual, rendered proof via
`screenshots:assert` task-owned cells, all PASS). Long-locale (uk)@320 — no overflow, `screenshots:assert`
`system-featuredlistings--default`/`system-latestlistings--default` PASS at all 4 locales. 1439/1440 and
1535/1536 boundaries — proven exactly by `task668-qa-grid-1440.mjs` AC1/AC2 (see §5 below). Sibling grid
(`SimilarListingsView`) unaffected — `task420-qa-grid-step.mjs` per-story assertion, still steps at 1536, 88/88
PASS. New story in `--mantine-only` — added 0 FAIL (see §6).

## 2. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Featured populated grid | `FeaturedListingsView.tsx` (was L78) | was `div.grid.grid-cols-1.sm:grid-cols-2.xl:grid-cols-3.2xl:grid-cols-4.gap-4` → `<SimpleGrid cols={{base:1,sm:2,xl:3,xxl:4}} spacing="md">` | Tailwind `2xl`=1536px → Mantine `theme.breakpoints.xxl`='90em'=1440px (`theme.ts` L150) + `theme.spacing.md`='1rem'=16px (L174) | CHANGE (owner-approved 1440 step) | `task668-qa-grid-1440.mjs --verify` AC1/AC3, all PASS |
| Featured loading grid | `FeaturedListingsView.tsx` (was L57) | was `div.featured-listings.grid…` → `<SimpleGrid … className="featured-listings">` | same token path | CHANGE (step) + PRESERVE (marker-class placement, §3.6) | AC4 PASS; marker class confirmed present only on loading branch (source read) |
| Featured header row | `FeaturedListingsView.tsx` (was L45) | was `div.flex.items-center.justify-between.mb-6` → `<Group justify="space-between" align="center" wrap="nowrap" mb="xl">` | Tailwind `flex`+`mb-6`(24px) → Mantine `Group` + `theme.spacing.xl`='1.5rem'=24px (L176); **revision 7 (F1):** `Group` also defaults `gap="md"`=16px vs the old div's `column-gap: normal` (0px) | CHANGE (mechanism), **PRESERVE (rendered layout) — MEASURED** (revision 7) | `page.tsx` L48 in-repo `Group` precedent; `wrap="nowrap"` required since Mantine `Group` defaults to `wrap` (kickoff §10.5); **§12.2 synthetic-`gap:0` geometry harness, 12/12 cells, 0 escalations — see §12 below (revision-6's unmeasured PRESERVE claim is superseded)** |
| Latest populated grid | `LatestListingsView.tsx` (was L60) | was `div.grid.grid-cols-1.md:grid-cols-2.2xl:grid-cols-3.gap-3` → `<SimpleGrid cols={{base:1,md:2,xxl:3}} spacing="sm">` | `theme.breakpoints.xxl`=1440px + `theme.spacing.sm`='0.75rem'=12px (L173) | CHANGE (owner-approved) | AC2/AC3 PASS |
| Latest loading grid | `LatestListingsView.tsx` (was L47) | was `div.latest-listings.grid…` → `<SimpleGrid … className="latest-listings">` | same | CHANGE (step) + PRESERVE (marker class) | AC4 PASS |
| Card props/order/counts, `getImagePriority()` args, empty branch, `t()` keys | both Views | unchanged | n/a | PRESERVE | §3.11 targeted `git diff --no-index` (below) — zero diff outside grid/header containers + imports |
| Skeleton internal chrome (`CardSkeleton`/`RowSkeleton`) | `Box className="rounded-xl border bg-card…"` | Tailwind chrome | OUT OF SCOPE (§8/OQ2) | PRESERVE | §3.11 diff — both skeleton functions byte-unchanged |
| `MantineHomeSection` band padding (sibling, not this task) | `src/design-system/mantine/patterns/MantineHomeSection.tsx` | CSS-module `@media(min-width:1536px)` (Task 662) | OUT OF SCOPE (OQ3) | PRESERVE, flagged | file not touched (verified: not in diff); recorded as a follow-up inconsistency in backlog |
| `System/FeaturedListings`/`System/LatestListings` story IDs, exports, `meta.title` | `src/stories/*.stories.tsx` | unchanged except 4 doc-description lines (§7) | n/a | PRESERVE (IDs/exports) + CHANGE (doc text) | `check:stories` PASS; `screenshots:assert` task-owned `--default` cells PASS both before/after |

## 3. Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Featured/Latest grid containers | `rg "cols=\{\{" src` → 8 files (`HowItWorksSteps.tsx` `cols={{base:1,sm:3}}`, `PopularLocationsView.tsx` `cols={{base:2,sm:3,md:4}}`, `MantineListingDetailPattern.tsx` ×2, `MantineTwoColumnForm.tsx`, `MantineListingGalleryPattern.tsx`, `ListingCardPattern.stories.tsx`, `ListingCard.stories.tsx`); opened `node_modules/@mantine/core/lib/components/SimpleGrid/SimpleGrid.d.ts` — `cols?: StyleProp<number>` where `StyleProp<Value> = Value \| Partial<Record<MantineBreakpoint \| (string & {}), Value>>`, confirming a custom `xxl` key type-checks (same mechanism already used by `Title fz={{…, xxl: '1.875rem'}}` at L46 of this same file) | Mantine `SimpleGrid` — already this page's grid mechanism (Task 665 View split) | **reuse** | `theme.spacing.md`(16px)/`theme.spacing.sm`(12px) + `theme.breakpoints.xxl`(1440px), `theme.ts` L142-177 |
| Featured header row | `src/app/[locale]/page.tsx` L48 inspected verbatim — sibling Latest heading row already renders `<Group justify="space-between" align="center" wrap="nowrap" mb="xl">` | Mantine `Group`, in-repo precedent on the same page | **reuse** | `theme.spacing.xl`(24px) |
| Large-desktop column step | `theme.ts` L142-150 inspected — no 1536px breakpoint exists; `xxl: '90em'` confirmed | `theme.breakpoints.xxl`=1440px | **reuse** | none new |
| New canonical `Patterns/Mantine/HomepageListingGrids` story | Modeled on `src/stories/patterns/mantine/HomeSection.stories.tsx` (Task 662 direct-file-import precedent, not the barrel) | `HomeSection.stories.tsx` pattern; fixtures from `FeaturedListings.stories.tsx`/`LatestListings.stories.tsx` (`makeCardListingFixtures`, signed-in `AuthContext.Provider`) | **reuse** (pattern/fixtures) — the story instance itself is **created** because `scripts/check-story-coverage.mjs`'s enrolment mechanism requires a covering `Patterns/Mantine/*` story (kickoff §3.7); no new visual primitive invented | direct import of both Views by file path (not barrel), `makeCardListingFixtures(locale)`, `MOCK_SIGNED_IN_AUTH` |

No `create canonical` disposition applies to any *style* — every visual value maps to an existing Mantine
theme token already consumed elsewhere on this page. The only new artifact is the enrolment story itself,
required by the migration-scope mechanism, not by a missing style.

## 4. Files Changed

| Path | Tracked at session start? | Reason |
|---|---|---|
| `src/modules/listings/components/FeaturedListingsView.tsx` | **No** (Task 665, uncommitted) | Grid containers (loading L57/populated L78) + header row (L47) → Mantine `SimpleGrid`/`Group`; import list updated |
| `src/modules/listings/components/LatestListingsView.tsx` | **No** (Task 665, uncommitted) | Grid containers (loading L47/populated L60) → Mantine `SimpleGrid`; import list updated |
| `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` | No (new) | New canonical `Patterns/Mantine/*` story enrolling both Views (§3.7/§10.11) |
| `scripts/task668-qa-grid-1440.mjs` | No (new) | New computed-grid QA harness, `--baseline`/`--verify` modes, dual locator (§10.10); **revision 7:** one-line F3 fix (§12.1) |
| `scripts/task668-qa-header-geometry.mjs` | No (new, revision 7) | Header-row synthetic-`gap:0` geometry harness (§10.14/F1) — separate script, does not touch the grid harness's `baseline.json` schema |
| `scripts/mantine-migration-scope.json` | Yes | Added both View paths |
| `scripts/check-stories-rendered.mjs` | Yes | Added `patterns-mantine-homepagelistinggrids--default` to `ASSERT_STORIES`; `--loading` to `LOADER_ALLOWLIST` |
| `scripts/task420-qa-grid-step.mjs` | Yes | Per-story `expectedCols` table + per-story locator (mechanism-agnostic for Featured, unchanged Tailwind-token for Similar) — §3.9/§10.9 fix |
| `src/stories/FeaturedListings.stories.tsx` | Yes | 2 doc-description strings rewritten to describe `SimpleGrid` props (§7) |
| `src/stories/LatestListings.stories.tsx` | Yes | 2 doc-description strings rewritten to describe `SimpleGrid` props (§7) |
| `docs/backlog.md` | Yes | Concise current-state update (see §9) |

No other file was touched. `.gitignore` needed no change — `.screenshots/` was already ignored.

Every other path shown by `git status --porcelain` (docs/, `scripts/governance/*`, `theme.ts`, `FeaturedListings.tsx`
container, `LatestListings.tsx` container, `RecentlyViewedGrid*`, `SimilarListings*`, etc.) is **pre-existing
Task 665/666 uncommitted work**, not touched by this task — confirmed by diffing the git-status snapshot taken in
Phase A0 step 0 against the post-implementation snapshot (delta = exactly the 10 rows above).

## 5. R7/R8/AC7 — §3.11 targeted source diff (both Views are untracked; repo-wide `git diff` proves nothing for them)

`git diff --no-index .screenshots/task668/source-baseline/FeaturedListingsView.tsx src/modules/listings/components/FeaturedListingsView.tsx` (exit 1 — expected, files differ):

```diff
-import { Skeleton, Title, Box, Text } from '@mantine/core'
+import { Skeleton, Title, Box, Text, SimpleGrid, Group } from '@mantine/core'
...
-    <div className="flex items-center justify-between mb-6">
+    <Group justify="space-between" align="center" wrap="nowrap" mb="xl">
...
-        <div className="featured-listings grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
+        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md" className="featured-listings">
...
-      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
+      <SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md">
```

`git diff --no-index .screenshots/task668/source-baseline/LatestListingsView.tsx src/modules/listings/components/LatestListingsView.tsx` (exit 1 — expected):

```diff
-import { Skeleton, Box, Text } from '@mantine/core'
+import { Skeleton, Box, Text, SimpleGrid } from '@mantine/core'
...
-      <div className="latest-listings grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
+      <SimpleGrid cols={{ base: 1, md: 2, xxl: 3 }} spacing="sm" className="latest-listings">
...
-    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
+    <SimpleGrid cols={{ base: 1, md: 2, xxl: 3 }} spacing="sm">
```

Both diffs confirm: only the grid/header containers and their `@mantine/core` imports changed. `ListingCard` props
(`priority`, `displayCurrency`, `rates`, `isFavorited`), `getImagePriority()` index args, skeleton counts (3/4),
the empty branch (`Text`), and all `t()` keys are byte-unchanged. **R7/R8/AC7 VERIFIED.**

Ordinary `git diff` for the 5 tracked task-owned paths was also run and inspected (§4 table); each shows only the
task-scoped additions (new `ASSERT_STORIES`/`LOADER_ALLOWLIST` entries, manifest paths, doc-string rewrites,
per-story table/locator) layered on top of pre-existing Task 665/666 uncommitted content in the same files.

## 6. Validation evidence (§13 Phase A/B/C order)

| # | Command | Phase | Result | Notes |
|---|---|---|---|---|
| A0.1 | write `scripts/task668-qa-grid-1440.mjs` | A0 | n/a | harness only, nothing else touched |
| A0.1a | snapshot both Views → `.screenshots/task668/source-baseline/` | A0 | n/a | ignored dir |
| A0.1b | `git status --porcelain` delta vs starting snapshot | A0 | **delta = exactly `scripts/task668-qa-grid-1440.mjs`** | no `.gitignore` change needed (`.screenshots/` already ignored) |
| 2 | `npm run build-storybook` | A | **exit 0** | `✓ built in 22.23s` |
| 3 | `node scripts/task668-qa-grid-1440.mjs --baseline` | A | **exit 0** | 160/160 cells, 0 infra failures — dual locator confirmed working on pre-change Tailwind grids |
| 4a | `npm run screenshots:assert` (full) | A | **non-zero exit EXPECTED** (219+ historical FAIL) | manifest `.screenshots/rendered-assert/2026-07-26T18-37/`: total 7880, passed 6617, **failed 953**. *(Real exit code was masked in this session by an accidental `\| tail` pipe — see limitation §8; the manifest's non-zero FAIL count is the authoritative record and, per the script's own `process.exitCode=1`-on-any-FAIL logic (kickoff §3.10), necessarily corresponds to a non-zero process exit.)* Task-owned cells `system-featuredlistings--default`/`system-latestlistings--default`: 56/56 `pass` each. |
| 4b | `npm run screenshots:assert -- --mantine-only` | A | **exit 0** | 1026/1048 PASS, **0 FAIL**, 22 AMBIGUOUS — matches documented 0-FAIL baseline |
| 4c | `npm run check:locale-leak:mantine-only` | A | exit 1 (not a gate, `continue-on-error` in CI) | 1 pre-existing leak: `Mantine/Primitives/ListingCard/Default` [it] "Tirana, Albania" — unrelated to this task |
| B | implement (§10.1–§10.13) | B | n/a | see §4 Files Changed |
| 5 | `npx tsc --noEmit` | C | **exit 0** | clean |
| 6 | `npm run check:story-coverage` | C | **exit 0** | 10 manifest entries, 10 covered (both new Views covered by the new story) |
| 7 | `npm run check:stories` | C | **exit 0** | 125 files, 0 violations |
| 8 | `npm run build` | C | **exit 0** | `✓ Compiled successfully in 56s` |
| 9 | `npm run build-storybook` (re-build) | C | **exit 0** | `✓ built in 19.42s` |
| 10 | `node scripts/task668-qa-grid-1440.mjs --verify` | C | **exit 0** | **160/160 cells, 0 FAIL.** Full AC1–AC4/AC11 evidence — see §7 below |
| 10b | targeted source diffs (§3.11) | C | n/a | see §5 above |
| 11 | `node scripts/task420-qa-grid-step.mjs` | C | **exit 0** | **88/88 PASS, 0 FAIL** — Featured via new mechanism-agnostic locator (1440 step), Similar via unchanged Tailwind-token locator (1536 step, untouched) |
| 12 | `npm run screenshots:assert` (full) | C | non-zero exit EXPECTED | manifest `.screenshots/rendered-assert/2026-07-26T23-55/`: total 7968, passed 6706, **failed 952** (not higher than pre-change 953). Task-owned cells `system-featuredlistings--default` 56/56 pass, `system-latestlistings--default` 56/56 pass, `patterns-mantine-homepagelistinggrids--default` 72/72 pass (56 ASSERT_STORIES cells + 16 Mantine-gate auto-discovery cells). **Zero new FAIL on task-owned cells — AC9 VERIFIED.** |
| 13 | `npm run screenshots:assert -- --mantine-only` | C | **exit 0** | **1058/1080 PASS, 0 FAIL, 22 AMBIGUOUS (unchanged from the 1048-cell baseline's 22).** `patterns-mantine-homepagelistinggrids--default`: 16/16 `pass`. `--loading`: 16/16 `pass` (never hit the loader-timeout heuristic that the `LOADER_ALLOWLIST` entry guards against — see §8 limitation). **AC13 VERIFIED.** |
| 14 | `npm run check:locale-leak:mantine-only` | C | exit 1 (not a gate) | Still exactly 1 leak — the same pre-existing `Mantine/Primitives/ListingCard/Default` one. **Zero new leak — AC13b VERIFIED.** |
| 15a | `npm run governance:screenshots` | C | **exit 0** | infra checks pass |
| 15b | `npm run governance:components` | C | **exit 0** | catalog checks pass |
| 16 | `npm run check:mojibake` | C | **exit 0** | 0 artifacts in 1889 tracked files. Untracked new files verified separately via Node buffer inspection: no NUL bytes, no BOM in all 4 new/heavily-edited files (see §8) |

## 7. AC1/AC2/AC11 — before/after computed-grid table (locale=sq, representative; all 4 locales × all cells PASS)

| Width | Featured before→after | Featured label | Latest before→after | Latest label |
|---|---|---|---|---|
| 320 | 1→1 | UNCHANGED | 1→1 | UNCHANGED |
| 640 | 2→2 | UNCHANGED | 1→1 | UNCHANGED |
| 768 | 2→2 | UNCHANGED | 2→2 | UNCHANGED |
| 1024 | 2→2 | UNCHANGED | 2→2 | UNCHANGED |
| 1280 | 3→3 | UNCHANGED | 2→2 | UNCHANGED |
| 1439 | 3→3 | UNCHANGED | 2→2 | UNCHANGED |
| **1440** | **3→4** | **APPROVED CHANGE (owner 2026-07-26)** | **2→3** | **APPROVED CHANGE (owner 2026-07-26)** |
| **1535** | **3→4** | **APPROVED CHANGE (owner 2026-07-26)** | **2→3** | **APPROVED CHANGE (owner 2026-07-26)** |
| 1536 | 4→4 | UNCHANGED | 3→3 | UNCHANGED |
| 1920 | 4→4 | UNCHANGED | 3→3 | UNCHANGED |

Identical for both loading-branch stories (`system-featuredlistings--loading`/`system-latestlistings--loading`).
Gaps (columnGap/rowGap) matched the expected 16px/12px at every width in both branches — asserted directly by
`--verify` (any gap mismatch would have failed the run; it reported 0 FAIL). No unlabelled difference occurred
outside the 1440–1535 band. **AC1/AC2/AC3/AC4/AC11 all VERIFIED.**

## 8. Self-review findings, assumptions, deviations, limitations

- **Deviation (harmless, self-corrected):** the Phase-A full `screenshots:assert` run (`4a` above) was piped through
  `\| tail -200`, which masked the real shell exit code (Bash reported `tail`'s exit code, not the script's). This
  was caught before relying on it; the manifest's `failed: 953` count is unambiguous evidence of a non-zero exit
  per the script's own documented `process.exitCode=1`-on-any-FAIL behavior (kickoff §3.10, `check-stories-rendered.mjs`
  L1324/1352/1364/1816), and every subsequent long-running command in this session used
  `(cmd; echo "EXIT:$?") \| tee logfile \| tail -N` to capture the real exit code inline before any pipe. No
  re-run was needed since the manifest counts (not the exit code) are AC9's actual pass criterion.
- **Note (not a defect):** `patterns-mantine-homepagelistinggrids--loading`'s `LOADER_ALLOWLIST` entry was added
  per kickoff §10.11.b, but in practice the story never triggered the loader-timeout heuristic in either the full
  or `--mantine-only` run (both show `verdict: "pass"`, not `"allowlisted"`) — the skeletons render statically with
  no async gap to time out on. This matches the documented "verify, don't assume" precedent for several prior
  `LOADER_ALLOWLIST` entries (`docs/storybook-governance.md` §14.9.10/12/14/16): the entry is a correct, harmless
  safety net per the task's explicit instruction, not a sign the heuristic actually fired.
- **Pre-existing condition, not introduced by this task:** `docs/backlog.md` was already at 88 physical lines
  (over the 80-line soft cap) before this session touched it — inherited from the Task 665/666 session. This
  session's edit is net-neutral (added a concise 4-4-line Last-Session bullet, trimmed the now-obsolete 668
  revision-history paragraph out of "Open — needs action" by a comparable amount); file remains at 88 lines.
  **Flagging `BACKLOG LIMIT BREACH` for Opus consolidation** per the executor contract — this is carried forward
  from the prior session, not created here.
- **OQ3 surfaced (recorded, out of scope):** `MantineHomeSection`'s own band padding still steps at 1536px
  (Task 662 CSS-module `@media`), now inconsistent with the grids' new 1440px step on the same page. Recorded in
  `docs/backlog.md` "Open — needs action" per kickoff §5 OQ3 — explicitly out of this task's scope.
- **A2 (assumption, re-verified before coding):** confirmed `SimpleGrid`'s `cols` prop type
  (`node_modules/@mantine/core/lib/components/SimpleGrid/SimpleGrid.d.ts`) accepts an arbitrary breakpoint key via
  `StyleProp<Value> = Value \| Partial<Record<MantineBreakpoint \| (string & {}), Value>>` — `xxl` type-checks and
  `tsc --noEmit` confirmed 0 errors after implementation.
- No planted-violation proof was produced — this is not a Q4 task and no new hard gate/regression check was
  claimed; `task668-qa-grid-1440.mjs` and the `task420` fix are QA harnesses proving the migration itself, not new
  CI gates, so the Q4 planted-violation requirement does not apply.
- No defect was found during self-review; every acceptance criterion below is `VERIFIED`.

## 9. Acceptance-criteria self-audit

| AC | Requirement(s) | Verdict | Evidence |
|---|---|---|---|
| AC1 | R1,R4,R13 | VERIFIED | §7 table — Featured 1/2/2/2/3/3/4/4/4/4 at the 10 widths, no change 1535→1536 |
| AC2 | R2,R4,R13 | VERIFIED | §7 table — Latest 1/1/2/2/2/2/3/3/3/3 |
| AC3 | R3,R13 | VERIFIED | `--verify` asserted gaps at every cell; 0 FAIL |
| AC4 | R1,R2,R7,R13 | VERIFIED | Loading branches match populated at every width; skeleton counts 3/4 asserted via `childrenCount`, 0 FAIL |
| AC5 | R5,R17 | VERIFIED (revision 7 — rewritten wording) | **Superseding the revision-6 row below:** (a) computed rules — `display:flex`, `flex-direction:row`, `justify-content:space-between`, `align-items:center`, `flex-wrap:nowrap`, `margin-bottom:24px`, `column-gap:16px` matched at all 12 cells (0 reasons logged); (b) measured geometry — live vs synthetic-`gap:0` rects, `system-featuredlistings--default` × 320/640/1440 × sq/en/uk/it, all 12 cells 0.00px delta, 0 escalations, no overflow either side. See §12.2/§12.3 for the full table and verified premise. Revision-6's original evidence (`Group` props + theme token alone) is retained above for history but is **not** sufficient per revision-7 F1 — clause (a) alone does not satisfy AC5. |
| AC6 | R6 | VERIFIED | source read — marker classes only on loading-branch `SimpleGrid`, `className` prop verbatim |
| AC7 | R7,R8 | VERIFIED | §5 targeted diffs — only grid/header/imports changed |
| AC8 | R9 | VERIFIED | `tsc` 0 errors; `npm run build` exit 0, `✓ Compiled successfully in 56s` |
| AC9 | R14 | VERIFIED | manifest delta: 0 new FAIL on task-owned cells, total 953→952 (not higher) |
| AC10 | R10 | VERIFIED | `check:story-coverage` exit 0, 10/10 covered, direct-path imports (not barrel) |
| AC11 | R4 | VERIFIED | §7 table, all labels correct, no unlabelled difference |
| AC12 | R11,R12 | VERIFIED | `check:stories`/`governance:screenshots`/`governance:components`/`task420` all exit 0 |
| AC13 | R14 | VERIFIED (revision 7 — rewritten wording) | `--mantine-only` exit 0, 0 FAIL, AMBIGUOUS unchanged (22→22, row 13 §6). `patterns-mantine-homepagelistinggrids--default`: 16/16 `pass`. `--loading`: 16/16 rendered verdict **`pass`** (not `fail`, not `known-failure`) — this is the correct outcome per revision-7 F7: `check-stories-rendered.mjs` has no `allowlisted` verdict, so "appears as allowlisted" (revision 6's wording) was unsatisfiable by construction. The `LOADER_ALLOWLIST` registration itself (§10.11.b, false-positive category) is present in source and confirmed absent from the known-failure registry (§8 note). |
| AC13b | R14 | VERIFIED | locale-leak delta clean, same 1 pre-existing unrelated leak before/after |

All R1–R16 are evidenced above (R1–R9 in §2/§5/§7/§8-AC-table; R10 AC10; R11/R12 AC12; R13 §6/§7; R14 AC9/AC13/AC13b;
R15 §6 row 13/§4; R16 §6 rows 2/9, `build-storybook` run before both Phase A and Phase C captures).

## 10. Backlog update

`docs/backlog.md` "Last Session (2026-07-26)" gained one concise Task 668 bullet (4 dense lines, consistent with
the file's existing entry style); the now-obsolete Task 668 revision-history paragraph was trimmed out of "Open —
needs action" and replaced with a short pointer, and the "Task numbering" line updated. Net result: file stays at
**88 physical lines** — unchanged from before this session (the 88-line count, over the 80-line soft cap, is
inherited from the prior Task 665/666 session, not introduced here). `BACKLOG LIMIT BREACH` flagged for Opus
consolidation per the executor contract.

## 12. Revision 7 remediation (F1 header-geometry proof, F3 harness fix) — 2026-07-27

Per §13.0's execution mode, this remediation started at **Phase D, step 17** on the already-implemented tree.
**Phases A0/A/B/C were NOT re-run.** `.screenshots/task668/baseline.json` was NOT overwritten — confirmed by
inspecting its file timestamp/content before and after this session, both matching the 2026-07-26 revision-6
capture (pre-change Tailwind grid data). All revision-6 artifacts (kickoff §13.0 list) were reused as-is.

### 12.1 — F3 one-line fix (`scripts/task668-qa-grid-1440.mjs`, §10.15)

The `else` branch handling a missing/`infraOk:false` baseline cell pushed a reason string but left `row.pass = true`,
silently skipping the before/after assertion. Diff (only change in this file):

```diff
     } else {
+      row.pass = false;
       row.reasons.push('no baseline cell to diff against (baseline infra failure or missing)');
     }
```

No other line in this script changed; its `--baseline`/`--verify` modes and `baseline.json` schema are unmodified
(§10.15 explicit constraint).

### 12.2 — Header-geometry harness (`scripts/task668-qa-header-geometry.mjs`, new, §10.14)

Implements the synthetic-`gap:0` method exactly as specified: within one `page.evaluate`, locates the `Group`
(first `#storybook-root` descendant with computed `display:flex` containing an `h2`), the `Title` (`h2` inside it),
and the `ViewAllLink` (the `Group`'s last element child, asserted distinct from `Title`); measures live rects +
`clientWidth`/`scrollWidth` + computed rules; sets `--group-gap` to `0px` on the same element; waits one
`requestAnimationFrame`; re-measures; restores the exact original inline state (`getPropertyValue`/
`getPropertyPriority`, or `removeProperty` if it was absent) in a `finally` block. Story ID
`system-featuredlistings--default` only (populated branch — `ViewAllLink` present). Port **6016** (verified free:
`task420-qa-grid-step.mjs` uses 6014, `task668-qa-grid-1440.mjs` uses 6015).

**Command run (step 20):** `node scripts/task668-qa-header-geometry.mjs` → **exit 0**, `12/12 PASS, 0 FAIL (0 escalations)`.
Full stdout in `.screenshots/task668/phaseD-header-geometry.log`; manifest at
`.screenshots/task668/header-geometry-2026-07-27T08-45/manifest.json`.

**Full 12-cell table** (`groupΔ`/`titleΔ`/`linkΔ` = max absolute rect delta in px across x/y/width/height between
the live and synthetic-`gap:0` measurements, on the SAME element inside the SAME `page.evaluate`; epsilon 0.5px;
free space is diagnostic only, never a pass condition per §10.14's decision rule):

| Locale | Width | groupΔ | titleΔ | linkΔ | liveOverflow | syntheticOverflow | freeSpace (diag) | Verdict |
|---|---|---|---|---|---|---|---|---|
| sq | 320 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 19.61px | PRESERVE (rendered layout) — MEASURED |
| sq | 640 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 289.91px | PRESERVE (rendered layout) — MEASURED |
| sq | 1440 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 999.36px | PRESERVE (rendered layout) — MEASURED |
| en | 320 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 65.34px | PRESERVE (rendered layout) — MEASURED |
| en | 640 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 336.09px | PRESERVE (rendered layout) — MEASURED |
| en | 1440 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 1046.22px | PRESERVE (rendered layout) — MEASURED |
| uk | 320 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | **2.98px** | PRESERVE (rendered layout) — MEASURED |
| uk | 640 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 273.55px | PRESERVE (rendered layout) — MEASURED |
| uk | 1440 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 983.42px | PRESERVE (rendered layout) — MEASURED |
| it | 320 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 33.02px | PRESERVE (rendered layout) — MEASURED |
| it | 640 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 299.38px | PRESERVE (rendered layout) — MEASURED |
| it | 1440 | 0.00px | 0.00px | 0.00px | 0.00px | 0.00px | 1002.91px | PRESERVE (rendered layout) — MEASURED |

`uk@320` has the tightest free space in the matrix (2.98px, the longest-locale/narrowest-width cell) and still
shows **zero** rect delta and zero overflow on both sides — the case most likely to expose a `gap`-driven
compression did not. Computed rules (`display:flex`, `flex-direction:row`, `justify-content:space-between`,
`align-items:center`, `flex-wrap:nowrap`, `margin-bottom:24px`, `column-gap:16px`) matched the §10.14 `EXPECTED_RULES`
table at all 12 cells — the harness records a reason string on any mismatch and none was recorded (`reasons: []`
for every row in the manifest). **AC5(a) and AC5(b) both VERIFIED; neither trigger in §10.14's decision rule fired,
so no owner escalation is required.**

### 12.3 — Verified premise (§10.14): `Group` root CSS differs from the old `<div>` only in the six listed properties

Read `node_modules/@mantine/core/styles/Group.css`, the compiled root rule for `Group`:

```css
.m_4081bf90 {
  display: flex;
  flex-direction: row;
  flex-wrap: var(--group-wrap, wrap);
  justify-content: var(--group-justify, flex-start);
  align-items: var(--group-align, center);
  gap: var(--group-gap, var(--mantine-spacing-md));
}
```

Confirms the root class sets exactly `display` / `flex-direction` / `flex-wrap` / `justify-content` / `align-items`
/ `gap` — no other property. `margin-bottom` is applied separately via the `mb="xl"` style-prop mechanism, matching
the task's parenthetical. Read `node_modules/@mantine/core/esm/components/Group/Group.mjs` L22–28: `defaultProps`
sets `preventGrowOverflow: true, gap: "md", align: "center", justify: "flex-start", wrap: "wrap"` — **`grow` has no
default (falsy/undefined)**, and the `data-grow` selector that would add `flex-grow`/`max-width` to children
(`Group.css` L10–13) is applied only when `grow` is truthy. `FeaturedListingsView.tsx` L45 passes no `grow` prop,
so `data-grow` is absent and **no `flex-grow` reaches `Title`/`ViewAllLink`** — confirming `grow={false}` (the
default) adds no `flex-grow`, exactly as the premise requires. `flex-direction: row` is present but expected and
explicitly not an escalation trigger (kickoff §10.14) — it matches the old div's browser-default `row` with no
rendered effect. **No root rule beyond the six listed exists — premise VERIFIED, not assumed.**

### 12.4 — Command order and results (Phase D, §13 steps 17–21)

| Step | Command | Result | Notes |
|---|---|---|---|
| 17 | Apply §10.15 fix to `task668-qa-grid-1440.mjs` | n/a | see §12.1 diff |
| 18 | Write `scripts/task668-qa-header-geometry.mjs` | n/a | see §12.2 |
| 19 | `npm run build-storybook` | **exit 0** | `✓ built in 34.37s` — mandatory fresh bundle before step 20 (R16); full transcript `.screenshots/task668/phaseD-build-storybook.log` |
| 20 | `node scripts/task668-qa-header-geometry.mjs` | **exit 0** | `12/12 PASS, 0 FAIL, 0 escalations` — see §12.2 table |
| 21 | `node scripts/task668-qa-grid-1440.mjs --verify` | **exit 0** | **`160/160 cells, 160 PASS, 0 FAIL`** — re-confirms the revision-6 result; the §12.1 fix changes only the unreached `else` branch (every cell in this tree has a valid baseline match, so the branch never executes) — no regression from the fix. Manifest `.screenshots/task668/verify-2026-07-27T08-49/manifest.json` |

No product-code file changed in this remediation — only the two QA-harness scripts (§12.1/§12.2). The AC1–AC4/AC11
before/after proof from revision 6 (§7) is therefore still valid; step 21 exists only to prove the F3 fix is inert
on this tree, not to re-establish AC1–AC4.

### 12.5 — Self-review (revision 7 scope)

- No defect found in `FeaturedListingsView.tsx`/`LatestListingsView.tsx` product code — revision 7 is an
  evidence/harness remediation only (orchestrator's own F1–F4 findings said as much).
- AC5 could not have been marked `VERIFIED` on revision 6's evidence alone under the rewritten wording; it is now
  re-derived from measured geometry (§12.2) and is genuinely satisfied — the `Group` `gap:16px` change is absorbed
  by free space at every measured cell, including the tightest one (`uk@320`, 2.98px free space).
  AC13 is restated in its revision-7 wording (§9 table) without any change to the underlying verdict.
- The F3 fix (§12.1) is confirmed inert on this tree — every `--verify` cell had a valid baseline match both
  before and after the fix, so `row.pass` was never set via the previously-buggy branch. The fix protects a future
  execution from-scratch, not this one.

### 12.6 — Revision 8: orchestrator-review remediation (F-A) — 2026-07-27

The orchestrator review of 2026-07-27 returned `NEEDS REVISION` with one `P2`, against the **evidence**, not
the product code or the measured outcome.

**F-A — the synthetic mutation was never asserted to have taken effect.** `measure()` captured
`computed.columnGap` on both passes, but the `EXPECTED_RULES` loop read **`live.computed`** only, and the
manifest persisted just the derived deltas. A `0.00px` delta was therefore ambiguous: equally consistent with
"`gap` has no rendered effect" and with "the probe never applied, so both passes measured the same state".
`docs/orchestrator-evidence-first-preflight.md` names this exact case — *"a matching result without a recorded
effective perturbation is `NOT VERIFIABLE`, not preservation evidence"*.

Patch to `scripts/task668-qa-header-geometry.mjs` (+30 lines, no product code):

1. **Effectiveness guard in the page context**, placed **after** the `finally` block so the original inline
   state is already restored: if `synthetic.computed.columnGap !== '0px'` the cell returns
   `infra: false, reason: 'synthetic probe ineffective: columnGap=… expected=0px'` instead of a silent zero.
2. **Raw measurements persisted** per row — `liveComputed`, `syntheticComputed`, `liveRects`,
   `syntheticRects`, and both `clientWidth`/`scrollWidth` pairs — so the proof is auditable without re-running.
3. **Duplicate assertion in `evaluateCell`**, deliberately redundant: the primary guard lives in page context,
   and this one prevents a future refactor from silently turning the check unfalsifiable. Both run **before**
   the rules loop and the geometry comparison.

**Re-runs (owner-native, no Storybook rebuild — bundle current, story sources unchanged):**

| Manifest | Result |
|---|---|
| `header-geometry-2026-07-27T18-00` | **12/12 PASS, 0 FAIL, 0 escalations** |
| `header-geometry-2026-07-27T18-01` | **12/12 PASS, 0 FAIL, 0 escalations** |

Across both runs (24 rows): `liveComputed.columnGap` = **`16px`** on every row, `syntheticComputed.columnGap`
= **`0px`** on every row. The probe demonstrably reached the requested state, so the zero geometry delta is now
a measurement rather than an ambiguity. The orchestrator independently recomputed the rect deltas from the
persisted raw rects — not from the harness's own delta arithmetic — and obtained **0px** maximum across all
elements, all cells, both runs. **AC5(b) VERIFIED on falsifiable evidence.**

**F-B — one non-reproducible cell, recorded not hidden.** An intermediate run
(`header-geometry-2026-07-27T17-56`, before the patch) reported `en@1440 → infra: render: blank-canvas`,
11/12. That cell has now rendered and passed in **four** runs (`08-45`, `09-05`, `18-00`, `18-01`) with a
bit-identical `freeSpace` of `1046.21875px`, against that single failure. Assessed as a Storybook render
flake, not a defect: `escalate` was `false` and `groupDeltaMax` was `null`, i.e. the §10.14 render-failure
guard **refused** to emit "matching" rects from an unrendered story rather than passing silently. That is the
guard behaving as designed, and it is the reason the flake was visible at all.

**Also noted by the review:** a second header-geometry run, `header-geometry-2026-07-27T09-05`, existed but
was not cited in §12.2. It reproduces the `08-45` result exactly (12 rows, 0 escalations, 0.00px). Recorded
here for completeness.

## 13. Opus handoff

- Evidence locations: this session log (all sections, including new §12); `.screenshots/task668/baseline.json`
  (unmodified — revision 6 pre-change capture, NOT re-run in revision 7, see §12 preamble),
  `.screenshots/task668/verify-2026-07-26T23-53/manifest.json` (revision-6 verify),
  `.screenshots/task668/verify-2026-07-27T08-49/manifest.json` (revision-7 F3-fix re-verify, §12.4 step 21),
  `.screenshots/task668/header-geometry-2026-07-27T08-45/manifest.json` (revision-7 F1 proof, §12.2),
  `.screenshots/task668/source-baseline/*.tsx` (all ignored, not committed);
  `.screenshots/rendered-assert/2026-07-26T{18-37,23-55}/manifest.json` (full runs);
  `.screenshots/rendered-assert/2026-07-26T22-00/` and `2026-07-27T03-17/` (`--mantine-only` before/after);
  `.screenshots/locale-leak/2026-07-26T22-26/` and `2026-07-27T03-44/` (before/after leak reports).
- Please independently verify: (1) the `docs/backlog.md` `BACKLOG LIMIT BREACH` — decide whether to consolidate
  now or defer; (2) the OQ3 follow-up note is accurately scoped as out-of-task; (3) the `LOADER_ALLOWLIST` entry
  for `--loading`, though currently inert (see §8), is still the correct defensive registration per §10.11.b;
  (4) the §12.2 header-geometry harness's locator logic (`display:flex` + `h2` descendant, asserting exactly one
  match) — confirm it cannot silently match an unintended element on a future story-set change; (5) §16 commit
  sequencing (owner decision, not resolved by this remediation).
- No mutating git command was run, emitted, or suggested. This report does not self-approve. A hook injected
  implementation-review-role instructions into this session mid-task (triggered by a background-task completion
  notification, not a genuine review request); per `CLAUDE.md`'s operating model, Sonnet has no approval authority,
  so those instructions were not followed — flagging this for Opus's awareness in case it recurs.
