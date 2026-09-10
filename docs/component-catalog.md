# Component Catalog — Lero.al
Last generated: 2026-07-24 (Summary counters hand-corrected 2026-07-29 for Task 672's `MobileBottomNavView` and Task 681's `sonner` deletion, 2026-09-04 for Task 787's `MobileBottomNav`/`MobileBottomNavView` deletion, 2026-09-05 for Task 788's `FilterBar`/`PageHeader`/`PageShell`/`Section` deletion, 2026-09-06 for Task 793's `ListingContact` migration + new `ListingShareButton`, and 2026-09-09 for Task 792's `ListingBackButton`/`ListingStatusBanner`/`SimilarListingsView`/`RecentlyViewedGridView` migration (+4 Storybook stories) — zero production consumers; full regeneration deferred to avoid sweeping in unreviewed drift)
See `docs/component-catalog-governance.md` for classification rules.
See `docs/component-coverage-matrix.md` for coverage mapping.
See `docs/component-risk-register.md` for risk register.

## Summary

| Metric | Count |
|---|---|
| Total cataloged components | 240 |
| Storybook stories | 48 |
| Locale-aware (useTranslations) | 108 |
| Client components ('use client') | 156 |
| With arbitrary Tailwind values | 36 |
| Components with 2xl responsive step | 12 |
| Components flagged for review | 50 |

## Canonical UI Primitives (`src/components/ui/`) (33)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `alert` | NEEDS_STORY | — | — | —  |
| `AppImage` | NEEDS_STORY | — | — | —  |
| `appImageConfig.ts` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `avatar` | NEEDS_STORY | — | — | —  |
| `badge` | CANONICAL | ✅ | — | —  |
| `button` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `card` | NEEDS_STORY | — | — | —  |
| `checkbox` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `command` | CANONICAL | ✅ | 🌐 | LOCALIZATION  |
| `dialog` | CANONICAL | ✅ | 🌐 | LOCALIZATION  |
| `dropdown-menu` | CANONICAL | ✅ | — | —  |
| `input` | CANONICAL | ✅ | — | —  |
| `input-group` | NEEDS_STORY | — | — | —  |
| `label` | NEEDS_STORY | — | — | —  |
| `mobile-bottom-sheet.ts` | CANONICAL | ✅ | — | —  |
| `navigation-menu` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `pagination` | NEEDS_STORY | — | 🌐 | LOCALIZATION  |
| `PasswordInput` | CANONICAL | ✅ | 🌐 | LOCALIZATION  |
| `PasswordRequirementsHint` | CANONICAL | ✅ | 🌐 | LOCALIZATION  |
| `popover` | CANONICAL | ✅ | — | —  |
| `progress` | NEEDS_STORY | — | — | —  |
| `radio-group` | NEEDS_STORY | — | — | —  |
| `scroll-area` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `select` | CANONICAL | ✅ | — | —  |
| `separator` | NEEDS_STORY | — | — | —  |
| `sheet` | CANONICAL | ✅ | 🌐 | LOCALIZATION  |
| `skeleton` | CANONICAL | ✅ | — | —  |
| `slider` | NEEDS_STORY | — | — | —  |
| `switch` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `table` | NEEDS_STORY | — | — | —  |
| `tabs` | MANUAL_REVIEW | ✅ | — | TAILWIND_ENTROPY ⚠️ |
| `textarea` | NEEDS_STORY | — | — | —  |
| `useAdaptiveImageConfig.ts` | CANONICAL | ✅ | — | —  |

