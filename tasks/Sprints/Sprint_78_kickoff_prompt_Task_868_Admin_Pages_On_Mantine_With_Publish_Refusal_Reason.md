# Task 868 — `/admin/pages` on canonical Mantine, and a refused publish tells the admin why

Sprint 78 · **P3** · QA profile **Q3 → Q4 from revision 1** (§17: the rich-text editor changes the P1 critical flow
"CMS page body sanitised before render" and adds an authenticated upload route) ·
**depends on 877** (hard: 877's `MantineDataTableToCards` extension, the `AdminPageHeader` adapter and the admin page
wrapper pattern) · owner action **O78-7** · **Status: `NEEDS REVISION` 2026-10-01 (review 3, §18): revision 1 (§17)
is implemented, but Tiptap ships on every public page that imports the patterns barrel (homepage +158 kB), and the
`CmsPageView` Story doubles its gutter. Revision 2 = §18. Executor: start at §18.4.**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md).
Origin: reserved 2026-09-21 by Task 867's design. It is in Sprint 79 by origin and routed to Sprint 78 (admin Mantine)
by goal fit. The reserved row's full text moves into §3 of this file.
Precedents to follow: 874 and 877 (`tasks/Archive/Sprint_78_kickoff_prompt_Task_874_…md`,
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
- New features: preview in the dialog, pagination. *(Rich-text editing was listed here. Owner decision D868-1,
  2026-10-01, moved it into this task — §17.)*
- *Revision 1 adds to the scope: `src/modules/admin/actions/index.ts` (the empty-body guard only), the 884 sanitizer
  and `CmsPageView` rendering. The `pages` table, RLS and grants stay out of scope. Write set: §17.6.*

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
  R1 texts; `check:i18n` and `check:i18n-dynamic` exit 0 (`22a`, `22c`); and `check:i18n-hardcode` (`22b`) reports
  no finding in any file this task changes. *(Corrected by review 1, §16.2: the whole-repo exit code is owned by
  **910**.)*
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
| `Patterns/Mantine/PageEditorDialogView` | `New`, `EditPublished`, `EmptyLocaleWarning`, `SlugError`, `PublishBodyRequired` (R7's `SqBodyRequired`, renamed — §16.2), `Saving` | `sq`, `uk` | 390, 1440 | 24 |
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

## 16. Review 1 — 2026-10-01 — `PARTIALLY VERIFIED` (implementation verified; O78-7 owed)

Opus. Frontend task, so no review ledger (D69-3).

### 16.1 Record

- **Tree.** `git hash-object` of all 11 changed source, Story, test and script files equals the session log's §8 table
  (`AdminPagesManager.tsx` `77592575`, `AdminPagesView.tsx` `a0c68781`, `PageEditorDialogView.tsx` `d9710ce7`,
  `adminPagesContent.ts` `bfac77bc`, both Stories, the test, `page.tsx`, `theme.ts`, both scripts). `storybook-static`
  (11:31:48) is newer than the last source write (11:31:32).
- **Diff vs §3.3.** The save handler, the slug logic and the 5 helpers are byte-equivalent to `HEAD`. The helpers are now
  in `adminPagesContent.ts`. The only new branch is R1's (`AdminPagesManager.tsx:88-90`, cleared at `:51`). The token
  definition is `theme.ts:837` `adminPageNarrowMaxWidth: '56rem'`, with its type line at `:278`. `messages/*` change
  the R1 and R8 keys only.
- **Re-run by the reviewer (win32, Node v22.22.3).** The census is 11 nodes, has no tier-2 row and no `AdminInput`,
  and both Views read `manifest:yes story:yes`. It exits 1 only on the two baselined keys. Vitest is 27/27, exit 0.
  The plants are `05`–`07`, with hashes equal before and after restore. The baseline diff (`20`) has 8 removals, all
  `admin/pages`, and 0 additions.
- **Rendered, by the reviewer** (`storybook-static`, Chromium, `sq` and `uk`, 320/390/768/1024/1440, all 11 Stories):
  - No document overflow anywhere, no console error, and no text at 24px or more.
  - `AdminPagesView`, all four sides: top 24, bottom 24 where the content overflows, left/right 16/16/24/32/32. That
    is the `StoryPageGutter` profile, as in 874/877.
  - Row actions measure 44px on the cards and 22px in the table.
  - Both dialogs are bottom sheets below 640px (full width, gap 0). From 640px they are centred: 440px for the delete
    confirm and 620px for the editor.
  - Body and slug text render in `ui-monospace`. `PublishBodyRequired` shows the R1 text on the `sq` body with the
    `sq` tab active.
  - The tab strip overflows inside its `ScrollArea` with no visible scrollbar: `uk`@320 459/288, `uk`@390 459/358,
    `sq`@320 367/288.

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/pages list, editor dialog, delete confirm, page wrapper; semantic queries: as §15.1 + monospace input, tab strip overflow; inspected candidates: §15.1 set, MantineCombobox.tsx:368 (styles.input slot precedent), MantineDashboardPeriodControl (ScrollArea strip); decision: COMPOSE (+ EXTEND theme.other.layout by one key); selected canonical owner: those patterns and primitives; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts (:625 fontFamilyMonospace, :837 adminPageNarrowMaxWidth); new hardcoded visual values: NONE; rationale: the monospace face is the theme token through Mantine's Styles API slot, because ff reaches only the wrapper.`

`GR-1 CENSUS COMPLETE — 11 nodes; tier1 2 migrated+enrolled+story (AdminPagesView, PageEditorDialogView) + 1 container-exempt (AdminPagesManager, which also holds the PageEditorDialog container, as 874's ProviderFormDialog) + page.tsx route root baselined; 7 already-migrated nodes; tier2 0 (7 imports removed); tier3 0.`

`GR-2 SCOPE STATED — check:story-coverage inspects enrolled files only and check:surface-census:changed only diff-mapped surfaces; neither sees the containers' wiring; the criterion is closed by T1–T6, plants P1–P3 and the reviewer's own census run.`

`GR-3 STORY PROVEN — AdminPagesView ← src/stories/patterns/mantine/AdminPagesView.stories.tsx; PageEditorDialogView ← src/stories/patterns/mantine/PageEditorDialogView.stories.tsx.`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminpagesview--{default,empty,migration-pending,deleting,delete-confirm}: 320 288/320 · 390 358/390 · 1024 960/1024 · 1440 1376/1440; patterns-mantine-pageeditordialogview--{new,edit-published,empty-locale-warning,slug-error,publish-body-required,saving}: sheet 320/320 · 390/390, modal 620 at 1024/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3c TYPE RESPONSIVE CHECK — all 11 Stories: largest text 16px (modal title, labels) at 320 · 390 · 768 · 1440; body 14px, meta 12px; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`

`GR-3d STORY GUTTER CHECK — AdminPagesView × 5: gutter StoryPageGutter all; top/right/bottom/left 320 24/16/24/16 · 390 24/16/24/16 · 1024 24/32/24/32 · 1440 24/32/24/32 (expected the profile); PageEditorDialogView × 6: n/a: overlay-only; side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`

### 16.2 Kickoff corrections — the executor's deviations, accepted

These are task-design defects in this kickoff. Each executor resolution below is the binding text, and it supersedes the
cited line.

| Cited text | Defect | Binding text |
|---|---|---|
| R4, §7.3 — `PageEditorDialog.tsx` as a new file | contradicts R9/AC8: the census cannot see the container split (GR-1 container exemption), so a new container file is a new baseline key | `PageEditorDialog` stays in `AdminPagesManager.tsx`, as 874 kept `ProviderFormDialog` in `AdminExchangeProvidersManager.tsx:27` |
| R3 — "all are disabled while migration is pending" | contradicts §3.3 and §9 ("the same three controls") | "new", edit and delete are disabled; the preview link stays enabled, as today |
| R5 — `withAsterisk` on `sq` | `theme.ts:1110` hides the asterisk globally | no `withAsterisk`; the `sq` title stays required for saving |
| R5 — `ff="monospace"` | `ff` styles the input wrapper, not the text | `styles={{ input: { fontFamily: theme.fontFamilyMonospace } }}` (token `theme.ts:625`) |
| R7 — export `SqBodyRequired` | `check:stories` rejects a locale-code export segment (`scripts/check-stories.mjs:240-246`) | export `PublishBodyRequired` |
| R7 — `EmptyLocaleWarning` "an empty `en` tab" | the edit fixture fills `en` | the empty `uk` tab is active |
| AC2 — `check:i18n-hardcode` exits 0 | an absolute on a whole-repo gate (GR-4; corollary 724 ①). `22b` fails only on `AdminHeader.tsx:53` and `AdminSidebar.tsx:93` (`>Admin<` badge), which have been in `main` since `b9c8c09fe` (Task 852, 2026-09-26) and are outside §7 | AC2 as amended in §12; the exit code is owned by **910** |
| §13.2 `check:surface-census:changed` | the gate needs `--base` | `npm.cmd run check:surface-census:changed -- --base HEAD` |

### 16.3 Owner matrix O78-7 (§13.3, 48 tuples), plus these points

1. Check the `Check` glyph on a filled locale tab (assumption 2).
2. The tab strip swipes with no visible scrollbar. At 320, and at `uk`@390, the last tabs sit off-screen with no cue.
   Look at `EmptyLocaleWarning` `uk`@320, where the active tab is the third. Return the tuple if a cue is needed.
3. Desktop row actions are 22px (`ActionIcon size="sm"`, the 874 table precedent), while the cards use 44px.
4. After the deploy, as admin: publish a page with an empty Albanian body and confirm the R1 message on the field.

**Open before approval:** O78-7 only. An accepted matrix is followed by the closure review (archive, then commit and
push of the implementation). A returned tuple is followed by a revision of R3, R5 or R7. *(Superseded by §17: the owner
returned two of the three rows.)*

## 17. Review 2 and revision 1 — 2026-10-01 — `NEEDS REVISION`

### 17.1 The owner's O78-7 result, verbatim (2026-10-01)

| Row | Result |
|---|---|
| `Patterns/Mantine/AdminPagesView` × 5 states × `sq`/`uk` × 390/1440 | **returned**: *"не приймаю. Якщо бейдж на одному рядку, а назва на іншому, то бейдж має бути на мобільних екранах ліворуч у фреймі, а не праворуч."* |
| `Patterns/Mantine/PageEditorDialogView` × 6 states × `sq`/`uk` × 390/1440 | **returned**: *"не приймаю. Я просив додати у Content editor функції редагування тексту, колонок, параграфів і так далі, як це має бути у нормальному редакторі сторінки. Цього всього немає."* |
| `Patterns/Mantine/AdminPagesView` `Default` × `en`/`it` × 768/1024 | **accepted**: *"`visibleFrom` breakpoints приймаю."* Not re-reviewed unless R13 changes a width ≥ 640. |

*Recorded fact:* no repository artifact before this date asks for a rich-text editor. Task 326A deferred WYSIWYG
(`Sprint_27_kickoff_prompt_Task_326A.md:283`), and this kickoff listed it out of scope in §8. The owner's 2026-10-01
decisions below are the authority.

### 17.2 Owner decisions, 2026-10-01 (asked by Opus; answers verbatim)

- **D868-1 — scope:** *"Inside 868"*. The editor is part of this task, not a separate one.
- **D868-2 — library:** *"@mantine/tiptap (Recommended)"*. This is Mantine's own `RichTextEditor` on Tiptap, with
  theme tokens and its native toolbar chrome. That choice is also the clause 16a provenance for the toolbar, since
  the bundled TailAdmin reference has no rich-text editor.
- **D868-3 — features, first version:** *"Basic formatting, Layout columns, Tables, Images"*.
  - Basic formatting: paragraphs, H2–H4, bold/italic/underline/strike, bullet/numbered lists, blockquote, link,
    text alignment, undo/redo.
  - Layout columns: a 2- or 3-column block that stacks to 1 column below 640px.
  - Tables: insert, add/delete row and column, delete table, header row.
  - Images: uploaded from the editor.
- **D868-4 — card badge (the owner's returned row):** in the canonical admin card, when the badge sits on its own
  line apart from the title, it aligns **left** in the card. This applies everywhere `MantineDataTableToCards` renders
  that state, not on `/admin/pages` only. The rule belongs to the pattern (GR-0 EXTEND), so every consumer gets it.
- **Correction to the question as asked:** the option text for Images said "Supabase Storage". The project uploads
  images to **Cloudinary** (`src/lib/cloudinaryUpload.ts` `uploadToCloudinary`, used by
  `src/app/api/upload-avatar/route.ts:76`), so §17.4 R18 uses Cloudinary. The decision itself (images in the first
  version) is unchanged.

### 17.3 Measured context for revision 1 (Opus, 2026-10-01)

- **Badge.** The pattern sets the badge's own-row position in `MantineDataTableToCards.tsx:132-140`, state 3, with
  `<Group justify="flex-end">`. The header comment (`:53-58`) and the `CardConfig` doc (`:182`, `:200`) say "badge
  right". Card consumers: `AdminTable.tsx`, `AdminUsersTable.tsx`, `AdminExchangeProvidersView.tsx`,
  `AdminCurrenciesView.tsx`, `AdminPagesView.tsx` and `AgentStatisticsView.tsx`. The executor re-greps the list at I0.
- **Sanitizer (884, P1 critical flow).** `src/modules/cms/lib/sanitizeCmsHtml.ts`:
  - 28 allowed tags; there is no `div`, `img` or `span`;
  - attributes are allowed only on `a`, `th` and `td`;
  - `style` is stripped everywhere (T1 row `sanitizeCmsHtml.test.ts:74-80`);
  - an `<img src=x onerror>` must lose `onerror` (`:20-25`).
- **Renderer.** `src/modules/cms/components/CmsPageView.tsx:29-32` renders `sanitizeCmsHtml(body)` inside
  `TypographyStylesProvider`. The responsive rich-text scale is `src/design-system/mantine/typography-chrome.css`
  (869 §19.1).
- **The empty-body guard has a hole that an editor will hit.** `src/modules/admin/actions/index.ts:234` (create) and
  `:273` (update) test `!body.trim()` on the raw HTML. An empty Tiptap document serialises as `<p></p>`, which is
  non-empty, so a visually empty Albanian body would publish.
- **Uploads.** Cloudinary through `uploadToCloudinary(bytes, mime, folder)` → `{ url: secure_url, … }`
  (`cloudinaryUpload.ts:28-63`). The authenticated precedent is `upload-avatar/route.ts:25-27` (`getUser`, 401).
  The permission helper is `assertPermission(key)` (`src/lib/auth/permissions.ts:49-51`; it throws `'forbidden'`).
  Out of scope, filed as **911**: `upload-company-logo` and `upload-popular-location-photo` check no session at all.
- **Dependency.** `npm view @mantine/tiptap@8.3.18 peerDependencies` gives `@mantine/core 8.3.18` (the repo's
  version), `@tiptap/react >=2.1.12` and `@tiptap/extension-link >=2.1.12`. Mantine styles load in
  `src/design-system/mantine/MantineRootProvider.tsx:23` and `.storybook/preview.tsx:11`.

### 17.4 Requirements — revision 1 (R1–R10 stand, except where a row says it supersedes one)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R11** | **Card badge left (D868-4).** In `MantineDataTableToCards.tsx` state 3, the badge's own row aligns to the start of the card's content box, so the badge's left edge equals the title zone's left edge, ±1px. States 1 and 2 (badge on the title's line) are unchanged. Every comment that says "badge right / top-right" for state 3 is updated (`:53-58`, `:132`, `:182`, `:200`), and so is every doc line that describes state 3 (the executor greps `docs/` for the state-3 wording). No new `style` object or raw value: the change is the `Group` `justify` value. | P1 | AC11 |
| **R12** | **Canonical editor pattern.** New `src/design-system/mantine/patterns/MantineRichTextEditor.tsx`, enrolled in the manifest (`check:pattern-enrolment`) with its own Story `Patterns/Mantine/RichTextEditor` (exports `Default`, `WithContent` (columns + table + image + aligned text), `WithError`, `ImageUploading`). It is controlled: props `value: string` (HTML), `onChange(html: string)`, `label`, `error`, `onUploadImage(file: File) => Promise<string>` (it returns the image URL; the pattern does no networking), `uploading`, `labels` (localized toolbar strings). It wraps `@mantine/tiptap` `RichTextEditor` in `Input.Wrapper` (label + error). It emits `''` when `editor.isEmpty`, never `<p></p>`. Tiptap is imported **only** here and in its extension file. | P1 | AC12, AC13 |
| **R13** | **Toolbar = D868-3.** It covers the formatting set, H2–H4 (no H1: the page title is the H1), link (`@tiptap/extension-link`; `target="_blank"` allowed), and text alignment (left, center, right, justify). Columns come from a project extension `src/design-system/mantine/richtext/columnsExtension.ts`: nodes `columns` (`<div data-type="columns" data-cols="2|3">`) and `column` (`<div data-type="column">`), with insert 2 / insert 3 / remove controls. Tables: insert 3×3 with a header row, add and delete row and column, delete table. Image: a control that opens a `MantineModal` with a file input (JPEG/PNG/WEBP, ≤ 5 MB) and a required alt-text `TextInput`, then calls `onUploadImage` and inserts `<img src alt>`. Every toolbar label, tooltip, `aria-label` and dialog text comes from `admin.pages.editor.*` in all four locales; there is no English default left (`check:locale-leak`). Below 640px every toolbar control has a hit area ≥ 44px (clause 11), through the pattern's Styles API and theme tokens only (the §16.2 `styles` precedent), and the toolbar wraps with no horizontal page overflow at 320. | P1 | AC12, AC14 |
| **R14** | **Editor in the dialog.** `PageEditorDialogView` replaces the body `Textarea` with `MantineRichTextEditor` per locale tab (label `field_body_label`). R1's error now shows as the editor's `error` on `sq`, and it clears on the next `sq` editor change (supersedes R5's `Textarea` and R1's "body `Textarea`"). The modal grows from `size="lg"` to `size="xl"` from 640px; it stays a bottom sheet below. New Story export `RichContent` (columns, table, image filled on `sq`). The other six exports stay. | P1 | AC4′, AC5′ |
| **R15** | **Upload route.** New `src/app/api/upload-cms-image/route.ts` (POST, multipart `image`):<br>• `assertPermission('legal.manage')` first, so no permission → 403 and no upload call;<br>• MIME `image/jpeg\|png\|webp`, else 400 `invalid_type`;<br>• `size > 5 MB` → 400 `file_too_large`;<br>• empty → 400 `file_empty`;<br>• `uploadToCloudinary(bytes, mime, 'cms/pages')` → 200 `{ url }`; on a throw → 500 `upload_failed`.<br>The `PageEditorDialog` container owns the `fetch`, passes `onUploadImage`, and on failure shows a localized error toast (`admin.pages.editor.image_upload_error`). No DB write: the URL lives in the body HTML. | P0 | AC15 |
| **R16** | **Sanitizer extended, with the 884 contract kept.** `cmsHtmlAllowlist` adds three things, and nothing else changes:<br>• `div` with only `data-type` ∈ {`columns`, `column`} and `data-cols` ∈ {`2`, `3`} (sanitize-html attribute value lists);<br>• `img` with only `src`, `alt`, `width`, `height`; `src` must be `https://res.cloudinary.com/…`, otherwise the whole `img` is dropped (`exclusiveFilter`/`transformTags`), and that covers relative, `data:`, other hosts and protocol-relative;<br>• `style` on `p`, `h2`–`h4` and `li`, restricted by `allowedStyles` to `text-align: left\|center\|right\|justify`.<br>Every existing T1/T1b/T2 row passes **unchanged**, including `:74-80` (`style="color:red"` still removed) and `:20-25`. Idempotency holds. | P0 | AC16 |
| **R17** | **Public rendering.** `typography-chrome.css` (the canonical rich-text chrome, 869) gains three rules:<br>• `[data-type="columns"]` is a 1-column grid with `var(--mantine-spacing-xl)` gap, becoming 2 or 3 equal columns from `40em` (Mantine `sm`) per `data-cols`;<br>• `table` scrolls inside its own box (no document overflow at 320);<br>• `img` is `max-width: 100%; height: auto`.<br>Use tokens and `em` breakpoints only. `CmsPageView` itself does not change. Its Story gains an export `RichLayout` (columns 2 and 3, a table wider than 320, an image, centred text), extending `Patterns/Mantine/CmsPageView` (GR-3a EXTEND). The editor's content area uses the same Typography scale: an H2 in the editor measures the same as on `CmsPageView` at each width. | P1 | AC17 |
| **R18** | **The empty-body guard is text-aware.** New pure helper `src/modules/cms/lib/isCmsBodyEmpty.ts`: `true` when the HTML has no non-whitespace text (after `&nbsp;` normalisation) **and** no `<img>`. `createPage` and `updatePage` use it in place of `.trim()` (`index.ts:234`, `:273`). The error code stays `sq_body_required`. | P0 | AC18 |
| **R19** | **Existing bodies survive the editor.** One test parses every existing rich-text fixture through the editor's own extension set (`@tiptap/html` `generateJSON` → `generateHTML`): the `CmsPageView` Story fixtures, the 884 T1b fixtures and the `AdminPagesView`/`PageEditorDialogView` fixtures. It asserts equal text content and lists every tag that is lost. A lost tag is reported, not silently accepted. The live rows are checked by the owner (O78-7c). | P1 | AC19 |
| **R20** | **The public bundle stays clean.** No `@tiptap/*` or `@mantine/tiptap` module reaches `/[locale]/[slug]`. Its First Load JS in `npm run build` must not grow compared with `docs/sessions/evidence/task868/19-build.txt`. `@mantine/tiptap/styles.css` is imported next to the core styles in `MantineRootProvider.tsx` and `.storybook/preview.tsx`. | P1 | AC20 |
| **R21** | **Dependencies, exact.** Install `@mantine/tiptap@8.3.18` (equal to `@mantine/core`), plus one Tiptap major for every `@tiptap/*` package: `react`, `pm`, `starter-kit`, `extension-link`, `extension-text-align`, `extension-table` (and row/cell/header packages if that major splits them), `extension-image` and `html`. Record each `npm view` and the chosen versions. A peer-dependency conflict is `PREMISE DRIFT — tiptap`, with no `--force` and no `--legacy-peer-deps`. | P1 | AC20 |

**GR-3c type-scale (R12–R17).**

| Element | base | sm | md | lg | Source |
|---|---|---|---|---|---|
| Editor label / error | `sm` 14 / `xs` 12 | same | same | same | `Input.Wrapper` defaults |
| Toolbar tooltip | `xs` 12 | same | same | same | Mantine `Tooltip` |
| Content `p`, `li`, table cell | `md` 16 | `md` | `md` | `md` | Typography default |
| Content H2 | `h6` 18 | `h5` 20 | `h4` 24 | `h4` 24 | `typography-chrome.css` (869 §19.1) |
| Content H3 | `md` 16 | `h6` 18 | `h5` 20 | `h5` 20 | same |
| Content H4 | `md` 16 | `md` 16 | `h6` 18 | `h6` 18 | same |

### 17.5 Acceptance criteria — revision 1 (AC1–AC10 stand; AC4/AC5 are replaced by AC4′/AC5′)

- **AC4′ [R5, R14]** Given `PageEditorDialogView`, then each tab's body is `MantineRichTextEditor`. R1's message is its
  `error` on `sq`, and the save button is disabled on the same three conditions as today.
- **AC5′ [R7, R12, R14, R17]** Given the Stories, each one statically imports its own component: `AdminPagesView` (5),
  `PageEditorDialogView` (7, including `RichContent`), `RichTextEditor` (4) and `CmsPageView` (+`RichLayout`).
  `check:story-coverage` and `check:pattern-enrolment` exit 0.
- **AC11 [R11]** At 320 and 390, in every card Story that reaches state 3, `badge.left − titleZone.left` lies in
  [−1, 1]. P7 (planted `flex-end`) fails the probe.
- **AC12 [R12, R13]** Given the `RichTextEditor` Story at 320/390/768/1440 in `sq` and `uk`:
  - every D868-3 control exists, with a localized `aria-label`;
  - every control is ≥ 44px below 640;
  - there is no document overflow;
  - `check:locale-leak` on the new Stories reports no English toolbar string in `sq`/`uk`/`it`.
- **AC13 [R12]** Given an empty editor, `onChange` receives `''` (T11).
- **AC14 [R13]** Given the columns controls, the inserted HTML is `<div data-type="columns" data-cols="2">` with 2 or
  3 `column` children, and it survives `sanitizeCmsHtml` byte-identical (T7).
- **AC15 [R15]** T9 covers the route: no permission → 403 with no Cloudinary call; bad MIME → 400; > 5 MB → 400;
  success → 200 `{ url }` from folder `cms/pages`. P6 (assertion removed) fails T9's first row.
- **AC16 [R16]** T7's new rows and every pre-existing T1/T1b/T2 row pass. The rows:
  - kept: columns divs, a Cloudinary `img`, and `text-align`;
  - dropped: any other `data-*` value, `img` on another host or `data:`/relative/protocol-relative, and
    `style="color:red"`.

  P5 (any `img` host allowed) fails T7. The `docs/critical-flow-registry.md` 884 row is updated with the new rows
  and plant.
- **AC17 [R17]** `CmsPageView` `RichLayout` at 320/390: columns stack, the table scrolls inside its box, the image is
  no wider than the column, and there is no document overflow. At 1024/1440 the columns sit side by side. The H2 sizes
  match the table above at 320/390/768/1440. P8 (columns rule removed) makes the 1024 probe fail.
- **AC18 [R18]** T8: `''`, `<p></p>`, `<p> </p><br>` and `<p>&nbsp;</p>` → empty; `<p>x</p>` and a Cloudinary image
  alone → not empty. `pages-and-footer-validation.smoke.test.ts` gains create and update rows for `<p></p>` →
  `sq_body_required`, and every existing row passes unchanged. P4 (guard reverted to `.trim()`) fails the new rows.
- **AC19 [R19]** T10 passes. The session log lists every lost tag, or states "none".
- **AC20 [R20, R21]** The build exits 0, and `/[locale]/[slug]` First Load JS is ≤ its `19-build.txt` value. The
  versions are recorded, and `npm ls @mantine/tiptap @tiptap/react` shows no `invalid`/`UNMET`.

`GR-4 AC AUDIT — 10 new or replaced criteria; each states an observable property; absolutes: none (the bundle bound is "≤ the recorded baseline", the badge bound is ±1px).`

### 17.6 Write set — revision 1 (adds to §7)

1. `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (R11), and the doc lines it names
2. `src/design-system/mantine/patterns/MantineRichTextEditor.tsx`, `src/design-system/mantine/richtext/columnsExtension.ts`,
   `src/design-system/mantine/patterns/index.ts` (export), `scripts/mantine-migration-scope.json`
3. `src/stories/patterns/mantine/RichTextEditor.stories.tsx` (new), `PageEditorDialogView.stories.tsx`,
   the `CmsPageView` Story file (R17), and every card-consumer Story only if R11 needs a fixture to reach state 3
4. `src/components/admin/PageEditorDialogView.tsx`, `AdminPagesManager.tsx` (the container's upload and empty handling)
5. `src/app/api/upload-cms-image/route.ts` + its test
6. `src/modules/cms/lib/sanitizeCmsHtml.ts`, `isCmsBodyEmpty.ts` (new) + tests; `src/modules/admin/actions/index.ts`
   (the two guard lines); `pages-and-footer-validation.smoke.test.ts` (new rows only)
7. `src/design-system/mantine/typography-chrome.css` (R17), `MantineRootProvider.tsx` and `.storybook/preview.tsx`
   (one style import each)
8. `package.json`, `package-lock.json` (R21 only)
9. `messages/{sq,en,uk,it}.json` — `admin.pages.editor.*` only
10. `docs/critical-flow-registry.md` (the 884 row), the session log and `docs/sessions/evidence/task868/r1-*`
11. `docs/backlog.md` — the 868 cell only

### 17.7 Re-entry and order

**Mode: remediation** from review 1's verified tree (§16.1 hashes).
- Keep `01`–`31` as they are, and prefix every new evidence file with `r1-`.
- Do not re-run P1–P3. Re-run T1 (it changes with R14) and T1–T6.

Order:
1. I0: platform, status and hashes; the R11 consumer re-grep; `npm view` for R21.
2. R21 install.
3. R11 and its probe.
4. R16 and R18 with T7/T8.
5. R12/R13 pattern, its Story and T11.
6. R15 and T9.
7. R14 container and View, then the Stories.
8. R17 and the `RichLayout` probe.
9. R19 (T10) and R20.
10. Plants P4–P8.
11. Census and baseline (no key added; the new pattern is enrolled).
12. The §13.2 gates, plus `check:pattern-enrolment` and `check:locale-leak`.
13. GR-3b/3c/3d receipts for every Story in §17.9.
14. Report.

Plants (two-armed; hashes before, planted and restored, as §10.3):

| Plant | Edit | Must fail |
|---|---|---|
| P4 | the guard back to `.trim()` | AC18's new `<p></p>` rows |
| P5 | `img` allowed from any host | T7 "other host dropped" |
| P6 | remove `assertPermission` from the route | T9 row 1 |
| P7 | state-3 `justify="flex-end"` | the AC11 probe |
| P8 | remove the columns rule | the AC17 1024 probe |

### 17.8 Negative flows added

| Branch | Expected | Evidence |
|---|---|---|
| Publish with an empty editor (`<p></p>`) | `sq_body_required`, R1 message | T8, AC18 rows, T1 |
| Upload without `legal.manage` | 403, nothing uploaded | T9 |
| Upload fails (Cloudinary throws) | 500; the editor keeps its content; error toast | T9, container test row |
| Hostile HTML pasted into the editor | Tiptap drops unknown nodes; the sanitizer strips the rest on render | T7, T1/T2 unchanged |
| Image from a foreign host pasted as HTML | dropped at render | T7 |
| Legacy (non-`sq`-keyed) content | editing disabled, as R3 | T5 unchanged |
| Wide table / 3 columns at 320 | no document overflow | AC17 |

### 17.9 Owner matrix O78-7 — revision 1 (replaces §13.3 rows 1–2; row 3 stays accepted)

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminPagesView` | 5 | `sq`, `uk` | 390, 1440 | 20 |
| `Patterns/Mantine/PageEditorDialogView` | 7 (+`RichContent`) | `sq`, `uk` | 390, 1440 | 28 |
| `Patterns/Mantine/RichTextEditor` | 4 | `sq`, `uk` | 390, 1440 | 16 |
| `Patterns/Mantine/CmsPageView` `RichLayout` | 1 | `sq`, `uk` | 390, 1024, 1440 | 6 |
| R11 blast radius: every card Story that reaches state 3 (the executor lists them, each with a GR-3d line) | the state-3 export | `sq` | 390 | n |

After the deploy, as admin:
- **O78-7b:** create a page with 2 columns, a table and an image; publish it; open it on a phone. Then publish one
  with an empty editor and confirm the R1 message.
- **O78-7c:** open every live page in the editor and compare it with the public page **before** saving. A difference
  is reported, not saved.

GR-3d for the new and extended Stories:
- `RichTextEditor`: no own gutter → `StoryPageGutter all`.
- `CmsPageView`: its own `px="md"`, `py` (`CmsPageView.tsx:23`) → answered per side as in 869's Story.
- `PageEditorDialogView`: overlay-only.

`GR-0 CANONICAL REUSE PREFLIGHT — request: rich-text editor, columns block, image insert, card badge state 3; semantic queries: rich text, editor, wysiwyg, tiptap, toolbar, columns, upload, image insert, card badge; inspected candidates: none in src for an editor (Grep: no tiptap/RichTextEditor), @mantine/tiptap RichTextEditor (owner D868-2), MantineModal (image dialog), upload-avatar route (auth precedent), MantineDataTableToCards.tsx:132-140 (badge); decision: CREATE MantineRichTextEditor pattern on @mantine/tiptap + EXTEND MantineDataTableToCards state 3 + EXTEND typography-chrome.css + EXTEND sanitizeCmsHtml; selected canonical owner: src/design-system/mantine/patterns/; Mantine/TailAdmin token path: theme.ts + typography-chrome.css; new hardcoded visual values: NONE; rationale: no editor exists in the repo, and the owner chose Mantine's native one.`

`GR-3a STORY PREFLIGHT — MantineRichTextEditor × Default/WithContent/WithError/ImageUploading; canonical candidates: NONE (new pattern); direct-import evidence: NONE; toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: CREATE; target: Patterns/Mantine/RichTextEditor; rationale: a new canonical pattern needs its own Story (GR-3). CmsPageView × RichLayout → EXTEND Patterns/Mantine/CmsPageView. PageEditorDialogView × RichContent → EXTEND Patterns/Mantine/PageEditorDialogView.`

`GR-1 CENSUS (design, revision 1) — surface src/app/admin/pages/page.tsx gains MantineRichTextEditor (tier 1, new, manifest + own Story in this task); the public surface src/app/[locale]/[slug]/page.tsx is unchanged in its node set (CmsPageView only); tier 3: none; filed: 911 (unauthenticated upload routes, outside this surface).`

## 18. Review 3 and revision 2 — 2026-10-01 — `NEEDS REVISION`

Opus. Frontend task, so no review ledger (D69-3). The record is in the session log (§11, added by the executor at
revision 2 from this section).

### 18.1 What was verified (revision 1 stands, except §18.2)

- The tree equals the session log's `r1-23-hash-object.txt` for every source file. `storybook-static` (13:51) and
  `.next` (13:55) are newer than the last source write (13:50).
- The reviewer re-ran the six test files natively (win32, Node v22.22.3): 7 files, **120** tests, exit 0. The session
  log says 122; its own per-file counts add up to 120. Correct the total in §11.
- These were read and accepted: the route (`legal.manage` = the permission of `createPage`/`updatePage`/`deletePage`,
  `actions/index.ts:230,256,288`), the sanitizer, `isCmsBodyEmpty` (E4) and the container's upload/toast flow.
- **R11 / AC11 — the executor's reading (E1) is accepted as a kickoff correction.** The badge's left edge equals the
  **card's content-box start**, ±1px. R11's "title zone" clause was a design defect: on an avatar card the title zone
  starts 52px further right. The owner rules on the avatar case in the matrix (§18.5).
- **GR-3d, the reviewer's own four-side measurement** (`sq`, 320/390/1024/1440, content union clipped to `overflow`
  ancestors):
  - `RichTextEditor` × 4: top 26 (24 + label inset), left/right 16/16/32/32, bottom 24 where the content is longer
    than the canvas. Pass.
  - `AgentStatisticsView` × 8: 16 on all sides at 320/390, 24 from 1024, which is its own grid gutter. Pass.
  - `AdminPagesView` × 4: as review 1. Pass.
  - **`CmsPageView` fails** (§18.2 F2).

### 18.2 Findings

| # | Sev | Where | Evidence | Required change |
|---|---|---|---|---|
| **F1** | **P1** | `src/design-system/mantine/patterns/index.ts:87-88` | The barrel now exports `MantineRichTextEditor`. Every route that imports `@/design-system/mantine/patterns` therefore loads three Tiptap/ProseMirror chunks (`.next/static/chunks/1452-…`, `54a60aa6-…`, `70e0d97a-…`; 512 kB raw). `.next/app-build-manifest.json` lists them for `/[locale]/layout`, `/[locale]/page`, `/[locale]/listings`, `/[locale]/listings/[slug]`, `/[locale]/favorites`, `/[locale]/cabinet`, `/[locale]/auth/reset-password` and six admin routes. First Load JS, `19-build.txt` → `r1-19-build.txt`: `/[locale]` 663 → **821 kB**, `/[locale]/listings` 673 → 831, `/[locale]/listings/[slug]` 703 → 860, `/[locale]/favorites` 596 → 759, `/[locale]/cabinet` 808 → 970, `/[locale]/auth/reset-password` 579 → 742, `/admin/users` 529 → 692, `/admin/currency` 607 → 764. AC20 measured only `/[locale]/[slug]`, which does not import the barrel, so it passed. R20's intent ("no `@tiptap/*` module reaches a public page") is broken site-wide. | R22 |
| **F2** | **P2** | `src/stories/patterns/mantine/CmsPageView.stories.tsx` `meta.parameters` (no `skipCanvas`) | `CmsPageView` has its own gutter on all four sides (`CmsPageView.tsx:23`: `px="md"`, `py={{ base: '2xl', md: '3xl' }}`). Its production parent (`[locale]/layout.tsx` `<Box component="main">`) adds none. The Story still runs on the default canvas (`.container-wide py-6`), so the gutter is doubled. Measured `RichLayout` / `RichBody`: 320 → top 56 (own 32), left/right 32 (own 16); 1024 → top 72 (own 48). GR-3d: a doubled gutter in an owner-matrix Story is `NEEDS REVISION`, and the Story does not reach the owner. The session log's receipt ("own px/py, default canvas") states the doubling as compliant. | R23 |
| **F3** | **P3** | `MantineRichTextEditor.tsx` `<RichTextEditor.Content mih="10lh" />` | A raw CSS length in a canonical pattern (GR-0: "new hardcoded visual values: NONE"). `check:design-tokens` does not read `lh`. | R24 |
| **F4** | **P3** | `MantineDataTableToCards.tsx` state-3 comment (`:133-134`) | It says "its left edge is the title zone's left edge". That is false on avatar cards (E1, §18.1). | R24 |
| **F5** | evidence | AC12 `check:locale-leak` | Not completed by the executor (session log §10.5). The reviewer ran the real detector, scoped to this task's 22 Stories (§18.3). | — |

### 18.3 Reviewer's scoped locale-leak run (closes F5)

`scripts/check-locale-leak.mjs --mantine-only` has no per-Story filter. The reviewer ran an unmodified copy, with only
the Story list narrowed to `^patterns-mantine-(richtexteditor|pageeditordialogview|cmspageview|adminpagesview)--`.
That is 22 Stories × `en`/`sq`/`uk`/`it` × 320/375/1280, run on the 13:51 `storybook-static`. Result: exit 1, 37
findings, all outside the editor:
- **`RichTextEditor` × 4 and `CmsPageView` × 6: 0 leaks.** AC12's locale-leak clause is verified.
- `"Draft"` in `sq` on 4 `AdminPagesView` exports. The cause is `admin.pages.status_draft` = `"Draft"` in
  `messages/sq.json`, unchanged since `HEAD`. Albanian already has `admin.legal.status_draft` = `"Projektim"`. Fixed by
  R25.
- `"Slug"` in `sq`/`uk`/`it` on 7 `PageEditorDialogView` exports. The cause is `admin.legal.field_slug_label`, which is
  `"Slug"` in all four locales by Task 397's choice (`3ddf47ce0`, 2026-06-06). It is unchanged by 868 and not in
  868's write set. The owner sees it in the O78-7 matrix; it is a terminology choice, not an executor item.

The executor re-runs nothing here. R25 changes one `sq` value, and the reviewer checks it at review 4.

### 18.4 Requirements — revision 2 (R1–R21 stand; R20/AC20 are widened by R22/AC22)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R22** | **Tiptap reaches `/admin/pages` only.** Remove the `MantineRichTextEditor` value export and its type exports from `patterns/index.ts`. `PageEditorDialogView.tsx` imports `MantineRichTextEditor` and `RichTextEditorLabels` from `@/design-system/mantine/patterns/MantineRichTextEditor`, the way the Story already does (E10). No other file imports the pattern. `check:pattern-enrolment` reads the directory, not the barrel, so it stays green; if it does not, stop and report it. Do not add `next/dynamic`, and do not change `next.config`. | P1 | AC22 |
| **R23** | **`CmsPageView` Stories add no gutter.** In `CmsPageView.stories.tsx` `meta.parameters`, add `skipCanvas: true`. Add no `StoryPageGutter` and no padding: the component has its own gutter on all four sides. Every export of the file is in scope, not only `RichLayout`. | P2 | AC23 |
| **R24** | **Two P3 corrections.** (a) Add `theme.other.boxSize.richTextContentMinHeight` with value `'10lh'`, its type line and a provenance comment (the legacy body `Textarea` `minRows={10}`, §3.3). `RichTextEditor.Content` reads it. Quote the definition line. (b) The state-3 comment in `MantineDataTableToCards.tsx` says "start of the card's content box" instead of "the title zone's left edge". | P3 | AC24 |
| **R25** | **Albanian draft label.** `messages/sq.json` `admin.pages.status_draft`: `"Draft"` → `"Projektim"`, the existing `admin.legal.status_draft` value. No other key changes. | P3 | AC25 |

### 18.5 Acceptance criteria — revision 2

- **AC22 [R22]** Given a fresh `npm.cmd run build`, then `r2-26-tiptap-routes.txt` lists every
  `.next/app-build-manifest.json` page whose chunks contain `@tiptap` or `ProseMirror`, and that list is exactly
  `/admin/pages/page`. Every route's First Load JS in `r2-19-build.txt` is ≤ its `19-build.txt` value + 3 kB, except
  `/admin/pages`. **P9** (re-add the barrel export) makes the route list include `/[locale]/page`; it is restored with
  equal hashes.
- **AC23 [R23]** All six `CmsPageView` exports at 320/390/1024/1440 measure top/bottom 32/32/48/48, and left/right 16
  at 320/390. At 1024 and 1440 they measure the centring of `maw="var(--width-content)"`: (viewport − 768)/2 + 16. No
  side is 0, and no side is larger than the component's own value.
- **AC24 [R24]** `mih` in `MantineRichTextEditor.tsx` reads the theme key, and the rendered content min-height is
  unchanged at 390 and 1440. The comment no longer names the title zone.
- **AC25 [R25]** `git diff -- messages/sq.json` changes only `admin.pages.status_draft` in revision 2.
  `check:i18n` exits 0.

`GR-4 AC AUDIT — 4 new criteria; each states an observable property; absolutes: none (the bundle bound is "≤ baseline + 3 kB", the route list is a measured set).`

### 18.6 Write set — revision 2

1. `src/design-system/mantine/patterns/index.ts` (remove the two lines), `src/components/admin/PageEditorDialogView.tsx`
   (the import path only)
2. `src/stories/patterns/mantine/CmsPageView.stories.tsx` (`skipCanvas` only)
3. `src/design-system/mantine/theme.ts` (one key + its type line), `MantineRichTextEditor.tsx` (`mih` only),
   `MantineDataTableToCards.tsx` (the comment only)
3a. `messages/sq.json` (`admin.pages.status_draft` only)
4. The session log (new §11, and the §10.5 total corrected) and `docs/sessions/evidence/task868/r2-*`
5. `docs/backlog.md` — the 868 cell only

### 18.7 Re-entry and order

**Mode: remediation** from revision 1's tree (`r1-23-hash-object.txt`). Keep every `01`–`31` and `r1-*` file, and
prefix new files with `r2-`. Do not re-run P1–P8.

1. I0: platform, status, and the hash of every §18.6 path before the first write → `r2-01-hashes.txt`.
2. R22, then `npm.cmd run build` → `r2-19-build.txt`. Then a Node script that reads `.next/app-build-manifest.json` and
   the chunk files, and lists the matching routes → `r2-26-tiptap-routes.txt`.
3. P9: re-add the barrel export, rebuild, re-run the script, restore (hashes before, planted, restored) →
   `r2-27-plant-p9.txt`. Then rebuild once more on the restored tree, and keep that as the final `r2-19-build.txt`.
4. R23, R24 and R25, then `build-storybook`. Measure AC23 on all four sides for every `CmsPageView` export, and AC24 →
   `r2-3x-cms-gutter.txt`.
5. Gates (Windows PowerShell, project root):

```powershell
$ev = "docs\sessions\evidence\task868"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\r2-04-platform.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts src/modules/cms/lib/__tests__ src/app/api/upload-cms-image/__tests__/route.test.ts src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx src/design-system/mantine/patterns/__tests__/richTextRoundTrip.test.ts *>&1 | Tee-Object "$ev\r2-09-tests.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\r2-10-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\r2-11-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\r2-12-story-coverage.txt"
npm.cmd run check:pattern-enrolment *>&1 | Tee-Object "$ev\r2-12b-pattern-enrolment.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\r2-13-rendered-scope.txt"
npm.cmd run check:surface-census:changed -- --base HEAD *>&1 | Tee-Object "$ev\r2-14-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\r2-15-design-tokens.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\r2-22a-i18n.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\r2-16-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\r2-17-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\r2-18-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\r2-19-build.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\r2-21-status-after.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after each command. Normalise the `Tee-Object` files to UTF-8 without BOM through Node,
and capture `r2-23-hash-object.txt` in the same pass. Every command exits 0. The test count is 120.

6. Receipts: GR-3d for every `CmsPageView` export, with all four sides measured; GR-3b and GR-3c for `CmsPageView`
   `RichLayout`. Then report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

### 18.8 Owner matrix O78-7 — unchanged from §17.9

It goes to the owner after review 4, together with these points: the 44px toolbar at every width (E2: 8 rows at 320,
2 at 1440), the badge over the avatar on `AgentStatisticsView` state-3 cards (E1), the table scrolling at 320, and the
`"Slug"` field label, which is the same in every locale (§18.3).

## 19. Review 4 — 2026-10-01 — `PARTIALLY VERIFIED` (revision 2 verified; O78-7 owed)

Opus. Frontend task, so no review ledger (D69-3). Approval waits on the owner's O78-7 matrix (§17.9, with the §18.8
points) and on R26 below.

### 19.1 What was verified

- **Tree.** Every source path in `r2-23-hash-object.txt` equals the working tree (`git hash-object`). Only the session
  log and `docs/backlog.md` changed after it, which is expected. The last source write was 15:35:26 (the P9 restore of
  `patterns/index.ts`, equal to `HEAD`). The final build (`.next/BUILD_ID` 15:36:58) and `storybook-static`
  (15:37:50–15:38:33) are both newer.
- **R22 / AC22.** The reviewer re-ran `r2-routes.mjs` on the final `.next`: `/admin/pages/page`, 1 of 64 pages. The
  only importers of the pattern are `PageEditorDialogView.tsx:8`, its Story, and two tests. `r2-27-plant-p9.txt` shows 14
  pages with the plant (including `/[locale]/page` and `/[locale]/layout`) and equal hashes after the restore. The
  reviewer's own parse of `19-build.txt` against `r2-19-build.txt` covered 56 common routes (`/api/upload-cms-image` is
  new). Only `/admin/pages` is over +3 kB (604 → 763). The largest other delta is exactly +3.0 kB (`/[locale]`,
  `/[locale]/listings`, `/[locale]/auth/reset-password`, two admin inquiry routes). The session log says that +3 kB
  comes from messages and CSS. That cause is `INFERENCE`; it was not measured, and it is within the AC bound.
- **R23 / AC23.** The reviewer ran its own probe on `storybook-static` (`sq`; union of the text and image/table boxes,
  clipped to `overflow` ancestors). For all six exports, top/left is 31–32/16 at 320 and 390, and 46–47/144 at 1024 and
  352 at 1440. The 1–2 px under 32/48 is the text line box inside the padding. `RichLayout` right/bottom: 16/34 at 320 and
  390, 144/50 at 1024, and 352/50 at 1440. No side is 0, nothing is doubled, and there is no overflow. Before this
  revision the values were 56/32. The executor's probe read `bottom` as the CSS `padding-bottom` rather than a measured
  distance; this review's measurement replaces it.
- **R24 / AC24.** The definition is at `theme.ts:780` (`richTextContentMinHeight: '10lh'`) and the type line at
  `:126`. `MantineRichTextEditor.tsx:390` reads it. Measured min-height is 240 px at 390 and 1440. The state-3 comment
  (`MantineDataTableToCards.tsx:133-134`) no longer names the title zone.
- **R25 / AC25.** `messages/sq.json` `admin.pages.status_draft` = `"Projektim"`. On all 5 `AdminPagesView` exports at
  `sq` 390 and 1440, the rendered text has no `Draft`; `Projektim` appears where a draft row exists. The reviewer's
  `check:i18n` run exits 0.
- **Re-runs (win32, Node v22.22.3).** The vitest command in §18.7 gives 7 files and 120 tests, exit 0.
- **GR-1.** `check-surface-census.mjs --surface src/app/admin/pages/page.tsx` finds 12 nodes:
  - 10 tier-1 nodes that are migrated, enrolled and have their own Story;
  - 2 container-exempt nodes (`page.tsx`, `AdminPagesManager.tsx`: 0 `className`, 0 `ui` imports, baselined);
  - no tier-2 and no tier-3 nodes.

### 19.2 Findings

| # | Sev | Where | Evidence | Required change |
|---|---|---|---|---|
| **F6** | P3 | `src/design-system/mantine/patterns/MantineDataTableToCards.tsx:184` (`CardConfig` doc block) | It still reads `Primary row: badge (right, own row) then avatar + title …`. R11 named this line (`:182` at `HEAD`) as one of the "badge right" comments to update. Revision 1 missed it, and reviews 2 and 3 did not catch it. | R26 |
| — | owner | O78-7 | The visual criterion stays `NOT VERIFIABLE` until the owner records every tuple. | §18.8 |

### 19.3 R26 / AC26 — the last "badge right" comment

- **R26 (P3).** In `MantineDataTableToCards.tsx:184`, the primary-row line describes the badge as on the title's
  line, or on its own row above the avatar and title, aligned to the start of the card's content box (D868-4). This
  is a comment-only change.
- **AC26.** Run `Select-String -Path src\design-system\mantine\patterns\MantineDataTableToCards.tsx -Pattern 'badge \(right, own row\)'`.
  It returns no line. `git diff` of the file shows a change to that comment only, compared with its
  `r2-23-hash-object.txt` content.

**Re-entry (remediation from `r2-23-hash-object.txt`).** Keep every earlier evidence file. Prefix new evidence files
with `r3-`, and do not re-run any plant. Write set: that file (the comment only), the session log (a new §12), the
`r3-*` evidence and the backlog 868 cell. Then run, from the project root:

```powershell
$ev = "docs\sessions\evidence\task868"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\r3-04-platform.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\r3-10-typecheck.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\r3-16-file-integrity.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\r3-19-build.txt"
git hash-object src\design-system\mantine\patterns\MantineDataTableToCards.tsx | Tee-Object "$ev\r3-23-hash-object.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after each command, and normalise the `Tee-Object` files to UTF-8 without BOM through
Node, as §18.7 does. Then report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Nothing rendered changes, so the O78-7 matrix can run at the same time.

## 20. O78-7 result and revision 4 — 2026-10-01 — `NEEDS REVISION`

### 20.1 The owner's O78-7 result, verbatim (2026-10-01)

| Row (§17.9 / §18.8) | Result |
|---|---|
| `AdminPagesView` × 5 × `sq`/`uk` × 390/1440 | *"приймаю."* |
| `PageEditorDialogView` × 7 × `sq`/`uk` × 390/1440 | *"приймаю."* |
| `RichTextEditor` × 4 × `sq`/`uk` × 390/1440 | *"приймаю."* |
| `CmsPageView` `RichLayout` × `sq`/`uk` × 390/1024/1440 | *"приймаю."* |
| `AgentStatisticsView` state 3 × `sq` × 390 | *"приймаю."* |
| §18.8: the badge above the avatar (E1) | *"приймаю."* |
| §18.8: the table scrolling at 320 | *"приймаю."* |
| §18.8: the `"Slug"` label in every locale | *"приймаю."* |
| §18.8: the 44px toolbar at every width (E2) | *"не зрозумів що це за тулбар такий?"* Opus explained it, then asked. Decision **D868-5** below. |

**D868-5 (2026-10-01).** The question listed 30 controls at 44×44 px at every width, against Mantine's own 26 px. That
gives 8 rows (about 350 px) at 320, 6 at 390, 3 at 768 and 2 at 1440. Option chosen, verbatim: *"Компактно від 640
px"*. Option text: *"44 px лише на телефоні (вимога clause 11), від 640 px — компактні кнопки Mantine (~26 px): на 1440
буде 1 ряд. Потрібен новий theme-токен; ревізія 3."* This file numbers it **revision 4**, because session log §12 already calls the R26 change revision 3.

**R26 (§19.3).** The executor reported it in session log §12. The file's hash `8716ca65…` equals `r3-23-hash-object.txt`,
and `badge (right, own row)` occurs 0 times. Review 5 reviews it together with R27.

### 20.2 Measured context (Opus, 2026-10-01)

- `MantineRichTextEditor.tsx:198-203` builds `touch = { miw: theme.other.touchTarget, mih: theme.other.touchTarget }`
  (`theme.ts:718`, `'2.75rem'`, 44px). Every toolbar control spreads it. The comment at `:198-199` gives the reason
  for every width: restoring Mantine's own size from `sm` "cannot be done without a raw value" (E2, where an
  unset value measured 17px).
