// Opus review 9 (Task 857 Revision 8): independent re-measure of the 20 O78-12 tuples + extra widths.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = process.argv[2]
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6131)
const browser = await chromium.launch()
const url = (id, loc) => `http://127.0.0.1:6131/iframe.html?id=${id}&globals=locale:${loc}&viewMode=story`
const out = { platform: process.platform, node: process.version, cells: [], focus: null }
const stories = ['active', 'sold-status-actions', 'hidden', 'delete-confirm', 'premium']
for (const s of stories) for (const loc of ['sq', 'uk']) for (const vw of [320, 390, 768, 1440]) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: vw, height: vw >= 640 ? 900 : 844 } })
  const page = await ctx.newPage()
  await page.goto(url(`patterns-mantine-listingpreviewdialogview--${s}`, loc))
  await page.waitForSelector('[role=dialog]', { timeout: 20000 }); await page.waitForTimeout(1200)
  const r = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]')
    const all = [d, ...d.querySelectorAll('*')]
    const scrollers = all.filter(e => { const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1 })
      .map(e => ({ cls: (e.className?.baseVal ?? e.className ?? '').toString().slice(0, 80), sh: e.scrollHeight, ch: e.clientHeight }))
    const texts = [...d.querySelectorAll('h1,h2,h3,h4,p,span,a,button,label,div')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getBoundingClientRect().width > 0)
    const maxFont = Math.max(...texts.map(e => parseFloat(getComputedStyle(e).fontSize)))
    const title = d.querySelector('h2, .mantine-Modal-title, [id$="-title"]')
    const sizes = [...new Set(texts.map(e => getComputedStyle(e).fontSize))]
    const btns = [...d.querySelectorAll('button, a')].filter(b => b.getBoundingClientRect().width > 0)
    const textBtns = btns.filter(b => ['subtle', 'transparent'].includes(b.getAttribute('data-variant')) && b.textContent.trim())
    const shared = []
    for (let i = 0; i < textBtns.length; i++) for (let j = i + 1; j < textBtns.length; j++) {
      const a = textBtns[i].getBoundingClientRect(), b = textBtns[j].getBoundingClientRect()
      if (b.top < a.bottom - 1 && a.top < b.bottom - 1) shared.push([textBtns[i].textContent.trim(), textBtns[j].textContent.trim()])
    }
    const box = (d.closest('.mantine-Modal-content') ?? d).getBoundingClientRect()
    const footerBtns = [...d.querySelectorAll('.mantine-Button-root')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.bottom > box.bottom - 120 })
      .map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) } })
    return {
      overflowX: document.documentElement.scrollWidth > innerWidth || box.right > innerWidth + 0.5 || box.left < -0.5,
      dialogBox: { l: Math.round(box.left), t: Math.round(box.top), r: Math.round(innerWidth - box.right), b: Math.round(innerHeight - box.bottom), w: Math.round(box.width), h: Math.round(box.height) },
      scrollers, imgs: d.querySelectorAll('img').length, navRows: d.querySelectorAll('[data-nav-row]').length,
      titleFont: title ? getComputedStyle(title).fontSize : null, titleText: title?.textContent.trim().slice(0, 40), maxFont, sizes,
      textButtons: textBtns.length, sharedRows: shared, footerBtns,
    }
  })
  out.cells.push({ story: s, loc, vw, ...r })
  if (vw === 1440 && loc === 'uk' && s === 'premium') await page.screenshot({ path: `${OUT}/opus-premium-uk-1440.png` })
  if (vw === 390 && loc === 'uk' && s === 'active') await page.screenshot({ path: `${OUT}/opus-active-uk-390.png` })
  await ctx.close()
}
// Focus ring contrast: composite brand-5 @10% over gray-0 vs gray-0.
{
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(url('patterns-mantine-navrowlist--default', 'sq')); await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(800)
  out.focus = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement)
    return { brand5: cs.getPropertyValue('--mantine-color-brand-5').trim(), gray0: cs.getPropertyValue('--mantine-color-gray-0').trim(), gray3: cs.getPropertyValue('--mantine-color-gray-3').trim() }
  })
}
fs.writeFileSync(`${OUT}/opus-review9.json`, JSON.stringify(out, null, 1))
await browser.close(); server.close()
console.log('done', out.cells.length)
