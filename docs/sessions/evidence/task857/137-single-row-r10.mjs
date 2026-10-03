// Task 857 R65 negative flow: a one-row nav list. The Story's DOM is mutated in the browser only (rows 2 and 3 removed); no file changes.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6138)
const browser = await chromium.launch()
const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('http://127.0.0.1:6138/iframe.html?id=patterns-mantine-navrowlist--default&globals=locale:sq&viewMode=story')
await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(1200)
await page.evaluate(() => { const rows = [...document.querySelectorAll('[data-nav-row]')]; rows.slice(1).forEach((r) => r.remove()); document.querySelectorAll('hr, [class*=Divider]').forEach((d) => d.remove()) })
const res = await page.evaluate(() => { const rows = [...document.querySelectorAll('[data-nav-row]')]; const c = getComputedStyle(rows[0]); const l = getComputedStyle(rows[0].closest('.mantine-Paper-root')); return { rows: rows.length, row: { tl: c.borderTopLeftRadius, tr: c.borderTopRightRadius, bl: c.borderBottomLeftRadius, br: c.borderBottomRightRadius }, list: l.borderRadius } })
await page.keyboard.press('Tab'); await page.waitForTimeout(250)
const b = await (await page.$('[data-nav-row]')).boundingBox()
const s = 14, tiles = []
for (const [x, y, k] of [[b.x - 2, b.y - 2, 'tl'], [b.x + b.width - s + 2, b.y - 2, 'tr'], [b.x - 2, b.y + b.height - s + 2, 'bl'], [b.x + b.width - s + 2, b.y + b.height - s + 2, 'br']]) tiles.push({ k, b64: (await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: s, height: s } })).toString('base64') })
const html = `<body style="margin:8px;font:11px sans-serif;background:#fff;display:grid;grid-template-columns:repeat(4,150px);gap:8px">${tiles.map((t) => `<div>one row ${t.k}<br><img src="data:image/png;base64,${t.b64}" style="image-rendering:pixelated;width:140px;border:1px solid #ccc"></div>`).join('')}</body>`
const sheet = await (await browser.newContext({ viewport: { width: 680, height: 220 } })).newPage(); await sheet.setContent(html); await sheet.waitForTimeout(300)
await sheet.screenshot({ path: `${EV}/137-single-row-r10.png`, fullPage: true })
fs.writeFileSync(`${EV}/137-single-row-r10.json`, JSON.stringify(res, null, 2))
await browser.close(); server.close(); console.log(JSON.stringify(res))
