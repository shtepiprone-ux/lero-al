// Task 868 GR-3d: the four edge gaps of every AdminPagesView Story, from the wrapper's own padding and the content rect.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire(import.meta.url); const { chromium } = require('playwright')
const ROOT = path.resolve('storybook-static')
const server = http.createServer((req, res) => { const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') || f.endsWith('.mjs') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res) })
await new Promise((r) => server.listen(0, '127.0.0.1', r)); const BASE = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
for (const s of ['default', 'empty', 'migration-pending', 'deleting', 'delete-confirm']) {
  const row = []
  for (const w of [320, 390, 1024, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } }); const page = await ctx.newPage()
    await page.goto(`${BASE}/iframe.html?id=patterns-mantine-adminpagesview--${s}&viewMode=story`, { waitUntil: 'load' })
    await page.waitForSelector('[data-testid="admin-pages-manager"]', { timeout: 20000 }); await page.waitForTimeout(800)
    const g = await page.evaluate(() => { const root = document.querySelector('[data-testid="admin-pages-manager"]'); const cs = getComputedStyle(root.parentElement); const r = root.getBoundingClientRect(); const vw = document.documentElement.clientWidth; return { top: Math.round(r.top + scrollY), right: Math.round(vw - r.right), bottom: parseFloat(cs.paddingBottom), left: Math.round(r.left), wrapperPad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join('/') } })
    row.push(`${w}: T${g.top} R${g.right} B${g.bottom} L${g.left} (wrapper ${g.wrapperPad})`); await ctx.close()
  }
  console.log(`GR-3d ${s}: ` + row.join(' · '))
}
await browser.close(); server.close()
