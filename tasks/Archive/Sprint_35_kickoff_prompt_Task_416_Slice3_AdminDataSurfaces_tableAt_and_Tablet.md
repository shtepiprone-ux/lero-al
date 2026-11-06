# Sprint 35 — Task 416 — Slice 3 of the Global Responsive Rework: admin data surfaces `tableAt` declaration + tablet (768–1023) review

**Type:** Admin table / admin control (PRODUCT CODE) — Slice 3 of the Task 412 phased plan
**Executor:** Sonnet 4.6
**Status:** OPEN — hand off now (Slice 1 = Task 413 ✅ committed; Slice 2 = Task 414 ✅ committed `bd2adc106`)
**Created by:** orchestrator, 2026-06-10, after Slice 2 closed (native `screenshots:assert` 2520/2520)
**Reviewer:** Opus 4.7 orchestrator (rendered + diff review; does not write product code)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST**, then the Admin-table pre-read bundle below. For ambiguity, follow **Task 412 P0 Addendum A7**: do not invent; do not halt the whole slice for one surface — mark it OPEN DECISION and continue — halt only if continuing would require an out-of-scope edit or weakening a P0 rule.

---

## What this slice is (and is NOT)

Slice 3 of the §18-compliant plan (`docs/responsive-storybook-inventory.md §5`). It covers the **5 admin data surfaces** the inventory flagged for `tableAt` declaration + tablet review:
`AdminExchangeProvidersManager`, `AdminSupportManager`, `AdminEmailTemplatesManager`, `AdminUsersTable`, `AdminUserProfile`.

**Reality check the orchestrator already did (verify in the live files — do not trust this list as exhaustive):**

| Surface | Current state | Slice-3 action |
|---|---|---|
| `AdminExchangeProvidersManager.tsx` | **1 raw `<table>`** (provider list); its `ProviderFormDialog` is already canonical (Slice 2) | **MIGRATE list → `AdminTable`/`AdminCardList` `tableAtLg`** |
| `AdminSupportManager.tsx` | **1 raw `<table>`** (ticket list) | **MIGRATE → `tableAtLg`** |
| `AdminUsersTable.tsx` | **2 raw `<table>`** (main user list + location-requests sub-table) | **MIGRATE main list → `tableAtLg`**; for the 2nd table, migrate too unless it is a fundamentally different micro-surface → then STOP & ASK |
| `AdminEmailTemplatesManager.tsx` | **no raw table** (list + form surfaces) | **DECLARE** `tableAt` strategy (`nonTabular`/`formLayout`); tablet-verify; migrate ONLY if a broken hybrid is found |
| `AdminUserProfile.tsx` | **no raw table** (profile detail view) | **DECLARE** strategy (`nonTabular`/`formLayout`); tablet-verify; control-preserve |

So Slice 3 = **3 raw-table migrations** (same pattern as Slice 1 / Task 413) **+ 2 declare-and-verify surfaces**, plus a **`tableAt` declaration for all 5** in the design-system admin inventory.

**Pattern for the 3 migrations** (identical to Slice 1): replace raw `<table className="w-full">` with `AdminTable` + `AdminCardList` `tableAtLg` (**cards `<1024`, table `≥1024`**). Reference implementation = `AdminListingsTable.tsx` (Task 306-Fix). Preserve EVERY column, row action, inline control, filter, tab, search, pagination, and empty/loading/error state (§25.1 / Note 22).

**🚧 NOT in scope — do NOT pull these in (the Task 414 §26.1 drift must not repeat):**
- **§26.1 full-width action/toolbar buttons → Slice 4.** Do NOT change Cancel/Save/New/action-row buttons to `flex-col`/`max-sm:w-full`/`[&>*]:max-sm:w-full`. If a toolbar or form action row is not full-width at `<640`, **leave it** — it is Slice 4. This explicitly includes `AdminEmailTemplatesManager`'s form action buttons (the inventory mentions them; they are Slice 4, not here).
- **§26.2 popups → DONE in Slice 2.** The `ProviderFormDialog` and any detail/delete dialogs are already canonical — **verify only, do not touch.**
- Public/listing/system surfaces → Slice 5. Harness assertion changes → Slice 6.
- No primitive edits (`AdminTable.tsx`, `AdminCardList.tsx`, `ui/*`) — consume them, do not modify. If a primitive looks wrong, STOP & ASK.

---

## Pre-read (per `docs/rule-index.md` — Admin table / admin control)

