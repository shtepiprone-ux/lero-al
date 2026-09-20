# Task 855 — activity analytics on both dashboards: ADM-10, the agent single-event chart, AGT-03, the portfolio donut, and AGT-10's activity columns

Sprint 78 · P1 · QA profile **Q3** · Wave D · depends on **849, 850, 853, 854** approved **and** owner action
**O78-3** (aggregate applied, backfilled, first scheduled run confirmed) · **Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET (gated on O78-3)**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) (D78-1, D78-2, D78-5).

## 1. Mode and task type

`IMPLEMENTATION` — compose the 845 chart patterns and 849's read helpers into the two existing dashboard views, and
move two blocks to single-source aggregate data. Bundles: **UI / Current Mantine path** + **Storybook / Visual Proof**.

## 2. Objective

1. **Admin (`AdminDashboardView`, 853):**
   - The header gains the period control (7/30/custom, default 30d); per spec §17.2 it applies **only** to ADM-10.
   - Row 2's main slot becomes the **ADM-10** chart card: `MantineDashboardLineChart` multi mode with three
     independent series (recorded views, WhatsApp clicks, form inquiries), legend toggles and a data table. Under the
     chart, three labelled period totals are shown as rows, **never summed**.
   - The ADM-01 work list moves to row 3, so row 3 has ADM-01, ADM-02, ADM-06 and location requests.
   - When the aggregate is stale, the header shows the stale badge and the chart card shows its stale state.
2. **Agent (`AgentStatisticsView`, 854):**
   - **AGT-03** "Recorded views · {period}" becomes the third top card, with an honest comparison. It links to AGT-10
     sorted by views.
   - A new row 2 `Split`:
     - main: a single-event chart (`mode="single"`) with a selector — Views / WhatsApp clicks / Form inquiries. Chat
       options are **absent**, not disabled (D78-1).
     - side: the **portfolio visibility** `MantineDashboardDonut` — visible / needs action / not visible, disjoint,
       summing to all listings. **No per-segment link (owner decision OD-1 = B, 2026-09-20 — Task 845 §16.2/§18.1).**
   - **AGT-10** gains the columns recorded views, WhatsApp clicks and last activity. Every numeric column is sortable
     across all pages; columns are never summed. On mobile each value is a labelled row.
   - **AGT-05** and AGT-10's form column switch to the aggregate, so card, chart and table read one source. 848's
     direct inquiry-count query is removed.

## 3. Verified context — to be re-measured at I0 (these artifacts are created by earlier Sprint 78 tasks)

- 849: `src/modules/analytics/activity/read.ts` → `getPlatformActivitySeries(period)`,
  `getOwnerActivitySeries(ownerId, period)`, `getOwnerActivityByListing(ownerId, period)`, `getActivityFreshness(now)`;
  `theme.other.chartSeries` keys (845).
