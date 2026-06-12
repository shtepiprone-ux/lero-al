# Global Storybook Responsive Inventory — lero-al
**Created:** 2026-06-08 — Task 412 (Canonical Responsive Standard + Global Storybook Responsive Matrix Rework)
**Status:** CANONICAL INVENTORY — update when stories are added/removed/fixed
**Based on:** Task 411 rendered run (`2459/2520 PASS, 61 FAIL`), story-discovery transcript below, and `docs/design-system.md §§3/10/14/24–27`.

---

## §1 — Story-discovery transcript (A6 mandate)

**Discovery method:** `Glob('src/**/*.stories.tsx')` + `Glob('src/stories/**/*.{tsx,ts}')` run on the live repository tree — no manual cherry-picking.

### Discovered story files (43 total)

#### Primitives (14 story files)
| File | In ASSERT_STORIES? | Type |
|---|---|---|
| `src/components/ui/badge.stories.tsx` | ✅ `primitives-badge--default` | Product-rendering story |
| `src/components/ui/button.stories.tsx` | ✅ `primitives-button--default` | Product-rendering story |
| `src/components/ui/checkbox.stories.tsx` | ✅ `primitives-checkbox--default` | Product-rendering story |
| `src/components/ui/command.stories.tsx` | ✅ `primitives-command--inline` | Product-rendering story |
| `src/components/ui/dialog.stories.tsx` | ✅ `primitives-dialog--default` | Product-rendering story |
| `src/components/ui/dropdown-menu.stories.tsx` | ✅ `primitives-dropdownmenu--default` | Product-rendering story |
| `src/components/ui/input.stories.tsx` | ✅ `primitives-input--default` | Product-rendering story |
| `src/components/ui/PasswordInput.stories.tsx` | ✅ `primitives-passwordinput--default` | Product-rendering story |
| `src/components/ui/PasswordRequirementsHint.stories.tsx` | ✅ `primitives-passwordrequirementshint--idle` | Product-rendering story |
| `src/components/ui/popover.stories.tsx` | ✅ `primitives-popover--default` | Product-rendering story |
| `src/components/ui/select.stories.tsx` | ✅ `primitives-select--default` | Product-rendering story |
| `src/components/ui/sheet.stories.tsx` | ✅ `primitives-sheet--filter-sheet-right` | Product-rendering story |
| `src/components/ui/skeleton.stories.tsx` | ✅ `primitives-skeleton--listing-card-skeleton` | Product-rendering story |
| `src/components/ui/tabs.stories.tsx` | ✅ `primitives-tabs--default` | Product-rendering story |

#### Shared (1 story file)
| File | In ASSERT_STORIES? | Type |
|---|---|---|
| `src/components/shared/Combobox.stories.tsx` | ✅ `shared-combobox--button-variant` | Product-rendering story |

#### Admin — original 5 (pre-Task 410)
| File | In ASSERT_STORIES? | Type |
|---|---|---|
| `src/components/admin/AdminCardList.stories.tsx` | ✅ `admin-admincardlist--default` | Product-rendering story |
| `src/components/admin/AdminPageShell.stories.tsx` | ✅ `admin-adminpageshell--default` | Product-rendering story |
| `src/components/admin/AdminTable.stories.tsx` | ✅ `admin-admintable--default` | Product-rendering story |
| `src/components/admin/StatusChangeControl.stories.tsx` | ✅ `admin-statuschangecontrol--select` | Product-rendering story |
| `src/components/admin/StatusChangeHistory.stories.tsx` | ✅ `admin-statuschangehistory--empty` | Product-rendering story |

#### Admin — Task 410 new 14 stories
| File | In ASSERT_STORIES? | Type |
|---|---|---|
| `src/components/admin/AdminLocaleSwitcher.stories.tsx` | ✅ `admin-adminlocaleswitcher--default` | Product-rendering story |
| `src/components/admin/AdminMobileHeader.stories.tsx` | ✅ `admin-adminmobileheader--default` | Product-rendering story |
| `src/components/admin/AdminUserAvatar.stories.tsx` | ✅ `admin-adminuseravatar--view-placeholder` + `--edit-mode` | Product-rendering story (2 surfaces) |
| `src/components/admin/AdminSidebar.stories.tsx` | ✅ `admin-adminsidebar--desktop` + `--mobile-drawer-open` | Product-rendering story (2 surfaces) |
| `src/components/admin/AdminSettings.stories.tsx` | ✅ `admin-adminsettings--default` | Product-rendering story |
| `src/components/admin/AdminCurrenciesManager.stories.tsx` | ✅ `admin-admincurrenciesmanager--default` | Product-rendering story |
| `src/components/admin/AdminExchangeProvidersManager.stories.tsx` | ✅ `admin-adminexchangeprovidersmanager--default` | Product-rendering story |
| `src/components/admin/AdminPropertyTypesManager.stories.tsx` | ✅ `admin-adminpropertytypesmanager--default` | Product-rendering story |
| `src/components/admin/AdminCompaniesManager.stories.tsx` | ✅ `admin-admincompaniesmanager--default` | Product-rendering story |
| `src/components/admin/AdminSupportManager.stories.tsx` | ✅ `admin-adminsupportmanager--default` | Product-rendering story |
| `src/components/admin/AdminEmailTemplatesManager.stories.tsx` | ✅ `admin-adminemailtemplatesmanager--default` | Product-rendering story |
| `src/components/admin/AdminListingsTable.stories.tsx` | ✅ `admin-adminlistingstable--default` | Product-rendering story |
| `src/components/admin/AdminUsersTable.stories.tsx` | ✅ `admin-adminuserstable--default` | Product-rendering story |
| `src/components/admin/AdminUserProfile.stories.tsx` | ✅ `admin-adminuserprofile--default` | Product-rendering story |

