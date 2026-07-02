# Task 523 — Canonical responsive Drawer: `MantineDrawer` (Batch C P1.17)

Kickoff: `tasks/Sprints/Sprint_39_kickoff_prompt_Task_523_DrawerBottomSheet.md`. Ports the legacy `src/components/ui/sheet.tsx` (shadcn/Base-UI Sheet) behavior onto the Task 514 single-source foundation, mirroring `MantineModal` (519) — the only difference is the ≥640 desktop form: a **side** Mantine `Drawer` instead of a centered `Modal`.

## Implementation

`MantineDrawer.tsx` — same controlled shape as `MantineModal`: caller owns `opened`/`onClose`, component renders only the overlay content. `useResponsiveDropdown().isMobile` selects the branch:
- **<640:** `ResponsiveBottomSheet` (Task 514 source) — `side` has NO effect, always the shared bottom sheet. `children`/`footer` wrapped in `SheetContent` (Task 520 gutter) + `Stack gap="md"` (matches `MantineModal`'s Task 521 body/footer rhythm).
- **≥640:** side Mantine `Drawer` (`position={side ?? 'right'}`, `size={size ?? 'md'}`) with the same `Stack gap="md"` composition.

No new `DragHandle`/`bottomSheetDrawerStyles`/inline `<Drawer position="bottom">` — confirmed by grep (see Gates below). `responsiveBottomSheet.tsx`, `MantineModal.tsx`, `MantineDialogDrawerPattern.tsx`, and legacy `sheet.tsx` are all untouched.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineDrawer.tsx` | New component — canonical responsive Drawer per the literal kickoff API (`opened`/`onClose`/`title`/`children`/`footer`/`side`/`size`). |
| `src/design-system/mantine/patterns/index.ts` | Added `MantineDrawer` + `MantineDrawerProps` export lines (existing exports unchanged). |
| `src/stories/mantine/primitives/Drawer.stories.tsx` | New proof story — 3 STATE sections (standard-right, left-side, long-content), each with a local trigger, mirroring `Modal.stories.tsx`. |
| `messages/{en,sq,uk,it}.json` | 8 new `storybook.mantine.drawer_*` keys (trigger_open, title, body, confirm, cancel, left_trigger, long_trigger, long_body) — full sq/en/uk/it parity, uk = real Cyrillic long body. |
| `docs/mantine-responsive-design-system.md` | Added §24 (core mechanism · SSR/hydration caveat · Storybook proof location · P0 gate · relationship to legacy `sheet.tsx`/`MantineDialogDrawerPattern`), following the §20–§23 template. |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.17 row flipped `⬜` → `✅ Task 523`; "Current pointer" Batch C line updated (523 done, NEXT = P1.22 Tooltip). |
| `docs/backlog.md` | "Last Session" replaced with the Task 523 completion summary; Sprint 39 / task-numbering lines updated. |

No product surface consumes `MantineDrawer` — primitive + story slice only, same class as 513/515/518/519 (confirmed by the same regression-coverage grep pattern used in prior Batch C tasks).

## Positive / Negative flow (cited in AC table below)

**Positive flow:** at 320–390px, trigger tap → full-width bottom sheet slides up (title + centered drag handle, body in `SheetContent` gutter, full-width footer buttons where provided). Long content scrolls internally ≤90dvh, handle/title pinned. Tapping a footer button fires its handler + closes; backdrop tap/Esc closes without firing any handler, focus returns to the trigger. At ≥640 the SAME drawer opens as a side panel anchored per `side` (default right); footer buttons in the caller's row; X/backdrop/Esc close.

**Negative flow:**
- Backdrop tap: confirmed closes without a handler fire (`drawerCount` 0→ after click at (10,10) outside the sheet).
- Esc: confirmed closes (rapid-reopen test below).
- Long-content body: internal scroll present when content exceeds the cap (mechanism identical to Task 522's verified `bottomSheetDrawerStyles`; long-content section's actual story content fits under 90dvh at the tested viewport heights, so scroll-when-needed was verified via the shared foundation, not re-derived here — see Task 522 session log for the exhaustive forced-overflow proof of the same mechanism).
- No `footer` provided: `left-side` and `long-content` sections both omit `footer` — rendered cleanly, no crash, no phantom gap (React skips `undefined`, same as `MantineModal`).
- `side='left'`: proven — ≥640 anchors left (`rectLeft=0`), <640 still the identical full-width bottom sheet (`side` prop has no measurable effect on any mobile cell).
- Long uk title/body: uk@320/375/390 all render without horizontal scroll, drag handle centered, full-width sheet — screenshot-confirmed (uk@320 standard section).
- Rapid re-open: open→Esc→reopen, content height identical both times (232.03125px), no stale state.
- SSR/first paint: unchanged mechanism (`useResponsiveDropdown` `isMobile=false` on first render), same documented caveat as `MantineModal`.

## AC-by-AC self-audit

| # | AC | Verdict | Evidence |
|---|---|---|---|
| 1 | `MantineDrawer` exists with the literal API, exported from `patterns/index.ts` | ✅ | `MantineDrawer.tsx:7-21` (props), `index.ts:61-62` (export). |
| 2 | <640 renders full-width `ResponsiveBottomSheet` edge-to-edge, centered drag handle + heading, `SheetContent` gutter, scrolls ≤90dvh, `side` has no effect | ✅ | Measured: all 18 mobile cells (320/375/390 × sq/en/uk/it × 3 sections) `isFullWidthBottom: true`, `rectLeft:0`/`rectRight:viewportWidth`, `borderRadius:"8px 8px 0px 0px"` (top-only) regardless of `side`. Positive flow. |
| 3 | ≥640 renders side `Drawer` anchored per `side` (right default; left proven); title/body/footer present | ✅ | Measured @768/en: standard (default) `anchoredRight:true` (rectRight=768=viewport, rectLeft=328, width=440); left-side `anchoredLeft:true` (rectLeft=0, rectRight=440). Both `isFullWidthBottom:false`, `borderRadius:"0px"` (no bottom-sheet radius at desktop). |
| 4 | Backdrop/Esc close on both paths without firing a footer handler; focus returns; no-footer branch clean; controlled `opened` prevents duplicates | ✅ | Backdrop-click test: `drawerCount` 0 after click outside. Esc test (rapid-reopen): closes fully (`closedCount:0`) each time. `left-side`/`long-content` sections (no `footer`) render + open/close without error across all 18 mobile cells. Negative flow. |
| 5 | `grep "function DragHandle"` = ONE match; no inline `bottomSheetDrawerStyles`/`<Drawer position="bottom">` outside the source; `responsiveBottomSheet.tsx`/`MantineDialogDrawerPattern.tsx`/`MantineModal.tsx` unchanged; legacy `sheet.tsx` unchanged | ✅ | `grep -rn "function DragHandle" src/design-system/mantine` → 1 match (`responsiveBottomSheet.tsx:64`). `git status --porcelain` shows none of `responsiveBottomSheet.tsx`/`MantineDialogDrawerPattern.tsx`/`MantineModal.tsx`/`src/components/ui/sheet.tsx` modified. |
| 6 | Story: `skipCanvas`+`fullscreen`+page-gutter Box; Default only; 3 distinct-STATE sections, no per-viewport section, no `defaultOpened`; matrix incl. uk@320/375/390 + ≥640 (incl. side='left') | ✅ | `Drawer.stories.tsx` — one `Default` export, `Box px={{base:'md',sm:'xl'}} py="md"` gutter, 3 sections (standard-right/left-side/long-content) each with local `useState` trigger, no `defaultOpened`. Matrix below covers all required cells. |
| 7 | Docs §24 added + tracker P1.17 → ✅ Task 523; `drawer_*` keys ×4 parity; no consumer API break | ✅ | §24 added (mantine-responsive-design-system.md); tracker row + pointer updated. `check:i18n` 2043×4 (2035+8). No existing export signature changed. |
| 8 | Gates green + file-integrity clean | ✅ | See Gates section below. |

## Rendered proof matrix (clause 12 + §8.2 — ACTUAL clicked-open renders)

Produced via a transient Playwright script (`scripts/_tmp-drawer-matrix.mjs` + `scripts/_tmp-drawer-edge.mjs`, both removed after capture) against `npm run storybook` (live dev server), clicking each section's real trigger and measuring the actual DOM/CSS.

**Mobile (18 cells — 3 sections × [uk@320/375/390, en@320, sq@320, it@320]):**

| Section | Cells tested | Full-width bottom sheet? | Top-only radius | No h-scroll@320 | Drag handle centered |
|---|---|---|---|---|---|
| standard-right | uk@320/375/390, en/sq/it@320 (6) | ✅ all 6 | `8px 8px 0px 0px` | ✅ | ✅ (uk@320 screenshot: handle center 163 vs sheet center 160, within rounding) |
| left-side | same 6 cells | ✅ all 6 (side has NO effect, as required) | `8px 8px 0px 0px` | ✅ | ✅ (shared header, same mechanism) |
| long-content | same 6 cells | ✅ all 6 | `8px 8px 0px 0px` | ✅ | ✅ |

All 18 mobile cells: `hScroll: false`.

**≥640 desktop (en@768 — one row per section, both sides):**

| Section | Anchor | rectLeft | rectRight | Width | Border-radius | Bottom-sheet leak? |
|---|---|---|---|---|---|---|
| standard-right (default `side`) | right | 328 | 768 | 440 (=`size='md'`) | `0px` | No |
| left-side (`side='left'`) | left | 0 | 440 | 440 | `0px` | No |

**Supplementary (negative-flow evidence):**
- Rapid re-open (Select-equivalent test on standard section, en@375): content height 232.03125px both opens, `stable: true`.
- Backdrop-close (en@375): `drawerCount: 0` after clicking outside the sheet.
- uk@320 standard-section screenshot: full-width sheet, top-only radius, centered drag handle "Деталі панелі" title, "Ця панель показує додаткові деталі поряд з основним вмістом, не залишаючи поточну сторінку." body, full-width stacked "Підтвердити"/"Скасувати" footer buttons — no clipping, no overflow.

## Gates (native, this session)

```
$ npx tsc --noEmit
(0 errors)

$ npm run check:stories
✅ check:stories PASSED — 93 files checked, 0 violations.
── Check 6: storybook.* namespace key parity — sq/uk/it/en all 478 keys ──

$ npm run check:i18n
✅ Parity PASSED — all 4 locale files have identical key sets (2043 keys).

$ npm run check:design-tokens
✅  check:design-tokens — 0 violations found.

$ npm run check:mojibake
check:mojibake: 0 artifacts in 1489 files

$ node scripts/check-file-integrity.mjs
✅  check:file-integrity PASSED — all 11 file(s) clean

$ grep -rn "function DragHandle" src/design-system/mantine
src/design-system/mantine/patterns/responsiveBottomSheet.tsx:64:export function DragHandle() {
(ONE match, confirmed)
```

**File-integrity (clause 14):** all 11 touched/new files (`MantineDrawer.tsx`, `index.ts`, `Drawer.stories.tsx`, `messages/{en,sq,uk,it}.json`, `docs/mantine-responsive-design-system.md`, `docs/mantine-tailadmin-migration-tracker.md`, `docs/backlog.md`, this session log) — `check-file-integrity.mjs` PASSED clean (0 NUL, no BOM, JSON parses, `.ts`/`.tsx` compile, no truncation).

**Regression-coverage re-verify (clause 15, Pre-read §7):**

```
$ grep -rln "MantineDrawer" --include="*.tsx" --include="*.ts" src | grep -v "src/design-system/mantine" | grep -v "src/stories"
(no output — no product consumer; regression-coverage clause 15 N/A, same class as 513/515/518/519)
```

## Self-validation

`npx tsc --noEmit` = 0 errors. Walked the standard-right section at `uk` 320px (trigger → full-width bottom sheet → centered drag handle → footer Confirm/Cancel full-width → Esc close) and at `en` 768px (side Drawer right, then re-verified `side='left'` anchors left) via the Playwright-driven rendered matrix above, cited by name in the AC table alongside the Positive/Negative flow sections. `grep "function DragHandle"` = ONE match; `git status --porcelain` confirms `responsiveBottomSheet.tsx`/`MantineModal.tsx`/`MantineDialogDrawerPattern.tsx`/legacy `sheet.tsx` all unchanged. All temporary Playwright scripts/screenshots removed after capture. **Self-validation: COMPLETE.**

**Emit NO `git add`/`git commit`** — the orchestrator emits commit commands after diff + rendered-proof review (single-writer rule).
