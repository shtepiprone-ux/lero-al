// Task 741 Revision 3e design — computed-style diff between the vertical (grid) and horizontal (list) ListingCard
// for the same listing, element by element. Story: mantine-primitives-listingcard--default, en, 1440 and 768.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const out = { platform: process.platform, node: process.version, cells: {} }
for (const w of [1440, 768]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=mantine-primitives-listingcard--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root .mantine-Badge-root', { timeout: 30000, state: 'attached' })
  await page.waitForTimeout(1500)
  out.cells[w] = await page.evaluate(() => {
    const pick = (card, idx) => {
      const cr = card.getBoundingClientRect()
      const leaf = re => [...card.querySelectorAll('*')].find(e => e.children.length === 0 && re.test((e.textContent || '').trim()))
      const st = e => { if (!e) return null; const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { tag: e.tagName.toLowerCase(), fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, color: s.color, x: Math.round(r.left - cr.left), y: Math.round(r.top - cr.top), w: Math.round(r.width), h: Math.round(r.height) } }
      const svgIn = e => e?.parentElement?.querySelector('svg')
      const badge = card.querySelector('.mantine-Badge-root')
      const fav = card.querySelector('button[aria-pressed], button[aria-label]')
      const cardEl = card.querySelector('.mantine-Card-root')
      const cs = getComputedStyle(cardEl)
      const img = card.querySelector('img') || card.querySelector('[data-testid="media-placeholder"]')
      return {
        card: { w: Math.round(cr.width), h: Math.round(cr.height), radius: cs.borderTopLeftRadius, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, bg: cs.backgroundColor },
        image: img ? (() => { const r = img.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left - cr.left), y: Math.round(r.top - cr.top) } })() : null,
        typeLabel: st(leaf(/^For sale · /)),
        title: st(card.querySelector('h3')),
        location: st(leaf(/^Tirana, Albania$/)),
        locationIcon: (() => { const e = svgIn(leaf(/^Tirana, Albania$/)?.parentElement ? leaf(/^Tirana, Albania$/) : null) || leaf(/^Tirana, Albania$/)?.parentElement?.querySelector('svg'); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), color: getComputedStyle(e).color } })(),
        feature: st(leaf(/^85 m²$/)) || st([...card.querySelectorAll('span')].find(e => /85 m²/.test(e.textContent) && e.children.length <= 1)),
        featureIcon: (() => { const e = card.querySelector('svg.lucide, svg'); return null })(),
        price: st(leaf(/^80,000 EUR$/)),
        priceOld: st(leaf(/^92,000 EUR$/)),
        perSqm: st(leaf(/EUR \/m²$/)),
        copyId: st(leaf(/^#\d+/)),
        date: st(leaf(/^(Jul|Jun) \d+, 2026$/)),
        badge: st(badge),
        photoCount: (() => { const c = card.querySelector('[class*="photoCount"]'); return st(c) })(),
        favorite: st(fav),
      }
    }
    const v = [...document.querySelectorAll('.listing-card--vertical')]
    const h = [...document.querySelectorAll('.listing-card--horizontal')]
    return { vertical: [0, 2].map(i => pick(v[i], i)), horizontal: [0, 2].map(i => pick(h[i], i)) }
  })
  await page.close()
}
await browser.close(); server.close()
await writeFile(new URL('./variant-diff.json', import.meta.url), JSON.stringify(out, null, 1) + '\n', 'utf8')
const c = out.cells[1440]
for (const k of Object.keys(c.vertical[0])) console.log(k.padEnd(11), 'V', JSON.stringify(c.vertical[k === 'priceOld' ? 1 : 0][k]), '\n'.padEnd(13), 'H', JSON.stringify(c.horizontal[k === 'priceOld' ? 1 : 0][k]))
