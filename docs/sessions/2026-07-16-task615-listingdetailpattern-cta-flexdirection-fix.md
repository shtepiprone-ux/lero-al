# Task 615 — `MantineListingDetailPattern` contact-CTA never switches to row at `sm+` (inline-`style` specificity bug)

Sprint 44 (Epic MM Phase-2). Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_615_ListingDetailCTAFlexDirectionFix.md`.

## Root cause

`MantineListingDetailPattern.tsx:129` (before):
```tsx
<Group gap="sm" style={{ flexDirection: 'column' }} styles={{ root: { '@media (min-width: 40em)': { flexDirection: 'row' } } }}>
```
An element inline `style` always beats a stylesheet rule (including a `styles`-prop rule nested inside a media
query), so the `@media` override was permanently dead — the two contact CTAs stayed column-stacked at every width.

## Fix

Replaced `Group` + inline `style` + `styles`-`@media` hack with the canonical Mantine responsive prop:
```tsx
<Flex direction={{ base: 'column', sm: 'row' }} gap="sm">
  <Button color="brand" size="md" onClick={onCall} style={{ flex: 1, minWidth: 0 }}
    styles={{ inner: { minWidth: 0 }, label: { minWidth: 0 } }}>
    <span style={{ minWidth: 0, display: 'block' }}>{callLabel}</span>
  </Button>
  <Button color="green" size="md" onClick={onWhatsApp} style={{ flex: 1, minWidth: 0 }}
    styles={{ inner: { minWidth: 0 }, label: { minWidth: 0 } }}>
    <span style={{ minWidth: 0, display: 'block' }}>{whatsappLabel}</span>
  </Button>
</Flex>
```
- **`<640` (base):** `align-items:stretch` (CSS default for a flex container's cross axis, already relied on
  elsewhere in this codebase — see `mantine-responsive-design-system.md` §"flex-column container;
  align-items:stretch pulls the trigger to 100%") fills both buttons to 100% width without needing `fullWidth` —
  byte-identical to the prior stacked layout.
- **`sm+` (≥640, project theme `sm` = `40em`, `theme.ts:101`):** `direction: 'row'` + `style={{ flex: 1 }}` on
  each `Button` gives an exact 50/50 split of the available row width.

### Second defect found mid-task: flex-item automatic-minimum-size trap
The first `flex: 1` cut (no `minWidth`) genuinely switched the axis but surfaced a **real, previously-latent
overflow bug**, only reachable once CTAs actually share ~100–150px each at `sm`/`md` widths (previously they
always had the full column, ~330–370px, so this never manifested): Mantine's `.mantine-Button-label` is itself
`display:flex`, so a raw-text child becomes an *anonymous* flex box whose own `min-width:auto` floors at the full
word's min-content width. For an unbreakable single-word label (uk `"Зателефонувати"`, it `"Immobili…"`-class
tokens), `overflow-wrap: break-word` — set globally on `Button.styles.label` in `theme.ts:259` — does **not**
reduce intrinsic/min-content sizing (a documented CSS quirk; only `overflow-wrap: anywhere` does), so the
anonymous box refused to shrink and the label rendered on one line, overflowing the button box (in one iteration,
visibly overlapping the sibling WhatsApp button; in another, clipped after only `minWidth:0` was applied to the
addressable elements but not the anonymous text box).

**Root-cause fix:** wrap each label in an **explicit** `<span style={{ minWidth: 0, display: 'block' }}>` so
there is a real, addressable DOM node (not an anonymous box) between the flex label and the text — its own
`min-width:auto` floor can then be overridden to `0`, and the text wraps normally within the constrained width.
Combined with `minWidth: 0` on the `Button` root and on `styles.inner`/`styles.label`, this makes every flex
ancestor in the chain free to shrink, and the label genuinely wraps to a second line (button grows via the
existing theme `height: 'auto'` + `minHeight: 2.75rem`) instead of overflowing.

## Verification

**Storybook rebuild caveat (self-caught):** `screenshots:assert` serves the *existing* `storybook-static/` build
and does not rebuild it — the first `--mantine-only` run after the initial edit unknowingly asserted against a
**stale pre-fix build** (16/16 "pass" was actually testing the old `Group`/inline-style code). Caught via a
scoped Playwright probe showing `row=false` at 1024px, which shouldn't be possible post-fix. `npm run
build-storybook` was re-run before every subsequent assert.

**Scoped Playwright probe** (`scripts/_task615-cta-probe.mjs`, throwaway — deleted after use, not committed):
measures both buttons' bounding rects, same-row-ness, height, doc-level horizontal overflow, and per-button
`scrollWidth`-vs-`clientWidth` clipping at **320/375/390/768/1024 × sq/en/uk/it** (20 cells — 768 is not in the
standard gate's viewport matrix, added here to cover the tightest two-column width per the kickoff's negative
flow). Final run (post root-cause fix):
```
PASS 320x sq/en/uk/it: row=false h=44/44 overflow=false clip=false (full-width stacked, unchanged)
PASS 375x sq/en/uk/it: row=false h=44/44 overflow=false clip=false
PASS 390x sq/en/uk/it: row=false h=44/44 overflow=false clip=false
PASS 768x sq/en/it:    row=true  h=44/44 overflow=false clip=false widthDiff=0.0px
PASS 768x uk:          row=true  h=50/50 overflow=false clip=false widthDiff=0.0px  (label wraps 2 lines, grows to 50px, still equal-width)
PASS 1024x sq/en/uk/it: row=true h=44/44 overflow=false clip=false widthDiff=0.0px
✅ PROBE PASS — all cells match expected geometry
```
`uk@768` is the single tightest cell (longest label, narrowest two-column width) and passes via wrap-and-grow,
never clip/overflow — no STOP-AND-ASK needed.

**`npm run screenshots:assert -- --mantine-only`** (against the correctly-rebuilt `storybook-static/`):
```
Results: 889/916 PASS, 0 FAIL, 27 AMBIGUOUS (needs-owner-decision)
```
`Patterns/Mantine/ListingDetailPattern/Default` — **16/16 PASS** (verified directly against
`manifest.json`, all 16 cells `verdict: 'pass'`). Overall totals (889/916 PASS, 0 FAIL, 27 AMBIGUOUS) are
byte-identical to the Task 609 baseline in `docs/backlog.md` — zero regression anywhere else in the suite. The
27 AMBIGUOUS cells are the pre-existing `Combobox`/`RangeDatePicker`/`NotificationBellView`/`Tabs` overlap
cells, unrelated to this task.

**Anti-regression proof (AC5, planted-then-reverted):** temporarily changed the `call` button's
`style={{ flex: 1, minWidth: 0 }}` to `style={{ flex: 1, minWidth: 900 }}` (forces a 900px-wide button inside
the ~330px contact column → guaranteed horizontal overflow), rebuilt Storybook, re-ran the gate:
```
Results: 873/916 PASS, 16 FAIL, 27 AMBIGUOUS (needs-owner-decision)
  Patterns/Mantine/ListingDetailPattern/Default × sq/en/uk/it × mobile-320/375/390/desktop-1024  (all 16 cells)
