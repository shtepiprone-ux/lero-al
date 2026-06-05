# Epic DD — Task 246 kickoff — Admin can clear change history (gated + audited, per-row AND per-entity)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to
> the current P0 contract + Positive/Negative two-flow rule. Implements Epic DD Task 246 (source: `issues.txt` #26).
> Dependency Task 250 (R.3a role_permissions + role_permission_events) is SHIPPED. **🚩 STOP & ASK before adding a
> SECOND audit table — reuse `role_permission_events` with a new `event_type` if the owner approves.**

```
Type:        feature
Priority:    medium
Area:        every admin surface that displays a change-history list (start: src/components/admin/AdminUserProfile.tsx
             user history block) — INVENTORY all history surfaces first; do NOT invent new ones.
```

## Bug / Goal
Give admins a controlled "clear history" operation on the admin surfaces that display change history, with **two scopes**
(owner directive): **per-row clear** (each history row has its own clear control) AND **per-entity clear** ("Clear
history" at the top of the surface clears all rows for that entity). Both **permission-gated** (`audit.clear_history`,
default true for admin, default false for moderator — R.3a default-deny philosophy), **confirmed** (canonical Dialog),
and **audited** (an event row per clear). Server-side RLS enforcement, not UI-only hiding.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/rule-index.md` → "DB / server action / RLS task" + "Admin table / admin control task" → `data-access-rules`,
   `rls-rules` (default-deny for moderators), `domain-rules`, `component-governance §11`, `qa-rules`,
   `design-system.md` (§10 lists, §14 dialogs, §16), `ai-behavior` Notes 20/22.
3. `tasks/Epics/Epic_DD_Admin_Audit_and_History_Hygiene.md` (Task 246 spec) + Task 250 session log
   (`role_permissions` + `role_permission_events` audit pattern — the model for this clear-history audit).
4. Read before editing: `AdminUserProfile.tsx` (the user history block + how history rows render), the existing
   permission-check helper (`role_permissions` / `setModeratorPermission` / `getPermissionEvents`), the canonical
   `dialog.tsx` + canonical Toast, `AdminTable`/`AdminCardList` if a history list uses them.
5. `package.json` validation scripts.

## Required investigation
1. **Inventory every admin surface that displays a change-history list** (user profile history is confirmed; check
   listing history, location history, email-template history, etc.). List them in the session log; do NOT invent
   surfaces the project does not have.
2. Confirm the `audit.clear_history` permission key wiring (extend the `role_permissions` matrix; default admin=true,
   moderator=false). Exact idempotent seed SQL in the session log (single-writer; owner runs it).
3. **Audit-of-the-clear:** STOP & ASK whether to reuse `role_permission_events` (new `event_type='history_cleared'`)
   or add a dedicated table. Do NOT add a second audit table without owner approval.
4. Confirm server-side RLS denies the clear for moderators lacking the permission (not just hidden in UI).

## Current behavior to preserve (Notes 19/20/22)
- Every existing control on each history-bearing surface — inventory before/after; nothing removed.
- The history LISTS themselves keep rendering exactly as today; this task ADDS clear controls, it does not restructure
  the history display.
- Existing permission matrix behavior + audit-event rendering unchanged except for the added key/event_type.

## 🔴 Mobile <640 full-width gate (clause 11)
The confirm `Dialog` = full-width bottom sheet at <640 (Esc + backdrop close, focus return). Per-entity "Clear history"
button `max-sm:w-full`, ≥44px; per-row clear is an icon Button (**exempt as icon-only — justify in log**, ≥44px tap area).
Labels wrap (sq/en/uk/it). No h-scroll at 320.

## Positive flow (happy path)
As an admin at `uk` 375px on a history-bearing surface:
1. Each history row shows a clear (trash) icon Button; the surface top shows a "Clear history" button.
2. Click per-row clear → confirm Dialog (text distinguishes per-row) → confirm → ONLY that row is deleted; success toast;
   an audit event is written (who, when, entity, row id).
3. Click per-entity "Clear history" → confirm Dialog (text distinguishes per-entity) → confirm → all rows for THAT entity
   deleted (entity A's clear never touches entity B); success toast; audit event written (who, when, entity, row count).

## Negative flow (every branch needs a diff line)
- **Moderator without `audit.clear_history`** → controls hidden in UI AND the server action denies (RLS) → no delete.
- Cancel/dismiss confirm (Esc/backdrop/Cancel) → nothing deleted, focus returns.
- Server error → error toast, no delete, no audit event.
- Empty history (nothing to clear) → per-entity button disabled or no-op with message; no audit event for a no-op.
- Double-submit → confirm action disabled while pending.
- Cross-entity safety → per-entity clear scoped to its own entity only (verify in the diff query/filter).
- Locale mismatch → confirm copy + toasts resolve in active locale, no raw key.

## Acceptance criteria
- Per-row clear on every row + per-entity "Clear history" on every history-bearing admin surface (canonical icon Button /
  Button + confirm Dialog distinguishing per-row vs per-entity; i18n ×4).
- Both gated by `audit.clear_history` (moderator default-deny, enforced server-side via RLS).
- An audit event inserted on every clear (who, when, entity, row id(s) OR count) — reused/added table per owner decision.
- Cross-entity isolation guaranteed; global "clear ALL" is OUT OF SCOPE.
- Before/after control inventory (Note 20/22); exact idempotent SQL in session log (single-writer).
- Positive + every Negative branch verifiable in diff.
- **Rendered matrix (clause 12)**: 320/375/390/768/1280/1440/2560 × sq/en/uk/it; uk@320/375/390 present.
- `tsc=0`, `lint=0`, `check:i18n` parity PASS, `npm run build` passes.
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table**; **no git from executor**.

## Out of scope
- A global "clear ALL history across the system" sweep. Auto/time-based history pruning. Adding new history surfaces.
- Changing the role_permissions UI beyond adding the `audit.clear_history` key.
