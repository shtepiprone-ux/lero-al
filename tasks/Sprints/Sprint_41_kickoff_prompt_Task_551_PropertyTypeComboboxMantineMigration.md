# Task 551 — Phase-2 Slice 1: PropertyTypeCombobox → MantineCombobox (consumer migration)

> **Sprint 41 / Epic MM — Phase 2 (shared composites). Owner P0, agent-contract clauses 1–16.**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine composite migration (swap a shared composite's internal
> primitive from legacy `@/components/shared/Combobox` to the canonical `MantineCombobox`, preserving the
> composite's own public API 1:1). **Status:** OPEN.
> **Why this task exists:** Phase 1 (all 30 primitives) + the Task 525 audit correction queue are CLOSED.
> Phase 2 migrates the 21 shared composites onto the finished primitives, starting with the Combobox family.
> `MantineCombobox` (Task 537, P1.21) has **zero product consumers so far** — this slice makes PropertyTypeCombobox
> its first, and deliberately picks the SIMPLEST combobox consumer (static options, no async, no add-flow, no
> numeric-typeahead) to establish the migration recipe before the harder Year/Location slices.

---

## Pre-read (rule-index → UI/layout/component + Storybook)

- `docs/agent-contract.md` (clauses 1–16 + 16a) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (**scan result, pre-verified by orchestrator:** no "homepage search / property-type filter" flow is registered;
  PropertyTypeCombobox feeds the **Create/Edit listing** form (registered, Task 442) only as an input field — see
  Regression section. Confirm this scan yourself before closing).
- 🔴 `docs/tailadmin-style-reference.md` — §6d/§6e (Select/input chrome), §6l (dropdown item chrome). The
  `MantineCombobox` primitive already carries this chrome (Task 537); this slice adds NO new §6x row.
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §12 (canonical patterns), §16, §18 (theming vs
  `*-chrome.css`).
- `docs/storybook-governance.md` §14 (+ §14.9 loader-allowlist).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Scope

**In scope:**
- `src/components/shared/PropertyTypeCombobox.tsx` — replace its internal `<Combobox>` (legacy
  `@/components/shared/Combobox`) with `<MantineCombobox>` (`@/design-system/mantine/patterns`). Its **own public
  props (`value`, `onChange`, `placeholder`, `showAllOption`, `className`) stay byte-identical** so its two consumers
  are untouched.
- The `MantineCombobox` primitive **only** to add the trigger-width control resolved in the STOP-and-ASK below
  (if — and only if — the owner picks Option A). Story + any primitive test updated accordingly.
- The four `messages/*.json` **only if** a new string key (`no_results` / mobile sheet title) is required and not
  already present — with full sq/en/uk/it parity.
- The `Mantine/Primitives/Combobox` story only if the width prop is added (demonstrate it); otherwise untouched.
- Session log + `docs/mantine-tailadmin-migration-tracker.md` (Phase-2 pointer) + `docs/backlog.md`.

**Out of scope:**
- `HeroSearch.tsx` and `ListingFormShellView.tsx` — MUST NOT change (the composite's API is preserved, so the call
  sites compile and behave identically). If you find yourself editing either, STOP — the migration has leaked.
- YearCombobox, LocationCombobox, the legacy `Combobox.tsx` itself, and every other composite — separate later slices.
- Any listing-form action / server behavior. Any shared token / semantic array / `globals.css`.
- Deleting legacy `Combobox.tsx` (only in Phase 6, once ALL its consumers migrate).

## Current behavior to preserve (both consumers — exact)

`PropertyTypeCombobox` today (`PropertyTypeCombobox.tsx`) renders a legacy `<Combobox variant="button">` with a
`Home` icon, options = `PROPERTY_TYPES` mapped to `{value, label:tl(labelKey)}`, optionally prefixed by a
`{value:'', label: t('all_types')}` row when `showAllOption` (default `true`).

Two call sites (both MUST render identically after migration):

1. **HeroSearch.tsx:106** — `<PropertyTypeCombobox value={propertyType} onChange={setPropertyType} />`
   → `showAllOption` defaults **true** (the "All types" row is present), no `placeholder`, `className` defaults
   `'sm:w-48 shrink-0'` → **desktop width 192px, full-width `<640`** (parent is `flex-col sm:flex-row`).
2. **ListingFormShellView.tsx:175** — `<PropertyTypeCombobox value={data.property_type || ''} onChange={v => { if (v) onPropertyTypeChange(v as PropertyType) }} placeholder={t('property_type_placeholder')} showAllOption={false} className="w-full" />`
   → **no "All types" row**, custom placeholder, **full-width at every breakpoint** (`w-full`). This is the required
   property-type field of the listing create/edit form; `errors.property_type` renders below it (unchanged).

## Required after-behavior

- `PropertyTypeCombobox` internally renders `<MantineCombobox variant="button" icon={<Home …/>} …>` and imports
  from `@/design-system/mantine/patterns` — the `@/components/shared/Combobox` import is removed from THIS file.
- Its public API + both call sites are unchanged; `showAllOption` still toggles the leading `{value:''}` "All types"
  option; the selected trigger label, the mobile bottom-sheet, and keyboard/click open all work as before.
- `noResultsLabel` (now a **required** `MantineCombobox` prop) is supplied from i18n (reuse `common.no_results` if it
  exists; otherwise add it in all four locales). Pass `triggerAriaLabel` (localized `property_type`) and, optionally,
  `sheetTitle` (localized `property_type`) for the mobile sheet.
- Zero hardcoded strings; every visible string + aria-label via `t()` with sq/en/uk/it parity.

## 🔴 STOP-AND-ASK #1 — trigger width (resolve BEFORE implementing; do NOT guess)

`MantineCombobox` hardcodes its trigger width to `w={{ base: '100%', sm: 'auto' }}` (content-width on desktop) and
exposes **no** width prop or `className` passthrough. Neither consumer's desktop width can be reproduced from that:
HeroSearch needs desktop **192px** (`sm:w-48`), the form needs desktop **full-width** (`w-full`). A wrapper alone
does NOT fix it — `sm:'auto'` shrinks the trigger below the wrapper on desktop. This is a genuine primitive gap,
first surfaced by this slice.

Present these options to the owner and implement only the chosen one:

- **Option A (RECOMMENDED):** add a minimal, backward-compatible width control to `MantineCombobox` — e.g. an
  optional `triggerWidth?: MantineCombobox['w']` (or `fullWidth?: boolean`) prop that overrides `triggerCommonProps.w`,
  **defaulting to the current `{ base: '100%', sm: 'auto' }`** so no existing behavior changes. `PropertyTypeCombobox`
  then maps its `className` width intent onto it (form → full width; hero → 192px desktop / full `<640`). ~3–5 lines
  in the primitive + a story note + one primitive smoke assertion. This unblocks every later combobox consumer too.
- **Option B:** owner accepts desktop **content-width** (`sm:auto`) for property-type on both surfaces, dropping the
  `sm:w-48` / `w-full` desktop parity (mobile stays full-width either way, clause 11 satisfied). No primitive change.

Whichever is chosen, the **mobile `<640` behavior is non-negotiable full-width** (clause 11) and unaffected.

## Mobile <640 full-width gate (clause 11) — MANDATORY

- The trigger renders **full-width edge-to-edge below 640px** on BOTH surfaces (`MantineCombobox` base `w:'100%'`
  already does this — verify in the render, don't assume).
- The dropdown is a **full-width bottom sheet `<640`** (the primitive's `ResponsiveBottomSheet` path — verify it
  opens as a bottom sheet, ≥44px option rows, drag handle, closes on backdrop + Esc, ≤90dvh scroll).
- Long sq/en/uk/it property-type labels **wrap, never clip**, no horizontal scroll at 320. Touch targets ≥44px.
- Re-confirm with rendered evidence at 320/375/390 × sq/en/uk/it (uk@320/375/390 mandatory) — a chrome/width change
  must not regress the gate.

## TailAdmin conformance gate (clause 16)

No new chrome is authored here — `MantineCombobox` already renders §6d/§6e trigger chrome + §6l dropdown/item chrome
(Task 537, rendered-approved). Verify the migrated `PropertyTypeCombobox` renders that SAME chrome side-by-side with
the primitive's own story (border gray-300, focus brand-300 ring, radius `lg`/8px, shadow-theme-xs, Open Sans, 44px
density). Any divergence = the migration wired something wrong → fix, do not invent a new value.

## Positive + Negative flow (per surface)

**Positive:**
- Hero (showAllOption=true) at `≥640` and `320` × sq/en/uk/it: trigger shows "All types" when `value=''`; opening
  lists all property types + the "All types" row; selecting one fires `onChange(value)` and updates the trigger label;
  desktop width per the resolved STOP-and-ASK, full-width `<640` bottom sheet.
- Form (showAllOption=false, w-full): trigger shows the placeholder when empty; selecting a type calls
  `onPropertyTypeChange`; `errors.property_type` still renders below; full-width at every breakpoint.

**Negative flow (every branch):**
- **(a)** long uk/it labels @320/375/390 — full-width, wrap, NO document h-scroll, nothing clips.
- **(b)** empty value → trigger shows placeholder/"All types" (not a blank/undefined label); no thrown error.
- **(c)** dismiss without selecting (backdrop tap `<640`, Esc, click-away desktop) → value unchanged, sheet/dropdown
  closes, focus returns to trigger; no `onChange` fired.
- **(d)** re-open after a prior selection → fresh dropdown/sheet state (no stale search); selection still works.
- **(e)** form: selecting the empty option is impossible when `showAllOption=false` (no `{value:''}` row) — the
  required-field contract is preserved (`onChange` guarded by `if (v)`).
- **(f)** No regression: `HeroSearch.tsx` / `ListingFormShellView.tsx` diffs are empty; no shared token / semantic
  array / `globals.css` changed; the legacy `Combobox.tsx` and all its OTHER consumers are untouched.

## Regression coverage (clause 15)

- Scan `docs/critical-flow-registry.md`: no "homepage search / property-type filter" row exists. PropertyTypeCombobox
  is an input field of the **Create/Edit listing** flow (registered, Task 442). This slice does NOT change any listing
  action — it swaps the field's internal primitive while preserving `value`/`onChange`. **Baseline the existing
  listing smokes green before AND after** (`npx vitest run src/modules/listings/actions/__tests__/createListing.smoke.test.ts src/modules/listings/actions/__tests__/updateListing.smoke.test.ts`) and record it — no NEW test is required
  because the action contract is untouched, but the baseline must be shown to prove no regression. If Option A adds a
  primitive prop, add ONE `MantineCombobox` smoke assertion that the width override reaches the trigger and defaults
  unchanged when absent (planted-violation: break the default → assertion FAILS).

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — all cells resolved, uk@320/375/390 clean, no document h-scroll, no
  new FAIL. Attach the manifest.
- Planted-violation FAIL transcript for any changed story (revert byte-identical, as Task 548 did).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
  `check:file-integrity` — all green (paste transcripts).
- Listing-form regression baseline (above) green before + after.

## Acceptance criteria

1. `PropertyTypeCombobox` renders via `MantineCombobox` (`variant="button"`, Home icon); the legacy
   `@/components/shared/Combobox` import is gone from this file; its public API is byte-identical (Positive flow, both
   surfaces, verifiable at file:line).
2. STOP-AND-ASK #1 resolved with the owner and implemented literally; the mobile `<640` full-width bottom-sheet is
   preserved regardless (Negative flow (a), file:line + rendered cell).
3. `noResultsLabel` + `triggerAriaLabel` (+ optional `sheetTitle`) supplied from i18n with sq/en/uk/it parity; zero
   hardcoded strings.
4. Both consumers unchanged (empty diff for `HeroSearch.tsx` + `ListingFormShellView.tsx`); no shared token/semantic
   array/`globals.css` change; legacy `Combobox.tsx` and its other consumers untouched (Negative flow (f)).
5. Rendered `--assert` matrix + side-by-side vs the primitive story + planted-violation transcript; all light gates
   green; listing-form smoke baseline green before + after.
6. Session log: Files-Changed table, AC-by-AC self-audit citing BOTH flows by name, `Self-validation: …` line.
   **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) + the
rendered matrix + the STOP-and-ASK resolution, then emits explicit-path commits (composite + primitive [if Option A] +
story + `messages/*.json` + tracker + session log + `docs/backlog.md`). Owner runs them in PowerShell after the native
gate.
