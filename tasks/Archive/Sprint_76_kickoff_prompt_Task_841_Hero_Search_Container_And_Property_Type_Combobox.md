# Task 841 — the homepage hero search: `HeroSearch` and `PropertyTypeCombobox` get their canonical Story proof and manifest entries, and the combobox drops its Tailwind residue

Sprint 76 · P2 · QA profile **Q4** (critical flow) with the Q3 visual matrix

**Status: ✅ `APPROVED WITH NOTES` 2026-09-18 (review 2, Revision 1) — archived. Notes: locale-leak waived (OD-2);
the §7a Playwright probe is unretained, and R7's visual result is closed by OD-3; session log §4 still has one stale sentence
("described in §11 for Opus to apply"), which §11 and §16.1 supersede.**
Review 1: `NEEDS REVISION` 2026-09-18 — evidence-only Revision 1, see §16.
Original status line, kept for context: `READY FOR SONNET` 2026-09-18 — do not run concurrently with Task 840 (both extend
`src/stories/mantine/primitives/FilterControls.stories.tsx`; either order, never in parallel). Filed at Sprint 75's
closure by owner instruction *"закривай спринт і заводь задачі на міграцію"* (2026-09-18). Binding owner rule of the same
day: *"у проекті не треба створювати тести, які будуть перевіряти legacy компоненти та елементи. Ми мігруємо на Minetine
увесь проект."*

## 1. Mode and task type

`IMPLEMENTATION` — remove Tailwind residue from one Mantine-built control and put two unenrolled components under
canonical Story proof, without adding a new Storybook page. Bundles: **UI / Current Mantine path** +
**Storybook / Visual Proof**. Critical flow: `docs/critical-flow-registry.md:56` "Listings filter controls" (its
`heroSearch.smoke.test.tsx` mounts the real `HeroSearch`).

## 2. Objective

The homepage hero search is already Mantine inside. Two parts of it are not yet finished:

1. **`HeroSearch`** is the thin container that `HeroSearchClient` loads through `next/dynamic`. It has no Story and no
   manifest entry.
2. **`PropertyTypeCombobox`** is built on `MantineCombobox` but still carries two Tailwind strings. It also has no
   Story and no manifest entry.

After this task, both are enrolled, both are imported by a canonical Story, and `PropertyTypeCombobox` follows its
sibling `LocationCombobox` exactly. No new Storybook page is created. Nothing the user sees changes.

## 3. Verified context — measured 2026-09-18 by the orchestrator (re-measure at I0)

### 3.1 Duplicate search (owner instruction 2026-09-18: *"спочатку перевір чи є вже готові story та компоненти"*)

| Question | Search | Result |
|---|---|---|
| Another property-type selector in Mantine? | `git ls-files 'src/**' \| grep -i propertytype`; `git grep -l PROPERTY_TYPES -- src` | **None.** `AdminPropertyTypesManager` is the admin CRUD page for the property-type table, not a selector. |
| Canonical Story importing `PropertyTypeCombobox`? | `git grep -l -E "from ['\"][^'\"]*/PropertyTypeCombobox['\"]" -- '*.stories.tsx'` | **None.** It is rendered only inside compositions: `Mantine/Primitives/HeroSearch` (through `HeroSearchView`) shows it in the hero's "All types" state. |
| Canonical Story importing `HeroSearch`? | same search for `/HeroSearch'` | **None.** `Mantine/Primitives/HeroSearch` (`src/stories/mantine/primitives/HeroSearch.stories.tsx`) imports `HeroSearchView` and `HeroSearchFallback` only (`:4-5`), by the Task 568 owner decision of 2026-07-10 (render the View directly, no hook mock). |
| Sibling precedent | `LocationCombobox` | Enrolled + storied (`Mantine/Primitives/LocationComboboxSubPanel`), wrapper `<div className={cn('location-combobox', className)}>` (`LocationCombobox.tsx:115`), icon `<MapPin size={theme.other.iconSize.standard} />` (`:122`). |
| Page for filter-control leaves | `Mantine/Primitives/FilterControls` (`src/stories/mantine/primitives/FilterControls.stories.tsx`) | Imports `FilterRangeInputs`, `FilterChoiceGroup`, `FilterRoomsRow` directly (`:5-7`) in labelled `Stack` sections. **This is the host for `PropertyTypeCombobox`'s direct proof** — see the GR-3a receipt. |

