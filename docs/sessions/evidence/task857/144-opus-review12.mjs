// Task 857 review 12 (Opus) — independent re-measure of AC38 (nav row corners) and AC43 (table header line at the
// card's top corners) on the final storybook-static, sq, 1440, DPR 1. Writes 144-opus-review12.{json,png}.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6144)
const URL = (id) => `http://127.0.0.1:6144/iframe.html?id=${id}&globals=locale:sq&viewMode=story`
const browser = await chromium.launch()
const decoder = await (await browser.newContext()).newPage()
async function pixels(b64) {
  return decoder.evaluate(async (src) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height).data; const rows = []
    for (let y = 0; y < c.height; y++) rows.push([d[y * c.width * 4], d[y * c.width * 4 + 1], d[y * c.width * 4 + 2]])
    return rows
  }, b64)
}
const out = { platform: `${process.platform} ${process.version}`, nav: {}, tables: {} }
const panels = []
// AC38 — NavRowList Default: Tab onto row 1, then onto the last row.
{
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(URL('patterns-mantine-navrowlist--default')); await page.waitForSelector('[data-nav-row]'); await page.waitForTimeout(800)
  const n = await page.locator('[data-nav-row]').count()
  out.nav.rowCount = n
  out.nav.rows = await page.evaluate(() => [...document.querySelectorAll('[data-nav-row]')].map((e) => { const c = getComputedStyle(e); return [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius] }))
  out.nav.listRadius = await page.evaluate(() => getComputedStyle(document.querySelector('[data-nav-row]').parentElement.closest('.mantine-Paper-root')).borderRadius)
  out.nav.focus = []
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab')
    const st = await page.evaluate(() => { const a = document.activeElement; const c = getComputedStyle(a); const r = a.getBoundingClientRect(); return { isRow: a.hasAttribute('data-nav-row'), fv: a.matches(':focus-visible'), shadow: c.boxShadow, rect: [r.left, r.top, r.right, r.bottom] } })
    out.nav.focus.push(st)
    if (i === 0 || i === n - 1) {
      const [l, t, r, b] = st.rect; const s = 14
      const corners = i === 0 ? [[l - 2, t - 2, 'tl'], [r - s + 2, t - 2, 'tr']] : [[l - 2, b - s + 2, 'bl'], [r - s + 2, b - s + 2, 'br']]
      for (const [x, y, c] of corners) panels.push({ n: `NavRowList row ${i + 1} ${c}`, b64: (await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: s, height: s } })).toString('base64') })
    }
  }
  await page.close()
}
// AC43 — the three table Stories: thead top line and the pixels under the card's top border.
for (const id of ['patterns-mantine-admintable--default', 'patterns-mantine-adminlistingsview--default', 'mantine-primitives-table--default']) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(URL(id)); await page.waitForSelector('table.mantine-Table-table'); await page.waitForTimeout(1200)
  const info = await page.evaluate(() => {
    const th = [...document.querySelectorAll('table.mantine-Table-table thead')].find((e) => e.getBoundingClientRect().width > 0)
    const paper = th.closest('.mantine-Paper-root'); const pc = getComputedStyle(paper); const tc = getComputedStyle(th)
    const pr = paper.getBoundingClientRect(); const tr = th.getBoundingClientRect()
    return { paperRadius: pc.borderRadius, paperOverflow: pc.overflow, theadBorderTop: tc.borderTopWidth + ' ' + tc.borderTopStyle, theadBorderBottom: tc.borderBottomWidth + ' ' + tc.borderBottomStyle, collapse: getComputedStyle(th.closest('table')).borderCollapse, flush: Math.abs(tr.top - pr.top - 1) <= 1, paperRect: [pr.left, pr.top, pr.right, pr.bottom] }
  })
  const [l, t, r] = info.paperRect
  // A 1px column at the card's horizontal centre, from 2px above the card to 6px below its top edge.
  info.centreColumn = await pixels((await page.screenshot({ clip: { x: Math.round((l + r) / 2), y: Math.round(t) - 2, width: 1, height: 8 } })).toString('base64'))
  out.tables[id] = info
  const s = 24
  for (const [x, y, c] of [[l - 2, t - 2, 'tl'], [r - s + 2, t - 2, 'tr']]) panels.push({ n: `${id.replace('patterns-mantine-', '').replace('mantine-primitives-', 'primitives-')} ${c}`, b64: (await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: s, height: s } })).toString('base64') })
  await page.close()
}
const html = `<body style="margin:8px;font:12px sans-serif;background:#fff;display:flex;flex-wrap:wrap;gap:10px">${panels.map((c) => `<div>${c.n}<br><img src="data:image/png;base64,${c.b64}" style="image-rendering:pixelated;width:${c.n.startsWith('Nav') ? 140 : 240}px"></div>`).join('')}</body>`
const p3 = await (await browser.newContext({ viewport: { width: 1100, height: 600 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
await p3.screenshot({ path: `${EV}/144-opus-review12.png`, fullPage: true })
fs.writeFileSync(`${EV}/144-opus-review12.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close(); console.log(JSON.stringify(out, null, 1))
