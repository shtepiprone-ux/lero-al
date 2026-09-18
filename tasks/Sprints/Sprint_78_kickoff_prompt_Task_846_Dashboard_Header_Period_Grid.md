# Task 846 — `MantineDashboardHeader`, `MantineDashboardPeriodControl`, `MantineDashboardGrid`, and `src/lib/dashboard/period.ts` (Tirane completed periods)

Sprint 78 · P1 · QA profile **Q3** · Wave A, last · depends on **843** approved · **Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) (D78-1…D78-6).

## 1. Mode and task type

`IMPLEMENTATION` — three canonical layout/control patterns with Stories, plus one pure date library with unit tests.
Bundles: **UI / Current Mantine path** + **Storybook / Visual Proof**. The library is consumed by 847, 848, 849 and
855, so it lands here, before them.

## 2. Objective

1. **`src/lib/dashboard/period.ts`**: the single source for the spec's time rules (§4). It covers:
   - local days in `Europe/Tirane`;
   - presets of 7 and 30 **completed** days ending **yesterday**;
   - a custom range of at most 90 days that ends no later than yesterday;
   - the previous equal period;
   - UTC bounds of a Tirane day (for `timestamptz` queries);
   - parsing and serializing the period in URL search params;
   - a comparison helper that returns "no base" when the previous value is 0;
   - an absolute date-time label in Tirane time for 844's `RelativeTime absoluteLabel`.
2. **`MantineDashboardHeader`**: page title and subtitle on the left. On the right: "Updated at {time}", a warning
   badge **only** when stale, and a slot for the period control. It stacks below `sm`.
3. **`MantineDashboardPeriodControl`**: a `SegmentedControl` (7 days · 30 days · Custom). "Custom" reveals the
   existing `RangeDatePicker` with `maxDate` = yesterday (Tirane). It validates at most 90 days, shows a localized
   error, and emits a typed selection. The consumer owns the URL.
4. **`MantineDashboardGrid`**: the spec's 12-column dashboard layout, with three pieces. `TopRow` shows up to 4
   cards; when fewer cards are passed, it closes the grid over the missing slots instead of leaving an empty one.
   `Split` is the 8 + 4 row. `Full` is a full-width row. The container caps content width and uses theme gutters.
   Breakpoints follow spec §17.1, mapped onto the theme's `md`/`lg`/`xl`.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- **Time zone name.** IANA's canonical id is `Europe/Tirane`. Measured in Node 22.22.3 (win32):
  `new Date(...).toLocaleString('en-GB',{timeZone:'Europe/Tirane'})` → `29/03/2026, 01:30:00`; the spelling
  `'Europe/Tirana'` → **`RangeError: Invalid time zone specified: Europe/Tirana`**. The repo contains that invalid
  spelling at `src/modules/notifications/lib/emails/emailChange.ts:177`. That is a separate defect, reserved as **860**
  and not touched here. This library must use `Europe/Tirane`, and one test asserts that `Intl` accepts it.
- `src/lib/formatters.ts` composes date strings from `Date` parts instead of calling `Intl.DateTimeFormat` at render
  time, for SSR/CSR parity and because browser ICU lacks `sq` (`:81-176`, `formatDate`, `formatDateTime`). The
  absolute label here is produced **on the server only** and passed down as a string (844 R5). It must reuse
  `formatters.ts`'s per-locale layout: extend `formatters.ts` with a zone-aware variant, and do not invent a second
  layout.
- `RangeDatePicker` (`src/design-system/mantine/patterns/RangeDatePicker.tsx`, enrolled, storied, critical-flow row
  "Listings date-range filter"): `value: DateRange { from?: string; to?: string }`, `onChange`, `minDate?`,
  `maxDate?`, `placeholder?`, `disablePastDates?`. It is **reused as-is**; changing it is out of scope, because it is a
  critical flow owned by the listings filter.
- `SegmentedControl` is themed (TailAdmin §6c, `theme.ts:~797`) and storied (`Mantine/Primitives/SegmentedControl`).
- Breakpoints (`theme.ts:379-392`): `md 48em` (768), `lg 64em` (1024), `xl 80em` (1280), `xxl 90em` (1440).
  Spacing `md` 16, `xl` 24. No dashboard width role exists.
- There is no existing dashboard header, period control, grid or `src/lib/dashboard/` directory
  (`ls src/lib/dashboard` → not found).

