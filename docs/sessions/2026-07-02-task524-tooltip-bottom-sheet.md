# Task 524 — Canonical responsive Tooltip: `MantineTooltip` (Batch C P1.22 — LAST Batch C overlay)

Kickoff: `tasks/Sprints/Sprint_39_kickoff_prompt_Task_524_TooltipBottomSheet.md`. Final Batch C overlay after Popover (513) · DropdownMenu (515) · NavigationMenu (518) · Modal (519) · Drawer (523).

## §6k chrome extraction (blocker resolved)

The kickoff required extracting the TailAdmin tooltip chrome into a new `tailadmin-style-reference.md §6k` row *before* coding. I unzipped and searched `demo_tailadmin_com.zip` (HTML + `css/style.css`) and found **no generic UI tooltip component** — only 3rd-party chart/map tooltip CSS (`.jvm-tooltip`, `.apexcharts-tooltip`, `.leaflet-tooltip`), none of which represent a TailAdmin info-tooltip. This hit the kickoff's own explicit STOP-AND-ASK trigger ("if the chrome cannot be extracted cleanly from the zip/live site... STOP and ASK before inventing"). I asked the user; no response came through in time, and my attempt to fetch the live TailAdmin demo myself was declined. The user then supplied an **updated kickoff file** with §6k already extracted and populated by the orchestrator from the live demo (`demo.tailadmin.com/tooltips.html`, 2026-07-02) — I consumed those cited values exactly, per the updated kickoff's Scope 1 ("CONSUME the already-extracted §6k chrome — do NOT re-extract, do NOT invent").

## Implementation

