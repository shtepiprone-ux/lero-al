# Task 919: admin tables get row checkboxes, a bulk-delete button and per-row edit/delete icons

**Sprint 78** (admin and agent dashboards on canonical Mantine) · **P1** · QA profile **Q4** · **Status: ⛔ NOT EXECUTABLE — scope reopened 2026-10-04 by GR-8 (`docs/golden-rules.md`): every table of stored records gets this anatomy, and support tickets, inquiries, email templates and 916's five are no longer excluded. A current-session GR-7 audit and a redesign come first. Do not execute.** Filed `KICKOFF FILED`
2026-10-03. **Inputs for the redesign (2026-10-04):** D78-17 (every Mantine admin table, support tickets and inquiries included), D78-19 (ticket soft delete), the GR-7 library `docs/research/references/2026-10-04/`, and 859 §17, which builds `MantineDeleteConfirmModal` and `MantineBadge` for 919 to reuse. 919 starts after 859 lands · owner decisions **D78-13 … D78-16** · owner matrix **O78-14** · **Starts after 857 is approved and
committed.** 857 has uncommitted changes in `MantineDataTableToCards.tsx`, `AdminTable.tsx`, `AdminListingsView.tsx`
and the table Stories, and this task edits the same files.

Executor: run this file through `execute-task`. Your strongest status is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
Run no Git commands.

## 1. Mode and task type

`IMPLEMENTATION`. This task extends a canonical UI pattern, creates two canonical patterns, and adds new admin
mutations (bulk delete) to six surfaces.

Bundles from `docs/rule-index.md`:
- UI / Layout / Component (current Mantine path);
- Storybook / Visual Proof;
- Component Catalog / Coverage;
- Admin Table / Admin Control;
- Data access (server actions, admin client, permissions);
- Regression / Critical Flow Coverage.

## 2. Objective

Every admin table of editable records works like the owner's references:
- a checkbox column with select-all;
- an icon-only bulk-delete button that appears at the right end of the filter row once a row is selected;
- per-row edit and delete icon buttons in the Lahomes tinted style.

Edit goes straight to the record's edit page where one exists, and otherwise opens the edit dialog the surface
already has. Delete always asks for confirmation in a modal. The six surfaces are listings, users, currencies,
exchange providers, CMS pages and reports.

## 3. Verified context

### 3.1 Reference research (GR-7)

Research was done live on 2026-10-03 with Playwright at 1440, using the Kamr demo login. Screenshots are in
`docs/sessions/evidence/task919/research/01-08`.

**Pages enumerated:**
- TailAdmin: 88 sidebar links. 43 content pages were crawled, and 20 of them have tables.
- Lahomes: 120 links. 17 content pages were crawled, and 9 have tables.
- Kamr: 61 links. 15 content pages were crawled, and 8 have tables.

| Reference / page | Checkbox column | Per-row actions | Bulk action on selection | Confirm |
|---|---|---|---|---|
| TailAdmin `products-list` (`01`, `02`) | yes. Header select-all selects all 7 rows, and the selected row gets a gray background | `⋯` menu: View More / Delete | **none**: the toolbar has Export / Search / Filter, unchanged on selection | none (static demo) |
| TailAdmin `invoices`, `transactions`, `support-tickets`, `logistics` (`03`) | yes, in the first data column | `⋯` menu: View More / Delete | none | none |
| TailAdmin `data-tables` Datatable 3 (`04`) = the owner's screenshot | yes | **trash + pencil, plain gray 20px icons**, red on hover | none | none |
| TailAdmin `crm` Recent Orders | yes | trash icon only | none | none |
| Lahomes `property-list`, `customers-list`, `orders`, `transactions`, `reviews`, `index` (`05`, `06`) | yes | **eye (`btn-light`) + pen (`btn-soft-primary`) + trash (`btn-soft-danger`)**. Measured: 40×32 px, an 18px Solar `*-broken` icon, a 10% tint of the icon colour (`rgba(96,74,227,.1)` brand, `rgba(233,103,103,.1)` danger), 10px gap; trash fills solid red on hover | none | none (`#!` links) |
| Kamr `guest-list`, `ecom-customers`, `ecom-product-order` (`07`, `08`) | yes | `⋯` dropdown: Edit / Delete (orders add status items) | none | none |
| Kamr `table-bootstrap-basic` "Exam Toppers", `todo` | yes / no | pencil + trash, filled square `btn-xs` | none | none |

- **Chosen pattern:** the checkbox column from all three, and the Lahomes tinted row buttons (owner **D78-14**,
  *"Lahomes tinted buttons"*).
