# Task 889 — canonical dashboard patterns for the reference-driven dashboards: a sparkline, a StatCard chart slot and accent variant, and horizontal/grouped bars

Sprint 78 · P1 · QA profile **Q3** · Wave D (D78-9) · depends on **845** (archived) · blocks **890** and **891** ·
**Status: 🔁 NEEDS REVISION (review 3, 2026-09-27, owner returned O889-1 rows 1 and 3) — execute §18 (revision 2)**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) → **D78-9** (owner,
2026-09-27): charts on both dashboards, composition from the owner's references, colours from the theme (D78-5 stands).

## 1. Mode and task type

`IMPLEMENTATION` — pattern work only: one new canonical pattern and three extensions of existing canonical patterns,
each with its own Story. No route or consumer changes; 890 and 891 consume these. Bundles: **UI / Current Mantine
path** + **Storybook / Visual Proof**.

## 2. Objective

890 and 891 need four visual contracts that the canonical library does not have yet. Each one is taken from the
owner's references:

1. **`MantineDashboardSparkline`** (new). This is the mini bar chart inside a KPI card, as in the Lahomes Analytics
   KPI row (`techzaa.in/lahomes/admin/index.html`, top four cards).
2. **`MantineDashboardStatCard` `chart` slot.** The KPI card places a sparkline beside its label and value, as in the
   same Lahomes row.
3. **`MantineDashboardStatCard` `variant="accent"`.** This is one filled "hero" card, as in Omah's "Total Properties"
   and Lahomes' "My Balance".
4. **`MantineDashboardBarChart` `horizontal` and `stacked`.**
   - `horizontal` draws a top-N list as horizontal bars (891 top listings, 890 cities).
   - `stacked={false}` draws grouped bars, so two different events are never visually summed (890 new listings / new
     users; spec §3–§4).

## 3. Verified context — measured 2026-09-27 (re-measure at I0)

- **No sparkline exists (FACT).**
  - `ls src/design-system/mantine/patterns/ | grep -i -E "chart|spark"` lists `MantineDashboardBarChart`, `…Donut`,
    `…LineChart`, `…Radar`, `…RadialProgress`, `…SemiDonut`, `…ChartLegend` and `…ChartStateFrame`.
  - `grep -rn sparkline src/design-system` finds only `MantineDashboardLineChart.tsx:136`
    (`sparkline: { enabled: false }`).
- **`MantineDashboardStatCard` today** (`src/design-system/mantine/patterns/MantineDashboardStatCard.tsx`):
  - Props (`:12-33`): `icon, label, value, caption?, secondaryLine?, comparison?, href?, state, zeroText?,
    errorMessage?, retryLabel?, onRetry?, loadingAriaLabel?`.
  - The ready body is at `:132-172`. The icon row is a `Group` holding the icon badge and `comparison`. Under it a
    `Stack` holds the label (`Text size="sm" c="gray.5"`), the value
    (`fz={{ base: 'h5', sm: 'h4', md: 'h3' }} fw={700} c="gray.8"`), the zero or caption line (`Text size="xs"
    c="gray.5"`), and `secondaryLine`.
  - The icon badge is `ThemeIcon size="hero" radius="xl" color="gray" variant="light"`.
  - There are three wrappers: `href` wraps the `Card component={Link}`, and the other two are plain `Card` and error.
    All three use `withBorder p={{ base: 'lg', md: 'xl' }} mih={theme.other.boxSize.dashboardStatCardMinHeight}`.
  - Production consumers: `AdminDashboardView.tsx` (853, committed) and `AgentStatisticsView.tsx` (854, working
    tree). Both must render byte-identically in behaviour when the new props are absent.
- **`MantineDashboardBarChart` today** (`…/MantineDashboardBarChart.tsx`):
  - `isStacked = series.length > 1` (`:110`).
  - `plotOptions.bar` uses `theme.other.dashboardChart.barColumnWidth` ('40%') and `barRadius` (4).
  - `xaxis.categories` carries the categories, and `yaxis.labels.formatter` carries `valueLabel`.
  - Its Story `Patterns/Mantine/DashboardBarChart` has exports `Default`, `OneSeriesHidden`, `Empty` and `Error`. It
    has no production consumer (`grep -rln MantineDashboardBarChart src --include=*.tsx`, stories and patterns
    excluded: none).
- **Theme.**
  - `theme.other.dashboardChart` holds chart roles as numbers or strings (`theme.ts:293-321`, values `:813-848`).
  - The brand tuple is at `src/design-system/brand.ts:13-23`: `brand.7` `#EC5447` is primary and `brand.8` is
    `#BD4339`.
  - Computed WCAG contrast of white text: on `#EC5447` it is ≈ 3.5:1, which fails AA for 14px text; on `#BD4339` it is
    ≈ 5.2:1, which passes AA.
- **Reference measurement (FACT, measured live 2026-09-27 at a 1920px viewport).**
  - Page: `techzaa.in/lahomes/admin/index.html`, the four KPI cards.
  - Each sparkline canvas is **154 × 95 px**, inside a 368 × 173 px card.
  - Each has **7 bars**, **8px** wide in a 22px slot (≈ 36%). The project's existing `barColumnWidth` '40%' is reused,
    so no new ratio is added.
- **Stories:** `src/stories/patterns/mantine/DashboardStatCard.stories.tsx` (`Patterns/Mantine/DashboardStatCard`:
  `Default`, `Loading`, `Zero`, `Error`) and `src/stories/patterns/mantine/DashboardBarChart.stories.tsx`.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D78-9 Q2/Q3, Lahomes KPI row | **Create** `src/design-system/mantine/patterns/MantineDashboardSparkline.tsx`. Props: `data: { date: string; value: number }[]`, `color: string` (theme colour key), `valueLabel: (n) => string`, `dateLabel: (date) => string`, `ariaLabel: string`. Behaviour: an ApexCharts `bar` chart with `chart.sparkline.enabled: true`, `toolbar` off, the native tooltip showing `dateLabel(date)` and `valueLabel(value)`, and `plotOptions.bar.columnWidth = theme.other.dashboardChart.barColumnWidth` and `borderRadius = theme.other.dashboardChart.barRadius`. The box is `w={theme.other.dashboardChart.sparklineWidth}` and `h={theme.other.dashboardChart.sparklineHeight}`. It renders `null` for `data.length === 0`. Zero values render zero-height bars, never a fake baseline. The wrapper carries `role="img"` and `aria-label`. Use the same `ReactApexChart` import path and the same `resolveThemeColor` helper that `MantineDashboardBarChart.tsx` uses. | P0 | AC1, AC2 | Confirmed |
