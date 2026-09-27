# Task 853 — `/admin` becomes the spec's operations dashboard (P0 blocks), composed only from the Sprint 78 patterns

Sprint 78 · P1 · QA profile **Q3** · Wave C · depends on **843, 844, 845, 846, 847, 852** approved ·
**Status: ✅ APPROVED WITH NOTES (review 4, 2026-09-27) — ARCHIVED.** The owner accepted the §13.3 matrix, rows 1–12
(`O853-2`, §19). The notes are §18.2 N1/N2 (P3).

> **Revised 2026-09-25 (864's finding, applied before execution):** every `git grep` command in this file now
> carries `--untracked`. Without it `git grep` reads only the index, so a "prints nothing" check over files this task
> **creates** passes whatever they contain (measured on 848: 0 hits without the flag, 3 with it). `--untracked` also
> searches tracked files, so no check lost coverage.

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
states have Retry, and every card and list row opens its drill-down target (847 `hrefs.ts`). It works
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
| 2 — main + side | `Split`: main = `MantineDashboardCard` "Moderation queue" with the **ADM-01 work list** (5 oldest; row → `/admin/listings/{id}/preview`; footer "Whole queue" → ADM-01 href) — 855 moves this list to row 3 and puts ADM-10 here; side = `MantineDashboardCard` "Listing status" (scope "Now") with **ADM-11** `MantineDashboardDonut` (segments from 847 — **no per-segment href: owner decision OD-1 = B, 2026-09-20, Task 845 §16.2/§18.1 waives ADM-11's link list; the donut's legend rows toggle visibility and navigate nowhere**; colours from 844's tone map: visible → `VISIBILITY_TONE_COLOR.positive`, active_hidden → `.danger`, statuses → `LISTING_STATUS_COLOR`; sold/rented labelled "marked by owner"). | §16.2 row 2 |
| 3 — work lists | `TopRow`: **ADM-02 work list** (reason label via the existing `listing.report_reason_*` keys, listing title, age, status badge; row + footer → ADM-02 href); **ADM-06 work list** (ticket type label, age, status badge; row + footer → ADM-06 href); **location requests** (preserved: name, city/region, "Review"; rows → `/admin/users/{id}`, footer → `/admin/users?location_request=1`; rendered **only when count > 0**, as today). | §16.2 row 3; agent-contract 3 |
| 4 — "State of supply" | `TopRow` titled by a section heading: **ADM-08** StatCard "Visible now" (value; a `Tooltip` explains the canonical rule "active and not expired"; no progress bar) and **ADM-09** StatCard "Needs a visibility check" (value) + `MantineDashboardStatRows` with "no expiry date" / "expired" (tone warning, hrefs from 847); count 0 → the positive zero state in the same card. | §17.2 ADM-08/09 |
| 5 — context | `Full`: `MantineDashboardCard` "Recent listings" (scope "Now") with the migrated `AdminDashboardRecentListings` (8 rows) + footer link "All listings" → `/admin/listings`. | §6.1 item 6 |

**Removed from the page, with the owner's spec as the authority** (spec v3.3, 17 Sep 2026, §6: *"Це operations
dashboard, а не набір загальних чисел"*; ADM-01: *"Це не «нові оголошення за 7 днів»"*; ADM-08: *"Не плутати з усіма
active"*): the "active listings" (raw), "new listings (7d)", "users", "new users (7d)" and "open tickets" cards and the
status bars. The Users page stays reachable from the sidebar (852). Pending reports are now ADM-02; open tickets are
now ADM-06 (unassigned).

### 3.2 Owner visual reference — table chrome (screenshot provided 2026-09-18, mid-844)

The owner attached a screenshot of `techzaa.in/lahomes/admin/dashboard-agent.html` (the same reference already named
in the sprint plan's opening section — this screenshot is that page's "Latest Transaction" table, not a new source)
while looking at the current legacy `/admin` page and naming two blocks by their **current legacy labels** —
"Останні оголошення" (Recent listings, row 5 above) and "Скарги на розгляді" (Pending reports / complaints, now the
ADM-02 work list in row 3 above). Owner instruction, verbatim: *"я хочу, щоб вона виглядала наближено до референсу,
але ти маєш використовувати Mantine токени та стилі"* (make it look close to the reference, using Mantine tokens and
styles). Explicitly deferred to this task rather than done ad hoc on the legacy page — owner's own words: *"почекати
Task 853, але треба туди внести посилання на референси, щоб вони не втратились чи загубились"* (wait for 853, but
record the reference here so it isn't lost).

**What the screenshot shows** (described here since the binary was pasted inline in chat, not saved to a path):
a "Latest Transaction" table on a white card, header row "Latest Transaction" (left) + a "This Month" period-filter
dropdown (right, pill-shaped trigger). Columns: checkbox · Purchase ID · Buyer Name (a circular avatar photo +
name, two-part cell) · Invoice · Purchase Date · Total Amount · Payment Method · Payment Status · Action. Payment
Status is a **pill badge** with a soft tinted background and matching text colour, no border, no icon — green
"Completed", red "Cancel", amber/orange "Pending" (three distinct rows demonstrate all three). Action is three
icon-only buttons (eye / pencil / trash) inside light-grey rounded squares, tightly grouped. Rows are separated by a
hairline divider only (no zebra striping, no per-row border box), generous vertical padding, and the whole table sits
inside one flat white card with a soft rounded corner and a barely-visible border — no drop shadow.

**Binding consequence for this task, once picked up:** `AdminDashboardRecentListings`'s migrated Mantine rows (row 5
above) should read the buyer/owner-name + status the same way — an `Avatar` (existing canonical primitive,
`Mantine/Primitives/Avatar`) paired with the name, and the listing status as a pill `Badge` (theme default
`radius:'pill'`, `variant:'light'`) coloured from `LISTING_STATUS_COLOR` (844) — never a raw hex or a new badge
shape. The ADM-02 `MantineDashboardWorkList` row (row 3 above) already renders a `Badge` for its status per 844's
own pattern; this reference confirms the pill/soft-tint look is the right visual target, not a new decision — no new
token should be needed beyond what 843/844 already established. Re-verify this reading against the actual
screenshot at execution time if it is still available in chat history or re-attached; do not invent detail this
description omits (e.g. exact colour hex — reuse the theme's own green/red/yellow, never the screenshot's pixels).

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
- **Added by review 1 (§16):** `src/design-system/mantine/patterns/MantineDashboardHeader.tsx` (title `fz` only) ·
  `src/design-system/mantine/patterns/MantineDashboardStatCard.tsx` (value `fz` only) — R12. Accepted as already
  done, no further edit: `scripts/check-listing-visibility.mjs` (stale `src/app/admin/page.tsx` row removed —
  agent-contract 9) · `scripts/check-locale-leak.mjs` (`/^(Spam)$/` loanword entry — §16.3).

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
6. **Live proof** (dev server, staff session from O853-1 — §16.5 step 1; without it the status is
   `PARTIALLY IMPLEMENTED — O853-1`):
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
  `git --no-optional-locks grep --untracked -n -E "className=|style=\{|components/ui/|buttonVariants|\bcn\(|AdminPageHeader|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/app/admin/page.tsx src/components/admin/AdminDashboardRecentListings.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx src/stories/patterns/mantine/AdminDashboardRecentListings.stories.tsx src/stories/patterns/mantine/AdminDashboardView.stories.tsx`,
  when run, then it prints nothing. *(Review 1: `style=\{` and the two Story files added.)*
