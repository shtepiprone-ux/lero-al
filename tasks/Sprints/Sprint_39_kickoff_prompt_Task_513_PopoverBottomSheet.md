# Task 513 (REWORK) — Popover → canonical Mantine, full-width bottom sheet <640 (Batch C, P1.18)

> **🔴 REWORK (owner-rejected first pass, 2026-06-30).** The first 513 implementation shipped TWO defects that
> this rework MUST fix; both are now hard rules in `docs/mantine-responsive-design-system.md §8.2`:
> 1. **Per-viewport duplicate sections** — the story had `open anchored — switch ≥640` AND `open bottom sheet —
>    switch <640`, i.e. the SAME open state duplicated per breakpoint. This is the exact anti-pattern removed from
>    Select in Task 511. **Forbidden.** Sections = distinct STATES only; viewport is proven by the toolbar on ONE
>    section. (This was an orchestrator kickoff error — the first kickoff literally listed per-viewport sections.)
> 2. **Click-to-open is broken** — tapping the trigger does NOTHING; the popover/sheet only appeared because of a
>    load-time `defaultOpened` snapshot. The real user gesture MUST open it. A `defaultOpened`-only "proof" is
>    rejected. Fix the trigger handler so click/tap opens the overlay (anchored ≥640 / bottom sheet <640), and
>    prove it with an actually-clicked-open render.
> **Read `docs/mantine-responsive-design-system.md §8.2` before touching the story.**

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → **Batch C (overlays)**. Order:
> P1.16 Modal ✅ / P1.17 Drawer ✅ (canonical via `MantineDialogDrawerPattern`, Task 482) · **dropdown
> foundation** ✅ (Task 509: `useResponsiveDropdown` + `bottomSheetDrawerStyles`, proven on Select 510) →
> **P1.18 Popover (THIS TASK)** → P1.19 DropdownMenu → P1.20 NavigationMenu → P1.22 Tooltip.
> **Executor:** Sonnet 4.6 (writes code). **Orchestrator:** Opus (this kickoff; reviews the rendered story
> side-by-side at <640 × 4 locales).
>
> **This is the first Batch C overlay that CONSUMES the Task 509 foundation.** The mechanism already exists —
> Popover must reuse it, not re-invent a bottom sheet.

## Why this task (root-cause)
Mantine `Popover` renders its dropdown as an anchored mini-popover on every viewport. Below 640px that
**violates the owner P0** ("ALL popups = full-width bottom sheet at <640, no exceptions" — `agent-contract.md`
clause 11). Task 509 built the reusable dropdown→bottom-sheet mechanism and proved it on Select; Popover is the
next overlay to adopt it so the whole Batch C converges on ONE bottom-sheet source.

