#!/usr/bin/env node
/**
 * task420-qa-grid-step.mjs — Task 420 (Slice 5) rendered evidence.
 *
 * Proves the §8.3 canonical listing-card grid column step
 * (grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4) for the two fixed
 * surfaces — FeaturedListings and SimilarListings — across the full breakpoint
 * matrix x 4 locales.
 *
 * For each (story x locale x viewport) cell asserts:
 *  - column-track count matches the §2 expected table
 *    (getComputedStyle(grid).gridTemplateColumns -> number of non-"0px" tracks)
 *  - no horizontal scroll (scrollWidth <= clientWidth + 2)
 *  - container cap: the nearest .container-wide ancestor's content box <= 1408px
 *    (only checked at >=1536, where the cap can actually bind)
 *
 * Captures PNGs for the uk@320/375/390 mandatory cells + 2560 (wide) per story.
 *
 * Reuses the already-built storybook-static/ (same build used by screenshots:assert).
 *
 * Usage: node scripts/task420-qa-grid-step.mjs
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// §2 expected column-track count by viewport width.
const VIEWPORTS = [
  { name: '320',  width:  320, height:  812, expectedCols: 1 },
  { name: '375',  width:  375, height:  812, expectedCols: 1 },
  { name: '390',  width:  390, height:  844, expectedCols: 1 },
  { name: '640',  width:  640, height:  900, expectedCols: 2 },
  { name: '768',  width:  768, height: 1024, expectedCols: 2 },
  { name: '1024', width: 1024, height:  768, expectedCols: 2 },
  { name: '1280', width: 1280, height:  900, expectedCols: 3 },
  { name: '1440', width: 1440, height:  900, expectedCols: 3 },
  { name: '1536', width: 1536, height:  960, expectedCols: 4 },
  { name: '1920', width: 1920, height: 1080, expectedCols: 4 },
  { name: '2560', width: 2560, height: 1440, expectedCols: 4 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MOBILE_NAMES = new Set(['320', '375', '390']);
const CONTAINER_CAP_PX = 1408;

const STORIES = [
  { id: 'system-featuredlistings--default', label: 'FeaturedListings/Default' },
  { id: 'system-similarlistings--default',  label: 'SimilarListings/Default' },
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

// In-page evaluation: finds the canonical §8.3 card grid and the nearest
// .container-wide ancestor, returns measurements.
/* eslint-disable no-undef */
function evalGrid() {
  function tokens(el) { return (el.className || '').toString().split(/\s+/); }

  const grid = [...document.querySelectorAll('div')].find(d => {
    const t = tokens(d);
    return t.includes('grid') && t.includes('grid-cols-1') &&
      t.includes('sm:grid-cols-2') && t.includes('xl:grid-cols-3') && t.includes('2xl:grid-cols-4');
  });
  if (!grid) return { found: false };

  const colsStr = getComputedStyle(grid).gridTemplateColumns;
  const tracks = colsStr.split(/\s+/).filter(t => t && t !== '0px');

  let containerWidthPx = null;
  let ancestor = grid.parentElement;
  while (ancestor) {
    if (tokens(ancestor).includes('container-wide')) {
      const style = getComputedStyle(ancestor);
      const rect = ancestor.getBoundingClientRect();
      containerWidthPx = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      break;
    }
    ancestor = ancestor.parentElement;
  }

  return {
    found: true,
    columnCount: tracks.length,
    gridTemplateColumns: colsStr,
    containerWidthPx,
  };
}
/* eslint-enable no-undef */

async function main() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright');

  const PORT = 6014;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'task420-qa', timestamp);
  mkdirSync(outputDir, { recursive: true });

  const filterId = process.env.TASK420_STORY_FILTER;
  const storiesToRun = filterId ? STORIES.filter(s => s.id === filterId) : STORIES;

  const cellsToRun = [];
  for (const story of storiesToRun) {
    for (const locale of LOCALES) {
      for (const viewport of VIEWPORTS) {
        cellsToRun.push({ story, locale, viewport });
      }
    }
  }

  console.log(`Task 420 Slice 5 §8.3 grid-step QA capture`);
  console.log(`    Stories: ${storiesToRun.length} | Locales: ${LOCALES.length} x Viewports: ${VIEWPORTS.length} = ${cellsToRun.length} cells`);
  console.log(`    Output: .screenshots/task420-qa/${timestamp}/`);
  console.log('');

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();
  const matrix = [];

  for (const { story, locale, viewport } of cellsToRun) {
    const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&globals=locale:${locale}&viewMode=story`;
    const isMandatoryShot = (locale === 'uk' && MOBILE_NAMES.has(viewport.name)) || viewport.name === '2560';
    const filename = `${story.id}__${locale}__${viewport.name}.png`;
    const screenshotPath = join(outputDir, filename);

    const cell = {
      story: story.label,
      storyId: story.id,
      locale,
      viewport: viewport.name,
      width: viewport.width,
      expectedCols: viewport.expectedCols,
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
      const grid = await page.evaluate(evalGrid);

      cell.assertions = { renderCheck: renderResult, pageErrors: pageErrors.slice(0, 2), noHScroll, grid };

      const renderFailed = renderResult.failed || pageErrors.length > 0;
      let pass = !renderFailed && noHScroll;

      if (!renderFailed) {
        if (!grid.found) {
          pass = false;
        } else {
          if (grid.columnCount !== viewport.expectedCols) pass = false;
          if (viewport.width >= 1536 && grid.containerWidthPx !== null && grid.containerWidthPx > CONTAINER_CAP_PX + 2) pass = false;
        }
      }
      cell.pass = pass;

      if (isMandatoryShot) {
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }
      await page.close();

      const mark = pass ? '✓' : (renderFailed ? 'E' : '✗');
      console.log(`  ${mark} ${story.label} x ${locale} x ${viewport.name} (cols=${grid.found ? grid.columnCount : 'n/a'}, expected=${viewport.expectedCols})`);
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
  console.log(`Manifest: .screenshots/task420-qa/${timestamp}/manifest.json`);
  console.log(`PNGs (uk@320/375/390 + 2560 only): .screenshots/task420-qa/${timestamp}/*.png`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
