# Task 593 — `NotificationCenter` mark-all button: left-align label after icon + wrap to its own row <390px

**Sprint 44 · Epic MM Phase-2 · owner-flagged from the Task 592 render.**
**Type:** UI / component (single primitive) · **Executor:** Sonnet 4.6 · **Orchestrator:** Opus 4.8.

---

## Why this task exists (owner-reported, from the live 592 render)

With the unread badge now fixed (Task 592), the owner reviewed the opened notification panel and rejected the
**"mark all read" button's chrome**:

1. Its label renders **centre-aligned** — when the text wraps to two lines (it does at narrow widths and in the
   longer locales: uk "Позначити всі як прочитані", sq "Shëno të gjitha si të lexuara", it "Segna tutte come
   lette"), the wrapped lines are centred under the icon, which the owner calls "хаос" (chaos). The owner wants
   the label to **start at the left, immediately after the check icon**, and wrap left-aligned.
2. At **very narrow widths (<390px)** the button is crammed onto the same row as the panel title
   ("Сповіщення" / "Notifications" / …), squeezing both. The owner wants the button to **drop to its own row,
   below the title**, at `<390px`.

Owner decision (2026-07-14, via orchestrator question): on its own row `<390px`, the button is **full-width with
its content (icon + label) flush-left** — this satisfies the label-left-alignment request AND the clause-11
`<640` full-width gate simultaneously.

---

## Pre-read (task-type: UI / layout / component)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan —
mark-all-read is a notifications action; the call/logic is untouched here, confirm no registry flow is affected).
**Required (UI):** `docs/mantine-responsive-design-system.md` (esp. **§18 Mantine theming/CSS pitfalls** — for
Button label alignment prefer Mantine's own `justify` / `fullWidth` props or `styles.label` over ad-hoc CSS; and
**§18.9 internal-chrome visual check**), `docs/tailadmin-style-reference.md` (§6a / §6a-link Button chrome),
`docs/ui-rules.md` (§15 control heights, §17 UI pre-flight checklist), `docs/component-rules.md`, `docs/qa-rules.md`.

---

## Scope (HARD — do not exceed)

- **Only** `src/modules/notifications/components/NotificationCenter.tsx` — the header row (`div` with the title
  `<p>` + the mark-all `<Button>`) and the `<Button>`'s own alignment/width props.
- **No** logic change: `useTransition`, `markAllNotificationsRead`, `onRead`, `disabled={isPending}`, the
  `hasUnread` guard, the list/empty-state markup, `NotificationItem` map — all byte-identical.
- **No** new i18n key (`notifications.mark_all_read` already exists in all four locales — do not touch locale
  files). **No** changes to `NotificationBellView.tsx`, `NotificationBell.tsx`, `MantinePopover`, or the story
  fixtures' data. If you believe another file must change, **STOP and ASK** — do not invent scope.
- No refactors, no "while I'm here" edits.

---

## Current behavior to preserve

- Header row: title (`t('title')`) on the left, mark-all button on the right, in a
  `flex items-center justify-between px-4 py-3 border-b` row. Button shown only when `hasUnread`.
- Button: Mantine `Button variant="transparent" color="brand"`, `leftSection={<CheckCheck size={14} />}`,
  label `t('mark_all_read')`, `disabled={isPending}`, click → `handleMarkAll`. `§6a-link` chrome (brand-tinted
  link button) — unchanged.
- Panel open/close, list, empty state, item navigation, realtime updates — all unchanged.

## Required after-behavior

1. **Label always left-aligned:** the icon then the text start at the left of the button's content box, and when
   the text wraps it wraps **left-aligned** (no centred lines) — at every width and in all four locales.
2. **`≥390px`:** the header keeps its current single-row layout (title left, button right of it). The button is a
   compact inline header action at content width — see the clause-11 exemption note below. The only visible
   change vs today at these widths is the label's internal left-alignment.
3. **`<390px` (i.e. the 320 and 375 canonical cells):** the button drops onto its **own row directly below the
   title**, spanning the **full available width** of the sheet body, with its icon + label **flush-left**. The
   title occupies row 1; the button occupies row 2. No horizontal scroll at 320.
4. Nothing else about the button (count/logic/disabled/brand colour/icon) or the panel changes.

---

## Positive flow (happy path)

1. Actor: authenticated user with ≥1 unread notification (`hasUnread === true`); panel open.
2. **At ≥390px:** title and button share row 1; the button's label reads left-to-right starting after the check
   icon; if it wraps, subsequent lines stay left-aligned.
3. **At <390px:** row 1 = title; row 2 = the full-width button, icon+label flush-left.
4. User clicks the button → `handleMarkAll` → `markAllNotificationsRead()` → `onRead()` → unread cleared →
   `hasUnread` false → button unmounts (unchanged). Post-conditions: no logic/DB change beyond today's.

## Negative flow (every off-happy-path branch)

- **`!hasUnread` (all-read / empty):** button not rendered at all (unchanged) — verify the layout change does
  not leave an empty second row or shift the title. Empty-state localized message unchanged.
- **`isPending` (in-flight / double-click):** button `disabled`, second click no-ops (unchanged); alignment and
  row placement identical while disabled.
- **Long-locale label (uk / sq / it) at <390:** full-width button, label wraps **left-aligned** within the row,
  no clip, no overflow, no h-scroll@320.