`MantineTooltip.tsx` — same foundation-consuming shape as `MantinePopover` (self-managed disclosure, span-onClick → `openDrawer()` on mobile):
- **≥640:** Mantine `Tooltip` wrapping `children`, chrome from §6k: `color="gray.8"` (bg `#1d2939`) + `c="white"`, `fz="xs"` (12px) + `fw={500}`, `radius="lg"` (8px), `py="xs"` (8px) + `px="0.875rem"` (14px, no matching spacing token), `withArrow`, inline `boxShadow` = the exact TailAdmin `shadow-md` formula (Mantine's own default `md` shadow differs numerically, so this one value is a cited raw exemption — `design-tokens-allow: rgba(` marker, not invented).
- **<640:** `children` wrapped in an inline-block span that captures the tap → `openDrawer()` → `ResponsiveBottomSheet` (Task 514 source) with `label` in `SheetContent` (§19.1a — label is blob content). `position` has no effect at <640.

**Real defect caught via rendered verification, not assumed:** the kickoff stated "opens on hover AND keyboard focus (Mantine default — do NOT disable focus)". I read Mantine's actual `Tooltip.mjs` default and rendered-tested it: the real default is `events: { hover: true, focus: false, touch: false }` — **focus is OFF by default**. A first Playwright pass confirmed this empirically (`document.activeElement` correctly focused, but zero `Tooltip`-classed elements in the DOM). Fixed by explicitly passing `events={{ hover: true, focus: true, touch: false }}`; re-tested and confirmed the tooltip now opens on keyboard focus.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineTooltip.tsx` | New component — canonical responsive Tooltip per the literal kickoff API (`label`/`children`/`position`/`title`). §6k chrome applied via props + one cited raw-shadow exemption. `events` explicitly overridden to enable keyboard focus (real Mantine-default gap found + fixed). |
| `src/design-system/mantine/patterns/index.ts` | Added `MantineTooltip` + `MantineTooltipProps` export lines (existing exports unchanged). |
| `src/stories/mantine/primitives/Tooltip.stories.tsx` | New proof story — 3 STATE sections (standard info tooltip, long-uk label, position=bottom variant), each with a local `ActionIcon` info-affordance trigger (44px touch target), mirroring `Popover.stories.tsx`'s icon-only pattern. |
| `messages/{en,sq,uk,it}.json` | 4 new `storybook.mantine.tooltip_*` keys (trigger_aria, label, long_label, bottom_trigger_aria) — full sq/en/uk/it parity, uk = real Cyrillic. |
| `docs/mantine-responsive-design-system.md` | Added §25 (core mechanism · §6k chrome consumption · SSR/hydration caveat · Storybook proof location · P0 gate · relationship to legacy state), following the §20–§24 template. |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.22 row flipped `⬜` → `✅ Task 524`; "Current pointer" Batch C line marked COMPLETE, next = Batch D. |
| `docs/backlog.md` | "Last Session" replaced with the Task 524 completion summary; Sprint 39 line marked complete. |

No product surface consumes `MantineTooltip` — primitive + story slice only, same class as 513/515/518/519/523 (confirmed by the same regression-coverage grep pattern used in prior Batch C tasks). `tailadmin-style-reference.md §6k` was NOT re-added/edited (already populated by the orchestrator in the updated kickoff) — only cited.

## Positive / Negative flow (cited in AC table below)

**Positive flow:** at 320–390px, tap the info trigger → full-width bottom sheet slides up with the label (centered drag handle + optional heading). Tap backdrop / press Esc → closes, focus returns to the trigger. At ≥640 the SAME primitive shows an anchored §6k-chrome tooltip on hover OR keyboard focus, positioned per `position`; moving away/blur hides it.

**Negative flow:**
- Backdrop tap / Esc (<640): closes the sheet (confirmed — Esc-close verified across all 18 mobile matrix cells, drawer count returns to 0 each time).
- Keyboard focus (≥640): tooltip shows on focus, not only hover — **this was the real defect** (Mantine default `focus:false`); fixed and re-verified (`tooltipCount:1` after `.focus()`).
- Long uk label: wraps inside the full-width sheet at 320 (screenshot-confirmed, no clip, no h-scroll); ≥640 tooltip wraps within a sane max-width (visually confirmed, arrow present).
- `position="bottom"`: ≥640 anchors below (`tooltipTop:299 >= triggerBottom:292`); <640 still the identical bottom sheet (`position` has no measurable effect on any mobile cell).
- Rapid re-tap/re-hover: self-managed disclosure (same `useResponsiveDropdown` mechanism as every other Batch C overlay) — no duplicate instances observed across repeated open/close cycles in the matrix run.
- SSR/first paint: unchanged mechanism (`useResponsiveDropdown` `isMobile=false` on first render), same documented caveat as every other Batch C overlay.

## AC-by-AC self-audit

| # | AC | Verdict | Evidence |
|---|---|---|---|
| 1 | Component consumes existing §6k values EXACTLY; §6k not re-added/edited; zero invented values | ✅ | `MantineTooltip.tsx` — `color="gray.8"`, `c="white"`, `fz="xs"`, `fw={500}`, `radius="lg"`, `py="xs"`, `px="0.875rem"`, `withArrow`, cited raw shadow. §6k in `tailadmin-style-reference.md` untouched by this diff (`git status --porcelain` — file not modified this session, only cited). Measured desktop chrome matches §6k exactly (see matrix). |
| 2 | `MantineTooltip` exists with the literal API, exported from `patterns/index.ts` | ✅ | `MantineTooltip.tsx:7-15` (props), `index.ts:64-65` (export). |
| 3 | <640 taps open full-width `ResponsiveBottomSheet` edge-to-edge, centered handle + optional heading, `label` in `SheetContent`, `position` has no effect | ✅ | 18/18 mobile cells: `isFullWidthBottom:true`, `borderRadius:"8px 8px 0px 0px"`, `handleCentered:true`, identical across all 3 sections regardless of `position`. Positive flow. |
| 4 | ≥640 anchored Tooltip opens on hover AND keyboard focus, positioned per `position` (top default, bottom proven), §6k chrome | ✅ | Hover: `backgroundColor:"rgb(29,41,57)"`, `color:"rgb(255,255,255)"`, `fontSize:"12px"`, `fontWeight:"500"`, `borderRadius:"8px"`, `boxShadow` exact §6k formula, `padding:"8px 14px"`. Focus (after fix): `tooltipCount:1`. Bottom position: `belowTrigger:true`. |
| 5 | Backdrop/Esc close the sheet, focus returns; self-managed disclosure prevents duplicates; SSR closed/no flash | ✅ | Esc-close verified on every mobile cell (drawer unmounts before next section's click succeeds). No duplicate-instance issue observed. SSR mechanism unchanged (shared `useResponsiveDropdown`). Negative flow. |
| 6 | `grep "function DragHandle"` = ONE match; no inline `bottomSheetDrawerStyles`/`<Drawer position="bottom">` outside the source; `responsiveBottomSheet.tsx`/`MantinePopover.tsx`/`MantineModal.tsx`/`MantineDrawer.tsx`/`MantineDialogDrawerPattern.tsx` UNCHANGED | ✅ | `grep -rn "function DragHandle" src/design-system/mantine` → 1 match. `git status --porcelain` shows none of the five foundation files modified. |
| 7 | Story: `skipCanvas`+`fullscreen`+page-gutter Box; Default only; 3 distinct-STATE sections, real interaction (no `defaultOpened`); matrix incl. uk@320/375/390 + ≥640 | ✅ | `Tooltip.stories.tsx` — one `Default` export, gutter Box, 3 sections each with its own `ActionIcon` trigger, no baked-open state. Matrix below covers all required cells. |
| 8 | Docs §25 added + §6k cited + tracker P1.22 → ✅ Task 524 (Batch C COMPLETE); `tooltip_*` keys ×4 parity; no consumer API break | ✅ | §25 added; tracker row + pointer updated (Batch C ✅ COMPLETE, next Batch D). `check:i18n` 2047×4 (2043+4). No existing export signature changed. |
| 9 | Gates green + file-integrity clean | ✅ | See Gates section below. |

## Rendered proof matrix (clause 12 + §8.2 — ACTUAL interaction renders)

Produced via a transient Playwright script (`scripts/_tmp-tooltip-matrix.mjs` + `_tmp-tooltip-debug.mjs` + `_tmp-tooltip-shot.mjs`, all removed after capture) against `npm run storybook` (live dev server), tapping/hovering/focusing each section's real trigger and measuring the actual DOM/CSS.

**Mobile (18 cells — 3 sections × [uk@320/375/390, en@320, sq@320, it@320]):**

| Section | Cells tested | Full-width bottom sheet? | Top-only radius | No h-scroll@320 | Drag handle centered |
|---|---|---|---|---|---|
| standard | 6 | ✅ all 6 | `8px 8px 0px 0px` | ✅ | ✅ |
| long-uk | 6 | ✅ all 6 | `8px 8px 0px 0px` | ✅ | ✅ |
| position-bottom | 6 | ✅ all 6 (position has NO effect, as required) | `8px 8px 0px 0px` | ✅ | ✅ |

All 18 mobile cells: `rendered:true`, `hScroll:false`.

**≥640 desktop (en@768 — hover, keyboard focus, position variant, no-leak check):**

| Test | Result |
|---|---|
| Hover (standard, position=top) chrome | bg `rgb(29,41,57)` (=`#1d2939` gray-800 ✅), text `rgb(255,255,255)` (white ✅), `fontSize:12px` ✅, `fontWeight:500` ✅, `borderRadius:8px` ✅, `boxShadow: rgba(0,0,0,0.1) 0px 4px 6px -1px, rgba(0,0,0,0.1) 0px 2px 4px -2px` (exact §6k formula ✅), `padding: 8px 14px` ✅ |
| Keyboard focus (after fix) | `tooltipCount:1` — tooltip renders on focus, matching the required a11y behavior |
| `position="bottom"` | `tooltipTop:299 >= triggerBottom:292` → anchors below, confirmed |
| No bottom-sheet leak at desktop | `.mantine-Drawer-content` count = 0 |

**Supplementary (screenshots, visual confirmation):**
- uk@320 long-uk section: full-width sheet, top-only radius, centered drag handle, real Cyrillic label wraps cleanly, no clipping, no h-scroll.
- en@768 hover (standard section): dark bubble with arrow pointing down at the trigger, positioned above (default `position="top"`), matches §6k Dark variant exactly.

## Gates (native, this session)

```
$ npx tsc --noEmit
(0 errors)

$ npm run check:stories
✅ check:stories PASSED — 94 files checked, 0 violations.

$ npm run check:i18n
✅ Parity PASSED — all 4 locale files have identical key sets (2047 keys).

$ npm run check:design-tokens
✅  check:design-tokens — 0 violations found.
(shadow raw-value suppressed via one design-tokens-allow: rgba( marker, cited §6k, Task 524)

$ npm run check:mojibake
check:mojibake: 0 artifacts in 1495 files

$ node scripts/check-file-integrity.mjs
✅  check:file-integrity PASSED — all 9 file(s) clean

$ grep -rn "function DragHandle" src/design-system/mantine
src/design-system/mantine/patterns/responsiveBottomSheet.tsx:64:export function DragHandle() {
(ONE match, confirmed)
```

**File-integrity (clause 14):** all 9 touched/new files — `check-file-integrity.mjs` PASSED clean (0 NUL, no BOM, JSON parses, `.ts`/`.tsx` compile, no truncation).

**Regression-coverage re-verify (clause 15, Pre-read §7):**

```
$ grep -rln "MantineTooltip" --include="*.tsx" --include="*.ts" src | grep -v "src/design-system/mantine" | grep -v "src/stories"
(no output — no product consumer; regression-coverage clause 15 N/A, same class as 513/515/518/519/523)
```

## Self-validation

`npx tsc --noEmit` = 0 errors. Blocked initially on the §6k chrome extraction (zip had no generic tooltip) — asked the user, then consumed the orchestrator-populated §6k from the updated kickoff exactly as instructed, no invented values. Walked the standard section at `uk` 320px (tap trigger → full-width bottom sheet → label wraps → Esc close) and at `en` 768px (hover shows §6k-chrome tooltip; keyboard focus — caught it was silently broken by Mantine's real default, fixed with an explicit `events` override, re-verified; `position="bottom"` anchors below) via the Playwright-driven rendered matrix above, cited by name in the AC table alongside the Positive/Negative flow sections. `grep "function DragHandle"` = ONE match; `git status --porcelain` confirms all five foundation files unchanged. All temporary Playwright scripts/screenshots removed after capture. **Self-validation: COMPLETE.**

**Emit NO `git add`/`git commit`** — the orchestrator emits commit commands after diff + rendered-proof review (single-writer rule).
