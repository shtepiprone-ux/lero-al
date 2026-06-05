# Sprint 34 — Task 308 (DS RE-SCOPE) — Migrate `/admin/listings` + `/admin/users` to canonical `AdminPageShell` + `AdminTable` + `StatusChangeControl` + sort URL-state

> **SUPERSEDES** `tasks/Sprints/Sprint_28_kickoff_prompt_Task_308.md` (original, pre-DS-commit). The original's
> behavioral inventory + Positive/Negative flows remain ACCURATE and are a **mandatory pre-read** — this file
> does NOT repeat them; it re-grounds the task on the now-committed Design System and adds the clause-11/12/13 gates.
> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** No scope
> change; if anything is ambiguous, STOP & ASK the orchestrator — do not invent.

```
Type:        refactor + UX (surface migration onto committed canonical primitives)
Priority:    HIGH (owner-flagged admin-mobile surfaces; repeated owner rejection history)
Area:        src/components/admin/AdminListingsTable.tsx   (full migration + StatusChangeControl variant="workflow")
             src/components/admin/AdminUsersTable.tsx       (shell + AdminTable migration; NO status control — Verified Agents = Task 313)
             src/app/admin/listings/page.tsx + src/app/admin/users/page.tsx (verify shell wrapping; no SSR scope change)
```

## What changed since the Sprint 28 original (read carefully)

1. **The canonical primitives are now committed** — `AdminPageShell`, `AdminTable` (sortable columns, `tableAtLg`,
   controlled scroll, sticky header/first-col, visibility breakpoints, sort/hide column menu), `AdminCardList`,
   `StatusChangeControl<S>` (`variant="select"|"workflow"`, `transitions`, `historyEvents`, `enableNote`,
   `requireNote`, `onSubmit`), `StatusChangeHistory`. **Do NOT re-create or fork any of them.** Use them as-is.
2. **`/admin/listings` is the reference implementation** for `tableAtLg` (`docs/design-system.md` §16.C marks it
   "migrated, reference impl"). Task 308 brings it to production-correct completeness AND integrates
   `StatusChangeControl variant="workflow"` into the row transition cluster; `/admin/users` follows the same pattern.
3. **Global mobile contract is committed** — Button `max-sm:w-full`, Tabs single canonical style, all popups =
   full-width bottom sheet at <640. Every control you touch must already comply; if a consumer call-site does not,
   fix it per `docs/design-system.md` §12a/§12b (Note 14 global-change rule — fix EVERY sibling, no divergent site).

## Pre-read (mandatory before any code change)

1. `docs/agent-contract.md` (clauses 1–13) · `docs/backlog.md`
2. `docs/design-system.md` — **§9 admin layout, §10 `tableAt`, §11 filters/search/tabs/actions, §12a/§12b mobile
   stacking + touch-target, §14 dialogs/sheets, §16.C admin snapshot, §17 grep audit, §20 PASS / §21 FAIL.**
3. `docs/rule-index.md` → "Admin table / admin control task" bundle (ui-rules, component-rules,
   component-governance §11 AdminTableRow, domain-rules, rls-rules, qa-rules, ai-behavior Note 22).
4. `docs/ai-behavior.md` Notes 18/19/20/21/22/23 (ALL — this is the behavior-preservation epicenter).
5. **`tasks/Sprints/Sprint_28_kickoff_prompt_Task_308.md`** — the original inventory + Positive/Negative flows
   (still authoritative for AdminListingsTable + AdminUsersTable current behavior). `docs/admin-ux-rules.md` §1–§13.
6. The reference impl already in the tree: read `AdminListingsTable.tsx`, `AdminTable.tsx`,
   `StatusChangeControl.tsx`, `AdminPageShell.tsx` before editing.
7. `package.json` validation scripts (`tsc`, `lint`, `check:stories`, `check:i18n`, `check:locale-leak`,
   `screenshots:assert`).

## Localization coverage
sq / en / uk / it — every column header, filter label, status label, row-action label, empty/loading/error string,
and StatusChangeControl note/submit label. Runtime-confirm all four (matching key counts is NOT sufficient). No new
raw strings — reuse existing `admin.*` keys; new keys go in `admin.common.status_control.*` per Task 328 spec.

