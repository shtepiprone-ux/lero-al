# Sprint 72 — the similar-listings block becomes a real entry point into search

**Opened:** 2026-09-09 · **Owner request:** 2026-09-09, in review of Task 792.

## Goal

The "similar listings" block on `/[locale]/listings/[slug]` stops being a decorative four-card grid and becomes a
working entry point into `/listings`: it shows up to eight results, scrolls, and carries a canonical
"view all" control whose target is built from **the same similarity predicate the block itself queried**. When the
full predicate matches nothing, the system relaxes it deterministically rather than rendering nothing.

Second half of the goal: the filter surface must be able to express what a listing actually is. Three listing
columns (`bedrooms`, `bathrooms`, `toilets`) have no filter at all, and three engine-supported filters
(`heating`, `wall_type`, `offer_type`) have no UI control.

## Why not an existing sprint

| Sprint | Goal sentence | Fit |
|---|---|---|
| 46 | ListingCard de-Tailwind + overlay exit | No — this is not a de-Tailwind slice and does not touch `ListingCard`'s chrome. |
| 55 | ARIA semantics no gate sees | No — no accessibility-semantics deliverable. |
| 56 | Raw enum leaks and the blind detector | No — no detector work. |
| 57 | Delete what no longer earns its place | No — this adds behaviour, deletes nothing. |
| 61 | The projection layer no gate reads | No — no ledger/projection scope. |
| 62 | Tailwind runtime tokens outlive Tailwind | No — no token scope. |
| 68 · 69 | `/listings` leaves Tailwind / finishes the Mantine migration | No — both are migration sprints with zero open tasks; both are awaiting a closure decision. |
| 70 | The site chrome leaves Tailwind | No — cabinet/site chrome, not the detail route. |
| 71 | The listing-detail route leaves Tailwind | **No — and this is the load-bearing one.** Sprint 71's goal sentence is a de-Tailwind migration. `docs/backlog.md`'s 801/802 row already records the precedent: *"that sprint's goal sentence is a de-Tailwind migration and mixing a feature in breaks its own goal-fit rule."* Task 803 is a feature. |

Nothing fits, so this sprint is opened per `create-task/SKILL.md` -> "Sprint assignment".

## Tasks

> **This table is the single state source for the sprint.** The execution-order note below is ordering and gating
> only; it never carries task state. (Structural fix recorded 2026-08-10 after Task 702's state lived in two tables
> and only one was maintained.)

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **803** | The similar-listings block becomes a real entry point into search | P2 | **Q4** | `NEEDS REVISION` 2026-09-10 — Revision 2 kickoff §17 filed |
| **804** | The filter surface can express what a listing is | P2 | TBD at kickoff | `RESERVED` |

**Execution order: 803 -> 804.** 803 ships with the parameters the engine accepts today. 804 adds the missing ones
and extends 803's single similarity map by one row per new parameter; it must not fork a second mapping.

## Preconditions

1. Task **792** must reach `APPROVED` / `APPROVED WITH NOTES` first. 803 edits `SimilarListingsView.tsx` and its
   canonical story, both of which are uncommitted 792 artifacts. Starting 803 over an unreviewed 792 diff makes both
   unreviewable.
2. `next start` with a seeded database. 803's acceptance needs a listing whose similar-listings block is populated
   **and** one whose full predicate matches nothing, to exercise the relaxation ladder.

## Binding decisions

- **D72-1 — the link and the query must agree.** "View all" means "all of the ones above". Its href is built from
  the predicate that actually produced the rendered set, after relaxation settles — never from the unrelaxed
  predicate and never from a separately-assembled parameter list. Owner instruction, 2026-09-09.
- **D72-2 — relaxation never touches the core.** `applyPublicVisibility`, `.neq('id', currentId)`, `property_type`
  and `listing_type` are not droppable at any rung. The public-visibility invariant is a registered critical flow
  (`docs/critical-flow-registry.md`, "Listing public visibility invariant", which names `SimilarListings.tsx` as a
  consumer), so a ladder that can drop it is a P0 data-exposure defect, not a UX trade-off.
- **D72-3 — one similarity source, two consumers.** The Supabase predicate and the URL are two renderings of one
  ordered structure. A second, hand-maintained parameter list is the defect this sprint exists to prevent.
- **D72-4 — a round trip is not free.** The relaxation ladder runs on a hot below-the-fold route. It is capped at
  four queries total; rungs are grouped into tiers to fit that cap, never evaluated one parameter at a time.

- **D72-5 — the card row scrolls horizontally at every width.** Owner decision, 2026-09-09, taken after seeing the
  live route: not the project's existing scroll-below-`sm`/grid-above contract, but a true carousel on desktop too.
  This overrides the reversible default the kickoff was filed with. `RecentlyViewedGridView` keeps its own
  breakpointed contract and is not changed to match.

## Exit criteria

1. 803 and 804 both `APPROVED` / `APPROVED WITH NOTES`.
2. The similarity map is the only place a listing field becomes a filter parameter; a grep for a second
   field-to-param mapping in the detail route returns nothing.
3. The public-visibility regression test covers every rung of the ladder and has a recorded planted-violation
   failure.
4. `docs/binding-decisions.md` has absorbed D72-1..D72-4, or this file is named as their home in the backlog row.
