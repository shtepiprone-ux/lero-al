# Task 778 — `/listings`: `ListingsFilters` → Mantine, hosted by the canonical `MantineDrawer`

**Sprint:** 68 — `/listings` leaves Tailwind, one surface at a time
**Priority:** P2 · **QA profile:** **Q3 Full Visual Matrix**
**Filed:** 2026-09-01 · **State:** `KICKOFF FILED`
**Kickoff path:** `tasks/Sprints/Sprint_68_kickoff_prompt_Task_778_ListingsFilters_Mantine_Drawer.md`

---

## 1. Mode and task type

`TASK DESIGN` → implementation handoff.
Task type: **UI / Layout / Component — mixed migration** (current Mantine path for `ListingsFilters.tsx` and the
drawer host; legacy shadcn/Tailwind path stays valid for the rest of `ListingsShellView.tsx`). Secondary bundle:
**Storybook / Visual Proof** and **Regression / Critical Flow Coverage** (`ListingsFilters.tsx` is a named consumer in
two `docs/critical-flow-registry.md` rows — see §3.7).

---

## 2. Objective

Migrate `src/modules/listings/components/ListingsFilters.tsx` off shadcn `Button`/`Input`, `cn()` and Tailwind
utility strings onto Mantine primitives, and replace its legacy host overlay — the shadcn `Sheet`/`SheetContent`
in `ListingsShellView.tsx:82-86` — with the canonical `MantineDrawer`, driven by the same `filtersOpen` state.

Prove the migrated component with a new canonical story `Patterns/Mantine/ListingsFilters` that statically imports
the **real** production component and mounts it inside the **real** `MantineDrawer`, and enrol
`ListingsFilters.tsx` in `scripts/mantine-migration-scope.json` in the same PR.

The filter URL contract, the section visibility engine, the accordion's local UI state, the SSR query,
`listings_restore`, favourites and currency behaviour must all be unchanged.

---

## 3. Verified context

Every fact below was read from the working tree in the task-design session on **2026-09-01**, at a **clean
worktree** (`git --no-optional-locks status --short` → empty output; branch `main`; no `.git/index.lock`).
`FACT` = read directly. `INFERENCE` = derived from named facts. Nothing here is carried from a prior session.

### 3.1 Pre-edit census — the five named files

| File | Lines | `className=` | `cn(` | `<Button` | `<Input` | Notes |
|---|---:|---:|---:|---:|---:|---|
| `src/modules/listings/components/ListingsFilters.tsx` | **367** | **27** | **4** | **8** | **1** | 18 `<AccordionSection` uses · 12 `shows(` guards · 12 `updateParams(` calls · 7 `toggleMulti(` calls |
| `src/modules/listings/components/ListingsShell.tsx` | **189** | **2** | 0 | 0 | **1 — comment only** | Both `className=` are at **:15** and **:16**, inside the `dynamic()` `loading:` fallback. The single `<Input` hit is the prose comment at **:8** (`// ListingsFilters renders <Input> elements…`), **not** JSX — recorded explicitly so no requirement is written against a phantom element. |
| `src/modules/listings/components/ListingsShellView.tsx` | **168** | **14** | 0 | **1** | 0 | 13 string literals + 1 expression (`:123`, the grid/list class ternary). Exactly **one** — `:83`, the `SheetContent` — is in this task's scope; the `<Button` at `:145` is the "show more" control and stays legacy. |
| `src/modules/listings/hooks/useListingsUrlFilters.ts` | **138** | 0 | 0 | 0 | 0 | **Zero-diff file.** Read for contract, never edited. |
| `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | **338** | — | — | — | — | 3 `FiltersPanel` + 3 `ListingsFilters` (Task 559) + 1 `FiltersPanel` month-selector containment test (Task 773) = **7 tests**. |

`FACT`. Counts are literal `grep -o | wc -l` over the current files; the two disambiguations above
(`ListingsShell.tsx`'s comment-only `<Input`, `ListingsShellView.tsx`'s 13-literal + 1-expression split) are
stated because a bare number would have been the crude-census failure mode named in
`docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes".

### 3.2 `ListingsFilters.tsx` — what it actually is

- `FACT` `'use client'`; props `{ locations, className?, onClose? }` (`:21`).
- `FACT` A file-local `AccordionSection` helper (`:23-44`) — shadcn `Button variant="ghost"` toggle carrying
  `flex w-full items-center justify-between select-none min-h-11 h-auto rounded-none px-0 hover:bg-transparent group`,
  a `<span>` label (`text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary`),
  a lucide `ChevronDown` rotated by `cn(..., open && 'rotate-180')`, and **`{open && <div className="mt-3">{children}</div>}`**
  at `:41` — the body is **conditionally mounted**, not merely hidden.
- `FACT` All state comes from `useListingsUrlFilters()` (`:50-60`). The component owns **no** state of its own.
- `FACT` Header (`:67-80`): lucide `SlidersHorizontal`, `t('filters_title')`, a count pill
  (`text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium`) rendered only when
  `activeCount > 0`, and — only when `onClose` is supplied — a `Button variant="ghost" size="icon-xl"` `X` with
  `className="ml-auto lg:hidden"` and `aria-label={tc('close')}`.
- `FACT` Mobile apply (`:359-364`): `Button size="xl" className="lg:hidden mt-4"` whose entire handler is
  `onClick={onClose}`. It commits nothing — every filter already wrote to the URL on change.
- `FACT` Leaf controls consumed and **already Mantine**: `LocationCombobox`, `YearCombobox`, `RangeDatePicker`,
  `FilterRangeInputs`, `FilterMultiToggle`, `FilterRoomsRow`.
- `FACT` The **only** Tailwind utility string this file passes into a leaf is the literal `"flex-col gap-1.5"` on
  `FilterMultiToggle` at **:243**, **:316** and **:330** (3 call sites: condition, offer_type, purchase_conditions).
  See §3.6 — this is the one unavoidable leaf-API change.

### 3.3 `useListingsUrlFilters.ts` — the contract this task must not move

- `FACT` `updateParams(updates)` (`:55-66`): clones the current `searchParams`, **deletes `page`**, then for each
  entry deletes the key on `null`/`''` and sets it otherwise, and issues **one** `router.push`. Every other query
  param survives. This is the "immediate, preserves others, resets only `page`" contract.
- `FACT` `handlePropertyTypeChange(pt)` (`:80-92`) is a **separate** path: it deletes `page`, sets/deletes
  `property_type`, then deletes **every param of every section not in the new type's `visibleSections`**
  (`FILTER_SECTION_PARAMS`), and pushes once.
- `FACT` `toggleMulti(key, value)` (`:68-72`) removes only the toggled value from the CSV and re-joins;
  an empty result becomes `null`, which `updateParams` deletes.
- `FACT` `sections` / `toggle` (`:42-44`) are **local `useState` only** — the comment at `:41` says so and no
  section key is ever written to the URL.
- `FACT` `getFilterVisibility(undefined)` returns `ALL_FILTER_SECTIONS`
  (`src/modules/listings/domain/filterEngine.ts:365-367`) — with no `property_type` in the URL, every section is
  visible.
- `FACT` `currency = get('currency') || 'ALL'` (`:108`); the exchange-rate note in `ListingsFilters.tsx:182-187`
  renders only when `currency !== 'ALL' && rate != null`.

### 3.4 The legacy host overlay — measured, not described

`ListingsShellView.tsx:82-86`:

```tsx
<Sheet open={filtersOpen} onOpenChange={onFiltersOpenChange}>
  <SheetContent side="left" showCloseButton={false} className="w-80 max-w-[90vw] overflow-y-auto p-5">
    {filtersSlot}
  </SheetContent>
</Sheet>
```

- `FACT` `showCloseButton={false}` — read at `:83`. `src/components/ui/sheet.tsx:69-70` renders the close row only
  when `showCloseButton` is true, so **the legacy desktop drawer has no close control at all**; dismissal is
  backdrop / Esc only.
- `FACT` `sheet.tsx:58` gives `side="left"` the base `w-3/4` and `data-[side=left]:sm:max-w-sm` (384px). The
  consumer's `w-80` (320px) wins the width via `tailwind-merge`; `max-w-[90vw]` applies at every width and
  `sm:max-w-sm` still applies at ≥640. `INFERENCE` from those three facts: effective width is **320px at ≥640px**
  and **90vw below 640px** (288px at a 320px viewport).
- `FACT` Overlay is `bg-black/10` + `supports-backdrop-filter:backdrop-blur-xs` (`sheet.tsx:32`); content padding
  is the consumer's `p-5` (20px).

### 3.5 The canonical replacement — `MantineDrawer`, read at source

`src/design-system/mantine/patterns/MantineDrawer.tsx`:

- `FACT` Props are exactly `{ opened, onClose, title?, children, footer?, side?, size? }` (`:7-22`).
  **There is no `withCloseButton` prop.** The desktop branch (`:137-158`) renders a bare Mantine `Drawer`, whose
  `withCloseButton` defaults to `true` — so the desktop close control **cannot be suppressed** from the consumer.
