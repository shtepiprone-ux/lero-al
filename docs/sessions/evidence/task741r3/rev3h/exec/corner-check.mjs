// Task 741 Revision 3h (R67/R68/AC59, rule GR-11) — corner check. For every rounded object the revision changes, at
// DPR 1 and 1.25: a crop of one corner, scaled 10x with image-rendering: pixelated, and at DPR 1 the coverage of the
// corner's three diagonal cells. Coverage per pixel = |A - B| / |F - B|, where A is the crop with the element, B the crop
// with the element hidden (visibility: hidden, same hover state), and F the pixel on the element's straight top edge.
// This works over a photo, and for a border-only shape (F is then the border colour).
// The model is rev3g/owner-return/corner-pixels.mjs (diag cells 3,1 / 2,2 / 1,3 for an 8px radius; ideal arc 60/75/60).
// References: TailAdmin /pagination (live) and /cards, measured the same way; the ideal quarter circle for other radii.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = process.env.STORYBOOK_DIR ?? 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'docs/sessions/evidence/task741r3/rev3h/exec/corners/'
await mkdir(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
import { existsSync, readFileSync } from 'node:fs'
const SECT = (process.argv[2] ?? 'pag,ta,card,tacard').split(',')
const JSON_OUT = 'docs/sessions/evidence/task741r3/rev3h/exec/corners.json'
const report = existsSync(JSON_OUT) ? JSON.parse(readFileSync(JSON_OUT, 'utf8')) : { objects: {} }
report.objects ??= {}

const idealCell = (r, x, y) => { let n = 0; for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const px = x + (i + 0.5) / 16, py = y + (j + 0.5) / 16; const inside = (px >= r || py >= r) ? true : Math.hypot(r - px, r - py) <= r; if (inside) n++ } return Math.round(100 * n / 256) }
const diagCells = r => { const c = Math.floor(r * (1 - Math.SQRT1_2)); return [[c + 1, c - 1], [c, c], [c - 1, c + 1]].map(([x, y]) => [Math.max(0, x), Math.max(0, y)]) }

async function decode(page, buf) {
  return page.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return { w: img.width, h: img.height, data: Array.from(g.getImageData(0, 0, img.width, img.height).data) } }, buf.toString('base64'))
}

