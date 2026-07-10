# Session Archive: `HeroSearch` → Mantine (Task 568) — 2026-07-10

## Context

Task 568, `tasks/Sprints/Sprint_43_kickoff_prompt_Task_568_HeroSearchMantine.md`. Sprint 43
(FiltersPanel/HeroSearch → Mantine, Epic MM Phase-2 composite). Depends on Task 567 (`FiltersPanel`
shell → Mantine, approved). Last legacy-primitive holdout in the search stack: `HeroSearch.tsx` still
imported `@/components/ui/button` for its 4 Buttons (sale/rent tabs, filters trigger + corner badge,
search). Task 570 had already hotfixed a live mobile-overflow bug on the tabs
(`max-sm:flex-1 max-sm:min-w-0`) and deliberately deferred the tab-strip visual polish (joined
corners, card-radius reconciliation) to this task.

## STOP-AND-ASK resolved before implementation

The kickoff originally asked for the persisted story to mount the REAL `HeroSearch` with
`useLocations` mocked to a fixture set. Investigation found the harness has no MSW / per-story
module-mock addon — only a global Vite alias in `.storybook/main.ts` (`@` → `src`). Mocking
`useLocations` for one story only would require either a global alias (test-only, affects every
story) or letting the story hit the **live** Supabase database during `screenshots:assert` (network-
dependent, non-deterministic, not a controlled fixture). Flagged to the owner; the owner's decision
(2026-07-10) was to split `HeroSearch` into a thin container + a prop-driven presentational
`HeroSearchView`, superseding the mock plan entirely — the kickoff file was updated live with this as
item 0. Implemented as specified below.

## Implementation

**Item 0 — container/view split**: `src/components/shared/HeroSearchView.tsx` (**new**) is a pure
presentational component — no hooks, no data fetching, everything via props (`locations`,
`listingType`/`onListingTypeChange`, `propertyType`/`onPropertyTypeChange`, `locationId`/
`onLocationChange`, `filters`/`onFiltersChange`, `activeFiltersCount`, `filtersOpen`/`onOpenFilters`/
`onCloseFilters`, `onSearch`, `onLocationKeyDown`); `t`/`tl`/`th` resolved inside via
`useTranslations` (i18n only, not data-fetching — explicitly allowed by the kickoff).
`HeroSearch.tsx` became the thin container: owns `useLocale`/`useRouter`/`useLocations`, all
`useState`, `cityRegionLocs` memo, `countActiveFilterValues`, `handleSearch` (URL-param
serialization — **byte-identical**, not retyped, moved verbatim), `handleKeyDown`; renders
`<HeroSearchView .../>`. Public API unchanged (no props); `HeroSearchClient.tsx` and
`src/app/[locale]/page.tsx` untouched (grep-confirmed — both only reference the exported
`HeroSearch` symbol).