- Mantine's own size: `node_modules/@mantine/tiptap/styles.css`, `.m_c2207da6:where([data-variant='default'])` sets
  `min-width: calc(1.625rem * var(--mantine-scale)); height: calc(1.625rem * var(--mantine-scale))`, which is **26px**.
  The `subtle` variant is `2rem`. The editor uses `default`. The icon is `theme.other.iconSize.standard` = 16
  (`theme.ts:734`), which equals Mantine's `--control-icon-size` default of 16px.
- `theme.other.boxSize` has no 26px key. A new key, with the stylesheet line above as its provenance, closes E2's
  "raw value" objection.
- No test asserts the control size (`MantineRichTextEditor.smoke.test.tsx`). The row and hit-area probe already
  exists: `docs/sessions/evidence/task868/probe868-r1.mjs:96-107` (`toolbarRows`, `minHit`).

### 20.3 Requirements — revision 4

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R27** | **Compact toolbar from 640px (D868-5).**<br>(a) Add `theme.other.boxSize.richTextControlSize: '1.625rem'` with its type line and a provenance comment: 26px, Mantine's own `RichTextEditor` control size in `@mantine/tiptap/styles.css` `.m_c2207da6[data-variant='default']`, D868-5. Quote the definition line.<br>(b) In `MantineRichTextEditor.tsx`, `touch` becomes `miw={{ base: theme.other.touchTarget, sm: theme.other.boxSize.richTextControlSize }}`, with the same object for `mih`.<br>(c) Rewrite the `:198-199` comment to say: 44px below 640 (clause 11), then Mantine's own 26px from `sm` through the theme key (D868-5).<br>Below 640 nothing changes. The icon size stays `iconSize.standard`. Add no `style` object, no raw value and no CSS rule. | P1 | AC27 |

