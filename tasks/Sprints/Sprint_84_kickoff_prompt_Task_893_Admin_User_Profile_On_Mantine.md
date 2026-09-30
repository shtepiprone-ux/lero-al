# Task 893 — `/admin/users/[id]` and `/admin/users/new` on canonical Mantine

Sprint 84 · **P2** · QA profile **Q4** (legacy surface → Mantine, plus five critical flows on it) · **depends on
877** (hard: the admin page-wrapper form and the `adminPageMaxWidth` token) · blocks **885** and **895** · owner action
**O84-2** · **Status: `NEEDS REVISION` 2026-09-30 — revision 3 (§20)**: revision 2's year jump works, but after the
phone month window shrinks, the header stops following the scroll; the `minDate` branch has no test. Revisions 1 and
2 (§17, §19) are otherwise verified. O84-2: 64 of 72 accepted, 12 `RangeDatePicker` tuples owed after revision 3
(§20.5) · kickoff filed 2026-09-28

Sprint plan: [`Sprint_84_One_Clock_And_One_Date_Order.md`](Sprint_84_One_Clock_And_One_Date_Order.md). Reserved
2026-09-27 by 885's design under owner decision **D84-1** (*"Migrate first"*); the reserved row's text moves into §3.
Precedents to follow, read-only: **868** (`Sprint_78_kickoff_prompt_Task_868_…md`: container/View split,
`MantineModal` dialogs, Stories, manifest, census baseline) and **877** (page wrapper and width token).

## 1. Mode and task type

`IMPLEMENTATION`, UI migration in three phases (A: canonical leaves, B: the profile screen, C: deletions and
registrations). Bundles: **UI / Layout / Component (current Mantine path)**, **Storybook / Visual Proof**,
**Component Catalog / Coverage**, **Regression / Critical Flow Coverage**, **Admin Table / Admin Control**.

- **Current/legacy boundary.** Both routes render the legacy `AdminUserProfile` today (census §3.2). After this task
  they render only canonical Mantine, with no `@/components/ui/*` import and no new `className`.
- **Shared legacy files stay for their other consumers (tier 2 treatment, §3.3).** `Combobox` (10 other files),
  `AdminInput` (6), `AdminEditLayout` (`ListingFormShellView`) and `AdminUserAvatar` (`/cabinet` `ProfileTab`) are
  not edited visually here. The new screen stops importing them. Editing them in place would change `/cabinet`, the
  listing form and eight other admin screens, and pull each of them under clause 16d.
- **The legacy `DatePicker` is deleted.** This screen is its only consumer. Its replacement is a single-date mode of
  the canonical `RangeDatePicker` (R2).

## 2. Objective

1. `/admin/users/[id]` (view and edit) and `/admin/users/new` (create) render the same fields, actions, dialogs and
   data flow as today (§3.4), composed from canonical Mantine primitives and patterns.
2. Presentational Views with their own Stories and manifest entries; the containers keep every piece of state,
   validation and server-action wiring unchanged.
3. The census of both routes shows only each route's own root `page.tsx` (D84-1; 885's gate).

## 3. Verified context — measured 2026-09-28 (re-measure at I0; 877 must have landed)

### 3.1 Owner decisions

- **D84-1** (2026-09-27): chosen option **"Migrate first"**. No 16d exception; this task is one of the migrations.
- No other owner decision is claimed. Every behaviour change in §9 is recorded and put before the owner in O84-2.

### 3.2 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface <route>`, 2026-09-27

Both routes render the same tree (`new` passes `user={null}`). 15 baseline keys each
(`scripts/surface-census-baseline.json:784-871`, 30 in total).

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition in this task |
|---|---|---|---|---|---|---|
| `src/app/admin/users/[id]/page.tsx`, `…/new/page.tsx` | 1 (root) | no | no | 1 each | 0 | wrapper → Mantine `Box` (R8); the root key stays, as in 868/877 |
| `src/components/admin/AdminUserProfile.tsx` (1235 lines) | 1 | no | legacy `Admin/AdminUserProfile` only | 167 | 11 | split: container + `AdminUserProfileView` + `AdminUserProfileDialogsView` (R4–R6); legacy Story deleted (R10) |
| `src/components/admin/AdminUserAvatar.tsx` (232 lines) | 1 | no | legacy `Admin/AdminUserAvatar` | 16 | 1 | **not rendered here any more**: logic → hook (R3a), new `AdminUserAvatarField` + View (R3b). The legacy file stays for `ProfileTab` (895) |
| `src/components/admin/AdminEditLayout.tsx` | 1 | no | exempt | 3 | 0 | import removed; the View lays out main/sidebar with Mantine `Grid` (R5) |
| `src/components/admin/AdminInput.tsx` | 1 | no | exempt | 1 | 1 | import removed; Mantine `TextInput` (R5) |
| `src/components/shared/Combobox.tsx` | 1 | no | legacy `Shared/Combobox` | 21 | 0 | import removed; `MantineSelect` (R5) |
| `src/components/shared/DatePicker.tsx` (217 lines) | 1 | no | exempt | 19 | 4 | **deleted** (R10); `RangeDatePicker` single mode (R2) |
| `src/components/shared/LocationCombobox.tsx`, `PhoneField.tsx` | 1 | yes | yes | 1 / 0 | 0 | reused unchanged |
| `patterns/MantineAddItemPanel`, `MantineCombobox`, `responsiveBottomSheet`, `media/AppImage` | 1 | yes | yes | — | 0 | reached through the reused nodes; unchanged |
| `ui/badge`, `button`, `checkbox`, `dialog`, `input`, `label`, `textarea`, `popover` | 2 | — | — | — | — | **imports removed** (asserted by the census) |

### 3.3 Shared-file consumers (FACT, `grep -rl` over `src`, excluding tests, 2026-09-28)

| File | Other consumers | Consequence |
|---|---|---|
| `shared/Combobox.tsx` | `AdminListingsTable`, `AdminLocationsManager`, `AdminPopularLocationsManager`, `AdminSettings`, `AdminSupportManager`, `AdminUserCreate`, `StatusChangeControl`, `ProfileTab`, `SavedSearchesTab`, `ContactForm` | untouched |
| `admin/AdminInput.tsx` | `AdminLegalManager`, `AdminListingsTable`, `AdminLocationsManager`, `AdminPagesManager`, `AdminSettings`, `AdminUserCreate` | untouched |
| `admin/AdminEditLayout.tsx` | `modules/listings/components/ListingFormShellView.tsx` | untouched |
| `admin/AdminUserAvatar.tsx` | `modules/cabinet/components/ProfileTab.tsx` | render unchanged; logic moves to a hook (R3a). 895 switches `ProfileTab` to R3b and deletes it |
| `shared/DatePicker.tsx` | none | deleted |

`AdminUserCreate.tsx` has no importer at all (it appears only in two comments). It is not rendered by either route and
stays out of scope (§8).

### 3.4 Current behaviour to preserve — read from `AdminUserProfile.tsx`

| Area | Today | Line |
|---|---|---|
| Modes | `create` when `user === null`; otherwise `view`, toggled to `edit` by "Edit profile" | `:414-416` |
| Form | `react-hook-form` + zod schema `buildProfileSchema` (names, profile type, phone, `useMainPhone`, WhatsApp, location required, company/website required for agent/developer, status, block reason required when blocked, `suspendedUntil`) | `:81-104`, `:447-469` |
| Side effects | `useMainPhone` copies phone to WhatsApp; leaving `blocked` clears the block reason; leaving agent/developer clears the four business fields | `:503-507` |
| Unsaved-changes guard | `useUnsavedChangesGuard(isDirty && mode !== 'view')` → "unsaved" dialog on navigation; "Back to users" goes through `interceptHref` | `:492-498`, `:862-870` |
| Save (edit) | country-aware phone checks → `updateUserProfileFull(user.id, {...})` → toast `save_success`, `form.reset(data)`, leave edit, `router.refresh()`; on error `saveError` banner + toast `save_error` | `:572-600` |
| Create | email required and shaped; phone checks → `createAdminUser` → optional avatar upload of the pending blob → `router.push('/admin/users/<id>')` | `:520-570` |
| Save button | disabled while saving or (not create and not dirty); invalid submit scrolls to `section-location` or `section-business` | `:784-795` |
| Cancel | confirm dialog; confirm → create: back to the list; edit: `form.reset()`, leave edit | `:679-688` |
| Sidebar, view mode | Actions card: Edit; Deactivate (admin, not inactive); Reactivate (admin, inactive); Delete permanently (admin). Account-status card: profile-type badge, status badge, "suspended until <date>" when blocked, the block reason in italics | `:719-777` |
| Sidebar, edit/create | Actions card: Save/Create (spinner while saving), Cancel. Role & status card: profile-type select (disabled for non-admins), status select (not in create), block-reason input (when blocked or a reason exists), suspended-until date (when blocked; placeholder `block_permanent`) | `:780-857` |
| Header card | avatar; create: `new_user_title` + subtitle; else display name (h1), profile-type and status badges, "verified" badge with shield icon, email, `#public_id` in monospace | `:882-919` |
| Location request | when `user.location_request`: warning card with city/region, a `LocationCombobox` that approves on pick, a reject button with spinner; disabled while loading | `:922-946` |
| Basic info | create: email input with inline error; else email + confirmed/not-confirmed badge + "email cannot be changed" note; first name, last name; profile type read-only | `:949-996` |
| Contact | phone (`PhoneField`); WhatsApp: "use main phone" checkbox, else a second `PhoneField` | `:998-1029` |
| Location | city (`LocationCombobox` with `regions` + `onAddLocation` for admins); view shows city and parent region; edit shows the derived region | `:1031-1060` |
| Business | agent/developer: company name, website (link in view), position, year started (number, 1900–this year) | `:1062-1085` |
| Password info | create only: title, body, four rules | `:372-393`, `:1087-1088` |
| Change history | not in create, only when non-empty: rows "date · old → new" (server-preformatted date), per-row clear and clear-all when `canClearHistory` | `:1090-1129` |
| Status history | same, first 10 rows, with the reason line | `:1131-1179` |
| Dialogs | unsaved, cancel, deactivate (reason required), reactivate (reason required), delete (name, email, warning box with three points), clear history (row / entity); confirm buttons show a spinner and are disabled while loading | `:172-368`, `:1181-1233` |
| Clear history | `clearHistoryRow` / `clearHistoryForEntity`; `forbidden` → `clear_history_forbidden`; other error → `clear_history_error`; `cleared === 0` → info `clear_history_noop`; success → `clear_history_success`; always refresh | `:627-677` |
| Dates | change/status history dates and suspended-until come preformatted from `page.tsx` (`:81-86`); the component falls back to `formatDateTime`/`formatDate` | — |
| Test anchor | root `data-testid="admin-user-profile"` (used by `scripts/check-stories-rendered.mjs:168`) | `:860` |

