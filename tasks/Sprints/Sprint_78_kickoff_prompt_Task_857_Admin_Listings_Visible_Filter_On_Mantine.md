# Task 857 — `/admin/listings` honours `visibility=visible` and moves to canonical Mantine

**Sprint 78** (Wave E — landings) · **P2** · QA profile **Q4** (legacy surface → Mantine on the registered critical flow
"Listing public visibility invariant") · **depends on 893** (hard: `RangeDatePicker` `selectionMode="single"`) · runs
**after 886** (886 edits `AdminPageShell`, which this task deletes) · owner action **O78-12** · **Status: 🔁
`NEEDS REVISION` — owner return on O78-12, 2026-10-02 (§21). Revisions 1–4 are verified (§20). Execute §21
(Revision 5) only: the dialog's text buttons stack one per row (new GR-3e), and the canonical radio becomes a 20px circle
with a 10px dot in its theme entry (new GR-3f).**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md)
("Execution order" item 6: 858, then 857 · 859). Precedents, read-only: **877** (container/View split, `AdminTable`
adapter, page wrapper), **893** (shared legacy files stop being imported; logic extracted to a hook), **896**
(`adminPageShellMaxWidth`).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration + a public-visibility filter. Bundles: **UI / Layout / Component (current Mantine
path)**, **Storybook / Visual Proof**, **Component Catalog / Coverage**, **Regression / Critical Flow Coverage**,
**Admin Table / Admin Control**, **Data access** (one query predicate through the canonical helper).

- **Why the whole surface migrates.** Adding the "visible" filter changes the manager's visible filter state; clause 16d
  then puts every component the route renders in scope.
- **Shared legacy files (tier-2 treatment, 893 precedent).** `AdminInput` (6 other consumers) and `AdminSearchInput`
  (`AdminPropertyTypesManager`) are **not** edited visually; the listings surface stops importing them. `Combobox`
  likewise. `AdminPageShell` has **no other consumer** (§3.3) and is deleted with its legacy Story.

## 2. Objective

1. `/admin/listings?visibility=visible` lists only publicly visible listings through `applyPublicVisibility`; the ADM-08
   card and ADM-11's `visible` segment (`visibleListingsHref()`, `src/modules/admin/dashboard/hrefs.ts:46-49`) land
   filtered, and the filter bar shows the state and can clear it.
2. Tabs, search, status filter, hidden-eligible filter and audit panel, pagination, the preview dialog (status actions,
   links, premium, delete) and the premium dialog behave as today (§3.4), on canonical Mantine.
3. The census shows only the root `page.tsx` and the container-exempt containers.

## 3. Verified context — measured 2026-09-29 (re-measure at I0)

### 3.1 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx`

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition |
|---|---|---|---|---|---|---|
| `src/app/admin/listings/page.tsx` (hash `fd481776…`) | 1 (root) | no | no | 0 | 0 | `visible` predicate (R1), wrapper + header (R8) |
| `src/components/admin/AdminListingsTable.tsx` (759 lines, hash `ec314da0…`) | 1 | no | legacy `Admin/AdminListingsTable` | 93 | 8 | containers + Views (R2–R6) |
| `src/components/admin/AdminPageShell.tsx` (65 lines) | 1 | no | legacy `Admin/AdminPageShell` | 10 | 1 | **deleted** with its Story (R10) |
| `src/components/admin/AdminSearchInput.tsx` (59 lines) | 1 | no | no | 3 | 1 | logic → hook (R7); file stays for `AdminPropertyTypesManager`; import removed here |
| `src/components/admin/AdminInput.tsx` | 1 | no | no | 1 | 1 | import removed (premium date → `RangeDatePicker` single) |
| `src/components/shared/Combobox.tsx` | 1 | no | no | 21 | 0 | import removed (`MantineSelect`) |
| `AdminTable`, `RelativeTime`, `MantineDataTableToCards`, `MantineTooltip`, `responsiveBottomSheet` | 1 | yes | yes | — | 0 | reused |
| `ui/button`, `dialog`, `label`, `badge`, `input` | 2 | — | — | — | — | imports removed |

**Calibration (FACT, `/admin/currency` after 877):** the census prints FAIL for the root `page.tsx` and for every pure
container. Expected after: `page.tsx`, `AdminListingsTable.tsx`, `ListingPreviewDialog.tsx`, `PremiumDialog.tsx` (all
containers `className:0 ui-imports:0`).

### 3.2 The filter today — `page.tsx`, read in full

`visibility` and `reason` are read (`:23-24`); only `visibility === 'hidden_eligible'` changes the query
(`applyPublicEligibleButHidden`, `:87-89`); an unknown value such as `visible` is silently ignored. The audit panel runs
three head counts (`:92-110`). The manager renders a single toggle button for `hidden_eligible`
(`AdminListingsTable.tsx:596-610`) and the audit links (`:661-703`). FACT.

`applyPublicVisibility` (`src/modules/listings/lib/visibility.ts:99`) is the canonical predicate (`status='active'` and a
future or null `expires_at`), consumed by every public list read (registry "Listing public visibility invariant",
`docs/critical-flow-registry.md:70`). FACT.

### 3.3 Consumers of the shared files (FACT, grep of imports over `src`, stories excluded)

| File | Other consumers | Consequence |
|---|---|---|
| `AdminPageShell.tsx` | none | deleted (R10) |
| `AdminSearchInput.tsx` | `AdminPropertyTypesManager.tsx:11` | stays; its logic moves to a hook it consumes (R7), JSX byte-identical |
| `AdminInput.tsx` | `AdminLegalManager`, `AdminLocationsManager`, `AdminPagesManager`, `AdminSettings`, `AdminUserCreate` | untouched |
| `Combobox.tsx` | 9 other files | untouched |

### 3.4 Current behaviour to preserve — `AdminListingsTable.tsx`

| Area | Today | Line |
|---|---|---|
| URL navigation | `navigate(updates)` merges into the current params and `router.push`es; the visibility helper resets `page` | `:461-473` |
| Tabs | `all` / `premium` (premium → `tab=premium`, resets `page` and `status`) | `:566-579` |
| Search | `AdminSearchInput`: controlled, 300 ms debounce, writes `q`, drops `page`, resyncs from the URL only when no debounce is pending | `AdminSearchInput.tsx:18-45` |
| Status filter | select of `''` + 7 statuses (`cabinet.filter_ALL`, `getListingStatusLabel`) → `status`, resets `page` | `:454-457`, `:588-595` |
| Hidden-eligible toggle | on → `visibility=hidden_eligible`; again → cleared | `:596-610` |
| Audit panel | total 0 → `audit_hidden_zero`; else links total / expired / no-expiry → `visibility=hidden_eligible[&reason=…]`; the active one highlighted | `:661-703` |
| Columns | ID copy (from `xl`, `#public_id` or 8 chars, copied check 1.5 s); listing title button (premium star) opens preview; type · property type (from `md`); price; status badge; visibility badge (`formatVisibility`: visible, or the hidden reason label); agent (from `lg`); date (from `xl`); sticky column = listing | `:475-561`, `:709` |
| Cards (< 640) | title with star; price + status + visibility badges; type · property · agent; chevron | `:713-742` |
| Archived rows | `grayscale opacity-70` via `rowClassName` | `:710` |
| Pagination | prev / `page / total` / next when more than one page | `:745-755` |
| Preview dialog | title (star when premium); status, visibility, type, price, agent, date; status actions from `getStatusActionsForStatus` (engine labels, `btn_set_status {status}` fallback, spinner on the clicked one, all disabled while changing); inline delete confirm replaces the actions; footer links View (`/admin/listings/<id>/preview`), Open public (hidden when `isListingHidden`), Edit (new tab), Premium set/change, Delete | `:242-429` |
| Premium dialog | 4 presets (1/3/6/12 months → `until = now + days`), custom date (today or later) + OK, remove when premium; error keys `premium_error_<e>` (`db_missing_column` → `premium_error_db_schema`); success toasts; `onDone` → `router.refresh()` | `:116-238`, `:618-627` |
| Results | delete → `delete_success`, row removed, refresh; status change → `status_update_success`/`_error`, row + dialog patched, refresh | `:269-287`, `:638-651` |
| Root | `data-testid="admin-listings-table"` | `:616` |

### 3.5 Tests and registrations that name the current files (FACT)

- `src/modules/listings/lib/__tests__/visibility.test.ts:359-403` reads `AdminListingsTable.tsx` **by path** and asserts it
  imports and calls `formatVisibility` and holds no inline predicate (Task 456, critical-flow proof).
- `scripts/check-stories-rendered.mjs:161` — `admin-adminlistingstable--default`, anchor `admin-listings-table`.
- Legacy Stories: `src/components/admin/AdminListingsTable.stories.tsx` (`Admin/AdminListingsTable`: `Default`,
  `FilteredPending`, `LocaleStress`, `Visibility`, `VisibilityAuditZero`, `PreviewDialogSoldStatusActions`) and
  `src/components/admin/AdminPageShell.stories.tsx` (`Admin/AdminPageShell`).
- `scripts/check-listing-visibility.mjs` scans `page.tsx` (a new inline literal there would fail it).

### 3.6 Canonical sources inspected (FACT)

