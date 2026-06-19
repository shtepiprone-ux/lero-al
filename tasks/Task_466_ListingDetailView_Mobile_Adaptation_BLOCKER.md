# Task 466 — Fix mobile layout failures exposed by restored Storybook gate

> **Discovered by:** Task 464 repaired Storybook rendered-proof gate (2026-06-19).
> **Type:** Product / mobile layout fix. **Priority:** P0 blocker.
> **Blocks:** Task 464 final green baseline (the gate is correct — the product layout is broken).

## Goal

Restore a trustworthy green Storybook visual baseline by fixing every real mobile layout defect
exposed after Task 464 rendered-proof is repaired.

## Problem

Task 464 repaired the Storybook screenshot gate so it can no longer false-green on spinner-only,
blank, or empty screenshots. With the gate now trustworthy, it exposes pre-existing mobile layout
defects that were previously masked by the broken rendered-proof layer.

## Scope

Every `ASSERT_STORIES` cell that passes rendered-proof (layer 1) but fails layer-2 visual gates:
- horizontal overflow (`noHorizontalOverflow`)
- full-width buttons at mobile (`fullWidthButtonsAtMobile`)
- bottom-sheet/popup placement (`popupBottomSheetAtMobile`)
- full-width form controls (`fullWidthControlsAtMobile`)

Group fixes by component/surface. Do NOT weaken the harness. Do NOT allowlist real product defects.
Do NOT mark Task 464 baseline restored while any asserted mobile visual cell remains red.

## Known defects from Task 464 gate (inventory at time of filing)

### ListingDetailView (intermittent, borderline)
- **storyId:** `listings-listingdetailview--public-listing-mobile-375`
- **assertion:** `fullWidthButtonsAtMobile: false`
- **failing buttons:** "Назад до оголошень", "3 фото", "Всі фото (3)", "Поділитись"
- **locale/viewport:** sq × mobile-320 (intermittent — passed in 3/4 runs, failed in 1/4)
- **screenshot:** `.screenshots/rendered-assert/2026-06-19T12-08/listings-listingdetailview--public-listing-mobile-375__sq__mobile-320.png`
- **Visual issues beyond the assertion:** broken image alt text as visible UI; owner contact area
  column compression (vertical single-character stacking); sticky bottom bar overlaps content

### Full inventory pending
Run the fixed Task 464 `screenshots:assert` (full, not fast) to produce the complete matrix.
Any cell that passes rendered-proof but fails a visual gate must be added to this list.

## Required behavior

1. 320 / 375 / 390 mobile layouts must be readable
2. No text may collapse into vertical letters
3. Primary actions must stack/wrap predictably
4. Sticky bars must not cover content
5. Image placeholders must not expose broken alt text as visible UI
6. Buttons required to be full-width by the project rule must be full-width
7. All sq/en/uk/it variants must pass
8. Desktop/tablet behavior must not regress
9. No horizontal overflow

## Validation

- Run the fixed Task 464 `screenshots:assert` matrix
- All rendered-proof layers green
- All visual assertion layers green
- Provide before/after screenshots for each fixed surface
- Provide final manifest summary with 0 failures

## Acceptance

Task 464 green baseline is restored only when this task lands and `screenshots:assert` (full)
shows 0 failures across all asserted stories.
