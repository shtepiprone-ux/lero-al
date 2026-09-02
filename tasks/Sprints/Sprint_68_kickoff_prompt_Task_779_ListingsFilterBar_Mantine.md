# Task 779 — `/listings`: `ListingsFilterBar` → Mantine, with route visibility moved to a `ListingsShellView` wrapper

**Sprint:** 68 — `/listings` leaves Tailwind, one surface at a time
**Priority:** P2 · **QA profile:** **Q3 Full Visual Matrix**
**Filed:** 2026-09-02 · **State:** `KICKOFF FILED`
**Kickoff path:** `tasks/Sprints/Sprint_68_kickoff_prompt_Task_779_ListingsFilterBar_Mantine.md`

---

## 1. Mode and task type

`TASK DESIGN` → implementation handoff.
Task type: **UI / Layout / Component — mixed migration** (current Mantine path for `ListingsFilterBar.tsx`; the
legacy shadcn/Tailwind path stays valid for the rest of `ListingsShellView.tsx`). Secondary bundle:
**Storybook / Visual Proof**.

`ListingsFilterBar` is **not** named in any `docs/critical-flow-registry.md` row (grep-confirmed, §3.8), so no
registry-membership obligation is claimed. The targeted URL-wiring suite in §13 S3 is an orchestrator-chosen
safeguard for a filter surface being rewritten — the same basis `mobileBottomNav.smoke.test.tsx` records for
`MobileBottomNav`.

---

## 2. Objective

Migrate `src/modules/listings/components/ListingsFilterBar.tsx` off the shadcn `Button`, the legacy
`@/components/shared/Combobox` and every Tailwind utility string onto Mantine primitives — `Button`, `Group`,
`Divider`, `Indicator` and `MantineCombobox` — consuming `LocationCombobox` as an already-migrated leaf.

Move the bar's route visibility gate **out of the component** and into a thin Mantine wrapper in
`ListingsShellView.tsx`, so the canonical story can render the real component at every captured viewport while the
production route keeps hiding the bar below **768px**.

Prove the migrated component with a new canonical story `Patterns/Mantine/ListingsFilterBar` that statically imports
the **real** production component, and enrol `ListingsFilterBar.tsx` in `scripts/mantine-migration-scope.json`
(**21 → 22**) in the same PR.

The filter URL contract must not move: every change stays immediate, property type keeps routing through
`handlePropertyTypeChange`, reset keeps calling `resetFilters`, and advanced filters keep calling the existing
`onFiltersOpen`.

---

## 3. Verified context

Every fact below was read from the working tree in the task-design session on **2026-09-02**, branch `main`, no
`.git/index.lock`. `FACT` = read directly. `INFERENCE` = derived from named facts. Nothing is carried from a prior
session.

**Worktree was NOT clean at task-design time.** `git --no-optional-locks status --porcelain` returned exactly one
path: `M tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md`, whose entire diff is the
**778 closure row** (`1 insertion, 1 deletion`, `KICKOFF FILED` → `APPROVED WITH NOTES`). Pre-write content
witnesses, recorded before this kickoff's own edits:

| Path | `git hash-object` before this session's writes |
|---|---|
| `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` | `41a513795b50dff12c0354337d47be2db6048fed` |
| `docs/backlog.md` | `e3beb1f5a0a9db08a3255cf349494183aea11e2e` |
| `src/modules/listings/components/ListingsFilterBar.tsx` | `81ee08e67993612d1489a0cf9395a8f558b6eebb` |

The executor must re-take `git --no-optional-locks status --porcelain` **before its first write** and, if any path
beyond this task's scope is modified, complete `docs/orchestrator-dirty-worktree-manifest-template.md` before
editing.

### 3.1 Pre-edit census — `ListingsFilterBar.tsx`

> **Measurement method is part of the baseline, not a footnote.** Owner decision, 2026-09-02, after this task's
> first design pass was stopped on a census drift: the canonical line baseline is **physical lines**, and it is
> measured with exactly one named command. A drift exists **only** when the result of that same named measurement
> differs.

| Metric | Baseline | How it is measured — use this exact command, no substitute |
|---|---:|---|
| **Physical lines** | **135** | `Get-Content -LiteralPath src\modules\listings\components\ListingsFilterBar.tsx \| Measure-Object -Line` |
| `className=` | **13** | `Select-String -Path <file> -Pattern 'className=' -AllMatches` → count of matches |
| shadcn `<Button` | **4** | `Select-String -Path <file> -Pattern '<Button' -AllMatches` → count of matches |
| legacy `<Combobox` | **1** | `Select-String -Path <file> -Pattern '(?<![A-Za-z])<Combobox' -AllMatches` → count of matches |

`FACT`, all four. `git hash-object` of the measured file is `81ee08e67993612d1489a0cf9395a8f558b6eebb`, and the
worktree copy is identical to `HEAD` (the path is absent from `git status --porcelain`).

**Explanatory note, NOT a baseline: the file also contains `119` non-blank lines.** That number is recorded here
only because it circulated as a line count during design and matches `grep -c '[^[:space:]]'` exactly. **It is not
an acceptance census and no acceptance criterion may cite it.** A third figure, `134`, appears in
`Codex-tasks/listings-mantine-migration-plan-AUDIT.md:140`; it is the physical count at commit `ad1e32f60`
(2026-07-06) and is stale by exactly the one line commit `4254f3897` added (`data-testid="task775-advanced-filters"`,
Task 775). **`Codex-tasks/*` is a historical, gitignored planning audit and is out of scope for this task** (owner
decision, 2026-09-02): correcting it inside a production migration would be unjustified scope growth.

`INFERENCE`, and the reason the method is pinned above: three different numbers for one file were in circulation,
none of them labelled with its measuring instrument. That is the crude-census failure mode named in
`docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes" (corollary 710–714). Sprint 68 exit
criterion **1** makes a genuine drift a design blocker, so the drift test must be unambiguous.

`LocationCombobox` also appears once (`<LocationCombobox`, `:79`). It is a **different component** from the legacy
`<Combobox` and is deliberately excluded from the `<Combobox` count by the negative lookbehind in the command above.

### 3.2 `ListingsFilterBar.tsx` — what it actually is

- `FACT` `'use client'` (`:1`); props are exactly `{ locations: Location[]; onFiltersOpen: () => void }` (`:22-26`).
- `FACT` All state comes from `useListingsUrlFilters()` (`:32-35`); the component owns **no** `useState`.
  It destructures `get`, `updateParams`, `handlePropertyTypeChange`, `activeCount`, `propertyTypes`, `resetFilters`.
- `FACT` Root (`:48`): `<div className="listings-filter-bar hidden md:flex flex-wrap items-center gap-2 py-3 border-b">`.
  **The route visibility gate (`hidden md:flex`) lives inside the component**, which is the condition §3.6 requires
  moving.
- `FACT` Listing-type group (`:50-63`): a `div.flex.items-center.gap-1.shrink-0` mapping `['', 'sale', 'rent']` to
  **one** `<Button>` JSX element rendered 3×, `variant={listingType === type ? 'default' : 'outline'}`, `size="lg"`,
  `className="rounded-xl text-xs px-3 shrink-0"`, `onClick={() => updateParams({ type: type || null })}`.
- `FACT` Vertical rule (`:65`): `<div className="w-px h-6 bg-border shrink-0" />` — a 1px × 24px `--border` bar.
- `FACT` Property type (`:68-76`): legacy `<Combobox>` with `variant="button"`, `size="sm"`,
  `className="w-40 shrink-0"`, `onChange={v => handlePropertyTypeChange(v || null)}`.
  **It does not call `updateParams`** — it is the separate business path (§3.3).
- `FACT` Location (`:79-86`): `<LocationCombobox>` with `className="w-52 shrink-0"` and `portal`,
  `onChange={id => updateParams({ location_id: id ?? null })}`.
- `FACT` Premium toggle (`:89-97`): `<Button>` `variant={isPremium ? 'default' : 'outline'}`, `size="lg"`,
  `onClick={() => updateParams({ premium: isPremium ? null : 'true' })}`.
- `FACT` Spacer (`:100`): `<div className="flex-1 min-w-0" />`.
- `FACT` Reset (`:103-114`): rendered **only when `activeCount > 0`**; `<Button variant="ghost" size="lg"`
  `className="text-xs text-muted-foreground hover:text-destructive gap-1 shrink-0"` `onClick={resetFilters}>` with a
  lucide `X`.
- `FACT` Advanced filters (`:117-132`): `<Button>` carrying `data-testid="task775-advanced-filters"`,
  `variant="outline"`, `size="lg"`, `className="rounded-xl text-xs gap-1.5 shrink-0 relative"`,
  `onClick={onFiltersOpen}`, a lucide `SlidersHorizontal`, and — only when `activeCount > 0` — a
  **corner-overlay count badge** at `:128`:
  `<span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-2xs flex items-center justify-center font-bold">`.
  §3.7 is about that span, and it is the highest-risk element in this migration.
- `FACT` `propertyTypeOptions` (`:42-45`) prepends `{ value: '', label: tc('all_types') }` to
  `propertyTypes.map(pt => ({ value: pt.value, label: pt.label }))`.

### 3.3 `useListingsUrlFilters.ts` — the contract this task must not move

**Zero-diff file.** Read for contract, never edited.

- `FACT` `updateParams(updates)` (`:55-66`): clones `searchParams`, **deletes `page`**, then per entry deletes the
  key on `null`/`''` and sets it otherwise, and issues **one** `router.push`. Every other query param survives.
- `FACT` `handlePropertyTypeChange(pt)` (`:80-92`) is a **separate** path that does not go through `updateParams`:
  it deletes `page`, sets/deletes `property_type`, then deletes **every param of every section not in the new
  type's `visibleSections`** (`FILTER_SECTION_PARAMS`), and pushes once.