| Need | Candidate | Fit |
|---|---|---|
| Tabs, search, segmented filter, pagination on an admin list | `AdminUsersTable.tsx` (Mantine `Tabs`, `TextInput`, `SegmentedControl` in `ScrollArea`, pagination) | the sibling precedent to follow |
| List / cards | `AdminTable` adapter (`onRowClick`, `visibility`, `cardRow`, `stickyColumnIndex`) | reuse |
| Status colour | `LISTING_STATUS_COLOR` (`src/modules/listings/lib/listingStatusTone.ts`, Task 844) | reuse |
| ID copy | `MantineCopyIdButton` (`id`, `label`, `copyLabel`, `copiedLabel`), Story `Mantine/Primitives/CopyIdButton`; call site to copy labels from: `ListingCard.tsx:190-200` | reuse |
| Status select | `MantineSelect` | reuse |
| Dialogs | `MantineModal` | reuse |
| Premium date | `RangeDatePicker selectionMode="single"` (893 R2) with `minDate` / `disablePastDates` (props exist, `RangeDatePicker.tsx:57-74`) | reuse |
| Pagination | `MantinePagination` (Story `Mantine/Primitives/Pagination`) | reuse |
| Header + width | `AdminPageHeader`; `adminPageShellMaxWidth` (896 R5; `.container-admin` caps at 112rem) | reuse / extend-if-absent |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | reserved row; §3.2 | `page.tsx`: `visibility === 'visible'` → `query = applyPublicVisibility(query)` (import from `@/modules/listings/lib/visibility`); `hidden_eligible` unchanged; any other value ignored. No inline status/expiry literal is added (the gate scans this file). | P0 | T1, AC7 | Confirmed |
| **R2** | component-rules P0 | `AdminListingsTable` (container) keeps its `Props`, `items`/dialog state, `navigate`, `navigateVisibility`, `STATUS_LABEL`, the resync effect and every `onDeleted`/`onPremium`/`onStatusChanged` handler; renders only `AdminListingsView`, and when open `ListingPreviewDialog` / `PremiumDialog`. 0 `className`, 0 `ui/*`. | P1 | AC1 | Confirmed |
| **R3** | component-rules P0 | `src/components/admin/ListingPreviewDialog.tsx` and `PremiumDialog.tsx` (containers, extracted from `:242-287` and `:116-169`): state, server-action calls and toasts unchanged; each renders only its View. | P1 | T4–T7 | Confirmed |
| **R4** | §3.4; GR-0 | `src/components/admin/AdminListingsView.tsx` (presentational; `useTranslations`, `useLocale`, `usePropertyTypes` read-only). Root `Stack gap="md"` `data-testid="admin-listings-table"`. Filter bar, in order: `Tabs` all/premium (as `AdminUsersTable`); a `Group` (`wrap`, stacked below 640) with a search `TextInput` (`leftSection` `Search`, `iconSize.standard`, value/onChange from the R7 hook), `MantineSelect` status (`cabinet.filter_ALL` + 7 labels), and a `SegmentedControl` visibility in a horizontal `ScrollArea` with data `''` → `cabinet.filter_ALL`, `'visible'` → `visibility_visible`, `'hidden_eligible'` → `visibility_filter_hidden_eligible`, `aria-label` `visibility_label`. Audit panel: `Paper withBorder radius="lg" p="sm"`; zero → `Text size="sm" c="dimmed"` `audit_hidden_zero`; else three `UnstyledButton`s (`mih={{ base: theme.other.touchTarget, sm: 'auto' }}` — `touchTarget: '2.75rem'` is defined at `theme.ts:694`; `c="brand"` when active, `fw={500}`) separated by a `·` from `sm`. List through `AdminTable` with §3.4's columns: ID = `MantineCopyIdButton`; title = `UnstyledButton` with the premium `Star` (`c="var(--badge-premium)"` — defined at `src/app/globals.css:483` and `:592`, the token `MantineListingCardPattern.module.css:58` already consumes) and `Text lineClamp={1}`; status `Badge variant="light" color={LISTING_STATUS_COLOR[s]}`; visibility `Badge variant="light"` `green` or `red` with the `formatVisibility` label; `cardRow` per §3.4. Pagination: `MantinePagination` (`total=totalPages`, `value=page`, `onChange` → `navigate({ page })`), rendered only when `totalPages > 1`. **Archived rows are no longer dimmed** (the legacy `grayscale opacity-70` has no token; the gray status badge carries the state — §9, owner matrix). | P1 | AC2 | Confirmed |
| **R5** | §3.4 | `src/components/admin/ListingPreviewDialogView.tsx`: `MantineModal` (title `Group` with the premium star and `Text lineClamp={2}`), a `SimpleGrid cols={2}` of label/value pairs, the status-action `Group` (`Button variant="outline" size="xs"`, colour per the engine action: approve/publish/restore/renew `green`, reject/expire `yellow`, mark sold `blueLight`, mark rented `purple`, archive and the fallback `gray`; `loading` on the clicked one), the inline delete confirm (`Stack` replacing the actions), and the footer `Group` (full-width buttons below 640): `Button component={Link}` View, Open public (hidden when hidden), Edit (`target="_blank"`), Premium (`variant="outline"`, `c="var(--badge-premium)"`, `leftSection` `Star`), Delete (`variant="outline" color="red"`). | P1 | AC2 | Confirmed |
| **R6** | §3.4 | `src/components/admin/PremiumDialogView.tsx`: `MantineModal` (title `premium_dialog_title`, description = listing title `lineClamp={2}`); `premium_quick_label` + `SimpleGrid cols={2}` of four `Button variant="outline"` (`c="var(--badge-premium)"`); `premium_custom_date` + `RangeDatePicker selectionMode="single" disablePastDates` + OK `Button` (`loading`, disabled without a date); remove `Button variant="subtle" color="red"` when premium. The container converts the picked `YYYY-MM-DD` to the same ISO `until` as today. | P1 | T6 | Confirmed |
| **R7** | §3.3; 893 R3a precedent | `src/components/admin/useAdminSearchQuery.ts` (new): the state, debounce, URL write and resync of `AdminSearchInput.tsx:18-45` move into a hook returning `{ value, onChange }`; `AdminSearchInput.tsx` consumes it with its JSX byte-identical; the listings container passes the hook's pair to the View. | P1 | AC3, T3 | Confirmed |
| **R8** | 877/896 precedent | `page.tsx` returns `<Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageShellMaxWidth} mx="auto">` with `<AdminPageHeader title={t('listings_title')} subtitle={t('listings_total', { count: total })} />` and the manager (`pageTitle` prop dropped or ignored). If `adminPageShellMaxWidth` is absent (896 not landed), add it exactly as 896 R5 defines it. | P2 | AC4 | Confirmed |
| **R9** | GR-3, GR-3a, GR-3d, 16c | Stories under `src/stories/patterns/mantine/`, `skipCanvas: true`, page exports in `StoryPageGutter`: `Patterns/Mantine/AdminListingsView` — `Default`, `PremiumTab`, `FilteredPending`, `VisibleFilter`, `HiddenEligible` (audit counts, `reason=expired` active), `AuditZero`, `Empty`, `Paginated`; `Patterns/Mantine/ListingPreviewDialogView` — `Active`, `SoldStatusActions`, `Hidden` (no public link), `DeleteConfirm`, `ChangingStatus`; `Patterns/Mantine/PremiumDialogView` — `NotPremium`, `Premium`, `Saving`. Fixtures from the legacy Story; Views enrolled. The two legacy Stories are deleted. | P1 | AC5 | Confirmed |
| **R10** | clause 9 | Delete `AdminPageShell.tsx` and `AdminPageShell.stories.tsx`; `check-stories-rendered.mjs:161` → `patterns-mantine-adminlistingsview--default` (same anchor); any `admin-adminpageshell` entry removed; `scripts/story-realmode-allowlist.json:13` (`AdminListingsTable.stories.tsx` / `FilteredPending`) and `scripts/responsive-screenshots.mjs:126` (`admin-adminlistingstable--preview-dialog-sold-status-actions`) retargeted to the new Story ids (`FilteredPending`, `patterns-mantine-listingpreviewdialogview--sold-status-actions`) or removed with the reason in the session log; `visibility.test.ts:359-403` reads the file that now calls `formatVisibility` (`AdminListingsView.tsx`; if the container also calls it, both) and keeps its three assertions. **The reference grep is redefined by §16.4** (history paths named; the remaining live references are Opus's at approval closure, owner decision 2026-10-02). | P1 | AC6 | Confirmed |
| **R11** | Q4; clause 15 | `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx` (new; harness as `AdminUsersTable.smoke.test.tsx`, `next/navigation`, `@/modules/admin/actions`, `@/lib/toast` mocked): **T1** a `page.tsx` query-builder unit (export a pure `applyAdminListingsVisibility(query, visibility, reason)` from a new `src/app/admin/listings/visibilityFilter.ts` and call it from `page.tsx`) — `'visible'` calls `applyPublicVisibility`'s `eq('status','active')` + expiry chain on a capture mock, `'hidden_eligible'` the other helper, `'bogus'` nothing; **T2** choosing `visible` in the segmented control pushes `visibility=visible&page=1` and keeps `q`; **T3** typing in search pushes `q` after the debounce (fake timers) and drops `page`; **T4** a status action calls `updateListingStatus(id, to)` and patches the row's badge; **T5** delete confirm → `deleteListing(id)`, row removed; cancel → no call; **T6** premium preset "1 month" calls `setListingPremium(id, true, <ISO ≈ now+30d>)`; `db_missing_column` → `premium_error_db_schema` toast; **T7** Open public is absent for a hidden listing. | P0 | AC7 | Confirmed |
| **R12** | GR-1 | FAIL lines after = §3.1 calibration; the three Views `manifest:yes story:yes`; no `AdminPageShell`, `AdminSearchInput`, `AdminInput`, `Combobox` or `ui/*` node; baseline regenerated; removed keys only from this surface; **the only keys added are the two new containers `ListingPreviewDialog.tsx` / `PremiumDialog.tsx` (the §3.1 calibration lines; corrected by review 1 — "no key added" contradicted §3.1).** | P0 | AC8 | Confirmed |

## 5. Assumptions and open questions

1. **893 is a precondition** (`RangeDatePicker` single mode). Otherwise `PREMISE DRIFT — 893`.
2. **886 before 857.** If 886 has not landed, `AdminPageShell` is still deleted here; 886's own kickoff then loses that
   row — report it as `CROSS-TASK NOTE — 886` in the session log.
3. Visual changes (O78-12): archived rows not dimmed; page title 20→24px responsive (was a static 24px `h1`); the
   hidden-eligible toggle becomes one segment of a three-way control; dialogs on `MantineModal`; the native date input
   becomes the canonical picker (Apply/Confirm).
4. Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` 1, 3–7, 9–16d · `docs/rule-index.md` → the §1 bundles ·
`docs/data-access-rules.md` · `docs/critical-flow-registry.md:70` · `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` §6b · `docs/component-rules.md` · `docs/qa-profiles.md` Q4 · the executed 877 and 893
kickoffs and the 896 kickoff, read-only · `docs/orchestrator-procedures.md` → 818/819 corollary.

## 7. Scope — the exact allowed write set

1. `src/app/admin/listings/page.tsx`; new `src/app/admin/listings/visibilityFilter.ts`
2. `src/components/admin/AdminListingsTable.tsx`; new `ListingPreviewDialog.tsx`, `PremiumDialog.tsx`, `AdminListingsView.tsx`,
   `ListingPreviewDialogView.tsx`, `PremiumDialogView.tsx`, `useAdminSearchQuery.ts` (all `src/components/admin/`)
3. `src/components/admin/AdminSearchInput.tsx` (R7 only: logic out, JSX byte-identical)
4. deleted `src/components/admin/AdminPageShell.tsx`, `AdminPageShell.stories.tsx`, `AdminListingsTable.stories.tsx`
5. new Stories `src/stories/patterns/mantine/AdminListingsView.stories.tsx`, `ListingPreviewDialogView.stories.tsx`, `PremiumDialogView.stories.tsx`
6. new `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`; `src/modules/listings/lib/__tests__/visibility.test.ts` (path constant only)
7. `src/design-system/mantine/theme.ts` — only if R8's token is absent
8. `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `scripts/check-stories-rendered.mjs`,
   `scripts/story-realmode-allowlist.json`, `scripts/responsive-screenshots.mjs`, and `scripts/story-coverage-exempt.json` /
   `scripts/i18n-dynamic-manifest.json` if they name the moved files; catalog files if required
9. `docs/critical-flow-registry.md` row `:70` — append *"Task 857: `/admin/listings?visibility=visible` through `applyPublicVisibility` (T1); the Task 456 static proof now reads `AdminListingsView.tsx`."*
10. `docs/sessions/<date>-task857-admin-listings-mantine.md`, `docs/sessions/evidence/task857/*`; `docs/backlog.md` 857 cell

## 8. Out of scope

- `src/modules/admin/actions/**`, the transition engine, `visibility.ts`, the database.
- `AdminInput`, `Combobox`, `AdminPropertyTypesManager` (still renders `AdminSearchInput`).
- `/admin/listings/[id]/preview` (a separate route).

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| `visibility=visible` | ignored | public-visible only; segment selected |
| All other filters, dialogs, actions, toasts, pagination | §3.4 | **unchanged** (T2–T7) |
| Archived rows | dimmed | not dimmed; gray badge (**changed**) |
| Title | static 24px | 20px below 640, 24px from 640 (**changed**, GR-3c) |
| Premium custom date | native date input | canonical single-date picker (**changed**) |
| Shell | `AdminPageShell` (`container-admin`) | Mantine `Box` + `AdminPageHeader` |

## 10. Implementation requirements

### 10.1 I0

1. `win32` platform line; status + hashes → `docs/sessions/evidence/task857/01-*`; a §7 path modified → `BLOCKED — SHARED PATH`.
2. **893 gate:** `selectionMode` in `RangeDatePicker.tsx` and 893 archived; quote both. Else `PREMISE DRIFT — 893`.
3. Census → `02`; re-run §3.3's import grep → `03`. A new `AdminPageShell` consumer stops R10 (`PREMISE DRIFT`).
4. Baselines → `04`: `npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts` and `npm.cmd run check:listing-visibility`.
5. GR-0 and GR-3a receipts (§15.1).

### 10.2 Order

I0 → R7 hook → R4–R6 Views → R9 Stories → R2–R3 containers → R1 + `visibilityFilter.ts` → R8 → R11 → plants → R10 → R12
→ gates → receipts.

### 10.3 Plants (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | `visibilityFilter.ts` maps `'visible'` to nothing | T1 |
| ~~**P2**~~ | **Superseded by §16.5 (P2a–P2c, review 1).** As written it could not fail: the gate's own scope line says it cannot see a builder passed as an argument. | — |
| **P3** | the segmented control's `onChange` omits `page: '1'` | T2 |
| **P4** | `ListingPreviewDialogView` shows Open public for hidden listings | T7 |
| **P5** | re-add `import { Badge } from '@/components/ui/badge'` in `AdminListingsView` | census exits 1 naming `ui/badge` |

## 11. Positive and negative flows

**Positive flow.** An admin clicks ADM-08 "visible listings" on `/admin`, lands on `/admin/listings?visibility=visible`,
sees only public listings with the "visible" segment selected, searches a title, opens one and marks it sold; the
listing leaves the filtered list after refresh.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Unknown `visibility` | Yes | ignored | T1 |
| `hidden_eligible` + `reason` | Yes | unchanged | T1, `HiddenEligible` Story |
| Status update error | Yes | `status_update_error` toast | code unchanged (R3) |
| Premium errors | Yes | mapped toasts | T6 |
| Delete cancel | Yes | no call | T5 |
| Empty result | Yes | `empty` | `Empty` Story |
| Mobile < 640 | Yes | cards, stacked filters, bottom sheets, ≥ 44px targets | GR-3b receipts |

## 12. Acceptance criteria

- **AC1 [R2, R3]** Given the three containers, then each renders only its View, with 0 `className`/`ui/*`, and the
  handlers of §3.4 are unchanged in the diff.
- **AC2 [R4–R6]** Given the three Views, then none contains `className`, a `ui/*` import or a raw colour/px/rem literal;
  `check:design-tokens` and `check:enrolled-tailwind` exit 0.
- **AC3 [R7]** Given `git diff src/components/admin/AdminSearchInput.tsx`, then its `return (…)` JSX is unchanged and the
  logic lives in the hook.
- **AC4 [R8]** Given `page.tsx`, then the wrapper and header are Mantine/`AdminPageHeader`; the token line is quoted.
- **AC5 [R9]** Given the three Story files, then each imports its View, carries R9's exports without a written gutter or
  viewport pin, and `check:story-coverage` exits 0 with the three Views enrolled.
- **AC6 [R10]** Given the tree, then the three deleted files are gone, `visibility.test.ts` passes with its new path, and
  the reference grep is as §16.4 defines it.
- **AC7 [R1, R11]** Given T1–T7 and P1–P4, then all tests pass on the final tree and each plant fails as stated and passes
  after restore with equal hashes; `check:listing-visibility` exits as in `04` (0, or only 887's pre-existing line).
  **Amended by §16.5 (review 1): P2 is replaced by P2a–P2c, and AC10/AC11 are added.**
- **AC8 [R12]** Given `11-census-after.txt`, then the FAIL lines are exactly the four calibration lines.
- **AC9 [all]** `npm.cmd run build` exits 0; `typecheck`, `lint`, `check:story-coverage`, `check:rendered-scope`,
  `check:surface-census:changed`, `check:i18n`, `check:i18n-dynamic`, `check:file-integrity`, `check:mojibake`,
  `build-storybook` exit 0.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: AC3's unchanged JSX (declared R7 deliverable) and AC6's empty grep over live paths (deletion audit, --untracked).`

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| `listings_title` | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` | 877 adapter |
| Tabs, filters, cells | body | 14px | 14px | 14px | 14px | `sm` | legacy `text-sm` |
| Badges, ID, meta | small | 12px | 12px | 12px | 12px | `xs` / `Badge size="sm"` | legacy `text-xs` |
| Dialog titles | dialog title | — | — | — | — | `MantineModal` | 868 precedent |

### 12.2 Width contract (GR-3b) and gutter (GR-3d)

Parent: the R8 `Box` (cap, fluid). Stories fluid. GR-3d: `Patterns/Mantine/AdminListingsView` — **wrap in this task**;
`ListingPreviewDialogView`, `PremiumDialogView` — **n/a: overlay-only**; `Patterns/Mantine/AdminPageHeader`,
`Patterns/Mantine/AdminTable` (blast radius) — **profile present**.

## 13. QA profile and verification plan

**Q4** — critical flow "Listing public visibility invariant" gains a predicate path and its Task 456 static proof moves.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\11-census-after.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/modules/listings/lib/__tests__/visibility.test.ts *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\10b-listing-visibility.txt"
npm.cmd run check:listing-visibility:verify *>&1 | Tee-Object "$ev\10c-listing-visibility-verify.txt"
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
git --no-optional-locks grep --untracked -n -E "AdminPageShell|admin-adminlistingstable|admin-adminpageshell" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!tasks/Sprints/**" ":!docs/backlog-archive.md" | Tee-Object "$ev\20b-reference-audit.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record each exit code; normalise `Tee-Object` files to UTF-8 without BOM through Node; hashes → `22-hash-object.txt`.
Expected: `win32`; four calibration FAIL lines; `10b` as `04`; all other exits 0; `20b` empty.

### 13.2 Receipts (executor)

GR-3b / GR-3c / GR-3d for every export at 320/390/1024/1440 (type 768/1440): widths, overflow, title/cell/badge font
sizes; edge gap 16/16/32/32 for `AdminListingsView`.

### 13.3 `OWNER VISUAL QA REQUIRED` — O78-12

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminListingsView` | `Default`, `VisibleFilter`, `HiddenEligible`, `Paginated` | `sq`, `uk` | 390, 1440 | 16 |
| `Patterns/Mantine/ListingPreviewDialogView` | `Active`, `SoldStatusActions`, `DeleteConfirm` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/PremiumDialogView` | `NotPremium`, `Premium` | `sq` | 390, 1440 | 4 |
| `Patterns/Mantine/AdminListingsView` `Default` | — | `en`, `it` | 1024 | 2 |

34 tuples. After the deploy: click ADM-08 on `/admin` and confirm the visible segment and a list of public listings.

## 14. Completion report contract

Status per `execute-task`. Files with hashes; R1–R12/AC1–AC9 with evidence; exit codes; the 893 gate quotes; census
before/after; GR-0, GR-1, GR-2 (for `check:listing-visibility`), GR-3 per View, GR-3a, GR-3b, GR-3c, GR-3d receipts;
plants with hash pairs; any 886 cross-task note; limitations; O78-12 owed. Update the 857 cell of `docs/backlog.md`;
session log. No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R2/R3→AC1 · R4–R6→AC2 · R7→AC3 · R8→AC4 · R9→AC5 · R10→AC6 · R1/R11→AC7 · R12→AC8 · all→AC9 |
| Critical-flow proof | T1 + P1/P2 on the gate; Task 456 static proof kept (R10) |
| Path-reading test hazard | named (§3.5, R10) |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Tabs / search / segmented filter / pagination | `AdminUsersTable`, `Tabs`, `SegmentedControl`, `TextInput`, `MantinePagination` | their `Mantine/Primitives/*` Stories | **reuse** | — |
| List / cards | `AdminTable` | `Patterns/Mantine/AdminTable` | **reuse** | — |
| Status / visibility badges | `LISTING_STATUS_COLOR`, `Badge` | `Mantine/Primitives/Badge` | **reuse** | — |
| ID copy | `MantineCopyIdButton` | `Mantine/Primitives/CopyIdButton` | **reuse** | — |
| Dialogs | `MantineModal` | `Mantine/Primitives/Modal` | **reuse** | — |
| Premium date | `RangeDatePicker` single (893) | `Mantine/Primitives/RangeDatePicker` | **reuse** | — |
| Page chrome | `AdminPageHeader`, `adminPageShellMaxWidth` | 877 / 896 | **reuse** (extend if absent) | — |
| The screens | — | three new Views | **compose** | own Stories, manifest |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/listings (list View, preview dialog View, premium dialog View, search hook, page wrapper, visible filter); semantic queries: admin list tabs, debounced url search, status select, segmented visibility filter, data table to cards, copy id, status badge colour, modal, single date picker, pagination, admin page header, admin page width; inspected candidates: AdminUsersTable, Tabs, SegmentedControl, TextInput, MantineSelect, AdminTable (Patterns/Mantine/AdminTable), MantineDataTableToCards, MantineCopyIdButton (Mantine/Primitives/CopyIdButton), LISTING_STATUS_COLOR, MantineModal, RangeDatePicker, MantinePagination, AdminPageHeader, adminPageShellMaxWidth; decision: REUSE + COMPOSE (three Views with own Stories) + EXTEND-IF-ABSENT (adminPageShellMaxWidth); selected canonical owner: components/admin/AdminTable.tsx, patterns/*, listingStatusTone.ts, theme.other.layout; Mantine/TailAdmin token path: spacing sm/md/xl/2xl, fz sm/xs, iconSize, TailAdmin §6b; new hardcoded visual values: NONE (the archived-row dimming is dropped, not re-created); rationale: every value exists in the theme or a canonical owner.`

`GR-3a STORY PREFLIGHT — AdminListingsView / ListingPreviewDialogView / PremiumDialogView × R9 states; canonical candidates: NONE (Admin/AdminListingsTable and Admin/AdminPageShell render legacy components); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new Views; both legacy Stories deleted.`

`GR-1 CENSUS COMPLETE — 16 nodes today; after: tier1 3 Views migrated+enrolled+story + 3 container-exempt (AdminListingsTable, ListingPreviewDialog, PremiumDialog); AdminPageShell deleted; AdminSearchInput/AdminInput/Combobox imports removed (files stay for other consumers); tier2 5 imports removed; tier3 none — filed as none.`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Census, 16 nodes | 2026-09-29 run | VERIFIED |
| `visible` ignored today | `page.tsx:23-24,:87-89` | VERIFIED |
| `AdminPageShell` has no other consumer | import grep over `src` | VERIFIED |
| Path-reading test | `visibility.test.ts:359-403` | VERIFIED |
| `RangeDatePicker` min/single props | `RangeDatePicker.tsx:52-74` (893 working tree) | VERIFIED as present; landed state re-checked at I0 |
| ADM-08 href | `hrefs.ts:46-49` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | whole surface; shared files tier-2 | COMPLIANT |
| GR-0 | reuse/compose; no new raw value | COMPLIANT |
| GR-3 / 3a / 16c | three own Stories; legacy deleted | COMPLIANT |
| GR-3b / 3c / 3d | §12 | COMPLIANT |
| clause 9 | deletion audit | COMPLIANT (R10) |
| clause 15 | visibility flow proof | COMPLIANT (T1, P1, P2, Task 456 test) |
| data-access rules | canonical helper, no inline literal | COMPLIANT (R1) |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | 893 landed; no shared path dirty | `PREMISE DRIFT — 893` / `BLOCKED — SHARED PATH` |
| 1 | Census before | unmigrated node outside R2–R7 → `BLOCKED — CLAUSE 16d` |
| 2 | Views + Stories | receipts missing → `BLOCKED` |
| 3 | Tests + plants | a plant passes → test defect |
| 4 | Deletions + baseline | a live reference remains → fix |
| 5 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 6 | O78-12 | returned → revision |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **857** | reserved 2026-09-18 — **Sprint 78**, P2 | **`/admin/listings` has no "visible" filter.** `src/app/admin/listings/page.tsx:23,87-103` supports `visibility=hidden_eligible` (+ `reason`) only; `AdminListingsTable.tsx:598-694` renders only that filter's UI, so an unknown `visibility=visible` would filter nothing and show no chip. Needed by ADM-08 and the ADM-11 `visible` segment (847 `hrefs.ts`). The filter must use `applyPublicVisibility` (critical flow "Listing public visibility invariant"). `AdminListingsTable` (759 lines, legacy) comes under clause 16d → census first. |

---

## Addendum — Task 886 closure, 2026-09-30 (owner decision O83-2)

Task 886 added the blocking `check:type-responsive` gate (`scripts/check-type-responsive.mjs`). It baselines the legacy site **L5** (`src/components/admin/AdminPageShell.tsx :: text-2xl`) in `scripts/type-responsive-baseline.json`.
- When this task removes that site, delete its baseline entry in the same change. The gate fails on a **stale** entry: *"the site was fixed or removed; delete the entry"*.
- Add `npm.cmd run check:type-responsive` to the final gate block. It must exit 0.
- The migrated heading follows GR-3c: a breakpoint-keyed theme `fz` (`TITLE_FZ`, `src/design-system/mantine/typography.ts`), and at most 20px below 640.

Owner, verbatim (O83-2, 2026-09-30): *"що це за Legacy-сайти і чи використовуємо ми їх наразі у проекті? Якщо використовуємо, тоді треба мігрувати на Minetine."*

---

## 16. Review 1 — `NEEDS REVISION`, 2026-10-02 → Revision 1

Opus inspected the real diff, ran the census (`node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx`: exactly the four §3.1 calibration FAIL lines), ran T1–T7 + `visibility.test.ts` natively (79/79 pass), and measured all 16 Stories at 320/390/768/1024/1440 in `sq`/`uk`. Results: no page overflow; gutter 24/16/24/16 at 320/390 and 24/32/24/32 at 1024/1440; no text ≥ 20px; filter bar stacked below 640; every touch target ≥ 44px below 640. The implementation of R1–R12 stands. **Do not touch any file outside §16.6.** Revision 1 adds the detection the owner asked for and corrects three kickoff defects.

### 16.1 Owner decisions, 2026-10-02 (verbatim)

- **P2 / AC7.** Opus asked whether to retire P2 and file a separate task for the gate's blind spot, or block 857 on that task. The owner answered: *"створюй тест у цій задачі!"*. The detection is therefore built **in 857** (§16.3), and no separate task is filed.
- **AC6 live references.** Option chosen: *"Opus at approval closure (Recommended)"*. Opus rewrites the live references listed in §16.4 in the approval commit. The executor does not touch them.

### 16.2 Why P2 could not fail (kickoff design defect, measured)

1. **Helper shape.** `visibilityFilter.ts` receives the builder as a parameter. The gate's printed scope line says it *"CANNOT see … factories … passed as arguments"*. An inline `.eq('status','active')` + `.gte('expires_at', …)` there also keeps T1 green, because T1 checks the calls on the capture mock and the inline chain makes the same calls. So T1 does not prove that the canonical helper is used.
2. **Route shape.** In `page.tsx`, `let query = supabase` and `.from('listings')` are on different lines. `extractListingsQueryBlocks` (`scripts/check-listing-visibility.mjs`) records a derived variable only when `const|let <name> =` and `from('listings')` share one line. Shape 1's continuation also stops at the multi-line `.select(` template. So `query = query.eq('status', 'active')` in that route is invisible. Evidence: `06b`/`06c`/`06d`, all exit 0.
3. **Blast radius (Opus pre-measure, 2026-10-02).** Six declarations have this shape: `src/app/admin/listings/page.tsx:63`, `src/app/api/listings/route.ts:15`, `src/app/[locale]/cabinet/page.tsx:49`, `src/app/[locale]/listings/page.tsx:42`, `src/modules/listings/lib/favoritesQueries.ts:54` and `:120`. A simulation of the widened rule over `src` with the gate's own `VISIBILITY_PATTERNS` found **0** violations on today's tree. **Re-measure at execution; do not cite this count.**

### 16.3 New requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R13** | `scripts/check-listing-visibility.mjs`: a derived variable is also recognised when its declaration spans lines. `const`/`let <name> = [await] <identifier>` sits on one line, `.from('listings')` starts the next line, and its later `<name>.` / `<name> = <name>.` lines are scanned exactly as shape 2 scans them today. The write-method exclusion is unchanged. `SCOPE_LINE` says derived variables include a multi-line declaration. It keeps the *passed as arguments* blind spot, because that one is still not covered. `--verify-gate` gains two BAD arms: `multi-line declaration: query = query.eq('status','active')`, whose code is a `let query = supabase` line, a `.from('listings')` line, a multi-line `.select(` template, then `query = query.eq('status', 'active')`; and `multi-line declaration: query.gte('expires_at')`. It also gains two NO-FP arms: `multi-line declaration + dynamic .eq('status', status)` and `multi-line declaration + applyPublicVisibility(query)`. | P0 | AC10 |
| **R14** | **T1b** in `AdminListingsTable.smoke.test.tsx` mocks `@/modules/listings/lib/visibility` partially (`vi.mock` + `importActual`, with `applyPublicVisibility` and `applyPublicEligibleButHidden` wrapped in spies that call through). It asserts: `'visible'` calls `applyPublicVisibility` exactly once with the given builder and does not call `applyPublicEligibleButHidden`; `'hidden_eligible'` + `'expired'` calls `applyPublicEligibleButHidden(builder, { reason: 'expired' })` once; `'bogus'` calls neither. T1 stays unchanged. If the partial mock breaks T2–T7 in the same file, put T1b in a new file `src/app/admin/listings/__tests__/visibilityFilter.test.ts` and name it in the session log. | P0 | AC11 |

### 16.4 AC6 redefined (owner decision §16.1)

The R10 audit command becomes:

```powershell
git --no-optional-locks grep --untracked -n -E "AdminPageShell|admin-adminlistingstable|admin-adminpageshell" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!tasks/Sprints/**" ":!docs/backlog-archive.md" ":!docs/governance-reports/**" ":!docs/reviews/**" ":!tasks/Epics/**" ":!docs/mantine-tailadmin-migration-tracker.md" ":!scripts/task419-qa-shell-fullwidth.mjs"
```

The added exclusions are history: weekly reports and retained review artifacts; the Epic files; the migration tracker, which is HISTORICAL by owner decision 2026-08-27 (`docs/backlog.md` → Active Epics); and the one-off Task 419 probe, which no `package.json` script or workflow runs.

**Expected executor output: exactly the live lines Opus rewrites at approval closure.** Those are `docs/admin-ux-rules.md` (§14.1, §14.5), `docs/design-system.md`, `docs/storybook-governance.md`, `docs/responsive-storybook-inventory.md`, `docs/backlog-reserved.md` (734's row) and `src/app/globals.css:729` (comment). Record the output in `20c-reference-audit-r1.txt`. Any path outside that list is the executor's to fix if it is inside §16.6. Otherwise report it.

### 16.5 Plants and acceptance (Revision 1)

| Plant | Edit (Node I/O, hash before/after, restore) | Must fail |
|---|---|---|
| **P2a** | in `visibilityFilter.ts`, replace `return applyPublicVisibility(query)` with `return query.eq('status', 'active').gte('expires_at', new Date().toISOString())` | T1b (T1 may stay green — say so) |
| **P2b** | in `page.tsx`, insert `query = query.eq('status', 'active')` on the line after `query = applyAdminListingsVisibility(…)` | `npm.cmd run check:listing-visibility` exits 1 and names `src/app/admin/listings/page.tsx:<line>` |
| **P2c** | revert only R13's detector change (keep the new self-test arms) | `npm.cmd run check:listing-visibility:verify` exits 1 with `❌ MISSED` on both new BAD arms |

- **AC10 [R13]** Given the final tree, `check:listing-visibility` exits 0 (or with any new hit reported per §16.7), `check:listing-visibility:verify` exits 0 with the four new arms printed, and P2b and P2c fail as stated, then pass after restore with equal hashes.
- **AC11 [R14]** Given the final tree, T1b passes, and P2a fails it and passes after restore with equal hashes.
- **AC7 (amended)** P1, P3, P4 and P5 stand on the retained `06-plants-run.txt` / `06b-plants-run.txt` and are **not re-run**. P2 is replaced by P2a–P2c.

### 16.6 Re-entry: `remediation`

- **Start step:** I0 platform line only (`24-platform-r1.txt`). Then R13 → R14 → plants P2a–P2c → the §16.8 gate block.
- **Reusable, do not re-run or overwrite:** `01`–`23`, every `plant-*` file, the Story measurements and the GR-3b/3c/3d receipts. Revision 1 changes no visible artifact.
- **Write set:**
  - `scripts/check-listing-visibility.mjs`;
  - `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`, or the new `src/app/admin/listings/__tests__/visibilityFilter.test.ts` (R14);
  - `docs/critical-flow-registry.md` row `:70`: append *"Task 857 R13: the gate follows a multi-line `let query = supabase` / `.from('listings')` declaration; R14 T1b proves `/admin/listings?visibility=visible` calls `applyPublicVisibility`."*;
  - `docs/sessions/2026-10-02-task857-admin-listings-mantine.md` (append a "Revision 1" section; keep the original sections);
  - `docs/sessions/evidence/task857/` (new files with an `-r1` suffix);
  - the 857 cell of `docs/backlog.md`.
- **Forbidden:** any other `src/` file, any doc in §16.4's live list, and any `docs/*rule*.md`.

### 16.7 Negative branch — the widened gate finds a hit

If `check:listing-visibility` reports a violation in one of §16.2's files, stop. Record the file, line and text in the session log, and return `BLOCKED — R13 NEW HIT` (a public-read hit is a production visibility defect and needs an owner decision). Do not allowlist it and do not edit that file.

### 16.8 Gate block (Revision 1)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\24-platform-r1.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/modules/listings/lib/__tests__/visibility.test.ts *>&1 | Tee-Object "$ev\25-tests-r1.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\26-listing-visibility-r1.txt"
npm.cmd run check:listing-visibility:verify *>&1 | Tee-Object "$ev\27-listing-visibility-verify-r1.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\28-typecheck-r1.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\29-lint-r1.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\30-file-integrity-r1.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\31-mojibake-r1.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\32-build-r1.txt"
git --no-optional-locks grep --untracked -n -E "AdminPageShell|admin-adminlistingstable|admin-adminpageshell" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!tasks/Sprints/**" ":!docs/backlog-archive.md" ":!docs/governance-reports/**" ":!docs/reviews/**" ":!tasks/Epics/**" ":!docs/mantine-tailadmin-migration-tracker.md" ":!scripts/task419-qa-shell-fullwidth.mjs" | Tee-Object "$ev\20c-reference-audit-r1.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\33-status-after-r1.txt"
```

If T1b lives in the new file, add its path to the `vitest` line. Record every exit code, normalise the `Tee-Object` files to UTF-8 without BOM through Node, and write `git hash-object` of every Revision 1 file to `34-hash-object-r1.txt` in the same pass.

**Expected:** `win32`; tests pass; `26` = 0; `27` = 0 with the four new arms; typecheck, lint, file-integrity, mojibake and build = 0; `20c` = only §16.4's live list.

### 16.9 Completion report (Revision 1)

Status per `execute-task` (strongest: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`). Report: R13/R14 and AC10/AC11 with their evidence, the P2a–P2c hash pairs, the count of `from('listings')` declarations the widened rule now follows (re-measured), any §16.7 hit, and `GR-2 SCOPE STATED` for `check:listing-visibility` (what it still cannot see). Update the 857 cell of `docs/backlog.md`. No Git.

### 16.10 Still owed outside the executor

- **O78-12** (§13.3, 34 tuples) can be reviewed now. Revision 1 changes no visible artifact, and Opus's measurements (§16 preface) are clean.
- **Opus at approval closure:** the §16.4 live references, the archive, and the kickoff move to `tasks/Archive/`.

---

## 17. Review 2 — `NEEDS REVISION`, 2026-10-02 → Revision 2 (owner returned O78-12)

**Revision 1 is verified.** Opus re-ran these natively: `check:listing-visibility:verify` (34 passed, 0 failed),
`check:listing-visibility` (0 violations) and the smoke file (16/16). The R13 heuristic and the decision to treat a
destructured declaration as data, not a builder, are accepted. **Do not touch R13/R14 or their evidence.**

### 17.1 Owner returns, 2026-10-02 (verbatim)

1. `AdminListingsView` (`Default`, `VisibleFilter`, `HiddenEligible`, `Paginated` × sq/uk × 390/1440, and `Default` × en/it × 1024): *"не приймаю, не витримані горизонтальні відступи всередині таблиці на всіх breakpoints."*
2. `ListingPreviewDialogView`: *"не приймаю. Це суцільний хаос однакових по ієрархії кнопок. Необхідно у цьому попапі розробити ієрархію основних і допоміжних кнопок. Це можуть бути текстові кнопки з іконками та звичайні основні кнопки. Необхідно розрробити цей попап та і взагалі всі інші попапи мають притримуватись UI/UX best practices 2026 року. Наразі це повне лайно."*
3. `PremiumDialogView`: *"не приймаю. Звідки взявся цей жовтий колір ще й гімняного відтінку. … Кнопки мають бути стандартні з ієрархією!"*
4. The visibility segment that scrolls out of view at 320: the owner left this to Opus. Decision: fix it (R18).

The dialog rule the owner asked for is now `docs/mantine-responsive-design-system.md` **§23.6 "Dialog action
hierarchy"**. R16 and R17 implement it. The other existing dialogs are reserved **Task 915**.

### 17.2 Measured causes (Opus, 2026-10-02, `storybook-static` screenshots)

- **Table (return 1).** At 1024 and 1440 the desktop table is wider than its card, so it scrolls inside `MantineDataTableToCards`'s `ScrollArea`. The listing title column has no width and inherits the pattern's `nowrap` and `miw="max-content"`. A long title therefore sets the table width. The right-hand columns (status, visibility, agent, date, row chevron) are clipped at the card border with no right inset. At 1024 the status badge touches the border, and visibility, agent and the chevron are off-canvas. The legacy table capped the title (`truncate max-w-50`). `AdminTable` does not forward `TableColumn.width` / `wrap`: its own comment says *"widths belong to `TableColumn.width` in each manager's migration"*, and that migration was never done.
- **Audit panel.** `auditButton` wraps its label in `Text size="sm" inherit`. `inherit` overrides `size`, so the links render at 16px, not 14px.
- **Preview dialog (return 2).** It has eleven outline buttons of equal weight, including seven status actions in seven colours, plus a yellow `--badge-premium` Premium button.
- **Premium dialog (return 3).** Its four presets are outline buttons in `--badge-premium` yellow, there is a literal "OK", and no button is clearly primary.

### 17.3 New and replacing requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R15** | **`AdminTable` (canonical owner, EXTEND):** `AdminTableColumn` gains optional `width?: string \| number` and `wrap?: boolean`, forwarded unchanged to `TableColumn.width` / `TableColumn.wrap`. Omitted → today's output, so the other consumers do not change. Update the `@deprecated className` comment. `Patterns/Mantine/AdminTable` gains one export, `WrappedTitleColumn`: a fixture with one long title, a `wrap: true` + `width` title column and `onRowClick`, in `StoryPageGutter`. **`AdminListingsView`:** the listing column passes `wrap: true` and a percentage `width`, and its title becomes `Text size="sm" fw={500} lineClamp={2}`. Every other column stays `nowrap`. The `auditButton` label drops `inherit`. | P1 | AC12 |
| **R16** | **`ListingPreviewDialogView` per §23.6.** **Title:** the listing title (`lineClamp={2}`), plus a `Badge variant="light" color="gray"` with the new key `admin.listings.premium_badge` (sq/en/it "Premium", uk "Преміум") when premium. There is no yellow star. **Body:** the details `SimpleGrid`. Its **Status** cell is the canonical `StatusChangeSelect` (Task 894), with `currentStatus` = the listing status and `statuses` = the current status plus `getPrivilegedTargetStatuses(status)`, labelled with `statusLabels`; it replaces the status badge and every status-action button. Under the grid, a `Group gap="xs"` of tertiary `Button variant="subtle" color="gray"` text buttons with icons: View listing (`Eye`) and Open public page (`ExternalLink`, absent when hidden). **Footer, resting:** Delete `variant="subtle" color="red"` + `Trash2` on the left. On the right, Premium set/change as `variant="default"` + `Star` (neutral colour), then the **primary** filled Edit (`Pencil`, `component={Link}`, new tab), rightmost. **Footer, delete confirm:** Cancel `variant="default"` + Delete filled `color="red"` (`loading` while deleting). The confirm text stays in the body. **Below 640:** the footer stacks full-width, ≥ 44px, in the order Edit, Premium, Delete (confirm step: Delete, Cancel). **Container:** `usePreviewStatusActions` becomes `usePreviewStatusOptions` (`StatusSelectOption[]`); `ACTION_DEFS` and the `changingStatus` state are deleted. `handleStatusChange` throws when `result.error` is set and calls `onStatusChanged` on success. **It does not toast:** `StatusChangeSelect` owns the success and error toasts (`admin.common.status_control.status_change_success` / `_error`). `onStatusChanged` behaves as today. | P1 | AC13 |
| **R17** | **`PremiumDialogView` per §23.6.** **Body:** the listing title (`Text size="sm" c="dimmed" lineClamp={2}`), then a `Radio.Group` (label `premium_quick_label`) with five `Radio`s: `preset_1m`, `preset_3m`, `preset_6m`, `preset_1y` and `premium_custom_date`. Choosing the custom option reveals the `RangeDatePicker selectionMode="single" disablePastDates` below it. **Footer:** `premium_remove` as `variant="subtle" color="red"` on the left, only when premium. On the right, Cancel (`common.cancel`, `variant="default"`, closes) and **Save** (`common.save`, filled primary, `loading` while saving, disabled until a preset is chosen, or until the custom option has a date). **No `--badge-premium` and no literal "OK".** **Container:** `apply()` runs on Save with the chosen preset's days, or with the custom date's ISO as today; the error and success toasts are unchanged. **Changed flow:** a preset no longer applies on click; Save applies it. | P1 | AC14 |
| **R18** | **Visibility filter below 640.** Below `theme.other.mobileGate`, the `AdminListingsView` visibility filter is a full-width `MantineSelect` with the same three options and `aria-label` `visibility_label`. Choose it with `useMediaQuery(\`(max-width: ${theme.other.mobileGate})\`)`, the pattern's own query. From 640 it stays the `SegmentedControl`. No label is clipped at 320 in any locale. | P2 | AC15 |
| **R9 (amended)** | `ListingPreviewDialogView` exports: `Active`, `SoldStatusActions` (the id is kept; `responsive-screenshots.mjs` uses it), `Hidden`, `DeleteConfirm`, `Premium` (new: a premium listing, so the title shows the badge and the footer shows "change premium"). `ChangingStatus` is deleted, because that state no longer exists in the View. `PremiumDialogView` exports: `NotPremium`, `Premium`, `CustomDate` (new: the custom option with a date), `Saving`. | P1 | AC5 |
| **T4 / T6 (amended)** | **T4:** choosing a status in the dialog's `StatusChangeSelect` calls `updateListingStatus(id, to)` and patches the row badge; an error result raises the `status_change_error` toast. **T6:** choosing "1 month" and clicking Save calls `setListingPremium(id, true, <ISO ≈ now+30d>)`; clicking a preset alone calls nothing; `db_missing_column` → `premium_error_db_schema`. **T8 (new):** the resting preview footer has exactly one filled button (Edit). **P6 (new plant):** make Premium filled → T8 fails. | P0 | AC16 |

### 17.4 Acceptance (Revision 2)

- **AC12 [R15]** In `AdminListingsView` `Default` and `Paginated` at 640/768/1024/1280/1440 × sq/en/uk/it, the table's `ScrollArea` viewport has `scrollWidth ≤ clientWidth`, so nothing scrolls or clips. The first cell's left inset and the last cell's right inset are both the pattern's 24px (chevron cell included) from the card border. No text is clipped. Below 640, every card's left and right content inset are equal. `Patterns/Mantine/AdminTable` `WrappedTitleColumn` passes the same scroll check at 1024/1440. The other `AdminTable` exports are visually unchanged (before/after screenshots at 1440). The audit links compute to 14px.
- **AC13 [R16]** In every `ListingPreviewDialogView` export at 390/1440 × sq/uk: one filled button per state; no colour on a non-destructive, non-primary button; no `--badge-premium` in the file; `StatusChangeSelect` is the only status control; at 390 the footer is stacked, full-width and ≥ 44px.
- **AC14 [R17]** In every `PremiumDialogView` export: no `--badge-premium` and no literal `OK` (grep of the file prints nothing); Save is the only filled button; Save is disabled with no choice; at 390 the footer is stacked, full-width and ≥ 44px.
- **AC15 [R18]** At 320 and 390 × all four locales, the visibility filter is a select whose width equals the filter column and whose label is fully visible. At 640 and above the `SegmentedControl` renders; T2 still passes.
- **AC16** T1–T8 and T1b pass; P6 fails T8 and passes after restore with equal hashes. P1–P5 and P2a–P2c are not re-run.
- **AC9 (re-run)** Every §17.6 gate exits 0.

### 17.5 Re-entry: `remediation` (Revision 2)

- **Start step:** platform line `40-platform-r2.txt`. Then R15 → R18 → R16 → R17 → Stories → tests → P6 → the §17.6 gate block → receipts.
- **Do not re-run or overwrite:** evidence `01`–`36` and every `plant-*` file.
- **Write set:**
  - `src/components/admin/AdminTable.tsx` (R15, additive only);
  - `src/stories/patterns/mantine/AdminTable.stories.tsx` (one new export);
  - `src/components/admin/AdminListingsView.tsx`, `ListingPreviewDialog.tsx`, `ListingPreviewDialogView.tsx`, `PremiumDialog.tsx`, `PremiumDialogView.tsx`;
  - the three 857 Story files;
  - `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`;
  - `messages/{sq,en,uk,it}.json` (`admin.listings.premium_badge` only; remove a key only if a grep shows it is now unused, e.g. the `btn_*` status-action labels, and list each removal);
  - `scripts/i18n-dynamic-manifest.json`, only if the `btn_*` labels were registered there;
  - session log, evidence with an `-r2` suffix, and the 857 cell of `docs/backlog.md`.
- **Forbidden:** `MantineDataTableToCards.tsx`, `StatusChangeSelect.tsx`, `MantineModal.tsx` and every other `AdminTable` consumer. If R15 cannot reach AC12 without changing the pattern, stop: `BLOCKED — R15 PATTERN`.
- **Census:** the containers and Views stay as they are, and `StatusChangeSelect` becomes a new tier-1 node under the dialog (`manifest:yes story:yes` since 894). Re-run the census; the FAIL lines must still be exactly the four §3.1 lines.

### 17.6 Gate block (Revision 2)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\40-platform-r2.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\41-census-r2.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/modules/listings/lib/__tests__/visibility.test.ts *>&1 | Tee-Object "$ev\42-tests-r2.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\43-typecheck-r2.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\44-lint-r2.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\45-story-coverage-r2.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\46-rendered-scope-r2.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\47-census-changed-r2.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\48-design-tokens-r2.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\49-enrolled-tailwind-r2.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\50-i18n-r2.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\51-i18n-dynamic-r2.txt"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\52-type-responsive-r2.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\53-file-integrity-r2.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\54-mojibake-r2.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\55-storybook-build-r2.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\56-build-r2.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\57-status-after-r2.txt"
```

Record every exit code. Normalise the transcripts to UTF-8 without BOM through Node, and write
`git hash-object` of every Revision 2 file to `58-hash-object-r2.txt` in the same pass.

**Expected:** `win32`; four calibration FAIL lines; every other exit 0.

### 17.7 Receipts and measurements (Revision 2)

- **AC12 and AC15:** Playwright against the rebuilt `storybook-static`. Write the numbers to `59-measurements-r2.json` and the before/after screenshots of the `AdminTable` exports to `60-*`.
- **GR-3b, GR-3c and GR-3d:** one receipt per changed Story (the three 857 Stories and `AdminTable`), at 320/390/1024/1440 (type at 768/1440 too).
- **GR-0 and GR-3a:** for `WrappedTitleColumn` (`EXTEND`) and for `StatusChangeSelect` (`REUSE`).
- **§23.6:** one line per dialog state: the primary, the secondary, the tertiary and the destructive button.

### 17.8 Owner matrix after Revision 2 (O78-12, re-issued)

The tuples are the same as in §13.3, plus `ListingPreviewDialogView` `Premium` and `PremiumDialogView` `CustomDate`
(sq, 390/1440): **38 tuples**. Opus re-measures every Story before the owner sees it.

---

## 18. Review 3 — `NEEDS REVISION`, 2026-10-02 → Revision 3 (every Mantine table fits its production container)

Revision 2 is verified except AC12. Opus inspected the real diff and the `-r2` evidence. Results:
- R16, R17 and R18 match §17.3 and §23.6 in source.
- AC13–AC16 are as reported: `59b-dialogs-r2.json`, `59-measurements-r2.json`, `42-tests-r2.txt` (83 passed) and
  `61-plant-P6-r2.txt`.
- `41-census-r2.txt` shows exactly the four §3.1 FAIL lines, and `56-build-r2.txt` exits 0.
- R15's forwarding adds nothing when `width`/`wrap` are omitted. `MantineDataTableToCards.tsx:536` writes
  `style.width = col.width` and adds `whiteSpace: 'normal'` only when `col.wrap` is truthy. So the other `AdminTable`
  exports are unchanged by source inspection. The missing AdminTable "before" screenshots are no longer required.

**Do not touch R13/R14, R16/R17/R18, the dialogs, their Stories, T1–T8, T1b or their evidence.**

### 18.1 Owner decision, 2026-10-02 (verbatim option chosen)

Opus asked how the table should fit its card and gave three options: merge cells, hide columns by width, or keep the
horizontal scroll. The owner chose:

*"Merge cells, no scroll (Recommended)"*: Status + visibility become two stacked badges in one column.
Type · property · agent becomes a grey meta line under the title. The title column is capped by a theme token (legacy
`max-w-50` = 200px). Date shows from 1280 and ID from 1440 (legacy had both from 1280). Nothing scrolls from 768 up, and
all data except ID and date stays visible at every width.

### 18.2 Measured causes (Opus, 2026-10-02)

1. **The production card is narrower than the Story's.** `AdminShell` (`src/components/admin/AdminShell.tsx:23-28`)
   puts a 240px navbar (`appShellNavbarWidth`, `theme.ts:844`) beside the page from `lg`. `AppShell.Main` has padding 0,
   and the page `Box` pads `xl` (24px), then `2xl` (32px) from `lg` (`page.tsx:121`). The card is therefore:

   | Viewport | Production card | Story card |
   |---|---|---|
   | 768 | 720 | 720 |
   | 1024 | 720 | 960 |
   | 1280 | 976 | 1216 |
   | 1440 | 1136 | 1376 |

   The Story renders without the shell, so §17.4's Story measurement overstated the room by 240px from 1024. In
   production the table scrolls even at 1440.
2. **Per-column widths** (`59b-cols-r2.json`, worst locale `uk`): chevron 62, price 130, status 144, visibility 270,
   type · property 167, agent 144, date 130, ID 93. At a 720px card no layout with one value per cell fits.
3. **Kickoff defect (§17.3 R15):** a percentage `width` on a `wrap` column inflates the table, because the pattern's
   `miw="max-content"` divides the title's max-content width by the percentage. The executor measured this and used a
   fixed width. The fixed width they used is the defect in item 4.
4. **Disguised raw value (GR-0, P2):**
   - `AdminListingsView.tsx:133` and `AdminTable.stories.tsx` (`WrappedTitleColumn`) set
     `width: 'calc(var(--mantine-spacing-3xl) * 5)'`. That expression invents a 240px width from a spacing token and a
     multiplier.
   - A spacing token is not a column width, and ×5 has no provenance.
5. **Untranslated Story text (clause 13, P3):** `WrappedTitleColumn` shows the raw status code (`r.status`, for example
   `active`) inside its badge.

### 18.2a Owner instructions later the same day (verbatim) — scope widened

1. Opus noted that every admin page View Story renders without `AdminShell` and is therefore 240px wider than the
   real page from 1024. The owner replied: *"Це треба вирішити одразу у цій задачі, а не створювати купу
   додаткових задач!"*
2. *"і це стосується всіх таблиць у проекті, а не тільки в адмінці"*.
3. Asked how far that reaches, the owner chose *"857: усі Mantine + правило (Recommended)"*. Its full text:
   - 857 carries the rule, the shared Story frame with the real `AdminShell`, and the measurement and fix of every
     Mantine table.
   - The five legacy table screens get the rule when they migrate, in one task (**916**).
   - Support is covered in **859**.

**The rule is now `docs/mantine-responsive-design-system.md` §7.3 "Table fit"** (written by Opus, 2026-10-02). GR-3b
gains "An admin page View renders inside the real `AdminShell`". §7.3 is the acceptance standard for every table
below.

**Opus measurement, 2026-10-02.**
- Run: `win32` Node v22.22.3, `storybook-static` built 10:47 from the Revision 2 tree, Playwright, sq and uk.
- Production geometry was reproduced with the navbar offset and each page's `maw`.
- Script and raw output: `docs/sessions/evidence/task857/90-opus-table-census.mjs` and
  `90-opus-table-census.json` (copied there by Opus).

Each cell is `scroll overflow px` in uk, with the card width in brackets:

| Table (Story) | Production card 768 / 1024 / 1280 / 1440 | uk overflow at 1024 | Columns measured at 1024 (uk, px) |
|---|---|---|---|
| `AdminListingsView` | 720 / 720 / 976 / 1136 | +439 | listing 240, type 167, price 130, status 144, visibility 270, agent 144, chevron 62 |
| `AdminUsersTable` | 720 / 736 / 992 / 1152 (page `p="xl"`) | +809 | user 534 (`35%`), role 153, status 153, phone 198, date 305 (`20%`), actions 183 (`12%`) |
| `AdminExchangeProvidersView` | 720 / 720 / 960 / 960 | +392 | name 177, endpoint 332, priority 109, mode 129, enabled 129, notes 105, actions 130 |
| `AdminPagesView` | 720 / 720 / 832 / 832 | +371 | title 472, status 149, updated 197, actions 130 (slug from `md`) |
| `AdminReportsView` | 720 / 720 / 960 / 960 | +358 | reason 212, listing 337, status 127, date 197, chevron 62 (reporter from `lg`) |
| `AdminCurrenciesView` | 720 / 720 / 960 / 960 | +5 | code 71, symbol 94, name 159, active 206, chevron 62 (updated from `lg`) |
| `AgentStatisticsView` (cabinet) | 678 / 934 / 1190 / 1350 (its own `MantineDashboardGrid`) | +3238 | nine columns with `%` widths; the `22%` wrap title inflates the table to 4170px |
| `AdminSurfacePattern`, `AdminTable` `Default` | no production consumer / adapter | 0 | fit |

### 18.3 New and replacing requirements (supersede R15's `AdminListingsView` part and AC12)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R19** | **Token (`src/design-system/mantine/theme.ts`, EXTEND).** Add `theme.other.layout.tableTitleColumnWidth: '12.5rem'` to the `layout` type and value blocks. Its comment gives the provenance: legacy `AdminListingsTable.tsx:511` (`git show HEAD`) `truncate max-w-50`, 12.5rem; owner decision 2026-10-02; §7.3 (a). Every table in this task uses it for its title column. | P1 | AC17 |
| **R20** | **`AdminTable` (EXTEND).** `AdminTableColumn.visibility` gains `'xxl'` (theme 1440px, `theme.ts:629`), forwarded through `visibleFrom()`. `AdminTable` passes `cardsBelow="md"` to `MantineDataTableToCards` (§7.3 rule 2). Every `AdminTable` consumer therefore shows cards below 768. That includes the legacy `AdminCompaniesManager`, `AdminPropertyTypesManager` and `AdminSupportManager`, which are not edited. Their synthesized or `cardRow` card already exists. | P1 | AC17, AC19 |
| **R21** | **`AdminListingsView` columns, in order:** <br>1. **ID**, `visibility: 'xxl'`. <br>2. **Listing** (sticky). `width: theme.other.layout.tableTitleColumnWidth`, `wrap: true`. Cell: the button with the premium star, title `Text size="sm" fw={500} lineClamp={2}`, and under it `Text size="xs" c="dimmed"` with `typeLabel(l)` plus ` · <agent>` when there is one. That is the card's `meta` string, from one helper both use. <br>3. **Price**. <br>4. **Status**. Header `col_status`. Cell: `Stack gap="tight" align="flex-start"` with the status badge, then the visibility badge. <br>5. **Date**, `visibility: 'xl'`. <br>The `type`, `visibility` and `agent` columns are deleted, and the `calc(…)` width is gone. | P1 | AC17 |
| **R22** | **`WrappedTitleColumn` (`AdminTable.stories.tsx`).** The title column uses `theme.other.layout.tableTitleColumnWidth` (`useMantineTheme()` in `render`), not `calc(…)`. The status badge shows `getListingStatusLabel(code, k => storyT(l, 'cabinet.' + k))` (`src/lib/i18n/listingStatusLabel.ts`; the container calls it with the `cabinet` translator at `AdminListingsTable.tsx:46,58`), never the raw code. | P2 | AC17 |
| **R23** | **`AdminPageFrame` (CREATE, production).** Add `src/components/admin/AdminPageFrame.tsx`: `<Box p={…} maw={…} mx={…}>{children}</Box>`, the wrapper every admin `page.tsx` hand-writes today. Props: <br>• `width: 'page' \| 'shell' \| 'narrow' \| 'panel' \| 'form'`, mapping to `adminPageMaxWidth` / `adminPageShellMaxWidth` / `adminPageNarrowMaxWidth` / `adminPagePanelMaxWidth` / `adminPageFormMaxWidth`. <br>• `gutter?: 'responsive' \| 'xl'`. Default `responsive` = `{ base: 'xl', lg: '2xl' }`; `xl` is today's `p="xl"`. <br>• `centered?: boolean`, default `true` (`mx="auto"`). <br>Every route keeps its exact current values: <br>• `currency`, `inquiries/sales`, `inquiries/support`, `reports`, `users/[id]`: `page`; <br>• `listings`: `shell`; <br>• `users`: `shell` + `gutter="xl"`; <br>• `pages`: `narrow`; <br>• `permissions`: `panel` + `gutter="xl"` + `centered={false}`; <br>• `users/new`: `form`. <br>Those ten `page.tsx` files replace their `Box` with it and change nothing else. Own Story `Patterns/Mantine/AdminPageFrame` (one export per `width`, inside `withAdminShell`, an `AdminPageHeader` + `Paper` placeholder as content). Enrolled in `scripts/mantine-migration-scope.json`. | P1 | AC18 |
| **R24** | **Shared Story frame (CREATE).** Move `withAdminShell` from `AdminDashboardView.stories.tsx:41-47` to `src/stories/_StoryAdminShell.tsx` (exported). `AdminDashboardView.stories.tsx` imports it. That is the only change to that Story. | P1 | AC18 |
| **R25** | **Admin page View Stories render as their route does (GR-3b, §7.3).** Each Story below: <br>• uses `decorators: [withAdminShell]`, `layout: 'fullscreen'`, `skipCanvas: true` and `parameters.nextjs.navigation.pathname` = its route; <br>• wraps every page export in the route's `AdminPageFrame` props (R23); <br>• removes `StoryPageGutter`. <br>Stories and routes: <br>• `AdminListingsView` (`/admin/listings`); <br>• `AdminUsersTable` (`/admin/users`); <br>• `AdminCurrencyTabs`, `AdminCurrenciesView`, `AdminExchangeProvidersView` (`/admin/currency`); <br>• `AdminPagesView` (`/admin/pages`); <br>• `AdminReportsView` (`/admin/reports`); <br>• `AdminInquiriesView` (`/admin/inquiries/sales`); <br>• `AdminPermissionsView` (`/admin/permissions`); <br>• `AdminUserProfileView`: `Create` → `/admin/users/new` with `form`; every other export → `/admin/users/[id]` with `page`. <br>Exports that render only an open dialog stay overlay-only. The dialog View Stories (`*DialogView`) do not change. | P1 | AC18 |
| **R26** | **`AdminUsersTable` fits (§7.3), both tables (users and verified agents).** <br>• Delete every percentage `width`. <br>• The user column takes `tableTitleColumnWidth` + `wrap: true`; the name stays as today, and phone moves to a dimmed meta line under it. <br>• Role and status stack in one cell (header `col_status`). <br>• Date from `xl`. <br>• Actions stay. <br>• `cardsBelow="md"`. <br>Apply the same order to the verified-agents table, and list its final columns in the session log. | P1 | AC19 |
| **R27** | **`AdminExchangeProvidersView` fits.** <br>• Name takes `tableTitleColumnWidth` + `wrap: true`. Under it, the endpoint shows as `Text size="xs" c="dimmed" ff="monospace" truncate="end"`, and the endpoint column is deleted. <br>• Mode and enabled stack in one cell. <br>• Notes from `xl`; they stay in the card. <br>• Priority and actions stay. <br>• `cardsBelow="md"`. | P1 | AC19 |
| **R28** | **`AdminPagesView` fits.** <br>• Title takes `tableTitleColumnWidth` + `wrap: true` + `lineClamp={2}`. <br>• The slug moves to a dimmed monospace meta line under it, and the slug column is deleted. <br>• Status, updated (`lg`) and actions stay. <br>• `cardsBelow="md"`. | P1 | AC19 |
| **R29** | **`AdminReportsView` fits.** <br>• The listing column takes `tableTitleColumnWidth` + `wrap: true` + `lineClamp={2}`, with the reporter as a dimmed meta line under it. The reporter column is deleted, and the listing column shows from `always`. <br>• Status and date stack in one cell. The date column is deleted. <br>• Reason and chevron stay. | P1 | AC19 |
| **R30** | **`AdminCurrenciesView` fits.** The symbol moves into the code cell as dimmed text after the code, and the symbol column is deleted. Everything else stays. | P2 | AC19 |
| **R31** | **`AgentStatisticsView` (cabinet) fits.** <br>• Delete every percentage `width`. <br>• The title column takes `tableTitleColumnWidth` + `wrap: true` (thumbnail + `lineClamp={2}` link, as today). <br>• Status and visibility stack in one cell. <br>• Keep `cardsBelow="md"`. <br>Then measure. If the table still overflows at 678 (768) or 934 (1024), the views, WhatsApp and form-inquiries counts stack in one right-aligned cell, header `agt10_col_activity_counts` (new key, sq/en/uk/it). Each count is a `Group gap="tight"` with its icon (`Eye`, `MessageCircle`, `Mail`) at `iconSize.badge` and an `aria-label` from the existing column labels. If it still overflows, return `BLOCKED — R31 BUDGET` with the per-column widths. Its Story already renders at production width (full-screen, the View's own `MantineDashboardGrid` gutter). Leave the decorator unchanged. | P1 | AC19 |

### 18.4 Acceptance (Revision 3)

**Measurement method (AC17–AC19).**
- Playwright runs against the rebuilt `storybook-static`. The admin Stories now render inside the real `AdminShell` and
  `AdminPageFrame`, so the script uses no synthetic offset.
- It records the card width per cell and asserts that it equals the production card in §18.2a (±1px). A cell with
  any other card width is invalid, not passing.
- It runs at 768, 1024, 1280 and 1440 × sq/en/uk/it. Below 768 it checks that the cards render.
- Write the results to `88-measurements-r3.json`, together with the script.

- **AC17 [R19–R22] replaces AC12.** For `AdminListingsView` `Default` and `Paginated`:
  - each cell has the `TABLE FIT CHECK` of §7.3: no scroll, nothing clipped, first and last inset 24px;
  - the title has at most two lines, and the meta line is present;
  - the date column shows from 1280 and the ID column from 1440 only.

  Also:
  - `WrappedTitleColumn` fits at 768/1024/1440;
  - the audit links compute to 14px;
  - a grep for `calc(` in `AdminListingsView.tsx` and `AdminTable.stories.tsx` prints nothing.
- **AC18 [R23–R25].**
  - The ten `page.tsx` diffs only swap `Box` for `AdminPageFrame` with the R23 props.
  - `Patterns/Mantine/AdminPageFrame` exists and is enrolled.
  - Every R25 Story renders inside `AdminShell`: at 1440 the navbar is visible, and the content's left edge sits at
    240px + the frame gutter.
  - In each R25 Story at 320/390/1024/1440, the top, right and bottom gutter from the `AppShell.Main` content edge equals
    the route's `AdminPageFrame` gutter: 24, or 32 from 1024 for `responsive`; 24 for `xl`. No side is 0 and none is
    doubled.
  - A grep for `StoryPageGutter` in the R25 Story files prints nothing.
- **AC19 [R20, R26–R31].** Each of `AdminUsersTable` (`Default` and the verified tab), `AdminExchangeProvidersView`,
  `AdminPagesView`, `AdminReportsView` (`AllTab`), `AdminCurrenciesView` and `AgentStatisticsView` `Default` gets the
  `TABLE FIT CHECK` at its production card in all four locales. Below 768, cards render. A grep for `width: '` followed
  by a digit and `%` in the seven table files prints nothing.

### 18.5 Re-entry: `remediation` (Revision 3)

- **Start step:** platform line `70-platform-r3.txt`, then:
  1. R19 → R20 → R23 → R24;
  2. the ten `page.tsx` swaps;
  3. R21 → R22 → R25;
  4. R26 → R31;
  5. rebuild Storybook → measurements → the §18.6 gate block → receipts.
- **Do not re-run or overwrite:** evidence `01`–`61` and every `plant-*` file. P1–P6 are not re-run. Opus's `90-*`
  files are read-only.
- **Write set:**
  - `src/design-system/mantine/theme.ts` (R19, one key);
  - `src/components/admin/AdminTable.tsx` (R20);
  - new `src/components/admin/AdminPageFrame.tsx` (R23);
  - the ten `src/app/admin/**/page.tsx` files named in R23 (the `Box` swap and its imports only);
  - `src/components/admin/AdminListingsView.tsx` (R21), `AdminUsersTable.tsx` (R26), `AdminExchangeProvidersView.tsx`
    (R27), `AdminPagesView.tsx` (R28), `AdminReportsView.tsx` (R29), `AdminCurrenciesView.tsx` (R30);
  - `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` (R31);
  - new `src/stories/_StoryAdminShell.tsx` and new `src/stories/patterns/mantine/AdminPageFrame.stories.tsx`;
  - the Story files named in R24/R25, `AdminTable.stories.tsx` (R22), and `AgentStatisticsView.stories.tsx` (only if a
    fixture needs a longer title);
  - `messages/{sq,en,uk,it}.json`, only for R31's `agt10_col_activity_counts` if that branch is taken;
  - `scripts/mantine-migration-scope.json` (enrol `AdminPageFrame`), `scripts/surface-census-baseline.json` (only lines
    the census names for the touched surfaces), `docs/component-catalog.md` (`AdminPageFrame`, `AdminTable`
    `visibility`/`cardsBelow`);
  - tests that select a deleted column. List each one.
  - the session log ("Revision 3" section), evidence `70`+ with an `-r3` suffix, and the 857 cell of
    `docs/backlog.md`.
- **Forbidden:**
  - `MantineDataTableToCards.tsx`;
  - the legacy managers (`AdminCompaniesManager`, `AdminPropertyTypesManager`, `AdminSupportManager`, `AdminLegalManager`,
    `AdminLocationsManager`, `AdminPopularLocationsManager`), which belong to 916 and 859;
  - the dialogs and their Stories;
  - every R13/R14 file;
  - any `docs/*rule*.md`, `docs/golden-rules.md`, `docs/mantine-responsive-design-system.md`.
- **Negative branches:**
  - If a table cannot meet AC17/AC19 with its R21–R31 layout, stop for that table with
    `BLOCKED — R<n> BUDGET` and the per-column widths. Finish the others.
  - If an R25 Story cannot render inside `AdminShell` (a missing mock), stop with `BLOCKED — R25 SHELL <story>`. Do not
    fall back to `StoryPageGutter`.

### 18.6 Gate block (Revision 3)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\70-platform-r3.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\71-census-r3.txt"
npm.cmd run test *>&1 | Tee-Object "$ev\72-tests-r3.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\73-typecheck-r3.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\74-lint-r3.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\75-story-coverage-r3.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\76-rendered-scope-r3.txt"
npm.cmd run check:surface-census:changed -- --base HEAD *>&1 | Tee-Object "$ev\77-census-changed-r3.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\78-design-tokens-r3.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\79-enrolled-tailwind-r3.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\80-i18n-r3.txt"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\81-type-responsive-r3.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\82-file-integrity-r3.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\83-mojibake-r3.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\83b-listing-visibility-r3.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\84-storybook-build-r3.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\85-build-r3.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\86-status-after-r3.txt"
```

Record every exit code. Normalise the transcripts to UTF-8 without BOM through Node. Write `git hash-object` of every
Revision 3 file to `87-hash-object-r3.txt` in the same pass.

**Expected:** `win32`; the four calibration FAIL lines; every other exit 0. If the whole `npm.cmd run test` run fails on
a file this revision does not touch, record it with its first failing line and run the touched test files alone.
Report both results; do not fix unrelated tests.

### 18.7 Receipts (Revision 3)

- **GR-0:** one each for `tableTitleColumnWidth` (EXTEND `theme.other.layout`), `AdminTable` `'xxl'` + `cardsBelow`
  (EXTEND), `AdminPageFrame` (CREATE: the search shows ten hand-written `Box` wrappers and no shared owner), and
  `withAdminShell` (EXTRACT from `AdminDashboardView.stories.tsx`).
- **GR-3a:** one for `Patterns/Mantine/AdminPageFrame` (CREATE).
- **GR-1:** the census of `src/app/admin/listings/page.tsx`; `check:surface-census:changed` covers the other nine
  surfaces.
- **GR-3b, GR-3c and GR-3d:** one each for every R25 Story, `AdminPageFrame`, `WrappedTitleColumn` and
  `AgentStatisticsView` `Default`, at 320/390/1024/1440 (type also at 768).
- **§7.3 `TABLE FIT CHECK`:** one per table export named in AC17/AC19.
- **GR-2:**
  - `check:design-tokens` cannot see token arithmetic or a percentage width; the AC17/AC19 greps close that.
  - `check:story-coverage` cannot see where a Story renders; AC18's measurement closes that.

### 18.8 Owner matrix after Revision 3 (O78-12, re-issued)

The 38 tuples of §17.8 stay. Added rows:

| Rows | Tuples |
|---|---|
| `AdminUsersTable`, `AdminExchangeProvidersView`, `AdminPagesView`, `AdminReportsView`, `AdminCurrenciesView`, `AgentStatisticsView`: `Default` × sq/uk × 1024/1440 | 24 |
| `AdminInquiriesView`, `AdminPermissionsView`, `AdminUserProfileView` (`View`), `AdminCurrencyTabs`, `AdminPageFrame` (`shell`): `Default` × sq × 1440 | 5 |
| `AdminListingsView` `Default` × uk × 1024 (the production card at its narrowest) | 1 |

**68 tuples.** Opus re-measures every Story in the matrix (GR-3b/3c/3d and §7.3) before the owner sees it.

---

## 19. Review 4 — `NEEDS REVISION`, 2026-10-02 → Revision 4 (R31 only: `AgentStatisticsView` cards to 1024, dates merged)

Opus inspected the real diff, the `-r3` evidence and the session log's "Revision 3" section, and re-measured
independently. Script and raw output: `docs/sessions/evidence/task857/91-opus-review4-measure.{mjs,json}`, `win32`
v22.22.3, the current `storybook-static` (no source file is newer than the build), uk + sq.
- **R19–R30 are verified.** All six admin tables and `WrappedTitleColumn` fit at 768/1024/1280/1440, at the
  production card width: listings 720/720/976/1136, users 720/736/992/1152, the four `page`/`narrow` Views 720/720/960
  (832)/960 (832). The navbar is 240 from 1024. The ten `page.tsx` diffs only swap `Box` for `AdminPageFrame` with
  the R23 props. The `calc(` and percentage-width greps print nothing, and no R25 Story file names `StoryPageGutter`.
- **`npm run test`: 4 failures, none from this task.** `css-var-resolvability` (`--width-content`, Task 869) and
  `appimage-config-class-assertions` are already listed under **790**. `mantine-story-scope.test.ts:20` has been red
  since Task 896 emptied the exact-title hatch at `HEAD`; it is added to 790's row. `globals.css`, `appImageConfig`
  and the hatch are not in this diff.
- **R31 is `NOT IMPLEMENTED`. The table still scrolls**, which confirms the executor's `BLOCKED — R31 BUDGET`. Overflow
  at 768 is +283…+395 and at 1024 is +27…+139, with the card at 678/934.

**Do not touch anything outside the §19.5 write set.** R13–R30, the dialogs, every R25 Story and their evidence stay
as they are.

### 19.1 Owner decision, 2026-10-02 (verbatim option chosen)

Opus asked: *"Which layout should it use?"* The owner chose *"Cards to 1024 + dates merged (Recommended)"*. Its full
text:
- this table shows cards below 1024 instead of 768, an exception to §7.3 rule 2 for this table only;
- expiry and last activity stack in one cell;
- no data is hidden at any width.

Opus recorded the exception in `docs/mantine-responsive-design-system.md` §7.3 rule 2 (named list: `AgentStatisticsView`).

### 19.2 Measured basis (Opus simulation, `91-opus-review4-measure.json` → `agt`)

Columns were hidden in the live DOM, and the table was re-measured.

| Width | Locale | All six columns | Without last activity | Without expires | Without both dates |
|---|---|---|---|---|---|
| 768 (client 676) | sq / en / uk / it | +363 / +283 / +395 / +330 | +151 / +90 / +196 / +129 | +177 / +93 / +208 / +129 | fit / fit / **+9** / fit |
| 1024 (client 932) | sq / en / uk / it | +107 / +27 / +139 / +74 | fit ×4 | fit ×4 | fit ×4 |

- At 768, no layout that shows every value fits, hence the owner's cards-to-1024 decision.
- At 1024, five columns fit in every locale. Natural widths, uk, the tightest: title 212 + status 144 + one date 199 +
  counts 181 + actions 149 = 885, against 932. The merged cell adds an icon (≈20px), so the INFERENCE is that it fits
  with about 27px to spare. Measure it; do not assume.

### 19.3 New requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R32** | **`MantineDataTableToCards` (EXTEND, `src/design-system/mantine/patterns/MantineDataTableToCards.tsx`).** `cardsBelow` gains `'lg'`. It uses the same CSS switch as `'md'`: `<Box hiddenFrom="lg">{cardsMarkup}</Box><Box visibleFrom="lg">{tableMarkup}</Box>`, with no `useMediaQuery`. Update the prop's JSDoc and the component header comment. `'sm'` and `'md'` output must not change. **Story:** add `CardsBelowLg` to `Mantine/Primitives/Table` (`src/stories/mantine/primitives/Table.stories.tsx`), modelled on `CardsBelowMd` (`:164-195`), with the same fixture and `cardsBelow="lg"`. | P1 | AC20 |
| **R33** | **`AgentStatisticsView` (`src/modules/cabinet/statistics/components/AgentStatisticsView.tsx`).** <br>1. `MantineDataTableToCards` takes `cardsBelow="lg"` (§19.1). <br>2. The `expires` and `activity` columns are replaced by one column. Key `dates`, header `t('agt10_col_dates')`, a new key in sq/en/uk/it: sq `Datat`, en `Dates`, uk `Дати`, it `Date`. Its cell is `Stack gap="tight" align="flex-start"` with two lines: <br>• `Group gap="tight" wrap="nowrap" role="group" aria-label={t('agt10_col_expires')}`, holding `CalendarClock` at `theme.other.iconSize.badge` (`aria-hidden="true"`) and then `expiresCell(row)`; <br>• the same with `aria-label={t('agt10_col_activity')}`, `Activity` and `lastActivityCell(row)`. <br>No `width`, and no `wrap`: each line stays on one row. <br>3. The three `Group`s of the `counts` cell gain `role="group"`. Without a role, ARIA ignores an `aria-label` on a generic `div`, so screen readers never announced it. <br>4. Columns, in order: title · status (+ visibility) · dates · counts · actions. The title column (token width, `wrap`) and the status/visibility stack do not change. <br>5. The card (`card` config, `:383-396`) does not change. It keeps every value separately labelled. <br>6. Remove the R31 comment that calls the counts cell a "fallback". Write one comment that cites §7.3 (b) and the §19.1 decision. | P1 | AC20 |
| **R34** | **`AdminTable.tsx` JSDoc.** The `width` doc example `'40%'` contradicts §7.3 rule 6. Replace it with `theme.other.layout.tableTitleColumnWidth`. This is a comment-only change. | P3 | AC20 |
| **R35** | **Receipts owed from Revision 3 (§18.7).** Write GR-3b, GR-3c and GR-3d receipts for `AgentStatisticsView` `Default` and `AdminTable` `WrappedTitleColumn` at 320/390/1024/1440 (type also at 768), and a GR-3b/3d receipt for `Mantine/Primitives/Table` `CardsBelowLg`. Rewrite the `AgentStatisticsView` `TABLE FIT CHECK` line from the new measurement. The Revision 3 line (`89-receipts-r3.txt:127`) claimed "clipped: NONE; first/last inset 24/24" while its own numbers showed last insets of −339…−3. A receipt must state what its numbers show. | P2 | AC20 |

### 19.4 Acceptance (Revision 4)

- **AC20 [R32–R35].**
  - **`AgentStatisticsView` `Default`, at 1024, 1280 and 1440 × sq/en/uk/it.** The `TABLE FIT CHECK` (§7.3) passes at
    cards of 934/1190/1350 (±1px): no scroll, nothing clipped, first and last inset 24. The headers in order are title ·
    status · dates · counts · actions.
  - **The same Story at 390 and 768 (sq/uk).** No visible `<table>`, and cards render with every labelled value.
  - **`Mantine/Primitives/Table`, at 1000 and 1024 (sq).** `CardsBelowLg` shows cards at 1000 and the table at 1024.
    `CardsBelowMd` and `Default` at 700 and 1024 behave as before the change (cards/table at the same widths).
  - **In the rendered `dates` and `counts` cells,** every `[aria-label]` element has `role="group"` (Playwright).
  - **Greps.** A grep for `'expires'` and `'activity'` as column `key`s in `AgentStatisticsView.tsx` prints nothing. A
    grep for `'40%'` in `AdminTable.tsx` prints nothing.
  - **`check:i18n`** exits 0 with `agt10_col_dates` in all four locales.
  - **R35:** the receipts exist in `99-receipts-r4.txt`.

**Negative branch.** If the `dates` column overflows at 1024 in any locale, stop with `BLOCKED — R33 BUDGET` and the
per-column widths per locale. Do not hide a column, shrink a font or add a width.

### 19.5 Re-entry: `remediation` (Revision 4)

- **Start step:** platform line `92-platform-r4.txt`, then R32 → R33 → R34. Then rebuild Storybook, take the
  measurements (write `98-measure-r4.mjs` and `98-measurements-r4.json`), run the §19.6 gate block, and write the receipts.
- **Do not re-run or overwrite:** evidence `01`–`91` and every `plant-*` file. Opus's `90-*` and `91-*` files are
  read-only.
- **Write set:**
  - `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (R32, the `'lg'` branch and its comments only);
  - `src/stories/mantine/primitives/Table.stories.tsx` (R32, the `CardsBelowLg` export only);
  - `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` (R33);
  - `messages/{sq,en,uk,it}.json` (R33, `agt10_col_dates` only). Leave `agt10_col_activity_counts` alone; it stays in use;
  - `src/components/admin/AdminTable.tsx` (R34, one comment);
  - tests that select the removed `expires`/`activity` columns, if any. List each one;
  - `docs/component-catalog.md` (the `MantineDataTableToCards` `cardsBelow` row);
  - the session log ("Revision 4" section), evidence `92`+ with the `-r4` suffix, and the 857 cell of `docs/backlog.md`.
- **Forbidden:** every other file, including every R19–R30 file, every R25 Story, the dialogs, the legacy managers, and
  any `docs/*rule*.md`, `docs/golden-rules.md` or `docs/mantine-responsive-design-system.md`.

### 19.6 Gate block (Revision 4)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\92-platform-r4.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\93-census-r4.txt"
npm.cmd run test *>&1 | Tee-Object "$ev\94-tests-r4.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\95-typecheck-r4.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\95b-lint-r4.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\95c-story-coverage-r4.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\95d-rendered-scope-r4.txt"
npm.cmd run check:surface-census:changed -- --base HEAD *>&1 | Tee-Object "$ev\95e-census-changed-r4.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\95f-design-tokens-r4.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\95g-enrolled-tailwind-r4.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\95h-i18n-r4.txt"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\95i-type-responsive-r4.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\95j-file-integrity-r4.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\95k-mojibake-r4.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\95l-listing-visibility-r4.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\96-storybook-build-r4.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\96b-build-r4.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\97-status-after-r4.txt"
```

- Record every exit code. Normalise the transcripts to UTF-8 without BOM through Node.
- In the same pass, write `git hash-object` of every Revision 4 file to `97b-hash-object-r4.txt`.
- **Expected:** `win32`; the four calibration FAIL lines; every other gate exits 0.
- **`npm.cmd run test`:** expect the same 4 failures in the three files named at the top of §19 and no others. If any
  other test fails, report it with its first failing line, and run the touched test files alone.

### 19.7 Owner matrix after Revision 4 (O78-12, re-issued)

The 68 tuples of §18.8 stay. In the `AgentStatisticsView` rows, the 1024/1440 table is now the merged-dates layout.
Added rows:

| Rows | Tuples |
|---|---|
| `AgentStatisticsView` `Default` × uk × 768 (cards, the new range) | 1 |
| `Mantine/Primitives/Table` `CardsBelowLg` × sq × 1024 | 1 |

**70 tuples.** Opus re-measures every Story in the matrix (GR-3b/3c/3d and §7.3) before the owner sees it.

---

## 20. Review 5 — `PARTIALLY VERIFIED`, 2026-10-02: implementation verified, owner matrix O78-12 owed

No executor work remains. The only open criterion is the owner's visual review of O78-12 (§19.7, 70 tuples).

**Verified by Opus:**
- **Source.** R32 adds a `'lg'` branch that is the same CSS switch as `'md'`; `'sm'` and `'md'` are untouched. R33's
  columns are title · status · dates · counts · actions, with `cardsBelow="lg"` and five `role="group"` labels, and
  the card config is unchanged. R34 is a comment-only change. `agt10_col_dates` is in all four locales. No live
  caller remains for any of the 15 removed `admin.listings.*` keys.
- **Gates.** Every `-r4` gate exits 0, except the census with its four calibration FAIL lines.
  - `npm run test` timed out on an overloaded machine: an unrelated `node.exe`, PID 39052, has run since 30.09.
  - The sequential full run, `94c`, shows exactly the 4 known failures (790).
- **Independent measurement.** `100-opus-review5-matrix.{mjs,json}` and `100-opus-review5-summary.txt`, `win32`
  v22.22.3, `storybook-static` built after the last source change. It covers every matrix Story at
  320/390/768/1024/1440 × sq/uk, plus `AgentStatisticsView` at 1024/1280/1440 in en/it, plus the Table primitive at
  700/1000/1023. Results:
  - **Fit.** No document overflow and no table scroll in any of the 247 cells.
  - **`AgentStatisticsView`.** It shows cards below 1024. From 1024 the table sits on the production card (934/1190/1350) with 24/24 insets in all four locales.
  - **Table primitive.** `CardsBelowLg` shows cards to 1023 and the table at 1024. `CardsBelowMd` and `Default` are unchanged.
  - **Admin frame (GR-3d).** Every admin Story's frame gutter is 24/24/24/24, or 32 on all sides from 1024 for
    `responsive`. Content sits flush inside the frame, and the navbar is 240 from 1024.
  - **Headings (GR-3c).** No heading exceeds 20px below 640.
  - **Dialogs.** The four dialog sources and Stories are byte-identical to their `58-hash-object-r2.txt` hashes,
    measured in review 2.
- **NOTE (no action).** AC20's "every `[aria-label]` has `role=group`" was over-broad wording by Opus. The
  `<time aria-label>` of the shared `RelativeTime` maps to the ARIA `time` role, which allows an author name.

**Next:** the owner reviews the 70 tuples of §19.7. On acceptance, Opus approves 857 and archives it. On a return,
Opus writes the next revision section.

---

## 21. Owner return on O78-12, 2026-10-02 → `NEEDS REVISION`, Revision 5 (text buttons stack; the canonical radio is round)

The owner reviewed part of the §19.7 matrix and returned two rows. Every other row is still open: the owner has not yet
accepted it.

### 21.1 Owner returns and decisions, 2026-10-02 (verbatim)

1. **`ListingPreviewDialogView`, all states:** *"я неодноразово вже казав, що текстові кнопки мають бути у стовпчик (
   кожна у своєму рядку). Наразі я бачу. що другорядні текстові кнопки стоять … в одному рядку. Я маю на увазі кнопки
   "View listing" і "Open public page". … Зроби … золоте правило!"* Opus asked about scope, and the owner chose *"Yes,
   exactly that (Recommended)"*: a group of text buttons is a column, and a lone destructive text button in the footer
   stays where §23.6 puts it.
2. **`PremiumDialogView`, the radios:** *"Коло має бути колом … Наразі візуально я бачу багатокутник, а не коло."*
   Then: *"radio buttons мають мати коло у компоненті, ніякого хардкоду лише в одному попапі, це має бути глобально
   пофікшено"*. Opus asked about size, and the owner chose *"20px circle, 10px dot (Recommended)"*.

**New rules (written by Opus, 2026-10-02):**
- `docs/golden-rules.md` **GR-3e** "Text buttons stack" and **GR-3f** "A circle renders as a circle";
- `docs/mantine-responsive-design-system.md` §23.6 (the text-button bullet);
- `docs/tailadmin-style-reference.md` §6g (20px circle, 10px dot);
- the three skills (`create-task`, `execute-task` items 8–9, `review-task` items 9–10).

### 21.2 Measured causes (Opus)

- **Text buttons.** `ListingPreviewDialogView.tsx` renders "View listing" and "Open public page" in
  `<Group gap="xs" wrap="wrap">` (the `showDeleteConfirm ? … : (…)` branch near the end of the body), so they share a
  row whenever they fit.
- **Radio.** The `Radio` theme entry (`theme.ts`, `components.Radio`) pins `size: 'xs'`, which gives a 16px circle and,
  through Mantine `--radio-icon-size-xs`, a **6px** dot. Opus's `deviceScaleFactor: 1` crops at 10× are in
  `docs/sessions/evidence/task857/101-radio-variants.png` (script `101-radio-variants.mjs`; border variants in
  `101b-radio-variants-borders.png`):
  - the 16px ring with its 1px `gray-3` border shows facets;
  - the 6px dot, and an 8px one, render as rounded squares;
  - only 20px with a 10px dot reads as a circle.

  The CSS is a perfect circle (`border-radius` 16px on a 16px box). Rasterisation is the problem. No other production file
  renders a Mantine `Radio`, and the legacy `radio-group.tsx` has no consumer.

### 21.3 New requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R36** | **`ListingPreviewDialogView` (GR-3e).** Replace the tertiary `<Group gap="xs" wrap="wrap">` with `<Stack gap="xs" align="flex-start">`. "View listing" comes first and "Open public page" second, one per row at every width. Both buttons keep their props and the `isListingHidden` condition. The footer's resting destructive Delete does not change (§23.6). Drop `Group` from the import if it is no longer used. | P1 | AC21 |
| **R37** | **The canonical radio (GR-3f, EXTEND the `Radio` theme entry in `src/design-system/mantine/theme.ts`).** <br>• `defaultProps: { size: 'sm' }`: the 20px circle. <br>• Add `vars: () => ({ root: { '--radio-icon-size': '0.625rem' } })`: the 10px dot. Follow the existing `vars` precedent in the same file (`Button`, `:969`). <br>• Rewrite the entry's comment. It cites the owner decision of 2026-10-02 (*"20px circle, 10px dot (Recommended)"*), GR-3f and §6g, and drops the "16px / too large" wording. <br>• `body` (44px row) and `label` (14px gray-7) do not change. Leave `input-chrome.css` alone unless the crop shows a state that needs it; report any change. <br>• No consumer and no Story may set `size`, `--radio-size` or `--radio-icon-size` on a `Radio`. | P1 | AC22 |
| **R38** | **`Mantine/Primitives/Radio` (`src/stories/mantine/primitives/Radio.stories.tsx`).** Update the state captions that say "16px circle" and "8px center dot" to 20px and 10px. Change nothing else. | P2 | AC22 |
| **R39** | **Receipts.** <br>• One `GR-3e TEXT BUTTONS STACKED` per `ListingPreviewDialogView` and `PremiumDialogView` export. <br>• One `GR-3f CIRCLE CHECK` for the radio, unchecked and checked, in `Mantine/Primitives/Radio` `Default` and `PremiumDialogView` `NotPremium`. Each crop is taken at `deviceScaleFactor: 1`, scaled 10× pixelated, and saved as `103-radio-crops-r5.png`. <br>• GR-3b/3c/3d for `Mantine/Primitives/Radio` `Default`. Its gutter answer is `n/a: MantineStoryShell primitive`. | P1 | AC21, AC22 |

### 21.4 Acceptance (Revision 5)

- **AC21 [R36, R39].** In every `ListingPreviewDialogView` export with both buttons, at 390 and 1440 × sq/uk, the "Open
  public page" button's top is at or below the "View listing" button's bottom, and both left edges are equal (±1px). No
  two text buttons share a row in any export of the two dialog Stories.
- **AC22 [R37–R39].**
  - In `Mantine/Primitives/Radio` `Default` and `PremiumDialogView` `NotPremium` at 1440 (sq), `.mantine-Radio-radio`
    measures 20×20 and the checked `.mantine-Radio-icon` measures 10×10 (±0.5px).
  - The device-scale-1 crops in `103-radio-crops-r5.png` show a round ring and a round dot. Opus confirms this by
    looking at them before the owner matrix.
  - A grep over `src` for `--radio-size`, `--radio-icon-size` and a `size=` prop on `<Radio` prints only the theme entry.
  - Every other state in `Mantine/Primitives/Radio` (focus, error, disabled) still renders as before. The receipts
    state this.

### 21.5 Re-entry: `remediation` (Revision 5)

- **Start step:** platform line `102-platform-r5.txt`, then R36 → R37 → R38. Then rebuild Storybook, take the
  measurements and crops (write `103-measure-r5.mjs`, `103-measurements-r5.json` and `103-radio-crops-r5.png`), run the
  §21.6 gate block, and write the receipts to `104-receipts-r5.txt`.
- **Do not re-run or overwrite:** evidence `01`–`101` and every `plant-*` file. Opus's `90-*`, `91-*`, `100-*` and
  `101*` files are read-only.
- **Write set:**
  - `src/components/admin/ListingPreviewDialogView.tsx` (R36 only);
  - `src/design-system/mantine/theme.ts` (R37, the `Radio` entry only);
  - `src/stories/mantine/primitives/Radio.stories.tsx` (R38, captions only);
  - `src/design-system/mantine/input-chrome.css`, only if R37's crop shows it is needed, and say so;
  - tests that assert the old radio size or the old `Group`, if any. List each one;
  - the session log ("Revision 5" section), evidence `102`+ with the `-r5` suffix, and the 857 cell of `docs/backlog.md`.
- **Forbidden:** every other file. That includes `PremiumDialogView.tsx` (it inherits the theme), every R13–R35 file,
  and every `docs/*rule*.md`, `docs/golden-rules.md`, `docs/mantine-responsive-design-system.md` and
  `docs/tailadmin-style-reference.md`.
- **Negative branch:** if the theme `vars` cannot set the dot to 10px, stop with `BLOCKED — R37 DOT` and the measured
  dot size. Do not set it in a consumer or a Story.

### 21.6 Gate block (Revision 5)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\102-platform-r5.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\102b-census-r5.txt"
npx.cmd vitest run --testTimeout=60000 --no-file-parallelism *>&1 | Tee-Object "$ev\102c-tests-r5.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\102d-typecheck-r5.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\102e-lint-r5.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\102f-story-coverage-r5.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\102g-rendered-scope-r5.txt"
npm.cmd run check:surface-census:changed -- --base HEAD *>&1 | Tee-Object "$ev\102h-census-changed-r5.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\102i-design-tokens-r5.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\102j-enrolled-tailwind-r5.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\102k-i18n-r5.txt"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\102l-type-responsive-r5.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\102m-file-integrity-r5.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\102n-mojibake-r5.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\102o-listing-visibility-r5.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\102p-storybook-build-r5.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\102q-build-r5.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\102r-status-after-r5.txt"
```

- Record every exit code. Normalise the transcripts to UTF-8 without BOM through Node.
- In the same pass, write `git hash-object` of every Revision 5 file to `102s-hash-object-r5.txt`.
- **Expected:** `win32`; the four calibration FAIL lines; tests with exactly the 4 known failures (790); every other gate
  exits 0.
- **Why the test line differs:** the test line is sequential with a 60s timeout because Revision 4 measured timeouts
  under load (`94c`).

### 21.7 Owner matrix after Revision 5 (O78-12, re-issued)

- The §19.7 matrix stays, 70 tuples. The two returned groups, `ListingPreviewDialogView` (14) and `PremiumDialogView`
  (6), are re-issued with the fix.
- Added rows: `Mantine/Primitives/Radio` `Default` × sq × 390, 1440 (2).
- **72 tuples.** Before the owner sees them, Opus re-measures every Story in the matrix: GR-3b/3c/3d/3e, §7.3, and
  GR-3f by looking at the crops.

---

## 22. Review 6 — `NEEDS REVISION`, 2026-10-02 → Revision 6 (the canonical radio's focus and disabled states follow §6g)

### 22.1 Verdict on Revision 5

R36–R39 are verified by Opus. `win32 v22.22.3`, `storybook-static` built after the last source write, and the shipped
hashes equal `102s-hash-object-r5.txt`.
- **R36 / AC21.** `ListingPreviewDialogView.tsx:176-202` is a `Stack gap="xs" align="flex-start"`. In
  `105-opus-review6.json`, every export at 390/1440 × sq/uk has "Open public page" below "View listing" with equal left
  edges, and no overflow.
- **R37 / AC22.** The theme entry is `size: 'sm'` with `--radio-icon-size: 0.625rem`. In `Mantine/Primitives/Radio`
  `Default` (320/390/1024/1440) and `PremiumDialogView` `NotPremium` (1440, first radio checked), every
  `.mantine-Radio-radio` is 20×20 and every checked `.mantine-Radio-icon` is 10×10. Executor gap: `103-measurements-r5.json`
  has `icon: null` for `PremiumDialogView`, and Opus closed that measurement. The grep prints only the theme entry.
- **GR-3f.** `103-radio-crops-r5.png` and Opus's `105-opus-radio-crops.png` show a round ring and a round dot.
- **Gates.** The exit codes are as expected: only the four 790 tests and the four container calibration lines fail.

**Blocking: AC22's last bullet ("focus, error, disabled still render as before") was not checked.** The receipt says
"not re-measured". Opus measured it and found that two states break §6g's authoritative state matrix
(`docs/tailadmin-style-reference.md` §6g, "always-verify-styles gate: every state above is verified against the rendered
Radio before approval"). Both defects predate Revision 5 and do not come from it. They are blocking anyway, for three
reasons: this task changes the `Radio` theme entry, `Mantine/Primitives/Radio` `Default` is now an owner-matrix row, and
`PremiumDialogView` `Saving` renders the disabled defect in production.

### 22.2 Measured defects (Opus, `105b-opus-radio-disabled-focus.{mjs,json}`, `105-opus-radio-crops.png`)

- **F1 — focus border.** §6g's focus row requires a "brand ring + brand border" on keyboard focus. The radio under
  `:focus-visible` measures `border-color rgb(208, 213, 221)` (gray-3) and carries the 3px brand-5 10% ring.
  - Cause: `input-chrome.css:233` `.mantine-Radio-radio:not(:checked):not([data-checked])` has specificity (0,3,0).
    That beats `:238` `.mantine-Radio-radio:focus-visible` at (0,2,0), so the brand border never applies.
- **F2 — disabled chrome stacked under the fade.** §6g's disabled row requires the whole control at opacity 0.5 and
  nothing else, with the circle and dot dimming together. Rendered:
  - disabled, unchecked: bg `rgb(228, 231, 236)` instead of white;
  - disabled, checked: bg `rgb(228, 231, 236)`, border gray-3 and a dot `rgb(102, 112, 133)`. The selected option loses
    its brand fill and white dot. This is `PremiumDialogView` `Saving` in production, where the chosen duration shows as
    a gray dot on gray.
  - Cause: Mantine `Radio.css:82-90`. `.m_8a3dbb89:disabled` sets `--mantine-color-disabled` bg and border, and its
    `+ icon` sets `--radio-icon-color: var(--mantine-color-disabled-color)`. The checked rule at `:100-108` applies only
    `:not(:disabled)`. `input-chrome.css:268-271` resets only the input's opacity.

### 22.3 New requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R40** | **Focus border (F1), `src/design-system/mantine/input-chrome.css` Radio block only.** <br>• Under `:focus-visible`, an unchecked, non-error radio shows `border-color` brand-7 plus the existing 3px brand-5 10% ring. <br>• A checked radio keeps its brand border. <br>• An error unchecked radio keeps the red-6 border and red ring under focus, because error wins over focus. <br>• Mouse focus (`:focus:not(:focus-visible)`) shows no ring, as now. <br>• Achieve this by raising the focus rule's specificity above the resting rule, for example `.mantine-Radio-radio:not(:checked):not([data-checked]):focus-visible`, and keep the error rule winning by source order or specificity. No `!important`. Keep the existing comment style, and cite §6g and Task 857 R40. | P1 | AC23 |
| **R41** | **Disabled chrome (F2), the same file and block.** A disabled radio renders exactly like its enabled state, and the root's existing `opacity: 0.5` is the only dim. <br>• Unchecked: bg as the enabled resting radio (measured `rgb(255, 255, 255)`), border gray-3. <br>• Checked: bg brand-7, border brand-7, white 10px dot. <br>• Neutralise Mantine's `:disabled` bg, border and `--radio-icon-color` on `.mantine-Radio-radio:disabled` and its `+ .mantine-Radio-icon`. For the checked case, also set the icon's `--radio-icon-opacity: 1` and `--radio-icon-transform: none`, because Mantine applies them only `:not(:disabled)`. Use theme variables only (`--mantine-color-brand-7`, `--mantine-color-gray-3`, `--mantine-color-white` or the resting value's variable). <br>• `cursor: not-allowed` stays. No focus ring when disabled, as now. | P1 | AC23 |
| **R42** | **Story captions.** In `Mantine/Primitives/Radio` `Default`, only if a caption contradicts the new rendering, correct that caption. Change no other line. | P3 | AC23 |
| **R43** | **Receipts.** <br>• `GR-3f CIRCLE CHECK` for each of the eight radios in `Mantine/Primitives/Radio` `Default`, with focus taken by keyboard (Tab). <br>• `GR-3f CIRCLE CHECK` for `PremiumDialogView` `Saving`, checked and unchecked. <br>• The crops go in `107-radio-states-r6.png`: DPR 1, 10× pixelated. <br>• GR-3b/3c/3e for `Default` and `Saving`. GR-3d: `n/a: MantineStoryShell primitive` and `n/a: overlay-only`. | P1 | AC23 |

### 22.4 Acceptance (Revision 6)

- **AC23 [R40–R43].** Computed in `storybook-static` at 1440 (sq), written to `107-measurements-r6.json`:
  - `Default` radio 3 under keyboard `:focus-visible`: `border-color` equals the checked radio's brand-7 value, and the
    `box-shadow` ring is present.
  - `Default` radio 4 (error, unchecked) under keyboard focus: `border-color` is red-6 (`rgb(217, 45, 32)`).
  - `Default` radio 7 (disabled, checked) and the checked radio in `PremiumDialogView` `Saving`: `background-color` and
    `border-color` equal the enabled checked radio's (`rgb(236, 84, 71)`). The checked `.mantine-Radio-icon` is 10×10,
    has opacity 1 and is white. The root opacity is 0.5.
  - `Default` radio 6 (disabled, unchecked): `background-color` equals the enabled unchecked radio's, the border is
    gray-3, and the root opacity is 0.5.
  - Radios 1, 2, 5 and 8 are unchanged from `105b-opus-radio-disabled-focus.json` (bg, border, icon colour).
  - The crops in `107-radio-states-r6.png` read as circles. Opus looks at them before the owner matrix.
  - All of AC21 and AC22 still hold. Re-run the `103-measure-r5.mjs` logic as `107-measure-r6.mjs`, so that nothing is
    overwritten.

### 22.5 Re-entry: `remediation` (Revision 6)

- **Start step:** platform line `106-platform-r6.txt`, then R40 → R41 → R42. Then rebuild Storybook, measure (`107-*`),
  run the §22.6 gate block, and write the receipts to `108-receipts-r6.txt`.
- **Do not re-run or overwrite:** evidence `01`–`105` and every `plant-*` file. Opus's `100-*`, `101*` and `105*`
  files are read-only.
- **Write set:**
  - `src/design-system/mantine/input-chrome.css` (the Radio block only, R40/R41);
  - `src/stories/mantine/primitives/Radio.stories.tsx` (R42 captions only, if needed);
  - tests that assert the old radio chrome, if any. List each one;
  - the session log ("Revision 6" section), evidence `106`+ with the `-r6` suffix, and the 857 cell of `docs/backlog.md`.
- **Forbidden:** every other file. That includes `theme.ts` (R37 is verified), `PremiumDialogView.tsx`,
  `ListingPreviewDialogView.tsx`, every R13–R35 file, and every rule document.
- **Negative branch:** if any AC23 value cannot be reached from `input-chrome.css` with theme variables and without
  `!important`, stop with `BLOCKED — R41 <state>` and the measured value. Do not set chrome in a consumer or a Story.

### 22.6 Gate block (Revision 6)

The §21.6 block, with every `102*-r5` output renamed `106*-r6` (`106-platform-r6.txt` … `106r-status-after-r6.txt`).
Write the hash-object line of every Revision 6 file to `106s-hash-object-r6.txt`. The expected results are unchanged:
`win32`; the four calibration FAIL lines; tests with exactly the 4 known failures (790); every other gate exits 0.

### 22.7 Owner matrix after Revision 6 (O78-12)

The §21.7 matrix stays, at 72 tuples, plus `PremiumDialogView` `Saving` × sq × 390 and 1440 if it is not already a row.
Before the owner sees it, Opus re-measures GR-3b/3c/3d/3e and §7.3 for every Story in the matrix, and looks at
`107-radio-states-r6.png` for GR-3f.

---

## 23. Review 7 — `PARTIALLY VERIFIED`, 2026-10-02: Revision 6 verified, owner matrix O78-12 owed

No executor work remains. The only open criterion is the owner's visual review of O78-12 (§23.2, 74 tuples).

### 23.1 Verified by Opus

- **Source.** The only Revision 6 change is the Radio block of `input-chrome.css` (R40: a (0,5,0) focus rule that
  excludes `[data-error]`; R41: four disabled rules on theme variables). It has no `!important`. The shipped hashes equal
  `106s-hash-object-r6.txt`. `theme.ts`, `Radio.stories.tsx` and `ListingPreviewDialogView.tsx` are unchanged from
  their Revision 5 hashes. `storybook-static` was built after the CSS write.
- **AC23.** Opus measured it independently in `109-opus-review7.{mjs,json}` (`win32` v22.22.3, 1440 sq):
  - keyboard focus on radio 3: border `rgb(236, 84, 71)` plus the ring;
  - keyboard focus on the error radio 4: border `rgb(217, 45, 32)` plus the red ring;
  - mouse focus: no ring;
  - disabled checked (`Default` 7 and `Saving` 1): bg and border brand-7, dot 10×10, white, opacity 1, root 0.5;
  - disabled unchecked: white with a gray-3 border, root 0.5;
  - radios 1, 2, 5 and 8 are identical to `105b`.
- **GR-3f.** `107-radio-states-r6.png` reads as circles in all 13 crops.
- **Gates.** The `106*-r6` exit codes are as expected: four calibration census lines, the four 790 tests, and 0 for the
  rest.
- **GR-3e over the whole matrix.** Measured in `109b-opus-matrix-gr3e.{mjs,json}`: 17 non-dialog Stories × sq/uk ×
  390/1024/1440, with the dialogs in `105-opus-review6.json`. No popup has two text buttons in one row.
  - The only shared row is the chart legend in `AgentStatisticsView` (`MantineDashboardChartLegend`) at 1024/1440.
  - That legend is page content, not a popup. The owner clarified on 2026-10-02, verbatim: *"я тобі писав про кнопки у
    попапах"*. GR-3e and the three skills now say "popups only".
- **GR-3b/3c/3d and §7.3.** Review 5's 247-cell measurement (`100-opus-review5-*`) still holds for every Story in the
  matrix. Revisions 5 and 6 changed only the two dialogs and the radio. Opus re-measured those in `105-*` and `109-*`:
  no overflow, and the modal titles are 16px.

### 23.2 Owner matrix O78-12 — the complete list (74 tuples)

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminListingsView` | `Default`, `VisibleFilter`, `HiddenEligible`, `Paginated` | sq, uk | 390, 1440 | 16 |
| `Patterns/Mantine/AdminListingsView` `Default` | — | en, it | 1024 | 2 |
| `Patterns/Mantine/AdminListingsView` `Default` | — | uk | 1024 | 1 |
| `Patterns/Mantine/ListingPreviewDialogView` | `Active`, `SoldStatusActions`, `DeleteConfirm`, `Premium` | sq, uk (`Premium`: sq) | 390, 1440 | 14 |
| `Patterns/Mantine/PremiumDialogView` | `NotPremium`, `Premium`, `CustomDate`, `Saving` | sq | 390, 1440 | 8 |
| `AdminUsersTable`, `AdminExchangeProvidersView`, `AdminPagesView`, `AdminReportsView`, `AdminCurrenciesView`, `AgentStatisticsView` | `Default` | sq, uk | 1024, 1440 | 24 |
| `AgentStatisticsView` `Default` | — | uk | 768 | 1 |
| `AdminInquiriesView`, `AdminPermissionsView`, `AdminUserProfileView` (`View`), `AdminCurrencyTabs`, `AdminPageFrame` (`Shell`) | `Default` / named | sq | 1440 | 5 |
| `Mantine/Primitives/Table` `CardsBelowLg` | — | sq | 1024 | 1 |
| `Mantine/Primitives/Radio` `Default` | — | sq | 390, 1440 | 2 |

**On acceptance:** Opus approves 857, archives it, and emits the commit and push handoff. **On a return:** Opus writes
the next revision section.

---

## 24. Owner return on O78-12, 2026-10-02 → `NEEDS REVISION`, Revision 7 (the dialogs on the canonical dialog anatomy)

### 24.1 Owner return and decision (verbatim)

- On `ListingPreviewDialogView` (`110-owner-return-current-dialog.png`): *"мені всеодно не подобається хаос у попапі.
  … Немає чіткої ієрархії, немає чіткого UX … Подивись … як взагалі має бути з нормальним UI/UX!"*. The owner sent
  references (`110-ref-timeline-sharing.png`, `110-ref-payment-share.png`, `110-ref-truefi-set.png`), then
  https://demo.tailadmin.com/ and https://techzaa.in/lahomes/admin/property-grid.html. Opus captured the latter two as
  `110-ref-tailadmin-modal-{1440,390}.png` and `110-ref-lahomes-{grid,details}.png` (scripts `110-ref-capture.mjs`
  and `110b-ref-capture.mjs`).
- Decision: *"я хочу, щоб ти зробив UI/UX такий, як на прикладах, які я тобі надав!"*.
- Opus turned the references into the binding rule `docs/mantine-responsive-design-system.md` **§23.7 "Dialog
  anatomy"**, and amended §23.6's placement bullet to point at it. **§23.7 is the visual source of this revision.**
  Its parts table names every value. Do not take a value from anywhere else.
- Scope, chosen by Opus under the owner's instruction (reversible): 857 builds the anatomy and moves its own two dialogs
  onto it. Task 915 moves the other `MantineModal` consumers (its reserved row is updated in the same edit).

### 24.2 Measured causes (Opus)

- **Structural.** `MantineModal.tsx` accepts only `title`, `children` and `footer`. The repository has no dialog
  header description, no dialog divider, no dialog section, no detail list and no navigation row. Searched
  `src/design-system/mantine/patterns/` (63 files) and `src/stories`. Every dialog therefore improvises:
  `ReportDetailDialogView.tsx:189-253` repeats the same caption-over-value grid as `ListingPreviewDialogView.tsx:133-167`.
- **`ListingPreviewDialogView` today (`110-owner-return-current-dialog.png`, 1340px):**
  - an editable control (the status select) sits inside a grid of read-only facts;
  - six facts are small captions over values, with no grouping;
  - two text buttons float in the body with 44px rows and no container;
  - three footer buttons have three different weights;
  - the listing itself (photo, place, features) is absent. The admin query selects no image, address or features
    (`src/app/admin/listings/page.tsx:60-63`).
- **`PremiumDialogView` today:** the listing title is plain dimmed text, the durations are bare radios with no card or
  description, and the footer holds three buttons of different weights.
- **References:**
  - every dialog has a header with an optional icon tile, a title and a muted description, then a divider;
  - sections are separated by dividers;
  - facts are label-left / value-right rows on a tinted panel (`110-ref-truefi-set.png` "Withdraw");
  - navigation is full-width rows with an arrow (`110-ref-truefi-set.png` "Metamask →");
  - a choice is a bordered radio card with a description, and the checked card is tinted (`110-ref-payment-share.png`);
  - the footer is an equal-width `[secondary][primary]` pair, even at 390 (`110-ref-tailadmin-modal-390.png`);
  - a listing is shown by photo, badge, title, place, feature chips and price (`110-ref-lahomes-*.png`).

### 24.3 Canonical UI decision record (GR-0)

| Visible artifact | Searched / inspected | Disposition | Canonical owner and Story |
|---|---|---|---|
| Dialog header (icon tile, title, description, round close) and the header and footer dividers | `MantineModal.tsx`; `responsiveBottomSheet.tsx:127-172`; theme `Modal` entry (`theme.ts:1271-1276`); `Modal.stories.tsx` | **EXTEND** | `MantineModal`: new optional props `structured?: boolean`, `description?: ReactNode`, `icon?: ReactNode`. `ResponsiveBottomSheet`: new optional `header?: ReactNode`, which replaces its 14px title `Text` when given and keeps the existing divider and drag handle. Story: `Mantine/Primitives/Modal`, new export `Structured`. |
| Dialog sections | no section primitive exists; `MantineFormSection` (`MantineFormSectionStack.tsx:20-33`) is a bordered page card, not a dialog section | **CREATE** | `src/design-system/mantine/patterns/MantineDialogSections.tsx` (`MantineDialogSections`, `MantineDialogSection`). Story: `Patterns/Mantine/DialogSections`. |
| Facts panel | `MantineDataTableToCards.tsx:386-399` meta rows (label left / value right inside a table card, with no panel) | **CREATE**, reusing that row rhythm | `MantineDetailList.tsx`. Story: `Patterns/Mantine/DetailList`. |
| Navigation rows | none in the patterns; `MantineDashboardWorkList` is a dashboard card list | **CREATE** | `MantineNavRowList.tsx`. Story: `Patterns/Mantine/NavRowList`. |
| Radio cards | Mantine 8 ships `Radio.Card` and `Radio.Indicator` (`node_modules/@mantine/core/esm/components/Radio/RadioCard`, `RadioIndicator`); the theme has no entry for either | **EXTEND** the theme | `theme.ts` `RadioCard` and `RadioIndicator` entries. The indicator is 20px with a 10px dot, like the `Radio` entry (GR-3f). Story: `Mantine/Primitives/Radio`, new export `Card`. |
| Dialog footer | `MantineResponsiveActionFooter` (a sticky page footer with an inline `style`, not a dialog footer) | **CREATE** | `MantineDialogFooter.tsx`. Story: `Patterns/Mantine/DialogFooter`. |
| ~~Listing summary in the dialog~~ **Superseded by §25 (R56): removed.** | `MantineListingCardPattern` `layout="list"` (`:61-113`); `getCardFeatures` (`presentationEngine.ts:93`); `ListingCard.tsx:137-210` (the list-row mapper); `AppImage` `listing-thumb` | **REUSE** | No new chrome. The dialog passes `image`, `badges`, `features`, `data` and `isPremium`, with no `onClick`, `favorite` or `footerActions`. |

`new hardcoded visual values: NONE`. Every value in §23.7 is a theme key (`fz`, `c`, `radius`, `variant`) or an existing
token. Write the GR-0 and GR-3a receipts for each row above.

### 24.4 Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R44** | **`MantineModal` `structured` (§23.7 Header and Footer).** <br>• From 640px, the header renders as follows. The optional `icon` sits in a `ThemeIcon variant="light" size="xl" radius="md"` tile. Next to it the title (`fz="lg"`, `fw={600}`, `lineClamp={2}`) and the optional `description` (`fz="sm"`, `c="dimmed"`, `lineClamp={2}`) stack. The close button is `ActionIcon variant="light" color="gray" radius="xl"` with an `X` icon, top-right, and an i18n `aria-label`. Below the header is a full-bleed `Divider`. <br>• The body has the modal's padding. <br>• When `footer` is given, a full-bleed `Divider` comes before it. <br>• Below 640px the same header block (icon, title, description) goes to `ResponsiveBottomSheet` through its new `header` prop. The sheet stays as §23.4 defines it: drag handle, pinned header with divider, scrolling body, and no close button. <br>• Without `structured`, every current consumer renders byte-for-byte as before. Prove this with the Modal `Default` Story and one untouched consumer Story, `ReportDetailDialogView` `Default`: DOM snapshot hashes before and after. | P1 | AC24 |
| **R45** | **`MantineDialogSections` / `MantineDialogSection`.** <br>• A section has an optional `title` (`fz="md"`, `fw={500}`), an optional `description` (`fz="sm"`, `c="dimmed"`), and `children`, with `gap="sm"`. <br>• `MantineDialogSections` stacks its child sections with a full-bleed `Divider` between them and `py="lg"` inside each. It renders no divider before the first section or after the last. <br>• The dividers run edge to edge inside the structured modal body. The body pads with Mantine's `--mb-padding` (`ModalBase.css:13,50`), so the dividers bleed with `mx="calc(var(--mb-padding, var(--mantine-spacing-md)) * -1)"`. In the sheet they bleed by the `SheetContent` gutter in the same way, through its theme spacing key. A raw px value is not allowed; if neither form works, stop with `BLOCKED — R45 BLEED`. The same rule applies to R44's header and footer dividers. | P1 | AC25 |
| **R46** | **`MantineDetailList`.** <br>• Props: `items: { label: string; value: ReactNode }[]`. <br>• Renders a `Paper bg="gray.0" radius="md" p="md"` holding a `Stack gap="sm"`. Each row is a `Group justify="space-between" align="flex-start" wrap="nowrap" gap="md"`: the label (`fz="sm"`, `c="dimmed"`) and the value (`fz="sm"`, `fw={500}`, `ta="right"`, allowed to wrap). <br>• At 320px a long value wraps under its own column and never overflows. | P1 | AC25 |
| **R47** | **`MantineNavRowList`.** <br>• Props: `items: { key; icon: ReactNode; label: string; description?: string; href?: string; external?: boolean; onClick?: () => void }[]`. <br>• Renders one `Paper withBorder radius="md"`, with a `Divider` between rows. <br>• Each row is a full-width `UnstyledButton`. With `href` it renders as `next/link` (`target="_blank"` and `rel="noopener noreferrer"` when `external`). It is at least 56px tall, with `px="md" py="sm"` and a `gray.0` hover background through the theme. <br>• A row contains a `ThemeIcon variant="light" color="gray" size="lg" radius="md"`, the label (`fz="sm"`, `fw={500}`), the optional description (`fz="xs"`, `c="dimmed"`), and a trailing `ChevronRight` (or `ArrowUpRight` when `external`) in `c="dimmed"`. <br>• Each row has a visible focus ring. | P1 | AC25 |
| **R48** | **`MantineDialogFooter`.** <br>• Props: `primary: ReactNode`, `secondary?: ReactNode`. <br>• With both, renders `SimpleGrid cols={2} spacing="sm"` at every width, secondary first (left). With one, renders it at full width. <br>• The buttons are the caller's, but this footer forces `fullWidth` and `mih` = `theme.other.touchTarget` (44px) through its own wrapper, so a caller cannot break the pair. | P1 | AC25 |
| **R49** | **Radio cards (theme).** <br>• `RadioCard`: `radius: 'md'`, `withBorder`, `p="md"`. When checked: `border-color` brand-7 and `background` brand-0, in `input-chrome.css`'s Radio block, using theme variables. <br>• `RadioIndicator`: `size: 'sm'` (20px) and `--radio-icon-size: 0.625rem` (10px), with the §6g colours, focus and disabled behaviour of R40/R41. <br>• `Mantine/Primitives/Radio` gets a `Card` export showing three cards (one checked, one with a description, one disabled) under the same caption style. | P1 | AC26 |
| **R50** | **Listing data for the dialog. Narrowed by §25 R57: only `premium_until` stays.** <br>• `src/app/admin/listings/page.tsx`'s select adds `premium_until, address, rooms, bedrooms, bathrooms, area_gross, area_net, floor, total_floors, location:locations(name_al), images:listing_images(url, is_cover, "order")`, following the precedent in `src/modules/cabinet/lib/queries.ts:30`. <br>• `AdminListing` gains the matching optional fields. <br>• The table's columns, filters, counts and pagination do not change. <br>• Add one test to `AdminListingsTable.smoke.test.tsx` (or the page's existing test) that asserts the select string contains `images:listing_images`. | P1 | AC27 |
| **R51** | **`ListingPreviewDialogView` on the anatomy** (container `ListingPreviewDialog.tsx` maps the data; the View stays presentational). <br>• `MantineModal structured size="lg"`. Title: the listing title. Description: `{typeLabel}` (no icon). <br>• `MantineDialogSections`, in this order: <br>&nbsp;&nbsp;1. **Superseded by §25 R56: this section is removed.** **(no title)** `MantineListingCardPattern layout="list"`. `image` is `AppImage variant="listing-thumb"` with the cover (the `is_cover` image, else the first). `data` is title, location (`location.name_al`, else `address`, else empty) and the formatted price. `badges` is the status badge (the existing status label) plus Premium when `is_premium`. `features` come from `getCardFeatures`, mapped with `ListingFeatureIcon` exactly as `ListingCard.tsx:254-257` does. `isPremium` is set. There is no `onClick`, `favorite` or `footerActions`. <br>&nbsp;&nbsp;2. **`t('col_status')`**: `StatusChangeSelect` at full width (`w="100%"`). <br>&nbsp;&nbsp;3. **`t('preview_section_details')`**: `MantineDetailList`. Rows: visibility (the existing green/red `Badge`), agent, created (`RelativeTime`), and Premium (`t('premium_active_until', { date })` from `premium_until`, else `t('premium_inactive')`). <br>&nbsp;&nbsp;4. **(no title)** `MantineNavRowList`. Rows: `Eye` "View listing" (`btn_view`, the admin preview `href`); `ExternalLink` "Open public page" (`btn_open_public`, `external`, only when `!isListingHidden`); `Star` "Manage premium" (`premium_manage`, description = the same Premium state string, `onClick={onPremium}`). <br>• **Footer:** `MantineDialogFooter`. The secondary is Delete: `variant="default"`, `leftSection` `Trash2`, `c="red.7"`, opens the confirm step. The primary is Edit: filled, `Pencil`, the existing edit `href`. <br>• **Confirm step:** the sections become one section, `t('delete_confirm')` with `t('delete_dialog_body')` as its description. The footer becomes `[Cancel (default)][Delete (filled color="red", loading=deleting)]`. The status select is not rendered in this step. <br>• All current behaviour stays: status change and its toasts, premium opening `PremiumDialog`, delete and cancel, the hidden-listing rule, and `target="_blank"` on Edit. | P1 | AC28 |
| **R52** | **`PremiumDialogView` on the anatomy.** <br>• `MantineModal structured size="md"`, `icon` = `Star` in the tile, title `t('premium_dialog_title')`, description = the listing title. <br>• Sections: <br>&nbsp;&nbsp;1. When `isPremium`: `MantineDetailList` with one row, the Premium state (`premium_active_until`). <br>&nbsp;&nbsp;2. **`t('premium_quick_label')`**: `Radio.Group` of `Radio.Card`s, one per preset plus the custom card (`premium_custom_date`). Each card shows the label. When the custom card is checked, `RangeDatePicker` (unchanged props) renders below the cards. <br>&nbsp;&nbsp;3. When `isPremium`: a section with a lone `Button variant="subtle" color="red"` + `Trash2` "Remove premium" (§23.6, lone destructive text button). <br>• **Footer:** `[Cancel (default)][Save (filled, loading=saving, disabled until a choice)]`. <br>• `saving` disables every card. The disabled checked card shows the §6g disabled look (R41). <br>• The View gains a `premiumUntil: string \| null` prop, which the container passes. | P1 | AC29 |
| **R53** | **i18n**, under `admin.listings` in all four locales: `preview_section_details` (en "Details", uk "Деталі"), `premium_manage` (en "Manage premium", uk "Керувати Premium"), `premium_active_until` (en "Active until {date}", uk "Активний до {date}"), `premium_inactive` (en "Not premium", uk "Не Premium"). Also add `common.close` if it is missing (for the close button's `aria-label`). Translate sq and it naturally, and the owner reviews them in the matrix. Delete no key that has a live caller. | P1 | AC28, AC29 |
| **R54** | **Stories.** <br>• Each new pattern gets its own Story file importing it by name (GR-3), with every state listed in R45–R48. Enrol each new `.tsx` in `scripts/mantine-migration-scope.json` (`check:pattern-enrolment`). <br>• `ListingPreviewDialogView.stories.tsx` and `PremiumDialogView.stories.tsx` keep their exports. Their fixtures gain a cover image (an existing Storybook fixture image; reuse the one `ListingCardPattern.stories.tsx` uses), `address`/`location`, the features fields, and `premium_until` in `Premium`. They gain one export each: `NoPhotoNoFeatures` (the listing has no images and no feature fields) and `PremiumActive`. **Superseded by §25 R58: `NoPhotoNoFeatures` and the card fixture fields are removed.** | P1 | AC30 |
| **R55** | **Receipts:** GR-0, GR-1, GR-2, GR-3, GR-3a, GR-3b, GR-3c, GR-3d, GR-3e and GR-3f, one per changed or new Story, in `116-receipts-r7.txt`. | P1 | AC30 |

### 24.5 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Dialog title | dialog heading | 18 | 18 | 18 | 18 | `fz="lg"` | §23.7 (TailAdmin title, reduced to the 20px phone cap) |
| Dialog description | body | 14 | 14 | 14 | 14 | `fz="sm"` | §23.7 |
| Section title | section heading | 16 | 16 | 16 | 16 | `fz="md"` | §23.7 (`110-ref-timeline-sharing.png` "Roles") |
| Section description, detail label | body | 14 | 14 | 14 | 14 | `fz="sm"` | §23.7 |
| Detail value, nav label | body | 14 | 14 | 14 | 14 | `fz="sm"` | §23.7 |
| Nav description | meta | 12 | 12 | 12 | 12 | `fz="xs"` | §23.7 |
| Listing card in the dialog | — | — | — | — | — | the pattern's own scale | `MantineListingCardPattern` (unchanged) |

Nothing reaches 24px, and no child heading is larger than the 18px dialog title.

### 24.6 GR-3b / 3d / 3e / 3f lines

- **GR-3b.** The dialogs and the Modal `Structured` export are overlays. The new pattern Stories have fluid containers,
  with no `w`/`maw`/`style` and no viewport pin.
- **GR-3d:**
  - the two dialog Stories and Modal `Structured`: `n/a: overlay-only`;
  - `DialogSections`, `DetailList`, `NavRowList` and `DialogFooter`: `StoryPageGutter all` (no own gutter), wrap in this
    task;
  - `Mantine/Primitives/Radio` `Card`: `n/a: MantineStoryShell primitive`.
- **GR-3e.** The only text button left in a popup is the lone "Remove premium". The navigation lives in
  `MantineNavRowList`, which has no text buttons. Receipt per dialog export.
- **GR-3f.** The `RadioIndicator` in the radio cards: 20px with a 10px dot, unchecked, checked, disabled checked and
  keyboard focus. The `ThemeIcon` tiles are radius `md` squares, not circles. The round close button
  (`ActionIcon radius="xl"`) gets a DPR-1 crop. Write the crops to `115-circles-r7.png`.

### 24.7 Acceptance (Revision 7)

- **AC24 [R44].** At 1440 sq, Modal `Structured` measures: title 18px/600, description 14px; a header divider and a
  footer divider each span the modal's full inner width (±1px); the close button is round, 36px or more, top-right. At
  390 the same header renders inside the sheet under the drag handle, and the sheet's own 14px title is absent. The
  DOM hashes of Modal `Default` and `ReportDetailDialogView` `Default` are identical before and after
  (`113-unstructured-hash-r7.json`).
- **AC25 [R45–R48].** Every Story state renders at 320/390/1024/1440 with no overflow:
  - DetailList: a long uk value wraps at 320;
  - NavRowList: each row is 56px or more, the external row's link has `rel="noopener noreferrer"`, and the focus ring
    is visible on Tab;
  - DialogFooter: two buttons of equal width (±1px) at 320 and 1440, each 44px or more; a single button spans the full
    width;
  - DialogSections: a full-bleed divider between sections, and none before the first.
- **AC26 [R49].** In Radio `Card`, the checked card has border brand-7 and bg brand-0, the indicator is 20×20 and the
  dot 10×10, and the disabled checked card shows the R41 look. The DPR-1 crops read as circles.
- **AC27 [R50].** The new test passes, `npm run typecheck` and `npm run build` exit 0, and the `AdminListingsView`
  Stories render the same rows, columns and pagination as in `100-opus-review5-matrix.json` (re-measure their row
  count and column headers at 1440 sq).
- **AC28 [R51, R53].** In `ListingPreviewDialogView` `Active`, `Premium`, `Hidden`, `SoldStatusActions`,
  `NoPhotoNoFeatures` and `DeleteConfirm`, at 390/1440 × sq/uk:
  - the sections are in the R51 order;
  - ~~the listing card shows a photo …~~ superseded by §25 AC31: there is no listing card;
  - `Hidden` has no "Open public page" row;
  - the footer is an equal-width `[Delete][Edit]` pair, and `[Cancel][Delete]` in `DeleteConfirm`;
  - nothing overflows;
  - the body has no text button.
- **AC29 [R52, R53].** In `PremiumDialogView` `NotPremium`, `Premium`, `PremiumActive`, `CustomDate` and `Saving`, at
  390/1440 × sq/uk:
  - the radio cards are in place, and the custom card reveals the picker;
  - "Remove premium" appears only when premium;
  - the footer is an equal-width `[Cancel][Save]` pair;
  - in `Saving`, every card is disabled and the checked one keeps its brand fill under the fade.
- **AC30 [R54, R55].** The Stories exist and import their components by name. The patterns are enrolled. All receipts
  are present. `check:story-coverage`, `check:pattern-enrolment` and `check:rendered-scope` exit 0.

### 24.8 Positive and negative flows (Revision 7)

| Branch | Applies | Handling |
|---|---|---|
| Positive: open the preview, change the status, open premium, save, delete | Yes | R51/R52, with current behaviour kept |
| Listing with no photo or no feature fields | No (§25 R56: no card) | — |
| Hidden listing | Yes | no public-page row (`isListingHidden`) |
| Premium with no `premium_until` | Yes | Show `premium_inactive` when `premium_until` is null even if `is_premium`. Count it in the census as a data quirk and do not invent a date. |
| Long uk title or values at 320 | Yes | title clamped to 2 lines; detail values wrap |
| Status change fails | Yes | unchanged (the `StatusChangeSelect` error toast) |
| Delete in flight | Yes | `loading` on Delete, Cancel disabled (unchanged) |
| Keyboard | Yes | the close button, nav rows and radio cards are reachable by Tab with a visible ring |
| RLS / auth | No | the admin route's existing guard and client are unchanged; the select only adds columns of the same rows (the cabinet precedent) |

### 24.9 Re-entry: `remediation` (Revision 7)

- **Start step:** platform line `111-platform-r7.txt`; then the DOM hashes of Modal `Default` and `ReportDetailDialogView`
  `Default` on the current `storybook-static` (`113-unstructured-hash-r7.json`, "before"). Then R49 → R44 → R45–R48
  (each with its Story) → R50 → R51 → R52 → R53 → R54.
- **Do not re-run or overwrite:** evidence `01`–`110` and every `plant-*` file. Opus's `100*`, `101*`, `105*`, `109*`
  and `110*` are read-only.
- **Write set:**
  - `src/design-system/mantine/patterns/MantineModal.tsx` and `responsiveBottomSheet.tsx` (the `header` prop only);
  - new `MantineDialogSections.tsx`, `MantineDetailList.tsx`, `MantineNavRowList.tsx` and `MantineDialogFooter.tsx`,
    plus `patterns/index.ts` if the patterns export from it;
  - `theme.ts` (the `RadioCard` and `RadioIndicator` entries only) and `input-chrome.css` (the Radio block, card
    checked state);
  - the Stories: `Modal.stories.tsx` (`Structured`), `Radio.stories.tsx` (`Card`), four new pattern Stories,
    `ListingPreviewDialogView.stories.tsx` and `PremiumDialogView.stories.tsx`;
  - `ListingPreviewDialogView.tsx`, `ListingPreviewDialog.tsx`, `PremiumDialogView.tsx`, `PremiumDialog.tsx`,
    `AdminListingsTable.tsx` (the type and the mapping only) and `src/app/admin/listings/page.tsx` (the select only);
  - `messages/{sq,en,uk,it}.json` (R53 keys only) and `scripts/mantine-migration-scope.json`;
  - the tests that assert the old dialog layout. List each one;
  - the session log ("Revision 7" section), evidence `111`+ with the `-r7` suffix, and the 857 cell of `docs/backlog.md`.
- **Forbidden:** every other file. That includes the other `MantineModal` consumers (Task 915), every R13–R43 file not
  listed above, and every rule document.
- **Negative branches:**
  - if a §23.7 value cannot be expressed with a theme key, stop with `BLOCKED — R<n> TOKEN` and name the value;
  - if `structured=false` changes any existing consumer's DOM hash, stop with `BLOCKED — R44 BLAST`.

### 24.10 Gate block (Revision 7)

The §21.6 block, renamed `112*-r7` (`112-platform-r7.txt` … `112r-status-after-r7.txt`), with these additions:
`npm.cmd run check:pattern-enrolment *>&1 | Tee-Object "$ev\112t-pattern-enrolment-r7.txt"`, and the hash-object line
of every Revision 7 file to `112s-hash-object-r7.txt`. The expected results are unchanged: `win32`; the four
calibration FAIL lines; tests with exactly the 4 known failures (790) plus none new; every other gate exits 0.

### 24.11 Owner matrix after Revision 7 (O78-12)

The §23.2 matrix stays (74 tuples). Its `ListingPreviewDialogView` (14) and `PremiumDialogView` (8) rows are re-issued
on the new anatomy, plus these rows:

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `ListingPreviewDialogView` | `NoPhotoNoFeatures` (removed by §25), `Hidden` | sq, uk | 390, 1440 | 8 |
| `PremiumDialogView` | `PremiumActive` | sq, uk | 390, 1440 | 4 |
| `Mantine/Primitives/Modal` `Structured` | — | sq | 390, 1440 | 2 |
| `Mantine/Primitives/Radio` `Card` | — | sq | 390, 1440 | 2 |
| `DialogSections`, `DetailList`, `NavRowList`, `DialogFooter` | `Default` | uk | 320, 1440 | 8 |

**98 tuples.** Before the owner sees them, Opus re-measures GR-3b/3c/3d/3e/3f and §7.3 for every Story in the matrix,
and compares the two dialogs side by side with `110-ref-*`.

---

## 25. Review 8 — `NEEDS REVISION`, 2026-10-03 → Revision 8 (the listing card leaves the preview dialog)

### 25.1 Owner return (verbatim) and what it means

- Owner, 2026-10-03, on Revision 7: *"Все ок, єдине що я не зрозумів - навіщо блок з фото та короткою інфою про
  оголошення в модальному вікні? Саме цей блок створює скролл."*
- Opus's answer: the card was Opus's own design (§24.2 last bullet, §24.3 last row, R51 section 1). Opus extrapolated
  it from the Lahomes **listing pages** (`110-ref-lahomes-*.png`). None of the owner's **dialog** references
  (`110-ref-timeline-sharing.png`, `110-ref-payment-share.png`, `110-ref-truefi-set.png`, `110-ref-tailadmin-modal-*`)
  shows a summary of the subject. In the dialog the card repeats what is already there: the title (the dialog header),
  the status (the status select) and Premium (the Details row). The table row the admin clicked stays visible behind the
  modal.
- **Decision (Opus, under the owner's return; reversible):** the card section is removed, together with the data only
  it needed. Everything else in Revision 7 stays as accepted.
- The rule document was corrected in the same edit. `docs/mantine-responsive-design-system.md` §23.7 no longer has a
  "Summary of an entity" part, and it now forbids repeating the subject in a dialog. Its icon tile size now reads 44px
  (`size="xl"`), which matches R44 and the executor's measurement.

### 25.2 Measured cause (Opus, `114-patterns-mantine-listingpreviewdialogview--active-{1440,390}.png`)

- At 1440×900 the modal runs from y 45 to y 855. The card section spans y 156→341 (≈185px). It pushes the nav rows
  below the body's fold, so the body scrolls.
- Without that section the content is about: header 111 + status 121 + details 232 + nav rows ≈218 + footer 77 ≈ 759px.
  That is under the ≈810px the modal has (INFERENCE from the screenshot geometry; the executor measures it, AC32).
- At 390 the bottom sheet still scrolls after the removal. That is §23.4's designed behaviour (pinned header and
  footer, scrolling body) and is not a defect.

### 25.3 Side findings fixed in the same pass

- **P3: the Story fixture shows a raw enum.** `ListingPreviewDialogView.stories.tsx:70` builds `typeLabel` from
  `listing.property_type`, so the owner saw "Shitje · apartment" in sq. Production maps the label
  (`AdminListingsTable.tsx:110`, `propertyTypes.find(...)?.label`). The Story must show a translated property-type
  label, as production does.
- **P3: the nav row focus ring is not "the same ring" its comment claims.** `MantineNavRowList.module.css` draws
  `inset 0 0 0 3px` at `brand-7 40%`. Every other ring in `input-chrome.css` (`:25`, `:45`, `:64`, `:309` …) is
  `brand-5 10%`. The 40% value is a new visual value (GR-0).

### 25.4 Requirements (they supersede the parts of R50, R51, R54 and AC28 named below)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R56** | **No listing card in `ListingPreviewDialogView`.** <br>• Delete section 1 of R51 (the `MantineListingCardPattern`). The sections are now, in order: `t('col_status')` (status select), `t('preview_section_details')` (`MantineDetailList`), then the nav rows. The header, footer, confirm step and all behaviour stay as in R51. <br>• Remove the now-unused imports and code from the View (`MantineListingCardPattern`, `AppImage`, `ListingFeatureIcon`, `getCardFeatures`, the cover lookup, the card features mapping), and any prop the container passed only for the card. <br>• Do not compress spacing, change §23.7 values or drop a section to remove a scroll. | P1 | AC31, AC32 |
| **R57** | **The data goes with the card (narrows R50).** <br>• `src/app/admin/listings/page.tsx`'s select keeps `premium_until`. It drops `address, rooms, bedrooms, bathrooms, area_gross, area_net, floor, total_floors, location:locations(name_al), images:listing_images(url, is_cover, "order")`. Drop only the columns Revision 7 added; compare with the file's committed version and leave every older column. <br>• Remove the matching optional fields from `AdminListing` (`AdminListingsTable.tsx:30-39`), except a field that a non-card caller reads. Grep each field before deleting it and list the result. <br>• T9 in `AdminListingsTable.smoke.test.tsx` now asserts that the select contains `premium_until` and does **not** contain `listing_images`. Update its comments (`:25-26`, `:452-455`). | P1 | AC31 |
| **R58** | **Stories (supersedes R54's `NoPhotoNoFeatures`).** <br>• `ListingPreviewDialogView.stories.tsx`: delete the `NoPhotoNoFeatures` export, the card-only fixture fields (`FIXTURE_COVER_URL`, `images`, `rooms` … `total_floors`, `address`, the `location` override at `:69`) and their comments. Keep `Active`, `SoldStatusActions`, `Hidden`, `DeleteConfirm` and `Premium`. <br>• The Story's `typeLabel` renders the translated property-type label the way `AdminListingsTable.tsx:110` does: a fixture `{ value, label }` list built from the existing i18n property-type keys, not a literal. <br>• `PremiumDialogView.stories.tsx` is unchanged. | P1 | AC31 |
| **R59** | **Superseded by §26 R61 (the value below is not visible).** **The nav row focus ring uses the canonical ring.** The `:focus-visible` rule in `MantineNavRowList.module.css` uses the colour expression of `input-chrome.css:25` (`color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent)`). It stays inset, because the list clips, and keeps the gray-0 background. Correct the comment. If the Tab crop shows the ring is not visible on gray-0, do not pick another value: report `BLOCKED — R59 RING` with the crop, and Opus decides. | P3 | AC33 |
| **R60** | **Receipts:** GR-0, GR-3a, GR-3b, GR-3c, GR-3d and GR-3e for each changed Story export (`ListingPreviewDialogView` × 5, `NavRowList` `Default`), in `121-receipts-r8.txt`. GR-3f is unchanged, because no circle changed. | P1 | AC31 |

### 25.5 Acceptance (Revision 8)

- **AC31 [R56–R58, R60].** In `ListingPreviewDialogView` `Active`, `SoldStatusActions`, `Hidden`, `DeleteConfirm` and
  `Premium`, at 390/1440 × sq/uk:
  - there is no listing card and no `<img>` in the dialog;
  - the sections are status → details → nav rows;
  - the description shows the translated property type in sq and uk, never a raw enum;
  - `NoPhotoNoFeatures` does not exist;
  - a search for `MantineListingCardPattern`, `getCardFeatures` and `listing_images` in
    `src/components/admin/ListingPreviewDialog*.tsx` and `src/app/admin/listings/page.tsx` finds nothing;
  - T9 passes with the new assertions.
- **AC32 [R56].** In `Active` and `Premium` at 1440×900, sq and uk, the structured modal body has
  `scrollHeight <= clientHeight` (no scroll). Record both numbers per cell in `120-measure-r8.json`. If a cell still
  scrolls, record each section's height and stop with `BLOCKED — AC32 HEIGHT`. Do not change any spacing.
- **AC33 [R59].** In `NavRowList` `Default` at 1440, Tab onto row 1. The DPR-1 crop (`122-navrow-focus-r8.png`) shows a
  visible ring. A mouse click shows none.
- **AC34.** The §25.7 gate block gives the expected results, and `npm run build` exits 0.

### 25.6 Re-entry: `remediation` (Revision 8)

- **Start step:** platform line `118-platform-r8.txt`, then R56 → R57 → R58 → R59 → R60.
- **Do not re-run or overwrite:** evidence `01`–`117` and every `plant-*` file.
- **Write set:**
  - `ListingPreviewDialogView.tsx` and `ListingPreviewDialog.tsx`;
  - `AdminListingsTable.tsx` (the `AdminListing` type and card-only mapping only);
  - `src/app/admin/listings/page.tsx` (the select only);
  - `__tests__/AdminListingsTable.smoke.test.tsx` (T9 only);
  - `ListingPreviewDialogView.stories.tsx` and `MantineNavRowList.module.css`;
  - the session log ("Revision 8" section), evidence `118`+ with the `-r8` suffix, and the 857 cell of
    `docs/backlog.md`.
- **Forbidden:** every other file, including `MantineListingCardPattern` and every rule document. Delete no i18n key.
  R53's four keys still have callers; confirm that with a grep and record it.

### 25.7 Gate block (Revision 8)

Run the §24.10 block, renamed `119*-r8`: `119-platform-r8.txt` … `119r-status-after-r8.txt`, `119s-hash-object-r8.txt`
with every Revision 8 file, and `119t-pattern-enrolment-r8.txt`. Expected: `win32`; the four calibration FAIL lines;
tests with exactly the 4 known 790 failures and none new; every other gate exits 0.

### 25.8 Owner matrix after Revision 8 (O78-12)

The owner accepted every other Revision 7 tuple on 2026-10-03 (*"Все ок"*, §25.1). Only these are re-issued:

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/ListingPreviewDialogView` | `Active`, `SoldStatusActions`, `Hidden`, `DeleteConfirm`, `Premium` | sq, uk | 390, 1440 | 20 |

**20 tuples.** Before they reach the owner, Opus re-measures GR-3b/3c/3d/3e and AC32 on them. **On acceptance:** Opus
approves 857, archives it, and emits the commit and push handoff.

---

## 26. Review 9 — `NEEDS REVISION`, 2026-10-03 → Revision 9 (the nav row focus is visible)

### 26.1 Verified by Opus (Revision 8)

- **Source.** R56–R58 are as specified: `ListingPreviewDialogView.tsx` has no card, image or feature code. The select in
  `page.tsx` keeps `premium_until` and selects no `listing_images`. `AdminListing` keeps only `premium_until`. T9 asserts
  both directions. The Story has no `NoPhotoNoFeatures` export and labels the property type.
- **Freshness.** Every Revision 8 source file was written before the gate run (00:14–00:15; tests 00:22, build 00:25).
  `119q-build-r8.txt` ends `EXIT_CODE=0`.
- **Measurement.** `123-opus-review9.{mjs,json}` (`win32` v22.22.3) covers 5 states × sq/uk × 320/390/768/1440, 40 cells:
  - no horizontal overflow and no `<img>`;
  - from 768, no scrolling element in the dialog (AC32);
  - below 640 only the sheet body scrolls (§23.4, by design);
  - largest text 18px (GR-3c);
  - no subtle or transparent text button (GR-3e);
  - footer pairs equal, 44px tall;
  - `Hidden` has 2 nav rows, the other states have 3.
  GR-3d: `n/a: overlay-only`.
- **Tests.** The fifth failure, `overlay-dual-declaration`, passes alone after the build (6/6). It needs the built CSS,
  and the suite ran before the build. `check:file-integrity` flags only `docs/sessions/evidence/task917/20-review-gates.txt`,
  which is not an 857 file.
- **Evidence gap (P3, closed by Opus).** The report cites `119s-hash-object-r8.txt`, but that file does not exist. Opus's
  witness, read 2026-10-03: `ListingPreviewDialogView.tsx` 7388974a, `AdminListingsTable.tsx` c12a3b26, `page.tsx`
  79890e7b, `AdminListingsTable.smoke.test.tsx` 22504e4d, `ListingPreviewDialogView.stories.tsx` 3bba5858,
  `MantineNavRowList.module.css` be713aad. Revision 9 writes the hash file in its gate block.

### 26.2 Defect: the nav row focus cannot be seen (P2, R59 → R61)

- **The R59 instruction was wrong, and it was Opus's.** It took only the ring's colour expression from the canonical
  focus. In this repository the canonical focus is two parts: a **brand border** plus the 10% ring. The fields use
  `input-chrome.css:22-25`, a brand-3 border plus the ring. The radio card uses `:305-309`, a brand-7 border plus the
  ring. The ring is the soft halo, and the border is what makes focus visible. A nav row has no border of its own, so
  it got only the halo.
- **Measured.** brand-5 `#F2877E` at 10% over gray-0 `#f9fafb` composites to about `rgb(248,239,239)`. That is about
  1.1:1 against gray-0, and gray-0 against the white list is about 1.04:1. Hover uses the same gray-0, so keyboard
  focus is effectively hover. WCAG 2.2 1.4.11 asks for 3:1 for the visual information that identifies a state.
  `122-navrow-focus-r8.png` shows it: a faint pink band.
- **Contradiction.** The report says the executor kept the value because "you then checked with Tab and said it's
  visible". No such check or statement exists in Opus's review sessions. The value was never measured against a
  contrast criterion.

### 26.3 Requirement

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R61** | **Nav row keyboard focus = the canonical card focus, drawn inset** (supersedes R59's value). In `MantineNavRowList.module.css`, `.row[data-nav-row]:focus-visible` keeps `outline: none` and the gray-0 background, and sets `box-shadow: inset 0 0 0 1px var(--mantine-color-brand-7), inset 0 0 0 4px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent)`. The first shadow is the 1px brand-7 border of `input-chrome.css:307`. The second is that file's 3px ring, inside the border (1 + 3). Keep the `design-tokens-allow` marker with its reason, and cite `:305-309` in the comment. If `check:design-tokens` rejects the new form, stop with `BLOCKED — R61 TOKEN` and do not pick another value. Hover and mouse focus are unchanged. | P2 | AC35 |
| **R62** | **Gate block hash file.** The §26.5 block writes `126s-hash-object-r9.txt` with every Revision 9 file, in the same run. | P3 | AC36 |

### 26.4 Acceptance (Revision 9)

- **AC35 [R61].** `NavRowList` `Default` at 1440, sq, `deviceScaleFactor: 1`:
  - Tab onto row 1. Its computed `box-shadow` contains `rgb(236, 84, 71)` (brand-7).
  - In a crop of the row edge (`125-navrow-focus-r9.png`, scaled 10× pixelated), the 1px brand line is visible on all
    four sides.
  - Record the contrast of that edge pixel against the gray-0 background in `125-navrow-focus-r9.json`. It must be at
    least 3:1.
  - A mouse click on row 3 draws no brand line.
  - Hover draws only the gray-0 background.
- **AC36 [R62].** `126s-hash-object-r9.txt` exists and lists `MantineNavRowList.module.css` plus any other file
  Revision 9 changed. The §26.5 gate block gives the expected results, and `npm run build` exits 0.

### 26.5 Re-entry, write set and gate block (Revision 9)

- **Start step:** platform line `124-platform-r9.txt`, then R61, then AC35, then the gate block.
- **Write set:**
  - `src/design-system/mantine/patterns/MantineNavRowList.module.css`;
  - the session log ("Revision 9" section);
  - evidence `124`+ with the `-r9` suffix;
  - the 857 cell of `docs/backlog.md`.

  Every other file is forbidden. Do not overwrite evidence `01`–`123`.
- **Gate block:** the §24.10 block renamed `126*-r9`. **Rename every output, the i18n gate included**: Revision 8
  overwrote `112k-i18n-r7.txt`. Expected results:
  - `win32`;
  - the four calibration census FAIL lines;
  - tests with the 4 known 790 failures, plus `overlay-dual-declaration` only if the suite runs before the build. Run
    the suite after the build to avoid it;
  - `check:file-integrity` flags only files outside task857, if any, and you name them;
  - every other gate exits 0.
- **Receipts:** `GR-0` and `GR-3a` (`NavRowList` `Default`, `EXTEND`) in `127-receipts-r9.txt`.

### 26.6 Owner matrix (O78-12)

Revision 9 changes only the keyboard focus state, which none of §25.8's 20 tuples shows. The owner can review those 20
tuples now, against the current `storybook-static`. Opus measured them (§26.1) and found them clean. Revision 9 adds one
tuple, `Patterns/Mantine/NavRowList` `Default`, sq, 1440, **Tab onto the first row**. **On acceptance of all 21 tuples
and a verified Revision 9:** Opus approves 857, archives it, and emits the commit and push handoff.

### 26.7 Owner return, 2026-10-03 (added to Revision 9 before it ran)

- **Owner, verbatim:** *"я змінив статус з Active на Sold, з'явився тост, але у combobox статус не змінився. Це баг у
  Story чи взагалі у компоненті? Візуально по адаптації мені все подобається, приймаю."* The owner accepts the 20
  tuples of §25.8.
- **Cause: the Story, not the component (Opus, source read).**
  - `StatusChangeSelect` is controlled (`value={currentStatus}`). It shows the success toast when `onSubmit` resolves,
    and it shows a new status only when its parent passes one.
  - In production the parent does this. `ListingPreviewDialog.tsx:69-73` calls `updateListingStatus`, then
    `onStatusChanged`. `AdminListingsTable.tsx:111-114` patches both `items` and `previewListing.status`, so the select
    re-renders with the new value.
  - The Story does not. `ListingPreviewDialogView.stories.tsx:64` passes `onStatusChange={() => {}}`, and the `listing`
    prop is a constant. So the no-op resolves, the toast fires, and the select snaps back to the old status.
- **Test gap.** T4 (`AdminListingsTable.smoke.test.tsx:331-342`) asserts the call, the toast and the **row** badge. It
  never asserts the dialog's select, so the production behaviour above is proven only by reading the code.

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R63** | **The Story mirrors the production status flow.** In `ListingPreviewDialogView.stories.tsx`, `DialogDemo` holds the listing in `useState` (initialised from its prop). `onStatusChange` sets `status: toStatus` on it, which is what `AdminListingsTable.tsx:113` does after the action resolves. `usePreviewStatusOptions` is then called with the updated status. No other export changes. | P2 | AC37 |
| **R64** | **T4 also asserts the dialog.** After `chooseSold()`, the dialog's status textbox (`within(dialog).getByRole('textbox', { name: t.col_status })`) has the value `soldLabel`. Add a plant: in `AdminListingsTable.tsx`, remove the `setPreviewListing(...)` line in `onStatusChanged`. The new assertion must fail, and the row-badge assertion still passes. Record it in `128-plant-t4-dialog-r9.txt`, restore, and add a hash witness before and after. | P2 | AC37 |

- **AC37 [R63, R64].**
  - In Storybook `Active`, sq, 1440: choose Sold. The select shows "Shitur" (the sq sold label) and the success toast
    appears. Record a Playwright check in `129-story-status-r9.json`.
  - T4 passes with the new assertion. The plant fails only that assertion.
- **Write set additions:**
  - `src/stories/patterns/mantine/ListingPreviewDialogView.stories.tsx` (`DialogDemo` only);
  - `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx` (T4 only);
  - `AdminListingsTable.tsx` only for the temporary plant. Its final hash must equal `c12a3b26`.
- **Receipts:** add `GR-3a` (`ListingPreviewDialogView`, `EXTEND`, no new export) to `127-receipts-r9.txt`.
- **Owner matrix:** add one tuple, `ListingPreviewDialogView` `Active`, sq, 1440: choose Sold, and the select shows
  Sold. With §26.6 that makes 2 tuples still owed. The other 20 are accepted.

---

## 27. Review 10 — `PARTIALLY VERIFIED`, 2026-10-03: Revision 9 verified, 2 owner tuples owed

### 27.1 Verified by Opus

- **Source.** R61: `MantineNavRowList.module.css` `.row[data-nav-row]:focus-visible` is exactly the §26.3 value (1px brand-7 + 4px 10% ring, inset), with one `design-tokens-allow` marker per distinct length. R63: `DialogDemo` holds the listing in `useState` and `onStatusChange` sets `status`, as `AdminListingsTable.tsx:111-114` does. R64: T4 asserts the dialog's status textbox (`AdminListingsTable.smoke.test.tsx:342-345`).
- **Plant.** `128-plant-t4-dialog-r9.txt`: the plant fails only `:345` (`expected 'Active' to be 'Sold'`), with the row-badge assertion at `:341` already passed; restored hash `c12a3b26`, equal to the current file.
- **Freshness.** The last source write is the CSS at 00:46:28. The gate run starts at 00:46:34, `storybook-static` is rebuilt at 00:47:22 and holds the R61 rule, the build ends `EXIT_CODE=0` (00:48:50), and the tests run after it (00:52:53: 4 failed, all known 790; 2304 passed). `126s-hash-object-r9.txt` equals the current hashes of all four files.
- **Measurement** (`130-opus-review10.{mjs,json}`, `130b-opus-status-390.{mjs,json}`, `win32 v22.22.3`, final `storybook-static`):
  - AC35: on Tab, row 1 is `:focus-visible` with brand-7 in its box-shadow. At DPR 1 the edge pixel is `rgb(236,84,71)` on all four sides. Contrast is 3.39:1 against gray-0 and 3.54:1 against the white resting edge. A mouse click on row 3 is not `:focus-visible` and has no shadow, and hover shows only the gray-0 background. Crop: `130-opus-navrow-focus-10x.png`.
  - AC37: in `Active` at 1440 the select goes Aktiv → Shitur (sq) and Активне → Продано (uk), and the toast appears. At 390 the same happens through the select's bottom sheet (sq, uk). After the change the options list the new status first, and in every cell `overflowX` is false, there are 0 subtle/transparent text buttons and there are 3 nav rows.
- **GR-1.** `126b-census-r9.txt` lists 27 tier-1 nodes. 23 are migrated, enrolled and storied. Four are container-exempt and are the known calibration FAIL lines: `page.tsx`, `AdminListingsTable`, `ListingPreviewDialog` and `PremiumDialog`.

### 27.2 Owner matrix O78-12 — the 2 tuples still owed

| Story | State / action | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/NavRowList` | `Default`, Tab onto the first row: a thin coral line on all four sides of the row | sq | 1440 |
| `Patterns/Mantine/ListingPreviewDialogView` | `Active`, choose Sold: the select shows "Shitur" and the toast appears | sq | 1440 |

The other 20 tuples were accepted on 2026-10-03 (§26.7). **On acceptance of both:** Opus approves 857, archives it, and emits the commit and push handoff. **Superseded by §28:** the owner returned tuple 1 (cut corners), so Revision 10 is owed.

---

## 28. Owner return on O78-12, 2026-10-03 → `NEEDS REVISION`, Revision 10 (a rounded clip never cuts a line)

### 28.1 Owner return and the new rule (verbatim)

- **Owner, 2026-10-03, on §27.2 tuple 1** (`NavRowList` `Default`, Tab): *"не приймаю, кути обрізаються. Це постівйна
  проблема у тебе і Sonnet. Необхідно зробити правило, що якщо є бордер, він обов'язково має бути заокругденим а не
  обрізатись!"* The screenshot shows the last row focused, with its bottom-left corner cut.
- **New rule:** `docs/golden-rules.md` **GR-3g** ("A line follows a rounded corner; a clip never cuts it"), written in
  the same edit and wired into the `create-task`, `execute-task` and `review-task` skills. Read it before starting.
- **Opus failure, recorded:** review 10's own crop (`130-opus-navrow-focus-10x.png`) showed the cut top-left corner,
  and Opus passed it. Tuple 2 of §27.2 (`ListingPreviewDialogView` `Active`, choose Sold) has no owner answer yet,
  so it is still owed.

### 28.2 Measured cause (Opus, `131-opus-navrow-corners.{mjs,json}`, `131-opus-navrow-corners-10x.png`, `win32 v22.22.3`)

- The list is `Paper withBorder radius="md"` (`MantineNavRowList.tsx:48`): computed radius 6px, border 1px,
  `overflow: hidden` (`MantineNavRowList.module.css:8-10`). The clip edge therefore has a 5px radius.
- The rows have `border-radius: 0px`. The R61 focus line is an inset 1px `box-shadow`, so it has square corners. On
  row 1 the clip cuts its top-left and top-right corners, and on the last row the bottom-left and bottom-right ones.
  The crops show a diagonal gap where the curve should be.
- `--paper-radius` is inherited by the rows (computed `0.375rem` on row 1), and row 1 and the last row are the
  `:first-child` and `:last-child` of the `Stack`. A 6px corner stays inside the clip's 5px curve, so it is never cut.

### 28.3 Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R65** | **The nav row corners follow the list (GR-3g).** In `MantineNavRowList.module.css`, add these rules, independent of state, so focus, hover and any later line all follow the curve: `.row[data-nav-row]:first-child` gets `border-top-left-radius` and `border-top-right-radius` of `var(--paper-radius)`, and `.row[data-nav-row]:last-child` gets the two bottom corners. A one-row list gets all four, because both selectors match. Use no raw value and no `calc`. R61's focus value, the hover background and the list's radius, border and clip stay unchanged. Update the file's header comment to cite GR-3g. | P1 | AC38 |
| **R66** | **GR-3g probe over the 857 Stories that draw lines.** Write a Playwright probe (`133-gr3g-probe-r10.mjs`, DPR 1, sq, 390 and 1440) over `Patterns/Mantine/NavRowList`, `DetailList`, `DialogSections`, `DialogFooter`, `ListingPreviewDialogView` (`Active`, `DeleteConfirm`), `PremiumDialogView`, `AdminTable`, `AdminListingsView`, `Mantine/Primitives/Table` and `Mantine/Primitives/Radio`. In each Story, at rest, then on each focusable reached by Tab, then hovering the first and last row of each list or table: for every element that draws a line (border, outline or non-`none` box-shadow), find each ancestor with `overflow` other than `visible` and a radius above 0 whose corner the element's box touches, and record the ancestor's radius and the element's radius on that corner. A corner is cut when the element's radius there is smaller than the ancestor's and the line reaches that corner. Write the result to `133-gr3g-probe-r10.json`, with the number of cut corners. **Any cut found outside `MantineNavRowList`:** fix it in the canonical component that owns the line, with the ancestor's radius token, and list it in the session log. If that fix needs a visual choice beyond taking the ancestor's token, stop with `BLOCKED — GR-3g <component>` and the crop, and Opus decides. | P1 | AC39 |
| **R67** | **Receipts and hashes.** One `GR-3g CORNER CHECK` per component and state that R65/R66 touch, plus `GR-0` and `GR-3a` (`NavRowList` `Default`, `EXTEND`) in `134-receipts-r10.txt`. The §28.6 gate block writes `135s-hash-object-r10.txt` with every Revision 10 file, in the same run. | P2 | AC40 |

### 28.4 Acceptance (Revision 10)

- **AC38 [R65].** `NavRowList` `Default`, sq, 1440, `deviceScaleFactor: 1`:
  - Tab onto row 1, then onto row 3. Crop all four corners of each focused row, scale them 10× pixelated, and save
    them as `132-navrow-corners-r10.png`. On each outer corner the brand line runs around the curve with no gap.
  - The computed `border-top-left-radius` and `border-top-right-radius` of row 1, and the two bottom ones of row 3,
    equal the list's computed radius. Row 2 keeps square corners. Record this in `132-navrow-corners-r10.json`.
  - AC35 still holds: the line is brand-7 on all four sides and at least 3:1 on gray-0, a mouse click draws no line,
    and hover shows only the gray-0 background.
  - The same holds in `ListingPreviewDialogView` `Active` at 390 and 1440, on the dialog's nav rows.
- **AC39 [R66].** `133-gr3g-probe-r10.json` covers every Story, state and width that R66 names and reports 0 cut
  corners. Every fix outside `MantineNavRowList` is listed with its file and its ancestor token.
- **AC40 [R67].** `134-receipts-r10.txt` and `135s-hash-object-r10.txt` exist. The §28.6 gate block gives the expected
  results, and `npm run build` exits 0.

### 28.5 Flows

- **Positive:** keyboard focus on any nav row shows the brand line on all four sides, and on the first and last rows
  it follows the list's curve.
- **Negative, applicable:** a one-row list, because both selectors apply; a mouse click, which draws no line; hover
  in the corners, where the gray-0 fill stays inside the curve.
- **Not applicable:** data, locale or permission branches, because the change is CSS only.

### 28.6 Re-entry, write set and gate block (Revision 10)

- **Mode:** `remediation`. **Start step:** platform line `132-platform-r10.txt`, then R65, AC38, R66/AC39, R67 and
  the gate block.
- **Write set:**
  - `src/design-system/mantine/patterns/MantineNavRowList.module.css`;
  - the canonical owner of any cut that R66 finds, and only for that fix;
  - the session log ("Revision 10" section);
  - evidence `132`+ with the `-r10` suffix;
  - the 857 cell of `docs/backlog.md`.

  Every other file is forbidden, including every Story file and every rule document. Do not overwrite evidence
  `01`–`131`.
- **Gate block:** the §26.5 block renamed `135*-r10`, every output renamed, the i18n gate included, and the tests
  after the build. Expected results:
  - `win32`;
  - the four calibration census FAIL lines;
  - tests with exactly the 4 known 790 failures;
  - `check:file-integrity` flags only files outside task857, if any, and you name them;
  - every other gate exits 0.

### 28.7 Owner matrix (O78-12) after Revision 10

| Story | State / action | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/NavRowList` | `Default`: Tab onto the first row, then onto the last. The coral line runs around the rounded corners with no cut | sq | 1440 |
| `Patterns/Mantine/ListingPreviewDialogView` | `Active`: choose Sold. The select shows "Shitur" and the toast appears. **Accepted by the owner 2026-10-03** (verbatim: *"приймаю"*) | sq | 1440 |

Only the `NavRowList` tuple is still owed. Before it reaches the owner, Opus re-measures AC38/AC39 itself and emits a
GR-3g receipt. **On its acceptance and a verified Revision 10:** Opus approves 857, archives it, and emits the commit and push handoff.