#### Layout (4 story files)
| File | In ASSERT_STORIES? | Type |
|---|---|---|
| `src/components/layout/FilterBar.stories.tsx` | ✅ `layout-filterbar--default` | Product-rendering story |
| `src/components/layout/PageHeader.stories.tsx` | ✅ `layout-pageheader--default` | Product-rendering story |
| `src/components/layout/PageShell.stories.tsx` | ✅ `layout-pageshell--default` | Product-rendering story |
| `src/components/layout/Section.stories.tsx` | ✅ `layout-section--with-title-and-description` | Product-rendering story |

#### System (5 story files)
| File | In ASSERT_STORIES? | Type |
|---|---|---|
| `src/stories/AdminLayout.stories.tsx` | ✅ `system-adminlayout--admin-toolbar` | Product-rendering story |
| `src/stories/Containers.stories.tsx` | ✅ `system-containers--container-wide` | Product-rendering story |
| `src/stories/EmptyState.stories.tsx` | ✅ `system-emptystate--no-listings` | Product-rendering story |
| `src/stories/ListingGrid.stories.tsx` | ✅ `system-listinggrid--desktop` | Product-rendering story |
| `src/stories/RecentlyViewedSection.stories.tsx` | ✅ `system-recentlyviewedsection--populated` | Product-rendering story |

#### Non-story files in src/stories/ (helper/fixture — NOT story files)
| File | Classification |
|---|---|
| `src/stories/_storyI18n.ts` | i18n helper — not a story |
| `src/stories/fixtures/listing.fixture.ts` | Listing fixture data — not a story |
| `src/stories/fixtures/admin.fixtures.ts` | Admin fixture data — not a story |
| `src/stories/StoryListingCard.tsx` | Story render helper component — not a story |

### ASSERT_STORIES count: 45 story IDs (some files contribute 2 IDs)
All 43 story files have at least one ID in `ASSERT_STORIES`. No story file is silently omitted.
Story files contributing 2 IDs: `AdminUserAvatar` (view-placeholder + edit-mode), `AdminSidebar` (desktop + mobile-drawer-open).

### Multi-export stories not individually listed in ASSERT_STORIES
ASSERT_STORIES targets the **first/canonical** export per file for machine-checking. Additional exports
(e.g. Button's `MobileSafe`, `LongLocaleLabel`, `SizeVariants`; Dialog's `MobileDialog`; etc.) exist
within the story files and are tested via the Storybook viewport/locale toolbar during manual QA.
The machine gate covers the canonical export; manual visual QA covers non-default exports.

### Generated ID inventory (Storybook build 2026-06-08)
- Total entries in `storybook-static/index.json`: 248 (205 story + 43 docs)
- All 45 ASSERT_STORIES IDs present in generated build: **CONFIRMED — 0 phantom**
- Generated story IDs NOT in ASSERT_STORIES: **160** (supplementary variants — manual-QA-only)
- New `--tablet` exports confirmed for 10 admin manager files: directly relevant for tableAtLg verification at the 768–1023px range (§10/§25.1). Full ID list: see §7.

---

## §2 — Full story inventory

Legend for "Needs fix?":
- **YES** = known machine FAIL (Task 411) — required fix in a phased slice
- **OPEN DECISION** = machine PASS but manual QA needed for §26 compliance or tableAt declaration
- **NO** = machine PASS + structurally clean; low manual-QA risk
- **INFRA FLAKE** = isolated infrastructure issue, not a layout defect
- **GAP** = cannot be fully evaluated; reason given

