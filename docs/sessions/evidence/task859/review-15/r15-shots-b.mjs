// Task 859 review 15 (Opus) - DPR-1 screenshots of the remaining rhythm/name defects (read-only).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6637)
const b = await chromium.launch()
for (const [id, w, loc] of [['patterns-mantine-adminuserstable--default', 390, 'en'], ['patterns-mantine-adminsupportview--default', 390, 'en']]) {
  const p = await b.newPage({ viewport: { width: w, height: 1200 }, deviceScaleFactor: 1 })
  await p.goto(`http://127.0.0.1:6637/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' }); await p.waitForTimeout(1500)
  await p.screenshot({ path: `r15b-${id.replace(/^patterns-mantine-/, '')}-${loc}-${w}.png`, fullPage: true }); await p.close()
}
await b.close(); server.close()
