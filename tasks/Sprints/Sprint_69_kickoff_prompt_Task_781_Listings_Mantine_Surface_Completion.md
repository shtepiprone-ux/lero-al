# Task 781 — `/listings` Mantine surface completion: status tabs, filter chips, action row, shell presentation

**Sprint:** 69 (`tasks/Sprints/Sprint_69_Listings_Finishes_The_Mantine_Migration.md`) · **Priority:** P2 ·
**QA profile:** **Q3** · **Filed:** 2026-09-03 · **State:** KICKOFF FILED — not yet dispatched

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Task type: **UI / Layout / Component — mixed migration** (legacy
shadcn/Tailwind → current Mantine). Rule routing per `docs/rule-index.md` uses **both** the current Mantine
path and the legacy shadcn/Tailwind path, with the boundary stated per file in §3.2.

Executor: a fresh Sonnet session via `.claude/skills/execute-task/SKILL.md`. Strongest allowed completion
status is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Sonnet does not self-approve and does not run, emit
or suggest any mutating git command.

---

## 2. Objective

Remove every remaining shadcn/Tailwind surface from the `/[locale]/listings` client component graph by
migrating five components to Mantine behind canonical `Patterns/Mantine/*` stories, **without changing any
URL contract, server action, data-loading, restore, favorites or currency behavior**, and without leaving a
retained route probe whose locator can no longer match anything.

---

## 3. Verified context

Every claim in this section was inspected in the task-design session of **2026-09-03** against the working
tree at branch `main`, worktree clean (`git --no-optional-locks status --short` → empty), `.git/index.lock`
absent. Line numbers are from that tree. **Re-measure every count and line reference at execution (I0
freshness re-measure); do not quote a number from this document as a measurement.**

### 3.1 What is already migrated — regression dependencies, NOT re-work

| Surface | Task | Evidence inspected this session |
|---|---|---|
| Route chrome `ListingsPageFrame.tsx` | 775 | 86 lines; imports only `next/link` + `@mantine/core` (`Box`, `Breadcrumbs`, `Anchor`, `Text`) + its own CSS module. No `@/components/ui/*`. |
| Container/presentational seam | 776 | `ListingsShell.tsx` (189 lines) owns all state; `ListingsShellView.tsx` (169) is the view. |
| `ListingsPagination.tsx` | 777 | 44 lines; imports `Group` + `MantinePagination`. Zero `className`. |
| `ListingsFilters.tsx` | 778 | 415 lines; imports `@mantine/core` + migrated leaves. Zero `className`. |
| `MantineDrawer.tsx` | 778 | 160 lines; `Drawer`/`Stack`/`Box` + `responsiveBottomSheet`. Zero `className`. |
| `ListingsFilterBar.tsx` | 779/780R | 168 lines; `Box`/`Button`/`Divider`/`Group`/`Indicator`/`Stack` + `MantineCombobox` + `LocationCombobox`. Zero `className`. |
| `LocationCombobox.tsx` | earlier | 195 lines; `@mantine/core` + `MantineCombobox`/`MantineAddItemPanel`. One wrapper `<div className={cn('location-combobox', className)}>` at `:114` — a **semantic hook plus a caller-supplied passthrough**, not a Tailwind utility chain; `.location-combobox` is defined in no stylesheet. |
| `RangeDatePicker.tsx` | earlier | 873 lines; `@mantine/core` + `MantinePopover`/`MantineCombobox`. One `className="range-day-cell"` at `:265` — a semantic hook, not a utility chain. |
| `ListingCard.tsx` | Sprint 46 family | 337 lines; `@mantine/core` + `MantineListingCardPattern`; styling via `ListingCard.module.css`. Its one `@/components/ui/*` import is `AppImage` (`:7`) — a project Cloudinary image component, **not** a shadcn primitive. |

**Verified verdict on the owner's "перевір мігровані компоненти" request:** all eight named components are
migrated. Two residual observations, **both classified `preserve / out of scope` with positive evidence**:

- `ListingCard.tsx:7` → `@/components/ui/AppImage`. Read `AppImage.tsx:1-20`: it is a hand-rolled Cloudinary
  `<img>` + srcset component with its own CSS module, deliberately not `next/image`. It is a project
  component that merely lives under `components/ui/`; it is not a shadcn primitive and there is no Mantine
  equivalent. Exit criterion 1 excludes it by name. Any change here is Sprint 46 / Task 768 territory.
- `LocationCombobox.tsx:114` and `RangeDatePicker.tsx:265` semantic `className` hooks. Neither resolves to a
  Tailwind utility and neither is defined in `globals.css` or any stylesheet (grepped this session). They are
  selector hooks. **Out of scope, and must not be removed** — see §3.6, removing a selector hook is exactly
  how this task breaks its own evidence.

**`src/components/shared/Combobox.tsx` is explicitly NOT migrated by this task** (owner instruction). After
Phase 3 replaces its last `/listings` consumer it simply stops being a dependency of this route. Do not touch
it, do not delete it — it has other consumers outside this route's graph.

### 3.2 The five legacy surfaces — measured

| # | File | Lines | Legacy imports (exact) | Tailwind utility markup (exact lines) | Boundary |
|---|---|---:|---|---|---|
| 1 | `src/modules/listings/components/ListingsStatusTabs.tsx` | 37 | `:5` `import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'` | `:29` `className="listings-status-tabs"` (semantic hook only — no utility chain) | legacy → Mantine |
| 2 | `src/modules/listings/components/ActiveFilterChips.tsx` | 200 | `:6` `import { Button } from '@/components/ui/button'` | `:182` `"active-filter-chips flex flex-wrap items-center gap-2 pt-3 pb-1"`; `:188` `"gap-1.5 h-7 pl-3 pr-2 rounded-full bg-primary/10 text-primary text-xs font-medium border-primary/20 select-none hover:bg-primary/20 min-h-11 sm:min-h-0"`; `:193` `"h-3 w-3 shrink-0"` | legacy → Mantine |
| 3 | `src/modules/listings/components/ListingsSortBar.tsx` | 110 | `:6` shadcn `Button`; `:7` `import { Combobox } from '@/components/shared/Combobox'` | `:46`, `:48`, `:49`, `:53`, `:60`, `:65`, `:68`, `:69`, `:71`, `:84`, `:85`, `:89`, `:96`, `:104` | legacy → Mantine |
| 4 | `src/modules/listings/components/SaveSearchButton.tsx` | 111 | `:8` `Button`, `:9` `Input`, `:10` `Label`, `:11` `Dialog, DialogContent, DialogHeader, DialogTitle` | `:72`, `:75`, `:76`, `:80` (carries a `design-tokens-allow:` marker), `:82`, `:84`, `:85`, `:86`, `:91`, `:97`, `:101`, `:102` | legacy → Mantine |
| 5 | `src/modules/listings/components/ListingsShellView.tsx` | 169 | `:7` shadcn `Button` | `:75`, `:90`, `:93`, `:94`, `:109`, `:110`, `:111`, `:114`, `:118`, `:124-128`, `:145`, `:151`, `:153` | **mixed** — `:77` `<Box visibleFrom="md">` and `:85` `<MantineDrawer>` are already Mantine and stay |

