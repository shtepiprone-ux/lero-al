import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 6123;
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

// Find the title text under the FIRST card (below its image, y > image bottom, same card x-range).
const info = await page.evaluate(() => {
  const img = document.querySelectorAll('#storybook-root img')[0];
  const imgRect = img.getBoundingClientRect();
  // Walk up from img to find the .group ancestor (the Card)
  let card = img.closest('.group');
  const cardRect = card.getBoundingClientRect();
  return {
    imgRect: { x: imgRect.x, y: imgRect.y, w: imgRect.width, h: imgRect.height, bottom: imgRect.bottom },
    cardRect: { x: cardRect.x, y: cardRect.y, w: cardRect.width, h: cardRect.height, bottom: cardRect.bottom },
  };
});
console.log(JSON.stringify(info));

// rest measurement
const rest = await page.evaluate(() => {
  const img = document.querySelectorAll('#storybook-root img')[0];
  const r = img.getBoundingClientRect();
  return { w: r.width, h: r.height };
});

// Hover a point BELOW the image but still inside the card (title area)
const titleX = info.cardRect.x + info.cardRect.w / 2;
const titleY = info.imgRect.bottom + 20; // 20px below image bottom, inside card
await page.mouse.move(titleX, titleY);
await page.waitForTimeout(600);
const hoverAtTitle = await page.evaluate(() => {
  const img = document.querySelectorAll('#storybook-root img')[0];
  const r = img.getBoundingClientRect();
  return { w: r.width, h: r.height };
});
console.log('rest', JSON.stringify(rest));
console.log('hover-at-title-area (NOT over image)', JSON.stringify(hoverAtTitle), 'ratio=', hoverAtTitle.w / rest.w);

await browser.close();
await new Promise(r => server.close(r));
