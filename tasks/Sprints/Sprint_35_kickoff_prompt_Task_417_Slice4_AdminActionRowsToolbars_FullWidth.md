# Sprint 35 — Task 417 — Slice 4 of the Global Responsive Rework: §26.1 full-width action-rows / toolbars / `New` buttons on the 5 admin data surfaces

**Type:** Admin table / admin control (PRODUCT CODE) — Slice 4 of the Task 412 phased plan
**Executor:** Sonnet 4.6
**Status:** OPEN — hand off now (Slice 3 = Task 416 ✅ committed; gate 2520/2520, locale-leak baseline 221)
**Created by:** orchestrator, 2026-06-10, after Slice 3 closed
**Reviewer:** Opus 4.7 orchestrator (rendered + diff review; does not write product code)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST**, then the Admin-table pre-read bundle below. For ambiguity, follow **Task 412 P0 Addendum A7**: do not invent; do not halt the whole slice for one surface — mark it OPEN DECISION and continue — halt only if continuing would require an out-of-scope edit or weakening a P0 rule.

---

## What this slice is (and is NOT)

Slice 4 of the §18-compliant plan. It applies the **§26.1 mobile full-width contract** to the **action-rows, toolbars, filter rows, and `New` buttons** of the **same 5 admin data surfaces** Slice 3 touched:
`AdminExchangeProvidersManager`, `AdminSupportManager`, `AdminUsersTable`, `AdminEmailTemplatesManager`, `AdminUserProfile`.

This is the work that was **explicitly fenced OUT of Slices 2 and 3** — including the `ProviderFormDialog` action row that was changed in Task 414 and **rolled back** with "§26.1 stays deferred to Slice 4". **Slice 4 is where that stacking is now authorised.**

### 🔑 The two facts that define the scope (verified by the orchestrator in the live files)

1. **The `DialogFooter` primitive ALREADY mobile-stacks.** `src/components/ui/dialog.tsx` → `DialogFooter` = `flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end`. So **every `<DialogFooter>` usage is already §26.1-container-compliant** and its text buttons already inherit `max-sm:w-full` from the Button primitive. **`<DialogFooter>` footers are VERIFY-ONLY — do NOT edit them, and NEVER edit the primitive.**
2. **The text `Button` primitive ALREADY carries `max-sm:w-full max-sm:min-h-11`** on every label-bearing size (`xs/sm/default/lg/xl`). So you almost NEVER add `max-sm:w-full` to an individual button. **The fix is on the CONTAINER**, not the button: make the row stack at `<640` and restore the desktop row at `≥640`.

**So Slice 4 = fix the CONTAINERS of hand-rolled (non-`DialogFooter`) action rows + toolbars + filter rows so their already-full-width buttons stack edge-to-edge at `<640` and look identical to today at `≥640`.**

### Canonical container patterns (use these — no invention)

- **Hand-rolled action row** (Cancel/Save/Delete not in a `DialogFooter`): `flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3` (was `flex justify-end gap-3`). The buttons inherit `max-sm:w-full` from the primitive; the container just stops forcing a single row at `<640` and restores `sm:justify-end` at `≥640`.
- **Toolbar / filter cluster** (a `New` button and/or filter chips in a row): put `[&>*]:max-sm:w-full` on the container and switch it to `flex flex-col gap-2 sm:flex-row sm:items-center` at `<640`; drop `ml-auto` / `shrink-0` to `sm:ml-auto` / `sm:shrink-0` so they don't fight full-width at mobile.
- **Desktop (`≥640`) layout MUST be pixel-identical to today.** Every change is gated behind `sm:` — if a screenshot at 768/1024/1440 differs from current, that is a regression.

**🚫 NOT in scope — do NOT pull these in:**
- **No primitive edits** (`button.tsx`, `dialog.tsx`/`DialogFooter`, `tabs.tsx`, `AdminTable.tsx`, `AdminCardList.tsx`, `ui/*`). Consume them; if one looks wrong, STOP & ASK.
- **No data-surface / column / card changes** (that was Slice 3 — done & committed). Touch only toolbar/action-row/filter/`New`-button containers.
- **No icon-only control changes (§26.4 exemption).** The card/cell row-action ghost icon buttons (toggle / edit-pencil / trash) stay icon-only and compact — they are NOT made full-width. Each icon-only exemption you rely on must be listed in the session log.
- **No new behavior / handlers / controls.** Every `onClick`, every control, every state stays exactly as Slice 3 left it (Note 20 / Note 22). This is a layout-class-only slice.
- **No locale/string changes** expected (no new copy).
- Admin **shell** surfaces (AdminPageShell / AdminSettings / AdminSidebar / AdminLayout / AdminMobileHeader) — see "Scope reconciliation" below; they are a SEPARATE follow-up slice, NOT this one.