### 3.3 Consumer trace — complete, not a grep hit

Traced across `src/`, `scripts/` and `playwright/` this session. Every construction path was read:

- `ListingsStatusTabs`, `ActiveFilterChips`, `ListingsSortBar` — **exactly one** production consumer each:
  `ListingsShellView.tsx` (`:13`/`:91`, `:12`/`:92`, `:9`/`:95`). Non-production hits are the three
  `vi.mock` stubs in `listingsFilterBar.smoke.test.tsx:65,:68,:69` and one comment in
  `scripts/task608-qa-listingcard-list-site.mjs:138`.
- `SaveSearchButton` — **exactly one** production consumer: `ListingsShell.tsx:27-30` (`next/dynamic`,
  `ssr: false`) rendered at `:186` as `saveSearchSlot={user ? <SaveSearchButton /> : null}`. **It renders
  only for an authenticated user, and never in the server HTML.** That is why §7.3's evidence needs a
  storage state.
- `ListingsShellView` — **exactly one** production consumer: `ListingsShell.tsx:21`/`:164`. Also mounted for
  real (not stubbed) by `listingsFilterBar.smoke.test.tsx:258`, whose T6 asserts the `visibleFrom="md"`
  wrapper — **that assertion must keep passing.**

`UNKNOWN → resolved`: no other route, story, test or script constructs any of the five.

### 3.4 Canonical Mantine story state — measured

`ls src/stories/patterns/mantine/` returns 23 story files. **None** of the five components has one. The
enrolment manifest `scripts/mantine-migration-scope.json` holds **22** entries and contains **none** of the
five. Therefore every phase's disposition for its own component is **`create canonical`** (§6a), and each
phase must add its story **and** its manifest entry **in the same PR** as the migration — per
`docs/agent-contract.md` clause 16c and Sprint 68's exit criterion 2.

The canonical **primitive** sources those stories compose already exist and are `reuse`, not `create`:

| Needed primitive | Canonical source inspected | Story | Theme provenance |
|---|---|---|---|
| Tabs | `@mantine/core` `Tabs` | `Mantine/Primitives/Tabs` (`Tabs.stories.tsx:7`) | `theme.ts:855-868` — `variant:'pills'`, `radius:'md'`; tab `fontWeight:500`, `minHeight:'2.75rem'` (**44px, clause 11 satisfied by the theme**), `paddingInline:'0.75rem'`; list `bg gray-1`, `border gray-2`, `radius lg`, `padding/gap 0.25rem`, `flexWrap:'nowrap'` |
| Sort selector | `MantineCombobox` `variant="button"` | `Mantine/Primitives/Combobox` (`Combobox.stories.tsx:9`) | its own pattern file; already the sort/filter selector on the migrated `ListingsFilterBar` |
| Save-search dialog | `MantineModal` | `Mantine/Primitives/Modal` (`Modal.stories.tsx:5,9`) | `theme.ts:520-525` (`radius:'lg'`, `centered`, header `paddingBottom 8px`); the pattern is centered Modal ≥640 / bottom sheet <640 in one component |
| Chip | Mantine `Button` (see **D69-4**) | `Mantine/Primitives/Button` | `theme.ts:274` |
| Text field / label | Mantine `TextInput` | `Mantine/Primitives/TextInput` | `theme.ts:343` |

`theme.ts` has **no** `Pill` and **no** `Chip` entry; `src/` contains no `Pill`/`Chip` consumer; no
`Mantine/Primitives/Pill` or `…/Chip` story exists. That measured absence is the basis of **D69-4**.

### 3.5 ⚠️ The retained route probes this migration invalidates — P0 for the executor

Two probes in `scripts/` are the **retained evidence artifacts** of Tasks 772 and 775. Their locators are
derived from shadcn `data-slot` attributes, the legacy `Combobox`'s `data-testid`, and Tailwind class names.
Each of the following was traced to the exact emitting source this session:

| Probe · line | Locator | What emits it today | After this task |
|---|---|---|---|
| `task775-listings-frame-route-probe.mjs:257` | `.listings-sort-bar [data-testid="combobox"] > button` | `src/components/shared/Combobox.tsx:278` — the **only** `data-testid="combobox"` in `src/`. `MantineCombobox.tsx` emits **zero** `data-testid`. | **DEAD after Phase 3** |
| `task775-listings-frame-route-probe.mjs:262` | `[role="option"][data-value="price_asc"]` | `Combobox.tsx:258` `data-value={opt.value}` | **DEAD after Phase 3.** Mantine's `ComboboxOption` sets `role="option"` literally and forwards `value` through `...others` as a plain HTML attribute — so the Mantine form is `[role="option"][value="price_asc"]`, **not** `data-value`. Verify against the real DOM; do not assume this line. |
| `task775-listings-frame-route-probe.mjs:282` | `.listings-status-tabs [data-slot="tabs-trigger"]:not([data-active])` | `src/components/ui/tabs.tsx:48` | **DEAD after Phase 1.** Mantine `Tabs.Tab` emits `data-active` on the active tab but no `data-slot`. |
| `task772-listings-overflow-probe.mjs:128` | `.listings-sort-bar button.md\:hidden` | `ListingsSortBar.tsx:65` | **DEAD after Phase 3** |
| `task772-listings-overflow-probe.mjs:129,:224,:226` | `.listings-sort-bar [data-testid="combobox"] button` | as above | **DEAD after Phase 3** |
| `task772-listings-overflow-probe.mjs:130` | `.listings-sort-bar .hidden.sm\:flex` | `ListingsSortBar.tsx:89` | **DEAD after Phase 3** |
| `task772-listings-overflow-probe.mjs:126,:127` | `.listings-sort-bar > div:nth-of-type(1)` / `(2)` | structural | **FRAGILE after Phase 3** — survives only if the migrated bar keeps two direct element children |

`.listings-sort-bar`, `.listings-status-tabs`, `.active-filter-chips` and `.listings-shell` are **semantic
selector hooks with no CSS definition anywhere** (grepped `globals.css` and `src/styles` this session — zero
matches). They are consumed only by these probes. **They must be preserved verbatim on the migrated Mantine
roots** (Mantine `Box`/`Group`/`Stack` all accept `className`), because they are the one part of the probe
locators that this migration does not have to break.

**This is the failure mode the sprint exists to prevent:** a Playwright `locator()` that matches zero nodes
does not throw at construction. `task775`'s `exactlyOne()` helper does guard its own calls — read it before
relying on that — but `task772`'s `rectOf(...)` measurements return `null` for an absent node and a
`null`-heavy result can read as "no overflow". Requirement **R9** below makes the retarget mandatory.

### 3.6 Why `ListingsSortBar` and `SaveSearchButton` are one phase, not two

