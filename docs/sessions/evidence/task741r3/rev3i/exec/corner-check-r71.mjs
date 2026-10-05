// Task 741 Revision 3i (R71 / AC61, rule GR-11) — corner check for the card's rounded objects, at DPR 1 and 1.25, in grid and
// list, beside the references. In the BROWSER ONLY (page.addStyleTag, never in source) the photo gets a flat fill and the
// overlay label is un-rotated, so each corner is measurable against a uniform backdrop.
// Metric: for one corner, A = crop with the element, B = crop with the element hidden (same hover state); coverage per pixel
// = |A - B| / |F - B|, F = the strongest contrast on the straight top edge. The corner's AREA RATIO is the sum of the
// coverage over the r x r corner square divided by r^2, in percent. An ideal quarter circle gives 78.5 (a square corner 100,
// a chamfer less). The corner is "round like the reference" when the ratio is within 10 points of the reference's, or of the
// ideal arc where no reference element exists. Crops are saved at DPR 1 and 1.25, scaled 10x with image-rendering: pixelated.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = process.env.STORYBOOK_DIR ?? 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3i/exec/'
await mkdir(D + 'corners', { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const report = { objects: {} }

async function decode(page, buf) {
  return page.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return { w: img.width, h: img.height, data: Array.from(g.getImageData(0, 0, img.width, img.height).data) } }, buf.toString('base64'))
}
const scratch = await browser.newPage()

// handle: ElementHandle; setup: async () => puts the page in a state. Returns { radius, areaRatio, crops }.
async function measure(page, label, handle, setup) {
  const out = { dpr: {} }
  try {
    for (const dpr of [1, 1.25]) {
      await handle.evaluate(e => e.scrollIntoView({ block: 'center' }))
      if (setup) await setup()
      await page.waitForTimeout(350)
      const info = await handle.evaluate(e => { const q = e.getBoundingClientRect(), s = getComputedStyle(e); return { x: q.x, y: q.y, w: q.width, h: q.height, radius: parseFloat(s.borderTopLeftRadius) || 0, opacity: s.opacity, border: `${s.borderTopWidth} ${s.borderTopStyle}`, bg: s.backgroundColor } })
      let r = info.radius
      if (r > info.h / 2 || r > info.w / 2) r = Math.min(info.h / 2, info.w / 2)
      out.radius = r; out.opacity = info.opacity; out.border = info.border; out.bg = info.bg
      const size = Math.ceil(r + 10)
      const clip = { x: Math.floor(info.x) - 3, y: Math.floor(info.y) - 3, width: size + 3, height: size + 3 }
      const withEl = await page.screenshot({ clip })
      await handle.evaluate(e => { e.dataset.pv = e.style.visibility; e.style.visibility = 'hidden' })
      const without = await page.screenshot({ clip })
      await handle.evaluate(e => { e.style.visibility = e.dataset.pv || '' })
      const f = `${label}-dpr${dpr}`
      await writeFile(D + 'corners/' + f + '.png', withEl)
      const z = await browser.newPage({ viewport: { width: Math.ceil(clip.width * dpr * 10), height: Math.ceil(clip.height * dpr * 10) } })
      await z.setContent(`<body style="margin:0"><img src="data:image/png;base64,${withEl.toString('base64')}" style="width:${Math.ceil(clip.width * dpr * 10)}px;image-rendering:pixelated"></body>`)
      await z.screenshot({ path: D + 'corners/' + f + '-10x.png' }); await z.close()
      out.dpr[dpr] = 'corners/' + f + '-10x.png'
      if (dpr === 1) {
        const A = await decode(scratch, withEl), B = await decode(scratch, without)
        const at = (I, x, y) => { const i = (y * I.w + x) * 4; return [I.data[i], I.data[i + 1], I.data[i + 2]] }
        const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
        let best = 0
        for (let x = 3 + Math.ceil(r) + 1; x < Math.min(A.w, 3 + Math.ceil(r) + 7); x++) for (let y = 0; y < Math.min(A.h, 9); y++) best = Math.max(best, dist(at(A, x, y), at(B, x, y)))
        const raw = (x, y) => (x < 0 || y < 0 || x >= A.w || y >= A.h) ? 0 : Math.max(0, Math.min(1, dist(at(A, x, y), at(B, x, y)) / (best || 1)))
        // the control's left / top edge: first column / row, on the straight edge, whose coverage reaches 0.5
        const ry = Math.min(A.h - 1, 3 + Math.ceil(r) + 3), rx = Math.min(A.w - 1, 3 + Math.ceil(r) + 3)
        let left = 0; while (left < A.w - 1 && raw(left, ry) < 0.5) left++
        let top = 0; while (top < A.h - 1 && raw(rx, top) < 0.5) top++
        const n = Math.ceil(r)
        let sum = 0
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) sum += raw(left + x, top + y)
        out.areaRatio = Math.round(1000 * sum / (r * r)) / 10
        out.edge = [left, top]; out.edgeContrast = Math.round(best)
      }
    }
  } catch (e) { out.error = String(e.message).slice(0, 140) }
  report.objects[label] = out
  return out
}

