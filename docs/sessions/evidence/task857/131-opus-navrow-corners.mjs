// Opus, owner return on O78-12 tuple 1 (2026-10-03): the nav row focus line is cut at the list's rounded corners.
// Measures the list radius/border, whether `--paper-radius` reaches the rows, and crops each corner of the first and
// last row at DPR 1 under keyboard focus (10x pixelated).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6132)
const browser = await chromium.launch()
const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('http://127.0.0.1:6132/iframe.html?id=patterns-mantine-navrowlist--default&globals=locale:sq&viewMode=story')
await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(800)
const info = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('[data-nav-row]')]
  const list = rows[0].closest('.mantine-Paper-root')
  const lc = getComputedStyle(list)
  return {
    rows: rows.length,
    list: { borderRadius: lc.borderRadius, borderWidth: lc.borderTopWidth, overflow: lc.overflow, paperRadiusVar: lc.getPropertyValue('--paper-radius') },
    rowPaperRadiusVar: getComputedStyle(rows[0]).getPropertyValue('--paper-radius'),
    rowBorderRadius: getComputedStyle(rows[0]).borderRadius,
    firstIsFirstChild: rows[0] === rows[0].parentElement.firstElementChild,
    lastIsLastChild: rows.at(-1) === rows.at(-1).parentElement.lastElementChild,
  }
})
const crops = []
const crop = async (rowIdx, label) => {
  const b = await (await page.$$('[data-nav-row]'))[rowIdx].boundingBox()
  const s = 14
  for (const [cx, cy, n] of [[b.x - 2, b.y - 2, 'tl'], [b.x + b.width - s + 2, b.y - 2, 'tr'], [b.x - 2, b.y + b.height - s + 2, 'bl'], [b.x + b.width - s + 2, b.y + b.height - s + 2, 'br']]) {
    crops.push({ label: `${label} ${n}`, b64: (await page.screenshot({ clip: { x: Math.round(cx), y: Math.round(cy), width: s, height: s } })).toString('base64') })
  }
}
await page.keyboard.press('Tab'); await page.waitForTimeout(300); await crop(0, 'row 1 focus')
await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(300); await crop(info.rows - 1, `row ${info.rows} focus`)
const html = `<body style="margin:8px;font:12px sans-serif;background:#fff;display:grid;grid-template-columns:repeat(4,150px);gap:10px">${crops.map(c => `<div>${c.label}<br><img src="data:image/png;base64,${c.b64}" style="image-rendering:pixelated;width:140px"></div>`).join('')}</body>`
const p3 = await (await browser.newContext({ viewport: { width: 680, height: 420 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
await p3.screenshot({ path: `${EV}/131-opus-navrow-corners-10x.png`, fullPage: true })
fs.writeFileSync(`${EV}/131-opus-navrow-corners.json`, JSON.stringify({ platform: `${process.platform} ${process.version}`, ...info }, null, 2))
await browser.close(); server.close()
console.log(JSON.stringify(info, null, 1))
