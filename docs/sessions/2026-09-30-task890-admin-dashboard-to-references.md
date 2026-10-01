# Session Log: Task 890 — `/admin` rebuilt to the owner's references — 2026-09-30

**Status: `PARTIALLY IMPLEMENTED` after revision 1 — every §16.3 step and gate is done; the only open item is re-running `check:locale-leak:mantine-only` to confirm an allowlist entry I added (see the last section).** The first pass's gaps (no live proof, no "before" First Load JS) are closed in revision 1. No self-approval, no mutating git.

Kickoff (archived 2026-10-01): `tasks/Archive/Sprint_78_kickoff_prompt_Task_890_Admin_Dashboard_To_References.md`. Evidence root: `docs/sessions/evidence/task890/`.

## Receipts

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: admin dashboard recomposition; semantic queries: dashboard chart, sparkline, stat rows without links, period control, BlockResult trends, city resolution; inspected candidates: MantineDashboardLineChart/BarChart/Sparkline/StatCard/StatRows/Card/Header/PeriodControl/Donut, AgentStatisticsView (+ its Story), activityState.ts, PopularLocations.tsx:36; decision: COMPOSE + EXTEND MantineDashboardStatRows (href optional); selected canonical owner: the 843–846 + 889 patterns; Mantine/TailAdmin token path: theme.other.chartSeries, brand tuple, accentHeroGradient; new hardcoded visual values: NONE; rationale: all visuals exist except a link-less stat row.`

`GR-1 CENSUS COMPLETE — 23 nodes (I0: 16; final tree, `evidence/task890/rev1/census-final.txt`: 23); tier1 23 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.` (Corrected at revision 1, F4: the first pass said 16; the final census artifact lists 23, the extra 7 being the chart and period patterns this task composes.)

`GR-3a STORY PREFLIGHT — AdminDashboardView × 5 new states; canonical candidates: patterns-mantine-admindashboardview; direct-import evidence: src/stories/patterns/mantine/AdminDashboardView.stories.tsx:2; toolbar coverage: locale=toolbar, viewport=toolbar; decision: EXTEND.` And `GR-3a STORY PREFLIGHT — MantineDashboardStatRows × NoLinks; canonical candidates: patterns-mantine-dashboardstatrows; direct-import evidence: src/stories/patterns/mantine/DashboardStatRows.stories.tsx:6; decision: EXTEND.`

`GR-3 STORY PROVEN — AdminDashboardView ← src/stories/patterns/mantine/AdminDashboardView.stories.tsx; MantineDashboardStatRows ← src/stories/patterns/mantine/DashboardStatRows.stories.tsx; every other composed pattern ← its own Patterns/Mantine/Dashboard* story (unchanged).`

`GR-2 SCOPE STATED — check:story-coverage inspects enrolled components only; it cannot see a Story's widths, gutters or computed fonts; the criteria are closed by the Chromium measurements in probe890.out.txt.`

