// Task 878 Revision 3, §18.4 step 4 — one-off evidence capture (not a permanent probe): a zoomed
// crop of the new 20x20 round unread-count badge, at DPR 1 and DPR 2, for the owner's O81-8
// re-check (D81-9, Rozetka/Prom.ua reference).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = 'C:/Claude_Code_Projects/lero-al';
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6044;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

function startStaticServer(dir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(dir, decodeURIComponent(urlPath));
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(dir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

async function main() {
  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch();

  for (const dpr of [1, 2]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
    const page = await context.newPage();
    const url = `${baseUrl}/iframe.html?id=mantine-primitives-notificationbellview--default&globals=locale:en&viewMode=story`;
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[class*="Indicator-root"]', { timeout: 15000 });
    await page.waitForTimeout(300);
    const root = page.locator('[class*="Indicator-root"]').first();
    const box = await root.boundingBox();
    await page.screenshot({
      path: `C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task878/36c-badge-crop-dpr${dpr}.png`,
      clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40 },
    });
    console.log(`captured dpr${dpr}: bell box ${JSON.stringify(box)}`);
    await context.close();
  }

  await browser.close();
  await new Promise((r) => server.close(r));
}

main().catch((err) => { console.error(err); process.exit(1); });