Measured, not asserted. `ListingsShellView.tsx:93-106` renders them as siblings:
`<div className="flex items-center gap-2">` → `<div className="flex-1 min-w-0">`(sort bar) + `{saveSearchSlot}`.
Task 772's **authenticated** matrix found — and its review recorded as a pre-existing, deliberately un-numbered
finding (owner decision 2026-09-03) — that `SaveSearchButton`'s own `max-sm:w-full` collapses the sort bar's
wrapper and the button is then paint-order-occluded behind the positioned sort `Combobox` at 320-390px
(CSS 2.1 Appendix E: non-positioned content paints before `z-index:auto` positioned content, regardless of
DOM order). That defect is invisible to any proof that renders either control alone. **Phase 3 owns the row
wrapper (`ListingsShellView.tsx:93-106`) and must eliminate the occlusion**; a per-component story is not
sufficient evidence for it.

### 3.7 Localization — no new production key required

Every string these components render already resolves in `messages/en.json` and, by the `check:i18n` parity
gate, in all four locales: `listing.tab_active` · `tab_closed` · `found_results` · `found_results_one` ·
`showing_results` · `sort_newest` · `sort_price_asc` · `sort_price_desc` · `sort_area_desc` · `sort_area_asc` ·
`view_grid` · `view_list` · `filters_title` · `no_results_title` · `no_results_desc` · `no_results_closed` ·
`show_more` · `filter_chip_premium_only`; `common.aria_remove_filter` · `rooms_label` · `floor_range` ·
`floors_total_range` · `date_from` · `date_to`; `saved_search.*` (18 keys, all present).

Story fixtures reuse existing `storybook.mantine.*` keys (344 present in `en`), notably
`combobox_option_tirana` / `combobox_option_durres` — the same fixtures `ListingsFilterBar.stories.tsx` uses.
**Only if a new fixture key is genuinely unavoidable** may one be added, and then to **all four** locale files
in the same commit, with `npm run check:i18n` exit 0 as proof.

`MantineCombobox` requires a `noResultsLabel` from its consumer (it owns no i18n hook). The sort selector has
a fixed five-option list and cannot produce an empty result set, but the prop is required — pass an existing
localized key; do not introduce a raw literal.

### 3.8 Known limitation, inherited and NOT in scope

Storybook has no `/api/property-types`, so `usePropertyTypes()` falls back to raw lowercase enum labels in
every locale (Task 679, Sprint 56). `ActiveFilterChips` calls `usePropertyTypes()` at `:31`. Its story will
therefore show `apartment` rather than a localized label in the `property_type` chip. **Record it; do not
fix, stub or localize it here** — 679 owns it and its detector fix lands first in Sprint 56.

---

## 4. Requirements

| ID | Source | Observable requirement | Pri | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Owner instruction | `ListingsStatusTabs` renders Mantine `Tabs`; zero `@/components/ui/*` imports | P0 | diff + AC1 | Confirmed |
| **R2** | Owner instruction | `ActiveFilterChips` renders Mantine composition (D69-4); zero shadcn imports, zero Tailwind utility strings | P0 | diff + AC2 | Confirmed |
| **R3** | Owner instruction | `ListingsSortBar` uses Mantine controls and the canonical `MantineCombobox` for the sort selector ("Спочатку нові") | P0 | diff + AC3 | Confirmed |
| **R4** | Owner instruction | `SaveSearchButton` uses Mantine `Button`/`TextInput` and the canonical `MantineModal`; the `design-tokens-allow:` marker at `:80` is **removed, not relocated** | P0 | diff + AC4 | Confirmed |
| **R5** | Owner instruction | `ListingsShellView`'s presentation layer (action row, empty state, grid/list, "Показати ще") is Mantine; `ListingsShell` keeps all state | P0 | diff + AC5 | Confirmed |
| **R6** | Owner instruction · D775-C | No hardcode. Migrated files contain no raw px/rem/hex, no `design-tokens-allow:` marker, no `--space-*`, no Tailwind utility string — canonical Mantine tokens only | P0 | `check:design-tokens` + diff + AC8 | Confirmed |
| **R7** | Sprint 69 exit 3 · `docs/agent-contract.md` 3/5 | Every URL contract, control, state branch and server-action path is preserved exactly | P0 | smoke tests + AC6 | Confirmed |
| **R8** | §3.6 · Task 772 finding | At 320/375/390 in all four locales, **authenticated**: no horizontal overflow, no zero-width control, no occlusion between the sort selector and the save-search button, every interactive control ≥44px | P0 | route probe + AC7 | Confirmed |
| **R9** | §3.5 | Every probe locator this migration invalidates is retargeted and re-run, or retired with a recorded reason. A zero-match locator fails closed | P0 | AC9 | Confirmed |
| **R10** | clause 16c · Sprint 69 exit 2 | Each of the five gets a canonical `Patterns/Mantine/*` story importing the **real** component, plus its `mantine-migration-scope.json` entry, in the same PR | P0 | `check:story-coverage` + AC11 | Confirmed |
| **R11** | D68-2 | Rendered acceptance is differential: `P \ B = ∅` as cell identities + PASS on every new cell + explicit arithmetic reconciliation | P0 | AC12 | Confirmed |
| **R12** | Sprint 69 exit 1 | The final route graph imports no `@/components/ui/*` (except `AppImage`) and no `@/components/shared/Combobox` | P1 | AC10 | Confirmed |
| **R13** | clause 9 · D69-3 | `npm run build` exit 0 on the final diff, Windows-native, with a `platform=win32` receipt. **No review ledger.** | P0 | AC13 | Confirmed |
| **R14** | §3.7 · clause 7 | No new user-facing string; if a story fixture key is added it exists in all four locales | P1 | `check:i18n` + AC14 | Confirmed |
| **R15** | D775-B · D69-5 | Every accepted visual delta is **enumerated and shown**, never claimed visually neutral | P1 | AC15 | Confirmed |

---

## 5. Assumptions and open questions

**Assumptions (labelled, reversible):**

- **A1** — Mantine `Tabs` `variant="pills"` on `theme.ts:855` is the intended visual for the status tabs. The
  legacy `TabsList` is TailAdmin §6c segmented chrome and the theme entry reproduces it. If the rendered
  result diverges materially, that is a **D69-5 owner item at review**, not a licence to override the theme.
- **A2** — Mantine's `ComboboxOption` forwards `value` as an HTML attribute (source read this session:
  `value` is not destructured, `role: "option"` is literal). The exact retargeted probe selector must be
  confirmed **against the live DOM**, not from this line.
- **A3** — `task772-listings-overflow-probe.mjs` and `task775-listings-frame-route-probe.mjs` are unwired
  task-owned probes, not CI gates (`docs/backlog.md` records `scripts/` holding 13 unwired task-numbered
  probes). Retargeting them therefore blocks no gate — **and gives no cover for leaving them broken.**

**Open questions:** none blocking. **D69-5** (visual acceptance of the two enumerated deltas) is an owner
item **at review**, not a dispatch blocker.

---

## 6. Pre-read rule bundle

Read exactly these. Do **not** read all docs.

**Always required:** `docs/agent-contract.md` (clauses 1, 3, 5, 6a, 7, 9, 11, 12, 13, 14, 15, 16, 16b, 16c) ·
`docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` · `docs/critical-flow-registry.md` (scan for
the two rows named in §12).