**Item 1 — sale/rent tabs**: `ui/button variant="ghost"` → `@mantine/core` `Button` with `unstyled`
(boolean prop, not `subtle` — chosen because the theme's own `Button.styles` callback only patches
`outline`/`default` variant colors; `subtle` would leave Mantine's own color/hover resolver
unpatched, fighting the bespoke `bg-primary-foreground/15`/`bg-background` classes the same way
`outline`/`default` needed patching for). `unstyled` strips Mantine's static CSS-module classes but
the theme's `styles` callback (min-height 44px, `height:auto`, label wrap fix) still applies —
verified via the theme source, not assumed. **Joined-inner-corner radius**: each of the 4 corners
declared with an explicit per-corner Tailwind utility (`rounded-tl-xl`/`rounded-tr-none`/
`rounded-tr-xl`/`rounded-tl-none`/`rounded-b-none`), never the bare `rounded-*` shorthand — Mantine's
own radius CSS custom property is set via the `border-radius` shorthand, which (per the codebase's
established, working precedent of overriding it with Tailwind's `rounded-xl` elsewhere) is won by
whichever shorthand rule is later in the cascade; using ONLY per-corner longhand utilities for all 4
corners avoids ever leaving a corner "unclaimed" for Mantine's shorthand to reclaim. Task 570's
`max-sm:flex-1 max-sm:min-w-0` preserved verbatim inside the new className.

**Search-card radius reconciliation**: `rounded-b-2xl rounded-tr-2xl` → `rounded-b-2xl
sm:rounded-tr-2xl`. At `<640` the tab strip is now full-width (covers the entire top edge including
where the card's top-right corner used to peek out), so the top-right rounding is dropped there
(flush strip, no exposed corner); at `≥640` it's restored — desktop tabs remain the original
content-width chips at top-left, so the card's top-right corner is still visible there, unchanged
from before this task.

**Desktop tab layout**: left untouched per the kickoff's explicit "STOP and ASK before changing
desktop" instruction — this task does not touch the `≥640` tab width/layout at all, so no owner
decision was needed on that point.

**Item 2 — filters trigger**: `variant={activeFiltersCount>0 ? 'filled' : 'default'}` (no `outline`);
`SlidersHorizontal` as `leftSection`; label kept as a `hidden sm:inline` child span; `aria-label`
preserved; no `size` prop (theme default `sm` + the 44px `minHeight` override — no banned
`size="lg"/"xl"`, Task 520).

**Item 3 — search button**: `variant="filled"`; `Search` as `leftSection`; label as children;
`flex-1` + `font-semibold` kept; `onClick={() => onSearch()}` unchanged.

## Bug found and fixed: corner badge clipped by Mantine `Button`'s `overflow:hidden`

Following the kickoff's literal spec (`SlidersHorizontal` as `leftSection`, badge as an absolutely-
positioned `Button` child) reproduced the **exact same defect Task 567 hit on its own Apply badge**:
the first `screenshots:assert -- --mantine-only` run genuinely FAILed all 16 `HeroSearch` cells with
`text-clipped` on `button("Advanced filters2")` (every locale × every viewport, incl. desktop). A
rendered PNG (`.screenshots/rendered-assert/2026-07-10T09-30/…desktop-1024.png`) showed the "2" digit
visibly sliced to a sliver at the button's rounded corner. Root cause: Mantine `Button`'s own root has
`overflow:hidden`, which clips any child positioned outside its own box — the badge's
`-top-1.5 -right-1.5` offset extends past the button edge.

**Fix**: moved the badge from a `Button` child to a sibling inside a shared `relative` wrapper
`<div>` around the `Button` — the badge's own markup/classes are byte-identical (preserved verbatim
per the kickoff, not restyled, not swapped for `MantineCountButton`), only its DOM position changed
so it escapes the Button's internal clipping box. This is the same technical workaround Task 567
independently discovered for its own (later superseded) corner badge — a precedented pattern, not a
new design decision, so it did not require a fresh STOP-AND-ASK.

**Verified via re-run**: rebuilt Storybook (`npm run build-storybook`, required — the assert script
reads a pre-built `storybook-static/`, not a live rebuild; the first `--mantine-only` run silently
scored against a stale build that predated the new story until this was caught) and re-ran
`screenshots:assert -- --mantine-only`: `HeroSearch` all 16 cells now PASS, corner badge fully
visible and not clipped in the rendered PNGs.

## Frozen, confirmed untouched

`PropertyTypeCombobox`, `LocationCombobox`, `FiltersPanel` (already migrated). `filterEngine`/
`countActiveFilterValues`, the `handleSearch` URL-param contract (moved, not retyped — same
`if (…) params.set(…)` sequence, same param names/order), `useLocations`, `useHomepageFilters`,
tab/filter state semantics. `HeroSearchClient.tsx`, `src/app/[locale]/page.tsx` — zero edits,
grep-confirmed.

## Regression coverage

