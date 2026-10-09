// Task 859 review 14 (Opus) - DPR-1 screenshots of the remaining rhythm/name defects (read-only).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6616)
const b = await chromium.launch()
for (const [id, w, loc] of [['patterns-mantine-admintable--wrapped-title-column', 390, 'uk'], ['patterns-mantine-admininquiriesview--default', 390, 'uk'], ['patterns-mantine-admininquiriesview--default', 1440, 'uk'], ['patterns-mantine-agentstatisticsview--default', 1440, 'uk'], ['patterns-mantine-adminexchangeprovidersview--default', 1024, 'uk'], ['patterns-mantine-admindashboardrecentlistings--default', 1440, 'uk']]) {
  const p = await b.newPage({ viewport: { width: w, height: 1200 }, deviceScaleFactor: 1 })
  await p.goto(`http://127.0.0.1:6616/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' }); await p.waitForTimeout(1500)
  await p.screenshot({ path: `r14-${id.replace(/^patterns-mantine-/, '')}-${loc}-${w}.png`, fullPage: true }); await p.close()
}
await b.close(); server.close()
