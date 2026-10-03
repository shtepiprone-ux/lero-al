// Task 857 Revision 12 R75 (145 unchanged except port and output name) — why the first header cell of AdminListingsView has a different background.
// Records thead / th / tr computed backgrounds and the matching CSS rules, sq, 1440. Writes 147-thead-bg-r12.json.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6147)
const browser = await chromium.launch()
const out = { platform: `${process.platform} ${process.version}` }
for (const id of ['patterns-mantine-adminlistingsview--default', 'patterns-mantine-admintable--default', 'mantine-primitives-table--default', 'mantine-primitives-table--sticky-column']) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  const resp = await page.goto(`http://127.0.0.1:6147/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  const ok = await page.waitForSelector('table.mantine-Table-table', { timeout: 8000 }).then(() => true).catch(() => false)
  if (!ok) { out[id] = 'no table'; await page.close(); continue }
  await page.waitForTimeout(1000)
  out[id] = await page.evaluate(() => {
    const th0 = [...document.querySelectorAll('table.mantine-Table-table thead')].find((e) => e.getBoundingClientRect().width > 0)
    const rulesFor = (el) => {
      const hits = []
      for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules } catch { continue }
        const walk = (list) => { for (const r of list) { if (r.cssRules && !r.selectorText) walk(r.cssRules); else if (r.selectorText && r.style && (r.style.backgroundColor || r.style.background || r.style.getPropertyValue('--table-sticky-header-bg') ) && el.matches(r.selectorText)) hits.push(r.selectorText + ' { ' + (r.style.backgroundColor || r.style.background) + ' }') } }
        walk(rs) }
      return hits
    }
    const ths = [...th0.querySelectorAll('th')].map((th) => ({ text: th.textContent.trim().slice(0, 20), bg: getComputedStyle(th).backgroundColor, inline: th.getAttribute('style'), rules: rulesFor(th) }))
    const tr = th0.querySelector('tr')
    return { theadBg: getComputedStyle(th0).backgroundColor, theadInline: th0.getAttribute('style'), theadRules: rulesFor(th0), trBg: getComputedStyle(tr).backgroundColor, ths }
  })
  await page.close()
}
fs.writeFileSync(`${EV}/147-thead-bg-r12.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close(); console.log(JSON.stringify(out, null, 1))
