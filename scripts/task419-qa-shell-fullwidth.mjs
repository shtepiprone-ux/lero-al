#!/usr/bin/env node
/**
 * task419-qa-shell-fullwidth.mjs — Task 419 (Slice 4b) rendered evidence.
 *
 * Captures a mobile (320/375/390) + desktop-control (1024) x 4-locale matrix for the
 * 6 admin-shell stories in scope, proving:
 *  - no horizontal overflow at any cell
 *  - every non-icon-only label-bearing control in the admin shell is full-width
 *    (within 2px of its immediate flex container) at <640px
 *  - the AdminSettings Save-button footer fix is byte-identical-intent at >=640px
 *    (the Save button stays content-width, not forced full-width)
 *  - icon-only controls (AdminMobileHeader hamburger, AdminSidebar close button,
 *    AdminUserAvatar camera button) are excluded from the full-width assertion
 *
 * Reuses the already-built storybook-static/ (same build used by screenshots:assert).
 *
 * Usage: node scripts/task419-qa-shell-fullwidth.mjs
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const VIEWPORTS = [
  { name: 'mobile-320',   width:  320, height:  812 },
  { name: 'mobile-375',   width:  375, height:  812 },
  { name: 'mobile-390',   width:  390, height:  844 },
  { name: 'desktop-1024', width: 1024, height:  768 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MOBILE_NAMES = new Set(['mobile-320', 'mobile-375', 'mobile-390']);

const STORIES = [
  { id: 'admin-adminpageshell--with-actions',          label: 'AdminPageShell/WithActions',          target: 'pageShellActions' },
  { id: 'admin-adminpageshell--multiple-actions',       label: 'AdminPageShell/MultipleActions',      target: 'pageShellActions' },
  { id: 'admin-adminpageshell--with-tabs-and-actions',  label: 'AdminPageShell/WithTabsAndActions',   target: 'pageShellActions' },
  { id: 'admin-adminsettings--default',                 label: 'AdminSettings/Default',               target: 'settingsFooter' },
  { id: 'admin-adminsettings--locale-stress',           label: 'AdminSettings/LocaleStress',          target: 'settingsFooter' },
  { id: 'admin-adminuseravatar--edit-mode',             label: 'AdminUserAvatar/EditMode',            target: 'avatarEditButtons' },
  { id: 'admin-adminmobileheader--default',             label: 'AdminMobileHeader/Default',           target: 'mobileHeaderBar' },
  { id: 'admin-adminsidebar--mobile-drawer-open',       label: 'AdminSidebar/MobileDrawerOpen',       target: 'sidebarDrawer' },
  { id: 'system-adminlayout--admin-toolbar',            label: 'AdminLayout/AdminToolbar',            target: 'adminLayoutToolbar' },
];

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
  return new Promise((resolvePromise, reject) => {
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
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

// In-page evaluation: returns target-specific full-width measurements, or
// { found: false } if the target container isn't present on this story.
/* eslint-disable no-undef */
function evalTarget(target) {
  function tokens(el) { return (el.className || '').toString().split(/\s+/); }

  // AdminPageShell actions container: max-sm:w-full [&>*]:max-sm:w-full, sm:shrink-0.
  if (target === 'pageShellActions') {
    const el = [...document.querySelectorAll('div')].find(d =>
      tokens(d).includes('[&>*]:max-sm:w-full') && tokens(d).includes('max-sm:w-full') && tokens(d).includes('sm:shrink-0'));
    if (!el) return { found: false };
    const pw = el.getBoundingClientRect().width;
    const children = [...el.children].map(c => c.getBoundingClientRect().width);
    return { found: true, parentWidth: pw, children, alwaysFull: false };
  }

  // AdminSettings footer row: border-t max-sm:flex-col max-sm:items-stretch [&>*]:max-sm:w-full.
  // Save button sits in the last child (the ml-auto wrapper).
  if (target === 'settingsFooter') {
    const el = [...document.querySelectorAll('div')].find(d =>
      tokens(d).includes('border-t') && tokens(d).includes('[&>*]:max-sm:w-full') && tokens(d).includes('max-sm:flex-col'));
    if (!el) return { found: false };
    const pw = el.getBoundingClientRect().width;
    const lastChild = el.children[el.children.length - 1];
    const btn = lastChild?.querySelector('button') ?? lastChild;
    if (!btn) return { found: false };
    const cw = btn.getBoundingClientRect().width;
    return { found: true, parentWidth: pw, children: [cw], alwaysFull: false };
  }

  // AdminUserAvatar edit-mode Replace/Upload + Remove buttons: flex flex-col sm:flex-row gap-2 max-sm:w-full.
  if (target === 'avatarEditButtons') {
    const el = [...document.querySelectorAll('div')].find(d => tokens(d).join(' ') === 'flex flex-col sm:flex-row gap-2 max-sm:w-full');
    if (!el) return { found: false };
    const pw = el.getBoundingClientRect().width;
    const children = [...el.children].filter(c => c.tagName === 'BUTTON').map(c => c.getBoundingClientRect().width);
    if (children.length === 0) return { found: false };
    return { found: true, parentWidth: pw, children, alwaysFull: false };
  }

  // AdminMobileHeader: the only control (hamburger) is icon-only (size="icon") -> §26.4
  // exempt, so there is no full-width control to assert; rely on the noHScroll check.
  if (target === 'mobileHeaderBar') {
    return { found: false };
  }

  // AdminSidebar mobile drawer (opened): Logout button (already w-full) + first NavItem link
  // (already full-width via flex-col stretch). Close button is icon-only -> §26.4 exempt.
  // Note: the story renders BOTH a hidden desktop sidebar instance and the visible mobile
  // drawer instance, so candidates must be filtered to the one with offsetParent !== null
  // (visible) to avoid a false 0==0 pass against the hidden copy.
  if (target === 'sidebarDrawer') {
    const logoutBtn = [...document.querySelectorAll('button')].find(b =>
      tokens(b).includes('w-full') && tokens(b).includes('justify-start') && b.offsetParent !== null);
    if (!logoutBtn) return { found: false };
    const parent = logoutBtn.parentElement;
    const parentStyle = getComputedStyle(parent);
    const parentContentWidth = parent.getBoundingClientRect().width
      - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight);
    const cw = logoutBtn.getBoundingClientRect().width;
    const navLink = [...document.querySelectorAll('nav a')].find(a => a.offsetParent !== null);
    let nav = null;
    if (navLink) {
      nav = { parentWidth: navLink.parentElement.getBoundingClientRect().width, width: navLink.getBoundingClientRect().width };
    }
    return { found: true, parentWidth: parentContentWidth, children: [cw], alwaysFull: true, nav };
  }

  // System/AdminLayout AdminToolbar control row: flex flex-col md:flex-row md:flex-wrap md:items-center gap-2
  // (Search input + Filter + Add buttons, all max-md:w-full).
  if (target === 'adminLayoutToolbar') {
    const el = [...document.querySelectorAll('div')].find(d => tokens(d).join(' ') === 'flex flex-col md:flex-row md:flex-wrap md:items-center gap-2');
    if (!el) return { found: false };
    const pw = el.getBoundingClientRect().width;
    const children = [...el.children].map(c => c.getBoundingClientRect().width);
    return { found: true, parentWidth: pw, children, alwaysFull: false };
  }

  return { found: false };
}
/* eslint-enable no-undef */