### 3.1 Spec rules restated (v3.3)

- §4 time: store UTC; cut days in Europe/Tirane; "today" is an incomplete day and never a comparison base.
- §4 periods: standard 7 and 30 completed local days ending yesterday; comparison with the previous equal completed
  period; a custom range of at most 90 days in v1.
- §4 comparison: if the previous period's value is 0, show "no base for comparison"; never ∞%, never +100%, never a
  green/red verdict without context.
- §16.1 / §17.2 / §17.3 header: title + subtitle left; the refresh timestamp right; the period selector only where
  period-based blocks exist (admin: ADM-10 only; agent: AGT-03–05, AGT-08–11); a stale aggregate shows a warning badge
  + the last valid refresh time, never zeros.
- §17.1 shell/grid: desktop from 1280 is a 12-column grid, max content width 1440, outer spacing 24, card gap 24.
  1024–1279 keeps 12 columns. 768–1023 shows 2-column cards. Below 768, 1 column. The first row holds ≤ 4 cards, and
  a missing (unrendered) card leaves no empty slot (§16.3, §17.3 AGT-07).
- D78-5: title and subtitle sizes come from the existing theme scale (`Title order={1} size="h4"` = 24/32 — the size
  `AdminPageHeader` uses today, `text-2xl`; subtitle `Text size="sm" c="gray.5"`). No new font token.

### 3.2 Clause 16d / GR-1 census

New patterns render Mantine core, `RangeDatePicker` (enrolled, storied) and nothing legacy.
`GR-1 CENSUS COMPLETE — 3 nodes; tier1 3 migrated+enrolled+story (this task); tier2 0 imports removed; tier3 0 listed and filed as none.`

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | spec §4 | `period.ts` exports, all pure and taking `now: Date` explicitly: `TIRANE_TZ = 'Europe/Tirane'`; `tiraneDateOf(instant) → 'YYYY-MM-DD'`; `tiraneYesterday(now)`; `tiraneDayUtcBounds(date) → { startUtc: string; endUtc: string }` (half-open, DST-correct); `resolvePeriod(selection, now) → { from, to, days }` for `{ kind: '7d' } \| { kind: '30d' } \| { kind: 'custom', from, to }`; `previousPeriod(period)`; `periodUtcBounds(period)`; `listDates(period) → string[]`. | P1 | AC1 | Confirmed |
| **R2** | spec §4 | `validateCustomRange(from, to, now)` returns `ok` or one of `'end_after_yesterday' \| 'start_after_end' \| 'longer_than_90_days' \| 'invalid_date'`. `parsePeriodParams(searchParams, now)` returns a valid selection and falls back to `30d` for missing or invalid input, never throwing; `serializePeriod(selection)` is its inverse. | P1 | AC1 | Confirmed |
| **R3** | spec §4 | `compareToPrevious(current, previous)` → `{ kind: 'no_base' }` when `previous === 0`; otherwise `{ kind: 'delta', delta, percent }` with `percent` rounded to an integer. Never returns `Infinity`/`NaN`. | P1 | AC1 | Confirmed |
| **R4** | §3, 844 R5 | `formatters.ts` gains `formatDateTimeInZone(iso, locale, timeZone)`, which produces the **same per-locale layout** as `formatDateTime` but for the wall clock of `timeZone` (parts from `Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', … }).formatToParts`, composed by the existing layout code). `period.ts` exposes `tiraneAbsoluteLabel(iso, locale)` built on it. Server-only use is documented in JSDoc. | P1 | AC1 | Confirmed |
| **R5** | spec §16.1, §17.2–§17.3, D78-5 | `MantineDashboardHeader` props: `title`, `subtitle?`, `updatedAtLabel?` (a preformatted string), `stale?: { label: string }`, `periodControl?: ReactNode`. Title = `Title order={1} size="h4"`; subtitle = `Text size="sm" c="gray.5"`. `updatedAtLabel` = `Text size="xs" c="gray.5"`. `stale` = yellow `Badge` with an icon and the label. Layout: `Group justify="space-between"` from `sm`, `Stack` below `sm`, the control full width below `sm`. | P1 | AC2, AC6 | Confirmed |
| **R6** | spec §16.3, §17.3 | `MantineDashboardPeriodControl` props: `value: PeriodSelection`, `onChange`, `now` (the server's `now`, ISO), labels (`label7d`, `label30d`, `labelCustom`, `rangePlaceholder`, error messages keyed by R2's codes, `scopeLabel`). It renders the canonical `SegmentedControl` (full width below `sm`). Selecting Custom renders `RangeDatePicker` with `maxDate` = Tirane yesterday. Selecting a range calls `validateCustomRange`; on error it shows the localized message (`Text c="red.7" size="xs"` with `role="alert"`) and does **not** call `onChange`. It is keyboard-operable end to end. | P1 | AC3, AC6 | Confirmed |
| **R7** | spec §17.1 | `MantineDashboardGrid` = `Container`-like root with `maw={theme.other.boxSize.dashboardContentMaxWidth}` (new role `'90rem'`, 1440px, spec §17.1), `px={{ base: 'md', md: 'xl' }}`, rows separated by `{ base: 'md', md: 'xl' }`. `TopRow`: `SimpleGrid` with `cols={{ base: 1, md: 2, lg: Math.min(n, 4) }}` where `n` = rendered children count, so 3 cards fill the row and a missing 4th leaves no gap. `Split`: Mantine `Grid` with main `span={{ base: 12, lg: 8 }}` and side `span={{ base: 12, lg: 4 }}`. `Full`: one full-width row. Gaps `{ base: 'md', md: 'xl' }` (TailAdmin `gap-4 md:gap-6`, spec 24). | P1 | AC4, AC6 | Confirmed |
| **R8** | 16c, GR-3, GR-3a | Own Stories `Patterns/Mantine/DashboardHeader` (fresh, stale, with and without period control), `Patterns/Mantine/DashboardPeriodControl` (7d selected, custom open, custom error > 90 days), `Patterns/Mantine/DashboardGrid` (TopRow with 4 and with 3 real `MantineDashboardStatCard`s from 843, Split with two `MantineDashboardCard`s, Full). All three pattern files enrolled. | P1 | AC5 | Confirmed |
| **R9** | hardcode, i18n | No raw px/rem/hex/rgb, no `className=`, no Tailwind in the pattern files; `period.ts` contains no UI. New strings for the stories and the control's default messages exist in 4 locales (`dashboard.period.*`). `check:i18n` 0. | P1 | AC5, AC7 | Confirmed |

