# Component Coverage Matrix — Lero.al
Last generated: 2026-05-18

## Storybook Coverage

| Component | Story | Story file |
|---|---|---|
| `alert` | ❌ | — |
| `AppImage` | ❌ | — |
| `appImageConfig.ts` | ✅ | src/components/ui/appImageConfig.ts.stories.tsx |
| `avatar` | ❌ | — |
| `badge` | ✅ | src/components/ui/badge.stories.tsx |
| `button` | ✅ | src/components/ui/button.stories.tsx |
| `card` | ❌ | — |
| `checkbox` | ✅ | src/components/ui/checkbox.stories.tsx |
| `command` | ❌ | — |
| `dialog` | ✅ | src/components/ui/dialog.stories.tsx |
| `dropdown-menu` | ❌ | — |
| `input` | ✅ | src/components/ui/input.stories.tsx |
| `input-group` | ❌ | — |
| `label` | ❌ | — |
| `navigation-menu` | ❌ | — |
| `pagination` | ❌ | — |
| `popover` | ❌ | — |
| `progress` | ❌ | — |
| `radio-group` | ❌ | — |
| `scroll-area` | ❌ | — |
| `select` | ❌ | — |
| `separator` | ❌ | — |
| `sheet` | ✅ | src/components/ui/sheet.stories.tsx |
| `skeleton` | ✅ | src/components/ui/skeleton.stories.tsx |
| `slider` | ❌ | — |
| `sonner` | ❌ | — |
| `switch` | ❌ | — |
| `table` | ❌ | — |
| `tabs` | ✅ | src/components/ui/tabs.stories.tsx |
| `textarea` | ❌ | — |
| `useAdaptiveImageConfig.ts` | ✅ | src/components/ui/useAdaptiveImageConfig.ts.stories.tsx |

## Responsive Screenshot Coverage

Stories in Phase 5 screenshot target list:

| Story ID | Viewport focus | Locale focus |
|---|---|---|
| `primitives-button--*` | mobile-320, mobile-375, huge-2560 | all 4 locales |
| `primitives-input--*` | mobile-375 | all 4 locales |
| `primitives-tabs--*` | tablet-768 | all 4 locales |
| `primitives-dialog--*` | mobile-375 | all 4 locales |
| `primitives-sheet--*` | mobile-375, tablet-768 | all 4 locales |
| `primitives-badge--*` | desktop-1280 | all 4 locales |
| `primitives-skeleton--*` | desktop-1280 | all 4 locales |
| `system-listinggrid--*` | mobile-375, desktop-1280, huge-2560 | all 4 locales |
| `system-containers--*` | desktop-1280, huge-2560 | all 4 locales |
| `system-emptystate--*` | mobile-375, desktop-1280 | all 4 locales |
| `system-adminlayout--*` | desktop-1280 | all 4 locales |

## Locale Coverage

| Locale | Covered by | Coverage level |
|---|---|---|
| `sq` (Albanian) | Storybook global toolbar, story fixtures | Full (all 12 stories) |
| `en` (English) | Storybook global toolbar, story fixtures | Full (all 12 stories) |
| `uk` (Ukrainian) | Storybook global toolbar + explicit story variants | Full + stress variants |
| `it` (Italian) | Storybook global toolbar, story fixtures | Full (all 12 stories) |

## Breakpoint Coverage

| Breakpoint | In fast-check matrix | In full matrix | Story coverage |
|---|---|---|---|
| 320px | ✅ | ✅ | button, listinggrid, emptystate |
| 360–480px | — | ✅ | (full matrix only) |
| 640–768px | ✅ (768px) | ✅ | sheet, dialog, tabs |
| 1024–1440px | ✅ (1280, 1440) | ✅ | listinggrid, containers, admin |
| 1720–1920px | — | ✅ | (full matrix only) |
| 2560px | ✅ | ✅ | listinggrid-huge, containers-wide |
| 3440px ultrawide | — | ✅ | (full matrix only) |

## Governance Script Coverage

| Check | Script | Coverage |
|---|---|---|
| Raw `<button>` | `governance:primitives` | All src/ |
| Viewport JS | `governance:ssr` | All src/ |
| Responsive classes | `governance:responsive` | All src/ |
| Tailwind entropy | `governance:tailwind` | All src/ |
| i18n keys | `governance:localization` | messages/*.json |
| Component catalog | `governance:components` | All src/ |
| Screenshot infra | `governance:screenshots` | scripts/ + .storybook/ |

## Coverage Gaps

Components without Storybook stories (future coverage targets):

| Component | Type | Risk |
|---|---|---|
| `AdminCurrenciesManager` | admin-shared | Locale-sensitive |
| `AdminCurrencyTabs` | admin-shared | Locale-sensitive |
| `AdminExchangeProvidersManager` | admin-shared | Locale-sensitive |
| `AdminLegalManager` | admin-shared | Locale-sensitive |
| `AdminListingsTable` | admin-shared | Locale-sensitive |
| `AdminLocaleSwitcher` | admin-shared | Locale-sensitive |
| `AdminLocationsManager` | admin-shared | Locale-sensitive |
| `AdminMobileHeader` | admin-shared | Locale-sensitive |
| `AdminPageHeader` | admin-shared | — |
| `AdminPropertyTypesManager` | admin-shared | Locale-sensitive |
| `AdminSearchInput` | admin-shared | — |
| `AdminSettings` | admin-shared | Locale-sensitive |
| `AdminShell` | admin-shared | — |
| `AdminSidebar` | admin-shared | Locale-sensitive |
| `AdminUserAvatar` | admin-shared | Locale-sensitive |
| `AdminUserCreate` | admin-shared | Locale-sensitive |
| `AdminUserProfile` | admin-shared | Locale-sensitive |
| `AdminUsersTable` | admin-shared | Locale-sensitive |
| `AvatarCropModal` | shared-ui | — |
| `Combobox` | shared-ui | Locale-sensitive |
| `DatePicker` | shared-ui | Locale-sensitive |
| `FilterMultiToggle` | shared-ui | — |
| `FilterRangeInputs` | shared-ui | — |
| `FilterRoomsRow` | shared-ui | — |
| `FiltersPanel` | shared-ui | Locale-sensitive |
| `FilterToggleGroup` | shared-ui | — |
| `Header` | layout | Locale-sensitive |
| `HeroSearch` | shared-ui | Locale-sensitive |
| `HeroSearchClient` | shared-ui | — |
| `LocaleSwitcher` | shared-ui | — |
| `LocationCombobox` | shared-ui | Locale-sensitive |
| `Map` | shared-ui | — |
| `MapWrapper` | shared-ui | — |
| `MobileBottomNav` | layout | Locale-sensitive |
| `PerfDevOverlay` | shared-ui | — |
| `PerformanceStoreInit` | shared-ui | — |
| `PropertyTypeCombobox` | shared-ui | Locale-sensitive |
| `RelativeTime` | shared-ui | — |
| `WebVitalsReporter` | shared-ui | — |
| `YearCombobox` | shared-ui | — |