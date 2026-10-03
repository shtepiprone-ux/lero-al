// Revision 7 AC24: DOM hashes of the UNSTRUCTURED consumers (Modal Default open, ReportDetailDialogView Default) at 1440/390 sq.
// Usage: node 113-hash-unstructured-r7.mjs <before|after>. Writes/merges 113-unstructured-hash-r7.json.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const phase = process.argv[2]
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857/113-unstructured-hash-r7.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6119)
const browser = await chromium.launch()
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
out[phase] = {}
// Normalise generated ids (React useId) so the hash compares structure, classes, attributes and text.
const norm = (html) => html.replace(/(id|for|aria-labelledby|aria-describedby|aria-controls)="[^"]*"/g, '$1="#"').replace(/mantine-[a-z0-9]{6,}/g, 'mantine-#')
for (const vw of [1440, 390]) {
  for (const id of ['mantine-primitives-modal--default', 'patterns-mantine-reportdetaildialogview--pending']) {
    const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: vw, height: 1000 } })).newPage()
    await page.goto(`http://127.0.0.1:6119/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
    await page.waitForSelector('button, [role=dialog]', { state: 'attached', timeout: 20000 }); await page.waitForTimeout(1200)
    if (id.includes('modal--default')) {
      await page.getByRole('button').first().click(); await page.waitForTimeout(900)
    }
    const html = await page.evaluate(() => document.body.innerHTML)
    out[phase][`${id}@${vw}`] = { sha256: crypto.createHash('sha256').update(norm(html)).digest('hex'), length: norm(html).length }
    await page.context().close()
  }
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
await browser.close(); server.close()
console.log(JSON.stringify(out[phase], null, 2))