### 20.4 Acceptance criteria — revision 4

- **AC27 [R27]** Run `probe868-r1.mjs` (or an `r4-` copy of it), extended with 639 and 640, on a fresh
  `storybook-static`. Use `patterns-mantine-richtexteditor--default` and `--with-content` at `sq` and `uk`, at 320, 390,
  639, 640, 768 and 1440.
  - At 320, 390 and 639, `minHit` is 44,44, and `toolbarRows` equals revision 1 (8 at 320, 6 at 390).
  - At 640, 768 and 1440, every control's box is 26 ± 1 px in width and height, and there is no document overflow.
  - `toolbarRows` at 768 and 1440 is lower than revision 1's 3 and 2. Record the values.
  - If 1440 is not 1 row, report `PREMISE DRIFT — toolbar rows` with the measurement. Do not add a value to force it.
  - **P10** (two-armed): set `sm` back to `theme.other.touchTarget`. The 1440 hit-area assertion must then fail.
    Restore it with equal hashes.
  - `PageEditorDialogView` `RichContent` at `sq` 1440 shows the same compact toolbar. `check:design-tokens` exits 0.

`GR-4 AC AUDIT — 1 criterion; each states an observable property; absolutes: none (sizes ±1px; the 1440 row count is a recorded expectation with a drift report, not a pass condition).`

