// Revision 8: AC31 (no card/img, section order, translated type label), AC32 (no body scroll at 1440x900), AC33 (nav row ring crop).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6124)
const browser = await chromium.launch()
const url = (id, loc) => `http://127.0.0.1:6124/iframe.html?id=${id}&globals=locale:${loc}&viewMode=story`
const out = { ac31: [], ac32: [], ac33: null, noPhotoStoryExists: false }
const idx = JSON.parse(fs.readFileSync(`${ROOT}/index.json`, 'utf8')).entries
out.noPhotoStoryExists = Object.keys(idx).some(k => k.includes('no-photo-no-features'))

for (const s of ['active', 'sold-status-actions', 'hidden', 'delete-confirm', 'premium']) for (const loc of ['sq', 'uk']) for (const vw of [390, 1440]) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: vw, height: 900 } })).newPage()
  await page.goto(url(`patterns-mantine-listingpreviewdialogview--${s}`, loc)); await page.waitForSelector('[role=dialog]', { timeout: 20000 }); await page.waitForTimeout(1200)
  out.ac31.push({ story: s, loc, vw, ...(await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]')
    const titles = [...d.querySelectorAll('.mantine-Text-root')].filter(x => getComputedStyle(x).fontWeight === '500' && parseFloat(getComputedStyle(x).fontSize) === 16).map(x => x.textContent.trim())
    const desc = [...d.querySelectorAll('.mantine-Text-root')].find(x => parseFloat(getComputedStyle(x).fontSize) === 14 && x.textContent.includes('·'))
    return { imgs: d.querySelectorAll('img').length, cardRoot: d.querySelectorAll('.mantine-Card-root').length, sectionTitles: titles, description: desc?.textContent ?? null, navRows: d.querySelectorAll('[data-nav-row]').length, overflowX: document.documentElement.scrollWidth > innerWidth }
  })) })
  await page.context().close()
}

for (const s of ['active', 'premium']) for (const loc of ['sq', 'uk']) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(url(`patterns-mantine-listingpreviewdialogview--${s}`, loc)); await page.waitForSelector('[role=dialog]', { timeout: 20000 }); await page.waitForTimeout(1200)
  out.ac32.push({ story: s, loc, ...(await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]')
    const content = d.closest('.mantine-Modal-content') ?? d
    const body = d.querySelector('.mantine-Modal-body') ?? d
    const kids = [...body.children].map(c => Math.round(c.getBoundingClientRect().height))
    return { contentScrollHeight: content.scrollHeight, contentClientHeight: content.clientHeight, bodyScrollHeight: body.scrollHeight, bodyClientHeight: body.clientHeight, noScroll: content.scrollHeight <= content.clientHeight, bodyChildHeights: kids, modalHeight: Math.round(content.getBoundingClientRect().height) }
  })) })
  if (s === 'active' && loc === 'sq') await page.screenshot({ path: `${EV}/120-active-1440-r8.png` })
  await page.context().close()
}

// AC33: Tab onto row 1 -> ring; mouse click -> none. DPR-1 crop at 10x.
{
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(url('patterns-mantine-navrowlist--default', 'sq')); await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(800)
  await page.keyboard.press('Tab'); await page.waitForTimeout(250)
  const kbd = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { isRow: a.hasAttribute('data-nav-row'), focusVisible: a.matches(':focus-visible'), boxShadow: cs.boxShadow, bg: cs.backgroundColor } })
  const row = await page.$('[data-nav-row]'); const b = await row.boundingBox()
  const crop = (await page.screenshot({ clip: { x: b.x - 8, y: b.y - 8, width: b.width + 16, height: b.height + 16 } })).toString('base64')
  await page.evaluate(() => document.activeElement?.blur()); await page.mouse.move(5, 5)
  const rows = await page.$$('[data-nav-row]')
  await rows[2].click({ noWaitAfter: true }); await page.waitForTimeout(250)
  const mouse = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { isRow: a.hasAttribute('data-nav-row'), focusVisible: a.matches(':focus-visible'), boxShadow: cs.boxShadow } })
  out.ac33 = { keyboard: kbd, mouse }
  const html = `<body style="margin:12px;font:13px sans-serif;background:#fff"><div>nav row 1, keyboard Tab (DPR 1, scaled 2x pixelated)</div><img src="data:image/png;base64,${crop}" style="image-rendering:pixelated;width:${Math.round((b.width + 16) * 2)}px"></body>`
  const p2 = await (await browser.newContext({ viewport: { width: 1000, height: 400 } })).newPage(); await p2.setContent(html); await p2.waitForTimeout(300)
  await p2.screenshot({ path: `${EV}/122-navrow-focus-r8.png`, fullPage: true })
}
fs.writeFileSync(`${EV}/120-measurements-r8.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close()
console.log(JSON.stringify(out.ac32), JSON.stringify(out.ac33), 'noPhotoExists', out.noPhotoStoryExists)
for (const r of out.ac31) console.log(r.story, r.loc, r.vw, 'img', r.imgs, 'card', r.cardRoot, JSON.stringify(r.sectionTitles), r.description, 'nav', r.navRows, r.overflowX)
