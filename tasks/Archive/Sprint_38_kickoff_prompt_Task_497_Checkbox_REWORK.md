# Task 497 — Checkbox primitive — REWORK (Sprint 38, Batch B)

> **Type:** UI / component (Mantine primitive CSS + session log). Mantine = source of truth.
> **Status:** Task 497 was NOT approved / NOT committed. Orchestrator review (2026-06-28, native-verified on
> HEAD `a6b4043`) found one real defect + one missing-artifact contract violation. This file is the corrective
> re-execution. Re-uses number 497 (nothing landed). Do the two fixes below and nothing else.

## Pre-read

`docs/agent-contract.md` (clauses 7, 9, 10, 12), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — none),
`docs/mantine-responsive-design-system.md` §18 (theming pitfalls), `docs/tailadmin-style-reference.md` §6f (Checkbox
state matrix — the authority), `docs/ui-rules.md`, `docs/qa-rules.md`. Read the current
`src/design-system/mantine/input-chrome.css` Checkbox block (lines ~92–135) and Mantine's
`node_modules/@mantine/core/esm/components/Checkbox/Checkbox.mjs` (line ~149: the input gets `mod: { error: !!error }`).

## What the review found (fix exactly these — do not re-scope)

### BLOCKER 1 — error-state selector is dead (the §6f error red border never renders)

In `input-chrome.css` the two error rules key on `[aria-invalid="true"]`:

```css
.mantine-Checkbox-input[aria-invalid="true"] { … }
.mantine-Checkbox-input[aria-invalid="true"]:checked { … }
```

Mantine v8 does **not** set `aria-invalid` on the Checkbox input. `Checkbox.mjs` renders the input with
`mod: { error: !!error }`, which emits **`data-error`** — the same attribute your TextInput/Select error rules in
this file already use correctly. So both Checkbox error rules never match: the unchecked red-6 border and the
checked+error "brand border wins" rule are both inert (the red *message text* still shows, which is why the
render looked OK). **Two things must change:**

1. **Attribute:** `[aria-invalid="true"]` → `[data-error]` (presence selector, matching the TextInput/Select pattern).
2. **Specificity:** a bare `.mantine-Checkbox-input[data-error]` (0,2,0) still LOSES to the resting rule
   `.mantine-Checkbox-input:not(:checked):not([data-checked])` (0,3,0), so the unchecked error border would still be
   overridden by gray-3. Raise the unchecked error rule's specificity to win, e.g.:

```css
.mantine-Checkbox-input[data-error]:not(:checked) {
  border-color: var(--mantine-color-red-6);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-red-6) 10%, transparent);
}
.mantine-Checkbox-input[data-error]:checked {
  border-color: var(--mantine-color-brand-7); /* checked+error: brand border wins, no ring */
  box-shadow: none;
}
```

Update the stale comment ("aria-invalid set by Mantine") to reference `data-error` / the `mod:{error}` source line.
**Confirm in DevTools that the error input actually carries `data-error`** before relying on the selector (Task 505/508 lesson).

### BLOCKER 2 — required session log is missing (AC-10 / clause 10)

`docs/sessions/2026-06-28-task497-checkbox.md` does not exist. Create it with: a **Files Changed** table (one row per
touched path + 1-line rationale), the AC-by-AC self-audit table, the **DevTools geometry/opacity/`data-error` proof**
(box 16px / radius 4px / checked brand-7 / disabled box+label opacity 0.5 / error input has `data-error`), the
**rendered verification matrix** (clause 12 — unchecked/checked/focus/**error-red-border**/disabled-faded/long-label-wrap
at uk@320/375/390 + en/sq/it@320), and the **planted-violation transcript** (remove the disabled label-dim OR the error
border → capture regression → revert). NO `git add` / `git commit` — the orchestrator emits at review.

## Out of scope (do NOT touch)

theme.ts (already correct: `size='xs'` 16px + `radius='sm'`, label 14px/gray-7, body min-h 44px), the disabled two-part
fade (already correct — box+label dim uniformly at 0.5), resting/focus rules, the story file, the §6f reference, the
locale keys (parity already PASSES 2000×4), and every other component. Inputs' §6e rules untouched.

## Positive / negative flow

- **Error (negative) — THE FIX:** `error` prop set → unchecked box shows **red-6 border + ring**; checked+error shows
  **brand-7 border, no red ring**. Verify both, rendered, with the box border color confirmed (not just the message text).
- **Disabled (negative):** unchanged — box + label both opacity 0.5, not-allowed, no ring. Re-verify it still holds after the edit.
- **Checked / focus / resting:** unchanged — spot-check no regression from the error-rule edit.

## Mobile <640 gate

Unchanged from 497: box+label row full-width at <640, ≥44px tap target, label wraps in all 4 locales, no clip/h-scroll at 320.

## Acceptance criteria

1. Error rules use `[data-error]` (not `aria-invalid`) AND the unchecked error rule out-specifies the resting rule so the
   red-6 border actually renders; checked+error shows brand-7 border. DevTools shows the input carries `data-error`.
2. Session log `docs/sessions/2026-06-28-task497-checkbox.md` created with Files Changed table + AC self-audit + DevTools
   proof + rendered matrix (incl. the error-red-border cell at uk@320/375/390) + planted-violation transcript.
3. No regression in resting/focus/checked/disabled/long-label (re-verified rendered).
4. Gates green: tsc=0, `check:stories`, `check:i18n` (still 2000×4), `check:design-tokens`, `check:mojibake`.
5. File-integrity (clause 14) transcript for every touched file.
6. `docs/backlog.md` Last Session updated. NO `git add`/`git commit`.

## Hard contract

Scope = `input-chrome.css` (Checkbox error rules + comment only) + new session log + `docs/backlog.md`. Nothing else.
STOP-and-ASK if DevTools shows the error input does NOT carry `data-error` (then the attribute assumption is wrong —
report the real attribute, do not guess). Self-validate before claiming complete (tsc=0 + rendered error-red-border proof at uk@320).
