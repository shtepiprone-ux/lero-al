# Task 518 — Canonical responsive NavigationMenu: `MantineNavigationMenu` (Batch C P1.20)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → Batch C overlays → **P1.20 NavigationMenu**.
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews diff + clicked-open rendered matrix at 320/375/390 × 4 locales).
>
> **Owner decision (2026-07-01):** next overlay after Popover (513) + DropdownMenu (515). Same foundation-consuming
> shape — build ONE canonical `MantineNavigationMenu` that is an anchored horizontal nav ≥640 and a full-width
> **bottom sheet per section** at <640, reusing the Task 514 single source (`useResponsiveDropdown` +
> `ResponsiveBottomSheet`). NO new bottom-sheet code, NO second `DragHandle`.

## Why this task
`src/components/ui/navigation-menu.tsx` is a Base-UI compound (`Root/List/Item/Trigger/Content/Link/Positioner`) that
already renders each trigger's panel as a mobile bottom sheet (`MOBILE_POPUP` + `DRAG_HANDLE_*`). Per the Mantine freeze
(rule-index §UI, Task 482) new overlay UI must use Mantine + the canonical Task 514 foundation, not a bespoke Base-UI
bottom-sheet. This slice ports NavigationMenu to `MantineNavigationMenu`, identical in spirit to `MantineDropdownMenu`
(Task 515) but with **multiple top-level sections**, each opening its own links panel.

No product surface consumes `NavigationMenu` today (`grep -rl "navigation-menu\|NavigationMenu" src` = the ui primitive,
its story, and the `responsiveBottomSheet` comment only) — so this is a **primitive + story slice, NO product migration**
(same class as 513/515). The legacy `src/components/ui/navigation-menu.tsx` and its story are LEFT IN PLACE (Phase 6
removes legacy once zero consumers) — do NOT delete them here.

## Pre-read (UI / overlay task — from `docs/rule-index.md` → "UI / layout / component task")
**Always:** `docs/agent-contract.md` (clauses 11–12 = the mobile full-width gate + rendered-evidence gate),
`docs/backlog.md`, `docs/critical-flow-registry.md` (**SCAN** — foundation+story only, no product/auth/RLS surface → no
registry row needed; confirm in the session log).
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` — **§7** mobile gate, **§8.1** page-gutter rule,
**§8.2** (one section per STATE, overlays open by REAL click — NO `defaultOpened`), **§12** canonical patterns, **§16**
acceptance gates, **§18** CSS pitfalls, **§20–§21** (the Popover + DropdownMenu precedents you are mirroring, incl. the
§20.5/§21.5 trigger-width contract from Task 516). Then `docs/ui-rules.md` (§15a mobile gate), `docs/component-rules.md`
(canonical-first, Task 426), `docs/qa-rules.md`, `docs/storybook-governance.md`.
**Study before coding (REUSE — do NOT modify):**
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` (Task 514 single source — `useResponsiveDropdown`,
  `ResponsiveBottomSheet`, `DragHandle`, `bottomSheetDrawerStyles`; do NOT change its mechanics).
- `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` (closest precedent — copy its structure: mobile
  wrapper + desktop anchored + the Task 516 trigger-width treatment).
- `src/design-system/mantine/patterns/MantinePopover.tsx` (same foundation consumer).
- `src/components/ui/navigation-menu.tsx` (the legacy behavior you are porting — sections of links, per-trigger panel).
- `src/stories/mantine/primitives/DropdownMenu.stories.tsx` (the proof-story template to mirror).

## Scope (exactly this — no more)
1. **New component** `src/design-system/mantine/patterns/MantineNavigationMenu.tsx`, exported from
   `src/design-system/mantine/patterns/index.ts`. Canonical P0-compliant responsive NavigationMenu.

   **API (literal — implement exactly this shape; if a field is genuinely unworkable → STOP and ASK):**
   ```ts
   export interface NavMenuLink {
     label: ReactNode
     /** Navigation target (renders as an anchor); optional when onClick is used */
     href?: string
     onClick?: () => void
     icon?: ReactNode
     disabled?: boolean
   }
   export interface NavMenuSection {
     /** Top-level trigger label (text trigger) */
     label: ReactNode
     /** Links revealed in the section's panel (≥640) / bottom sheet (<640) */
     links: NavMenuLink[]
     /** Disable this section's trigger — no panel/sheet on either path */
     disabled?: boolean
   }
   export interface MantineNavigationMenuProps {
     sections: NavMenuSection[]
     /** Accessible label for the <nav> landmark (via aria-label) */
     ariaLabel: string
   }
   ```