**Current Mantine path:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md`
(§6c tabs/segmented, §6b/§6l Badge, §6l Modals/Dropdowns, §1b radius scale) · `docs/component-rules.md` ·
`docs/ui-rules.md` (routing/legacy-boundary notes only) · `docs/qa-rules.md`.

**Legacy boundary (read-only, for the "before" side):** `docs/design-system.md` §4 (`.container-wide`),
§22 (token tiers).

**Storybook:** `docs/storybook-governance.md` §14.2 (locale-backed fixture strings), §15 (the
`mantine-migration-scope.json` coverage gate).

**Sprint context:** `tasks/Sprints/Sprint_69_Listings_Finishes_The_Mantine_Migration.md` ·
`docs/binding-decisions.md` (D27, D28) · `docs/maintenance-playbook.md` §14 (known console noise — do not
file a task for a listed item).

**Source pre-read (open all before editing):** the five target files · `ListingsShell.tsx` ·
`ListingsFilterBar.tsx` **and** `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx` (the closest
precedent for both the migration shape and the story shape) ·
`src/design-system/mantine/patterns/{MantineCombobox,MantineModal}.tsx` ·
`src/design-system/mantine/theme.ts` (`Button` :274, `TextInput` :343, `Badge` :479, `Modal` :520,
`Tabs` :855, spacing :201-213, breakpoints :172-181) ·
`src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx` (the smoke-test precedent) ·
`scripts/task772-listings-overflow-probe.mjs` · `scripts/task775-listings-frame-route-probe.mjs`.

---

## 6a. Canonical UI decision record

| Visible artifact | Searches and inspected paths | Canonical Mantine story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Status tab row | `ls src/stories/patterns/mantine/` (23 files, no `ListingsStatusTabs`); `Mantine/Primitives/Tabs` (`Tabs.stories.tsx:7`) opened; `theme.ts:855-868` opened | Mantine `Tabs` + theme entry | **reuse** primitive · **create canonical** story | `Patterns/Mantine/ListingsStatusTabs` importing the real component; manifest entry |
| Removable filter chip | `theme.ts` grepped for `Pill`/`Chip` → **absent**; `src/` grepped for `Pill`/`Chip` consumers → **absent**; `node_modules/@mantine/core/lib/components/` → `Chip`, `Pill`, `PillsInput` exist but unadopted; `theme.ts:274` `Button`, `:479` `Badge` opened; TailAdmin §74/§434 Badge rows read | Mantine `Button`, themed (**D69-4**) | **reuse** primitive · **create canonical** story | `Patterns/Mantine/ActiveFilterChips` rendering **real single-value and multi-value chips**; manifest entry |
| Sort selector "Спочатку нові" | `MantineCombobox.tsx` opened (`variant="button"`, `MantineComboboxProps`); `Mantine/Primitives/Combobox` opened; live precedent `ListingsFilterBar.tsx:39` | `MantineCombobox` | **reuse** | consumed by the Phase 3 story; `MantineCombobox` itself unchanged |
| Grid/list toggle · mobile filters trigger | `theme.ts:274` `Button`, `:446` `SegmentedControl`; `ListingsFilterBar.tsx` advanced-filters `Indicator` precedent (Task 779/780R) | Mantine `Button` / `ActionIcon` / `Indicator` | **reuse** | Phase 3 story |
| Save-search dialog | `MantineModal.tsx` opened; `Mantine/Primitives/Modal` (`Modal.stories.tsx:5,9`) opened; `theme.ts:520` opened; `MantineDialogDrawerPattern` opened and **rejected** — it owns its own trigger and `useDisclosure`, incompatible with this controlled, `useTransition`-driven consumer | `MantineModal` + `TextInput` | **reuse** | Phase 3 story renders the modal **open**; manifest entry for `SaveSearchButton` |
| Empty state | `MantineEmptyLoadingErrorState.tsx` + `Patterns/Mantine/EmptyLoadingErrorState` opened | evaluate `reuse`; if its API cannot express the current emoji-tile + title + description without a raw value, compose `Stack`/`Center`/`ThemeIcon`/`Text` — **record which, and why** | **reuse or documented composition** | Phase 4 story's empty cell |
| Grid / list layout · "Показати ще" | `ListingsShellView.tsx:124-157`; `HomepageListingGrids.stories.tsx` (the `SimpleGrid` precedent) | Mantine `SimpleGrid` / `Stack` / `Group` / `Button` | **reuse** | `Patterns/Mantine/ListingsShellView`; manifest entry |

No artifact required a value with no design provenance. **No `create canonical` primitive is authorized by
this task** — every disposition above reuses an existing themed primitive or pattern. If implementation shows
a genuinely missing primitive, **stop for `CANONICAL STYLE DECISION REQUIRED`**; do not improvise a local
style, a CSS module or an allowlist marker.

---

## 6b. Visual source map

| Visible artifact/state | Component/markup today | Class/selector today | Token path after migration | Disposition |
|---|---|---|---|---|
| Tab track | `ui/tabs` `TabsList` | shadcn defaults | `theme.ts:855` list: `gray-1` bg, `gray-2` border, `radius lg`, 4px pad/gap, `nowrap` | changed (theme-owned) |
| Tab trigger | `TabsTrigger` | shadcn defaults | `theme.ts:855` tab: 500 weight, `2.75rem` min-height, `0.75rem` inline pad | changed (theme-owned) |
| Chip body | shadcn `Button variant="outline"` | `h-7 pl-3 pr-2 rounded-full bg-primary/10 text-primary text-xs font-medium border-primary/20 min-h-11 sm:min-h-0` | Mantine `Button` `variant="light"` `color="brand"` `radius="pill"` `size="xs"`; mobile floor via responsive `mih` | **changed — enumerated delta, D69-5** |
| Chip remove icon | lucide `X`, `h-3 w-3` | Tailwind sizing | Mantine `rightSection`, size from a theme token | changed |
| Chip row | `div` | `flex flex-wrap items-center gap-2 pt-3 pb-1` | Mantine `Group gap="xs" wrap="wrap"` + `Box` padding tokens; `.active-filter-chips` **preserved** | changed |
| Sort bar root | `div` | `flex items-center justify-between gap-3 py-3 border-b` | Mantine `Group justify="space-between"` + `Divider`/`Box` border token; `.listings-sort-bar` **preserved** | changed |
| Sort trigger | legacy `Combobox variant="button" size="sm"` | `w-auto min-w-35`, `max-sm:min-h-11` | `MantineCombobox variant="button"` + `triggerWidth` | changed |
| Filters count badge | `span` absolute | `-top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-2xs` | Mantine `Indicator` — the same primitive Task 779/780R adopted on `ListingsFilterBar` | changed |
| Grid/list toggle | two shadcn `Button size="icon-sm"` in `bg-muted rounded-xl p-1` | Tailwind | Mantine `ActionIcon.Group` or `SegmentedControl` (`theme.ts:446`) — **record which and why** | changed |
| Save trigger | shadcn `Button variant="outline" size="lg"` | `gap-1.5 rounded-xl` | Mantine `Button variant="default"` + theme radius | changed |
| Save dialog | shadcn `Dialog` | `w-80 max-w-[calc(100vw-2rem)]` + `design-tokens-allow:` marker | `MantineModal` `size` token; **marker deleted** | **changed — enumerated delta, D69-5** |
| Save name field | shadcn `Input` + `Label` | `h-9 rounded-xl text-sm`, `text-xs text-muted-foreground` | Mantine `TextInput` with `label` (`theme.ts:343`) | changed |
| Empty state | `div` + emoji tile | `py-24 gap-4`, `h-16 w-16 rounded-2xl bg-muted` | Mantine tokens per §6a | changed |
| Listing grid | `div` | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pt-5` | Mantine `SimpleGrid cols={{...}}` on **this theme's** breakpoints (D775-A: `xxl=1440`, **never 1536**) | **changed — the `2xl`→`xxl` breakpoint move is an enumerated delta, D69-5** |
| List layout | `div` | `flex flex-col gap-3 pt-5` | Mantine `Stack gap` token | changed |
| "Показати ще" | shadcn `Button size="lg"` | `min-w-48 rounded-xl` | Mantine `Button` + `miw` token | changed |
| Shell root | `div` | `listings-shell flex flex-col gap-0` | Mantine `Stack gap={0}`; `.listings-shell` **preserved** | changed |
| `ListingCard`, `ListingsPagination`, `ListingsFilters`, `ListingsFilterBar`, `MantineDrawer`, `LocationCombobox`, `RangeDatePicker` | already Mantine | — | — | **preserved — out of scope (§3.1)** |

