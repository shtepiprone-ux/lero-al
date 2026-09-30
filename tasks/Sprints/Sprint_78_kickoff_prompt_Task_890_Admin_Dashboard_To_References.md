# Task 890 — `/admin` rebuilt to the owner's references: an accent hero, queue KPIs with mini-charts, the platform activity chart, new listings and new users, and listings by city

Sprint 78 · P1 · QA profile **Q3** · Wave D (D78-9) · depends on **889** approved · folds **855**'s admin half
(ADM-10, stale badge, series tooltips) · **Status: 🔁 NEEDS REVISION — review 1, 2026-09-30. The executor starts at
§16 (revision 1), not §10.**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) → **D78-9** (owner,
2026-09-27). The owner, verbatim: *"Я не приймаю таку візуально жахливу Dashboard для адміна/модератора"*. Their
chart choices were *"Area-графік платформи, Нові оголошення/реєстрації, KPI черг з міні-графіком, Розподіл по
містах"*, and their queue trend choice was *"Нові за день (Рекомендовано)"*. Style is *"Композиція референсів"*:
composition and chart types come from the references, and every value comes from the theme (D78-5 stands).

## 1. Mode and task type

`IMPLEMENTATION` — recompose `AdminDashboardView` (853, archived) around charts, add two read functions, and read
the period from the URL. Bundles: **UI / Current Mantine path** + **DB / Server Action / RLS** (admin-client reads) +
**Storybook / Visual Proof**.

## 2. Objective

`/admin` (admins and moderators) reads like the owner's references:
- `techzaa.in/lahomes/admin/index.html`: a KPI row with mini-bars; a wide area chart with a totals strip under it; a
  distribution side card; a location breakdown;
- `omah.dexignzone.com/xhtml/index.html`: one filled hero card.

Every number stays honest: one named event per series, different events are never summed, and a queue mini-chart
shows **new items per day**, never a queue size.

### 2.1 Composition (desktop ≥ `lg`; reference block in brackets)

| Row | Grid | Content |
|---|---|---|
| Header | — | `MantineDashboardHeader`: title, subtitle, updated-at, **`MantineDashboardPeriodControl`** (7d / 30d / custom, default 30d; URL `?period=&from=&to=`). The period applies only to rows 2 and 3 main. When `freshness.stale`, the header's updated-at reads the activity data's last refresh time (R8). |
| 1 | `TopRow` (4) | **ADM-08 "Visible now"** as `variant="accent"` (Omah "Total Properties"; moved up from the old row 4). Then **ADM-01**, **ADM-02** and **ADM-06** as today, each with a `chart` = `MantineDashboardSparkline` of **new items per completed Tirane day, last 7 days** (Lahomes KPI row): new listings (`listings.created_at`), new reports (`listing_reports.created_at`), new support tickets (`support_tickets.created_at`). |
| 2 | `Split` 8 + 4 | **main:** "Platform activity · {period}" card holding `MantineDashboardLineChart mode="multi"` with three series (recorded views, WhatsApp clicks, form inquiries; `theme.other.chartSeries`) and, under it, the totals strip `MantineDashboardStatRows` (three rows, never summed, no links) (Lahomes "Sales Analytic" + its Income/Expenses/Balance strip). **side:** a `Stack` of the ADM-11 donut card (unchanged) and the ADM-09 card (unchanged, moved from the old row 4) (Kamr "Rooms Availability"). |
| 3 | `Split` 8 + 4 | **main:** "New listings and new users · {period}" card: `MantineDashboardBarChart stacked={false}` with two series per day, never stacked, because these are two different events. **side:** "Visible listings by city" card: `MantineDashboardBarChart horizontal` with the top 5 cities plus "Other" (scope "Now") (Lahomes "Sessions by Country"). |
| 4 | `TopRow` | The ADM-01 work list (moved from the old row 2), the ADM-02 and ADM-06 work lists, and location requests (conditional). This is the old row 3 plus ADM-01. |
| 5 | `Full` | Recent listings (unchanged). |

The old row 4 heading (`supply_section_title`) and its `Title` are removed, since both of its cards moved.

## 3. Verified context — measured 2026-09-27 (re-measure at I0)

- **The page:** `src/app/admin/page.tsx` is 9 lines long. It runs `Promise.all([getAdminLocale(), getAdminDashboardData()])`
  and renders `<AdminDashboardView data locale />`. It reads no `searchParams`.
- **The view** (`src/modules/admin/dashboard/components/AdminDashboardView.tsx`):
  - namespaces are `admin.dashboard`, `listing`, `admin.reports`, `admin.support` and `dashboard.common` (`:79-83`);
  - the rows sit at `:186` (queues), `:230` (ADM-01 list + donut), `:270` (ADM-02/06 lists + location requests), `:326`
    (the supply section with `Title order={2} size="h5"` `supply_section_title`, ADM-08 and ADM-09), and `:376`
    (recent listings);
  - `supply_section_title` is read only at `:329`.
