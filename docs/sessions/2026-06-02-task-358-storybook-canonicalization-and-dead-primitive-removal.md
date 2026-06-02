# Task 358 — Storybook canonicalization + dead-primitive removal

**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Type:** Storybook canonicalization + dead-primitive removal (governance/test surface; NO route migration, NO new UX)

---

## Summary

Deleted two unused layout primitives (`ActionBar`, `ControlGroup`), migrated all importers, and consolidated every remaining `*.stories.tsx` into a small, scenario-named canonical set. No runtime component code was changed except the two deleted primitives and the `layout/index.ts` export removal.

---

## W1 — Delete ControlGroup

| Action | Detail |
|---|---|
| Deleted | `src/components/layout/ControlGroup.tsx` |
| Deleted | `src/components/layout/ControlGroup.stories.tsx` (53 exports before) |
| Migrated | `AdminPageShell.stories.tsx` — replaced `ControlGroupTabs`/`ControlGroupOption` import with canonical `Tabs/TabsList/TabsTrigger` from `@/components/ui/tabs` |
| Note | `ControlGroup` was never exported from `layout/index.ts` — no index.ts change needed for W1 |

## W2 — Delete ActionBar

| Action | Detail |
|---|---|
| Deleted | `src/components/layout/ActionBar.tsx` |
| Deleted | `src/components/layout/ActionBar.stories.tsx` (32 exports before) |
| Removed | `export { ActionBar } from './ActionBar'` from `src/components/layout/index.ts` |
| Migrated | `PageHeader.stories.tsx` — replaced `ActionBar` wrapper with plain `<div className="flex flex-wrap gap-2">` in the action cluster factory |
| Fixed | `button.stories.tsx` — removed "ActionBar" from `ControlRowRhythm_Stacked` story docs string |

## W3 — Canonical story consolidation

### Before/After per-file export counts

| File | Before | After | Mode kept |
|---|---|---|---|
| `ActionBar.stories.tsx` | 32 | 0 (DELETED) | — |
| `ControlGroup.stories.tsx` | 53 | 0 (DELETED) | — |
| `FilterBar.stories.tsx` | 39 | 6 | Default / NoActiveFilters / WithActiveFilters / SheetOpenMobile / ManyAvailableFewActive / LocaleStress |
| `AdminPageShell.stories.tsx` | 33 | 7 | Default / WithTabs / WithActions / WithTabsAndActions / MultipleActions / NoHeader / LocaleStress |
| `AdminCardList.stories.tsx` | 32 | 7 | Default / Static / Compact / LegacyReactNode / Empty / Loading / LocaleStress |
| `PageHeader.stories.tsx` | 25 | 6 | Default / TitleOnly / WithCountBadge / WithAction / WithActions / LocaleStress |
| `PageShell.stories.tsx` | 22 | 6 | Default / Narrow / Form / AsDiv / ClassNameMerge / LocaleStress |
| `Section.stories.tsx` | 22 | 8 | WithTitleAndDescription / TitleOnly / DescriptionOnly / EmptyHeading / Stacked / InsideNarrow / InsideForm / LocaleStress |
| `StatusChangeHistory.stories.tsx` | 19 | 5 | Empty / Single / Multiple / LocaleStress / RawKeyStress |
| `StatusChangeControl.stories.tsx` | 17 | 6 | Select / SelectWithNote / Workflow / WorkflowRequiredNote / WorkflowWithHistory / LocaleStress |
| `Combobox.stories.tsx` | 10 | 6 | ButtonVariant / InputVariant / LongLabelLocaleStress / DropdownOpen / NoSelection / Disabled |
| `select.stories.tsx` | 9 | 5 | Default / NoSelection / LongLabelLocaleStress / Disabled / OutlineVariant |
| `button.stories.tsx` | 10 | 10 (fixed name + docs) | same canonical set; `ControlRowRhythm_Mobile320` renamed to `ControlRowRhythm_Stacked` |
| `PasswordInput.stories.tsx` | 7 | 7 (fixed name) | `Mobile320Ukrainian` renamed to `UkrainianLocaleStress` |
| `AdminTable.stories.tsx` | 10 | 10 (UNCHANGED) | already canonical from Task 354-Fix-2 |

**Total before:** 383 exports (including deleted files)  
**Total after:** ~110 exports (83 deleted from 2 deletions; ~190 removed from consolidation)

### Dead-reference verification

```
grep -rn "ControlGroup|from './ActionBar'|\bActionBar\b" src --include="*.ts" --include="*.tsx"
(empty output — clean) ✅
```

### No per-width export names remain

```
grep -rn "^export const [A-Za-z0-9_]*(320|375|390|480|...)" src --include="*.stories.tsx"
(empty output — clean) ✅
```

## W4 — Docs updated

| File | Change |
|---|---|
| `docs/design-system.md` | Removed ActionBar from §7 primitive list, §9 admin layout rule, §11.4 action cluster rule, §12a mobile stacking rule |
| `docs/component-catalog.md` | Removed `ActionBar` + `ControlGroup` rows; updated Layout Components count (9→7); added removal note |
| `docs/responsive-screenshot-matrix.md` | Removed all ActionBar entries; updated PageHeader story references to new canonical names; removed ActionBar QA section |
| `docs/storybook-governance.md` | Added §8b Canonical Story Taxonomy (scenario-named / no-per-width-export / breakpoints-via-toolbar / locales-via-toolbar / component removal governance) |
| `docs/backlog.md` | Last Session updated (2–4 lines) |

