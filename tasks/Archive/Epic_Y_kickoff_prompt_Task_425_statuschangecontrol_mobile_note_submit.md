# Task 425 — StatusChangeControl: mobile full-width compliance for the action submit button(s)

**Epic:** Y — Listing Form & Lifecycle UX (follow-up spun out of Task 238 review) · **Type:** UI / canonical-component responsive fix · **Priority:** P0 (owner mobile <640 full-width gate)
**Area:** the canonical `src/components/admin/StatusChangeControl.tsx` (used by the listing edit side-panel — Task 238 — and any admin status surface)
**Date:** 2026-06-14 · **Task #:** 425 (next free; bumps `Last task number` → 426)
**Kickoff author:** Opus orchestrator. Executor: Sonnet 4.6. **Sonnet reads THIS FILE directly — single source of truth for scope.**

---

## 0. Why this exists

Task 238 reused `StatusChangeControl` (`variant="select"`, `enableNote`) in the listing edit side-panel. Kickoff §4 of 238 required the note **submit button** to be full-width at `<640` (`max-sm:w-full`, `min-h-11`), but 238 was (correctly) fenced from redesigning the canonical component (238 §10 / §1.3). So the fix belongs here, as a surgical canonical-component change that benefits **every** consumer (Note 14 — global change, no diverging call sites).

## 1. Pre-read (rule-index: UI / layout / component + Storybook)