- **The data:** `src/modules/admin/dashboard/queries.ts` → `getAdminDashboardData()` (`:152`) uses
  `createAdminClient()`. `rowsOf` is at `:60`. Tables used: `listings`, `listing_reports`, `support_tickets`. The type
  is `AdminDashboardData` (`types.ts:104`).
- **Activity (849):** `src/modules/analytics/activity/read.ts` provides:
  - `getPlatformActivitySeries(period) → BlockResult<ActivityPoint[]>`;
  - `getActivityFreshness(now) → BlockResult<ActivityFreshness>`.
  - `ActivityPoint` (`types.ts:27`) is `{ date, recordedViews, whatsappClicks, listingInquirySubmissions }`, and
    `ActivityFreshness` is `{ lastSuccessAt, stale }`.
  - The aggregate is live and backfilled (O78-3, sprint file).
- **Period helpers:** `src/lib/dashboard/period.ts` provides `tiraneDateOf` (`:110`), `resolvePeriod` (`:150`),
  `periodUtcBounds` (`:164`), `listDates` (`:172`), `parsePeriodParams` (`:206`), `serializePeriod` (`:223`) and
  `tiraneAbsoluteLabel` (`:247`). 854's `page.tsx` + `AgentStatisticsView.tsx` is the working precedent for reading
  and writing the period.
- **Schema:**
  - `users.created_at` (`src/types/database.ts:186`).
  - `listings.location_id`.
  - `locations` has `id, name_al, name_en, type ('region'|'city'|'village'|'district'), parent_id`. City rows are
    inserted with `type: 'city', parent_id: region_id` (`src/modules/admin/actions/index.ts:644`).
  - Location display name follows `PopularLocations.tsx:36`: `locale === 'sq' ? name_al : (name_en ?? name_al)`.
- **Visibility:** `applyPublicVisibility` is at `src/modules/listings/lib/visibility.ts` (ADM-08 already uses it,
  `queries.ts:234`).
- **Census (FACT, reviewer run 2026-09-27):** `AdminDashboardView.tsx` → 16 nodes, all tier 1
  manifest:yes story:yes, 0 `className`, 0 `ui` imports.
- **Patterns from 889** (must be approved first): `MantineDashboardSparkline`, the StatCard `chart`/`variant`, and
  the BarChart `stacked`/`horizontal`.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D78-9, §2.1 | `src/app/admin/page.tsx` accepts `searchParams`, captures `now = new Date()` once, and computes `parsePeriodParams` → `resolvePeriod`. It fetches in one `Promise.all`: `getAdminLocale()`, `getAdminDashboardData()`, `getPlatformActivitySeries(period)`, `getActivityFreshness(now)`, `getAdminTrends(period, now)` (R2) and `getVisibleListingsByCity(locale)` (R3). It passes only serializable props (791 lesson): `data`, `activity`, `freshness`, `trends`, `cities`, `locale`, `now` (ISO), `period` (selection) and `periodDays`. | P0 | AC1 | Confirmed |