// handle: ElementHandle. state: async fn that puts the page in the state (hover/focus) and returns a cleanup.
async function measure(page, label, handle, radius, dprs, setup) {
  try { return await measureInner(page, label, handle, radius, dprs, setup) } catch (e) { report.objects[label] = { radius, error: String(e.message).slice(0, 160) }; console.log('ERROR', label, String(e.message).slice(0, 120)); return report.objects[label] }
}
async function measureInner(page, label, handle, radius, dprs, setup) {
  const out = { radius, dpr: {} }
  for (const dpr of dprs) {
    const rect = await handle.evaluate(e => { e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height } })
    if (setup) await setup()
    await page.waitForTimeout(400)
    const rect2 = await handle.evaluate(e => { const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height } })
    // A pill (radius 9999px) curves with half its height: clamp the radius to what the box can show.
    if (radius > rect2.h / 2 || radius > rect2.w / 2) { out.requestedRadius = radius; radius = Math.min(rect2.h / 2, rect2.w / 2); out.radius = radius }
    const size = Math.ceil(radius + 12)
    const clip = { x: Math.floor(rect2.x) - 2, y: Math.floor(rect2.y) - 2, width: size + 2, height: size + 2 }
    const withEl = await page.screenshot({ clip })
    await handle.evaluate(e => { e.dataset.prevVis = e.style.visibility; e.style.visibility = 'hidden' })
    const without = await page.screenshot({ clip })
    await handle.evaluate(e => { e.style.visibility = e.dataset.prevVis || '' })
    const f = `${label}-dpr${dpr}`
    await writeFile(OUT + f + '.png', withEl)
    const z = await browser.newPage({ viewport: { width: Math.ceil(clip.width * dpr * 10), height: Math.ceil(clip.height * dpr * 10) } })
    await z.setContent(`<body style="margin:0"><img src="data:image/png;base64,${withEl.toString('base64')}" style="width:${Math.ceil(clip.width * dpr * 10)}px;image-rendering:pixelated"></body>`)
    await z.screenshot({ path: OUT + f + '-10x.png' }); await z.close()
    out.dpr[dpr] = { crop: OUT + f + '.png', crop10x: OUT + f + '-10x.png' }
    if (dpr === 1) {
      const A = await decode(page, withEl), B = await decode(page, without)
      const at = (I, x, y) => { const i = (y * I.w + x) * 4; return [I.data[i], I.data[i + 1], I.data[i + 2]] }
      const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
      // Raw coverage of every crop pixel. F = the strongest contrast on the straight top edge (a few px right of the arc).
      let best = 0
      for (let x = 2 + Math.ceil(radius) + 2; x < Math.min(A.w, 2 + Math.ceil(radius) + 8); x++) for (let y = 0; y < Math.min(A.h, 8); y++) best = Math.max(best, dist(at(A, x, y), at(B, x, y)))
      const raw = (x, y) => Math.max(0, Math.min(100, Math.round(100 * dist(at(A, x, y), at(B, x, y)) / (best || 1))))
      // The control is rarely pixel aligned (fractional layout offsets): find its left and top edge in the crop, the first
      // column / row on the straight edges whose coverage reaches 30.
      const mx = 2 + Math.ceil(radius) + 4
      let left = 0; while (left < A.w - 1 && raw(left, Math.min(A.h - 1, 2 + Math.ceil(radius) + 4)) < 30) left++
      let top = 0; while (top < A.h - 1 && raw(mx, top) < 30) top++
      const cov = (x, y) => raw(left + x, top + y)
      const cells = diagCells(radius)
      out.edgeAt = [left, top]
      out.edgeContrast = Math.round(best)
      out.diag = cells.map(([x, y]) => cov(x, y))
      out.idealDiag = cells.map(([x, y]) => idealCell(radius, x, y))
      out.cells = cells
    }
  }
  report.objects[label] = out
  return out
}

async function openLero(page, id, w = 1440, dpr = 1) { await page.setViewportSize({ width: w, height: 900 }); await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`); await page.waitForSelector('#storybook-root > :not(style)', { timeout: 20000 }); await page.waitForTimeout(1500) }

// ── 1) lero.al paginator, `Mantine/Primitives/Pagination` -> `InCenteredGroup` (page 1 row: edge "<" disabled)
if (SECT.includes('pag')) {
const lp = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await openLero(lp, 'mantine-primitives-pagination--in-centered-group')
// 10 pages, page 1: the second `.mantine-Pagination-root` row. Controls, excluding the hidden measuring probe.
const find = async pick => (await lp.evaluateHandle(pickName => {
  const r = document.querySelectorAll('.mantine-Pagination-root')[1].firstElementChild
  const c = [...r.children].filter(x => getComputedStyle(x).position !== 'fixed')
  const edge = c.filter(x => x.classList.contains('mantine-Pagination-edgeControl'))
  if (pickName === 'active') return c.find(x => x.hasAttribute('data-active'))
  if (pickName === 'prev') return edge[0]
  if (pickName === 'next') return edge[edge.length - 1]
  return c.find(x => !x.hasAttribute('data-active') && !x.classList.contains('mantine-Pagination-edgeControl') && /^\d+$/.test(x.textContent.trim()))
}, pick)).asElement()
const active = await find('active')
const prev = await find('prev') // Previous: disabled on page 1
const next = await find('next')
const inactive = await find('inactive')
const rad = async h => parseFloat(await h.evaluate(e => getComputedStyle(e).borderTopLeftRadius))
const moveOff = async () => lp.mouse.move(2, 2)
await measure(lp, 'lero-pagination-active-rest', active, await rad(active), [1, 1.25], moveOff)
await measure(lp, 'lero-pagination-inactive-hover', inactive, await rad(inactive), [1, 1.25], async () => { const b = await inactive.boundingBox(); await lp.mouse.move(b.x + b.width / 2, b.y + b.height / 2) })
await measure(lp, 'lero-pagination-edge-enabled-rest', next, await rad(next), [1, 1.25], moveOff)
await measure(lp, 'lero-pagination-edge-enabled-hover', next, await rad(next), [1, 1.25], async () => { const b = await next.boundingBox(); await lp.mouse.move(b.x + b.width / 2, b.y + b.height / 2) })
await measure(lp, 'lero-pagination-edge-disabled', prev, await rad(prev), [1, 1.25], moveOff)
report.objects['lero-pagination-edge-disabled'].opacity = await prev.evaluate(e => getComputedStyle(e).opacity)
report.objects['lero-pagination-edge-disabled'].color = await prev.evaluate(e => getComputedStyle(e).color)
report.objects['lero-pagination-active-rest'].border = await active.evaluate(e => { const s = getComputedStyle(e); return `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}; bg ${s.backgroundColor}` })
// focus ring on the active control (keyboard)
await moveOff(); await active.evaluate(e => e.blur())
await lp.keyboard.press('Tab')
for (let i = 0; i < 40; i++) { const isA = await lp.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-active')); if (isA) break; await lp.keyboard.press('Tab') }
report.objects['lero-pagination-active-focus-visible'] = { focusVisible: await lp.evaluate(() => document.activeElement.matches(':focus-visible')), outline: await lp.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth} offset ${s.outlineOffset}` }) }
await measure(lp, 'lero-pagination-active-focus', active, await rad(active), [1, 1.25], null)
await lp.close()
}

