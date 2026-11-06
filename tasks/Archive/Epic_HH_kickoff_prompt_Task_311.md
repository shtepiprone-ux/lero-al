# Epic HH — Task 311 kickoff (Phase 5) — Residual admin modal standardisation (width tiers + destructive footer)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to the
> current P0 contract + Positive/Negative two-flow rule. Epic HH Phase 5. **SCOPE IS NARROW: the global all-popups
> bottom-sheet work (Sprint 32/33, committed) already solved mobile modal behaviour — this task only closes the
> RESIDUAL: width-tier assignment + destructive-action confirmation footer consistency.** Depends on the Sprint 34
> Task 309 Sheet pattern as reference.

```
Type:        refactor + UX (modal consistency)
Priority:    medium
Area:        every admin Dialog / Sheet / AlertDialog across admin routes (audit Task 305 produced the inventory in
             docs/admin-ux-rules.md §11-§12)
```

## Why this task exists (and why it is small now)
Task 305 specified canonical modal width tiers (sm 400 / md 560 / lg 720 / xl 960), the action-footer pattern, the
destructive-action confirmation pattern, and the mobile fallback. Sprint 32/33 then made **all popups full-width bottom
sheets at <640 globally** — so the MOBILE half of Phase 5 is already done and committed. What remains is the **desktop
(≥640) residual**: assign each admin modal its width tier, standardise the footer (primary/secondary button order),
and route every destructive action through the canonical `AlertDialog` confirmation. Do NOT re-touch the <640 bottom-sheet
behaviour (already canonical) except to verify it still holds.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/design-system.md` §14 (dialogs/sheets/dropdowns — incl. Task 373 scroll-clip + Sheet padding corrections).
3. `docs/admin-ux-rules.md` §11–§12 (Task 305 modal spec: width tiers, footer, destructive pattern, mobile fallback) +
   `docs/governance-reports/2026-05-30-task-305-admin-modal-audit.md` if present (the per-modal inventory).
4. `docs/rule-index.md` → "UI / layout / component task" + `docs/ai-behavior.md` Notes 19/20.
5. Read before editing: the canonical `dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx`; each admin modal you re-tier
   (managers under `src/components/admin/*` + their dialogs).
6. `package.json` validation scripts.

## Current behavior to preserve (Notes 19/20)
- Every admin modal's content, fields, actions, and submit/cancel handlers — preserve verbatim; this task changes
  WIDTH TIER + FOOTER ORDER + destructive-confirm wrapping, NOT the modal's function.
- The committed <640 bottom-sheet behaviour — preserve; only verify.
- Inventory each modal before/after in the session log (Note 20).

## 🔴 Mobile <640 full-width gate (clause 11) — verification, not change
At <640 every admin modal MUST already be a full-width bottom sheet (drag-handle, ≤90dvh scroll, Esc + backdrop close,
focus return). Verify this still holds for every modal you re-tier; if any modal regressed off the bottom-sheet contract,
fix it to canonical. ≥640 = the assigned width tier.

## Positive flow (happy path)
As admin at uk on each admin modal:
1. At ≥640 the modal opens at its assigned width tier (sm/md/lg/xl per §11–§12); footer = canonical order
   (secondary/Cancel left, primary/Confirm right or per the canonical pattern); content not clipped, scrolls per §14.
2. At <640 the modal is a full-width bottom sheet (verify).
3. Destructive actions (delete/revoke/clear) open the canonical `AlertDialog` confirmation before mutating.

## Negative flow (every branch needs a diff line)
- Destructive confirm cancelled (Esc/backdrop/Cancel) → no mutation, focus returns.
- Modal submit server error → error toast, modal stays open, no data loss.
- Long sq/en/uk/it content → scrolls within tier, no clip, no h-scroll at 320.
- Double-submit → primary disabled while pending.
- Locale mismatch → modal copy + buttons resolve in active locale, no raw key.

## Acceptance criteria
- Every admin modal assigned its width tier per §11–§12; footer order standardised; every destructive action wrapped in
  canonical `AlertDialog`.
- <640 bottom-sheet contract verified intact for every touched modal.
- Modal function/content/handlers preserved (before/after inventory; Note 20).
- Positive + every Negative branch verifiable in diff.
- **Rendered matrix (clause 12)**: representative modals × 320/375/390/640/768/1280/1440/2560 × sq/en/uk/it;
  uk@320/375/390 present. **`screenshots:assert` + `check:locale-leak` green (clause 13)** for any story touched.
- `tsc=0`, `lint=0`, `check:stories=0`, `check:i18n` parity PASS. `docs/backlog.md` + `docs/sessions/` updated;
  **Files Changed table**; **no git from executor**.

## Out of scope
- Re-doing the <640 bottom-sheet behaviour (committed). Public-site modals (owner-scoped extension only).
- Changing any modal's fields/handlers/business logic. Re-building canonical Dialog/Sheet/AlertDialog primitives.
