# Session Archive: Task 889 — canonical dashboard sparkline, StatCard chart/accent, BarChart horizontal/stacked — 2026-09-27

Task: `tasks/Archive/Sprint_78_kickoff_prompt_Task_889_Dashboard_Sparkline_And_Chart_Pattern_Extensions.md`
Sprint 78 · P1 · Q3 · Executor: Sonnet (`claude-sonnet-5`)

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (superseded — see "Revision 3" at the end of this file)

**Review 1 (2026-09-27) returned `NEEDS REVISION`** — findings F1 (P1), F2 (P1), F3 (P2), F4 (P1).
Everything below this line (R1–R10, AC1–AC8, the original §13.2 gate block, "Real defect #1"/"#2")
was **accepted as delivered** by that review and is retained unchanged as the historical first pass —
review 1 itself states "Everything else stands." The current, superseding evidence is in "Revision 1"
at the end of this file and under `docs/sessions/evidence/task889/*-rev1.*`; the original
`docs/sessions/evidence/task889/*` artifacts (outside the `-rev1` suffix) are superseded, not deleted.

Every requirement (R1–R10) is implemented and every §13.2 command exits 0 (`check:locale-leak:mantine-only`'s
full 2340-render transcript is included, see "Real defect #2" below — its overall exit is 1, unrelated
pre-existing findings across the other 257 stories, per Task 836; the 3 task patterns have 0 findings
after the fix). Since this repo has no `test-storybook`/Storybook-vitest runner to execute `play()`
functions headlessly (checked: no such script in `package.json`) and the Chrome browser extension was
unavailable in this session (`tabs_context_mcp` returned "extension is not connected"), rendered
evidence was produced with a project-native Playwright script (`playwright@1.60.0` is already a repo
dependency, the same tool `scripts/check-locale-leak.mjs` and the responsive-screenshots scripts use)
against the built `storybook-static`. §13.4's owner visual matrix remains `OWNER VISUAL QA REQUIRED`
by design — Sonnet does not mark it passed/failed.

**Two real defects were found and fixed this session, both in the test code, not the product code** —
see "Real defect #1" and "Real defect #2" below. Both were found only because `check:locale-leak:mantine-only`
was left to actually finish instead of being treated as "known red, skip reading it": its own
automatic execution of every story's `play()` function (a side effect of it loading each story in a
real browser) surfaced a genuine, load-sensitive race condition my own hand-written verification
script had not caught. **Review 1 found the fixes were still incomplete — see "Revision 1" below.**

## I0 — platform line, status snapshot, re-measurement

```
win32 v22.22.3
```

`git status --porcelain` snapshot: `docs/sessions/evidence/task889/i0-status.txt` (pre-existing
working-tree changes from Task 854/886 were already present; none touched by this task).

I0 baseline hashes (five files to be edited):

| File | I0 hash |
|---|---|
| `MantineDashboardStatCard.tsx` | `ea35f5947fb66d8cc927d87eec9fb448206a4825` |
| `MantineDashboardBarChart.tsx` | `eb1a26491760ebd099d20e7b0aeb79c15fbc9688` |
| `theme.ts` | `c4a3550c79988748f430d4e0814c0babf6bfe0cc` |
| `DashboardStatCard.stories.tsx` | `ab4a83eb6b3d46bdac2ae850651269a2d3d097e3` |
| `DashboardBarChart.stories.tsx` | `554da6264221359a4d854a864fdcaf2e2832548b` |

Re-measured §3 facts (all confirmed unchanged from the kickoff):
- `grep -rn sparkline src/design-system --include=*.tsx -i` → only `MantineDashboardLineChart.tsx:136`
  (`sparkline: { enabled: false }`). No sparkline pattern exists.
- `grep -rln MantineDashboardBarChart src --include=*.tsx` (excl. stories/patterns) → one doc-comment
  hit in `MantineDashboardRadar.tsx:55`, not an import. No production consumer.
- `patterns/index.ts` exports every sibling `MantineDashboard*` pattern (barrel), confirming the new
  `MantineDashboardSparkline` export belongs there too.

## Requirement evidence

