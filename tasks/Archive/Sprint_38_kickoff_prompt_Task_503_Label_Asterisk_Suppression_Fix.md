# Task 503 — Fix Label asterisk suppression (follow-up to Task 501)

**Type:** UI / Storybook (Mantine) — primitive theme fix
**Sprint:** 38 (MM Phase-1 Batch B)
**Origin:** Task 501 review REJECTED 2026-06-26. Owner rendered the `Mantine/Primitives/Label`
story: the **required (default)** section renders **"Email Address \*"** with a visible red
asterisk — directly contradicting Task 501 AC4 ("no asterisk even when `required` prop is set")
and the owner reference (UX World "mark only optional fields, never required").

## Pre-read (rule-index → UI/layout/component, Mantine)
- `docs/agent-contract.md` (clauses 1–15) + `docs/backlog.md`
- `docs/mantine-responsive-design-system.md` — §6 theme, §7 mobile gate, §8 Storybook proof path, §16 gates
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`

## Root-cause hypothesis (CONFIRM empirically before fixing — do not assume)
Task 501 suppressed the asterisk via `theme.components.InputLabel.styles.required = { display: 'none' }`.
In Mantine v9 the asterisk for `TextInput`/`Select`/`Textarea`/`PasswordInput` is rendered through
`Input.Wrapper`, whose `required` Styles-API part is **not** reached by the `InputLabel` component
theme entry. Net effect: the label font styling applies, but the asterisk is NOT hidden.

**Step 1 — reproduce/confirm:** in the running Storybook render a standalone `<InputLabel required>`
next to `<TextInput required>` and observe which one still shows the asterisk. This both (a) confirms
the screenshot is not a stale build and (b) pins which component owns the asterisk.

## Current behavior to preserve
- `InputLabel` label styling: 14px / fw500 / gray-7 (§6) — KEEP.
- `InputDescription`: 12px / gray-5 (§6d) — KEEP.
- Optional-field pattern in the story (`Job Title (optional)` quiet gray suffix + placeholder +
  hint) — KEEP UNCHANGED; it already matches the owner reference.
- All existing inputs (TextInput/Select/Textarea/PasswordInput) keep working.

## Required after-behavior
Globally, NO required-asterisk renders on ANY Mantine input (`TextInput`, `Select`, `Textarea`,
`PasswordInput`, `NumberInput`, standalone `InputLabel`/`Input.Wrapper`) even when `required` /
`withAsterisk` is passed. The owner policy: all fields required by default → no `*`; optional fields
marked with the localized `(optional)` suffix only. Apply the fix at the **theme single-source**
(whatever Styles-API part actually owns the asterisk — e.g. `InputWrapper`/`Input.Wrapper` `required`
part, in addition to or instead of `InputLabel`) so every consumer inherits it. No per-story / per-
instance override, no raw hardcoded CSS class hack unless theme styles genuinely cannot reach it
(if so, STOP and ASK).

## Positive flow
1. Theme suppresses the asterisk part on the correct component(s).
2. Story `required (default)` section: `<TextInput label required />` renders the label with **no `*`**.
3. Story `optional` section: unchanged — `(optional)` suffix visible, quieter than label.

## Negative flow
- Optional suffix must still render (do not suppress the `(optional)` text — only the `*` glyph).
- Description/error slots unaffected (error message + red border still work on a real validation error).
- Disabled field: label still dims; no asterisk; no bright label over greyed input.
- Long label: still wraps ≥2 lines at 320, no clip, no h-scroll (sq/en/uk/it).

## Acceptance criteria
- AC1: empirical Step-1 reproduction documented (which component rendered the asterisk before the fix).
- AC2: theme fix applied at single-source; asterisk suppressed for ALL listed input components + standalone InputLabel.
- AC3: `Mantine/Primitives/Label` `required (default)` section shows **no asterisk** — proven by rendered screenshot.
- AC4: optional suffix, placeholder, hint, disabled-dim, long-label-wrap all still correct (rendered).
- AC5 (Mobile <640 gate): inputs full-width <640; labels wrap; ≥44px targets; no h-scroll@320.
- AC6 (RENDERED PROOF — the verdict, not tsc): screenshot matrix with **no-asterisk** confirmed at
  **uk@320 / uk@375 / uk@390 + sq@320 + en@320**, plus optional-suffix + disabled + long-wrap cells.
  A green `tsc`/`check:stories` is baseline only and does NOT close this task.
- AC7: gates green — `tsc=0`, `check:stories`, `check:i18n` (parity preserved; no new keys expected),
  `check:design-tokens` 0, file-integrity clean.
- AC8: `docs/backlog.md` + session log updated; **Files Changed table**; NO `git add`/`git commit`
  emitted by executor (orchestrator emits on approval after diff + rendered-proof review).

## Hard contract
No scope change; no invented architecture (STOP & ASK if the asterisk-owning part is ambiguous);
literal AC; self-validate before "complete"; preserve all controls/flows; 4-locale parity.