| **R2** | D78-9 Q3/Q5 | New `src/modules/admin/dashboard/trends.ts` → `getAdminTrends(period, now)`, returning `{ newListings, newUsers }` (each a `BlockResult<{ date, count }[]>` over `listDates(period)`) and `sparklines: { listings, reports, tickets }` (each a `BlockResult<{ date, count }[]>` over the last 7 completed Tirane days, `resolvePeriod({ kind: '7d' }, now)`). Each series selects only `created_at` within `periodUtcBounds`, buckets by `tiraneDateOf`, and fills missing days with 0 only after a successful read. It uses `.limit(TREND_ROW_LIMIT)` (a named constant, 10 000); **a result that reaches the limit is a block error, never a truncated count**. Admin client, as in `queries.ts`. Unit tests cover bucketing across the Tirane midnight, zero-fill, the limit → error branch, and a failed read → error. **Amended at review 1 (§16.1):** the reads are paged with `.range()` in 1 000-row pages up to `TREND_ROW_LIMIT`, because PostgREST caps one response at its `max-rows`; reaching the limit is still a block error. | P0 | AC2 | Confirmed |
| **R3** | D78-9 Q3 | `getVisibleListingsByCity(locale)` in the same module selects the `location_id` of **publicly visible** listings (`applyPublicVisibility`), then `locations` (`id, type, parent_id, name_al, name_en`). It resolves each listing's location up `parent_id` to the first `type === 'city'` ancestor (itself included). Listings with no location, or with no city in the chain, go to "Other". It returns the top 5 cities by count (ties by name) plus an `other` bucket, labelled per the `PopularLocations.tsx:36` rule. Unit tests: district → city, village → city, region-only → Other, `null` → Other, cycle-safe (a guard of at most 10 hops). | P0 | AC3 | Confirmed |
| **R4** | §2.1 row 1 | ADM-08 moves to row 1 as `variant="accent"`, keeping its tooltip line. The view renders that line's `Text` and the info `ActionIcon` in white (`c="white"`; `ActionIcon variant="transparent" c="white"`). ADM-01/02/06 get `chart={<MantineDashboardSparkline …/>}` with `color="brand.4"`, `dateLabel` = a Tirane short date, and `valueLabel` = `formatCount`. Their aria-labels are "New listings per day, last 7 days", "New reports per day, last 7 days" and "New support tickets per day, last 7 days". A sparkline `BlockResult` error renders no chart; the card's own value is unaffected. | P0 | AC4 | Confirmed |
| **R5** | §2.1 row 2, 855 R1/R7 | The ADM-10 card: `MantineDashboardLineChart mode="multi"`, series `recordedViews`, `whatsappClicks` and `formInquiries` (colours `theme.other.chartSeries.*`; data key `formInquiries` ← `listingInquirySubmissions`), `dateLabel` = a Tirane short date, empty/error/loading states. The totals strip is `MantineDashboardStatRows` with three rows (views / WhatsApp / form) and no `href`. Series descriptions follow spec §3.1 (855 §3.1, restated in R11). | P0 | AC5 | Confirmed |
| **R6** | §2.1 row 3 | The new listings / new users card: `MantineDashboardBarChart stacked={false}`, two series (`brand.4` new listings, `gray.4` new users), and categories = the period dates via the Tirane short-date label. The city card: `MantineDashboardBarChart horizontal`, one series "Visible listings" (`brand.4`), with the categories as the city names plus "Other". Each card shows its own error/empty state. | P0 | AC6 | Confirmed |
| **R7** | §2.1 rows 2, 4 | ADM-09 moves into row 2's side `Stack` under the donut. The ADM-01 work list moves into row 4 in first position. `supply_section_title` is deleted from all four locale files and from the view (deletion audit: `git grep --untracked -n supply_section_title` prints nothing). | P1 | AC7 | Confirmed |
| **R8** | 855 R8 | When `freshness.ok && freshness.data.stale`, the header's `updatedAtLabel` reads the last refresh time, and the ADM-10 card renders its data plus a stale caption ("Data updated at {Tirane time}"). When `freshness` fails, ADM-10 shows its error state, never zeros. | P0 | AC8 | Confirmed |
| **R9** | URL | Period changes call `router.replace` with `serializePeriod` and `scroll: false`, as in 854. Only `period`, `from` and `to` are read; anything else is ignored. An invalid period falls back to 30d (846). | P0 | AC1 | Confirmed |
| **R10** | 16c, GR-3 | `Patterns/Mantine/AdminDashboardView` keeps every existing export. `Default` gains the trend, city and activity fixtures, and new exports are added: `ActivityStale`, `ActivityError`, `ActivityEmptyPeriod`, `TrendsError` and `CitiesOnlyOther`. Fixtures extend the existing fixture module and use no wall-clock values (check 16). | P0 | AC9 | Confirmed |
| **R11** | i18n, spec §3 | New keys in `admin.dashboard` in all four locales: card titles, series labels, aria-labels, the stale caption, "Other", and the series descriptions. Views: *"a recorded view after de-duplication, not a unique visitor"*. WhatsApp: *"a recorded attempt to follow the button; it does not confirm a message or reply"*. Form: *"a stored inquiry; it does not confirm email delivery or reading"*. No label uses "lead", "conversion" or "contact". | P0 | AC10 | Confirmed |
| **R12** | hardcode | No `className`, Tailwind, `@/components/ui/*`, `style=` or raw px/rem/hex in `page.tsx`, `AdminDashboardView.tsx` or `trends.ts`. | P0 | AC11 | Confirmed |

## 5. Assumptions and open questions

- **INFERENCE:** the city resolution (R3) assumes a listing's `location_id` points to a city or to one of its
  descendants. That follows from how cities are inserted (`parent_id` = region). Anything that does not resolve goes
  to "Other", so a wrong assumption can move counts into "Other" but can never drop them.
- **INFERENCE:** "new users" counts every `users` row by `created_at`, soft-deleted ones included, because they did
  register that day.
- The ADM-10 WhatsApp tooltip's "guest clicks recorded from …" sentence (855 R7) is **dropped**. 850's guest arm is
  unreachable by product policy (sprint file, owner decision A 2026-09-21), so the sentence would describe clicks
  that never happen.
- No owner decision is open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (1–7, 9–16d) · `docs/qa-profiles.md` · `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` §6, §6u · `docs/component-rules.md` · `docs/data-access-rules.md` · `docs/rls-rules.md` ·
`docs/state-authority.md` · `docs/storybook-governance.md` · `docs/i18n-rules.md` · `docs/qa-rules.md` ·
`docs/orchestrator-procedures.md` → "Corollary (791)" · `.claude/skills/execute-task/SKILL.md` · kickoffs 845, 846, 849,
853 (archive) and 889.

## 7. Scope

