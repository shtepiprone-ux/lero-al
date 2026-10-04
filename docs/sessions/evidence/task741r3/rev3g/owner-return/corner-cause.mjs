// Task 741 owner return — cause test for the notched corner. Same Chromium, DPR 1, 32×32 boxes with radius 8px:
// A fill + 1px border in the SAME colour (lero.al active pagination control), B fill only (TailAdmin active),
// C fill + 1px transparent border, D white fill + 1px gray-300 border (edge control), E as D at opacity 0.4 (Mantine
// disabled). Prints the diagonal coverage of the top-left corner for each.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const OUT = 'docs/sessions/evidence/task741r3/rev3g/owner-return/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 400, height: 80 }, deviceScaleFactor: 1 })
const box = 'width:32px;height:32px;box-sizing:border-box;border-radius:8px;position:absolute;top:20px;'
await page.setContent(`<body style="margin:0;background:#fff">
<div id=A style="${box}left:20px;background:#ec5447;border:1px solid #ec5447"></div>
<div id=B style="${box}left:80px;background:#ec5447"></div>
<div id=C style="${box}left:140px;background:#ec5447;border:1px solid transparent"></div>
<div id=D style="${box}left:200px;background:#fff;border:1px solid #d0d5dd"></div>
<div id=E style="${box}left:260px;background:#fff;border:1px solid #d0d5dd;opacity:.4"></div>
</body>`)
await page.screenshot({ path: OUT + 'corner-cause.png' })
const z = await browser.newPage({ viewport: { width: 4000, height: 800 } })
const png = await page.screenshot()
await z.setContent(`<body style="margin:0"><img src="data:image/png;base64,${png.toString('base64')}" style="width:4000px;image-rendering:pixelated"></body>`)
await z.screenshot({ path: OUT + 'corner-cause-10x.png' })
const res = await page.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const px = (x, y) => g.getImageData(x, y, 1, 1).data
  const out = {}
  for (const [id, x0, ref] of [['A', 20, [236, 84, 71]], ['B', 80, [236, 84, 71]], ['C', 140, [236, 84, 71]], ['D', 200, [208, 213, 221]], ['E', 260, [208, 213, 221]]]) {
    const cov = p => Math.round(100 * [0, 1, 2].map(i => (255 - p[i]) / ((255 - ref[i]) || 1)).reduce((a, b) => a + b) / 3)
    out[id] = { diag: [[3, 1], [2, 2], [1, 3]].map(([x, y]) => cov(px(x0 + x, 20 + y))), row0: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(x => cov(px(x0 + x, 20))) }
  }
  return out
}, png.toString('base64'))
await browser.close()
await writeFile(OUT + 'corner-cause.json', JSON.stringify(res, null, 1) + '\n')
console.log('ideal 8px radius: diag 60 75 60; row0 0 0 0 0 19 59 86 98 100')
for (const [k, v] of Object.entries(res)) console.log(k, 'diag', v.diag.join(' '), '| row0', v.row0.join(' '))
