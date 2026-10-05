// Task 741 Revision 3j R75 (AC64, GR-11) — a real corner probe with a twin reference.
// Usage: node corner-twin-probe.mjs [--plant]   (reads ./storybook-static, writes rev3j/exec/corner-twin.json + corners/)
//
// Real scale: each DPR (1, 1.25) runs in its own browser.newContext({ deviceScaleFactor }). The probe fails unless every
// DPR 1.25 crop is 1.25 times its DPR 1 crop's pixel size (+-1px).
// Twin reference: for each object and state, in the BROWSER ONLY (never in source) the object is hidden and a plain <div>
// twin is appended at the same box (position: fixed, same width, height, border-radius, border, background-color; the
// object's box-shadow, filter and opacity are copied too), on the same backdrop. That is TailAdmin's painting method (a
// plain bordered or filled CSS box) at the object's own radius. Photo-chrome objects sit on the flat photo fill (FLAT).
// The overlay label is measured un-rotated in the browser (its rotated crop is saved too).
// Metric: per-pixel coverage = |P - B| / F, P = the pixel with the object (A) or the twin (T), B = the backdrop with both
// hidden, F = the strongest contrast on the TWIN's straight edge (so a uniform fade of the object lowers its coverage).
// The r x r corner square is summed and given in points of the square (100 * sum / n^2). An object passes when |A - T| is
// 10 points or less at both DPRs. GR-11 style checks also run: effective opacity must be 1, and a border whose colour
// equals the fill is a failure (a same-colour border on a fill).
// --plant: in the browser only, opacity 0.4 on the first status badge and a 1px border in the fill colour on the photo count.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const PLANT = process.argv.includes('--plant')
const dir = process.env.STORYBOOK_DIR ?? 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = process.env.CORNER_OUT ?? 'docs/sessions/evidence/task741r3/rev3j/exec/'
const SUF = PLANT ? '-plant' : ''
await mkdir(D + 'corners' + SUF, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).split(String.fromCharCode(92)).join('/').replace(/^\/+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const scratch = await browser.newPage()
const pngSize = b => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) })

async function decode(buf, flipX, flipY) {
  return scratch.evaluate(async ([b64, fx, fy]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.translate(fx ? img.width : 0, fy ? img.height : 0); g.scale(fx ? -1 : 1, fy ? -1 : 1); g.drawImage(img, 0, 0)
    return { w: img.width, h: img.height, d: Array.from(g.getImageData(0, 0, img.width, img.height).data) }
  }, [buf.toString('base64'), flipX, flipY])
}

// corner points of one image against the backdrop; F comes from the twin so a faded object scores lower.
function field(I, B) {
  const at = (X, x, y) => { const i = (y * X.w + x) * 4; return [X.d[i], X.d[i + 1], X.d[i + 2]] }
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
  return (x, y) => (x < 0 || y < 0 || x >= I.w || y >= I.h) ? 0 : dist(at(I, x, y), at(B, x, y))
}
function points(dA, dT, ox, oy, n, rpx) {
  let F = 0
  for (let x = ox + Math.ceil(rpx) + 2; x < Math.min(dT.w ?? 9999, ox + Math.ceil(rpx) + 9); x++) for (let y = oy; y < oy + 5; y++) F = Math.max(F, dT.fn(x, y))
  const cov = (f, x, y) => Math.max(0, Math.min(1, f(x, y) / (F || 1)))
  let sA = 0, sT = 0
  for (let y = oy; y < oy + n; y++) for (let x = ox; x < ox + n; x++) { sA += cov(dA.fn, x, y); sT += cov(dT.fn, x, y) }
  return { A: Math.round(1000 * sA / (n * n)) / 10, T: Math.round(1000 * sT / (n * n)) / 10, F: Math.round(F) }
}

const FLAT = `.mantine-Card-section { background: rgb(120,120,120) !important }
.mantine-Card-section img, .mantine-Card-section [data-testid="media-placeholder"], .mantine-Card-section [data-testid="media-placeholder"] * { visibility: hidden !important }`
const UNROTATE = `.mantine-Card-root [class*="overlayLabel"] { rotate: none !important }`

