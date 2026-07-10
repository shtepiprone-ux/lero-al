# Task 568 — `HeroSearch` → Mantine (4 `ui/button` → Mantine `Button`, behavior frozen)

**Type:** UI / component migration (Epic MM Phase-2 composite). **Executor:** Sonnet 4.6.
**Sprint:** 43 (`tasks/Sprints/Sprint_43_FiltersPanel_HeroSearch_Mantine.md`). **Depends on:** Task 567
(`FiltersPanel` shell → Mantine) — APPROVED 2026-07-09; HeroSearch mounts `FiltersPanel`, so 567 must be
landed first. Last legacy-primitive holdout in the search stack.

## What this task is (and is NOT)

`src/components/shared/HeroSearch.tsx` still imports `@/components/ui/button` and renders **four** legacy
Buttons: the sale/rent tab pair, the filters button (+ active-count badge), and the search button. This task
swaps ONLY those four onto the canonical Mantine `Button`, preserving **100% of the search logic, the
`handleSearch` URL-param contract, tab state, the active-count badge, and the `FiltersPanel` wiring** — a
presentational swap, exactly the Task 556/566/567 precedent.

It is NOT a redesign. `PropertyTypeCombobox`, `LocationCombobox`, `FiltersPanel` are **already migrated —
touch NONE of them.** `HeroSearchClient.tsx` (the `dynamic()` SSR-off wrapper + skeleton) is unchanged.

## Current state — read `src/components/shared/HeroSearch.tsx` in full first (161 lines)

The component is self-contained (no props): `useTranslations`, `useLocale`, `useRouter`, `useLocations`;
state `listingType`/`propertyType`/`locationId`/`filtersOpen`/`filters`; `activeFiltersCount =
countActiveFilterValues(filters)`; `handleSearch(override?)` builds `URLSearchParams` and
`router.push('/${locale}/listings?…')`; `handleKeyDown` (Enter → search). The three legacy Button clusters:

1. **Sale/rent tabs** (lines 84–100) — `.map(['sale','rent'])` → `ui/button variant="ghost"` with a **bespoke
   hero tab className** (`rounded-t-xl rounded-b-none border border-b-0`; active = `bg-background
   text-foreground border-border`; inactive = translucent `bg-primary-foreground/15 …`). `onClick` →
   `setListingType(type)`. Label `tl(type)`.
2. **Filters button** (lines 122–136) — `ui/button variant={activeFiltersCount>0 ? 'default':'outline'}
   size="xl"` , `SlidersHorizontal` icon + label `t('advanced_filters')` that is `hidden sm:inline`
   (**icon-only < 640**), an absolute corner **active-count badge** (`span … -top-1.5 -right-1.5`),
   `aria-label={t('advanced_filters')}`, `onClick` → `setFiltersOpen(true)`.
3. **Search button** (lines 138–145) — `ui/button size="xl"`, `Search` icon + `t('search')` label,
   `className="px-6 font-semibold flex-1"`, `onClick` → `handleSearch()`.

## Required after-behavior (spell it out — no invention)

### 1. Sale/rent tabs → Mantine `Button` (bespoke hero chrome preserved VERBATIM)
- Replace `ui/button variant="ghost"` with `@mantine/core` `Button variant="subtle"` (or `unstyled` if
  `subtle` injects padding/hover that fights the bespoke className — pick whichever renders the tab look with
  ZERO visual change) carrying the **existing tab className verbatim**. These tabs are **hero-gradient chrome,
  NOT §6a surface buttons** — they intentionally use hero-relative tokens (`primary-foreground/*`). Do NOT
  restyle them to §6a and do NOT invent replacement colors: keep the exact classes so the rendered tab strip
  is pixel-identical to today. `onClick`/`setListingType` unchanged; the active `listingType===type`
  branching unchanged. **If `variant="subtle"`/`unstyled` cannot reproduce the exact look without class
  surgery → STOP and ASK** (do not guess a SegmentedControl/Tabs rewrite — the sprint owner-decision froze
  these as Button toggles, no SegmentedControl).
- ≥44px touch height; labels (`Продаж`/`Оренда`, `Në shitje`/`Me qira`, …) wrap, never clip; the two-tab
  strip must not h-scroll at 320 in any locale.

### 2. Filters button → Mantine `Button` (§6a) + preserved corner badge
- `Button` with `variant` = **filled brand** when `activeFiltersCount>0` / **`variant="default"` (§6a
  bordered)** when `0` — the same active/idle emphasis the legacy `default`/`outline` pair expressed. No
  banned `size="lg"/"xl"` (Task 520) — the theme's 44px height stands.
