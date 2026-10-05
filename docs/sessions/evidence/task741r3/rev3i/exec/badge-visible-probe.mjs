// Task 741 Revision 3i (R73b / AC60) — every card badge and photo count is on screen: topmost at its centre and inside its
// photo. Stories: ListingCardPattern, Primitives/ListingCard, ListingsShellView Default and ClosedTab; en; 390/768/1440.
// Usage: node badge-visible-probe.mjs   (reads ./storybook-static, or STORYBOOK_DIR; writes badge-visible.json or BADGE_OUT)
// Exits 1 and names the first failing cell when any badge is hidden or outside its photo.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = process.env.STORYBOOK_DIR ?? 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = process.env.BADGE_OUT ?? 'docs/sessions/evidence/task741r3/rev3i/exec/badge-visible.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const STORIES = ['patterns-mantine-listingcardpattern--default', 'mantine-primitives-listingcard--default', 'patterns-mantine-listingsshellview--default', 'patterns-mantine-listingsshellview--closed-tab']
const result = { cells: 0, badges: 0, bad: [], tuples: {} }

for (const id of STORIES) for (const w of [390, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root .mantine-Card-root', { timeout: 30000 }); await page.waitForTimeout(2500)
  const count = await page.evaluate(() => document.querySelectorAll('.mantine-Card-root').length)
  const found = []
  for (let i = 0; i < count; i++) {
    const info = await page.evaluate(i => {
      const card = document.querySelectorAll('.mantine-Card-root')[i]
      const photo = card.querySelector('.mantine-Card-section')
      const items = [...card.querySelectorAll('[data-card-part="badges"] .mantine-Badge-root, [data-card-part="photo-count"]')]
      if (!items.length || photo.getBoundingClientRect().width === 0) return null
      photo.scrollIntoView({ block: 'center' })
      const pr = photo.getBoundingClientRect()
      return items.map(el => {
        const r = el.getBoundingClientRect()
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        return {
          card: i + 1, text: el.textContent.trim().slice(0, 24), part: el.closest('[data-card-part]').getAttribute('data-card-part'),
          topmost: !!top && el.contains(top),
          inside: r.width > 0 && r.left >= pr.left - 0.5 && r.right <= pr.right + 0.5 && r.top >= pr.top - 0.5 && r.bottom <= pr.bottom + 0.5,
          box: [Math.round(r.left - pr.left), Math.round(r.top - pr.top), Math.round(r.width), Math.round(r.height)], photo: [Math.round(pr.width), Math.round(pr.height)],
        }
      })
    }, i)
    if (info) found.push(...info)
  }
  const key = `${id}@${w}`
  result.cells++; result.badges += found.length
  result.tuples[key] = { badges: found.length, failing: found.filter(f => !f.topmost || !f.inside).length }
  for (const f of found) if (!f.topmost || !f.inside) result.bad.push({ cell: key, ...f })
  await page.close()
}
await browser.close(); server.close()
await writeFile(OUT, JSON.stringify(result, null, 1) + '\n')
console.log(`badge-visible: ${result.cells} cells, ${result.badges} badges/photo counts, ${result.bad.length} hidden or outside their photo`)
for (const b of result.bad.slice(0, 8)) console.log(`FAIL ${b.cell} card ${b.card} ${b.part} "${b.text}" topmost=${b.topmost} inside=${b.inside} box=${b.box} photo=${b.photo}`)
for (const [k, v] of Object.entries(result.tuples)) console.log(k, JSON.stringify(v))
process.exit(result.bad.length ? 1 : 0)
