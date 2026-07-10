# Session Archive: HeroSearch mobile tab overflow hotfix (Task 570) — 2026-07-10

## Context

Owner reported the homepage mobile layout was broken: content rendered in a narrow column with dead
space on the right at <640. Diagnosed live on the running `localhost:3000/sq` via the connected Chrome +
the owner's Firefox DevTools console.

## Root cause (owner-confirmed via live console readout at the broken width)

The two sale/rent tabs in `HeroSearch.tsx` use the canonical `Button` (`@/components/ui/button`) with the
**default** size, whose variant classes include `max-sm:w-full` (the project's P0 mobile-full-width rule,
`button.tsx` lines 24–36 — every size, plus the dedicated `tab` size, carries it). The two tabs sit in a
**horizontal** `flex` row (`div.flex.mb-0`, not `flex-col`), so at <640 each tab became 100%-wide →
~200% of the viewport → horizontal overflow → the whole page shifted into a narrow column with dead
space right. Console readout at the broken width: `overflow:true`, `tabs:[{Shitje,w:410},{Qira,w:410}]`,
both `flex-grow:0` (not stretch — fixed full width each).

This is a **pre-existing live bug**, not introduced by recent work; the story-level rendered gates never
caught it because they test primitives in isolation, not the assembled homepage.

## Fix (orchestrator hotfix, owner-authorised)

`src/components/shared/HeroSearch.tsx` — added `max-sm:flex-1 max-sm:min-w-0` to the tab button className.
Via `cn()`/tailwind-merge, `flex-1` (flex-basis:0 + grow) makes each tab 50% so the two TOGETHER fill the
full row (satisfying the mobile full-width intent) WITHOUT the 200% overflow; `min-w-0` lets long uk/it
labels wrap instead of forcing overflow. Desktop (≥640) is unchanged. Owner confirmed overflow gone and
tabs full-width in Firefox at 442px.

## Deliberately deferred to Task 568 (visual polish)

The tab-strip AESTHETICS (joined inner corners — left tab no top-right radius, right tab no top-left
radius; inactive-tab translucent background must not show a clipped bottom; search-card `rounded-tr-2xl`
reconciliation; desktop full-width vs content-width decision) are a design pass that needs rendered
verification across sq/en/uk/it × breakpoints + TailAdmin/§18.9 review. Owner chose (2026-07-10) to commit
this overflow hotfix now and route the visual redesign through Task 568, whose kickoff item 1 was updated
to spell out the owner's spec. This hotfix is functional-only.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/HeroSearch.tsx` | `max-sm:flex-1 max-sm:min-w-0` on the sale/rent tab className — kills the <640 horizontal overflow (two `max-sm:w-full` tabs in one flex row = 200%); tabs now 50/50 full-width. |

## Self-validation

Owner-verified live at 442px (Firefox): `overflow:false`, two tabs each ~50% of the card, dead space
gone. Desktop unchanged (tabs content-width at ≥640). No logic touched (state/handlers/URL-params
untouched). Visual polish deferred to Task 568 per owner decision.
