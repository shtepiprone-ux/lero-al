# Task 859 — `/admin/support` honours `?assigned=unassigned&status=` and moves to canonical Mantine

**Sprint 78** (Wave E — landings) · **P2** · QA profile **Q3** (legacy admin surface → Mantine; no registered critical
flow names it) · **runs after 857** (addendum 2026-10-02: `AdminPageFrame`, `withAdminShell`, `AdminTable` `cardsBelow="md"`) · **blocks 885** (Sprint 84, D84-1) · owner action
**O78-13** · **Status: 🔁 `NEEDS REVISION` 2026-10-04 (review 1) — the only executable route is §16 (Revision 1), as amended by §16.9 (owner return 2026-10-04).**
§1–§15 and both addenda stay binding wherever §16 does not replace them.

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md).
Precedents, read-only: **877** (container/View split, `AdminTable`/`AdminPageHeader` adapters, page wrapper), **858**
(URL-driven filter written back with `router.replace`).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration + URL-driven filters. Bundles: **UI / Layout / Component (current Mantine path)**,
**Storybook / Visual Proof**, **Component Catalog / Coverage**, **Admin Table / Admin Control**.

- **Why the whole manager migrates.** The landing changes the manager's visible filter state → clause 16d.
- **Shared legacy file.** `Combobox` (9 other consumers) stays; this surface stops importing it (`MantineSelect`).

## 2. Objective

1. `/admin/support?assigned=unassigned&status=open,in_progress` (the ADM-06 href, `src/modules/admin/dashboard/hrefs.ts:39-44`)
   opens with "unassigned" selected and exactly the `open` and `in_progress` statuses selected; any filter change writes
   `type`, `status` and `assigned` back to the URL.
2. Stats, filters, the ticket list, the detail dialog (status change + note + timeline), the create dialog (support or
   complaint, user pickers, validation) behave as today (§3.3), on canonical Mantine; the timeline shows localized
   status labels instead of raw enum values.
3. The census shows only the root `page.tsx` and the container-exempt containers.

## 3. Verified context — measured 2026-09-29 (re-measure at I0)

### 3.1 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface src\app\admin\support\page.tsx`

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition |
|---|---|---|---|---|---|---|
| `src/app/admin/support/page.tsx` (hash `69fe0a0a…`) | 1 (root) | no | no | 1 | 0 | reads params (R1), wrapper (R8) |
| `src/components/admin/AdminSupportManager.tsx` (903 lines, hash `2dd5328d…`) | 1 | no | legacy `Admin/AdminSupportManager` | 133 | 9 | containers (R2–R5) + Views (R6) |
| `AdminPageHeader`, `AdminTable`, `MantineDashboardHeader`, `MantineDataTableToCards` | 1 | yes | yes | — | 0 | reused |
| `src/components/shared/Combobox.tsx` | 1 | no | no | 21 | 0 | import removed |
| `ui/badge`, `button`, `dialog`, `input`, `textarea` | 2 | — | — | — | — | imports removed |

**Calibration (FACT, `/admin/currency` after 877):** containers print FAIL. Expected after: `page.tsx`,
`AdminSupportManager.tsx`, `TicketDetailDialog.tsx`, `CreateTicketDialog.tsx`, `UserPickerField.tsx` (containers
`className:0 ui-imports:0`).

### 3.2 Filters today

`page.tsx` reads no params; loads the 100 most recently updated tickets and their events (`:15-37`). The manager
filters client-side: `typeFilter` (`all`/`support`/`user_complaint`) and a **single** `statusFilter` (`''` or one of
`open`/`in_progress`/`resolved`/`closed`); there is **no assignment filter** (`assigned_to` is loaded, `:18`, and never
read). FACT (`AdminSupportManager.tsx:669-676`).

### 3.3 Current behaviour to preserve — `AdminSupportManager.tsx`

| Area | Today | Line |
|---|---|---|
| Stats | three cards over all loaded tickets: open, in progress, resolved + closed | `:678-682`, `:768-780` |
| Type / status filters | pill buttons; `new_ticket_btn` at the end of the toolbar | `:783-824` |
| List | `AdminTable`: subject (+ reason line, complaint-type badge), type badge (from `sm`), reporter link, reported link (from `md`), status badge with icon, updated date (from `lg`); row click opens the detail; `cardRow` below 640 (subject, status + type badges, reporter/reported links, date); empty `admin.pages.support_empty` | `:704-764`, `:827-887` |
| Status colours/icons | open warning `Circle` · in_progress info `AlertCircle` · resolved success `CheckCircle2` · closed neutral `XCircle` | `:72-81` |
| User link | `/admin/users/<id>`, name or `id…8`; optional uuid line; `—` when absent | `:91-109` |
| Detail dialog | title = subject; metadata grid (requester/reporter label by type, reported for complaints, created-by, type, complaint type, status, created date); reason block; status change (4 buttons, selected highlighted) + note + `update_status_btn` (disabled while updating or unchanged) → `updateTicketStatus(id, status, note)` → `status_update_success` / `_error`; timeline of the ticket's events (actor or role, `old → new` **raw enum**, `event_created`, date, note) | `:252-423` |
| Create dialog | type select (support / complaint, helper text when empty; switching type resets the fields); support: requester picker, subject, details; complaint: reporter + reported pickers (same-user warning disables Create), complaint type select (8 types), subject, reason; validation messages per field; `createSupportTicket` errors mapped to toasts; success → prepended row + `create_success` | `:426-652` |
| User picker | ≥ 2 chars → 300 ms debounce → `searchUsersForPicker(q)`; results list (name, role badge, phone, id…8); `no_results`; spinner while searching; selected user shown as `UserCard` (name, role + status badges, phone, company, id, clear `X` with `aria_clear_selection`); outside click closes | `:111-248` |
| Local patches | status update patches the row, the open dialog and appends a synthetic `status_changed` event | `:688-702` |
| Root | `data-testid="admin-support-manager"` | `:767` |

### 3.4 Registrations (FACT)

- Legacy Story `src/components/admin/AdminSupportManager.stories.tsx` (`Admin/AdminSupportManager`: `Default`,
  `EmptyState`, `LocaleStress`, `UserCardStatusBadges`; the last imports the exported `UserCard`).
- `scripts/check-stories-rendered.mjs:159` — `admin-adminsupportmanager--default`, anchor `admin-support-manager`.
- `scripts/i18n-dynamic-manifest.json` sites `…AdminSupportManager.tsx:121`, `:123`, `:325`, `:333`.
- No test file names the manager or `createSupportTicket`/`updateTicketStatus` (grep over `*.test.ts(x)`).

### 3.5 Canonical sources inspected (FACT)