### Scope reconciliation (orchestrator note — do not act beyond it)

`docs/responsive-storybook-inventory.md §5` originally labelled "Slice 4" as the admin-**shell** §26.1 surfaces. The owner re-scoped the running plan so **Slice 4 = §26.1 for the 5 Slice-3 DATA surfaces** (this file). As part of this task, **update `responsive-storybook-inventory.md §5`** to: (a) rename this row to reflect the 5 data surfaces, and (b) add a new **"Slice 4b — Admin shell + action buttons (§26.1)"** row carrying the original AdminPageShell/AdminSettings/AdminSidebar/AdminLayout/AdminMobileHeader scope so it is not lost. Do not implement Slice 4b here.

---

## Pre-read (per `docs/rule-index.md` — Admin table / admin control)

**Always required:** `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.
**Required:**
- `docs/design-system.md` — **§26.1** (full-width control table — the contract for this slice), **§26.4** (icon-only exemption), **§12a/§12b** (`[&>*]:max-sm:w-full` container pattern + primitive full-width), **§26.5** (mobile full-width PASS/FAIL), **§26.6** (owner-approved exceptions — do not re-litigate).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md`, `docs/qa-rules.md`.
- `docs/ai-behavior.md` → **Note 20 "Existing-Control Preservation"** + **Note 22 "Admin Table Preservation Rule"**.
- `docs/responsive-storybook-inventory.md` — **§5** (the slice plan you will update) + **§7** (`--tablet`/mobile story IDs for the 5 surfaces).
- **Reference:** `AdminUserProfile.tsx` sidebar action cluster (lines ~642–665) and main edit bar (lines ~703–717) already use `w-full` button stacks — the worked target shape.

Do not read beyond this set.

---

## Current behavior to preserve (Note 20 / Note 22 — mandatory before/after inventory in the session log)

A **before/after layout inventory per surface** listing every action-row / toolbar / filter / `New` button, its current container classes, and the new container classes — proving **0 controls and 0 handlers changed**, only container layout classes. Known surfaces the orchestrator already located (verify + complete from the live files):

**AdminExchangeProvidersManager.tsx**
- **`ProviderFormDialog` action row, line ~143** — `flex justify-end gap-3 pt-2` (Cancel + Save). **Hand-rolled, NOT a `DialogFooter`.** → stack: `flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2`. *(This is the Task-414 rolled-back row — now authorised.)*
- **Delete dialog, line ~295** — `<DialogFooter className="gap-2">` → **VERIFY-ONLY** (primitive already stacks).
- **`New` toolbar, line ~306** — `flex justify-end` with `<Button onClick={openNew} size="sm">`. → container `flex sm:justify-end` (so the single full-width `New` button fills `<640`; right-aligned at `≥640`). Confirm the New button fills width at 320.

**AdminSupportManager.tsx**
- **Top filter/`New` toolbar, line ~780** — `flex items-center gap-3 flex-wrap` containing two filter-chip groups (lines ~782, ~800) and a `New ticket` button (line ~817, `size="sm" className="ml-auto gap-1.5"`). → `flex flex-col gap-2 sm:flex-row sm:items-center` + move `ml-auto`→`sm:ml-auto`; each filter group + the New button full-width at `<640`, current row at `≥640`.
- **Filter-chip groups, lines ~782/~800** — `flex gap-1.5 flex-wrap`. Decide per §26.1: chips either full-width stacked or a tidy full-width wrap; no h-scroll at 320, labels wrap.
- **Detail status-action row, lines ~353/~377** — `flex flex-wrap gap-2` (status update buttons). → stack full-width at `<640`.
- **Create dialog, line ~637** — `<DialogFooter className="gap-2">` → **VERIFY-ONLY.**

**AdminUsersTable.tsx**
- **Tabs list, line ~236** — `flex flex-wrap md:flex-nowrap gap-1 bg-muted rounded-xl p-1 w-full md:w-fit`. Already `w-full` at mobile; **verify each tab trigger fills** and labels wrap (sq/en/uk/it). Fix only if a trigger is content-width at `<640`.
- **Filter rows, lines ~296/~321** — `flex gap-2 flex-wrap` (role/status/location-request Selects/controls). → `[&>*]:max-sm:w-full` so each filter control is full-width at `<640`; current row at `≥640`.
- **Pagination row, lines ~401–403** — `prev_page` / `next_page` outline `size="sm"`. → stack/​full-width container at `<640`, restore at `≥640` (keep disabled-state logic intact).