| Req | Evidence |
|---|---|
| R1 | `src/design-system/mantine/patterns/MantineDashboardSparkline.tsx` (new): `data`/`color`/`valueLabel`/`dateLabel`/`ariaLabel` props; ApexCharts `bar` chart, `chart.sparkline.enabled: true`, `toolbar.show: false`; `plotOptions.bar.columnWidth`/`borderRadius` read from `theme.other.dashboardChart.barColumnWidth`/`barRadius` (reused, not new ratios); native tooltip `x`/`y` formatters call `dateLabel`/`valueLabel`; `w`/`h` from the two new theme roles; `data.length === 0` returns `null`; wrapper `role="img"` `aria-label={ariaLabel}`; same `ReactApexChart` dynamic-import path and `resolveThemeColor` helper as `MantineDashboardBarChart.tsx`. |
| R2 | `theme.ts` — `sparklineWidth: 154` / `sparklineHeight: 95` added to the `dashboardChart` type block (`:294-296` region) and the value block, each with the exact comment text from R2. `git grep -n "sparklineWidth\|sparklineHeight" -- src/design-system/mantine/theme.ts` → one type line + one value line each (AC2). |
| R3 | `MantineDashboardStatCard.tsx` gains `chart?: ReactNode`. The former single `body` `Stack` now builds a `textStack` first; when `chart` is set the ready/zero body wraps `textStack`+`chart` in `Flex direction={{ base: 'column', xs2: 'row' }} justify="space-between" align={{ base: 'flex-start', xs2: 'flex-end' }} gap="md"`; when absent, `body` renders `textStack` directly — the exact prior JSX shape. `loading`/`error` never read `chart`. |
| R4 | `variant?: 'default' \| 'accent'` (default `'default'`). `isAccent` drives: `Card` `bg="brand.8"` / `withBorder={!isAccent}`; icon badge `color="white"` (a separate `bodyIconBadge`, used only in the ready/zero body — `error`'s `iconBadge` is untouched, still gray); label/value/caption/zeroText `Text` `c={isAccent ? 'white' : ...}`. `loading`/`error` never read `variant`. |
| R5 | `MantineDashboardBarChart.tsx` gains `stacked?: boolean`; `isStacked = stacked ?? series.length > 1` (identical default to before). |
| R6 | `horizontal?: boolean` (default `false`). When true: `plotOptions.bar.horizontal: true` + `barHeight = theme.other.dashboardChart.barColumnWidth`; `xaxis.categories` unchanged; `xaxis.labels.formatter` → `valueLabel(Number(v))`; `yaxis.labels.formatter` → `categoryLabel(String(v))`; `grid.xaxis.lines.show = horizontal`, `grid.yaxis.lines.show = !horizontal`. No new y-axis width value added. |
| R7 | **Created** `DashboardSparkline.stories.tsx` (`Default`/`AllZero`/`ThirtyDays`). **Extended** `DashboardStatCard.stories.tsx` with `WithChart`/`Accent`; `DashboardBarChart.stories.tsx` with `Grouped`/`Horizontal`. One new i18n key (`storybook.mantine.dashboard_sparkline_aria_label`) added to all four locales; `Horizontal`'s 5 long category labels reuse the existing `storybook.listing.grid_1/3/4/5/6` fixture strings (no new fixture literal). All fixture dates are fixed ISO strings off the same `2026-07-30T00:00:00.000Z` anchor the sibling chart stories already use — no wall-clock values. |
| R8 | `scripts/mantine-migration-scope.json` +1 (`MantineDashboardSparkline.tsx`, same shape as siblings). `check:pattern-enrolment` and `check:story-coverage` both exit 0 (below). |
| R9 | Neither `AdminDashboardView` nor `AgentStatisticsView` passes `chart`/`variant` (`grep -n "chart=\|variant=\"accent\""` on both files → no output). Both Stories' `#storybook-root` `outerHTML` captured before/after this task's file changes (via an isolated git-blob-reverted rebuild) are **byte-identical** once ApexCharts'/Mantine's own per-mount random ids are normalised — see "AC7 before/after proof". |
| R10 | `git --no-optional-locks grep --untracked -n -E "className=\|components/ui/\|style=\{\|#[0-9a-fA-F]{3,8}\b\|[0-9]+px\|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardSparkline.tsx src/stories/patterns/mantine/DashboardSparkline.stories.tsx` prints nothing (grep exit 1 = no match, its documented no-match behaviour — not a command failure). `check:design-tokens:strict` exits 0. |

## Current versus required behavior

**Before.** No sparkline pattern existed. `MantineDashboardStatCard` had no chart slot and no filled
variant. `MantineDashboardBarChart` always stacked ≥2 series and only drew vertical columns.
**After.** The four contracts in the kickoff's §4 exist, each with its own Story; every existing
export of both extended Stories, and both production consumers, are unchanged (R9, verified below).

## Files Changed

| File | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineDashboardSparkline.tsx` (new) | R1 — canonical KPI mini bar chart |
| `src/design-system/mantine/patterns/index.ts` | Barrel export for the new pattern (sibling convention) |
| `src/design-system/mantine/theme.ts` | R2 — `sparklineWidth`/`sparklineHeight` roles |
| `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` | R3/R4 — `chart` slot, `accent` variant |
| `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx` | R5/R6 — `stacked`, `horizontal` |
| `src/stories/patterns/mantine/DashboardSparkline.stories.tsx` (new) | R7 — `Default`/`AllZero`/`ThirtyDays` |
| `src/stories/patterns/mantine/DashboardStatCard.stories.tsx` | R7 — `WithChart`/`Accent` added |
| `src/stories/patterns/mantine/DashboardBarChart.stories.tsx` | R7 — `Grouped`/`Horizontal` added |
| `scripts/mantine-migration-scope.json` | R8 — enrol the new pattern |
| `messages/{en,sq,uk,it}.json` | R7 — `dashboard_sparkline_aria_label` key, all 4 locales |
| `docs/backlog.md` | Concise 889 state update |

Final hashes (`git hash-object`), all 8 task-owned paths:

```
b862df8a218a05f9e8e2a7bd75e27518ed1ac1f0  MantineDashboardSparkline.tsx
fe701ba76588b393221fa2eae738a8b66c897f32  MantineDashboardStatCard.tsx
46b5f08e1b17618d1fa1db0e56a21cf65022129c  MantineDashboardBarChart.tsx
6954ab3aaf583eaa8df311ae5c7122f56bea173c  theme.ts
e3287118eb803eae0125ee96a5f5b7a9b2f1fd8c  DashboardSparkline.stories.tsx
29a6fbd78bbf13b571b7e01764a81bc58442a0fb  DashboardStatCard.stories.tsx
eeeb95beeb01187ee198bd759c65764e83380ad1  DashboardBarChart.stories.tsx
0664e833bd9fe8e9a2555576fbf955d2d65aae74  mantine-migration-scope.json
```
(`docs/sessions/evidence/task889/final-hashes-v3.txt`. The two Story-file hashes moved twice across
this session: once when the `getAttribute` bug was fixed ("Real defect #1"), and again when the
`waitFor`/locale-hardcode race condition was fixed ("Real defect #2"). Every gate in "Validation
evidence" below was re-run against this final content.)

## Validation evidence

§13.2 final gate block, every command tee'd to `docs/sessions/evidence/task889/<name>.txt` with exit code:

| Command | Result |
|---|---|
| `node -p platform+version` | `win32 v22.22.3` |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (94 pre-existing warnings, 0 errors, none in task files) |
| `npm run check:i18n` | exit 0 — 2460 keys, all 4 locales match |
| `npm run check:stories` | exit 0 — 177 files, 0 violations |
| `npm run check:story-coverage` | exit 0 — 110/110 manifest entries proven |
| `npm run check:pattern-enrolment` | exit 0 — 53 pattern files, all enrolled |
| `npm run check:design-tokens:strict` | exit 0 — 0 violations |
| `npm run check:enrolled-tailwind` | exit 0 — matches versioned baseline (2 pre-existing entries, neither in task scope) |
| `npm run check:rendered-scope` | exit 0 — 0 new edges |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | exit 0 — 0 new/stale blocks |
| `node scripts/check-surface-census.mjs --surface .../MantineDashboardSparkline.tsx` | exit 0 — `manifest:yes story:yes` (AC6) |
| `npm run build-storybook` | exit 0 |
| `npm run build` | exit 0 |
| `npm run check:file-integrity` | exit 0 — 140 files clean |
| `npm run check:mojibake` | exit 0 — 0 artifacts / 7263 files |
| AC8 `git grep` | prints nothing (exit 1 = no match) |
| `npm run check:locale-leak:mantine-only` | exit **1** overall — see below |

All rows above were re-run against the final content (post both defect fixes) and are individually
retained as `docs/sessions/evidence/task889/*-v3.txt` (or `-final.txt` for the ones re-run once,
`-v3.txt` for the ones re-run twice).

**`check:locale-leak:mantine-only`** (known red overall, Task 836) ran to completion once, against
the **pre-fix** content — full transcript `docs/sessions/evidence/task889/check-locale-leak.txt`
(2340 renders, ~95 minutes). Its overall exit is **1**, but every failing finding belongs to one of
the other 257 stories already in the repo (`grep -c "Story: "` on the transcript shows dozens of
pre-existing findings — e.g. `AuthSheet/Login`'s `"Google"`, `SaveSearchButton/Pending`'s
`"Unauthorized"` — none touched by this task). The three task-owned story files, **at the time this
scan ran**, showed the AssertionErrors described in "Real defect #2" below, not a locale-leak finding
— `grep -i "dashboardsparkline\|dashboardstatcard\|dashboardbarchart"` on the transcript. Both defects
found there were fixed after this run; re-running the full 95-minute scan a second time to get a
clean transcript for the exact final content was not done in this session (time cost) — see "Real
defect #2" for the faithful, repeated (96/96 clean across 3 runs) reproduction of its exact failure
mechanism against the fixed content instead. **Opus/owner: re-running
`npm run check:locale-leak:mantine-only` once against the final commit is the one thing this session
could not itself close out.**

### AC verification (Playwright against `storybook-static`, browser extension unavailable)

No `test-storybook`/Storybook-vitest runner exists in this repo (`grep -n '"test' package.json` has
no such script), so a story's `play()` function is never executed by any `npm run` command **except**
`check:locale-leak:mantine-only`, as a side effect of it loading every story in a real browser (see
"Real defect #2" — this is exactly how that command caught what this section's own harness missed).
Evidence for the acceptance criteria was produced with the repo's own `playwright@1.60.0` dependency
(`docs/sessions/evidence/task889/verify-ac.mjs`), which re-runs each `play()` function's literal
assertions against the built `storybook-static`:

```
18/18 passed — docs/sessions/evidence/task889/verify-ac-results.txt
```

including `AC4: contrast ratio >= 4.5 (actual 5.22)` — the exact ≈5.2:1 the kickoff's §3 computed for
`brand.8`. Re-run once more after both defect fixes below, still 18/18.

### Real defect #1 — `getAttribute` on an SVG `<path>` always reads `null`

The first-pass `play()` functions for `Grouped`/`Horizontal` read `getAttribute('x'/'width'/'height')`
on `.apexcharts-bar-area` elements. A DOM inspection (`docs/sessions/evidence/task889/inspect-bar-dom.mjs`)
showed ApexCharts draws each bar as an SVG `<path d="…">` with no `x`/`width`/`height` attributes at
all — those three `getAttribute` calls always returned `null` (`Number(null) === 0`), so both
assertions would have silently "passed" on fabricated zeros instead of real geometry. Fixed to read
`getBoundingClientRect()` instead (real rendered geometry); re-verified — see `verify-ac-results.txt`.

### Real defect #2 — a load-sensitive race + a locale-hardcoded assertion, caught only by letting `check:locale-leak:mantine-only` finish

**This is the more serious of the two, and it is why the "known red, non-deterministic" gate must
still be read to completion rather than skipped.** `check:locale-leak:mantine-only`'s own transcript
(`docs/sessions/evidence/task889/check-locale-leak.txt`, lines ~1270–1430) showed `Grouped`,
`Horizontal`, `Default` and `AllZero` all rendering **Storybook's own error boundary** ("The component
failed to render properly…") with `AssertionError: expected +0 to be 2/5/7` traces pointing at my own
`play()` functions — the exact opposite of the "18/18 passed" result `verify-ac.mjs` had reported
minutes earlier against the same build.

**Root cause, two distinct bugs:**
1. `ReactApexChart` is a client-only dynamic import (`next/dynamic(..., { ssr: false })`). Storybook's
   own automatic `play()` invocation runs immediately after the initial mount — before the dynamic
   chunk resolves and ApexCharts draws its SVG. `verify-ac.mjs` never hit this because it added its
   own manual `page.waitForTimeout(400–500)` *before* re-implementing the assertions, which happened
   to be enough on a lightly-loaded machine; `Default`/`OneSeriesHidden`'s **existing**, pre-889 `play()`
   functions never hit it either, because they only ever asserted on the legend buttons (a sibling
   component rendered synchronously, not gated by the dynamic import) — this is the first task to
   assert directly on `.apexcharts-bar-area`, so the gap was structurally invisible until now.
2. `DashboardSparkline/Default`'s `play()` additionally compared the rendered `aria-label` against a
   **hardcoded** `storyT('en', ...)`, while `render()` sets `ariaLabel={storyT(l, ...)}` for the
   **active toolbar locale** — so the assertion was always wrong for `sq`/`uk`/`it`, deterministically
   (not load-sensitive), exactly matching the transcript's PASS-on-`en`/FAIL-on-`sq`/`uk`/`it` pattern.

**Fix:** every `.apexcharts-bar-area` count assertion is now wrapped in
`await waitFor(() => expect(...).toBe(n), { timeout: 5000 })` (`storybook/test`'s `waitFor`, the same
pattern `DashboardPeriodControl.stories.tsx` already uses for its own async-rendered popup content),
and the sparkline's aria-label assertion reads `globals.locale` from the `play()` context instead of a
fixed string.

**Re-verification, since the failure was load-sensitive and a single clean run would not be
convincing:** `docs/sessions/evidence/task889/stress-test-play.mjs` replays `check-locale-leak.mjs`'s
own exact navigation shape (`page.goto(..., {waitUntil:'networkidle'})` then a bare 300ms settle wait,
no extra help) against the rebuilt `storybook-static`, 8 times per story across all 4 locales, and
checks for the literal absence of Storybook's error-boundary text. **Before the fix: 26/32 clean (the
6 failures were all `DashboardSparkline/Default` on `sq`/`uk`/`it`, twice over — the deterministic
bug).** After both fixes: **32/32, 32/32, 32/32 clean across three separate runs (96/96 total)**,
still under the same elevated system load (`docs/sessions/evidence/task889/stress-test-results*.txt`).
`verify-ac.mjs`'s 18/18 was also re-confirmed against the final content.

### AC7 before/after proof

`AdminDashboardView`/`AgentStatisticsView` `#storybook-root` `outerHTML` was captured twice at 1440px:
once with `MantineDashboardStatCard.tsx`/`MantineDashboardBarChart.tsx`/`theme.ts` reverted to their
I0 git blobs (and the new Sparkline pattern/story/barrel-export temporarily removed, since neither
consumer imports it) — the true pre-Task-889 render — and once with this task's content restored.
Both builds compiled clean (`ac7-before/build-storybook-before.txt`, `…-after.txt`, both exit 0).
After normalising every per-mount random id (ApexCharts' generated clip-path/gradient ids, Mantine's
`useId()` control ids), both files are **byte-identical**:

```
AdminDashboardView IDENTICAL
AgentStatisticsView IDENTICAL
```

(`docs/sessions/evidence/task889/capture-ac7.mjs`, raw and normalised HTML retained under
`docs/sessions/evidence/task889/ac7-before/`.)

### GR-3b/GR-3c — code-level receipt, no fixed containers; live measurement via Playwright

No `w`/`maw`/`miw` numeric/token container, `style` object, or `globals.viewport` pin exists in any
of the 5 new/changed exports (`Default`/`AllZero`/`ThirtyDays`/`WithChart`/`Accent`/`Grouped`/
`Horizontal`) — confirmed by direct inspection of the written JSX (no such prop appears). Per the
kickoff's width contract, `StatCard`/`BarChart` stories are fluid `Box`/`SimpleGrid` with no `maw`;
the sparkline story uses only the component's own intrinsic 154×95 role size, no wrapping container.

Live rendered measurement (320/390/768/1024/1440), Playwright against `storybook-static`
(`docs/sessions/evidence/task889/measure.mjs`, full data in `gr3b-gr3c-measurements.json`):

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardsparkline--default: 320 154/320 · 390 154/390 · 768 154/768 · 1024 154/1024 · 1440 154/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.` (the sparkline's own fixed 154px canvas is the role's own value, not a Story container — confirmed unchanged at every width, exactly per its fixed-size chart contract, same as the sibling donut/radial charts' own fixed canvas.)

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--with-chart: 320 288/320 · 390 358/390 · 768 360/768 · 1024 236/1024 · 1440 340/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.` (card width tracks the fluid `SimpleGrid` cell — 1 col below `sm`, 2 at `md`(768) minus gutter/gap, 4 at `lg`(1024/1440); AC3's chart-beside-value vs chart-below-value split is proven at all four widths in "AC verification" above.)

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--accent: 320 288/320 · 390 358/390 · 768 360/768 · 1024 236/1024 · 1440 340/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardbarchart--grouped: 320 288/320 · 390 358/390 · 768 736/768 · 1024 992/1024 · 1440 1408/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardbarchart--horizontal: 320 288/320 · 390 358/390 · 768 736/768 · 1024 992/1024 · 1440 1408/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`overflowElements` in the raw JSON (elements with `scrollWidth > clientWidth`) never exceeds the
count already present in the unrelated Storybook chrome/toolbar at that width (2 at every width for
the sparkline/StatCard stories, matching the Accent story's own baseline of 0 plus Storybook's fixed
2; the bar-chart stories' 1/8 count is the ApexCharts SVG's own internal scroll containers, not a
page-level horizontal scrollbar) — no in-card overflow was introduced.

Per **GR-3c**, only the pre-existing `StatCard` value text (unchanged `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}`,
already compliant, not touched by this task's props) and the ApexCharts library-default axis labels
(no `fontSize` set — R6 leaves this untouched per the kickoff) render text in scope; the type-scale
table's own row for both is "unchanged". `MantineDashboardBarChart/Grouped` and `/Horizontal`
measured `20px` for their card title heading at every width (`headingFontSizes` in the raw JSON) —
the existing `MantineDashboardCard` title, itself unchanged by this task, already responsive and
`<24px`.

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--with-chart/--accent: value 320 20px(h5) · 768 24px(h4) · 1440 30px(h3) [unchanged, Task 886 §4.1's own row]; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` — measured indirectly (this task adds no new text element; the StatCard value's `fz` prop is unchanged code, and Task 886's own prior measurement already covers it).

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-dashboardbarchart--grouped/--horizontal: card title 320 20px · 390 20px · 768 20px · 1440 20px; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| KPI mini bar chart | `MantineDashboardSparkline` (new) | `.apexcharts-bar-area` | `theme.other.dashboardChart.{sparklineWidth,sparklineHeight,barColumnWidth,barRadius}` | Change (create) | R1/R2, AC1/AC2 |
| StatCard chart slot layout | `MantineDashboardStatCard` `Flex` | n/a (Mantine layout prop) | `theme.spacing.md`, breakpoint `xs2` | Change | R3, AC3 |
| StatCard accent fill | `MantineDashboardStatCard` `Card`/`ThemeIcon`/`Text` | n/a | `brand.8`, `white` | Change | R4, AC4 |
| StatCard default chrome (icon gray, border, `gray.5`/`gray.8` text) | same file, non-accent path | n/a | `gray.*` (unchanged) | Preserve | AC7 (byte-identical outerHTML) |
| Bar chart grouped columns | `MantineDashboardBarChart` `plotOptions.bar` | `.apexcharts-series` | `chart.stacked` (now conditional) | Change | R5, AC5 |
| Bar chart horizontal orientation | same file | `.apexcharts-bar-area` | `theme.other.dashboardChart.barColumnWidth` reused as `barHeight` | Change | R6, AC5 |
| Bar chart default stacked/vertical | same file, `horizontal`/`stacked` both undefined | n/a | unchanged | Preserve | AC5 "Default still renders stacked", AC7 |

## Canonical UI decision record

Re-verified (independently, not merely re-stated) against the kickoff's own §15 receipts:

`GR-0 CANONICAL REUSE PREFLIGHT — request: KPI mini-bar chart; KPI card with a chart; filled hero KPI card; horizontal and grouped bars; semantic queries: "sparkline", "chart|spark" in patterns, MantineDashboardStatCard props, MantineDashboardBarChart plotOptions; inspected candidates: MantineDashboardLineChart.tsx (sparkline explicitly disabled, carries axes/legend chrome — re-confirmed :136), MantineDashboardBarChart.tsx (Patterns/Mantine/DashboardBarChart, re-confirmed no consumer), MantineDashboardStatCard.tsx (Patterns/Mantine/DashboardStatCard), MantineDashboardRadialProgress.tsx; decision: CREATE (sparkline) + EXTEND (StatCard chart/variant, BarChart horizontal/stacked); selected canonical owner: the three pattern files; Mantine/TailAdmin token path: theme.other.dashboardChart.* (+2 new measured roles), brand tuple (brand.8), TailAdmin §6u; new hardcoded visual values: NONE; rationale: re-confirmed identical to the kickoff's own preflight — no additional candidate existed at execution time.`

`GR-3a STORY PREFLIGHT — MantineDashboardSparkline × 3 states; canonical candidates: NONE; decision: CREATE; target: Patterns/Mantine/DashboardSparkline (created). — MantineDashboardStatCard × chart/accent; canonical candidate: patterns-mantine-dashboardstatcard (DashboardStatCard.stories.tsx, direct import confirmed at :6); decision: EXTEND (added `WithChart`/`Accent` to the same file). — MantineDashboardBarChart × grouped/horizontal; canonical candidate: patterns-mantine-dashboardbarchart (direct import confirmed at :7); decision: EXTEND (added `Grouped`/`Horizontal` to the same file).`

`GR-1 CENSUS COMPLETE — pattern task, no route surface: tier1 1 created (MantineDashboardSparkline) + 2 extended enrolled+storied (MantineDashboardStatCard, MantineDashboardBarChart); tier2 0; tier3 0 listed and filed as none.`

`GR-3 STORY PROVEN — MantineDashboardSparkline ← src/stories/patterns/mantine/DashboardSparkline.stories.tsx; MantineDashboardStatCard ← src/stories/patterns/mantine/DashboardStatCard.stories.tsx; MantineDashboardBarChart ← src/stories/patterns/mantine/DashboardBarChart.stories.tsx.`

## Implementation validation notes

Two real defects found and fixed this session, both in the new **test code** (the `play()` functions),
not the product components — see "Real defect #1" and "Real defect #2" above for the full detail:

1. `Grouped`/`Horizontal` read non-existent SVG attributes (`getAttribute('x'/'width'/'height')` on an
   ApexCharts `<path>`), which would have silently "passed" on `0`/`NaN` regardless of the actual
   rendered geometry. Found by directly inspecting the live DOM rather than trusting the attribute
   names by analogy with a `<rect>`-based chart.
2. All four bar-count assertions raced against ApexCharts' async dynamic-import + draw — invisible to
   my own hand-written verification script (which added its own generous wait first) but real and
   load-sensitive, and `DashboardSparkline/Default`'s aria-label assertion was hardcoded to `'en'`
   regardless of the active toolbar locale — a deterministic bug. **Both were found only because
   `check:locale-leak:mantine-only` was let run to completion** rather than dismissed as "known red";
   its own automatic `play()` execution (a side effect of loading each story in a real browser) is
   what surfaced them. Fixed with `waitFor` polling and a `globals.locale`-aware assertion; re-verified
   96/96 clean across three stress-test runs under the same system load that first exposed the bug.

No other gaps.

## Assumptions, deviations, and limitations

- **Tooling gap, not a code gap:** this repo has no headless `play()`-function runner as a first-class
  `npm run` command, and the Chrome browser extension was unavailable this session. All rendered/
  interaction evidence (AC1, AC3, AC4, AC5, AC7, GR-3b/GR-3c, and both defects above) was produced with
  a native Playwright script against the built `storybook-static`, retained under
  `docs/sessions/evidence/task889/`. This is real rendered browser evidence (Chromium via Playwright),
  not a simulation, but it is not the Chrome-extension path the skill's tooling section names first.
- **`check:locale-leak:mantine-only` was not re-run to a clean finish against the final (post-fix)
  content** — only against the pre-fix content (where it caught Real defect #2) and, separately, via
  the faithful `stress-test-play.mjs` reproduction of its exact failure mechanism (96/96 clean). A full
  95-minute re-run for a clean end-to-end transcript was not completed in this session; see "Opus
  handoff".
- The two INFERENCE items in the kickoff's §5 (sparkline has no axes/legend; the xs2 breakpoint keeps
  the chart beside the value from 480px up) were not contradicted by anything found during
  implementation or measurement.
- No owner decision was required or made during execution.

## Opus handoff

- Everything in "Validation evidence" is machine-produced and retained under
  `docs/sessions/evidence/task889/`; the AC7 before/after proof and "Real defect #2" are the two
  artifacts most worth an independent look, since they stand in for tooling (Chrome extension /
  `test-storybook`) this session did not have, and #2 is a genuine, non-obvious, load-sensitive bug.
- **Please independently re-run `npm run check:locale-leak:mantine-only` once against the final commit
  and confirm its transcript has zero `dashboardsparkline`/`dashboardstatcard`/`dashboardbarchart`
  findings.** This is the one piece of required evidence this session produced only by faithful
  reproduction (`stress-test-play.mjs`) rather than by the exact command the kickoff names — Opus
  should not accept the reproduction as a substitute for actually running it once more.
- §13.4's `OWNER VISUAL QA REQUIRED` matrix (4 rows) is unchanged and still owed to the owner — this
  session's Playwright measurements are a substitute for the *acceptance-criteria* assertions, not
  for the owner's own visual judgement of the four rendered patterns.
- 890 and 891 are blocked on this task and can now proceed once approved.

## Backlog update

`docs/backlog.md` line 52 (the `854 · 889–891` row) updated: 889's `KICKOFF FILED` state marker
changed to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, no other text in that row touched. Resulting
active backlog: unchanged line count (single-row in-place edit). No `BACKLOG LIMIT BREACH`.

---

## Revision 1 (2026-09-27) — remediation of review 1 findings F1–F4

Re-entry mode `remediation` per kickoff §16.2. Reused without re-running: the I0 snapshot/hashes and
`ac7-before/*.before*.html` (never overwritten or rebuilt). Every new artifact carries a `-rev1`
suffix; nothing from the first pass was deleted.

### F1 — `MantineDashboardStatCard.tsx`: `Flex` now wraps

**Observed (review 1):** at 1024, `WithChart` gave a 236px card with a 40→228 content box; the
154px-wide sparkline overflowed it by 60px (`scrollWidth` 271 vs `clientWidth` 234). Root cause was
task design — §5's inference checked only the one-column 480px card, and R3's `Flex` had no wrap.

**Fix:** added `wrap="wrap"` to the chart-branch `Flex` in `MantineDashboardStatCard.tsx` — the one
prop kickoff §16.2 authorizes, nothing else in that component changed. Below the width where
text + gap + the sparkline's fixed 154px no longer fit, the chart now drops under the text instead of
overflowing.

**Re-verified (AC3, amended):** `docs/sessions/evidence/task889/ac3-f1-measurement.mjs` measured
`WithChart` at all 7 named widths (320/390/480/768/1024/1280/1440) against the rebuilt
`storybook-static`, settling ApexCharts' grow-in animation before each read. Every width: chart's
right edge ≤ the card's content-box right edge (card rect minus computed `padding-right`), and the
card's `scrollWidth` ≤ its `clientWidth`. **Quoted 1024 row**
(`docs/sessions/evidence/task889/ac3-f1-measurement-rev1.json`):

```json
"1024": {
  "cardRect": { "left": 16, "right": 252, "width": 236, "height": 317 },
  "paddingRight": 24,
  "contentBoxRight": 228,
  "scrollWidth": 234,
  "clientWidth": 234,
  "chartRect": { "left": 41, "right": 195, "top": 213.109375, "bottom": 308.109375, "width": 154, "height": 95 },
  "valueRect": { "left": 41, "right": 140.96875, "top": 133.015625, "bottom": 171.109375 }
}
```

`chartRect.right` (195) ≤ `contentBoxRight` (228); `scrollWidth` (234) = `clientWidth` (234) — no
overflow, and the chart sits below the value at this width (`chartRect.top` 213.1 ≥ `valueRect.bottom`
171.1), one of the two layouts R3/AC3 (amended) explicitly allows at 1024. At 480/768/1440 the chart
sits beside the value (`chartRect.left` ≥ `valueRect.right`); at 320/390 it sits below. Zero overflow
at any of the 7 widths.

### F2 — `DashboardBarChart.stories.tsx`: geometry assertions now awaited too

**Observed (review 1):** `Horizontal` still intermittently rendered Storybook's error boundary —
`AssertionError: expected 1 to be greater than 1` — 1/12 runs at a 7s settle and 3/20 at 1.5–6s. The
bar-*count* `waitFor` from the first pass was correct, but the *geometry* (widths/heights for
`Horizontal`, first-bar x for `Grouped`) was read immediately afterwards, while ApexCharts' own
grow-in animation was still running — every bar still shared the same width/height/x for a few frames
after the count was already correct. My "96/96 clean" first-pass stress test never exercised this
exact assertion under this exact timing.

**Fix:** the geometry checks for both `Grouped` and `Horizontal` now live inside their own
`waitFor(..., { timeout: 5000 })`, run after the existing count `waitFor` (which stays as-is):

```ts
// Grouped
await waitFor(() => expect(canvasElement.querySelectorAll('.apexcharts-bar-area').length).toBeGreaterThan(0), { timeout: 5000 });
const seriesGroups = canvasElement.querySelectorAll('.apexcharts-series');
expect(seriesGroups.length).toBe(2);
await waitFor(() => {
  const firstBarLefts = Array.from(seriesGroups).map((g) => g.querySelector('.apexcharts-bar-area')?.getBoundingClientRect().left);
  expect(firstBarLefts[0]).not.toBe(firstBarLefts[1]);
}, { timeout: 5000 });
```

```ts
// Horizontal
await waitFor(() => expect(canvasElement.querySelectorAll('.apexcharts-bar-area').length).toBe(HORIZONTAL_VALUES.length), { timeout: 5000 });
await waitFor(() => {
  const bars = canvasElement.querySelectorAll('.apexcharts-bar-area');
  const rects = Array.from(bars).map((b) => b.getBoundingClientRect());
  expect(new Set(rects.map((r) => Math.round(r.width))).size).toBeGreaterThan(1);
  expect(new Set(rects.map((r) => Math.round(r.height))).size).toBe(1);
}, { timeout: 5000 });
```

**Re-verified (§16.3 stress run):** `docs/sessions/evidence/task889/stress-test-play-rev1.mjs` loads
`Grouped` and `Horizontal` 10 times each in each of the 4 locales (80 loads total) against the rebuilt
`storybook-static` served on port 6009 (the exact port and navigation shape
`check-locale-leak.mjs` itself uses: `waitUntil: 'networkidle'`, then a bare 300ms settle, no extra
help), checking for the literal absence of Storybook's error-boundary text:

```
80/80 clean (no error boundary) — docs/sessions/evidence/task889/stress-test-results-rev1.txt
```

### F3 — `measure.mjs`'s own defect #1, and per-card (not whole-root) overflow

**Observed (review 1):** the original `measure.mjs` still read `getAttribute('x'/'width'/'height')`
on the `<path>` bars — the session's own "Real defect #1" pattern, reproduced in the measurement
tooling itself — so every `barRects` entry in `gr3b-gr3c-measurements.json` was a fabricated `0`. It
also only counted overflow across the whole root rather than per card.

**Fix:** `docs/sessions/evidence/task889/measure-rev1.mjs` reads `getBoundingClientRect()` for every
bar, and for each `.mantine-Card-root` records `scrollWidth`/`clientWidth` and the chart's right edge
against that card's own content-box right edge (`cardRect.right - computed padding-right`), plus an
animation-settle poll (up to 5s, comparing successive bar-geometry snapshots) before reading. Output:
`docs/sessions/evidence/task889/gr3b-gr3c-measurements-rev1.json`. Across every one of the 7
stories × 5 widths, `overflowsOwnBox` is `false` and `chartExceedsContentBox` is `false`/`null`
(`null` where the pattern has no chart, e.g. `Accent`) — zero card-level overflow anywhere, not only
at the previously-fabricated-clean 1024 cell.

### F4 — `check:locale-leak:mantine-only` re-run against the final content

Re-run to completion against the fully-fixed content (F1+F2 applied, storybook-static rebuilt first).
Full transcript: `docs/sessions/evidence/task889/check-locale-leak-rev1.txt`.

```
Mantine selected: 260; non-Mantine excluded: 178
Stories: 260 scanned | Locales: sq/uk/it | Viewports: 3
23 findings total (Story: … header count), across the other 257 stories
EXIT_CODE=1
```

**Rendered evidence, per §16.3 item 4:**
`grep -i -n "dashboardsparkline\|dashboardstatcard\|dashboardbarchart" docs/sessions/evidence/task889/check-locale-leak-rev1.txt`
→ **no output, grep exit 1 (no match)**. Zero locale-leak findings and zero `failed to render`/
`AssertionError` lines for `patterns-mantine-dashboardsparkline`, `patterns-mantine-dashboardstatcard`
or `patterns-mantine-dashboardbarchart` — the exact defect review 1 found (F2/Real defect #2) does not
reappear anywhere in this run. Overall exit stays **1**, entirely from the other 257 stories already in
the repo (Task 836, pre-existing and out of this task's scope), matching §16.3's expected result
exactly.

### AC7 — "after" re-capture only

Per §16.2, the retained `ac7-before/*.before.norm2.html` was never rebuilt. Only the "after" capture
was re-taken against the rebuilt (F1+F2-fixed) `storybook-static`
(`docs/sessions/evidence/task889/capture-ac7.mjs after-rev1`), then normalised the same way (ApexCharts
clip-path/gradient ids, Mantine `useId()` control ids) and compared against the untouched "before":

```
AdminDashboardView IDENTICAL
AgentStatisticsView IDENTICAL
```

(`docs/sessions/evidence/task889/ac7-before/*.after-rev1*.html`.) Expected, since F1 only adds
`wrap="wrap"` (inert unless `chart` is passed, and neither production consumer passes it) and F2 only
touches test code.

### New GR-3b receipts (rev1)

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--with-chart: 320 288/320(below) · 390 358/390(below) · 480 448/480(beside) · 768 360/768(beside) · 1024 236/1024(below) · 1280 300/1280(below) · 1440 340/1440(beside); overflow: none (scrollWidth=clientWidth at all 7 widths); chart right edge ≤ card content-box right edge at all 7 widths; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardbarchart--grouped: 320 288/320 · 390 358/390 · 768 736/768 · 1024 992/1024 · 1440 1408/1440; overflow: none (scrollWidth=clientWidth); chart right edge ≤ card content-box right edge at all 5 widths (measured against `.apexcharts-canvas`); fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardbarchart--horizontal: 320 288/320 · 390 358/390 · 768 736/768 · 1024 992/1024 · 1440 1408/1440; overflow: none (scrollWidth=clientWidth); chart right edge ≤ card content-box right edge at all 5 widths; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

### Final hashes (rev1)

```
b862df8a218a05f9e8e2a7bd75e27518ed1ac1f0  MantineDashboardSparkline.tsx        (unchanged)
5ee0e3da10ab79687a3bd7865acf034c1c121237  MantineDashboardStatCard.tsx         (F1)
46b5f08e1b17618d1fa1db0e56a21cf65022129c  MantineDashboardBarChart.tsx         (unchanged)
6954ab3aaf583eaa8df311ae5c7122f56bea173c  theme.ts                             (unchanged)
e3287118eb803eae0125ee96a5f5b7a9b2f1fd8c  DashboardSparkline.stories.tsx       (unchanged)
29a6fbd78bbf13b571b7e01764a81bc58442a0fb  DashboardStatCard.stories.tsx        (unchanged, per §16.2)
4fc2decf61acdce16fc780db1009ac52aa0feb99  DashboardBarChart.stories.tsx        (F2)
0664e833bd9fe8e9a2555576fbf955d2d65aae74  mantine-migration-scope.json         (unchanged)
```
(`docs/sessions/evidence/task889/final-hashes-rev1.txt`. Exactly the two files F1/F2 name changed;
every other hash is byte-identical to the first pass's final content.)

### Full §13.2 gate block (rev1)

Every command tee'd to `docs/sessions/evidence/task889/<name>-rev1.txt` with exit code, all exit 0:

| Command | Result |
|---|---|
| `node -p platform+version` | `win32 v22.22.3` |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (95 pre-existing warnings — one more than the first pass, from an unrelated concurrent task's files; 0 errors, none in task files) |
| `npm run check:i18n` | exit 0 — 2460 keys, all 4 locales match |
| `npm run check:stories` | exit 0 — 177 files, 0 violations |
| `npm run check:story-coverage` | exit 0 — 110/110 manifest entries proven |
| `npm run check:pattern-enrolment` | exit 0 — 53 pattern files, all enrolled |
| `npm run check:design-tokens:strict` | exit 0 — 0 violations |
| `npm run check:enrolled-tailwind` | exit 0 — matches versioned baseline |
| `npm run check:rendered-scope` | exit 0 — 0 new edges |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | exit 0 — 0 new/stale blocks |
| `node scripts/check-surface-census.mjs --surface .../MantineDashboardSparkline.tsx` | exit 0 — `manifest:yes story:yes` |
| `npm run build-storybook` | exit 0 |
| `npm run build` | exit 0 |
| `npm run check:file-integrity` | exit 0 — 225 files clean |
| `npm run check:mojibake` | exit 0 — 0 artifacts / 7343 files |
| AC8 `git grep` | prints nothing (exit 1 = no match) |
| `npm run check:locale-leak:mantine-only` | see F4 above |

### Deviations/limitations (rev1)

None. All four findings (F1–F4) are fixed and re-verified against the final content, including the one
item flagged as outstanding at the end of the first pass (`check:locale-leak:mantine-only` re-run to a
clean finish for the three task patterns).

### Opus handoff (rev1)

- All four review-1 findings are closed with re-verified, machine-produced evidence under
  `docs/sessions/evidence/task889/*-rev1*`.
- §16.4's reviewer note about `theme.ts`/`scripts/mantine-migration-scope.json`/`messages/*.json`
  carrying both 889's and 854's hunks is unchanged by this remediation — Sonnet did not touch those
  files in this pass (no edit was needed for F1–F4), and per §16.4 that staging entanglement is the
  approval review's to resolve, not the executor's.
- §13.4's `OWNER VISUAL QA REQUIRED` matrix is unchanged and still owed to the owner.
- 890 and 891 remain blocked on this task's approval.

### Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (superseded — see "Revision 2")

## Revision 2 (2026-09-27) — remediation of review 3 findings (O889-1 rows 1 and 3), per kickoff §18

Re-entry mode `remediation` per kickoff §18.5. Reused without re-running: the I0 snapshot/hashes,
`ac7-before/*.before*.html`, and every `-rev1` artifact — nothing from the first two passes was
touched. Every new artifact carries a `-rev2` suffix (or, where the kickoff's own naming pins a
specific suffix, e.g. `*.after-rev2*`, that exact name).

### Row 3 (R4) — `accentHeroGradient` theme role + gradient `Card` background

Added `accentHeroGradient: MantineGradient` to the `MantineThemeOther` type block (`theme.ts`, next to
`dashboardChart`) and its value `{ from: 'brand.7', to: 'brand.9', deg: 225 }` to the `other` value
block, exactly as D889-2 specifies — theme keys, no hex. `MantineDashboardStatCard.tsx`'s two `Card`s
now read `bg={getGradient(theme.other.accentHeroGradient, theme)}` (`@mantine/core` 8.3.18's own
`getGradient`, confirmed exported from the package root) instead of `bg="brand.8"`; `brand.8` is no
longer referenced by the accent variant. Sanity-checked directly: `getComputedStyle(card).backgroundImage`
on the rendered `Accent` story returns exactly
`linear-gradient(225deg, rgb(236, 84, 71) 0%, rgb(142, 50, 43) 100%)` — `rgb(236, 84, 71)` is `brand.7`
(`#EC5447`) and `rgb(142, 50, 43)` is `brand.9` (`#8E322B`), matching AC4's stop clause exactly.
`DashboardStatCard.stories.tsx`'s `Accent` `play()` assertion was updated to check
`backgroundImage` contains `linear-gradient`, `rgb(236, 84, 71)` and `rgb(142, 50, 43)`, replacing the
old `backgroundColor === 'rgb(189, 67, 57)'` (`brand.8`) assertion.

### Row 1 (R11) — sparkline tooltip: `compact: true`

`MantineDashboardSparkline.tsx`'s `tooltip` options gained `compact: true` (ApexCharts 7.4.0's own
"one tight line instead of a card" form). No custom tooltip, no CSS rule, no `custom` renderer, no
`overflow` change — the native tooltip only, per D845-4 and the owner's own words in O889-1 row 1.

### AC4-R2 — pixel-sampled contrast (§18.4): **FAILS at the exact D889-2 value**

Probe: `docs/sessions/evidence/task889/ac4-r2-contrast-probe.mjs` (retained). For each of
sq/en × 320/390/768/1024/1440 against the rebuilt `storybook-static`: the label/value/caption `Text`
elements' `color` was set to `transparent` (`!important`, restored after capture) so only the gradient
background remained, the card was screenshotted at `deviceScaleFactor: 1`, and every background pixel
under each element's own `getBoundingClientRect()` box was decoded with `sharp` and scored against
`#FFFFFF` by the WCAG relative-luminance formula (white's own luminance is always 1, so
`contrast = 1.05 / (Lbg + 0.05)`; the minimum contrast is the brightest sampled pixel). Raw results:
`docs/sessions/evidence/task889/ac4-r2-contrast-results.json`.

| Width | Locale | label (need ≥4.5) | value (need ≥4.5 if <24px, else ≥3.0) | caption (need ≥4.5) |
|---|---|---|---|---|
| 320 | en/sq | **4.18 FAIL** | 4.36 (20px) **FAIL** | 4.63 OK |
| 390 | en/sq | **4.08 FAIL** | 4.25 (20px) **FAIL** | **4.46 FAIL** |
| 768 | en/sq | **4.10 FAIL** | 4.25 (30px) OK | 4.55 OK |
| 1024 | en/sq | **4.28 FAIL** | 4.49 (30px) OK | 4.90 OK |
| 1440 | en/sq | **4.13 FAIL** | 4.28 (30px) OK | 4.58 OK |

en and sq are pixel-identical at every width (same layout, different label/caption string lengths do
not change the sampled background). **The label fails at all 10 tuples; the value fails at 320/390 (4
tuples); the caption fails at 390 (2 tuples).** 16 of 30 element-measurements violate the AC.

**Root cause, confirmed, not a probe defect.** The gradient is real and exactly as specified
(sanity-checked above). `225deg` places the light stop (`brand.7`) at the card's top-right and the dark
stop (`brand.9`) at its bottom-left (kickoff §18.3's own description). The label sits at the *top* of
the text stack (icon row above it), which keeps it consistently in the lighter part of the gradient —
kickoff §18.3's own contrast-vs-`t` table predicted exactly this failure mode ("a label that lands at
`t < 0.33` would fail"); the measured label position lands at `t ≈ 0.15–0.25` at every tested width, not
past 0.33. This reproduces at every width and both locales, so it is the gradient/layout geometry, not
an edge case.

**No fix was applied.** The kickoff specifies the exact gradient value (`{ from: 'brand.7', to:
'brand.9', deg: 225 }`) as D889-2's chosen answer, with no alternate route defined if AC4-R2 fails at
that value (unlike AC9, which names an explicit fallback and a `BLOCKED` outcome). Picking a different
angle, stop pair, or text placement is a design decision the executor is not authorised to make
unilaterally (no owner-quoted authorization exists for any value other than D889-2's). This is reported
to Opus/owner as an open finding, not silently patched.

### AC9 — tooltip probe (§18.4): **0 violations everywhere except `AllZero`, which never activates**

Probe: `docs/sessions/evidence/task889/ac9-tooltip-probe.mjs` (retained — the reviewer's own probe from
§18.2 was explicitly not retained). Every bar was hovered at its vertical middle and at `top+2px`
(for `AllZero`, each zero-height slot's centre `2px` above the chart bottom, per §18.4); each hover
waited 450ms and required `.apexcharts-tooltip.apexcharts-active` before reading. A violation is (a)
tooltip∩bar overlap area > 0, (b) the cursor point inside the tooltip rect, or (c) the tooltip not
fully inside the viewport ∩ every non-`visible`-overflow ancestor. Raw results:
`docs/sessions/evidence/task889/ac9-tooltip-results.json`.

**Arm 1 — `compact: true` alone** (the shipped code):

| Tuple | Hovers | Violations |
|---|---|---|
| `DashboardSparkline/Default` @1440, en/uk | 14 + 14 | 0 |
| `DashboardSparkline/ThirtyDays` @1440, en/uk | 14 + 14 | 0 |
| `DashboardSparkline/AllZero` @1440, en | 7 | **7 (NO_TOOLTIP)** |
| `DashboardStatCard/WithChart` @320/390/1024/1440, en/uk | 14 × 8 = 112 | 0 |

168 of 175 hovers are clean: the tooltip never overlaps the hovered bar, never covers the cursor, and
is never clipped, at every tuple that has a real (non-zero) bar. `AllZero`'s 7 hovers never see
`.apexcharts-tooltip.apexcharts-active` at all — a probe failure by the kickoff's own rule ("a read
without it is a probe failure, never a pass"), not merely a positioning defect.

**Root-caused, independent of this task's fix.** A minimal raw-`apexcharts@7.4.0` reproduction
(no React/Mantine, same sparkline options, all-zero data) shows the tooltip never activates on hover
anywhere in the chart box, with `compact: true` or without it — this is a pre-existing ApexCharts
behaviour with an all-zero-value series in sparkline mode, not something Task 889 rev 2 introduced or
can fix by tooltip configuration.

**Route step 2 — `followCursor: true` tried and reverted.** Per §18.4's Route, `followCursor: true`
was added alongside `compact: true`, `build-storybook` was rerun, and the full 175-hover probe was
rerun (table below, `docs/sessions/evidence/task889/ac9-tooltip-results-arm2.json`):

| Tuple | Hovers | Violations |
|---|---|---|
| `DashboardSparkline/Default` @1440, en/uk | 28 | 0 |
| `DashboardSparkline/ThirtyDays` @1440, en/uk | 28 | 0 |
| `DashboardSparkline/AllZero` @1440, en | 7 | **7 (NO_TOOLTIP, unchanged)** |
| `DashboardStatCard/WithChart` @4 widths, en/uk | 112 | 0 |

Identical outcome — `followCursor` cannot fix a tooltip that never activates. Per §18.4's Route step 3
("If a violation remains, return `BLOCKED` … change nothing else"), `followCursor: true` was reverted;
the shipped `MantineDashboardSparkline.tsx` carries `compact: true` only (arm 1), rebuilt and
reconfirmed active on `Default` after the revert.

### AC7 — re-check, both consumers still byte-structurally identical

`docs/sessions/evidence/task889/compare-ac7-rev2.mjs` normalises every `id="…"` value, every
`url(#…)` clip-path reference, and every Mantine `useId()`-derived random suffix (`mantine-<random>`,
matched only when it contains a digit, so static classes like `mantine-active` are untouched), then
diffs the untouched `*.before.html` baseline against a freshly captured `*.after-rev2.html`:

```
AdminDashboardView: IDENTICAL (before vs after-rev2, 165507 chars)
AgentStatisticsView: IDENTICAL (before vs after-rev2, 201633 chars)
```

Neither consumer passes `chart` or `variant="accent"`, so neither renders a sparkline or the accent
fill; the one incidental difference found before normalisation (a `SegmentedControl` radio-group's
per-mount `useId()` name/for pair) is exactly the kind of non-deterministic-per-render noise AC7 is
meant to ignore, not a code-driven change.

### Locale leak, gate block, and hashes

`check:locale-leak:mantine-only` (`docs/sessions/evidence/task889/check-locale-leak-rev2.txt`): 260
stories scanned (sq/uk/it × 3 viewports), **169 leaks found, overall exit 1** — all pre-existing,
unrelated findings (`Admin/AdminUsersTable`, map/listing patterns, `SaveSearchButton`, etc.; Task 836).
`grep -i -n "dashboardsparkline\|dashboardstatcard\|dashboardbarchart" check-locale-leak-rev2.txt` →
**no output, grep exit 1 (no match)** — zero findings and zero render failures for the three task
patterns, matching the kickoff's expected result exactly.

Full §13.2 block, rev2, every command tee'd to `docs/sessions/evidence/task889/<name>-rev2.txt`:

| Command | Result |
|---|---|
| `node -p platform+version` | win32 (same host as rev1) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (0 errors, 99 warnings, none new in task files) |
| `npm run check:i18n` | exit 0 — 2460 keys, all 4 locales match |
| `npm run check:stories` | exit 0 — 177 files, 0 violations |
| `npm run check:story-coverage` | exit 0 — 110/110 manifest entries proven |
| `npm run check:pattern-enrolment` | exit 0 — 53 pattern files, all enrolled |
| `npm run check:design-tokens:strict` | exit 0 — 0 violations |
| `npm run check:enrolled-tailwind` | exit 0 — matches versioned baseline |
| `npm run check:rendered-scope` | exit 0 — 0 new edges |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | exit 0 — 0 new/stale blocks |
| `node scripts/check-surface-census.mjs --surface .../MantineDashboardSparkline.tsx` | exit 0 — `manifest:yes story:yes` |
| `npm run build-storybook` | exit 0 (final, `compact: true` only) |
| `npm run build` | exit 0 |
| `npm run check:file-integrity` | exit 0 — 237 files clean |
| `npm run check:mojibake` | exit 0 — 0 artifacts / 7413 files |
| AC8 `git grep` | prints nothing (exit 1 = no match) |
| `npm run check:locale-leak:mantine-only` | see above |

Final hashes (`docs/sessions/evidence/task889/final-hashes-rev2.txt`), only the four files this
revision touched changed from `final-hashes-rev1.txt`:

```
9475baa3aaf29cbf7228aa156f3adb2dadd61146  MantineDashboardSparkline.tsx        (R11: tooltip.compact)
a40c7676aeb53fc3931d0ecf42b5e19e83d85b8e  MantineDashboardStatCard.tsx         (R4: gradient bg)
46b5f08e1b17618d1fa1db0e56a21cf65022129c  MantineDashboardBarChart.tsx         (unchanged)
90f73e7f060002b6dd2911270b52523caaf013c3  theme.ts                             (accentHeroGradient role)
e3287118eb803eae0125ee96a5f5b7a9b2f1fd8c  DashboardSparkline.stories.tsx       (unchanged)
981d156977fc96e7302b9ad16ef5ed3303cf7595  DashboardStatCard.stories.tsx        (R4: Accent play assertion)
4fc2decf61acdce16fc780db1009ac52aa0feb99  DashboardBarChart.stories.tsx        (unchanged)
0664e833bd9fe8e9a2555576fbf955d2d65aae74  mantine-migration-scope.json         (unchanged)
```

### Receipts

`GR-0 CANONICAL REUSE PREFLIGHT — request: hero-card gradient background; semantic queries: "gradient", "accentHeroGradient", theme.other roles, getGradient; inspected candidates: theme.other.dashboardChart.* (no gradient role existed), theme.defaultGradient (Mantine's own generic default, not brand-specific), MantineDashboardStatCard.tsx's prior brand.8 flat fill; decision: EXTEND (theme.other gains one new gradient role; `getGradient()` is Mantine's own canonical resolver, not a bespoke helper); selected canonical owner: theme.ts `other.accentHeroGradient`; Mantine/TailAdmin token path: brand.7/brand.9 theme colour keys, D889-2 (owner AskUserQuestion decision); new hardcoded visual values: NONE; rationale: D889-2 is a verbatim owner decision naming this exact gradient.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--accent: unchanged from rev1 (320 288/320 · 390 358/390 · 768 360/768 · 1024 236/1024 · 1440 340/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE) — only the `Card`'s `bg` value changed, not its layout/box model.`

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--accent: unchanged from rev1 (value 320 20px(h5) · 768 24px(h4)/30px(h3 from 768) · 1440 30px(h3); label 14px; caption 12px, all widths); ≥24px text without a responsive step: NONE; heading above 20px below 640: NONE; child heading larger than page title: NONE. AC4-R2's pixel contrast, not text size, is what this revision found in violation — see above.`

### Deviations, limitations, and open findings

1. **AC4-R2 (R4) fails at the exact D889-2 gradient value** — see table above. Not fixed; no
   alternate value is authorised without a further owner decision. `theme.other.accentHeroGradient`
   ships exactly as D889-2 specified; the code change is complete and correct against the spec, but
   the spec's own acceptance test does not pass.
2. **AC9 (R11) fails on the `AllZero` tuple only** — the native ApexCharts tooltip never activates on
   an all-zero series, confirmed independent of this task's `compact`/`followCursor` settings via a raw
   `apexcharts@7.4.0` reproduction. Both Route arms were tried and evidenced; per the kickoff's own
   Route step 3, this returns `BLOCKED`, and no custom-tooltip/CSS/renderer workaround was attempted
   (forbidden by D845-4 and the kickoff).
3. Everything else in §18 (theme role addition, gradient wiring, `compact` tooltip for every non-zero
   tuple, AC7, the full gate block) is implemented and evidenced clean.
4. §16.4/§17.1's `O889-2` (staging the files shared with 854) is unchanged and still an approval-time
   decision, not touched this session.
5. §13.4/§18.6's owner visual matrices remain `OWNER VISUAL QA REQUIRED` — Sonnet does not mark them
   passed/failed, and given findings 1–2 above, the owner's row-1/row-3 re-check should wait for a
   design decision on both open items rather than re-inspecting the current gradient/tooltip as-is.

### Opus handoff

- Two open, evidenced findings need an owner/orchestrator decision before this task can reach
  `APPROVED`: (1) the D889-2 gradient's own AC4-R2 contrast floor, which the literal specified value
  does not meet at the label (all widths) and at the value/caption in narrower cards; (2) the
  `AllZero` sparkline tooltip, which never activates under ApexCharts 7.4.0 regardless of `compact`/
  `followCursor`, an upstream library behaviour with all-zero series data, not a configuration this
  task can tune around within D845-4's native-tooltip-only constraint.
- All other revision-2 requirements (R11's `compact` tooltip for every non-empty tuple, R4's gradient
  wiring itself, AC7, AC8, and the full §13.2 gate block) are implemented and evidenced.
- 890 and 891 remain blocked on this task's approval.

### Status: `BLOCKED` — two open findings (AC4-R2, AC9/AllZero) require an owner decision; every other
requirement in §18 is implemented and evidenced. Update the 889 line of `docs/backlog.md` accordingly.

## Revision 3 (2026-09-28) — §19: both revision-2 findings were design defects, fixed per §19.1/§19.2

Review 4 (2026-09-28) found both blocking findings from revision 2 were defects in the §18 kickoff
itself, not in the implementation: (1) the D889-2 gradient's own AC4-R2 acceptance test could not pass
at 225deg for any correct implementation of the specified colours (the text stack sits in the card's
lower half, so a 225deg light-top-right diagonal put the label's own box too close to the light end);
(2) AC9 required an `AllZero` tooltip activation that ApexCharts 7.4.0 never produces for an all-zero
series, confirmed independent of this task's tooltip options by the reviewer's own raw repro. §19
re-specifies both: the gradient angle becomes 180deg (D889-2's colours stand), and AC9's `AllZero` rule
inverts to "0 activations is the pass". Re-entry per §19.3: reused, never overwrote, the I0/-rev1/-rev2/
`ac7-before` artifacts; every new artifact carries a `-rev3` suffix.

### R4-R3 — gradient angle 225deg → 180deg

`theme.ts` (`:857` value, `:327` type comment): `accentHeroGradient` becomes
`{ from: 'brand.7', to: 'brand.9', deg: 180 }`; both comments now read *"Task 889 rev 3, D889-2: brand
coral hero-card gradient, light top → dark bottom; the text stack sits in the lower half, on the dark
end"*. `MantineDashboardStatCard.tsx` (`:78`): JSDoc-only change, `225deg — light top-right, dark
bottom-left under the text` → `180deg — light top, dark bottom under the text`; no code line touched
(confirmed by hash: `MantineDashboardStatCard.tsx` is the only file among the eight whose hash changed
between rev2 and rev3 besides `theme.ts` and `DashboardStatCard.stories.tsx` — see hash table below).

**`DashboardStatCard.stories.tsx`, `Accent` `play` — a fact the kickoff's literal wording didn't
anticipate.** §19.1 asked for `expect(backgroundImage).toContain('180deg')` against
`getComputedStyle(card).backgroundImage`. Verified live (Playwright, the rebuilt `storybook-static`):
the computed value is `linear-gradient(rgb(236, 84, 71) 0%, rgb(142, 50, 43) 100%)` — **no angle token
at all**. This is standard CSS serialization: `180deg` is the gradient default direction ("to bottom"),
so Chromium's computed-style resolver omits it once resolved, the same way it never prints `to bottom`
either. The element's own inline `style` attribute, by contrast, still carries the authored value
verbatim: `background: linear-gradient(180deg, var(--mantine-color-brand-7) 0%, ...)`. The `play`
function was written accordingly: the three existing assertions (`linear-gradient`, the two `rgb(...)`
stops) stay against `getComputedStyle`, unchanged; a fourth assertion,
`expect(card.getAttribute('style') ?? '').toContain('180deg')`, proves the shipped angle against the
inline style instead. This was verified as a genuine browser-serialization fact, not a probe bug: a
first `build-storybook` pass with the literal `getComputedStyle`-only assertion (per §19.1's exact
wording) produced a live Storybook error-boundary render (`AssertionError: expected 'linear-gradient(rgb(236, 84, 71) 0%, ...' to contain '180deg'`,
screenshotted during debugging), confirming the assertion as originally specified cannot pass against
any correct implementation.

### AC4-R3 — pixel contrast, all 4 locales × 5 widths + a wrapped-label arm

`docs/sessions/evidence/task889/ac4-r3-contrast-probe.mjs` (adapted from the rev2 probe), run against
the rebuilt `storybook-static`: sq/en/uk/it × 320/390/768/1024/1440 (60 element-measurements), plus a
wrapped-label arm (uk × the same 5 widths, the probe setting the label's `textContent` to itself
repeated 4× so it wraps to 2 lines — a probe-only DOM mutation, restored before each screenshot's text
is un-hidden, never Story markup) (15 more). Method unchanged from rev2: hide label/value/caption text
(`color: transparent`), screenshot the card, sample every background pixel under each text box's
bounding box with `sharp`, compute the minimum WCAG contrast of `#FFFFFF` against that pixel.

Results (`docs/sessions/evidence/task889/ac4-r3-contrast-results.json`), minimum per element across all
75 measurements:

| Element | Font size | Minimum contrast | Threshold | Result |
|---|---|---|---|---|
| label | 14px (all widths) | **4.78** (wrapped-label arm, 768/1024/1440) | ≥ 4.5 | pass |
| value | 20px (320/390) / 30px (768+) | **5.49** (30px rows) / 5.67 (20px rows) | ≥ 4.5 (<24px) / ≥ 3.0 (≥24px) | pass |
| caption | 12px (all widths) | **6.63** | ≥ 4.5 | pass |

0 of 75 element-measurements fail. Unwrapped-label minima matched the reviewer's own §19.1 projection
exactly (label 4.90, value 5.49, caption 6.63 at the reviewer's quoted tuples). `FAILING_ELEMENT_MEASUREMENTS=0`.
Computed `background-image` recorded once per tuple: `linear-gradient(rgb(236, 84, 71) 0%, rgb(142, 50, 43) 100%)`
— both stops present; no `180deg` token (see the play-function note above for why).

### AC9-R3 — tooltip probe, unchanged tuples clean, `AllZero` re-specified to expect no activation

`docs/sessions/evidence/task889/ac9-tooltip-probe-rev3.mjs` (the rev2 probe, `AllZero`'s pass condition
inverted per §19.2), run against the rebuilt `storybook-static`:

| Tuple | Hovers | Violations |
|---|---|---|
| `DashboardSparkline/Default` @1440, en/uk | 28 | 0 |
| `DashboardSparkline/ThirtyDays` @1440, en/uk | 28 | 0 |
| `DashboardSparkline/AllZero` @1440, en (new rule: pass = 0 active) | 7 | 0 (0 activations, 0 page errors) |
| `DashboardStatCard/WithChart` @320/390/1024/1440, en/uk | 112 | 0 |

175 hovers total, 0 violations, 0 page errors (`docs/sessions/evidence/task889/ac9-tooltip-results-rev3.json`).

**Retained raw two-armed repro** (§19.2), `docs/sessions/evidence/task889/ac9-raw-repro-rev3.html` +
`.mjs`: a self-contained page with 4 real ApexCharts 7.4.0 bar charts (no React/Mantine), covering
{non-zero, all-zero} × {`compact` off, on}, each hovered at all 7 slots. An initial version copied
`node_modules/apexcharts/dist/{apexcharts.js,apexcharts.css}` next to the HTML per §19.2's "or a copy
saved next to it" option; that copy made `npm run lint` regress from 0 to 30 errors (the vendored
minified file's own `no-this-alias`/`ban-ts-comment` patterns, matched because the copy landed under
`docs/`, which the project's lint globs cover). The copy was deleted and the HTML instead loads
`../../../../node_modules/apexcharts/dist/apexcharts.js` via a relative path (§19.2's other permitted
option) under `file://`, avoiding both the lint regression and a second throwaway `http-server`
process. Results (`docs/sessions/evidence/task889/ac9-raw-repro-results-rev3.json`):

| Arm | Hovers | Active |
|---|---|---|
| non-zero, `compact` off | 14 | 14 |
| non-zero, `compact` on | 14 | 14 |
| all-zero, `compact` off | 7 | 0 |
| all-zero, `compact` on | 7 | 0 |

0 page errors. Confirms §19.2's fact as library-level and independent of this task's own tooltip
configuration.

### AC7 — re-check, both consumers still byte-structurally identical

`docs/sessions/evidence/task889/compare-ac7-rev3.mjs`, comparing the retained `*.before.html` baseline
against a freshly captured `*.after-rev3.html`. The rev2 comparator's `mantine-(?=[a-z0-9]*\d)[a-z0-9]{6,}`
normalisation (added specifically to swallow a `SegmentedControl` radio-group's per-mount `useId()`
`name`/`for` pair) produced a **false `DIFFERS`** this run: the random suffix this render happened to
generate (`mantine-kdxnuejap`) contains no digit, so the digit-lookahead heuristic missed it. Rather
than loosen the normaliser to match every lowercase-6+ token (which would also swallow real static
classes like `mantine-active`/`mantine-filled`), the rev3 comparator targets the two exact attribute
contexts the random id appears in — `name="mantine-…"` / `for="mantine-…-…"` — which a static class
name never occupies:

```
AdminDashboardView: IDENTICAL (before vs after-rev3, 165507 chars)
AgentStatisticsView: IDENTICAL (before vs after-rev3, 201619 chars)
```

Neither consumer passes `chart` or `variant="accent"`, so neither renders a sparkline or the accent
fill — the `SegmentedControl` id noise is exactly the non-deterministic-per-render kind AC7 is meant to
ignore, not a code-driven change.

### GR-3b / GR-3c — `Accent`, re-measured this pass

`docs/sessions/evidence/task889/gr3b-gr3c-accent-rev3.mjs`/`.json`, 320/390/768/1024/1440, en:

| Width | Card width | Doc scrollWidth | Doc clientWidth | label | value | caption |
|---|---|---|---|---|---|---|
| 320 | 288 | 320 | 320 | 14px | 20px | 12px |
| 390 | 358 | 390 | 390 | 14px | 20px | 12px |
| 768 | 360 | 768 | 768 | 14px | 30px | 12px |
| 1024 | 236 | 1024 | 1024 | 14px | 30px | 12px |
| 1440 | 340 | 1440 | 1440 | 14px | 30px | 12px |

`docScrollWidth` = `docClientWidth` at every width (no overflow). Card widths match the rev1/rev2
measurement exactly — only the background changed, not the box model. Font sizes match the kickoff's
type-scale table exactly (base/sm 20px `h5`, md/lg 30px `h3`; label 14px `sm`; caption 12px `xs`).

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--accent: 320 288/320 · 390 358/390 · 768 360/768 · 1024 236/1024 · 1440 340/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--accent: value 320 20px(h5) · 390 20px(h5) · 768 30px(h3) · 1024 30px(h3) · 1440 30px(h3); label 14px(sm) all widths; caption 12px(xs) all widths; ≥24px text without a responsive step: NONE; heading above 20px below 640: NONE; child heading larger than page title: NONE.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: hero-card gradient angle (EXTEND, no new hex); semantic queries: "accentHeroGradient", theme.other roles; inspected candidates: theme.other.accentHeroGradient (existing role from rev2, D889-2's colours unchanged); decision: EXTEND (the existing role's `deg` value only); selected canonical owner: theme.ts other.accentHeroGradient; Mantine/TailAdmin token path: brand.7/brand.9 (unchanged), D889-2; new hardcoded visual values: NONE; rationale: §19.1 changes only the angle the reviewer's own probe found necessary for D889-2's stated contrast condition to hold.`

### Locale leak and full §13.2 gate block, rev3

`check:locale-leak:mantine-only` (`docs/sessions/evidence/task889/check-locale-leak-rev3.txt`): 260
stories scanned, overall exit 1 — 169 pre-existing, unrelated findings (Task 836; the same map/listing/
`SaveSearchButton`/`AdminUsersTable` findings as rev2). `grep -i -n
"dashboardsparkline\|dashboardstatcard\|dashboardbarchart" check-locale-leak-rev3.txt` → no output, grep
exit 1 (no match) — **zero findings for the three task patterns**, exactly the kickoff's required result.

Full §13.2 block, rev3, every command tee'd to `docs/sessions/evidence/task889/<name>-rev3.txt`:

| Command | Result |
|---|---|
| `node -p platform+version` | win32 v22.22.3 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 — 0 errors, 108 warnings (rev2: 99; the +9 are in this session's own retained `.mjs` evidence probes under `docs/sessions/evidence/task889/`, none in the three edited source files — confirmed by grep) |
| `npm run check:i18n` | exit 0 — 2460 keys, all 4 locales match |
| `npm run check:stories` | exit 0 — 177 files, 0 violations |
| `npm run check:story-coverage` | exit 0 — 110/110 manifest entries proven |
| `npm run check:pattern-enrolment` | exit 0 — 53 pattern files, all enrolled |
| `npm run check:design-tokens:strict` | exit 0 — 0 violations |
| `npm run check:enrolled-tailwind` | exit 0 — matches versioned baseline (2 pre-existing findings, unrelated) |
| `npm run check:rendered-scope` | exit 0 — 0 new edges |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | exit 0 — 0 new/stale blocks |
| `node scripts/check-surface-census.mjs --surface .../MantineDashboardSparkline.tsx` | exit 0 — `manifest:yes story:yes` |
| `npm run build-storybook` | exit 0 (rebuilt twice this revision: once after the theme/JSDoc/play edits, a second time after the play-assertion fix once the first rebuild's error-boundary render was found) |
| `npm run build` | exit 0 |
| `npm run check:file-integrity` | exit 0 — 295 files clean |
| `npm run check:mojibake` | exit 0 — 0 artifacts / 7445 files |
| AC8 `git grep` | prints nothing (exit 1 = no match) |
| `npm run check:locale-leak:mantine-only` | see above |

Final hashes (`docs/sessions/evidence/task889/final-hashes-rev3.txt`) — only the three files this
revision touched changed from `final-hashes-rev2.txt`; the other five are byte-identical:

```
9475baa3aaf29cbf7228aa156f3adb2dadd61146  MantineDashboardSparkline.tsx        (unchanged from rev2)
bd2ea061c2116778b1465b7053b60ba3da54a70b  MantineDashboardStatCard.tsx         (R4-R3: JSDoc angle text only)
46b5f08e1b17618d1fa1db0e56a21cf65022129c  MantineDashboardBarChart.tsx         (unchanged from rev2)
68a87a4610eea6f01939d5536e7e7e26ed4496fe  theme.ts                             (R4-R3: accentHeroGradient deg 225->180)
e3287118eb803eae0125ee96a5f5b7a9b2f1fd8c  DashboardSparkline.stories.tsx       (unchanged from rev2)
25218406bfc07f3563657916775880728bf5d09c  DashboardStatCard.stories.tsx        (R4-R3: Accent play assertion + comment)
4fc2decf61acdce16fc780db1009ac52aa0feb99  DashboardBarChart.stories.tsx        (unchanged from rev2)
0664e833bd9fe8e9a2555576fbf955d2d65aae74  mantine-migration-scope.json         (unchanged from rev2)
```

### Deviations, limitations, and open items

1. **AC4-R3's literal `background-image` wording is satisfied by a different DOM property than the
   kickoff named** — see the play-function note above. The gradient's colours, both stops, and the
   180deg *direction* are all shipped and verified (inline style + pixel contrast); only the specific
   claim "`getComputedStyle(...).backgroundImage` contains the substring `180deg`" is factually false
   for any browser-correct implementation, because 180deg is CSS's own default gradient direction and
   Chromium's serializer omits default values. Flagging for Opus to confirm this reading of the AC is
   acceptable, since it is a browser-serialization fact rather than an implementation gap.
2. Both revision-2 findings (AC4-R2's contrast floor, AC9's `AllZero` requirement) are now resolved per
   the reviewer's own re-specification in §19.1/§19.2. No further open findings from this session.
3. §16.4/§17.1's `O889-2` (staging the files shared with 854) is unchanged and still an approval-time
   decision, not touched this session.
4. §13.4/§18.6/§19.4's owner visual matrices remain `OWNER VISUAL QA REQUIRED` — Sonnet does not mark
   them passed/failed.

### Opus handoff

- Every requirement in §19 (R4-R3, AC4-R3, AC9-R3, AC7) is implemented and evidenced clean. The only
  item needing Opus's own read is deviation #1 above (the `180deg` assertion's DOM-property location) —
  everything it is meant to prove (the shipped angle, both colour stops, and the resulting contrast) is
  proven; only the literal AC wording named a property that cannot carry the substring for CSS reasons
  independent of this implementation.
- 890 and 891 remain blocked on this task's approval, including the still-open `O889-2` staging decision
  from review 2 (§17.1), which this revision did not touch.
- §19.4's owner re-check (rows 1, 1a, 1b, 3) is the only remaining gate before approval.

### Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Update the 889 line of `docs/backlog.md`
accordingly.

## Revision 3a (2026-09-28) — §20.1 P3: stale `variant` prop JSDoc, comment only

Review 5 accepted revision 3 (`PARTIALLY VERIFIED`, owner items only remaining) and found one P3:
`MantineDashboardStatCard.tsx:39-40`'s `variant` prop JSDoc still said `'accent'` fills the card with
`brand.8`, contradicting the component-level JSDoc (`:80`) which correctly says `brand.8` is no longer
used. Fixed per §20.1's exact wording: the prop JSDoc now reads *"`'accent'` fills the card with
`theme.other.accentHeroGradient` (`brand.7` → `brand.9`, 180deg) and renders its text in white"*, rest
of the sentence unchanged. No code line touched. Verification (`docs/sessions/evidence/task889/*-rev3a.txt`):
`npm run typecheck` exit 0, `npm run check:file-integrity` exit 0 (302 files clean), `npm run
check:mojibake` exit 0 (0 artifacts / 7453 files). `final-hashes-rev3a.txt`: only the
`MantineDashboardStatCard.tsx` line differs from `final-hashes-rev3.txt`
(`bd2ea061c2116778b1465b7053b60ba3da54a70b` → `fe6dfce70da54d8e8254b8e8963ab50cc4064afa`); all seven
other files byte-identical. No Storybook rebuild or probe re-run performed (comment-only, no rendered
output change), per §20.1.

### Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Does not block approval (§20.1); carries as
an approval note if not folded in before then.

## Revision 4 (2026-09-28) — §21: the sparkline fills its container (O889-1 row 1)

Review 6 (§21) returned O889-1 row 1: the owner rejected the sparkline's fixed 154×95 canvas as not
adapting to mobile. §21.3 specifies the fix: rename `sparklineWidth` → `sparklineMinWidth` (value
unchanged, 154), make the sparkline's own root `Box` fluid (`w="100%" miw={sparklineMinWidth}`), wrap
the `chart` slot in `MantineDashboardStatCard` in a responsive flex `Box`, and switch the three
sparkline Stories from a fixed-padding `Box` to the same `SimpleGrid` KPI-cell grid
`DashboardStatCard.stories.tsx` uses.

### R12 — implementation

1. **`theme.ts`.** `sparklineWidth` → `sparklineMinWidth` in both the type line (`:323`) and the value
   line (`:853`), value unchanged (154). Both comments read the exact §21.3.1 wording.
2. **`MantineDashboardSparkline.tsx`.** Root `Box`: `w="100%" miw={theme.other.dashboardChart.sparklineMinWidth}
   h={theme.other.dashboardChart.sparklineHeight}` (was `w={…sparklineWidth} h={…sparklineHeight}`, both
   fixed). No resize listener added — `ReactApexChart`'s own `width="100%" height="100%"` plus ApexCharts
   7.4.0's default `chart.redrawOnParentResize: true` handles it. JSDoc and the tooltip comment updated
   per §21.3.2.
3. **`MantineDashboardStatCard.tsx`, chart branch.** `{chart}` wrapped in a `Box`:
   `w={{ base: '100%', xs2: 'auto' }} flex={{ base: '0 0 auto', xs2: '1 1 0' }}`, exactly as §21.3.3
   specifies, **plus one addition beyond the literal kickoff text — see "Deviation: `miw` on the chart
   wrapper" below.** Three JSDoc passages updated (prop doc, component doc's `chart` paragraph; the
   `variant` prop doc from §20.1 was already correct from revision 3a, unchanged).
4. **`DashboardSparkline.stories.tsx`.** All three exports: `<Box px={{ base: 'md', sm: 'xl' }} py="md">`
   → `<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">` (same grid `DashboardStatCard.stories.tsx`
   uses, cited in a comment). `Box` import dropped. `Default`'s `play`, inside the existing `waitFor`,
   adds: the rounded width of `[role="img"]` equals the rounded width of its grid's first
   `grid-template-columns` track, and `svg.apexcharts-svg`'s rounded width equals the same value —
   an independent check (reads the container's own resolved CSS track size, not the wrapper against
   itself) that only passes once the fixed-width box is actually gone.
5. `MantineDashboardBarChart.tsx`, `DashboardBarChart.stories.tsx`, `DashboardStatCard.stories.tsx`
   (`WithChart`/`Accent`) and the manifest are untouched — confirmed byte-identical to
   `final-hashes-rev3.txt`/`final-hashes-rev3a.txt` below.

### Deviation: `miw` on the chart wrapper (beyond §21.3's literal text)

§21.3.3's literal instruction — `<Box w={{ base: '100%', xs2: 'auto' }} flex={{ base: '0 0 auto', xs2: '1 1 0' }}>`,
"do not substitute anything else" — was implemented exactly first. AC10's live probe against that
exact code (`docs/sessions/evidence/task889/ac10-width-probe-rev4.mjs`, first pass, not retained
separately) found a real defect, reproduced with a **fresh Playwright page per width** (ruling out
stale state): at 1024 and 1440 the chart wrapper rendered at a **fixed 300px**, regardless of the
card's actual content width (188px and 292px respectively) — the card's `overflow: hidden` clipped the
excess, so roughly half the sparkline was invisible at 1024. Root cause, confirmed by direct
`getComputedStyle` inspection: the wrapper's default `min-width: auto` lets the ApexCharts `<svg>`'s
JS-measured pixel width (set by the library from its container's current layout) feed back into the
wrapper's own content-based auto-minimum — a circular fixed point that converges on whatever size the
chart happened to render at first, not the actual available space.

A runtime `min-width: 0` override (diagnostic only, not shipped) broke the loop and produced widths
matching §21.2's own predicted table almost exactly (768: 194/205, 1440: 174/185 — en/uk), but **also**
zeroed the flex-wrap *line-fitting* hypothetical size, so the row stopped wrapping even where the
chart's own 154px floor genuinely cannot fit beside the text — at 1024 (100px text + 16px gap + 154px
floor = 270 > 188px available) it still overflowed, now to 300px again. A second diagnostic override,
pinning the wrapper's `min-width` to the same 154 the inner sparkline already floors at (instead of 0),
resolved both problems at once: the wrap decision now sees the chart's *true* minimum, so it wraps
under at 1024 (matching §21.2's own prediction) and grows cleanly beside the text at 768/1440 with no
overflow. Both diagnostics are described here; the actual applied fix is the shipped source below.

**Applied fix:** `miw={{ base: 0, xs2: theme.other.dashboardChart.sparklineMinWidth }}` added to the
same `Box`, keeping its `w`/`flex` values byte-for-byte as specified. This is not a "different
approach" — same element, same `w`/`flex` props — but it is a prop §21.3.3's text did not name, and is
reported here per the executor's role boundary rather than silently shipped. The in-source comment
(`MantineDashboardStatCard.tsx:212-221`) carries the same root-cause explanation. Precedent: the
identical `flex`/`w`/`miw={0}`-family pattern already exists at
`src/modules/listings/components/ListingsActionRow.tsx:46` for the same class of flex-shrink issue —
this is not a novel local invention, but it is a **different value** (`sparklineMinWidth`, not a bare
`0`) than that precedent uses, chosen because a bare `0` reproduces the 1024 overflow (shown above).
**Flagging for Opus:** whether this satisfies "do not substitute anything else," or needs an owner
decision instead.

### AC10 — width contract (R12)

`docs/sessions/evidence/task889/ac10-width-probe-rev4.mjs`, rebuilt `storybook-static`, en/uk at
320/390/768/1024/1440, `networkidle` + settle-poll (bar-geometry stable across two 250ms samples).

**Sparkline (`Default`/`AllZero`/`ThirtyDays`, all three identical since only geometry is measured):**
wrapper width = `svg.apexcharts-svg` width = the `SimpleGrid`'s own first `grid-template-columns` track
width, at every width, both locales; height 95 throughout; document `scrollWidth` = `clientWidth`
(no overflow) at every tuple.

| Story | 320 | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| Default/AllZero/ThirtyDays (chart/cell) | 288/288 | 358/358 | 360/360 | 236/236 | 340/340 |

**`DashboardStatCard/WithChart`** (chart width / card content-box width; placement):

| Locale | 320 | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| en | 246/248 under | 316/318 under | 194/312 beside | 186/188 under | 174/292 beside |
| uk | 246/248 under | 316/318 under | 205/312 beside | 186/188 under | 185/292 beside |

Placement matches §21.2 exactly (under at 320/390/1024, beside at 768/1440). At every tuple the chart's
right edge ≤ the card's content-box right edge (rounded), the chart is ≥ 154px wide, and the document
does not overflow. Beside, the chart's left edge is ≥ the text stack's right edge + the `md` gap (16px,
read live via `getComputedStyle`). Under, the chart width equals the card's content width (rounded;
1024's 186 vs 188 content width is the `Box` rounding to whole device pixels, not a defect).

**Resize arm.** `WithChart` en, loaded at 1440 (chart 174px, beside), viewport resized to 390 without
reload, 1000ms wait: chart becomes 316px, under the text — identical to 390's static-load value,
confirming ApexCharts' own `redrawOnParentResize` handles the transition with no code added.

### AC9-R4 — tooltip, re-run against the new geometry

`docs/sessions/evidence/task889/ac9-tooltip-probe-rev4.mjs` (same rule as §18.4/rev3: 0 overlap with
the hovered bar, 0 cursor-point coverage, 0 clipping, `.apexcharts-tooltip.apexcharts-active` required
before every read; `AllZero` keeps rev3's re-specified 0-activation rule). Tuples: `Default`/`ThirtyDays`
at 390 and 1440 (en/uk), `AllZero` at 1440 (en), `WithChart` at 320/390/768/1024/1440 (en/uk) — 19
tuples, 168 hovers total (`docs/sessions/evidence/task889/ac9-tooltip-results-rev4.json`):

**0 violations, 0 page errors** across all 19 tuples/168 hovers.

### AC11 — rename complete

`git grep -n --untracked sparklineWidth -- src` — no output (exit 1, no match). The theme role and
every consumer now use `sparklineMinWidth`.

### AC7-R4 — consumers unchanged

`docs/sessions/evidence/task889/capture-ac7-rev4.mjs` + `compare-ac7-rev4.mjs`, comparing the retained
`*.before.html` baseline against a freshly captured `*.after-rev4.html`:

```
AdminDashboardView: IDENTICAL (before vs after-rev4, 165507 chars)
AgentStatisticsView: IDENTICAL (before vs after-rev4, 201619 chars)
```

Neither consumer passes `chart` or `variant="accent"`.

### GR-3b — responsive check, per changed export

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardsparkline--default: 320 288/288 · 390 358/358 · 768 360/360 · 1024 236/236 · 1440 340/340; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardsparkline--all-zero: 320 288/288 · 390 358/358 · 768 360/360 · 1024 236/236 · 1440 340/340; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardsparkline--thirty-days: 320 288/288 · 390 358/358 · 768 360/360 · 1024 236/236 · 1440 340/340; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-dashboardstatcard--with-chart: 320 246/248 · 390 316/318 · 768 194/312 · 1024 186/188 · 1440 174/292; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

### GR-3c — n/a

No text changed this revision. The compact tooltip's computed font size was already recorded in
earlier revisions and is unaffected by a width-only change; not re-measured.

### GR-0 — token rename

`GR-0 CANONICAL REUSE PREFLIGHT — request: sparkline minimum-width role (rename); semantic queries: "sparklineWidth", "sparklineMinWidth", theme.other.dashboardChart roles; inspected candidates: theme.other.dashboardChart.sparklineWidth (existing role, rev1-rev3); decision: EXTEND (rename the existing role and its two comments; value unchanged); selected canonical owner: theme.ts other.dashboardChart; Mantine/TailAdmin token path: theme.other.dashboardChart.sparklineMinWidth (was sparklineWidth); new hardcoded visual values: NONE; rationale: §21.3.1 renames the role to reflect its new meaning (a floor, not a fixed size) — no new value, no new hex.`

### GR-1 — surface census, both changed pattern files

`docs/sessions/evidence/task889/check-surface-census-sparkline-rev4.txt`:
`GR-1 CENSUS COMPLETE — 1 nodes; tier1 1 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`

`docs/sessions/evidence/task889/check-surface-census-statcard-rev4.txt`:
`GR-1 CENSUS COMPLETE — 2 nodes; tier1 2 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`

### Locale leak and full §13.2 gate block, rev4

`check:locale-leak:mantine-only` (`docs/sessions/evidence/task889/check-locale-leak-rev4.txt`): 260
stories scanned, overall exit 1 — 169 pre-existing, unrelated findings (Task 836; same map/listing/
`SaveSearchButton`/`AdminUsersTable`/`AuthSheet`/etc. findings as rev2/rev3). Zero findings for
`dashboardsparkline`, `dashboardstatcard` or `dashboardbarchart` (grep for the three, no output).

Full §13.2 block, rev4, every command tee'd to `docs/sessions/evidence/task889/<name>-rev4.txt`:

| Command | Result |
|---|---|
| `node -p platform+version` | win32 v22.22.3 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 — 0 errors, 109 warnings (rev3a: 109; none in the four files this revision touched, confirmed by grep) |
| `npm run check:i18n` | exit 0 — 2460 keys, all 4 locales match |
| `npm run check:stories` | exit 0 — 177 files, 0 violations |
| `npm run check:story-coverage` | exit 0 — 110/110 manifest entries proven |
| `npm run check:pattern-enrolment` | exit 0 — 53 pattern files, all enrolled |
| `npm run check:design-tokens:strict` | exit 0 — 0 violations |
| `npm run check:enrolled-tailwind` | exit 0 — matches versioned baseline (2 pre-existing findings, unrelated) |
| `npm run check:rendered-scope` | exit 0 — 0 new edges |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | exit 0 — 0 new/stale blocks |
| `node scripts/check-surface-census.mjs --surface .../MantineDashboardSparkline.tsx` | exit 0 — `manifest:yes story:yes` |
| `npm run build-storybook` | exit 0 (final build; `storybook-static/index.json` mtime postdates every changed source file) |
| `npm run build` | exit 0 |
| `npm run check:file-integrity` | exit 0 — 336 files clean |
| `npm run check:mojibake` | exit 0 — 0 artifacts / 7487 files |
| AC8 `git grep` | prints nothing (exit 1 = no match) — one intermediate pass caught two new comments that accidentally matched `[0-9]+px` (`154px`/`95px` with no space, unlike the file's existing `154×95 px` convention); reworded to `154 px`/`95 px`, now clean |
| `npm run check:locale-leak:mantine-only` | see above |

Final hashes (`docs/sessions/evidence/task889/final-hashes-rev4.txt`) — only the four files this
revision touched changed from `final-hashes-rev3a.txt`; the other four are byte-identical:

```
cd1c220c099b2304281a14f8780ba47059f50bd0  MantineDashboardSparkline.tsx        (rev4: w=100% miw=sparklineMinWidth, JSDoc)
9fe2885063fb059fc27d9c291dd4c5ea97e821ec  MantineDashboardStatCard.tsx         (rev4: chart Box w/flex/miw wrapper + JSDoc)
46b5f08e1b17618d1fa1db0e56a21cf65022129c  MantineDashboardBarChart.tsx         (unchanged from rev2/rev3)
30445c8016718edd4860be7bac4f7be039d5629c  theme.ts                             (rev4: sparklineWidth -> sparklineMinWidth rename + comments)
716ff56988f89711d9d76f1986ee026ff876ba02  DashboardSparkline.stories.tsx       (rev4: Box -> SimpleGrid x3, Default play width assertion)
25218406bfc07f3563657916775880728bf5d09c  DashboardStatCard.stories.tsx        (unchanged — not in rev4 file list)
4fc2decf61acdce16fc780db1009ac52aa0feb99  DashboardBarChart.stories.tsx        (unchanged from rev2/rev3)
0664e833bd9fe8e9a2555576fbf955d2d65aae74  mantine-migration-scope.json         (unchanged from rev2/rev3)
```

### Deviations, limitations, and open items

1. **The `miw` addition on the chart wrapper Box** (`MantineDashboardStatCard.tsx`), documented in full
   above — the single deviation from §21.3's literal text this revision required to make AC10 actually
   pass. Flagging for Opus: accept as within "wrap {chart} in a Box with w/flex" (same element, same
   w/flex values, one added prop), or treat as requiring an owner decision under "do not substitute
   anything else."
2. Comment wording only (not a code change): two new comments briefly tripped AC8's raw-px grep
   (`154px`/`95px`, no space) before being reworded to match the file's existing `154 × 95 px`
   convention; caught before this handoff, not carried as an open item.
3. §16.4/§17.1's `O889-2` (staging the files shared with 854) is unchanged and still an approval-time
   decision, not touched this revision.
4. §21.6's owner visual matrix (rows 1, 1a, 1b, 3) remains `OWNER VISUAL QA REQUIRED` — Sonnet does not
   mark it passed/failed.
5. §20.1's P3 (stale `variant` JSDoc) was already fixed in revision 3a; unaffected by this revision's
   `chart` JSDoc edits (different paragraph).

### Opus handoff

- R12 (§21.3) is implemented and evidenced: the sparkline is fluid-width with a 154px floor everywhere
  it renders (standalone and inside `WithChart`), at a fixed 95px height, matching the bar/line-chart
  convention. AC10, AC9-R4, AC11 and AC7-R4 all pass clean.
- The one open question for Opus is deviation #1 above — the `miw` prop this revision added beyond
  §21.3's literal instruction, with full root-cause evidence (a circular CSS/JS sizing feedback loop
  between the flex item's `min-width: auto` and ApexCharts' own resize behaviour) and a live-tested
  confirmation that the chosen value (`sparklineMinWidth`, not a bare `0`) is what makes both the
  overflow and the wrap-decision correct simultaneously.
- §21.6's owner re-check (rows 1, 1a, 1b, 3) and §17.1's `O889-2` staging decision are the remaining
  gates before approval.

### Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Update the 889 line of `docs/backlog.md`
accordingly.
