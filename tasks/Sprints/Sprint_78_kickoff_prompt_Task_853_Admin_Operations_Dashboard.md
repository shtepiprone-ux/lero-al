# Task 853 — `/admin` becomes the spec's operations dashboard (P0 blocks), composed only from the Sprint 78 patterns

Sprint 78 · P1 · QA profile **Q3** · Wave C · depends on **843, 844, 845, 846, 847, 852** approved ·
**Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) (D78-1, D78-5). ADM-10 is
added by **855**; ADM-03/04/05/07 are out (D78-1 / no source).

## 1. Mode and task type

`IMPLEMENTATION` — replace a legacy Tailwind page with a Mantine composition. Two changes come with it: migrate its
one remaining legacy child, `AdminDashboardRecentListings` (with its preview dialog → `MantineModal`), and stop
rendering `AdminPageHeader` here. Bundles: **UI / Current Mantine path** + **Admin Table / Admin Control** +
**Storybook / Visual Proof**.

## 2. Objective

`src/app/admin/page.tsx` becomes a thin server component: `getAdminDashboardData()` (847) →
`<AdminDashboardView data={…} locale={…} />`. The view is a new client component. It composes only 843–846 patterns
and holds the spec's P0 blocks in the spec's order (§6.1, §16.2, §17.2). Honest numbers come from 847, per-block error
states have Retry, and every card, list row and donut segment opens its drill-down target (847 `hrefs.ts`). It works
at every Mantine breakpoint in all four locales. No Tailwind, no raw value, no legacy import remains on the page.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- `src/app/admin/page.tsx` (265 ln, 53 `className`):
  - 6 stat cards: active (raw), new listings 7d, users, new users 7d, open tickets, pending reports;
  - recent listings (`AdminDashboardRecentListings`);
  - pending reports panel (5 rows, all linking to `/admin/reports`);
  - a conditional location-requests panel (links `/admin/users/{id}` and `/admin/users?location_request=1`);
  - Tailwind status bars.
  It uses `formatCount(value, 'sq')`, i.e. **Albanian number formatting whatever the admin locale** (`page.tsx:96,131`),
  and `AdminPageHeader` (Tailwind).
- `AdminDashboardRecentListings.tsx` (141 ln, 28 `className`, shadcn `Dialog` + `Button`/`buttonVariants`): rows whose
  title is a ghost `Button` opening a preview dialog (owner, status, price, created); dialog links "View on site"
  (`/{locale}/listings/{slug}`, new tab) and "Admin listings" (`/admin/listings`). Epic K §11 pattern: the primary
  text opens the preview.
- Census of `src/app/admin/page.tsx` (2026-09-18): the page (53), `AdminDashboardRecentListings` (28, ui-imports 5),
  `AdminPageHeader` (4), `RelativeTime` (1 — migrated by 844), `ui/button`, `ui/dialog`. Baseline rows keyed
  `src/app/admin/page.tsx :: …`: the page itself, `AdminDashboardRecentListings`, `AdminPageHeader`, `RelativeTime`,
  `ui/button`, `ui/dialog`.
- **Route files keep their own root census row**: every `src/app/**/page.tsx` in the baseline has a row keyed on itself
  (e.g. `src/app/[locale]/favorites/page.tsx :: src/app/[locale]/favorites/page.tsx`), because a route file has no
  Story. That row stays; its `className` count must reach 0.
- `admin.dashboard.*` keys (`messages/en.json`): `title "Dashboard"`, `subtitle "Platform overview"`, `stat_*`,
  `status_breakdown_title`, `pending_reports_*`, `location_requests_*`, `recent_listings_*`, `dialog_*`. The only
  consumers are `page.tsx` and `AdminDashboardRecentListings.tsx`.
- `MantineModal` (enrolled, `Mantine/Primitives/Modal`): centered ≥ 640px, bottom sheet < 640px; props `title`,
  `children`, `footer`, `size`.
- **Server → client boundary lesson (Task 791, `orchestrator-procedures.md`):** a function (e.g. `onRetry`) passed from
  a Server Component into a `'use client'` component throws *"Functions cannot be passed directly to Client
  Components"* at request time. The build does not catch it. Hence R2: the view is the client boundary, receives only
  serializable data, and owns its callbacks (`router.refresh()`).

### 3.1 Spec composition for this task (v3.3 §6.1, §16.2, §17.2; D78-1)

