# Task 552 — Phase-2 Slice 2: YearCombobox → MantineCombobox (consumer migration)

> **Sprint 41 / Epic MM — Phase 2 (shared composites). Owner P0, agent-contract clauses 1–16 + 16a.**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine composite migration (swap a shared composite's internal
> primitive from legacy `@/components/shared/Combobox` to the canonical `MantineCombobox`, preserving the
> composite's own public API 1:1). **Status:** OPEN.
> **Why this task exists:** Slice 1 (Task 551, PropertyTypeCombobox) established the button-variant recipe with the
> new `triggerWidth` prop. Slice 2 takes the SECOND-simplest combobox consumer — `YearCombobox` — which is the first
> **`variant="input"` typeahead** consumer AND the first consumer that passes `portal`. It surfaces two genuine
> primitive gaps (numeric type-to-commit + portal) that every later input-variant slice (Location, DatePicker,
> PhoneField) will also hit, so resolving them here is deliberately load-bearing. LocationCombobox is a LATER, larger
> slice (it carries an admin add-location sub-flow) — do NOT touch it here.

---

## Pre-read (rule-index → UI/layout/component + Storybook)

- `docs/agent-contract.md` (clauses 1–16 + 16a) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (**scan result, pre-verified by orchestrator:** no "listing search / year filter" flow is registered; `YearCombobox`
  feeds the **Create/Edit listing** form (registered, Task 442) as the `year_built` input field, and the search
  filters as `year_built_min`/`year_built_max` URL params — the filter path changes NO server action. Confirm this
  scan yourself before closing).
- 🔴 `docs/tailadmin-style-reference.md` — §6d/§6e (input/Select chrome), §6l (dropdown item chrome). The
  `MantineCombobox` primitive already carries this chrome (Task 537); this slice adds NO new §6x row.
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §12 (canonical patterns), §16, §18 (theming vs
  `*-chrome.css`).
- `docs/storybook-governance.md` §14 (+ §14.9 loader-allowlist).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- Reference the Task 551 recipe: `docs/sessions/2026-07-05-task551-propertytypecombobox-mantine-migration.md` +
  `src/components/shared/PropertyTypeCombobox.tsx` (the wrapper-`<div>` + `triggerWidth` pattern you will reuse).

## Scope

**In scope:**
- `src/components/shared/YearCombobox.tsx` — replace its internal legacy `<Combobox variant="input" …>` with
  `<MantineCombobox variant="input" …>` (`@/design-system/mantine/patterns`). Its **own public props
  (`value?: number`, `onChange`, `placeholder?`, `className?`, `portal?`) stay byte-identical** so all six render
  sites are untouched.
- The `MantineCombobox` primitive to add: (a) the numeric-typeahead capability resolved in STOP-AND-ASK #1 (if the
  owner picks Option A); (b) the `portal` resolution confirmed in STOP-AND-ASK #2; and (c) the desktop dropdown
  max-height/scroll cap authorized in STOP-AND-ASK #3 (220px + `overflow-y:auto`, single-sourced to `MantineSelect`).
  Story + primitive smoke tests updated accordingly.
- The `Mantine/Primitives/Combobox` story only if the numeric props are added (demonstrate them as a new block).
- Session log + `docs/mantine-tailadmin-migration-tracker.md` (Phase-2 pointer) + `docs/backlog.md`.

