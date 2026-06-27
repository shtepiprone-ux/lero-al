# Task 505 — Mantine input error-border attribute fix (TextInput + Textarea) — Sprint 38 corrective

> **Type:** UI / component (Mantine `theme.ts` styling).
> **Why this exists:** Tasks 496 (Textarea) and 494-R (TextInput) shipped a *dead* error-state
> border override. The owner rejected on rendered evidence: **no red border in the error state**
> of either control. The orchestrator confirmed the root cause against Mantine v8 source. Sonnet's
> previous "fix" was tsc-green but never rendered-verified — a clause 12/13 violation.

## Pre-read (rule-index → UI/component bundle)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan).
**Required:** `docs/mantine-responsive-design-system.md` (FIRST — Mantine = source of truth; §7 mobile gate, §8 Storybook proof path, §16 acceptance gates), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Root cause (confirmed by orchestrator — do not re-debate, just fix)

`src/design-system/mantine/theme.ts` overrides `components.TextInput.styles.input` and
`components.Textarea.styles.input` with a literal resting `borderColor: var(--mantine-color-gray-2)`.
Because the Emotion override class is injected after Mantine's base CSS, that literal `border-color`
wins over Mantine's error rule (which only sets the CSS variable `--input-bd: var(--mantine-color-error)`),
so the border stays gray in the error state.

Sonnet attempted to restore it with:

```ts
'&[data-invalid]': { borderColor: 'var(--mantine-color-red-6)', boxShadow: 'none' },
```

**`[data-invalid]` is not a Mantine attribute.** Mantine v8's `Input` marks the error state with
**`data-error`** (verified: `node_modules/@mantine/core/styles/Input.css` L135–143 uses
`[data-error]`; there is **zero** `data-invalid` anywhere in Mantine's stylesheets). The selector
therefore matches no element and the override is functionally dead in BOTH blocks.

## Current behavior to preserve

Everything else in both `styles.input` blocks stays byte-for-byte: resting `borderColor: gray-2`,
`color: gray-8`, `boxShadow: shadow-xs`, placeholder `gray-4`, the `&:focus` brand-3 + ring,
TextInput's `minHeight: 2.75rem`, `inputWrapperOrder`, and Textarea having no minHeight. Do **not**
touch any other component block, any locale file, or any story content beyond what AC-4 requires.

## Required after-behavior — the ONE change

In **both** `components.TextInput.styles.input` and `components.Textarea.styles.input`, replace the
dead selector key `'&[data-invalid]'` with **`'&[data-error]'`** (keep the same value:
`{ borderColor: 'var(--mantine-color-red-6)', boxShadow: 'none' }`). Update the adjacent comment to
read `// resting borderColor overrides Mantine's [data-error] default → restore explicitly`.

That is the entire product change: two selector keys, two comment lines. No new keys, no value change.

## Positive flow (happy path)

- **Actor:** any user viewing a TextInput/Textarea in its error state (e.g. the "error" story, or a
  product form field with a validation error).
- **Steps:** field renders with `error` prop set → Mantine puts `data-error` on the input element →
  the override `&[data-error]` rule applies → border renders **red (`--mantine-color-red-6` = #d92d20)**,
  no resting shadow.
- **Success state:** error-state border is unmistakably red at every breakpoint × every locale; the
  red error message text below is unchanged; the label is unchanged (no red label).
- **Post-conditions:** resting (non-error) fields still show the gray-2 border; focus still shows the
  brand-3 border + ring; disabled still dimmed. No regression to those three states.

## Negative flow (every off-happy-path branch)

- **Resting / no error:** `data-error` absent → `&[data-error]` does not apply → border stays gray-2.
  Verify the red does NOT leak into the resting state.
- **Focus while in error:** focused + `data-error` → red border must remain (do not let `:focus`
  brand border silently win in a way that hides the error; document whichever Mantine resolves and
  confirm it visually — owner expects the error to remain visible/red on focus).
- **Disabled:** disabled fields remain dimmed; no red border on a disabled-but-error edge case (not
  expected in stories — note behavior if it arises, do not invent scope).
- **Both components:** the fix MUST be verified independently for TextInput AND Textarea — they are
  two separate blocks; proving one does not prove the other.

## Mobile <640 full-width gate (OWNER P0)

This is a color-only change and adds no layout, but the rendered proof MUST still confirm the error
stories render full-width edge-to-edge at <640 (no regression): both error-state inputs span the full
canvas width at 320/375/390, labels wrap (sq/en/uk/it), no clip, no horizontal scroll at 320. Stories
must use the Mantine-native proof path (no `layout:'centered'/'padded'`). No control is exempted.

## Acceptance criteria (each maps to a flow + a verifiable artifact)

1. **AC-1 (Positive):** `theme.ts` TextInput block — `'&[data-error]'` present, `'&[data-invalid]'`
   gone. Verifiable at `src/design-system/mantine/theme.ts` (TextInput `styles.input`).
2. **AC-2 (Positive):** `theme.ts` Textarea block — same. Verifiable in the Textarea `styles.input`.
3. **AC-3 (Negative — resting):** rendered proof shows resting border still gray, red only in error.
4. **AC-4 (rendered proof — clause 12/13, THE deliverable):** machine-produced rendered matrix for
   the TextInput **and** Textarea **error** stories — breakpoints 320/375/390/768/1280 × locales
   sq/en/uk/it, **uk@320/375/390 mandatory** — each cell showing the **red error border** in the
   actual pixels (not just the class in the diff). A green tsc/`check:stories` is a baseline, NOT
   proof. "No browser access / owner QA required" does NOT close this — attach the PNG/JSON.
5. **AC-5:** gates green in transcript — tsc=0, `npm run check:stories`, `npm run check:i18n`
   (key count unchanged — this task adds NO locale keys), `npm run check:design-tokens`, plus the
   rendered-assert run; AND a planted-violation negative transcript (e.g. revert to `[data-invalid]`)
   showing the rendered error cell goes gray = proves the proof is real.
6. **AC-6 (file integrity, clause 14):** `theme.ts` — 0 NUL bytes, no BOM, `tsc` clean, not truncated;
   paste the integrity transcript.
7. **AC-7:** `docs/backlog.md` Last Session + a session log under `docs/sessions/` updated; session log
   includes the **Files Changed** table (one row per touched path + rationale). Do **NOT** emit
   `git add`/`git commit` — the orchestrator emits commit commands at review.

## Critical-flow / regression note

Scan `docs/critical-flow-registry.md`. Input error-state styling is presentation-only; if no registry
row covers it, no new automated test is mandated by clause 15 — BUT the rendered error-border proof
in AC-4 IS the required evidence and the planted-violation transcript in AC-5 is the "gate is real"
proof. If you believe a registry row is warranted, STOP and ASK rather than inventing one.

## Hard contract reminder

No scope change beyond the two selector keys + two comments. No architecture invented. Do not touch
locale files (no key change), other component blocks, or product consumers (`@/components/ui/*` shadcn
inputs are unaffected — this only changes the Mantine theme used by Storybook/Mantine surfaces).
Self-validate before claiming complete (tsc=0 + AC-by-AC table + rendered run + uk@320 walk).