⚠️ **The Tailwind `2xl` breakpoint is 1536px; this theme has no 1536 step.** `D775-A` forbids reintroducing
it. The grid's fourth column therefore moves from 1536 to `xxl` (1440) — state this in the session log as an
accepted, measured outcome, not as an unchanged layout.

---

## 7. Scope — four gated phases

Each phase is complete before the next begins, and each carries **its own pre-edit census** (the exact
`@/components/ui/*` import count and Tailwind-utility-string count in its files, measured with the same
command before and after — record both raw numbers).

### 7.1 Phase 1 — `ListingsStatusTabs`
Files: `ListingsStatusTabs.tsx` · new `src/stories/patterns/mantine/ListingsStatusTabs.stories.tsx` ·
`scripts/mantine-migration-scope.json` · `scripts/task775-listings-frame-route-probe.mjs:282` (retarget).
Replace `ui/tabs` with Mantine `Tabs` (theme defaults; do **not** pass `variant`/`radius` — the theme owns
them). Preserve `className="listings-status-tabs"` on the root and the exact `switchTab` semantics:
`tab === 'active'` deletes `tab`, otherwise sets it; **always** deletes `page`; one `router.push`.

### 7.2 Phase 2 — `ActiveFilterChips`
Files: `ActiveFilterChips.tsx` · new `ActiveFilterChips.stories.tsx` · manifest.
Replace the shadcn `Button` and both wrappers per **D69-4** and §6b. **Do not touch** the chip-construction
logic (`:49-180`) or `removeChip` (`:35-47`) — the multi-value branch that removes one comma-list value while
preserving the rest is the highest-risk line in the file. Preserve `className="active-filter-chips"`, the
`aria-label` template, and the `chips.length === 0 → return null` branch.

### 7.3 Phase 3 — the action row (`ListingsSortBar` + `SaveSearchButton` + their row wrapper)
Files: `ListingsSortBar.tsx` · `SaveSearchButton.tsx` · `ListingsShellView.tsx:93-106` **only** ·
new `ListingsActionRow.stories.tsx` (one story rendering the real row with both controls) · manifest (two
entries) · `scripts/task772-listings-overflow-probe.mjs` and `task775-…:257,:262` (retarget).
The sort selector becomes `MantineCombobox variant="button"`. The mobile filters trigger keeps its count
badge via Mantine `Indicator`. `SaveSearchButton`'s dialog becomes `MantineModal`; the
`design-tokens-allow:` marker at `:80` is deleted, not moved. **Recompose the shared row with Mantine
`Group`/`Flex` so that at 320-390px neither control collapses to zero width and neither is occluded by or
intercepts the other's click** (§3.6). Preserve `className="listings-sort-bar"`.

### 7.4 Phase 4 — `ListingsShellView` presentation
Files: `ListingsShellView.tsx` (everything except the already-Mantine `:77` and `:85`) · new
`ListingsShellView.stories.tsx` · manifest.
Migrate the shell wrapper, empty state, grid/list layout and "Показати ще". Preserve
`className="listings-shell"`. `ListingsShellViewProps` — all 22 members — is **unchanged**; if a prop must
change, stop and ask.

---

## 8. Out of scope

- `src/components/shared/Combobox.tsx` — **explicit owner instruction.** Not migrated, not deleted, not
  "patched". After Phase 3 it stops being a `/listings` dependency; it has consumers elsewhere.
- `ListingsShell.tsx` beyond **zero** changes. All state — `useSearchParams`, `useAuth`, `useExchangeRate`,
  `next/dynamic`, sequential load-more, `listings_restore`, `favoriteIds`, `displayCurrency` — stays. Its
  `dynamic(..., { ssr: false })` wrappers stay, including the `Stack`/`Skeleton` loading fallback.
- `ListingCard`, `ListingsPagination`, `ListingsFilters`, `ListingsFilterBar`, `MantineDrawer`,
  `LocationCombobox`, `RangeDatePicker`, `MantineCombobox`, `MantineModal` — verified migrated (§3.1).
- `@/components/ui/AppImage` (§3.1).
- `usePropertyTypes` Storybook fallback (§3.8 — Task 679 / Sprint 56 owns it).
- Any global Tailwind retirement, `globals.css` edit, or cleanup of `src/components/ui/*` itself.
- The reserved numbers 738 · 743 · 745 · 746 · 750 (rendered-gate detector gaps). If this task's evidence
  reproduces one, **record it in the session log; do not file, fix or number it** — per the owner's plan,
  a pre-existing UI defect does not spawn a follow-up here.
- **No `docs/reviews/*.review-ledger.json`** — D69-3.

---

## 9. Current and required behavior

### Must be preserved exactly (verify each, do not assume)

