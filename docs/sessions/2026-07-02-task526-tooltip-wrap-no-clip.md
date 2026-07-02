# Task 526 — `MantineTooltip` desktop MUST WRAP long content, never clip/overflow (Task 524 follow-up, owner rejection)

Kickoff: `tasks/Sprints/Sprint_39_kickoff_prompt_Task_526_TooltipWrapNoClip.md`. Correction to the uncommitted Task 524 work — full Task 524 context (§6k extraction blocker, the focus-events defect, the initial rendered matrix) lives in `docs/sessions/2026-07-02-task524-tooltip-bottom-sheet.md`. This log covers only the 526 delta.

## The defect (owner-verified, rendered)

At 680px (it locale) the desktop anchored tooltip rendered its long label on a single line (`whitespace-nowrap` per §6k) and ran off the right edge of the viewport — clipped/overflowed. §6k had documented TailAdmin's own short-label `nowrap` correctly, but our tooltips carry long, localized (sq/en/uk/it) labels, so `nowrap` was wrong for this consumer. Second owner finding: the Task 524 story only demonstrated `top`/`bottom` placements — `left`/`right` (part of TailAdmin's full placement set) were missing.

## Fix

**Wrap, not clip:** added `multiline` + `maw="16.25rem"` (260px, within the kickoff's 240–320px range) to the desktop `Tooltip` in `MantineTooltip.tsx`. Every other §6k chrome value (bg `#1d2939`, white text, 12px/500, radius 8px, padding 8px 14px, `shadow-md`, `withArrow`, the Task 524 `events` focus fix) is unchanged. The mobile `ResponsiveBottomSheet` path was not touched.

**Story — all 4 placements:** replaced the single `position="bottom"` section with a "placement variants" section containing a `Group` of four triggers (top/right/bottom/left), each independently hoverable/focusable.

**Real defect caught + fixed via rendered verification during this same session (not assumed):** my first placement-variants layout put all 4 triggers near the left edge of the page. Measuring showed `position="left"` auto-flipped to the right — not a component bug, but Floating-UI's `flip` middleware correctly refusing to render the 260px-wide bubble somewhere that would run off the left edge of the viewport (only ~204px of room available). My first fix (`Group justify="flex-end"`) solved `left` but broke `right` the same way (starved it of room on its right instead). Final fix: `Group justify="space-between" w="100%"` so the two horizontal-anchor triggers (`right` near the left end of a full-width row, `left` near the right end) each get maximum room on their expansion side. Re-verified: all 4 placements now anchor correctly.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineTooltip.tsx` | Added `multiline` + `maw="16.25rem"` to the desktop `Tooltip` (Task 526 comment cites the owner rejection + kickoff range). No other prop changed. |
| `src/stories/mantine/primitives/Tooltip.stories.tsx` | Section 3 replaced: "position=bottom" → "placement variants" — a `Group gap="md" justify="space-between" w="100%"` of 4 triggers (top/right/bottom/left), each with a distinct `aria-label`. |
| `messages/{en,sq,uk,it}.json` | 2 new keys: `tooltip_right_trigger_aria`, `tooltip_left_trigger_aria` — full sq/en/uk/it parity. |
| `docs/tailadmin-style-reference.md` | §6k — added the "Intentional divergence — wrap, not nowrap" note documenting the Task 526 override and why. |
| `docs/mantine-responsive-design-system.md` | §25.2 — added the wrap-divergence paragraph. §25.4 — story section description updated (3rd section now "placement variants" covering all 4 positions). §25.5 — P0 gate note updated: all four positions proven; long content wraps within `maw`. |
| `docs/backlog.md` | "Last Session" replaced with the Task 526 completion summary (Batch C now complete); Sprint 39 line updated to cite 524+526 together. |

No product surface consumes `MantineTooltip` — still a primitive + story slice only. `responsiveBottomSheet.tsx` and every other foundation file remain untouched (same as Task 524).

## Positive / Negative flow (cited in AC table below)

**Positive flow:** desktop user hovers/focuses the info trigger → tooltip appears anchored per `position`; if the label is long it now wraps to 2–3 lines within the 260px max-width, fully visible (re-verified at the rejected `it@680` cell). Mobile user taps → full-width bottom sheet with the wrapped label (unchanged, Task 524 mechanism).

**Negative flow:**
- Very long uk/it label: wraps within `maw`, confirmed zero offscreen edges (`offScreenLeft/Right/Top/Bottom` all `false`) and `hScroll:false` at `it@680`.
- Near a viewport edge: Floating-UI's default `flip`/`shift` middlewares (already enabled, untouched) keep the bubble on-screen — demonstrated (and initially mis-measured, then correctly fixed) by the `left`/`right` placement edge case above.
- Short label: still renders compactly — `en@768` short-label cell measured `maxWidth:260px` (the CSS cap) but the bubble's actual rendered width is driven by its short content, not artificially stretched (Mantine's `max-width` only caps, never forces, width).
- <640: unaffected — re-verified `uk@320/375/390` long-label mobile sheet still `isFullWidthBottom:true`, `hScroll:false`.

## AC-by-AC self-audit

