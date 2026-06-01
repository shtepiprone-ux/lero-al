# Component Catalog — Lero.al
Last generated: 2026-05-28
See `docs/component-catalog-governance.md` for classification rules.
See `docs/component-coverage-matrix.md` for coverage mapping.
See `docs/component-risk-register.md` for risk register.
See `docs/design-system.md §7` for the canonical **component-ownership taxonomy** (Tier 1 Primitive UI · Tier 2 Global layout primitive · Tier 3 Data-surface primitive · Tier 4 Domain component) — Task 340. Catalog categories map onto these four tiers.

## Summary

| Metric | Count |
|---|---|
| Total cataloged components | 210 |
| Storybook stories | 19 |
| Locale-aware (useTranslations) | 84 |
| Client components ('use client') | 131 |
| With arbitrary Tailwind values | 64 |
| Components with 2xl responsive step | 7 |
| Components flagged for review | 73 |

## Canonical UI Primitives (`src/components/ui/`) (33)

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
| `PasswordInput` | CANONICAL | ✅ | 🌐 | LOCALIZATION  |
| `PasswordRequirementsHint` | CANONICAL | ✅ | 🌐 | LOCALIZATION  |
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

## Shared UI Components (`src/components/shared/`) (21)

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
| `LocaleSwitcher` | NEEDS_STORY | — | 🌐 | LOCALIZATION, MOBILE  |
| `LocationCombobox` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, MOBILE ⚠️ |
| `Map` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `MapWrapper` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `PerfDevOverlay` | MANUAL_REVIEW | — | — | PRIMITIVE_CHECK, TAILWIND_ENTROPY ⚠️ |
| `PerformanceStoreInit` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `PhoneField` | MANUAL_REVIEW | — | — | PRIMITIVE_CHECK, TAILWIND_ENTROPY ⚠️ |
| `PropertyTypeCombobox` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `RelativeTime` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `WebVitalsReporter` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `YearCombobox` | APPROVED | — | — | PRIMITIVE_CHECK  |

## Layout Components (`src/components/layout/`) (6)

> **Tier-2 Global Layout Primitives** (per `docs/design-system.md §7`): `PageShell`, `Section` (DS-1 Task 345), `PageHeader` (DS-2 Task 347).

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `Footer` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `Header` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `MobileBottomNav` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `PageHeader` | CANONICAL | ✅ | — | Tier-2 global layout primitive; server-safe; h1 title + optional description/countBadge/action; action stacks <md: / right-aligns md:+; no own container |
| `PageShell` | CANONICAL | ✅ | — | Tier-2 global layout primitive; server-safe; container=wide/narrow/form; §4 container-wide |
| `Section` | CANONICAL | ✅ | — | Tier-2 global layout primitive; server-safe; optional title (h2) + description; no own container |

## Admin Shared Components (`src/components/admin/`) (34)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `AdminCardList` | CANONICAL | ✅ | — | Structured card shape (title/subtitle/meta/trailing) + legacy ReactNode |
| `AdminCompaniesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminCurrenciesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminCurrencyTabs` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `AdminDashboardRecentListings` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminEditLayout` | APPROVED | — | — | —  |
| `AdminEmailTemplatesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminExchangeProvidersManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminFooterManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AdminInput` | APPROVED | — | — | —  |
| `AdminInquiriesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminLegalManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminListingsTable` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminLocaleSwitcher` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `AdminLocationsManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminMobileHeader` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminPageHeader` | APPROVED | — | — | Superseded by `AdminPageShell` — do not use in new pages |
| `AdminPageShell` | CANONICAL | ✅ | — | — |
| `AdminPermissionsManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `AdminPopularLocationsManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AdminPropertyTypesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminReportsManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AdminSearchInput` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `AdminTable` | CANONICAL | ✅ | — | Internal lg: table↔card switch; cardRow prop with synthesis fallback |
| `StatusChangeControl` | CANONICAL | ✅ | 🌐 | — |
| `StatusChangeHistory` | CANONICAL | ✅ | 🌐 | — |
| `AdminSettings` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminShell` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `AdminSidebar` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminSupportManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminUserAvatar` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminUserCreate` | NEEDS_STORY | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `AdminUserProfile` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminUsersTable` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |

## Auth Feature Components (4)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `AuthContext` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `AuthRedirect` | MANUAL_REVIEW | — | — | PRIMITIVE_CHECK, TAILWIND_ENTROPY ⚠️ |
| `AuthSheet` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ResetPasswordClient` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |

## Cabinet Feature Components (6)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `CabinetShell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `index.ts` | APPROVED | ✅ | — | —  |
| `ListingsTab` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `ProfileTab` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `queries.ts` | APPROVED | ✅ | — | —  |
| `SavedSearchesTab` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |

