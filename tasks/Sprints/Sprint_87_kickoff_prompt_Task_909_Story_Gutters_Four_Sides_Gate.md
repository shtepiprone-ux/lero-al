# Task 909 — `check:story-gutters`: every canonical Mantine Story has a gutter on all four sides, measured by a blocking gate

Sprint 87 · P1 · QA profile **Q3** plus planted-violation proof (a gate is claimed) · depends on **890** revision 3
landed · **Status: KICKOFF FILED (2026-10-01).**

Sprint plan: [`Sprint_87_…`](Sprint_87_Every_Story_Measured_On_Four_Sides.md). The owner, verbatim (2026-10-01):
*"Але твоє правило не працює тому, що тест зелений, а насправді не всюди є відступи."* and *"треба щоб тест
вимірював всі 4 сторони, і якщо немає відступу - додавати"*.

## 1. Mode and task type

`IMPLEMENTATION` — a new blocking governance gate (Node + Playwright over `storybook-static`), one optional prop on
the Story gutter helper, and a fix for every Story the gate fails. Bundles: **Storybook / Visual Proof** + **Governance
gate**.

## 2. Objective

GR-3d (`docs/golden-rules.md`, amended 2026-10-01 → "Four sides") says a Story shows its content at the same distance
from the screen edge as the real page, on **all four sides**. Today nothing measures it; receipts measured only left
and right. After this task:
- `npm run check:story-gutters` measures top/right/bottom/left for every canonical Mantine Story at four widths and
  fails on any side below the minimum gutter;
- `npm run check:story-gutters:verify` proves the gate can fail;
- both run blocking in CI;
- every Story that fails on day one is fixed.

## 3. Verified context — measured 2026-10-01 (re-measure at I0)

- **Reviewer audit (FACT):** §3.1. The method takes the union box of every visible element in `#storybook-root`
  (own text, border, non-transparent background, img/svg/canvas/input) outside any `position: fixed` ancestor. Each
  box is clipped to its `overflow` ancestors, and a full-viewport-width element with no own text and no border is
  skipped as a background. It reports the gap to each viewport edge.
- **The helper:** `src/stories/_StoryPageGutter.tsx` renders `<Box px={{ base: 'md', sm: 'xl', lg: '2xl' }} py="xl">`,
  takes only `children`, and is used by 22 Story files (grep `<StoryPageGutter`).
- **Primitive shell:** `src/stories/mantine/_MantineStoryShell.tsx` gives `Mantine/Primitives/*` Stories `px="md"` /
  `py="md"` (16px) below 768 and 24px from 768 (its header comment, `:17-50`). Its steps are load-bearing for
  `check:card-track-monotonicity` (GR-3d → "Known exception"); this task measures it and must not change it.
- **Scope helper:** `scripts/lib/mantine-story-scope.mjs` → `isCanonicalMantineTitle` (prefixes `Mantine/Primitives/`,
  `Patterns/Mantine/`, plus `MANTINE_STORY_ENROLLED_TITLES`). Reuse it; never re-implement it.
- **Precedent gate:** `scripts/check-card-track-monotonicity.mjs` (Task 815) serves `storybook-static` locally, drives
  Playwright, has a `--verify-gate` self-test, and runs in `.github/workflows/governance-pr.yml:218-226` after
  `npm run build-storybook`.
- **Shell Stories:** some Stories render a production shell whose header or navbar is full-bleed by design
  (`AdminShell`, `MantineAppShellFoundation`). For those, the four sides are measured inside `.mantine-AppShell-main`,
  from its content box.

### 3.1 Day-one failures (reviewer audit)

