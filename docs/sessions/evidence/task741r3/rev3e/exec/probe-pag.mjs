import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const browser = await chromium.launch()
for (const loc of ['en', 'uk']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=patterns-mantine-listingsshellview--default&viewMode=story&globals=locale:${loc}`)
  await page.waitForSelector('.listings-shell'); await page.waitForTimeout(1500)
  console.log(loc, await page.evaluate(() => ({ pag: [...document.querySelectorAll('.mantine-Pagination-root button')].map(b => (b.textContent.trim() || b.getAttribute('aria-label')) + (b.hasAttribute('data-active') ? '*' : '')), more: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => t.length > 3 && t.length < 25) })))
}
await browser.close(); server.close()