// ── 2) TailAdmin references, live
if (SECT.includes('ta')) {
const tp = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await tp.goto('https://demo.tailadmin.com/pagination', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null)
await tp.waitForFunction(() => [...document.querySelectorAll('button, a')].some(b => b.textContent.trim() === 'Previous'), null, { timeout: 30000 })
await tp.waitForTimeout(1000)
const tHandle = async fn => (await tp.evaluateHandle(fn)).asElement()
const tPrev = await tHandle(() => [...document.querySelectorAll('button, a')].find(b => b.textContent.trim() === 'Previous' && b.getBoundingClientRect().width > 0))
const tNext = await tHandle(() => [...document.querySelectorAll('button, a')].find(b => b.textContent.trim() === 'Next' && b.getBoundingClientRect().width > 0))
const tActive = await tHandle(() => [...document.querySelectorAll('button, a')].find(b => b.textContent.trim() === '1' && b.getBoundingClientRect().width > 0))
const tInactive = await tHandle(() => [...document.querySelectorAll('button, a')].find(b => b.textContent.trim() === '2' && b.getBoundingClientRect().width > 0))
const tOff = async () => tp.mouse.move(2, 2)
const tHover = h => async () => { const b = await h.boundingBox(); await tp.mouse.move(b.x + b.width / 2, b.y + b.height / 2) }
const trad = async h => parseFloat(await h.evaluate(e => getComputedStyle(e).borderTopLeftRadius))
await measure(tp, 'tailadmin-pagination-active-rest', tActive, await trad(tActive), [1, 1.25], tOff)
await measure(tp, 'tailadmin-pagination-inactive-hover', tInactive, await trad(tInactive), [1, 1.25], tHover(tInactive))
await measure(tp, 'tailadmin-pagination-edge-rest', tNext, await trad(tNext), [1, 1.25], tOff)
await measure(tp, 'tailadmin-pagination-edge-hover', tNext, await trad(tNext), [1, 1.25], tHover(tNext))
await measure(tp, 'tailadmin-pagination-edge-prev-page1', tPrev, await trad(tPrev), [1, 1.25], tOff)
report.objects['tailadmin-pagination-edge-prev-page1'].opacity = await tPrev.evaluate(e => getComputedStyle(e).opacity)
await tp.close()
}

