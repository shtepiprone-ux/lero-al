# Session Archive: Task 606 — `MantineListingCardPattern` gains `layout: 'grid' | 'list'` (Storybook only, no site wiring) — 2026-07-15

Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_606_ListingCardPatternListLayoutVariant.md`

## Why (owner-directed)

The List-view (horizontal) card must exist as part of the SAME single-source pattern before
anything is wired to the site. Built in Storybook first; site wiring of both shapes is a
separate, later, owner-authorized task. Owner decision (`AskUserQuestion`, 2026-07-15): ONE
pattern with a `layout: 'grid' | 'list'` variant, not a second component.

## Design source — ported, not redesigned

`layout='list'` structurally reproduces the legacy `ListingCard.tsx` `variant==='horizontal'`
branch, which already exists live in production (List view, `ListingsShell.tsx`) and was never
touched by Tasks 602/605/606:

- Image-left, fixed width (`w-32` <640, `sm:w-44` ≥640), `self-stretch`, `overflow-hidden`.
- Info-right column: top row = type-label + favorite (inline, not floating on the image); title
  (2-line clamp); price(+old) with the per-m² value INLINE on the same row (not stacked below,
  unlike `layout='grid'`) + a small original-price line beneath; features row; bottom row =
  location (left) + `footerActions` (copy-id/date, right) — location and footer share a row in
  list mode, unlike grid mode where location sits right under the title.
- `overlay` (centered rotated sold/rented banner) and `photoCount` (photo-count pill) are
  **intentionally NOT rendered** in `layout='list'` — the legacy horizontal design never had
  either; the `badges` array already carries the sold/rented status (via `getBadges()`, shared
  by both branches in the container). Documented explicitly in the props' JSDoc rather than
  silently dropped, since the kickoff's own Negative-flow checklist mentioned "sold → overlay,"
  which read ambiguously against the far more detailed and authoritative Design Source section —
  resolved in favor of the detailed structural description (no STOP-AND-ASK; the two sources of
  truth in the kickoff pointed in different directions and the more specific one won).
- Hover/premium/reduced-motion/coarse-pointer guards are **shared** with `layout='grid'` (the
  `styles.card`/`styles.premium` CSS module rules, unchanged) rather than re-deriving the
  legacy's own — and already cascade-layer-broken — `hover:shadow-md` Tailwind utility. The
  kickoff's own gate explicitly wants "same guards, both layouts," so this is not a deviation.
- Premium's top gradient stripe (grid-only) is dropped in list mode — there is no structural
  "top" to stripe in a horizontal row; the border-ring + hover-elevation (`styles.premium`) still
  applies. Minor, deliberate divergence, documented rather than silently different.

## Real bug found + fixed: cascade-layer break on `display`, not just `box-shadow`

First implementation used Tailwind `flex flex-row gap-3 overflow-hidden` directly on the pattern's
Mantine `Card` root for `layout='list'`. **Verified via Playwright computed-style inspection that
this silently did nothing** — the image and info column stacked VERTICALLY instead of
side-by-side (confirmed: `imageLeftOfInfo: false` in every one of the first 28 rendered cells).
Root cause: Mantine's `Card`/`Paper` sets its own `display: block` via **unlayered** CSS; Tailwind
v4 wraps all utilities in `@layer utilities`, and per the CSS Cascade Layers spec an unlayered
declaration always wins over a layered one regardless of specificity or source order — the
**exact Task 602 lesson** (which fixed this for `box-shadow`/`transform` on `:hover`), now hit
again for `display`. It was invisible on `layout='grid'` purely by coincidence: block-level
children stack top-to-bottom identically to a flex-column, so `flex flex-col` "worked" there
without ever actually taking effect either — a latent, unnoticed instance of the same bug.

Fixed by adding an unlayered `.listRow { display: flex; flex-direction: row; }` rule to
`MantineListingCardPattern.module.css` (competes with Mantine's CSS on equal footing, same
mechanism as the existing hover fix) and applying `styles.listRow` instead of the Tailwind
`flex flex-row` utility. Re-verified via `getComputedStyle(cardRoot).flexDirection`:

```
BEFORE (Tailwind-only): flexDirection = 'block' effectively (children stacked vertically,
                         imageLeftOfInfo:false in 28/28 cells)
