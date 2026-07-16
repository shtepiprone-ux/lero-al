#!/usr/bin/env node
/**
 * check-stories-rendered.mjs — Playwright-based rendered assertion for Storybook.
 *
 * Captures screenshots and asserts layout correctness per story × viewport × locale.
 *
 * Assertions per cell:
 *   (a) No horizontal scrollbar / overflow: document.scrollWidth <= document.clientWidth at 320px.
 *   (b) At viewport width < 640: Select triggers, TabsList, and form inputs (NOT buttons —
 *       see (d)) have offsetWidth >= parentContentWidth - TOLERANCE.
 *   (c) Render-failure detection: FAIL if pageerror fires, a render-failure console error is
 *       logged, Storybook's error display (sb-show-errordisplay body class) is present, body text
 *       matches known error patterns, or #storybook-root has no element children (blank canvas).
 *       An error-screen PNG is NOT rendered proof and must score FAIL (Part C, Task 411).
 *   (d) At viewport width < 640: every visible [data-slot="button"]:not([data-icon-only]) text
 *       button — excluding members of [data-slot="button-group"] — has
 *       offsetWidth >= parentContentWidth - TOLERANCE. Text buttons inside open overlays
 *       (dialog/sheet/popover/dropdown/select) ARE checked (Task 421 Slice 6).
 *   (e) At viewport width < 640: every visible open overlay content slot (dialog-content,
 *       sheet-content except data-side="left", select-content, popover-content,
 *       dropdown-menu-content, navigation-menu-popup) is edge-to-edge full-width and
 *       bottom-anchored (bottom-sheet contract, design-system.md §26.2; Task 421 Slice 6).
 *   (f) HeroSearch-only, 640<=width<768-only: the 4 search-bar controls (type/location/
 *       filters/Search) are read via getBoundingClientRect().top and the Search button's top
 *       must be strictly greater than the Location field's top (Search wrapped to row 2), so
 *       the Location combobox is never crushed in that band (Task 573, persists Task 572's fix
 *       — see MANTINE_STORY_EXTRA_VIEWPORTS and docs/storybook-governance.md).
 *
 * Output:
 *   .screenshots/rendered-assert/<timestamp>/
 *     manifest.json   — machine-readable matrix (story×viewport×locale, PASS/FAIL)
 *     *.png           — screenshot per cell
 *
 * This is the ONLY accepted rendered proof for Storybook/UI tasks (docs/storybook-governance.md §14.4).
 * "OWNER QA REQUIRED / no browser access" no longer closes a UI task cell.
 *
 * Usage:
 *   npm run screenshots:assert             — full assert run (requires built Storybook)
 *   npm run screenshots:assert -- --fast  — key stories only (320/375/390 × sq/en/uk/it)
 *
 * First run — install Playwright browsers:
 *   npx playwright install chromium
 *
 * Added by Task 380 (Sprint 33 corrective, 2026-06-04).
 * See docs/storybook-governance.md §14.3 (AC5) and docs/responsive-screenshot-matrix.md.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGeometryIntegrity } from './geometry-integrity.mjs';

// Crash guards: ensure the process always exits with a controlled integer
// code, never -1 (OS kill / unhandled exception). Exit 2 = harness crash
// (distinguishable from controlled exit 1 = defects found).
process.on('uncaughtException', (err) => {
  console.error('❌ check-stories-rendered: uncaughtException — exiting with code 2');
  console.error(err);
  process.exitCode = 2;
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ check-stories-rendered: unhandledRejection — exiting with code 2');
  console.error(reason);
  process.exitCode = 2;
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FAST_MODE = args.includes('--fast');
const CHECK_ONLY = args.includes('--check');
// Task 529 — run ONLY the Mantine/Primitives/* enforced gate (Phase 0), skipping the
// pre-existing ASSERT_STORIES (Phase 1) and geometry-only (Phase 2) sweeps entirely. Useful for
// fast local iteration on the Mantine gate itself and for the anti-no-op planted-break proof —
// does not change what Phase 1/2 do or how they're invoked without this flag (no regression).
const MANTINE_ONLY = args.includes('--mantine-only');

// ── Viewport matrix ───────────────────────────────────────────────────────────

/** Mobile-critical viewports — mandatory for rendered proof (uk@320/375/390 required) */
const VIEWPORTS_MOBILE = [
  { name: 'mobile-320', width: 320,  height: 812 },
  { name: 'mobile-375', width: 375,  height: 812 },
  { name: 'mobile-390', width: 390,  height: 844 },
];

/**
 * Full assert run — canonical 14 viewports (docs/responsive-screenshot-matrix.md §1 DS-5 canon).
 * agent-contract clause 12 requires this exact set for rendered-evidence approval.
 * --fast uses VIEWPORTS_MOBILE (3 widths) for quick local dev loops.
 */
const VIEWPORTS_FULL = [
  ...VIEWPORTS_MOBILE,                                               // 320, 375, 390
  { name: 'mobile-480',    width:  480, height:  900 },
  { name: 'canonical-560', width:  560, height:  812 },
  { name: 'canonical-680', width:  680, height:  812 },
  { name: 'tablet-768',    width:  768, height: 1024 },
  { name: 'canonical-810', width:  810, height:  812 },
  { name: 'canonical-960', width:  960, height:  812 },
  { name: 'desktop-1024',  width: 1024, height:  768 },
  { name: 'canonical-1200',width: 1200, height:  812 },
  { name: 'desktop-1440',  width: 1440, height:  900 },
  { name: 'huge-1920',     width: 1920, height: 1080 },
  { name: 'huge-2560',     width: 2560, height: 1440 },
];

/** All four locales — uk is the Ukrainian long-string stress locale */
const LOCALES = ['sq', 'en', 'uk', 'it'];

