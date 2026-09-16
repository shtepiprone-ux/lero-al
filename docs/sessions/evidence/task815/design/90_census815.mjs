// Task 815 task-design measurement (scratch, not a repo artifact).
// Discovers every Storybook story that renders MantineListingCardTrack and sweeps rung boundaries.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const { chromium } = createRequire(join(ROOT, 'package.json'))('playwright');
const STATIC = join(ROOT, 'storybook-static');
const OUT = process.argv[2];
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };

const server = createServer(async (req, res) => {
  let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
  try { const d = await readFile(join(STATIC, decodeURIComponent(p))); res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(6031, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:6031';

const assets = await readdir(join(STATIC, 'assets'));
const cssFiles = assets.filter((f) => /^MantineListingCardTrack-.*\.css$/.test(f));
const css = await readFile(join(STATIC, 'assets', cssFiles[0]), 'utf8');
const gridCls = [...new Set([...css.matchAll(/\.(_grid_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
const railCls = [...new Set([...css.matchAll(/\.(_rail_[a-z0-9]+_\d+)/g)].map((m) => m[1]))];
const log = { cssFiles, gridCls, railCls, discovery: [], sweeps: [] };
console.log(JSON.stringify({ cssFiles, gridCls, railCls }));

const index = JSON.parse(await readFile(join(STATIC, 'index.json'), 'utf8'));
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

function measure({ gridCls, railCls }) {
  const out = [];
  for (const el of document.querySelectorAll(gridCls.map((c) => '.' + c).concat(railCls.map((c) => '.' + c)).join(','))) {
    const isGrid = gridCls.some((c) => el.classList.contains(c));
    const cs = getComputedStyle(el);
    const w = el.getBoundingClientRect().width;
    if (isGrid) {
      out.push({ mode: 'grid', width: w, columns: cs.gridTemplateColumns.trim() === 'none' ? 0 : cs.gridTemplateColumns.trim().split(/\s+/).length, children: el.children.length });
    } else {
      const r = el.getBoundingClientRect();
      const full = Array.from(el.children).filter((c) => { const cr = c.getBoundingClientRect(); return cr.left >= r.left - 0.5 && cr.right <= r.left + el.clientWidth + 0.5; }).length;
      out.push({ mode: 'rail', width: w, fullyVisible: full, children: el.children.length });
    }
  }
  return out;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const t0 = Date.now();
for (const s of stories) {
  const url = `${BASE}/iframe.html?id=${s.id}&viewMode=story&globals=locale:en`;
  let found = [];
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(700);
    found = await page.evaluate(measure, { gridCls, railCls });
  } catch (e) { found = [{ error: String(e).slice(0, 120) }]; }
  if (found.length) log.discovery.push({ id: s.id, title: s.title, name: s.name, importPath: s.importPath, found });
}
console.log('discovery seconds', (Date.now() - t0) / 1000, 'hits', log.discovery.length);

const WIDTHS = [320, 479, 480, 481, 639, 640, 641, 767, 768, 769, 1023, 1024, 1025, 1279, 1280, 1281, 1439, 1440, 1441, 1920];
for (const d of log.discovery.filter((x) => !x.found[0]?.error)) {
  const cells = [];
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${BASE}/iframe.html?id=${d.id}&viewMode=story&globals=locale:en`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(500);
    cells.push({ w, tracks: await page.evaluate(measure, { gridCls, railCls }) });
  }
  const drops = [];
  const nTracks = Math.max(...cells.map((c) => c.tracks.length));
  for (let t = 0; t < nTracks; t++) {
    let prev = null;
    for (const c of cells) {
      const tr = c.tracks[t]; if (!tr) { drops.push({ track: t, w: c.w, reason: 'missing' }); continue; }
      const v = tr.mode === 'grid' ? tr.columns : tr.fullyVisible;
      if (prev && v < prev.v) drops.push({ track: t, mode: tr.mode, from: prev.w, to: c.w, before: prev.v, after: v, widthBefore: prev.width, widthAfter: tr.width });
      prev = { w: c.w, v, width: tr.width };
    }
  }
  log.sweeps.push({ id: d.id, cells, drops });
  console.log(d.id, 'tracks', nTracks, 'drops', JSON.stringify(drops));
}
console.log('total seconds', (Date.now() - t0) / 1000);
writeFileSync(OUT, JSON.stringify(log, null, 2));
await browser.close(); server.close();
