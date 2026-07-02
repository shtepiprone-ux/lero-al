# Task 524 — Canonical responsive Tooltip: `MantineTooltip` (Batch C P1.22 — LAST Batch C overlay)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → Batch C overlays → **P1.22 Tooltip**.
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews diff + clicked-open rendered matrix at 320/375/390 × 4 locales).
>
> **Owner sequence (2026-07-02):** the FINAL Batch C overlay, after Popover (513) · DropdownMenu (515) · NavigationMenu
> (518) · Modal (519) · Drawer (523). Same foundation-consuming shape — build ONE canonical `MantineTooltip` that is a
> hover/focus **Mantine `Tooltip`** at ≥640 and a tap-triggered full-width **bottom sheet** at <640, reusing the Task 514
> single source (`useResponsiveDropdown` + `ResponsiveBottomSheet` + `SheetContent`). NO new bottom-sheet code, NO second
> `DragHandle`, NO inline `bottomSheetDrawerStyles`, NO inline `<Drawer position="bottom">` block.

## Why this task
There is **no legacy `tooltip.tsx`** and **zero `Tooltip` consumers** in `src/` today (grep-confirmed) — Tooltip is the
"extract on use" primitive (`tailadmin-style-reference.md §6/§6d` line 134–136: Tooltip is NOT in the static build; its
chrome must be extracted into a new **§6k** row from the source-of-truth BEFORE implementing — do NOT invent px/colors).
Per the Mantine freeze (rule-index §UI, Task 482) and the **Batch C adoption pattern** already documented in
`mantine-responsive-design-system.md §19` (which explicitly names **Tooltip** as a `useResponsiveDropdown` +
`ResponsiveBottomSheet` consumer), this slice creates a canonical `MantineTooltip`: a hover/focus tooltip on desktop and a
tap-to-open full-width bottom sheet on mobile (P0: all popups are full-width bottom sheets below 640).

This is a **primitive + story slice, NO product migration** (same class as 513/515/518/519/523).

## Pre-read (UI / overlay task — from `docs/rule-index.md` → "UI / layout / component task")
**Always:** `docs/agent-contract.md` (clauses 11–12 = the mobile full-width gate + rendered-evidence gate),
`docs/backlog.md`, `docs/critical-flow-registry.md` (**SCAN** — foundation+story only, no product/auth/RLS surface → no
registry row needed; confirm in the session log).
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` — **§7** mobile gate, **§8.1** page-gutter rule,
**§8.2** (one section per STATE, overlays open by REAL interaction — NO `defaultOpened`/baked-open), **§12** canonical
patterns, **§16** acceptance gates, **§18** CSS pitfalls, **§19** (the **Batch C adoption pattern** you are following) +
**§19.1a** (`SheetContent` = blob-content consumers only — Tooltip label IS blob content → wrap in `SheetContent`),
**§20–§24** (Popover · DropdownMenu · NavigationMenu · Modal · **Drawer** precedents). Then
`docs/tailadmin-style-reference.md` **§6/§6d** (the extraction rule, lines 134–136) + skim **§6e–§6j** (existing state
matrices, so §6k matches their format) — you WILL add a NEW **§6k** Tooltip row (do NOT reuse §6e, which is already
Input/Select/Textarea/PasswordInput),
`docs/ui-rules.md` (§15a mobile gate), `docs/component-rules.md` (canonical-first, Task 426), `docs/qa-rules.md`,
`docs/storybook-governance.md`.
**Study before coding (REUSE — do NOT modify):**
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` (Task 514 single source — `useResponsiveDropdown`,
  `ResponsiveBottomSheet`, `SheetContent` gutter, `DragHandle`, `bottomSheetDrawerStyles`; do NOT change its mechanics).
- `src/design-system/mantine/patterns/MantinePopover.tsx` (**closest precedent** — self-managed disclosure, span-onClick →
  `openDrawer()` sheet on mobile, anchored overlay on desktop; mirror this wiring).
- `src/design-system/mantine/patterns/MantineDrawer.tsx` + `MantineModal.tsx` (the two most recent blob-content consumers
  using `SheetContent`).