- **AC6 [R4, R7]** — Given `check:story-coverage` and `check:pattern-enrolment`, when run, then both exit 0. Given
  `node.exe scripts\check-surface-census.mjs --surface src\app\admin\page.tsx`, when run, then its node list shows
  `AdminDashboardView` and `AdminDashboardRecentListings` `manifest:yes story:yes className:0`, no tier-2 node, and
  its **only** `FAIL` line is the route root `src/app/admin/page.tsx [tier1-unenrolled-or-unstoried]` with
  `className:0` — the baselined route row §3 keeps (route files carry no Story). That single root FAIL makes the
  command exit 1; any other FAIL line fails this AC. *(Review 1: the original "exit 0" was unsatisfiable — the
  standalone command has no baseline; the baseline-aware gate is AC7's `--base HEAD`, which must exit 0.)*
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
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|buttonVariants|\bcn\(|AdminPageHeader|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/app/admin/page.tsx src/components/admin/AdminDashboardRecentListings.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/app/admin/page.tsx src/components/admin/AdminDashboardRecentListings.tsx src/modules/admin/dashboard/components/AdminDashboardView.tsx scripts/surface-census-baseline.json
```

Expected: all exit 0 except `check:locale-leak:mantine-only` (known red, Task 836) — zero leak lines for
`patterns-mantine-admindashboard*`; quote the grep. The `git grep` prints nothing. **Review 1 amendments to this
block's expectations — they replace the sentence above where they differ:**
- `check:listing-visibility` exits **1** with exactly one finding, `src/modules/listings/actions/contactEvents.ts:50`
  (red on `main` since Task 850; owned by **887**). Record it as `exit 1 — expected, 887`, never as `PASS`. Any other
  finding fails the task.
- `check-surface-census.mjs --surface …` exits **1** only on the route root row (AC6).
- `check:locale-leak:mantine-only` runs as `npm.cmd run check:locale-leak:mantine-only -- --fast` (orchestrator
  decision, review 1: the full run did not complete in this environment for 869 or 853). Emit the GR-2 receipt
  naming the one viewport `--fast` renders and the viewports it does not.
- `npm.cmd run build`, `build-storybook` and the `git hash-object` line run **after the last source edit**, in the
  same pass (Corollary 818).

~~Owner-native `check:hydration -- --with-admin`, expected exit 0.~~ **Withdrawn by review 2 (F10, §17.1):** that
gate never navigates `/admin` and its two admin routes are `404`, so it cannot prove anything for this task. The
`/admin` hydration evidence is §17.3's live console capture instead; the gate's defect is **888**.

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

## 16. Review 1 — `NEEDS REVISION` (2026-09-26)

Reviewed against the uncommitted worktree. Implementation hashes: `page.tsx` `74b26361`,
`AdminDashboardRecentListings.tsx` `f246ab45`, `AdminDashboardView.tsx` `e10ad898`, `surface-census-baseline.json`
`a2f9a915`. Session log: `docs/sessions/2026-09-26-task853-admin-dashboard.md`. Everything not named below is
accepted and must not be redone.

### 16.1 Confirmed defects

| # | Sev | Where | Measured by the reviewer (win32 v22.22.3, local `storybook-static`) | Fixed by |
|---|---|---|---|---|
| F1 | P1 | `AdminDashboardRecentListings.tsx:61-98` | Every row is one `nowrap` horizontal split at every width. At 320 the title renders **17 / 0 / 100 px** wide in a 288 px row (`en`) and **0 / 0 / 51 px** (`uk`). At 390 `uk` it renders **38 / 20 / 121 px** of 358. The title is the control that opens the preview (Epic K §11). The badge and "about 2 hours ago" (136–168 px) take the rest of the row. R9 ("every list row full width") and agent-contract 11 fail. The executor's GR-3b receipt measured only document overflow, so it could not see this. `MantineDashboardWorkList` fixed the same defect on 2026-09-18 (owner correction, `MantineDashboardWorkList.tsx:135-160`). | R10, AC9 |
| F2 | P2 | `AdminDashboardRecentListings.tsx:62`, `:66` | `style={{ minWidth: 0, flex: 1 }}` and `style={{ minWidth: 0 }}` are `style` objects in migrated UI (GR-0). The canonical idiom is the style props `flex={1} miw={0}` (`MantineDashboardWorkList.tsx:165`). AC5's grep had no `style=` term, so it passed. | R11, AC5 |
| F3 | P2 | `MantineDashboardHeader.tsx:56`, `MantineDashboardStatCard.tsx:139` (both rendered by this surface) | GR-3c, measured on `patterns-mantine-admindashboardview--default` (`uk`): the H1 "Dashboard" is **24 px** and every StatCard value is **30 px** at 320 / 390 / 768 / 1440. Both are static. The H1 is a page heading above 20 px below 640; the value is ≥ 24 px text with no responsive step. Task 886 lists the header (S2) but **misses the StatCard value**. Its scanner reads `<Title>` tags and literal keys, and this site is `<Text fz={theme.headings.sizes.h3.fontSize}>`. The only production consumer of either file is `AdminDashboardView`, so both are fixed here (R12); 886 §3.5 records the handover. | R12, AC10 |
| F4 | P2 | `AdminDashboardRecentListings.stories.tsx:53`, `:64`, `:83` | Each Story wraps the component in `Box maw={theme.other.boxSize.dashboardContentMaxWidth} px py`, a max-width container on a theme token (GR-3b). It also skips the real parent: in production the list sits inside `MantineDashboardCard` (`AdminDashboardView.tsx:377-392`), so the Story does not reproduce the production width. | R13, AC11 |
| F5 | P2 | `AdminDashboardRecentListings.tsx:50-103`; the `Empty` Story | R1: when `recentListings.ok` returns 0 rows, the card body is blank, with no empty text. The `Empty` Story renders nothing. | R14, AC12 |
| F6 | P3 | `AdminDashboardView.tsx:169`, `:317`, `:383` | A location-request row reads "Review →" and the pattern also appends a `ChevronRight`, giving a double arrow (measured: `"Flutura LleshiElbasanReview →"`). The other rows use `worklist_cta_review` ("Review"). The footer "View all →" and the header "All listings →" carry text arrows that no other dashboard link has. | R15, AC13 |
| F7 | P2 | session log, "Final gate block" | Three evidence defects. (a) `check:listing-visibility` is recorded as **PASS**, but it exits **1**. The reviewer's re-run printed `❌ 1 issue(s) — gate FAILED` for `contactEvents.ts:50`. The finding is real and pre-existing (Task 850, 2026-09-20) but was untracked; it is now **887**. (b) `.next/BUILD_ID` is stamped 15:32:45, before the last edit to `AdminDashboardRecentListings.tsx` (15:33:45), so the build transcript is stale. (c) `check:locale-leak:mantine-only` ran as `--fast` without a GR-2 scope statement. | §13.2 amendments, §16.5 |

The orchestrator's own defects in this kickoff are corrected in place:
- AC6 demanded exit 0 from a command that has no baseline; it is reworded.
- AC5's grep lacked `style=\{` and the Story files; both are added.
- There was no GR-3c type-scale table; it is now §16.4.

### 16.2 New requirements and acceptance criteria

| ID | Requirement | P |
|---|---|---|
| **R10** | Below `sm`, each recent-listing row stacks. The whole row stays **one** `UnstyledButton`: one tab stop that opens the preview. Line 1 is the `Avatar` plus a column holding the title (`lineClamp={2}`, full column width, premium star beside it) and the owner name. Line 2 is the status `Badge` plus `RelativeTime` (`wrap="wrap"`). The price stays hidden below `sm`. From `sm` up, the current horizontal layout is unchanged. Use the `hiddenFrom="sm"` / `visibleFrom="sm"` split exactly as `MantineDashboardWorkList.tsx:135-160` does, and cite those lines in a comment. | P1 |
| **R11** | `AdminDashboardRecentListings.tsx` has no `style` prop. `style={{ minWidth: 0, flex: 1 }}` becomes `flex={1} miw={0}`; `style={{ minWidth: 0 }}` becomes `miw={0}`. | P2 |
| **R12** | Two one-prop edits, nothing else in either file. In `MantineDashboardHeader.tsx:56`, the title becomes `<Title order={1} size="h4" fz={{ base: 'h5', sm: 'h4' }}>`. In `MantineDashboardStatCard.tsx:139`, `fz={theme.headings.sizes.h3.fontSize}` becomes `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}` (886 §4.1 row `h3`), with `lh` unchanged. The skeleton height at `:92` stays. §16.4 explains why the header does not take 886's `h4` row. | P2 |
| **R13** | All three `AdminDashboardRecentListings` Stories render the component inside its real production parents: `MantineDashboardGrid` > `MantineDashboardGridFull` > `MantineDashboardCard`. The card's `title` is `storyT(locale, 'admin.dashboard.recent_listings_title')` and its `state` is `"ready"`. Cite `AdminDashboardView.tsx:377-392` in a comment. No `Box`, no `w` / `maw` / `miw` / `px` / `py`, no `style`, no `theme` import. | P2 |
| **R14** | `AdminDashboardRecentListings` takes a required `emptyText: string`. With 0 rows it renders `<MantineEmptyLoadingErrorState state="empty" description={emptyText} />` and no row button. `AdminDashboardView` passes `t('recent_listings_empty')`. The new key `admin.dashboard.recent_listings_empty` has, in each locale, the same value as that locale's `admin.dashboard.adm11_empty`: sq "Ende nuk ka njoftime", en "No listings yet", uk "Оголошень ще немає", it "Ancora nessun annuncio". | P2 |
| **R15** | Location-request rows use `ctaLabel: t('worklist_cta_review')`. `admin.dashboard.location_requests_review` is removed from all four locales once a `--untracked` grep of `src` for it prints nothing. `location_requests_view_all` and `recent_listings_all` lose their trailing ` →` in all four locales; their only consumers are `AdminDashboardView.tsx:317` and `:383`. | P3 |

- **AC9 [R10]** — Given `patterns-mantine-admindashboardrecentlistings--default` at 320 and 390 in `en` and `uk`, when
  measured, then:
  - every row's title element is as wide as the column that holds it (±1 px);
  - that column is at least the row width minus the avatar and one `sm` gap;
  - `document.documentElement.scrollWidth` equals `clientWidth`.

  At 768 and 1440, the row keeps its horizontal layout with the price visible. Quote the per-row numbers.
- **AC10 [R12]** — Given these Stories at 320 / 390 / 768 / 1440:
  - `patterns-mantine-admindashboardview--default` (`uk`);
  - every `patterns-mantine-dashboardheader--*`;
  - every `patterns-mantine-dashboardstatcard--*`;
  - every `patterns-mantine-dashboardgrid--*`.

  When `getComputedStyle(el).fontSize` is read for every heading and every StatCard value, then each matches §16.4 at
  each width. The 1440 values are unchanged: H1 24 px, value 30 px. Emit one GR-3c receipt per Story, with every
  violation field reading `NONE`.
- **AC11 [R13]** — Given the three recent-listings Stories, when their source is read, then AC5's grep prints nothing
  for the file, and no `Box`, `maw`, `w=`, `px=`, `py=` or `globals` pin appears. At 320 / 390 / 1024 / 1440, the
  list's width equals the width that `MantineDashboardCard`'s body gives it inside the grid, which matches the
  production parent. Emit one GR-3b receipt per Story.
- **AC12 [R14]** — Given the `Empty` Story in `en` and `uk`, when rendered, then the locale's `recent_listings_empty`
  text is visible inside the card and no row button exists.
- **AC13 [R15]** — Given `patterns-mantine-admindashboardview--default` at 1440 `en`, when the text of every `a` and
  `button` is read, then none contains `→`.

`GR-4 AC AUDIT — 5 new criteria (AC9–AC13) plus AC5/AC6 reworded; each states an observable property; absolutes: AC5's empty grep over named files, AC13's "none contains →" over one named Story state.`

### 16.3 Accepted as delivered — do not redo

- **The `/^(Spam)$/` entry in `scripts/check-locale-leak.mjs`.** `listing.report_reason_spam` is "Spam" in `en`, `sq`
  and `it`, and "Спам" in `uk`, which matches the Task 624 loanword precedent. The edit was outside §7. Review 1
  accepts it, and §7 now lists it.
- **The stale-row removal in `scripts/check-listing-visibility.mjs`.** The `src/app/admin/page.tsx` row went because
  agent-contract 9 requires a deletion to update its live consumers.
- **ADM-08/ADM-09 without a top-level `href`.** Adding one would nest links. ADM-08's rule text sits in
  `secondaryLine`.
- **The surface-census baseline write (AC7).** **Do not re-run the writer.** R10–R15 add no rendered component, so
  `check-surface-census-changed.mjs --base HEAD` must still exit 0.

### 16.4 GR-3c type-scale table for this surface

Pixel values come from `theme.ts:581-586`.

| Role | Element | base <640 | sm 640–767 | md 768–1023 | lg ≥1024 | Provenance |
|---|---|---|---|---|---|---|
| Page title | `MantineDashboardHeader` H1 | `h5` 20 | `h4` 24 | `h4` 24 | `h4` 24 | R12 |
| KPI value | `MantineDashboardStatCard` value | `h5` 20 | `h4` 24 | `h3` 30 | `h3` 30 | R12; 886 §4.1 row `h3` |
| Card title | `MantineDashboardCard` H2 | 20 | 20 | 20 | 20 | static `h5`, ≤ 20 — complies |
| Section title | "State of supply" `Title order={2} size="h5"` | 20 | 20 | 20 | 20 | static `h5`, ≤ 20 — complies |
| Body / meta | `Text size="sm"` / `"xs"` | 14 / 12 | 14 / 12 | 14 / 12 | 14 / 12 | theme |

**Why the page title does not take 886's `h4` row (18 / 20 / 24 / 24).** Card titles on this page are a static 20 px.
An 18 px page title below 640 would make every card title larger than the page title, which GR-3c forbids. At 20 px it
equals the card titles, stays at GR-3c's 20 px ceiling for a heading below 640, and keeps 24 px from `sm` up.

### 16.5 Re-entry — `remediation`

1. **Precondition, owner action O853-1: a live staff session.** The owner starts the dev server and runs
   `npm.cmd run capture:admin-session`, with the credentials `HYDRATION_ADMIN_EMAIL` and `HYDRATION_ADMIN_PASSWORD`
   in `.env.local`. That refreshes `playwright/.auth/admin-storage-state.json`. Without a working session, finish
   R10–R15 and return `PARTIALLY IMPLEMENTED — O853-1`, never `IMPLEMENTED`.
2. **I0.** Record the platform line, the short status porcelain, and the `hash-object` of every path in the session
   log's Files Changed table. The hashes must match review 1's above; explain each one that differs.
3. **Implement R10–R15.** Do not re-run:
   - the baseline writer;
   - the i18n removals already made;
   - the `check-listing-visibility` / `check-locale-leak` edits.
4. **Measure AC9–AC13** on a **fresh** `build-storybook`, with the GR-3b and GR-3c receipts.
5. **Run the §10.6 live proof** with the captured session. It covers the live halves of AC1–AC4; read the server log
   in full for AC3.
6. **Run the full §13.2 block** after the last source edit, with the review 1 amendments.
7. **Update the records:** add a "Revision 1" section to the session log, add a Files Changed row for each new path,
   and update the 853 backlog line.

### 16.6 Owner matrix additions (§13.3)

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 9 | `Patterns/Mantine/AdminDashboardRecentListings` | Default | 320 / 390 | uk | rows stacked; full-width titles; badge and time on line 2 |
| 10 | same | Empty | 1440 / 390 | en | empty text inside the card |
| 11 | `Patterns/Mantine/AdminDashboardView` | Default | 320 | uk | title 20 px; KPI values 20 px; no double arrows |

## 17. Review 2 — `NEEDS REVISION` (2026-09-27)

Reviewed against the uncommitted worktree (win32 v22.22.3). Hashes read by the reviewer, equal to the session log's
Revision 1 table: `page.tsx` `74b26361` · `AdminDashboardRecentListings.tsx` `79a11ffb` · `AdminDashboardView.tsx`
`624c6894` · `MantineDashboardHeader.tsx` `7812fedd` · `MantineDashboardStatCard.tsx` `ea35f594` ·
`AdminDashboardRecentListings.stories.tsx` `cdeb1680` · `AdminDashboardView.stories.tsx` `15452766` ·
`queries.ts` `d263d56b` · `surface-census-baseline.json` `a2f9a915`. **R10–R15 are accepted** (source read; AC5 grep
re-run and empty; R14/R15 keys read in all four locales; census re-run: its only `FAIL` is the route root, AC6).
Everything not named below stays as it is.

### 17.1 Confirmed defects

| # | Sev | Where | Measured by the reviewer | Fixed by |
|---|---|---|---|---|
| F8 | P2 | `AdminDashboardRecentListings.tsx:107-111`, `:147-151`, `:214` | `RelativeTime` renders `Text component="time" inherit` (`RelativeTime.tsx`), and here it has no sizing parent, so it inherits the body: in `patterns-mantine-admindashboardrecentlistings--default` the row's `time` computes **16px `rgb(0, 0, 0)`** at 320 `uk` and 1440 `en`, while the title is 14px `gray.8` and the owner name 12px `rgb(102, 112, 133)` (`gray.5`). The relative time is the largest text in the row and the only one off the theme palette; visible in `evidence/task853/live-1440.png` and `live-320.png` ("6 days ago"). Legacy rendered it `text-xs text-muted-foreground` (`HEAD:…AdminDashboardRecentListings.tsx:85`). The canonical idiom wraps a `RelativeTime` meta item in `<Text size="xs" c="gray.5">` (`MantineDashboardWorkList.tsx:151`, `:172`). The modal's "Created" value (`:214`) has the same defect against its sibling values (`Text size="sm" fw={500}`, `:190`, `:206`). Review 1 missed this. | R16, AC14 |
| F9 | P2 | session log, Revision 1 | Evidence is asserted, not retained. (a) No `npm run build` transcript exists anywhere in `docs/sessions/evidence/task853/`; the log says `PASS` and the only witness is `.next/BUILD_ID` (18:33:38). (b) AC3's server logs are `/tmp/dev-server-r1.log` and `/tmp/dev-server-3000.log`, outside the repo. (c) Every live-proof and gate output is quoted in prose only; the folder holds the scripts and five screenshots. (d) The log says the live session ran on port 3000, but `live-proof-widths/plant/modal/links.mjs` target **3001**; only `links2`/`remaining` target 3000. | §17.4 steps 4–6 |
| F10 | P2 (orchestrator) | this kickoff §13.2 (now withdrawn) | The owner-native `check:hydration -- --with-admin` was expected to exit 0. Its admin routes are `/en/admin/users` and `/en/admin/users/<id>` (`scripts/check-hydration-console.mjs`, `planRoutes`); both return `404` (`/tmp/dev-server-3000.log`), because the admin tree is `src/app/admin/` with no locale segment. It **never navigates `/admin`**, so the executor's run (PASS 6 / FAIL 2) says nothing about this task. The 404s come from the script, not from 853's diff (853 touches neither routing nor that script — INFERENCE). The script fix is **888**. `/admin`'s hydration evidence becomes §17.3. | §13.2 amended, §17.3, 888 |

### 17.2 New requirement and acceptance criterion

| ID | Requirement | P |
|---|---|---|
| **R16** | In `AdminDashboardRecentListings.tsx`, wrap each of the two row `RelativeTime`s in `<Text component="span" size="xs" c="gray.5">…</Text>`, and the modal's "Created" `RelativeTime` in `<Text component="span" size="sm" fw={500}>…</Text>`, matching the sibling value `Text`s at `:190` / `:206`. Cite `MantineDashboardWorkList.tsx:151` in a one-line comment. Keep `absoluteLabel`, and keep `focusable={false}` on both row instances. Do not edit `RelativeTime.tsx` and do not pass it `className`; its `className` prop is for legacy consumers only. No other change in the file. | P2 |

- **AC14 [R16]** — Given `patterns-mantine-admindashboardrecentlistings--default` at 320 `uk` and 1440 `en`, when
  `getComputedStyle` is read on every visible row `time` element, then each is `12px`, its colour equals the owner
  name's colour in the same row, and it is not larger than that row's title. Given `…--modal-open` at 1440 `en`, the
  modal's `time` is `14px` with `font-weight: 500`, which equals the owner value `Text` beside it. The same two row
  facts hold on the live `/admin` at 1440 and 320 (§17.3). Quote every value.

`GR-4 AC AUDIT — 1 new criterion (AC14); it states an observable property; absolutes: none.`

### 17.3 Live `/admin` check — replaces the withdrawn `check:hydration` run

With the captured staff session, on one dev server whose port the script and the session log both name, load
`/admin` at 1440 and 320 (`waitUntil: 'networkidle'`, then 1 s). Record every `console` message of type `error` or
`warning` and every `pageerror`, verbatim, to `docs/sessions/evidence/task853/r2/live-console.txt`. At each width,
also record AC14's row `time` / title / owner values. Pass: no message matches
`/hydrat|did not match|server rendered|Text content does not match/i`. Any other error is quoted and classified
against `docs/maintenance-playbook.md` §14, never silently dropped. Copy the dev-server log for that run to
`docs/sessions/evidence/task853/r2/dev-server.log` and read it in full for AC3's `Functions cannot be passed` line.

### 17.4 Re-entry — `remediation`

1. **I0.** Record the platform line and the short status porcelain. Record the `hash-object` of every path in
   §17's hash list; each must match. Explain any path that differs.
2. **Implement R16** in `AdminDashboardRecentListings.tsx` only. Do not re-run the baseline writer. Make no i18n,
   Story, pattern or `AdminDashboardView.tsx` edit.
3. **Build a fresh `build-storybook`.** Measure AC14, and re-run AC9 for the Default story, because the row's second
   line changes. Emit one GR-3b and one GR-3c receipt per recent-listings Story.
4. **Run §17.3.**
5. **Run the full §13.2 block** after the last source edit, with review 1's amendments. Write each command's full
   output and exit code to `docs/sessions/evidence/task853/r2/NN-<command>.txt` (`2>&1 | Tee-Object`, then
   `"exit: $LASTEXITCODE"`). The `npm run build` transcript is mandatory. Its `hash-object` line runs in the same
   pass.
6. **Retain what is quoted.** Every number the session log quotes for AC9, AC14 and §17.3 must come from a file in
   `evidence/task853/r2/`. Cite that file next to the number.
7. **Update the records.** Add a "Revision 2" section to the session log, with a Files Changed row for the new hash
   and one for the `r2/` folder. Update the 853 line in `docs/backlog.md`.

### 17.5 Owner matrix additions (§13.3)

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 12 | `Patterns/Mantine/AdminDashboardRecentListings` | Default · ModalOpen | 320 / 1440 | uk / en | relative time is small grey meta text, smaller than the title; the modal's "Created" matches the other values |
| 1 (add) | `/admin` (live) | real data | 1440 | en | the donut legend's wrapped label ("Rented (marked by owner)") reads centred in `live-1440.png`. That is `MantineDashboardChartLegend` (845), not this task's code. **NEEDS VERIFICATION**: accept it, or return it and the reviewer files it against 845's pattern |

## 18. Review 3 — `PARTIALLY VERIFIED` (2026-09-27)

Reviewed against the uncommitted worktree (win32 v22.22.3). The only hash that changed since review 2 is
`AdminDashboardRecentListings.tsx` `79a11ffb` → `8bbe4bb0`. The other eight in §17's list are still equal. **R16 and
AC14 are accepted.** Revision 2's route is closed, so no executor action remains. The task cannot be approved until
the owner records the matrix, because AC8 is `NOT VERIFIABLE` without it.

### 18.1 What closed

- **R16 / AC14.** The source is at `:107-116`, `:152-158` and `:221-223`. It carries both row wraps
  (`Text component="span" size="xs" c="gray.5"`) and the modal wrap (`size="sm" fw={500}`). `focusable={false}` and
  `absoluteLabel` are kept, and `RelativeTime.tsx` is untouched. The executor's `r2/15-ac14-measure.txt` ran on a
  `storybook-static` built at 01:27. The source was last written at 01:38, a comment reword. So the reviewer rebuilt
  Storybook on the final hash and re-ran the same script: `review3/ac14-remeasure-final-source.txt`. It measured every
  row `time` at 12px `rgb(102, 112, 133)`, equal to the owner name, under a 14px title, at 320 `uk` and at 1440 `en`.
  The modal `time` measured 14px/500, equal to the price value. The live halves are in `r2/live-console-dev.txt` and
  `r2/live-console-prod.txt` (1440 and 320, same values).
- **§17.3.** The final artifacts pass:
  - `r2/live-console-dev.txt` comes from a fresh `next dev`; its full log is `r2/dev-server-redo.log`.
  - `r2/live-console-prod.txt` comes from a clean `next build` + `next start`.
  - Neither matches the hydration pattern.
  - AC3: the reviewer read both `r2/dev-server.log` and `r2/dev-server-redo.log` in full, and neither contains
    `Functions cannot be passed`.
- **§13.2 / F9.** Every command's transcript is retained under `r2/00…28`. `26-build-final.txt` exits 0 and is dated
  after the last source write. `27-hash-object-final.txt` equals the reviewer's hashes. `05` records `exit 1` on
  exactly `contactEvents.ts:50` (887). `13` has only the route-root `FAIL` (AC6). `12` exits 0 with the writer not
  re-run.

### 18.2 Notes (P3 — no action owed for 853)

- **N1.** `r2/live-console-dev-first-capture.txt` is not a verbatim capture. It is a prose reconstruction written at
  02:02, and it replaces the hydration diff with a summary. `check-404.mjs`'s output, which names the two
  `/_vercel/*/script.js` 404s, was never written to a file. Both fall under the final artifacts above, so they carry no
  weight. The underlying `useId` drift at 320 on a long-lived dev server did not reproduce in either clean run, and it
  matches `maintenance-playbook.md` §14.1 (Task 582). One likely contributor is that `next build` wrote `.next` while
  that dev server was still running (`19-build.txt` at 01:34, dev server stopped at 01:35). This is an INFERENCE.
- **N2.** The session log says each wrap cites `MantineDashboardWorkList.tsx:151` in a one-line comment. The source
  has a single three-line comment, at `:107-109`. There is no functional impact.

### 18.3 Owner action `O853-2` — matrix §13.3 rows 1–12

This is the only open item. Record each row as accepted, or return it with a concrete defect. Rows 1–8 are in §13.3,
rows 9–11 in §16.6, and row 12 and the row-1 addition (the 845 legend label) in §17.5. When every row is accepted, the
next review archives 853. A returned row reopens it with a revision route written here.

## 19. Review 4 — `APPROVED WITH NOTES` (2026-09-27)

**Owner decision `O853-2`, 2026-09-27, verbatim:** *"Все приймаю. З текстами у donut компоненті я окремо пізніше
дороблю завдання по візуальному вигляду."* This closes AC8 for rows 1–12, including the row-1 addition from §17.5. The
donut legend's text is `MantineDashboardChartLegend` (845), not this task's code. The owner will file that visual work
himself later; it is unnumbered here and carries no 853 dependency.

The implementation is unchanged since review 3: `AdminDashboardRecentListings.tsx` is still `8bbe4bb0`, and the other
eight hashes are still equal. All criteria AC1–AC14 are closed. The notes are §18.2 N1 (non-verbatim first
hydration capture, and the 404 listener output not retained) and N2 (the comment count in the session log). Both are
P3.
