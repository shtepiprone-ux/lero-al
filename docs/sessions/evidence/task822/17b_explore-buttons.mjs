import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
const staticDir = 'C:/Claude_Code_Projects/lero-al/storybook-static';
const PORT = 6041;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = join(staticDir, decodeURIComponent(urlPath));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=mantine-primitives-phonefield--default&globals=locale:en&viewMode=story`, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(500);
const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => ({ ariaLabel: b.getAttribute('aria-label'), text: b.textContent?.slice(0,30), className: b.className.slice(0,80) })));
console.log(JSON.stringify(buttons, null, 2));
await browser.close();
await new Promise((r) => server.close(r));
