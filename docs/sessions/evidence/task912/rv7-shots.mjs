// Opus review 7: full-page screenshots of every open §23.6 owner-matrix tuple (built storybook-static, DPR 1),
// for the reviewer to look at as the owner will.
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
await new Promise((r) => server.listen(6161, '127.0.0.1', r))
const tuples = []
for (const l of ['en', 'uk']) for (const w of [320, 1440]) tuples.push(['patterns-mantine-listingcontactpattern--default', l, w])
for (const id of ['public-listing', 'public-listing-not-reduced', 'public-listing-converted']) for (const l of ['en', 'uk']) for (const w of [390, 1440]) tuples.push([`patterns-mantine-listingdetailview--${id}`, l, w])
tuples.push(['patterns-mantine-listingdetailpattern--default', 'en', 1440])
const b = await chromium.launch()
for (const [id, l, w] of tuples) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await p.goto(`http://127.0.0.1:6161/iframe.html?id=${id}&viewMode=story&globals=locale:${l}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(900)
  const name = `${id.replace('patterns-mantine-', '')}_${l}_${w}.png`
  await p.screenshot({ path: `docs/sessions/evidence/task912/rv7-shots/${name}`, fullPage: true })
  console.log(name)
  await p.close()
}
await b.close(); server.close()
