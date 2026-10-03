// Opus review 7: crops of the badge row + price block in each price-state section (ListingDetailPattern en@1440)
// and in each ListingDetailView public export (en@390), plus the badge labels found in each crop's section.
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
await new Promise((r) => server.listen(6162, '127.0.0.1', r))
const b = await chromium.launch()
const out = []
async function crops(id, w, tag) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await p.goto(`http://127.0.0.1:6162/iframe.html?id=${id}&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(900)
  const blocks = await p.evaluate(() => {
    const res = []
    for (const h of document.querySelectorAll('h1')) {
      const r = h.getBoundingClientRect()
      if (!r.width || r.top + scrollY < 50) continue
      // the detail block's column: walk up to the Stack holding badges, title and price
      let col = h.parentElement
      for (let i = 0; i < 3 && col && !col.querySelector('[class*="Badge"], .mantine-Badge-root'); i++) col = col.parentElement
      const badges = col ? [...col.querySelectorAll('.mantine-Badge-root, [class*="Badge-root"]')].map((x) => x.textContent.trim()) : []
      const price = [...(col || document).querySelectorAll('p')].filter((x) => getComputedStyle(x).fontWeight === '700' && getComputedStyle(x).fontSize === '20px').map((x) => ({ t: x.textContent.trim(), color: getComputedStyle(x).color }))
      const struck = [...(col || document).querySelectorAll('p')].filter((x) => getComputedStyle(x).textDecorationLine.includes('line-through')).map((x) => x.textContent.trim())
      const cr = (col || h).getBoundingClientRect()
      res.push({ top: Math.round(cr.top + scrollY), left: Math.round(cr.left), width: Math.round(cr.width), height: Math.round(Math.min(cr.height, 260)), badges, price, struck })
    }
    return res
  })
  for (const [i, bl] of blocks.entries()) {
    const file = `docs/sessions/evidence/task912/rv7-shots/crop_${tag}_${i}.png`
    await p.screenshot({ path: file, clip: { x: Math.max(0, bl.left - 8), y: Math.max(0, bl.top - 40), width: Math.min(bl.width + 16, w), height: bl.height + 60 }, fullPage: true })
    out.push({ tag, i, file, ...bl })
  }
  await p.close()
}
await crops('patterns-mantine-listingdetailpattern--default', 1440, 'detailpattern')
for (const e of ['public-listing', 'public-listing-not-reduced', 'public-listing-converted']) await crops(`patterns-mantine-listingdetailview--${e}`, 390, `detailview-${e}`)
await b.close(); server.close()
fs.writeFileSync('docs/sessions/evidence/task912/rv7-crops.json', JSON.stringify(out, null, 2))
for (const o of out) console.log(o.tag, o.i, 'badges:', o.badges.join(' / '), '| price:', o.price.map((p) => `${p.t} ${p.color}`).join(' ; '), '| struck:', o.struck.join(' ; '))