- `FACT` Below 640px it returns `ResponsiveBottomSheet` (`:125-135`).
  `responsiveBottomSheet.tsx:133` sets **`withCloseButton={false}`** — the mobile form has a centred `DragHandle`
  and backdrop/Esc dismissal, and **no** close X.
- `FACT` Body scroll region padding is hard-coded `contentPadding="var(--mantine-spacing-md)"` (`:155`) = **16px**.
  There is no prop to change it.
- `FACT` `node_modules/@mantine/core/styles.css:4212` — `--drawer-size-xs: calc(20rem * var(--mantine-scale))`.
  At the default scale that is **exactly 320px**, i.e. `size="xs"` reproduces the legacy `w-80` **as a token**,
  with no raw value. `--drawer-size-md` (the component default) is 27.5rem = 440px.
- `FACT` `styles.css:4229` gives `.mantine-Drawer-content` `max-width: calc(100% - offset*2)`; with `offset: 0rem`
  that is 100%. `INFERENCE`: at ≥640px, 320px is always below both that cap and the legacy `min(384px, 90vw)`,
  so the desktop width is byte-identical at 320px.

### 3.6 The one unavoidable leaf-API change — `FilterMultiToggle`

- `FACT` `src/components/shared/FilterMultiToggle.tsx:22` derives its layout from a **string sniff**:
  `const vertical = className?.includes('flex-col') ?? false`, then renders Mantine `Stack gap={6}` or
  `Group gap="xs" wrap="wrap"`, passing `className` straight through in both branches (`:37`, `:44`).
- `INFERENCE`, and the reason this is in scope: `ListingsFilters.tsx` cannot satisfy "no Tailwind utility strings"
  while the **only** way to request the vertical layout is to pass the literal `"flex-col gap-1.5"`. The two are
  mutually exclusive. This is exactly the compatible leaf change the owner pre-authorised.
- `FACT` `src/stories/mantine/primitives/FilterControls.stories.tsx:105-119` exercises the vertical branch
  **through the `className` path** and names those 3 `ListingsFilters.tsx` call sites in its comment. Any change
  must therefore keep the `className` path working, not replace it.
- `FACT` Mantine `Stack` already sets `flex-direction: column`, and `gap={6}` is 6px — the same value Tailwind
  `gap-1.5` (0.375rem) produces. `INFERENCE`: dropping the two utilities from the vertical branch's wrapper is
  expected to be a zero-pixel change, **but that must be measured, not assumed** (AC9).

### 3.7 Critical-flow registry — this surface is registered twice

- `FACT` `docs/critical-flow-registry.md:54` — **"Listings date-range filter"** names
  `src/modules/listings/components/ListingsFilters.tsx` as one of the two `RangeDatePicker` consumers, and its
  evidence command includes `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx`.
- `FACT` `docs/critical-flow-registry.md:55` — **"Listings filter controls — leaf sub-components + shell (Mantine)"**
  records that `ListingsFilters.tsx` composes the 3 leaf components directly, and carries the Task 567 precedent
  quoted in §10.2.
- `FACT` Same row, Task 675 entry: *"R13 to `NOT VERIFIABLE` (the Storybook fixture renders raw English enum labels
  in every locale via `usePropertyTypes()`'s `buildFallback()`, never the real `messages/*.json` labels — **Task 679
  reserved**)"*. This is a **known, tracked, out-of-scope** condition that the new story will inherit — see §5 A3.

### 3.8 Storybook mechanics — verified at source, not assumed

- `FACT` `scripts/lib/mantine-story-scope.mjs:15` — a title starting `Patterns/Mantine/` **is** the canonical-Mantine
  assertion consumed by `check-stories-rendered.mjs`, `check-locale-leak.mjs` and `check-story-coverage.mjs`.
- `FACT` `scripts/check-story-coverage.mjs` (header, and `MANIFEST_PATH` at `:52`): a component listed in
  `scripts/mantine-migration-scope.json` **must** be **statically imported** by ≥1 canonical Mantine story, or the
  gate fails. A component not in the manifest is never checked.
- `FACT` `scripts/check-stories-rendered.mjs:395-400` — `MANTINE_VIEWPORTS` is exactly
  `mobile-320 / mobile-375 / mobile-390 / desktop-1024`; `:115` — `LOCALES = ['sq','en','uk','it']`;
  `:420-457` — `MANTINE_STORY_EXTRA_VIEWPORTS` has **no** `ListingsFilters` entry, and this task adds none.
  `:466-487` — **every** story export under the prefix is discovered, not just the first.
  `INFERENCE`: **one** exported story ⇒ exactly **16** new cells (4 viewports × 4 locales).
- `FACT` `:359-387` — `MANTINE_OVERLAY_PRIMITIVES` does **not** contain `ListingsFilters`, so `openTrigger` is
  `false` and the harness will **not** click anything open. The story must render the drawer already `opened`,
  exactly as `Mantine/Primitives/FiltersPanelShell` does for the same reason (its own header comment says so).
- `FACT` `node_modules/@storybook/nextjs-vite/dist/_browser-chunks/chunk-4ZRKYE2G.js` — `RouterDecorator` spreads
  `parameters.nextjs?.navigation` into `AppRouterProvider`'s `routeParams`, and `AppRouterProvider` mounts
  `SearchParamsContext.Provider value={new URLSearchParams(query)}`. `.storybook/preview.tsx:228-230` already sets
  `nextjs: { appDirectory: true }` globally. `INFERENCE`: `parameters.nextjs.navigation.query` is the supported,
  in-tree mechanism for giving `useSearchParams()` a fixed value in a story. **No story in this repo uses it yet** —
  `grep -rn "nextjs:" src --include=*.stories.tsx` returns nothing. It is therefore a **checkpoint**, not an
  assumption: see §13 step V2 for its explicit failure behaviour.
- `FACT` `scripts/check-locale-leak.mjs` global allowlist ends with `/^\.|^[a-z]/` — any token beginning with a
  lowercase letter is allowlisted. `INFERENCE`: the raw `buildFallback()` enum labels (`apartment`, `house`, …)
  cannot trip this gate, which is why `Mantine/Primitives/FiltersPanelShell` renders the same fallback today and
  the gate is green.
- `FACT` `scripts/check-stories.mjs` forbids `layout:'centered'|'padded'` (`:182-188`) and raw
  `<button>/<input>/<select>/<textarea>` in stories (`:209-228`), and enforces `storybook.*` key parity across all
  four `messages/*.json` (`:405-428`).
- `FACT` `messages/{sq,en,uk,it}.json` all carry `storybook.mantine.combobox_option_tirana` and
  `…_durres` — the fixture keys `FiltersPanelShell` already uses.

### 3.9 Sprint 68 precondition — stale, and corrected by this task

- `FACT` `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` → "Preconditions", third
  bullet, still reads: *"Storybook builds (`npm run build-storybook`) and `npm run screenshots:assert -- --mantine-only`
  are green **before** the first slice edits anything. A gate already red at baseline blocks the slice."*
- `FACT` `docs/backlog.md` → Sprints → Sprint 68 records: *"**D68-2** (owner, 2026-09-01) now binds every later slice:
  rendered acceptance is differential (`P \ B = ∅` plus zero findings on the new cells), never a global green exit —
  ⚠️ this sprint's own **Preconditions paragraph still demands the unattainable global green** and is the next
  slice's first blocker."*
- `CONFLICT`, resolved by the owner instruction that filed this task: the plan file's precondition is superseded by
  **D68-2** and is corrected in the same edit as this kickoff (§16). Task 778 does not execute against the old text.

---

## 4. Requirements — ledger

