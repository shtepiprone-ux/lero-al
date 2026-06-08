# Sprint 35 — Task 413 — Slice 1 of the Global Responsive Rework: migrate the 3 raw-`<table>` admin managers to `AdminTable` / `AdminCardList` `tableAtLg`

**Type:** UI / admin-table responsive migration (PRODUCT CODE) — Slice 1 of the Task 412 phased plan
**Executor:** Sonnet 4.6
**Status:** OPEN — file/hand off only AFTER the Task 412 docs commit lands
**Created by:** orchestrator, 2026-06-08, after Task 412 standard + inventory approved (owner pre-approved Slice 1)
**Reviewer:** Opus 4.7 orchestrator (rendered-matrix review; does not write product code)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST**, then the canonical standard sections this task enforces. For ambiguity, follow **Task 412 P0 Addendum A7**: do not invent; do not halt the whole slice for one surface — mark it OPEN DECISION and continue — halt only if continuing would require an out-of-scope edit or weakening a P0 rule.

---

## What this slice is (and is NOT)

This is **Slice 1** of the §18-compliant phased plan produced by Task 412 (`docs/responsive-storybook-inventory.md §5`). It fixes the **60 machine-confirmed horizontal-overflow cells** from the Task 411 rendered run by migrating exactly three admin managers off their raw `<table className="w-full">` onto the canonical **`AdminTable` / `AdminCardList` `tableAtLg`** pattern — cards below `lg` (1024px), real table at `lg+` — exactly as `AdminListingsTable` already does (the shipped reference, Task 306-Fix).

**In scope — exactly these three components + their stories:**
- `src/components/admin/AdminCurrenciesManager.tsx` (+ `AdminCurrenciesManager.stories.tsx`)
- `src/components/admin/AdminPropertyTypesManager.tsx` (+ `AdminPropertyTypesManager.stories.tsx`)
- `src/components/admin/AdminCompaniesManager.tsx` (+ `AdminCompaniesManager.stories.tsx`)

**NOT in scope (do NOT touch — these are later slices or out of scope):**
- The other admin managers / any other story (Slices 3–5).
- **The raw add/edit modals** in these three files (`fixed inset-0 … max-w-lg` centered cards). They are a §26.2 popup-bottom-sheet violation, but that is **Slice 2 (overlay/popup compliance)**. In Slice 1 you **preserve them exactly as-is and keep them working** — do not migrate, restyle, or regress them. If the table migration forces an unavoidable change to a modal, **STOP & ASK**.
- `AdminTable`/`AdminCardList` primitives themselves — consume them, do not modify them. If a genuine primitive gap blocks the migration, **STOP & ASK** (do not fork a local variant — A3).
- Harness scripts, lint config, `.storybook/**`, locale JSON beyond the parity required for any new/changed string.

---

## Pre-read (per `docs/rule-index.md` — Admin table / admin control task)