### 3.2 `PropertyTypeCombobox.tsx` (51 lines), read in full

- `:6` `import { cn } from '@/lib/utils'`; `:5` `import { Home } from 'lucide-react'`; `:8` `MantineCombobox` from `@/design-system/mantine/patterns`.
- `:36` `<div className={cn('property-type-combobox', className ?? 'sm:w-48 shrink-0')}>` — Tailwind fallback used only
  when `className` is omitted.
- `:43` `icon={<Home className="h-4 w-4" />}` — Tailwind 16px icon size.
- Census root row: `manifest:no story:no className:2 ui-imports:0`.

**The fallback is unreachable today** (`FACT`, full importer trace): `git grep -n PropertyTypeCombobox -- src` shows exactly two JSX call
sites and no Story import. Both pass `className`:
- `HeroSearchView.tsx:108-112` passes `className={styles.typeControl}`. That CSS-module class already reproduces
  `basis-full sm:basis-auto sm:w-48 shrink-0` (`HeroSearchView.module.css:79-91`).
- `ListingFormShellView.tsx:175-181` passes `className="w-full"`. That file is Task 796's legacy form and is not
  edited here; the string still reaches the wrapper unchanged.

`.property-type-combobox` itself has no selector anywhere in `src/` (`git grep` hit only the component).

### 3.3 `HeroSearch.tsx` (93 lines), read in full

Container only: `useLocale`, `useRouter`, `useLocations()` (`src/modules/locations/hooks/useLocations.ts` —
`getSearchableLocations()` from Supabase, `.catch(console.error)`, starts `[]`), five `useState`s, `handleSearch`
builds `/${locale}/listings?…`. It renders `HeroSearchView` only. `className:0 ui-imports:0 manifest:no story:no`.
It is loaded by `HeroSearchClient.tsx:6-12` (`next/dynamic`, `ssr:false`, `loading: HeroSearchFallback`), rendered at
`src/app/[locale]/page.tsx:47`.

**Storybook feasibility (`FACT`):** `.storybook/preview.tsx:227-229` sets `nextjs: { appDirectory: true }` globally, so
`useRouter` resolves. Real containers whose hooks call Supabase unmocked already have canonical Stories:
`Mantine/Primitives/FavoritesShell` (`useFavoritesRealtime`) and `Patterns/Mantine/AuthSheet` (`useLocations`, whose
comment records that it resolves to an empty list, caught and non-fatal). `NextIntlClientProvider` wraps every story
(`preview.tsx:102-109`).

### 3.4 Clause 16d / GR-1 census — surface `src/components/shared/HeroSearch.tsx`

`node.exe scripts\check-surface-census.mjs --surface src\components\shared\HeroSearch.tsx` → **17 nodes**, blocking:

| Node | State | Tier / owner |
|---|---|---|
| `HeroSearch.tsx` | `manifest:no story:no className:0` | tier 1 — **this task** |
| `PropertyTypeCombobox.tsx` | `manifest:no story:no className:2` | tier 1 — **this task** |
| `FilterChoiceGroup.tsx` | `manifest:no story:yes className:2` | shared with `/listings` → **Task 840** |
| `FilterRangeInputs.tsx` | `manifest:no story:yes className:0` | shared → **Task 840** |
| `FilterRoomsRow.tsx` | `manifest:no story:yes className:0` | shared → **Task 840** |
| `YearCombobox.tsx` | `manifest:no story:no className:1` | shared → **Task 840** |

The other 11 nodes (`HeroSearchView`, `FiltersPanel`, `LocationCombobox`, `MantineCountButton`, `MantineAddItemPanel`,
`MantineCombobox`, `MantineDrawer`, `MantineFilterSection`, `RangeDatePicker`, `MantinePopover`,
`responsiveBottomSheet`) are enrolled and storied. Tier 2: none.

`GR-1 CENSUS COMPLETE — 17 nodes; tier1 2 migrated+enrolled+story (HeroSearch, PropertyTypeCombobox — this task); tier2 0 imports removed; tier3 4 listed and filed as 840.`

### 3.5 Baselines this task will make stale

- `scripts/rendered-scope-baseline.json:19`:
  `"src/components/shared/HeroSearchView.tsx -> src/components/shared/PropertyTypeCombobox.tsx"`.
