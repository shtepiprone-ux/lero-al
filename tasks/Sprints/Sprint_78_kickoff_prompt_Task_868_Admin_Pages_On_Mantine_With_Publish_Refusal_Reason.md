# Task 868 — `/admin/pages` on canonical Mantine, and a refused publish tells the admin why

Sprint 78 · **P3** · QA profile **Q3** (a legacy admin surface migrated to Mantine, with a new visible error state) ·
**depends on 877** (hard: 877's `MantineDataTableToCards` extension, the `AdminPageHeader` adapter and the admin page
wrapper pattern) · owner action **O78-7** · **Status: `KICKOFF FILED` 2026-09-25**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md).
Origin: reserved 2026-09-21 by Task 867's design. It is in Sprint 79 by origin and routed to Sprint 78 (admin Mantine)
by goal fit. The reserved row's full text moves into §3 of this file.
Precedents to follow: 874 and 877 (`tasks/Sprints/Sprint_78_kickoff_prompt_Task_874_…md`,
`…_Task_877_…md`) for the container/View split, `MantineModal` dialogs, the delete confirm, Stories and manifest.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration. Bundles: **UI / Layout / Component (current Mantine path)**, **Storybook / Visual
Proof**, **Component Catalog / Coverage**, **Regression / Critical Flow Coverage**.

- **Current/legacy boundary.** `/admin/pages` is legacy today (census §3.2). After this task it is canonical Mantine,
  with no `@/components/ui/*` import and no new `className`.
- **Outside this task.** `AdminInput` (7 other consumers), `AdminPageHeader` (877 owns it) and every legacy
  `ui/*` primitive file are not migrated here. This surface stops importing them (tier 2) or consumes 877's migrated
  version (tier 3).

## 2. Objective

