# Task 566 — Filter leaf sub-components → Mantine (`FilterRangeInputs` · `FilterMultiToggle` · `FilterRoomsRow`)

**Type:** UI / component migration (product code). **Executor:** Sonnet 4.6.
**Sprint:** 43 (FiltersPanel/HeroSearch → Mantine). **Origin:** Epic MM Phase-2 composite migration — the
three leaf filter sub-components are the last `@/components/ui/*` primitives inside the filter tree; Task
567 (FiltersPanel shell) consumes them, so they migrate FIRST. **This is a presentational swap only — the
Task 556 PhoneField precedent: swap the primitives, keep 100% of the logic and the public Props APIs.**

## Architecture (owner-decided, Sprint 43)

- **Canonical primitives** are imported directly from `@mantine/core`, themed globally via `theme.ts` +
  `src/design-system/mantine/input-chrome.css` — the SAME path `PhoneField.tsx` / `LocationCombobox.tsx`
  use (`import { TextInput, Button } from '@mantine/core'`). Do NOT add wrappers, do NOT invent chrome.
- **`FilterRangeInputs`** → Mantine `TextInput` ×2 (`§6e` input chrome).
- **`FilterMultiToggle`** + **`FilterRoomsRow`** → Mantine `Button` toggles (selected `variant="filled"`
  brand `#EC5447` / unselected `variant="default"` §6a bordered) — NOT `SegmentedControl` (these are
  multi-select; owner decision Sprint 43 #3).

## Current state (read the 3 files first — they are tiny)

### `src/components/shared/FilterRangeInputs.tsx` (41 lines)
Two legacy `Input` in a `flex gap-2` row. Props: `minValue`/`maxValue` (string), `onMinChange`/`onMaxChange`
`(v:string)=>void`, `minPlaceholder`/`maxPlaceholder`, `min?:number`, `type='number'`. Each input:
`type={type} min={min} placeholder value onChange={e=>onXChange(e.target.value)}` className `h-10 rounded-xl`.
**Consumed by** `FiltersPanel` for price / area / floor / floors_total ranges (the parent does all number
parsing — this component only forwards `e.target.value` as a raw string).

### `src/components/shared/FilterMultiToggle.tsx` (34 lines)
`flex flex-wrap gap-2` grid of legacy `Button`. Props: `options: {value,labelKey}[]`, `selected: string[]`,
`onToggle:(value)=>void`, `getLabel:(key)=>string`, `className?`. Each button:
`variant={selected.includes(opt.value) ? 'default' : 'outline'}` `size="sm"`
className `min-h-11 h-auto px-3 py-2 text-xs rounded-xl whitespace-normal leading-snug text-left justify-start`.
**Multi-select** (condition/heating/wall/offer/layout/purchase).

### `src/components/shared/FilterRoomsRow.tsx` (32 lines)
`flex gap-2 flex-wrap` of legacy `Button` over `ROOMS_OPTIONS`. Each:
`variant={selected.includes(strVal) ? 'default' : 'outline'}` `size="icon-xl"` className
`text-xs rounded-xl shrink-0`; label `opt===5 ? '5+' : opt`. Multi-select room counts (strings).

**Public Props APIs of all three MUST stay byte-identical** — Task 567 and the current `FiltersPanel`
call sites depend on them unchanged.

## Required after-behavior (spell it out — no invention)

### FilterRangeInputs → Mantine `TextInput`
- Two `<TextInput>` in the same `flex gap-2` row; each `w-full`/`flex-1` so the pair splits the row evenly
  (preserve the current even split). Props map 1:1: `type={type}` (keep `number`), native `min` passed via
  the input element (`inputMode`/`min` — keep numeric semantics), `placeholder`, `value={minValue|maxValue}`,
  `onChange={e => onMinChange(e.currentTarget.value)}` (Mantine `TextInput` exposes `e.currentTarget.value`;
  the emitted STRING must be identical to today's `e.target.value`).
- **Chrome = `§6e` verbatim** via `input-chrome.css` (`.mantine-TextInput-input`): border `gray-300`,
  `rounded-lg`, **`h-11` (44px — TailAdmin §6e; this REPLACES the legacy `h-10` 40px)**, `bg-transparent`,
  `shadow-theme-xs`, `text-theme-sm`, `focus:border-brand-300 focus:ring-brand-500/10 focus:ring-3`.
  Do NOT keep `rounded-xl`/`h-10`. No `leftSection`/`rightSection` (these fields have no adornment).
- `type='number'` note: keep numeric input behavior identical (spinner or `inputMode="numeric"` as the
  legacy `Input` rendered) — do NOT change what characters are accepted; the parent's parsing is unchanged.

### FilterMultiToggle → Mantine `Button` toggles
- Same `flex flex-wrap gap-2` wrapper (+ passthrough `className`). Each option a Mantine `<Button>`:
  `variant={selected.includes(opt.value) ? 'filled' : 'default'}`, `size` mapped so the control is **≥44px
  tall** (min-h-11 preserved), label wraps (`whitespace-normal leading-snug text-left`), `onClick={()=>onToggle(opt.value)}`.
- Selected = brand `#EC5447` filled (§6-primary); unselected = `§6a` default bordered (gray-300 border,
  `text-gray-700`, `bg-transparent`). Cite the §-rows; ZERO invented color/radius/shadow.
- Preserve multi-select semantics EXACTLY (`onToggle` toggles one value; parent owns the array).

### FilterRoomsRow → Mantine `Button` toggles
- Same `flex gap-2 flex-wrap`; each room a square-ish Mantine `<Button>` **≥44px** (the legacy `icon-xl`
  size), `variant={selected.includes(strVal) ? 'filled' : 'default'}`, label `opt===5 ? '5+' : opt`,
  `onClick={()=>onToggle(strVal)}`, `shrink-0`. Same brand/default mapping as FilterMultiToggle.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses **1, 3, 5, 7, 11, 12, 16**) + `docs/backlog.md` +
  `docs/critical-flow-registry.md` (the **"Listings date-range filter" / listings-filter** flow — these
  inputs/toggles feed it; baseline + extend, do NOT invent a new flow group).
- 🔴 `docs/mantine-responsive-design-system.md` — §7 (mobile gate), §12 (canonical patterns), §15
  (control-height), §16 (gates), **§18 (theming/CSS pitfalls — `input-chrome.css`, `data-error` not
  `data-invalid`), §18.9 (icon/placeholder/overlap + touch-size iron rule)**.
- 🔴 `docs/tailadmin-style-reference.md` — **§6a (Button chrome) + §6e (input chrome)** — the two §-rows
  every value in this task must trace to.
- `docs/ui-rules.md` (§15 control-height, §17 UI pre-flight), `docs/component-rules.md` (no raw `<button>`),
  `docs/qa-rules.md`.
- Reference: the **Task 556 session log** (`docs/sessions/2026-07-06-task556-phonefield-mantine-migration.md`)
  — the established legacy→Mantine presentational-swap pattern; `PhoneField.tsx` + `LocationCombobox.tsx`
  for the canonical `@mantine/core` import + §6e usage.

## Mobile <640 full-width gate (clause 11)

- **FilterRangeInputs:** the two inputs are a min–max PAIR sharing one row — each is `w-full`/`flex-1`
  within that row (the pair fills the container edge-to-edge; they are NOT centered/content-width). ≥44px
  (`h-11`). This is the correct full-width treatment for a paired range control; state it explicitly.
- **FilterMultiToggle / FilterRoomsRow — DOCUMENTED COMPACT EXEMPTION (clause 11 compact-control carve-out):**
  these are **multi-select chip/toggle wrap-grids**; forcing each chip to `max-sm:w-full` would collapse the
  grid to one-chip-per-row and destroy the compare-at-a-glance selection UX. Therefore each chip stays
  **content-width inside a wrapping grid**, WITH: ≥44px touch height (`min-h-11`), labels wrap
  (`whitespace-normal`, sq/en/uk/it, never clip), and **no horizontal scroll at 320** in any locale. This
  exemption is listed here per clause 11's "compact controls MUST be listed explicitly with justification."
  Do NOT make the chips full-width.
- If any of this reads as ambiguous at implementation time → **STOP and ASK**, do not guess.

## TailAdmin conformance (clause 16)

- Inputs → `§6e` resting/focus/disabled chrome VERBATIM (via `input-chrome.css`), `h-11`, brand focus ring.
- Toggles → `§6a` Button chrome; selected filled brand `#EC5447`, unselected default bordered. **Zero
  invented values** — cite §6a/§6e. Rendered side-by-side vs the reference is the only style proof;
  `tsc=0`/gate-green is NOT.
- **§18.9:** the toggle labels must never clip; the inputs are never a blank box; nothing overlaps.

## Positive flow (happy path)

Actor: user setting filters in the FiltersPanel (rendered inside the panel; this task ships the leaf
components + a story that mounts them). 1) **FilterRangeInputs:** typing in min or max fires
`onMinChange`/`onMaxChange` with the exact typed string (identical to legacy `e.target.value`); the field
shows `§6e` chrome, focus ring on focus. 2) **FilterMultiToggle:** clicking an unselected chip fires
`onToggle(value)` and the chip becomes brand-filled; clicking a selected chip fires `onToggle(value)` and it
returns to default — multiple chips can be active simultaneously. 3) **FilterRoomsRow:** same toggle
behavior over room counts (`5+` label for 5). Success: the emitted callback values are byte-identical to
the legacy components; no layout shift; no clip at 320.

