# Task 893 — `/admin/users/[id]` and `/admin/users/new` on canonical Mantine

Sprint 84 · **P2** · QA profile **Q4** (legacy surface → Mantine, plus five critical flows on it) · **depends on
877** (hard: the admin page-wrapper form and the `adminPageMaxWidth` token) · blocks **885** and **895** · owner action
**O84-2** · **Status: `KICKOFF FILED` 2026-09-28**

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
| **R9** | GR-1; 868 R9 | After the change, both routes' census shows no tier-2 node, `AdminUserProfile` as container-exempt, the three Views and `RangeDatePicker` as `manifest:yes story:yes`, and no `AdminEditLayout`, `AdminInput`, `AdminUserAvatar`, `Combobox` or `DatePicker` node. Only the root `page.tsx` line fails (the calibration 885 §3.4 records). Regenerate `scripts/surface-census-baseline.json` with `npm.cmd run check:surface-census:changed:update-baseline`. Every removed key must be one of the 30 at `:784-871`, **no key may be added**, and no other surface's key may change. | P0 | AC7 | Confirmed |
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
  baseline diff (`20`) removes only keys from `:784-871` and adds none.
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