| ID | Source | Observable requirement | Pri | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Owner | `ListingsFilters.tsx` renders through Mantine primitives only: no `@/components/ui/button`, no `@/components/ui/input`, no `cn`, no Tailwind utility string, no local CSS module. | P0 | `grep` census in §13 S1 + `git diff` | Confirmed |
| **R2** | Owner | All 18 accordion sections stay controlled by the hook's local `sections`/`toggle` state; **no section key reaches the URL**. | P0 | AC2 + `filtersRangeDatePicker` suite | Confirmed |
| **R3** | Owner · §3.3 | Every filter change stays an immediate single `updateParams` call: other query params preserved, only `page` reset. | P0 | AC3 + new URL-contract test | Confirmed |
| **R4** | Owner · §3.3 | Property-type change still drops inapplicable dependent params; multi-select removal drops only the deselected value. | P0 | AC4 + new tests | Confirmed |
| **R5** | Owner · §3.3 | `RangeDatePicker` stays atomic — `date_from` + `date_to` in **one** URL update. | P0 | AC5 + existing Task 559 tests 5 and 6 | Confirmed |
| **R6** | Owner · §3.2 | Mobile Apply only closes the panel. No batch/draft/apply state is introduced anywhere. | P0 | AC6 + source inspection | Confirmed |
| **R7** | Owner · §3.4-3.5 | `ListingsShellView.tsx` hosts the panel in `MantineDrawer`, same `filtersOpen` state, desktop `side="left"`, `size="xs"` (= 20rem = 320px, §3.5). Legacy `Sheet`/`SheetContent` import removed. | P0 | AC7 + AC8 | Confirmed |
| **R8** | Owner · §3.5 | Below 640px the canonical bottom sheet renders (`ResponsiveBottomSheet` branch). | P0 | AC8 + the 320/375/390 story cells | Confirmed |
| **R9** | Owner · §3.1 | `ListingsShell.tsx` keeps `dynamic(..., { ssr: false })` for `ListingsFilters`; its `loading:` fallback stops importing `@/components/ui/skeleton` and carries no Tailwind utility string. | P1 | AC10 + `grep` | Confirmed |
| **R10** | Owner · §3.8 | New story `src/stories/patterns/mantine/ListingsFilters.stories.tsx`, title `Patterns/Mantine/ListingsFilters`, **statically** importing the real `ListingsFilters` and mounting it in the real `MantineDrawer`, `opened`, with fixed fixtures. | P0 | AC11 + `check:story-coverage` | Confirmed |
| **R11** | Owner · §3.8 | `src/modules/listings/components/ListingsFilters.tsx` added to `scripts/mantine-migration-scope.json`. `ListingsShellView.tsx` and `ListingsShell.tsx` are **not** added. | P0 | AC12 + `check:story-coverage` | Confirmed |
| **R12** | Owner · §3.6 | The vertical-layout request leaves `ListingsFilters` as an explicit `FilterMultiToggle` prop, not a Tailwind string. The legacy `className` path keeps working for `FilterControls.stories.tsx`. | P1 | AC9 + new leaf test | Confirmed |
| **R13** | Owner · §3.4-3.5 | The close-affordance change is recorded as a real canonical change, never as a zero-delta claim. | P0 | AC13 + §10.3 | Confirmed |
| **R14** | D68-2 | Rendered acceptance is **differential**: clean pre-edit baseline **B**, post-edit **P**, `P \ B = ∅`, and all 16 new cells PASS. Pre-existing global FAIL/AMBIGUOUS are **not** blockers. | P0 | §13 S2/V6 | Confirmed |
| **R15** | Sprint 68 D775-A/B/C | The migrated file consumes **Mantine tokens only** — no raw px/rem, no `design-tokens-allow:` marker, no `--space-*`/Tailwind var, no 1536. | P0 | `check:design-tokens:strict` + `governance:tailwind` | Confirmed |
| **R16** | Sprint 68 exit 3 | Zero diff to the filter URL contract, the SSR query, `listings_restore`, favourites and currency. `useListingsUrlFilters.ts` is a **zero-diff file**. | P0 | AC14 + `git diff --stat` | Confirmed |
| **R17** | Owner | The kickoff documents the Storybook coverage boundary: `ListingsShellView` is **not** enrolled as canonical Mantine and stays a mixed legacy composite until its own final slice. | P1 | §10.5 + AC12 | Confirmed |

---

## 5. Assumptions and open questions

- `A1` **(assumption, reversible)** One story export is sufficient. The owner asked the story to show the drawer, the
  active count, the base sections, the property-type-dependent sections and the mobile form; a single fixed
  `navigation.query` produces all five, and the mobile form is produced by the 320/375/390 toolbar viewports rather
  than by a second export. This keeps the new-cell count at **16** (§3.8). If the executor adds a second export the
  count becomes 32 and §13 V6's arithmetic must be re-derived, not copied.
- `A2` **(assumption, reversible)** No new `storybook.mantine.*` i18n key is required: the story's only fixture
  strings are the two location names, and `combobox_option_tirana`/`_durres` already exist in all four locales
  (§3.8). Every other visible string is the component's own runtime `common`/`listing` copy resolved by the global
  `NextIntlClientProvider` decorator — the same arrangement `FiltersPanelShell` documents. **If any literal turns
  out to be needed, it goes through `storyT` with the key added to all four `messages/*.json` and
  `npm.cmd run check:i18n` re-run** — never as a raw literal (`check:stories` §14.2 would fail it anyway).
- `A3` **(known limitation, out of scope — do not fix here)** The story will render raw lowercase enum labels
  (`apartment`, `house`, …) in the property-type grid in every locale, because `usePropertyTypes()` has no
  `/api/property-types` to reach inside Storybook and falls back to `buildFallback()`. This is the condition Task
  675 already recorded as `NOT VERIFIABLE` and reserved as **Task 679** (§3.7). It does not trip
  `check:locale-leak` (§3.8). Record it in the completion report; **do not** localise it, allowlist it, or stub the
  hook.
- `A4` **(assumption)** `useExchangeRate()` and `useCurrencies()` also have no endpoint in Storybook. `rate` stays
  `null` and the story's `currency` is `ALL`, so `ListingsFilters.tsx:182-187`'s exchange-rate note does not render.
  That is deterministic, not flaky. State it in the report rather than forcing the note into view.
- `Q1` **(open, non-blocking)** Should `ListingsFilters`' header title + count move into `MantineDrawer`'s `title`
  slot, as Task 567 did for `FiltersPanel`? **Decided NO for this task** (§10.4) — it would push listings-specific
  copy into `ListingsShellView`, which this task must keep as a thin host. Recorded as a candidate for the final
  `ListingsShellView` slice, not deferred silently.
- `UNKNOWN` The exact rendered pixel effect of the 20px → 16px drawer body padding (§10.3 C3) at each of the 16
  cells. It is bounded and measured by the story capture; it is not separately predicted here.

---

## 6. Pre-read rule bundle

Read these and nothing else by default. **Do not write "read all docs".**

