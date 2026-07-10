# Task 572 — HeroSearch: wrap the Search button to its own row in the 640–767px band

**Sprint:** 43 (FiltersPanel/HeroSearch → Mantine, Epic MM Phase-2 composite)
**Type:** UI / layout (single presentational component — `HeroSearchView.tsx`)
**Depends on / follows:** Task 571 (CountButton `iconOnlyBelow` + HeroSearch adoption — already approved).
**File in scope (the ONLY production file this task may change):**
`src/components/shared/HeroSearchView.tsx`
(+ its test `src/components/shared/__tests__/heroSearch.smoke.test.tsx`, the story
`src/stories/mantine/primitives/HeroSearch.stories.tsx` if a boundary caption helps, `docs/critical-flow-registry.md`
row 49, `docs/backlog.md`, `docs/sessions/`.)

---

## Problem (owner-reported, 2026-07-10, with rendered evidence at 720px)

On the HeroSearch bar, in the viewport band **640px ≤ w < 768px**, all four controls stay on ONE row:
`[All types] [Location] [filters ⚙+count] [Search]`. The `flex-1` Location combobox gets crushed so small
that its "City or village…" placeholder is no longer legible (owner screenshot at 720px). Below 640px the
bar is already stacked and fine; at ≥768px there is enough room and it is fine.

## Owner decisions (already made — do NOT re-ask, do NOT deviate)

1. **What wraps in the 640–767 band:** ONLY the **Search** button moves to a second row. The collapsed
   filters button (`⚙ + count`) STAYS on row 1 next to Location. → Row 1 = `[All types] [Location] [⚙ n]`,
   Row 2 = `[Search — full width]`.
2. **Boundary:** the two-row layout applies from **640px up to 767px**, and snaps back to a **single row at
   ≥768px** (Tailwind `md`). No one-off `720px` breakpoint — use the existing `sm`/`md` breakpoints only.

## Current behavior to PRESERVE (must be byte-identical after this task)

- **< 640px (base):** vertically stacked — `[All types]` (full width) / `[Location]` (full width) /
  `[⚙ n]  [Search — fills remaining]` on the last row. (This is the current mobile layout; it must NOT change.)
- **≥ 768px (`md`):** a single row — `[All types (192px)] [Location (fills)] [⚙ n] [Search (content width)]`.
  Location fills the free space; Search is content-width (NOT stretched). (Current desktop look; must NOT change.)
- The filters button keeps `iconOnlyBelow={860}` (Task 571) — collapsed to icon+count below 860px in every band.
- All existing props, handlers (`onSearch`, `onOpenFilters`, `onListingTypeChange`, …), the `aria-label`,
  the tabs strip, the FiltersPanel wiring, and the search-bar chrome (`bg-background rounded-b-2xl
  sm:rounded-tr-2xl border shadow-xl p-3`) stay untouched.

## Required after-behavior (the ONE new thing)

Add a **middle band, 640px ≤ w < 768px**, where **Search wraps to its own second row at full width**, so
Location regains width on row 1. The `< 640` and `≥ 768` layouts above remain exactly as they are today.

| Band | Row layout |
|---|---|
| `< 640` (base) | `[type]` / `[location]` / `[⚙ n]  [Search fills]` — UNCHANGED |
| `640–767` (`sm`) | Row 1 `[type] [location — roomy] [⚙ n]` · Row 2 `[Search — full width]` — **NEW** |
| `≥ 768` (`md`) | `[type] [location] [⚙ n] [Search — content width]` on one row — UNCHANGED |

## Concrete implementation (this is the intended diff — follow it; STOP-AND-ASK only if a Mantine width
nuance genuinely breaks a band in the rendered proof)

The current inner wrapper groups the two action buttons in a `<div className="flex gap-2">`. That grouping
is what forces filters+Search to move together — it must be REMOVED so filters can stay on row 1 while Search
wraps alone. Flatten the four controls into ONE `flex-wrap` container and drive each one's row placement with
its `flex-basis` per breakpoint.

