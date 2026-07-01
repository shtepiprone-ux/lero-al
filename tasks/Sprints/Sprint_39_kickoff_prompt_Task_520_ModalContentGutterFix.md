# Task 520 — GLOBAL corrective: Mantine overlay content-gutter + canonical button font (Task 519 rework)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → Batch C overlays (P1.16 + all sheet consumers).
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus.
> **Origin:** Owner render review of `Mantine/Primitives/Modal → Default` (275px / en / Light, 2026-07-01) surfaced two
> P0 STYLE defects that Task 519's code review missed. **Owner directive: fix GLOBALLY, not only in Modal.stories.**
> Task 519's feature commit was NOT run; it is superseded by this task.

## The two defects (owner-confirmed) — both are GLOBAL, not one-story
**Defect A — bottom-sheet content bleeds to the sheet edges (no gutter).** At <640 the opened sheet renders the title
inset but body/footer content flush to the sheet's left/right borders. Root cause: `responsiveBottomSheet.tsx` sets
`body: { padding: 0 }` (intentional — `MantineSelect` needs edge-to-edge option rows), so EVERY text/button consumer of
`ResponsiveBottomSheet` must supply a content gutter — and none of them do. Affected consumers (all consume the same
foundation): `MantineModal`, `MantinePopover`, `MantineDropdownMenu`, `MantineNavigationMenu`.

**Defect B — oversized Mantine button font (18px), violates the style reference.** `Modal.stories.tsx:37,45` uses
Mantine `size="lg"` (18px). `docs/tailadmin-style-reference.md` §6 Density Correction (owner P0, Task 492) mandates the
canonical Mantine Button = **`size="sm"` (14px) + 44px min-height** (already in `theme.ts`); §2 type scale = buttons are
theme-sm 14px. The 18px is an off-scale override. This recurs across Mantine consumers, at least: `Modal.stories.tsx`,
`Card.stories.tsx:34`, `MantineDialogDrawerPattern.tsx:113,122` (and any other Mantine `Button size="lg"|"xl"`).

