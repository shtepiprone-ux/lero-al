# Component Catalog — Lero.al
Last generated: 2026-05-18
See `docs/component-catalog-governance.md` for classification rules.
See `docs/component-coverage-matrix.md` for coverage mapping.
See `docs/component-risk-register.md` for risk register.

## Summary

| Metric | Count |
|---|---|
| Total cataloged components | 158 |
| Storybook stories | 8 |
| Locale-aware (useTranslations) | 65 |
| Client components ('use client') | 112 |
| With arbitrary Tailwind values | 54 |
| Components with 2xl responsive step | 4 |
| Components flagged for review | 67 |

## Canonical UI Primitives (`src/components/ui/`) (31)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `alert` | NEEDS_STORY | — | — | —  |
| `AppImage` | NEEDS_STORY | — | — | —  |
| `appImageConfig.ts` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `avatar` | NEEDS_STORY | — | — | —  |
| `badge` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `button` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `card` | NEEDS_STORY | — | — | —  |
| `checkbox` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `command` | NEEDS_STORY | — | — | —  |
| `dialog` | CANONICAL | ✅ | — | —  |
| `dropdown-menu` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `input` | CANONICAL | ✅ | — | —  |
| `input-group` | NEEDS_STORY | — | — | —  |
| `label` | NEEDS_STORY | — | — | —  |
| `navigation-menu` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `pagination` | NEEDS_STORY | — | — | —  |
| `popover` | NEEDS_STORY | — | — | —  |
| `progress` | NEEDS_STORY | — | — | —  |
| `radio-group` | NEEDS_STORY | — | — | —  |
| `scroll-area` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `select` | NEEDS_STORY | — | — | —  |
| `separator` | NEEDS_STORY | — | — | —  |
| `sheet` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `skeleton` | CANONICAL | ✅ | — | —  |
| `slider` | NEEDS_STORY | — | — | —  |
| `sonner` | NEEDS_STORY | — | — | —  |
| `switch` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `table` | NEEDS_STORY | — | — | —  |
| `tabs` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `textarea` | NEEDS_STORY | — | — | —  |
| `useAdaptiveImageConfig.ts` | CANONICAL | ✅ | — | —  |

## Shared UI Components (`src/components/shared/`) (20)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `AvatarCropModal` | APPROVED | — | — | —  |
| `Combobox` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `DatePicker` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `FilterMultiToggle` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `FilterRangeInputs` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `FilterRoomsRow` | APPROVED | — | — | —  |
| `FiltersPanel` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `FilterToggleGroup` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `HeroSearch` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `HeroSearchClient` | MANUAL_REVIEW | — | — | PRIMITIVE_CHECK, TAILWIND_ENTROPY ⚠️ |
| `LocaleSwitcher` | APPROVED | — | — | —  |
| `LocationCombobox` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, MOBILE ⚠️ |
| `Map` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `MapWrapper` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `PerfDevOverlay` | MANUAL_REVIEW | — | — | PRIMITIVE_CHECK, TAILWIND_ENTROPY ⚠️ |
| `PerformanceStoreInit` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `PropertyTypeCombobox` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `RelativeTime` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `WebVitalsReporter` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `YearCombobox` | APPROVED | — | — | —  |

## Layout Components (`src/components/layout/`) (2)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `Header` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `MobileBottomNav` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |

## Admin Shared Components (`src/components/admin/`) (18)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `AdminCurrenciesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminCurrencyTabs` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `AdminExchangeProvidersManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminLegalManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminListingsTable` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminLocaleSwitcher` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `AdminLocationsManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminMobileHeader` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `AdminPageHeader` | APPROVED | — | — | —  |
| `AdminPropertyTypesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminSearchInput` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `AdminSettings` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminShell` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `AdminSidebar` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminUserAvatar` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminUserCreate` | NEEDS_STORY | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `AdminUserProfile` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminUsersTable` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |

## Auth Feature Components (5)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `AuthContext` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `LoginForm` | APPROVED | — | 🌐 | LOCALIZATION  |
| `LoginFormClient` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `RegisterForm` | APPROVED | — | 🌐 | LOCALIZATION  |
| `RegisterFormClient` | APPROVED | — | — | PRIMITIVE_CHECK  |

