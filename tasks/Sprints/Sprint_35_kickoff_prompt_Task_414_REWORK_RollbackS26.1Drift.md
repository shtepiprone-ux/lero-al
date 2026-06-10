# Sprint 35 — Task 414 REWORK — Roll back the §26.1 action-row drift; keep Slice 2 scope-pure

**Type:** UI / overlay responsive migration (PRODUCT CODE) — corrective rework of Task 414 (Slice 2)
**Executor:** Sonnet 4.6
**Status:** OPEN — hand off immediately (blocks the Task 414 commit)
**Created by:** orchestrator, 2026-06-10, after the Task 414 diff review (owner decided: do NOT waive the §26.1 drift)
**Reviewer:** Opus 4.7 orchestrator (rendered + manual §26.2 review; does not write product code)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST**, then `docs/design-system.md §26` (esp. §26.1 vs §26.2, and the new §26.6 owner-approved exceptions). This is a SCOPE-RESTORATION task — its whole point is to remove work that Task 414 should not have included.

---

## Why this rework exists

The Task 414 diff introduced a **§26.1 change that the kickoff explicitly deferred to Slice 4** (kickoff "NOT in scope": *"§26.1 full-width control / action-button compliance → that is Slice 4. Do not pull it in here."*; AC: *"no §26.1 button work"*). In BOTH migrated modals the form action row was changed from a fixed right-aligned row to a mobile-stacked full-width row:

```
- <div className="flex justify-end gap-3 pt-2">                              (original)
+ <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">      (§26.1 drift — REMOVE)
```

`flex flex-col` makes Cancel/Save stack and stretch to full width `<sm` — that **is** §26.1 behaviour. The session log even self-contradicts (Part A calls it "§26.1 alignment, additive"; Confirmations claim "No §26.1 button work"). Owner ruling 2026-06-10: **do not waive — roll it back.** Task 414 must remain a clean Slice 2: *only* the raw `fixed inset-0` → canonical `Dialog` migration + bottom-sheet positioning proof. §26.1 full-width/stacked action buttons land in Slice 4.

---

## Scope — EXACTLY these changes, nothing else

### (1) Product code — revert the action row in BOTH migrated modals

In **`src/components/admin/AdminCurrenciesManager.tsx`** (`CurrencyFormDialog`) and
**`src/components/admin/AdminExchangeProvidersManager.tsx`** (`ProviderFormDialog`), change the
form action-row container back to the original:

```diff
- <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
+ <div className="flex justify-end gap-3 pt-2">
```

The Cancel and Save `Button`s inside it stay exactly as they are (`variant="outline"` Cancel,
`min-w-20` Save with `Loader2` on `isPending`). This is the ONLY product-code change. Do **not**
touch anything else in either file — the `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`
migration STAYS, every field STAYS, the `export` + props-type interface STAY.

### (2) Session-log wording corrections (`docs/sessions/2026-06-10-task414-slice2-overlay-popup-bottomsheet-compliance.md`)

- In **both** Part A control-inventory tables, the "Cancel/Save actions" row: replace the
  "§26.1 alignment, additive" After-cell with **"unchanged — kept `flex justify-end gap-3 pt-2`
  (§26.1 stacking deferred to Slice 4)"**.
- Replace **"Result: 10/10 stories §26.2-compliant"** (and the matching line in the Validation
  table) with: **"10/10 stories PASS the §26.2 bottom-sheet *positioning* contract; full §26.2 is
  NOT closed — ≥44px touch-target rows (Command 32px / Combobox 36px / StatusChangeControl-select
  36px) and interaction dismiss (backdrop tap + Esc + focus-return) proof are OUTSTANDING → routed
  to Task 415."**
- Remove the "Confirmations: No §26.1 button work" line's contradiction by keeping it TRUE after
  the rollback (after revert it is now accurate — leave it).

### (3) NOT in scope (do NOT do these here)

