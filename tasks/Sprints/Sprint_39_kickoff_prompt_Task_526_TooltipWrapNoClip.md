# Task 526 — MantineTooltip desktop MUST WRAP long content, never clip/overflow (Task 524 follow-up, OWNER rejection 2026-07-02)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Batch C P1.22 (correction of Task 524).
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus. **Type:** UI defect fix (clause 12 + clause 16).
> **This is a correction to the UNCOMMITTED Task 524 work** — edit the same `MantineTooltip.tsx` + story; the orchestrator
> will commit the Tooltip primitive ONCE after this lands. Do NOT create a new component.

## The defect (owner-verified, rendered)
At 680px (IT locale) the desktop anchored tooltip renders its long label on a SINGLE line (`whitespace-nowrap` per §6k) and
**runs off the right edge of the screen — the text is clipped / overflows the viewport.** The owner rejected this: the
tooltip MUST **adapt — wrap the text onto multiple lines** within a sensible max-width, and stay fully visible on screen.
This violates the existing no-clip/no-overflow gate (clause 12) for long localized (uk/it) content.

## Root cause
§6k documented TailAdmin's tooltip as `whitespace-nowrap` (correct for TailAdmin's SHORT demo labels). Our tooltips carry
long, localized labels (sq/en/uk/it), so `nowrap` overflows. Mantine `Tooltip` is single-line by default and needs
`multiline` + a max-width to wrap.

## Pre-read
**Always:** `docs/agent-contract.md` (clause 12 rendered evidence + clause 16 TailAdmin style), `docs/backlog.md`,
`docs/critical-flow-registry.md` (SCAN — primitive+story only → no registry row; confirm in log).
**Required:** `docs/tailadmin-style-reference.md` **§6k** (the tooltip chrome — you will ADD the documented wrap divergence
here), `docs/mantine-responsive-design-system.md` §25 (the MantineTooltip section — update the desktop-wrap note),
`docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
**Study:** the current uncommitted `src/design-system/mantine/patterns/MantineTooltip.tsx` +
`src/stories/mantine/primitives/Tooltip.stories.tsx` (Task 524).

## Scope (exactly this — no more)
1. **`MantineTooltip.tsx` — desktop (≥640) tooltip must WRAP, not clip:** set Mantine `Tooltip` `multiline` and a
   **max-width** (`w`/`maw`) so long content wraps onto multiple lines and never exceeds a sane width. Recommended `maw` ≈
   **260px** (Mantine token or explicit — cite it); the exact value is Sonnet's to pick within 240–320px, documented in §6k.
   The tooltip must also stay within the viewport — rely on Mantine Floating-UI auto-placement/`withinPortal`; if it still
   overflows at an edge, enable the appropriate flip/shift (do NOT hand-position). Keep ALL other §6k chrome IDENTICAL:
   bg gray-800 `#1d2939`, white text, 12px/`font-medium` 500, radius 8px, padding 8px 14px, `shadow-md`, `withArrow`, and
   the Task-524 `events={{hover:true, focus:true, touch:false}}` fix.
2. **Do NOT change the <640 path** — the mobile `ResponsiveBottomSheet` already wraps correctly; leave it untouched.
3. **Story — show ALL FOUR placements (owner feedback 2026-07-02: left/right variants are missing).** The current Task 524
   story shows only `top` (standard) and `bottom`. Add **`position="right"` and `position="left"`** sections so the story
   demonstrates the full TailAdmin placement set — **Top · Right · Bottom · Left** — each opening on hover/focus at ≥640
   anchored on the correct side, and each STILL collapsing to the SAME full-width bottom sheet at <640 (position ignored
   there). Use `storyT()` strings with sq/en/uk/it parity (add `tooltip_right_*` / `tooltip_left_*` keys as needed). Keep
   **Default export only**, distinct-STATE sections, real interaction (NO `defaultOpened`). Confirm `MantineTooltip` passes
   `position` straight to Mantine `Tooltip` so all four values work (they already should via the `position` prop).
4. **Docs:** update **§6k** in `tailadmin-style-reference.md` to record the **intentional divergence** — "our `MantineTooltip`
   uses `multiline` + `maw ≈ 260px` so long localized (sq/en/uk/it) labels WRAP; TailAdmin's own `whitespace-nowrap` is
   correct only for short labels and is overridden here (owner P0, 2026-07-02, clip rejection)." Update
   `mantine-responsive-design-system.md` §25 desktop note to match.