- **Long-locale label at 390–639 (in-row):** label left-aligned; if it wraps, it wraps left; the title must not
  be pushed off or clipped. If at some width the in-row layout cannot fit without clipping, **STOP and ASK**
  rather than silently changing the ≥390 breakpoint.
- **Desktop ≥640 (anchored dropdown):** in-row, left-aligned label, unchanged width behavior — no regression.

---

## Mobile <640 full-width gate (clause 11)

- **<390px:** the mark-all button is **full-width** (`fullWidth` / `w-full`) with flush-left content — satisfies
  the gate on its own row. Touch target ≥44px height retained (§6a Button `h-11`). Label wraps, never clips.
- **390–639px (documented exemption):** the mark-all button remains a **compact inline header action** at
  content width, sitting to the right of the title in the sheet-header row — analogous to a toolbar/secondary
  action, not a primary CTA. This is an **owner-directed exemption** (owner specified the new-row behavior only
  `<390px`, 2026-07-14). List it explicitly in the session log's clause-11 exemption table with this
  justification. The sheet container itself stays full-width edge-to-edge (unchanged from 591/592).
- The bell trigger and bottom-sheet mechanism are out of scope and unchanged.

## TailAdmin conformance (clause 16)

Button stays `variant="transparent" color="brand"` = the cited `§6a-link` row (no colour/size/radius invented).
Left-alignment + full-width-on-own-row are layout props, not new style tokens. `CheckCheck size={14}` unchanged.
If Mantine's `justify`/`fullWidth`/`styles.label` is used, cite the §18 pitfall guidance for why the chosen
mechanism (prop vs inline style) is correct and does not break the `§6a-link` chrome.

---

## Acceptance criteria (each must be verifiable)

1. **Label left-alignment** in the diff (icon+label flush-left, wrapped lines left-aligned) — `file:line`, plus
   rendered evidence at a wrapping width (uk@320) showing left-aligned wrap, not centred. (Positive flow step 2.)
2. **`<390px` own-row full-width** in the diff (the header becomes column-stacked below 390 and the button is
   full-width flush-left) — `file:line`. (Positive flow step 3.)
3. **`≥390px` in-row preserved** — the 390 and 768/1280 cells still show the title+button single row; only the
   label alignment differs from today. `file:line` for the responsive boundary.
4. **Rendered verification matrix** (clause 12): the OPEN panel captured at **320·375·390·768·1280 × sq·en·uk·it**,
   with **uk@320/375/390 mandatory**, each cell showing (a) the mark-all label flush-left, (b) own-row full-width
   at 320/375, (c) in-row at 390+. The alignment/row pixel must be visible in the PNG — a green
   `screenshots:assert` geometry count is **NOT** sufficient (§18.9: the gate is blind to text alignment). The
   existing `Mantine/Primitives/NotificationBellView` story already opens the panel (unread block) — reuse it; if
   a width/locale is outside the standard viewport set, capture it with a throwaway script and delete after.
5. **`screenshots:assert --mantine-only` zero regression** vs the Task 592 baseline (666/692 PASS / 0 FAIL /
   26 AMBIGUOUS) — the 16 `NotificationBellView` cells still pass, no new fail/ambiguous.
6. **`!hasUnread`** still renders no button and no empty second row (Negative flow branch 1) — rendered evidence
   from the all-read + empty demo blocks.
7. Gates: `tsc=0`, eslint clean, `check:stories` green, `check:i18n` parity unchanged (no new key),
   `check:file-integrity` clean, `check:mojibake` clean (once the 591 story deletion is staged — flag if still
   blocked, do not run git).
8. **§17 UI pre-flight checklist** output in the session log (non-canonical-dropdown grep, control-height §15,
   overflow@320 in uk, all breakpoints).
9. Session log: AC-by-AC self-audit citing both flows, Files Changed table (one row + rationale), rendered
   matrix, clause-11 exemption table (the 390–639 in-row row), UX flow trace. **No `git add`/`git commit`
   emitted by the executor** (single-writer — the orchestrator emits commit commands at review).

**Note for the executor:** the orchestrator will **personally open the rendered PNGs** and confirm (a) the label
wraps flush-left (not centred) and (b) the button is full-width on its own row below 390px — the geometry PASS
count alone will NOT approve this task (that is the §18.9 blind spot that let Task 591 through). A green gate with
a still-centred or still-crammed label = rejected.

## Implementation hints (non-binding — Sonnet decides the exact Mantine mechanism)

- Mantine `Button` centres its content by default; `justify="flex-start"` controls the inner
  (`leftSection`/label) `justify-content`, and the label element may additionally need left `text-align` for the
  **wrapped-line** alignment. Verify BOTH the single-line and wrapped cases render flush-left. Prefer Mantine
  props / `styles.label` over global CSS per §18; do not fork `§6a-link`.
- The `<390` split: `390` is a canonical breakpoint but not a Mantine theme breakpoint, so a theme
  `hiddenFrom`/`visibleFrom` won't hit it. An arbitrary Tailwind `max-[389px]:flex-col` on the header row (with
  the button `max-[389px]:w-full`) or a component-scoped `useMediaQuery('(max-width: 389px)')` is acceptable —
  there is precedent for a documented one-off `min-[390px]` magic breakpoint (Task 590). Document whichever you
  choose in-code and in the session log; do not introduce a new named breakpoint token.
