### Task 521 — Fix missing vertical gap between `MantineModal` body and footer (Task 520 REWORK — owner-rejected on rendered review)

Type:        bug
Priority:    high
Area:        src/design-system/mantine/patterns/MantineModal.tsx, src/design-system/mantine/patterns/responsiveBottomSheet.tsx (SheetContent composition only), src/stories/mantine/primitives/Modal.stories.tsx, docs/mantine-responsive-design-system.md §23

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. docs/mantine-responsive-design-system.md — §7.1 (Spacing rhythm — token-only gaps), §19.1 / §19.1a (SheetContent foundation + DropdownMenu/NavigationMenu exemption reasoning), §23 (MantineModal, esp. §23.1 step 2 and §23.4 — both currently overclaim the gutter is complete; this task corrects that)
4. docs/ui-rules.md
5. docs/component-rules.md
6. docs/qa-rules.md
7. docs/critical-flow-registry.md — scanned by the orchestrator: `MantineModal` has no product consumer yet (Task 519 confirmed "no product surface consumes it yet, matching the class of 513/515/518"), so the regression-coverage P0 rule (clause 15) does NOT apply to this task. Re-verify this is still true before closing (grep for `MantineModal` imports outside `src/design-system/mantine/**` and `src/stories/**`); if a consumer now exists, STOP and add a registry row instead of skipping the AC.

Localization coverage:
- No new user-facing strings. `storybook.mantine.modal_*` keys (modal_trigger_open/modal_title/modal_body/modal_confirm/modal_cancel/modal_long_trigger/modal_long_body) are unchanged — this task only changes vertical layout composition around existing text.
- Runtime check still required: the new gap must not cause text truncation, clipping, or unexpected wrap changes in any of sq/en/uk/it (uk long body in `ModalLongSection` especially).

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560 — verify the new gap renders correctly (present, token-sized, not doubled) at every breakpoint, both the mobile bottom-sheet path (<640) and the desktop centered-Modal path (≥640).

## Origin (owner rejection, 2026-07-01)

The owner rendered `Mantine/Primitives/Modal → Default`, "standard dialog" section, at 275px and rejected Task 520 on sight: **"Sonnet dug into the padding and just stripped out the spacing between the buttons and the text."** Verified by the orchestrator against the real files (not the Task 520 session log, which does not mention this dimension at all):

- `MantineModal.tsx` mobile branch: `<SheetContent>{children}{footer}</SheetContent>` — `SheetContent` (`responsiveBottomSheet.tsx`) is `<Box px="md" pb="md">{children}</Box>`. `children` here is the raw concatenation `{children}{footer}` with **zero gap token between them** — the body `Text` and the footer `Flex` (buttons) are plain siblings inside one `Box`, so the only vertical separation between them is whatever margin the `Text`/`Flex` components carry themselves, which is none.
- `MantineModal.tsx` desktop branch: `<Modal ...>{children}{footer}</Modal>` — same defect, no gap token, on the ≥640 path too.
- **This is a regression relative to the codebase's own established convention for this exact composition.** `MantineDialogDrawerPattern.tsx` (same directory, and a file Task 520 itself edited for the Button-size fix, so the executor had it open) implements the identical body+actions shape correctly: mobile wraps everything in `<Stack gap="md">` (`MantineDialogDrawerPattern.tsx:105`) with a nested `<Stack gap="sm">` for the two stacked buttons; desktop gives the body `<Text size="sm" mb="md">` before the actions `<Group gap="sm" justify="flex-end">` (`MantineDialogDrawerPattern.tsx:137-139`). `MantineModal`/`SheetContent` has neither.
- **Task 520's own rendered-proof matrix never measured this.** The "Rendered proof matrix" table in `docs/sessions/2026-07-01-task520-mantine-overlay-gutter-button-global.md` (Modal/standard section) records sheet width, footer-button width, and font-size — it has no column for vertical distance between body content and the footer row. The defect is real, visible, and was not caught by the automated proof because the proof measured the wrong dimension.

**This task does not touch** the Task 520 horizontal-gutter fix (16px `px="md"` sides + `pb="md"` bottom on `SheetContent`, correct and unchanged), the Button-size fix (Defect B, correct and unchanged), or the §18.8 empty-space-below-footer known issue (separate, still deferred, not in scope here).

## Bug / Goal

