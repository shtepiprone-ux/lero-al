### Task 373 — CORRECTIVE B: Dialog (and Sheet) visual model correction — no h-scroll, no overlap, no stray gray bg

> **Execution order (Sprint 32 correctives) — A → B → C → D → E → F, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. F is the FINAL certification sweep (run after A–E all land), never a parallel task. **B follows A.**

Type:      corrective bugfix — overlay primitives (owner-rejected 361)
Priority:  CRITICAL
Area:      src/components/ui/dialog.tsx · src/components/ui/sheet.tsx · their stories

## Owner rejection context
Owner: "жахлива реалізація. Звідки взялись скроли? … Кнопка прилипає до повзунка скролу … Повзунок налазить на кнопку Х
… Звідки взявся сірий background?". Task 361's Dialog is visually unacceptable. Fix the scroll model properly — do NOT
blindly wrap content in scroll containers that create new defects.

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/design-system.md` (overlay rules) · `docs/ui-rules.md` (§16 z-index,
overlay) · `docs/component-rules.md` · `docs/qa-rules.md` · session log `docs/sessions/2026-06-02-task-361-*`.

## Current broken behavior (file evidence — `ui/dialog.tsx`)
- L56 `DialogContent`: `overflow-hidden rounded-2xl bg-popover p-4 … max-h-[90dvh]`.
- L61 inner wrapper: `overflow-y-auto flex-1 min-h-0 grid gap-4` → vertical scroll track inside the padded box.
- L70 close button: `absolute top-2 right-2` → sits OVER the scroll track; vertical scrollbar overlaps the X.
- L107 footer: `-mx-4 -mb-4 … border-t bg-muted/50 p-4` → the gray bar the owner sees; with the scroll track it can
  collide with the scrollbar.
- L34 overlay: `bg-black/10 supports-backdrop-filter:backdrop-blur-xs`.
- Horizontal scroll appears (owner) — likely from `grid` content width / negative-margin footer / long unbroken tokens.

## Required after behavior (designed scroll model — not a blind wrapper)
- **Normal-content dialogs show NO scrollbars at all** (vertical or horizontal).
- **Horizontal scroll never appears** — content uses `min-w-0`/`break-words`; remove any `overflow-x` source.
- Long-content dialogs scroll **vertically only when content exceeds `max-h`**, and:
  - the scroll lives in the BODY region only; header (title) and footer (actions) stay fixed and OUTSIDE the scroll track;
  - the **close X is outside the scroll track** (or padded safely away) and is NEVER overlapped by the scrollbar;
  - the **scrollbar never overlaps footer/action buttons** (reserve gutter / scrollbar-gutter or padding);
  - the footer has no stray full-width gray fill unless it is an intentional, clean divider treatment — remove the
    `bg-muted/50` bleed if it reads as an accidental gray background; if a footer surface is intended, make it look
    premium and contained (no collision with scrollbar, correct radius).
- Dialog looks premium, clean, intentional at every breakpoint and locale.
- Same correction applied to **Sheet** (`ui/sheet.tsx`) where the analogous scroll/overlap/padding issues exist.
- Docs tab must not render stacked/duplicate dialogs.

## Exact files to inspect
`ui/dialog.tsx`, `ui/dialog.stories.tsx`, `ui/sheet.tsx`, `ui/sheet.stories.tsx`, any consumer demonstrating long content.
## Exact files allowed to edit
`ui/dialog.tsx`, `ui/sheet.tsx`, `ui/dialog.stories.tsx`, `ui/sheet.stories.tsx`, `docs/design-system.md`,
`docs/ui-rules.md`, `docs/backlog.md`, new session log. NO consumer runtime changes unless STOP&ASK-approved.

## Current behavior to preserve
X / Esc / backdrop-close behavior; focus trap; z-index ordering; mobile bottom-sheet behavior; existing consumer usage.

## Positive flow
1. Normal dialog (short content) → no scrollbar at all; X top-right with safe padding; clean footer. 2. Long-content
dialog → only the body scrolls vertically; X and footer fixed, never overlapped by the scrollbar; no horizontal scroll.
3. Mobile dialog at 320 → fits, no h-scroll, actions reachable.

## Negative flow
- Very long unbroken token → wraps (`break-words`), no horizontal scrollbar appears.
- Content shorter than max-h → NO vertical scrollbar.
- Esc / backdrop / X → closes; focus restored; no stacked dialog on Docs tab.
- uk long labels in title/footer → wrap, no clip, no overlap.

## Acceptance criteria (visible + file-verifiable, negative branch each)
- AC1 No horizontal scrollbar in ANY dialog/sheet at any breakpoint/locale — grep gate: no `overflow-x-auto`/`overflow-x-scroll`
  on dialog content; verifiable at `dialog.tsx`:line + `Long Content`/`Mobile Dialog` stories.
- AC2 Normal-content dialog shows NO scrollbar — visible in `Default`/`Locale Variant` stories. Negative: only long-content scrolls.
- AC3 Close X never overlapped by the vertical scrollbar; scrollbar never overlaps footer/actions — verifiable at the
  structural change (header/body/footer regions) in `dialog.tsx`:line.
- AC4 No stray gray background; footer treatment clean/premium (or removed) — visible at all breakpoints.
- AC5 Sheet corrected analogously; X/Esc/backdrop/focus-trap preserved; Docs tab shows one dialog.
- Grep gate: `rg "overflow-x" src/components/ui/dialog.tsx src/components/ui/sheet.tsx` → none that cause h-scroll.

## Out of scope
Tabs/Button/FilterBar/Phone/Select; new dialog variants; animation redesign beyond fixing defects.

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · grep gates · AC self-audit · Manual QA.

## Manual QA checklist (OWNER QA REQUIRED)
Locales sq/en/uk/it. Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390 mandatory).
Verify: normal dialog no scrollbar; long-content vertical-only; no h-scroll; X never under scrollbar; footer never collides;
no stray gray; Sheet same; Docs no stacking.

## Final report requirements
Before/after screenshots-or-notes per defect; structural diff explanation (header/body/footer regions); grep outputs;
validation outputs; Files Changed table. NO `git add`/`commit`.
