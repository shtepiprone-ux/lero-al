// Revision 6 AC23: computed Radio chrome per state (keyboard focus, error, disabled) + DPR-1 crops at 10x.
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
}).listen(6118)
const browser = await chromium.launch()
const out = {}
const crops = []
const snap = () => [...document.querySelectorAll('.mantine-Radio-radio')].map((el) => {
  const cs = getComputedStyle(el); const ic = el.parentElement.querySelector('.mantine-Radio-icon'); const ics = ic && getComputedStyle(ic); const ib = ic && ic.getBoundingClientRect(); const rb = el.getBoundingClientRect()
  return { checked: el.checked, disabled: el.disabled, error: el.hasAttribute('data-error'), size: [+rb.width.toFixed(1), +rb.height.toFixed(1)], bg: cs.backgroundColor, border: cs.borderColor, shadow: cs.boxShadow,
    icon: ic ? { color: ics.color, opacity: ics.opacity, size: [+ib.width.toFixed(1), +ib.height.toFixed(1)] } : null, rootOpacity: getComputedStyle(el.closest('.mantine-Radio-root')).opacity }
})
for (const id of ['mantine-primitives-radio--default', 'patterns-mantine-premiumdialogview--saving']) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 1000 } })).newPage()
  await page.goto(`http://127.0.0.1:6118/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('.mantine-Radio-radio', { timeout: 20000 }); await page.waitForTimeout(800)
  out[id] = { states: await page.evaluate(snap) }
  if (id.includes('radio--default')) {
    // keyboard focus on radio 3 (index 2), then radio 4 (index 3, error)
    const focusState = async (idx) => {
      await page.locator('.mantine-Radio-radio').nth(idx).focus()
      await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
      await page.waitForTimeout(250)
      const r = await page.evaluate((i) => { const el = document.querySelectorAll('.mantine-Radio-radio')[i]; const cs = getComputedStyle(el); return { active: document.activeElement === el, focusVisible: el.matches(':focus-visible'), border: cs.borderColor, shadow: cs.boxShadow } }, idx)
      return r
    }
    out[id].focusRadio3 = await focusState(2)
    out[id].focusRadio4Error = await focusState(3)
    // crops: all eight radios, keyboard focus applied to radio 3 for its crop
    const rs = await page.$$('.mantine-Radio-radio')
    for (let i = 0; i < rs.length; i++) {
      if (i === 2) { await focusState(2) }
      const b = await rs[i].boundingBox()
      crops.push([`default #${i + 1}${i === 2 ? ' (kbd focus)' : ''}`, (await page.screenshot({ clip: { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 } })).toString('base64')])
      if (i === 2) { await page.evaluate(() => document.activeElement && document.activeElement.blur()) }
    }
  } else {
    const rs = await page.$$('.mantine-Radio-radio')
    for (let i = 0; i < rs.length; i++) {
      const b = await rs[i].boundingBox()
      crops.push([`saving #${i + 1} (${await rs[i].isChecked() ? 'checked' : 'unchecked'})`, (await page.screenshot({ clip: { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 } })).toString('base64')])
    }
  }
  await page.context().close()
}
const html = `<body style="margin:12px;font:13px sans-serif;background:#fff;display:flex;flex-wrap:wrap;gap:16px">${crops.map(([n, x]) => `<div style="width:200px"><div>${n}</div><img src="data:image/png;base64,${x}" style="image-rendering:pixelated;width:200px"></div>`).join('')}</body>`
const p2 = await (await browser.newContext({ viewport: { width: 1000, height: 800 } })).newPage()
await p2.setContent(html); await p2.waitForTimeout(300)
await p2.screenshot({ path: `${EV}/107-radio-states-r6.png`, fullPage: true })
fs.writeFileSync(`${EV}/107-measurements-r6.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close()
console.log('ok')
