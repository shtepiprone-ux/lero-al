# Task 523 — Canonical responsive Drawer: `MantineDrawer` (Batch C P1.17)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → Batch C overlays → **P1.17 Sheet / Drawer**.
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews diff + clicked-open rendered matrix at 320/375/390 × 4 locales).
>
> **Owner sequence (2026-07-02):** the next overlay after Popover (513) · DropdownMenu (515) · NavigationMenu (518) ·
> Modal (519). Same foundation-consuming shape as `MantineModal` — build ONE canonical `MantineDrawer` that is a **side
> Drawer** at ≥640 and a full-width **bottom sheet** at <640, reusing the Task 514 single source
> (`useResponsiveDropdown` + `ResponsiveBottomSheet` + `SheetContent`). NO new bottom-sheet code, NO second `DragHandle`,
> NO inline `bottomSheetDrawerStyles`, NO inline `<Drawer position="bottom">` block.

## Why this task
`src/components/ui/sheet.tsx` is the legacy shadcn/Base-UI Sheet (a slide-in panel with `side="top|right|bottom|left"`).
Per the Mantine freeze (rule-index §UI, Task 482) new overlay UI must use Mantine + the canonical Task 514 foundation.
This slice ports Sheet/Drawer to a canonical `MantineDrawer` — identical in spirit to `MantineModal` (519), a controlled
overlay that accepts arbitrary `children` — but whose ≥640 form is a **side Mantine `Drawer`** (left/right) and whose
<640 form is the shared **`ResponsiveBottomSheet`** (P0: all popups are full-width bottom sheets below 640).

No product surface consumes the legacy `sheet.tsx` via this new primitive today — so this is a **primitive + story slice,
NO product migration** (same class as 513/515/518/519). Legacy `src/components/ui/sheet.tsx` + any `sheet.stories.tsx`
are LEFT IN PLACE (Phase 6 removes legacy once zero consumers) — do NOT delete them here.

## Pre-read (UI / overlay task — from `docs/rule-index.md` → "UI / layout / component task")
**Always:** `docs/agent-contract.md` (clauses 11–12 = the mobile full-width gate + rendered-evidence gate),
`docs/backlog.md`, `docs/critical-flow-registry.md` (**SCAN** — foundation+story only, no product/auth/RLS surface → no
registry row needed; confirm in the session log).
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` — **§7** mobile gate, **§8.1** page-gutter rule,
**§8.2** (one section per STATE, overlays open by REAL click — NO `defaultOpened`), **§12** canonical patterns, **§16**
acceptance gates, **§18** CSS pitfalls, **§20–§23** (Popover · DropdownMenu · NavigationMenu · **Modal** precedents you
are mirroring — §23 `MantineModal` is the closest analog). Then `docs/ui-rules.md` (§15a mobile gate),
`docs/component-rules.md` (canonical-first, Task 426), `docs/qa-rules.md`, `docs/storybook-governance.md`.
**Study before coding (REUSE — do NOT modify):**
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` (Task 514 single source — `useResponsiveDropdown`,
  `ResponsiveBottomSheet`, `SheetContent` gutter, `DragHandle`, `bottomSheetDrawerStyles`; do NOT change its mechanics).
- `src/design-system/mantine/patterns/MantineModal.tsx` (**closest precedent** — controlled overlay, arbitrary content +
  `footer`, ≥640 desktop form / <640 shared bottom sheet, consumes the Task 514 source; mirror its shape).
- `src/components/ui/sheet.tsx` (the legacy behavior you are porting — side panel, title, body, footer, close on
  backdrop/Esc/X, drag handle only for the bottom variant).
- `src/stories/mantine/primitives/Modal.stories.tsx` (the proof-story template to mirror).

## Scope (exactly this — no more)
1. **New component** `src/design-system/mantine/patterns/MantineDrawer.tsx`, exported from
   `src/design-system/mantine/patterns/index.ts`. Canonical P0-compliant responsive Drawer.

   **API (literal — implement exactly this shape; if a field is genuinely unworkable → STOP and ASK):**
   ```ts
   export interface MantineDrawerProps {
     /** Controlled open state */
     opened: boolean
     /** Close handler — fired by backdrop tap, Esc, and the close affordance */
     onClose: () => void
     /** Heading (below the drag handle on mobile; Drawer title on desktop) */
     title?: ReactNode
     /** Body content (arbitrary) */
     children: ReactNode
     /** Optional actions region rendered below the body (caller composes buttons) */
     footer?: ReactNode
     /** Desktop drawer side; 'left' | 'right'. Default 'right'. Ignored <640 (always bottom sheet). */
     side?: 'left' | 'right'
     /** Desktop drawer width (Mantine size token); default 'md'. Ignored <640. */
     size?: string
   }
   ```

