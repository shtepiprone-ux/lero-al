# Task 594 — Remove the duplicated "Сповіщення" heading on the notification bottom sheet (mobile)

Sprint 44 (Epic MM Phase-2, Header/app-shell). Owner-reported 2026-07-14 (bad UX: the sheet
shows the same heading twice on mobile). Follow-up to Tasks 591/592/593.

## Pre-read (UI / layout / component task — per `docs/rule-index.md`)

Always: `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan).
Required: `docs/mantine-responsive-design-system.md` (FIRST — §7 mobile gate, §18 theming pitfalls),
`docs/tailadmin-style-reference.md`, `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
Reference for the sheet mechanism: `src/design-system/mantine/patterns/MantinePopover.tsx` +
`.../responsiveBottomSheet.tsx` (do NOT modify these — they are shared single-source).

## Why (root cause, already diagnosed by the orchestrator)

`NotificationBellView.tsx` passes `title={t('title')}` to `MantinePopover`. On **mobile (<640)** that prop
renders the `ResponsiveBottomSheet` header text "Сповіщення" (below the drag handle). `NotificationCenter.tsx`
ALSO renders its **own** header `<p className="text-sm font-semibold">{t('title')}</p>` = "Сповіщення" (the row
that also holds the mark-all button). Result on mobile: the heading appears **twice**. On desktop the anchored
`Popover.Dropdown` does NOT render the `title` prop, so only the `NotificationCenter` header shows (single) —
that is why the duplication is mobile-only.

## Scope (exactly one line of product code)

Remove the `title={t('title')}` prop from the `<MantinePopover>` in
`src/modules/notifications/components/NotificationBellView.tsx` (currently line 46). Nothing else.

- Do NOT touch `NotificationCenter.tsx` — its own header is the single canonical heading we keep (it carries the
  mark-all button and works at both breakpoints).
- Do NOT modify `MantinePopover.tsx` or `responsiveBottomSheet.tsx` (shared primitives). Dropping the optional
  `title` prop makes this instance a **drag-handle-only sheet** — the exact existing pattern used by
  Select/Popover/Menu/Nav option lists (see the `title ?` branches in `responsiveBottomSheet.tsx`: no title →
  no divider, no stray padding). No divider/padding artifact must appear.
- `t` stays imported/used (still used by the `ActionIcon` `aria-label={t('title')}` on line 38 — DO NOT remove
  that; the trigger's accessible name must remain).

## Current behavior to preserve

- Desktop (≥640): anchored dropdown, single "Сповіщення" heading (from `NotificationCenter`), mark-all button,
  list — byte-identical (the `title` prop was never rendered on desktop, so desktop output is unchanged).
- Mobile (<640): full-width bottom sheet, drag handle at top, closes on backdrop tap + Esc, ≤90dvh internal
  scroll, returnFocus to the bell — all unchanged (these come from `ResponsiveBottomSheet`, not from `title`).
- Trigger `ActionIcon` `aria-label` unchanged; unread `Indicator` badge unchanged; mark-all button (Task 593
  alignment) unchanged; `!hasUnread` → no mark-all; empty list → localized empty state.

## Required after behavior

- Mobile (<640): the bottom sheet shows the heading **exactly once** — the `NotificationCenter` header
  "Сповіщення" (with the mark-all button beside/below it per Task 593). The drag handle remains; NO sheet-title
  text above it; NO divider artifact where the title used to be.
- Desktop (≥640): unchanged, single heading.

## Positive flow

Authed user, `hasUnread=true`, opens the bell. **<640:** drag handle → single "Сповіщення" header +
mark-all button → notification rows; sheet edge-to-edge full width, closes on backdrop/Esc. **≥640:** anchored
dropdown, single "Сповіщення" header + mark-all, unchanged.

## Negative flow

- `!hasUnread` → `NotificationCenter` header still renders the title (single), no mark-all button, no orphan row;
  mobile sheet still single heading.
- Empty list (`notifications=[]`) → single header + localized empty message; no duplicate.
- Long locale labels (uk/sq/it) → single header wraps normally, no clip, no h-scroll@320.
- Backdrop tap / Esc → sheet closes, focus returns to the bell (unchanged).

## Mobile <640 full-width gate (clause 11)

Sheet stays full-width edge-to-edge with drag handle (unchanged — untouched mechanism). Bell trigger = icon-only
`ActionIcon` exemption (`mih/miw=2.75rem`, 44px). Mark-all button = Task 593 behavior (own full-width flush-left
row <390, in-row ≥390) — unchanged. No control removed. Only change: one fewer (duplicate) heading on mobile.

## TailAdmin conformance (clause 16)

No chrome/token change. No color/px/radius/font touched. `title` is a layout prop, not a style value. Nothing to
extract or cite.

## Regression coverage (clause 15)

Scan `docs/critical-flow-registry.md` — no notifications/mark-all row exists; this is a pure presentational
heading de-dup with zero logic change. State the scan result in the log; no new test required (justify per the
kickoff default) — but run the existing `NotificationItem.priceChange.smoke.test.tsx` before+after (must stay 3/3).

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- `npm run build-storybook` fresh, then `npm run screenshots:assert -- --mantine-only` — report PASS/FAIL/AMBIGUOUS
  vs the current baseline; explain any delta honestly (the `NotificationBellView` cells must not regress to FAIL).
- **§18.9 human-visual proof (the check that decides this task):** open the `Mantine/Primitives/NotificationBellView`
  PNGs and confirm **by eye** at **uk@320/375/390 (mandatory)** + one desktop width that the opened panel shows the
  "Сповіщення" heading **exactly once** (previously twice on mobile). Also confirm: drag handle present, NO divider
  artifact, mark-all button intact, no clip / no h-scroll@320. Include the rendered matrix (320/375/390/desktop ×
  sq/en/uk/it) with per-cell evidence; uk@320/375/390 are stress cells.

## Acceptance criteria (each maps to a flow + rendered proof)

1. Diff removes ONLY the `title={t('title')}` prop from `MantinePopover` in `NotificationBellView.tsx`; no other
   file changed; `MantinePopover.tsx`/`responsiveBottomSheet.tsx`/`NotificationCenter.tsx` untouched. (`file:line`)
2. `t` still used by the `ActionIcon` `aria-label` (line 38) — trigger accessible name preserved.
3. Mobile PNGs (uk@320/375/390) show a SINGLE "Сповіщення" heading, drag handle present, no divider artifact.
   (Positive flow + §18.9)
4. Desktop PNG unchanged single heading. (Positive flow ≥640)
5. `!hasUnread` + empty-list mobile PNGs show single heading, no mark-all / localized empty, no orphan row.
   (Negative flow)
6. Gates: `tsc=0`, eslint clean on the file, `check:stories`, `check:i18n` (unchanged — no key touched),
   `check:file-integrity`, `check:mojibake` all green; `screenshots:assert --mantine-only` no new FAIL; smoke test
   3/3 before+after. Flag any blocker honestly.
7. Session log has: AC-by-AC self-audit, Files Changed table (1 row + rationale), rendered matrix, §18.9 visual
   proof, clause-11 note, UX flow trace. **No git run** (single-writer) — orchestrator emits the commit at review.

## Hard contract reminders

No scope change; no architecture invented; if anything is ambiguous, STOP and ASK the orchestrator (do not guess).
Do NOT emit `git add`/`git commit`. Update `docs/backlog.md` + add `docs/sessions/2026-07-14-task594-*.md`.
