// Opus review 4 probe for Task 912 Revision 3 — every §18.9 matrix Story, built storybook-static, DPR 1.
// Per cell: four edge gaps (union of visible text/img boxes), horizontal overflow, heading sizes, every price block
// (struck line → price → owner-currency line: text, top, bottom, font-size, text-decoration-line), per-m² rows,
// and any open popup's text buttons.
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
await new Promise((r) => server.listen(6161, '127.0.0.1', r))

const stories = [
  'patterns-mantine-listingprice--default',
  'patterns-mantine-listingcontactpattern--default',
  'patterns-mantine-listingdetailview--public-listing',
  'patterns-mantine-listingdetailview--public-listing-not-reduced',
  'patterns-mantine-listingdetailview--public-listing-converted',
  'patterns-mantine-listingdetailpattern--default',
]
const cells = []
for (const id of stories) {
  for (const w of [320, 390, 1024, 1440]) cells.push([id, 'en', w])
  for (const l of ['sq', 'uk', 'it']) for (const w of [320, 1440]) cells.push([id, l, w])
  cells.push([id, 'uk', 390])
}

const browser = await chromium.launch()
const out = []
for (const [id, locale, w] of cells) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`http://127.0.0.1:6161/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const r = await page.evaluate(() => {
    const vis = (el) => {
      const cs = getComputedStyle(el)
      return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0
    }
    // Clip every box to its overflow-clipping ancestors and to the viewport's horizontal extent; record text that a
    // clip cuts partly (visible truncation) separately.
    const clipOf = (el) => {
      let r = { left: -1e9, top: -1e9, right: 1e9, bottom: 1e9 }
      for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a)
        const b = a.getBoundingClientRect()
        if (cs.overflowX !== 'visible') { r.left = Math.max(r.left, b.left); r.right = Math.min(r.right, b.right) }
        if (cs.overflowY !== 'visible') { r.top = Math.max(r.top, b.top); r.bottom = Math.min(r.bottom, b.bottom) }
      }
      return r
    }
    const boxes = []
    const cut = []
    const add = (b, el, text) => {
      const c = clipOf(el)
      const x = { left: Math.max(b.left, c.left), right: Math.min(b.right, c.right), top: Math.max(b.top, c.top), bottom: Math.min(b.bottom, c.bottom) }
      if (x.right - x.left < 1 || x.bottom - x.top < 1) return
      if (text && (x.left > b.left + 1 || x.right < b.right - 1)) cut.push({ text: text.slice(0, 60), w: Math.round(b.right - b.left), shown: Math.round(x.right - x.left) })
      boxes.push(x)
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const n = walker.currentNode
      if (!n.textContent.trim() || !vis(n.parentElement)) continue
      const rg = document.createRange(); rg.selectNodeContents(n)
      for (const b of rg.getClientRects()) if (b.width && b.height) add(b, n.parentElement, n.textContent.trim())
    }
    for (const el of document.querySelectorAll('img, svg')) {
      const b = el.getBoundingClientRect()
      if (b.width && b.height && vis(el)) add(b, el, null)
    }
    const sx = scrollX, sy = scrollY
    const top = Math.min(...boxes.map((b) => b.top + sy))
    const left = Math.min(...boxes.map((b) => b.left + sx))
    const right = innerWidth - Math.max(...boxes.map((b) => b.right + sx))
    const docH = document.documentElement.scrollHeight
    const bottom = docH - Math.max(...boxes.map((b) => b.bottom + sy))
    const overflow = document.documentElement.scrollWidth - innerWidth

    const heads = Array.from(document.querySelectorAll('h1,h2,h3,h4')).filter(vis).map((h) => `${h.tagName}:${getComputedStyle(h).fontSize}`)

    const leaf = (el) => ({ t: el.textContent.trim(), top: Math.round(el.getBoundingClientRect().top + sy), bottom: Math.round(el.getBoundingClientRect().bottom + sy), fs: getComputedStyle(el).fontSize, td: getComputedStyle(el).textDecorationLine, color: getComputedStyle(el).color })
    const blocks = []
    for (const el of document.querySelectorAll('p')) {
      if (getComputedStyle(el).fontWeight !== '700' || getComputedStyle(el).fontSize !== '20px') continue
      const row = el.parentElement
      const stack = row.parentElement
      const kids = Array.from(stack.children)
      const i = kids.indexOf(row)
      const before = i > 0 ? kids[i - 1] : null
      const after = kids[i + 1] || null
      blocks.push({
        old: before && before.tagName === 'P' ? leaf(before) : null,
        price: leaf(el),
        trailing: Array.from(row.children).slice(1).map((c) => c.textContent.trim()),
        owner: after && after.tagName === 'P' ? leaf(after) : null,
      })
    }
    const struckAnywhere = Array.from(document.querySelectorAll('*')).filter((e) => !e.children.length && getComputedStyle(e).textDecorationLine.includes('line-through')).map((e) => e.textContent.trim())
    const popups = document.querySelectorAll('[role="dialog"], [role="menu"], [data-popover]').length
    return { cut, gaps: { top: Math.round(top), right: Math.round(right), bottom: Math.round(bottom), left: Math.round(left) }, overflow, heads, blocks, struckAnywhere, popups }
  })
  out.push({ id, locale, w, ...r })
  await page.close()
}
await browser.close()
server.close()
fs.writeFileSync('docs/sessions/evidence/task912/r6-probe.json', JSON.stringify(out, null, 2))

// Summary
for (const c of out) {
  const bad = c.blocks.filter((b) => (b.old && (b.old.td !== 'line-through' || b.old.bottom > b.price.top || b.old.fs !== '12px')) || (b.owner && (b.owner.td.includes('line-through') || b.owner.fs !== '12px' || b.owner.top < b.price.bottom)))
  const sum = c.blocks.map((b) => `${b.old ? b.old.t + '~' : ''}${b.price.t}(${b.price.color.replace("rgb(17, 17, 17)","DARK").replace("rgb(236, 84, 71)","CORAL")})${b.trailing.length ? ' [' + b.trailing.join(',') + ']' : ''}${b.owner ? ' / ' + b.owner.t : ''}`)
  const uniq = [...new Set(sum)]
  console.log(`${c.id.replace('patterns-mantine-', '')} ${c.locale}@${c.w} gaps t/r/b/l ${c.gaps.top}/${c.gaps.right}/${c.gaps.bottom}/${c.gaps.left} ovf ${c.overflow} popups ${c.popups} heads ${c.heads.join(' ')} blocks ${c.blocks.length} bad ${bad.length}`)
  for (const k of c.cut) console.log('    CUT ' + JSON.stringify(k))
  for (const u of uniq) console.log('    ' + u + '  x' + sum.filter((s) => s === u).length)
}