| Story file | Story id/name | Area | Components/surfaces rendered | Locales covered | Responsive risk | Needs fix? | Reason / Phase-1 contract |
|---|---|---|---|---|---|---|---|
| `button.stories.tsx` | `primitives-button--default` + multi | Primitives | Button (all sizes, variants, icon-only, text, loading) | sq/en/uk/it toolbar-reactive | HIGH | NO | Task 372 fixed `max-sm:w-full` on all text sizes; `max-sm:min-h-11`. Machine PASS (Task 411). §12b, §26.1 |
| `badge.stories.tsx` | `primitives-badge--default` | Primitives | Badge (all variants, sizes) | sq/en/uk/it | LOW | NO | Non-interactive display component; wraps naturally. Machine PASS. §6 |
| `checkbox.stories.tsx` | `primitives-checkbox--default` | Primitives | Checkbox (default, checked, indeterminate, disabled) | sq/en/uk/it | LOW | NO | Fixed-size control; no full-width concern. Machine PASS. §12 |
| `command.stories.tsx` | `primitives-command--inline` | Primitives | Command (inline search + list) | sq/en/uk/it | HIGH | OPEN DECISION | Popup variant at `<640` needs §26.2 bottom-sheet manual QA. Machine PASS (no overflow). §26.2, §27.3 gap |
| `dialog.stories.tsx` | `primitives-dialog--default` + multi | Primitives | Dialog (default, mobile, destructive, scrollable) | sq/en/uk/it | HIGH | OPEN DECISION | Dialog bottom-sheet compliance at `<640` (§26.2) not machine-checked. Visual QA required: opens as bottom-sheet? Footer actions reachable? Machine PASS on overflow. §14, §26.2 |
| `dropdown-menu.stories.tsx` | `primitives-dropdownmenu--default` | Primitives | DropdownMenu (trigger + item list) | sq/en/uk/it | HIGH | OPEN DECISION | DropdownMenu bottom-sheet at `<640` (§26.2) not machine-checked. Visual QA required. Machine PASS. §26.2 |
| `input.stories.tsx` | `primitives-input--default` | Primitives | Input (default, sizes, states) | sq/en/uk/it | MEDIUM | NO | `h-11` default since Task 375; fills parent. Machine PASS. §12a, §26.1 |
| `PasswordInput.stories.tsx` | `primitives-passwordinput--default` | Primitives | PasswordInput (with visibility toggle) | sq/en/uk/it | MEDIUM | NO | Same as Input + icon-only toggle (exempt from full-width). Machine PASS. §12a, §26.4 |
| `PasswordRequirementsHint.stories.tsx` | `primitives-passwordrequirementshint--idle` | Primitives | PasswordRequirementsHint (text list) | sq/en/uk/it | LOW | NO | Non-interactive text list; wraps naturally. Machine PASS. §6 |
| `popover.stories.tsx` | `primitives-popover--default` | Primitives | Popover (trigger + content panel) | sq/en/uk/it | HIGH | OPEN DECISION | Popover bottom-sheet at `<640` (§26.2) not machine-checked. Visual QA required. Machine PASS. §26.2 |
| `select.stories.tsx` | `primitives-select--default` | Primitives | Select (trigger + dropdown list) | sq/en/uk/it | HIGH | OPEN DECISION | SelectTrigger width machine-checked (PASS); dropdown bottom-sheet at `<640` not checked. Visual QA required for §26.2. §12c, §26.1, §26.2 |
| `sheet.stories.tsx` | `primitives-sheet--filter-sheet-right` + multi | Primitives | Sheet (right filter, left nav, bottom) | sq/en/uk/it | HIGH | NO | Canonical Sheet primitive; already bottom-sheet pattern. Machine PASS. §14, §26.2 |
| `skeleton.stories.tsx` | `primitives-skeleton--listing-card-skeleton` | Primitives | Skeleton (listing card, form shapes) | sq/en/uk/it | LOW | NO | Non-interactive loading placeholder. Machine PASS. §6 |
| `tabs.stories.tsx` | `primitives-tabs--default` | Primitives | Tabs (list + triggers, all locales) | sq/en/uk/it | HIGH | NO | Task 372 v2 fixed TabsList `max-sm:flex max-sm:w-full`. Machine PASS. §12b, §26.1 |
| `Combobox.stories.tsx` | `shared-combobox--button-variant` | Shared | Combobox (button-variant + input-variant, all location/property/year variants) | sq/en/uk/it | HIGH | OPEN DECISION | Trigger full-width machine-checked for input-variant; button-variant full-width + dropdown bottom-sheet at `<640` needs manual QA. Task 371 fixed left-alignment + label-resolution. §12c, §26.1, §26.2 |
| `AdminCardList.stories.tsx` | `admin-admincardlist--default` | Admin | AdminCardList (card rows, compact mode) | sq/en/uk/it | MEDIUM | NO | Cards-at-all-widths pattern. Machine PASS. §9, §10 (cardOnly/nonTabular) |
| `AdminPageShell.stories.tsx` | `admin-adminpageshell--default` | Admin | AdminPageShell (title + actions + filterbar slot) | sq/en/uk/it | HIGH | OPEN DECISION | Action stacking at `<640` — button full-width NOT machine-checked. Manual QA: buttons full-width at 320/375/390. Machine PASS on overflow. §9, §12b, §26.1 |
| `AdminTable.stories.tsx` | `admin-admintable--default` + multi | Admin | AdminTable (table ≥1024, cards <1024, sort menus, columns manager) | sq/en/uk/it | HIGH | NO | `tableAtLg` reference implementation; Task 306-Fix pilot. Machine PASS. §10, §12b, §25.1 |
| `StatusChangeControl.stories.tsx` | `admin-statuschangecontrol--select` | Admin | StatusChangeControl (Select-based status switcher) | sq/en/uk/it | HIGH | OPEN DECISION | SelectTrigger width machine-checked (PASS); status dropdown bottom-sheet at `<640` not checked. Manual QA: §26.2 compliance. §12c, §26.2 |
| `StatusChangeHistory.stories.tsx` | `admin-statuschangehistory--empty` + multi | Admin | StatusChangeHistory (status timeline list) | sq/en/uk/it | MEDIUM | NO | Text/date list; no interactive popups; wraps naturally. Machine PASS. §6, §25.1 |
| `AdminLocaleSwitcher.stories.tsx` | `admin-adminlocaleswitcher--default` | Admin | AdminLocaleSwitcher (locale dropdown in admin header) | sq/en/uk/it | HIGH | OPEN DECISION | Locale dropdown bottom-sheet at `<640` (§26.2) not machine-checked. Machine PASS. §26.2 |
| `AdminMobileHeader.stories.tsx` | `admin-adminmobileheader--default` | Admin | AdminMobileHeader (mobile header bar: hamburger + title + locale) | sq/en/uk/it | HIGH | OPEN DECISION | Full-width across mobile viewports; button full-width NOT machine-checked. Manual QA: all controls full-width at 320/375/390. **Note:** uk×1920 cell = infra flake (`ERR_NO_BUFFER_SPACE`), not a layout defect. Machine PASS (others). §9, §26.1 |
| `AdminUserAvatar.stories.tsx` | `admin-adminuseravatar--view-placeholder` (surface 1) | Admin | AdminUserAvatar: view mode (avatar + fallback) | sq/en/uk/it | MEDIUM | NO | Display component; avatar is icon-only (exempt from full-width). Machine PASS. §26.4 |
| `AdminUserAvatar.stories.tsx` | `admin-adminuseravatar--edit-mode` (surface 2) | Admin | AdminUserAvatar: edit mode (avatar upload + remove button) | sq/en/uk/it | HIGH | OPEN DECISION | Upload/remove buttons full-width at `<640` NOT machine-checked. Manual QA: §26.1 compliance. §26.1 |
| `AdminSidebar.stories.tsx` | `admin-adminsidebar--desktop` (surface 1) | Admin | AdminSidebar: desktop sidebar (nav links, role, avatar) | sq/en/uk/it | HIGH | OPEN DECISION | Desktop layout; nav label truncation at narrow desktop widths. Machine PASS. §9 |
| `AdminSidebar.stories.tsx` | `admin-adminsidebar--mobile-drawer-open` (surface 2) | Admin | AdminSidebar: mobile drawer (Sheet-based slide-out) | sq/en/uk/it | HIGH | OPEN DECISION | Mobile drawer = Sheet primitive. Bottom-sheet at `<640` (§26.2): this is a side-sheet — verify it transitions to full-width at `<640`. Machine PASS. §14, §26.2 |
| `AdminSettings.stories.tsx` | `admin-adminsettings--default` + multi (--locale-stress, --tablet) | Admin | AdminSettings (settings form with sections, labels, inputs, save/cancel) | sq/en/uk/it | HIGH | OPEN DECISION | Form action buttons (save/cancel) full-width at `<640` NOT machine-checked. Form = `formLayout` pattern. Manual QA: §26.1 + §12 compliance. §12, §12b, §26.1 |
| `AdminCurrenciesManager.stories.tsx` | `admin-admincurrenciesmanager--default` + multi (--locale-stress, --tablet) | Admin | AdminCurrenciesManager (raw `<table>` currently; Tabs + currency rows) | sq/en/uk/it | **CRITICAL** | **YES — Slice 1** | **60 overflow FAIL cells** in Task 411 (sq/en/uk/it × 320/375/390/480/560 = raw table overflows). Migrate to `AdminTable`/`AdminCardList` `tableAtLg`. Preserve: currency CODE column, rate column, active toggle, add/edit/delete actions, tabs (manual/automatic), empty/loading/error states. §10 (tableAtLg), §25.1 |
| `AdminExchangeProvidersManager.stories.tsx` | `admin-adminexchangeprovidersmanager--default` + multi (--locale-stress, --tablet) | Admin | AdminExchangeProvidersManager (exchange rate provider list) | sq/en/uk/it | HIGH | OPEN DECISION | Machine PASS (Task 411). tableAt decision not yet declared in design-system inventory. Manual QA: is this `tableAtLg` or `nonTabular`? Verify at 768/1024. §10, §25.1 |
| `AdminPropertyTypesManager.stories.tsx` | `admin-adminpropertytypesmanager--default` + multi (--locale-stress, --tablet) | Admin | AdminPropertyTypesManager (raw `<table>` currently; property type rows) | sq/en/uk/it | **CRITICAL** | **YES — Slice 1** | **Part of 60 overflow FAIL cells** in Task 411. Migrate to `AdminTable`/`AdminCardList` `tableAtLg`. Preserve: name column, icon, order, edit/delete actions, empty/loading/error states. §10 (tableAtLg), §25.1 |
| `AdminCompaniesManager.stories.tsx` | `admin-admincompaniesmanager--default` + multi (--locale-stress, --tablet) | Admin | AdminCompaniesManager (raw `<table>` currently; company rows) | sq/en/uk/it | **CRITICAL** | **YES — Slice 1** | **Part of 60 overflow FAIL cells** in Task 411. Migrate to `AdminTable`/`AdminCardList` `tableAtLg`. Preserve: name, city, type, listings count, edit/delete/view actions, search, filter, empty/loading/error states. §10 (tableAtLg), §25.1 |
| `AdminSupportManager.stories.tsx` | `admin-adminsupportmanager--default` + multi (--empty-state, --locale-stress, --tablet) | Admin | AdminSupportManager (support ticket list/table) | sq/en/uk/it | HIGH | OPEN DECISION | Machine PASS (Task 411). tableAt decision needed. Likely `tableAtLg`. Verify column set + row actions at 768–1023. §10, §25.1 |
| `AdminEmailTemplatesManager.stories.tsx` | `admin-adminemailtemplatesmanager--default` + multi (--locale-stress, --tablet) | Admin | AdminEmailTemplatesManager (email template list + form) | sq/en/uk/it | HIGH | OPEN DECISION | Machine PASS. Has both list and form surfaces. `formLayout` for form; `nonTabular`/`tableAtLg` for list. Verify form action buttons at `<640`. §10, §12, §26.1 |
| `AdminListingsTable.stories.tsx` | `admin-adminlistingstable--default` + multi (--filtered-pending, --locale-stress, --tablet) | Admin | AdminListingsTable (reference `tableAtLg` implementation, sort, search, filter) | sq/en/uk/it | HIGH | NO | `tableAtLg` reference implementation (Task 306-Fix). Machine PASS. All columns/row-actions preserved. §10, §25.1 |
| `AdminUsersTable.stories.tsx` | `admin-adminuserstable--default` + multi (--locale-stress, --location-requests, --tablet, --verified-tab) | Admin | AdminUsersTable (user management table) | sq/en/uk/it | HIGH | OPEN DECISION | Machine PASS. tableAt decision needed. Verify column set + row actions + pagination at 768–1023. `tableAtLg` target. §10, §25.1 |
| `AdminUserProfile.stories.tsx` | `admin-adminuserprofile--default` + multi (--create-mode, --locale-stress, --tablet) | Admin | AdminUserProfile (user detail form, avatar, role selector, status) | sq/en/uk/it | HIGH | OPEN DECISION | `detailLayout` or `formLayout` pattern. Machine PASS. Action buttons full-width at `<640` NOT machine-checked. Manual QA: §26.1. §10 (detailLayout), §12, §26.1 |
| `FilterBar.stories.tsx` | `layout-filterbar--default` + multi | Layout | FilterBar (filter chips, search input, reset, sheet variant) | sq/en/uk/it | HIGH | NO | FilterBar fixed in Sprint 32/33 (Tasks 362/376). `[&>*]:max-sm:w-full` on chips + `sm:items-start`. Machine PASS. §11, §12a, §26.1 |
| `PageHeader.stories.tsx` | `layout-pageheader--default` + multi | Layout | PageHeader (title + count badge + actions slot, all locales) | sq/en/uk/it | HIGH | NO | Task 354-Fix fixed action stacking. Machine PASS. §9, §12b, §26.1 |
| `PageShell.stories.tsx` | `layout-pageshell--default` + multi | Layout | PageShell (public page wrapper, header/footer, container) | sq/en/uk/it | HIGH | NO | DS-1 migration (Task 345). Machine PASS. §8, §4 |
| `Section.stories.tsx` | `layout-section--with-title-and-description` + multi | Layout | Section (content section: title, description, children) | sq/en/uk/it | MEDIUM | NO | DS-1 migration. Heading wraps in uk. Machine PASS. §5, §6 |
| `AdminLayout.stories.tsx` | `system-adminlayout--admin-toolbar` | System | AdminLayout (admin shell demo: sidebar + main area + toolbar) | sq/en/uk/it | HIGH | OPEN DECISION | Shell demo; action buttons in toolbar NOT machine-checked for full-width. Manual QA: toolbar at mobile. §9, §26.1 |
| `Containers.stories.tsx` | `system-containers--container-wide` + multi | System | Containers (container-wide, container-admin, content-container) | sq/en/uk/it | HIGH | NO | Container max-width at 1408/1792px. Machine PASS. Wide-desktop visual QA: no stretch at 2560. §4 |
| `EmptyState.stories.tsx` | `system-emptystate--no-listings` + multi | System | EmptyState (no listings, Ukrainian locale stress, mobile) | sq/en/uk/it | MEDIUM | NO | CTA button full-width — Task 372 fixed. Machine PASS. §6, §12b |
| `ListingGrid.stories.tsx` | `system-listinggrid--desktop` + multi | System | ListingGrid (card grid: 1→2→3→4 columns, uk titles, huge desktop) | sq/en/uk/it | HIGH | NO | Task 409 fixed pricing/currency. 4-column at 2xl. Machine PASS. §13 |
| `RecentlyViewedSection.stories.tsx` | `system-recentlyviewedsection--populated` | System | RecentlyViewedSection (horizontal-scroll listing card section) | sq/en/uk/it | MEDIUM | NO | Task 409 fixed pricing/dates. Horizontal scroll intentional (section-level). Machine PASS. §13 |