- `SlidersHorizontal` as `leftSection`; label `t('advanced_filters')` stays **`hidden sm:inline`**
  (icon-only < 640). `aria-label={t('advanced_filters')}` MUST remain (icon-only mobile a11y).
- The **active-count corner badge** (`span … absolute -top-1.5 -right-1.5 … bg-primary …`) is a styled span,
  NOT a legacy `@/components/ui/*` primitive — **preserve its markup verbatim** (out of scope to restyle).
  If the owner would rather adopt the canonical `MantineCountButton` (Task 567 Fix 3, inline count) instead
  of the corner badge → that is a **STOP-and-ASK**, not a silent change.
- `onClick` → `setFiltersOpen(true)` unchanged.

### 3. Search button → Mantine `Button` (§6a filled brand)
- `Button` filled brand (`#EC5447`, the primary CTA); no banned size (44px via theme); `Search` as
  `leftSection`; label `t('search')`; keep `flex-1` + `font-semibold` weight equivalent. `onClick` →
  `handleSearch()` unchanged. `handleKeyDown` (Enter on the LocationCombobox → search) unchanged.

### Imports
- Remove `import { Button } from '@/components/ui/button'`. Add `import { Button } from '@mantine/core'`.
- Keep `cn` only if still needed for the tab className compose; otherwise drop it. No raw `<button>`.
- Everything else (`FiltersPanel`, `PropertyTypeCombobox`, `LocationCombobox`, `countActiveFilterValues`,
  `useLocations`, icons) unchanged.

## Pre-read (rule-index → UI / layout / component task)
- `docs/agent-contract.md` (clauses **1, 3, 5, 7, 11, 12, 16**) + `docs/backlog.md` +
  `docs/critical-flow-registry.md` (**"Listings filter controls"** row — Task 566/567; extend, do NOT invent
  a new group).
- 🔴 `docs/mantine-responsive-design-system.md` — §7 (mobile gate), §12 (canonical patterns), §15
  (control-height / banned `size`), §16 (gates), §18/§18.9 (theming pitfalls + icon/placeholder/overlap + ≥44px
  touch iron rule).
- 🔴 `docs/tailadmin-style-reference.md` — **§6a (Button chrome: filled brand / `variant="default"`
  bordered)**. Every value traces to a §-row; the hero tab chrome is the ONLY documented non-§6a surface
  (bespoke hero gradient) and is preserved verbatim, not restyled.
- `docs/ui-rules.md` (§15 control-height, §16 z-index, §17 UI pre-flight), `docs/component-rules.md`
  (no raw `<button>`; Mantine `Button size="lg"/"xl"` banned — Task 520), `docs/qa-rules.md`.
- Reference: the Task 567 session log (`docs/sessions/2026-07-09-task567-filterspanel-shell-mantine.md`) +
  `src/stories/mantine/primitives/FiltersPanelShell.stories.tsx` (the persisted-composite-story precedent).

## Mobile <640 full-width gate (clause 11)
- **Layout:** the search card is `flex-col sm:flex-row` — PropertyType + Location stack full-width < 640
  (already migrated primitives; inherited). ✓
- **Search button:** shares the action row (`flex gap-2`) with the compact filters button; `flex-1` → it
  fills the full remaining row width < 640. The action row itself spans the card edge-to-edge. ✓
- **Filters button — DOCUMENTED COMPACT/ICON-ONLY EXEMPTION (clause 11 carve-out):** < 640 the label is
  `hidden sm:inline`, so the control is **icon-only** (`SlidersHorizontal` + `aria-label`). Icon-only is the
  explicit clause-11 exemption — list it. ≥44px touch; corner badge legible, never clipped.
- **Sale/rent tabs — DOCUMENTED COMPACT EXEMPTION (tab strip, same class as a Tabs list):** the two tabs sit
  inline as an attached tab pair (like a Tabs list), NOT full-width stacked. ≥44px touch; labels wrap
  (sq/en/uk/it), never clip; the pair must not h-scroll at 320 in any locale.
- If any pattern reads ambiguous at implementation time → **STOP and ASK**, do not guess.

## TailAdmin conformance (clause 16)
- Filters button (idle) + search button map to §6a chrome VERBATIM (border, radius, `shadow-theme-xs`, focus
  ring, Outfit weight); filled brand `#EC5447` for search + active filters. **Zero invented values.**