## Cabinet Feature Components (6)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `CabinetShell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `index.ts` | APPROVED | ✅ | — | —  |
| `ListingsTab` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ProfileTab` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `queries.ts` | APPROVED | ✅ | — | —  |
| `SavedSearchesTab` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |

## Listings Feature Components (49)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `ActiveFilterChips` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AreaPairField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `BuildingFloorsField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `ButtonGroupField` | APPROVED | — | 🌐 | LOCALIZATION  |
| `DynamicFieldSection` | APPROVED | — | — | PRIMITIVE_CHECK, HUGE_DESKTOP  |
| `EnumSelectorField` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `FavoriteButton` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `FavoritesShell` | APPROVED | — | 🌐 | LOCALIZATION  |
| `FavoritesTypeFilter` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `FeaturedListings` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `fieldRegistry.ts` | APPROVED | ✅ | — | —  |
| `filterEngine.ts` | APPROVED | ✅ | — | —  |
| `FloorGroupField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `GalleryIsland` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `GalleryStaticFrame` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `ImageUpload` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `index.ts` | APPROVED | ✅ | — | —  |
| `LatestListings` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `ListingBackButton` | MANUAL_REVIEW | — | — | GOVERNANCE_VIOLATION ⚠️ |
| `ListingCard` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingContact` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `ListingDescriptionTranslator` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `ListingFeatureIcon` | APPROVED | — | — | —  |
| `ListingFormLoader` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `ListingFormShell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingGallery` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `ListingMobileCTA` | APPROVED | — | — | —  |
| `listingSelect.ts` | APPROVED | ✅ | — | —  |
| `listingSemanticLayer.ts` | APPROVED | ✅ | — | —  |
| `ListingsFilters` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingsPagination` | APPROVED | — | 🌐 | LOCALIZATION  |
| `ListingsShell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingsSortBar` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingsStatusTabs` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `ListingStatusBanner` | APPROVED | — | — | —  |
| `listingTransitionEngine.ts` | APPROVED | ✅ | — | —  |
| `NumInputField` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `propertyTypeSchema.ts` | APPROVED | ✅ | — | —  |
| `RoomsSelectorField` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `SaveSearchButton` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `SimilarListings` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `StepBasicInfo` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `StepDetails` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, HUGE_DESKTOP ⚠️ |
| `StepLocation` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `StepPhotos` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `StepPreview` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `useListingsUrlFilters.ts` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |
| `ViewTracker` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `YearComboboxField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |

## Locations Feature Components (1)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `PopularLocations` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |

## Notifications Feature Components (5)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `emailChange.ts` | APPROVED | ✅ | — | —  |
| `NotificationBell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `NotificationCenter` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `NotificationItem` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `useNotifications.ts` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |

## Page/Layout Routes (`src/app/`) (11)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `layout` | APPROVED | — | — | —  |
| `layout` | MANUAL_REVIEW | — | — | — ⚠️ |
| `loading` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `page` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | HUGE_DESKTOP  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |

## Unknown / Manual Review (10)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `currencies.ts` | APPROVED | ✅ | — | —  |
| `exchangeProviders.ts` | APPROVED | ✅ | — | —  |
| `global-error` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `locale.ts` | APPROVED | ✅ | — | —  |
| `propertyTypes.ts` | APPROVED | ✅ | — | —  |
| `route.ts` | APPROVED | ✅ | — | —  |
| `route.ts` | APPROVED | ✅ | — | —  |
| `route.ts` | APPROVED | ✅ | — | —  |
| `settings.ts` | APPROVED | ✅ | — | —  |
| `useCurrencies.ts` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Has colocated Storybook story |
| 📷 | In responsive screenshot target list |
| 🌐 | Uses `useTranslations` (locale-aware) |
| ⚠️ | Has governance flags — MANUAL_REVIEW |
| CANONICAL | Canonical primitive, correctly used |
| APPROVED | Approved component, no critical flags |
| NEEDS_STORY | Should have Storybook story |
| MANUAL_REVIEW | Has flags or complex patterns |