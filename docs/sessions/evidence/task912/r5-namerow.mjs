// Task 912 Revision 5 — name row of ListingContactPattern/Default: name top vs verified-badge top (normal section),
// and the owner-deleted message shown in full (wrapped lines, no ellipsis). Built storybook-static, DPR 1.
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
await new Promise((r) => server.listen(6151, '127.0.0.1', r))

const browser = await chromium.launch()
const out = []
for (const [locale, w] of [['en', 320], ['en', 1440], ['uk', 320], ['it', 320], ['uk', 1440], ['it', 1440]]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`http://127.0.0.1:6151/iframe.html?id=patterns-mantine-listingcontactpattern--default&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const r = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-testid="listing-contact-card"]'))
    const rect = (el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), bottom: Math.round(b.bottom + scrollY), left: Math.round(b.left), right: Math.round(b.right) } }
    const nameOf = (card) => Array.from(card.querySelectorAll('p')).find((p) => getComputedStyle(p).fontWeight === '600')
    // normal section = first card (verified agent, badge present)
    const first = cards[0]
    const name = nameOf(first)
    const badge = first.querySelector('[aria-label]')
    const nameRect = rect(name)
    const badgeRect = badge ? rect(badge) : null
    // owner-deleted card = the card with an `UserX` avatar and the deleted title as its name; find by the 4th card
    const deleted = cards[3]
    const dn = nameOf(deleted)
    const cs = getComputedStyle(dn)
    const lineH = parseFloat(cs.lineHeight)
    return {
      cards: cards.length,
      normal: { name: name.textContent, nameRect, badgeRect, sameRow: badgeRect ? Math.abs((nameRect.top + nameRect.bottom) / 2 - (badgeRect.top + badgeRect.bottom) / 2) <= lineH : null },
      deleted: {
        text: dn.textContent,
        textOverflow: cs.textOverflow,
        whiteSpace: cs.whiteSpace,
        overflowHidden: cs.overflow,
        clientW: dn.clientWidth,
        scrollW: dn.scrollWidth,
        lines: Math.round(dn.getBoundingClientRect().height / lineH),
        ellipsised: dn.scrollWidth > dn.clientWidth,
      },
      docOverflow: document.documentElement.scrollWidth - innerWidth,
    }
  })
  out.push({ locale, w, ...r })
  await page.close()
}
await browser.close()
server.close()
fs.writeFileSync('docs/sessions/evidence/task912/r5-namerow.json', JSON.stringify(out, null, 2))
for (const c of out) console.log(c.locale, c.w, 'cards', c.cards, 'normal', JSON.stringify(c.normal.nameRect), JSON.stringify(c.normal.badgeRect), 'sameRow', c.normal.sameRow, '| deleted', c.deleted.lines + ' line(s)', 'ellipsised', c.deleted.ellipsised, c.deleted.whiteSpace, c.deleted.textOverflow, '| docOverflow', c.docOverflow)