2. **Behavior (mirror 515/516; the ONLY new element is multiple sections):**
   - **≥640 (desktop):** a horizontal nav bar — render sections in a `Group` inside a `<Box component="nav" aria-label={ariaLabel}>`. Each section is a **text trigger** at **natural/content width** (must NOT be stretched by a parent `Stack align:"stretch"` — reuse the Task 516 `alignSelf:'flex-start'`/inline wrapper treatment). Clicking a trigger opens THAT section's anchored panel (Mantine `Menu` or `Popover`, your choice — consistent with 515/513) listing its `links` as `Menu.Item`/anchor rows. Disabled section → trigger disabled, no panel.
   - **<640 (mobile):** the nav items **stack full-width** (`Stack`), each section trigger rendered **full-width edge-to-edge** (≥44px) per the Task 516 trigger-width contract (flex-column wrapper → `align-items:stretch`). Tapping a section trigger opens a **full-width `ResponsiveBottomSheet`** (Task 514 single source) whose body lists THAT section's `links` as ≥44px `UnstyledButton`/anchor rows (label wraps sq/en/uk/it; icon optional; disabled link dimmed + no-op). Backdrop tap + Esc close; focus returns to the trigger.
   - **One shared drawer, active-section state:** use `useResponsiveDropdown()` for `isMobile` + drawer controls; track a local `activeSectionIndex` so the ONE `ResponsiveBottomSheet` shows the tapped section's links. Do NOT instantiate a second DragHandle/Drawer, do NOT fork the foundation. (If a single shared sheet cannot represent per-section content without changing `responsiveBottomSheet.tsx` → **STOP and ASK** before touching the Task 514 source.)
   - **Trigger-width contract (Task 516) applies:** text triggers full-width <640 / natural ≥640. NavigationMenu triggers are always text → **no `iconOnlyTrigger` needed here**; do NOT add an icon-only opt-out unless a real icon-only nav trigger case exists (if it does → STOP and ASK).

3. **Proof story** `src/stories/mantine/primitives/NavigationMenu.stories.tsx` mirroring `DropdownMenu.stories.tsx`:
   `parameters: { skipCanvas: true, layout: 'fullscreen' }`, **Default export only**, explicit page-gutter Box (§8.1),
   all strings via `storyT()` against a `storybook.mantine.nav_*` key set with **sq/en/uk/it parity**. **Distinct-STATE
   sections only (§8.2 — NO per-viewport sections, NO `defaultOpened`):**
   - Section 1 — **resting**: a nav with ≥2 sections (e.g. `nav_sec_products`, `nav_sec_resources`), each with ≥3 links (`nav_link_*`). Open behavior proven by clicking a trigger + toolbar viewport switch on this ONE section.
   - Section 2 — **disabled**: one section trigger `disabled` → tap is a no-op on both paths; still renders full-width text trigger at <640 / natural at ≥640.
   Long-uk labels live in `uk.json` values (real Cyrillic), NOT a `LongUk` export.

