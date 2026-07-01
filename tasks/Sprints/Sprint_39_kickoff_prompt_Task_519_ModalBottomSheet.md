# Task 519 — Canonical responsive Modal: `MantineModal` (Batch C P1.16)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → Batch C overlays → **P1.16 Dialog / Modal**.
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews diff + clicked-open rendered matrix at 320/375/390 × 4 locales).
>
> **Owner decision (2026-07-01):** next overlay after Popover (513) + DropdownMenu (515) + NavigationMenu (518). Same
> foundation-consuming shape — build ONE canonical `MantineModal` that is a centered Modal at ≥640 and a full-width
> **bottom sheet** at <640, reusing the Task 514 single source (`useResponsiveDropdown` + `ResponsiveBottomSheet`).
> NO new bottom-sheet code, NO second `DragHandle`, NO inline `bottomSheetDrawerStyles`.

## Why this task
`src/components/ui/dialog.tsx` is the legacy shadcn/Radix Dialog. Per the Mantine freeze (rule-index §UI, Task 482) new
overlay UI must use Mantine + the canonical Task 514 foundation. This slice ports Dialog/Modal to a canonical
`MantineModal`, identical in spirit to `MantinePopover` (513) — a controlled overlay that accepts arbitrary `children`
content — but whose ≥640 form is a **centered Mantine `Modal`** and whose <640 form is the shared **`ResponsiveBottomSheet`**.

⚠️ **A pre-514 demo pattern `MantineDialogDrawerPattern.tsx` already exists** and inlines its OWN `<Drawer>` + drag-handle
markup + bottom-sheet `styles` (it predates the Task 514 single-source extraction). **Do NOT edit or delete it in this
task** (its refactor onto `MantineModal`/`ResponsiveBottomSheet` is a separate follow-up — see OUT OF SCOPE). `MantineModal`
is a NEW, distinct canonical primitive; it must NOT copy that inline chrome — it consumes the Task 514 source.

No product surface consumes the legacy `dialog.tsx` via this new primitive today — so this is a **primitive + story slice,
NO product migration** (same class as 513/515/518). Legacy `src/components/ui/dialog.tsx` + `dialog.stories.tsx` are LEFT
IN PLACE (Phase 6 removes legacy once zero consumers) — do NOT delete them here.

## Pre-read (UI / overlay task — from `docs/rule-index.md` → "UI / layout / component task")
**Always:** `docs/agent-contract.md` (clauses 11–12 = the mobile full-width gate + rendered-evidence gate),
`docs/backlog.md`, `docs/critical-flow-registry.md` (**SCAN** — foundation+story only, no product/auth/RLS surface → no
registry row needed; confirm in the session log).
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` — **§7** mobile gate, **§8.1** page-gutter rule,
**§8.2** (one section per STATE, overlays open by REAL click — NO `defaultOpened`), **§12** canonical patterns, **§16**
acceptance gates, **§18** CSS pitfalls, **§20–§22** (the Popover + DropdownMenu + NavigationMenu precedents you are
mirroring). Then `docs/ui-rules.md` (§15a mobile gate), `docs/component-rules.md` (canonical-first, Task 426),
`docs/qa-rules.md`, `docs/storybook-governance.md`.
**Study before coding (REUSE — do NOT modify):**
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` (Task 514 single source — `useResponsiveDropdown`,
  `ResponsiveBottomSheet`, `DragHandle`, `bottomSheetDrawerStyles`; do NOT change its mechanics).
- `src/design-system/mantine/patterns/MantinePopover.tsx` (closest precedent — controlled overlay with arbitrary content
  consuming the same foundation).
- `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` (READ ONLY — the pre-514 inline-chrome version you
  are NOT copying and NOT editing; it shows the ≥640 centered-Modal / <640 bottom-sheet split you will re-express through
  the Task 514 source).
- `src/components/ui/dialog.tsx` (the legacy behavior you are porting — title, body, close on backdrop/Esc/X).
- `src/stories/mantine/primitives/Popover.stories.tsx` (the proof-story template to mirror).