- Hero tab strip is the documented bespoke-hero exception — preserved verbatim, proven pixel-identical
  side-by-side vs the CURRENT rendered hero (before/after screenshot), not restyled to §6a.
- **§18.9:** the filters corner badge never clips/occludes the icon; the search icon never overlaps its
  label; no control is a blank box; nothing clips at 320.

## Positive flow (happy path)
Actor: visitor on the homepage hero.
1. **Tabs:** default `listingType='sale'`; clicking **Rent** → `setListingType('rent')`, the active tab
   flips to the card-colored look, the other to translucent — visually identical to today.
2. **Property type / Location:** the already-migrated Comboboxes behave exactly as before (untouched).
3. **Filters:** clicking the filters button → `setFiltersOpen(true)` opens `FiltersPanel` (Task 567 drawer);
   the corner badge shows `activeFiltersCount` when `>0`.
4. **Apply from panel:** `FiltersPanel.onApply` → `handleSearch(override)` fires with the panel's values →
   `router.push('/${locale}/listings?…')` with the identical param set (type, property_type, location_id,
   price/area/rooms/floor/floors_total/currency/condition/heating/wall_type/year/market_type/layout/offer/
   purchase/date_from/date_to/listing_id) — **byte-identical serialization** to the legacy component.
5. **Search:** clicking the search button (or Enter in the Location field) → `handleSearch()` → same push.
6. **Success:** navigation to `/listings` with the exact query string; no layout shift; no clip/h-scroll at
   320 in any locale.

## Negative flow (every off-happy-path branch)
- **No filters active** → `activeFiltersCount===0` → corner badge NOT rendered; filters button = idle
  `variant="default"` (§6a bordered); search still works.
- **Empty property/location** → `handleSearch` omits those params (existing `if (pt)…/if (lid)…` guards);
  push still fires with `type` + whatever is set. No crash, no empty `property_type=`/`location_id=`.
- **Rent tab + Enter in Location** → `handleKeyDown` Enter → `handleSearch()` with `type=rent`; unchanged.
- **Long uk/it labels** (tabs `Оренда`/`Me qira`, `advanced_filters`, `search`) → wrap, never clip; no
  h-scroll at 320 across sq/en/uk/it.
- **Icon-only filters button < 640** → label hidden, `aria-label` provides the accessible name; badge still
  legible; ≥44px touch.
- **Rapid open/close of the panel** → `filtersOpen` is controlled state; the Task 567 Drawer handles
  backdrop/Esc/drag-dismiss → `onClose` → `setFiltersOpen(false)`; no stuck backdrop.
- **Disabled/loading** → not applicable (no such path exists today); do NOT add one.

## Regression coverage (clause 15)
- Baseline: record the existing **"Listings filter controls"** flow tests green BEFORE the change (the Task
  566/567 smoke suite that touches the search stack). Do not close if any regress.
- Add a focused RTL smoke `src/components/shared/__tests__/heroSearch.smoke.test.tsx` (mount the REAL
  `HeroSearch`, mock `useLocations` + `next/navigation` `useRouter`) asserting:
  1. **Search** → clicking the search button calls `router.push` with `/${locale}/listings?…type=sale…`
     (assert the param string for a representative filter set).
  2. **Tab switch** → clicking **Rent** then searching pushes `type=rent`.
  3. **Filters open** → clicking the filters button renders the `FiltersPanel` (assert its dialog/drawer role
     or a known anchor appears).
  4. **Active badge** → with `activeFiltersCount>0` (seed via an applied filter set) the corner badge shows
     the count; with 0 it is absent.
- **Planted-violation transcript** (≥1, reverted → green): e.g. drop the `onClick={() => handleSearch()}`
  wiring on the search button → assertion 1 FAILS (`router.push` 0 calls); revert → green. Extend/annotate the
  `docs/critical-flow-registry.md` **"Listings filter controls"** row (HeroSearch entry now Mantine `Button`,
  smoke-covered) — do NOT invent a new group.

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close
- Add ONE persisted story under **`Mantine/Primitives/HeroSearch`** (match the exact prefix the
  `--mantine-only` gate enumerates — verify against `scripts/check-stories-rendered.mjs`; 567 used
  `Mantine/Primitives/*`). Render the **REAL `HeroSearch`** with `useLocations` mocked to a fixture city/region
  set (so the Comboboxes populate) and `router.push` a no-op in the Storybook nextjs router. `skipCanvas:true`,
  `layout:'fullscreen'`, toolbar-driven locale/viewport; any NEW fixture string via `storyT` with full
  sq/en/uk/it parity (governance §14.2). **If mounting `HeroSearch` in Storybook needs hook mocking the
  harness cannot provide → STOP and ASK** before inventing a wrapper.