New `src/components/shared/__tests__/heroSearch.smoke.test.tsx` mounts the REAL `HeroSearch`
container end-to-end (mocks only `useLocations`, `next/navigation`, and `FiltersPanel`'s own external
data hooks — same mock set as `filtersRangeDatePicker.smoke.test.tsx`). 4 tests: (1) Search click →
`router.push('/en/listings?type=sale')`; (2) Rent tab then Search → `type=rent`; (3) filters-trigger
click renders `FiltersPanel` (listing-id input anchor); (4) corner badge absent with no filters,
shows "1" after typing a listing-id + clicking Apply. Planted-violation: dropped the search button's
`onClick` in `HeroSearchView.tsx` → assertions 1 and 2 genuinely FAILed (`router.push` 0 calls each),
reverted → 4/4 PASS. Baseline: `filterLeafComponents.smoke.test.tsx` (8) +
`filtersPanelShell.smoke.test.tsx` (15) + `filtersRangeDatePicker.smoke.test.tsx` (6) re-verified
green post-migration (33 tests total across the search stack, zero regressions). Registry:
`docs/critical-flow-registry.md` → "Listings filter controls" row extended (not a new group).

## Rendered evidence

New persisted story `src/stories/mantine/primitives/HeroSearch.stories.tsx` under
`Mantine/Primitives/HeroSearch` — renders `HeroSearchView` directly (no hook mock, no Vite alias, no
live Supabase) with a deterministic fixture `locations` list (reuses the existing
`storybook.mantine.combobox_option_tirana`/`_durres` keys, no new i18n keys needed), seeded state
(`listingType='sale'`, `activeFiltersCount=2` to exercise the filled trigger + corner badge in one
capture), no-op callbacks, wrapped in the same hero-gradient `<section>` classes as the real homepage
(`src/app/[locale]/page.tsx`). `filtersOpen=false` — the `FiltersPanel` drawer itself is already
proven by Task 567's `FiltersPanelShell` story, out of this task's focus.

`screenshots:assert -- --mantine-only`: story count 36→37 (+1, +16 cells). First run (against a
stale pre-568 Storybook build) incorrectly reported 550/576 PASS with the new story entirely
missing — caught by comparing the story/cell count against the expected +16 delta, root-caused to
the script reading a pre-built `storybook-static/` directory rather than rebuilding. After
`npm run build-storybook`: **550/592 PASS, 16 FAIL (all `HeroSearch`, `text-clipped` — the badge-clip
bug above), 26 AMBIGUOUS** (pre-existing, unrelated — `Combobox`/`RangeDatePicker` backdrop-overlap
+ `Tabs` swipe-offscreen, same 26 before this task). After the badge fix + a second
`build-storybook` + re-run: **566/592 PASS, 0 FAIL, 26 AMBIGUOUS** (same pre-existing 26, `HeroSearch`
all 16/16 PASS).

**§18.9 human-visual set** — inspected the actual rendered PNGs at all required combos:
- `uk@320/375/390` — tab strip: "Продаж" (active, white, flush) / "Оренда" (inactive, translucent),
  joined inner corner (no notch/gap at the seam), correct outer-corner rounding; filters trigger
  icon-only with a fully legible, non-clipped "2" corner badge; search button filled brand, icon +
  label not overlapping; no h-scroll at any width.
- `sq@320` ("Shitje"/"Qira") and `it@320` ("In vendita"/"In affitto") — same, clean, no clipping/wrap
  issues, long labels fit without overflow.
