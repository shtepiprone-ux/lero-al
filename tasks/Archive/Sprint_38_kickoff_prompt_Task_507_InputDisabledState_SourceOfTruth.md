# Task 507 — Input disabled-state → source-of-truth (faded transparent, not gray box) — Sprint 38 corrective

> **Type:** UI / component styling (`input-chrome.css`). Global across all Mantine text inputs.
> **Why:** Owner rejected (Task 500 review): disabled text fields render with a **completely different style than
> the source of truth** — Mantine fills them with a solid gray box. Source of truth (`src/components/ui/input.tsx`:
> `disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50`; + TailAdmin demo `opacity-50 + cursor-not-allowed`)
> = a **faded transparent field**, NOT a gray fill. Fix once, globally, for TextInput / Textarea / PasswordInput / Select.

## Pre-read

`docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan),
`docs/mantine-responsive-design-system.md`, `docs/tailadmin-style-reference.md` §6, `docs/ui-rules.md`,
`docs/component-rules.md`, `docs/qa-rules.md`. Read `src/components/ui/input.tsx` (the source-of-truth disabled classes)
and `src/design-system/mantine/input-chrome.css` (where the fix goes).

## Mantine's current disabled mechanism (confirmed in `@mantine/core/styles/Input.css` L219–233)

```css
.m_8fb7ebe7:disabled, .m_8fb7ebe7[data-disabled] {
  cursor: not-allowed; opacity: 0.6;
  background-color: var(--input-disabled-bg);   /* = var(--mantine-color-disabled) → the GRAY FILL owner rejects */
  color: var(--input-disabled-color);
}
.m_8fb7ebe7:has(input:disabled) { /* same — used by composite inputs (PasswordInput) */ }
```

So Mantine: `not-allowed` ✅ + `opacity 0.6` + **solid gray `background-color`** (the defect) + dimmed color.
Target (source of truth): transparent bg + `opacity 0.5` + `not-allowed` → a faded version of the resting field.

## The fix — extend `src/design-system/mantine/input-chrome.css`

Append (tokens only; override Mantine's gray fill with transparent, set opacity 0.5):

```css
/* Disabled — source-of-truth (src/components/ui/input.tsx + TailAdmin demo): a FADED TRANSPARENT field
   (opacity 0.5 + not-allowed), NOT Mantine's solid gray --input-disabled-bg fill. */
.mantine-TextInput-input:disabled,      .mantine-TextInput-input[data-disabled],
.mantine-Textarea-input:disabled,       .mantine-Textarea-input[data-disabled],
.mantine-Select-input:disabled,         .mantine-Select-input[data-disabled],
.mantine-PasswordInput-input[data-disabled],
.mantine-PasswordInput-input:has(input:disabled) {
  background-color: transparent;        /* kill Mantine's gray --input-disabled-bg */
  opacity: 0.5;                         /* source opacity-50 (was Mantine 0.6) */
  cursor: not-allowed;
}
```

**Specificity note (verify):** our `…-input:disabled` is (0,1,1), tying Mantine's `.m_8fb7ebe7:disabled` (0,1,1) →
our later-imported file wins; `…-input[data-disabled]` (0,2,0) ties Mantine's (0,2,0) → wins. `input-chrome.css` is
already imported after `@mantine/core/styles.css` (Task 505). Do NOT put any of this in `theme.ts` inline `styles`
(inline can't carry `:disabled`/`[data-disabled]`/`:has`).

## 🔴 Mandatory runtime confirmation BEFORE relying on selectors (Task 505/506 lesson)

In DevTools, for EACH of the 4 input types in its disabled story, confirm which selector actually carries the disabled
state on the bordered element: `:disabled` (real attr on the `<input>`), `[data-disabled]` (on the Mantine box), or
`:has(input:disabled)` (PasswordInput outer box). Paste the evidence. If any type uses a selector not in the rule above,
add it. Especially confirm PasswordInput (outer `.mantine-PasswordInput-input` + inner `.mantine-PasswordInput-innerInput`).

## Current behavior to preserve

Resting / focus / error / placeholder chrome unchanged (Task 505). Only the disabled appearance changes: gray fill →
transparent + opacity 0.5. The disabled field stays non-interactive (not-allowed, no focus ring). For PasswordInput the
reveal toggle stays dimmed + non-interactive (the box opacity cascades to it — confirm it's not separately re-opaqued).

## Positive / negative flow

- **Disabled:** field shows the resting border + placeholder/value **faded to opacity 0.5 over a transparent bg**, cursor
  not-allowed, no focus ring — NOT a solid gray box. Verify for TextInput, Textarea, PasswordInput (box + toggle), Select.
- **Enabled (regression):** resting gray-2 border, focus brand-3, error red-6 all still correct (Task 505 unaffected).
- **No red/focus leak** into disabled.

## Mobile <640 gate

Disabled fields full-width at <640, no clip/overflow/h-scroll at 320, all 4 locales. Mantine proof path.

## Acceptance criteria

1. `input-chrome.css` extended with the disabled rule above (transparent bg + opacity 0.5 + not-allowed), covering
   TextInput / Textarea / Select (`:disabled` + `[data-disabled]`) and PasswordInput (`[data-disabled]` + `:has(input:disabled)`).
2. DevTools selector-confirmation pasted for all 4 input types' disabled state.
3. **RENDERED PROOF (clause 12/13):** disabled story cell of EACH of the 4 input types at uk@320/375/390 (+ en/sq/it@320)
   showing a **faded transparent field, not a gray box**, side-by-side note vs `src/components/ui/input.tsx` disabled look.
4. **Planted-violation transcript:** temporarily restore Mantine's gray fill (remove the `background-color: transparent`)
   and capture the gray box returning — proves the override is real — then revert.
5. Enabled-state regression proof: one resting + one error cell per type still correct (Task 505 intact).
6. Gates: tsc=0, `check:stories`, `check:i18n` (unchanged), `check:design-tokens`, `check:mojibake` — green.
7. File-integrity (clause 14) transcript for `input-chrome.css`.
8. `docs/backlog.md` Last Session + `docs/sessions/2026-06-27-task507-input-disabled-state.md` (Files Changed table).
   NO `git add`/`git commit` — orchestrator emits at review.

## Critical-flow note

Presentation-only. Scan registry; no new unit test mandated — AC-3 rendered proof + AC-4 planted-violation are the evidence.

## Hard contract

Scope = `input-chrome.css` + session log/backlog ONLY. No `theme.ts` change, no other component, no token-value change.
This task UNBLOCKS Task 500 (PasswordInput): after 507 lands and the owner re-approves the disabled render across all
inputs, Task 500 + 507 commit together. STOP-and-ASK if: source-of-truth disabled intends a faint `bg-input/50` tint
rather than fully transparent (current spec = transparent + opacity, matching the TailAdmin demo). Self-validate before
complete (tsc=0 + DevTools selector proof + rendered faded-field proof at uk@320 for all 4 input types).
