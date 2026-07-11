# Task 584 — Bottom-sheet header: restore canonical vertical spacing between title and divider (global, single-source)

> **Sprint 39 follow-up (bottom-sheet foundation).** Owner-reported 2026-07-11 during the Task 578 review.
> **Type:** UI / layout / component (Mantine). **Model:** Sonnet 4.6 executor.
> **Scope size:** ONE file, one conditional style property. Do NOT expand.

## Pre-read (rule-index → "UI / layout / component task")

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` — always-required.
- `docs/mantine-responsive-design-system.md` — **FIRST READ.** Especially **§18.9** (internal-spacing iron rule — the geometry gate is BLIND to this, so rendered PASS count is NOT proof), §18.8 (content height), §19 (bottom-sheet foundation exports).
- `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — style source of truth (spacing token cite).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- `docs/critical-flow-registry.md` — scan: this is chrome-only spacing on shared overlays; no registry flow's behavior changes (open/close/focus/scroll all unchanged). If you find a row that asserts header spacing, update it; otherwise none applies.

## Root cause (already diagnosed by the orchestrator — implement against this, do not re-derive)

Single source of truth for every bottom sheet is `src/design-system/mantine/patterns/responsiveBottomSheet.tsx`. Every affected surface — **Drawer, DropdownMenu, Modal, NavigationMenu, Select, Popover, Combobox, Tooltip** — routes its `<640` sheet through `ResponsiveBottomSheet`, so this is a one-file global fix.

Inside `ResponsiveBottomSheet` the header is styled in two layers:

1. The shared const `bottomSheetDrawerStyles.header = { paddingBottom: 0 }`.
2. An inline override that adds `borderBottom: '1px solid var(--mantine-color-gray-3)'` **only when `title` is present**:
   ```ts
   header: {
     ...bottomSheetDrawerStyles.header,
     ...(title ? { borderBottom: '1px solid var(--mantine-color-gray-3)' } : {}),
   },
   ```

Because `paddingBottom` stays `0` even when the divider is added, the title `<Text fw={600} size="sm" c="gray.8">` renders **flush against the divider line** — zero vertical breathing room between the heading and the rule. On the desktop Mantine `Modal`/`Drawer` header the title has `var(--mantine-spacing-md)` (16px) of padding below it before the divider; the mobile sheet drops that bottom padding, breaking the rhythm. This is the exact cramped title↔divider spacing the owner captured on the Drawer, DropdownMenu, and Modal stories (all four locales).

The `paddingBottom: 0` is **intentional for title-LESS sheets** (Select/Popover/DropdownMenu-without-title option lists): with only a `DragHandle` and no divider, extra bottom padding before the first option row is unwanted. So the fix must be **title-conditional**, exactly like the existing `borderBottom`.

## Current behavior to preserve

- Title-**less** sheets (no `title` prop): `DragHandle` only, no divider, `paddingBottom: 0`, first option/content row sits tight under the handle. **Byte-identical after this task.**
- The shared const `bottomSheetDrawerStyles.header` is imported directly by other code paths — **do NOT mutate it.** Layer the change in the inline `title ?` override only (same place `borderBottom` already lives).
- Drag handle (2.5rem × 0.25rem, its own `0.5rem` bottom padding), 90dvh cap, internal scroll, `returnFocus`, backdrop+Esc close, footer treatment (Task 567 Fix 4), `SheetContent` gutter — all unchanged.
- Desktop (≥640) Modal/Drawer/Menu/etc. — untouched (this is `<640` bottom-sheet chrome only).

## Required after behavior

- When `title` **is** present, the header inline override adds, alongside the existing `borderBottom`:
  ```ts
  paddingBottom: 'var(--mantine-spacing-md)',
  ```
  so the title has 16px of vertical space between it and the divider — symmetric with the header's default top padding and matching the desktop header rhythm. Result: `DragHandle` → title text → **16px gap** → divider → body.
- **Value justification (agent-contract clause 16 — zero invented value):** `var(--mantine-spacing-md)` (16px) is the canonical rhythm unit already used across these sheets — the footer `padding` (`responsiveBottomSheet.tsx` footer `Box`), the `SheetContent` gutter (`px="md" pb="md"`), and the body `Stack gap="md"`. Cite it in a code comment next to the new property.
- Title-**less** sheets: unchanged (`paddingBottom: 0`, no divider).

## Positive flow (happy path)

