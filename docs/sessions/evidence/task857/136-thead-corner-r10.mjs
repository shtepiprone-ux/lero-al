// Task 857 R66 follow-up: is the thead top line at the Paper's rounded corner really drawn / cut? DPR 1, 10x crops.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6136)
const browser = await chromium.launch()
const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('http://127.0.0.1:6136/iframe.html?id=mantine-primitives-table--default&globals=locale:sq&viewMode=story')
await page.waitForSelector('table.mantine-Table-table'); await page.waitForTimeout(1000)
const info = await page.evaluate(() => {
  const th = document.querySelector('table.mantine-Table-table thead'); const t = th.closest('table'); const paper = t.closest('.mantine-Paper-root')
  const g = (e) => { const c = getComputedStyle(e); return { radius: c.borderRadius, border: [c.borderTopWidth, c.borderTopStyle, c.borderTopColor].join(' '), bg: c.backgroundColor, collapse: c.borderCollapse, overflow: c.overflow } }
  const firstTh = th.querySelector('th'); const r = paper.getBoundingClientRect(); const tr = th.getBoundingClientRect()
  return { paper: g(paper), table: g(t), thead: g(th), firstTh: g(firstTh), paperRect: [r.left, r.top, r.right, r.bottom], theadRect: [tr.left, tr.top, tr.right, tr.bottom] }
})
const r = info.paperRect, s = 24
const crops = []
for (const [x, y, n] of [[r[0] - 2, r[1] - 2, 'tl'], [r[2] - s + 2, r[1] - 2, 'tr']]) crops.push({ n, b64: (await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: s, height: s } })).toString('base64') })
const html = `<body style="margin:8px;font:12px sans-serif;background:#fff;display:flex;gap:10px">${crops.map(c => `<div>${c.n}<br><img src="data:image/png;base64,${c.b64}" style="image-rendering:pixelated;width:240px"></div>`).join('')}</body>`
const p3 = await (await browser.newContext({ viewport: { width: 560, height: 300 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
await p3.screenshot({ path: `${EV}/136-thead-corner-r10.png`, fullPage: true })
fs.writeFileSync(`${EV}/136-thead-corner-r10.json`, JSON.stringify(info, null, 2))
await browser.close(); server.close(); console.log(JSON.stringify(info, null, 1))
