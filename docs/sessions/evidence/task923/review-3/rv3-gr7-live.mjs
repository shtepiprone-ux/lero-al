// Review 3 (Opus) GR-7 live check: do the references keep carousel slides translated wholly outside their clipping
// frame, and hover-zoomed images larger than their clipping frame? (the two by-design classes of D16)
import { chromium } from 'playwright';
const out = [];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const probe = () => {
  const cs = (e) => getComputedStyle(e);
  const clipper = (e) => { for (let q = e.parentElement; q; q = q.parentElement) if (cs(q).overflowX !== 'visible') return q; return null; };
  const res = { slidesWhollyOut: [], mediaCovering: [], textPast: [] };
  for (const e of document.querySelectorAll('body *')) {
    const s = cs(e);
    if (!(s.position === 'absolute' || s.position === 'fixed' || s.transform !== 'none')) continue;
    const c = clipper(e); if (!c) continue;
    const r = e.getBoundingClientRect(); const k = c.getBoundingClientRect();
    if (r.width === 0 || k.width === 0) continue;
    const past = r.right > k.right + 0.5 || r.left < k.left - 0.5;
    if (!past) continue;
    const d = `${e.tagName.toLowerCase()}.${[...e.classList].slice(0,2).join('.')} x ${Math.round(r.left)}..${Math.round(r.right)} past ${c.tagName.toLowerCase()}.${[...c.classList].slice(0,2).join('.')} ${Math.round(k.left)}..${Math.round(k.right)}`;
    const wholly = r.right <= k.left + 0.5 || r.left >= k.right - 0.5;
    const covers = r.left <= k.left + 0.5 && r.right >= k.right - 0.5 && r.top <= k.top + 0.5 && r.bottom >= k.bottom - 0.5;
    if (wholly) res.slidesWhollyOut.push(d); else if (e.matches('img,video,picture,canvas') && covers) res.mediaCovering.push(d); else if (e.innerText?.trim()) res.textPast.push(d);
  }
  for (const k in res) res[k] = { n: res[k].length, sample: res[k].slice(0, 4) };
  return res;
};
for (const [name, url, hover] of [
  ['lahomes-ui-carousel', 'https://techzaa.in/lahomes/admin/ui-carousel.html', null],
  ['lahomes-property-grid', 'https://techzaa.in/lahomes/admin/property-grid.html', 'img'],
  ['lahomes-property-details', 'https://techzaa.in/lahomes/admin/property-details.html', null],
]) {
  try {
    await p.goto(url, { waitUntil: 'load', timeout: 45000 });
    await p.waitForTimeout(1500);
    if (hover) { const img = p.locator('main img, .card img').first(); if (await img.count()) { await img.hover({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(800); } }
    out.push({ name, url, scroll: await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]), ...(await p.evaluate(probe)) });
  } catch (e) { out.push({ name, url, error: String(e.message).split('\n')[0] }); }
}
await b.close();
console.log(JSON.stringify(out, null, 1));