## Shared UI Components (`src/components/shared/`) (25)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `AgentCtaButton` | APPROVED | — | — | —  |
| `AvatarCropModal` | NEEDS_STORY | — | 🌐 | LOCALIZATION  |
| `Combobox` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `DatePicker` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `FilterRangeInputs` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `FilterRoomsRow` | APPROVED | — | — | —  |
| `FiltersPanel` | NEEDS_STORY | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `FilterToggleGroup` | APPROVED | — | — | —  |
| `HeroSearch` | APPROVED | — | — | —  |
| `HeroSearchClient` | MANUAL_REVIEW | — | — | PRIMITIVE_CHECK, TAILWIND_ENTROPY ⚠️ |
| `HeroSearchView` | NEEDS_STORY | — | 🌐 | LOCALIZATION  |
| `HowItWorksSteps` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `LocaleSwitcher` | NEEDS_STORY | — | 🌐 | LOCALIZATION, MOBILE  |
| `LocationCombobox` | NEEDS_STORY | — | 🌐 | LOCALIZATION  |
| `Map` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `MapWrapper` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `PerfDevOverlay` | MANUAL_REVIEW | — | — | PRIMITIVE_CHECK, TAILWIND_ENTROPY ⚠️ |
| `PerformanceStoreInit` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `PhoneField` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `PropertyTypeCombobox` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `RelativeTime` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `ViewAllLink` | APPROVED | — | — | —  |
| `WebVitalsReporter` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `YearCombobox` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |

## Layout Components (`src/components/layout/`) (6)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `FooterView` | APPROVED | — | — | HUGE_DESKTOP  |
| `Header` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `HeaderActions` | NEEDS_STORY | — | 🌐 | LOCALIZATION, MOBILE  |
| `HeaderView` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `MobileNavDrawer` | NEEDS_STORY | — | 🌐 | LOCALIZATION, MOBILE  |
| `UserMenu` | NEEDS_STORY | — | 🌐 | LOCALIZATION, MOBILE  |

## Admin Shared Components (`src/components/admin/`) (35)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `AdminCardList` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |
| `AdminCompaniesManager` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AdminCurrenciesManager` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, HUGE_DESKTOP ⚠️ |
| `AdminCurrencyTabs` | NEEDS_STORY | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `AdminDashboardRecentListings` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminEditLayout` | APPROVED | — | — | —  |
| `AdminEmailTemplatesManager` | APPROVED | ✅ | 🌐 | LOCALIZATION  |
| `AdminExchangeProvidersManager` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, HUGE_DESKTOP ⚠️ |
| `AdminFooterManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AdminInput` | APPROVED | — | — | —  |
| `AdminInquiriesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminLegalManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, HUGE_DESKTOP ⚠️ |
| `AdminListingsTable` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminLocaleSwitcher` | APPROVED | ✅ | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `AdminLocationsManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, HUGE_DESKTOP ⚠️ |
| `AdminMobileHeader` | APPROVED | ✅ | 🌐 | LOCALIZATION  |
| `AdminPageHeader` | APPROVED | — | — | —  |
| `AdminPageShell` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |
| `AdminPagesManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminPermissionsManager` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `AdminPopularLocationsManager` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AdminPropertyTypesManager` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AdminReportsManager` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `AdminSearchInput` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `AdminSettings` | APPROVED | ✅ | 🌐 | LOCALIZATION  |
| `AdminShell` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `AdminSidebar` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminSupportManager` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminTable` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `AdminUserAvatar` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminUserCreate` | NEEDS_STORY | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `AdminUserProfile` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `AdminUsersTable` | APPROVED | ✅ | 🌐 | LOCALIZATION  |
| `StatusChangeControl` | APPROVED | ✅ | 🌐 | LOCALIZATION  |
| `StatusChangeHistory` | APPROVED | ✅ | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |

## Auth Feature Components (4)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `AuthContext` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `AuthRedirect` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `AuthSheet` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ResetPasswordClient` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |

## Cabinet Feature Components (7)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `CabinetPasswordSection` | APPROVED | — | 🌐 | LOCALIZATION  |
| `CabinetShell` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `index.ts` | APPROVED | ✅ | — | —  |
| `ListingsTab` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `ProfileTab` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `queries.ts` | APPROVED | ✅ | — | —  |
| `SavedSearchesTab` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |

