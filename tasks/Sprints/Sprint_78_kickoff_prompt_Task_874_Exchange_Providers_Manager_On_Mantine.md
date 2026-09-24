# Task 874 — the exchange-provider manager moves to canonical Mantine, and the last legacy `ui/PasswordInput` goes

Sprint 78 (moved from Sprint 81 by owner decision **D78-7**) · **P3** · QA profile **Q3** · depends on 873 (landed) ·
owner action **O78-5** · **Status: 📝 KICKOFF FILED 2026-09-24, READY FOR SONNET**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md)
(D78-7 is quoted verbatim there and in §5 below). The sibling nodes of `/admin/currency` are filed as **877**.

## 1. Mode and task type

`IMPLEMENTATION` — a legacy admin manager migrates to canonical Mantine, followed by a legacy primitive deletion.
- `AdminExchangeProvidersManager.tsx` splits into containers + two presentational Views:
  - the table/cards and delete confirmation;
  - the provider form dialog.
- Each View gets its own canonical Story and a manifest entry.
- `src/components/ui/PasswordInput.tsx` and its legacy Story are deleted. So is the legacy
  `Admin/AdminExchangeProvidersManager` Story, which the new canonical Stories replace.
- The deletion requires a whole-repo reference audit (agent-contract 9).
- One new locale key in four locales.

Bundles:
- **UI / Mantine current path**;
- **Admin Table / Admin Control**;
- **Storybook / Visual Proof**;
- **Component Catalog / Coverage**, for the deletion.

## 2. Objective

- The admin exchange-provider manager on `/admin/currency`, in its Providers tab, renders entirely with canonical
  Mantine patterns and primitives. Admins see **the same data and the same actions** as today.
- The API-key field is native Mantine `PasswordInput`, with a labelled reveal toggle.
- After that, nothing in the repository imports `@/components/ui/PasswordInput`, and the file is gone.

## 3. Verified context — measured 2026-09-24 (re-measure at I0)

- **F1 (FACT).** `src/components/admin/AdminExchangeProvidersManager.tsx`:
  - 384 lines; 62 `className=` lines (the census counts 63 JSX attributes);
  - 11 rendered `@/components/ui/*` import bindings from six modules: `button`, `dialog` (5 names), `input`,
    `label`, `PasswordInput`, `badge` (`:7-12`);
  - it renders the shared legacy `AdminTable` (`:13`, `:313-372`).

  It holds two components, both **containers today**: they call server actions and `toast` and keep state.
  - `ProviderFormDialog({ initial, onClose, onSaved })` (`:33-153`) is exported. It keeps 7 field states and
    submits via `createExchangeProvider`/`updateExchangeProvider`.
  - `AdminExchangeProvidersManager({ initialProviders })` (`:161-384`) handles create/edit (opens the dialog),
    toggle (`toggleExchangeProviderEnabled`) and delete (a confirm dialog, then `deleteExchangeProvider`). Its root
    carries `data-testid="admin-exchange-providers-manager"` (`:287`).
- **F2 (FACT).** The only production consumer is `src/components/admin/AdminCurrencyTabs.tsx:28`:
  `<AdminExchangeProvidersManager initialProviders={providers} />`. `ProviderFormDialog` is imported only by the
  legacy Story. The server actions (`src/modules/admin/actions/exchangeProviders.ts`, `'use server'`) stay unchanged.
- **F3 (FACT, GR-1 census 2026-09-24, win32, full, not truncated).**

  `--surface src/components/admin/AdminExchangeProvidersManager.tsx` gives 10 nodes:
  - tier-1: the manager (63/11), `AdminTable` (29/5), `AdminCardList` (14/0);
  - tier-2: `badge`, `button`, `dialog`, `input`, `label`, `PasswordInput`, `dropdown-menu`.

  `--surface src/app/admin/currency/page.tsx` gives 18 nodes and exit 1:
  - 7 tier-1 unenrolled: `page.tsx`, `AdminCurrencyTabs`, `AdminPageHeader`, `AdminCurrenciesManager` (81/10),
    `AdminExchangeProvidersManager`, `AdminTable`, `AdminCardList`;
  - 8 tier-2: `tabs`, `badge`, `button`, `dialog`, `input`, `label`, `PasswordInput`, `dropdown-menu`.

  Scope follows **D78-7**: this task owns the manager's own subtree. Everything else on the page is **877**.
- **F4 (FACT).** `src/components/ui/PasswordInput.tsx` (50 lines, 5 `className`, wraps shadcn `Input`) has exactly one
  production importer: `AdminExchangeProvidersManager.tsx:11`. Its Story is `src/components/ui/PasswordInput.stories.tsx`
  (151 lines, title `Primitives/PasswordInput`). The canonical Mantine proof already exists:
  `src/stories/mantine/primitives/PasswordInput.stories.tsx` (`Mantine/Primitives/PasswordInput`, reworked by 873).