- `scripts/surface-census-baseline.json`, four rows:
  - `HeroSearch.tsx :: HeroSearch.tsx :: tier1-unenrolled-or-unstoried`
  - `HeroSearch.tsx :: PropertyTypeCombobox.tsx :: …`
  - `HeroSearchView.tsx :: PropertyTypeCombobox.tsx :: …`
  - `ListingFormShell.tsx :: PropertyTypeCombobox.tsx :: …`

All five are paid-off debt after this task and are removed by the sanctioned writers (§10 step 7). The rows for
840's four leaves stay.

`scripts/story-coverage-exempt.json:29,38` still claim both components cannot be storied. That file is **retired and
read by no gate** (`check-story-coverage.mjs:31`; Task 625 precedent). Out of scope.

### 3.6 Canonical UI decision record

| Visible artifact | Search / inspected paths | Canonical source | Disposition | Style path and registration |
|---|---|---|---|---|
| `PropertyTypeCombobox` wrapper | §3.1, §3.2 | `LocationCombobox.tsx:115` | **reuse** its idiom | `cn('property-type-combobox', className)` — no Tailwind default; consumers own layout (both already do). Manifest entry. |
| `PropertyTypeCombobox` icon | `theme.ts:492-500` (`iconSize.standard: 16`) | `LocationCombobox.tsx:122` | **reuse** | `<Home size={theme.other.iconSize.standard} />` via `useMantineTheme()` — value-preserving (Tailwind `h-4 w-4` = 16px). |
| `PropertyTypeCombobox` Story proof | §3.1 | `Mantine/Primitives/FilterControls` | **extend** | One new labelled section with the real component. No new page. |
| `HeroSearch` Story proof | §3.1, §3.3 | `Mantine/Primitives/HeroSearch` | **extend** | One new state export rendering the real container inside the Story's existing hero `Box` composition. No new page. |

Visual source map: no rendered value changes. The wrapper's layout in the hero comes from `HeroSearchView.module.css`
`.typeControl` (unchanged). The icon stays 16px, `currentColor`.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | owner 2026-09-18 | `PropertyTypeCombobox.tsx` contains no Tailwind utility string: the wrapper is `cn('property-type-combobox', className)` and the icon is sized by `theme.other.iconSize.standard`. Props interface unchanged. | P1 | AC1, AC2 | Confirmed |
| **R2** | GR-3 / 16c | `Mantine/Primitives/FilterControls` statically imports `PropertyTypeCombobox` and renders it in two states: hero ("All types", `showAllOption` default, empty value) and form (`showAllOption={false}`, placeholder `listing.property_type_placeholder`). Each is controlled by a local `useState` demo wrapper like the file's existing demos. | P1 | AC3 | Confirmed |
| **R3** | GR-3 / 16c | `Mantine/Primitives/HeroSearch` statically imports `HeroSearch` and gains one state export, `Container`, that renders the real `<HeroSearch />` unmocked inside the same hero `Box` frame as `Default`. That frame (today duplicated at `:57-58` for `Default` and `:94-95` for `Fallback`) is factored into one story-local component used by all three exports. The JSDoc records why. | P1 | AC4 | Confirmed |
| **R4** | 16c | Both components are in `scripts/mantine-migration-scope.json`; their census root rows read `manifest:yes story:yes`. | P1 | AC5, AC6 | Confirmed |
| **R5** | preserve / critical flow | Hero search behaviour is unchanged: the same URL is pushed for the same input, and the critical-flow tests pass with the same results before and after. | P0 | AC7 | Confirmed |
| **R6** | agent-contract 9 | The five §3.5 rows are removed by the writers; every §13.2 gate passes. | P1 | AC8 | Confirmed |

## 5. Assumptions and open questions

- `useLocations` in Storybook: `AuthSheet`'s recorded outcome is an empty list with a caught error. If this build
  instead fetches real rows, the `Container` state is still valid (it shows the placeholder), but report the observed
  behaviour. **Do not add a mock.** A mock contradicts the Task 568 owner decision; if one seems necessary, stop with
  `BLOCKED`.
- Changed behaviour: none. Q4 asks for a changed-behaviour test. There is nothing behavioural to assert, and the owner
  rule of 2026-09-18 forbids tests aimed at legacy, so **no new test is added**. The before/after regression run in
  §13.2 is the Q4 evidence.
