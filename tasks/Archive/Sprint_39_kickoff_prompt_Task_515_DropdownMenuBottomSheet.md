# Task 515 — DropdownMenu → canonical Mantine, full-width bottom sheet <640 (Batch C, P1.19)

> **Program:** `docs/mantine-tailadmin-migration-tracker.md` → Phase 1 → Batch C overlays. Order: Modal ✅ · Drawer ✅ ·
> dropdown foundation ✅ (509) · Select ✅ (510) · Popover ✅ (513) · **single-source extraction ✅ (514)** →
> **P1.19 DropdownMenu (THIS TASK)** → P1.20 NavigationMenu → P1.22 Tooltip.
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews diff + clicked-open rendered matrix).
>
> **This overlay CONSUMES the Task 514 single source — it adds NO bottom-sheet code.** Use
> `useResponsiveDropdown` + `ResponsiveBottomSheet` from `src/design-system/mantine/patterns/responsiveBottomSheet.tsx`.
> Do NOT re-create a `DragHandle`, a `<Drawer>` block, or any bottom-sheet styles — that is a hard rejection (the whole
> point of Task 514).

## Why this task
Mantine `Menu` renders an anchored dropdown at every viewport. Below 640px that violates the owner P0
("ALL popups = full-width bottom sheet at <640" — `agent-contract.md` clause 11). DropdownMenu is the next overlay to
adopt the shared mechanism, the same way Popover (513) did.

