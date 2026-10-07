// Task 859 review 5: HEAD build (worktree 58719f5d8): does patterns-mantine-admindashboardrecentlistings--modal-open open its dialog (play function)?
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al-859-head/storybook-static'
const DIR = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task859/review-5'
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' })[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6154)
const browser = await chromium.launch()
const out = []
for (const locale of ['en', 'sq']) {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    const logs = []
    page.on('console', m => { if (m.type() === 'error') logs.push(m.text().slice(0, 200)) })
    await page.goto(`http://127.0.0.1:6154/iframe.html?id=patterns-mantine-admindashboardrecentlistings--modal-open&globals=locale:${locale}&viewMode=story`)
    await page.waitForTimeout(6000)
    const open = await page.evaluate(() => [...document.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content, [role="dialog"]')].some(x => x.getBoundingClientRect().width > 0))
    await page.screenshot({ path: `${DIR}/r5-modalopen-HEAD-${locale}-${width}.png` })
    out.push({ locale, width, open, errors: logs })
    console.log(locale, width, 'dialog open', open, logs.slice(0, 2).join(' | '))
    await ctx.close()
  }
}
fs.writeFileSync(`${DIR}/r5-modalopen-HEAD.json`, JSON.stringify({ platform: process.platform, node: process.version, out }, null, 1))
await browser.close()
server.close()