### 20.5 Write set, re-entry and gates — revision 4

Write set:
1. `src/design-system/mantine/theme.ts`: one key and its type line.
2. `src/design-system/mantine/patterns/MantineRichTextEditor.tsx`: the `touch` object and its comment only.
3. The session log (new §13), `docs/sessions/evidence/task868/r4-*` and the backlog 868 cell.

**Re-entry (remediation from `r3-23-hash-object.txt` and `r2-23-hash-object.txt`).** Keep every earlier evidence
file. Prefix new files with `r4-`. Re-run no plant except P10.

Order:
1. I0: platform, status, and the hashes of both write-set source files → `r4-01-hashes.txt`.
2. R27.
3. `build-storybook`, then the AC27 probe → `r4-3x-toolbar.txt`.
4. P10 → `r4-27-plant-p10.txt`.
5. Run the gates below.

```powershell
$ev = "docs\sessions\evidence\task868"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\r4-04-platform.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts src/modules/cms/lib/__tests__ src/app/api/upload-cms-image/__tests__/route.test.ts src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx src/design-system/mantine/patterns/__tests__/richTextRoundTrip.test.ts *>&1 | Tee-Object "$ev\r4-09-tests.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\r4-10-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\r4-11-lint.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\r4-15-design-tokens.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\r4-16-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\r4-17-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\r4-18-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\r4-19-build.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\r4-21-status-after.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after each command. Normalise the files to UTF-8 without BOM through Node, and
capture `r4-23-hash-object.txt` (both write-set sources and `MantineDataTableToCards.tsx`) in the same pass. Every
command exits 0, and the test count is 120. Emit `GR-3b` and `GR-3c` receipts for `RichTextEditor` `Default` at
320/390/768/1440. Its gutter does not change, so `GR-3d` is carried from §18.1. Then report
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

### 20.6 Owner matrix — revision 4

Only the toolbar is re-reviewed. Every other O78-7 row is accepted (§20.1).

| Story | State | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/RichTextEditor` | `Default` | `sq` | 390, 768, 1440 | 3 |
| `Patterns/Mantine/PageEditorDialogView` | `RichContent` | `sq` | 1440 | 1 |

