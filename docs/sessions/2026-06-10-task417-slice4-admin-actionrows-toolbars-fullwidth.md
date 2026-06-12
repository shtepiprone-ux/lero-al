# Task 417 — Slice 4: Admin Action Rows / Toolbars / `New` Buttons Full-Width (§26.1)

**Date:** 2026-06-10
**Executor:** Sonnet 4.6
**Task file:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_417_Slice4_AdminActionRowsToolbars_FullWidth.md`

---

## Scope

Slice 4 = the work explicitly fenced OUT of Slices 2/3: §26.1 full-width hand-rolled
action rows, toolbars, filter clusters, and `New`/pagination controls on the same 5
admin data surfaces Slice 3 touched:

- `AdminExchangeProvidersManager`
- `AdminSupportManager`
- `AdminUsersTable`
- `AdminEmailTemplatesManager`
- `AdminUserProfile`

Out of scope (not touched): primitives (`button.tsx`, `dialog.tsx`, `tabs.tsx`,
`AdminTable.tsx`, `AdminCardList.tsx`, `ui/*`), data-surface/column/card changes
(Slice 3, done), new behavior/handlers/controls/locale strings, admin shell surfaces
(`AdminPageShell`/`AdminSettings`/`AdminSidebar`/`AdminLayout`/`AdminMobileHeader` —
deferred to new "Slice 4b").

Two facts that defined the approach:

1. `<DialogFooter>` (`src/components/ui/dialog.tsx`) is already
   `flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end` →
   already §26.1-compliant. **VERIFY-ONLY, never edited.**
2. The text `Button` primitive already carries `max-sm:w-full max-sm:min-h-11` on
   every label-bearing size (`xs/sm/default/lg/xl/tab`). The fix is on the
   **container**, not individual buttons.

---

## Part 1 — Before/After Layout Inventory (5 surfaces)

### `AdminExchangeProvidersManager.tsx`

| Control | Before | After |
|---|---|---|
| `ProviderFormDialog` action row (~line 143) | `flex justify-end gap-3 pt-2` | `flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2` |
| `New provider` toolbar (~line 306) | `flex justify-end` | `flex sm:justify-end` |
| Delete confirm `<DialogFooter className="gap-2">` (~line 295) | — | VERIFY-ONLY, not edited |

0 handlers/controls/strings changed. At ≥640 both rows render identically (the
"Cancel/Save"-style row was already a single button row at desktop widths so
`sm:flex-row sm:justify-end sm:gap-3` reproduces the prior `flex justify-end gap-3`
exactly; the toolbar's single `New` button is unaffected by `sm:justify-end` since
`flex` already defaulted to row).

### `AdminSupportManager.tsx`

| Control | Before | After |
|---|---|---|
| Status-change row (~line 353) | `flex flex-wrap gap-2` | `flex flex-col gap-2 sm:flex-row sm:flex-wrap` |
| Main toolbar (~line 780) | `flex items-center gap-3 flex-wrap` | `flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3 [&>*]:max-sm:w-full` |
| `New ticket` button (~line 817) | `className="ml-auto gap-1.5"` | `className="sm:ml-auto gap-1.5"` |
| Filter-chip groups (~782/~800), standalone status-update button (~377), Create dialog `<DialogFooter>` (~637) | — | VERIFY-ONLY, not edited |

0 handlers/controls/strings changed. At ≥640 `sm:flex-row sm:items-center sm:flex-wrap
sm:gap-3` reproduces `flex items-center gap-3 flex-wrap`; `sm:ml-auto` reproduces
`ml-auto` for the `New ticket` button positioning.

### `AdminUsersTable.tsx`

| Control | Before | After |
|---|---|---|
| Role filter row (~line 296) | `flex gap-2 flex-wrap` | `flex gap-2 flex-wrap [&>*]:max-sm:w-full` |
| Status filter row (~line 321) | `flex gap-2 flex-wrap` | `flex gap-2 flex-wrap [&>*]:max-sm:w-full` |
| Pagination row (~line 400) | `flex items-center justify-center gap-2` | `flex flex-col items-center gap-2 sm:flex-row sm:justify-center` |
| Tabs list (~line 236, `<Button size="tab">`) | — | VERIFY-ONLY (already `max-sm:w-full max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` via `button.tsx` `tab` size; container `flex flex-wrap ... w-full` stacks each tab full-width at <640) |

0 handlers/controls/strings changed. The role/status filter rows contain raw
`<button>` elements (not the `Button` component), so they don't inherit
`max-sm:w-full` from the primitive — `[&>*]:max-sm:w-full` on the container fixes
this without touching each button. At ≥640 `[&>*]:max-sm:w-full` has no effect
(only applies `<640`), and `sm:flex-row sm:justify-center` reproduces
`items-center justify-center` for the pagination row.

### `AdminEmailTemplatesManager.tsx`

| Control | Before | After |
|---|---|---|
| `HtmlPreview` trigger button (~line 56) | `className="gap-1.5 shrink-0 max-sm:w-auto"` | `className="gap-1.5 sm:shrink-0"` |
| HTML-body label/Preview row (~line 222) | `flex items-center justify-between` | `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between` |
| Main toolbar (~line 370) | `flex items-center gap-3 flex-wrap` (Search input `flex-1`, `New template` `className="gap-1.5 shrink-0"`) | `flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3 [&>*]:max-sm:w-full` (Search input unchanged, `New template` `className="gap-1.5 sm:shrink-0"`) |
| `TemplateEditorDialog` `<DialogFooter className="gap-2">` (~line 266), `DeleteConfirmDialog` `<DialogFooter className="gap-2">` (~line 313) | — | VERIFY-ONLY, not edited |
| Template-list row actions: edit `Pencil` (~447), delete `Trash2` (~457), both `size="icon" variant="ghost"` | — | §26.4 icon-only exempt, not touched |

0 handlers/controls/strings changed. At ≥640: `sm:shrink-0` reproduces `shrink-0`;
`sm:flex-row sm:items-center sm:justify-between` reproduces `flex items-center
justify-between`; `sm:flex-row sm:items-center sm:flex-wrap sm:gap-3` reproduces
`flex items-center gap-3 flex-wrap`.

### `AdminUserProfile.tsx`

**0 edits — fully VERIFY-ONLY**, confirmed compliant as-is:

| Control | Status |
|---|---|
| `UnsavedChangesDialog`, `CancelConfirmDialog`, `DeactivateReasonDialog`, `ReactivateReasonDialog`, `DeleteConfirmDialog` — all `<DialogFooter>` (~176/197/234/279/320) | VERIFY-ONLY, already §26.1-compliant |
| Sidebar action cluster, view mode (~641-668): `<div className="flex flex-col gap-2">` containing `<Button ... className="... w-full justify-start">` | Already `w-full` at all breakpoints (sidebar always narrow) |
| Sidebar Save/Cancel cluster, edit mode (~701-720): `<div className="flex flex-col gap-2">` containing two `<Button ... className="... w-full">` | Already `w-full` at all breakpoints |

Confirmed via Grep for `actions\.save|actions\.cancel|sticky|bottom-0` across the
whole 1105-line file: only the one edit-mode cluster matches, already inspected.
0 handlers/controls/strings changed (because 0 lines changed).

---

## Part 2 — `<DialogFooter>` Verify-Only + §26.4 Icon-Only Exemptions

### `<DialogFooter>` instances across the 5 surfaces (all VERIFY-ONLY, none edited)

| Surface | Location | Footer content |
|---|---|---|
| `AdminExchangeProvidersManager` | ~line 295 (delete confirm) | Cancel / Delete buttons |
| `AdminSupportManager` | ~line 637 (create ticket dialog) | Cancel / Create buttons |
| `AdminEmailTemplatesManager` | ~line 266 (`TemplateEditorDialog`) | Cancel / Save buttons |
| `AdminEmailTemplatesManager` | ~line 313 (`DeleteConfirmDialog`) | Cancel / Delete buttons |
| `AdminUserProfile` | ~line 176 (`UnsavedChangesDialog`) | Stay / Leave buttons |
| `AdminUserProfile` | ~line 197 (`CancelConfirmDialog`) | Stay / Discard buttons |
| `AdminUserProfile` | ~line 234 (`DeactivateReasonDialog`) | Cancel / Deactivate buttons |
| `AdminUserProfile` | ~line 279 (`ReactivateReasonDialog`) | Cancel / Reactivate buttons |
| `AdminUserProfile` | ~line 320 (`DeleteConfirmDialog`) | Cancel / Delete buttons |

All inherit `flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end`
from `dialog.tsx` — full-width stacked (reverse order, primary action on top) at
`<640`, right-aligned row at `≥640`. Primitive untouched.

### §26.4 icon-only/compact exemptions relied upon

| Surface | Control | Why exempt |
|---|---|---|
| `AdminExchangeProvidersManager` | provider-list row actions (edit/delete, `size="icon"`) | icon-only, §26.4 |
| `AdminEmailTemplatesManager` | template-list row actions: edit `Pencil` (~447), delete `Trash2` (~457), both `size="icon" variant="ghost"` | icon-only, §26.4 |
| `AdminUsersTable` | (none new — column actions handled in Slice 3) | n/a |
| `AdminSupportManager` | (none new) | n/a |
| `AdminUserProfile` | (none new) | n/a |

---

## Part 3 — `AdminEmailTemplatesManager` line ~56 Resolution

The kickoff flagged the `HtmlPreview` trigger button
(`className="gap-1.5 shrink-0 max-sm:w-auto"`) as the one genuinely ambiguous item,
with a decision tree: if the control is icon-only → keep `max-sm:w-auto` (§26.4
exempt); if it's a label-bearing CTA → §26.1 FAIL, remove the override.

**Resolution:** the button renders an `Eye` icon **and** the text label "Preview"
(`t('preview')`/locale-equivalent) — it is label-bearing, not icon-only. Classified
as **§26.1 FAIL** → `max-sm:w-auto` removed:

```diff
-      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 shrink-0 max-sm:w-auto">
+      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 sm:shrink-0">
```

Removing the override means this button now inherits `max-sm:w-full` from the
`Button` primitive's `sm` size. Its parent row (~line 222, the "HTML body" `Label` +
`HtmlPreview` button) was `flex items-center justify-between` — a non-wrapping row
that would visually collide once the button became full-width at `<640`. Required
follow-on edit:

```diff
-                  <div className="flex items-center justify-between">
+                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Label htmlFor={`body-${loc}`}>{t('field_html_body')}</Label>
                      {d.html_body.trim() && (
```

At `≥640` `sm:flex-row sm:items-center sm:justify-between` reproduces
`flex items-center justify-between` exactly — desktop unchanged.

---

## Part 4 — `responsive-storybook-inventory.md` §5 Reconciliation

The pre-existing "Slice 4" entry (admin-shell scope: `AdminPageShell`,
`AdminSettings`, `AdminUserAvatar`, `AdminSidebar`, `AdminLayout`,
`AdminMobileHeader`) was renamed to reflect the actual 5 data surfaces this task
covers, and a new **"Slice 4b — Admin shell + action buttons full-width (§26.1)"**
row was added carrying the original admin-shell scope forward (not implemented in
this task — tracked as a future follow-up).

```diff
-### Slice 4 — Admin shell + action button full-width (§26.1)
-
-**Stories in scope:** AdminPageShell, AdminSettings, AdminUserAvatar (edit mode), AdminSidebar (mobile drawer), AdminLayout (toolbar), AdminMobileHeader
-**Phase-1 contracts enforced:** §26.1 (button full-width at `<640`), §12b
-**Action:** verify and fix action buttons in admin shells not covered by existing `[&>*]:max-sm:w-full` patterns
-**Dependencies:** Slice 1
-**Estimated diff size:** SMALL-MEDIUM
+### Slice 4 — Admin data surfaces — action rows/toolbars/`New` buttons full-width (§26.1)
+
+**Stories in scope:** AdminExchangeProvidersManager, AdminSupportManager, AdminUsersTable, AdminEmailTemplatesManager, AdminUserProfile
+**Phase-1 contracts enforced:** §26.1 (button full-width at `<640`), §12a/§12b
+**Action:** stack/full-width hand-rolled action rows, toolbars, filter clusters, and `New`/pagination controls on the 5 admin data surfaces (`<DialogFooter>` instances verify-only — already §26.1-compliant)
+**Dependencies:** Slice 3
+**Estimated diff size:** SMALL-MEDIUM (Task 417)
+
+### Slice 4b — Admin shell + action buttons full-width (§26.1)
+
+**Stories in scope:** AdminPageShell, AdminSettings, AdminUserAvatar (edit mode), AdminSidebar (mobile drawer), AdminLayout (toolbar), AdminMobileHeader
+**Phase-1 contracts enforced:** §26.1 (button full-width at `<640`), §12b
+**Action:** verify and fix action buttons in admin shells not covered by existing `[&>*]:max-sm:w-full` patterns
+**Dependencies:** Slice 1
+**Estimated diff size:** SMALL-MEDIUM
```

---

## Part 5 — Rendered Evidence Matrix (336/336 PASS)

New script: `scripts/task417-qa-actionrows.mjs` — 14 viewports
(`mobile-320/375/390/480`, `canonical-560/680/810/960/1200`, `tablet-768`,
`desktop-1024/1440`, `huge-1920/2560`) × 4 locales (`sq/en/uk/it`) × 6 stories
(the 5 surfaces + `AdminUserProfile/CreateMode` for the edit-mode Save/Cancel
cluster) = 336 cells.

For each cell: confirms no render failure, no horizontal overflow, and — where the
target container is found — that direct-child controls are full-width (within
4px tolerance) at `<640` (and at all widths for the always-`w-full` `AdminUserProfile`
sidebar clusters), while remaining unchanged at `≥640`.

Two runs:

- `.screenshots/task417-qa/2026-06-10T19-05/manifest.json` — 280/336 PASS for the
  5 main stories (all 280 cells PASS, `target.found=true` throughout); the 56
  `AdminUserProfile/CreateMode` cells errored due to a wrong story id
  (`admin-adminuserprofile--createmode` vs the correct
  `admin-adminuserprofile--create-mode`).
- `.screenshots/task417-qa/2026-06-10T19-14/manifest.json` — re-run of just
  `AdminUserProfile/CreateMode` (via `TASK417_STORY_FILTER` env var) with the
  corrected story id: 56/56 PASS.

**Combined: 336/336 PASS.**

uk@320/375/390 PNGs (mandatory per §27) saved in both manifest directories, e.g.:
- `.screenshots/task417-qa/2026-06-10T19-05/admin-adminexchangeprovidersmanager--default__uk__mobile-320.png`
- `.screenshots/task417-qa/2026-06-10T19-05/admin-adminsupportmanager--default__uk__mobile-375.png`
- `.screenshots/task417-qa/2026-06-10T19-05/admin-adminuserstable--default__uk__mobile-390.png`
- `.screenshots/task417-qa/2026-06-10T19-05/admin-adminemailtemplatesmanager--default__uk__mobile-320.png`
- `.screenshots/task417-qa/2026-06-10T19-05/admin-adminuserprofile--default__uk__mobile-375.png`
- `.screenshots/task417-qa/2026-06-10T19-14/admin-adminuserprofile--create-mode__uk__mobile-390.png`

(full set: 6 stories × 3 mobile viewports × `uk` = 18 PNGs across the two directories)

---

## Part 6 — Validation + File-Integrity Transcripts

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean, 0 new errors |
| `npm run lint` | Clean, 0 new warnings/errors |
| `npm run check:stories` | PASS |
| `npm run check:i18n` | PASS |
| `npm run check:story-coverage` | PASS |
| `npm run check:design-tokens` | PASS |
| `npm run build-storybook` | Builds, exit 0 |
| `npm run screenshots:assert` | NOT run by executor — owner-run per clause 14. **Owner ran natively ×2 → NOT clean (blank-canvas flakes). See Part 6b. Full 2520/2520 NOT achieved.** |
| `npm run check:locale-leak` | 221 baseline (matches prior `.screenshots/locale-leak/2026-06-10T18-01/report.json`), 0 new — Task 417 made 0 locale-string changes |
| File integrity (4 edited `.tsx` files: `AdminExchangeProvidersManager.tsx`, `AdminSupportManager.tsx`, `AdminUsersTable.tsx`, `AdminEmailTemplatesManager.tsx`) | 0 NUL bytes, no BOM (checked via raw byte read), `tsc --noEmit` clean (covers syntax), tails re-read clean |

Custom 14×4×6 rendered evidence: **336/336 PASS** (Part 5).

---

## Part 6b — Owner-native `screenshots:assert` runs (clause 14) — NOT CLEAN

The full gate did **NOT** reach 2520/2520. Two owner-native runs, both with non-deterministic
blank-canvas FAILs. Recorded verbatim:

| Run | Result | Failed cells | failReason | pageErrors | consoleErrors |
|---|---|---|---|---|---|
| 1 | 2518/2520 PASS, 2 FAIL | `Input/Default × sq × desktop-1024`; `AdminSidebar/Desktop × it × huge-2560` | blank-canvas | none | none |
| 2 | 2519/2520 PASS, 1 FAIL | `AdminExchangeProvidersManager/Default × en × desktop-1024` | blank-canvas | none | none |
| 3 | 2518/2520 PASS, 2 FAIL | `AdminPageShell/Default × sq × desktop-1440` (chunk-load); `AdminTable/Default × sq × canonical-1200` (blank-canvas) | chunk-load / blank-canvas | none | none |

**Orchestrator classification: recurring blank-canvas rendered-harness instability — NOT a Task 417
product-code regression.** Evidence:

1. **Non-deterministic** — **5 distinct flaky cells across 3 runs, never repeating** (a real layout
   regression fails the *same* cell every time).
2. **`blank-canvas` with no `pageErrors`/`consoleErrors`** — the Storybook iframe did not paint before
   the screenshot was captured (render race / timeout), not a content or layout defect.
3. **2 of the 3 failing cells are on surfaces Task 417 never touched** (`Input` primitive, `AdminSidebar`
   shell). A 417 change cannot regress those.
4. **All 3 fail at `≥640` widths** (`desktop-1024`, `huge-2560`) — exactly the band where every 417 change
   is `sm:`-gated to reproduce the prior layout byte-for-byte (confirmed in the diff; orchestrator review
   = clean). A 417-introduced mobile (`<640`) regression could not surface only at `≥640`.
5. **Consistent with this rework's history** — the same harness produced transient FAILs on Task 416
   (`FilterBar` chunk-load, cleared on rerun) and Task 414 (`Sheet` chunk-load, `ERR_NO_BUFFER_SPACE`).

**Resolution (2026-06-11) — Path 1 attempted then Path 2 accepted.** Per the owner's choice, one more
clean owner-native rerun was attempted (Run 3 above) — it flaked **again** on yet another pair of
untouched-surface `≥640` cells (chunk-load + blank-canvas). With 3 consecutive non-clean runs and 5
distinct, never-repeating flaky cells — **none of which is a `<640` overflow/layout failure on a 417
surface** — the owner's pre-authorised fallback to Path 2 is invoked:

**Task 417 is APPROVED on the basis of (a) a clean orchestrator diff review** (container-only,
`sm:`-gated, `≥640` provably unchanged, 0 handlers/controls/strings), **(b) the focused 336/336 §26.1
matrix** (all 5 surfaces full-width at `<640`, mandatory uk@320/375/390 PNGs), **and (c) the explicit
classification above that the `screenshots:assert` FAILs are recurring blank-canvas/chunk-load
rendered-harness instability, NOT a product-code regression.** This is an explicit orchestrator/owner
acceptance, recorded here per the rendered-evidence gate's clause-14-style "harness artifact, not a real
defect" doctrine. The full-gate 2520/2520 number was **not** achieved and is **not** claimed as clean.

**Mandatory follow-up filed: Task 418 — rendered-harness stabilisation** (retry-on-blank-canvas /
retry-on-chunk-load before marking a cell FAIL; iframe paint/readiness wait; stable static-server
serving) — **Slice 6a / harness-stabilisation prerequisite** (a precursor to Slice 6, NOT its completion: Slice 6 also adds NEW DOM assertions for button full-width + popup bottom-sheet, which 418 does not). Kickoff:
`tasks/Sprints/Sprint_35_kickoff_prompt_Task_418_RenderedHarnessStabilisation.md`. Until 418 lands,
treat any `blank-canvas` / "Failed to fetch dynamically imported module" FAIL as a suspected flake:
rerun; only a deterministic, same-cell, error-bearing or `<640`-overflow FAIL is a real defect.

---

## Part 7 — Files Changed

| File | Rationale |
|---|---|
| `src/components/admin/AdminExchangeProvidersManager.tsx` | §26.1: stack `ProviderFormDialog` action row, full-width `New provider` toolbar at `<640` |
| `src/components/admin/AdminSupportManager.tsx` | §26.1: stack status-change row + main toolbar, `sm:ml-auto` on `New ticket` button |
| `src/components/admin/AdminUsersTable.tsx` | §26.1: `[&>*]:max-sm:w-full` on role/status filter rows (raw `<button>`s), stack pagination row |
| `src/components/admin/AdminEmailTemplatesManager.tsx` | §26.1: resolve `HtmlPreview` button as label-bearing CTA (remove `max-sm:w-auto`), stack its parent row, stack main toolbar |
| `docs/responsive-storybook-inventory.md` | §5: rename Slice 4 to the 5 data-surface scope actually covered by Task 417; add Slice 4b carrying forward the original admin-shell scope |
| `scripts/task417-qa-actionrows.mjs` | New rendered-evidence script: 14×4×6 = 336-cell matrix proving full-width §26.1 containers at `<640` and pixel-identical layout at `≥640` |

`AdminUserProfile.tsx` — **not in this table, 0 edits** (fully verify-only, see Part 1).

---

## Part 8 — Confirmations

- ✅ No primitive edited: `button.tsx`, `dialog.tsx` (incl. `DialogFooter`), `tabs.tsx`,
  `AdminTable.tsx`, `AdminCardList.tsx`, `ui/*` all untouched.
- ✅ No data-surface/column/card change (Slice 3 scope untouched).
- ✅ No story deleted or duplicated.
- ✅ 0 handlers/controls/locale strings changed — layout (Tailwind class) edits only.
- ✅ No git commands emitted by the executor (orchestrator emits commit commands per
  `docs/agent-contract.md` clause 10 / `docs/orchestrator-role.md`).
