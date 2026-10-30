// Task 923 Review 39 (Opus, 2026-10-23): the owner sees a different gap between Show number and WhatsApp. On the built Storybook (Patterns/Mantine/ListingContactPattern
// → Default) it measures, per section (normal, loading, revealed, WhatsApp fallback), the two contact controls' tag, box, computed display/height/margins and the
// gap between them, at 320 and 1440 px, en. Usage: node rv39-17-gap-probe.mjs <repo root>
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { createRequire } from 'node:module'
const [ROOT] = process.argv.slice(2)
const require = createRequire(path.join(ROOT, 'package.json'))
const { chromium } = require('playwright')
const STATIC = path.join(ROOT, 'storybook-static')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  const p = path.join(STATIC, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const file = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' }); fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, r))
const browser = await chromium.launch()
for (const width of [320, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto(`http://localhost:${server.address().port}/iframe.html?id=patterns-mantine-listingcontactpattern--default&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="listing-contact-card"]')
  const r = await page.evaluate(() => [...document.querySelectorAll('.mantine-SimpleGrid-root')].slice(0, 8).map((g) => {
    const kids = [...g.children].slice(0, 2)
    const box = (e) => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return { tag: e.tagName, top: +b.top.toFixed(1), h: +b.height.toFixed(1), display: s.display, mt: s.marginTop, mb: s.marginBottom, lh: s.lineHeight, va: s.verticalAlign } }
    const [a, b] = kids.map(box)
    const head = g.closest('[data-testid="listing-contact-card"]')?.parentElement?.querySelector(':scope > p')?.textContent
    return { section: head, gridRowGap: getComputedStyle(g).rowGap, first: a, second: b, gap: b ? +(b.top - a.top - a.h).toFixed(1) : null }
  }))
  console.log(`== ${width}px`); for (const x of r) console.log(JSON.stringify(x))
  await page.close()
}
await browser.close(); server.close()
