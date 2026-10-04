// GR-7 workflow operation for Task 794: operate every gallery control on the relevant reference pages.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const ONLY = process.argv[3] || '';
const log = [];
function rec(page, step, data) { const row = { page, step, ...data }; log.push(row); console.log(JSON.stringify(row).slice(0, 400)); }

const browser = await chromium.launch();

async function shot(p, name) { await p.screenshot({ path: join(OUT, `op-${name}.png`), fullPage: false }); return `op-${name}.png`; }

async function mainImgSrc(p, sel) {
  return p.evaluate((s) => { const el = document.querySelector(s); return el ? (el.currentSrc || el.src || el.style.backgroundImage) : null; }, sel);
}

async function biggestImgs(p, n = 6) {
  return p.evaluate((n) => [...document.querySelectorAll('img')].map(i => { const b = i.getBoundingClientRect(); const cs = getComputedStyle(i); return { src: (i.currentSrc || i.src).split('/').pop().slice(0, 60), w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.left), y: Math.round(b.top + scrollY), radius: cs.borderRadius, fit: cs.objectFit, cursor: cs.cursor, border: cs.borderWidth + ' ' + cs.borderColor }; }).filter(i => i.w >= 40).sort((a, b) => b.w * b.h - a.w * a.h).slice(0, n), n);
}