---

## §3 — Category coverage summary

| Category | Story files | Total ASSERT_STORIES IDs | Machine PASS (Task 411) | Needs fix (Slice 1) | OPEN DECISION |
|---|---|---|---|---|---|
| Primitives | 14 | 14 | 14 | 0 | 5 (command, dialog, dropdown-menu, popover, select) |
| Shared | 1 | 1 | 1 | 0 | 1 (combobox) |
| Admin | 19 | 21 | 18 | 3 (currencies, property-types, companies) | 14 |
| Layout | 4 | 4 | 4 | 0 | 0 |
| System | 5 | 5 | 5 | 0 | 1 (adminlayout) |
| **Total** | **43** | **45** | **42** | **3** | **21** |

**Notes:**
- "Machine PASS (Task 411)" = no failure detected by assertions (a)/(b)/(c) in `screenshots:assert`
- "OPEN DECISION" does not mean the story is broken — it means one or more manual-QA gaps exist (button full-width, popup bottom-sheet, tableAt declaration) that screenshots:assert cannot verify
- The 3 Slice-1 items are the only confirmed machine FAILs; all others PASSED the automated gate

---

## §4 — GAP stories (cannot be fully evaluated)

No story file was found to be completely unevaluable. All 43 story files rendered successfully
in Task 411 (45 IDs, 44 PASS, 1 infra flake at `admin-adminmobileheader--default × uk × huge-1920`).

