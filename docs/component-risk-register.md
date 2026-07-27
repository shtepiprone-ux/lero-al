# Component Risk Register — Lero.al
Last generated: 2026-07-24

## Governance Violations (require fix)

| Component | File | Flags |
|---|---|---|
| `VerifiedCard` | src/app/[locale]/auth/verified/VerifiedCard.tsx | ARBITRARY_TW |
| `loading` | src/app/[locale]/listings/[slug]/loading.tsx | ARBITRARY_TW |
| `AdminCompaniesManager` | src/components/admin/AdminCompaniesManager.tsx | RAW_BUTTON |
| `AdminCurrenciesManager` | src/components/admin/AdminCurrenciesManager.tsx | RAW_BUTTON |
| `AdminDashboardRecentListings` | src/components/admin/AdminDashboardRecentListings.tsx | ARBITRARY_TW |
| `AdminExchangeProvidersManager` | src/components/admin/AdminExchangeProvidersManager.tsx | RAW_BUTTON |
| `AdminFooterManager` | src/components/admin/AdminFooterManager.tsx | RAW_BUTTON |
| `AdminInquiriesManager` | src/components/admin/AdminInquiriesManager.tsx | ARBITRARY_TW |
| `AdminLegalManager` | src/components/admin/AdminLegalManager.tsx | RAW_BUTTON |
| `AdminListingsTable` | src/components/admin/AdminListingsTable.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminLocationsManager` | src/components/admin/AdminLocationsManager.tsx | RAW_BUTTON |
| `AdminPagesManager` | src/components/admin/AdminPagesManager.tsx | RAW_BUTTON, ARBITRARY_TW |
| `AdminPermissionsManager` | src/components/admin/AdminPermissionsManager.tsx | ARBITRARY_TW |
| `AdminPopularLocationsManager` | src/components/admin/AdminPopularLocationsManager.tsx | RAW_BUTTON |
| `AdminPropertyTypesManager` | src/components/admin/AdminPropertyTypesManager.tsx | RAW_BUTTON |
| `AdminReportsManager` | src/components/admin/AdminReportsManager.tsx | RAW_BUTTON |
| `AdminSidebar` | src/components/admin/AdminSidebar.tsx | ARBITRARY_TW |
| `AdminSupportManager` | src/components/admin/AdminSupportManager.tsx | ARBITRARY_TW |
| `AdminTable` | src/components/admin/AdminTable.tsx | ARBITRARY_TW |
| `AdminUserAvatar` | src/components/admin/AdminUserAvatar.tsx | ARBITRARY_TW |
| `AdminUserProfile` | src/components/admin/AdminUserProfile.tsx | ARBITRARY_TW |
| `HeaderView` | src/components/layout/HeaderView.tsx | ARBITRARY_TW |
| `MobileBottomNav` | src/components/layout/MobileBottomNav.tsx | ARBITRARY_TW |
| `Combobox` | src/components/shared/Combobox.tsx | RAW_BUTTON, VIEWPORT_JS |
| `DatePicker` | src/components/shared/DatePicker.tsx | RAW_BUTTON, ARBITRARY_TW |
| `HeroSearchClient` | src/components/shared/HeroSearchClient.tsx | ARBITRARY_TW |
| `PerfDevOverlay` | src/components/shared/PerfDevOverlay.tsx | ARBITRARY_TW |
| `appImageConfig.ts` | src/components/ui/appImageConfig.ts | ARBITRARY_TW |
| `button` | src/components/ui/button.tsx | ARBITRARY_TW |
| `checkbox` | src/components/ui/checkbox.tsx | ARBITRARY_TW |
| `navigation-menu` | src/components/ui/navigation-menu.tsx | ARBITRARY_TW |
| `scroll-area` | src/components/ui/scroll-area.tsx | ARBITRARY_TW |
| `switch` | src/components/ui/switch.tsx | ARBITRARY_TW |
| `tabs` | src/components/ui/tabs.tsx | ARBITRARY_TW |
| `AuthRedirect` | src/modules/auth/components/AuthRedirect.tsx | ARBITRARY_TW |
| `AuthSheet` | src/modules/auth/components/AuthSheet.tsx | RAW_BUTTON, ARBITRARY_TW |
| `ResetPasswordClient` | src/modules/auth/components/ResetPasswordClient.tsx | ARBITRARY_TW |
| `ListingsTab` | src/modules/cabinet/components/ListingsTab.tsx | RAW_BUTTON |
| `ProfileTab` | src/modules/cabinet/components/ProfileTab.tsx | RAW_BUTTON, ARBITRARY_TW |
| `SavedSearchesTab` | src/modules/cabinet/components/SavedSearchesTab.tsx | ARBITRARY_TW |
| `FavoritesTypeFilter` | src/modules/listings/components/FavoritesTypeFilter.tsx | ARBITRARY_TW |
| `NumInputField` | src/modules/listings/components/form/NumInputField.tsx | ARBITRARY_TW |
| `GalleryStaticFrame` | src/modules/listings/components/GalleryStaticFrame.tsx | ARBITRARY_TW |
| `ImageUpload` | src/modules/listings/components/ImageUpload.tsx | RAW_BUTTON |
| `LightboxView` | src/modules/listings/components/LightboxView.tsx | ARBITRARY_TW |
| `ListingCard` | src/modules/listings/components/ListingCard.tsx | ARBITRARY_TW |
| `ListingContact` | src/modules/listings/components/ListingContact.tsx | RAW_BUTTON |
| `ListingDetailView` | src/modules/listings/components/ListingDetailView.tsx | ARBITRARY_TW |
| `ListingFormShellView` | src/modules/listings/components/ListingFormShellView.tsx | RAW_BUTTON |
| `ListingMobileCTA` | src/modules/listings/components/ListingMobileCTA.tsx | RAW_BUTTON |
| `ListingsShell` | src/modules/listings/components/ListingsShell.tsx | WIN_LOCATION, ARBITRARY_TW |
| `NotificationCenter` | src/modules/notifications/components/NotificationCenter.tsx | ARBITRARY_TW |

## Localization Risk (useTranslations)

Components using `useTranslations` — require review at all 4 locales (sq, en, uk, it):

| Component | Type | Ukrainian risk level |
|---|---|---|
| `ActiveFilterChips` | listings-feature | MEDIUM |
| `AdminCompaniesManager` | admin-shared | HIGH |
| `AdminCurrenciesManager` | admin-shared | HIGH |
| `AdminCurrencyTabs` | admin-shared | HIGH |
| `AdminDashboardRecentListings` | admin-shared | HIGH |
| `AdminEmailTemplatesManager` | admin-shared | HIGH |
| `AdminExchangeProvidersManager` | admin-shared | HIGH |
| `AdminFooterManager` | admin-shared | HIGH |
| `AdminInquiriesManager` | admin-shared | HIGH |
| `AdminLegalManager` | admin-shared | HIGH |
| `AdminListingsTable` | admin-shared | HIGH |
| `AdminLocaleSwitcher` | admin-shared | HIGH |
| `AdminLocationsManager` | admin-shared | HIGH |
| `AdminMobileHeader` | admin-shared | HIGH |
| `AdminPagesManager` | admin-shared | HIGH |
| `AdminPermissionsManager` | admin-shared | HIGH |
| `AdminPopularLocationsManager` | admin-shared | HIGH |
| `AdminPropertyTypesManager` | admin-shared | HIGH |
| `AdminReportsManager` | admin-shared | HIGH |
| `AdminSettings` | admin-shared | HIGH |
| `AdminSidebar` | admin-shared | HIGH |
| `AdminSupportManager` | admin-shared | HIGH |
| `AdminTable` | admin-shared | HIGH |
| `AdminUserAvatar` | admin-shared | HIGH |
| `AdminUserCreate` | admin-shared | HIGH |
| `AdminUserProfile` | admin-shared | HIGH |
| `AdminUsersTable` | admin-shared | HIGH |
| `AreaPairField` | listings-feature | MEDIUM |
| `AuthRedirect` | auth-feature | MEDIUM |
| `AuthSheet` | auth-feature | MEDIUM |
| `AvatarCropModal` | shared-ui | HIGH |
| `BuildingFloorsField` | listings-feature | MEDIUM |
| `ButtonGroupField` | listings-feature | MEDIUM |
| `CabinetPasswordSection` | cabinet-feature | MEDIUM |
| `CabinetShell` | cabinet-feature | MEDIUM |
| `CaptchaWidget` | unknown | MEDIUM |
| `ClearRecentlyViewedButton` | listings-feature | MEDIUM |
| `CollectionsSection` | listings-feature | MEDIUM |
| `Combobox` | shared-ui | HIGH |
| `command` | canonical-primitive | MEDIUM |
| `ContactForm` | unknown | MEDIUM |
| `DatePicker` | shared-ui | HIGH |
| `dialog` | canonical-primitive | MEDIUM |
| `EnumSelectorField` | listings-feature | MEDIUM |
| `FavoriteButton` | listings-feature | MEDIUM |
| `FavoritesShell` | listings-feature | MEDIUM |
| `FavoritesTypeFilter` | listings-feature | MEDIUM |
| `FeaturedListingsView` | listings-feature | MEDIUM |
| `FiltersPanel` | shared-ui | HIGH |
| `FloorGroupField` | listings-feature | MEDIUM |
| `HeaderActions` | layout | HIGH |
| `HeaderView` | layout | HIGH |
| `HeroSearchView` | shared-ui | HIGH |
| `HowItWorksSteps` | shared-ui | HIGH |
| `ImageUpload` | listings-feature | MEDIUM |
| `LatestListingsView` | listings-feature | MEDIUM |
| `ListingCard` | listings-feature | MEDIUM |
| `ListingContact` | listings-feature | MEDIUM |
| `ListingDetailView` | listings-feature | MEDIUM |
| `ListingFormShell` | listings-feature | MEDIUM |
| `ListingFormShellView` | listings-feature | MEDIUM |
| `ListingGallery` | listings-feature | MEDIUM |
| `ListingInquiryDialog` | listings-feature | MEDIUM |
| `ListingMobileCTA` | listings-feature | MEDIUM |
| `ListingReportDialog` | listings-feature | MEDIUM |
| `ListingsFilterBar` | listings-feature | MEDIUM |
| `ListingsFilters` | listings-feature | MEDIUM |
| `ListingsPagination` | listings-feature | MEDIUM |
| `ListingsShell` | listings-feature | MEDIUM |
| `ListingsSortBar` | listings-feature | MEDIUM |
| `ListingsStatusTabs` | listings-feature | MEDIUM |
| `ListingsTab` | cabinet-feature | MEDIUM |
| `LocaleSwitcher` | shared-ui | HIGH |
| `LocationCombobox` | shared-ui | HIGH |
| `MobileBottomNav` | layout | HIGH |
| `MobileNavDrawer` | layout | HIGH |
| `MultiToggleField` | listings-feature | MEDIUM |
| `NotificationBellView` | notifications-feature | MEDIUM |
| `NotificationCenter` | notifications-feature | MEDIUM |
| `NotificationItem` | notifications-feature | MEDIUM |
| `NumInputField` | listings-feature | MEDIUM |
| `pagination` | canonical-primitive | MEDIUM |
| `PasswordInput` | canonical-primitive | MEDIUM |
| `PasswordRequirementsHint` | canonical-primitive | MEDIUM |
| `PhoneField` | shared-ui | HIGH |
| `PopularLocationsView` | locations-feature | MEDIUM |
| `ProfileTab` | cabinet-feature | MEDIUM |
| `PropertyTypeCombobox` | shared-ui | HIGH |
| `RecentlyViewedGridView` | listings-feature | MEDIUM |
| `ResetPasswordClient` | auth-feature | MEDIUM |
| `RoomsSelectorField` | listings-feature | MEDIUM |
| `SavedSearchesTab` | cabinet-feature | MEDIUM |
| `SaveSearchButton` | listings-feature | MEDIUM |
| `SaveToCollectionButton` | listings-feature | MEDIUM |
| `sheet` | canonical-primitive | MEDIUM |
| `SimilarListings` | listings-feature | MEDIUM |
| `SimilarListingsView` | listings-feature | MEDIUM |
| `StatusChangeControl` | admin-shared | HIGH |
| `StatusChangeHistory` | admin-shared | HIGH |
| `StepBasicInfo` | listings-feature | MEDIUM |
| `StepDetails` | listings-feature | MEDIUM |
| `StepLocation` | listings-feature | MEDIUM |
| `StepPhotos` | listings-feature | MEDIUM |
| `StepPreview` | listings-feature | MEDIUM |
| `UserMenu` | layout | HIGH |
| `WhatsAppContactButton` | unknown | MEDIUM |
| `YearCombobox` | shared-ui | HIGH |
| `YearComboboxField` | listings-feature | MEDIUM |

## Mobile Risk (320px review required)

| Component | Type | Mobile concern |
|---|---|---|
| `ActiveFilterChips` | listings-feature | Translatable text — check 320px wrapping |
| `AreaPairField` | listings-feature | Translatable text — check 320px wrapping |
| `AvatarCropModal` | shared-ui | Translatable text — check 320px wrapping |
| `BuildingFloorsField` | listings-feature | Translatable text — check 320px wrapping |
| `ButtonGroupField` | listings-feature | Translatable text — check 320px wrapping |
| `ClearRecentlyViewedButton` | listings-feature | Translatable text — check 320px wrapping |
| `CollectionsSection` | listings-feature | Translatable text — check 320px wrapping |
| `Combobox` | shared-ui | Translatable text — check 320px wrapping |
| `DatePicker` | shared-ui | Translatable text — check 320px wrapping |
| `EnumSelectorField` | listings-feature | Translatable text — check 320px wrapping |
| `FavoriteButton` | listings-feature | Translatable text — check 320px wrapping |
| `FavoritesShell` | listings-feature | Translatable text — check 320px wrapping |
| `FavoritesTypeFilter` | listings-feature | Translatable text — check 320px wrapping |
| `FeaturedListingsView` | listings-feature | Translatable text — check 320px wrapping |
| `FiltersPanel` | shared-ui | Translatable text — check 320px wrapping |
| `FloorGroupField` | listings-feature | Translatable text — check 320px wrapping |
| `HeaderActions` | layout | Translatable text — check 320px wrapping |
| `HeaderView` | layout | Translatable text — check 320px wrapping |
| `HeroSearchView` | shared-ui | Translatable text — check 320px wrapping |
| `HowItWorksSteps` | shared-ui | Translatable text — check 320px wrapping |
| `ImageUpload` | listings-feature | Translatable text — check 320px wrapping |
| `LatestListingsView` | listings-feature | Translatable text — check 320px wrapping |
| `ListingCard` | listings-feature | Translatable text — check 320px wrapping |
| `ListingContact` | listings-feature | Translatable text — check 320px wrapping |
| `ListingDetailView` | listings-feature | Translatable text — check 320px wrapping |
| `ListingFormShell` | listings-feature | Translatable text — check 320px wrapping |
| `ListingFormShellView` | listings-feature | Translatable text — check 320px wrapping |
| `ListingGallery` | listings-feature | Translatable text — check 320px wrapping |
| `ListingInquiryDialog` | listings-feature | Translatable text — check 320px wrapping |
| `ListingMobileCTA` | listings-feature | Translatable text — check 320px wrapping |
| `ListingReportDialog` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsFilterBar` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsFilters` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsPagination` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsShell` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsSortBar` | listings-feature | Translatable text — check 320px wrapping |
| `ListingsStatusTabs` | listings-feature | Translatable text — check 320px wrapping |
| `LocaleSwitcher` | shared-ui | Translatable text — check 320px wrapping |
| `LocationCombobox` | shared-ui | Translatable text — check 320px wrapping |
| `MobileBottomNav` | layout | Translatable text — check 320px wrapping |
| `MobileNavDrawer` | layout | Translatable text — check 320px wrapping |
| `MultiToggleField` | listings-feature | Translatable text — check 320px wrapping |
| `NotificationBellView` | notifications-feature | Translatable text — check 320px wrapping |
| `NotificationCenter` | notifications-feature | Translatable text — check 320px wrapping |
| `NotificationItem` | notifications-feature | Translatable text — check 320px wrapping |
| `NumInputField` | listings-feature | Translatable text — check 320px wrapping |
| `PhoneField` | shared-ui | Translatable text — check 320px wrapping |
| `PropertyTypeCombobox` | shared-ui | Translatable text — check 320px wrapping |
| `RecentlyViewedGridView` | listings-feature | Translatable text — check 320px wrapping |
| `RoomsSelectorField` | listings-feature | Translatable text — check 320px wrapping |
| `SaveSearchButton` | listings-feature | Translatable text — check 320px wrapping |
| `SaveToCollectionButton` | listings-feature | Translatable text — check 320px wrapping |
| `SimilarListings` | listings-feature | Translatable text — check 320px wrapping |
| `SimilarListingsView` | listings-feature | Translatable text — check 320px wrapping |
| `StepBasicInfo` | listings-feature | Translatable text — check 320px wrapping |
| `StepDetails` | listings-feature | Translatable text — check 320px wrapping |
| `StepLocation` | listings-feature | Translatable text — check 320px wrapping |
| `StepPhotos` | listings-feature | Translatable text — check 320px wrapping |
| `StepPreview` | listings-feature | Translatable text — check 320px wrapping |
| `UserMenu` | layout | Translatable text — check 320px wrapping |
| `YearCombobox` | shared-ui | Translatable text — check 320px wrapping |
| `YearComboboxField` | listings-feature | Translatable text — check 320px wrapping |

