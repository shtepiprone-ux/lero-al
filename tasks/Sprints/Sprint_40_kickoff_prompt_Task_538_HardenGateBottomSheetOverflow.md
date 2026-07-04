# Task 538 — harden the rendered gate: hard-FAIL true clip/overflow INSIDE a bottom-sheet body

> **Sprint 40 / Epic MM. Owner P0.**
> **Executor:** Sonnet 4.6. **Type:** gate-tooling ONLY (`scripts/geometry-integrity.mjs`, possibly
> `scripts/check-stories-rendered.mjs`). **NO product code, NO consumer migration, NO primitive/theme/story change.**
> **Status:** OPEN. Independent of the primitive queue — can run any time.

## Why (root cause, orchestrator-confirmed)

`scripts/geometry-integrity.mjs` → `hasHorizontalScrollAncestor(el)` (currently ~lines 128–135) returns `true` when
**ANY** ancestor has `overflow-x: auto|scroll`. The offscreen-control check uses that to **downgrade** an offscreen
element from a hard `violation` to `ambiguous` (the "carousel/scroll-tabs — reachable by horizontal scrolling"
verdict). That is CORRECT for a genuine horizontal-swipe container (SegmentedControl / Tabs `ScrollArea scrollbars="x"`
— the accepted ambiguous cells in Tasks 529–542). But it is WRONG for a `ResponsiveBottomSheet` / Drawer bottom-sheet
body: a bottom sheet must only ever scroll **vertically** (≤`90dvh` internal), never horizontally. So a control that
is clipped / pushed offscreen horizontally INSIDE a bottom sheet is a REAL defect, yet today it is silently downgraded
to ambiguous and never fails the gate. Task 537 flagged this; every overlay primitive on the Task 514
`ResponsiveBottomSheet` foundation (`MantineSelect`, `MantineCombobox`, DropdownMenu, NavigationMenu, Popover…) shares
the blind spot — mobile-sheet full-width is currently proven only via native Playwright measurement, not the gate.

## Required after-behavior (define precisely, then implement)

The horizontal-scroll-ancestor downgrade must be **scoped to genuine horizontal-swipe containers only**:

1. **Inside a bottom-sheet body → horizontal offscreen/clip is a hard FAIL** (a `violation`, not `ambiguous`). Identify
   the bottom-sheet body by its stable single-source marker from Task 514 (`ResponsiveBottomSheet` /
   `bottomSheetDrawerStyles` — e.g. the `.mantine-Drawer-body` of a bottom-sheet Drawer, or a data-attribute the sheet
   already carries; read `responsiveBottomSheet.tsx` to pick the reliable one). Do NOT invent a marker the sheet does
   not render — if none is reliable, STOP and ASK.
2. **Genuine horizontal-swipe containers keep the ambiguous downgrade.** The downgrade fires ONLY when the horizontal
   scroll ancestor is an explicit swipe surface — a Mantine `ScrollArea` with horizontal scrollbars
   (`scrollbars="x"` / the `[data-scrollbars="x"]`-equivalent marker — verify the actual rendered attribute), i.e. the
   SegmentedControl / Tabs pattern. A bottom-sheet body is NOT such a surface.
3. **Legitimate internal VERTICAL scroll stays clean.** A bottom sheet scrolling vertically (`overflow-y:auto`, ≤90dvh)
   must NOT trip any new failure — only HORIZONTAL clip/offscreen inside the sheet is the target.
4. No change to any other bucket (text-clipped, element-overlap, etc.) or to non-sheet stories.

## Positive + Negative flow

- **Positive:** a control that fits within a bottom sheet renders clean (no false FAIL); SegmentedControl/Tabs swipe
  cells stay `ambiguous` exactly as today.
- **Negative:**
  - (a) A control planted to overflow horizontally INSIDE a `ResponsiveBottomSheet`/Drawer bottom sheet now produces a
    hard `violation` (offscreen/clip), NOT ambiguous — this is the whole point; prove it with a transcript.
  - (b) A bottom sheet with tall content scrolling vertically stays clean (no new FAIL from the vertical scroll).
  - (c) SegmentedControl `Default` + Tabs `Default` swipe-scroll cells remain `ambiguous`, not newly FAILing (regression
    guard — the fix must not re-fail the accepted swipe pattern).

## Pre-read (rule-index → Storybook / gate-tooling)

- `docs/agent-contract.md` (1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — gate-tooling only, no
  product flow; confirm).
- `docs/storybook-governance.md` §14 (+ §14.9 gate-limitation records — add a §14.9.x closing this blind spot).
- `docs/responsive-screenshot-governance.md` (§MQ machine-detection limits — this task narrows one such limit).
- `scripts/geometry-integrity.mjs` (the `hasHorizontalScrollAncestor` + offscreen-control logic being changed) +
  `scripts/check-stories-rendered.mjs` (how the buckets are consumed) + `src/design-system/mantine/responsiveBottomSheet.tsx`
  (the bottom-sheet marker to key on).
- `docs/mantine-responsive-design-system.md` §7 (mobile gate) + the Task 514 bottom-sheet contract.

## Gates to close

- A **planted-violation transcript**: horizontal overflow inside a bottom sheet → hard FAIL (the new capability),
  then reverted. AND a **regression transcript**: SegmentedControl/Tabs swipe cells still `ambiguous`, vertical-scroll
  sheet clean, full `screenshots:assert -- --mantine-only` back to the current 398/400-class baseline (0 new FAIL).
- `npx tsc --noEmit` (if any `.ts`), `node --check scripts/geometry-integrity.mjs`, `check:stories`, `check:i18n`,
  `check:file-integrity` green.
- No product/theme/story diff (grep-prove the diff is `scripts/**` + docs only).

## Acceptance criteria

1. Horizontal clip/offscreen inside a `ResponsiveBottomSheet`/Drawer bottom-sheet body = hard `violation` (proven by a
   planted-violation transcript); the marker used is a real single-source attribute the sheet renders (cited).
2. Genuine horizontal-swipe containers (SegmentedControl/Tabs `ScrollArea scrollbars="x"`) keep the `ambiguous`
   downgrade — swipe cells NOT newly FAILing (regression transcript).
3. Vertical-scroll bottom-sheet content stays clean.
4. Gate-tooling + docs only — zero product/theme/story change (grep-proven). `storybook-governance.md` §14.9.x records
   the closed blind spot.
5. Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git** — HELD for
   orchestrator review + commit emission.

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — orchestrator reviews the real diff + both transcripts, then emits the
explicit-path commit (`scripts/geometry-integrity.mjs` [+ `check-stories-rendered.mjs`] + `docs/storybook-governance.md`
+ session log + backlog). Owner runs it in PowerShell after the native run.
