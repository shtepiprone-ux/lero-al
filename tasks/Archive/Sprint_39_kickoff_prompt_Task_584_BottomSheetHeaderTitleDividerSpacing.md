# Task 584 — Bottom-sheet: restore canonical vertical spacing AROUND the header divider (global, single-source)

> **Sprint 39 follow-up (bottom-sheet foundation).** Owner-reported 2026-07-11 during the Task 578 review; **re-scoped 2026-07-11** after the first kickoff mislocated the defect.
> **Type:** UI / layout / component (Mantine). **Model:** Sonnet 4.6 executor.
> **Scope size:** ONE file (`responsiveBottomSheet.tsx`), two title-conditional style properties. Do NOT expand.

## ⚠️ Re-scope note (read first)

The **primary** defect is the **`0px` gap BELOW the divider — between the divider and the sheet content.** The desired header rhythm on every titled bottom sheet is:

```
DragHandle
title text
16px gap          ← header paddingBottom
──────────────    ← divider (gray-3)
16px gap          ← body paddingTop   ← THIS is the piece that was missing / = 0px today
content …
```

Both gaps must be `var(--mantine-spacing-md)` (16px / 1rem). The divider→content `paddingTop` is the critical one.

## Pre-read (rule-index → "UI / layout / component task")

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` — always-required.
- `docs/mantine-responsive-design-system.md` — **FIRST READ.** Especially **§18.9** (internal-spacing iron rule — the geometry gate is BLIND to this, so `screenshots:assert` PASS count is NOT proof), §18.8 (content height), §19 (bottom-sheet foundation exports incl. `SheetContent`).
- `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — style source of truth (spacing token cite).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- `docs/critical-flow-registry.md` — scan: chrome-only spacing on shared overlays; no registry flow's behavior (open/close/focus/scroll) changes. If a row asserts sheet spacing, update it; otherwise none applies.

## Root cause (already diagnosed by the orchestrator — implement against this, do not re-derive)

Single source of truth for every bottom sheet is `src/design-system/mantine/patterns/responsiveBottomSheet.tsx`. Every affected surface — **Drawer, DropdownMenu, Modal, NavigationMenu, Select, Popover, Combobox, Tooltip** — routes its `<640` sheet through `ResponsiveBottomSheet`, so this is a one-file global fix.

Inside `ResponsiveBottomSheet`:

- The **divider** is the header's `borderBottom: '1px solid var(--mantine-color-gray-3)'`, added by the inline `header` override **only when `title` is present**.
- The shared const `bottomSheetDrawerStyles.header = { paddingBottom: 0 }` → the title sits flush ABOVE the divider (top gap = 0).
- The shared const `bottomSheetDrawerStyles.body = { …, padding: 0 }` → the content sits flush BELOW the divider (bottom gap = 0). Arbitrary-content consumers wrap children in `SheetContent = <Box px="md" pb="md">`, which supplies horizontal + bottom gutter but **no `paddingTop`**, so the content still touches the divider. Row-based consumers (Select/DropdownMenu/NavigationMenu) render edge-to-edge rows directly in the `padding:0` body, so the first row also touches the divider.

Net: on a **titled** sheet the divider has `0px` on BOTH sides — the owner's captured defect on the Drawer/DropdownMenu/Modal stories (all four locales). The `padding:0` / `paddingBottom:0` are **intentional for title-LESS sheets** (drag-handle-only option lists with no divider), so the fix must be **title-conditional**, exactly like the existing `borderBottom`.

## Current behavior to preserve

- Title-**less** sheets (no `title` prop): `DragHandle` only, no divider, `paddingBottom:0` header + `padding:0` body, first option/content row tight under the handle. **Byte-identical after this task.**
- Do **NOT** mutate the shared consts `bottomSheetDrawerStyles.header` / `bottomSheetDrawerStyles.body` — other code imports them directly. Layer the change in `ResponsiveBottomSheet`'s inline `styles` override (same block where `borderBottom` already lives), title-conditional.
- Horizontal edge-to-edge for row-based consumers (body `padding-left/right` stays `0` — full-width ≥44px tap rows) — unchanged. Only the TOP padding is added.
- Drag handle (2.5rem × 0.25rem, own `0.5rem` bottom padding), 90dvh cap, internal scroll, `returnFocus`, backdrop+Esc, footer flex-column split (Task 567 Fix 4), `SheetContent` gutter — unchanged.
- Desktop (≥640) Modal/Drawer/Menu/etc. — untouched (this is `<640` bottom-sheet chrome only).

## Required after behavior (titled sheets, `<640`)

In `ResponsiveBottomSheet`'s inline `styles`, **inside the existing `title ?` conditionals**, add TWO title-conditional properties:

1. **Header (title→divider gap):**
   ```ts
   header: {
     ...bottomSheetDrawerStyles.header,
     ...(title ? { borderBottom: '1px solid var(--mantine-color-gray-3)', paddingBottom: 'var(--mantine-spacing-md)' } : {}),
   },
   ```
2. **Body (divider→content gap — the critical fix):** add `paddingTop: 'var(--mantine-spacing-md)'` when `title` is present, to BOTH body branches (footer / no-footer), overriding only the top of the `padding:0` base:
   ```ts
   body: {
     ...(footer
       ? { ...bottomSheetDrawerStyles.body, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }
       : bottomSheetDrawerStyles.body),
     ...(title ? { paddingTop: 'var(--mantine-spacing-md)' } : {}),
   },
   ```
   Because `padding-left/right` stays `0`, row-based consumers keep edge-to-edge rows; only the first row / the content blob is pushed 16px below the divider. This one place covers ALL consumers (row-based and `SheetContent` arbitrary-content) uniformly — do NOT edit `SheetContent` or any individual consumer.

