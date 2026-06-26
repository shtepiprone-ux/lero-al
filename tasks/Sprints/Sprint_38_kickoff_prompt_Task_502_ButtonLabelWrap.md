# Kickoff — Task 502 — Button long-label wrap (P0 mobile-gate fix, follow-up to Task 493)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews real diff + owner renders the toolbar proof).
> **Origin:** Owner Storybook QA of Task 493 (`b3d25c0fa`) at uk@320 — a long button label **CLIPS instead of
> wrapping** to a second line. This violates the P0 mobile gate ("labels wrap (sq/en/uk/it), no clip").
> **You write code; you do NOT run git.** Update `docs/backlog.md` + a session log; include a Files Changed table.
> **Scope = theme single-source + the proof story only.** No `src/app/**`, `src/components/**`, `src/modules/**` edits.

## Pre-read (load ONLY these)
- `docs/agent-contract.md` (clauses 1–15) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — Button is not a registry flow; theme/story only, no behavior change).
- `docs/mantine-responsive-design-system.md` — §6 (theme component defaults), §7 (mobile <640 gate: labels wrap, ≥44px), §8 + §8.1 (Mantine Storybook proof path + page gutter).
- `docs/tailadmin-style-reference.md` §6 (Button rows).
- `docs/component-rules.md` + `docs/qa-rules.md`.

## Root cause (confirmed by owner DOM inspector, 2026-06-26)
Mantine renders button text in `span.mantine-Button-label`, which carries `white-space: nowrap` and is clipped by
the inner's overflow. Task 493 set wrap styles on `root` only, which never reach `.label`, so long labels clip.
The theme Button default has NO label-wrap rule, so **every** Mantine Button in the app clips long labels today.

## Current behavior to preserve
- Density unchanged: `radius:'lg'`, `size:'sm'` (14px), `fontWeight:'500'`, `minHeight:'2.75rem'` (44px touch target). Do NOT regress any of these.
- All existing ~12 Button consumers keep their explicit props. This task only refines the THEME DEFAULT chrome + fixes the story's long-label proof.

## What to do
1. `src/design-system/mantine/theme.ts` → `components.Button.styles`:
   - `root`: keep `minHeight:'2.75rem'` + `fontWeight:'500'`; ADD `height:'auto'` (lets the button grow to a 2nd line while the 44px min-height holds).
   - ADD `label: { whiteSpace:'normal', overflow:'visible', wordBreak:'break-word' }` — this is the actual clip fix.
   - No raw colors/px beyond the existing allowlisted touch-target rem. Token-first.
   - If after wiring the label still clips in render, also set `inner: { height:'auto' }` — but verify, don't add speculatively.
2. `src/stories/mantine/primitives/Button.stories.tsx`:
   - REMOVE the per-instance `styles={{ root:{ whiteSpace:'normal', wordBreak:'break-word' } }}` from the long-label section — the theme now handles wrapping; the story must prove the THEME default, not a local override.
   - Make the long-label section use a genuinely overflowing string: add/swap to a new key whose uk value wraps to ≥2 lines at 320 full-width (e.g. `button_long_label` uk = `Дуже дуже довга назва кнопки, яка не вміщається на один рядок`). Keep it `fullWidth`.
3. i18n: add the new long-label key (if introduced) to `messages/{en,uk,sq,it}.json` in the `storybook.mantine.*` namespace at full 4-locale parity (each locale a real translation; uk Cyrillic). `check:i18n` parity must pass.

## Positive flow
A short label (e.g. `Add listing`) renders on one line, 14px medium, 44px tall, radius 8 — unchanged from Task 493.

## Negative flow (all must be in the story + verifiable)
- **Long label** → wraps to the next line at the last word that fits (`white-space:normal` + `word-break:break-word`); the button grows vertically; min-height stays ≥44px; NO clip; NO horizontal scroll at 320 in any of sq/en/uk/it.
- Disabled → dimmed, no pointer (unchanged).
- `loading` → loader shown, single-line height still 44px (unchanged).

## 🔴 Mobile <640 full-width gate
Text buttons full-width `<640`; ≥44px touch target; labels WRAP (sq/en/uk/it), never clip; no h-scroll at 320. The variants/sizes demo rows keep `wrap="wrap"` (no h-scroll). Icon-only buttons are the only exemption (none here).

## Acceptance criteria
1. `theme.components.Button.styles` adds `label` wrap + `root.height:'auto'`, density (sm/14px/44px/fw500) preserved. → Positive + Negative.
2. Story long-label section drops the local `root` override and uses a genuinely overflowing uk label that wraps to ≥2 lines at 320. → Negative.
3. New i18n key (if any) ×4 locales at parity; uk real Cyrillic. `check:i18n` parity. → DoD.
4. Long label wraps, no clip, no h-scroll@320, ≥44px — at sq/en/uk/it. → Mobile gate.
5. **Rendered proof:** owner/orchestrator toolbar verification note (Mantine `skipCanvas` path = no machine assert). List exact cells: long-label section @ uk@320/375/390 + sq@320 (longest), must show ≥2-line wrap with no clip.
6. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens` — zero hardcode. → DoD.
7. No density/variant regression; `docs/backlog.md` + session log updated with Files Changed table; **no git emitted**. → DoD.

## Hard contract
No scope change; no invented architecture (STOP and ASK if the label still clips after the canonical recipe and a non-trivial selector is needed); literal AC; self-validate before "complete" (tsc=0 + AC-by-AC table). Files Changed table mandatory. Executor emits NO `git add`/`commit` — the orchestrator emits commits after diff review.
