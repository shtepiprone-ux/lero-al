# Task 511 — Trim `Select.stories.tsx` to 3 canonical sections (remove viewport/duplicate sections)

> **Executor:** Sonnet 4.6. **Type:** Storybook / visual-snapshot task.
> **Origin:** Owner review of Task 510 output (2026-06-30). Dropdowns render correctly, but the
> Select story carries duplicate sections that exist only to demonstrate a per-breakpoint behavior.
> Under the Mantine proof path (`docs/mantine-responsive-design-system.md` §8 + §13 / `rule-index.md`
> → Storybook: "Default only — toolbar-driven viewport/locale proof; no per-viewport exports"),
> sections whose sole purpose is to show a `<640`-vs-`≥640` behavior are an anti-pattern — the
> Storybook viewport toolbar already switches breakpoints, and the dropdown can simply be opened in
> the canvas to inspect the open state. Owner directive: keep only the meaningful states.

## Pre-read (load only these)

**Always required:** `docs/agent-contract.md` · `docs/backlog.md` · `docs/critical-flow-registry.md` (scan — this is a Storybook-only change; no product/runtime flow is touched, so confirm no registry row applies).

**Storybook task bundle:**
- `docs/mantine-responsive-design-system.md` §8 (Mantine Storybook proof rules) + §13 (Storybook rebuild plan)
- `docs/storybook-governance.md`
- `docs/storybook-visual-snapshots.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`

## Scope (exact)

Edit **one story file** plus orphaned-i18n cleanup. Do NOT touch the primitive (`MantineSelect.tsx`),
the barrel, the foundation hook, or any runtime/product code. No "while I'm here" edits.

Files in scope:
- `src/stories/mantine/primitives/Select.stories.tsx`
- `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` (orphaned-key removal only)

## Current behavior to preserve

`Select.stories.tsx` (post-Task-510) exports ONE `Default` story rendering SIX labelled sections of
`MantineSelect`:
1. **resting** — §6d chrome (gray-2 border / shadow-xs / brand focus / gray-4 placeholder / 44px); full-width <640, anchored ≥640.
2. **open state** — `defaultDropdownOpened` + `comboboxProps={{ withinPortal: false }}`.
3. **error** — `error={t('sel_error')}`, red-6 border / no shadow.
4. **disabled** — whole control faded (label + field + chevron → opacity 0.5).
5. **long-uk option stress** — renders `optionsWithStress` (adds `sel_option_long_stress`).
6. **disabled-no-open (negative)** — `disabled` + `optionsWithStress`.

The story uses `storyT`, `parameters: { skipCanvas: true, layout: 'fullscreen' }`, the `withCanvas`
global decorator, and toolbar-driven locale (`context.globals.locale`). All chrome/behavior of
`MantineSelect` itself stays exactly as Task 510 shipped it.

## Required after-behavior

The `Default` story renders **exactly THREE** sections, in this order, unchanged in props from the
originals:
1. **resting** (original section 1 — keep verbatim).
2. **error** (original section 3 — keep verbatim).
3. **disabled** (original section 4 — keep verbatim).

Remove:
- **Section 2 (open state)** — owner: the open state can be inspected by simply opening the Select in
  the canvas; a dedicated section is redundant. Delete the section, including the now-unused
  `defaultDropdownOpened` and `comboboxProps` props on that instance.
- **Section 5 (long-uk option stress)** — delete the section.
- **Section 6 (disabled-no-open)** — delete the section (pure duplicate of section 4 at every width).

Consequent cleanup (required, to keep the diff honest and gates green):
- The `optionsWithStress` const is now unreferenced → **delete it**.
- `storybook.mantine.sel_option_long_stress` is now orphaned → **remove that key from all four**
  `messages/{sq,en,uk,it}.json`, keeping the four files at identical key sets (`check:i18n` parity
  must stay green). Do NOT remove any other key (`sel_label`, `sel_placeholder`, `sel_hint`,
  `sel_error`, `sel_option_apartment|house|commercial|land` all remain in use).
- Keep the `options` const (used by all three remaining sections).
- The `optionsWithStress`/long-stress coverage is intentionally dropped per owner; long-label wrap is
  still exercised by the toolbar **uk** locale on the remaining sections (uk@320/375/390 stress cells
  remain mandatory in the rendered matrix).

> Out of scope (do NOT fold in): the `MantineBottomSheetSelect.tsx` empty-stub deletion and the
> orphaned `sel_sheet_note` key are Task 509/510 commit tails — leave them for that commit, do not
> touch them here.

## Positive flow (happy path)