**AdminEmailTemplatesManager.tsx**
- **Toolbar, line ~370** — `flex items-center gap-3 flex-wrap` + `New` button (line ~380, `className="gap-1.5 shrink-0"`). → `flex flex-col gap-2 sm:flex-row sm:items-center`, `shrink-0`→`sm:shrink-0`.
- **Editor dialog footer (line ~266) + Delete dialog footer (line ~313)** — `<DialogFooter>` → **VERIFY-ONLY.**
- **⚠️ Line ~56** — a button with explicit `max-sm:w-auto` (opts OUT of full-width). **INVESTIGATE:** if it is a label-bearing CTA it is a §26.1 FAIL and must lose `max-sm:w-auto`; if it is a legitimately compact/icon-style control, document it as a §26.4 exemption. **If genuinely ambiguous → STOP & ASK** (do not guess).
- Template-list row-action buttons (lines ~447/~457) — icon/compact row actions → §26.4 exempt; verify, do not widen.

**AdminUserProfile.tsx**
- **All dialog footers** (UnsavedChanges line ~176, Cancel ~197, Deactivate ~234, Reactivate ~279, Delete ~320) — `<DialogFooter>` → **VERIFY-ONLY** (already stack).
- **Sidebar action cluster, lines ~642–665** — `flex flex-col gap-2` with `w-full justify-start` buttons → **already compliant; verify only.**
- **Main edit save/cancel bar, lines ~703–717** — buttons already `w-full`; **verify the wrapping container stacks at `<640` and is unchanged at `≥640`** (if the container already does this, mark verify-only; if buttons are `w-full` inside a non-stacking row, fix the container only).

**Required after-behavior:** at `<640` every label-bearing action button / toolbar control / filter control on these surfaces is full-width edge-to-edge, ≥44px, labels wrap (sq/en/uk/it), no h-scroll at 320, stacked (no cramped side-by-side); at `≥640` the layout is **pixel-identical to today** (`sm:` restores the current row). Icon-only card/cell row actions remain compact (§26.4). **0 handlers, 0 controls, 0 strings changed.**

---

## Positive flow (happy path)

1. Read the pre-read set + the `AdminUserProfile` reference clusters.
2. Inventory each of the 5 surfaces (before-state container classes for every action row / toolbar / filter / `New` button) in the session log.
3. Apply the canonical container patterns to the **hand-rolled** rows + toolbars + filter rows only; leave `<DialogFooter>` and all primitives untouched (verify-only).
4. Resolve the `AdminEmailTemplatesManager` line ~56 `max-sm:w-auto` (fix as FAIL, or document as §26.4 exemption, or STOP & ASK).
5. Confirm icon-only row actions stay exempt (§26.4) — list each exemption.
6. Update `docs/responsive-storybook-inventory.md §5` (rename this row to the 5 data surfaces + add Slice 4b shell row).
7. Run the full validation set; `screenshots:assert` stays at **2520/2520, 0 new FAIL, no error screens**; `check:locale-leak` stays at the **221 baseline, 0 new** (no new strings expected).
8. Update `docs/backlog.md` + write the session log (before/after layout inventory per surface, §26.4 exemption list, rendered 14×4 matrix with tablet 768/810/960 + **uk@320/375/390 mandatory**, Files-Changed table). Emit NO git commands.

## Negative flow (every off-happy-path branch)

