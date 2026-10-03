// Opus review 10: AC37 counter-check at 390 (the status select opens its own bottom sheet below 640).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6131)
const browser = await chromium.launch()
const out = []
for (const [loc, sold] of [['sq', 'Shitur'], ['uk', 'Продано']]) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 390, height: 844 } })).newPage()
  await page.goto(`http://127.0.0.1:6131/iframe.html?id=patterns-mantine-listingpreviewdialogview--active&globals=locale:${loc}&viewMode=story`)
  await page.waitForSelector('[role=dialog]'); await page.waitForTimeout(1200)
  const sel = page.locator('[role=dialog]').first().getByRole('textbox').first()
  const before = await sel.inputValue()
  await sel.click(); await page.waitForTimeout(800)
  const sheet = page.locator('.mantine-Drawer-content').last()
  const items = await sheet.locator('button, [role=option], [data-combobox-option]').allTextContents()
  await sheet.getByText(sold, { exact: true }).first().click()
  await page.waitForTimeout(1500)
  const after = await sel.inputValue()
  const toast = await page.locator('.mantine-Notification-root, [data-sonner-toast]').allTextContents()
  const drawers = await page.locator('.mantine-Drawer-content').count()
  await page.screenshot({ path: `${EV}/130b-opus-status-${loc}-390.png` })
  out.push({ loc, before, items, after, toast, openDrawers: drawers })
}
fs.writeFileSync(`${EV}/130b-opus-status-390.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close()
console.log(JSON.stringify(out, null, 1))
