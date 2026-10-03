// Opus review 6: is the ListingDetailView breadcrumb's current label visibly clipped at 320? Crop + clip chain.
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
await new Promise((r) => server.listen(6151, '127.0.0.1', r))
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 320, height: 700 }, deviceScaleFactor: 1 })
await p.goto('http://127.0.0.1:6151/iframe.html?id=patterns-mantine-listingdetailview--public-listing&viewMode=story&globals=locale:en', { waitUntil: 'networkidle' })
await p.waitForTimeout(800)
const info = await p.evaluate(() => {
  const out = []
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (w.nextNode()) {
    const n = w.currentNode
    if (!n.textContent.includes('Shitet apartament')) continue
    const el = n.parentElement
    const rg = document.createRange(); rg.selectNodeContents(n)
    const lines = [...rg.getClientRects()].map((r) => ({ l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top + scrollY) }))
    const chain = []
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a); const bb = a.getBoundingClientRect()
      if (cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis') chain.push({ tag: a.tagName, cls: String(a.className).slice(0, 50), ov: cs.overflowX, to: cs.textOverflow, ws: cs.whiteSpace, l: Math.round(bb.left), r: Math.round(bb.right), testid: a.getAttribute('data-testid') })
    }
    out.push({ tag: el.tagName, lines, chain })
  }
  return { out, nav: { b: 60 } }
})
console.log(JSON.stringify(info, null, 2))
await b.close(); server.close()