After the deploy, O78-7b and O78-7c from §17.9 still apply.

## 21. Review 5 — 2026-10-01 — `PARTIALLY VERIFIED` (R26 and R27 verified; the §20.6 toolbar tuples owed)

Opus. Frontend task, so no review ledger (D69-3).

- **Tree.** The blob hashes of `theme.ts` (`1978f1ed…`), `MantineRichTextEditor.tsx` (`ca395eba…`) and
  `MantineDataTableToCards.tsx` (`8716ca65…`) equal `r4-23-hash-object.txt`. The last source write was 17:18:05
  (the P10 restore). `storybook-static` (17:19) and `.next/BUILD_ID` (17:23:30) are newer. The status after the
  revision equals the status before it, apart from `docs/backlog.md`.
- **R26 / AC26.** `badge (right, own row)` occurs 0 times. The hash equals `r3-23`.
- **R27 / AC27.**
  - The key is defined at `theme.ts:782` (`richTextControlSize: '1.625rem'`) with its type line at `:126`.
    `MantineRichTextEditor.tsx:199` uses `{ base: touchTarget, sm: boxSize.richTextControlSize }` for `miw` and
    `mih`. There is no `style` and no raw value, and `check:design-tokens` exits 0.
  - The reviewer's own probe ran on `storybook-static`, with `default` and `with-content` × `sq`/`uk`. All 30
    controls measured **44×44** at 320, 390 and 639, giving 8, 6 and 3 rows. They measured **26×26** at 640, 768 and
    1440, giving 2, 2 and 1 rows. The icon was 16 everywhere, with no overflow.
  - `PageEditorDialogView` `rich-content` at `sq` measured 44 and 6 rows at 390, and 26 and 2 rows at 1440.
  - P10 (`r4-27-plant-p10.txt`) measured 44,44 and 2 rows at 1440 while planted. The hash was equal after the restore.