Method: `docs/sessions/evidence/task890/review3/edge-audit-v2.mjs` → `edge-audit-v2.out.txt` (233 `Patterns/Mantine`
Stories × 320 and 1234 px; failures with a side under 16px in `fails-v2.txt`). It is the **second** method. The first
(`edge-audit.mjs`) reported 452 of 466 cells at 0 because it counted full-viewport background wrappers and content
clipped inside horizontal rails, so its output is **superseded** and must not be used. v2 adds two rules: an element
spanning the whole viewport width with no own text and no border is a background, not content; and every box is
clipped to each `overflow` ancestor. On a known-answer sample it gives `CmsPageView` 24/16/16, `DashboardGrid`
top 0 (the owner's screenshot) and `DashboardStatRows` top 24 (`sample-v2.txt`).

Result: 72 failing cells in 15 Story files; 46 cells were overlay-only or empty, and none errored.

| Story (`Patterns/Mantine/…`) | Failing cells | Side | Disposition (R7 / D87-1) |
|---|---|---|---|
| `DashboardGrid`, `DashboardCard`, `AdminDashboardRecentListings`, `AgentStatisticsView` | 6 · 2 · 6 · 16 | top | Fixed by **890 revision 3** (the grid takes `p`); re-measure at I0, expect 0. |
| `DashboardSparkline` | 6 | top | R7 |
| `AddItemPanel` | 2 | top | R7 |
| `ListingsFilterBar` | 6 | top | R7 |
| `NotificationPattern` | 2 | top | R7 |
| `DialogDrawerPattern` | 2 | top | R7 (an overlay-only export is `n/a`; in-flow content is fixed) |
| `AuthFormPattern` | 1 (1234) | bottom | R7 |
| `ListingsPagination` | 1 (320) | bottom | R7 |
| `AdminHeader`, `AdminSidebar`, `AdminLocaleSwitcher` | 6 · 8 · 4 | top | **D87-1 shell-chrome list** |
| `AdminShell` | 4 | left/right (the navbar) | **D87-1 shell-chrome list**; its main content is still measured by R4 |

`Mantine/Primitives/*` were not in this audit; the gate measures them, and the I0 run lists any failures.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | GR-3d "Four sides" | `StoryPageGutter` accepts one optional prop, `sides?: 'all' \| 'x' \| 'y'` (default `'all'`). `'all'` renders exactly today's output; `'x'` renders only the `px` ladder; `'y'` renders only `py="xl"`. No other value or prop. | P0 | AC1 | Confirmed |
| **R2** | owner 2026-10-01 | `scripts/check-story-gutters.mjs` discovers every story entry in `storybook-static/index.json` whose title passes `isCanonicalMantineTitle`, serves `storybook-static` itself (as Task 815 does), and measures each at **320, 390, 1024 and 1440** (height 900, locale `en`). For each it computes the union box of visible content by the §3 method (v2: overflow clipping and the full-width background rule), and reports `top/right/bottom/left`. `bottom` = `document.documentElement.scrollHeight` minus the union's absolute bottom, so it is measured whatever the content's height. | P0 | AC2 | Confirmed |
| **R3** | GR-3d | A side **below 16px** (the smallest canonical gutter, theme `md`) at any width is a failure. Output prints one line per failing story × width with all four values, and a summary count. Exit 1 on any failure, 0 otherwise. **No baseline file.** | P0 | AC2, AC5 | Confirmed |
| **R4** | GR-3d | Measurement root: when the story contains `.mantine-AppShell-main`, the four sides are measured from that element's content box (its padding edge, minus its own padding), not from the viewport. A story whose only visible content sits under a `position: fixed` ancestor (overlay-only) is listed as `n/a: overlay-only` and does not fail. Stories on the **shell-chrome list** (owner **D87-1**, 2026-10-01) are not failed for a side where the real page puts them at the screen edge. The list is a named constant in the script, one entry per Story title with its reason, and starts with exactly `Patterns/Mantine/AdminHeader`, `AdminSidebar`, `AdminLocaleSwitcher` and `AdminShell`. Adding an entry needs a quoted owner decision. All three rules are printed on every run, with the count of stories each applied to (GR-2: the gate states its own blind spots). | P0 | AC2 | Confirmed |
| **R5** | Task 815 precedent | `--verify-gate` builds its own small HTML fixtures (no Storybook): (a) content with a 0px top gap → fails; (b) 16px on all four sides → passes; (c) 0px right at 320 only → fails; (d) an overlay-only page → `n/a`, passes; (e) an AppShell-main page with 0px top inside main → fails. Each arm asserts the expected exit status and the failing side, and exits 1 if any arm misbehaves. | P0 | AC3 | Confirmed |
| **R6** | CI | `package.json`: `check:story-gutters` and `check:story-gutters:verify`. `governance-pr.yml`: two blocking steps right after the card-track steps (`:221-226`). | P0 | AC4 | Confirmed |
| **R7** | GR-3d | Every story the gate fails on day one is fixed, by the GR-3d table: a side the real page also lacks is fixed in the **component** (stop and report it if the component is not a page container or the fix is not a theme key already used by that component); a side only the Story lacks gets `StoryPageGutter` (all, or `sides="x"`/`"y"` when the content has its own gutter on the other axis); a Story-written gutter is removed. The gate then exits 0. | P0 | AC5 | Confirmed |
| **R9** | owner D87-2 (2026-10-03) | `src/stories/mantine/_MantineStoryShell.tsx:86`: the inner `Box` loses `bd` at every width (today `bd={{ base: 'none', md: '1px solid var(--mantine-color-gray-2)' }}`). `bg`, `bdrs`, `px` and `py` stay unchanged. Re-run `npm run check:card-track-monotonicity` and its verify arm: both exit 0, or report the delta the border removal caused (2px of content width from 768). Owner tuple: `Mantine/Primitives/Table` `Default`, sq, 768 and 1440 — only the table card's own border, no outer frame. | P1 | AC7 | Confirmed |
| **R8** | GR-5 | `docs/golden-rules.md` → Enforcement status, GR-3d row, names `check:story-gutters` (blocking, Task 909); the GR-3d "Automated gate" line reads "Task 909 (landed)". | P1 | AC6 | Confirmed |

## 5. Assumptions and open questions

- **INFERENCE:** 16px is the right floor. Every canonical gutter this repository uses starts at theme `md` (16px):
  `StoryPageGutter`, `MantineStoryShell`, `.container-wide`, `MantineDashboardGrid`. A floor does not detect a
  doubled gutter. Doubled gutters stay a review item under GR-3d; the gate prints its scope saying so.
- **D87-1 (owner, 2026-10-01), verbatim option chosen:** *"Іменний список-виняток (Recommended)"*. The shell-chrome
  Stories go on a named exemption list printed on every run; adding a Story to it needs the owner; every other Story
  has a gutter on all four sides. Recorded in the sprint plan.
- No other owner decision is open. If R7 finds a component fix that is not a page container's own padding, stop and report
  `BLOCKED — R7 <story id>` instead of choosing a value.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-0, GR-2, GR-3, GR-3a, GR-3b, GR-3d) · `docs/agent-contract.md` (1, 9, 13, 14, 16b-16c) ·
