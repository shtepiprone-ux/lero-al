# Task 571 — `MantineCountButton` icon-only-collapse option + HeroSearch filters-button adaptation

> **Sprint 43 (FiltersPanel/HeroSearch → Mantine — Epic MM Phase-2 composite).**
> **Completes the held Task 568.** Task 568 split `HeroSearch` into container + `HeroSearchView` and
> migrated its 4 Buttons to Mantine — that work STAYS. But the owner rejected 568's closure for two
> reasons this task fixes:
> 1. HeroSearch's filters button does **not** use the canonical `MantineCountButton` — it is a raw
>    Mantine `Button` with a **hand-rolled absolute corner `<span>` badge**. It therefore looks
>    non-native next to the `CountButton` story (which uses the inline `rightSection` badge).
> 2. On viewports **below 860px** the filters button keeps its full text label, which **steals width
>    from the location combobox** (the location shrinks to "Cit…" / "C"). Below 860px the button must
>    collapse to **icon + counter only** (no label).
>
> **Executor = Sonnet 4.6.** Read the hard contract (`docs/agent-contract.md` clauses 1–16a) and this
> whole file before writing code. Do NOT run git — the orchestrator emits commit commands at review.

---

## Owner decisions already made (do NOT re-litigate — implement these)

- **The collapse is a PROP on the `MantineCountButton` primitive** (reusable), NOT ad-hoc HeroSearch
  markup. (Owner: "Проп у CountButton primitive".)