// ---------- Kamr ----------
async function kamr() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://kamr-vite.vercel.app/login', { waitUntil: 'networkidle' });
  await p.locator('button', { hasText: /sign me in/i }).click();
  await p.waitForURL(/dashboard/, { timeout: 20000 });
  await p.waitForTimeout(1500);
  rec('kamr', 'login', { url: p.url() });

  // Product detail: thumbnail selection
  await p.goto('https://kamr-vite.vercel.app/ecom-product-detail', { waitUntil: 'networkidle' });
  if (await p.locator('button:has-text("Sign Me In")').count()) { await p.locator('button:has-text("Sign Me In")').click(); await p.waitForLoadState('networkidle'); await p.goto('https://kamr-vite.vercel.app/ecom-product-detail', { waitUntil: 'networkidle' }); }
  await p.waitForTimeout(1000);
  rec('kamr-product-detail', 'loaded', { url: p.url(), imgs: await biggestImgs(p, 8) });
  await shot(p, 'kamr-product-detail-1440');
  const thumbs = p.locator('.nav-tabs img, .nav img, [role="tab"] img, .tab-slide-content img, .nav-link img');
  const tc = await thumbs.count();
  rec('kamr-product-detail', 'thumb-count', { count: tc });
  if (tc > 1) {
    await thumbs.nth(1).click();
    await p.waitForTimeout(600);
    rec('kamr-product-detail', 'after-thumb-2', { imgs: await biggestImgs(p, 3) });
    await shot(p, 'kamr-product-detail-thumb2');
  }
  // Lightgallery: open, arrow, next, Esc
  await p.goto('https://kamr-vite.vercel.app/uc-lightgallery', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  rec('kamr-lightgallery', 'loaded', { url: p.url(), imgs: await biggestImgs(p, 6) });
  await shot(p, 'kamr-lightgallery-1440');
  const item = p.locator('a[data-src], a[href$=".jpg"], a[href$=".png"], .lightgallery a, [data-lg-size], img').first();
  await item.click().catch(e => rec('kamr-lightgallery', 'click-error', { e: String(e).slice(0, 120) }));
  await p.waitForTimeout(1200);
  const lb = await p.evaluate(() => { const o = document.querySelector('.lg-outer, .lg-container, .yarl__root, [class*="lightbox" i], [role="dialog"]'); if (!o) return null; const c = document.querySelector('.lg-counter, [class*="counter" i]'); return { cls: String(o.className).slice(0, 100), counter: c ? c.textContent.trim() : null, thumbs: document.querySelectorAll('.lg-thumb-item, [class*="thumbnail" i]').length, bg: getComputedStyle(o).backgroundColor }; });
  rec('kamr-lightgallery', 'open', { lb });
  await shot(p, 'kamr-lightgallery-open');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(700);
  rec('kamr-lightgallery', 'arrow-right', { counter: await p.evaluate(() => document.querySelector('.lg-counter, [class*="counter" i]')?.textContent.trim() ?? null) });
  const nextBtn = p.locator('.lg-next, [aria-label*="next" i], button[class*="next" i]').first();
  if (await nextBtn.count()) { await nextBtn.click().catch(() => null); await p.waitForTimeout(700); rec('kamr-lightgallery', 'next-button', { counter: await p.evaluate(() => document.querySelector('.lg-counter, [class*="counter" i]')?.textContent.trim() ?? null) }); }
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(700);
  rec('kamr-lightgallery', 'arrow-left', { counter: await p.evaluate(() => document.querySelector('.lg-counter, [class*="counter" i]')?.textContent.trim() ?? null) });
  await shot(p, 'kamr-lightgallery-after-nav');
  await p.keyboard.press('Escape'); await p.waitForTimeout(900);
  rec('kamr-lightgallery', 'escape', { stillOpen: await p.evaluate(() => { const o = document.querySelector('.lg-outer.lg-visible, .lg-container.lg-show, .lg-show'); return !!o; }) });

  // Guest details swiper
  await p.goto('https://kamr-vite.vercel.app/guest-details', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  rec('kamr-guest-details', 'loaded', { imgs: await biggestImgs(p, 6) });
  await shot(p, 'kamr-guest-details-1440');
  const swNext = p.locator('.swiper-button-next, [class*="swiper"] [class*="next" i]').first();
  if (await swNext.count()) { await swNext.click().catch(() => null); await p.waitForTimeout(700); rec('kamr-guest-details', 'swiper-next', { imgs: await biggestImgs(p, 3) }); }

  // Kamr carousel
  await p.goto('https://kamr-vite.vercel.app/ui-carousel', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  await shot(p, 'kamr-ui-carousel-1440');
  const cNext = p.locator('.carousel-control-next').first();
  if (await cNext.count()) { await cNext.click(); await p.waitForTimeout(900); rec('kamr-ui-carousel', 'next', { active: await p.evaluate(() => [...document.querySelectorAll('.carousel-item')].findIndex(i => i.classList.contains('active'))) }); }

  // Mobile pass for product detail + lightgallery
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto('https://kamr-vite.vercel.app/ecom-product-detail', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  rec('kamr-product-detail', 'loaded-390', { imgs: await biggestImgs(p, 6) });
  await shot(p, 'kamr-product-detail-390');
  await p.goto('https://kamr-vite.vercel.app/uc-lightgallery', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  await shot(p, 'kamr-lightgallery-390');
  await ctx.close();
}

// ---------- Lahomes ----------
async function lahomes() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://techzaa.in/lahomes/admin/property-details.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  rec('lahomes-property-details', 'loaded', { imgs: await biggestImgs(p, 4) });
  const hero = p.locator('img').filter({ hasNot: p.locator('xx') });
  // click the hero photo: does anything open?
  const big = await biggestImgs(p, 1);
  const heroLoc = p.locator(`img[src*="${big[0].src}"]`).first();
  await heroLoc.click().catch(() => null); await p.waitForTimeout(800);
  rec('lahomes-property-details', 'hero-click', { dialog: await p.evaluate(() => !!document.querySelector('.modal.show, [role="dialog"], .glightbox-open, .lg-outer')), url: p.url() });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(600);
  rec('lahomes-property-details', 'loaded-390', { imgs: await biggestImgs(p, 3) });
  await shot(p, 'lahomes-property-details-390');

  for (const [name, url] of [['lahomes-agents-details', 'https://techzaa.in/lahomes/admin/agents-details.html'], ['lahomes-ui-carousel', 'https://techzaa.in/lahomes/admin/ui-carousel.html'], ['lahomes-index', 'https://techzaa.in/lahomes/admin/index.html']]) {
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const car = p.locator('.carousel').first();
    await car.scrollIntoViewIfNeeded().catch(() => null);
    const before = await p.evaluate(() => [...document.querySelectorAll('.carousel')][0] ? [...document.querySelectorAll('.carousel')[0].querySelectorAll('.carousel-item')].findIndex(i => i.classList.contains('active')) : null);
    const geo = await p.evaluate(() => { const c = document.querySelector('.carousel'); if (!c) return null; const b = c.getBoundingClientRect(); const img = c.querySelector('.carousel-item.active img'); const ib = img?.getBoundingClientRect(); const ind = c.querySelectorAll('.carousel-indicators [data-bs-target], .carousel-indicators li, .carousel-indicators button').length; const thumbs = c.querySelectorAll('.carousel-indicators img').length; return { w: Math.round(b.width), h: Math.round(b.height), imgW: ib && Math.round(ib.width), imgH: ib && Math.round(ib.height), radius: img ? getComputedStyle(img).borderRadius : null, indicators: ind, thumbIndicators: thumbs, controls: c.querySelectorAll('.carousel-control-next, .carousel-control-prev').length }; });
    rec(name, 'carousel-geometry', { geo, before });
    await shot(p, `${name}-carousel`);
    const nx = car.locator('.carousel-control-next');
    if (await nx.count()) { await nx.first().click(); await p.waitForTimeout(900); }
    const after = await p.evaluate(() => [...document.querySelectorAll('.carousel')][0] ? [...document.querySelectorAll('.carousel')[0].querySelectorAll('.carousel-item')].findIndex(i => i.classList.contains('active')) : null);
    rec(name, 'carousel-next', { after });
    await p.keyboard.press('ArrowRight').catch(() => null); await p.waitForTimeout(900);
    rec(name, 'carousel-arrowkey', { activeAfterKey: await p.evaluate(() => [...document.querySelectorAll('.carousel')][0] ? [...document.querySelectorAll('.carousel')[0].querySelectorAll('.carousel-item')].findIndex(i => i.classList.contains('active')) : null) });
  }
  await ctx.close();
}

// ---------- TailAdmin ----------
async function tailadmin() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://demo.tailadmin.com/carousel', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const geo = await p.evaluate(() => [...document.querySelectorAll('.swiper')].map(s => { const b = s.getBoundingClientRect(); const img = s.querySelector('.swiper-slide-active img'); const cs = getComputedStyle(s); return { cls: String(s.className).slice(0, 80), w: Math.round(b.width), h: Math.round(b.height), radius: cs.borderRadius, border: cs.borderWidth + ' ' + cs.borderColor, imgRadius: img && getComputedStyle(img).borderRadius, nav: s.parentElement.querySelectorAll('[class*="prev" i],[class*="next" i]').length, bullets: s.parentElement.querySelectorAll('.swiper-pagination-bullet').length }; }));
  rec('tailadmin-carousel', 'geometry', { geo });
  await shot(p, 'tailadmin-carousel-1440');
  const nx = p.locator('[class*="next" i]').first();
  if (await nx.count()) { await nx.click().catch(() => null); await p.waitForTimeout(800); }
  rec('tailadmin-carousel', 'next', { active: await p.evaluate(() => [...document.querySelectorAll('.swiper')].map(s => s.swiper ? s.swiper.realIndex : [...s.querySelectorAll('.swiper-slide')].findIndex(x => x.classList.contains('swiper-slide-active')))) });
  const navBtn = await p.evaluate(() => { const b = document.querySelector('[class*="next" i]'); if (!b) return null; const cs = getComputedStyle(b); const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, bg: cs.backgroundColor, color: cs.color }; });
  rec('tailadmin-carousel', 'nav-button', { navBtn });
  await shot(p, 'tailadmin-carousel-after-next');
  await p.goto('https://demo.tailadmin.com/images', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  rec('tailadmin-images', 'loaded', { imgs: await biggestImgs(p, 8) });
  await shot(p, 'tailadmin-images-1440');
  const first = (await biggestImgs(p, 1))[0];
  await p.locator(`img[src*="${first.src}"]`).first().click().catch(() => null); await p.waitForTimeout(700);
  rec('tailadmin-images', 'click-image', { dialog: await p.evaluate(() => !!document.querySelector('[role="dialog"], .modal, [class*="lightbox" i]')) });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto('https://demo.tailadmin.com/carousel', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await shot(p, 'tailadmin-carousel-390');
  await ctx.close();
}

// ---------- Rozetka (owner-provided gallery reference, Task 813/824) ----------
async function rozetka() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'uk-UA', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' });
  const p = await ctx.newPage();
  const resp = await p.goto('https://rozetka.com.ua/ua/mobile-phones/c80003/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => { rec('rozetka', 'entry-error', { e: String(e).slice(0, 160) }); return null; });
  await p.waitForTimeout(6000); await p.mouse.wheel(0, 1500); await p.waitForTimeout(2000);
  rec('rozetka', 'entry', { status: resp && resp.status(), url: p.url(), title: await p.title() });
  await shot(p, 'rozetka-entry');
  const productHref = await p.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/p"]')].map(a => a.href).find(h => /rozetka\.com\.ua\/(ua\/)?[^/]+\/p\d+\/?$/.test(h)); return a || null; });
  rec('rozetka', 'product-link', { productHref });
  if (!productHref) { await ctx.close(); return; }
  await p.goto(productHref, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(3500);
  rec('rozetka-product', 'loaded', { url: p.url(), title: await p.title(), imgs: await biggestImgs(p, 10) });
  await shot(p, 'rozetka-product-1440');
  const thumbInfo = await p.evaluate(() => { const ts = [...document.querySelectorAll('img')].filter(i => { const b = i.getBoundingClientRect(); return b.width >= 30 && b.width <= 90 && b.top < 900; }); return ts.slice(0, 12).map(i => { const b = i.getBoundingClientRect(); const box = i.closest('button, li, a') || i.parentElement; const cs = getComputedStyle(box); return { w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.left), y: Math.round(b.top), boxTag: box.tagName.toLowerCase(), boxRadius: cs.borderRadius, boxBorder: cs.borderWidth + ' ' + cs.borderStyle + ' ' + cs.borderColor }; }); });
  rec('rozetka-product', 'thumbs', { thumbInfo });
  const thumbs = p.locator('img').filter({});
  const smallIdx = await p.evaluate(() => [...document.querySelectorAll('img')].map((i, idx) => ({ idx, b: i.getBoundingClientRect() })).filter(o => o.b.width >= 30 && o.b.width <= 90 && o.b.top < 900).map(o => o.idx));
  if (smallIdx.length > 1) {
    await p.locator('img').nth(smallIdx[1]).click().catch(() => null); await p.waitForTimeout(900);
    rec('rozetka-product', 'after-thumb-2', { imgs: await biggestImgs(p, 2), dialog: await p.evaluate(() => !!document.querySelector('[role="dialog"], .modal, rz-modal-layout, [class*="modal" i]')) });
    await shot(p, 'rozetka-product-thumb2');
  }
  const nextArrow = p.locator('button[class*="next" i], [aria-label*="Наступ" i], [aria-label*="next" i]').first();
  if (await nextArrow.count()) { await nextArrow.click().catch(() => null); await p.waitForTimeout(800); rec('rozetka-product', 'next-arrow', { imgs: await biggestImgs(p, 1) }); }
  const main = (await biggestImgs(p, 1))[0];
  if (main) { await p.locator(`img[src*="${main.src}"]`).first().click().catch(() => null); await p.waitForTimeout(1500); }
  const modal = await p.evaluate(() => { const m = document.querySelector('rz-modal-layout, [role="dialog"], .modal, [class*="modal" i]'); if (!m) return null; const b = m.getBoundingClientRect(); return { cls: String(m.className).slice(0, 80), w: Math.round(b.width), h: Math.round(b.height), bg: getComputedStyle(m).backgroundColor }; });
  rec('rozetka-product', 'main-click-modal', { modal });
  await shot(p, 'rozetka-product-modal');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(800);
  await shot(p, 'rozetka-product-modal-arrow');
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  rec('rozetka-product', 'escape', { modalAfter: await p.evaluate(() => !!document.querySelector('rz-modal-layout')) });
  await p.setViewportSize({ width: 390, height: 844 }); await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500);
  rec('rozetka-product', 'loaded-390', { imgs: await biggestImgs(p, 4) });
  await shot(p, 'rozetka-product-390');
  await ctx.close();
}

for (const [n, f] of [['kamr', kamr], ['lahomes', lahomes], ['tailadmin', tailadmin], ['rozetka', rozetka]]) {
  if (ONLY && ONLY !== n) continue;
  try { await f(); } catch (e) { rec(n, 'fatal', { e: String(e).slice(0, 240) }); }
}
writeFileSync(join(OUT, `operate-log${ONLY ? '-' + ONLY : ''}.json`), JSON.stringify(log, null, 2));
await browser.close();
