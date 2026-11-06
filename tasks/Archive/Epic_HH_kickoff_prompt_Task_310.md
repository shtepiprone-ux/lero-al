# Epic HH — Task 310 kickoff (Phase 4) — Migrate remaining content/settings admin routes to canonical shell under DS

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to the
> current P0 contract + Positive/Negative two-flow rule. Epic HH Phase 4. **Large surface — the orchestrator may split
> this into 310a/b/c at planning time; do ONE batch per kickoff and STOP at the batch boundary.** Uses the committed
> canonical primitives (do NOT re-build them) and the §16.C `tableAt` targets.

```
Type:        refactor + UX (surface migration onto committed canonical primitives)
Priority:    medium-high (remaining admin routes still on raw/mixed patterns)
Area (full Phase 4 list — SPLIT into batches):
   Batch 1 (tables): /admin/locations, /admin/popular-locations, /admin/companies, /admin/property-types  (tableAtLg)
   Batch 2 (tables): /admin/currency (AdminCurrenciesManager + AdminExchangeProvidersManager + custom tabs→Tabs primitive),
                     /admin/reports (AdminReportsManager, tableAtLg — deferred from Sprint 28)
   Batch 3 (forms/lists/nonTabular): /admin/email-templates, /admin/footer, /admin/settings, /admin/permissions,
                     /admin/pages, /admin/legal, /admin (dashboard card grid → AdminPageShell)
```

## Why this task exists
`docs/design-system.md` §16.C marks these routes as Phase 4–5 `must migrate`: 11 admin `*Manager` raw `<table>`s + the
dashboard ad-hoc card grid + custom currency tabs. The canonical primitives (`AdminPageShell`, `AdminTable` `tableAtLg`,
`AdminCardList`, Tabs single-style) are committed and proven on `/admin/listings` (reference impl) + Sprint 34 Tasks
308/309. This task brings each remaining route to the same contract — no clipping, controlled scroll, full-width <640.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/design-system.md` — **§9, §10 `tableAt`, §11 filters/tabs/actions, §12a/§12b mobile, §14, §16.C (the per-route
   target table), §17 grep audit, §18 phased-migration rule, §20/§21.**
3. `docs/rule-index.md` → "Admin table / admin control task" bundle + `docs/admin-ux-rules.md` §1–§13.
4. `docs/ai-behavior.md` Notes 18/19/20/21/22/23 (ALL).
5. The reference impls: `AdminListingsTable.tsx`, Sprint 34 `Task_308`/`Task_309` kickoffs + their session logs; the
   primitives `AdminPageShell/AdminTable/AdminCardList`. Read EACH manager you migrate before editing.
6. `package.json` validation scripts.

## Per-route current behavior to preserve (Notes 19/20/22) — INVENTORY EACH in session log
For every route in the batch, before editing, inventory: columns, row-click, row actions, inline controls, filters,
search, pagination, sort, empty/loading/error states, and the server actions each control calls. Nothing silently
removed; relocated controls (Note 21) ship a working new location. **`tableAt` decision per surface MUST follow §16.C**
(`tableAtLg` for data tables; `formLayout`/`nonTabular` for settings/email-templates/footer/permissions/pages/legal).

## 🔴 Mobile <640 full-width gate (clause 11) — per route
- Page header + CTA stack full-width; CTA `max-sm:w-full`.
- Filter/search/tabs full-width + wrap at `max-sm`; ≥4-option filters = canonical Combobox/Select (full-width bottom
  sheet at <640); ≤3 scopes = Tabs single-style.
- Data tables: `AdminTable` controlled scroll + sticky first col/header at `<lg` (no clip). Form/list routes: stacked
  full-width inputs (`AdminInput`), no fixed widths.
- Every modal/popover on these routes = full-width bottom sheet at <640.
- Icon-only exemptions listed + justified per route.

## Positive flow (happy path) — per migrated route, at uk 375px
Header + filters render full-width with no overflow; the table scrolls horizontally with sticky first col + header (data
routes) OR the form/list stacks full-width (settings routes); every existing CRUD action (create/edit/delete/save/
reorder/toggle) works exactly as before via its existing server action; sort header writes `?sort=&dir=` (data tables);
success → toast; reload preserves filter/sort URL-state.

## Negative flow (every branch needs a diff line, per route)
CRUD server error → error toast + no mutation; permission-denied → guarded; validation error → inline + early return;
cancel/dismiss of any bottom-sheet → closes, focus returns, no mutation; empty list → empty state; loading → loading
state; double-submit → disabled while pending; invalid URL sort param → default; locale mismatch → no raw key.

## Acceptance criteria
- Each route in the batch renders via `AdminPageShell` + (`AdminTable` `tableAtLg` | `AdminCardList` | form layout per
  §16.C); custom currency tabs → Tabs primitive; dashboard → AdminPageShell card grid.
- Every per-route inventoried control preserved (before/after inventory; Notes 20/21/22/23). No raw `<table>` left in the
  migrated managers (verify via §17 grep in the session log).
- Positive + every Negative branch verifiable in diff.
- **Rendered matrix (clause 12)** PER route: 320/375/390/768/1280/1440/2560 × sq/en/uk/it; uk@320/375/390 mandatory.
  **`screenshots:assert` + `check:locale-leak` green (clause 13)** for any story/primitive touched — tsc/build not proof.
- `tsc=0`, `lint=0`, `check:stories=0`, `check:i18n` parity PASS, `check:locale-leak` 0.
- `docs/design-system.md` §16.C updated (route marked migrated). `docs/backlog.md` + `docs/sessions/` updated;
  **Files Changed table**; **no git from executor**.

## Out of scope
- Routes outside the current batch (do one batch; STOP at the boundary). Re-building any canonical primitive.
- Verified Agents (Task 313). Listing/public surfaces. DB/schema changes (unless a route's existing action needs none).
- Re-litigating §16.C `tableAt` targets (fixed inputs) — if a target looks wrong, STOP & ASK, do not silently deviate.