- **Created:** `src/modules/admin/dashboard/trends.ts` · `src/modules/admin/dashboard/__tests__/trends.test.ts`.
- **Edited:**
  - `src/app/admin/page.tsx` · `AdminDashboardView.tsx`;
  - `src/modules/admin/dashboard/types.ts` (only if the view's prop types live there);
  - `src/stories/patterns/mantine/AdminDashboardView.stories.tsx` + its existing fixture module;
  - `messages/{sq,en,uk,it}.json`;
  - `docs/backlog.md` (890 line).

## 8. Out of scope

`getAdminDashboardData()`'s existing blocks (unchanged) · `AdminDashboardRecentListings` (unchanged) · the admin
shell · the agent dashboard (891) · queue-size history (D78-9 Q5 chose new-per-day).

## 9. Current and required behavior

**Before.**
- Row 1: three queue KPIs.
- Row 2: the ADM-01 list and the status donut.
- Row 3: the ADM-02/06/location lists.
- Row 4: a "State of supply" heading with ADM-08 and ADM-09.
- Row 5: recent listings.
- Only one chart (the donut). The owner rejected this.

**After.** §2.1.

**Preserve:**
- every existing link target (`hrefs.ts`), each block's error and Retry, the zero texts, and the donut;
- the recent-listings modal;
- admin and moderator access;
- admin-locale numbers.

## 10. Implementation requirements

1. **I0.**
   - Platform line.
   - `git status --porcelain` → `evidence/task890/i0-status.txt`.
   - Hashes of the edited files.
   - Confirm 889 is approved (sprint Tasks table).
   - Re-run the census of `AdminDashboardView.tsx`.
2. R2/R3 with their unit tests first, then R1/R9, then R4–R8, then R10/R11.
3. `node.exe scripts\check-surface-census.mjs --surface src\modules\admin\dashboard\components\AdminDashboardView.tsx`
   stays all tier 1.
4. **Live proof** (dev server, signed in as staff):
   - `/admin` at 1440 shows all five rows;
   - `?period=7d` changes rows 2 and 3 but not row 1;
   - the full server log has no `Functions cannot be passed` or `Attempted to call` line (791).
5. **Performance:** record `/admin` First Load JS before and after from `npm run build`.

## 11. Positive and negative flows

**Positive.** A moderator opens `/admin`:
- the coral hero shows the visible listings;
- the three queue cards each show a count and seven mini-bars;
- the area chart shows 30 days of views, WhatsApp and forms, with three totals under it;
- the bars show new listings next to new users per day;
- the city card shows five cities plus "Other".

They switch to 7d, and the URL and rows 2 and 3 change.

| Negative flow | Applicable | Expected |
|---|---|---|
| Aggregate stale | Yes | Data + stale caption; never zeros (R8). |
| Freshness or series read fails | Yes | ADM-10 error + Retry; other blocks fine. |
| A trend read fails / hits the row limit | Yes | That card (or that sparkline) errors; no truncated count. |
| Whole period empty | Yes | Chart empty state; bars at 0 on an existing axis. |
| No resolvable city | Yes | Everything in "Other". |
| Invalid `period` | Yes | 30d. |
| Custom range > 90 days | Yes | The control shows the error; no navigation. |
| ≤ 767px | Yes | One column; charts full width; no horizontal page scroll at 320. |
| Long `uk` labels | Yes | Wrap; the horizontal-bar labels truncate with the full text in the tooltip. |
| Non-staff user | No | Unchanged: the admin gate is 852/853's, not this task's. |

## 12. Acceptance criteria

- **AC1 [R1, R9]** — Given `page.tsx`, when read, then it has no `'use client'` and no function-valued prop; live
  `/admin?period=7d` returns 200, and the ADM-10 chart has 7 points; `/admin?period=bogus` renders 30.
- **AC2 [R2]** — Given `npm.cmd run test -- src/modules/admin/dashboard/__tests__/trends.test.ts`, when run, then the
  Tirane-midnight, zero-fill, limit → error and failed-read cases pass.
- **AC3 [R3]** — Given the same test file, when run, then the district, village, region-only, null and cycle cases
  pass, and the "Other" count equals the total minus the top-5 sum.
- **AC4 [R4]** — Given `AdminDashboardView` → `Default` at 1440, when inspected, then row 1's first card computes
  `background-image: linear-gradient(rgb(236, 84, 71) 0%, rgb(142, 50, 43) 100%)` (amended at review 1: 889 revision 2
  replaced the flat `brand.8` with this gradient), and cards 2–4 each contain one sparkline with 7 bars and the
  aria-labels of R4.
- **AC5 [R5]** — Given `Default`, when inspected, then row 2 main has one area chart with 3 series and a 3-row totals
  strip. The strip has no `<a>` and no element whose text is the sum of the three totals.
- **AC6 [R6]** — Given `Default`:
  - row 3 main renders two series side by side (not stacked, as in 889 AC5);
  - row 3 side renders 6 horizontal bars (5 cities + Other), and `CitiesOnlyOther` renders 1.
- **AC7 [R7]** — Given the DOM order at 1440, when read, then the rows are §2.1's. The deletion `git grep` prints
  nothing.
- **AC8 [R8]** — Given `ActivityStale` and `ActivityError`, when rendered, then the first shows the chart plus the stale
  caption, and the second shows the chart's error with Retry. Neither shows 0 totals.
- **AC9 [R10]** — Given `check:story-coverage`, `check:stories` and the census, when run, then all exit 0. Every
  pre-existing export still renders.
- **AC10 [R11]** — Given the new `admin.dashboard` keys in `messages/en.json` (quote the block), when read, then no
  label uses "lead", "conversion" or "contact", and `check:i18n` exits 0.
- **AC11 [R12]** — Given
  `git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/app/admin/page.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx src/modules/admin/dashboard/trends.ts`,
  when run, then it prints nothing.

`GR-4 AC AUDIT — 11 criteria; each states an observable property; absolutes: AC5's absent link/sum in one strip, AC7's and AC11's empty greps on named files.`

### Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Page title | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` `fz={{ base: 'h5', sm: 'h4' }}` | unchanged, 846 / 853 GR-3c |
| Card titles (all) | section heading | 20px | 20px | 20px | 20px | `MantineDashboardCard` `size="h5"` | unchanged, 843 |
| KPI values (hero and queues) | KPI value | 20px | 24px | 30px | 30px | `h5` / `h4` / `h3` / `h3` | 889 table |
| Totals strip rows | label/value | 14px | 14px | 14px | 14px | `MantineDashboardStatRows` | unchanged, 843 |
| Chart axis and legend text | axis | library default | — | — | — | 845 / 889 | unchanged |

The removed `supply_section_title` (`Title size="h5"`) takes one 20px heading off the page. No text of 24px or more
lacks a step.

### Width contract (GR-3b)

~~The Story uses `layout: 'fullscreen'` with no decorators, as today. The view is its own page container, so the Story
reproduces production with no wrapper.~~ **Superseded at review 1 (§16.2, F1).** This was an orchestrator defect: in
production `/admin` renders inside `AdminShell` (`src/app/admin/layout.tsx:7`), whose `MantineAppShellFoundation`
has `navbarBreakpoint="lg"` (`src/components/admin/AdminShell.tsx:23`) and a fixed 240px navbar from 1024px. A bare
Story therefore gives the view 240px more than production at every width from 1024px.

## 13. QA profile and verification plan

**Q3.**

### 13.1 Re-entry

`from-scratch`, after 889 is approved. Evidence root `docs/sessions/evidence/task890/`.

### 13.2 Final gate block

Tee each command to `evidence/task890/<name>.txt` with its exit code.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/modules/admin/dashboard/__tests__
npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts
npm.cmd run check:listing-visibility
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\modules\admin\dashboard\components\AdminDashboardView.tsx
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/app/admin/page.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx src/modules/admin/dashboard/trends.ts
git --no-optional-locks grep --untracked -n supply_section_title -- src messages
git --no-optional-locks hash-object src/app/admin/page.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx src/modules/admin/dashboard/trends.ts src/modules/admin/dashboard/__tests__/trends.test.ts src/stories/patterns/mantine/AdminDashboardView.stories.tsx messages/en.json messages/sq.json messages/uk.json messages/it.json
```

Expected results:
- Every command exits 0, except:
  - `check:listing-visibility`, which exits 1 only on `contactEvents.ts:50` (Task 887) unless 887 has landed. Quote it
    and confirm that no 890 file is named.
  - The two `git grep` commands, which print nothing.
- `check:locale-leak:mantine-only` is known red (Task 836). Quote zero findings for
  `patterns-mantine-admindashboardview`.

### 13.3 GR-3b / GR-3c receipts

For every changed export at 320/390/768/1024/1440, measure over the whole document:
- component widths;
- every scroll container's `scrollWidth` against its `clientWidth`;
- computed font sizes.

Portal content counts.

### 13.4 Owner visual review — `OWNER VISUAL QA REQUIRED`

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `/admin` (live, staff) | real data, 30d | 1440 | en | hero + 3 queue KPIs with mini-bars; area chart + totals; bars; cities; lists; recent listings; reads like the references |
| 2 | `/admin` | real data | 1280 / 1024 | sq | same layout; 8+4 splits |
| 3 | `/admin` | real data | 768 | uk | 2-up KPIs; splits stacked |
| 4 | `/admin` | real data | 390 / 320 | uk | one column; charts full width; no horizontal scroll |
| 5 | `/admin?period=7d` | 7 days | 1440 | it | rows 2–3 change, row 1 does not |
| 6 | `Patterns/Mantine/AdminDashboardView` | ActivityStale / ActivityError / ActivityEmptyPeriod / TrendsError / CitiesOnlyOther | 1440 / 390 | en | honest states, never 0 on error |

## 14. Completion report contract

Report:
- files with hashes;
- R1–R12 and AC1–AC11 with quotes;
- commands with exit codes;
- the live notes and the server-log path;
- the GR-0, GR-1, GR-3a, GR-3b and GR-3c receipts;
- the First Load JS before and after;
- deviations and limitations.

End with status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval
and no mutating git. Update the 890 line of `docs/backlog.md`, and write the session log with its Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| The owner's references honoured block by block? | §2.1 names the reference block for every row. |
| Every owner chart choice present? | Area (row 2), new listings/users (row 3 main), queue mini-charts (row 1), cities (row 3 side). |
| Honest numbers? | One event per series; grouped not stacked; the queue trend is new-per-day (Q5); no sum anywhere; the row limit fails closed. |
| Canonical first? | Every visual comes from 845/889 patterns; 889 is a hard dependency. |
| 855's admin half kept? | ADM-10, the stale state and the series descriptions are here; the unreachable guest-click sentence is dropped with its reason (§5). |

`GR-0 CANONICAL REUSE PREFLIGHT — request: admin dashboard composition with area/bar/horizontal/sparkline/accent; semantic queries: MantineDashboard* patterns, "chart", "sparkline", AdminDashboardView; inspected candidates: MantineDashboardLineChart, MantineDashboardBarChart, MantineDashboardDonut, MantineDashboardStatCard, MantineDashboardStatRows, MantineDashboardSparkline (889), Patterns/Mantine/AdminDashboardView; decision: COMPOSE; selected canonical owner: the 843–846 + 889 patterns; Mantine/TailAdmin token path: theme.other.chartSeries, brand tuple, dashboardChart roles; new hardcoded visual values: NONE; rationale: every visual contract exists (or is created by 889); this task only composes them.`

`GR-3a STORY PREFLIGHT — AdminDashboardView × 5 new states; canonical candidates: patterns-mantine-admindashboardview; direct-import evidence: src/stories/patterns/mantine/AdminDashboardView.stories.tsx; toolbar coverage: locale=toolbar, viewport=toolbar; decision: EXTEND; target: Patterns/Mantine/AdminDashboardView; rationale: new states of the existing canonical page.`

`GR-1 CENSUS COMPLETE — AdminDashboardView surface: 16 nodes today, tier1 16 migrated+enrolled+story; after this task +2 nodes (MantineDashboardLineChart, MantineDashboardBarChart, both tier1 enrolled+storied since 845) +1 (MantineDashboardSparkline, 889) +1 (MantineDashboardPeriodControl, 846); tier2 0; tier3 0 listed and filed as none.`

`GR-3 STORY PROVEN — AdminDashboardView ← src/stories/patterns/mantine/AdminDashboardView.stories.tsx; every composed pattern ← its own Patterns/Mantine/Dashboard* story (845/846/889).`

## 16. Review 1 — `NEEDS REVISION` (2026-09-30) · Revision 1

Reviewed: the working-tree diff (11 modified and 4 new paths), the session log
`docs/sessions/2026-09-30-task890-admin-dashboard-to-references.md`, and `docs/sessions/evidence/task890/`. The reviewer
also re-ran `eslint` on every changed file (exit 0) and `vitest run …/trends.test.ts` (18/18 pass) on `win32 v22.22.3`.

### 16.1 Deviations accepted (no executor action)

- **`MantineDashboardStatRows` `href` optional + `NoLinks` export + `StoryPageGutter`** (GR-0 EXTEND). This is in scope
  from now on. Existing callers still pass `href`, so their output does not change.
- **Paged reads instead of one `.limit(10000)`**: R2 is amended.
- **AC4's value**: AC4 is amended to the 889 gradient.
- **`getAdminLocale()` before the `Promise.all`**: R3's `getVisibleListingsByCity(locale)` needs the locale, so R1's
  "one `Promise.all`" holds for the five data reads.
- **First Load JS "before"**: 429 kB, from `docs/sessions/evidence/task886/rev7/build.log` (`ƒ /admin 10.5 kB 429 kB`).
  That is the last build of the `/admin` code that is at `HEAD`. Do not re-measure it. Report "after" from the final
  build of this revision.

### 16.2 Findings to fix

| ID | Sev | Finding | Correction |
|---|---|---|---|
| **F1** | P1 | Rows 1 and 4 go 4-up at `lg` (`MantineDashboardGridTopRow`, `cols … lg: Math.min(count, 4)`, keyed on the **viewport**). In production the `AdminShell` navbar takes 240px from 1024px. Computed from the grid's own `px`/`spacing` (24px at `md`+): a 4-up card is ≈166px at 1024, ≈230px at 1280 and ≈270px at 1440. In the Story (no shell), 226px cards already clip the row-4 work-list primary text: `probe890.out.txt`, 1024 `uk`, `p[Підтримка] 75>1`, `p[Дублікат оголошення] 88>24`. This breaks §11 "Long `uk` labels → wrap" and is a regression: before 890, rows 1 and 3 were 3-up. §12's width contract hid it (orchestrator defect, now superseded). | §16.3 steps 2–4. |
| **F2** | P1 | §10.4 live proof and AC1's live half were not run. The reason given ("no staff credentials") is contradicted: `.env.local` sets `HYDRATION_ADMIN_EMAIL` and `HYDRATION_ADMIN_PASSWORD`, and `npm run capture:admin-session` (`scripts/capture-admin-session.mjs`, Task 888) writes `playwright/.auth/admin-storage-state.json`. | §16.3 step 5. |
| **F3** | P2 | The final gate block is incomplete: (a) `lint.txt` is the pre-fix run (exit 1 on this task's own `react/display-name` error) and was not re-run; (b) `check:locale-leak:mantine-only` was not run (§13.2 requires the quote); (c) `check:enrolled-tailwind` exits 1 at `HEAD` on 2 stale remove-only baseline entries (`MantineListingGalleryPattern.tsx` `h-full` 3<5, `w-full` 2<4, from 886). The gate blocks CI, and agent-contract clause 9 makes a known non-zero required gate part of the task. | §16.3 step 6. |
| **F4** | P3 | The session log's GR-1 receipt says "16 nodes (re-run on the final tree: 16)", but `census-final.txt` records **23 nodes**, all tier 1. | Rewrite the receipt from the final census artifact. |
| **F5** | P3 | Blast radius not measured. `AgentStatisticsView` renders both changed patterns (`MantineDashboardStatRows`, and `MantineDashboardGridTopRow` after F1), and its Story is not in the probe. | §16.3 step 4. |

### 16.3 Revision 1 — one route, in this order

Re-entry mode: **remediation**. Keep every artifact in `evidence/task890/`. Write new artifacts to
`evidence/task890/rev1/`. Do not touch `trends.ts`, its tests, or `page.tsx` unless a step below fails because of them.

1. **I0.** Record the platform line, `git status --porcelain` → `rev1/i0-status.txt`, and hashes of every path in the
   Files Changed table.
2. **Extend `MantineDashboardGridTopRow`** (`src/design-system/mantine/patterns/MantineDashboardGrid.tsx`; GR-0
   EXTEND). Add two optional props, whose defaults keep every current consumer's output unchanged:
   - `maxColumns?: 2 | 3 | 4` (default `TOP_ROW_MAX_COLUMNS`, 4) caps the column count at every rung;
   - `wideFrom?: 'lg' | 'xl'` (default `'lg'`) is the rung where the row reaches its maximum. With `'xl'`, the `lg`
     rung stays at `Math.min(count, 2)`.

   Only the `cols` object changes. Add no new spacing, width or style value. Extend
   `src/stories/patterns/mantine/DashboardGrid.stories.tsx` with one export per new prop (GR-3a EXTEND, same title).
3. **`/admin` composition** (`AdminDashboardView.tsx`):
   - row 1 `<MantineDashboardGridTopRow wideFrom="xl">`: 2×2 from 768px to 1279px, 4-up from 1280px;
   - row 4 `<MantineDashboardGridTopRow maxColumns={2}>`: work lists 2-up from 768px. The conditional fourth card
     completes a 2×2; without it, the third card sits alone in the second line.
4. **Story width = production width** (GR-3b, supersedes §12). Every `Patterns/Mantine/AdminDashboardView` export
   renders the view inside the real production parent, `<AdminShell siteName="Lero.al">` from
   `src/components/admin/AdminShell.tsx`, as `src/stories/patterns/mantine/AdminShell.stories.tsx` already does, with
   `nextjs.navigation.pathname: '/admin'`. Use one shared render helper or meta decorator in the Story file.
   - Add no `Box`, width, padding, `style` or viewport pin.
   - The GR-3d exemption (the View carries the page gutter) still applies. Measure the gap from the `AppShell.Main`
     content edge, not the viewport, and report both.
   - Then run the probe at 320/390/768/1024/1280/1440 in `en` and `uk` for every `AdminDashboardView` export,
     including `adm02-error` and `adm09-zero` under their real ids (read them from `storybook-static/index.json`).
   - Run it once more for every `Patterns/Mantine/AgentStatisticsView`, `Patterns/Mantine/DashboardGrid` and
     `Patterns/Mantine/DashboardStatRows` export (F5).

   **Pass condition, per width:**
   - no horizontal page overflow;
   - no work-list primary `p` or KPI label `p` with `scrollWidth > clientWidth + 1`;
   - row 1 card width reported;
   - GR-3b/3c/3d receipts per Story.
5. **Live proof** (F2, §10.4). Signed-in staff, in this order:

   ```powershell
   [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
   npm.cmd run capture:admin-session
   npm.cmd run build
   npm.cmd run start *> docs\sessions\evidence\task890\rev1\start.log
   ```

   Run `start` in the background. Then, with Playwright and `playwright/.auth/admin-storage-state.json`, open these
   URLs and save the listed artifacts under `rev1/live/`:

   | URL | Viewport | Locale cookie | Save |
   |---|---|---|---|
   | `/admin` | 1024, 1280, 1440 | `en` | screenshot + measured card widths (rows 1 and 4) + clipped-text list |
   | `/admin` | 1024 | `uk` | same |
   | `/admin?period=7d` | 1440 | `en` | ADM-10 point count = 7, row-3 bar categories = 7; row-1 sparklines identical to `/admin` |
   | `/admin?period=bogus` | 1440 | `en` | ADM-10 point count = 30 |
   | `/admin` | 390 | `uk` | no horizontal scroll |

   After the run, quote the full `start.log` search for `Functions cannot be passed` and `Attempted to call`
   (expected: none). Also quote every `[AdminTrends]` line (expected: none), so the city card and the trend cards are
   proven to read real data, not an error state.
6. **Gates** (F3). Run the §13.2 block into `rev1/`, and add these commands:

   ```powershell
   npm.cmd run check:enrolled-tailwind:update-baseline
   npm.cmd run check:enrolled-tailwind
   npm.cmd run check:locale-leak:mantine-only
   npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineDashboardStatRows.smoke.test.tsx
   git --no-optional-locks hash-object scripts/enrolled-tailwind-baseline.json src/design-system/mantine/patterns/MantineDashboardGrid.tsx src/stories/patterns/mantine/DashboardGrid.stories.tsx src/design-system/mantine/patterns/MantineDashboardStatRows.tsx src/stories/patterns/mantine/DashboardStatRows.stories.tsx src/stories/fixtures/adminDashboard.fixtures.ts
   ```

   Expected results:
   - `update-baseline` changes only the two stale `MantineListingGalleryPattern.tsx` entries, and only downward.
     Quote `git diff scripts/enrolled-tailwind-baseline.json`.
   - `check:enrolled-tailwind` exits 0.
   - `check:locale-leak:mantine-only` shows zero findings for `patterns-mantine-admindashboardview`,
     `patterns-mantine-dashboardgrid` and `patterns-mantine-dashboardstatrows` (the command itself is known red, Task
     836).
   - `npm run lint` exits 0. Warnings are allowed; quote the error count.
7. **Records.** Correct the GR-1 receipt (F4). Add the rev1 Files Changed rows and First Load JS 429 kB → after. Set
   the 890 backlog line to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`.

### 16.4 Scope added by revision 1

- **Edited:**
  - `src/design-system/mantine/patterns/MantineDashboardGrid.tsx`;
  - `src/stories/patterns/mantine/DashboardGrid.stories.tsx`;
  - `src/design-system/mantine/patterns/MantineDashboardStatRows.tsx` + `src/stories/patterns/mantine/DashboardStatRows.stories.tsx` (accepted, §16.1);
  - `scripts/enrolled-tailwind-baseline.json` (remove-only, via the gate's own command).
- **Measured, not edited:** `Patterns/Mantine/AgentStatisticsView`. If step 4 fails there, stop and report it. Do not
  change `AgentStatisticsView.tsx`.

### 16.5 Acceptance criteria added by revision 1

- **AC12 [F1]** — Given every `AdminDashboardView` export in `AdminShell` and live `/admin` at 1024/1280/1440 (`en`, `uk`),
  when measured, then no work-list primary text and no KPI label has `scrollWidth > clientWidth + 1`. Row 1 is 2-up
  below 1280 and 4-up from 1280, and row 4 is at most 2-up.
- **AC13 [F1, 16c]** — Given `DashboardGrid.stories.tsx`, when rendered, then the new exports show `maxColumns` and
  `wideFrom` at 1024/1280. Every pre-existing export and the `AgentStatisticsView` Stories measure the same card widths
  as before the change (row 1 of each probe compared).
- **AC14 [F2]** — The §16.3 step 5 artifacts exist: `?period=7d` → 7 points, `bogus` → 30, and `start.log` contains
  none of the two 791 strings and no `[AdminTrends]` line.
- **AC15 [F3]** — `lint`, `check:enrolled-tailwind` and the rest of §13.2 exit 0 in `rev1/`, and the baseline diff is
  remove-only.

`GR-4 AC AUDIT — 4 added criteria; each states an observable property; absolutes: AC14's absent log lines (a correct run prints none).`

### 16.6 Owner visual review — unchanged rows, added checks

§13.4 stands, except that rows 1–5 now run after step 5. The owner additionally checks two things:
- row 2 at 1440: the activity card's empty area under the totals strip, next to the donut + ADM-09 column (executor
  note 7). If the owner rejects it, it becomes an owner decision in the next review, not an executor choice;
- row 4 at 1024/1280 with 2-up work lists.

`GR-0 CANONICAL REUSE PREFLIGHT — request: dashboard row column cap / wide rung; semantic queries: "TopRow", "cols", "SimpleGrid", "dashboard grid"; inspected candidates: src/design-system/mantine/patterns/MantineDashboardGrid.tsx (TopRow/Split/Full) + Patterns/Mantine/DashboardGrid; decision: EXTEND; selected canonical owner: MantineDashboardGridTopRow; Mantine/TailAdmin token path: SimpleGrid cols + the grid's existing spacing; new hardcoded visual values: NONE; rationale: the row's column ladder is the pattern's own contract, and the production shell width needs a later wide rung.`

`GR-3a STORY PREFLIGHT — MantineDashboardGridTopRow × maxColumns/wideFrom; canonical candidates: patterns-mantine-dashboardgrid; direct-import evidence: src/stories/patterns/mantine/DashboardGrid.stories.tsx; toolbar coverage: locale=toolbar, viewport=toolbar; decision: EXTEND; target: Patterns/Mantine/DashboardGrid; rationale: new props of the existing canonical pattern.`
