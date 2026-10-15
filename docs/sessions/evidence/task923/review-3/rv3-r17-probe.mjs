// Review 3 (Opus): why are recentlyviewedgridview buttons not operable (R17), and does a forced click open a portal?
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
const out = [];
for (const w of [390, 1440]) {
  await page.setViewportSize({ width: w, height: 800 });
  for (const name of ['Next listings', 'Add to favorites', 'Copy listing ID']) {
    await page.goto(`http://localhost:${port}/iframe.html?id=mantine-primitives-recentlyviewedgridview--populated&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const btn = page.locator('#storybook-root').getByRole('button', { name }).first();
    const info = await btn.evaluate((b) => {
      const r = b.getBoundingClientRect(); const cs = getComputedStyle(b);
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], disabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled'), pe: cs.pointerEvents, vis: cs.visibility, op: cs.opacity, hit: hit ? `${hit.tagName.toLowerCase()}.${[...hit.classList].join('.').slice(0, 50)}` : null, hitIsBtn: !!hit && (hit === b || b.contains(hit)), vw: innerWidth };
    }).catch((e) => ({ error: String(e.message).split('\n')[0] }));
    const before = await page.evaluate(() => document.querySelectorAll('[data-portal="true"]').length);
    await btn.click({ force: true, timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => [...document.querySelectorAll('[data-portal="true"]')].filter((p) => p.innerText.trim()).length);
    out.push({ w, name, ...info, portalsBefore: before, visiblePortalsAfterForcedClick: after });
  }
}
await b.close(); srv.close();
console.log(JSON.stringify(out, null, 1));
