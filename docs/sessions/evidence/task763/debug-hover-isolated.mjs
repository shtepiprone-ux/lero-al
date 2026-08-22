import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 6119;
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

const server = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1024, height: 1200 });
await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=mantine-primitives-listingcard--default&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

// Fresh page, ONLY interact with index 3 — no prior hover on 0/1/2.
const box = await page.evaluate(() => {
  const img = document.querySelectorAll('#storybook-root img')[3];
  const r = img.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('box', box);
const restTransform = await page.evaluate(() => getComputedStyle(document.querySelectorAll('#storybook-root img')[3]).transform);
console.log('rest (isolated, before any hover anywhere)', restTransform);
await page.mouse.move(box.x + box.w/2, box.y + box.h/2);
await page.waitForTimeout(600);
const hoverTransform = await page.evaluate(() => getComputedStyle(document.querySelectorAll('#storybook-root img')[3]).transform);
console.log('hover (isolated)', hoverTransform);

await browser.close();
await new Promise(r => server.close(r));