- No open owner decision.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (clauses 9, 13, 14, 15, 16-16d) · `docs/qa-profiles.md` ·
`docs/critical-flow-registry.md` (row 56) · `docs/mantine-responsive-design-system.md` (Combobox section) ·
`docs/component-rules.md` · `docs/storybook-governance.md` (Mantine story shape) · `docs/qa-rules.md` ·
`.claude/skills/execute-task/SKILL.md`.

## 7. Scope

- **Edited:**
  - `src/components/shared/PropertyTypeCombobox.tsx`
  - `src/stories/mantine/primitives/FilterControls.stories.tsx` (one section)
  - `src/stories/mantine/primitives/HeroSearch.stories.tsx` (one export, shared frame, JSDoc)
  - `scripts/mantine-migration-scope.json` (two entries)
  - `scripts/rendered-scope-baseline.json` and `scripts/surface-census-baseline.json` (writer output only)
  - `docs/backlog.md` (841 state line)
- **Written:** `docs/sessions/evidence/task841/*` · `docs/sessions/<date>-task841-hero-search-container-and-property-type-combobox.md`.

## 8. Out of scope

- `HeroSearch.tsx` (its code does not change; it only gains a Story and a manifest entry) · `HeroSearchView.tsx`,
  its CSS module, `HeroSearchClient.tsx`, `HeroSearchFallback.tsx`.
- `ListingFormShellView.tsx` and its `className="w-full"` → Task 796.
- The four filter leaves → Task 840.
- `MantineCombobox` · `scripts/story-coverage-exempt.json` (retired) · `messages/*.json` (no new key; all keys used exist).
- **No new test** (owner rule 2026-09-18).

## 9. Current and required behavior

**Before.** The hero shows the property-type combobox (All types, 16px house icon) laid out by
`HeroSearchView`'s `.typeControl`. The form shows it full-width. Neither `HeroSearch` nor `PropertyTypeCombobox` is
enrolled or storied, and the combobox holds an unreachable Tailwind default plus a Tailwind icon size.

**After.** The hero and the form look and behave the same. The combobox holds no Tailwind. Both components are enrolled and
directly proven: `PropertyTypeCombobox` in `FilterControls`, and the real `HeroSearch` container in the HeroSearch
Story's new `Container` state.

## 10. Implementation requirements

1. **I0** — record:
   - `node.exe -p "process.platform + ' ' + process.version"` and `git --no-optional-locks status --porcelain`.
   - `git --no-optional-locks hash-object` of the edited files.
   - the §3.4 census command and the §3.1 searches.
   - the §3.2 importer grep.
   - **the regression baseline:** the §13.2 test command, run before any edit.

   Any difference from §3 → `BLOCKED` with the new measurement. If Task 840 is mid-flight (its kickoff or session
   log says in progress, or `FilterControls.stories.tsx` is dirty) → `BLOCKED` until it lands.
2. Edit through Node UTF-8 I/O or the editor — never PowerShell `Get-Content -Raw` without `-Encoding utf8`.
3. **`PropertyTypeCombobox.tsx`:**
   - `:36` becomes `cn('property-type-combobox', className)`.
   - `:43` becomes `<Home size={theme.other.iconSize.standard} />`, with `const theme = useMantineTheme()` and
     `useMantineTheme` imported from `@mantine/core`.
   - Nothing else changes.
4. **`FilterControls.stories.tsx`:** add one labelled `Stack gap="xs"` section, following the file's existing section
   pattern. The label is `storyT(locale, 'common.property_type')`. It renders two controlled demos of the real
   `PropertyTypeCombobox`:
   - hero: defaults;
   - form: `showAllOption={false}` and `placeholder={storyT(locale, 'listing.property_type_placeholder')}`.

   Update the file's JSDoc to name the new section and its production call sites (`HeroSearchView.tsx:108`,
   `ListingFormShellView.tsx:175`).
5. **`HeroSearch.stories.tsx`:**
   - Import `HeroSearch` from `@/components/shared/HeroSearch`.
   - Factor the hero `Box` frame used by `Default` (`:57-58`) and `Fallback` (`:94-95`) into one story-local frame component and use it in all three exports.
   - Add `export const Container: Story` rendering `<HeroSearch />` in that frame.
   - Extend the JSDoc with the reason: GR-3 needs a direct import of the real container. It stays unmocked, like
     `FavoritesShell`/`AuthSheet`, and that is consistent with the Task 568 decision (no mocks).
   - `Default` and `Fallback` render exactly as before.
