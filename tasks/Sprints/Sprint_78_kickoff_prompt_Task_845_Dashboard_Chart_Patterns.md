# Task 845 — `@mantine/charts` enters the project; `MantineDashboardLineChart` and `MantineDashboardDonut` with text alternatives

Sprint 78 · P1 · QA profile **Q3** · Wave A · depends on **843** approved (card shell) and **844** approved (tone
map) · **Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md). **D78-2** (owner,
2026-09-18): *"@mantine/charts (Рекомендовано)"*.

## 1. Mode and task type

`IMPLEMENTATION` — add one dependency and create two canonical chart patterns with Stories. Bundles: **UI / Current
Mantine path** + **Storybook / Visual Proof** + dependency change (`package.json`, lockfile).

## 2. Objective

1. `@mantine/charts` is installed at the version that matches the installed `@mantine/core`, together with the
   peer version of `recharts` that release declares. Its stylesheet is imported wherever `@mantine/core/styles.css`
   is imported today.
2. **`MantineDashboardLineChart`** — a daily line chart with **independent** series (spec ADM-10, AGT-03/04/05):
   - x = local completed date, y = count;
   - one legend toggle per series (keyboard-operable, selected state visible);
   - a tooltip with date + full series label + exact count;
   - a "show data table" toggle that reveals the same numbers as a Mantine `Table` (the text alternative);
   - an empty state for an all-zero period (no bare coordinate grid);
   - no animation;
   - it never sums series.
   A `mode="single"` variant takes exactly one series, for the agent chart's single-event selector (855).
3. **`MantineDashboardDonut`** — a status-distribution donut (spec ADM-11, and the agent portfolio visibility donut in
   855):
   - the centre shows the total;
   - below it, a legend **list** in which every row is a link with a colour swatch, the text label, the absolute count
     and the share;
   - clicking a segment follows the same link.
   The list is mandatory; the donut is never the only representation.
4. Chart colours come from a new theme role, `theme.other.chartSeries` (theme colour references, not hex). Donut
   segment colours come from 844's `LISTING_STATUS_COLOR` / `VISIBILITY_TONE_COLOR`, passed in by the caller.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- `package.json`: `"@mantine/core": "^8.3.18"`, `@mantine/form`, `@mantine/hooks`, `@mantine/modals`,
  `@mantine/notifications` (all `^8.3.18`). **No chart package** (`git grep -n -E "recharts|chart" -- package.json`
  → only unrelated script names).
- Mantine CSS is imported at `src/app/layout.tsx:6-7` (`@mantine/core/styles.css`,
  `@mantine/notifications/styles.css`) and `.storybook/preview.tsx:11-12`. `MantineRootProvider.tsx:23` documents that
  CSS is imported by the layout.