const open = async (page, id, w = 1440) => { await page.setViewportSize({ width: w, height: 900 }); await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`); await page.waitForSelector('#storybook-root .mantine-Card-root', { timeout: 30000 }); await page.waitForTimeout(2500) }
const FLAT = `.mantine-Card-section { background: rgb(120,120,120) !important }
.mantine-Card-section img, .mantine-Card-section [data-testid="media-placeholder"], .mantine-Card-section [data-testid="media-placeholder"] * { visibility: hidden !important }
.mantine-Card-root [class*="overlayLabel"] { rotate: none !important }`

const cp = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await open(cp, 'patterns-mantine-listingcardpattern--default')
await cp.addStyleTag({ content: FLAT })
const h = async fn => (await cp.evaluateHandle(fn)).asElement()
const GRID = '.mantine-SimpleGrid-root'
const off = async () => cp.mouse.move(2, 2)
const hover = el => async () => { const b = await el.boundingBox(); await cp.mouse.move(b.x + b.width / 2, b.y + b.height / 2) }
const cards = {
  'grid-root': await h(() => document.querySelector('.mantine-SimpleGrid-root .mantine-Card-root')),
  'list-root': await h(() => [...document.querySelectorAll('.mantine-Card-root')].find(c => !c.closest('.mantine-SimpleGrid-root'))),
  'grid-premium': await h(() => [...document.querySelectorAll('.mantine-SimpleGrid-root .mantine-Card-root')].find(c => /premium/.test(c.className))),
  'grid-archived': await h(() => [...document.querySelectorAll('.mantine-SimpleGrid-root .mantine-Card-root')].find(c => /archived/.test(c.className))),
  'list-archived': await h(() => [...document.querySelectorAll('.mantine-Card-root')].filter(c => !c.closest('.mantine-SimpleGrid-root')).find(c => /archived/.test(c.className))),
}
for (const [k, el] of Object.entries(cards)) if (el) await measure(cp, `lero-card-${k}-rest`, el, off)
await measure(cp, 'lero-card-grid-root-hover', cards['grid-root'], hover(cards['grid-root']))
await measure(cp, 'lero-card-list-root-hover', cards['list-root'], hover(cards['list-root']))

// every status badge colour, in grid and list: pick the first badge of each label
const LABELS = [['new', 'New'], ['price-reduced', 'Price reduced'], ['sold', 'Sold'], ['rented', 'Rented'], ['archived', 'Archived'], ['expired', 'Expired'], ['inactive', 'Inactive'], ['pending', 'Under review']]
for (const area of ['grid', 'list']) for (const [k, text] of LABELS) {
  const el = await cp.evaluateHandle(([area, text]) => [...document.querySelectorAll(`${area === 'grid' ? '.mantine-SimpleGrid-root ' : ''}[data-card-part="badges"] .mantine-Badge-root`)].filter(b => area === 'grid' || !b.closest('.mantine-SimpleGrid-root')).find(b => b.textContent.trim() === text), [area, text]).then(x => x.asElement())
  if (el) await measure(cp, `lero-card-${area}-badge-${k}`, el, off)
}
for (const area of ['grid', 'list']) {
  const pc = await cp.evaluateHandle(area => [...document.querySelectorAll('[data-card-part="photo-count"]')].find(b => !!b.closest('.mantine-SimpleGrid-root') === (area === 'grid')), area).then(x => x.asElement())
  if (pc) await measure(cp, `lero-card-${area}-photo-count`, pc, off)
  const ov = await cp.evaluateHandle(area => [...document.querySelectorAll('[data-card-part="overlay"] span')].find(b => !!b.closest('.mantine-SimpleGrid-root') === (area === 'grid')), area).then(x => x.asElement())
  if (ov) await measure(cp, `lero-card-${area}-overlay-label`, ov, off)
  const fv = await cp.evaluateHandle(area => [...document.querySelectorAll('[aria-pressed]')].find(b => !!b.closest('.mantine-SimpleGrid-root') === (area === 'grid')), area).then(x => x.asElement())
  if (fv) await measure(cp, `lero-card-${area}-favourite`, fv, off)
}
await cp.close()

// references, measured the same way: TailAdmin /cards (the card), Rozetka's promo label is recorded by the GR-7 script
const ta = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await ta.goto('https://demo.tailadmin.com/cards', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null)
await ta.waitForTimeout(1500)
const tCard = (await ta.evaluateHandle(() => [...document.querySelectorAll('div')].find(d => { const s = getComputedStyle(d), q = d.getBoundingClientRect(); return d.querySelector('img') && q.width > 250 && q.width < 520 && q.height > 200 && parseFloat(s.borderTopLeftRadius) >= 8 && s.overflow === 'hidden' }))).asElement()
if (tCard) await measure(ta, 'tailadmin-card', tCard, async () => ta.mouse.move(2, 2))
const tBadge = (await ta.evaluateHandle(() => [...document.querySelectorAll('span')].find(s => /^(new|featured|sale|badge)$/i.test(s.textContent.trim()) && s.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(s).borderTopLeftRadius) > 4))).asElement()
if (tBadge) await measure(ta, 'tailadmin-badge', tBadge, async () => ta.mouse.move(2, 2))
await ta.close()
await browser.close(); server.close()

const o = report.objects
const ref = { 'card-root': o['tailadmin-card']?.areaRatio, badge: o['tailadmin-badge']?.areaRatio }
const IDEAL = 78.5
report.ideal = IDEAL; report.references = ref
report.verdicts = {}
for (const [k, v] of Object.entries(o)) {
  if (k.startsWith('tailadmin')) continue
  const target = /root/.test(k) && ref['card-root'] !== undefined ? ref['card-root'] : /badge|photo-count|label/.test(k) && ref.badge !== undefined ? ref.badge : IDEAL
  report.verdicts[k] = { areaRatio: v.areaRatio, radius: v.radius, opacity: v.opacity, vsReference: target, within10: v.areaRatio !== undefined && Math.abs(v.areaRatio - target) <= 10, vsIdeal: v.areaRatio !== undefined && Math.abs(v.areaRatio - IDEAL) <= 10, error: v.error }
}
await writeFile(D + 'corners-r71.json', JSON.stringify(report, null, 1) + '\n')
for (const [k, v] of Object.entries(o)) console.log(k.padEnd(40), 'r', v.radius, 'ratio', v.areaRatio, 'op', v.opacity, v.error ?? '')
console.log('references', JSON.stringify(ref))
const bad = Object.entries(report.verdicts).filter(([, v]) => !(v.within10 || v.vsIdeal))
console.log('outside 10 points of reference and of the ideal arc:', bad.map(([k, v]) => `${k}=${v.areaRatio}`).join(', ') || 'none')
process.exit(0)