/** Stories to assert — key primitives demonstrating full-width at <640 */
/** Task 383 full sweep — all 29 story files × first export each. */
const ASSERT_STORIES = [
  // ── Primitives (14) — anchored via data-slot ──
  { id: 'primitives-badge--default',              label: 'Badge/Default',              anchors: [{ type: 'slot', value: 'badge', label: 'badge' }] },
  { id: 'primitives-button--default',             label: 'Button/Default',             anchors: [{ type: 'slot', value: 'button', label: 'button' }] },
  { id: 'primitives-checkbox--default',           label: 'Checkbox/Default',           anchors: [{ type: 'slot', value: 'checkbox', label: 'checkbox' }] },
  { id: 'primitives-command--inline',             label: 'Command/Inline',             anchors: [{ type: 'slot', value: 'command', label: 'command' }] },
  { id: 'primitives-dialog--default',             label: 'Dialog/Default',             anchors: [{ type: 'slot', value: 'dialog-trigger', label: 'dialog-trigger' }] },
  { id: 'primitives-dropdownmenu--default',       label: 'DropdownMenu/Default',       anchors: [{ type: 'slot', value: 'dropdown-menu-trigger', label: 'dropdown-trigger' }] },
  { id: 'primitives-input--default',              label: 'Input/Default',              anchors: [{ type: 'slot', value: 'input', label: 'input' }] },
  { id: 'primitives-passwordinput--default',      label: 'PasswordInput/Default',      anchors: [{ type: 'slot', value: 'password-input', label: 'password-input' }] },
  { id: 'primitives-passwordrequirementshint--idle', label: 'PasswordHint/Idle',       anchors: [{ type: 'testid', value: 'password-requirements-hint', label: 'pw-hint' }] },
  { id: 'primitives-popover--default',            label: 'Popover/Default',            anchors: [{ type: 'slot', value: 'popover-trigger', label: 'popover-trigger' }] },
  { id: 'primitives-select--default',             label: 'Select/Default',             anchors: [{ type: 'slot', value: 'select-trigger', label: 'select-trigger' }] },
  { id: 'primitives-sheet--filter-sheet-right',   label: 'Sheet/FilterRight',          anchors: [{ type: 'slot', value: 'sheet-trigger', label: 'sheet-trigger' }] },
  { id: 'primitives-skeleton--listing-card-skeleton', label: 'Skeleton/ListingCard',   anchors: [{ type: 'slot', value: 'skeleton', label: 'skeleton' }] },
  { id: 'primitives-tabs--default',               label: 'Tabs/Default',               anchors: [{ type: 'slot', value: 'tabs', label: 'tabs' }] },
  // ── Shared (1) ──
  { id: 'shared-combobox--button-variant',        label: 'Combobox/ButtonVariant',     anchors: [{ type: 'testid', value: 'combobox', label: 'combobox' }] },
  // ── Admin (19) — anchored via data-testid ──
  { id: 'admin-admincardlist--default',            label: 'AdminCardList/Default',            anchors: [{ type: 'testid', value: 'admin-card-list', label: 'card-list' }] },
  { id: 'admin-adminpageshell--default',           label: 'AdminPageShell/Default',           anchors: [{ type: 'testid', value: 'admin-page-shell', label: 'page-shell' }] },
  { id: 'admin-admintable--default',               label: 'AdminTable/Default',               anchors: [{ type: 'testid', value: 'admin-table', label: 'table' }] },
  { id: 'admin-statuschangecontrol--select',       label: 'StatusChangeControl/Select',       anchors: [{ type: 'testid', value: 'status-change-control', label: 'scc' }] },
  { id: 'admin-statuschangecontrol--select-with-note', label: 'StatusChangeControl/SelectWithNote', anchors: [{ type: 'testid', value: 'status-change-control', label: 'scc' }] },
  { id: 'admin-statuschangecontrol--workflow-required-note', label: 'StatusChangeControl/WorkflowRequiredNote', anchors: [{ type: 'testid', value: 'status-change-control', label: 'scc' }] },
  { id: 'admin-statuschangehistory--empty',        label: 'StatusChangeHistory/Empty',        anchors: [{ type: 'testid', value: 'status-change-history', label: 'history' }] },
  { id: 'admin-adminlocaleswitcher--default',      label: 'AdminLocaleSwitcher/Default',      anchors: [{ type: 'testid', value: 'admin-locale-switcher', label: 'locale-sw' }] },
  { id: 'admin-adminmobileheader--default',        label: 'AdminMobileHeader/Default',        anchors: [{ type: 'testid', value: 'admin-mobile-header', label: 'mob-header' }] },
  { id: 'admin-adminuseravatar--view-placeholder', label: 'AdminUserAvatar/ViewPlaceholder',  anchors: [{ type: 'testid', value: 'admin-user-avatar', label: 'avatar' }] },
  { id: 'admin-adminuseravatar--edit-mode',        label: 'AdminUserAvatar/EditMode',         anchors: [{ type: 'testid', value: 'admin-user-avatar', label: 'avatar' }] },
  // AdminSidebar/Desktop intentionally omitted: renders `hidden lg:flex` → blank at <640.
  // Mobile coverage provided by AdminSidebar/MobileDrawerOpen below.
  { id: 'admin-adminsidebar--mobile-drawer-open',  label: 'AdminSidebar/MobileDrawerOpen',    anchors: [{ type: 'slot', value: 'sheet-content', label: 'sidebar-drawer' }] },
  { id: 'admin-adminsettings--default',            label: 'AdminSettings/Default',            anchors: [{ type: 'testid', value: 'admin-settings', label: 'settings' }] },
  { id: 'admin-admincurrenciesmanager--default',   label: 'AdminCurrenciesManager/Default',   anchors: [{ type: 'testid', value: 'admin-currencies-manager', label: 'currencies' }] },
  { id: 'admin-adminexchangeprovidersmanager--default', label: 'AdminExchangeProvidersManager/Default', anchors: [{ type: 'testid', value: 'admin-exchange-providers-manager', label: 'exchange' }] },
  { id: 'admin-adminpropertytypesmanager--default', label: 'AdminPropertyTypesManager/Default', anchors: [{ type: 'testid', value: 'admin-property-types-manager', label: 'prop-types' }] },
  { id: 'admin-admincompaniesmanager--default',    label: 'AdminCompaniesManager/Default',    anchors: [{ type: 'testid', value: 'admin-companies-manager', label: 'companies' }] },
  { id: 'admin-adminsupportmanager--default',      label: 'AdminSupportManager/Default',      anchors: [{ type: 'testid', value: 'admin-support-manager', label: 'support' }] },
  { id: 'admin-adminemailtemplatesmanager--default', label: 'AdminEmailTemplatesManager/Default', anchors: [{ type: 'testid', value: 'admin-email-templates-manager', label: 'email-tpl' }] },
  { id: 'admin-adminlistingstable--default',       label: 'AdminListingsTable/Default',       anchors: [{ type: 'testid', value: 'admin-listings-table', label: 'listings-tbl' }] },
  { id: 'admin-adminuserstable--default',          label: 'AdminUsersTable/Default',          anchors: [{ type: 'testid', value: 'admin-users-table', label: 'users-tbl' }] },
  { id: 'admin-adminuserprofile--default',         label: 'AdminUserProfile/Default',         anchors: [{ type: 'testid', value: 'admin-user-profile', label: 'user-profile' }] },
  // ── Layout (4) ──
  { id: 'layout-filterbar--default',               label: 'FilterBar/Default',                anchors: [{ type: 'testid', value: 'filter-bar', label: 'filter-bar' }] },
  { id: 'layout-pageheader--default',              label: 'PageHeader/Default',               anchors: [{ type: 'testid', value: 'page-header', label: 'page-header' }] },
  { id: 'layout-pageshell--default',               label: 'PageShell/Default',                anchors: [{ type: 'testid', value: 'page-shell', label: 'page-shell' }] },
  { id: 'layout-section--with-title-and-description', label: 'Section/WithTitleAndDesc',      anchors: [{ type: 'testid', value: 'section', label: 'section' }] },
  // ── System (5) ──
  { id: 'system-adminlayout--admin-toolbar',       label: 'AdminLayout/AdminToolbar',         anchors: [{ type: 'testid', value: 'admin-toolbar', label: 'toolbar' }] },
  { id: 'system-containers--container-wide',       label: 'Containers/Wide',                  anchors: [{ type: 'testid', value: 'container', label: 'container' }] },
  { id: 'system-emptystate--no-listings',          label: 'EmptyState/NoListings',            anchors: [{ type: 'testid', value: 'empty-state', label: 'empty-state' }] },
  { id: 'system-listinggrid--default',              label: 'ListingGrid/Default',              anchors: [{ type: 'testid', value: 'listing-grid', label: 'listing-grid' }] },
  { id: 'system-recentlyviewedsection--populated', label: 'RVS/Populated',                   anchors: [{ type: 'selector', value: '.recently-viewed', label: 'rvs' }] },
  // ── Open-state overlays (7 — Task 421 Slice 6) ──
  { id: 'primitives-dialog--mobile-full-width',    label: 'Dialog/MobileFullWidth',           anchors: [{ type: 'slot', value: 'dialog-content', label: 'dialog-content' }] },
  { id: 'primitives-select--mobile-bottom-sheet',  label: 'Select/MobileBottomSheet',         anchors: [{ type: 'slot', value: 'select-content', label: 'select-content' }] },
  { id: 'primitives-popover--mobile-bottom-sheet', label: 'Popover/MobileBottomSheet',        anchors: [{ type: 'slot', value: 'popover-content', label: 'popover-content' }] },
  { id: 'primitives-dropdownmenu--mobile-bottom-sheet', label: 'DropdownMenu/MobileBottomSheet', anchors: [{ type: 'slot', value: 'dropdown-menu-content', label: 'dropdown-content' }] },
  { id: 'primitives-command--mobile-bottom-sheet', label: 'Command/MobileBottomSheet',        anchors: [{ type: 'slot', value: 'command', label: 'command' }] },
  { id: 'primitives-sheet--mobile-bottom-sheet',   label: 'Sheet/MobileBottomSheet',          anchors: [{ type: 'slot', value: 'sheet-content', label: 'sheet-content' }] },
  { id: 'primitives-navigationmenu--mobile-open',  label: 'NavigationMenu/MobileOpen',        anchors: [{ type: 'slot', value: 'navigation-menu-popup', label: 'nav-popup' }] },
  // ── Notification (3 — Task 424) ──
  { id: 'notifications-notificationcenter--default',          label: 'NotificationCenter/Default',          anchors: [{ type: 'testid', value: 'notification-center', label: 'notif-center' }] },
  { id: 'notifications-notificationcenter--mobile-bottom-sheet', label: 'NotificationCenter/MobileBottomSheet', anchors: [{ type: 'testid', value: 'notification-center', label: 'notif-center' }] },
  { id: 'notifications-notificationcenter--empty',            label: 'NotificationCenter/Empty',            anchors: [{ type: 'testid', value: 'notification-center', label: 'notif-center' }] },
  // ── ListingDetailView (3 — Task 468 dedup: 14→3) ──
  { id: 'listings-listingdetailview--public-listing',            label: 'ListingDetailView/Public',                  anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-unpublished', label: 'ListingDetailView/StaffPreviewUnpublished', anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-published',   label: 'ListingDetailView/StaffPreviewPublished',   anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  // ── ListingFormShellView (2 — Task 238) ──
  { id: 'listings-listingformshellview--owner',    label: 'ListingFormShellView/Owner',       anchors: [{ type: 'testid', value: 'listing-form-shell-view', label: 'lfsv' }] },
  { id: 'listings-listingformshellview--staff',    label: 'ListingFormShellView/Staff',       anchors: [{ type: 'testid', value: 'listing-form-shell-view', label: 'lfsv' }] },
  // ── VerifiedPage (4 — Task 446) ──
  { id: 'auth-verifiedpage--success',              label: 'VerifiedPage/Success',             anchors: [{ type: 'testid', value: 'verified-page', label: 'verified' }] },
  { id: 'auth-verifiedpage--error-state',          label: 'VerifiedPage/ErrorState',          anchors: [{ type: 'testid', value: 'verified-page', label: 'verified' }] },
  { id: 'auth-verifiedpage--sync-fail',            label: 'VerifiedPage/SyncFail',            anchors: [{ type: 'testid', value: 'verified-page', label: 'verified' }] },
  { id: 'auth-verifiedpage--locale-stress',        label: 'VerifiedPage/LocaleStress',        anchors: [{ type: 'testid', value: 'verified-page', label: 'verified' }] },
  // ── Task 468 — AdminReportsManager canonical scenarios (5, dedup: 9→5) ──
  { id: 'admin-adminreportsmanager--default',         label: 'AdminReportsManager/Default',       anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }] },
  { id: 'admin-adminreportsmanager--dialog-owner-row', label: 'AdminReportsManager/DialogOwnerRow', anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'slot', value: 'dialog-content', label: 'dialog-open' }, { type: 'selector', value: 'a[href*="u-owner"]', label: 'owner-link' }] },
  { id: 'admin-adminreportsmanager--full-management', label: 'AdminReportsManager/FullManagement', anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'status-override-section', label: 'status-override' }] },
  { id: 'admin-adminreportsmanager--terminal-reopen', label: 'AdminReportsManager/TerminalReopen', anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'reopen-btn', label: 'reopen' }] },
  { id: 'admin-adminreportsmanager--delete-confirm',  label: 'AdminReportsManager/DeleteConfirm',  anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'delete-btn', label: 'delete' }] },
  // ── Task 464/468 — AdminPermissionsManager (1, dedup: 4→1) ──
  { id: 'admin-adminpermissionsmanager--default',     label: 'AdminPermissionsManager/Default',    anchors: [{ type: 'testid', value: 'admin-permissions-manager', label: 'perms-mgr' }, { type: 'testid', value: 'perm-row-reports_status_override', label: 'perm-status-override' }, { type: 'testid', value: 'perm-row-reports_delete', label: 'perm-delete' }] },
  // ── Planted visual violations (14 — Task 467 + R1/R2 + C2/R4 + Task 569 clip-awareness) ──
  { id: 'planted-visualviolations--clipped-button-text',  label: 'Planted/ClippedButtonText',  anchors: [{ type: 'testid', value: 'planted-clipped-btn', label: 'clipped-btn' }] },
  { id: 'planted-visualviolations--overlapping-actions',  label: 'Planted/OverlappingActions',  anchors: [{ type: 'testid', value: 'planted-overlap-a', label: 'overlap-a' }] },
  { id: 'planted-visualviolations--off-viewport-control', label: 'Planted/OffViewportControl',  anchors: [{ type: 'testid', value: 'planted-offscreen-btn', label: 'offscreen-btn' }] },
  { id: 'planted-visualviolations--container-clipped',    label: 'Planted/ContainerClipped',    anchors: [{ type: 'testid', value: 'planted-container-clip', label: 'container-clip' }] },
  { id: 'planted-visualviolations--known-good-control',   label: 'Planted/KnownGoodControl',    anchors: [{ type: 'testid', value: 'planted-good', label: 'good-ctrl' }] },
  { id: 'planted-visualviolations--ambiguous-overlap',    label: 'Planted/AmbiguousOverlap',    anchors: [{ type: 'testid', value: 'planted-ambiguous-trigger', label: 'ambig-trigger' }] },
  { id: 'planted-visualviolations--intentional-ellipsis', label: 'Planted/IntentionalEllipsis', anchors: [{ type: 'testid', value: 'planted-ellipsis-link', label: 'ellipsis-link' }] },
  { id: 'planted-visualviolations--container-escape',     label: 'Planted/ContainerEscape',     anchors: [{ type: 'testid', value: 'planted-escape-btn', label: 'escape-btn' }] },
  { id: 'planted-visualviolations--unstyled-frame',       label: 'Planted/UnstyledFrame',       anchors: [{ type: 'testid', value: 'planted-unstyled-btn', label: 'unstyled-btn' }] },
  { id: 'planted-visualviolations--sr-only-icon-button',  label: 'Planted/SrOnlyIconButton',    anchors: [{ type: 'testid', value: 'planted-sronly-btn', label: 'sronly-btn' }] },
  { id: 'planted-visualviolations--narrow-range-guard',    label: 'Planted/NarrowRangeGuard',    anchors: [{ type: 'testid', value: 'planted-narrow-range-btn', label: 'narrow-range-btn' }] },
  { id: 'planted-visualviolations--large-range-guard',     label: 'Planted/LargeRangeGuard',      anchors: [{ type: 'testid', value: 'planted-large-range-btn', label: 'wide-range-btn' }] },
  // Task 569 — clip-awareness guards. ScrollClippedOverlap: expected PASS (scrolled-away row
  // vs pinned footer no longer a false element-overlap). ScrollVisibleOverlap: expected FAIL
  // (genuine overlap of two fully-painted controls inside a scroll region — the exemption must
  // NOT widen to "anything scrollable"). Wired into ASSERT_STORIES so `--fast` asserts them at
  // 320/375/390 × sq/en/uk/it without needing the full Phase-2 global-enumeration sweep.
  { id: 'planted-visualviolations--scroll-clipped-overlap', label: 'Planted/ScrollClippedOverlap', anchors: [{ type: 'testid', value: 'planted-scroll-footer', label: 'scroll-footer' }] },
  { id: 'planted-visualviolations--scroll-visible-overlap', label: 'Planted/ScrollVisibleOverlap', anchors: [{ type: 'testid', value: 'planted-scroll-visible-a', label: 'scroll-visible-a' }] },
];

// ── Loader-allowlist: story IDs whose intended content IS a loading/skeleton state ──

const LOADER_ALLOWLIST = new Set([
  'primitives-skeleton--listing-card-skeleton',
  // Task 529 — Button/Default's story intentionally demonstrates a permanent `loading` Button
  // variant side-by-side with the others (Button.stories.tsx: "loading — Mantine loader shown,
  // height unchanged (44px)"), not a transient loading state — legitimately allowlisted, not a
  // real defect.
  'mantine-primitives-button--default',
  // Task 542 — Progress/Default renders multiple determinate `<Progress>` bars, each carrying
  // `role="progressbar"` permanently (Mantine's ProgressSection, not a transient loader) — the
  // `hasProgressbar` signal below can never resolve to `loaderPresent: false` for this story, so
  // every cell timed out `[loader-only]` even though the bar is fully rendered and static.
  // Owner manually rendered Mantine/Primitives/Progress/Default across en/uk/sq/it@320 + en/uk@375
  // + uk@480 + uk@1280 (2026-07-04) and confirmed correct §6 chrome (gray-200 track, brand fill,
  // sm/md/lg/xl heights, all determinate values incl. clamped out-of-range, long-label wrap with
  // no clip/h-scroll at 320) — see docs/storybook-governance.md §14.9.8.
  'mantine-primitives-progress--default',
  // Task 576 — LocaleSwitcher/Default stacks 3 fixtures (default/showLabel/isPending) in one
  // story; the `isPending` fixture permanently renders the trigger `disabled` with a spinner
  // (`Loader2 animate-spin`, same as `AdminLocaleSwitcher` mid-`router.refresh()`) — an
  // intentional static state demonstrated side-by-side, not a transient loading state. Same
  // class of false-positive as the Button/Progress entries above (readiness check can never
  // see `loaderPresent:false` for this story since the spinner never unmounts). Manually
  // verified via rendered screenshots at 320/375/390/1024 × sq/en/uk/it before allowlisting:
  // all 3 stacked fixtures render correctly (default trigger, showLabel trigger with full
  // language name, disabled+spinner trigger), no clip/overflow, correct §6 chrome.
  'mantine-primitives-localeswitcher--default',
]);

// ── Task 529 — Mantine primitive stories, AUTO-DISCOVERED from the built Storybook index ──
// (title prefix 'Mantine/Primitives/'), never hardcoded, so a new Mantine primitive story is
// covered automatically and this allowlist can never silently drift. This is the exact hole
// that let Task 527 ship a hard runtime crash (Textarea autosize) and two visible chrome
// mismatches (footer gap, Popover radius) undetected: `Mantine/Primitives/*` stories were not
// in ASSERT_STORIES, and Phase 2's "geometry-only" coverage (below) never opens overlays, so
// footer/radius-class defects — which only render once an overlay is OPENED — could never be
// caught by any prior mechanism (docs/sessions/2026-07-02-task528-*.md lines 108-117).
// Task 607 — extended from a single prefix to a LIST so the same enforced gate also covers
// `Patterns/Mantine/*` (13 composite patterns, e.g. `Patterns/Mantine/ListingCardPattern`),
// which was previously invisible to this gate and fell into the weaker geometry-only phase
// (no render/anchor/style assertions, no --mantine-only coverage at all). Purely prefix-derived
// — no hardcoded story-id allowlist — so a future `Patterns/Mantine/*` story is covered
// automatically, preserving the Task 529 no-drift discipline.
const MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/'];

