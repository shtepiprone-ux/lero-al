# Task 774 — in-calendar month/year option labels wrap mid-token

**Sprint:** 67 · **Priority:** P1 (owner-reported, visible) · **QA profile:** **Q2 Standard UI**
**State:** `IMPLEMENTED — OWNER NATIVE GATE GREEN, AWAITING OWNER VERDICT` · **Implemented by:** Opus, under the same explicit owner
authorization recorded in the Sprint 67 plan. Opus does not approve its own implementation.

**Depends on:** Task 773. This defect was always present; 773 is what made it *visible*, because before 773 the
dropdown was torn down on `mousedown` and nobody ever saw a rendered option list.

## Reported behavior

Owner screenshot, 2026-08-27: with the calendar open, the **year** list renders each option broken across two
lines — `202` / `6`. Requirement: *"щоб рік завжди влазив по ширині, враховуючи всі breakpoints."*

## Root cause — measured, not estimated

The option list inherits the **trigger's** width (Mantine `Combobox` defaults `width: "target"`), and the row chrome
consumes a fixed **93px** of it before a glyph is drawn — every value read out of `theme.ts`, none guessed:

| Component | px | Source |
|---|---:|---|
| dropdown padding | 24 | `Combobox.styles.dropdown` `0.75rem` × 2 |
| option padding | 24 | `Combobox.styles.option` `0.625rem 0.75rem` |
| dropdown border | 2 | same block |
| `Group gap="sm"` | 12 | `renderDesktopOption` in `MantineCombobox` |
| CheckIcon | 14 | selected row only |
| classic scrollbar | ~17 | `Combobox.Options mah={220}` always overflows (12 months, 6+ years) |
| **fixed chrome** | **93** | ⇒ `min width = widest label + 93` |

Year trigger is `triggerWidth={100}` ⇒ label box = `100 − 93 = 7px` on the selected row. Measured in Chromium: the
label box collapses to **21px** and `"2026"` (32px unconstrained) breaks after three glyphs. Exactly the screenshot.

The month selector at `triggerWidth={150}` gives `150 − 93 = 57px`, and the widest month label measured across the
four locales is **64.6px** (`uk` «Вересень»/«Березень»). So the month row was over budget too — it simply did not
show in the screenshot because the *selected* month was «Січень», which is short. Latent, not absent.

**Why no scrollbar appears in the container measurements:** headless Linux Chromium paints zero-width overlay
scrollbars; Windows Chrome paints a classic ~17px one. That 17px is precisely what tipped every row over. The
measurement emulates it by taking 17px off the list's content box.

## Fix — 2 lines

`RangeDatePicker.tsx` desktop header: `dropdownMinWidth={190}` (month) and `dropdownMinWidth={140}` (year), with the
budget arithmetic recorded inline so a future locale can be checked against it rather than re-derived.

`dropdownMinWidth` is the **existing** primitive prop added by Task 556 for exactly this shape — *"a compact
fixed-width trigger whose dropdown content is wider than the trigger itself."* **No new API, and `MantineCombobox`
is not touched at all by this task.**

Headroom: month 190 vs 158 needed (+32px), year 140 vs 125 needed (+15px; a year label is always 4 digits, so its
worst case is fixed forever).

## Current behavior to preserve

Trigger widths (150/100) unchanged — the calendar header row keeps its layout. Everything from 773 and earlier
preserved: staging, swap, bounds, Apply/Cancel/clear, mobile bottom sheet, all four locales, every other
`MantineCombobox` consumer byte-identical.

## Required after behavior

No month or year option label wraps, in any of the four locales, at any desktop width, and the list never leaves
the viewport.

## Negative-flow applicability

| Branch | Applicable? | Expected behavior | Evidence |
|---|---:|---|---|
| Validation / Authorization / Offline / Concurrent | **No** | pure presentational width | — |
| Dropdown wider than its trigger overflows the viewport | **Yes** | floating-ui `shift` keeps it inside | measured: `offscreen 0` across 24 cells |
| Longest-locale label | **Yes** | fits without wrapping | measured per locale; `uk` is the widest |
| Webfont not yet loaded (wider fallback metrics) | **Yes** | headroom absorbs it | **not proven** — the block-the-woff2 run did not actually bite (font stayed cached). Covered by headroom, not by measurement. Stated, not claimed. |
| `<640` mobile | **No** | bottom sheet, full width; no `Combobox.Dropdown` mounts | unchanged |

## Acceptance criteria

- **AC1** No wrapped month/year label at any desktop width in `sq`/`en`/`uk`/`it`. ✅ 24/24 cells, 0 wrapped.
- **AC2** Dropdown never leaves the viewport. ✅ 24/24, `offscreen 0`.
- **AC3** Trigger widths and calendar header layout unchanged. ✅ `triggerWidth` untouched.
- **AC4** No regression in the date-range flow. ✅ 64/64 tests, `tsc` 0.

## Verification actually run

| Check | Result |
|---|---|
| Chromium width sweep, 4 locales × {641,1024,1440} × {month,year} | **24 cells, 0 wrapped, 0 offscreen** |
| Same sweep on the **unfixed** tree | **4/8 cells wrapped** (`2026` in every locale) — the before/after pair |
| `npx tsc --noEmit` | **0** |
| 7 suites (RangeDatePicker ×2, MantineCombobox, MantinePopover, filtersRangeDatePicker, filtersPanelShell, heroSearch) | **64/64** |

Transcripts: `docs/sessions/evidence/task774/`.

**No RTL regression test was added, deliberately.** jsdom has no layout engine — `getBoundingClientRect` returns
zeroes — so no vitest assertion can distinguish a wrapped label from a fitting one. Writing one would be theatre.
The detector for this class is a real-browser probe; see Sprint 67 exit criterion 3.

### Residual evidence — PRODUCED by the owner, 2026-08-27, all green

`typecheck` 0 · `lint` **0 errors** · `check:i18n` PASS 2218×4 · `check:mojibake` 0/3409 ·
**`npm run build` EXIT 0**. Transcript + lint attribution: `docs/sessions/evidence/task774/owner-native-gates.txt`.

**AC1 met on the ROUTE**, owner screenshot (uk — the widest-label locale, real drawer): 2022/2023/2024/2025/2026
each on **one line**, check mark on the selected 2026, no mid-token break. **AC2 met** — list fully on screen.

All four acceptance criteria now carry evidence; the verdict is the owner's, not Opus's.

<details><summary>Pre-gate residual list, kept for the record</summary>

```
npm run typecheck ; npm run lint ; npm run check:i18n ; npm run check:mojibake ; npm run build
```

Plus the visual pass in a real browser at `uk` (widest labels) and one desktop width: open the calendar, open
**Month**, then **Year** — no label broken across two lines, list not clipped.

</details>