| # | AC | Verdict | Evidence |
|---|---|---|---|
| 1 | Desktop uses `multiline`+`maw` (240–320px, cited); long labels WRAP, no clip/overflow; verifiable in diff + matrix incl. it@680 | ✅ | `MantineTooltip.tsx` — `multiline` + `maw="16.25rem"` (260px). `it@680` re-measured: `maxWidth:260px`, `whiteSpace:"normal"`, zero offscreen, `hScroll:false`. Positive/Negative flow. |
| 2 | All other §6k chrome unchanged | ✅ | Re-measured at `it@680` and `en@768`: `backgroundColor:"rgb(29,41,57)"`, `color:"rgb(255,255,255)"`, `borderRadius:"8px"` — identical to the Task 524 matrix. |
| 3 | <640 path untouched; `grep DragHandle` = ONE match; foundation files unchanged | ✅ | `uk@320/375/390` long-label sheet still `isFullWidthBottom:true`. `grep -rn "function DragHandle" src/design-system/mantine` → 1 match. `git status --porcelain` shows no foundation file modified. |
| 4 | Story shows all 4 placements (top/right/bottom/left), each anchored correctly, each collapsing to the same bottom sheet <640 | ✅ | `sq@1280` matrix: `placement-top/right/bottom/left` all `anchorCorrect:true` after the `justify="space-between"` fix. Scope 3. |
| 5 | §6k + §25 updated with the wrap divergence | ✅ | `tailadmin-style-reference.md` §6k "Intentional divergence" block added; `mantine-responsive-design-system.md` §25.2/§25.4/§25.5 updated. |
| 6 | Locale parity intact; zero invented values; gates green | ✅ | `check:i18n` 2049×4 (2047+2). See Gates section. |

## Rendered proof matrix (clause 12 — ACTUAL hover/focus + tap renders)

Produced via a transient Playwright script (`scripts/_tmp-tooltip526-matrix.mjs` + a debug script + a screenshot script, all removed after capture) against `npm run storybook` (live dev server).

| Cell | Test | Result |
|---|---|---|
| **it@680 (the rejected cell)** | Long label, position=top (default) | `maxWidth:260px`, `whiteSpace:"normal"`, offscreen L/R/T/B all `false`, `hScroll:false`, bg/text/radius unchanged. **WRAPS, no clip.** |
| uk@320 | Long label, mobile sheet | `isFullWidthBottom:true`, `hScroll:false` — unaffected by the desktop fix. |
| uk@375 | Long label, mobile sheet | `isFullWidthBottom:true`, `hScroll:false`. |
| uk@390 | Long label, mobile sheet | `isFullWidthBottom:true`, `hScroll:false`. |
| en@768 | Short label, position=top | `maxWidth:260px` (cap present but not forcing width), offscreen all `false`. Compact bubble, screenshot-confirmed. |
| sq@1280 | Placement top | `anchorCorrect:true` (tooltip bottom ≤ trigger top). |
| sq@1280 | Placement right | `anchorCorrect:true` (tooltip left ≥ trigger right). |
| sq@1280 | Placement bottom | `anchorCorrect:true` (tooltip top ≥ trigger bottom). |
| sq@1280 | Placement left | `anchorCorrect:true` (tooltip right ≤ trigger left) — after the `justify="space-between"` fix (see Fix section). |

**Screenshots (visual confirmation):**
- `it@680`, long-uk section hover: dark bubble wraps the long Italian label onto 4 lines, fully within the viewport, arrow visible pointing down at the trigger — the exact cell the owner rejected, now fixed.
- `sq@1280`, left-placement hover: bubble renders to the LEFT of the rightmost trigger with the arrow pointing right — confirms `position="left"` now genuinely anchors left instead of auto-flipping.

## Gates (native, this session)

```
$ npx tsc --noEmit
(0 errors)

$ npm run check:stories
✅ check:stories PASSED — 94 files checked, 0 violations.

$ npm run check:i18n
✅ Parity PASSED — all 4 locale files have identical key sets (2049 keys).

$ npm run check:design-tokens
✅  check:design-tokens — 0 violations found.

$ npm run check:mojibake
check:mojibake: 0 artifacts in 1497 files

$ node scripts/check-file-integrity.mjs
✅  check:file-integrity PASSED — all 11 file(s) clean

$ grep -rn "function DragHandle" src/design-system/mantine
src/design-system/mantine/patterns/responsiveBottomSheet.tsx:64:export function DragHandle() {
(ONE match, confirmed)
```

**File-integrity (clause 14):** all 11 touched/new files — clean (0 NUL, no BOM, JSON parses, `.ts`/`.tsx` compile, no truncation).

**Regression-coverage re-verify (clause 15, Pre-read §7):** unchanged from Task 524 — no product consumer of `MantineTooltip` exists; N/A.

## Self-validation

`npx tsc --noEmit` = 0 errors. Re-rendered the exact rejected cell (`it@680`, long label) and confirmed it now wraps fully on-screen before writing "complete". Also caught and fixed a second real defect during this session's own verification — the placement-variants story layout initially made `left` (then `right`) auto-flip due to insufficient Floating-UI room, not a component bug; fixed via story layout (`justify="space-between"`), re-verified all 4 placements anchor correctly. `grep "function DragHandle"` = ONE match; `git status --porcelain` confirms all foundation files + the mobile bottom-sheet path untouched. All temporary Playwright scripts/screenshots removed after capture. **Self-validation: COMPLETE.**

**Emit NO `git add`/`git commit`** — the orchestrator commits the Tooltip primitive (Task 524 + Task 526 together, as one primitive) after this review.