## Responsive coverage
320 / 375 / 390 / 768 / 1280 / 1440 / 2560 — **uk@320/375/390 are mandatory stress cells.**

## Current behavior to preserve
Use the **verbatim inventory in the Sprint 28 original** (AdminListingsTable: 8 filters, 8 columns, per-row
STATUS_ACTIONS transition cluster, delete AlertDialog, premium toggle, pagination, empty/loading/error; AdminUsersTable:
role/status filters, verified-agents tab, columns, edit→`/admin/users/[id]`, pagination). Re-verify it in your session
log as a before/after control inventory (Note 20/22). Nothing silently removed; the STATUS_ACTIONS whitelist is
**preserved verbatim** and fed to `StatusChangeControl` via `transitions` — the transition control is RELOCATED into
the canonical primitive (Note 21), never dropped.

## 🔴 Mobile <640 full-width gate (clause 11) — surfaces in scope
- **Page header row** (title + count badge + Create CTA): stacks full-width at `max-sm`; CTA `max-sm:w-full`.
- **Filter bar** (all 8 listings filters / users filters): each trigger full-width at `max-sm`, wraps, ≥44px; the
  filter Comboboxes/Selects open as **full-width bottom sheets** at <640 (already canonical — verify rendered).
- **AdminTable** at `<lg`: controlled horizontal scroll with sticky first meaningful column + sticky header +
  visible scroll affordance (NOT clipped). Per `tableAtLg`.
- **Row transition cluster** → `StatusChangeControl variant="workflow"`: pill group + note + submit full-width at
  `max-sm`; ≥44px targets; long sq/en/uk/it labels wrap.
- Exemptions (icon-only, justify each): delete icon button, premium toggle icon, sort/hide column-menu trigger.

## Required after behavior (literal — see Sprint 28 original Positive flow for step-by-step)
As admin at `uk` 375px on `/uk/admin/listings`: header + 8 filters render full-width, no overflow; AdminTable scrolls
horizontally with sticky "Listing" col + header, no clip; each row's status change goes through
`StatusChangeControl variant="workflow"` with the exact same allowed-transition set as today, optional note, Update
submit; success → row status updates + toast + `StatusChangeHistory` timeline appends; sort header click writes
`?sort=<col>&dir=asc|desc` to the URL and reload preserves it. Same for `/uk/admin/users` (no status control; verified
-agents tab + role/status filters preserved; sort URL-state added).

## Negative flow (every branch must have a diff line — see Sprint 28 original; minimum:)
status update: server error → error toast (locale key) + status NOT changed + no timeline append; permission-denied
(non-admin / RLS) → guarded, no mutation; double-submit → disabled while pending; cancel/dismiss of the bottom-sheet
popup → Esc + backdrop tap close, focus returns to trigger, no mutation; empty filter result → empty state; loading →
skeleton/loading state; invalid sort param in URL → falls back to default sort, no crash; locale mismatch → all labels
resolve in active locale (no raw key).

## Acceptance criteria
- Both tables render via `AdminPageShell` + `AdminTable`; `/admin/listings` integrates `StatusChangeControl
  variant="workflow"`; `/admin/users` migrated (no status control).
- Sort URL-state `?sort=<column>&dir=asc|desc` on both, reload-safe; canonical query shape identical across tables.
- Every Sprint-28-inventoried control preserved (before/after inventory in session log; Note 20/21/22/23).
- Positive + every Negative branch verifiable in the diff.
- **Rendered matrix (clause 12)** in the session log: 320/375/390/768/1280/1440/2560 × sq/en/uk/it, real per-cell
  evidence, uk@320/375/390 present. **`screenshots:assert` + `check:locale-leak` green in the transcript (clause 13)** —
  tsc/build is NOT proof.
- `tsc=0`, `lint=0`, `check:stories=0`, `check:i18n` parity PASS, `check:locale-leak` leakCount 0.
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table present**; **no `git add`/`commit` from executor**.

## Out of scope
- Verified Agents verification action (Task 313). `/admin/reports` (Task 310 follow-up). Any other admin route.
- Re-building or forking any canonical primitive. DB/schema/RLS changes. SSR data-fetch scope changes.
- Re-litigating Epic HH Decisions 1–7 or Sprint 28 Decisions 1–3 (fixed inputs).
