# Task 905 — the listing-form fields render canonical Mantine, each proven by its own Story; the dead `steps/` directory is deleted

**Sprint 86** · **P2** · **Q4** (critical flows *Create listing* / *Edit listing*) · owner action **O86-1** ·
**Status: `KICKOFF FILED` 2026-09-30** · execute with `.claude/skills/execute-task/SKILL.md`

## 1. Mode and task type

- **Mode:** `TASK DESIGN`, a UI migration of leaf form controls, on the Mantine current path. It also removes dead
  code.
- **Surface:** the field layer of `/listings/create` and `/listings/[slug]/edit`. That is
  `src/modules/listings/components/form/` (`DynamicFieldSection` plus the nine components registered in
  `form/fieldRegistry.ts`), and the shared `YearCombobox` those fields render.
- **Sprint plan:** `tasks/Sprints/Sprint_86_Listing_Form_On_Canonical_Mantine.md`. 906 (`ImageUpload`) and 907 (the
  shell, view, admin edit panel and routes) follow. This task changes **no** file outside §7.

## 2. Objective

Every control the listing form renders for a property's details becomes a canonical Mantine control. It reuses
sources the migrated filter panel already proved, keeps each field's exact `onChange` contract, and gets its own
canonical Story. The five `steps/Step*.tsx` files, which nothing imports, are deleted together with the baseline rows
that kept them visible.

## 3. Verified context — measured 2026-09-30 by the orchestrator

### 3.1 Dead code, with the trace

A repository search (`src`, tests, e2e, scripts) for each name, excluding the file itself and the two baseline JSON
files:
- `StepBasicInfo`, `StepLocation`, `StepPhotos` and `StepPreview` return **nothing**.
- `StepDetails` returns only a comment in `src/modules/listings/domain/propertyTypeSchema.ts:15`.
- No barrel re-exports `steps/`: the directory holds the five files only.
- The census baselines still carry them: `scripts/surface-census-baseline.json` has 18 `steps/Step*` rows, and
  `scripts/type-responsive-baseline.json` has `steps/StepPreview.tsx :: text-2xl` (legacy site **L8**).

### 3.2 The field layer, measured

`DynamicFieldSection.tsx` renders `FIELD_COMPONENT_REGISTRY[field.componentType]` (`fieldRegistry.ts:31-42`). The
census cannot follow this map, so every entry below was read by hand.

| Component | Lines | className | `@/components/ui/*` | What it renders today | `onChange` contract (preserve) |
|---|---|---|---|---|---|
| `NumInputField` | 53 | 4 | `Input`, `Label` | label + `type=number` input (`id=fieldDef.key`, bounds from `FIELD_BOUNDS`), error `<p>` | `''` → `undefined`; NaN → `undefined`; else `Number` |
| `AreaPairField` | 49 | 4 | `Input`, `Label` | 2-col grid of `area_gross` / `area_net` number inputs, `min=1`, placeholder `m²` | the same parsing per key |
| `BuildingFloorsField` | 29 | 3 | `Input`, `Label` | `total_floors` number input, 1–200 | the same parsing |
| `FloorGroupField` | 95 | 8 | `Input`, `Label`, `Checkbox` | `multi_storey_building` checkbox (only when `schema.floor.requiresCheckbox`); a `floor` input (min `floorMin`, max 200); an optional `total_floors` input; `errors.floor` | unchecking clears a negative `floor`; `floorMin = allowNegative && multi_storey ? minFloor : 0` |
| `RoomsSelectorField` | 37 | 4 | `Button`, `Label` | `ROOMS_OPTIONS` toggle buttons, `5` shown as `5+` | re-click clears (`undefined`); the value is a **number** |
| `ButtonGroupField` | 52 | 4 | `Button`, `Label` | single-select buttons (heating / wall_type / offer_type) | re-click clears |
| `EnumSelectorField` | 63 | 5 | `Button`, `Label` | **vertical** single-select list (condition, land_*), selected = primary tint | re-click clears; shows `errors[key]` |
| `MultiToggleField` | 55 | 4 | `Button`, `Label` | multi-select buttons (purchase_conditions) | an empty selection → `undefined` |
| `YearComboboxField` | 22 | 3 | `Label` | label + shared `YearCombobox` (`className="w-full"`) | passes the value through |
| `DynamicFieldSection` | 82 | 1 | — | the group grid `grid-cols-2 sm:grid-cols-3 gap-4` | none |
| `components/shared/YearCombobox.tsx` | 67 | 1 | — | already `MantineCombobox`, wrapped in `div.year-combobox` (no CSS consumer: a search for `year-combobox` finds only this line and the registry key) | unchanged |