4. **Docs:** add **§22 — Canonical responsive NavigationMenu: `MantineNavigationMenu` (Task 518)** to
   `docs/mantine-responsive-design-system.md`, following the §20/§21 template (core mechanism · SSR/hydration caveat ·
   Storybook proof location · P0 gate · trigger-width contract row referencing §20.5). Flip the tracker row
   `P1.20 | NavigationMenu | … | ⬜` → `✅ Task 518` in `docs/mantine-tailadmin-migration-tracker.md` (and the "Current
   pointer" Batch-C line if it lists per-item status).

**OUT OF SCOPE:** Tooltip (P1.22), Modal (P1.16), Drawer (P1.17); ANY change to `responsiveBottomSheet.tsx` bottom-sheet
mechanics (open/close/DragHandle/Drawer/`bottomSheetDrawerStyles` — leave them; they were just corrected in 517);
deleting or editing legacy `src/components/ui/navigation-menu.tsx` + its story; any product surface / Header / layout
migration (that is Phase 3); `MantineSelect`/`MantinePopover`/`MantineDropdownMenu` behavior.

## 🛑 STOP-and-ASK triggers
- If representing per-section content in ONE shared `ResponsiveBottomSheet` requires changing the Task 514 source
  (`responsiveBottomSheet.tsx`) rather than local `activeSectionIndex` state in the new component → **STOP and ASK.**
- If a real **icon-only** nav trigger case exists that needs an opt-out prop → **STOP and ASK** (do not invent it).
- If a link with `href` must be a real client-side navigation (`next/link`) vs a plain anchor in the story context and
  the correct choice is unclear → **STOP and ASK** (the story can use `href="#"` + `onClick` no-op; product wiring is
  out of scope).
- If the desktop panel should be `Menu` vs `Popover` and the two give materially different chrome for a links list —
  pick the one that matches §6d and DropdownMenu (Menu), and note the choice; only STOP-and-ASK if neither fits.

## Current behavior to preserve
- The Task 514 single source and `MantineDialogDrawerPattern` remain UNCHANGED.
- `grep "function DragHandle" src/design-system/mantine` STILL = **ONE match** after this task.
- Legacy `src/components/ui/navigation-menu.tsx` + `navigation-menu.stories.tsx` remain UNCHANGED (not deleted).
- Existing exports in `patterns/index.ts` unchanged except the ADDED `MantineNavigationMenu` lines.

## Required after-behavior
- **<640, section trigger:** full-width edge-to-edge, ≥44px; label wraps sq/en/uk/it; no clip, no h-scroll at 320.
  Tapping opens the full-width bottom sheet with THAT section's links (≥44px rows).
- **≥640:** horizontal nav bar; each trigger natural/content width (not stretched by a `Stack align:"stretch"` parent);
  clicking opens the anchored panel with the section's links.
- **Disabled section:** trigger no-op on both paths; width rule still applies to its resting render.

## Positive flow (happy path)
Actor at 320–390px sees a vertical stack of full-width section triggers (≥44px). 1) Taps "Products" → full-width bottom
sheet opens listing the Products links (drag handle centered, ≤90dvh scroll). 2) Taps a link → its `onClick`/nav fires +
sheet closes. At ≥640 the SAME sections render as a horizontal nav bar; clicking "Products" opens the anchored panel;
clicking a link fires it.

## Negative flow (every off-happy-path branch)
- **Disabled section trigger** → no panel/sheet on tap (both paths); resting render still full-width text (<640) /
  natural (≥640).
- **Disabled link inside a section** → dimmed (opacity 0.5), tap is a no-op, sheet stays open.
- **Empty `links: []` for a section** → sheet/panel opens showing a neutral "—" placeholder (mirror DropdownMenu's
  empty-items branch), no crash.
- **Parent is `Stack align:"stretch"`** → desktop triggers still render natural width (not stretched).
- **Backdrop tap / Esc** on the mobile sheet → closes without firing any link; focus returns to the section trigger.
- **Long uk label** (trigger + link) → wraps inside the full-width control at 320, no clip, no h-scroll.
- **SSR / first paint** → `useResponsiveDropdown` `isMobile=false` on first render → desktop nav on SSR; no flash
  (documented caveat, same as §20.2/§21.2).

## 🔴 Mobile <640 full-width gate (clauses 11–12)
Section triggers = full-width edge-to-edge at <640, stacked; each panel = full-width bottom sheet (Task 514 source), NOT
an anchored mini-menu, NOT a centered card. ≥44px touch targets; labels wrap (`whitespace-normal break-words`); no
h-scroll at 320. ≥640 = horizontal nav, natural-width triggers, anchored panels. Verify with RENDERED evidence, not tsc.

