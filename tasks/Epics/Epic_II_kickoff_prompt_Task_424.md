# Task 424 kickoff — NotificationBell / NotificationCenter mobile bottom-sheet compliance (§26.2)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. This is a **UI / responsive task** (mobile <640 popup compliance). **The orchestrator (Opus) emits
> all `git add`/`git commit` commands at review; you NEVER run git.**
> **Origin:** follow-up from the Task 319 review (2026-06-13). Task 319 (notification locale-binding, Model C) correctly
> STOPPED-&-ASKED on the notification popup container instead of widening scope: the notification popup is a hand-rolled
> anchored dropdown, NOT a canonical §26.2 bottom sheet, so at 320px it can create document-level horizontal scroll. The
> Task 319 kickoff's mobile-gate wording conflicted (it asked to "verify no h-scroll at 320" while forbidding any
> container change) — that conflict is RESOLVED here: **319 fixed text/locale; 424 fixes the popup container.**

```
Type:        bug (mobile <640 popup gate — pre-existing P0 violation)
Priority:    high (owner P0 mobile gate; CLAUDE.md "MOBILE <640px = FULL WIDTH … ALL POPUPS = FULL-WIDTH BOTTOM SHEET")
Area:        src/modules/notifications/components/NotificationBell.tsx
             src/modules/notifications/components/NotificationCenter.tsx
             (+ NotificationItem.stories.tsx / a NotificationCenter story IF needed for the rendered-proof matrix)
Output:      The notification popup renders as a canonical full-width bottom sheet at <640px (edge-to-edge,
             bottom-anchored, rounded-top, drag handle, ≤90dvh internal scroll, backdrop+Esc dismiss, focus return),
             while the ≥640px desktop anchored dropdown is unchanged. No document-level horizontal scroll at 320px in
             any of sq/en/uk/it. All existing notification controls/behaviors preserved.
```

---

## Goal (concrete)

`NotificationBell.tsx` opens the panel with a **hand-rolled** overlay — `<div role="dialog" className="absolute right-0
top-full mt-2 z-50">` (lines 66-77) — wrapping `NotificationCenter.tsx`, whose root is a **fixed-width** panel:
`<div className="w-80 max-h-120 …">` (line 31). `w-80` = 20rem = 320px. At a 320px viewport an anchored, fixed-320px
panel positioned `right-0` does not fit the full-width bottom-sheet contract and can push **document-level horizontal
scroll** — exactly the gap the Task 319 per-element QA could not cover. Because the popup bypasses the canonical Base-UI
overlay primitives, it never received the Task 421 §26.2 bottom-sheet treatment that `Dialog`/`Sheet`/`Popover`/`Select`/
`Combobox`/`DropdownMenu` already have.

Make the notification popup §26.2-compliant at `<640px` **without** changing the desktop (`≥640px`) anchored-dropdown
behavior.

## Owner / orchestrator decisions (LOCKED — do NOT re-open; STOP & ASK if anything else is ambiguous)

1. **`<640px` = full-width bottom sheet** per `docs/design-system.md` §26.2: bottom-anchored, edge-to-edge (NO `w-80`,
   NO `max-w-*` leaking below 640), **rounded TOP corners only**, slide-up animation, **`≤90dvh`** height with internal
   vertical scroll, **drag-handle bar** (small centered grabber) at the top, **≥44px** touch targets, labels
   `whitespace-normal break-words`, **NO horizontal scroll at 320**.
2. **`≥640px` = UNCHANGED** — the existing anchored dropdown (`absolute right-0 top-full mt-2`, `w-80 max-h-120`) is the
   desktop pattern and must look/behave exactly as today. The bottom-sheet treatment is `max-sm`-only.