## Note 22 — Real mode inventory before/after

| Component | Real modes before | Real modes after |
|---|---|---|
| FilterBar | active/available/zero-active/sheet-open/reset/locale | ✅ all preserved |
| AdminPageShell | default/tabs/actions/tabs+actions/multi-action/no-header/locale | ✅ all preserved |
| AdminCardList | interactive/static/compact/legacy-node/empty/loading/locale | ✅ all preserved |
| PageHeader | default/title-only/count-badge/single-action/multi-action/locale | ✅ all preserved |
| PageShell | wide/narrow/form/as-div/className/locale | ✅ all preserved |
| Section | title+desc/title-only/desc-only/empty/stacked/inside-narrow/inside-form/locale | ✅ all preserved |
| StatusChangeHistory | empty/single/multiple/locale-stress/raw-key-fallback | ✅ all preserved |
| StatusChangeControl | select/select+note/workflow/workflow+required-note/workflow+history/locale | ✅ all preserved |
| Combobox | button-variant/input-variant/long-label/dropdown-open/no-selection/disabled | ✅ all preserved |
| Select | default/no-selection/long-label/disabled/outline-variant | ✅ all preserved |

## Validation outputs

### Dead-primitive references
```
(empty) ✅
```

### Per-width export names
```
(empty) ✅
```

### `npx tsc --noEmit`
```
(no output — exit 0) ✅
```

### `npm run lint`
```
(no output — 0 errors, 0 warnings) ✅
```

### `npm run check:i18n`
```
✅ Parity PASSED — all 4 locale files have identical key sets (1434 keys).
```

### `npm run build-storybook`
```
✓ built in 6.41s
info => Preview built (7.74 s)
info => Output directory: storybook-static
```
Exit 0 ✅

### Out-of-scope diff
```
git diff -- src/app src/modules package.json package-lock.json .storybook
(empty) ✅
```

## Rendered QA note

Storybook build passes (`build-storybook` exit 0). Visual inspection of the rendered canvas at all 14 canonical widths and 4 locales is **OWNER QA REQUIRED** — executor has no browser access. The canonical scenario stories direct the owner to use the viewport toolbar (320→2560) and locale toolbar (en/sq/uk/it) for coverage.

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/components/layout/ControlGroup.tsx` | DELETED | Zero product consumers in src/app + src/modules; owner-authorised (2026-06-02) |
| `src/components/layout/ControlGroup.stories.tsx` | DELETED | Dead story for deleted primitive |
| `src/components/layout/ActionBar.tsx` | DELETED | Zero product consumers; owner-authorised (2026-06-02) |
| `src/components/layout/ActionBar.stories.tsx` | DELETED | Dead story for deleted primitive |
| `src/components/layout/index.ts` | Removed ActionBar export | Primitive deleted |
| `src/components/admin/AdminPageShell.stories.tsx` | Rewritten: 33→7 stories; migrated from ControlGroupTabs to canonical Tabs primitive | W1 migration + W3 consolidation |
| `src/components/layout/PageHeader.stories.tsx` | Rewritten: 25→6 stories; ActionBar replaced with plain div | W2 migration + W3 consolidation |
| `src/components/ui/button.stories.tsx` | Renamed ControlRowRhythm_Mobile320→Stacked; removed ActionBar from docs string | W2 fix + per-width name cleanup |
| `src/components/layout/FilterBar.stories.tsx` | Consolidated: 39→6 stories | W3 canonicalization |
| `src/components/layout/PageShell.stories.tsx` | Consolidated: 22→6 stories | W3 canonicalization |
| `src/components/layout/Section.stories.tsx` | Consolidated: 22→8 stories | W3 canonicalization |
| `src/components/admin/AdminCardList.stories.tsx` | Consolidated: 32→7 stories | W3 canonicalization |
| `src/components/admin/StatusChangeHistory.stories.tsx` | Consolidated: 19→5 stories | W3 canonicalization |
| `src/components/admin/StatusChangeControl.stories.tsx` | Consolidated: 17→6 stories | W3 canonicalization |
| `src/components/shared/Combobox.stories.tsx` | Consolidated: 10→6 stories | W3 canonicalization |
| `src/components/ui/select.stories.tsx` | Consolidated: 9→5 stories | W3 canonicalization |
| `src/components/ui/PasswordInput.stories.tsx` | Renamed Mobile320Ukrainian→UkrainianLocaleStress | Remove per-width name suffix |
| `docs/design-system.md` | Removed ActionBar references from §7/§9/§11.4/§12a | W4 docs |
| `docs/component-catalog.md` | Removed ActionBar + ControlGroup rows; updated count (9→7) | W4 docs |
| `docs/responsive-screenshot-matrix.md` | Removed ActionBar entries; updated PageHeader story IDs | W4 docs |
| `docs/storybook-governance.md` | Added §8b Canonical Story Taxonomy | W4 docs |
| `docs/backlog.md` | Last Session updated | W4 docs |
| `docs/sessions/2026-06-02-task-358-storybook-canonicalization-and-dead-primitive-removal.md` | Session log (this file) | W4 docs |

*No `git add` / `git commit` issued. The ORCHESTRATOR (Opus) reviews the real diff and emits explicit-path commit commands.*
