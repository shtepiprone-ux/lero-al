// Task 765 — Phase 1/3 computed-style capture harness.
// Copied from docs/sessions/evidence/task763/capture-appimage-styles.mjs (Task 763's I2/I4 harness),
// unchanged except: STORIES gains 'admin-admincompaniesmanager--default' so the `avatar` variant
// (AppImage.module.css `.frameCircle`, consumed only by AdminCompaniesManager.tsx:283) is captured
// alongside the existing `listing`/`listing-thumb` coverage. Nothing else about the capture approach
// changed.
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const PORT = 6118;
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
  { id: 'mantine-primitives-listingcard--default', variantHint: 'listing+listing-thumb' },
  { id: 'mantine-primitives-popularlocationsview--default', variantHint: 'listing-thumb' },
  // Task 765: only production consumer of AppImage variant="avatar" is
  // AdminCompaniesManager.tsx:283. FIXTURE_COMPANIES ships logo_url:null for every row (no <img>
  // renders), so this run requires the reversible probe recorded in the session log — co-001's
  // logo_url temporarily set to a real Cloudinary URL, reverted (hash-proven) after the final
  // capture in this task.
  { id: 'admin-admincompaniesmanager--default', variantHint: 'avatar' },
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

  const imgs = page.locator('#storybook-root img, body img');
  const count = await imgs.count();
  const results = [];
  for (let i = 0; i < Math.min(count, 6); i++) {
    const img = imgs.nth(i);
    const restTransform = await img.evaluate((el) => getComputedStyle(el).transform);
    const restFilter = await img.evaluate((el) => getComputedStyle(el).filter);
    const containerClass = await img.evaluate((el) => el.parentElement?.className || '');
    const imgClass = await img.evaluate((el) => el.className);
    const box = await img.boundingBox();
    if (!box) { results.push({ index: i, containerClass, imgClass, restTransform, restFilter, hoverTransform: null, hoverFilter: null, note: 'no bounding box' }); continue; }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // Wait past the 300ms transition duration so the captured value is the SETTLED end state.
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
  const outDir = process.argv[3] || 'phase1';
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
    const hover = await captureHover(page, baseUrl, story.id, 1024, 'en');
    allCaptures[story.id].hover1024en = hover;
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  const outPath = join(ROOT, 'docs/sessions/evidence/task765', outDir, `capture-${label}.json`);
  await writeFile(outPath, JSON.stringify(allCaptures, null, 2), 'utf8');
  console.log('WROTE', outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
