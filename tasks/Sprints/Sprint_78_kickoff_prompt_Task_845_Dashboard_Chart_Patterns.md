# Task 845 — `@mantine/charts` enters the project; `MantineDashboardLineChart` and `MantineDashboardDonut` with text alternatives

Sprint 78 · P1 · QA profile **Q3** · Wave A · depends on **843** approved (card shell) and **844** approved (tone
map) · **Status: ✅ `APPROVED WITH NOTES` 2026-09-20 (review 3). Closed and archived — see §18 for the closing
decisions (OD-1 = B, OD-2 = B, D845-4 native tooltip, D1 exception). No further execution is owed on this task.**

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

## 16. Revision 1 — review 1 `NEEDS REVISION` (2026-09-19)

### 16.0 Precedence and re-entry

The implementation was driven far past this kickoff by in-session owner instructions (session log
`docs/sessions/2026-09-19-task845-dashboard-chart-patterns.md`, Passes 1–16): ApexCharts replaced `@mantine/charts`,
six patterns exist instead of two, and `MantineCombobox`, `MantineDashboardCard`, `theme.ts` colour scales and
`src/lib/formatters.ts` changed. **This section is now the task.** Where §1–§15 conflict with it, §16 wins; the rows
it does not touch (R7, R8, AC7, AC8, the negative-flow table in §11 except as amended in §16.2) still bind.

Re-entry mode: **`remediation`**. Start at §16.3 W1. Keep every shipped pattern, Story, message key and the two
owner-reported `MantineCombobox` fixes; do not rebuild any chart from scratch; do not reinstall `@mantine/charts` or
`recharts`. Evidence root `docs/sessions/evidence/task845/` (create it; it does not exist at review time).

### 16.1 Owner decisions recorded by this review (verbatim from the session log; the owner's commit of this file confirms them)

