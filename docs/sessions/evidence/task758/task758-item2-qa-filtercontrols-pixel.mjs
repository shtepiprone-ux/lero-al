#!/usr/bin/env node
/**
 * task758-item2-qa-filtercontrols-pixel.mjs — Task 758 item 2, AC6 evidence.
 *
 * Captures a full-page PNG screenshot of `Mantine/Primitives/FilterControls` (both the
 * horizontal Group branch and the vertical Stack branch it exercises) from a built
 * storybook-static/, at 320/1024, en locale, and writes each PNG's sha256 alongside its byte
 * length. The caller swaps `FilterMultiToggle.tsx`/`FilterRoomsRow.tsx` between the pre-item-2
 * (`flex-wrap` class, no `data-testid`) and post-item-2 (`data-testid="filter-chip-row"`, no
 * `flex-wrap`) content and rebuilds storybook-static between BEFORE/AFTER invocations — removing
 * a redundant class must not move a pixel, so a byte-identical PNG at every captured viewport is
 * the proof.
 *
 * Usage: node scripts/task758-item2-qa-filtercontrols-pixel.mjs <out-prefix>
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIC_DIR = join(ROOT, 'storybook-static');
const PORT = 6395;
const STORY_ID = 'mantine-primitives-filtercontrols--default';
const OUT_PREFIX = process.argv[2] ?? 'filtercontrols';

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

const VIEWPORTS = [
  { name: '320', width: 320, height: 1400 },
  { name: '1024', width: 1024, height: 1000 },
];

async function main() {
  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch();
  const out = {};
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
      await page.waitForSelector('[data-testid="filter-chip-row"], .flex-wrap', { timeout: 30000 });
      await page.waitForTimeout(300);
      const buf = await page.screenshot({ fullPage: true });
      const filename = `${OUT_PREFIX}-${vp.name}.png`;
      const outDir = process.env.AC6_OUT_DIR ?? ROOT;
      await writeFile(join(outDir, filename), buf);
      out[vp.name] = { sha256: createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
      await page.close();
    }
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
