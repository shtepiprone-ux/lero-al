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
await new Promise((r) => server.listen(6033, '127.0.0.1', r));
const IDS = ["mantine-primitives-favoritesshell--populated","mantine-primitives-listingcard--favorites-composition","mantine-primitives-recentlyviewedgridview--populated","mantine-primitives-similarlistingsview--default","mantine-primitives-similarlistingsview--fewer-than-eight","patterns-mantine-homepagelistinggrids--default","patterns-mantine-homepagelistinggrids--loading","patterns-mantine-listingcardtrack--grid","patterns-mantine-listingcardtrack--rail","patterns-mantine-listingcardtrack--grid-single-item","patterns-mantine-listingcardtrack--rail-single-item","patterns-mantine-listingcardtrack--rail-no-overflow","patterns-mantine-listingcardtrack--rail-mixed-title-lengths","patterns-mantine-listingcardtrack--grid-mixed-title-lengths","patterns-mantine-listingcardtrack--empty","patterns-mantine-listingsshellview--default"];
const WIDTHS = [320, 479, 480, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1439, 1440, 1535, 1536, 1920, 2560];
const browser = await chromium.launch(); const page = await browser.newPage();
const out = {};
for (const id of IDS) {
  out[id] = [];
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`http://127.0.0.1:6033/iframe.html?id=${id}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    out[id].push(await page.evaluate((w) => {
      const els = document.querySelectorAll('[class*="_rail_fqrnb_"],[class*="_grid_fqrnb_"]'); const tracks=[]; for (const el of els) { const isGrid=String(el.className).includes("_grid_fqrnb_"); if (isGrid) { const gtc=getComputedStyle(el).gridTemplateColumns.trim(); tracks.push({mode:"grid", width:el.getBoundingClientRect().width, v: gtc==="none"?0:gtc.split(/\s+/).length}); } else { el.scrollLeft=0; const r=el.getBoundingClientRect(); const v=Array.from(el.children).filter(c=>{const cr=c.getBoundingClientRect(); return cr.left>=r.left-0.5 && cr.right<=r.left+el.clientWidth+0.5;}).length; tracks.push({mode:"rail", width:r.width, v}); } } return { w, tracks };
    }, w));
  }
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
let total=0; for (const id of IDS) { const cells=out[id]; const n=Math.max(...cells.map(c=>c.tracks.length)); const drops=[]; for (let t=0;t<n;t++){ let p=null; for (const c of cells){ const tr=c.tracks[t]; if(!tr){drops.push({t,w:c.w,missing:true}); continue;} if(p && tr.v<p.v) drops.push({t,from:p.w,to:c.w,before:p.v,after:tr.v}); p={w:c.w,v:tr.v}; } } total+=drops.length; console.log(id, "tracks", n, cells.map(c=>c.w+":"+c.tracks.map(x=>x.mode[0]+x.v).join("/")).join(" "), "drops", JSON.stringify(drops)); } console.log("TOTAL DROPS", total);
await browser.close(); server.close();
