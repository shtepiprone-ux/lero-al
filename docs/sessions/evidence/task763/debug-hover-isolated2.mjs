import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 6120;
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

const info = await page.evaluate(() => {
  const img = document.querySelectorAll('#storybook-root img')[3];
  const cardAncestor = img.closest('.group');
  return {
    className: img.className,
    tag: img.tagName,
    outerHTML: img.outerHTML.slice(0, 300),
    parentOuterHTMLStart: img.parentElement.outerHTML.slice(0, 200),
    cardAncestorClass: cardAncestor ? cardAncestor.className : null,
  };
});
console.log(JSON.stringify(info, null, 1));

// hover the card ancestor directly via CSS :hover simulation is not available; use mouse.
const box = await page.evaluate(() => {
  const img = document.querySelectorAll('#storybook-root img')[3];
  const r = img.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
await page.mouse.move(box.x + box.w/2, box.y + box.h/2);
await page.waitForTimeout(600);
const after = await page.evaluate(() => {
  const img = document.querySelectorAll('#storybook-root img')[3];
  const cs = getComputedStyle(img);
  return {
    transform: cs.transform,
    scaleProp: cs.getPropertyValue('scale'),
    twScaleX: cs.getPropertyValue('--tw-scale-x'),
    className: img.className,
    matchesSelector: false,
  };
});
console.log(JSON.stringify(after, null, 1));

await browser.close();
await new Promise(r => server.close(r));