- **Actor:** any user on a `<640` viewport (uk/en/sq/it).
- **Preconditions:** a bottom-sheet overlay with a `title` is opened (e.g. Modal "Confirm action", DropdownMenu "Item actions", Drawer "Panel details").
1. User taps the trigger → sheet slides up from the bottom edge, full-width.
2. Header renders: centered drag handle at top → title text → **16px gap** → gray-3 divider.
3. Body content renders below the divider with its own gutter.
4. **Success state:** the title is visually separated from the divider by a balanced gap (top padding ≈ bottom padding); no cramped/touching look at any of uk/en/sq/it, including long uk/it labels that wrap.
- **Post-conditions:** no change to open/close/scroll/focus behavior; DOM structure unchanged except the header's inline `paddingBottom`.

## Negative flow (every off-happy-path branch)

- **Title-less sheet** (Select/Popover/DropdownMenu option list with no `title`): header stays `paddingBottom: 0`, NO divider, NO added gap — verify the option rows still sit tight under the drag handle (regression guard). Verifiable at the `header` conditional: the `title ?` branch is the ONLY place the padding is added.
- **Long wrapping title** (uk/it at 320): the 16px gap is applied below the wrapped multi-line title (padding is below the whole `<Text>`, not per line) — no clip, no overflow, no h-scroll at 320.
- **Footer present** (Drawer/Modal with actions): the new header padding does not shift or overlap the pinned footer; footer treatment (Fix 4 flex-column split) unchanged.
- **Desktop ≥640:** media query false → desktop Modal/Drawer path → this override is not applied; desktop header rhythm unchanged.
- **Backdrop tap / Esc:** close behavior unchanged (no handler touched).
- **SSR / first paint:** `isMobile=false` initially (Mantine `getInitialValueInEffect`), overlay closed by caller → no flash; unchanged.

## Mobile <640 full-width gate (agent-contract clause 11)

- The sheet remains full-width, edge-to-edge, bottom-anchored, top-only radius, ≤90dvh internal scroll, drag handle, ≥44px touch targets, labels wrap. This task changes ONLY the header's bottom padding when a title is present — it must NOT regress any full-width / no-h-scroll behavior. Verify no horizontal scroll at 320 in all four locales.

## Acceptance criteria (each maps to a flow above; verifiable in the diff)

1. `responsiveBottomSheet.tsx` `ResponsiveBottomSheet` inline `header` override adds `paddingBottom: 'var(--mantine-spacing-md)'` **inside the existing `title ?` conditional only** (Positive flow step 2; file:line). — with the value-justification comment citing the md-token reuse (clause 16).
2. `bottomSheetDrawerStyles.header` const is **unchanged** (`paddingBottom: 0`) — grep-proven; title-less consumers byte-identical (Negative flow → title-less branch; file:line).
3. No other file changed (clause 1 — single-file scope). Grep confirms no duplicated header block anywhere else.
4. **Rendered evidence, all four locales** (clause 12): a bottom sheet **with a title** (Modal/DropdownMenu/Drawer story) at **uk@320/375/390** + one desktop-branch width, sq/en/uk/it — showing the balanced title↔divider gap. A title-**less** sheet (Select/Popover) at uk@320 showing NO added gap / no divider (regression proof).
5. **🔴 §18.9 human-visual proof (mandatory — the geometry gate is BLIND to this).** The session log MUST include a human-inspected side-by-side note confirming, by eye at uk@320 + one desktop width: title is separated from the divider by a visible balanced gap; title-less sheets are still tight; nothing clips or overlaps. `screenshots:assert` PASS count alone does NOT close this task (this defect slipped past a green 644/618/0/26 matrix precisely because the gate cannot see it).
6. Gates green in transcript: `npx tsc --noEmit` = 0, `npm run lint` 0 new, `npm run check:stories`, `npm run check:i18n`, `npm run check:file-integrity`, `npm run screenshots:assert -- --mantine-only` (no regression vs the Task 578 baseline 644/618/0/26; cell count unchanged — this is chrome-only).
7. `docs/backlog.md` + a `docs/sessions/2026-07-11-task584-bottomsheet-header-title-divider-spacing.md` session log with the Files Changed table. **No `git add`/`git commit` emitted by the executor** (orchestrator emits at review).

## Hard contract (verified against the diff on return)

No scope change; no invented architecture (if the top vs bottom header padding looks unbalanced because Mantine's default header top padding is NOT 16px, **STOP and ASK the orchestrator** — do not invent a different value); literal AC; self-validation block + AC-by-AC table; UX flow + existing-controls preserved; locale parity (no new strings expected — confirm none added); single-source (clause: Note 14 — one file, no divergent clones); Files Changed table; executor never runs git.

## STOP-and-ASK triggers

- If Mantine's default header **top** padding is not `var(--mantine-spacing-md)`, so that adding 16px at the bottom looks asymmetric → STOP and ASK (do not guess a value).
- If any consumer passes a `title` where the tight look is actually desired → STOP and ASK (do not add a per-consumer flag without authorization).