1. When the server refuses a publish with `sq_body_required` (Task 867's guard), the editor shows a specific,
   localized message on the Albanian body field and switches to the `sq` tab. The generic `save_error` toast no longer
   appears for that case.
2. `/admin/pages` renders only canonical Mantine:
   - containers `AdminPagesManager` and `PageEditorDialog` hold state and actions;
   - presentational Views `AdminPagesView` and `PageEditorDialogView` each have their own Story and manifest entry;
   - the page wrapper is Mantine with a theme width token;
   - the delete confirmation is a `MantineModal`, not `window.confirm`.
3. **Rider (reserved row).** `admin.footer.link_url_invalid_internal` no longer says *"until page creation is
   available"* in any locale. Page creation has existed since Task 326A.

## 3. Verified context — measured 2026-09-25 (re-measure at I0; 877 must have landed)

### 3.1 The defect (reserved row, re-verified)

- **F1 FACT.** `createPage` / `updatePage` return `{ error: 'sq_body_required' }` on an `is_published: true` write
  with an empty `content.sq.body` (`src/modules/admin/actions/index.ts:235`, `:275`). This is Task 867's guard, proven
  by `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts:331-388`.
- **F2 FACT.** `src/components/admin/AdminPagesManager.tsx:123-129` maps only `slug_already_used`, `slug_reserved` and
  `slug_invalid_format` to the inline slug error. **Every other error** goes to `toast.error(tLegal('save_error'))`,
  so the admin sees "save error" with no reason.
- **F3 FACT.** No `sq_body_required` key exists in `messages/*.json` (`admin.pages` holds the other editor keys).
- **F4 FACT — rider text (all four locales end with the obsolete clause).** `admin.footer.link_url_invalid_internal`:
  - `en`: *"This internal page does not exist yet. Use an existing route or disable this link until page creation is
    available."*
  - `sq`: *"… ose çaktivizoni këtë lidhje derisa krijimi i faqeve të jetë i disponueshëm."*
  - `uk`: *"… або вимкніть це посилання, доки створення сторінок не буде доступне."*
  - `it`: *"… o disattiva questo link finché la creazione delle pagine non sarà disponibile."*

### 3.2 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface "src/app/admin/pages/page.tsx"`, 2026-09-25

14 nodes. Exit 1 (`GR-1 CENSUS BLOCKED`), as expected for an unmigrated surface.

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition in this task |
|---|---|---|---|---|---|---|
| `src/app/admin/pages/page.tsx` | 1 | no | no | 1 | 0 | migrate the wrapper (R6); the route root's own census key stays baselined, as in 877 |
| `src/components/admin/AdminPagesManager.tsx` | 1 | no | no | 60 | 13 | split: container `AdminPagesManager` + View `AdminPagesView` + container `PageEditorDialog` + View `PageEditorDialogView` (R2–R5) |
| `src/components/admin/AdminPageHeader.tsx` | 1 → **3 after 877** | 877 | 877 | 4 today | 0 | consumed unchanged; 877 R3 migrates it (adapter over `MantineDashboardHeader`, own Story, manifest) |
| `src/components/admin/AdminInput.tsx` | 1 | no | exempt (`story-coverage-exempt.json:6`) | 1 | 1 | **import removed** — Mantine `TextInput` replaces it. Seven other files still use it, so it is not this task's to migrate |
| `src/components/shared/RelativeTime.tsx` | 1 | yes | yes | 0 | 0 | reused unchanged |
| `patterns/MantineTooltip.tsx`, `patterns/responsiveBottomSheet.tsx` | 1 | yes | yes | 0 | 0 | reached through `RelativeTime`; unchanged |
| `ui/badge`, `ui/button`, `ui/dialog`, `ui/label`, `ui/tabs`, `ui/textarea`, `ui/input` | 2 | — | — | — | — | **imports removed** (asserted by the census) |

`scripts/surface-census-baseline.json:613-646` holds the surface's 12 keys today. `AdminPagesManager` has no legacy
Story (`src/components/admin/*.stories.tsx`: none), and no `.stories.tsx` imports it.

### 3.3 Current behaviour to preserve — read from `AdminPagesManager.tsx` (367 lines)

| Area | Today | Line |
|---|---|---|
| Migration-pending banner | Shown when any page has legacy (non-`sq`-keyed) content. Warning styling, `AlertTriangle`, `migration_pending_banner`. It **disables** "new", edit and delete. | `:243`, `:274-279`, `:286`, `:342-351` |
| "New page" button | right-aligned, `Plus` icon, `btn_new`; opens the editor in create mode | `:281-291` |
| Empty list | `legal.empty_text` + an outlined `btn_add_first` button (hidden while migration is pending) | `:294-302` |
| Table columns | title (`getDisplayTitle`), slug (mono, hidden below `md`), status badge (`success`/`neutral`, `status_published`/`status_draft`), updated (`RelativeTime`, hidden below `lg`), actions | `:304-361` |
| Row actions | preview link (published only, new tab, `/${activeLocale}/${slug}`, title `preview_open`); edit; delete. Icon-only, **no accessible name** today | `:327-356` |
| Delete | `window.confirm(delete_confirm)` → `deletePage` → toast `delete_success`/`delete_error`; the row is removed; a spinner replaces the row's actions and the row dims while deleting | `:247-260`, `:316`, `:328` |
| Editor dialog | title `modal_title_new`/`modal_title_edit`; four locale tabs (`editor_locale_*`), opening on the admin locale; a dot on a tab whose title is filled | `:137-156` |
| Per-locale fields | empty-locale warning on non-`sq` tabs with no title and no body; title (`*` on `sq`); body textarea, monospace, 10 rows, placeholder `<h2>...</h2><p>...</p>` | `:157-187` |
| Slug | auto-derived from the `sq` title until edited by hand; live `validateSlug`; inline error; `slug_url_warning` when editing an existing page | `:88-102`, `:190-201` |
| Publish toggle | a button that flips published/draft (`toggle_published`/`toggle_draft`, `Eye`/`EyeOff`) | `:203-214` |
| Save | disabled while saving, while the `sq` title is empty, or while there is a slug error. Trims all fields. Slug errors go inline; others go to the `save_error` toast. Success → `save_success` toast, close, `router.refresh()` | `:104-133`, `:216-221` |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | F1–F3 | On `result.error === 'sq_body_required'`, the editor sets `activeTab = 'sq'` and shows the new key `admin.pages.sq_body_required` as the **`error`** of the `sq` body `Textarea`. No toast. The error clears on the next edit of the `sq` body. Other errors keep today's mapping (slug errors inline, the rest `save_error`). New key in all four locales — `en` *"A published page needs Albanian content. Fill in the Albanian body or save it as a draft."*; `sq` *"Një faqe e publikuar ka nevojë për përmbajtje në shqip. Plotësoni tekstin në shqip ose ruajeni si draft."*; `uk` *"Опублікована сторінка потребує вмісту албанською. Заповніть текст албанською або збережіть як чернетку."*; `it` *"Una pagina pubblicata richiede il contenuto in albanese. Compila il testo in albanese o salvala come bozza."* | P1 | AC1, AC2 | Confirmed |
| **R2** | component-rules P0 (container/View) | **`AdminPagesManager`** stays the exported container with the same props `{ pages, adminLocale }`. It keeps `items`, `modal`, `deletingId`, the delete target, `router.refresh`, `deletePage` and the toasts. It renders only `<AdminPagesView …/>`, with 0 `className` and 0 `ui/*` imports (GR-1 container exemption). | P1 | AC3 | Confirmed |
| **R3** | §3.3; GR-0 | **`src/components/admin/AdminPagesView.tsx`** (new, presentational, props only). Contents:<br>• the migration banner as Mantine `Alert` (`color="yellow"`, `variant="light"`, `AlertTriangle` icon at `theme.other.iconSize.standard`);<br>• the "new" `Button` (`leftSection` `Plus`, disabled while pending);<br>• the list via `MantineDataTableToCards` with columns title, slug (`visibleFrom="md"`, monospace `Text`), status (`Badge` `variant="light"`, `color="green"` published / `"gray"` draft), updated (`RelativeTime`, `visibleFrom="lg"`), and actions;<br>• the actions as `ActionIcon`s with `aria-label`: preview (`preview_open`, an anchor to the same URL, new tab, published only), edit (`common.edit`), delete (`common.delete`). All are disabled while migration is pending; delete shows `loading` while that row is deleting;<br>• a `card` config for mobile: title, badge, slug and updated in `meta`, actions in the header;<br>• the empty state: `emptyLabel` = `legal.empty_text` plus the `btn_add_first` button when not pending;<br>• the delete confirm as a controlled `MantineModal` (title `delete_confirm`, body = the page's display title, footer `common.cancel` / `common.delete` with `color="red"`).<br>Row ids go to the table as `String(page.id)`. The View has 0 `className`, 0 `ui/*` imports, and no raw colour/px/rem values. Replacing the row dimming with the delete `loading` state is a recorded change (§9). | P1 | AC3, AC5 | Confirmed |
| **R4** | component-rules P0 | **`PageEditorDialog`** (new container, `src/components/admin/PageEditorDialog.tsx`) takes over `PageEditorModal`'s state and logic unchanged: `localeData`, `slug`, `slugManual`, `slugError`, `published`, `saving`, `activeTab`, the new `sqBodyError`, `toSlug`, `validateSlug`, the save call and the R1 mapping. It renders only `<PageEditorDialogView …/>`. The pure helpers (`toSlug`, `isLegacyContent`, `getLocaleContent`, `isMigrationPending`, `getDisplayTitle`) move unchanged to `src/components/admin/adminPagesContent.ts`, and both containers import them. | P1 | AC1, AC3 | Confirmed |
| **R5** | §3.3; GR-0 | **`src/components/admin/PageEditorDialogView.tsx`** (new, presentational). Contents:<br>• a controlled `MantineModal` (`size="lg"`, title `modal_title_new`/`_edit`);<br>• Mantine `Tabs` over the four locales. A tab whose title is filled carries a `Check` icon at `theme.other.iconSize.compact`, `c="brand"`, `aria-hidden`; this replaces the 6 px dot (§9);<br>• per tab: the empty-locale `Alert` (yellow, light, same condition), a `TextInput` title (`label` `field_title_label`, `withAsterisk` on `sq`, placeholder = the locale label), and a `Textarea` body (`label` `field_body_label`, `ff="monospace"`, `minRows={10}`, `autosize`, the same placeholder, `error` = R1's message on `sq`);<br>• the slug `TextInput` (`ff="monospace"`, `error` = slug error, `description` = `slug_url_warning` when editing);<br>• the publish state as a Mantine `Switch` (label `toggle_published` when on, `toggle_draft` when off);<br>• a footer with `common.cancel` and the save `Button` (`loading` while saving, disabled on the same three conditions).<br>It has 0 `className` and 0 `ui/*` imports. | P1 | AC4, AC5 | Confirmed |
| **R6** | §3.2; 877 R5 precedent | **`page.tsx`**: the wrapper `div` becomes `<Box p={{ base: 'xl', lg: '2xl' }} maw={…} mx="auto">`, the same form 877 lands for `/admin/currency`. The width comes from a new theme token **`theme.other.layout.adminPageNarrowMaxWidth`** (legacy `max-w-4xl` = 56rem). Use the value type and server-safe read helper 877 establishes for `adminPageMaxWidth`. The data read and `AdminPageHeader` usage do not change. | P2 | AC6 | Confirmed (token form follows 877) |
| **R7** | GR-3, 16c | Stories under `src/stories/patterns/mantine/`, each statically importing its View, with fixtures only:<br>• `Patterns/Mantine/AdminPagesView`: `Default` (3 pages, mixed published/draft), `Empty`, `MigrationPending`, `Deleting` (one row `loading`), `DeleteConfirm` (modal open);<br>• `Patterns/Mantine/PageEditorDialogView`: `New`, `EditPublished` (with `slug_url_warning`), `EmptyLocaleWarning` (an empty `en` tab active), `SlugError`, `SqBodyRequired` (the R1 error on `sq`), `Saving`.<br>Both Views are enrolled in `scripts/mantine-migration-scope.json`. `check:story-coverage` passes. | P1 | AC5 | Confirmed |
| **R8** | F4 (rider) | `admin.footer.link_url_invalid_internal` in all four locales keeps its first two sentences' meaning and drops the "until page creation is available" clause. `en`: *"This internal page does not exist yet. Create it under Pages or use an existing route."*; `sq`: *"Kjo faqe e brendshme nuk ekziston ende. Krijojeni te Faqet ose përdorni një rrugë ekzistuese."*; `uk`: *"Ця внутрішня сторінка ще не існує. Створіть її в розділі «Сторінки» або використайте існуючий маршрут."*; `it`: *"Questa pagina interna non esiste ancora. Creala in Pagine o usa un percorso esistente."* | P3 | AC7 | Confirmed |
| **R9** | 16d; 877 R8 precedent | After the migration, `check-surface-census.mjs --surface src/app/admin/pages/page.tsx` shows:<br>• no tier-2 node;<br>• the Views as `manifest:yes story:yes`;<br>• the two containers as container-exempt;<br>• `AdminPageHeader` as 877 left it;<br>• no `AdminInput` node.<br>`scripts/surface-census-baseline.json` is regenerated with `npm.cmd run check:surface-census:changed:update-baseline`. Every removed key must be one of the 12 `admin/pages` keys at `:613-646`; **no key may be added**, and no other surface's key may change. `page.tsx`'s own route-root key may stay. | P0 | AC8 | Confirmed |
| **R10** | Q3; clause 15 | Tests, with the plant transcripts kept, in `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx` (new; `@/modules/admin/actions`, `@/lib/toast` and `next/navigation` mocked):<br>• **T1** save with `{ error: 'sq_body_required' }` → the `sq` tab is active, the body shows the R1 message, and there is no toast;<br>• **T2** `{ error: 'slug_already_used' }` → inline slug error, no toast;<br>• **T3** `{ error: 'boom' }` → `save_error` toast;<br>• **T4** delete → the confirm modal opens; confirm → `deletePage(id)`, row removed, `delete_success`; cancel → no call;<br>• **T5** a legacy page in `pages` → the banner shows, and "new", edit and delete are disabled;<br>• **T6** a new page: typing the `sq` title fills the slug until the slug is edited by hand.<br>The existing `pages-and-footer-validation.smoke.test.ts` passes unchanged. | P0 | AC2, AC9 | Confirmed |

## 5. Assumptions and open questions

1. **877's APIs are a precondition.** R3 uses `TableColumn.visibleFrom` and a `ReactNode` `emptyLabel`. R6 uses
   877's page wrapper form and token helper. `AdminPageHeader` must be 877's adapter. **If 877 has not landed, or its
   final API differs, stop and report `PREMISE DRIFT — 877`** with the diff; do not add those APIs here.
2. **Glyph change on the locale tab.** The filled-title marker becomes a `Check` icon (a theme icon size, the brand
   colour), not a 6 px dot, because no canonical dot/indicator contract exists for tabs. It is in the owner visual
   matrix (§13.3). A returned tuple reopens R5 with the owner's alternative.
3. **Wider tables between 640 and 1023 px?** No. `visibleFrom` keeps today's hiding of slug below `md` and updated
   below `lg`.
4. **Not in scope, and not an owner decision:** migrating `AdminInput`, the `ui/*` primitive files, or
   `/admin/footer` (which will share the R6 token later).

## 6. Pre-read rule bundle

- `docs/golden-rules.md` in full: GR-0 to GR-6, **including GR-1's container exemption**.
- `docs/agent-contract.md`: clauses 1, 3, 4, 5, 6, 6a, 7, 9, 10, 11, 12, 13, 14, 16, 16b, 16c, 16d.
- `docs/rule-index.md`: "UI / Layout / Component (current Mantine path)", "Storybook / Visual Proof", "Component
  Catalog / Coverage", "Regression / Critical Flow Coverage".
- `docs/mantine-responsive-design-system.md`, `docs/tailadmin-style-reference.md`, `docs/component-rules.md`
  (container/presentational split; i18n), `docs/qa-profiles.md` (`Q3`).
- The executed 877 kickoff (§4 R1–R5) and 874 kickoff (R2–R4, the delete confirm), read-only.
- `docs/orchestrator-procedures.md` → the 818/819 corollary (Node I/O; hash witnesses).

## 7. Scope — the exact allowed write set

1. `src/app/admin/pages/page.tsx`
2. `src/components/admin/AdminPagesManager.tsx` (container)
3. `src/components/admin/AdminPagesView.tsx`, `PageEditorDialog.tsx`, `PageEditorDialogView.tsx`,
   `adminPagesContent.ts` (new)
4. `src/stories/patterns/mantine/AdminPagesView.stories.tsx`, `…/PageEditorDialogView.stories.tsx` (new)
5. `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx` (new)
6. `src/design-system/mantine/theme.ts`: the one `adminPageNarrowMaxWidth` key (and its type line)
7. `messages/sq.json`, `en.json`, `uk.json`, `it.json`: `admin.pages.sq_body_required` (new) and
   `admin.footer.link_url_invalid_internal` (R8)
8. `scripts/mantine-migration-scope.json` (two entries), `scripts/surface-census-baseline.json` (R9 removals only),
   `docs/component-catalog.md` if the catalog check requires rows for the new Views
9. `docs/sessions/2026-09-2?-task868-admin-pages-mantine.md`, `docs/sessions/evidence/task868/*`
10. `docs/backlog.md`: the 868 registry cell only

## 8. Out of scope

- `src/modules/admin/actions/**` (867's guard stands as is), the `pages` table, RLS and grants.
- `AdminInput.tsx`, `AdminPageHeader.tsx` (877), every `src/components/ui/*` file, and `/admin/footer`.
- New features: rich-text editing, preview in the dialog, pagination.

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| Publish refused for an empty Albanian body | generic `save_error` toast | **`sq` tab active, specific message on the `sq` body field, no toast** |
| Other save errors | slug inline / `save_error` toast | unchanged |
| Migration-pending banner and its disabling | legacy warning box | Mantine `Alert`; the same condition and the same three controls disabled |
| Table / mobile | legacy table on every width; slug hidden below `md`, updated below `lg` | `MantineDataTableToCards`: a table from 640 px with the same `visibleFrom` hiding; **cards below 640 px** (canonical admin card) |
| Row actions | icon buttons with no accessible name | `ActionIcon`s with `aria-label` (preview / edit / delete) |
| Delete confirmation | `window.confirm` | `MantineModal` confirm (bottom sheet below 640 px), the same texts and outcome |
| Row while deleting | dimmed row + spinner | the delete `ActionIcon` shows `loading`; no row dimming (**changed**, recorded) |
| Filled-title marker on a locale tab | 6 px dot | `Check` icon, theme size (**changed**, owner matrix) |
| Publish toggle | text button with `Eye`/`EyeOff` | Mantine `Switch` with the same two labels |
| Footer link error text | ends "until page creation is available" | reworded (R8) |
| Everything else in §3.3 | — | **unchanged** |

## 10. Implementation requirements

### 10.1 I0 — before writing anything

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` (must start `win32`).
2. Save `git --no-optional-locks status --porcelain` → `docs/sessions/evidence/task868/01-status-before.txt`, plus the
   `git hash-object` of every path it lists as modified.
3. **877 gate.** Confirm that 877 is archived in `docs/backlog-archive.md`, and that `TableColumn.visibleFrom`,
   `adminPageMaxWidth` and `AdminPageHeader`'s adapter exist in the tree. Quote the lines. Otherwise stop with
   `PREMISE DRIFT — 877`.
4. Re-run the §3.2 census → `02-census-before.txt`. A node absent from §3.2 goes to the session log with a tier. If
   that node is unmigrated and not covered by R2–R5, stop with `BLOCKED — CLAUSE 16d`.
5. Emit the executor's `GR-0 CANONICAL REUSE PREFLIGHT` and `GR-3a STORY PREFLIGHT` receipts (§15.1 gives the
   design-time values to re-verify).
6. Baselines: `npx.cmd vitest run src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts` →
   `03-baseline-actions.txt` (exit 0 expected).

### 10.2 Order

I0 → `adminPagesContent.ts` → the two Views + Stories → the two containers → `page.tsx` + token → i18n keys → T1–T6
→ plants → manifest + baseline regeneration → gates → report.

### 10.3 Plants (two-armed; each file holds the planted file's hash before the plant and after the restore)

| Plant | Edit | Must fail | Evidence |
|---|---|---|---|
| **P1** (R1) | remove the `sq_body_required` branch from `PageEditorDialog` | T1 (a toast appears, no field error) | `05-plant-p1.txt` |
| **P2** (R3) | make the delete action call `deletePage` without opening the confirm | T4 (cancel still deletes) | `06-plant-p2.txt` |
| **P3** (R9) | re-add `import { Badge } from '@/components/ui/badge'` and render it in `AdminPagesView` | the census exits 1 naming `ui/badge` for this surface | `07-plant-p3.txt` |

## 11. Positive and negative flows

**Positive flow.** An admin creates a page, fills the Albanian title and body, switches publish on and saves. It
appears in the list as published with a working preview link. They edit it, save, and delete it after confirming.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Publish with an empty Albanian body | **Yes** | R1 | `sq` tab, field error, no toast | T1, `SqBodyRequired` Story |
| Slug invalid / reserved / taken | **Yes** | §3.3 | inline slug error | T2, `SlugError` Story |
| Other server error | **Yes** | §3.3 | `save_error` toast | T3 |
| Delete cancelled / confirmed | **Yes** | R3 | no call / removed + toast | T4, `DeleteConfirm` Story |
| Legacy content present | **Yes** | §3.3 | banner, actions disabled | T5, `MigrationPending` Story |
| Empty list | **Yes** | §3.3 | empty label + add-first | `Empty` Story |
| Mobile < 640 px | **Yes** | clause 11 | cards; bottom-sheet dialogs; ≥ 44 px targets | Stories at 390 (§13.3) |
| Locale expansion (`uk`/`it` long labels) | **Yes** | clause 7 | no overflow in tabs or actions | owner matrix, `uk@390` |
| Concurrent edit / offline | No | server actions unchanged; errors reach the toast branch | — | — |

## 12. Acceptance criteria

- **AC1 [R1, R4]** Given a publish refused with `sq_body_required`, when the editor handles the result, then the
  active tab is `sq`, the `sq` body shows `admin.pages.sq_body_required`, no toast fires, and editing the body clears
  the error (T1).
- **AC2 [R1, R10]** Given `messages/*.json`, then `admin.pages.sq_body_required` exists in all four locales with the
  R1 texts, and `check:i18n`, `check:i18n-hardcode` and `check:i18n-dynamic` exit 0 (`22a`–`22c`).
- **AC3 [R2, R3, R4]** Given the two containers, then each renders only its View and has 0 `className` and 0
  `@/components/ui/*` imports. Given the two Views, then neither contains `className`, a `ui/*` import, `window.confirm`
  or a raw colour/px/rem literal (`check:design-tokens` and `check:enrolled-tailwind` exit 0).
- **AC4 [R5]** Given `PageEditorDialogView`, then its fields, tabs, `Switch` and footer match R5, and the save button
  is disabled on the same three conditions as today.
- **AC5 [R3, R5, R7]** Given the two Story files, then each statically imports its View, carries the R7 exports, and
  `check:story-coverage` exits 0 with both Views enrolled.
- **AC6 [R6]** Given `page.tsx`, then its wrapper is Mantine `Box` with the R6 token and it has 0 `className`. Given
  `theme.ts`, then `adminPageNarrowMaxWidth` is defined (the definition line is quoted, per the "documented token"
  rule).
- **AC7 [R8]** Given `messages/*.json`, then `admin.footer.link_url_invalid_internal` matches R8 in all four
  locales, and no other key in those files changed except R1's.
- **AC8 [R9]** Given `08-census-after.txt`, then the §3.2 tier-2 rows are gone, both Views read `manifest:yes
  story:yes`, `AdminInput` is absent, and the baseline diff removes only `admin/pages` keys and adds none.
- **AC9 [R10]** Given T1–T6, then all pass on the final tree (`09`). P1–P3 each fail as §10.3 states and pass after
  restore, with equal hashes. `pages-and-footer-validation.smoke.test.ts` passes unchanged.
- **AC10 [all]** `npm.cmd run build` exits 0 on the final tree. `typecheck`, `lint`, `check:story-coverage`,
  `check:rendered-scope`, `check:surface-census:changed`, `check:file-integrity` and `check:mojibake` exit 0.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.` (AC3's "no raw literal" is
measured by the repo's own design-token and Tailwind gates, not by a hand grep.)

## 13. QA profile and verification plan

**Q3.** Reasons: a legacy surface migrates to canonical Mantine, and two new Views plus an error state become
visible. Required: Stories for both Views, the census and baseline proof, tests T1–T6 with plants, the gates, the
build, and the owner visual matrix. No `screenshots:assert`: the owner rule of 2026-09-03 retired it.

### 13.1 Re-entry

From scratch, after 877 is archived.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

Run the plants first, by hand. Then:

```powershell
$ev = "docs\sessions\evidence\task868"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\04-platform.txt"
node.exe scripts\check-surface-census.mjs --surface "src/app/admin/pages/page.tsx" *>&1 | Tee-Object "$ev\08-census-after.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts *>&1 | Tee-Object "$ev\09-tests.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\10-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\11-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\12-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\13-rendered-scope.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\14-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\15-design-tokens.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\15b-enrolled-tailwind.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\22a-i18n.txt"
npm.cmd run check:i18n-hardcode *>&1 | Tee-Object "$ev\22b-i18n-hardcode.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\22c-i18n-dynamic.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\16-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\17-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\18-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19-build.txt"
git --no-optional-locks diff -- scripts\surface-census-baseline.json | Tee-Object "$ev\20-baseline-diff.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after every command. Normalise every `Tee-Object` file (UTF-16LE on Windows
PowerShell 5.1) to UTF-8 without BOM through Node before `check:file-integrity`, keeping its content line for line.
Stop any dev server before either build. Capture the `git hash-object` of every changed file in the same pass
(`23-hash-object.txt`).

Expected:
- `04` starts with `win32`.
- `08` has no tier-2 row for this surface.
- `09`–`19`, `15b` and `22a`–`22c` exit 0.
- `20` removes only `admin/pages` keys.
- `21` shows no path outside §7.

### 13.3 `OWNER VISUAL QA REQUIRED` — O78-7 (Storybook, after the executor reports)

Open each tuple using the toolbar's locale and viewport. Record **accepted**, or **returned** with the defect.

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminPagesView` | `Default`, `Empty`, `MigrationPending`, `Deleting`, `DeleteConfirm` | `sq`, `uk` | 390, 1440 | 20 |
| `Patterns/Mantine/PageEditorDialogView` | `New`, `EditPublished`, `EmptyLocaleWarning`, `SlugError`, `SqBodyRequired`, `Saving` | `sq`, `uk` | 390, 1440 | 24 |
| `Patterns/Mantine/AdminPagesView` `Default` | — | `en`, `it` | 768, 1024 (the `visibleFrom` breakpoints) | 4 |

48 tuples. After the deploy, as admin, open `/admin/pages`, publish a page with an empty Albanian body, and confirm
the R1 message appears on the field.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.

- the changed files with `23-hash-object.txt` values;
- the requirement IDs completed;
- every command in §10.1, §10.3 and §13.2 with its real exit code and evidence path;
- the I0 877 gate quotes, the census before/after, and the GR receipts (GR-0, GR-1, GR-3 per View, GR-3a);
- the plant table with its hash pairs;
- the i18n diff (R1 and R8 keys only);
- assumptions, deviations and limitations;
- O78-7 stated as owed.

Sonnet updates the 868 cell of the `docs/backlog.md` registry row (state only). It writes the session log with a
"Files Changed" table and emits no git command.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes: current behaviour (§3.3), census (§3.2), the exact Views and Stories (R3/R5/R7), plants and matrix |
| One active route | Yes: Appendix C |
| Every requirement has a binary AC | R1→AC1/AC2 · R2–R4→AC3 · R5→AC4 · R7→AC5 · R6→AC6 · R8→AC7 · R9→AC8 · R10→AC9 · all→AC10 |
| Two-armed control | T1–T6 with P1–P3; the census as the tier-2 detector (P3) |
| Detector blind spot stated | The census walks static imports only (not dynamic `import()`); the Stories prove the Views, not the containers' wiring (T1–T6 do); `check:story-coverage` sees only enrolled files (GR-2) |
| Material absence claims traced | "No legacy Story imports `AdminPagesManager`": `src/components/admin/*.stories.tsx` listing and grep, none. "`AdminInput` has other consumers": `git grep -l AdminInput -- src`, 7 files besides this one |
| Dirty worktree handled | Clean at design time; I0 snapshot anyway |
| No owner exception claimed | None. The glyph change and the row-dimming change are recorded behaviour changes put before the owner in the matrix, not exceptions |

### 15.1 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Implementation and registration |
|---|---|---|---|---|
| Page list (table ↔ cards) | `MantineDataTableToCards`, `AdminTable`, `AdminUsersTable` | `patterns/MantineDataTableToCards.tsx`, Story `Mantine/Primitives/Table` | **reuse** (with 877's `visibleFrom`) | column/card config in `AdminPagesView` |
| Editor dialog, delete confirm | `MantineModal`, `MantineDialogDrawerPattern`, 874's delete confirm | `patterns/MantineModal.tsx`, Story `Mantine/Primitives/Modal` | **reuse** | controlled, in the two Views |
| Locale tabs | `Tabs` | Story `Mantine/Primitives/Tabs` (877 uses it for `AdminCurrencyTabs`) | **reuse** | `Check` marker at `iconSize.compact` |
| Title/slug/body fields | `TextInput`, `Textarea`, `AdminInput` (legacy) | Stories `Mantine/Primitives/TextInput`, `…/Textarea` | **reuse** | `error`/`description`/`withAsterisk`, `ff="monospace"` |
| Warnings (migration, empty locale) | `Alert` | Story `Mantine/Primitives/Alert` | **reuse** | `color="yellow" variant="light"` |
| Publish toggle | `Switch` | Story `Mantine/Primitives/Switch` | **reuse** | two labels |
| Status badge | `Badge`, `MantineDataTableToCards` `isBadge` | Story `Mantine/Primitives/Badge` | **reuse** | `variant="light"`, green/gray |
| Row actions | `ActionIcon` | Story `Mantine/Primitives/ActionIcon` | **reuse** | `aria-label` from `preview_open`/`common.edit`/`common.delete` |
| Page width | `adminPageMaxWidth` (877), `max-w-4xl` usage (`admin/pages`, `admin/footer`) | `theme.other.layout` | **extend** | `adminPageNarrowMaxWidth` = 56rem |
| Page header | `AdminPageHeader` | 877's adapter + Story `Patterns/Mantine/AdminPageHeader` | **reuse** | unchanged |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/pages list, editor dialog, delete confirm, page wrapper; semantic queries: data table/cards, modal, confirm, tabs, text input, textarea, alert, switch, badge, action icon, page max width; inspected candidates: patterns/MantineDataTableToCards.tsx (Mantine/Primitives/Table), patterns/MantineModal.tsx (Mantine/Primitives/Modal), Mantine/Primitives/{Tabs,TextInput,Textarea,Alert,Switch,Badge,ActionIcon}, theme.other.layout; decision: COMPOSE (+ EXTEND theme.other.layout by one key); selected canonical owner: those patterns and primitives; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts; new hardcoded visual values: NONE; rationale: every artifact has a canonical owner; the only missing value is the legacy page width, tokenised as 877 did for max-w-5xl.`

`GR-3a STORY PREFLIGHT — AdminPagesView / PageEditorDialogView × the R7 states; canonical candidates: NONE (no Story imports AdminPagesManager or either new View; src/components/admin/*.stories.tsx has none for this surface); direct-import evidence: NONE; toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: CREATE; target: Patterns/Mantine/AdminPagesView, Patterns/Mantine/PageEditorDialogView; rationale: new presentational Views from the container split, each needs its own Story (GR-3).`

`GR-1 CENSUS COMPLETE — 14 nodes; tier1 2 migrated+enrolled+story (AdminPagesView, PageEditorDialogView — new) + 2 container-exempt (AdminPagesManager, PageEditorDialog); page.tsx route root baselined; RelativeTime/MantineTooltip/responsiveBottomSheet already migrated; AdminInput import removed; tier2 7 imports removed; tier3 1 (AdminPageHeader, owned and filed as 877).`

---

## Appendix A — Evidence preflight (task design)

| Field | Value |
|---|---|
| Mode | `TASK DESIGN` |
| Execution state | `from-scratch`, gated on 877 |
| Exact start step | §10.1 I0 |
| Owner decision required? | no. The two visible changes (tab marker, no row dimming) go to the owner matrix |

| Claim | Source inspected | Status |
|---|---|---|
| Guard returns `sq_body_required` | `actions/index.ts:235,275`; its tests `:331-388` | VERIFIED |
| Other errors go to the generic toast | `AdminPagesManager.tsx:123-129` | VERIFIED |
| Census: 14 nodes, 4 tier-1 unmigrated, 7 tier-2 | `check-surface-census.mjs` run 2026-09-25 | VERIFIED |
| `MantineDataTableToCards` lacks `visibleFrom` today | `patterns/MantineDataTableToCards.tsx:205-216` | VERIFIED; 877 R1 adds it |
| `AdminInput` has 7 other consumers | `git grep -l AdminInput -- src` | VERIFIED |
| `max-w-4xl` used by `admin/pages` and `admin/footer` only | `git grep max-w-4xl -- src/app/admin` | VERIFIED |
| Rider text is obsolete in 4 locales | `messages/*.json` read | VERIFIED |
| `common.edit/delete/cancel` exist | `messages/en.json` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Evidence | Result |
|---|---|---|---|
| GR-0 / 16b | canonical reuse, no hardcode | §15.1 receipt | COMPLIANT |
| GR-1 / 16d | full census, nothing excluded | §3.2, receipt | COMPLIANT |
| GR-3 / 16c | own Story per changed View | R7 | COMPLIANT |
| GR-3a | Story preflight | receipt | COMPLIANT |
| component-rules P0 | container/View split, no mocked hooks in Stories | R2–R5, R7 | COMPLIANT |
| agent-contract 7 | four locales | R1, R8 | COMPLIANT |
| agent-contract 11 | mobile < 640 | cards, bottom-sheet dialogs, `ActionIcon` targets | COMPLIANT |
| agent-contract 9 | build exit 0 | `19-build.txt` | COMPLIANT |
| owner visual rule 2026-09-03 | no `screenshots:assert`; owner matrix | §13.3 | COMPLIANT |
| 818/819 corollary | Node I/O, hash witnesses | §10.3, §13.2 | COMPLIANT |

## Appendix C — Execution contract

| Field | Value |
|---|---|
| Task | 868 |
| Active route | single route: container/View split on canonical patterns + R1 message + rider |
| Decision source | the reserved row (867's design) and D78-8 via 877 |
| Blocked rule or decision | none; 877 is a dependency, not a decision |

| # | Checkpoint | Producer → artifact | Failure |
|---|---|---|---|
| 0 | 877 landed, APIs present | I0.3 | `PREMISE DRIFT — 877` |
| 1 | Census before | I0.4 → `02` | an unlisted unmigrated node → `BLOCKED — CLAUSE 16d` |
| 2 | Tests + plants | T1–T6, P1–P3 | a plant passes → test defect |
| 3 | Census after + baseline | `08`, `20` | a tier-2 row or an added key → fix before report |
| 4 | Gates | §13.2 | any non-zero → `PARTIALLY IMPLEMENTED` |
| 5 | Owner visual | O78-7 | a returned tuple → revision |