- `FACT` `resetFilters()` (`:74-76`) is `router.push(pathname)` — a bare pathname push with **no query string at
  all**. It is not `updateParams({...})` with nulls, and a test must assert the bare-pathname shape.
- `FACT` `activeCount = countActiveFilters(parseSearchParams(searchParams))` (`:111`).
- `FACT` `propertyTypes` comes from `usePropertyTypes()` (`:37`).

### 3.4 The visibility mechanism — read at source, both sides

- `FACT` `src/design-system/mantine/theme.ts:177` — `md: '48em'` with the in-file comment `// 768px — tablet`.
  The theme's `md` is **the same 768px** Tailwind's `md` uses, so the substitution below is breakpoint-preserving.
- `FACT` `node_modules/@mantine/core/esm/core/Box/Box.mjs:62-63` — `Box` emits the class
  `` `mantine-visible-from-${visibleFrom}` `` (and `` `mantine-hidden-from-${hiddenFrom}` ``) onto the root element.
- `FACT` `node_modules/@mantine/core/esm/core/MantineProvider/MantineClasses/MantineClasses.mjs:19` — `MantineClasses`
  generates, per theme breakpoint:
  `@media (max-width: <bp - 0.1px, in em>) { .mantine-visible-from-<bp> { display: none !important; } }`
  with `maxWidthBreakpoint = em(px(theme.breakpoints[bp]) - 0.1)`.
  `INFERENCE`: for `md: '48em'` (768px) that is `@media (max-width: 47.99375em) { … display: none !important }`,
  i.e. hidden **below** 768px and not hidden **at or above** 768px — the same boundary `hidden md:flex` produces.
- `FACT` Precedent for this exact substitution, in-repo and commented as such:
  `src/components/layout/HeaderView.tsx:121-124` — *"`visibleFrom="md"` replaces `hidden md:flex`"*.
- `FACT` Precedent for **testing** it rather than trusting the prop:
  `src/components/layout/__tests__/mobileBottomNav.smoke.test.tsx:110-114` asserts
  `expect(nav.className).toContain('mantine-hidden-from-md')`, with the file's own header explaining the point —
  *"the container's root genuinely carries the Mantine-emitted `mantine-hidden-from-md` class, not just the
  `hiddenFrom` prop being passed."*

`INFERENCE`, and the one mechanism difference the executor must measure rather than assume: `hidden md:flex` sets
`display:flex` on **the bar's own root** at ≥768px. A wrapper `<Box visibleFrom="md">` is a `div` at its default
`display:block`, and the flex row is supplied by the bar's own Mantine root inside it. For a full-width row these
are expected to be equivalent, **but AC5 measures it instead of asserting it.**

### 3.5 Why the story cannot inherit the current visibility gate — measured, not argued

- `FACT` `scripts/check-stories-rendered.mjs:395-400` — `MANTINE_VIEWPORTS` is exactly
  `mobile-320 / mobile-375 / mobile-390 / desktop-1024`.
- `FACT` `:115` — `LOCALES = ['sq','en','uk','it']`.
- `FACT` `MANTINE_STORY_EXTRA_VIEWPORTS` (`:420-457`) has entries only for `HeroSearch`, `ListingDetailPattern`,
  `HomeSection`, `PopularLocationsView` and `HowItWorksSteps`. **`ListingsFilterBar` is absent**, and this task adds
  no entry.
- `FACT` `MANTINE_OVERLAY_PRIMITIVES` (`:359-387`) does **not** contain `ListingsFilterBar`, so `openTrigger` is
  `false` and the harness will not click anything open.
- `FACT` `grep -n "ListingsFilterBar" scripts/check-stories-rendered.mjs scripts/check-story-coverage.mjs scripts/check-locale-leak.mjs` → **absent from all three**.
- `INFERENCE`: **one** exported story ⇒ exactly **16** new cells (4 viewports × 4 locales).
- `INFERENCE`, and this is the whole reason §3.6 exists: three of those four viewports are **320 / 375 / 390**, all
  below 768. If the bar kept its own `hidden md:flex`/`visibleFrom="md"`, **12 of the 16 cells would render an
  element with `display:none`** — a blank or contentless capture that proves nothing while still counting as a
  passing cell. Moving the gate to the host is what makes all 16 cells real UI.

### 3.6 The visibility relocation — exact shape

`ListingsShellView.tsx:76-79` currently renders the bar bare:

```tsx
<ListingsFilterBar
  locations={locations}
  onFiltersOpen={onFiltersOpen}
/>
```

After this task it is wrapped, and **only** wrapped:

```tsx
<Box visibleFrom="md">
  <ListingsFilterBar locations={locations} onFiltersOpen={onFiltersOpen} />
</Box>
```

- The wrapper carries **no** `className`, no `style`, no width, no CSS module, and no other prop.
- `ListingsFilterBar`'s own root loses `hidden md:flex` entirely; it must **not** carry `visibleFrom`/`hiddenFrom`.
- `ListingsShellView.tsx`'s `className=` count stays **13** and those 13 stay byte-identical (§3.9 AC7).

### 3.7 The corner count badge — the trap, verified at source

The advanced-filters control at `:117-132` is a `<Button>` containing an **absolutely positioned** corner badge
(`absolute -top-1.5 -right-1.5`). Reproducing that markup inside a Mantine `Button` would reintroduce a defect this
repository has already diagnosed and fixed once:

- `FACT` `node_modules/@mantine/core/styles/Button.css` — the Button root class `.m_77c9d27d` declares
  `position: relative;` **and `overflow: hidden;`**. (Read directly in this session; not taken from a comment.)
- `FACT` `src/design-system/mantine/patterns/MantineCountButton.tsx` header records the same thing as measured
  history: *"The round-1 implementation put the count in an absolute-positioned corner `<span>`
  (`position:absolute -top-1.5 -right-1.5`) overlapping the button's edge — Mantine `Button`'s own root has
  `overflow:hidden` …, which genuinely clipped that corner badge."*
- `INFERENCE`: an absolutely positioned corner badge placed **inside** a Mantine `Button` is clipped. It must be
  placed **outside** the Button's box, which is exactly what Mantine `Indicator` does.
- `FACT` In-repo `Indicator` precedent: `src/modules/notifications/components/NotificationBellView.tsx:30-37` wraps
  an `ActionIcon` in `<Indicator inline label={…} disabled={unreadCount === 0}>`.
- `FACT` `Indicator`'s `disabled` prop is the canonical "render no dot" switch — `NotificationBellView` uses
  `disabled={unreadCount === 0}` for precisely this component's `activeCount > 0` condition.

### 3.8 Canonical-source searches actually performed

- `FACT` `grep -rn "ListingsFilterBar" src/ scripts/ --include=*.tsx --include=*.ts --include=*.mjs --include=*.json`
  → the component's own file; `ListingsShellView.tsx:13` (import) and `:76` (sole render site); two entries in
  `scripts/governance/reports/*.json`; one entry in `scripts/governance/tailwind-entropy.allowlist.json`.
  **`ListingsShellView.tsx:76` is the single production consumer** — the named in-scope consumer that satisfies the
  permanent-story creation gate. No test, story or comment hit competes with it.
- `FACT` `grep -n "ListingsFilterBar" docs/critical-flow-registry.md` → **no match**. The surface is not registered.
- `FACT` `scripts/governance/tailwind-entropy.allowlist.json:307-316` holds an `arbitrary-font-size` entry for
  `src/modules/listings/components/ListingsFilterBar.tsx` with pattern `text-[10px]`. **The file does not contain
  `text-[10px]`** — `:128` uses the named utility `text-2xs` (defined at `src/app/globals.css:173` as `0.625rem`).
  `FACT` `scripts/governance/tailwind-entropy.mjs:35` builds `allowedKeys` as a `Set` of `` `${file}:${pattern}` ``
  used **only to skip** a detected violation (`:204`). `INFERENCE`: the entry is already inert today and stays inert
  after this task — an orphaned allowlist row cannot fail the gate. **Do not delete it and do not add one** (§8).
- `FACT` `src/components/shared/PropertyTypeCombobox.tsx` exists and wraps `MantineCombobox`. It was opened in full
  and **rejected as the owner for this artifact** — see §10.2.

### 3.9 The two host files' current counts

| File | Physical lines | `className=` | `<Button` | Note |
|---|---:|---:|---:|---|
| `src/modules/listings/components/ListingsFilterBar.tsx` | **135** | **13** | **4** | §3.1 |
| `src/modules/listings/components/ListingsShellView.tsx` | **166** | **13** | **1** | The single `<Button` at `:143` is the "show more" control and **stays legacy**. All 13 `className` stay byte-identical. |

`FACT`. The `ListingsShellView` figures are the post-778 state (778 reduced it from 14 to 13 `className` when the
`Sheet` became `MantineDrawer`).

### 3.10 Storybook mechanics already proven by 778 — no longer a checkpoint

- `FACT` `scripts/lib/mantine-story-scope.mjs:15` — a title starting `Patterns/Mantine/` **is** the
  canonical-Mantine assertion consumed by `check-stories-rendered.mjs`, `check-locale-leak.mjs` and
  `check-story-coverage.mjs`.
- `FACT` `scripts/check-story-coverage.mjs` — a component listed in `scripts/mantine-migration-scope.json` must be
  **statically imported** by ≥1 canonical Mantine story or the gate fails.
- `FACT` `scripts/mantine-migration-scope.json` currently holds **21** entries; `ListingsFilterBar.tsx` is not among
  them (full file read in this session).