6. **Enrol** `src/components/shared/HeroSearch.tsx` and `src/components/shared/PropertyTypeCombobox.tsx` in
   `scripts/mantine-migration-scope.json`, following the file's ordering.
7. **Baselines, writers only.** Run `npm.cmd run check:rendered-scope:update-baseline`, then
   `node.exe scripts\check-surface-census-changed.mjs --base HEAD --update-baseline`. Expected: exactly the five §3.5
   rows removed and nothing added, with no tier-2 refusal. If either writer refuses, fails closed, or reports any other
   row → `BLOCKED` with the transcript. Never hand-edit a baseline.

## 11. Positive and negative flows

**Positive.** Homepage → the hero loads (fallback, then the real search) → pick "Apartment", a city, Search → the
browser goes to `/<locale>/listings?type=sale&property_type=apartment&location_id=…`, exactly as before.

| Negative flow | Applicable | Expected |
|---|---|---|
| A consumer omits `className` | Yes (no current consumer does) | The wrapper renders `property-type-combobox` only — the same as `LocationCombobox`; the consumer owns layout. |
| `showAllOption={false}` (form) | Yes | No "All types" row; placeholder shown; covered by the form demo (R2). |
| Locations unavailable (Supabase error / empty) | Yes | `HeroSearch` renders with an empty location list (existing `.catch`). The `Container` Story shows this state in Storybook. |
| Long locale (`uk`) at 320 | Yes | Hero controls wrap as today; the combobox label does not overflow. |
| Keyboard Enter in the location field | Yes | Runs the search (unchanged, `HeroSearch.tsx:70-72`); covered by `heroSearch.smoke`. |
| Authorization / RLS / concurrency | No | Read-only public search; no write path. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `PropertyTypeCombobox.tsx`, when
  `git grep -n -E "sm:w-48|shrink-0|h-4 w-4|className=\"" -- src/components/shared/PropertyTypeCombobox.tsx` runs, then
  it prints nothing. Quote the final wrapper and icon lines.
- **AC2 [R1]** — Given `git diff -- src/components/shared/PropertyTypeCombobox.tsx`, when read, then the only changed
  lines are the wrapper, the icon and the `useMantineTheme` import/call. The `Props` interface is not in the diff.
- **AC3 [R2]** — Given `FilterControls.stories.tsx`, when read, then it imports `PropertyTypeCombobox` from
  `@/components/shared/PropertyTypeCombobox` and renders it twice with the R2 props. Quote the import and both elements.
- **AC4 [R3]** — Given `HeroSearch.stories.tsx`, when read, then it imports `HeroSearch` and exports `Default`,
  `Fallback` and `Container`. `Container` renders `<HeroSearch />` in the shared frame, and no mock or alias of
  `useLocations`/`next/navigation` is added. Quote the export.
- **AC5 [R4]** — Given the §3.4 census command after the change, when run, then the `HeroSearch.tsx` and
  `PropertyTypeCombobox.tsx` rows read `manifest:yes story:yes`, and the blocking list names only 840's four leaves.
- **AC6 [R4]** — Given `npm.cmd run check:story-coverage`, when run, then it exits 0.
- **AC7 [R5]** — Given the §13.2 test command, run at I0 and after the change, when both transcripts are compared, then
  the set of passing tests is identical. If a test fails in either run, run it once more and keep both transcripts.
  Task 790 records a timeout-shaped flake in `heroSearch.smoke`/`filtersPanelShell.smoke`. A failure in the final run
  that did not occur at I0 is a regression.
- **AC8 [R6]** — Given `git diff --stat -- scripts/rendered-scope-baseline.json scripts/surface-census-baseline.json`,
  when read, then only deletions appear (the five §3.5 rows). `npm.cmd run check:rendered-scope` and
  `node.exe scripts\check-surface-census-changed.mjs --base HEAD` both exit 0.
- **AC9 [R1-R3]** — Given the owner matrix §13.3, when every tuple is reviewed, then each is recorded accepted, or returned with a concrete defect.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: AC1's empty grep defines the removal and is scoped to one file; AC8's "only deletions" is the writers' deterministic output for a named row set.`