- **Value justification (agent-contract clause 16 — zero invented value):** `var(--mantine-spacing-md)` (16px / 1rem) is the canonical rhythm unit already used across these sheets — the footer `Box` `padding`, the `SheetContent` gutter (`px="md" pb="md"`), and every `Stack gap="md"`. Cite it in a code comment next to each new property.
- Title-**less** sheets: both new properties are absent → `paddingBottom:0` header (no divider) + `padding:0` body — unchanged.

## Positive flow (happy path)

- **Actor:** any user on a `<640` viewport (uk/en/sq/it).
- **Preconditions:** a titled bottom-sheet overlay is opened (Modal "Confirm action", DropdownMenu "Item actions", Drawer "Panel details").
1. User taps trigger → sheet slides up, full-width.
2. Header: drag handle → title → **16px** → gray-3 divider.
3. Body: **16px** → content (first menu row / body paragraph).
4. **Success state:** the divider has a balanced ~16px gap on BOTH sides at every locale, including long uk/it wrapping titles; nothing touches the divider.
- **Post-conditions:** open/close/scroll/focus behavior unchanged; only the header `paddingBottom` + body `paddingTop` differ in the DOM.

## Negative flow (every off-happy-path branch)

- **Title-less sheet** (Select/Popover/DropdownMenu option list, no `title`): header `paddingBottom:0`, body `padding:0`, NO divider, NO added gap — first row still tight under the drag handle (regression guard). The `title ?` conditionals are the ONLY place the paddings are added.
- **Long wrapping title** (uk/it @320): the 16px header gap sits below the whole wrapped `<Text>`; the 16px body gap sits above the content — no clip, no overflow, no h-scroll at 320.
- **Footer present** (Drawer/Modal with actions): body `paddingTop` pushes the flex-column (scroll region + pinned footer) down 16px from the divider; footer flex-column split (Fix 4) and pinned behavior unchanged, no overlap at any scroll position.
- **Row-based edge-to-edge** (DropdownMenu/NavigationMenu with a title): rows keep full-width edge-to-edge (horizontal padding still 0); only pushed 16px below the divider.
- **Desktop ≥640:** media query false → desktop path → neither override applied; desktop header rhythm unchanged.
- **Backdrop tap / Esc / SSR first paint:** unchanged (no handler touched; overlay closed by caller on first paint → no flash).

## Mobile <640 full-width gate (agent-contract clause 11)

Sheet stays full-width, edge-to-edge, bottom-anchored, top-only radius, ≤90dvh internal scroll, drag handle, ≥44px targets, labels wrap. This task changes ONLY the header bottom padding + body top padding when a title is present — no full-width / no-h-scroll regression. Verify no horizontal scroll at 320 in all four locales.

## Acceptance criteria (each maps to a flow; verifiable in the diff)

1. `responsiveBottomSheet.tsx` inline `header` override adds `paddingBottom: 'var(--mantine-spacing-md)'` inside the existing `title ?` branch (Positive step 2; file:line) — with the md-token cite comment.
2. `responsiveBottomSheet.tsx` inline `body` override adds `paddingTop: 'var(--mantine-spacing-md)'` when `title` is present, in BOTH footer/no-footer branches, overriding only the top (Positive step 3 — **the critical divider→content gap**; file:line) — with the md-token cite comment.
3. Shared consts `bottomSheetDrawerStyles.header` / `.body` **unchanged** (grep-proven); `SheetContent` **unchanged**; title-less consumers byte-identical (Negative → title-less branch; file:line).
4. No other file changed (clause 1 — single-file scope). Grep confirms no duplicated header/body block elsewhere.
5. **Rendered evidence, all four locales** (clause 12): a **titled** sheet (Modal/DropdownMenu/Drawer story) at **uk@320/375/390** + one desktop-branch width, sq/en/uk/it — showing balanced ~16px gaps on BOTH sides of the divider. A **title-less** sheet (Select/Popover) at uk@320 showing NO divider / NO added gaps (regression proof).
6. **🔴 §18.9 human-visual proof (mandatory — the geometry gate is BLIND to this).** Session log includes a human-inspected side-by-side confirming, by eye at uk@320 + one desktop width: content is separated from the divider by a visible ~16px gap; title is separated from the divider; title-less sheets still tight; nothing clips/overlaps. `screenshots:assert` PASS count alone does NOT close this task (the defect slipped past Task 578's green 644/618/0/26 matrix precisely because the gate cannot see internal spacing).
7. Gates green in transcript: `npx tsc --noEmit`=0, `npm run lint` 0 new, `check:stories`, `check:i18n`, `check:file-integrity`, `screenshots:assert -- --mantine-only` (no regression vs Task 578 baseline 644/618/0/26; cell count unchanged — chrome-only).
8. `docs/backlog.md` + `docs/sessions/2026-07-11-task584-bottomsheet-divider-spacing.md` session log with a Files Changed table. **Executor emits NO `git add`/`git commit`** (orchestrator emits at review).

## Hard contract (verified against the diff on return)

No scope change; no invented architecture (if Mantine's default header top padding is not 16px so the two gaps look unbalanced, **STOP and ASK** — do not invent a value); literal AC; self-validation block + AC-by-AC table; UX flow + existing-controls preserved; locale parity (no new strings expected — confirm none added); single-source (Note 14 — one file, one place, no divergent clones); Files Changed table; executor never runs git.

## STOP-and-ASK triggers

- If Mantine's default header **top** padding ≠ `var(--mantine-spacing-md)`, making title↔divider vs divider↔content look asymmetric → STOP and ASK.
- If any consumer passes a `title` where the tight (gap-less) look is actually desired → STOP and ASK (do not add a per-consumer flag without authorization).
