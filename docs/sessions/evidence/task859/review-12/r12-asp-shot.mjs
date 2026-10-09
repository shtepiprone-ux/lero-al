// Task 859 review 12 (Opus) - AdminSurfacePattern Default inside MantineStoryShell: full-page shots at 390 and 1440 (en).
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'; const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6322)
const browser = await chromium.launch()
for (const w of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:6322/iframe.html?id=patterns-mantine-adminsurfacepattern--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root input', { timeout: 40000 }); await page.waitForTimeout(1000)
  const ov = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  await page.screenshot({ path: path.join(DIR, `r12-asp-default-${w}.png`), fullPage: true }); console.log(w, 'overflowX', ov)
  await page.close()
}
await browser.close(); server.close()
