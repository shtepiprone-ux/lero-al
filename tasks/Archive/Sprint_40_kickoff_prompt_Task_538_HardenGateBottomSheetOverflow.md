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

## 🔴 SCOPE EXPANSION (2026-07-04 — Sonnet finding + orchestrator decision)

Sonnet correctly STOP-and-ASKed: the Layer-1 downgrade fix above is right (marker `.mantine-Drawer-body`; swipe surfaces
keyed on `data-scrollbars="x"/"xy"`; root cause = `overflow-y:auto` forcing `overflow-x` to compute `auto`), but it is
**inert and unprovable on its own** because there is a SECOND, deeper blind spot: `checkGeometryIntegrity`'s candidate
discovery (`INTERACTIVE_SELECTOR`) is scoped to `#storybook-root`, while Mantine Drawer/Select/etc. render their
bottom-sheet content via a **React portal appended OUTSIDE `#storybook-root`**. Proven: on an opened
`Mantine/Primitives/Select/Default` mobile sheet, `document.querySelectorAll('#storybook-root button').length === 0`
though 7 real buttons exist. So bottom-sheet content is not downgraded — it is **totally invisible**, and AC1's
planted-violation hard-FAIL cannot be produced.

**Decision (orchestrator): proceed — widen candidate discovery, NARROWLY, in this task.** Rationale: without it Task 538
delivers an unprovable inert change and we'd need the widening task anyway; folding it in is the minimal change that makes
538's stated goal real. Still gate-tooling only — no product code.

**Constraints on the widening (keep the blast radius small):**
1. **Scope the new selector to `.mantine-Drawer-body` ONLY** (the bottom-sheet body) — do NOT globally discover all
   portaled content (tooltips, desktop dropdowns, modals). Include `button`, `[role="button"]`, `[role="option"]`,
   `[role="menuitem"]`, `a[href]`, `input` under `.mantine-Drawer-body`. This exposes exactly the bottom-sheet content
   538 cares about and nothing else.
2. **Only HORIZONTAL clip/offscreen inside the sheet hard-FAILs.** The bottom sheet's LEGITIMATE vertical scroll —
   content below the fold reachable by vertical scrolling (`overflow-y:auto`, ≤90dvh) — must stay CLEAN (no false FAIL);
   this is the vertical analog of the accepted horizontal-swipe downgrade. A long `Select` option list scrolling
   vertically must NOT flood the gate with offscreen violations.
3. **Genuine swipe carousels (Tabs/SegmentedControl) are unaffected** — they are not `.mantine-Drawer-body` content, so
   the narrow scoping leaves their accepted-ambiguous cells untouched.
4. **🛑 GUARD — do NOT balloon into product fixes.** After widening, run the full native `screenshots:assert
   -- --mantine-only`. If it surfaces NEW findings on REAL (non-planted) overlay bottom-sheet stories
   (Select/Combobox/DropdownMenu/NavigationMenu/Drawer/Modal): **STOP and report them to the orchestrator — do NOT
   "fix" any product story, and do NOT silently allowlist/exempt them.** The orchestrator triages each: a real product
   defect → a separate product follow-up task; a genuine gate false-positive → a documented exemption. Only the planted
   overflow (the intended test) should hard-FAIL by your hand this task; incidental newly-visible findings are surfaced,
   not resolved here.

### Second finding + decision (2026-07-04 — element-overlap false-positive)

The widened discovery surfaced 16 new FAILs (Combobox/Default ×12, Drawer/Default ×4), ALL one benign false-positive
class: Check 4 (element-overlap) now pairs an opened overlay's own content against BACKGROUND page elements sitting
BEHIND the overlay's opaque backdrop (Combobox/Default stacks 7 sections → 6 closed sections' inputs sit under the opened
sheet; Drawer/Default's full-bleed trigger sits under the opened panel's footer). DOM says they overlap; a human never
sees it (the backdrop covers them). Reproducible byte-identical ×4 — not flaky, not a product defect. **Decision: add the
targeted exemption (Option 1) — downgrade to `ambiguous`, NOT a hard FAIL, NOT a silent skip.** This is the generalization
of the check's EXISTING `popup-over-trigger → ambiguous` rule. Requirements:
- Fire ONLY across the overlay boundary: `isInsideOverlayBody(a) !== isInsideOverlayBody(b)` → `ambiguous` (reason:
  "background page content behind an opened overlay's backdrop"). 
- **A real collision where BOTH elements are inside the overlay body still hard-FAILs** (do not over-exempt); two
  background elements (both outside) still hard-FAIL as normal.
- Document this class in `docs/storybook-governance.md` §14.9.x with the two rect proofs. Do NOT change the Combobox/Drawer
  stories (the stacking is a story artifact, correctly handled at the gate layer, not by editing product stories).
- Net result target: `screenshots:assert -- --mantine-only` back to 0 FAIL, with the planted overflow still the one
  intended hard-FAIL in its transcript, and these 16 as documented `ambiguous`/benign.

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