2. **Behavior (mirror `MantineModal` (519); the ONLY differences vs Modal are the ≥640 side Drawer form + the `side` prop):**
   - **≥640 (desktop):** render a **side** Mantine `Drawer` (`position={side ?? 'right'}`, `size={size ?? 'md'}`,
     `radius="md"` per Mantine default for side drawers) with `title`, `children` as the body, and `footer` (if provided)
     below the body. Standard Drawer close (X / backdrop / Esc). NO drag handle on the desktop side form.
   - **<640 (mobile):** render the shared **`ResponsiveBottomSheet`** (Task 514 single source) — `opened`/`onClose`
     passed straight through, `title` forwarded so the centered drag handle + heading come from the foundation.
     `children` are arbitrary content → wrap them in the shared **`SheetContent`** gutter (Task 520) so they align to the
     title inset rather than bleeding to the sheet edges; `footer` (if provided) renders below the body inside the sheet.
     Backdrop tap + Esc close (foundation default); focus returns to the opener (Mantine default `returnFocus`).
   - **One source, no fork:** switch on `useResponsiveDropdown().isMobile`. Do NOT instantiate a second DragHandle/Drawer,
     do NOT inline `bottomSheetDrawerStyles`, do NOT copy `MantineDialogDrawerPattern`'s chrome. (If the drawer body cannot
     be represented in `ResponsiveBottomSheet` without changing `responsiveBottomSheet.tsx` → **STOP and ASK** before
     touching the Task 514 source.)
   - **Footer note:** `footer` is arbitrary content (caller-composed). Footer buttons in the STORY must follow the Button
     mobile rule (full-width <640) — but `MantineDrawer` itself only guarantees the full-width bottom-sheet CONTAINER at
     <640; it does not restyle caller buttons. Do NOT bake a responsive stacked/row action layout into the primitive
     (that opinionation belongs to the caller); if you believe it must be baked → STOP and ASK.

3. **Proof story** `src/stories/mantine/primitives/Drawer.stories.tsx` mirroring `Modal.stories.tsx`:
   `parameters: { skipCanvas: true, layout: 'fullscreen' }`, **Default export only**, explicit page-gutter Box (§8.1),
   all strings via `storyT()` against a `storybook.mantine.drawer_*` key set with **sq/en/uk/it parity**. Because
   `MantineDrawer` is controlled, each story STATE owns a local `useState` + a trigger `Button` (click to open — NO
   `defaultOpened`, NO baked-open). **Distinct-STATE sections only (§8.2 — NO per-viewport sections):**
   - Section 1 — **standard drawer (right)**: a trigger `Button` (`drawer_trigger_open`) → opens a `MantineDrawer`
     (default `side='right'`) with `drawer_title`, a short `drawer_body`, and a `footer` of two Buttons
     (`drawer_confirm` / `drawer_cancel`, both `fullWidth` on mobile). Open behavior proven by clicking the trigger +
     toolbar viewport switch on this ONE section (side drawer ≥640 · bottom sheet <640).
   - Section 2 — **left-side drawer**: a trigger (`drawer_left_trigger`) → opens a `MantineDrawer` with `side='left'` and
     a short body — proves the `side` prop drives the ≥640 anchor while <640 STILL collapses to the SAME bottom sheet.
   - Section 3 — **long-content drawer**: a trigger (`drawer_long_trigger`) → opens a `MantineDrawer` whose body is several
     paragraphs (`drawer_long_body`, with real long uk Cyrillic) — proves internal scroll ≤90dvh at <640 and title/handle
     stay pinned.
   Long-uk labels/bodies live in `uk.json` values (real Cyrillic), NOT a `LongUk` export.

4. **Docs:** add **§24 — Canonical responsive Drawer: `MantineDrawer` (Task 523)** to
   `docs/mantine-responsive-design-system.md`, following the §20/§21/§22/§23 template (core mechanism · SSR/hydration
   caveat · Storybook proof location · P0 gate · the `side` desktop split ≥640 vs shared bottom sheet <640). Flip the
   tracker row `P1.17 | Sheet / Drawer | sheet.tsx | §11 | ⬜` → `✅ Task 523` in
   `docs/mantine-tailadmin-migration-tracker.md` (and the "Current pointer" Batch-C line — mark P1.17 ✅, NEXT = P1.22
   Tooltip).

