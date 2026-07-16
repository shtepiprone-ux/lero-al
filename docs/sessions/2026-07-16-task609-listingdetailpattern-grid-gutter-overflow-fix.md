# Task 609 — `MantineListingDetailPattern` Grid-gutter horizontal-overflow fix

Sprint 44 (Epic MM Phase-2). Executed 2026-07-16 against the kickoff:
`tasks/Sprints/Sprint_44_kickoff_prompt_Task_609_ListingDetailPatternGridGutterOverflow.md`.

## Summary

Clears the last Task-607 tracked `MANTINE_PATTERN_KNOWN_FAILURES` xfail. Root cause (confirmed by the
Task 607 review): `MantineListingDetailPattern.tsx`'s root `<Grid gutter="lg">` implements its gutter as a
negative horizontal margin on `.mantine-Grid-inner` (bled back in by matching padding on each `Grid.Col`) —
harmless when a real ancestor clips it, but this pattern renders standalone in its own Storybook story with
nothing to hide the bleed, so `document.documentElement.scrollWidth` measured ~10px wider than `clientWidth` at
every viewport (330 vs 320, 385 vs 375, 400 vs 390, 1034 vs 1024) — a genuine `scrollWidth > clientWidth`
violation, invisible to the eye, tripping the geometry gate's `noHorizontalOverflow` check on all 16 cells
(320/375/390/1024 × sq/en/uk/it).

## First attempt tried and REJECTED (not shipped) — containment introduces a new false positive

The kickoff's primary recommendation — wrap the root `<Grid>` in `<Box style={{ overflowX: 'clip' }}>` — was
implemented first and DOES neutralize the document-level overflow (confirmed: `--mantine-only` dropped from 16
`horizontal-overflow` FAILs to 0). But it surfaced a NEW failure: 16 `text-clipped` FAILs on the Call/WhatsApp
buttons in the sticky contact panel, at every cell.