| **R2** | R1 | Add two roles to `theme.other.dashboardChart`: `sparklineWidth: 154` and `sparklineHeight: 95`. Put them in the type block `:293-321` and the value block `:813-848`, each with the comment *"Task 889: Lahomes KPI sparkline canvas, measured live 2026-09-27 (owner reference, D78-9)"*. | P0 | AC2 | Confirmed |
| **R3** | D78-9, Lahomes KPI row | `MantineDashboardStatCard` gains `chart?: ReactNode`. When it is set, the ready body places the existing text stack and the chart side by side: `Flex direction={{ base: 'column', xs2: 'row' }} wrap="wrap" justify="space-between" align={{ base: 'flex-start', xs2: 'flex-end' }} gap="md"`, with the text stack first and the chart second. `wrap="wrap"` (review 1, F1) drops the chart under the text whenever the card is too narrow for text + gap + chart, so the chart never overflows the card at any width. When it is absent, the markup is unchanged. `loading` and `error` ignore `chart`. | P0 | AC3 | Confirmed |
| **R4** | D78-9 Q4 (accent hero), Omah / Lahomes | `MantineDashboardStatCard` gains `variant?: 'default' \| 'accent'` (default `'default'`, unchanged). `'accent'` applies to the ready and zero states only. **Revision 2 (O889-1 row 3, owner decision D889-2 below):** the `Card` background is the brand coral gradient from the theme role `theme.other.accentHeroGradient` (§18.3), not `brand.8`. The border is removed (`withBorder={false}`), and the label, value and caption render `c="white"`. The icon badge becomes `ThemeIcon … color="white" variant="light"`. The measured contrast of white text against the rendered gradient behind it must be ≥ 4.5:1 for the label and caption, and ≥ 3:1 for the value (bold, ≥ 24px from `md`; below `md` it is 20px, so it also needs 4.5:1). Loading and error keep the default chrome. | P1 | AC4 | Confirmed |
| **R5** | D78-9 Q2/Q3 | `MantineDashboardBarChart` gains `stacked?: boolean`, defaulting to `series.length > 1` (today's behaviour). With `stacked={false}`, two or more series render as grouped columns. | P0 | AC5 | Confirmed |
| **R6** | D78-9 Q2/Q3 | `MantineDashboardBarChart` gains `horizontal?: boolean` (default `false`). With it set: `plotOptions.bar.horizontal: true`, `barHeight = theme.other.dashboardChart.barColumnWidth`; categories stay in `xaxis.categories`; the value formatter moves to `xaxis.labels.formatter` (`valueLabel(Number(v))`) and the category formatter to `yaxis.labels.formatter` (`categoryLabel(String(v))`); grid lines switch to vertical (`xaxis.lines.show: true`, `yaxis.lines.show: false`). Leave the y-axis label width at the ApexCharts default: no new value. | P0 | AC5 | Confirmed |
| **R7** | 16c, GR-3 | Stories. **Create** `src/stories/patterns/mantine/DashboardSparkline.stories.tsx` (`Patterns/Mantine/DashboardSparkline`: `Default` with 7 days of mixed values, `AllZero`, `ThirtyDays`). **Extend** `Patterns/Mantine/DashboardStatCard` with `WithChart` (a sparkline in `chart`) and `Accent` (variant accent, no chart). **Extend** `Patterns/Mantine/DashboardBarChart` with `Grouped` (2 series, `stacked={false}`) and `Horizontal` (1 series, 5 long category labels from existing storybook fixture strings). Fixtures carry no wall-clock values (check 16). All visible strings come from `storyT` keys, adding keys under `storybook.mantine.*` in all four locales only where no existing key fits. | P0 | AC6 | Confirmed |
| **R8** | enrolment | Enrol `MantineDashboardSparkline.tsx` in `scripts/mantine-migration-scope.json`, same shape as its sibling dashboard patterns. `check:pattern-enrolment` and `check:story-coverage` exit 0. | P0 | AC6 | Confirmed |
| **R9** | preserve | The existing exports of both Stories are unchanged. With no new props, `AdminDashboardView` and `AgentStatisticsView` render exactly as before. | P0 | AC7 | Confirmed |
| **R10** | hardcode | No `className`, Tailwind, `@/components/ui/*`, `style=` or raw px/rem/hex in the new or changed files; every value is a theme key or role. | P0 | AC8 | Confirmed |
| **R11** | O889-1 row 1 (owner, 2026-09-27), D845-4 | Revision 2. The sparkline tooltip stays ApexCharts' **native** tooltip, turned into its built-in compact form: `tooltip.compact: true` (ApexCharts 7.4.0, `types/apexcharts.d.ts`: *"Meant for panels a normal card would cover (small multiples, sparklines, dashboard tiles)"*). When the tooltip is shown it never overlaps the hovered bar, never covers the cursor point, and is never cut off by the viewport or by any clipping ancestor. No custom tooltip component, no CSS on `.apexcharts-tooltip`, no `custom` renderer, no change to the `Card`'s `overflow`. `useApexTooltipMirror` stays as it is. | P0 | AC9 | Confirmed |

## 5. Assumptions and open questions

- **INFERENCE:** a sparkline has no axes or legend. The native tooltip is the textual alternative, following the 845
  tooltip decision (D845-4).
- ~~**INFERENCE:** the xs2 (480px) switch in R3 keeps the chart beside the value from 480 up.~~ **Falsified at
  review 1 (F1):** the inference checked only the one-column 480px card. At 1024 the four-column grid gives a 236px
  card with a 186px content box, and the 154px chart overflowed it by 60px. R3 now carries `wrap="wrap"`.
- No owner decision is open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (1, 3, 7, 9, 11–14, 16–16d) · `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` §6u · `docs/component-rules.md` · `docs/storybook-governance.md` · `docs/qa-rules.md` ·
`.claude/skills/execute-task/SKILL.md` · the 845 kickoff (`tasks/Archive/Sprint_78_kickoff_prompt_Task_845_*.md`) §16
(D845-1…4).

## 7. Scope

- **Created:** `src/design-system/mantine/patterns/MantineDashboardSparkline.tsx` ·
  `src/stories/patterns/mantine/DashboardSparkline.stories.tsx`.
- **Edited:** `MantineDashboardStatCard.tsx` · `MantineDashboardBarChart.tsx` · `src/design-system/mantine/theme.ts`
  (two roles) · `DashboardStatCard.stories.tsx` · `DashboardBarChart.stories.tsx` · `scripts/mantine-migration-scope.json`
  (+1) · `messages/{sq,en,uk,it}.json` (only `storybook.mantine.*` keys, if needed) · `docs/backlog.md` (889 line).
- `src/design-system/mantine/patterns/index.ts`: add the export only if its sibling dashboard patterns are exported
  there (check at I0).

## 8. Out of scope

Every consumer (`AdminDashboardView`, `AgentStatisticsView`, routes) is out: 890 and 891 compose these patterns. The
other chart patterns are out too.

## 9. Current and required behavior

**Before.** There is no sparkline. The KPI card has no chart and no filled variant. Bar charts are vertical and always
stacked for two or more series.
**After.** The four contracts in §4 exist, each with its own Story. Existing consumers are unchanged.

## 10. Implementation requirements

1. **I0.**
   - Platform line.
   - `git status --porcelain` snapshot saved to `docs/sessions/evidence/task889/i0-status.txt`.
   - `git hash-object` of the five files to be edited.
   - Re-measure §3.
   - Grep `patterns/index.ts` for sibling exports.
2. **Order:** R2 → R1 → R7 (sparkline Story) → R3/R4 → R7 (StatCard Story) → R5/R6 → R7 (BarChart Story) → R8.
3. `GR-0` and `GR-3a` receipts before the first write (the §15 receipts are the orchestrator's; re-verify them).

## 11. Positive and negative flows

**Positive.** In `Patterns/Mantine/DashboardStatCard` → `WithChart` at 1440, the card shows the icon, label and value
on the left and seven bars on the right. Hovering a bar shows its date and value.

| Negative flow | Applicable | Expected |
|---|---|---|
| Sparkline `data=[]` | Yes | Renders nothing; the card keeps its text. |
| All values 0 | Yes | Zero-height bars; the tooltip still reads "0". |
| Card below 480px | Yes | The chart sits under the value; no horizontal overflow at 320. |
| `accent` + `href` | Yes | The whole card is still one link; the text stays white. |
| `accent` + `error` | Yes | The default error chrome (no brand fill). |
| Horizontal bars with long labels | Yes | The ApexCharts default label width truncates; the tooltip shows the full label. |
| Existing consumers | Yes | No visual change (R9). |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `Patterns/Mantine/DashboardSparkline` → `Default` at 1440, when rendered:
  - it has 7 `.apexcharts-bar-area` elements;
  - the wrapper has `role="img"` and the story's aria-label;
  - with `AllZero`, the bars' rendered heights are 0.
- **AC2 [R1, R2]** — Given the rendered sparkline, when measured, then its box is 154 × 95 CSS px, and
  `git grep --untracked -n "sparklineWidth\|sparklineHeight" -- src/design-system/mantine/theme.ts` shows one type
  line and one value line each.
- **AC3 [R3]** — Given `DashboardStatCard` → `WithChart`:
  - at 1440 and 480, the chart's left edge is to the right of the value's right edge;
  - at 390 and 320, the chart's top edge is below the value's bottom edge;
  - (review 1, F1) at 320, 390, 480, 768, 1024, 1280 and 1440, the chart's right edge is ≤ the card's content-box
    right edge (card right minus its computed `padding-right`), and the card's `scrollWidth` ≤ its `clientWidth`.
    At 1024 the chart may sit beside or below the value;
  - `Default` renders the same DOM before and after the change (compare `outerHTML` from the pre-change and
    post-change builds, retained under `evidence/task889/`).
- **AC4 [R4]** — Given `DashboardStatCard` → `Accent` (revision 2: superseded by §18.4 AC4-R2; the `rgb(189, 67, 57)` clause is void):
  - the label, value and caption compute `rgb(255, 255, 255)`;
  - the card's computed `background-image` is a `linear-gradient` whose two stops are `rgb(236, 84, 71)` (`brand.7`) and `rgb(142, 50, 43)` (`brand.9`);
  - the pixel-sampled contrast from §18.4 meets R4's thresholds (quote the minimum per element).
- **AC5 [R5, R6]** — Given `DashboardBarChart`:
  - `Grouped` renders its two series side by side (bar x-positions differ within one category);
  - `Horizontal` renders bars whose width varies with value and whose height is equal;
  - `Default` still renders stacked.
- **AC6 [R7, R8]** — Given `check:stories`, `check:story-coverage` and `check:pattern-enrolment`, when run, then all
  exit 0, and the census of `MantineDashboardSparkline.tsx` reads `manifest:yes story:yes`.
- **AC7 [R9]** — Given `Patterns/Mantine/AdminDashboardView` → `Default` and
  `Patterns/Mantine/AgentStatisticsView` → `Default`, when their `#storybook-root` `outerHTML` is compared before and
  after (ApexCharts' generated ids normalised), then they are equal.
- **AC8 [R10]** — Given
  `git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardSparkline.tsx src/stories/patterns/mantine/DashboardSparkline.stories.tsx`,
  when run, then it prints nothing, and `check:design-tokens:strict` exits 0.

- **AC9 [R11]** — Given the §18.4 tooltip probe, when every required tuple is hovered, then its violation count is 0.

`GR-4 AC AUDIT — 8 criteria (9 from revision 2: AC9 counts observed tooltip/bar/cursor/clip-box relations); each states an observable property; absolutes: AC2's exact 154×95 (the role's own value), AC7's equal outerHTML with ids normalised (the no-new-props path must not change), AC8's empty grep on two created files.`

### Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| StatCard value (default and accent) | KPI value | 20px | 24px | 30px | 30px | `h5` / `h4` / `h3` / `h3` | unchanged, `MantineDashboardStatCard.tsx:153` (886 §4.1) |
| StatCard label (default and accent) | label | 14px | 14px | 14px | 14px | `sm` | unchanged, TailAdmin §6u |
| StatCard caption | meta | 12px | 12px | 12px | 12px | `xs` | unchanged |
| Bar chart axis labels | axis | ApexCharts default | same | same | same | library default (no `fontSize` set, unchanged) | 845 |
| Sparkline | none | — | — | — | — | no text; the tooltip is the library's own | D845-4 |

Nothing ≥ 24px lacks a step, and no heading exceeds 20px below 640.

### Width contract (GR-3b)

- **StatCard stories:** fluid, as in production (`MantineDashboardGridTopRow`'s `SimpleGrid` cell,
  `MantineDashboardGrid.tsx:63-72`).
- **Sparkline story:** ~~the component's own role width; no container~~ — **superseded by §21.3 (rev 4, owner
  O889-1 row 1):** the chart fills its container (154px floor); the Story renders it in the StatCard stories'
  `SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md"` cell.
- **Bar chart stories:** fluid.
- No `maw`/`w` containers, `style` objects or viewport pins in any Story.

## 13. QA profile and verification plan

**Q3.** New visible canonical patterns, and every changed Story goes to the owner matrix.

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task889/`.

### 13.2 Final gate block

Tee each command to `docs/sessions/evidence/task889/<name>.txt` with its exit code.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
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
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardSparkline.tsx
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardSparkline.tsx src/stories/patterns/mantine/DashboardSparkline.stories.tsx
git --no-optional-locks hash-object src/design-system/mantine/patterns/MantineDashboardSparkline.tsx src/design-system/mantine/patterns/MantineDashboardStatCard.tsx src/design-system/mantine/patterns/MantineDashboardBarChart.tsx src/design-system/mantine/theme.ts src/stories/patterns/mantine/DashboardSparkline.stories.tsx src/stories/patterns/mantine/DashboardStatCard.stories.tsx src/stories/patterns/mantine/DashboardBarChart.stories.tsx scripts/mantine-migration-scope.json
```

Expected results:
- every command exits 0;
- the `git grep` prints nothing.

`check:locale-leak:mantine-only` is known red (Task 836). Run it, and quote zero findings for
`patterns-mantine-dashboardsparkline`, `patterns-mantine-dashboardstatcard` and `patterns-mantine-dashboardbarchart`.

### 13.3 GR-3b / GR-3c receipts

For every new or changed export (`DashboardSparkline` ×3, `DashboardStatCard--with-chart`, `--accent`,
`DashboardBarChart--grouped`, `--horizontal`), measure over the **whole document** at 320/390/768/1024/1440:
- each component's bounding box against its container;
- `scrollWidth` against `clientWidth` of every scroll container (not `#storybook-root` only; review 2 of 854 found an
  in-card overflow that the root measurement could not see);
- the computed font sizes.

### 13.4 Owner visual review — `OWNER VISUAL QA REQUIRED`

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardSparkline` | Default / AllZero / ThirtyDays | 1440 | en | reads as the Lahomes KPI mini-bars |
| 2 | `Patterns/Mantine/DashboardStatCard` | WithChart | 1440 / 390 | en / uk | chart beside the value on desktop, under it on phone |
| 3 | `Patterns/Mantine/DashboardStatCard` | Accent | 1440 / 390 | en / sq | a filled hero card, legible white text |
| 4 | `Patterns/Mantine/DashboardBarChart` | Grouped / Horizontal | 1440 / 390 | en / uk | grouped (not stacked) columns; horizontal bars readable |

## 14. Completion report contract

Report:
- files with hashes;
- R1–R10 and AC1–AC8 with quotes;
- commands with exit codes;
- the GR-0, GR-3a, GR-3b, GR-3c and GR-1 receipts;
- deviations and limitations.

End with status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval
and no mutating git. Update the 889 line of `docs/backlog.md`, and write the session log with its Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| The owner's references honoured? | Sparkline and chart slot: Lahomes KPI row, measured live. Accent: Omah / Lahomes hero cards. Grouped/horizontal bars: D78-9 Q2/Q3. |
| Honest numbers? | `stacked={false}` exists so different events are never visually summed (spec §3–§4). |
| Canonical first? | Patterns and Stories come before any consumer (16c); 890/891 depend on this task. |
| Accessibility? | Accent uses `brand.8` (≈ 5.2:1), not `brand.7` (≈ 3.5:1). |

`GR-0 CANONICAL REUSE PREFLIGHT — request: KPI mini-bar chart; KPI card with a chart; filled hero KPI card; horizontal and grouped bars; semantic queries: "sparkline", "chart|spark" in patterns, "mini", StatCard props, BarChart plotOptions; inspected candidates: MantineDashboardLineChart.tsx (sparkline disabled, axis/legend chrome), MantineDashboardBarChart.tsx (Patterns/Mantine/DashboardBarChart), MantineDashboardStatCard.tsx (Patterns/Mantine/DashboardStatCard), MantineDashboardRadialProgress.tsx; decision: CREATE (sparkline — no candidate renders a chrome-less mini chart; the BarChart carries axes, legend and a 384px min height) + EXTEND (StatCard chart/variant, BarChart horizontal/stacked); selected canonical owner: the three pattern files; Mantine/TailAdmin token path: theme.other.dashboardChart.* (+2 measured roles), brand tuple, TailAdmin §6u; new hardcoded visual values: NONE; rationale: the owner's references (D78-9) require these four contracts, and each is added once at its canonical owner.`

`GR-3a STORY PREFLIGHT — MantineDashboardSparkline × 3 states; canonical candidates: NONE; direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: Patterns/Mantine/DashboardSparkline. — MantineDashboardStatCard × chart/accent; canonical candidates: patterns-mantine-dashboardstatcard; direct-import evidence: src/stories/patterns/mantine/DashboardStatCard.stories.tsx; decision: EXTEND. — MantineDashboardBarChart × grouped/horizontal; canonical candidates: patterns-mantine-dashboardbarchart; decision: EXTEND; rationale: new distinct states on the existing canonical pages.`

`GR-1 CENSUS COMPLETE — pattern task, no route surface: tier1 1 created (MantineDashboardSparkline) + 2 extended enrolled+storied (MantineDashboardStatCard, MantineDashboardBarChart); tier2 0; tier3 0 listed and filed as none.`

`GR-3 STORY PROVEN — MantineDashboardSparkline ← src/stories/patterns/mantine/DashboardSparkline.stories.tsx; MantineDashboardStatCard ← src/stories/patterns/mantine/DashboardStatCard.stories.tsx; MantineDashboardBarChart ← src/stories/patterns/mantine/DashboardBarChart.stories.tsx` (after execution).

## 16. Review 1 — 🔁 NEEDS REVISION (2026-09-27): revision 1

Review 1 measured the built `storybook-static`, whose hashes match the session log's final hashes, with Playwright on
win32 v22.22.3. Everything else stands: R1, R2, R4–R6, R8–R10, AC1, AC2, AC4, AC6–AC8, and the gates in the session
log. Only the items below are open.

### 16.1 Findings

| ID | Severity | Requirement | Observed (review 1) | Required |
|---|---|---|---|---|
| **F1** | P1 | R3 / AC3, GR-3b | At 1024, `DashboardStatCard` → `WithChart` gives a 236px card with a content box of 40→228. The sparkline spans 134→288, so it overflows the card by 60px. The card's `scrollWidth` is 271 against a `clientWidth` of 234. The session log's GR-3b receipt says `overflow: none` for 1024, but its own `gr3b-gr3c-measurements.json` shows `overflowElements` rising from 2 to 5 at 1024 only. The cause is task design: §5's inference checked only the one-column card, and R3's `Flex` had no wrap. | R3 as amended: add `wrap="wrap"` to the chart-branch `Flex` in `MantineDashboardStatCard.tsx` and change nothing else in that component. AC3 as amended: no overflow at 7 widths. |
| **F2** | P1 | R7 / AC5 | `DashboardBarChart` → `Horizontal` still renders Storybook's error boundary intermittently: `AssertionError: expected 1 to be greater than 1`, at `play`. It failed 1 of 12 runs with a 7s settle (en, run 2) and 3 of 20 runs with a 1.5–6s settle (en and sq). The `waitFor` covers only the bar **count**. The widths and heights are read immediately afterwards, while ApexCharts' grow animation is still running and every bar still has the same width. The "96/96 clean" stress test did not exercise this assertion under this timing. | In `DashboardBarChart.stories.tsx`, move the geometry assertions inside `waitFor(…, { timeout: 5000 })`: `Horizontal` (widths vary, heights equal) and `Grouped` (first-bar lefts differ). The count `waitFor` stays. Do not disable the component's animation, because that is production behaviour. |
| **F3** | P2 | §13.3, GR-3b | `measure.mjs` still reads `getAttribute('x'/'width'/'height')` on the `<path>` bars, which is the session's own defect #1. So every `barRects` entry in `gr3b-gr3c-measurements.json` is a fabricated `0`. It also counts overflow over the whole root instead of per card. | Replace the attribute reads with `getBoundingClientRect()`. For each `.mantine-Card-root`, record `scrollWidth`/`clientWidth` and the chart's right edge against the card's content-box right edge. Save the output as a new file, `gr3b-gr3c-measurements-rev1.json`. |
| **F4** | P1 | §13.2 | `check:locale-leak:mantine-only` has not been run against the final content. The session log says so itself. | Run it after F1–F3, per §16.3. |

### 16.2 Re-entry

Mode **`remediation`**. Start at F1. Reuse without re-running:
- the I0 snapshot and hashes;
- `ac7-before/*.before*.html`. Never overwrite or rebuild the before-state.

Write every new artifact with a `-rev1` suffix. The superseded artifacts stay, and the session log marks them
superseded.

Order:
1. F1 (`MantineDashboardStatCard.tsx`, one prop).
2. F2 (`DashboardBarChart.stories.tsx`).
3. `npm.cmd run build-storybook`.
4. F3 measurement.
5. AC7 "after" re-capture.
6. The §16.3 stress run.
7. `check:locale-leak:mantine-only`.
8. The full §13.2 gate block.

No other file changes. `DashboardStatCard.stories.tsx` needs no edit.

### 16.3 Verification (revision 1)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
```

Then re-run the whole §13.2 block, `npm.cmd run build` and the hash-object line included. Tee each command to
`docs/sessions/evidence/task889/<name>-rev1.txt` with its exit code.

Rendered evidence against the rebuilt `storybook-static`:
1. **AC3 (F1).** For `WithChart` at 320/390/480/768/1024/1280/1440, record per width: the card rect, its computed
   `padding-right`, `scrollWidth`/`clientWidth`, the chart rect and the value rect. Quote the 1024 row.
2. **AC5 (F2).** Load `Horizontal` and `Grouped` 10 times each in each of the four locales (80 loads). Use
   `waitUntil: 'networkidle'` followed by a **300 ms** settle, which is `check-locale-leak.mjs`'s own shape. Count the
   loads that show Storybook's error boundary. Expected: 0 of 80. Keep the script and its output under `-rev1`.
3. **AC7.** Re-capture only the "after" `outerHTML` for `AdminDashboardView`/`AgentStatisticsView` into
   `ac7-before/*.after-rev1*.html`. Compare it, ids normalised, against the retained `*.before.norm2.html`.
   Expected: `IDENTICAL` ×2.
4. **Locale leak.** In the `check:locale-leak:mantine-only` transcript, quote zero findings **and** zero
   `failed to render` / `AssertionError` lines for `patterns-mantine-dashboardsparkline`, `…-dashboardstatcard` and
   `…-dashboardbarchart`. Its overall exit stays 1 (Task 836).

Receipts:
- New `GR-3b STORY RESPONSIVE CHECK` receipts for `--with-chart` and both bar-chart exports, built from the rev1
  measurement.
- The final hash of every changed file.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

### 16.4 Reviewer note — no executor action

`theme.ts`, `scripts/mantine-migration-scope.json` and `messages/{sq,en,uk,it}.json` carry hunks from both 889 and
854 (`dashboardListingThumb`, the `AgentStatisticsView` manifest entry and 854's keys). 854 is uncommitted and not
approved. The approval review must resolve that staging entanglement before it emits the handoff. Do not revert or
move 854's hunks.

## 17. Review 2 — 🟡 PARTIALLY VERIFIED (2026-09-27): only the owner items remain — superseded by §18 for O889-1; O889-2 still open

Revision 1 is accepted. The reviewer re-measured the rebuilt `storybook-static` on win32 v22.22.3. That build is newer
than both changed files, and all 8 `hash-object` values match `final-hashes-rev1.txt`.

- **F1: closed.** `WithChart` was measured in en and uk at 320/390/1024/1280/1440. At every width the chart's right
  edge is ≤ the card's content-box right edge, `scrollWidth` = `clientWidth`, and the document shows no overflow. At
  1024 the chart is below the value (213 ≥ 171); at 1440 it is beside it (177 ≥ 141). The value renders 20px at
  320/390 and 30px at ≥ 1024.
- **F2: closed.** In 36 reviewer loads, `Horizontal` and `Grouped` × sq/it/en × 6, using `networkidle` plus 300ms,
  the error boundary appeared 0 times. At 390 and 1440 (uk), the horizontal bar heights are all 25 and the widths
  vary.
- **F3: closed.** `measure-rev1.mjs` uses `getBoundingClientRect()` and measures per card.
- **F4: closed.** `check-locale-leak-rev1.txt` has zero lines for the three task stories. Before the fix, a render
  failure printed as leak lines; rev1 prints none. GR-2: the detector cannot show that a story was scanned, only
  that nothing leaked (Task 836).
- **Carried forward.**
  - AC7: re-checked with `cmp`, and both `*.after-rev1.norm2.html` files are identical to the retained
    `*.before.norm2.html`.
  - `build-rev1.txt` exits 0.
  - The rest of the §13.2 block, rev1, also exits 0.

**NOTE (no action).** Under the amended R3, a 4-column grid drops the chart under the text whenever the card is
narrower than about 290px of content. In the Story that happens at 1024 and 1280. The card then grows from 209px to
317px in height. 890 and 891 add a navbar, so production will show this layout at most desktop widths. O889-1 row 2
now includes 1024 so that the owner sees it. 890 and 891 choose their grid columns.

### 17.1 Owner items (approval waits on both)

**O889-1 — `OWNER VISUAL QA REQUIRED`.** This is §13.4 with row 2 widened:

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardSparkline` | Default / AllZero / ThirtyDays | 1440 | en | reads as the Lahomes KPI mini-bars |
| 2 | `Patterns/Mantine/DashboardStatCard` | WithChart | 1440 / 1024 / 390 | en / uk | beside the value at 1440; under it at 1024 and 390, still acceptable |
| 3 | `Patterns/Mantine/DashboardStatCard` | Accent | 1440 / 390 | en / sq | a filled hero card, legible white text |
| 4 | `Patterns/Mantine/DashboardBarChart` | Grouped / Horizontal | 1440 / 390 | en / uk | grouped (not stacked) columns; horizontal bars readable |

- **Accepted** → the approval review follows.
- **Returned** → a revision is written from the owner's words.

**O889-2 — `STOP - OWNER DECISION REQUIRED`: staging the shared files (§16.4).** 854 is uncommitted and not approved,
and its hunks sit in three shared file groups:
- `src/design-system/mantine/theme.ts`: `dashboardListingThumb`;
- `scripts/mantine-migration-scope.json`: the `AgentStatisticsView.tsx` entry, which points at an untracked file;
- `messages/{sq,en,uk,it}.json`: `cabinet.statistics.*`, the `statistics` menu key and `user_menu_agent_caption`.

If these files are staged whole, a clean checkout gets a manifest entry for a file that does not exist.

- **A (recommended).** The owner stages only 889's hunks with an interactive patch-mode add (`-p`) on those six files:
  - `sparklineWidth` / `sparklineHeight`;
  - the `MantineDashboardSparkline.tsx` manifest line;
  - `storybook.mantine.dashboard_sparkline_aria_label`.

  The owner then checks the staged diff. Every other 889 path is staged by explicit path.
- **B.** Commit 889 together with the joint 854 + 891 close. 889 then stays uncommitted, and 890 must build on top of
  the uncommitted tree.

The approval review emits the handoff for the option the owner picks.

## 18. Review 3 — 🔁 NEEDS REVISION (2026-09-27): owner returned O889-1 rows 1 and 3 — revision 2

### 18.1 Owner result, verbatim (O889-1)

| Row | Result | Owner's words |
|---|---|---|
| 1 Sparkline | ❌ returned | *"не приймаю. Tooltip з'являється в одному і тому ж місці, перекриваючи стовпчик, поведінка тултіпа має бути наступною: він не має перекривати стовпчик, він має з'являтися вище/нижче/правіше/лівіше від точки курсору! Tooltip не має обрізатись краями графіку. … У https://apexcharts.com/ дуже гарна поведінка tooltip, чому ти її не використовуєш? … ми використовуємо чарти і всі графіки з https://apexcharts.com/, ми їх лише стилізуємо під той вид, референси якого я тобі надав."* (screenshot: the uk tooltip "Пн · Графік тренду: 22" sits over the first bars) |
| 2 StatCard WithChart | ✅ accepted | *"приймаю!"* — at 1440 / 1024 / 390, en / uk. Do not change its layout. |
| 3 StatCard Accent | ❌ returned | *"колір бекграунду це повний жах! Не приймаю. … Необхідно підібрати трендовий колір 2026 року"* |
| 4 BarChart Grouped / Horizontal | ✅ accepted | *"приймаю."* Do not change either export. |

**D889-2 (owner, 2026-09-27, AskUserQuestion, verbatim option):** *"Coral gradient (our brand)"* — *"Project brand coral
#EC5447 fading to #8E322B. Warm and on-brand, but white text on the light end is only 3.5:1, so small text fails AA and
the label/caption would need the dark end."* Rejected alternatives: deep ink + coral, the TailAdmin indigo gradient,
and the Lahomes violet.

### 18.2 Row 1 — why it failed and the native fix (reviewer probe, FACT)

- **Cause.** The tooltip is ApexCharts' full card form, 156 × 69 px, on a 154 × 95 chart. ApexCharts places it beside the
  point only inside the chart's own grid width (`src/modules/tooltip/Position.js` `computeTooltipPosition`,
  `x > gridWidth/2` → left), so no placement beside the bar exists. `useApexTooltipMirror` then slides it back inside
  the viewport, and that puts it on the bars.
- **Probe.** Real `apexcharts` 7.4.0 `dist`, the sparkline's own options, 7 bars hovered at mid and top (14 hovers per
  layout). Script: `C:\Users\Nox\AppData\Local\Temp\…\scratchpad\tt889.cjs`; it is not retained, and the executor
  writes its own probe.

  | Config | Layout | Tooltip size | Over the bar | Over the cursor | Clipped |
  |---|---|---|---|---|---|
  | current | bare, with the mirror | 156×69 | 6 | 6 | 0 |
  | current | bare, no mirror | 156×69 | 0 | 0 | 6 |
  | `compact: true` | bare, with and without the mirror | 58×24 | 0 | 0 | 0 |
  | `compact: true` | 340px card, chart on the right | 58×24 | 0 | 0 | 0 |

  The 236px-card layout of the probe rendered a 175px canvas, which is a harness artifact. So the 1024 card is
  **UNVERIFIED** and is AC9's hardest tuple.
- **Live reference, Lahomes KPI sparkline, 1920px.** Its tooltip leaves the 156px canvas: it sits left of the cursor,
  155px wide, inside the 371px card. The compact form gets the same effect, beside the cursor, without needing the
  space.

### 18.3 Row 3 — the coral gradient (D889-2)

- **Theme role.** Add `accentHeroGradient: MantineGradient` to `theme.other`. Put the type in the
  `MantineThemeOther` augmentation and the value next to the other roles. The value was
  `{ from: 'brand.7', to: 'brand.9', deg: 225 }`, using theme keys and no hex. Revision 2 shipped it. **§19.1 replaces
  the angle and the comment.**
- **Card.** When `variant="accent"`, both `Card` wrappers get their background from
  `getGradient(theme.other.accentHeroGradient, theme)` (`@mantine/core` 8.3.18). This replaces `bg="brand.8"`.
  Verify that the computed `background-image` is the gradient. If Mantine's `bg` style prop does not accept it, use
  the Mantine-native equivalent and state which one in the session log. Never use a `style` object or a CSS file.
- **~~Why 225deg.~~ Superseded by §19.1: the angle is `180`.** 225deg failed AC4-R2 in revision 2, because every
  `Text` box spans the full content width, so its right end sits near the light corner. White contrast along the sRGB
  line brand.7 → brand.9, computed: t 0.0 → 3.54, 0.3 → 4.44, 0.4 → 4.84, 0.5 → 5.22, 0.8 → 6.68, 1.0 → 7.95. So a
  label that lands at t < 0.33 would fail. That is why AC4-R2 measures pixels and does not accept a declared value.
- `brand.8` is no longer used by the accent. `withBorder={false}`, the white text and the white `light` icon stay.

### 18.4 Acceptance for revision 2

- **AC4-R2 (R4)** — `DashboardStatCard` → `Accent`, sq and en at 320 / 390 / 768 / 1024 / 1440:
  1. Take a Playwright element screenshot of each of the label, value and caption. Take it once with the text shown and
     once with `color: transparent` set by the probe only (restore it afterwards), so that only the background is
     sampled.
  2. Compute the minimum WCAG contrast of `#FFFFFF` against every background pixel under the text box.
  3. Required: label and caption ≥ 4.5; value ≥ 4.5 where its computed font size is < 24px, and ≥ 3.0 where it is
     ≥ 24px.
  4. Quote the minimum per element per width.

  Plus AC4's computed-style clauses. The `Accent` story's `play` assertion `rgb(189, 67, 57)` must change to assert the
  gradient's two stops.
- **AC9 (R11)** — the tooltip probe, against the rebuilt `storybook-static`, `networkidle` then 2500ms settle.
  - **Tuples:**
    - `DashboardSparkline` `Default` and `ThirtyDays` at 1440, en and uk;
    - `AllZero` at 1440, en (**superseded by §19.2:** it asserts that no tooltip activates);
    - `DashboardStatCard` `WithChart` at 320 / 390 / 1024 / 1440, en and uk.
  - **Hover points:** every bar at its vertical middle and at its top + 2px. For `ThirtyDays`, use bars 0, 4, 9, 14,
    19, 24 and 29. For `AllZero`, hover each slot's centre 2px above the chart bottom.
  - **Before every read:** wait 450ms, and require `.apexcharts-tooltip.apexcharts-active`. A read without it is a
    probe failure, never a pass.
  - **A violation is any of:**
    - (a) the tooltip rect ∩ the hovered bar rect has an area > 0 (not checked for `AllZero`);
    - (b) the cursor point lies inside the tooltip rect;
    - (c) the tooltip rect is not fully inside the viewport ∩ every ancestor whose computed `overflow` is not
      `visible`.
  - **Required:** 0 violations. Record a table per tuple: hovers, active, (a), (b), (c).
- **Route.**
  1. Try `compact: true` alone.
  2. If any tuple violates, the only permitted second arm is adding ApexCharts' native `followCursor: true`. Measure
     again and keep both tables.
  3. If a violation remains, return `BLOCKED` with the tables and change nothing else. A custom tooltip, a tooltip
     CSS rule, a `custom` renderer, an `overflow` change or a new hook is forbidden (D845-4, and the owner's own
     words).
- **GR-3c:** the compact tooltip's font is the library's own; record its computed size. No token is added.
- **AC7 again.** Re-capture only the "after" `outerHTML` of `AdminDashboardView` / `AgentStatisticsView` as
  `*.after-rev2*`, and compare it to the retained `*.before.norm2.html`. Expected: `IDENTICAL` ×2. Neither consumer
  renders a sparkline or the accent variant.

### 18.5 Re-entry and scope

- **Mode `remediation`.** Reuse, and never overwrite: the I0 snapshot, `ac7-before/*.before*` and every `-rev1`
  artifact. Write new artifacts with the `-rev2` suffix.
- **Files:**
  - `MantineDashboardSparkline.tsx` (R11);
  - `MantineDashboardStatCard.tsx` (the accent background only);
  - `theme.ts` (the `accentHeroGradient` type line and value line);
  - `DashboardStatCard.stories.tsx` (the `Accent` `play` assertion only);
  - the session log and the 889 line of `docs/backlog.md`.

  Nothing else changes. `WithChart` (row 2) and both bar-chart exports (row 4) were accepted and must stay
  byte-identical.
- **Order:**
  1. theme role;
  2. accent;
  3. tooltip;
  4. `npm.cmd run build-storybook`;
  5. AC4-R2 probe;
  6. AC9 probe;
  7. AC7 re-capture;
  8. `npm.cmd run check:locale-leak:mantine-only` (quote zero lines for the three task stories);
  9. the full §13.2 block tee'd to `*-rev2.txt`, including `npm.cmd run build` and the hash-object line.
- **Receipts:**
  - GR-0 for the gradient role (EXTEND `theme.other`; no new hex);
  - GR-3b and GR-3c for `Accent`;
  - the final hashes.

### 18.6 Owner re-check after revision 2 (O889-1, rows 1 and 3 only)

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardSparkline` | Default / AllZero / ThirtyDays | 1440 | en / uk | the tooltip appears beside the cursor, never over the bar, never cut off |
| 1b | `Patterns/Mantine/DashboardStatCard` | WithChart | 1024 / 390 | uk | the same tooltip rule inside the card |
| 3 | `Patterns/Mantine/DashboardStatCard` | Accent | 1440 / 390 | en / sq | the coral gradient card, legible white text |

**O889-2** (staging the files shared with 854, §17.1) is unchanged and still owed at approval.

Status to return: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 19. Review 4 — 🔁 NEEDS REVISION (2026-09-28): both revision-2 blocks were design defects in §18 — revision 3

The executor returned `BLOCKED` correctly and changed nothing it was not allowed to change. Both blocks come from
§18's own specification, not from the implementation. The reviewer confirmed the shipped files match
`final-hashes-rev2.txt`, and that `storybook-static` (00:26:19) is newer than every changed source file.

### 19.1 AC4-R2 — the angle becomes 180deg; D889-2's colours stay

- **FACT (reviewer probe, win32 v22.22.3, rev2 `storybook-static`, all 4 locales × 5 widths).** The shipped 225deg
  reproduces the executor's numbers exactly. For example, at 390 the label is 4.08, the value 4.25 and the caption
  4.46.
- **Cause.** Every `Text` box spans the full content width, reaching 0.90–0.94 of the card's width. So its right end
  sits near 225deg's light top-right corner, whatever the text length.
- **What the vertical fix measures.** The text stack sits in the lower half of the card: the label starts at 0.43–0.46
  of its height, and the icon takes the top (`justify="space-between"`). A vertical gradient therefore puts all text on
  the dark end. The reviewer overrode `background-image` in the page only, with D889-2's same stops:

  | Gradient | label min | value min | caption min | Result, 40 tuples |
  |---|---|---|---|---|
  | brand.7 → brand.9, 225deg (shipped) | 4.08 | 4.25 | 4.46 | fails |
  | brand.7 → brand.9, 200deg / 160deg | 4.38 | 4.69 | 5.15 | label fails |
  | **brand.7 → brand.9, 180deg** | **4.90** | **5.49** | **6.63** | **passes all 40** |
  | brand.7 → brand.9, 180deg, label wrapped to 2 lines (probe text, uk × 5 widths) | 4.78 | 5.67 | 6.72 | passes |

  The light end now sits behind the white `light` icon only, and the icon is not text.
- **Why this needs no owner decision.** D889-2 chose the colours: *"#EC5447 fading to #8E322B … the label/caption
  would need the dark end"*. The angle was the orchestrator's own choice in §18.3, and 180deg gives the owner's
  stated condition. brand.8 → brand.9 also passes (label ≥ 5.60), but it changes the owner's light stop, so it is
  **not** the route.
- **R4-R3 (the change).**
  - `theme.ts`: set `accentHeroGradient` to `{ from: 'brand.7', to: 'brand.9', deg: 180 }`. Both comments (the type
    line and the value line) read: *"Task 889 rev 3, D889-2: brand coral hero-card gradient, light top → dark bottom;
    the text stack sits in the lower half, on the dark end"*.
  - `MantineDashboardStatCard.tsx`: in the JSDoc only, change `225deg — light top-right, dark bottom-left under the
    text` to `180deg — light top, dark bottom under the text`. No code line changes.
  - `DashboardStatCard.stories.tsx`, `Accent` only:
    - add `expect(backgroundImage).toContain('180deg');` to `play`, next to the two stop assertions;
    - change the comment's `225deg` to `180deg`.
- **AC4-R3.** Run §18.4's AC4-R2 method against the rebuilt `storybook-static`, with these tuples:
  - sq / en / uk / it at 320 / 390 / 768 / 1024 / 1440;
  - plus a **wrapped-label arm**: uk × the same 5 widths. The probe sets the label's `textContent` to itself repeated
    4 times, so it wraps to 2 lines. This is a probe-only mutation, never Story markup.

  Thresholds are unchanged from §18.4. Required: 0 failing element-measurements. Quote the minimum per element per
  width, and add a line recording the computed `background-image`, which must contain `180deg` and both stops.

### 19.2 AC9 — `AllZero` asserts the library's real behaviour

- **FACT (reviewer raw repro).**
  - Setup: `apexcharts` 7.4.0 `dist` with no React or Mantine, the sparkline's options, a 154 × 95 box, and 7 slots
    hovered at 50% and 97% height.
  - Non-zero series: the tooltip activates on 10/14 hovers, with or without `compact`.
  - All-zero series: it activates on 0/14 hovers, with or without `compact`.

  So an all-zero sparkline never shows a tooltip in ApexCharts 7.4.0, and neither `compact` nor `followCursor` changes
  that. §18.4 required activation there, which a correct implementation cannot give (GR-4). That was a design defect.
- **FACT (the executor's `ac9-tooltip-results.json`, arm 1, the shipped code).** Every other tuple is clean: 168 of
  168 hovers active, with 0 (a), 0 (b) and 0 (c) violations.
- **AC9-R3.**
  - **Unchanged tuples** (§18.4): `Default`, `ThirtyDays` and `WithChart`. Their rule stays the same: 0 violations,
    and `.apexcharts-tooltip.apexcharts-active` required before every read.
  - **`AllZero` @ 1440 en, 7 hovers:** required 0 hovers with `.apexcharts-tooltip.apexcharts-active` and 0 page
    errors. This is ApexCharts' native behaviour and needs no workaround. A custom tooltip, CSS, a `custom` renderer, a
    hook or a fake non-zero value is still forbidden (D845-4).
  - **Retained raw repro, two-armed.** Save a self-contained HTML page and a Node script under
    `docs/sessions/evidence/task889/`, both suffixed `-rev3`:
    - the HTML loads `node_modules/apexcharts/dist/apexcharts.js` through a relative path, or a copy saved next to it;
    - it covers {non-zero, all-zero} × {`compact` off, on};
    - retain the script's output.

    Expected: non-zero > 0 active, and all-zero 0 active, in both `compact` arms. The rev2 script loaded a scratchpad
    HTML that was not retained, so it is not evidence.
- **No code change for AC9.** `compact: true` alone stays. Re-run the AC9 probe once, against the final rebuilt
  `storybook-static`, as `ac9-tooltip-results-rev3.json`, so that the final artifact describes the shipped build.

### 19.3 Re-entry, scope and order

- **Mode `remediation`.** Reuse, and never overwrite, every I0, `-rev1`, `-rev2` and `ac7-before` artifact. Give every
  new artifact the `-rev3` suffix.
- **Files:**
  - `theme.ts` (the value and its two comments);
  - `MantineDashboardStatCard.tsx` (the JSDoc angle only);
  - `DashboardStatCard.stories.tsx` (the `Accent` `play` and its comment only);
  - the session log (a new "Revision 3" section);
  - the 889 line of `docs/backlog.md`.

  `MantineDashboardSparkline.tsx`, `MantineDashboardBarChart.tsx`, their two Stories and the manifest must keep their
  `final-hashes-rev2.txt` values.
- **Order:**
  1. the three edits;
  2. `npm.cmd run build-storybook`;
  3. AC4-R3;
  4. AC9-R3, then the raw repro;
  5. AC7: re-capture `*.after-rev3*` and compare it to the retained `*.before.norm2.html`, expecting `IDENTICAL` ×2;
  6. `npm.cmd run check:locale-leak:mantine-only`, quoting zero lines for the three task stories;
  7. the full §13.2 block tee'd to `*-rev3.txt`, including `npm.cmd run build` and `final-hashes-rev3.txt`.
- **Receipts:**
  - GR-0 for the angle change (EXTEND the existing role; no new hex);
  - GR-3b and GR-3c for `Accent`, re-measured at 320 / 390 / 768 / 1024 / 1440 in this pass, not carried over from
    rev1;
  - the final hashes.

### 19.4 Owner re-check after revision 3 (O889-1, rows 1 and 3)

This replaces §18.6.

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardSparkline` | Default / ThirtyDays | 1440 | en / uk | the tooltip appears beside the cursor, never over the bar, never cut off |
| 1a | `Patterns/Mantine/DashboardSparkline` | AllZero | 1440 | en | shows **no tooltip**, because ApexCharts shows none for an all-zero series (§19.2). If the owner returns this, the next step is an owner decision on the empty-state treatment |
| 1b | `Patterns/Mantine/DashboardStatCard` | WithChart | 1024 / 390 | uk | the same tooltip rule inside the card |
| 3 | `Patterns/Mantine/DashboardStatCard` | Accent | 1440 / 390 | en / sq | the coral gradient card (light top → dark bottom), legible white text |

**O889-2** (§17.1) is still owed at approval.

Status to return: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 20. Review 5 — 🟡 PARTIALLY VERIFIED (2026-09-28): revision 3 is accepted; only the owner items remain

Revision 3 is accepted on the reviewer's own evidence (win32 v22.22.3). The 8 current `hash-object` values equal
`final-hashes-rev3.txt`. `MantineDashboardSparkline.tsx`, `MantineDashboardBarChart.tsx`, their two Stories and the
manifest equal `final-hashes-rev2.txt`. `storybook-static` (10:02:10) is newer than all three changed files
(≤ 10:00:49), and `build-rev3.txt` exits 0.

- **R4-R3 / AC4-R3: verified.**
  - `theme.ts` carries `{ from: 'brand.7', to: 'brand.9', deg: 180 }` and both §19.1 comments. The StatCard change
    is JSDoc-only.
  - `ac4-r3-contrast-probe.out.txt`: 0 failing measurements over 25 tuples. Minima: label 4.90 (4.78 in the wrapped
    arm), value 5.49, caption 6.63.
  - Reviewer probe on the Accent story at en 390, sq 1440 and uk 320:
    - the top edge samples ≈ brand.7 (234, 83, 70) and the bottom edge ≈ brand.9 (144, 50, 43);
    - the inline style is `linear-gradient(180deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-9) 100%)`;
    - the border is 0px, with no page errors and no error display.
- **§19.1's wording "the computed `background-image` contains `180deg`" was an orchestrator defect.** Chromium does
  not serialize the default direction. The reviewer confirmed that the computed value is
  `linear-gradient(rgb(236, 84, 71) 0%, rgb(142, 50, 43) 100%)`. The executor's deviation is accepted: `play` asserts
  both stops on the computed value, and `180deg` on the inline `style` attribute.
- **AC9-R3: verified.**
  - `ac9-tooltip-results-rev3.json`: each of the 12 non-zero tuples has 14/14 active, with 0 (a), 0 (b), 0 (c) and
    0 page errors. `AllZero`: 0/7 active.
  - The raw repro (`ac9-raw-repro-rev3.*`, ApexCharts 7.4.0 from `node_modules`) gives non-zero 14/14 and all-zero
    0/7, in both `compact` arms.
- **AC7: verified.** The reviewer re-ran `compare-ac7-rev3.mjs`: `IDENTICAL` ×2, exit 0.
- **The rev3 §13.2 block.**
  - Every gate exits 0 except `check:locale-leak:mantine-only`, which exits 1 on pre-existing findings (Task 836).
    It has none for the three task stories. GR-2: the detector cannot prove that a story was scanned.
  - Lint went from 99 to 108 warnings, all in the `docs/sessions/evidence/task889/*.mjs` probes, with 0 errors.

### 20.1 P3 — stale prop JSDoc (Sonnet, comment only)

`MantineDashboardStatCard.tsx:39-40`, the `variant` prop JSDoc, still says *"`'accent'` fills the card with
`brand.8`"*. The component JSDoc at line 80 says the opposite: `brand.8` is no longer used.

- **Change:** make it read *"`'accent'` fills the card with `theme.other.accentHeroGradient` (`brand.7` → `brand.9`,
  180deg) and renders its text in white"*. Keep the rest of the sentence. Change no code line.
- **Verify:**
  - `npm.cmd run typecheck`, `npm.cmd run check:file-integrity` and `npm.cmd run check:mojibake` all exit 0.
  - Write `final-hashes-rev3a.txt`. Only the StatCard line may differ from `final-hashes-rev3.txt`.
  - Add one line to the session log.
  - No Storybook rebuild or probe re-run is needed: a comment changes no rendered output.
- This does not block approval. If it is not done by the approval review, it carries as an approval note.

### 20.2 Owner items (approval waits on both)

- **O889-1**: the §19.4 matrix, rows 1, 1a, 1b and 3. Rows 2 and 4 were already accepted.
- **O889-2**: §17.1, option A or B.

Status: `PARTIALLY VERIFIED`. The approval review follows once the owner has returned both.

## 21. Review 6 — 🔁 NEEDS REVISION (2026-09-28): owner returned O889-1 row 1, the fixed sparkline size — revision 4

§21 supersedes §20.2. §20.1 is folded into §21.3 and becomes mandatory.

### 21.1 Owner result, verbatim (O889-1, 2026-09-28)

| Row | Result | Owner's words |
|---|---|---|
| 1 Sparkline, and 1b WithChart, which renders the same component | ❌ returned | *"я не приймаю, DashboardSparkline - це тупо захардкоджений розмір графіку, який не адаптується під мобільні екрани!"* |
| 1a AllZero · 3 Accent | not answered | Shown again in §21.6 |

### 21.2 Cause and native fix (reviewer probe, FACT)

- **Cause.** This was an orchestrator design defect. §12's width contract said *"Sparkline story: the component's own
  role width"*, and §18.2 kept the 154×95 canvas. `MantineDashboardSparkline.tsx:85-86` sets
  `w={theme.other.dashboardChart.sparklineWidth}` (154) and `h={…sparklineHeight}` (95) at every width.
  - Measured on the rev3 `storybook-static`: the chart is 154px wide at 320, 390, 768, 1024 and 1440.
  - Its container's content box meanwhile is 288 / 358 / 720 / 976 / 1392px in the standalone `Default` story.
  - In `WithChart` it is 246 / 316 / 310 / 186 / 290px.
  - In `WithChart` at 390 the chart sits under the text and covers 154 of 316px. The bars are 8.9px at every width.
- **Canonical convention it broke.** `MantineDashboardBarChart.tsx:208` and `MantineDashboardLineChart.tsx:203`
  give only a height token (`h={theme.other.boxSize.dashboardChartMinHeight}`) and let ApexCharts fill the width
  (`width="100%"`). ApexCharts 7.4.0 ships `chart.redrawOnParentResize: true` by default, so no resize code is needed.
- **Probe of the fix.** Same build, done in the page only: the chart root set to `width: 100%` with a 154px minimum,
  and to `flex: 1 1 0` in the card's row layout.
  - Standalone `Default`: the chart width equals the container's content width at all 5 widths.
  - `WithChart`, en and uk: under the text at 320, 390 and 1024, where it takes the full content width (246 / 316 /
    186). Beside the text at 768 and 1440, where it fills the rest (en 194 / 174, uk 205 / 185).
  - The placement at each width is the same as rev3, which is row 2 as the owner accepted it. The document never
    overflows, the height stays 95, and the bars are 14–18px on a phone.
- **Height stays a token (95).** This follows the bar and line chart convention: a fixed height token, a fluid width.
  The owner's complaint is about width adaptation. Height is not changed.

### 21.3 R12 — the sparkline fills its container (the change)

1. **`theme.ts`.** Rename `sparklineWidth` to `sparklineMinWidth` in both the type line and the value line. The value
   stays `154`. Both comments read: *"Task 889 rev 4 (O889-1 row 1): minimum sparkline width (Lahomes KPI canvas,
   D78-9); the chart fills its container above it"*. `sparklineHeight` is unchanged.
2. **`MantineDashboardSparkline.tsx`.**
   - The root `Box` becomes `w="100%" miw={theme.other.dashboardChart.sparklineMinWidth}
     h={theme.other.dashboardChart.sparklineHeight}`. Keep `ReactApexChart`'s `width="100%" height="100%"`.
   - Add no resize listener, `ResizeObserver` or `redrawOn*` option: the library default does this.
   - The JSDoc says the chart fills its container's width, with a floor of 154px, at a fixed 95px height, like the
     bar and line charts. The rev2 tooltip comment drops "inside the 154×95 sparkline canvas".
3. **`MantineDashboardStatCard.tsx`**, chart branch only.
   - Wrap `{chart}` in `<Box w={{ base: '100%', xs2: 'auto' }} flex={{ base: '0 0 auto', xs2: '1 1 0' }}>`. In the
     row layout the slot then grows into the space beside the text; when it wraps, or in the base column layout, it
     takes the full content width. The `Flex` props themselves stay unchanged.
   - Mantine style props only: no `style` object and no CSS file. If Mantine does not accept a responsive `flex`
     style prop, stop and return `BLOCKED` with the evidence. Do not substitute anything else.
   - JSDoc:
     - lines 33–37 and 70–75: replace "the sparkline's fixed 154px" with the new contract (a 154px minimum; the slot
       grows);
     - lines 39–40 (§20.1): *"`'accent'` fills the card with `theme.other.accentHeroGradient` (`brand.7` →
       `brand.9`, 180deg) and renders its text in white"*.
4. **`DashboardSparkline.stories.tsx`.**
   - All three exports replace `<Box px={{ base: 'md', sm: 'xl' }} py="md">` with
     `<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">`. This is the same KPI-cell grid as
     `DashboardStatCard.stories.tsx` and cites it in a comment. It is breakpoint-keyed and has no fixed width, which
     meets GR-3b.
   - Drop the now-unused `Box` import.
   - `Default`'s `play` adds this assertion, inside the existing `waitFor`: the rounded width of `[role="img"]`
     equals the rounded `clientWidth` of its grid cell, and the rounded width of `svg.apexcharts-svg` equals that
     same value.
5. `WithChart`, `Accent`, `MantineDashboardBarChart.tsx`, `DashboardBarChart.stories.tsx` and the manifest stay
   byte-identical to `final-hashes-rev3.txt`.

### 21.4 Acceptance for revision 4

- **AC10 (R12), width contract.** A Playwright probe against the rebuilt `storybook-static`, en and uk, at 320 / 390 /
  768 / 1024 / 1440, `networkidle` plus 1000ms.
  - `DashboardSparkline` `Default`, `AllZero` and `ThirtyDays`: the chart root width and the `svg.apexcharts-svg`
    width each equal the grid cell's content width, rounded. Height 95. The document does not overflow.
  - `DashboardStatCard` `WithChart`: the placement at each width equals §21.2: under at 320, 390 and 1024, beside at
    768 and 1440.
    - When under: the chart width equals the card's content width, rounded.
    - When beside: the chart's right edge equals the content box's right edge, rounded, and its left edge is at
      least the text stack's right edge plus the `md` gap.
    - At every width the chart is at least 154px wide and the document does not overflow.
  - **Resize arm.** Load `WithChart` en at 1440, resize the viewport to 390 without reloading, and wait 1000ms. The
    chart width now equals the new card content width. This proves the library's own redraw.
  - Record a table per tuple.
- **AC9-R4, tooltip.** The chart geometry changed, so this is re-run. The rules, violation definition, hover points
  and `.apexcharts-active` requirement are those of §18.4. Tuples:
  - `Default` and `ThirtyDays` at 390 and 1440, en and uk;
  - `AllZero` at 1440, en: 0 active, 0 page errors (§19.2);
  - `WithChart` at 320 / 390 / 768 / 1024 / 1440, en and uk.

  Required: 0 violations. Output: `ac9-tooltip-results-rev4.json`.
- **AC11, rename complete.** `git grep -n --untracked sparklineWidth -- src` prints nothing. `--untracked` is
  required because `MantineDashboardSparkline.tsx` is untracked (the Task 864 lesson).
- **AC7-R4.** Re-capture `*.after-rev4*`, compare it with `compare-ac7-rev3.mjs`'s normaliser, and expect
  `IDENTICAL` ×2. Neither consumer renders a sparkline or a `chart` slot.
- **GR-4 AC AUDIT** — 4 criteria. Each states an observable property. Absolutes: the AC11 zero-hit grep, which is a
  property of a correct rename.

### 21.5 Re-entry, scope and order

- **Mode `remediation`.** Reuse, and never overwrite, every I0, `-rev1`, `-rev2`, `-rev3` and `ac7-before` artifact.
  New artifacts take the `-rev4` suffix.
- **Files:**
  - `theme.ts` (the token rename and its two comments);
  - `MantineDashboardSparkline.tsx`;
  - `MantineDashboardStatCard.tsx` (the chart wrapper and the three JSDoc passages);
  - `DashboardSparkline.stories.tsx`;
  - the session log (a new "Revision 4" section);
  - the 889 line of `docs/backlog.md`.
- **Order:**
  1. the edits;
  2. `npm.cmd run typecheck`;
  3. `npm.cmd run build-storybook`;
  4. AC10;
  5. AC9-R4;
  6. AC11;
  7. AC7-R4;
  8. `npm.cmd run check:locale-leak:mantine-only`, quoting zero lines for the three task stories;
  9. the full §13.2 block tee'd to `*-rev4.txt`, including `npm.cmd run build` and `final-hashes-rev4.txt`.
- **Receipts:**
  - GR-0 for the token rename: EXTEND `theme.other.dashboardChart`, following the bar and line chart convention; no
    new value.
  - GR-3b for all three sparkline stories and `WithChart`, at 320 / 390 / 1024 / 1440, with the chart width against
    its container.
  - GR-3c: `n/a`, no text changed. Record the compact tooltip's computed font size.
  - GR-1: `check:surface-census` for `MantineDashboardSparkline.tsx` and `MantineDashboardStatCard.tsx`.
  - The final hashes.

### 21.6 Owner re-check after revision 4 (O889-1). Replaces §19.4.

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardSparkline` | Default / ThirtyDays | 390 / 1440 | en / uk | the chart fills its cell at every width; the tooltip sits beside the cursor, never over the bar, never cut off |
| 1a | `Patterns/Mantine/DashboardSparkline` | AllZero | 1440 | en | no tooltip (§19.2) |
| 1b | `Patterns/Mantine/DashboardStatCard` | WithChart | 390 / 1024 / 1440 | uk | under the text and full-width at 390 and 1024; beside the text and filling the rest at 1440 |
| 3 | `Patterns/Mantine/DashboardStatCard` | Accent | 1440 / 390 | en / sq | the coral gradient card (light top → dark bottom), legible white text |

**O889-2** (§17.1) is still owed at approval.

Status to return: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 22. Review 7 — 🟡 PARTIALLY VERIFIED (2026-09-28): revision 4 is accepted; only the owner items remain

§22 supersedes §21.6's status line. The reviewer's evidence was produced on win32 v22.22.3 against the final
`storybook-static`. Its `index.json` is dated 13:52:04, which is newer than every changed source file.

- **Hashes.** The 8 current `hash-object` values equal `final-hashes-rev4.txt`. `MantineDashboardBarChart.tsx`,
  `DashboardBarChart.stories.tsx`, `DashboardStatCard.stories.tsx` and the manifest equal `final-hashes-rev3a.txt`.
- **R12 / AC10: verified by the reviewer's own probe**, not by the executor's. The executor ran AC10 at 12:23 and
  AC9-R4 at 12:28. Both runs predate the last edits to `MantineDashboardSparkline.tsx` (12:29:53) and
  `DashboardSparkline.stories.tsx` (12:30:02). The reviewer re-ran both against the final build, so the reviewer runs
  below supersede those two executor artifacts.
  - `DashboardSparkline` `Default`, `AllZero` and `ThirtyDays` were measured in en and uk at 320, 390, 479, 480, 640,
    768, 1024, 1280 and 1440.
    - At every tuple, the `[role="img"]` width equals both the `svg.apexcharts-svg` width and the grid track.
    - The height is 95. There is no document overflow, no error display and 0 page errors.
    - `Default`'s `play` passes at every tuple.
  - `DashboardStatCard` `WithChart` was measured in sq, en, uk and it at the same 9 widths.
    - **Placement.** The chart sits under the text at 320, 390, 479, 1024 and 1280, and also at 640 in en, uk and it.
      It sits beside the text at 480, 768 and 1440, and also at 640 in sq.
    - **Under.** The chart is 2px narrower than the padding box. That is the card's 1px border on each side.
    - **Beside.** The chart's right edge is 1px inside the content edge. Its left edge is at least the text's right
      edge plus 16px.
    - **Minimum.** The chart is at least 154px wide everywhere. The narrowest case is sq at 640, where it is 156px.
    - **Clipping.** The card's `scrollWidth` equals its `clientWidth` at every tuple, so nothing is clipped.
  - **Resize arms** (no reload). All three match the static loads:
    - 1440 → 390: 174 → 316;
    - 390 → 1440: 316 → 174;
    - 1440 → 1024: 174 → 186, under the text.
- **AC9-R4: verified.** The reviewer re-ran the executor's `ac9-tooltip-probe-rev4.mjs`, unchanged, against the final
  build. Result: 19 tuples, 0 violations and 0 page errors. `AllZero` is active 0/7 times.
- **AC11: verified.** The `--untracked` grep for `sparklineWidth` in `src` prints nothing.
- **AC7-R4: verified.** `compare-ac7-rev4.out.txt` reads `IDENTICAL` ×2, exit 0.
- **§13.2 block, rev4.** Every gate exits 0 except `check:locale-leak:mantine-only`. That gate exits 1 on the
  pre-existing Task 836 findings and has no findings for the three task stories. `build-rev4.txt` exits 0.
- **The flagged deviation is accepted.** The executor added
  `miw={{ base: 0, xs2: theme.other.dashboardChart.sparklineMinWidth }}` to the §21.3.3 chart wrapper.
  - **Cause: an orchestrator defect in §21.3.3.** §21.2's probe put the 154px minimum on the flex item itself.
    §21.3.3 moved the flex props onto a new wrapper `Box` and left that minimum off. The wrapper therefore kept the
    default `min-width: auto`, and the line-wrap decision lost the floor it needs.
  - **GR-0.** The added prop is a Mantine style prop that reads an existing theme token, so it adds no new visual
    value.
  - **Computed values.** From `xs2` up: `min-width: 154px` and `flex: 1 1 0px`. Below `xs2`: `min-width: 0px` and
    `flex: 0 0 auto`.
- **GR-3b.** `DashboardSparkline.stories.tsx` uses only `SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md"`. It has no
  fixed-width container, no `style` object and no viewport pin. `DashboardStatCard.stories.tsx` is unchanged.
- **GR-3c.** No text changed.

### 22.1 Owner items (approval waits on both)

- **O889-1**: the §21.6 matrix, rows 1, 1a, 1b and 3. Rows 2 and 4 were accepted earlier.
- **O889-2**: §17.1, option A or B. Under option A, the 889 hunks in `theme.ts` are now:
  - the `MantineGradient` type import;
  - `sparklineMinWidth` / `sparklineHeight` (type and value lines);
  - `accentHeroGradient` (type and value lines).

  `sparklineMinWidth` replaces the `sparklineWidth` name that §17.1 uses.

Status: `PARTIALLY VERIFIED`. The approval review follows once the owner has returned both items.
