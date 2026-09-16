// Task 815 task-design measurement: locate and attribute the >=1441px rail drop.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createRequire } from 'node:module';
const ROOT = process.cwd();
const { chromium } = createRequire(join(ROOT, 'package.json'))('playwright');
const STATIC = join(ROOT, 'storybook-static');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => { let p = req.url.split('?')[0]; if (p === '/') p = '/index.html'; try { const d = await readFile(join(STATIC, decodeURIComponent(p))); res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(d); } catch { res.writeHead(404); res.end(); } });
await new Promise((r) => server.listen(6032, '127.0.0.1', r));
const IDS = ['system-featuredlistings--default', 'patterns-mantine-homepagelistinggrids--default', 'mantine-primitives-similarlistingsview--default', 'patterns-mantine-listingcardtrack--rail'];
const WIDTHS = [1441, 1500, 1535, 1536, 1537, 1600, 1700, 1800, 1920, 2560];
const browser = await chromium.launch(); const page = await browser.newPage();
const out = {};
for (const id of IDS) {
  out[id] = [];
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`http://127.0.0.1:6032/iframe.html?id=${id}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    out[id].push(await page.evaluate((w) => {
      const rail = document.querySelector('[class*="_rail_"]');
      if (!rail) return { w, rail: null };
      const r = rail.getBoundingClientRect();
      const kids = Array.from(rail.children).map((c) => { const cr = c.getBoundingClientRect(); return { l: +(cr.left - r.left).toFixed(1), w: +cr.width.toFixed(1), basis: getComputedStyle(c).flexBasis, minW: getComputedStyle(c).minWidth }; });
      const chain = []; let el = rail.parentElement;
      while (el && el !== document.body) { const cs = getComputedStyle(el); if (parseFloat(cs.paddingLeft) || parseFloat(cs.paddingRight) || cs.maxWidth !== 'none') chain.push({ cls: (el.className || '').toString().slice(0, 60), w: el.getBoundingClientRect().width, pl: cs.paddingLeft, pr: cs.paddingRight, maxW: cs.maxWidth }); el = el.parentElement; }
      const full = kids.filter((k) => k.l >= -0.5 && k.l + k.w <= rail.clientWidth + 0.5).length;
      return { w, railW: r.width, clientW: rail.clientWidth, scrollLeft: rail.scrollLeft, full, kids: kids.slice(0, 6), chain };
    }, w));
  }
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
for (const id of IDS) console.log(id, out[id].map((c) => `${c.w}:rail${c.railW} full${c.full} k0w${c.kids?.[0]?.w} basis${c.kids?.[0]?.basis}`).join(' | '));
await browser.close(); server.close();