- `screenshots:assert -- --mantine-only` green (paste the Phase-0 count line before/after — story count +1).
- 🔴 **§18.9 human-visual set** (the geometry gate is BLIND to overlap/clip/touch-size — Task 553/569): human-
  inspected screenshots at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280** proving: the sale/rent
  tab strip is pixel-identical to the pre-change hero (active vs translucent), attached to the card top; the
  filters button is icon-only < 640 with a legible corner badge and full label ≥ 640; the search button is
  filled brand §6a, icon + label not overlapping, `flex-1` filling the row; ≥44px touch; labels wrapped/not
  clipped; **no h-scroll at 320** in any locale.

## Acceptance criteria (each verifiable in the diff + rendered evidence)
1. `HeroSearch.tsx` imports **zero** `@/components/ui/button`; the four Buttons use `@mantine/core` `Button`.
   No raw `<button>`. No props/signature change; `HeroSearchClient.tsx` untouched; zero consumer edits
   (grep-confirm `src/app/[locale]/page.tsx` still just renders `HeroSearchClient`).
2. `handleSearch` URL-param serialization, `handleKeyDown`, `listingType`/`filters`/`filtersOpen` state,
   `countActiveFilterValues`, and the `FiltersPanel` wiring are **byte-identical** (diff shows only the Button
   JSX + import swap).
3. Sale/rent tabs → Mantine `Button` with the bespoke hero className preserved verbatim; visually pixel-
   identical (before/after proof); `setListingType` unchanged; documented tab-strip compact exemption.
4. Filters button → Mantine `Button` (filled brand when active / `variant="default"` §6a when idle); no banned
   `size`; `SlidersHorizontal` leftSection; label `hidden sm:inline`; `aria-label` preserved; corner badge
   markup preserved verbatim; documented icon-only < 640 exemption.
5. Search button → Mantine `Button` filled brand §6a (no banned size); `Search` leftSection + label; `flex-1`;
   `handleSearch()` wiring unchanged.
6. Mobile < 640: action row full-width, search `flex-1`; filters = documented icon-only exemption; tabs =
   documented tab-strip exemption; ≥44px touch; labels wrap; no h-scroll at 320 × sq/en/uk/it.
7. TailAdmin §6a matched rendered side-by-side for the filters/search buttons; hero tabs proven pixel-
   identical to the current hero; §18.9 checks pass; **zero invented values**.
8. Registry **"Listings filter controls"** row extended + baseline recorded + RTL smoke
   (`heroSearch.smoke.test.tsx`) with a planted-violation FAIL transcript; pre-existing search-stack smoke
   stays green.
9. i18n: reuse existing runtime keys (`common.advanced_filters`, `common.search`, `listing.sale`/`rent`,
   `home.hero_placeholder_location`) — no new component-runtime strings expected; any NEW story-fixture key
   gets full sq/en/uk/it parity; `check:i18n` green.
10. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
    `check:file-integrity` all green; `screenshots:assert -- --mantine-only` green; §18.9 human-visual set
    pasted; AC-by-AC self-audit + Files-Changed table in the session log. **Do NOT run git — HELD for
    orchestrator review.**

## Out of scope
- `PropertyTypeCombobox`, `LocationCombobox`, `FiltersPanel` (already migrated), `HeroSearchClient.tsx`
  (dynamic wrapper + skeleton) — touch NONE.
- `filterEngine` / `countActiveFilterValues`, the `handleSearch` URL-param contract, `useLocations`,
  `useHomepageFilters`, tab/filter state semantics — all frozen.
- Redesigning the tabs into `SegmentedControl`/`Tabs`; restyling the hero tab chrome to §6a; replacing the
  corner badge with `MantineCountButton` (both are STOP-and-ASK, not silent changes); adding disabled/loading
  states.

## Files expected to change
`src/components/shared/HeroSearch.tsx` · `src/stories/mantine/primitives/HeroSearch.stories.tsx` (**new**) ·
`src/components/shared/__tests__/heroSearch.smoke.test.tsx` (**new**) · `docs/critical-flow-registry.md`
(extend the existing row) · `messages/{en,uk,sq,it}.json` (**only** if a new story-fixture string is
required — full 4-locale parity) · `docs/backlog.md` · new
`docs/sessions/2026-07-…-task568-herosearch-mantine.md`.