## Negative flow (every off-happy-path branch)

- **Empty value** → input shows the placeholder, no crash; emitting `''` clears the parent value exactly as
  today (parent maps `'' → undefined`; do NOT change that).
- **Non-numeric / invalid keystroke in a `type='number'` field** → behavior identical to the legacy `Input`
  (do not add new filtering/validation; the parent owns parsing).
- **Nothing selected in a toggle grid** → all chips render `default` (unselected), no crash, `selected=[]`.
- **Long uk/it labels** in FilterMultiToggle (e.g. heating/wall/purchase) → wrap, never clip, no h-scroll at
  320 across sq/en/uk/it.
- **Disabled/loading** → not applicable (no consumer passes disabled today); do NOT add a disabled path.
- **Passthrough `className`** (FilterMultiToggle) → still applied to the wrapper exactly as today.

## Regression coverage (clause 15)

The listings filter flow is in `docs/critical-flow-registry.md` (the "Listings date-range filter" row +
the filters-apply path). These leaf components are presentational forwarders, so add a focused RTL smoke
(`src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx`) asserting:
1. `FilterRangeInputs`: typing in min fires `onMinChange` with the typed string; typing in max fires
   `onMaxChange`; values render.
2. `FilterMultiToggle`: clicking an option fires `onToggle(value)`; a `selected` value renders as the
   active (`filled`/`data-*`) variant.
