# Task 506-R — Fix self-referential `--font-sans` (Open Sans not applying) — Sprint 38 corrective

> **Type:** Global styling / CSS-variable wiring. Small, surgical.
> **Why:** Task 506 renamed the next/font loader variable to `--font-sans`, which collides with the EXISTING
> `@theme` token `--font-sans`. Result: `globals.css` now reads `--font-sans: var(--font-sans), …` — a SELF-REFERENCE
> (guaranteed-invalid). That invalidates `font-family` everywhere it's consumed, so Open Sans never applies and text
> falls back to a system font with no real medium (500) — owner-confirmed: toggling `font-weight` in DevTools changes
> nothing because the rendered face isn't Open Sans. **Root cause was the orchestrator's rename instruction, not a
> Sonnet execution error.** Fix: give the loader variable a DISTINCT name and restore the indirection.

## Pre-read

`docs/agent-contract.md`, `docs/backlog.md`, `docs/tailwind-governance.md`, `docs/ui-rules.md`, `docs/qa-rules.md`,
`docs/mantine-responsive-design-system.md`. Read `src/app/layout.tsx`, `src/app/globals.css`,
`src/design-system/mantine/theme.ts`, `.storybook/preview.tsx`, `.storybook/preview-head.html`.

## Exact changes (no scope beyond these)

1. **`src/app/layout.tsx`** — rename ONLY the loader variable:
   `Open_Sans({ subsets: ['latin','latin-ext','cyrillic','cyrillic-ext'], variable: '--font-open-sans', display: 'swap' })`.
   `className={sans.variable}` unchanged (now emits `--font-open-sans`). Subsets unchanged.

2. **`src/app/globals.css`** — remove the self-reference; point the tokens at the distinct loader var with an
   `"Open Sans"` literal fallback (so Storybook, where the loader var is absent, still uses the CDN Open Sans):
   - `--font-sans:    var(--font-open-sans), "Open Sans", system-ui, -apple-system, sans-serif;`
   - `--font-heading: var(--font-open-sans), "Open Sans", system-ui, -apple-system, sans-serif;`
   Update the comment (the loader var is `--font-open-sans`; Storybook relies on the `"Open Sans"` literal + CDN link,
   NOT on a preview-defined `--font-sans`). No token VALUE changes elsewhere; must pass `check:design-tokens`.

3. **`src/design-system/mantine/theme.ts`** — both stacks use the loader var directly + literal fallback (so Storybook
   resolves to the CDN `"Open Sans"`, never to a bare `system-ui` that pre-empts it):
   - body `fontFamily: 'var(--font-open-sans), "Open Sans", system-ui, -apple-system, sans-serif'`
   - `headings.fontFamily: 'var(--font-open-sans), "Open Sans", system-ui, -apple-system, sans-serif'`

4. **`.storybook/preview.tsx`** — if Task 506 added any `--font-sans` definition here, REMOVE it (not needed; the
   `"Open Sans"` literal fallback + the preview-head CDN `<link>` cover Storybook). If it added nothing, leave as is.
   Confirm `.storybook/preview-head.html` still loads `Open+Sans:ital,wght@0,300..800;1,300..800` (Cyrillic via unicode-range).

5. **Sweep:** `grep -rn "var(--font-sans)" src` must show NO declaration where `--font-sans` is defined as
   `var(--font-sans), …` (zero self-reference). Paste the grep in the log.

## The decisive proof (this is what was missing — clause 12/13)

In Storybook at **uk@320 and uk@1043**, on a field label (`.mantine-*-label`):
- **DevTools "Fonts Used" / computed `font-family` shows `Open Sans`** for the Cyrillic label (NOT a system fallback).
- **Toggling `font-weight: 500` → 400 now visibly changes the weight** of the Cyrillic label (proves a real medium
  glyph is rendering). Capture before/after.
- Network tab shows the Open Sans **Cyrillic** woff2 actually downloaded.
Attach these for TextInput, Textarea, AND PasswordInput error/basic stories, uk@320/375/390 mandatory.

## Acceptance criteria

1. Loader var renamed to `--font-open-sans`; `globals.css` self-reference gone; both font tokens reference
   `var(--font-open-sans), "Open Sans", …`.
2. `theme.ts` both stacks = `var(--font-open-sans), "Open Sans", system-ui, …`.
3. Grep proof: zero `--font-sans: var(--font-sans)` self-reference; zero `--font-outfit` residue.
4. Rendered proof (above): Cyrillic label = Open Sans, weight toggle now visibly changes it, Cyrillic woff2 loaded —
   uk@320/375/390 across the three input stories.
5. Gates: tsc=0, `check:stories`, `check:i18n` (unchanged), `check:design-tokens`, `check:mojibake` — all green.
6. File-integrity (clause 14) transcript for every touched file.
7. `docs/backlog.md` Last Session + `docs/sessions/2026-06-27-task506R-font-variable-fix.md` with Files Changed table.
   NO `git add`/`git commit` — orchestrator emits at review.

## Hard contract

Scope = `layout.tsx`, `globals.css`, `theme.ts`, possibly `.storybook/preview.tsx` + docs/session/backlog. No token
VALUE changes, no other edits. STOP-and-ASK only if removing the `--font-sans` self-reference reveals another consumer
defining `--font-sans` cyclically. Self-validate before complete (tsc=0 + grep-clean + the weight-toggle rendered proof
at uk@320).