- `docs/tailadmin-style-reference.md §6d/§6k` + `demo_tailadmin_com.zip` (repo root, gitignored) — the SOURCE-OF-TRUTH for
  the tooltip chrome you will extract (bg, text color, font-size, padding, radius, shadow, arrow).

## Scope (exactly this — no more)
1. **CONSUME the already-extracted `tailadmin-style-reference.md §6k` chrome — do NOT re-extract, do NOT invent.** The
   orchestrator already extracted the real TailAdmin tooltip values from the live demo (`demo.tailadmin.com/tooltips.html`)
   on 2026-07-02 and wrote them into **§6k** (the component is NOT in the supplied zip — that's why §6k cites the live
   source). Apply §6k EXACTLY: **default = Dark** — bg gray-800 `#1d2939`, white text, 12px/`font-medium` 500 Outfit,
   radius `lg` (8px), padding 8px 14px, `shadow-md`, `withArrow` (arrow inherits bubble bg). (White variant = bg-white /
   text gray-700 / 1px gray-200 border / `shadow-md` — expose only if a consumer needs it; default is Dark.) This chrome
   applies to the **≥640 anchored Mantine `Tooltip`**; at <640 the content uses the shared `ResponsiveBottomSheet` (P0),
   which keeps the canonical bottom-sheet chrome. **Zero invented color/px/radius/shadow — every value traces to §6k.** If
   any §6k value seems unworkable in Mantine → STOP and ASK (do NOT substitute your own).

2. **New component** `src/design-system/mantine/patterns/MantineTooltip.tsx`, exported from
   `src/design-system/mantine/patterns/index.ts`. Canonical P0-compliant responsive Tooltip.

   **API (literal — implement exactly this shape; if a field is genuinely unworkable → STOP and ASK):**
   ```ts
   export interface MantineTooltipProps {
     /** Short tooltip text/content (label-like; not rich/interactive content) */
     label: ReactNode
     /** The single trigger element the tooltip describes — an INFO affordance (e.g. an info icon), NOT an
      *  already-interactive control (see STOP-and-ASK). Must be focusable/tappable. */
     children: ReactNode
     /** Desktop tooltip position; 'top' | 'bottom' | 'left' | 'right'. Default 'top'. Ignored <640. */
     position?: 'top' | 'bottom' | 'left' | 'right'
     /** Optional heading shown above the label inside the mobile bottom sheet only. */
     title?: ReactNode
   }
   ```

3. **Behavior (follow §19 adoption pattern + mirror `MantinePopover` wiring):**
   - **≥640 (desktop):** render a Mantine `Tooltip` (`label`, `position={position ?? 'top'}`, `withArrow` per the §6k
     extraction) wrapping `children`. Opens on **hover AND keyboard focus** (Mantine default — do NOT disable focus, it is
     the a11y path). Chrome ENTIRELY from the §6k extracted values (theme default or `styles`), zero invented px/colors.
   - **<640 (mobile):** hover does not exist on touch, so the tooltip content is surfaced via the P0 bottom sheet. Render
     `children` wrapped in a tappable/focusable affordance that on tap calls `openDrawer()` (from `useResponsiveDropdown`)
     → render `<ResponsiveBottomSheet opened={drawerOpened} onClose={closeDrawer} title={title}>` with `label` wrapped in
     `SheetContent` (Task 520 gutter — `label` is blob content, per §19.1a). Backdrop tap + Esc close (foundation
     default); focus returns to the trigger (Mantine `returnFocus`).
   - **One source, no fork:** switch on `useResponsiveDropdown().isMobile`. Do NOT instantiate a second DragHandle/Drawer,
     do NOT inline `bottomSheetDrawerStyles`, do NOT copy `MantineDialogDrawerPattern`'s chrome. Sheet always closed on SSR.

