// Task 741 Revision 3i review (Opus). Three questions on the final 3i storybook-static:
// 1. Archived card: the effective opacity (product over ancestors) of every badge, photo count, overlay label and
//    favourite inside the faded photo section (R70 moved the fade to `.imageSection`, which contains them).
// 2. Is the executor's "DPR 1.25" crop real? Here each DPR runs in its own browser context with that deviceScaleFactor.
// 3. Card-root corner (1px gray-300 ring, white body) vs the live TailAdmin /cards card ring, same method: per-pixel
//    coverage of the ring colour over the background in the r x r corner square, summed and divided by the ideal 1px ring
//    of the same radius (supersampled). 100 = as much ring as an ideal arc; a cut/notched corner drops, a square one rises.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3i/review/'
await mkdir(D + 'crops', { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const out = { platform: process.platform, node: process.version, archived: {}, corners: {} }

const story = async (ctx, id, w = 1440) => {
  const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 900 })
  await p.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
  await p.waitForSelector('#storybook-root .mantine-Card-root', { timeout: 30000 }); await p.waitForTimeout(2500); return p
}

// ── 1. archived opacity chain ──
{
  const ctx = await browser.newContext({ deviceScaleFactor: 1 })
  for (const id of ['patterns-mantine-listingcardpattern--default', 'mantine-primitives-listingcard--default']) {
    const p = await story(ctx, id)
    out.archived[id] = await p.evaluate(() => {
      const eff = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return Math.round(o * 100) / 100 }
      return [...document.querySelectorAll('.mantine-Card-root')].filter(c => /archived/.test(c.className)).map(c => ({
        layout: c.closest('.mantine-SimpleGrid-root') ? 'grid' : 'list',
        root: { opacity: getComputedStyle(c).opacity, filter: getComputedStyle(c).filter },
        parts: [...c.querySelectorAll('[data-card-part="badges"] .mantine-Badge-root, [data-card-part="photo-count"], [data-card-part="overlay"] span, [aria-pressed]')]
          .map(e => ({ what: e.getAttribute('data-card-part') ?? (e.hasAttribute('aria-pressed') ? 'favourite' : 'badge:' + e.textContent.trim()), effectiveOpacity: eff(e), radius: getComputedStyle(e).borderTopLeftRadius })),
      }))
    })
    const a = await p.$('.mantine-Card-root[class*="archived"]')
    if (a) await a.screenshot({ path: D + `crops/archived-${id.split('--')[0].split('-').pop()}-1440.png` })
    await p.close()
  }
  await ctx.close()
}

// ── 2 + 3. corner crops at real DPR 1 and 1.25 ──
async function ringMetric(buf, r, scratch, o = 4) {
  return scratch.evaluate(async ([b64, r, o]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, img.width, img.height).data
    const px = (x, y) => { const i = (y * img.width + x) * 4; return [d[i], d[i + 1], d[i + 2]] }
    const lum = p => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]
    // crop origin is 4px outside the element's top-left; bg = (0,0); ring colour = darkest pixel on the straight top edge
    const bg = lum(px(0, 0)); let ring = bg
    for (let x = Math.ceil(r) + 6; x < img.width; x++) for (let y = 0; y < 8; y++) ring = Math.min(ring, lum(px(x, y)))
    const cov = (x, y) => Math.max(0, Math.min(1, (bg - lum(px(x, y))) / ((bg - ring) || 1)))
    let sum = 0; const n = Math.ceil(r) + 1
    for (let y = o; y < o + n; y++) for (let x = o; x < o + n; x++) sum += cov(x, y)
    const diag = [1, 2, 3].map(k => Math.round(100 * cov(o + Math.round(r * 0.29) + k - 2, o + Math.round(r * 0.29) + k - 2)))
    // ideal 1px ring of radius r (outer edge on the box), supersampled, same square
    let ideal = 0
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let k = 0; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const X = x + (i + .5) / 8, Y = y + (j + .5) / 8; let inRing
      if (X < r && Y < r) { const dd = Math.hypot(r - X, r - Y); inRing = dd <= r && dd >= r - 1 } else inRing = X < 1 || Y < 1
      if (inRing) k++ } ideal += k / 64 }
    return { ringLum: Math.round(ring), bgLum: Math.round(bg), sum: Math.round(sum * 10) / 10, ideal: Math.round(ideal * 10) / 10, ratio: Math.round(1000 * sum / ideal) / 10, diag }
  }, [buf.toString("base64"), r, o])
}
async function zoom(buf, w, h, path) { const z = await browser.newPage({ viewport: { width: w * 10, height: h * 10 } }); await z.setContent(`<body style="margin:0"><img src="data:image/png;base64,${buf.toString('base64')}" style="width:${w * 10}px;height:${h * 10}px;image-rendering:pixelated"></body>`); await z.screenshot({ path }); await z.close() }