| Row | Content (P0) | Notes |
|---|---|---|
| Header | `MantineDashboardHeader`: title "Dashboard"; subtitle — the spec's "Operational state of the platform", which replaces "Platform overview" in all 4 locales; `updatedAtLabel` = `tiraneAbsoluteLabel(refreshedAt, locale)`. No period control (ADM-10 arrives in 855). | §17.2 header |
| 1 — queues | `TopRow`: **ADM-01** (icon document-check, "On moderation", value, caption "current queue"), **ADM-02** (icon flag, "Complaints in progress", value = pending, secondary "in review: N" when > 0), **ADM-06** (icon life-buoy, "Unassigned tickets", caption "open or in progress"; the in-progress-unassigned anomaly shown as a secondary warning line only when > 0). ADM-03 is not rendered → 3 cards, the grid closes. | §16.2 row 1, §17.2 |
| 2 — main + side | `Split`: main = `MantineDashboardCard` "Moderation queue" with the **ADM-01 work list** (5 oldest; row → `/admin/listings/{id}/preview`; footer "Whole queue" → ADM-01 href) — 855 moves this list to row 3 and puts ADM-10 here; side = `MantineDashboardCard` "Listing status" (scope "Now") with **ADM-11** `MantineDashboardDonut` (segments + hrefs from 847, colours from 844's tone map: visible → `VISIBILITY_TONE_COLOR.positive`, active_hidden → `.danger`, statuses → `LISTING_STATUS_COLOR`; sold/rented labelled "marked by owner"). | §16.2 row 2 |
| 3 — work lists | `TopRow`: **ADM-02 work list** (reason label via the existing `listing.report_reason_*` keys, listing title, age, status badge; row + footer → ADM-02 href); **ADM-06 work list** (ticket type label, age, status badge; row + footer → ADM-06 href); **location requests** (preserved: name, city/region, "Review"; rows → `/admin/users/{id}`, footer → `/admin/users?location_request=1`; rendered **only when count > 0**, as today). | §16.2 row 3; agent-contract 3 |
| 4 — "State of supply" | `TopRow` titled by a section heading: **ADM-08** StatCard "Visible now" (value; a `Tooltip` explains the canonical rule "active and not expired"; no progress bar) and **ADM-09** StatCard "Needs a visibility check" (value) + `MantineDashboardStatRows` with "no expiry date" / "expired" (tone warning, hrefs from 847); count 0 → the positive zero state in the same card. | §17.2 ADM-08/09 |
| 5 — context | `Full`: `MantineDashboardCard` "Recent listings" (scope "Now") with the migrated `AdminDashboardRecentListings` (8 rows) + footer link "All listings" → `/admin/listings`. | §6.1 item 6 |

**Removed from the page, with the owner's spec as the authority** (spec v3.3, 17 Sep 2026, §6: *"Це operations
dashboard, а не набір загальних чисел"*; ADM-01: *"Це не «нові оголошення за 7 днів»"*; ADM-08: *"Не плутати з усіма
active"*): the "active listings" (raw), "new listings (7d)", "users", "new users (7d)" and "open tickets" cards and the
status bars. The Users page stays reachable from the sidebar (852). Pending reports are now ADM-02; open tickets are
now ADM-06 (unassigned).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.1 | The page renders exactly the rows and blocks of §3.1, in that order, from 843–846 patterns. Each block renders its `BlockResult`: `ok:false` → that block's error state with Retry, never `0`; `ok:true` with 0 → the specific positive empty text (spec §11: "No complaints in progress", "Queue is empty", …). | P0 | AC1, AC2 | Confirmed |
| **R2** | §3 (791 lesson) | `src/app/admin/page.tsx` has no `className`, no JSX beyond `<AdminDashboardView …/>`, and passes only serializable props (data objects, strings, numbers). `AdminDashboardView.tsx` (`'use client'`, `src/modules/admin/dashboard/components/`) owns every callback; Retry = `router.refresh()`. | P0 | AC3, AC7 | Confirmed |
| **R3** | locale | Numbers use `formatCount(n, locale)` with the **admin locale** (`getAdminLocale()`), not the hard-coded `'sq'` of today; dates via 846/844 helpers. | P1 | AC4 | Confirmed |
| **R4** | 16d | `AdminDashboardRecentListings` is rebuilt with Mantine: rows (`Stack` + dividers), the title as `UnstyledButton` opening the preview (Epic K §11 preserved), premium star (lucide, `iconSize.compact`, theme colour), price hidden below `sm` (as today), status `Badge` coloured from `LISTING_STATUS_COLOR`, `RelativeTime` with `absoluteLabel`. The preview is a `MantineModal` with the same four fields and two link buttons (same targets, "View on site" in a new tab), stacked full width below `sm`. No `@/components/ui/*`, no `className`, no `cn`. Own Story `Patterns/Mantine/AdminDashboardRecentListings` (list; modal open; empty). Enrolled. | P0 | AC5, AC6 | Confirmed |
| **R5** | 16d | `AdminPageHeader` is no longer imported by `page.tsx` (it stays for other admin pages, untouched). | P1 | AC5 | Confirmed |
| **R6** | i18n | New `admin.dashboard.*` keys for every new label, caption, empty text, tooltip and section title exist in sq/en/uk/it; `subtitle` is updated in all four locales. Keys no longer used anywhere (`git grep` proves zero consumers) are removed from all four files; keys with any other consumer are kept. `check:i18n` exits 0. | P1 | AC4 | Confirmed |
| **R7** | 16c, GR-3 | `AdminDashboardView` has its own Story `Patterns/Mantine/AdminDashboardView` with fixture data covering: all-ok; ADM-02 error; all queues zero; ADM-09 zero; no location requests. Fixtures are declared as fixtures and built with 847's types. Enrolled. | P1 | AC6 | Confirmed |
| **R8** | baselines | The writer (`check-surface-census-changed.mjs --base HEAD --update-baseline`) removes the `src/app/admin/page.tsx :: …` rows for `AdminDashboardRecentListings`, `AdminPageHeader`, `ui/button`, `ui/dialog` (and `RelativeTime` if 844 did not already). The page's own root row stays. Any other change → `BLOCKED`. | P1 | AC7 | Confirmed |
| **R9** | breakpoints, spec §17.1 | At 1440: 3 top cards in one row, 8+4 split, 24px gaps, content ≤ 1440. At 1024: 3 top cards, split kept. At 768: 2-up cards, split stacked. At ≤ 767: 1 column, no horizontal page scroll, every list row full width, modal becomes a bottom sheet. | P0 | AC8 | Confirmed |

## 5. Assumptions and open questions

- Drill-down landings for reports, support and `visibility=visible` are reserved **857–859**; until then those links
  land unfiltered (stated in the sprint file). This is expected, not a defect of 853.
- The spec's first-screen "four operational cards" (§16.5) becomes three, because ADM-03 is out by D78-1; the grid
  closes (§16.3).
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (3, 5, 6, 7, 9, 11, 12, 13, 14, 16–16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6, §6u · `docs/component-rules.md`
· `docs/admin-ux-rules.md` · `docs/ai-behavior.md` Note 22 · `docs/storybook-governance.md` · `docs/i18n-rules.md` ·
`docs/qa-rules.md` · `docs/orchestrator-procedures.md` → "Corollary (791)" · `.claude/skills/execute-task/SKILL.md` ·
kickoffs 843–847, 852.

## 7. Scope

- **Created:** `src/modules/admin/dashboard/components/AdminDashboardView.tsx` ·
  `src/stories/patterns/mantine/AdminDashboardView.stories.tsx` ·
  `src/stories/patterns/mantine/AdminDashboardRecentListings.stories.tsx` · a fixtures module under
  `src/stories/fixtures/` for both.
- **Edited:** `src/app/admin/page.tsx` · `src/components/admin/AdminDashboardRecentListings.tsx` ·
  `scripts/mantine-migration-scope.json` (2) · `scripts/surface-census-baseline.json` (writer only) ·
  `messages/{sq,en,uk,it}.json` · `docs/backlog.md` (853 line).

## 8. Out of scope

ADM-10 (855) · ADM-03/04/05/07 · the admin shell (852) · target pages (857–859) · `AdminPageHeader.tsx` itself ·
`src/components/ui/*`.

## 9. Current and required behavior

**Before.** Six general stat cards (one of them counts expired listings as active; a failed query shows 0), a recent
listings table with a shadcn dialog, a pending reports panel, conditional location requests, and Tailwind status bars.
**After.** §3.1: queue cards, the ADM-01 work list, the status donut, the ADM-02 and ADM-06 work lists, location
requests (still conditional), visibility diagnostics, and recent listings with a Mantine preview modal. Each block
has its own error, zero and loading states.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes; census of `page.tsx`; confirm 843–847 and 852 are approved (read the sprint Tasks table); `git grep` the `admin.dashboard` key consumers.
2. Build `AdminDashboardView` from the patterns (JSDoc maps each block to its spec ID). Icons: lucide at `iconSize.decorative` in StatCards, and `iconSize.compact` in lists.
3. Rebuild `AdminDashboardRecentListings` (R4), then its Story.
4. Replace `page.tsx` (R2/R3). Keep `getAdminLocale()`.
5. Stories (GR-3a, §12), enrolment, i18n (R6), baseline writer (R8).
6. **Live proof** (dev server, staff session; if unavailable, record that and give the tuples to the owner):
   - `/admin` at 1440, 1024, 768, 390 and 320;
   - temporarily force one block's error by making 847's ADM-02 query name a non-existent column, **only in the
     running dev server**; record the rendered error + Retry; revert with a `git hash-object` equal to before;
   - open the preview modal;
   - click one link per block and record the URL.

## 11. Positive and negative flows

**Positive.** An admin opens `/admin` at 1440 and sees: 3 queue cards (12 / 3 with "in review: 2" / 4); the ADM-01
list beside the status donut; the complaint and ticket lists; the visibility diagnostics (900 / 40 with 25 + 15); the
recent listings. Clicking a pending listing opens its staff preview.

| Negative flow | Applicable | Expected |
|---|---|---|
| One block's query fails | Yes | That card: title + message + Retry; the rest render. Retry refreshes the route. |
| All queues empty | Yes | Zero states with the specific texts; lists show their positive empty text. |
| No location requests | Yes | Block not rendered (as today); row 3 closes to 2 cards. |
| ADM-11 inconsistent | Yes | The donut card shows its error state (847 `data_inconsistent`). |
| Long `uk` / `it` labels | Yes | Wrap ≤ 2 lines; no overflow at 320. |
| Keyboard | Yes | One tab stop per card/row; modal traps focus; Esc closes. |
| Moderator without an action permission | Yes (preserved) | The dashboard only links; each target page enforces its own permission (spec §6). |
| Guest / non-staff | No (preserved) | Layout gate unchanged. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `Patterns/Mantine/AdminDashboardView → Default` and the live `/admin`, when rendered at 1440, then
  the blocks appear in §3.1's order. Quote the DOM order of section headings / card labels.
- **AC2 [R1]** — Given the story state "ADM-02 error" and the §10.6 live plant, when rendered, then the ADM-02 card shows
  the error text and a Retry button and no digit, and every other block shows data. The plant revert hash is equal.
- **AC3 [R2]** — Given `src/app/admin/page.tsx`, when read, then it contains no `className`, no function-valued prop and
  no `'use client'`; given the live server log of the §10.6 session, when read in full, then it contains no
  `Functions cannot be passed directly to Client Components` line. Quote the log path and the grep.
- **AC4 [R3, R6]** — Given the live page under the admin locale `en`, when a count ≥ 1000 renders, then it uses the
  English grouping (e.g. `1,240`); under `sq`, the Albanian format. And `check:i18n` exits 0.
- **AC5 [R4, R5]** — Given
  `git --no-optional-locks grep -n -E "className=|components/ui/|buttonVariants|\bcn\(|AdminPageHeader|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/app/admin/page.tsx src/components/admin/AdminDashboardRecentListings.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx`,
  when run, then it prints nothing.
- **AC6 [R4, R7]** — Given `check:story-coverage`, `check:pattern-enrolment` and
  `node.exe scripts\check-surface-census.mjs --surface src\app\admin\page.tsx`, when run, then the gates exit 0. The
  census shows `AdminDashboardView` and `AdminDashboardRecentListings` `manifest:yes story:yes`, no tier-2 node, and
  the page root row with `className:0`.
- **AC7 [R8]** — Given `git --no-optional-locks diff -- scripts/surface-census-baseline.json`, when read, then only the
  named `src/app/admin/page.tsx :: …` rows are removed and none added; `check-surface-census-changed.mjs --base HEAD`
  exits 0.
- **AC8 [R9]** — Given the owner matrix §13.3, when reviewed, then every tuple is accepted or returned with a concrete defect.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: AC5's empty grep on three named files; AC3's "no such log line" is the Task 791 failure signature, read in the full log.`

`GR-3a STORY PREFLIGHT — AdminDashboardView × ok/error/zero/no-requests; canonical candidates: NONE (no story renders the admin dashboard); decision: CREATE; target: Patterns/Mantine/AdminDashboardView. — AdminDashboardRecentListings × list/modal/empty; canonical candidates: NONE (no story imports it; the component has no legacy story either); decision: CREATE; target: Patterns/Mantine/AdminDashboardRecentListings; toolbar coverage for both: locale=toolbar, viewport=toolbar (Task 799 caveat); rationale: in-scope production surface with no canonical proof.`

`GR-1 CENSUS COMPLETE — 6 nodes; tier1 3 migrated+enrolled+story (AdminDashboardView new, AdminDashboardRecentListings, RelativeTime via 844) + the route file's own root row (route files carry no Story; className → 0); tier2 2 imports removed (ui/button, ui/dialog); tier3 0 listed and filed as none (AdminPageHeader leaves this surface; its other admin consumers keep it).`

`GR-3 STORY PROVEN — AdminDashboardView ← src/stories/patterns/mantine/AdminDashboardView.stories.tsx; AdminDashboardRecentListings ← src/stories/patterns/mantine/AdminDashboardRecentListings.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q3`** — page composition + overlay migration. Visibility invariant consumed through 847 (its regression re-run).

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task853/`.

### 13.2 Final gate block

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
node.exe scripts\check-surface-census.mjs --surface src\app\admin\page.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "className=|components/ui/|buttonVariants|\bcn\(|AdminPageHeader|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/app/admin/page.tsx src/components/admin/AdminDashboardRecentListings.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/app/admin/page.tsx src/components/admin/AdminDashboardRecentListings.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx scripts/surface-census-baseline.json
```

Expected: all exit 0 except `check:locale-leak:mantine-only` (known red, Task 836) — zero leak lines for
`patterns-mantine-admindashboard*`; quote the grep. The `git grep` prints nothing.

Owner-native, staff session, dev server on port 3000:

```powershell
$env:BASE_URL = "http://localhost:3000"
npm.cmd run check:hydration -- --with-admin
```

Expected exit 0.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Stories: until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize. Live: signed in as staff.

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `/admin` (live) | real data | 1440 | en | §3.1 order; 3 queue cards; list + donut; TailAdmin look; 24px gaps |
| 2 | `/admin` (live) | real data | 1280 | sq | same; Albanian numbers |
| 3 | `/admin` (live) | real data | 1024 | it | 3 cards across; split kept |
| 4 | `/admin` (live) | real data | 768 | uk | 2-up cards; split stacked |
| 5 | `/admin` (live) | real data | 390 / 320 | uk | 1 column; no horizontal scroll; recent-listing preview as a bottom sheet |
| 6 | `Patterns/Mantine/AdminDashboardView` | ADM-02 error | 1440 | en | error + Retry in that card only |
| 7 | same | all queues zero | 1024 | sq | positive empty texts, no bare zeros without text |
| 8 | `Patterns/Mantine/AdminDashboardRecentListings` | modal open | 1440 / 390 | en / uk | four fields, two buttons; sheet on mobile |

### 13.4 Evidence the executor hands over

§13.2 transcripts · §10.6 live notes (widths, error plant with hashes, URLs per block, server log path) · AC1 DOM order
· writer transcript · owner matrix.

## 14. Completion report contract

Files with hashes · R1–R9 · AC1–AC8 with quotes · commands with exit codes · keys removed/kept with evidence · GR
receipts · assumptions · deviations · limitations · owner matrix. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating git.
Update the 853 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Removal of existing cards authorized? | By the owner's spec v3.3 §6 / ADM-01 / ADM-08 (quoted §3.1); Users stays in navigation. |
| Location requests preserved? | Yes (row 3, conditional as today). |
| 16d | Census receipt; the recent-listings child is migrated, not excluded. |
| 791 lesson | R2 + AC3 read the full server log. |
| Hardcode | AC5 grep; everything from patterns/theme. |
| Commands in blocks | §13.2 (executor + owner-native). |
