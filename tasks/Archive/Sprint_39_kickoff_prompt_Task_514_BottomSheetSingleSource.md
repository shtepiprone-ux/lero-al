# Task 514 — Extract the bottom-sheet chrome into ONE foundation source (Batch C dedup)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → Batch C overlays. **Type:** UI / design-system
> **refactor (single-source consolidation) — owner P0 "stop spawning duplicate components" (2026-06-30).**
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews diff + rendered proof that BOTH Select and Popover render
> pixel-identically after the refactor).
>
> **Pure refactor — ZERO rendered/behavior change.** Select and Popover must look and behave EXACTLY as they do now
> (Tasks 510 + 513, both owner-approved). The only change is WHERE the shared bottom-sheet pieces live.

## Why this task (root-cause)
The Task 509 dropdown→bottom-sheet foundation (`useResponsiveDropdown`, `bottomSheetDrawerStyles`) currently lives
**inside a consumer** — `src/design-system/mantine/patterns/MantineSelect.tsx` — and its `DragHandle` is **private**.
So Task 513's `MantinePopover.tsx` had to **re-replicate `DragHandle`** (line 10, duplicate of `MantineSelect.tsx:50`)
and re-build its own `<Drawer>` block. Every remaining Batch C overlay (P1.19 DropdownMenu · P1.20 NavigationMenu ·
P1.22 Tooltip) will copy the SAME handle + drawer block unless the shared chrome becomes a real single source NOW.
This is exactly the duplicate-component sprawl the owner is eliminating.

