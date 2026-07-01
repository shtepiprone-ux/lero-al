# Task 520 — GLOBAL corrective: Mantine overlay content-gutter + canonical button font (Task 519 rework)

Kickoff: `tasks/Sprints/Sprint_39_kickoff_prompt_Task_520_ModalContentGutterFix.md`. Origin: owner rendered `Mantine/Primitives/Modal → Default` at 275px and found Task 519's code review missed two P0 style defects. This task fixes both GLOBALLY (Note-14 global-change rule), not by patching one story.

## Summary of the two defects + fixes

**Defect A (bottom-sheet content bleeds to sheet edges):** `responsiveBottomSheet.tsx`'s `body: { padding: 0 }` is intentional (row-based consumers — `MantineSelect`/`MantineDropdownMenu`/`MantineNavigationMenu` — need edge-to-edge ≥44px tap rows, each supplying its own `px="md"` label inset). But `MantineModal`'s `footer` rendered as a raw sibling with no gutter at all — the story's own ad-hoc `<Box px="md">` padded the `children` (body) but NOT the `footer`, so the footer bled to the sheet edges. **Fix:** new additive `SheetContent` export (`responsiveBottomSheet.tsx`) — a `px="md" pb="md"` wrapper — consumed by `MantineModal` (wraps `children`+`footer` together, mobile only) and `MantinePopover` (wraps `children`, mobile only, preventively, since its content is the same "arbitrary blob" shape as Modal's). **`MantineDropdownMenu`/`MantineNavigationMenu` were audited and found to already comply** — their mobile rows already carry per-row `px="md"`, structurally identical to `MantineSelect`'s explicitly-exempted edge-to-edge option-row pattern. Wrapping their row `Stack` in `SheetContent` would have doubled the inset and shrunk full-width tap rows to inset ones — a regression to two owner-approved components (515/518). This is documented as new §19.1a in the design-system doc (a correction to the kickoff's blanket Defect-A description, backed by rendered-proof measurement, not a guess).

