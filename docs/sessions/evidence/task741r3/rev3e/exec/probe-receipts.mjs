// Task 741 Rev 3e — GR-3b/3c/3d/3e/3g measurements on the final storybook-static (en).
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3e/exec/'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const IDS = ['patterns-mantine-listingsshellview--default', 'patterns-mantine-listingsshellview--closed-tab', 'patterns-mantine-listingsshellview--closed-empty', 'patterns-mantine-listingsshellview--empty', 'patterns-mantine-listingsshellview--loading-more', 'patterns-mantine-listingssortbar--default', 'patterns-mantine-listingsactionrow--default', 'mantine-primitives-listingcard--default']
const out = {}
for (const id of IDS) for (const w of [320, 390, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root > :not(style)', { timeout: 30000 }); await page.waitForTimeout(1500)
  out[`${id}@${w}`] = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' }
    const kids = [...root.querySelectorAll('*')].filter(vis)
    let l = 1e9, r = 0, t = 1e9, b = 0
    for (const e of kids.filter(k => !k.children.length || k.matches('img,svg'))) { const q = e.getBoundingClientRect(); l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, q.top + scrollY); b = Math.max(b, q.bottom + scrollY) }
    let el = l, er = r
    const fs = sel => [...new Set([...root.querySelectorAll(sel)].filter(vis).map(e => getComputedStyle(e).fontSize))].join('/')
    return { overflow: document.documentElement.scrollWidth > innerWidth + 0, scrollW: document.documentElement.scrollWidth, gaps: { top: Math.round(t), bottom: Math.round(document.documentElement.scrollHeight - b), left: Math.round(l), right: Math.round(innerWidth - r) }, edgeLeft: Math.round(el), edgeRight: Math.round(innerWidth - er), h: { h1: fs('h1'), h2: fs('h2'), h3: fs('h3'), h4: fs('h4') }, body: fs('p'), btn: fs('button') }
  })
  await page.close()
}
// GR-3e: Save search modal in the action row, 390 and 1440
for (const w of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=patterns-mantine-listingsactionrow--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root > :not(style)'); await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Save search' }).first().click(); await page.waitForTimeout(800)
  out[`gr3e@${w}`] = await page.evaluate(() => {
    const dlg = document.querySelector('[role=dialog]')
    const bs = [...dlg.querySelectorAll('button')].filter(b => b.textContent.trim()).map(b => { const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), variant: b.getAttribute('data-variant'), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) } })
    return { buttons: bs, textButtons: bs.filter(b => b.variant === 'subtle' || b.variant === 'transparent').length }
  })
  await page.screenshot({ path: `${D}gr3e-save-search-${w}.png` })
  await page.close()
}
// GR-3g: overlay label corners, ClosedTab @1440, 10x pixelated
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=patterns-mantine-listingsshellview--closed-tab&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.listing-card'); await page.waitForTimeout(1500)
  const loc = (await page.evaluateHandle(() => [...document.querySelectorAll('.listing-card span')].find(x => getComputedStyle(x).rotate === '-8deg'))).asElement()
  const box = await loc.boundingBox()
  out.gr3g = { box, rotate: await loc.evaluate(e => getComputedStyle(e).rotate), overflowAncestors: await loc.evaluate(e => { const a = []; for (let p = e.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflow !== 'visible' && s.borderTopLeftRadius !== '0px') a.push({ cls: String(p.className).slice(0, 40), overflow: s.overflow, radius: s.borderTopLeftRadius }) } return a }) }
  await page.screenshot({ path: `${D}gr3g-overlay-1x.png`, clip: { x: box.x - 6, y: box.y - 6, width: box.width + 12, height: box.height + 12 } })
  const png = (await readFile(`${D}gr3g-overlay-1x.png`)).toString('base64')
  const p2 = await browser.newPage({ viewport: { width: 1000, height: 400 } })
  await p2.setContent(`<body style="margin:0"><img src="data:image/png;base64,${png}" style="image-rendering:pixelated;width:${(box.width + 12) * 10}px"></body>`)
  await p2.screenshot({ path: `${D}gr3g-overlay-10x.png`, fullPage: true })
  await page.close(); await p2.close()
}
await browser.close(); server.close()
await writeFile(D + 'probe-receipts.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out)) console.log(k, JSON.stringify(v))
