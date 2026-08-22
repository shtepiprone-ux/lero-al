// Task 763 — I2/I4 computed-style capture harness.
// Serves storybook-static on a local port and captures computed CSS for every AppImage
// container/<img> pair found in the target stories, at required viewports and locales.
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PORT = 6117;
const STATIC_DIR = join(ROOT, 'storybook-static');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(req.url.split('?')[0]);
        if (p === '/') p = '/index.html';
        const filePath = join(STATIC_DIR, p);
        const s = await stat(filePath).catch(() => null);
        if (!s || !s.isFile()) { res.writeHead(404); res.end('not found'); return; }
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      } catch (e) {
        res.writeHead(500); res.end(String(e));
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

const STORIES = [
  // patterns-mantine-listingcardpattern--default was replaced: its story fixture renders
  // `DemoImage` (a plain Mantine `Image`), not the real `AppImage` — confirmed by I2 capture
  // (Mantine `Image`-root class fingerprint, transitionProperty "transform, opacity" instead of
  // AppImage's own class list) and by the story file's own comment. mantine-primitives-listingcard
  // (`ListingCard.stories.tsx`) statically imports the REAL production `ListingCard`, which is the
  // real `AppImage` consumer for both `listing` and `listing-thumb` (clause 16c canonical binding,
  // Task 656) and also exercises `MantineListingCardPattern`'s `'group'` class this task removes.
  { id: 'mantine-primitives-listingcard--default', variantHint: 'listing+listing-thumb' },
  { id: 'mantine-primitives-popularlocationsview--default', variantHint: 'listing-thumb' },
];

const WIDTHS = [320, 375, 390, 768, 1024, 1440];
const LOCALES_ALL = ['sq', 'en', 'uk', 'it'];
// Full locale set only at 320 and 1440 (R10); other widths use 'en' only to bound run time.
function localesFor(width) {
  return (width === 320 || width === 1440) ? LOCALES_ALL : ['en'];
}

const GEOMETRY_PROPS = [
  'position', 'inset', 'top', 'right', 'bottom', 'left', 'width', 'height', 'aspectRatio',
  'overflow', 'objectFit', 'borderRadius', 'backgroundColor',
];
const STATE_PROPS = ['transitionProperty', 'transitionDuration', 'transitionTimingFunction', 'opacity'];
const HOVER_PROPS = ['transform', 'scale', 'filter'];

async function captureStory(page, baseUrl, storyId, width, locale) {
  const url = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:${locale}&viewMode=story`;
  await page.setViewportSize({ width, height: 1200 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(300);

  const data = await page.evaluate(({ GEOMETRY_PROPS, STATE_PROPS }) => {
    const root = document.getElementById('storybook-root') || document.body;
    const imgs = Array.from(root.querySelectorAll('img'));
    return imgs.map((img, i) => {
      const container = img.parentElement;
      const csImg = getComputedStyle(img);
      const csContainer = getComputedStyle(container);
      const geo = {};
      for (const p of GEOMETRY_PROPS) geo[p] = csContainer[p];
      const imgGeo = {};
      for (const p of GEOMETRY_PROPS) imgGeo[p] = csImg[p];
      const state = {};
      for (const p of STATE_PROPS) state[p] = csImg[p];
      return {
        index: i,
        src: img.getAttribute('src'),
        priority: img.getAttribute('loading') === 'eager',
        containerClass: container.className,
        imgClass: img.className,
        containerComputed: geo,
        imgComputed: imgGeo,
        imgState: state,
      };
    });
  }, { GEOMETRY_PROPS, STATE_PROPS });

  return data;
}

async function captureHover(page, baseUrl, storyId, width, locale) {
  const url = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:${locale}&viewMode=story`;
  await page.setViewportSize({ width, height: 1200 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(300);

  const root = page.locator('#storybook-root, body').first();
  const imgs = page.locator('#storybook-root img, body img');
  const count = await imgs.count();
  const results = [];
  for (let i = 0; i < Math.min(count, 6); i++) {
    const img = imgs.nth(i);
    const restTransform = await img.evaluate((el) => getComputedStyle(el).transform);
    const restFilter = await img.evaluate((el) => getComputedStyle(el).filter);
    const containerClass = await img.evaluate((el) => el.parentElement?.className || '');
    const imgClass = await img.evaluate((el) => el.className);
    // Hover the CARD ancestor (closest .group / card-like ancestor) — find nearest ancestor
    // that changes cursor to pointer, else hover the container's parent chain up to 4 levels.
    const box = await img.boundingBox();
    if (!box) { results.push({ index: i, containerClass, imgClass, restTransform, restFilter, hoverTransform: null, hoverFilter: null, note: 'no bounding box' }); continue; }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // Wait past the 300ms transition duration so the captured value is the SETTLED end state,
    // not a mid-animation interpolated value (first pass at 150ms produced non-105% scale
    // artifacts — this is a capture-timing defect, not a behavioral difference).
    await page.waitForTimeout(600);
    const hoverTransform = await img.evaluate((el) => getComputedStyle(el).transform);
    const hoverFilter = await img.evaluate((el) => getComputedStyle(el).filter);
    results.push({ index: i, containerClass, imgClass, restTransform, restFilter, hoverTransform, hoverFilter });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
  }
  return results;
}

async function main() {
  const label = process.argv[2] || 'baseline';
  const outDir = process.argv[3] || 'i2';
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const allCaptures = {};
  for (const story of STORIES) {
    allCaptures[story.id] = { widths: {} };
    for (const width of WIDTHS) {
      allCaptures[story.id].widths[width] = {};
      for (const locale of localesFor(width)) {
        const data = await captureStory(page, baseUrl, story.id, width, locale);
        allCaptures[story.id].widths[width][locale] = data;
      }
    }
    // Hover capture at one desktop width, one locale (en), matching AC7 requirement.
    const hover = await captureHover(page, baseUrl, story.id, 1024, 'en');
    allCaptures[story.id].hover1024en = hover;
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  const outPath = join(ROOT, 'docs/sessions/evidence/task763', outDir, `capture-${label}.json`);
  await writeFile(outPath, JSON.stringify(allCaptures, null, 2), 'utf8');
  console.log('WROTE', outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
