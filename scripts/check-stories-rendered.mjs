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
  // Primitives (14)
  { id: 'primitives-badge--default',                          label: 'Badge/Default' },
  { id: 'primitives-button--default',                         label: 'Button/Default' },
  { id: 'primitives-checkbox--default',                       label: 'Checkbox/Default' },
  { id: 'primitives-command--inline',                         label: 'Command/Inline' },
  { id: 'primitives-dialog--default',                         label: 'Dialog/Default' },
  { id: 'primitives-dropdownmenu--default',                   label: 'DropdownMenu/Default' },
  { id: 'primitives-input--default',                          label: 'Input/Default' },
  { id: 'primitives-passwordinput--default',                  label: 'PasswordInput/Default' },
  { id: 'primitives-passwordrequirementshint--idle',          label: 'PasswordHint/Idle' },
  { id: 'primitives-popover--default',                        label: 'Popover/Default' },
  { id: 'primitives-select--default',                         label: 'Select/Default' },
  { id: 'primitives-sheet--filter-sheet-right',               label: 'Sheet/FilterRight' },
  { id: 'primitives-skeleton--listing-card-skeleton',         label: 'Skeleton/ListingCard' },
  { id: 'primitives-tabs--default',                           label: 'Tabs/Default' },
  // Shared (1)
  { id: 'shared-combobox--button-variant',                    label: 'Combobox/ButtonVariant' },
  // Admin (19 — 5 existing + 14 new Task 410 harness stories)
  { id: 'admin-admincardlist--default',                       label: 'AdminCardList/Default' },
  { id: 'admin-adminpageshell--default',                      label: 'AdminPageShell/Default' },
  { id: 'admin-admintable--default',                          label: 'AdminTable/Default' },
  { id: 'admin-statuschangecontrol--select',                  label: 'StatusChangeControl/Select' },
  { id: 'admin-statuschangehistory--empty',                   label: 'StatusChangeHistory/Empty' },
  { id: 'admin-adminlocaleswitcher--default',                 label: 'AdminLocaleSwitcher/Default' },
  { id: 'admin-adminmobileheader--default',                   label: 'AdminMobileHeader/Default' },
  { id: 'admin-adminuseravatar--view-placeholder',            label: 'AdminUserAvatar/ViewPlaceholder' },
  { id: 'admin-adminuseravatar--edit-mode',                   label: 'AdminUserAvatar/EditMode' },
  { id: 'admin-adminsidebar--desktop',                        label: 'AdminSidebar/Desktop' },
  { id: 'admin-adminsidebar--mobile-drawer-open',             label: 'AdminSidebar/MobileDrawerOpen' },
  { id: 'admin-adminsettings--default',                       label: 'AdminSettings/Default' },
  { id: 'admin-admincurrenciesmanager--default',              label: 'AdminCurrenciesManager/Default' },
  { id: 'admin-adminexchangeprovidersmanager--default',       label: 'AdminExchangeProvidersManager/Default' },
  { id: 'admin-adminpropertytypesmanager--default',           label: 'AdminPropertyTypesManager/Default' },
  { id: 'admin-admincompaniesmanager--default',               label: 'AdminCompaniesManager/Default' },
  { id: 'admin-adminsupportmanager--default',                 label: 'AdminSupportManager/Default' },
  { id: 'admin-adminemailtemplatesmanager--default',          label: 'AdminEmailTemplatesManager/Default' },
  { id: 'admin-adminlistingstable--default',                  label: 'AdminListingsTable/Default' },
  { id: 'admin-adminuserstable--default',                     label: 'AdminUsersTable/Default' },
  { id: 'admin-adminuserprofile--default',                    label: 'AdminUserProfile/Default' },
  // Layout (4)
  { id: 'layout-filterbar--default',                          label: 'FilterBar/Default' },
  { id: 'layout-pageheader--default',                         label: 'PageHeader/Default' },
  { id: 'layout-pageshell--default',                          label: 'PageShell/Default' },
  { id: 'layout-section--with-title-and-description',         label: 'Section/WithTitleAndDesc' },
  // System (5)
  { id: 'system-adminlayout--admin-toolbar',                  label: 'AdminLayout/AdminToolbar' },
  { id: 'system-containers--container-wide',                  label: 'Containers/Wide' },
  { id: 'system-emptystate--no-listings',                     label: 'EmptyState/NoListings' },
  { id: 'system-listinggrid--desktop',                        label: 'ListingGrid/Desktop' },
  { id: 'system-recentlyviewedsection--populated',            label: 'RVS/Populated' },
  // Open-state overlays (7 — Task 421 Slice 6, assertion (e) targets)
  { id: 'primitives-dialog--mobile-full-width',               label: 'Dialog/MobileFullWidth' },
  { id: 'primitives-select--mobile-bottom-sheet',             label: 'Select/MobileBottomSheet' },
  { id: 'primitives-popover--mobile-bottom-sheet',            label: 'Popover/MobileBottomSheet' },
  { id: 'primitives-dropdownmenu--mobile-bottom-sheet',       label: 'DropdownMenu/MobileBottomSheet' },
  { id: 'primitives-command--mobile-bottom-sheet',            label: 'Command/MobileBottomSheet' },
  { id: 'primitives-sheet--mobile-bottom-sheet',              label: 'Sheet/MobileBottomSheet' },
  { id: 'primitives-navigationmenu--mobile-open',             label: 'NavigationMenu/MobileOpen' },
  // Notification bell popup (Task 424 — §26.2 bottom-sheet conversion)
  { id: 'notifications-notificationcenter--default',          label: 'NotificationCenter/Default' },
  { id: 'notifications-notificationcenter--mobile-bottom-sheet', label: 'NotificationCenter/MobileBottomSheet' },
  { id: 'notifications-notificationcenter--empty',             label: 'NotificationCenter/Empty' },
  // ListingDetailView (Task 237 — admin moderation preview, shared layout evidence)
  { id: 'listings-listingdetailview--public-listing',                    label: 'ListingDetailView/Public' },
  { id: 'listings-listingdetailview--staff-preview-unpublished',         label: 'ListingDetailView/StaffPreviewUnpublished' },
  { id: 'listings-listingdetailview--staff-preview-published',           label: 'ListingDetailView/StaffPreviewPublished' },
  { id: 'listings-listingdetailview--public-listing-mobile-320',         label: 'ListingDetailView/PublicMobile320' },
  { id: 'listings-listingdetailview--public-listing-mobile-375',         label: 'ListingDetailView/PublicMobile375' },
  { id: 'listings-listingdetailview--public-listing-mobile-390',         label: 'ListingDetailView/PublicMobile390' },
  { id: 'listings-listingdetailview--staff-preview-unpublished-mobile-320', label: 'ListingDetailView/StaffPreviewUnpublishedMobile320' },
  { id: 'listings-listingdetailview--staff-preview-unpublished-mobile-375', label: 'ListingDetailView/StaffPreviewUnpublishedMobile375' },
  { id: 'listings-listingdetailview--staff-preview-unpublished-mobile-390', label: 'ListingDetailView/StaffPreviewUnpublishedMobile390' },
  { id: 'listings-listingdetailview--staff-preview-published-mobile-320', label: 'ListingDetailView/StaffPreviewPublishedMobile320' },
  { id: 'listings-listingdetailview--staff-preview-published-mobile-375', label: 'ListingDetailView/StaffPreviewPublishedMobile375' },
  { id: 'listings-listingdetailview--staff-preview-published-mobile-390', label: 'ListingDetailView/StaffPreviewPublishedMobile390' },
  { id: 'listings-listingdetailview--public-listing-tablet-768',         label: 'ListingDetailView/PublicTablet768' },
  { id: 'listings-listingdetailview--public-listing-desktop-1440',       label: 'ListingDetailView/PublicDesktop1440' },
  // ListingFormShellView (Task 238 — edit/create side-panel + status control)
  { id: 'listings-listingformshellview--owner',                          label: 'ListingFormShellView/Owner' },
  { id: 'listings-listingformshellview--staff',                          label: 'ListingFormShellView/Staff' },
];

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
async function waitForStoryReady(page, timeoutMs = 5000, pollMs = 150) {
  const start = Date.now();
  for (;;) {
    const state = await page.evaluate(() => {
      if (document.body.classList.contains('sb-show-errordisplay')) return { ready: true };
      const root = document.querySelector('#storybook-root');
      if (!root || root.children.length === 0) return { ready: false };
      const rect = root.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return { ready: false };
      return { ready: true };
    });
    if (state.ready) return;
    if (Date.now() - start >= timeoutMs) return;
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

function isTransientFailure(cell) {
  if (cell.pass !== false) return false;

  // Hard navigation/network error from the harness's own server — retry rather
  // than emitting a false FAIL (item 3).
  if (cell.error) {
    return TRANSIENT_NETWORK_PATTERN.test(cell.error) || TRANSIENT_FETCH_PATTERN.test(cell.error);
  }

  const rc = cell.assertions?.renderCheck;
  if (!rc) return false;
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
    pass: null,
    error: null,
  };

  // Hoisted so the `finally` below can always close the page — on the happy
  // path, on a thrown exception (e.g. goto timeout), and on a render-fail
  // (Task 418 REWORK, P1-b: prevents page leaks under retry).
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
        // Filter to render-failure patterns only — avoid flagging benign browser noise
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
    await page.waitForTimeout(400); // allow fonts/animations

    // ── Readiness wait (Task 418, item 2): wait for the story root to be
    // actually rendered/non-blank before assessing/capturing the cell. ──
    await waitForStoryReady(page);

    // ── Assertion (c): Render-failure detection (Part C, Task 411) ─
    // A screenshot of a Storybook error screen is NOT rendered proof.
    const renderResult = await page.evaluate(() => {
      // Storybook sets 'sb-show-errordisplay' on <body> when its error display is shown
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
      // Blank canvas: decorators rendered but story itself produced no elements
      const root = document.querySelector('#storybook-root');
      if (root && root.children.length === 0)
        return { failed: true, reason: 'blank-canvas', detail: '' };
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

    // ── Assertion (a): No horizontal overflow at 320 ──────────────
    const noOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    cell.assertions.noHorizontalOverflow = noOverflow;

    // ── Assertion (b): Full-width FORM CONTROLS at <640 ──────────
    // Checks that Select triggers, Tabs lists, and form inputs fill their
    // DIRECT PARENT's content width (not the outer canvas width) —  this
    // correctly handles story wrappers that add inner padding/max-width.
    //
    // Does NOT check buttons: too many edge-cases (flex-1, w-auto overrides,
    // ghost/icon buttons, cards with inline ID badges, etc.).
    // Horizontal overflow check (a) above is the primary overflow guard.
    let fullWidthOk = true;
    if (viewport.width < 640) {
      fullWidthOk = await page.evaluate((tolerance) => {
        function parentContentWidth(el) {
          const p = el.parentElement;
          if (!p) return 0;
          const s = window.getComputedStyle(p);
          return p.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
        }

        // SelectTrigger must fill its direct parent container
        for (const el of document.querySelectorAll('[data-slot="select-trigger"]')) {
          if (el.closest('[role="dialog"]')) continue;
          const pw = parentContentWidth(el);
          if (pw > 0 && el.offsetWidth < pw - tolerance) return false;
        }

        // TabsList must fill its direct parent container
        for (const el of document.querySelectorAll('[data-slot="tabs-list"]')) {
          const pw = parentContentWidth(el);
          if (pw > 0 && el.offsetWidth < pw - tolerance) return false;
        }

        // Form inputs must fill their parent. Skip:
        //   - inputs with offsetWidth ≤ 1 (hidden form-submission inputs)
        //   - inputs inside overlays
        //   - micro-container parents (< 50px)
        //   - inputs inside flex rows with siblings (input-group with icon prefix/
        //     suffix — the icon takes some width; input fills the REMAINING space,
        //     which is correct and intentional; e.g. CommandInput, search fields)
        for (const inp of document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input:not([type])')) {
          if (inp.offsetWidth <= 1) continue; // hidden internal input
          if (inp.closest('[role="dialog"]')) continue;
          const parent = inp.parentElement;
          if (!parent) continue;
          // Skip inputs inside flex containers with siblings (icon-group pattern)
          const parentFlex = window.getComputedStyle(parent).display === 'flex';
          if (parentFlex && parent.children.length > 1) continue;
          const pw = parentContentWidth(inp);
          if (pw < 50) continue; // micro-container
          if (pw > 0 && inp.offsetWidth < pw - tolerance) return false;
        }

        return true;
      }, FULL_WIDTH_TOLERANCE);
    }
    cell.assertions.fullWidthControlsAtMobile = viewport.width < 640 ? fullWidthOk : null;

    // ── Assertion (d): Full-width TEXT BUTTONS at <640 ───────────
    // Every visible [data-slot="button"]:not([data-icon-only]) — excluding
    // members of [data-slot="button-group"] — must fill its direct parent's
    // content width. Text CTA/action buttons inside open overlays (dialog,
    // sheet, popover, dropdown, select) ARE checked — no blanket overlay skip.
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
          if (el.offsetWidth <= 1) continue; // hidden / not rendered
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
    // Every visible open overlay content slot must be edge-to-edge full-width
    // and bottom-anchored. data-side="left" sheets (e.g. AdminSidebar drawer,
    // design-system.md §26.6) are skipped.
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
            if (rect.width === 0 || rect.height === 0) continue; // not open/visible

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

    cell.pass = !renderFailed && noOverflow &&
      (viewport.width >= 640 || (fullWidthOk && fullWidthButtonsOk && popupBottomSheetOk));

    await page.screenshot({ path: screenshotPath, fullPage: false });
  } catch (err) {
    cell.pass = false;
    cell.error = err.message;
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

    // ── Emit manifest.json ────────────────────────────────────────────────
    const manifestPath = join(outputDir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify({ timestamp, matrix }, null, 2), 'utf8');

    // ── Summary ───────────────────────────────────────────────────────────
    const passed  = matrix.filter(c => c.pass === true).length;
    const failed  = matrix.filter(c => c.pass === false).length;
    const total   = matrix.length;

    console.log(`Results: ${passed}/${total} PASS, ${failed} FAIL`);
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