**Always required:** `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.
**Required:**
- `docs/design-system.md` — **§10** (`tableAt` decisions: `tableAtLg`/`nonTabular`/`formLayout`), **§16.C** (admin inventory — this is where each surface's `tableAt` is declared), **§25.1** (control-preservation), **§25.2** (tablet intentional design), **§26.5** (mobile full-width PASS/FAIL — for the card layout, NOT the buttons).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md` (§11 canonical `AdminTableRow` pattern), `docs/domain-rules.md`, `docs/rls-rules.md`, `docs/qa-rules.md`.
- `docs/ai-behavior.md` → **Note 22 "Admin Table Preservation Rule"**.
- `docs/responsive-storybook-inventory.md` — **§2** (the 5 surface rows) + **§5 Slice 3 row** + **§7** (`--tablet` story IDs for 768–1023 verification).
- **Reference:** `src/components/admin/AdminListingsTable.tsx` (the `tableAtLg` template) + the Slice 1 result (`AdminCompaniesManager.tsx`) as a worked example.

Do not read beyond this set.

---

## Current behavior to preserve (control inventory — Note 22, mandatory in the session log)

A **before/after control inventory** per migrated surface, proving nothing was lost. Known control families the orchestrator already saw (verify + complete from the live files):

**AdminExchangeProvidersManager** — columns: name, endpoint (hidden `md`), mode, priority, status/`is_enabled` + action col; row actions: **edit** (`openEdit`), **enable/disable toggle** (`handleToggle`), **delete** (`setDeleteTarget`→`handleDelete`, `delete_confirm`); **New** (`openNew`→`ProviderFormDialog`); empty state. Form fields (in the already-canonical dialog): name, endpoint, api_key, refresh_interval, priority, mode, notes — **do not touch the dialog**.

**AdminSupportManager** — columns: `col_type`, `col_reporter`, `col_reported`, `col_status` (+ action col; several `hidden sm/md/lg:table-cell`); filters: **type** (`type_user_complaint`/`type_support`), **status**; **row click → detail** (`setSelected`); **New ticket** (`setShowNew`→`handleCreate`); **status update** (`handleStatusUpdate`, `update_status_btn`); empty/loading states.

**AdminUsersTable** — columns: `col_user`, `col_status`, `col_role`, `col_phone`, `col_company`, `col_agent`, `col_date` (hidden `md/lg`); **tabs** `tab_all`/`tab_verified`; filters: **role**, **status**, **location_request**; **search** (`search_placeholder`); row actions: **verify/revoke** (`toggleUserVerified`), **location_request_badge**; **pagination** `prev_page`/`next_page`; empty states `empty`/`empty_verified`. The 2nd raw table = location-requests sub-surface — inventory + decide (migrate vs STOP & ASK).

**Required after-behavior:** identical columns/actions/filters/tabs/search/pagination/states, now via `AdminTable` (table `≥1024`) + `AdminCardList` (cards `<1024`) with the `tableAtLg` decision; the existing per-column `hidden md/lg:table-cell` visibility folds into the card meta rows (no data dropped, just relocated into the card). `onRowClick` keeps the K.1 card affordance; inner buttons keep `e.stopPropagation()`.

For **AdminEmailTemplatesManager** + **AdminUserProfile**: NO migration unless a broken hybrid is found — instead **declare** the `tableAt`/layout strategy in `design-system.md §16.C`, and verify the 768/810/960 tablet layout is intentional (§25.2) with every control preserved.

---

## Positive flow (happy path)

