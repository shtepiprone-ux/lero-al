# Kickoff — Task 493 — Button primitive → TailAdmin (MM Phase 1, P1.01)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews the real diff + rendered story vs reference).
> **Sprint:** `tasks/Sprints/Sprint_38_MM_Phase1_FormControls.md` (read its Shared DoD + 🔴 DENSITY CORRECTION first).
> **You write code; you do NOT run git.** Update `docs/backlog.md` + a session log; include a Files Changed table.
> **NO product-surface edits** — this is theme defaults + a proof story only.

## Pre-read (load ONLY these)
- `docs/agent-contract.md` (clauses 1–15) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — Button is not a
  registry flow itself, but note any auth/admin flow that renders it; this task changes no behavior, only theme/story).
- `docs/mantine-responsive-design-system.md` — §7 (mobile <640 full-width gate), §8 (Mantine Storybook proof path), §12 (patterns).
- `docs/tailadmin-style-reference.md` §6 (Button rows).
- `docs/storybook-governance.md` (story gate) + `docs/component-rules.md` + `docs/qa-rules.md`.
- `tasks/Sprints/Sprint_38_MM_Phase1_FormControls.md` (Shared DoD + density correction).

## 🔴 Density correction (owner P0, Task 492 — do not regress)
Owner rejected `size="md"` (16px) as oversized. The theme already sets Button default `size="sm"` (14px) +
`styles.root.minHeight:'2.75rem'` (44px). **Keep sm/14px/44px. Do NOT set `size="md"`. Do NOT remove the 44px min-height.**

## Reference values (TailAdmin §6 — apply EXACTLY, zero invented values)
- Primary: `bg-brand-500 hover:bg-brand-600 rounded-lg p-3 text-theme-sm font-medium text-white` → Mantine `variant="filled" color="brand"`, radius `lg`, 14px, fw 500, ≥44px.
- Secondary/outline: `border border-gray-300 bg-white rounded-lg p-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 shadow-theme-xs` → Mantine `variant="default"` (white bg, gray-3 border, gray-7 text, hover gray-0, shadow-xs).
- Ghost → `variant="subtle"` (gray-7 text, hover gray-0). Destructive → `variant="light" color="red"`. Link → `variant="transparent"` / `Anchor`.

## Current behavior to preserve
- All existing Mantine `Button` consumers (~12 call sites) keep their explicit `variant`/`color`/`size`/`leftSection` props.
  This task only refines the THEME DEFAULT (density/chrome) + adds a proof story. No `src/app/**`, `src/components/**`,
  `src/modules/**` edits. If `theme.components.Button` already satisfies a value (Task 492), do NOT duplicate it — cite it.

## What to do
1. `src/design-system/mantine/theme.ts` — verify `components.Button` carries: `radius:'lg'`, `size:'sm'`, fw 500,
   `minHeight:'2.75rem'`. Add `fontWeight` only if not inherited. Refine ONLY if a §6 value is missing; otherwise leave as-is
   and note "already satisfied (Task 492/484)". No raw colors/px (mantine dir is allowlisted theme-input, but still token-first).
2. `src/stories/mantine/primitives/Button.stories.tsx` — NEW. Mantine proof path: `parameters: { skipCanvas:true, layout:'fullscreen' }`,
   single `Default` export, toolbar-driven viewport+locale, `title: 'Mantine/Primitives/Button'`, consumes Mantine `Button`.
   Canvas `Box px={{base:'md',sm:'xl'}} py="md"`. Sections:
   - Variants row: filled(brand) · default · subtle · light(red) · transparent.
   - Sizes: xs, sm ONLY (NOT md — density rule).
   - With leading icon (`leftSection`, lucide-react).
   - Full-width `<640` example (`fullWidth` or `max-sm` equivalent) — must fill the 320/375 frame.
   - Disabled + `loading`.
   - All labels via `storyT(l, 'storybook.mantine.button_*')`; add keys to the `storybook.mantine.*` namespace in
     `messages/{en,uk,sq,it}.json` at full 4-locale parity (include a deliberately long uk label, e.g. `Зберегти зміни`).

## Positive flow
Each variant renders at sm: 14px medium text, 44px tall, radius 8; filled = brand bg with brand-600 hover, white text;
default = white/gray-3 border/gray-7/shadow-xs; with-icon aligns; `fullWidth` fills the frame `<640`.

## Negative flow (all must be in the story + verifiable)
- Disabled → dimmed, no pointer, no hover.
- `loading` → Mantine loader shown, height unchanged (still 44px).
- Long uk label → `whitespace-normal break-words`, button stays ≥44px, NO clip and NO horizontal scroll at 320.

## 🔴 Mobile <640 full-width gate
Text buttons are full-width `<640` (`fullWidth`/`max-sm:w-full` equivalent); ≥44px touch target; labels wrap (sq/en/uk/it),
never clip; no h-scroll at 320. Icon-only buttons are the only exemption (none required here unless you add one — document it).

## Acceptance criteria
1. `theme.components.Button` = §6 + Task 492 density (sm/14px/44px), each value cited as new-or-already-satisfied. → Positive.
2. `Button.stories.tsx` created (Mantine proof path, single Default, consumes Mantine Button, all variants + xs/sm + icon +
   full-width + disabled + loading). → Positive + Negative.
3. Strings via `storyT()`; new `storybook.mantine.button_*` keys ×4 locales (incl. long uk). `check:i18n` parity. → DoD 2.
4. Full-width `<640`; ≥44px; labels wrap; no clip/h-scroll@320. → Mobile gate.
5. **Rendered proof matrix** (320/375/480 × en/uk + sq/it@320; uk@320/375/390 mandatory) attached or explicit manual-fallback
   note for orchestrator/owner toolbar verification. → DoD 3.
6. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`. Zero hardcode (no raw color/px/string). → DoD 4.
7. No variant/behavior regression; `docs/backlog.md` + session log updated with Files Changed table; **no git emitted**. → DoD 7.

## Hard contract
No scope change; no invented architecture (STOP and ASK on ambiguity — e.g. if a §6 value can't be expressed with tokens);
literal AC; self-validate before "complete" (tsc=0 + AC-by-AC table + walk the story at uk 320). Files Changed table mandatory.
Executor emits NO `git add`/`commit` — the orchestrator emits commits after diff review.
