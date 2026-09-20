# Task 846 — `MantineDashboardHeader`, `MantineDashboardPeriodControl`, `MantineDashboardGrid`, `src/lib/dashboard/period.ts`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Kickoff: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_846_Dashboard_Header_Period_Grid.md`
Evidence root: `docs/sessions/evidence/task846/`

## Process notes (disclosed)

- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` The kickoff file was
  opened one step before those two files were read (read order slip); no read of source, no write and no plan followed
  until both were open and the receipt was emitted.
- A `Stop` hook (GR-6) asked for an owner-run `git add` block for `docs/backlog.md`. Not emitted: `CLAUDE.md` and
  `execute-task` forbid Sonnet from emitting/suggesting mutating git. The commit/push handoff belongs to Opus's review.
- A Storybook dev server was already running on port 6006 (not started by this session). It was used read-only; the
  three processes this session started were stopped.
- The in-page JavaScript tool call in the user's Chrome was declined by the user and was not retried. The numeric
  browser evidence (AC2/AC3/AC4) was taken instead with a headless Playwright Chromium against that same Storybook
  (`scratchpad/measure846.js`, output `browser-measurements.json`). No owner tuple below is marked visually passed.

- `package.json` / `package-lock.json` appeared modified at 09:24 (adds `@vercel/analytics ^2.0.1`, +49 lines) while the final gates were running. Not made by this session and not part of Task 846; excluded from Files Changed. The final `build` (exit 0) ran before that change.

## I0 re-measure (§10 step 1)

| Probe | Result |
|---|---|
| `node.exe -p "process.platform + ' ' + process.version"` | `win32 v22.22.3` |
| `git status --porcelain` | clean |
| `'Europe/Tirane'` accepted by `Intl` | `29/03/2026, 01:30:00` |
| `'Europe/Tirana'` | `RangeError: Invalid time zone specified: Europe/Tirana` |
| machine zone | `Europe/Tirane` (tests additionally pass under `TZ=UTC` and `TZ=America/Los_Angeles`, `test-tz-independence.txt`) |
| `src/lib/dashboard` | did not exist |
| Pre-edit `git hash-object` | `formatters.ts 46f10ad5e` · `theme.ts f5ebba246` · `patterns/index.ts e438e3537` · `mantine-migration-scope.json 4728bec0e` · `backlog.md 06759078c` |

## Requirement and acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1 [AC1] | `src/lib/dashboard/period.ts` exports `TIRANE_TZ`, `tiraneDateOf`, `tiraneYesterday`, `tiraneDayUtcBounds` (half-open, `[startUtc, endUtc)`), `resolvePeriod`, `previousPeriod`, `periodUtcBounds`, `listDates`. All pure, `now: Date` explicit. DST proof: 2026-03-29 = 23h (`2026-03-28T23:00Z → 2026-03-29T22:00Z`), 2026-10-25 = 25h (`2026-10-24T22:00Z → 2026-10-25T23:00Z`). |
| R2 [AC1] | `validateCustomRange` → `'ok'` or `end_after_yesterday`/`start_after_end`/`longer_than_90_days`/`invalid_date` (checked in that priority: invalid → order → end → length). `parsePeriodParams` accepts `URLSearchParams` or a Next-style record, falls back to `30d`, never throws; `serializePeriod` is its inverse (round-trip test). |
| R3 [AC1] | `compareToPrevious` → `no_base` for `previous === 0` and for any non-finite input; integer `percent`, `-0` normalised. |
| R4 [AC1] | `formatters.ts` gains `formatDateTimeInZone(iso, locale, timeZone)` next to `formatDateTime`, reusing `composeDateParts`/`composeTimeParts` (no second layout); UTC zone reproduces `formatDateTime` byte for byte for all four locales (test). JSDoc marks it server-only. Returns `—` for null/invalid/invalid-zone, never throws. `tiraneAbsoluteLabel` built on it. |
| R5 [AC2, AC6] | `MantineDashboardHeader.tsx`. Measured `Analytics` title `24px / 31.92px`; stale badge count 1 with icon + text in `Default`, 0 in `Fresh`; stacked below `sm`. |
| R6 [AC3, AC6] | `MantineDashboardPeriodControl.tsx` — themed `SegmentedControl` (`ScrollArea` + responsive `miw`, the canonical mobile pattern) + reused `RangeDatePicker` (unchanged) with `maxDate` = Tirane yesterday. |
| R7 [AC4, AC6] | `MantineDashboardGrid.tsx` — root + `TopRow`/`Split`/`Full`; theme token `boxSize.dashboardContentMaxWidth: '90rem'`. |
| R8 [AC5] | Three own Stories (below); all three files enrolled in `scripts/mantine-migration-scope.json`. |
| R9 [AC5, AC7] | Hardcode grep prints nothing (`final-hardcode-grep.txt`, exit 1 = no match); `dashboard.period.*` (9 keys) + `storybook.mantine.dashboard_header_*/dashboard_grid_*` (7 keys) in all 4 locales; `check:i18n` exit 0. |

### AC1 — the red and green runs

`test-red.txt` (before implementation, exit 1): `Failed to resolve import "../period" … Does the file exist?` and
`TypeError: formatDateTimeInZone is not a function` ×7. `test-green.txt` (exit 0): `Test Files 2 passed`, `Tests 43 passed`.
The four §10.2 `now` cases are named blocks in `period.test.ts`:

- `case: normal day (2026-09-18 10:00 Tirane)`
- `case: DST start day (2026-03-29, 23h local day)`
- `case: DST end day (2026-10-25, 25h local day)`
- `case: instant already the next local day in Tirane (2026-09-18T22:30Z)`

### AC2 — header (headless Chromium, 1440, `en`)

`ac2_default_stale`: `badgeCount 1`, `badgeText "Data may be outdated"`, `badgeHasSvg true`, `h1 "Analytics" 24px/31.92px`.
`ac2_fresh`: `badgeCount 0`. The stories also carry play assertions for both.

### AC3 — 120-day custom range (`CustomRangeTooLong`, keyboard Enter on day cells and Apply)

Play function, `en`, 1280: trigger shows `05.01.2026 — 05.05.2026` (121 days). DOM:
`<p class="… mantine-Text-root" data-size="xs" role="alert" style="… color: var(--mantine-color-red-7);">The period can be at most 90 days.</p>`.
`alertCount 1`; Storybook error display not shown, i.e. the play assertions passed, including
`expect(args.onChange).not.toHaveBeenCalled()`. Same story in `it`/`uk`: alert text
`Il periodo può durare al massimo 90 giorni.` / `Період може становити не більше 90 днів.`.
`CustomOpen` (`it`): `[data-date="2026-09-17"].disabled === false`, `[data-date="2026-09-18"].disabled === true`.

Limitation: the story drives day selection with `focus()` + Enter on the day buttons and clicks the picker's
next-month arrow (3×) with the pointer. The trigger itself opens on click. A fully keyboard-only pass (Tab to the
trigger, open without a pointer) was not verified.

### AC4 — computed `grid-template-columns` (3-card `TopRow`)

| Viewport / locale | columns | row width | cards + gaps |
|---|---|---|---|
| 1920 `en` | `448px 448px 448px` (container capped at `maxWidth 1440px`) | 1392 | 1392 |
| 1440 `en` | `448px 448px 448px` | 1392 | 1392 |
| 1280 `en` | `394.656px 394.672px 394.656px` | 1232 | 1231.98 |
| 1024 `sq` | `309.328px 309.328px 309.344px` | 976 | 976 |
| 800 `sq` | `364px 364px` (2 columns) | 752 | 752 |
| 700 `sq` | `668px` (1 column) | 668 | 668 |
| 480 / 320 `uk` | `448px` / `288px`, gap `16px`, gutter `16px` | 448 / 288 | 448 / 288 |

The 4-card row at ≥1024 is `330px ×4` at 1440 with `24px` gaps. No horizontal overflow at any width.

### AC5 / AC7 — gates

| Gate | Exit | Note |
|---|---|---|
| `check:i18n` | 0 | |
| `check:stories` | 0 | |
| `check:story-coverage` | 0 | GR-2: it inspects enrolled components only; the three roots are covered by the censuses below. |
| `check:pattern-enrolment` | 0 | |
| `check:design-tokens:strict` | 0 | |
| `check:enrolled-tailwind` | 0 | |
| `check:rendered-scope` | 0 | |
| `check-surface-census-changed --base HEAD` | 0 | 3 surfaces, 0 new blocks |
| census `MantineDashboardHeader.tsx` / `PeriodControl.tsx` / `Grid.tsx` | 0 / 0 / 0 | each root `manifest:yes story:yes`; PeriodControl reaches `RangeDatePicker`, `MantineCombobox`, `MantinePopover`, `responsiveBottomSheet` — all tier1 |
| `typecheck`, `lint` | 0, 0 | |
| period test, `src/lib/__tests__`, RangeDatePicker smoke + localization | 0, 0, 0 | no pre-existing failure in `src/lib/__tests__` |
| `test:i18n-hydration` | 0 | |
| `build-storybook` | 0 | |
| `check:locale-leak:mantine-only` | 1 (known red — Task 836) | 169 leaks, all in stories that pre-date this task; **0** lines/entries for `patterns-mantine-dashboardheader`, `…dashboardperiodcontrol`, `…dashboardgrid` (transcript grepped by id and by title; `report.json` grepped by id). 197 Mantine stories scanned, sq/uk/it × 3 viewports. |
| `build` | 0 (re-run with the exit code captured as its own statement, `final-build.txt`: `Compiled successfully`, static pages 40/40) | |
| `check:file-integrity`, `check:mojibake` | 0, 0 | integrity first failed on 8 of this session's own evidence files (PowerShell `>` wrote a BOM); stripped through an explicit 8-path manifest, re-run green on 75 files |

## Current versus required behavior

**Before.** No period concept, header, period control or dashboard grid existed; `/admin` still uses UTC `weekAgo`
(`page.tsx:14`, removed by 853). **After.** The library and three enrolled, storied patterns exist; no production
consumer is wired, so nothing a user sees changes. Negative flows: custom range ending today (not selectable via
`maxDate`; URL input falls back to `30d`), >90 days (localized `role="alert"`, no `onChange`), start after end
(`start_after_end`), garbage `?period=` (`30d`, no throw), DST days (23h/25h tests), previous period 0 (`no_base`),
3 top cards (3 columns at `lg`, no empty slot), narrow `uk` header (stacks, control full width, no overflow at 320) — all
evidenced above.

## Files Changed

| Path | Reason |
|---|---|
| `src/lib/dashboard/period.ts` | New — R1–R4. |
| `src/lib/dashboard/__tests__/period.test.ts` | New — 36 tests, four `now` cases + fallbacks. |
| `src/lib/formatters.ts` | R4 — one new export, `formatDateTimeInZone`; existing exports untouched. |
| `src/lib/__tests__/formatDateTimeInZone.test.ts` | New — 7 tests (no existing `formatDateTime` test file fit cleanly; `formatters.test.ts` left unmodified). |
| `src/design-system/mantine/patterns/MantineDashboardHeader.tsx` | New — R5. |
| `src/design-system/mantine/patterns/MantineDashboardPeriodControl.tsx` | New — R6. |
| `src/design-system/mantine/patterns/MantineDashboardGrid.tsx` | New — R7. |
| `src/design-system/mantine/theme.ts` | `boxSize.dashboardContentMaxWidth` (`90rem`) — union member + value. |
| `src/design-system/mantine/patterns/index.ts` | Barrel exports for the three patterns and their types. |
| `scripts/mantine-migration-scope.json` | Three entries appended. |
| `messages/{en,sq,uk,it}.json` | `dashboard.period.*` (9) + story fixtures (7), identical keys in all four (CRLF preserved). |
| `src/stories/fixtures/dashboardPeriod.fixture.ts` | New — frozen `now` and localized label builder shared by two Stories. |
| `src/stories/patterns/mantine/DashboardHeader.stories.tsx` | New — `Default` (stale), `Fresh`, `WithoutPeriodControl`. |
| `src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx` | New — `Default` (7d), `CustomOpen`, `CustomRangeTooLong`. |
| `src/stories/patterns/mantine/DashboardGrid.stories.tsx` | New — 4-card and 3-card `TopRow` (real 843 `StatCard`s), `Split`, `Full`. |
| `docs/backlog.md` | 846 state on the sprint row (line 51), in place; file stays 79 lines. |
| `docs/sessions/evidence/task846/*` | Transcripts, screenshots, `browser-measurements.json`. |

Final `git hash-object`: `period.ts c28caa806` · `formatters.ts 294d8ea89` · `theme.ts d25751a3f` ·
`MantineDashboardHeader.tsx edb186b09` · `MantineDashboardPeriodControl.tsx f45039332` · `MantineDashboardGrid.tsx 0cfbff099`.

## GR receipts

`GR-0 CANONICAL REUSE PREFLIGHT — request: MantineDashboardHeader / MantineDashboardPeriodControl / MantineDashboardGrid; semantic queries: page header title+subtitle+status+slot, period segmented selector, 12-col dashboard grid, SegmentedControl, dashboardContentMaxWidth; inspected candidates: MantinePageHeaderWithActions.tsx (Patterns/Mantine/PageHeaderWithActions), RangeDatePicker.tsx, Mantine/Primitives/SegmentedControl, MantineDashboardCard/StatCard/StatRows; decision: COMPOSE (period control), CREATE (header, grid); selected canonical owner: src/design-system/mantine/patterns/; Mantine/TailAdmin token path: theme.ts; new hardcoded visual values: NONE; rationale: no candidate covers the status-line + control-slot header, the period selector or the responsive 12-col grid.`
`GR-1 CENSUS COMPLETE — 3 nodes; tier1 3 migrated+enrolled+story (this task); tier2 0 imports removed; tier3 0 listed and filed as none.` (PeriodControl's transitive reach — 5 nodes, all tier1 — is in `census-PeriodControl.txt`.)
`GR-2 SCOPE STATED — check:story-coverage inspects only components already in the manifest; it cannot see an unenrolled component; the criterion is closed by the three per-surface censuses (each root manifest:yes story:yes) and the Stories' own direct imports.`
`GR-3 STORY PROVEN — MantineDashboardHeader ← src/stories/patterns/mantine/DashboardHeader.stories.tsx; MantineDashboardPeriodControl ← src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx; MantineDashboardGrid ← src/stories/patterns/mantine/DashboardGrid.stories.tsx.`
`GR-3a STORY PREFLIGHT` — as filed in kickoff §12 (candidates NONE; `PageHeaderWithActions` inspected and not equivalent; decision CREATE ×3; locale/viewport by toolbar). `GR-6 HANDOFF` — not emitted by the executor by rule (see Process notes).

## Assumptions, deviations, limitations

- **Grid is exported as four named components** (`MantineDashboardGrid`, `…GridTopRow`, `…GridSplit`, `…GridFull`) rather than `Grid.TopRow` statics: 853/854 are Server Components and a static property of a client component is not reachable from a server module.
- **`Flex` instead of `Group`/`Stack`** in the header and control: `Stack`'s `gap`/`align` are not responsive-typed (typecheck rejected it); `Flex` takes responsive `direction`/`align`/`gap` natively, the same mechanism `MantinePageHeaderWithActions` adopted in Task 785. Visible behavior matches the kickoff (row from `sm`, stacked below).
- **`TopRow` also clamps `md` to `min(n, 2)`** (kickoff gave `md: 2`), so a single card does not sit in half a row at `md`. `TopRow` returns `null` for zero cards. A `Fragment` counts as one child (documented).
- All three patterns are `'use client'` because each reads `useMantineTheme` (icon size, width cap, trigger width role); the control also holds state.
- `dashboard.period.*` strings are supplied to the control as props (`labels`), so the control has no hidden `next-intl` dependency of its own; the picker inside it still uses the `common` namespace.
- The stale label in the Header story is a `storybook.mantine.*` fixture; production strings for it belong to 853/854.
- AC3's "by keyboard" is met for day selection and Apply; opening the picker and stepping months used the pointer (see AC3).
- The 90-day boundary is 90 inclusive days (tested: 90 ok, 91 rejected).

## Owner visual review — `OWNER VISUAL QA REQUIRED` (not marked passed)

| # | Story | Locale | Width | Screenshot taken (not a verdict) |
|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardHeader` → Default | en | 1440 | `header-default-en-1440.png` |
| 2 | same | uk | 390 / 320 | `header-default-uk-320.png` (+ 390 in the probe) |
| 3 | `…/DashboardPeriodControl` → CustomOpen, CustomRangeTooLong | it | 1280 | `period-custom-open-it-1280.png`, `period-too-long-it-1280.png` |
| 4 | `…/DashboardGrid` → Default | en | 1440 | `grid-default-en-1440.png` |
| 5 | same | sq | 1024 / 800 / 700 | `grid-default-sq-*.png` |
| 6 | same | uk | 480 / 320 | `grid-default-uk-*.png` |

## Backlog update

`docs/backlog.md` line 51 — 846 marked `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW 2026-09-20` in place; file remains 79
physical lines (≤ 80). No `BACKLOG LIMIT BREACH`.

## Opus handoff — things to inspect

1. `period.ts` `tiraneDayStartMs`: one offset refinement is exact only because Tirane's DST switch (01:00 UTC) never falls on local midnight — confirm.
2. `MantineDashboardPeriodControl` state: `pending` keeps a rejected range visible; `customOpen || value.kind === 'custom'` decides the segment. Check the case where the consumer never updates `value` after a preset click.
3. `MantineDashboardGrid` names/`Flex` deviations above.
4. `RangeDatePicker` is untouched; its smoke tests are green.
5. `emailChange.ts:177` `Europe/Tirana` (reserved 860) remains untouched.
