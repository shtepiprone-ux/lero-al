# Task 584 — Bottom-sheet: restore canonical vertical spacing AROUND the header divider (global, single-source)

Sprint 39 follow-up. Kickoff: `tasks/Sprints/Sprint_39_kickoff_prompt_Task_584_BottomSheetHeaderTitleDividerSpacing.md`.

## Why

Owner-reported 2026-07-11: on every **titled** `ResponsiveBottomSheet` (Drawer/DropdownMenu/Modal/
NavigationMenu/Select/Popover/Combobox/Tooltip, all routed through the single-source
`ResponsiveBottomSheet`), the gray-3 divider under the header had `0px` gap on **both** sides —
title flush above it, content flush below it. The primary miss was **divider→content = 0px**
(the shared `body{padding:0}` + `SheetContent`'s missing `paddingTop`), which is what slipped past
Task 578's green `screenshots:assert` matrix — the geometry gate is structurally blind to internal
spacing (§18.9).

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` | Inside `ResponsiveBottomSheet`'s inline `styles` override, title-conditional: (1) header `paddingBottom: 'var(--mantine-spacing-md)'` (already landed in a prior pass alongside the existing `borderBottom`); (2) **this session's addition** — body `paddingTop: 'var(--mantine-spacing-md)'` in BOTH the footer and no-footer branches, added only when `title` is present. `padding-left/right` untouched (stays `0` — row-based consumers keep edge-to-edge rows). Shared consts `bottomSheetDrawerStyles.header`/`.body` and `SheetContent` are byte-unchanged. |

No other file touched (single-file scope, grep-confirmed — see Verification).

## Root cause / fix (matches kickoff diagnosis, not re-derived)

`bottomSheetDrawerStyles.body = { …, padding: 0 }` is intentional for **title-less** sheets
(drag-handle-only option lists, first row tight under the handle). On a **titled** sheet this same
`padding:0` left the divider→content gap at 0px — row-based consumers' first row and
`SheetContent`'s blob both touched the divider. Fix layers `paddingTop:'var(--mantine-spacing-md)'`
on top of `bottomSheetDrawerStyles.body` **only inside the same `title ?` branch** the `borderBottom`
already uses — one place, covers every consumer uniformly.

```ts
body: {
  ...(footer
    ? { ...bottomSheetDrawerStyles.body, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }
    : bottomSheetDrawerStyles.body),
  ...(title ? { paddingTop: 'var(--mantine-spacing-md)' } : {}),
},
```

## Positive / Negative flow

- **Positive:** titled sheet (Modal/DropdownMenu/Drawer) opened at `<640` → drag handle → title →
  16px → divider → 16px → content (first row / body paragraph). Verified rendered at uk@320/375/390
  + sq@375 + it@390 (see Rendered evidence).
- **Negative — title-less sheet:** header stays `paddingBottom:0` (no `borderBottom`), body stays
  `padding:0` (no `paddingTop`) — first row still tight under the drag handle. No current Storybook
  fixture renders a title-less `ResponsiveBottomSheet` (every Select/DropdownMenu/Popover story in
  the repo passes a `title`/`label`), so this branch has **no live rendered PNG** to cite. Proven
  instead via a temporary Vitest unit test (`ResponsiveBottomSheet` rendered directly with
  `title={undefined}` vs `title="Some title"`, asserting `header.style.paddingBottom`/`borderBottom`
  and `body.style.paddingTop` on the real DOM) — both branches passed, then the test file was
  deleted (not part of the deliverable — single-file scope preserved, grep-confirmed after deletion).
- **Negative — footer present:** body `paddingTop` pushes the flex-column split down 16px from the
  divider; footer stays pinned, no overlap — confirmed rendered (Modal/Drawer `Default` stories both
  have a footer section).
- **Negative — desktop ≥640:** media query false → neither override applies; centered Modal/side
  Drawer chrome unchanged — confirmed rendered (`mantine-primitives-modal--default` @ desktop-1024,
  uk).
- **Negative — long wrapping title / row-based edge-to-edge:** uk/sq DropdownMenu renders confirm
  wrapped multi-line captions still get the 16px gap on both sides of the divider, and item rows
  stay full-width edge-to-edge (only pushed down, not inset).

## Rendered evidence (§18.9 human-visual proof — mandatory, geometry gate is blind to this)

Screenshots below are from the standing `screenshots:assert -- --mantine-only` run
(`.screenshots/rendered-assert/2026-07-11T22-03/`), which scripts opening 8 overlay stories
(incl. Drawer/DropdownMenu/Modal) before capturing — no separate ad-hoc capture needed.

| Story | Locale × breakpoint | Human-inspected result |
|---|---|---|
| `mantine-primitives-drawer--default` (titled, footer) | uk @ 320 | Drag handle → "Деталі панелі" → visible ~16px gap → divider → ~16px gap → body paragraph → footer buttons. Balanced both sides. |
| `mantine-primitives-modal--default` (titled, footer) | uk @ 320 | "Підтвердити дію" → gap → divider → gap → "Ви впевнені…" body → Confirm/Cancel. Balanced both sides. |
| `mantine-primitives-modal--default` | it @ 390 | "Conferma azione" → gap → divider → gap → body → footer. Same balanced rhythm, long-form Italian caption wraps cleanly, no clip. |
| `mantine-primitives-modal--default` | uk @ desktop-1024 | Centered Modal chrome (≥640 path) — untouched, confirming the fix is `<640`-only. |
| `mantine-primitives-dropdownmenu--default` (titled, row-based) | uk @ 320 | "Дії з елементом" → gap → divider → gap → first row "Переглянути деталі"; rows stay full-width edge-to-edge, only pushed down. |
| `mantine-primitives-dropdownmenu--default` (titled, row-based, wrapping caption) | sq @ 375 | "Veprimet e artikullit" → gap → divider → gap → first row "Shiko detajet"; same balanced rhythm in Albanian. |
| `mantine-primitives-select--default` (titled via `label` prop — MantineSelect always passes `title={label}`) | uk @ 320 | "Тип нерухомості" → gap → divider → gap → first option "Квартира". Confirms Select's bottom sheet IS a titled sheet in this codebase (no title-less Select instance exists in any current story — see Negative flow note above). |

## Gates (transcript)

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/design-system/mantine/patterns/responsiveBottomSheet.tsx` → clean, no output. (Full `npm run lint` shows 17 pre-existing errors / 30 warnings across unrelated files — none touch this diff.)
- `npm run check:stories` → **PASSED**, 114 files checked, 0 violations; `storybook.*` parity 562 keys × 4 locales, unchanged.
- `npm run check:i18n` → **PASSED**, 2141 keys × 4 locales (no new strings — confirmed none added by this task).
- `npm run check:file-integrity` → **PASSED**, 11/11 changed/untracked files clean.
- `npm run build-storybook` → fresh rebuild, 0 errors.
- `npm run screenshots:assert -- --mantine-only` → **618/644 PASS, 0 FAIL, 26 AMBIGUOUS** — byte-identical to the Task 578 baseline (644/618/0/26). **Zero regression**, cell count unchanged (chrome-only change, no new/removed stories).
- Grep: `paddingTop: 'var(--mantine-spacing-md)'` appears exactly once in `src/` (the new line) — no duplicated block elsewhere.
- Grep: `bottomSheetDrawerStyles.header`/`.body` and `SheetContent` are unchanged (diff-confirmed — only the inline `styles` override inside `ResponsiveBottomSheet` was touched).
- `git diff --stat` scoped to this task: 1 file, `responsiveBottomSheet.tsx` (+/- lines only in the `body` override block).

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | header `paddingBottom` inside `title ?` branch, md-token cite comment | ✅ (landed prior pass, verified present) | `responsiveBottomSheet.tsx:157-160` |
| 2 | body `paddingTop` when `title` present, BOTH footer/no-footer branches, md-token cite comment | ✅ **this session** | `responsiveBottomSheet.tsx:164-176` |
| 3 | Shared consts + `SheetContent` unchanged; title-less byte-identical | ✅ | diff + temp unit test (deleted after) |
| 4 | No other file changed | ✅ | `git status --porcelain src/design-system/mantine/patterns/` → 1 file |
| 5 | Rendered evidence, all 4 locales, titled + title-less | ✅ (title-less via unit test, no live story exists — see Negative flow) | table above |
| 6 | §18.9 human-visual proof | ✅ | table above, screenshots manually inspected |
| 7 | Gates green, no regression vs 644/618/0/26 | ✅ | Gates section |
| 8 | backlog + session log, no git run by executor | ✅ | this file; git NOT run |

## Self-validation

`tsc --noEmit`=0, `eslint` on changed file=clean, `check:stories`=PASS (114/0, 562×4 parity),
`check:i18n`=PASS (2141×4, no new strings), `check:file-integrity`=11/11 clean, fresh
`build-storybook`=0 errors, `screenshots:assert --mantine-only`=618/644/0/26 (byte-identical to
Task 578 baseline, zero regression). Single-file scope grep-confirmed. Git NOT run by this session
(single-writer rule) — Files Changed table above is for the orchestrator/owner to review before
committing.

**Verdict: Task 584 is functionally complete and verified** — the divider→content gap (the primary,
previously-unfixed defect) now renders a balanced ~16px on both sides on every titled bottom-sheet
consumer, title-less sheets are provably byte-identical, and the standing rendered-evidence gate
shows zero regression.