`GR-3a STORY PREFLIGHT — PropertyTypeCombobox × hero default + form variant; canonical candidates: Mantine/Primitives/HeroSearch (composition via HeroSearchView, hero default only, no direct import), Mantine/Primitives/FilterControls (sibling filter-leaf page, direct imports of the other leaves); direct-import evidence: NONE; toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: EXTEND; target: Mantine/Primitives/FilterControls; rationale: no page imports it directly, and the form variant is shown nowhere. A new page would duplicate the hero composition's proof.`

`GR-3a STORY PREFLIGHT — HeroSearch × real container, initial state; canonical candidates: Mantine/Primitives/HeroSearch; direct-import evidence: NONE (imports HeroSearchView only, :4); toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: EXTEND; target: Mantine/Primitives/HeroSearch; rationale: the existing page is the component's canonical home, and the missing proof is one state.`

`GR-3 STORY PROVEN — PropertyTypeCombobox ← src/stories/mantine/primitives/FilterControls.stories.tsx; HeroSearch ← src/stories/mantine/primitives/HeroSearch.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q4`**: the change touches critical flow `critical-flow-registry.md:56`, so a regression baseline plus a final run
is required. The visual evidence is the Q3 owner matrix. There is no gate claim, so no planted-violation proof applies.

### 13.1 Re-entry

`from-scratch`. Evidence root is `docs/sessions/evidence/task841/`. Number transcripts `00-`…, give each an
`EXIT_CODE=` line, and write them through Node or with `-Encoding utf8`.

### 13.2 Regression command (I0 and final) and final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run test -- src/components/shared/__tests__/heroSearch.smoke.test.tsx src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\components\shared\HeroSearch.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "sm:w-48|shrink-0|h-4 w-4|className=\"" -- src/components/shared/PropertyTypeCombobox.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/components/shared/PropertyTypeCombobox.tsx src/stories/mantine/primitives/FilterControls.stories.tsx src/stories/mantine/primitives/HeroSearch.stories.tsx scripts/mantine-migration-scope.json scripts/rendered-scope-baseline.json scripts/surface-census-baseline.json docs/backlog.md
```

Run the first `npm.cmd run test …` line alone at I0 as the baseline, before any edit.

Expected in the final block:
- Every `npm`/`node` command exits 0, with two exceptions:
  - the surface census exits 1 on 840's four leaves only, which is AC5's expected set;
  - `check:locale-leak:mantine-only` is known red (Task 836). The requirement is **no leak line whose `storyId` is
    `mantine-primitives-filtercontrols--default`, `mantine-primitives-herosearch--default` or
    `mantine-primitives-herosearch--container`**. Quote the transcript grep for the three IDs; zero lines expected.
- The `git grep` prints nothing and exits 1.
- Run `check:locale-leak` after `build-storybook`, never concurrently.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Mantine/Primitives/FilterControls` | new property-type section | 1440 | en | two comboboxes: "All types" with house icon; form variant with placeholder, no "All types" option when opened |
| 2 | same | same | 390 | uk | full width, text fits, icon 16px |
| 3 | `Mantine/Primitives/HeroSearch` | `Container` | 1440 | en | looks like `Default` except no active-filter badge; tabs, type, location, filters, Search present |
| 4 | same | `Container` | 320 | uk | wraps like `Default`; no overflow |
| 5 | same | `Default` | 1440 | en | unchanged from before the task |
| 6 | homepage (live app) | hero search | 390 and 1440 | en | type combobox looks as before; choose a type + city, Search → `/listings` with those filters |

## 14. Completion report contract

Report the following:
- files, with before/after hashes;
- R1-R6 and AC1-AC9, with quotes;
- every command, with its exit code and transcript path;
- the I0 re-measure and the regression baseline;
- the two writer transcripts;
- the observed `useLocations` behaviour in Storybook;
- the GR-1, GR-3 and GR-3a receipts;
- assumptions, deviations and limitations;
- the §13.3 matrix.

