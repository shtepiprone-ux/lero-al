// Task 859 review 5: AC29 on the rebuilt storybook-static. Opens each Modal primitive Story through its own trigger
// (the Story renders a button that opens the dialog), then measures the content corners and the close button.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task859/review-5/r5-probe-modal.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6142)
const browser = await chromium.launch()
const rows = []
for (const id of ['mantine-primitives-modal--detail', 'mantine-primitives-modal--form', 'mantine-primitives-modal--delete-confirm', 'mantine-primitives-modal--default', 'mantine-primitives-modal--structured']) {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`http://127.0.0.1:6142/iframe.html?id=${id}&globals=locale:en&viewMode=story`)
    await page.waitForTimeout(3000)
    const before = await page.locator('#storybook-root button').evaluateAll(bs => bs.map(b => b.innerText.trim()))
    const visible = async () => page.evaluate(() => [...document.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content')].some(c => c.getBoundingClientRect().width > 0))
    if (!(await visible())) {
      const t = page.locator('#storybook-root button').first()
      if (await t.count()) { await t.click().catch(() => null); await page.waitForTimeout(1500) }
    }
    const r = await page.evaluate(() => {
      const c = [...document.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content')].find(x => x.getBoundingClientRect().width > 0)
      if (!c) return null
      const s = getComputedStyle(c)
      const close = c.querySelector('button[aria-label]')
      const cr = close ? close.getBoundingClientRect() : null
      return { kind: c.className.includes('Drawer') ? 'sheet' : 'modal', tl: s.borderTopLeftRadius, tr: s.borderTopRightRadius, bl: s.borderBottomLeftRadius, close: cr ? `${Math.round(cr.width)}x${Math.round(cr.height)}` : null, closeLabel: close?.getAttribute('aria-label') ?? null }
    })
    rows.push({ id, width, triggers: before, r })
    console.log(id, width, 'triggers', JSON.stringify(before), JSON.stringify(r))
    await ctx.close()
  }
}
fs.writeFileSync(OUT, JSON.stringify({ platform: process.platform, node: process.version, rows }, null, 1))
await browser.close()
server.close()
