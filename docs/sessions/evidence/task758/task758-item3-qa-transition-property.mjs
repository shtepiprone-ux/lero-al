#!/usr/bin/env node
/**
 * task758-item3-qa-transition-property.mjs — Task 758 item 3, AC3 evidence.
 *
 * Reads real `getComputedStyle(el)` for one live element per file
 * (NotificationItem/.root, MobileNavDrawer/.navLink, MantineCopyIdButton/.copyId) from a built
 * storybook-static/. The caller swaps each module's `transition-property` between the pre-fix
 * (stops at `stroke`) and post-fix (adds the three `--tw-gradient-*` entries) content and
 * rebuilds storybook-static between BEFORE/AFTER invocations; this script only captures whatever
 * is currently built, and reads `transitionProperty` alongside `transitionTimingFunction` and
 * `transitionDuration` so a diff also proves those two did NOT move (item 3's own constraint).
 *
 * Usage: node scripts/task758-item3-qa-transition-property.mjs
 */

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIC_DIR = join(ROOT, 'storybook-static');
const PORT = 6394;

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

const TARGETS = [
  { key: 'notificationItem', storyId: 'notifications-notificationitem--all-cases', selector: '[role="button"]' },
  { key: 'mobileNavDrawer', storyId: 'mantine-primitives-mobilenavdrawer--default', selector: 'nav a' },
  { key: 'copyIdButton', storyId: 'mantine-primitives-copyidbutton--default', selector: '[data-copy-id]' },
];

async function main() {
  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch();
  const out = {};
  try {
    for (const t of TARGETS) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
      await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${t.storyId}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
      await page.waitForSelector(t.selector, { timeout: 30000 });
      const el = (await page.$$(t.selector))[0];
      const cs = await el.evaluate((node) => {
        const s = getComputedStyle(node);
        return {
          transitionProperty: s.transitionProperty,
          transitionTimingFunction: s.transitionTimingFunction,
          transitionDuration: s.transitionDuration,
        };
      });
      out[t.key] = cs;
      await page.close();
    }
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