1. Read the pre-read set + `AdminListingsTable` (reference) + a Slice-1 result.
2. Inventory each of the 5 surfaces (before-state control list in the session log).
3. **Migrate** the 3 raw-table surfaces to `AdminTable`/`AdminCardList` `tableAtLg` (cards `<1024`, table `≥1024`), preserving every control per the inventory. Toolbars/filters keep their current width behaviour (full-width = Slice 4) — only the data surface changes.
4. **Declare** the `tableAt`/layout strategy for all 5 in `design-system.md §16.C` (e.g. ExchangeProviders/Support/Users = `tableAtLg`; EmailTemplates list = `nonTabular` + form = `formLayout`; UserProfile = `nonTabular`/`formLayout`).
5. **Tablet review (768/810/960):** confirm each surface's card/table layout at the tablet band is intentional, no broken hybrid, no h-scroll, labels wrap; fix any broken hybrid (data-surface only).
6. Keep `sq/en/uk/it` parity (no new strings expected beyond reusing existing column/action keys).
7. Run the full validation set. `screenshots:assert` stays green — **no new FAIL, no error screens** (the migrated surfaces' overflow cells, if any existed, go green; new `--tablet`/card cells must pass).
8. Update `docs/backlog.md` + write the session log (before/after control inventory per surface, the `tableAt` declarations, the rendered 14×4 matrix with tablet 768/810/960 + uk@320/375/390 mandatory, Files-Changed table). Emit NO git commands.

## Negative flow (every off-happy-path branch)

- **A migrated surface would lose a column/row-action/filter/tab/search/pagination/state** → Note 22 failure; the `tableAtLg` version MUST carry all of them (hidden-at-breakpoint columns relocate into card meta, never disappear). Do not ship a reduced surface.
- **The 2nd `AdminUsersTable` table (location-requests) is a fundamentally different micro-surface** → STOP & ASK rather than force a `tableAtLg` that doesn't fit.
- **Temptation to make toolbar/action/New/Save buttons full-width at `<640`** → FORBIDDEN here (§26.1 = Slice 4). Leave button width as-is.
- **A primitive (`AdminTable`/`AdminCardList`/`ui/*`) looks wrong** → STOP & ASK; do not edit it.
- **EmailTemplates/UserProfile have no broken hybrid** → declare-and-verify only; do NOT refactor them into tables.
- **uk/it long labels** in a card/cell must wrap (`whitespace-normal break-words`), never clip or h-scroll at 320.
- **Arbitrary widths / `overflow-x-auto` / `whitespace-nowrap` as a "fix"** → forbidden (§24); the `tableAtLg` card layout is the fix.

---

## Mobile `<640` + tablet gate (RENDERED proof required)

- **`<1024`:** every migrated surface renders as `AdminCardList` cards, full-width edge-to-edge, no h-scroll at 320, labels wrap, ≥44px touch targets on row controls. **`≥1024`:** the `AdminTable`.
- **Tablet band 768/810/960:** card layout (since `tableAtLg` = table only `≥1024`), intentional per §25.2, no broken hybrid.
- **Button/toolbar full-width at `<640` is explicitly OUT OF SCOPE (Slice 4)** — do not assert or change it here.
- Because the card/table breakpoint behaviour IS machine-checkable (overflow/visibility), `screenshots:assert` is real proof here — but the session log still needs the **rendered 14×4 matrix** with per-cell evidence, **tablet 768/810/960 + uk@320/375/390 mandatory**.

---

## Required validation (paste transcripts in the session log)

- `npx tsc --noEmit` → 0 new errors.
- `npm run lint` → 0 new errors/warnings.
- `npm run check:stories` / `check:i18n` / `check:story-coverage` / `check:design-tokens` (strict) → PASS.
- `npm run build-storybook` → builds.
- `npm run screenshots:assert` → `Viewports: 14`, `Locales: 4`; **no new FAIL, no error screens**; any prior overflow cells on these 3 surfaces go green; count ≥ the current 2520 baseline (new card/tablet cells add coverage). **Run it natively (owner) — clause 14: the orchestrator sandbox is a screen, not the verdict.** If a transient infra FAIL appears (port/EADDRINUSE/ERR_NO_BUFFER_SPACE/chunk-load), free the port and rerun to a clean pass before claiming green.
- **File-integrity (clause 14)** on every touched file: 0 NUL, no BOM, `tsc`/`node --check` clean, re-read tails. Paste the GREEN transcript.

---

## Acceptance criteria

- The 3 raw-table surfaces (`AdminExchangeProvidersManager`, `AdminSupportManager`, `AdminUsersTable`) are migrated to `AdminTable`/`AdminCardList` `tableAtLg`; **0 raw `<table>` remain in those files** (or a documented STOP & ASK for the location-requests sub-table); every column/row-action/filter/tab/search/pagination/state preserved (before/after inventory proves it).
- `tableAt`/layout strategy declared for all 5 surfaces in `design-system.md §16.C`.
- `AdminEmailTemplatesManager` + `AdminUserProfile`: tablet-verified, controls preserved, NOT refactored into tables (unless a broken hybrid was found + documented).
- **No §26.1 button/toolbar full-width work; no §26.2 popup edits; no primitive edits; no arbitrary-width/`overflow-x-auto`/`whitespace-nowrap`/masking (§24).**
- `screenshots:assert` no new FAIL / no error screens (native, clean); `tsc=0 new`, `lint=0 new`, `check:stories`/`check:i18n`/`check:story-coverage`/`check:design-tokens` green; file-integrity GREEN.
- Rendered 14×4 matrix with tablet 768/810/960 + uk@320/375/390 in the session log.
- 4-locale parity; no hardcode; no story deleted/duplicated; no governance gate weakened.
- `docs/backlog.md` + session log updated; Files-Changed table matches the real diff. Executor emits NO git commands.

## Final report required from Sonnet

1. Before/after control inventory per migrated surface (+ the location-requests sub-table decision).
2. The `tableAt`/layout declarations added to `design-system.md §16.C` (all 5).
3. Tablet (768/810/960) review notes per surface; any broken-hybrid fix.
4. Rendered 14×4 matrix + sample PNG paths (tablet + uk@320/375/390).
5. Validation + file-integrity transcripts (native `screenshots:assert`).
6. Files-Changed table.
7. Confirmations: no §26.1/§26.2 work; no primitive edited; no story deleted/duplicated; no git commands.

## Ordering

1. This slice (416) → orchestrator reviews the diff + rendered matrix → owner native gate → commit emission.
2. Then **Slice 4** (§26.1 admin shell + action buttons full-width), Slice 5 (public/listing/system), Slice 6 (harness assertion hardening) — per `responsive-storybook-inventory.md §5`, one at a time, owner-approved between each. Then resume Epic JJ 408 → 407.
