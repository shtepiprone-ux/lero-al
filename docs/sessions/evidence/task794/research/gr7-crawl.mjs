// GR-7 route inventory crawler for Task 794 (gallery). Writes inventory JSON + screenshots of gallery-bearing pages.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const REF = process.argv[3]; // tailadmin | lahomes | kamr
const LIMIT = Number(process.argv[4] || 200);
mkdirSync(OUT, { recursive: true });

const ENTRY = {
  tailadmin: 'https://demo.tailadmin.com/',
  lahomes: 'https://techzaa.in/lahomes/admin/',
  kamr: 'https://kamr-vite.vercel.app/dashboard',
}[REF];

const GALLERY_SEL = [
  '[class*="carousel" i]', '[class*="swiper" i]', '[class*="slider" i]', '[class*="gallery" i]',
  '[class*="lightbox" i]', '[class*="slick" i]', '[data-bs-ride]', '[class*="glightbox" i]', '[class*="splide" i]',
  '[class*="thumb" i]',
].join(',');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const origin = new URL(ENTRY).origin;
const scopePrefix = REF === 'lahomes' ? 'https://techzaa.in/lahomes/admin/' : origin + '/';

async function maybeLogin() {
  if (REF !== 'kamr') return;
  const u = page.url();
  if (/login|sign-?in|auth/i.test(u) || (await page.locator('input[type="password"]').count()) > 0) {
    const btn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log in")').first();
    if (await btn.count()) {
      await btn.click().catch(() => null);
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    }
  }
}

function norm(href) {
  try {
    const u = new URL(href, page.url());
    u.hash = '';
    if (!u.href.startsWith(scopePrefix)) return null;
    if (/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js)$/i.test(u.pathname)) return null;
    return u.href;
  } catch { return null; }
}

const queue = [ENTRY];
const seen = new Set();
const rows = [];
while (queue.length && rows.length < LIMIT) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  const row = { url, finalUrl: null, status: null, title: null, h1: null, imgCount: 0, galleryHits: [], state: 'inspected', screenshot: null, error: null };
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => page.goto(url, { waitUntil: 'load', timeout: 30000 }));
    row.status = resp ? resp.status() : null;
    await maybeLogin();
    if (REF === 'kamr' && page.url() !== url && !seen.has(page.url())) { /* after login redirect */ }
    await page.waitForTimeout(600);
    row.finalUrl = page.url();
    row.title = await page.title();
    row.h1 = await page.locator('h1, h2, h3, h4').first().innerText({ timeout: 1500 }).catch(() => null);
    const info = await page.evaluate((sel) => {
      const imgs = [...document.querySelectorAll('img')].filter(i => i.getBoundingClientRect().width > 40);
      const hits = [...document.querySelectorAll(sel)]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 60 && r.height > 40; })
        .slice(0, 12)
        .map(el => ({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 120), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), imgs: el.querySelectorAll('img').length }));
      const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
      return { imgCount: imgs.length, hits, links };
    }, GALLERY_SEL);
    row.imgCount = info.imgCount;
    row.galleryHits = info.hits;
    if (info.hits.some(h => h.imgs >= 2)) {
      const name = `${REF}-${String(rows.length).padStart(3, '0')}.png`;
      await page.screenshot({ path: join(OUT, name), fullPage: false });
      row.screenshot = name;
    }
    for (const l of info.links) {
      const n = norm(l);
      if (n && !seen.has(n) && !queue.includes(n)) queue.push(n);
    }
  } catch (e) {
    row.state = 'blocked';
    row.error = String(e).slice(0, 200);
  }
  rows.push(row);
  console.log(`${rows.length}\t${row.state}\t${row.status}\timgs=${row.imgCount}\thits=${row.galleryHits.filter(h => h.imgs >= 2).length}\t${row.finalUrl || url}`);
}
writeFileSync(join(OUT, `inventory-${REF}.json`), JSON.stringify({ ref: REF, entry: ENTRY, crawledAt: new Date().toISOString(), remainingQueue: queue, rows }, null, 2));
await browser.close();
