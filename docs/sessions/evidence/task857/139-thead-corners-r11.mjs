// Task 857 Revision 11, R71 — the table card's tl and tr corners in AdminTable Default, AdminListingsView Default and
// Mantine/Primitives/Table Default at 1440, DPR 1, scaled 10x pixelated. Also records the thead/Paper computed styles.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6139)
const STORIES = ['patterns-mantine-admintable--default', 'patterns-mantine-adminlistingsview--default', 'mantine-primitives-table--default']
const browser = await chromium.launch()
const out = {}
const panels = []
for (const story of STORIES) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(`http://127.0.0.1:6139/iframe.html?id=${story}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('table.mantine-Table-table'); await page.waitForTimeout(1200)
  const info = await page.evaluate(() => {
    const th = document.querySelector('table.mantine-Table-table thead'); const t = th.closest('table'); const paper = t.closest('.mantine-Paper-root')
    const g = (e) => { const c = getComputedStyle(e); return { radius: c.borderRadius, borderTop: [c.borderTopWidth, c.borderTopStyle, c.borderTopColor].join(' '), borderBottom: [c.borderBottomWidth, c.borderBottomStyle, c.borderBottomColor].join(' '), bg: c.backgroundColor, collapse: c.borderCollapse, overflow: c.overflow } }
    const r = paper.getBoundingClientRect(); const tr = th.getBoundingClientRect()
    return { paper: g(paper), thead: g(th), paperRect: [r.left, r.top, r.right, r.bottom], theadRect: [tr.left, tr.top, tr.right, tr.bottom], theadFlushWithCardTop: Math.abs(tr.top - r.top - 1) <= 1 }
  })
  out[story] = info
  const r = info.paperRect, s = 24
  for (const [x, y, n] of [[r[0] - 2, r[1] - 2, 'tl'], [r[2] - s + 2, r[1] - 2, 'tr']]) {
    panels.push({ n: `${story} ${n}`, b64: (await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: s, height: s } })).toString('base64') })
  }
  await page.close()
}
const html = `<body style="margin:8px;font:12px sans-serif;background:#fff;display:flex;flex-wrap:wrap;gap:10px">${panels.map((c) => `<div>${c.n}<br><img src="data:image/png;base64,${c.b64}" style="image-rendering:pixelated;width:240px"></div>`).join('')}</body>`
const p3 = await (await browser.newContext({ viewport: { width: 1100, height: 600 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
await p3.screenshot({ path: `${EV}/139-thead-corners-r11.png`, fullPage: true })
fs.writeFileSync(`${EV}/139-thead-corners-r11.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close(); console.log(JSON.stringify(out, null, 1))
