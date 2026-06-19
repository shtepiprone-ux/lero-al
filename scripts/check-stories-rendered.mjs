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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FAST_MODE = args.includes('--fast');
const CHECK_ONLY = args.includes('--check');

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
  { id: 'system-listinggrid--desktop',             label: 'ListingGrid/Desktop',              anchors: [{ type: 'testid', value: 'listing-grid', label: 'listing-grid' }] },
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
  // ── ListingDetailView (14 — Task 237) ──
  { id: 'listings-listingdetailview--public-listing',                       label: 'ListingDetailView/Public',                       anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-unpublished',            label: 'ListingDetailView/StaffPreviewUnpublished',       anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-published',              label: 'ListingDetailView/StaffPreviewPublished',         anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--public-listing-mobile-320',            label: 'ListingDetailView/PublicMobile320',               anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--public-listing-mobile-375',            label: 'ListingDetailView/PublicMobile375',               anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--public-listing-mobile-390',            label: 'ListingDetailView/PublicMobile390',               anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-unpublished-mobile-320', label: 'ListingDetailView/StaffPreviewUnpublishedMobile320', anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-unpublished-mobile-375', label: 'ListingDetailView/StaffPreviewUnpublishedMobile375', anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-unpublished-mobile-390', label: 'ListingDetailView/StaffPreviewUnpublishedMobile390', anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-published-mobile-320',   label: 'ListingDetailView/StaffPreviewPublishedMobile320',  anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-published-mobile-375',   label: 'ListingDetailView/StaffPreviewPublishedMobile375',  anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--staff-preview-published-mobile-390',   label: 'ListingDetailView/StaffPreviewPublishedMobile390',  anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--public-listing-tablet-768',            label: 'ListingDetailView/PublicTablet768',               anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  { id: 'listings-listingdetailview--public-listing-desktop-1440',          label: 'ListingDetailView/PublicDesktop1440',             anchors: [{ type: 'testid', value: 'listing-detail-view', label: 'ldv' }] },
  // ── ListingFormShellView (2 — Task 238) ──
  { id: 'listings-listingformshellview--owner',    label: 'ListingFormShellView/Owner',       anchors: [{ type: 'testid', value: 'listing-form-shell-view', label: 'lfsv' }] },
  { id: 'listings-listingformshellview--staff',    label: 'ListingFormShellView/Staff',       anchors: [{ type: 'testid', value: 'listing-form-shell-view', label: 'lfsv' }] },
  // ── VerifiedPage (4 — Task 446) ──
  { id: 'auth-verifiedpage--success',              label: 'VerifiedPage/Success',             anchors: [{ type: 'testid', value: 'verified-page', label: 'verified' }] },
  { id: 'auth-verifiedpage--error-state',          label: 'VerifiedPage/ErrorState',          anchors: [{ type: 'testid', value: 'verified-page', label: 'verified' }] },
  { id: 'auth-verifiedpage--sync-fail',            label: 'VerifiedPage/SyncFail',            anchors: [{ type: 'testid', value: 'verified-page', label: 'verified' }] },
  { id: 'auth-verifiedpage--locale-stress',        label: 'VerifiedPage/LocaleStress',        anchors: [{ type: 'testid', value: 'verified-page', label: 'verified' }] },
  // ── Task 463 — AdminReportsManager full management (9) ──
  { id: 'admin-adminreportsmanager--full-management-mobile-320',  label: 'AdminReportsManager/FullManagement320',  anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'status-override-section', label: 'status-override' }] },
  { id: 'admin-adminreportsmanager--full-management-mobile-375',  label: 'AdminReportsManager/FullManagement375',  anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'status-override-section', label: 'status-override' }] },
  { id: 'admin-adminreportsmanager--full-management-mobile-390',  label: 'AdminReportsManager/FullManagement390',  anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'status-override-section', label: 'status-override' }] },
  { id: 'admin-adminreportsmanager--terminal-reopen-mobile-320',  label: 'AdminReportsManager/TerminalReopen320',  anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'reopen-btn', label: 'reopen' }] },
  { id: 'admin-adminreportsmanager--terminal-reopen-mobile-375',  label: 'AdminReportsManager/TerminalReopen375',  anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'reopen-btn', label: 'reopen' }] },
  { id: 'admin-adminreportsmanager--terminal-reopen-mobile-390',  label: 'AdminReportsManager/TerminalReopen390',  anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'reopen-btn', label: 'reopen' }] },
  { id: 'admin-adminreportsmanager--delete-confirm-mobile-320',   label: 'AdminReportsManager/DeleteConfirm320',   anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'delete-btn', label: 'delete' }] },
  { id: 'admin-adminreportsmanager--delete-confirm-mobile-375',   label: 'AdminReportsManager/DeleteConfirm375',   anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'delete-btn', label: 'delete' }] },
  { id: 'admin-adminreportsmanager--delete-confirm-mobile-390',   label: 'AdminReportsManager/DeleteConfirm390',   anchors: [{ type: 'testid', value: 'admin-reports-manager', label: 'reports-mgr' }, { type: 'testid', value: 'delete-btn', label: 'delete' }] },
  // ── Task 464 — AdminPermissionsManager (Дозволі page) ──
  { id: 'admin-adminpermissionsmanager--default',   label: 'AdminPermissionsManager/Default',  anchors: [{ type: 'testid', value: 'admin-permissions-manager', label: 'perms-mgr' }, { type: 'testid', value: 'perm-row-reports_status_override', label: 'perm-status-override' }, { type: 'testid', value: 'perm-row-reports_delete', label: 'perm-delete' }] },
  { id: 'admin-adminpermissionsmanager--mobile-320', label: 'AdminPermissionsManager/Mobile320', anchors: [{ type: 'testid', value: 'admin-permissions-manager', label: 'perms-mgr' }, { type: 'testid', value: 'perm-row-reports_status_override', label: 'perm-status-override' }, { type: 'testid', value: 'perm-row-reports_delete', label: 'perm-delete' }] },
  { id: 'admin-adminpermissionsmanager--mobile-375', label: 'AdminPermissionsManager/Mobile375', anchors: [{ type: 'testid', value: 'admin-permissions-manager', label: 'perms-mgr' }, { type: 'testid', value: 'perm-row-reports_status_override', label: 'perm-status-override' }, { type: 'testid', value: 'perm-row-reports_delete', label: 'perm-delete' }] },
  { id: 'admin-adminpermissionsmanager--mobile-390', label: 'AdminPermissionsManager/Mobile390', anchors: [{ type: 'testid', value: 'admin-permissions-manager', label: 'perms-mgr' }, { type: 'testid', value: 'perm-row-reports_status_override', label: 'perm-status-override' }, { type: 'testid', value: 'perm-row-reports_delete', label: 'perm-delete' }] },
];

