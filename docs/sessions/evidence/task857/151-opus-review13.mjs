// Task 857 review 13 (Opus) — independent re-measure of AC46 on the final storybook-static: every header cell's
// background in the four table Stories (sq, 1440), and the sticky header cell after scrolling StickyColumn sideways at
// 1024 (still sticky, opaque white, on top). Writes 151-opus-review13.{json,png}.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6151)
const URL = (id) => `http://127.0.0.1:6151/iframe.html?id=${id}&globals=locale:sq&viewMode=story`
const browser = await chromium.launch()
const out = { platform: `${process.platform} ${process.version}`, header: {}, scroll: null }
const shots = []
for (const id of ['patterns-mantine-adminlistingsview--default', 'patterns-mantine-admintable--default', 'mantine-primitives-table--default', 'mantine-primitives-table--sticky-column']) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(URL(id)); await page.waitForSelector('table.mantine-Table-table'); await page.waitForTimeout(1000)
  out.header[id] = await page.evaluate(() => {
    const th = [...document.querySelectorAll('table.mantine-Table-table thead')].find((e) => e.getBoundingClientRect().width > 0)
    return [...th.querySelectorAll('th')].map((c) => ({ text: c.textContent.trim().slice(0, 16), bg: getComputedStyle(c).backgroundColor, sticky: getComputedStyle(c).position === 'sticky' }))
  })
  if (id === 'patterns-mantine-adminlistingsview--default') {
    const box = await page.evaluate(() => { const r = [...document.querySelectorAll('table.mantine-Table-table thead')].find((e) => e.getBoundingClientRect().width > 0).getBoundingClientRect(); return [r.left, r.top, r.width, r.height] })
    shots.push({ n: 'AdminListingsView 1440 header', b64: (await page.screenshot({ clip: { x: box[0], y: box[1], width: Math.min(box[2], 1100), height: box[3] } })).toString('base64') })
  }
  await page.close()
}
{
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1024, height: 800 } })).newPage()
  await page.goto(URL('mantine-primitives-table--sticky-column')); await page.waitForSelector('table.mantine-Table-table'); await page.waitForTimeout(1000)
  out.scroll = await page.evaluate(async () => {
    const t = [...document.querySelectorAll('table.mantine-Table-table')].find((e) => e.getBoundingClientRect().width > 0)
    const vp = t.closest('.mantine-ScrollArea-viewport')
    const before = { scrollWidth: vp.scrollWidth, clientWidth: vp.clientWidth }
    vp.scrollLeft = vp.scrollWidth
    await new Promise((r) => setTimeout(r, 300))
    const th = t.querySelector('thead th'); const r = th.getBoundingClientRect(); const vr = vp.getBoundingClientRect()
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return { ...before, scrollLeft: vp.scrollLeft, thText: th.textContent.trim(), thLeftMinusViewport: r.left - vr.left, thBg: getComputedStyle(th).backgroundColor, topIsTh: top === th || th.contains(top) }
  })
  const box = await page.evaluate(() => { const t = [...document.querySelectorAll('table.mantine-Table-table')].find((e) => e.getBoundingClientRect().width > 0); const r = t.closest('.mantine-ScrollArea-viewport').getBoundingClientRect(); return [r.left, r.top, r.width] })
  shots.push({ n: 'StickyColumn 1024 scrolled', b64: (await page.screenshot({ clip: { x: box[0], y: box[1], width: box[2], height: 120 } })).toString('base64') })
  await page.close()
}
const html = `<body style="margin:8px;font:12px sans-serif;background:#ddd">${shots.map((c) => `<div style="margin-bottom:10px">${c.n}<br><img src="data:image/png;base64,${c.b64}"></div>`).join('')}</body>`
const p3 = await (await browser.newContext({ viewport: { width: 1140, height: 400 } })).newPage(); await p3.setContent(html); await p3.waitForTimeout(300)
await p3.screenshot({ path: `${EV}/151-opus-review13.png`, fullPage: true })
fs.writeFileSync(`${EV}/151-opus-review13.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close(); console.log(JSON.stringify(out))