| # | Current behavior | Source |
|---|---|---|
| C1 | Status tab: `active` deletes `tab`, `closed` sets `tab=closed`; **always** deletes `page`; one `router.push` | `ListingsStatusTabs.tsx:15-24` |
| C2 | Single-value chip removal deletes its param; multi-value removal removes only its own value and re-joins the rest, deleting the param only when empty; **always** deletes `page` | `ActiveFilterChips.tsx:35-47` |
| C3 | Zero chips → the component renders `null` (no empty row) | `:181` |
| C4 | Chip `aria-label` is `` `${chip.label} — ${t('aria_remove_filter')}` `` | `:191` |
| C5 | Sort sets `sort`, deletes `page`, one push; a `null` value is a no-op | `ListingsSortBar.tsx:37-43` |
| C6 | Result count: `total === 1` → `found_results_one`, else `found_results`; the range line renders only when `total > 0` **and** only at `sm+` | `:49-56` |
| C7 | The mobile filters trigger is `md:hidden` and calls `onFiltersOpen`; its count badge renders only when `activeFiltersCount > 0` | `:62-75` |
| C8 | The grid/list toggle is `hidden sm:flex` (absent below 640) and calls `onViewChange` | `:89-106` |
| C9 | Save-search name falls back to `buildAutoName()` when the input is blank; `canonicalizeFilters` is unchanged | `SaveSearchButton.tsx:23-38` |
| C10 | `already_exists` → `toast.info` + close, no error; `result.error` → `toast.error` and the modal **stays open**; success → `toast.success` + close + clear the name | `:52-64` |
| C11 | Enter in the name field saves; the field autofocuses; `maxLength={80}` | `:92-94` |
| C12 | Both actions are disabled while `isPending`; the save button shows a spinner | `:98-103` |
| C13 | The save trigger's label is `sm+` only (icon-only below 640) | `:76` |
| C14 | `<Box visibleFrom="md">` around `ListingsFilterBar`, and `MantineDrawer side="left" size="xs"` | `ListingsShellView.tsx:77`, `:85` |
| C15 | Empty state text switches on `tab`: `closed` → `no_results_closed` with **no** description; `active` → `no_results_title` + `no_results_desc` | `:108-121` |
| C16 | Grid variant → `ListingCard variant="vertical"` + `layoutContext="sidebar"`; list variant → `variant="horizontal"` + `layoutContext` **undefined** | `:130-140` |
| C17 | "Показати ще" renders only when `showLoadMore`, disables while `isLoadingMore`, shows a spinner | `:144-157` |
| C18 | `ListingsPagination` renders only in the non-empty branch, after the load-more button | `:159-163` |
| C19 | `data-listing-slug` on cards stays reachable for `ListingsShell.tsx:123`'s scroll restore | `ListingCard` |

### Required after behavior

Every row above is byte-equivalent in observable terms. Additionally: the five files import no
`@/components/ui/*` and no `@/components/shared/Combobox`; they contain no Tailwind utility string, no raw
px/rem/hex, and no `design-tokens-allow:` marker; the four semantic selector hooks survive; and at
320/375/390 in all four locales, authenticated, the action row shows no overflow, no zero-width control, no
occlusion and no sub-44px interactive target.

---

## 10. Implementation requirements

1. **Mantine tokens only** (D775-C). No raw px/rem/hex, no `design-tokens-allow:`, no `--space-*`, no CSS
   module added for any of the five, no Tailwind utility string. If a value seems to need one, **stop**.
2. **Responsive layout in Mantine responsive props** on this theme's breakpoints (D775-A). `xxl = 1440`.
   **1536 appears nowhere.**
3. **Theme defaults are not re-passed.** Do not pass `variant`/`radius` where `theme.ts` already sets them
   (`Tabs`, `Modal`, `Badge`, `Card`) — a hardcoded prop shadows the theme and re-creates the Task 527 #11
   defect.
4. **Preserve the four semantic hooks:** `listings-status-tabs`, `active-filter-chips`, `listings-sort-bar`,
   `listings-shell`, each on the migrated root.
5. **Container/presentational split holds.** No `useState`, `useEffect`, `useSearchParams` or data hook moves
   from `ListingsShell` into any view. Existing local URL hooks inside the migrated components stay where
   they are.
6. **Story first or same-PR, never ahead.** A `Patterns/Mantine/*` title asserts the component **is**
   canonical Mantine (`scripts/lib/mantine-story-scope.mjs`). Story + migration + manifest entry land in one
   PR. Every story imports the **real** production component — no demo analogue, no slot stand-in
   (clause 16c).
7. **Story fixture strings via `storyT`** (`docs/storybook-governance.md` §14.2). Reuse existing
   `storybook.mantine.*` keys; a new key goes into all four locale files.
8. **Story containers follow the 780R precedent:** `parameters.skipCanvas: true`, `layout: 'fullscreen'`,
   and the story supplies the production gutter itself —
   `<Box px={{ base:'md', sm:'xl', lg:'2xl', xxl:'3xl' }}>` — because `ListingsPageFrame` supplies it in
   production and `.storybook/preview.tsx:119-124` opts `Patterns/Mantine/*` out of `.container-wide`.
9. **Seed `nextjs.navigation.query` in every story** so conditional branches actually render: chips need
   several params **including a multi-value one** (e.g. `rooms=2,3`) to exercise both removal paths; the sort
   bar needs `sort` and a non-zero `total`; the filters trigger needs `activeFiltersCount > 0`.
10. **Probe retargeting (R9).** For every locator in §3.5: retarget it to a selector the migrated DOM
    actually emits, **verify it against the live DOM**, and re-run the probe. If a probe cannot be retargeted,
    retire it explicitly with the reason in the session log. **A locator that matches zero nodes must fail
    closed** — if the probe's own helper does not guarantee that, add the guard.
11. **Tests.** Extend `listingsFilterBar.smoke.test.tsx` (or add a sibling suite following its exact
    mocking shape) to cover C1, C2, C5, C7, C10 and C12 with RTL against the **real** components. Its
    existing T6 assertion on the `visibleFrom="md"` wrapper must still pass.
12. **No new dependency, no new pattern file, no new CSS module.**
13. **Encoding** (clause 14): UTF-8 without BOM, no mojibake — `npm run check:mojibake` exit 0. Cyrillic and
    Albanian diacritics in fixtures are a real risk here.

---

## 11. Positive and negative flows

### Positive flow

Authenticated user opens `/uk/listings?type=sale&rooms=2,3&sort=price_asc&page=2`. Status tabs render Mantine
pills with `active` selected. Chips render one per active filter, including two room chips. The action row
shows the count, the sort selector reading "Спочатку дешевші", the grid/list toggle (≥640) and the save-search
trigger. Clicking the second status tab pushes `?tab=closed` with `page` dropped. Removing the `rooms=2` chip
leaves `rooms=3` and every other param intact. Changing sort pushes `sort=newest`, `page` dropped. Save search
opens `MantineModal`, Enter saves, a success toast fires and the modal closes. At 320px, authenticated: no
horizontal overflow, both action-row controls visible and independently clickable, every target ≥44px.

### Negative-flow applicability

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation (blank save-search name) | **Yes** | `SaveSearchButton.tsx:38` | Falls back to `buildAutoName()`; no error | RTL (C9) |
| Duplicate saved search | **Yes** | `:52-56` | `toast.info(already_saved)` + close, **not** an error | RTL (C10) |
| Server-action error | **Yes** | `:57-60` | `toast.error`, **modal stays open**, `isPending` clears | RTL (C10) |
| Zero results | **Yes** | `ListingsShellView.tsx:108` | Empty state per `tab`; no grid, no pagination, no load-more | story cell + route |
| Zero chips | **Yes** | `ActiveFilterChips.tsx:181` | `null` — no empty row, no residual padding | RTL + story |
| Unauthenticated user | **Yes** | `ListingsShell.tsx:186` | `saveSearchSlot` is `null`; the sort bar occupies the row alone without layout collapse | anonymous probe run |
| Multi-value chip removal | **Yes** | `:37-44` | Removes only its own value | RTL (C2) |
| Long uk/it labels at 320 | **Yes** | clause 11 | Wrap, never clip, no horizontal scroll | rendered matrix |
| Authorization / RLS | **No** | `saveSavedSearch` unchanged; no new read/write path | N/A | — |
| Offline / network | **No** | No network layer change; `handleShowMore`'s existing `try/catch` is untouched | existing global behavior | — |
| Concurrent writer | **No** | No data model change | N/A | — |
| Schema / migration | **No** | No DB change | N/A | — |