const scratch = await browser.newPage()
for (const dpr of [1, 1.25]) {
  const ctx = await browser.newContext({ deviceScaleFactor: dpr })
  const targets = []
  const p = await story(ctx, 'patterns-mantine-listingcardpattern--default')
  await p.mouse.move(2, 2)
  for (const [k, sel] of [['grid-root', '.mantine-SimpleGrid-root .mantine-Card-root'], ['list-root', '.mantine-Card-root:not(.mantine-SimpleGrid-root .mantine-Card-root)'], ['grid-archived', '.mantine-SimpleGrid-root .mantine-Card-root[class*="archived"]'], ['grid-premium', '.mantine-SimpleGrid-root .mantine-Card-root[class*="premium"]']]) {
    const el = await p.$(sel); if (el) targets.push([k, p, el, 'bottom-left'])
  }
  const ta = await ctx.newPage(); await ta.setViewportSize({ width: 1440, height: 900 })
  await ta.goto('https://demo.tailadmin.com/cards', { waitUntil: 'networkidle', timeout: 60000 }).catch(e => { out.tailadminError = String(e.message).slice(0, 120) })
  await ta.waitForTimeout(1500)
  const tH = await ta.evaluateHandle(() => [...document.querySelectorAll('div')].find(d => { const s = getComputedStyle(d), q = d.getBoundingClientRect(); return q.width > 250 && q.width < 600 && q.height > 250 && s.borderTopWidth === '1px' && parseFloat(s.borderTopLeftRadius) >= 8 && d.querySelector('img') }))
  const tEl = tH.asElement()
  if (tEl) { out.tailadminCard = await tEl.evaluate(e => { const s = getComputedStyle(e); return { cls: e.className, radius: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, bg: s.backgroundColor, pageBg: getComputedStyle(document.body).backgroundColor, w: e.getBoundingClientRect().width } }); targets.push(['tailadmin-card', ta, tEl, 'bottom-left']) }
  for (const [k, page, el, corner] of targets) {
    await el.evaluate(e => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(300)
    const info = await el.evaluate(e => { const q = e.getBoundingClientRect(), s = getComputedStyle(e); return { x: q.x, y: q.y, w: q.width, h: q.height, r: parseFloat(s.borderBottomLeftRadius), border: `${s.borderTopWidth} ${s.borderTopColor}`, opacity: s.opacity } })
    const size = Math.ceil(info.r) + 10
    // bottom-left corner, flipped so the corner is at the crop's top-left for the metric
    const clip = { x: Math.floor(info.x) - 4, y: Math.ceil(info.y + info.h) - size + 4 - 4, width: size + 4, height: size + 4 }
    const raw = await page.screenshot({ clip })
    const f = `${k}-bl-dpr${dpr}`
    await writeFile(D + 'crops/' + f + '.png', raw)
    const flipped = await scratch.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.translate(0, img.height); g.scale(1, -1); g.drawImage(img, 0, 0); return c.toDataURL('image/png').split(',')[1] }, raw.toString('base64'))
    const fb = Buffer.from(flipped, 'base64')
    const m = await ringMetric(fb, info.r * dpr, scratch, Math.round(4 * dpr))
    await zoom(raw, Math.round(clip.width * dpr), Math.round(clip.height * dpr), D + 'crops/' + f + '-10x.png')
    out.corners[f] = { radiusCss: info.r, border: info.border, opacity: info.opacity, rawBytes: raw.length, ...m }
  }
  await ctx.close()
}
await browser.close(); server.close()
await writeFile(D + 'review-probe.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
