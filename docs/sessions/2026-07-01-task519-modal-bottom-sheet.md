# Task 519 — Canonical responsive Modal: `MantineModal` (Batch C P1.16)

Kickoff: `tasks/Sprints/Sprint_39_kickoff_prompt_Task_519_ModalBottomSheet.md`.

## Summary

New canonical `MantineModal` primitive — a fully **controlled** overlay (caller owns `opened`/`onClose`
and supplies its own trigger, unlike the trigger-wrapping `MantinePopover`/`MantineDropdownMenu`). Centered
Mantine `Modal` at ≥640px; full-width `ResponsiveBottomSheet` (Task 514 single source) at <640px. Primitive +
story slice only — no product surface consumes it yet, matching the class of 513/515/518. Legacy
`src/components/ui/dialog.tsx` + its story and the pre-514 `MantineDialogDrawerPattern.tsx` + its story are
untouched (confirmed via `git status`).

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineModal.tsx` | NEW — canonical responsive Modal primitive (literal API: `opened`/`onClose`/`title`/`children`/`footer`/`size`), consumes Task 514 `useResponsiveDropdown` + `ResponsiveBottomSheet`. |
| `src/design-system/mantine/patterns/index.ts` | Export `MantineModal` + `MantineModalProps`. |
| `src/stories/mantine/primitives/Modal.stories.tsx` | NEW — proof story mirroring `Popover.stories.tsx`: `skipCanvas:true` + `layout:'fullscreen'` + page-gutter Box, `Default` only, two distinct-STATE sections (standard dialog with footer · long-content dialog with no footer), each with a local `useState` + real-click trigger, all strings via `storyT()`. |
| `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json` | Add `storybook.mantine.modal_trigger_open` / `modal_title` / `modal_body` / `modal_confirm` / `modal_cancel` / `modal_long_trigger` / `modal_long_body` — 4-locale parity (uk = real Cyrillic long body, 4 paragraphs). |
| `docs/mantine-responsive-design-system.md` | Add §23 — Canonical responsive Modal: `MantineModal` (Task 519), following the §20/§21/§22 template (core mechanism · SSR/hydration caveat · Storybook proof location · P0 gate · relationship to `MantineDialogDrawerPattern`). |
| `docs/mantine-tailadmin-migration-tracker.md` | Flip `P1.16 | Dialog / Modal` row `⬜` → `✅ Task 519`; update "Current pointer" Batch C line (P1.16 ✅, NEXT = P1.17 Drawer · P1.22 Tooltip). |

No changes to `responsiveBottomSheet.tsx`, `MantinePopover.tsx`, `MantineDropdownMenu.tsx`, `MantineNavigationMenu.tsx`,
`MantineDialogDrawerPattern.tsx`, `src/components/ui/dialog.tsx`, or `dialog.stories.tsx` — confirmed via `git status`
(none of these paths appear in the diff).

## Positive flow (happy path)

Actor at 320–390px taps the trigger Button → a full-width bottom sheet slides up with the title (centered drag
handle), body, and full-width footer buttons. Scrolls the body if long (≤90dvh, handle/title pinned). Taps a footer
button → its handler fires + the sheet closes; OR taps backdrop / presses Esc → closes with no handler fired, focus
returns to the trigger. At ≥640 the SAME modal opens centered; footer buttons sit in the caller's row; X/backdrop/Esc
close. **Verified**: story clicks (`Escape` close) at all 7 matrix cells below; centered vs bottom-sheet split
confirmed by measured DOM geometry (not description).

## Negative flow (every off-happy-path branch)

- **Backdrop tap / Esc** → closes without firing any footer handler (component has no internal state that would
  fire a handler on close — `onClose` alone is called by both Mantine `Modal` and `ResponsiveBottomSheet`'s Drawer);
  verified `closedAfterEsc: true` at all 7 cells. Focus-return relies on Mantine's default `returnFocus` (Modal) and
  the Task 514 `ResponsiveBottomSheet`'s `returnFocus` prop — both defaults, unchanged by this task.
- **Long-content body** → verified internal scroll ≤90dvh at <640 (title + drag handle stay pinned, body
  `scrollHeight > clientHeight`) at a constrained 500px-tall viewport; no page h-scroll at 320 (`hNoOverflow: true`).
- **No `footer` provided** → the long-content story section passes no `footer` prop; renders cleanly (code path:
  `{footer}` with `footer=undefined` — React renders nothing), no crash observed.
- **Long uk title/body** → uk@320/375/390 cells all render with no horizontal overflow (`restingHscroll: true` /
  `hScroll: true` meaning `scrollWidth <= clientWidth`).
- **Rapid re-open / double trigger tap** → `opened` is fully controlled by the story's local `useState`; the
  component holds no internal open-state, so duplicate instances are structurally impossible (single conditional
  render branch on `isMobile`, single `<Modal>`/`<ResponsiveBottomSheet>` mount).
- **SSR / first paint** → `useResponsiveDropdown().isMobile` is `false` on first render (Mantine v8
  `getInitialValueInEffect=true`, documented in the component + §23.2); overlay is additionally gated by the
  caller's `opened` (default `false` in the story), so no flash on either axis.

## AC-by-AC self-audit

| # | AC | Verdict | Evidence |
|---|---|---|---|
| 1 | `MantineModal` exists with the literal API, exported from `patterns/index.ts` | ✅ | `MantineModal.tsx:9-20` (interface matches kickoff literally); `patterns/index.ts` lines added at end (`export { MantineModal }` / `export type { MantineModalProps }`). |
| 2 | <640 opened Modal renders full-width `ResponsiveBottomSheet` edge-to-edge with centered drag handle + heading; body scrolls ≤90dvh | ✅ | `MantineModal.tsx:66-71` (isMobile branch → `ResponsiveBottomSheet` passthrough, no fork). Rendered matrix: bottom-sheet `width === viewportWidth` at uk@320/375/390, en@320, sq@320, it@320; long-content cell `bodyScrollable: true`, `within90dvh: true` at 500px height. Positive flow. |
| 3 | ≥640 opened Modal renders centered Mantine `Modal` with title/body/footer | ✅ | `MantineModal.tsx:73-75`. Rendered cell en@768: `kind: 'centered-modal'`, `width: 440` (Mantine `size='md'` ≈ 440px), `left: 164` (centered: `(768-440)/2=164`), not edge-to-edge. |
| 4 | Backdrop tap + Esc close on both paths without firing a footer handler; focus returns to trigger; no-footer branch renders cleanly; controlled `opened` prevents duplicate instances | ✅ | `closedAfterEsc: true` all 7 cells (measured — no `.mantine-Modal-content`/`.mantine-Drawer-content` after Esc). No-footer: long-content section omits `footer` prop, renders without crash (story ran clean in Playwright, no `pageerror`). Controlled instance: single render branch, see AC2. Negative flow. |
| 5 | `grep "function DragHandle"` = ONE match; no inline `bottomSheetDrawerStyles`/`<Drawer position="bottom">` outside `responsiveBottomSheet.tsx`; `responsiveBottomSheet.tsx` + `MantineDialogDrawerPattern.tsx` UNCHANGED; legacy `dialog.tsx` + story UNCHANGED | ✅ | `grep -rn "function DragHandle" src/design-system/mantine` → 1 match (`responsiveBottomSheet.tsx:53`). `grep -rl 'position="bottom"' src/design-system/mantine` → only `MantineDialogDrawerPattern.tsx` (pre-existing, untouched). `git status --porcelain` shows none of `responsiveBottomSheet.tsx`, `MantineDialogDrawerPattern.tsx`, `dialog.tsx`, `dialog.stories.tsx` modified. |
| 6 | Story: `skipCanvas:true` + `layout:'fullscreen'` + page-gutter Box; Default only; distinct-STATE sections (standard · long-content), no per-viewport section, no `defaultOpened`; clicked-open matrix incl. uk@320/375/390 + ≥640 cell | ✅ | `Modal.stories.tsx:6` (`meta.parameters`); `Box px={{base:'md',sm:'xl'}} py="md"` (render fn); exactly one `Default` export; two local-`useState` sections (`ModalStandardSection`, `ModalLongSection`); no `defaultOpened` anywhere in the file. Rendered matrix below. |
| 7 | Docs §23 added + tracker P1.16 → ✅ Task 519; `storybook.mantine.modal_*` keys sq/en/uk/it parity (uk = real Cyrillic); no consumer API break | ✅ | `docs/mantine-responsive-design-system.md` §23 (5 subsections). `docs/mantine-tailadmin-migration-tracker.md` line 64 + "Current pointer". `check:i18n` → 2035×4 parity (below); `check:stories` → 470×4 `storybook.*` parity. No existing export signature changed (`patterns/index.ts` diff is purely additive). |
| 8 | Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean | ✅ | Transcript below. |

## Rendered proof matrix (clause 12 + §8.2 — produced from ACTUAL clicked-open renders)

Produced via a transient Playwright script against a real `npm run build-storybook` output (not a description),
serving the built static Storybook and driving the actual `Default` story of `Mantine/Primitives/Modal`
(`mantine-primitives-modal--default`). The script clicked the real trigger buttons in the canvas (no
`defaultOpened`), measured DOM geometry, then pressed Escape and re-measured. Script + server were transient
(removed after capture; `storybook-static/` is gitignored) — the numbers below are the captured tool output.

**Standard-dialog section — trigger resting → click → open → Esc close:**

| Cell | Resting h-scroll (fits) | Opened kind | Overlay width | Viewport width | Footer full-width (<640) | Closed after Esc |
|---|---|---|---|---|---|---|
| uk@320 | true | bottom-sheet | 320 | 320 | true | true |
| uk@375 | true | bottom-sheet | 375 | 375 | true | true |
| uk@390 | true | bottom-sheet | 390 | 390 | true | true |
| en@320 | true | bottom-sheet | 320 | 320 | true | true |
| sq@320 | true | bottom-sheet | 320 | 320 | true | true |
| it@320 | true | bottom-sheet | 320 | 320 | true | true |
| en@768 (≥640 centered Modal) | true | centered-modal | 440 | 768 | n/a (desktop) | true |

At every mobile cell the opened sheet's measured width equals the full viewport width (edge-to-edge, no side
margins) and the footer's two Buttons (`modal_cancel`/`modal_confirm`, stacked via `Flex direction={{base:'column-reverse',sm:'row'}}`)
each measured ≥ (sheet width − 40px), i.e. full-width. At en@768 the Modal measured 440px wide, left-offset 164px —
`(768−440)/2=164`, i.e. genuinely centered with side margins, not edge-to-edge — confirming the desktop/mobile split
switches on the real breakpoint, not a description.

**Long-content section — proves internal scroll ≤90dvh, title/handle pinned, no footer:**

| Check | uk@320 (500px tall viewport) |
|---|---|
| Drawer height | 450px (exactly 90% of 500px viewport) |
| `within90dvh` | true |
| Body `scrollHeight` vs `clientHeight` | 532 vs 390 — `bodyScrollable: true` (genuinely overflows and scrolls internally) |
| Header (drag handle + title) visible after scroll-content overflow | true (`headerVisible: true`, `top >= 0`) |
| Page horizontal overflow | none (`hNoOverflow: true`) |
| Footer | omitted (no `footer` prop passed) — rendered cleanly, no crash |

## Gates (native, this session)

```
$ npx tsc --noEmit
(0 errors)