- Do NOT re-touch the `defaultOpen` threading, the new open-state stories, or the primitives.
- Do NOT add the <44px row fix or interaction proof (that is **Task 415**).
- Do NOT edit `design-system.md` — the §26.6 ListingGallery/AdminSidebar exceptions were already
  codified by the orchestrator on 2026-06-10. Just reference §26.6 in the session log.
- Do NOT emit git commands.

---

## Current behavior to preserve

Every field/label/validation/action/`isPending`/toast/`onClose` in both migrated dialogs stays
identical (the Task 414 before/after inventory still holds). The ONLY visible change from this
rework is the action row reverting to right-aligned `gap-3 pt-2` (no mobile full-width stacking).
At `<640` the Dialog still renders as the §26.2 bottom sheet (that is §26.2 positioning, owned by
the primitive — unaffected by the action-row revert).

## Positive flow (happy path)

1. Revert the two action-row containers as in (1).
2. Apply the three session-log wording corrections in (2).
3. `npx tsc --noEmit` → 0 new errors; `npm run lint` → 0 new; `npm run check:stories` /
   `check:i18n` / `check:story-coverage` → PASS; `npm run build-storybook` → builds.
4. File-integrity (clause 14) on the touched files (both `.tsx` + the session log): 0 NUL, no BOM,
   `tsc`/`node --check` clean, re-read tails. Paste the GREEN transcript.
5. Update the Files-Changed table to list exactly the 2 product files + the session log.
6. **Owner native gate (authoritative, clause 14):** the owner runs
   `npm run build-storybook && npm run screenshots:assert` **natively** → expected clean
   **2520/2520 PASS, 0 FAIL** (or an isolated retry of the 2 transient cells
   `Sheet/FilterRight×it×680` + `StatusChangeHistory/Empty×uk×2560` proving they pass on rerun).
   Paste the transcript into the session log as the AC2 proof. Sandbox/executor runs are a screen,
   not the verdict.

## Negative flow (every off-happy-path branch)

- **Tempted to also revert `gap`/`pt` to something other than `gap-3 pt-2`** → no; restore the
  EXACT original `flex justify-end gap-3 pt-2`.
- **Tempted to "improve" the action row to `[&>*]:max-sm:w-full` (the §26.1-correct container)** →
  NO. That is Slice 4. This task removes §26.1 work; it does not replace it with a different
  §26.1 treatment.
- **Native rerun still shows the 2 FAIL on rerun (not transient)** → STOP & ASK; do not mark
  green. If a fail is genuinely reproducible and unrelated, file it; do not absorb it into 414.
- **Any field/action would change** → A4 failure; only the action-row container className changes.

---

## Acceptance criteria

- Both modals' action row = `flex justify-end gap-3 pt-2` (no `flex-col`/`sm:flex-row`/full-width
  stacking). `grep -n "flex-col sm:flex-row" AdminCurrenciesManager.tsx AdminExchangeProvidersManager.tsx`
  returns nothing for the action rows.
- Dialog migration + all fields/actions/validation/states intact (unchanged from Task 414).
- Session log: "§26.1 alignment" wording removed; "10/10 §26.2-compliant" corrected to
  "positioning-compliant; touch-target + interaction proof outstanding → Task 415".
- `tsc=0 new`, `lint=0 new`, `check:stories`/`check:i18n`/`check:story-coverage`/`build-storybook`
  green; file-integrity GREEN.
- Owner native `screenshots:assert` transcript pasted = clean 2520/2520 (or proven-transient 2-cell
  retry).
- Files-Changed table = exactly `AdminCurrenciesManager.tsx`, `AdminExchangeProvidersManager.tsx`,
  the session log. Executor emits NO git commands.

## Final report required from Sonnet

1. The 2 action-row reverts (before/after line).
2. The 3 session-log wording corrections (quoted).
3. Validation + file-integrity transcripts.
4. Owner native `screenshots:assert` transcript (clean 2520/2520 or 2-cell retry proof).
5. Files-Changed table (3 rows).
6. Confirmation: no other product code touched; no §26.1 replacement introduced; no git commands.
