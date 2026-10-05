import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'
const dir = process.argv[2]
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch(); const out = {}
for (const w of [320, 390, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=mantine-primitives-listingcard--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.mantine-Title-root', { timeout: 30000 }); await page.waitForTimeout(1500)
  out[w] = await page.evaluate(() => ({
    titles: [...document.querySelectorAll('.mantine-Title-root')].map(e => getComputedStyle(e).fontSize),
    h3: [...new Set([...document.querySelectorAll('h3')].map(e => getComputedStyle(e).fontSize))],
    hOverflow: document.documentElement.scrollWidth > innerWidth,
  }))
  await page.close()
}
await browser.close(); server.close()
await writeFile('probe-titles.json', JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log(JSON.stringify(out))
