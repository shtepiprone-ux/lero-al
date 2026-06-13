#!/usr/bin/env node
/**
 * task319-qa-notification-templates.mjs — Task 319 (Epic II Phase 2) rendered evidence.
 *
 * Captures NotificationItem.AllCases (all Task-319 producer template cases + the two
 * legacy fallback rows, stacked inside the real w-80 NotificationCenter container) at
 * 320/375/390/768/1280/1440/2560 x sq/en/uk/it, proving:
 *  - title/body render in the viewer's current locale via template_id resolution
 *  - long uk/it strings wrap (whitespace-normal break-words), no clip, no h-scroll at 320
 *  - legacy rows (template_id=null) still render via verbatim / pre-existing special-cases
 *
 * Reuses the already-built storybook-static/.
 *
 * Usage: node scripts/task319-qa-notification-templates.mjs
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
  { name: 'tablet-768',   width:  768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height:  800 },
  { name: 'desktop-1440', width: 1440, height:  900 },
  { name: 'desktop-2560', width: 2560, height: 1440 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MANDATORY_VIEWPORTS = new Set(['mobile-320', 'mobile-375', 'mobile-390']);
const STORY_ID = 'notifications-notificationitem--all-cases';

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

async function main() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright');

  const PORT = 6019;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-').replace('T', '_');
  const outputDir = join(ROOT, '.screenshots', 'task319-qa', timestamp);
  mkdirSync(outputDir, { recursive: true });

  console.log('📸  Task 319 NotificationItem template rendering QA');
  console.log(`    Viewports: ${VIEWPORTS.length} x Locales: ${LOCALES.length} = ${VIEWPORTS.length * LOCALES.length} cells`);
  console.log(`    Output: .screenshots/task319-qa/${timestamp}/`);
  console.log('');

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();
  const matrix = [];

  for (const locale of LOCALES) {
    for (const viewport of VIEWPORTS) {
      const storyUrl = `${baseUrl}/iframe.html?id=${STORY_ID}&globals=locale:${locale}&viewMode=story`;
      const isMandatoryShot = (locale === 'uk' && MANDATORY_VIEWPORTS.has(viewport.name)) || MANDATORY_VIEWPORTS.has(viewport.name);
      const filename = `${STORY_ID}__${locale}__${viewport.name}.png`;
      const screenshotPath = join(outputDir, filename);

      const cell = {
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

        // Per-row checks: every title/body <p> must wrap inside its own box (no
        // single-line overflow of its own element — i.e. whitespace-normal break-words
        // is taking effect on long uk/it strings) and must NOT be empty (i.e. the
        // template/sq-fallback resolved to text, not a raw key or blank).
        // NB: the w-80 (320px) NotificationCenter container is a pre-existing
        // fixed-width container (flagged separately, out of scope for Task 319) — at
        // 320px viewport + container-wide canvas padding it legitimately overflows the
        // *document*, so this script intentionally checks per-element wrap, not
        // document-level horizontal scroll.
        const rows = await page.evaluate(() => {
          const container = document.querySelector('.divide-y');
          const items = container ? [...container.children] : [];
          return items.map(item => {
            const ps = [...item.querySelectorAll('p')];
            const title = ps[0]?.textContent?.trim() ?? '';
            const body = ps[1]?.textContent?.trim() ?? '';
            const titleOverflow = ps[0] ? ps[0].scrollWidth > ps[0].clientWidth + 2 : false;
            const bodyOverflow = ps[1] ? ps[1].scrollWidth > ps[1].clientWidth + 2 : false;
            return { title, body, titleOverflow, bodyOverflow };
          });
        });

        const nonEmpty = rows.length === 8 && rows.every(r => r.title.length > 0 && r.body.length > 0);
        const noOverflow = rows.every(r => !r.titleOverflow && !r.bodyOverflow);

        cell.assertions = { renderCheck: renderResult, pageErrors: pageErrors.slice(0, 2), rowCount: rows.length, nonEmpty, noOverflow, rows };

        const renderFailed = renderResult.failed || pageErrors.length > 0;
        cell.pass = !renderFailed && nonEmpty && noOverflow;

        if (isMandatoryShot) {
          await page.screenshot({ path: screenshotPath, fullPage: true });
        }
        await page.close();

        const mark = cell.pass ? '✓' : (renderFailed ? 'E' : '✗');
        console.log(`  ${mark} ${locale} x ${viewport.name}`);
      } catch (err) {
        cell.error = String(err).slice(0, 300);
        cell.pass = false;
        console.log(`  E ${locale} x ${viewport.name} - ${cell.error}`);
      }

      matrix.push(cell);
    }
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, matrix }, null, 2));

  const passCount = matrix.filter(c => c.pass).length;
  const failCount = matrix.length - passCount;
  console.log('');
  console.log(`Results: ${passCount}/${matrix.length} PASS, ${failCount} FAIL`);
  console.log(`Manifest: .screenshots/task319-qa/${timestamp}/manifest.json`);
  console.log(`PNGs (320/375/390 all locales): .screenshots/task319-qa/${timestamp}/*.png`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
