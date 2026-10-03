// Opus review 8: one screenshot per ListingDetailPattern/Default section (both columns: detail block + contact card),
// en@1440, plus each contact card's price lines, so the two blocks of every section can be compared.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
const root = path.resolve('storybook-static')
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]))
  const f = fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(root, 'index.html')
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(6163, '127.0.0.1', r))
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await p.goto('http://127.0.0.1:6163/iframe.html?id=patterns-mantine-listingdetailpattern--default&viewMode=story&globals=locale:en', { waitUntil: 'networkidle' })
await p.waitForTimeout(900)
const secs = await p.evaluate(() => [...document.querySelectorAll('h1')].filter((h) => h.getBoundingClientRect().width && h.getBoundingClientRect().top + scrollY > 50).map((h) => {
  const grid = h.closest('.mantine-Grid-root')
  const r = grid.getBoundingClientRect()
  const card = grid.querySelector('[data-testid="listing-contact-card"]')
  const lines = card ? [...card.querySelectorAll('p')].filter((x) => /\d{2}/.test(x.textContent) && !/views|ago/.test(x.textContent)).map((x) => `${x.textContent.trim()} [${getComputedStyle(x).color}${getComputedStyle(x).textDecorationLine.includes('line-through') ? ', struck' : ''}]`) : ['NO CONTACT CARD']
  return { top: Math.round(r.top + scrollY), height: 620, lines }
}))
for (const [i, s] of secs.entries()) {
  await p.screenshot({ path: `docs/sessions/evidence/task912/rv7-shots/section_detailpattern_${i}.png`, clip: { x: 0, y: Math.max(0, s.top - 40), width: 1440, height: s.height }, fullPage: true })
  console.log(i, 'contact card:', s.lines.join(' | '))
}
await b.close(); server.close()
