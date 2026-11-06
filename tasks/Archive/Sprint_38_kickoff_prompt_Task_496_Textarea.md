# Task 496 — Textarea primitive → TailAdmin / Mantine (Sprint 38, P1.04)

> **Type:** UI / Storybook (Mantine proof path). **Executor:** Sonnet 4.6. **Orchestrator:** Opus (this file + diff review).
> **Run order:** 493 ✅ → 501 ✅ → 494 ✅ → **496 (this)** → 500 → 495 → 497 → 498 → 499. Independent, reviewable alone.
> **Builds on:** Task 492 density (sm/14px) + Task 494 TextInput §6 chrome (the pattern to mirror).

## Goal
Bring the Mantine **Textarea** primitive to the TailAdmin §6 input chrome and ship its Mantine-proof-path Storybook story.
Currently `theme.ts` gives Textarea only `radius:'lg', size:'sm'` (no border/placeholder/focus/shadow tokens) — it does NOT
inherit `TextInput`'s chrome (per-component theme overrides don't cascade). This task adds the same §6 chrome to Textarea.

## Pre-read (required)
- `docs/agent-contract.md` (clauses 1–15), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — Storybook-only,
  touches no registered runtime flow).
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §8 (Mantine Storybook proof path), §12 (patterns).
- `docs/tailadmin-style-reference.md` §6 (Input row — multiline shares input chrome).
- `docs/i18n-rules.md` — **§5a** (email/machine-format placeholders never translated; Textarea placeholders are
  natural-language → localized in all 4). `docs/storybook-governance.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- `tasks/Sprints/Sprint_38_MM_Phase1_FormControls.md` (shared DoD + Task 496 block).
- **Reference implementation to mirror:** `src/design-system/mantine/theme.ts` lines 171–188 (`TextInput.styles.input`)
  and `src/stories/mantine/primitives/TextInput.stories.tsx` (the approved Task 494 story shape).

## Scope — EXACTLY these files (nothing else)
1. `src/design-system/mantine/theme.ts` — expand `Textarea` with `styles.input` carrying the §6 chrome.
2. `src/stories/mantine/primitives/Textarea.stories.tsx` — **new** Mantine-proof-path story.
3. `messages/en.json` · `messages/sq.json` · `messages/uk.json` · `messages/it.json` — add the `storybook.mantine`
   textarea keys (same key set in all 4).

**Do NOT touch `TextInput` chrome, any other story, or product surfaces.** If anything beyond these 6 files seems
necessary (e.g. a Textarea consumer breaks), STOP and ASK the orchestrator.

## Theme change (`theme.ts` → `Textarea`)
Mirror `TextInput.styles.input` EXACTLY for the resting + focus chrome, **but do NOT add a fixed `minHeight:'2.75rem'`
floor** — Textarea is multiline and must grow with content. Resulting block:
```ts
Textarea: {
  defaultProps: { radius: 'lg', size: 'sm', inputWrapperOrder: ['label', 'input', 'description', 'error'] },
  styles: {
    input: {
      borderColor: 'var(--mantine-color-gray-2)',                  // §6 resting border — gray-200
      color: 'var(--mantine-color-gray-8)',                        // §6 text — gray-800
      boxShadow: 'var(--mantine-shadow-xs)',                       // §5 shadow-theme-xs
      '&::placeholder': { color: 'var(--mantine-color-gray-4)' }, // §6 placeholder — gray-400
      '&:focus': {                                                 // §6 focus: brand-3 border + brand-5/10 ring
        borderColor: 'var(--mantine-color-brand-3)',
        boxShadow: '0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent)',
      },
    },
  },
},
```
- **Zero raw hex / zero raw color** — tokens only (matches Task 494). `inputWrapperOrder` keeps the description BELOW the
  input, consistent with TextInput (Task 503 owner UX decision).
- Multiline growth: rely on Mantine `autosize` + `minRows`/`maxRows` set **per-story** (NOT a theme default), so consumers
  keep their current behavior. **`Textarea` consumers (2) must keep their props** — verify with a grep before editing.

## Locale keys (storybook.mantine namespace, all 4 files — identical key set)
| Key | en | sq | uk | it |
|---|---|---|---|---|
| `ta_label` | `Listing description` | `Përshkrimi i shpalljes` | `Опис оголошення` | `Descrizione dell'annuncio` |
| `ta_placeholder` | `Describe the property…` | `Përshkruani pronën…` | `Опишіть нерухомість…` | `Descrivi l'immobile…` |
| `ta_hint` | `Up to 1000 characters` | `Deri në 1000 karaktere` | `До 1000 символів` | `Fino a 1000 caratteri` |
| `ta_error` | `Description is required` | `Përshkrimi është i detyrueshëm` | `Опис обов'язковий` | `La descrizione è obbligatoria` |
| `ta_long_value` | a 2–3 sentence sample describing a flat (English) | sq equivalent | **uk equivalent (Cyrillic, long enough to wrap ≥2 lines at 320 and trigger autosize growth)** | it equivalent |