## Scope (exactly this — no more)
1. **New component** `src/design-system/mantine/patterns/MantineModal.tsx`, exported from
   `src/design-system/mantine/patterns/index.ts`. Canonical P0-compliant responsive Modal.

   **API (literal — implement exactly this shape; if a field is genuinely unworkable → STOP and ASK):**
   ```ts
   export interface MantineModalProps {
     /** Controlled open state */
     opened: boolean
     /** Close handler — fired by backdrop tap, Esc, and the close affordance */
     onClose: () => void
     /** Heading (below the drag handle on mobile; Modal title on desktop) */
     title?: ReactNode
     /** Body content (arbitrary) */
     children: ReactNode
     /** Optional actions region rendered below the body (caller composes buttons) */
     footer?: ReactNode
     /** Desktop centered-Modal size (Mantine size token); default 'md'. Ignored <640. */
     size?: string
   }
   ```

2. **Behavior (mirror 513; the ONLY new element vs Popover is the ≥640 centered Modal form):**
   - **≥640 (desktop):** render a centered Mantine `Modal` (`centered`, `radius="md"`, `size={size ?? 'md'}`) with
     `title`, `children` as the body, and `footer` (if provided) below the body. Standard Modal close (X / backdrop / Esc).
   - **<640 (mobile):** render the shared **`ResponsiveBottomSheet`** (Task 514 single source) — `opened`/`onClose`
     passed straight through, `title` forwarded so the centered drag handle + heading come from the foundation. `children`
     render as the sheet body (internal scroll ≤90dvh from the foundation styles); `footer` renders below the body.
     Backdrop tap + Esc close (foundation default); focus returns to the opener (Mantine default `returnFocus`).
   - **One source, no fork:** switch on `useResponsiveDropdown().isMobile`. Do NOT instantiate a second DragHandle/Drawer,
     do NOT inline `bottomSheetDrawerStyles`, do NOT copy `MantineDialogDrawerPattern`'s chrome. (If the modal body cannot
     be represented in `ResponsiveBottomSheet` without changing `responsiveBottomSheet.tsx` → **STOP and ASK** before
     touching the Task 514 source.)
   - **Footer note:** `footer` is arbitrary content (caller-composed). Footer buttons in the STORY must follow the Button
     mobile rule (full-width <640) — but `MantineModal` itself only guarantees the full-width bottom-sheet CONTAINER at
     <640; it does not restyle caller buttons. Do NOT bake a responsive stacked/row action layout into the primitive
     (that opinionation belongs to the caller); if you believe it must be baked → STOP and ASK.

3. **Proof story** `src/stories/mantine/primitives/Modal.stories.tsx` mirroring `Popover.stories.tsx`:
   `parameters: { skipCanvas: true, layout: 'fullscreen' }`, **Default export only**, explicit page-gutter Box (§8.1),
   all strings via `storyT()` against a `storybook.mantine.modal_*` key set with **sq/en/uk/it parity**. Because
   `MantineModal` is controlled, each story STATE owns a local `useState` + a trigger `Button` (click to open — NO
   `defaultOpened`, NO baked-open). **Distinct-STATE sections only (§8.2 — NO per-viewport sections):**
   - Section 1 — **standard dialog**: a trigger `Button` (`modal_trigger_open`) → opens a `MantineModal` with
     `modal_title`, a short `modal_body`, and a `footer` of two Buttons (`modal_confirm` / `modal_cancel`, both
     `fullWidth` on mobile). Open behavior proven by clicking the trigger + toolbar viewport switch on this ONE section.
   - Section 2 — **long-content dialog**: a trigger (`modal_long_trigger`) → opens a `MantineModal` whose body is several
     paragraphs (`modal_long_body`, with real long uk Cyrillic) — proves internal scroll ≤90dvh at <640 and title/handle
     stay pinned.
   Long-uk labels/bodies live in `uk.json` values (real Cyrillic), NOT a `LongUk` export.

4. **Docs:** add **§23 — Canonical responsive Modal: `MantineModal` (Task 519)** to
   `docs/mantine-responsive-design-system.md`, following the §20/§21/§22 template (core mechanism · SSR/hydration caveat ·
   Storybook proof location · P0 gate · note that `MantineDialogDrawerPattern` is the pre-514 inline-chrome version pending
   refactor onto this primitive). Flip the tracker row `P1.16 | Dialog / Modal | … | ⬜` → `✅ Task 519` in
   `docs/mantine-tailadmin-migration-tracker.md` (and the "Current pointer" Batch-C line — mark P1.16 ✅, NEXT = P1.17
   Drawer · P1.22 Tooltip).