## Pre-read (UI / overlay task — from `docs/rule-index.md`)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (SCAN — admin row-action menus
use dropdown menus; if a touched flow has a registry row, clause 15 applies; this task is foundation+story only, no
product surface).
**Required (FIRST READ):** `docs/mantine-responsive-design-system.md` — §7 mobile gate, **§8.2 (one section per STATE,
never per viewport; overlays open by real click — NO `defaultOpened` proof) — MANDATORY**, §12 patterns, §18 CSS pitfalls,
**§14/§19/§20 the existing overlay consumers + the §-section for the Task 514 single source** (read how Popover consumes
`ResponsiveBottomSheet`). Then `docs/ui-rules.md` (§15a mobile gate, §16 z-index, non-canonical-dropdown grep),
`docs/component-rules.md` (canonical-first, Task 426), `docs/qa-rules.md`, `docs/storybook-governance.md`.
**Study before coding (REUSE, do not modify):**
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` (the Task 514 single source — `useResponsiveDropdown`,
  `ResponsiveBottomSheet`, `DragHandle`).
- `src/design-system/mantine/patterns/MantinePopover.tsx` (the reference consumer — same span-onClick mobile mechanism).
- `src/components/ui/dropdown-menu.tsx` (legacy Radix menu — preserve its §6d item chrome, separators, destructive item).

## Scope (exactly this — no more)
1. **A canonical Mantine DropdownMenu** in `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` (match the
   `MantinePopover` file/location convention) that:
   - at **≥640** renders the normal anchored Mantine `Menu` (trigger + `Menu.Item`s, separators, destructive item) — desktop unchanged;
   - at **<640** renders the SAME menu items inside `ResponsiveBottomSheet` (full-width bottom sheet) as a tappable list,
     opened by a real trigger click via the same mechanism Popover uses (mobile span `onClick → openDrawer()`; NO
     `defaultOpened`). Selecting an item fires its action and closes the sheet; focus returns to the trigger.
2. **One items source for both paths.** To avoid `Menu.Item`-context coupling, take an **`items` array** (each:
   `label`, `onClick`, optional `icon`, `color` (e.g. destructive `'red'`), `disabled`) plus an optional separator marker,
   and render it as `Menu.Item`s at ≥640 and as ≥44px tappable rows in the sheet at <640. (If a children-based API is
   clearly better, **STOP and ASK** before choosing — do not invent silently.) Preserve a disabled-trigger no-op and
   per-item disabled.
3. **Document** the consumer in `mantine-responsive-design-system.md` (a §-row under the overlay area, pointing at the
   Task 514 single source — NO new bottom-sheet mechanism) and flip tracker **P1.19 → ✅**.
4. **Storybook story** (Mantine proof path), same convention as `Popover.stories.tsx`: `skipCanvas:true`,
   `layout:'fullscreen'`, single `Default`, toolbar-driven viewport+locale, `storyT()` against `storybook.mantine.*`.
   **🔴 Sections = DISTINCT STATES ONLY (§8.2): `trigger (closed/resting)` and `disabled`.** NO `open anchored` section,
   NO `open bottom sheet` section, NO `defaultOpened` anywhere. The open behavior (anchored ≥640 / bottom sheet <640) is
   verified by **clicking the trigger** and switching the toolbar viewport on that SAME trigger. Menu item labels come
   from `storyT()` (e.g. view / edit / a long-uk item for wrap stress / destructive delete) with sq/en/uk/it parity — the
   long-uk label is just one ITEM, never its own section.

**OUT OF SCOPE:** NavigationMenu (P1.20), Tooltip (P1.22); the Task 514 foundation (consume, never modify); MantineSelect /
MantinePopover; any product surface. No new bottom-sheet code of any kind.

## 🔴 STOP-and-ASK triggers
- If Mantine `Menu` controlled-open has the same v8 `onChange`-fires-current-value behaviour Popover hit, follow Popover's
  span-onClick mobile mechanism; if that does NOT work for `Menu` → **STOP and ASK** (do not fork a custom menu).
- If the items-array API can't represent an existing consumer's menu (icons, separators, destructive, nested) → **STOP and ASK.**
- If `useMediaQuery` SSR first-render `false` causes any flash on the trigger → **STOP and ASK** (same documented caveat).

## Current behavior to preserve
- Desktop (≥640): anchored Mantine `Menu`, §6d item chrome, separators, destructive item color, z-index — visually unchanged.
- Public API supports the existing menu use (trigger + items incl. icon/destructive/disabled) — no consumer break.
- The Task 514 single source and `MantineDialogDrawerPattern` are UNCHANGED.

## Required after-behavior
- At <640, clicking the trigger opens a full-width bottom sheet (drag handle, top-only radius, ≤90dvh internal scroll)
  listing the menu items as ≥44px tappable rows; tapping an item runs its `onClick` and closes the sheet; backdrop tap +
  Esc close without running any action; focus returns to the trigger.
- At ≥640, the anchored Mantine Menu opens on trigger click — unchanged.
- Zero new bottom-sheet code: the sheet is `ResponsiveBottomSheet` from the Task 514 single source.

## Positive flow (happy path)
Actor on 320–375px. 1) Sees the trigger. 2) Taps it → full-width bottom sheet slides up (handle, item rows). 3) Scrolls
items (≤90dvh, internal scroll, no page h-scroll). 4) Taps an item → its action fires, sheet closes, focus returns to
trigger. ≥640: step 2 opens the anchored Menu unchanged.

## Negative flow (every off-happy-path branch)
- **Backdrop tap / Esc** → sheet closes, NO item action fires, focus returns to trigger.
- **Disabled trigger** → tap is a no-op; no sheet/menu; no focus ring.
- **Per-item disabled** → that row is non-interactive (dimmed), tap does nothing; other items still work.
- **Destructive item** → red styling preserved in BOTH anchored menu and sheet row.
- **Empty items** → sheet/menu opens with a legible empty state; no crash.
- **Long uk item label** → wraps in the sheet row and the anchored item, no clip, no h-scroll at 320.
- **Keyboard / a11y** → trigger focusable; anchored Menu keeps arrow-key nav; sheet rows are focusable buttons in order.
- **SSR / first paint** → overlay closed on SSR; trigger renders server-side; no flash.
- **Rapid re-open / double-tap** → no duplicate sheets; open state controlled by `useResponsiveDropdown`.

## 🔴 Mobile <640 full-width gate (clauses 11–12)
At <640 the menu is the full-width edge-to-edge `ResponsiveBottomSheet` (drag handle, top-only radius, ≤90dvh internal
scroll, backdrop+Esc) — NOT an anchored mini-menu, NOT a centered card. Item rows ≥44px touch target. Long sq/en/uk/it
labels wrap (`whitespace-normal break-words`), never clip; no horizontal scroll at 320. ≥640 restores the anchored menu.

## 🔴 Zero hardcode / canonical-first (Task 426)
No raw colors (theme tokens / `var(--mantine-color-*)` / brand; destructive via Mantine `color="red"`), no raw spacing/
radius px (the bottom-sheet exemptions live ONCE in the Task 514 source — do not re-declare), no hardcoded strings
(`storyT()` ×4 in the story; any `aria-label` via `t()` with sq/en/uk/it parity), no raw `<button>`. **No duplicated
`DragHandle`/`<Drawer>`/bottom-sheet styles** — `grep "function DragHandle" src/design-system/mantine` must STILL be ONE
match after this task. Enforced by `check:design-tokens` + `check:i18n` + ESLint + orchestrator grep.

## Rendered proof matrix (clause 12 + §8.2 — MANDATORY)
**Produced from an ACTUALLY-CLICKED-OPEN menu — a `defaultOpened` snapshot is rejected.** Rows = `trigger closed` ·
`trigger clicked → open` · `disabled (click = no-op)`; columns = **uk@320 · uk@375 · uk@390 · en@320 · sq@320 · it@320**
(uk@320/375/390 mandatory). For the clicked-open row: at <640 confirm full-width bottom sheet (handle, ≥44px rows, ≤90dvh,
long uk wraps, no h-scroll); at ≥640 confirm anchored menu. Capture the click→open transition, not a baked-open element.
`tsc=0`/gates are a BASELINE, never proof.

## Acceptance criteria
1. `MantineDropdownMenu` exists (matches `MantinePopover` convention) and CONSUMES `useResponsiveDropdown` +
   `ResponsiveBottomSheet` from the Task 514 source — verifiable import; NO new bottom-sheet code. *(Scope 1; canonical-first)*
2. **Clicking the trigger OPENS** the overlay — anchored Menu ≥640, bottom sheet <640; NOT via `defaultOpened`. *(Positive flow 2–4; §8.2)*
3. Items render in BOTH paths from one source; tapping fires the action + closes the sheet; per-item disabled + destructive preserved. *(Scope 2; Negative flow)*
4. Backdrop tap + Esc close without firing an action; focus returns to trigger; disabled/empty/long-uk/SSR branches handled. *(Negative flow)*
5. `grep "function DragHandle" src/design-system/mantine` = ONE match (no re-duplication); no inline `<Drawer position="bottom">` added. *(canonical-first; Task 514 integrity)*
6. Story = DISTINCT-STATE sections only (`trigger` + `disabled`), NO per-viewport sections, NO `defaultOpened`; clicked-open rendered matrix complete incl. uk@320/375/390. *(Scope 4; clause 12; §8.2)*
7. Docs consumer-row added (points at Task 514 source); tracker P1.19 → ✅; locale parity sq/en/uk/it; no consumer API break. *(Scope 3; clause 7)*
8. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`, `check:mojibake`; file-integrity clean (clause 14) — paste the transcript.

## Self-validation & hand-off (hard contract)
Run `npx tsc --noEmit` → 0; paste an AC-by-AC self-audit (each AC → file:line OR runtime step → ✅/❌) citing both flows by
name; walk the DropdownMenu flow at `uk` 320px end-to-end (click → sheet → tap item) before writing "complete". Update
`docs/backlog.md` + add `docs/sessions/2026-06-30-task515-dropdown-menu-bottom-sheet.md` with a **Files Changed table** +
the clause-12 clicked-open rendered matrix. **Emit NO `git add`/`git commit`** — the orchestrator emits commits after diff
review. Do NOT start until you have read the Task 514 single source + §8.2 and confirmed the items-array API fits (else
STOP-and-ASK).