- 845: `MantineDashboardLineChart` (`multi` / `single`, empty, loading, error — **there is no table toggle: owner
  decision OD-1 = B, 2026-09-20, Task 845 §16.2/§18.1 waives §17.4's tabular text alternative**) and
  `MantineDashboardDonut` (no per-segment href, same decision). Tooltips are ApexCharts' own native tooltip (D845-4).
- 846: `MantineDashboardPeriodControl`, `resolvePeriod`, `previousPeriod`, `compareToPrevious`, `listDates`.
- 848: `getAgentStatisticsData` incl. `statusCounts` (all 7 statuses), AGT-01 hidden count, and the documented
  admin-client inquiry-count function (removed here, R6).
- 853/854: the two views, their Stories and fixtures.
- 850: guest WhatsApp clicks are recorded from its deploy onward. Days before it have **only** signed-in clicks, so the
  WhatsApp series has a visible step at 850's deploy date. That is expected and is stated in the chart's WhatsApp
  tooltip (R7).

### 3.1 Spec rules restated (v3.3 §3, §4, §17.2 ADM-10, §17.3 AGT-03/04/05/10, §17.4)

- Series are independent; never "interactions", "leads" or "conversion"; tooltips name the exact event:
  - WhatsApp: *"a recorded attempt to follow the button; it does not confirm a message or reply"*;
  - form: *"a stored inquiry; it does not confirm email delivery or reading"*;
  - views: *"a recorded view after de-duplication, not a unique visitor"*.
- Periods = completed Tirane days ending yesterday; no current day; a comparison only against an equal previous period;
  a previous value of 0 → "no base for comparison"; no pseudo-percent trend on the chart itself.
- AGT-03: the label contains the period; a comparison caption only when the previous period has data; no
  unique-visitor wording.
- AGT-10: columns views, WhatsApp, form, last activity; sortable, never summed; mobile = labelled rows.
- Whole period empty → the chart's empty state; a single empty day → an axis point at 0.
- Stale aggregate → last valid values + a prominent "updated at …" badge; never presented as current, never 0.
- Portfolio donut (§16.3): visible / needs action / not visible. **Segments do not navigate** (OD-1 = B, 2026-09-20).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | ADM-10 | Admin page reads `?period=` (846 parser; default 30d) and fetches `getPlatformActivitySeries` + `getActivityFreshness` in the page's existing parallel fetch; `AdminDashboardView` renders the ADM-10 card per §2.1 with `series` from `theme.other.chartSeries` (`recordedViews`, `whatsappClicks`, `formInquiries`), dates labelled via a Tirane date helper, totals as `MantineDashboardStatRows` (three rows, no sum, each row links to nothing — analytic totals carry no decorative CTA, spec §17.4). | P0 | AC1, AC2 | Confirmed |
| **R2** | spec §17.2 layout | Row 3 becomes `TopRow` of ADM-01 / ADM-02 / ADM-06 work lists + location requests (conditional); nothing else in 853's composition changes. | P1 | AC1 | Confirmed |
| **R3** | AGT-03 | Agent page fetches `getOwnerActivitySeries` (current + previous period) and `getActivityFreshness`; AGT-03 StatCard per §3.1, `href` = AGT-10 sorted by views (`?sort=views_desc`). | P0 | AC3 | Confirmed |
| **R4** | spec §16.3 | Agent row 2: `Split` main = single-mode chart with a `SegmentedControl` selector (Views · WhatsApp clicks · Form inquiries; default Views), the selection in `?event=`; side = portfolio donut with segments `visible` (848 visible), `needs_action` (pending + active_hidden), `not_visible` (inactive + sold + rented + archived + expired). Sum = all listings (asserted in a unit test of the mapping function). **No segment hrefs — owner decision OD-1 = B, 2026-09-20 (Task 845 §16.2/§18.1); the cabinet-filter drill-down recorded by 848/854 is not wired from this donut.** | P0 | AC3, AC4 | Confirmed |
| **R5** | AGT-10 | Table columns added: recorded views, WhatsApp clicks, last activity date (`RelativeTime` + absolute label). When the sort key is an activity column, rows are sorted over **all** of the owner's listings (848's owner listing list + `getOwnerActivityByListing`, merged by `listing_id`, missing = 0 after a successful read) and then paginated (10/page). Mobile card meta rows: Views / WhatsApp / Form / Last activity, each labelled. | P0 | AC5 | Confirmed |
| **R6** | single source | AGT-05's value/comparison and AGT-10's form column come from the aggregate. 848's admin-client inquiry-count function and its test cases are **deleted**, and `git grep` confirms no remaining caller (clause 9 deletion audit). | P1 | AC6 | Confirmed |
| **R7** | spec §3 | Tooltip / description texts per §3.1 for every series and card; the WhatsApp tooltip adds that guest clicks are recorded from {850 deploy date}, which the executor reads from the approved 850 record (the archive row date) and passes as a translated sentence with the date formatted per locale. | P1 | AC7 | Confirmed |
| **R8** | stale | When `freshness.stale`, the admin and agent headers show the stale badge with "Data updated at {Tirane time}", and the charts render their data plus the card's stale state; when the freshness read fails, charts show their error state (never zeros). | P0 | AC2 | Confirmed |
| **R9** | 16c, GR-3 | `Patterns/Mantine/AdminDashboardView` and `Patterns/Mantine/AgentStatisticsView` gain fixture states: 30-day series; all-zero period (empty); stale; freshness error; agent selector on WhatsApp; donut with 0 in one segment; AGT-10 sorted by views across pages. No new Story files (the views already have their own). | P1 | AC8 | Confirmed |
| **R10** | i18n, hardcode | All new strings in 4 locales; no `className`, Tailwind, raw values, inline styles in the edited view files; `check:i18n`, `check:design-tokens:strict`, `check:enrolled-tailwind` 0. | P0 | AC9 | Confirmed |

## 5. Assumptions and open questions

- **Admin's seven-day values** (spec ADM-10 mentions "values for 7/30 days in separate rows"): satisfied by the period
  control plus the three totals rows for the selected period. INFERENCE, reversible.