**Out of scope:**
- `YearComboboxField.tsx`, `StepDetails.tsx`, `FiltersPanel.tsx`, `ListingsFilters.tsx` — MUST NOT change (the
  composite's API is preserved, so every call site compiles and behaves identically). If you find yourself editing
  any of them, STOP — the migration has leaked.
- `LocationCombobox`, `PropertyTypeCombobox`, `DatePicker`, `PhoneField`, the legacy `Combobox.tsx` itself, and every
  other composite — separate later slices.
- Any listing-form / search-filter action or server behavior. Any shared token / semantic array / `globals.css`.
- Deleting legacy `Combobox.tsx` (only in Phase 6, once ALL its consumers migrate).
- Changing `MIN_PROPERTY_YEAR`, `MAX_YEAR`, or the year-option generation.

## Current behavior to preserve (all SIX render sites — exact)

`YearCombobox` today (`src/components/shared/YearCombobox.tsx`) renders a legacy `<Combobox variant="input">` (the
default variant — a searchable text input) with a `Calendar` icon and:
- `options` = years `MAX_YEAR … MIN_PROPERTY_YEAR` (descending), each `{value:String(y), label:String(y)}`.
- `value` = `String(value)` when the number is set, else `''`.
- `onChange` (option-select) = `v => onChange(v ? parseInt(v,10) : undefined)`.
- **`onInputChange={handleInputChange}`** — as the user TYPES, `handleInputChange(raw)` strips non-digits, caps at 4
  digits, and if the parsed number is within `MIN_PROPERTY_YEAR…MAX_YEAR` calls `onChange(number)`, else
  `onChange(undefined)`. **This commits the numeric value live on each keystroke — not only on option-select.**
- **`inputMode="numeric"`** — mobile shows the numeric keypad.
- `className={cn('year-combobox', className)}`; `portal={portal}` (default `false`).

The six render sites (all MUST render + behave identically after migration):

1. **`src/modules/listings/components/form/YearComboboxField.tsx:14`** — `value={formValues.year_built}`,
   `onChange={v => onChange({ year_built: v })}`, `placeholder={t('year_built_placeholder')}`, `className="w-full"`,
   no `portal` (→ false). Desktop full-width; part of the create/edit listing form (registered flow, Task 442).
2. **`src/modules/listings/components/steps/StepDetails.tsx:126`** — `value={data.year_built}`,
   `onChange={v => onChange({ year_built: v })}`, `placeholder={t('year_built_placeholder')}` (verify the exact
   `className`/`portal` in the file and preserve them byte-for-byte). Listing form (step flow).
3–4. **`src/components/shared/FiltersPanel.tsx:247,253`** — a `year_built_min` + `year_built_max` PAIR inside
   `<div className="grid grid-cols-2 gap-2">`, each with `placeholder={t('year_from')|t('year_to')}` and **`portal`**
   (=true). Rendered inside the mobile filter bottom-sheet / overflow container.
5–6. **`src/modules/listings/components/ListingsFilters.tsx:263,269`** — the same `min`/`max` PAIR inside a
   `grid grid-cols-2` inside an `AccordionSection` (overflow container), each with **`portal`**.

## Required after-behavior

- `YearCombobox` internally renders `<MantineCombobox variant="input" icon={<Calendar …/>} …>` and imports from
  `@/design-system/mantine/patterns` — the `@/components/shared/Combobox` import is removed from THIS file.
- Its public API + all six call sites are unchanged. Reuse the Task 551 pattern: wrap `<MantineCombobox>` in the SAME
  width-bearing `<div className={cn('year-combobox', className)}>` and pass `triggerWidth={{ base:'100%', sm:'100%' }}`
  so the trigger fills the wrapper (form `w-full`; each filter grid cell = half-width; mobile full-width). Verify in
  the render, don't assume.
- `noResultsLabel` (required `MantineCombobox` prop) + `triggerAriaLabel` (+ optional `sheetTitle`) supplied from i18n
  (reuse existing keys — `common.no_results` exists; for the aria/title reuse an existing `year_built`/`year` key if
  present, otherwise STOP and confirm the key name before adding, with full sq/en/uk/it parity). Zero hardcoded strings.
- The numeric typeahead is preserved per STOP-AND-ASK #1: typing digits still live-commits the year (or clears it when
  out of range), the mobile numeric keypad still appears, AND selecting a year from the filtered dropdown/sheet still
  commits it.
- The `portal` prop still exists on `YearCombobox` and every call site still passes it unchanged; its runtime effect is
  resolved in STOP-AND-ASK #2.

## 🔴 STOP-AND-ASK #1 — numeric type-to-commit (`onInputChange` + `inputMode`) (resolve BEFORE implementing; do NOT guess)

`MantineCombobox` (`variant="input"`) today manages its own `search` state and, on each keystroke, calls
`onChange('')` (clearing the selection) then commits a value ONLY when an option is submitted (click/Enter). It exposes
**no** `onInputChange` callback and **no** `inputMode`. `YearCombobox` needs BOTH: live numeric commit while typing
(even before an option is picked) and the mobile numeric keypad. This is a genuine primitive gap and the FIRST
input-variant consumer to hit it. Present these options to the owner and implement only the chosen one:

