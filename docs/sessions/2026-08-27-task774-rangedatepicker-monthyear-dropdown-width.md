# Task 774 — month/year option labels wrapped mid-token; and the first real-browser proof for 773

**Date:** 2026-08-27 · **Sprint:** 67 · **QA profile:** Q2 · **Files touched:** 1 source + governance
**Author:** Opus, under the Sprint 67 owner authorization.

## What the owner reported

Screenshot: the year list rendering `202` / `6` on every row. *"Треба зробити так, щоб рік завжди влазив по
ширині, враховуючи всі breakpoints."*

## Cause

The list inherits the trigger width (`Combobox` default `width: "target"`), and 93px of that is fixed chrome —
24 dropdown padding + 24 option padding + 2 border + 12 `Group` gap + 14 CheckIcon + ~17 scrollbar. The year
trigger is 100px wide, so the label box collapses to a measured **21px** and `"2026"` (32px) breaks after three
glyphs. Every input to that sum was read out of `theme.ts`; nothing was estimated.

The month selector was over budget too — 150 − 93 = 57px against a widest label of 64.6px (`uk` «Вересень») — and
only escaped the screenshot because the selected month was the short «Січень». Latent, not absent.

**Pre-existing, surfaced by 773.** Before 773 the dropdown was destroyed on `mousedown`, so no one ever saw a
rendered option list. 773 did not introduce this; it made it observable.

## Fix

Two props: `dropdownMinWidth={190}` (month) and `={140}` (year), with the budget arithmetic recorded inline.
`dropdownMinWidth` is the **existing** Task 556 prop for exactly this shape, so `MantineCombobox` is untouched.

## How it was verified — a real browser, for the first time on this surface

The blocker recorded in 773 was that jsdom can see neither the portal nesting nor layout. So a browser harness was
built: the **actual** `<RangeDatePicker>` under the real theme, `input-chrome.css`,
`range-date-picker-chrome.css` and real Open Sans, served by Vite, driven by Playwright/Chromium with real mouse
presses. Two things came out of it:

1. **Task 774 (width).** Unfixed tree → **4/8 cells wrapped** (`2026`, every locale). Fixed tree → **24/24 cells
   clean, 0 offscreen** across `sq/en/uk/it` × `641/1024/1440` × month/year.
2. **Task 773 (the outstanding real-browser AC).** Month and year picked with a real mouse press: **12/12 cells,
   0 failures — the calendar stays open and re-anchors** in all four locales at all three widths. This is the
   proof 773 shipped without; **Sprint 67 exit criterion 1 is now met.**

Windows fidelity: headless Linux paints 0-width overlay scrollbars, Windows Chrome a classic ~17px one — and that
17px is what tipped every row over. The measurement emulates it by taking 17px off the list content box.

Transcripts: `docs/sessions/evidence/task774/`.

Also green: `tsc --noEmit` **0** · **64/64** tests across 7 suites.

## No RTL test was added, on purpose

jsdom has no layout engine; `getBoundingClientRect` returns zeroes, so no vitest assertion can tell a wrapped label
from a fitting one. A test that "passes" here would assert nothing. Recorded rather than papered over — this is the
same theme as 773's finding, one layer along: **773 was invisible because portals are inlined under `env="test"`;
774 is invisible because there is no layout at all.**

## Outstanding

1. Owner-native `npm run build` (exit 0) + lint + `check:i18n` + `check:mojibake` — for 773 and 774 together.
2. One route-level visual pass in the real drawer (the harness renders the component, not the route).
3. Sprint 67 exit criteria 2–4. **Criterion 3 now has a working answer rather than a candidate:** the harness in
   this session is the detector. Landing it as a task-owned probe (the `scripts/task766-route-shell-probe.mjs`
   pattern) needs an owner call, since it adds a Vite entry point the repo does not otherwise have.
