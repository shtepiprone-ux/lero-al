// Task 741 Revision 3e design — screenshots of the two card Stories (grid + list sections) for the owner's O46-2 return.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
for (const id of ['mantine-primitives-listingcard--default', 'patterns-mantine-listingcardpattern--default']) {
  for (const w of [1440, 768]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
    await page.waitForSelector('#storybook-root .mantine-Badge-root', { timeout: 30000, state: 'attached' })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: new URL(`./${id.split('-')[1]}-${w}.png`, import.meta.url).pathname.slice(1), fullPage: true })
    await page.close()
  }
}
await browser.close(); server.close()
console.log('ok')
