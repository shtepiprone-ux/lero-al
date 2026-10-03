// Opus review 10 (Revision 9): AC35 nav row focus pixels (4 sides, vs gray-0 and vs white), mouse/hover;
// AC37 Story status flow sq/uk x 390/1440, GR-3e after the change.
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
}).listen(6130)
const browser = await chromium.launch()
const url = (id, loc) => `http://127.0.0.1:6130/iframe.html?id=${id}&globals=locale:${loc}&viewMode=story`
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const cr = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return +((h + 0.05) / (l + 0.05)).toFixed(2) }
const out = { platform: `${process.platform} ${process.version}`, ac35: {}, ac37: [] }

{
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(url('patterns-mantine-navrowlist--default', 'sq')); await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(800)
  const rows = await page.$$('[data-nav-row]')
  const shot = async (name) => {
    const b = await rows[0].boundingBox()
    const buf = await page.screenshot({ clip: { x: Math.round(b.x) - 3, y: Math.round(b.y) - 3, width: Math.round(b.width) + 6, height: Math.round(b.height) + 6 } })
    fs.writeFileSync(`${EV}/${name}`, buf); return { b, b64: buf.toString('base64') }
  }
  const rest = await shot('130-opus-navrow-rest.png')
  await page.keyboard.press('Tab'); await page.waitForTimeout(300)
  const kbd = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { isFirstRow: a === document.querySelectorAll('[data-nav-row]')[0], fv: a.matches(':focus-visible'), boxShadow: cs.boxShadow, bg: cs.backgroundColor } })
  const foc = await shot('130-opus-navrow-focus.png')
  const p2 = await (await browser.newContext()).newPage()
  const read = (b64) => p2.evaluate(async ({ b64 }) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const at = (x, y) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3)
    const W = img.width, H = img.height, mx = Math.round(W / 2), my = Math.round(H / 2)
    return { W, H,
      left: [at(2, my), at(3, my), at(4, my), at(8, my)], right: [at(W - 3, my), at(W - 4, my), at(W - 5, my), at(W - 9, my)],
      top: [at(mx, 2), at(mx, 3), at(mx, 4), at(mx, 8)], bottom: [at(mx, H - 3), at(mx, H - 4), at(mx, H - 5), at(mx, H - 9)],
      cornerTL: [at(3, 3), at(4, 4), at(5, 5)] }
  }, { b64 })
  const pr = await read(rest.b64), pf = await read(foc.b64)
  const sides = {}
  for (const k of ['left', 'right', 'top', 'bottom']) {
    const [outside, edge, ring1, inner] = pf[k]
    sides[k] = { outside, edge, ring1, inner, restEdge: pr[k][1], edgeVsInner: cr(edge, inner), edgeVsOutside: cr(edge, outside), edgeVsGray0: cr(edge, [249, 250, 251]), edgeVsWhite: cr(edge, [255, 255, 255]) }
  }
  out.ac35 = { rowBox: rest.b, kbd, sides, cornerTL: pf.cornerTL, crop: { W: pf.W, H: pf.H } }
  const html = `<body style="margin:8px;background:#fff"><img src="data:image/png;base64,${rest.b64}" style="image-rendering:pixelated;width:${pf.W * 2}px"><br><img src="data:image/png;base64,${foc.b64}" style="image-rendering:pixelated;width:${pf.W * 2}px"><br><div style="width:600px;height:${pf.H * 10}px;overflow:hidden"><img src="data:image/png;base64,${foc.b64}" style="image-rendering:pixelated;width:${pf.W * 10}px"></div></body>`
  const p3 = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
  await p3.screenshot({ path: `${EV}/130-opus-navrow-focus-10x.png`, fullPage: true })
  await page.evaluate(() => document.activeElement?.blur())
  await rows[1].hover(); await page.waitForTimeout(250)
  out.ac35.hover = await page.evaluate(() => { const r = document.querySelectorAll('[data-nav-row]')[1]; const cs = getComputedStyle(r); return { boxShadow: cs.boxShadow, bg: cs.backgroundColor } })
  await rows[2].click({ noWaitAfter: true }); await page.waitForTimeout(300)
  out.ac35.mouse = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, isRow3: a === document.querySelectorAll('[data-nav-row]')[2], fv: a.matches(':focus-visible'), boxShadow: cs.boxShadow, url: location.href } })
}

