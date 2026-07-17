# Task 618 — follow-up: premium-card gold-border cleanup (residual stripe + stale JSDoc)

**Task:** 618 (premium card uniform 1px gold border) — additional work after the main commit `4e7ffa437`.
**Type:** UI visual cleanup, no behavior change.
**QA profile:** Q2 Standard UI (targeted; geometry-neutral removal).

## Why this exists

The main Task 618 commit (`4e7ffa437 fix(Task618): premium card uniform 1px gold border, remove
outer ring + doubled top stripe`) landed the gold-border restyle but left two residual artifacts in
`MantineListingCardPattern.tsx` that belong to the same task's stated scope ("remove ... doubled top
stripe"):

1. A leftover `isPremium` top gradient-stripe `<div>` (`h-0.5 bg-gradient-to-r
   from-badge-premium/0 via-badge-premium to-badge-premium/0`) — the second of the "doubled" stripes
   the commit message set out to remove.
2. The `isPremium` prop JSDoc still described the old `brand ring + top gradient stripe` model
   instead of the shipped `solid gold 1px border`.

This follow-up removes the residual stripe and corrects the JSDoc so source matches rendered reality.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Removed the residual `isPremium` top gradient-stripe `<div>`; updated the `isPremium` JSDoc from "brand ring + top gradient stripe" to "solid gold 1px border + brand-tinted hover elevation" to match the committed Task 618 border. |

## Validation

- Change is a markup removal + comment edit; premium border and hover elevation are unchanged from
  the committed Task 618 state.
- Recommend confirming on the next `screenshots:assert --mantine-only` run that the premium
  `ListingCardPattern` cell shows the single gold border with no top stripe (0 FAIL baseline).

## Git

No git commands run by this record (single-writer rule). To be committed as an explicit-path
`fix(Task618)` follow-up commit.
