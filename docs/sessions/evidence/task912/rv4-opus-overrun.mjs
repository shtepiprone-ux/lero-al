// Opus review 4: which text in ListingContactPattern/Default extends past the viewport's right edge at 320?
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const root = path.resolve('storybook-static')
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]))
  const f = fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(root, 'index.html')
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(6142, '127.0.0.1', r))
const browser = await chromium.launch()
const out = []
for (const locale of ['en', 'uk', 'it']) {
  const page = await browser.newPage({ viewport: { width: 320, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`http://127.0.0.1:6142/iframe.html?id=patterns-mantine-listingcontactpattern--default&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const hits = await page.evaluate(() => {
    const res = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const n = walker.currentNode
      if (!n.textContent.trim()) continue
      const rg = document.createRange(); rg.selectNodeContents(n)
      for (const b of rg.getClientRects()) {
        if (b.right <= innerWidth) continue
        const chain = []
        for (let a = n.parentElement; a && chain.length < 8; a = a.parentElement) {
          const cs = getComputedStyle(a)
          chain.push(`${a.tagName.toLowerCase()}${a.className && typeof a.className === 'string' ? '.' + a.className.split(' ')[0] : ''}[ov ${cs.overflowX}, pos ${cs.position}, clip ${cs.clip}, w ${Math.round(a.getBoundingClientRect().width)}]`)
        }
        res.push({ text: n.textContent.trim().slice(0, 50), left: Math.round(b.left), right: Math.round(b.right), chain })
      }
    }
    return { hits: res, scrollW: document.documentElement.scrollWidth, bodyOv: getComputedStyle(document.body).overflowX }
  })
  out.push({ locale, ...hits })
  await page.close()
}
await browser.close()
server.close()
console.log(JSON.stringify(out, null, 2))