Status is one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No
self-approval, no mutating git, no `git push`. Sonnet updates the 841 line of `docs/backlog.md` and writes the session
log with a Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Duplicate component or Story? | §3.1: no other property-type selector exists. No new page is created. Both proofs **extend** the pages that already own these components' context (GR-3a receipts). |
| Probe markup? | No. Both additions document in-scope production components (16c); the `Container` state is the real container. |
| GR-1 / 16d | §3.4 receipt; the four shared leaves are filed as 840. |
| GR-2 | `check:story-coverage` sees only enrolled files; AC5's census rows close R4. |
| Hardcode rule | The icon uses an existing theme role; the wrapper loses its only Tailwind default; no new value. |
| "No legacy tests" | No test added; existing critical-flow tests are re-run only. |
| Conflict with 840 | The shared file is named in the Status line; I0 stops if 840 is in flight. |

## 16. Revision 1 — review 1 `NEEDS REVISION` (2026-09-18)

### 16.1 Re-entry mode

`remediation`. Start at §16.4 step 1. Everything else from the first pass stays as it is:
R1-R6, AC1-AC8, every transcript `00-`…`55-`, and the build (`54-build-square-fix.txt`, exit 0). Do **not** re-run
any gate. Do **not** change any file under `src/` or `scripts/`. Do **not** edit `docs/backlog.md`. Opus owns the
backlog for this revision, because the `Stop` hook blocked the executor's backlog edit in the first pass.

### 16.2 Owner decisions recorded by the reviewer (2026-09-18, answers given to review 1, quoted as given)

| # | Question | Owner answer (verbatim) | Effect |
|---|---|---|---|
| OD-1 | Keep the `MantineCountButton` fix (session log §7a) in Task 841? | "Confirm, keep in 841" | §16.3 R7 is in scope. |
| OD-2 | Does the waiver of `check:locale-leak:mantine-only` (§13.2) stand? | "Waiver stands" | §13.2's locale-leak line and its three-story-ID grep are waived for 841. The owner's AC9 visual check replaces them. |
| OD-3 | AC9 owner matrix result, including the collapsed/no-badge square filters icon at 640? | "All accepted" | AC9 is accepted for every §13.3 tuple and for the §16.3 R7 state. |

### 16.3 Scope added by OD-1

| ID | Requirement | Files | Status after review 1 |
|---|---|---|---|
| **R7** | In the collapsed state with no badge (`iconOnlyBelow` active, `count` 0), `MantineCountButton` renders its icon centred in a square `theme.other.touchTarget` × `theme.other.touchTarget` box. The collapsed state with a badge is unchanged. | `src/design-system/mantine/patterns/MantineCountButton.tsx`, `src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx`, `src/stories/mantine/primitives/CountButton.stories.tsx` | Code, tests (`43-`: 99/99), planted failures (`26-`, `42-`), build (`54-`) and owner visuals (OD-3): verified by the reviewer. **Missing: the GR-3a receipt for the Story edit (F1).** |

- **AC10 [R7]** — Given the session log, when read, then it contains a literal GR-3a receipt for
  `MantineCountButton` × collapsed + no badge, naming the canonical candidate
  `Mantine/Primitives/CountButton`, its direct-import evidence `src/stories/mantine/primitives/CountButton.stories.tsx:7`,
  decision `EXTEND`, and target `Mantine/Primitives/CountButton`.

### 16.4 Findings and required corrections

| # | Severity | Finding | Correction |
|---|---|---|---|
| **F1** | P2 (GR-3a: "the reviewer returns `NEEDS REVISION`") | The §7a Story write (a new state in `CountButton.stories.tsx`) has no GR-3a receipt. Session log §9 only mentions "GR-3a-equivalent reasoning". The outcome was correct: it extended the one canonical Story that imports the component. | Step 1. |
| **F2** | P3 | Session log §7a presents "a Playwright probe … measured … `44×44px` exactly" plus a screenshot as "real-browser evidence". No probe script, transcript or screenshot is in `docs/sessions/evidence/task841/`. | Step 2. |
| **F3** | P3 (orchestrator-procedures, Corollary 818) | The last `git hash-object` witness (`20-final-hashes.txt`) predates §7a. The final gate block `39-`…`54-` carries no hash. It also omits the three §7a files. | Step 3. |

**Steps:**