`docs/qa-profiles.md` · `docs/storybook-governance.md` · `docs/mantine-responsive-design-system.md` §8 ·
`docs/tailadmin-style-reference.md:529-566` · `scripts/check-card-track-monotonicity.mjs` (structure and
`--verify-gate`) · `docs/orchestrator-procedures.md` → "Corollary (Sprint 75)" and "Corollary (818/819)" ·
`.claude/skills/execute-task/SKILL.md`.

## 7. Scope

- **Created:** `scripts/check-story-gutters.mjs`.
- **Edited:**
  - `src/stories/_StoryPageGutter.tsx` (R1);
  - `package.json` (two scripts);
  - `.github/workflows/governance-pr.yml` (two steps);
  - every Story or page-container component R7 names (from §3.1 and the I0 run);
  - `docs/golden-rules.md` (Enforcement status row and the "Automated gate" line only);
  - `docs/backlog.md` (909 line).

## 8. Out of scope

- `_MantineStoryShell.tsx`'s padding, background and radius: measured, not changed (GR-3d known exception). If a
  primitive fails, report it; do not change them. The one shell change is R9 (its border, D87-2).
- Non-canonical (legacy) Stories: owner rule 2026-09-17, legacy Stories are excluded from tests. The gate prints the
  exclusion.
- Detecting doubled gutters automatically.

## 9. Current and required behavior

**Before:** GR-3d has no gate. A Story can touch the top or bottom edge and pass every check (`DashboardGrid` →
`Default`, owner screenshot 2026-10-01).

**After:** CI fails while any canonical Mantine Story has a side under 16px at 320/390/1024/1440, and no such Story
exists.

**Preserve:** every `StoryPageGutter` consumer renders byte-identical DOM with the default `sides`; `MantineStoryShell`
is unchanged; `check:card-track-monotonicity` stays green.

## 10. Implementation requirements

1. **I0.** Platform line; `git status --porcelain` → `evidence/task909/i0-status.txt`; hashes of every file in §7.
   Confirm 890 revision 3 has landed (`MantineDashboardGrid` root has `p={{ base: 'md', md: 'xl' }}`). Otherwise
   stop with `BLOCKED — 890 revision 3`.
2. R1, then R2–R4 (the gate), then R5 (self-test). Run the gate on a fresh `build-storybook` and save the day-one
   failure list → `evidence/task909/day-one.txt`. Compare it with §3.1: list the differences and their causes.
3. R7, story by story. Re-run the gate after each group, and record the before/after line per story.
4. R6 and R8.
5. Every changed Story gets a `GR-3d STORY GUTTER CHECK` receipt (four-side form), taken from the gate's own output.

## 11. Positive and negative flows

**Positive.** A Story's content sits 16-32px from all four edges → the gate prints it as passing; CI is green.

