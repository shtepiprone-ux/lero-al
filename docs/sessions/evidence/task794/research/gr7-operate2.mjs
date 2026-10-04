// GR-7 Task 794 — focused operation: Kamr lightgallery + product-detail thumbs; Rozetka product with long wait.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT = 'docs/sessions/evidence/task794/research';
const log = []; const rec = (page, step, d) => { const r = { page, step, ...d }; log.push(r); console.log(JSON.stringify(r).slice(0, 500)); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://kamr-vite.vercel.app/login', { waitUntil: 'networkidle' });
await p.locator('button', { hasText: /sign me in/i }).click();
await p.waitForURL(/dashboard/, { timeout: 20000 });
// product detail thumbs
await p.goto('https://kamr-vite.vercel.app/ecom-product-detail', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
const geom = await p.evaluate(() => { const imgs = [...document.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return r.left > 300 && r.left < 760 && r.top > 200 && r.width > 50; }); return imgs.map(i => { const r = i.getBoundingClientRect(); const cs = getComputedStyle(i); const btn = i.closest('button, a, [role=tab], li'); return { src: i.src.split('/').pop(), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, fit: cs.objectFit, ctrl: btn ? btn.tagName + '.' + String(btn.className).slice(0, 40) : null, ctrlBorder: btn ? getComputedStyle(btn).border : null }; }); });
rec('kamr-product-detail', 'geometry-1440', { geom });
const thumbs = geom.filter(g => g.w < 150);
if (thumbs.length > 1) {
  const t = thumbs[1];
  await p.mouse.click(t.x + t.w / 2, t.y + t.h / 2); await p.waitForTimeout(900);
  const mainAfter = await p.evaluate(() => { const imgs = [...document.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return r.left > 300 && r.left < 760 && r.top > 200 && r.width > 300; }); return imgs.map(i => i.src.split('/').pop()); });
  rec('kamr-product-detail', 'thumb-2-click', { mainAfter, activeTabBorder: await p.evaluate(() => { const a = document.querySelector('.nav-link.active, .active[role=tab]'); return a ? getComputedStyle(a).border + ' / ' + getComputedStyle(a).borderRadius : null; }) });
  await p.screenshot({ path: `${OUT}/op2-kamr-product-detail-thumb2.png` });
}
// lightgallery
await p.goto('https://kamr-vite.vercel.app/uc-lightgallery', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
await p.mouse.click(442, 344); await p.waitForTimeout(1500);
const st = async () => p.evaluate(() => { const c = document.querySelector('.lg-container.lg-show, .lg-show'); const cnt = document.querySelector('.lg-counter'); const outer = document.querySelector('.lg-outer'); return { open: !!c, counter: cnt ? cnt.textContent.replace(/\s+/g, ' ').trim() : null, thumbs: document.querySelectorAll('.lg-thumb-item').length, bg: document.querySelector('.lg-backdrop') ? getComputedStyle(document.querySelector('.lg-backdrop')).backgroundColor : null, controls: [...document.querySelectorAll('.lg-toolbar button, .lg-prev, .lg-next')].map(x => x.getAttribute('aria-label') || x.className.slice(0, 20)) }; });
rec('kamr-lightgallery', 'open', await st());
await p.screenshot({ path: `${OUT}/op2-kamr-lightgallery-open.png` });
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(900); rec('kamr-lightgallery', 'ArrowRight', await st());
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(900); rec('kamr-lightgallery', 'ArrowRight-2', await st());
await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(900); rec('kamr-lightgallery', 'ArrowLeft', await st());
const nx = p.locator('.lg-next'); if (await nx.count()) { await nx.click(); await p.waitForTimeout(900); rec('kamr-lightgallery', 'next-button', await st()); }
const th = p.locator('.lg-thumb-item'); if (await th.count() > 4) { await th.nth(5).click(); await p.waitForTimeout(900); rec('kamr-lightgallery', 'thumb-6', await st()); }
// wrap at end
for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(700); }
rec('kamr-lightgallery', 'past-end-wrap', await st());
await p.screenshot({ path: `${OUT}/op2-kamr-lightgallery-nav.png` });
await p.keyboard.press('Escape'); await p.waitForTimeout(1000); rec('kamr-lightgallery', 'Escape', await st());
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
await p.goto('https://kamr-vite.vercel.app/ecom-product-detail', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
await p.screenshot({ path: `${OUT}/op2-kamr-product-detail-390.png` });
await ctx.close();
// Rozetka product with long wait
const rc = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'uk-UA', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' });
const r = await rc.newPage();
await r.goto('https://rozetka.com.ua/ua/mobile-phones/c80003/', { waitUntil: 'domcontentloaded', timeout: 45000 }); await r.waitForTimeout(6000);
const href = 'https://rozetka.com.ua/ua/samsung-sm-s741blggeuc/p613521086/';
await r.goto(href, { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 8; i++) { await r.waitForTimeout(4000); const t = await r.title(); rec('rozetka-product', 'wait', { i, title: t }); if (!/зачекайте/i.test(t)) break; }
await r.screenshot({ path: `${OUT}/op2-rozetka-product-1440.png` });
rec('rozetka-product', 'final', { url: r.url(), title: await r.title(), bigImgs: await r.evaluate(() => [...document.querySelectorAll('img')].map(i => { const q = i.getBoundingClientRect(); return { w: Math.round(q.width), h: Math.round(q.height), x: Math.round(q.left), y: Math.round(q.top) }; }).filter(o => o.w > 30).slice(0, 15)) });
await rc.close();
writeFileSync(`${OUT}/operate2-log.json`, JSON.stringify(log, null, 2));
await b.close();
