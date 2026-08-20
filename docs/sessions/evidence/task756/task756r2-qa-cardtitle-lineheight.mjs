#!/usr/bin/env node
/**
 * task756r2-qa-cardtitle-lineheight.mjs — Task 756 (re-review R2) genuine before/after
 * computed-style capture for MantineListingCardPattern's `.cardTitle`.
 *
 * Reads real `getComputedStyle(...).lineHeight` for the list-layout and grid-layout card
 * titles from a built storybook-static/ (the caller swaps MantineListingCardPattern.tsx
 * content and rebuilds storybook-static between BEFORE/AFTER invocations; this script only
 * captures whatever is currently built). Writes JSON to stdout so the caller can persist a
 * distinct file per state and diff them afterward.
 *
 * Usage: node scripts/task756r2-qa-cardtitle-lineheight.mjs
 */

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIC_DIR = join(ROOT, 'storybook-static');
const PORT = 6393;
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

async function main() {
  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
    page.on('console', (msg) => console.error('[console]', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.error('[pageerror]', err.message));
    await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
    await page.waitForSelector('.mantine-Card-root', { timeout: 60000 });

    const data = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.mantine-Card-root')];
      const gridCard = cards.find(c => getComputedStyle(c).flexDirection === 'column');
      const listCard = cards.find(c => getComputedStyle(c).flexDirection === 'row');
      const readTitle = (card) => {
        if (!card) return null;
        const h3 = card.querySelector('h3');
        if (!h3) return null;
        const cs = getComputedStyle(h3);
        return {
          text: h3.textContent,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          clampedHeight: h3.getBoundingClientRect().height,
        };
      };
      return {
        grid: readTitle(gridCard),
        list: readTitle(listCard),
      };
    });

    console.log(JSON.stringify(data, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