| Need | Candidate | Fit |
|---|---|---|
| Stats cards | `MantineDashboardStatCard` (Story `Patterns/Mantine/DashboardStatCard`) | reuse (value + label) |
| Single-choice filters | `SegmentedControl` in `ScrollArea` (precedents `AdminUsersTable`, `FavoritesTypeFilter`) | reuse |
| Multi-choice status | `Checkbox.Group` (Story `Mantine/Primitives/Checkbox`) | reuse |
| List | `AdminTable` adapter | reuse |
| Dialogs | `MantineModal` | reuse |
| Selects | `MantineSelect` | reuse |
| User search | `MantineCombobox` filters a fixed option list client-side and has no async search hook (`MantineCombobox.tsx:31-70`) | rejected; compose `TextInput` + an inline result list (`Paper` + `UnstyledButton` rows) |
| Width | legacy `max-w-6xl` (72rem); no token | **extend** `adminPageWideMaxWidth` |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | reserved row | `page.tsx` takes `searchParams` and passes `initialFilters = parseSupportFilters(sp)` from a new pure module `src/components/admin/supportFilters.ts`: `type` ∈ `support`/`user_complaint` else `all`; `status` = comma list filtered to the 4 known statuses, de-duplicated, order-preserving (empty = all); `assigned` = `unassigned` or `all`. The module also exports `serializeSupportFilters(f)` (inverse; omits defaults) and `matchesSupportFilters(ticket, f)`. The query is unchanged. | P1 | T1, T2 | Confirmed |
| **R2** | component-rules P0 | `AdminSupportManager` (container) keeps items/events state, resync effects, `handleCreated`, `handleStatusUpdated`; its filter state starts from `initialFilters`; `filtered = items.filter(t => matchesSupportFilters(t, filters))`; every filter change sets state and calls `router.replace(\`${pathname}?${serializeSupportFilters(next)}\`, { scroll: false })`. Renders only `AdminSupportView` and, when open, the two dialog containers. 0 `className`, 0 `ui/*`. | P1 | T3 | Confirmed |
| **R3** | component-rules P0 | `TicketDetailDialog.tsx` (container): `:264-285` unchanged; renders `TicketDetailDialogView`. | P1 | T5 | Confirmed |
| **R4** | component-rules P0 | `CreateTicketDialog.tsx` (container): `:426-517` unchanged (state, `validate`, `handleCreate`, error mapping); renders `CreateTicketDialogView`. | P1 | T6, T7 | Confirmed |
| **R5** | component-rules P0 | `UserPickerField.tsx` (container): `:157-194`'s search/debounce/select logic unchanged except the outside-click listener, which goes (the inline list closes on select or when the query drops below 2 characters); renders `UserPickerFieldView`. | P1 | T8 | Confirmed |
| **R6** | §3.3; GR-0 | New presentational Views in `src/components/admin/` (0 `className`, 0 `ui/*`, no raw literal): **`AdminSupportView`** — root `Stack gap="lg"` `data-testid="admin-support-manager"`; `SimpleGrid cols={{ base: 1, xs2: 3 }}` of three `MantineDashboardStatCard`s; toolbar `Group` (stacked below 640): type `SegmentedControl` (`filter_all`, `type_support`, `type_user_complaint`), assignment `SegmentedControl` (`filter_all`, `filter_unassigned` — new key), status `Checkbox.Group` (`Group` of the 4 status checkboxes, label `col_status`; none checked = all), `Button leftSection={Plus}` `new_ticket_btn`; the list through `AdminTable` with §3.3's columns and card (status `Badge variant="light"` open `yellow`, in_progress `blue`, resolved `green`, closed `gray`, with the icon at `iconSize.badge` in `leftSection`; type `Badge` complaint `red`, support `blue`; user links `Anchor component={Link} size="xs"` with `lineClamp={1}`). **`TicketDetailDialogView`** — `MantineModal` (title = subject); `SimpleGrid cols={{ base: 2, sm: 3 }}` of label (`Text size="xs" c="dimmed"`) / value pairs; reason in `Paper bg="gray.0" p="sm" radius="md"`; status change `Paper withBorder radius="lg" p="md"`: `SegmentedControl` of the 4 statuses (full width below 640), `Textarea autosize minRows={2}`, `Button loading` `update_status_btn`; timeline rows `Group align="flex-start" wrap="nowrap"` with the `Clock` icon, actor `fw={500}`, **`support_status_<old>` → `support_status_<new>` labels**, `event_created`, date `c="dimmed"`, note. **`CreateTicketDialogView`** — `MantineModal` + footer (cancel `variant="default"`, create `loading`, disabled on same user); `MantineSelect` type (helper `ticket_type_helper_empty` as `description` while empty); per-type fields as today with `TextInput`/`Textarea` and `error` props; complaint type `MantineSelect`; same-user warning `Text size="xs" c="red"`. **`UserPickerFieldView`** — label `Group` (icon + `Text size="sm" fw={500}`); when a user is selected, a `Paper withBorder p="sm" radius="md"` card (name, role `Badge variant="outline" size="xs"`, status `Badge` active `green` / blocked `red` / other `gray`, phone, company, `Text ff="monospace" size="xs" c="dimmed"` id…8, `ActionIcon variant="subtle"` clear with `aria_clear_selection`); else a `TextInput` (`leftSection` `Search`, `rightSection` `Loader size="xs"` while searching) and, when open, a `Paper withBorder` list of `UnstyledButton` rows (≥ `theme.other.touchTarget` high) or `no_results`; `error` below. | P1 | AC2 | Confirmed |
| **R7** | i18n clause 7 | `admin.support.filter_unassigned` added in `sq`/`en`/`uk`/`it` (en *"Unassigned"*; the other three translated, not copied). No other key changes. | P2 | `check:i18n` | Confirmed |
| **R8** | 877 precedent; D71-4 | `page.tsx` wrapper `<Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageWideMaxWidth} mx="auto">`; new theme key `adminPageWideMaxWidth: '72rem'` (`// 1152px — Task 859: /admin/support page wrapper (legacy max-w-6xl)`), 877's value type. | P2 | AC3 | Confirmed |
| **R9** | GR-3, GR-3a, GR-3d, 16c | Stories under `src/stories/patterns/mantine/` (`skipCanvas: true`; page exports in `StoryPageGutter`): `Patterns/Mantine/AdminSupportView` — `Default`, `UnassignedLanding` (`assigned='unassigned'`, statuses open + in_progress), `Empty`; `Patterns/Mantine/TicketDetailDialogView` — `Support`, `Complaint`, `WithTimeline`, `Updating`; `Patterns/Mantine/CreateTicketDialogView` — `Empty`, `Support`, `Complaint`, `ComplaintSameUser`, `Errors`; `Patterns/Mantine/UserPickerFieldView` — `Idle`, `Searching`, `Results`, `NoResults`, `Selected` (active), `SelectedBlocked`. Fixtures from `src/stories/fixtures/admin.fixtures.ts` (support tickets at `:480-520`) plus additions. Four Views enrolled. The legacy Story is deleted; `UserCard` is no longer exported. | P1 | AC4 | Confirmed |
| **R10** | clause 9 | `check-stories-rendered.mjs:159` → `patterns-mantine-adminsupportview--default` (same anchor); `i18n-dynamic-manifest.json` sites → the Views' lines; `git grep --untracked -n "admin-adminsupportmanager\|AdminSupportManager.stories\|UserCard"` prints nothing outside history paths. | P1 | AC5 | Confirmed |
| **R11** | Q3 regression (no prior test) | `src/components/admin/__tests__/supportFilters.test.ts`: **T1** `parseSupportFilters` — the ADM-06 query yields `{ type: 'all', status: ['open','in_progress'], assigned: 'unassigned' }`; `status=bogus,open,open` → `['open']`; missing → defaults; array values handled; **T2** `serialize(parse(x))` round-trips the ADM-06 query exactly, with `x` taken from `unassignedSupportHref()` at test time (never retyped). `src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx` (real Mantine + intl render; `@/modules/admin/actions`, toast, navigation mocked): **T3** initial ADM-06 filters show only unassigned open/in-progress fixture rows; unchecking `in_progress` calls `router.replace` with `status=open` and keeps `assigned`; **T4** stats count all loaded tickets whatever the filter; **T5** a status update calls `updateTicketStatus(id, 'resolved', note)` and the timeline shows the localized labels, never `in_progress`; **T6** create support with an empty subject shows `subject_required` and no call; **T7** complaint with the same reporter and reported disables Create; **T8** the picker calls `searchUsersForPicker` once after the debounce for a 2-char query (fake timers) and not for 1 char. | P0 | AC6 | Confirmed |
| **R12** | GR-1 | FAIL lines after = §3.1 calibration; four Views `manifest:yes story:yes`; no `Combobox`/`ui/*` node; baseline regenerated; removed keys only from this surface; no key added. | P0 | AC7 | Confirmed |