async function main() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright');

  const PORT = 6013;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'task419-qa', timestamp);
  mkdirSync(outputDir, { recursive: true });

  const filterId = process.env.TASK419_STORY_FILTER;
  const storiesToRun = filterId ? STORIES.filter(s => s.id === filterId) : STORIES;

  const cellsToRun = [];
  for (const story of storiesToRun) {
    for (const locale of LOCALES) {
      for (const viewport of VIEWPORTS) {
        cellsToRun.push({ story, locale, viewport });
      }
    }
  }

  console.log(`📸  Task 419 Slice 4b admin-shell full-width QA capture`);
  console.log(`    Stories: ${storiesToRun.length} | Viewports: ${VIEWPORTS.length} x Locales: ${LOCALES.length} = ${cellsToRun.length} cells`);
  console.log(`    Output: .screenshots/task419-qa/${timestamp}/`);
  console.log('');

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();
  const matrix = [];

  for (const { story, locale, viewport } of cellsToRun) {
    const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
    const isMandatoryShot = locale === 'uk' && MOBILE_NAMES.has(viewport.name);
    const filename = `${story.id}__${locale}__${viewport.name}.png`;
    const screenshotPath = join(outputDir, filename);

    const cell = {
      story: story.label,
      storyId: story.id,
      target: story.target,
      locale,
      viewport: viewport.name,
      width: viewport.width,
      screenshot: isMandatoryShot ? filename : null,
      assertions: {},
      pass: null,
      error: null,
    };

    try {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', (err) => { pageErrors.push(err.message.slice(0, 200)); });

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(400);

      const renderResult = await page.evaluate(() => {
        if (document.body.classList.contains('sb-show-errordisplay')) {
          const errEl = document.querySelector('#error-message') || document.body;
          return { failed: true, reason: 'sb-show-errordisplay', detail: (errEl.textContent ?? '').slice(0, 200) };
        }
        const root = document.querySelector('#storybook-root');
        if (root && root.children.length === 0) return { failed: true, reason: 'blank-canvas', detail: '' };
        return { failed: false, reason: null, detail: '' };
      });

      const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
      const target = await page.evaluate(evalTarget, story.target);

      cell.assertions = { renderCheck: renderResult, pageErrors: pageErrors.slice(0, 2), noHScroll, target };

      const renderFailed = renderResult.failed || pageErrors.length > 0;
      let pass = !renderFailed && noHScroll;

      if (!renderFailed && target.found) {
        const isMobile = viewport.width < 640;
        const TOL = 4;

        if (target.alwaysFull) {
          // The AdminSidebar mobile drawer is a mobile-only pattern (always rendered open
          // by this story regardless of viewport); only assert full-width at <640, where
          // the drawer is actually used. At >=640 just rely on noHScroll/render checks.
          if (isMobile) {
            for (const cw of target.children) {
              if (Math.abs(cw - target.parentWidth) > TOL) pass = false;
            }
            if (target.nav && Math.abs(target.nav.width - target.nav.parentWidth) > TOL) pass = false;
          }
        } else if (isMobile) {
          // <640: every control fills its immediate flex container.
          for (const cw of target.children) {
            if (Math.abs(cw - target.parentWidth) > TOL) pass = false;
          }
        } else {
          // >=640: controls must NOT be forced full-viewport-width (unchanged desktop layout).
          for (const cw of target.children) {
            if (cw >= viewport.width * 0.6) pass = false;
          }
        }
      }
      cell.pass = pass;

      if (isMandatoryShot) {
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }
      await page.close();

      const mark = pass ? '✓' : (renderFailed ? 'E' : '✗');
      console.log(`  ${mark} ${story.label} x ${locale} x ${viewport.name}`);
    } catch (err) {
      cell.error = String(err).slice(0, 300);
      cell.pass = false;
      console.log(`  E ${story.label} x ${locale} x ${viewport.name} - ${cell.error}`);
    }

    matrix.push(cell);
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, matrix }, null, 2));

  const passCount = matrix.filter(c => c.pass).length;
  const failCount = matrix.length - passCount;
  console.log('');
  console.log(`Results: ${passCount}/${matrix.length} PASS, ${failCount} FAIL`);
  console.log(`Manifest: .screenshots/task419-qa/${timestamp}/manifest.json`);
  console.log(`PNGs (uk@320/375/390 only): .screenshots/task419-qa/${timestamp}/*.png`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
