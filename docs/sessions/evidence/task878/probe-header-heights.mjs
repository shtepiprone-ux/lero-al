// Task 878 §10.4 — evidence-only probe. Measures header.site-header's
// getBoundingClientRect().height on the Mantine/Primitives/HeaderView -> Default Story iframe,
// at 320/389/390/1440px, for en and uk. Run once before any edit (03-heights-before.txt) and once
// after (30-heights-after.txt); both runs must print 97/97/65/65 (Task 684 D3, F7). Never imported
// by any gate.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6041; // distinct from every other task's static-server port used in this repo
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

const WIDTHS = [320, 389, 390, 1440];
const LOCALES = ['en', 'uk'];

async function main() {
  console.log('probe-header-heights.mjs — Task 878 §10.4 header bar height measurement');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);
  console.log('command: node docs/sessions/evidence/task878/probe-header-heights.mjs\n');

  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();

  const results = [];
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage();
      await page.setViewportSize({ width, height: 900 });
      const url = `${baseUrl}/iframe.html?id=mantine-primitives-headerview--default&globals=locale:${locale}&viewMode=story`;
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('header.site-header', { timeout: 15000 });
      const height = await page.evaluate(() => {
        const el = document.querySelector('header.site-header');
        if (!el) throw new Error('header.site-header not found');
        return el.getBoundingClientRect().height;
      });
      results.push({ locale, width, height });
      console.log(`locale=${locale} width=${width} -> header.site-header height=${height}`);
      await page.close();
    }
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  const bad = results.filter((r) => {
    const expected = r.width < 390 ? 97 : 65;
    return Math.abs(r.height - expected) > 0.5;
  });

  if (bad.length > 0) {
    console.error('\nFATAL: unexpected header height(s):');
    for (const b of bad) console.error(`  locale=${b.locale} width=${b.width} height=${b.height}`);
    process.exit(1);
  }

  console.log('\nAll heights match the expected 97/97/65/65 invariant (Task 684 D3).');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