**Defect B (off-scale Button font):** removed every Mantine `<Button size="lg"|"xl">` in `src/design-system/mantine/**` + `src/stories/mantine/**` — `Modal.stories.tsx:37,45` (mine, from Task 519), `Card.stories.tsx:34`, and `MantineDialogDrawerPattern.tsx:64,113,122` (kickoff named `:113,122`; `:64` — the trigger Button — is the same defect class in the same file, fixed too, flagged here since it wasn't explicitly named). All now use the canonical default (`size="sm"`/14px + 44px min-height from `theme.ts`). Non-Button `size="lg"|"xl"` (`Text`/`Badge`/`Loader`) and the icon-only `ActionIcon` favorite button (`MantineListingCardPattern.tsx:79`, named exempt in the kickoff) are untouched. Legacy shadcn `Button` (different size scale, `size="xl"`=44px correct there) untouched. **Enforcement gate:** new Check 14 in `scripts/check-stories.mjs`, scoped to `src/stories/mantine/**` + `src/design-system/mantine/patterns/**` only (not all stories — legacy shadcn Buttons use a different, correct scale and must not be flagged), with a `// @allow-button-size <reason>` escape hatch. Planted-violation + revert transcript below.

**Secondary (empty-space below footer at 275px):** reproduced identically across all four overlay stories (Modal/Popover/DropdownMenu/NavigationMenu — 570–650px of dead space below content at a 275×900 viewport). Root cause: `bottomSheetDrawerStyles.body = { flex: 1 }` always stretches the sheet body to fill the 90dvh container regardless of actual content height — this is shared-source (Task 514), not Modal-specific. Per the kickoff's explicit STOP-AND-ASK trigger ("Any fix needing `responsiveBottomSheet.tsx` open/close/Drawer mechanics → STOP and ASK"), this is **reported, not fixed** — documented as new §18.8 (known issue) in `docs/mantine-responsive-design-system.md`, with a recommendation that fixing it requires changing the Task 514 source's flex/height mechanics (out of scope here).

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` | ADDITIVE: new `SheetContent` export (px="md" pb="md" wrapper). No change to `DragHandle`/`ResponsiveBottomSheet`/`useResponsiveDropdown`/`bottomSheetDrawerStyles`. |
| `src/design-system/mantine/patterns/index.ts` | Export `SheetContent` + `SheetContentProps`. |
| `src/design-system/mantine/patterns/MantineModal.tsx` | Mobile branch wraps `{children}{footer}` in `<SheetContent>` (Defect A fix); doc comment updated. |
| `src/design-system/mantine/patterns/MantinePopover.tsx` | Mobile branch wraps `{children}` in `<SheetContent>` (Defect A preventive fix); doc comment updated. Desktop `Popover.Dropdown` untouched. |
| `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` | Removed 3× `Button size="lg"` (trigger + 2 mobile actions); stale doc-comment references to "size=lg=50px" updated to canonical default. (Defect B) |
| `src/stories/mantine/primitives/Modal.stories.tsx` | Removed ad-hoc body `<Box px="md" py="sm">` in both sections (gutter now owned by `MantineModal`); removed `size="lg"` on both footer Buttons. |
| `src/stories/mantine/primitives/Popover.stories.tsx` | Removed the `content` fixture's own `<Box px="md" py="sm">` wrapper (now redundant — `MantinePopover` supplies the mobile gutter; desktop `Popover.Dropdown` keeps Mantine's own default padding) to avoid double-padding on mobile. |
| `src/stories/mantine/primitives/Card.stories.tsx` | Removed `size="lg"` on the demo card action Button (Defect B). |
| `scripts/check-stories.mjs` | New Check 14 — fails on Mantine `<Button size="lg"|"xl">` in `src/stories/mantine/**` + `src/design-system/mantine/patterns/**`, with `// @allow-button-size <reason>` escape hatch; header docstring + `checksRan` updated 13→14. |
| `docs/mantine-responsive-design-system.md` | §19.1 foundation table: add `SheetContent`. New §19.1a: documents the DropdownMenu/NavigationMenu exemption decision + why. §20.1/§20.4 (Popover): `SheetContent` note + gutter gate line. §23.1/§23.4 (Modal): `SheetContent` note, gutter gate line, empty-space known-issue cross-ref. New §18.8: empty-space known issue (reported, not fixed). |
| `docs/mantine-tailadmin-migration-tracker.md` | No status change required by this task (P1.16 stays ✅) — verified unchanged content still correct. |
| `messages/*.json` | No new i18n keys — Modal/Popover fixture text unchanged, only layout/JSX restructured. |

No changes to `responsiveBottomSheet.tsx` open/close/Drawer/DragHandle mechanics or `body:{padding:0}`; no changes to `MantineSelect.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, legacy `dialog.tsx`/`dialog.stories.tsx` — confirmed via `git status`/`git diff --stat` (all empty diffs, see Gates section).

## Positive / Negative flows

**Positive:** open any Mantine overlay with arbitrary content (Modal, Popover) → title/body/footer share one 16px gutter (measured, see rendered matrix); footer buttons full-width within the gutter at 14px text/44px height; ≥640 desktop form unchanged (centered Modal / anchored Popover). Backdrop/Esc close, focus returns to trigger (Task 514 defaults, untouched). Row-based overlays (DropdownMenu/NavigationMenu) keep their existing edge-to-edge tap rows with a 16px label inset — measured identical to the Select precedent.

**Negative:** no-footer render clean (Modal's long-content section, unchanged from Task 519); long uk wraps at every mobile cell (measured `noHScroll: true` at all 7×4 cells); SSR closed no flash (unchanged `useResponsiveDropdown` caveat); the button-size gate FAILS on a planted `size="lg"` (exact file:line reported) and passes clean after revert (transcript below); the escape hatch (`// @allow-button-size <reason>`) correctly suppresses a flagged line in an isolated test.

## AC-by-AC self-audit

| # | AC | Verdict | Evidence |
|---|---|---|---|
| 1 | Canonical padded sheet content wrapper (single source); Modal/Popover/DropdownMenu/NavigationMenu all "consume it"; body+footer inset to §6i md (16px); MantineSelect option rows unchanged | ✅ (with documented scope correction) | `SheetContent` exported from `responsiveBottomSheet.tsx`, consumed by `MantineModal` + `MantinePopover` (both wrap arbitrary-content blobs — the actual defect class). `MantineDropdownMenu`/`MantineNavigationMenu` audited and found to already satisfy the SAME 16px gutter VALUE via per-row `px="md"` — wrapping their rows would double-pad and break edge-to-edge tap targets (measured: DropdownMenu row width 320px = full viewport, label inset exactly 16px). `MantineSelect` untouched (`git diff --stat` empty). See §19.1a for the full reasoning, written into docs for future task authors. |
| 2 | Zero Mantine `Button size="lg"|"xl"` remain in scope dirs (grep proof); canonical 14px/44px default; §6 variants intact; non-Button/icon-only exemptions listed; legacy shadcn untouched | ✅ | `grep -rn 'size="lg"\|size="xl"' src/design-system/mantine/patterns src/stories/mantine` → only `Text`/`Badge`/`Loader`/comment matches remain (below). Variants (`variant="filled"/"outline"/color="brand"/"gray"`) unchanged on every fixed Button. Exemptions: `MantineListingCardPattern.tsx:79` `ActionIcon` (icon-only, named in kickoff); `Text`/`Badge`/`Loader` `size="lg"/"xl"` (non-Button). Legacy `src/components/ui/button.tsx` and its consumers untouched (`git diff --stat` empty for `src/components/ui/**` and `src/modules/**`). |
| 3 | Enforcement gate added (fails on Mantine overlay Button size="lg"|"xl"), planted-violation FAIL + clean-revert transcript | ✅ | Check 14 in `check-stories.mjs`. Transcript below: plant on `Card.stories.tsx:34` → FAIL with exact file:line + message; revert → PASS. Escape-hatch (`// @allow-button-size`) verified via an isolated `runGate()` fixture (not committed) — correctly suppressed. |
| 4 | Empty-space fixed in MantineModal OR proven shared-source and reported | ✅ (reported branch) | Measured identically across all 4 overlays at 275×900 (Modal 574px / Popover 650px / DropdownMenu 573px / NavigationMenu 618px of empty space) via Playwright against a real `build-storybook` output. Root cause = `bottomSheetDrawerStyles.body.flex:1` (Task 514 source) — fixing it is out of scope per the kickoff's own STOP-AND-ASK trigger on `responsiveBottomSheet.tsx` mechanics. Documented as §18.8 known issue; NOT fixed in this task. |
| 5 | `responsiveBottomSheet.tsx` mechanics + `MantineSelect` + legacy dialog UNCHANGED; DragHandle single-source; overlay APIs unchanged | ✅ | `grep -rn "function DragHandle" src/design-system/mantine` → 1 match. `git diff --stat` empty for `MantineSelect.tsx`, `dialog.tsx`, `dialog.stories.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`. `MantineModalProps`/`MantinePopoverProps` public shapes unchanged (only internal render tree touched). |
| 6 | Rendered proof matrix for ALL four overlays (7 cells each), showing gutter + 14px buttons | ✅ | Full matrix below — measured via a transient Playwright script against a real `build-storybook` output (removed after capture). |
| 7 | Docs §19/§20/§23 updated; locale parity intact if any keys change | ✅ | §18.8 (new), §19.1 (SheetContent row), §19.1a (new — exemption reasoning), §20.1/§20.4 (Popover gutter note), §23.1/§23.4 (Modal gutter note). No new i18n keys — `check:i18n` still 2035×4 (unchanged from Task 519). |
| 8 | Gates green: tsc=0, check:stories (incl. new rule), check:i18n, check:design-tokens, check:mojibake; file-integrity clean | ✅ | Transcript below. |

## Rendered proof matrix (clause 12 + §8.2 — ACTUAL clicked-open renders, all 4 overlays)

Produced via a transient Playwright script against a real `npm run build-storybook` output (removed after capture; `storybook-static/` is gitignored), driving the real `Default` story of each of the four overlays, clicking the real trigger, and measuring DOM geometry + computed `font-size`.

**Modal/standard (footer buttons — the exact bug the owner reported):**

| Cell | Sheet width = viewport (edge-to-edge) | Footer button width | Button font-size | No h-scroll |
|---|---|---|---|---|
| uk@320 | 320=320 | 288px (=320−32, i.e. 16px gutter/side) | 14px | true |
| uk@375 | 375=375 | 343px (=375−32) | 14px | true |
| uk@390 | 390=390 | 358px (=390−32) | 14px | true |
| en@320 | 320=320 | 288px | 14px | true |
| sq@320 | 320=320 | 288px | 14px | true |
| it@320 | 320=320 | 288px | 14px | true |
| en@768 (≥640 centered Modal) | 440px wide, left=164 (centered: (768−440)/2=164, NOT edge-to-edge) | n/a (desktop row layout) | 14px | true |

Every mobile cell's footer buttons measure exactly `viewport − 32px` — i.e. precisely one 16px gutter per side (the `SheetContent` wrapper), no longer edge-to-edge. Font-size 14px at every cell (was 18px on `main` before this fix) confirms Defect B is fixed.

**Popover/trigger (content is prose, not buttons — measured content-text inset instead):**

| Cell | Sheet width = viewport | Text left inset | Text right inset | No h-scroll |
|---|---|---|---|---|
| uk@320 | 320=320 | 16px | 16px | true |
| uk@375 | 375=375 | 16px | 16px | true |
| uk@390 | 390=390 | 16px | 16px | true |
| en@320 | 320=320 | 16px | 16px | true |
| sq@320 | 320=320 | 16px | 16px | true |
| it@320 | 320=320 | 16px | 16px | true |
| en@768 (≥640 anchored Popover) | 634px wide (Mantine `width="max-content"`, own default padding, unchanged) | n/a | n/a | true |

Every one of the 6 mobile cells was individually measured (not extrapolated) — all six show an identical 16px inset both sides.

**DropdownMenu/trigger (row-based — confirms the §19.1a exemption is visually correct, not a regression):**

| Cell | Sheet width = viewport | Row (tap target) width | Row label text inset | Desktop Menu.Item font-size |
|---|---|---|---|---|
| uk@320 | 320=320 | 320px (edge-to-edge, BY DESIGN — full tap target) | 16px (own `px="md"`) | — |
| uk@375 | 375=375 | 375px | 16px | — |
| uk@390 | 390=390 | 390px | 16px | — |
| en@320 | 320=320 | 320px | 16px | — |
| sq@320 | 320=320 | 320px | 16px | — |
| it@320 | 320=320 | 320px | 16px | — |
| en@768 (≥640 anchored Menu) | 156px wide (Mantine Menu.Dropdown, own padding) | — | — | 14px |

Rows are edge-to-edge (correct — matches Select's exempted pattern) while the LABEL inside each row is inset exactly 16px from the sheet edge, identical gutter value to Modal/Popover, applied at the row level instead of a container wrapper. No double-padding, no regression.

**NavigationMenu/section1 (same row-based pattern as DropdownMenu, links render as `<a>` since `href` is set — not `<button>`):**

| Cell | Sheet width = viewport | No h-scroll |
|---|---|---|
| uk@320 | 320=320 | true |
| uk@375 | 375=375 | true |
| uk@390 | 390=390 | true |
| en@320 | 320=320 | true |
| sq@320 | 320=320 | true |
| it@320 | 320=320 | true |
| en@768 (≥640 anchored Menu per section) | 219px wide (first section's Menu.Dropdown) | true |

## Gates (native, this session)

```
$ npx tsc --noEmit
(0 errors)

$ npm run check:stories
── Check 14: Mantine Button size="lg"|"xl" (off-scale, Task 520) ──────
── Stale allowlist entry check ──────────────────────────────────────
✅ check:stories PASSED — 92 files checked, 0 violations.

$ npm run check:i18n
✅ Parity PASSED — all 4 locale files have identical key sets (2035 keys).

$ npm run check:design-tokens
✅  check:design-tokens — 0 violations found.

$ npm run check:mojibake
check:mojibake: 0 artifacts in 1481 files
```

**Planted-violation transcript (Check 14 — proves the gate actually fails, not a no-op gate):**

```
$ # planted: added back `size="lg"` to Card.stories.tsx:34
$ npm run check:stories
❌ check:stories FAILED — 1 violation(s):
  src/stories/mantine/primitives/Card.stories.tsx:34  [mantine-button-offscale-size]
    Mantine <Button size="lg"> is off-scale — canonical default is size="sm" (14px) + 44px
    min-height (theme.ts; docs/tailadmin-style-reference.md §6 Density Correction, Task 492).
    Remove the size override, or add "// @allow-button-size <reason>" on the previous line
    for a justified exception (Task 520).

$ # reverted the plant
$ npm run check:stories
✅ check:stories PASSED — 92 files checked, 0 violations.
```

**Escape-hatch transcript (isolated `runGate()` fixture, not committed to the repo):**

```
Fixture: <Button size="xl">Inline</Button>                    → FLAGGED (mantine-button-offscale-size, line 2)
Fixture: <Button ... // @allow-button-size hero CTA justified
                 size="lg"> ...                                → NOT flagged (escape hatch honored)
```

**File-integrity (clause 14) — every touched file:** `NUL=0` on all 15 touched files; `node --check scripts/check-stories.mjs` exits 0; `JSON.parse` exits 0 for all 4 locale files; `tsc --noEmit` covers all `.ts`/`.tsx` (0 errors, so no truncation/parse failure). `git status --porcelain` shows exactly the 15 files in "Files Changed" — no phantom files.

**Preserve-invariant checks:**

```
$ grep -rn "function DragHandle" src/design-system/mantine
src/design-system/mantine/patterns/responsiveBottomSheet.tsx:53:export function DragHandle() {
(1 match — unchanged)

$ git diff --stat -- src/design-system/mantine/patterns/MantineSelect.tsx
(empty — unchanged)

$ git diff --stat -- src/components/ui/dialog.tsx src/components/ui/dialog.stories.tsx
(empty — unchanged)

$ git diff --stat -- src/design-system/mantine/patterns/MantineDropdownMenu.tsx src/design-system/mantine/patterns/MantineNavigationMenu.tsx
(empty — unchanged, per the §19.1a exemption decision)
```

## Self-validation

`npx tsc --noEmit` = 0 errors. Walked Modal at `uk` 320px (trigger → bottom sheet → footer buttons now inset 16px + 14px text → Esc close) and Popover at `en` 768px (anchored dropdown, unchanged) via the Playwright-driven rendered matrix above — both cited by name in the AC table alongside the Positive/Negative flow sections. Confirmed via `grep`/`git diff --stat` that `responsiveBottomSheet.tsx` mechanics, `MantineSelect`, `MantineDropdownMenu`, `MantineNavigationMenu`, and legacy `dialog.tsx` are byte-for-byte unchanged. **Self-validation: COMPLETE.**

**Emit NO `git add`/`git commit`** — orchestrator emits commit commands after diff + rendered-proof review (no approval from code alone this time, per the kickoff's explicit instruction).

## Follow-up recommendations (NOT done in this task)

1. **§18.8 empty-space issue** — a follow-up task should change `responsiveBottomSheet.tsx`'s `bottomSheetDrawerStyles.body` so short content doesn't force the sheet to the full 90dvh (e.g. size-to-content with a 90dvh cap, only filling when content actually needs it). This is a Task-514-source change and needs explicit owner sign-off given its blast radius (every Batch C overlay).
2. `MantineDialogDrawerPattern.tsx`'s refactor onto `MantineModal`/`ResponsiveBottomSheet` remains a separate follow-up (per Task 519's own note) — untouched here except for the Button-size fix.
