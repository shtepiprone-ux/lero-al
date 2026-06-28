# Task 508 — Disabled state dims LABEL + ICON (whole control), not just field

**Date:** 2026-06-28  
**Sprint:** 38 corrective  
**Status:** CODE COMPLETE — awaiting orchestrator rendered-proof review

## Root cause (Task 507 gap)

Task 507 applied `opacity: 0.5` only to `.mantine-*-input` elements. Mantine's label (`.mantine-InputWrapper-label`) and trailing icons (`.mantine-Select-section` chevron, PasswordInput reveal button) are **siblings** of the input — they receive no cascade from `:disabled`/`[data-disabled]` on the input. Result: field faded, label + icon stayed full-strength.

Source of truth (§6e): label + field + trailing icon all dim to opacity 0.5 uniformly.

## Implementation: two-part rule

### Problem with naive approach
If root gets `opacity: 0.5` AND Mantine's input-level `opacity: 0.6` still applies, the input's visual opacity = `0.5 × 0.6 = 0.3` (double-stacked). Label and icon would be at `0.5 × 1 = 0.5`. Uneven.

### Solution
**Part 1** — Root-level `:has(:disabled)` / `:has([data-disabled])` sets `opacity: 0.5` on the outermost wrapper for each primitive. This composites all children (label, input, chevron, reveal toggle) at 0.5.

**Part 2** — Per-element rule resets Mantine's input-level `opacity: 0.6 → 1` so the root's 0.5 is the only multiplier. Also sets `background-color: transparent` (kills Mantine's gray fill) and `cursor: not-allowed`.

Visual result: root `0.5 × 1 (input override) = 0.5` for the input, `0.5 × 1 = 0.5` for label and icon. All uniform.

## Changes made

| File | Change |
|------|--------|
| `src/design-system/mantine/input-chrome.css` | Replaced Task 507 disabled block with two-part rule: (1) root-level `opacity:0.5` via `:has(:disabled)`/`:has([data-disabled])` on each primitive's `-root` class; (2) per-element `background-color:transparent; opacity:1; cursor:not-allowed` |
| `src/stories/mantine/primitives/Select.stories.tsx` | Updated disabled section caption: "whole control faded (label + field + chevron → opacity 0.5)" |
| `src/stories/mantine/primitives/PasswordInput.stories.tsx` | Updated disabled section caption: "whole control faded (label + outer box + reveal toggle → opacity 0.5)" |

## Selector coverage

| Primitive | Root selector (Part 1) | Input selector (Part 2) |
|-----------|------------------------|-------------------------|
| TextInput | `.mantine-TextInput-root:has(:disabled)` + `:has([data-disabled])` | `.mantine-TextInput-input:disabled` + `[data-disabled]` |
| Textarea | `.mantine-Textarea-root:has(:disabled)` + `:has([data-disabled])` | `.mantine-Textarea-input:disabled` + `[data-disabled]` |
| Select | `.mantine-Select-root:has(:disabled)` + `:has([data-disabled])` | `.mantine-Select-input:disabled` + `[data-disabled]` |
| PasswordInput | `.mantine-PasswordInput-root:has(:disabled)` + `:has([data-disabled])` | `.mantine-PasswordInput-input[data-disabled]` + `:has(input:disabled)` |

## Gate results

- tsc = 0 ✅
- `check:stories` = 85 files, 0 violations ✅
- `check:i18n` = 1997 keys (unchanged) ✅
- `check:design-tokens` = 0 violations ✅
- `check:mojibake` = 0 artifacts ✅

## Rendered proof required (orchestrator, AC2–AC5)

For each of the 4 primitives:
- **AC2 DevTools:** computed `opacity` of label / field / icon must all read `0.5` (not 1, not 0.25/0.3)
- **AC3 Rendered:** label AND icon faded alongside field; uk@320/375/390 + en/sq/it@320
- **AC4 Planted-violation:** remove Part 1 root rule → label/chevron snap back to full strength (field stays faded at Mantine's 0.6) → revert
- **AC5 Regression:** resting gray-2 / focus brand-3 / error red-6 still correct for all enabled primitives

Task 495 (Select) is closed by this task's Select disabled proof.

## NO git add/git commit — orchestrator emits at review
