import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const staticDir = 'C:/Claude_Code_Projects/lero-al/storybook-static';
const PORT = 6039;
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

async function dump(storyId, evalFn) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const url = `http://127.0.0.1:${PORT}/iframe.html?id=${storyId}&globals=locale:en&viewMode=story`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(500);
  console.log(`=== ${storyId} ===`);
  const result = await page.evaluate(evalFn);
  console.log(JSON.stringify(result, null, 2));
  await page.close();
}

await dump('mantine-primitives-filtercontrols--default', () => {
  const el = document.querySelector('[data-testid="filter-chip-row"]');
  return { found: !!el, gap: el ? getComputedStyle(el).gap : null, tag: el?.tagName, className: el?.className };
});

await dump('mantine-primitives-howitworkssteps--default', () => {
  const h2 = document.querySelector('h2');
  const grid = h2?.nextElementSibling;
  return {
    h2: h2 ? { text: h2.textContent, marginBottom: getComputedStyle(h2).marginBottom, className: h2.className } : null,
    grid: grid ? { tag: grid.tagName, className: grid.className, columnGap: getComputedStyle(grid).columnGap, rowGap: getComputedStyle(grid).rowGap, display: getComputedStyle(grid).display } : null,
  };
});

await dump('mantine-primitives-phonefield--default', () => {
  const input = document.querySelector('input[type="tel"]');
  let stackCandidate = input?.parentElement;
  const ancestry = [];
  let el = input;
  for (let i = 0; i < 6 && el; i++) {
    el = el.parentElement;
    if (el) ancestry.push({ tag: el.tagName, className: el.className, display: getComputedStyle(el).display, flexDirection: getComputedStyle(el).flexDirection, gap: getComputedStyle(el).gap, childCount: el.children.length });
  }
  return { inputFound: !!input, ancestry };
});

await dump('mantine-primitives-favoritebutton--default', () => {
  const btns = Array.from(document.querySelectorAll('button[aria-label]'));
  return btns.map(b => ({ ariaLabel: b.getAttribute('aria-label'), borderRadius: getComputedStyle(b).borderRadius, className: b.className }));
});

await dump('mantine-primitives-notificationbellview--default', () => {
  const btns = Array.from(document.querySelectorAll('button[aria-label]'));
  return btns.map(b => ({ ariaLabel: b.getAttribute('aria-label'), minHeight: getComputedStyle(b).minHeight, minWidth: getComputedStyle(b).minWidth, className: b.className }));
});

await browser.close();
await new Promise((r) => server.close(r));