```
All 16 (and only the 16) `ListingDetailPattern` cells FAILed; every other story's verdict was unchanged —
proving the gate genuinely detects a real CTA-row regression and wasn't neutered by this fix. Reverted the
`minWidth: 900` back to `0`, rebuilt Storybook again, re-ran the gate: **889/916 PASS, 0 FAIL, 27 AMBIGUOUS**
(byte-identical to the clean baseline) and the `ListingDetailPattern` cell count confirmed 16/16 PASS again via
a fresh `manifest.json` read. `git diff` on the pattern file after revert showed only the intended fix, no
plant residue.

**Static gates:**
```
npx tsc --noEmit                → 0 errors
npm run check:file-integrity    → ✅ PASSED — all 8 file(s) clean
npm run check:mojibake          → 0 artifacts in 1762 files
npm run check:stories           → ✅ PASSED — 117 files checked, 0 violations
```
(All four re-run after the final JSDoc edit, on the final committed state.)

## Acceptance-criteria self-audit

| AC | Status | Evidence |
|---|---|---|
| 1. `sm+` row, equal width, ≥44px, wrap not clip — 768+1024×4 locales | ✅ | Probe: all 8 cells PASS, `uk@768` wraps to 2 lines (h=50) instead of clipping/overflowing |
| 2. `<640` full-width stacked, byte-identical — 320/375/390×4 locales, `uk@320` | ✅ | Probe: all 12 cells `row=false`, equal full width, unchanged from `align-items:stretch` default |
| 3. No inline `flexDirection` pin; Mantine responsive prop; no breakpoint fork | ✅ | `MantineListingDetailPattern.tsx:135` `Flex direction={{ base:'column', sm:'row' }}`; single JSX tree |
| 4. `screenshots:assert --mantine-only` 16/16 PASS, 0 FAIL, 0 KNOWN-FAILURE, 27 AMBIGUOUS unchanged | ✅ | `Results: 889/916 PASS, 0 FAIL, 27 AMBIGUOUS` (byte-identical to Task 609 baseline); `ListingDetailPattern` 16/16 confirmed via manifest |
| 5. Planted-violation anti-regression (`minWidth:900`) | ✅ | 16/16 `ListingDetailPattern` cells FAILed, all others unaffected; reverted clean, re-verified green |
| 6. `tsc`/`file-integrity`/`mojibake`/`check:stories` clean + docs/session log | ✅ | See "Static gates" above; this file; `docs/backlog.md` updated below |

Self-validation: tsc=0 errors · build=n/a (Storybook-only, no `next build` needed for this scope) · AC table=all
green · runtime locale=uk PASS (768 wrap case, the hardest cell) · scope=clean (single file:
`MantineListingDetailPattern.tsx`) · integrity=PASS

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | Root-cause fix: `Group`+inline-`style`+`styles`-`@media` hack → canonical `Flex direction={{ base, sm }}` responsive prop; `flex:1`+`minWidth:0` (root, `inner`, `label`, plus an explicit wrapping `<span>`) so long two-across labels genuinely wrap instead of overflowing/clipping at `sm+`. JSDoc updated to match. |
| `docs/backlog.md` | Mark Task 615 done, tidy Last Session / numbering note. |
| `docs/sessions/2026-07-16-task615-listingdetailpattern-cta-flexdirection-fix.md` | This session log. |

No git commands run (single-writer rule — executor never runs git).