## 5. Assumptions and open questions

1. Limitation kept, recorded: the page loads the 100 most recently updated tickets; the ADM-06 **count** is computed
   server-side over all tickets (`queries.ts:207-228`). With more than 100 matching tickets the landing shows fewer rows
   than the card counted. INFERENCE: acceptable at current volume; server-side filtering would change the stats'
   meaning and is out of scope.
2. Visual changes (O78-13): stats become canonical stat cards; filters become segmented controls and a checkbox group;
   the user picker's floating dropdown becomes an inline list; dialogs on `MantineModal`; timeline labels localized.
3. Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` 1, 3–7, 9–16d · `docs/rule-index.md` → the §1 bundles ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6b, §6u · `docs/component-rules.md` ·
`docs/qa-profiles.md` Q3 · the executed 877 kickoff and the 858 kickoff, read-only · 818/819 corollary.

## 7. Scope — the exact allowed write set

1. `src/app/admin/support/page.tsx`; new `src/components/admin/supportFilters.ts`
2. `src/components/admin/AdminSupportManager.tsx`; new `TicketDetailDialog.tsx`, `CreateTicketDialog.tsx`, `UserPickerField.tsx`,
   `AdminSupportView.tsx`, `TicketDetailDialogView.tsx`, `CreateTicketDialogView.tsx`, `UserPickerFieldView.tsx` (all `src/components/admin/`)
3. `src/design-system/mantine/theme.ts` — `adminPageWideMaxWidth` and its type line
4. `messages/{sq,en,uk,it}.json` — `admin.support.filter_unassigned` only
5. new Stories (four files, §R9); deleted `src/components/admin/AdminSupportManager.stories.tsx`; `src/stories/fixtures/admin.fixtures.ts` (additions only)
6. new tests `src/components/admin/__tests__/supportFilters.test.ts`, `AdminSupportManager.smoke.test.tsx`
7. `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `scripts/check-stories-rendered.mjs`,
   `scripts/i18n-dynamic-manifest.json`, `scripts/story-coverage-exempt.json` if it names the file; catalog files if required
8. `docs/sessions/<date>-task859-admin-support-mantine.md`, `docs/sessions/evidence/task859/*`; `docs/backlog.md` 859 cell

## 8. Out of scope

- `src/modules/admin/actions/**` (ticket actions, `searchUsersForPicker`), the database, notifications.
- Ticket assignment (no UI assigns tickets today); server-side filtering (§5.1).
- `Combobox.tsx`. The 24-hour clock (885).

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| `?assigned=`, `?status=`, `?type=` | ignored | initial filters; written back on change |
| Status filter | one status | any subset (**changed**, needed for the ADM-06 landing) |
| Assignment filter | none | all / unassigned (**new**) |
| Stats, list, dialogs, validation, toasts, local patches | §3.3 | **unchanged** (T3–T8) |
| Timeline status text | raw enum (`in_progress`) | localized label (**fixed**, clause 7) |
| User picker | floating dropdown | inline list below the field (**changed**) |

## 10. Implementation requirements

### 10.1 I0

1. `win32` platform line; status + hashes → `docs/sessions/evidence/task859/01-*`; a §7 path modified → `BLOCKED — SHARED PATH`.
2. Census → `02`; unmigrated node outside R2–R6 → `BLOCKED — CLAUSE 16d`.
3. Read `hrefs.ts:39-44`. T2 imports `unassignedSupportHref` from `@/modules/admin/dashboard/hrefs` inside vitest and
   asserts `serializeSupportFilters(parseSupportFilters(<its query>))` equals that query, so the href is never retyped.
4. GR-0 and GR-3a receipts (§15.1).

### 10.2 Order

I0 → R1 module + T1/T2 → R8 token → R7 key → R6 Views → R9 Stories → R3–R5, R2 containers → page → R11 smoke tests →
plants → R10 → R12 → gates → receipts.

### 10.3 Plants (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | `parseSupportFilters` ignores `assigned` | T1, T3 |
| **P2** | filter changes stop calling `router.replace` | T3 |
| **P3** | the timeline View prints `ev.old_status` raw | T5 |
| **P4** | re-add `import { Badge } from '@/components/ui/badge'` in `AdminSupportView` | census exits 1 naming `ui/badge` |

## 11. Positive and negative flows

**Positive flow.** An admin clicks ADM-06 on `/admin`, lands on `/admin/support?assigned=unassigned&status=open,in_progress`,
sees only unassigned open and in-progress tickets, opens one, sets it to resolved with a note; the row's badge and the
timeline update; unchecking "open" writes `status=in_progress`.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Unknown / duplicated params | Yes | sanitized | T1 |
| Status update error | Yes | `status_update_error` toast | code unchanged (R3) |
| Create validation / server errors | Yes | field messages / mapped toasts | T6, code unchanged (R4) |
| Same user in a complaint | Yes | Create disabled + warning | T7 |
| Picker < 2 chars | Yes | no search | T8 |
| No tickets / none match | Yes | `support_empty` | `Empty` Story |
| Mobile < 640 | Yes | stacked toolbar, scrollable segmented controls, cards, bottom sheets | GR-3b receipts |

## 12. Acceptance criteria

- **AC1 [R2–R5]** Given the four containers, then each renders only its View (plus the dialogs from the manager), with 0
  `className` and 0 `ui/*`, and the cited logic ranges are unchanged in the diff except R5's listener removal.
- **AC2 [R6]** Given the four Views, then none contains `className`, a `ui/*` import or a raw colour/px/rem literal;
  `check:design-tokens` and `check:enrolled-tailwind` exit 0.
- **AC3 [R8]** Given `page.tsx` and `theme.ts`, then the wrapper is the Mantine `Box` with `adminPageWideMaxWidth`; the
  definition line is quoted.
- **AC4 [R9]** Given the four Story files, then each imports its View, carries R9's exports without a written gutter or
  viewport pin, and `check:story-coverage` exits 0 with the four Views enrolled.
