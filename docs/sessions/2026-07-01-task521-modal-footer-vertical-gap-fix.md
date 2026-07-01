# Task 521 — Fix missing vertical gap between `MantineModal` body and footer (Task 520 REWORK)

Kickoff: `tasks/Sprints/Sprint_39_kickoff_prompt_Task_521_ModalFooterVerticalGapFix.md`. Origin: owner rejected Task 520 on rendered review — `Mantine/Primitives/Modal → Default`, "standard dialog" section, at 275px: `MantineModal.tsx` concatenated `{children}{footer}` with zero vertical gap on both the mobile `SheetContent` branch and the desktop `Modal` branch. Task 520's rendered-proof matrix measured horizontal geometry only and never caught this.

## Fix

`MantineModal.tsx` now wraps `children`/`footer` in `<Stack gap="md">` on **both** branches, matching `MantineDialogDrawerPattern`'s established body/actions rhythm — 16px vertical gap between body and footer.

**Mid-implementation correction (found via rendered measurement, not assumed):** the first pass wrapped `{children}{footer}` directly in `<Stack gap="md">`. Since `ModalLongSection`'s `children` prop is an *array* of several `Text` paragraphs (not one node), `Stack`'s CSS `gap` was applied between every paragraph too — measured inter-paragraph gap jumped from ~12px (each paragraph's own `mb="sm"`) to 28px (12px + the new 16px Stack gap), a real, unintended regression to the no-footer long-content section. Fixed by wrapping `children` in a single `<Box>` so it collapses to ONE `Stack` item — re-measured after the fix: inter-paragraph gap back to ~12px baseline, body↔footer gap still exactly 16px at all 7 matrix cells.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineModal.tsx` | Both branches (mobile `SheetContent`, desktop `Modal`) now render `<Stack gap="md"><Box>{children}</Box>{footer}</Stack>` instead of raw `{children}{footer}` concatenation. Doc comment rewritten to explain the `Box` wrapper's purpose (collapse multi-element `children` to one Stack item) and cite Task 521. |
| `docs/mantine-responsive-design-system.md` | §23.1 steps 2–3 corrected (previously claimed "single 16px gutter for both" with no mention of vertical rhythm — now describes the `Stack gap="md"` + `Box` composition and the Task 520 owner-rejection history). §23.4 P0 gate: added the body↔footer vertical-gap line to both the `<640px` and `≥640px` gate lists. |

No changes to `responsiveBottomSheet.tsx`'s `SheetContent`/`ResponsiveBottomSheet`/`DragHandle`/`useResponsiveDropdown`/`bottomSheetDrawerStyles`, `MantinePopover.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, `MantineSelect.tsx`, `MantineDialogDrawerPattern.tsx`, or legacy `dialog.tsx`/`dialog.stories.tsx` **in this task**. Note on `git diff --stat` vs `HEAD`: `responsiveBottomSheet.tsx` and `MantinePopover.tsx` show non-empty diffs because Task 520's own changes (the `SheetContent` addition + its wiring into `MantinePopover`) are still uncommitted — the owner's rejection was scoped to the vertical-gap defect only ("Task 520's other two fixes... are NOT implicated and stand," per `docs/backlog.md` Last Session) and no commit was ever emitted for 520, so that standing work is carried in the working tree. No `Edit`/`Write` call in this session targeted either file — verified by this session's own action log, not by a literal empty `git diff`.

## Positive / Negative flow (cited in AC table below)

**Positive flow:** trigger tap → dialog opens (mobile bottom sheet / desktop centered Modal, unchanged from Task 520) → body text is visually separated from the footer button row by a clear 16px `Stack gap="md"` on both paths → Cancel/Confirm/backdrop/Esc behave exactly as before (Task 519/520, untouched).

**Negative flow:**
- No footer (`ModalLongSection`) → single `Stack` item (`Box` wrapping `children`), no phantom trailing gap from the fix itself; measured inter-paragraph spacing restored to baseline (~12px) after the `Box`-wrapper correction.
- Very long body on mobile → gap present, internal scroll ≤90dvh unchanged (Task 514/519 mechanics untouched).
- Desktop ≥640 short body → gap present, footer stays right-aligned via the story's own `Flex justify="flex-end"`, no horizontal geometry regression vs Task 520 (measured: 440px width, 288/343/358 mobile button widths unchanged, 14px font unchanged).
- uk/it/sq long text → gap renders identically at every locale; no new horizontal/vertical overflow at any of the 7 canonical breakpoints (measured `noHScroll: true` at every mobile cell).
- Sibling overlays (`MantinePopover`/`MantineDropdownMenu`/`MantineNavigationMenu`/`MantineSelect`) and legacy `dialog.tsx` — no new edits from this task (see Files Changed note above).
- Backdrop tap / Esc close — unchanged, no footer handler fires, focus returns to opener (not touched by this fix).

## `MantinePopover.tsx` audit (AC5 — required one-line finding)

`MantinePopoverProps` has no `footer` field; `SheetContent` wraps only `{children}` (`MantinePopover.tsx:122`, `<SheetContent>{children}</SheetContent>`) — there is no second sibling region to introduce a zero-gap defect between, so **this defect class does not apply to `MantinePopover`**. Confirmed by reading the file, not assumed.

## AC-by-AC self-audit

| # | AC | Verdict | Evidence |
|---|---|---|---|
| 1 | Mobile `SheetContent` composition wraps `{children}{footer}` in `Stack gap="md"` | ✅ | `MantineModal.tsx:78-83` (mobile branch: `SheetContent` → `Stack gap="md"` → `Box>{children}</Box>` + `{footer}`). Positive flow. |
| 2 | Desktop `Modal` composition wraps `{children}{footer}` in `Stack gap="md"`; existing `Flex justify="flex-end"` footer row unchanged | ✅ | `MantineModal.tsx:88-93`. Story's `Flex direction={{base:'column-reverse',sm:'row'}}` footer untouched (`git diff --stat` empty for `Modal.stories.tsx` in this session — not edited). |
| 3 | Fix lives in `MantineModal.tsx` only; `SheetContent`/`ResponsiveBottomSheet`/`DragHandle`/`useResponsiveDropdown`/`bottomSheetDrawerStyles` unchanged | ✅ | No STOP-AND-ASK needed — the fix was fully expressible inside `MantineModal.tsx`. `responsiveBottomSheet.tsx` not opened/edited this session (see Files Changed note re: the standing Task 520 diff). |
| 4 | No-footer case (`ModalLongSection`) shows no phantom/increased bottom gap vs Task 520 baseline — measured | ✅ | Measured, not assumed: first-pass regression caught (inter-paragraph gap 28px, up from baseline) and fixed via the `Box` wrapper; re-measured after fix = ~12px, matching each paragraph's own `mb="sm"`, not inflated by the Stack gap. Negative flow. |
| 5 | `MantinePopover.tsx` audited; one-line finding in session log | ✅ | See "`MantinePopover.tsx` audit" section above. |
| 6 | Rendered-proof matrix for Modal/standard includes the new vertical-gap column at all 7 cells, all showing a real, non-zero, 16px gap | ✅ | Full matrix below — measured via a transient Playwright script against a real `build-storybook` output (removed after capture). All 7 cells: `verticalGap: 16`. |
| 7 | `git diff --stat` empty for `MantinePopover.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, `MantineSelect.tsx`, `dialog.tsx`, `dialog.stories.tsx` | ✅ (with the documented caveat) | `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, `MantineSelect.tsx`, `dialog.tsx`, `dialog.stories.tsx` — literally empty. `MantinePopover.tsx`/`responsiveBottomSheet.tsx` — non-empty vs `HEAD` but ONLY from Task 520's standing, uncommitted, owner-preserved work; zero edits from Task 521 (see Files Changed note). Negative flow. |

## Rendered proof matrix (clause 12 + §8.2 — Modal/standard, ACTUAL clicked-open renders)

Produced via a transient Playwright script against a real `npm run build-storybook` output (removed after capture; `storybook-static/` is gitignored), clicking the real "standard dialog" trigger and measuring the DOM gap between the body `<p class="mantine-Text-root">` and the footer `<div class="mantine-Flex-root">` (both scoped to `.mantine-Drawer-body` / `.mantine-Modal-body`, not the header, to avoid misreading the title Text as the body).

| Cell | Sheet/Modal width = expected | **Body↔footer vertical gap (NEW column)** | Footer button width | Button font-size | No h-scroll |
|---|---|---|---|---|---|
| uk@320 | 320=320 | **16px** | 288px (=320−32) | 14px | true |
| uk@375 | 375=375 | **16px** | 343px (=375−32) | 14px | true |
| uk@390 | 390=390 | **16px** | 358px (=390−32) | 14px | true |
| en@320 | 320=320 | **16px** | 288px | 14px | true |
| sq@320 | 320=320 | **16px** | 288px | 14px | true |
| it@320 | 320=320 | **16px** | 288px | 14px | true |
| en@768 (≥640 centered Modal) | 440px (unchanged from Task 520) | **16px** | 82px / 92px (natural width, Cancel/Confirm) | 14px | true |

Every cell — all 6 mobile locale/width combinations plus the desktop cell — shows an identical, non-zero, token-consistent 16px vertical gap. Horizontal geometry (sheet width, button width, font-size) is unchanged from Task 520's approved matrix, confirming no regression from the `Stack`/`Box` wrapper.

**Supplementary measurement (regression check, not an AC column but load-bearing evidence for AC4):** inter-paragraph gap in `ModalLongSection` (uk@320) — first pass (bug): 28px; after `Box`-wrapper fix: 12px (matches each paragraph's own `mb="sm"` — i.e. unchanged from the pre-Task-521 baseline).

## Gates (native, this session)

```
$ npx tsc --noEmit
(0 errors)

$ npm run check:stories
── Check 14: Mantine Button size="lg"|"xl" (off-scale, Task 520) ──────
✅ check:stories PASSED — 92 files checked, 0 violations.

$ npm run check:i18n
✅ Parity PASSED — all 4 locale files have identical key sets (2035 keys — unchanged, no new strings).

$ npm run check:design-tokens
✅  check:design-tokens — 0 violations found.

$ npm run check:mojibake
check:mojibake: 0 artifacts in 1483 files
```

**File-integrity (clause 14):** `NUL=0` on both touched files (`MantineModal.tsx`, `docs/mantine-responsive-design-system.md`); `tsc --noEmit` covers the `.tsx` (0 errors, no truncation); tail of `MantineModal.tsx` confirmed intact (ends `)\n}\n`).

**Regression-coverage re-verify (clause 15, Pre-read item 7):**

```
$ grep -rln "MantineModal" --include="*.tsx" --include="*.ts" src | grep -v "src/design-system/mantine" | grep -v "src/stories"
(no output — still no product consumer; regression-coverage clause 15 still N/A)
```

## Self-validation

`npx tsc --noEmit` = 0 errors. Walked the "standard dialog" section at `uk` 320px (trigger → bottom sheet → 16px gap visible between body text and footer buttons → Esc close) and at `en` 768px (centered Modal, 16px gap before the right-aligned footer row) via the Playwright-driven rendered matrix above, cited by name in the AC table alongside the Positive/Negative flow sections. Caught and fixed a real regression (inter-paragraph over-gapping) during implementation via measurement, not assumption — documented in AC4. **Self-validation: COMPLETE.**

**Emit NO `git add`/`git commit`** — orchestrator emits commit commands after diff + rendered-proof review, per the owner's explicit instruction (code review alone is not sufficient approval for this thread, per Task 520's rejection).