### Enumerated accepted deltas (D775-B · D69-5) — show these, never claim neutrality

- **Δ1** — chip fill/border move from `bg-primary/10` + `border-primary/20` (alpha composites) to Mantine
  `variant="light"` `color="brand"` token values.
- **Δ2** — the save dialog's `max-w-[calc(100vw-2rem)]` marker-exempt width becomes a `MantineModal` size
  token, and the dialog gains `MantineModal`'s bottom-sheet presentation below 640px.
- **Δ3** — the listing grid's fourth column moves from Tailwind `2xl` (1536) to Mantine `xxl` (1440), per
  D775-A. Anything that reads as a fourth delta is a **finding**, not a fourth accepted item.

---

## 12. Acceptance criteria

Given/when/then. Every AC maps to requirement IDs.

- **AC1 [R1]** — Given Phase 1 is complete, when `ListingsStatusTabs.tsx` is read, then it imports `Tabs`
  from `@mantine/core`, contains **zero** `@/components/ui/*` imports and **zero** Tailwind utility strings,
  keeps `className="listings-status-tabs"` on its root, and C1 is proven by an RTL assertion on the exact
  `router.push` argument for **both** directions.
- **AC2 [R2]** — Given Phase 2 is complete, then `ActiveFilterChips.tsx` matches D69-4, contains zero shadcn
  imports and zero Tailwind utility strings, keeps `className="active-filter-chips"`, and C2/C3/C4 are proven
  by RTL — including a multi-value case asserting the surviving values **and** the untouched sibling params.
- **AC3 [R3]** — Given Phase 3 is complete, then `ListingsSortBar.tsx` imports neither
  `@/components/shared/Combobox` nor `@/components/ui/*`; the sort selector is `MantineCombobox`; and C5, C6,
  C7 and C8 each have a passing assertion.
- **AC4 [R4]** — Given Phase 3 is complete, then `SaveSearchButton.tsx` imports `MantineModal`, `Button` and
  `TextInput` and none of `Button`/`Input`/`Label`/`Dialog` from `@/components/ui/*`; the
  `design-tokens-allow:` marker is **absent from the file**; and C9-C13 each have a passing assertion.
- **AC5 [R5]** — Given Phase 4 is complete, then `ListingsShellView.tsx` contains zero
  `@/components/ui/*` imports and zero Tailwind utility strings, keeps `className="listings-shell"`, keeps
  `:77`/`:85` unchanged in behavior, exposes an unchanged `ListingsShellViewProps`, and C15-C18 each have a
  passing assertion.
- **AC6 [R7]** — Given the full diff, when `ListingsShell.tsx` is diffed, then it shows **zero** changes; and
  `git diff` touches no file under `src/modules/listings/hooks/`, `…/domain/`, `…/lib/`,
  `src/modules/cabinet/actions/`, or `src/app/[locale]/listings/`.
- **AC7 [R8]** — Given a running server and a **valid** authenticated storage state, when the retargeted
  route probe runs at 320/375/390 × sq/en/uk/it, then for every cell:
  `documentElement.scrollWidth <= clientWidth + 2`; the sort trigger and the save-search trigger each report
  `width > 0` and `height >= 44`; and `document.elementFromPoint()` at each control's centre returns that
  control or its own descendant — **the occlusion check is the point, and it must be asserted, not eyeballed.**
  An invalid session ⇒ `AUTH_STATE_UNAVAILABLE` ⇒ `BLOCKED` for this AC; it may not be claimed by any other
  means. Anonymous cells are measured regardless.
- **AC8 [R6]** — Given the final diff, then `npm run check:design-tokens` exits 0 (Windows-native), and no
  migrated file contains a raw px/rem/hex literal, a `design-tokens-allow:` marker, a `--space-*` reference
  or a Tailwind utility string. **Report the raw before/after violation counts, not just the exit code.**
- **AC9 [R9]** — Given the final diff, then for every locator listed in §3.5 the session log records
  `retargeted → <new selector> → probe re-run, result` or `retired → reason`; **no** listed locator remains
  in the tree in its dead form; and the retargeted probes were actually executed with their transcripts
  retained. A locator matching zero nodes is demonstrated to fail closed.
- **AC10 [R12]** — Given the final tree, when the `/[locale]/listings` client graph is enumerated from
  `page.tsx` outward, then no file imports `@/components/ui/*` other than `AppImage`, and none imports
  `@/components/shared/Combobox`. **Report the enumerated file list, not a grep count.**
- **AC11 [R10]** — Given the final diff, then five new `Patterns/Mantine/*` stories exist, each statically
  importing its real production component; `scripts/mantine-migration-scope.json` grows from **22** to
  **27** entries (re-measure the baseline); and `npm run check:story-coverage` exits 0.
- **AC12 [R11]** — Given a clean pre-edit baseline **B** captured before Phase 1's first edit and never
  overwritten, when `npm run screenshots:assert` runs on the final diff producing **P**, then
  `P \ B = ∅` compared as a set of normalized cell identities; every new cell PASSes; and the arithmetic is
  reconciled explicitly as `total(P) = total(B) + n`, `pass(P) = pass(B) + n`. With five new stories at
  4 viewports × 4 locales and no `MANTINE_STORY_EXTRA_VIEWPORTS` entry, the **expected** `n` is **80** —
  re-derive it from the manifest rather than trusting this number.
- **AC13 [R13]** — Given the final diff, then `npm run build` exits **0** in native Windows PowerShell with a
  retained transcript recording `node.exe -p process.platform` → `win32`, the Node version, the working
  directory, the exact command and the actual exit code. `npm run typecheck` exits 0. **No file was created
  under `docs/reviews/`.**
- **AC14 [R14]** — Given the final diff, then `npm run check:i18n` exits 0 and no new user-facing production
  string was introduced; any added story fixture key exists in all four locale files.
- **AC15 [R15]** — Given the session log, then Δ1, Δ2 and Δ3 are each recorded with a before/after rendered
  capture at a named viewport and locale. No statement anywhere claims the migration is visually neutral.

---

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** It applies because this task migrates five surfaces onto Mantine
primitives, replaces an overlay (`Dialog` → `MantineModal`), changes a page shell's layout, and changes
rendered chrome on the route's action row — four independent `Q3` triggers in `docs/qa-profiles.md`.
`Q2` is insufficient: the §3.6 occlusion defect is invisible at anything less than the authenticated
mobile matrix.