**Always required:** `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.
**Required:**
- `docs/design-system.md` — **§10** (`tableAt` decisions; `tableAtLg` = cards `<1024`, table `≥1024`; visibility tokens `always/sm/md/lg/xl`; sticky-first at `lg+`; `cardRow` requirement), **§24** (forbidden responsive hardcodes — no `w-[…]`/`min-w-[…]`/raw px to "make it fit"), **§25** (global control-preservation rule), **§26** (mobile `<640` full-width gate), **§27** (Storybook responsive-proof contract). **§9** admin layout.
- `docs/responsive-storybook-inventory.md` — **§5 Slice 1 row** + the per-surface rows for the 3 managers (current pattern → required pattern), **§6** machine-detection assessment, **§MQ** manual-QA items.
- `docs/component-governance.md` (canonical `AdminTableRow`/`AdminTable` pattern), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- `docs/ai-behavior.md` → **Note 22 "Admin Table Preservation Rule"**, Note 20 (existing-control preservation), Note 19 (UX-flow preservation).
- **Reference implementation to mirror:** `src/components/admin/AdminListingsTable.tsx` (columns with `visibility`, `cardRow`, `AdminTable` usage) + `src/components/admin/AdminTable.tsx` (API: `AdminTableColumn<Row>` = `{ key, header, cell, visibility? }`; props `rows/columns/onRowClick?/stickyColumnIndex?/cardRow?/emptyState/loadingState`).

Do not read beyond this set.

---

## Current behavior to preserve (per component — inventory BEFORE/AFTER is mandatory, A4 + Note 22)

For EACH of the three managers, the session log MUST contain a **before/after control inventory** proving nothing was dropped. Capture, per manager: every **column** (header + cell content), **row-click** behavior, **row actions** (edit/delete/toggle/etc.), **inline controls** (status toggles, default-currency markers, links), **search** input, **sort**, **pagination** (if any), **bulk actions** (if any), **empty / loading / error** states, and the **add/edit modal trigger** button(s). Known starting points (verify in the live files — do not trust this list as exhaustive):

- **AdminCurrenciesManager** — search input; raw `<table className="w-full text-sm">` (no `min-w-0` containment → overflow); per-row code/symbol/rate cells + row actions; an add/edit modal (raw `fixed inset-0 … max-w-lg`, **out of scope — preserve**); a default-currency control. The list/table is the overflow source.
- **AdminPropertyTypesManager** — search input; `<div className="overflow-x-auto"><table className="w-full text-sm">` (scroll wrapper still overflows the page because the flex parent lacks `min-w-0`); name/slug cells + row actions; add/edit modal (preserve).
- **AdminCompaniesManager** — search input; `<table className="w-full text-sm">` with already-conditional columns (`logo`, `name`, `agents` `hidden sm:table-cell`, `created` `hidden md:table-cell`) + row actions; add/edit modal (preserve). The `hidden sm/md:table-cell` partial pattern must be replaced by proper `AdminTable` `visibility` tokens, not left as ad-hoc.

**Required after-behavior:** each manager renders **structured cards below `lg` (1024px)** (via an explicit `cardRow` — A4: every column's data still reachable in the card; no silent loss) and the **`AdminTable` table at `lg+`** with per-column `visibility` tokens. **Zero horizontal page overflow at 320/375/390/480/560/680/960** (the 60 failing cells go green). Contained horizontal scroll is **NOT** the primary fix (§10); if any single surface genuinely cannot become cards, **STOP & ASK** with a recommendation (do not default to scroll).

---

## Positive flow (happy path)

1. Read the pre-read set + the three live components + the `AdminListingsTable`/`AdminTable` reference.
2. For each manager: define `columns: AdminTableColumn<Row>[]` (header via `t()`, cell renderers preserving every current cell incl. row actions and inline controls) with deliberate `visibility` per column; define `cardRow(row)` covering all column data; wire `emptyState`/`loadingState`/error; replace the raw `<table>`/scroll-wrapper with `<AdminTable … />`. Preserve search/sort/pagination and the (out-of-scope) modal triggers unchanged.
3. Keep all user-facing strings in `sq/en/uk/it` parity; any new column header/aria string is added to all four locale files.
4. Run the full validation set (below), including `screenshots:assert` for the three stories at 14 viewports × 4 locales → the 60 cells PASS, 0 new FAIL.
5. Walk each manager in the running app/Storybook at `uk` 320/375/390 and at 1024/1440 end-to-end; record the rendered matrix + the §MQ manual checks.
6. Update `docs/backlog.md` + write the session log (before/after control inventory per manager, rendered matrix, Files-Changed table). Do NOT emit git commands.

## Negative flow (every off-happy-path branch)

- **A column cannot map cleanly to a card field** → put it in the card `meta`/`trailing` per §10; never drop it. If genuinely impossible, mark OPEN DECISION + STOP & ASK (A7).
- **A row action / inline control would be lost or become unreachable in card mode** → A4 failure; the card MUST expose it (e.g. trailing action). Do not ship a read-only card that drops an action (clause 3/4).
- **Empty / loading / error state** → must render correctly in BOTH card and table modes (`emptyState`/`loadingState` props); verify all three at narrow + wide.
- **A primitive gap blocks the migration** (AdminTable can't express something) → STOP & ASK; do not fork a local table or add `w-[…]`/`min-w-[…]` hacks (A2/A3).
- **The add/edit modal regresses** (stops opening, loses a field) → out-of-scope regression; revert that change and STOP & ASK. Slice 1 must leave the modal exactly as found.
- **Temptation to "fix" overflow with `overflow-hidden`, `whitespace-nowrap`, arbitrary widths, or by hiding a column** → forbidden (A2/§24); the fix is the card/table switch, not masking.
- **A locale (uk/it long strings) breaks a card/table cell** → wrap per §6/§24.4; never `whitespace-nowrap` a localized label without an approved truncation rule.

---

## Mobile <640 full-width gate (§26 — RENDERED proof required)

The card layout below `lg` must be full-width edge-to-edge at `<640`; search/toolbar controls full-width per §12a/§26.1; ≥44px touch targets on every row action and inline control; long `sq/en/uk/it` labels wrap (no clip, no h-scroll at 320). Icon-only row actions are the only exemption and must be listed with accessible names. (The modals' §26.2 bottom-sheet compliance is Slice 2 — not asserted here, but they must still open and be usable.)

---

## Required validation (paste transcripts in the session log)

- `npx tsc --noEmit` → 0 new errors.
- `npm run lint` → 0 new errors/warnings.
- `npm run check:stories` → PASS (the 3 stories stay canonical: no `layout:'centered'/'padded'`, no raw controls, no hardcoded strings, no `/Ukrainian/` export).
- `npm run check:i18n` → PASS (4-locale parity for any new/changed string).
- `npm run check:story-coverage` → PASS.
- `npm run build-storybook` → builds.
- **`npm run screenshots:assert`** (canonical full matrix) → transcript shows `Viewports: 14`, `Locales: 4`; **the 60 previously-failing cells (3 managers × sq/en/uk/it × 320/375/390/480/560) now PASS; 0 new FAIL**; no error-boundary screens. Paste the manifest path.
- **Rendered verification matrix (clause 12)** in the session log: rows = the 14 viewports, cols = `sq/en/uk/it`, per-cell evidence for each of the 3 managers; **uk@320/375/390 mandatory**; plus the §MQ manual checks (card full-width <640, no `overflow-hidden` masking, row actions reachable, tablet 768/810/960 intentional).
- **File-integrity (clause 14)** on every touched file: 0 NUL, no BOM, `tsc` clean, re-read tails. Paste the GREEN transcript.

> The `AdminMobileHeader/uk/1920 ERR_NO_BUFFER_SPACE` infra flake is NOT in this slice; if it recurs, note it as the known flake, not a Slice-1 FAIL.

---

## Acceptance criteria

- All three managers consume `AdminTable`/`AdminCardList` with `tableAtLg` (cards `<1024`, table `≥1024`) + explicit `cardRow` + per-column `visibility`; **no raw `<table>` remains in the three files**; no `overflow-x-auto` page-overflow, no `w-[…]`/`min-w-[…]`/arbitrary-width or `overflow-hidden`/`whitespace-nowrap` masking (§24).
- **Every** column, row action, inline control, search, sort, pagination, empty/loading/error state preserved and reachable at every viewport × locale (A4/§25/Note 22) — proven by the before/after control inventory.
- The add/edit modals are unchanged and still open/work (out of scope, not regressed).
- `screenshots:assert` 14×4 shows the 60 cells PASS, 0 new FAIL, no error screens; the clause-12 rendered matrix (uk@320/375/390 + §MQ) is in the session log.
- `tsc=0 new`, `lint=0 new`, `check:stories`/`check:i18n`/`check:story-coverage`/`build-storybook` green; file-integrity GREEN.
- 4-locale parity for any new/changed string; no hardcode.
- `docs/backlog.md` + session log updated; Files-Changed table matches the real diff. Executor emits NO git commands.

## Ordering

1. Land the Task 412 docs commit first.
2. This slice (413) → orchestrator reviews the **rendered matrix** (not the report) → owner native gate → commit emission (the 3 managers + 3 stories; bundled with the 410/411 harness once the matrix is green, since this is what proves 410/411).
3. Then owner approves Slice 2 (overlay/popup §26.2 compliance, incl. these managers' modals); subsequent slices 3–5 per `responsive-storybook-inventory.md §5`.
4. Re-run the Task 410 rendered proof on the corrected matrix → consider 410 for approval → resume Epic JJ 408 → 407.