- **AC5 [R10]** Given the tree, then the legacy Story is gone and the R10 grep prints nothing outside history paths.
- **AC6 [R1, R11]** Given T1–T8 on the final tree, then all pass; P1–P3 each fail and pass after restore with equal hashes.
- **AC7 [R12]** Given `11-census-after.txt`, then the FAIL lines are exactly the five calibration lines.
- **AC8 [R7, all]** `npm.cmd run build` exits 0; `typecheck`, `lint`, `check:story-coverage`, `check:rendered-scope`,
  `check:surface-census:changed`, `check:i18n`, `check:i18n-dynamic`, `check:file-integrity`, `check:mojibake`,
  `build-storybook` exit 0.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: AC5's empty grep over live paths (deletion audit, --untracked).`

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| `support_title` | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` | 877 adapter |
| Stat values | KPI | per `MantineDashboardStatCard` contract | | | | pattern-owned (D78-5, TailAdmin §6u) | 843 |
| Filters, cells, dialog body | body | 14px | 14px | 14px | 14px | `sm` | legacy `text-sm` |
| Badges, meta, timeline | small | 12px | 12px | 12px | 12px | `xs` | legacy `text-xs` |

The stat card's value size is the pattern's own responsive contract; this task does not restyle it.

### 12.2 Width contract (GR-3b) and gutter (GR-3d)

Parent: the R8 `Box` (cap, fluid). Stories fluid. GR-3d: `AdminSupportView`, `UserPickerFieldView` — **wrap in this
task**; `TicketDetailDialogView`, `CreateTicketDialogView` — **n/a: overlay-only**; `Patterns/Mantine/DashboardStatCard`,
`Patterns/Mantine/AdminTable`, `Patterns/Mantine/AdminPageHeader` (blast radius) — **profile present**.

## 13. QA profile and verification plan

**Q3** — legacy admin surface; no registered critical flow; new pure-module tests plus a real-render smoke test.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task859"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\support\page.tsx *>&1 | Tee-Object "$ev\11-census-after.txt"
npx.cmd vitest run src/components/admin/__tests__/supportFilters.test.ts src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\12-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\13-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\14-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\15-rendered-scope.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\16-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\17-design-tokens.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\17b-enrolled-tailwind.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\17c-i18n.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\17d-i18n-dynamic.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\18-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\18b-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\19-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19b-build.txt"
git --no-optional-locks diff -- scripts\surface-census-baseline.json | Tee-Object "$ev\20-baseline-diff.txt"
git --no-optional-locks grep --untracked -n -E "admin-adminsupportmanager|AdminSupportManager\.stories|\bUserCard\b" -- . ":!docs/sessions/**" ":!tasks/**" ":!docs/backlog-archive.md" | Tee-Object "$ev\20b-reference-audit.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record each exit code; normalise `Tee-Object` files to UTF-8 without BOM; hashes → `22-hash-object.txt`. Expected:
`win32`; five calibration FAIL lines; all exits 0; `20b` empty.

### 13.2 Receipts (executor)

GR-3b / GR-3c / GR-3d per export at 320/390/1024/1440 (type 768/1440); edge gap 16/16/32/32 for the two page Stories.

### 13.3 `OWNER VISUAL QA REQUIRED` — O78-13

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminSupportView` | `Default`, `UnassignedLanding`, `Empty` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/TicketDetailDialogView` | `Complaint`, `WithTimeline` | `sq`, `uk` | 390, 1440 | 8 |
| `Patterns/Mantine/CreateTicketDialogView` | `Support`, `Complaint`, `Errors` | `sq` | 390, 1440 | 6 |
| `Patterns/Mantine/UserPickerFieldView` | `Results`, `Selected` | `sq` | 390, 1440 | 4 |
| `Patterns/Mantine/AdminSupportView` `Default` | — | `en`, `it` | 1024 | 2 |

32 tuples. After the deploy: click ADM-06 on `/admin`; confirm the unassigned + open/in-progress selection and the URL.

## 14. Completion report contract

Status per `execute-task`. Files with hashes; R1–R12/AC1–AC8 with evidence; exit codes; census before/after; GR-0,
GR-1, GR-3 per View, GR-3a, GR-3b, GR-3c, GR-3d receipts; plants with hash pairs; §5.1 limitation restated; O78-13 owed.
Update the 859 cell of `docs/backlog.md`; session log. No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R2–R5→AC1 · R6→AC2 · R8→AC3 · R9→AC4 · R10→AC5 · R1/R11→AC6 · R12→AC7 · R7→AC8 |
| Two-armed controls | P1–P4 |
| Known limitation stated | §5.1 |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Stats | `MantineDashboardStatCard`, `MantineDashboardStatRows` | `Patterns/Mantine/DashboardStatCard` | **reuse** | — |
| Type / assignment filters | `SegmentedControl`, `FavoritesTypeFilter`, `AdminUsersTable` | `Mantine/Primitives/SegmentedControl` | **reuse** | — |
| Status multi-filter | `Checkbox`, `Chip` (no Story), aria-pressed buttons | `Mantine/Primitives/Checkbox` | **reuse** | — |
| List | `AdminTable` | `Patterns/Mantine/AdminTable` | **reuse** | — |
| Dialogs, selects, textarea | `MantineModal`, `MantineSelect`, `Textarea` | primitives | **reuse** | — |
| User picker | `MantineCombobox` (no async search), `LocationCombobox`, `PhoneField` | `TextInput` + `Paper` + `UnstyledButton` | **compose** | own View + Story |
| Page chrome | `AdminPageHeader`, width tokens | 877 | **reuse** + **extend** `adminPageWideMaxWidth` | — |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/support (list View, detail and create dialog Views, user picker View, URL filters, page wrapper); semantic queries: stat card, segmented filter, multi-select checkbox group, admin data table to cards, modal, select, async user search, admin page header, admin page width; inspected candidates: MantineDashboardStatCard (Patterns/Mantine/DashboardStatCard), SegmentedControl, FavoritesTypeFilter, Checkbox (Mantine/Primitives/Checkbox), AdminTable, MantineModal, MantineSelect, Textarea, MantineCombobox, LocationCombobox, AdminPageHeader, adminPageMaxWidth; decision: REUSE + COMPOSE (four Views with own Stories) + EXTEND (adminPageWideMaxWidth); selected canonical owner: patterns/MantineDashboardStatCard.tsx, components/admin/AdminTable.tsx, patterns/MantineModal.tsx, theme.other.layout; Mantine/TailAdmin token path: spacing, fz sm/xs, iconSize, touchTarget, TailAdmin §6b/§6u; new hardcoded visual values: NONE; rationale: MantineCombobox cannot run a server search, so the picker composes primitives; everything else reuses canonical owners.`

`GR-3a STORY PREFLIGHT — AdminSupportView / TicketDetailDialogView / CreateTicketDialogView / UserPickerFieldView × R9 states; canonical candidates: NONE (Admin/AdminSupportManager renders legacy components); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new Views; the legacy Story is deleted.`