## 5. Assumptions and open questions

- `SimpleGrid` `cols` responsive object with a computed number is standard Mantine usage. INFERENCE: counting
  rendered children via `Children.toArray(children).filter(Boolean).length` is sufficient because consumers pass
  cards conditionally (`{cond && <Card/>}`).
- The `now` the control receives is the server's request time, so server and client agree on "yesterday" at
  hydration.
- **860 is reserved, not fixed here** (§3). No owner decision is needed for this task.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (7, 9, 11, 13, 14, 16–16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6c (segmented control) ·
`docs/component-rules.md` · `docs/storybook-governance.md` · `docs/i18n-rules.md` · `docs/state-authority.md`
(SSR/CSR date parity) · `docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md` · kickoff 843.

## 7. Scope

- **Created:** `src/lib/dashboard/period.ts` · `src/lib/dashboard/__tests__/period.test.ts` ·
  `src/design-system/mantine/patterns/MantineDashboardHeader.tsx` · `…/MantineDashboardPeriodControl.tsx` ·
  `…/MantineDashboardGrid.tsx` · `src/stories/patterns/mantine/DashboardHeader.stories.tsx` ·
  `…/DashboardPeriodControl.stories.tsx` · `…/DashboardGrid.stories.tsx`.
- **Edited:** `src/lib/formatters.ts` (one new export, R4; existing exports byte-unchanged in behaviour) ·
  `src/lib/__tests__/` (a new test file for `formatDateTimeInZone`, or cases added to an existing formatters test if
  one exists — executor records which) · `src/design-system/mantine/theme.ts` (`boxSize.dashboardContentMaxWidth`) ·
  `patterns/index.ts` · `scripts/mantine-migration-scope.json` (3) · `messages/{sq,en,uk,it}.json`
  (`dashboard.period.*`, story strings) · `docs/backlog.md` (846 line).

## 8. Out of scope

`RangeDatePicker.tsx` and its Story (reused as-is) · `emailChange.ts` (860) · consumers (853/854) · any query code
(847/848/849).

## 9. Current and required behavior

**Before.** There is no period concept anywhere. `/admin` computes `weekAgo = Date.now() - 7d` in UTC, including the
incomplete current day (`page.tsx:14`); 853 removes that. **After.** The library and three storied patterns exist;
nothing a user sees changes yet.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes of edited files; re-run §3's Node time-zone probe and record it;
   `node.exe -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"` (record the machine zone — the tests
   must not depend on it).
2. **Tests first** for R1–R4, with explicit `now` values:
   - a normal day;
   - `now` = 2026-03-29 00:30 UTC (the Tirane DST start day; that local day is 23 hours long);
   - `now` = 2026-10-25 12:00 UTC (the DST end day; that local day is 25 hours long);
   - `now` = 2026-09-18 22:30 UTC (already the 19th in Tirane, so "yesterday" must be 2026-09-18).
   Also cover: the 7d/30d ranges end yesterday and contain exactly 7/30 dates; the previous period is adjacent and
   equal in length; the custom validation codes; the parse fallbacks; `compareToPrevious(5, 0)` → `no_base`; and
   `TIRANE_TZ` accepted by `Intl`.
   Run them red (module missing), then implement, then green. Record both transcripts.
3. Implement `period.ts` without new dependencies (`Intl` + arithmetic; `date-fns` 4 is available if it helps, since
   it is already in `package.json`). Implement `formatDateTimeInZone` inside `formatters.ts` next to `formatDateTime`,
   reusing its layout composition.
4. Token `dashboardContentMaxWidth: '90rem', // 1440px — Task 846: dashboard content cap (spec v3.3 §17.1)` + union.
5. Patterns per R5–R7 with JSDoc provenance. `MantineDashboardPeriodControl` is `'use client'`; Header and Grid carry
   no client hook unless needed. If one is needed, record why.
6. Stories (GR-3a `CREATE`, §12): toolbar-driven, fixtures declared; the Grid story uses real 843 components.
7. Enrol the three pattern files; barrel exports.

## 11. Positive and negative flows

**Positive.** With `now` = 2026-09-18 10:00 Tirane, the agent picks "30 days": the selection resolves to 2026-08-19 …
2026-09-17, and the previous period to 2026-07-20 … 2026-08-18. The URL holds `period=30d`.

| Negative flow | Applicable | Expected |
|---|---|---|
| Custom range ending today | Yes | Not selectable (`maxDate` = yesterday). If supplied via the URL, `parsePeriodParams` falls back to `30d`. |
| Custom range > 90 days | Yes | Localized error with `role="alert"`; `onChange` not called. |
| Start after end | Yes | Error code `start_after_end`. |
| Garbage `?period=` | Yes | Falls back to `30d`; no throw. |
| DST days | Yes | Day bounds are 23h/25h long; tests prove it. |
| Previous period 0 | Yes | `no_base`. |
| 3 top cards | Yes | `TopRow` renders 3 columns at `lg`, no empty 4th slot. |
| Narrow `uk` header | Yes | Title, subtitle, updated-at and control stack; control full width; no overflow at 320. |
| Authorization / data | No | Pure library + presentational patterns. |

## 12. Acceptance criteria

- **AC1 [R1–R4]** — Given `npm.cmd run test -- src/lib/dashboard/__tests__/period.test.ts` and the formatter test,
  when run, then all pass, and the transcript lists the four `now` cases of §10.2 by name. The red run (before the
  implementation) is retained and shows the module missing.
- **AC2 [R5]** — Given `DashboardHeader → Default` (stale state), when rendered, then the badge shows an icon and the
  stale label text; in the fresh state no badge element exists in the DOM.
- **AC3 [R6]** — Given `DashboardPeriodControl` in the browser, when a 120-day custom range is chosen by keyboard, then
  an element with `role="alert"` shows the localized "longer than 90 days" message, and the story's `onChange` action
  log records no call. Quote the DOM and the actions panel.
- **AC4 [R7]** — Given `DashboardGrid → Default` at 1440px, when the 3-card `TopRow` is measured, then its three
  cards' combined width plus gaps equals the row width (no empty column). At 800px there are 2 columns; at 700px, 1.
  Quote the computed `grid-template-columns` at each width.
- **AC5 [R8, R9]** — Given `check:story-coverage`, `check:pattern-enrolment`, the three censuses and
  `git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardHeader.tsx src/design-system/mantine/patterns/MantineDashboardPeriodControl.tsx src/design-system/mantine/patterns/MantineDashboardGrid.tsx`,
  when run, then the gates exit 0, each census root reads `manifest:yes story:yes`, and the grep prints nothing.
- **AC6 [R5–R7]** — Given the owner matrix §13.3, when reviewed, then each tuple is accepted or returned with a concrete defect.
- **AC7 [R9]** — Given `check:i18n`, when run, then it exits 0.

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: AC5's empty grep on three new files; AC4's "no empty column" is the spec's own layout rule measured as computed columns.`

`GR-3a STORY PREFLIGHT — MantineDashboardHeader/PeriodControl/Grid × all states; canonical candidates: NONE (Patterns/Mantine/PageHeaderWithActions renders MantinePageHeaderWithActions — a different component with an actions array and no refresh/stale/period semantics; inspected, not reused because its API is button actions, not a status line + control slot; Mantine/Primitives/SegmentedControl renders the bare primitive); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar (Task 799 caveat); decision: CREATE; targets: Patterns/Mantine/DashboardHeader, …/DashboardPeriodControl, …/DashboardGrid; rationale: new patterns with in-sprint consumers 853/854.`

`GR-3 STORY PROVEN — MantineDashboardHeader ← src/stories/patterns/mantine/DashboardHeader.stories.tsx; MantineDashboardPeriodControl ← …/DashboardPeriodControl.stories.tsx; MantineDashboardGrid ← …/DashboardGrid.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q3`** — new layout/control patterns; the library is covered by unit tests. `RangeDatePicker`'s critical-flow row is
unaffected (reused, not changed); its smoke tests are re-run as a guard.

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task846/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/lib/dashboard/__tests__/period.test.ts
npm.cmd run test -- src/lib/__tests__
npm.cmd run test -- src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx
npm.cmd run test:i18n-hydration
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardHeader.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardPeriodControl.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardGrid.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardHeader.tsx src/design-system/mantine/patterns/MantineDashboardPeriodControl.tsx src/design-system/mantine/patterns/MantineDashboardGrid.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/lib/dashboard/period.ts src/lib/formatters.ts src/design-system/mantine/theme.ts src/design-system/mantine/patterns/MantineDashboardHeader.tsx src/design-system/mantine/patterns/MantineDashboardPeriodControl.tsx src/design-system/mantine/patterns/MantineDashboardGrid.tsx
```

Expected: all exit 0 except `check:locale-leak:mantine-only` (known red, Task 836) — zero leak lines for story IDs
starting `patterns-mantine-dashboardheader`, `…dashboardperiodcontrol`, `…dashboardgrid`; quote the grep. If
`npm.cmd run test -- src/lib/__tests__` contains a failure that pre-dates this task (Task 790's list), record its
name and show it also fails at I0.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize the window.

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardHeader` | Default | 1440 | en | title/subtitle left; updated-at + period control right; stale badge yellow with icon + text |
| 2 | same | Default | 390 / 320 | uk | stacked; control full width; no overflow |
| 3 | `Patterns/Mantine/DashboardPeriodControl` | custom open, >90-day error | 1280 | it | calendar opens; yesterday is the last selectable day; error text visible |
| 4 | `Patterns/Mantine/DashboardGrid` | Default | 1440 | en | 4-card and 3-card top rows both full-width with no gap; 8+4 split; 24px gaps |
| 5 | same | Default | 1024 / 800 / 700 | sq | 4 or 3 across at 1024; 2 across at 800; 1 across at 700 |
| 6 | same | Default | 480 / 320 | uk | single column, 16px gutters |

### 13.4 Evidence the executor hands over

§13.2 transcripts · the red/green test transcripts · AC3 DOM + actions quote · AC4 computed columns · owner matrix.

## 14. Completion report contract

Files with hashes · R1–R9 · AC1–AC7 with quotes · commands with exit codes · I0 probes · GR receipts · assumptions ·
deviations · limitations · owner matrix. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`
or `BLOCKED`. No self-approval, no mutating git. Update the 846 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Duplicate? | §3 + GR-3a: `MantinePageHeaderWithActions` inspected and not reused (different API); `RangeDatePicker` reused unchanged. |
| Time-zone correctness | `Europe/Tirane` measured valid, the other spelling measured invalid; DST cases are tests, not prose. |
| Single layout source for dates | R4 extends `formatters.ts` rather than adding a second layout. |
| GR-1 / 16d | §3.2 receipt. |
| Hardcode | R7/R9; one new role, spec-sourced. |
| Commands in blocks | §13.2. |
