// Opus review 3 probe for Task 912 Revision 2: the price row (price + trailing per-m²) of every price block
// in Patterns/Mantine/ListingDetailPattern/Default and ListingDetailView/PublicListing, built storybook-static.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const root = path.resolve('storybook-static')
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]))
  const f = fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(root, 'index.html')
  const ext = path.extname(f)
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(6131, '127.0.0.1', r))
const browser = await chromium.launch()
const out = []
const cases = [
  ['patterns-mantine-listingdetailpattern--default', 'en', 1440],
  ['patterns-mantine-listingdetailpattern--default', 'uk', 1440],
  ['patterns-mantine-listingdetailview--public-listing', 'en', 1440],
]
for (const [id, locale, w] of cases) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`http://127.0.0.1:6131/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const rows = await page.evaluate(() => {
    const res = []
    for (const el of document.querySelectorAll('p, span, div')) {
      if (el.children.length) continue
      const t = (el.textContent || '').trim()
      if (!/m²|м²/.test(t)) continue
      const row = el.parentElement
      res.push({ row: Array.from(row.children).map((c) => (c.textContent || '').trim()) })
    }
    return res
  })
  out.push({ id, locale, w, rows })
  await page.close()
}
await browser.close()
server.close()
fs.writeFileSync('docs/sessions/evidence/task912/rv3-opus-probe.json', JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2))