- Theme colours defined in `theme.ts` `colors`: `brand, gray, green, yellow, red, blueLight, purple, sale, orange`.
- No chart, donut or legend component exists in `src/` (`git grep -l -i -E "LineChart|DonutChart|PieChart|recharts" -- src` → none).
- `MantineEmptyLoadingErrorState` (enrolled, storied) is reused for the chart's whole-period empty state and its error
  state (the chart area is ≥ 384px tall, so its 200px min block size fits — the reverse of 843's compact-card case).
- `MantineDashboardCard` (843) is the chart's card shell: the charts are **body content**, not cards themselves, so
  the consumer composes `MantineDashboardCard` + chart. This keeps one card chrome owner.
- Known jsdom limitation: no `ResizeObserver` (Task 790 row, `useSwipeTrackSync`). Recharts' responsive container
  needs it, so this task adds **no** jsdom render test of the charts. Proof is the Story, rendered in a real browser.

### 3.1 Spec rules restated (v3.3)

- §17.2 ADM-10: main chart card, **minimum height 384px**; header: title, selected completed period, a legend toggle
  per independent series; plot: line/area only per event with an accessible name; tooltip = date + event label + exact
  count; no "total interaction", no current incomplete day, no pseudo-percent trend.
- §17.2 ADM-11: donut centre = total non-deleted listings; legend list: colour swatch, status label, absolute count,
  share; clicking a segment or list row opens the listing filter; the list is the mandatory text equivalent.
- §17.4 chart control: selector and legend are keyboard-operable buttons/checkboxes with a selected state; the tooltip
  opens on mouse and keyboard focus and has a tabular text alternative; one day without events shows the axis with
  label 0; a whole empty period shows an empty state, not an empty grid.
- §17.4 motion: no auto-play chart; respect `prefers-reduced-motion` (here: animation always off, which satisfies both).
- §3 / §13: views, WhatsApp clicks, form inquiries and chat are never summed or merged into one series.

### 3.2 Clause 16d / GR-1 census

New files. They render `@mantine/charts` components (external package, not a census node), Mantine core, and
`MantineEmptyLoadingErrorState` (enrolled, storied).
`GR-1 CENSUS COMPLETE — 2 nodes; tier1 2 migrated+enrolled+story (this task); tier2 0 imports removed; tier3 0 listed and filed as none.`

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D78-2 | `@mantine/charts` is installed at the exact version of the installed `@mantine/core`, with the `recharts` range that version's `peerDependencies` declare. `package.json` and `package-lock.json` change only for these two packages and their transitive dependencies. `@mantine/charts/styles.css` is imported directly after the existing `@mantine/core/styles.css` import in `src/app/layout.tsx` and `.storybook/preview.tsx`. | P1 | AC1 | Confirmed |
| **R2** | spec §17.2 ADM-10, §17.4 | `MantineDashboardLineChart` props: `data: { date: string /* YYYY-MM-DD */; [seriesKey: string]: number \| string }[]`, `series: { key, label, color }[]`, `mode: 'multi' \| 'single'`, `dateLabel(date) => string` (the caller formats dates; the pattern never formats), `valueLabel(n) => string`, `tableToggleLabel`, `emptyTitle`, `emptyDescription`, `state: 'ready' \| 'loading' \| 'empty' \| 'error'`, `errorText`, `retryLabel`, `onRetry`, `ariaLabel`. Multi mode renders one legend toggle per series (`Chip`, `Checkbox` or `SegmentedControl`, whichever canonical primitive the executor shows fits; decision recorded); hidden series are removed from the plot, never zeroed. Min height `theme.other.boxSize.dashboardChartMinHeight` (new, `'24rem'` = 384px, spec §17.2). Animation off. | P1 | AC2, AC3 | Confirmed |
| **R3** | spec §17.4 | The data-table toggle reveals a Mantine `Table` with one row per date and one column per **visible** series, numbers via `valueLabel`. Tooltip content = `dateLabel(date)`, series label, `valueLabel(value)`. | P1 | AC3 | Confirmed |
| **R4** | spec §17.2 ADM-11 | `MantineDashboardDonut` props: `segments: { key, label, count, color, href }[]`, `totalLabel`, `formatCount`, `formatShare`, `ariaLabel`, `state` + `emptyText` / `errorText` / `retryLabel` / `onRetry`. The centre shows the total (the sum of segment counts, computed in the pattern — the only arithmetic it does). Below the donut, a list: every row is one `next/link` anchor (min height `touchTarget`) with a colour swatch (Mantine `ColorSwatch` fed a theme colour via `theme.colors` lookup), label, count and share. A segment click navigates to that segment's `href`. Segments with count 0 are listed in the legend with `0` and omitted from the ring. | P1 | AC4 | Confirmed |
| **R5** | hardcode rule | New role `theme.other.chartSeries: { recordedViews, whatsappClicks, formInquiries, chatThreads, chatInboundMessages }`, each a theme colour reference string of the form `'<colour>.<shade>'` using only colours in `theme.colors` (proposed: `blueLight.7`, `green.7`, `orange.7`, `purple.7`, `brand.7` — the executor keeps these unless the owner matrix returns one). The chat keys exist for the future chat series (D78-1 keeps chat out; the keys cost nothing and prevent a later ad-hoc colour). No hex, no rgb, no raw px in the pattern files. | P1 | AC5 | Confirmed |
| **R6** | 16c, GR-3, GR-3a | Own Stories `Patterns/Mantine/DashboardLineChart` (multi 3 series × 30 days; one series hidden; single mode; a day with 0; all-zero → empty; loading; error) and `Patterns/Mantine/DashboardDonut` (8 segments incl. a 0 segment; empty; error). Fixture data is deterministic (a fixed start date, a generated but seeded series) and declared as a fixture. Both pattern files are enrolled. | P1 | AC6 | Confirmed |
| **R7** | agent-contract 7 | Story strings via `storyT`; pattern-owned strings are props. `check:i18n` 0. | P2 | AC7 | Confirmed |
| **R8** | breakpoints | At 320–767px the line chart keeps its min height, and the legend toggles wrap. The donut stacks above its list. Nothing overflows horizontally in `uk`. At ≥ 1024px the donut and its list fit a 4-of-12 column (≈ 1/3 of a 1440 content width). | P1 | AC8 | Confirmed |

## 5. Assumptions and open questions

- **Version pairing** is measured at I0, never assumed: `npm.cmd view @mantine/charts@<installed core version> peerDependencies`.
  If no `@mantine/charts` release matches the installed core version exactly → `BLOCKED` with the listing. Do not
  upgrade `@mantine/core`.
- **Legend control choice** (Chip vs Checkbox vs SegmentedControl) is the executor's to make among canonical
  primitives that already have Stories (`Mantine/Primitives/Checkbox`, `…/SegmentedControl`; there is no Chip
  story — using `Chip` would need its own primitive Story, so prefer `Checkbox` or a `Button` group with
  `aria-pressed`). Record the choice and why.
- Mantine charts' internal SVG uses its own CSS variables for grid/axis colours; those come from the package's
  stylesheet and theme, not from this project. INFERENCE: acceptable as library chrome, the same as Mantine core's
  own stylesheet. The owner matrix checks the look.
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (7, 9, 11, 13, 14, 16–16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6 (cards, tables) ·
`docs/component-rules.md` · `docs/storybook-governance.md` · `docs/i18n-rules.md` · `docs/qa-rules.md` ·
`docs/performance.md` (bundle-size note for a new client dependency) · `.claude/skills/execute-task/SKILL.md` ·
kickoffs 843 and 844.

## 7. Scope

- **Created:** `src/design-system/mantine/patterns/MantineDashboardLineChart.tsx` ·
  `src/design-system/mantine/patterns/MantineDashboardDonut.tsx` ·
  `src/stories/patterns/mantine/DashboardLineChart.stories.tsx` · `src/stories/patterns/mantine/DashboardDonut.stories.tsx`.
- **Edited:** `package.json` · `package-lock.json` · `src/app/layout.tsx` (one import line) · `.storybook/preview.tsx`
  (one import line) · `src/design-system/mantine/theme.ts` (`boxSize.dashboardChartMinHeight` + `chartSeries` role
  and their augmentation types) · `src/design-system/mantine/patterns/index.ts` · `scripts/mantine-migration-scope.json`
  (2 entries) · `messages/{sq,en,uk,it}.json` (story strings under `storybook`) · `docs/backlog.md` (845 line).

## 8. Out of scope

Any consumer (853/855) · data queries (847/849) · `MantineDashboardCard` (843; used as-is by the consumer) · other
chart types · `@mantine/core` upgrade.

## 9. Current and required behavior

**Before.** There are no charts; `/admin` draws a Tailwind progress-bar "status breakdown" (`page.tsx:118-138`), which 853 replaces.
**After.** Two storied, enrolled chart patterns and the dependency exist. Nothing a user sees changes yet.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes of every edited file; `npm.cmd ls @mantine/core`;
   `npm.cmd view @mantine/charts versions --json` (tail) and `npm.cmd view @mantine/charts@<core version> peerDependencies`.
   Record the chosen versions.
2. **Install:** `npm.cmd install @mantine/charts@<exact core version> recharts@<peer range>`. Record the transcript
   and `git --no-optional-locks diff --stat -- package.json package-lock.json`.
3. **Stylesheet imports** (R1): exactly one new line in each of the two files, placed right after
   `@mantine/core/styles.css`.
4. **Tokens** (R2, R5) with their `MantineThemeOther` augmentation, each commented with its spec source.
5. **Patterns** per R2–R4. `'use client'`. Import from `@mantine/charts` (`LineChart`, `DonutChart`). Colours: series
   `color` strings are the theme references from `theme.other.chartSeries` (for Mantine charts, a `'blueLight.7'`
   string is a theme reference), resolved by Mantine itself. The `ColorSwatch` colour is resolved through
   `theme.colors[name][shade]` read from `useMantineTheme()` (a theme read, not a literal). Disable animation through
   the chart's own props. Keyboard: legend toggles are real buttons/checkboxes; the table toggle is a `Button` with
   `aria-expanded`.
6. **Stories** (GR-3a `CREATE`, §12): toolbar-driven, no locale/width exports, deterministic fixtures, JSDoc stating
   that the fixtures are fixtures and which consumer each state represents (ADM-10, ADM-11, AGT chart).
7. Enrol both pattern files; barrel exports.
8. **Bundle note** (performance): record the `npm run build` "First Load JS" line for `/admin` before and after. It
   should be unchanged, because nothing imports the charts yet. A change means a stray import → fix it.

## 11. Positive and negative flows

**Positive.** In `DashboardLineChart → Default`, three series over 30 days; the reviewer unticks "WhatsApp clicks", the
line disappears and the table (when open) loses that column; hovering or focusing a point shows "12 Sep 2026 ·
Recorded views · 34".

| Negative flow | Applicable | Expected |
|---|---|---|
| Whole period all zero | Yes | Empty state (title + description), no grid. |
| One day zero | Yes | Axis stays; the point sits at 0; table row shows 0. |
| All series toggled off | Yes | Plot shows no line and a short hint text (a prop); the table shows only the date column. The executor may instead prevent the last toggle from being switched off — either is acceptable; record which. |
| Loading | Yes | Skeleton block at chart min height; no axes, no digits. |
| Error | Yes | `MantineEmptyLoadingErrorState state="error"` + Retry. |
| Donut all zero | Yes | Empty text, legend not rendered. |
| Narrow `uk` | Yes | Legend wraps; donut list stacks; no overflow at 320. |
| Reduced motion | Yes | No animation in any case. |
| Authorization / data | No | Presentational. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `package.json`, when read, then `@mantine/charts` equals the installed `@mantine/core` version
  (quote `npm.cmd ls @mantine/core @mantine/charts recharts`), and `src/app/layout.tsx` and `.storybook/preview.tsx`
  each contain exactly one `@mantine/charts/styles.css` import.
- **AC2 [R2]** — Given `DashboardLineChart → Default` in the browser, when a series toggle is activated by keyboard
  (Space/Enter), then that series' `<path>` is removed from the SVG, and the toggle exposes its state
  (`aria-pressed`/`checked`). Quote the DOM before/after.
- **AC3 [R2, R3]** — Given the same story, when the table toggle is pressed, then a `<table>` with 30 body rows appears
  whose cells equal the fixture values of the visible series. Quote 3 rows against the fixture.
- **AC4 [R4]** — Given `DashboardDonut → Default`, when rendered, then the centre text equals the fixture sum, the list
  has one `<a>` per segment including the 0 segment, and each `<a>`'s `href` equals the fixture href.
- **AC5 [R5]** — Given
  `git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardLineChart.tsx src/design-system/mantine/patterns/MantineDashboardDonut.tsx`,
  when run, then it prints nothing; `check:design-tokens:strict` and `check:enrolled-tailwind` exit 0; and
  `Select-String -Path src\design-system\mantine\theme.ts -Pattern "dashboardChartMinHeight|chartSeries"` shows the
  definitions.
- **AC6 [R6]** — Given `check:story-coverage`, `check:pattern-enrolment` and the census of both files, when run, then
  they exit 0 and each root row reads `manifest:yes story:yes`.
- **AC7 [R7]** — Given `check:i18n`, when run, then it exits 0.
- **AC8 [R8]** — Given the owner matrix §13.3, when reviewed, then each tuple is accepted or returned with a concrete
  defect.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: AC5's empty grep on two new files; AC1's version equality is the pairing rule itself.`

`GR-3a STORY PREFLIGHT — MantineDashboardLineChart/MantineDashboardDonut × all states; canonical candidates: NONE (no story imports any chart); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar (Task 799 caveat); decision: CREATE; target: Patterns/Mantine/DashboardLineChart, Patterns/Mantine/DashboardDonut; rationale: new patterns, in-sprint consumers 853/855.`

`GR-3 STORY PROVEN — MantineDashboardLineChart ← src/stories/patterns/mantine/DashboardLineChart.stories.tsx; MantineDashboardDonut ← src/stories/patterns/mantine/DashboardDonut.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q3`** — new Mantine patterns + a new client dependency. No critical flow.

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task845/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd ls @mantine/core @mantine/charts recharts
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardLineChart.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardDonut.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardLineChart.tsx src/design-system/mantine/patterns/MantineDashboardDonut.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object package.json package-lock.json src/app/layout.tsx .storybook/preview.tsx src/design-system/mantine/theme.ts src/design-system/mantine/patterns/MantineDashboardLineChart.tsx src/design-system/mantine/patterns/MantineDashboardDonut.tsx
```

Expected: all exit 0 except `check:locale-leak:mantine-only` (known red, Task 836) — zero leak lines for
`patterns-mantine-dashboardlinechart` / `patterns-mantine-dashboarddonut`; quote the grep.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize the window.

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardLineChart` | Default | 1440 | en | three distinct theme colours, legend toggles, tooltip with date+label+count, table toggle, no animation |
| 2 | same | Default | 1024 | sq | readable axis labels, legend wraps if needed |
| 3 | same | Default | 768 | it | min height kept |
| 4 | same | Default | 390 | uk | plot usable; legend wraps; table scrolls **inside** its own container only |
| 5 | same | Empty / Error | 1280 | uk | empty state instead of grid; error + Retry |
| 6 | `Patterns/Mantine/DashboardDonut` | Default | 1440 / 1024 | en / sq | centre total; list rows with swatch + label + count + share; 0 segment listed |
| 7 | same | Default | 390 / 320 | uk | donut above list; no overflow |

### 13.4 Evidence the executor hands over

§13.2 transcripts · I0 version listing · AC2/AC3/AC4 DOM quotes · the First Load JS before/after lines · owner matrix.

## 14. Completion report contract

Files with before/after hashes · R1–R8 · AC1–AC8 with quotes · commands with exit codes · versions chosen and why ·
legend-control decision · GR receipts · assumptions · deviations · limitations · owner matrix. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating
git. Update the 845 line of `docs/backlog.md`; session log with Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Duplicate? | No chart exists (§3); `MantineEmptyLoadingErrorState` reused, `MantineDashboardCard` left to the consumer. |
| Owner authorization for the dependency | D78-2, quoted. |
| GR-1 / 16d | §3.2 receipt. |
| GR-2 | Coverage gate plus per-file census (AC6). |
| Hardcode | R5/AC5; two new `theme.other` roles, both spec- or palette-sourced. |
| Behaviour proof without jsdom | Stated in §3; the Story in a real browser is the proof (AC2–AC4). |
| Commands in blocks | §13.2. |