Always: `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.
Required:
- `docs/design-system.md` — **§24 forbidden hardcodes, §25 control-preservation, §26 mobile <640 full-width + bottom-sheet gate, §27 Storybook proof contract**.
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- `docs/storybook-governance.md` (§14 enforced gates) + `docs/design-system.md §27`.

Reference (read, change only what §6 lists):
- `src/components/admin/StatusChangeControl.tsx` — the component (both `variant="select"` and `variant="workflow"`).
- `src/components/admin/StatusChangeControl.stories.tsx` — existing stories (add coverage if a mobile cell is missing).
- `scripts/check-stories-rendered.mjs` — `ASSERT_STORIES` registry.

## 2. Current behavior to preserve (action-by-action — verify each still works in the diff)

- `variant="select"`: a canonical `Combobox variant="button"` trigger fires the status change on selection; when `enableNote`, a `Textarea` + a `size="sm"` submit `Button` render below it. Selecting a status calls `handleSubmit`; `try/await onSubmit → toast.success(status_change_success)`, `catch → toast.error(status_change_error)`; `finally` clears `pending`. Same-status is a guarded no-op (`if (toStatus === currentStatus) return`).
- `variant="workflow"`: a wrap row of transition **chips** (already `min-h-11`, multi-select cluster — these stay a wrap cluster, NOT each full-width), a note `Textarea`, a required-note hint, and a single `size="sm"` submit `Button`.
- `disabled`/`pending` wiring, `aria-label`, history list, note-required logic, toasts, and all i18n keys (`admin.common.status_control.*`) — unchanged.

**Nothing above may change behaviorally (clause 3/5). This is a CSS/responsive-class-only change to the action submit buttons.**

## 3. Required after-behavior

1. The **select-variant note submit button** (`StatusChangeControl.tsx` ~`:130`) gains `max-sm:w-full max-sm:min-h-11` (full-width, ≥44px touch target at `<640`), keeping `size="sm"` look at `≥640`.
2. The **workflow-variant submit button** (~`:207`) gets the same `max-sm:w-full max-sm:min-h-11` treatment (Note 14 — fix every sibling, no diverging call site).
3. The note `Textarea`(s) already fill width (block) — confirm no clip/overflow at 320; no change expected.
4. **Verify-only (no change unless broken):** the select-variant `Combobox variant="button"` trigger is already full-width + bottom-sheet at `<640` (Task 421 tokens). If the rendered screenshot shows it is NOT full-width at `<640`, **STOP and ASK** — do not patch the Combobox here.
5. Transition **chips** (workflow variant) remain a `flex-wrap` cluster (each chip intrinsic width, `min-h-11`) — they are an explicit exemption (cluster, not a single CTA); document this in the inventory.
6. No behavior, no label, no transition-logic, no i18n change.

## 4. 🔴 Mobile <640 full-width gate (OWNER P0)

Both action submit buttons full-width edge-to-edge at `max-sm`, `min-h-11`, labels wrap (`whitespace-normal break-words` — already present on workflow chips; ensure submit labels wrap), no horizontal scroll at 320, in all of sq/en/uk/it. Icon-only/cluster exemption: the workflow transition chips only — documented per §3.5.

## 5. Positive flow

Staff opens a surface using `StatusChangeControl` at <640: the note submit button (select) and the action submit button (workflow) render full-width, ≥44px tall; tapping behaves exactly as today (select: note rides along the Combobox selection; workflow: submits the selected transition).

## 6. Negative flow (each needs a verifiable line in the diff)

- Disabled state (`disabled || pending`, and select-note `!note.trim()`) still visually disables the now-full-width button — unchanged logic, verify.
- Same-status no-op guard intact (`:82`).
- Error path: `catch → toast.error(status_change_error)` intact.
- Locale: long sq/en/uk/it submit labels wrap inside the full-width button, never clip at 320.
- Workflow note-required hint still shows when required and empty.

## 7. i18n, inventory, rendered evidence

- **i18n:** 0 new keys expected (CSS-only). If any string is touched, full sq/en/uk/it parity (clause 7) — but none should be.
- **Control inventory (Note 20):** before/after table for both variants' buttons showing only the responsive-class delta; confirm nothing removed and chips remain a documented cluster exemption.
- **Rendered evidence (clause 12/13 — machine-produced):** ensure `StatusChangeControl` select **and** workflow stories (with the submit button visible — `enableNote` / a selected transition) are in `ASSERT_STORIES`; run `npm run build-storybook` (`check:stories` green) then `npm run screenshots:assert`; paste the real `Results: N/N PASS, 0 FAIL` with **uk@320/375/390 mandatory cells** showing the submit button filling the <640 frame. A passing assert plus the `max-sm:w-full` in the diff are BOTH required (the class in the diff AND the pixel in the screenshot).

## 8. Acceptance criteria (each verifiable in the diff)

1. Select-variant note submit button: `max-sm:w-full max-sm:min-h-11`. [§3.1; file:line]
2. Workflow-variant submit button: same. [§3.2; file:line]
3. No behavioral/label/transition/i18n change — pure responsive-class delta. [§2/§3.6; diff is class-only]
4. Combobox trigger verified full-width <640 (screenshot), unchanged. [§3.4]
5. Chips documented as cluster exemption. [§3.5]
6. Rendered matrix with uk@320/375/390 proving both buttons full-width at <640. [§7; clause 12/13]
7. `tsc`=0; `lint` 0 new; `check:stories` + `screenshots:assert` green; `check:file-integrity:all` green. Paste transcript.

## 9. Hard contract + expected files

- CSS/responsive-class-only; no scope creep (clause 1); no behavior change (clause 3/5); STOP&ASK on any ambiguity (clause 2) — esp. if the Combobox trigger is NOT already full-width.
- Self-validate before complete (clause 9); read back every file, integrity green (clause 14).
- Update `docs/backlog.md` + add a session log under `docs/sessions/` with a "Files Changed" table. Do **NOT** run git (single-writer); the orchestrator emits commit commands at review.

Expected files: `src/components/admin/StatusChangeControl.tsx`, possibly `src/components/admin/StatusChangeControl.stories.tsx` (only if a mobile/submit-visible cell is missing), possibly `scripts/check-stories-rendered.mjs` (if new story IDs), `docs/backlog.md`, `docs/sessions/2026-06-14-task425-statuschangecontrol-mobile-note-submit.md`.

## 10. Out of scope

- Any change to `applyListingTransitionByStatus`, the transition engine, or status semantics.
- Redesigning the Combobox, the chip cluster, the history list, or the note-required logic.
- The `enableNote`-in-select redundant-submit behavior (the note rides the Combobox selection) — that is a separate design question; do NOT "fix" it here.