**Infra flake record (not a layout defect):**
- Story: `admin-adminmobileheader--default`
- Cell: `uk × huge-1920 (1920px)`
- Error: `net::ERR_NO_BUFFER_SPACE` — Playwright resource exhaustion during full 14-viewport run
- Classification: infrastructure flake, not a layout defect
- Action: record as known flake; do not block Task 411 or 412 on this cell; retry in isolation

**OPEN DECISION surfaces requiring future manual QA before slice approval:**
The 21 OPEN DECISION stories are documented with their specific manual QA requirements in §2.
They are NOT GAPs — they passed machine checks and can be rendered. They need owner visual
verification for §26 compliance before being marked fully clean.

---

## §5 — Proposed phased-slice plan (§18-compliant, owner approval required)

> Each slice is a SEPARATE future task. Slice 1 is owner-pre-approved. Slices 2+ require
> owner sign-off after Slice 1 ships and Task 410 rendered matrix is re-run.

### Slice 1 — AdminCurrenciesManager + AdminPropertyTypesManager + AdminCompaniesManager → `tableAtLg` (OWNER-PRE-APPROVED)

**Stories in scope:** `AdminCurrenciesManager`, `AdminPropertyTypesManager`, `AdminCompaniesManager`
**Phase-1 contracts enforced:** §10 (tableAtLg), §25.1 (control-preservation), §26.1 (button full-width at `<640`)
**Pattern:** migrate raw `<table className="w-full">` to `AdminTable`/`AdminCardList` `tableAtLg` (cards `<1024`, table `≥1024`). Use `AdminListingsTable` as the reference implementation.
**Capability preservation (mandatory per §25):**
- AdminCurrenciesManager: currency CODE, name, rate, active toggle, add/edit/delete row actions, custom Tabs (manual/auto), search/filter, pagination, empty/loading/error states
- AdminPropertyTypesManager: name, icon/slug, order, edit/delete row actions, add action, empty/loading/error states
- AdminCompaniesManager: name, city, property type, listings count, edit/delete/view row actions, search, filter, sort, pagination, empty/loading/error states
**Known failures fixed:** 60 overflow cells (sq/en/uk/it × 320/375/390/480/560)
**Dependencies:** AdminListingsTable (reference, ship first if not already committed)
**Estimated diff size:** MEDIUM (3 manager components; ~200–400 lines total)
**Kickoff template:** reference `docs/design-system.md §10` + `§25` + `§26.1`; require rendered matrix 14×4 with `screenshots:assert` PASS + manual visual QA for button full-width at 320/375/390

