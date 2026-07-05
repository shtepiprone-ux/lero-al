# Task 553 — Phase-2 Slice 3: LocationCombobox → MantineCombobox (consumer migration, FULL incl. add-location sub-flow)

> **Sprint 41 / Epic MM — Phase 2 (shared composites). Owner P0, agent-contract clauses 1–16 + 16a.**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine composite migration (swap a shared composite's internal
> primitive(s) from legacy `@/components/shared/Combobox` to the canonical `MantineCombobox`, preserving the
> composite's own public API 1:1 — plus, this slice only, converting its admin add-location sub-panel to canonical
> Mantine primitives). **Status:** OPEN.
> **Why this task exists:** Slices 1–2 (Tasks 551 PropertyType, 552 Year) migrated the two simplest composites and
> established the recipe (wrapper `<div>` + `triggerWidth`, `portal` documented no-op, i18n `noResultsLabel`, primitive
> smoke + planted-violation, rendered `--assert` matrix). `LocationCombobox` is the LARGEST composite: 11 render sites,
> an `onKeyDown` Enter-to-search passthrough (Hero), and an admin **add-location sub-panel** (raw `<button>` toggle +
> text `Input` + a NESTED region combobox + Add/Cancel with an async persist). The owner has decided this slice does the
> **FULL** migration (main field + sub-flow) and **standardizes the compact filter-bar height to h-11**.

---

## Owner decisions already made (2026-07-05, do NOT re-ask)

1. **Add-location sub-flow scope = FULL migration now.** Migrate the main location field AND the admin add-location
   sub-panel: the nested region combobox → `MantineCombobox variant="button"`; the raw `<button>` toggle, the text
   `Input`, and the Add/Cancel `Button`s → canonical themed Mantine primitives. **Remove the legacy
   `@/components/shared/Combobox` import from `LocationCombobox.tsx` entirely** at the end of this task.
2. **Filter-bar density = standardize to h-11 now.** Drop `size="sm"` for the location field in `ListingsFilterBar`;
   the migrated field renders at the standard `MantineCombobox` h-11 (44px, TailAdmin). Consequently the `size` prop is
   **removed** from `LocationCombobox`'s public API (only `ListingsFilterBar` passed it — see the ONE authorized
   consumer edit below). ⚠️ **Known temporary inconsistency to flag, not fix:** the sibling property-type control in
   `ListingsFilterBar` (`ListingsFilterBar.tsx:68`) is STILL legacy `Combobox variant="button" size="sm"` (h-9); after
   this task the bar will briefly show an h-11 location field next to an h-9 property-type field until that bar's
   property-type control migrates in a later slice. This is expected and owner-accepted — do NOT migrate the bar's
   property-type control here (out of scope), just note it in the session log.

## Pre-read (rule-index → UI/layout/component + Storybook + admin + regression)

- `docs/agent-contract.md` (clauses 1–16 + 16a) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (**scan result, pre-verified by orchestrator:** the main location field feeds the Create/Edit listing form
  (`location_id`, registered flow Task 442) and the search filters (`location_id` URL param — no server action). The
  admin **add-location** sub-panel calls `onAddLocation` → the `addLocation` server action in
  `src/modules/admin/actions/index.ts`; there is **NO** dedicated add-location row in the registry yet. Because this
  task reworks that sub-panel's UI, clause 15 applies: ADD a registry row + an RTL smoke for the sub-panel — see
  "Regression coverage" below. Confirm the scan yourself before closing.)
- 🔴 `docs/tailadmin-style-reference.md` — §6d/§6e (input/Select trigger chrome, incl. **disabled = field+label+icon
  together**), §6l (dropdown item chrome). The `MantineCombobox` primitive already carries this chrome (Task 537); the
  MAIN-field swap adds NO new §6x row. The sub-panel's text `Input` reuses §6e; the Add/Cancel buttons reuse the
  established Button chrome; the "+ add location" text-link toggle → **STOP-AND-ASK #2** if no authoritative chrome row.
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §12 (canonical patterns), §16, §18 (theming vs
  `*-chrome.css`; themed `@mantine/core` `TextInput`/`Button` are the canonical form primitives — NOT a new wrapper).