4. **Proof story** `src/stories/mantine/primitives/Tooltip.stories.tsx` mirroring `Popover.stories.tsx`/`Drawer.stories.tsx`:
   `parameters: { skipCanvas: true, layout: 'fullscreen' }`, **Default export only**, explicit page-gutter Box (§8.1), all
   strings via `storyT()` against a `storybook.mantine.tooltip_*` key set with **sq/en/uk/it parity**. Overlay opens by REAL
   interaction (hover/focus ≥640, tap <640 — NO `defaultOpened`/baked-open, §8.2). **Distinct-STATE sections only:**
   - Section 1 — **standard info tooltip**: an info-icon trigger (`tooltip_trigger_aria` via `t()` for its `aria-label`) with
     a short `tooltip_label`. ≥640: hover/focus shows the anchored tooltip; <640: tap opens the full-width bottom sheet with
     the label. Prove via toolbar viewport switch on this ONE section.
   - Section 2 — **long-uk label**: the same trigger with a long `tooltip_long_label` (real uk Cyrillic) — proves the label
     wraps inside the full-width sheet at 320 (no clip, no h-scroll) and the ≥640 tooltip wraps within a sane max-width.
   - Section 3 — **position variant**: a trigger with `position="bottom"` — proves the desktop `position` prop while <640
     STILL collapses to the SAME bottom sheet (position has no effect).
   Long-uk labels live in `uk.json` values (real Cyrillic), NOT a `LongUk` export.

5. **Docs:** add **§25 — Canonical responsive Tooltip: `MantineTooltip` (Task 524)** to
   `docs/mantine-responsive-design-system.md`, following the §20/§21/§22/§23/§24 template (core mechanism · SSR/hydration
   caveat · Storybook proof location · P0 gate · the hover→tap-sheet split ≥640 vs <640 · reference the §6k chrome).
   **§6k already exists (orchestrator-populated 2026-07-02) — do NOT re-add, edit, or duplicate it; just cite it.** Flip the tracker row
   `P1.22 | Tooltip | (in ui) | §6d (extract on use) | ⬜` → `✅ Task 524` in
   `docs/mantine-tailadmin-migration-tracker.md`, and update the "Current pointer" line: **mark P1.22 ✅ and Batch C
   COMPLETE; next = Batch D (P1.13 Pagination · P1.15 Alert · P1.21 Command · P1.23 Progress · P1.24 Skeleton · P1.25
   Separator · P1.26 ScrollArea · P1.27 Slider · P1.29 Toast).**

**OUT OF SCOPE:** every Batch D primitive (do NOT start them); ANY change to `responsiveBottomSheet.tsx` bottom-sheet
mechanics (`useResponsiveDropdown`/`ResponsiveBottomSheet`/`SheetContent`/`DragHandle`/`bottomSheetDrawerStyles` — leave
them); editing/deleting `MantineDialogDrawerPattern.tsx`, `MantinePopover`, `MantineModal`, `MantineDrawer`,
`MantineSelect`, `MantineDropdownMenu`, `MantineNavigationMenu`; any product surface / tooltip-consumer migration
(Phase 3–5); adding a Tooltip to any existing control.

## 🛑 STOP-and-ASK triggers (do NOT invent architecture)
- **Interactive-wrapped trigger:** this primitive targets an **info affordance** (e.g. an info icon). If a real consumer
  needs to wrap an ALREADY-interactive control (a control with its own tap/click action, where the mobile tap-to-open-sheet
  would HIJACK that action) → **STOP and ASK.** Do not guess a long-press / suppress / dual-tap behavior.
- **§6k chrome extraction:** if the TailAdmin tooltip's exact chrome (arrow/pointer, shadow, or any value) cannot be
  extracted cleanly from `demo_tailadmin_com.zip`/the live site, or the arrow cannot be reproduced by Mantine `withArrow`
  → **STOP and ASK** before inventing any px/color.
- **Rich/interactive tooltip content:** if a consumer needs non-label rich or interactive content (buttons, links) in the
  tooltip → **STOP and ASK** (that is a Popover, not a Tooltip).
- If representing the label in the shared `ResponsiveBottomSheet` requires changing the Task 514 source
  (`responsiveBottomSheet.tsx`) rather than passing `opened`/`onClose`/`title`/children (+ `SheetContent`) through →
  **STOP and ASK.**
