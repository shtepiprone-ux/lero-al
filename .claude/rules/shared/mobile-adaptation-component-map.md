# Mantine component-to-mobile-pattern map

This is the current catalogue of canonical Mantine pattern components. The matching machine-readable inventory is
`scripts/mobile-adaptation-patterns.json`; every listed `.tsx` path must occur exactly once there. Read the named
pattern sections in `mobile-adaptation-patterns.md`, not the whole catalogue by default.

The last column is an allowlist of Mantine mechanisms, not a request to recreate them. Mantine's responsive API and
the listed canonical pattern path remain authoritative; the semantic profile only complements behavior that Mantine
cannot choose from content alone. A kickoff records one allowed mechanism and one canonical owner path from its
selected family. An unmapped component or mechanism is `BLOCKED — MOBILE PATTERN EXTENSION REQUIRED`.

| Family | Allowed mobile profiles | Allowed Mantine mechanisms | Canonical pattern components |
|---|---|---|---|
| Structural layout and feedback | `linear-flow`, `toolbar-priority`, `inline-control` | `responsive-props`, `visibility-props`, `app-shell-responsive` | `MantineAppShellFoundation`, `MantineDashboardCard`, `MantineDashboardGrid`, `MantineDashboardHeader`, `MantineEmptyLoadingErrorState`, `MantineHomeSection`, `MantineNotificationPattern`, `MantinePageHeaderWithActions` |
| Record, list, and data | `linear-flow`, `record-card`, `key-value-stack`, `data-table-to-cards` | `responsive-props`, `visibility-props` | `MantineAdminSurfacePattern`, `MantineDashboardStatCard`, `MantineDashboardStatRows`, `MantineDashboardWorkList`, `MantineDataTableToCards`, `MantineDetailList`, `MantineListingCardPattern`, `MantineListingDetailPattern`, `MantineListingPrice`, `MantineNavRowList` |
| Form, picker, and choice | `form-stack`, `toolbar-priority`, `inline-control` | `responsive-props`, `media-query-exception` | `MantineAddItemPanel`, `MantineAuthFormPattern`, `MantineCombobox`, `MantineFilterSection`, `MantineFormSectionStack`, `MantineRadioCardOption`, `MantineSelect`, `MantineTwoColumnForm`, `PasswordRequirementsHint`, `RangeDatePicker` |
| Rich-text editor | `editor-adaptive`, `form-stack`, `toolbar-priority` | `responsive-props` | `MantineRichTextEditor` |
| Filter and action toolbar | `toolbar-priority`, `inline-control` | `responsive-props`, `visibility-props` | `MantineDashboardPeriodControl`, `MantineFilterChips`, `MantineResponsiveActionFooter` |
| Navigation and pagination | `navigation-adaptive`, `inline-control` | `responsive-props`, `visibility-props`, `media-query-exception` | `MantineNavigationMenu`, `MantinePagination` |
| Overlay and disclosure | `overlay-adaptive`, `toolbar-priority`, `inline-control` | `responsive-props`, `media-query-exception` | `MantineDeleteConfirmModal`, `MantineDialogDrawerPattern`, `MantineDialogFooter`, `MantineDialogSections`, `MantineDrawer`, `MantineDropdownMenu`, `MantineModal`, `MantinePopover`, `MantineTooltip`, `responsiveBottomSheet` |
| Media, gallery, and listing contact | `grid-media-reflow`, `toolbar-priority`, `inline-control` | `responsive-props`, `visibility-props` | `GalleryDesktopNavigation`, `GalleryNavActionIcon`, `GalleryThumbnailButton`, `MantineListingCardTrack`, `MantineListingContactPattern`, `MantineListingGalleryPattern` |
| Data visualization | `data-visualization-reflow`, `toolbar-priority`, `inline-control` | `responsive-props`, `visibility-props` | `MantineDashboardBarChart`, `MantineDashboardChartLegend`, `MantineDashboardChartStateFrame`, `MantineDashboardDonut`, `MantineDashboardLineChart`, `MantineDashboardRadar`, `MantineDashboardRadialProgress`, `MantineDashboardSemiDonut`, `MantineDashboardSparkline` |
| Inline status and utility control | `inline-control`, `toolbar-priority` | `responsive-props`, `media-query-exception` | `MantineBadge`, `MantineCopyIdButton`, `MantineCountButton`, `MantineProgress` |

The map identifies allowed profiles and Mantine mechanisms; it does not select either automatically. The saved
kickoff selects the actual profiles, one compatible mechanism, and a canonical owner for the changed semantic
regions, then cites direct sources. A component used in more than one semantic role may select several profiles, but
it may not introduce an unregistered type or an unapproved Mantine bypass by implication.
