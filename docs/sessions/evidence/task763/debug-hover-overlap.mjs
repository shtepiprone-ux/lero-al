import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const PORT = 6118;
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

const boxes = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('#storybook-root img'));
  return imgs.map((img, i) => {
    const r = img.getBoundingClientRect();
    const container = img.parentElement;
    // find nearest ancestor with 'group' class
    let anc = container;
    let groupAnc = null;
    let depth = 0;
    while (anc && depth < 10) {
      if (anc.classList && anc.classList.contains('group')) { groupAnc = anc; break; }
      anc = anc.parentElement;
      depth++;
    }
    return {
      i, rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      imgClassHasHover: img.className.includes('group-hover'),
      groupAncestorTag: groupAnc ? groupAnc.tagName + '.' + groupAnc.className : null,
    };
  });
});
console.log(JSON.stringify(boxes, null, 1));
await browser.close();
await new Promise(r => server.close(r));
