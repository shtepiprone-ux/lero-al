// Task 857 Revision 12 R75 — header row left end, DPR 1, 1x unscaled (1440): AdminListingsView Default and
// Mantine/Primitives/Table StickyColumn -> 148-thead-bg-r12.png. Also the §31.6 negative flow: StickyColumn at 1024,
// scrolled sideways, the sticky header cell stays opaque body colour -> 147b-sticky-scroll-1024-r12.json.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6148)
const browser = await chromium.launch()
const url = (id) => `http://127.0.0.1:6148/iframe.html?id=${id}&globals=locale:sq&viewMode=story`
const panels = []
for (const id of ['patterns-mantine-adminlistingsview--default', 'mantine-primitives-table--sticky-column']) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(url(id)); await page.waitForSelector('table.mantine-Table-table'); await page.waitForTimeout(1200)
  const r = await page.evaluate(() => { const t = [...document.querySelectorAll('table.mantine-Table-table thead')].find((e) => e.getBoundingClientRect().width > 0); const b = t.getBoundingClientRect(); const p = t.closest('.mantine-Paper-root').getBoundingClientRect(); return { x: p.left, y: b.top, h: b.height } })
  const buf = await page.screenshot({ clip: { x: Math.floor(r.x), y: Math.floor(r.y) - 4, width: 520, height: Math.ceil(r.h) + 8 } })
  panels.push({ id, b64: buf.toString('base64'), w: 520 })
  await page.close()
}
const html = `<body style="margin:8px;font:12px sans-serif;background:#fff">${panels.map((c) => `<div style="margin-bottom:10px">${c.id} (1440, 1x)<br><img src="data:image/png;base64,${c.b64}" style="display:block;width:${c.w}px"></div>`).join('')}</body>`
const p3 = await (await browser.newContext({ viewport: { width: 560, height: 260 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
await p3.screenshot({ path: `${EV}/148-thead-bg-r12.png`, fullPage: true })
// negative flow: sticky header cell opaque while scrolled, StickyColumn at 1024
const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1024, height: 800 } })).newPage()
await page.goto(url('mantine-primitives-table--sticky-column')); await page.waitForSelector('table.mantine-Table-table'); await page.waitForTimeout(1200)
const scroll = await page.evaluate(async () => {
  const vp = document.querySelector('.mantine-ScrollArea-viewport'); const before = vp.scrollLeft; vp.scrollLeft = vp.scrollWidth
  await new Promise((r) => setTimeout(r, 400))
  const th = document.querySelector('table.mantine-Table-table thead th'); const td = document.querySelector('table.mantine-Table-table tbody td')
  const cs = (e) => { const c = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 20), position: c.position, left: c.left, zIndex: c.zIndex, bg: c.backgroundColor, inline: e.getAttribute('style') } }
  const r = th.getBoundingClientRect(); const top = document.elementFromPoint(r.left + 6, r.top + r.height / 2)
  return { scrollableWidth: vp.scrollWidth - vp.clientWidth, scrollLeftBefore: before, scrollLeftAfter: vp.scrollLeft, th: cs(th), td: cs(td), elementAtThCentreIsTh: top === th || th.contains(top) }
})
fs.writeFileSync(`${EV}/147b-sticky-scroll-1024-r12.json`, JSON.stringify(scroll, null, 2))
await browser.close(); server.close(); console.log(JSON.stringify(scroll, null, 1))
