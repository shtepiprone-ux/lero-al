// Task 859 review 5: screenshots for the GR-9 parity question (header/footer dividers of the sheet at 390 vs the
// dialog at 1440), sq. Also reports, per width, every element with a visible top or bottom border line inside the dialog.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task859/review-5'
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' })[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6152)
const browser = await chromium.launch()
const out = []
for (const id of ['patterns-mantine-adminuserprofiledialogsview--unsaved', 'patterns-mantine-currencyformdialogview--new', 'mantine-primitives-collectionssection--create-dialog-open']) {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`http://127.0.0.1:6152/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
    await page.waitForTimeout(2500)
    const lines = await page.evaluate(() => {
      const d = [...document.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content')].find(x => x.getBoundingClientRect().width > 0)
      if (!d) return null
      const top = d.getBoundingClientRect().top
      return [...d.querySelectorAll('*')].map(el => {
        const s = getComputedStyle(el); const b = el.getBoundingClientRect()
        const t = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' && s.borderTopColor !== 'rgba(0, 0, 0, 0)'
        const bt = parseFloat(s.borderBottomWidth) > 0 && s.borderBottomStyle !== 'none' && s.borderBottomColor !== 'rgba(0, 0, 0, 0)'
        return (t || bt) && b.width > d.getBoundingClientRect().width * 0.8 ? { cls: (el.className || '').toString().split(' ').find(c => c.startsWith('mantine-')) || el.tagName, y: Math.round(b.top - top), edge: t ? 'top' : 'bottom' } : null
      }).filter(Boolean)
    })
    const name = `r5-parity-${id.split('--')[0].replace(/^(patterns-mantine-|mantine-primitives-)/, '')}-${width}.png`
    await page.screenshot({ path: `${DIR}/${name}` })
    out.push({ id, width, fullWidthLines: lines, screenshot: name })
    console.log(id, width, JSON.stringify(lines))
    await ctx.close()
  }
}
fs.writeFileSync(`${DIR}/r5-parity.json`, JSON.stringify({ platform: process.platform, node: process.version, out }, null, 1))
await browser.close()
server.close()