### GR-3b / GR-3c / GR-3d (real Chromium against `storybook-static`, `probe890.mjs` → `probe890.console.txt`)

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-admindashboardview--default: page container 320: 288/320 · 390: 358/390 · 768: 720/768 · 1024: ≥226-wide cards/1024 · 1440: 1392/1440 (first card 330); document scrollWidth == viewport at every width (no horizontal overflow); fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.` Same 5 widths in `uk`: no overflow.

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-admindashboardview--default: page title 320 20px · 390 20px · 768 24px · 1440 24px; card titles 20 · 20 · 20 · 20; largest text 20 · 20 · 30 (KPI h3) · 30; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` (All match the kickoff's table.)

`GR-3d STORY GUTTER CHECK — patterns-mantine-admindashboardview--*: StoryPageGutter n/a: View carries the page gutter (src/design-system/mantine/patterns/MantineDashboardGrid.tsx, root Box px={{ base: 'md', md: 'xl' }}); edge gap 320 16 · 390 16 · 1024 24 · 1440 24 (exemption: 16/16 and ≥24); gutter written in the Story: NONE.`

`GR-3d STORY GUTTER CHECK — patterns-mantine-dashboardstatrows--{default,no-links,loading,error}: StoryPageGutter yes; edge gap 320 16 · 390 16 · 1024 32 · 1440 32 (expected 16/16/32/32); gutter written in the Story: NONE.` The pre-existing Story had `p="md"` and `maw={theme.other.boxSize.emptyState}` written in it (GR-3b/3d violations); fixed because the Story is in scope.

## Requirement evidence

| Req | Evidence |
|---|---|
| **R1/R9** | `src/app/admin/page.tsx`: `searchParams` → `parsePeriodParams` → `resolvePeriod`, `now` captured once; locale first (cookie read; `getVisibleListingsByCity(locale)` needs it), then one `Promise.all` of the five reads; props `data, activity, freshness, trends, cities, locale, now, period, periodDays` are all serializable. The view owns `router.replace(pathname?serializePeriod, { scroll:false })`. |
| **R2** | `src/modules/admin/dashboard/trends.ts` `getAdminTrends`; 9 tests (Tirane midnight, zero-fill, 7-day sparkline window, tables, `created_at` only, no `deleted_at` filter, limit → error, paging, failed read, null data). **Deviation:** reads are paged with `.range()` in 1 000-row pages, not one `.limit(10000)`, because PostgREST caps a response at its `max-rows` and a bare `.limit()` above it truncates silently. `TREND_ROW_LIMIT = 10_000`; reaching it is `query_failed`. |
| **R3** | `getVisibleListingsByCity`; 9 tests (district/village → city, region-only, null, unknown id, 10-hop cycle guard, top 5 + Other total preserved, ties by name, `PopularLocations` label rule, `applyPublicVisibility` used, failed read, row limit). |
| **R4** | View row 1: ADM-08 `variant="accent"` with white tooltip line/`ActionIcon variant="transparent" c="white"`; ADM-01/02/06 `chart` = `MantineDashboardSparkline color="brand.4"` with the three aria-labels; a failed series renders no chart. Probe: 3 cards × 7 bars with the exact aria-labels. |
| **R5** | Activity card: `mode="multi"`, 3 series from `theme.other.chartSeries`, totals `MantineDashboardStatRows` (no `href`). Probe: 3 series, 0 `<a>` in the card. |
| **R6** | `BarChart stacked={false}` 2 series (60 bars = 30 × 2); city `horizontal` (6 bars; `CitiesOnlyOther` → 1 bar). A failed trend read errors the card (Retry). |
| **R7** | ADM-09 under the donut; ADM-01 list first in row 4; `supply_section_title` deleted (grep empty, all four locales). |
| **R8** | `ActivityStale`: caption "Data updated at …" + data; header reads 09/16 (last refresh). `ActivityError`: Retry, no chart, no totals. |
| **R10** | Story: all five pre-existing exports kept; new `ActivityStale`, `ActivityError`, `ActivityEmptyPeriod`, `TrendsError`, `CitiesOnlyOther`; fixtures extend `adminDashboard.fixtures.ts`, no wall clock (`check:stories` check 16 green). |
| **R11** | 23 keys × 4 locales under `admin.dashboard` (`en` block below). |
| **R12** | `git grep` AC11 prints nothing (exit 1). |

### `messages/en.json` — new `admin.dashboard` keys (AC10)

`period_days`, `period_range`, `adm01/02/06_sparkline_aria` ("New listings / reports / support tickets per day, last 7 days"), `activity_card_title` ("Platform activity · {period}"), `activity_info_aria`, `activity_series_views/whatsapp/form` (Recorded views / WhatsApp clicks / Form inquiries), `activity_desc_views` ("Views: a recorded view after de-duplication, not a unique visitor."), `activity_desc_whatsapp` ("…a recorded attempt to follow the button; it does not confirm a message or reply."), `activity_desc_form` ("…a stored inquiry; it does not confirm email delivery or reading."), `activity_empty`, `activity_all_hidden`, `activity_stale_label` ("Data updated at"), `trends_card_title`, `trends_series_listings/users`, `cities_card_title`, `cities_series`, `cities_other`, `cities_empty`. None contains "lead", "conversion" or "contact". `check:i18n` exit 0.

## Acceptance criteria

| AC | Result |
|---|---|
| AC1 | `page.tsx` has no `'use client'` and no function prop. **Live `/admin?period=7d` and `?period=bogus` NOT run** (see Limitations). |
| AC2/AC3 | `trends.test.ts` 18/18 pass. |
| AC4 | 3 sparklines × 7 bars with the R4 aria-labels. **Deviation from the AC text:** the hero computes `background-image: linear-gradient(rgb(236, 84, 71) 0%, rgb(142, 50, 43) 100%)`, not `background-color: rgb(189, 67, 57)` — 889 rev 2 replaced the flat `brand.8` with the `brand.7`→`brand.9` gradient; the kickoff's value is stale. |
| AC5 | 3 series, 3-row strip, 0 `<a>` (`NoLinks` play also asserts 0 anchors/0 svg); no summed total. |
| AC6 | 60 bars (2 × 30) grouped; 6 city bars; `CitiesOnlyOther` 1. |
| AC7 | DOM order at 1440 = §2.1 (probe card list). |
| AC8 | `ActivityStale` caption true, 0 Retry; `ActivityError` 1 Retry, no caption. |
| AC9 | `check:stories` 0, `check:story-coverage` 0, census 0. |
| AC10/AC11 | above. |

## Validation (all unpiped, `*.txt` + `EXIT_CODE=`)

typecheck 0 · lint 1 (**pre-existing**: 121 warnings in `.artifacts/`/`.screenshots/` plus 1 `react/display-name` error that was mine and is fixed; `eslint` on every touched file is clean) · check:i18n 0 · admin/dashboard tests 0 · StatRows smoke 0 · visibility test 0 · check:listing-visibility 0 (887 already landed) · check:stories 0 · check:story-coverage 0 · check:pattern-enrolment 0 · check:design-tokens:strict 0 · **check:enrolled-tailwind 1 — pre-existing, names only `MantineListingGalleryPattern.tsx` (stale baseline, 886's diff); none of this task's files** · check:rendered-scope 0 · census-changed 0 · census 0 · build-storybook 0 · **build 0** · file-integrity 0 · mojibake 0 · AC11 grep empty · `supply_section_title` grep empty.

Hashes (final): `page.tsx f3baf30c` · `AdminDashboardView.tsx fa6b2da1` · `trends.ts 29061e6f` · `trends.test.ts 81594a7f` · `AdminDashboardView.stories.tsx d7f05928` · `adminDashboard.fixtures.ts f1ce3163` · `MantineDashboardStatRows.tsx 12ec7c9a` · `DashboardStatRows.stories.tsx 26a00c99` · `en b9e960e3` · `sq 9e2d9382` · `uk 44e4e30e` · `it 32692df1` (full list: `hashes.txt` equivalent printed in the run).

## Files Changed

| Path | Reason |
|---|---|
| `src/modules/admin/dashboard/trends.ts` (new) | R2/R3 reads. |
| `src/modules/admin/dashboard/__tests__/trends.test.ts` (new) | AC2/AC3. |
| `src/app/admin/page.tsx` | R1/R9. |
| `src/modules/admin/dashboard/components/AdminDashboardView.tsx` | R4–R8 recomposition. |
| `src/design-system/mantine/patterns/MantineDashboardStatRows.tsx` | EXTEND: `href` optional → plain row, no anchor/chevron (R5/AC5 need it). |
| `src/stories/patterns/mantine/DashboardStatRows.stories.tsx` | `NoLinks`; removed `p="md"`/`maw` (GR-3b/3d), wrapped in `StoryPageGutter`. |
| `src/stories/patterns/mantine/AdminDashboardView.stories.tsx` | R10 exports. |
| `src/stories/fixtures/adminDashboard.fixtures.ts` | trend/city fixtures. |
| `messages/{sq,en,uk,it}.json` | R11; `supply_section_title` removed. |
| `docs/backlog.md` | 890 state (2 lines, file stays 80 lines). |
| `docs/sessions/2026-09-30-…md`, `docs/sessions/evidence/task890/**` | this log, transcripts, probe. |

## Limitations, deviations and questions for Opus

1. **Not run: live dev-server proof** (kickoff §10.4: signed-in staff, `?period=7d`, server log for `Functions cannot be passed`). No staff credentials were used in this session. AC1's live half is therefore unverified; the build route output shows `/admin` dynamic.
2. **Not measured: First Load JS "before".** After: `/admin` 10.7 kB / **469 kB** (`build.txt:117`). A baseline needs a pre-change build, which needs a git mutation I may not run.
3. **Scope addition (GR-0 EXTEND):** `MantineDashboardStatRows` + its Story are outside §7's list; R5/AC5 cannot hold otherwise. Please confirm.
4. **Paging instead of `.limit(10000)`** (R2): see above.
5. **AC4's `rgb(189, 67, 57)` is stale** (gradient since 889 rev 2).
6. **Row 4 at 1024 is cramped:** four work lists in `TopRow` give 226px cards; probe shows clipped primary text (`en` "Duplicate listing" 64>44; `uk` "Підтримка" 75>1). The canonical `TopRow` rule drives it; not changed. Owner matrix row 2 (1024 `sq`) should look at it.
7. **Row 2 height:** the donut + ADM-09 side column is ~1066px, so the activity card (chart + 3-row strip) has a large empty area under the strip at 1440 (`shots/default-en-1440.png`). Composition follows §2.1; flagged for the owner's visual review.
8. Existing exports `adm02-error`/`adm09-zero` were not probed (story-id spelling); `all-queues-zero` and `no-location-requests` were, no overflow.
9. `check:locale-leak` (`play()` execution) not run.

## OWNER VISUAL QA REQUIRED

Kickoff §13.4 rows 1–6 (live `/admin` at 1440 `en`, 1280/1024 `sq`, 768 `uk`, 390/320 `uk`, `?period=7d` 1440 `it`, and the five new Story states at 1440/390). None marked passed here.

## Backlog update

`docs/backlog.md` line 44 and the 890 registry row changed in place; physical line count 80; no `BACKLOG LIMIT BREACH`.

---

# Revision 1 (review 1, 2026-09-30) — executed 2026-10-01

Kickoff §16. Artifacts: `docs/sessions/evidence/task890/rev1/` (first-pass artifacts kept in `task890/`). `rev1/i0-status.txt`, `rev1/i0-hashes.txt`, platform `win32 v22.22.3`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: dashboard row column cap / wide rung; semantic queries: "TopRow", "cols", "SimpleGrid", "dashboard grid"; inspected candidates: MantineDashboardGrid.tsx (TopRow/Split/Full) + Patterns/Mantine/DashboardGrid; decision: EXTEND; selected canonical owner: MantineDashboardGridTopRow; token path: SimpleGrid cols + the grid's existing spacing; new hardcoded visual values: NONE.` (The kickoff's own receipt, re-verified.)

`GR-3a STORY PREFLIGHT — MantineDashboardGridTopRow × maxColumns/wideFrom; canonical candidates: patterns-mantine-dashboardgrid; direct-import evidence: src/stories/patterns/mantine/DashboardGrid.stories.tsx:6; decision: EXTEND; target: Patterns/Mantine/DashboardGrid.`

## What changed

| Step | Change |
|---|---|
| 2 | `MantineDashboardGridTopRow` gains `maxColumns?: 2 \| 3 \| 4` (default 4) and `wideFrom?: 'lg' \| 'xl'` (default `'lg'`); only the `cols` object changes. Defaults give exactly the original `{ base: 1, md: min(n, 2), lg: min(n, 4) }`. Story exports `MaxColumns` and `DeferredFourUp` (not `WideFromXl`: `check:stories` check 12 rejects a width segment in an export name). |
| 3 | `AdminDashboardView`: row 1 `wideFrom="xl"`, row 4 `maxColumns={2}`. |
| 4 | `AdminDashboardView.stories.tsx`: one meta decorator `withAdminShell` renders every export inside the real `<AdminShell siteName="Lero.al">`; no Box, width, padding, style or viewport pin. |
| extra | `MantineDashboardStatRows`: the count `Group` gets `flex="0 0 auto"`. The shell-width probe showed the ADM-09 badge "15" clipped (`span[15] 16>9`, `uk` 1024); the badge now keeps its width and a long label wraps. Inside the already-accepted StatRows scope (§16.1). |
| 6 | `scripts/enrolled-tailwind-baseline.json` via `check:enrolled-tailwind:update-baseline`: only `MantineListingGalleryPattern.tsx` `h-full` 5→3 and `w-full` 4→2 changed (`rev1/enrolled-tailwind-baseline.diff`). |

## Step 4 — probe (`rev1/probe-rev1.mjs`; `after-admindashboard.txt` 120 rows, `after-blast.txt`)

All 10 `AdminDashboardView` exports (real ids, including `adm-02-error` and `adm-09-zero`) × 320/390/768/1024/1280/1440 × `en`, `uk`: **page overflow: none in any row**. **No work-list primary `p` or KPI label `p` clips at any width.** Row 1 card widths (`Default`, both locales): 320 288 · 390 358 · 768 348×2 · **1024 356×2** · **1280 230×4** · **1440 270×4**. The 4-up row at 1024 (226px before) is gone; 1280 and 1440 match the kickoff's ≈230 / ≈270 computation.

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-admindashboardview--* (inside AdminShell): 320: 288-wide cards/320 · 390: 358/390 · 768: 348×2/768 · 1024: 356×2 in a 784 main · 1280: 230×4 in a 1040 main · 1440: 270×4 in a 1200 main; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-admindashboardview--default: page title 320 20px · 390 20px · 768 24px · 1440 24px; card titles 20 · 20 · 20 · 20; largest text 20 · 20 · 30 · 30; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` (Identical in `en` and `uk`.)

`GR-3d STORY GUTTER CHECK — patterns-mantine-admindashboardview--*: StoryPageGutter n/a: View carries the page gutter (src/design-system/mantine/patterns/MantineDashboardGrid.tsx, root Box px={{ base: 'md', md: 'xl' }}); edge gap from the viewport 320 16 · 390 16 · 1024 264 · 1440 264 (240px navbar + 24); gap from the AppShell.Main content edge 16 · 16 · 24 · 24 (condition 2: 16/16 and at least 24); gutter written in the Story: NONE.` (The probe's own `edge(main)` column reads the `AppShell.Main` box, whose left edge is 0 because the navbar is its padding, so the content-edge gap is the viewport column minus 240.)

### Blast radius (F5, AC13)

`after-blast.txt` = every `AgentStatisticsView`, `DashboardGrid` and `DashboardStatRows` export, `en`, 6 widths (79 rows). `baseline-before.txt` = the same set measured on the pre-revision Storybook build. Comparing overflow, row-1 widths, edges, fonts and clipped text: **0 changed rows, 12 added rows** (the two new `DashboardGrid` exports). `DeferredFourUp`: 1024 476×2 · 1280 290×4. `MaxColumns`: 1024 476×2 · 1280 604×2 · 1440 684×2.

Remaining clipped text, unchanged from before this task: `span[Data updated at 09/16/2026] 218>210` — the stale-caption `Badge` of `MantineDashboardCard` at 320 `en`. It is also in `AgentStatisticsView--activity-stale` in `baseline-before.txt`. It is a card pattern, not a work-list or KPI label, so it is outside §16.3's pass condition and I did not touch `MantineDashboardCard`. Noted for Opus.

## Step 5 — live proof (F2): `rev1/live/`, `rev1/start.log`

`capture:admin-session` needs a running server (it logs in through `BASE_URL`), so the order was `npm run build` → `npm run start` (:3000, background) → `capture:admin-session` (exit 0, the real `HYDRATION_ADMIN_*` account from `.env.local`) → `live-probe.mjs`. Results in `live/live-probe.out.txt` + screenshots:

| URL | Viewport / locale | Result |
|---|---|---|
| `/admin` | 1024 `en` | 200; row 1 356×2; row 4 356×3 (three lists, real data has no location requests); no overflow; clipped: none |
| `/admin` | 1280 `en` | 200; row 1 **230×4**; row 4 484×3; clipped: none |
| `/admin` | 1440 `en` | 200; row 1 **270×4**; row 4 564×3; clipped: none |
| `/admin` | 1024 `uk` | 200; row 1 356×2; no overflow; clipped: none |
| `/admin?period=7d` | 1440 `en` | 200; ADM-10 x-axis labels **7**, row-3 bar categories **7**; row-1 sparklines **identical** to `/admin` (`live/sparkline-compare.txt`: bar values `[[],[0,0,0,2,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]` in both) |
| `/admin?period=bogus` | 1440 `en` | 200; ADM-10 labels **30**, bars **30** |
| `/admin` | 390 `uk` | 200; no horizontal scroll; clipped: none |

Every probe showed 7 sparkline bars on cards 2–4, and real data (the listings sparkline has a 2). `start.log` (10 lines): `Functions cannot be passed` **0** matches; `Attempted to call` **0**; `[AdminTrends]` **0** — so the trend and city cards read real data, not an error state. The server was stopped after the run.

## Step 6 — gates (`rev1/*.txt`, every exit code inside the file)

typecheck 0 · **lint 0** (123 warnings, **0 errors**) · check:i18n 0 · admin/dashboard tests 0 (18) · StatRows smoke 0 · visibility test 0 · check:listing-visibility 0 · check:stories 0 · check:story-coverage 0 · check:pattern-enrolment 0 · check:design-tokens:strict 0 · **check:enrolled-tailwind 0** (after the baseline update above) · check:rendered-scope 0 · census-changed 0 · census 0 (23 nodes) · build-storybook 0 · **build 0** · file-integrity 0 · mojibake 0 · AC11 grep empty · `supply_section_title` grep empty.

**`check:locale-leak:mantine-only` — exit 1 (known red, Task 836; 238 leaks repo-wide; the full run took ~2 h, an earlier 30-minute run was stopped).** Quote for the three stories (`rev1/check-locale-leak-mantine-only.txt`): `Patterns/Mantine/DashboardGrid` **0 findings**; `Patterns/Mantine/DashboardStatRows` **0 findings**; `Patterns/Mantine/AdminDashboardView` **10 findings, all the same token** — `[sq] "Footer"`, `[it] "Footer"` in each of the 10 exports (lines 85–124). Cause: the revision-1 `AdminShell` decorator renders the sidebar, whose `admin.sidebar.item_footer` is the loanword "Footer" in `sq`/`it` (verified in `messages/sq.json` and `messages/it.json`). `Patterns/Mantine/AdminShell` and `AdminSidebar` already carry this exact per-story allowlist entry, so I added the same one for `patterns-mantine-admindashboardview` in `scripts/check-locale-leak.mjs` (a prefix match on the story id; hash 4f1f3438). **Not re-run**: another ~2 h run. Owner-native confirmation: `npm.cmd run check:locale-leak:mantine-only`, expecting zero findings for the three stories. Until then the final-gate quote is unproven, so the status stays `PARTIALLY IMPLEMENTED`.

**First Load JS:** before **429 kB** (`docs/sessions/evidence/task886/rev7/build.log`, as instructed, not re-measured) → after **469 kB** (`rev1/build.txt:116`, `/admin 10.7 kB`). +40 kB: the three ApexCharts patterns the page now imports, which were previously only on the agent dashboard.

Final hashes (`rev1/final-hashes.txt`): `enrolled-tailwind-baseline.json 1ea7c556` · `MantineDashboardGrid.tsx 646ce526` · `DashboardGrid.stories.tsx 50b4c6d5` · `MantineDashboardStatRows.tsx a7feb55a` · `DashboardStatRows.stories.tsx 26a00c99` · `adminDashboard.fixtures.ts f1ce3163` · `page.tsx f3baf30c` · `AdminDashboardView.tsx 17207e0a` · `trends.ts 29061e6f` · `trends.test.ts 81594a7f` · `AdminDashboardView.stories.tsx a1f2c22b` · `en b9e960e3` · `sq 9e2d9382` · `uk 44e4e30e` · `it 32692df1`.

## Acceptance criteria added

| AC | Result |
|---|---|
| AC12 | Every export in `AdminShell` and live `/admin` at 1024/1280/1440 (`en`, plus `uk` at 1024): no work-list primary or KPI label clips; row 1 is 2-up at 1024 and 4-up at 1280; row 4 is at most 2-up by the prop (live real data has 3 cards → 2 + 1 layout). |
| AC13 | The `DashboardGrid` new exports render `maxColumns` / `wideFrom` at 1024/1280 (numbers above); pre-existing exports and `AgentStatisticsView` unchanged (0 changed rows). |
| AC14 | Artifacts exist; 7d → 7, bogus → 30; `start.log` has none of the two 791 strings and no `[AdminTrends]` line. |
| AC15 | `lint`, `check:enrolled-tailwind` and all of §13.2 exit 0 in `rev1/`; the baseline diff is remove-only. |

## Files Changed in revision 1

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineDashboardGrid.tsx` | `maxColumns` / `wideFrom` on `TopRow` (F1). |
| `src/stories/patterns/mantine/DashboardGrid.stories.tsx` | `MaxColumns`, `DeferredFourUp` (AC13). |
| `src/modules/admin/dashboard/components/AdminDashboardView.tsx` | row 1 `wideFrom="xl"`, row 4 `maxColumns={2}`. |
| `src/stories/patterns/mantine/AdminDashboardView.stories.tsx` | every export inside `AdminShell` (GR-3b, F1). |
| `src/design-system/mantine/patterns/MantineDashboardStatRows.tsx` | count `Group` `flex="0 0 auto"` (badge clip found by the shell-width probe). |
| `scripts/enrolled-tailwind-baseline.json` | remove-only baseline update (F3c). |
| `scripts/check-locale-leak.mjs` | one per-story allowlist entry (`Footer`, sq/it) for `patterns-mantine-admindashboardview`, caused by the AdminShell decorator; outside §16.4, same pattern as the AdminShell entries. |
| `docs/backlog.md`, this log, `docs/sessions/evidence/task890/rev1/**` | records. |

## Limitations, deviations, questions for Opus (revision 1)

1. The stale-caption `Badge` of `MantineDashboardCard` clips 8px at 320 `en` (pre-existing, also on the agent dashboard). Outside §16.3's pass condition; not touched.
2. The extra `StatRows` `flex="0 0 auto"` goes beyond §16.3's listed edits. It is in the same accepted file, and the blast-radius comparison shows no change in the other consumers' measured geometry.
3. Row 2's empty area under the totals strip at 1440 (executor note 7) is unchanged and left to the owner (§16.6).
4. The owner visual matrix §13.4 and §16.6 is **not** marked passed here. Rows 1–5 can now run against live `/admin` (`rev1/live/*.png`).

## Backlog update

The 890 line reads `PARTIALLY IMPLEMENTED (revision 1)`; `docs/backlog.md` stays at 80 lines (no growth, no `BACKLOG LIMIT BREACH`).


# Revision 2 (review 2, 2026-10-01) — executed 2026-10-01

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: remove the Story-added gutter (Box py="md") from the 3 DashboardGrid exports; semantic queries: "Box py", "StoryPageGutter", "MantineDashboardGrid px"; inspected candidates: src/stories/patterns/mantine/DashboardGrid.stories.tsx, src/design-system/mantine/patterns/MantineDashboardGrid.tsx (own gutter :56), Patterns/Mantine/DashboardGrid; decision: REUSE; selected canonical owner: MantineDashboardGrid; Mantine/TailAdmin token path: the grid's own theme gutters; new hardcoded visual values: NONE; rationale: the grid carries its own gutter, so GR-3d forbids a Story wrapper.`

## What changed (G1)

`DashboardGrid.stories.tsx`: the `<Box py="md">` wrapper and its closing tag are gone from `Default`, `MaxColumns` and `DeferredFourUp` (each `render` returns `<MantineDashboardGrid>` directly); `Box` dropped from the `@mantine/core` import; a GR-3d comment above `Default` says the grid carries its own gutter (`MantineDashboardGrid.tsx:56`). No other file was edited. Hash before `50b4c6d5cea22fb7f2e1d60771e8ff79e6205323` (I0) → after `d64078ea44b8fe12d5ffbeef87b98d052671df36`. `rev2/i0-status.txt` = 18 lines (the revision 1 working tree, no new paths).

One slip, fixed in-session: my first scripted edit dropped the lines inside the `Box` and wrote a BOM; I rewrote the file in full from the content read at I0 (same text, minus `Box`), and `head -c3` shows no BOM.

## Probe (step 3) — `rev2/after-dashboardgrid.txt` (36 rows: 3 ids × en/uk × 6 widths), after `build-storybook` exit 0

No page overflow in any row; no clipped text; edge gap 16/16 at 320 and 390, 24/24 at 768, 1024, 1280 and 1440. Row-1 widths equal `rev1/after-blast.txt` for every id and width in `en` (compared above: `Default` 226×4 / 290×4 / 330×4 at 1024 / 1280 / 1440; `MaxColumns` 476 / 604 / 684 ×2; `DeferredFourUp` 476×2 at 1024, 290×4 and 330×4 from 1280).

## Step 4 — per-Story receipts (G2, AC17)

Format per id: GR-3b (page overflow, row-1 card widths), GR-3c (computed font sizes: h1 / largest h2 / largest of all elements), GR-3d (gutter profile, edge gap), and clipped text. `h1 null` / `h2max null` means the Story has no such heading. The `DashboardStatRows` Stories hold no Card, so there is no card-width or edge measurement; their only text is 16px.

- `patterns-mantine-agentstatisticsview--activity-error` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[309,309,309] 1280:[395,395,395] 1440:[448,448,448]. **GR-3c** (en) 320: h1 20 / h2max 20 / max 20; 390: h1 20 / h2max 20 / max 20; 768: h1 24 / h2max 20 / max 30; 1024: h1 24 / h2max 20 / max 30; 1280: h1 24 / h2max 20 / max 30; 1440: h1 24 / h2max 20 / max 30. **GR-3d** own gutter (AgentStatisticsView.tsx renders MantineDashboardGrid, import at :12; gutter MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24 (the probe row shows 0/24 from 768 up because of zero-width hidden table-row cards; `probe-agent-edge.out.txt` lists every card: real cards span 24-1000 at 1024 and 24-1416 at 1440). Clipped text: none.
- `patterns-mantine-agentstatisticsview--activity-stale` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[309,309,309] 1280:[395,395,395] 1440:[448,448,448]. **GR-3c** (en) 320: h1 20 / h2max 20 / max 20; 390: h1 20 / h2max 20 / max 20; 768: h1 24 / h2max 20 / max 30; 1024: h1 24 / h2max 20 / max 30; 1280: h1 24 / h2max 20 / max 30; 1440: h1 24 / h2max 20 / max 30. **GR-3d** own gutter (AgentStatisticsView.tsx renders MantineDashboardGrid, import at :12; gutter MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24 (the probe row shows 0/24 from 768 up because of zero-width hidden table-row cards; `probe-agent-edge.out.txt` lists every card: real cards span 24-1000 at 1024 and 24-1416 at 1440). Clipped text: en320 ["span[Data updated at 09/16/2026].
- `patterns-mantine-agentstatisticsview--agt-01-all-zero` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[309,309,309] 1280:[395,395,395] 1440:[448,448,448]. **GR-3c** (en) 320: h1 20 / h2max 20 / max 20; 390: h1 20 / h2max 20 / max 20; 768: h1 24 / h2max 20 / max 30; 1024: h1 24 / h2max 20 / max 30; 1280: h1 24 / h2max 20 / max 30; 1440: h1 24 / h2max 20 / max 30. **GR-3d** own gutter (AgentStatisticsView.tsx renders MantineDashboardGrid, import at :12; gutter MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24 (the probe row shows 0/24 from 768 up because of zero-width hidden table-row cards; `probe-agent-edge.out.txt` lists every card: real cards span 24-1000 at 1024 and 24-1416 at 1440). Clipped text: none.
- `patterns-mantine-agentstatisticsview--agt-10-empty` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[309,309,309] 1280:[395,395,395] 1440:[448,448,448]. **GR-3c** (en) 320: h1 20 / h2max 20 / max 20; 390: h1 20 / h2max 20 / max 20; 768: h1 24 / h2max 20 / max 30; 1024: h1 24 / h2max 20 / max 30; 1280: h1 24 / h2max 20 / max 30; 1440: h1 24 / h2max 20 / max 30. **GR-3d** own gutter (AgentStatisticsView.tsx renders MantineDashboardGrid, import at :12; gutter MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24 (the probe row shows 0/24 from 768 up because of zero-width hidden table-row cards; `probe-agent-edge.out.txt` lists every card: real cards span 24-1000 at 1024 and 24-1416 at 1440). Clipped text: none.
- `patterns-mantine-agentstatisticsview--agt-10-filtered-empty` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[309,309,309] 1280:[395,395,395] 1440:[448,448,448]. **GR-3c** (en) 320: h1 20 / h2max 20 / max 20; 390: h1 20 / h2max 20 / max 20; 768: h1 24 / h2max 20 / max 30; 1024: h1 24 / h2max 20 / max 30; 1280: h1 24 / h2max 20 / max 30; 1440: h1 24 / h2max 20 / max 30. **GR-3d** own gutter (AgentStatisticsView.tsx renders MantineDashboardGrid, import at :12; gutter MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24 (the probe row shows 0/24 from 768 up because of zero-width hidden table-row cards; `probe-agent-edge.out.txt` lists every card: real cards span 24-1000 at 1024 and 24-1416 at 1440). Clipped text: none.
- `patterns-mantine-agentstatisticsview--default` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[309,309,309] 1280:[395,395,395] 1440:[448,448,448]. **GR-3c** (en) 320: h1 20 / h2max 20 / max 20; 390: h1 20 / h2max 20 / max 20; 768: h1 24 / h2max 20 / max 30; 1024: h1 24 / h2max 20 / max 30; 1280: h1 24 / h2max 20 / max 30; 1440: h1 24 / h2max 20 / max 30. **GR-3d** own gutter (AgentStatisticsView.tsx renders MantineDashboardGrid, import at :12; gutter MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24 (the probe row shows 0/24 from 768 up because of zero-width hidden table-row cards; `probe-agent-edge.out.txt` lists every card: real cards span 24-1000 at 1024 and 24-1416 at 1440). Clipped text: none.
- `patterns-mantine-agentstatisticsview--no-activity` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[309,309,309] 1280:[395,395,395] 1440:[448,448,448]. **GR-3c** (en) 320: h1 20 / h2max 20 / max 20; 390: h1 20 / h2max 20 / max 20; 768: h1 24 / h2max 20 / max 30; 1024: h1 24 / h2max 20 / max 30; 1280: h1 24 / h2max 20 / max 30; 1440: h1 24 / h2max 20 / max 30. **GR-3d** own gutter (AgentStatisticsView.tsx renders MantineDashboardGrid, import at :12; gutter MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24 (the probe row shows 0/24 from 768 up because of zero-width hidden table-row cards; `probe-agent-edge.out.txt` lists every card: real cards span 24-1000 at 1024 and 24-1416 at 1440). Clipped text: none.
- `patterns-mantine-agentstatisticsview--sorted-by-views` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[309,309,309] 1280:[395,395,395] 1440:[448,448,448]. **GR-3c** (en) 320: h1 20 / h2max 20 / max 20; 390: h1 20 / h2max 20 / max 20; 768: h1 24 / h2max 20 / max 30; 1024: h1 24 / h2max 20 / max 30; 1280: h1 24 / h2max 20 / max 30; 1440: h1 24 / h2max 20 / max 30. **GR-3d** own gutter (AgentStatisticsView.tsx renders MantineDashboardGrid, import at :12; gutter MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24 (the probe row shows 0/24 from 768 up because of zero-width hidden table-row cards; `probe-agent-edge.out.txt` lists every card: real cards span 24-1000 at 1024 and 24-1416 at 1440). Clipped text: none.
- `patterns-mantine-dashboardgrid--default` (`rev2/after-dashboardgrid.txt`, en+uk): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[226,226,226,226] 1280:[290,290,290,290] 1440:[330,330,330,330]. **GR-3c** (en) 320: h1 null / h2max 20 / max 20; 390: h1 null / h2max 20 / max 20; 768: h1 null / h2max 20 / max 30; 1024: h1 null / h2max 20 / max 30; 1280: h1 null / h2max 20 / max 30; 1440: h1 null / h2max 20 / max 30. **GR-3d** gutter n/a: own gutter (MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24. Clipped text: none.
- `patterns-mantine-dashboardgrid--deferred-four-up` (`rev2/after-dashboardgrid.txt`, en+uk): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[476,476] 1280:[290,290,290,290] 1440:[330,330,330,330]. **GR-3c** (en) 320: h1 null / h2max null / max 20; 390: h1 null / h2max null / max 20; 768: h1 null / h2max null / max 30; 1024: h1 null / h2max null / max 30; 1280: h1 null / h2max null / max 30; 1440: h1 null / h2max null / max 30. **GR-3d** gutter n/a: own gutter (MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24. Clipped text: none.
- `patterns-mantine-dashboardgrid--max-columns` (`rev2/after-dashboardgrid.txt`, en+uk): **GR-3b** no page overflow; row-1 card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[476,476] 1280:[604,604] 1440:[684,684]. **GR-3c** (en) 320: h1 null / h2max null / max 20; 390: h1 null / h2max null / max 20; 768: h1 null / h2max null / max 30; 1024: h1 null / h2max null / max 30; 1280: h1 null / h2max null / max 30; 1440: h1 null / h2max null / max 30. **GR-3d** gutter n/a: own gutter (MantineDashboardGrid.tsx:56); edge gap 320=16/16 390=16/16 1024=24/24 1440=24/24. Clipped text: none.
- `patterns-mantine-dashboardstatrows--default` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[] 390:[] 768:[] 1024:[] 1280:[] 1440:[]. **GR-3c** (en) 320: h1 null / h2max null / max 16; 390: h1 null / h2max null / max 16; 768: h1 null / h2max null / max 16; 1024: h1 null / h2max null / max 16; 1280: h1 null / h2max null / max 16; 1440: h1 null / h2max null / max 16. **GR-3d** StoryPageGutter yes (DashboardStatRows.stories.tsx:34/90/107; the pattern has no gutter of its own); edge gap not measured by the card probe (rows are not Cards); gutter comes from StoryPageGutter. Clipped text: none.
- `patterns-mantine-dashboardstatrows--error` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[] 390:[] 768:[] 1024:[] 1280:[] 1440:[]. **GR-3c** (en) 320: h1 null / h2max null / max 16; 390: h1 null / h2max null / max 16; 768: h1 null / h2max null / max 16; 1024: h1 null / h2max null / max 16; 1280: h1 null / h2max null / max 16; 1440: h1 null / h2max null / max 16. **GR-3d** StoryPageGutter yes (DashboardStatRows.stories.tsx:34/90/107; the pattern has no gutter of its own); edge gap not measured by the card probe (rows are not Cards); gutter comes from StoryPageGutter. Clipped text: none.
- `patterns-mantine-dashboardstatrows--loading` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[] 390:[] 768:[] 1024:[] 1280:[] 1440:[]. **GR-3c** (en) 320: h1 null / h2max null / max 16; 390: h1 null / h2max null / max 16; 768: h1 null / h2max null / max 16; 1024: h1 null / h2max null / max 16; 1280: h1 null / h2max null / max 16; 1440: h1 null / h2max null / max 16. **GR-3d** StoryPageGutter yes (DashboardStatRows.stories.tsx:34/90/107; the pattern has no gutter of its own); edge gap not measured by the card probe (rows are not Cards); gutter comes from StoryPageGutter. Clipped text: none.
- `patterns-mantine-dashboardstatrows--no-links` (`rev1/after-blast.txt`, en): **GR-3b** no page overflow; row-1 card widths (en) 320:[] 390:[] 768:[] 1024:[] 1280:[] 1440:[]. **GR-3c** (en) 320: h1 null / h2max null / max 16; 390: h1 null / h2max null / max 16; 768: h1 null / h2max null / max 16; 1024: h1 null / h2max null / max 16; 1280: h1 null / h2max null / max 16; 1440: h1 null / h2max null / max 16. **GR-3d** StoryPageGutter yes (DashboardStatRows.stories.tsx:34/90/107; the pattern has no gutter of its own); edge gap not measured by the card probe (rows are not Cards); gutter comes from StoryPageGutter. Clipped text: none.

Note on the `AgentStatisticsView` edge: `rev1/after-blast.txt` prints `0/24` from 768 up because `.mantine-Card-root` also matches ten zero-width (w0) table-row cards that are hidden at those widths. `rev2/probe-agent-edge.out.txt` lists every card at 768 / 1024 / 1440: all visible cards sit at 24 on the left and 24 on the right. Neither this file nor `AgentStatisticsView.tsx` changed.

## Step 5 — gates (`rev2/*.txt`, `EXIT_CODE=` inside each file)

| Command | Exit |
|---|---|
| `node -p platform` | `win32 v22.22.3` |
| `npm run typecheck` | 0 |
| `npx eslint …/DashboardGrid.stories.tsx` | 0 |
| `npm run check:stories` | 0 |
| `npm run check:story-coverage` | 0 |
| `npm run check:design-tokens:strict` | 0 |
| `npm run build-storybook` | 0 |
| `npm run build` | 0 — `/admin` First Load JS 469 kB (unchanged from revision 1; the 429 → 469 kB figure stands) |
| `npm run check:file-integrity` | 0 (the first run failed on BOMs that PowerShell 5.1 `>` wrote into my own `rev2/*.txt` evidence files; I stripped them from the 17-file `rev2/` manifest and re-ran) |
| `npm run check:mojibake` | 0 |
| `git grep -n -E "<Box|[^a-zA-Z](p|px|py)="` on the Story | prints nothing, exit 1 (expected) |

## Acceptance criteria added

- **AC16** — the `git grep` prints nothing (`rev2/grep-box.txt`); the three exports measure 16/16/24/24 with row-1 widths equal to `rev1/after-blast.txt` (`rev2/after-dashboardgrid.txt`).
- **AC17** — the 15 receipts above: 3 `DashboardGrid`, 4 `DashboardStatRows` and 8 `AgentStatisticsView` ids, each citing its probe file.

## Files Changed in revision 2

| Path | Reason |
|---|---|
| `src/stories/patterns/mantine/DashboardGrid.stories.tsx` | G1: `Box py="md"` removed from 3 exports, `Box` import dropped, GR-3d comment. Hash `d64078ea44b8fe12d5ffbeef87b98d052671df36`. |
| `docs/backlog.md`, this log, `docs/sessions/evidence/task890/rev2/**` | records. |

## Limitations, deviations, questions for Opus (revision 2)

1. `check:locale-leak:mantine-only` (about 2 hours) is owed by the owner (§17.3); revision 2 adds no visible text.
2. The `AgentStatisticsView` `0/24` in `rev1/after-blast.txt` is a probe artifact (hidden zero-width cards), explained and re-measured above; `probe-rev1.mjs` was not changed.
3. The owner visual matrix §13.4 and §16.6 is not marked passed here.

## Backlog update

The 890 lines read `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 2)`; `docs/backlog.md` line count unchanged (edit in place).

# Revision 3 (review 3, 2026-10-01) — executed 2026-10-01

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: vertical gutter on the dashboard grid root; semantic queries: "MantineDashboardGrid px", "TailAdmin p-4 md:p-6 content wrapper"; inspected candidates: src/design-system/mantine/patterns/MantineDashboardGrid.tsx, docs/tailadmin-style-reference.md:531-536, Patterns/Mantine/DashboardGrid; decision: EXTEND; selected canonical owner: MantineDashboardGrid; Mantine/TailAdmin token path: theme spacing keys md/xl (already in use); new hardcoded visual values: NONE; rationale: the grid copied only the horizontal half of TailAdmin's p-4 md:p-6.`

## What changed (G3, AC18)

`MantineDashboardGrid.tsx:58`: root `Box` `px={{ base: 'md', md: 'xl' }}` → `p={{ base: 'md', md: 'xl' }}`; the doc comment now cites `docs/tailadmin-style-reference.md:531-536`. Nothing else changed (no `pb-20`). Hash before `646ce526e09d983399662bca3f6d330f87882cf3` (I0) → after `57cd9902b4f7dd8eb003b5b8e0ebf64760657f44`. The five Stories were confirmed to add no `StoryPageGutter` or wrapper around the grid and were not edited.

## Correction to my earlier statement

While preparing the live step I wrote "`.env.local` has no agent credentials". That was wrong: it has `HYDRATION_AGENT1_*` and `HYDRATION_AGENT2_*` (my grep only matched some prefixes). The agent live proof below used AGENT1.

## Step 4 — four-side probe (`rev3/four-sides.txt`; method `edge-audit-v2.mjs` copied to `rev3/four-sides-probe.mjs` with widths 320/390/1024/1440 and the shell offset; `build-storybook` exit 0)

28 ids (5 Stories) × 4 widths, `en`. No side is at 0 anywhere. Grid-carrying exports: 16 at 320/390 and 24 at 1024/1440 on every side. `AdminDashboardView` was measured from the shell's main content edge (raw probe values minus header 72 / navbar 240).

## Step 5 — live (`rev3/start.log`, `rev3/live/`)

`npm run build` exit 0, `npm run start` on :3000, `capture:admin-session` exit 0; the agent session came from `rev3/capture-agent1-session.mjs` (a copy of the admin capture using `HYDRATION_AGENT1_*`; it writes the git-ignored `playwright/.auth/agent1-storage-state.json`). Gap from the header's bottom edge to the page title:

| URL | 390 | 1280 | Source |
|---|---|---|---|
| `/admin` (admin) | 16 | 24 | `live/live-gap.out.txt` |
| `/en/cabinet/statistics` (agent 1) | 16 | 24 | `live/live-gap-cabinet.out.txt` |

(The first cabinet attempt with the admin session redirected to `/en/cabinet`; its rows in `live-gap.out.txt` are not a valid measurement.) `start.log`: 0 lines match `Functions cannot be passed` or `Attempted to call`; 0 `[AdminTrends]` lines. Screenshots are in `rev3/live/`.

## Step 6 — receipts

GR-3d, one per Story id (four sides; `bottom` is the gap to the document end, so for a page shorter than the viewport it is the free canvas below, not a gutter — the full-page exports show 16 / 24):

- `patterns-mantine-admindashboardrecentlistings--default` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 468; 390: top 16 / left 16 / right 16 / bottom 488; 1024: top 24 / left 24 / right 24 / bottom 596; 1440: top 24 / left 24 / right 24 / bottom 596. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-admindashboardrecentlistings--empty` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 598; 390: top 16 / left 16 / right 16 / bottom 598; 1024: top 24 / left 24 / right 24 / bottom 590; 1440: top 24 / left 24 / right 24 / bottom 590. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-admindashboardrecentlistings--modal-open` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 468; 390: top 16 / left 16 / right 16 / bottom 488; 1024: top 24 / left 24 / right 24 / bottom 596; 1440: top 24 / left 24 / right 24 / bottom 596. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-admindashboardview--activity-empty-period` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--activity-error` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--activity-stale` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--adm-02-error` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--adm-09-zero` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--all-queues-zero` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--cities-only-other` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--default` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--no-location-requests` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-admindashboardview--trends-error` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58, `p={{ base: 'md', md: 'xl' }}`), Story adds nothing; measured from the AdminShell main content edge (header 72, navbar 240 from 1024 — `live/live-gap.out.txt`).
- `patterns-mantine-agentstatisticsview--activity-error` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-agentstatisticsview--activity-stale` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-agentstatisticsview--agt-01-all-zero` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-agentstatisticsview--agt-10-empty` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-agentstatisticsview--agt-10-filtered-empty` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-agentstatisticsview--default` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-agentstatisticsview--no-activity` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-agentstatisticsview--sorted-by-views` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 24; 1440: top 24 / left 24 / right 24 / bottom 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-dashboardcard--default` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 150; 390: top 16 / left 16 / right 16 / bottom 150; 1024: top 16 / left 16 / right 16 / bottom 648; 1440: top 16 / left 16 / right 16 / bottom 668. see note 1.
- `patterns-mantine-dashboardcard--error` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 668; 390: top 16 / left 16 / right 46 / bottom 668; 1024: top 16 / left 16 / right 680 / bottom 668; 1440: top 16 / left 16 / right 1096 / bottom 668. see note 1.
- `patterns-mantine-dashboardcard--fill` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 520; 390: top 16 / left 16 / right 16 / bottom 520; 1024: top 24 / left 24 / right 24 / bottom 654; 1440: top 24 / left 24 / right 24 / bottom 654. see note 1.
- `patterns-mantine-dashboardcard--loading` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 706; 390: top 16 / left 16 / right 46 / bottom 706; 1024: top 16 / left 16 / right 680 / bottom 706; 1440: top 16 / left 16 / right 1096 / bottom 706. see note 1.
- `patterns-mantine-dashboardgrid--default` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 16; 390: top 16 / left 16 / right 16 / bottom 16; 1024: top 24 / left 24 / right 24 / bottom 188; 1440: top 24 / left 24 / right 24 / bottom 188. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-dashboardgrid--deferred-four-up` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 140; 390: top 16 / left 16 / right 16 / bottom 140; 1024: top 24 / left 24 / right 24 / bottom 488; 1440: top 24 / left 24 / right 24 / bottom 694. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.
- `patterns-mantine-dashboardgrid--max-columns` — **GR-3d STORY GUTTER CHECK** top/left/right/bottom: 320: top 16 / left 16 / right 16 / bottom 140; 390: top 16 / left 16 / right 16 / bottom 140; 1024: top 24 / left 24 / right 24 / bottom 488; 1440: top 24 / left 24 / right 24 / bottom 488. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing.

GR-3b / GR-3c for `DashboardGrid` and `DashboardCard` (`rev3/after-grid-card.txt`, en+uk, 320–1440):

- `patterns-mantine-dashboardcard--default` — **GR-3b** no page overflow (en, uk), no clipped text; first-row card widths (en) 320:[288] 390:[358] 768:[360,360] 1024:[236,236,236,236] 1280:[300,300,300,300] 1440:[340,340,340,340]. **GR-3c** (en) 320: h2max 20 / max 20; 390: h2max 20 / max 20; 768: h2max 20 / max 20; 1024: h2max 20 / max 20; 1280: h2max 20 / max 20; 1440: h2max 20 / max 20.
- `patterns-mantine-dashboardcard--error` — **GR-3b** no page overflow (en, uk), no clipped text; first-row card widths (en) 320:[288] 390:[328] 768:[328] 1024:[328] 1280:[328] 1440:[328]. **GR-3c** (en) 320: h2max 20 / max 20; 390: h2max 20 / max 20; 768: h2max 20 / max 20; 1024: h2max 20 / max 20; 1280: h2max 20 / max 20; 1440: h2max 20 / max 20.
- `patterns-mantine-dashboardcard--fill` — **GR-3b** no page overflow (en, uk), no clipped text; first-row card widths (en) 320:[288] 390:[358] 768:[720] 1024:[643,309] 1280:[813,395] 1440:[920,448]. **GR-3c** (en) 320: h2max 20 / max 20; 390: h2max 20 / max 20; 768: h2max 20 / max 20; 1024: h2max 20 / max 20; 1280: h2max 20 / max 20; 1440: h2max 20 / max 20.
- `patterns-mantine-dashboardcard--loading` — **GR-3b** no page overflow (en, uk), no clipped text; first-row card widths (en) 320:[288] 390:[328] 768:[328] 1024:[328] 1280:[328] 1440:[328]. **GR-3c** (en) 320: h2max 20 / max 20; 390: h2max 20 / max 20; 768: h2max 20 / max 20; 1024: h2max 20 / max 20; 1280: h2max 20 / max 20; 1440: h2max 20 / max 20.
- `patterns-mantine-dashboardgrid--default` — **GR-3b** no page overflow (en, uk), no clipped text; first-row card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[226,226,226,226] 1280:[290,290,290,290] 1440:[330,330,330,330]. **GR-3c** (en) 320: h2max 20 / max 20; 390: h2max 20 / max 20; 768: h2max 20 / max 30; 1024: h2max 20 / max 30; 1280: h2max 20 / max 30; 1440: h2max 20 / max 30.
- `patterns-mantine-dashboardgrid--deferred-four-up` — **GR-3b** no page overflow (en, uk), no clipped text; first-row card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[476,476] 1280:[290,290,290,290] 1440:[330,330,330,330]. **GR-3c** (en) 320: h2max null / max 20; 390: h2max null / max 20; 768: h2max null / max 30; 1024: h2max null / max 30; 1280: h2max null / max 30; 1440: h2max null / max 30.
- `patterns-mantine-dashboardgrid--max-columns` — **GR-3b** no page overflow (en, uk), no clipped text; first-row card widths (en) 320:[288] 390:[358] 768:[348,348] 1024:[476,476] 1280:[604,604] 1440:[684,684]. **GR-3c** (en) 320: h2max null / max 20; 390: h2max null / max 20; 768: h2max null / max 30; 1024: h2max null / max 30; 1280: h2max null / max 30; 1440: h2max null / max 30.

## Step 7 — gates (`rev3/*.txt`, `EXIT_CODE=` inside each file)

`platform.txt` `win32 v22.22.3`; `typecheck` 0; `eslint` (the grid) 0; `check:stories` 0; `check:story-coverage` 0; `check:design-tokens:strict` 0; `check:pattern-enrolment` 0; `build-storybook` 0; `build` 0 (`/admin` 10.7 kB / 469 kB; `/[locale]/cabinet/statistics` 9.89 kB / 488 kB); `check:mojibake` 0; `check:file-integrity` see `rev3/check-file-integrity.txt`.

## Acceptance criteria added

- **AC18** — `MantineDashboardGrid.tsx:58` sets `p={{ base: 'md', md: 'xl' }}` and no other padding prop.
- **AC19** — `rev3/four-sides.txt`: no side at 0 for any of the 28 ids; the grid exports show 16/16/16/16 at 320/390 and 24 on all sides at 1024/1440 (shell offsets removed for `AdminDashboardView`).
- **AC20** — `/admin` title 16px under the header at 390 and 24px at 1280 (`live/live-gap.out.txt`); `/cabinet/statistics` the same.

## Files Changed in revision 3

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineDashboardGrid.tsx` | G3: root padding on four sides, doc comment. Hash `57cd9902b4f7dd8eb003b5b8e0ebf64760657f44`. |
| `docs/backlog.md`, this log, `docs/sessions/evidence/task890/rev3/**` | records. |

## Limitations, deviations, questions for Opus (revision 3)

1. **Note 1 — `DashboardCard` `Default` / `Loading` / `Error` write their own gutter.** `DashboardCard.stories.tsx:71` and `:132` wrap content in `<Box p="md" maw={…emptyState}>`, which GR-3d forbids; it measures 16 on every width (not 24 at 1024/1440) and the narrow `maw` leaves the right side at 46 / 680 / 1096. §18.4 says these Stories are measured, not edited, and they do not wrap the grid, so I did not touch them. `Fill` renders the grid and measures 24. Probably Task 909's day-one list; your call.
2. `AdminDashboardRecentListings` and `AgentStatisticsView` Stories add no gutter and measure the grid's own 16/24 on all sides.
3. The owner visual matrix §13.4 / §16.6 / §18.6 is not marked passed; `check:locale-leak:mantine-only` remains owed by the owner.
4. The live `/admin` screenshots from before this revision (rev1) no longer show the top gap that is now present.

## Backlog update

The 890 lines read `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 3)`; `docs/backlog.md` stays at 80 lines.

# Revision 4 (review 4, 2026-10-01) — executed 2026-10-01

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: Story gutter for DashboardCard Default/Loading/Error; semantic queries: "StoryPageGutter", "Box p=md maw", "MantineDashboardCard page gutter"; inspected candidates: src/stories/patterns/mantine/DashboardCard.stories.tsx, src/stories/_StoryPageGutter.tsx, MantineDashboardCard (no own page gutter), MantineDashboardGrid.tsx:58; decision: REUSE; selected canonical owner: StoryPageGutter; Mantine/TailAdmin token path: the profile inside StoryPageGutter; new hardcoded visual values: NONE; rationale: a card's padding is not a page gutter, so the Story takes the canonical profile.`

## What changed (G4)

`DashboardCard.stories.tsx`: `Default` wraps its `SimpleGrid` in `<StoryPageGutter>` and loses `p="md"`; `Loading` and `Error` replace `<Box p="md" maw={…emptyState}>` with `<StoryPageGutter>`; `Fill` is untouched. `Box` and `theme` imports dropped, `StoryPageGutter` imported from `@/stories/_StoryPageGutter`, one GR-3d comment added. Hash before `4bf94964e97e4e93da230c0f50a2ee6118e63bac` (I0) → after `34f2775dc350c747724859a168249b1529beb034`. The file has no BOM. No other product file changed.

## Probe (`rev4/four-sides.txt`, method `rev3/four-sides-probe.mjs`; `build-storybook` exit 0)

`Default` / `Loading` / `Error`: top 24 at every width; left/right 16/16 at 320/390 and 32/32 at 1024/1440; none under 16. `Fill` is identical to `rev3/four-sides.txt` (16/16/16 at 320/390, 24/24/24 at 1024/1440). `Loading` and `Error` cards are now the full page-column width (720 / 960 / 1216 / 1376 at 768 / 1024 / 1280 / 1440) instead of the old fixed-`maw` 328px.

## Receipts (one per `DashboardCard` export)

- `patterns-mantine-dashboardcard--default` — **GR-3d STORY GUTTER CHECK** (en, four sides): 320: top 24 / left 16 / right 16; 390: top 24 / left 16 / right 16; 1024: top 24 / left 32 / right 32; 1440: top 24 / left 32 / right 32. MantineDashboardCard has no page gutter of its own, so the Story wraps in `StoryPageGutter` (DashboardCard.stories.tsx). **GR-3b** no page overflow, no clipped text in en/uk at 320–1440 (`rev4/after-card.txt`); first-row card widths (en) 320:[288] 390:[358] 768:[352,352] 1024:[228,228,228,228] 1280:[292,292,292,292] 1440:[332,332,332,332]. **GR-3c** all 12 en/uk rows: h2 20 / max 20 (no heading above 20px).
- `patterns-mantine-dashboardcard--error` — **GR-3d STORY GUTTER CHECK** (en, four sides): 320: top 24 / left 16 / right 16; 390: top 24 / left 16 / right 16; 1024: top 24 / left 32 / right 32; 1440: top 24 / left 32 / right 32. MantineDashboardCard has no page gutter of its own, so the Story wraps in `StoryPageGutter` (DashboardCard.stories.tsx). **GR-3b** no page overflow, no clipped text in en/uk at 320–1440 (`rev4/after-card.txt`); first-row card widths (en) 320:[288] 390:[358] 768:[720] 1024:[960] 1280:[1216] 1440:[1376]. **GR-3c** all 12 en/uk rows: h2 20 / max 20 (no heading above 20px).
- `patterns-mantine-dashboardcard--fill` — **GR-3d STORY GUTTER CHECK** (en, four sides): 320: top 16 / left 16 / right 16; 390: top 16 / left 16 / right 16; 1024: top 24 / left 24 / right 24; 1440: top 24 / left 24 / right 24. own gutter on all four sides (MantineDashboardGrid.tsx:58); Story adds nothing; unchanged from rev3. **GR-3b** no page overflow, no clipped text in en/uk at 320–1440 (`rev4/after-card.txt`); first-row card widths (en) 320:[288] 390:[358] 768:[720] 1024:[643,309] 1280:[813,395] 1440:[920,448]. **GR-3c** all 12 en/uk rows: h2 20 / max 20 (no heading above 20px).
- `patterns-mantine-dashboardcard--loading` — **GR-3d STORY GUTTER CHECK** (en, four sides): 320: top 24 / left 16 / right 16; 390: top 24 / left 16 / right 16; 1024: top 24 / left 32 / right 32; 1440: top 24 / left 32 / right 32. MantineDashboardCard has no page gutter of its own, so the Story wraps in `StoryPageGutter` (DashboardCard.stories.tsx). **GR-3b** no page overflow, no clipped text in en/uk at 320–1440 (`rev4/after-card.txt`); first-row card widths (en) 320:[288] 390:[358] 768:[720] 1024:[960] 1280:[1216] 1440:[1376]. **GR-3c** all 12 en/uk rows: h2 20 / max 20 (no heading above 20px).

## Gates (`rev4/*.txt`, `EXIT_CODE=` inside each file, written through Node/.NET without a BOM)

`platform.txt` `win32 v22.22.3`; `eslint` 0; `typecheck` 0; `check:stories` 0; `check:story-coverage` 0; `check:design-tokens:strict` 0; `build-storybook` 0; `build` 0; `check:mojibake` 0; `check:file-integrity` see `rev4/check-file-integrity.txt`; `git grep -E "<Box|maw=|[^a-zA-Z](p|px|py)="` on the Story prints nothing (exit 1, expected; `rev4/grep.txt`).

## Acceptance criteria added

- **AC21** — the `git grep` prints nothing; `rev4/four-sides.txt` shows `Default`/`Loading`/`Error` at top 24 and left/right 16/16/32/32 with `Fill` unchanged.

## Files Changed in revision 4

| Path | Reason |
|---|---|
| `src/stories/patterns/mantine/DashboardCard.stories.tsx` | G4: `StoryPageGutter` replaces the Story-written `p="md"` / `Box maw` on 3 exports. Hash `34f2775dc350c747724859a168249b1529beb034`. |
| `docs/backlog.md`, this log, `docs/sessions/evidence/task890/rev4/**` | records. |

## Limitations, deviations, questions for Opus (revision 4)

1. `check:locale-leak:mantine-only` is the reviewer's run (§19.5); I did not run it. Revision 4 adds no visible text.
2. The owner visual check (§19.6, `DashboardCard` `Default`/`Loading`/`Error` at 390 and 1234 `en`) is not marked passed here.
3. The `bottom` column of `four-sides.txt` is free canvas below short content, not a gutter; the Stories' `StoryPageGutter` carries 24px bottom padding (`py="xl"`).

## Backlog update

The 890 lines read `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 4)`; `docs/backlog.md` line count unchanged.