**OUT OF SCOPE:** Drawer/Sheet (P1.17), Tooltip (P1.22); ANY change to `responsiveBottomSheet.tsx` bottom-sheet mechanics
(open/close/DragHandle/Drawer/`bottomSheetDrawerStyles` — leave them); **editing/deleting `MantineDialogDrawerPattern.tsx`
or its story** (its refactor onto `MantineModal` is a follow-up task — note it in the session log, do NOT do it here);
deleting or editing legacy `src/components/ui/dialog.tsx` + its story; any product surface / modal-consumer migration
(Phase 3); `MantineSelect`/`MantinePopover`/`MantineDropdownMenu`/`MantineNavigationMenu` behavior.

## 🛑 STOP-and-ASK triggers
- If representing the modal body in the shared `ResponsiveBottomSheet` requires changing the Task 514 source
  (`responsiveBottomSheet.tsx`) rather than passing `opened`/`onClose`/`title`/children through → **STOP and ASK.**
- If you believe the primitive must bake a responsive footer-action layout (stacked <640 / row ≥640) rather than leaving
  `footer` caller-composed → **STOP and ASK** (do not invent the opinionated layout).
- If the desktop form needs anything other than a centered `Modal` (e.g. a `fullScreen` Modal at some mid-breakpoint) →
  **STOP and ASK.**
- If a real consumer requires an uncontrolled (built-in trigger) variant → **STOP and ASK** (this primitive is controlled;
  the story supplies its own trigger).

## Current behavior to preserve
- The Task 514 single source, `MantineDialogDrawerPattern`, `MantinePopover`, `MantineDropdownMenu`, and
  `MantineNavigationMenu` remain UNCHANGED.
- `grep "function DragHandle" src/design-system/mantine` STILL = **ONE match** after this task; NO new inline
  `bottomSheetDrawerStyles` / `<Drawer position="bottom">` block outside `responsiveBottomSheet.tsx`.
- Legacy `src/components/ui/dialog.tsx` + `dialog.stories.tsx` remain UNCHANGED (not deleted).
- Existing exports in `patterns/index.ts` unchanged except the ADDED `MantineModal` lines.

## Required after-behavior
- **<640, opened:** the modal is a full-width edge-to-edge bottom sheet (Task 514 source) with a centered drag handle
  (517) + heading; body scrolls internally ≤90dvh; footer buttons full-width ≥44px; labels wrap sq/en/uk/it; no clip, no
  h-scroll at 320. NOT a centered card with side margins.
- **≥640, opened:** a centered Mantine `Modal` with title, body, and (if provided) footer; standard X/backdrop/Esc close.
- **Closed on SSR / first paint:** no flash (documented `useResponsiveDropdown` caveat, same as §20.2/§21.2/§22.2).

## Positive flow (happy path)
Actor at 320–390px taps the trigger Button → a full-width bottom sheet slides up with the title (centered drag handle),
body, and full-width footer buttons. 1) Scrolls the body if long (≤90dvh, handle/title pinned). 2) Taps a footer button →
its handler fires + the sheet closes; OR taps backdrop / presses Esc → closes with no handler fired, focus returns to the
trigger. At ≥640 the SAME modal opens centered; footer buttons sit in the caller's row; X/backdrop/Esc close.

## Negative flow (every off-happy-path branch)
- **Backdrop tap / Esc** → closes without firing any footer handler; focus returns to the trigger (both paths).
- **Long-content body** → internal scroll ≤90dvh at <640 (title + drag handle stay pinned); no page h-scroll at 320.
- **No `footer` provided** → body renders alone; no empty action region, no crash.
- **Long uk title/body** → wraps inside the full-width sheet at 320, no clip, no h-scroll.
- **Rapid re-open / double trigger tap** → controlled `opened` state; no duplicate sheet/modal instances.
- **SSR / first paint** → `useResponsiveDropdown` `isMobile=false` on first render; overlay closed on SSR; no flash.

## 🔴 Mobile <640 full-width gate (clauses 11–12)
Opened modal at <640 = full-width edge-to-edge bottom sheet (Task 514 source), NOT a centered card with margins, NOT a
mini-dialog. Centered drag handle (517); footer buttons ≥44px full-width; labels wrap (`whitespace-normal break-words`);
no h-scroll at 320; body internal scroll ≤90dvh. ≥640 = centered Modal. Verify with RENDERED evidence, not tsc.

