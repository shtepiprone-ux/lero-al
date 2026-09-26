import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const staticDir = 'storybook-static';
const PORT = 6055;
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
        res.writeHead(404); res.end('Not found');
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
  });
}
const server = await startStaticServer(staticDir, PORT);
const baseUrl = `http://127.0.0.1:${PORT}`;
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${baseUrl}/iframe.html?id=mantine-primitives-dropdownmenu--default&globals=locale:uk&viewMode=story`, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(800);
const html = await page.evaluate(() => document.body.innerHTML.slice(0, 3000));
console.log(html);
const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => ({ text: b.textContent, w: b.getBoundingClientRect().width })));
console.log(JSON.stringify(buttons, null, 2));
await browser.close();
await new Promise(r => server.close(r));
