// Task 857 review 14 (Opus) — owner question on §31.7 tuple 2: "where does the table border go from 767px?". Measures the
// table card Paper's border and the canvas around it in Primitives/Table Default and StickyColumn at 640/767/768/1024/1440,
// sq, DPR 1, on the final storybook-static. Writes 152-opus-table-border.{json,png}.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6152)
const browser = await chromium.launch()
const out = { platform: `${process.platform} ${process.version}` }
const shots = []
for (const id of ['mantine-primitives-table--default', 'mantine-primitives-table--sticky-column']) {
  for (const w of [640, 767, 768, 1024, 1440]) {
    const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: 700 } })).newPage()
    await page.goto(`http://127.0.0.1:6152/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
    await page.waitForTimeout(1200)
    const m = await page.evaluate(() => {
      const t = [...document.querySelectorAll('table.mantine-Table-table')].find((e) => e.getBoundingClientRect().width > 0)
      if (!t) return { table: false, cards: document.querySelectorAll('.mantine-Card-root').length }
      const paper = t.closest('.mantine-Paper-root'); const c = getComputedStyle(paper); const r = paper.getBoundingClientRect()
      const parent = paper.parentElement; const pc = getComputedStyle(parent)
      const chain = []; let e = paper.parentElement
      for (let i = 0; i < 6 && e; i++, e = e.parentElement) { const s = getComputedStyle(e); chain.push({ tag: e.tagName.toLowerCase(), cls: (e.className || '').toString().slice(0, 50), bg: s.backgroundColor, border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor, pad: s.padding, overflow: s.overflow, w: Math.round(e.getBoundingClientRect().width) }) }
      return { table: true, paper: { border: `${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor}`, borderLeft: `${c.borderLeftWidth} ${c.borderLeftStyle} ${c.borderLeftColor}`, radius: c.borderRadius, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], defaultBorderVar: c.getPropertyValue('--mantine-color-default-border').trim() }, chain }
    })
    out[`${id}@${w}`] = m
    if (m.table) shots.push({ n: `${id.replace('mantine-primitives-table--', '')} ${w}`, b64: (await page.screenshot({ clip: { x: 0, y: 0, width: Math.min(w, 520), height: 160 } })).toString('base64') })
    await page.close()
  }
}
const html = `<body style="margin:8px;font:12px sans-serif;background:#888;display:flex;flex-wrap:wrap;gap:8px">${shots.map((c) => `<div style="color:#fff">${c.n}<br><img src="data:image/png;base64,${c.b64}"></div>`).join('')}</body>`
const p3 = await (await browser.newContext({ viewport: { width: 1100, height: 600 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
await p3.screenshot({ path: `${EV}/152-opus-table-border.png`, fullPage: true })
fs.writeFileSync(`${EV}/152-opus-table-border.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close(); console.log(JSON.stringify(out))
