// Task 912 Revision 8 (AC27) — the relative date shown by every ListingDetailView export, per locale at 390. Built storybook-static.
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
await new Promise((r) => server.listen(6181, '127.0.0.1', r))

const ids = ['public-listing', 'public-listing-not-reduced', 'public-listing-converted', 'staff-preview-unpublished', 'staff-preview-published', 'archived-listing']
const browser = await chromium.launch()
const out = []
for (const id of ids) {
  for (const locale of ['en', 'uk', 'sq', 'it']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 })
    await page.goto(`http://127.0.0.1:6181/iframe.html?id=patterns-mantine-listingdetailview--${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    // The date sits in the meta row next to the CalendarDays icon (MantineListingDetailPattern): the text of the p beside that svg.
    const date = await page.evaluate(() => {
      const icon = document.querySelector('#storybook-root svg.lucide-calendar-days')
      const p = icon && icon.parentElement.querySelector('p')
      return { date: p ? p.textContent.trim() : null }
    })
    out.push({ id, locale, ...date })
    await page.close()
  }
}
await browser.close()
server.close()
fs.writeFileSync('docs/sessions/evidence/task912/r8-date.json', JSON.stringify(out, null, 2))
for (const c of out) console.log(c.id, c.locale, JSON.stringify(c.date))
