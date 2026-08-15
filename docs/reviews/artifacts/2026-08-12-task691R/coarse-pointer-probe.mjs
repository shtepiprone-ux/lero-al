#!/usr/bin/env node
/**
 * 691R — coarse-pointer negative-flow probe (kickoff §11 "Coarse pointer / touch").
 * Confirms neither hover effect (image scale/transform zoom, title --text-color) fires on a
 * simulated touch/coarse-pointer device, both AFTER (this worktree) and (if --static is passed
 * to point at a base build) BEFORE. Taps the card (touchscreen tap, not a mouse hover) and reads
 * computed style immediately after.
 */
import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const STATIC_DIR = args.static ? resolve(args.static) : join(ROOT, 'storybook-static');
const PORT = 6399;

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
  const context = await browser.newContext({ ...devices['iPhone 12'] });
  const page = await context.newPage();
  const result = {};
  try {
    await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=mantine-primitives-listingcard--default&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
    await page.waitForSelector('body');

    result.mediaHoverHover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
    result.mediaPointerCoarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    result.mediaPointerFine = await page.evaluate(() => matchMedia('(pointer: fine)').matches);

    const card = page.locator('[class*="card"]').first();
    const before = await page.evaluate(() => {
      const cardEl = document.querySelector('[class*="_card_"]');
      const img = cardEl && cardEl.querySelector('img');
      const title = cardEl && cardEl.querySelector('h3');
      return {
        imgScale: img ? getComputedStyle(img).scale : null,
        imgTransform: img ? getComputedStyle(img).transform : null,
        titleColor: title ? getComputedStyle(title).color : null,
      };
    });
    result.before = before;

    await card.tap({ force: true }).catch(async () => { await card.click({ force: true }); });
    await page.waitForTimeout(400);

    const after = await page.evaluate(() => {
      const cardEl = document.querySelector('[class*="_card_"]');
      const img = cardEl && cardEl.querySelector('img');
      const title = cardEl && cardEl.querySelector('h3');
      return {
        imgScale: img ? getComputedStyle(img).scale : null,
        imgTransform: img ? getComputedStyle(img).transform : null,
        titleColor: title ? getComputedStyle(title).color : null,
      };
    });
    result.afterTap = after;
    result.neitherEffectFired = before.imgScale === after.imgScale
      && before.imgTransform === after.imgTransform
      && before.titleColor === after.titleColor;
  } finally {
    await context.close();
    await browser.close();
    server.close();
  }
  console.log(JSON.stringify(result, null, 2));
  if (!result.neitherEffectFired) { console.error('COARSE-POINTER PROBE FAILED — a hover effect fired on tap'); process.exit(1); }
}
main().catch(e => { console.error(e); process.exit(1); });