- `docs/storybook-governance.md` §14 (+ §14.9 loader-allowlist).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`, `docs/ai-behavior.md` → Note 20 (control
  preservation), Note 22 (admin surface) — the sub-panel is an admin control cluster.
- Reuse the Task 551/552 recipe: `docs/sessions/2026-07-05-task552-yearcombobox-mantine-migration.md` +
  `src/components/shared/YearCombobox.tsx` + `src/components/shared/PropertyTypeCombobox.tsx` (wrapper-`<div>` +
  `triggerWidth` + `portal` no-op + `noResultsLabel` pattern you reuse verbatim).

## Scope

**In scope:**
- `src/components/shared/LocationCombobox.tsx` — replace the internal legacy `<Combobox …>` (main field) with
  `<MantineCombobox variant="input" …>`; convert the add-location sub-panel (the nested region `<Combobox
  variant="button">` → `<MantineCombobox variant="button">`; the raw `<button>` toggle, text `<Input>`, and Add/Cancel
  `<Button>`s → canonical themed Mantine primitives). The `@/components/shared/Combobox` import is **removed from this
  file** at completion. Its own public props (`locations`, `value`, `onChange`, `onKeyDown?`, `placeholder?`,
  `className?`, `error?`, `regions?`, `onAddLocation?`, `portal?`) stay byte-identical **except `size` is removed**
  (owner decision 2).
- The `MantineCombobox` primitive to add: an `onKeyDown?` passthrough (STOP-AND-ASK #1). No other primitive prop is
  needed (`error`, `clearLabel`, `description`, `icon`, `variant="input"` already exist; the desktop scroll-cap +
  `inputMode`/`onInputChange` from Task 552 are already in the primitive).
- **ONE authorized consumer edit:** `src/modules/listings/components/ListingsFilterBar.tsx:79-87` — remove `size="sm"`
  from the `LocationCombobox` call (owner decision 2). Nothing else in that file changes; do NOT touch its legacy
  property-type `Combobox` at line 68.
- The `Mantine/Primitives/Combobox` story — add a block demonstrating `onKeyDown` if STOP-AND-ASK #1 adds it.
- Session log + `docs/mantine-tailadmin-migration-tracker.md` (Phase-2 pointer) + `docs/backlog.md` +
  `docs/critical-flow-registry.md` (new add-location row).

**Out of scope (STOP if you find yourself here):**
- The OTHER 10 consumers' call sites MUST NOT change (API preserved) — the ONLY consumer edit allowed is removing
  `size="sm"` in `ListingsFilterBar` (above). `HeroSearch.tsx`, `FiltersPanel.tsx`, `ListingsFilters.tsx`,
  `AdminUserProfile.tsx` (both sites), `AdminUserCreate.tsx`, `ProfileTab.tsx`, `AuthSheet.tsx`,
  `ListingFormShellView.tsx`, `StepLocation.tsx` — empty diff.
- `ListingsFilterBar`'s legacy property-type `Combobox` (line 68) — later slice.
- `PropertyTypeCombobox`, `YearCombobox`, `DatePicker`, `PhoneField`, the legacy `Combobox.tsx` itself, `AdminLocationsManager.tsx`.
- The `addLocation` server action itself, RLS, or any listing/search action/server behavior. Any shared token /
  semantic array / `globals.css`.
- Deleting legacy `Combobox.tsx` (Phase 6, once ALL consumers migrate).

## Current behavior to preserve (EXACT — all 11 render sites + the sub-flow)

`LocationCombobox` today (`src/components/shared/LocationCombobox.tsx`) renders a legacy `<Combobox>` (default
`variant="input"`, searchable) with a `MapPin` icon, `clearLabel = tc('all_locations')`, options built from
`locations` with a bi-directional-search `description` (type + alternate-language name via `resolveLocationLabel` +
`normalizeSearch`), `value`, `onChange(v => onChange(v || null))`, and passthroughs `placeholder`, `portal` (default
false), `error`, `size`, `onKeyDown`. The `resolveLocationLabel` + `options` `useMemo` + `capitalize`/`normalizeSearch`
logic MUST stay byte-identical (it is data-binding, not primitive chrome).

The 11 render sites (all MUST render + behave identically after migration, except the ONE `size` removal):

1. **`components/shared/HeroSearch.tsx:111`** — `locations`, `value`, `onChange`, **`onKeyDown={handleKeyDown}`**
   (`handleKeyDown` = Enter → `handleSearch()` → `router.push(/listings?…)`), `placeholder`, `className="flex-1"`.
   → the Enter-to-search passthrough is load-bearing (STOP-AND-ASK #1).
2. **`components/shared/FiltersPanel.tsx:99`** — `locations`, `value`, `onChange`, **`portal`**. Inside the advanced
   filters slide-over.
3. **`modules/listings/components/ListingsFilters.tsx:126`** — `locations`, `value`, `onChange`, **`portal`**. Inside
   a legacy `Sheet` + `AccordionSection` (overflow container).
4. **`modules/listings/components/ListingsFilterBar.tsx:79`** — `locations`, `value`, `onChange`, `placeholder`,
   ~~`size="sm"`~~ **(remove — owner decision 2)**, `className="w-52 shrink-0"`, **`portal`**. Desktop `md+` bar.
5. **`components/admin/AdminUserProfile.tsx:934`** — location-request approve: `locations`, `value=""`, `onChange`
   (approves on select), `placeholder`. NO sub-panel here (no `regions`/`onAddLocation`).
6. **`components/admin/AdminUserProfile.tsx:1037`** — edit city WITH sub-panel: `locations`, `value`, `onChange`,
   **`error`**, `placeholder`, **`regions={isAdmin ? regions : undefined}`**, **`onAddLocation={isAdmin ? addLocation : undefined}`**.
7. **`components/admin/AdminUserCreate.tsx:276`** — WITH sub-panel: `locations`, `value`, `onChange`, **`error`**,
   `placeholder`, **`regions`**, **`onAddLocation`**.
8. **`modules/cabinet/components/ProfileTab.tsx:314`** — `locations`, `value`, `onChange`, **`portal`**.
9. **`modules/auth/components/AuthSheet.tsx:306`** — `locations`, `value`, `onChange`, `placeholder`, **`portal`**.
10. **`modules/listings/components/ListingFormShellView.tsx:285`** — `locations`, `value`, `onChange`, `placeholder`.
11. **`modules/listings/components/steps/StepLocation.tsx:28`** — `locations`, `value`, `onChange`, `placeholder`.

**Add-location sub-panel (today, sites 6 & 7 only — `canAdd = regions?.length>0 && onAddLocation`):**
- A raw `<button className="text-xs text-primary hover:underline w-fit mt-1">+ {tc('add_location')}</button>` toggles
  `showAdd`.
- When open: a `<div className="border rounded-xl p-3 flex flex-col gap-2 bg-muted/30 mt-1">` panel containing: a
  `<p>{tc('new_location')}</p>` title; a text `<Input>` bound to `addName` (`tc('location_name_hint')` placeholder);
  a nested `<Combobox variant="button" size="sm">` of `regions` bound to `addRegionId`; an Add `<Button>` (disabled
  until `addName.trim() && addRegionId`, shows `<Loader2 spin>` while `adding`) and a Cancel `<Button variant="ghost">`.
- `handleAdd`: guards `addName.trim() && addRegionId && onAddLocation`; sets `adding`; `await onAddLocation({name_al,
  region_id})`; on `result.id` → `onChange(String(result.id))`, close panel, reset `addName`/`addRegionId`; on error
  (no `result.id`) → panel STAYS open, `adding=false` (the raw error is currently swallowed — see Negative flow (h)).

## Required after-behavior

- `LocationCombobox` internally renders `<MantineCombobox variant="input" icon={<MapPin …/>} …>` (main field) and
  imports ONLY from `@/design-system/mantine/patterns` (+ `@mantine/core` for the sub-panel primitives) — the
  `@/components/shared/Combobox` import is **gone**. Reuse the Task 551/552 recipe: wrap `<MantineCombobox>` in the
  SAME width-bearing `<div className={cn('location-combobox', className)}>`, pass `triggerWidth={{base:'100%',sm:'100%'}}`,
  `clearLabel={tc('all_locations')}`, `noResultsLabel={tc('no_results')}` (exists, 4-locale parity), `error={error}`,
  `triggerAriaLabel`/`sheetTitle` from the localized `placeholder` (reuse — like 552, no new key). `onChange` adapter
  `v => onChange(v || null)` unchanged. The `options`/`description` `useMemo` unchanged.
- `portal` stays on the public API as a **documented no-op** (Task 552 pattern — Mantine always portals; kept so sites
  2/3/4/8/9 stay byte-identical); NOT destructured/forwarded to `MantineCombobox`. **Mandatory rendered proof** the
  dropdown/sheet is un-clipped in BOTH overflow surfaces (`FiltersPanel` slide-over AND `ListingsFilters`
  Sheet+accordion) at desktop + `<640` (same as Task 552 STOP-AND-ASK #2 — reuse that method).
- `size` prop removed from `Props`; `ListingsFilterBar` no longer passes it (the ONE authorized consumer edit).
- The add-location sub-panel renders with canonical themed Mantine primitives (nested region combobox = `MantineCombobox
  variant="button"` with `noResultsLabel` + `triggerAriaLabel` from i18n — reuse an existing region/`common` key or
  STOP-AND-ASK if none; text field = themed `@mantine/core` `TextInput`; Add/Cancel = themed `@mantine/core` `Button`;
  toggle = STOP-AND-ASK #2). ALL its behavior (toggle, disabled-until-valid, async add, success reset, error handling)
  is preserved AND improved per Negative flow (h). Sub-panel is admin-only (`canAdd`), unchanged gating.
- Mobile `<640`: main trigger full-width edge-to-edge; dropdown = full-width bottom sheet with search (drag handle,
  ≥44px rows, ≤90dvh, backdrop+Esc close). Sub-panel controls each full-width at `<640` (clause 11).

## 🔴 STOP-AND-ASK #1 — `onKeyDown` Enter-to-search passthrough (resolve BEFORE implementing; do NOT guess)

`MantineCombobox` (`variant="input"`) today wires the desktop trigger's `onChange`/`onClick`/`onFocus`/`onBlur` but
exposes **no** `onKeyDown`. `HeroSearch` passes `onKeyDown={handleKeyDown}` so pressing **Enter** in the location field
runs the search (`router.push(/listings?…)`). Mantine's `Combobox`, however, treats Enter as "submit the highlighted
option" (`onOptionSubmit`). So there is a genuine conflict: Enter-selects-highlighted-option vs. Enter-runs-search.

- **Option A (RECOMMENDED):** add `onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>` to `MantineCombobox`,
  threaded onto the desktop `variant="input"` trigger `<TextInput>` (after the primitive's own handling). Default
  `undefined` → byte-identical to today. **Prove BOTH behaviors on Hero via rendered/interaction evidence:** (1) Enter
  with NO option highlighted / free text → the consumer's `handleKeyDown` runs the search; (2) Enter WITH an option
  highlighted → confirm the resulting behavior is acceptable (either it selects then the consumer handler runs search,
  or document the exact resolution). If the two handlers fight (double-navigation, or search swallowed), STOP and ask
  the owner how to disambiguate (e.g. only forward `onKeyDown` when the dropdown is closed / no active option).
- **Option B:** owner accepts that on mobile the sheet has no Enter-to-search (trigger is readOnly, opens the sheet) —
  desktop-only passthrough is fine; do NOT thread `onKeyDown` to the mobile sheet's search field (pressing Enter there
  should filter/commit a location, not navigate away mid-selection). **Default assumption unless owner says otherwise:
  desktop trigger only.**

## 🔴 STOP-AND-ASK #2 — the "+ add location" text-link toggle chrome (resolve BEFORE implementing; do NOT guess)

The current toggle is a raw `<button className="text-xs text-primary hover:underline">`. Converting it to Mantine needs
a canonical text-link affordance. There is no `<button>` allowed (clause 13 / ui-rules). Options:
- **Option A (RECOMMENDED):** Mantine `Anchor` (component=`button`) or `Button variant="subtle" size="compact-xs"` with
  brand color + underline-on-hover, IF an authoritative §6x chrome row already covers a text-link/subtle-button. Cite
  the §-row.
- **Option B:** if no authoritative row exists for a text-link toggle, **EXTRACT one from `demo_tailadmin_com.zip`
  into a new `tailadmin-style-reference.md §6x` row FIRST** (clause 16), then implement. Do NOT invent the chrome.
STOP and confirm which, with the cited/extracted §-row, before styling it.

## Mobile <640 full-width gate (clause 11) — MANDATORY

- Main trigger full-width edge-to-edge `<640` on all 11 surfaces (`triggerWidth={{base:'100%',sm:'100%'}}` + base
  `w:'100%'` — verify in the render). Dropdown = full-width bottom sheet `<640` (search field, ≥44px rows, drag handle,
  ≤90dvh, backdrop+Esc close).
- Sub-panel `<640`: the text `TextInput`, the region `MantineCombobox` trigger, and the Add/Cancel buttons each go
  **full-width** (`max-sm:w-full`; buttons stack, ≥44px). The panel must not h-scroll at 320; long sq/en/uk/it labels
  wrap. Re-confirm with rendered evidence at 320/375/390 × sq/en/uk/it (**uk@320/375/390 mandatory**).

## TailAdmin conformance gate (clause 16)

- Main field + region combobox already carry §6d/§6e trigger + §6l item chrome (Task 537) — verify the migrated
  render matches side-by-side with the `Mantine/Primitives/Combobox` story (border gray-300, focus brand-300 ring,
  radius `lg`/8px, shadow-theme-xs, Open Sans, 44px). The text `TextInput` reuses §6e; verify disabled = field+label+icon
  dim together (clause per §6e). Add/Cancel buttons match the established Button chrome. Any divergence = wiring bug →
  fix, do not invent a value.

## Positive + Negative flow

**Positive:**
- **Main field (all sites):** empty → placeholder / `all_locations` clear row; typing filters bi-directionally
  (sq↔en via `description`); selecting a city commits `onChange(id)`; clear row → `onChange(null)`. Form sites
  round-trip `location_id`; filter sites update the URL param; Hero Enter runs the search (STOP-AND-ASK #1).
- **Admin sub-panel (sites 6 & 7):** click "+ add location" → panel opens; type a city name; pick a region; Add
  (enabled only when both set) → `onAddLocation({name_al, region_id})`; on success → the new city is selected
  (`onChange(newId)`), panel closes + resets. `≥640` and `320` × sq/en/uk/it.

**Negative flow (every branch — verifiable handler/guard/toast/early-return in the diff):**
- **(a)** long city labels wrap, no clip/overflow at 320.
- **(b)** no-results while typing → `noResultsLabel` row (desktop + sheet).
- **(c)** dismiss without selecting (backdrop `<640`, Esc, click-away desktop) → value unchanged; focus returns to trigger.
- **(d)** re-open after a prior selection → fresh search state.
- **(e)** clear selection → `onChange(null)`; each of the 11 sites' `onChange` adapter receives `null`/`undefined` correctly.
- **(f)** portal/clip: `FiltersPanel` + `ListingsFilters` dropdowns un-clipped (STOP-AND-ASK proof).
- **(g)** Hero Enter-to-search behaves per STOP-AND-ASK #1 (no double-nav, search not swallowed).
- **(h)** sub-panel add FAILS (`onAddLocation` returns `{error}` / no `id`): panel STAYS open, `adding` resets, and —
  **improvement required, not the current silent swallow** — surface the error to the user (inline message or the
  canonical toast with a localized key; if a suitable key/pattern is missing, STOP and confirm the key). Disabled-until-valid
  guard on Add (empty name or no region) holds. Double-submit guard: Add disabled while `adding`.
- **(i)** sub-panel Cancel → panel closes, `addName`/`addRegionId` reset, no persist.
- **(j)** No regression: the 10 non-authorized consumer diffs are empty; `ListingsFilterBar` diff = ONLY the `size="sm"`
  removal; no shared token / semantic array / `globals.css` changed; legacy `Combobox.tsx` + its OTHER consumers untouched.

## Regression coverage (clause 15) — MANDATORY (this slice reworks an admin write-path UI)

- Scan `docs/critical-flow-registry.md`: no add-location row exists. **ADD one** (admin add-location sub-panel →
  `addLocation` action): route/surface (`AdminUserProfile`/`AdminUserCreate` city field), happy path (Add →
  `onAddLocation({name_al, region_id})` → success selects new id + closes), failure path (`{error}`/no id → panel stays
  + error surfaced), the required RTL smoke, and the command.
- **Add an RTL smoke** for the migrated sub-panel (`LocationCombobox` with `regions` + a mocked `onAddLocation`):
  toggle opens the panel; Add disabled until name+region set; Add calls `onAddLocation` with the exact `{name_al,
  region_id}`; success → `onChange(newId)` + panel closes; failure → panel stays + error shown; Cancel resets. Include
  a **planted-violation** (e.g. drop the disabled-until-valid guard, or the success `onChange`) → the relevant
  assertion FAILS; revert byte-identical.
- **Baseline the listing-form smokes green before AND after** (`npx vitest run
  src/modules/listings/actions/__tests__/createListing.smoke.test.ts
  src/modules/listings/actions/__tests__/updateListing.smoke.test.ts`) — the `location_id` field's action contract is
  untouched; record the baseline (no NEW action test needed for the main field).
- If STOP-AND-ASK #1 adds `onKeyDown`, add a `MantineCombobox` primitive smoke: `onKeyDown` reaches the desktop trigger
  input (+ planted-violation).

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — all cells resolved, uk@320/375/390 clean, no document h-scroll,
  **ZERO new FAIL and ZERO new AMBIGUOUS** vs the current 462/480 baseline. Attach the manifest.
- Planted-violation FAIL transcript for any changed story (revert byte-identical).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
  `check:file-integrity` — all green (paste transcripts).
- New sub-panel RTL smoke + (if added) `onKeyDown` primitive smoke green + planted-violations; listing-form baseline
  green before + after.

## Acceptance criteria

1. `LocationCombobox`'s main field renders via `MantineCombobox` (`variant="input"`, MapPin icon); the legacy
   `@/components/shared/Combobox` import is **gone from the file**; public API byte-identical **except `size` removed**
   (Positive flow, all 11 sites, verifiable at file:line; `options`/`resolveLocationLabel` `useMemo` unchanged).
2. STOP-AND-ASK #1 (`onKeyDown` Enter-to-search) resolved with the owner + implemented; Hero Enter still runs the
   search with rendered/interaction proof of both branches (Negative flow (g)).
3. STOP-AND-ASK #2 (toggle chrome) resolved with a cited/extracted §-row; zero raw `<button>`; zero invented chrome.
4. Add-location sub-panel fully migrated to canonical Mantine primitives (nested region `MantineCombobox
   variant="button"` + themed `TextInput` + themed Add/Cancel `Button`s); ALL behavior preserved AND the add-failure
   path now surfaces the error (Negative flow (h)/(i)); admin-only gating unchanged.
5. `noResultsLabel`/`triggerAriaLabel`/`sheetTitle` (main + region) from i18n with sq/en/uk/it parity; zero hardcoded
   strings; any new key added in all four locales (confirm the exact key with the owner if none is reusable).
6. `portal` = documented no-op; both filter pairs proven un-clipped at desktop + `<640` (Negative flow (f)).
7. The ONE authorized consumer edit (`ListingsFilterBar` `size="sm"` removal) is the ONLY consumer change; the other 10
   consumers have empty diffs; no shared token/semantic array/`globals.css`; legacy `Combobox.tsx` + other consumers
   untouched (Negative flow (j)); the temporary h-11-vs-h-9 bar inconsistency noted in the session log.
8. Clause 15: new `critical-flow-registry.md` add-location row + RTL sub-panel smoke (with planted-violation);
   listing-form baseline green before + after.
9. Rendered `--assert` matrix (uk@320/375/390) + side-by-side vs the primitive story + all light gates green.
10. Session log: Files-Changed table, AC-by-AC self-audit citing BOTH flows by name, `Self-validation: …` line.
    **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) + the
rendered matrix + BOTH STOP-and-ASK resolutions + the sub-panel RTL smoke, then emits explicit-path commits (composite +
primitive [if Option A] + story + `ListingsFilterBar` + `messages/*.json` [if a key added] + `critical-flow-registry` +
sub-panel test + tracker + session log + `docs/backlog.md`). Owner runs them in PowerShell after the native gate.

## Scope-expansion trail

(Reserved — if a genuine primitive gap surfaces mid-execution while proving the mandatory rendered proofs, as happened
in Task 552 with the desktop scroll cap: flag it to the owner BEFORE fixing, record the finding→ruling→verification
chain here, and keep the session log's Files-Changed table + AC audit consistent with it.)
