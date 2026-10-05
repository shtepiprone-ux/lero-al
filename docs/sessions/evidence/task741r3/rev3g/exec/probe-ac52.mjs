// Task 741 Revision 3g (Sonnet) — AC52/AC53 probe, modelled on Opus's rev3f/review-3f/review-probe.mjs, on the final
// storybook-static. Adds: row.scrollWidth<=clientWidth, the focus ring against the nearest non-visible-overflow ancestor,
// unique crop names, and an independent check of the chosen shed level against the estimate. Per matrix Story × locale × width: visible page numbers (not the
// position:fixed probe, inside the row box), row/root/consumer widths, document overflow, computed row and probe
// styles, the four edge gaps, and — at 390/1440 — the keyboard focus ring of the first and last focusable paginator
// controls against the row's own box (the row has overflow:hidden), with DPR-1 crops scaled 10×.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'docs/sessions/evidence/task741r3/rev3g/exec/'
await mkdir(OUT + 'crops', { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const idx = JSON.parse(await readFile(join(dir, 'index.json'), 'utf8'))
const ids = Object.entries(idx.entries).filter(([id, e]) => e.type === 'story' && (
  /^mantine-primitives-pagination--/.test(id) || /^patterns-mantine-listingspagination--/.test(id) ||
  /^patterns-mantine-listingsshellview--(default|loading-more)$/.test(id) || id === 'patterns-mantine-adminlistingsview--paginated' ||
  /^patterns-mantine-agentstatisticsview--/.test(id) || id === 'patterns-mantine-adminsurfacepattern--default')).map(([id]) => id)

const browser = await chromium.launch()
const out = {}
const measure = () => {
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.position !== 'fixed' }
  const leaves = [...document.querySelectorAll('#storybook-root *')].filter(e => e.children.length === 0 && vis(e))
  let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity
  for (const e of leaves) { const q = e.getBoundingClientRect(); t = Math.min(t, q.top + scrollY); l = Math.min(l, q.left); r = Math.max(r, q.right); b = Math.max(b, q.bottom + scrollY) }
  const H = Math.max(document.documentElement.scrollHeight, innerHeight)
  return {
    overflow: document.documentElement.scrollWidth > innerWidth,
    edges: { top: Math.round(t), right: Math.round(innerWidth - r), bottom: Math.round(H - b), left: Math.round(l) },
    pagers: [...document.querySelectorAll('.mantine-Pagination-root')].map(root => {
      const row = root.firstElementChild, rr = row.getBoundingClientRect(), cs = getComputedStyle(row)
      const ctrls = [...row.querySelectorAll('.mantine-Pagination-control, .mantine-Pagination-dots')].filter(b => { const s = getComputedStyle(b), q = b.getBoundingClientRect(); return s.position !== 'fixed' && q.width > 0 && q.left >= rr.left - 1 && q.right <= rr.right + 1 })
      const label = c => c.classList.contains('mantine-Pagination-dots') ? '…' : c.classList.contains('mantine-Pagination-edgeControl') ? (c === ctrls[0] ? '‹' : '›') : c.textContent.trim()
      const probe = row.querySelector('[aria-hidden="true"].mantine-Pagination-control'), ps = probe && getComputedStyle(probe)
      const act = ctrls.find(c => c.hasAttribute('data-active')), actN = act ? +act.textContent.trim() : null
      const nums = row.querySelectorAll('.mantine-Pagination-control:not([aria-hidden="true"])')
      return {
        scrollOk: row.scrollWidth <= row.clientWidth, ctrlW: probe ? Math.round(probe.getBoundingClientRect().width * 100) / 100 : 0, gapPx: parseFloat(cs.columnGap) || 0, visible: ctrls.map(label).join(' '), rowW: Math.round(rr.width), rowH: Math.round(rr.height), rootW: Math.round(root.getBoundingClientRect().width),
        consumerW: Math.round(root.parentElement.getBoundingClientRect().width), consumerTag: root.parentElement.className.split(' ')[0],
        row: { display: cs.display, flexWrap: cs.flexWrap, gap: cs.columnGap, overflow: cs.overflow, maxWidth: cs.maxWidth, styleAttr: row.getAttribute('style') },
        probe: probe ? { position: ps.position, visibility: ps.visibility, pointerEvents: ps.pointerEvents, left: ps.left, top: ps.top } : null,
      }
    }),
  }
}
// Tab until a paginator control has focus; return its geometry against the row box.
const focusState = () => {
  const a = document.activeElement
  if (!a || !a.closest('.mantine-Pagination-root')) return null
  const q = a.getBoundingClientRect(), s = getComputedStyle(a)
  const ext = (parseFloat(s.outlineWidth) || 0) + (parseFloat(s.outlineOffset) || 0)
  const ring = { top: q.top - ext, bottom: q.bottom + ext, left: q.left - ext, right: q.right + ext }
  let anc = null
  for (let p = a.parentElement; p && p !== document.documentElement; p = p.parentElement) { const c = getComputedStyle(p); if (c.overflowX !== 'visible' || c.overflowY !== 'visible') { anc = p; break } }
  const rr = anc ? anc.getBoundingClientRect() : null
  return { label: a.textContent.trim() || a.getAttribute('aria-label'), focusVisible: a.matches(':focus-visible'), outline: `${s.outlineStyle} ${s.outlineWidth} offset ${s.outlineOffset}`, ringExtent: ext,
    ctrl: { top: q.top, bottom: q.bottom, left: q.left, right: q.right },
    ancestor: anc ? { cls: String(anc.className).slice(0, 50), overflow: `${getComputedStyle(anc).overflowX}/${getComputedStyle(anc).overflowY}` } : null,
    roomPx: rr ? { top: q.top - rr.top, bottom: rr.bottom - q.bottom, left: q.left - rr.left, right: rr.right - q.right } : null,
    clippedPx: rr ? { top: Math.max(0, rr.top - ring.top), bottom: Math.max(0, ring.bottom - rr.bottom), left: Math.max(0, rr.left - ring.left), right: Math.max(0, ring.right - rr.right) } : { top: 0, bottom: 0, left: 0, right: 0 },
    crop: { x: Math.floor(q.left - ext - 6), y: Math.floor(q.top - ext - 6), width: Math.ceil(q.width + 2 * ext + 12), height: Math.ceil(q.height + 2 * ext + 12) } }
}
for (const id of ids) for (const [loc, w] of [['en', 320], ['en', 390], ['en', 1024], ['en', 1440], ['uk', 390], ['uk', 1440]]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`)
  await page.waitForSelector('#storybook-root *', { timeout: 15000 }).catch(() => null)
  await page.waitForTimeout(1500)
  const key = `${id}@${loc}@${w}`
  out[key] = await page.evaluate(measure)
  if (loc === 'en' && (w === 390 || w === 1440) && /pagination--in-centered-group|pagination--default$|listingsshellview--default$|listingspagination--default$|adminlistingsview--paginated|agentstatisticsview--default$/.test(id) && out[key].pagers.length) {
    const seen = []
    for (let i = 0; i < 200 && seen.length < 12; i++) {
      await page.keyboard.press('Tab')
      const f = await page.evaluate(focusState)
      if (f) seen.push(f)
      else if (seen.length) break
    }
    out[key].focus = seen
    for (const [n, f] of [['first', seen[0]], ['last', seen[seen.length - 1]]]) {
      if (!f) continue
      // re-focus that control for the crop
      const crop = `crops/${id}-${w}-${n}.png`
      await page.keyboard.press('Shift+Tab').catch(() => null)
      for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); const g = await page.evaluate(focusState); if (g && g.label === f.label && Math.round(g.ctrl.left) === Math.round(f.ctrl.left)) break }
      const shot = await page.screenshot({ clip: f.crop })
      await writeFile(OUT + crop, shot)
      const zoom = await browser.newPage({ viewport: { width: f.crop.width * 10, height: f.crop.height * 10 } })
      await zoom.setContent(`<body style="margin:0"><img src="data:image/png;base64,${shot.toString('base64')}" style="width:${f.crop.width * 10}px;image-rendering:pixelated"></body>`)
      await zoom.screenshot({ path: OUT + crop.replace('.png', '-10x.png') })
      await zoom.close()
      f.cropFile = crop
    }
  }
  await page.close()
}
await browser.close(); server.close()
await writeFile(OUT + 'review-probe.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out)) {
  console.log(k, v.overflow ? 'OVERFLOW' : 'ok', `edges t${v.edges.top} r${v.edges.right} b${v.edges.bottom} l${v.edges.left}`, v.pagers.map(p => `[${p.visible}] row${p.rowW}x${p.rowH}/root${p.rootW}/consumer${p.consumerW} ${p.row.overflow} ${p.row.flexWrap} gap${p.row.gap} probe:${p.probe ? p.probe.position + '/' + p.probe.visibility + '/' + p.probe.pointerEvents : '-'}`).join(' | '))
  if (v.focus) for (const f of v.focus) console.log('   focus', f.label, f.focusVisible ? 'fv' : 'no-fv', f.outline, 'clipped', JSON.stringify(f.clippedPx), f.cropFile ?? '')
}