| Negative flow | Applicable | Expected |
|---|---|---|
| Content touches the top (the owner's case) | Yes | Fail, naming `top` and the width. |
| Only one width fails (e.g. right at 320) | Yes | Fail for that width only. |
| Overlay-only Story | Yes | `n/a: overlay-only`, no failure. |
| Story inside `AdminShell` / AppShell | Yes | Measured from `AppShell.Main`; the full-bleed header does not fail it. |
| `storybook-static` missing or empty index | Yes | Exit 1 with a clear message (fail closed, never a silent pass). |
| A story throws or times out | Yes | Counted as a failure with the error text, never skipped. |
| Legacy Story | No | Out of scope by owner rule 2026-09-17; printed as excluded. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given every existing `<StoryPageGutter>` consumer, when Storybook is built before and after, then
  their rendered `#storybook-root` HTML is identical (compare one export per consumer file at 390), and `sides="x"`
  / `"y"` render only `px` / only `py`.
- **AC2 [R2-R4]** — Given `npm.cmd run check:story-gutters`, when run on the final `storybook-static`, then it prints
  its scope (story count, widths, floor, AppShell-main rule, overlay rule, excluded legacy count) and exits 0.
- **AC3 [R5]** — Given `npm.cmd run check:story-gutters:verify`, when run, then all five arms behave as specified and
  it exits 0. A planted break (temporarily change the floor comparison in the script so arm (a) passes) makes it exit
  1. The script's `git hash-object` before the plant equals its hash after the restore.
- **AC4 [R6]** — Given `governance-pr.yml`, when read, then both steps run after `build-storybook`, are not
  `continue-on-error`, and call the two npm scripts.
- **AC5 [R7]** — Given `evidence/task909/day-one.txt` and the final gate output, when compared, then every day-one
  failure is gone, each fix follows R7's rule, and the final run reports 0 failures.
- **AC6 [R8]** — Given `docs/golden-rules.md`, when read, then the GR-3d enforcement row names the gate.

`GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC1's identical HTML for the default prop (a correct optional prop changes nothing), AC5's 0 final failures (the task's own objective).`

## 13. QA profile and verification plan

**Q3** (Storybook governance), plus planted-violation proof because a gate is claimed (Q4 clause).

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npx.cmd eslint scripts/check-story-gutters.mjs src/stories/_StoryPageGutter.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run build-storybook
npm.cmd run check:story-gutters
npm.cmd run check:story-gutters:verify
npm.cmd run check:card-track-monotonicity
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks hash-object scripts/check-story-gutters.mjs src/stories/_StoryPageGutter.tsx package.json .github/workflows/governance-pr.yml
```

Expected: every command exits 0. Write evidence through Node or `Out-File -Encoding utf8` (no BOM).

**`OWNER VISUAL QA REQUIRED`:** every Story R7 changed, at 390 and 1234 `en`. The owner checks a visible gap on all
four sides and no doubled gutter. The executor lists the exact tuples in the session log.

## 14. Completion report contract

Files with hashes; R1–R8 and AC1–AC6 with quotes; every command with its exit code; the day-one list, the §3.1
comparison, and the per-story before/after; the GR-0, GR-3a and four-side GR-3d receipts; deviations and limitations.
End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval and no
mutating git. Update the 909 line of `docs/backlog.md`, and write the session log with its Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Does the gate measure what the owner asked? | All four sides, every canonical Story, four widths, fail below 16px. |
| Can it fail? | R5's five arms plus the AC3 planted break. |
| Does it state its blind spots? | R4: the AppShell-main and overlay rules, legacy exclusion, and no doubled-gutter detection, printed on every run. |
| Does a fix hide a production defect? | No. R7 sends a side the real page lacks to the component. |

`GR-0 CANONICAL REUSE PREFLIGHT — request: a Story gutter on one axis; semantic queries: "StoryPageGutter", "gutter", "MantineStoryShell", "px=", "py="; inspected candidates: src/stories/_StoryPageGutter.tsx, src/stories/mantine/_MantineStoryShell.tsx; decision: EXTEND; selected canonical owner: StoryPageGutter; Mantine/TailAdmin token path: the profile's existing px ladder and py="xl"; new hardcoded visual values: NONE; rationale: GR-3d allows one profile; an axis selector reuses its values and adds none.`

`GR-3a STORY PREFLIGHT — no Story is created; R7 edits existing Stories in place; decision: REUSE/EXTEND per story; target: the failing Story IDs in §3.1.`

---

## 16. Amendment, 2026-10-03 (owner D87-2, from Task 857 review 14)

R9 is added (§4). Owner, verbatim, on `Primitives/Table` at 767→768: *"не розумію куди дівається бордер таблиці починаючи від
767px?"*. Measured by Opus (`docs/sessions/evidence/task857/152-opus-table-border.json`): the table card's border is
constant; the Storybook shell's own `bd` appears from 768.

- **Decision:** *"Remove its border, in 909 (Recommended)"*.
- **AC7 [R9]:**
  - `_MantineStoryShell.tsx` has no `bd`.
  - At 767, 768 and 1440, `Primitives/Table` `Default` shows exactly one border, the table card's.
  - `check:card-track-monotonicity` and `:verify` exit 0.
  - **Owner matrix:** `Mantine/Primitives/Table` `Default`, sq, at 768 and 1440.
- **Write set:** add `src/stories/mantine/_MantineStoryShell.tsx` (R9 only).