- **Actor:** developer opening Storybook → `Mantine/Primitives/Select` → `Default`.
- **Precondition:** Task 510's `Select.stories.tsx` is the current file; `MantineSelect` unchanged.
- **Steps / system response:**
  1. Story loads → canvas shows three sections only: resting, error, disabled — top to bottom, full-bleed `withCanvas`.
  2. Toolbar viewport set to 320/375/390 → each section is full-width edge-to-edge; trigger ≥44px; no h-scroll; labels wrap in all four locales.
  3. Toolbar viewport ≥640 → each Select is anchored width per §6d.
  4. Toolbar locale → sq/en/uk/it → every visible string switches (no hardcoded literal); uk long labels wrap, never clip at 320.
  5. Opening the resting Select in the canvas shows the dropdown/bottom-sheet (this replaces the deleted "open state" section).
- **Success state:** three sections, all strings from `t()`, gates green, rendered matrix all PASS.
- **Post-conditions:** `check:stories` 0 violations; `check:i18n` parity unchanged-minus-one-key across 4 locales; `screenshots:assert` exit 0.

## Negative flow (every off-happy-path branch)

- **Orphaned i18n key left behind:** if `sel_option_long_stress` is deleted from only some locales → `check:i18n` parity FAILS. Required: remove from ALL four or none — here, all four.
- **Dangling reference:** if `optionsWithStress` is deleted but a section still references it (or vice-versa) → `tsc` FAILS. Required: delete the const AND all three referencing sections together (sections 5 + 6 referenced it).
- **Hardcode regression:** if any remaining/edited string is inlined instead of `t()` → `check:stories` FAILS. Required: no raw user-facing literals.
- **Layout regression:** if `parameters.layout` is changed away from `'fullscreen'` / `skipCanvas` is dropped, defeating `withCanvas` full-width → mobile full-width gate FAILS. Required: leave story `parameters` and the decorator untouched.
- **Scope creep:** any edit to `MantineSelect.tsx`, the barrel, the hook, or unrelated stories → REJECT. Required: stay within the listed files.
- **Over-deletion:** removing a still-used key (e.g. `sel_error`, `sel_hint`) → broken render / parity break. Required: remove ONLY `sel_option_long_stress`.

## Mobile <640 full-width gate (OWNER P0 — MANDATORY)

This task removes sections but must NOT regress the mobile treatment of the survivors. The three
remaining `MantineSelect` instances MUST stay full-width edge-to-edge below 640px (driven by the
unchanged `withCanvas` decorator + `layout: 'fullscreen'` + `MantineSelect`'s own bottom-sheet
behavior). Trigger ≥44px; labels wrap (sq/en/uk/it); no clip / no horizontal scroll at 320. No story
parameter or decorator change is permitted that would re-introduce a centered/`padded` layout.
Exemptions: none.

## Acceptance criteria (every item verifiable in the diff or the rendered matrix)

1. `Select.stories.tsx` renders exactly three sections — resting, error, disabled — in that order; sections 2, 5, 6 deleted. *(Positive flow steps 1; diff at file)*
2. `defaultDropdownOpened` and `comboboxProps` no longer appear anywhere in the file. *(diff)*
3. `optionsWithStress` const deleted; `options` const retained and still referenced by all three sections. *(Negative flow → dangling reference; diff + tsc=0)*
4. `storybook.mantine.sel_option_long_stress` removed from `messages/sq.json`, `en.json`, `uk.json`, `it.json`; no other key changed; `check:i18n` parity green. *(Negative flow → orphaned key; diff + gate)*
5. No raw user-facing string literals introduced; `check:stories` 0 violations. *(Negative flow → hardcode; gate)*
6. Story `parameters` (`skipCanvas: true, layout: 'fullscreen'`) and the global `withCanvas` decorator unchanged. *(Mobile gate; diff)*
7. **Rendered verification matrix** in the session log: breakpoints (320·375·390·768·1280·1440·2560) × locales (sq·en·uk·it), uk@320/375/390 mandatory, each cell PASS with concrete evidence (3 sections present, full-width <640, label wrap, no clip/overflow, no h-scroll). Produced by `responsive-screenshots --assert` (machine artifact) — self-reported PASS / "no browser access" cells are an auto-reject. *(clause 12 + 13)*
8. Self-validation block: `tsc --noEmit`=0 · `check:stories`=0 · `check:i18n` parity green · `screenshots:assert` exit 0 · AC-by-AC table all green · scope=clean.
9. File-integrity transcript for every touched file (0 NUL bytes, JSON parses, no truncation).
10. `docs/backlog.md` "Last Session" updated (2–4 lines) + session log `docs/sessions/2026-06-30-task511-trim-select-story-sections.md` with a **Files Changed** table (one row per path + 1-line rationale).

## Hard contract (verified against the diff on return)

- No scope change; no invented architecture (ambiguity → STOP and ASK).
- No silent removal of unrelated functionality; only the three named sections + one orphaned key go.
- All four locales stay at an identical key set.
- **Do NOT run git.** Provide the "Files Changed" table; the **orchestrator** emits the commit
  command at review. The executor never runs `git add`/`commit`.
- Update `docs/backlog.md` + add the session log.

## Definition of done

Three-section story; gates green; rendered matrix attached with uk@320/375/390 PASS cells; session
log + Files Changed table present; awaiting orchestrator diff review + commit emission.