// Task 607 — tracked known-failure registry for `Patterns/Mantine/*` stories with an
// ALREADY-FILED, REAL defect this task's coverage extension surfaced (not a gate false
// positive). `--mantine-only` is a hard-blocking CI gate (.github/workflows/governance-pr.yml)
// — allowlisting a TRUE positive here would be exactly the "ship invisibly" failure mode this
// task exists to close (the `LOADER_ALLOWLIST` precedent is for FALSE positives only and does
// NOT apply to real defects; owner decision, Task 607 review, 2026-07-15).
//
// Each entry pins the EXACT failure signature captured at the moment the defect was found and
// filed as its own dedicated follow-up task. A matching cell still fails, still prints loudly
// (see the "tracked known-failures" report section), and still shows `verdict: 'known-failure'`
// (never `'pass'`) in the manifest — it is excluded from the CI-blocking `failed` count ONLY
// when the actual failure for that story matches the pinned signature exactly (same failing-cell
// count AND the same single primary fail reason across all of them). ANY divergence — fewer
// failures (looks fixed), more failures, or a different fail reason — is NOT covered by the
// entry and reverts to a normal hard, CI-blocking failure with a loud signature-mismatch
// message, so this mechanism can never silently mask a NEW or WORSE regression.
// AdminSurfacePattern (element-overlap) and AppShellFoundation (offscreen-control) are
// DELIBERATELY NOT in this registry — Task 607 held both, pending owner pixel-review (§18.9),
// as very likely gate-heuristic false positives / open-trigger cases, NOT confirmed real
// defects. Task 611 confirmed both from the rendered pixels (Task 607 session log) and fixed
// the GATE itself (never a per-story allowlist, which is reserved for confirmed real defects
// only, same as this comment already said): AdminSurfacePattern via a generic bbox-containment
// guard in `geometry-integrity.mjs`'s element-overlap check (Check 4), AppShellFoundation via
// adding it to `MANTINE_OVERLAY_PRIMITIVES` below plus a trigger-visibility skip in
// `captureCell`'s openTrigger handling (the Burger is `hiddenFrom="sm"`, legitimately absent at
// desktop widths). Neither belongs in this registry even now — both cells genuinely PASS.
const MANTINE_PATTERN_KNOWN_FAILURES = {
  ListingDetailPattern: { followUpTask: 609, expectedFailingCells: 16, expectedFailReason: 'horizontal-overflow' },
};

// Derives the single primary fail reason for a cell — the first `visualIntegrity` violation's
// `failReason` if any were recorded, else the synthetic `'horizontal-overflow'` when the plain
// `noHorizontalOverflow` boolean assertion tripped with no other geometry violation, else the
// DOM render-check's own `failReason`, else `'unknown'`. Used only to compare against the
// `MANTINE_PATTERN_KNOWN_FAILURES` registry above — never affects a cell's own verdict directly.
function getPrimaryFailReason(cell) {
  if (cell.assertions?.visualIntegrity?.violations?.length > 0) {
    return cell.assertions.visualIntegrity.violations[0].failReason;
  }
  if (cell.assertions?.noHorizontalOverflow === false) return 'horizontal-overflow';
  if (cell.assertions?.renderCheck?.failReason) return cell.assertions.renderCheck.failReason;
  return 'unknown';
}

// Overlay primitives whose defect class (footer gap, radius, crash-on-open) only manifests
// once OPENED — asserted via a scripted trigger click before the render/anchor/style/geometry
// checks run, so ALL of those checks assess the OPENED DOM (see captureCell's openTrigger
// handling). Matched against the story title's last path segment (component name). Reuses the
// exact click-then-assert approach Task 528's throwaway script used (see its session log).
const MANTINE_OVERLAY_PRIMITIVES = new Set([
  'Modal', 'Drawer', 'Popover', 'DropdownMenu', 'NavigationMenu', 'Select', 'Tooltip', 'Combobox',
  'NotificationBellView',
  // Task 607 — `Patterns/Mantine/DialogDrawerPattern` is a real controlled overlay
  // (`useDisclosure(false)` + a closed-trigger `<Button onClick={open}>`), the exact same
  // lifecycle as Modal/Drawer above — click the trigger, the overlay opens and stays open,
  // then assert. Reuses the proven click-then-assert path with zero new heuristic (owner
  // decision at the Task 607 kickoff). `NotificationPattern` was explicitly NOT added here —
  // its trigger calls the imperative `notifications.show()` API (an auto-dismissing toast
  // portal, not a controlled overlay bound to the trigger), which is a different mechanism
  // and a flaky-assert risk; deferred to a dedicated follow-up.
  'DialogDrawerPattern',
  // Task 611 — `Patterns/Mantine/AppShellFoundation` is mechanically identical to
  // DialogDrawerPattern above: `useDisclosure()` defaults CLOSED, and the navbar is
  // `collapsed:{mobile:!opened}` (off-canvas at <640 until the Burger is tapped). Owner
  // adjudication (Task 607 review, personally viewed the rendered pixels, 2026-07-15) found
  // the 12 mobile `offscreen-control` fails were an open-trigger gap, not a real defect —
  // same click-then-assert path, zero new heuristic. Unlike DialogDrawerPattern's trigger
  // (a plain always-rendered `<Button>`), the Burger is `hiddenFrom="sm"` (CSS `display:none`
  // at >=640px) — see the trigger-visibility skip in captureCell's openTrigger handling below,
  // added specifically because this component's trigger is legitimately absent at desktop
  // widths where the navbar is already open by default.
  'AppShellFoundation',
]);

// Minimum enforced viewport set for the Mantine-primitives gate (agent-contract clause 12
// stress cells): the 3 mandatory mobile stress widths + one desktop width. Deliberately NOT
// the full 14-viewport VIEWPORTS_FULL sweep — kept small enough that this phase can run
// UNCONDITIONALLY (including under --fast), so the gate this task exists to add is never the
// thing that gets skipped for speed. A full 14-viewport sweep remains available via the
// existing Phase 1/2 mechanisms for any story explicitly added to ASSERT_STORIES.
const MANTINE_VIEWPORTS = [
  { name: 'mobile-320',   width:  320, height:  812 },
  { name: 'mobile-375',   width:  375, height:  812 },
  { name: 'mobile-390',   width:  390, height:  844 },
  { name: 'desktop-1024', width: 1024, height:  768 },
];

// ── Task 573 — per-story extra viewport for the Mantine gate (surgical, NOT global) ──
// Keyed by the SAME `componentName` discoverMantinePrimitiveStories() derives from the story
// title suffix — never a hardcoded story id (matches this file's existing no-hardcode
// discipline, see the Task 529 doc note above `MANTINE_STORY_TITLE_PREFIXES`). For each
// discovered Mantine story, the effective viewport list is `MANTINE_VIEWPORTS` concatenated
// with `MANTINE_STORY_EXTRA_VIEWPORTS[componentName] ?? []` — only the named component(s) gain
// extra cells; every other Mantine primitive story is byte-identical (still exactly
// 320/375/390/1024 × 4 locales).
//
// Why HeroSearch needs this: Task 572 fixed HeroSearch's Search button wrapping to its own row
// in the 640–767px band so the Location combobox isn't crushed illegible (~720px). The standing
// MANTINE_VIEWPORTS sample (320/375/390/1024) never lands inside that band, so Task 572's ONLY
// rendered proof was a one-off, non-persisted Playwright script (see
// docs/critical-flow-registry.md row 49) — a future edit that silently drops `sm:basis-full`
// from the Search button would pass every standing gate. `band-700` persists that coverage.
// Do NOT add 700 to `MANTINE_VIEWPORTS` itself — that would inject an unvetted width into every
// other Mantine primitive story (~37 of them), risking new AMBIGUOUS/FAIL noise unrelated to
// HeroSearch and slowing every run.
const MANTINE_STORY_EXTRA_VIEWPORTS = {
  HeroSearch: [{ name: 'band-700', width: 700, height: 812 }],
};

/**
 * Reads the already-parsed Storybook index and returns every story whose title starts with ANY
 * of `MANTINE_STORY_TITLE_PREFIXES` (`Mantine/Primitives/*` and, since Task 607,
 * `Patterns/Mantine/*`), flagging the ones that need a scripted open-trigger click. Never
 * hardcodes story IDs — a future story under either prefix is covered automatically.
 */
function discoverMantinePrimitiveStories(indexData) {
  return Object.values(indexData.entries)
    .filter((e) => e.type === 'story' && MANTINE_STORY_TITLE_PREFIXES.some(p => (e.title ?? '').startsWith(p)))
    .map((e) => {
      const matchedPrefix = MANTINE_STORY_TITLE_PREFIXES.find(p => e.title.startsWith(p));
      const componentName = e.title.slice(matchedPrefix.length);
      return {
        id: e.id,
        label: `${e.title}/${e.name}`,
        anchors: [],
        mantineGate: true,
        openTrigger: MANTINE_OVERLAY_PRIMITIVES.has(componentName),
        // Task 573 — carried through so captureCell can gate the HeroSearch-only in-band
        // row-structure assertion off the SAME discovered name (never a hardcoded story id).
        componentName,
      };
    });
}

// ── Tolerance for full-width assertion (px) ────────────────────────────────────

const FULL_WIDTH_TOLERANCE = 8; // allow up to 8px less than container width

// ── MIME types for static server ──────────────────────────────────────────────

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

function startStaticServer(staticDir, port) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') err.portInUse = true;
      reject(err);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

