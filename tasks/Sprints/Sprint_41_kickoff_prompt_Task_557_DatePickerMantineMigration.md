# Task 557 — DatePicker → Mantine/TailAdmin migration (Sprint 41 / Epic MM Phase-2)

**Type:** UI / component migration (product code). **Executor:** Sonnet 4.6.
**Origin:** Epic MM Phase-2 — after the Combobox family (551/552/553) + `PhoneField` (556) closed, `DatePicker`
is the next shared composite. It still renders through the LEGACY trees (`@/components/ui/popover`,
`@/components/ui/button`, raw `<button>` day cells). This task rebuilds it on the canonical Mantine core
primitives, **preserving 100% of the date logic and the public Props API.**

> **🔴 ARCHITECTURE — owner-decided (2026-07-06): REBUILD ON MANTINE CORE (Option 1), NOT `@mantine/dates`.**
> Keep the existing hand-rolled calendar grid + `date-fns`; swap legacy `ui/popover` → `MantinePopover`
> (which already carries the `<640` full-width bottom-sheet contract), legacy `ui/button` → Mantine `Button`,
> raw day `<button>`s → Mantine `UnstyledButton` themed cells. **Do NOT add `@mantine/dates`** (it is not
> installed, and it would still need the project's own bottom sheet — no saving). `date-fns@4` stays.

> **✅ ORCHESTRATOR PRE-REQ RESOLVED (2026-07-06) — the calendar reference IS in the zip; NO live capture needed.**
> The earlier "honest-negative / clause-16a live-capture" premise was WRONG. `demo_tailadmin_com.zip` DOES contain
> the TailAdmin date-picker calendar: the dashboard (`index.html`, also `html/index.html`, `html/sales.html`)
> renders the full **flatpickr** calendar body (the same flatpickr used on TailAdmin's Forms/Form-Elements page),
> and `css/style.css` carries its complete stylesheet. The orchestrator extracted it into the authoritative
> **`docs/tailadmin-style-reference.md §6t`** row (markup + CSS cited, zip-sourced — 2026-07-06). **Sonnet:
> implement the calendar body against `§6t`. Do NOT browse TailAdmin and do NOT invent values — every value
> traces to `§6t` (calendar) or `§6d/§6e` (trigger).** One decision is deferred to STOP-AND-ASK #3 below
> (today-marker: §6t gray-400 border vs the existing brand ring).

## Current state (read before touching — `src/components/shared/DatePicker.tsx`, 187 lines)

A hand-rolled calendar in a popover. Two visual parts:

**Trigger** (`PopoverTrigger`): `date-picker relative flex w-full items-center h-11 pl-9 pr-8 text-sm rounded-xl bg-muted text-left` + focus ring; a `CalendarDays` icon (absolute `left-3`), a `flex-1 truncate` span showing `format(selected,'dd.MM.yyyy')` or `placeholder ?? t('select_date')`, and — only when a date is selected — a clear `<button>` (absolute `right-2`, `X` icon, `aria-label={t('aria_clear')}`, `tabIndex={-1}`, `stopPropagation`).

**Calendar popover** (`PopoverContent align="start" sideOffset={6}` `p-0 w-auto rounded-2xl shadow-xl` → inner `w-[272px] p-3`):
- **Month nav:** two `Button variant="ghost" size="icon"` (`ChevronLeft`/`ChevronRight`, `h-8 w-8 rounded-xl`); centered `monthLabel` (`Intl.DateTimeFormat(locale,{month:'long',year:'numeric'})`, `capitalize font-semibold`). Next arrow `disabled` when `maxDate && isSameMonth(viewMonth,maxDate)`.
- **Weekday header:** `grid grid-cols-7`, 7 × `Intl.DateTimeFormat(locale,{weekday:'short'})`, **Monday-first** (`weekStartsOn:1`), `h-8 text-xs text-muted-foreground`.
- **Day grid:** `grid grid-cols-7 gap-px`; each day a raw `<button type="button" disabled={isDisabled}>` `h-8 w-full rounded-xl text-sm`. States: `isDisabled` (`!inMonth || isFuture`) → `opacity-20 pointer-events-none`; hover → `hover:bg-accent`; `isSelected` → `bg-primary text-primary-foreground font-semibold shadow-sm`; today (in-month, not selected) → `font-semibold text-primary ring-1 ring-inset ring-primary/40`.
- **Today shortcut:** full-width `Button variant="ghost" size="sm"` `h-8 text-xs`, label `t('period_today') — <Intl day+month>`; sets today + closes.

**Props (public API — MUST stay stable):** `value?: string` (ISO `yyyy-MM-dd`), `onChange: (v: string | undefined) => void`, `placeholder?: string`, `className?: string`, `maxDate?: Date` (days after it disabled).

**Date LOGIC (all `date-fns` — stays BYTE-IDENTICAL, this is a presentational rebuild only):** `parseISO`/`isValid` (guarded `selected`), `format(...,'yyyy-MM-dd')` emit + `'dd.MM.yyyy'` display, `startOfWeek/endOfWeek/startOfMonth/endOfMonth/eachDayOfInterval` (grid), `addMonths/subMonths` (nav), `isSameDay/isSameMonth/isToday/isAfter/startOfDay` (states), `weekStartsOn:1`. Do NOT touch any of this.

**Consumers (public API must stay stable — verify each still compiles + renders unchanged):**
- `src/components/shared/FiltersPanel.tsx:371` (`date_from`) + `:380` (`date_to`) — `value`, `onChange`, `placeholder={t('select_date')}`, `maxDate={today}`.
- `src/modules/listings/components/ListingsFilters.tsx:334` (`date_from`) + `:343` (`date_to`) — `value`, `onChange`, `placeholder={tc('select_date')}`, `maxDate={today}`.
- `src/components/admin/AdminUserProfile.tsx:847` (`suspendedUntil`, inside the profile Dialog) — `value`, `onChange`, `placeholder={t('fields.block_permanent')}`, **no `maxDate`** (future dates allowed).
- **No consumer passes `className` or `disabled` today.** 5 call sites total; none should need editing (pure presentational rebuild). If any DOES need a change, list it — otherwise the consumer diff is zero.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses 1–16, esp. **3, 4, 5, 11, 12, 16, 16a**) + `docs/backlog.md` + `docs/critical-flow-registry.md` (**scan for a listings-date-filter / date-entry row; if none exists, ADD one** — see Regression coverage).
- 🔴 `docs/mantine-responsive-design-system.md` — **§7 (mobile gate) + §12 (canonical patterns) + §15 (control-height) + §16 (gates) + §18 (theming/CSS pitfalls, `input-chrome.css`) + §18.9 (icon/placeholder/overlap IRON RULE — the calendar icon + clear-X on the trigger, and day-cell touch size, live here)**.
- 🔴 `docs/tailadmin-style-reference.md` — **§6d/§6e (the TRIGGER inherits this input chrome VERBATIM) + the NEW `§6t` calendar-body row (zip-cited flatpickr, orchestrator-extracted 2026-07-06 — see below) + §6 label tokens**.
- `docs/ui-rules.md` (§15 control-height alignment, §17 UI pre-flight), `docs/component-rules.md` (no raw `<button>` — day cells → Mantine `UnstyledButton`/`Button`), `docs/qa-rules.md`.
- Reference: `src/design-system/mantine/patterns/MantinePopover.tsx` (target overlay primitive — `trigger`+`children`+`title`+`position`/`width`/`offset`, desktop-anchored ≥640 / full-width bottom sheet <640 via `responsiveBottomSheet`, Task 513/514) and the Task 556 session log (the established presentational-swap pattern).

## ✅ Clause 16 — ZIP-CITED reference exists (§6t); clause-16a live-capture NOT applicable

`demo_tailadmin_com.zip` **DOES contain** the date-picker calendar. The earlier claim of "zero calendar markup"
was wrong: the dashboard `index.html` (+ `html/index.html`, `html/sales.html`) renders the full **flatpickr**
`.flatpickr-calendar` (month nav, weekday header, 6×7 day grid with `selected`/`prevMonthDay`/`nextMonthDay`
states) and `css/style.css` carries the complete flatpickr stylesheet. This is the SAME flatpickr picker TailAdmin
uses on its Forms/Form-Elements page. So:
- **The TRIGGER** maps to the EXISTING `§6d/§6e` input chrome (border `gray-300`, `rounded-lg`, `h-11`,
  `bg-transparent`, `shadow-theme-xs`, `focus:border-brand-300 focus:ring-brand-500/10 focus:ring-3`) via the
  existing `input-chrome.css` rules, with the calendar icon as a `leftSection` and the clear-X as a `rightSection`.
  **This replaces the legacy filled `rounded-xl bg-muted` look with the standard bordered §6d/§6e field** — the
  same conversion every other migrated field got (required after-behavior, not a fork).
- **The CALENDAR BODY** maps to the NEW **`docs/tailadmin-style-reference.md §6t`** row (orchestrator-extracted
  from the zip, 2026-07-06 — markup + CSS cited). It gives every value Sonnet needs: container chrome, month-nav
  (28px inset, chevron, hover stroke brand), weekday header (gray-500, bolder, ~12px, 24/16px margins), and the
  full day-cell state matrix — resting (pill radius 150px, **39px on ALL breakpoints incl. mobile per owner override**, gray-700 text), hover
  (`gray-200`), **selected (brand `#EC5447`** — flatpickr's default `#569ff7` mapped to lero brand, single-select),
  today (gray-400 border — see STOP-AND-ASK #3), out-of-month (gray-400), disabled (very-light gray, non-interactive).
- **Clause 16a does NOT apply** (that clause is for zip-ABSENT primitives). No live capture, no provenance block
  required — `§6t` is a normal zip-cited row like §6o/§6p/§6s. **Sonnet implements against `§6t` and never browses
  TailAdmin.** Brand `#EC5447` = selected-day fill.

## STOP-AND-ASK — resolve BEFORE inventing scope

The architecture is already decided (Mantine-core rebuild). **All three points were RESOLVED by the owner on 2026-07-06 — implement exactly as below, do NOT re-ask:**
1. **Trigger chrome — ✅ RESOLVED: adopt the `§6d/§6e` bordered TailAdmin input chrome.** Owner: "take all necessary styles from the TailAdmin DatePicker." That resolves to §6d/§6e (`h-11`, full-width, `rounded-lg`, `shadow-theme-xs`, brand focus ring, `text-theme-sm`/`font-medium`/`text-gray-700`, calendar icon `leftSection`, clear-X `rightSection`) — the same chrome PhoneField and every other migrated field use. Drop the legacy filled `bg-muted rounded-xl`. (The zip's dashboard datepicker input is `h-10 max-w-11` — that is the compact collapsing-header instance, NOT the form-field size; use `h-11` per §6t's trigger note.)
2. **Day-cell size — ✅ RESOLVED: 39px on ALL breakpoints, INCLUDING the `<640` bottom sheet.** Owner: "on mobile the Date Picker must be a bottom sheet with 39px date cells." This is an **explicit owner override of the clause-11 ≥44px touch minimum for the calendar day cells** (documented in `§6t` → Owner overrides). Day cells = §6t **39px** everywhere; do NOT enlarge them to 44px on mobile. The nav arrows + Today shortcut are NOT covered by this exemption → they still meet ≥44px on mobile.
3. **Today marker — ✅ RESOLVED: the `§6t` gray-400 border** (not the legacy brand ring).

Anything else ambiguous (e.g. a consumer that unexpectedly needs a prop) → STOP and ask; do not invent.

## Mobile <640 full-width gate (clause 11)

- **Trigger** is already `w-full` → stays full-width at every breakpoint (§6d/§6e field). ✅
- **Calendar** → MUST render as a **full-width bottom sheet `<640`** via `MantinePopover` (edge-to-edge, top-only radius, drag-handle bar, ≤`90dvh` internal scroll, backdrop-tap + Esc close, focus returns to trigger). The legacy fixed `w-[272px]` is **desktop-anchored only**; inside the sheet the calendar fills the width and the 7-column grid expands.
- **Touch targets ≥44px at `<640`:** both nav arrows and the Today shortcut. **Day cells are the documented EXEMPTION — they stay §6t 39px on mobile per the owner's 2026-07-06 override (STOP-AND-ASK #2), NOT ≥44px.** Long `sq/en/uk/it` month labels wrap / never clip; **no horizontal scroll at 320** in any locale.
- Desktop `≥640` keeps the anchored popover (position `bottom-start`, the `§6t` desktop width).

## TailAdmin conformance (clause 16 + 16a)

- **Trigger** → `§6d/§6e` resting/focus/error/disabled chrome VERBATIM (existing `input-chrome.css`); calendar icon `leftSection`, clear-X `rightSection` — **§18.9: neither icon overlaps the text/placeholder (visible gap), the trigger is never a blank box.**
- **Calendar body** → the NEW `§6t` captured row (selected-day `#EC5447` fill, today marker, hover, disabled, nav arrows, weekday header, month label, cell size/spacing). **Zero invented values** — every value traces to `§6t` (calendar) or an existing `§6` row (trigger). Rendered side-by-side vs the `§6t` capture at every breakpoint × locale is the only style proof; `tsc=0`/gate-green is NOT style proof.

## Positive flow (happy path)

Actor: user picking a date (listings date filter / admin suspend-until). 1) Trigger renders: calendar icon + `dd.MM.yyyy` value OR placeholder; clear-X visible only when a value is set. 2) Click trigger → desktop anchored calendar (≥640) / full-width bottom sheet (<640) opens at the selected month (or current month). 3) Prev/Next navigate months (Next disabled at `maxDate`'s month). 4) Click a day → `onChange(format(day,'yyyy-MM-dd'))`, popover/sheet closes, trigger shows the new date + clear-X. 5) "Today" shortcut → `onChange(today)` + closes. Success: correct ISO emitted, no layout shift, no clip at 320.

## Negative flow (every off-happy-path branch)

- **Cancel/dismiss** (Esc, backdrop tap, re-click trigger) → closes, no value change, focus returns to the trigger; mobile sheet closes cleanly.
- **No value** → placeholder shown, NO clear-X rendered, `dd.MM.yyyy` absent.
- **Clear-X** → `onChange(undefined)`, trigger returns to placeholder, popover does NOT open (click `stopPropagation` preserved).
- **`maxDate` set** → days after `maxDate` are disabled (`opacity-20 pointer-events-none`, not selectable); Next-month arrow disabled at the `maxDate` month. (`FiltersPanel`/`ListingsFilters` pass `maxDate={today}`.)
- **Admin path (no `maxDate`)** → all days selectable, Next arrow never force-disabled.
- **Invalid `value`** (unparseable / non-ISO) → `isValid` guard yields `selected=undefined` → placeholder shown, no crash (preserve exactly).
- **Locale switch (sq/en/uk/it)** → weekday-short labels, month-year label, and the Today label reflect the active locale (`Intl`) at runtime — not just key parity.
- **Inside overlay contexts** → `AdminUserProfile` renders inside the profile **Dialog**; `FiltersPanel`/`ListingsFilters` may sit inside a filter Sheet/Popover. The calendar popover must NOT clip (MantinePopover portals its dropdown). **Prove no-clip rendered in the admin Dialog AND one filters overlay.**
- **Long uk/it month label** → wraps/fits, never clips or forces h-scroll at 320.

## Regression coverage (clause 15) — critical flow, add/confirm a registry row + baseline

`DatePicker` feeds the listings `date_from`/`date_to` filters (URL params → query) and the admin `suspendedUntil` write. **Scan `docs/critical-flow-registry.md`:** if a listings-filter / date-entry row exists, baseline it and extend; if not, **ADD** a "Date entry (listings filters / admin suspend-until)" row (route/action: listings filter apply + admin profile save; happy = pick day → correct `yyyy-MM-dd` emitted; failure = `maxDate` future day not selectable / clear → `undefined`). There is likely **no** DatePicker component test yet — add an RTL smoke asserting: (1) picking a day fires `onChange('yyyy-MM-dd')`; (2) clear-X fires `onChange(undefined)`; (3) a day after `maxDate` is `disabled` and does not fire `onChange`; (4) an invalid `value` renders the placeholder (no crash). Include a **planted-violation transcript** (e.g. drop the `format(day,'yyyy-MM-dd')` emit → test 1 FAILS). Do NOT close without this automated proof.

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- Add ONE persisted story rendering the **REAL `DatePicker`**, titled under **`Mantine/Primitives/DatePicker`** (Task 554 precedent — `--mantine-only` gives standing enforcement only to `Mantine/Primitives/*`). `skipCanvas:true`, `layout:'fullscreen'`, toolbar-driven locale/viewport, `storyT`-driven strings with full `sq/en/uk/it` parity. Render: default (empty), selected, `maxDate`-bounded, and the **calendar forced-open** (so the assert harness captures the calendar body, per the Task 554 open-overlay pattern).
- `screenshots:assert -- --mantine-only` green (paste the Phase-0 count line, before/after — story count +1, cells +N).
- 🔴 **§18.9 human-visual proof (the geometry gate is BLIND to overlap/placeholder/touch-size):** paste human-inspected screenshots at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280** proving: trigger calendar-icon ↔ text gap (no overlap) + clear-X ↔ text gap; calendar renders as a **full-width bottom sheet <640** (not a 272px centered card); **day cells = §6t 39px at <640 (owner override — NOT ≥44px); nav arrows + Today shortcut ≥44px**; selected-day (`#EC5447`) + today gray-400 border visible; month label not clipped; no h-scroll at 320. A green PASS count is NOT the verdict for this task.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. `DatePicker` renders through `MantinePopover` (calendar overlay) + Mantine `Button` (nav/Today) + Mantine `UnstyledButton` themed day cells + a `§6d/§6e` trigger field — **zero** legacy `@/components/ui/popover` / `@/components/ui/button` imports and **zero raw `<button>`** remain in the file. Public Props API unchanged (`value`/`onChange`/`placeholder`/`className`/`maxDate`); all 5 consumer call sites compile + render unchanged (list any that needed edits — expected: none).
2. All date LOGIC (`date-fns` calls, `weekStartsOn:1`, `parseISO`/`isValid`/`format`, `maxDate` disabling) byte-identical; behavior preserved end-to-end (positive + every negative branch has a verifiable line).
3. Trigger = `§6d/§6e` chrome; calendar body = the zip-cited `§6t` reference; today marker = §6t gray-400 border; §15 control-height on the trigger proven; **zero invented values** (STOP-AND-ASK #1/#2/#3 all owner-resolved 2026-07-06 and cited).
4. Mobile `<640`: trigger full-width; calendar = full-width bottom sheet; **day cells = §6t 39px (owner override, documented exemption)**; nav arrows + Today shortcut ≥44px touch; no h-scroll at 320 × `sq/en/uk/it`.
5. TailAdmin `§6d/§6e` (trigger) + `§6t` (calendar) matched rendered side-by-side; §18.9 icon/placeholder/touch checks pass; every calendar-body value traces to the zip-cited `§6t` row (no invented values; clause 16a N/A — reference is zip-present, not an honest-negative).
6. Registry row added/extended + baseline recorded + DatePicker RTL smoke (with planted-violation FAIL transcript).
7. i18n: reuse the existing `common.select_date` / `common.aria_clear` / `common.period_today` keys — **zero new keys expected** (state it if one is genuinely needed, with full `sq/en/uk/it` parity); `check:i18n` green; all 4 locales confirmed at runtime.
8. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`, `check:file-integrity` all green; `screenshots:assert -- --mantine-only` green; §18.9 human-visual set pasted; Files-Changed table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

Any change to `date-fns` logic or the ISO `value` contract; migrating the consumers' OTHER controls; changing the two-filter or admin layouts; adding a range-picker, time-picker, or preset-range shortcuts; re-doing `MantinePopover` / `responsiveBottomSheet`. This is a presentational rebuild of `DatePicker` onto Mantine core + its proof only.