**OUT OF SCOPE:** the mobile bottom-sheet path; any other primitive; the foundation files; §6k values other than adding the
wrap/max-width note; behavior/API beyond `multiline`+`maw`.

## 🛑 STOP-and-ASK
- If a `maw` in 240–320px still clips at some breakpoint/locale, or if the owner's intended max-width is unclear → STOP and
  ASK rather than guessing a very wide/narrow value.

## Current behavior to preserve
- ≥640 chrome (colors/radius/padding/shadow/arrow/focus events) unchanged except the added `multiline`+`maw` wrap.
- <640 `ResponsiveBottomSheet` path unchanged; `grep "function DragHandle"` still ONE match; foundation files untouched.
- `position` prop, hover+focus open, backdrop/Esc close on mobile — all unchanged.

## Required after-behavior
- ≥640: a long label WRAPS onto multiple lines inside a ≤`maw` bubble, fully on-screen — **no clip, no viewport overflow,
  no h-scroll** — at every breakpoint × sq/en/uk/it. Short labels still render compactly.
- <640: unchanged full-width bottom sheet with wrapping label.

## Positive flow
Desktop user hovers/focuses the info trigger → tooltip appears anchored per `position`, and if the label is long it wraps to
2–3 lines within the max-width, fully visible. Mobile user taps → full-width bottom sheet with the wrapped label.

## Negative flow
- **Very long uk/it label** → wraps within `maw`; never clips, never pushes off-screen, never causes page h-scroll.
- **Near a viewport edge** → tooltip flips/shifts to stay fully visible (Floating-UI), still wrapped.
- **Short label** → compact single/short bubble, no awkward forced width.
- **<640** → unaffected (bottom sheet).

## 🔴 Mobile <640 full-width gate (clauses 11–12) & TailAdmin conformance (clause 16)
Mobile path unchanged (full-width sheet). Desktop chrome stays pixel-exact to §6k EXCEPT the documented wrap
(`multiline`+`maw`). Zero invented color/px/radius/shadow. Prove with RENDERED evidence.

## 🔴 Rendered proof matrix (clause 12 — MANDATORY, from actual hover/focus + tap renders)
Rows = `short label (≥640)` · `LONG label wraps (≥640, no clip/overflow)` · `placements top/right/bottom/left (≥640)` ·
`long label mobile sheet (<640)` ; columns = **uk@320 · uk@375 · uk@390 · en@768 · it@680 (the rejected cell — must now
wrap) · sq@1280**. Each ≥640 cell: the long tooltip wraps within `maw`, fully on-screen, arrow intact, §6k colors exact,
and each of the four placements anchors on the correct side; no viewport overflow, no h-scroll@320.
`tsc=0`/gates are BASELINE, never style proof — attach the actual toolbar renders (especially it@680).

## Acceptance criteria
1. Desktop `MantineTooltip` uses `multiline` + `maw` (240–320px, cited); long labels WRAP, no clip/overflow — verifiable in
   diff AND the rendered matrix incl. **it@680 (the rejected cell)**. *(Scope 1; clause 12; Positive/Negative flow)*
2. All other §6k chrome unchanged (bg `#1d2939`, white, 12px/500, radius 8px, 8px 14px, `shadow-md`, `withArrow`,
   `events{hover,focus}`). *(clause 16)*
3. <640 bottom-sheet path untouched; `grep "function DragHandle"` = ONE match; foundation files unchanged. *(scope discipline)*
4. **Story shows all four placements — Top · Right · Bottom · Left — at ≥640**, each anchored on the correct side and each
   collapsing to the SAME bottom sheet at <640; verifiable in diff AND the placements matrix row. *(Scope 3; owner feedback)*
5. §6k + §25 updated with the documented wrap divergence (owner P0). *(Scope 4)*
6. Locale parity intact (new `tooltip_right_*`/`tooltip_left_*` keys ×4 if added); zero invented values; gates green:
   `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean — paste transcript.

## Self-validation & hand-off
Run `npx tsc --noEmit` → 0; paste AC-by-AC self-audit citing both flows; render it@680 + uk@320/375/390 and confirm the long
tooltip WRAPS fully on-screen before writing "complete". Update `docs/backlog.md` Last Session + add to the Task 524 session
log (or a new `docs/sessions/2026-07-02-task526-tooltip-wrap-no-clip.md`) with a Files Changed table + the rendered matrix.
**Emit NO `git add`/`git commit`** — the orchestrator commits the Tooltip primitive (524+526) together after review.