- If O78-3 is not confirmed when the executor starts → `BLOCKED — O78-3`; no code is written against an absent table.
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (3, 5, 7, 9, 11, 12, 13, 14, 16–16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6 · `docs/component-rules.md` ·
`docs/state-authority.md` · `docs/storybook-governance.md` · `docs/i18n-rules.md` · `docs/qa-rules.md` ·
`docs/performance.md` (the chart bundle now ships on two routes) · `.claude/skills/execute-task/SKILL.md` · kickoffs
845, 846, 848, 849, 853, 854.

## 7. Scope

- **Edited:** `src/app/admin/page.tsx` · `src/modules/admin/dashboard/components/AdminDashboardView.tsx` ·
  `src/app/[locale]/cabinet/statistics/page.tsx` · `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx`
  · `src/modules/cabinet/statistics/data.ts` (+ tests: R5 merge/sort, R4 mapping, R6 removal) · the two view Stories +
  fixtures · `messages/{sq,en,uk,it}.json` · `docs/backlog.md` (855 line).
- **Created:** `src/modules/cabinet/statistics/portfolio.ts` (the donut mapping, pure) + its test.

## 8. Out of scope

AGT-11 (856) · chat series/options · the aggregate job (849) · the chart patterns themselves (845 — any defect found
there is reported, not patched here) · 857–859.

## 9. Current and required behavior

**Before (after 853/854).** No activity data on either dashboard; AGT-05 counts live inquiries. **After.** §2.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes; confirm the approvals + O78-3 (sprint file); record the approved
   850 archive date; check that the census of both view files is clean before the change.
2. Unit tests first: the portfolio mapping sums to the total and puts every status in exactly one segment; the R5
   merge/sort pages correctly across 25 listings; after R6, no inquiry query remains.
3. Implement R1–R8; Stories (R9); i18n (R10).
4. **Performance note:** record the `npm run build` First Load JS for `/admin` and `/[locale]/cabinet/statistics`
   before and after. If either grows by more than the chart package's own chunk, report the import path. The chart
   views must not be imported by any other route.
5. **Live proof** (staff + agent sessions, after O78-3): the admin chart shows 30 points with tooltips; a series
   toggle; the agent selector switches series and the URL; AGT-10 sorted
   by views is consistent across pages 1 → 2 (the last value on page 1 ≥ the first value on page 2). (The table
   toggle and donut-segment navigation were removed by owner decision OD-1 = B, 2026-09-20.)

## 11. Positive and negative flows

**Positive.** An agent switches the chart to "WhatsApp clicks": one line, tooltip "17 Sep · WhatsApp clicks · 4". They
click the "Needs action" segment and land on their own listings filter.

| Negative flow | Applicable | Expected |
|---|---|---|
| Aggregate stale | Yes | Stale badge + last values; never zeros. |
| Freshness/series read fails | Yes | Chart error + Retry; other blocks fine. |
| Whole period empty | Yes | Chart empty state ("No recorded views in this period"). |
| Previous period 0 | Yes | AGT-03/AGT-05 "no base for comparison". |
| All admin series toggled off | Yes | Per 845's recorded behaviour. |
| Agent with no listings | Yes | Donut empty text; chart empty; AGT-10 empty state (854). |
| Sort by WhatsApp over pages | Yes | Global order (R5). |
| ≤ 767px | Yes | Charts full width; legend/selector wrap; AGT-10 cards with labelled rows. |

## 12. Acceptance criteria

- **AC1 [R1, R2]** — Given the admin view Story (30-day fixture) and live `/admin`, when rendered at 1440, then row 2
  shows the chart (main) and the donut (side), and row 3 shows the four work lists. Quote DOM order.
- **AC2 [R1, R8]** — Given the stale and freshness-error fixtures, when rendered, then the stale badge + data, and
  respectively the chart error, appear; no zero is shown in either.
- **AC3 [R3, R4]** — Given the agent view Story, when the selector is set to WhatsApp, then the URL/`event` state
  changes, and the chart has exactly one series whose label is "WhatsApp clicks"; AGT-03 is the third top card.
- **AC4 [R4]** — Given `npm.cmd run test -- src/modules/cabinet/statistics/__tests__`, when run, then the portfolio
  mapping test proves a disjoint, complete split (all 7 statuses + active-hidden).
- **AC5 [R5]** — Given the 25-listing fixture sorted by views, when pages 1 and 2 are read, then the order is
  non-increasing across the page boundary; mobile cards show four labelled activity rows.
- **AC6 [R6]** — Given `git --no-optional-locks grep -n -E "listing_inquiries" -- src/modules/cabinet/statistics`, when
  run, then it prints nothing.
- **AC7 [R7]** — Given the agent view at `en` and `uk`, when each tooltip is focused, then its text matches §3.1 in
  that locale, and the WhatsApp tooltip contains the 850 date.
- **AC8 [R9]** — Given `check:story-coverage` and the census of both view files, when run, then they exit 0 and remain
  `manifest:yes story:yes`.
- **AC9 [R10]** — Given
  `git --no-optional-locks grep -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/modules/admin/dashboard/components/AdminDashboardView.tsx src/modules/cabinet/statistics/components/AgentStatisticsView.tsx`,
  when run, then it prints nothing; the i18n and token gates exit 0.
- **AC10** — Given the owner matrix §13.3, when reviewed, then each tuple is accepted or returned with a concrete defect.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: AC6/AC9 empty greps scoped to named files; AC4's "disjoint, complete" is the spec's donut rule.`

`GR-3a STORY PREFLIGHT — AdminDashboardView / AgentStatisticsView × new analytics states; canonical candidates: Patterns/Mantine/AdminDashboardView, Patterns/Mantine/AgentStatisticsView (direct imports created by 853/854); decision: EXTEND both; no new Story file.`

`GR-1 CENSUS COMPLETE — both view surfaces: tier1 0 new (only enrolled patterns added: 845 charts, 846 control); tier2 0; tier3 0 listed and filed as none.`

## 13. QA profile and verification plan

**`Q3`** — composition of visible analytics on two surfaces.

### 13.1 Re-entry

`from-scratch` (gated on O78-3). Evidence root `docs/sessions/evidence/task855/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/modules/cabinet/statistics/__tests__ src/modules/admin/dashboard/__tests__ src/modules/analytics/activity/__tests__
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\modules\admin\dashboard\components\AdminDashboardView.tsx
node.exe scripts\check-surface-census.mjs --surface src\modules\cabinet\statistics\components\AgentStatisticsView.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "listing_inquiries" -- src/modules/cabinet/statistics
git --no-optional-locks grep -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/modules/admin/dashboard/components/AdminDashboardView.tsx src/modules/cabinet/statistics/components/AgentStatisticsView.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/app/admin/page.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx "src/app/[locale]/cabinet/statistics/page.tsx" src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/modules/cabinet/statistics/data.ts src/modules/cabinet/statistics/portfolio.ts
```

Expected: all exit 0 except `check:locale-leak:mantine-only` (known red, Task 836) — zero leak lines for
`patterns-mantine-admindashboardview` / `patterns-mantine-agentstatisticsview`; quote the grep. Both `git grep`s
print nothing.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize. Live: staff and agent sessions after O78-3.

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `/admin` (live) | 30d | 1440 | en | ADM-10: 3 series in distinct theme colours, toggles, native ApexCharts tooltip; totals rows; donut beside (no table, no segment links — OD-1 = B) |
| 2 | `/admin` (live) | 7d | 1024 | sq | period switch updates only ADM-10 |
| 3 | `/admin` (live) | 30d | 390 | uk | chart full width, legend wraps |
| 4 | `/en/cabinet/statistics` (live) | Views | 1440 | en | 3 top cards (AGT-01/02/03); chart + portfolio donut; table with activity columns |
| 5 | `/it/cabinet/statistics` (live) | WhatsApp | 1280 | it | one series, tooltip with the 850 note |
| 6 | `/uk/cabinet/statistics` (live) | Form | 768 / 390 / 320 | uk | stacking; listing cards with 4 labelled activity rows |
| 7 | `Patterns/Mantine/AdminDashboardView` | stale / freshness error | 1440 | en | badge + last values; error without zeros |
| 8 | `Patterns/Mantine/AgentStatisticsView` | all-zero period; previous 0 | 1440 / 390 | sq / uk | chart empty state; "no base for comparison" |

### 13.4 Evidence the executor hands over

§13.2 transcripts · First Load JS before/after · §10.5 live notes · owner matrix.

## 14. Completion report contract

Files with hashes · R1–R10 · AC1–AC10 with quotes · commands with exit codes · the 850 date used · GR receipts ·
assumptions · deviations · limitations · owner matrix. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating git. Update the 855 line of `docs/backlog.md`;
session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Series never merged? | R1/R4 + §3.1; the chart pattern has no sum path (845). |
| One data source per number? | R6 + AC6. |
| Stale ≠ zero? | R8 + AC2. |
| Gated on real data? | O78-3 precondition; `BLOCKED` otherwise. |
| Commands in blocks | §13.2. |
