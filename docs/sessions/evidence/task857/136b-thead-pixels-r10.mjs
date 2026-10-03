import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6137)
const browser = await chromium.launch()
const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('http://127.0.0.1:6137/iframe.html?id=mantine-primitives-table--default&globals=locale:sq&viewMode=story')
await page.waitForSelector('table.mantine-Table-table'); await page.waitForTimeout(1000)
const png = (await page.screenshot({ clip: { x: 49, y: 49, width: 40, height: 20 } })).toString('base64')
const p2 = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage()
const rows = await p2.evaluate(async (b64) => {
  const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const out = []
  for (let y = 0; y < 6; y++) { const r = []; for (let x = 0; x < 40; x += 1) { const d = g.getImageData(x, y, 1, 1).data; r.push(d[0]) } out.push(r) }
  // contrast-amplified copy (x16): map 235..255 -> 0..255
  const c2 = document.createElement('canvas'); c2.width = 40; c2.height = 20; const g2 = c2.getContext('2d'); const id = g.getImageData(0, 0, 40, 20)
  for (let i = 0; i < id.data.length; i += 4) for (let k = 0; k < 3; k++) id.data[i + k] = Math.max(0, Math.min(255, (id.data[i + k] - 235) * 12.75))
  g2.putImageData(id, 0, 0)
  return { rows: out, amp: c2.toDataURL() }
}, png)
fs.writeFileSync(`${EV}/136b-thead-pixels-r10.json`, JSON.stringify({ redChannelRows49to54_x49to88: rows.rows }, null, 1))
const html = `<body style="margin:8px;background:#888"><img src="${rows.amp}" style="image-rendering:pixelated;width:640px"></body>`
const p3 = await (await browser.newContext({ viewport: { width: 700, height: 360 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
await p3.screenshot({ path: `${EV}/136b-thead-corner-amplified-r10.png`, fullPage: true })
await browser.close(); server.close()
console.log(rows.rows.map(r => r.join(' ')).join('\n'))