- `FACT` `src/stories/patterns/mantine/ListingsFilters.stories.tsx:34-46` ships
  `parameters.nextjs.navigation.{pathname,query}`, and Task 778 closed `APPROVED WITH NOTES` with all 16 of its
  cells passing and `check:stories` at **132 files, 0 violations, exit 0**
  (`docs/sessions/2026-09-01-task778-listings-filters-mantine.md:222`).
  `INFERENCE`: the `nextjs.navigation.query` → `useSearchParams()` mechanism is **verified in a built Storybook**,
  not merely at source. It is therefore an established mechanism for this task rather than a `BLOCKED` checkpoint —
  but §13 V2 still requires the executor to confirm the seeded state actually rendered (§13 V2), because a mechanism
  that works is not proof that *this* story's query produced *this* story's expected state.
- `FACT` `messages/{sq,en,uk,it}.json` all carry `storybook.mantine.combobox_option_tirana` and `…_durres`.
- `FACT` `common.no_results` is the established key for `MantineCombobox`'s **required** `noResultsLabel` prop —
  used by `LocationCombobox.tsx:126`, `PhoneField.tsx:161`, `PropertyTypeCombobox.tsx:45`, `YearCombobox.tsx:59`.

### 3.11 Known Storybook condition inherited from 778

`FACT` `src/hooks/usePropertyTypes.ts` — `buildFallback()` returns `PROPERTY_TYPES.map(pt => ({ value: pt.value, label: pt.value }))`,
i.e. the **raw enum value as the label**, and `fetchForLocale` falls back to it on any fetch failure. Storybook has
no `/api/property-types`. `INFERENCE`: the new story's property-type combobox will show raw lowercase enum labels
(`apartment`, `house`, …) in **every** locale. This is the condition Task 675 recorded as `NOT VERIFIABLE` and
reserved as **Task 679**; `scripts/check-locale-leak.mjs`'s global allowlist entry `/^\.|^[a-z]/` means it cannot
trip that gate. **Record it; do not localise it, allowlist it, or stub the hook.**

---

## 4. Requirements — ledger

| ID | Source | Observable requirement | Pri | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Owner | `ListingsFilterBar.tsx` renders through Mantine primitives only: no `@/components/ui/button`, no `@/components/shared/Combobox`, no `cn`, **0** `className=`, no raw width, no Tailwind utility string, no CSS module, no new allowlist entry. | P0 | §13 S1 post-census + `git diff` | Confirmed |
| **R2** | Owner · §3.3 | Every filter change stays an **immediate single** `updateParams` call: other query params preserved, only `page` reset. No draft/batch state; no `useState` holding filter values. | P0 | AC2 + T1/T2 | Confirmed |
| **R3** | Owner · §3.3 | Property type keeps calling **`handlePropertyTypeChange`**, not `updateParams`, so inapplicable dependent params are still dropped. | P0 | AC3 + T3 | Confirmed |
| **R4** | Owner · §3.3 | Reset keeps calling **`resetFilters`**, producing a bare `router.push(pathname)` with no query string. | P0 | AC4 + T4 | Confirmed |
| **R5** | Owner · §3.2 | Advanced filters keeps calling the existing **`onFiltersOpen`** and nothing else — zero `router.push`. | P0 | AC4 + T5 | Confirmed |
| **R6** | Owner · §3.4-3.6 | Route visibility moves to a thin `<Box visibleFrom="md">` in `ListingsShellView.tsx`; the bar itself carries no visibility gate; the 768px boundary is unchanged. | P0 | AC5 + T6 | Confirmed |
| **R7** | Owner · §3.5 | The story renders the real `ListingsFilterBar` **without** the visibility wrapper, so all 16 cells contain real UI; the bar is Mantine-responsive at 320/375/390. | P0 | AC6 + AC8 | Confirmed |
| **R8** | Owner · §3.7 | The active-count badge is rendered by Mantine `Indicator` **outside** the Button box. An absolutely positioned badge inside a Mantine `Button` is forbidden. | P0 | AC7 | Confirmed |
| **R9** | Owner · §3.10 | New story `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx`, title `Patterns/Mantine/ListingsFilterBar`, **statically** importing the real component, exactly one export. | P0 | AC9 + `check:story-coverage` | Confirmed |
| **R10** | Owner · §3.10 | `scripts/mantine-migration-scope.json` gains **exactly one** entry (`…/ListingsFilterBar.tsx`), array length **21 → 22**. `ListingsShellView.tsx` is **not** added. | P0 | AC10 | Confirmed |
| **R11** | Owner · Sprint 68 exit 3 | Zero diff to the filter URL contract, the SSR query, `listings_restore`, favourites and currency. `useListingsUrlFilters.ts` is a **zero-diff file**. | P0 | AC11 + `git diff --stat` | Confirmed |
| **R12** | Sprint 68 D775-A/B/C | The migrated file consumes **Mantine tokens only** — no raw px/rem/hex, no `design-tokens-allow:` marker, no `--space-*`/Tailwind var, no 1536. | P0 | AC12 (`check:design-tokens:strict` + `governance:tailwind`) | Confirmed |
| **R13** | D68-2 | Rendered acceptance is **differential**: clean pre-edit baseline **B**, post-edit **P**, `P \ B = ∅`, and all 16 new cells PASS. Pre-existing global FAIL/AMBIGUOUS are **not** blockers. | P0 | AC13 + §13 S2/V8 | Confirmed |
| **R14** | Owner · §10.3 | Every accepted canonical change (CC1–CC8) is reported with a **measured** before/after value. A "visually neutral" claim is a finding. | P0 | AC14 | Confirmed |
| **R15** | Owner · §3.8 | `ListingsShellView.tsx` is edited **only** for the visibility wrapper; its 13 `className` values stay byte-identical and it is **not** enrolled as canonical Mantine. | P1 | AC5 + AC10 | Confirmed |

---

## 5. Assumptions and open questions

- `A1` **(assumption, reversible)** One story export is sufficient, keeping the new-cell count at **16** (§3.5). If
  the executor adds a second export the count becomes 32 and §13 V8's arithmetic must be **re-derived, not copied**.
- `A2` **(assumption, reversible)** No new `storybook.mantine.*` i18n key is required: the story's only fixture
  strings are the two location names, and `combobox_option_tirana`/`_durres` already exist in all four locales
  (§3.10). Every other visible string is the component's own runtime `common`/`listing` copy. **If a literal turns
  out to be needed, it goes through `storyT` with the key added to all four `messages/*.json` and
  `npm.cmd run check:i18n` re-run** — never as a raw literal.
- `A3` **(known limitation, out of scope — do not fix here)** The story renders raw lowercase enum labels in the
  property-type combobox in every locale (§3.11, Task 679). Record it in the completion report.
- `A4` **(assumption)** `useExchangeRate()`/`useCurrencies()` have no endpoint in Storybook. `ListingsFilterBar`
  does not render currency or rate output, so this is inert for this story — unlike 778, where it mattered.
- `Q1` **(open, non-blocking, do NOT act on it here)** `MantineCountButton` is the canonical primitive for a
  "filters trigger + active count" and `HeroSearchView.tsx:128` already uses it for the *same semantic artifact*.
  This task deliberately does not adopt it (§10.2) because it would relocate the count from a corner overlay to an
  inline `rightSection` pill — a larger visual change than the owner authorised for this slice. **Recorded as a
  convergence candidate for the final `ListingsShellView` slice, not deferred silently.**
- `UNKNOWN` The rendered pixel effect of CC1/CC2 (the two comboboxes losing their fixed 160px/208px widths) at each
  of the 16 cells. It is bounded and measured by the capture; it is not predicted here.

---

## 6. Pre-read rule bundle

Read these and nothing else by default. **Do not write "read all docs".**

**Always required** — `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md`.

**Current Mantine path** — `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/ui-rules.md` (routing/legacy-boundary notes only) · `docs/qa-rules.md`.

**Storybook / visual proof** — `docs/storybook-governance.md` (**§14.1-14.4**, **§14.9.17**, **§14.11**, **§15**) ·
`docs/storybook-visual-snapshots.md`.

**Sprint** — `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` (Goal · Preconditions ·
Exit criteria · Decisions **D775-A/B/C**, **D68-2**) · the Task **778** kickoff and
`docs/sessions/2026-09-01-task778-listings-filters-mantine.md` for the differential-baseline shape this task repeats.

**Source to read before editing** — `src/modules/listings/components/ListingsFilterBar.tsx` ·
`src/modules/listings/components/ListingsShellView.tsx` · `src/modules/listings/hooks/useListingsUrlFilters.ts`
(read-only) · `src/design-system/mantine/patterns/MantineCombobox.tsx` (props `:30-103`) ·
`src/components/shared/LocationCombobox.tsx` (props `:35-56`) ·
`src/design-system/mantine/patterns/MantineCountButton.tsx` (header comment — the clipping history) ·
`src/modules/notifications/components/NotificationBellView.tsx:30-37` (the `Indicator` precedent) ·
`src/components/layout/HeaderView.tsx:121-124` (the `visibleFrom="md"` precedent) ·
`src/components/layout/__tests__/mobileBottomNav.smoke.test.tsx` (the visibility-test precedent) ·
`src/design-system/mantine/theme.ts` (breakpoints `:174-181`, spacing `:200-213`, radius `:216-225`, Button
`:318-330`) · `src/stories/patterns/mantine/ListingsFilters.stories.tsx` (the story template).

**Execution protocol** — `.claude/skills/execute-task/SKILL.md` (auto-loaded).

---

## 7. Scope

Exactly these paths may be edited:

