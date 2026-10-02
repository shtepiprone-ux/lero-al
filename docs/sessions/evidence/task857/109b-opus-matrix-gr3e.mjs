// Opus review 7: GR-3e over every non-dialog Story in the O78-12 matrix (the dialogs are in 105-opus-review6.json).
// Lists every visible text button (Button/anchor with data-variant subtle|transparent and a label) and every pair that
// shares a row, at 390/1024/1440 x sq/uk. Also records document overflow. Usage: node.exe 109b-opus-matrix-gr3e.mjs <out-json>
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6128)
const P = 'patterns-mantine-'
const IDS = [
  ...['default', 'visible-filter', 'hidden-eligible', 'paginated'].map((s) => `${P}adminlistingsview--${s}`),
  ...['adminuserstable', 'adminexchangeprovidersview', 'adminpagesview', 'adminreportsview', 'admincurrenciesview', 'agentstatisticsview', 'admininquiriesview', 'adminpermissionsview', 'admincurrencytabs'].map((c) => `${P}${c}--default`),
  `${P}adminuserprofileview--view`, `${P}adminpageframe--shell`, 'mantine-primitives-table--cards-below-lg', 'mantine-primitives-radio--default',
]
const browser = await chromium.launch()
const out = { platform: `${process.platform} ${process.version}`, cells: [] }
for (const id of IDS) for (const loc of ['sq', 'uk']) for (const w of [390, 1024, 1440]) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:6128/iframe.html?id=${id}&globals=locale:${loc}&viewMode=story`)
  await page.waitForFunction(() => [...document.querySelectorAll('#storybook-root *')].some((el) => el.tagName !== 'STYLE' && el.getBoundingClientRect().height > 0), null, { timeout: 30000 }); await page.waitForTimeout(900)
  const r = await page.evaluate(() => {
    const vis = (el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }
    const text = [...document.querySelectorAll('button, a')].filter((el) => ['subtle', 'transparent'].includes(el.getAttribute('data-variant')) && vis(el) && el.textContent.trim())
      .map((el) => { const b = el.getBoundingClientRect(); return { label: el.textContent.trim().slice(0, 40), top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left) } })
    const shared = []
    for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) if (text[j].top < text[i].bottom && text[i].top < text[j].bottom) shared.push([text[i].label, text[j].label])
    return { textButtons: text, shared, overflowX: document.documentElement.scrollWidth > window.innerWidth }
  })
  out.cells.push({ id, loc, w, ...r })
  await ctx.close()
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2)); await browser.close(); server.close(); console.log('ok', out.cells.length)