- **Notes, none blocking.**
  - `r4-01` and `r4-23` list hashes without paths. The file order is the write set plus `MantineDataTableToCards.tsx`.
  - `probe868-r4.mjs:41` adds one lint warning (`r1` unused): 132 warnings against 131, with 0 errors.
  - The executor reports that it opened the kickoff before the gate files, then re-based on them before writing.
- **Owner, 2026-10-01, verbatim:** *"але я не бачу компактного тулбару"*, with a screenshot of `PageEditorDialogView`
  `New` at **Mobile 480px**. At 480 the controls are 44 px by D868-5, because 480 is below 640. That is not a return.
  The §20.6 tuples (390, 768 and 1440) are still owed.

## 22. Owner return and revision 5 — 2026-10-01 — `NEEDS REVISION`

### 22.1 The owner's result and decisions, verbatim (2026-10-01)

**§20.6, returned:** *"я не приймаю такий компактний вид. Компактний вид має бути щось накшталт combobox або dropbox і
кнопка "B", де по кліку випадає меню. А ось це не можна назвати компактним виглядом у 3-4 рядки."* The owner attached
a screenshot of `RichTextEditor` `Default` at 480px: 5 rows of 44px buttons.

**D868-6 (asked by Opus).** The question: should the menu toolbar (menu buttons that open a list, through the project's
`MantineDropdownMenu`) apply at every width? Option chosen, verbatim: *"На всіх ширинах (Recommended)"*. This
replaces D868-5's row of 30 buttons; D868-5's control **size** (44px below 640, 26px from 640) still holds.

