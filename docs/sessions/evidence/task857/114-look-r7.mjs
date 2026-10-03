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
}).listen(6120)
const browser = await chromium.launch()
const ids = process.argv.slice(2)
for (const id of ids) for (const [vw, vh] of [[1440, 900], [390, 800]]) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: vw, height: vh } })).newPage()
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
  await page.goto(`http://127.0.0.1:6120/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('[role=dialog]', { timeout: 20000 }); await page.waitForTimeout(1500)
  await page.screenshot({ path: `${EV}/114-${id}-${vw}.png` })
  const m = await page.evaluate(() => { const d = document.querySelector('[role=dialog]'); const r = d.getBoundingClientRect(); return { dialog: [Math.round(r.width), Math.round(r.height)], overflowX: document.documentElement.scrollWidth > innerWidth } })
  console.log(id, vw, JSON.stringify(m), errs.slice(0, 3).join(' | '))
  await page.context().close()
}
await browser.close(); server.close()
