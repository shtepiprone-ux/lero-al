// Task 823 §13 — evidence-only probe. Measures getComputedStyle(control).boxShadow for BOTH rail
// prev/next controls in Storybook `patterns-mantine-listingcardtrack--rail` at 1440x900, locale:en.
// Run once against the unmodified tree (before) and once after the edit (after); the two runs must
// print byte-equal strings (AC3). Never imported by any gate.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6038; // distinct from every other task's static-server port used in this repo
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

async function extractControlClass(dir) {
  const assetsDir = join(dir, 'assets');
  const files = await readdir(assetsDir);
  const matches = files.filter((f) => /^MantineListingCardTrack-.*\.css$/.test(f));
  if (matches.length !== 1) throw new Error(`expected exactly 1 track CSS asset, found ${matches.length}`);
  const css = await readFile(join(assetsDir, matches[0]), 'utf8');
  const controlClasses = [...new Set([...css.matchAll(/\.(_control_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  const railClasses = [...new Set([...css.matchAll(/\.(_rail_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  if (controlClasses.length !== 1) throw new Error(`expected exactly 1 .control class, found ${controlClasses.length}: ${JSON.stringify(controlClasses)}`);
  if (railClasses.length !== 1) throw new Error(`expected exactly 1 .rail class, found ${railClasses.length}: ${JSON.stringify(railClasses)}`);
  return { asset: matches[0], controlClass: controlClasses[0], railClass: railClasses[0] };
}

async function main() {
  console.log('20_probe-box-shadow.mjs — Task 823 §13 before/after box-shadow probe');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);
  console.log(`cwd: ${process.cwd()}`);
  console.log('command: node docs/sessions/evidence/task823/20_probe-box-shadow.mjs\n');

  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();

  const selectors = await extractControlClass(staticDir);
  console.log(`CSS asset: ${selectors.asset}`);
  console.log(`Control class: ${selectors.controlClass}`);
  console.log(`Rail class: ${selectors.railClass}\n`);

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const url = `${baseUrl}/iframe.html?id=patterns-mantine-listingcardtrack--rail&globals=locale:en&viewMode=story`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector(`.${selectors.controlClass}`, { timeout: 15000 });

  // Scroll to the middle so BOTH prev and next controls render (canScrollPrev/canScrollNext are
  // both derived from live scroll geometry — at scrollLeft 0 only "next" exists).
  await page.evaluate((railClass) => {
    const rail = document.querySelector(`.${railClass}`);
    if (!rail) throw new Error('rail element not found');
    rail.scrollLeft = Math.floor((rail.scrollWidth - rail.clientWidth) / 2);
    rail.dispatchEvent(new Event('scroll'));
  }, selectors.railClass);
  await page.waitForTimeout(300); // let the ResizeObserver/scroll listener re-render both controls

  const result = await page.evaluate((controlClass) => {
    const els = Array.from(document.querySelectorAll(`.${controlClass}`));
    return els.map((el) => ({
      ariaLabel: el.getAttribute('aria-label'),
      boxShadow: getComputedStyle(el).boxShadow,
    }));
  }, selectors.controlClass);

  console.log(`controls found: ${result.length}`);
  for (const r of result) {
    console.log(`  aria-label=${JSON.stringify(r.ariaLabel)} boxShadow=${JSON.stringify(r.boxShadow)}`);
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  if (result.length !== 2) {
    console.error(`FATAL: expected exactly 2 controls (prev + next), found ${result.length}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
