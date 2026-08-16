# Sprint 60 — Homepage: Mantine completion and Tailwind residue

**Opened:** 2026-08-16 · **Status:** 🟠 OPEN · **Landed tasks:** 0

## Goal

Finish the homepage surface: migrate the components that still have **no Mantine at all**, and remove the
Tailwind utilities left inside components that are **already** on Mantine. Mechanical work, ordered
cheapest-first.

## Why a new sprint

46 (ListingCard follow-ups) · 55 (ARIA) · 56 (enum leaks) · 57 (deletions) · 59 (route inventory) — none is a
migration sprint. 58 closed with 749. Sprint 59 stays open and untouched: it proves *what the route mounts*;
this sprint *changes* it. They do not block each other — Sprint 59 is blocked on unanswered decisions, and
none of them gates the work here, which operates on named files with measured contents.

## Binding rule

**D28 (2026-08-01): de-hybrid is mechanism-only, zero visual delta.** Every task here authorises replacing a
Tailwind utility with its Mantine/CSS-module equivalent that renders identically. **No restyle, no token
change, no spacing/typography change.** A visual difference is a defect, not an improvement.

## Tasks

| # | State | Scope |
|---|---|---|
| **752** | KICKOFF FILED | Icon sizing + small layout utilities — 9 files, ≤6 utilities each |
| **753** | KICKOFF FILED | The three components with zero Mantine: `CaptchaWidget`, `AuthRedirect`, `PasswordRequirementsHint` |
| **754** | KICKOFF FILED | `NotificationCenter` + `NotificationItem` |
| **755** | KICKOFF FILED | `MobileNavDrawer` |
| **756** | KICKOFF FILED | `LocationCombobox` sub-panel · `MantineCopyIdButton` · `MantineListingCardPattern` |
| **757** | KICKOFF FILED | `AuthSheet` — largest, auth-critical, last |

This table is the single state source for Sprint 60.

## Execution order

752 → 753 → 754 → 755 → 756 → 757. Strictly sequential by risk, not by dependency: each is independently
executable, but running the cheap ones first establishes a clean baseline and proves the D28 comparator works
before it is pointed at `AuthSheet`.

**756 before 757:** both touch the same duplicated Tailwind fragment
`"border rounded-xl p-3 flex flex-col gap-2 bg-muted/30"` — present in `LocationCombobox.tsx:~` and
`AuthSheet.tsx:~`. 756 extracts or migrates it first so 757 does not migrate a divergent second copy.

## Out of scope for the whole sprint

- `AppImage.tsx` and `ListingFeatureIcon.tsx` — deliberate native wrappers; not touched by any task here.
- `PerfDevOverlay` — dev-only, stripped from production by a build-time constant (`PerfDevOverlay.tsx:15`).
- Container files with no markup (`Header.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`, `FeaturedListings.tsx`,
  `LatestListings.tsx`, `PopularLocations.tsx`, `HeroSearchClient.tsx`) — they render no elements.
- Anything on the `/listings` or listing-detail routes.
- The 10 baselined `governance:tailwind` HIGH findings in `theme.ts` / `MantineDataTableToCards.tsx`.

## Provenance of the file list

Measured from the `/[locale]` render graph on 2026-08-16 by reading each file's `className` literals directly;
every task below quotes the exact current strings and their line numbers, re-read at task-design time. The
counts are a **work list, not a gate threshold** — the retracted homepage audit's numbers are not an input to
any task here.