- **Option A (RECOMMENDED):** add two minimal, backward-compatible props to `MantineCombobox`:
  - `inputMode?: TextInputProps['inputMode']` — threaded onto BOTH the desktop `variant="input"` trigger `<TextInput>`
    AND the mobile sheet's own search `<TextInput>`. Default `undefined` → unchanged.
  - `onInputChange?: (raw: string) => void` — fired with the raw `currentTarget.value` from the same two inputs.
    **When `onInputChange` is provided, the primitive delegates keystroke value-commit to the consumer: it must NOT
    fire its internal `onChange('')` on type** (so the consumer's `onInputChange` is the single source of on-type
    commits), while still updating its internal `search` for filtering and still committing on option-select. When
    `onInputChange` is absent, behavior is byte-identical to today (proven by the existing 551 smoke + a new planted
    violation). `YearCombobox` maps `onInputChange` → its existing `handleInputChange` sanitize/validate. ~5–10 lines
    in the primitive + a story block + two primitive smoke assertions.
- **Option B:** owner accepts **select-only** commit for year on all six surfaces (typing filters the dropdown/sheet;
  the value commits only when a year is clicked/Enter-selected), dropping live-type-commit and the numeric keypad. No
  `onInputChange`; `inputMode` still worth adding for the keypad, or dropped entirely. Simpler, but a behavior change
  from today — confirm the owner truly accepts losing type-to-commit before choosing this.

Whichever is chosen, the **mobile `<640` behavior is non-negotiable full-width bottom sheet** (clause 11) and the
create/edit `year_built` field must keep committing a valid year.

## 🔴 STOP-AND-ASK #2 — `portal` (4 of 6 call sites pass it) (resolve BEFORE implementing; do NOT guess)

Legacy `Combobox` uses `portal` to render its dropdown into `document.body` so it does not clip inside
`overflow:hidden/auto` containers (the filter panel + accordion). `MantineCombobox`'s desktop dropdown is Mantine's
`Combobox.Dropdown` (a `Popover`) which defaults `withinPortal: true`, and its mobile path is a portaled bottom sheet —
so it should NOT clip inside those containers regardless of a `portal` prop. **Orchestrator's recommended resolution:**
keep `portal?: boolean` on `YearCombobox`'s public API (so all four `portal` call sites stay byte-identical) but treat
it as a **documented no-op** (Mantine always portals) — add NO `portal` prop to `MantineCombobox`. **Mandatory proof:**
render both filter pairs (`FiltersPanel` + `ListingsFilters`) at desktop AND `<640` and show the dropdown/sheet is NOT
clipped by the grid/accordion/overflow container. If — and only if — the render shows clipping, STOP and ask the owner
whether to add a real `portal`/`withinPortal` passthrough. Do not silently drop or silently honor `portal` without the
rendered proof.

## 🔴 Scope expansion — STOP-AND-ASK #3: desktop dropdown has no max-height/scroll cap (orchestrator-authorized, 2026-07-05)

**Discovered by Sonnet mid-execution while proving STOP-AND-ASK #2.** A THIRD, unanticipated primitive gap:
`MantineCombobox`'s desktop `Combobox.Options`/`Combobox.Dropdown` has **no max-height and no internal scroll cap**
(confirmed in `theme.ts` — no `mah`/overflow styling for the low-level `Combobox`). The sibling `MantineSelect` never
hit this because it is built on Mantine's HIGH-LEVEL `<Select>`, which ships a built-in `maxDropdownHeight` default
(220px) with internal scroll; `MantineCombobox` is built on the LOW-LEVEL `Combobox` primitive, which has no such
default. `YearCombobox` is the first consumer with a genuinely long list (~82 years), so on desktop the dropdown
renders as one giant unclamped column running off-viewport instead of an internally-scrolled box.

**Orchestrator ruling (authorized in-scope for Task 552 — this is a defect this slice is the first to surface, NOT
scope creep; an unclamped 82-item column fails the clause 12 rendered gate and clause 16 conformance on its own, so
deferring would ship a non-approvable surface):**

- **Fix it in this task.** Cap `MantineCombobox`'s desktop `Combobox.Options` to match the ALREADY-APPROVED sibling
  `MantineSelect`: **Mantine `<Select>`'s `maxDropdownHeight` default (220px) + `overflow-y:auto`.**
