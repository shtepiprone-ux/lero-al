# Task 508 — Disabled state must dim LABEL + ICON, not just the field (all input primitives) — Sprint 38 corrective

> **Type:** UI / component styling (`input-chrome.css`). Global across all Mantine text inputs.
> **Supersedes the incomplete part of Task 507.** Task 507 made the disabled *field* a faded transparent box (good),
> but scoped the fade to `.mantine-*-input` ONLY. So the **label and the trailing icon stay at full strength** when a
> field is disabled — a visible divergence from the source of truth. Owner rejected Task 495 over exactly this.
> **Why it matters:** in the source of truth the WHOLE control dims to `opacity 0.5` when disabled
> (`label.tsx` → `peer-disabled:opacity-50`; `select.tsx` chevron is rendered INSIDE the trigger so it inherits the
> trigger's `disabled:opacity-50`). In Mantine the label (`.mantine-InputWrapper-label`) and trailing section
> (`.mantine-Select-section`, PasswordInput reveal button) are **siblings** of the input, so `:disabled`/`[data-disabled]`
> on the input does not reach them. Fix once, globally.

## Pre-read

`docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan),
`docs/mantine-responsive-design-system.md`, **`docs/tailadmin-style-reference.md` §6e (the authoritative state matrix —
this is what your render is verified against)**, `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
Read `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, `src/components/ui/select.tsx` (the source-of-truth
disabled classes) and `src/design-system/mantine/input-chrome.css` (where the fix goes; see the existing Task 507
disabled block lines ~63–74).

## The defect (confirmed)

`input-chrome.css` disabled block applies `opacity:0.5 + background:transparent + cursor:not-allowed` to
`.mantine-{TextInput,Textarea,Select}-input` and the PasswordInput outer box only. Result at runtime:
- TextInput / Textarea / Select / PasswordInput disabled → **field fades, but the label above it does NOT.**
- Select disabled → **chevron (`.mantine-Select-section` / rightSection) stays full-strength.**
- PasswordInput disabled → confirm whether the reveal toggle actually inherits the box opacity or stays opaque.

## Required after-behavior (source of truth — §6e)

When a field is `disabled`, the **label + field + value/placeholder + trailing icon all dim to a single `opacity 0.5`**,
`cursor: not-allowed`, no focus ring, no interaction, transparent bg (NOT Mantine's gray fill). One uniform 0.5 — never
two stacked opacities producing 0.25.

**Recommended implementation (confirm with DevTools, then choose the cleaner one):**
- **Preferred:** apply `opacity: 0.5` at the wrapper-root level for the disabled field
  (e.g. `.mantine-InputWrapper-root:has(:disabled), …:has([data-disabled])` — confirm Mantine actually exposes a root
  that contains both label and input for each primitive), and on the input keep only `background-color: transparent` +
  `cursor: not-allowed` (REMOVE the per-input `opacity:0.5` so it isn't double-applied). This fades label+field+icon
  uniformly in one rule, exactly mirroring the source.
- **Fallback (if `:has` on the wrapper root is unreliable for any primitive):** add explicit disabled rules dimming
  `.mantine-InputWrapper-label` and the trailing section (`.mantine-Select-section`, PasswordInput reveal button) to
  `opacity:0.5` alongside the existing field rule — all at the same 0.5.

Keep it in `input-chrome.css` (NOT `theme.ts` inline `styles` — inline freezes the cascade and drops `:disabled`/
`[data-disabled]`/`:has`). Tokens only; `opacity:0.5` + `cursor:not-allowed` are the source-of-truth literals.

## 🔴 Mandatory runtime selector confirmation BEFORE relying on selectors (Task 505/506/507 lesson)

In DevTools, for EACH of the 4 primitives in its disabled story, paste evidence of:
1. which selector carries the disabled state on the field (`:disabled` vs `[data-disabled]` vs `:has(input:disabled)`),
2. the exact class of the **label** element and whether your rule dims it,
3. the exact class of the **trailing icon/section** (Select chevron; PasswordInput reveal) and whether your rule dims it,
4. the computed `opacity` of label, field, and icon — all must read `0.5` (not 1, not 0.25).

## Current behavior to preserve

Resting / focus / error / placeholder chrome unchanged (Task 505). Enabled fields unchanged. The disabled field stays
non-interactive (not-allowed, no focus ring, no red). Only the disabled *reach* changes: field-only fade → whole-control
fade (label + field + icon).

## Positive / negative flow

- **Disabled (positive):** label + field + value/placeholder + icon all at opacity 0.5, transparent bg, not-allowed,
  no focus ring. Verify TextInput, Textarea, Select (chevron), PasswordInput (box + reveal toggle).
- **Enabled (regression):** resting gray-2 border, focus brand-3, error red-6, label full-strength fw600 gray-7 — all
  still correct (Task 505/507 enabled path unaffected).
- **Error + disabled do not leak into each other**; no double-opacity (0.25) anywhere.

## Mobile <640 gate

Disabled fields full-width at <640, no clip/overflow/h-scroll at 320, all 4 locales. Mantine proof path.

## Acceptance criteria

1. `input-chrome.css` updated so disabled dims label + field + trailing icon uniformly to opacity 0.5 across
   TextInput / Textarea / Select / PasswordInput, per §6e. No double-opacity. No `theme.ts` change.
2. DevTools selector + computed-opacity confirmation (label / field / icon = 0.5) pasted for all 4 primitives.
3. **RENDERED PROOF (clause 12/13):** disabled cell of EACH of the 4 primitives at uk@320/375/390 (+ en/sq/it@320)
   showing label AND icon faded with the field; explicit side-by-side note vs the source-of-truth disabled look (§6e).
4. **Planted-violation transcript:** temporarily remove the label/icon dim → capture the label/chevron snapping back to
   full strength while the field stays faded (proves the new rule is real) → revert.
5. Enabled-state regression proof: one resting + one error + one focus cell per primitive still correct (§6e unaffected).
6. **Story update:** the Select (and any other) disabled story caption must state the full-control fade; remove the old
   "faded transparent field" caption that implied field-only.
7. Gates: tsc=0, `check:stories`, `check:i18n` (unchanged), `check:design-tokens`, `check:mojibake` — green.
8. File-integrity (clause 14) transcript for `input-chrome.css`.
9. `docs/backlog.md` Last Session + `docs/sessions/2026-06-28-task508-input-disabled-label-icon.md` (Files Changed table).
   NO `git add`/`git commit` — orchestrator emits at review.

## Re-audit (owner P0 — "always check styles")

Because this defect was systemic, the disabled render of **TextInput, Textarea, PasswordInput** (the already-"CODE
COMPLETE" Batch B primitives) is re-verified in this same task against §6e — not assumed correct. Task 495 (Select)
re-renders here too; 495 is closed by THIS task's Select disabled proof, not separately.

## Critical-flow note

Presentation-only. Scan registry; no new unit test mandated — AC-3 rendered proof + AC-4 planted-violation are the evidence.

## Hard contract

Scope = `input-chrome.css` + the affected disabled story caption(s) + session log/backlog ONLY. No `theme.ts` change,
no token-value change, no resting/focus/error change. STOP-and-ASK if: the wrapper-root `:has()` approach proves
unreliable on any primitive (use the explicit fallback and document why), or if any primitive's source-of-truth disabled
intends something other than the uniform opacity-0.5 fade in §6e. Self-validate before complete (tsc=0 + DevTools
opacity=0.5 proof for label/field/icon + rendered faded-whole-control proof at uk@320 for all 4 primitives).