// ── Loader-allowlist: story IDs whose intended content IS a loading/skeleton state ──

const LOADER_ALLOWLIST = new Set([
  'primitives-skeleton--listing-card-skeleton',
]);

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
]);

function isTransientFailure(cell) {
  if (cell.pass !== false) return false;

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

  if (rc.failReason === 'blank-canvas') return true;
  if (rc.failReason === 'sb-show-errordisplay' && TRANSIENT_FETCH_PATTERN.test(rc.failDetail || '')) return true;

  return false;
}

// ── Bitmap sanity check (Task 464, item 7) ───────────────────────────────────
// Uses sharp to detect blank/near-uniform screenshots. Returns a verdict +
// metrics so the manifest is self-describing.

async function assertScreenshotHasMeaningfulPixels(screenshotPath) {
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

    // Fail if near-uniform: nonBackgroundRatio < 0.5% AND variance < 10
    if (nonBackgroundRatio < 0.005 && variance < 10) {
      return { pass: false, failReason: 'blank-screenshot', failDetail: `near-uniform (bg=${(backgroundRatio * 100).toFixed(1)}%, var=${variance.toFixed(1)})`, metrics: result.metrics };
    }
    // Fail if almost entirely one flat colour (>99.5% single colour + very low variance)
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
      await page.screenshot({ path: screenshotPath, fullPage: false });
      cell.visualContentCheck = await assertScreenshotHasMeaningfulPixels(screenshotPath);
      return cell;
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
    cell.visualContentCheck = await assertScreenshotHasMeaningfulPixels(screenshotPath);
    if (!cell.visualContentCheck.pass) {
      cell.assertions.renderCheck.failReason = cell.assertions.renderCheck.failReason ?? cell.visualContentCheck.failReason;
      cell.assertions.renderCheck.failDetail = cell.assertions.renderCheck.failDetail || cell.visualContentCheck.failDetail;
      cell.pass = false;
      return cell;
    }

    // Short-circuit: if DOM render-check already failed, skip anchors + visual gates
    if (renderFailed) {
      cell.pass = false;
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
        return cell;
      }
    } else if (!LOADER_ALLOWLIST.has(story.id)) {
      // No anchors declared for a non-allowlisted story = config error
      cell.assertions.renderCheck = {
        ...cell.assertions.renderCheck,
        failReason: 'anchor-missing',
        failDetail: 'no anchors declared (config error)',
      };
      cell.pass = false;
      return cell;
    }

    // ════════════════════════════════════════════════════════════════
    // LAYER 2: Visual gates (only if layer 1 passed)
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

    cell.pass = noOverflow &&
      (viewport.width >= 640 || (fullWidthOk && fullWidthButtonsOk && popupBottomSheetOk));

  } catch (err) {
    cell.pass = false;
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
  console.log(`    Stories: ${ASSERT_STORIES.length} | Viewports: ${viewports.length} | Locales: ${LOCALES.length}`);
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

    const MAX_ATTEMPTS = 3;
    let flakyRecovered = 0;

    for (const story of ASSERT_STORIES) {
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
          if (cell.pass && cell.retryCount > 0) flakyRecovered++;

          if (cell.error) {
            process.stdout.write('E');
          } else {
            process.stdout.write(cell.pass ? (cell.retryCount > 0 ? '~' : '✓') : '✗');
          }

          matrix.push(cell);
        }
      }
    }

    console.log('\n');

    // ── Emit manifest.json with summary ─────────────────────────────────
    const passed  = matrix.filter(c => c.pass === true).length;
    const failed  = matrix.filter(c => c.pass === false).length;
    const total   = matrix.length;

    const summary = {
      total,
      passed,
      failed,
      loaderOnly:      matrix.filter(c => c.assertions?.renderCheck?.failReason === 'loader-only').length,
      blankCanvas:     matrix.filter(c => c.assertions?.renderCheck?.failReason === 'blank-canvas').length,
      emptyCanvas:     matrix.filter(c => c.assertions?.renderCheck?.failReason === 'empty-canvas').length,
      blankScreenshot: matrix.filter(c => c.assertions?.renderCheck?.failReason === 'blank-screenshot' || c.visualContentCheck?.failReason === 'blank-screenshot').length,
      anchorMissing:   matrix.filter(c => c.assertions?.renderCheck?.failReason === 'anchor-missing').length,
    };

    const manifestPath = join(outputDir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify({ timestamp, summary, matrix }, null, 2), 'utf8');

    console.log(`Results: ${passed}/${total} PASS, ${failed} FAIL`);
    if (summary.loaderOnly > 0) console.log(`  loader-only: ${summary.loaderOnly}`);
    if (summary.blankCanvas > 0) console.log(`  blank-canvas: ${summary.blankCanvas}`);
    if (summary.emptyCanvas > 0) console.log(`  empty-canvas: ${summary.emptyCanvas}`);
    if (summary.blankScreenshot > 0) console.log(`  blank-screenshot: ${summary.blankScreenshot}`);
    if (summary.anchorMissing > 0) console.log(`  anchor-missing: ${summary.anchorMissing}`);
    console.log(`flaky-recovered: ${flakyRecovered}`);
    if (flakyRecovered > 0) {
      console.log('  Recovered cells (passed only after retry):');
      for (const cell of matrix.filter(c => c.pass && c.retryCount > 0)) {
        console.log(`    ${cell.story} × ${cell.locale} × ${cell.viewport} (retries: ${cell.retryCount})`);
      }
    }
    console.log(`Manifest: .screenshots/rendered-assert/${timestamp}/manifest.json`);
    console.log(`PNGs: .screenshots/rendered-assert/${timestamp}/*.png`);

    if (failed > 0) {
      console.error('\n❌ Failed cells:');
      for (const cell of matrix.filter(c => !c.pass)) {
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
        }
      }
      // Task 418 REWORK (P1-a): set exitCode + return (not process.exit) so the
      // `finally` below still runs `browser?.close()` / `server?.close()` on FAIL.
      process.exitCode = 1;
      return;
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
