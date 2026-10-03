// Revision 5 measurements: GR-3e text-button stacking, GR-3b/3c overflow + font sizes, GR-3f radio size + DPR-1 crops.
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
}).listen(6116)
const url = (id, loc) => `http://127.0.0.1:6116/iframe.html?id=${id}&globals=locale:${loc}&viewMode=story`
const DIALOGS = [
  ...['active', 'sold-status-actions', 'hidden', 'delete-confirm', 'premium'].map((s) => `patterns-mantine-listingpreviewdialogview--${s}`),
  ...['not-premium', 'premium', 'custom-date', 'saving'].map((s) => `patterns-mantine-premiumdialogview--${s}`),
]
const browser = await chromium.launch()
const out = { dialogs: [], radio: [] }

for (const id of DIALOGS) for (const loc of ['sq', 'uk']) for (const w of [390, 1440]) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: 900 } })).newPage()
  await page.goto(url(id, loc))
  await page.waitForSelector('[role="dialog"]', { timeout: 20000 })
  await page.waitForTimeout(600)
  const r = await page.evaluate(() => {
    const vis = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 }
    const dlg = document.querySelector('[role="dialog"]')
    const text = [...dlg.querySelectorAll('button, a')].filter((el) => ['subtle', 'transparent'].includes(el.getAttribute('data-variant')) && vis(el) && el.textContent.trim())
      .map((el) => { const b = el.getBoundingClientRect(); return { label: el.textContent.trim(), top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left) } })
    const pairs = []
    for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) pairs.push({ a: text[i].label, b: text[j].label, shareRow: text[j].top < text[i].bottom && text[i].top < text[j].bottom })
    const fs = [...dlg.querySelectorAll('h1,h2,h3,h4,h5,h6,[class*="Modal-title"]')].map((e) => parseFloat(getComputedStyle(e).fontSize))
    return { textButtons: text, pairs, titleFs: fs, overflowX: document.documentElement.scrollWidth > window.innerWidth, dlgW: Math.round(dlg.getBoundingClientRect().width) }
  })
  out.dialogs.push({ id, loc, w, ...r })
  await page.context().close()
}

// Radio sizes + DPR-1 crops
const crops = []
for (const [id, loc, widths] of [['mantine-primitives-radio--default', 'sq', [320, 390, 1024, 1440]], ['patterns-mantine-premiumdialogview--not-premium', 'sq', [1440]]]) {
  for (const w of widths) {
    const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: 900 } })).newPage()
    await page.goto(url(id, loc))
    await page.waitForSelector('.mantine-Radio-radio', { timeout: 20000 })
    await page.waitForTimeout(600)
    const m = await page.evaluate(() => {
      const radios = [...document.querySelectorAll('.mantine-Radio-radio')]
      const checked = radios.find((r) => r.checked)
      const icon = checked && checked.parentElement.querySelector('.mantine-Radio-icon')
      const rb = (e) => { const b = e.getBoundingClientRect(); return [+b.width.toFixed(2), +b.height.toFixed(2)] }
      const fsz = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,body')].map((e) => parseFloat(getComputedStyle(e).fontSize))
      return { radio: rb(radios[0]), icon: icon ? rb(icon) : null, count: radios.length, overflowX: document.documentElement.scrollWidth > window.innerWidth, fs: fsz }
    })
    out.radio.push({ id, w, ...m })
    if (w === 1440) {
      const radios = await page.$$('.mantine-Radio-radio')
      if (id.includes('premiumdialogview')) await radios[0].check({ force: true }).catch(() => {})
      await page.waitForTimeout(300)
      const rs = await page.$$('.mantine-Radio-radio')
      const bufs = []
      let unchecked, checked
      for (const r of rs) { if (await r.isChecked()) checked ??= r; else unchecked ??= r }
      for (const r of [unchecked, checked].filter(Boolean)) {
        const b = await r.boundingBox()
        bufs.push((await page.screenshot({ clip: { x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 } })).toString('base64'))
      }
      crops.push([id.split('--')[0].split('-').pop() + ' ' + id.split('--')[1], bufs])
    }
    await page.context().close()
  }
}
const html = `<body style="margin:16px;font:14px sans-serif;background:#fff">${crops.map(([n, b]) => `<div style="display:flex;gap:24px;align-items:center;margin-bottom:12px"><div style="width:160px">${n} (unchecked, checked)</div>${b.map((x) => `<img src="data:image/png;base64,${x}" style="image-rendering:pixelated;width:260px">`).join('')}</div>`).join('')}</body>`
const p2 = await (await browser.newContext({ viewport: { width: 900, height: 700 } })).newPage()
await p2.setContent(html)
await p2.waitForTimeout(300)
await p2.screenshot({ path: `${EV}/103-radio-crops-r5.png`, fullPage: true })
fs.writeFileSync(`${EV}/103-measurements-r5.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close()
console.log('ok')