**OUT OF SCOPE:** Tooltip (P1.22) and every Batch D primitive; ANY change to `responsiveBottomSheet.tsx` bottom-sheet
mechanics (`useResponsiveDropdown`/`ResponsiveBottomSheet`/`SheetContent`/`DragHandle`/`bottomSheetDrawerStyles` — leave
them); editing/deleting `MantineDialogDrawerPattern.tsx` or its story; deleting or editing legacy
`src/components/ui/sheet.tsx` + its story; any product surface / sheet-consumer migration (Phase 3–5);
`MantineModal`/`MantineSelect`/`MantinePopover`/`MantineDropdownMenu`/`MantineNavigationMenu` behavior.

## 🛑 STOP-and-ASK triggers
- If representing the drawer body in the shared `ResponsiveBottomSheet` requires changing the Task 514 source
  (`responsiveBottomSheet.tsx`) rather than passing `opened`/`onClose`/`title`/children (+ `SheetContent`) through →
  **STOP and ASK.**
- If a real consumer needs a desktop `side` of `'top'` or `'bottom'` (not just `'left'`/`'right'`) → **STOP and ASK**
  (do not silently widen the union — the mobile form is already the bottom sheet).
- If you believe the primitive must bake a responsive footer-action layout (stacked <640 / row ≥640) rather than leaving
  `footer` caller-composed → **STOP and ASK.**
- If a real consumer requires an uncontrolled (built-in trigger) variant → **STOP and ASK** (this primitive is controlled;
  the story supplies its own trigger).

## Current behavior to preserve
- The Task 514 single source, `MantineDialogDrawerPattern`, `MantineModal`, `MantinePopover`, `MantineSelect`,
  `MantineDropdownMenu`, and `MantineNavigationMenu` remain UNCHANGED.
- `grep "function DragHandle" src/design-system/mantine` STILL = **ONE match** after this task; NO new inline
  `bottomSheetDrawerStyles` / `<Drawer position="bottom">` block outside `responsiveBottomSheet.tsx`.
- Legacy `src/components/ui/sheet.tsx` (+ any story) remains UNCHANGED (not deleted).
- Existing exports in `patterns/index.ts` unchanged except the ADDED `MantineDrawer` lines.

## Required after-behavior
- **<640, opened:** the drawer is a full-width edge-to-edge bottom sheet (Task 514 source) with a centered drag handle
  (517) + heading; arbitrary body sits in the `SheetContent` gutter and scrolls internally ≤90dvh; footer buttons
  full-width ≥44px; labels wrap sq/en/uk/it; no clip, no h-scroll at 320. NOT a side panel, NOT a centered card with
  margins. The `side` prop has NO effect at <640.
- **≥640, opened:** a side Mantine `Drawer` anchored per `side` (default right) with title, body, and (if provided)
  footer; standard X/backdrop/Esc close; no drag handle.
- **Closed on SSR / first paint:** no flash (documented `useResponsiveDropdown` caveat, same as §20.2/§21.2/§22.2/§23).

## Positive flow (happy path)
Actor at 320–390px taps the trigger Button → a full-width bottom sheet slides up with the title (centered drag handle),
body (in the `SheetContent` gutter), and full-width footer buttons. 1) Scrolls the body if long (≤90dvh, handle/title
pinned). 2) Taps a footer button → its handler fires + the sheet closes; OR taps backdrop / presses Esc → closes with no
handler fired, focus returns to the trigger. At ≥640 the SAME drawer opens as a side panel anchored per `side` (default
right); footer buttons sit in the caller's row; X/backdrop/Esc close.

## Negative flow (every off-happy-path branch)
- **Backdrop tap / Esc** → closes without firing any footer handler; focus returns to the trigger (both paths).
- **Long-content body** → internal scroll ≤90dvh at <640 (title + drag handle stay pinned); no page h-scroll at 320.
- **No `footer` provided** → body renders alone; no empty action region, no crash.
- **`side='left'`** → ≥640 anchors left; <640 STILL the SAME bottom sheet (side ignored) — proven in the story.
- **Long uk title/body** → wraps inside the full-width sheet at 320, no clip, no h-scroll.
- **Rapid re-open / double trigger tap** → controlled `opened` state; no duplicate sheet/drawer instances.
- **SSR / first paint** → `useResponsiveDropdown` `isMobile=false` on first render; overlay closed on SSR; no flash.

## 🔴 Mobile <640 full-width gate (clauses 11–12)
Opened drawer at <640 = full-width edge-to-edge bottom sheet (Task 514 source), NOT a side panel, NOT a centered card
with margins. Centered drag handle (517); footer buttons ≥44px full-width; labels wrap (`whitespace-normal break-words`);
no h-scroll at 320; body internal scroll ≤90dvh. ≥640 = side Drawer. Verify with RENDERED evidence, not tsc.