## Pre-read (UI / overlay task — from `docs/rule-index.md`)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (SCAN — if a Popover
consumer flow has a registry row, clause 15 applies; this task is foundation+story only, no product surface).
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` — §7 mobile gate, §11 overlay map (the
P0-popup-gate row + DialogDrawerPattern rows), **§12 canonical patterns (incl. the Task 509 dropdown-bottom-sheet
sub-section — the pattern you are consuming)**, **§18 Mantine theming/CSS pitfalls (MANDATORY before any overlay/CSS
styling)**. Then `docs/ui-rules.md` (§15a mobile gate, §16 z-index, non-canonical-dropdown grep), `docs/component-rules.md`,
`docs/qa-rules.md`, `docs/storybook-governance.md`.
**Study before coding (do NOT modify):**
- `src/design-system/mantine/patterns/` → the **Task 509 foundation** (`useResponsiveDropdown` /
  `bottomSheetDrawerStyles`) and `MantineSelect.tsx` (the reference consumer — copy its pattern).
- `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` (the P0 bottom-sheet treatment the foundation wraps).
- `src/components/ui/popover.tsx` (the legacy Radix Popover whose §6d chrome/behavior must be preserved for consumers).
- `src/design-system/mantine/theme.ts` (`Popover` defaults, if any) + `input-chrome.css` (do NOT regress).

## Scope (exactly this — no more)
1. **A canonical Mantine Popover** in the design-system layer (`src/design-system/mantine/patterns/MantinePopover.tsx`,
   or the exact file/location convention `MantineSelect` already uses — **match it; do not invent a new structure**)
   that, at `<640` (`max-width: 40em`), renders its dropdown **content as a full-width bottom sheet by CONSUMING the
   Task 509 foundation** (`useResponsiveDropdown` + `bottomSheetDrawerStyles`): edge-to-edge, top-only radius, centered
   drag handle, ≤90dvh + internal scroll, backdrop tap + Esc to close, focus returns to the trigger. At `≥640` the
   normal anchored Mantine `Popover` is used, unchanged.
2. **Preserve the §6d/desktop chrome and the public API** so existing Popover consumers (trigger + arbitrary content)
   keep working with no prop break.
3. **Document** that Popover now consumes the canonical dropdown-bottom-sheet (a row/note in
   `docs/mantine-responsive-design-system.md` §12 overlay area + a pointer in `docs/tailadmin-style-reference.md`),
   and flip the tracker row P1.18 to ✅ in `docs/mantine-tailadmin-migration-tracker.md`.
4. **Storybook story** (Mantine proof path) for Popover — **same group/location convention as `Select.stories.tsx`**
   (`skipCanvas:true`, `layout:'fullscreen'`, single `Default`, toolbar-driven viewport+locale, `storyT()` against
   `storybook.mantine.*`). **🔴 Sections = DISTINCT STATES ONLY (per §8.2): `trigger (closed/resting)` and
   `disabled`.** NO `open anchored` section, NO `open bottom sheet` section, NO `defaultOpened` prop anywhere — the
   open behavior (anchored ≥640 / full-width bottom sheet <640) is verified by **clicking the trigger** and switching
   the toolbar viewport on that SAME trigger. No `parameters.layout:'centered'|'padded'`, no `Ukrainian*`/per-viewport
   export.

**OUT OF SCOPE (do NOT touch):** DropdownMenu (P1.19), NavigationMenu (P1.20), Command/Combobox (P1.21), Tooltip
(P1.22) — those are later Batch C/D items that consume the SAME foundation; the Task 509 foundation itself (reuse,
do not modify — see STOP-and-ASK); `MantineDialogDrawerPattern`; `MantineSelect`; any product surface
(`src/app/**`, `src/components/**` beyond reading the legacy `popover.tsx`).

## 🔴 STOP-and-ASK triggers (do NOT invent architecture — `agent-contract.md` clause 2)
- If the Task 509 foundation hook/wrapper is **Select-options-shaped** and does NOT cleanly accept Popover's
  **arbitrary children content** in the bottom sheet → **STOP and ASK** before generalising/forking the foundation.
  (Generalising the foundation is allowed only with owner sign-off, since it changes the shared single source.)
- If Mantine `Popover` positioning/`withinPortal`/`trapFocus` conflicts with rendering its content inside the foundation
  `Drawer` at <640 (double-portal, focus-trap fight) → **STOP and ASK** rather than papering over it.
- If `useMediaQuery` SSR first-render `false` (the documented foundation caveat) causes any flash/layout shift on the
  Popover trigger or content → **STOP and ASK**.

## Current behavior to preserve
- Popover desktop (≥640): anchored dropdown, existing §6d chrome, z-index, arrow/offset — visually unchanged.
- Public API: trigger element + content children + `opened/onChange/position/disabled` (whatever the current API is) —
  **no consumer break**.
- The Task 509 foundation and `MantineDialogDrawerPattern` remain UNCHANGED (consume, don't edit).

## Required after-behavior
- At `<640`, opening the Popover slides up a full-width bottom sheet (drag handle, top-only radius, ≤90dvh internal
  scroll) containing the Popover content; backdrop tap + Esc close it; focus returns to the trigger.
- At `≥640`, the Popover opens the normal anchored dropdown — unchanged.
- Mechanism = the shared Task 509 foundation (no copy-paste of the bottom-sheet style block).

## Positive flow (happy path)
Actor: user on a 320–375px viewport. 1) Sees the Popover trigger. 2) Activates it → a full-width bottom sheet slides up
from the bottom edge, edge-to-edge, rounded top corners, centered drag handle, backdrop dims the page. 3) Interacts with
the content (scrolls ≤90dvh, internal scroll, no page h-scroll). 4) Dismisses (action/selection/close) → sheet closes,
focus returns to trigger. Post-conditions: same `onChange`/close callbacks as desktop; pure UI, no DB/network. On `≥640`:
step 2 opens the anchored popover unchanged.

## Negative flow (every off-happy-path branch)
- **Backdrop tap** → sheet closes, no action committed, focus returns to trigger.
- **Esc key** → sheet closes, focus returns to trigger.
- **Disabled trigger** → activation does NOT open the sheet/popover; no focus ring; documented exemption if icon-only.
- **Empty content** → sheet opens with legible empty state; no crash.
- **Long uk content string** → wraps inside the sheet, no clip, no h-scroll at 320.
- **Keyboard / a11y** → trigger focusable; sheet is an accessible dialog (focus trap, aria roles preserved by the
  foundation Drawer); content tab order intact.
- **SSR / first paint** → overlay closed on SSR, trigger renders server-side, no flash (document the `useMediaQuery` caveat).
- **Rapid re-open / double-activate** → no duplicate sheets; open state controlled.

## 🔴 Mobile <640 full-width gate (OWNER P0 — clauses 11–12)
At `<640` the Popover dropdown is the full-width edge-to-edge bottom sheet (top-only radius, drag handle, ≤90dvh, internal
scroll, backdrop+Esc) — NOT an anchored mini-popover, NOT a centered card, NOT `max-w-[calc(100%-2rem)]`. Option/action
rows ≥44px touch target. Long sq/en/uk/it strings wrap (`whitespace-normal break-words`), never clip; no horizontal scroll
at 320. The trigger itself follows its surface's full-width rule (icon-only triggers are the only exemption, listed +
justified). At `≥640` the anchored desktop popover is restored unchanged.

## 🔴 Zero hardcode
No raw colors (theme tokens / `var(--mantine-color-*)` / brand only), no raw spacing/radius px except the justified
bottom-sheet exemptions the foundation already uses (drag-handle sizing, `90dvh`, `2.75rem` touch min), no hardcoded
user-facing strings (`storyT()` ×4 in the story; any new `aria-label` via `t()` with sq/en/uk/it parity), no raw
`<button>`. Enforced by `check:design-tokens` + `check:i18n` + ESLint; orchestrator also greps the diff for raw hex /
raw px / string literals.

## Rendered proof matrix (clause 12 + §8.2 — MANDATORY, orchestrator verifies side-by-side)
**Produced from an ACTUALLY-CLICKED-OPEN popover — a `defaultOpened` snapshot is rejected.** Rows = `trigger closed` ·
`trigger clicked → open` · `disabled (click = no-op)`; columns = **uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320**
(uk@320/375/390 mandatory stress cells). For the `clicked → open` row: at <640 confirm the dropdown is a full-width
edge-to-edge bottom sheet (drag handle, top-only radius, ≤90dvh internal scroll, no page h-scroll, rows ≥44px, long label
wraps); at ≥640 confirm the anchored popover. **Capture the click→open transition** (trigger before, overlay after), not a
pre-opened element. `tsc=0`/`check:stories`/build-green is a BASELINE, NEVER proof — machine-produced
`responsive-screenshots --assert` artifacts required.

## Acceptance criteria (each maps to a flow; verifiable in the diff/render)
1. `MantinePopover` exists in the design-system layer, matching `MantineSelect`'s file/location convention, and
   **consumes the Task 509 foundation** (`useResponsiveDropdown`/`bottomSheetDrawerStyles`) — verifiable import, no
   duplicated bottom-sheet style block. *(Scope 1)*
2. **Clicking/tapping the trigger OPENS the overlay** (the rejected first pass did nothing) — anchored popover at ≥640, full-width bottom sheet at <640; chrome/z-index/api intact (file:line). NOT via `defaultOpened`. *(Positive flow 2–4; Mobile gate; §8.2)*
3. Backdrop tap + Esc both close the sheet; focus returns to trigger — each branch a verifiable handler/guard. *(Negative flow)*
4. Disabled, empty, long-uk, SSR-no-flash branches handled per Negative flow. *(Negative flow)*
5. Documented in `mantine-responsive-design-system.md` §12 (+ pointer in `tailadmin-style-reference.md`); tracker P1.18 → ✅. *(Scope 3)*
6. Story has DISTINCT-STATE sections only (`trigger closed` + `disabled`) — NO per-viewport `open` sections, NO `defaultOpened` prop (§8.2); rendered matrix produced from an actually-clicked-open overlay, complete incl. uk@320/375/390; zero clip/overflow/h-scroll. *(Scope 4; clause 12; §8.2)*
7. Zero hardcode; locale parity sq/en/uk/it; no Popover consumer API break; foundation + DialogDrawerPattern + MantineSelect untouched. *(Scope; clauses 7, 11)*
8. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean
   (clause 14: 0 NUL, parses, not truncated) — paste the green transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit table (each AC → file:line OR runtime step → ✅/❌) citing both
flows by name; walk the Popover flow at `uk` 320px end-to-end before writing the "complete" line. Update `docs/backlog.md`
+ add `docs/sessions/2026-06-30-task513-popover-bottom-sheet.md` with a **Files Changed table** (one row per touched path
+ 1-line rationale) and the clause-12 rendered matrix. **Emit NO `git add`/`git commit`** — the orchestrator emits commits
after diff review. Do NOT start until you have read the Task 509 foundation files and confirmed the hook accepts arbitrary
content (else STOP-and-ASK per the triggers above).