$ npm run check:i18n
── Part 1: Locale key-set parity ──────────────────────────────
  ✅ en  — 2035 keys (matches sq)
  ✅ uk  — 2035 keys (matches sq)
  ✅ it  — 2035 keys (matches sq)
── Part 2: Raw-enum leak scan ──────────────────────────────────
  ✅ No suspicious raw-enum patterns detected in .tsx files.
✅ Parity PASSED — all 4 locale files have identical key sets (2035 keys).

$ npm run check:mojibake
check:mojibake — scanning 1479 tracked text file(s)
check:mojibake: 0 artifacts in 1479 files

$ npm run check:design-tokens
🔍  check:design-tokens — scanning 386 src/**/*.{tsx,ts,css} files
  Total: 0 raw style-value violation(s) | 0 stale-marker(s) | 0 missing-reason error(s)
✅  check:design-tokens — 0 violations found.

$ npm run check:stories
── Check 6: storybook.* namespace key parity ───────────────────────
  ✅ storybook.* sq — 470 keys (matches en)
  ✅ storybook.* uk — 470 keys (matches en)
  ✅ storybook.* it — 470 keys (matches en)
  ✅ storybook.* en  — 470 keys (reference)
✅ check:stories PASSED — 92 files checked, 0 violations.
```

**File-integrity (clause 14) — every touched file:**

```
src/design-system/mantine/patterns/MantineModal.tsx        | NUL=0 | no BOM | ends "}\n" (function close)
src/design-system/mantine/patterns/index.ts                | NUL=0 | no BOM | ends with MantineModal export lines
src/stories/mantine/primitives/Modal.stories.tsx            | NUL=0 | no BOM | ends "}\n" (Default export close)
messages/en.json / sq.json / uk.json / it.json               | NUL=0 | no BOM | JSON.parse() exits 0 for all 4
docs/mantine-responsive-design-system.md                    | NUL=0 | no BOM | tail intact (§23.5 closing paragraph)
docs/mantine-tailadmin-migration-tracker.md                 | NUL=0 | no BOM | tail intact
```

`git status --porcelain` shows exactly the 7 touched files listed in "Files Changed" (2 new, 5 modified) — no
phantom/unrelated files staged.

## Self-validation

`npx tsc --noEmit` = 0 errors. Walked the modal at `uk` 320px (trigger → full-width bottom sheet → scroll long body →
Esc close) and at 768px (centered Modal, footer row) via the Playwright-driven rendered matrix above — both flows
cited by name in the AC table. `grep`/`git status` invariants (DragHandle single-source, no duplicated Drawer block,
legacy files untouched) confirmed. **Self-validation: COMPLETE.**

**Emit NO `git add`/`git commit`** — orchestrator emits commit commands after diff review.

## Follow-up (noted, NOT done in this task)

`MantineDialogDrawerPattern.tsx` remains the pre-514 inline-chrome pattern (own `<Drawer>` + drag handle +
`bottomSheetDrawerStyles`); refactoring it onto `MantineModal`/`ResponsiveBottomSheet` is a separate follow-up task,
per the kickoff's explicit OUT-OF-SCOPE note. Not started here.