> Phrasing may be adjusted to read naturally per locale — the constraints are: placeholders/labels/hints are
> **localized natural language** (NOT email, NOT Latin-for-uk), parity = same key set in all 4 files, and `ta_long_value`
> in `uk` is genuinely long (it is the autosize/wrap stress content).

## Story (`Textarea.stories.tsx`) — mirror the Task 494 shape
- Scaffolding identical to TextInput: `parameters.skipCanvas:true` + `layout:'fullscreen'`, single `Default` export,
  toolbar-driven locale, `const t = (k)=>storyT(locale, \`storybook.mantine.${k}\`)`, wrapped in
  `<Box px={{base:'md',sm:'xl'}} py="md"><Stack gap="xl">…`. **No icons. No `leftSection`/`rightSection`.**
- Sections (each a `<Stack gap="xs">` with a grey `<Text size="xs" c="gray.5">` caption then the control):
  1. **basic** — `<Textarea label={t('ta_label')} placeholder={t('ta_placeholder')} description={t('ta_hint')} autosize minRows={3} />`
  2. **autosize / long content** — `<Textarea label={t('ta_label')} defaultValue={t('ta_long_value')} autosize minRows={3} />`
     (proves the box grows with content + long uk wraps, no clip, no h-scroll@320).
  3. **error** — `<Textarea label={t('ta_label')} placeholder={t('ta_placeholder')} error={t('ta_error')} autosize minRows={3} />`
  4. **disabled** — `<Textarea label={t('ta_label')} placeholder={t('ta_placeholder')} disabled autosize minRows={3} />`
- Captions are dev-annotation literals in the SAME style already accepted by `check:stories` in the TextInput story
  (English meta-text, not user-facing). Do not introduce user-facing raw strings — all control text via `t()`.

## Positive flow (happy path)
1. Open story → toolbar `uk`, 320px. Each section renders a 14px-text textarea with gray-2 border + `shadow-xs`; focusing
   shows the brand-3 border + brand-5/10 ring (same as TextInput).
2. **basic:** placeholder shows the localized hint text (`Опишіть нерухомість…` in uk); `description` renders BELOW.
3. **autosize:** the filled `ta_long_value` makes the box grow to fit; uk content wraps ≥2 lines; no h-scroll at 320.
4. Switch locale en→sq→uk→it: all label/placeholder/hint/error text updates per locale; no Latin-for-uk leak.

## Negative flow (off-happy-path branches)
- **error** section: red border + red message (`ta_error`, localized) + `aria-invalid` on the textarea.
- **disabled** section: dimmed input + dimmed label, no focus ring, no pointer.
- **long uk content (autosize):** wraps, grows, never clips, no horizontal scroll at 320.
- **parity guard:** `check:i18n` green — all 5 keys present in ALL 4 locale files, no orphans.

## Mobile <640 full-width gate (OWNER P0)
Textarea is full-width within the `Box` at `<640`; labels wrap (sq/en/uk/it); content wraps with no h-scroll at 320; no
overlay/popup surfaces; no icon-only controls. Confirm every cell of the rendered matrix.

## Definition of Done (Sprint 38 shared DoD)
- Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`. (Green ≠ visual proof.)
- **Rendered proof matrix attached:** 320/375/480 × en/uk + sq/it@320, **uk@320/375/390 mandatory** — per cell confirm:
  gray-2 border + shadow-xs resting, brand focus ring, 14px text, localized placeholder/label/hint, autosize growth,
  long uk wraps, no clip/overflow, no h-scroll@320, full-width <640.
- File-integrity (clause 14): each touched file NUL=0, JSON parses, story + theme compile, not truncated — paste transcript.
- Locale parity sq/en/uk/it (identical 5-key set added).
- "Files Changed" table in the session log (one row per touched path + 1-line rationale). **Executor emits NO git.**
- No `TextInput`/other-component/product-surface edits. No icons.

## STOP-and-ASK triggers
- If the brand focus ring is not achievable with tokens alone on Textarea (it was for TextInput — should be identical).
- If either existing `Textarea` consumer relies on a height/behavior the chrome change would alter.
- If `ta_long_value` wording for any locale is unclear — ask rather than guess.

## Acceptance criteria (map each to a flow)
- **AC1** (Positive 1): `theme.ts` Textarea gains the §6 chrome (gray-2 border, gray-8 text, shadow-xs, gray-4 placeholder,
  brand-3 focus border + brand-5/10 ring) — all tokens, zero raw hex — verifiable in the diff + the focus cell of the matrix.
- **AC2** (Positive 3 / Negative long-uk): autosize grows with content; long uk wraps ≥2 lines at 320, no h-scroll —
  verifiable in the uk@320 matrix cell.
- **AC3** (Negative): error (red + aria-invalid) and disabled (dimmed) sections present and correct.
- **AC4** (Positive 4 / §5a): all 5 keys localized in 4 files (natural language, uk in Cyrillic), `check:i18n` green.
- **AC5** (DoD): all gates green + rendered matrix incl. uk@320/375/390; story = Mantine proof path, no icons.