3. **Prefer the canonical primitive over hand-rolled overlay.** Replace the hand-rolled `absolute` div + the two manual
   `mousedown`/`Escape` effects with the project's canonical overlay primitive that already implements §26.2 (a `Sheet`
   `side="bottom"` for `<640`, or the canonical `Popover`/`Dialog` that carries the Task-421 bottom-sheet classes).
   **Read `docs/design-system.md` §26.2 + §14 and an already-converted popup (e.g. the Combobox mobile bottom sheet,
   `z-[9999]`, referenced in §-z-index) to match the exact pattern BEFORE writing code.** If the cleanest compliant
   solution genuinely requires a primitive that does not yet exist or a structural choice not covered by §26.2 (e.g.
   full-screen vs `≤90dvh` bottom sheet for this specific surface), **STOP & ASK** — do not guess.
4. **Do NOT alter `NotificationItem.tsx`** (Task 319's surface) beyond what is mechanically required to host it inside the
   new bottom sheet. Its locale rendering, click-to-read, keyboard, unread dot, link wrapper, and time formatting stay.

## Pre-read (mandatory — do NOT "read all docs")

1. **Always:** `docs/agent-contract.md` (clauses 1–14) · `docs/backlog.md`.
2. **`docs/design-system.md`** — **§26** (full-width gate + §26.2 popup bottom-sheet contract; §26.4 icon-only
   exemptions; §26.5 PASS/FAIL), **§14** (overlays), **§27** (Storybook responsive-proof contract — what
   `screenshots:assert` does/does NOT prove), and the z-index scale section (canonical overlay z + the `z-[9999]`
   Combobox bottom-sheet allowlist).
3. `docs/ui-rules.md` · `docs/component-rules.md` · `docs/qa-rules.md`.
4. **Only if relevant:** `docs/responsive-screenshot-governance.md` (§MQ machine-detection limits) ·
   `docs/storybook-governance.md` (§14 gates) — needed because the rendered proof is a story matrix.
5. **Source to match:** the canonical overlay primitive used by an already-§26.2-compliant popup (Combobox/Select/Sheet);
   the current `NotificationBell.tsx` + `NotificationCenter.tsx` (to preserve every control).

## Current behavior to preserve (Note 20 / clause 3 — this task removes NO controls)

Inventory (verify in the session log before/after):

- **Bell trigger** (`Button variant="ghost" size="icon"`): unread badge (`99+` cap), `aria-label`, `aria-expanded`,
  `aria-haspopup`, open/close toggle, open-state styling.
- **Panel open/close:** outside-click close (currently manual `mousedown` effect), **Esc** close (manual `keydown`
  effect), `role="dialog"` + `aria-label`. After the change these MUST still work — via the canonical primitive's
  built-in backdrop-tap + Esc + **focus-return-to-trigger** (a §26.2 requirement the current hand-rolled version does
  NOT fully implement — gaining it is allowed, losing any current behavior is not).
- **Header:** title, **"Mark all read"** button (`CheckCheck` icon, `markAllNotificationsRead`, pending-disabled state),
  only shown when `hasUnread`.
- **List:** scrollable (`overflow-y-auto divide-y`), **empty state** (`t('empty')`), each row = `NotificationItem`
  (click-to-read, link, keyboard, unread dot, locale text from Task 319).
- **Loading:** `NotificationBell` returns `null` while `loading` — preserve.
- **Data:** `useNotifications()` (`notifications`, `unreadCount`, `loading`, `refetch`) and `onRead`/`refetch` wiring —
  unchanged.

## Positive flow (happy path)

- **Actor:** a signed-in user on a `<640px` viewport (e.g. uk@320) taps the bell in the header.
1. Panel opens as a **full-width bottom sheet**: edge-to-edge, bottom-anchored, rounded-top, slide-up, drag handle at top.
2. Header (title + "Mark all read" when unread) and the scrollable list render; long uk/it strings wrap; list scrolls
   internally within `≤90dvh`; **the document body does NOT scroll horizontally at 320px**.
3. Tapping a `NotificationItem` marks it read (unread dot clears, count updates) and, if it has a `link`, navigates.
4. "Mark all read" clears all unread; backdrop tap OR Esc closes the sheet; **focus returns to the bell trigger**.
- **Desktop (`≥640px`):** the bell opens the SAME anchored `w-80` dropdown as today (no bottom sheet) — unchanged.

## Negative flow (every off-happy-path branch — implement/verify ALL)

- **Empty list:** bottom sheet shows the `t('empty')` centered empty state; no h-scroll; closes normally.
- **Backdrop tap / Esc:** closes the sheet, focus returns to trigger (both `<640` and `≥640`). No stuck overlay.
- **Loading:** bell still renders `null` while loading (no empty sheet flash).
- **Long-label stress (uk/it @320):** every header/button/row label wraps (`whitespace-normal break-words`), no clip,
  **no document-level horizontal scroll** — this is the explicit gap Task 319 could not prove; it MUST be proven here.
- **Many notifications (overflow):** list scrolls internally within `≤90dvh`; the sheet itself does not exceed the
  viewport; background does not scroll behind it.
- **Mark-all double-tap:** existing `isPending` guard preserved (no double mutation).
- **Resize across 640 while open:** crossing the breakpoint swaps bottom-sheet ⇄ anchored-dropdown without breaking
  open state or focus (verify; if the canonical primitive can't do this cleanly, document the accepted behavior).
- **Desktop unaffected:** at `≥640` the anchored dropdown position/size/behavior is byte-for-byte the prior UX.

## Acceptance criteria (each maps to a flow / decision)

- At `<640px` the notification popup renders as a §26.2 full-width bottom sheet (edge-to-edge, bottom-anchored,
  rounded-top, drag handle, `≤90dvh` + internal scroll, ≥44px targets, labels wrap) — `w-80`/anchored-`absolute` no
  longer applies below 640. At `≥640px` the desktop anchored dropdown is unchanged (decisions 1–2).
- **No document-level horizontal scroll at 320px** in sq/en/uk/it (the core fix) — proven by the rendered matrix, NOT
  only per-element wrap.
- Backdrop tap + Esc close the sheet and **return focus to the bell trigger**; outside-click still closes on desktop.
- Every control in the "Current behavior to preserve" inventory remains and works (Note 20 before/after table in the log).
- **Clause 12 rendered matrix:** rows = 320·375·390·768·1280·1440·2560 (uk@320/375/390 mandatory), columns = sq·en·uk·it;
  each `<640` cell proves: bottom-sheet (not anchored card), edge-to-edge, no document h-scroll, labels wrap; each `≥640`
  cell proves the desktop dropdown is unchanged. **Machine-produced** `responsive-screenshots --assert` PNG/JSON for the
  story (clause 13); "no browser access"/self-reported PASS = auto-reject.
- **Clause 13 story gate:** if a story is added/changed, no hardcoded strings (use `t()`/`storyT()` with sq/en/uk/it
  parity), no `layout:'centered'|'padded'` (use the full-width `withCanvas` + `layout:'fullscreen'`), no `/Ukrainian/`
  export, no raw `<button>`; `npm run check:stories` green.
- **Clause 9/14:** `npx tsc --noEmit` 0 errors; `npm run build` passes; AC-by-AC self-audit + "Self-validation:" line;
  read-back + GREEN file-integrity transcript (`tr -cd '\000'`=0, no BOM, `tsc`) for every touched file.
- **Clause 10:** `docs/backlog.md` updated; session log under `docs/sessions/` with a **"Files Changed" table**; executor
  emits **NO** git.
- **Locale parity:** any new/changed user-facing string covers sq/en/uk/it (clause 7). (Likely none new — reuses existing
  `notifications.*` keys.)

## Out of scope

- **`NotificationItem.tsx` locale logic / Task 319 work** — do not re-open; only host it inside the new sheet.
- **Other popups** — this task fixes ONLY the notification popup. Do not sweep other surfaces (separate gate work).
- **Notification data layer / `useNotifications` / mutations** — unchanged.
- **Desktop (`≥640`) dropdown redesign** — keep identical; only the `<640` rendering changes.
- **Any `git add`/`git commit`** — orchestrator emits commits at review (clause 10).
- **§26.6 exempt surfaces** (image lightbox, etc.) — irrelevant here; do not touch.
```