Add the missing vertical gap token between `MantineModal`'s body (`children`) and footer (`footer`) on **both** the mobile bottom-sheet path and the desktop centered-Modal path, matching the codebase's own established `Stack gap="md"` convention (`MantineDialogDrawerPattern.tsx`), without regressing the Task 520 horizontal-gutter fix, the Button-size fix, the no-footer case, or any of the three other overlays (`MantinePopover`, `MantineDropdownMenu`, `MantineNavigationMenu`) that also consume `SheetContent` / `ResponsiveBottomSheet`.

## Required after behavior

As any user, on any surface embedding `MantineModal` with a `footer` (verified live in `Mantine/Primitives/Modal → Default`, "standard dialog" section):

1. User taps the trigger Button → dialog opens (mobile: bottom sheet; desktop: centered Modal) — unchanged from Task 520.
2. The body text (`modal_body`) is visually separated from the footer button row by a clear, **token-based** vertical gap of `gap="md"` (16px, matching `MantineDialogDrawerPattern`'s convention) — on BOTH the mobile and desktop paths.
3. **Mobile (<640):** inside `SheetContent`, `{children}` and `{footer}` are wrapped in `<Stack gap="md">` instead of raw concatenation. `SheetContent`'s own `px="md" pb="md"` outer gutter (Task 520) is unchanged.
4. **Desktop (≥640):** inside `Modal`, `{children}` and `{footer}` are likewise wrapped in `<Stack gap="md">` (do not alter the existing right-aligned `Flex justify="flex-end"` footer row layout — that is caller composition per the component's own doc comment and must survive unchanged).
5. Implement the fix in `MantineModal.tsx` only (both branches), NOT inside the shared `SheetContent`/`ResponsiveBottomSheet` primitives in `responsiveBottomSheet.tsx` — those are consumed by `MantinePopover` (content-only, no footer concept) and must not gain an unrelated `Stack` wrapper. If you find a reason this must instead live in a shared primitive, STOP and ASK rather than changing shared-primitive behavior unilaterally.
6. `ModalLongSection` (no-footer case) renders unchanged: `Stack gap="md"` around `{children}{undefined}` must not reserve a phantom trailing gap after the body content — verify this against the actual rendered DOM (`gap` is a CSS row-gap between flex children, not a trailing margin; confirm the measured bottom spacing in the no-footer case is unchanged from Task 520, not increased).
7. Audit `MantinePopover.tsx`: it only ever wraps `{children}` (no `footer` concept) inside `SheetContent`, so this defect class should not apply there — confirm in the session log with a one-line finding (not assumed).
8. The rendered-proof matrix for the Modal/standard section MUST add a new measured column — **vertical gap (px) between the last line of body content and the top of the footer button row** — at every mobile cell (uk@320/375/390, en@320, sq@320, it@320) and the ≥640 desktop cell. This is the exact dimension Task 520's matrix omitted; its absence is why the defect shipped.

## Negative flow (every off-happy-path branch)

- **No footer provided** (`ModalLongSection`) → no footer wrapper rendered, no phantom gap reserved after the body; verify via measured DOM, not assumption (see step 6 above).
- **Very long body content on mobile** → gap still present and correctly sized after internal scroll (≤90dvh, header/handle pinned) — unchanged Task 514/519 mechanics, not touched by this fix.
- **Desktop ≥640 with short body** → gap present, footer stays right-aligned (`Flex justify="flex-end"` from the story, untouched), no layout shift versus Task 520's approved horizontal geometry.
- **uk/it/sq long text wrapping** → the gap token must render identically regardless of locale; no horizontal or new vertical overflow introduced at any of the 7 canonical breakpoints.
- **Regression check on sibling overlays** — `MantinePopover.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, `MantineSelect.tsx`, legacy `src/components/ui/dialog.tsx` + its story: `git diff --stat` for all five MUST be empty (same invariant Task 520 itself verified) unless this task's own kickoff explicitly authorizes touching one of them, which it does not.
- **Backdrop tap / Esc close** → unchanged; no footer handler fires; focus returns to the opener (Task 519/520 default, not touched here).

## Mobile <640 full-width gate (unchanged, re-verify only — do not alter)

The Task 520 fixes for this gate must survive untouched: footer buttons remain `w={{ base: '100%', sm: 'auto' }}`, ≥44px touch targets, full-width edge-to-edge bottom sheet, top-only radius, drag handle, closes on backdrop tap + Esc, labels wrap at all 4 locales with no clipping or horizontal scroll at 320px. This task adds vertical rhythm only — re-verify (in the rendered matrix) that none of the horizontal/full-width mechanics regressed as a side effect of the `Stack` wrapper.

## Required investigation

1. Read `MantineModal.tsx` (current, both branches) and `responsiveBottomSheet.tsx`'s `SheetContent` export — confirm the zero-gap defect exactly as described above before writing any fix.
2. Read `MantineDialogDrawerPattern.tsx:90-148` — the reference pattern this task must match (`Stack gap="md"` mobile, `mb="md"` + `Group gap="sm"` desktop).
3. Read `MantinePopover.tsx` — confirm it has no footer concept and this defect class does not apply (one-line finding required in the session log, not silence).
4. Re-run the Task 520 rendered-proof approach (transient Playwright script against a real `build-storybook` output) but ADD the missing vertical-gap measurement column.

## Acceptance criteria

- AC1 (Required-after-behavior step 3): mobile `SheetContent` composition in `MantineModal.tsx` wraps `{children}{footer}` in `Stack gap="md"` — verifiable at `MantineModal.tsx:<line>`.
- AC2 (step 4): desktop `Modal` composition wraps `{children}{footer}` in `Stack gap="md"` — verifiable at `MantineModal.tsx:<line>`; existing `Flex justify="flex-end"` footer row (owned by the story) unchanged.
- AC3 (step 5): fix lives in `MantineModal.tsx` only; `responsiveBottomSheet.tsx`'s `SheetContent`/`ResponsiveBottomSheet`/`DragHandle`/`useResponsiveDropdown`/`bottomSheetDrawerStyles` unchanged (`git diff --stat` empty) — unless a STOP-AND-ASK was raised and answered.
- AC4 (step 6, Negative flow): no-footer case (`ModalLongSection`) shows no phantom/increased bottom gap versus the Task 520 baseline — measured, not assumed.
- AC5 (step 7): `MantinePopover.tsx` audited; one-line finding in the session log.
- AC6 (step 8): rendered-proof matrix for Modal/standard includes the new vertical-gap column at uk@320/375/390, en@320, sq@320, it@320, and the ≥640 desktop cell — all showing a real, non-zero, token-consistent (16px) gap.
- AC7 (Negative flow, regression check): `git diff --stat` empty for `MantinePopover.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`, `MantineSelect.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/dialog.stories.tsx`.
- Existing working controls/flows (trigger, Cancel, Confirm, backdrop/Esc close, internal scroll on long content) preserved.
- 0 new lint errors / 0 new warnings. `npx tsc --noEmit` → 0 errors.
- Relevant governance checks pass: `check:stories` (incl. Task 520's Check 14), `check:i18n` (2035×4, unchanged key count), `check:design-tokens`, `check:mojibake`.
- All four locales render correctly at runtime (no new clipping/overflow from the gap change).
- All seven breakpoints render correctly.
- Regression coverage (clause 15): N/A — `MantineModal` has no product consumer yet (re-verify per Pre-read item 7 before closing).
- `docs/backlog.md` updated; `docs/mantine-responsive-design-system.md` §23.1 step 2 and §23.4 corrected to describe the actual (fixed) composition instead of the current inaccurate "single 16px gutter for both" claim.
- Session log under `docs/sessions/` with the Note 18 self-validation block, AC-by-AC table citing this task's Positive/Negative flow sections by name, and a "Files Changed" table (one row per touched path + rationale). The executor MUST NOT emit `git add`/`git commit` — the orchestrator emits them after diff + rendered-proof review, per the owner's explicit instruction on Task 520 (code review alone is not sufficient approval for this thread).

## Out of scope

- Do NOT touch `responsiveBottomSheet.tsx`'s Drawer open/close/DragHandle/`useResponsiveDropdown` mechanics.
- Do NOT touch the §18.8 empty-space-below-footer known issue (separate, deferred, needs explicit owner sign-off per Task 520's own follow-up note).
- Do NOT touch the Button-size fix (Task 520 Defect B) — already correct.
- Do NOT touch `MantineDialogDrawerPattern.tsx` beyond reading it as reference.
- Do NOT touch `MantineSelect.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx` row/tap-target composition (Task 520's §19.1a exemption stands).
- Do NOT change the `MantineModal`/`MantineModalProps` public API surface.