**Target markup (replace the current `<div className="flex flex-col sm:flex-row gap-2"> … </div>` block):**

```tsx
<div className="flex flex-wrap md:flex-nowrap gap-2">
  <PropertyTypeCombobox
    value={propertyType}
    onChange={onPropertyTypeChange}
    className="basis-full sm:basis-auto sm:w-48 shrink-0"
  />

  <LocationCombobox
    locations={locations}
    value={locationId ?? ''}
    onChange={onLocationChange}
    onKeyDown={onLocationKeyDown}
    placeholder={th('hero_placeholder_location')}
    className="basis-full sm:basis-0 grow min-w-0"
  />

  <MantineCountButton
    variant={activeFiltersCount > 0 ? 'filled' : 'default'}
    count={activeFiltersCount}
    iconOnlyBelow={860}
    onClick={onOpenFilters}
    aria-label={t('advanced_filters')}
    leftSection={<SlidersHorizontal className="h-4 w-4" />}
    className="shrink-0"
  >
    {t('advanced_filters')}
  </MantineCountButton>

  <Button
    variant="filled"
    onClick={() => onSearch()}
    className="px-6 font-semibold grow shrink basis-0 sm:basis-full md:grow-0 md:basis-auto"
    leftSection={<Search className="h-4 w-4" />}
  >
    {t('search')}
  </Button>
</div>
```

**Why these exact classes (verify each in the rendered proof):**

- Container `flex flex-wrap md:flex-nowrap gap-2` — wrapping enabled below `md`; a hard single row at `md`.
- `PropertyTypeCombobox` `basis-full sm:basis-auto sm:w-48 shrink-0` — full-width own row `<640`; fixed 192px
  from `sm`. (Its default when no `className` is passed is `sm:w-48 shrink-0`; passing `className` REPLACES that
  default, so the `sm:w-48 shrink-0` is re-included on purpose.)
- `LocationCombobox` `basis-full sm:basis-0 grow min-w-0` — full-width own row `<640`; `flex:1 1 0` (fills) from
  `sm`. `min-w-0` lets it shrink below content at `md` so nothing overflows.
- `MantineCountButton` `shrink-0` — auto (content) width in every band; never shrinks below its collapsed
  icon+count. Stays on row 1 in all bands.
- `Button` (Search) `grow shrink basis-0 sm:basis-full md:grow-0 md:basis-auto`:
  - `<640` → `grow basis-0` = fills the remaining width beside the filters button on the last row.
  - `sm` (640–767) → `basis-full` forces it onto its own second row and stretches it full-width.
  - `md` (≥768) → `grow-0 basis-auto` = content width, so Location keeps filling the row (matches today).

> **🔴 Tailwind gotcha — do NOT use the `flex-1` shorthand here.** `flex-1` compiles to `flex: 1 1 0%`
> (it sets `flex-basis`), and it will fight the `sm:basis-full` / `md:basis-auto` media overrides for the
> `flex-basis` property — the winner depends on Tailwind's generated stylesheet order, not your source order,
> so it renders inconsistently. Use the explicit `grow` / `shrink` / `basis-*` utilities exactly as above so
> only ONE utility controls `flex-basis` in each band. Same reasoning is why Location/PropertyType use
> `basis-*`, not `w-full`, to go full-width `<640` (a `w-full` width is overridden by `flex-basis:0` in a flex
> row). This is the single most likely thing to get wrong — verify it in the PNG matrix, not by eye on the class list.