3. `FilterRoomsRow`: clicking a room fires `onToggle(strVal)`; `5+` label present for 5; selected renders active.
**Planted-violation transcript** (e.g. drop the `onChange`→`onMinChange` wiring, or the `onClick`→`onToggle`
wiring → the matching assertion FAILS), reverted → green. Baseline: confirm the existing filter smoke suite
(`filtersRangeDatePicker.smoke.test.tsx`) stays green (these components are consumed there via FiltersPanel).
Extend/annotate the registry row (leaf filter primitives now Mantine + smoke-covered) — do NOT invent a new group.

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- Add ONE persisted story under **`Mantine/Primitives/FilterControls`** (Task 554 precedent) rendering the
  REAL three components together (a range-input pair, a multi-toggle with 1–2 selected, a rooms row with 1
  selected). `skipCanvas:true`, `layout:'fullscreen'`, toolbar-driven locale/viewport, `storyT` strings with
  full sq/en/uk/it parity.
- `screenshots:assert -- --mantine-only` green (paste the Phase-0 count line before/after — story count +1).
- 🔴 **§18.9 human-visual set** (geometry gate is BLIND to overlap/clip/touch-size): human-inspected
  screenshots at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280** proving: inputs = §6e chrome,
  `h-11`, focus ring; toggle chips ≥44px, brand-filled when selected, default when not, labels wrapped/not
  clipped; the range pair fills the row; **no h-scroll at 320** in any locale.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. All three files import ONLY from `@mantine/core` (+ `cn`/constants) — **zero `@/components/ui/input`,
   zero `@/components/ui/button`, zero raw `<button>/<input>`** remain. Public Props APIs unchanged.
2. `FilterRangeInputs` → Mantine `TextInput` ×2, `§6e` chrome (`h-11`, `rounded-lg`, brand focus ring,
   `shadow-theme-xs`), `type='number'` + `min` semantics preserved, emits the identical string via
   `onMinChange`/`onMaxChange`. Even-split row layout preserved.
3. `FilterMultiToggle` + `FilterRoomsRow` → Mantine `Button` toggles, selected `filled` brand `#EC5447` /
   unselected `default` §6a; multi-select `onToggle` semantics byte-identical; ≥44px; labels wrap. Wrap-grid
   compact exemption documented (chips NOT full-width).
4. Mobile <640: range pair fills the row (each `w-full`/`flex-1`, ≥44px); toggle chips = documented compact
   exemption (≥44px, wrap, no h-scroll at 320 × sq/en/uk/it).
5. TailAdmin §6a/§6e matched rendered side-by-side; §18.9 checks pass; **zero invented values** (every value
   cited to §6a/§6e).
6. Registry row extended + baseline recorded + RTL smoke (with planted-violation FAIL transcript).
7. i18n: NO new keys expected (labels come from the parent's `getLabel`/placeholders); if any string is
   introduced it gets full sq/en/uk/it parity; `check:i18n` green.
8. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
   `check:file-integrity` all green; `screenshots:assert -- --mantine-only` green; §18.9 human-visual set
   pasted; Files-Changed table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

- `FiltersPanel.tsx` itself, its `ui/sheet` overlay, its property/market toggle grids, its listing-id input,
  and its footer — **all Task 567.** `HeroSearch.tsx` — **Task 568.** Touch ONLY the three leaf files
  (+ the new story + the new test).
- Any change to `filterEngine`, `useHomepageFilters`, URL-param serialization, number parsing, or the
  parent call sites in `FiltersPanel` (they consume the unchanged Props APIs).
- Redesigning toggles into `SegmentedControl`/`Chip` (owner said no); adding disabled/loading states no
  consumer uses.

## Files expected to change

`src/components/shared/FilterRangeInputs.tsx` · `src/components/shared/FilterMultiToggle.tsx` ·
`src/components/shared/FilterRoomsRow.tsx` · a new `Mantine/Primitives/FilterControls` story ·
a new `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` ·
`docs/critical-flow-registry.md` · `docs/backlog.md` · new
`docs/sessions/2026-07-09-task566-filter-leaf-components-mantine.md`.
