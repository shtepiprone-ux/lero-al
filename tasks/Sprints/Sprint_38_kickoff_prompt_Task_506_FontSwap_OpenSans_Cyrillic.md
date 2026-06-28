# Task 506 — Global font swap Outfit → Open Sans (Cyrillic support) — Sprint 38 corrective

> **Type:** Global styling / font-loading (app + Storybook + Mantine theme). App-wide, not input-only.
> **Why:** `Outfit` ships only `latin` + `latin-ext` subsets — **no Cyrillic glyphs at all.** Every Ukrainian
> (uk) string falls back to a system font, so the medium (500) label weight is invisible in Cyrillic and all uk
> text renders in an unintended fallback face. Owner-confirmed 2026-06-27. Owner decision: replace Outfit with
> **Open Sans** (full Latin + Cyrillic + Cyrillic-ext, weights 300–800 incl. 500). This is the root cause of the
> "labels not medium" rejection on the input stories — it was never a theme bug; the theme already sets fw500.

## Pre-read

`docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan),
`docs/mantine-responsive-design-system.md` (theme + Storybook proof path), `docs/tailwind-governance.md`,
`docs/ui-rules.md`, `docs/qa-rules.md`. Also read `src/app/layout.tsx`, `.storybook/preview-head.html`,
`src/design-system/mantine/theme.ts`, `src/app/globals.css` (font-variable wiring).

## Scope decision (orchestrator — flag if owner disagrees)

**Full replacement:** Open Sans becomes the single project font for BOTH scripts (Latin + Cyrillic), all weights.
This removes the script-fallback mismatch class of bug entirely and keeps one consistent face. (Alternative —
pairing Outfit-Latin + Open-Sans-Cyrillic via `unicode-range` — is NOT chosen; if the owner later wants it, that's
a follow-up.) Do NOT keep any `Outfit` reference behind.

## Required changes (exact)

1. **`src/app/layout.tsx`** — replace the Outfit loader:
   - `import { Open_Sans } from 'next/font/google'`
   - `const sans = Open_Sans({ subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'], variable: '--font-sans', display: 'swap' })`
     (Open Sans on Google is a variable font 300–800; do NOT pin a `weight` array — variable covers 400/500/600/700.)
   - Rename the exposed CSS variable from `--font-outfit` to **`--font-sans`** everywhere it's consumed (see steps 3–4).
   - Apply `sans.variable` on the `<html>`/`<body>` className exactly where `outfit.variable` was applied.
   - Update the comment block (lines ~18–21) to describe Open Sans + the Cyrillic rationale; remove "Outfit is the single project font".

2. **`.storybook/preview-head.html`** — replace the Outfit `<link>` with Open Sans, Cyrillic included:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
   ```
   (Google serves the Cyrillic subset automatically via `unicode-range`; confirm in the network panel that the
   `cyrillic` woff2 loads when a uk story renders.) Update the comment to name Open Sans.

3. **`src/design-system/mantine/theme.ts`** — update BOTH font stacks:
   - `fontFamily: 'var(--font-sans), "Open Sans", system-ui, -apple-system, sans-serif'`
   - `headings.fontFamily: '"Open Sans", var(--font-sans), system-ui, -apple-system, sans-serif'`
   - Remove every `Outfit` literal and the `--font-outfit` variable reference. No other theme change.

4. **`src/app/globals.css`** — rename the `--font-outfit` wiring to `--font-sans` (the `--font-sans`/`--font-heading`
   mapping that feeds Tailwind + Mantine). Update any Outfit-naming comments (e.g. the `body` comment "Outfit uses normal
   defaults"). Do NOT change any token VALUES — only the font-variable name + comments. Must still pass `check:design-tokens`.

5. **Grep sweep:** `grep -rni "outfit\|--font-outfit" src .storybook` must return ZERO functional references after the
   change (only historical doc/session text may remain). Paste the clean grep in the session log.

## Current behavior to preserve

No layout, spacing, weight-token, or color change. Same `--font-sans`/`--font-heading` → Tailwind + Mantine wiring,
same weights (400 body / 500 label / 600–700 headings). The ONLY change is the font family (Outfit → Open Sans) and the
variable rename. All component sizing (14px/44px density etc.) unchanged.

## Positive flow

App + Storybook render Open Sans for Latin AND Cyrillic. uk labels now visibly render at medium (500) — distinct from
400 body text — because Open Sans has real Cyrillic medium glyphs. en/sq/it unchanged in weight behavior, new face.

## Negative flow / checks

- **uk Cyrillic:** labels render medium (500), body 400, headings 600–700 — all in Open Sans, no system fallback.
- **Network proof:** the Cyrillic woff2 subset actually loads on a uk story (no fallback face).
- **No FOUT regression:** `display:'swap'` keeps text visible; no layout shift beyond normal swap.
- **All four locales** (sq/en/uk/it) render in Open Sans; no locale still on Outfit/system.

## Mobile <640 gate

Font-only change; rendered proof must still confirm no overflow/clip/h-scroll at 320 in any locale (Open Sans metrics
differ from Outfit — re-verify long uk labels still wrap and don't clip at 320).

## Acceptance criteria

1. `layout.tsx` loads Open Sans with `['latin','latin-ext','cyrillic','cyrillic-ext']`, variable `--font-sans`; no Outfit left.
2. `preview-head.html` loads Open Sans incl. Cyrillic; Outfit link removed.
3. `theme.ts` both font stacks = Open Sans / `--font-sans`; no Outfit literal.
4. `globals.css` variable renamed `--font-outfit`→`--font-sans`; zero value changes; comments updated.
5. Grep sweep clean (zero functional `outfit`/`--font-outfit` refs) — pasted in log.
6. **RENDERED PROOF (clause 12/13):** the existing TextInput/Textarea/PasswordInput stories re-rendered at **uk@320/375/390**
   (+ en/sq/it@320) showing (a) Cyrillic now in Open Sans, (b) field **labels visibly medium (500)** vs 400 body — the
   exact defect the owner rejected. Plus a network-tab capture proving the Cyrillic woff2 loaded.
7. Gates green: tsc=0, `check:stories`, `check:i18n` (unchanged count), `check:design-tokens`, `check:mojibake`.
8. File-integrity (clause 14): all touched files 0 NUL, no BOM, parse/compile, not truncated — transcript pasted.
9. `docs/mantine-responsive-design-system.md` (or `tailadmin-style-reference.md`) updated: project font is now Open Sans
   (Cyrillic), Outfit retired + reason. `docs/backlog.md` Last Session + `docs/sessions/2026-06-27-task506-font-opensans.md`
   with Files Changed table. NO `git add`/`git commit` — orchestrator emits at review.

## Critical-flow note

Presentation-only (font). Scan the registry; no new unit test mandated. AC-6 rendered proof (uk medium label visible +
Cyrillic woff2 loaded) is the required evidence.

## Hard contract

Scope = the 4 code files + docs/session/backlog. No token-value changes, no layout/spacing/weight changes, no other
component edits, no Outfit residue. STOP-and-ASK if: Open Sans variable-font weights don't expose 500 via `next/font`
(then pin explicit weights 400/500/600/700); or globals.css font-variable rename has consumers beyond the obvious wiring.
Self-validate before "complete" (tsc=0 + grep-clean + AC table + uk@320 rendered walk showing medium Cyrillic labels).
