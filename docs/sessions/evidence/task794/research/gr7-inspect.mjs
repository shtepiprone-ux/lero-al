// GR-7 page-level inspection for Task 794: screenshots at 1440/390 + DOM/computed-style summary of image containers.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const PAGES = [
  ['lahomes-property-details', 'https://techzaa.in/lahomes/admin/property-details.html'],
  ['lahomes-agents-details', 'https://techzaa.in/lahomes/admin/agents-details.html'],
  ['lahomes-customers-details', 'https://techzaa.in/lahomes/admin/customers-details.html'],
  ['lahomes-property-grid', 'https://techzaa.in/lahomes/admin/property-grid.html'],
  ['lahomes-ui-carousel', 'https://techzaa.in/lahomes/admin/ui-carousel.html'],
  ['lahomes-swiper', 'https://techzaa.in/lahomes/admin/extended-swiper-silder.html'],
  ['lahomes-post-details', 'https://techzaa.in/lahomes/admin/post-details.html'],
  ['kamr-product-detail', 'https://kamr-vite.vercel.app/ecom-product-detail'],
  ['kamr-lightgallery', 'https://kamr-vite.vercel.app/uc-lightgallery'],
  ['kamr-guest-details', 'https://kamr-vite.vercel.app/guest-details'],
  ['kamr-ui-carousel', 'https://kamr-vite.vercel.app/ui-carousel'],
  ['tailadmin-carousel', 'https://demo.tailadmin.com/carousel'],
  ['tailadmin-images', 'https://demo.tailadmin.com/images'],
];

const browser = await chromium.launch();
const results = [];
for (const [name, url] of PAGES) {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const r = { name, url, width, finalUrl: null, containers: [], error: null, shot: `${name}-${width}.png` };
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 }).catch(() => page.goto(url, { waitUntil: 'load', timeout: 40000 }));
      if ((await page.locator('input[type="password"]').count()) > 0) {
        await page.locator('button[type="submit"]').first().click().catch(() => null);
        await page.waitForLoadState('networkidle').catch(() => null);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 }).catch(() => null);
      }
      await page.waitForTimeout(1200);
      r.finalUrl = page.url();
      r.containers = await page.evaluate(() => {
        const out = [];
        const imgs = [...document.querySelectorAll('img')].filter(i => { const b = i.getBoundingClientRect(); return b.width >= 40 && b.height >= 40; });
        const parents = new Map();
        for (const img of imgs) {
          let p = img.parentElement; let depth = 0;
          while (p && depth < 6) { const n = p.querySelectorAll('img').length; if (n >= 2) break; p = p.parentElement; depth++; }
          if (p) parents.set(p, (parents.get(p) || 0) + 1);
        }
        for (const [p] of parents) {
          const b = p.getBoundingClientRect();
          const cs = getComputedStyle(p);
          const kids = [...p.querySelectorAll('img')].slice(0, 12).map(i => { const ib = i.getBoundingClientRect(); const ics = getComputedStyle(i); return { w: Math.round(ib.width), h: Math.round(ib.height), x: Math.round(ib.left), y: Math.round(ib.top + scrollY), radius: ics.borderRadius, fit: ics.objectFit, border: ics.border.slice(0, 40), cursor: ics.cursor }; });
          out.push({ tag: p.tagName.toLowerCase(), cls: String(p.className).slice(0, 140), w: Math.round(b.width), h: Math.round(b.height), y: Math.round(b.top + scrollY), display: cs.display, gap: cs.gap, radius: cs.borderRadius, imgs: kids });
        }
        return out.sort((a, b) => a.y - b.y).slice(0, 8);
      });
      await page.screenshot({ path: join(OUT, r.shot), fullPage: false });
    } catch (e) { r.error = String(e).slice(0, 200); }
    results.push(r);
    console.log(name, width, r.error || `${r.containers.length} containers`);
    await ctx.close();
  }
}
writeFileSync(join(OUT, 'inspect-summary.json'), JSON.stringify(results, null, 2));
await browser.close();