Root cause of the false positive: `geometry-integrity.mjs`'s Check-1 (`text-clipped`) walks up the ancestor
chain from every interactive element's text node, and at the first ancestor whose computed `overflow`/
`overflowX` matches `/hidden|clip/`, checks whether THAT ancestor's own `scrollWidth > clientWidth` — if so, it
flags the descendant's text as clipped, with no check on whether the descendant's own rendered box actually
falls inside the clipped region. An `overflow:clip` `Box` wrapped around the whole Grid IS exactly that
ancestor: its own box is, by construction, wider than its `clientWidth` (that's the overflow being contained),
so every button nested inside it — regardless of whether it's anywhere near the clipped edge — gets flagged.
Confirmed via rendered screenshots that nothing is actually visually clipped (full-width buttons, complete
labels in all 4 locales). This attempt was reverted before landing; not part of the shipped diff.

## Shipped fix — neutralize the gutter (kickoff's pre-approved alternative), not contain it

`gutter="lg"` → `gutter={0}` on the root `<Grid>` (removes the negative margin entirely — the Grid-inner box
can never measure wider than its own container again). The same visual gap is reproduced explicitly on the
left `Grid.Col` only:
- `pr={{ base: 0, sm: 'lg' }}` — the `sm+` side-by-side inter-column gap.
- `mb={{ base: 'lg', sm: 0 }}` — the `<sm` stacked inter-row gap.

Outer edges are unaffected either way — Mantine's gutter mechanism only ever affected the gap BETWEEN columns,
never the outer edges against the grid container (those were always flush regardless of gutter value) — so the
visible layout is byte-identical: same column split (8/4 of 12), same gap, same sticky contact panel, same CTA
behavior, all 4 locales. Zero negative-margin bleed anywhere in the DOM now, so neither the overflow check nor
the text-clip check has anything to trip on.

## Verification

**Scoped Playwright probe** (built for this task, reusing the real exported `checkGeometryIntegrity()` from
`scripts/geometry-integrity.mjs` against the built `storybook-static/`, run directly against the
`Patterns/Mantine/ListingDetailPattern/Default` story's 16 cells):

```
PASS | 320 x sq | scrollWidth=320 clientWidth=320 noOverflow=true textClipped=0 | sticky: position=sticky cssTop=80px ...
PASS | 320 x en | scrollWidth=320 clientWidth=320 noOverflow=true textClipped=0 | sticky: position=sticky cssTop=80px ...
PASS | 320 x uk | scrollWidth=320 clientWidth=320 noOverflow=true textClipped=0 | sticky: position=sticky cssTop=80px ...
PASS | 320 x it | scrollWidth=320 clientWidth=320 noOverflow=true textClipped=0 | sticky: position=sticky cssTop=80px ...
PASS | 375 x sq/en/uk/it | scrollWidth=375 clientWidth=375 noOverflow=true textClipped=0
PASS | 390 x sq/en/uk/it | scrollWidth=390 clientWidth=390 noOverflow=true textClipped=0
PASS | 1024 x sq/en/uk/it | scrollWidth=1024 clientWidth=1024 noOverflow=true textClipped=0

✅ ALL 16 CELLS PASSED (no overflow, no text-clip, sticky verified)
```

`scrollWidth === clientWidth` EXACTLY (not merely within the ±1px tolerance) at every one of the 16 cells —
zero bleed, not just below-threshold bleed.

**Sticky proof (AC2).** `position:sticky; top:80` on the contact `Paper` was verified via computed style
(`getComputedStyle(el).position === 'sticky'`, `top: 80px`) plus a real `window.scrollBy(0, 400)` — the mobile
viewports (74px of scrollable content in the isolated story) moved the panel's bounding-rect top by exactly the
available scroll delta (529.0 → 455.0, a 74px shift matching the clamped scroll), and desktop-1024 (0px
scrollable — both columns fit the viewport) held steady at `top: 80.0` throughout. The sticky Paper's own JSX
(`style={{ position: 'sticky', top: 80 }}`, `MantineListingDetailPattern.tsx:100`, byte-unchanged) was never
touched by either fix attempt, and the shipped fix introduces no new overflow/transform/contain ancestor (the
only CSS properties capable of breaking `position:sticky`) — confirming the sticky mechanism was never at risk
by construction, not just by observation.

**Anti-regression proof (AC5, clause 13).** The original `gutter="lg"` (no `pr`/`mb`) was planted back onto the
working tree, Storybook rebuilt, and the same scoped probe re-run — confirmed genuine FAIL on all 16 cells with
the exact predicted bleed:

```
FAIL | 320 x sq/en/uk/it | scrollWidth=330 clientWidth=320 noOverflow=false
FAIL | 375 x sq/en/uk/it | scrollWidth=385 clientWidth=375 noOverflow=false
FAIL | 390 x sq/en/uk/it | scrollWidth=400 clientWidth=390 noOverflow=false
FAIL | 1024 x sq/en/uk/it | scrollWidth=1034 clientWidth=1024 noOverflow=false

❌ SOME CELLS FAILED
```

(exactly the ~10px half-gutter bleed predicted by the diagnosis, at every viewport). The plant was then
reverted back to the shipped fix, Storybook rebuilt again, and the probe re-run — back to 16/16 PASS (see
above) — proving the check genuinely discriminates the real defect and the fix genuinely resolves it, not a
weakened/neutered check.

**Registry.** `MANTINE_PATTERN_KNOWN_FAILURES` in `scripts/check-stories-rendered.mjs` is now `{}` — the
`ListingDetailPattern` entry removed (the defect no longer exists; leaving the pin would be dead governance
state that could silently mask a real regression later).

**Full gate — positive flow (AC1, AC4).** `npm run screenshots:assert -- --mantine-only`:

```
Results: 889/916 PASS, 0 FAIL, 27 AMBIGUOUS (needs-owner-decision)
  ambiguous-overlap: 27
✅ All hard assertions PASSED (ambiguous cells need owner triage — not citable as green proof).
```

exit 0. The 27 AMBIGUOUS cells are the same pre-existing Combobox/RangeDatePicker portal-backdrop +
Tabs swipe-scroll ambiguous-overlap/offscreen findings tracked since Task 607/611, byte-unchanged by this task.
Zero FAIL, zero KNOWN-FAILURE. (Total cell count is 916, not the Task 611 baseline's 900 — Task 612 registered
`LightboxView` as a 16-cell Mantine overlay story in the gate in between, all passing; the `857→873` delta the
kickoff predicted for this task alone is the +16 confirmed independently via the scoped probe, unaffected by
that unrelated addition.) Manifest + 16 persisted screenshots (all locales × viewports):
`.screenshots/rendered-assert/2026-07-16T13-07/` (gitignored, not committed — path cited for reproducibility).

**Visual byte-identity (AC3).** Rendered screenshots reviewed at all 4 stress viewports (uk@320 mandatory +
en@1024 desktop) confirm the two-column 8/4 split at `sm+`, single-column stack at `<sm`, sticky contact panel,
and full-width stacked CTAs at mobile — unchanged from the pre-fix design intent (no prior committed screenshot
existed to diff against pixel-for-pixel, since this story had zero prior PASS state; byte-identity is instead
established by the CSS math: outer edges are always flush with the grid container regardless of gutter value,
only the INNER gap changes with gutter, and `pr:'lg'`/`mb:'lg'` reproduce that exact inner gap).

**Standing checks.** `node --check` (via `check:file-integrity`), `check:stories`, `check:file-integrity`,
`check:mojibake`, `npx tsc --noEmit` — all clean.

## Out-of-scope observation (not fixed, noted only)

At desktop widths the contact CTA `Group` (`MantineListingDetailPattern.tsx:124`) appears to stay
column-stacked instead of switching to a row — the inline `style={{ flexDirection: 'column' }}` prop has higher
CSS specificity than the `styles={{ root: { '@media (min-width: 40em)': { flexDirection: 'row' } } }}`
media-query override (inline `style` always wins over stylesheet rules, including ones inside `@media`,
regardless of the media condition). This line was not touched by either fix attempt in this task and is
orthogonal to the Grid-gutter defect — flagged for a possible future task, not fixed here (no scope creep).

## Files Changed

| File | Change | Why |
|------|--------|-----|
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | Root `<Grid gutter="lg">` → `<Grid gutter={0}>`; left `Grid.Col` gained `pr={{ base: 0, sm: 'lg' }}` + `mb={{ base: 'lg', sm: 0 }}` | Removes the negative-margin gutter bleed at its source (root cause) instead of clipping it, avoiding the `overflow:clip` ancestor's false `text-clipped` trip; reproduces the identical visual gap explicitly |
| `scripts/check-stories-rendered.mjs` | `MANTINE_PATTERN_KNOWN_FAILURES` — removed the `ListingDetailPattern` entry, now `{}` | Defect fixed; the tracked-xfail pin is no longer needed and would be dead governance state if left in place |
| `docs/storybook-governance.md` | Added §14.9.20 resolution note | Documents the root cause, the rejected containment attempt (and why), the shipped fix, and the verification/anti-regression evidence for future readers |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by `screenshots:assert` on every run (mechanical, not hand-edited) — now reflects the final 916-cell / 889-PASS / 0-FAIL state with no `ListingDetailPattern` entry | Persisted-inventory side effect of running the gate, in the kickoff's declared scope ("the persisted assets dir") |
| `docs/backlog.md` | Task 609 marked done; Last Session replaced with the 609 summary; inline 609 status note updated | Mandatory post-task backlog tidy |
| `docs/backlog-archive.md` | Added one row at the top for the prior (Task 614) Last Session entry | Standing rule: the OLD "Last Session" entry moves to the archive before the new one replaces it |
| `docs/sessions/2026-07-16-task609-listingdetailpattern-grid-gutter-overflow-fix.md` | New session log (this file) | Full verification record |

No git commands run (single-writer rule) — orchestrator emits explicit-path `git add`/`git commit` at review time.