**Always required** — `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (rows **54** and **55** only).

**Current Mantine path** — `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/ui-rules.md` (routing/legacy-boundary notes only) · `docs/qa-rules.md`.

**Storybook / visual proof** — `docs/storybook-governance.md` (**§14.1-14.4**, **§14.9.17**, **§14.11**, **§15**) ·
`docs/storybook-visual-snapshots.md`.

**Sprint** — `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` (Goal · Preconditions ·
Exit criteria · Decisions **D775-A/B/C**, **D68-2**) · the Task **777** kickoff and
`docs/sessions/2026-08-31-task777-listings-pagination-mantine.md` **§14** for the differential-baseline shape.

**Source to read before editing** — the five files in §3.1 · `src/design-system/mantine/patterns/MantineDrawer.tsx` ·
`src/design-system/mantine/patterns/responsiveBottomSheet.tsx` ·
`src/design-system/mantine/patterns/MantineFilterSection.tsx` · `src/components/shared/FilterMultiToggle.tsx` ·
`src/design-system/mantine/theme.ts` (spacing `:201-213`, radius `:216-225`, breakpoints `:174-181`, gray `:16-27`,
Button `:318-330`) · `src/stories/patterns/mantine/ListingsPagination.stories.tsx` ·
`src/stories/mantine/primitives/FiltersPanelShell.stories.tsx` · `src/stories/mantine/primitives/FilterControls.stories.tsx`.

**Execution protocol** — `.claude/skills/execute-task/SKILL.md` (auto-loaded).

---

## 7. Scope

Exactly these paths may be edited:

| # | Path | Change |
|---|---|---|
| 1 | `src/modules/listings/components/ListingsFilters.tsx` | Full Mantine migration (R1-R6). |
| 2 | `src/modules/listings/components/ListingsShellView.tsx` | **Line 7** import swap and **lines 82-86** only: `Sheet`/`SheetContent` → `MantineDrawer`. Nothing else in the file. |
| 3 | `src/modules/listings/components/ListingsShell.tsx` | **Lines 6 and 14-18 only**: the `dynamic()` `loading:` fallback off shadcn `Skeleton` (R9). The `ssr:false` declaration, the `SaveSearchButton` dynamic import and every prop passed to `ListingsShellView` stay byte-identical. |
| 4 | `src/components/shared/FilterMultiToggle.tsx` | Additive `orientation` prop only (R12, §10.6). |
| 5 | `src/stories/patterns/mantine/ListingsFilters.stories.tsx` | **New file** (R10). |
| 6 | `scripts/mantine-migration-scope.json` | Append `ListingsFilters.tsx` (R11). |
| 7 | `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | Extend with the URL-contract tests in §13 S3. |
| 8 | `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | Extend with the `orientation` tests in §13 S3. |
| 9 | `docs/backlog.md` · `docs/sessions/2026-09-01-task778-listings-filters-mantine.md` | State + session log. |

---

## 8. Out of scope — a diff touching any of these is rejected, not noted

- `src/modules/listings/hooks/useListingsUrlFilters.ts` — **zero diff**. Read only.
- `ListingsFilterBar` · `ListingsSortBar` · `ListingsStatusTabs` · `ActiveFilterChips` · `SaveSearchButton` ·
  `ListingCard`. **Task 772 owns `ListingsSortBar`** (Sprint 66, `KICKOFF FILED`) and its R4 forbids migration on
  that file — Sprint 68 exit criterion **4** binds this task. Do not touch it, and do not touch `SaveSearchButton`.
- The URL toolbar and pagination row, the SSR query in `src/app/[locale]/listings/page.tsx`, the `listings_restore`
  session-storage flow, the favourites set, and currency behaviour (Sprint 68 exit criterion **3**).
- **Re-migrating any leaf**: `LocationCombobox`, `YearCombobox`, `RangeDatePicker`, `FilterRangeInputs`,
  `FilterMultiToggle` (beyond the additive prop in §10.6), `FilterRoomsRow`. They are already Mantine.
- `MantineDrawer.tsx` / `responsiveBottomSheet.tsx` / `MantineFilterSection.tsx` / `theme.ts` — **no edit**. If the
  task appears to need one, stop and report; do not widen.
- Everything in `ListingsShellView.tsx` other than the import line and lines 82-86 — including the 13 remaining
  `className` values, the empty state, the grid/list ternary, the "show more" `Button`, and `ListingsPagination`.
- `docs/critical-flow-registry.md` — its rows 54/55 evidence text is updated by the reviewer at closure, matching
  how Tasks 567/671/675 recorded theirs. Do not edit it during implementation.
- Any fix for the raw enum labels (**Task 679**), the `<div>`-in-`<p>` FiltersPanel warning (**677**), or the
  standing global FAIL/AMBIGUOUS cells.

---

## 9. Current and required behavior

| # | Current (measured, §3) | Required after | Classification |
|---|---|---|---|
| B1 | Panel hosted in shadcn `Sheet`, `side="left"`, effective **320px ≥640** / **90vw <640**, `p-5`, `showCloseButton={false}`. | `MantineDrawer` `side="left"` `size="xs"` (**320px**, token). `<640` = canonical bottom sheet, full width, `DragHandle`. Body padding **16px** (canonical, §3.5). | **Changed — deliberate**, C1/C2/C3 in §10.3. |
| B2 | Desktop drawer has **no** close control. | Desktop drawer has Mantine's built-in close. **Not suppressible** (§3.5). | **Changed — deliberate**, C1. |
| B3 | `ListingsFilters` header `X` is `lg:hidden` → visible **<1024**, so 640-1023 shows a body-level `X`. | The header close control is scoped `hiddenFrom="sm"` → visible **<640** only. At 640-1023 the same affordance is the Drawer's own header close. | **Relocated**, C2. |
| B4 | 18 accordion sections; body **conditionally mounted** (`{open && …}`); toggle is a `<button>` whose accessible name is the section title; ≥44px via `min-h-11`. | Identical: still 18, still conditionally mounted, still a `<button>` with the same accessible name, still ≥44px (from the theme's Button `minHeight: '2.75rem'`, `theme.ts:328` — **no raw value in this file**). | **Preserved.** |
| B5 | Section label: `text-xs font-semibold text-muted-foreground uppercase tracking-wider`. `--muted-foreground` → `--neutral-500` → `oklch(0.556 0 0)` ≈ **#8C8C8C**. | Mantine `Text size="xs" fw={600} tt="uppercase" c="gray.5"` + `letterSpacing: '0.05em'` → **#667085**. | **Changed — provenance-backed**, C4. |
| B6 | Section divider `border-b border-border` → `--neutral-200` → **#EBEBEB**, on every section except the last. | `gray-3` = **#D0D5DD** (Task 671 **D2**), on every section except the last — **position unchanged**. | **Changed — provenance-backed**, C5. |
| B7 | Active-count pill `bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium`; `--primary` = `--brand-700` = **#EC5447**. | Mantine `Badge color="brand" radius="pill"` — filled brand at `primaryShade:7` = **#EC5447**, white label. Same colour, Badge's own size chrome. | **Changed — canonical default adopted**, C6. |
| B8 | Selected property type `bg-primary/10 text-primary border-primary/30`. | Mantine `Button variant="light"` — the exact substitution Task 567 made for the identical class string on `FiltersPanel`. | **Changed — precedent-backed**, C7. |
| B9 | Listing-type / market-type rows: shadcn `variant default/outline`, `size="xl"`, `flex-1 rounded-xl text-xs`. | Mantine `Button variant="filled" / "default"`, theme default size (`size="lg"`/`"xl"` are banned, Task 520), full-width behaviour via Mantine layout props. | **Changed — precedent-backed**, C8. |
| B10 | Listing-id `Input` `h-10 rounded-xl`. | Mantine `TextInput` §6e chrome (Task 567 precedent). Its `onChange` still writes `listing_id` immediately. | **Changed — canonical**, C9. |
| B11 | Mobile Apply `Button size="xl" className="lg:hidden mt-4"`, handler `onClose` only. | Mantine `Button` scoped `hiddenFrom="sm"`, handler still **exactly** `onClose`. Label still `apply_filters` + ` (n)` when `activeCount > 0`. | **Preserved behaviour**, breakpoint 1024→640 recorded in C2. |
| B12 | `dynamic()` fallback: 6 shadcn `Skeleton h-8 rounded-xl w-full` in a `flex flex-col gap-3 pt-1` div. | 6 Mantine `Skeleton` in a Mantine `Stack`, radius from a theme token — the `HeroSearchFallback.tsx` shape. `ssr:false` unchanged. | **Changed — mechanism only.** |
| B13 | Every filter writes immediately; no draft state anywhere. | Identical. **No `useState` for filter values may be introduced.** | **Preserved — P0.** |

---

## 10. Implementation requirements

### 10.1 Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility → cascade → token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Panel overlay container | `ListingsShellView.tsx:82-86` `SheetContent` | `w-80 max-w-[90vw] overflow-y-auto p-5` + `sheet.tsx:58` `data-[side=left]:*` | `w-80`→20rem; `sm:max-w-sm`→24rem; `p-5`→1.25rem | **Changed** | §3.4, AC7/AC8 |
| Overlay scrim | `sheet.tsx:32` | `bg-black/10 backdrop-blur-xs` | fixed rgba + backdrop-filter | **Changed** → Mantine `Drawer` default scrim, the same one `FiltersPanel` already uses | C1 |
| Section divider | `ListingsFilters.tsx:29` | `border-b border-border` | `--border`→`--neutral-200`→`oklch(0.922 0 0)` **#EBEBEB** | **Changed** → `--mantine-color-gray-3` **#D0D5DD** | C5 |
| Section label | `:36` | `text-xs font-semibold text-muted-foreground uppercase tracking-wider` | `--muted-foreground`→`--neutral-500`→`oklch(0.556 0 0)` **#8C8C8C**; `tracking-wider`=0.05em | **Changed** → `gray.5` **#667085**, `fz` `xs`=0.75rem, `fw` 600, ls 0.05em | C4 |
| Chevron rotation | `:39` | `cn('… transition-transform', open && 'rotate-180')` | transform | **Preserved** (Mantine `style`-free rotation on the icon) | AC2 |
| Active-count pill | `:71` | `bg-primary text-primary-foreground rounded-full px-2 py-0.5` | `--primary`→`--brand-700`→`--mantine-color-brand-7` **#EC5447** | **Changed** → `Badge color="brand" radius="pill"` (same #EC5447) | C6 |
| Selected property type | `:106`,`:115` | `bg-primary/10 text-primary border-primary/30` | alpha(brand-7,.1)/brand-7/alpha(brand-7,.3) | **Changed** → `variant="light"` | C7 |
| Property-type grid | `:103` | `grid grid-cols-2 gap-1.5` | 2 cols, 0.375rem | **Preserved shape** → `SimpleGrid cols={2} spacing=<token>` | AC2 |
| Type / market rows | `:86`,`:137` | `flex flex-col sm:flex-row gap-2` | 0.5rem | **Preserved shape** → Mantine responsive layout props on this theme's `sm`=40em | C8, D775-A |
| Vertical multi-toggle | `:243`,`:316`,`:330` | `className="flex-col gap-1.5"` on the leaf | `flex-direction:column` + 0.375rem, redundant with `Stack gap={6}` | **Changed** → `orientation="vertical"` | C10, AC9 |
| Mobile Apply | `:360` | `lg:hidden mt-4` | 1024px gate | **Changed gate** → `hiddenFrom="sm"` (640px) | C2 |
| Header close X | `:76` | `ml-auto lg:hidden` | 1024px gate | **Changed gate** → `hiddenFrom="sm"` | C2 |
| `dynamic()` fallback | `ListingsShell.tsx:15-16` | `flex flex-col gap-3 pt-1` + `h-8 rounded-xl w-full` | 0.75rem gap, 2rem height, 0.75rem radius | **Changed** → Mantine `Stack` + `Skeleton` | B12 |
| "Show more", empty state, grid ternary, pagination row | `ListingsShellView.tsx:89-165` | 13 remaining `className` | legacy Tailwind | **Out of scope — preserved verbatim** | §8, AC15 |

### 10.2 Canonical UI decision record

Searched: `src/stories/patterns/mantine/` and `src/stories/mantine/primitives/` (full listing, 21 + n files);
`src/design-system/mantine/patterns/`; `scripts/mantine-migration-scope.json`;
`grep -rn "MantineDrawer\|MantineFilterSection\|UnstyledButton" src`. Each candidate below was opened at source,
not matched by filename.

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Filters overlay host | `MantineDrawer.tsx` (read in full) · `Patterns/Mantine/DialogDrawerPattern` · `Mantine/Primitives/FiltersPanelShell` · `responsiveBottomSheet.tsx` | `src/design-system/mantine/patterns/MantineDrawer.tsx`; proven by `Mantine/Primitives/FiltersPanelShell` | **reuse** | Consume as-is. `side="left"`, `size="xs"`. **No edit to `MantineDrawer.tsx`.** |
| Filter section wrapper (collapsible) | `MantineFilterSection.tsx` (read in full) · `Patterns/Mantine/FilterSection` story · `FormSectionStack.stories.tsx` | `MantineFilterSection` **inspected and rejected as owner** | **reuse Mantine primitives, file-local composition** | `MantineFilterSection` renders a static `Box p="lg"` + `Group` header with **no toggle, no chevron, no collapse**, and its divider is a **top** border derived from first-visible-section logic, whereas this surface's divider is a **bottom** border on all but the last. Adopting it would change padding and divider position on a surface whose visual outcome the owner did not authorise changing, and adding a collapsible mode would alter a pattern with 17 live `FiltersPanel` consumers. The file-local `AccordionSection` helper is retained and rebuilt on Mantine primitives — it is already a single de-duplicating composition used 18×, not 18 copied style blocks. **Follow-up candidate (not filed): unify the two section chromes when `FiltersPanel` and `ListingsFilters` next converge.** |
| Section toggle control | `theme.ts:318-330` · `MobileBottomNavView.tsx:82` · `MantineCombobox.tsx:376` · `MantineCopyIdButton.tsx` | Mantine `Button`, theme-configured | **reuse** | Mantine `Button variant="subtle"`, full width, label/chevron split. **The 44px floor comes from `theme.ts:328` `minHeight: '2.75rem'`, not from a value in this file** — this is why `Button` is specified and `UnstyledButton` is not: `UnstyledButton` carries no touch-target floor, and supplying `2.75rem` locally would be a raw value, which R15 forbids. |
| Selected/unselected toggle chips | `docs/critical-flow-registry.md:55` Task 567 entry · `FiltersPanelShell.stories.tsx` | Mantine `Button` `variant="light"`/`"default"`/`"filled"` | **reuse** | Task 567 replaced the byte-identical `bg-primary/10 text-primary border-primary/30` on `FiltersPanel` with `variant="light"`. Same artifact class, same substitution. |
| Active-count pill | `Mantine/Primitives/Badge` story · `theme.ts` Badge defaults · `MantineCountButton.tsx` | Mantine `Badge` | **reuse** | `color="brand" radius="pill"`. `MantineCountButton` was inspected and is **not** the owner here — it renders a count *inside a Button's `rightSection`*; this artifact is a standalone pill beside a heading. |
| Listing-id field | Task 567 entry (registry:55) · `Mantine/Primitives/Input` | Mantine `TextInput` (§6e chrome) | **reuse** | Direct swap; `onChange` wiring unchanged. |
| `dynamic()` loading fallback | `HeroSearchFallback.tsx` (read in full) · `Mantine/Primitives/Skeleton` | Mantine `Skeleton` + `Stack` | **reuse** | Radius from a theme token, as `HeroSearchFallback.tsx:23` does (`radius="lg"`). Kept inline in `ListingsShell.tsx`; **not** extracted and **not** enrolled — see §10.5. |
| Vertical multi-toggle layout | `FilterMultiToggle.tsx` (read in full) · `FilterControls.stories.tsx:105-119` | `FilterMultiToggle`, proven by `Mantine/Primitives/FilterControls` | **extend** | Additive `orientation` prop, §10.6. The existing `Patterns`-scope story that proves the vertical branch stays green because the `className` path is preserved. |
| The migrated `ListingsFilters` itself | `check-story-coverage.mjs` · `mantine-story-scope.mjs` · full `src/stories/**` listing | **none exists** | **create canonical** | New `Patterns/Mantine/ListingsFilters` story (§10.7). Its in-scope production consumer is named: `ListingsShell.tsx:185`, the sole consumer of `ListingsFilters` in `src/` (grep-confirmed, §3.2). This is a real production surface, not a gate probe, so the permanent-story creation gate is satisfied on the *named-consumer* arm, not on an owner-authorisation arm. |

**No requested visual value lacks provenance**, so this task is not `BLOCKED — CANONICAL STYLE DECISION REQUIRED`.

### 10.3 Accepted canonical changes — recorded, not masked

**These are not "zero visual change". Any completion report or review that describes this migration as visually
neutral is wrong and must be corrected.**

- **C1 — the desktop drawer gains a close control.** `SheetContent` carried an explicit `showCloseButton={false}`
  (`ListingsShellView.tsx:83`); `MantineDrawer` exposes **no** `withCloseButton` prop and its desktop branch
  renders a bare Mantine `Drawer`, whose default is `true` (§3.5). At **≥1024px** an affordance therefore appears
  where the legacy surface deliberately had none. This is the direct precedent Task 567 set on `FiltersPanel`
  ("custom header close-X control REPLACED by the canonical `MantineDrawer` built-in close — documented relocation,
  not a removal"), and it is accepted here on the same basis. The overlay scrim changes from
  `bg-black/10 + backdrop-blur-xs` to Mantine's default for the same reason.
- **C2 — the mobile/desktop gate moves from 1024px to 640px, and the header X relocates.** The header close and the
  Apply button were gated `lg:hidden` (1024px). The canonical split is Mantine's `sm` = **640px**
  (`theme.ts:176`), which is also where `MantineDrawer` switches form. After this task: **<640** = bottom sheet with
  the component's own `X` **and** the `DragHandle`; **640-1023** = side Drawer whose header close replaces the
  body-level `X` that used to sit there; **≥1024** = side Drawer with its header close (C1). Net affordance count
  per band is 1, 1, 1 — never 0 and never 2.
- **C3 — drawer body padding 20px → 16px.** The consumer's `p-5` is replaced by `MantineDrawer`'s hard-coded
  `var(--mantine-spacing-md)` (`MantineDrawer.tsx:155`). There is no prop to preserve 20px, and editing the pattern
  is out of scope (§8). Accepted as the canonical value, consistent with D775-B's rule that a migrated surface takes
  the canonical contract rather than preserving a legacy deviation.
- **C4 — section label #8C8C8C → #667085** (`gray.5`). Provenance: owner decision **D4** (2026-07-28, Task 675),
  recorded verbatim in `MantineFilterSection.tsx:26-33`, which pinned `gray.5` for exactly this artifact — a 12px
  uppercase micro-heading — after `grep -rn 'tt="uppercase"' src/` returned one hit and `tailadmin-style-reference.md`
  carried no row. **Do not re-litigate this and do not substitute `c="dimmed"`.**
- **C5 — section divider #EBEBEB → #D0D5DD** (`gray-3`). Provenance: **D2** (Task 671), recorded in
  `MantineFilterSection.tsx:23-24`: *"matching `MantineDrawer`'s own header/footer border tokens rather than the
  legacy shadcn `--border`"*. Divider **position** is unchanged (bottom, all but last).
- **C6 — count pill adopts `Badge`'s own size chrome.** Colour is identical (#EC5447 both sides, §3 B7); padding,
  height and font metrics become Mantine `Badge` defaults. Measure and record the before/after box, do not assert
  equality.
- **C7 / C8 / C9** — property-type selected state, type/market rows, and the listing-id field adopt the Task 567
  substitutions verbatim (registry row 55). `size="lg"` / `size="xl"` remain **banned** (Task 520).
- **C10 — below 640px the panel changes form factor**, from a 90vw left-edge sheet to the canonical full-width
  bottom sheet with a `DragHandle`. Explicitly required by the owner; recorded here so it is never reported as
  incidental.

### 10.4 Drawer `title` — deliberately not used

`MantineDrawer` is mounted **without** a `title`. Consequence, read from source: `MantineDrawer.tsx:148` leaves the
header border `undefined`, and `responsiveBottomSheet.tsx:165` leaves the mobile sheet undivided — both correct for
a title-less consumer. The filters heading, icon and count pill stay inside `ListingsFilters`' own header, so
`ListingsShellView` stays a thin host and no listings copy leaks into it. Recorded as open question **Q1**.

### 10.5 Storybook coverage boundary — required documentation

`scripts/mantine-migration-scope.json` gains **exactly one** entry:
`"src/modules/listings/components/ListingsFilters.tsx"`.

`ListingsShellView.tsx` **must not** be enrolled. It remains a **mixed legacy composite**: after this task it still
carries 13 Tailwind `className` values, a shadcn `Button`, `ListingsFilterBar`, `ListingsSortBar`,
`ListingsStatusTabs`, `ActiveFilterChips` and the legacy empty state. Enrolling it would assert, through
`scripts/lib/mantine-story-scope.mjs`, that the whole composite **is** canonical Mantine — precisely the false
assertion the Task 678 comment in that file rejects, and precisely what Sprint 68's own "what this sprint does not
inherit" item 2 forbids. It is migrated in its own final slice, after its children.

`ListingsShell.tsx` is likewise not enrolled: it is a controller whose only markup is the `loading:` fallback.
(Contrast `HeroSearchFallback.tsx`, which Task 670 **extracted** into its own component precisely so it could be
enrolled — that extraction is not repeated here and is not required by any rule; it is noted so the difference is
deliberate rather than an oversight.)

### 10.6 `FilterMultiToggle` — the additive prop, exactly

- Add `orientation?: 'horizontal' | 'vertical'` to `FilterMultiToggleProps`.
- Resolution order, which must be **explicit in the source**: `const vertical = orientation === 'vertical' || (className?.includes('flex-col') ?? false)`.
  The legacy `className` sniff is **kept**, so `FilterControls.stories.tsx:105-119` and any other `className`
  consumer render byte-identically.
- `ListingsFilters` passes `orientation="vertical"` at the 3 call sites and passes **no `className`**.
- Everything else in the file — `gap={6}`, `gap="xs"`, `wrap="wrap"`, `data-testid="filter-chip-row"`, the
  `role`/`aria-label` handling, the `Button` variants — is unchanged.
- **Zero-delta obligation (AC9):** the vertical branch previously received `className="flex-col gap-1.5"` on a
  Mantine `Stack` that already applies `flex-direction:column` and `gap:6px`. Dropping the utilities is *expected*
  to be pixel-identical, but that must be **measured** — see §13 S3 test T4.

### 10.7 The story — exact contract

Path `src/stories/patterns/mantine/ListingsFilters.stories.tsx`, title **`Patterns/Mantine/ListingsFilters`**.

- **Static** `import { ListingsFilters } from '@/modules/listings/components/ListingsFilters'` — the coverage gate
  resolves the specifier from the AST (§3.8); a `dynamic()`/lazy import would not close the tuple.
- Mounts the real `MantineDrawer` with `opened` hard-coded `true`, `onClose={() => {}}`, `side="left"`,
  `size="xs"`, **no `title`** — the same construction `ListingsShellView` will ship, not an analogue.
- `parameters: { skipCanvas: true, layout: 'fullscreen', nextjs: { navigation: { pathname: '/listings', query: { … } } } }`.
  `layout:'centered'|'padded'` are forbidden (`check-stories.mjs:182-188`).
- The fixed `query` **must** set `property_type` plus at least two other filter params, so that: the count Badge
  renders with a non-zero value; the property-type-dependent section set is exercised (rather than
  `getFilterVisibility(undefined)`'s all-sections default, §3.3); and the always-open sections
  (`type`, `property_type`, `location`, `rooms`, `price` — `useListingsUrlFilters.ts:15-21`) render their bodies.
  Record the chosen query verbatim in the session log.
- `locations` fixture: two entries built from `storyT(locale, 'storybook.mantine.combobox_option_tirana' | '…_durres')`.
  **No raw string literal anywhere in the file** (`check-stories.mjs` §14.2).
- Exactly **one** export (`Default`). No per-locale and no per-viewport exports — locale and width come from the
  toolbar (`preview.tsx:162-191`, `VIEWPORTS`); width-named exports are rejected by `check-stories.mjs` Check 12.
- The story is a **permanent** artifact justified by a named in-scope production consumer (`ListingsShell.tsx:185`),
  not a gate probe. No probe is used by this task, so no `git hash-object` restoration evidence is required.

---

## 11. Positive and negative flows

### 11.1 Positive flow (the one the task must prove end to end)

1. A user opens `/listings` at 1024px. `ListingsShellView` renders; `filtersOpen` is `false`, so the
   `MantineDrawer` is closed and nothing of the panel is in view.
2. The user activates the filters trigger (`ListingsFilterBar` or `ListingsSortBar`, both unchanged, both calling
   `onFiltersOpen`). `filtersOpen` → `true`; the Drawer slides in from the **left** at **320px**.
3. `ListingsFilters` mounts through `dynamic(..., { ssr: false })`; the Mantine Skeleton fallback shows first.
4. The header renders the icon, `t('filters_title')`, and — only if `activeCount > 0` — the brand count Badge.
   The desktop Drawer's own close control is present in its header (**C1**).
5. The user expands "Posting period". The toggle is a `<button>` whose accessible name is the section title; the
   body **mounts** and the chevron rotates.
6. The user picks a start and an end date and confirms. `updateParams({ date_from, date_to })` fires **once**;
   `page` is deleted; `property_type`, `sort`, `currency` and every other param survive (**R3/R5**).
7. The user changes the property type. `handlePropertyTypeChange` deletes every param belonging to a section the
   new type does not show, and the corresponding section headers disappear from the panel (**R4**).
8. The user deselects one value in a multi-select. Only that value leaves the CSV; the rest stay (**R4**).
9. At 375px the same panel is the canonical bottom sheet with the `DragHandle`; the header `X` and the Apply
   button are both visible (`hiddenFrom="sm"`). Apply closes the panel and commits **nothing** (**R6**).

### 11.2 Negative-flow applicability

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Input validation — floor / floors_total bounds | **Yes** | `useListingsUrlFilters.ts:94-102` `handleFloorChange` / `handleFloorsChange` | A non-numeric or below-minimum entry resolves to `null`, so `updateParams` **deletes** the param instead of writing garbage. Unchanged by this task. | §13 S3 test T5 |
| Input validation — negative area | **Yes** | `ListingsFilters.tsx:197` `Math.max(0, Number(v))` | Preserved verbatim through the migration. | §13 S3 test T5 |
| Empty / cleared filter value | **Yes** | `updateParams` `val === null \|\| val === ''` | The param is removed from the URL, never set to an empty string. | §13 S3 test T2 |
| Zero active filters | **Yes** | `ListingsFilters.tsx:70` | The count Badge is **not rendered** at all (not a Badge showing `0`). | AC1 |
| No property type in URL | **Yes** | `filterEngine.ts:365-367` | **All** sections visible — the branch a `property_type`-seeded story does not cover, so it must be covered by test, not by the story. | §13 S3 test T3 |
| Property type hiding the currently-open section | **Yes** | `handlePropertyTypeChange` + local `sections` state | The section unmounts; its local open flag persists harmlessly in `sections` and is never written to the URL. No crash, no orphan divider. | §13 S3 test T3 |
| Long uk / it labels at 320px | **Yes** | Q3 mobile stress + `theme.ts` Button `wordBreak` (Task 567 round-2 Fix 1) | Labels wrap; no `scrollWidth > clientWidth`; no clipped text. | The 320/375/390 × sq/en/uk/it story cells |
| Overlay content taller than the viewport | **Yes** | `MantineDrawer.tsx:151-155` flex-column split | The scroll region scrolls; nothing overlaps. No footer is passed by this consumer, so the pinned-footer path is inert. | The 16 story cells |
| Locale with no `storybook.*` key | **Yes** | `_storyI18n.ts:40` | `storyT` **throws** rather than silently falling back to English. | `check:stories` + `check:i18n` |
| Authorization / RLS | **No** | The filters panel performs no read or write; the SSR query and RLS are untouched | N/A | — |
| Offline / network failure | **No** | Existing global behaviour. `usePropertyTypes` / `useExchangeRate` / `useCurrencies` already have their own catch-and-fallback paths, none of which this task edits | N/A | — |
| Concurrent writer | **No** | No data model is written by this surface | N/A | — |
| SSR / hydration mismatch | **No** | `ssr:false` is preserved (**R9**), so this component is never in server HTML; `MantineDrawer` inherits the documented `getInitialValueInEffect` caveat unchanged | N/A | — |

---

## 12. Acceptance criteria

| # | Criterion |
|---|---|
| **AC1 [R1]** | **Given** `ListingsFilters.tsx` after the change, **when** it is grepped, **then** it contains **0** matches for `@/components/ui/button`, `@/components/ui/input`, `from '@/lib/utils'`, `cn(`, and **0** `className=` occurrences; and `import` from `@mantine/core` is present. Record the before → after numbers against §3.1's **27 / 4 / 8 / 1**. |
| **AC2 [R2]** | **Given** the migrated panel, **when** a section toggle is activated, **then** the control is still an element with `role="button"` whose accessible name is the section title, the body is **mounted only while open** (`{open && …}` semantics preserved — Mantine `Collapse` is **rejected**, see AC2a), the chevron rotates, and **no** `sections` key appears in any `router.push` URL. |
| **AC2a [R2]** | **Given** the implementation, **then** `Collapse` is **not** used for the section bodies. Rationale on record: `Collapse` keeps children mounted, which would permanently mount `LocationCombobox`, 2× `YearCombobox`, `RangeDatePicker` and 7× `FilterMultiToggle` even when collapsed — a DOM and mount-cost change the legacy control never had, and a change to the DOM the existing smoke suite queries. If the executor believes `Collapse` is required, **stop and report**; do not adopt it unilaterally. |
| **AC3 [R3]** | **Given** a URL carrying `sort`, `currency` and `page=3`, **when** any single filter changes, **then** exactly **one** `router.push` fires, the pushed URL retains `sort` and `currency`, has **no** `page`, and contains the changed param. |
| **AC4 [R4]** | **Given** `property_type=apartment` with a dependent param set, **when** the property type changes to a type whose schema omits that section, **then** the dependent param is absent from the pushed URL. **And given** a multi-select with 3 values, **when** one is deselected, **then** the pushed URL retains exactly the other 2. |
| **AC5 [R5]** | **Given** the period section, **when** a range is picked, **then** `date_from` **and** `date_to` are both present in **one** `router.push`; **when** it is cleared, **then** both are absent from **one** push. (The two existing Task 559 `ListingsFilters` tests must remain green unmodified in intent.) |
| **AC6 [R6]** | **Given** the mobile Apply button, **when** it is activated, **then** its handler is exactly `onClose` — **zero** `router.push` calls result, and no `useState` holding filter values exists anywhere in `ListingsFilters.tsx`. |
| **AC7 [R7]** | **Given** `ListingsShellView.tsx` after the change, **then** it imports `MantineDrawer` and **not** `@/components/ui/sheet`; the Drawer is `opened={filtersOpen}` / `onClose` wired to the **same** `onFiltersOpenChange` state; `side="left"`; `size="xs"`; **no** raw width value anywhere. The file's `className=` count is **13** (was 14) and the remaining 13 are byte-identical to §3.1. |
| **AC8 [R8]** | **Given** the story cells, **then** at **1024px** the panel renders as a left side Drawer whose measured content width is **320px**, and at **320 / 375 / 390px** it renders as the bottom sheet (edge-to-edge, `DragHandle` present). Both measured from the captured cells, not asserted from source. |
| **AC9 [R12]** | **Given** `FilterMultiToggle`, **then** `orientation="vertical"` and `className="flex-col …"` both produce the vertical `Stack`; a test proves each independently; and the vertical wrapper's computed `flex-direction` and `gap` are **measured identical** before and after the utility removal. A difference is a finding, not a note. |
| **AC10 [R9]** | **Given** `ListingsShell.tsx`, **then** `dynamic(..., { ssr: false })` for `ListingsFilters` is unchanged, the fallback imports `Skeleton` from `@mantine/core`, and the file's `className=` count is **0** (was 2). The `SaveSearchButton` dynamic import and all 17 props passed to `ListingsShellView` are byte-identical. |
| **AC11 [R10]** | **Given** the new story, **then** `check:stories` and `check:story-coverage` both exit **0**, the story title is exactly `Patterns/Mantine/ListingsFilters`, it contains exactly one export, and `screenshots:assert -- --mantine-only` reports **16** cells for it, all PASS. |
| **AC12 [R11/R17]** | **Given** `scripts/mantine-migration-scope.json`, **then** it gained **exactly one** entry (`…/ListingsFilters.tsx`), the array length went **20 → 21**, and neither `ListingsShellView.tsx` nor `ListingsShell.tsx` appears in it. |
| **AC13 [R13]** | **Given** the completion report and session log, **then** they state C1 (desktop close affordance appears), C2 (1024→640 gate + X relocation), C3 (20px→16px body padding), C4/C5 (label and divider colour changes with their owner-decision provenance) and C10 (mobile form-factor change) as **changes**, each with a measured before/after value. **A "no visual change" or "visually neutral" claim anywhere is an automatic finding.** |
| **AC14 [R16]** | **Given** `git --no-optional-locks diff --stat`, **then** `src/modules/listings/hooks/useListingsUrlFilters.ts` is absent, and no file outside §7's nine paths appears. |
| **AC15** | **Given** the final gate list in §13, **then** every command in it has a retained transcript recording platform, Node version, working directory, exact command and actual exit code, and `npm.cmd run build` exits **0**. |
| **AC16 [R14]** | **Given** baseline **B** and post-edit **P** from §13 S2/V6, **then** `P \ B = ∅` (no failure cell in P that is not in B, compared as normalized cell identities, not counts) and every one of the 16 new cells is PASS. Arithmetic must reconcile explicitly: `total(P) = total(B) + 16` and `pass(P) = pass(B) + 16`. |
| **AC17 [R15]** | **Given** `check:design-tokens:strict` and `governance:tailwind`, **then** both exit **0**, and the migrated file introduces **no** `design-tokens-allow:` marker and **no** raw px/rem/hex value. |

---

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** It applies because this is a migrated Mantine surface plus an overlay swap —
two of `docs/qa-profiles.md`'s named `Q3` triggers — and it changes the rendered chrome of a route surface.

`Q4` was considered and rejected: this task touches two registered critical flows (§3.7) but changes **no** flow
behaviour, writes no data, and edits no security path. The `Q4` obligation that does carry over is the registry's
**automated regression evidence**, which is why the two named suites are mandatory below rather than optional.

**Windows-native rule (P0, `docs/orchestrator-role.md`).** Every command below runs in **native Windows PowerShell**
from the project root, using `npm.cmd` / `npx.cmd`. Record `node.exe -p process.platform` first; only `win32` is
admissible. A result from WSL, a Linux VM or a mounted Linux view is an **environment screen, not evidence**.
Retain transcripts under `docs/sessions/evidence/task778/` — **the path is named here deliberately**, because Task
776's review found its kickoff asked for output and exit codes but not for a retained artifact path, and the
evidence survived only as prose.

### Sequence — run in this order

**S1 — pre-edit census (before touching anything).**
Re-measure §3.1's table with the real tool and record the actual numbers. If any number differs from §3.1, **stop
and report a census drift** — Sprint 68 exit criterion 1 makes a drifted census a design blocker, not something to
absorb into scope.

**S2 — clean pre-edit baseline B (before any edit).**
```powershell
node.exe -p process.platform
npm.cmd run build-storybook
npm.cmd run screenshots:assert -- --mantine-only
```
Persist the resulting `manifest.json` path **and** the full `<total>/<pass>/<fail>/<ambiguous>` line as **B**.
**Do not overwrite it later.** B is captured from the pre-edit tree; a baseline taken after any edit is invalid and
cannot be re-derived.

**S3 — implement, then targeted regression.**
New and extended tests, each of which must fail on a planted violation before it is trusted:

| Test | File | Proves |
|---|---|---|
| **T1** | `filtersRangeDatePicker.smoke.test.tsx` | The 7 existing tests stay green **unmodified in intent** after the migration. Selector updates are permitted only where the migration genuinely changed the DOM; each such edit must be justified in the report. |
| **T2** | `filtersRangeDatePicker.smoke.test.tsx` | **AC3** — a seeded URL (`sort`, `currency`, `page=3`) plus one filter change ⇒ exactly one `router.push`, `sort`+`currency` retained, `page` gone. |
| **T3** | `filtersRangeDatePicker.smoke.test.tsx` | **AC4** — property-type change drops the inapplicable dependent param and unmounts its section; and the no-`property_type` all-sections-visible branch renders. |
| **T4** | `filterLeafComponents.smoke.test.tsx` | **AC9** — `orientation="vertical"` and legacy `className="flex-col gap-1.5"` each produce the vertical `Stack`; computed `flex-direction`/`gap` measured identical across both paths. |
| **T5** | `filtersRangeDatePicker.smoke.test.tsx` | Negative flows — below-minimum floor and negative area resolve to a **deleted** param, not a written one. |
| **T6** | `filtersRangeDatePicker.smoke.test.tsx` | **AC6** — activating mobile Apply produces **0** `router.push` calls and calls `onClose` exactly once. |

**Planted-violation obligation (each of T2-T6):** reintroduce the specific defect the test exists to catch, record
the **actual** failing assertion output, then revert and re-run to green. A test that has not been observed failing
is not a control. Record every plant and its revert in the session log.

**V — gates, in this order.** Every one must be run and its actual exit code recorded.

| # | Command | Note |
|---|---|---|
| V1 | `npx.cmd vitest run src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx src/components/shared/__tests__/heroSearch.smoke.test.tsx` | The registry's own command set for rows 54/55, extended with this task's tests. The last two prove the leaf change did not regress `FiltersPanel`/`HeroSearch`. |
| V2 | `npm.cmd run check:stories` | **Checkpoint.** Also the first point at which the story is built. **If `parameters.nextjs.navigation.query` does not reach `useSearchParams()` in the built Storybook** (count Badge absent, all sections visible), **stop and report `BLOCKED — STORY SEARCHPARAMS MECHANISM`**. Do not invent a wrapper, do not mock the hook, do not stub `next/navigation` in a story. §3.8 verified the mechanism at source; this step verifies it in the build. |
| V3 | `npm.cmd run check:story-coverage` | Must report the manifest at **21** entries, all covered. |
| V4 | `npm.cmd run governance:tailwind` | |
| V5 | `npm.cmd run check:design-tokens:strict` | **AC17.** Compare the violation set to the pre-edit set; the count must not grow and **no** violation may be in a file this task touched. |
| V6 | `npm.cmd run typecheck` | |
| V7 | `npm.cmd run build-storybook` | Confirm the bundle really contains the change (grep the built output for a distinctive new token) before trusting V8. |
| V8 | `npm.cmd run screenshots:assert -- --mantine-only` | Produces **P**. Apply **D68-2** exactly: compute `P \ B` as a **set of normalized cell identities**, not a count comparison; report the 16 new `ListingsFilters` cells individually. **Pre-existing global FAIL/AMBIGUOUS cells are not a blocker** and must not be repaired here. A **new** failure outside the 16 is a blocker. |
| V9 | `npm.cmd run check:locale-leak:mantine-only` | Compare against the pre-existing leak set (Task 777 recorded **23**). Zero new leaks attributable to `ListingsFilters` is the bar; the raw enum labels are covered by A3 and by the lowercase allowlist entry (§3.8). |
| V10 | `npm.cmd run build` | **Hard gate.** A failed or unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. |
| V11 | `git --no-optional-locks diff --check` | Whitespace/conflict-marker check. |
| V12 | `git --no-optional-locks diff --stat` | **AC14** — verify the changed-path set against §7's nine paths. |

`check:i18n` is required **only if** A2 turns out false and a `storybook.*` key is added; in that case run
`npm.cmd run check:i18n` and record the parity totals.

**No route probe.** Sprint 68's corrected precondition records that the product has two listings, so `/listings`
renders no pagination and a thin result set; §3 of Task 775's closure makes Storybook the proof surface for this
sprint. Do not add a route probe, and do not read an absent control on the live route as a pass.

---

## 14. Completion report contract

Status must be exactly one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
**Sonnet has no approval authority and must not emit, suggest, or run any mutating git command, including `git push`.**

Report:

1. **Files changed** — a table matching the real `git --no-optional-locks status --short`, reconciled against §7.
2. **Requirement IDs completed** — R1-R17, each with its evidence pointer. Anything short of complete is named.
3. **Census** — S1's re-measured numbers beside §3.1's, plus the after-values for AC1 / AC7 / AC10 / AC12.
4. **Commands run** — every command in §13 with platform, Node version, cwd, exact command, **actual** exit code,
   and the retained transcript path under `docs/sessions/evidence/task778/`.
5. **Differential rendered result** — B and P identifiers, the `P \ B` set (empty or enumerated), the 16 new cells
   listed individually, and the explicit arithmetic reconciliation required by AC16.
6. **Planted violations** — one entry per plant: what was broken, the actual failing output, the revert, the
   re-run result.
7. **Canonical changes C1-C10** — measured before/after for each, per AC13. No "visually neutral" claim.
8. **Assumptions** — the fate of A1-A4, in particular whether A2 held.
9. **Deviations, limitations, unresolved issues** — including the A3 raw-enum-label condition (Task 679) and the
   Q1 drawer-title question.
10. **Backlog + session log** — concise state in `docs/backlog.md`; full detail in
    `docs/sessions/2026-09-01-task778-listings-filters-mantine.md` with a "Files Changed" table matching the diff.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | **Yes** — every file, line, command, token and decision is named in-document. |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1-R17 → AC1-AC17, each mapped to a §13 step. |
| Scope protects existing behavior and names what must not change | **Yes** — §8, with `useListingsUrlFilters.ts` as an explicit zero-diff file and Task 772's ownership of `ListingsSortBar` restated. |
| UI publication checks (`orchestrator-ui-task-design.md`) | **Yes** — current/legacy boundary (§1, §10.5), QA profile (§13), visual source map (§10.1), canonical decision record (§10.2), preservation classifications (§9). |
| Permanent-story creation gate | **Yes** — §10.2 last row and §10.7 name the inspected candidates, why none covers the artifact, and the **in-scope production consumer** (`ListingsShell.tsx:185`). No probe is used, so no restoration evidence is required. |
| Negative flows selected by applicability, not copied | **Yes** — §11.2 marks 4 branches `No` with the existing owner/reason. |
| No uninspected claim | **Yes** — every `FACT` in §3 cites a file and line read in this session; every derived claim is labelled `INFERENCE`; the one unverified mechanism (`nextjs.navigation` in a **built** Storybook) is a checkpoint with a `BLOCKED` failure behaviour (V2), not an assumption. |
| Absence/API claims carry a data-flow trace | **Yes** — "`ListingsFilters` has exactly one production consumer" is traced through the full `grep` output in §3.2/§10.2 (`ListingsShell.tsx:10-11` dynamic import + `:185` render site), distinguishing it from the `ListingsFilterBar` near-name and from test/story/comment hits. "`MantineDrawer` has no `withCloseButton` prop" is traced to the full `MantineDrawerProps` declaration at `:7-22` plus both render branches at `:125` and `:137`. |
| Gates prove the changed behavior, not merely procedure | **Yes** — V8 is differential per D68-2; V2 is a real checkpoint with a stop condition; every new test carries a planted-violation obligation. |
| Every owner-only exception has traceable authorization | **Yes** — D775-A/B/C and **D68-2** are cited with owner and date; C4 cites **D4** (2026-07-28) and C5 cites **D2** (Task 671), both quoted from `MantineFilterSection.tsx`. |
| Rule-compliance ledger — no rule weakened | **COMPLIANT** for: sprint-assignment rule (2026-08-01), `docs/rule-index.md` bundle selection, `docs/qa-profiles.md` `Q3`, `docs/agent-contract.md` clause 16c (story in the same PR), Sprint 68 exit criteria 1-5, Windows-native validation (P0), the `npm run build` hard gate, and the Git policy (§17 emits commit only, never push). |
| Exactly one active owner route | **Yes** — no alternative implementation is offered. Where two designs were plausible (`Collapse`, `UnstyledButton`, drawer `title`, `MantineFilterSection` reuse), one was selected and the rejected option is recorded **with its reason** so the executor does not re-open it. |
| Checkpoints name producer, output, comparator, failure behavior | **Yes** — S1 (census drift → stop), S2 (B, non-overwritable), V2 (mechanism → `BLOCKED`), V5 (violation-set comparator), V8 (`P \ B` set comparator). |
| Dirty-worktree handling | **N/A by measurement** — the worktree was **clean** at task-design time (§3, verified `git --no-optional-locks status --short` → empty). The executor must re-take that snapshot **before** its first write; if it is not clean, complete `docs/orchestrator-dirty-worktree-manifest-template.md` before editing. |
| Counts account for task-created artifacts | **Yes** — AC16's `total(P) = total(B) + 16` states the created cells explicitly; AC12 states the manifest 20 → 21. |
| No fact asserted `Confirmed` whose first verification is deferred | **Yes** — S1 is an I0 **re-measure** of author-verified numbers (freshness, since a parallel edit could land between filing and execution), and the author's full trace is retained in §3.1. |
| Cited steps match the final plan | **Re-checked after the final revision** — §12's AC references to §13 S1/S2/S3/V1-V12 and §10.x resolve. |

---

## 16. Sprint 68 precondition — corrected in the same edit as this kickoff

`tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` → **Preconditions**, third bullet is
replaced, and **D68-2** is added to that file's *Closed — binding on this sprint* table. The superseded text is
retained inline so the change is auditable rather than silent. Task 778 executes against the corrected text.

---

## 17. Implementation handoff

Execute from the saved task at
`tasks/Sprints/Sprint_68_kickoff_prompt_Task_778_ListingsFilters_Mantine_Drawer.md`, following
`.claude/skills/execute-task/SKILL.md`.

Order: **S1 census → S2 baseline B → implement → S3 tests + plants → V1-V12 → report.**

Return `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.
Do not run any mutating git command.

---

## 18. FACTS · INFERENCES · UNKNOWNS · CONFLICTS

**FACTS** — the §3.1 census (367/189/168/138/338 lines; 27/4/8/1 in `ListingsFilters.tsx`); `SheetContent`'s
`showCloseButton={false}` at `ListingsShellView.tsx:83`; `MantineDrawer` exposing no `withCloseButton` prop and
`ResponsiveBottomSheet` setting `withCloseButton={false}`; `--drawer-size-xs: calc(20rem * var(--mantine-scale))`;
`MantineDrawer`'s hard-coded 16px body padding; `--muted-foreground` → `#8C8C8C` and `gray.5` → `#667085`;
`--border` → `#EBEBEB` and `gray-3` → `#D0D5DD`; `MANTINE_VIEWPORTS` = 4 widths and `LOCALES` = 4;
`ListingsFilters` absent from `MANTINE_OVERLAY_PRIMITIVES` and from `MANTINE_STORY_EXTRA_VIEWPORTS`;
`RouterDecorator` spreading `parameters.nextjs.navigation`; the `/^\.|^[a-z]/` locale-leak allowlist entry;
`FilterMultiToggle`'s `className.includes('flex-col')` sniff and its 3 call sites; the clean worktree on `main`.

**INFERENCES** — 1 story export ⇒ exactly 16 new cells; `size="xs"` reproduces the legacy 320px desktop width
token-cleanly; the legacy mobile width was 90vw, so `<640` is a form-factor change either way; dropping
`"flex-col gap-1.5"` from a Mantine `Stack gap={6}` should be pixel-neutral (**and AC9 measures it rather than
assuming it**); no new `storybook.*` key is required (**A2, verified by the executor, not asserted here**).

**UNKNOWNS** — the rendered pixel effect of C3's 20px→16px padding at each of the 16 cells; whether
`nextjs.navigation.query` behaves in the **built** Storybook as it does in source (**V2 is the checkpoint, with a
`BLOCKED` stop, not a guess**).

**CONFLICTS** — one, and it is resolved before execution: Sprint 68's Preconditions paragraph demands a globally
green `screenshots:assert -- --mantine-only`, which **D68-2** (owner, 2026-09-01) replaced with differential
acceptance. §16 corrects the plan file; **R14/AC16** bind the executor to the differential rule.

**BLOCKED** — None. No owner decision is outstanding for this task. **D68-1** (Task 772 ordering) does not gate it,
because §8 keeps `ListingsSortBar` and `SaveSearchButton` entirely out of scope.