**D868-7 (asked by Opus, a correction to D868-6's mock-up).** Opus's mock-up showed 8 buttons and said "one row". At
44px that is false below about 430px, because the toolbar's inner width is about 254px at 320 and 324px at 390. Option
chosen, verbatim: *"5 кнопок — завжди 1 ряд (Recommended)"*. The preview text it selected:

```
320 px і ширше:
│ [B▾] [¶▾] [+▾] [🔗] [↶▾]     │
¶▾  Заголовок 2 / 3 / 4
    ───
    Маркований / Нумерований / Цитата
    ───
    Ліворуч / Центр / Праворуч / По ширині
↶▾  Відмінити / Повторити
```

The option text: «B» holds formatting and remove-link; «¶» holds headings, lists, quote and alignment, with dividers;
«+» holds columns, table and image; 🔗 is the link; ↶▾ is one "history" menu with undo and redo.

### 22.2 Measured context (Opus, 2026-10-01)

- **Toolbar geometry** (`@mantine/tiptap/styles.css`):
  - `.m_4574a3c4` (toolbar): `flex-wrap: wrap`, `gap: var(--mantine-spacing-sm)` (12px) between its children, and
    padding `xs md` (10/16) in the `default` variant.
  - `.m_2ab47ef2` (`ControlsGroup`): `display: flex` with no gap.
  - The inner width at 320 is 288 − 2 − 32 = **254px**. Five 44px controls in **one** `ControlsGroup` take 220px and
    fit. As five separate toolbar children they take 220 + 4 × 12 = 268px, which wraps. That fact is plant P11.
- **The canonical menu is `src/design-system/mantine/patterns/MantineDropdownMenu.tsx`** (GR-0 REUSE). It renders a
  Mantine `Menu` from 640 and a `ResponsiveBottomSheet` below. Items are
  `{ label, onClick, icon?, color?, disabled?, separator? }`, and `iconOnlyTrigger` keeps an icon trigger compact below
  640. Its own Story is `Mantine/Primitives/DropdownMenu` (`src/stories/mantine/primitives/DropdownMenu.stories.tsx`).
  There is **no active-item state**. Consumers: `HeaderView`, `UserMenu`, `LocaleSwitcher` and `MantineNavigationMenu`
  (the executor re-greps them at I0).
- **Joined-group chrome.** `MantineDropdownMenu` wraps each trigger in a `Box` (desktop) or a `span` (mobile). Inside
  one `ControlsGroup`, the `default` variant's joined border rules
  (`:where([data-rich-text-editor-control]):where(:first-of-type / :last-of-type / :not(:last-of-type))`) therefore
  treat every control as both first and last. Each gets its own border and radius, and borders double where controls
  touch. The `subtle` variant (`.m_c2207da6[data-variant='subtle']`) has no control borders, so the group needs no
  joining. **Opus choice, shown to the owner in §22.6:** `variant="subtle"`.
- **Re-rendering.** The editor is created with `shouldRerenderOnTransaction: true` (`MantineRichTextEditor.tsx:150`),
  so active and disabled flags computed in render follow the selection.
- **Labels.** `RichTextEditorLabels` (`MantineRichTextEditor.tsx:~40-80`) is filled in `PageEditorDialogView.tsx:~50-80`
  and in `RichTextEditor.stories.tsx:47` from `admin.pages.editor.*`. The smoke test's `LABELS`
  (`MantineRichTextEditor.smoke.test.tsx:17`) lists every key, and `:85-91` expects every control as a toolbar
  `button`. Those rows change.

### 22.3 Requirements — revision 5 (R27's control size stands; its 30-button row is replaced)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R28** | **Five toolbar controls in one `ControlsGroup` (D868-6, D868-7).** `RichTextEditor` gets `variant="subtle"`. The toolbar holds exactly one `RichTextEditor.ControlsGroup` with, in this order:<br>① **Format** (`MantineDropdownMenu`, trigger = `RichTextEditor.Control` with the lucide `Bold` icon and a `ChevronDown`): bold, italic, underline, strike, clear formatting, then a divider and remove link (disabled when the selection has no link).<br>② **Paragraph** (`Pilcrow`): H2, H3, H4 \| bullet list, numbered list, quote \| left, centre, right, justify. The `\|` marks are `separator` dividers.<br>③ **Insert** (`Plus`): 2 columns, 3 columns, remove columns \| insert table, add row, delete row, add column, delete column, header row, delete table \| image (it opens the existing image `MantineModal`).<br>④ **Link**: the existing `RichTextEditor.Link` (its own popover), unchanged.<br>⑤ **History** (`Undo2`): undo, redo.<br>Every item calls the same `editor.chain().focus()…run()` command that today's control calls. It keeps today's `disabled` condition (`MantineRichTextEditor.tsx:276-355`: columns remove, the table row/column/header/delete operations, plus undo/redo through `editor.can()`). It uses today's localized label. Item icons are today's lucide icons at `theme.other.iconSize.standard`. Triggers spread `touch` (D868-5: 44px below 640, `richTextControlSize` from 640). Triggers use `iconOnlyTrigger`, an `aria-label` and a `title` from four new keys, and the bottom-sheet `title` is the same label. The chevron uses an `iconSize` key. A trigger is `active` when any item in its menu is active. No `style` object, no raw value and no CSS rule are added. If the five controls do not fit one row at 320, report `PREMISE DRIFT — toolbar width` with the measurement; do not shrink anything to force it. | P1 | AC28, AC29 |
| **R29** | **Active item (GR-0 EXTEND `MantineDropdownMenu`).** `DropdownMenuItemDef` gains an optional `active?: boolean`. When it is true, the item shows a lucide `Check` at `iconSize.compact` at its end: `rightSection` on the desktop `Menu.Item`, and the row's end on the mobile sheet. It also sets `data-active`. When it is `undefined`, nothing renders differently, so existing consumers do not change. The Story `Mantine/Primitives/DropdownMenu` gains the export `WithActiveItems`. The editor sets `active` from `editor.isActive(…)` (bold, italic, underline, strike, H2–H4, the lists, quote) and from `editor.isActive({ textAlign })` for alignment. | P2 | AC30 |
| **R30** | **Labels.** Add four keys in all four locales, under `admin.pages.editor.`: `menu_format`, `menu_paragraph`, `menu_insert` and `menu_history`. Add them to `RichTextEditorLabels` (`menuFormat`, `menuParagraph`, `menuInsert`, `menuHistory`) and fill them in `PageEditorDialogView.tsx`, `RichTextEditor.stories.tsx` and the test `LABELS`. The four `sq`/`uk`/`it` values are translations, not English. | P1 | AC31 |

### 22.4 Acceptance criteria — revision 5

- **AC28 [R28]** Run an `r5-` copy of `probe868-r4.mjs` on a fresh `storybook-static`. Cover `RichTextEditor` `default`
  and `with-content` at `sq`/`uk`, at 320, 390, 639, 640, 768 and 1440, plus `PageEditorDialogView` `rich-content` at
  `sq` 390 and 1440.
  - The toolbar has **5** controls in **1** row.
  - Each control is ≥ 44px wide and 44px high below 640, and 26 ± 1px high from 640.
  - There is no document overflow.
  - **P11:** put the five controls in five separate `ControlsGroup`s. The 320 probe must then measure 2 rows. Restore
    with equal hashes.
- **AC29 [R28]** Rewrite the smoke test's control-list row so that it opens each menu (desktop path) and finds every
  D868-3 function by its existing localized name:
  - 5 + 1 items in Format, 10 in Paragraph, 11 in Insert and 2 in History;
  - Link as a toolbar button.

  Keep the existing columns, table and image rows, each opening the Insert menu first. Add these rows:
  - bold applied through the Format menu wraps the selected text in `<strong>`, and the selection survives the menu;
  - H2 through the Paragraph menu gives `<h2>`;
  - "align centre" sets `text-align: center`;
  - with no link in the selection, "remove link" is disabled;
  - undo through the History menu reverts the last change.

  Report the new total test count; it must not drop below 120.
- **AC30 [R29]** In a unit row (or the smoke test), with the cursor in bold text, the Format trigger has `data-active`
  and the Bold item renders the `Check`. `DropdownMenu` `WithActiveItems` renders it at 390 and 1440. The existing
  `Default` export and `src/components/layout/__tests__/Header.signOut.test.tsx` pass unchanged.
- **AC31 [R30]** `check:i18n` exits 0 with the four keys in every locale. No English trigger label appears in `sq`,
  `uk` or `it` (the reviewer runs a scoped `check:locale-leak`).
- **AC32 [R28, mobile in a dialog]** At 390 in `PageEditorDialogView` `rich-content` `sq`:
  - tapping Paragraph opens the bottom sheet above the dialog (`elementFromPoint` at the "H2" row's centre lies inside
    the sheet);
  - tapping "H2" turns the current block into an `h2`;
  - the sheet closes, and the dialog stays open.

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: none (sizes ±1px; "1 row" with a drift report instead of a forced fit; test count is a floor).`

**GR-3c.** The new visible text is the menu item labels: Mantine `Menu.Item` `sm`, 14px, and the sheet rows' `Text
size="sm"`, 14px, at every width. Neither has text of 24px or more.

**GR-3d.**
- `RichTextEditor`: `StoryPageGutter all`, unchanged (§18.1).
- `PageEditorDialogView`: overlay-only.
- `DropdownMenu`: `n/a: MantineStoryShell primitive`.

`GR-0 CANONICAL REUSE PREFLIGHT — request: editor toolbar as menus; semantic queries: menu, dropdown, combobox, popover, action menu, bottom sheet; inspected candidates: MantineDropdownMenu.tsx (Mantine/Primitives/DropdownMenu), MantineCombobox.tsx (a value picker, not commands), MantinePopover.tsx (one panel, no items), MantineNavigationMenu.tsx (navigation links); decision: REUSE MantineDropdownMenu + EXTEND it with active; selected canonical owner: src/design-system/mantine/patterns/MantineDropdownMenu.tsx; Mantine/TailAdmin token path: theme.ts touchTarget, boxSize.richTextControlSize, iconSize.*; Mantine variant "subtle"; new hardcoded visual values: NONE; rationale: the project's command menu already has the <640 bottom sheet and the ≥640 anchored menu.`

`GR-3a STORY PREFLIGHT — MantineDropdownMenu × active item; canonical candidates: Mantine/Primitives/DropdownMenu; direct-import evidence: src/stories/mantine/primitives/DropdownMenu.stories.tsx; toolbar coverage: locale=Storybook toolbar, viewport=Storybook toolbar; decision: EXTEND; target: Mantine/Primitives/DropdownMenu (WithActiveItems); rationale: a new state of an existing canonical pattern. MantineRichTextEditor × menu toolbar → REUSE Patterns/Mantine/RichTextEditor (the existing exports render it).`

### 22.5 Write set, re-entry and gates — revision 5

Write set:
1. `src/design-system/mantine/patterns/MantineRichTextEditor.tsx` (the toolbar, labels type, `variant`).
2. `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` (`active` only).
3. `src/stories/mantine/primitives/DropdownMenu.stories.tsx` (`WithActiveItems`).
4. `src/stories/patterns/mantine/RichTextEditor.stories.tsx` and `src/components/admin/PageEditorDialogView.tsx` (the
   four labels only).
5. `src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx`.
6. `messages/{sq,en,uk,it}.json` (four keys each).
7. The session log (new §14), `docs/sessions/evidence/task868/r5-*`, and the backlog 868 cell.

**Re-entry (remediation from `r4-23-hash-object.txt`).** Keep every earlier evidence file. Prefix new files with
`r5-`, and write every hash file as `hash  path`. Re-run no earlier plant.

Order:
1. I0: platform, status, the R29 consumer re-grep, and hashes → `r5-01-hashes.txt`.
2. R29 and its Story.
3. R30.
4. R28.
5. Tests (AC29, AC30).
6. `build-storybook`, then AC28 and AC32 → `r5-3x-toolbar.txt`.
7. P11 → `r5-27-plant-p11.txt`.
8. Run the gates below.

```powershell
$ev = "docs\sessions\evidence\task868"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\r5-04-platform.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts src/modules/cms/lib/__tests__ src/app/api/upload-cms-image/__tests__/route.test.ts src/design-system/mantine/patterns/__tests__/MantineRichTextEditor.smoke.test.tsx src/design-system/mantine/patterns/__tests__/richTextRoundTrip.test.ts src/components/layout/__tests__/Header.signOut.test.tsx *>&1 | Tee-Object "$ev\r5-09-tests.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\r5-10-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\r5-11-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\r5-12-story-coverage.txt"
npm.cmd run check:pattern-enrolment *>&1 | Tee-Object "$ev\r5-12b-pattern-enrolment.txt"
npm.cmd run check:surface-census:changed -- --base HEAD *>&1 | Tee-Object "$ev\r5-14-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\r5-15-design-tokens.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\r5-22a-i18n.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\r5-16-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\r5-17-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\r5-18-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\r5-19-build.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\r5-21-status-after.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after each command. Normalise the files to UTF-8 without BOM through Node, and
capture `r5-23-hash-object.txt` (every write-set source, `hash  path`) in the same pass. Every command exits 0. Keep the
evidence probe free of lint warnings.

Emit these receipts:
- `GR-3b` and `GR-3c` for `RichTextEditor` `Default` and `DropdownMenu` `WithActiveItems` at 320/390/768/1440;
- `GR-3d` per §22.4.

Then report `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

### 22.6 Owner matrix — revision 5

Open each menu by hand in every tuple. The `subtle` toolbar look is part of what the owner judges.

| Story | State | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/RichTextEditor` | `Default`, `WithContent` | `sq`, `uk` | 390, 1440 | 8 |
| `Patterns/Mantine/PageEditorDialogView` | `RichContent` | `sq` | 390, 1440 | 2 |
| `Mantine/Primitives/DropdownMenu` | `WithActiveItems` | `sq` | 390, 1440 | 2 |

After the deploy, O78-7b and O78-7c from §17.9 still apply.

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