- **🔴 Source-of-truth basis (clause 16 / clause 16a):** the value is single-sourced/cited to **`MantineSelect`
  canonical-first (ai-behavior Note 14)** — NOT to the legacy `Combobox.tsx`'s `max-h-56`/224px. Reusing a legacy
  Tailwind class or "formalizing a prior value" is the exact anti-pattern clause 16a forbids. Verify the pixel by
  rendering a LONG `MantineSelect` story, measure its capped/scrolled dropdown, and match it; prove the
  `MantineCombobox` dropdown **side-by-side** with that `MantineSelect` render.
- **Do NOT double-apply on mobile.** The mobile bottom sheet already caps at ≤90dvh (`responsiveBottomSheet.tsx`) —
  leave it untouched; this cap is desktop-`Combobox.Options`-only.
- **Proof required:** a primitive smoke assertion that the desktop options container carries the 220px cap +
  `overflow-y:auto`, plus a planted-violation transcript (remove the cap → the assertion FAILS; revert byte-identical).
  Rendered evidence at 320/375/390 × sq/en/uk/it showing the desktop dropdown is internally scrolled (not off-viewport)
  and the mobile sheet still scrolls at ≤90dvh.
- **Append the scope-expansion decision trail** (this section + Sonnet's discovery note) is already recorded here; keep
  the session log's Files-Changed table + AC audit consistent with it.

## Mobile <640 full-width gate (clause 11) — MANDATORY

- The trigger renders **full-width edge-to-edge below 640px** on all six surfaces (`MantineCombobox` base `w:'100%'`
  + your `triggerWidth={{base:'100%',sm:'100%'}}` — verify in the render).
- The dropdown is a **full-width bottom sheet `<640`** (the primitive's `ResponsiveBottomSheet` path — verify it
  opens as a bottom sheet with a search field carrying `inputMode="numeric"` if Option A, ≥44px option rows, drag
  handle, closes on backdrop + Esc, ≤90dvh scroll).
- In the `grid grid-cols-2` filter pairs, confirm each trigger fills its half-cell at `≥640` and each stacks/goes
  full-width sensibly at `<640` (whatever the grid resolves to — do not change the grid; just prove no clip/overflow).
- No horizontal scroll at 320; touch targets ≥44px. Re-confirm with rendered evidence at 320/375/390 × sq/en/uk/it
  (uk@320/375/390 mandatory).

## TailAdmin conformance gate (clause 16)

No new chrome is authored — `MantineCombobox` already renders §6d/§6e trigger chrome + §6l dropdown/item chrome
(Task 537, rendered-approved). Verify the migrated `YearCombobox` renders that SAME chrome side-by-side with the
primitive's own story (border gray-300, focus brand-300 ring, radius `lg`/8px, shadow-theme-xs, Open Sans, 44px
density). Any divergence = the migration wired something wrong → fix, do not invent a new value.

## Positive + Negative flow

**Positive:**
- **Form (`year_built`, full-width):** empty → trigger shows the placeholder; typing `1998` live-commits `1998`
  (Option A) and updates the field; selecting a year from the dropdown/sheet commits it; the value round-trips into
  create/edit listing. `≥640` and `320` × sq/en/uk/it.
- **Filter pairs (min/max, portal, grid):** typing/selecting a year updates the URL param (`year_built_min`/`_max`);
  the dropdown opens without clipping inside the accordion/panel; both cells work independently.

**Negative flow (every branch):**
- **(a)** long labels are N/A (years are ≤4 chars) — but still confirm no clip/overflow at 320 and the numeric
  keypad appears on mobile (Option A).
- **(b)** out-of-range / non-numeric input (e.g. `1700`, `abcd`, `20255`) → sanitized to ≤4 digits; if outside
  `MIN_PROPERTY_YEAR…MAX_YEAR` → `onChange(undefined)` (field clears), no thrown error, no partial commit.
- **(c)** dismiss without selecting (backdrop tap `<640`, Esc, click-away desktop) → value unchanged from its last
  committed state; sheet/dropdown closes; focus returns to trigger.
- **(d)** re-open after a prior selection → fresh dropdown/sheet state (no stale search); selection still works.
- **(e)** clearing: deleting all digits → `onChange(undefined)`; the filter param is removed (`null`), the form field
  clears. Verify each of the 6 sites' `onChange` adapter still receives `undefined` correctly.
