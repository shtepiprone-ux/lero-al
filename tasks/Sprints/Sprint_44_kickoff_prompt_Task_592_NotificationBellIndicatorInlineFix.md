# Task 592 — Fix detached unread badge on `NotificationBellView` (Mantine `Indicator` missing `inline`)

**Sprint 44 · Epic MM Phase-2 · follow-up to the REJECTED Task 591.**
**Type:** UI / component (single primitive) · **Executor:** Sonnet 4.6 · **Orchestrator:** Opus 4.8.

---

## Why this task exists (root cause — already diagnosed by the orchestrator)

Task 591 migrated the header notification bell to Mantine but shipped a **rendered defect the owner
caught on sight**: the red unread-count badge (`2`) renders **detached at the far-right screen edge**,
at the bell's vertical level, instead of hugging the top-right corner of the bell icon.

**Confirmed root cause (verified against the shipped Mantine CSS, not a guess):**
`src/modules/notifications/components/NotificationBellView.tsx` renders `<Indicator …>` **without the
`inline` prop**. In `@mantine/core` v8 the Indicator root defaults to **`display: block`**:

```
/* node_modules/@mantine/core/styles/Indicator.css */
.m_e5262200 { position: relative; display: block; }
.m_e5262200:where([data-inline]) { display: inline-block; }
```

Because the root is a full-width block, the absolutely-positioned badge
(`.m_760d1fb1 { position:absolute; right: var(--indicator-right); … }`) anchors to the **right edge of
that stretched full-width block** — i.e. the far right of the container — instead of the bell. The
`inline` prop sets `data-inline` → `display:inline-block`, so the root shrinks to the bell's size and
the badge hugs the icon. This is the single, canonical fix.

Only ONE `@mantine/core` `Indicator` exists in the codebase (grep-confirmed: this file only), so this is
a single-site change — no sibling consumers to update (Note 14 satisfied by scope).

---

## Pre-read (task-type: UI / layout / component)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md`
(scan — notification bell is a header surface; confirm whether a registry flow is touched).
**Required (UI):** `docs/mantine-responsive-design-system.md` (esp. §18 pitfalls + §18.9 internal-chrome
visual check), `docs/tailadmin-style-reference.md`, `docs/ui-rules.md`, `docs/component-rules.md`,
`docs/qa-rules.md`.

---

## Scope (HARD — do not exceed)

- **Only** `src/modules/notifications/components/NotificationBellView.tsx` — add the `inline` prop to the
  `<Indicator>` (and nothing else on that element unless the render proves another attribute is needed to
  keep the badge on the bell across all four locales and all breakpoints).
- **No** changes to `NotificationBell.tsx`, `NotificationCenter.tsx`, `MantinePopover.tsx`, the story
  fixtures' data, or any locale file. If you believe another file must change, **STOP and ASK** — do not
  invent scope.
- No refactors, no "while I'm here" edits. Byte-identical everywhere except the Indicator attribute(s).

---

## Current behavior to preserve

- Bell = icon-only `ActionIcon` (clause-11 documented exemption), ≥44px (`mih/miw 2.75rem`).
- Badge shows unread count, `99+` above 99, **hidden when `unreadCount === 0`** (`disabled` prop), red.
- Click opens the panel: anchored dropdown ≥640, **full-width bottom sheet <640** (drag handle, ≤90dvh
  scroll, backdrop-tap + Esc close). Panel content (`NotificationCenter`) unchanged.
- Desktop path already looks correct today — the fix must **not** regress it.

## Required after-behavior

The badge hugs the **top-right corner of the bell icon** in every context (Storybook `Stack`, the real
header row, mobile and desktop), in all four locales, at every canonical breakpoint. Nothing else about
the bell, badge count logic, or panel changes.

---

## Positive flow (happy path)

1. Actor: any authenticated user with ≥1 unread notification. Precondition: `unreadCount = 2`.
2. Bell renders with the badge `2` **overlapping the bell's top-right corner** (not at the container edge).
3. User clicks the bell → panel opens (dropdown ≥640 / bottom sheet <640). Success state unchanged from 591.
4. Post-conditions: no DB/logic change; badge remains attached to the bell before and after open/close.

## Negative flow (every off-happy-path branch)

- **`unreadCount === 0`** → `Indicator` `disabled` → **no badge dot at all** (verify the `inline` change
  does not make an empty dot appear). Bell still clickable, panel still opens (empty/all-read states).
- **`unreadCount > 99`** → badge shows `99+`, still hugging the bell corner, label not clipped.
- **Long-locale panel content (uk)** → badge position independent of panel width; no shift, no clip,
  no horizontal scroll at 320.
- **Mobile <640** → badge on bell in the trigger; panel is the full-width bottom sheet (unchanged).
- **Empty notifications** → no "mark all read", localized empty message (unchanged from 591).

---

## Mobile <640 full-width gate

Unchanged from 591 and still enforced: bell trigger = **icon-only exemption** (documented, ≥44px); the
panel popup is a **full-width edge-to-edge bottom sheet** at <640 with drag handle. This task touches only
the badge attachment and must not alter the sheet behavior. Verify the sheet is still full-width at
uk@320/375/390.

## TailAdmin conformance

Badge = semantic error/red per `tailadmin-style-reference.md` (`red.5`, already in place). No new
color/px/radius invented. Bell chrome (`variant="default"`) unchanged.

---

## Acceptance criteria (each must be verifiable)

1. Diff adds `inline` to `<Indicator>` in `NotificationBellView.tsx` (Positive flow step 2). **file:line.**
2. `unreadCount === 0` still renders **no badge** (Negative flow branch 1) — rendered evidence. **file:line** (the `disabled` prop is retained).
3. **Rendered verification matrix** (agent-contract clause 12): the bell trigger captured with the badge
   **on the bell corner** at 320·375·390·768·1280 × sq·en·uk·it, with **uk@320/375/390 mandatory**. The
   badge-on-bell pixel must be visible in the PNG — a green `screenshots:assert` geometry count is **NOT**
   sufficient (it is blind to badge position — this is exactly what let 591 through; §18.9 / clause-12).
4. `screenshots:assert --mantine-only` re-run: zero regression vs the Task 591 cell count (the 16 bell
   cells still pass; no new fails).
5. Gates: `tsc=0`, eslint clean, `check:stories` green, `check:i18n` parity unchanged (no new key),
   file-integrity clean, `check:mojibake` clean (once the deleted legacy story from 591 is staged — flag
   if still blocked).
6. Session log includes the AC-by-AC self-audit, the Files Changed table (one row + rationale), the
   rendered matrix, and a **UX flow trace**. No `git add`/`git commit` emitted by the executor.

**Note for the executor:** the orchestrator will personally open the rendered PNGs and confirm the badge
sits on the bell (not the geometry PASS count) before approving. A green gate with a detached badge = the
591 failure and will be rejected again.
