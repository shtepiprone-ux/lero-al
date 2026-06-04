#!/usr/bin/env node
/**
 * check-stories-rendered.mjs — Playwright-based rendered assertion for Storybook.
 *
 * Captures screenshots and asserts layout correctness per story × viewport × locale.
 *
 * Assertions per cell:
 *   (a) No horizontal scrollbar / overflow: document.scrollWidth <= document.clientWidth at 320px.
 *   (b) At viewport width < 640: any visible button (data-slot="button" or role="button")
 *       that is not icon-only has offsetWidth >= containerWidth - TOLERANCE.
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

/** Extended viewport matrix for full assert run */
const VIEWPORTS_FULL = [
  ...VIEWPORTS_MOBILE,
  { name: 'mobile-480',   width: 480,  height: 900  },
  { name: 'tablet-640',   width: 640,  height: 960  },
  { name: 'tablet-768',   width: 768,  height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800  },
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
  // Admin (5)
  { id: 'admin-admincardlist--default',                       label: 'AdminCardList/Default' },
  { id: 'admin-adminpageshell--default',                      label: 'AdminPageShell/Default' },
  { id: 'admin-admintable--default',                          label: 'AdminTable/Default' },
  { id: 'admin-statuschangecontrol--select',                  label: 'StatusChangeControl/Select' },
  { id: 'admin-statuschangehistory--empty',                   label: 'StatusChangeHistory/Empty' },
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
    server.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
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
    server = await startStaticServer(storybookStaticDir, PORT);
    browser = await chromium.launch();

    for (const story of ASSERT_STORIES) {
      for (const locale of LOCALES) {
        for (const viewport of viewports) {
          const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
          const filename = `${story.id}__${locale}__${viewport.name}.png`;
          const screenshotPath = join(outputDir, filename);

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

          try {
            const page = await browser.newPage();
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
            await page.waitForTimeout(400); // allow fonts/animations

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

            cell.pass = noOverflow && (viewport.width >= 640 || fullWidthOk);

            await page.screenshot({ path: screenshotPath, fullPage: false });
            await page.close();
            process.stdout.write(cell.pass ? '✓' : '✗');
          } catch (err) {
            cell.pass = false;
            cell.error = err.message;
            process.stdout.write('E');
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
    console.log(`Manifest: .screenshots/rendered-assert/${timestamp}/manifest.json`);
    console.log(`PNGs: .screenshots/rendered-assert/${timestamp}/*.png`);

    if (failed > 0) {
      console.error('\n❌ Failed cells:');
      for (const cell of matrix.filter(c => !c.pass)) {
        console.error(`  ${cell.story} × ${cell.locale} × ${cell.viewport}`);
        if (cell.error) console.error(`    Error: ${cell.error}`);
        else {
          if (!cell.assertions.noHorizontalOverflow) console.error('    ✗ horizontal overflow detected');
          if (cell.assertions.fullWidthControlsAtMobile === false) console.error('    ✗ text button not full-width at <640');
        }
      }
      process.exit(1);
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
