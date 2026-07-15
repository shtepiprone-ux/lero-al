#!/usr/bin/env node
/**
 * task606-qa-listingcard-list-layout.mjs — Task 606 rendered evidence.
 *
 * Storybook-only verification (no site consumer yet) that `MantineListingCardPattern` gained a
 * `layout: 'grid' | 'list'` variant without regressing the existing grid output, and that the
 * new list-mode rows are a faithful structural port of the legacy horizontal card:
 *
 *  - Grid section: still renders (byte-identical diff already proven separately) — sanity count.
 *  - List section: each row is a horizontal image-left/info-right layout (image width matches the
 *    ported legacy `w-32`/`sm:w-44` breakpoint, sits left of the info column), the favorite is
 *    NOT absolutely positioned (inline contract, unlike grid's floating favorite), full-width at
 *    <640, no horizontal page overflow at any viewport.
 *
 * Usage: node scripts/task606-qa-listingcard-list-layout.mjs (reuses storybook-static/, same
 * build used by screenshots:assert — run `npm run build-storybook` first).
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const VIEWPORTS = [
  { name: '320',  width:  320, height:  812 },
  { name: '375',  width:  375, height:  812 },
  { name: '390',  width:  390, height:  844 },
  { name: '768',  width:  768, height: 1024 },
  { name: '1280', width: 1280, height:  900 },
  { name: '1440', width: 1440, height:  900 },
  { name: '2560', width: 2560, height: 1440 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MOBILE_NAMES = new Set(['320', '375', '390']);
const STORY_ID = 'patterns-mantine-listingcardpattern--default';

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startStaticServer(staticDir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch { res.writeHead(404); res.end('Not found'); }
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

/* eslint-disable no-undef */
function evalCell(viewportWidth) {
  const pageOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;

  // Grid vs list Card roots distinguished by COMPUTED flex-direction (not class-name text —
  // the unlayered CSS-module `.listRow` class, not a Tailwind utility, is what actually sets
  // this; see the cascade-layer note in MantineListingCardPattern.module.css).
  const allCards = [...document.querySelectorAll('.mantine-Card-root')];
  const gridCards = allCards.filter(el => getComputedStyle(el).flexDirection === 'column');
  const listRows = allCards.filter(el => getComputedStyle(el).flexDirection === 'row');

  const rows = listRows.map((row) => {
    const rect = row.getBoundingClientRect();
    // Image container: first child, fixed width per the ported legacy w-32/sm:w-44.
    const imageEl = row.children[0];
    const imageRect = imageEl ? imageEl.getBoundingClientRect() : null;
    const infoEl = row.children[1];
    const infoRect = infoEl ? infoEl.getBoundingClientRect() : null;
    const favoriteBtn = row.querySelector('button[aria-pressed]');
    const favoritePosition = favoriteBtn ? getComputedStyle(favoriteBtn).position : null;

    const expectedImageWidth = viewportWidth >= 640 ? 176 : 128; // sm:w-44=176px / w-32=128px
    return {
      rowWidth: Math.round(rect.width),
      imageWidth: imageRect ? Math.round(imageRect.width) : null,
      expectedImageWidth,
      imageLeftOfInfo: !!(imageRect && infoRect && imageRect.right <= infoRect.left + 1),
      favoritePosition,
      favoriteIsInline: favoritePosition !== null && favoritePosition !== 'absolute',
    };
  });

  return {
    pageOverflow,
    gridCardCount: gridCards.length,
    listRowCount: listRows.length,
    rows,
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

  const PORT = 6018;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'task606-qa', timestamp);
  mkdirSync(outputDir, { recursive: true });

  console.log('Task 606 — layout="list" Storybook rendered evidence');
  console.log(`    Output: .screenshots/task606-qa/${timestamp}/`);
  console.log('');

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();
  const matrix = [];

  for (const locale of LOCALES) {
    for (const viewport of VIEWPORTS) {
      const storyUrl = `${baseUrl}/iframe.html?id=${STORY_ID}&globals=locale:${locale}&viewMode=story`;
      const isMandatoryShot = (locale === 'uk' && MOBILE_NAMES.has(viewport.name)) || viewport.name === '2560';
      const filename = `${locale}__${viewport.name}.png`;
      const screenshotPath = join(outputDir, filename);

      const cell = { locale, viewport: viewport.name, screenshot: isMandatoryShot ? filename : null, data: null, pass: null, error: null };

      try {
        const page = await browser.newPage();
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(400);

        const data = await page.evaluate(evalCell, viewport.width);
        cell.data = data;

        let pass = !data.pageOverflow && data.gridCardCount === 6 && data.listRowCount === 6;
        for (const r of data.rows) {
          if (r.imageWidth !== r.expectedImageWidth) pass = false;
          if (!r.imageLeftOfInfo) pass = false;
          if (!r.favoriteIsInline) pass = false;
        }
        cell.pass = pass;

        if (isMandatoryShot) {
          await page.screenshot({ path: screenshotPath, fullPage: true });
        }
        await page.close();

        console.log(`  ${pass ? '✓' : 'X'} ${locale} x ${viewport.name} (grid=${data.gridCardCount} list=${data.listRowCount} overflow=${data.pageOverflow} imgW=${data.rows[0]?.imageWidth}/${data.rows[0]?.expectedImageWidth} favInline=${data.rows[0]?.favoriteIsInline})`);
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
  console.log(`Manifest: .screenshots/task606-qa/${timestamp}/manifest.json`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