## Pre-read (UI / refactor — from `docs/rule-index.md`)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (**SCAN — Select is used in
admin/listing filters; this is a pure UI refactor with no behavior change, but if a Select-consuming flow has a registry
row, the existing Select story rendered proof is the regression evidence that the refactor preserved behavior**).
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` — §7 mobile gate, §12 patterns, **§18 Mantine CSS
pitfalls**, **§19 (canonical Select) + §20 (canonical Popover) — the two consumers being refactored**. Then
`docs/ui-rules.md`, `docs/component-rules.md` (canonical-first / no-duplicate-class, Task 426), `docs/qa-rules.md`,
`docs/storybook-governance.md`.
**Study before coding:** `src/design-system/mantine/patterns/MantineSelect.tsx` (foundation exports + private
`DragHandle` L50 + its `<Drawer>` block ~L188), `src/design-system/mantine/patterns/MantinePopover.tsx` (duplicate
`DragHandle` L10 + its `<Drawer>` block ~L113), `src/design-system/mantine/patterns/index.ts` (barrel),
`src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` (the P0 treatment).

## Scope (exactly this — no more)
1. **Create ONE foundation module** for the responsive dropdown / bottom-sheet chrome, e.g.
   `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` (Sonnet picks the name; document it), housing:
   - `useResponsiveDropdown` (moved from `MantineSelect.tsx` — the hook),
   - `bottomSheetDrawerStyles` (moved — the styles object),
   - `DragHandle` (ONE definition — the centered 2.5rem/0.25rem gray-3 grabber),
   - a reusable **`ResponsiveBottomSheet`** wrapper component encapsulating the canonical P0 `<Drawer position="bottom">`
     (edge-to-edge, top-only radius, `DragHandle` + optional title header, ≤90dvh internal scroll, `returnFocus`,
     backdrop tap + Esc close, `withCloseButton={false}`, `styles={bottomSheetDrawerStyles}`) — props at minimum
     `opened`, `onClose`, `title?`, `children`.
2. **Refactor `MantineSelect.tsx`** to import `useResponsiveDropdown`/`bottomSheetDrawerStyles`/`DragHandle` from the new
   module and render its mobile sheet via `ResponsiveBottomSheet` — deleting its local `DragHandle` and inline `<Drawer>`
   block. **Rendered output identical.**
3. **Refactor `MantinePopover.tsx`** likewise — delete its replicated `DragHandle` (L10) and inline `<Drawer>` block,
   consume `ResponsiveBottomSheet`, and import the hook from the new module (not from `./MantineSelect`).
4. **Preserve every existing import path** (Note 14 global-change rule): if any other file imports
   `useResponsiveDropdown`/`bottomSheetDrawerStyles` from `'./MantineSelect'` or the barrel, either (a) update all call
   sites to the new module, OR (b) keep a thin re-export from `MantineSelect.tsx`/barrel so nothing breaks — **grep first,
   then choose; no dangling import.** Update `index.ts` to export the new module's public API.
5. **Docs:** update `mantine-responsive-design-system.md` §19 + §20 to point the foundation at the new shared module
   (single source); no new behavior claims.

**OUT OF SCOPE:** any rendered/behavior change to Select or Popover; new overlays (DropdownMenu/NavigationMenu/Tooltip —
they consume this later); `MantineDialogDrawerPattern`; product surfaces; new i18n keys (none needed — pure refactor).

## 🔴 STOP-and-ASK triggers (do NOT invent architecture)
- If extracting/moving the hook or styles changes the rendered Select or Popover output in ANY way (sheet size, handle,
  radius, scroll, focus, anchored desktop dropdown) → **STOP and ASK.** This task is forbidden from changing pixels.
- If `ResponsiveBottomSheet`'s prop shape can't cover both consumers' current `<Drawer>` usage without behavior drift →
  **STOP and ASK** before adding consumer-specific branches.
- If a consumer outside these two files imports the foundation from `'./MantineSelect'` and you're unsure whether to
  re-export or update call sites → **STOP and ASK** (do not leave a broken import).

## Current behavior to preserve (BOTH consumers — pixel-identical)
- **Select** (Task 510): anchored dropdown ≥640 with §6d chrome; full-width bottom sheet <640 (handle, ≤90dvh, etc.);
  disabled whole-control fade; long-uk wrap. Identical before/after.
- **Popover** (Task 513): uncontrolled anchored Popover ≥640; span-onClick→`openDrawer()` full-width bottom sheet <640;
  disabled no-op; backdrop+Esc close, returnFocus. Identical before/after.
- `DragHandle` visual (2.5rem × 0.25rem, gray-3, centered, 0.5rem bottom padding) unchanged.

## Required after-behavior
`DragHandle` exists in exactly ONE file (the new foundation module). Both consumers render their mobile sheet through the
shared `ResponsiveBottomSheet`. `grep -rn "function DragHandle" src/design-system/mantine` returns exactly ONE match. No
inline `<Drawer position="bottom">` block remains in `MantineSelect.tsx` or `MantinePopover.tsx` (both go through the
wrapper). Rendered output of both stories is unchanged.

## Positive flow (the two consumer flows must still work end-to-end)
- **Select <640:** tap trigger → bottom sheet opens (handle, options, ≤90dvh) → tap option → sheet closes, value set, focus
  returns. **≥640:** anchored dropdown. Identical to Task 510.
- **Popover <640:** tap trigger → bottom sheet opens (handle, title, content) → backdrop/Esc closes, focus returns.
  **≥640:** anchored popover. Identical to Task 513.

## Negative flow
- **Disabled** (both): trigger is a no-op; no sheet/popover; no focus ring — unchanged.
- **Esc / backdrop** (both): closes the sheet, no commit, focus returns to trigger — unchanged.
- **SSR/first paint:** `isMobile=false` first render → desktop path; sheet only mounts post-hydration; no flash — unchanged.
- **Broken import after the move:** any file importing the foundation from the old path must still resolve (re-export shim
  or updated call site) — `tsc=0` proves it; a dangling import = TASK FAILURE.

## 🔴 Mobile <640 full-width gate
Unchanged from Tasks 510/513 — the shared `ResponsiveBottomSheet` IS the canonical full-width edge-to-edge bottom sheet
(top-only radius, drag handle, ≤90dvh internal scroll, ≥44px rows, backdrop+Esc, long sq/en/uk/it wrap, no h-scroll@320).
The refactor must not weaken any of it.

## 🔴 Zero hardcode / canonical-first (Task 426)
The whole point is single-source: after this task NO `DragHandle` / bottom-sheet `<Drawer>` block is duplicated across the
design system. No raw colors/strings; the bottom-sheet px exemptions (handle 2.5rem/0.25rem, 90dvh, 2.75rem touch) live
ONCE in the foundation. `check:design-tokens` + ESLint green.

## Rendered proof matrix (clause 12 — MANDATORY: prove NO regression on BOTH consumers)
Two matrices (Select + Popover), each: rows = the consumer's states (Select: resting · clicked-open · disabled · long-uk;
Popover: trigger · clicked-open · disabled); columns = **uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320**. Each <640
clicked-open cell: full-width bottom sheet identical to the pre-refactor render (handle, ≤90dvh, no h-scroll, ≥44px). Each
≥640 cell: anchored dropdown/popover unchanged. **Produced from actually-clicked-open overlays (§8.2 — no `defaultOpened`).**
`tsc=0`/gates are a BASELINE, never proof.

## Acceptance criteria
1. New foundation module exists; houses `useResponsiveDropdown` + `bottomSheetDrawerStyles` + ONE `DragHandle` + `ResponsiveBottomSheet`. *(Scope 1)*
2. `grep -rn "function DragHandle" src/design-system/mantine` = exactly ONE match; no inline `<Drawer position="bottom">` left in `MantineSelect.tsx`/`MantinePopover.tsx`. *(Required after-behavior; Negative flow)*
3. Select renders pixel-identical to Task 510 (anchored ≥640 / sheet <640 / disabled / long-uk) — rendered matrix. *(Positive/Negative flow; clause 12)*
4. Popover renders pixel-identical to Task 513 (trigger / clicked-open / disabled) — rendered matrix. *(Positive/Negative flow; clause 12; §8.2)*
5. All foundation import paths resolve (re-export shim or updated call sites; grep clean); barrel updated; `tsc=0`. *(Scope 4; Negative flow → broken import)*
6. Docs §19/§20 point at the new single-source module. *(Scope 5)*
7. Zero hardcode; no new i18n keys; locale parity unchanged (2010×4); `MantineDialogDrawerPattern` untouched. *(canonical-first; clause 7)*
8. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean (clause 14) — paste the transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit (each AC → file:line OR runtime step → ✅/❌); walk BOTH the Select
and Popover flows at `uk` 320px end-to-end and confirm the render is unchanged before writing "complete". Update
`docs/backlog.md` + add `docs/sessions/2026-06-30-task514-bottom-sheet-single-source.md` with a **Files Changed table** +
both clause-12 rendered matrices. **Emit NO `git add`/`git commit`** — the orchestrator emits commits after diff review.