async function runDpr(dpr) {
  const ctx = await browser.newContext({ deviceScaleFactor: dpr, viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${base}/iframe.html?id=patterns-mantine-listingcardpattern--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root .mantine-Card-root', { timeout: 30000 }); await page.waitForTimeout(2500)
  await page.addStyleTag({ content: FLAT })
  await page.addStyleTag({ content: UNROTATE })
  await page.evaluate(() => { document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('overlayLabel') && s.textContent.includes('rotate: none')) s.id = '__unrot' }) })
  const res = {}
  const h = async (fn, arg) => (await page.evaluateHandle(fn, arg)).asElement()
  const off = async () => page.mouse.move(2, 2)
  const hover = el => async () => { const b = await el.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2) }

  async function measure(label, el, { corner = 'tl', setup = off, plant = null, hoverNote = '' } = {}) {
    const out = { label, corner }
    try {
      await el.evaluate(e => e.scrollIntoView({ block: 'center' }))
      await setup(); await page.waitForTimeout(600)
      const info = await el.evaluate(e => {
        const q = e.getBoundingClientRect(), s = getComputedStyle(e)
        let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity)
        return { x: q.x, y: q.y, w: q.width, h: q.height, rad: s.borderTopLeftRadius, radBR: s.borderBottomRightRadius, radBL: s.borderBottomLeftRadius, bw: s.borderTopWidth, bs: s.borderTopStyle, bc: s.borderTopColor, bg: s.backgroundColor, shadow: s.boxShadow, filter: s.filter, opacity: o }
      })
      const rad = corner === 'bl' ? info.radBL : corner === 'br' ? info.radBR : info.rad
      let r = rad.endsWith('%') ? parseFloat(rad) * Math.min(info.w, info.h) / 100 : parseFloat(rad) || 0
      r = Math.min(r, info.w / 2, info.h / 2)
      out.radius = Math.round(r * 100) / 100; out.border = `${info.bw} ${info.bs} ${info.bc}`; out.bg = info.bg; out.effOpacity = Math.round(info.opacity * 100) / 100
      const size = Math.ceil(r) + 12
      const right = corner === 'br', bottom = corner === 'bl' || corner === 'br'
      const cx = right ? info.x + info.w : info.x, cy = bottom ? info.y + info.h : info.y
      const clip = { x: Math.floor(right ? cx + 2 - size : cx - 2), y: Math.floor(bottom ? cy + 2 - size : cy - 2), width: size, height: size }
      if (plant) await plant(el)
      // GR-11 style facts are read AFTER the plant (the twin keeps the pre-plant props)
      const post = await el.evaluate(e => { const s = getComputedStyle(e); let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return { bw: s.borderTopWidth, bs: s.borderTopStyle, bc: s.borderTopColor, bg: s.backgroundColor, opacity: o } })
      out.effOpacity = Math.round(post.opacity * 100) / 100; out.border = `${post.bw} ${post.bs} ${post.bc}`
      const A = await page.screenshot({ clip })
      await el.evaluate(e => { e.dataset.pv = e.style.visibility; e.style.visibility = 'hidden' })
      const B = await page.screenshot({ clip })
      await page.evaluate(i => {
        const t = document.createElement('div'); t.id = '__twin'
        Object.assign(t.style, { position: 'fixed', left: i.x + 'px', top: i.y + 'px', width: i.w + 'px', height: i.h + 'px', boxSizing: 'border-box', borderRadius: i.rad, border: `${i.bw} ${i.bs} ${i.bc}`, backgroundColor: i.bg, boxShadow: i.shadow, filter: i.filter, opacity: '1', zIndex: '2147483647', pointerEvents: 'none' })
        document.body.appendChild(t)
      }, { ...info, rad: rad })
      const T = await page.screenshot({ clip })
      await page.evaluate(() => document.getElementById('__twin')?.remove())
      await el.evaluate(e => { e.style.visibility = e.dataset.pv || '' })
      const f = `${label}-dpr${dpr}`
      await writeFile(`${D}corners${SUF}/${f}-object.png`, A); await writeFile(`${D}corners${SUF}/${f}-twin.png`, T)
      out.crop = pngSize(A); out.files = [`corners${SUF}/${f}-object.png`, `corners${SUF}/${f}-twin.png`]
      const fx = right, fy = bottom
      const [dA, dT, dB] = await Promise.all([decode(A, fx, fy), decode(T, fx, fy), decode(B, fx, fy)])
      const ox = Math.round((fx ? clip.x + clip.width - cx : cx - clip.x) * dpr), oy = Math.round((fy ? clip.y + clip.height - cy : cy - clip.y) * dpr)
      const n = Math.ceil(r * dpr)
      const pts = points({ fn: field(dA, dB) }, { fn: field(dT, dB), w: dT.w }, ox, oy, n, r * dpr)
      out.pointsObject = pts.A; out.pointsTwin = pts.T; out.diff = Math.round((pts.A - pts.T) * 10) / 10; out.straightEdgeContrast = pts.F
      out.fails = []
      if (Math.abs(out.diff) > 10) out.fails.push(`corner differs from its twin by ${out.diff} points`)
      if (post.opacity < 0.995) out.fails.push(`effective opacity ${out.effOpacity} (GR-11: no opacity fade)`)
      const alpha = /rgba\(.*,\s*([\d.]+)\)$/.exec(post.bg); const bgOn = post.bg !== 'rgba(0, 0, 0, 0)' && (!alpha || parseFloat(alpha[1]) > 0)
      if (bgOn && parseFloat(post.bw) > 0 && post.bs !== 'none' && post.bc === post.bg) out.fails.push('same-colour border on a fill (GR-11)')
      if (plant) out.planted = true
    } catch (e) { out.error = String(e.message).slice(0, 160); out.fails = ['probe error: ' + out.error] }
    res[label] = out
    return out
  }

  const grid = '.mantine-SimpleGrid-root'
  const isGrid = e => !!e.closest('.mantine-SimpleGrid-root')
  const roots = {
    'grid-root': await h(() => document.querySelector('.mantine-SimpleGrid-root .mantine-Card-root')),
    'list-root': await h(() => [...document.querySelectorAll('.mantine-Card-root')].find(c => !c.closest('.mantine-SimpleGrid-root'))),
    'grid-premium': await h(() => [...document.querySelectorAll('.mantine-SimpleGrid-root .mantine-Card-root')].find(c => /premium/.test(c.className))),
    'grid-archived': await h(() => [...document.querySelectorAll('.mantine-SimpleGrid-root .mantine-Card-root')].find(c => /archived/.test(c.className))),
    'list-archived': await h(() => [...document.querySelectorAll('.mantine-Card-root')].filter(c => !c.closest('.mantine-SimpleGrid-root')).find(c => /archived/.test(c.className))),
  }
  for (const [k, el] of Object.entries(roots)) {
    if (!el) { res[`card-${k}-rest`] = { label: `card-${k}-rest`, fails: ['object not found in the Story'] }; continue }
    await measure(`card-${k}-rest`, el, { corner: k.startsWith('list') ? 'br' : 'bl' })
  }
  await measure('card-grid-root-hover', roots['grid-root'], { corner: 'bl', setup: hover(roots['grid-root']) })
  await measure('card-list-root-hover', roots['list-root'], { corner: 'br', setup: hover(roots['list-root']) })

  const LABELS = [['new', 'New'], ['price-reduced', 'Price reduced'], ['sold', 'Sold'], ['rented', 'Rented'], ['archived', 'Archived'], ['expired', 'Expired'], ['inactive', 'Inactive'], ['pending', 'Under review']]
  let firstBadge = true
  for (const area of ['grid', 'list']) {
    for (const [k, text] of LABELS) {
      const el = await page.evaluateHandle(([area, text]) => [...document.querySelectorAll('[data-card-part="badges"] .mantine-Badge-root')].filter(b => !!b.closest('.mantine-SimpleGrid-root') === (area === 'grid')).find(b => b.textContent.trim() === text), [area, text]).then(x => x.asElement())
      if (!el) { res[`${area}-badge-${k}`] = { label: `${area}-badge-${k}`, missing: true, fails: [] }; continue }
      const planted = PLANT && firstBadge
      firstBadge = firstBadge && !planted ? firstBadge : false
      await measure(`${area}-badge-${k}`, el, { plant: planted ? async e => e.evaluate(x => { x.style.opacity = '0.4' }) : null })
    }
    let plantedPc = false
    for (const [k, sel] of [['photo-count', '[data-card-part="photo-count"]']]) {
      const el = await page.evaluateHandle(([area, sel]) => [...document.querySelectorAll(sel)].find(b => !!b.closest('.mantine-SimpleGrid-root') === (area === 'grid'), area), [area, sel]).then(x => x.asElement())
      const pl = PLANT && area === 'grid' && !plantedPc
      if (el) await measure(`${area}-${k}`, el, { plant: pl ? async e => e.evaluate(x => { x.style.border = '1px solid ' + getComputedStyle(x).backgroundColor }) : null }); else res[`${area}-${k}`] = { label: `${area}-${k}`, fails: ['object not found in the Story'] }
    }
    for (const [k, re] of [['sold', /sold/i], ['rented', /rented/i]]) {
      const el = await page.evaluateHandle(([area, src]) => [...document.querySelectorAll('[data-card-part="overlay"] span')].filter(b => !!b.closest('.mantine-SimpleGrid-root') === (area === 'grid')).find(b => new RegExp(src, 'i').test(b.textContent)), [area, re.source]).then(x => x.asElement())
      if (el) {
        await measure(`${area}-overlay-label-${k}`, el)
        // the rotated crop is saved too (not scored)
        await page.evaluate(() => { const s = document.getElementById('__unrot'); if (s) s.disabled = true })
        await page.waitForTimeout(200)
        await el.screenshot({ path: `${D}corners${SUF}/${area}-overlay-label-${k}-dpr${dpr}-rotated.png` }).catch(() => null)
        await page.evaluate(() => { const s = document.getElementById('__unrot'); if (s) s.disabled = false })
      } else res[`${area}-overlay-label-${k}`] = { label: `${area}-overlay-label-${k}`, missing: true, fails: [] }
    }
    const fv = await page.evaluateHandle(area => [...document.querySelectorAll('[aria-pressed]')].find(b => !!b.closest('.mantine-SimpleGrid-root') === (area === 'grid')), area).then(x => x.asElement())
    if (!fv) { res[`${area}-favourite`] = { label: `${area}-favourite`, fails: ['object not found in the Story'] }; continue }
    // the favourite: measured in each state that paints a background or border; the icon is hidden so only the shape is scored
    await page.addStyleTag({ content: '[aria-pressed] svg, [aria-pressed] img { visibility: hidden !important }' })
    const paint = async setup => { await fv.evaluate(e => e.scrollIntoView({ block: 'center' })); await setup(); await page.waitForTimeout(500); return fv.evaluate(e => { const s = getComputedStyle(e); return s.backgroundColor !== 'rgba(0, 0, 0, 0)' || (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' && s.borderTopColor !== 'rgba(0, 0, 0, 0)') }) }
    const paintedRest = await paint(off), paintedHover = await paint(hover(fv)); await off()
    if (!paintedRest && !paintedHover) { res[`${area}-favourite`] = { label: `${area}-favourite`, na: 'n/a: no painted shape (no background or border at rest and on hover)', fails: [] }; continue }
    if (paintedRest) await measure(`${area}-favourite`, fv)
    if (paintedHover) await measure(`${area}-favourite-hover`, fv, { setup: hover(fv) })
  }
  await ctx.close()
  return res
}

const byDpr = {}
for (const dpr of [1, 1.25]) byDpr[dpr] = await runDpr(dpr)

// live references beside them (saved, not scored), each DPR in its own context
async function refCrops(dpr) {
  const ctx = await browser.newContext({ deviceScaleFactor: dpr, viewport: { width: 1440, height: 900 } })
  const p = await ctx.newPage()
  const out = {}
  const grab = async (name, url, fn, corner) => {
    await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null); await p.waitForTimeout(1500)
    const el = (await p.evaluateHandle(fn)).asElement()
    if (!el) { out[name] = { found: false }; return }
    await el.evaluate(e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300)
    const i = await el.evaluate(e => { const q = e.getBoundingClientRect(), s = getComputedStyle(e); return { x: q.x, y: q.y, w: q.width, h: q.height, rad: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopColor}`, bg: s.backgroundColor } })
    const r = Math.min(parseFloat(i.rad) || 0, i.w / 2, i.h / 2), size = Math.ceil(r) + 12
    const bottom = corner === 'bl'
    const clip = { x: Math.floor(i.x - 2), y: Math.floor(bottom ? i.y + i.h + 2 - size : i.y - 2), width: size, height: size }
    const buf = await p.screenshot({ clip })
    const file = `corners${SUF}/ref-${name}-dpr${dpr}.png`
    await writeFile(D + file, buf); out[name] = { found: true, file, radius: i.rad, border: i.border, bg: i.bg }
  }
  await grab('tailadmin-card', 'https://demo.tailadmin.com/cards', () => [...document.querySelectorAll('.rounded-xl.border')].find(e => e.querySelector('img')), 'bl')
  await grab('tailadmin-badge', 'https://demo.tailadmin.com/badge', () => [...document.querySelectorAll('span.rounded-full')].find(e => e.textContent.trim().length > 0), 'tl')
  await ctx.close(); return out
}
const refs = { 1: await refCrops(1), 1.25: await refCrops(1.25) }

// contact sheets, 10x pixelated, per row: object | twin | TailAdmin
for (const dpr of [1, 1.25]) {
  const rows = []
  for (const [k, v] of Object.entries(byDpr[dpr])) {
    if (!v.files) continue
    const isCard = /^card-/.test(k)
    const ref = refs[dpr][isCard ? 'tailadmin-card' : 'tailadmin-badge']
    const img = async f => { const b = await readFile(D + f); const s = pngSize(b); return `<img src="data:image/png;base64,${b.toString('base64')}" style="width:${s.w * 10}px;height:${s.h * 10}px;image-rendering:pixelated">` }
    rows.push(`<tr><td style="font:12px monospace;width:230px">${k}<br>r ${v.radius}<br>obj ${v.pointsObject} / twin ${v.pointsTwin}</td><td>${await img(v.files[0])}</td><td>${await img(v.files[1])}</td><td>${ref?.file ? await img(ref.file) : 'no reference'}</td></tr>`)
  }
  const sp = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await sp.setContent(`<body style="margin:8px;background:#fff"><table cellspacing="6"><tr><th>object</th><th>object 10x</th><th>twin 10x</th><th>TailAdmin 10x</th></tr>${rows.join('')}</table></body>`)
  await sp.screenshot({ path: `${D}corners-sheet-dpr${dpr}${SUF}.png`, fullPage: true }); await sp.close()
}
await browser.close(); server.close()

// verdicts: size check across DPRs, then per object (DPR 1 and 1.25 must both pass)
const report = { platform: process.platform, plant: PLANT, objects: {}, failures: [], sizeCheck: [] }
for (const k of Object.keys(byDpr[1])) {
  const a = byDpr[1][k], b = byDpr[1.25][k]
  const rec = { dpr1: a, dpr125: b }
  report.objects[k] = rec
  if (a.na) continue
  if (a.missing) { report.failures.push(`${k}: not present in the Story (missing)`); continue }
  for (const [d, o] of [['1', a], ['1.25', b]]) for (const f of o?.fails ?? []) report.failures.push(`${k} @DPR${d}: ${f}${o.planted ? ' [PLANTED]' : ''}`)
  if (a.crop && b?.crop) {
    const okW = Math.abs(b.crop.w - a.crop.w * 1.25) <= 1, okH = Math.abs(b.crop.h - a.crop.h * 1.25) <= 1
    report.sizeCheck.push({ k, dpr1: a.crop, dpr125: b.crop, ok: okW && okH })
    if (!(okW && okH)) report.failures.push(`${k}: DPR 1.25 crop ${b.crop.w}x${b.crop.h} is not 1.25 x ${a.crop.w}x${a.crop.h}`)
  }
}
report.references = refs
await writeFile(`${D}corner-twin${SUF}.json`, JSON.stringify(report, null, 1) + '\n')
const n = Object.keys(report.objects).length
console.log(`objects ${n}; size checks ${report.sizeCheck.length} (${report.sizeCheck.filter(s => s.ok).length} ok); failures ${report.failures.length}`)
for (const [k, v] of Object.entries(report.objects)) console.log(k.padEnd(34), v.dpr1.na ?? (v.dpr1.missing ? 'MISSING' : `r ${v.dpr1.radius} obj ${v.dpr1.pointsObject} twin ${v.dpr1.pointsTwin} | 1.25: obj ${v.dpr125?.pointsObject} twin ${v.dpr125?.pointsTwin}`))
report.failures.forEach(f => console.log('FAIL', f))
process.exit(report.failures.length ? 1 : 0)