// ── 3) lero.al card objects: ListingCardPattern -> Default, grid and list
if (SECT.includes('card')) {
const cp = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await openLero(cp, 'patterns-mantine-listingcardpattern--default')
const h = async fn => (await cp.evaluateHandle(fn)).asElement()
const gridCard = await h(() => document.querySelector('.mantine-SimpleGrid-root .mantine-Card-root'))
const listCard = await h(() => [...document.querySelectorAll('.mantine-Card-root')].find(c => !c.closest('.mantine-SimpleGrid-root')))
const newBadge = await h(() => [...document.querySelectorAll('.mantine-SimpleGrid-root [data-card-part="badges"] .mantine-Badge-root')][0])
const photoBadge = await h(() => document.querySelector('.mantine-SimpleGrid-root [data-card-part="photo-count"]'))
const overlayLabel = await h(() => [...document.querySelectorAll('.mantine-SimpleGrid-root [data-card-part="overlay"] span')].find(s => getComputedStyle(s).rotate !== 'none'))
const overlayLabelList = await h(() => [...document.querySelectorAll('.mantine-Card-root')].filter(c => !c.closest('.mantine-SimpleGrid-root')).map(c => c.querySelector('[data-card-part="overlay"] span')).find(Boolean))
const favBtn = await h(() => document.querySelector('.mantine-SimpleGrid-root [aria-pressed]'))
const crad = async hh => parseFloat(await hh.evaluate(e => getComputedStyle(e).borderTopLeftRadius))
const off = async () => cp.mouse.move(2, 2)
await measure(cp, 'lero-card-root-grid', gridCard, await crad(gridCard), [1, 1.25], off)
await measure(cp, 'lero-card-root-list', listCard, await crad(listCard), [1, 1.25], off)
await measure(cp, 'lero-card-status-badge', newBadge, await crad(newBadge), [1, 1.25], off)
await measure(cp, 'lero-card-photo-count-badge', photoBadge, await crad(photoBadge), [1, 1.25], off)
await measure(cp, 'lero-card-overlay-label-grid', overlayLabel, await crad(overlayLabel), [1, 1.25], off)
await measure(cp, 'lero-card-overlay-label-list', overlayLabelList, await crad(overlayLabelList), [1, 1.25], off)
await measure(cp, 'lero-card-favourite-button', favBtn, await crad(favBtn), [1, 1.25], off)
await cp.close()
}

// ── 4) card references: TailAdmin /cards card, measured the same way
if (SECT.includes('tacard')) {
const ta = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await ta.goto('https://demo.tailadmin.com/cards', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null)
await ta.waitForTimeout(1500)
const tCard = (await ta.evaluateHandle(() => [...document.querySelectorAll('div')].find(d => { const s = getComputedStyle(d), q = d.getBoundingClientRect(); return d.querySelector('img') && q.width > 250 && q.width < 520 && q.height > 200 && parseFloat(s.borderTopLeftRadius) >= 8 && s.borderTopWidth !== '0px' }))).asElement()
if (tCard) await measure(ta, 'tailadmin-card', tCard, parseFloat(await tCard.evaluate(e => getComputedStyle(e).borderTopLeftRadius)), [1, 1.25], async () => ta.mouse.move(2, 2))
await ta.close()
}

await browser.close(); server.close()
// AC59 numbers
const o = report.objects
const d = k => o[k]?.diag?.join('/') ?? 'n/a'
report.ac59 = {
  activeLero: d('lero-pagination-active-rest'), activeTailAdmin: d('tailadmin-pagination-active-rest'),
  edgeDisabledLero: d('lero-pagination-edge-disabled'), edgeEnabledLero: d('lero-pagination-edge-enabled-rest'),
}
const within = (a, b, n = 10) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= n)
report.ac59.activeWithin10 = within(o['lero-pagination-active-rest']?.diag, o['tailadmin-pagination-active-rest']?.diag)
report.ac59.edgeDisabledWithin10OfEnabled = within(o['lero-pagination-edge-disabled']?.diag, o['lero-pagination-edge-enabled-rest']?.diag)
await writeFile('docs/sessions/evidence/task741r3/rev3h/exec/corners.json', JSON.stringify(report, null, 1) + '\n')
for (const [k, v] of Object.entries(o)) console.log(k.padEnd(42), 'r', v.radius, 'diag', (v.diag ?? []).join('/'), 'ideal', (v.idealDiag ?? []).join('/'), v.opacity !== undefined ? 'opacity ' + v.opacity : '')
console.log(JSON.stringify(report.ac59))
process.exit(report.ac59.activeWithin10 && report.ac59.edgeDisabledWithin10OfEnabled ? 0 : 1)