**Critical-flow registry.** Two rows are adjacent to this work:
`Listings filter controls — leaf sub-components + shell (Mantine)` and
`Mobile no-overflow at 320/375/390`. Neither names any of the five components, so neither is *entered* by
this task — but both must be re-run as regression:
`npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` ·
`npx vitest run src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` ·
`npm run screenshots:assert` (which is the second row's own gate).

**Windows-native execution gate (P0).** Every `node`/`npm`/`npx`/Playwright/Next/Storybook command runs in
native Windows PowerShell — `npm.cmd` / `npx.cmd`, never WSL, a Linux VM or a mounted Linux view. Record
`node.exe -p process.platform` → `win32` at the start of each evidence session, and record platform, Node
version, working directory, exact command and actual exit code in every transcript. A result from any other
platform is an environment screen, not evidence.

### Ordered command plan

```powershell
node.exe -p process.platform          # must print win32 — do this first, every session

# 0. Pre-edit census + baseline B (BEFORE the first edit; never overwrite B)
npm.cmd run build-storybook
npm.cmd run screenshots:assert        # retain the full transcript as baseline B
npm.cmd run check:design-tokens       # raw before-count
npx.cmd vitest run src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx

# 1..4. After each phase
npm.cmd run typecheck
npx.cmd vitest run src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens

# 5. Final gates on the complete diff
npm.cmd run check:i18n
npm.cmd run check:mojibake
npm.cmd run check:file-integrity
npm.cmd run lint
npm.cmd run build-storybook
npm.cmd run screenshots:assert        # this is P — reconcile against B per AC12
npx.cmd vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx
npx.cmd vitest run src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx
npx.cmd vitest run src/modules/cabinet/actions/__tests__/saveSavedSearch.dedup.test.ts
npm.cmd run typecheck
npm.cmd run build                     # HARD GATE — exit 0 required

# 6. Route evidence (needs a running server + a valid storage state)
npm.cmd run start                     # in a second shell, against the build above
node.exe scripts/<retargeted-772-probe>.mjs   # anonymous + authenticated
node.exe scripts/<retargeted-775-probe>.mjs
```

**Rendered matrix.** Storybook: the five new stories at `MANTINE_VIEWPORTS` (320 · 375 · 390 · 1024) × four
locales = 16 cells each, via `screenshots:assert`. Route: 320 · 390 · 680 · 1024 · 1440 × four locales, with
**320/375/390 mandatory in the authenticated state** for the action row. `uk@320` is mandatory throughout.

**A failed or unrun `npm run build` permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`** — never a completion
claim. If a command cannot run in the executor's environment, record it as `MISSING EVIDENCE` with the exact
native PowerShell command and finish `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

The session log at `docs/sessions/2026-09-XX-task781-listings-mantine-surface-completion.md` must contain:

1. **Files Changed** — a table matching the real diff exactly, one row per path, with the reason.
2. **Requirement IDs completed** — R1-R15, each `DONE` / `PARTIAL` / `NOT DONE`, with the evidence pointer.
3. **Acceptance-criteria self-audit** — AC1-AC15, each with its observed result, never a bare checkmark.
4. **Per-phase census** — the raw before/after `@/components/ui/*` import count and Tailwind-utility-string
   count for each phase's files, with the exact command that produced each number.
5. **Commands run and actual results** — every command above with its platform receipt, working directory and
   real exit code. Report failures as failures.
6. **AC12 reconciliation** — the B and P cell-identity sets, `P \ B`, `B \ P`, the new-cell list with each
   result, and the explicit arithmetic. A count alone does not close this.
7. **AC9 probe table** — one row per §3.5 locator: old locator → retargeted selector (or `retired`) → probe
   re-run result → transcript path.
8. **Δ1/Δ2/Δ3** — each with a before/after capture at a named viewport and locale.
9. **Assumptions, deviations, limitations, unresolved issues** — including the §3.8 `usePropertyTypes`
   fallback as it appears in the chips story.
10. **`docs/backlog.md`** updated with concise current state only. Take the line baseline from
    `git --no-optional-locks show HEAD:docs/backlog.md` **before** editing — three consecutive executors
    (717 · 721 · 722) misreported it by measuring after their own edit.

Final status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
**Never self-approve. Never run, emit or suggest a mutating git command.**
**Do not create `docs/reviews/*.review-ledger.json` (D69-3).**

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no hidden chat context | **Yes** — §6 names the exact pre-read bundle; §7 names every file; §13 gives every command |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1-R15 ↔ AC1-AC15 |
| Scope protects existing behavior and names what must not change | **Yes** — §8 and C1-C19 |
| UI publication checks (boundary · QA profile · source map · decision record · preservation) | **Yes** — §3.2 boundary, §13 Q3, §6b source map, §6a decision record, §3.1 preservation with positive evidence |
| Every permanent story addition passes the creation gate | **Yes** — §3.4 records the inspected candidate set (23 files) and the measured absence; each story's in-scope production consumer is named in §3.3; none is a gate probe. No reversible probe is used, so no restoration evidence is required |
| Negative flows selected by applicability, not copied | **Yes** — §11; four branches marked `No` with their reason |
| No claimed command, file, test, story or behavior went uninspected | **Yes** — every §3 line number was read this session; §5 A2/A3 are labelled assumptions, not facts |
| Absence/API claims carry a complete data-flow trace | **Yes** — §3.3 traces every consumer through production, story and test paths; §3.4's "no story exists" is a full directory listing plus a manifest read, not a grep |
| Gates prove the changed behavior, not procedure | **Yes** — AC7's `elementFromPoint` occlusion assertion and AC9's fail-closed locator requirement both target the specific defect class this migration creates |
| Every owner-only exception has traceable authorization | **Yes** — D69-1/2/3 quote the owner verbatim with dates; D69-4 cites the owner's plan file; D775-A/B/C and D68-2 are inherited with their original decision dates |
| Exactly one active executable route | **Yes** — D69-4 resolves the chip fork; no alternative is left for Sonnet to choose |
| Every checkpoint names producer, output, comparator, failure behavior | **Yes** — AC12 (B/P set comparator), AC7 (`AUTH_STATE_UNAVAILABLE` ⇒ `BLOCKED`), AC9 (fail-closed) |
| Dirty worktree handling | **N/A** — worktree measured clean this session; if it is dirty at dispatch, complete `docs/orchestrator-dirty-worktree-manifest-template.md` first |
| Baselines account for task-created artifacts and creation order | **Yes** — AC12 requires B **before** Phase 1's first edit and forbids overwriting it; the +80 new cells are named as task-created |
| No fact asserted `Confirmed` whose first verification is deferred to the executor | **Yes** — every §3 fact was measured in this session; §3 opens with an explicit I0 freshness re-measure instruction, and A1-A3 are labelled assumptions |
| Assumptions and unresolved decisions visible | **Yes** — §5 and D69-5 |

---

## 16. Handoff

Execute `tasks/Sprints/Sprint_69_kickoff_prompt_Task_781_Listings_Mantine_Surface_Completion.md` under
`.claude/skills/execute-task/SKILL.md`. Work the four phases in order; do not begin a phase before the
previous one's gates pass. Report per §14. Strongest allowed status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