// ── Stable-serve readiness ping (Task 418, item 3) ────────────────────────────
// Confirms the harness's own static server is actually serving chunks before
// the run starts. Does NOT touch any process other than the one this script
// itself spawned via startStaticServer.
// P2-b (Task 418 REWORK, acknowledged debt): only pings /iframe.html, not a
// specific JS chunk — a static server that serves HTML serves its sibling
// assets, so this is acceptable but does not assert any one chunk returns 200.
async function waitForServerReady(baseUrl, retries = 20, delayMs = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${baseUrl}/iframe.html`);
      if (res.ok) return;
    } catch {
      // server not up yet — keep polling
    }
    await sleep(delayMs);
  }
  throw new Error(`Static server at ${baseUrl} did not become ready after ${retries} readiness pings (iframe.html not served)`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Readiness wait before capture (Task 418, item 2) ──────────────────────────
// Waits for the story root to actually be rendered (#storybook-root non-empty
// with a non-zero bounding box) OR for Storybook's error display to be shown,
// before assessing/capturing the cell. Bounded timeout: on timeout the cell is
// captured and assessed normally (and may FAIL).
// P2-a (Task 418 REWORK, acknowledged debt): readiness is a non-empty
// #storybook-root with a non-zero bounding box (or the error display), not a
// Storybook `storyRendered` event or a non-uniform-pixel check — acceptable
// per the original kickoff's "e.g. non-empty bbox" wording.
async function waitForStoryReady(page, storyId, timeoutMs = 15000, pollMs = 200) {
  const isLoaderAllowlisted = LOADER_ALLOWLIST.has(storyId);
  const start = Date.now();
  for (;;) {
    const state = await page.evaluate((allowlisted) => {
      if (document.body.classList.contains('sb-show-errordisplay')) return { ready: true, loaderPresent: false };
      const root = document.querySelector('#storybook-root');
      if (!root || root.children.length === 0) return { ready: false, loaderPresent: false };
      const rect = root.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return { ready: false, loaderPresent: false };

      // Robust loader-presence check
      const hasSpinner = root.querySelector('.animate-spin') !== null;
      const hasSkeleton = root.querySelector('[data-slot="skeleton"]') !== null;
      const hasProgressbar = root.querySelector('[role="progressbar"]') !== null;
      const hasAriaBusy = root.querySelector('[aria-busy="true"]') !== null;
      const hasDataLoading = root.querySelector('[data-loading="true"]') !== null;
      const textOnly = (root.textContent ?? '').trim();
      const hasLoadingText = /^\s*(loading|Загрузка|Завантаження|po ngarkohet|caricamento)\s*$/i.test(textOnly);
      const loaderPresent = hasSpinner || hasSkeleton || hasProgressbar || hasAriaBusy || hasDataLoading || hasLoadingText;

      if (loaderPresent && !allowlisted) return { ready: false, loaderPresent: true };
      return { ready: true, loaderPresent };
    }, isLoaderAllowlisted);
    if (state.ready) return { loaderPresent: state.loaderPresent, timedOut: false };
    if (Date.now() - start >= timeoutMs) return { loaderPresent: state.loaderPresent, timedOut: true };
    await page.waitForTimeout(pollMs);
  }
}

// ── Transient-failure classification (Task 418, item 1) ───────────────────────
// A cell is retried ONLY when it failed for a transient blank-canvas / chunk-load
// reason AND there is no pageError, no consoleError, and no overflow/full-width
// defect. Real defects (overflow, render errors, full-width violations) are
// never retried into a false pass.
const TRANSIENT_FETCH_PATTERN = /Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk/i;
const TRANSIENT_NETWORK_PATTERN = /ERR_NO_BUFFER_SPACE|net::ERR_/i;

const HARD_FAIL_REASONS = new Set([
  'loader-only', 'blank-canvas', 'empty-canvas', 'blank-screenshot', 'anchor-missing',
  'text-clipped', 'offscreen-control', 'outside-container',
  'element-overlap', 'bottomsheet-overflow', 'unstyled-render',
  // self-clipped: DEFERRED (F-H) — documented but not implemented in geometry-integrity.mjs;
  // counter kept in summary for future implementation, structurally 0 until then.
]);

// ── Geometry allowlist: intentional overlaps / escapes (Task 467) ─────────
// Each entry: { storyId, selector?, reason }. Matching violations are suppressed.
const GEOMETRY_ALLOWLIST = [
  // Badge-on-avatar, drag-handle overlaps, etc. — add with documented reason.
  // Task 529 — Mantine PasswordInput's reveal-toggle button is INTENTIONALLY positioned inside
  // the input's own bounding box (the standard "eye icon inside the field" pattern); the
  // geometry checker's element-overlap heuristic doesn't know this is by design. No `selector`
  // (Mantine's `mantine-XXXXX` element IDs are random per render — see geometry-integrity.mjs
  // doc note) — failReason-only entry, scoped to this one story.
  { storyId: 'mantine-primitives-passwordinput--default', failReason: 'element-overlap', reason: 'reveal-toggle button is intentionally overlaid inside the input box (eye-icon-in-field pattern), not a layout defect' },
  // Task 561 — RangeDatePicker's trigger clear-X `ActionIcon` is the SAME "icon overlaid inside
  // the input box" pattern as PasswordInput's reveal-toggle above (rendered via the readOnly
  // TextInput's `rightSection`, Mantine's standard icon-in-field mechanism) — the geometry
  // checker's heuristic flags the input's own (empty-`textContent`, since `<input>` elements never
  // have child text nodes) bounding box as "overlapping" its rightSection button, which is
  // expected containment, not a defect. Visually confirmed clean via a targeted Playwright probe
  // (desktop 1024 + mobile 320 uk/sq/en, see the Task 561 session log's Rendered evidence): the
  // clear-X sits with a clear visible gap from the date text/placeholder, never touching or
  // occluding it (§18.9 iron rule) — the SAME rendered proof PasswordInput's exemption above relied on.
  { storyId: 'mantine-primitives-rangedatepicker--default', failReason: 'element-overlap', reason: 'trigger clear-X ActionIcon is intentionally overlaid inside the input box (icon-in-field pattern, same as PasswordInput above), not a layout defect' },
  // Task 529 — Tabs/Default's tab bar is an intentional horizontal-scroll ("swipe on overflow",
  // per the story's own label) container at narrow viewports — a tab clipped at the visible
  // edge is reachable by scrolling, not a real text-clip defect. Matches the project's
  // established swipe-scroll tab-bar convention (ScrollArea, ADR: Tabs/SegmentedControl always
  // single row).
  { storyId: 'mantine-primitives-tabs--default', failReason: 'text-clipped', reason: 'intentional horizontal swipe-scroll tab bar — clipped tab is reachable by scrolling, not a layout defect' },
  // Task 567 round-2's `mantine-primitives-filterspanelshell--default` / `element-overlap` entry
  // was REMOVED by Task 569 (2026-07-10): Check 4 in `geometry-integrity.mjs` is now clip-aware
  // (the same `overflow:auto|hidden|scroll` ancestor-intersection Check 3/outside-container
  // already had), so `FiltersPanelShell`'s pinned-footer + tall-scroll-content pattern now passes
  // 16/16 without an allowlist exemption — see `docs/storybook-governance.md` § geometry checks
  // and the Task 569 session log for the before/after proof.
];

// ── Viewport range per story (V1-FINAL FP-CLASSES B/C) ──────────────────
// Stories that only render meaningful content within a specific viewport range.
// Outside this range, blank-screenshot / geometry failures are viewport-mismatch
// (not product defects) and are routed to a separate inventory section.
const STORY_VIEWPORT_RANGE = {
  'admin-adminmobileheader--default': { maxWidth: 960 },
  'admin-adminsidebar--mobile-drawer-open': { maxWidth: 960 },
  'admin-adminsidebar--collapsed-rail': { minWidth: 1024 },
  'planted-visualviolations--narrow-range-guard': { maxWidth: 960 },
  'planted-visualviolations--large-range-guard': { minWidth: 1024 },
};

function isOutOfViewportRange(cell) {
  const range = STORY_VIEWPORT_RANGE[cell.storyId];
  if (!range) return false;
  if (range.maxWidth && cell.width > range.maxWidth) return true;
  if (range.minWidth && cell.width < range.minWidth) return true;
  return false;
}

function isTransientFailure(cell) {
  if (cell.pass !== false) return false;

  // B8: after MAX_ATTEMPTS exhausted, the cell is marked hard — never transient
  if (cell.hardAfterRetries) return false;

  // Hard navigation/network error from the harness's own server — retry rather
  // than emitting a false FAIL (item 3).
  if (cell.error) {
    return TRANSIENT_NETWORK_PATTERN.test(cell.error) || TRANSIENT_FETCH_PATTERN.test(cell.error);
  }

  const rc = cell.assertions?.renderCheck;
  if (!rc) return false;

  // AC14: new hard-fail reasons are NEVER transient — real defects, never retried into a pass.
  if (HARD_FAIL_REASONS.has(rc.failReason)) return false;

  if ((rc.pageErrors?.length ?? 0) > 0) return false;
  if ((rc.consoleErrors?.length ?? 0) > 0) return false;
  if (cell.assertions.noHorizontalOverflow === false) return false;
  if (cell.assertions.fullWidthControlsAtMobile === false) return false;
  if (cell.assertions.fullWidthButtonsAtMobile === false) return false;
  if (cell.assertions.popupBottomSheetAtMobile === false) return false;
  if (cell.assertions.visualIntegrity?.pass === false) return false;
  // Task 573 — HeroSearch in-band row-structure regression is a real, non-transient layout
  // defect (mirrors fullWidthControlsAtMobile above); never retried into a false pass.
  if (cell.assertions.heroSearchWrapInBand === false) return false;

  if (rc.failReason === 'blank-canvas') return true;
  if (rc.failReason === 'sb-show-errordisplay' && TRANSIENT_FETCH_PATTERN.test(rc.failDetail || '')) return true;

  // Style-not-ready is transient during the retry loop (R4): re-navigate may
  // load stylesheets. After MAX_ATTEMPTS the loop breaks and the cell stays
  // failed with 'unstyled-render' (hard capture failure, never cited as proof).
  if (cell.assertions.styleIntegrity?.pass === false) return true;

  return false;
}

// ── Bitmap sanity check (Task 464, item 7) ───────────────────────────────────
// Uses sharp to detect blank/near-uniform screenshots. Returns a verdict +
// metrics so the manifest is self-describing.
// When domRenderPassed=true, the DOM check already confirmed visible content
// exists (text, images, data-slot controls, portal content). In that case,
// near-uniform bitmaps at large viewports (e.g. a tiny badge on a 2560px
// canvas) are expected — not blank. Only truly degenerate captures (zero
// variance, all one colour) still fail.

async function assertScreenshotHasMeaningfulPixels(screenshotPath, { domRenderPassed = false } = {}) {
  const result = { pass: true, failReason: null, failDetail: '', metrics: { width: 0, height: 0, nonBackgroundRatio: 0, variance: 0 } };
  try {
    const { default: sharp } = await import('sharp');
    const img = sharp(screenshotPath);
    const metadata = await img.metadata();
    if (!metadata.width || !metadata.height) {
      return { pass: false, failReason: 'blank-screenshot', failDetail: 'invalid dimensions', metrics: result.metrics };
    }
    result.metrics.width = metadata.width;
    result.metrics.height = metadata.height;

    // Sample raw pixels (resize to 100px wide for speed)
    const sampleWidth = Math.min(100, metadata.width);
    const sampleHeight = Math.round(sampleWidth * metadata.height / metadata.width);
    const { data, info } = await img.resize(sampleWidth, sampleHeight).raw().toBuffer({ resolveWithObject: true });
    const channels = info.channels;
    const pixelCount = info.width * info.height;

    // Compute dominant colour (most frequent pixel, sampled)
    const colourCounts = new Map();
    for (let i = 0; i < data.length; i += channels) {
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      colourCounts.set(key, (colourCounts.get(key) ?? 0) + 1);
    }
    let dominantKey = '';
    let dominantCount = 0;
    for (const [k, v] of colourCounts) {
      if (v > dominantCount) { dominantKey = k; dominantCount = v; }
    }

    const backgroundRatio = dominantCount / pixelCount;
    const nonBackgroundRatio = 1 - backgroundRatio;
    result.metrics.nonBackgroundRatio = Math.round(nonBackgroundRatio * 10000) / 10000;

    // Compute luma variance
    let sumLuma = 0;
    let sumLumaSq = 0;
    for (let i = 0; i < data.length; i += channels) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sumLuma += luma;
      sumLumaSq += luma * luma;
    }
    const meanLuma = sumLuma / pixelCount;
    const variance = (sumLumaSq / pixelCount) - (meanLuma * meanLuma);
    result.metrics.variance = Math.round(variance * 100) / 100;

    // When DOM render check already confirmed visible content, near-uniform
    // bitmaps are expected at large viewports (tiny badge on 2560px canvas,
    // closed sheet, small popover). Only truly degenerate bitmaps (zero
    // variance = literally one flat colour, no content at all) still fail.
    if (domRenderPassed) {
      if (variance === 0 && nonBackgroundRatio === 0) {
        return { pass: false, failReason: 'blank-screenshot', failDetail: `dom-passed but zero-variance single-colour (bg=${(backgroundRatio * 100).toFixed(1)}%, var=${variance.toFixed(1)})`, metrics: result.metrics };
      }
      return result;
    }

    // No DOM confirmation — use strict thresholds (self-test path, early failures)
    if (nonBackgroundRatio < 0.005 && variance < 10) {
      return { pass: false, failReason: 'blank-screenshot', failDetail: `near-uniform (bg=${(backgroundRatio * 100).toFixed(1)}%, var=${variance.toFixed(1)})`, metrics: result.metrics };
    }
    if (backgroundRatio > 0.995 && variance < 5) {
      return { pass: false, failReason: 'blank-screenshot', failDetail: `flat-colour (bg=${(backgroundRatio * 100).toFixed(1)}%, var=${variance.toFixed(1)})`, metrics: result.metrics };
    }

    return result;
  } catch (err) {
    return { pass: false, failReason: 'blank-screenshot', failDetail: `parse error: ${err.message}`, metrics: result.metrics };
  }
}

// ── Anchor assertion (Task 464, item 4) ──────────────────────────────────────
// Checks that each declared anchor is present and visible in the rendered DOM.

async function assertAnchors(page, anchors) {
  const expected = anchors.map(a => a.label);
  const found = [];
  for (const anchor of anchors) {
    let selector;
    if (anchor.type === 'testid') selector = `[data-testid="${anchor.value}"]`;
    else if (anchor.type === 'slot') selector = `[data-slot="${anchor.value}"]`;
    else if (anchor.type === 'role') selector = `[role="${anchor.value}"]`;
    else if (anchor.type === 'selector') selector = anchor.value;
    else continue;

    const visible = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, selector);

    if (visible) found.push(anchor.label);
  }
  return { expected, found, pass: found.length === expected.length };
}

// ── Check mode ────────────────────────────────────────────────────────────────

async function runCheck() {
  let ok = true;
  try {
    await import('playwright');
    console.log('✅ playwright package installed');
  } catch {
    console.error('❌ playwright not found — run: npm install');
    ok = false;
  }
  if (existsSync(join(ROOT, '.storybook', 'main.ts'))) {
    console.log('✅ .storybook/main.ts present');
  } else {
    console.error('❌ .storybook/main.ts missing');
    ok = false;
  }
  if (!ok) process.exit(1);
  console.log('\n✅ check-stories-rendered setup OK.');
  console.log('   Build Storybook first: npm run build-storybook');
  console.log('   Then run: npm run screenshots:assert');
}

// ── Single-cell capture (one attempt) ─────────────────────────────────────────
// Navigates, waits for readiness, runs all assertions, and screenshots a single
// story × locale × viewport cell. Returns the cell result; the caller decides
// whether to retry based on isTransientFailure().
async function captureCell(browser, storyUrl, story, locale, viewport, filename, screenshotPath) {
  const cell = {
    story:    story.label,
    storyId:  story.id,
    locale,
    viewport: viewport.name,
    width:    viewport.width,
    screenshot: filename,
    assertions: {},
    anchorsExpected: (story.anchors ?? []).map(a => a.label),
    anchorsFound: [],
    visualContentCheck: { pass: true, metrics: { width: 0, height: 0, nonBackgroundRatio: 0, variance: 0 } },
    pass: null,
    error: null,
  };

  let page;
  try {
    page = await browser.newPage();

    // ── Render-failure signal collectors (attached before goto) ────
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message.slice(0, 200)); });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (
          /invariant expected app router/i.test(t) ||
          /The above error occurred in the/i.test(t) ||
          /Error rendering story/i.test(t) ||
          /Uncaught \[Error:/i.test(t)
        ) consoleErrors.push(t.slice(0, 200));
      }
    });

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(400);

    // ════════════════════════════════════════════════════════════════
    // LAYER 1: Rendered-proof — real story content is present
    // ════════════════════════════════════════════════════════════════

    // ── 1a. Readiness wait (reworked Task 464) ──
    const readiness = await waitForStoryReady(page, story.id);

    // ── 1b. Loader-only hard fail ──
    if (readiness.timedOut && readiness.loaderPresent && !LOADER_ALLOWLIST.has(story.id)) {
      cell.assertions.renderCheck = {
        pageErrors: [], consoleErrors: [], domFailed: true,
        failReason: 'loader-only',
        failDetail: 'spinner/loader still present at readiness timeout',
      };
      cell.pass = false;
      cell.verdict = 'fail';
      await page.screenshot({ path: screenshotPath, fullPage: false });
      cell.visualContentCheck = await assertScreenshotHasMeaningfulPixels(screenshotPath);
      return cell;
    }

    // ── 1b2. Open-trigger click (Task 529) — for overlay primitives (story.openTrigger),
    // click the trigger BEFORE every check below so render-failure, anchor, style, and
    // geometry checks all assess the OPENED DOM, not just the closed trigger. This is what
    // actually catches footer-gap/radius/crash-on-open defects — reuses the existing
    // detection pipeline verbatim (no duplicated checks), just changes what DOM state it
    // runs against. A failed/timed-out click is a hard FAILURE for the cell, never a skip.
    // Selector covers BOTH trigger shapes seen across the 7 overlay primitives: a real
    // `<button>` (Modal/Drawer/Popover/DropdownMenu/NavigationMenu/Tooltip's ActionIcon
    // trigger) and Mantine Select's combobox trigger, which renders as a plain `<input>`
    // (no `<button>`, no `role="combobox"` in this Mantine version — confirmed via DOM
    // inspection, not assumed). `.first()` in DOM order picks the story's first trigger. ──
    if (story.openTrigger) {
      const trigger = page.locator('#storybook-root button, #storybook-root input').first();
      // Task 611 — a trigger can legitimately be ABSENT at a given viewport (e.g.
      // AppShellFoundation's Burger is `hiddenFrom="sm"`, CSS `display:none` at >=640px,
      // because the navbar it opens is already shown by default there — nothing to open).
      // `isVisible()` is a synchronous DOM check, no wait: distinguishes "not clickable
      // because responsive-hidden" from "not clickable because broken". Only a VISIBLE
      // trigger that still fails to click is a real hard failure — every existing overlay
      // primitive's trigger (Modal/Drawer/Popover/Select/DropdownMenu/NavigationMenu/Tooltip/
      // Combobox/NotificationBellView/DialogDrawerPattern) is a plain always-rendered
      // `<Button>`, so this is visible (and thus clicked, exactly as before) at every
      // viewport — this change is a no-op for all of them. Skipping the click here is NOT a
      // skip of the cell's checks: render/anchor/style/geometry assertions below still run
      // against the current DOM, so a genuinely broken/empty render still fails.
      const triggerVisible = (await trigger.count()) > 0 && await trigger.isVisible();
      if (triggerVisible) {
        try {
          await trigger.click({ timeout: 5000 });
          await page.waitForTimeout(500);
        } catch (err) {
          cell.assertions.renderCheck = {
            pageErrors: [], consoleErrors: [], domFailed: true,
            failReason: 'open-trigger-click-failed',
            failDetail: String(err?.message ?? err).slice(0, 200),
          };
          cell.pass = false;
          cell.verdict = 'fail';
          try {
            await page.screenshot({ path: screenshotPath, fullPage: false });
            cell.visualContentCheck = await assertScreenshotHasMeaningfulPixels(screenshotPath);
          } catch { /* best-effort screenshot on click failure */ }
          return cell;
        }
      }
    }

    // ── 1c. DOM render-failure detection (assertion c) ──
    const renderResult = await page.evaluate(() => {
      if (document.body.classList.contains('sb-show-errordisplay')) {
        const errEl = document.querySelector('#error-message') || document.body;
        return { failed: true, reason: 'sb-show-errordisplay',
          detail: (errEl.textContent ?? '').slice(0, 200) };
      }
      const bodyText = document.body?.innerText ?? '';
      if (/invariant expected app router to be mounted/i.test(bodyText))
        return { failed: true, reason: 'app-router-missing', detail: bodyText.slice(0, 200) };
      if (/The component failed to render properly/i.test(bodyText))
        return { failed: true, reason: 'react-render-error', detail: bodyText.slice(0, 200) };
      if (/Missing.*[Cc]ontext|Missing.*[Pp]roviders?/i.test(bodyText))
        return { failed: true, reason: 'missing-context', detail: bodyText.slice(0, 200) };
      if (/Couldn't find story matching/i.test(bodyText))
        return { failed: true, reason: 'story-not-found', detail: bodyText.slice(0, 200) };
      if (/Error rendering story/i.test(bodyText))
        return { failed: true, reason: 'render-error', detail: bodyText.slice(0, 200) };
      const root = document.querySelector('#storybook-root');
      if (!root || root.children.length === 0)
        return { failed: true, reason: 'blank-canvas', detail: '' };
      // Empty-canvas: root has children but no visible text/content.
      // Also check for portal content (dialog/sheet/popover rendered outside #storybook-root).
      const hasVisibleContent = (root.textContent ?? '').trim().length > 0 ||
        root.querySelectorAll('img, svg, canvas, video, table, [data-slot]').length > 0;
      const hasPortalContent = document.querySelectorAll(
        '[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="select-content"], [data-slot="popover-content"], [data-slot="dropdown-menu-content"], [data-slot="navigation-menu-popup"]'
      ).length > 0;
      if (!hasVisibleContent && !hasPortalContent)
        return { failed: true, reason: 'empty-canvas', detail: 'DOM present but no visible content' };
      return { failed: false, reason: null, detail: '' };
    });

    const renderFailed = renderResult.failed || pageErrors.length > 0 || consoleErrors.length > 0;
    cell.assertions.renderCheck = {
      pageErrors:    pageErrors.slice(0, 2),
      consoleErrors: consoleErrors.slice(0, 2),
      domFailed:     renderResult.failed,
      failReason:    renderResult.failed
        ? renderResult.reason
        : (pageErrors.length > 0 ? 'pageerror' : (consoleErrors.length > 0 ? 'console-error' : null)),
      failDetail:    renderResult.detail || pageErrors[0] || consoleErrors[0] || '',
    };

    // Take the screenshot for bitmap analysis (needed even if render failed)
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // ── 1d. Bitmap sanity check ──
    cell.visualContentCheck = await assertScreenshotHasMeaningfulPixels(screenshotPath, { domRenderPassed: !renderResult.failed });
    if (!cell.visualContentCheck.pass) {
      cell.assertions.renderCheck.failReason = cell.assertions.renderCheck.failReason ?? cell.visualContentCheck.failReason;
      cell.assertions.renderCheck.failDetail = cell.assertions.renderCheck.failDetail || cell.visualContentCheck.failDetail;
      cell.pass = false;
      cell.verdict = 'fail';
      return cell;
    }

    // Short-circuit: if DOM render-check already failed, skip anchors + visual gates
    if (renderFailed) {
      cell.pass = false;
      cell.verdict = 'fail';
      return cell;
    }

    // ── 1e. Anchor assertion ──
    if (story.anchors && story.anchors.length > 0) {
      const anchorResult = await assertAnchors(page, story.anchors);
      cell.anchorsFound = anchorResult.found;
      if (!anchorResult.pass) {
        const missing = anchorResult.expected.filter(l => !anchorResult.found.includes(l));
        cell.assertions.renderCheck = {
          ...cell.assertions.renderCheck,
          failReason: 'anchor-missing',
          failDetail: `missing: ${missing.join(', ')}`,
        };
        cell.pass = false;
        cell.verdict = 'fail';
        return cell;
      }
    } else if (!LOADER_ALLOWLIST.has(story.id) && !story.geometryOnly && !story.mantineGate) {
      // No anchors declared for a non-allowlisted, non-geometry-only story = config error
      cell.assertions.renderCheck = {
        ...cell.assertions.renderCheck,
        failReason: 'anchor-missing',
        failDetail: 'no anchors declared (config error)',
      };
      cell.pass = false;
      cell.verdict = 'fail';
      return cell;
    }

    // ════════════════════════════════════════════════════════════════
    // STYLE INTEGRITY: CSS/design-system styles applied (Task 467 R4)
    // Detects unstyled/raw-UA frames via deterministic DOM signals.
    // Runs BEFORE Layer 2/3 — measurements on unstyled content are meaningless.
    // ════════════════════════════════════════════════════════════════
    const styleSignals = await page.evaluate(() => {
      const signals = {};
      // 1. Preflight applied (Tailwind zeroes body margin; UA default is 8px)
      signals.bodyMargin = getComputedStyle(document.body).margin;
      const preflightOk = signals.bodyMargin === '0px';

      // 2. Stylesheets loaded with rules
      let sheetsWithRules = false;
      try {
        for (const sheet of document.styleSheets) {
          try { if (sheet.cssRules && sheet.cssRules.length > 0) { sheetsWithRules = true; break; } }
          catch { /* CORS cross-origin sheet */ }
        }
      } catch { /* empty */ }
      signals.sheetsWithRules = sheetsWithRules;

      // 3. Font not UA-serif default
      const root = document.querySelector('#storybook-root');
      let fontFamily = '';
      if (root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let textNode = walker.nextNode();
        while (textNode) {
          if ((textNode.textContent ?? '').trim().length > 0 && textNode.parentElement) {
            fontFamily = getComputedStyle(textNode.parentElement).fontFamily;
            break;
          }
          textNode = walker.nextNode();
        }
      }
      signals.fontFamily = fontFamily;
      // F-serif: detect both "Times New Roman" and bare generic `serif` as UA-default
      const fontOk = !/^("?Times New Roman"?|serif)$/i.test(fontFamily.split(',')[0]?.trim() ?? '');

      // 4. DS control themed (tri-state: true / false / 'not-applicable')
      const dsCtrl = document.querySelector('[data-slot="button"]');
      let controlThemed = 'not-applicable';
      if (dsCtrl) {
        const cs = getComputedStyle(dsCtrl);
        const hasRadius = cs.borderRadius !== '0px';
        const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
        const hasPadding = parseFloat(cs.paddingTop) > 2 || parseFloat(cs.paddingLeft) > 4;
        controlThemed = (hasRadius || hasBg || hasPadding) ? true : false;
      }
      signals.controlThemed = controlThemed;

      // Verdict: fail when ≥2 of the applicable signals indicate unstyled
      const checks = [preflightOk, sheetsWithRules, fontOk];
      if (controlThemed !== 'not-applicable') checks.push(controlThemed);
      const failCount = checks.filter(c => !c).length;
      return { pass: failCount < 2, signals };
    });

    cell.assertions.styleIntegrity = {
      pass: styleSignals.pass,
      failReason: styleSignals.pass ? null : 'unstyled-render',
      signals: styleSignals.signals,
    };
    if (!styleSignals.pass) {
      cell.pass = false;
      cell.verdict = 'fail';
      return cell;
    }

    // ════════════════════════════════════════════════════════════════
    // LAYER 2: Visual gates (only if layer 1 + style passed)
    // ════════════════════════════════════════════════════════════════

    // ── Assertion (a): No horizontal overflow ──
    const noOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    cell.assertions.noHorizontalOverflow = noOverflow;

    // ── Assertion (b): Full-width FORM CONTROLS at <640 ──
    let fullWidthOk = true;
    if (viewport.width < 640) {
      fullWidthOk = await page.evaluate((tolerance) => {
        function parentContentWidth(el) {
          const p = el.parentElement;
          if (!p) return 0;
          const s = window.getComputedStyle(p);
          return p.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
        }
        for (const el of document.querySelectorAll('[data-slot="select-trigger"]')) {
          if (el.closest('[role="dialog"]')) continue;
          const pw = parentContentWidth(el);
          if (pw > 0 && el.offsetWidth < pw - tolerance) return false;
        }
        for (const el of document.querySelectorAll('[data-slot="tabs-list"]')) {
          const pw = parentContentWidth(el);
          if (pw > 0 && el.offsetWidth < pw - tolerance) return false;
        }
        for (const inp of document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input:not([type])')) {
          if (inp.offsetWidth <= 1) continue;
          if (inp.closest('[role="dialog"]')) continue;
          const parent = inp.parentElement;
          if (!parent) continue;
          const parentFlex = window.getComputedStyle(parent).display === 'flex';
          if (parentFlex && parent.children.length > 1) continue;
          const pw = parentContentWidth(inp);
          if (pw < 50) continue;
          if (pw > 0 && inp.offsetWidth < pw - tolerance) return false;
        }
        return true;
      }, FULL_WIDTH_TOLERANCE);
    }
    cell.assertions.fullWidthControlsAtMobile = viewport.width < 640 ? fullWidthOk : null;

    // ── Assertion (d): Full-width TEXT BUTTONS at <640 ──
    let fullWidthButtonsOk = true;
    let failingButtons = [];
    let checkedAnyButton = false;
    if (viewport.width < 640) {
      const result = await page.evaluate((tolerance) => {
        function parentContentWidth(el) {
          const p = el.parentElement;
          if (!p) return 0;
          const s = window.getComputedStyle(p);
          return p.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
        }
        const failures = [];
        let checkedAny = false;
        for (const el of document.querySelectorAll('[data-slot="button"]:not([data-icon-only])')) {
          if (el.offsetWidth <= 1) continue;
          if (el.closest('[data-slot="button-group"]')) continue;
          checkedAny = true;
          const pw = parentContentWidth(el);
          if (pw > 0 && el.offsetWidth < pw - tolerance) {
            failures.push((el.textContent ?? '').trim().slice(0, 40) || '(empty)');
          }
        }
        return { failures, checkedAny };
      }, FULL_WIDTH_TOLERANCE);
      failingButtons = result.failures;
      checkedAnyButton = result.checkedAny;
      fullWidthButtonsOk = failingButtons.length === 0;
    }
    cell.assertions.fullWidthButtonsAtMobile = viewport.width < 640 ? (checkedAnyButton ? fullWidthButtonsOk : null) : null;
    if (failingButtons.length > 0) cell.assertions.failingButtonLabels = failingButtons;

    // ── Assertion (e): Open popups = bottom-anchored full-width at <640 ──
    let popupBottomSheetOk = true;
    let failingPopups = [];
    let checkedAnyPopup = false;
    if (viewport.width < 640) {
      const result = await page.evaluate((tolerance) => {
        const selectors = [
          '[data-slot="dialog-content"]',
          '[data-slot="sheet-content"]',
          '[data-slot="select-content"]',
          '[data-slot="popover-content"]',
          '[data-slot="dropdown-menu-content"]',
          '[data-slot="navigation-menu-popup"]',
        ];
        const failures = [];
        let checkedAny = false;
        for (const sel of selectors) {
          for (const el of document.querySelectorAll(sel)) {
            if (el.getAttribute('data-side') === 'left') continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            checkedAny = true;
            const edgeToEdge =
              rect.width >= window.innerWidth - tolerance &&
              Math.abs(rect.left) <= tolerance &&
              Math.abs(rect.right - window.innerWidth) <= tolerance;
            const bottomAnchored = Math.abs(rect.bottom - window.innerHeight) <= tolerance;
            if (!edgeToEdge || !bottomAnchored) {
              const side = el.getAttribute('data-side');
              failures.push(el.getAttribute('data-slot') + (side ? `[data-side=${side}]` : ''));
            }
          }
        }
        return { failures, checkedAny };
      }, FULL_WIDTH_TOLERANCE);
      failingPopups = result.failures;
      checkedAnyPopup = result.checkedAny;
      popupBottomSheetOk = failingPopups.length === 0;
    }
    cell.assertions.popupBottomSheetAtMobile = viewport.width < 640 ? (checkedAnyPopup ? popupBottomSheetOk : null) : null;
    if (failingPopups.length > 0) cell.assertions.failingPopupSlots = failingPopups;

    // ── Assertion (f): HeroSearch-only row-structure assertion in the 640–767 in-band viewport
    // (Task 573). Gated on the SAME discovered `componentName` discoverMantinePrimitiveStories()
    // attaches — never a hardcoded story id — and ONLY runs for 640<=width<768, so it has zero
    // effect on any other story and on HeroSearch cells outside this band. A cell that only
    // checked "no horizontal overflow" would NOT catch a regression here: Task 572's fix wraps
    // the Search button to its own row so the Location combobox isn't crushed, but a REGRESSED
    // single-row layout has no overflow either — this reads the 4 search-bar control tops
    // directly (the same DOM shape Task 572's one-off proof script read: PropertyType/
    // LocationCombobox/MantineCountButton/Search Button are the 4 direct children of the
    // `.flex.flex-wrap` container inside the `.bg-background` search-bar card — see
    // HeroSearchView.tsx) and asserts Search sits on a strictly LOWER row than Location.
    // `null` = not applicable (wrong story / wrong band / controls not yet found — the latter is
    // deliberately non-committal so a transient late-render never masquerades as a layout defect;
    // this cell already passed the style-integrity retry gate above by the time we reach here).
    let heroSearchWrapInBand = null;
    if (story.componentName === 'HeroSearch' && viewport.width >= 640 && viewport.width < 768) {
      heroSearchWrapInBand = await page.evaluate(() => {
        // `.bg-background` alone is AMBIGUOUS inside Storybook: `withTheme` (.storybook/preview.tsx)
        // wraps EVERY story (Mantine included — it does not check skipCanvas) in an outer
        // `<div class="min-h-screen bg-background text-foreground">`, which `document.querySelector`
        // would match FIRST, before ever reaching the real search-bar card nested inside it. Narrow
        // to the element that ALSO carries the search-bar card's other literal classes
        // (`border` + `shadow-xl`, from HeroSearchView.tsx's
        // `"bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3"`) so this can never
        // resolve to the outer theme wrapper.
        const card = Array.from(document.querySelectorAll('#storybook-root .bg-background'))
          .find((el) => el.classList.contains('border') && el.classList.contains('shadow-xl'));
        const container = card?.querySelector(':scope > .flex.flex-wrap');
        if (!container) return null;
        const controls = Array.from(container.children).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        if (controls.length !== 4) return null; // late/partial render — not a layout verdict
        // Order matches HeroSearchView.tsx: [type, location, filters, Search]
        const locationTop = controls[1].getBoundingClientRect().top;
        const searchTop = controls[3].getBoundingClientRect().top;
        return searchTop > locationTop + 1; // Search strictly on a lower row than Location
      });
    }
    cell.assertions.heroSearchWrapInBand = heroSearchWrapInBand;

    // ════════════════════════════════════════════════════════════════
    // LAYER 3: Geometry / visual integrity (Task 467)
    // ════════════════════════════════════════════════════════════════
    const storyAllowlist = GEOMETRY_ALLOWLIST.filter(a => a.storyId === story.id);
    const geometryResult = await checkGeometryIntegrity(page, viewport.width, storyAllowlist);
    cell.assertions.visualIntegrity = {
      pass: geometryResult.pass,
      ambiguousOnly: geometryResult.ambiguousOnly,
      violations: geometryResult.violations,
      ambiguous: geometryResult.ambiguous,
    };
    const geometryHardFail = geometryResult.violations.length > 0;

    const hardPass = noOverflow && !geometryHardFail && heroSearchWrapInBand !== false &&
      (viewport.width >= 640 || (fullWidthOk && fullWidthButtonsOk && popupBottomSheetOk));
    if (hardPass && geometryResult.ambiguousOnly) {
      cell.pass = false;
      cell.ambiguousOnly = true;
      cell.verdict = 'ambiguous';
    } else {
      cell.pass = hardPass;
      cell.verdict = hardPass ? 'pass' : 'fail';
    }

  } catch (err) {
    cell.pass = false;
    cell.verdict = 'fail';
    cell.error = err.message;
    // Try to capture a screenshot even on error
    try { if (page) await page.screenshot({ path: screenshotPath, fullPage: false }); } catch {}
  } finally {
    await page?.close().catch(() => {});
  }

  return cell;
}

// ── Main assertion runner ─────────────────────────────────────────────────────

async function runAssert() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright').catch(() => {
    console.error('playwright not installed — run: npm install');
    process.exit(1);
  });

  const viewports = FAST_MODE ? VIEWPORTS_MOBILE : VIEWPORTS_FULL;
  const PORT = 6008;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'rendered-assert', timestamp);
  mkdirSync(outputDir, { recursive: true });

  console.log(`📸  Starting rendered assertion (${FAST_MODE ? 'fast/mobile' : 'full'} mode)`);
  console.log(`    Assert stories: ${ASSERT_STORIES.length} | Viewports: ${viewports.length} | Locales: ${LOCALES.length}`);
  console.log(`    Output: .screenshots/rendered-assert/${timestamp}/`);
  console.log('');

  let server, browser;
  const matrix = [];

  try {
    try {
      server = await startStaticServer(storybookStaticDir, PORT);
    } catch (err) {
      if (err.portInUse || err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use by another process.`);
        console.error(`   This harness only tears down the static server it spawns itself —`);
        console.error(`   it will NOT kill an unknown/foreign process on port ${PORT}.`);
        console.error(`   Free port ${PORT} and rerun.`);
        process.exit(1);
      }
      throw err;
    }

    // Readiness ping — confirm the static server is actually serving chunks
    // before the run starts (Task 418, item 3).
    await waitForServerReady(baseUrl);

    browser = await chromium.launch();

    // ── blank-screenshot self-test (Task 464): generate a blank PNG and verify
    // the bitmap check catches it, so the branch remains covered even after
    // AdminSidebar/Desktop was removed from ASSERT_STORIES. ──
    {
      const { default: sharp } = await import('sharp');
      const blankPath = join(outputDir, '__selftest_blank__.png');
      await sharp({ create: { width: 320, height: 812, channels: 3, background: { r: 255, g: 255, b: 255 } } }).png().toFile(blankPath);
      const blankResult = await assertScreenshotHasMeaningfulPixels(blankPath);
      if (blankResult.pass) {
        console.error('❌ blank-screenshot self-test FAILED: generated blank PNG was not caught');
        console.error('   metrics:', JSON.stringify(blankResult.metrics));
        process.exitCode = 1;
        return;
      }
      // Clean up — self-test file not needed in output
      const { unlinkSync } = await import('node:fs');
      try { unlinkSync(blankPath); } catch {}
    }

    // ── Global story enumeration (Task 467 AC1) ──────────────────────
    // Read all story IDs from the built Storybook index for geometry-only checks + the Task 529
    // Mantine-primitives discovery (both share this one index read / error path — if the index
    // is missing or malformed, BOTH mechanisms must fail loudly, never silently pass zero stories).
    const indexPath = join(storybookStaticDir, 'index.json');
    let geometryOnlyStories = [];
    let mantineStories = [];
    try {
      const indexData = JSON.parse(await readFile(indexPath, 'utf8'));
      const assertIds = new Set(ASSERT_STORIES.map(s => s.id));
      mantineStories = discoverMantinePrimitiveStories(indexData);
      const mantineIds = new Set(mantineStories.map(s => s.id));
      geometryOnlyStories = Object.values(indexData.entries)
        .filter(e => e.type === 'story' && !assertIds.has(e.id) && !mantineIds.has(e.id))
        .map(e => ({ id: e.id, label: `${e.title}/${e.name}`, anchors: [], geometryOnly: true }));
    } catch (err) {
      console.error(`❌ Cannot read ${indexPath} for global story enumeration: ${err.message}`);
      console.error('   The geometry layer + Task 529 Mantine-primitives gate require story enumeration from the built index — aborting.');
      process.exitCode = 1;
      return;
    }

    // Task 529 — discovery must never silently degrade to zero coverage. A successfully-parsed
    // index that yields zero Mantine/Primitives/* matches (e.g. the title prefix drifted, or the
    // index is stale/wrong) is a DIFFERENT failure mode than "index unreadable" above, and needs
    // its own loud, non-zero-exit error — never a silent pass.
    if (mantineStories.length === 0) {
      console.error(`❌ Task 529/607 gate: discovered ZERO stories matching any of [${MANTINE_STORY_TITLE_PREFIXES.join(', ')}] from the built index.`);
      console.error(`   Checked: ${indexPath} — filtering entries with type==='story' and title starting with one of the prefixes above.`);
      console.error('   This is a hard error, not a skip — either the index is stale/wrong, or a title prefix no longer matches story titles.');
      process.exitCode = 1;
      return;
    }

    // Geometry-only stories use mobile viewports only (320/375/390)
    const geometryViewports = VIEWPORTS_MOBILE;
    const totalAssertCells = ASSERT_STORIES.length * LOCALES.length * viewports.length;
    const totalGeometryCells = geometryOnlyStories.length * LOCALES.length * geometryViewports.length;
    // Task 573 — each story's effective viewport list is MANTINE_VIEWPORTS plus its own
    // MANTINE_STORY_EXTRA_VIEWPORTS entry (if any); summed per-story so only the named
    // component(s) (currently HeroSearch, +1 viewport) contribute extra cells to the total.
    const extraMantineCellCount = mantineStories.reduce(
      (sum, s) => sum + (MANTINE_STORY_EXTRA_VIEWPORTS[s.componentName]?.length ?? 0) * LOCALES.length,
      0
    );
    const totalMantineCells = mantineStories.length * LOCALES.length * MANTINE_VIEWPORTS.length + extraMantineCellCount;
    console.log(`    Mantine gate stories (Task 529/607 ENFORCED, always runs incl. --fast, prefixes: ${MANTINE_STORY_TITLE_PREFIXES.join(', ')}): ${mantineStories.length} (${totalMantineCells} cells @ 320/375/390/1024 × 4 locales${extraMantineCellCount > 0 ? ` + ${extraMantineCellCount} per-story extra-viewport cells (Task 573)` : ''}; ${mantineStories.filter(s => s.openTrigger).length} overlay stories asserted OPENED via scripted click)`);
    console.log(`    Geometry-only stories: ${geometryOnlyStories.length} (${totalGeometryCells} cells at 320/375/390 × 4 locales)`);
    console.log('');

    const MAX_ATTEMPTS = 3;
    let flakyRecovered = 0;

    // ── Phase 0: Mantine/Primitives/* enforced gate (Task 529) — full Layer 1+2+3, runs
    // UNCONDITIONALLY (including --fast), auto-discovered, overlay stories opened via click. ──
    process.stdout.write('  mantine: ');
    for (const story of mantineStories) {
      // Task 573 — union MANTINE_VIEWPORTS with this story's own extra-viewport entry (if any).
      // Non-HeroSearch stories get `?? []` → byte-identical to MANTINE_VIEWPORTS, unchanged.
      const effectiveViewports = [
        ...MANTINE_VIEWPORTS,
        ...(MANTINE_STORY_EXTRA_VIEWPORTS[story.componentName] ?? []),
      ];
      for (const locale of LOCALES) {
        for (const viewport of effectiveViewports) {
          const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
          const filename = `${story.id}__${locale}__${viewport.name}.png`;
          const screenshotPath = join(outputDir, filename);

          let cell;
          let attempt = 0;
          for (;;) {
            attempt++;
            cell = await captureCell(browser, storyUrl, story, locale, viewport, filename, screenshotPath);
            if (cell.pass || !isTransientFailure(cell) || attempt >= MAX_ATTEMPTS) break;
            await sleep(300 * attempt);
          }
          cell.retryCount = attempt - 1;
          cell.phase = 'mantine-gate';
          if (!cell.pass && !cell.ambiguousOnly && attempt >= MAX_ATTEMPTS && cell.assertions?.styleIntegrity?.pass === false) {
            cell.hardAfterRetries = true;
            cell.assertions.renderCheck = {
              ...cell.assertions.renderCheck,
              failReason: cell.assertions.renderCheck?.failReason ?? 'unstyled-render',
            };
          }
          if (cell.verdict === 'pass' && cell.retryCount > 0) flakyRecovered++;

          if (cell.error) {
            process.stdout.write('E');
          } else {
            const ch = { pass: '✓', fail: '✗', ambiguous: '?', 'out-of-range': 'R' }[cell.verdict] ?? '✗';
            process.stdout.write(cell.retryCount > 0 && cell.verdict === 'pass' ? '~' : ch);
          }

          matrix.push(cell);
        }
      }
    }
    console.log('');

    // ── Phase 1: ASSERT_STORIES (full Layer 1 + 2 + 3, anchors required) ──
    for (const story of MANTINE_ONLY ? [] : ASSERT_STORIES) {
      for (const locale of LOCALES) {
        for (const viewport of viewports) {
          const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
          const filename = `${story.id}__${locale}__${viewport.name}.png`;
          const screenshotPath = join(outputDir, filename);

          let cell;
          let attempt = 0;
          for (;;) {
            attempt++;
            cell = await captureCell(browser, storyUrl, story, locale, viewport, filename, screenshotPath);
            if (cell.pass || !isTransientFailure(cell) || attempt >= MAX_ATTEMPTS) break;
            await sleep(300 * attempt); // small backoff before re-navigate + re-capture
          }
          cell.retryCount = attempt - 1;
          // P1/B8: after exhausting retries, unstyled-render becomes a hard non-transient failure
          // Stamp renderCheck.failReason HERE (not inside captureCell) so the retry loop works
          if (!cell.pass && !cell.ambiguousOnly && attempt >= MAX_ATTEMPTS && cell.assertions?.styleIntegrity?.pass === false) {
            cell.hardAfterRetries = true;
            cell.assertions.renderCheck = {
              ...cell.assertions.renderCheck,
              failReason: cell.assertions.renderCheck?.failReason ?? 'unstyled-render',
            };
          }
          // V1-FINAL: out-of-range cells are never citable as rendered proof
          if (isOutOfViewportRange(cell)) {
            cell.pass = false;
            cell.verdict = 'out-of-range';
            cell.viewportMismatch = true;
          }
          if (cell.verdict === 'pass' && cell.retryCount > 0) flakyRecovered++;

          if (cell.error) {
            process.stdout.write('E');
          } else {
            const ch = { pass: '✓', fail: '✗', ambiguous: '?', 'out-of-range': 'R' }[cell.verdict] ?? '✗';
            process.stdout.write(cell.retryCount > 0 && cell.verdict === 'pass' ? '~' : ch);
          }

          matrix.push(cell);
        }
      }
    }

    // ── Phase 2: Geometry-only stories (render-proof + geometry, no anchors) ──
    if (geometryOnlyStories.length > 0 && !FAST_MODE && !MANTINE_ONLY) {
      process.stdout.write('\n  geometry-only: ');
      for (const story of geometryOnlyStories) {
        for (const locale of LOCALES) {
          for (const viewport of geometryViewports) {
            const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
            const filename = `${story.id}__${locale}__${viewport.name}.png`;
            const screenshotPath = join(outputDir, filename);

            let cell;
            let attempt = 0;
            for (;;) {
              attempt++;
              cell = await captureCell(browser, storyUrl, story, locale, viewport, filename, screenshotPath);
              if (cell.pass || !isTransientFailure(cell) || attempt >= MAX_ATTEMPTS) break;
              await sleep(300 * attempt);
            }
            cell.retryCount = attempt - 1;
            cell.phase = 'geometry-only';
            if (!cell.pass && !cell.ambiguousOnly && attempt >= MAX_ATTEMPTS && cell.assertions?.styleIntegrity?.pass === false) {
              cell.hardAfterRetries = true;
              cell.assertions.renderCheck = {
                ...cell.assertions.renderCheck,
                failReason: cell.assertions.renderCheck?.failReason ?? 'unstyled-render',
              };
            }
            if (isOutOfViewportRange(cell)) {
              cell.pass = false;
              cell.verdict = 'out-of-range';
              cell.viewportMismatch = true;
            }
            if (cell.verdict === 'pass' && cell.retryCount > 0) flakyRecovered++;

            if (cell.error) {
              process.stdout.write('E');
            } else {
              const ch = { pass: '✓', fail: '✗', ambiguous: '?', 'out-of-range': 'R' }[cell.verdict] ?? '✗';
              process.stdout.write(cell.retryCount > 0 && cell.verdict === 'pass' ? '~' : ch);
            }

            matrix.push(cell);
          }
        }
      }
    }

    console.log('\n');

    // ── Task 607 — reconcile the tracked known-failure registry against actual results ──
    // Runs once, after every cell has been captured, so the reconciliation always sees the
    // FULL set of failing cells per story (never a partial/in-progress view).
    for (const [componentName, entry] of Object.entries(MANTINE_PATTERN_KNOWN_FAILURES)) {
      const prefix = `Patterns/Mantine/${componentName}/`;
      const failingCells = matrix.filter(c => c.story.startsWith(prefix) && c.verdict === 'fail');
      const reasons = new Set(failingCells.map(getPrimaryFailReason));
      const signatureMatches = failingCells.length === entry.expectedFailingCells &&
        reasons.size === 1 && reasons.has(entry.expectedFailReason);

      if (failingCells.length === 0) continue; // nothing to reconcile (also covers "already fixed")

      if (signatureMatches) {
        for (const c of failingCells) {
          c.verdict = 'known-failure';
          c.knownFailureTask = entry.followUpTask;
        }
        console.log(`ℹ️  ${componentName}: ${failingCells.length} cells match the tracked known-failure signature (Task ${entry.followUpTask}, "${entry.expectedFailReason}") — excluded from the blocking count, still listed below.`);
      } else {
        console.error(`❌ TRACKED KNOWN-FAILURE SIGNATURE CHANGED for ${componentName} (Task ${entry.followUpTask}): expected ${entry.expectedFailingCells} cells failing with "${entry.expectedFailReason}", found ${failingCells.length} cells failing with reason(s) [${[...reasons].join(', ')}]. Treating as a hard, BLOCKING failure — this may be a NEW or WORSE regression, do not assume it is still the original known issue.`);
      }
    }

    // ── Emit manifest.json with summary ─────────────────────────────────
    const outOfRange = matrix.filter(c => c.verdict === 'out-of-range').length;
    const passed  = matrix.filter(c => c.verdict === 'pass').length;
    const knownFailureCount = matrix.filter(c => c.verdict === 'known-failure').length;
    // Defensive: any cell with pass=false that isn't explicitly ambiguous, out-of-range, or a
    // reconciled known-failure (Task 607) is a hard fail
    const failed  = matrix.filter(c => c.verdict === 'fail' || (c.pass === false && c.verdict !== 'ambiguous' && c.verdict !== 'out-of-range' && c.verdict !== 'known-failure')).length;
    const ambiguousOnlyCount = matrix.filter(c => c.verdict === 'ambiguous').length;
    const total   = matrix.length;

    const summary = {
      total,
      passed,
      failed,
      outOfRange,
      knownFailure: knownFailureCount,
      ambiguousOnly: ambiguousOnlyCount,
      loaderOnly:          matrix.filter(c => c.assertions?.renderCheck?.failReason === 'loader-only').length,
      blankCanvas:         matrix.filter(c => c.assertions?.renderCheck?.failReason === 'blank-canvas').length,
      emptyCanvas:         matrix.filter(c => c.assertions?.renderCheck?.failReason === 'empty-canvas').length,
      blankScreenshot:     matrix.filter(c => c.assertions?.renderCheck?.failReason === 'blank-screenshot' || c.visualContentCheck?.failReason === 'blank-screenshot').length,
      anchorMissing:       matrix.filter(c => c.assertions?.renderCheck?.failReason === 'anchor-missing').length,
      textClipped:         matrix.filter(c => c.assertions?.visualIntegrity?.violations?.some(v => v.failReason === 'text-clipped')).length,
      selfClipped:         matrix.filter(c => c.assertions?.visualIntegrity?.violations?.some(v => v.failReason === 'self-clipped')).length,
      offscreenControl:    matrix.filter(c => c.assertions?.visualIntegrity?.violations?.some(v => v.failReason === 'offscreen-control')).length,
      outsideContainer:    matrix.filter(c => c.assertions?.visualIntegrity?.violations?.some(v => v.failReason === 'outside-container')).length,
      elementOverlap:      matrix.filter(c => c.assertions?.visualIntegrity?.violations?.some(v => v.failReason === 'element-overlap')).length,
      bottomsheetOverflow: matrix.filter(c => c.assertions?.visualIntegrity?.violations?.some(v => v.failReason === 'bottomsheet-overflow')).length,
      ambiguousOverlap:    matrix.filter(c => (c.assertions?.visualIntegrity?.ambiguous?.length ?? 0) > 0).length,
      unstyledRender:      matrix.filter(c => c.assertions?.styleIntegrity?.failReason === 'unstyled-render').length,
    };

    const manifestPath = join(outputDir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify({ timestamp, summary, matrix }, null, 2), 'utf8');

    // ── Task 547 — stable selector normalization ────────────────────────
    // Mantine's useId() produces a fresh random suffix on every Storybook build (see the
    // GEOMETRY_ALLOWLIST doc note above, ~:419), so raw `#mantine-<random>` ids would otherwise
    // churn the committed inventory .md on every identical rerun with zero semantic change.
    // Anchored on the leading `#` so it only ever matches element-id selectors — storyId values
    // (`mantine-primitives-combobox--default`) and non-Mantine selectors/labels never match.
    const stableSelector = (s) => String(s ?? '').replace(/#mantine-[a-z0-9]+/gi, '#mantine-<id>');

    // ── Generate per-cell inventory markdown from manifest ─────────────
    const inventoryPath = join(ROOT, 'docs', 'governance-reports', '2026-06-19-task467-storybook-visual-defect-inventory.md');
    const inventoryLines = [
      '# Task 467 — Storybook visual-defect inventory (geometry + style integrity layers)',
      '',
      `**Harness:** \`scripts/check-stories-rendered.mjs\` + \`scripts/geometry-integrity.mjs\` (Task 467 R1–R4/B1–B8) — run timestamp recorded in \`.screenshots/rendered-assert/<ts>/manifest.json\``,
      `**Run mode:** ${FAST_MODE ? '--fast' : 'full'} (320/375/390 × sq/en/uk/it) | **Scope:** ${FAST_MODE ? 'ASSERT_STORIES (' + ASSERT_STORIES.length + ' stories) + Mantine gate (' + mantineStories.length + ' stories), ' + (totalAssertCells + totalMantineCells) + ' cells' : 'Global enumeration (' + (ASSERT_STORIES.length + mantineStories.length + geometryOnlyStories.length) + ' stories, ' + total + ' cells)'}`,
      '',
      '> **Harness-generated inventory.** Every row below is emitted by the harness from the manifest.',
      `> ${FAST_MODE ? 'Task 467 INCOMPLETE for full global inventory — pending owner NATIVE full run.' : 'Full global-enumeration run.'}`,
      '',
      '## Summary (three-bucket model + style integrity)',
      '',
      '| Counter | Count |',
      '|---------|-------|',
      `| Total cells | ${total} |`,
      `| PASS (clean, verdict=pass) | ${passed} |`,
      `| FAIL (hard defect, verdict=fail) | ${failed} |`,
      `| OUT-OF-RANGE (viewport mismatch, not product defect) | ${outOfRange} |`,
      `| AMBIGUOUS (needs-owner-decision, verdict=ambiguous) | ${ambiguousOnlyCount} |`,
      `| text-clipped | ${summary.textClipped} |`,
      `| offscreen-control | ${summary.offscreenControl} |`,
      `| outside-container | ${summary.outsideContainer} |`,
      `| element-overlap | ${summary.elementOverlap} |`,
      `| bottomsheet-overflow | ${summary.bottomsheetOverflow} |`,
      `| ambiguous-overlap | ${summary.ambiguousOverlap} |`,
      `| unstyled-render | ${summary.unstyledRender} |`,
      '',
      '---',
      '',
      '## Bucket 1: Hard defects (true positives — product layout fixes needed)',
      '',
      '| Story ID | Locale | Viewport | Screenshot | Fail Reason | Selector | Label |',
      '|---|---|---|---|---|---|---|',
    ];
    // F-I: exclude style-only failures from Bucket 1 (they go to the style-integrity section)
    // V1-FINAL: viewport-mismatch cells have verdict='out-of-range', not 'fail', so they're excluded automatically
    const hardCells = matrix.filter(c => c.verdict === 'fail' && !c.storyId?.startsWith('planted-') && c.assertions?.styleIntegrity?.pass !== false);
    for (const c of hardCells) {
      const reasons = [];
      const rc = c.assertions?.renderCheck;
      if (rc?.failReason) reasons.push(rc.failReason);
      if (c.assertions?.styleIntegrity?.pass === false) reasons.push('unstyled-render');
      for (const v of (c.assertions?.visualIntegrity?.violations ?? [])) {
        reasons.push(`${v.failReason}: ${stableSelector(v.selector)}`);
      }
      const reasonStr = reasons.join('; ') || '(render/visual)';
      const firstViolation = c.assertions?.visualIntegrity?.violations?.[0];
      inventoryLines.push(`| \`${c.storyId}\` | ${c.locale} | ${c.viewport} | \`${c.screenshot}\` | ${reasonStr} | ${stableSelector(firstViolation?.selector)} | ${firstViolation?.label ?? ''} |`);
    }
    if (hardCells.length === 0) inventoryLines.push('| *(none)* | | | | | | |');

    inventoryLines.push('', '---', '', '## Bucket 1b: Tracked known failures (Task 607 registry — real defects, dedicated follow-up task, non-blocking)', '',
      '| Story ID | Locale | Viewport | Screenshot | Fail Reason | Follow-up Task |',
      '|---|---|---|---|---|---|');
    const knownFailureCells = matrix.filter(c => c.verdict === 'known-failure' && !c.storyId?.startsWith('planted-'));
    for (const c of knownFailureCells) {
      const reasons = [];
      for (const v of (c.assertions?.visualIntegrity?.violations ?? [])) reasons.push(`${v.failReason}: ${stableSelector(v.selector)}`);
      if (c.assertions?.noHorizontalOverflow === false) reasons.push('horizontal-overflow');
      inventoryLines.push(`| \`${c.storyId}\` | ${c.locale} | ${c.viewport} | \`${c.screenshot}\` | ${reasons.join('; ') || '(render/visual)'} | Task ${c.knownFailureTask} |`);
    }
    if (knownFailureCells.length === 0) inventoryLines.push('| *(none)* | | | | | |');

    inventoryLines.push('', '---', '', '## Bucket 2: Needs-owner-decision (ambiguous third state)', '',
      '| Story ID | Locale | Viewport | Screenshot | Fail Reason | Selector | Label | Reason |',
      '|---|---|---|---|---|---|---|---|');
    const ambiguousCells = matrix.filter(c => c.verdict === 'ambiguous' && !c.storyId?.startsWith('planted-'));
    for (const c of ambiguousCells) {
      for (const a of (c.assertions?.visualIntegrity?.ambiguous ?? [])) {
        inventoryLines.push(`| \`${c.storyId}\` | ${c.locale} | ${c.viewport} | \`${c.screenshot}\` | ${a.failReason} | ${stableSelector(a.selector)} | ${a.label} | ${a.reason ?? ''} |`);
      }
    }
    if (ambiguousCells.length === 0) inventoryLines.push('| *(none)* | | | | | | | |');

    inventoryLines.push('', '---', '', '## Capture / style-integrity failures (NOT product layout defects)', '',
      '| Story ID | Locale | Viewport | Failing Signals | Screenshot |',
      '|---|---|---|---|---|');
    const styleCells = matrix.filter(c => c.assertions?.styleIntegrity?.failReason === 'unstyled-render' && !c.storyId?.startsWith('planted-'));
    for (const c of styleCells) {
      const s = c.assertions.styleIntegrity.signals;
      inventoryLines.push(`| \`${c.storyId}\` | ${c.locale} | ${c.viewport} | bodyMargin=${s.bodyMargin}, sheets=${s.sheetsWithRules}, font=${(s.fontFamily ?? '').slice(0, 30)}, ctrl=${s.controlThemed} | \`${c.screenshot}\` |`);
    }
    if (styleCells.length === 0) inventoryLines.push('| *(none in this run)* | | | | |');

    inventoryLines.push('', '---', '', '## Viewport-mismatch failures (NOT product layout defects)', '',
      '> Stories rendered outside their meaningful viewport range (e.g. mobile-only header at desktop, mobile drawer at desktop).',
      '',
      '| Story ID | Locale | Viewport | Screenshot | Fail Reason | Range |',
      '|---|---|---|---|---|---|');
    const outOfRangeCells = matrix.filter(c => c.verdict === 'out-of-range' && !c.storyId?.startsWith('planted-'));
    for (const c of outOfRangeCells) {
      const reasons = [];
      const rc = c.assertions?.renderCheck;
      if (rc?.failReason) reasons.push(rc.failReason);
      for (const v of (c.assertions?.visualIntegrity?.violations ?? [])) {
        reasons.push(v.failReason);
      }
      const reasonStr = reasons.join('; ') || '(render/visual)';
      const range = STORY_VIEWPORT_RANGE[c.storyId];
      const rangeStr = range ? [range.minWidth ? `min=${range.minWidth}` : null, range.maxWidth ? `max=${range.maxWidth}` : null].filter(Boolean).join(', ') : '';
      inventoryLines.push(`| \`${c.storyId}\` | ${c.locale} | ${c.viewport} | \`${c.screenshot}\` | ${reasonStr} | ${rangeStr} |`);
    }
    if (outOfRangeCells.length === 0) inventoryLines.push('| *(none)* | | | | | |');

    inventoryLines.push('', '---', '', '## Planted violation stories (standing fixtures — NOT product defects)', '',
      '| Story ID | Verdict | Fail Reason | Cells |',
      '|---|---|---|---|');
    const plantedIds = [...new Set(matrix.filter(c => c.storyId?.startsWith('planted-')).map(c => c.storyId))];
    for (const pid of plantedIds) {
      const pCells = matrix.filter(c => c.storyId === pid);
      const pLabel = pCells[0]?.story ?? pid;
      const verdicts = [...new Set(pCells.map(c => c.verdict))];
      const reasons = [...new Set(pCells.flatMap(c => [
        ...(c.assertions?.visualIntegrity?.violations ?? []).map(v => v.failReason),
        ...(c.assertions?.visualIntegrity?.ambiguous ?? []).map(a => a.failReason),
        ...(c.assertions?.styleIntegrity?.failReason ? [c.assertions.styleIntegrity.failReason] : []),
      ]))];
      inventoryLines.push(`| \`${pLabel}\` | ${verdicts.join('/')} | ${reasons.join(', ') || '—'} | ${pCells.length}/${pCells.length} |`);
    }

    inventoryLines.push('', '---', '',
      '## Notes', '',
      '- **Harness-generated:** all rows above are emitted from the manifest, not hand-written.',
      '- **Authoritative full run** = owner NATIVE on committed tree.',
      // Task 547: the literal per-run `timestamp` (feeds the `.screenshots/rendered-assert/<ts>/`
      // directory name) is itself volatile — printing it here would defeat determinism the same
      // way the old header date did. The manifest already records it (gitignored); no duplication.
      '- **Run timestamp:** recorded per-run in `.screenshots/rendered-assert/<ts>/manifest.json` (gitignored) — not duplicated here so the committed report stays byte-identical across identical runs.',
    );

    writeFileSync(inventoryPath, inventoryLines.join('\n') + '\n', 'utf8');
    console.log(`Inventory: docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`);

    console.log(`Results: ${passed}/${total} PASS, ${failed} FAIL${outOfRange > 0 ? `, ${outOfRange} OUT-OF-RANGE` : ''}${ambiguousOnlyCount > 0 ? `, ${ambiguousOnlyCount} AMBIGUOUS (needs-owner-decision)` : ''}${knownFailureCount > 0 ? `, ${knownFailureCount} KNOWN-FAILURE (tracked, Task 607)` : ''}`);
    if (summary.loaderOnly > 0) console.log(`  loader-only: ${summary.loaderOnly}`);
    if (summary.blankCanvas > 0) console.log(`  blank-canvas: ${summary.blankCanvas}`);
    if (summary.emptyCanvas > 0) console.log(`  empty-canvas: ${summary.emptyCanvas}`);
    if (summary.blankScreenshot > 0) console.log(`  blank-screenshot: ${summary.blankScreenshot}`);
    if (summary.anchorMissing > 0) console.log(`  anchor-missing: ${summary.anchorMissing}`);
    if (summary.textClipped > 0) console.log(`  text-clipped: ${summary.textClipped}`);
    if (summary.selfClipped > 0) console.log(`  self-clipped: ${summary.selfClipped}`);
    if (summary.offscreenControl > 0) console.log(`  offscreen-control: ${summary.offscreenControl}`);
    if (summary.outsideContainer > 0) console.log(`  outside-container: ${summary.outsideContainer}`);
    if (summary.elementOverlap > 0) console.log(`  element-overlap: ${summary.elementOverlap}`);
    if (summary.bottomsheetOverflow > 0) console.log(`  bottomsheet-overflow: ${summary.bottomsheetOverflow}`);
    if (summary.ambiguousOverlap > 0) console.log(`  ambiguous-overlap: ${summary.ambiguousOverlap}`);
    if (summary.unstyledRender > 0) console.log(`  unstyled-render: ${summary.unstyledRender}`);
    console.log(`flaky-recovered: ${flakyRecovered}`);
    if (flakyRecovered > 0) {
      console.log('  Recovered cells (passed only after retry):');
      for (const cell of matrix.filter(c => c.verdict === 'pass' && c.retryCount > 0)) {
        console.log(`    ${cell.story} × ${cell.locale} × ${cell.viewport} (retries: ${cell.retryCount})`);
      }
    }
    console.log(`Manifest: .screenshots/rendered-assert/${timestamp}/manifest.json`);
    console.log(`PNGs: .screenshots/rendered-assert/${timestamp}/*.png`);

    if (failed > 0) {
      console.error('\n❌ Failed cells:');
      for (const cell of matrix.filter(c => c.verdict === 'fail')) {
        const retrySuffix = cell.retryCount > 0 ? ` (after ${cell.retryCount} retries)` : '';
        console.error(`  ${cell.story} × ${cell.locale} × ${cell.viewport}${retrySuffix}`);
        if (cell.error) {
          console.error(`    Error: ${cell.error}`);
        } else {
          const rc = cell.assertions.renderCheck;
          if (rc?.failReason) {
            const detail = (rc.failDetail ?? '').replace(/\n/g, ' ').slice(0, 120);
            console.error(`    ✗ render failure [${rc.failReason}]${detail ? ': ' + detail : ''}`);
          }
          if (!cell.assertions.noHorizontalOverflow) console.error('    ✗ horizontal overflow detected');
          if (cell.assertions.fullWidthControlsAtMobile === false) console.error('    ✗ form control not full-width at <640');
          if (cell.assertions.fullWidthButtonsAtMobile === false) console.error(`    ✗ text button not full-width at <640: ${(cell.assertions.failingButtonLabels ?? []).join(', ')}`);
          if (cell.assertions.popupBottomSheetAtMobile === false) console.error(`    ✗ popup not bottom-sheet at <640: ${(cell.assertions.failingPopupSlots ?? []).join(', ')}`);
          if (cell.assertions.heroSearchWrapInBand === false) console.error('    ✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)');
          if (cell.assertions.styleIntegrity?.pass === false) {
            const s = cell.assertions.styleIntegrity.signals;
            console.error(`    ✗ style [unstyled-render]: bodyMargin=${s.bodyMargin}, sheets=${s.sheetsWithRules}, font=${(s.fontFamily ?? '').slice(0, 30)}, ctrl=${s.controlThemed}`);
          }
          if (cell.assertions.visualIntegrity?.pass === false) {
            for (const v of cell.assertions.visualIntegrity.violations) {
              console.error(`    ✗ geometry [${v.failReason}]: ${v.selector} — ${v.label}`);
            }
          }
        }
      }
      if (ambiguousOnlyCount > 0) {
        console.log(`\n⚠️  ${ambiguousOnlyCount} cells have ambiguous findings (needs-owner-decision):`);
        for (const cell of matrix.filter(c => c.ambiguousOnly)) {
          console.log(`  ${cell.story} × ${cell.locale} × ${cell.viewport}`);
          for (const a of (cell.assertions.visualIntegrity?.ambiguous ?? [])) {
            console.log(`    ? [${a.failReason}]: ${a.selector} — ${a.reason ?? a.label}`);
          }
        }
      }
      if (outOfRange > 0) {
        console.log(`\nℹ️  ${outOfRange} cells are out-of-viewport-range (verdict=out-of-range, not product defects):`);
        for (const cell of matrix.filter(c => c.verdict === 'out-of-range').slice(0, 20)) {
          const range = STORY_VIEWPORT_RANGE[cell.storyId];
          console.log(`  ${cell.story} × ${cell.locale} × ${cell.viewport} (range: ${[range?.minWidth ? 'min=' + range.minWidth : null, range?.maxWidth ? 'max=' + range.maxWidth : null].filter(Boolean).join(', ')})`);
        }
        if (outOfRange > 20) console.log(`  … and ${outOfRange - 20} more`);
      }
      if (knownFailureCount > 0) {
        console.log(`\n📌 ${knownFailureCount} cells are TRACKED KNOWN FAILURES (Task 607 registry, non-blocking, real defects with a dedicated follow-up task — NOT fixed here):`);
        for (const cell of matrix.filter(c => c.verdict === 'known-failure')) {
          console.log(`  ${cell.story} × ${cell.locale} × ${cell.viewport} — Task ${cell.knownFailureTask}`);
        }
      }
      // Task 418 REWORK (P1-a): set exitCode + return (not process.exit) so the
      // `finally` below still runs `browser?.close()` / `server?.close()` on FAIL.
      process.exitCode = 1;
      return;
    }

    if (outOfRange > 0) {
      console.log(`\nℹ️  ${outOfRange} cells are out-of-viewport-range (verdict=out-of-range, not product defects).`);
    }

    if (knownFailureCount > 0) {
      console.log(`\n📌 ${knownFailureCount} cells are TRACKED KNOWN FAILURES (Task 607 registry, non-blocking, real defects with a dedicated follow-up task — NOT fixed here):`);
      for (const cell of matrix.filter(c => c.verdict === 'known-failure')) {
        console.log(`  ${cell.story} × ${cell.locale} × ${cell.viewport} — Task ${cell.knownFailureTask}`);
      }
    }

    if (ambiguousOnlyCount > 0) {
      console.log(`\n⚠️  ${ambiguousOnlyCount} cells have ambiguous findings (needs-owner-decision, verdict=ambiguous):`);
      for (const cell of matrix.filter(c => c.verdict === 'ambiguous')) {
        console.log(`  ${cell.story} × ${cell.locale} × ${cell.viewport}`);
        for (const a of (cell.assertions.visualIntegrity?.ambiguous ?? [])) {
          console.log(`    ? [${a.failReason}]: ${a.selector} — ${a.reason ?? a.label}`);
        }
      }
      console.log('\n✅ All hard assertions PASSED (ambiguous cells need owner triage — not citable as green proof).');
    } else {
      console.log('\n✅ All rendered assertions PASSED.');
    }

  } finally {
    await browser?.close();
    server?.close();
  }
}

// ── Entry point ────────────────────────────────────────────────────────────────

if (CHECK_ONLY) {
  await runCheck();
} else {
  await runAssert();
}