AFTER  (CSS module):    flexDirection = 'row' (imageWidth matches the 128px/176px breakpoint,
                         strictly left of the info column, imageLeftOfInfo:true in 28/28 cells)
```

## Story rebuild — `ListingCardPattern.stories.tsx`

Kept the single `Default` export (governance §8 — one export per pattern group). Added a
labelled **List section** (`Stack` of 6 horizontal rows: regular/premium/reduced/sold/no-image/
archived — the same state matrix as the Grid section) below the existing, unchanged Grid
section. Demo nodes: `DemoFavoriteButton` gained an `inline` prop (list mode uses the legacy's
own `shrink-0 -mt-0.5 -mr-1` className instead of `absolute top-2 right-2 shadow-sm`) — both
variants built on the canonical `Button` `size="icon-sm"` (Task 603). No raw `<img>`/`<button>`
introduced (`eslint`'s `no-restricted-syntax` enforced this per `docs/storybook-governance.md`
§9/§14 — caught and fixed during the initial pass). 2 new `storybook.mantine.card_section_{grid,
list}` i18n keys × 4 locales (parity verified, 2155 keys × 4 locales; uk values kept in Cyrillic
— no Latin "grid"/"list" parenthetical, per Check 8).

## Regression coverage — new `MantineListingCardPattern.smoke.test.tsx`

No pattern-level test file existed before this task (only the container-level
`ListingCard.smoke.test.tsx`, which always exercises `layout='grid'` via the real `ListingCard`).
Added 4 tests:

1. `layout='grid'` (default) renders the full vertical content set — sanity guard that the new
   branch didn't regress the untouched default path.
2. `layout='list'` renders the image container as the Card root's FIRST child and the info
   column as the SECOND — the structural "image-left" marker. (jsdom does not execute real CSS
   cascade-layer resolution, so this is a DOM-order assertion; the actual visual row layout is
   proven separately via the Storybook Playwright script above.)
3. `layout='list'` still renders favorite/features/price/footerActions; `photoCount` is
   correctly ABSENT even though `photoCount=5` is passed (proves the by-design omission, not an
   accidental drop).
4. `layout='list'` does not render `overlay` even when passed.

**Planted-violation transcript** (temporarily swapped the image-div/info-div JSX order in the
`layout='list'` branch, moving the image container after the info column):

```
FAIL  MantineListingCardPattern — layout="list" > renders image container as the first child...
Error: expect(received).toBeInTheDocument()
  received value must be an HTMLElement or an SVGElement. Received has value: null
Test Files 1 failed | Tests 1 failed | 3 passed (4)
```
Reverted → 4/4 PASS. Confirmed the structural marker test genuinely catches an image/info order
regression.

## Real-page proof: N/A this task (by design)

Per the kickoff, there is no site consumer yet — `layout='list'` is Storybook-only. The
Storybook Playwright matrix (below) is the authoritative rendered evidence for this task; a
live-page proof applies to the later site-wiring task.

## Rendered matrix (Storybook, clause 12)

Script: `scripts/task606-qa-listingcard-list-layout.mjs` (new, ad hoc — not CI). Drives the built
`storybook-static/` (same build `screenshots:assert` uses). 4 locales × 7 widths
(320/375/390/768/1280/1440/2560) = 28 cells. Per cell asserts: grid section still shows exactly 6
Card roots with `flexDirection:'column'`; list section shows exactly 6 rows with
`flexDirection:'row'`; each row's image width matches the expected breakpoint (128px <640 /
176px ≥640) and sits strictly left of the info column; the favorite button's `position` is NOT
`absolute` (list-mode inline contract); zero page horizontal overflow.

```
Results: 28/28 PASS, 0 FAIL
```

uk@320/375/390 + one 2560 cell per locale captured, persisted at
`docs/sessions/2026-07-15-task606-assets/` (+ `manifest.json`). Personally reviewed by eye
(uk@320/375/390, en@2560): Grid section unchanged from Task 605's captures; List section rows
render image-left/info-right, full-width edge-to-edge at every mobile width, favorite renders
inline (visible as a small heart icon in the top row, not floating on the photo), badges show on
the image, premium row shows a visible border ring, sold row shows its badge (no centered
overlay, as designed), no-image row shows the correctly-sized fallback icon, archived row is
dimmed — no clipping, overlap, or horizontal scroll at any width in any locale.

## Grid-unchanged proof

`git diff` on `MantineListingCardPattern.tsx`: every removed/changed line is a JSDoc comment
rewrite; the grid branch's JSX (the code path that executes when `layout !== 'list'`) has ZERO
lines added/removed/changed — confirmed byte-identical to the Task-605 HEAD. The QA script's own
`gridCardCount === 6` + `flexDirection:'column'` check (28/28 PASS) is the runtime confirmation.

## Gates (all green)

```
npx tsc --noEmit                                                  → 0 errors
npx eslint <all touched files>                                    → 0 errors
npx vitest run ListingCard.smoke.test.tsx FavoriteButton.test.tsx
  MantineListingCardPattern.smoke.test.tsx                        → 40/40 PASS