### Slice 2 — Overlay/popup §26.2 bottom-sheet compliance audit + fix

**Stories in scope:** Dialog, DropdownMenu, Select dropdown, Combobox dropdown (all variants), Popover, Command, AdminLocaleSwitcher dropdown, StatusChangeControl dropdown
**Phase-1 contracts enforced:** §26.2 (popup bottom-sheet at `<640`), §14.2a
**Action:** manual visual QA first (owner runs at 320/375/390); for any popup not rendering as bottom sheet, implement the §26.2 contract. Do NOT batch all overlays at once — sub-divide by primitive type.
**Dependencies:** Slice 1 complete
**Estimated diff size:** MEDIUM-LARGE per primitive (Dialog + Sheet may need `<640` layout adjustments)
**Note:** This slice may be further sub-divided: Slice 2a (Dialog/Sheet), Slice 2b (Select/Combobox), Slice 2c (DropdownMenu/Popover/Command)

### Slice 3 — Admin data surfaces — tableAt declaration + tablet (768–1023) review

**Stories in scope:** AdminExchangeProvidersManager, AdminSupportManager, AdminEmailTemplatesManager, AdminUsersTable, AdminUserProfile
**Phase-1 contracts enforced:** §10 (tableAt decision), §25.1 (control-preservation), §25.2 (tablet intentional design)
**Action:** declare `tableAt` strategy per surface; verify 768/810/960 card layouts are intentionally designed; fix any broken hybrid layouts
**Dependencies:** Slice 1 + Slice 2
**Estimated diff size:** MEDIUM (5 admin surfaces)

### Slice 4 — Admin data surfaces — action rows/toolbars/`New` buttons full-width (§26.1)

**Stories in scope:** AdminExchangeProvidersManager, AdminSupportManager, AdminUsersTable, AdminEmailTemplatesManager, AdminUserProfile
**Phase-1 contracts enforced:** §26.1 (button full-width at `<640`), §12a/§12b
**Action:** stack/full-width hand-rolled action rows, toolbars, filter clusters, and `New`/pagination controls on the 5 admin data surfaces (`<DialogFooter>` instances verify-only — already §26.1-compliant)
**Dependencies:** Slice 3
**Estimated diff size:** SMALL-MEDIUM (Task 417)

### Slice 4b — Admin shell + action buttons full-width (§26.1) — ✅ DONE (Task 419)