- **A change alters desktop (`≥640`) layout** (button shrinks, row re-flows, alignment shifts at 768/1024/1440) → FAIL. Every change must be `sm:`-gated; desktop must be pixel-identical. Re-screenshot to confirm.
- **Touching a primitive** (`button.tsx`, `DialogFooter`/`dialog.tsx`, `tabs.tsx`, `AdminTable`/`AdminCardList`, `ui/*`) → FORBIDDEN. If a primitive seems to block full-width, STOP & ASK.
- **Adding `max-sm:w-full` to individual buttons that already inherit it** from the primitive → redundant noise; fix the container instead. (Exception: a button explicitly overriding with `w-auto`/`max-sm:w-auto` — that override is what gets removed/justified.)
- **Silently removing/relocating a control, handler, filter chip, tab, or `New` button** (Note 20/22) → TASK FAILURE. Layout classes only.
- **Making an icon-only row action full-width** → violates §26.4; leave compact and list as exemption.
- **`AdminEmailTemplatesManager` line ~56 ambiguous** → STOP & ASK, do not guess.
- **uk/it long labels** clip or cause h-scroll at 320 → must wrap (`whitespace-normal break-words` already in the Button primitive; verify the container doesn't re-clip).
- **New string introduced** → out of scope; if a real i18n gap is found, STOP & ASK (don't invent keys).

---

## Mobile `<640` full-width gate (RENDERED proof required — this IS the slice)

- **`<640`:** every label-bearing action button, `New` button, toolbar control, and filter control on the 5 surfaces is **full-width edge-to-edge**, stacked, ≥44px touch target, labels wrap (sq/en/uk/it), no h-scroll at 320.
- **`≥640`:** layout pixel-identical to current — `sm:flex-row` / `sm:justify-end` / `sm:ml-auto` / `sm:shrink-0` restore today's rows.
- **Icon-only card/cell row actions:** §26.4 exempt — remain compact; each exemption listed in the session log.
- The session log MUST contain the **rendered 14×4 matrix** (breakpoints × sq/en/uk/it) with per-cell evidence, **tablet 768/810/960 + uk@320/375/390 mandatory**, plus before/after PNGs of at least one action row, one toolbar, and one filter row at 320 in `uk`.

---

## Required validation (paste transcripts in the session log)

- `npx tsc --noEmit` → 0 new errors.
- `npm run lint` → 0 new errors/warnings.
- `npm run check:stories` / `check:i18n` / `check:story-coverage` / `check:design-tokens` (strict) → PASS.
- `npm run build-storybook` → builds.
- `npm run screenshots:assert` → `Viewports: 14`, `Locales: 4`; **2520/2520, 0 new FAIL, no error screens.** **Run it natively (owner) — clause 14: the orchestrator sandbox is a screen, not the verdict.** If a transient infra FAIL appears (port/EADDRINUSE/ERR_NO_BUFFER_SPACE/chunk-load), free the port and rerun to a clean pass.
- `npm run check:locale-leak` → **221 baseline, 0 new** (no new strings expected; any delta from 221 must be explained).
- **File-integrity (clause 14)** on every touched file: 0 NUL, no BOM, `tsc`/`node --check` clean, re-read tails. Paste the GREEN transcript.

---

## Acceptance criteria

- Every hand-rolled (non-`DialogFooter`) action row, toolbar, filter row, and `New` button on the 5 surfaces is full-width / stacked at `<640` via the canonical container patterns; desktop `≥640` is pixel-identical (every change `sm:`-gated).
- **0 primitive edits; 0 control/handler/string changes; 0 data-surface/column/card changes.** Before/after layout inventory proves it (Note 20/22).
- `<DialogFooter>` usages confirmed verify-only (already compliant); each icon-only exemption (§26.4) listed.
- `AdminEmailTemplatesManager` line ~56 `max-sm:w-auto` resolved (fixed / documented exemption / STOP&ASK recorded).
- `docs/responsive-storybook-inventory.md §5` updated (this row = 5 data surfaces; new Slice 4b shell row added).
- `screenshots:assert` 2520/2520 native, 0 new FAIL; `check:locale-leak` = 221 baseline; `tsc=0 new`, `lint=0 new`, `check:stories`/`check:i18n`/`check:story-coverage`/`check:design-tokens` green; file-integrity GREEN.
- Rendered 14×4 matrix with tablet 768/810/960 + uk@320/375/390 + before/after 320 `uk` PNGs in the session log.
- 4-locale parity; no hardcode; no story deleted/duplicated; no governance gate weakened.
- `docs/backlog.md` + session log updated; Files-Changed table matches the real diff. Executor emits NO git commands.

## Final report required from Sonnet

1. Before/after layout inventory per surface (container class diff per action row / toolbar / filter / `New` button; confirmation 0 handlers/controls/strings changed).
2. `<DialogFooter>` verify-only confirmation + §26.4 icon-only exemption list.
3. `AdminEmailTemplatesManager` line ~56 resolution.
4. The `responsive-storybook-inventory.md §5` edit (rename + Slice 4b row).
5. Rendered 14×4 matrix + sample PNG paths (tablet + uk@320/375/390 + before/after 320 uk).
6. Validation + file-integrity transcripts (native `screenshots:assert` + `check:locale-leak`).
7. Files-Changed table.
8. Confirmations: no primitive edited; no data-surface/column/card change; no story deleted/duplicated; no git commands.

## Ordering

1. This slice (417) → orchestrator reviews the diff + rendered matrix → owner native gate (2520/2520 + locale-leak 221) → commit emission.
2. Then **Slice 4b** (admin shell + action buttons §26.1), **Slice 5** (public/listing/system), **Slice 6** (harness assertion hardening) — one at a time, owner-approved between each. Then resume Epic JJ 408 → 407.
