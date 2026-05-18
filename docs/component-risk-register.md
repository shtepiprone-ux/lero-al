# Component Risk Register — Lero.al
Last generated: 2026-05-18

## Governance Violations (require fix)

| Component | File | Flags |
|---|---|---|
| `page` | src/app/admin/page.tsx | ARBITRARY_TW |
| `layout` | src/app/layout.tsx | SUPPRESS_HW |
| `loading` | src/app/[locale]/listings/[slug]/loading.tsx | ARBITRARY_TW |
| `page` | src/app/[locale]/listings/[slug]/page.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminCurrenciesManager` | src/components/admin/AdminCurrenciesManager.tsx | ARBITRARY_TW |
| `AdminExchangeProvidersManager` | src/components/admin/AdminExchangeProvidersManager.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminLegalManager` | src/components/admin/AdminLegalManager.tsx | RAW_BUTTON, CUSTOM_OVERLAY, ARBITRARY_TW |
| `AdminListingsTable` | src/components/admin/AdminListingsTable.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminLocaleSwitcher` | src/components/admin/AdminLocaleSwitcher.tsx | ARBITRARY_TW |
| `AdminLocationsManager` | src/components/admin/AdminLocationsManager.tsx | RAW_BUTTON, CUSTOM_OVERLAY, ARBITRARY_TW |
| `AdminMobileHeader` | src/components/admin/AdminMobileHeader.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminPropertyTypesManager` | src/components/admin/AdminPropertyTypesManager.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminSettings` | src/components/admin/AdminSettings.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminSidebar` | src/components/admin/AdminSidebar.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminUserAvatar` | src/components/admin/AdminUserAvatar.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminUserProfile` | src/components/admin/AdminUserProfile.tsx | ARBITRARY_TW |
| `AdminUsersTable` | src/components/admin/AdminUsersTable.tsx | RAW_BUTTON, ARBITRARY_TW |
| `Header` | src/components/layout/Header.tsx | RAW_BUTTON, ARBITRARY_TW |
| `MobileBottomNav` | src/components/layout/MobileBottomNav.tsx | ARBITRARY_TW |
| `Combobox` | src/components/shared/Combobox.tsx | RAW_BUTTON |
| `DatePicker` | src/components/shared/DatePicker.tsx | RAW_BUTTON, ARBITRARY_TW |
| `FilterMultiToggle` | src/components/shared/FilterMultiToggle.tsx | ARBITRARY_TW |
| `FiltersPanel` | src/components/shared/FiltersPanel.tsx | RAW_BUTTON, ARBITRARY_TW |
| `FilterToggleGroup` | src/components/shared/FilterToggleGroup.tsx | ARBITRARY_TW |
| `HeroSearch` | src/components/shared/HeroSearch.tsx | ARBITRARY_TW |
| `HeroSearchClient` | src/components/shared/HeroSearchClient.tsx | ARBITRARY_TW |
| `LocationCombobox` | src/components/shared/LocationCombobox.tsx | RAW_BUTTON |
| `PerfDevOverlay` | src/components/shared/PerfDevOverlay.tsx | ARBITRARY_TW |
| `appImageConfig.ts` | src/components/ui/appImageConfig.ts | ARBITRARY_TW |
| `badge` | src/components/ui/badge.tsx | ARBITRARY_TW |
| `button` | src/components/ui/button.tsx | ARBITRARY_TW |
| `checkbox` | src/components/ui/checkbox.tsx | ARBITRARY_TW |
| `dropdown-menu` | src/components/ui/dropdown-menu.tsx | ARBITRARY_TW |
| `navigation-menu` | src/components/ui/navigation-menu.tsx | ARBITRARY_TW |
| `scroll-area` | src/components/ui/scroll-area.tsx | ARBITRARY_TW |
| `sheet` | src/components/ui/sheet.tsx | ARBITRARY_TW |
| `switch` | src/components/ui/switch.tsx | ARBITRARY_TW |
| `tabs` | src/components/ui/tabs.tsx | ARBITRARY_TW |
| `CabinetShell` | src/modules/cabinet/components/CabinetShell.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ListingsTab` | src/modules/cabinet/components/ListingsTab.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ProfileTab` | src/modules/cabinet/components/ProfileTab.tsx | RAW_BUTTON, ARBITRARY_TW |
| `SavedSearchesTab` | src/modules/cabinet/components/SavedSearchesTab.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ActiveFilterChips` | src/modules/listings/components/ActiveFilterChips.tsx | RAW_BUTTON |
| `FavoriteButton` | src/modules/listings/components/FavoriteButton.tsx | RAW_BUTTON |
| `FavoritesTypeFilter` | src/modules/listings/components/FavoritesTypeFilter.tsx | RAW_BUTTON, ARBITRARY_TW |
| `EnumSelectorField` | src/modules/listings/components/form/EnumSelectorField.tsx | RAW_BUTTON |
| `NumInputField` | src/modules/listings/components/form/NumInputField.tsx | ARBITRARY_TW |
| `RoomsSelectorField` | src/modules/listings/components/form/RoomsSelectorField.tsx | RAW_BUTTON |
| `GalleryStaticFrame` | src/modules/listings/components/GalleryStaticFrame.tsx | ARBITRARY_TW |
| `ImageUpload` | src/modules/listings/components/ImageUpload.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ListingBackButton` | src/modules/listings/components/ListingBackButton.tsx | RAW_BUTTON |
| `ListingCard` | src/modules/listings/components/ListingCard.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ListingContact` | src/modules/listings/components/ListingContact.tsx | RAW_BUTTON |
| `ListingDescriptionTranslator` | src/modules/listings/components/ListingDescriptionTranslator.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ListingFormShell` | src/modules/listings/components/ListingFormShell.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ListingGallery` | src/modules/listings/components/ListingGallery.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ListingsFilters` | src/modules/listings/components/ListingsFilters.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ListingsShell` | src/modules/listings/components/ListingsShell.tsx | WIN_LOCATION, ARBITRARY_TW |
| `ListingsSortBar` | src/modules/listings/components/ListingsSortBar.tsx | ARBITRARY_TW |
| `ListingsStatusTabs` | src/modules/listings/components/ListingsStatusTabs.tsx | RAW_BUTTON |
| `SaveSearchButton` | src/modules/listings/components/SaveSearchButton.tsx | CUSTOM_OVERLAY |
| `StepBasicInfo` | src/modules/listings/components/steps/StepBasicInfo.tsx | RAW_BUTTON |
| `StepDetails` | src/modules/listings/components/steps/StepDetails.tsx | RAW_BUTTON |
| `PopularLocations` | src/modules/locations/components/PopularLocations.tsx | ARBITRARY_TW |
| `NotificationBell` | src/modules/notifications/components/NotificationBell.tsx | RAW_BUTTON, ARBITRARY_TW |
| `NotificationCenter` | src/modules/notifications/components/NotificationCenter.tsx | RAW_BUTTON, ARBITRARY_TW |
| `NotificationItem` | src/modules/notifications/components/NotificationItem.tsx | ARBITRARY_TW |

## Localization Risk (useTranslations)

Components using `useTranslations` — require review at all 4 locales (sq, en, uk, it):

| Component | Type | Ukrainian risk level |
|---|---|---|
| `ActiveFilterChips` | listings-feature | MEDIUM |
| `AdminCurrenciesManager` | admin-shared | HIGH |
| `AdminCurrencyTabs` | admin-shared | HIGH |
| `AdminExchangeProvidersManager` | admin-shared | HIGH |
| `AdminLegalManager` | admin-shared | HIGH |
| `AdminListingsTable` | admin-shared | HIGH |
| `AdminLocaleSwitcher` | admin-shared | HIGH |
| `AdminLocationsManager` | admin-shared | HIGH |
| `AdminMobileHeader` | admin-shared | HIGH |
| `AdminPropertyTypesManager` | admin-shared | HIGH |
| `AdminSettings` | admin-shared | HIGH |
| `AdminSidebar` | admin-shared | HIGH |
| `AdminUserAvatar` | admin-shared | HIGH |
| `AdminUserCreate` | admin-shared | HIGH |
| `AdminUserProfile` | admin-shared | HIGH |
| `AdminUsersTable` | admin-shared | HIGH |
| `AreaPairField` | listings-feature | MEDIUM |
| `BuildingFloorsField` | listings-feature | MEDIUM |
| `ButtonGroupField` | listings-feature | MEDIUM |
| `CabinetShell` | cabinet-feature | MEDIUM |
| `Combobox` | shared-ui | HIGH |
| `DatePicker` | shared-ui | HIGH |
| `EnumSelectorField` | listings-feature | MEDIUM |
| `FavoriteButton` | listings-feature | MEDIUM |
| `FavoritesShell` | listings-feature | MEDIUM |
| `FavoritesTypeFilter` | listings-feature | MEDIUM |
| `FeaturedListings` | listings-feature | MEDIUM |
| `FiltersPanel` | shared-ui | HIGH |
| `FloorGroupField` | listings-feature | MEDIUM |
| `Header` | layout | HIGH |
| `HeroSearch` | shared-ui | HIGH |
| `ImageUpload` | listings-feature | MEDIUM |
| `LatestListings` | listings-feature | MEDIUM |
| `ListingCard` | listings-feature | MEDIUM |
| `ListingContact` | listings-feature | MEDIUM |
| `ListingDescriptionTranslator` | listings-feature | MEDIUM |
| `ListingFormShell` | listings-feature | MEDIUM |
| `ListingGallery` | listings-feature | MEDIUM |
| `ListingsFilters` | listings-feature | MEDIUM |
| `ListingsPagination` | listings-feature | MEDIUM |
| `ListingsShell` | listings-feature | MEDIUM |
| `ListingsSortBar` | listings-feature | MEDIUM |
| `ListingsStatusTabs` | listings-feature | MEDIUM |
| `ListingsTab` | cabinet-feature | MEDIUM |
| `LocationCombobox` | shared-ui | HIGH |
| `LoginForm` | auth-feature | MEDIUM |
| `MobileBottomNav` | layout | HIGH |
| `NotificationBell` | notifications-feature | MEDIUM |
| `NotificationCenter` | notifications-feature | MEDIUM |
| `NotificationItem` | notifications-feature | MEDIUM |
| `NumInputField` | listings-feature | MEDIUM |
| `PopularLocations` | locations-feature | MEDIUM |
| `ProfileTab` | cabinet-feature | MEDIUM |
| `PropertyTypeCombobox` | shared-ui | HIGH |
| `RegisterForm` | auth-feature | MEDIUM |
| `RoomsSelectorField` | listings-feature | MEDIUM |
| `SavedSearchesTab` | cabinet-feature | MEDIUM |
| `SaveSearchButton` | listings-feature | MEDIUM |
| `SimilarListings` | listings-feature | MEDIUM |
| `StepBasicInfo` | listings-feature | MEDIUM |
| `StepDetails` | listings-feature | MEDIUM |
| `StepLocation` | listings-feature | MEDIUM |
| `StepPhotos` | listings-feature | MEDIUM |
| `StepPreview` | listings-feature | MEDIUM |
| `YearComboboxField` | listings-feature | MEDIUM |

## Mobile Risk (320px review required)

| Component | Type | Mobile concern |
|---|---|---|
| `ActiveFilterChips` | listings-feature | Translatable text — check 320px wrapping |
| `AreaPairField` | listings-feature | Translatable text — check 320px wrapping |
| `BuildingFloorsField` | listings-feature | Translatable text — check 320px wrapping |
| `ButtonGroupField` | listings-feature | Translatable text — check 320px wrapping |
| `Combobox` | shared-ui | Translatable text — check 320px wrapping |
| `DatePicker` | shared-ui | Translatable text — check 320px wrapping |
| `EnumSelectorField` | listings-feature | Translatable text — check 320px wrapping |
| `FavoriteButton` | listings-feature | Translatable text — check 320px wrapping |
| `FavoritesShell` | listings-feature | Translatable text — check 320px wrapping |
| `FavoritesTypeFilter` | listings-feature | Translatable text — check 320px wrapping |
| `FeaturedListings` | listings-feature | Translatable text — check 320px wrapping |
| `FiltersPanel` | shared-ui | Translatable text — check 320px wrapping |
| `FloorGroupField` | listings-feature | Translatable text — check 320px wrapping |
| `Header` | layout | Translatable text — check 320px wrapping |
| `HeroSearch` | shared-ui | Translatable text — check 320px wrapping |
| `ImageUpload` | listings-feature | Translatable text — check 320px wrapping |
| `LatestListings` | listings-feature | Translatable text — check 320px wrapping |
| `ListingCard` | listings-feature | Translatable text — check 320px wrapping |
| `ListingContact` | listings-feature | Translatable text — check 320px wrapping |
| `ListingDescriptionTranslator` | listings-feature | Translatable text — check 320px wrapping |
| `ListingFormShell` | listings-feature | Translatable text — check 320px wrapping |
| `ListingGallery` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsFilters` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsPagination` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsShell` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsSortBar` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsStatusTabs` | listings-feature | Translatable text — check 320px wrapping |
| `LocationCombobox` | shared-ui | Translatable text — check 320px wrapping |
| `MobileBottomNav` | layout | Translatable text — check 320px wrapping |
| `NotificationBell` | notifications-feature | Translatable text — check 320px wrapping |
| `NotificationCenter` | notifications-feature | Translatable text — check 320px wrapping |
| `NotificationItem` | notifications-feature | Translatable text — check 320px wrapping |
| `NumInputField` | listings-feature | Translatable text — check 320px wrapping |
| `PropertyTypeCombobox` | shared-ui | Translatable text — check 320px wrapping |
| `RoomsSelectorField` | listings-feature | Translatable text — check 320px wrapping |
| `SaveSearchButton` | listings-feature | Translatable text — check 320px wrapping |
| `SimilarListings` | listings-feature | Translatable text — check 320px wrapping |
| `StepBasicInfo` | listings-feature | Translatable text — check 320px wrapping |
| `StepDetails` | listings-feature | Translatable text — check 320px wrapping |
| `StepLocation` | listings-feature | Translatable text — check 320px wrapping |
| `StepPhotos` | listings-feature | Translatable text — check 320px wrapping |
| `StepPreview` | listings-feature | Translatable text — check 320px wrapping |
| `YearComboboxField` | listings-feature | Translatable text — check 320px wrapping |

