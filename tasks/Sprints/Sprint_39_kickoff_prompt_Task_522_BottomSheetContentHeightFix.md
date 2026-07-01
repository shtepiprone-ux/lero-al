### Task 522 — Bottom sheet stretches to 90dvh on short content (§18.8 foundation fix — Task 514 single source)

Type:        bug
Priority:    high
Area:        src/design-system/mantine/patterns/responsiveBottomSheet.tsx (bottomSheetDrawerStyles — the Task 514 single source), docs/mantine-responsive-design-system.md §18.8 + §19.1

Pre-read (mandatory before any code change):
1. docs/agent-contract.md — clauses 11 (mobile full-width), 12 (rendered-evidence matrix), 14 (file-integrity), 15 (regression coverage — scan below)
2. docs/backlog.md
3. docs/mantine-responsive-design-system.md — **§18.8 (the KNOWN ISSUE this task fixes — read in full)**, §7 (mobile gate + spacing rhythm), §12 (canonical patterns), §18 (Mantine theming/CSS pitfalls — `theme.styles` = inline, no state selectors), §19.1 (foundation exports: `bottomSheetDrawerStyles`, `ResponsiveBottomSheet`, `DragHandle`, `useResponsiveDropdown`, `SheetContent`), §23 (MantineModal consumer)
4. docs/ui-rules.md
5. docs/component-rules.md
6. docs/qa-rules.md
7. docs/critical-flow-registry.md — scanned by the orchestrator: the five overlay primitives (`MantineSelect`, `MantinePopover`, `MantineDropdownMenu`, `MantineNavigationMenu`, `MantineModal`) are design-system primitives with story-only consumers; no product surface consumes `ResponsiveBottomSheet`/`bottomSheetDrawerStyles` directly, so clause 15 (Epic RS) does NOT apply. **Re-verify before closing:** `grep -rln "responsiveBottomSheet\|ResponsiveBottomSheet\|bottomSheetDrawerStyles" src --include=*.tsx --include=*.ts | grep -v "src/design-system/mantine" | grep -v "src/stories"` → must be empty. If a product consumer now exists, STOP and add a registry row instead of skipping the AC.

Localization coverage:
- No new user-facing strings. This is a pure CSS/height-mechanics fix on the shared bottom-sheet Drawer styles. `check:i18n` key count (2035×4) must be unchanged.
- Runtime check still required: the height change must not introduce clipping, truncation, or wrap changes in any of sq/en/uk/it on any of the five consumers.

Responsive coverage:
- Mobile bottom-sheet path only (<640 / `max-width: 40em`) is affected — but every one of the seven canonical breakpoints (320, 375, 390, 768, 1280, 1440, 2560) must be re-verified so the fix does NOT alter the ≥640 anchored/centered paths as a side effect.

## Origin (§18.8 known issue — owner authorized the foundation fix, 2026-07-01)

Documented in `docs/mantine-responsive-design-system.md §18.8` and re-confirmed by the orchestrator against the real file:

`bottomSheetDrawerStyles` (`responsiveBottomSheet.tsx:11-25`) currently sets:
```
content: { borderRadius: '…lg …lg 0 0', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' },
body:    { flex: 1, overflowY: 'auto', padding: 0 },
```
The `body: { flex: 1 }` makes the body grow to fill the flex column, and combined with the Drawer's height resolution the sheet stretches to the **full 90dvh even when the content ends far above it**, leaving a large empty region below the content/footer. This is a **shared-source defect** — it reproduces identically across all four (now five) foundation consumers, measured via Playwright against a real `build-storybook` output at 275px width:

| Consumer | Empty space below content (short-content story) |
|---|---|
| MantineModal (standard dialog) | ≈574px |
| MantinePopover | ≈650px |
| MantineDropdownMenu | ≈573px |
| MantineNavigationMenu | ≈618px |
| MantineSelect | (re-measure — same class) |

Task 520 explicitly deferred this ("do not attempt a per-consumer workaround — would fork the foundation"). **The owner has now authorized fixing it at the single source (Task 514 `responsiveBottomSheet.tsx`).** The Task 520 STOP-AND-ASK trigger on `responsiveBottomSheet.tsx` mechanics is LIFTED for THIS task, and ONLY for the `bottomSheetDrawerStyles` height mechanics described below — the open/close/DragHandle/`useResponsiveDropdown` logic is still out of scope (see "Out of scope").

## Bug / Goal

Make the mobile bottom sheet **size to its content up to a `90dvh` cap**, instead of always stretching to `90dvh`. The fix lives in ONE place — `bottomSheetDrawerStyles` in `responsiveBottomSheet.tsx` — so all five consumers inherit it for free (Note 14 global-change: fix the single source, do NOT patch any consumer). Long content must still scroll internally within the `90dvh` cap with the drag handle + title pinned; short content must end the sheet just below its content.

## Required after behavior

On any viewport `<640px`, for EVERY consumer of `ResponsiveBottomSheet` (`MantineSelect`, `MantinePopover`, `MantineDropdownMenu`, `MantineNavigationMenu`, `MantineModal`):