## 🔴 Zero hardcode / canonical-first (Task 426)
No raw colors/spacing/radius px; widths via Mantine props / the Task 516 wrapper mechanism, not raw CSS px (touch-target
`mih="2.75rem"` is the only rem exemption, per §7.1). All strings via `storyT()` ×4 (`storybook.mantine.nav_*`); any
`aria-label` via `t()` with sq/en/uk/it parity. No raw `<button>`/`<nav>` without Mantine `Box component="nav"`. No
duplicated `DragHandle`/`<Drawer>` — grep stays ONE match. Reuse the Task 514 foundation; do NOT re-implement it.

## 🔴 Rendered proof matrix (clause 12 + §8.2 — MANDATORY, produced from ACTUAL clicked-open renders)
Rows = `nav resting (triggers)` · `section trigger clicked → bottom sheet open (links)` · `disabled section` ;
columns = **uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320 · one ≥640 no-stretch cell (e.g. en@768)**.
Per cell confirm: section triggers FULL-WIDTH stacked at <640 and a horizontal natural-width nav at ≥640; open sheet is
edge-to-edge with a **centered** drag handle (517); long uk label wraps; no h-scroll@320. `tsc=0`/gates are BASELINE,
never proof. (Mantine proof path = toolbar-driven owner render review per §13/§16 — capture the cells from the actual
Storybook toolbar, not a description.)

## Acceptance criteria
1. `MantineNavigationMenu` exists with the literal API above and is exported from `patterns/index.ts`; renders a
   `<nav aria-label>` landmark. *(Scope 1)*
2. At <640 each section trigger renders full-width edge-to-edge (≥44px), stacked; verifiable in the diff (Task 516
   flex-column wrapper) AND the rendered matrix. *(Scope 2; clause 11; Positive flow 1)*
3. At <640 tapping a section trigger opens a full-width `ResponsiveBottomSheet` (Task 514 source) listing THAT section's
   links as ≥44px rows; item tap fires `onClick`/nav + closes; backdrop/Esc close + focus return. *(Scope 2; Positive +
   Negative flows)*
4. At ≥640 sections render as a horizontal nav bar with natural-width triggers (not stretched by `Stack align:"stretch"`)
   and anchored panels; verifiable in the diff AND a ≥640 rendered cell. *(Scope 2; clause 11; Negative: Stack-stretch)*
5. Disabled section = no-op both paths; disabled link dimmed + no-op; empty `links` → neutral "—", no crash. *(Negative
   flow)*
6. `grep "function DragHandle" src/design-system/mantine` = **ONE match**; `responsiveBottomSheet.tsx` UNCHANGED; legacy
   `navigation-menu.tsx` + story UNCHANGED. *(canonical-first; Task 514 integrity)*
7. Story: `skipCanvas:true` + `layout:'fullscreen'` + page-gutter Box; **Default only**; distinct-STATE sections
   (resting · disabled) with NO per-viewport section and NO `defaultOpened`; clicked-open + resting rendered matrix
   complete incl. uk@320/375/390 and a ≥640 no-stretch cell. *(Scope 3; clause 12; §8.2)*
8. Docs §22 added + tracker P1.20 → ✅ Task 518; `storybook.mantine.nav_*` keys with sq/en/uk/it parity (uk = real
   Cyrillic); no consumer API break. *(Scope 4; clause 7)*
9. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean
   (clause 14) — paste the transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit (each AC → file:line OR runtime step → ✅/❌) citing both flows
by name; walk the nav at `uk` 320px (section trigger full-width → tap → bottom sheet → link) AND at ≥640 (horizontal nav,
natural width, anchored panel) end-to-end before writing "complete". Add a **Files Changed table** to
`docs/sessions/2026-07-01-task518-navigation-menu-bottom-sheet.md` + the clause-12 rendered matrix, and update
`docs/backlog.md` Last Session. **Emit NO `git add`/`git commit`** — the orchestrator emits commits after diff review.
Do NOT start until you have read the Task 514 source + `MantineDropdownMenu.tsx` + §8.2 and confirmed the shared-drawer
`activeSectionIndex` approach (else STOP-and-ASK).
