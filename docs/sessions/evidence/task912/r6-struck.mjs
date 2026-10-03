// Task 912 Revision 6 (AC22) — every element on the page with a line-through, per ListingDetailView export. Built storybook-static, DPR 1.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const root = path.resolve('storybook-static')
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]))
  const f = fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(root, 'index.html')
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(f)] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(6171, '127.0.0.1', r))

const browser = await chromium.launch()
const out = []
for (const id of [
  'patterns-mantine-listingdetailview--public-listing-not-reduced',
  'patterns-mantine-listingdetailview--public-listing-converted',
  'patterns-mantine-listingdetailview--public-listing',
]) {
  for (const [locale, w] of [['en', 390], ['en', 1440], ['uk', 390], ['uk', 1440]]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    await page.goto(`http://127.0.0.1:6171/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    const struck = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#storybook-root *'))
        .filter((e) => getComputedStyle(e).textDecorationLine.includes('line-through') && e.children.length === 0)
        .map((e) => e.textContent.trim()),
    )
    out.push({ id: id.replace('patterns-mantine-listingdetailview--', ''), locale, w, struck })
    await page.close()
  }
}
await browser.close()
server.close()
fs.writeFileSync('docs/sessions/evidence/task912/r6-struck.json', JSON.stringify(out, null, 2))
for (const c of out) console.log(c.id, c.locale + '@' + c.w, 'struck:', JSON.stringify(c.struck))
