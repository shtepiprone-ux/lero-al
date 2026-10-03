// Revision 7 AC25: the nav row shows a visible focus ring on keyboard Tab (and none on mouse hover-only state).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6123)
const browser = await chromium.launch()
const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('http://127.0.0.1:6123/iframe.html?id=patterns-mantine-navrowlist--default&globals=locale:sq&viewMode=story')
await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(800)
await page.keyboard.press('Tab'); await page.waitForTimeout(250)
const r = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { isNavRow: a.hasAttribute('data-nav-row'), focusVisible: a.matches(':focus-visible'), boxShadow: cs.boxShadow, outline: cs.outlineStyle, bg: cs.backgroundColor } })
console.log(JSON.stringify(r))
fs.writeFileSync(`${EV}/117-navrow-focus-r7.json`, JSON.stringify(r, null, 2))
await browser.close(); server.close()