- **The icon-only-collapse behavior is demonstrated as its own option/section inside the existing
  CountButton `Default` story** (Owner: "окрема опція у CountButton Story … яка має мати свою
  поведінку"). Do **NOT** add a second story export — governance allows exactly ONE `Default` export
  per `Mantine/Primitives/*` group (`docs/mantine-responsive-design-system.md` §8 + agent-contract
  clause 13c). Add a new `Stack` section within `Default`.
- **Collapse threshold value = 860px** (owner's number), passed by HeroSearch.
- **Do NOT fork the global breakpoint scale.** `src/app/globals.css` states Tailwind breakpoints are
  not forked, and there is no `md<x<lg` 860 stop. The collapse MUST be implemented **component-scoped**
  (see "Required after-behavior" for the two allowed techniques) — never a new global Tailwind `screen`
  and never a new Mantine theme breakpoint token.
- **The active-count badge adopts the canonical inline `rightSection` look** (white pill / brand text
  on the `filled` host — exactly the `CountButton` story). The old brand corner-overlay `<span>` is
  REMOVED. This visual change is intended (owner: "виглядає нативно, як у CountButton Story").

---

## Pre-read (rule-index → UI / layout / component task)

Always required: `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan for
the HeroSearch homepage-search→listings flow — see Regression coverage below).

Required for this type:
- `docs/mantine-responsive-design-system.md` — **FIRST**; §7 mobile gate, §12 canonical patterns, §18
  theming pitfalls, **§18.9 internal-spacing / leftSection icon overlap**.
- `docs/tailadmin-style-reference.md` — style source of truth; the CountButton chrome + badge rows are
  **already cited in `MantineCountButton.tsx`** (Status-badge row + gray-ramp row 41). Reuse those
  citations; invent no new color/px/radius/shadow.
- `docs/ui-rules.md`, `docs/component-rules.md` (→ "Container / Presentational Primitive Split"),
  `docs/qa-rules.md`.

---

## Files in scope (scope isolation — touch ONLY these + their tests/stories/i18n)

| File | Change |
|------|--------|
| `src/design-system/mantine/patterns/MantineCountButton.tsx` | Add the icon-only-collapse prop + behavior. Existing count/badge behavior preserved; no-prop render byte-identical. |
| `src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx` | Add tests for the collapse prop (label hidden below threshold, icon+count kept) + planted-violation proof. |
| `src/stories/mantine/primitives/CountButton.stories.tsx` | Add a `Stack` section to `Default` demonstrating icon+label+count AND the icon-only-collapse option (viewable via toolbar widths). No new export. |
| `src/components/shared/HeroSearchView.tsx` | Replace the raw filters `Button` + absolute corner `<span>` + `relative` wrapper with `MantineCountButton` (leftSection icon, `count`, `iconOnlyBelow={860}`). Remove `hidden sm:inline`. |
| `src/components/shared/__tests__/heroSearch.smoke.test.tsx` | Update/extend: filters button renders via `MantineCountButton`; count badge present when `activeFiltersCount>0`; label collapses (assert the collapse mechanism, not a pixel). |
| `messages/{sq,en,uk,it}.json` | Only if a NEW story-label key is needed under `storybook.mantine.*`; reuse existing keys where possible. All four locales, same key set. |

Do NOT touch: the tabs, PropertyType/Location comboboxes, the search button, `HeroSearch.tsx`
container (its public API + state stay unchanged), `FiltersPanel`, or any other primitive.

---

## Current behavior to preserve

- `MantineCountButton` today: `{ count, rightSection, children, variant, ...ButtonProps }`. Count>0 →
  inline `rightSection` badge (variant-aware: `filled`/undefined host → white pill brand text; other →
  gray pill). Count 0/undefined → plain Button. **All of this stays; a call with no new prop renders
  byte-identically.**
- HeroSearch filters button today: `variant={activeFiltersCount>0 ? 'filled' : 'default'}`,
  `onClick={onOpenFilters}`, `aria-label={t('advanced_filters')}`, `leftSection={<SlidersHorizontal/>}`,
  label `<span className="hidden sm:inline">{t('advanced_filters')}</span>`, plus an absolute corner
  count `<span>` in a `relative` wrapper. onClick, aria-label, variant logic, and the open-filters wiring
  MUST be preserved. The label-visibility rule and the badge DOM change per "Required after-behavior".
- Search button, tabs (Task 570 `max-sm:flex-1` 50/50 + Task 568 joined-corner radius), comboboxes,
  and the `FiltersPanel` drawer remain exactly as they are.

---

## Required after-behavior

### A. `MantineCountButton` — new `iconOnlyBelow` prop
- Add `iconOnlyBelow?: number` (px). **Default `undefined` = never collapse → current render byte-identical.**
- When set: at viewport width **< `iconOnlyBelow`px**, the button hides its **label (`children`)** but
  KEEPS the `leftSection` icon and the `count` badge, collapsing to a tidy **icon + counter** control:
  - horizontal padding reduces to a compact/near-square form so it is not a wide empty pill;
  - remains a real `<button>` with the same `onClick`, `type`, `aria-label` (the accessible name MUST
    survive collapse — since the visible label disappears, an `aria-label` is REQUIRED and the consumer
    passes it);
  - touch target **≥44px** (`min-h-11` / Mantine size) at every width, per clause 11.
- At width **≥ `iconOnlyBelow`px**: full `leftSection` icon + label + count badge (unchanged look).
- **Threshold implementation — component-scoped only, one of these two (Sonnet picks the SSR-safe one):**
  1. A co-located CSS module on the primitive that hides the label wrapper via a scoped
     `@media (max-width: …)` / `@container` rule driven by the px value (e.g. injected as a CSS custom
     property on the root); OR
  2. `useMediaQuery` from `@mantine/hooks` (already a dependency) with an **SSR-safe guard**
     (`getInitialValueInEffect`) so there is **no hydration mismatch** — label visible on first paint,
     then collapses in effect.
  **MUST NOT** add a global Tailwind `screen` or a Mantine theme breakpoint. If neither technique can be
  made SSR-safe without a global change, **STOP and ASK the orchestrator** — do not fork the scale.
- Badge chrome unchanged (variant-aware pill already cited to the reference). §18.9: verify the
  `leftSection` icon does not touch/overlap the label or the count in EITHER state.

### B. `CountButton.stories.tsx` — demonstrate the option (inside `Default`, no new export)
- Add a `Stack` section rendering a `MantineCountButton` with `leftSection` icon + label + `count` +
  `iconOnlyBelow={<threshold>}` so the reviewer sees it collapse to icon+count as the Storybook viewport
  toolbar is narrowed below the threshold, and expand above it. Include an `aria-label`.
- All visible strings + `aria-label` via `storyT`/`storybook.mantine.*` (4-locale parity). Reuse
  `count_button_label` where possible; add a new key only if genuinely needed (then all four locales).

### C. `HeroSearchView.tsx` — adopt the canonical primitive + adaptation
- Replace the raw filters `Button` + the absolute corner `<span>` badge + the `relative` wrapper with:
  ```
  <MantineCountButton
    variant={activeFiltersCount > 0 ? 'filled' : 'default'}
    count={activeFiltersCount}
    iconOnlyBelow={860}
    onClick={onOpenFilters}
    aria-label={t('advanced_filters')}
    leftSection={<SlidersHorizontal className="h-4 w-4" />}
    className="…"          // keep whatever width/padding classes are still needed post-collapse
  >
    {t('advanced_filters')}
  </MantineCountButton>
  ```
- Remove the `hidden sm:inline` span and the hand-rolled corner badge entirely — the primitive now owns
  both the badge and the label-collapse.
- Net result across widths:
  - **≥860px:** `[icon] Advanced filters [count]` — full label, inline count (white pill on the brand
    `filled` host when count>0), location combobox has full width.
  - **640–859px:** `[icon][count]` — collapsed, location combobox regains the width it was losing.
  - **<640px:** the row is already `flex-col`→ property/location stack full-width; the bottom action row
    keeps `[filters icon+count]` (collapsed, icon-only exemption) next to the `flex-1` full-width search
    button.
- Preserve the `import { MantineCountButton } from '@/design-system/mantine/patterns'` barrel import
  pattern; drop the now-unused `Button` import if nothing else uses it (check the tabs/search still do —
  they DO, so keep `Button`).

---

## Positive flow (happy path)

- **Actor:** visitor on the homepage hero (`/[locale]`), any of sq/en/uk/it.
- **Preconditions:** `HeroSearch` mounted; `activeFiltersCount` may be 0 or >0.
1. Visitor views the hero at ≥860px → sees `[icon] Advanced filters [N]` (N only if >0), location combobox full width. **System:** label + inline count render; button host is `filled` iff N>0.
2. Visitor narrows the window below 860px (or is on a phone/tablet) → the filters button collapses to `[icon][N]`; location combobox no longer squeezed. **System:** label hidden via the component-scoped mechanism; icon + count + `aria-label` preserved; touch target ≥44px.
3. Visitor clicks/taps the filters button (either state) → `onOpenFilters()` fires → `FiltersPanel` opens (unchanged). **System:** identical to today.
4. Visitor applies filters → `activeFiltersCount` updates → the inline count badge updates in both states. **Post-condition:** count reflects `countActiveFilterValues(filters)`; search + URL building unchanged.
- **Success state:** native-looking canonical count button matching the `CountButton` story; location combobox readable at all widths; no horizontal scroll at 320.

## Negative flow (every off-happy-path branch)

- **count = 0 / undefined:** no badge in EITHER state; ≥860 shows `[icon] Advanced filters`, <860 shows `[icon]` only; host stays `default`. No empty/blank pill.
- **iconOnlyBelow undefined (other consumers, incl. FiltersPanel Apply):** render byte-identical to today — full label always, no collapse. Prove via the existing CountButton smoke test staying green.
- **SSR / first paint:** no hydration mismatch — label MUST NOT flash-then-vanish inconsistently between server and client (use CSS media/container, or `useMediaQuery` with `getInitialValueInEffect`). If a mismatch is unavoidable with the chosen technique, STOP and ASK.
- **Collapsed + very long locale label (uk/sq):** because the label is hidden <860, no clipping possible there; ≥860 the label wraps/does not clip (verify uk/sq at 860/960).
- **Keyboard / a11y:** collapsed button still reachable by Tab, has an accessible name (`aria-label`), Enter/Space triggers `onOpenFilters`. Focus ring (TailAdmin `focus:ring-brand-500/10 ring-3`) present in both states.
- **Missing `aria-label` on a collapsing instance:** the primitive should make the accessible-name requirement obvious (JSDoc note that `iconOnlyBelow` requires `aria-label`); do NOT silently ship a nameless icon button.
- **Reduced motion:** no animation dependency introduced.

---

## 🔴 Mobile <640 full-width gate (OWNER P0 — agent-contract clause 11)

- **In scope surface:** the hero action row (`flex gap-2`) holding the filters button + search button.
- **Search button:** stays `flex-1` → full available width at <640 (text button, full-width rule). Unchanged.
- **Filters button:** at <640 it is **collapsed to icon + counter** → this is an **icon-only control**,
  the ONLY permitted exemption to the full-width rule. **Document it explicitly** in the session log's
  exemption list ("filters button <860 = icon+count, icon-only exemption, ≥44px"). It must NOT be forced
  to full width.
- ≥44px touch targets on both buttons at all widths; the property/location comboboxes remain full-width
  stacked at <640 (unchanged). No horizontal scroll at 320 in any locale.
- The FiltersPanel drawer opened by the button is already a full-width bottom sheet (Task 567) —
  unchanged, not re-touched here.

## 🔴 TailAdmin conformance (OWNER P0 — clause 16)

- No new tokens. The button chrome (`filled`/`default` §6a) and the count badge (Status-badge row +
  gray-ramp row 41) are ALREADY cited in `MantineCountButton.tsx` — reuse verbatim. Brand `#EC5447`
  stays. The collapsed compact padding must stay within cited spacing (no invented px); if a compact
  padding value is needed, derive it from an existing §-row and cite it.
- Rendered side-by-side proof required (see verification): the migrated HeroSearch filters button vs the
  `CountButton` story's `filled + count` example must match (border/radius/focus ring/shadow/font/pill).

## 🔴 Presentational-primitive split (OWNER P0)

Already satisfied by Task 568 (`HeroSearchView` is prop-driven; container `HeroSearch.tsx` owns hooks).
Keep it that way — the story renders `HeroSearchView`/`MantineCountButton` with fixtures, **no hook or
network mock, no `.storybook` alias, no live Supabase.** A data-hook mock appearing in a story/test = the
split was skipped → fail.

## 🔴 Regression coverage (agent-contract clause 15 / Epic RS)

- **Scan `docs/critical-flow-registry.md`** for the HeroSearch homepage-search→`/listings` flow. If it
  has a row, baseline the existing green test BEFORE the change and extend it; if it has **no** row, ADD
  one (route `/[locale]`, action = open filters + submit search, happy + the count/collapse behavior,
  the test command).
- Extend `heroSearch.smoke.test.tsx`: (a) filters button is a `MantineCountButton` and shows the count
  badge when `activeFiltersCount>0`; (b) `onOpenFilters` still fires on click; (c) the collapse
  mechanism is present (assert the prop is wired / label wrapper carries the collapse class — assert
  behavior, not a rendered pixel).
- Extend `MantineCountButton.smoke.test.tsx`: (a) `iconOnlyBelow` unset → label always rendered
  (byte-identical guard); (b) `iconOnlyBelow` set → label wrapper carries the collapse treatment while
  icon + count remain; (c) **planted-violation FAIL transcript** proving the new assertions are real
  (temporarily break the behavior → test fails → revert). Paste both baseline-green and
  planted-FAIL transcripts in the session log.

---

## Acceptance criteria (each maps to a flow + must be verifiable in the diff at file:line)

1. `MantineCountButton` gains `iconOnlyBelow?: number`; unset → byte-identical render (Negative: iconOnlyBelow-undefined) — verifiable at `MantineCountButton.tsx:line`.
2. When set, label hidden < threshold, `leftSection` icon + `count` badge kept, ≥44px, compact padding, `aria-label` preserved (Positive step 2; Negative: a11y) — `MantineCountButton.tsx:line`.
3. Threshold is component-scoped; NO new global Tailwind `screen` / Mantine breakpoint (grep-clean) — `MantineCountButton.tsx` + `globals.css` unchanged for breakpoints.
4. SSR-safe, no hydration mismatch (Negative: SSR) — technique visible at `MantineCountButton.tsx:line`.
5. `CountButton.stories.tsx` `Default` gains an icon+label+count + `iconOnlyBelow` section; ONE export only; all strings/aria via `storyT` 4-locale — `CountButton.stories.tsx:line`.
6. `HeroSearchView.tsx` filters button now `MantineCountButton` with `leftSection`/`count`/`iconOnlyBelow={860}`/`onClick={onOpenFilters}`/`aria-label`; the absolute corner `<span>` + `relative` wrapper + `hidden sm:inline` are REMOVED (Positive steps 1–4) — `HeroSearchView.tsx:line`.
7. Location combobox regains width at 640–859 (Positive step 2) — proven in the rendered matrix (uk@680/768/810).
8. Mobile <640: filters = icon+count (documented icon-only exemption), search = `flex-1` full width, no h-scroll at 320 — rendered matrix.
9. Count 0 → no badge in either state (Negative: count=0) — `MantineCountButton.tsx` + render.
10. `heroSearch.smoke` + `MantineCountButton.smoke` extended, baseline-green + planted-FAIL transcripts present; critical-flow-registry row baselined/added (clause 15).
11. Rendered verification matrix (clause 12): breakpoints × sq/en/uk/it, **uk@320/375/390 mandatory**, plus 680/768/810/860/960 to prove the collapse boundary; TailAdmin side-by-side vs the CountButton story.
12. Gates green: `tsc --noEmit`=0, `lint`, `check:stories`, `check:i18n`, `check:design-tokens --strict`, `check:mojibake`, `check:file-integrity`, `screenshots:assert -- --mantine-only`. §18.9 human-visual icon-overlap check captured at uk@320 + one desktop width.

## Hard contract (verified against the diff at review)

- No scope change; no invented architecture (STOP and ASK on the SSR/breakpoint ambiguity if it arises).
- Both flows implemented (every negative branch above has a handler/guard/render path).
- 4-locale parity for any new key; 7 canonical breakpoints + the collapse-boundary widths verified.
- `tsc=0`; AC-by-AC self-audit table; final `Self-validation:` line; file-integrity transcript.
- Update `docs/backlog.md` + add `docs/sessions/2026-07-10-task571-countbutton-collapse-herosearch.md`
  with a **"Files Changed" table**. **Do NOT run git / emit commit commands** — the orchestrator does
  that at review.
- Preserve every existing control (tabs, comboboxes, search, open-filters wiring); nothing silently removed.

## Definition of done

Filters button in HeroSearch is the canonical `MantineCountButton`, visually identical to the CountButton
story's `filled + count` example at ≥860, collapsing to icon+count below 860 without stealing the
location combobox's width, byte-identical for all other `MantineCountButton` consumers, fully localized,
mobile-gate compliant, and covered by extended smoke tests with a planted-violation proof — all rendered
gates green with the matrix in the session log.