1. In the session log §7, add this line after the two existing GR-3a receipts. Re-verify its direct-import claim
   first with the grep in step 4:
   `GR-3a STORY PREFLIGHT — MantineCountButton × collapsed + no badge (count 0, iconOnlyAbove=640 iconOnlyBelow=860); canonical candidates: Mantine/Primitives/CountButton; direct-import evidence: src/stories/mantine/primitives/CountButton.stories.tsx:7; toolbar coverage: locale=Storybook locale toolbar, viewport=Storybook viewport toolbar; decision: EXTEND; target: Mantine/Primitives/CountButton; rationale: the only canonical Story that imports the component; every earlier collapsed demo there has a non-zero count, so the missing state was added to it and no new page was created.`
   If the grep shows a second canonical candidate, stop with `BLOCKED` and quote the output.
2. In session log §7a, relabel the Playwright paragraph as `UNRETAINED — not review evidence`. Keep what it says, and
   add that R7's visual outcome is closed by owner decision OD-3 (kickoff §16.2). Do not re-run or recreate the probe.
3. Write `docs/sessions/evidence/task841/56-final-hashes.txt` with the §16.4 command block below. Every hash must equal
   the review-1 value in §16.5. If any hash differs, a source file changed after review: stop with `BLOCKED` and list
   the mismatching paths.
4. Session log: set the status line to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (Revision 1)`. Update §2 AC9
   to "accepted by owner, OD-3". Update §8's locale-leak deviation to cite OD-2. Update §9's three open items to
   cite OD-1/OD-2/OD-3. Add a Files Changed row for `56-final-hashes.txt`. Remove §11's instruction for Opus to apply
   the backlog, and point to §16.1.
5. Run `check:file-integrity` and `check:mojibake` (block below) after the session-log edit, and save them as
   `57-`/`58-`.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
git --no-optional-locks grep -n -E "import .*MantineCountButton" -- "src/**/*.stories.tsx"
git --no-optional-locks hash-object src/components/shared/PropertyTypeCombobox.tsx src/design-system/mantine/patterns/MantineCountButton.tsx src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx src/stories/mantine/primitives/CountButton.stories.tsx src/stories/mantine/primitives/FilterControls.stories.tsx src/stories/mantine/primitives/HeroSearch.stories.tsx scripts/mantine-migration-scope.json scripts/rendered-scope-baseline.json scripts/surface-census-baseline.json
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks status --short
```

Expected: the grep prints exactly one line, `CountButton.stories.tsx:7`. The nine hashes equal §16.5 in the same
order. Both checks exit 0. Status shows the same nine `M` paths as review 1, plus the session log and the evidence directory.

### 16.5 Review-1 hash witness (reviewer, 2026-09-18, `git hash-object`)

```
3bf075dcf589528ba90644b6d4687b8513f61957  src/components/shared/PropertyTypeCombobox.tsx
c14cd3e7e4dc1a5b06929fea5750f95c30426558  src/design-system/mantine/patterns/MantineCountButton.tsx
500a97bb99e6fbf81d05fb339bc636870680bcfb  src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx
37471a129688e44487dbee1b68fcc13498ad11b8  src/stories/mantine/primitives/CountButton.stories.tsx
edd6d6edc7da015a3859efbc31349feba16d2bff  src/stories/mantine/primitives/FilterControls.stories.tsx
06f10d249503ac4f31c57c0823cecdbbc56b0d32  src/stories/mantine/primitives/HeroSearch.stories.tsx
b6cc13e8dc6191b2ac7700b400c999f3180438d3  scripts/mantine-migration-scope.json
c86f7f9b9fd9e9d50b8716459c442d42830ca8e2  scripts/rendered-scope-baseline.json
2e38cc51b203ad58206fed47825854c17134c332  scripts/surface-census-baseline.json
```

### 16.6 Review-1 census (reviewer, native `win32 v22.22.3`)

`check-surface-census.mjs --surface src\components\shared\HeroSearch.tsx` → 17 nodes, exit 1. `HeroSearch`,
`PropertyTypeCombobox` and `MantineCountButton` read `manifest:yes story:yes`. It blocks only on 840's four leaves.

`GR-1 CENSUS COMPLETE — 17 nodes; tier1 2 migrated+enrolled+story this task (HeroSearch, PropertyTypeCombobox) + MantineCountButton already enrolled+storied; tier2 0 imports removed; tier3 4 listed and filed as 840.`

### 16.7 Completion

Report the three steps with their transcript paths and the hash comparison. Status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating
git, no `git push`, no `docs/backlog.md` edit.
