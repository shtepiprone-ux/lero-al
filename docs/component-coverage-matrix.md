# Component Coverage Matrix — Lero.al
Last generated: 2026-07-24

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
| `command` | ✅ | src/components/ui/command.stories.tsx |
| `dialog` | ✅ | src/components/ui/dialog.stories.tsx |
| `dropdown-menu` | ✅ | src/components/ui/dropdown-menu.stories.tsx |
| `input` | ✅ | src/components/ui/input.stories.tsx |
| `input-group` | ❌ | — |
| `label` | ❌ | — |
| `mobile-bottom-sheet.ts` | ✅ | src/components/ui/mobile-bottom-sheet.ts.stories.tsx |
| `navigation-menu` | ✅ | src/components/ui/navigation-menu.stories.tsx |
| `pagination` | ❌ | — |
| `PasswordInput` | ✅ | src/components/ui/PasswordInput.stories.tsx |
| `PasswordRequirementsHint` | ✅ | src/components/ui/PasswordRequirementsHint.stories.tsx |
| `popover` | ✅ | src/components/ui/popover.stories.tsx |
| `progress` | ❌ | — |
| `radio-group` | ❌ | — |
| `scroll-area` | ❌ | — |
| `select` | ✅ | src/components/ui/select.stories.tsx |
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
| `system-featuredlistings--default` | mobile-375, desktop-1280, huge-2560 | all 4 locales |
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
| 320px | ✅ | ✅ | button, featuredlistings, emptystate |
| 360–480px | — | ✅ | (full matrix only) |
| 640–768px | ✅ (768px) | ✅ | sheet, dialog, tabs |
| 1024–1440px | ✅ (1280, 1440) | ✅ | featuredlistings, containers, admin |
| 1720–1920px | — | ✅ | (full matrix only) |
| 2560px | ✅ | ✅ | featuredlistings-huge, containers-wide |
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
| `AdminCurrencyTabs` | admin-shared | Locale-sensitive |
| `AdminDashboardRecentListings` | admin-shared | Locale-sensitive |
| `AdminEditLayout` | admin-shared | — |
| `AdminFooterManager` | admin-shared | Locale-sensitive |
| `AdminInput` | admin-shared | — |
| `AdminInquiriesManager` | admin-shared | Locale-sensitive |
| `AdminLegalManager` | admin-shared | Locale-sensitive |
| `AdminLocationsManager` | admin-shared | Locale-sensitive |
| `AdminPageHeader` | admin-shared | — |
| `AdminPagesManager` | admin-shared | Locale-sensitive |
| `AdminPopularLocationsManager` | admin-shared | Locale-sensitive |
| `AdminSearchInput` | admin-shared | — |
| `AdminShell` | admin-shared | — |
| `AdminUserCreate` | admin-shared | Locale-sensitive |
| `AgentCtaButton` | shared-ui | — |
| `AvatarCropModal` | shared-ui | Locale-sensitive |
| `DatePicker` | shared-ui | Locale-sensitive |
| `FilterRangeInputs` | shared-ui | — |
| `FilterRoomsRow` | shared-ui | — |
| `FiltersPanel` | shared-ui | Locale-sensitive |
| `FilterToggleGroup` | shared-ui | — |
| `FooterView` | layout | Grid layout |
| `Header` | layout | — |
| `HeaderActions` | layout | Locale-sensitive |
| `HeaderView` | layout | Locale-sensitive |
| `HeroSearch` | shared-ui | — |
| `HeroSearchClient` | shared-ui | — |
| `HeroSearchView` | shared-ui | Locale-sensitive |
| `HowItWorksSteps` | shared-ui | Locale-sensitive |
| `LocaleSwitcher` | shared-ui | Locale-sensitive |
| `LocationCombobox` | shared-ui | Locale-sensitive |
| `Map` | shared-ui | — |
| `MapWrapper` | shared-ui | — |
| `MobileBottomNav` | layout | Locale-sensitive |
| `MobileNavDrawer` | layout | Locale-sensitive |
| `PerfDevOverlay` | shared-ui | — |
| `PerformanceStoreInit` | shared-ui | — |
| `PhoneField` | shared-ui | Locale-sensitive |
| `PropertyTypeCombobox` | shared-ui | Locale-sensitive |
| `RelativeTime` | shared-ui | — |
| `UserMenu` | layout | Locale-sensitive |
| `ViewAllLink` | shared-ui | — |
| `WebVitalsReporter` | shared-ui | — |
| `YearCombobox` | shared-ui | Locale-sensitive |