- **Absent from all three references:** a bulk-delete button that appears on selection, and a delete confirmation
  wired to a table. Both are the owner's own requirements, so their visuals are derived from the Lahomes soft-danger
  button and from lero.al's existing dialog anatomy (§23.6 / §23.7). They are not "per the reference".

### 3.2 lero.al data map (FACT unless marked)

| Surface (route → container → View) | Entity / row type | Edit today | Single delete today (guard, permission) | Bulk action today |
|---|---|---|---|---|
| `/admin/listings` → `AdminListingsTable` → `AdminListingsView` (via `AdminTable`) | `listings`; the row has `slug` (`AdminListingsTable.tsx:24`) | edit page `/[locale]/listings/[slug]/edit` (staff allowed by `checkEditPermission`, edit `page.tsx:46-54`); no row icon today | `deleteListing(id)` `admin/actions/index.ts:118`, `assertPermission('listings.delete')`, hard delete, **returns `void` and swallows errors**; reached only through the preview dialog | none |
| `/admin/users` → `AdminUsersTable` (direct `MantineDataTableToCards`) | `users` | page `/admin/users/[id]`, a chevron link today (`AdminUsersTable.tsx:332-340`) | `softDeleteUser(id)` `:499`, `hasPermission('users.soft_delete')`, sets `deleted_at` and archives the user's listings. **It does not refuse the caller's own id.** | none |
| `/admin/currency` → `AdminCurrenciesManager` → `AdminCurrenciesView` (`AdminTable`) | `currencies` | edit dialog `openEdit(c)` (`AdminCurrenciesManager.tsx:130`), reached through the detail dialog | `deleteCurrency(id)` `currencies.ts:194`, `assertAdmin`, refuses `is_default` (`code: 'default_currency'`) | none |
| `/admin/currency` → `AdminExchangeProvidersManager` → `AdminExchangeProvidersView` | `exchange_providers` | `onEdit(p)` edit dialog; row icons today: toggle / pencil / trash, `variant="subtle"` (`:85-118`) | `deleteExchangeProvider(id)` `exchangeProviders.ts:141` | none |
| `/admin/pages` → `AdminPagesManager` → `AdminPagesView` | `pages` | `onEdit(p)` → `PageEditorDialogView`; row icons today: open public page / pencil / trash (`:81-118`). With legacy content, new/edit/delete are disabled (`:21`) | `deletePage(id)` `index.ts:287`, `assertPermission('legal.manage')` | none |
| `/admin/reports` → `AdminReportsManager` → `AdminReportsView` (`AdminTable`) | `listing_reports` | no edit form. Status is edited in `ReportDetailDialog` (row click `onSelect`) | `deleteReportAction(id)` `reportListing.ts:251`, `hasPermission('reports.delete')`, already passed to the View as `canDeleteReports` | none |

