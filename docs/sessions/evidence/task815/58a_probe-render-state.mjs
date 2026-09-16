import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const staticDir = 'C:/Claude_Code_Projects/lero-al/storybook-static';
const PORT = 6035;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = join(staticDir, decodeURIComponent(urlPath));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const { chromium } = await import('playwright');
const browser = await chromium.launch();

async function probe(storyId) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const url = `http://127.0.0.1:${PORT}/iframe.html?id=${storyId}&globals=locale:en&viewMode=story`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  console.log(`=== ${storyId} ===`);
  for (const delay of [0, 200, 500, 1000, 2000, 4000]) {
    if (delay > 0) await page.waitForTimeout(200);
    const info = await page.evaluate(() => ({
      classList: Array.from(document.body.classList),
      trackCount: document.querySelectorAll('[class*="_grid_"], [class*="_rail_"]').length,
    }));
    console.log(`+${delay}ms:`, JSON.stringify(info));
  }
  await page.close();
}

await probe('patterns-mantine-listingcardtrack--grid');
await probe('mantine-primitives-favoritesshell--populated');

await browser.close();
await new Promise((r) => server.close(r));
