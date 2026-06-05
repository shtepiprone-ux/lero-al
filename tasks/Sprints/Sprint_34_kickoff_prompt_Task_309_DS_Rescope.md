# Sprint 34 — Task 309 (DS RE-SCOPE) — Migrate `/admin/support` + `/admin/inquiries/support` + `/admin/inquiries/sales` to canonical `AdminPageShell` + `AdminCardList` + `StatusChangeControl` + Sheet detail

> **SUPERSEDES** `tasks/Sprints/Sprint_28_kickoff_prompt_Task_309.md` (original, pre-DS-commit). The original's
> behavioral inventory + Positive/Negative flows remain ACCURATE and are a **mandatory pre-read** — this file does
> NOT repeat them; it re-grounds on the committed Design System and adds clause-11/12/13 gates.
> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** No scope
> change; STOP & ASK if ambiguous.

```
Type:        refactor + UX (workflow-surface migration onto committed canonical primitives)
Priority:    HIGH (owner-flagged admin-mobile surfaces; status-workflow inconsistency)
Area:        src/components/admin/AdminSupportManager.tsx     (full migration; inline workflow block → StatusChangeControl variant="workflow"; detail = Sheet on <md)
             src/components/admin/AdminInquiriesManager.tsx    (finalize AdminCardList + StatusChangeControl variant="select" + Sheet detail)
             src/app/admin/support/page.tsx + .../inquiries/support/page.tsx + .../inquiries/sales/page.tsx (verify shell wrapping; no SSR scope change)
```

## What changed since the Sprint 28 original
1. `StatusChangeControl<S>` is **committed** with both variants. The AdminSupportManager inline workflow block
   (pills + note + Update + timeline) is the canonical `variant="workflow"` reference; migrating it is a
   **parameterization**, not a redesign — on-screen UX is identical, implementation moves into the shared primitive.
2. `AdminCardList`, `AdminPageShell`, `StatusChangeHistory` are committed — use as-is.
3. **All popups are committed as full-width bottom sheets at <640** (Dialog/Sheet/Select/Combobox/Popover). The
   detail panel on `<md` MUST be a `Sheet` bottom-drawer per `docs/design-system.md` §14 + admin-ux-rules §11–§12
   (Epic HH Decision 5). If the current detail surface is an inline panel (no modal), STOP & ASK before converting.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/design-system.md` §9, §10, §11, §12a/§12b, **§14 dialogs/sheets/dropdowns**, §16.C, §17, §20/§21.
3. `docs/rule-index.md` → "Admin table / admin control task" bundle + `docs/admin-ux-rules.md` §1–§13
   (esp. §11–§12 modal/sheet spec + §13 StatusChangeControl).
4. `docs/ai-behavior.md` Notes 18/19/20/21/22/23 (ALL).
5. **`tasks/Sprints/Sprint_28_kickoff_prompt_Task_309.md`** — original inventory + Positive/Negative (authoritative
   for AdminSupportManager + AdminInquiriesManager current behavior, incl. `CreateTicketDialog`, type/status filters,
   TicketDetail workflow block lines, auto-status-bump-on-reply).
6. Read in the tree before editing: `AdminSupportManager.tsx`, `AdminInquiriesManager.tsx`,
   `StatusChangeControl.tsx`, `AdminCardList.tsx`, `AdminPageShell.tsx`, the canonical `sheet.tsx`.
7. `package.json` validation scripts.

## Localization coverage
sq / en / uk / it — ticket/inquiry meta, type + complaint-type + status badges, filter labels, workflow pill labels,
note placeholder, Update/submit labels, reply composer, CreateTicketDialog fields. Preserve existing on-screen wording
(re-map to `admin.common.status_control.*` only per Task 328, never change the visible text). Runtime-confirm all 4.

## Responsive coverage
320 / 375 / 390 / 768 / 1280 / 1440 / 2560 — **uk@320/375/390 mandatory.**

## Current behavior to preserve
Use the **verbatim Sprint 28 original inventory**: AdminSupportManager (CreateTicketDialog dual flow support+complaint,
type tabs all/support/user_complaint, status chips, table→row-click→TicketDetail, workflow block, history timeline,
`updateTicketStatus`); AdminInquiriesManager (status tabs, mailbox scope prop, card-row list, detail panel, reply
thread+composer, `StatusChangeControl variant="select"`, auto-bump new→in_progress on reply). Re-verify as a
before/after control inventory (Note 20/22). The workflow block + Combobox status UX are **relocated** into the
canonical primitive (Note 21), never removed; auto-bump, note, and timeline semantics preserved verbatim.

## 🔴 Mobile <640 full-width gate (clause 11) — surfaces in scope
- Page header (title + count badge + "Create ticket" CTA) stacks full-width; CTA `max-sm:w-full`.
- Type/status filter tabs + any search: full-width / wrap at `max-sm`, ≥44px; segmented tabs single canonical style.
- List metaphor at `<md`: `AdminCardList` card-rows (workflow surfaces), edge-to-edge, clear row separation.
- **Detail panel = full-width bottom-sheet `Sheet` at <640** (drag-handle, ≤90dvh internal scroll, Esc + backdrop
  close, focus return). StatusChangeControl pills + note + submit full-width; long labels wrap.
- Exemptions (icon-only, justify each): any icon-only action in a row/footer.

## Required after behavior (literal — see Sprint 28 original Positive flow)
As admin at `uk` 375px: `/admin/support` renders header + filters full-width; tickets as `AdminCardList` card-rows; tap
a row → **Sheet bottom-drawer** with ticket meta + `StatusChangeControl variant="workflow"` (same allowed transitions,
optional note, Update submit) + `StatusChangeHistory` timeline; submit → status persists via `updateTicketStatus` +
toast + timeline appends. `/admin/inquiries/support` + `/sales`: same shell + card-list + Sheet detail +
`StatusChangeControl variant="select"`; replying auto-bumps new→in_progress and sends via existing action.
CreateTicketDialog opens as full-width bottom sheet at <640, both flows (support/complaint) intact.

## Negative flow (every branch needs a diff line — minimum)
status update server error → error toast + no status change + no timeline append; reply send error → error toast,
no auto-bump, composer retains text; permission-denied (RLS/role) → guarded, no mutation; double-submit → pending
disabled; Sheet dismiss (Esc/backdrop) → closes, focus returns, no mutation; empty list → empty state; loading →
loading state; CreateTicketDialog validation error → inline message + early return, no row created; locale mismatch →
no raw keys; mailbox scope mis-set → STOP & ASK (do not guess sales/support divergence).

## Acceptance criteria
- AdminSupportManager + AdminInquiriesManager render via `AdminPageShell` + `AdminCardList`; detail = `Sheet` on `<md`.
- Status UX via `StatusChangeControl` (`workflow` for support, `select` for inquiries); transitions/note/timeline/
  auto-bump preserved verbatim; CreateTicketDialog dual flow preserved.
- Every Sprint-28-inventoried control preserved (before/after inventory; Notes 20/21/22/23).
- Positive + every Negative branch verifiable in diff.
- **Rendered matrix (clause 12)** in session log; **`screenshots:assert` + `check:locale-leak` green (clause 13)**.
- `tsc=0`, `lint=0`, `check:stories=0`, `check:i18n` PASS, `check:locale-leak` 0.
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table**; **no git from executor**.

## Out of scope
- `/admin/reports` migration (Task 310 follow-up). Any other admin route. Verified Agents (Task 313).
- Real-time chat. DB/schema/RLS changes. Re-building any canonical primitive.
- Re-litigating Epic HH / Sprint 28 fixed decisions.