- **F5 (FACT).** Canonical owners exist for every piece (GR-0 inputs):
  - **Table ↔ cards:** `MantineDataTableToCards` (`src/design-system/mantine/patterns/MantineDataTableToCards.tsx:188-262`;
    props `columns`, `rows`, `emptyLabel`, `card`, `tableHeader`, `rowClassName`; `rows` require a **string** `id`).
    Its production precedent is `src/components/admin/AdminUsersTable.tsx`:
    - `ActionIcon variant="subtle" size="sm"`, icons at `theme.other.iconSize.compact`, `mih/miw={theme.other.touchTarget}`
      in cards (`:136-172`);
    - `Badge variant="light" size="sm"` (`:190`).
  - **Dialogs:** `MantineModal` (`patterns/MantineModal.tsx`) is controlled (`opened`, `onClose`, `title`, `children`,
    `footer`, `size`). It is a centred Modal from 640px and a bottom sheet below. Canonical Story:
    `src/stories/mantine/primitives/Modal.stories.tsx`.
  - **Fields and controls** (`src/stories/mantine/primitives/*.stories.tsx` exists for each): `TextInput`,
    `PasswordInput`, `SegmentedControl`, `Button`, `ActionIcon`, `Badge`, `UnstyledButton`.
  - **Reveal-toggle labelling precedent:** `AuthSheet.tsx:137` uses
    `visibilityToggleButtonProps={{ 'aria-label': visible ? tc('hide_password') : tc('show_password') }}`. The keys
    `common.show_password`/`common.hide_password` exist.
- **F6 (FACT).** `docs/component-rules.md` → "Container / Presentational Primitive Split" (owner P0, 2026-07-10): a
  component that uses hooks or network must render a prop-driven View. The View is what Storybook proves, with no
  hook or network mocking. Precedent: 873's `ResetPasswordClient` → `ResetPasswordView` (fully controlled props;
  Story `Patterns/Mantine/ResetPasswordView`; manifest `scripts/mantine-migration-scope.json:101-102`).
  GR-1's container exemption (D81-2 wording, in `docs/golden-rules.md`) exempts a container that has 0 `className`,
  0 `ui/*` imports and no JSX beyond its View and slots.
- **F7 (FACT).** Localization:
  - `admin.currency.providers` has 27 keys, including `mode_auto|manual|hybrid`, `enable`, `disable`, `edit`,
    `delete`, `delete_confirm`, `empty`, `api_key`.
  - The API-key placeholder `"(optional)"` is a **hardcoded English literal** (`:106`), a clause-7 defect. The only
    `label_optional` key is `storybook.mantine.label_optional`, which production must not use.
  - `scripts/i18n-dynamic-manifest.json:34-39` records the dynamic `mode_${m}` site as
    `AdminExchangeProvidersManager.tsx:132`.
  - `check:i18n`, `check:i18n-dynamic` and `check:stories` exit 0 at HEAD.
- **F8 (FACT).** Other live references to the artifacts this task deletes or moves (clause 9 audit, measured).
  Historical folders (`docs/sessions/`, `docs/chat-gpt-reports/`) are excluded.
  - `scripts/story-realmode-allowlist.json:9`: legacy story export `FormDialogMobileBottomSheet`. `check:stories` has
    a stale-entry check, so this becomes a **failure** once the Story is deleted.
  - `scripts/check-stories-rendered.mjs:154`: the id `admin-adminexchangeprovidersmanager--default`. That script is
    `governance:screenshots:assert`, which is **retired** (owner 2026-09-03). Edit its data row; never run it.
  - `scripts/i18n-dynamic-manifest.json:36`: the `site` line.
  - `scripts/governance/tailwind-entropy.allowlist.json:128`: an entry for this file. `governance:tailwind` already
    **exits 1 at HEAD** (pre-existing), so it is recorded, not asserted.
  - `scripts/surface-census-baseline.json:313`:
    `src/app/admin/currency/page.tsx :: src/components/ui/PasswordInput.tsx :: tier2-legacy-primitive`.
  - Docs:
    - `docs/component-coverage-matrix.md:25` (`PasswordInput` → the legacy Story path);
    - `docs/admin-ux-rules.md:96`, `:352`, `:393-394` (provider dialogs);
    - `docs/component-catalog.md:107`;
    - `docs/component-risk-register.md:13`, `:72`, `:245`.
  - `scripts/governance/reports/*.latest.json` are generated reports. Nothing reads them as input
    (`component-catalog.mjs --check` checks only infrastructure). **Do not hand-edit them.**
- **F9 (FACT).** `docs/critical-flow-registry.md` has no exchange-provider row. Its "Archetype C" admin write guard
  row covers `createCurrency`, which is not touched.
- **F10 (FACT).** The fixture `FIXTURE_PROVIDERS` (`src/stories/fixtures/admin.fixtures.ts:102`) holds 3 providers:
  - modes `auto`, `hybrid` and one more;
  - one with an `api_key`;
  - enabled/disabled state is to be read at I0.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | F1, F5, F6 | New View `src/components/admin/AdminExchangeProvidersView.tsx`, specified in §10.3. It renders the "new" action, the provider list through `MantineDataTableToCards` (table from `sm`, cards below) and the delete confirmation through `MantineModal`. It accepts `formSlot?: ReactNode` for the form dialog. **No hooks except `useTranslations` / `useMantineTheme`, no server actions, no `toast`.** The root keeps `data-testid="admin-exchange-providers-manager"`. | P1 | AC2, AC5, AC7 | Confirmed |