| ID | Owner words (as quoted in the session log, 2026-09-19) | Consequence — supersedes |
|---|---|---|
| **D845-1** | *"для коректних поведінок чартів використовуй бібліотеку ApexCharts, де вже є всі кліки, всі тултіпи, всі ховер ефекти"* (Pass 9) | Chart engine = `apexcharts` + `react-apexcharts`, loaded through `next/dynamic(…, { ssr: false })`. Supersedes **D78-2**, R1, AC1 and §10.2–§10.3. `@mantine/charts`/`recharts` must be absent from `package.json`, the lockfile's root dependencies, and every `src/` / `.storybook/` import. |
| **D845-2** | *"У Storybook мають бути всі види чартів з референсу... Задача не може бути закрита, допоки всі чарти не співпадають з референсами по всіх критеріях!"* (Pass 8) | Six patterns are in scope: `MantineDashboardLineChart`, `…BarChart`, `…Donut`, `…SemiDonut`, `…Radar`, `…RadialProgress`, each with its own Story and manifest entry. Supersedes R6's two-pattern scope and §7/§8. |
| **D845-3** | Pass 10: owner-provided reference *pinterest.com/ideas/warm-pastel-color-palette/959971831841/* replacing the saturated palette (*"дуже агресивна"*) | `theme.other.chartSeries` = the five warm-pastel scales at shade 4 (`dustyRose`, `warmSage`, `mutedLilac`, `warmGold`, `warmLatte`). Supersedes R5's proposed shade-7 set. |

### 16.2 ~~`STOP - OWNER DECISION REQUIRED`~~ — ANSWERED 2026-09-20; W7 is closed

> **OWNER DECISION, 2026-09-20 (recorded by Opus in review 3, in-session):**
>
> - **OD-1 = Option B.** The owner waives ADM-11's link list and §17.4's text alternative for these patterns. **No
>   code change.** Opus amends **853** and **855** in the same commit (drill-down from the donut and the table toggle
>   removed) — done 2026-09-20; verification below.
> - **OD-2 = Option B.** Animation is always on; the owner waives the §17.4 `prefers-reduced-motion` rule for the
>   dashboard charts. **No code change.**
>
> **W7 is therefore complete by waiver, and AC16 is met.** Verification actually run (2026-09-20):
> `grep -n -i "table toggle|donut segment|segments navigate|segment a link|segment hrefs|each segment"` over
> `Sprint_78_kickoff_prompt_Task_853_Admin_Operations_Dashboard.md` and
> `Sprint_78_kickoff_prompt_Task_855_Activity_Analytics_Integration.md` returns no requirement or AC that depends on
> the removed behaviour.

The original text of the two decisions is kept below as the record of what was decided against.

Work items W1–W6 and W8 did not depend on these. **W7 was blocked until the owner's answer was written here,
verbatim and dated, by Opus** — answered above on 2026-09-20.

**OD-1 — text alternative and drill-down (spec v3.3 §17.2 ADM-11, §17.4).** The shipped patterns have no tabular
text alternative (the data-table toggle was removed in Pass 3), the hover tooltip opens only on mouse
(`chart.events.dataPointMouseEnter`), and `MantineDashboardDonut` legend rows toggle visibility instead of linking to
the listing filter. Kickoffs **853** (`donut segment opens its drill-down target`) and **855** (`the table toggle`,
`the donut segments navigate`) depend on the removed behaviour.
- **Option A (recommended):** keep the owner's visual legend toggles; add back one keyboard-operable
  `Button` (`aria-expanded`) per Line/Bar/Radar pattern that reveals a Mantine `Table` of the visible series (the
  original R3), and give `MantineDashboardDonut` an optional `href` per segment rendered as a link list/table under
  the ring (the original R4 list, collapsed behind the same toggle). Verification: AC3/AC4 as originally written,
  re-run against the ApexCharts DOM.
- **Option B:** the owner waives ADM-11's link list and §17.4's text alternative for these patterns. Opus then
  amends 853 and 855 (drill-down from the donut and the table toggle removed) in the same commit that records the
  waiver. Verification: the 853/855 kickoffs no longer contain a requirement or AC that uses the table toggle or
  donut-segment navigation.

**OD-2 — motion (spec v3.3 §17.4, "respect `prefers-reduced-motion`").** Every pattern sets
`animations: { enabled: true, speed: 400 }` unconditionally (owner, Pass 7: animation mandatory).
- **Option A (recommended):** animation stays on by default and is disabled when `useReducedMotion()` from
  `@mantine/hooks` returns `true`. Verification: Playwright with `reducedMotion: 'reduce'` shows the ApexCharts
  `chart.animations.enabled` option `false` (quote the options object logged from the Story).
- **Option B:** animation always on; the owner waives the §17.4 motion rule for dashboards. No code change.

### 16.3 Work items (map to review-1 findings F1–F8)

- **W1 — F2 hardcoded visual values (GR-0).** Remove every raw visual number/colour from the six pattern files and
  move it to one new role `theme.other.dashboardChart` (with its `MantineThemeOther` augmentation), each key
  commented with its provenance (TailAdmin/ApexCharts measurement already recorded in the session log, or the spec
  row). It must cover at least: donut size (200), semi-donut size (220), radial size (180), radar size (100), bar
  radius (4), donut segment border radius (8) and spacing (3), segment expand offset (10), tooltip offset (12),
  primary/secondary line stroke width (2.5/1.5), radar and semi-donut stroke width (2/3), primary/secondary gradient
  opacity (0.35/0.16), inactive-legend swatch opacity (0.35), hover marker size (5), animation speed (400), default
  shade (6), the shade-collision step (2) and the radar nearest-marker distance (20). Then:
  - delete both `design-tokens-allow` markers (`MantineDashboardRadar.tsx`, `MantineDashboardSemiDonut.tsx`);
  - replace `colors: ['white']` (`MantineDashboardSemiDonut.tsx`) with a theme value (`theme.white`);
  - replace every `style={{ display: 'flex', … }}` wrapper with Mantine `Center`/`Flex`/`Stack` props, and every
    `style={{ opacity: … }}` / `style={{ pointerEvents: 'none' }}` / `style={{ flexShrink: 0 }}` with the component's
    own prop or a `styles` entry reading the new role;
  - replace `theme.other!.iconSize!.compact! / 2` with a named `dashboardChart.tooltipSwatchSize` token.
- **W2 — F3 clones.** `resolveThemeColor` exists 6×, `LegendToggle` 5×, the tooltip `styles` object 5×. Create:
  - `src/design-system/mantine/patterns/dashboardChartTheme.ts` (no JSX) exporting `resolveThemeColor(theme, ref)`
    and `dashboardChartTooltipStyles(theme)`;
  - `src/design-system/mantine/patterns/MantineDashboardChartLegend.tsx` — the one legend (row/column layout prop,
    the `Button variant="subtle"` toggle with `aria-pressed`), enrolled in `scripts/mantine-migration-scope.json`,
    exported from the barrel, with its own Story `src/stories/patterns/mantine/DashboardChartLegend.stories.tsx`
    (`Patterns/Mantine/DashboardChartLegend`: all visible; one hidden — wrapping is checked by resizing the window on
    those states, never through a width-named export; see §17.3 X4).
  All six patterns consume these; no local copy survives (AC11).
- **W3 — F4 shared components changed outside the original scope.** `MantineCombobox.tsx` (outer `Box w`,
  `rightSectionPointerEvents="none"`) and `MantineDashboardCard.tsx` (`scopeLabel` under the title) are kept and are
  now in scope. Required:
  - extend `src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` with two assertions: the
    component's outermost element carries the resolved width for the default, a fixed `triggerWidth`, and
    `triggerWidth="100%"`; and the right section's `pointer-events` is `none` (clause 15 — the consumers include
    P0 auth `AuthSheet.tsx`, `PhoneField.tsx` and `RangeDatePicker.tsx`, all in `docs/critical-flow-registry.md`).
    A planted revert of either line must make the test fail — record both arms with `git hash-object` witnesses,
    reading and writing the planted file through Node, never `Get-Content -Raw`;
  - correct the now-false comment at `src/modules/listings/components/ListingsFilterBar.tsx:94-101` (it states the
    combobox's outer wrapper "carries no width" and that "no combobox-file edit" was needed); do not change its code;
  - update `src/stories/patterns/mantine/DashboardCard.stories.tsx` only if a state no longer demonstrates the
    under-title `scopeLabel`;
  - rendered evidence at 360 and 1440 px for the consumer Stories listed in §16.7 rows 9–10.
- **W4 — F5 evidence.** Run §16.6 in one pass and retain its full transcript as
  `docs/sessions/evidence/task845/final-gate.log`, including `git hash-object` of every changed file. Bundle note:
  from that build, quote the `/admin` First Load JS line and prove no ApexCharts chunk is reachable from `/admin`
  (search the build's app manifest for `apexcharts` under the `/admin` page entries → no hit; quote the command).
- **W5 — F7 records.** In the session log: correct the R1 row (it says `@mantine/charts` "Holds" — false since
  Pass 9); add `MantineDashboardCard.tsx`, `MantineCombobox.tsx`, `ListingsFilterBar.tsx` (W3 comment) and all five
  new `formatters.ts` functions to Files Changed; drop `src/app/layout.tsx` / `.storybook/preview.tsx` (zero net
  diff); add every file W1–W8 touches. Delete the untracked repository-root `.playwright-mcp/` directory (135 tool
  artefacts) and the 27 untracked repository-root `*.png` screenshots (`barchart-*.png`, `donut-*.png`,
  `linechart-*.png`, `radar-*.png`, `semidonut-*.png`); any screenshot worth keeping moves under the evidence root
  first. `git --no-optional-locks status --short` must then show no untracked path outside the §16.4 write set.
- **W6 — F8 formatters.** In `src/lib/formatters.ts` the five new functions receive `YYYY-MM-DD` strings (parsed as
  UTC midnight); `formatWeekdayShort` uses `getUTCDay()` while the other four use local `getDate()`/`getMonth()`, so
  weekday and day disagree for any viewer west of UTC. Use UTC getters in all five. Add cases to
  `src/lib/__tests__/formatters.test.ts` for each function × 4 locales plus one run under `TZ=America/New_York`.
- **W7 — OD-1/OD-2 outcome** (blocked until §16.2 is answered): implement the chosen option exactly as written there.
- **W8 — census.** Re-run the per-file census for all seven pattern files and the changed-surface census; emit one
  `GR-1 CENSUS COMPLETE` receipt per file and `GR-3 STORY PROVEN` for each of the seven patterns.

### 16.4 Revised write set

Created: `dashboardChartTheme.ts`, `MantineDashboardChartLegend.tsx`, `DashboardChartLegend.stories.tsx`, the
evidence root. Edited: the six `MantineDashboard{LineChart,BarChart,Donut,SemiDonut,Radar,RadialProgress}.tsx`, their
six Stories only where W1/W2/W7 require, `theme.ts`, `patterns/index.ts`, `scripts/mantine-migration-scope.json`,
`MantineCombobox.smoke.test.tsx`, `ListingsFilterBar.tsx` (comment only), `DashboardCard.stories.tsx` (only if W3
requires), `src/lib/formatters.ts`, `src/lib/__tests__/formatters.test.ts`, `messages/{sq,en,uk,it}.json` (only for
new W2/W7 strings), the session log, the 845 row of `docs/backlog.md` (one concise line). Nothing else.

### 16.5 Revised acceptance criteria (replace AC1–AC6; AC7–AC8 remain)

- **AC9 [D845-1]** — `npm.cmd ls apexcharts react-apexcharts @mantine/charts recharts` lists the first two and not
  the last two; `git grep -n -E "@mantine/charts|from 'recharts'" -- src .storybook` → no hit.
- **AC10 [W1]** — the §16.6 hardcode `git grep` prints no line (a remaining hit needs a one-line reason in the
  session log naming why it is not a visual value); `Select-String -Path src\design-system\mantine\theme.ts -Pattern
  "dashboardChart:"` shows the role.
- **AC11 [W2]** — `git grep -n -E "function (resolveThemeColor|LegendToggle)" -- src` prints exactly one
  `resolveThemeColor` (in `dashboardChartTheme.ts`) and no `LegendToggle`; each of the six patterns imports
  `MantineDashboardChartLegend` or has no legend (RadialProgress).
- **AC12 [W3]** — the extended `MantineCombobox.smoke.test.tsx` passes, and each planted revert (outer `Box w`
  removed; `rightSectionPointerEvents` removed) makes it fail — both transcripts retained.
- **AC13 [W3]** — the four consumer smoke files (`MantineCombobox`, `PhoneField`, `filtersRangeDatePicker`,
  `listingsMigratedControls`) pass.
- **AC14 [W4]** — `docs/sessions/evidence/task845/final-gate.log` holds §16.6 with every exit code, the `/admin`
  First Load JS line, and the no-ApexCharts-under-`/admin` proof.
- **AC15 [W6]** — `formatters.test.ts` passes, including the `America/New_York` case, where
  `formatWeekdayShort('2026-09-19', 'en')` and `formatShortDate('2026-09-19', 'en')` both describe Saturday
  19 September.
- **AC16 [W7]** — the §16.2 verification line of the chosen option for OD-1 and for OD-2.
- **AC17 [W8]** — per-file census rows read `manifest:yes story:yes` for all seven patterns; the changed-surface
  census exits 0.

`GR-4 AC AUDIT — 9 new criteria (AC9–AC17); each states an observable property; absolutes: AC10/AC11 greps are
scoped to named files and AC10 admits a documented exception line.`

### 16.6 Final gate block (replaces §13.2)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd ls apexcharts react-apexcharts @mantine/charts recharts
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
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardBarChart.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardDonut.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardSemiDonut.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardRadar.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardRadialProgress.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardChartLegend.tsx
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx src/components/shared/__tests__/PhoneField.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/modules/listings/components/__tests__/listingsMigratedControls.smoke.test.tsx src/lib/__tests__/formatters.test.ts
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "design-tokens-allow|style=\{\{|'white'|= [0-9]+(\.[0-9]+)?$|: [0-9]+\.[0-9]+" -- src/design-system/mantine/patterns/MantineDashboard*.tsx src/design-system/mantine/patterns/dashboardChartTheme.ts
git --no-optional-locks status --short
git --no-optional-locks diff --stat
git --no-optional-locks hash-object package.json package-lock.json src/design-system/mantine/theme.ts src/design-system/mantine/patterns/MantineCombobox.tsx src/design-system/mantine/patterns/MantineDashboardCard.tsx src/lib/formatters.ts src/design-system/mantine/patterns/dashboardChartTheme.ts src/design-system/mantine/patterns/MantineDashboardChartLegend.tsx src/design-system/mantine/patterns/MantineDashboardLineChart.tsx src/design-system/mantine/patterns/MantineDashboardBarChart.tsx src/design-system/mantine/patterns/MantineDashboardDonut.tsx src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx src/design-system/mantine/patterns/MantineDashboardRadar.tsx src/design-system/mantine/patterns/MantineDashboardRadialProgress.tsx
```

Expected: every command exits 0 except `check:locale-leak:mantine-only` (known red, Task 836 — quote zero leak lines
for the seven `patterns-mantine-dashboard*` story IDs) and the hardcode `git grep` (exit 1, no output). The
`TZ=America/New_York` case of AC15 runs inside `formatters.test.ts` (set `process.env.TZ` in that describe block, or a
second `vitest` invocation with `$env:TZ = "America/New_York"` — record which).

### 16.7 Owner visual review (replaces §13.3) — `OWNER VISUAL QA REQUIRED`

Use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize the window.

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardLineChart` | Default (week, month, year) | 1440 / 360 | en / uk | pastel colours, legend toggles, tooltip, axis labels, period filter full-width at 360 |
| 2 | `Patterns/Mantine/DashboardBarChart` | Default | 1440 / 360 | sq / uk | rounding only on the stack top, tooltip, legend |
| 3 | `Patterns/Mantine/DashboardDonut` | Default, Empty, Error | 1440 / 360 | en / uk | centre total, legend column aligned with the period control, tooltip not clipped, no two segments share a visible colour |
| 4 | `Patterns/Mantine/DashboardSemiDonut` | Default | 1440 / 360 | it / uk | arc, gaps, legend reachable |
| 5 | `Patterns/Mantine/DashboardRadar` | Default | 1440 / 320 | en / uk | labels not clipped, legend visible at 320, tooltip |
| 6 | `Patterns/Mantine/DashboardRadialProgress` | Default, Empty, Error | 1440 / 360 | sq | ring proportion |
| 7 | `Patterns/Mantine/DashboardChartLegend` | all states | 1440 / 320 | uk | one legend, wraps |
| 8 | `Patterns/Mantine/DashboardCard` | every state | 1440 / 360 | en / uk | `scopeLabel` under the title (843 change) |
| 9 | `Mantine/Primitives/Combobox`, `…/PhoneField`, `…/RangeDatePicker`, `…/FilterControls`, `…/LocationComboboxSubPanel` | Default | 1440 / 360 | en / uk | trigger widths unchanged except where full-width at 360 is intended; chevron click opens |
| 10 | `Patterns/Mantine/ListingsFilterBar`, `Patterns/Mantine/ListingsSortBar` | Default | 1440 / 360 | uk | no layout shift vs `main` |
| 11 | any OD-1 Option A table/link list | open | 1440 / 360 | uk | table scrolls inside its own container |

### 16.8 Completion

Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when W1–W8 and AC9–AC17 hold with retained evidence;
`PARTIALLY IMPLEMENTED` if OD-1/OD-2 are still unanswered. Update the 845 backlog row as **one line**. No mutating git.

## 17. Revision 2 — review 2 `NEEDS REVISION` (2026-09-19)

### 17.0 Precedence and re-entry

Review 2 inspected the Revision 1 diff, `docs/sessions/evidence/task845/final-gate.log` and the session log's
"Revision 1" sections. W2 (legend/helpers), W6 (formatters, TZ case re-checked natively) and W8 (census re-run by the
reviewer: all seven roots `manifest:yes story:yes className:0`) are accepted and must not be redone. Everything else
in §16 still binds, and §17 overrides it where they conflict.

Re-entry mode: **`remediation`**. Start at §17.3 X1. Do not rebuild any chart. Do not re-plant the `MantineCombobox`
test arms (W3's planted-revert proof is accepted). The Revision 1 log `final-gate.log` stays as it is, as the
superseded artifact. Put the new pass in `final-gate-rev2.log` (§17.5) and never overwrite the old one.

### 17.1 Findings this revision closes (review 2)

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| F9 | P2 | W1 left raw visual values in the pattern files: the executor kept them because they were "not itemized", but W1 says *every* such value, and its list starts "at least". | `MantineDashboardDonut.tsx:43` `DONUT_HOLE_SIZE = '62%'`; `MantineDashboardSemiDonut.tsx:34` `'60%'`; `MantineDashboardRadialProgress.tsx:33` `HOLLOW_SIZE = '56%'`; `MantineDashboardBarChart.tsx:178` `columnWidth: '40%'`; `MantineDashboardLineChart.tsx:190` `stops: [0, 90, 100]`. The §16.6 grep cannot see a `'NN%'` string or an array, which is how these slipped through. |
| F10 | P2 | GR-0 clones that review 1 missed (the miss was the orchestrator's). The loading/error/empty branch block is copied into 5 patterns. The tooltip body (a title plus one swatch row per series) is copied into 5 patterns. | 14 `Skeleton`/`MantineEmptyLoadingErrorState` render sites across Line/Bar/Donut/Radar/RadialProgress. `ColorSwatch … size={…tooltipSwatchSize}` rows in Line:238, Bar:225, Radar:238, Donut:261, SemiDonut:139. |
| F11 | P1 | W3's last bullet was not done. There is no rendered evidence at 360/1440 for the `MantineCombobox` consumers (§16.7 rows 9–10). The outer-`Box` width change reaches every consumer, including P0 auth `AuthSheet`/`PhoneField`. | The session log's Revision 1 section and the evidence root hold no such capture. |
| F12 | P1 | AC14 is not met, although the session log says it is. `final-gate.log` has **no** `npm run build` transcript, no `/admin` First Load JS line, no ApexCharts-reachability command, and no `check:file-integrity`, `check:mojibake`, hardcode grep, `git status`, `diff --stat` or `hash-object` output. The session log (Revision 1 → "§16.6 final gate") says all of these are "recorded in `final-gate.log`". | The log's section headers end at `check:locale-leak` plus a partial "FINAL re-verification" (typecheck, stories, design-tokens). |
| F13 | P2 | 11 locale-leak lines on Task 845's own Stories. The executor called them "pre-existing", which is false: the keys are new in this task's uncommitted diff (`git show HEAD:messages/sq.json` has none of them). §16.6 required zero leak lines for the `patterns-mantine-dashboard*` IDs. | `RadialProgress` Default/Empty `[sq] "Total"`; `SemiDonut` ×3 states `[sq] "Mobile"`, `[it] "Mobile"`, `[it] "Social Media"`. |
| F14 | P3 | AC9's grep is not empty. There is a stale `@mantine/charts`/D78-2 comment in `theme.ts`. | `src/design-system/mantine/theme.ts:723` (the `chartSeries` value comment), plus the `// Task 845 (D78-2, …)` augmentation comment above `chartSeries`. |
| F15 | P3 | W5 was only partly done. The Files Changed table still lists `src/app/layout.tsx` / `.storybook/preview.tsx`, and `MantineDashboardCard.tsx` appears in no Files Changed table. | Session log, Files Changed rows for Pass 1 and Pass 9. `grep` for `MantineDashboardCard.tsx` finds only the prose at lines 410 and 583. |
| F16 | P2 | The owner's Story rule (no width-named exports, breakpoints come from the toolbar) is broken. `DashboardChartLegend.stories.tsx` exports `WrapAt320`, which renders exactly what `AllVisible` renders. The cause was §16.3 W2's wording "wrap at 320", an orchestrator defect now corrected in place. | `src/stories/patterns/mantine/DashboardChartLegend.stories.tsx:77`. |

### 17.2 Owner decisions

No new decision. **OD-1 and OD-2 (§16.2) are still unanswered**, so W7 stays blocked exactly as §16.2 states. Do not
implement either option until Opus has written the owner's answer into §16.2, verbatim and dated.

### 17.3 Work items

- **X1 — F9.** Add five keys to `theme.other.dashboardChart`, each with its `MantineThemeOther` type and a provenance
  comment copied from the file comment it replaces: `donutHoleSize: '62%'`, `semiDonutHoleSize: '60%'`,
  `radialHollowSize: '56%'`, `barColumnWidth: '40%'`, `lineGradientStops: [0, 90, 100]` (typed `number[]`). Delete the
  three module constants and the two inline literals, and read the keys instead. The following literals stay inline
  as structural, non-visual switches or definitions, and the session log gives each a one-line reason: `startAngle:
  -90` / `endAngle: 90` (the definition of a semicircle), `opacityTo: 0`, `shadeIntensity: 1`, `strokeDashArray: 0`,
  `rotate: 0`, and the colour-tuple bounds `0`/`9`. Do not keep any other raw number, percentage or colour string.
- **X2 — F10.** Create two shared pattern files, each enrolled in `scripts/mantine-migration-scope.json`,
  barrel-exported, and given its own Story (GR-3a: `CREATE`; the reviewer found no candidate, since no Story imports a
  chart state frame or a chart tooltip body):
  - `src/design-system/mantine/patterns/MantineDashboardChartStateFrame.tsx`. Props: `state`, `emptyTitle?`,
    `emptyDescription?`, `errorText?`, `retryLabel?`, `onRetry?`, `loadingAriaLabel?`, `children`. It renders the exact
    loading (`Flex` + `Skeleton`), error (`Center` + `MantineEmptyLoadingErrorState` + Retry `Button`) and empty
    (`Center` + `MantineEmptyLoadingErrorState`) blocks the five patterns render today, at
    `boxSize.dashboardChartMinHeight`, and renders `children` when `state === 'ready'`. Move `DashboardChartState` into
    this file and re-export it from `MantineDashboardLineChart.tsx` so existing imports keep compiling. Story
    `src/stories/patterns/mantine/DashboardChartStateFrame.stories.tsx`, title
    `Patterns/Mantine/DashboardChartStateFrame`, with the states `Ready`, `Loading`, `Empty` and `Error`.
  - `src/design-system/mantine/patterns/MantineDashboardChartTooltipContent.tsx`. Props: `title?: string` and
    `rows: { key, label, value: string, color }[]`. It renders the title `Text` and one `ColorSwatch` + label/value row
    per entry, exactly as Line/Bar/Radar render them today; Donut/SemiDonut pass one row and no title. Story
    `src/stories/patterns/mantine/DashboardChartTooltipContent.stories.tsx`, title
    `Patterns/Mantine/DashboardChartTooltipContent`, with the states `MultiSeries` and `SingleRow`. It renders the
    content statically, with no hover.

  Every pattern that has a `state` prop must render through the frame, and all five tooltip sites must render through
  the content component. No `Skeleton`, `MantineEmptyLoadingErrorState` or tooltip `ColorSwatch` row may remain in
  the six chart files (AC19). The rendered output must stay the same, and the owner matrix checks this.
- **X3 — F11.** Capture rendered consumer evidence with a Playwright script saved as
  `docs/sessions/evidence/task845/combobox-consumers.mjs`, run against `storybook-static`.
  - Stories: every Story ID under `Mantine/Primitives/Combobox`, `…/PhoneField`, `…/RangeDatePicker`,
    `…/FilterControls`, `…/LocationComboboxSubPanel`, `Patterns/Mantine/ListingsFilterBar` and
    `Patterns/Mantine/ListingsSortBar`, resolved from `storybook-static/index.json` (list them in the output).
  - Matrix: widths 360 and 1440; locales `en` and `uk`.
  - Each cell records: the `getBoundingClientRect().width` of every `.mantine-TextInput-root` and of its parent
    element; whether `document.elementFromPoint` at the centre of each chevron (the right section) resolves to the
    `<input>` or to a node inside the `.mantine-TextInput-wrapper` other than the `<svg>`; and a screenshot.
  - Output: `combobox-consumers.json` plus PNGs under `docs/sessions/evidence/task845/combobox/`.
  - **Before arm:** write `git show HEAD:src/design-system/mantine/patterns/MantineCombobox.tsx` over the file through
    Node (`writeFileSync`, never `Get-Content -Raw`), with a `git hash-object` witness before the plant, after the
    plant, and after the restore. Rebuild Storybook, capture, restore, rebuild, capture again.
  - The JSON diffs both arms per cell. Every width delta at 360 is listed by Story ID for owner rows 9–10. Any delta
    at 1440 is a finding: report it and do not explain it away.
- **X4 — F16.** Delete the `WrapAt320` export. The owner checks wrapping on `AllVisible`/`OneHidden` by resizing the
  window (§16.7 row 7).
- **X5 — F13.** Replace these message values; en and uk stay unchanged:
  - `sq` `storybook.mantine.dashboard_radial_label`: `"Total"` → `"Gjithsej"`;
  - `sq` `dashboard_semi_donut_mobile`: `"Mobile"` → `"Celular"`;
  - `it` `dashboard_semi_donut_mobile`: `"Mobile"` → `"Dispositivi mobili"`;
  - `it` `dashboard_semi_donut_social`: `"Social Media"` → `"Reti sociali"`.

  Use Node UTF-8 I/O and keep key parity. If a word still leaks, report it and do not add an allowlist entry.
  `DashboardWorkList`'s `Elira Hoxha` (Task 843, committed) is out of scope.
- **X6 — F14.** Rewrite the two `theme.ts` comments so they name D845-1/ApexCharts and resolution through
  `resolveThemeColor`. No code change.
- **X7 — F15.** In the session log, strike the two `layout.tsx`/`preview.tsx` rows (net zero diff) and add a
  `MantineDashboardCard.tsx` row (header `Group` → `Stack gap="micro"`, `scopeLabel` doc comment, Pass 10). Add a
  "Revision 2" section and a Files Changed table covering X1–X8. Mark `final-gate.log` as superseded by
  `final-gate-rev2.log`.
- **X8 — gate.** Run §17.5 once, after X1–X7.

### 17.4 Revised write set (in addition to §16.4)

Created: `MantineDashboardChartStateFrame.tsx`, `MantineDashboardChartTooltipContent.tsx`, their two Stories,
`docs/sessions/evidence/task845/{combobox-consumers.mjs,combobox-consumers.json,combobox/*.png,final-gate-rev2.log}`.
Edited: the six chart patterns, `theme.ts`, `patterns/index.ts`, `scripts/mantine-migration-scope.json`,
`DashboardChartLegend.stories.tsx` (X4 only), `messages/sq.json` and `messages/it.json` (X5 only), the session log,
and the 845 row of `docs/backlog.md`. `MantineCombobox.tsx` is edited only inside the X3 plant and must end on hash
`1a64070300181bea245655a271f84fb654d4517a`.

### 17.5 Final gate block (replaces §16.6)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Start-Transcript -Path docs\sessions\evidence\task845\final-gate-rev2.log
node.exe -p "process.platform + ' ' + process.version"
npm.cmd ls apexcharts react-apexcharts @mantine/charts recharts; "EXIT=$LASTEXITCODE"
npm.cmd run typecheck; "EXIT=$LASTEXITCODE"
npm.cmd run lint; "EXIT=$LASTEXITCODE"
npm.cmd run check:i18n; "EXIT=$LASTEXITCODE"
npm.cmd run check:stories; "EXIT=$LASTEXITCODE"
npm.cmd run check:story-coverage; "EXIT=$LASTEXITCODE"
npm.cmd run check:pattern-enrolment; "EXIT=$LASTEXITCODE"
npm.cmd run check:design-tokens:strict; "EXIT=$LASTEXITCODE"
npm.cmd run check:enrolled-tailwind; "EXIT=$LASTEXITCODE"
npm.cmd run check:rendered-scope; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census-changed.mjs --base HEAD; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardLineChart.tsx; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardBarChart.tsx; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardDonut.tsx; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardSemiDonut.tsx; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardRadar.tsx; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardRadialProgress.tsx; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardChartLegend.tsx; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardChartStateFrame.tsx; "EXIT=$LASTEXITCODE"
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardChartTooltipContent.tsx; "EXIT=$LASTEXITCODE"
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx src/components/shared/__tests__/PhoneField.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/modules/listings/components/__tests__/listingsMigratedControls.smoke.test.tsx src/lib/__tests__/formatters.test.ts; "EXIT=$LASTEXITCODE"
npm.cmd run build-storybook; "EXIT=$LASTEXITCODE"
npm.cmd run check:locale-leak:mantine-only; "EXIT=$LASTEXITCODE"
npm.cmd run build; "EXIT=$LASTEXITCODE"
node.exe -e "const m=require('./.next/app-build-manifest.json').pages['/admin/page'];const fs=require('fs');let h=0;for(const f of m){if(/apexcharts|ApexCharts/.test(fs.readFileSync('.next/'+f,'utf8')))h++}console.log('/admin/page chunks',m.length,'apexcharts hits',h)"; "EXIT=$LASTEXITCODE"
npm.cmd run check:file-integrity; "EXIT=$LASTEXITCODE"
npm.cmd run check:mojibake; "EXIT=$LASTEXITCODE"
git --no-optional-locks grep -n -E "design-tokens-allow|style=\{\{|'white'|= [0-9]+(\.[0-9]+)?$|: [0-9]+\.[0-9]+|'[0-9]+(\.[0-9]+)?%'|\[[0-9]+, [0-9]+" -- src/design-system/mantine/patterns/MantineDashboardLineChart.tsx src/design-system/mantine/patterns/MantineDashboardBarChart.tsx src/design-system/mantine/patterns/MantineDashboardDonut.tsx src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx src/design-system/mantine/patterns/MantineDashboardRadar.tsx src/design-system/mantine/patterns/MantineDashboardRadialProgress.tsx src/design-system/mantine/patterns/MantineDashboardChartLegend.tsx src/design-system/mantine/patterns/MantineDashboardChartStateFrame.tsx src/design-system/mantine/patterns/MantineDashboardChartTooltipContent.tsx src/design-system/mantine/patterns/dashboardChartTheme.ts; "EXIT=$LASTEXITCODE"
git --no-optional-locks grep -n -E "<Skeleton|<MantineEmptyLoadingErrorState|tooltipSwatchSize" -- src/design-system/mantine/patterns/MantineDashboardLineChart.tsx src/design-system/mantine/patterns/MantineDashboardBarChart.tsx src/design-system/mantine/patterns/MantineDashboardDonut.tsx src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx src/design-system/mantine/patterns/MantineDashboardRadar.tsx src/design-system/mantine/patterns/MantineDashboardRadialProgress.tsx; "EXIT=$LASTEXITCODE"
git --no-optional-locks grep -n -E "@mantine/charts|from 'recharts'" -- src .storybook; "EXIT=$LASTEXITCODE"
git --no-optional-locks status --short
git --no-optional-locks diff --stat
git --no-optional-locks hash-object package.json package-lock.json messages/sq.json messages/it.json src/design-system/mantine/theme.ts src/design-system/mantine/patterns/MantineCombobox.tsx src/design-system/mantine/patterns/MantineDashboardCard.tsx src/lib/formatters.ts src/design-system/mantine/patterns/dashboardChartTheme.ts src/design-system/mantine/patterns/MantineDashboardChartLegend.tsx src/design-system/mantine/patterns/MantineDashboardChartStateFrame.tsx src/design-system/mantine/patterns/MantineDashboardChartTooltipContent.tsx src/design-system/mantine/patterns/MantineDashboardLineChart.tsx src/design-system/mantine/patterns/MantineDashboardBarChart.tsx src/design-system/mantine/patterns/MantineDashboardDonut.tsx src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx src/design-system/mantine/patterns/MantineDashboardRadar.tsx src/design-system/mantine/patterns/MantineDashboardRadialProgress.tsx
Stop-Transcript
```

Expected:
- Every `EXIT=` line reads 0, with these exceptions: `check:locale-leak:mantine-only` (known red, Task 836) and the
  last three `git grep` lines, which each exit 1 with no output.
- For locale-leak, quote the report lines for every `Patterns/Mantine/Dashboard*` Story ID from Task 845 (Line, Bar,
  Donut, SemiDonut, Radar, RadialProgress, ChartLegend, ChartStateFrame, ChartTooltipContent). The expected count is
  zero.
- The `/admin` line reads `apexcharts hits 0`. Quote the build's `/admin` First Load JS row from the same transcript.

### 17.6 Acceptance criteria (added; AC9, AC11–AC13, AC15, AC17 stay accepted; AC10, AC14, AC16 still bind)

- **AC18 [X1]** — The first §17.5 `git grep` prints nothing. `Select-String -Path src\design-system\mantine\theme.ts
  -Pattern "donutHoleSize|semiDonutHoleSize|radialHollowSize|barColumnWidth|lineGradientStops"` shows the definitions
  and their types.
- **AC19 [X2]** — The second §17.5 `git grep` prints nothing. Both new files have census rows reading
  `manifest:yes story:yes className:0`. `GR-3 STORY PROVEN` is recorded for both.
- **AC20 [X3]** — `combobox-consumers.json` covers every resolved Story ID × {360, 1440} × {en, uk} in both arms. The
  `hash-object` witnesses show the plant restored to `1a64070300181bea245655a271f84fb654d4517a`. The 1440 width
  deltas are listed; each is either zero or reported as a finding.
- **AC21 [X4]** — `Select-String -Path src\stories\patterns\mantine\DashboardChartLegend.stories.tsx -Pattern
  "WrapAt320"` finds no match.
- **AC22 [X5]** — The locale-leak report lists zero lines under any Task 845 `Patterns/Mantine/Dashboard*` Story ID.
- **AC23 [X6, X7, X8]** — The third §17.5 `git grep` prints nothing. The session log's Files Changed tables match
  `git status --short` path for path. `final-gate-rev2.log` holds every `EXIT=` line, the `/admin` First Load JS row
  and the ApexCharts line.

`GR-4 AC AUDIT — 6 new criteria (AC18–AC23); each states an observable property; absolutes: the three git-grep
criteria are scoped to named files, with the structural literals of X1 excluded by construction; AC22 is scoped to
this task's own Story IDs.`

### 17.7 Completion

Report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when X1–X8 and W7 are complete and AC9–AC23 hold with retained
evidence. Report `PARTIALLY IMPLEMENTED` when X1–X8 are complete and OD-1/OD-2 are still open. The owner matrix
(§16.7) additionally gains rows for `Patterns/Mantine/DashboardChartStateFrame` and `…/DashboardChartTooltipContent`
(every state, 1440/360, en/uk). Update the 845 backlog row as **one line**. No mutating git.

## 18. Review 3 — `APPROVED WITH NOTES` (2026-09-20). Closing decisions

§18 supersedes every conflicting line in §1–§17. The task is closed; nothing below is an instruction to execute.

### 18.1 Owner decisions recorded at closure

| ID | Owner words / choice (2026-09-19 – 2026-09-20, in-session) | Consequence — supersedes |
|---|---|---|
| **D845-4** | *"нативний tooltip apexcharts має правильну поведінку"* — the owner rejected the `Tooltip.Floating` wrapper of Pass 15/16 and required ApexCharts' own tooltip. | Chart tooltips are the library's native tooltip; the patterns feed it text and the theme font only. **Supersedes the second half of §17.3 X2**: `MantineDashboardChartTooltipContent.tsx` and its Story were deleted and must never be re-created; **AC19's tooltip clause is void** (its `tooltipSwatchSize` grep now passes trivially). The **state-frame half of X2 stands and is verified.** The clipping the owner saw is fixed by `useApexTooltipMirror.ts` (a hook, not a visual component: it only slides ApexCharts' own element back inside the viewport and the clipping card) plus a responsive radar box. §16.7 loses its `DashboardChartTooltipContent` rows. |
| **OD-1** | **Option B** (see §16.2) | No code change. 853 and 855 amended 2026-09-20 in the same commit. |
| **OD-2** | **Option B** (see §16.2) | No code change. Animation stays unconditionally on. |
| **Visual** | *"Візуально все ок в сторісах"* (2026-09-20), after *"я візуально підтверджую, що tooltip тепер не обрізається під час hover ефекту"* (2026-09-19) | The §16.7 owner visual matrix is **accepted**. AC8 closed. |

### 18.2 D1 — the `'NN%'` grep exception (AC18 narrowed)

AC18's grep matches two lines that are **not** visual values:
`MantineDashboardChartLegend.tsx:74` `w={{ base: '100%', sm: columnWidth }}` and
`MantineDashboardRadar.tsx:178` `w={{ base: '100%', sm: theme.other.boxSize.dashboardChartMinHeight }}`.
Both are Mantine's own responsive "fill the row below `sm`" idiom, which GR-0 permits; the regex cannot distinguish
`'100%'` (a layout instruction) from `'62%'` (a measured visual ratio). **Decision (Opus, 2026-09-20): accepted as a
standing exception, not a defect.** Any future task reusing this grep excludes the exact literal `'100%'`; every other
percentage in these files remains forbidden and must be a `theme.other.dashboardChart` key.

### 18.3 Notes carried out of this task (no action owed)

- `/admin` First Load JS is **433 kB** vs 432 kB in Revision 1. `apexcharts hits 0` across all 20 `/admin/page`
  chunks (`final-gate-rev2.log`), so no chart code reaches the route; the ~1 kB is unattributed and most plausibly
  the enlarged `theme.other` object. Not a defect; re-measure in **853**, which is the first real chart consumer.
- `MantineDashboardRadar.tsx:178` uses `boxSize.dashboardChartMinHeight` as a **width** cap. It is the right number
  (a square plot box) but a height-named token; if 853/855 need a second value, give it its own key.
- `MantineDashboardRadialProgress` maps `state="empty"` to the frame's `ready` (documented at its `:66`): a radial
  bar's empty shape is `value={0}`, which renders a correct empty ring. Intentional, and it preserves the
  pre-X2 rendered output that X2 required be unchanged.
- The X3 plant-and-restore incident (POSIX paths passed to Node `fs` on Windows) is recorded in
  `combobox-plant-witness.log`. The plant itself took effect (witness 2 = the HEAD blob), the before-arm capture is
  therefore valid, and the reconstruction is proven by witness 4 = `1a64070300181bea245655a271f84fb654d4517a`, which
  the reviewer re-measured against the live working tree at review time. This is the `Get-Content -Raw` family of
  failure in a new form: **the witness is what caught it, which is exactly why it is mandatory.**