`GR-1 CENSUS COMPLETE — 12 nodes today; after: tier1 4 Views migrated+enrolled+story + 4 container-exempt (AdminSupportManager, TicketDetailDialog, CreateTicketDialog, UserPickerField); Combobox import removed (file stays); tier2 5 imports removed; tier3 none — filed as none.`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Census, 12 nodes | 2026-09-29 run | VERIFIED |
| No assignment filter; single status | manager `:669-676` | VERIFIED |
| ADM-06 href | `hrefs.ts:39-44` | VERIFIED |
| Raw enum in the timeline | manager `:405-409` | VERIFIED |
| No existing tests | grep over test files | VERIFIED |
| `MantineCombobox` has no async search | `MantineCombobox.tsx:31-70` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | whole surface | COMPLIANT |
| GR-0 | reuse/compose/extend | COMPLIANT |
| GR-3 / 3a / 16c | four own Stories; legacy deleted | COMPLIANT |
| GR-3b / 3c / 3d | §12 | COMPLIANT |
| clause 7 | new key in 4 locales; raw enum removed | COMPLIANT |
| clause 9 | deletion audit | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | I0 | `BLOCKED` |
| 1 | R1 + T1/T2 | fails → fix before UI |
| 2 | Views + Stories | receipts missing → `BLOCKED` |
| 3 | Containers + smoke + plants | a plant passes → test defect |
| 4 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 5 | O78-13 | returned → revision |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **859** | reserved 2026-09-18 — **Sprint 78**, P2 | **`/admin/support` ignores URL filters**, so the ADM-06 card (853) lands unfiltered. `src/app/admin/support/page.tsx` reads no search params; `AdminSupportManager.tsx` is 903 lines, legacy. Deliverable: the page honours `?assigned=unassigned&status=open,in_progress` (the hrefs are pinned by 847's `hrefs.ts`). Changing that surface's visible filter state brings `AdminSupportManager` under clause 16d → census first, then kickoff. **Also blocks 885 (Sprint 84, owner D84-1, 2026-09-27):** `/admin/support` shows `formatDate` output that 885 changes, so its census must be clean first. It removes its own `Combobox` import (`MantineSelect`, as 893 does) and consumes 877's `AdminTable`/`AdminPageHeader`. |

---

## Addendum — Task 886 closure, 2026-09-30 (owner decision O83-2)

Task 886 added the blocking `check:type-responsive` gate (`scripts/check-type-responsive.mjs`). It baselines the legacy site **L6** (`src/components/admin/AdminSupportManager.tsx :: text-2xl`) in `scripts/type-responsive-baseline.json`.
- When this task removes that site, delete its baseline entry in the same change. The gate fails on a **stale** entry: *"the site was fixed or removed; delete the entry"*.
- Add `npm.cmd run check:type-responsive` to the final gate block. It must exit 0.
- The migrated heading follows GR-3c: a breakpoint-keyed theme `fz` (`TITLE_FZ`, `src/design-system/mantine/typography.ts`), and at most 20px below 640.

Owner, verbatim (O83-2, 2026-09-30): *"що це за Legacy-сайти і чи використовуємо ми їх наразі у проекті? Якщо використовуємо, тоді треба мігрувати на Minetine."*

---

## Addendum — Task 857 review 3, 2026-10-02 (owner rule §7.3 "Table fit")

The owner ruled, verbatim: *"і це стосується всіх таблиць у проекті, а не тільки в адмінці"*. The rule is
`docs/mantine-responsive-design-system.md` §7.3. It binds this task:

1. **Run after 857 lands.** 857 adds three things this task consumes:
   - `AdminPageFrame` (`src/components/admin/AdminPageFrame.tsx`). The `/admin/support` page wraps its content in it
     instead of a hand-written `Box`.
   - `withAdminShell` (`src/stories/_StoryAdminShell.tsx`).
   - `AdminTable`'s `cardsBelow="md"`.

   If 857 has not landed at I0, return `PREMISE DRIFT — 857`.
2. **Stories render at production width.** `AdminSupportView`'s Story renders through `withAdminShell` +
   `AdminPageFrame`, exactly as its route does, with no `StoryPageGutter`. This replaces §12.2's "wrap in this task"
   for that Story. The GR-3d value is `n/a: own gutter (AdminPageFrame)`. The dialog Stories stay overlay-only.
3. **The support list meets §7.3.** From 768, it has no horizontal scroll at the production card width in all four
   locales. Fit it in the §7.3 order:
   - the subject column wraps at `theme.other.layout.tableTitleColumnWidth`;
   - related values merge into one cell (for example, the type badge stacked under the status, and the reporter and
     reported links as a meta line under the subject);
   - secondary columns appear from a breakpoint.

   Emit one `TABLE FIT CHECK` receipt per list export.

---

## 16. Revision 1 (review 1, 2026-10-04): `NEEDS REVISION`

Review 1 inspected the real diff: `page.tsx`, `supportFilters.ts`, the container, the 3 new containers, the 4 Views, the
registrations and the evidence directory. It also re-ran the census and T1–T8 natively (`win32 v22.22.3`: census FAIL
lines = the 5 calibration lines; `15 passed`).

**Correct and kept, not to be redone:**
- the URL-filter module;
- the container logic (identical to `HEAD`'s ranges, apart from R5's listener);
- the list View;
- the table fit;
- the registrations;
- T1–T8 and P1–P4.

**Re-entry mode: `remediation`.** Start from the current tree. Preserve every `docs/sessions/evidence/task859/0*`–`2*`
artifact, and write new ones as `r1-*`. Do not touch `docs/sessions/evidence/task859/research/` (Opus's GR-7 audit).

### 16.1 Findings

**F1 — P1, dialog anatomy (owner rules §23.6/§23.7, 2026-10-02).**
- *Observed.* `TicketDetailDialogView.tsx:113-226` and `CreateTicketDialogView.tsx:72-154` are non-structured
  `MantineModal`s:
  - the detail dialog has a caption-over-value `SimpleGrid` (`:116-157`), which §23.7 names as forbidden ("No
    caption-over-value grids");
  - its primary action (`update_status_btn`) sits in the body inside a `Paper` (`:168-197`);
  - the create dialog builds its own footer `Flex` (`:72-81`) instead of `MantineDialogFooter`.
- *Expected.* `docs/mantine-responsive-design-system.md` §23.6/§23.7 (`:1299-1370`): every new or migrated popup uses
  only the canonical parts (structured header, sections, facts, navigation, a choice, the equal-width footer pair).
  §23.6 says *"a review applies this section to every dialog a task creates or changes"*.
- *Cause.* A task-specification defect. This kickoff (2026-09-29) predates the rules and was not amended; the executor
  followed it.
- *Resolution.* §16.3 R13/R14.

**F2 — P2, icon family (owner rule §26, 2026-10-02).**
- *Observed.* The new Views import `lucide-react`: `AdminSupportView.tsx:5`, `TicketDetailDialogView.tsx:5`,
  `UserPickerFieldView.tsx:4`. §26 (`:1475-1530`) requires every icon a task **adds or changes** to come from
  `@solar-icons/react`. `package.json` does not contain it yet. Precedent: 919 and 918 add `@solar-icons/react` 2.3.2
  when it is missing.
- *Resolution.* §16.3 R15.

**F3 — P2, clause 9 deletion audit (AC5).**
- *Observed.* `20b-reference-audit-live.txt` still lists `docs/responsive-storybook-inventory.md:67, :148, :340, :367,
  :378, :393`. That is a live inventory whose own convention retires removed Story ids in place (for example
  `RETIRED-852-…`, `RETIRED-893-…`).
- *Observed.* `scripts/governance/tailwind-entropy.allowlist.json:248` still holds an `AdminSupportManager.tsx` entry
  whose utilities no longer exist. Clause 9 names allowlists explicitly.
- *Ruling.* `scripts/task320-qa-i18n-fixes.mjs` is a historical one-off QA script (Task 320's evidence, not
  automation). It is excluded like `docs/sessions/**`.
- *Resolution.* §16.3 R16.

### 16.2 Rulings on the executor's deviations (Opus, binding)

1. **R8 / AC3: superseded.** The 2026-10-02 addendum (item 1) replaced R8's hand-written `Box` with `AdminPageFrame`,
   the single owner of admin page widths since 857. `<AdminPageFrame width="page">` (64rem, as `/admin/reports`) is
   the correct implementation. `adminPageWideMaxWidth` is **not** added: a wide variant for one page would be a
   parallel width contract (GR-0). The 72rem → 64rem change is visible, so it is on the owner matrix (§16.6). AC3 now
   reads: *`page.tsx` wraps its content in `<AdminPageFrame width="page">` and `theme.ts` gains no key from this
   task.*
2. **`blue` → `blueLight`: accepted.** `check:stories` rejects the unregistered `blue`. `blueLight` is the registered
   info tone (`--status-info`, the same value `LISTING_STATUS_COLOR.sold` uses). R6's colour list is amended to match.
3. **`governance:tailwind` exit 1: not 859's.** Its +5 HIGH violations sit in `MantineDashboardStatCard.tsx` and
   `theme.ts`, which this task did not edit. Review 1 of 741 R3 (commit `edb6a4e30`) recorded it as pre-existing at
   `HEAD`, owned by **897**. It stays out of AC8.
4. **`check:surface-census:changed --base HEAD`: accepted.** It is the gate's required form for a working-tree run.
   The §16.5 block uses it.

### 16.3 Requirements (Revision 1)

| ID | Source | Observable requirement | P | AC |
|---|---|---|---|---|
| R13 | §23.6/§23.7, F1 | `TicketDetailDialogView` is `MantineModal structured` (title = subject, description = the type label), built only from `MantineDialogSections`. **Details:** `MantineDetailList` of requester or reporter, reported (complaint), created by, type badge, complaint-type badge, status badge and created date; names as plain text (`—` when absent). **Reason** (when present): section titled `reason_section`, `Text size="sm"`. **Status:** section titled `status_change_label` with a `Radio.Group` of 4 `Radio.Card`s (one per status, label `support_status_<s>`; the canonical `RadioCard`/`RadioIndicator` theme entries, as `PremiumDialogView`), then the note `Textarea`. **Timeline** (when events exist): section titled `timeline_title`, rows as today with the localized labels. **Navigation:** one `MantineNavRowList` row per linked user (requester or reporter, reported, created by), each to `/admin/users/<id>`. **Footer:** `MantineDialogFooter` with secondary `cancel_btn` (closes) and primary `update_status_btn` (`loading` while updating; disabled while updating or when the chosen status equals the ticket's). The container is unchanged. | P1 | AC9 |
| R14 | §23.6/§23.7, F1 | `CreateTicketDialogView` is `MantineModal structured` (title `dialog_create_title`), its fields grouped in `MantineDialogSections` in today's order. The type and complaint-type controls stay `MantineSelect` (§23.6 lists it for a mutually exclusive choice), with today's helper, errors and reset-on-switch. The footer is `MantineDialogFooter`: secondary `cancel_btn` (disabled while creating), primary `create_btn` (`loading`; disabled while creating or on the same user). | P1 | AC9 |
| R15 | §26, F2 | Every icon in the 4 Views comes from `@solar-icons/react`, imported by name from a style subpath. Use `broken` for inline icons (badges, buttons, input sections, timeline, picker label, clear button, nav rows) and `bold-duotone` for the 3 stat-card tile icons (the tile role, D89-4). Sizes stay `theme.other.iconSize` keys and colour stays `currentColor`. If `package.json` lacks the package, install `@solar-icons/react@2.3.2`, and take the real export names from `node_modules/@solar-icons/react/dist`, never from an Iconify id. The 4 View files then have no `lucide-react` import. | P2 | AC10 |
| R16 | clause 9, F3 | In `docs/responsive-storybook-inventory.md`, every live reference to `admin-adminsupportmanager--*` is retired in place, following the file's `RETIRED-<task>-…` convention (`RETIRED-859-…`, pointing at `patterns-mantine-adminsupportview--default`). The `AdminSupportManager.tsx` entry is removed from `scripts/governance/tailwind-entropy.allowlist.json`. | P2 | AC11 |
| R17 | i18n clause 7 | New keys in `admin.support`, in `sq`/`en`/`uk`/`it` (translated, not copied): `details_section` (en "Details"), `nav_open_requester` ("Open requester profile"), `nav_open_reporter` ("Open reporter profile"), `nav_open_reported` ("Open reported user profile"), `nav_open_created_by` ("Open creator profile"). No other key changes. | P2 | AC12 |
| R18 | GR-3/GR-3a/16c | Stories: `TicketDetailDialogView` keeps its 4 exports, now rendering R13. `CreateTicketDialogView` keeps its 5 exports, now rendering R14. No export is added or removed. | P1 | AC13 |

### 16.4 Acceptance criteria (Revision 1)

- **AC9 [R13, R14]**
  - Both dialog Views pass `structured`, import `MantineDialogSections`/`MantineDialogFooter`, and contain no
    `SimpleGrid`, no `Flex` footer and no `Button` outside `MantineDialogFooter`.
  - The detail View imports `MantineDetailList` and `MantineNavRowList` and renders 4 `Radio.Card`s.
  - The smoke test still passes T5 (now: select the `resolved` card, press the footer primary) and T6/T7 (now: the
    footer primary).
  - A new **T9** asserts that in the detail dialog the primary is disabled while the chosen status equals the
    ticket's, and enabled after another card is chosen.
- **AC10 [R15]**
  - `git grep -n "lucide-react"` over the 4 View files prints nothing.
  - Every Solar import is a style-subpath named import.
  - `package.json` lists `@solar-icons/react` (the version recorded).
- **AC11 [R16]**
  - The §16.5 reference grep prints only the `RETIRED-859-…` lines.
  - The allowlist has no `AdminSupportManager.tsx` entry.
- **AC12 [R17]** `check:i18n` exits 0, and the 5 keys exist in the 4 files.
- **AC13 [R18]** `check:story-coverage` and `check:stories` exit 0. The dialog Stories render §23.7's parts at 390
  (bottom sheet, equal-width footer pair) and 1440.

`GR-4 AC AUDIT — 5 criteria (AC9–AC13); each states an observable property; absolutes: AC10/AC11's empty greps over named live paths (deletion and icon audits).`

### 16.5 Allowed write set and gate block (Revision 1)

Writes allowed in Revision 1 (nothing else):
- `src/components/admin/{AdminSupportView,TicketDetailDialogView,CreateTicketDialogView,UserPickerFieldView}.tsx`;
- `src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx` (T5–T7 adjusted, T9 added);
- the two dialog Story files and `src/stories/fixtures/admin.fixtures.ts` (only if a Story needs a field);
- `messages/{sq,en,uk,it}.json` (R17 keys only);
- `package.json`, `package-lock.json` (only if Solar is missing);
- `docs/responsive-storybook-inventory.md` and `scripts/governance/tailwind-entropy.allowlist.json` (R16 only);
- `scripts/i18n-dynamic-manifest.json` (re-point the 4 sites if their lines move);
- the session log (append a "Revision 1" section with its own Files Changed table), `r1-*` evidence, and the 859
  backlog cell.

The containers, `supportFilters.ts`, `page.tsx` and every other registration are frozen. Record their hashes at re-entry
and again at the end; each pair must be equal.

```powershell
$ev = "docs\sessions\evidence\task859"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"
git hash-object src\components\admin\AdminSupportManager.tsx src\components\admin\TicketDetailDialog.tsx src\components\admin\CreateTicketDialog.tsx src\components\admin\UserPickerField.tsx src\components\admin\supportFilters.ts src\app\admin\support\page.tsx
npx.cmd vitest run src/components/admin/__tests__/supportFilters.test.ts src/components/admin/__tests__/AdminSupportManager.smoke.test.tsx
node.exe scripts\check-surface-census.mjs --surface src\app\admin\support\page.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run check:rendered-scope
npm.cmd run check:surface-census:changed -- --base HEAD
npm.cmd run check:design-tokens
npm.cmd run check:enrolled-tailwind
npm.cmd run check:i18n
npm.cmd run check:i18n-dynamic
npm.cmd run check:type-responsive
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run build-storybook
npm.cmd run build
git --no-optional-locks grep --untracked -n -E "admin-adminsupportmanager|AdminSupportManager\.stories|\bUserCard\b" -- . ":!docs/sessions/**" ":!tasks/**" ":!docs/backlog-archive.md" ":!docs/reviews/**" ":!scripts/task320-qa-i18n-fixes.mjs"
git --no-optional-locks grep -n "lucide-react" -- src/components/admin/AdminSupportView.tsx src/components/admin/TicketDetailDialogView.tsx src/components/admin/CreateTicketDialogView.tsx src/components/admin/UserPickerFieldView.tsx
git --no-optional-locks status --porcelain
```

Save each output as `$ev\r1-<nn>-<name>.txt` with `EXIT_CODE=` appended, UTF-8 without BOM.

Expected:
- `win32`; frozen hashes equal at start and end.
- 16+ tests pass, including T9.
- Census FAIL lines = the 5 calibration lines.
- Every `npm.cmd` command exits 0 (`build` is the hard gate).
- The first grep prints only `RETIRED-859-…` lines, and the `lucide-react` grep prints nothing.

Plant **P5**:
- Use Node I/O, with a hash before and after.
- Make the detail footer primary ignore `newStatus === ticket.status`. T9 must fail.
- Restore, confirm the equal hash, and re-run: pass.

### 16.6 Receipts and owner matrix (Revision 1)

For the 2 dialog Stories (9 exports) and `AdminSupportView`/`UserPickerFieldView` (icons changed):
- GR-3b and GR-3c at 320/390/1024/1440 (type at 320/390/768/1440);
- GR-3d (dialogs `n/a: overlay-only`; `AdminSupportView` `n/a: own gutter (AdminPageFrame)`; picker `StoryPageGutter
  all`);
- GR-3e for every dialog export: 0 text buttons expected; nav rows have their own line by construction;
- GR-3f for the 4 `Radio.Card` indicators: a DPR-1 10× crop, unchecked and checked;
- GR-3g for the `Radio.Card` borders and the `MantineNavRowList` focus line inside the bottom sheet / modal: DPR-1
  corner crops, first and last row, focus via Tab;
- GR-0 and GR-3a receipts for R13–R15.

`OWNER VISUAL QA REQUIRED — O78-13`: the §13.3 matrix stands. The two dialog rows now show R13/R14. Add one row,
`Patterns/Mantine/AdminSupportView` `Default` · `sq` · **1440**: the page cap is now 64rem (§16.2 ruling 1), and
the owner confirms or returns it.

### 16.7 Reference research (GR-7), Revision 1

Audit run in this session on 2026-10-04 (Playwright 1.60.0, `win32`). Scripts, logs and screenshots are in
`docs/sessions/evidence/task859/research/` (`gr7-support-modals.mjs`, `gr7-log.json`).

**Route inventory** (crawled the same day for Task 794: `docs/sessions/evidence/task794/research/inventory-*.json`):

| Reference | Unique routes | Inspected | Blocked |
|---|---|---|---|
| TailAdmin | 87 (167 visits) | 167 | 0 |
| Lahomes | 107 | 107 | 0 |
| Kamr (demo login) | 61 (62 visits) | 62 | 0 |

The routes for this artifact: TailAdmin `/support-tickets`, `/support-ticket-reply`, `/modals`; Lahomes
`ui-modal.html` (no support page in the inventory); Kamr `/ui-modal` (no support page in the inventory).

**Page-level evidence:**

| Ref | URL | Operated / observed | Evidence | Supports |
|---|---|---|---|---|
| TailAdmin | `/support-tickets` | 3 stat cards with icon tiles (total / pending / solved); toolbar with an All/Solved/Pending segmented control, search and Filter; columns Ticket ID, Requested By, Subject, Create Date, Status, Action ("…"); status pills 12px (Solved green `rgb(2,122,72)` on `rgb(236,253,243)`, Pending orange on `rgb(255,250,235)`). The tabs were clicked; the demo's 10 rows did not change (static demo). A row click opens nothing. No horizontal overflow at 390. | `ta-support-tickets-1440.png`, `-390.png`, `ta-support-tickets-after-tabs.png`, `gr7-log.json` | the list View's stat cards, segmented filter and status badges, already shipped |
| TailAdmin | `/support-ticket-reply` | Ticket detail: "Ticket Details" is a label-left / value-right list (Customer, Email, Ticket ID, Category, Created, Status pill); the status choice is a radio group (In-Progress / Solved / On-Hold) beside the Reply action; a message timeline. | `ta-ticket-reply-1440-full.png`, `ta-ticket-reply-390-full.png` | R13: facts as `MantineDetailList`; the status as a radio choice; the action as the primary |
| TailAdmin | `/modals` | 4 triggers. The dialog has a title, a round gray close (44px), body, and footer Close (white, 1px border, secondary) + Save Changes (filled, primary) at the right. At 390 the pair is equal width (146 / 144). Esc did not close it. | `ta-modals-1440-0.png`…`-3.png`, `ta-modals-390-0.png`, `-1.png` | §23.7 footer pair (already the canon) |
| Lahomes | `ui-modal.html` | 24 triggers. The static-backdrop modal: title, divider, body, divider, footer Close + Understood (primary) at the right. Esc does not close a static backdrop. | `lahomes-modals-1440-1.png` | same anatomy |
| Kamr | `/ui-modal` | 8 triggers. The basic modal: title + close, divider, body, divider, footer Close (light) + Save changes (primary) at the right. | `kamr-modals-1440-1.png` | same anatomy |

`absent or unverified`: none of the references has a support or complaint **create** dialog, or an async user picker.
R14 follows §23.7 with today's fields; the picker keeps its owner-accepted composition. The Lahomes/Kamr anatomy
probes in `gr7-log.json` measured the wrong node (a theme panel / the page body). Their screenshots are the evidence
used; the probe numbers are not.

**lero.al data map:**
- *Entity.* `support_tickets` (subject, status ∈ open/in_progress/resolved/closed, ticket_type, complaint_type, reason,
  assigned_to, reporter, reported, created_by_admin) and `support_ticket_events`.
- *Actions.* `updateTicketStatus(id, status, note)`. It returns `{}` without writing when the status is unchanged
  (`src/modules/admin/actions/index.ts:858`). That is why R13 keeps the choose-then-confirm flow, and why
  `StatusChangeSelect`'s note-only resubmit, which would silently drop the note, is **not** reused. Also
  `createSupportTicket` and `searchUsersForPicker`.
- *Route.* `/admin/support` (admin only). The user profile route `/admin/users/[id]` exists, which is the NavRow
  target.
- *Gaps.* TailAdmin's Reply/Attach, the On-Hold status and the ticket prev/next have no lero.al capability. **Not
  adopted.**

`GR-7 REFERENCE RESEARCH — artifact: support ticket detail + create dialogs, list icons; references: TailAdmin, Lahomes, Kamr (no owner link for this task); route inventory: TailAdmin 87/167/0, Lahomes 107/107/0, Kamr 61/62/0; inspected live: TailAdmin support-tickets, support-ticket-reply, modals; Lahomes ui-modal; Kamr ui-modal; workflow states operated: status tabs, row click, ticket detail at 1440/390, modal open/Esc/close at 1440/390; chosen pattern: §23.7 anatomy + TailAdmin ticket-reply (facts list, radio status choice, primary action); absent or unverified: create-ticket dialog and async picker in any reference; Lahomes/Kamr probe numbers (screenshots used instead); lero.al data map: /admin/support × support_tickets/events, updateTicketStatus (no-op on unchanged status), createSupportTicket, searchUsersForPicker, /admin/users/[id]; owner decisions: §23.6/§23.7/§26 (2026-10-02); evidence: docs/sessions/evidence/task859/research/.`

### 16.8 Completion (Revision 1)

Append "Revision 1" to `docs/sessions/2026-10-04-task859-admin-support-mantine.md` with:
- R13–R18 status;
- every `r1-*` command and its exit code;
- the frozen-hash pairs;
- the P5 transcripts;
- the receipts in §16.6.

Update the 859 cell of `docs/backlog.md`. End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. No Git.

### 16.9 Owner return, 2026-10-04: the page and the table follow the canonical admin list (amends Revision 1)

**Owner, verbatim:**
- *"звісно я не приймаю таку сторінку. Таблиця має бути шириною як і всі інші сторінки та таблиці у адмінці. Таблиця має
  мати канонічний вигляд як і інші таблиці."*
- Then: *"я взагалі бачу що в адмінці дуже багато неканонічних сторінок, компонентів, елементів, які ще необхідно
  переробити на Minetine, але це будемо робити правильно, крок за кроком!"*

**RETRACTION, §16.2 ruling 1.**
- *Invalid claim:* "`<AdminPageFrame width="page">` (64rem, as `/admin/reports`) is the correct implementation."
- *Why invalid:* it took the executor's single precedent (`/admin/reports`) as the admin norm, without measuring the
  other list pages.
- *Evidence now:* `AdminPageFrame` widths across `src/app/admin/**/page.tsx` (2026-10-04):
  - `shell` 112rem: `listings`, `users` (the two canonical Mantine list pages);
  - `page` 64rem: `reports`, `currency`, `inquiries/sales`, `inquiries/support`, `support`;
  - `narrow` 56rem: `pages`;
  - no frame: six legacy managers (916's).
- *Corrected status:* FACT. The canonical admin list page is the `listings`/`users` shape. §16.2 ruling 1 and the
  §16.6 extra matrix row are void.

**The canonical admin list anatomy (FACT):**
- `AdminListingsView.tsx:193-305` and `AdminUsersTable.tsx:414-535`, with the same `Tabs` idiom in
  `AdminReportsView.tsx:78-100`.
- Order: `AdminPageHeader` (create action in its `action` slot, `users/page.tsx:87-101`), then `Tabs` in a
  `ScrollArea` (the primary segmentation), then the filter row.
- The filter row is a `Flex direction={{ base: 'column', sm: 'row' }}` with a `MantineSelect` for the status, and a
  binary filter as `SegmentedControl size="xs"` from `sm` and `MantineSelect` below (`AdminListingsView.tsx:203-240`).
- Then `AdminTable` with stacked badges.
- No `Checkbox.Group` and no free-floating button row.

| ID | Requirement | P | AC |
|---|---|---|---|
| R19 | `page.tsx` uses `<AdminPageFrame width="shell">`, the same width and gutter props as `listings/page.tsx:116`. `theme.ts` gains no key. The `AdminSupportView` Story's `AdminPageFrame` uses the same props. | P1 | AC14 |
| R20 | `AdminSupportView` follows the anatomy above. **(a) Header:** `AdminSupportView` renders `AdminPageHeader` (title `admin.pages.support_title`, subtitle `support_subtitle`), with the `new_ticket_btn` `Button` (Solar `broken` plus icon) in `action`; `page.tsx` stops rendering the header. **(b) Stats:** the 3 `MantineDashboardStatCard`s stay under the header (TailAdmin `/support-tickets` shows the same 3 ticket stats, §16.7). **(c) Tabs:** the type filter is `Tabs` in a `ScrollArea` (`filter_all`, `type_support`, `type_user_complaint`), not a `SegmentedControl`. **(d) Filter row:** `Flex` as `AdminListingsView.tsx:203`. Status is one `MantineSelect` with 6 options: all (`filter_all`), **active** (open + in progress, new key `filter_active`), and the 4 statuses. Assignment is `SegmentedControl size="xs"` from `sm` and `MantineSelect` below, with the same breakpoint mechanism as `AdminListingsView.tsx:221-240` (`filter_all`, `filter_unassigned`). **(e)** The `Checkbox.Group` and the toolbar `Flex` of §R6 are deleted. | P1 | AC15 |
| R21 | `supportFilters.ts` (unfrozen for this): `parseSupportFilters` normalises `status` to a preset. `open,in_progress` in any order is `active`. One known status is that status. Anything else, unknown or another combination, is all. The `SupportFilters.status` type becomes the preset (`'all' \| 'active' \| TicketStatus`). `serializeSupportFilters` writes `active` as `open,in_progress`, so T2's ADM-06 round-trip still holds exactly. `matchesSupportFilters` expands the preset. | P1 | AC16 |
| R22 | i18n: `admin.support.filter_active` in 4 locales (en *"Active"*; translated). | P2 | AC12 |

**AC14 [R19]** `page.tsx` and the Story pass `width="shell"` with `listings/page.tsx:116`'s props. `git diff --
src/design-system/mantine/theme.ts` shows nothing from 859. At 1440 the list's content width equals `/admin/listings`'
on the same viewport (both measured in the Storybook `withAdminShell` frame, values recorded).

**AC15 [R20]**
- `AdminSupportView` contains `AdminPageHeader`, `Tabs`, and one status `MantineSelect`.
- It contains no `Checkbox` and no type `SegmentedControl`.
- `page.tsx` no longer imports `AdminPageHeader`.
- T3 now reads: the ADM-06 landing shows the "active" status and "unassigned"; picking the `open` status calls
  `router.replace` with `status=open` and keeps `assigned`.
- A planted reversion (P6: restore `Checkbox.Group`) fails a new assertion **T10**, which checks that the status
  control is a combobox with the 6 options.

**AC16 [R21]**
- T1 adds 3 cases: `status=in_progress,open` gives `active`; `status=resolved,closed` gives all; `status=closed` gives
  `closed`.
- T2 still round-trips `unassignedSupportHref()` exactly.
- P1 still fails T1/T3.

**Owner, verbatim, on scope (2026-10-04):** *"стоп! Яка нахуй нова задача? У цю задачу дописуй ревізію!"* The width
alignment of the other Mantine list pages is therefore part of this revision (R23). No new number is filed.

| ID | Requirement | P | AC |
|---|---|---|---|
| R23 | Every migrated admin **list** page uses one frame: `<AdminPageFrame width="shell">` with the default gutter, exactly `listings/page.tsx:116`. The route and its View Story change together, by one prop each: `reports/page.tsx:39` + `AdminReportsView.stories.tsx:74` (`page` → `shell`); `currency/page.tsx:22` + `AdminCurrenciesView.stories.tsx:51`, `AdminCurrencyTabs.stories.tsx:19`, `AdminExchangeProvidersView.stories.tsx:45` (`page` → `shell`); `inquiries/sales/page.tsx:44`, `inquiries/support/page.tsx:44` + `AdminInquiriesView.stories.tsx:47` and its comment at `:13` (`page` → `shell`); `pages/page.tsx:20` + `AdminPagesView.stories.tsx:98` (`narrow` → `shell`); `users/page.tsx:87` + `AdminUsersTable.stories.tsx:47` (drop `gutter="xl"`). Non-list pages keep their frames: `users/[id]` `page`, `users/new` `form`, `permissions` `panel`. No View, table, token or `AdminPageFrame` source changes. The `narrow` variant keeps no list consumer, so record its remaining consumers (`git grep -n 'width="narrow"'`) in the session log; it is not deleted here. | P1 | AC17 |

**AC17 [R23]**
- `git grep -n "<AdminPageFrame" -- src/app/admin` shows `width="shell"` with no `gutter` on `listings`, `users`,
  `reports`, `currency`, both `inquiries` and `support`; and `page`/`form`/`panel` only on `users/[id]`, `users/new` and
  `permissions`.
- Each changed Story's `AdminPageFrame` equals its route's.
- At 1024 and 1440, in `withAdminShell`, every list Story's frame content width equals `AdminListingsView`'s (values
  recorded).
- One `TABLE FIT CHECK` per changed list Story (§7.3, 768/1024/1440): horizontal scroll none.
- GR-3d `n/a: own gutter (AdminPageFrame)` re-measured: the gutters equal `listings`' (32px from `lg`).

**Write set additions:**
- `src/app/admin/support/page.tsx`, `src/components/admin/supportFilters.ts`,
  `src/components/admin/__tests__/supportFilters.test.ts`, the `AdminSupportView` Story and `messages/*.json`
  (`filter_active`). Their frozen-hash rows in §16.5 are dropped; the other 4 containers stay frozen.
- For R23 only: the seven route files and seven Story files named in R23. One prop each, plus the one Story comment.

Out of scope here: the six legacy managers (still **916**'s) and the toolbars of the other list pages. R23 changes
their width only.

**Owner matrix O78-13:**
- §13.3;
- `Patterns/Mantine/AdminSupportView` `Default` and `UnassignedLanding` × `sq` × 390, 1024 and 1440 (the shell width;
  the canonical toolbar; at 390 the tabs scroll, the filter row stacks and the binary filter becomes a select);
- `Patterns/Mantine/AdminReportsView`, `AdminCurrenciesView`, `AdminExchangeProvidersView`, `AdminInquiriesView`,
  `AdminPagesView` and `AdminUsersTable` `Default` × `sq` × 1440, each beside `AdminListingsView` `Default` × 1440:
  every list now has the same width and gutter.