| **R2** | F1, F5, F7 | New View `src/components/admin/ProviderFormDialogView.tsx`, specified in §10.3: a fully controlled `MantineModal` form. It uses `TextInput` for name/endpoint/notes, `TextInput type="number"` for interval/priority (as today), `SegmentedControl` for mode and native `PasswordInput` for the API key. The reveal toggle is labelled with `common.show_password`/`hide_password`, and the placeholder comes from the new key `admin.currency.providers.api_key_placeholder`. | P1 | AC2, AC3, AC7 | Confirmed |
| **R3** | F1, F2, F6 | `AdminExchangeProvidersManager.tsx` keeps both public exports with unchanged props: `AdminExchangeProvidersManager({ initialProviders })` and `ProviderFormDialog({ initial, onClose, onSaved })`. Both become **pure containers**: all state, server actions, `toast` and validation stay in them exactly as today, and each renders only its View (the manager passes `<ProviderFormDialog/>` through `formSlot`). **0 `className`, 0 `@/components/ui/*` imports and no `AdminTable` import remain.** | P0 | AC1, AC4 | Confirmed |
| **R4** | GR-3, GR-3a, F6 | Two new canonical Stories, each directly importing its View:<br>• `src/stories/patterns/mantine/AdminExchangeProvidersView.stories.tsx` (`Patterns/Mantine/AdminExchangeProvidersView`) with exports `Default`, `Empty`, `Pending`, `DeleteConfirm`;<br>• `src/stories/patterns/mantine/ProviderFormDialogView.stories.tsx` (`Patterns/Mantine/ProviderFormDialogView`) with exports `New`, `Edit`, `ApiKeyRevealed`, `Submitting`.<br>Both use `FIXTURE_PROVIDERS` and no-op or local-state callbacks. They have **no** `LocaleStress`, viewport-named exports or `globals.viewport` pins: locale and width come from the toolbar. Both Views are added to `scripts/mantine-migration-scope.json`. | P1 | AC5 | Confirmed |
| **R5** | F4, F8, clause 9 | Delete these three files:<br>• `src/components/ui/PasswordInput.tsx`;<br>• `src/components/ui/PasswordInput.stories.tsx`;<br>• `src/components/admin/AdminExchangeProvidersManager.stories.tsx` (the legacy `Admin/…` page, which the R4 Stories replace; GR-3a forbids keeping a parallel page).<br>Then update every **live** reference in F8 as §10.4 states. The whole-repo reference search must be empty outside the historical folders. | P1 | AC6 | Confirmed |
| **R6** | F7, clause 7 | Add `admin.currency.providers.api_key_placeholder` to all four `messages/*.json`: `sq` `"(opsionale)"`, `en` `"(optional)"`, `uk` `"(необов’язково)"`, `it` `"(facoltativo)"`. Move the `i18n-dynamic-manifest.json` `site` to the new `mode_${…}` line in `ProviderFormDialogView.tsx`, and add the View file's other `mode_${…}` sites if the checker requires them. | P1 | AC3 | Confirmed |
| **R7** | F1 | Smoke test `src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx` (T1), specified in §10.5, with plants P1/P2 whose transcripts are kept. | P1 | AC7 | Confirmed |
| **R8** | F3, F8 | `scripts/surface-census-baseline.json` is regenerated with the house updater (§13.2). The diff must remove exactly the `…/currency/page.tsx :: …/ui/PasswordInput.tsx :: tier2-legacy-primitive` key and add none. Any other change is `SCOPE GUARD FAILED`: stop and do not keep it. `scripts/rendered-scope-baseline.json` must stay unchanged, because the new Views' render trees are fully enrolled. | P0 | AC8 | Confirmed (derived, see §5 item 4) |

## 5. Assumptions and open questions

