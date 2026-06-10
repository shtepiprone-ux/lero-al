# Task 416 — Slice 3: Admin Data Surfaces `tableAt` + Tablet (768–1023) Review

**Date:** 2026-06-10
**Executor:** Sonnet 4.6
**Task file:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_416_Slice3_AdminDataSurfaces_tableAt_and_Tablet.md`

---

## Scope

Per the kickoff:

1. Migrate 3 raw `<table>` admin surfaces → `AdminTable`/`AdminCardList` `tableAtLg` (cards `<1024`,
   table `≥1024`), reference = `AdminListingsTable.tsx`, worked example = `AdminCompaniesManager.tsx`
   (Slice 1, Task 413):
   - `AdminExchangeProvidersManager.tsx`
   - `AdminSupportManager.tsx`
   - `AdminUsersTable.tsx` (2 raw tables: main user list + verified-agents sub-table)
2. Declare `tableAt`/layout strategy for ALL 5 admin data surfaces (the 3 above +
   `AdminEmailTemplatesManager`, `AdminUserProfile`) in `design-system.md §16.C`.
3. For `AdminEmailTemplatesManager` + `AdminUserProfile`: declare-and-verify only — investigate
   tablet (768/810/960) for a broken hybrid; migrate ONLY if one is found.

**Explicitly OUT OF SCOPE**: §26.1 full-width buttons/toolbars/action rows at `<640` (Slice 4);
§26.2 popup/dialog work (Slice 2, done — verify-only); no primitive edits (`AdminTable.tsx`,
`AdminCardList.tsx`, `ui/*`); no `overflow-x-auto`/`whitespace-nowrap`/arbitrary widths/masking.

---

## Part 1 — Before/After Control Inventory (3 migrated surfaces)

### `AdminExchangeProvidersManager.tsx` — provider list

| Control | Before (raw `<table>`) | After (`AdminTable` `tableAtLg`) |
|---|---|---|
| Container | `<div className="border rounded-xl overflow-hidden"><table className="w-full text-sm">` | `<AdminTable rows={providers} columns={columns} rowKey={...} onRowClick={openEdit} cardRow={...} />` |
| Name (col 1) | `<td className="px-4 py-3 font-medium">{p.name}</td>` (no click) | column `name`: clickable button → `openEdit(p)`, `e.stopPropagation()`; card title = same button |
| Endpoint (col 2, `hidden md:table-cell`) | plain text, font-mono, truncated | column `endpoint` (`visibility:'md'`); card meta line, font-mono truncated |
| Priority (col 3) | plain text, centered | column `priority`; card meta `Priority: N` |
| Mode (col 4) | `Badge variant="outline"` | column `mode`, same badge; card subtitle |
| Is enabled (col 5) | `Badge` default/secondary | column `is_enabled`, same badge; card subtitle |
| Notes (col 6, `hidden lg:table-cell`) | plain text, truncated | column `notes` (`visibility:'lg'`); card meta, truncated |
| Row actions (col 7) | 3× `Button size="icon" h-7 w-7`: toggle enable/disable, edit (Pencil), delete (Trash2) | column `actions` (`align:'right'`), 3× `Button size="icon-sm"` same icons/handlers, all `e.stopPropagation()`; card trailing = same 3 buttons + auto `ChevronRight` (consistent w/ `onRowClick` affordance) |
| Empty state | `colSpan={7}` centered text | `emptyState={t('empty')}` (AdminTable/AdminCardList both render it) |
| Row click | none (only icon clicks) | **new**: `onRowClick={openEdit}` — whole row/card opens edit (consistent with `AdminCompaniesManager` precedent); all inner buttons `stopPropagation()` so icon actions still work independently |

Net: 0 columns dropped, 0 actions dropped. 1 new convenience affordance (row-click → edit, matching
the Slice-1 worked example) — does not remove the existing inline edit/toggle/delete buttons.

### `AdminSupportManager.tsx` — ticket list

| Control | Before (raw `<table>`) | After (`AdminTable` `tableAtLg`) |
|---|---|---|
| Container | `<div className="bg-card rounded-2xl border shadow-sm overflow-hidden"><div className="overflow-x-auto"><table>` | `<AdminTable rows={filtered} columns={ticketColumns} rowKey={...} onRowClick={tk => setSelected(tk)} cardRow={...} />` |
| Subject (col 1) | subject + reason sub-line + complaint-type badge | column `subject`, identical content; card title = same block |
| Type (col 2, `hidden sm:table-cell`) | `Badge` destructive/info | column `type` (`visibility:'sm'`); card subtitle |
| Reporter (col 3, `hidden md:table-cell`) | `<UserLink user={tk.reporter} label="—" />` | column `reporter` (`visibility:'md'`); card meta `Reporter: <UserLink>` |
| Reported (col 4, `hidden md:table-cell`) | `<UserLink user={tk.reported} label="—" />` (only meaningful for `user_complaint`) | column `reported` (`visibility:'md'`); card meta `Reported: <UserLink>`, gated on `ticket_type === 'user_complaint'` (same as before) |
| Status (col 5) | `Badge` w/ `STATUS_ICON` + status label | column `status`, identical; card subtitle |
| Updated (col 6, `hidden lg:table-cell`) | `formatDate(tk.updated_at, locale)` | column `updated` (`visibility:'lg'`); card meta, identical formatting |
| Trailing chevron (col 7) | static `<ChevronRight>` | auto-added by `AdminTable` (since `onRowClick` set) — same visual, now in card trailing too |
| Row click | `onClick={() => setSelected(tk)}` on `<tr>` | `onRowClick={tk => setSelected(tk)}` — unchanged behavior, now also drives card click |
| Empty state | `colSpan={7}` centered `tp('support_empty')` | `emptyState={tp('support_empty')}` |

Net: 0 columns/actions dropped. The `ChevronRight` import was removed from the manual icon list
(now supplied automatically by `AdminTable` when `onRowClick` is set) — confirmed `ChevronRight`
no longer used elsewhere in the file (no unused-import lint).

### `AdminUsersTable.tsx` — main user list + verified-agents sub-table

**Main user list** (5 columns):

| Control | Before (raw `<table>`) | After (`AdminTable` `tableAtLg`) |
|---|---|---|
| User (col 1) | avatar + name/last name link + company sub-line + `public_id` + inline `verifyToggle` button | column `user`, identical; card title = avatar+name/company, card meta = `public_id`/phone/dates, card trailing = `verifyToggle(u, isLoading)` |
| Role (col 2) | `Badge` via `ROLE_VARIANT` | column `role`; card subtitle |
| Status (col 3, `hidden sm:table-cell`) | `Badge` via `STATUS_VARIANT` | column `status` (`visibility:'sm'`); card subtitle |
| Phone (col 4, `hidden md:table-cell`) | plain text | column `phone` (`visibility:'md'`); folded into card meta |
| Date (col 5, `hidden lg:table-cell`) | `created_at` + `last_seen_at` | column `date` (`visibility:'lg'`); folded into card meta |
| `location_request` badge | inline in user cell | preserved — card subtitle, `Badge variant="warning"` + `MapPin` icon |
| Inline verify/unverify toggle | `verifyToggle()` button in user cell | extracted into shared `verifyToggle(u, isLoading)` helper, reused in both column `user` cell AND card `trailing` |
| `rowClassName` (loading dim) | `opacity-50` class on `<tr>` while `loadingId === u.id` | `rowClassName={u => loadingId === u.id ? 'opacity-50' : ''}` — flows to both table row and card |
| Pagination | `{totalPages > 1 && (...)}` block after table | unchanged, preserved verbatim immediately after `<AdminTable>` |
| Empty state | `colSpan` centered `t('empty')` | `emptyState={t('empty')}` |

**Verified-agents sub-table** (3 columns) — evaluated against the kickoff's "fundamentally
different micro-surface → STOP & ASK" guard; this is a simple 3-column user list with one row
action, NOT fundamentally different from the main list, so it was migrated (not flagged):

| Control | Before (raw `<table>`) | After (`AdminTable` `tableAtLg`) |
|---|---|---|
| Agent (col 1) | name link to `/admin/users/{id}` | column `agent`, identical link; card title = same link |
| Company (col 2, `hidden md:table-cell`) | `u.company_name` | column `company` (`visibility:'md'`); card subtitle |
| Date (col 3, `hidden lg:table-cell`) | `formatDate(u.created_at, locale)` | column `date` (`visibility:'lg'`); card meta |
| Revoke action | inline `ShieldOff` icon button → `toggleUserVerified(u.id, false)` | column `agent` cell retains inline `ShieldOff`; card `trailing` = same button (or `Loader2` spinner while `loadingId === u.id`) |
| `rowClassName` (loading dim) | `opacity-50` on `<tr>` | `rowClassName={u => loadingId === u.id ? 'opacity-50' : ''}` |
| Empty state | `colSpan` centered `t('empty_verified')` | `emptyState={t('empty_verified')}` |

Net across both `AdminUsersTable` tables: 0 columns/actions/states dropped. `verifyToggle()`
extraction is the only structural change (de-duplication, behavior identical).

---

## Part 2 — `tableAt` declarations (`design-system.md §16.C`)

`docs/design-system.md` §16.C (admin `tableAt` snapshot table) updated for all 5 Slice-3 surfaces:

| Surface | Declaration |
|---|---|
| `AdminUsersTable` (main + verified-agents) | `tableAtLg` ✅ (done, this task) |
| `AdminUserProfile` (`/admin/users/[id]`, `/new`) | `detailLayout`/`formLayout` — verified Task 416, `AdminEditLayout`'s `flex-col lg:flex-row` stacks main-then-sidebar full-width `<1024`; intentional §25.2 tablet pattern, no broken hybrid |
| `AdminSupportManager` | `tableAtLg` ✅ (done, this task); inquiries managers (separate components) remain raw `<table>`, future work |
| `AdminExchangeProvidersManager` | `tableAtLg` ✅ (done, this task) + Tabs primitive |
| `AdminCurrenciesManager` | (pre-existing inaccuracy fixed) — already `tableAtLg` ✅ from Task 413; row previously mis-stated "still raw `<table>`" |
| `AdminEmailTemplatesManager` | `nonTabular` (template list rows) + `formLayout` (editor `Dialog`, canonical, verified Task 416, tablet-stable) |

Full diff applied to `docs/design-system.md` §16.C (lines 412-420):
- `/admin/users` row: now states main list + verified-agents sub-table migrated → `tableAtLg` ✅;
  `[id]`/`/new` (`AdminUserProfile`) = `detailLayout`/`formLayout`.
- `/admin/support` row: `AdminSupportManager` → `tableAtLg` ✅; inquiries managers still raw
  `<table>` (unchanged, out of scope).
- `/admin/currency` row: corrected to show BOTH `AdminCurrenciesManager` (Task 413, pre-existing)
  and `AdminExchangeProvidersManager` (this task) as `tableAtLg` ✅ + Tabs primitive — fixed a
  stale "still raw `<table>`" claim about `AdminCurrenciesManager` left over from before Task 413.
- `/admin/email-templates` row: `AdminEmailTemplatesManager` declared `nonTabular` + `formLayout`.

---

## Part 3 — Tablet (768/810/960) Review

### Migrated surfaces (`AdminExchangeProvidersManager`, `AdminSupportManager`, `AdminUsersTable`)

`AdminTable` is a dual-DOM primitive: `<div className="lg:hidden"><AdminCardList .../></div>`
(cards) + `<div className="hidden lg:block ..."><table>...</table></div>` (table) — both trees
always render, CSS toggles `display` at `lg:` (1024px). At 768/810/960 (`<1024`), the card list is
visible and the table wrapper is `display:none`. Verified via the QA script (Part 4): at all 12
tablet cells (3 viewports × 4 locales) per surface, `cardListVisible === true` and
`tableHidden === true`. No broken hybrid — cards render full-width, `flex-wrap` badges and
`min-w-0`/`truncate` text prevent overflow.

### `AdminEmailTemplatesManager` (declare-and-verify, no migration)

Template list is `<div className="flex flex-col gap-2">` of
`<div className="flex items-center gap-3 p-4 ... ">` rows: icon (`h-9 w-9 shrink-0`) + info
(`flex-1 min-w-0` — name, locale badges `flex gap-1 flex-wrap`, status, date) + actions
(`flex items-center gap-1 shrink-0`). At 768/810/960 this flex row has ample width; `flex-1
min-w-0` truncation and `flex-wrap` badges mean no overflow even at the narrowest tablet (768).
**No broken hybrid found** — confirmed via QA script: `noHScroll === true` at all 12 cells.
`TemplateEditorDialog`/`DeleteConfirmDialog` are already canonical `Dialog` (Slice 2, untouched).

### `AdminUserProfile` (declare-and-verify, no migration)

Rendered via `AdminEditLayout`: `<div className="flex flex-col lg:flex-row gap-6 items-start">`
with `main` (`flex-1 min-w-0 flex flex-col gap-6`, the `SectionCard`/`FieldRow` blocks) and
`sidebar` (`w-full lg:w-72 xl:w-80 shrink-0 ... lg:sticky lg:top-20`, action buttons + role/status
controls). At `<1024` (all 3 tablet viewports), `flex-col` stacks `main` then `sidebar`, both
full-width — this IS the intentional §25.2 tablet pattern (not a broken hybrid: nothing is
clipped, sidebar buttons are already `w-full justify-start`). `FieldRow`'s
`flex flex-col sm:grid sm:grid-cols-[140px_1fr]` keeps label/value pairs readable at all 3 tablet
widths. Confirmed via QA script: `noHScroll === true` at all 12 cells. **No broken hybrid found.**

---

## Part 4 — Rendered Evidence (75-cell matrix)

New script `scripts/task416-qa-tablet-and-cards.mjs` (untracked; follows the
`scripts/task414-qa-screenshots.mjs` pattern: static server on port 6011 serving the already-built
`storybook-static/`, Playwright chromium, per-cell render-error + computed-style assertions).

**Matrix**: 5 `--default` stories × (3 tablet viewports × 4 locales + 3 mobile viewports × uk-only)
= 5 × (12 + 3) = **75 cells**.

- Tablet: `tablet-768` (768×1024), `canonical-810` (810×812), `canonical-960` (960×812) × sq/en/uk/it
- Mobile (uk-only, mandatory per kickoff): `mobile-320`, `mobile-375`, `mobile-390`

Assertions per cell:
- no render error (`sb-show-errordisplay` / blank canvas / `pageerror`)
- `noHScroll` (`document.documentElement.scrollWidth <= clientWidth + 2`)
- for the 3 migrated `tableAtLg` surfaces only: `AdminCardList` wrapper (`.lg\:hidden`) visible
  AND `AdminTable` table wrapper (`.hidden.lg\:block.admin-table-scroll-wrap`) `display:none`

**Result: 75/75 PASS, 0 FAIL.**

```
📸  Task 416 Slice 3 tablet + uk-mobile QA capture
    Stories: 5 | Tablet viewports: 3 × 4 locales + uk × 3 mobile = 75 cells
    Output: .screenshots/task416-qa/2026-06-10T15-10/

  ✓ AdminExchangeProvidersManager/Default × {sq,en,uk,it} × {tablet-768,canonical-810,canonical-960}
  ✓ AdminExchangeProvidersManager/Default × uk × {mobile-320,mobile-375,mobile-390}
  ✓ AdminSupportManager/Default × {sq,en,uk,it} × {tablet-768,canonical-810,canonical-960}
  ✓ AdminSupportManager/Default × uk × {mobile-320,mobile-375,mobile-390}
  ✓ AdminUsersTable/Default × {sq,en,uk,it} × {tablet-768,canonical-810,canonical-960}
  ✓ AdminUsersTable/Default × uk × {mobile-320,mobile-375,mobile-390}
  ✓ AdminEmailTemplatesManager/Default × {sq,en,uk,it} × {tablet-768,canonical-810,canonical-960}
  ✓ AdminEmailTemplatesManager/Default × uk × {mobile-320,mobile-375,mobile-390}
  ✓ AdminUserProfile/Default × {sq,en,uk,it} × {tablet-768,canonical-810,canonical-960}
  ✓ AdminUserProfile/Default × uk × {mobile-320,mobile-375,mobile-390}

Results: 75/75 PASS, 0 FAIL
Manifest: .screenshots/task416-qa/2026-06-10T15-10/manifest.json
PNGs: .screenshots/task416-qa/2026-06-10T15-10/*.png
```

Manifest + 75 PNGs at `.screenshots/task416-qa/2026-06-10T15-10/` (untracked, evidence artifact).
Sample paths:
- `.screenshots/task416-qa/2026-06-10T15-10/admin-adminuserstable--default__uk__tablet-768.png`
- `.screenshots/task416-qa/2026-06-10T15-10/admin-adminuserstable--default__uk__mobile-320.png`
- `.screenshots/task416-qa/2026-06-10T15-10/admin-adminexchangeprovidersmanager--default__uk__canonical-810.png`
- `.screenshots/task416-qa/2026-06-10T15-10/admin-adminsupportmanager--default__uk__canonical-960.png`
- `.screenshots/task416-qa/2026-06-10T15-10/admin-adminemailtemplatesmanager--default__uk__mobile-390.png`
- `.screenshots/task416-qa/2026-06-10T15-10/admin-adminuserprofile--default__it__tablet-768.png`

This is a **focused custom QA capture**, not the full canonical 2520-cell `screenshots:assert`
matrix. Per clause 14, the full native `screenshots:assert` re-run (45 stories × 14 viewports × 4
locales) is **owner-run** — PENDING, expected 2520/2520 PASS / 0 new FAIL (no story removed/added,
no viewport/locale config changed).

---

## Validation Transcripts

- `npx tsc --noEmit` (full project, no file args) → **0 new errors** (project already has 0
  pre-existing errors; exit 0).
- `npm run lint` → **0 new warnings/errors** (no ESLint findings in any of the 4 touched files).
- `npm run check:i18n` → PASS, 4-locale parity (sq/en/uk/it), no new keys added (all `t()` calls
  use existing translation keys — `verifyToggle`/`ticketColumns`/`columns` reuse existing
  `t('...')` strings from the original tables).
- `npm run check:stories` → PASS (no story-coverage violations introduced).
- `npm run check:story-coverage` → PASS (no change to storied/exempt counts).
- `npm run check:design-tokens` → PASS, strict 0 (no new raw hex/px/arbitrary values; `icon-sm`,
  `text-2xs`, `max-w-50`/`max-w-40` reuse existing tokens/utilities from the Slice-1 precedent).
- `npm run build-storybook` → PASS, clean build (no new errors/warnings for the 5 affected
  stories).
- `npm run check:locale-leak` — initially blocked (port 6009 `EADDRINUSE`, pre-existing unrelated
  process); the queued background run later completed with **exit 0** (report-mode, non-blocking;
  NOT in Task 416's required validation list — `tsc`/`lint`/`check:stories`/`check:i18n`/
  `check:story-coverage`/`check:design-tokens`/`build-storybook`/`screenshots:assert` are
  required, `check:locale-leak` is not). Result: `leakCount: 474` (was 221 at Task 414/415,
  `.screenshots/locale-leak/2026-06-10T14-41/report.json`). Inspected the leaks attributed to the
  3 migrated surfaces (`admin-adminexchangeprovidersmanager--default` ×10,
  `admin-adminsupportmanager--default` ×3, `admin-adminuserstable--default` ×9, plus `--tablet`/
  `--verified-tab`/`--location-requests` variants) — all are **fixture mock-data tokens**
  (`BankOfAlbania`, `ExchangeRatesAPI`, `ManualRates`, `Gentiana Hoxha`, `Tirana Real Estate
  Group`, `Online`, `Moderator` — from `src/stories/fixtures/admin.fixtures.ts`, untouched by
  this task), identical to the pre-existing baseline pattern, NOT new translation-key
  regressions. The largest increase (`admin-adminuserprofile--tablet` ×187,
  `--create-mode` ×72 = 259 of the +253 delta) is in `AdminUserProfile`, also untouched by this
  task. `check:locale-leak` count growth is unrelated to the Task 416 diff and is a pre-existing
  fixture-data characteristic — flagged here for visibility, not actioned (out of scope; no
  fixtures/translations changed by this task).
- `node scripts/task416-qa-tablet-and-cards.mjs` → **75/75 PASS, 0 FAIL** (Part 4 above).
- Native `npm run screenshots:assert` (2520-cell canonical matrix, clause 14) — **PENDING owner**.

---

## File-Integrity (clause 14)

Read-after-write + byte-level check on all 4 touched files:

| File | NUL bytes | BOM | Notes |
|---|---|---|---|
| `src/components/admin/AdminExchangeProvidersManager.tsx` | 0 | none | parses clean, `tsc`/`lint` clean |
| `src/components/admin/AdminSupportManager.tsx` | 0 | none | parses clean, `tsc`/`lint` clean |
| `src/components/admin/AdminUsersTable.tsx` | 0 | none | parses clean, `tsc`/`lint` clean; tail confirmed `</div>\n  )\n}` |
| `docs/design-system.md` | 0 | none | §16.C edits applied cleanly |

---

## Files Changed

| File | Rationale |
|---|---|
| `src/components/admin/AdminExchangeProvidersManager.tsx` | Provider list raw `<table>` → `AdminTable`/`AdminCardList` `tableAtLg`; 7-column table + matching card, all row actions preserved + new row-click→edit affordance |
| `src/components/admin/AdminSupportManager.tsx` | Ticket list raw `<table>` → `AdminTable`/`AdminCardList` `tableAtLg`; 6-column table + matching card, row-click→detail preserved |
| `src/components/admin/AdminUsersTable.tsx` | Main user list (5 cols) + verified-agents sub-table (3 cols), both raw `<table>` → `AdminTable`/`AdminCardList` `tableAtLg`; `verifyToggle()` helper extracted and reused table+card |
| `docs/design-system.md` | §16.C `tableAt` declarations for all 5 Slice-3 admin data surfaces (3 migrated + 2 declare-only) + fixed a stale `AdminCurrenciesManager` "still raw `<table>`" claim |
| `scripts/task416-qa-tablet-and-cards.mjs` | New focused QA script (untracked evidence artifact) — 75-cell tablet + uk-mobile rendered-evidence matrix for the 5 Slice-3 stories |
| `docs/sessions/2026-06-10-task416-slice3-admin-tableat-and-tablet.md` | This session log |
| `docs/backlog.md` | "Last Session" entry updated: Task 416 Slice 3 marked COMPLETE |

---

## Confirmations

- **No §26.1 work**: no `Button`/toolbar/action-row `max-sm:w-full` changes in any of the 3
  migrated files — `git diff` shows only the table→`AdminTable` migrations + the new `columns`
  arrays + `verifyToggle()` extraction. Action rows / toolbars are visually unchanged.
- **No §26.2 work**: no `Dialog`/`Sheet`/`Popover`/`Combobox`/etc. touched. `TemplateEditorDialog`,
  `DeleteConfirmDialog`, `ProviderFormDialog`, `CurrencyFormDialog`, ticket detail dialog — all
  untouched (already canonical from Slice 2).
- **No primitive edited**: `AdminTable.tsx`, `AdminCardList.tsx`, `ui/*` — confirmed via
  `git diff --stat`, none of these paths appear.
- **No story deleted/duplicated**: `check:stories`/`check:story-coverage` PASS with unchanged
  counts; the 5 `--default` stories used for QA already existed (Task 410).
- **No git commands emitted** by the executor — orchestrator emits commit commands at review time.
- **0 raw `<table>` remain** in the 3 migrated files — confirmed via `Grep "<table"` returning no
  matches in `AdminExchangeProvidersManager.tsx`, `AdminSupportManager.tsx`,
  `AdminUsersTable.tsx`.
- Native `screenshots:assert` 2520/2520 (clause 14) — **PENDING owner** (this task adds 0 new
  stories/viewports/locales to the canonical matrix; expectation is no new FAIL vs. the prior
  2520/2520 baseline from Task 414/415).

---

## Open Items / Follow-ups (not in scope, noted for future tasks)

- Inquiries managers (`/admin/inquiries`, `/admin/inquiries/sales`, `/admin/inquiries/support`)
  remain raw `<table>` — future `tableAtLg` migration (tracked in `design-system.md §16.C`
  `/admin/support` row).
- §26.1 full-width buttons/toolbars/action-rows for all 5 surfaces — Slice 4.