None of them is in `scripts/mantine-migration-scope.json`. The only Story is the legacy
`src/modules/listings/components/form/NumInputField.stories.tsx` (`title: 'Listings/Form/NumInputField'`, a legacy
title). No test or e2e selects the fields by `id` (searched `#bedrooms`, `#area_gross`, `#floor`, … over `e2e`,
tests, `src`, scripts: no hit).

### 3.3 Canonical sources, inspected

- **`FilterChoiceGroup`** (`src/components/shared/FilterChoiceGroup.tsx`): the canonical single/multi toggle group
  (Task 781R). It is built from Mantine `Button`s (`variant` filled or light when selected, `default` otherwise) in a
  wrapping `Group`, or a `Stack` with `orientation="vertical"`. `mode="single"` takes `allowDeselect` and `mode="multiple"` takes `onToggle`. It
  is proven by `Mantine/Primitives/FilterControls` (`src/stories/mantine/primitives/FilterControls.stories.tsx`), and
  consumed by `ListingsFilters.tsx` for the **same** option sets (`CONDITIONS`, `HEATING_TYPES`, `WALL_TYPES`,
  `OFFER_TYPES`, `PURCHASE_CONDITIONS`). It is **not enrolled** in `scripts/mantine-migration-scope.json`.
- **Number input:** the project has no `NumberInput`. The migrated number inputs use Mantine `TextInput type="number"`
  (`FilterRangeInputs.tsx:23-37`), proven by `Mantine/Primitives/TextInput`. Its native `label` and `error` props
  replace `Label` and the error `<p>`.
- **Checkbox:** Mantine `Checkbox`, proven by `Mantine/Primitives/Checkbox`. Its native `label` prop.
- **Label and error around a group:** Mantine `Input.Wrapper` (`label`, `error`), the canonical Mantine field chrome
  (theme `TextInput`/`Checkbox` styles, `theme.ts:1023`/`:1062`).
- **Grid:** Mantine `SimpleGrid`. `gap-4` is 16px, which is the theme's `md` (`theme.ts:640`).
- **`YearCombobox`:** it has no Story of its own. `Mantine/Primitives/Combobox` imports only `MantineCombobox`
  (`Combobox.stories.tsx:7`).

