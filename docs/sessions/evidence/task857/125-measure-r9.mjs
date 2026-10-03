// Revision 9: AC35 (nav row keyboard focus = brand border + ring, contrast >= 3:1) and AC37 (Story status select follows the choice).
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
}).listen(6125)
const browser = await chromium.launch()
const url = (id, loc) => `http://127.0.0.1:6125/iframe.html?id=${id}&globals=locale:${loc}&viewMode=story`
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
const out = { ac35: null, ac37: null }

// ── AC35
{
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(url('patterns-mantine-navrowlist--default', 'sq')); await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(800)
  const rows = await page.$$('[data-nav-row]')
  // hover row 2: only the gray-0 background, no shadow
  await rows[1].hover(); await page.waitForTimeout(250)
  const hover = await page.evaluate(() => { const r = document.querySelectorAll('[data-nav-row]')[1]; const cs = getComputedStyle(r); return { boxShadow: cs.boxShadow, bg: cs.backgroundColor } })
  await page.mouse.move(2, 2)
  // keyboard: Tab onto row 1
  await page.keyboard.press('Tab'); await page.waitForTimeout(300)
  const kbd = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { isRow: a.hasAttribute('data-nav-row'), focusVisible: a.matches(':focus-visible'), boxShadow: cs.boxShadow, bg: cs.backgroundColor } })
  const b = await rows[0].boundingBox()
  const pad = 6
  const png = await page.screenshot({ clip: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 } })
  const b64 = png.toString('base64')
  // pixels of the 1px line on the four sides of the row (row box starts at index pad), read through a canvas
  const p2 = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage()
  const px = await p2.evaluate(async ({ b64, w, h, pad }) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const at = (x, y) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3)
    const midX = Math.round(w / 2), midY = Math.round(h / 2)
    return { left: at(pad, midY), right: at(pad + w - 1, midY), top: at(midX, pad), bottom: at(midX, pad + h - 1), interior: at(midX, midY), width: img.width, height: img.height }
  }, { b64, w: Math.round(b.width), h: Math.round(b.height), pad })
  const gray0 = [249, 250, 251]
  const sides = Object.fromEntries(['left', 'right', 'top', 'bottom'].map(k => [k, { rgb: px[k], contrastVsGray0: +contrast(px[k], gray0).toFixed(2) }]))
  // 10x pixelated crop of the row's left-top corner region
  const cropCorner = (await page.screenshot({ clip: { x: b.x - 4, y: b.y - 4, width: 40, height: 24 } })).toString('base64')
  // mouse click on row 3: no brand line
  await page.evaluate(() => document.activeElement?.blur())
  await rows[2].click({ noWaitAfter: true }); await page.waitForTimeout(250)
  const mouse = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { isRow: a.hasAttribute('data-nav-row'), focusVisible: a.matches(':focus-visible'), boxShadow: cs.boxShadow } })
  out.ac35 = { hover, keyboard: kbd, brand7InShadow: kbd.boxShadow.includes('rgb(236, 84, 71)'), sides, minContrast: Math.min(...Object.values(sides).map(s => s.contrastVsGray0)), mouse }
  const html = `<body style="margin:12px;font:13px sans-serif;background:#fff"><div>nav row 1 keyboard Tab: full row (2x) and its top-left corner (10x), DPR 1, pixelated</div><img src="data:image/png;base64,${b64}" style="image-rendering:pixelated;width:${Math.round((b.width + pad * 2) * 1.3)}px"><br><br><img src="data:image/png;base64,${cropCorner}" style="image-rendering:pixelated;width:400px"></body>`
  const p3 = await (await browser.newContext({ viewport: { width: 1000, height: 480 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
  await p3.screenshot({ path: `${EV}/125-navrow-focus-r9.png`, fullPage: true })
}

// ── AC37
{
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(url('patterns-mantine-listingpreviewdialogview--active', 'sq')); await page.waitForSelector('[role=dialog]'); await page.waitForTimeout(1200)
  const dialog = page.locator('[role=dialog]')
  const sel = dialog.getByRole('textbox', { name: 'Statusi' })
  const before = await sel.inputValue()
  await sel.click(); await page.getByRole('option', { name: 'Shitur' }).click()
  await page.waitForTimeout(1200)
  const after = await dialog.getByRole('textbox', { name: 'Statusi' }).inputValue()
  const toast = await page.getByText('Statusi u përditësua').count()
  out.ac37 = { before, after, toastCount: toast }
  await page.screenshot({ path: `${EV}/129-story-status-r9.png` })
}
fs.writeFileSync(`${EV}/125-navrow-focus-r9.json`, JSON.stringify(out.ac35, null, 2))
fs.writeFileSync(`${EV}/129-story-status-r9.json`, JSON.stringify(out.ac37, null, 2))
await browser.close(); server.close()
console.log(JSON.stringify(out, null, 1))