npm run check:stories                                             → 116 files, 0 violations
npm run check:i18n                                                → 2155 keys × 4 locales, parity PASSED
npm run check:mojibake                                             → 0 artifacts in 1732 files
npm run check:file-integrity                                       → 18 files clean
```

No `git add`/`git commit` run — the orchestrator's call at review.

## AC-by-AC self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. `layout` prop added, default `'grid'`; grid byte-identical; list reproduces legacy design via same props; hook-free | `MantineListingCardPattern.tsx` diff (JSDoc-only changes to the grid path) + the cascade-layer bug found/fixed | ✅ |
| 2. Single `Default` story shows both Grid + List sections, canonical primitives, 4 locales | `ListingCardPattern.stories.tsx` diff + rendered captures | ✅ |
| 3. No site consumer touched | `git diff --stat` empty across all 6 consumer files | ✅ |
| 4. Storybook matrix (both sections, uk@320/375/390 mandatory) + list <640 full-width proof + grid-unchanged proof | 28/28 PASS matrix + screenshots + git-diff proof above | ✅ |
| 5. Regression test for list + verified planted-violation FAIL; grid stays green | 4 new tests, 1 planted-violation genuinely FAILed then reverted; `ListingCard.smoke.test.tsx` (grid, via the real container) still 10/10 | ✅ |
| 6. Gates green; file-integrity clean; Files-Changed + AC self-audit; no git ops | Gates section above | ✅ |

## Files Changed

| File | Rationale |
|------|-----------|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Added `layout?: 'grid'\|'list'` prop (default `'grid'`) + a new `layout==='list'` branch (image-left/info-right, ported from the legacy horizontal design) inserted before the unchanged grid `return`; JSDoc updated to document the per-layout contracts for `favorite`/`overlay`/`photoCount`/premium stripe. |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | New unlayered `.listRow` rule (`display:flex; flex-direction:row`) — Tailwind's `flex`/`flex-row` utility can never override Mantine's own unlayered `display:block` on the Card/Paper root (cascade-layer bug found + fixed this task). |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | New — pattern-level regression suite (4 tests), 1 verified planted-violation. |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | Added a labelled List section (6 rows) below the unchanged Grid section; `DemoFavoriteButton` gained an `inline` variant for list mode. |
| `messages/{en,sq,uk,it}.json` | 2 new `storybook.mantine.card_section_{grid,list}` keys × 4 locales (story fixtures only). |
| `docs/critical-flow-registry.md` | Row 57 appended with the Task 606 detail. |
| `docs/sessions/2026-07-15-task606-assets/` | New — persisted PNGs + manifest.json (`.screenshots/` is gitignored). |
| `scripts/task606-qa-listingcard-list-layout.mjs` | New — ad hoc Storybook-only QA script (not CI) for the rendered matrix. |
| `docs/sessions/2026-07-15-task606-listingcard-pattern-list-layout-variant.md` | This session log. |
