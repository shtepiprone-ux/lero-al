#!/usr/bin/env node
/**
 * task420-qa-grid-step.mjs — Task 420 (Slice 5) rendered evidence.
 *
 * Proves the §8.3 canonical listing-card grid column step for the two fixed surfaces —
 * FeaturedListings and SimilarListings — across the full breakpoint matrix x 4 locales.
 *
 * Task 668 (2026-07-26) moved FeaturedListings' large-desktop step from Tailwind `2xl`
 * (1536px) to Mantine `xxl` (1440px) — an owner-approved change — while SimilarListings
 * stays an unmigrated Tailwind grid still stepping at 1536px. A single shared expected-column
 * table and a single Tailwind-token locator can no longer describe both stories, so each
 * `STORIES` entry now carries its OWN `expectedCols` table and its OWN grid locator:
 *  - `similarlistings` keeps the original hardcoded-Tailwind-token locator VERBATIM — proof
 *    that this story was NOT migrated.
 *  - `featuredlistings` uses a mechanism-agnostic locator (first `display:grid` element inside
 *    `#storybook-root` with >=1 `.listing-card` descendant) since it now renders via Mantine
 *    `SimpleGrid`, not Tailwind grid-template classes.
 *
 * For each (story x locale x viewport) cell asserts:
 *  - column-track count matches the story's OWN expected table
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

// Shared viewport widths — expected column counts now live PER-STORY (§3.9/§10.9, Task 668).
const VIEWPORTS = [
  { name: '320',  width:  320, height:  812 },
  { name: '375',  width:  375, height:  812 },
  { name: '390',  width:  390, height:  844 },
  { name: '640',  width:  640, height:  900 },
  { name: '768',  width:  768, height: 1024 },
  { name: '1024', width: 1024, height:  768 },
  { name: '1280', width: 1280, height:  900 },
  { name: '1440', width: 1440, height:  900 },
  { name: '1536', width: 1536, height:  960 },
  { name: '1920', width: 1920, height: 1080 },
  { name: '2560', width: 2560, height: 1440 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MOBILE_NAMES = new Set(['320', '375', '390']);
const CONTAINER_CAP_PX = 1408;

// Per-viewport expected column count, per story (Task 668 §3.9). FeaturedListings steps at the
// new Mantine xxl/1440px breakpoint; SimilarListings is unmigrated and still steps at Tailwind
// 2xl/1536px.
const EXPECTED_COLS_BY_WIDTH = {
  featured: { 320: 1, 375: 1, 390: 1, 640: 2, 768: 2, 1024: 2, 1280: 3, 1440: 4, 1536: 4, 1920: 4, 2560: 4 },
  similar:  { 320: 1, 375: 1, 390: 1, 640: 2, 768: 2, 1024: 2, 1280: 3, 1440: 3, 1536: 4, 1920: 4, 2560: 4 },
};

const STORIES = [
  {
    id: 'system-featuredlistings--default',
    label: 'FeaturedListings/Default',
    expectedColsKey: 'featured',
    locator: 'mechanism-agnostic', // Task 668 — migrated to Mantine SimpleGrid, no Tailwind grid tokens left
  },
  {
    id: 'system-similarlistings--default',
    label: 'SimilarListings/Default',
    expectedColsKey: 'similar',
    locator: 'tailwind-tokens', // unmigrated — proves Similar was NOT accidentally migrated
  },
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

// In-page evaluation: finds the story's canonical card grid and the nearest .container-wide
// ancestor, returns measurements. `locatorType` selects the per-story locator strategy
// (Task 668 §3.9/§10.9):
//  - 'tailwind-tokens' — the ORIGINAL hardcoded-Tailwind-class predicate, kept VERBATIM.
//    Proves SimilarListings was NOT accidentally migrated.
//  - 'mechanism-agnostic' — first `display:grid` element inside #storybook-root with >=1
//    `.listing-card` descendant. Used for FeaturedListings, which now renders via Mantine
//    SimpleGrid and carries no Tailwind grid-template classes to match on.
/* eslint-disable no-undef */
function evalGrid(locatorType) {
  function tokens(el) { return (el.className || '').toString().split(/\s+/); }

  let grid = null;
  if (locatorType === 'tailwind-tokens') {
    grid = [...document.querySelectorAll('div')].find(d => {
      const t = tokens(d);
      return t.includes('grid') && t.includes('grid-cols-1') &&
        t.includes('sm:grid-cols-2') && t.includes('xl:grid-cols-3') && t.includes('2xl:grid-cols-4');
    });
  } else {
    const root = document.querySelector('#storybook-root');
    if (root) {
      grid = [...root.querySelectorAll('*')].find(
        (el) => getComputedStyle(el).display === 'grid' && el.querySelector('.listing-card')
      );
    }
  }
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

    const expectedCols = EXPECTED_COLS_BY_WIDTH[story.expectedColsKey][viewport.width];
    const cell = {
      story: story.label,
      storyId: story.id,
      locale,
      viewport: viewport.name,
      width: viewport.width,
      expectedCols,
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
      const grid = await page.evaluate(evalGrid, story.locator);

      cell.assertions = { renderCheck: renderResult, pageErrors: pageErrors.slice(0, 2), noHScroll, grid };

      const renderFailed = renderResult.failed || pageErrors.length > 0;
      let pass = !renderFailed && noHScroll;

      if (!renderFailed) {
        if (!grid.found) {
          pass = false;
        } else {
          if (grid.columnCount !== expectedCols) pass = false;
          if (viewport.width >= 1536 && grid.containerWidthPx !== null && grid.containerWidthPx > CONTAINER_CAP_PX + 2) pass = false;
        }
      }
      cell.pass = pass;

      if (isMandatoryShot) {
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }
      await page.close();

      const mark = pass ? '✓' : (renderFailed ? 'E' : '✗');
      console.log(`  ${mark} ${story.label} x ${locale} x ${viewport.name} (cols=${grid.found ? grid.columnCount : 'n/a'}, expected=${expectedCols})`);
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