for (const loc of ['sq', 'uk']) for (const w of [390, 1440]) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: w < 640 ? 844 : 900 } })).newPage()
  await page.goto(url('patterns-mantine-listingpreviewdialogview--active', loc)); await page.waitForSelector('[role=dialog]'); await page.waitForTimeout(1200)
  const dialog = page.locator('[role=dialog]')
  const sel = dialog.getByRole('textbox').first()
  const label = await sel.evaluate(el => el.labels?.[0]?.textContent ?? el.getAttribute('aria-label'))
  const before = await sel.inputValue()
  await sel.click(); await page.waitForTimeout(300)
  const optsBefore = []; for (const o of await page.getByRole('option').all()) optsBefore.push((await o.textContent()).trim())
  const soldName = { sq: 'Shitur', uk: 'Продано' }[loc]
  const soldOpt = page.getByRole('option', { name: soldName, exact: true })
  const soldCount = await soldOpt.count()
  if (soldCount) await soldOpt.first().click()
  await page.waitForTimeout(1500)
  const after = await sel.inputValue()
  const toastText = await page.locator('.mantine-Notification-root, [data-sonner-toast]').allTextContents()
  const overlays = await page.evaluate(() => [...document.querySelectorAll('.mantine-Drawer-root, .mantine-Modal-root, .mantine-Drawer-overlay, .mantine-Modal-overlay, [role=dialog], [role=listbox]')].map(e => ({ cls: e.className.split(' ').filter(c => c.startsWith('mantine-')).join(' '), role: e.getAttribute('role'), label: e.getAttribute('aria-label') || e.getAttribute('aria-labelledby'), visible: !!(e.offsetWidth || e.offsetHeight), text: (e.textContent || '').trim().slice(0, 60) })))
  await page.screenshot({ path: EV + '/130-opus-after-sold-' + loc + '-' + w + '.png' })
  let reopen = 'ok'
  try { await sel.click({ timeout: 4000 }) } catch (e) { reopen = 'blocked: ' + e.message.split(/\r?\n/).find(l => l.includes('intercepts')) }
  await page.waitForTimeout(300)
  const optsAfter = []; for (const o of await page.getByRole('option').all()) optsAfter.push((await o.textContent()).trim())
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  const geo = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]')
    const btns = [...d.querySelectorAll('button, a')].filter(b => b.offsetParent && (b.textContent || '').trim()).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || '').trim().slice(0, 30), v: b.getAttribute('data-variant'), top: Math.round(r.top), bottom: Math.round(r.bottom) } })
    const textBtns = btns.filter(b => b.v === 'subtle' || b.v === 'transparent')
    let shared = 0; for (let i = 0; i < textBtns.length; i++) for (let j = i + 1; j < textBtns.length; j++) if (!(textBtns[j].top >= textBtns[i].bottom || textBtns[i].top >= textBtns[j].bottom)) shared++
    return { dialogOpen: !!d, overflowX: document.documentElement.scrollWidth > innerWidth, textButtons: textBtns.length, sharedRowPairs: shared, navRows: d ? d.querySelectorAll('[data-nav-row]').length : null }
  })
  await page.screenshot({ path: `${EV}/130-opus-status-${loc}-${w}.png` })
  out.ac37.push({ loc, w, label, before, soldOptionFound: soldCount, after, reopen, overlays, toastText, optsBefore, optsAfter, ...geo })
}
fs.writeFileSync(`${EV}/130-opus-review10.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close()
console.log(JSON.stringify(out, null, 1))