## Pre-read
**Always:** `docs/agent-contract.md` (clauses 11–12), `docs/backlog.md`, `docs/critical-flow-registry.md` (SCAN —
primitives + stories + a gate only, no product/auth/RLS surface → no registry row; confirm in log).
**🔴 STYLE SOURCE OF TRUTH (verify against, do NOT infer):** `docs/tailadmin-style-reference.md` — **§2** type scale
(buttons theme-sm 14px), **§6 + §6 Density Correction (Task 492): Mantine Button = `size="sm"` 14px + 44px**, **§6i**
canonical sheet content gutter (`px: md` = 16px). Every value this task sets MUST map to a token/row here.
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` §7 (mobile gate), §8.1 (page-gutter), §8.2, §18
(CSS pitfalls), §19/§20 (foundation + Popover), §23 (Modal). Then `docs/ui-rules.md` §15a, `docs/component-rules.md`
(canonical-first + Note-14 global-change), `docs/qa-rules.md`, `docs/storybook-governance.md`.

## 🔴 Global-change rule (Note 14) governs this task
This is a canonical-source fix. Do NOT patch a single story. Fix Defect A at the shared foundation so ALL overlay
consumers inherit ONE gutter; fix Defect B by removing every off-scale Mantine Button override AND adding a gate so it
cannot regress. Leave NO diverging call site. Grep proof of zero remaining offenders is an acceptance criterion.

## Scope
### 1. Defect A — canonical content gutter for text/button sheet consumers (ONE source)
`responsiveBottomSheet.tsx` body stays `padding:0` (Select option rows need it). Add a **canonical padded content
wrapper** as the single source of the gutter, consumed by every text/button overlay — do NOT re-add `px` per story.
Choose ONE of these and state which in the session log (STOP and ASK if unsure):
- (a) an exported `SheetBody`/`padded content` wrapper (Mantine `Box`/`Stack` with `px="md"` + `pb="md"` per §6i) that
  `MantineModal`/`MantinePopover`/`MantineDropdownMenu`/`MantineNavigationMenu` wrap their content in; OR
- (b) an opt-in `padded` prop on `ResponsiveBottomSheet` (default preserving current behavior so `MantineSelect` is
  untouched) that applies the §6i `px="md"` content padding.

Then update **every** text/button consumer (`MantineModal`, `MantinePopover`, `MantineDropdownMenu`,
`MantineNavigationMenu`) to use it, so body + footer align with the title. `MantineSelect` option-row rendering stays
edge-to-edge (unchanged). Gutter value = `md` (16px) per §6i — token only, no raw px.

### 2. Defect B — remove off-scale Mantine Button font, add enforcement gate
- **Remove** every Mantine `Button` `size="lg"`/`size="xl"` text override in `src/design-system/mantine/**` and
  `src/stories/mantine/**` (start from this inventory; grep for the complete set): `Modal.stories.tsx:37,45`,
  `Card.stories.tsx:34`, `MantineDialogDrawerPattern.tsx:113,122` (+ any others). Replace with the canonical default
  (no `size` → sm/14px/44px per §6 Density Correction). Confirm variants still match §6 (filled brand / outline gray).
- **NOT in scope / exempt:** `size="lg"|"xl"` on Mantine `Text`, `Badge`, `Loader`, `Title`, and icon-only `ActionIcon`
  (e.g. `MantineListingCardPattern.tsx:79` favorite icon = 44px touch target) — those are not the button-font defect;
  list each exemption in the log. **Legacy shadcn `Button` (`src/components/ui/**`, `modules/**`) uses a DIFFERENT size
  scale where `size="xl"`=44px is correct and is being retired by the migration — do NOT change it in this task**
  (flag it, do not touch).
- **Add a gate:** extend `scripts/check-stories.mjs` (or the nearest existing Mantine story/pattern gate) to FAIL on
  Mantine `Button size="lg"|"xl"` in `src/stories/mantine/**` + `src/design-system/mantine/patterns/**` (allow an
  explicit inline `// @allow-button-size <reason>` escape hatch for a justified exception). Include a planted-violation
  transcript proving the gate fails, then reverts clean. This is what makes the fix GLOBAL and regression-proof.

### 3. Stories + docs
- `Modal.stories.tsx`: remove its ad-hoc body `<Box px=…>` (padding now owned by the foundation wrapper), drop the
  `size="lg"` buttons. Keep Mantine-proof-path compliance (`skipCanvas`, `fullscreen`, Default-only, real-click open,
  no `defaultOpened`, `storyT()`).
- Update `docs/mantine-responsive-design-system.md` §19/§20/§23 to document the canonical padded sheet content wrapper
  and that Mantine overlay buttons use the canonical default size. No new i18n keys expected; if any, sq/en/uk/it parity.
- No tracker status change (P1.16 stays ✅, now rendered-correct).

## Secondary — content-hug / empty-space
Reproduce the large empty region below the footer at 275px. Determine if it also reproduces on Popover/DropdownMenu/
NavigationMenu sheets. If yes → shared-source issue, **STOP and report** (do not edit `responsiveBottomSheet.tsx`
mechanics); if Modal-specific → fix within `MantineModal`. Any fix needing `responsiveBottomSheet.tsx` open/close/Drawer
mechanics → **STOP and ASK.**

## STOP-and-ASK triggers
- Any change to `responsiveBottomSheet.tsx` open/close/DragHandle/Drawer mechanics or its `body:{padding:0}` (the
  gutter must be an ADDITIVE wrapper/opt-in, not a change to Select's edge-to-edge behavior).
- If a single-source gutter or the button gate cannot be done without a raw px / off-scale token.
- If removing a Button `size` override changes a control below 44px (it must not — the canonical default is 44px).

## Current behavior to preserve
- `MantineSelect` option rows stay edge-to-edge (its sheet content unchanged).
- `responsiveBottomSheet.tsx` open/close/DragHandle mechanics unchanged; `grep "function DragHandle"` = ONE match.
- Legacy `dialog.tsx`/`dialog.stories.tsx` + legacy shadcn buttons unchanged.
- All overlay public APIs unchanged (`MantineModalProps` etc.) — this is a rendering + governance fix.

## Positive / Negative flows
- **Positive:** open any Mantine overlay with content → title/body/footer share one 16px gutter; footer buttons
  full-width within the gutter at 14px/44px; ≥640 desktop form unchanged. Backdrop/Esc close, focus returns.
- **Negative:** no-footer render clean; long uk wraps, no h-scroll@320; SSR closed no flash; the button gate FAILS on a
  planted `size="lg"` and passes after revert.

## 🔴 Rendered proof (MANDATORY — code review is NOT sufficient; this is why 519 failed)
Capture ACTUAL opened renders at **uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320 · en@768** for **every affected
overlay story** (Modal + Popover + DropdownMenu + NavigationMenu). Each cell must SHOW: content inset to one 16px gutter
(NOT edge-to-edge), footer/buttons full-width within the gutter, **button label ≈14px (NOT 18px)**, long uk wrapping, no
h-scroll@320, sheet hugging content. Attach images/geometry. `tsc=0`/gates are BASELINE, never style proof.

## Acceptance criteria
1. Canonical padded sheet content wrapper exists (single source); `MantineModal`/`MantinePopover`/`MantineDropdownMenu`/
   `MantineNavigationMenu` all consume it; body+footer inset to §6i `md` (16px) gutter; verifiable in diff + rendered
   cells for ALL four overlays. `MantineSelect` option rows unchanged. *(Defect A; Note 14; clause 11)*
2. Zero Mantine `Button size="lg"|"xl"` remain in `src/stories/mantine/**` + `src/design-system/mantine/patterns/**`
   (grep proof); all use the canonical 14px/44px default; §6 variants intact. Non-Button `size` and icon-only ActionIcon
   exemptions listed. Legacy shadcn buttons untouched. *(Defect B; §6/§2; Note 14)*
3. Enforcement gate added (fails on Mantine overlay `Button size="lg"|"xl"`), with planted-violation FAIL + clean-revert
   transcript. *(Defect B; regression-proof)*
4. Empty-space fixed in `MantineModal` OR proven shared-source and reported. *(Secondary)*
5. `responsiveBottomSheet.tsx` mechanics + `MantineSelect` + legacy dialog UNCHANGED; DragHandle single-source; overlay
   APIs unchanged. *(canonical-first; Task 514 integrity)*
6. Rendered proof matrix present for ALL four overlays (7 cells each), showing the gutter + 14px buttons. *(clause 12)*
7. Docs §19/§20/§23 updated; locale parity intact if any keys change.
8. Gates green: `tsc=0`, `check:stories` (incl. new rule), `check:i18n`, `check:design-tokens`, `check:mojibake`;
   file-integrity clean — paste transcript.

## Self-validation & hand-off
`tsc --noEmit` → 0; AC-by-AC self-audit citing both flows; walk Modal + one other overlay at uk@320 and en@768. Files
Changed table + full rendered matrix in `docs/sessions/2026-07-01-task520-mantine-overlay-gutter-button-global.md`;
update `docs/backlog.md` Last Session. **Emit NO git** — the orchestrator emits commits after diff + rendered-proof
review (no approval from code alone this time).
