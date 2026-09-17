#!/usr/bin/env node
/**
 * Task 828 I0 probe — NOT a gate, NOT under scripts/. Measures raw R3-R7 values on the canonical
 * story (`Patterns/Mantine/HomepageListingGrids`) before the gate rewrite, to (a) prove the R3
 * assumption (header rules hold on the canonical story at 640/1440, per §5.2) across the full
 * 320/640/1440 x 4-locale matrix, and (b) prove the R4/R6/R7 locator strategy (wrapper class ->
 * firstElementChild rail; page-frame via computed max-width===1408px; rail candidates via
 * display:flex+overflowX auto/scroll containing .listing-card) actually resolves against the real
 * render before it is written into the gate.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..', '..');

const LOCALES = ['sq', 'en', 'uk', 'it'];
const DEFAULT_ID = 'patterns-mantine-homepagelistinggrids--default';
const LOADING_ID = 'patterns-mantine-homepagelistinggrids--loading';

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

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

/* eslint-disable no-undef */
function evalHeader() {
  const root = document.querySelector('#storybook-root');
  if (!root) return { infra: false, reason: 'no-storybook-root' };
  const all = root.querySelectorAll('*');
  const candidates = [];
  for (const el of all) {
    if (getComputedStyle(el).display === 'flex' && [...el.children].some((c) => c.tagName === 'H2')) candidates.push(el);
  }
  if (candidates.length !== 1) return { infra: false, reason: 'group-match-count', count: candidates.length };
  const group = candidates[0];
  const cs = getComputedStyle(group);
  return {
    infra: true,
    computed: {
      display: cs.display, flexDirection: cs.flexDirection, justifyContent: cs.justifyContent,
      alignItems: cs.alignItems, flexWrap: cs.flexWrap, marginBottom: cs.marginBottom, columnGap: cs.columnGap,
    },
  };
}

function evalSkeleton() {
  function measure(wrapperClass) {
    const wrapper = document.querySelector('.' + wrapperClass);
    if (!wrapper) return { found: false, reason: 'wrapper-not-found' };
    const rail = wrapper.firstElementChild;
    if (!rail) return { found: false, reason: 'rail-not-found' };
    const cs = getComputedStyle(rail);
    if (cs.display !== 'flex') return { found: false, reason: `rail-not-flex:${cs.display}` };
    return { found: true, childrenCount: rail.children.length, overflowX: cs.overflowX };
  }
  return { Featured: measure('featured-listings'), Latest: measure('latest-listings') };
}

function evalNoScroll() {
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    noHScroll: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2,
  };
}

function evalPageCap() {
  const root = document.querySelector('#storybook-root');
  if (!root) return { found: false, reason: 'no-storybook-root' };
  const all = [...root.querySelectorAll('*')];
  const frame = all.find((el) => Math.abs(parseFloat(getComputedStyle(el).maxWidth) - 1408) < 1);
  if (!frame) return { found: false };
  const cs = getComputedStyle(frame);
  const rect = frame.getBoundingClientRect();
  return {
    found: true,
    maxWidth: cs.maxWidth,
    rectWidth: rect.width,
    contentWidthPx: rect.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
  };
}

function evalRail() {
  const root = document.querySelector('#storybook-root');
  if (!root) return { infra: false, reason: 'no-storybook-root' };
  const all = [...root.querySelectorAll('*')];
  const rails = all.filter((el) => {
    if (!el.querySelector('.listing-card')) return false;
    const cs = getComputedStyle(el);
    return cs.display === 'flex' && (cs.overflowX === 'auto' || cs.overflowX === 'scroll');
  });
  const grids = all.filter((el) => {
    if (!el.querySelector('.listing-card')) return false;
    return getComputedStyle(el).display === 'grid';
  });
  return { infra: true, railCount: rails.length, gridCount: grids.length };
}
/* eslint-enable no-undef */

async function navigate(page, baseUrl, storyId, locale, width, height, evalFn) {
  const storyUrl = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:${locale}&viewMode=story`;
  await page.setViewportSize({ width, height });
  await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(400);
  return page.evaluate(evalFn);
}

async function main() {
  const { chromium } = await import('playwright');
  const staticDir = join(ROOT, 'storybook-static');
  const PORT = 6021;
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const server = await startStaticServer(staticDir, PORT);
  const browser = await chromium.launch();
  const results = { header: [], skeleton: [], noScroll: [], pageCap: [], rail: [] };
  try {
    for (const locale of LOCALES) {
      for (const width of [320, 640, 1440]) {
        const page = await browser.newPage();
        const r = await navigate(page, baseUrl, DEFAULT_ID, locale, width, 900, evalHeader);
        results.header.push({ locale, width, r });
        await page.close();
      }
    }
    for (const locale of ['en', 'uk']) {
      for (const width of [320, 1024, 1440]) {
        const page = await browser.newPage();
        const r = await navigate(page, baseUrl, LOADING_ID, locale, width, 900, evalSkeleton);
        results.skeleton.push({ locale, width, r });
        await page.close();
      }
    }
    for (const locale of ['en', 'uk']) {
      for (const width of [320, 1024, 1440, 1920]) {
        const page = await browser.newPage();
        const r = await navigate(page, baseUrl, DEFAULT_ID, locale, width, 900, evalNoScroll);
        results.noScroll.push({ locale, width, r });
        await page.close();
      }
    }
    for (const locale of ['en', 'uk']) {
      for (const width of [1536, 1920, 2560]) {
        const page = await browser.newPage();
        const r = await navigate(page, baseUrl, DEFAULT_ID, locale, width, 900, evalPageCap);
        results.pageCap.push({ locale, width, r });
        await page.close();
      }
    }
    for (const locale of ['en', 'uk']) {
      for (const width of [320, 1024, 1440]) {
        const page = await browser.newPage();
        const r = await navigate(page, baseUrl, DEFAULT_ID, locale, width, 900, evalRail);
        results.rail.push({ locale, width, r });
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