## Huge Desktop Risk (2560px review required)

| Component | File | Issue |
|---|---|---|
| `page` | src/app/admin/page.tsx | Grid without 2xl step — verify column count at 2560px |
| `page` | src/app/admin/support/page.tsx | Grid without 2xl step — verify column count at 2560px |
| `loading` | src/app/[locale]/listings/[slug]/loading.tsx | Grid without 2xl step — verify column count at 2560px |
| `page` | src/app/[locale]/listings/[slug]/page.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminCurrenciesManager` | src/components/admin/AdminCurrenciesManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminExchangeProvidersManager` | src/components/admin/AdminExchangeProvidersManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminLegalManager` | src/components/admin/AdminLegalManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminListingsTable` | src/components/admin/AdminListingsTable.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminLocationsManager` | src/components/admin/AdminLocationsManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminUserCreate` | src/components/admin/AdminUserCreate.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminUserProfile` | src/components/admin/AdminUserProfile.tsx | Grid without 2xl step — verify column count at 2560px |
| `DatePicker` | src/components/shared/DatePicker.tsx | Grid without 2xl step — verify column count at 2560px |
| `FiltersPanel` | src/components/shared/FiltersPanel.tsx | Grid without 2xl step — verify column count at 2560px |
| `alert` | src/components/ui/alert.tsx | Grid without 2xl step — verify column count at 2560px |
| `card` | src/components/ui/card.tsx | Grid without 2xl step — verify column count at 2560px |
| `ProfileTab` | src/modules/cabinet/components/ProfileTab.tsx | Grid without 2xl step — verify column count at 2560px |
| `AreaPairField` | src/modules/listings/components/form/AreaPairField.tsx | Grid without 2xl step — verify column count at 2560px |
| `DynamicFieldSection` | src/modules/listings/components/form/DynamicFieldSection.tsx | Grid without 2xl step — verify column count at 2560px |
| `FloorGroupField` | src/modules/listings/components/form/FloorGroupField.tsx | Grid without 2xl step — verify column count at 2560px |
| `GalleryStaticFrame` | src/modules/listings/components/GalleryStaticFrame.tsx | Grid without 2xl step — verify column count at 2560px |
| `ImageUpload` | src/modules/listings/components/ImageUpload.tsx | Grid without 2xl step — verify column count at 2560px |
| `ListingGallery` | src/modules/listings/components/ListingGallery.tsx | Grid without 2xl step — verify column count at 2560px |
| `ListingsFilters` | src/modules/listings/components/ListingsFilters.tsx | Grid without 2xl step — verify column count at 2560px |
| `SimilarListings` | src/modules/listings/components/SimilarListings.tsx | Grid without 2xl step — verify column count at 2560px |
| `StepBasicInfo` | src/modules/listings/components/steps/StepBasicInfo.tsx | Grid without 2xl step — verify column count at 2560px |
| `StepDetails` | src/modules/listings/components/steps/StepDetails.tsx | Grid without 2xl step — verify column count at 2560px |
| `StepLocation` | src/modules/listings/components/steps/StepLocation.tsx | Grid without 2xl step — verify column count at 2560px |
| `PopularLocations` | src/modules/locations/components/PopularLocations.tsx | Grid without 2xl step — verify column count at 2560px |

## Tailwind Entropy Risk

Components with arbitrary Tailwind values `[value]`:

| Component | Type | Arbitrary values detected |
|---|---|---|
| `AdminCurrenciesManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminExchangeProvidersManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminLegalManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminListingsTable` | admin-shared | Static analysis detected `[value]` in className |
| `AdminLocaleSwitcher` | admin-shared | Static analysis detected `[value]` in className |
| `AdminLocationsManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminMobileHeader` | admin-shared | Static analysis detected `[value]` in className |
| `AdminPropertyTypesManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminSettings` | admin-shared | Static analysis detected `[value]` in className |
| `AdminSidebar` | admin-shared | Static analysis detected `[value]` in className |
| `AdminUserAvatar` | admin-shared | Static analysis detected `[value]` in className |
| `AdminUserProfile` | admin-shared | Static analysis detected `[value]` in className |
| `AdminUsersTable` | admin-shared | Static analysis detected `[value]` in className |
| `appImageConfig.ts` | canonical-primitive | Static analysis detected `[value]` in className |
| `badge` | canonical-primitive | Static analysis detected `[value]` in className |
| `button` | canonical-primitive | Static analysis detected `[value]` in className |
| `CabinetShell` | cabinet-feature | Static analysis detected `[value]` in className |
| `checkbox` | canonical-primitive | Static analysis detected `[value]` in className |
| `DatePicker` | shared-ui | Static analysis detected `[value]` in className |
| `dropdown-menu` | canonical-primitive | Static analysis detected `[value]` in className |
| `FavoritesTypeFilter` | listings-feature | Static analysis detected `[value]` in className |
| `FilterMultiToggle` | shared-ui | Static analysis detected `[value]` in className |
| `FiltersPanel` | shared-ui | Static analysis detected `[value]` in className |
| `FilterToggleGroup` | shared-ui | Static analysis detected `[value]` in className |
| `GalleryStaticFrame` | listings-feature | Static analysis detected `[value]` in className |
| `Header` | layout | Static analysis detected `[value]` in className |
| `HeroSearch` | shared-ui | Static analysis detected `[value]` in className |
| `HeroSearchClient` | shared-ui | Static analysis detected `[value]` in className |
| `ImageUpload` | listings-feature | Static analysis detected `[value]` in className |
| `ListingCard` | listings-feature | Static analysis detected `[value]` in className |
| `ListingDescriptionTranslator` | listings-feature | Static analysis detected `[value]` in className |
| `ListingFormShell` | listings-feature | Static analysis detected `[value]` in className |
| `ListingGallery` | listings-feature | Static analysis detected `[value]` in className |
| `ListingsFilters` | listings-feature | Static analysis detected `[value]` in className |
| `ListingsShell` | listings-feature | Static analysis detected `[value]` in className |
| `ListingsSortBar` | listings-feature | Static analysis detected `[value]` in className |
| `ListingsTab` | cabinet-feature | Static analysis detected `[value]` in className |
| `loading` | page | Static analysis detected `[value]` in className |
| `MobileBottomNav` | layout | Static analysis detected `[value]` in className |
| `navigation-menu` | canonical-primitive | Static analysis detected `[value]` in className |
| `NotificationBell` | notifications-feature | Static analysis detected `[value]` in className |
| `NotificationCenter` | notifications-feature | Static analysis detected `[value]` in className |
| `NotificationItem` | notifications-feature | Static analysis detected `[value]` in className |
| `NumInputField` | listings-feature | Static analysis detected `[value]` in className |
| `page` | page | Static analysis detected `[value]` in className |
| `page` | page | Static analysis detected `[value]` in className |
| `PerfDevOverlay` | shared-ui | Static analysis detected `[value]` in className |
| `PopularLocations` | locations-feature | Static analysis detected `[value]` in className |
| `ProfileTab` | cabinet-feature | Static analysis detected `[value]` in className |
| `SavedSearchesTab` | cabinet-feature | Static analysis detected `[value]` in className |
| `scroll-area` | canonical-primitive | Static analysis detected `[value]` in className |
| `sheet` | canonical-primitive | Static analysis detected `[value]` in className |
| `switch` | canonical-primitive | Static analysis detected `[value]` in className |
| `tabs` | canonical-primitive | Static analysis detected `[value]` in className |

## Storybook Coverage Gap (high priority)

Shared/layout/admin components without stories — highest visibility components:

| Component | Type | Priority |
|---|---|---|
| `AdminCurrenciesManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminCurrencyTabs` | admin-shared | HIGH — locale-aware, no story |
| `AdminExchangeProvidersManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminLegalManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminListingsTable` | admin-shared | HIGH — locale-aware, no story |
| `AdminLocaleSwitcher` | admin-shared | HIGH — locale-aware, no story |
| `AdminLocationsManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminMobileHeader` | admin-shared | HIGH — locale-aware, no story |
| `AdminPropertyTypesManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminSettings` | admin-shared | HIGH — locale-aware, no story |
| `AdminSidebar` | admin-shared | HIGH — locale-aware, no story |
| `AdminUserAvatar` | admin-shared | HIGH — locale-aware, no story |
| `AdminUserCreate` | admin-shared | HIGH — locale-aware, no story |
| `AdminUserProfile` | admin-shared | HIGH — locale-aware, no story |
| `AdminUsersTable` | admin-shared | HIGH — locale-aware, no story |
| `Combobox` | shared-ui | HIGH — locale-aware, no story |
| `DatePicker` | shared-ui | HIGH — locale-aware, no story |
| `FiltersPanel` | shared-ui | HIGH — locale-aware, no story |
| `Header` | layout | HIGH — locale-aware, no story |
| `HeroSearch` | shared-ui | HIGH — locale-aware, no story |
| `LocationCombobox` | shared-ui | HIGH — locale-aware, no story |
| `MobileBottomNav` | layout | HIGH — locale-aware, no story |
| `PropertyTypeCombobox` | shared-ui | HIGH — locale-aware, no story |