| # | Path | Change |
|---|---|---|
| 1 | `src/modules/listings/components/ListingsFilterBar.tsx` | Full Mantine migration (R1–R5, R8). |
| 2 | `src/modules/listings/components/ListingsShellView.tsx` | **Lines 76-79 only**, plus the `Box` import: wrap the bar in `<Box visibleFrom="md">` (§3.6). Nothing else in the file. |
| 3 | `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx` | **New file** (R9, §10.4). |
| 4 | `scripts/mantine-migration-scope.json` | Append `ListingsFilterBar.tsx` — 21 → 22 (R10). |
| 5 | `src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx` | **New file** — the §13 S3 suite. |
| 6 | `docs/backlog.md` · `docs/sessions/2026-09-02-task779-listings-filter-bar-mantine.md` | State + session log. |

Evidence transcripts are retained under `docs/sessions/evidence/task779/` — **the path is named here deliberately**,
matching the convention already on disk for tasks 771/774/775/777/778.

---

## 8. Out of scope — a diff touching any of these is rejected, not noted

- `src/modules/listings/hooks/useListingsUrlFilters.ts` — **zero diff**. Read only.
- `ListingsFilters` · `ListingsStatusTabs` · `ActiveFilterChips` · `ListingsPagination` · `ListingCard`.
- **`ListingsSortBar` and `SaveSearchButton`** — **Task 772** (Sprint 66, `KICKOFF FILED`) owns `ListingsSortBar`
  and its R4 forbids migration on that file; Sprint 68 exit criterion **4** binds this task. Do not touch either.
- The SSR query in `src/app/[locale]/listings/page.tsx`, the `listings_restore` session-storage flow, the favourites
  set, and currency behaviour (Sprint 68 exit criterion **3**).
- **Re-migrating any leaf**: `LocationCombobox`, `MantineCombobox`, `PropertyTypeCombobox`. They are consumed as-is;
  **no leaf API change is required by this task** (§10.2) — unlike Task 778, which needed one.
- Everything in `ListingsShellView.tsx` other than the import line and lines 76-79 — including all 13 `className`
  values, the empty state, the grid/list ternary, the "show more" `Button`, and the `MantineDrawer` 778 shipped.
- **`Codex-tasks/*`** — historical, gitignored planning audit. Its stale `134` figure is explained in §3.1 and
  **must not be edited** (owner decision, 2026-09-02).
- **`scripts/governance/tailwind-entropy.allowlist.json`** — the orphaned `ListingsFilterBar` row is inert (§3.8).
  Do not delete it and do not add one.
- `docs/critical-flow-registry.md` — the surface has no row (§3.8); do not create one.
- Any fix for the raw enum labels (**Task 679**) or the standing global FAIL/AMBIGUOUS cells.

---

## 9. Current and required behavior

| # | Current (measured, §3) | Required after | Classification |
|---|---|---|---|
| B1 | Root `div` carries `hidden md:flex flex-wrap items-center gap-2 py-3 border-b`; visibility is **inside** the component. | Bar root is a Mantine `Group` (wrap on) with `gap="xs"`, `py="sm"`, and a `Divider` supplying the bottom rule. **No visibility gate in the component.** Visibility is a `<Box visibleFrom="md">` in `ListingsShellView`. | **Relocated**, CC8 + §3.6. |
| B2 | Listing-type row: 3× shadcn `Button` `variant default/outline`, `size="lg"`, `rounded-xl text-xs px-3`, gap `4px`. | 3× Mantine `Button` `variant="filled"`/`"default"`, **theme default size** (`size="lg"`/`"xl"` banned, Task 520), theme radius, `gap="xs"` (8px). `onClick` wiring byte-identical. | **Changed — canonical**, CC3/CC5. |
| B3 | Vertical rule: `div.w-px.h-6.bg-border` (1×24px, `--border`). | Mantine `Divider orientation="vertical"` `color="gray.3"`. Height becomes flex-stretch rather than a fixed 24px. | **Changed — provenance-backed**, CC6. |
| B4 | Property type: legacy `<Combobox variant="button" size="sm" className="w-40 shrink-0">` → `handlePropertyTypeChange`. | `MantineCombobox` `variant="button"`, `noResultsLabel={tc('no_results')}`, **no fixed width**. `onChange={v => handlePropertyTypeChange(v || null)}` unchanged. | **Changed — canonical**, CC1. |
| B5 | Location: `LocationCombobox className="w-52 shrink-0" portal`. | Same component, same `portal`, **`className` dropped** (it is a Tailwind utility string, R1). Width becomes the leaf's own default. | **Changed — canonical**, CC2. |
| B6 | Premium toggle: shadcn `Button` `variant default/outline`, `size="lg"`. | Mantine `Button` `variant="filled"`/`"default"`, theme default size. `onClick` wiring byte-identical. | **Changed — canonical**, CC3/CC5. |
| B7 | Spacer `div.flex-1.min-w-0` pushes reset + advanced to the right. | The same right-alignment expressed with Mantine layout composition (e.g. a parent `Group justify="space-between"` over two child `Group`s). **No `flex-1` utility, no raw width.** | **Preserved intent — mechanism changed**, CC8. |
| B8 | Reset: shadcn `Button variant="ghost"`, `text-muted-foreground hover:text-destructive`, rendered only when `activeCount > 0`. | Mantine `Button variant="subtle" color="gray"`, still rendered only when `activeCount > 0`, still `onClick={resetFilters}`. **The destructive hover tint is not reproduced.** | **Changed — canonical, with a deliberate loss**, CC7. |
| B9 | Advanced filters: shadcn `Button variant="outline"` with an **absolutely positioned corner** count span (`:128`), `data-testid="task775-advanced-filters"`. | Mantine `Button variant="default"` wrapped in `Indicator` with `label={activeCount}` and `disabled={activeCount === 0}`. **`data-testid="task775-advanced-filters"` is preserved verbatim** — Task 775's route probe reads it. | **Changed — mechanism forced by §3.7**, CC4. |
| B10 | Count badge chrome: `h-4 w-4 rounded-full bg-primary text-primary-foreground text-2xs font-bold`. | `Indicator` defaults, brand colour. **No `size`/`offset` prop** — Task 777's precedent (Mantine default accepted, no raw-pixel CSS) governs. | **Changed — canonical default adopted**, CC4. |
| B11 | Every filter writes immediately; no draft state anywhere. | Identical. **No `useState` for filter values may be introduced.** | **Preserved — P0.** |
| B12 | Route: bar hidden below 768px, visible at ≥768px. | Identical boundary, produced by `<Box visibleFrom="md">` over `theme.breakpoints.md = '48em'` (§3.4). | **Preserved — P0**, AC5. |

---

## 10. Implementation requirements

### 10.1 Visual source map

| Visible artifact | Current markup | Class/selector | Utility → cascade → token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Bar visibility gate | `ListingsFilterBar.tsx:48` | `hidden md:flex` | Tailwind `md` = 768px | **Relocated** → `Box visibleFrom="md"`, `theme.breakpoints.md='48em'`=768px | §3.4, AC5 |
| Bar bottom rule | `:48` | `border-b` | `--border` → `--neutral-200` → **#EBEBEB** | **Changed** → `Divider color="gray.3"` **#D0D5DD** | CC6 (D2, Task 671) |
| Bar vertical padding | `:48` | `py-3` | 0.75rem = 12px | **Preserved exactly** → `py="sm"` (`theme.ts` spacing `sm: '0.75rem'` = 12px) | CC8 |
| Bar item gap | `:48` | `gap-2` | 0.5rem = 8px | **Preserved exactly** → `gap="xs"` (`theme.ts` spacing `xs: '0.5rem'` = 8px) | CC8 |
| Listing-type inner gap | `:50` | `gap-1` | 0.25rem = 4px | **Changed** → `gap="xs"` = 8px. There is **no 4px step** in this theme's spacing scale, and a raw `gap={4}` is forbidden by R12. | CC8 |
| Vertical rule | `:65` | `w-px h-6 bg-border` | 1px × 24px, **#EBEBEB** | **Changed** → `Divider orientation="vertical" color="gray.3"`, flex-stretch height | CC6 |
| Control radius | `:57`,`:93`,`:122` | `rounded-xl` | 0.75rem = 12px | **Changed** → theme `defaultRadius: 'lg'` = **8px** (`theme.ts:225`) | CC3 |
| Control font size | `:57`,`:93`,`:108`,`:122` | `text-xs` | 0.75rem | **Changed** → Mantine Button default `--mantine-font-size-sm` | CC3 |
| Control size | `:56`,`:92`,`:106`,`:121` | `size="lg"` | shadcn lg | **Changed** → theme default. `size="lg"`/`"xl"` are **banned** (Task 520) | CC5 |
| Property-type width | `:75` | `w-40 shrink-0` | 10rem = 160px | **Changed** → `MantineCombobox` default `triggerWidth` `{base:'100%', sm:'auto'}`. A raw width is forbidden by R12. | CC1 |
| Location width | `:84` | `w-52 shrink-0` | 13rem = 208px | **Changed** → `className` dropped; leaf default width | CC2 |
| Right-alignment spacer | `:100` | `flex-1 min-w-0` | flex grow | **Changed mechanism** → Mantine layout composition | CC8 |
| Reset colour | `:108` | `text-muted-foreground hover:text-destructive` | `--muted-foreground` → **#8C8C8C**; hover → `--destructive` | **Changed** → `variant="subtle" color="gray"`; **hover tint not reproduced** | CC7 |
| Count badge | `:128` | `absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-2xs font-bold` | `--primary` → `--brand-700` → `--mantine-color-brand-7` **#EC5447** | **Changed mechanism (forced)** → `Indicator`, brand colour, Mantine default size | CC4, §3.7 |
| "Show more", empty state, grid ternary, pagination row | `ListingsShellView.tsx:87-160` | 13 remaining `className` | legacy Tailwind | **Out of scope — preserved verbatim** | §8, AC5 |

