# Sprint 48 — Homepage tail: the last raw Tailwind outside the listing card

**Opened:** 2026-08-03. **State:** 🟠 **OPEN.** **Epic:** MM (Mantine/TailAdmin) Phase-2.

> **Why a new sprint rather than folding this into 46 or 47.** Sprint 46
> (`Sprint_46_ListingCard_DeTailwind_And_Overlay_Exit.md`) is a single dependency chain around the listing card and
> the `--overlay` token pair (691 → 702 → 695, plus 694/700); the homepage loading skeletons and a CTA icon are not
> part of it. Sprint 47 (`Sprint_47_Layout_Shell_DeHybrid.md`) closed its stated goal when 673 and 706 both landed —
> reopening it for unrelated surfaces would falsify its own exit criteria. Per the 2026-08-01 owner rule, the next
> sprint is opened first and the kickoff is written inside it.

## Goal

Remove the last raw Tailwind utility classes from the homepage tree that are **not** owned by the listing card, so
that after Sprint 46 lands the whole `/[locale]` tree is Tailwind-utility-free at the component level.

The sprint ends when `FeaturedListingsView`, `LatestListingsView` and `AgentCtaButton` hold zero raw Tailwind
utility classes and their rendered output is unchanged.

## Homepage state at sprint open — measured 2026-08-03

| Surface | `className=` sites | Owner | State |
|---|---:|---|---|
| `FooterView` | 15, all `styles.*` | 673 | ✅ landed `135e864e7` |
| `HeaderView` | 10, all `styles.*` | 706 | ✅ landed `911852104` |
| `PopularLocationsView` | 5, all `styles.*` | 688 | ✅ |
| `HeroSearch` · `HeroSearchFallback` · `HowItWorksSteps` · `ViewAllLink` | 0 | — | ✅ |
| `MantineListingCardPattern` | **27 code sites** (`grep` says 28; `:73` is JSDoc) | **691** | Sprint 46.4, draft 2 filed 2026-08-11. The old "25 editable" figure is void — two of its three "contracts" do not exist (691 draft 2 §0 A1/A2) |
| `ListingCard` | 8 | **702** | Sprint 46, blocked on 691 |
| `FeaturedListingsView` | 3 — **2 raw** + 1 marker | **707** | **this sprint** |
| `LatestListingsView` | 3 — **2 raw** + 1 marker | **707** | **this sprint** |
| `AgentCtaButton` | 1 — icon `h-4 w-4` | **707** | **this sprint** |

## Owner decisions — source of truth, not to be re-litigated

| ID | Question put to the owner | Ruling |
|---|---|---|
| **D28** (2026-08-01, Sprint 47) | How is a de-hybrid performed? | **Mechanism-only, zero visual delta.** Utilities → Mantine style props where a prop exists, a colocated `.module.css` where one does not (the Task 688 **D16** pattern). No restyle, no token change. Carried into this sprint unchanged. |
| **D31** (2026-08-03) | `AgentCtaButton` has no story and is not in `mantine-migration-scope.json`. Own task, or folded in? | **Folded into 707.** Its single site is the same lucide `size`-prop pattern Task 706 measured and proved; splitting it would produce a one-line task. Its evidence is necessarily different in kind (computed-box measurement, no enrolled cell) and the kickoff states that explicitly rather than implying md5 coverage it does not have. |

## Tasks

| # | State | Scope | Depends on |
|---|---|---|---|
| **707** | `KICKOFF FILED` (2026-08-03) | Homepage tail de-Tailwind — `FeaturedListingsView` (2 raw sites), `LatestListingsView` (2 raw sites), `AgentCtaButton` (1 icon site). Marker classes `featured-listings`/`latest-listings` preserved verbatim. Proof: the **32** enrolled `Patterns/Mantine/HomepageListingGrids` cells (`Default` + `Loading`), plus `check:homepage-grid`. `Sprint_48_kickoff_prompt_Task_707_HomepageTail_DeTailwind.md` | — |

## What makes 707 different from 673 / 706

| | 673 · 706 | 707 |
|---|---|---|
| Enrolled proof story | the component's own `Mantine/Primitives/*` story | **`Patterns/Mantine/HomepageListingGrids`** (Task 668) — an *additive* enrolment story that statically imports both real Views. Its `Loading` export renders exactly the skeletons being migrated |
| Enrolled cells | 16 | **32** (2 exports × 4 widths × 4 locales) |
| Second gate | `test:header-hydration-id-parity` (706) | **`check:homepage-grid`** — reads grid columns/gaps from the `System/*` story IDs and ships its own planted-violation mode (`check:homepage-grid:verify`) |
| Marker-class consumers | `.site-footer` 0 · `.site-header` 3 | `.featured-listings` / `.latest-listings` — **0 live consumers**, declared only on each View's loading grid |
| Token debt | 706 took 28 → 23 | **none** — all three files contribute 0; the total must still read **23** |
| Out-of-gate component | — | `AgentCtaButton` has no story and no enrolled cell; its proof is a measured computed box on the real page, and the kickoff says so instead of pretending otherwise |

## Preconditions before 707 starts

- 706 must be landed (it is — `911852104`), so the module convention 707 copies is the reviewed one.
- **Do not re-title `System/FeaturedListings` / `System/LatestListings`.** Their story IDs
  (`system-featuredlistings--default`, `system-featuredlistings--loading`, `system-latestlistings--default`,
  `system-latestlistings--loading`) are hard-coded in `scripts/check-homepage-grid.mjs` (including its plant specs
  and `HEADER_STORY_ID`) and in `check-stories-rendered.mjs`'s `ASSERT_STORIES` anchors. A rename silently rewires
  a CI gate. Enrolment already exists additively via Task 668's `Patterns/Mantine/HomepageListingGrids`.
- `src/design-system/mantine/skeleton-chrome.css` is a **global** stylesheet targeting
  `.mantine-Skeleton-root::after` (imported by `app/layout.tsx` and `.storybook/preview.tsx`). It is the canonical
  home for the Skeleton *pulse*, not for the wrapper `Box` chrome — record the search per agent-contract 16b, then
  use colocated modules per D16. **Do not edit it** (Task 704/705 own it).

## Sprint exit criteria

1. `grep -c 'className='` on all three files returns only values that are `styles.*` or the verbatim marker
   strings `featured-listings` / `latest-listings` — zero raw Tailwind utilities.
2. All **32** enrolled `HomepageListingGrids` cells keep their pre-task PNG md5 and verdict under the
   `docs/storybook-governance.md` §14.11 (D26) comparator.
3. `npm run check:homepage-grid` green, with the pre-task baseline recorded first.
4. `check:design-tokens` still **23** — this sprint adds and removes nothing there.
5. `npm run build` exit 0.
