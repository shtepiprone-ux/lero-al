# Sprint 42 — Booking.com-style Date-Range Picker (Epic MM Phase-2)

**Origin:** Task 557 (single-date `DatePicker` → Mantine/TailAdmin migration) expanded, by owner decisions on
2026-07-06, into a full **Booking.com-style RANGE date picker** for the listings date filters. Because the scope
now spans a new component, consumer rewiring, and (separately) an admin data-model change, it is re-planned as this
sprint. Task 557's kickoff is retained only as the `§6t` calendar-chrome + `MantinePopover`-props reference the new
tasks build on — it is NOT executed standalone.

## Owner decisions locked (2026-07-06)

1. **Functionality = "ідентичний як на Booking.com" → RANGE selection** (start + end across months/years).
2. **Mobile** = Booking.com model: full-width bottom sheet, drag handle, **pinned Monday-first weekday header**,
   **vertically-scrolling multi-month** list with a **sticky month-name header** (replaces Booking's
   "Calendar / I'm flexible" tabs — owner: "замість Calendar і I'm flexible треба вставити назву місяця"),
   **no** ±day flexibility chips, bottom range summary + **full-width Confirm CTA** ("Select dates").
3. **Desktop** = owner reference (2026-07-06): **two-month side-by-side** ("From" / "To"), each month navigated by
   a **month dropdown + year dropdown** (not arrows), start/end filled brand, in-between `inRange` light-tint fill
   spanning both months, a top **range-summary field** + **"Clear filters"** link + **"Cancel" / "Apply"** buttons.
4. **Week start = Monday-first** on both breakpoints (`weekStartsOn:1`).
5. **Cell chrome** = the zip-cited `tailadmin-style-reference.md §6t` day-cell states (selected brand `#EC5447`,
   today gray-400 border, hover gray-200, disabled light-gray, pill radius, 39px) — the STRUCTURE differs per
   breakpoint but the day-cell VISUALS trace to §6t; the `inRange` fill is the §6t range state (light brand tint).
6. **`MantinePopover`** additive props `fullWidthTrigger` + `close()` are authorized (already speced in the 557
   kickoff) and used by the component.
7. **Admin suspension = a SEPARATE task (Task 560)** — deferred; it is a DB/RLS/server-action data-model change.

## ⚠️ Open confirmation before/at T-a review

- **Sticky month-name header interpretation** (mobile): a header that reflects the month currently scrolled into
  view. Confirm with the owner at first rendered evidence.
- **Owner "має бути ось так" image** for mobile was not received on the orchestrator side — the mobile spec here is
  reconstructed from the Booking.com screenshot + the tab→month-name instruction. Re-confirm at first render.

## Tasks

| # | Task | Type | Status |
|---|------|------|--------|
| **558** | `RangeDatePicker` component (desktop two-month + mobile Booking scrolling sheet) | UI / component | KICKOFF DRAFTED |
| **559** | Listings filters → `RangeDatePicker` integration (`FiltersPanel` + `ListingsFilters`) | UI / consumer wiring | KICKOFF DRAFTED |
| **560** | Admin suspension as a period (DB migration + RLS + server action + admin UI) | Schema / RLS / server action | DEFERRED — plan later |

**Dependency:** 559 depends on 558 (needs the component). 560 is independent and deferred. Hand 558 to Sonnet
first; 559 after 558 is approved.

Kickoffs:
- `tasks/Sprints/Sprint_42_kickoff_prompt_Task_558_RangeDatePickerComponent.md`
- `tasks/Sprints/Sprint_42_kickoff_prompt_Task_559_ListingsFiltersRangeIntegration.md`
- Task 560 — deferred; a stub row here until its schema semantics are defined with the owner.