Avatar (`AdminUserAvatar.tsx`): click or camera button opens the file input; type/size/dimension checks with four
error keys; `AvatarCropModal`; create → a pending blob and a preview URL; edit → `POST /api/upload-avatar` →
`onAvatarChange`; remove → `removeUserAvatar`; spinner overlay while uploading or removing; replace/remove buttons,
two hints, an error line (`:60-230`).

### 3.5 Canonical sources inspected (FACT)

| Need | Candidate inspected | Fit |
|---|---|---|
| Form section card | `patterns/MantineFormSectionStack.tsx` (Story `Patterns/Mantine/FormSectionStack`, no production consumer): each section is `Paper shadow="xs" p="md" radius="md"` + `Title order={3} size="h5"`, but the pattern owns its own `@mantine/form` state | **extend**: extract the section shell (R1) |
| TailAdmin form card | `docs/tailadmin-style-reference.md` §6l "Form Layout": card `rounded-2xl`, 1px border gray-200, header title **16px / 500** with a bottom divider, header and body padded p-5/p-6 | the R1 chrome source |
| Section card, dashboards | `MantineDashboardCard` (state machine: loading/error/stale) | rejected: dashboard semantics, no divider |
| Two-column forms | `MantineTwoColumnForm` (owns its form state, data-driven fields) | rejected: cannot host `react-hook-form` rows with custom content |
| Date field | `patterns/RangeDatePicker.tsx` (885 lines; Story `Mantine/Primitives/RangeDatePicker`; locale data from `common.calendar_*`; a one-day range already commits as `{from, to: from}`, `:740-745`) | **extend**: `selectionMode="single"` (R2) |
| Select | `patterns/MantineSelect.tsx` (Story `Mantine/Primitives/Select`) | reuse |
| Dialogs | `patterns/MantineModal.tsx` (Story `Mantine/Primitives/Modal`; 868's confirm precedent) | reuse |
| Avatar | Mantine `Avatar` (Story `Mantine/Primitives/Avatar`), `AvatarCropModal` (Mantine, Story `Patterns/Mantine/AvatarCropModal`) | compose (R3b) |
| Password rules | `patterns/PasswordRequirementsHint.tsx` (checks a typed value live) | rejected: create mode shows static rules; compose `Alert` + `Text` |
| Inputs, badges, alerts | `TextInput`, `Textarea`, `Checkbox`, `Badge`, `Alert`, `Button`, `ActionIcon` primitives, each with its `Mantine/Primitives/*` Story | reuse |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.5; GR-0 EXTEND | **`MantineFormSection`** exported from `patterns/MantineFormSectionStack.tsx` (and `patterns/index.ts`). Props `{ title: string; id?: string; headerAction?: ReactNode; children }`. Chrome per TailAdmin §6l: `Paper withBorder radius="2xl"`; header = `Title order={2} fz="md" fw={500}` (16px) plus `headerAction` at the trailing edge, then `Divider`; header and body padding `{ base: 'lg', sm: 'xl' }`. `id` lands on the root (scroll anchors). `MantineFormSectionStack` renders its sections through it. `Patterns/Mantine/FormSectionStack` gains an export `Section` (one section, a `headerAction` button). The existing `Default` export changes look (it now follows §6l); that goes to the owner matrix. 0 `className`, no raw values. | P1 | AC1 | Confirmed |
| **R2** | §3.5; GR-0 EXTEND | **`RangeDatePicker` `selectionMode?: 'range' \| 'single'`**, default `'range'`, with the range behaviour byte-for-byte unchanged. In `'single'`, a day click stages `{ from: day }` and replaces any staged day; it never builds a range. Apply (desktop) and Confirm (mobile) commit `{ from, to: from }` exactly as a one-day range does today. The trigger, summaries and clear button already render one date. `Mantine/Primitives/RangeDatePicker` gains `SingleDate` (empty) and `SingleDateSelected`. | P1 | AC2, AC9 | Confirmed |
| **R3a** | §3.3 | **`src/components/admin/useAdminAvatarUpload.ts`** (new): every piece of state and every handler of `AdminUserAvatar.tsx:44-151` moves into it unchanged (checks, crop, upload, remove, blob-URL cleanup, the `[AvatarFlow]` logs). It returns what the markup reads. `AdminUserAvatar.tsx` consumes it, and its JSX (`:152-230`) stays byte-identical. | P1 | AC3 | Confirmed |
| **R3b** | §3.4 avatar; GR-0 COMPOSE | **`AdminUserAvatarField`** (container, `src/components/admin/AdminUserAvatarField.tsx`, same props as `AdminUserAvatar`) uses R3a and renders **`AdminUserAvatarFieldView`** (new, presentational) plus the dynamic `AvatarCropModal`. The View contains: <br>• Mantine `Avatar` at a theme size key: the image through `AppImage` as today, or the `UserCircle2` placeholder;<br>• when editable, an `ActionIcon` camera button (`aria-label` = `avatar_upload_photo`) and the whole avatar as an `UnstyledButton` (`aria-label` = `avatar_click_to_change`);<br>• while uploading or removing, a Mantine `Loader` inside the `Avatar` in place of the image (no overlay primitive: none has a precedent in the repo);<br>• the replace/upload `Button` and the remove `Button` (`color="red" variant="subtle"`);<br>• the two hints as `Text size="xs" c="dimmed" ta="center"`, and the error as `Text size="xs" c="red"`;<br>• the hidden file input. The legacy `max-w-[130px]` goes; the hint wraps inside the column's width.<br>Keep `data-testid="admin-user-avatar"`. The View has 0 `className` and 0 `ui/*` imports. | P1 | AC3, AC5 | Confirmed |
| **R4** | component-rules P0 | **`AdminUserProfile`** stays the exported container with the same `Props`. It keeps all of `:397-715` unchanged: form, schema, effects, guard, handlers, server-action calls, toasts, router calls. The label maps move with it. It renders only `<AdminUserProfileView …/>` and `<AdminUserProfileDialogsView …/>`, with 0 `className` and 0 `ui/*` imports. The View receives values, errors, derived flags and callbacks. The container passes `register`-bound props, or controlled `value`/`onChange` pairs, for each input. | P1 | AC4, AC8 | Confirmed |
| **R5** | §3.4; GR-0 | **`src/components/admin/AdminUserProfileView.tsx`** (new, presentational). Root `Stack` with `data-testid="admin-user-profile"`. Contents, in today's order:<br>• back `Button variant="subtle"` with `ChevronLeft`; the save-error `Alert color="red" variant="light"`;<br>• main/sidebar: Mantine `Grid`, main `span={{ base: 12, lg: 8 }}` and sidebar `span={{ base: 12, lg: 4 }}`; the sidebar is `pos` sticky from `lg` at `top={theme.other.layout.adminTopBarHeight}`, and below `lg` it follows the main column;<br>• a header `Paper withBorder radius="2xl"` holding `AdminUserAvatarField`, the title `Title order={1} fz="xl"`, badges (`Badge variant="light"`: profile type `gray`; status `green`/`red`/`yellow` for active/blocked/inactive; verified `green` with `ShieldCheck`), email, and `#public_id` as `Text ff="monospace" size="xs" c="dimmed"`;<br>• the location request as `Alert color="yellow" variant="light"` with `MapPin`, the `LocationCombobox` and the reject `Button` (`loading`);<br>• sections through `MantineFormSection` (ids `section-identity`, `section-location`, `section-business`). Each field row is a `Grid` with label `span={{ base: 12, sm: 3 }}` and value `span={{ base: 12, sm: 9 }}`. View mode shows `Text size="sm" fw={500}` (or `—`); edit/create shows the control. **Every control's accessible name is its row label** (`id` + `htmlFor`, or `aria-label`);<br>• text inputs: `TextInput` (year started: `TextInput type="number"` with `min` 1900 and `max` this year, as today; `NumberInput` has no precedent in the repo); WhatsApp: `Checkbox` "use main phone", else a second `PhoneField`; the website in view mode as an `Anchor` in a new tab;<br>• create-mode password info: `Alert color="gray" variant="light"` holding the title, the body and the four rules as `Text size="xs"` lines;<br>• the two histories: rows as `Group wrap="nowrap"` with the `History` icon, `Text size="xs" c="dimmed"` date and `fw={500}` values; clear-all `Button variant="outline" color="red" leftSection={Trash2}` as the section's `headerAction`; per-row `ActionIcon variant="subtle" color="gray"` (`aria-label` = `clear_history_row_aria`, touch-target size);<br>• sidebar cards through `MantineFormSection`: view mode = Actions (full-width `Button`s, left-aligned: edit `variant="default"`; deactivate `color="yellow" variant="outline"`; reactivate `color="green" variant="outline"`; delete `color="red" variant="outline"`) and Account status (label/badge `Group`s, the suspended-until line, the block reason in `fs="italic"`). Edit/create = Actions (Save/Create `Button` with `loading`, Cancel `variant="outline"`) and Role & status (`MantineSelect` profile type, disabled for non-admins; `MantineSelect` status; block-reason `TextInput`; suspended-until `RangeDatePicker selectionMode="single"`, placeholder `block_permanent`, `value={{ from: suspendedUntil, to: suspendedUntil }}`, `onChange` → `from ?? null`).<br>0 `className`, 0 `ui/*` imports, no raw colour/px/rem literal. | P1 | AC4, AC5 | Confirmed |
| **R6** | §3.4 dialogs; 868 precedent | **`src/components/admin/AdminUserProfileDialogsView.tsx`** (new, presentational). Controlled `MantineModal`s for the six dialogs: `dialog: 'unsaved' \| 'cancel' \| 'deactivate' \| 'reactivate' \| 'delete' \| 'clear-row' \| 'clear-entity' \| null`. Titles carry today's icons at `theme.other.iconSize.standard`. Reason dialogs use `Textarea autosize minRows={3}` (label `…_reason_label`), and confirm is disabled until the reason is non-blank. Delete shows name, email and an `Alert color="red" variant="light"` with the warning and three points. Every confirm `Button` shows `loading` and disables cancel while loading. Destructive confirms are `color="red"`, deactivate `color="yellow"`, reactivate `color="green"`. Same keys as today. 0 `className`, 0 `ui/*` imports. | P1 | AC4, AC5 | Confirmed |
| **R7** | GR-3, 16c | Stories under `src/stories/patterns/mantine/`, each statically importing its View, fixtures from `src/stories/fixtures/admin.fixtures.ts` (`FIXTURE_PROFILE_USER` `:563`, `FIXTURE_CHANGE_LOG` `:596`, `FIXTURE_STATUS_HISTORY` `:608`, `FIXTURE_CITIES` `:629`, `FIXTURE_REGIONS` `:635`):<br>• `Patterns/Mantine/AdminUserProfileView`: `View`, `ViewBlocked` (suspended-until + reason), `ViewAgent` (business section), `ViewLocationRequest`, `ViewNoHistoryControls` (`canClearHistory` false, non-admin actions), `Edit`, `EditBlocked` (reason + date), `EditErrors` (field errors + save-error banner), `Create`, `Saving`;<br>• `Patterns/Mantine/AdminUserProfileDialogsView`: one export per dialog, plus `DeactivateLoading` and `DeleteLoading`;<br>• `Patterns/Mantine/AdminUserAvatarFieldView`: `Empty`, `WithImage`, `Editable`, `Uploading`, `Error`, `CreatePending`.<br>The three Views are enrolled in `scripts/mantine-migration-scope.json`, and `check:story-coverage` passes. No `maw`/`w`/`style`/viewport pin in any decorator (GR-3b). | P1 | AC5 | Confirmed |
| **R8** | §3.2; 877 precedent | Both `page.tsx` wrappers become `<Box p={{ base: 'xl', lg: '2xl' }} maw={…} mx="auto">` in the form 877 lands. `[id]` uses 877's `theme.other.layout.adminPageMaxWidth` (legacy `max-w-5xl`). `new` uses a new token **`adminPageFormMaxWidth`** (legacy `max-w-3xl` = 48rem), added with 877's value type and read helper. Data reads, metadata and props do not change. | P2 | AC6 | Confirmed (token form follows 877) |
| **R9** | GR-1; 868 R9 | After the change, both routes' census shows no tier-2 node, `AdminUserProfile` as container-exempt, the three Views and `RangeDatePicker` as `manifest:yes story:yes`, and no `AdminEditLayout`, `AdminInput`, `AdminUserAvatar`, `Combobox` or `DatePicker` node. Only the root `page.tsx` line fails (the calibration 885 §3.4 records). Regenerate `scripts/surface-census-baseline.json` with `npm.cmd run check:surface-census:changed:update-baseline`. Every removed key must be one of the 30 at `:784-871`, **no key may be added**, and no other surface's key may change. **Corrected by review 1 (2026-09-30), an orchestrator defect:** GR-1's container exemption (owner D81-2) keeps every exempt container as baselined debt, and R3b itself creates one. So the one allowed addition is `<route> :: src/components/admin/AdminUserAvatarField.tsx` for each route (2 keys), and the census also shows `AdminUserProfile.tsx` and `AdminUserAvatarField.tsx` as `FAIL` with `className:0 ui-imports:0`. | P0 | AC7 | Confirmed |
| **R10** | clause 9 (deletion audit); memory rule "no legacy tests" | **Phase C deletions and references:**<br>• delete `src/components/shared/DatePicker.tsx`, its `story-coverage-exempt.json` entry, and `src/components/shared/__tests__/DatePicker.localization.test.tsx`. That test's four assertion groups (weekday row, month/year header, `sq`/`uk` labels with `Intl.DateTimeFormat` throwing) move into `src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx` as `selectionMode="single"` cases;<br>• delete the legacy Story `src/components/admin/AdminUserProfile.stories.tsx` and its line in `scripts/governance/reports/component-catalog.latest.json` if the catalog generator requires it;<br>• `scripts/check-stories-rendered.mjs:168`: the entry points at `patterns-mantine-adminuserprofileview--view`, anchor unchanged;<br>• `docs/critical-flow-registry.md` row "Admin user detail loads" (`:46`): the subject becomes `AdminUserProfileView` → `RangeDatePicker` (single), the command cell names the moved test cases, and the coverage cell gains *"Task 893: Mantine migration; the legacy DatePicker was removed, and its localization proof moved to RangeDatePicker's single mode."* The `AdminUserProfile.tsx:1042` citation in row `:53` is updated to the View's line.<br>`git grep -n "shared/DatePicker\|admin-adminuserprofile\|AdminUserProfile.stories"` returns nothing outside `docs/sessions/`, `tasks/Archive/` and history ledgers. | P1 | AC8 | Confirmed |
| **R11** | Q4; clause 15 | **`src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`** (new; harness as in `AdminUsersTable.smoke.test.tsx`: `@/modules/admin/actions`, `…/clearHistory`, `@/lib/toast`, `next/navigation` mocked, a real `NextIntlClientProvider` with `messages/en.json`, `MantineProvider` with the project theme):<br>• **T1** edit a first name and save → `updateUserProfileFull(id, …)` with the new name and the unchanged other fields; toast `save_success`;<br>• **T2** set status blocked with an empty reason → validation message, no action call; with a reason and a picked date → the payload carries `status: 'blocked'`, the reason and `suspendedUntil: 'YYYY-MM-DD'`;<br>• **T3** deactivate: confirm disabled with a blank reason; with a reason → `deactivateUser(id, reason)`;<br>• **T4** delete: confirm → `hardDeleteUser(id)` → `router.push('/admin/users')`; cancel → no call;<br>• **T5** clear a history row → `clearHistoryRow('user_change_log', id, rowId)`; `{ cleared: 0 }` → `toast.info` with `clear_history_noop`;<br>• **T6** edit a field, click back → the unsaved dialog; "stay" keeps the page, and no navigation happens;<br>• **T7** create with an invalid email → inline email error, no `createAdminUser` call;<br>• **T8** a non-admin (`isAdmin` false) sees no deactivate/delete actions, and the profile-type select is disabled;<br>• **T9** every edit control is reachable by its label (`getByLabelText` for first name, last name, phone, city, company name).<br>`npm.cmd run test:admin` passes unchanged. | P0 | AC9 | Confirmed |

## 5. Assumptions and open questions

1. **877 is a precondition.** R8 uses 877's wrapper form, token type and helper. If 877 has not landed, or its API
   differs, stop and report `PREMISE DRIFT — 877` with the diff; do not create 877's token here.
2. **Mantine primitives without a Story of their own** (`Divider`, `Anchor`, `Loader`, `Grid`) already have production precedent in the repo and are proven here by the new Views' Stories. `NumberInput`, `LoadingOverlay` and `List` have no precedent and are not used.
3. **Visual changes, recorded (§9) and owner-reviewed (O84-2):** section headers go from 12px uppercase bands to
   TailAdmin §6l 16px/500 headers with a divider; labels move from a fixed 140px column to a `Grid` 3/9 split;
   `FormSectionStack`'s `Default` Story changes chrome; date selection needs Apply/Confirm (one extra click); the
   legacy "Today — <date>" shortcut goes (today's cell stays marked and selectable in one click); the sticky offset
   follows the admin top bar (72px) instead of 80px.
4. **Accessibility gets better, deliberately:** today's `AdminInput`s have no associated label (the row label is a
   `span`). T9 asserts the new association.
5. **Not in scope, and not an owner decision:** migrating `Combobox`, `AdminInput`, `AdminEditLayout`, the `ui/*`
   files, or `AdminUserAvatar`'s markup (895 deletes it once `ProfileTab` moves to R3b).

## 6. Pre-read rule bundle

- `docs/golden-rules.md` in full (GR-0 to GR-6, including GR-1's container exemption, GR-3b and GR-3c).
- `docs/agent-contract.md`: clauses 1, 3, 4, 5, 6, 6a, 7, 9, 10, 11, 12, 13, 14, 15, 16, 16b, 16c, 16d.
- `docs/rule-index.md`: "UI / Layout / Component (current Mantine path)", "Storybook / Visual Proof", "Component
  Catalog / Coverage", "Regression / Critical Flow Coverage", "Admin Table / Admin Control".
- `docs/mantine-responsive-design-system.md`; `docs/tailadmin-style-reference.md` §6l (Form Layout, overlay footer)
  and §6t (date picker); `docs/component-rules.md` (container/presentational split, i18n); `docs/qa-profiles.md` Q4.
- `docs/critical-flow-registry.md` rows "Admin user detail loads", "User status / role / account-type change",
  "Clear history" (×2), "Hard-delete user (admin)", "Admin add-location sub-panel", "Phone entry".
- The executed 868 and 877 kickoffs, read-only.
- `docs/orchestrator-procedures.md` → the 818/819 corollary (Node I/O; hash witnesses).

## 7. Scope — the exact allowed write set

1. `src/app/admin/users/[id]/page.tsx`, `src/app/admin/users/new/page.tsx` (wrapper only)
2. `src/components/admin/AdminUserProfile.tsx` (container)
3. new: `src/components/admin/AdminUserProfileView.tsx`, `AdminUserProfileDialogsView.tsx`, `AdminUserAvatarField.tsx`,
   `AdminUserAvatarFieldView.tsx`, `useAdminAvatarUpload.ts`
4. `src/components/admin/AdminUserAvatar.tsx` (R3a only: logic out, JSX byte-identical)
5. `src/design-system/mantine/patterns/MantineFormSectionStack.tsx`, `RangeDatePicker.tsx`, `index.ts`
6. `src/design-system/mantine/theme.ts`: the one `adminPageFormMaxWidth` key and its type line
7. Stories: new `src/stories/patterns/mantine/AdminUserProfileView.stories.tsx`, `…/AdminUserProfileDialogsView.stories.tsx`,
   `…/AdminUserAvatarFieldView.stories.tsx`; extended `…/FormSectionStack.stories.tsx`,
   `src/stories/mantine/primitives/RangeDatePicker.stories.tsx`; `src/stories/fixtures/admin.fixtures.ts` (additions only)
8. Tests: new `src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`; extended
   `src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx` (and
   `RangeDatePicker.smoke.test.tsx` for single-mode selection)
9. Deleted: `src/components/shared/DatePicker.tsx`, `src/components/shared/__tests__/DatePicker.localization.test.tsx`,
   `src/components/admin/AdminUserProfile.stories.tsx`
10. `scripts/mantine-migration-scope.json` (three entries), `scripts/story-coverage-exempt.json` (the `DatePicker`
    entry), `scripts/surface-census-baseline.json` (R9 removals only), `scripts/check-stories-rendered.mjs` (`:168`),
    `scripts/governance/reports/component-catalog.latest.json` and `docs/component-catalog.md` only if their checks require it
11. `messages/{sq,en,uk,it}.json`: only if a Story needs a `storybook.*` fixture label (no product key changes)
12. `docs/critical-flow-registry.md` (rows `:46` and `:53`)
13. `docs/sessions/<date>-task893-admin-user-profile-mantine.md`, `docs/sessions/evidence/task893/*`
14. `docs/backlog.md`: the 893 cell only

## 8. Out of scope

- `src/modules/admin/actions/**`, `clearHistory`, `/api/upload-avatar`, the DB, RLS and grants.
- `Combobox.tsx`, `AdminInput.tsx`, `AdminEditLayout.tsx`, `AdminUserAvatar.tsx`'s JSX, every `src/components/ui/*`
  file, `ProfileTab.tsx` (895), `AdminUserCreate.tsx` (no importer; noted for a later cleanup).
- The 24-hour clock and `en` day-first (885): the preformatted dates render whatever `page.tsx` passes.

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| Fields, validation, save/create/delete/deactivate/reactivate/clear-history flows, guard, toasts, navigation | §3.4 | **unchanged** (T1–T8) |
| Section headers | 12px uppercase band, muted background | `MantineFormSection`: 16px/500 title + divider (**changed**, TailAdmin §6l) |
| Field rows | 140px label column from `sm` | `Grid` 3/9 from `sm` (**changed**) |
| Edit controls' accessible name | none | the row label (**improved**, T9) |
| Main/sidebar | flex; sidebar 18–20rem, sticky `top-20` from `lg` | `Grid` 8/4 from `lg`, sticky at `adminTopBarHeight` (**changed**) |
| Selects | legacy `Combobox` button variant | `MantineSelect` (bottom sheet below 640) |
| Suspended-until date | legacy popover, closes on click, "Today" shortcut | `RangeDatePicker` single: Apply/Confirm, today marked (**changed**) |
| Dialogs | shadcn `Dialog`, `max-w-sm` | `MantineModal` (bottom sheet below 640), same texts and outcomes |
| Avatar | legacy markup | `AdminUserAvatarFieldView`; same flows (R3a unchanged logic) |
| Page width | `max-w-5xl` / `max-w-3xl` | theme tokens, same values |

## 10. Implementation requirements

### 10.1 I0 — before writing anything

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` (must start `win32`).
2. `git --no-optional-locks status --porcelain` → `docs/sessions/evidence/task893/01-status-before.txt`, plus the
   `git hash-object` of every modified path it lists → `01b-hash-before.txt`.
3. **877 gate.** Confirm that 877 is archived in `docs/backlog-archive.md`, and that `adminPageMaxWidth` and the
   wrapper form exist in the tree. Quote the lines. Otherwise stop with `PREMISE DRIFT — 877`.
4. **Shared-path gate.** None of the §7 paths may be modified in `01`. A modified §7 path belongs to other unreviewed
   work: stop with `BLOCKED — SHARED PATH`, naming it.
5. Re-run both censuses → `02-census-before.txt`. A node absent from §3.2 goes into the session log with a tier. If it
   is unmigrated and not covered by R1–R6, stop with `BLOCKED — CLAUSE 16d`.
6. Re-run §3.3's consumer search → `03-consumers.txt`. A new consumer of `DatePicker` stops R10's deletion
   (`PREMISE DRIFT`).
7. Emit the executor's `GR-0 CANONICAL REUSE PREFLIGHT` and `GR-3a STORY PREFLIGHT` receipts (§15.1 has the
   design-time values to re-verify).
8. Baselines → `04-baseline-tests.txt`: `npm.cmd run test:admin`, and `npx.cmd vitest run` on
   `RangeDatePicker.smoke.test.tsx`, `RangeDatePickerLocalization.test.tsx`, `filtersRangeDatePicker.smoke.test.tsx`
   and `DatePicker.localization.test.tsx` (all exit 0 expected).

### 10.2 Order

I0 → **Phase A:** R1 (+ Story) → R2 (+ Stories, tests) → R3a (with the legacy `Admin/AdminUserAvatar` Story rendering
unchanged) → R3b (+ Story) → **Phase B:** R5, R6 (+ Stories) → R4 → R8 → R11 → plants → **Phase C:** R10 → manifest
and baseline (R9) → gates → report.

### 10.3 Plants (two-armed; each transcript holds the planted file's hash before the plant and after the restore)

| Plant | Edit | Must fail | Evidence |
|---|---|---|---|
| **P1** (R4) | the deactivate confirm no longer checks for a blank reason | T3 | `05-plant-p1.txt` |
| **P2** (R4) | the delete action calls `hardDeleteUser` without opening the dialog | T4 (cancel still deletes) | `06-plant-p2.txt` |
| **P3** (R2) | single mode falls back to the range `pickDay` | the single-mode selection test (a second click builds a range) | `07-plant-p3.txt` |
| **P4** (R9) | re-add `import { Badge } from '@/components/ui/badge'` and render it in `AdminUserProfileView` | the census exits 1 naming `ui/badge` for both routes | `08-plant-p4.txt` |
| **P5** (R5) | remove the label association from the first-name input | T9 | `09-plant-p5.txt` |

Plant and restore through Node `fs`. Record the `git hash-object` before the plant and after the restore; the two
must be equal.

## 11. Positive and negative flows

**Positive flow.** An admin opens a user, edits the phone and city, blocks the account with a reason and an end date,
and saves; the sidebar shows the new status and the date. They clear one history row, then deactivate the user with a
reason. They then create a new agent with company data and an avatar, and land on the new user's page.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation errors (names, location, block reason, company/website) | **Yes** | zod schema | field errors; invalid submit scrolls to the section | T2, `EditErrors` Story |
| Phone invalid | **Yes** | `validateNationalPhone` | save-error banner | `EditErrors` Story |
| Server error on save | **Yes** | §3.4 | banner + `save_error` toast | T1 variant |
| Reason missing (deactivate/reactivate) | **Yes** | R6 | confirm disabled | T3 |
| Delete cancelled / confirmed | **Yes** | R6 | no call / call + redirect | T4 |
| Clear history: forbidden / error / no-op / success | **Yes** | §3.4 | the four toasts | T5 (no-op), existing `clearHistory.smoke` |
| Unsaved changes on navigation | **Yes** | guard | dialog; stay/leave | T6 |
| Non-admin viewer | **Yes** | `isAdmin` | no deactivate/reactivate/delete; profile type disabled | T8, `ViewNoHistoryControls` |
| Create: bad email, pending avatar upload fails | **Yes** | §3.4 | inline error / `avatar_upload_exception` toast | T7, code unchanged (R4) |
| Avatar: wrong type/size/dimensions | **Yes** | R3a | the four error keys | `Error` Story, R3a unchanged logic |
| Mobile < 640 px | **Yes** | clause 11 | single column, full-width controls, bottom-sheet dialogs/select/date, ≥ 44 px targets | Stories at 320/390 (GR-3b receipts) |
| Locale expansion | **Yes** | clause 7 | no overflow in `uk`/`it` | owner matrix |
| Concurrent edit / offline | No | server actions unchanged; errors reach the banner branch | — | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given `MantineFormSectionStack.tsx`, then `MantineFormSection` is exported with R1's props and chrome,
  the stack renders through it, and `FormSectionStack.stories.tsx` has the `Section` export.
- **AC2 [R2]** Given `RangeDatePicker` with no `selectionMode`, then every existing test passes unchanged
  (`04` vs `10`). Given `selectionMode="single"`, then a second day click replaces the first, and Apply commits
  `{ from: d, to: d }`.
- **AC3 [R3a, R3b]** Given `git diff src/components/admin/AdminUserAvatar.tsx`, then its JSX (`return (…)`) is
  unchanged, and only logic moved to the hook. Given `AdminUserAvatarField`, then it renders only the View and the crop
  modal.
- **AC4 [R4, R5, R6]** Given the container, then it renders only the two Views, with 0 `className` and 0 `ui/*`
  imports. Given the three Views, then none contains `className`, a `ui/*` import or a raw colour/px/rem literal
  (`check:design-tokens` and `check:enrolled-tailwind` exit 0).
- **AC5 [R7]** Given the Story files, then each statically imports its View and carries R7's exports, and
  `check:story-coverage` exits 0 with the three Views enrolled.
- **AC6 [R8]** Given both `page.tsx`, then each wrapper is a Mantine `Box` with its token and 0 `className`. Given
  `theme.ts`, then `adminPageFormMaxWidth` is defined; the definition line is quoted.
- **AC7 [R9]** Given `11-census-after.txt`, then each route shows only its root `page.tsx` as `FAIL`, and the
  baseline diff (`20`) removes only keys from `:784-871` and adds none. **Corrected by review 1 (2026-09-30):** the
  expected `FAIL` lines per route are the root `page.tsx` plus the two GR-1 container-exempt nodes (`AdminUserProfile`,
  `AdminUserAvatarField`), each at `className:0 ui-imports:0` with its View enrolled and storied. The only baseline
  additions are the two `AdminUserAvatarField` keys (see R9).
- **AC8 [R10]** Given the tree, then the three deleted files are gone, and the R10 `git grep` returns nothing outside
  history. The registry rows cite the new sources.
- **AC9 [R11, R2]** Given T1–T9 and the single-mode tests on the final tree, then all pass (`10`). P1–P5 each fail as
  §10.3 states and pass after the restore, with equal hashes. `test:admin` passes unchanged.
- **AC10 [all]** `npm.cmd run build` exits 0 on the final tree. `typecheck`, `lint`, `check:story-coverage`,
  `check:rendered-scope`, `check:surface-census:changed`, `check:i18n`, `check:file-integrity`, `check:mojibake` and
  `build-storybook` exit 0.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.` (AC3's "JSX unchanged" is the
declared deliverable of R3a, measured by the diff.)

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Display name / "New user" | page title | 20px | 20px | 20px | 20px | `fz="xl"` | legacy `text-xl`; below 24px, so no step |
| Section headers (`MantineFormSection`) | section heading | 16px | 16px | 16px | 16px | `fz="md"`, `fw={500}` | TailAdmin §6l Form Layout |
| Field labels, values | label / body | 14px | 14px | 14px | 14px | `size="sm"` | legacy `text-sm` |
| History rows, hints, `#public_id` | body small | 12px | 12px | 12px | 12px | `size="xs"` | legacy `text-xs` |
| Dialog titles | dialog title | — | — | — | — | `MantineModal`'s own contract | 868 precedent |

No element reaches 24px; no child heading exceeds the page title.

### 12.2 Width contract (GR-3b)

The production parent is the R8 `Box` (`maw` = a token, `mx="auto"`), a cap and not a width. Every Story is
**fluid**: no `maw`/`w`/`style`/viewport pin in any decorator or `render`. The receipts measure each changed export
at 320, 390, 1024 and 1440.

## 13. QA profile and verification plan

**Q4.** Reasons: a legacy surface migrates, and the route carries five registered critical flows ("Admin user detail
loads", "User status / role / account-type change", "Clear history", "Hard-delete user (admin)", "Admin add-location
sub-panel"). Required: Stories and the owner matrix, the census and baseline proof, T1–T9 with plants, the moved
localization proof, the gates, and the build. No `screenshots:assert`: the owner rule of 2026-09-03 retired it.

### 13.1 Re-entry

From scratch, after 877 is archived.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

Plants first, by hand. Then:

```powershell
$ev = "docs\sessions\evidence\task893"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09b-platform.txt"
node.exe scripts\check-surface-census.mjs --surface "src\app\admin\users\[id]\page.tsx" *>&1 | Tee-Object "$ev\11-census-after.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\users\new\page.tsx *>&1 | Tee-Object -Append "$ev\11-census-after.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd run test:admin *>&1 | Tee-Object "$ev\10b-test-admin.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\12-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\13-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\14-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\15-rendered-scope.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\16-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\17-design-tokens.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\17b-enrolled-tailwind.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\17c-i18n.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\18-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\18b-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\19-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19b-build.txt"
git --no-optional-locks diff -- scripts\surface-census-baseline.json | Tee-Object "$ev\20-baseline-diff.txt"
git --no-optional-locks grep -n -E "shared/DatePicker|admin-adminuserprofile|AdminUserProfile\.stories" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!docs/backlog-archive.md" | Tee-Object "$ev\20b-reference-audit.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after every command. Normalise every `Tee-Object` file (UTF-16LE on Windows
PowerShell 5.1) to UTF-8 without BOM through Node before `check:file-integrity`, line for line. Stop any dev server
before either build. Capture the `git hash-object` of every changed and new file in the same pass
(`22-hash-object.txt`).

Expected:
- `09b` starts with `win32`.
- `11` shows only the two root `page.tsx` `FAIL` lines.
- `10`–`19b` exit 0.
- `20` removes only keys from `:784-871`.
- `20b` prints nothing.
- `21` shows no path outside §7 beyond `01`.

### 13.3 GR-3b / GR-3c receipts (executor)

For every changed Story export, at 320, 390, 1024 and 1440 (1440 and 768 for type): the component's width against
the viewport, horizontal overflow, and `getComputedStyle(el).fontSize` of the page title, one section header, one
label and one history row. One receipt line per Story file, in the session log.

### 13.4 `OWNER VISUAL QA REQUIRED` — O84-2 (Storybook, after the executor reports)

Open each tuple with the toolbar's locale and viewport. Record **accepted**, or **returned** with the defect.

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminUserProfileView` | `View`, `ViewBlocked`, `ViewAgent`, `ViewLocationRequest`, `Edit`, `EditBlocked`, `EditErrors`, `Create` | `sq`, `uk` | 390, 1440 | 32 |
| `Patterns/Mantine/AdminUserProfileView` `View`, `Edit` | — | `en`, `it` | 1024 | 4 |
| `Patterns/Mantine/AdminUserProfileDialogsView` | `Deactivate`, `Delete`, `ClearEntity`, `Unsaved` | `sq`, `uk` | 390, 1440 | 16 |
| `Patterns/Mantine/AdminUserAvatarFieldView` | `WithImage`, `Editable`, `Uploading`, `Error` | `sq` | 390, 1440 | 8 |
| `Patterns/Mantine/FormSectionStack` | `Default`, `Section` | `sq` | 390, 1440 | 4 |
| `Mantine/Primitives/RangeDatePicker` | `SingleDate`, `SingleDateSelected` | `sq`, `en` | 390, 1440 | 8 |

72 tuples. After the deploy, as admin: open a user, block with an end date, save, and read the sidebar; create one
test user.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.

- the changed, new and deleted files with `22-hash-object.txt` values;
- R1–R11 and AC1–AC10, each quoted;
- every command in §10.1, §10.3 and §13.2 with its real exit code and evidence path;
- the 877 gate quotes, the census before/after, and the receipts: GR-0, GR-1, GR-3 per View, GR-3a, GR-3b and GR-3c;
- the plant table with its hash pairs;
- where each moved `DatePicker.localization` assertion now lives;
- assumptions, deviations and limitations;
- O84-2, stated as owed.

Sonnet updates the 893 cell of `docs/backlog.md` (state only), writes the session log with a "Files Changed" table,
and emits no git command.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes: current behaviour (§3.4), census (§3.2), consumers (§3.3), every View, Story, test, plant and command |
| One active route | Yes: Appendix C. The only branches are the I0 stops |
| Every requirement has a binary AC | R1→AC1 · R2→AC2/AC9 · R3a/R3b→AC3 · R4–R6→AC4 · R7→AC5 · R8→AC6 · R9→AC7 · R10→AC8 · R11→AC9 · all→AC10 |
| Two-armed control | T1–T9 and the single-mode tests with P1–P5; the census is the tier-2 detector (P4) |
| Detector blind spot stated | The census walks static imports only (not `dynamic()`; `AvatarCropModal` is dynamic and already Mantine). Stories prove the Views, not the container wiring (T1–T9 do). `check:story-coverage` sees only enrolled files (GR-2) |
| Material absence claims traced | "`DatePicker` has no other consumer" and the §3.3 consumer lists: `grep -rl` of each import path over `src`, re-run at I0 (`03`). "`AdminUserCreate` has no importer": `git grep -n AdminUserCreate -- src` finds only two comments |
| Dirty worktree handled | I0 snapshot and the shared-path gate (§10.1.4) |
| Owner exception claimed | None. The §9 changes are recorded and go to O84-2; D84-1 refused any 16d exception |

### 15.1 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Story/source | Disposition | Implementation and registration |
|---|---|---|---|---|
| Section card | `FormSection`, `DashboardCard`, `TwoColumnForm`; §6l Form Layout | `patterns/MantineFormSectionStack.tsx`, Story `Patterns/Mantine/FormSectionStack` | **extend** | R1; `Section` export |
| Date field | `DatePicker`, `RangeDatePicker`, `@mantine/dates` (not installed) | `patterns/RangeDatePicker.tsx`, Story `Mantine/Primitives/RangeDatePicker` | **extend** | R2; two exports |
| Selects | `Combobox`, `MantineCombobox`, `MantineSelect` | `patterns/MantineSelect.tsx`, Story `Mantine/Primitives/Select` | **reuse** | R5 |
| Dialogs | `MantineModal`, `MantineDialogDrawerPattern`, 868's confirms | Story `Mantine/Primitives/Modal` | **reuse** | R6 |
| Avatar field | `Avatar`, `AvatarCropModal`, `AppImage`, `AdminUserAvatar` | Stories `Mantine/Primitives/Avatar`, `Patterns/Mantine/AvatarCropModal` | **compose** (new View + own Story) | R3b; enrolled |
| Inputs, checkbox, number | `TextInput` (incl. `type="number"`), `Checkbox`, `PhoneField`, `LocationCombobox` | `Mantine/Primitives/*`, `PhoneField`, `LocationComboboxSubPanel` Stories | **reuse** | R5 |
| Badges, alerts, buttons, icon buttons | primitives | `Mantine/Primitives/Badge`, `Alert`, `Button`, `ActionIcon` | **reuse** | R5, R6 |
| Password rules note | `PasswordRequirementsHint` (live check, rejected) | `Mantine/Primitives/Alert` + `Text` | **compose** | R5 |
| Page width | 877's `adminPageMaxWidth`; `max-w-3xl` usage (`admin/users/new`, `admin/settings`) | `theme.other.layout` | **reuse** + **extend** (`adminPageFormMaxWidth`) | R8 |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/users/[id] + /new (profile View, dialogs, avatar field, section card, single date, page wrapper); semantic queries: form section card, date picker single, select, modal confirm, avatar upload, password rules, admin page width; inspected candidates: MantineFormSectionStack (Patterns/Mantine/FormSectionStack), MantineDashboardCard, MantineTwoColumnForm, RangeDatePicker (Mantine/Primitives/RangeDatePicker), MantineSelect (Mantine/Primitives/Select), MantineModal (Mantine/Primitives/Modal), Avatar, AvatarCropModal (Patterns/Mantine/AvatarCropModal), PasswordRequirementsHint, 877 adminPageMaxWidth; decision: EXTEND (FormSection, RangeDatePicker single, adminPageFormMaxWidth) + REUSE + COMPOSE (three new Views with own Stories); selected canonical owner: patterns/MantineFormSectionStack.tsx, patterns/RangeDatePicker.tsx, patterns/MantineSelect.tsx, patterns/MantineModal.tsx, theme.other.layout; Mantine/TailAdmin token path: theme radius 2xl, spacing lg/xl, fz md/xl/sm/xs, TailAdmin §6l; new hardcoded visual values: NONE; rationale: every visual value exists in the theme or the extended owners; the Views only compose.`

`GR-3a STORY PREFLIGHT — AdminUserProfileView / AdminUserProfileDialogsView / AdminUserAvatarFieldView × R7 states; canonical candidates: NONE (only the legacy Admin/AdminUserProfile and Admin/AdminUserAvatar, which render the legacy components and are not canonical); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new Views. — MantineFormSection × section; candidate: patterns-mantine-formsectionstack; decision: EXTEND. — RangeDatePicker × single; candidate: mantine-primitives-rangedatepicker; decision: EXTEND.`

`GR-1 CENSUS COMPLETE — 2 routes × 15 nodes today; after this task, tier1: 3 Views migrated+enrolled+story + 2 container-exempt (AdminUserProfile, AdminUserAvatarField); tier2: 8 imports removed; tier3: LocationCombobox, PhoneField, AppImage, MantineAddItemPanel, MantineCombobox, responsiveBottomSheet listed (all enrolled with Stories) — filed as none.`

## 16. Review 1 — 2026-09-30 — `PARTIALLY VERIFIED`

### 16.1 Record (Opus; frontend task, so there is no review ledger)

- Code: the container holds every piece of state; the three Views and the container have 0 `className` and 0 `ui/*` imports. The legacy `AdminUserAvatar` JSX is byte-identical to `HEAD` (compared with `diff`). Single mode commits through the existing `commit()` (`to ?? from`), and the range path is unchanged.
- Census, re-run natively by the reviewer on the final tree: 17 nodes per route and no tier-2 node. The only `FAIL` lines are the root and the two exempt containers (R9/AC7 as corrected). The baseline diff touches only `admin/users` keys: 26 removed, 2 added (`AdminUserAvatarField`).
- Plants: P1 and P3 ran on the final hashes. The executor's P2 and P5 ran on earlier versions of the container and View, so the reviewer re-ran both on the final tree (container `f787f90a`, View `1a84a5cf`): P2 fails T4, P5 fails T1, T1 err, T6, T7 and T9. Both restored to equal hashes, 10/10 green.
- Stories, measured by the reviewer on the final `storybook-static` (the build contains the `avatar` slot), `sq` and `uk`, at 320/390/768/1024/1440:
  - GR-3b: no horizontal overflow in any matrix Story.
  - GR-3c: the page title is `H1` 20px and the section headers are `H2` 16px; nothing renders at 24px or more.
  - GR-3d: edge gap is 16/16/32/32 on every `AdminUserProfileView` and `FormSectionStack` export. The `AdminUserAvatarFieldView` left edge is 16/16/32/32 (the component is `min-content` wide). The dialogs are overlay-only, and `RangeDatePicker` is a `MantineStoryShell` primitive (exempt).
- Registry row 53 cited `AdminUserProfileView.tsx:687`; the reviewer corrected it to `:670` (`<LocationCombobox`).
- Build `19b` exit 0 is after the last source edit (23:03). The docs edited outside §7 (`component-risk-register.md`, `responsive-storybook-inventory.md`, registry row 62) are clause-9 deletion-audit updates, accepted. The remaining `20b` hits are history files only (weekly reports, `docs/reviews/artifacts/**`, old kickoffs, the entropy audit).

### 16.2 Open before approval

1. **O84-2**, the owner matrix (§13.4, 72 tuples). It includes two visible changes that §9 did not list: the avatar is 84px (was 96px), and email/website truncate with a `title` tooltip.
2. **DECIDED 2026-09-30 (O84-8), owner verbatim: *"O84-8: варіант A, виправляємо в 893"*.** Option A is now
   revision 1's R17 (§17.3). The analysis it answered: legacy "status-only change cannot be saved". `FIELD_OPTIONS.status = {}` (`AdminUserProfile.tsx:94`) keeps the legacy `setValue('status', v)` without `shouldDirty`. So a status change alone leaves `isDirty` false and Save disabled; T2 has to type and clear the reason to get round it. INFERENCE from react-hook-form's `setValue` semantics and T2's own workaround: an admin cannot unblock a user (blocked → active) without editing another field. Options:
   - **A (recommended):** fix it in 893. Set `status: { shouldDirty: true }`, add **T10** ("a status-only change enables Save and sends the new status"), and remove T2's type-and-clear workaround. The verification is the §13.2 test lines plus a P6 plant (restore `status: {}` → T10 fails).
   - **B:** keep 893 byte-faithful and file a separate numbered task for the fix.

## 17. Revision 1 — 2026-09-30 — `NEEDS REVISION` (owner return at O84-2)

### 17.1 Owner result and re-entry

The owner **accepted 64 of 72 tuples** (2026-09-30): every `AdminUserProfileView`, `AdminUserProfileDialogsView`,
`AdminUserAvatarFieldView` and `FormSectionStack` row of §13.4. **Returned:** `Mantine/Primitives/RangeDatePicker`
`SingleDate` / `SingleDateSelected` (8 tuples). The owner's words, verbatim: *"не розумію, чому в жодному з datepicker
не обирається рік вище 2026."*

**Re-entry mode: remediation.** Start from the review-1 tree (§16.1 hashes). Do not re-run I0, the baselines (`04`), the
census baseline update (R9) or plants P1–P5; keep evidence `01`–`24` unchanged. New evidence goes to
`docs/sessions/evidence/task893/r1-*`. Everything accepted above stays as it is; only §17.3's files change.

### 17.2 Root cause (measured by the reviewer, 2026-09-30, `storybook-static`, `sq`)

- **The year range is not the cap.** `computeYearOptions` (`RangeDatePicker.tsx:162-168`) gives `currentYear − 5 …
  currentYear + 10` when there is no `maxDate`, so `SingleDate` offers **2021–2036** (16 options, measured).
- **Desktop (1440):** `MantineCombobox` opens its list at `scrollTop 0` and never brings the current option into view.
  The list is capped at 220px (`Combobox.Options mah`, `MantineCombobox.tsx:374`), so on open the user sees
  **2021–2025**. The current year 2026 and every later year are below the fold, with no cue that the box scrolls
  (measured: `scrollHeight 656`, `clientHeight 220`). A wheel scroll and the keyboard do reach 2036.
- **Mobile (390):** the year opens in `MantineCombobox`'s bottom sheet (`:400-477`), which also renders from the top
  and never scrolls to the selected option. With `YearCombobox`'s ~80 years, the same defect is worse there.
- **"In none of the datepickers"**: the other date fields cap the year **by design**, and that stays:
  `FiltersPanel.tsx:391`, `ListingsFilters.tsx:403` (`maxDate={today}`: a listing cannot be published in the future)
  and `MantineDashboardPeriodControl.tsx:132` (the analytics period ends today). The older Stories
  (`Default`, `OpenBoundedNoValue`) pin `maxDate` to 2026 on purpose (fixed fixtures). Only the admin
  suspended-until field and the two `SingleDate*` Stories have no cap. There, 2027–2036 exist but are hidden.

### 17.3 Requirements (revision 1)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R12** | **`MantineCombobox` desktop:** when the dropdown opens, the option whose value equals `value` is the combobox's selected option **and is scrolled into view** inside the 220px list. Follow Mantine's own `Select` pattern: `useCombobox({ onDropdownOpen: () => combobox.updateSelectedOptionIndex('active', { scrollIntoView: true }), onDropdownClose: … })`. Options already carry `active={value === opt.value}` (`:244`). With no value, the list still opens at the top. No new visual value. | P1 | AC11 |
| **R13** | **`MantineCombobox` mobile sheet:** when the sheet opens, the option button whose value equals `value` is scrolled into view (`scrollIntoView({ block: 'center' })` on a ref to that button, run when the sheet has opened). With no value, the sheet opens at the top. No new visual value, no `style`. | P1 | AC11 |
| **R14** | **No range or cap changes.** `computeYearOptions`, every `maxDate` consumer (§17.2) and the month dropdown stay as they are. The desktop year trigger's missing `aria-label` (measured: the month trigger has `Muaj`, the year trigger `null` at 1440; the mobile one has `Viti`) is fixed by passing `triggerAriaLabel={t('period_year')}` to the desktop year `MantineCombobox` (`RangeDatePicker.tsx:529-538`), the same key the mobile header uses (`:720`). | P2 | AC12 |
| **R15** | **Tests** in `src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx`, new `describe('scroll to the selected option (Task 893 R12/R13)')`:<br>• **T-C1** desktop, 16 options, `value` = the 12th: open → the 12th option has `data-combobox-selected`, and `Element.prototype.scrollIntoView` (stubbed with `vi.fn`, restored after) was called with that option as `this`;<br>• **T-C2** mobile (the file's existing mobile harness, or `matchMedia` mocked to `(max-width: 40em)`): open the sheet → `scrollIntoView` was called on the button of the selected option;<br>• **T-C3** no `value`: open → `scrollIntoView` is not called for any option.<br>Every existing test in the file passes unchanged. | P1 | AC11 |
| **R16** | **Plants**, two-armed, Node I/O, hash witnesses (§10.3 rules): **P7** remove R12's `onDropdownOpen` → T-C1 fails (`r1-plant-p7.txt`); **P8** remove R13's scroll effect → T-C2 fails (`r1-plant-p8.txt`). | P1 | AC11 |
| **R17** | **O84-8 option A: a status-only change can be saved.** In `AdminUserProfile.tsx:94`, `FIELD_OPTIONS.status` becomes `{ shouldDirty: true }`. Nothing else in the container changes: the effect that clears `blockReason` (`:193`) keeps its silent `setValue`, and every other field option stays the same. After-behaviour: in edit mode, changing only the status select marks the form dirty and enables Save. Choosing the stored status again makes the form clean again (react-hook-form compares with the defaults), and Save is disabled. Tests in `AdminUserProfile.smoke.test.tsx`:<br>• **T10** a blocked user (`FIXTURE_PROFILE_USER_BLOCKED`): edit → choose `active` → Save is enabled → click → `updateUserProfileFull(id, …)` with `status: 'active'` and the other fields unchanged;<br>• **T10b** active user: choose `inactive`, then `active` again → Save is disabled;<br>• **T2** drops its type-and-clear workaround (`:210-213`): choose `blocked`, click Save with the reason still empty → `block_reason_required`, no action call. The rest of T2 is unchanged.<br>**Plant P6:** set `status` back to `{}` → T10 fails (`r1-plant-p6.txt`). | P1 | AC14 |

Write set for revision 1: `src/design-system/mantine/patterns/MantineCombobox.tsx`,
`src/design-system/mantine/patterns/RangeDatePicker.tsx` (R14's one prop),
`src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx`,
`src/components/admin/AdminUserProfile.tsx` (R17: one line),
`src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx` (R17),
`docs/critical-flow-registry.md` (row "User status / role / account-type change", `:47`): add the R17 UI proof to the
command cell (`npx vitest run src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx`, T10/T10b), and to the
coverage cell *"Task 893 (O84-8): a status-only change now enables Save on `/admin/users/[id]`; the legacy form could
not save it."*; the session log, `docs/backlog.md` (893 cell only), and `docs/sessions/evidence/task893/r1-*`. **No Story file changes:** `Mantine/Primitives/Combobox`
(`Default`) and `Mantine/Primitives/RangeDatePicker` already render the real component. Both are
`MantineStoryShell` primitives (GR-3d: n/a).

### 17.4 Acceptance criteria (revision 1)

- **AC11 [R12, R13, R15, R16]** T-C1–T-C3 pass. Every existing `MantineCombobox`, `RangeDatePicker`,
  `filtersRangeDatePicker`, `PhoneField` and `AdminUserProfile` test passes. P7 and P8 each fail their test and pass
  after the restore, with equal hashes. **Rendered proof** (Playwright on a fresh `storybook-static`, `sq`), recorded in
  `r1-year-reach.txt`:
  - `Mantine/Primitives/RangeDatePicker--single-date` at **1440**: open the year dropdown. `2026` lies inside the
    list's visible box, and the list can still scroll to `2036`.
  - Same Story at **390**: open the year sheet. `2026` is inside the sheet's visible area.
  - `Mantine/Primitives/Combobox--default` at 1440: open with a value, and the selected option is visible.
- **AC12 [R14]** At 1440 the desktop year trigger's `aria-label` equals `common.period_year` in the active locale.
  `git diff` shows no change to `computeYearOptions` or to any `maxDate` consumer.
- **AC14 [R17]** T10, T10b and the revised T2 pass, and T1 and T3–T9 still pass. P6 fails T10 and passes after the
  restore, with equal hashes. `git diff src/components/admin/AdminUserProfile.tsx` against the review-1 tree changes
  exactly one line (`FIELD_OPTIONS.status`). `npm.cmd run test:admin` passes unchanged. Registry row `:47` cites T10.
- **AC13 [all]** `typecheck`, `lint` (0 errors), `check:story-coverage`, `check:rendered-scope`,
  `check:surface-census:changed`, `check:design-tokens`, `check:enrolled-tailwind`, `check:file-integrity`,
  `check:mojibake`, `build-storybook` and `npm run build` exit 0 on the final tree. `22-hash-object` is re-captured as
  `r1-hash-object.txt`.

`GR-4 AC AUDIT — 4 criteria; each states an observable property; absolutes: none.` (AC14's "one line" is the declared
size of R17, measured by the diff.)

### 17.5 Final gate block (revision 1)

```powershell
$ev = "docs\sessions\evidence\task893"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\r1-platform.txt"
npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/components/shared/__tests__/PhoneField.smoke.test.tsx src/components/admin/__tests__/AdminUserProfile.smoke.test.tsx *>&1 | Tee-Object "$ev\r1-tests.txt"
npm.cmd run test:admin *>&1 | Tee-Object "$ev\r1-test-admin.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\r1-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\r1-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\r1-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\r1-rendered-scope.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\r1-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\r1-design-tokens.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\r1-enrolled-tailwind.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\r1-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\r1-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\r1-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\r1-build.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\r1-status-after.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after each command. Normalise the `Tee-Object` files to UTF-8 without BOM through Node,
and stop any dev server before either build. Run the plants and `r1-year-reach.txt` after `build-storybook`, on that
build.

### 17.6 Owner matrix owed after revision 1 (O84-2, remainder)

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Mantine/Primitives/RangeDatePicker` | `SingleDate`, `SingleDateSelected` (open the year list) | `sq`, `en` | 390, 1440 | 8 |
| `Mantine/Primitives/Combobox` | `Default` (blast radius: open with a value) | `sq` | 390, 1440 | 2 |

GR-3d: both are `MantineStoryShell` primitives (n/a). R17 changes behaviour, not any visible chrome, so it adds no
matrix tuple. After the deploy, the O84-2 live check gains one step: unblock the test user with the status select alone,
and save.

## 18. Review 2 — 2026-09-30 — `PARTIALLY VERIFIED` (revision 1 verified; owner matrix remainder owed)

- **Diff.** Since review 1, the container changes by exactly one line (`status: {}` → `{ shouldDirty: true }`); the
  reviewer diffed blob `f787f90a` against the current `b418f35d`. `MantineCombobox` gains the `onDropdownOpen` call and
  the sheet scroll effect. `RangeDatePicker` gains only the desktop year `triggerAriaLabel`.
- **Accepted deviations:**
  - The `scrollIntoView` stub in `filtersRangeDatePicker.smoke.test.tsx` sits outside §17.3's write set. Clause 9
    requires every active consumer to stay green.
  - T-C1 asserts `data-combobox-active` plus the `scrollIntoView` call. That is the observable property, and Mantine
    does not set `data-combobox-selected` there.
  - `suspendedUntil` stays in the payload after blocked → active. That is harmless:
    `modules/admin/actions/index.ts:377-378` writes `block_reason` and `suspended_until` as `null` whenever the status
    is not `blocked`.
- **Full suite (reviewer, native, final tree):** `npx.cmd vitest run` → 2137 passed, 5 failed in 4 files. None of them
  is attributable to 893, and none reports a `scrollIntoView` error:
  - `ListingCard.smoke` "archived": already failing in the Task 782/788 logs;
  - `css-var-resolvability`: `--width-content`, added to `globals.css` by commit `848611017` (Task 877), which 893 does
    not touch;
  - `overlay-dual-declaration`: reads the `.next` build output;
  - `task763/appimage-config-class-assertions`: an evidence-folder test.
- **Evidence.** Plants P6, P7 and P8 fail as specified and restore to equal hashes. `r1-year-reach.txt` shows 2026
  visible and 2036 reachable at 1440, and 2026 visible at 390. Gates and build exit 0 after the last source edit
  (10:08 → build 10:13). The `r1-hash-object` values equal the current files.
- **P3 note (at approval):** the comment above `FIELD_OPTIONS` (`AdminUserProfile.tsx:90-91`) still says
  "`status`/`useMainPhone`: none". Only `useMainPhone` is silent now.
- **Owner matrix remainder:** only the 8 `Mantine/Primitives/RangeDatePicker` `SingleDate` / `SingleDateSelected`
  tuples. The §17.6 `Combobox` `Default` row is **withdrawn**: that Story has no preset value and 6-option lists, so
  nothing can scroll there. The behaviour is proven by T-C1–T-C3, P7/P8 and the year-list measurement.

## 19. Revision 2 — 2026-09-30 — `NEEDS REVISION` (owner return: a later year cannot be selected on a phone)

### 19.1 Owner return and what reviews 1–2 missed

The owner returned `Mantine/Primitives/RangeDatePicker` again, at 320px in `uk`, verbatim: *"я як не міг обрати інший
рік (більше 2026 року) так я його і не можу зараз обрати в жодному з запропонованих datepicker. Це проблема Story чи
взагалі компоненту?"* (with a screenshot of the `Default` Story's mobile sheet). **It is the component, not the Story.**
Revision 1 and both reviews proved that later years are **visible** in the list; nobody proved that **choosing** one
works. The acceptance for this revision is the selection result, never the list's contents.

### 19.2 Root cause (FACT: reviewer, live Storybook `:6006`, Playwright, 2026-09-30)

- **Desktop (1440), works:** choosing `2030` moves the calendar to `Серпень 2030 р.`, and the year field reads 2030.
- **Mobile (320), broken:** choosing `2030` in the year sheet leaves the field at `2026` and the calendar unmoved.
  `MobileBody` renders a fixed month window: `[minDate ?? anchor − 12 months, maxDate ?? anchor + 15 months]`, capped
  at `MOBILE_MAX_MONTHS` (`RangeDatePicker.tsx:86-88`, `:628-640`). With today as the anchor, that is July 2025 –
  December 2027. The year list (`computeYearOptions`, `:162-168`) offers 2021–2036. `jumpTo` (`:671-677`) returns
  silently when the target month is outside the window (`if (idx === -1) return`), and `handleYearChange` (`:686-692`)
  goes through it. The month dropdown (`:710`) has the same dead path for any month outside the window.
- **Production reach:**
  - the admin suspended-until field (no cap): on a phone, only years up to 2027 are reachable;
  - `FiltersPanel.tsx:391` and `ListingsFilters.tsx:403` (`maxDate={today}`): on a phone, the offered years 2021–2024
    do nothing;
  - `MantineDashboardPeriodControl` uses the same path.
  
  The defect dates from Task 561, not from 893, but 893 owns `RangeDatePicker` (R2) and the owner returned it here.

### 19.3 Requirements (revision 2)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R18** | **Every year and month the mobile dropdowns offer can be selected.** In `MobileBody`, the window is built around a **window anchor** held in state. It starts at today's `anchorMonth`, so the opening view is unchanged. When `jumpTo` receives a month outside the current window, it re-anchors the window on that month (the same `−12 / +15` span, clipped to `minDate`/`maxDate`, still capped by `MOBILE_MAX_MONTHS`). After the window renders, it scrolls to that month's section and sets the header to it. A month inside the window keeps today's path (scroll only, no re-anchor). `if (idx === -1) return` never swallows an offered selection. The staged selection, Confirm, the range/single modes, the desktop body, `computeYearOptions` and every `maxDate` consumer are unchanged. No new visual value. | P1 | AC15 |
| **R19** | **Tests** in `RangeDatePicker.smoke.test.tsx`, inside the existing `describe('RangeDatePicker — mobile …')` harness:<br>• **T-M1** no value, no bounds: choose year `2030` in the year sheet → the header's year trigger reads `2030` and a `2030` month section is rendered;<br>• **T-M2** choose `2021` → the same for 2021;<br>• **T-M3** `selectionMode="single"`: choose `2030`, pick a day, Confirm → `onChange` gets `{ from: '2030-…', to: the same }`;<br>• **T-M4** `maxDate` = a fixed 2026 date: the year list ends at 2026, and choosing `2022` lands in 2022 (the filters' case);<br>• **T-M5** choosing a month inside the current window still only scrolls: the rendered first section does not change.<br>Every existing test passes unchanged. **Plant P9:** restore the silent `return` for an out-of-window target → T-M1, T-M2 and T-M4 fail (`r2-plant-p9.txt`). | P1 | AC15 |

Write set for revision 2: `src/design-system/mantine/patterns/RangeDatePicker.tsx` (`MobileBody` only),
`src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx`, the session log, `docs/backlog.md`
(893 cell only), and `docs/sessions/evidence/task893/r2-*`. Re-entry mode is **remediation**: start from the
review-2 tree and keep every `01`–`24` and `r1-*` artifact. The P3 comment in §18 is fixed in this revision too
(`AdminUserProfile.tsx:90-91`, comment only).

### 19.4 Acceptance and rendered proof

- **AC15 [R18, R19]** T-M1–T-M5 pass, P9 fails them and passes after the restore (equal hashes), and the full
  §17.5 test line plus `RangeDatePickerLocalization` and `filtersRangeDatePicker` pass. **Rendered proof on a fresh
  `storybook-static`, recorded in `r2-year-select.txt`:** for `SingleDate` **and** `Default` (the owner opened the
  first, uncapped trigger), at **320** and **1440**, in `uk`, choose `2030` → the calendar shows a 2030 month and the
  year field reads 2030. At 320, choose a day and Confirm → the trigger shows a 2030 date. Also for `Default` at
  320, choose `2022` on the capped (`maxDate`) instance → it lands in 2022. The proof records what was **selected**,
  not what the list contained.
- Gates: §17.5's block, re-run as `r2-*`, all exit 0 on the final tree.

`GR-4 AC AUDIT — 1 criterion; states an observable property; absolutes: none.`

### 19.5 Owner matrix after revision 2 (O84-2 remainder)

**Superseded by §20.5** (review 3): this list did not say which `Default` instance to open, and two of its five end at
2026 by design.

## 20. Review 3 and revision 3 — 2026-09-30 — `NEEDS REVISION`

### 20.1 Review 3 record (Opus; frontend task, no ledger)

- **Tree:** `RangeDatePicker.tsx` `7fd34906`, `RangeDatePicker.smoke.test.tsx` `274926d3`, `AdminUserProfile.tsx`
  `ef9d04c2`, equal to `r2-hash-object.txt`. The container diff since review 2 is the `FIELD_OPTIONS` comment only. The
  `r2-*` gates and build exit 0 and ran after the last source edit (10:36, build 10:39). P9 fails T-M1–T-M4 and
  restores to an equal hash. The `scrollIntoView` stub in the mobile tests is accepted, because jsdom has no
  `scrollIntoView`.
- **Rendered, by the reviewer** (`docs/sessions/evidence/task893/review3-rendered.txt`, `uk`, live `:6006` and the
  10:38 `storybook-static`):
  - Choosing 2030 commits in every uncapped instance at 320 and at 1440. At 320: `Default` row 1, `SingleDate` and
    `SingleDateSelected` each give `15.01.2030` after Confirm.
  - The r2 session log's deviation 1 is **incorrect**. `Default`'s uncapped row exists at 320: press Escape to close
    the forced-open sheet, then open the row. Its other claim holds: the forced-open instance and row 3 carry
    `maxDate` 10.02.2026, so they end at 2026 **by design**.
  - The extra `windowStart` rule for a moved window with `minDate` works (`disablePastDates` row, 2036 at 320).
    No test covers it.
- **Owner message during review 3, verbatim:** *"проблема в тому, що я не можу в Story обрати зі списку 2027-2036 рік,
  я можу обрати лише любий рік включно з 2026 роком, але не більше. Ця проблема тільки в Story чи взагалі у
  компоненті? … нахуя тоді у компоненті 4 варіанти, де в жодному я не можу обрати 2027 рік"*.
  - **It was the component, not the Story.** On a phone, a year outside the month window was a silent no-op (§19.2).
    On desktop, the 220px year list opened at 2021 with 2026+ below the fold (§17.2).
  - Both fixes are in the **uncommitted** working tree. A fresh load of `:6006` or of the rebuilt `storybook-static`
    selects 2027–2036.
  - `http-server` serves `storybook-static` with `cache-control: max-age=3600`. A tab opened before 10:38 can
    therefore keep the old picker; reload it with Ctrl+Shift+R.
  - Of `Default`'s five instances, rows 1, 2 and 4 are uncapped. Row 3 and the forced-open one end at 2026 on purpose.

### 20.2 Finding (blocking)

**P2 — R18 regression: after the window shrinks, the phone header stops following the scroll.**
- **Where:** `RangeDatePicker.tsx` `MobileBody`: `sectionRefs` (`:654`), `handleScrollPositionChange` (`:670-672`),
  `visibleMonth = months[visibleMonthIdx] ?? anchorMonth` (`:704`).
- **Mechanism (FACT):** when a jump replaces the window with a shorter one, `sectionRefs.current` keeps `null` entries
  past `months.length`. `:672` maps them to `offsetTop 0`, so `pickVisibleMonthIdx` returns an index past `months`,
  and the header falls back to `anchorMonth`.
- **Measured** on the forced-open capped instance at 320:
  1. choose 2022 (the window grows to 60 months), then 2026 (it shrinks to 14);
  2. scroll the list up: the first visible section is `Листопад 2025 р.`, but the header reads `Січень 2026`.
  3. Control, the same scroll with no jumps: the header reads `Жовтень 2025`.
- **Impact:** before R18, only a prop change could replace the window. Now a user's jump does, so the header can show
  the wrong month and year. That breaks review 6 F17's contract, "the header reads the section actually scrolled
  into view". It hits every consumer with a bound: the filters (`maxDate`), the dashboard period and
  `disablePastDates`.

**Also blocking, evidence:** the moved-window `minDate` rule (`:635-637`) decides whether a far target is rendered
at all. R19 has no test for it, so no plant can prove it.

### 20.3 Requirements (revision 3)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R20** | **The header reads only rendered sections.** In `handleScrollPositionChange`, the section tops come from `sectionRefs.current.slice(0, months.length)`, never from stale entries past the current window. After any re-anchor, larger or smaller, scrolling the list updates both header dropdowns to the section scrolled into view, exactly as without a jump. Nothing else changes: the jump path, R18's window rules, `pickVisibleMonthIdx`, the desktop body, and every visual value. | P2 | AC16 |
| **R21** | **Tests** in `RangeDatePicker.smoke.test.tsx`, inside the existing `describe('RangeDatePicker — mobile year/month selection outside the window (Task 893 R18/R19)')` (`:613`), using its harness:<br>• **T-M6 (shrink):** `value` `{ from: '2026-01-28', to: '2026-02-05' }` and `maxDate` `new Date(2026, 1, 10)` (the `Default` forced-open fixture). Choose `2022`, then `2026`, then `fireEvent.scroll` the list's viewport. In jsdom every `offsetTop` is 0, so the header must read the **last rendered** section, February 2026 (month trigger = the `common.calendar_*` February label, year trigger `2026`), and **not** the anchor fallback, January 2026. If the harness cannot deliver a scroll callback in jsdom, stop with `BLOCKED — T-M6 HARNESS`; do not weaken the assertion.<br>• **T-M7 (`minDate` branch):** `disablePastDates`, no `maxDate`, no value. Choose the last offered year (`new Date().getFullYear() + 10`): the year trigger reads it, and a section of that year is rendered.<br>**Plants** (two-armed, Node I/O, hash witnesses as in §10.3): **P10** revert R20 (tops from the full `sectionRefs.current`) → T-M6 fails (`r3-plant-p10.txt`). **P11** make a moved window start at `minDate` again (drop the `moved` branch at `:637`) → T-M7 fails (`r3-plant-p11.txt`). Each file passes after its restore, with equal hashes. | P2 | AC16 |

**Write set:** `src/design-system/mantine/patterns/RangeDatePicker.tsx` (`MobileBody`'s
`handleScrollPositionChange` only), `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx`,
the session log (a "Revision 3" section with its own Files Changed table), `docs/backlog.md` (893 cell only), and
`docs/sessions/evidence/task893/r3-*`. **Re-entry: remediation.** Start from the review-3 tree (§20.1 hashes), and
keep every `01`–`24`, `r1-*`, `r2-*` and `review3-*` artifact. No Story file changes.

### 20.4 Acceptance (revision 3)

- **AC16 [R20, R21]** T-M6 and T-M7 pass; P10 and P11 fail them and pass after the restore, with equal hashes.
  T-M1–T-M5 and the full §17.5 test line still pass.
  **Rendered proof on a fresh `storybook-static`** (`uk`, Chromium), recorded in `r3-header-follow.txt`:
  - repeat §20.2's measurement on the `Default` forced-open instance at 320 (choose 2022, then 2026, scroll up about
    700px). The header must equal the first visible section's month and year, as in the no-jump control;
  - `Default` row 4 (`disablePastDates`) at 320: choose the last offered year → the year field reads it.
- **Gates:** §17.5's block, re-run as `r3-*`, all exit 0 on the final tree, with the build after the last source edit.
  `r3-hash-object.txt` holds the two changed files.

`GR-4 AC AUDIT — 1 criterion; states an observable property; absolutes: none.`

### 20.5 Owner matrix after revision 3 (O84-2 remainder, 12 tuples; supersedes §19.5)

Before opening anything, reload the Storybook tab with **Ctrl+Shift+R**.

| Story | Instance to open | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Mantine/Primitives/RangeDatePicker` `SingleDate` | the open panel | `uk`, `en` | 320, 1440 | 4 |
| `…` `SingleDateSelected` | the first row (closed trigger) | `uk`, `en` | 320, 1440 | 4 |
| `…` `Default` | **row 1** (empty). At 320, press Escape first to close the forced-open sheet | `uk`, `en` | 320, 1440 | 4 |

In each tuple, choose a year after 2026, pick a day in that year, and Apply/Confirm. Accepted means the trigger shows
that date. At 320, also scroll the list after the year jump: the header must follow the visible month.

`Default` row 3 and the forced-open instance, and `OpenBoundedNoValue`, end at 2026 because of their `maxDate`. That is
by design (fixed fixtures; production filters cannot pick a future publish date), not a defect.

GR-3d: `MantineStoryShell` primitive (n/a).

---

## Appendix A — Evidence preflight (task design)


| Claim | Source inspected | Status |
|---|---|---|
| Census, 15 nodes per route | `check-surface-census.mjs`, 2026-09-27; baseline `:784-871` | VERIFIED |
| Current behaviour | `AdminUserProfile.tsx` read in full (1235 lines), `AdminUserAvatar.tsx` (232), `DatePicker.tsx` (217), both `page.tsx` | VERIFIED |
| Shared-file consumers | `grep -rl` of each import path | VERIFIED |
| Single-day commit path exists in `RangeDatePicker` | `RangeDatePicker.tsx:740-745`, trigger `:812-816` | VERIFIED |
| `MantineFormSectionStack` has no production consumer | `grep -rl MantineFormSectionStack src` (stories/index only) | VERIFIED |
| 877 provides `adminPageMaxWidth` and the wrapper | 877 kickoff §4, `:197`, `:293` | VERIFIED as designed; landed state re-checked at I0 |
| Legacy Story referenced by a gate | `scripts/check-stories-rendered.mjs:168` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Evidence | Result |
|---|---|---|---|
| 16d / GR-1 | every rendered node dispositioned; census gate before and after | §3.2, R9 | COMPLIANT |
| GR-0 / 16b | reuse/extend/compose only; no raw value | §15.1 | COMPLIANT |
| GR-3 / 16c | a Story per new View; extended owners' Stories extended | R7 | COMPLIANT |
| GR-3b / GR-3c | width contract and type-scale table in the kickoff; receipts owed | §12.1, §12.2, §13.3 | COMPLIANT |
| component-rules container/View | containers hold state; Views are props-only | R4–R6, R3b | COMPLIANT |
| clause 9 deletion audit | references rewritten; grep proof | R10, `20b` | COMPLIANT |
| clause 15 | five critical flows keep automated proof | R11, `test:admin`, moved localization test | COMPLIANT |
| Memory rule "no legacy tests" | the legacy `DatePicker` test moves to the canonical owner | R10 | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Producer → artifact | Failure |
|---|---|---|---|
| 0 | 877 landed; no shared path dirty | I0.3, I0.4 | `PREMISE DRIFT — 877` / `BLOCKED — SHARED PATH` |
| 1 | Census before | I0.5 → `02` | unmigrated node outside R1–R6 → `BLOCKED — CLAUSE 16d` |
| 2 | Phase A leaves with Stories | R1–R3b | a changed legacy Story render (`Admin/AdminUserAvatar`) → stop |
| 3 | Phase B Views and container | R4–R8, T1–T9 | a behaviour test fails → fix before plants |
| 4 | Plants | `05`–`09` | a plant passes → test defect |
| 5 | Phase C deletions and baseline | R9, R10 | a key added, or a reference left → fix |
| 6 | Gates | §13.2 | non-zero → `PARTIALLY IMPLEMENTED` |
| 7 | Owner | O84-2 | returned tuple → revision |