Do not add any new i18n key, any new breakpoint to `theme.ts`/`globals.css`, or any new dependency. No chrome
(color/border/radius/shadow/font) changes — this is a pure flex-layout change, so no new `tailadmin-style-reference`
row is needed (clause 16: reuse existing chrome, cite Task 571's CountButton conformance unchanged).

## Positive flow (happy path)

- Actor: any visitor on the homepage HeroSearch bar.
- At 700px (in-band): Row 1 shows `[All types]`, a legible full-width `[City or village…]` Location field, and
  the collapsed `[⚙ 2]` filters button; Row 2 shows a full-width `[Search]` button. Location placeholder is fully
  readable. Clicking `Search` still calls `onSearch()` and navigates; clicking `[⚙ 2]` still opens FiltersPanel.
- At 320/375/390 (base): unchanged stacked layout; filters+Search share the last row; no horizontal scroll.
- At 1024/1440 (md+): unchanged single row; Location fills, Search is content-width.

## Negative flow (every off-happy-path branch)

- **Exactly 640px (sm start):** two-row layout engages (Search on row 2). No overlap, no clip, no h-scroll.
- **Exactly 767px:** still two rows. **Exactly 768px:** single row (snap-back). Verify BOTH boundary sides.
- **Exactly 860px:** filters label expands (Task 571 boundary) — must not break row 1; at 860 we are `≥md`
  single-row, so `[type][location][⚙ Advanced filters n][Search]` on one row, Location still fills. Confirm no
  overflow when the filters label is present at 860–1024 with the LONGEST locale (uk "Розширені фільтри",
  sq "Apliko filtrat").
- **Long locale labels (uk/sq) in the 640–767 band:** filters is collapsed (icon-only) `<860`, so its label is
  absent — row 1 width is stable across locales. Location placeholder text differs per locale but the field is
  full-width on row 1, so it wraps/ellipsizes inside the field as before, never pushing Search back up.
- **`activeFiltersCount === 0`:** filters button shows no count badge (Task 571), still occupies row 1, Search
  still wraps in-band. No empty pill.
- **No locations loaded / empty Location list:** Location field still renders full-width with placeholder; layout
  unchanged.
- **Keyboard/a11y:** tab order stays type → location → filters → Search (DOM order preserved by flattening in the
  same order); Search reachable by role+name; filters reachable by `aria-label` in every band.

## Mobile <640 full-width gate (clause 11) — enforce and evidence

- `< 640`: `[All types]` and `[Location]` are each full-width (`basis-full`), Search fills its share (`grow
  basis-0`) — text/container surfaces are full-width. The **filters button is the ONLY exemption** (icon-only
  collapsed, documented — carried over from Task 571). ≥44px touch targets hold (theme `minHeight:2.75rem`,
  unaffected). No h-scroll at 320. Nothing here may regress from Task 571's approved state.

## Regression coverage (clause 15 — critical-flow-registry row 49)

- Baseline: run `heroSearch.smoke.test.tsx` + `filtersPanelShell/filterLeafComponents/filtersRangeDatePicker`
  smoke suites GREEN before the change; record counts.
- Layout wrapping is not assertable in jsdom (no layout engine), so the AUTHORITATIVE proof is the rendered PNG
  matrix (below). In the smoke test, ADD/keep behavioral assertions that survive the restructure: (a) Search click
  → `onSearch`/router push still fires; (b) filters click → FiltersPanel opens; (c) the count badge still renders
  inside the filters button; (d) the Task-571 collapse test still passes. Confirm the flatten did not change the
  accessible names or the container→view wiring. A planted-violation (e.g. removing `sm:basis-full` from Search)
  cannot be caught by jsdom — so instead plant a DOM-structure violation the test CAN see (e.g. assert the four
  controls are siblings of one flex container, not nested in the old action `<div>`), record the FAIL, revert.
- Extend `docs/critical-flow-registry.md` row 49 (Happy/Failure path + Coverage cells) to mention the 640–767
  Search-wrap behavior and the rendered-matrix proof command.

## 🔴 Rendered verification matrix (clause 12/13 — REQUIRED, this is the real close)

Produce the `screenshots:assert -- --mantine-only` PNG/JSON matrix for the `HeroSearch` story (and re-confirm the
`CountButton`/`FilterControls`/`FiltersPanelShell` siblings are unaffected), covering **every** band boundary ×
**sq/en/uk/it**:

- Widths: **320, 375, 390** (base, uk mandatory) · **560, 600** (still base) · **640, 680, 700, 720, 767** (the
  new two-row band — Search on row 2, Location legible) · **768, 810, 860, 960, 1024** (single row, snap-back).
- For each in-band cell (640–767): assert (visually, in the PNG) that Search is on a SECOND row at full width and
  the Location placeholder "City or village…" (localized) is fully legible on row 1.
- For each 768/860 cell: assert single row, Location fills, Search content-width, no overflow with the longest
  locale label.
- Include the §18.9 human-visual check screenshots at uk@320, uk@700 (in-band), uk@1024 — pasted/linked in the
  session log — confirming no icon/label/badge overlap and no clipping in any band.

`tsc=0` / `lint` / `check:stories` / `check:i18n` / `check:design-tokens --strict` / `check:mojibake` /
`check:file-integrity` must all be green in the transcript. `tsc`/build green is NOT layout proof — the PNG
matrix is.

## Hard contract (verified against the real diff on return)

1. Scope = the files listed at top only. No drive-by edits, no touching `FiltersPanel.tsx`, `MantineCountButton.tsx`,
   `theme.ts`, `globals.css`, the comboboxes' internals, or any locale file.
2. Do not invent architecture — if a band cannot be achieved with the specced classes because of a Mantine width
   quirk, STOP and ASK (do not add a global breakpoint, a wrapper div, or JS width logic without approval).
3. Preserve every existing control, handler, prop, and the `<640` / `≥768` layouts byte-identically.
4. Both positive and every negative branch above have a verifiable outcome in the diff/render.
5. Presentational-split gate: `HeroSearchView` is already the prop-driven view — keep it hook-free; the story/test
   target it/`HeroSearch` with fixtures, NO data-hook mock added for layout.
6. `npx tsc --noEmit` = 0; AC-by-AC self-audit table (each AC → file:line or rendered-cell); final
   `Self-validation:` line. Include the "Files Changed" table (one row per path + rationale). **Do NOT run git /
   do NOT emit `git add`/`git commit`** — the orchestrator emits commits at review.
7. Update `docs/backlog.md` (Last Session + mark 572) and add `docs/sessions/2026-07-10-task572-*.md`.

## Acceptance criteria (each must be verifiable in the diff at file:line OR in a named rendered cell)

1. The action `<div className="flex gap-2">` wrapper is removed; the four controls are direct children of a single
   `flex flex-wrap md:flex-nowrap gap-2` container, in order type → location → filters → Search. *(HeroSearchView.tsx)*
2. Search carries `grow shrink basis-0 sm:basis-full md:grow-0 md:basis-auto` (no `flex-1` shorthand). *(diff)*
3. Location carries `basis-full sm:basis-0 grow min-w-0`; PropertyType carries `basis-full sm:basis-auto sm:w-48
   shrink-0`; filters carries `shrink-0` and keeps `iconOnlyBelow={860}`. *(diff)*
4. Rendered matrix: 640/680/700/720/767 × sq/en/uk/it → Search on row 2 full width, Location placeholder legible. *(PNG)*
5. Rendered matrix: 768/860/1024 × sq/en/uk/it → single row, Location fills, Search content-width, no overflow. *(PNG)*
6. Rendered matrix: 320/375/390 (uk) → unchanged stacked layout, filters+Search share last row, no h-scroll. *(PNG)*
7. `heroSearch.smoke.test.tsx` green (behavioral assertions preserved) + planted DOM-structure violation FAIL
   transcript + revert; registry row 49 extended. *(test + registry)*
8. All gates green; §18.9 human-visual no-overlap/no-clip screenshots at uk@320/700/1024 in the session log.
9. `<640` and `≥768` layouts confirmed byte-identical to pre-task (side-by-side before/after PNG at 375 and 1024). *(PNG)*
```