## 🔴 Zero hardcode / canonical-first (Task 426)
No raw colors/spacing/radius px; the <640 chrome comes ENTIRELY from the Task 514 `ResponsiveBottomSheet` (do NOT
re-implement or inline it). All strings via `storyT()` ×4 (`storybook.mantine.modal_*`); any `aria-label` via `t()` with
sq/en/uk/it parity. No raw `<button>`/`<dialog>` — Mantine `Modal` / canonical `Button` only. No duplicated
`DragHandle`/`<Drawer>`/`bottomSheetDrawerStyles` — grep stays ONE match.

## 🔴 Rendered proof matrix (clause 12 + §8.2 — MANDATORY, produced from ACTUAL clicked-open renders)
Rows = `trigger resting` · `standard dialog open (title + body + footer)` · `long-content dialog open (internal scroll)` ;
columns = **uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320 · one ≥640 cell (e.g. en@768 centered Modal)**.
Per cell confirm: opened modal is a full-width edge-to-edge bottom sheet with a **centered** drag handle (517) at <640 and
a centered Modal at ≥640; footer buttons full-width ≥44px <640; long uk wraps; body scrolls ≤90dvh; no h-scroll@320.
`tsc=0`/gates are BASELINE, never proof. (Mantine proof path = toolbar-driven owner render review per §13/§16 — capture
the cells from the actual Storybook toolbar, not a description.)

## Acceptance criteria
1. `MantineModal` exists with the literal API above and is exported from `patterns/index.ts`. *(Scope 1)*
2. At <640 an opened `MantineModal` renders the full-width `ResponsiveBottomSheet` (Task 514 source) edge-to-edge with a
   centered drag handle + heading; body scrolls ≤90dvh; verifiable in the diff AND the rendered matrix. *(Scope 2;
   clause 11; Positive flow)*
3. At ≥640 an opened `MantineModal` renders a centered Mantine `Modal` with title/body/footer; verifiable in the diff AND
   a ≥640 rendered cell. *(Scope 2)*
4. Backdrop tap + Esc close on both paths without firing a footer handler; focus returns to the trigger; no-`footer`
   branch renders cleanly; controlled `opened` prevents duplicate instances. *(Negative flow)*
5. `grep "function DragHandle" src/design-system/mantine` = **ONE match**; NO inline `bottomSheetDrawerStyles` /
   `<Drawer position="bottom">` outside `responsiveBottomSheet.tsx`; `responsiveBottomSheet.tsx` +
   `MantineDialogDrawerPattern.tsx` UNCHANGED; legacy `dialog.tsx` + story UNCHANGED. *(canonical-first; Task 514 integrity)*
6. Story: `skipCanvas:true` + `layout:'fullscreen'` + page-gutter Box; **Default only**; distinct-STATE sections
   (standard · long-content), each with a local trigger, NO per-viewport section and NO `defaultOpened`; clicked-open
   rendered matrix complete incl. uk@320/375/390 and a ≥640 cell. *(Scope 3; clause 12; §8.2)*
7. Docs §23 added + tracker P1.16 → ✅ Task 519; `storybook.mantine.modal_*` keys with sq/en/uk/it parity (uk = real
   Cyrillic); no consumer API break. *(Scope 4; clause 7)*
8. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean
   (clause 14) — paste the transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit (each AC → file:line OR runtime step → ✅/❌) citing both flows
by name; walk the modal at `uk` 320px (trigger → full-width bottom sheet → scroll long body → backdrop/Esc close) AND at
≥640 (centered Modal, footer row) end-to-end before writing "complete". Add a **Files Changed table** to
`docs/sessions/2026-07-01-task519-modal-bottom-sheet.md` + the clause-12 rendered matrix, and update `docs/backlog.md`
Last Session. **Emit NO `git add`/`git commit`** — the orchestrator emits commits after diff review. Do NOT start until
you have read the Task 514 source + `MantinePopover.tsx` + §8.2 and confirmed the controlled `opened`/`onClose` + shared
`ResponsiveBottomSheet` approach (else STOP-and-ASK).
