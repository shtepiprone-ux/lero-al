// Task 741 Revision 3h — AC56 (overlay inside the list photo column, uk, 768 and 1440), GR-3b/3c/3d measurements for the
// changed Stories, and the GR-3f favourite-button crop, on the final storybook-static.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3i/exec/'
await mkdir(D + 'crops', { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const out = { ac56: {}, receipts: {}, gr3f: {} }
const IDS = ['mantine-primitives-favoritebutton--default']

async function zoom(png, name, w, h) {
  const z = await browser.newPage({ viewport: { width: Math.ceil(w * 10), height: Math.ceil(h * 10) } })
  await z.setContent(`<body style="margin:0"><img src="data:image/png;base64,${png.toString('base64')}" style="width:${Math.ceil(w * 10)}px;image-rendering:pixelated"></body>`)
  await z.screenshot({ path: D + 'crops/' + name + '-10x.png' }); await z.close()
}

// ── AC56: every sold/rented card in the list section shows its overlay label inside the photo column
for (const id of ['patterns-mantine-listingcardpattern--default', 'mantine-primitives-listingcard--default']) for (const w of [768, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:uk`)
  await page.waitForSelector('.mantine-Card-root', { timeout: 30000 }); await page.waitForTimeout(2500)
  const rows = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.mantine-Card-root')].filter(c => !c.closest('.mantine-SimpleGrid-root'))
    return cards.map((c, i) => {
      const lab = [...c.querySelectorAll('[data-card-part="overlay"] span')].find(s => getComputedStyle(s).rotate !== 'none')
      if (!lab) return null
      const col = c.querySelector('.mantine-Card-section'), q = lab.getBoundingClientRect(), r = col.getBoundingClientRect(), s = getComputedStyle(lab)
      return { card: i + 1, text: lab.textContent.trim(), colW: Math.round(r.width), labelW: Math.round(q.width), labelH: Math.round(q.height), insideX: q.left >= r.left && q.right <= r.right, insideY: q.top >= r.top && q.bottom <= r.bottom, roomL: Math.round(q.left - r.left), roomR: Math.round(r.right - q.right), border: `${s.borderTopWidth} ${s.borderTopStyle}`, rotate: s.rotate, ov: { x: q.x, y: q.y, w: q.width, h: q.height } }
    }).filter(Boolean)
  })
  out.ac56[`${id}@uk@${w}`] = rows.map(r => ({ ...r, ov: undefined }))
  // the widest label (the longest text) crop, DPR 1, 10x
  const widest = rows.sort((a, b) => b.labelW - a.labelW)[0]
  if (widest) {
    const ov = await page.evaluate(i => {
      const cards = [...document.querySelectorAll('.mantine-Card-root')].filter(c => !c.closest('.mantine-SimpleGrid-root'))
      const lab = [...cards[i].querySelectorAll('[data-card-part="overlay"] span')].find(s => getComputedStyle(s).rotate !== 'none')
      lab.scrollIntoView({ block: 'center' }); const q = lab.getBoundingClientRect()
      return { x: q.x, y: q.y, w: q.width, h: q.height }
    }, widest.card - 1)
    const clip = { x: Math.floor(ov.x) - 6, y: Math.floor(ov.y) - 6, width: Math.ceil(ov.w) + 12, height: Math.ceil(ov.h) + 12 }
    const png = await page.screenshot({ clip })
    const name = `ac56-${id.replace(/.*--/, '').replace(/^/, id.includes('pattern') ? 'pattern-' : 'primitive-')}-uk-${w}`
    await writeFile(D + 'crops/' + name + '.png', png); await zoom(png, name, clip.width, clip.height)
    out.ac56[`${id}@uk@${w}`].crop = 'crops/' + name + '-10x.png'
  }
  await page.close()
}

// ── GR-3b / 3c / 3d
for (const id of IDS) for (const w of [320, 390, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root > :not(style)', { timeout: 30000 }); await page.waitForTimeout(2000)
  out.receipts[`${id}@${w}`] = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && s.position !== 'fixed' }
    const leaves = [...root.querySelectorAll('*')].filter(e => (!e.children.length || e.matches('img,svg')) && vis(e))
    let l = 1e9, r = 0, t = 1e9, b = 0
    for (const e of leaves) { const q = e.getBoundingClientRect(); l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, q.top + scrollY); b = Math.max(b, q.bottom + scrollY) }
    const fs = sel => [...new Set([...root.querySelectorAll(sel)].filter(vis).map(e => getComputedStyle(e).fontSize))].sort().join('/')
    return { overflow: document.documentElement.scrollWidth > innerWidth, edges: { top: Math.round(t), right: Math.round(innerWidth - r), bottom: Math.round(document.documentElement.scrollHeight - b), left: Math.round(l) }, h: { h1: fs('h1'), h2: fs('h2'), h3: fs('h3'), h4: fs('h4') }, body: fs('p,span') }
  })
  await page.close()
}

// ── GR-3f: the favourite button (a circle) in the grid card, DPR 1 and 1.25, 10x
for (const dpr of [1, 1.25]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr })
  await page.goto(`${base}/iframe.html?id=patterns-mantine-listingcardpattern--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.mantine-Card-root', { timeout: 30000 }); await page.waitForTimeout(2500)
  const h = (await page.evaluateHandle(() => document.querySelector('.mantine-SimpleGrid-root [aria-pressed]'))).asElement()
  const q = await h.evaluate(e => { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { x: r.x, y: r.y, w: r.width, h: r.height, radius: s.borderTopLeftRadius, shadow: s.boxShadow } })
  const clip = { x: Math.floor(q.x) - 4, y: Math.floor(q.y) - 4, width: Math.ceil(q.w) + 8, height: Math.ceil(q.h) + 8 }
  const png = await page.screenshot({ clip })
  const name = `gr3f-favourite-dpr${dpr}`
  await writeFile(D + 'crops/' + name + '.png', png); await zoom(png, name, clip.width * dpr, clip.height * dpr)
  out.gr3f[`dpr${dpr}`] = { ...q, crop: 'crops/' + name + '-10x.png' }
  await page.close()
}
await browser.close(); server.close()
await writeFile(D + 'probe-fav.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out.ac56)) console.log('AC56', k, JSON.stringify(v.map ? v.map(r => `${r.text} col${r.colW} label${r.labelW}x${r.labelH} inside ${r.insideX && r.insideY} room ${r.roomL}/${r.roomR}`) : v))
for (const [k, v] of Object.entries(out.receipts)) console.log(k, v.overflow ? 'OVERFLOW' : 'ok', JSON.stringify(v.edges), JSON.stringify(v.h), v.body)
console.log('GR3f', JSON.stringify(out.gr3f))