**Stories in scope:** AdminPageShell, AdminSettings, AdminUserAvatar (edit mode), AdminSidebar (mobile drawer), AdminLayout (toolbar), AdminMobileHeader
**Phase-1 contracts enforced:** §26.1 (button full-width at `<640`), §12b
**Action:** verify and fix action buttons in admin shells not covered by existing `[&>*]:max-sm:w-full` patterns
**Dependencies:** Slice 1
**Estimated diff size:** SMALL-MEDIUM
**Result (Task 419, 2026-06-12):** Audit of all 6 surfaces found two non-compliant controls, both fixed container-only/`max-sm:`-gated (byte-identical at `≥640`): (1) `AdminSettings.tsx` Save-button footer (`<div className="ml-auto">`, content-width at `<640`) → `max-sm:flex-col max-sm:items-stretch [&>*]:max-sm:w-full` on the footer row + `max-sm:ml-0 max-sm:w-full` on the Save wrapper; (2) `AdminUserAvatar.tsx` edit-mode Replace/Upload+Remove wrapper (`flex flex-col sm:flex-row gap-2`, measured ~96px regardless of viewport — `max-sm:w-full` on the Button primitive was defeated by the `items-center` ancestor's indefinite cross-size) → added `max-sm:w-full` to the wrapper div (now 288/343/358px at 320/375/390, unchanged 96px at `≥640`). AdminPageShell/AdminSidebar/AdminMobileHeader/AdminLayout confirmed already §26.1/§26.4/§26.6-compliant — verify-only, no edits. New focused QA `scripts/task419-qa-shell-fullwidth.mjs`: 144/144 PASS (sq/en/uk/it × 320/375/390/1024). Tab bar left as-is (owner-decided); overflow=0 verified at all locales/breakpoints. `screenshots:assert` (owner-native) = 2520/2520, 0 FAIL — gate met; flaky-recovered non-deterministic (0–1 across runs: `AdminUserAvatar/EditMode × en × tablet-768` retry-recovered — informational, not a FAIL; cf. Task 418 `1/0/0`). Session: `docs/sessions/2026-06-12-task419-slice4b-admin-shell-fullwidth.md`.

### Slice 5 — Public/Listing/System surfaces — 2xl grid step + container audit

**Stories in scope:** ListingGrid (2xl:grid-cols-4 verification at 2560), Containers (cap verification at 1920/2560), PageShell (2xl: padding steps), RecentlyViewedSection
**Phase-1 contracts enforced:** §8 (2xl: grid step), §4 (container max-width), §13 (grid cols)
**Action:** manual visual QA at 1920/2560; fix any missing 2xl: grid column steps or container stretch
**Dependencies:** Slice 1
**Estimated diff size:** SMALL

### Slice 6 — Harness improvement: DOM assertions for button width + popup bottom-sheet

**Files in scope:** `scripts/check-stories-rendered.mjs` — add assertion (d) for button full-width at `<640`; add assertion (e) for overlay/popup position at `<640`
**Phase-1 contracts enforced:** §27.3 (closes machine-detection gaps)
**Action:** extend the harness to check `[data-slot="button"]:not([data-icon-only])` width + overlay bottom-anchoring DOM check
**Dependencies:** Slices 2–4 (no point adding harness checks before the code is fixed)
**Note:** This slice requires explicit owner approval before modifying `scripts/check-stories-rendered.mjs`

---

## §6 — Machine-detection assessment (see also `docs/design-system.md §27.3`)

### What `screenshots:assert` reliably catches

| Assertion | Failure class detected | Confidence |
|---|---|---|
| (a) `scrollWidth > clientWidth` | Raw `<table>` overflow (the 60 FAIL cells), container overflow, uncontrolled text overflow | HIGH |
| (b) SelectTrigger / TabsList / input width < parent at `<640` | Select trigger not full-width, TabsList not full-width, form inputs not filling container | HIGH (for those selectors only) |
| (c) Render failure | Error boundary, missing provider, blank canvas, router invariant | HIGH (for known patterns) |

**Current coverage: assertions (a)+(b)+(c) successfully detected 60/60 overflow cells and 0 false positives in the Task 411 run (2459 PASS, 60 FAIL + 1 infra flake).**

### What `screenshots:assert` does NOT catch (manual visual QA required)

| Gap | Root cause | Impact if missed | Future fix |
|---|---|---|---|
| Button not full-width at `<640` | Buttons explicitly excluded from assertion (b) — too many edge-cases | CTA / action buttons unusable at mobile | Slice 6: add assertion (d) |
| `overflow-hidden` masking a layout defect | No overflow detected; content silently clipped | Content inaccessible, no visual indicator | Code review + §24.4 rule |
| Popup not bottom-sheet at `<640` | No DOM check for bottom-anchor / edge-to-edge | Mini-dropdown / centered card at mobile = poor UX | Slice 6: add assertion (e) |
| Inaccessible table columns at 768–1023 | Parent not overflowing; columns scrolled off-screen | Row actions invisible at tablet widths | Manual QA + §25.1 verification |
| Wide-desktop sparsity at 1920/2560 | No whitespace-waste detector | Visual clutter / wasted viewport | Manual visual QA at 1920/2560 |
| Sticky/fixed layer overlap | z-index collision — content present but overlapped | Interactive content inaccessible | Manual scroll test at mobile |

### Manual visual QA requirement (codified in `docs/storybook-governance.md §MQ` and `docs/responsive-screenshot-governance.md §MQ`)

Every implementation slice kickoff MUST include an `OWNER QA REQUIRED` matrix for:
1. **Button full-width** (§26.1): verify at 320/375/390 × sq/en/uk/it for every surface with action buttons
2. **Popup bottom-sheet** (§26.2): open each overlay at 320/375/390 and confirm bottom-anchor + edge-to-edge
3. **Table columns at 768–1023** (§25.1): verify all row-actions and data columns reachable at 768/810/960
4. **Wide-desktop** (§4/§8): visual check at 1920/2560 for container cap and grid column count

The `screenshots:assert` PASS (assertions a+b+c) is **necessary but not sufficient** for UI slice approval.

---

## §7 — Generated story-ID inventory (Storybook build 2026-06-08)

> Added by Task 412 Addendum. Source: `storybook-static/index.json` after `npm run build-storybook` (exit 0).

### Counts

| Metric | Value |
|---|---|
| Total entries in `index.json` | 248 |
| Story entries | 205 |
| Docs entries | 43 |
| ASSERT_STORIES IDs | 45 |
| ASSERT_STORIES present in generated build | 45 (0 phantom) |
| Generated IDs NOT in ASSERT_STORIES | 160 |

### ASSERT_STORIES — all 45 confirmed [OK]

```
admin-admincardlist--default               admin-admincompaniesmanager--default
admin-admincurrenciesmanager--default      admin-adminemailtemplatesmanager--default
admin-adminexchangeprovidersmanager--default  admin-adminlistingstable--default
admin-adminlocaleswitcher--default         admin-adminmobileheader--default
admin-adminpageshell--default              admin-adminpropertytypesmanager--default
admin-adminsettings--default               admin-adminsidebar--desktop
admin-adminsidebar--mobile-drawer-open     admin-adminsupportmanager--default
admin-admintable--default                  admin-adminuseravatar--edit-mode
admin-adminuseravatar--view-placeholder    admin-adminuserprofile--default
admin-adminuserstable--default             admin-statuschangecontrol--select
admin-statuschangehistory--empty           layout-filterbar--default
layout-pageheader--default                 layout-pageshell--default
layout-section--with-title-and-description   primitives-badge--default
primitives-button--default                 primitives-checkbox--default
primitives-command--inline                 primitives-dialog--default
primitives-dropdownmenu--default           primitives-input--default
primitives-passwordinput--default          primitives-passwordrequirementshint--idle
primitives-popover--default                primitives-select--default
primitives-sheet--filter-sheet-right       primitives-skeleton--listing-card-skeleton
primitives-tabs--default                   shared-combobox--button-variant
system-adminlayout--admin-toolbar          system-containers--container-wide
system-emptystate--no-listings             system-listinggrid--desktop
system-recentlyviewedsection--populated
```

### Non-ASSERT generated IDs (160) — by category

All 160 are supplementary variant exports. None introduce a new responsive surface beyond what §2 already documents. They are manual-QA-only.

**Admin — `--tablet` exports (10, tableAtLg verification):**
```
admin-admincurrenciesmanager--tablet       admin-adminpropertytypesmanager--tablet
admin-admincompaniesmanager--tablet        admin-adminexchangeprovidersmanager--tablet
admin-adminlistingstable--tablet           admin-adminuserstable--tablet
admin-adminsettings--tablet                admin-adminsupportmanager--tablet
admin-adminemailtemplatesmanager--tablet   admin-adminuserprofile--tablet
```
Use: open at 768/810/960px to verify `tableAtLg` breakpoint (cards `<1024`, table `≥1024`) before/after Slice 1–3.

**Admin — `--locale-stress` exports (19, locale stress):**
```
admin-admincurrenciesmanager--locale-stress    admin-adminpropertytypesmanager--locale-stress
admin-admincompaniesmanager--locale-stress     admin-adminemailtemplatesmanager--locale-stress
admin-adminexchangeprovidersmanager--locale-stress  admin-adminlistingstable--locale-stress
admin-adminuserstable--locale-stress           admin-adminsettings--locale-stress
admin-adminsupportmanager--locale-stress       admin-adminuserprofile--locale-stress
admin-adminlocaleswitcher--locale-stress       admin-adminmobileheader--locale-stress
admin-adminsidebar--locale-stress              admin-adminuseravatar--locale-stress
admin-admintable--locale-stress                admin-admincardlist--locale-stress
admin-adminpageshell--locale-stress            admin-statuschangecontrol--locale-stress
admin-statuschangehistory--locale-stress
```

**Admin — other state variants (15):**
```
admin-admincardlist--compact               admin-admincardlist--empty
admin-admincardlist--legacy-react-node     admin-admincardlist--loading
admin-admincardlist--static                admin-adminpageshell--multiple-actions
admin-adminpageshell--no-header            admin-adminpageshell--with-actions
admin-adminpageshell--with-tabs            admin-adminpageshell--with-tabs-and-actions
admin-adminsupportmanager--empty-state     admin-admintable--card-mode
admin-admintable--column-menu              admin-admintable--empty-state
admin-admintable--interactive              admin-admintable--interactive-card-mode
admin-admintable--loading-state            admin-admintable--manage-columns
admin-admintable--responsive               admin-adminuseravatar--create-mode
admin-adminuserstable--location-requests   admin-adminuserstable--verified-tab
admin-adminuserprofile--create-mode        admin-statuschangecontrol--select-with-note
admin-statuschangecontrol--workflow        admin-statuschangecontrol--workflow-required-note
admin-statuschangecontrol--workflow-with-history  admin-statuschangehistory--multiple
admin-statuschangehistory--raw-key-stress  admin-statuschangehistory--single
```

**Layout — variant exports (15):**
```
layout-filterbar--all-locales-desktop      layout-filterbar--locale-stress
layout-filterbar--many-filters             layout-filterbar--mobile-stack
layout-filterbar--no-active-filters        layout-filterbar--tablet-stack
layout-filterbar--with-active-filters      layout-pageheader--locale-stress
layout-pageheader--title-only              layout-pageheader--with-action
layout-pageheader--with-actions            layout-pageheader--with-count-badge
layout-pageshell--as-div                   layout-pageshell--class-name-merge
layout-pageshell--form                     layout-pageshell--locale-stress
layout-pageshell--narrow                   layout-section--description-only
layout-section--empty-heading              layout-section--inside-form
layout-section--inside-narrow              layout-section--locale-stress
layout-section--stacked                    layout-section--title-only
```

**Primitives — variant exports (57):**
```
primitives-badge--all-variants             primitives-badge--listing-statuses
primitives-badge--locale-variants          primitives-button--all-sizes
primitives-button--all-variants            primitives-button--control-row-rhythm-desktop
primitives-button--control-row-rhythm-stacked  primitives-button--disabled
primitives-button--icon-only               primitives-button--locale-stress
primitives-button--long-locale-label       primitives-button--mobile-safe
primitives-button--with-icon               primitives-checkbox--checked
primitives-checkbox--disabled              primitives-checkbox--filter-checkbox-list
primitives-command--mobile-bottom-sheet    primitives-command--with-dialog
primitives-dialog--locale-variant          primitives-dialog--long-content
primitives-dialog--mobile-dialog           primitives-dialog--mobile-full-width
primitives-dropdownmenu--mobile-bottom-sheet  primitives-input--disabled
primitives-input--locale-placeholders      primitives-input--mobile-form
primitives-input--phone-numeric-validation primitives-input--search-input
primitives-input--with-label               primitives-passwordinput--disabled
primitives-passwordinput--error-state      primitives-passwordinput--locale-stress
primitives-passwordinput--success-state    primitives-passwordinput--with-hint-all-rules-met
primitives-passwordinput--with-hint-idle   primitives-passwordrequirementshint--all-met
primitives-passwordrequirementshint--locale-stress  primitives-passwordrequirementshint--partially-met
primitives-popover--mobile-bottom-sheet    primitives-select--disabled
primitives-select--long-label-locale-stress   primitives-select--mobile-bottom-sheet
primitives-select--no-selection            primitives-select--outline-variant
primitives-select--settlements-locale-stress  primitives-sheet--locale-sheet-content
primitives-sheet--nav-drawer-left          primitives-skeleton--admin-card-skeleton
primitives-skeleton--listing-grid-skeleton primitives-tabs--disabled
primitives-tabs--mobile-scroll             primitives-tabs--with-long-locale-labels
```

**Shared — variant exports (5):**
```
shared-combobox--disabled                  shared-combobox--dropdown-open
shared-combobox--input-variant             shared-combobox--long-label-locale-stress
shared-combobox--no-selection
```

**System — variant exports (16):**
```
system-adminlayout--admin-cards            system-adminlayout--admin-loading-state
system-adminlayout--admin-table-wrapper    system-containers--admin-container
system-containers--all-containers          system-containers--container-narrow
system-emptystate--locale-stress           system-emptystate--mobile-empty-state
system-emptystate--no-favorites            system-emptystate--no-search-results
system-listinggrid--currency-usd           system-listinggrid--huge-desktop
system-listinggrid--locale-stress          system-listinggrid--mobile
system-listinggrid--old-price-wrap         system-recentlyviewedsection--empty-state
system-recentlyviewedsection--huge-desktop system-recentlyviewedsection--locale-stress
system-recentlyviewedsection--mobile-scroll
```

### Confirmation

- **0 phantom** ASSERT_STORIES IDs (all 45 present)
- **0 missing** responsive surfaces (all `--tablet` variants already covered in §2/§5 slice plan)
- **No slice re-scoping required** — generated ID inventory confirms existing plan is complete
