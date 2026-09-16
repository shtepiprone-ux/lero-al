import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const staticDir = 'C:/Claude_Code_Projects/lero-al/storybook-static';
const PORT = 6036;
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

async function extractTrackSelectors() {
  const assetsDir = join(staticDir, 'assets');
  const files = await readdir(assetsDir);
  const matches = files.filter((f) => /^MantineListingCardTrack-.*\.css$/.test(f));
  const css = await readFile(join(assetsDir, matches[0]), 'utf8');
  const gridClasses = [...new Set([...css.matchAll(/\.(_grid_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  const railClasses = [...new Set([...css.matchAll(/\.(_rail_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
  return { asset: matches[0], gridClass: gridClasses[0], railClass: railClasses[0] };
}

const selectors = await extractTrackSelectors();
console.log('selectors:', JSON.stringify(selectors));

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();

function evalTracks({ gridClass, railClass }) {
  const els = Array.from(document.querySelectorAll(`.${gridClass}, .${railClass}`));
  return els.map((el) => ({ isGrid: el.classList.contains(gridClass), cls: el.className }));
}

async function waitForRenderSettled(pg, timeout) {
  try {
    await pg.waitForFunction(
      () => {
        const cl = document.body.classList;
        return cl.contains('sb-show-main') || cl.contains('sb-show-errordisplay') || cl.contains('sb-show-nopreview');
      },
      undefined,
      { timeout },
    );
  } catch {
    return { state: null };
  }
  return pg.evaluate(() => {
    const classList = Array.from(document.body.classList);
    return { state: classList.includes('sb-show-main') ? 'sb-show-main' : (classList.includes('sb-show-errordisplay') ? 'sb-show-errordisplay' : (classList.includes('sb-show-nopreview') ? 'sb-show-nopreview' : null)), classList };
  });
}

for (const storyId of ['patterns-mantine-listingcardtrack--grid', 'patterns-mantine-listingcardtrack--rail', 'mantine-primitives-favoritesshell--populated']) {
  for (const width of [320, 1440]) {
    const url = `http://127.0.0.1:${PORT}/iframe.html?id=${storyId}&globals=locale:en&viewMode=story`;
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    const settled = await waitForRenderSettled(page, 15000);
    const tracks = await page.evaluate(evalTracks, selectors);
    console.log(storyId, width, JSON.stringify(settled), 'tracks:', JSON.stringify(tracks));
  }
}

await browser.close();
await new Promise((r) => server.close(r));
