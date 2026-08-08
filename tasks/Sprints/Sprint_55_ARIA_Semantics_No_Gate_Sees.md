# Sprint 55 — ARIA semantics no gate sees

**Opened:** 2026-08-08. **Owner decision:** 2026-08-08 — Task 726's review produced two production a11y defects
(**730**, **731**) that no open sprint covers, and the 2026-08-01 rule forbids writing their kickoffs without one.

Why not an existing sprint, checked before opening this one:

| Sprint | Goal | Fit |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No — different surface, and **D28** binds it to mechanism-only changes at zero visual delta; these are semantic additions |
| **52** | Gates that stopped checking | No — 52's subject is *detectors* that stopped measuring. 730/731 are real production defects the detectors never claimed to cover. **732** is the detector half of 726's residue and correctly sits in 52; these two do not |
| **54** | Mobile bottom-nav overlay collision | No — different surface and a different failure mode |

Opened per the 2026-08-01 owner rule: no open sprint fits → open the next one with its own plan file before
writing the kickoff.

---

## Goal

Two accessible names in `src/` currently convey nothing to assistive technology. Make them convey what they claim,
and — per the standing M1/M2/M4/M5 lesson — name the control that would have caught them, even if that control
turns out not to exist.

## The defects, both found by the Task 726 review (2026-08-08)

**730 — a named group with no state.** Task 726 restored `role="group"` + `aria-label` on `FilterMultiToggle` and
`FilterRoomsRow`, but neither leaf sets `aria-pressed` on its options: selection is carried only by the Mantine
`variant` (`filled` vs `default`), which is a paint, not a semantic. A screen reader reaches "Condition, group"
and then N indistinguishable buttons. 14 live sites — 7 in `ListingsFilters.tsx`, 7 in `FiltersPanel.tsx`.

The repository already contains the correct pattern, and 726's own §12/A2 cites both instances as the precedent
that justified choosing `role="group"` at all: `FavoritesTypeFilter.tsx:31` and `ListingsTab.tsx:171` each set
`role="group"` **and** `aria-pressed`. 726 adopted the first half only.

**731 — a name on an element with no role.** `aria-label` on a role-less `<div>` is not exposed (ARIA 1.2) — the
exact defect 726 R6 fixed in the chip rows. It survives at `AdminCardList.tsx:47,62,69` and
`StatusChangeControl.tsx:106,163`. 726's R7 audit could not surface these by construction: it enumerated
`role="group"`-capable sites, i.e. the role side, and never the inverse — a name with no role.
`AdminTable.tsx:151` (`<table>`) and the `<nav>` breadcrumbs are correct via implicit roles and must not be touched.

## Why no gate caught either

`check-stories-rendered.mjs` measures geometry and paint, not semantics — `fullWidthButtonsAtMobile` would have
passed both defects unchanged, and did. `check:story-coverage` scopes by title prefix. Nothing in `scripts/` reads
`aria-pressed`, and nothing asserts the name/role pairing. This is the sprint's most transferable output: the
detector question must be answered explicitly rather than left implied.

## Tasks

| # | Scope |
|---|---|
| **730** | `aria-pressed` on both chip-row leaves, threaded from the same `selected` state that already drives `variant`; correct `storybook-governance.md` §14.9.28's "announce as named groups", which overstates what 726 shipped |
| **731** | The 5 admin sites above; a repo-wide census of `aria-label` on role-less elements, so the count is measured rather than assumed |

## Exit criteria

1. Every multi-select toggle set in `src/` conveys per-option state, not only a group name — proven by a rendered
   assertion or a smoke test that fails without the attribute, never by inspection alone.
2. No `aria-label` in `src/` sits on an element with neither an explicit nor an implicit role, and the census that
   establishes this is recorded with its command.
3. §14.9.28 states what actually ships.
4. The detector question is answered in writing: either a gate arm exists and is proven fail→pass, or the sprint
   records why one is not worth building and reserves the number that would build it. **Do not close this sprint
   with the detector question implied.**

## Binding note carried in from 726

An exemption a component author can hand-apply is not an exemption the gate owns (724 F1, closed by 726). Any
detector proposed under criterion 4 must key on a condition it evaluates itself, never on an attribute the
component under test supplies.

---

## Execution order (added 2026-08-08)

**One kickoff, not two: 730 absorbs 731.** Both are the same defect class inspected from two sides — an accessible
name that conveys nothing — both are pure `src/` edits proven by smoke tests, and neither needs a matrix sweep,
because the rendered gate measures geometry and never reads a role or a state attribute. Splitting them would buy
two kickoffs, two reviews and two sessions for one repo-wide census.

Internal order inside the single task: **the census first**, then the fixes. Establishing where `aria-label` sits on
a role-less element (731's five known sites plus whatever the census adds) before editing keeps the count measured
rather than assumed — the failure mode 726's own R7 audit hit when it queried only the role side.
