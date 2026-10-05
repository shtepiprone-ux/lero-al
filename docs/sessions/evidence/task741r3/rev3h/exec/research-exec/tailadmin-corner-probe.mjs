// Task 741 — owner return of O46-3 rows 3–4: the same corner crops of TailAdmin's live /pagination controls (the
// visual source of truth) at deviceScaleFactor 1, 1.25, 1.5 and 2, for a side-by-side with corner-probe.mjs.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const OUT = 'docs/sessions/evidence/task741r3/rev3h/exec/research-exec/'
const browser = await chromium.launch()
const out = {}
for (const dpr of [1, 1.25]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr })
  await page.goto('https://demo.tailadmin.com/pagination', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null)
  await page.waitForFunction(() => [...document.querySelectorAll('button, a')].some(b => b.textContent.trim() === 'Previous'), null, { timeout: 30000 })
  await page.waitForTimeout(1000)
  const info = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const btns = [...document.querySelectorAll('button, a')].filter(vis)
    const prev = btns.find(b => b.textContent.trim() === 'Previous')
    const active = btns.find(b => b.textContent.trim() === '1')
    const r = {}
    for (const [n, el] of Object.entries({ edge: prev, active })) { const q = el.getBoundingClientRect(), s = getComputedStyle(el); r[n] = { x: q.x, y: q.y, w: q.width, h: q.height, radius: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, bg: s.backgroundColor, boxShadow: s.boxShadow } }
    return r
  })
  out[dpr] = info
  for (const n of ['edge', 'active']) {
    const q = info[n]
    // the left 44px of the control (a corner pair), so the crop is comparable with a 32/44px lero.al control
    const clip = { x: Math.floor(q.x - 4), y: Math.floor(q.y - 4), width: Math.min(52, Math.ceil(q.w + 8)), height: Math.ceil(q.h + 8) }
    const png = await page.screenshot({ clip })
    const f = `crops/tailadmin-1440-dpr${dpr}-${n}`
    await writeFile(OUT + f + '.png', png)
    const z = await browser.newPage({ viewport: { width: Math.ceil(clip.width * dpr * 10), height: Math.ceil(clip.height * dpr * 10) } })
    await z.setContent(`<body style="margin:0"><img src="data:image/png;base64,${png.toString('base64')}" style="width:${Math.ceil(clip.width * dpr * 10)}px;image-rendering:pixelated"></body>`)
    await z.screenshot({ path: OUT + f + '-10x.png' }); await z.close()
  }
  await page.close()
}
await browser.close()
await writeFile(OUT + 'tailadmin-corner-probe.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
