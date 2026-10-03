// Task 857 Revision 10, AC38 (R65): nav row corners follow the list (GR-3g). DPR 1, sq. NavRowList Default at 1440 (Tab onto every row),
// plus the dialog's nav rows in ListingPreviewDialogView Active at 390 and 1440. Also re-asserts AC35 (brand-7 line, >= 3:1, click and hover).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6132)
const browser = await chromium.launch()
const url = (id) => `http://127.0.0.1:6132/iframe.html?id=${id}&globals=locale:sq&viewMode=story`
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
const out = { platform: `${process.platform} ${process.version}`, dpr: 1, cases: [] }
const tiles = []

const radii = (page) => page.evaluate(() => {
  const rows = [...document.querySelectorAll('[data-nav-row]')]
  const list = rows[0].closest('.mantine-Paper-root')
  const lc = getComputedStyle(list)
  const rr = (r) => { const c = getComputedStyle(r); return { tl: c.borderTopLeftRadius, tr: c.borderTopRightRadius, bl: c.borderBottomLeftRadius, br: c.borderBottomRightRadius } }
  return { list: { radius: lc.borderRadius, border: lc.borderTopWidth, overflow: lc.overflow, paperRadiusVar: lc.getPropertyValue('--paper-radius') }, rows: rows.map(rr) }
})

const runCase = async (id, width, label) => {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width, height: 900 } })).newPage()
  await page.goto(url(id))
  await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(1500)
  const info = await radii(page)
  const n = info.rows.length
  const c = { label, story: id, width, rowCount: n, ...info, focus: [] }
  const seen = new Set()
  for (let i = 0; i < 40 && seen.size < n; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(120)
    const idx = await page.evaluate(() => { const a = document.activeElement; const rows = [...document.querySelectorAll('[data-nav-row]')]; return a?.hasAttribute('data-nav-row') && a.matches(':focus-visible') ? rows.indexOf(a) : -1 })
    if (idx < 0 || seen.has(idx)) continue
    seen.add(idx)
    const b = await (await page.$$('[data-nav-row]'))[idx].boundingBox()
    const s = 14
    for (const [x, y, k] of [[b.x - 2, b.y - 2, 'tl'], [b.x + b.width - s + 2, b.y - 2, 'tr'], [b.x - 2, b.y + b.height - s + 2, 'bl'], [b.x + b.width - s + 2, b.y + b.height - s + 2, 'br']]) {
      const b64 = (await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: s, height: s } })).toString('base64')
      tiles.push({ label: `${label} row ${idx + 1}/${n} ${k}`, b64 })
    }
    const st = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { boxShadow: cs.boxShadow, brand7: cs.boxShadow.includes('rgb(236, 84, 71)') } })
    const pad = 4
    const full = (await page.screenshot({ clip: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 } })).toString('base64')
    const p2 = await (await browser.newContext({ viewport: { width: 300, height: 200 } })).newPage()
    const px = await p2.evaluate(async ({ full, w, h, pad }) => {
      const img = new Image(); img.src = `data:image/png;base64,${full}`; await img.decode()
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0)
      const at = (x, y) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3)
      const mx = Math.round(w / 2), my = Math.round(h / 2)
      return { left: at(pad, my), right: at(pad + w - 1, my), top: at(mx, pad), bottom: at(mx, pad + h - 1) }
    }, { full, w: Math.round(b.width), h: Math.round(b.height), pad })
    await p2.context().close()
    const gray0 = [249, 250, 251]
    const sides = Object.fromEntries(Object.entries(px).map(([k, v]) => [k, { rgb: v, contrast: +contrast(v, gray0).toFixed(2) }]))
    c.focus.push({ row: idx + 1, ...st, sides, minContrast: Math.min(...Object.values(sides).map((q) => q.contrast)) })
  }
  await page.evaluate(() => document.activeElement?.blur()); await page.mouse.move(0, 0)
  const rows = await page.$$('[data-nav-row]')
  await rows[Math.min(1, n - 1)].hover(); await page.waitForTimeout(200)
  c.hover = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-nav-row]')]; const e = r.find((x) => x.matches(':hover')); const cs = getComputedStyle(e); return { boxShadow: cs.boxShadow, bg: cs.backgroundColor } })
  await page.mouse.move(0, 0)
  await rows[n - 1].click({ noWaitAfter: true }).catch(() => {}); await page.waitForTimeout(250)
  c.click = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { isRow: a.hasAttribute('data-nav-row'), focusVisible: a.matches(':focus-visible'), boxShadow: cs.boxShadow } })
  out.cases.push(c)
  await page.context().close()
}

await runCase('patterns-mantine-navrowlist--default', 1440, 'NavRowList Default 1440')
await runCase('patterns-mantine-listingpreviewdialogview--active', 1440, 'ListingPreviewDialogView Active 1440')
await runCase('patterns-mantine-listingpreviewdialogview--active', 390, 'ListingPreviewDialogView Active 390')

const html = `<body style="margin:8px;font:11px sans-serif;background:#fff;display:grid;grid-template-columns:repeat(4,150px);gap:8px">${tiles.map((t) => `<div>${t.label}<br><img src="data:image/png;base64,${t.b64}" style="image-rendering:pixelated;width:140px;border:1px solid #ccc"></div>`).join('')}</body>`
const sheet = await (await browser.newContext({ viewport: { width: 680, height: 600 } })).newPage(); await sheet.setContent(html); await sheet.waitForTimeout(400)
await sheet.screenshot({ path: `${EV}/132-navrow-corners-r10.png`, fullPage: true })
fs.writeFileSync(`${EV}/132-navrow-corners-r10.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close()
console.log(JSON.stringify({ ...out, cases: out.cases.map((c) => ({ label: c.label, rowCount: c.rowCount, list: c.list, rowsRadii: c.rows, focus: c.focus.map((f) => ({ row: f.row, brand7: f.brand7, minContrast: f.minContrast })), hover: c.hover, click: c.click })) }, null, 1))