- **(f)** portal/clip: both filter pairs' dropdowns are NOT clipped by their overflow container (STOP-AND-ASK #2 proof).
- **(g)** No regression: `YearComboboxField.tsx` / `StepDetails.tsx` / `FiltersPanel.tsx` / `ListingsFilters.tsx` diffs
  are empty; no shared token / semantic array / `globals.css` changed; the legacy `Combobox.tsx` and all its OTHER
  consumers are untouched.

## Regression coverage (clause 15)

- Scan `docs/critical-flow-registry.md`: no "listing search / year filter" row exists. `YearCombobox` is the
  `year_built` input of the **Create/Edit listing** flow (registered, Task 442). This slice does NOT change any
  listing or search action — it swaps the field's internal primitive while preserving `value`/`onChange`.
- **Baseline the existing listing smokes green before AND after** (`npx vitest run
  src/modules/listings/actions/__tests__/createListing.smoke.test.ts
  src/modules/listings/actions/__tests__/updateListing.smoke.test.ts`) and record it — no NEW action test is required
  because the action contract is untouched, but the baseline must be shown to prove no regression.
- If Option A adds primitive props, add `MantineCombobox` smoke assertions: (1) `onInputChange` fires with the raw
  typed value AND the internal `onChange('')`-on-type is suppressed when `onInputChange` is present; (2) `inputMode`
  reaches the trigger input; (3) with BOTH absent, on-type behavior is byte-identical to today. Planted-violation:
  break the `onInputChange`-present suppression (or the default) → the relevant assertion FAILS; revert byte-identical.

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — all cells resolved, uk@320/375/390 clean, no document h-scroll, no
  new FAIL vs the current 462/480 baseline. Attach the manifest. (Note: the 18 pre-existing AMBIGUOUS Combobox/Drawer/
  Tabs cells are owner-triage, not yours — but you must introduce ZERO new FAIL and ZERO new AMBIGUOUS.)
- Planted-violation FAIL transcript for any changed story (revert byte-identical, as Task 551 did).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
  `check:file-integrity` — all green (paste transcripts).
- Listing-form regression baseline (above) green before + after; new primitive smokes green + planted-violation.

## Acceptance criteria

1. `YearCombobox` renders via `MantineCombobox` (`variant="input"`, Calendar icon); the legacy
   `@/components/shared/Combobox` import is gone from this file; its public API (`value`/`onChange`/`placeholder`/
   `className`/`portal`) is byte-identical (Positive flow, all six sites, verifiable at file:line).
2. STOP-AND-ASK #1 (numeric type-to-commit) resolved with the owner and implemented literally; the create/edit
   `year_built` field still commits a valid year; mobile `<640` full-width bottom sheet preserved (Negative flow
   (a)/(b)/(e), file:line + rendered cell).
3. STOP-AND-ASK #2 (`portal`) resolved with the owner; both filter pairs proven un-clipped with rendered evidence at
   desktop + `<640` (Negative flow (f)).
3a. STOP-AND-ASK #3 (desktop dropdown cap) implemented: `Combobox.Options` capped at 220px + `overflow-y:auto`,
   single-sourced/cited to `MantineSelect` canonical-first (NOT legacy `max-h-56`), proven side-by-side with a long
   `MantineSelect` render; primitive smoke assertion + planted-violation transcript present; mobile ≤90dvh untouched.
4. `noResultsLabel` + `triggerAriaLabel` (+ optional `sheetTitle`) supplied from i18n with sq/en/uk/it parity; zero
   hardcoded strings (confirm any reused/added key exists in all four locales).
5. All six consumers unchanged (empty diff for `YearComboboxField.tsx` + `StepDetails.tsx` + `FiltersPanel.tsx` +
   `ListingsFilters.tsx`); no shared token/semantic array/`globals.css` change; legacy `Combobox.tsx` and its other
   consumers untouched (Negative flow (g)).
6. Rendered `--assert` matrix + side-by-side vs the primitive story + planted-violation transcript; all light gates
   green; listing-form smoke baseline green before + after; new primitive smokes green.
7. Session log: Files-Changed table, AC-by-AC self-audit citing BOTH flows by name, `Self-validation: …` line.
   **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) + the
rendered matrix + BOTH STOP-and-ASK resolutions, then emits explicit-path commits (composite + primitive [if Option A]
+ story + `messages/*.json` [only if a key was added] + tracker + session log + `docs/backlog.md`). Owner runs them in
PowerShell after the native gate.