### 10.2 Canonical UI decision record

Searched: full listing of `src/stories/patterns/mantine/` (22 files) and `src/stories/mantine/primitives/`;
`src/design-system/mantine/patterns/` (full listing + `index.ts`); `scripts/mantine-migration-scope.json` (full
file); `grep -rn "visibleFrom=\|hiddenFrom=" src/`; `grep -rn "<Divider\|<Indicator\|<Badge" src/`;
`grep -rn "noResultsLabel=" src/`; `grep -rn "ListingsFilterBar" src/ scripts/ docs/critical-flow-registry.md`.
**Each candidate below was opened at source, not matched by filename.**

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Route visibility gate | `HeaderView.tsx:121-124`, `:152-156`, `:176` · `HeaderActions.tsx:51` · `MobileBottomNavView.tsx:36` · `MantineAppShellFoundation.tsx:64,72,95` · `Box.mjs` · `MantineClasses.mjs` | Mantine `Box` `visibleFrom` — precedent commented in `HeaderView.tsx:121` as the replacement for `hidden md:flex` | **reuse** | `<Box visibleFrom="md">` in `ListingsShellView`. No `className`, no CSS module, no `style`. |
| Bar row layout | `theme.ts` spacing · `FiltersPanel`/`MantineFilterSection` composition · `HeroSearchView` | Mantine `Group` | **reuse** | `gap="xs"`, `py="sm"`, wrap enabled. Right-hand controls via Mantine layout composition, never `flex-1`. |
| Horizontal + vertical rules | `MobileNavDrawer.tsx:56,97,122` (`Divider color="var(--border)"`) · `MantineDataTableToCards.tsx:312,328` (`Divider color="gray.1"`) · `MantineFilterSection.tsx:23-24` | Mantine `Divider`, `color="gray.3"` | **reuse** | `color="gray.3"` per **D2** (Task 671), recorded in `MantineFilterSection.tsx:23-24` as *"matching `MantineDrawer`'s own header/footer border tokens rather than the legacy shadcn `--border`"*. `MobileNavDrawer`'s `color="var(--border)"` is the **legacy** form and must **not** be copied into a new Mantine surface. |
| Property-type combobox | `MantineCombobox.tsx` props `:30-103` read in full · `PropertyTypeCombobox.tsx` read in full · `YearCombobox.tsx` · `PhoneField.tsx:161` | `MantineCombobox`, `variant="button"` | **reuse the primitive; `PropertyTypeCombobox` inspected and REJECTED as owner** | `PropertyTypeCombobox` builds its options from the **static** `PROPERTY_TYPES` constant with `tl(pt.labelKey)` (`:25-33`), whereas this bar's options come from the **hook's dynamic** `propertyTypes` (`useListingsUrlFilters.ts:37` → `usePropertyTypes()`), whose items already carry a resolved `label`. Substituting it would silently change the option source and the label pipeline. It also still carries `cn()` and the Tailwind string `sm:w-48 shrink-0` (`:36`) and is **not** in the migration scope — importing it into a Mantine-clean file would import Tailwind back in. Consume `MantineCombobox` directly with `noResultsLabel={tc('no_results')}` (§3.10). **No leaf edit.** |
| Location combobox | `LocationCombobox.tsx:35-56` read in full · already in `mantine-migration-scope.json` | `LocationCombobox` | **reuse as an already-migrated leaf** | Keep `portal`. **Drop `className`** — it is optional (`:41`, `:114` `cn('location-combobox', className)`), so dropping it needs **no leaf API change**. |
| Filter toggles (type / premium) | `theme.ts:318-330` · `FiltersPanel` Task 567 precedent (registry row 55) · `HeroSearchView` | Mantine `Button`, theme-configured | **reuse** | `variant="filled"` selected / `variant="default"` unselected — the exact substitution Task 567 made for the same artifact class. Theme default size; `size="lg"`/`"xl"` banned (Task 520). The ≥44px touch floor comes from `theme.ts:328` `minHeight: '2.75rem'`, **not** from a value in this file. |
| Reset control | `theme.ts` Button variants · Task 567 precedent | Mantine `Button variant="subtle" color="gray"` | **reuse** | The `hover:text-destructive` tint has no canonical equivalent and is **not** reproduced — recorded as CC7, not silently dropped. |
| Active-count badge on the advanced-filters trigger | `MantineCountButton.tsx` read in full · `NotificationBellView.tsx:30-37` · `@mantine/core/styles/Button.css` (`.m_77c9d27d`) · `HeroSearchView.tsx:128-132` | Mantine `Indicator`, precedent `NotificationBellView.tsx:30` | **reuse `Indicator`; `MantineCountButton` inspected and REJECTED for this slice** | `MantineCountButton` is the canonical "filters trigger + count" primitive and `HeroSearchView` already uses it for the same semantic artifact — but it renders the count **inline** in `rightSection`, relocating a corner overlay into the button's label row. That is a larger visual change than this slice authorises; recorded as **Q1**, a convergence candidate, not a silent exclusion. `Indicator` keeps the corner overlay **and** structurally avoids the `overflow:hidden` clip (§3.7) because it wraps the Button rather than sitting inside it. |
| The migrated `ListingsFilterBar` itself | `check-story-coverage.mjs` · `mantine-story-scope.mjs` · full `src/stories/**` listing | **none exists** | **create canonical** | New `Patterns/Mantine/ListingsFilterBar` story (§10.4). Its in-scope production consumer is named: **`ListingsShellView.tsx:76`**, the sole render site in `src/` (grep-confirmed, §3.8). This is a real production surface, not a gate probe, so the permanent-story creation gate is satisfied on the **named-consumer** arm. No probe is used by this task, so no `git hash-object` restoration evidence is required. |

**No requested visual value lacks provenance**, so this task is not `BLOCKED — CANONICAL STYLE DECISION REQUIRED`.

### 10.3 Accepted canonical changes — recorded, not masked

**These are not "zero visual change". Any completion report or review that describes this migration as visually
neutral is wrong and must be corrected (AC14).**

- **CC1 — the property-type combobox loses its fixed 160px width.** `className="w-40 shrink-0"` is a Tailwind
  utility string (R1) and a raw width (R12). `MantineCombobox`'s default `triggerWidth` is
  `{ base: '100%', sm: 'auto' }` (`MantineCombobox.tsx:58-62`), so the trigger becomes full-width below `sm` and
  content-width above it. **Measure the before/after trigger box at 1024; do not assert equality.**
- **CC2 — the location combobox loses its fixed 208px width**, for the same reason. `LocationCombobox`'s
  `className` is optional, so this needs no leaf change.
- **CC3 — control chrome adopts theme defaults**: radius `rounded-xl` (12px) → `defaultRadius: 'lg'` (**8px**,
  `theme.ts:225`); `text-xs` → the Button's own `--mantine-font-size-sm`.