1. **DECIDED — D78-7 (owner, 2026-09-24), two answers.**
   - **Scope.** The question was *"874: removing the legacy ui/PasswordInput means editing
     AdminExchangeProvidersManager. Under GR-1 its render tree becomes in scope … What is 874's scope?"*. The option
     chosen, verbatim: *"Manager subtree (Recommended)"*. The option read: *"Migrate AdminExchangeProvidersManager
     fully to canonical Mantine: table via MantineDataTableToCards (precedent: AdminUsersTable), the form + delete
     dialogs via the canonical Mantine modal pattern, native PasswordInput. It gets its own Story and a manifest
     entry, drops all ui/* imports and AdminTable, and ui/PasswordInput plus its legacy Story are deleted. The rest of
     /admin/currency (page, AdminCurrencyTabs, AdminPageHeader, AdminCurrenciesManager) is filed as task 877."*
   - **Sprint.** The question was *"874 is admin Mantine migration work. Which sprint should it live in?"*. Chosen:
     *"Move to Sprint 78 (Recommended)"*.
   - **Reading of "its own Story".** The owner's option said the manager gets its own Story. Under F6's P0
     container/presentational rule, which the option does not override, that Story belongs to the manager's
     **Views**. The container is exempt under GR-1's container exemption.
2. **Authorized UI change (clause 3/5).** The legacy `AdminTable` opens edit on a **whole-row click** (`onRowClick`).
   `MantineDataTableToCards` has no row-click prop (F5), and its admin precedent (`AdminUsersTable`) has none either.
   Edit stays reachable from two entry points in both layouts:
   - the provider **name**, a button, as today;
   - the **edit** `ActionIcon`.

   The card's decorative `ChevronRight` goes with the row click. The pattern is **not** extended in this task.
3. **Pre-existing behaviours preserved as they are, not fixed here (recorded):**
   - a disabled provider's status badge reads the `disable` key;
   - a `duplicate_name` error shows `error_name_required`;
   - the stored `api_key` is prefilled into the edit form.

   Changing any of them is out of scope.
4. **INFERENCE (R8), from the gate's code read in Task 876:**
   - The changed container maps to the `/admin/currency/page.tsx` surface, which is re-censused.
   - `ui/PasswordInput.tsx` is gone, so its key is stale.
   - Every other `page.tsx` key stays measured. `AdminCurrenciesManager` still imports `badge`/`button`/`dialog`/
     `input`/`label`, `AdminCurrencyTabs` imports `tabs`, and `AdminTable`/`AdminCardList`/`dropdown-menu` are still
     rendered by `AdminCurrenciesManager`. The manager's own tier-1 key stays as container debt.
   - The new Views are manifest roots with enrolled children.

   The post-change graph cannot be simulated before the files exist. §13.2 measures it and has a stop branch.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0 to GR-6, **including GR-1's container exemption**.
- `docs/agent-contract.md`: clauses 3, 5, 7, 9, 10, 11, 14, 16b–16d.
- `docs/component-rules.md`: "Container / Presentational Primitive Split" and "Storybook-First Implementation".
- `docs/mantine-responsive-design-system.md`: native props first; the dialog/bottom-sheet contract.
- `docs/tailadmin-style-reference.md`: §6b, the admin table (inherited from `MantineDataTableToCards`; no new values).
- `docs/admin-ux-rules.md`: the `/admin/currency` rows (F8).
- `docs/storybook-governance.md`: canonical titles, toolbar locale/viewport, no duplicate pages.
- `docs/qa-profiles.md`: the Q3 row.

## 7. Scope

Files the executor may create, change or delete:
- `src/components/admin/AdminExchangeProvidersManager.tsx`: R3
- `src/components/admin/AdminExchangeProvidersView.tsx` *(new)*: R1
- `src/components/admin/ProviderFormDialogView.tsx` *(new)*: R2
- `src/stories/patterns/mantine/AdminExchangeProvidersView.stories.tsx` and
  `src/stories/patterns/mantine/ProviderFormDialogView.stories.tsx` *(new)*: R4
- `scripts/mantine-migration-scope.json`: the two View entries only
- `src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx` *(new)*: R7
- `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`: the one R6 key only
- **Deleted:** `src/components/ui/PasswordInput.tsx`, `src/components/ui/PasswordInput.stories.tsx`,
  `src/components/admin/AdminExchangeProvidersManager.stories.tsx`
- The F8 reference files, each only at the cited row:
  - `scripts/story-realmode-allowlist.json`;
  - `scripts/check-stories-rendered.mjs`;
  - `scripts/i18n-dynamic-manifest.json`;
  - `scripts/governance/tailwind-entropy.allowlist.json`;
  - `docs/component-coverage-matrix.md`;
  - `docs/admin-ux-rules.md`;
  - `docs/component-catalog.md`;
  - `docs/component-risk-register.md`.
- `scripts/surface-census-baseline.json`: R8 (updater only)
- `docs/sessions/2026-09-2?-task874-*.md` and `docs/sessions/evidence/task874/**`
- `docs/backlog.md`: the 874 state cell only

## 8. Out of scope — **877** and elsewhere

- **877:**
  - `src/app/admin/currency/page.tsx`, `AdminCurrencyTabs.tsx`, `AdminPageHeader.tsx`, `AdminCurrenciesManager.tsx`;
  - the shared `AdminTable.tsx`/`AdminCardList.tsx`. After this task, `AdminTable` has five consumers:
    `AdminCurrenciesManager`, `AdminCompaniesManager`, `AdminListingsTable`, `AdminPropertyTypesManager`,
    `AdminSupportManager`.
- **Other:**
  - the `ui/*` primitive files other than `PasswordInput`, which other surfaces consume;
  - the server actions `exchangeProviders.ts`;
  - `MantineDataTableToCards` and `MantineModal`, which are consumed unchanged;
  - `scripts/rendered-scope-baseline.json`;
  - the generated `scripts/governance/reports/*.latest.json`;
  - the three §5 item 3 behaviours.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Providers list ≥640px | shadcn-styled `AdminTable`: Name, Endpoint (md+), Priority, Mode, Enabled, Notes (lg+), actions | `MantineDataTableToCards` table with the same columns; responsive column hiding may follow the pattern (it has no per-column visibility) |
| Providers list <640px | `AdminCardList` cards: name, mode + status badges, priority/endpoint/notes, toggle/delete/chevron | pattern cards (`CardConfig`): title = name button; badge = status; meta = mode, priority, endpoint, notes; actions = toggle, edit, delete `ActionIcon`s |
| Open edit | name click, edit icon, **whole-row click** | name click, edit icon (§5 item 2) |
| Create | "new" button opens the form | unchanged; the button shows Mantine `loading` while an action is pending |
| Form dialog | shadcn Dialog; `Label` + `Input` fields; API key in legacy `PasswordInput` with placeholder `(optional)` (English in every locale); mode as three buttons | `MantineModal` (bottom sheet <640px); `TextInput` fields with labels; native `PasswordInput` with a labelled reveal toggle and a localized placeholder; `SegmentedControl` mode; the same validation toasts |
| Save / cancel | submits via server action, spinner on save | unchanged; `Button loading` |
| Delete | confirm dialog → `deleteExchangeProvider` → toast, row removed | `MantineModal` confirm with the same actions and texts (`common.cancel`, `common.delete`, `delete_confirm`, provider name) |
| Toggle enabled | server action → toast, badge flips | unchanged |
| Empty list | `empty` text | `emptyLabel={t('empty')}` |

## 10. Implementation requirements

### 10.1 I0

1. Record the platform, then save the dirty-tree snapshot and the hash of every modified path:
   `node.exe -p "process.platform + ' ' + process.version"` must print `win32`.
   `git --no-optional-locks status --porcelain`, plus `git hash-object` of every ` M` path, go to
   `01-status-before.txt`.
2. Re-run both F3 censuses **in full** → `02a-census-manager.txt`, `02b-census-page.txt`. The node sets and FAIL sets
   must equal F3.
3. Re-run the F4/F8 reference search → `02c-references.txt`:
   `git --no-optional-locks grep -n -E "ui/PasswordInput|AdminExchangeProvidersManager|adminexchangeprovidersmanager" -- . ":(exclude)docs/sessions" ":(exclude)docs/chat-gpt-reports" ":(exclude)docs/backlog*.md" ":(exclude)tasks"`.
   It must list the F8 rows plus the F2 consumer and the manager's own file and legacy Story. **Every file this task
   creates is untracked when it is searched, so the post-change search in §13.2 uses `--untracked` (the 864 lesson).**
4. Record `FIXTURE_PROVIDERS`' enabled/disabled and mode values (F10) in the session log.

A different result from any step is `PREMISE DRIFT`: stop and report.

### 10.2 GR receipts before the related write

- **GR-0**, one receipt per View:
  - AdminExchangeProvidersView → `COMPOSE`. Owners: `MantineDataTableToCards`, `MantineModal`, `ActionIcon`,
    `Badge`, `Button`, `UnstyledButton`. Token path: `theme.other.iconSize.compact`, `theme.other.touchTarget`,
    the pattern's own tokens.
  - ProviderFormDialogView → `COMPOSE`. Owners: `MantineModal`, `TextInput`, `PasswordInput`, `SegmentedControl`,
    `Button`.

  In both: `new hardcoded visual values: NONE`.
- **GR-3a:**
  - `AdminExchangeProvidersView × {default, empty, pending, delete-confirm}` → `CREATE`. Record the search showing no
    canonical Story imports it. The legacy `Admin/AdminExchangeProvidersManager` is **not** a canonical candidate; it
    is deleted by R5.
  - `ProviderFormDialogView × {new, edit, api-key-revealed, submitting}` → `CREATE`, recorded the same way.
- **GR-3:** `GR-3 STORY PROVEN — AdminExchangeProvidersView ← src/stories/patterns/mantine/AdminExchangeProvidersView.stories.tsx; ProviderFormDialogView ← src/stories/patterns/mantine/ProviderFormDialogView.stories.tsx`.
- **GR-1, at the end**, with node counts from the final `16a` artifact:
  `GR-1 CENSUS COMPLETE — <n> nodes; tier1 2 migrated+enrolled+story (AdminExchangeProvidersView, ProviderFormDialogView) + 1 container-exempt (AdminExchangeProvidersManager — containers AdminExchangeProvidersManager + ProviderFormDialog; D81-2 exemption conditions met); tier2 6 imports removed (button, dialog, input, label, PasswordInput, badge — PasswordInput file deleted); tier3 6 listed and filed as 877 (page.tsx, AdminCurrencyTabs, AdminPageHeader, AdminCurrenciesManager, AdminTable, AdminCardList — still rendered on /admin/currency).`

### 10.3 View contracts

**`AdminExchangeProvidersView` props.** All required unless marked:
- `providers: DBExchangeProvider[]`;
- `isPending: boolean`;
- `deleteTarget: DBExchangeProvider | null`;
- `onNew()`, `onEdit(p)`, `onToggle(p)`, `onRequestDelete(p)`, `onCancelDelete()`, `onConfirmDelete()`;
- `formSlot?: ReactNode`.

What it renders:
- **Rows.** `MantineDataTableToCards` needs a string `id`, so the View maps each provider to a row with a string id and
  keeps the original provider for callbacks. The container API does not change.
- **Action icons.** Each has an `aria-label` from the existing keys `enable`/`disable`/`edit`/`delete`:
  - the toggle uses `ToggleRight`/`ToggleLeft`, as today;
  - status colour comes from a Mantine colour prop (`green`/`gray`), never a class.
- **"New" button.** `Button` with a `Plus` `leftSection` and `loading={isPending}`; it is full width below `sm`.
- **Delete confirmation.** `MantineModal` with title `delete_confirm`, the body the provider name, and a footer with
  `common.cancel` / `common.delete` (`color="red"`, `loading={isPending}`).

**`ProviderFormDialogView` props:**
- `opened`, `isEdit`;
- `values: { name, endpoint, apiKey, interval, priority, mode, notes }`;
- `onFieldChange(field, value)`;
- `apiKeyVisible`, `onApiKeyVisibilityChange`;
- `submitting`, `onSubmit()`, `onClose()`.

Title is `edit`/`new`. The footer holds `cancel` and `save` (`loading={submitting}`).

The `ProviderFormDialog` container owns the 7 field states plus `apiKeyVisible`. It keeps today's `handleSubmit` body
unchanged: the same validation toasts, the same payload and the same `onSaved` object.

### 10.4 Reference updates (R5)

| Reference | Action |
|---|---|
| `story-realmode-allowlist.json:9` | delete the row (its Story is deleted); `check:stories` must pass |
| `check-stories-rendered.mjs:154` | delete the row; **do not run the script** (retired) |
| `i18n-dynamic-manifest.json:36` | `site` → the new file:line |
| `tailwind-entropy.allowlist.json:128` | delete the entry (the file has no `className` left) |
| `component-coverage-matrix.md:25` | `PasswordInput` → `src/stories/mantine/primitives/PasswordInput.stories.tsx` |
| `admin-ux-rules.md:96, :352, :393-394` | describe the migrated state: `MantineDataTableToCards`; `MantineModal` for the form (bottom sheet <640) and the delete confirm |
| `component-catalog.md:107`, `component-risk-register.md:13, :72, :245` | update the row to the migrated state, or remove it where it only describes a resolved legacy defect; record each edit |

### 10.5 T1 — smoke test, observable assertions

Mock these:
- `@/modules/admin/actions/exchangeProviders`: four `vi.fn` resolving `{}` / `{ id: 99 }`;
- `@/lib/toast`.

Render the **real** container with `FIXTURE_PROVIDERS` inside `NextIntlClientProvider` (`en`) +
`MantineProvider theme env="test"` (house pattern: `src/components/layout/__tests__/header-hydration-id-parity.test.tsx`).

Cases:
1. **Create.**
   - Click "New"; the dialog shows.
   - The API-key input has `type="password"`. Its reveal toggle's accessible name is `Show password`; after one
     click, the input has `type="text"` and the toggle's name is `Hide password`.
   - Fill in name and endpoint, then submit. `createExchangeProvider` is called once with `name`, `endpoint_url`,
     `api_key` (the typed value), `refresh_interval_min`, `priority` and `mode`.
2. **Validation.** Submit with an empty name: `toast.error` is called with the `error_name_required` text, and no
   action is called.
3. **Delete.** Click a provider's delete action; the confirm shows the provider name. Confirm:
   `deleteExchangeProvider(<id>)` is called, and the row's name disappears.
4. **Toggle.** Click a provider's toggle: `toggleExchangeProviderEnabled(<id>, !is_enabled)` is called.

**Plants.** Take a hash witness before each plant and after its restore, with the Edit tool; keep each run's
transcript:
- **P1.** In the container, drop `api_key` from the submitted input. Case 1 must fail.
- **P2.** In `ProviderFormDialogView`, remove `visibilityToggleButtonProps`. Case 1's toggle-name assertion must fail.

### 10.6 Rules

- No `className`, `style`, CSS module, raw px/hex, arbitrary utility or allowlist entry in the new or changed files.
  Every visual value comes from Mantine props and theme tokens.
- No new `theme.other` key. If one seems necessary, stop with `CANONICAL STYLE DECISION REQUIRED`.
- UTF-8 without BOM. Use the Edit tool or Node `fs`; never `Get-Content -Raw` without `-Encoding utf8`.
- Every multi-file mechanical write needs a relative-path manifest (clause 14).

## 11. Positive and negative flows

**Positive.** An admin on `/admin/currency` → Providers:
1. clicks "New" and fills in the name, endpoint and an API key (revealing it to check, then hiding it);
2. saves; a success toast appears, and the new row appears;
3. toggles it off, then deletes it after confirming.

| Branch | Applicable | Source | Expected | Evidence |
|---|---:|---|---|---|
| Empty name / endpoint | Yes | F1 `handleSubmit` | error toast, no request | T1 case 2 |
| Server action returns `error` | Yes | F1 | error toast, dialog stays open / row unchanged | preserved code path; inspected in review |
| Double submit | Yes | F1 `isPending` | `Button loading` disables it | Story `Submitting`; code |
| Empty list | Yes | F1 `empty` | `emptyLabel` text | Story `Empty` |
| <640px | Yes | clause 11 | cards; the form and confirm as bottom sheets; controls full width; ≥44px targets | O78-5 at 320/390 |
| Long names / long locale strings | Yes | clause 11 | wrap, no horizontal overflow | O78-5 `uk@320` |
| Authorization | No — the server actions keep their admin guard, unchanged | `exchangeProviders.ts` | — | — |

## 12. Acceptance criteria

- **AC1 [R3]** Given `AdminExchangeProvidersManager.tsx` after the task, when read, then:
  - it has 0 `className`, 0 imports under `@/components/ui/` and no `AdminTable` import;
  - each of its two exported functions renders only its View, apart from the `formSlot` it passes;
  - `handleSubmit`, `handleDelete` and `handleToggle` differ from HEAD only in the setters and props they now pass.
- **AC2 [R1, R2]** Given the two View files, when read, then:
  - they import no server action, `toast`, router or Supabase client;
  - they have 0 `className`/`style`;
  - every control listed in §10.3 is present with its label or `aria-label`.
- **AC3 [R2, R6]** Given `npm.cmd run check:i18n` and `check:i18n-dynamic`, when run, then both exit 0. The new key
  exists in all four locales with the §4 values.
- **AC4 [R3]** Given `AdminCurrencyTabs.tsx`, when its `git status` is read, then it is unmodified, and `typecheck`
  exits 0. The public API is therefore unchanged.
- **AC5 [R4]** Given the two Story files, when read, then each directly imports its View and has exactly the four
  exports named in R4. `check:story-coverage` and `build-storybook` exit 0, and both Views are in the manifest.
- **AC6 [R5]** Given `--untracked` `git grep` for `ui/PasswordInput|admin-adminexchangeprovidersmanager|Admin/AdminExchangeProvidersManager`
  outside the historical folders, when run, then it returns no line. The three deleted paths show as `D`, and
  `check:stories` exits 0.
- **AC7 [R1, R2, R7]** Given T1, when run, then all four cases pass. **P1** makes case 1 fail, and **P2** makes case
  1's toggle-name assertion fail. Both transcripts show `EXIT_CODE=1`, and each post-restore hash equals its pre-plant
  hash.
- **AC8 [R8]** Given `03-baseline-diff.txt`, when read, then it removes exactly the F8 `PasswordInput` key and adds
  none. `03a` refuses no tier-2 block. `check:surface-census:changed --base` and `:verify`, and
  `check:rendered-scope` and `:verify`, exit 0.
- **AC9 [all]** Given the §13.2 block, when run, then:
  - `lint`, `check:file-integrity`, `check:mojibake` and `npm run build` exit 0;
  - the final status lists no path outside §7 beyond those in `01-status-before.txt`;
  - `governance:tailwind` is recorded with its exit code (red at HEAD, F8) and is not asserted.
- **AC10 [Objective] — owner, before approval (O78-5):** the §13.3 matrix.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none. AC1's "0 className / 0 ui imports" is the enforced D81-2 exemption condition, not a pixel absolute; AC6's empty grep uses --untracked because the task creates files (864); AC8's "exactly one key" has a stop branch.`

## 13. QA profile and verification plan

**Q3.** This migrates an admin surface to Mantine, including two overlays. It needs:
- the full visual evidence via the owner matrix;
- the Q1 gates, including the build.

### 13.1 Re-entry

From scratch. Evidence root: `docs/sessions/evidence/task874/`.

### 13.2 Gate block (executor, Windows PowerShell, project root, after every §7 write)

```powershell
$ev = "docs\sessions\evidence\task874"
$base = git --no-optional-locks rev-parse HEAD
node.exe scripts\check-surface-census-changed.mjs --base $base --update-baseline *>&1 | Tee-Object "$ev\03a-census-update-baseline.txt"
git --no-optional-locks diff -- scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json *>&1 | Tee-Object "$ev\03-baseline-diff.txt"
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\10-platform.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx *>&1 | Tee-Object "$ev\11-smoke.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\13-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\14-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\15-story-coverage.txt"
node.exe scripts\check-surface-census.mjs --surface src/components/admin/AdminExchangeProvidersManager.tsx *>&1 | Tee-Object "$ev\16a-census-manager.txt"
node.exe scripts\check-surface-census.mjs --surface src/app/admin/currency/page.tsx *>&1 | Tee-Object "$ev\16b-census-page.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\17-rendered-scope.txt"
npm.cmd run check:rendered-scope:verify *>&1 | Tee-Object "$ev\18-rendered-scope-verify.txt"
node.exe scripts\check-surface-census-changed.mjs --base $base *>&1 | Tee-Object "$ev\19-census-changed.txt"
npm.cmd run check:surface-census:changed:verify *>&1 | Tee-Object "$ev\20-census-changed-verify.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\21-i18n.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\22-i18n-dynamic.txt"
npm.cmd run check:stories *>&1 | Tee-Object "$ev\23-check-stories.txt"
npm.cmd run governance:tailwind *>&1 | Tee-Object "$ev\23b-governance-tailwind.txt"
git --no-optional-locks grep --untracked -n -E "ui/PasswordInput|admin-adminexchangeprovidersmanager|Admin/AdminExchangeProvidersManager" -- . ":(exclude)docs/sessions" ":(exclude)docs/chat-gpt-reports" ":(exclude)docs/backlog*.md" ":(exclude)tasks" *>&1 | Tee-Object "$ev\23c-references-after.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\24-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\25-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\26-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\27-build.txt"
git --no-optional-locks hash-object src/components/admin/AdminExchangeProvidersManager.tsx src/components/admin/AdminExchangeProvidersView.tsx src/components/admin/ProviderFormDialogView.tsx src/stories/patterns/mantine/AdminExchangeProvidersView.stories.tsx src/stories/patterns/mantine/ProviderFormDialogView.stories.tsx src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx scripts/mantine-migration-scope.json scripts/surface-census-baseline.json messages/sq.json messages/en.json messages/uk.json messages/it.json *>&1 | Tee-Object "$ev\28-hash-object.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\29-status-after.txt"
```

After each command, append `"EXIT_CODE=$LASTEXITCODE" | Add-Content <file>`.

Expected results:
- `03a` exits 0 with no tier-2 refusal. `03` removes exactly the F8 `PasswordInput` key; the rendered-scope file is
  absent from it.
- `10` prints `win32`.
- `11` passes.
- `13`–`15` exit 0.
- `16a` lists no `@/components/ui/*` node, no `AdminTable`/`AdminCardList` node and both Views as
  `manifest:yes story:yes`. Its only FAIL line is the container `AdminExchangeProvidersManager.tsx` (exempt, §10.2).
- `16b` exits 1. Its FAIL set is F3's page set **minus** `ui/PasswordInput.tsx`; `AdminExchangeProvidersManager`
  stays, as container debt.
- `17`–`23` exit 0.
- `23b` is recorded with its exit code.
- `23c` is empty (the grep exits 1).
- `24`–`27` exit 0.

**Plants P1/P2, after `27`.** Order: pre-hash → apply the plant (Edit tool) → run → append `EXIT_CODE` → restore →
post-hash. Then re-run `11` as `11b`.

```powershell
$ev = "docs\sessions\evidence\task874"
git --no-optional-locks hash-object src/components/admin/AdminExchangeProvidersManager.tsx *>&1 | Tee-Object "$ev\plant-p1-pre-hash.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx *>&1 | Tee-Object "$ev\plant-p1-run.txt"
"EXIT_CODE=$LASTEXITCODE" | Add-Content "$ev\plant-p1-run.txt"
git --no-optional-locks hash-object src/components/admin/AdminExchangeProvidersManager.tsx *>&1 | Tee-Object "$ev\plant-p1-post-hash.txt"
git --no-optional-locks hash-object src/components/admin/ProviderFormDialogView.tsx *>&1 | Tee-Object "$ev\plant-p2-pre-hash.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx *>&1 | Tee-Object "$ev\plant-p2-run.txt"
"EXIT_CODE=$LASTEXITCODE" | Add-Content "$ev\plant-p2-run.txt"
git --no-optional-locks hash-object src/components/admin/ProviderFormDialogView.tsx *>&1 | Tee-Object "$ev\plant-p2-post-hash.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx *>&1 | Tee-Object "$ev\11b-smoke.txt"
```

Expected results:
- `plant-p1-run`: `EXIT_CODE=1`, case 1 fails.
- `plant-p2-run`: `EXIT_CODE=1`, and case 1 fails on the toggle-name assertion.
- Each post-hash equals its pre-hash and the matching `28` line.
- `11b` passes.

### 13.3 Owner steps (before approval)

1. **O78-5 — `OWNER VISUAL QA REQUIRED`**, toolbar locales `sq`, `en`, `uk`, `it`:

   | Story | States | Viewports | Tuples |
   |---|---|---|---|
   | `Patterns/Mantine/AdminExchangeProvidersView` | `Default`, `Empty`, `Pending`, `DeleteConfirm` | 320, 1440 | 32 |
   | `Patterns/Mantine/ProviderFormDialogView` | `New`, `Edit`, `ApiKeyRevealed`, `Submitting` | 320, 1440 | 32 |

   That is 64 tuples. Record accepted or returned with a concrete defect. At 320, check that there is no horizontal
   overflow, that the form and confirm open as bottom sheets, and that the `uk` strings wrap.
2. **After deploy, on lero.al** (recorded, not an approval gate). As an admin on `/admin/currency` → Providers:
   - create a test provider with an API key, reveal the key, then hide it;
   - toggle the provider, then delete it.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.

Report:
- created, changed and deleted files with their hashes (`28`);
- R1–R8 and AC1–AC9 status (AC10 = `MISSING EVIDENCE`, owed by the owner);
- every §13.2 command with its exit code;
- the I0 artifacts;
- the §10.4 edits, one line each;
- the plant transcripts and hashes;
- the GR-0, GR-3a, GR-3 and GR-1 receipts;
- deviations and limitations.

Update the 874 backlog state cell. Write the session log with a Files Changed table.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — facts cited by file:line, D78-7 verbatim, View contracts in §10.3, commands in §13.2 |
| GR-1 | full design-time census of both surfaces (F3); tier-1 subtree migrated; the page siblings listed and filed as 877 in the same design session; `AdminTable`/`AdminCardList` leave this subtree and remain 877's |
| Container / View split | P0 rule applied (F6); the containers are exempt by GR-1's conditions, enforced by AC1 |
| Canonical owners | every visual piece has an inspected canonical owner (F5); no new token or pattern; `MantineDataTableToCards` and `MantineModal` are consumed unchanged |
| Deletion audit | the live reference set is measured (F8); the post-change grep uses `--untracked` (864) |
| Two-armed control | P1 (payload) and P2 (toggle label), transcripts kept |
| Detector blind spots stated | `governance:tailwind` is red at HEAD and only recorded; `check-stories-rendered.mjs` is retired, so its row is edited but it is not run; R8's post-change census cannot be simulated in advance and has a stop branch |
| Behaviour changes authorized | the whole-row click is dropped (§5 item 2); three pre-existing oddities are preserved and named (§5 item 3) |