## Listings Feature Components (59)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `ActiveFilterChips` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AreaPairField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `BuildingFloorsField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `ButtonGroupField` | APPROVED | — | 🌐 | LOCALIZATION  |
| `ClearRecentlyViewedButton` | APPROVED | — | 🌐 | LOCALIZATION  |
| `CollectionsSection` | APPROVED | — | 🌐 | LOCALIZATION  |
| `DynamicFieldSection` | APPROVED | — | — | PRIMITIVE_CHECK, HUGE_DESKTOP  |
| `EnumSelectorField` | APPROVED | — | 🌐 | LOCALIZATION  |
| `FavoriteButton` | APPROVED | — | 🌐 | LOCALIZATION  |
| `FavoritesShell` | APPROVED | — | 🌐 | LOCALIZATION  |
| `FavoritesTypeFilter` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `FeaturedListings` | APPROVED | — | 🌐 | LOCALIZATION  |
| `fieldRegistry.ts` | APPROVED | ✅ | — | —  |
| `filterEngine.ts` | APPROVED | ✅ | — | —  |
| `FloorGroupField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `GalleryIsland` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `GalleryStaticFrame` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `ImageUpload` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `index.ts` | APPROVED | ✅ | — | —  |
| `LatestListings` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `ListingBackButton` | APPROVED | — | — | —  |
| `ListingCard` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingContact` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `ListingFeatureIcon` | APPROVED | — | — | —  |
| `ListingFormLoader` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `ListingFormShell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingGallery` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingMobileCTA` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `ListingReportDialog` | APPROVED | — | 🌐 | LOCALIZATION  |
| `listingSelect.ts` | APPROVED | ✅ | — | —  |
| `listingSemanticLayer.ts` | APPROVED | ✅ | — | —  |
| `ListingsFilterBar` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingsFilters` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingsPagination` | APPROVED | — | 🌐 | LOCALIZATION  |
| `ListingsShell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingsSortBar` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingsStatusTabs` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `ListingStatusBanner` | APPROVED | — | — | —  |
| `listingTransitionEngine.ts` | APPROVED | ✅ | — | —  |
| `MultiToggleField` | APPROVED | — | 🌐 | LOCALIZATION  |
| `NumInputField` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `propertyTypeSchema.ts` | APPROVED | ✅ | — | —  |
| `recentlyViewedConstants.ts` | APPROVED | ✅ | — | —  |
| `RecentlyViewedGrid` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `RecentlyViewedSection` | APPROVED | — | — | HUGE_DESKTOP  |
| `RecentlyViewedTracker` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `reportListing.ts` | APPROVED | ✅ | — | —  |
| `RoomsSelectorField` | APPROVED | — | 🌐 | LOCALIZATION  |
| `SaveSearchButton` | APPROVED | — | 🌐 | LOCALIZATION  |
| `SaveToCollectionButton` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `SimilarListings` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `StepBasicInfo` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `StepDetails` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `StepLocation` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `StepPhotos` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `StepPreview` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `useListingsUrlFilters.ts` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |
| `ViewTracker` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `YearComboboxField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |

## Locations Feature Components (1)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `PopularLocations` | APPROVED | — | — | —  |

## Notifications Feature Components (17)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `BaseEmail` | APPROVED | — | — | —  |
| `contactInquiry.ts` | APPROVED | ✅ | — | —  |
| `emailChange.ts` | APPROVED | ✅ | — | —  |
| `InactivityFinalEmail` | APPROVED | — | — | —  |
| `InactivityWarningEmail` | APPROVED | — | — | —  |
| `MagicLinkEmail` | APPROVED | — | — | —  |
| `NotificationBell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `NotificationCenter` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `NotificationItem` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `ReauthEmail` | APPROVED | — | — | —  |
| `RecoveryEmail` | APPROVED | — | — | —  |
| `ReporterNotificationEmail` | APPROVED | — | — | —  |
| `resolveUserLocale.ts` | APPROVED | ✅ | — | —  |
| `send.ts` | APPROVED | ✅ | — | —  |
| `sendTemplatedEmail.ts` | APPROVED | ✅ | — | —  |
| `useNotifications.ts` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |
| `VerifyEmail` | APPROVED | — | — | —  |

## Page/Layout Routes (`src/app/`) (10)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `layout` | APPROVED | — | — | —  |
| `loading` | APPROVED | — | — | —  |
| `loading` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `page` | APPROVED | — | — | —  |
| `page` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |

## Unknown / Manual Review (19)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `ContactForm` | APPROVED | — | 🌐 | LOCALIZATION  |
| `currencies.ts` | APPROVED | ✅ | — | —  |
| `exchangeProviders.ts` | APPROVED | ✅ | — | —  |
| `footer.ts` | APPROVED | ✅ | — | —  |
| `global-error` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `index.ts` | APPROVED | ✅ | — | —  |
| `index.ts` | APPROVED | ✅ | — | —  |
| `locale.ts` | APPROVED | ✅ | — | —  |
| `propertyTypes.ts` | APPROVED | ✅ | — | —  |
| `route.ts` | APPROVED | ✅ | — | —  |
| `route.ts` | APPROVED | ✅ | — | —  |
| `route.ts` | APPROVED | ✅ | — | —  |
| `route.ts` | APPROVED | ✅ | — | —  |
| `route.ts` | APPROVED | ✅ | — | —  |
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