# Epic Y — Task 238 kickoff — Listing edit/create side-panel pattern + reachable status control + dirty-state Save

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to
> the current P0 contract + Positive/Negative two-flow rule. No scope change; STOP & ASK if ambiguous. Implements
> Epic Y Task 238 (source: `issues.txt` #29 + #99 status-control reachability). **Coordinate with Task 237** (same form).

```
Type:        feature + UX
Priority:    critical
Area:        src/modules/listings/components/ListingFormShell.tsx (the canonical listing form — cabinet AND admin)
             admin listing edit page + cabinet listing create/edit screens (verify both adopt the side panel)
             reference pattern: src/components/admin/AdminEditLayout.tsx (Task 196 / R.2 side-panel)
```

## Bug / Goal
Apply the Task 196 admin edit-screen **side-panel pattern** (`AdminEditLayout`) to the listing form on BOTH the cabinet
and admin paths. The right-hand side panel houses ALL action controls: **"Save changes", "Cancel", "Change status"**
(admin/moderator only), and any action that today sits in the main form area or is hidden entirely. Today the admin
**cannot change a listing's status** because the control is hidden/broken — this task makes it reachable and persistent.
**"Save changes" is disabled while `formState.isDirty === false`** and enables the moment any field changes.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/rule-index.md` → "Profile / edit-flow task" (ui-rules, component-rules, qa-rules, ai-behavior **Note 23**
   Edit-Flow Preservation) + "UI / layout / component task" (`design-system.md` §12 forms, §12a/§12b, §14, §16).
3. `docs/ai-behavior.md` Notes 19/20/**21 (Control Relocation)**/23.
4. `tasks/Epics/Epic_Y_Listing_Form_and_Lifecycle_UX.md` (Task 238 spec) + the Task 196 / R.2 session log
   (`AdminEditLayout` side-panel pattern, 2026-05-23).
5. Read before editing: `ListingFormShell.tsx` (every field + where Save/Cancel/status live today), `AdminEditLayout.tsx`
   (the reference side panel), `src/app/admin/users/[id]/page.tsx` (user-edit reference), the existing listing
   status-change server action, `react-hook-form` `formState.isDirty` usage in the form.
6. `package.json` validation scripts.

## Current behavior to preserve (Notes 19/20/21/23) — INVENTORY in session log BEFORE edit
- Every field, label, validation, and existing action on `ListingFormShell` (cabinet + admin) — list all.
- Where Save / Cancel / status currently live (main area? hidden? broken?).
- The existing **status-change server action** (name + signature) — the side-panel control MUST call it (no UI-only flip).
- Existing dirty/save behavior, success/error toasts, redirects, draft handling.
- Existing mobile behavior at 320 uk.

**Control Relocation Rule (Note 21):** this task changes WHERE Save/Cancel/Change-status appear (into the side panel) but
must NOT remove any capability. If a control becomes read-only anywhere, the editable location must ship in THIS task.
The task is incomplete if, after the change, the user/admin can no longer perform any action they could before.

## 🔴 Mobile <640 full-width gate (clause 11)
At `<640` the side panel **folds below the form content** (single column), full-width; Save/Cancel/Change-status buttons
are `max-sm:w-full`, ≥44px, labels wrap (sq/en/uk/it). "Change status" picker = full-width bottom sheet at <640 (canonical
Combobox/Select). No h-scroll at 320. Side-by-side (form + right panel) only at the documented `≥` breakpoint.

## Positive flow (happy path)
As admin/moderator at `uk` 375px on the admin listing edit screen:
1. Form fields render in the main column; the side panel (folded below at <640) holds Save / Cancel / Change status.
2. "Save changes" is **disabled** (form not dirty).
3. Edit any field → "Save changes" enables.
4. Open "Change status" → pick a new status (bottom-sheet picker) → it calls the existing status server action → status
   persists (no UI-only flip); success toast; the form/state reflects the new status after revalidation.
5. "Save changes" → persists field changes; success toast; dirty resets to false; Save disables again.
As a cabinet owner: same side-panel layout for create/edit (no "Change status" — that's admin/moderator only).

## Negative flow (every branch needs a diff line)
- Save with validation error → inline field errors + early return, no write, toast (locale key); dirty stays true.
- Save server error / 500 → error toast, no navigation, form retains edits.
- Change status server error → error toast, status NOT changed, picker reverts.
- Permission-denied (cabinet user sees "Change status"? must NOT) → control hidden/guarded server-side, not UI-only.
- Cancel → confirm flow (Task 239 covers the dead-confirm bug; here just ensure Cancel is present + wired); Esc/backdrop
  dismiss of any picker → closes, focus returns, no mutation.
- Not-dirty Save click is impossible (button disabled) — verify disabled state, not just hidden.
- Double-submit → pending disables Save.
- Locale mismatch → all side-panel labels + status options resolve in active locale, no raw key.

## Acceptance criteria
- Both screens (cabinet + admin) render the side-panel pattern: main column = fields, side column = Save/Cancel/Change
  status/other actions (folds below at <640).
- Admin/moderator can change listing status from the side panel via the existing server action; change persists (no
  UI-only flip).
- "Save changes" disabled when `!isDirty`; enabled on first change; resets after save.
- Before/after control inventory in session log (Note 20/21/23) — nothing dropped; relocated controls have a working
  new location.
- Positive + every Negative branch verifiable in diff.
- **Rendered matrix (clause 12)**: 320/375/390/768/1280/1440/2560 × sq/en/uk/it; uk@320/375/390 present; side-panel fold
  at <640 shown.
- `tsc=0`, `lint=0`, `check:i18n` parity PASS (any new side-panel/status labels ×4), `npm run build` passes.
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table**; **no git from executor**.

## Out of scope
- The cancel-confirmation no-op fix (Task 239 — separate). Underlying listing lifecycle (Epic R / Epic I).
- Raw-key labels (Y.1, done). The moderation preview (Task 237). Redesigning field-level form layout beyond relocating
  actions into the side panel.