- If the desktop tooltip needs a controlled open state (rather than Mantine's default hover/focus) → **STOP and ASK.**

## Current behavior to preserve
- The Task 514 single source, `MantineDialogDrawerPattern`, `MantinePopover`, `MantineModal`, `MantineDrawer`,
  `MantineSelect`, `MantineDropdownMenu`, and `MantineNavigationMenu` remain UNCHANGED.
- `grep "function DragHandle" src/design-system/mantine` STILL = **ONE match** after this task; NO new inline
  `bottomSheetDrawerStyles` / `<Drawer position="bottom">` block outside `responsiveBottomSheet.tsx`.
- No legacy file is deleted (there is no `tooltip.tsx`); no existing §6a–§6d row is altered — §6k is ADDED.
- Existing exports in `patterns/index.ts` unchanged except the ADDED `MantineTooltip` lines.

## Required after-behavior
- **<640, tap:** the tooltip content is a full-width edge-to-edge bottom sheet (Task 514 source) with a centered drag
  handle (517) + optional heading; `label` sits in the `SheetContent` gutter and wraps; ≥44px trigger touch target; no clip,
  no h-scroll at 320. NOT an anchored mini-tooltip on mobile. `position` has NO effect at <640.
- **≥640, hover/focus:** a Mantine `Tooltip` anchored per `position` (default top) with the §6k chrome; opens on hover AND
  keyboard focus; label wraps within a sane max-width.
- **Closed on SSR / first paint:** no flash (documented `useResponsiveDropdown` caveat, same as §20.2/§21.2/§22.2/§23/§24.2).

## Positive flow (happy path)
Actor at 320–390px taps the info trigger → a full-width bottom sheet slides up with the label (centered drag handle +
optional heading). Taps backdrop / presses Esc → closes, focus returns to the trigger. At ≥640 the SAME primitive shows an
anchored tooltip on hover OR keyboard focus, positioned per `position`; moving away / blur hides it.

## Negative flow (every off-happy-path branch)
- **Backdrop tap / Esc (<640)** → closes the sheet; focus returns to the trigger.
- **Keyboard focus (≥640)** → tooltip shows on focus, not only hover (a11y path preserved).
- **Long uk label** → wraps inside the full-width sheet at 320 (no clip, no h-scroll); ≥640 tooltip wraps within max-width.
- **`position="bottom"`** → ≥640 anchors below; <640 STILL the SAME bottom sheet (position ignored) — proven in the story.
- **Rapid re-tap / re-hover** → self-managed disclosure; no duplicate sheet/tooltip instances.
- **SSR / first paint** → `useResponsiveDropdown` `isMobile=false` on first render; sheet closed on SSR; no flash.

## 🔴 Mobile <640 full-width gate (clauses 11–12)
Opened tooltip content at <640 = full-width edge-to-edge bottom sheet (Task 514 source), NOT an anchored mini-tooltip, NOT
a centered card. Centered drag handle (517); trigger ≥44px; label wraps (`whitespace-normal break-words`); no h-scroll at
320; body internal scroll ≤90dvh if long. ≥640 = anchored Mantine Tooltip. Verify with RENDERED evidence, not tsc.

## 🔴 Zero hardcode / canonical-first (Task 426)
The tooltip chrome comes ENTIRELY from the extracted §6k values (theme/`styles`) — ZERO invented px/colors; cite §6k. The
<640 chrome comes ENTIRELY from the Task 514 `ResponsiveBottomSheet` + `SheetContent` (do NOT re-implement/inline them).
All strings via `storyT()` ×4 (`storybook.mantine.tooltip_*`); the trigger `aria-label` via `t()` with sq/en/uk/it parity.
No raw `<button>` — canonical Mantine primitives only. No duplicated `DragHandle`/`<Drawer position="bottom">`/
`bottomSheetDrawerStyles` — grep stays ONE match.

## 🔴 Rendered proof matrix (clause 12 + §8.2 — MANDATORY, produced from ACTUAL interaction renders)
Rows = `trigger resting` · `standard tooltip open (label)` · `long-uk label open` · `position=bottom open` ; columns =
**uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320 · one ≥640 cell (anchored Tooltip, e.g. en@768 incl. position variant)**.
Per cell confirm: <640 opened = full-width edge-to-edge bottom sheet with a **centered** drag handle (517), label wraps, no
h-scroll@320; ≥640 = anchored Tooltip with §6k chrome opening on hover/focus. `tsc=0`/gates are BASELINE, never proof.
(Mantine proof path = toolbar-driven owner render review per §13/§16 — capture the cells from the actual Storybook toolbar,
not a description. Hover/focus states captured on the ≥640 cell.)

## Acceptance criteria
1. Component consumes the **existing §6k** values EXACTLY (dark default: bg gray-800 `#1d2939`, white text, 12px/500,
   radius 8px, padding 8px 14px, `shadow-md`, `withArrow`); §6k is NOT re-added/edited; zero invented color/px/radius/shadow. *(Scope 1; Task 426; clause 16)*
2. `MantineTooltip` exists with the literal API above and is exported from `patterns/index.ts`. *(Scope 2)*
3. At <640 a tap opens the full-width `ResponsiveBottomSheet` (Task 514 source) edge-to-edge with a centered drag handle +
   optional heading; `label` in the `SheetContent` gutter; `position` has no effect; verifiable in the diff AND the rendered
   matrix. *(Scope 3; clause 11; Positive/Negative flow)*
4. At ≥640 an anchored Mantine `Tooltip` opens on hover AND keyboard focus, positioned per `position` (default top; bottom
   proven), §6k chrome; verifiable in the diff AND a ≥640 rendered cell. *(Scope 3)*
5. Backdrop tap + Esc close the sheet, focus returns to the trigger; self-managed disclosure prevents duplicate instances;
   SSR sheet closed / no flash. *(Negative flow)*
6. `grep "function DragHandle" src/design-system/mantine` = **ONE match**; NO inline `bottomSheetDrawerStyles` /
   `<Drawer position="bottom">` outside `responsiveBottomSheet.tsx`; `responsiveBottomSheet.tsx` + `MantinePopover.tsx` +
   `MantineModal.tsx` + `MantineDrawer.tsx` + `MantineDialogDrawerPattern.tsx` UNCHANGED. *(canonical-first; Task 514 integrity)*
7. Story: `skipCanvas:true` + `layout:'fullscreen'` + page-gutter Box; **Default only**; distinct-STATE sections
   (standard · long-uk · position-bottom), overlay opened by REAL interaction, NO per-viewport section and NO `defaultOpened`;
   clicked/hover-open rendered matrix complete incl. uk@320/375/390 and a ≥640 cell. *(Scope 4; clause 12; §8.2)*
8. Docs §25 added + §6k added + tracker P1.22 → ✅ Task 524 (Batch C COMPLETE, pointer → Batch D);
   `storybook.mantine.tooltip_*` keys with sq/en/uk/it parity (uk = real Cyrillic); no consumer API break. *(Scope 5; clause 7)*
9. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean
   (clause 14) — paste the transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit (each AC → file:line OR runtime step → ✅/❌) citing both flows by
name; walk the tooltip at `uk` 320px (tap trigger → full-width bottom sheet → backdrop/Esc close, focus returns) AND at ≥640
(hover AND keyboard-focus open, position top + bottom) end-to-end before writing "complete". Add a **Files Changed table** to
`docs/sessions/2026-07-02-task524-tooltip-bottom-sheet.md` + the clause-12 rendered matrix, and update `docs/backlog.md`
Last Session. **Emit NO `git add`/`git commit`** — the orchestrator emits commits after diff review. Do NOT start until you
have (a) extracted the §6k chrome from the source-of-truth, and (b) read the Task 514 source + `MantinePopover.tsx` + §19 +
§8.2 and confirmed the hover/focus ≥640 + tap→`ResponsiveBottomSheet` <640 approach (else STOP-and-ASK).