1. **Short content** (content shorter than `90dvh`): the sheet height equals the content height — the sheet's bottom edge sits just below the last content row / footer (plus the existing `SheetContent pb="md"` / row padding). There is **no large empty region** between the content and the bottom of the sheet. Target: the measured empty gap below the last content element drops from the hundreds-of-px values in the table above to ≤ the sheet's own bottom padding (a small, token-sized value — measure and record the exact number).
2. **Long content** (content taller than `90dvh`): the sheet is capped at `90dvh`; the body scrolls internally (`overflowY:auto`); the drag handle + title header stays pinned at the top; the footer (Modal) or last row stays reachable by scrolling. This is the CURRENT correct long-content behavior and MUST be preserved unchanged.
3. The drag handle, top-only radius (`radius-lg radius-lg 0 0`), full-width edge-to-edge bleed, `inner: padding 0`, `body: padding 0` (row-consumer contract), backdrop-tap + Esc close, and `returnFocus` are all **unchanged**.
4. The `≥640` anchored-dropdown (`MantineSelect`/`Popover`/`DropdownMenu`/`NavigationMenu`) and centered-`Modal` paths are **untouched** — `bottomSheetDrawerStyles` is only applied to the mobile Drawer; confirm no ≥640 regression in the matrix.
5. **Implementation must stay inside `bottomSheetDrawerStyles`** (the height/flex mechanics — e.g. body `flex` sizing + `minHeight:0` so it sizes-to-content-then-scrolls, and/or the `content`/`inner` height resolution). Diagnose the ACTUAL mechanism first via rendered measurement (do not guess which property forces the stretch — it may be the `flex:1`, the Drawer `size="auto"` height resolution, or a `content` height). If achieving both short-fit AND long-scroll requires changing anything beyond `bottomSheetDrawerStyles` (e.g. the `ResponsiveBottomSheet` `size` prop, the Drawer structure, or a consumer), **STOP and ASK** before doing so — that is a foundation-structure change, not a style change.
6. No consumer file is edited. `MantineSelect.tsx`, `MantinePopover.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, `MantineModal.tsx`, and the `DragHandle`/`ResponsiveBottomSheet`/`SheetContent`/`useResponsiveDropdown` exports are all unchanged (`git diff --stat` for each = empty; only `bottomSheetDrawerStyles` inside `responsiveBottomSheet.tsx` changes).

## Positive flow (happy path)

Actor: any user on a <640 viewport. Preconditions: a surface embedding any of the five overlays.
1. User taps the trigger → the bottom sheet slides up from the bottom edge, full-width, top-only radius, drag handle at top.
2. **Short content:** the sheet's height matches its content — no empty band below. User reads/selects; backdrop tap or Esc closes; focus returns to the trigger.
3. **Long content:** the sheet opens capped at `90dvh`; the body scrolls; handle/title pinned; user scrolls to the last option/footer; closes via backdrop/Esc; focus returns.
4. Success state: in both cases the sheet is visually correct (no dead space on short, no clipped/unreachable content on long) at every mobile breakpoint × locale.

## Negative flow (every off-happy-path branch)

- **Content exactly ~90dvh** (boundary): sheet caps at 90dvh, no double scrollbar, no 1px jitter — verify at the boundary, not just clearly-short/clearly-long.
- **Empty / single-item content** (e.g. a Select with one option, a Popover with one line): sheet is small and content-fit, not stretched; drag handle + title still present and not orphaned above a huge gap.
- **Very long localized content (uk/it)** where translated strings are longest: still caps at 90dvh and scrolls; no horizontal overflow at 320; no clipped last row.
- **Modal no-footer long section** (`ModalLongSection`): scrolls within cap, handle/title pinned, no footer — unchanged from Task 521; the Task 521 body↔footer 16px gap (standard section) is unaffected by this height fix (re-confirm in the matrix).
- **≥640 desktop paths** (all five): anchored dropdown / centered Modal unchanged — no height regression from the shared-style edit leaking upward.
- **Backdrop tap / Esc / returnFocus**: unchanged on every consumer.
- **Rapid open/close / re-open**: sheet re-measures content each open (no stale height from a previous longer content) — verify with a Select whose option count changes, or by opening the short then long story in sequence.

## Mobile <640 full-width gate (re-verify only — do not alter)

All existing full-width mechanics MUST survive untouched on all five consumers: edge-to-edge full-bleed sheet (no side margins, no `max-w` leak), ≥44px tap rows / full-width footer buttons, top-only radius, drag handle centered (Task 517), labels wrap at sq/en/uk/it with no clip, no horizontal scroll at 320. This task changes VERTICAL height sizing only — re-verify (in the rendered matrix) that no horizontal/full-width mechanic regressed as a side effect.

## Required investigation

1. Read `responsiveBottomSheet.tsx:11-25` (`bottomSheetDrawerStyles`) and `93-122` (`ResponsiveBottomSheet`, incl. `size="auto"`). Confirm the exact stretch mechanism by rendered measurement BEFORE editing — identify which property (body `flex:1`, Drawer `size`, or a resolved `content` height) forces the 90dvh fill on short content.
2. Enumerate the five consumers' stories (`src/stories/mantine/primitives/Select.stories.tsx`, `Popover.stories.tsx`, `DropdownMenu.stories.tsx`, `NavigationMenu.stories.tsx`, `Modal.stories.tsx`) and identify a SHORT-content and a LONG-content section in each for the before/after measurement.
3. Prototype the fix inside `bottomSheetDrawerStyles`, then re-measure both short (empty-band should collapse) and long (must still cap+scroll) on all five consumers.
4. Re-run the rendered-proof approach (transient Playwright against a real `build-storybook` output; remove the artifact after capture) capturing the NEW measured column: empty-space-below-content (px) for short content, and cap-respected + internal-scroll present for long content.

## Acceptance criteria

- AC1 (Required-after step 1): for every one of the five consumers, the SHORT-content bottom sheet's empty space below content drops from the hundreds-of-px baseline (see Origin table) to ≤ the sheet's own bottom padding — measured value recorded per consumer in the matrix.
- AC2 (step 2): LONG-content bottom sheet still caps at `90dvh` with internal body scroll and pinned handle/title on every consumer — measured (cap respected, scroll present).
- AC3 (step 5/6): the fix is confined to `bottomSheetDrawerStyles` in `responsiveBottomSheet.tsx`. `git diff --stat` is empty for `MantineSelect.tsx`, `MantinePopover.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, `MantineModal.tsx`, and shows NO change to `DragHandle`/`ResponsiveBottomSheet`/`SheetContent`/`useResponsiveDropdown` within `responsiveBottomSheet.tsx` — only `bottomSheetDrawerStyles` changed. Any deviation required a STOP-AND-ASK that was raised and answered.
- AC4 (Negative flow): boundary (~90dvh), single-item, and rapid re-open cases verified — no double scrollbar, no stale height, no orphaned handle above a gap.
- AC5 (step 4 + Negative flow): ≥640 anchored/centered paths for all five consumers unchanged (matrix shows the desktop cell unaffected).
- AC6 (step 3, Task 521 preservation): Modal standard-section body↔footer 16px gap and no-footer long-section spacing are both unchanged by this height fix.
- AC7 (clause 12): rendered-proof matrix — rows = mobile breakpoints (320/375/390) + one ≥640 cell, columns = sq/en/uk/it, **for EACH of the five consumers × short-content AND long-content**. uk@320/375/390 mandatory. Each cell records: short → empty-space-below (px, now small); long → cap≤90dvh + scroll present; no clip; no h-scroll@320; full-width preserved.
- Existing controls/flows preserved (Note 19/20): triggers, option/row selection, Modal Cancel/Confirm, backdrop/Esc close, returnFocus, internal scroll — all still work on every consumer.
- 0 new lint errors / 0 new warnings. `npx tsc --noEmit` → 0 errors.
- Governance gates pass: `check:stories`, `check:i18n` (2035×4 unchanged), `check:design-tokens` (any new raw value inside `bottomSheetDrawerStyles` must reuse the existing justified-raw-value exemption comment pattern — no new un-commented raw px; prefer tokens/`var(--mantine-*)` where possible), `check:mojibake`.
- File-integrity (clause 14): `NUL=0`, no BOM, `tsc` clean, tail intact on every touched file — green transcript in the session log.
- Regression coverage (clause 15): N/A — re-verify per Pre-read item 7 (grep for product consumers) before closing; STOP and add a registry row if one now exists.
- `docs/mantine-responsive-design-system.md` §18.8 flipped from "KNOWN ISSUE (reported, NOT fixed)" to a resolved description of the content-fit-up-to-90dvh mechanism (cite Task 522), and §19.1's `bottomSheetDrawerStyles` row updated if its description changes.
- `docs/backlog.md` updated; session log under `docs/sessions/` with the Note 18 self-validation block, an AC-by-AC table citing this task's Positive/Negative flow sections by name, and a "Files Changed" table (one row per touched path + rationale).
- The executor MUST NOT emit `git add`/`git commit` — the orchestrator emits them after diff + rendered-proof review (single-writer rule; this overlay thread requires rendered-proof review per the Task 520 rejection precedent).

## Out of scope

- Do NOT touch the Drawer open/close logic, `DragHandle`, `ResponsiveBottomSheet` structure/props (incl. `size`), `SheetContent`, or `useResponsiveDropdown` — unless a STOP-AND-ASK establishes the height fix genuinely cannot live in `bottomSheetDrawerStyles` alone.
- Do NOT edit any of the five consumer components or their stories (except: if a story lacks a clear short/long section needed to PROVE the fix, STOP and ASK whether to add a proof-only section — do not silently restyle a consumer).
- Do NOT change the `body: padding 0` row-consumer contract or the `SheetContent` gutter (Task 520).
- Do NOT alter the Task 521 Modal body↔footer gap composition.
- Do NOT change any public API surface of the foundation or its consumers.
- Do NOT touch the ≥640 anchored/centered desktop rendering paths.
