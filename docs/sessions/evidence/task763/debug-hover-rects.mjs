import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 6122;
const STATIC_DIR = join(process.cwd(), 'storybook-static');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const filePath = join(STATIC_DIR, p);
      const s = await stat(filePath).catch(() => null);
      if (!s || !s.isFile()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(await readFile(filePath));
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function measure(page, idx) {
  const rest = await page.evaluate((i) => {
    const img = document.querySelectorAll('#storybook-root img')[i];
    const r = img.getBoundingClientRect();
    return { w: r.width, h: r.height, x: r.x, y: r.y };
  }, idx);
  const box = rest;
  await page.mouse.move(box.x + box.w/2, box.y + box.h/2);
  await page.waitForTimeout(600);
  const hover = await page.evaluate((i) => {
    const img = document.querySelectorAll('#storybook-root img')[i];
    const r = img.getBoundingClientRect();
    return { w: r.width, h: r.height, x: r.x, y: r.y };
  }, idx);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
  return { rest, hover, ratio: hover.w / rest.w };
}

const server = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1024, height: 1200 });
await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=mantine-primitives-listingcard--default&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

for (const idx of [0, 3]) {
  const r = await measure(page, idx);
  console.log('index', idx, JSON.stringify(r));
}

await browser.close();
await new Promise(r => server.close(r));