## 4. Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R1** | Delete `src/modules/listings/components/steps/` (all five files). Delete every `steps/Step*` row from `scripts/surface-census-baseline.json` (18) and the `StepPreview` row from `scripts/type-responsive-baseline.json`. Update the comment at `propertyTypeSchema.ts:15` so it no longer names `StepDetails`. | P1 | AC1 |
| **R2** | The number fields (`NumInputField`, `AreaPairField`, `BuildingFloorsField`, and `FloorGroupField`'s inputs) render Mantine `TextInput type="number"`. Each keeps its `id`, `min`, `max` and `placeholder`, uses `label` and `error` props, and applies the unchanged parsing. The `AreaPairField` grid and the `FloorGroupField` pair render `SimpleGrid cols={2} spacing="md"`. | P1 | AC2, AC5 |
| **R3** | `FloorGroupField`'s checkbox becomes Mantine `Checkbox` (`id="multi_storey_building"`, `label`, `checked`, `onChange` → the same patch). The floor error renders through the `floor` input's `error` prop. | P1 | AC2, AC5 |
| **R4** | The choice fields render **`FilterChoiceGroup`**, wrapped in `Input.Wrapper label=… error=…`:<br>• `RoomsSelectorField`: `mode="single"`, `allowDeselect`, options `ROOMS_OPTIONS.map(r => ({ value: String(r), labelKey: r === 5 ? '5+' : String(r) }))`, `getLabel={k => k}`, `selected={formValues.rooms === undefined ? '' : String(formValues.rooms)}`, and `onChange` → `rooms: v === '' ? undefined : Number(v)`;<br>• `ButtonGroupField`: `mode="single"`, `allowDeselect`, `variant="filled"`, and `''` → `undefined`;<br>• `EnumSelectorField`: `mode="single"`, `allowDeselect`, `orientation="vertical"`, `variant="light"`, `justify="flex-start"`, the error through `Input.Wrapper`;<br>• `MultiToggleField`: `mode="multiple"`, `variant="filled"`, and `onToggle` with the unchanged add/remove/empty → `undefined` logic.<br>`getLabel` is `t` for the enum fields. `FilterChoiceGroup` itself is **not edited**. | P1 | AC2, AC5 |
| **R5** | `YearComboboxField` renders `Input.Wrapper label={t('year_built')}` around `YearCombobox`, and no longer passes `className`. `YearCombobox.tsx` is unchanged. | P1 | AC2 |
| **R6** | `DynamicFieldSection`'s group grid becomes `SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md"`. Every file in `form/` then has **0** `className` and **0** `@/components/ui/*` imports. | P1 | AC2 |
| **R7** | Enrol in `scripts/mantine-migration-scope.json` the nine field files, `DynamicFieldSection.tsx`, `src/components/shared/FilterChoiceGroup.tsx` and `src/components/shared/YearCombobox.tsx`. `fieldRegistry.ts` is not a component, so it is not enrolled. | P1 | AC3 |
| **R8** | **Stories (GR-3, GR-3a).**<br>• **CREATE** `src/stories/patterns/mantine/ListingFormFields.stories.tsx`, `title: 'Patterns/Mantine/ListingFormFields'`. It imports **by name** the nine fields and `DynamicFieldSection`. `parameters: { skipCanvas: true }`, and every export wraps its content in `StoryPageGutter`.<br>• The exports render `DynamicFieldSection` with `getSchema(<type>)` (`propertyTypeSchema.ts:332`): one export per property type needed to show all nine field kinds (pick the types from `PROPERTY_TYPE_SCHEMA` and name the choice in the log). One of them is an underground-capable type (`getUndergroundFloorTypes()`) with `multi_storey_building: true`. Add a `WithValuesAndErrors` export (pre-selected values and one error per field kind that shows errors).<br>• Local `useState` holds `formValues`, so the controls are interactive. Labels come from the real `listing.*` keys.<br>• **Delete** the legacy `form/NumInputField.stories.tsx`, and carry its floors_total label state into the new Story.<br>• **EXTEND** `src/stories/mantine/primitives/Combobox.stories.tsx` with an export `YearCombobox` that imports `YearCombobox` by name (empty and pre-selected).<br>• `FilterChoiceGroup` is already proven by `FilterControls`: no change there. | P1 | AC3, AC4 |
| **R9** | **Regression (critical flow, Q4).** Add `src/modules/listings/components/form/__tests__/fieldContracts.test.tsx` (vitest + RTL, with the `NextIntlClientProvider` + `MantineProvider` harness that `ListingCard.smoke.test.tsx` uses). Assert each §3.2 `onChange` contract through real clicks and typing:<br>• rooms click → number, re-click → `undefined`;<br>• button-group and enum re-click → `undefined`;<br>• multi-toggle last-off → `undefined`;<br>• number `''` → `undefined`, `'12'` → `12`;<br>• floor-group uncheck with `floor: -1` → `floor: undefined`;<br>• each rendered label is associated with its control (`getByLabelText`).<br>Prove two cases two-armed: (a) make `RoomsSelectorField` send the string instead of `Number(v)` → the test fails; (b) drop `allowDeselect` from `ButtonGroupField` → the test fails; restore both, then all pass; record a hash witness per file. `src/modules/listings/actions/__tests__/createListing.smoke.test.ts` stays green. | P0 | AC5 |

## 5. Assumptions and open questions

- **Accepted visible change:**
  - the toggle buttons take the `FilterChoiceGroup` look: Mantine `Button` `filled`/`light` against `default`,
    identical to the filter panel;
  - the number inputs take the theme `TextInput` chrome;
  - the rounded-xl local overrides disappear.

  That is the migration. The owner judges it in O86-1.
- The form shell around the fields (`ListingFormShellView`) stays legacy until **907**, so the route is mixed in the
  meantime. Only the Stories are the proof path here.

## 6. Pre-read rule bundle

`docs/golden-rules.md`, `docs/agent-contract.md` (16a–16d), `docs/mantine-responsive-design-system.md`,
`docs/tailadmin-style-reference.md`, `docs/component-rules.md`, `docs/qa-rules.md`, `docs/qa-profiles.md`,
`docs/critical-flow-registry.md` (the create and edit rows), the sprint plan, and this kickoff.

## 7. Scope

- `src/modules/listings/components/form/*.tsx`: nine fields, `DynamicFieldSection`, and `fieldRegistry.ts` only if a
  type import needs it.
- `src/modules/listings/components/form/NumInputField.stories.tsx` (deleted)
- `src/modules/listings/components/form/__tests__/fieldContracts.test.tsx` (new)
- `src/modules/listings/components/steps/` (deleted)
- `src/modules/listings/domain/propertyTypeSchema.ts` (the `:15` comment only)
- `src/stories/patterns/mantine/ListingFormFields.stories.tsx` (new)
- `src/stories/mantine/primitives/Combobox.stories.tsx` (the `YearCombobox` export)
- `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`,
  `scripts/type-responsive-baseline.json`
- `docs/backlog.md` (the 905 state), and the session log `docs/sessions/2026-09-30-task905-listing-form-fields.md`

## 8. Out of scope

- `ListingFormShellView`, `ListingFormShell`, `ListingFormLoader`, `AdminEditLayout`, `StatusChangeControl` and
  `StatusChangeHistory` (**907**); `ImageUpload` (**906**); the route files.
- `FilterChoiceGroup.tsx` and `YearCombobox.tsx` source: they are reused as they are.
- `messages/*`: no new key is expected. If one proves necessary, add it to all four files and run `check:i18n`.

## 9. Current and required behavior

- **Preserve:**
  - every `onChange` contract in §3.2;
  - every field id and every min/max bound;
  - the floor visibility rules (`showFloor`, `floorMin`, `showFloorsTotal`);
  - the `filter-only` null renderer;
  - the grouping in `buildRenderItems`.
- **Required after:** §3.3's canonical controls. No `className`, `style` or raw px in `form/`. Each component is
  enrolled and imported by name by a canonical Story.

## 10. Implementation requirements

- Type-scale table (GR-3c). No text reaches 24px:

  | Element | Role | base | sm | md | lg | Theme key | Provenance |
  |---|---|---|---|---|---|---|---|
  | Field label | label | 14px | 14px | 14px | 14px | theme `Input.Wrapper`/`TextInput` label (`sm`) | `theme.ts:1023` |
  | Field error | helper | 12px | 12px | 12px | 12px | theme input error (`xs`) | `theme.ts:1023` |
  | Choice button | control | theme `Button` default | = | = | = | theme `Button` | `FilterChoiceGroup.tsx` |

- The fields stay `'use client'`. No new hook, provider or dependency.
- `SimpleGrid cols={{ base: 2, sm: 3 }}` keys on the viewport, as the legacy `sm:grid-cols-3` did. No behaviour
  change.

## 11. Positive and negative flows

**Positive:** on `/listings/create` a user picks an apartment. They set rooms 3, area 85/70, floor 4 of 9, condition
"good", heating "gas" and purchase conditions "mortgage", and submit. The payload is identical to before the
migration.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---|---|---|---|
| Validation error on a field | Yes | `errors[key]` from the shell | the error renders under that field, through `error` / `Input.Wrapper` | `WithValuesAndErrors` Story; R9 test |
| Deselect by re-click | Yes | §3.2 | the value becomes `undefined` | R9 |
| Empty or non-numeric number | Yes | §3.2 | `undefined` | R9 |
| Underground floor with the checkbox off | Yes | `FloorGroupField` | negative floor cleared | R9 |
| Long `uk`/`sq` option labels at 320 | Yes | `FilterChoiceGroup` wraps on the container width | no overflow | `story-measure.log` |
| Authorization/RLS, network | No | server actions unchanged | — | `createListing.smoke` green |

## 12. Acceptance criteria

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: none.`

- **AC1 [R1].**
  - `steps/` does not exist.
  - A search for `StepBasicInfo|StepDetails|StepLocation|StepPhotos|StepPreview` over `src`, `scripts`, `e2e` and
    tests prints no line.
  - `check:surface-census:changed` and `check:type-responsive` exit 0, with no stale entry.
- **AC2 [R2–R6].**
  - A search for `className=|@/components/ui/|style=` in `src/modules/listings/components/form/*.tsx` prints no line.
  - `check:design-tokens` exits 0.
- **AC3 [R7, R8].**
  - `check:story-coverage` exits 0 with the twelve new manifest entries.
  - `Patterns/Mantine/ListingFormFields` imports each of the ten form components by name.
  - `Mantine/Primitives/Combobox` imports `YearCombobox`.
  - The legacy `Listings/Form/NumInputField` Story no longer exists.
- **AC4 [R8].** In `story-measure.log`, for every `listingformfields--*` export at 320/390/768/1024/1440 in `en` and
  `uk`:
  - edge gap 16/16/—/32/32 (±1);
  - no horizontal overflow;
  - every field kind appears in at least one export (count per kind, printed);
  - no text at 24px or more.
- **AC5 [R9].**
  - `fieldContracts.test.tsx` passes.
  - Its two plant logs show **fail → pass**, with equal hashes.
  - `createListing.smoke.test.ts` passes.
- Every §13.2 log ends `EXIT_CODE=0`, `npm run build` included.

## 13. QA profile and verification plan

**Q4:** critical flows *Create listing* and *Edit listing* (`docs/critical-flow-registry.md:64-65`).

### 13.1 I0 — before any write

```powershell
$ev = "docs\sessions\evidence\task905"
New-Item -ItemType Directory -Force $ev
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\i0.log"
git --no-optional-locks status --short | Tee-Object -Append "$ev\i0.log"
git --no-optional-locks hash-object src/modules/listings/components/form/NumInputField.tsx src/modules/listings/components/form/AreaPairField.tsx src/modules/listings/components/form/BuildingFloorsField.tsx src/modules/listings/components/form/FloorGroupField.tsx src/modules/listings/components/form/RoomsSelectorField.tsx src/modules/listings/components/form/ButtonGroupField.tsx src/modules/listings/components/form/EnumSelectorField.tsx src/modules/listings/components/form/MultiToggleField.tsx src/modules/listings/components/form/YearComboboxField.tsx src/modules/listings/components/form/DynamicFieldSection.tsx src/modules/listings/components/form/fieldRegistry.ts src/components/shared/FilterChoiceGroup.tsx src/components/shared/YearCombobox.tsx scripts/mantine-migration-scope.json scripts/surface-census-baseline.json scripts/type-responsive-baseline.json | Tee-Object -Append "$ev\i0.log"
```

Expected: `win32`, then, in order:
1. `4a1782bbad132348cd9948a86ab2344a3ae7d68e` (NumInputField)
2. `9e6d9d07e43ef6c41952d16a22ba6d3e2e5f023a` (AreaPairField)
3. `4f98dc2427feb2789c364994e40fca2977fd1c7b` (BuildingFloorsField)
4. `2a1881f16c5b74c66dc9aa1c9d079a49acea7135` (FloorGroupField)
5. `302e36b4731e18db4fc578203f922a515ca08e67` (RoomsSelectorField)
6. `8d87468044b7dccb9809317fdfa9d9aa2ebe3e4d` (ButtonGroupField)
7. `9cb84ef36c27c338eede54140e72b2e9aa8ab9c4` (EnumSelectorField)
8. `454ba31157184feb7e62b9e284ac1dac139fb6ce` (MultiToggleField)
9. `c017360b107acce49bc4487f3b126428387b06ee` (YearComboboxField)
10. `ca7d36a12ab50e4958dd1f00251332afcebd9eba` (DynamicFieldSection)
11. `3982f7ec32e97042f982d81e1fe9977963b1ae20` (fieldRegistry)
12. `dc17f2b611264d73c88f2bd043b2b9d9e618e674` (FilterChoiceGroup)
13. `f36f5361dd6ba951a1e4d68b1ec951d5977a66d1` (YearCombobox)
14. `2072e31c818ecf6f27b47f5e0f5a7d39fe36a60a` (mantine-migration-scope)
15. `712a5bdfd05e352c4693d8b45f365e1b46492e63` (surface-census-baseline)
16. `c08a1d6f7326aa6c7556193e1278e1690a5df0b1` (type-responsive-baseline)

These are the hashes at design time. If 904 lands first, it changes `type-responsive-baseline.json`. In that case
confirm with `git log -1 -- scripts/type-responsive-baseline.json` that 904 alone changed it, record the new hash, and
continue. Any other difference is `TASK SPECIFICATION CONTRADICTION`: stop.

### 13.2 Final gate block (one pass, on the final tree)

```powershell
$ev = "docs\sessions\evidence\task905"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\typecheck.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\typecheck.log"
npm.cmd run lint *>&1 | Tee-Object "$ev\lint.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\lint.log"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\check-type-responsive.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-type-responsive.log"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\check-design-tokens.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-design-tokens.log"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\check-story-coverage.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-story-coverage.log"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\check-rendered-scope.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-rendered-scope.log"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\census-changed.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\census-changed.log"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\check-i18n.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-i18n.log"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\check-file-integrity.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-file-integrity.log"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\check-mojibake.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\check-mojibake.log"
npm.cmd run test -- src/modules/listings/components/form/__tests__/fieldContracts.test.tsx src/modules/listings/actions/__tests__/createListing.smoke.test.ts *>&1 | Tee-Object "$ev\tests.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\tests.log"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\build-storybook.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\build-storybook.log"
npm.cmd run build *>&1 | Tee-Object "$ev\build.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\build.log"
```

- Then write `git --no-optional-locks hash-object` of **every** path in `git status --short` that this task owns into
  `$ev\hash-object.log`, one line per path, with deleted paths recorded as `DELETED <path>`.
- Normalise every log to UTF-8 without a BOM through Node.
- The two R9 plants go into `$ev\plant-a.log` and `$ev\plant-b.log`, each with its before, planted and after hashes.
  Read and write the files through Node.

**Measurement.** With a throwaway native Playwright probe under `.artifacts/` on the rebuilt `storybook-static`, record
AC4 into `$ev\story-measure.log`. Also run this grep, into `$ev\grep.log`:

```powershell
git --no-optional-locks grep -n -E "className=|@/components/ui/|style=" -- src/modules/listings/components/form
git --no-optional-locks grep -n -E "StepBasicInfo|StepDetails|StepLocation|StepPhotos|StepPreview" -- src scripts e2e
```

Expected: no line from either.

### 13.3 OWNER VISUAL QA REQUIRED — O86-1

| Story | GR-3d | Locales | Widths |
|---|---|---|---|
| `Patterns/Mantine/ListingFormFields` → every export | `StoryPageGutter` (created in this task) | `en`, `uk` | 320, 768, 1440 |
| `Mantine/Primitives/Combobox` → `YearCombobox` | n/a: `MantineStoryShell` primitive | `en` | 320, 1440 |
| `Mantine/Primitives/FilterControls` → `Default` (blast radius: unchanged, now enrolled) | n/a: `MantineStoryShell` primitive | `en` | 320 |

The owner records **accepted**, or **returned** with a concrete defect, for each.

## 14. Completion report contract

Write `docs/sessions/2026-09-30-task905-listing-form-fields.md`. It contains:
- the Files Changed table;
- R1–R9 with their evidence paths;
- the property types chosen for each Story export, and the field kinds each covers;
- every §13 command with its exit code;
- the plant logs;
- the `story-measure.log` summary;
- these receipts: GR-0 (one per field kind, REUSE as §3.3), GR-1 (the census of
  `src/modules/listings/components/form/DynamicFieldSection.tsx` plus the hand-read registry list), GR-2,
  GR-3 (each field ← `ListingFormFields.stories.tsx`; `YearCombobox` ← `Combobox.stories.tsx`), GR-3a,
  GR-3b, GR-3c and GR-3d per changed Story.

Update the 905 state in `docs/backlog.md`. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. No mutating git.

## 15. Task quality gate

- Every absence claim (dead `steps/`, no id selectors, no `year-combobox` CSS consumer) carries its search in §3.
- Each field kind has one REUSE disposition in §3.3. There is no feature-local style and no new primitive.
- The critical flow has a planted, two-armed regression (R9), and the existing create smoke stays green.
- The shell and upload are explicitly 906 and 907, sequenced in the sprint plan, not silently excluded (16d: they are
  filed tasks in the same response).