- **CC4 — the count badge changes mechanism, and it is forced.** The corner `<span>` at `:128` cannot be reproduced
  inside a Mantine `Button` (`overflow: hidden` on `.m_77c9d27d`, §3.7). It becomes a Mantine `Indicator` wrapping
  the Button, with **no `size` and no `offset` prop** — Task 777's closure established that a Mantine default
  control size is accepted over a raw-pixel reproduction. Colour stays brand (**#EC5447**, `brand-7`). Measure the
  before/after badge box and position.
- **CC5 — `size="lg"` is dropped from all four controls.** Banned by Task 520. Control height comes from the theme,
  which also supplies the ≥44px floor (`theme.ts:328`).
- **CC6 — both rules change colour #EBEBEB → #D0D5DD** (`gray-3`). Provenance: **D2** (Task 671), recorded in
  `MantineFilterSection.tsx:23-24`. The vertical rule additionally changes from a fixed 24px height to flex-stretch.
  **Do not re-litigate the colour and do not substitute `color="var(--border)"`.**
- **CC7 — the reset control loses its destructive hover tint.** `hover:text-destructive` has no canonical Mantine
  equivalent on a `subtle` gray button, and inventing one would be a local style. Recorded as a deliberate,
  owner-visible loss; if the owner wants it back it is a follow-up, not an in-slice improvisation.
- **CC8 — layout mechanism changes while the two measurable spacings are preserved exactly.** `py-3` → `py="sm"`
  (both 12px) and `gap-2` → `gap="xs"` (both 8px) are **exact token matches**. The listing-type inner `gap-1` (4px)
  has **no 4px step in this theme's spacing scale** and becomes `gap="xs"` (8px) — a real 4px change, measured.

### 10.4 The story — exact contract

Path `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx`, title **`Patterns/Mantine/ListingsFilterBar`**.

- **Static** `import { ListingsFilterBar } from '@/modules/listings/components/ListingsFilterBar'` — the coverage
  gate resolves the specifier from the AST (§3.10); a `dynamic()`/lazy import would not close the tuple.
- **Renders the real component directly, with NO visibility wrapper.** The story must **not** wrap it in
  `<Box visibleFrom="md">` and the component must not carry a gate of its own — that is the whole point of §3.6.
  All 16 cells must contain real UI, including 320/375/390.
- `parameters: { skipCanvas: true, layout: 'fullscreen', nextjs: { navigation: { pathname: '/listings', query: { … } } } }`.
  `layout:'centered'|'padded'` are forbidden (`check-stories.mjs`).
- The fixed `query` **must** produce `activeCount > 0`, because the reset control (`:103`) and the `Indicator` badge
  (`:127`) are both conditional on it — a story that leaves the bar unfiltered would silently omit two of the
  artifacts this task migrates. Seed at least `type`, `property_type` and `premium` so that the listing-type
  selected state, the property-type selection and the premium toggled state are all exercised. **Record the chosen
  query verbatim in the session log**, and confirm at V2 that the count badge and reset control actually rendered.
- `locations` fixture: two entries built from
  `storyT(locale, 'storybook.mantine.combobox_option_tirana' | '…_durres')`. **No raw string literal anywhere in the
  file.**
- `onFiltersOpen={() => {}}`.
- Exactly **one** export (`Default`). No per-locale and no per-viewport exports — locale and width come from the
  toolbar; width-named exports are rejected by `check-stories.mjs`.
- The story is a **permanent** artifact justified by a named in-scope production consumer
  (`ListingsShellView.tsx:76`), not a gate probe.

### 10.5 Storybook coverage boundary — required documentation

`scripts/mantine-migration-scope.json` gains **exactly one** entry:
`"src/modules/listings/components/ListingsFilterBar.tsx"` — array length **21 → 22**.

`ListingsShellView.tsx` **must not** be enrolled. After this task it still carries 13 Tailwind `className` values, a
shadcn `Button`, `ListingsSortBar`, `ListingsStatusTabs` and `ActiveFilterChips`. Enrolling it would assert, through
`scripts/lib/mantine-story-scope.mjs`, that the whole composite **is** canonical Mantine — the false assertion the
Task 678 comment in that file rejects, and what Sprint 68's "what this sprint does not inherit" item 2 forbids. It
is migrated in its own final slice, after its children. **Adding a thin Mantine `Box` to it does not change this.**

### 10.6 Detector scope — state the blind spot before building against it

`MANTINE_VIEWPORTS` is `320 / 375 / 390 / 1024` (§3.5). **The rendered gate therefore never captures a pixel between
391 and 1023, and in particular never captures 768.** The consequence is explicit and binding:

- The 16 story cells prove the **bar's own** responsive behaviour at 320/375/390/1024. They prove **nothing** about
  the route's 768px visibility boundary, because the story deliberately renders the bar without the wrapper.
- The **route visibility contract (R6/B12) is therefore proven by test, not by pixels** — §13 S3 T6, which asserts
  (a) the wrapper genuinely carries the Mantine-emitted `mantine-visible-from-md` class and (b)
  `theme.breakpoints.md === '48em'`, so the class name resolves to the intended 768px.
- **Do not** add a `MANTINE_STORY_EXTRA_VIEWPORTS` entry to close this. It would change the new-cell count from 16
  to 20 and break AC13's arithmetic, and the owner fixed the count at 16.
- **Do not** report a green rendered matrix as evidence that the 768px boundary is preserved. It is not in that
  gate's detection scope.

---

## 11. Positive and negative flows

### 11.1 Positive flow (the one the task must prove end to end)

1. A user opens `/listings` at 1024px. `ListingsShellView` renders; the `<Box visibleFrom="md">` wrapper does not
   carry `display:none` at this width, so the migrated bar is visible.
2. The bar renders the listing-type group (All / Sale / Rent), a vertical `Divider`, the property-type
   `MantineCombobox`, the `LocationCombobox`, the premium toggle, and — pushed right — the advanced-filters Button.
3. With no filters active, `activeCount === 0`: the reset control is **not rendered** and the `Indicator` is
   `disabled`, so no badge is shown.
4. The user clicks "Sale". `updateParams({ type: 'sale' })` fires **once**; `page` is deleted; every other query
   param survives. The Button switches to `variant="filled"`.
5. `activeCount` becomes non-zero: the reset control appears and the `Indicator` badge shows the count.
6. The user picks a property type. **`handlePropertyTypeChange`** fires — not `updateParams` — so params belonging
   to sections the new type does not show are dropped in the same single push.
7. The user picks a location. `updateParams({ location_id })` fires once.
8. The user toggles premium. `updateParams({ premium: 'true' })` fires once; toggling again sends `null`, which
   `updateParams` deletes.
9. The user clicks the advanced-filters Button. **`onFiltersOpen()` is called and zero `router.push` occurs** — the
   drawer 778 shipped opens.
10. The user clicks reset. **`resetFilters()`** fires, producing a bare `router.push(pathname)` with no query
    string; the reset control disappears again.
11. At 375px on the real route the bar is absent (`display:none` from `mantine-visible-from-md`), exactly as before;
    the mobile path remains the sort bar's drawer trigger.

### 11.2 Negative-flow applicability

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Zero active filters | **Yes** | `:103`, `:127` | Reset control **not rendered at all**; `Indicator` `disabled` so no badge (not a badge showing `0`). | T7 |
| Cleared filter value | **Yes** | `updateParams` `val === null \|\| val === ''` | The param is removed from the URL, never set to an empty string. Covers "All" listing type and the combobox clear row. | T1 |
| Property type cleared to "All" | **Yes** | `:71` `handlePropertyTypeChange(v \|\| null)` | `property_type` is deleted and `ALL_FILTER_SECTIONS` becomes applicable, so no dependent param is dropped. | T3 |
| Property-type change dropping a dependent param | **Yes** | `useListingsUrlFilters.ts:85-90` | The inapplicable param is absent from the pushed URL, in the **same single** push. | T3 |
| Empty `propertyTypes` (API unavailable) | **Yes** | `usePropertyTypes.ts` `buildFallback()` | The combobox still renders with the `all_types` clear row plus raw enum labels; no crash. This is the Storybook state (§3.11). | The 16 cells + A3 |
| Long uk / it labels at 320px | **Yes** | Q3 mobile stress + `theme.ts` Button `wordBreak` (Task 567 round-2 Fix 1) | Labels wrap; no `scrollWidth > clientWidth`; no clipped text. **This is only reachable in the story because the bar no longer hides itself** (§3.5). | The 320/375/390 × sq/en/uk/it cells |
| Count badge clipped by the host control | **Yes** | §3.7, `Button.css` `.m_77c9d27d` `overflow:hidden` | The badge is **outside** the Button box (`Indicator`) and is not clipped at any of the 16 cells. | AC7 + the 16 cells |
| Locale with no `storybook.*` key | **Yes** | `_storyI18n.ts` | `storyT` **throws** rather than silently falling back to English. | `check:stories` + `check:i18n` |
| Authorization / RLS | **No** | The bar performs no read or write; the SSR query and RLS are untouched | N/A | — |
| Offline / network failure | **No** | Existing global behaviour; `usePropertyTypes` already has its own catch-and-fallback path, which this task does not edit | N/A | — |
| Concurrent writer | **No** | No data model is written by this surface | N/A | — |
| SSR / hydration mismatch | **No** | `ListingsFilterBar` is rendered inside `ListingsShellView`, itself reached through `ListingsShell`'s existing client boundary; this task adds **no** `useMediaQuery` and no new client hook — `visibleFrom` is pure CSS, not a JS media query, so it introduces no server/client divergence | N/A | — |

---

## 12. Acceptance criteria

| # | Criterion |
|---|---|
| **AC1 [R1]** | **Given** `ListingsFilterBar.tsx` after the change, **when** it is grepped, **then** it contains **0** matches for `@/components/ui/button`, `@/components/shared/Combobox`, `from '@/lib/utils'`, `cn(`, and **0** `className=`; and `import` from `@mantine/core` is present. Record before → after against §3.1's **135 / 13 / 4 / 1**, using §3.1's named measurement commands. |
| **AC2 [R2]** | **Given** a URL carrying `sort`, `currency` and `page=3`, **when** the listing type or the premium toggle changes, **then** exactly **one** `router.push` fires, the pushed URL retains `sort` and `currency`, has **no** `page`, and contains the changed param. **And** no `useState` holding a filter value exists anywhere in `ListingsFilterBar.tsx`. |
| **AC3 [R3]** | **Given** `property_type=apartment` with a dependent param set, **when** the property type changes to a type whose schema omits that section, **then** `handlePropertyTypeChange` is the path taken and the dependent param is absent from the single pushed URL. |
| **AC4 [R4/R5]** | **Given** an active filter set, **when** reset is activated, **then** `resetFilters` produces a bare `router.push(pathname)` with **no** query string. **And when** the advanced-filters control is activated, **then** `onFiltersOpen` is called exactly once and **zero** `router.push` calls result. |
| **AC5 [R6/R15]** | **Given** `ListingsShellView.tsx` after the change, **then** the bar is wrapped in a `Box` whose rendered root carries the class `mantine-visible-from-md`; `ListingsFilterBar.tsx` contains **no** `visibleFrom`/`hiddenFrom`/`hidden md:`; the file's `className=` count is still **13** and those 13 are byte-identical to §3.9; and the wrapper carries no `className`, `style`, width or CSS module. |
| **AC6 [R7]** | **Given** the 16 captured cells, **then** every one of them renders the bar's real controls — at **320, 375 and 390** as well as 1024. A cell whose bar is absent or empty is a **failure**, not a pass. |
| **AC7 [R8]** | **Given** the advanced-filters control with `activeCount > 0`, **then** the count is rendered by Mantine `Indicator` **outside** the Button element, the badge is **not clipped** at any of the 16 cells, and `ListingsFilterBar.tsx` contains **no** `position:absolute`/`absolute` badge markup. **And** `data-testid="task775-advanced-filters"` is present, byte-identical. |
| **AC8 [R7]** | **Given** the 320/375/390 cells in all four locales, **then** no cell reports `scrollWidth > clientWidth` on the bar and no control label is clipped, with the long `uk`/`it` strings included. |
| **AC9 [R9]** | **Given** the new story, **then** `check:stories` and `check:story-coverage` both exit **0**, the title is exactly `Patterns/Mantine/ListingsFilterBar`, it contains exactly one export, it statically imports the real component, and `screenshots:assert` reports **16** cells for it, all PASS. |
| **AC10 [R10/R15]** | **Given** `scripts/mantine-migration-scope.json`, **then** it gained **exactly one** entry (`…/ListingsFilterBar.tsx`), the array length went **21 → 22**, and `ListingsShellView.tsx` does **not** appear in it. |
| **AC11 [R11]** | **Given** `git --no-optional-locks diff --stat`, **then** `src/modules/listings/hooks/useListingsUrlFilters.ts` is absent, no file outside §7's six paths appears, and no path listed in §8 appears. |
| **AC12 [R12]** | **Given** `check:design-tokens:strict` and `governance:tailwind`, **then** both exit **0**, the violation set does not grow, no violation is in a file this task touched, and the migrated file introduces **no** `design-tokens-allow:` marker, **no** raw px/rem/hex, and **no** new allowlist entry. |
| **AC13 [R13]** | **Given** baseline **B** and post-edit **P** from §13 S2/V8, **then** `P \ B = ∅` (compared as a set of normalized cell identities, **not** counts) and every one of the 16 new cells is PASS. Arithmetic must reconcile explicitly: `total(P) = total(B) + 16` and `pass(P) = pass(B) + 16`. |
| **AC14 [R14]** | **Given** the completion report and session log, **then** they state **CC1–CC8** as changes, each with a measured before/after value. **A "no visual change" or "visually neutral" claim anywhere is an automatic finding.** |
| **AC15** | **Given** the final gate list in §13, **then** every command has a retained transcript under `docs/sessions/evidence/task779/` recording platform, Node version, working directory, exact command and actual exit code, and `npm.cmd run build` exits **0**. |

---

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** `docs/qa-profiles.md:15` names *"New or migrated Mantine primitive"* and
*"high-risk responsive work"* as `Q3` triggers; this task is both — a migrated surface **and** a change to how a
route surface's responsive visibility is expressed.

`Q4` was considered and rejected: `ListingsFilterBar` appears in **no** `docs/critical-flow-registry.md` row
(§3.8), the task writes no data and edits no security path. `Q2` was rejected because the rendered chrome of a route
surface changes (CC1–CC8).

**Windows-native rule (P0, `docs/orchestrator-role.md`).** Every command below runs in **native Windows PowerShell**
from the project root, using `npm.cmd` / `npx.cmd`. Record `node.exe -p process.platform` first; only `win32` is
admissible. A result from WSL, a Linux VM or a mounted Linux view is an **environment screen, not evidence**.

### Sequence — run in this order

**S1 — pre-edit census (before touching anything).**
Re-measure §3.1 using **exactly** the commands named there:

```powershell
node.exe -p process.platform
Get-Content -LiteralPath src\modules\listings\components\ListingsFilterBar.tsx | Measure-Object -Line
(Select-String -Path src\modules\listings\components\ListingsFilterBar.tsx -Pattern 'className=' -AllMatches).Matches.Count
(Select-String -Path src\modules\listings\components\ListingsFilterBar.tsx -Pattern '<Button' -AllMatches).Matches.Count
(Select-String -Path src\modules\listings\components\ListingsFilterBar.tsx -Pattern '(?<![A-Za-z])<Combobox' -AllMatches).Matches.Count
git --no-optional-locks status --porcelain
```

Expected: **135 / 13 / 4 / 1**. **A drift exists only when one of these four named measurements differs** — a
different counting method producing a different number is not a drift (§3.1). On a genuine drift, **stop and report
a census drift**: Sprint 68 exit criterion **1** makes it a design blocker, not something to absorb into scope.
Also re-take the porcelain snapshot and compare it to §3's — if anything beyond
`tasks/Sprints/Sprint_68_…md` and this task's own artifacts is modified, complete
`docs/orchestrator-dirty-worktree-manifest-template.md` before editing.

**S2 — clean pre-edit baseline B (before any edit).**
```powershell
npm.cmd run build-storybook
npm.cmd run screenshots:assert -- --mantine-only
```
Persist the resulting `manifest.json` path **and** the full `<total>/<pass>/<fail>/<ambiguous>` line as **B**.
**Do not overwrite it later.** B is captured from the pre-edit tree; a baseline taken after any edit is invalid and
cannot be re-derived. (Note: the `screenshots:assert` script already carries `--mantine-only`; the repeated flag is
harmless and is kept so this transcript is directly comparable with Tasks 777/778.)

**S3 — implement, then targeted regression.**
New file `src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx`, mounting the **real**
`ListingsFilterBar`:

| Test | Proves |
|---|---|
| **T1** | **AC2** — a seeded URL (`sort`, `currency`, `page=3`) plus a listing-type change ⇒ exactly one `router.push`, `sort`+`currency` retained, `page` gone, `type` set. Selecting "All" **deletes** `type` rather than setting `''`. |
| **T2** | **AC2** — the premium toggle writes `premium=true` on one push and **deletes** the param on the second, still one push each. |
| **T3** | **AC3** — a property-type change takes the `handlePropertyTypeChange` path: the inapplicable dependent param is absent from the single pushed URL; clearing to "All" deletes `property_type` and drops nothing. |
| **T4** | **AC4** — reset produces a bare `router.push(pathname)` with **no** query string (assert the pushed argument has no `?`). |
| **T5** | **AC4** — activating the advanced-filters control calls `onFiltersOpen` exactly once and produces **0** `router.push` calls. |
| **T6** | **AC5** — mounting `ListingsShellView`, its filter-bar wrapper root carries `mantine-visible-from-md` (the class Mantine actually emits, `Box.mjs:63`), **and** `theme.breakpoints.md === '48em'` so that class resolves to 768px, **and** the rendered `ListingsFilterBar` root carries **no** `mantine-visible-from-md`/`mantine-hidden-from-md` (so the story renders it at every width). Precedent: `mobileBottomNav.smoke.test.tsx:110-114`. |
| **T7** | Negative flow — with `activeCount === 0` the reset control is **absent from the DOM** and no count badge is rendered. |

**Planted-violation obligation (each of T1–T7):** reintroduce the specific defect the test exists to catch, record
the **actual** failing assertion output, then revert and re-run to green. A test that has not been observed failing
is not a control. Record every plant and its revert in the session log. For T6 the plant is moving `visibleFrom`
back onto the component (both arms must then fail).

**V — gates, in this order.** Every one must be run and its actual exit code recorded.

| # | Command | Note |
|---|---|---|
| V1 | `npx.cmd vitest run src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | The new suite plus the three sibling filter suites, to prove the shared leaves and the 778 surface did not regress. |
| V2 | `npm.cmd run check:stories` | **Checkpoint.** Also the first point at which the story is built. Confirm the seeded `nextjs.navigation.query` genuinely produced `activeCount > 0` — i.e. the reset control **and** the count badge are present in the rendered story. If they are not, **stop and report**; do not mock the hook or stub `next/navigation` in a story. |
| V3 | `npm.cmd run check:story-coverage` | Must report the manifest at **22** entries, all covered. |
| V4 | `npm.cmd run governance:tailwind` | Compare the violation set to the pre-edit set; it must not grow. The orphaned allowlist row (§3.8) must remain untouched. |
| V5 | `npm.cmd run check:design-tokens:strict` | **AC12.** No violation may be in a file this task touched. |
| V6 | `npm.cmd run typecheck` | |
| V7 | `npm.cmd run build-storybook` | Confirm the bundle really contains the change (grep the built output for a distinctive new token, e.g. `mantine-visible-from-md` or the story id) before trusting V8. |
| V8 | `npm.cmd run screenshots:assert -- --mantine-only` | Produces **P**. Apply **D68-2** exactly: compute `P \ B` as a **set of normalized cell identities**, not a count comparison; report the 16 new `ListingsFilterBar` cells individually. **Pre-existing global FAIL/AMBIGUOUS cells are not a blocker** and must not be repaired here. A **new** failure outside the 16 is a blocker. Confirm AC6 explicitly: no new cell is blank. |
| V9 | `npm.cmd run check:locale-leak:mantine-only` | Compare against the pre-existing leak set. Zero new leaks attributable to `ListingsFilterBar` is the bar; the raw enum labels are covered by A3 and the lowercase allowlist entry (§3.11). |
| V10 | `npm.cmd run build` | **Hard gate.** A failed or unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. |
| V11 | `git --no-optional-locks diff --check` | Whitespace/conflict-marker check. |
| V12 | `git --no-optional-locks diff --stat` | **AC11** — verify the changed-path set against §7's six paths. |

`check:i18n` is required **only if** A2 turns out false and a `storybook.*` key is added; in that case run
`npm.cmd run check:i18n` and record the parity totals.

**No route probe.** Sprint 68's corrected precondition records that the product has two listings, making `/listings`
a thin measurement surface; Storybook is this sprint's proof surface. Do not add a route probe. **And do not read
the bar's absence at a narrow width on the live route as proof of anything** — that is the untested half of §10.6.

---

## 14. Completion report contract

Status must be exactly one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
**Sonnet has no approval authority and must not emit, suggest, or run any mutating git command, including `git push`.**

Report:

1. **Files changed** — a table matching the real `git --no-optional-locks status --short`, reconciled against §7.
2. **Requirement IDs completed** — R1–R15, each with its evidence pointer. Anything short of complete is named.
3. **Census** — S1's re-measured numbers beside §3.1's, **with the measuring command quoted**, plus the after-values
   for AC1 / AC5 / AC10.
4. **Commands run** — every command in §13 with platform, Node version, cwd, exact command, **actual** exit code,
   and the retained transcript path under `docs/sessions/evidence/task779/`.
5. **Differential rendered result** — B and P identifiers, the `P \ B` set (empty or enumerated), the 16 new cells
   listed individually with an explicit statement that none is blank, and AC13's arithmetic reconciliation.
6. **Planted violations** — one entry per plant (T1–T7): what was broken, the actual failing output, the revert, the
   re-run result.
7. **Canonical changes CC1–CC8** — measured before/after for each, per AC14. No "visually neutral" claim.
8. **Assumptions** — the fate of A1–A4, in particular whether A2 held and what query A1's story actually used.
9. **Deviations, limitations, unresolved issues** — including the A3 raw-enum-label condition (Task 679), the Q1
   `MantineCountButton` convergence question, and §10.6's stated detector blind spot.
10. **Backlog + session log** — concise state in `docs/backlog.md`; full detail in
    `docs/sessions/2026-09-02-task779-listings-filter-bar-mantine.md` with a "Files Changed" table matching the diff.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | **Yes** — every file, line, command, token and decision is named in-document. |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1-R15 → AC1-AC15, each mapped to a §13 step. |
| Scope protects existing behavior and names what must not change | **Yes** — §8, with `useListingsUrlFilters.ts` as an explicit zero-diff file, Task 772's ownership of `ListingsSortBar` restated, and `Codex-tasks/*` plus the entropy allowlist explicitly fenced off. |
| UI publication checks (`orchestrator-ui-task-design.md`) | **Yes** — current/legacy boundary (§1, §10.5), QA profile (§13), visual source map (§10.1), canonical decision record (§10.2), preservation classifications (§9). |
| Canonical Story source-of-truth check | **Yes** — no Story exists for this component (§10.2 last row), so the kickoff requires creating one **in the same PR** as the migration, plus scope registration and a static-import proof from `check:story-coverage` (V3). No demo stand-in is accepted: §10.4 requires the real component. |
| Permanent-story creation gate | **Yes** — §10.2 and §10.4 name the inspected candidates, why none covers the artifact, and the **in-scope production consumer** (`ListingsShellView.tsx:76`). No probe is used, so no restoration evidence is required. |
| Negative flows selected by applicability, not copied | **Yes** — §11.2 marks 4 branches `No` with the existing owner/reason, and the SSR/hydration `No` is justified by the specific mechanism (`visibleFrom` is CSS, not `useMediaQuery`). |
| No uninspected claim | **Yes** — every `FACT` in §3 cites a file and line read in this session, including the three `node_modules` reads (`Button.css` `.m_77c9d27d`, `Box.mjs:62-63`, `MantineClasses.mjs:19`) that carry the two load-bearing mechanisms. Derived claims are labelled `INFERENCE`. |
| Absence/API claims carry a data-flow trace | **Yes** — "`ListingsFilterBar` has exactly one production consumer" is traced through the full grep output in §3.8 (`ListingsShellView.tsx:13` import + `:76` render site), distinguishing it from the governance-report and allowlist JSON hits. "The tailwind-entropy allowlist row is inert" is traced to the row's `pattern` value, the file's actual `text-2xs` usage, and the `allowedKeys` `Set` construction at `tailwind-entropy.mjs:35` plus its only consumer at `:204`. "`MantineCombobox` requires `noResultsLabel`" is traced to the non-optional declaration at `:52` and four production call sites. |
| Detector-aware requirements | **Yes** — §10.6 states the class the rendered gate cannot see (391–1023px, hence the 768px boundary) **before** the executor builds against it, and routes that proof to T6 instead of to a pixel capture. §3.8 proves the allowlist detector cannot fail on an orphaned row rather than assuming it. |
| Gates prove the changed behavior, not merely procedure | **Yes** — V8 is differential per D68-2; AC6 makes a blank cell a failure rather than a silent pass; every new test carries a planted-violation obligation. |
| Every owner-only exception has traceable authorization | **Yes** — D775-A/B/C and **D68-2** are cited with owner and date; CC6 cites **D2** (Task 671) quoted from `MantineFilterSection.tsx:23-24`; CC4's default-size stance cites Task 777's closure; the census method and the `Codex-tasks` exclusion cite the owner decision of 2026-09-02. |
| Rule-compliance ledger — no rule weakened | **COMPLIANT** for: sprint-assignment rule (2026-08-01), `docs/rule-index.md` bundle selection, `docs/qa-profiles.md` `Q3`, `docs/agent-contract.md` clause 16c (story in the same PR), Sprint 68 exit criteria 1-5, Windows-native validation (P0), the `npm run build` hard gate, and the Git policy (§17 emits commit only, never push). |
| Exactly one active owner route | **Yes** — where two designs were plausible (`Indicator` vs `MantineCountButton`; `MantineCombobox` vs `PropertyTypeCombobox`), one was selected and the rejected option is recorded **with its reason** (§10.2, Q1) so the executor does not re-open it. |
| Checkpoints name producer, output, comparator, failure behavior | **Yes** — S1 (named-measurement drift → stop), S2 (B, non-overwritable), V2 (seeded-state confirmation → stop), V4/V5 (violation-set comparator), V8 (`P \ B` set comparator + blank-cell failure). |
| Dirty-worktree handling | **Measured, not assumed** — §3 records the one modified path, its content witness, and the pre-write `git hash-object` of all three files this session touches, and §13 S1 requires the executor to re-take the snapshot before its first write. |
| Counts account for task-created artifacts | **Yes** — AC13's `total(P) = total(B) + 16` states the created cells explicitly; AC10 states the manifest 21 → 22. |
| No fact asserted `Confirmed` whose first verification is deferred | **Yes** — S1 is an I0 **re-measure** of author-verified numbers (freshness, since a parallel edit could land between filing and execution), and the author's full trace with its measuring commands is retained in §3.1. |
| Cited steps match the final plan | **Re-checked after the final revision** — §12's AC references to §13 S1/S2/S3/V1-V12 and §10.x resolve. |

---

## 16. Implementation handoff

Execute from the saved task at
`tasks/Sprints/Sprint_68_kickoff_prompt_Task_779_ListingsFilterBar_Mantine.md`, following
`.claude/skills/execute-task/SKILL.md`.

Order: **S1 census → S2 baseline B → implement → S3 tests + plants → V1-V12 → report.**

Return `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.
Do not run any mutating git command.

---

## 17. FACTS · INFERENCES · UNKNOWNS · CONFLICTS

**FACTS** — the §3.1 census (135 physical lines / 13 `className` / 4 `<Button` / 1 `<Combobox`, hash
`81ee08e67993612d1489a0cf9395a8f558b6eebb`, worktree ≡ `HEAD`); 119 non-blank lines; `AUDIT.md:140`'s stale `134`
and the `4254f3897` one-line delta that explains it; `theme.ts:177` `md: '48em'` commented `768px`;
`Box.mjs:62-63` emitting `mantine-visible-from-<bp>`; `MantineClasses.mjs:19` generating
`@media (max-width: em(px(bp) - 0.1))`; `Button.css` `.m_77c9d27d` carrying `position: relative` **and**
`overflow: hidden`; `MantineCountButton.tsx`'s recorded corner-badge clipping history; `NotificationBellView.tsx:30`
`Indicator` with `disabled`; `HeaderView.tsx:121-124` `visibleFrom="md"` replacing `hidden md:flex`;
`mobileBottomNav.smoke.test.tsx:110-114` asserting the emitted class; `MANTINE_VIEWPORTS` = 4 widths and
`LOCALES` = 4, with `ListingsFilterBar` absent from `MANTINE_STORY_EXTRA_VIEWPORTS`, `MANTINE_OVERLAY_PRIMITIVES`
and all three gate scripts; `mantine-migration-scope.json` at 21 entries without `ListingsFilterBar`;
`ListingsShellView.tsx:13`/`:76` as the sole production consumer; `ListingsFilterBar` absent from
`docs/critical-flow-registry.md`; the entropy allowlist row's `text-[10px]` against the file's actual `text-2xs`
and `tailwind-entropy.mjs:35`/`:204`'s skip-only `Set`; `MantineCombobox`'s **required** `noResultsLabel` and
`PropertyTypeCombobox`'s static `PROPERTY_TYPES` source with its `cn`/`sm:w-48` residue;
`usePropertyTypes.buildFallback()` returning `label: pt.value`; `useListingsUrlFilters`'s three distinct write paths
(`updateParams` `:55-66`, `handlePropertyTypeChange` `:80-92`, `resetFilters` `:74-76`); Task 778's
`nextjs.navigation.query` story shipping with `check:stories` at 132 files / 0 violations.

**INFERENCES** — `visibleFrom="md"` reproduces the `hidden md:flex` 768px boundary (from the theme value plus the
generated media query, **and AC5/T6 measure it rather than assuming it**); one story export ⇒ exactly 16 new cells;
12 of those 16 would be contentless if the bar kept its own gate, which is what makes §3.6 necessary; an absolutely
positioned badge inside a Mantine `Button` would be clipped, so `Indicator` is forced rather than preferred; the
orphaned allowlist row is inert in both directions; the wrapper's `display:block` over the bar's own flex root is
equivalent for a full-width row (**AC5 measures it**).

**UNKNOWNS** — the rendered pixel effect of CC1/CC2 (the two comboboxes losing fixed widths) at each of the 16
cells; whether the story's seeded query yields the exact `activeCount` the executor expects (**V2 is the
checkpoint, with a stop**, not a guess).

**CONFLICTS** — **None outstanding.** The census-method conflict that blocked this task's first design pass was
resolved by the owner on 2026-09-02 and is recorded in §3.1: physical lines measured by the named PowerShell command
are the baseline; `119` is an explanatory note; `Codex-tasks/*` is not edited.

**BLOCKED** — None. No owner decision is outstanding for this task. **D68-1** (Task 772 ordering) does not gate it,
because §8 keeps `ListingsSortBar` and `SaveSearchButton` entirely out of scope.