## Huge Desktop Risk (2560px review required)

| Component | File | Issue |
|---|---|---|
| `loading` | src/app/[locale]/listings/[slug]/loading.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminCurrenciesManager` | src/components/admin/AdminCurrenciesManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminExchangeProvidersManager` | src/components/admin/AdminExchangeProvidersManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminInquiriesManager` | src/components/admin/AdminInquiriesManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminLegalManager` | src/components/admin/AdminLegalManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminListingsTable` | src/components/admin/AdminListingsTable.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminLocationsManager` | src/components/admin/AdminLocationsManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminPermissionsManager` | src/components/admin/AdminPermissionsManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminSupportManager` | src/components/admin/AdminSupportManager.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminUserCreate` | src/components/admin/AdminUserCreate.tsx | Grid without 2xl step — verify column count at 2560px |
| `AdminUserProfile` | src/components/admin/AdminUserProfile.tsx | Grid without 2xl step — verify column count at 2560px |
| `FooterView` | src/components/layout/FooterView.tsx | Grid without 2xl step — verify column count at 2560px |
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
| `ListingDetailView` | src/modules/listings/components/ListingDetailView.tsx | Grid without 2xl step — verify column count at 2560px |
| `ListingGallery` | src/modules/listings/components/ListingGallery.tsx | Grid without 2xl step — verify column count at 2560px |
| `ListingsFilters` | src/modules/listings/components/ListingsFilters.tsx | Grid without 2xl step — verify column count at 2560px |
| `RecentlyViewedGridView` | src/modules/listings/components/RecentlyViewedGridView.tsx | Grid without 2xl step — verify column count at 2560px |
| `RecentlyViewedSection` | src/modules/listings/components/RecentlyViewedSection.tsx | Grid without 2xl step — verify column count at 2560px |
| `StepBasicInfo` | src/modules/listings/components/steps/StepBasicInfo.tsx | Grid without 2xl step — verify column count at 2560px |
| `StepDetails` | src/modules/listings/components/steps/StepDetails.tsx | Grid without 2xl step — verify column count at 2560px |
| `StepLocation` | src/modules/listings/components/steps/StepLocation.tsx | Grid without 2xl step — verify column count at 2560px |

## Tailwind Entropy Risk

Components with arbitrary Tailwind values `[value]`:

| Component | Type | Arbitrary values detected |
|---|---|---|
| `AdminDashboardRecentListings` | admin-shared | Static analysis detected `[value]` in className |
| `AdminInquiriesManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminListingsTable` | admin-shared | Static analysis detected `[value]` in className |
| `AdminPagesManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminPermissionsManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminSidebar` | admin-shared | Static analysis detected `[value]` in className |
| `AdminSupportManager` | admin-shared | Static analysis detected `[value]` in className |
| `AdminTable` | admin-shared | Static analysis detected `[value]` in className |
| `AdminUserAvatar` | admin-shared | Static analysis detected `[value]` in className |
| `AdminUserProfile` | admin-shared | Static analysis detected `[value]` in className |
| `appImageConfig.ts` | canonical-primitive | Static analysis detected `[value]` in className |
| `AuthRedirect` | auth-feature | Static analysis detected `[value]` in className |
| `AuthSheet` | auth-feature | Static analysis detected `[value]` in className |
| `button` | canonical-primitive | Static analysis detected `[value]` in className |
| `checkbox` | canonical-primitive | Static analysis detected `[value]` in className |
| `DatePicker` | shared-ui | Static analysis detected `[value]` in className |
| `FavoritesTypeFilter` | listings-feature | Static analysis detected `[value]` in className |
| `GalleryStaticFrame` | listings-feature | Static analysis detected `[value]` in className |
| `HeaderView` | layout | Static analysis detected `[value]` in className |
| `HeroSearchClient` | shared-ui | Static analysis detected `[value]` in className |
| `LightboxView` | listings-feature | Static analysis detected `[value]` in className |
| `ListingCard` | listings-feature | Static analysis detected `[value]` in className |
| `ListingDetailView` | listings-feature | Static analysis detected `[value]` in className |
| `ListingsShell` | listings-feature | Static analysis detected `[value]` in className |
| `loading` | page | Static analysis detected `[value]` in className |
| `MobileBottomNav` | layout | Static analysis detected `[value]` in className |
| `navigation-menu` | canonical-primitive | Static analysis detected `[value]` in className |
| `NotificationCenter` | notifications-feature | Static analysis detected `[value]` in className |
| `NumInputField` | listings-feature | Static analysis detected `[value]` in className |
| `PerfDevOverlay` | shared-ui | Static analysis detected `[value]` in className |
| `ProfileTab` | cabinet-feature | Static analysis detected `[value]` in className |
| `ResetPasswordClient` | auth-feature | Static analysis detected `[value]` in className |
| `SavedSearchesTab` | cabinet-feature | Static analysis detected `[value]` in className |
| `scroll-area` | canonical-primitive | Static analysis detected `[value]` in className |
| `switch` | canonical-primitive | Static analysis detected `[value]` in className |
| `tabs` | canonical-primitive | Static analysis detected `[value]` in className |
| `VerifiedCard` | unknown | Static analysis detected `[value]` in className |

## Storybook Coverage Gap (high priority)

Shared/layout/admin components without stories — highest visibility components:

| Component | Type | Priority |
|---|---|---|
| `AdminCurrencyTabs` | admin-shared | HIGH — locale-aware, no story |
| `AdminDashboardRecentListings` | admin-shared | HIGH — locale-aware, no story |
| `AdminFooterManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminInquiriesManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminLegalManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminLocationsManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminPagesManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminPopularLocationsManager` | admin-shared | HIGH — locale-aware, no story |
| `AdminUserCreate` | admin-shared | HIGH — locale-aware, no story |
| `AvatarCropModal` | shared-ui | HIGH — locale-aware, no story |
| `DatePicker` | shared-ui | HIGH — locale-aware, no story |
| `FiltersPanel` | shared-ui | HIGH — locale-aware, no story |
| `HeaderActions` | layout | HIGH — locale-aware, no story |
| `HeaderView` | layout | HIGH — locale-aware, no story |
| `HeroSearchView` | shared-ui | HIGH — locale-aware, no story |
| `HowItWorksSteps` | shared-ui | HIGH — locale-aware, no story |
| `LocaleSwitcher` | shared-ui | HIGH — locale-aware, no story |
| `LocationCombobox` | shared-ui | HIGH — locale-aware, no story |
| `MobileBottomNav` | layout | HIGH — locale-aware, no story |
| `MobileNavDrawer` | layout | HIGH — locale-aware, no story |
| `PhoneField` | shared-ui | HIGH — locale-aware, no story |
| `PropertyTypeCombobox` | shared-ui | HIGH — locale-aware, no story |
| `UserMenu` | layout | HIGH — locale-aware, no story |
| `YearCombobox` | shared-ui | HIGH — locale-aware, no story |