- `en@1024` (the harness's desktop viewport — no `1280` breakpoint exists in
  `check-stories-rendered.mjs`'s viewport set, so this is the closest/only available desktop capture)
  — tabs remain content-width chips at top-left (desktop unchanged, as scoped), filters trigger shows
  the full "Advanced filters" label + fully visible corner badge, search button correct.

## AC-by-AC self-audit

1. ✅ Container/view split done; zero `@/components/ui/button` imports in either file; all 4 Buttons
   are `@mantine/core` `Button`; no raw `<button>`; `HeroSearch` public API unchanged;
   `HeroSearchClient.tsx`/`page.tsx` untouched (grep-confirmed).
2. ✅ `handleSearch`/`handleKeyDown`/state moved verbatim into the container, not retyped; Task 570's
   tab fix preserved in the view.
3. ✅ Tabs migrated, bespoke hero className preserved (hero-relative tokens, not §6a); joined-corner +
   inactive-bg-flush spec implemented and proven via rendered PNGs; `onListingTypeChange` wiring
   unchanged; tab-strip compact exemption documented (§ below).
4. ✅ Filters trigger: `filled`/`default` toggle, no banned size, `leftSection`, `hidden sm:inline`
   label, `aria-label` preserved, corner badge markup preserved verbatim (position fixed, markup
   untouched), icon-only `<640` exemption documented.
5. ✅ Search button: `filled` §6a, no banned size, `leftSection` + label, `flex-1`, wiring unchanged.
6. ✅ Mobile `<640`: action row full-width, search `flex-1`, filters icon-only exemption, tabs
   tab-strip exemption, ≥44px touch (theme-guaranteed `minHeight:2.75rem`), no h-scroll at 320 in any
   locale (verified in rendered PNGs).
7. ✅ §6a matched for filters/search (filled brand `#EC5447` / bordered default, verbatim from theme
   — zero invented values); hero tabs proven pixel-equivalent to the pre-change hero treatment
   (same color tokens, same active/inactive branching); §18.9 checks pass.
8. ✅ Registry row extended (not a new group); baseline (33 pre-existing search-stack tests) recorded
   green before AND after; `heroSearch.smoke.test.tsx` added with a genuine planted-violation FAIL
   transcript, reverted to green.
9. ✅ No new runtime i18n keys (`common.advanced_filters`/`search`, `listing.sale`/`rent`,
   `home.hero_placeholder_location` all reused); story fixture reused existing `storybook.mantine.*`
   keys (no new keys needed); `check:i18n` green (2128 keys, all 4 locales).
10. ✅ `tsc=0`; `check:stories`/`check:i18n`/`check:design-tokens --strict`/`check:mojibake`/
    `check:file-integrity` all green; `screenshots:assert -- --mantine-only` 566/592 PASS, 0 FAIL, 26
    pre-existing AMBIGUOUS; §18.9 set pasted above; this self-audit + Files-Changed table below. Git
    NOT run — held for orchestrator review.

## Mobile `<640` full-width gate — documented exemptions (clause 11)

- **Filters trigger — icon-only compact exemption**: label `hidden sm:inline`, `aria-label` provides
  the accessible name, ≥44px touch, corner badge legible/not clipped.
- **Sale/rent tabs — tab-strip compact exemption**: the two tabs sit as an attached, full-width 50/50
  pair (Task 570 `max-sm:flex-1 max-sm:min-w-0`), not stacked full-width blocks — same class of
  exemption as a Tabs list. Labels wrap, never clip; no h-scroll at 320 in any locale (verified).

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/HeroSearch.tsx` | Reduced to a thin container — owns hooks/state/`handleSearch` (byte-identical), renders `HeroSearchView`. |
| `src/components/shared/HeroSearchView.tsx` (**new**) | Pure presentational component holding the JSX + the 4 migrated Mantine `Button`s (tabs, filters trigger, search); avoids Storybook hook-mocking per the owner's item-0 decision. |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` (**new**) | Persisted `Mantine/Primitives/HeroSearch` story rendering `HeroSearchView` with fixture props (no hook mock, no live Supabase). |
| `src/components/shared/__tests__/heroSearch.smoke.test.tsx` (**new**) | RTL smoke covering search push, tab-switch push, filters-open, active-badge show/hide; planted-violation verified. |
| `docs/critical-flow-registry.md` | Extended the existing "Listings filter controls" row with HeroSearch's own Button migration + new smoke coverage (not a new group). |
| `docs/sessions/2026-07-10-task568-herosearch-mantine.md` (**new**) | This session log. |
| `docs/backlog.md` | Last Session + Sprint 43 status updated. |

No `messages/*.json` changes (no new runtime or story-fixture i18n keys needed). No `.storybook/*`
changes (the mock-alias plan was superseded before implementation). `HeroSearchClient.tsx` and
`src/app/[locale]/page.tsx` untouched.