- **Not in scope**, by owner D78-15 (*"Every table of editable records (Recommended)"*):
  - `AgentStatisticsView` and the dashboard tables, which are read-only;
  - `AdminSupportManager`, whose tickets have no delete action (it is 859's surface);
  - the five legacy managers: Legal, Locations, Popular locations, Companies, Property types. They adopt this pattern
    when **916** migrates them (916's reserved row is amended in the same edit).

### 3.3 Canonical sources inspected (GR-0)

- `MantineDataTableToCards.tsx`:
  - props at `:235-262`: `columns`, `rows`, `card`, `tableHeader`, `cardsBelow`, `onRowClick`,
    `stickyColumnIndex`, `ariaLabel`;
  - there is no selection prop and no actions prop;
  - `onRowClick` adds a trailing chevron column;
  - consumers: `AdminTable`, `AdminUsersTable`, `AdminCurrenciesView`, `AdminExchangeProvidersView`,
    `AdminPagesView`, `MantineAdminSurfacePattern`, `MantineCountButton`, `AgentStatisticsView`.
- **Row action icons are duplicated feature-locally today.** `AdminExchangeProvidersView.tsx:80-120`,
  `AdminPagesView.tsx:76-118` and `AdminUsersTable.tsx:308-341` each build their own `ActionIcon` group (subtle,
  `size="sm"`, lucide icons). This task moves that chrome into the canonical table.
- **The delete confirmation is duplicated too.** Example: `AdminCurrenciesView.tsx:140-157` hand-builds a footer
  `Flex` of Cancel and a red Delete instead of using `MantineDialogFooter` (`MantineDialogFooter.tsx:6-30`, §23.7) and
  the §23.6 "destructive confirm step".
- Searches for a canonical confirm pattern (`confirm` in `patterns/*.tsx`) and a bulk control (`bulk`, `selected`)
  found no candidate.
- Tokens:
  - Checkbox: theme `Checkbox` entry `theme.ts:1085-1092` (`size="xs"`, 16px box, 44px body);
  - icon: `theme.other.iconSize.comfortable` = 18 (equals Lahomes' 18);
  - spacing: `xs` = 8px is the nearest token to Lahomes' 10px gap;
  - touch target: `theme.other.touchTarget`;
  - Mantine `ActionIcon variant="light"` tints the colour at about 10%. Executor: measure and record it.
- **Icons:** `docs/mantine-responsive-design-system.md` §26 makes `@solar-icons/react` mandatory for every icon a task
  changes, `broken` style for inline icons. `package.json` does not contain it yet (918 also adds it, version 2.3.2,
  per 918 F8).

### 3.4 GR-1 census (2026-10-03, `node.exe scripts/check-surface-census.mjs --surface <page>`)

| Surface | Nodes | FAIL lines (all `className:0 ui-imports:0` pure containers whose Views are enrolled and storied) |
|---|---|---|
| `admin/listings/page.tsx` | 27 | page, `AdminListingsTable`, `ListingPreviewDialog`, `PremiumDialog` (857's four calibration lines) |
| `admin/users/page.tsx` | 6 | page |
| `admin/currency/page.tsx` | 18 | page, `AdminCurrenciesManager`, `AdminExchangeProvidersManager` |
| `admin/pages/page.tsx` | 14 | page, `AdminPagesManager` |
| `admin/reports/page.tsx` | 15 | page, `AdminReportsManager`, `ReportDetailDialog` |

Every other node is tier 1, migrated, enrolled and storied. There are no tier-2 or tier-3 nodes. The census must show
**no new FAIL line** after this task. The two new patterns are enrolled and storied.

## 4. Requirements

| ID | Source | Observable requirement | P | AC |
|---|---|---|---|---|
| R1 | owner, D78-15 | `MantineDataTableToCards` gains an optional `selection` prop: `{ selectedIds: string[]; onSelectedIdsChange(ids: string[]): void; isRowSelectable?(row): boolean; rowLabel(row): string; selectAllLabel: string }`. **The table:** a leading column of theme `Checkbox`es. The header checkbox is `checked` when every selectable visible row is selected, `indeterminate` when some are, and toggles all selectable visible rows. A row checkbox has `aria-label = rowLabel(row)`. A non-selectable row's checkbox is `disabled`. Clicking a checkbox never fires `onRowClick`. A selected row's cells, the sticky one included, show the `gray.0` background. The checkbox column is not sticky and is not counted by `stickyColumnIndex`. **Cards:** each card shows its checkbox at the start of its header row. Without the prop, the render is unchanged. | P1 | AC1 |
| R2 | owner, D78-14 | `MantineDataTableToCards` gains an optional `rowActions?(row): TableRowAction[]` with `TableRowAction = { key: string; kind: 'edit' \| 'delete' \| 'neutral'; label: string; icon: ReactNode; onClick?(): void; href?: string; disabled?: boolean; loading?: boolean; testId?: string }`, plus `actionsLabel: string` for the header. **The table:** a trailing column headed `actionsLabel`, holding a `Group gap="xs" wrap="nowrap"` of `ActionIcon variant="light" size="lg"`: `color="brand"` for `edit`, `color="red"` for `delete`, `color="gray"` for `neutral`. Each icon is `theme.other.iconSize.comfortable`, carries `aria-label` and `title` = `label`, renders as a link when `href` is set, and never fires `onRowClick`. When `rowActions` is set, the chevron column is not rendered, but the row stays clickable. **Cards:** the actions sit in a row at the card's end, each at least `theme.other.touchTarget`. Without the prop, the render is unchanged. | P1 | AC2 |
| R3 | owner | **New pattern** `src/design-system/mantine/patterns/MantineTableBulkDeleteButton.tsx`: `{ count: number; label: string; onClick(): void; loading?: boolean }`. It renders nothing when `count` is 0. Otherwise it renders `ActionIcon variant="light" color="red" size="xl"` (44px, the filter controls' height) with the Solar trash icon at `iconSize.roomy`, `aria-label` and `title` = `label` (which includes the count, from i18n). It is exported from `patterns/index.ts`, enrolled in `scripts/mantine-migration-scope.json`, and has its own Story. | P1 | AC3 |
| R4 | owner, §23.6/§23.7 | **New pattern** `MantineDeleteConfirmModal.tsx`: `{ opened; onClose(); onConfirm(); title; description?; children?; confirmLabel; cancelLabel; loading? }`, built only from `MantineModal` (header title + description) and `MantineDialogFooter` (secondary `Button variant="default"` = cancel, primary filled `Button color="red"` = confirm). While `loading` is true, Cancel is disabled and confirm shows `loading`. Escape and the backdrop close it only when it is not loading. It is exported, enrolled and storied (states: single, bulk). | P1 | AC4 |
| R5 | owner | Selection state lives in each container: listings `AdminListingsTable`, users `AdminUsersTable`, currencies `AdminCurrenciesManager`, providers `AdminExchangeProvidersManager`, pages `AdminPagesManager`, reports `AdminReportsManager`. It is cleared on any change of tab, filter, search or page, and after a delete completes. Ids no longer present in `rows` are dropped. `AdminTable` forwards `selection`, `rowActions` and `actionsLabel` unchanged. | P1 | AC5 |
| R6 | owner, D78-13 | **Edit action per surface.** Listings: `href` = `/${locale}/listings/${slug}/edit`, with `locale` from `useLocale()`. Users: `href` = `/admin/users/${id}`, replacing the chevron link. Currencies: `openEdit(c)`. Providers and pages: their existing `onEdit`. Reports: opens `ReportDetailDialog` (`onSelect`), the surface where report status is edited. Pages keep the existing disable rule for legacy content. | P1 | AC6 |
| R7 | owner | **Delete action per surface.** The row trash opens `MantineDeleteConfirmModal` in its single state (title from i18n, the record's name in the body). Confirm calls the surface's existing single delete action. A success toast appears, the row disappears after refresh, and an error shows the existing per-code error toast. The six surfaces' hand-built delete confirmations (for example `AdminCurrenciesView.tsx:140-157`) are replaced by the canonical modal. `ListingPreviewDialogView`'s in-dialog delete step is not changed. | P1 | AC7 |
| R8 | owner | **Bulk delete per surface.** The View places `MantineTableBulkDeleteButton` as the last item of its filter row, at the right end from `sm` (`ml="auto"`) and right-aligned in its own row below `sm`. With no filter row (users has a tab and search row), it goes at the end of that row. Its click opens `MantineDeleteConfirmModal` in the bulk state ("Delete {count} …?"). Confirm calls the surface's bulk action (R9) with the selected ids. After that it toasts success with the count, or a partial result listing the not-deleted count. Selection is cleared, and the rows that were deleted disappear after refresh. | P1 | AC8 |
| R9 | owner | **Bulk server actions**, one per entity, in the same module as the single action: `deleteListingsBulk`, `softDeleteUsersBulk`, `deleteCurrenciesBulk`, `deleteExchangeProvidersBulk`, `deletePagesBulk`, `deleteReportsBulk`. Each one: (a) runs the single action's permission check once, first, with zero reads or writes when denied; (b) de-duplicates ids and rejects more than 100 with `code: 'too_many'` and zero writes; (c) applies, per id, **the same guarded helper the single action uses**, extracted so the single action calls it too (no copied guard); (d) returns `{ deleted: string[]; failed: { id: string; code: string }[] }`; (e) revalidates the same paths as the single action, once. The single actions keep their exported signature and return shape. `deleteListing` keeps returning `void`, but its helper returns the per-id result the bulk action needs. | P0 | AC9 |
| R10 | D78-16 | **User soft delete refuses self.** The shared soft-delete helper refuses the caller's own id with `code: 'self'` and no write. This applies to `softDeleteUser` and `softDeleteUsersBulk` alike. On the users table, the caller's own row is not selectable (`isRowSelectable`) and its delete icon is `disabled`. `hardDeleteUser` is not touched. | P0 | AC10 |
| R11 | permissions | Delete controls appear only for a viewer allowed to delete: listings `listings.delete`, users `users.soft_delete`, currencies/providers admin (as `assertAdmin`), pages `legal.manage`, reports `canDeleteReports`. Delete controls means the checkbox column, the row trash and the bulk button. Each `page.tsx` computes the flag with the existing `hasPermission` / role helpers and passes it down. Edit icons follow each surface's existing edit availability. The server checks stay authoritative (R9a). | P0 | AC11 |
| R12 | §26 | Every row-action and bulk icon this task adds or changes comes from `@solar-icons/react/broken`: pen (edit), trash (delete), and the neutral actions' icons in the three Views that already had them (provider toggle, page "open public page", user verify). Look up the exact export names in `node_modules/@solar-icons/react/dist`, never from the Iconify id. If the package is not in `package.json` when you start, add `@solar-icons/react@2.3.2`. lucide imports for other roles in those files stay. | P1 | AC12 |
| R13 | i18n | New strings exist in `sq`, `en`, `uk` and `it`: select all, select row (`{name}`), actions header, delete selected (`{count}`), bulk confirm title and body (`{count}`), bulk success (`{count}`), bulk partial (`{deleted}`/`{failed}`), and the per-code failure reasons `self`, `default_currency`, `too_many`. Reuse existing keys where they exist (`delete`, `cancel`, `edit`, `delete_confirm`). | P1 | AC13 |
| R14 | Stories (16c, GR-3) | Story work:<br>• Extend `Mantine/Primitives/Table` (`src/stories/mantine/primitives/Table.stories.tsx`) with export `SelectionAndActions` (stateful: 5 rows, 2 selected, edit/delete actions, header indeterminate).<br>• Create `Patterns/Mantine/TableBulkDeleteButton` (`Default` with count 2) and `Patterns/Mantine/DeleteConfirmModal` (`Single`, `Bulk`).<br>• Show the new column and the bulk button in the six existing View Stories: `AdminListingsView`, `AdminUsersTable`, `AdminCurrenciesView`, `AdminExchangeProvidersView`, `AdminPagesView`, `AdminReportsView`. Each holds its selection in story state, as the 857 `DialogDemo` does, and each `Default` starts with 2 rows selected.<br>No other Story file is created. | P1 | AC14 |
| R16 | D78-12, 857 review 13 | In `src/design-system/mantine/theme.ts`, the `Table` entry's `styles.thead.backgroundColor: gray-0` (`:1582`) is removed. It is covered by the white sticky-header cells in every table and misstates D78-12 (white header). Nothing visible changes: every header cell still computes `rgb(255,255,255)` in the four table Stories (857 `151-opus-review13.json` is the before value). | P3 | AC16 |
| R15 | regression | Tests:<br>• unit tests for R1–R4;<br>• per surface, a container test: select 2 → bulk → confirm → bulk action called with those ids → selection cleared; row trash → confirm → single action; edit → href or handler;<br>• a smoke test per bulk action: denied → no DB call; happy; guard row in `failed` and the others deleted; duplicates; over 100; per-row DB error → `failed`;<br>• the `softDeleteUser` self refusal.<br>The existing critical-flow tests still pass unchanged: report delete (registry row 67), hard-delete user (row 50) and admin write guard (row 85). Add one registry row "Admin bulk delete" with the bulk smoke command. | P0 | AC15 |

## 5. Assumptions and open questions

- **D78-13 … D78-16** are recorded verbatim in the sprint plan (2026-10-03). No owner decision is open.
- `ActionIcon variant="light"` gives roughly the 10% tint Lahomes measured. **The executor measures the computed
  background** of each colour and records it. If it differs visibly from the Lahomes reference, stop and report; do
  not override it locally.
- Lahomes' buttons are 40×32. The square Mantine `size="lg"` (34px) is the nearest theme size. That is a recorded
  approximation, not an exact copy.

## 6. Pre-read rule bundle

Read these before starting:
- `docs/golden-rules.md`, all of it, GR-0 … GR-7;
- `docs/agent-contract.md` 16b–16d;
- `docs/mantine-responsive-design-system.md` §7.3 (table fit), §23.6, §23.7 and §26;
- `docs/tailadmin-style-reference.md` §6b (with notes D78-11 and D78-12);
- `docs/data-access-rules.md`;
- `docs/rls-rules.md` (admin client and permission boundary);
- `docs/component-rules.md` (i18n, container/presentational split);
- `docs/qa-profiles.md` Q4;
- `docs/critical-flow-registry.md` rows 50, 67 and 85;
- this kickoff's `research/` screenshots.

## 7. Scope

- `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (R1, R2), `MantineTableBulkDeleteButton.tsx` and
  `MantineDeleteConfirmModal.tsx` (new), and `patterns/index.ts`.
- `src/components/admin/AdminTable.tsx` (forwarding).
- These surfaces:
  - `AdminListingsTable.tsx` and `AdminListingsView.tsx`;
  - `AdminUsersTable.tsx`;
  - `AdminCurrenciesManager.tsx` and `AdminCurrenciesView.tsx`;
  - `AdminExchangeProvidersManager.tsx` and `AdminExchangeProvidersView.tsx`;
  - `AdminPagesManager.tsx` and `AdminPagesView.tsx`;
  - `AdminReportsManager.tsx` and `AdminReportsView.tsx`.
- The five `page.tsx` files, for the permission flags.
- The server actions:
  - `src/modules/admin/actions/index.ts` (listings, users, pages);
  - `currencies.ts` and `exchangeProviders.ts`;
  - `src/modules/listings/actions/reportListing.ts`.
- `src/design-system/mantine/theme.ts` (R16 only), `messages/{sq,en,uk,it}.json`, `scripts/mantine-migration-scope.json`, and `package.json` / `package-lock.json`
  (only if Solar is missing).
- The Stories listed in R14, the tests in R15, and the one new row in `docs/critical-flow-registry.md`.
- The session log, evidence under `docs/sessions/evidence/task919/`, and the 919 row of `docs/backlog.md`.

## 8. Out of scope

- The five legacy managers (916), `AdminSupportManager` (859), `AgentStatisticsView` and the dashboard tables.
- Bulk actions other than delete: status changes and export.
- `hardDeleteUser`, `ListingPreviewDialogView`'s internal delete step, the `Table` theme entry except R16, the `thead`
  lines and background (D78-11, D78-12), and the mobile card anatomy beyond the checkbox and the actions row.
- Every other `MantineModal` dialog. Those are 915's; this task moves only the six delete confirmations.

## 9. Current and required behavior

| Aspect | Current (preserve where not changed) | Required |
|---|---|---|
| Row click | opens the detail/preview (listings, currencies, reports) or nothing | unchanged |
| Chevron column | present with `onRowClick` | absent when `rowActions` is set |
| Row actions | feature-local subtle icon groups on 3 surfaces, none on 3 | canonical tinted group on all 6 (R2, R6, R7) |
| Selection | none | checkbox column and selected-row background (R1), only for viewers who may delete (R11) |
| Bulk delete | none | button at the end of the filter row once a row is selected (R3, R8) |
| Delete confirm | hand-built per View | `MantineDeleteConfirmModal` (R4, R7) |
| Self soft delete | allowed by the server | refused (R10) |
| Sticky column, pagination, filters, tabs, search, `cardsBelow`, the D78-11 / D78-12 header | as today | unchanged |
| Public pages using `MantineDataTableToCards` (`AgentStatisticsView`, `MantineCountButton`, `MantineAdminSurfacePattern`) | as today | byte-for-byte unchanged render (no new props passed) |

## 10. Implementation requirements

- **GR-0 / GR-3a.** Emit the receipts before any write:
  - `MantineDataTableToCards` × selection/actions: `EXTEND`;
  - `MantineTableBulkDeleteButton` and `MantineDeleteConfirmModal`: `CREATE` (zero candidates, §3.3);
  - `Mantine/Primitives/Table` × `SelectionAndActions`: `EXTEND`;
  - the two new pattern Stories: `CREATE`;
  - the six View Stories: `EXTEND`.
- **No feature-local chrome.** The Views pass data and handlers only. Every `ActionIcon` group, checkbox and confirm
  footer comes from the three patterns. The three existing local `actionIcons` helpers are deleted.
- **GR-3b.** The View Stories keep `withAdminShell` + `AdminPageFrame`. The pattern Stories add no fixed width,
  `style` or viewport pin.
- **GR-3c.** Type-scale table:

  | Element | Role | base / sm / md / lg | Key | Provenance |
  |---|---|---|---|---|
  | Confirm modal title | dialog title | existing `MantineModal` heading at every width | as `MantineModal` | §23.7 |
  | Confirm modal body | body | `sm` | `sm` | §23.7 |
  | Actions header | th | `xs` | `xs` | §6b |

  No new text of 24px or more.
- **GR-3d.**
  - Each View Story: `n/a: own gutter (AdminPageFrame)`.
  - `Patterns/Mantine/TableBulkDeleteButton` and `DeleteConfirmModal`: `n/a: default canvas` /
    `n/a: overlay-only`.
  - `Mantine/Primitives/Table`: `n/a: MantineStoryShell primitive`.
- **GR-3e.** The confirm modal has no text buttons, only a footer pair. Check every popup of the matrix Stories at 390
  and 1440.
- **GR-3f.** No circular element is added (the checkbox is a rounded square).
- **GR-3g.** No new line meets a rounded clip. The selected-row background is a fill. Measure the last selected row
  inside the Paper corner, crop it at DPR 1, and confirm the fill stays inside the curve.
- **§7.3 table fit.** Each surface keeps its `TABLE FIT CHECK` at 1024 and 1440 with the two new columns. Where a
  table no longer fits, report it; do not change `cardsBelow` yourself.

## 11. Positive and negative flows

**Positive:** an admin selects two listings and clicks the bulk trash. The modal asks to delete 2. Confirm: a toast
says 2 were deleted, the rows disappear after refresh, and the selection is empty. Then the row pencil opens the
edit page, and the row trash with confirm deletes one listing.

| Branch | Applicable | Required behaviour |
|---|---|---|
| Viewer lacks delete permission | yes | no checkbox column, trash or bulk button (UI). The server returns `forbidden` with zero writes (R9a, R11) |
| Guarded row in a bulk set (default currency, the caller's own user) | yes | it lands in `failed` with its code; the others are deleted; a partial toast (R8, R9c, R10) |
| Duplicate ids / more than 100 ids | yes | de-duplicated / `too_many`, no writes (R9b) |
| DB error on one row | yes | that row lands in `failed`, the rest proceed, and a `console.error` is logged (R9) |
| Cancel / Escape / backdrop on confirm | yes | nothing is deleted and the selection is kept (R4) |
| Double click on confirm | yes | confirm is `loading` and Cancel is disabled while the action runs; one call (R4) |
| Filter, page or tab change with a selection | yes | the selection is cleared (R5) |
| Selected row deleted by someone else | yes | its id is dropped after refresh (R5) |
| Legacy-content pages | yes | edit and delete stay disabled as today (R6) |
| Mobile (cards) | yes | checkbox in the card header, actions row with 44px targets, bulk button right-aligned (R1–R3, R8) |
| Locale expansion (uk/it labels) | yes | the actions header and `aria-label`s are translated; icons only, so no width change |
| RLS bypass | no | all mutations already use the admin client behind permission checks; the boundary is unchanged |

## 12. Acceptance criteria

- **AC1 [R1].** Given a table with `selection`, when the header checkbox is clicked, then every selectable visible
  row is checked, the header is `checked`, and `onSelectedIdsChange` received those ids.
  - With 2 of 5 selected, the header is `indeterminate`.
  - A disabled row is never selected.
  - Clicking a row checkbox does not call `onRowClick`.
  - A selected row's cells, the sticky one included, compute the `gray.0` background.
  - Without `selection`, the render is unchanged; the existing table tests prove it.
- **AC2 [R2].** Given `rowActions`, the trailing column holds `ActionIcon`s with `data-variant="light"` and the right
  colour per kind.
  - The `href` actions are anchors.
  - Clicking an action never calls `onRowClick`.
  - No chevron is rendered.
  - On cards, each action measures at least 44px.
  - The computed tint background per colour is recorded in evidence.
- **AC3 [R3].** At count 0 the button is absent. At count 2 it is present, 44px, with the translated label containing
  2.
- **AC4 [R4].** The single and bulk states render through `MantineModal` + `MantineDialogFooter`. While `loading`,
  Cancel is disabled, a second confirm click calls `onConfirm` once, and Escape does not close the modal.
- **AC5 [R5].** In each container test, changing the filter, tab or page after selecting clears `selectedIds`.
- **AC6 [R6].** Per surface, the edit action produces the stated `href` or calls the stated handler (6 assertions).
- **AC7 [R7].** Per surface, row trash → confirm calls the single action with that id, and cancel calls nothing. The
  hand-built confirmations are gone: a grep for a red `Button` inside a local footer `Flex` in the six Views finds
  zero.
- **AC8 [R8].** Per surface: select 2 → bulk → confirm calls the bulk action with exactly those ids. A full result
  toasts success. A partial result toasts the partial message. Selection is empty afterwards.
- **AC9 [R9].** Each bulk smoke test proves these cases:
  - denied → no `from()` call;
  - happy → every id deleted;
  - guard → `failed` with the code while the others are deleted;
  - duplicates → one call per id;
  - 101 ids → `too_many` with no write;
  - DB error on one id → `failed`.

  A plant that bypasses the shared helper's guard in one bulk action makes that action's guard test fail; the
  restored hash must equal the pre-plant hash.
- **AC10 [R10].** `softDeleteUser(callerId)` and `softDeleteUsersBulk([callerId, otherId])` return `self` for the
  caller with no `update` on that id; the other id is processed. The caller's own row is unselectable, and its trash
  is disabled.
- **AC11 [R11].** With the flag false, the View renders no checkbox, trash or bulk button (one test per surface), and
  the server smoke denies as in AC9.
- **AC12 [R12].** A grep of the six Views and the three patterns finds no `lucide-react` import for the edit, delete
  or neutral row-action roles. Solar imports come from `@solar-icons/react/broken` subpaths.
- **AC13 [R13].** `check:i18n` exits 0, and each new key exists in all four locales.
- **AC14 [R14].** The new and extended Stories exist and import their component directly. `check:story-coverage`,
  `check:rendered-scope`, `check:pattern-enrolment` and `check:surface-census:changed` exit 0. The census shows no new
  FAIL line.
- **AC16 [R16].** `theme.ts` has no `thead` `backgroundColor` in the `Table` entry. Re-running 857's
  `151-opus-review13.mjs` gives every header cell `rgb(255, 255, 255)` in the four Stories, as before.
- **AC15 [R15].**
  - The full test suite shows only the known 790 failures, and more tests passed than the 857 baseline.
  - The registry row commands for rows 50, 67 and 85 and the new row all exit 0.
  - `npm run build` and `build-storybook` exit 0.

## 13. QA profile and verification plan

**Q4.** This task adds new destructive admin mutations, touches a registered critical flow (report delete) and the
user soft-delete guard, and changes a canonical pattern with eight consumers.

The gate block, run after the last edit, with every output under `docs/sessions/evidence/task919/` (the
tests run after the build):

```powershell
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:i18n
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:surface-census:changed
npm.cmd run check:pattern-enrolment
npm.cmd run check:enrolled-tailwind
npm.cmd run check:type-responsive
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run check:listing-reports-grants
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run test
npm.cmd run test:admin
npm.cmd run test:rls-guards
```

Expected results:
- `win32`.
- Lint: exit 0, or only errors outside task919 files, which you name.
- Every other command exits 0.
- `test`: only the known 790 failures.

Write `git hash-object` for every changed file in the same run.

**Measurement** (Playwright on the final `storybook-static`, DPR 1, sq, at 390 and 1440):
- the AC2 tint and size, and the 44px card targets;
- the AC1 selected background, sticky cell included;
- the AC3 button position at the end of the filter row: its right edge equals the row's right edge from `sm`;
- GR-3b / 3d / 3e / 3g receipts per matrix Story.

**OWNER VISUAL QA REQUIRED, O78-14** (Opus re-measures first):

| Story | State | Locale | Viewport |
|---|---|---|---|
| `Mantine/Primitives/Table` | `SelectionAndActions` (2 selected, header indeterminate, tinted pen/trash) | sq | 1440, 390 |
| `Patterns/Mantine/TableBulkDeleteButton` | `Default` | sq | 1440 |
| `Patterns/Mantine/DeleteConfirmModal` | `Single`, `Bulk` | sq | 1440, 390 |
| `Patterns/Mantine/AdminListingsView` | `Default`: 2 selected, bulk trash at the right end of the filter row, row pen/trash | sq | 1440, 390 |
| `Patterns/Mantine/AdminUsersTable` | `Default`: own row unselectable | sq | 1440 |
| `Patterns/Mantine/AdminCurrenciesView` | `Default` | sq | 1440 |
| `Patterns/Mantine/AdminExchangeProvidersView` | `Default`: toggle as a gray neutral action | sq | 1440 |
| `Patterns/Mantine/AdminPagesView` | `Default` | sq | 1440 |
| `Patterns/Mantine/AdminReportsView` | `Default` | sq | 1440 |

## 14. Completion report contract

Report:
- the files changed, with a hash per file;
- R1–R15 and AC1–AC15, each with its evidence path;
- the commands with their real exit codes;
- the measured tint backgrounds and sizes, and the GR-0 / GR-3a / GR-3b / 3d / 3e / 3g receipts;
- the consumers of `MantineDataTableToCards` and why each unchanged one is unchanged;
- any surface whose §7.3 fit broke;
- deviations, limitations and anything unresolved.

Update the 919 row in `docs/backlog.md` and write the session log
`docs/sessions/2026-10-xx-task919-table-row-selection-and-actions.md`. Your status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 15. Task quality gate

- GR-7: §3.1 / §3.2, receipt in the design response. GR-1: §3.4. GR-0 / GR-3a: §10.
- GR-3b / 3c / 3d / 3e / 3f / 3g lines: §10. GR-4: every AC states an observable property; absolutes: none.
- One route: owner decisions D78-13 … D78-16 are recorded, and none is open.
- Sequencing: starts after 857 is approved (shared files). 916 adopts this pattern afterwards. 915 no longer covers
  the six confirmations moved here.