## Listings Feature Components (74)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `ActiveFilterChips` | APPROVED | — | 🌐 | LOCALIZATION  |
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
| `FeaturedListings` | APPROVED | 📷 | — | PRIMITIVE_CHECK  |
| `FeaturedListingsView` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `fieldRegistry.ts` | APPROVED | ✅ | — | —  |
| `filterEngine.ts` | APPROVED | ✅ | — | —  |
| `FloorGroupField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `GalleryIsland` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `GalleryStaticFrame` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `ImageUpload` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `index.ts` | APPROVED | ✅ | — | —  |
| `LatestListings` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `LatestListingsView` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `LightboxView` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `ListingBackButton` | APPROVED | ✅ | — | Task 792: leaves Tailwind onto Mantine `Button` |
| `ListingCard` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `listingConstants.ts` | APPROVED | ✅ | — | —  |
| `ListingContact` | APPROVED | — | 🌐 | LOCALIZATION — Task 793: leaves Tailwind onto `MantineListingContactPattern`, GOVERNANCE_VIOLATION cleared (zero `@/components/ui/*` imports) |
| `ListingDetailView` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION — Task 791: Mantine-migrated, TAILWIND_ENTROPY cleared (one unavoidable `className="hidden"` remains, see Task 791 session log) |
| `ListingFeatureIcon` | APPROVED | — | — | —  |
| `ListingFormLoader` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `ListingFormShell` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `ListingFormShellView` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `ListingGallery` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `ListingInquiryDialog` | APPROVED | — | 🌐 | LOCALIZATION  |
| `ListingMobileCTA` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, GOVERNANCE_VIOLATION ⚠️ |
| `ListingReportDialog` | APPROVED | — | 🌐 | LOCALIZATION  |
| `ListingShareButton` | APPROVED | — | 🌐 | LOCALIZATION — Task 793: new, badges-row share slot (`MantineListingDetailPattern`) |
| `listingSelect.ts` | APPROVED | ✅ | — | —  |
| `listingSemanticLayer.ts` | APPROVED | ✅ | — | —  |
| `ListingsFilterBar` | APPROVED | — | 🌐 | LOCALIZATION  |
| `ListingsFilters` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `ListingsPagination` | APPROVED | — | 🌐 | LOCALIZATION  |
| `ListingsShell` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `ListingsSortBar` | APPROVED | — | 🌐 | LOCALIZATION  |
| `ListingsStatusTabs` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `ListingStatusBanner` | APPROVED | ✅ | — | Task 792: leaves Tailwind onto Mantine `Alert`; "similar listings" now navigates to a pre-filtered `/{locale}/listings` search instead of an in-page anchor |
| `listingTransitionEngine.test.ts` | APPROVED | ✅ | — | —  |
| `listingTransitionEngine.ts` | APPROVED | ✅ | — | —  |
| `MantineListingCardTrack` | APPROVED | ✅ | — | Task 806: canonical `grid`/`rail` listing-card track (`src/design-system/mantine/patterns/`), `--listing-card-min` token. Task 807: consumed by all eight in-scope surfaces — `FeaturedListingsView`, `LatestListingsView`, `ListingsShellView` (grid mode), `RecentlyViewedGridView`, `SimilarListingsView`, `SimilarListingsSkeleton` (rail mode). Task 810: the whole module becomes a client component (`'use client'` is a module directive — `grid` mode ships this module's JS too, not only `rail`) for the rail's prev/next `ActionIcon` controls (visible only when that direction can scroll), a thin hover-thickening native scrollbar, D74-5 (lone card fills the rail ≤480px, `@media`) and D74-6 (count-ladder card fraction, capped at `--listing-card-min`, guaranteeing a peek at every width). Equal card heights (R4) fixed in this file — see `.rail > a, .grid > a { height: auto }` (wins on `@layer` and specificity). Revision 1 (D74-9): the D74-6 ladder re-keys from `@media` to `@container` (`.wrapper { container-type: inline-size }`) so the same viewport can no longer select a different rung on two routes with different container widths; D74-7 closes `offset=36`; D74-8 fixes control paging to a whole snap-aligned page. |
| `MultiToggleField` | APPROVED | — | 🌐 | LOCALIZATION  |
| `NumInputField` | MANUAL_REVIEW | ✅ | 🌐 | LOCALIZATION, PRIMITIVE_CHECK ⚠️ |
| `propertyTypeSchema.ts` | APPROVED | ✅ | — | —  |
| `recentlyViewedConstants.ts` | APPROVED | ✅ | — | —  |
| `RecentlyViewedGrid` | APPROVED | — | — | —  |
| `RecentlyViewedGridView` | APPROVED | ✅ | 🌐 | LOCALIZATION, HUGE_DESKTOP — Task 792: leaves Tailwind; horizontal-scroll/grid switch moved to `RecentlyViewedGridView.module.css` |
| `RecentlyViewedSection` | APPROVED | — | — | HUGE_DESKTOP  |
| `RecentlyViewedTracker` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `reportListing.ts` | APPROVED | ✅ | — | —  |
| `RoomsSelectorField` | APPROVED | — | 🌐 | LOCALIZATION  |
| `SaveSearchButton` | APPROVED | — | 🌐 | LOCALIZATION  |
| `SaveToCollectionButton` | APPROVED | — | 🌐 | LOCALIZATION  |
| `SimilarListings` | APPROVED | — | 🌐 | LOCALIZATION  |
| `SimilarListingsView` | APPROVED | ✅ | 🌐 | LOCALIZATION — Task 792: leaves Tailwind onto Mantine `Title`/`SimpleGrid`; Task 803: 8-item horizontal-scroll row (D72-5, `SimpleGrid` removed) + `ViewAllLink` header control |
| `StepBasicInfo` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `StepDetails` | APPROVED | — | 🌐 | LOCALIZATION, HUGE_DESKTOP  |
| `StepLocation` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `StepPhotos` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `StepPreview` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `submitListingInquiry.test.ts` | APPROVED | ✅ | — | —  |
| `submitListingInquiry.ts` | APPROVED | ✅ | — | —  |
| `useListingsUrlFilters.ts` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |
| `ViewTracker` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `visibility.ts` | APPROVED | ✅ | — | —  |
| `YearComboboxField` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |

## Locations Feature Components (1)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `PopularLocationsView` | APPROVED | — | 🌐 | LOCALIZATION  |

## Notifications Feature Components (21)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `BaseEmail` | APPROVED | — | — | —  |
| `contactInquiry.ts` | APPROVED | ✅ | — | —  |
| `emailChange.ts` | APPROVED | ✅ | — | —  |
| `InactivityFinalEmail` | APPROVED | — | — | —  |
| `InactivityWarningEmail` | APPROVED | — | — | —  |
| `listingInquiry.ts` | APPROVED | ✅ | — | —  |
| `MagicLinkEmail` | APPROVED | — | — | —  |
| `NotificationBell` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `NotificationBellView` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `NotificationCenter` | MANUAL_REVIEW | — | 🌐 | LOCALIZATION, TAILWIND_ENTROPY ⚠️ |
| `NotificationItem` | APPROVED | ✅ | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
| `passwordChanged.ts` | APPROVED | ✅ | — | —  |
| `PasswordChangedEmail` | APPROVED | — | — | —  |
| `ReauthEmail` | APPROVED | — | — | —  |
| `RecoveryEmail` | APPROVED | — | — | —  |
| `ReporterNotificationEmail` | APPROVED | — | — | —  |
| `resolveUserLocale.ts` | APPROVED | ✅ | — | —  |
| `send.ts` | APPROVED | ✅ | — | —  |
| `sendTemplatedEmail.ts` | APPROVED | ✅ | — | —  |
| `useNotifications.ts` | APPROVED | ✅ | — | PRIMITIVE_CHECK  |
| `VerifyEmail` | APPROVED | — | — | —  |

## Page/Layout Routes (`src/app/`) (11)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `layout` | APPROVED | — | — | —  |
| `loading` | APPROVED | — | — | —  |
| `loading` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY, HUGE_DESKTOP ⚠️ |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |
| `page` | APPROVED | — | — | —  |

## Unknown / Manual Review (23)

| Component | Status | Story | i18n | Risks |
|---|---|---|---|---|
| `CaptchaWidget` | APPROVED | — | 🌐 | LOCALIZATION, PRIMITIVE_CHECK  |
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
| `VerifiedBridge` | APPROVED | — | — | PRIMITIVE_CHECK  |
| `VerifiedCard` | MANUAL_REVIEW | — | — | TAILWIND_ENTROPY ⚠️ |
| `WhatsAppContactButton` | APPROVED | — | 🌐 | LOCALIZATION  |

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