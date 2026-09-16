#!/usr/bin/env node
// Task 797 AC3 — HeroSearch Fallback Story Skeleton height at 390/640/1440, unpiped, exit-code
// appended by the caller. Measures getBoundingClientRect().height of
// [data-testid="hero-search-fallback"] in the `Mantine/Primitives/HeroSearch` `Fallback` story.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const OUT_LABEL = process.argv[2] || 'measure';
const WIDTHS = [390, 640, 1440];
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };

function startStaticServer(staticDir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
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
  const staticDir = join(ROOT, 'storybook-static');
  if (!existsSync(staticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }
  const { chromium } = await import('playwright');
  const PORT = 6097;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const server = await startStaticServer(staticDir, PORT);
  const browser = await chromium.launch();

  const results = [];
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    const storyUrl = `${baseUrl}/iframe.html?id=mantine-primitives-herosearch--fallback&globals=locale:en&viewMode=story`;
    await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(400);
    const geometry = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="hero-search-fallback"]');
      if (!el) return { found: false };
      const rect = el.getBoundingClientRect();
      return { found: true, height: rect.height, width: rect.width };
    });
    await page.close();
    results.push({ viewportWidth: width, found: geometry.found, height: geometry.height, elementWidth: geometry.width });
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  const outDir = join(ROOT, 'docs', 'sessions', 'evidence', 'task797');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `hero-fallback-height-${OUT_LABEL}.json`);
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`label=${OUT_LABEL}`);
  for (const r of results) {
    console.log(`  viewportWidth=${r.viewportWidth} found=${r.found} height=${r.height}`);
  }
  console.log(`written: ${outPath}`);

  const anyMissing = results.some((r) => !r.found);
  process.exit(anyMissing ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
