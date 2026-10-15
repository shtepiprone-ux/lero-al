// Review 3 (Opus): the D16 classes on the built Storybook - do the off-frame slides hold text or a control, and does the
// hover-zoomed image layer cover its frame on both axes? Diagnosis only.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
const root = 'storybook-static';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const srv = createServer(async (q, s) => { try { const p = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = join(root, p === '/' ? 'index.html' : p); const body = await readFile(f); s.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' }); s.end(body); } catch { if (!s.headersSent) s.writeHead(404); s.end(); } }).listen(0);
const port = srv.address().port;
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 320, height: 800 } });
const probe = () => {
  const cs = (e) => getComputedStyle(e);
  const CTRL = 'button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const out = [];
  for (const e of document.querySelectorAll('body *')) {
    const s = cs(e);
    if (!(s.position === 'absolute' || s.position === 'fixed' || s.transform !== 'none')) continue;
    let c = null; for (let q = e.parentElement; q; q = q.parentElement) if (cs(q).overflowX !== 'visible' || cs(q).overflowY !== 'visible') { c = q; break; }
    if (!c) continue;
    const r = e.getBoundingClientRect(); const k = c.getBoundingClientRect();
    if (!r.width || !k.width) continue;
    if (!(r.right > k.right + 0.5 || r.left < k.left - 0.5)) continue;
    const wholly = r.right <= k.left + 0.5 || r.left >= k.right - 0.5;
    const coversXY = r.left <= k.left + 0.5 && r.right >= k.right - 0.5 && r.top <= k.top + 0.5 && r.bottom >= k.bottom - 0.5;
    out.push({ el: `${e.tagName.toLowerCase()}.${[...e.classList].join('.').slice(0, 40)}`, wholly, coversXY, text: (e.innerText ?? '').trim().slice(0, 20), controls: e.matches(CTRL) ? 1 : e.querySelectorAll(CTRL).length, media: e.matches('img,video,picture,canvas') || !!e.querySelector('img,video,picture,canvas') });
  }
  return out;
};
const res = {};
for (const [id, click] of [['mantine-primitives-lightboxview--default', null], ['patterns-mantine-listingdetailview--archived-listing', null], ['mantine-primitives-favoritesshell--populated', 'hover']]) {
  await page.goto(`http://localhost:${port}/iframe.html?id=${id}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  if (click === 'hover') { await page.locator('#storybook-root img').first().hover().catch(() => {}); await page.waitForTimeout(800); }
  const rows = await page.evaluate(probe);
  const agg = {};
  for (const r of rows) { const k = `${r.el} wholly=${r.wholly} coversXY=${r.coversXY} text=${!!r.text} controls=${r.controls} media=${r.media}`; agg[k] = (agg[k] ?? 0) + 1; }
  res[id] = agg;
}
await b.close(); srv.close();
console.log(JSON.stringify(res, null, 1));
