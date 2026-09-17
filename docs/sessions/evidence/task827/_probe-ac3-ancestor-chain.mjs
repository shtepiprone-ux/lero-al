#!/usr/bin/env node
/**
 * Task 827 — AC3 one-off probe (evidence artifact, not a gate). For each of the 14 migrated
 * `System/*` story exports, at 1440/1535/1536/1920px in `en`, records the ancestor chain from the
 * story's track (grid/rail) up to `#storybook-root` — or, when no track renders (Loading/Empty/
 * EmptyState branches), from the View's root element instead — with each ancestor's tagName,
 * className and computed padding. Asserts no ancestor carries `.container-wide`.
 *
 * Reuses storybook-static/ (build first: npm run build-storybook). Not wired into package.json —
 * evidence-only, run directly: node docs/sessions/evidence/task827/_probe-ac3-ancestor-chain.mjs
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../..');
const STATIC_DIR = join(ROOT, 'storybook-static');
const PORT = 6035;
const LOCALE = 'en';
const HEIGHT = 900;
const WIDTHS = [1440, 1535, 1536, 1920];

const STORY_IDS = [
  'system-featuredlistings--default',
  'system-featuredlistings--locale-stress',
  'system-featuredlistings--loading',
  'system-featuredlistings--empty',
  'system-latestlistings--default',
  'system-latestlistings--locale-stress',
  'system-latestlistings--loading',
  'system-latestlistings--empty',
  'system-similarlistings--default',
  'system-similarlistings--locale-stress',
  'system-recentlyviewedsection--populated',
  'system-recentlyviewedsection--mobile-scroll',
  'system-recentlyviewedsection--empty-state',
  'system-recentlyviewedsection--locale-stress',
];

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
      const filePath = join(staticDir, decodeURIComponent(urlPath));
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

async function findTrackSelectors(staticDir) {
  const assetsDir = join(staticDir, 'assets');
  const files = readdirSync(assetsDir);
  const match = files.find((f) => /^MantineListingCardTrack-.*\.css$/.test(f));
  if (!match) return null;
  const css = readFileSync(join(assetsDir, match), 'utf8');
  const gridClasses = [...new Set([...css.matchAll(/\.(_grid_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  const railClasses = [...new Set([...css.matchAll(/\.(_rail_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  if (gridClasses.length !== 1 || railClasses.length !== 1) return null;
  return { gridClass: gridClasses[0], railClass: railClasses[0] };
}

async function waitForRenderPhase(page, storyId, timeout) {
  try {
    await page.waitForFunction(
      (expectedId) => {
        const render = window.__STORYBOOK_PREVIEW__ && window.__STORYBOOK_PREVIEW__.currentRender;
        if (!render) return false;
        return render.id === expectedId && (render.phase === 'finished' || render.phase === 'errored');
      },
      storyId,
      { timeout },
    );
    return { timedOut: false };
  } catch {
    return { timedOut: true };
  }
}

/* eslint-disable no-undef */
function evalAncestorChain({ gridClass, railClass }) {
  let track = gridClass ? document.querySelector(`.${gridClass}, .${railClass}`) : null;
  let source = 'track';
  if (!track) {
    const root = document.querySelector('#storybook-root');
    track = root ? root.firstElementChild : null;
    source = 'view-root';
  }
  if (!track) return { source: 'none', chain: [] };
  const chain = [];
  let el = track;
  while (el && el.id !== 'storybook-root') {
    const cs = getComputedStyle(el);
    chain.push({
      tagName: el.tagName.toLowerCase(),
      className: el.className && typeof el.className === 'string' ? el.className : '',
      paddingLeft: cs.paddingLeft,
      paddingRight: cs.paddingRight,
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
    });
    el = el.parentElement;
  }
  return { source, chain };
}
/* eslint-enable no-undef */

async function main() {
  if (!existsSync(STATIC_DIR)) {
    console.error(`storybook-static/ not found. Build first: npm run build-storybook`);
    process.exit(1);
  }
  const { chromium } = await import('playwright');
  const selectors = await findTrackSelectors(STATIC_DIR);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const server = await startStaticServer(STATIC_DIR, PORT);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const results = [];
  let anyContainerWide = false;

  try {
    for (const storyId of STORY_IDS) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        const url = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:${LOCALE}&viewMode=story`;
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        const ready = await waitForRenderPhase(page, storyId, 15000);
        if (ready.timedOut) {
          results.push({ storyId, width, error: 'render phase did not reach finished/errored' });
          continue;
        }
        const { source, chain } = await page.evaluate(evalAncestorChain, selectors ?? { gridClass: null, railClass: null });
        const containerWideAncestor = chain.find((c) => c.className.split(/\s+/).includes('container-wide'));
        if (containerWideAncestor) anyContainerWide = true;
        results.push({ storyId, width, source, chain, containerWideAncestor: containerWideAncestor ?? null });
      }
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  const outPath = join(__dirname, '22_ac3-ancestor-chain-probe.json');
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), widths: WIDTHS, locale: LOCALE, storyIds: STORY_IDS, results }, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`Cells: ${results.length}. Any container-wide ancestor: ${anyContainerWide}`);
  process.exit(anyContainerWide ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