## 🔴 Zero hardcode / canonical-first (Task 426)
No raw colors/spacing/radius px; the <640 chrome comes ENTIRELY from the Task 514 `ResponsiveBottomSheet` + `SheetContent`
(do NOT re-implement or inline them). All strings via `storyT()` ×4 (`storybook.mantine.drawer_*`); any `aria-label` via
`t()` with sq/en/uk/it parity. No raw `<button>`/`<dialog>` — Mantine `Drawer` / canonical `Button` only. No duplicated
`DragHandle`/`<Drawer position="bottom">`/`bottomSheetDrawerStyles` — grep stays ONE match.

## 🔴 Rendered proof matrix (clause 12 + §8.2 — MANDATORY, produced from ACTUAL clicked-open renders)
Rows = `trigger resting` · `standard drawer open (right; title + body + footer)` · `left-side drawer open` ·
`long-content drawer open (internal scroll)` ; columns = **uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320 · one
≥640 cell (e.g. en@768 side Drawer, and one showing side='left')**. Per cell confirm: opened drawer is a full-width
edge-to-edge bottom sheet with a **centered** drag handle (517) at <640 and a side Drawer at ≥640; footer buttons
full-width ≥44px <640; long uk wraps; body scrolls ≤90dvh; no h-scroll@320. `tsc=0`/gates are BASELINE, never proof.
(Mantine proof path = toolbar-driven owner render review per §13/§16 — capture the cells from the actual Storybook
toolbar, not a description.)

## Acceptance criteria
1. `MantineDrawer` exists with the literal API above and is exported from `patterns/index.ts`. *(Scope 1)*
2. At <640 an opened `MantineDrawer` renders the full-width `ResponsiveBottomSheet` (Task 514 source) edge-to-edge with a
   centered drag handle + heading; arbitrary body in the `SheetContent` gutter; body scrolls ≤90dvh; the `side` prop has
   no effect; verifiable in the diff AND the rendered matrix. *(Scope 2; clause 11; Positive/Negative flow)*
3. At ≥640 an opened `MantineDrawer` renders a side Mantine `Drawer` anchored per `side` (default right; `left` proven);
   title/body/footer present; verifiable in the diff AND ≥640 rendered cells. *(Scope 2)*
4. Backdrop tap + Esc close on both paths without firing a footer handler; focus returns to the trigger; no-`footer`
   branch renders cleanly; controlled `opened` prevents duplicate instances. *(Negative flow)*
5. `grep "function DragHandle" src/design-system/mantine` = **ONE match**; NO inline `bottomSheetDrawerStyles` /
   `<Drawer position="bottom">` outside `responsiveBottomSheet.tsx`; `responsiveBottomSheet.tsx` +
   `MantineDialogDrawerPattern.tsx` + `MantineModal.tsx` UNCHANGED; legacy `sheet.tsx` (+ story) UNCHANGED.
   *(canonical-first; Task 514 integrity)*
6. Story: `skipCanvas:true` + `layout:'fullscreen'` + page-gutter Box; **Default only**; distinct-STATE sections
   (standard-right · left-side · long-content), each with a local trigger, NO per-viewport section and NO `defaultOpened`;
   clicked-open rendered matrix complete incl. uk@320/375/390 and ≥640 cells (incl. side='left'). *(Scope 3; clause 12; §8.2)*
7. Docs §24 added + tracker P1.17 → ✅ Task 523; `storybook.mantine.drawer_*` keys with sq/en/uk/it parity (uk = real
   Cyrillic); no consumer API break. *(Scope 4; clause 7)*
8. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean
   (clause 14) — paste the transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit (each AC → file:line OR runtime step → ✅/❌) citing both flows
by name; walk the drawer at `uk` 320px (trigger → full-width bottom sheet → scroll long body → backdrop/Esc close) AND at
≥640 (side Drawer right + left, footer row) end-to-end before writing "complete". Add a **Files Changed table** to
`docs/sessions/2026-07-02-task523-drawer-bottom-sheet.md` + the clause-12 rendered matrix, and update `docs/backlog.md`
Last Session. **Emit NO `git add`/`git commit`** — the orchestrator emits commits after diff review. Do NOT start until
you have read the Task 514 source + `MantineModal.tsx` + §8.2 and confirmed the controlled `opened`/`onClose` + shared
`ResponsiveBottomSheet` + `SheetContent` approach (else STOP-and-ASK).
