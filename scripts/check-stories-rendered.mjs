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
  // ── Planted visual violations (9 — Task 467 + R1/R2 + C2/R4) ──
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
  'text-clipped', 'offscreen-control', 'outside-container',
  'element-overlap', 'bottomsheet-overflow', 'unstyled-render',
  // self-clipped: DEFERRED (F-H) — documented but not implemented in geometry-integrity.mjs;
  // counter kept in summary for future implementation, structurally 0 until then.
]);

// ── Geometry allowlist: intentional overlaps / escapes (Task 467) ─────────
// Each entry: { storyId, selector?, reason }. Matching violations are suppressed.
const GEOMETRY_ALLOWLIST = [
  // Badge-on-avatar, drag-handle overlaps, etc. — add with documented reason.
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
    } else if (!LOADER_ALLOWLIST.has(story.id) && !story.geometryOnly) {
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

    const hardPass = noOverflow && !geometryHardFail &&
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
    // Read all story IDs from the built Storybook index for geometry-only checks.
    const indexPath = join(storybookStaticDir, 'index.json');
    let geometryOnlyStories = [];
    try {
      const indexData = JSON.parse(await readFile(indexPath, 'utf8'));
      const assertIds = new Set(ASSERT_STORIES.map(s => s.id));
      geometryOnlyStories = Object.values(indexData.entries)
        .filter(e => e.type === 'story' && !assertIds.has(e.id))
        .map(e => ({ id: e.id, label: `${e.title}/${e.name}`, anchors: [], geometryOnly: true }));
    } catch (err) {
      console.error(`❌ Cannot read ${indexPath} for global story enumeration: ${err.message}`);
      console.error('   The geometry layer requires story enumeration from the built index — aborting.');
      process.exitCode = 1;
      return;
    }

    // Geometry-only stories use mobile viewports only (320/375/390)
    const geometryViewports = VIEWPORTS_MOBILE;
    const totalAssertCells = ASSERT_STORIES.length * LOCALES.length * viewports.length;
    const totalGeometryCells = geometryOnlyStories.length * LOCALES.length * geometryViewports.length;
    console.log(`    Geometry-only stories: ${geometryOnlyStories.length} (${totalGeometryCells} cells at 320/375/390 × 4 locales)`);
    console.log('');

    const MAX_ATTEMPTS = 3;
    let flakyRecovered = 0;

    // ── Phase 1: ASSERT_STORIES (full Layer 1 + 2 + 3, anchors required) ──
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
    if (geometryOnlyStories.length > 0 && !FAST_MODE) {
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

    // ── Emit manifest.json with summary ─────────────────────────────────
    const outOfRange = matrix.filter(c => c.verdict === 'out-of-range').length;
    const passed  = matrix.filter(c => c.verdict === 'pass').length;
    // Defensive: any cell with pass=false that isn't explicitly ambiguous or out-of-range is a hard fail
    const failed  = matrix.filter(c => c.verdict === 'fail' || (c.pass === false && c.verdict !== 'ambiguous' && c.verdict !== 'out-of-range')).length;
    const ambiguousOnlyCount = matrix.filter(c => c.verdict === 'ambiguous').length;
    const total   = matrix.length;

    const summary = {
      total,
      passed,
      failed,
      outOfRange,
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

    // ── Generate per-cell inventory markdown from manifest ─────────────
    const inventoryPath = join(ROOT, 'docs', 'governance-reports', '2026-06-19-task467-storybook-visual-defect-inventory.md');
    const inventoryLines = [
      '# Task 467 — Storybook visual-defect inventory (geometry + style integrity layers)',
      '',
      `**Date:** ${new Date().toISOString().slice(0, 10)} | **Harness:** \`scripts/check-stories-rendered.mjs\` + \`scripts/geometry-integrity.mjs\` (Task 467 R1–R4/B1–B8)`,
      `**Run mode:** ${FAST_MODE ? '--fast' : 'full'} (320/375/390 × sq/en/uk/it) | **Scope:** ${FAST_MODE ? 'ASSERT_STORIES (' + ASSERT_STORIES.length + ' stories, ' + totalAssertCells + ' cells)' : 'Global enumeration (' + (ASSERT_STORIES.length + geometryOnlyStories.length) + ' stories, ' + total + ' cells)'}`,
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
        reasons.push(`${v.failReason}: ${v.selector}`);
      }
      const reasonStr = reasons.join('; ') || '(render/visual)';
      const firstViolation = c.assertions?.visualIntegrity?.violations?.[0];
      inventoryLines.push(`| \`${c.storyId}\` | ${c.locale} | ${c.viewport} | \`${c.screenshot}\` | ${reasonStr} | ${firstViolation?.selector ?? ''} | ${firstViolation?.label ?? ''} |`);
    }
    if (hardCells.length === 0) inventoryLines.push('| *(none)* | | | | | | |');

    inventoryLines.push('', '---', '', '## Bucket 2: Needs-owner-decision (ambiguous third state)', '',
      '| Story ID | Locale | Viewport | Screenshot | Fail Reason | Selector | Label | Reason |',
      '|---|---|---|---|---|---|---|---|');
    const ambiguousCells = matrix.filter(c => c.verdict === 'ambiguous' && !c.storyId?.startsWith('planted-'));
    for (const c of ambiguousCells) {
      for (const a of (c.assertions?.visualIntegrity?.ambiguous ?? [])) {
        inventoryLines.push(`| \`${c.storyId}\` | ${c.locale} | ${c.viewport} | \`${c.screenshot}\` | ${a.failReason} | ${a.selector} | ${a.label} | ${a.reason ?? ''} |`);
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
      `- **Run timestamp:** ${timestamp}`,
    );

    writeFileSync(inventoryPath, inventoryLines.join('\n') + '\n', 'utf8');
    console.log(`Inventory: docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`);

    console.log(`Results: ${passed}/${total} PASS, ${failed} FAIL${outOfRange > 0 ? `, ${outOfRange} OUT-OF-RANGE` : ''}${ambiguousOnlyCount > 0 ? `, ${ambiguousOnlyCount} AMBIGUOUS (needs-owner-decision)` : ''}`);
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
      // Task 418 REWORK (P1-a): set exitCode + return (not process.exit) so the
      // `finally` below still runs `browser?.close()` / `server?.close()` on FAIL.
      process.exitCode = 1;
      return;
    }

    if (outOfRange > 0) {
      console.log(`\nℹ️  ${outOfRange} cells are out-of-viewport-range (verdict=out-of-range, not product defects).`);
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
